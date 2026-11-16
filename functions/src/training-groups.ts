/* eslint-disable max-len */
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Training Groups: add members to a group, or withdraw them.
 *
 *   organizations/{id}/trainingGroups/{groupId}                 memberCount kept here
 *   organizations/{id}/trainingGroups/{groupId}/members/{uid}   the roster
 *   organizations/{id}/trainingGroupEnrollments/{uid}            { groupIds } per person
 *
 * The roster and the per-person index are written only here, in one
 * transaction, so the capacity holds and the two never disagree.
 *
 * Group courses (manageTrainingGroupCourses):
 *
 *   organizations/{id}/trainingGroups/{groupId}/courses/{courseId[__lessonId]}
 *
 * Each becomes an ordinary course assignment for every member
 * (organizations/{id}/courseAssignments/{uid}__{courseId}[__{lessonId}])
 * with trainingGroupIds listing the groups it came from. People who join
 * later get the group's courses; people who leave lose the ones they haven't
 * finished (progress and certificates are never touched). An assignment
 * made by hand (no trainingGroupIds) is left alone.
 *
 * Who: platform administrators, organization owners and admins, and
 * managers who lead the group (leadIds).
 */

const REGION = "us-central1";
const MAX_PEOPLE_PER_CALL = 100;

const DAY = 24 * 60 * 60 * 1000;
const LOCKED_MESSAGE = "This group has ended and is locked. An organization admin can reopen it.";

/** Ended (the whole end day counts) and not reopened by an admin. Same as firestore.rules. */
function isLocked(group: FirebaseFirestore.DocumentSnapshot, now = Date.now()): boolean {
  const end = group.get("endDate");
  return !group.get("manualStatus") &&
    end instanceof Timestamp &&
    now >= end.toMillis() + DAY &&
    group.get("reopened") !== true;
}

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

export const manageTrainingGroupMembers = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to manage training groups.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  const groupId = clean(data.groupId);
  const action = data.action === "remove" ? "remove" : "add";
  const userIds = Array.isArray(data.userIds) ?
    [...new Set(data.userIds.map(clean).filter((id) => id && !id.includes("/")))] :
    [];

  if (!organizationId || !groupId || organizationId.includes("/") || groupId.includes("/")) {
    throw new HttpsError("invalid-argument", "A training group is required.");
  }
  if (!userIds.length) {
    throw new HttpsError("invalid-argument", "Choose at least one person.");
  }
  if (userIds.length > MAX_PEOPLE_PER_CALL) {
    throw new HttpsError("invalid-argument", `Add or withdraw at most ${MAX_PEOPLE_PER_CALL} people at a time.`);
  }

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const groupRef = organizationRef.collection("trainingGroups").doc(groupId);

  const [callerMembership, entitlement, isAdmin] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("training-groups").get(),
    isPlatformAdministrator(request),
  ]);

  if (entitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have Training Groups.");
  }

  const callerRank = callerMembership.get("active") === true ? ROLE_RANK[clean(callerMembership.get("role"))] ?? 0 : 0;

  // People being added must be active members of the organization.
  const memberships = action === "add" ?
    await db.getAll(...userIds.map((id) => db.doc(`organizationMemberships/${id}_${organizationId}`))) :
    [];
  const notMembers = memberships.filter((membership) => membership.get("active") !== true);
  // Names and emails for the roster (membership, then profile, then sign-in account).
  const people = action === "add" && !notMembers.length ? await resolvePeople(userIds, memberships) : new Map<string, Person>();
  if (notMembers.length) {
    throw new HttpsError("failed-precondition", "Only active members of the organization can join a training group.");
  }

  const result = await db.runTransaction(async (transaction) => {
    const group = await transaction.get(groupRef);
    if (!group.exists) {
      throw new HttpsError("not-found", "This training group no longer exists.");
    }

    const leadIds = (group.get("leadIds") as string[] | undefined) ?? [];
    const canManage = isAdmin || callerRank >= 4 || (callerRank >= 3 && leadIds.includes(uid));
    if (!canManage) {
      throw new HttpsError("permission-denied", "Only organization admins, owners and this group's leads can change its members.");
    }
    if (isLocked(group)) {
      throw new HttpsError("failed-precondition", LOCKED_MESSAGE);
    }

    const memberRefs = userIds.map((id) => groupRef.collection("members").doc(id));
    const existing = await Promise.all(memberRefs.map((ref) => transaction.get(ref)));
    const count = Number(group.get("memberCount") ?? 0);

    if (action === "remove") {
      const leaving = userIds.filter((_, index) => existing[index].exists);
      leaving.forEach((id) => {
        transaction.delete(groupRef.collection("members").doc(id));
        transaction.set(
          organizationRef.collection("trainingGroupEnrollments").doc(id),
          { userId: id, groupIds: FieldValue.arrayRemove(groupId), updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      });
      const memberCount = Math.max(0, count - leaving.length);
      transaction.update(groupRef, { memberCount, updatedAt: FieldValue.serverTimestamp() });
      return { changed: leaving.length, memberCount, changedIds: leaving, names: [] as [string, string][] };
    }

    if (group.get("manualStatus") === "cancelled") {
      throw new HttpsError("failed-precondition", "This training group was cancelled.");
    }

    const joining = userIds
      .map((id, index) => ({ id, index }))
      .filter(({ index }) => !existing[index].exists);

    const capacity = Number(group.get("capacity") ?? 0);
    if (capacity > 0 && count + joining.length > capacity) {
      const left = Math.max(0, capacity - count);
      throw new HttpsError(
        "resource-exhausted",
        left ? `Only ${left} more ${left === 1 ? "person fits" : "people fit"} in this group (capacity ${capacity}).` : `This group is full (capacity ${capacity}).`,
      );
    }

    joining.forEach(({ id }) => {
      transaction.set(groupRef.collection("members").doc(id), {
        userId: id,
        organizationId,
        groupId,
        name: people.get(id)?.name || "Member",
        email: people.get(id)?.email || null,
        enrolledAt: FieldValue.serverTimestamp(),
        enrolledBy: uid,
      });
      transaction.set(
        organizationRef.collection("trainingGroupEnrollments").doc(id),
        { userId: id, organizationId, groupIds: FieldValue.arrayUnion(groupId), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    });

    const memberCount = count + joining.length;
    transaction.update(groupRef, { memberCount, updatedAt: FieldValue.serverTimestamp() });
    return {
      changed: joining.length,
      memberCount,
      changedIds: joining.map(({ id }) => id),
      names: joining.map(({ id }) => [id, people.get(id)?.name || "Member"] as [string, string]),
    };
  });

  // Group courses follow the roster (outside the transaction: many writes).
  let assignmentsChanged = 0;
  if (result.changedIds.length) {
    try {
      const courses = await groupRef.collection("courses").get();
      for (const course of courses.docs) {
        assignmentsChanged += action === "add" ?
          await assignToPeople(organizationRef, groupId, course.data(), new Map<string, string>(result.names)) :
          await detachFromPeople(organizationRef, groupId, course.data(), result.changedIds);
      }
    } catch (error) {
      logger.error("Could not update group course assignments.", { organizationId, groupId, action, error });
      throw new HttpsError("internal", "Members were changed, but their group courses could not be updated. Try again.");
    }
  }

  logger.info("Training group members changed.", { organizationId, groupId, action, changed: result.changed, assignmentsChanged });

  return { changed: result.changed, memberCount: result.memberCount };
});

// ============================================================
// GROUP COURSES
// ============================================================

/**
 * Assign a course (or one lesson) to a whole group, change its due date,
 * required flag or note, or take it off the group.
 *
 * { organizationId, groupId, action: 'assign' | 'update' | 'remove',
 *   courseId, lessonId?, dueAt? (ms or null), required?, note? }
 */
export const manageTrainingGroupCourses = onCall({ region: REGION, timeoutSeconds: 120 }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to manage training groups.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  const groupId = clean(data.groupId);
  const action = data.action === "remove" ? "remove" : data.action === "update" ? "update" : "assign";
  const courseId = clean(data.courseId);
  const lessonId = clean(data.lessonId) || null;
  const idPattern = /^[A-Za-z0-9_-]{1,128}$/;

  if (!organizationId || !groupId || organizationId.includes("/") || groupId.includes("/")) {
    throw new HttpsError("invalid-argument", "A training group is required.");
  }
  if (!idPattern.test(courseId) || (lessonId && !idPattern.test(lessonId))) {
    throw new HttpsError("invalid-argument", "Choose a course.");
  }

  const dueAtMs = typeof data.dueAt === "number" && Number.isFinite(data.dueAt) ? data.dueAt : null;
  const required = data.required !== false;
  const note = clean(data.note).slice(0, 500);

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const groupRef = organizationRef.collection("trainingGroups").doc(groupId);
  const key = lessonId ? `${courseId}__${lessonId}` : courseId;
  const groupCourseRef = groupRef.collection("courses").doc(key);

  const [callerMembership, groupsEntitlement, coursesEntitlement, isAdmin, group] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("training-groups").get(),
    organizationRef.collection("applications").doc("courses").get(),
    isPlatformAdministrator(request),
    groupRef.get(),
  ]);

  if (groupsEntitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have Training Groups.");
  }
  if (coursesEntitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have Courses.");
  }
  if (!group.exists) {
    throw new HttpsError("not-found", "This training group no longer exists.");
  }

  const callerRank = callerMembership.get("active") === true ? ROLE_RANK[clean(callerMembership.get("role"))] ?? 0 : 0;
  const leadIds = (group.get("leadIds") as string[] | undefined) ?? [];
  if (!(isAdmin || callerRank >= 4 || (callerRank >= 3 && leadIds.includes(uid)))) {
    throw new HttpsError("permission-denied", "Only organization admins, owners and this group's leads can assign courses to it.");
  }
  if (isLocked(group)) {
    throw new HttpsError("failed-precondition", LOCKED_MESSAGE);
  }

  const members = await groupRef.collection("members").get();
  const memberIds = members.docs.map((document) => document.id);
  const existing = await groupCourseRef.get();
  let changed = 0;

  if (action === "remove") {
    if (!existing.exists) {
      return { changed: 0 };
    }
    changed = await detachFromPeople(organizationRef, groupId, existing.data() ?? {}, memberIds);
    await groupCourseRef.delete();
  } else if (action === "update") {
    if (!existing.exists) {
      throw new HttpsError("not-found", "This course is no longer assigned to the group.");
    }
    const fields = {
      dueAt: dueAtMs === null ? null : Timestamp.fromMillis(dueAtMs),
      required,
      note,
    };
    await groupCourseRef.update({ ...fields, updatedAt: FieldValue.serverTimestamp() });
    changed = await updateForPeople(organizationRef, groupId, existing.data() ?? {}, memberIds, fields);
  } else {
    if (group.get("manualStatus") === "cancelled") {
      throw new HttpsError("failed-precondition", "This training group was cancelled.");
    }
    if (existing.exists) {
      throw new HttpsError("already-exists", "This course is already assigned to the group. Change it instead.");
    }

    const course = await organizationRef.collection("courses").doc(courseId).get();
    if (!course.exists || course.get("status") !== "published") {
      throw new HttpsError("failed-precondition", "Only published courses of your organization can be assigned.");
    }

    let lessonTitle: string | null = null;
    if (lessonId) {
      const lesson = await course.ref.collection("lessons").doc(lessonId).get();
      if (!lesson.exists) {
        throw new HttpsError("not-found", "This lesson no longer exists.");
      }
      lessonTitle = clean(lesson.get("title")).slice(0, 200) || "Lesson";
    }

    const groupCourse = {
      organizationId,
      groupId,
      courseId,
      courseTitle: (clean(course.get("title")) || courseId).slice(0, 200),
      cover: (clean(course.get("cover")) || "teal").slice(0, 20),
      lessonId,
      lessonTitle,
      dueAt: dueAtMs === null ? null : Timestamp.fromMillis(dueAtMs),
      required,
      note,
      assignedBy: uid,
      assignedByName: (clean(callerMembership.get("displayName")) || clean(request.auth?.token?.name) || clean(request.auth?.token?.email)).slice(0, 120),
      assignedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await groupCourseRef.set(groupCourse);

    const names = new Map<string, string>(members.docs.map((document) => [document.id, clean(document.get("name")) || "Member"] as [string, string]));
    changed = await assignToPeople(organizationRef, groupId, groupCourse, names);
  }

  logger.info("Training group course changed.", { organizationId, groupId, action, courseId, lessonId, changed });
  return { changed };
});

type Ref = FirebaseFirestore.DocumentReference;
type Data = FirebaseFirestore.DocumentData;
const BATCH = 400;

function assignmentRef(organizationRef: Ref, userId: string, course: Data): Ref {
  const courseId = clean(course.courseId);
  const lessonId = clean(course.lessonId) || null;
  return organizationRef.collection("courseAssignments").doc(lessonId ? `${userId}__${courseId}__${lessonId}` : `${userId}__${courseId}`);
}

/** Read documents in slices (getAll takes many refs, but keep requests modest). */
async function readAll(refs: Ref[]): Promise<FirebaseFirestore.DocumentSnapshot[]> {
  const db = getFirestore();
  const out: FirebaseFirestore.DocumentSnapshot[] = [];
  for (let index = 0; index < refs.length; index += BATCH) {
    out.push(...await db.getAll(...refs.slice(index, index + BATCH)));
  }
  return out;
}

async function commitInBatches(writes: ((batch: FirebaseFirestore.WriteBatch) => void)[]): Promise<void> {
  const db = getFirestore();
  for (let index = 0; index < writes.length; index += BATCH) {
    const batch = db.batch();
    writes.slice(index, index + BATCH).forEach((write) => write(batch));
    await batch.commit();
  }
}

function groupIdsOf(snapshot: FirebaseFirestore.DocumentSnapshot): string[] | null {
  const value = snapshot.get("trainingGroupIds");
  return Array.isArray(value) ? value.map(String) : null;
}

/** Give the course to these people; an assignment made by hand is left as it is. */
async function assignToPeople(organizationRef: Ref, groupId: string, course: Data, names: Map<string, string>): Promise<number> {
  const userIds = [...names.keys()];
  if (!userIds.length) {
    return 0;
  }
  const refs = userIds.map((id) => assignmentRef(organizationRef, id, course));
  const snapshots = await readAll(refs);
  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];

  snapshots.forEach((snapshot, index) => {
    const ref = refs[index];
    const userId = userIds[index];
    if (!snapshot.exists) {
      writes.push((batch) => batch.set(ref, {
        organizationId: organizationRef.id,
        userId,
        userName: (names.get(userId) || "Member").slice(0, 120),
        courseId: clean(course.courseId),
        courseTitle: clean(course.courseTitle),
        cover: clean(course.cover) || "teal",
        lessonId: clean(course.lessonId) || null,
        lessonTitle: clean(course.lessonTitle) || null,
        dueAt: course.dueAt ?? null,
        required: course.required !== false,
        note: clean(course.note),
        assignedBy: clean(course.assignedBy),
        assignedByName: clean(course.assignedByName),
        assignedAt: FieldValue.serverTimestamp(),
        trainingGroupIds: [groupId],
      }));
    } else if (groupIdsOf(snapshot) && !(groupIdsOf(snapshot) ?? []).includes(groupId)) {
      writes.push((batch) => batch.update(ref, { trainingGroupIds: FieldValue.arrayUnion(groupId) }));
    }
  });

  await commitInBatches(writes);
  return writes.length;
}

/** New due date, required flag or note for the assignments that came from this group. */
async function updateForPeople(organizationRef: Ref, groupId: string, course: Data, userIds: string[], fields: Data): Promise<number> {
  const refs = userIds.map((id) => assignmentRef(organizationRef, id, course));
  const snapshots = await readAll(refs);
  const writes = snapshots
    .map((snapshot, index) => ({ snapshot, ref: refs[index] }))
    .filter(({ snapshot }) => snapshot.exists && !!groupIdsOf(snapshot)?.includes(groupId))
    .map(({ ref }) => (batch: FirebaseFirestore.WriteBatch) => batch.update(ref, fields));
  await commitInBatches(writes);
  return writes.length;
}

/**
 * Take the group's course away from these people. An assignment another
 * group still gives stays; a finished one stays (it's their record);
 * otherwise it is removed.
 */
async function detachFromPeople(organizationRef: Ref, groupId: string, course: Data, userIds: string[]): Promise<number> {
  if (!userIds.length) {
    return 0;
  }
  const db = getFirestore();
  const courseId = clean(course.courseId);
  const lessonId = clean(course.lessonId) || null;
  const progressId = `${organizationRef.id}__${courseId}`;

  const refs = userIds.map((id) => assignmentRef(organizationRef, id, course));
  const snapshots = await readAll(refs);
  const linked = snapshots
    .map((snapshot, index) => ({ snapshot, ref: refs[index], userId: userIds[index] }))
    .filter(({ snapshot }) => snapshot.exists && !!groupIdsOf(snapshot)?.includes(groupId));

  const lonely = linked.filter(({ snapshot }) => (groupIdsOf(snapshot) ?? []).length === 1);
  const [progress, exams] = await Promise.all([
    readAll(lonely.map(({ userId }) => db.doc(`users/${userId}/courseProgress/${progressId}`))),
    lessonId ? Promise.resolve([]) : readAll(lonely.map(({ userId }) => db.doc(`users/${userId}/courseExams/${progressId}`))),
  ]);
  const finished = new Set<string>();
  lonely.forEach(({ userId }, index) => {
    const record = progress[index];
    if (!record?.exists) {
      return;
    }
    const done = lessonId ?
      ((record.get("completedLessonIds") as unknown[] | undefined) ?? []).map(String).includes(lessonId) :
      record.get("status") === "completed" && (record.get("finalExam") !== true || exams[index]?.get("passed") === true);
    if (done) {
      finished.add(userId);
    }
  });

  const writes = linked.map(({ snapshot, ref, userId }) => {
    const others = (groupIdsOf(snapshot) ?? []).length > 1;
    return others || finished.has(userId) ?
      (batch: FirebaseFirestore.WriteBatch) => batch.update(ref, { trainingGroupIds: FieldValue.arrayRemove(groupId) }) :
      (batch: FirebaseFirestore.WriteBatch) => batch.delete(ref);
  });
  await commitInBatches(writes);
  return writes.length;
}

interface Person {
  name: string;
  email: string | null;
}

/**
 * Names like the member directory finds them: the membership first, then
 * the Zebron profile, then the sign-in account. memberships are in userIds order.
 */
async function resolvePeople(userIds: string[], memberships: FirebaseFirestore.DocumentSnapshot[]): Promise<Map<string, Person>> {
  const db = getFirestore();
  const people = new Map<string, { name: string; email: string }>(
    userIds.map((id, index) => [id, { name: clean(memberships[index]?.get("displayName")), email: clean(memberships[index]?.get("email")) }]),
  );

  const profiles = await db.getAll(...userIds.map((id) => db.collection("users").doc(id)));
  profiles.forEach((profile) => {
    const person = people.get(profile.id);
    if (!person || !profile.exists) {
      return;
    }
    const fullName = [clean(profile.get("firstName")), clean(profile.get("lastName"))].filter(Boolean).join(" ");
    person.name = person.name || clean(profile.get("displayName")) || fullName || clean(profile.get("name"));
    person.email = person.email || clean(profile.get("email"));
  });

  const missing = userIds.filter((id) => !people.get(id)?.name || !people.get(id)?.email);
  if (missing.length) {
    try {
      const accounts = await getAuth().getUsers(missing.map((uid) => ({ uid })));
      accounts.users.forEach((account) => {
        const person = people.get(account.uid);
        if (person) {
          person.name = person.name || clean(account.displayName);
          person.email = person.email || clean(account.email);
        }
      });
    } catch (error) {
      logger.warn("Could not read sign-in accounts for names.", { error });
    }
  }

  return new Map(
    [...people].map(([id, person]) => [id, { name: person.name || person.email || "Member", email: person.email.toLowerCase() || null }]),
  );
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}


// ============================================================
// COMPLETION SUMMARY
// ============================================================

const MAX_SUMMARY_MEMBERS = 2000;
type ProgressStatus = "completed" | "in_progress" | "not_started";

/**
 * Snapshot of who finished each group course, written to
 * trainingGroups/{groupId}/summary/final and stamped on the group
 * (summaryAt). Built by the daily job when a group ends, or on request.
 */
async function buildSummary(groupRef: Ref, generatedBy: string): Promise<{ memberCount: number; finishedAll: number }> {
  const db = getFirestore();
  const organizationId = groupRef.parent.parent?.id ?? "";
  const [group, membersSnapshot, coursesSnapshot] = await Promise.all([
    groupRef.get(),
    groupRef.collection("members").get(),
    groupRef.collection("courses").get(),
  ]);

  const members = membersSnapshot.docs
    .map((document) => ({ userId: document.id, name: clean(document.get("name")) || "Member", email: clean(document.get("email")) || null }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const shown = members.slice(0, MAX_SUMMARY_MEMBERS);
  const courses = coursesSnapshot.docs.map((document) => ({
    key: document.id,
    courseId: clean(document.get("courseId")),
    courseTitle: clean(document.get("courseTitle")) || "Course",
    lessonId: clean(document.get("lessonId")) || null,
    lessonTitle: clean(document.get("lessonTitle")) || null,
    dueAt: document.get("dueAt") instanceof Timestamp ? (document.get("dueAt") as Timestamp).toMillis() : null,
  }));
  const courseIds = [...new Set(courses.map((course) => course.courseId))];

  const rows: { userId: string; name: string; email: string | null; status: Record<string, ProgressStatus>; completedAt: Record<string, number>; finishedAll: boolean }[] = [];
  for (let index = 0; index < shown.length; index += 50) {
    const slice = shown.slice(index, index + 50);
    const refs = slice.flatMap((member) => courseIds.flatMap((courseId) => [
      db.doc(`users/${member.userId}/courseProgress/${organizationId}__${courseId}`),
      db.doc(`users/${member.userId}/courseExams/${organizationId}__${courseId}`),
    ]));
    const snapshots = refs.length ? await readAll(refs) : [];

    slice.forEach((member, memberIndex) => {
      const status: Record<string, ProgressStatus> = {};
      const completedAt: Record<string, number> = {};
      for (const course of courses) {
        const position = (memberIndex * courseIds.length + courseIds.indexOf(course.courseId)) * 2;
        const progress = snapshots[position];
        const exam = snapshots[position + 1];
        if (!progress?.exists) {
          status[course.key] = "not_started";
          continue;
        }
        const done = course.lessonId ?
          ((progress.get("completedLessonIds") as unknown[] | undefined) ?? []).map(String).includes(course.lessonId) :
          progress.get("status") === "completed" && (progress.get("finalExam") !== true || exam?.get("passed") === true);
        status[course.key] = done ? "completed" : "in_progress";
        if (done) {
          const when = (course.lessonId ? progress.get("updatedAt") : exam?.get("passedAt") ?? progress.get("completedAt") ?? progress.get("updatedAt")) as unknown;
          if (when instanceof Timestamp) {
            completedAt[course.key] = when.toMillis();
          }
        }
      }
      rows.push({
        ...member,
        status,
        completedAt,
        finishedAll: courses.length > 0 && courses.every((course) => status[course.key] === "completed"),
      });
    });
  }

  const count = (key: string, value: ProgressStatus) => rows.filter((row) => row.status[key] === value).length;
  const finishedAll = rows.filter((row) => row.finishedAll).length;

  await groupRef.collection("summary").doc("final").set({
    organizationId,
    groupId: groupRef.id,
    groupName: clean(group.get("name")),
    startDate: group.get("startDate") ?? null,
    endDate: group.get("endDate") ?? null,
    generatedAt: FieldValue.serverTimestamp(),
    generatedBy,
    memberCount: members.length,
    finishedAll,
    truncated: members.length > shown.length,
    courses: courses.map((course) => ({
      key: course.key,
      courseTitle: course.courseTitle,
      lessonTitle: course.lessonTitle,
      dueAt: course.dueAt,
      done: count(course.key, "completed"),
      inProgress: count(course.key, "in_progress"),
      notStarted: count(course.key, "not_started"),
    })),
    members: rows,
  });
  await groupRef.update({ summaryAt: FieldValue.serverTimestamp() });

  return { memberCount: members.length, finishedAll };
}

/**
 * Build the summary now (managers, and the group's leads and instructors).
 * { organizationId, groupId }
 */
export const refreshTrainingGroupSummary = onCall({ region: REGION, timeoutSeconds: 300, memory: "512MiB" }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to build the summary.");
  }
  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = clean(data.organizationId);
  const groupId = clean(data.groupId);
  if (!organizationId || !groupId || organizationId.includes("/") || groupId.includes("/")) {
    throw new HttpsError("invalid-argument", "A training group is required.");
  }

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const groupRef = organizationRef.collection("trainingGroups").doc(groupId);
  const [callerMembership, entitlement, isAdmin, group] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("training-groups").get(),
    isPlatformAdministrator(request),
    groupRef.get(),
  ]);
  if (entitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have Training Groups.");
  }
  if (!group.exists) {
    throw new HttpsError("not-found", "This training group no longer exists.");
  }
  const rank = callerMembership.get("active") === true ? ROLE_RANK[clean(callerMembership.get("role"))] ?? 0 : 0;
  const staffOfGroup = [...((group.get("leadIds") as string[] | undefined) ?? []), ...((group.get("instructorIds") as string[] | undefined) ?? [])].includes(uid);
  if (!(isAdmin || rank >= 3 || (rank >= 2 && staffOfGroup))) {
    throw new HttpsError("permission-denied", "Only managers and this group's leads and instructors can build its summary.");
  }

  const result = await buildSummary(groupRef, uid);
  logger.info("Training group summary built.", { organizationId, groupId, ...result });
  return result;
});

/**
 * Every morning: build the summary of groups that ended and don't have one
 * built after their end date yet.
 */
export const summarizeEndedTrainingGroups = onSchedule(
  { schedule: "every day 02:15", timeZone: "America/New_York", region: REGION, timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const organizations = await db.collection("organizations").select().get();
    let built = 0;

    for (const organization of organizations.docs) {
      const entitlement = await organization.ref.collection("applications").doc("training-groups").get();
      if (entitlement.get("status") !== "active") {
        continue;
      }
      const ended = await organization.ref
        .collection("trainingGroups")
        .where("endDate", "<=", Timestamp.fromMillis(now - DAY))
        .get();

      for (const group of ended.docs) {
        const end = group.get("endDate") as Timestamp;
        const summaryAt = group.get("summaryAt");
        const upToDate = summaryAt instanceof Timestamp && summaryAt.toMillis() >= end.toMillis() + DAY;
        if (group.get("manualStatus") || upToDate) {
          continue;
        }
        try {
          await buildSummary(group.ref, "schedule");
          built += 1;
        } catch (error) {
          logger.error("Could not build a training group summary.", { organizationId: organization.id, groupId: group.id, error });
        }
      }
    }

    logger.info("Ended training groups summarized.", { built });
  },
);

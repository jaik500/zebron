/* eslint-disable max-len */
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import { notifyLearner, notifyLearners } from "./learner-notifications";
import { isPlatformAdministrator } from "./platform-admin-authorization";
import { LOCKED_MESSAGE, ROLE_RANK, clean, isLocked } from "./training-groups";

/**
 * Training Groups: assignments and individual projects.
 *
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}/submissions/{uid}
 *
 * Files (Cloud Storage, see storage.rules):
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}/materials/{file}         from the staff
 *   organizations/{id}/trainingGroups/{groupId}/assignments/{assignmentId}/submissions/{uid}/{file} from a member
 *
 * The browser uploads files first (storage.rules check who and how big);
 * these functions record them, so a record only lists files that exist and
 * sit in the right folder.
 *
 * Who:
 * - Create, change, publish and delete; review submissions: platform
 *   administrators, organization managers and above, and the group's leads
 *   and instructors (staff and above). The same people who see the roster.
 * - Submit: the group's members, while the assignment is published and the
 *   group is not locked. Late work only when the assignment accepts it.
 *   Work marked complete can't be changed (staff can send it back).
 *
 * Review is simple: "Complete", or "Needs revision" with feedback. The
 * learner can then submit again.
 */

const REGION = "us-central1";
const MAX_LINKS = 10;
const MAX_MATERIALS = 10;
const MAX_SUBMISSION_FILES = 5;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_HISTORY = 30;
const SUBMISSION_TYPES = ["text", "link", "file", "code"] as const;
type SubmissionType = typeof SUBMISSION_TYPES[number];
const CODE_LANGUAGES = ["javascript", "python"];
const ID_PATTERN = /^[A-Za-z0-9_-]{6,60}$/;

type Data = Record<string, unknown>;
type Ref = FirebaseFirestore.DocumentReference;

interface Caller {
  uid: string;
  rank: number;
  isAdmin: boolean;
  organizationRef: Ref;
  groupRef: Ref;
  group: FirebaseFirestore.DocumentSnapshot;
  isStaff: boolean;
}

// ============================================================
// STAFF: CREATE, CHANGE, PUBLISH, DELETE
// ============================================================

/**
 * { organizationId, groupId, action: "save" | "delete", assignmentId, assignment? }
 *
 * assignment: { title, kind, instructions, links[{label,url}], materials[{name,path}],
 *   dueAt (ms or null), acceptLate, submissionTypes[], codeLanguage, status: "draft" | "published" }
 *
 * The browser picks the id (so materials can be uploaded under it first).
 */
export const manageTrainingGroupAssignment = onCall({ region: REGION, timeoutSeconds: 120 }, async (request) => {
  const data = (request.data ?? {}) as Data;
  const caller = await loadCaller(request, data);
  if (!caller.isStaff) {
    throw new HttpsError("permission-denied", "Only managers and this group's leads and instructors can manage its assignments.");
  }
  ensureUnlocked(caller);

  const assignmentId = clean(data.assignmentId);
  if (!ID_PATTERN.test(assignmentId)) {
    throw new HttpsError("invalid-argument", "An assignment is required.");
  }
  const assignmentRef = caller.groupRef.collection("assignments").doc(assignmentId);
  const existing = await assignmentRef.get();
  const prefix = assignmentFolder(caller, assignmentId);

  if (data.action === "delete") {
    if (!existing.exists) {
      return { deleted: false };
    }
    await db().recursiveDelete(assignmentRef);
    await getStorage().bucket().deleteFiles({ prefix: `${prefix}/` }).catch((error: unknown) =>
      logger.warn("Could not delete assignment files.", { prefix, error }),
    );
    logger.info("Training group assignment deleted.", { path: assignmentRef.path, by: caller.uid });
    return { deleted: true };
  }

  const input = (data.assignment ?? {}) as Data;
  const title = text(input.title, 150);
  if (!title) {
    throw new HttpsError("invalid-argument", "Give the assignment a title.");
  }
  const kind = input.kind === "project" ? "project" : "assignment";
  const instructions = text(input.instructions, 10000, true);
  const links = parseLinks(input.links);
  const submissionTypes = Array.isArray(input.submissionTypes) ?
    SUBMISSION_TYPES.filter((type) => (input.submissionTypes as unknown[]).includes(type)) :
    [];
  if (!submissionTypes.length) {
    throw new HttpsError("invalid-argument", "Choose at least one way for learners to hand in their work.");
  }
  const codeLanguage = submissionTypes.includes("code") ?
    (CODE_LANGUAGES.includes(clean(input.codeLanguage)) ? clean(input.codeLanguage) : "javascript") :
    null;
  const dueAt = typeof input.dueAt === "number" && Number.isFinite(input.dueAt) ? Timestamp.fromMillis(input.dueAt) : null;
  const acceptLate = input.acceptLate !== false;
  const status = input.status === "published" ? "published" : "draft";

  // Back to draft only while nobody has handed anything in.
  if (existing.exists && existing.get("status") === "published" && status === "draft") {
    const submitted = await assignmentRef.collection("submissions").limit(1).get();
    if (!submitted.empty) {
      throw new HttpsError("failed-precondition", "Learners have already handed in work, so this assignment stays published.");
    }
  }

  const materials = await recordFiles(input.materials, `${prefix}/materials/`, MAX_MATERIALS);
  await removeDroppedFiles(existing.get("materials"), materials);

  const name = await displayName(caller.uid);
  const now = FieldValue.serverTimestamp();
  await assignmentRef.set(
    {
      organizationId: caller.organizationRef.id,
      groupId: caller.groupRef.id,
      title,
      kind,
      instructions,
      links,
      materials,
      dueAt,
      acceptLate,
      submissionTypes,
      codeLanguage,
      status,
      publishedAt: status === "published" ? existing.get("publishedAt") ?? now : null,
      counts: existing.get("counts") ?? { submitted: 0, needsRevision: 0, complete: 0 },
      createdBy: existing.get("createdBy") ?? caller.uid,
      createdByName: existing.get("createdByName") ?? name,
      createdAt: existing.get("createdAt") ?? now,
      updatedBy: caller.uid,
      updatedAt: now,
    },
  );

  logger.info("Training group assignment saved.", { path: assignmentRef.path, status, by: caller.uid });

  // Just published: tell the group's members (once per assignment).
  if (status === "published" && existing.get("status") !== "published") {
    const members = await caller.groupRef.collection("members").get();
    const due = dueAt ? ` Due ${dueAt.toDate().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.` : "";
    await notifyLearners(
      members.docs
        .filter((member) => member.id !== caller.uid)
        .map((member) => ({
          uid: member.id,
          id: `group-published-${caller.organizationRef.id}-${caller.groupRef.id}-${assignmentId}`,
          notification: {
            kind: "assignment_published" as const,
            title: `New ${kind === "project" ? "project" : "assignment"}: ${title}`,
            body: `${clean(caller.group.get("name")) || "Your training group"} has new work for you.${due}`,
            link: `/partner/org/${caller.organizationRef.id}/training-groups/${caller.groupRef.id}`,
          },
        })),
    );
  }

  return { assignmentId, status };
});

// ============================================================
// MEMBERS: HAND IN WORK
// ============================================================

/**
 * { organizationId, groupId, assignmentId, text, links[{label,url}], files[{name,path}], code }
 */
export const submitTrainingGroupAssignment = onCall({ region: REGION }, async (request) => {
  const data = (request.data ?? {}) as Data;
  const caller = await loadCaller(request, data);
  const memberSnapshot = await caller.groupRef.collection("members").doc(caller.uid).get();
  if (!memberSnapshot.exists || caller.rank < 1) {
    throw new HttpsError("permission-denied", "Only members of this group can hand in its assignments.");
  }
  if (isLocked(caller.group)) {
    throw new HttpsError("failed-precondition", LOCKED_MESSAGE);
  }
  if (caller.group.get("manualStatus") === "cancelled") {
    throw new HttpsError("failed-precondition", "This group was cancelled.");
  }

  const assignmentId = clean(data.assignmentId);
  if (!ID_PATTERN.test(assignmentId)) {
    throw new HttpsError("invalid-argument", "An assignment is required.");
  }
  const assignmentRef = caller.groupRef.collection("assignments").doc(assignmentId);
  const assignment = await assignmentRef.get();
  if (!assignment.exists || assignment.get("status") !== "published") {
    throw new HttpsError("not-found", "This assignment is not available.");
  }

  const submissionRef = assignmentRef.collection("submissions").doc(caller.uid);
  const previous = await submissionRef.get();
  if (previous.get("status") === "complete") {
    throw new HttpsError("failed-precondition", "Your work was already marked complete. Ask an instructor if you need to change it.");
  }

  const due = assignment.get("dueAt");
  const late = due instanceof Timestamp && Date.now() > due.toMillis();
  if (late && assignment.get("acceptLate") === false) {
    throw new HttpsError("failed-precondition", "The due date has passed and this assignment doesn't accept late work.");
  }

  // Only the ways of handing in that the assignment allows.
  const allowed = new Set((assignment.get("submissionTypes") as SubmissionType[] | undefined) ?? []);
  const answer = allowed.has("text") ? text(data.text, 20000, true) : "";
  const links = allowed.has("link") ? parseLinks(data.links) : [];
  const code = allowed.has("code") && typeof data.code === "string" ? data.code.slice(0, 50000) : "";
  const files = allowed.has("file") ?
    await recordFiles(data.files, `${assignmentFolder(caller, assignmentId)}/submissions/${caller.uid}/`, MAX_SUBMISSION_FILES) :
    [];
  if (!answer && !links.length && !code.trim() && !files.length) {
    throw new HttpsError("invalid-argument", "Add your work before handing it in.");
  }
  await removeDroppedFiles(previous.get("files"), files);

  const attempt = (typeof previous.get("attempt") === "number" ? previous.get("attempt") as number : 0) + 1;
  const name = clean(memberSnapshot.get("name")) || clean(memberSnapshot.get("email")) || await displayName(caller.uid);
  const history = historyWith(previous, { attempt, status: "submitted", feedback: "", by: caller.uid, byName: name, late });

  await submissionRef.set({
    userId: caller.uid,
    userName: name,
    email: clean(memberSnapshot.get("email")) || null,
    text: answer,
    links,
    files,
    code,
    codeLanguage: allowed.has("code") ? clean(assignment.get("codeLanguage")) || "javascript" : null,
    status: "submitted",
    attempt,
    late,
    submittedAt: FieldValue.serverTimestamp(),
    // The last review stays visible until the next one.
    feedback: previous.get("feedback") ?? "",
    reviewedBy: previous.get("reviewedBy") ?? null,
    reviewedByName: previous.get("reviewedByName") ?? null,
    reviewedAt: previous.get("reviewedAt") ?? null,
    history,
  });
  await updateCounts(assignmentRef);

  logger.info("Training group assignment submitted.", { path: submissionRef.path, attempt, late });
  return { attempt, late };
});

// ============================================================
// STAFF: REVIEW
// ============================================================

/**
 * { organizationId, groupId, assignmentId, userId, decision: "complete" | "needs_revision", feedback }
 */
export const reviewTrainingGroupSubmission = onCall({ region: REGION }, async (request) => {
  const data = (request.data ?? {}) as Data;
  const caller = await loadCaller(request, data);
  if (!caller.isStaff) {
    throw new HttpsError("permission-denied", "Only managers and this group's leads and instructors can review its work.");
  }
  ensureUnlocked(caller);

  const assignmentId = clean(data.assignmentId);
  const userId = clean(data.userId);
  if (!ID_PATTERN.test(assignmentId) || !userId || userId.includes("/")) {
    throw new HttpsError("invalid-argument", "A submission is required.");
  }
  const decision = data.decision === "complete" ? "complete" : data.decision === "needs_revision" ? "needs_revision" : "";
  if (!decision) {
    throw new HttpsError("invalid-argument", "Choose Complete or Needs revision.");
  }
  const feedback = text(data.feedback, 5000, true);
  if (decision === "needs_revision" && !feedback) {
    throw new HttpsError("invalid-argument", "Say what needs to change, so the learner knows what to do.");
  }

  const assignmentRef = caller.groupRef.collection("assignments").doc(assignmentId);
  const submissionRef = assignmentRef.collection("submissions").doc(userId);
  const submission = await submissionRef.get();
  if (!submission.exists) {
    throw new HttpsError("not-found", "This submission no longer exists.");
  }

  const name = await displayName(caller.uid);
  await submissionRef.update({
    status: decision,
    feedback,
    reviewedBy: caller.uid,
    reviewedByName: name,
    reviewedAt: FieldValue.serverTimestamp(),
    history: historyWith(submission, {
      attempt: (submission.get("attempt") as number | undefined) ?? 1,
      status: decision,
      feedback,
      by: caller.uid,
      byName: name,
      late: false,
    }),
  });
  await updateCounts(assignmentRef);

  logger.info("Training group submission reviewed.", { path: submissionRef.path, decision, by: caller.uid });

  const assignmentTitle = clean((await assignmentRef.get()).get("title")) || "your assignment";
  await notifyLearner(userId, `group-reviewed-${caller.organizationRef.id}-${caller.groupRef.id}-${assignmentId}-${(submission.get("attempt") as number | undefined) ?? 1}-${decision}`, {
    kind: "work_reviewed",
    title: decision === "complete" ? `Marked complete: ${assignmentTitle}` : `Needs revision: ${assignmentTitle}`,
    body: decision === "complete" ? `${name} reviewed your work.${feedback ? ` ${feedback.slice(0, 300)}` : ""}` : `${name} asked for changes: ${feedback.slice(0, 300)}`,
    link: `/partner/org/${caller.organizationRef.id}/training-groups/${caller.groupRef.id}`,
  });
  return { status: decision };
});

// ============================================================
// HELPERS
// ============================================================

function db(): FirebaseFirestore.Firestore {
  return getFirestore();
}

/** Signed in, Training Groups active, the group exists; works out the caller's role. */
async function loadCaller(request: CallableRequest<unknown>, data: Data): Promise<Caller> {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to continue.");
  }
  const organizationId = clean(data.organizationId);
  const groupId = clean(data.groupId);
  if (!organizationId || !groupId || organizationId.includes("/") || groupId.includes("/")) {
    throw new HttpsError("invalid-argument", "A training group is required.");
  }

  const organizationRef = db().collection("organizations").doc(organizationId);
  const groupRef = organizationRef.collection("trainingGroups").doc(groupId);
  const [membership, entitlement, isAdmin, group] = await Promise.all([
    db().doc(`organizationMemberships/${uid}_${organizationId}`).get(),
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

  const rank = membership.get("active") === true ? ROLE_RANK[clean(membership.get("role"))] ?? 0 : 0;
  const staffOfGroup = [
    ...((group.get("leadIds") as string[] | undefined) ?? []),
    ...((group.get("instructorIds") as string[] | undefined) ?? []),
  ].includes(uid);

  return {
    uid,
    rank,
    isAdmin,
    organizationRef,
    groupRef,
    group,
    // Same as the roster (firestore.rules isTrainingGroupStaff, refreshTrainingGroupSummary).
    isStaff: isAdmin || rank >= 3 || (rank >= 2 && staffOfGroup),
  };
}

/** Ended groups are read-only except for owners and admins. */
function ensureUnlocked(caller: Caller): void {
  if (isLocked(caller.group) && !(caller.isAdmin || caller.rank >= 4)) {
    throw new HttpsError("failed-precondition", LOCKED_MESSAGE);
  }
}

function assignmentFolder(caller: Caller, assignmentId: string): string {
  return `organizations/${caller.organizationRef.id}/trainingGroups/${caller.groupRef.id}/assignments/${assignmentId}`;
}

/** Trimmed text up to a length; multiline keeps line breaks. */
function text(value: unknown, max: number, multiline = false): string {
  if (typeof value !== "string") return "";
  const result = multiline ? value.replace(/\r\n/g, "\n").trim() : value.replace(/\s+/g, " ").trim();
  return result.slice(0, max);
}

/** Web links only (http and https). */
function parseLinks(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  const links: { label: string; url: string }[] = [];
  for (const item of value.slice(0, MAX_LINKS)) {
    const url = text((item as Data)?.url, 2000);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    links.push({ label: text((item as Data)?.label, 150) || parsed.hostname, url: parsed.toString() });
  }
  return links;
}

/**
 * Files the browser uploaded: each must exist in the given folder.
 * Size and type come from Storage, not from the browser.
 */
async function recordFiles(value: unknown, folder: string, max: number): Promise<{ name: string; path: string; size: number; contentType: string }[]> {
  if (!Array.isArray(value)) return [];
  if (value.length > max) {
    throw new HttpsError("invalid-argument", `Attach at most ${max} files.`);
  }
  const bucket = getStorage().bucket();
  const files = [];
  const seen = new Set<string>();
  for (const item of value) {
    const path = clean((item as Data)?.path);
    if (!path.startsWith(folder) || path.includes("..") || path.slice(folder.length).includes("/") || seen.has(path)) {
      throw new HttpsError("invalid-argument", "A file is not in the right place. Upload it again.");
    }
    seen.add(path);
    const [exists] = await bucket.file(path).exists();
    if (!exists) {
      throw new HttpsError("invalid-argument", "A file didn't finish uploading. Upload it again.");
    }
    const [metadata] = await bucket.file(path).getMetadata();
    const size = Number(metadata.size ?? 0);
    if (size > MAX_FILE_BYTES) {
      throw new HttpsError("invalid-argument", "Files can be up to 25 MB.");
    }
    files.push({
      name: text((item as Data)?.name, 200) || path.slice(folder.length),
      path,
      size,
      contentType: String(metadata.contentType ?? "application/octet-stream"),
    });
  }
  return files;
}

/** Delete files that were on the record before but aren't any more. */
async function removeDroppedFiles(before: unknown, after: { path: string }[]): Promise<void> {
  if (!Array.isArray(before)) return;
  const kept = new Set(after.map((file) => file.path));
  const bucket = getStorage().bucket();
  await Promise.all(
    before
      .map((file) => clean((file as Data)?.path))
      .filter((path) => path && !kept.has(path))
      .map((path) => bucket.file(path).delete({ ignoreNotFound: true }).catch((error: unknown) => logger.warn("Could not delete a file.", { path, error }))),
  );
}

function historyWith(
  snapshot: FirebaseFirestore.DocumentSnapshot,
  entry: { attempt: number; status: string; feedback: string; by: string; byName: string; late: boolean },
): Data[] {
  const before = Array.isArray(snapshot.get("history")) ? (snapshot.get("history") as Data[]) : [];
  return [...before, { ...entry, at: Timestamp.now() }].slice(-MAX_HISTORY);
}

/** Awaiting review, needs revision, complete: shown on the assignment list. */
async function updateCounts(assignmentRef: Ref): Promise<void> {
  const submissions = assignmentRef.collection("submissions");
  const [submitted, needsRevision, complete] = await Promise.all(
    ["submitted", "needs_revision", "complete"].map((status) =>
      submissions.where("status", "==", status).count().get().then((result: { data(): { count: number } }) => result.data().count),
    ),
  );
  await assignmentRef.update({ counts: { submitted, needsRevision, complete } });
}

async function displayName(uid: string): Promise<string> {
  try {
    const user = await getAuth().getUser(uid);
    return user.displayName?.trim() || user.email?.trim() || "Instructor";
  } catch {
    return "Instructor";
  }
}

/* eslint-disable max-len */
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";
import {
  ROLE_RANK,
  addPeopleToGroup,
  clean,
  inviteForGroup,
  isLocked,
  logEnrollment,
  refreshRequestCounts,
} from "./training-groups";

/**
 * Training group enrollment: how people get into a group besides being
 * added by a lead.
 *
 *   enrollmentMode on the group:
 *     invite       leads add people (default; nothing here applies)
 *     request      organization members ask to join; a lead approves
 *     application  anyone signed in to Zebron applies through a link; when
 *                  approved, non-members get an organization invitation and
 *                  join the group when they accept it
 *
 *   organizations/{id}/trainingGroups/{groupId}/requests/{uid}
 *     status: pending | waitlisted | invited | enrolled | declined | withdrawn
 *   organizations/{id}/trainingGroups/{groupId}/enrollmentLog/{entry}
 *
 * Organization membership itself stays invitation-only: nobody gets access
 * to the organization without a lead's approval and an accepted invitation.
 */

const REGION = "us-central1";
const MAX_ANSWER = 2000;
const ACTIVE_STATUSES = ["pending", "waitlisted", "invited", "enrolled"];

type Mode = "invite" | "request" | "application";

interface Context {
  db: FirebaseFirestore.Firestore;
  organizationId: string;
  groupId: string;
  organizationRef: FirebaseFirestore.DocumentReference;
  groupRef: FirebaseFirestore.DocumentReference;
  group: FirebaseFirestore.DocumentSnapshot;
  organizationName: string;
}

async function loadGroup(data: Record<string, unknown>): Promise<Context> {
  const organizationId = clean(data.organizationId);
  const groupId = clean(data.groupId);
  if (!organizationId || !groupId || organizationId.includes("/") || groupId.includes("/")) {
    throw new HttpsError("invalid-argument", "A training group is required.");
  }
  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const groupRef = organizationRef.collection("trainingGroups").doc(groupId);
  const [organization, entitlement, group] = await Promise.all([
    organizationRef.get(),
    organizationRef.collection("applications").doc("training-groups").get(),
    groupRef.get(),
  ]);
  if (!organization.exists || entitlement.get("status") !== "active" || !group.exists) {
    throw new HttpsError("not-found", "This training group isn't available.");
  }
  return { db, organizationId, groupId, organizationRef, groupRef, group, organizationName: clean(organization.get("name")) };
}

function modeOf(group: FirebaseFirestore.DocumentSnapshot): Mode {
  const mode = group.get("enrollmentMode");
  return mode === "request" || mode === "application" ? mode : "invite";
}

/** Why the group isn't taking requests right now, or null when it is. */
function closedReason(group: FirebaseFirestore.DocumentSnapshot, now = Date.now()): string | null {
  if (modeOf(group) === "invite") return "This group is by invitation only.";
  if (group.get("manualStatus") === "draft") return "This group isn't open yet.";
  if (group.get("manualStatus") === "cancelled") return "This group was cancelled.";
  if (isLocked(group, now)) return "This group has ended.";
  const opens = group.get("enrollmentOpensAt");
  const closes = group.get("enrollmentClosesAt");
  if (opens instanceof Timestamp && now < opens.toMillis()) return "Enrollment hasn't opened yet.";
  if (closes instanceof Timestamp && now >= closes.toMillis()) return "Enrollment has closed.";
  return null;
}

function spotsLeft(group: FirebaseFirestore.DocumentSnapshot): number | null {
  const capacity = Number(group.get("capacity") ?? 0);
  return capacity > 0 ? Math.max(0, capacity - Number(group.get("memberCount") ?? 0)) : null;
}

function iso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

/** What a prospective learner may see about a group. */
function publicView(context: Context) {
  const { group } = context;
  return {
    organizationId: context.organizationId,
    organizationName: context.organizationName,
    groupId: context.groupId,
    name: clean(group.get("name")),
    programName: clean(group.get("programName")),
    description: clean(group.get("description")),
    startDate: iso(group.get("startDate")),
    endDate: iso(group.get("endDate")),
    deliveryMode: clean(group.get("deliveryMode")),
    location: clean(group.get("location")),
    mode: modeOf(group),
    opensAt: iso(group.get("enrollmentOpensAt")),
    closesAt: iso(group.get("enrollmentClosesAt")),
    spotsLeft: spotsLeft(group),
    waitlistEnabled: group.get("waitlistEnabled") === true,
    questions: ((group.get("applicationQuestions") as unknown[] | undefined) ?? []).map(clean).filter(Boolean),
    closedReason: closedReason(group),
  };
}

function requestView(request: FirebaseFirestore.DocumentSnapshot) {
  return request.exists ? {
    status: clean(request.get("status")),
    createdAt: iso(request.get("createdAt")),
    decisionNote: clean(request.get("decisionNote")),
  } : null;
}

/**
 * The join page: group details for prospective learners and the caller's
 * own request. { organizationId, groupId }
 */
export const getTrainingGroupEnrollment = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to see this training group.");
  }
  const context = await loadGroup((request.data ?? {}) as Record<string, unknown>);
  const { db, organizationId, groupRef, group } = context;
  const [membership, member, own] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    groupRef.collection("members").doc(uid).get(),
    groupRef.collection("requests").doc(uid).get(),
  ]);
  const isMember = membership.get("active") === true;
  const mode = modeOf(group);

  // Invite-only groups are not public, and request-mode groups are for members.
  if (!member.exists && !own.exists && (mode === "invite" || (mode === "request" && !isMember))) {
    throw new HttpsError("not-found", "This training group isn't available.");
  }

  return {
    group: publicView(context),
    isOrganizationMember: isMember,
    isGroupMember: member.exists,
    request: requestView(own),
  };
});

/**
 * Groups an organization member can ask to join right now.
 * { organizationId }
 */
export const listOpenTrainingGroups = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }
  const organizationId = clean((request.data as Record<string, unknown> | undefined)?.organizationId);
  if (!organizationId || organizationId.includes("/")) {
    throw new HttpsError("invalid-argument", "An organization is required.");
  }
  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const [membership, entitlement, organization] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    organizationRef.collection("applications").doc("training-groups").get(),
    organizationRef.get(),
  ]);
  if (membership.get("active") !== true || entitlement.get("status") !== "active") {
    return { groups: [] };
  }

  const groups = await organizationRef.collection("trainingGroups")
    .where("enrollmentMode", "in", ["request", "application"])
    .get();
  const open = groups.docs.filter((group) => !closedReason(group));
  const own = open.length ?
    await db.getAll(...open.map((group) => group.ref.collection("requests").doc(uid))) :
    [];
  const memberOf = open.length ?
    await db.getAll(...open.map((group) => group.ref.collection("members").doc(uid))) :
    [];

  return {
    groups: open
      .map((group, index) => ({
        ...publicView({
          db, organizationId, groupId: group.id, organizationRef, groupRef: group.ref, group,
          organizationName: clean(organization.get("name")),
        }),
        request: requestView(own[index]),
        isGroupMember: memberOf[index]?.exists ?? false,
      }))
      .filter((group) => !group.isGroupMember),
  };
});

/**
 * Ask to join, apply, or withdraw a request.
 * { organizationId, groupId, action: 'submit' | 'withdraw', answers?: string[] }
 */
export const submitTrainingGroupRequest = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to join a training group.");
  }
  const data = (request.data ?? {}) as Record<string, unknown>;
  const context = await loadGroup(data);
  const { db, organizationId, groupId, groupRef, group } = context;
  const requestRef = groupRef.collection("requests").doc(uid);
  const [membership, member, existing] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    groupRef.collection("members").doc(uid).get(),
    requestRef.get(),
  ]);
  const isMember = membership.get("active") === true;
  const name = clean(request.auth?.token?.name) || clean(membership.get("displayName")) || clean(request.auth?.token?.email) || "Applicant";

  if (data.action === "withdraw") {
    if (!existing.exists || !["pending", "waitlisted"].includes(clean(existing.get("status")))) {
      throw new HttpsError("failed-precondition", "There is no open request to withdraw.");
    }
    await requestRef.update({ status: "withdrawn", decidedAt: FieldValue.serverTimestamp(), decidedBy: uid });
    await logEnrollment(groupRef, { action: "withdrawn", userId: uid, userName: name, actorId: uid, actorName: name });
    await refreshRequestCounts(groupRef);
    return { status: "withdrawn" };
  }

  const mode = modeOf(group);
  if (mode === "invite" || (mode === "request" && !isMember)) {
    throw new HttpsError("not-found", "This training group isn't available.");
  }
  const reason = closedReason(group);
  if (reason) {
    throw new HttpsError("failed-precondition", reason);
  }
  if (member.exists) {
    throw new HttpsError("already-exists", "You're already in this group.");
  }
  if (existing.exists && ACTIVE_STATUSES.includes(clean(existing.get("status")))) {
    throw new HttpsError("already-exists", "You already have a request for this group.");
  }

  const email = clean(request.auth?.token?.email).toLowerCase();
  // Approved applicants are invited at their account email; accepting
  // the invitation requires signing in with that same email.
  if (!isMember && !email) {
    throw new HttpsError("failed-precondition", "Your account needs an email address to apply.");
  }

  const questions = ((group.get("applicationQuestions") as unknown[] | undefined) ?? []).map(clean).filter(Boolean);
  const rawAnswers = Array.isArray(data.answers) ? data.answers : [];
  const answers = questions.map((question, index) => ({ question, answer: clean(rawAnswers[index]).slice(0, MAX_ANSWER) }));

  await requestRef.set({
    userId: uid,
    organizationId,
    groupId,
    type: mode,
    name: name.slice(0, 120),
    email: email || null,
    isOrganizationMember: isMember,
    answers,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    decidedAt: null,
    decidedBy: null,
    decisionNote: "",
    invitationId: null,
  });
  await logEnrollment(groupRef, { action: mode === "application" ? "applied" : "requested", userId: uid, userName: name, actorId: uid, actorName: name });

  // Members joining a group that approves automatically go straight in.
  if (mode === "request" && group.get("autoApprove") === true) {
    const status = await approve({ ...context, userId: uid, actorUid: uid, actorName: "Automatic approval", note: "" });
    return { status };
  }
  await refreshRequestCounts(groupRef);
  logger.info("Training group request submitted.", { organizationId, groupId, mode });
  return { status: "pending" };
});

/**
 * A lead approves or declines a request.
 * { organizationId, groupId, userId, decision: 'approve' | 'decline', note? }
 */
export const decideTrainingGroupRequest = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to manage training groups.");
  }
  const data = (request.data ?? {}) as Record<string, unknown>;
  const context = await loadGroup(data);
  const { db, organizationId, groupRef, group } = context;
  const userId = clean(data.userId);
  if (!userId || userId.includes("/")) {
    throw new HttpsError("invalid-argument", "Choose a request.");
  }

  const [callerMembership, isAdmin] = await Promise.all([
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    isPlatformAdministrator(request),
  ]);
  const rank = callerMembership.get("active") === true ? ROLE_RANK[clean(callerMembership.get("role"))] ?? 0 : 0;
  const leadIds = (group.get("leadIds") as string[] | undefined) ?? [];
  if (!(isAdmin || rank >= 4 || (rank >= 3 && leadIds.includes(uid)))) {
    throw new HttpsError("permission-denied", "Only organization admins, owners and this group's leads can decide requests.");
  }
  if (isLocked(group)) {
    throw new HttpsError("failed-precondition", "This group has ended and is locked. An organization admin can reopen it.");
  }

  const requestRef = groupRef.collection("requests").doc(userId);
  const existing = await requestRef.get();
  if (!existing.exists || !["pending", "waitlisted"].includes(clean(existing.get("status")))) {
    throw new HttpsError("failed-precondition", "This request has already been handled.");
  }
  const note = clean(data.note).slice(0, 500);
  const actorName = clean(callerMembership.get("displayName")) || clean(request.auth?.token?.name) || clean(request.auth?.token?.email);

  if (data.decision === "decline") {
    await requestRef.update({ status: "declined", decidedAt: FieldValue.serverTimestamp(), decidedBy: uid, decisionNote: note });
    await logEnrollment(groupRef, { action: "declined", userId, userName: clean(existing.get("name")), actorId: uid, actorName, note });
    await refreshRequestCounts(groupRef);
    return { status: "declined" };
  }

  const status = await approve({ ...context, userId, actorUid: uid, actorName, note });
  return { status };
});

/**
 * Approve: members join now (or go on the waitlist when the group is full);
 * non-members are invited to the organization and join on acceptance.
 */
async function approve(context: Context & { userId: string; actorUid: string; actorName: string; note: string }): Promise<string> {
  const { db, organizationId, groupId, groupRef, group, userId, actorUid, actorName, note } = context;
  const requestRef = groupRef.collection("requests").doc(userId);
  const entry = await requestRef.get();
  const name = clean(entry.get("name")) || "Applicant";
  const membership = await db.doc(`organizationMemberships/${userId}_${organizationId}`).get();
  const decided = { decidedAt: FieldValue.serverTimestamp(), decidedBy: actorUid, decisionNote: note };

  const full = (): boolean => {
    const left = spotsLeft(group);
    return left !== null && left <= 0;
  };

  let status: string;
  if (membership.get("active") === true) {
    try {
      await addPeopleToGroup({ organizationId, groupId, userIds: [userId], actorUid });
      status = "enrolled";
    } catch (error) {
      if (error instanceof HttpsError && error.code === "resource-exhausted" && group.get("waitlistEnabled") === true) {
        status = "waitlisted";
      } else {
        throw error;
      }
    }
  } else if (full()) {
    if (group.get("waitlistEnabled") !== true) {
      throw new HttpsError("resource-exhausted", "This group is full. Raise its capacity or turn on the waitlist.");
    }
    status = "waitlisted";
  } else {
    const email = clean(entry.get("email"));
    if (!email) {
      throw new HttpsError("failed-precondition", "This applicant has no email address to invite.");
    }
    const invitationId = await inviteForGroup({ organizationId, groupId, email, actorUid });
    await requestRef.update({ invitationId });
    status = "invited";
  }

  await requestRef.update({
    status,
    ...decided,
    ...(status === "waitlisted" ? { waitlistedAt: FieldValue.serverTimestamp() } : {}),
  });
  const notes: Record<string, string> = {
    enrolled: "Approved and added to the group.",
    waitlisted: "Approved; the group is full, so they're on the waitlist.",
    invited: "Approved; invited to join the organization.",
  };
  await logEnrollment(groupRef, { action: status === "enrolled" ? "approved" : status, userId, userName: name, actorId: actorUid, actorName, note: note || notes[status] });
  await refreshRequestCounts(groupRef);
  return status;
}

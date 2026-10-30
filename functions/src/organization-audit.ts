/* eslint-disable max-len */
import { getAuth } from "firebase-admin/auth";
import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  Change,
  FirestoreAuthEvent,
  onDocumentWrittenWithAuthData,
} from "firebase-functions/v2/firestore";

/**
 * Organization audit log.
 *
 * Every create, update and delete of an organization's important data
 * is recorded in organizations/{organizationId}/auditLogs/{eventId},
 * no matter whether it came from the partner portal, a Zebron platform
 * administrator, or an automated job. Because recording happens in the
 * backend (Firestore triggers), it cannot be skipped or edited by the
 * browser.
 *
 * Each entry records:
 * - when, what (entity type, id, readable label), and the action
 * - who: user ID, name, email, organization role, and whether they are a
 *   Zebron platform administrator, an organization user, or the system
 * - source: "organization", "platform" or "system"
 * - which fields changed, with before and after values (long values and
 *   message bodies are shortened; secrets are never stored)
 *
 * Entries are kept for two years (expireAt; enable a Firestore TTL
 * policy on auditLogs.expireAt to delete them automatically).
 */

const RETENTION_DAYS = 730;
const MAX_VALUE_LENGTH = 300;
const MAX_FIELDS = 40;

/** Fields that only track bookkeeping; changes to just these are not logged. */
const NOISE_FIELDS = new Set([
  "updatedAt",
  "lastActivityAt",
  "questionCount",
  "courseCount",
  "viewCount",
  "trendingScore",
]);

/** Fields never copied into the audit log. */
const SECRET_FIELDS = new Set([
  "token",
  "tokenHash",
  "invitationToken",
  "password",
  "apiKey",
  "secret",
  "headers",
  "html",
]);

/** Large text fields: only their length is recorded. */
const BODY_FIELDS = new Set(["message", "body", "content", "explanation", "bio"]);

/** Fields some server functions set to say who acted. */
const ACTOR_HINT_FIELDS = [
  "reviewedBy",
  "lifecycleUpdatedBy",
  "suspendedBy",
  "resumedBy",
  "deactivatedBy",
  "acceptedBy",
  "billingContactUpdatedBy",
  "lastTerminationCancelledBy",
  "ownerApprovedBy",
  "activatedBy",
  "updatedBy",
  "createdBy",
  "requestedBy",
];

type AuditAction = "created" | "updated" | "deleted";
type AuditSource = "organization" | "platform" | "system";

interface WatchedCollection {
  /** Firestore path pattern. */
  path: string;
  entityType: string;
  /** Finds the organization the document belongs to. */
  organizationId: (params: Record<string, string>, data: DocumentData) => string | null;
  /** Readable name of the document. */
  label: (data: DocumentData, id: string) => string;
  /** Skip documents that don't belong to an organization (e.g. platform courses). */
  skip?: (data: DocumentData) => boolean;
}

const fromParam = (params: Record<string, string>) => params.organizationId ?? null;
const fromField = (_: Record<string, string>, data: DocumentData) =>
  typeof data.organizationId === "string" && data.organizationId ? data.organizationId : null;

const WATCHED: WatchedCollection[] = [
  {
    path: "organizations/{organizationId}",
    entityType: "organization",
    organizationId: fromParam,
    label: (data) => text(data.name) || "Organization",
  },
  {
    path: "organizationMemberships/{membershipId}",
    entityType: "membership",
    organizationId: fromField,
    label: (data) => text(data.displayName) || text(data.email) || text(data.userId),
  },
  {
    path: "organizationInvitations/{invitationId}",
    entityType: "invitation",
    organizationId: fromField,
    label: (data) => text(data.email) || "Invitation",
  },
  {
    path: "organizations/{organizationId}/applications/{applicationId}",
    entityType: "application",
    organizationId: fromParam,
    label: (_, id) => id,
  },
  {
    path: "organizations/{organizationId}/contract/{contractId}",
    entityType: "contract",
    organizationId: fromParam,
    label: (data) => text(data.contractNumber) || "Contract",
  },
  {
    path: "organizationServiceRequests/{requestId}",
    entityType: "service_request",
    organizationId: fromField,
    label: (data) => [text(data.type).replace(/_/g, " "), text(data.applicationId)].filter(Boolean).join(": "),
  },
  {
    path: "organizations/{organizationId}/announcements/{announcementId}",
    entityType: "announcement",
    organizationId: fromParam,
    label: (data) => text(data.title) || "Banner",
  },
  {
    path: "organizations/{organizationId}/sentMessages/{messageId}",
    entityType: "email_sent",
    organizationId: fromParam,
    label: (data) => text(data.subject) || "(No subject)",
  },
  {
    path: "organizations/{organizationId}/inboundMessages/{messageId}",
    entityType: "email_received",
    organizationId: fromParam,
    label: (data) => text(data.subject) || "(No subject)",
  },
  {
    path: "organizations/{organizationId}/settings/{settingsId}",
    entityType: "settings",
    organizationId: fromParam,
    label: (_, id) => `Settings: ${id}`,
  },
  {
    path: "organizationSettings/{organizationId}",
    entityType: "settings",
    organizationId: fromParam,
    label: () => "Organization settings",
  },
  {
    path: "organizationOnboarding/{organizationId}",
    entityType: "onboarding",
    organizationId: fromParam,
    label: () => "Onboarding",
  },
  {
    path: "testPrograms/{programId}",
    entityType: "test_program",
    organizationId: fromField,
    label: (data) => text(data.name) || "Program",
  },
  {
    path: "testCourses/{courseId}",
    entityType: "test_course",
    organizationId: fromField,
    label: (data) => text(data.name) || "Course",
    skip: (data) => data.scope === "platform",
  },
  {
    path: "testTopics/{topicId}",
    entityType: "test_topic",
    organizationId: fromField,
    label: (data) => text(data.name) || "Topic",
    skip: (data) => data.scope === "platform",
  },
  {
    path: "testQuestions/{questionId}",
    entityType: "test_question",
    organizationId: fromField,
    label: (data) => shorten(text(data.question), 120) || "Question",
    skip: (data) => data.scope === "platform",
  },
];

// ============================================================
// TRIGGERS
// ============================================================

function triggerFor(collection: WatchedCollection) {
  return onDocumentWrittenWithAuthData(
    { document: collection.path, retry: false },
    async (event: FirestoreAuthEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>) => {
      try {
        await record(collection, event);
      } catch (error) {
        logger.error("Audit log write failed.", { path: collection.path, eventId: event.id, error });
      }
    },
  );
}

export const auditOrganizationChanges = triggerFor(WATCHED[0]);
export const auditMembershipChanges = triggerFor(WATCHED[1]);
export const auditInvitationChanges = triggerFor(WATCHED[2]);
export const auditApplicationChanges = triggerFor(WATCHED[3]);
export const auditContractChanges = triggerFor(WATCHED[4]);
export const auditServiceRequestChanges = triggerFor(WATCHED[5]);
export const auditAnnouncementChanges = triggerFor(WATCHED[6]);
export const auditSentEmailChanges = triggerFor(WATCHED[7]);
export const auditReceivedEmailChanges = triggerFor(WATCHED[8]);
export const auditOrganizationSettingsChanges = triggerFor(WATCHED[9]);
export const auditLegacySettingsChanges = triggerFor(WATCHED[10]);
export const auditOnboardingChanges = triggerFor(WATCHED[11]);
export const auditTestProgramChanges = triggerFor(WATCHED[12]);
export const auditTestCourseChanges = triggerFor(WATCHED[13]);
export const auditTestTopicChanges = triggerFor(WATCHED[14]);
export const auditTestQuestionChanges = triggerFor(WATCHED[15]);

// ============================================================
// RECORDING
// ============================================================

async function record(
  collection: WatchedCollection,
  event: FirestoreAuthEvent<Change<DocumentSnapshot> | undefined, Record<string, string>>,
): Promise<void> {
  const before = event.data?.before?.exists ? event.data.before.data() ?? {} : null;
  const after = event.data?.after?.exists ? event.data.after.data() ?? {} : null;

  if (!before && !after) {
    return;
  }

  const current = after ?? before ?? {};

  if (collection.skip?.(current)) {
    return;
  }

  const organizationId =
    collection.organizationId(event.params, current) ??
    (before ? collection.organizationId(event.params, before) : null);

  if (!organizationId) {
    return;
  }

  const action: AuditAction = !before ? "created" : !after ? "deleted" : "updated";
  const changes = diff(before ?? {}, after ?? {});

  // Ignore writes that only touched bookkeeping fields.
  if (action === "updated" && changes.length === 0) {
    return;
  }

  const actor = await resolveActor(event, organizationId, before, after);
  const documentId = event.document.split("/").pop() ?? "";
  const label = collection.label(current, documentId);

  const entry = {
    organizationId,
    eventId: event.id,
    occurredAt: Timestamp.fromDate(new Date(event.time)),
    recordedAt: FieldValue.serverTimestamp(),
    expireAt: Timestamp.fromMillis(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000),

    action,
    entityType: collection.entityType,
    entityId: documentId,
    entityPath: event.document,
    entityLabel: shorten(label, 200),
    summary: summarize(collection.entityType, action, label, changes, after ?? before ?? {}),

    source: actor.source,
    actorType: actor.type,
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,

    changedFields: changes.map((change) => change.field).slice(0, MAX_FIELDS),
    changes: changes.slice(0, MAX_FIELDS),
    severity: severity(collection.entityType, action, changes),
  };

  // The event ID makes retries idempotent.
  await getFirestore()
    .collection("organizations")
    .doc(organizationId)
    .collection("auditLogs")
    .doc(event.id.replace(/\//g, "_"))
    .set(entry);
}

interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

function diff(before: DocumentData, after: DocumentData): FieldChange[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes: FieldChange[] = [];

  for (const field of [...fields].sort()) {
    if (NOISE_FIELDS.has(field) || field === "createdAt") {
      continue;
    }

    const left = normalize(before[field]);
    const right = normalize(after[field]);

    if (JSON.stringify(left) === JSON.stringify(right)) {
      continue;
    }

    if (SECRET_FIELDS.has(field)) {
      changes.push({ field, before: left === null ? null : "[hidden]", after: right === null ? null : "[hidden]" });
      continue;
    }

    if (BODY_FIELDS.has(field)) {
      changes.push({ field, before: lengthOf(before[field]), after: lengthOf(after[field]) });
      continue;
    }

    changes.push({ field, before: left, after: right });
  }

  return changes;
}

/** Converts Firestore values into small, readable JSON values. */
function normalize(value: unknown, depth = 0): unknown {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return shorten(value, MAX_VALUE_LENGTH);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth > 1) {
      return `[${value.length} items]`;
    }

    const items = value.slice(0, 10).map((item) => normalize(item, depth + 1));
    return value.length > 10 ? [...items, `…${value.length - 10} more`] : items;
  }

  if (typeof value === "object") {
    if ("path" in (value as object) && "firestore" in (value as object)) {
      return String((value as { path: string }).path);
    }

    if (depth > 1) {
      return "{…}";
    }

    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
      if (!SECRET_FIELDS.has(key)) {
        result[key] = normalize(item, depth + 1);
      }
    }

    return result;
  }

  return String(value);
}

function lengthOf(value: unknown): string | null {
  return typeof value === "string" && value ? `[${value.length} characters]` : null;
}

// ============================================================
// ACTOR
// ============================================================

interface Actor {
  source: AuditSource;
  type: "user" | "platform_admin" | "system";
  id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
}

const profileCache = new Map<string, { name: string | null; email: string | null; platformAdmin: boolean }>();

async function resolveActor(
  event: FirestoreAuthEvent<unknown, Record<string, string>>,
  organizationId: string,
  before: DocumentData | null,
  after: DocumentData | null,
): Promise<Actor> {
  let uid: string | null = null;

  if (event.authType === "app_user" && event.authId) {
    uid = event.authId;
  } else {
    // Written by a Cloud Function or job: use who the function says acted.
    for (const field of ACTOR_HINT_FIELDS) {
      const value = after?.[field];

      if (typeof value === "string" && value && !value.startsWith("system") && value !== before?.[field]) {
        uid = value;
        break;
      }
    }

    if (!uid && after && !before) {
      const creator = after.createdBy ?? after.requestedBy;
      uid = typeof creator === "string" && !creator.startsWith("system") ? creator : null;
    }
  }

  if (!uid) {
    return { source: "system", type: "system", id: null, name: "Zebron system", email: null, role: null };
  }

  const [profile, membership] = await Promise.all([
    loadProfile(uid),
    getFirestore().collection("organizationMemberships").doc(`${uid}_${organizationId}`).get(),
  ]);

  const membershipData = membership.data();
  const role = membership.exists && membershipData?.active === true ? text(membershipData.role) || null : null;

  // A Zebron admin acting without an organization role, or through a
  // Zebron-only function, is recorded as a platform action.
  const actingAsPlatform = profile.platformAdmin && (!role || event.authType !== "app_user");

  return {
    source: actingAsPlatform ? "platform" : "organization",
    type: actingAsPlatform ? "platform_admin" : "user",
    id: uid,
    name: profile.name,
    email: profile.email,
    role: actingAsPlatform ? "platform_admin" : role,
  };
}

async function loadProfile(uid: string) {
  const cached = profileCache.get(uid);

  if (cached) {
    return cached;
  }

  const data = (await getFirestore().collection("users").doc(uid).get()).data() ?? {};

  let name = text(data.displayName) || [text(data.firstName), text(data.lastName)].filter(Boolean).join(" ") || null;
  let email = text(data.email) || null;

  if (!name || !email) {
    try {
      const user = await getAuth().getUser(uid);
      name = name || text(user.displayName) || null;
      email = email || text(user.email) || null;
    } catch {
      // Deleted accounts keep their ID only.
    }
  }

  const profile = {
    name,
    email: email ? email.toLowerCase() : null,
    platformAdmin: data.platformRole === "platform-admin" || (data.platformRole === undefined && data.role === "admin"),
  };

  profileCache.set(uid, profile);

  return profile;
}

// ============================================================
// SUMMARY AND SEVERITY
// ============================================================

const ENTITY_LABELS: Record<string, string> = {
  organization: "Organization",
  membership: "Member",
  invitation: "Invitation",
  application: "Application",
  contract: "Contract",
  service_request: "Request to Zebron",
  announcement: "Dashboard banner",
  email_sent: "Email sent",
  email_received: "Email received",
  settings: "Settings",
  onboarding: "Onboarding",
  test_program: "Program",
  test_course: "Course",
  test_topic: "Topic",
  test_question: "Question",
};

function summarize(
  entityType: string,
  action: AuditAction,
  label: string,
  changes: FieldChange[],
  data: DocumentData,
): string {
  const entity = ENTITY_LABELS[entityType] ?? entityType;
  const name = shorten(label, 80);
  const change = (field: string) => changes.find((item) => item.field === field);

  if (entityType === "email_sent" && action === "created") {
    const to = Array.isArray(data.to) ? data.to.join(", ") : "";
    return `Email "${name}" sent to ${shorten(to, 120)}`;
  }

  if (entityType === "email_received" && action === "created") {
    return `Email "${name}" received from ${text(data.email) || "unknown sender"}`;
  }

  if (action === "created") {
    return `${entity} "${name}" created`;
  }

  if (action === "deleted") {
    return `${entity} "${name}" deleted`;
  }

  const role = change("role");
  if (role) {
    return `${entity} "${name}" role changed from ${role.before ?? "none"} to ${role.after ?? "none"}`;
  }

  const status = change("status");
  if (status) {
    return `${entity} "${name}" status changed from ${status.before ?? "none"} to ${status.after ?? "none"}`;
  }

  const active = change("active");
  if (active) {
    return `${entity} "${name}" ${active.after === true ? "activated" : "deactivated"}`;
  }

  const fields = changes.map((item) => item.field);
  return `${entity} "${name}" updated (${fields.slice(0, 5).join(", ")}${fields.length > 5 ? `, +${fields.length - 5} more` : ""})`;
}

function severity(entityType: string, action: AuditAction, changes: FieldChange[]): "info" | "notice" | "critical" {
  const fields = new Set(changes.map((change) => change.field));

  if (
    (entityType === "organization" && (fields.has("status") || fields.has("ownerUserId"))) ||
    (entityType === "contract" && fields.has("status")) ||
    (entityType === "membership" && (fields.has("role") || action === "deleted")) ||
    (entityType === "application" && fields.has("status"))
  ) {
    return "critical";
  }

  if (action === "deleted" || fields.has("status") || fields.has("active")) {
    return "notice";
  }

  return "info";
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function shorten(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

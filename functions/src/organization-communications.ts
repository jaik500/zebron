import { randomUUID } from "node:crypto";
 
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";
 
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
 
import * as logger from "firebase-functions/logger";
 
/**
 * Zebron Organization Communications
 *
 * Provides reusable, tenant-scoped communication capabilities:
 * - Look up organization members.
 * - Send individual or group emails.
 * - Record communication history and delivery outcomes.
 *
 * Intended future extensions:
 * - Instructor-to-student messaging.
 * - Course-specific audiences.
 * - Announcements.
 * - In-app notifications.
 * - Assignment and quiz invitations.
 */
 
const REGION = "us-central1";
 
const RESEND_API_URL = "https://api.resend.com/emails";
 
/**
 * Verified sending address. The display name in front of it is
 * dynamic (see buildFromHeader), but the address never changes,
 * so deliverability and domain verification are unaffected.
 */
const FROM_ADDRESS = "noreply@zebron.org";
 
/**
 * Name used when a communication is not sent on behalf of an
 * organization, or when the organization name cannot be resolved.
 */
const PLATFORM_SENDER_NAME = "Zebron";
 
const MAX_LOOKUP_RESULTS = 100;
const MAX_RECIPIENTS_PER_SEND = 50;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10_000;
const MAX_SENDER_NAME_LENGTH = 80;
 
const ORGANIZATION_ROLES = [
  "org_owner",
  "org_admin",
  "org_manager",
  "org_staff",
  "org_member",
] as const;
 
type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
 
type CommunicationType =
  | "direct"
  | "announcement"
  | "quiz_invitation"
  | "assignment_notification";
 
type CommunicationChannel = "email";
 
interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  email: string | null;
  displayName: string;
}
 
 
interface CommunicationRequest {
  organizationId?: unknown;
  type?: unknown;
  subject?: unknown;
  message?: unknown;
  recipientIds?: unknown;
  recipientEmails?: unknown;
  metadata?: unknown;
}
 
interface AuthorizedOrganizationUser {
  uid: string;
  role: OrganizationRole;
  organizationId: string;
 
  /**
   * Display name of the organization, used to sign and label
   * outgoing communications. Null when the organization document
   * has no usable name.
   */
  organizationName: string | null;
 
  /**
   * URL slug of the organization. Used to build the organization's
   * inbound address (org+<slug>@zebron.org) for Reply-To.
   */
  organizationSlug: string | null;
}
 
/**
 * Inbound addressing. Must match functions/src/inbound-email.ts.
 */
const INBOUND_DOMAIN = "zebron.org";
 
/**
 * Build the Reply-To address for an organization, or null when the
 * organization has no valid slug (replies then go nowhere special).
 */
function organizationReplyTo(slug: string | null): string | null {
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) {
    return null;
  }
 
  return `org+${slug}@${INBOUND_DOMAIN}`;
}
 
/**
 * Obtain the Admin SDK Firestore instance.
 */
function getDb() {
  return getFirestore();
}
 
/**
 * Normalize and validate a string.
 */
function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
 
/**
 * Validate an email address.
 *
 * This is basic syntactic validation, not proof that an address exists.
 */
function isValidEmail(email: string): boolean {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}
 
/**
 * Confirm that the supplied value is a supported organization role.
 */
function isOrganizationRole(
  value: unknown,
): value is OrganizationRole {
  return (
    typeof value === "string" &&
    ORGANIZATION_ROLES.includes(value as OrganizationRole)
  );
}
 
/**
 * Require a signed-in Firebase user.
 */
function requireAuthenticatedUser(
  uid: string | undefined,
): string {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in to use organization communications.",
    );
  }
 
  return uid;
}
 
// ============================================================
// SENDER IDENTITY
// ============================================================
 
/**
 * Extract a usable organization name from an organization document.
 *
 * Supports the field names used across Zebron's organization
 * records. Returns null when none is present.
 */
function extractOrganizationName(
  organization: Record<string, unknown> | undefined,
): string | null {
  const name =
    cleanString(organization?.name) ||
    cleanString(organization?.organizationName) ||
    cleanString(organization?.displayName);
 
  return name || null;
}
 
/**
 * Make a name safe for use as an email display name.
 *
 * Removes characters that could break or inject into the
 * RFC 5322 From header: quotes, angle brackets, commas,
 * semicolons, backslashes and line breaks.
 */
function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[\r\n"<>,;\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SENDER_NAME_LENGTH);
}
 
/**
 * Resolve the name used to sign and label a communication.
 *
 * - Sent from within an organization → the organization's name.
 * - Sent from the platform, or name unavailable → "Zebron".
 */
function resolveSenderName(
  organizationName: string | null | undefined,
): string {
  const safeName = sanitizeDisplayName(organizationName ?? "");
 
  return safeName || PLATFORM_SENDER_NAME;
}
 
/**
 * Build the From header.
 *
 * - Platform:      Zebron <noreply@zebron.org>
 * - Organization:  "Acme Academy via Zebron" <noreply@zebron.org>
 */
function buildFromHeader(senderName: string): string {
  if (senderName === PLATFORM_SENDER_NAME) {
    return `${PLATFORM_SENDER_NAME} <${FROM_ADDRESS}>`;
  }
 
  return `"${senderName} via ${PLATFORM_SENDER_NAME}" <${FROM_ADDRESS}>`;
}
 
/**
 * Append the standard sign-off to a message.
 */
function withSignature(
  message: string,
  senderName: string,
): string {
  return `${message.trimEnd()}\n\nThe ${senderName} Team`;
}
 
/**
 * Make a subject line safe for an email header.
 *
 * Line breaks are not allowed in a Subject header, so they are
 * collapsed into spaces.
 */
function cleanSubject(value: unknown): string {
  return cleanString(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
 
/**
 * Build the default subject line for a communication.
 *
 * - Organization:  [Acme Academy] Practice quiz invitation: Biology 101
 * - Platform:      Practice quiz invitation: Biology 101
 *
 * This is only a suggestion. The sender may edit it before sending,
 * and the server sends whatever subject the sender submits.
 */
function buildDefaultSubject(
  type: CommunicationType,
  senderName: string,
  metadata: Record<string, string | number | boolean>,
): string {
  const courseName = cleanSubject(metadata.courseName);
  const quizTitle = cleanSubject(metadata.quizTitle);
  const assignmentTitle = cleanSubject(metadata.assignmentTitle);
 
  let base: string;
 
  switch (type) {
    case "quiz_invitation":
      base = courseName
        ? `Practice quiz invitation: ${courseName}`
        : quizTitle
          ? `Practice quiz invitation: ${quizTitle}`
          : "Practice quiz invitation";
      break;
 
    case "assignment_notification":
      base = assignmentTitle
        ? `New assignment: ${assignmentTitle}`
        : "New assignment";
      break;
 
    case "announcement":
      base = "Announcement";
      break;
 
    case "direct":
    default:
      base = "Message";
      break;
  }
 
  const subject =
    senderName === PLATFORM_SENDER_NAME
      ? base
      : `[${senderName}] ${base}`;
 
  return subject.slice(0, MAX_SUBJECT_LENGTH);
}
 
const SUPPORTED_COMMUNICATION_TYPES: CommunicationType[] = [
  "direct",
  "announcement",
  "quiz_invitation",
  "assignment_notification",
];
 
function isCommunicationType(
  value: unknown,
): value is CommunicationType {
  return (
    typeof value === "string" &&
    SUPPORTED_COMMUNICATION_TYPES.includes(value as CommunicationType)
  );
}
 
// ============================================================
// AUTHORIZATION
// ============================================================
 
/**
 * Resolve the caller's active membership in an organization.
 *
 * Membership IDs follow the existing Zebron convention:
 * organizationMemberships/{userId}_{organizationId}
 *
 * Never trust a client-provided role.
 */
async function authorizeOrganizationUser(
  uid: string,
  organizationId: string,
): Promise<AuthorizedOrganizationUser> {
  const db = getDb();
 
  const membershipRef = db
    .collection("organizationMemberships")
    .doc(`${uid}_${organizationId}`);
 
  const [membershipSnapshot, organizationSnapshot] =
    await Promise.all([
      membershipRef.get(),
      db.collection("organizations").doc(organizationId).get(),
    ]);
 
  if (!organizationSnapshot.exists) {
    throw new HttpsError(
      "not-found",
      "The organization could not be found.",
    );
  }
 
  if (!membershipSnapshot.exists) {
    throw new HttpsError(
      "permission-denied",
      "You are not a member of this organization.",
    );
  }
 
  const membership = membershipSnapshot.data();
 
  if (
    membership?.userId !== uid ||
    membership?.organizationId !== organizationId ||
    membership?.active !== true ||
    !isOrganizationRole(membership?.role)
  ) {
    throw new HttpsError(
      "permission-denied",
      "You do not have an active organization membership.",
    );
  }
 
  const organization = organizationSnapshot.data();
 
  /**
   * Only active organizations may send communications.
   *
   * This intentionally fails closed for missing or unexpected
   * lifecycle states. Adjust this check only if the canonical
   * organization lifecycle explicitly permits another state.
   */
  const organizationStatus =
    cleanString(organization?.status) ||
    cleanString(organization?.lifecycleStatus);
 
  if (organizationStatus !== "active") {
    throw new HttpsError(
      "failed-precondition",
      "The organization must be active to send communications.",
    );
  }
 
  return {
    uid,
    role: membership.role,
    organizationId,
    organizationName: extractOrganizationName(organization),
    organizationSlug: cleanString(organization?.slug).toLowerCase() || null,
  };
}
 
/**
 * Organization-wide recipient lookup is restricted to
 * administrative and staff roles.
 *
 * Course-specific instructor permissions should be implemented
 * separately against the actual course enrollment/assignment
 * schema, rather than inferred from a client-supplied course ID.
 */
function requireMemberDirectoryPermission(
  role: OrganizationRole,
): void {
  if (
    role !== "org_owner" &&
    role !== "org_admin" &&
    role !== "org_manager" &&
    role !== "org_staff"
  ) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to access the organization member directory.",
    );
  }
}
 
/**
 * Only authorized organization staff may send group messages.
 *
 * Instructors can be supported through explicit course-level
 * authorization once the canonical course/instructor schema
 * has been connected.
 */
function requireGroupCommunicationPermission(
  role: OrganizationRole,
): void {
  if (
    role !== "org_owner" &&
    role !== "org_admin" &&
    role !== "org_manager" &&
    role !== "org_staff"
  ) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to send organization communications.",
    );
  }
}
 
// ============================================================
// MEMBERS
// ============================================================
 
/**
 * Resolve an email address from the organization membership,
 * Zebron user profile, or Firebase Authentication.
 *
 * Only return email addresses for members of the requested
 * organization.
 */
async function resolveMember(
  userId: string,
  organizationId: string,
): Promise<OrganizationMember | null> {
  const db = getDb();
 
  const membershipSnapshot = await db
    .collection("organizationMemberships")
    .doc(`${userId}_${organizationId}`)
    .get();
 
  if (!membershipSnapshot.exists) {
    return null;
  }
 
  const membership = membershipSnapshot.data();
 
  if (
    membership?.userId !== userId ||
    membership?.organizationId !== organizationId ||
    membership?.active !== true ||
    !isOrganizationRole(membership?.role)
  ) {
    return null;
  }
 
  const userSnapshot = await db
    .collection("users")
    .doc(userId)
    .get();
 
  const userProfile = userSnapshot.data();
 
  let email =
    cleanString(membership.email) ||
    cleanString(userProfile?.email);
 
  let displayName =
    cleanString(membership.displayName) ||
    cleanString(userProfile?.displayName) ||
    cleanString(userProfile?.name);
 
  /**
   * Use Firebase Authentication as a fallback if the profile
   * and membership documents do not contain an email address.
   */
  if (!email) {
    try {
      const authUser = await getAuth().getUser(userId);
 
      email = cleanString(authUser.email);
 
      if (!displayName) {
        displayName =
          cleanString(authUser.displayName) || userId;
      }
    } catch (error: unknown) {
      logger.warn("Unable to resolve organization member email.", {
        organizationId,
        userId,
        error,
      });
    }
  }
 
  return {
    userId,
    organizationId,
    role: membership.role,
    email: isValidEmail(email) ? email.toLowerCase() : null,
    displayName: displayName || userId,
  };
}
 
/**
 * Return the active members of an organization.
 *
 * Results are paginated using Firestore's document cursor.
 */
async function listOrganizationMembers(
  organizationId: string,
  limit: number,
  searchTerm = "",
): Promise<OrganizationMember[]> {
  const db = getDb();
 
  const snapshot = await db
    .collection("organizationMemberships")
    .where("organizationId", "==", organizationId)
    .where("active", "==", true)
    .limit(limit)
    .get();
 
  const members: OrganizationMember[] = [];
 
  for (const document of snapshot.docs) {
    const data = document.data();
 
    if (
      typeof data.userId !== "string" ||
      data.organizationId !== organizationId ||
      !isOrganizationRole(data.role)
    ) {
      continue;
    }
 
    const member = await resolveMember(
      data.userId,
      organizationId,
    );
 
    if (!member) {
      continue;
    }
 
    const normalizedSearch = searchTerm.toLowerCase();
 
    if (
      normalizedSearch &&
      !member.displayName.toLowerCase().includes(normalizedSearch) &&
      !(member.email ?? "").toLowerCase().includes(normalizedSearch)
    ) {
      continue;
    }
 
    members.push(member);
  }
 
  return members;
}
 
/**
 * Look up organization members for recipient selection.
 *
 * Callable name:
 * lookupCommunicationRecipients
 *
 * Request:
 * {
 *   organizationId: string,
 *   searchTerm?: string
 * }
 */
export const lookupCommunicationRecipients = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    const uid = requireAuthenticatedUser(request.auth?.uid);
 
    const organizationId = cleanString(
      request.data?.organizationId,
    );
 
    const searchTerm = cleanString(
      request.data?.searchTerm,
    ).slice(0, 100);
 
    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "Organization ID is required.",
      );
    }
 
    const caller = await authorizeOrganizationUser(
      uid,
      organizationId,
    );
 
    requireMemberDirectoryPermission(caller.role);
 
    const members = await listOrganizationMembers(
      organizationId,
      MAX_LOOKUP_RESULTS,
      searchTerm,
    );
 
    return {
      organizationId,
      members: members.map((member) => ({
        userId: member.userId,
        displayName: member.displayName,
        email: member.email,
        role: member.role,
      })),
    };
  },
);
 
// ============================================================
// EMAIL
// ============================================================
 
/**
 * Escape HTML characters before including user-generated content
 * in the email's HTML representation.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
 
/**
 * Convert plain text into readable HTML.
 */
function toEmailHtml(message: string): string {
  return escapeHtml(message).replace(/\r?\n/g, "<br>");
}
 
/**
 * Normalize an optional metadata object.
 *
 * Only a small, explicit set of safe scalar values is accepted.
 */
function sanitizeMetadata(
  value: unknown,
): Record<string, string | number | boolean> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }
 
  const source = value as Record<string, unknown>;
 
  const allowedKeys = [
    "courseId",
    "courseName",
    "quizId",
    "quizTitle",
    "assignmentId",
    "assignmentTitle",
    "resourceId",
  ];
 
  const result: Record<string, string | number | boolean> = {};
 
  for (const key of allowedKeys) {
    const item = source[key];
 
    if (
      typeof item === "string" &&
      item.trim().length <= 200
    ) {
      result[key] = item.trim();
    } else if (
      typeof item === "number" &&
      Number.isFinite(item)
    ) {
      result[key] = item;
    } else if (typeof item === "boolean") {
      result[key] = item;
    }
  }
 
  return result;
}
 
/**
 * Send one email through Resend.
 *
 * Each recipient receives a separate email. Recipient addresses
 * are never exposed to other recipients.
 */
async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  message: string,
  replyTo: string | null = null,
): Promise<string | null> {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `zebron-communication-${randomUUID()}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      // Replies go to the organization's inbound mailbox.
      ...(replyTo ? {reply_to: replyTo} : {}),
      subject,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${toEmailHtml(message)}</div>`,
    }),
  });
 
  const result = await response.json().catch(() => ({})) as {
    id?: unknown;
    message?: unknown;
  };
 
  if (!response.ok) {
    logger.error("Resend failed to send organization communication.", {
      status: response.status,
      responseMessage:
        typeof result.message === "string"
          ? result.message
          : undefined,
    });
 
    throw new Error(
      `Email provider returned HTTP ${response.status}.`,
    );
  }
 
  return typeof result.id === "string" ? result.id : null;
}
 
/**
 * Send organization communications.
 *
 * Callable name:
 * sendOrganizationCommunication
 *
 * Request:
 * {
 *   organizationId: string,
 *   type: "direct" | "announcement" |
 *         "quiz_invitation" | "assignment_notification",
 *   subject: string,
 *   message: string,
 *   recipientIds: string[]
 * }
 *
 * The server resolves every recipient against an active membership.
 * Client-supplied email addresses are not accepted as proof of
 * membership or authorization.
 *
 * The sign-off ("The <Organization> Team") and the sender display
 * name are added by the server. Clients should not include their
 * own signature in the message.
 */
export const sendOrganizationCommunication = onCall(
  {
    region: REGION,
    secrets: ["RESEND_API_KEY"],
    enforceAppCheck: false,
  },
  async (request) => {
    const uid = requireAuthenticatedUser(request.auth?.uid);
 
    const data = request.data as CommunicationRequest;
 
    const organizationId = cleanString(data?.organizationId);
 
    /**
     * The subject is sent exactly as the sender submitted it.
     * The default (with the organization prefix) is suggested by
     * getCommunicationDefaults and may be edited before sending.
     */
    const subject = cleanSubject(data?.subject);
    const message = cleanString(data?.message);
 
    const type = data?.type;
 
    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "Organization ID is required.",
      );
    }
 
    if (!isCommunicationType(type)) {
      throw new HttpsError(
        "invalid-argument",
        "A supported communication type is required.",
      );
    }
 
    if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Subject must contain between 1 and ${MAX_SUBJECT_LENGTH} characters.`,
      );
    }
 
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `Message must contain between 1 and ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }
 
    if (
      !Array.isArray(data?.recipientIds) ||
      data.recipientIds.length === 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Select at least one organization member.",
      );
    }
 
    if (data.recipientIds.length > MAX_RECIPIENTS_PER_SEND) {
      throw new HttpsError(
        "invalid-argument",
        `You can send to a maximum of ${MAX_RECIPIENTS_PER_SEND} recipients per request.`,
      );
    }
 
    const recipientIds = [
      ...new Set(
        data.recipientIds.map((value) =>
          cleanString(value),
        ),
      ),
    ];
 
    if (
      recipientIds.some(
        (recipientId) =>
          !recipientId ||
          recipientId.length > 200 ||
          recipientId.includes("/"),
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "One or more recipient IDs are invalid.",
      );
    }
 
    const caller = await authorizeOrganizationUser(
      uid,
      organizationId,
    );
 
    requireGroupCommunicationPermission(caller.role);
 
    const db = getDb();
 
    const apiKey = process.env.RESEND_API_KEY;
 
    if (!apiKey) {
      logger.error("RESEND_API_KEY is not configured.");
 
      throw new HttpsError(
        "failed-precondition",
        "Email delivery is not configured.",
      );
    }
 
    /**
     * Sender identity.
     *
     * Resolved from the organization document already loaded during
     * authorization, so no extra Firestore read is needed.
     */
    const senderName = resolveSenderName(caller.organizationName);
    const fromHeader = buildFromHeader(senderName);
    const signedMessage = withSignature(message, senderName);
    const replyTo = organizationReplyTo(caller.organizationSlug);
 
    /**
     * Resolve recipients from active organization memberships.
     *
     * No arbitrary email addresses are accepted from the client.
     */
    const resolvedMembers: OrganizationMember[] = [];
 
    for (const recipientId of recipientIds) {
      const member = await resolveMember(
        recipientId,
        organizationId,
      );
 
      if (!member) {
        throw new HttpsError(
          "invalid-argument",
          "A selected recipient is not an active member of this organization.",
        );
      }
 
      if (!member.email) {
        throw new HttpsError(
          "failed-precondition",
          "One or more selected members do not have a valid email address.",
        );
      }
 
      resolvedMembers.push(member);
    }
 
    const communicationRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("communications")
      .doc();
 
    const communicationId = communicationRef.id;
 
    const metadata = sanitizeMetadata(data.metadata);
 
    /**
     * Persist the communication before attempting delivery.
     *
     * `message` is stored exactly as the sender wrote it.
     * The signature and sender name are recorded separately.
     */
    await communicationRef.set({
      id: communicationId,
      organizationId,
      type: type as CommunicationType,
      channel: "email" as CommunicationChannel,
      subject,
      message,
      senderName,
      replyTo,
      metadata,
      recipientCount: resolvedMembers.length,
      recipientIds: resolvedMembers.map((member) => member.userId),
      createdBy: uid,
      createdByRole: caller.role,
      status: "sending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
 
    let sentCount = 0;
    let failedCount = 0;
 
    /**
     * Record each recipient's delivery result separately.
     *
     * This first version processes a maximum of 50 recipients
     * synchronously. A background queue should be added before
     * increasing the recipient limit substantially.
     */
    for (const member of resolvedMembers) {
      const deliveryRef = communicationRef
        .collection("deliveries")
        .doc(member.userId);
 
      const deliveryBase = {
        userId: member.userId,
        email: member.email,
        displayName: member.displayName,
        organizationId,
        communicationId,
        channel: "email" as CommunicationChannel,
        updatedAt: FieldValue.serverTimestamp(),
      };
 
      try {
        await deliveryRef.set({
          ...deliveryBase,
          status: "sending",
          createdAt: FieldValue.serverTimestamp(),
        });
 
        const providerMessageId = await sendEmail(
          apiKey,
          fromHeader,
          member.email!,
          subject,
          signedMessage,
          replyTo,
        );
 
        await deliveryRef.set(
          {
            ...deliveryBase,
            status: "sent",
            provider: "resend",
            providerMessageId,
            sentAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
 
        sentCount += 1;
      } catch (error: unknown) {
        logger.error("Organization communication delivery failed.", {
          organizationId,
          communicationId,
          recipientUserId: member.userId,
          error,
        });
 
        await deliveryRef.set(
          {
            ...deliveryBase,
            status: "failed",
            failureMessage: "Email delivery failed.",
            failedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
 
        failedCount += 1;
      }
    }
 
    let status: "sent" | "partial" | "failed";
 
    if (sentCount === resolvedMembers.length) {
      status = "sent";
    } else if (sentCount > 0) {
      status = "partial";
    } else {
      status = "failed";
    }
 
    await communicationRef.set(
      {
        status,
        sentCount,
        failedCount,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
 
    logger.info("Organization communication completed.", {
      organizationId,
      communicationId,
      createdBy: uid,
      type,
      senderName,
      recipientCount: resolvedMembers.length,
      sentCount,
      failedCount,
      status,
    });
 
    return {
      success: failedCount === 0,
      communicationId,
      status,
      senderName,
      recipientCount: resolvedMembers.length,
      sentCount,
      failedCount,
    };
  },
);
 
/**
 * Return the defaults used to pre-fill the compose form.
 *
 * Callable name:
 * getCommunicationDefaults
 *
 * Request:
 * {
 *   organizationId: string,
 *   type: "direct" | "announcement" |
 *         "quiz_invitation" | "assignment_notification",
 *   metadata?: { courseName?, quizTitle?, assignmentTitle?, ... }
 * }
 *
 * Response:
 * {
 *   senderName: string,   // "Acme Academy" or "Zebron"
 *   subject: string,      // "[Acme Academy] Practice quiz invitation: Biology 101"
 *   signature: string     // "The Acme Academy Team" (added automatically on send)
 * }
 *
 * Only users who may send communications can request defaults.
 */
export const getCommunicationDefaults = onCall(
  {
    region: REGION,
    enforceAppCheck: false,
  },
  async (request) => {
    const uid = requireAuthenticatedUser(request.auth?.uid);
 
    const organizationId = cleanString(request.data?.organizationId);
    const type = request.data?.type;
 
    if (!organizationId) {
      throw new HttpsError(
        "invalid-argument",
        "Organization ID is required.",
      );
    }
 
    if (!isCommunicationType(type)) {
      throw new HttpsError(
        "invalid-argument",
        "A supported communication type is required.",
      );
    }
 
    const caller = await authorizeOrganizationUser(
      uid,
      organizationId,
    );
 
    requireGroupCommunicationPermission(caller.role);
 
    const senderName = resolveSenderName(caller.organizationName);
    const metadata = sanitizeMetadata(request.data?.metadata);
 
    return {
      organizationId,
      type,
      senderName,
      subject: buildDefaultSubject(type, senderName, metadata),
      signature: `The ${senderName} Team`,
      // Where member replies will be delivered.
      replyTo: organizationReplyTo(caller.organizationSlug),
    };
  },
)
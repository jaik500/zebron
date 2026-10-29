import {getFirestore} from "firebase-admin/firestore";
import type {DocumentReference} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
 
const RESEND_API_URL = "https://api.resend.com/emails";
const ZEBRON_FROM_EMAIL = "Zebron <noreply@zebron.org>";
 
const OUTBOX_COLLECTION = "organizationEmailOutbox";
 
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 25;
 
const RETRY_DELAYS_MS = [
  60 * 1000, // 1 minute
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes
  60 * 60 * 1000, // 1 hour
];
 
/**
 * Maximum time one Resend request may take before it is aborted.
 */
const RESEND_TIMEOUT_MS = 10 * 1000;
 
/**
 * How long a worker owns a record it has claimed for sending.
 *
 * Must be longer than the scheduled function's timeout so a record is
 * never reclaimed while the run that claimed it is still alive. A record
 * whose lease has expired belongs to a run that crashed or timed out, and
 * is picked up again by a later run.
 */
const SENDING_LEASE_MS = 15 * 60 * 1000;
 
const WORKER_TIMEOUT_SECONDS = 540;
 
/**
 * Attempts made to record a successful delivery before giving up.
 */
const MARK_SENT_ATTEMPTS = 3;
 
/**
 * Production site used for links in emails. Override with the
 * APP_BASE_URL environment variable (for example on a staging site).
 */
const DEFAULT_APP_BASE_URL = "https://zebron.org";
 
const ACCEPT_INVITATION_PATH = "/organization/invitations/accept";
 
const EMAIL_TIME_ZONE = "America/New_York";
 
const ROLE_LABELS: Record<string, string> = {
  org_owner: "Organization Owner",
  org_admin: "Organization Admin",
  org_manager: "Organization Manager",
  org_staff: "Organization Staff",
  org_member: "Organization Member",
};
 
interface OrganizationEmailOutbox {
  id: string;
 
  type?: string;
 
  /**
   * pending: waiting to be sent (now or at nextAttemptAt).
   * sending: claimed by a worker until leaseExpiresAt.
   * sent: delivered to Resend.
   * failed: permanently undeliverable.
   */
  status?: string;
 
  invitationId?: string;
 
  organizationId?: string;
 
  organizationName?: string;
 
  recipientEmail?: string;
 
  /** Machine role code, for example "org_member". */
  role?: string;
 
  /** Readable role label, for example "Organization Member". */
  roleLabel?: string;
 
  subject?: string;
 
  text?: string;
 
  html?: string;
 
  attemptCount?: number;
 
  nextAttemptAt?: unknown;
 
  leaseExpiresAt?: unknown;
 
  sentAt?: unknown;
 
  lastAttemptAt?: unknown;
 
  lastError?: string | null;
 
  resendEmailId?: string;
 
  createdAt?: unknown;
 
  updatedAt?: unknown;
}
 
/**
 * Error for a delivery that will never succeed on retry, such as a
 * malformed outbox record or a 4xx response from Resend.
 */
export class PermanentEmailDeliveryError extends Error {
  /**
   * @param message Error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "PermanentEmailDeliveryError";
  }
}
 
/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */
 
/**
 * Converts a stored Firestore value (Timestamp or Date) to a Date.
 *
 * @param value Stored value.
 * @return The Date, or null when the value is not a date.
 */
function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
 
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as {toDate?: unknown}).toDate === "function"
  ) {
    return (value as {toDate: () => Date}).toDate();
  }
 
  return null;
}
 
/**
 * Reads a valid attempt count from an outbox record.
 *
 * @param outbox Outbox record.
 * @return The attempt count, or 0 when missing or invalid.
 */
function getAttemptCount(
  outbox: Pick<OrganizationEmailOutbox, "attemptCount">,
): number {
  return typeof outbox.attemptCount === "number" &&
    Number.isFinite(outbox.attemptCount) ?
    outbox.attemptCount :
    0;
}
 
/* -------------------------------------------------------------------------- */
/* Retry                                                                      */
/* -------------------------------------------------------------------------- */
 
/**
 * Calculates the retry delay for a failed email attempt.
 *
 * @param attemptCount Number of the failed delivery attempt.
 * @return Retry delay in milliseconds.
 */
function getRetryDelayMs(attemptCount: number): number {
  const index = Math.min(
    Math.max(attemptCount - 1, 0),
    RETRY_DELAYS_MS.length - 1,
  );
 
  return RETRY_DELAYS_MS[index];
}
 
/* -------------------------------------------------------------------------- */
/* Email content                                                              */
/* -------------------------------------------------------------------------- */
 
/**
 * Builds the organization invitation acceptance URL.
 *
 * @param invitationId Organization invitation identifier.
 * @return The invitation acceptance URL.
 */
function buildAcceptanceUrl(invitationId: string): string {
  const configuredBaseUrl =
    process.env["APP_BASE_URL"]?.trim();
 
  const baseUrl =
    (configuredBaseUrl || DEFAULT_APP_BASE_URL)
      .replace(/\/+$/, "");
 
  return (
    `${baseUrl}${ACCEPT_INVITATION_PATH}` +
    `?invitationId=${encodeURIComponent(invitationId)}`
  );
}
 
/**
 * Converts a stored role code into a readable label.
 *
 * Values that are already labels are returned unchanged.
 *
 * @param role Organization role code or label.
 * @return Readable role label.
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
 
/**
 * Formats the invitation expiration with an explicit time zone so the
 * recipient is not shown a bare server (UTC) time.
 *
 * Exported so tests can assert against exactly the same text the email
 * contains.
 *
 * @param expiresAt Invitation expiration date.
 * @return Readable expiration text.
 */
export function formatInvitationExpiration(expiresAt: Date): string {
  return expiresAt.toLocaleString("en-US", {
    timeZone: EMAIL_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
 
/**
 * Escapes text for safe use inside HTML content or attributes.
 *
 * @param value Untrusted text.
 * @return HTML-escaped text.
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
 * Builds the plain-text organization invitation email body.
 *
 * @param params.organizationName Organization name shown in the email.
 * @param params.roleLabel Readable organization role being granted.
 * @param params.expiresAt Invitation expiration date.
 * @param params.acceptanceUrl Link the recipient uses to accept.
 * @return Plain-text invitation email content.
 */
function buildInvitationText({
  organizationName,
  roleLabel,
  expiresAt,
  acceptanceUrl,
}: {
  organizationName: string;
  roleLabel: string;
  expiresAt: Date;
  acceptanceUrl: string;
}): string {
  return [
    "You have been invited to join an organization on Zebron.",
    "",
    `Organization: ${organizationName}`,
    `Role: ${roleLabel}`,
    `Invitation expires: ${formatInvitationExpiration(expiresAt)}`,
    "",
    "Accept your invitation:",
    acceptanceUrl,
    "",
    "If you did not expect this invitation, you can safely ignore this email.",
    "",
    "Zebron",
  ].join("\n");
}
 
/**
 * Builds the HTML organization invitation email body.
 *
 * The visible link text repeats the URL so the link is still available
 * to recipients whose email client hides or strips link styling.
 *
 * @param params.organizationName Organization name shown in the email.
 * @param params.roleLabel Readable organization role being granted.
 * @param params.expiresAt Invitation expiration date.
 * @param params.acceptanceUrl Link the recipient uses to accept.
 * @return HTML invitation email content.
 */
function buildInvitationHtml({
  organizationName,
  roleLabel,
  expiresAt,
  acceptanceUrl,
}: {
  organizationName: string;
  roleLabel: string;
  expiresAt: Date;
  acceptanceUrl: string;
}): string {
  const safeUrl = escapeHtml(acceptanceUrl);
 
  return [
    "<p>You have been invited to join an organization on Zebron.</p>",
    `<p><strong>Organization:</strong> ${escapeHtml(organizationName)}</p>`,
    `<p><strong>Role:</strong> ${escapeHtml(roleLabel)}</p>`,
    "<p><strong>Invitation expires:</strong> " +
      `${escapeHtml(formatInvitationExpiration(expiresAt))}</p>`,
    `<p><a href="${safeUrl}">Accept your invitation</a></p>`,
    "<p>If the button or link does not work, copy and paste this address " +
      `into your browser:<br>${safeUrl}</p>`,
    "<p>If you did not expect this invitation, you can safely ignore " +
      "this email.</p>",
    "<p>Zebron</p>",
  ].join("");
}
 
/* -------------------------------------------------------------------------- */
/* Outbox document creation                                                   */
/* -------------------------------------------------------------------------- */
 
/**
 * Creates the Firestore data for an organization invitation email.
 *
 * This function DOES NOT send an email.
 *
 * It is intended to be called from the same Firestore transaction
 * that creates or updates the organization invitation.
 *
 * The stored `role` is the machine role code (for example "org_member")
 * so it can be queried and compared. The readable `roleLabel` is stored
 * separately and is what the email shows.
 */
export function createOrganizationInvitationOutboxData({
  invitationId,
  organizationId,
  organizationName,
  recipientEmail,
  role,
  expiresAt,
  now = new Date(),
}: {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  recipientEmail: string;
  role: string;
  expiresAt: Date;
  now?: Date;
}) {
  const acceptanceUrl =
    buildAcceptanceUrl(invitationId);
 
  const roleLabel =
    getRoleDisplayName(role);
 
  const subject =
    `You're invited to join ${organizationName} on Zebron`;
 
  const text =
    buildInvitationText({
      organizationName,
      roleLabel,
      expiresAt,
      acceptanceUrl,
    });
 
  const html =
    buildInvitationHtml({
      organizationName,
      roleLabel,
      expiresAt,
      acceptanceUrl,
    });
 
  return {
    type: "organization_invitation",
 
    invitationId,
    organizationId,
 
    organizationName,
 
    recipientEmail,
 
    role,
 
    roleLabel,
 
    subject,
 
    text,
 
    html,
 
    status: "pending",
 
    attemptCount: 0,
 
    createdAt: now,
 
    updatedAt: now,
 
    sentAt: null,
 
    lastAttemptAt: null,
 
    nextAttemptAt: now,
 
    leaseExpiresAt: null,
 
    lastError: null,
  };
}
 
/* -------------------------------------------------------------------------- */
/* Resend delivery                                                            */
/* -------------------------------------------------------------------------- */
 
/**
 * Delivers one outbox email through Resend without touching Firestore.
 *
 * Kept separate from recording the result so the worker can tell
 * "Resend rejected the email" (retry) apart from "Resend accepted the
 * email but Firestore could not be updated" (never retry, or the
 * recipient gets the email twice).
 *
 * @param outbox Outbox record to deliver.
 * @return The Resend email ID, when Resend returned one.
 */
async function deliverOutboxEmail(
  outbox: OrganizationEmailOutbox,
): Promise<string | undefined> {
  const apiKey =
    process.env["RESEND_API_KEY"];
 
  // A missing key is a configuration problem that can be fixed, so it is
  // retried rather than treated as permanent.
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }
 
  if (!outbox.recipientEmail) {
    throw new PermanentEmailDeliveryError(
      "Outbox item is missing recipientEmail.",
    );
  }
 
  if (!outbox.subject) {
    throw new PermanentEmailDeliveryError(
      "Outbox item is missing subject.",
    );
  }
 
  if (!outbox.text) {
    throw new PermanentEmailDeliveryError(
      "Outbox item is missing text.",
    );
  }
 
  const response =
    await fetch(
      RESEND_API_URL,
      {
        method: "POST",
 
        headers: {
          "Authorization":
            `Bearer ${apiKey}`,
 
          "Content-Type":
            "application/json",
        },
 
        body: JSON.stringify({
          from: ZEBRON_FROM_EMAIL,
 
          to: [
            outbox.recipientEmail,
          ],
 
          subject:
            outbox.subject,
 
          text:
            outbox.text,
 
          ...(outbox.html ?
            {
              html:
                outbox.html,
            } :
            {}),
        }),
 
        signal:
          AbortSignal.timeout(
            RESEND_TIMEOUT_MS,
          ),
      },
    );
 
  const result =
    await response
      .json()
      .catch(() => ({}));
 
  if (!response.ok) {
    const message =
      `Resend returned HTTP ${response.status}: ` +
      `${JSON.stringify(result)}`;
 
    // 4xx means the request itself is wrong (bad address, unverified
    // domain, invalid key). Retrying will not help. 429 (rate limited)
    // and 5xx are temporary.
    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 429
    ) {
      throw new PermanentEmailDeliveryError(message);
    }
 
    throw new Error(message);
  }
 
  return typeof result?.id === "string" ?
    result.id :
    undefined;
}
 
/**
 * Records a successful delivery on the outbox record.
 *
 * @param outboxRef Outbox document reference.
 * @param now Delivery time.
 * @param resendEmailId Resend email ID, when available.
 */
async function markOutboxSent(
  outboxRef: DocumentReference,
  now: Date,
  resendEmailId: string | undefined,
): Promise<void> {
  await outboxRef.update({
    status: "sent",
 
    sentAt: now,
 
    lastAttemptAt: now,
 
    updatedAt: now,
 
    leaseExpiresAt: null,
 
    lastError: null,
 
    ...(resendEmailId ?
      {
        resendEmailId,
      } :
      {}),
  });
}
 
/**
 * Sends one organization email through Resend and marks it sent.
 *
 * This function is deliberately separate from the Firestore
 * transaction that creates or updates the invitation.
 */
export async function sendOrganizationEmailOutbox(
  outbox: OrganizationEmailOutbox,
  now: Date = new Date(),
): Promise<void> {
  const resendEmailId =
    await deliverOutboxEmail(outbox);
 
  const outboxRef =
    getFirestore()
      .collection(
        OUTBOX_COLLECTION,
      )
      .doc(outbox.id);
 
  await markOutboxSent(
    outboxRef,
    now,
    resendEmailId,
  );
}
 
/* -------------------------------------------------------------------------- */
/* Claiming                                                                   */
/* -------------------------------------------------------------------------- */
 
type ClaimResult =
  | {kind: "skipped"}
  | {kind: "exhausted"}
  | {
      kind: "claimed";
      outbox: OrganizationEmailOutbox;
      attemptNumber: number;
    };
 
/**
 * Whether a worker may take this record right now.
 *
 * @param outbox Outbox record.
 * @param now Current time.
 * @return True when the record is due and nobody else holds it.
 */
function isClaimable(
  outbox: OrganizationEmailOutbox,
  now: Date,
): boolean {
  if (outbox.status === "pending") {
    const nextAttemptAt =
      toDate(outbox.nextAttemptAt);
 
    return (
      nextAttemptAt === null ||
      nextAttemptAt.getTime() <= now.getTime()
    );
  }
 
  if (outbox.status === "sending") {
    const leaseExpiresAt =
      toDate(outbox.leaseExpiresAt);
 
    return (
      leaseExpiresAt === null ||
      leaseExpiresAt.getTime() <= now.getTime()
    );
  }
 
  return false;
}
 
/**
 * Atomically claims one outbox record for sending.
 *
 * The record is re-read inside a transaction, so if two worker runs
 * overlap, only one of them can move it to "sending". The other sees the
 * active lease and skips it.
 *
 * @param outboxRef Outbox document reference.
 * @param now Current time.
 * @return What happened to the record.
 */
async function claimOutboxRecord(
  outboxRef: DocumentReference,
  now: Date,
): Promise<ClaimResult> {
  const db =
    getFirestore();
 
  return db.runTransaction(
    async (transaction): Promise<ClaimResult> => {
      const snapshot =
        await transaction.get(
          outboxRef,
        );
 
      if (!snapshot.exists) {
        return {kind: "skipped"};
      }
 
      const outbox = {
        ...(snapshot.data() as Omit<OrganizationEmailOutbox, "id">),
        id: snapshot.id,
      };
 
      if (!isClaimable(outbox, now)) {
        return {kind: "skipped"};
      }
 
      const attemptCount =
        getAttemptCount(outbox);
 
      if (
        attemptCount >=
        MAX_ATTEMPTS
      ) {
        transaction.update(
          outboxRef,
          {
            status: "failed",
 
            lastAttemptAt: now,
 
            updatedAt: now,
 
            leaseExpiresAt: null,
 
            lastError:
              outbox.lastError ??
              "Maximum email delivery attempts exceeded.",
          },
        );
 
        return {kind: "exhausted"};
      }
 
      const attemptNumber =
        attemptCount + 1;
 
      transaction.update(
        outboxRef,
        {
          status: "sending",
 
          attemptCount:
            attemptNumber,
 
          lastAttemptAt:
            now,
 
          leaseExpiresAt:
            new Date(
              now.getTime() +
              SENDING_LEASE_MS,
            ),
 
          updatedAt:
            now,
        },
      );
 
      return {
        kind: "claimed",
        outbox: {
          ...outbox,
          attemptCount: attemptNumber,
        },
        attemptNumber,
      };
    },
  );
}
 
/**
 * Records a delivery failure: schedules a retry, or marks the record
 * failed when it is permanent or out of attempts.
 *
 * @param outboxRef Outbox document reference.
 * @param attemptNumber The attempt that just failed.
 * @param error The delivery error.
 * @param now Current time.
 */
async function recordDeliveryFailure(
  outboxRef: DocumentReference,
  attemptNumber: number,
  error: unknown,
  now: Date,
): Promise<void> {
  const message =
    error instanceof Error ?
      error.message :
      String(error);
 
  const permanent =
    error instanceof PermanentEmailDeliveryError ||
    attemptNumber >= MAX_ATTEMPTS;
 
  if (permanent) {
    await outboxRef.update({
      status: "failed",
 
      lastError:
        message,
 
      leaseExpiresAt:
        null,
 
      updatedAt:
        now,
    });
 
    return;
  }
 
  await outboxRef.update({
    status: "pending",
 
    nextAttemptAt:
      new Date(
        now.getTime() +
        getRetryDelayMs(
          attemptNumber,
        ),
      ),
 
    lastError:
      message,
 
    leaseExpiresAt:
      null,
 
    updatedAt:
      now,
  });
}
 
/**
 * Records a successful delivery, retrying the Firestore write a few
 * times. Never throws: the email has already gone out, so a failure
 * here must not trigger another send from this run.
 *
 * @param outboxRef Outbox document reference.
 * @param now Delivery time.
 * @param resendEmailId Resend email ID, when available.
 */
async function recordDeliverySuccess(
  outboxRef: DocumentReference,
  now: Date,
  resendEmailId: string | undefined,
): Promise<void> {
  for (
    let attempt = 1;
    attempt <= MARK_SENT_ATTEMPTS;
    attempt += 1
  ) {
    try {
      await markOutboxSent(
        outboxRef,
        now,
        resendEmailId,
      );
 
      return;
    } catch (error: unknown) {
      if (attempt === MARK_SENT_ATTEMPTS) {
        // The record stays "sending". It will be picked up again only
        // after its lease expires, which may send a duplicate. Logged as
        // an error so it can be found and fixed by hand.
        console.error(
          "Email was delivered but the outbox record " +
          "could not be marked sent.",
          {
            outboxId: outboxRef.id,
            resendEmailId,
            error:
              error instanceof Error ?
                error.message :
                String(error),
          },
        );
      }
    }
  }
}
 
/* -------------------------------------------------------------------------- */
/* Outbox worker                                                              */
/* -------------------------------------------------------------------------- */
 
/**
 * Processes due organization email outbox records.
 *
 * The worker:
 *
 * 1. Finds pending records whose retry time has arrived, and records
 *    stuck in "sending" whose lease has expired.
 * 2. Claims each one in a transaction (status "sending" plus a lease),
 *    which also increments the attempt count.
 * 3. Sends through Resend, with a request timeout.
 * 4. Marks successful deliveries as sent.
 * 5. Schedules temporary failures for retry.
 * 6. Marks permanent failures, and records out of attempts, as failed.
 *
 * Production needs two composite indexes on organizationEmailOutbox:
 * (status ASC, nextAttemptAt ASC) and (status ASC, leaseExpiresAt ASC).
 * The emulator does not enforce them.
 */
export async function processOrganizationEmailOutbox(
  now: Date = new Date(),
): Promise<{
  processed: number;
}> {
  const db =
    getFirestore();
 
  const outboxCollection =
    db.collection(
      OUTBOX_COLLECTION,
    );
 
  const [
    dueSnapshot,
    expiredLeaseSnapshot,
  ] = await Promise.all([
    outboxCollection
      .where("status", "==", "pending")
      .where("nextAttemptAt", "<=", now)
      .limit(BATCH_SIZE)
      .get(),
 
    outboxCollection
      .where("status", "==", "sending")
      .where("leaseExpiresAt", "<=", now)
      .limit(BATCH_SIZE)
      .get(),
  ]);
 
  const candidates =
    new Map<string, DocumentReference>();
 
  for (
    const document of [
      ...expiredLeaseSnapshot.docs,
      ...dueSnapshot.docs,
    ]
  ) {
    if (candidates.size >= BATCH_SIZE) {
      break;
    }
 
    candidates.set(
      document.id,
      document.ref,
    );
  }
 
  let processed = 0;
 
  for (
    const outboxRef of candidates.values()
  ) {
    const claim =
      await claimOutboxRecord(
        outboxRef,
        now,
      );
 
    if (claim.kind === "skipped") {
      continue;
    }
 
    if (claim.kind === "exhausted") {
      processed += 1;
 
      continue;
    }
 
    let resendEmailId: string | undefined;
 
    try {
      resendEmailId =
        await deliverOutboxEmail(
          claim.outbox,
        );
    } catch (error: unknown) {
      await recordDeliveryFailure(
        outboxRef,
        claim.attemptNumber,
        error,
        now,
      );
 
      processed += 1;
 
      continue;
    }
 
    await recordDeliverySuccess(
      outboxRef,
      now,
      resendEmailId,
    );
 
    processed += 1;
  }
 
  return {
    processed,
  };
}
 
/* -------------------------------------------------------------------------- */
/* Scheduled worker                                                           */
/* -------------------------------------------------------------------------- */
 
/**
 * Organization invitation email delivery worker.
 *
 * Runs independently from invitation creation/resend.
 *
 * The invitation transaction only creates the outbox record.
 * This scheduled worker is responsible for external email delivery.
 */
export const processOrganizationInvitationEmails =
  onSchedule(
    {
      schedule: "every 1 minutes",
 
      timeZone:
        "America/New_York",
 
      region:
        "us-central1",
 
      timeoutSeconds:
        WORKER_TIMEOUT_SECONDS,
 
      secrets: [
        "RESEND_API_KEY",
      ],
    },
 
    async () => {
      const result =
        await processOrganizationEmailOutbox();
 
      console.log(
        "Organization invitation email worker completed.",
        {
          processed:
            result.processed,
        },
      );
    },
  );
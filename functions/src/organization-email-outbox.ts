import {getFirestore} from "firebase-admin/firestore";
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

interface OrganizationEmailOutbox {
  id: string;

  type?: string;

  status?: string;

  invitationId?: string;

  organizationId?: string;

  organizationName?: string;

  recipientEmail?: string;

  role?: string;

  subject?: string;

  text?: string;

  html?: string;

  attemptCount?: number;

  nextAttemptAt?: unknown;

  sentAt?: unknown;

  lastAttemptAt?: unknown;

  lastError?: string;

  resendEmailId?: string;

  createdAt?: unknown;

  updatedAt?: unknown;
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

/**
 * Builds the organization invitation acceptance URL.
 *
 * @param invitationId Organization invitation identifier.
 * @return The invitation acceptance URL.
 */
function buildAcceptanceUrl(invitationId: string): string {
  return (
    "https://zebron.org/organization/invitations/accept" +
    `?invitationId=${encodeURIComponent(invitationId)}`
  );
}

/**
 * Builds the plain-text organization invitation email body.
 *
 * @param invitationId Organization invitation identifier.
 * @param organizationName Organization name displayed in the email.
 * @param role Organization role being granted.
 * @param expiresAt Invitation expiration date.
 * @return Plain-text invitation email content.
 */
function buildInvitationText({
  organizationName,
  role,
  expiresAt,
  acceptanceUrl,
}: {
  organizationName: string;
  role: string;
  expiresAt: Date;
  acceptanceUrl: string;
}): string {
  const expirationText =
    expiresAt.toLocaleString("en-US");

  return [
    "You have been invited to join an organization on Zebron.",
    "",
    `Organization: ${organizationName}`,
    `Role: ${role}`,
    `Invitation expires: ${expirationText}`,
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
 * @param invitationId Organization invitation identifier.
 * @param organizationName Organization name displayed in the email.
 * @param role Organization role being granted.
 * @param expiresAt Invitation expiration date.
 * @return HTML invitation email content.
 */
function buildInvitationHtml({
  organizationName,
  role,
  expiresAt,
  acceptanceUrl,
}: {
  organizationName: string;
  role: string;
  expiresAt: Date;
  acceptanceUrl: string;
}): string {
  const expirationText =
    expiresAt.toLocaleString("en-US");

  return [
    "<p>You have been invited to join an organization on Zebron.</p>",
    `<p><strong>Organization:</strong> ${organizationName}</p>`,
    `<p><strong>Role:</strong> ${role}</p>`,
    `<p><strong>Invitation expires:</strong> ${expirationText}</p>`,
    `<p><a href="${acceptanceUrl}">Accept your invitation</a></p>`,
    "<p>If you didn't expect this invitation, safely ignore this email.</p>",
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

  const subject =
    `You're invited to join ${organizationName} on Zebron`;

  const text =
    buildInvitationText({
      organizationName,
      role,
      expiresAt,
      acceptanceUrl,
    });

  const html =
    buildInvitationHtml({
      organizationName,
      role,
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

    lastError: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Resend delivery                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Sends one organization email through Resend.
 *
 * This function is deliberately separate from the Firestore
 * transaction that creates or updates the invitation.
 */
export async function sendOrganizationEmailOutbox(
  outbox: OrganizationEmailOutbox,
  now: Date = new Date(),
): Promise<void> {
  const apiKey =
    process.env["RESEND_API_KEY"];

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }

  if (!outbox.recipientEmail) {
    throw new Error(
      "Outbox item is missing recipientEmail.",
    );
  }

  if (!outbox.subject) {
    throw new Error(
      "Outbox item is missing subject.",
    );
  }

  if (!outbox.text) {
    throw new Error(
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
      },
    );

  const result =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Resend returned HTTP ${response.status}: ` +
      `${JSON.stringify(result)}`,
    );
  }

  const resendEmailId =
    typeof result?.id === "string" ?
      result.id :
      undefined;

  const db =
    getFirestore();

  const outboxRef =
    db
      .collection(
        OUTBOX_COLLECTION,
      )
      .doc(outbox.id);

  await outboxRef.update({
    status: "sent",

    sentAt: now,

    lastAttemptAt: now,

    updatedAt: now,

    ...(resendEmailId ?
      {
        resendEmailId,
      } :
      {}),
  });
}

/* -------------------------------------------------------------------------- */
/* Outbox worker                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Processes pending organization email outbox records.
 *
 * The worker:
 *
 * 1. Finds pending records whose retry time has arrived.
 * 2. Increments the attempt count.
 * 3. Sends through Resend.
 * 4. Marks successful deliveries as sent.
 * 5. Schedules failed deliveries for retry.
 * 6. Permanently marks records failed after MAX_ATTEMPTS.
 */
export async function processOrganizationEmailOutbox(
  now: Date = new Date(),
): Promise<{
  processed: number;
}> {
  const db =
    getFirestore();

  const snapshot =
    await db
      .collection(
        OUTBOX_COLLECTION,
      )
      .where(
        "status",
        "==",
        "pending",
      )
      .where(
        "nextAttemptAt",
        "<=",
        now,
      )
      .limit(BATCH_SIZE)
      .get();

  let processed = 0;

  for (
    const document of snapshot.docs
  ) {
    const outbox =
      document.data() as
        OrganizationEmailOutbox;

    const attemptCount =
      typeof outbox.attemptCount === "number" &&
      Number.isFinite(
        outbox.attemptCount,
      ) ?
        outbox.attemptCount :
        0;

    /* ---------------------------------------------------------------- */
    /* Maximum attempts                                                       */
    /* ---------------------------------------------------------------------- */

    if (
      attemptCount >=
      MAX_ATTEMPTS
    ) {
      await document.ref.update({
        status: "failed",

        lastAttemptAt: now,

        updatedAt: now,

        lastError:
          outbox.lastError ??
          "Maximum email delivery attempts exceeded.",
      });

      processed += 1;

      continue;
    }

    /* ---------------------------------------------------------------------- */
    /* Record attempt                                                         */
    /* ---------------------------------------------------------------------- */

    const nextAttemptNumber =
      attemptCount + 1;

    await document.ref.update({
      attemptCount:
        nextAttemptNumber,

      lastAttemptAt:
        now,

      updatedAt:
        now,
    });

    /* ---------------------------------------------------------------------- */
    /* Send                                                                   */
    /* ---------------------------------------------------------------------- */

    try {
      await sendOrganizationEmailOutbox(
        {
          ...outbox,

          id:
            document.id,

          attemptCount:
            nextAttemptNumber,
        },

        now,
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error ?
          error.message :
          String(error);

      /* -------------------------------------------------------------- */
      /* Permanent failure                                                   */
      /* --------------------------------------------------------------------*/

      if (
        nextAttemptNumber >=
        MAX_ATTEMPTS
      ) {
        await document.ref.update({
          status: "failed",

          lastError:
            message,

          updatedAt:
            now,
        });
      } else {
        /* ------------------------------------------------------------ */
        /* Retry                                                              */
        /* ------------------------------------------------------------------ */

        const retryAt =
          new Date(
            now.getTime() +
            getRetryDelayMs(
              nextAttemptNumber,
            ),
          );

        await document.ref.update({
          status: "pending",

          nextAttemptAt:
            retryAt,

          lastError:
            message,

          updatedAt:
            now,
        });
      }
    }

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

/* eslint-disable max-len */
import { randomUUID } from "node:crypto";

import { getAuth } from "firebase-admin/auth";
import {
  DocumentReference,
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { organizationInboundAddress } from "./inbound-email";

/**
 * Organization Mailbox: send email from an organization to any address.
 *
 * Callable: sendOrganizationMailboxEmail
 *
 * - Managers, admins and owners of an active organization (and
 *   platform administrators) can send.
 * - Mail goes out as "<Organization> via Zebron" <noreply@zebron.org>
 *   with Reply-To set to the organization's inbound address
 *   (org+<slug>@zebron.org), so replies land in its Inbox.
 * - Replies to an inbound message keep the email thread
 *   (In-Reply-To / References) and mark the message as replied.
 * - Every send is recorded in organizations/{id}/sentMessages.
 *
 * Limits protect the shared sending domain from abuse:
 * 10 recipients per email, 200 emails per organization per day.
 */

const REGION = "us-central1";
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "noreply@zebron.org";
const PLATFORM_SENDER_NAME = "Zebron";

const MAX_RECIPIENTS = 10;
const MAX_DAILY_SENDS = 200;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 20_000;
const MAX_SENDER_NAME_LENGTH = 80;

const MANAGER_ROLES = ["org_owner", "org_admin", "org_manager"];

interface MailboxSendRequest {
  organizationId?: unknown;
  to?: unknown;
  cc?: unknown;
  subject?: unknown;
  message?: unknown;
  /** ID of the inbound message being replied to, if any. */
  inReplyToMessageId?: unknown;
}

export const sendOrganizationMailboxEmail = onCall(
  {
    region: REGION,
    secrets: ["RESEND_API_KEY"],
    enforceAppCheck: false,
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to send email.",
      );
    }

    const data = (request.data ?? {}) as MailboxSendRequest;

    const organizationId = clean(data.organizationId);
    const subject = cleanSubject(data.subject);
    const message = clean(data.message);
    const to = cleanAddressList(data.to);
    const cc = cleanAddressList(data.cc).filter(
      (address) => !to.includes(address),
    );
    const inReplyToMessageId = clean(data.inReplyToMessageId);

    if (!organizationId) {
      throw new HttpsError("invalid-argument", "Organization ID is required.");
    }

    if (to.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Add at least one recipient.",
      );
    }

    const invalid = [...to, ...cc].filter((address) => !isValidEmail(address));

    if (invalid.length > 0) {
      throw new HttpsError(
        "invalid-argument",
        `These addresses are not valid: ${invalid.slice(0, 5).join(", ")}`,
      );
    }

    if (to.length + cc.length > MAX_RECIPIENTS) {
      throw new HttpsError(
        "invalid-argument",
        `You can send to at most ${MAX_RECIPIENTS} people per email.`,
      );
    }

    if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `The subject must be between 1 and ${MAX_SUBJECT_LENGTH} characters.`,
      );
    }

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `The message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`,
      );
    }

    if (inReplyToMessageId.includes("/")) {
      throw new HttpsError("invalid-argument", "Invalid message reference.");
    }

    const db = getFirestore();
    const organizationRef = db.collection("organizations").doc(organizationId);

    // ------------------------------------------------------------
    // Authorization
    // ------------------------------------------------------------
    const [organizationSnapshot, membershipSnapshot, profileSnapshot] =
      await Promise.all([
        organizationRef.get(),
        db
          .collection("organizationMemberships")
          .doc(`${uid}_${organizationId}`)
          .get(),
        db.collection("users").doc(uid).get(),
      ]);

    if (!organizationSnapshot.exists) {
      throw new HttpsError("not-found", "The organization could not be found.");
    }

    const profile = profileSnapshot.data() ?? {};
    const isPlatformAdmin =
      profile.platformRole === "platform-admin" ||
      (profile.platformRole === undefined && profile.role === "admin");

    const membership = membershipSnapshot.data();

    const isManager =
      membershipSnapshot.exists &&
      membership?.active === true &&
      MANAGER_ROLES.includes(String(membership?.role));

    if (!isPlatformAdmin && !isManager) {
      throw new HttpsError(
        "permission-denied",
        "Only managers, administrators and owners can send email from the mailbox.",
      );
    }

    const organization = organizationSnapshot.data() ?? {};
    const status = clean(organization.status) || "active";

    if (status !== "active") {
      throw new HttpsError(
        "failed-precondition",
        "The organization must be active to send email.",
      );
    }

    const slug = clean(organization.slug).toLowerCase();
    const replyTo = /^[a-z0-9][a-z0-9-]{0,99}$/.test(slug) ?
      organizationInboundAddress(slug) :
      null;

    // ------------------------------------------------------------
    // Daily limit
    // ------------------------------------------------------------
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const sentToday = await organizationRef
      .collection("sentMessages")
      .where("createdAt", ">=", Timestamp.fromDate(startOfDay))
      .count()
      .get();

    if (sentToday.data().count >= MAX_DAILY_SENDS) {
      throw new HttpsError(
        "resource-exhausted",
        `This organization has reached today's limit of ${MAX_DAILY_SENDS} emails. Try again tomorrow.`,
      );
    }

    // ------------------------------------------------------------
    // Thread (when replying)
    // ------------------------------------------------------------
    let inReplyToHeader: string | null = null;
    let inboundRef: DocumentReference | null = null;

    if (inReplyToMessageId) {
      inboundRef = organizationRef
        .collection("inboundMessages")
        .doc(inReplyToMessageId);

      const inbound = await inboundRef.get();

      if (!inbound.exists) {
        throw new HttpsError(
          "not-found",
          "The message you are replying to no longer exists.",
        );
      }

      const headerId = clean(inbound.data()?.messageId);
      inReplyToHeader = headerId ?
        (headerId.startsWith("<") ? headerId : `<${headerId}>`) :
        null;
    }

    // ------------------------------------------------------------
    // Send
    // ------------------------------------------------------------
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      logger.error("RESEND_API_KEY is not configured.");
      throw new HttpsError(
        "failed-precondition",
        "Email delivery is not configured.",
      );
    }

    const senderName = sanitizeDisplayName(
      clean(organization.name) ||
        clean(organization.organizationName) ||
        clean(organization.displayName),
    ) || PLATFORM_SENDER_NAME;

    const from = senderName === PLATFORM_SENDER_NAME ?
      `${PLATFORM_SENDER_NAME} <${FROM_ADDRESS}>` :
      `"${senderName} via ${PLATFORM_SENDER_NAME}" <${FROM_ADDRESS}>`;

    const signedMessage = `${message.trimEnd()}\n\nThe ${senderName} Team`;

    const sentRef = organizationRef.collection("sentMessages").doc();

    let authorName = clean(profile.displayName);
    let authorEmail = clean(profile.email);

    if (!authorName || !authorEmail) {
      try {
        const authUser = await getAuth().getUser(uid);
        authorName = authorName || clean(authUser.displayName);
        authorEmail = authorEmail || clean(authUser.email);
      } catch {
        // Author details are informational only.
      }
    }

    const record = {
      id: sentRef.id,
      organizationId,
      to,
      cc,
      subject,
      message,
      senderName,
      from,
      replyTo,
      inReplyToMessageId: inReplyToMessageId || null,
      createdBy: uid,
      createdByName: authorName || null,
      createdByEmail: authorEmail ? authorEmail.toLowerCase() : null,
      status: "sending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await sentRef.set(record);

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `zebron-mailbox-${sentRef.id}-${randomUUID()}`,
        },
        body: JSON.stringify({
          from,
          to,
          ...(cc.length > 0 ? {cc} : {}),
          ...(replyTo ? {reply_to: replyTo} : {}),
          subject,
          text: signedMessage,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${toHtml(signedMessage)}</div>`,
          ...(inReplyToHeader ?
            {
              headers: {
                "In-Reply-To": inReplyToHeader,
                "References": inReplyToHeader,
              },
            } :
            {}),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        id?: unknown;
        message?: unknown;
      };

      if (!response.ok) {
        logger.error("Resend rejected a mailbox email.", {
          organizationId,
          status: response.status,
          providerMessage: typeof result.message === "string" ?
            result.message :
            undefined,
        });

        throw new Error(`Email provider returned HTTP ${response.status}.`);
      }

      const providerMessageId = typeof result.id === "string" ? result.id : null;

      await sentRef.set(
        {
          status: "sent",
          provider: "resend",
          providerMessageId,
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

      if (inboundRef) {
        await inboundRef.set(
          {
            repliedAt: FieldValue.serverTimestamp(),
            lastReplyId: sentRef.id,
            status: "read",
            read: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          {merge: true},
        );
      }

      logger.info("Mailbox email sent.", {
        organizationId,
        sentMessageId: sentRef.id,
        recipientCount: to.length + cc.length,
        reply: Boolean(inboundRef),
      });

      return {
        success: true,
        sentMessageId: sentRef.id,
        senderName,
        replyTo,
      };
    } catch (error: unknown) {
      await sentRef.set(
        {
          status: "failed",
          failureMessage: "Email delivery failed.",
          failedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );

      logger.error("Mailbox email failed.", {organizationId, error});

      throw new HttpsError(
        "unavailable",
        "The email could not be sent. Please try again.",
      );
    }
  },
);

// ============================================================
// HELPERS
// ============================================================

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanSubject(value: unknown): string {
  return clean(value).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Accepts an array or a comma/semicolon separated string. */
function cleanAddressList(value: unknown): string[] {
  const parts = Array.isArray(value) ?
    value.map(clean) :
    clean(value).split(/[,;\s]+/);

  return [
    ...new Set(
      parts
        .map((part) => extractAddress(part).toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** "Jane Doe <jane@example.com>" -> "jane@example.com" */
function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email);
}

function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[\r\n"<>,;\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SENDER_NAME_LENGTH);
}

function toHtml(message: string): string {
  return message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r?\n/g, "<br>");
}

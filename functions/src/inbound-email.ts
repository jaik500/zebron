/* eslint-disable max-len */
 
/**
 * Zebron inbound email.
 *
 * Every address @zebron.org is delivered by Resend to this webhook.
 * Messages are routed by recipient address:
 *
 *   org+<organization-slug>@zebron.org
 *     → organizations/{organizationId}/inboundMessages/{emailId}
 *       (the organization's own mailbox; NOT forwarded to Gmail)
 *
 *   anything else, e.g. contact@zebron.org
 *     → contactMessages/{emailId}
 *       (the platform Contact Mailbox; forwarded to the admin Gmail)
 *
 * Mail to an unknown or archived organization falls back to the
 * platform mailbox so nothing is lost.
 *
 * Processing flow:
 *   1. Verify the Resend (Svix) webhook signature.
 *   2. Confirm the event is email.received.
 *   3. Retrieve the complete received email and attachment metadata.
 *   4. Resolve the destination mailbox.
 *   5. Store the message (idempotent: document ID = Resend email ID).
 *   6. Platform mailbox only: forward a copy to the admin Gmail.
 */
 
import "./firebase-admin";
 
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
 
// ============================================================
// CONFIGURATION
// ============================================================
 
/** Domain that receives inbound mail. */
export const INBOUND_DOMAIN = "zebron.org";
 
/** Platform (Zebron) inbound address. */
export const PLATFORM_INBOUND_ADDRESS = `contact@${INBOUND_DOMAIN}`;
 
/** Local-part prefix used for organization addresses: org+<slug>@zebron.org */
export const ORGANIZATION_ADDRESS_PREFIX = "org";
 
/** Sender used when forwarding platform mail to Gmail. */
const ZEBRON_FROM_EMAIL = "Zebron <noreply@zebron.org>";
 
/** Personal Gmail that receives a copy of platform inbound mail. */
const INBOUND_FORWARD_EMAIL = "jaik500@gmail.com";
 
/** Organizations in these states do not receive mail. */
const NON_RECEIVING_ORGANIZATION_STATUSES = ["archived"];
 
// ============================================================
// ADDRESS HELPERS
// ============================================================
 
/**
 * Build an organization's inbound address from its slug.
 *
 * Example: "acme-academy" → "org+acme-academy@zebron.org"
 */
export function organizationInboundAddress(slug: string): string {
  return `${ORGANIZATION_ADDRESS_PREFIX}+${slug}@${INBOUND_DOMAIN}`;
}
 
/**
 * Extract the bare email address from "Name <a@b>" or "a@b".
 */
function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
 
  return (match?.[1] ?? value).trim().toLowerCase();
}
 
/**
 * Return the organization slug addressed by a recipient,
 * or null when the recipient is not an organization address.
 */
function organizationSlugFromAddress(address: string): string | null {
  const [localPart, domain] = extractAddress(address).split("@");
 
  if (!localPart || domain !== INBOUND_DOMAIN) {
    return null;
  }
 
  const match = localPart.match(
    new RegExp(`^${ORGANIZATION_ADDRESS_PREFIX}\\+([a-z0-9][a-z0-9-]{0,99})$`),
  );
 
  return match?.[1] ?? null;
}
 
// ============================================================
// ROUTING
// ============================================================
 
type InboundDestination =
  | {
      mailbox: "organization";
      organizationId: string;
      organizationSlug: string;
      organizationName: string | null;
    }
  | {
      mailbox: "platform";
      routingNote: string | null;
    };
 
/**
 * Decide which mailbox an inbound message belongs to.
 *
 * The first recipient that matches an active organization wins.
 */
async function resolveDestination(
  recipients: string[],
): Promise<InboundDestination> {
  const db = getFirestore();
 
  const slugs = [
    ...new Set(
      recipients
        .map((recipient) => organizationSlugFromAddress(recipient))
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
 
  if (slugs.length === 0) {
    return {mailbox: "platform", routingNote: null};
  }
 
  for (const slug of slugs) {
    const snapshot = await db
      .collection("organizations")
      .where("slug", "==", slug)
      .limit(1)
      .get();
 
    const organization = snapshot.docs[0];
 
    if (!organization) {
      continue;
    }
 
    const data = organization.data();
    const status = typeof data["status"] === "string" ? data["status"] : "active";
 
    if (NON_RECEIVING_ORGANIZATION_STATUSES.includes(status)) {
      return {
        mailbox: "platform",
        routingNote: `Organization "${slug}" is ${status}; delivered to the platform mailbox.`,
      };
    }
 
    const name =
      (typeof data["name"] === "string" && data["name"].trim()) ||
      (typeof data["organizationName"] === "string" && data["organizationName"].trim()) ||
      null;
 
    return {
      mailbox: "organization",
      organizationId: organization.id,
      organizationSlug: slug,
      organizationName: name,
    };
  }
 
  return {
    mailbox: "platform",
    routingNote: `No organization matches ${slugs.map(organizationInboundAddress).join(", ")}; delivered to the platform mailbox.`,
  };
}
 
// ============================================================
// HTML
// ============================================================
 
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
 
// ============================================================
// WEBHOOK
// ============================================================
 
export const receiveInboundEmail = onRequest(
  {
    region: "us-central1",
    secrets: ["RESEND_API_KEY", "RESEND_WEBHOOK_SECRET"],
  },
 
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }
 
    try {
      // --------------------------------------------------------
      // 1. Verify the webhook signature against the raw body.
      // --------------------------------------------------------
 
      const rawBody =
        typeof request.rawBody === "string" ?
          request.rawBody :
          request.rawBody?.toString("utf8");
 
      if (!rawBody) {
        logger.error("Inbound email webhook has no raw request body.");
        response.status(400).send("Missing request body.");
        return;
      }
 
      const svixId = request.header("svix-id");
      const svixTimestamp = request.header("svix-timestamp");
      const svixSignature = request.header("svix-signature");
 
      if (!svixId || !svixTimestamp || !svixSignature) {
        logger.error("Inbound email webhook is missing signature headers.");
        response.status(401).send("Missing webhook signature.");
        return;
      }
 
      const webhookSecret = process.env["RESEND_WEBHOOK_SECRET"];
 
      if (!webhookSecret) {
        logger.error("RESEND_WEBHOOK_SECRET is not configured.");
        response.status(500).send("Webhook configuration error.");
        return;
      }
 
      const resendApiKey = process.env["RESEND_API_KEY"];
 
      if (!resendApiKey) {
        logger.error("RESEND_API_KEY is not configured.");
        response.status(500).send("Email configuration error.");
        return;
      }
 
      const {Resend} = await import("resend");
      const resend = new Resend(resendApiKey);
 
      const event = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
        webhookSecret,
      }) as {
        type?: string;
        created_at?: string;
        data?: {
          email_id?: string;
          created_at?: string;
          from?: string;
          to?: string[];
          cc?: string[];
          bcc?: string[];
          message_id?: string;
          subject?: string;
          attachments?: unknown[];
        };
      };
 
      // --------------------------------------------------------
      // 2. Only process inbound email events.
      // --------------------------------------------------------
 
      if (event.type !== "email.received") {
        response.status(200).json({success: true, ignored: true});
        return;
      }
 
      const webhookEmail = event.data;
 
      if (!webhookEmail?.email_id) {
        logger.error("Inbound email event has no email ID.");
        response.status(400).send("Missing email ID.");
        return;
      }
 
      const emailId = webhookEmail.email_id;
 
      // --------------------------------------------------------
      // 3. Retrieve the full email and attachment metadata.
      // --------------------------------------------------------
 
      const {data: receivedEmail, error: receiveError} =
        await resend.emails.receiving.get(emailId);
 
      if (receiveError || !receivedEmail) {
        logger.error("Unable to retrieve received email from Resend.", {
          emailId,
          error: receiveError,
        });
        response.status(502).send("Unable to retrieve received email.");
        return;
      }
 
      const {data: attachments, error: attachmentError} =
        await resend.emails.receiving.attachments.list({emailId});
 
      if (attachmentError) {
        logger.warn("Unable to retrieve inbound email attachments.", {
          emailId,
          error: attachmentError,
        });
      }
 
      const sender = receivedEmail.from ?? webhookEmail.from ?? "";
      const senderMatch = sender.match(/^(.*?)\s*<([^>]+)>$/);
      const senderName = senderMatch?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
      const senderEmail =
        senderMatch?.[2]?.trim().toLowerCase() ?? sender.trim().toLowerCase();
 
      if (!senderEmail) {
        logger.error("Inbound email does not contain a sender email address.", {emailId});
        response.status(400).send("Missing sender email address.");
        return;
      }
 
      const to: string[] = receivedEmail.to ?? webhookEmail.to ?? [];
      const cc: string[] = receivedEmail.cc ?? webhookEmail.cc ?? [];
      const bcc: string[] = receivedEmail.bcc ?? webhookEmail.bcc ?? [];
 
      const subject = (receivedEmail.subject ?? webhookEmail.subject ?? "").trim();
 
      const message =
        (receivedEmail.text ?? "").trim() ||
        (receivedEmail.html ?? "").trim();
 
      const messageId = receivedEmail.message_id ?? webhookEmail.message_id ?? null;
 
      // --------------------------------------------------------
      // 4. Resolve the destination mailbox.
      // --------------------------------------------------------
 
      const destination = await resolveDestination([...to, ...cc, ...bcc]);
 
      const db = getFirestore();
 
      const messageRef =
        destination.mailbox === "organization" ?
          db
            .collection("organizations")
            .doc(destination.organizationId)
            .collection("inboundMessages")
            .doc(emailId) :
          db.collection("contactMessages").doc(emailId);
 
      // --------------------------------------------------------
      // Idempotency: Resend retries webhooks.
      // --------------------------------------------------------
 
      const existing = await messageRef.get();
 
      if (existing.exists) {
        const alreadyComplete =
          destination.mailbox === "organization" ||
          Boolean(existing.data()?.["forwardedAt"]);
 
        if (alreadyComplete) {
          logger.info("Inbound email already processed.", {
            emailId,
            mailbox: destination.mailbox,
          });
          response.status(200).json({success: true, duplicate: true});
          return;
        }
 
        logger.info("Inbound email exists but forwarding has not completed.", {emailId});
      }
 
      // --------------------------------------------------------
      // 5. Store the message.
      // --------------------------------------------------------
 
      const baseRecord = {
        source: "email",
        provider: "resend",
        emailId,
        messageId,
 
        mailbox: destination.mailbox,
 
        name: senderName || senderEmail,
        email: senderEmail,
 
        from: sender,
        to,
        cc,
        bcc,
 
        subject,
        message,
        html: receivedEmail.html ?? "",
        headers: receivedEmail.headers ?? {},
        attachments: attachments ?? [],
 
        // The mailbox UIs use "new", "read" and "archived".
        status: "new",
        read: false,
        archived: false,
 
        createdAt: FieldValue.serverTimestamp(),
        receivedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
 
      if (destination.mailbox === "organization") {
        await messageRef.set(
          {
            ...baseRecord,
            organizationId: destination.organizationId,
            organizationSlug: destination.organizationSlug,
            organizationName: destination.organizationName,
            inboundAddress: organizationInboundAddress(destination.organizationSlug),
          },
          {merge: true},
        );
 
        logger.info("Inbound email stored in organization mailbox.", {
          emailId,
          organizationId: destination.organizationId,
          organizationSlug: destination.organizationSlug,
          senderEmail,
        });
 
        response.status(200).json({
          success: true,
          emailId,
          mailbox: "organization",
          organizationId: destination.organizationId,
        });
        return;
      }
 
      // Platform mailbox.
      await messageRef.set(
        {
          ...baseRecord,
          routingNote: destination.routingNote,
          forwardedTo: INBOUND_FORWARD_EMAIL,
          forwardedAt: null,
          forwardingEmailId: null,
        },
        {merge: true},
      );
 
      logger.info("Inbound email stored in platform mailbox.", {
        emailId,
        senderEmail,
        subject,
        routingNote: destination.routingNote,
      });
 
      // --------------------------------------------------------
      // 6. Forward platform mail to the admin Gmail.
      // --------------------------------------------------------
 
      const forwardedSubject = `[Zebron Inbox] ${subject || "(No subject)"}`;
 
      const escapedMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
 
      const routingHtml = destination.routingNote ?
        `<p style="color:#b45309;"><strong>Note:</strong> ${escapeHtml(destination.routingNote)}</p>` :
        "";
 
      const forwardedHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2>New inbound email</h2>
          ${routingHtml}
          <table cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td><strong>From:</strong></td>
              <td>${escapeHtml(senderName || senderEmail)} &lt;${escapeHtml(senderEmail)}&gt;</td>
            </tr>
            <tr>
              <td><strong>To:</strong></td>
              <td>${escapeHtml(to.join(", "))}</td>
            </tr>
            <tr>
              <td><strong>Subject:</strong></td>
              <td>${escapeHtml(subject || "(No subject)")}</td>
            </tr>
          </table>
          <hr />
          <div>${escapedMessage}</div>
          <hr />
          <p style="color: #777; font-size: 12px;">
            Automatically forwarded from the Zebron Contact Mailbox.
          </p>
        </div>
      `;
 
      const {data: forwardedEmail, error: forwardingError} =
        await resend.emails.send({
          from: ZEBRON_FROM_EMAIL,
          to: [INBOUND_FORWARD_EMAIL],
          subject: forwardedSubject,
          html: forwardedHtml,
 
          // Replying from Gmail goes to the original sender.
          replyTo: senderEmail,
 
          headers: messageId ?
            {"In-Reply-To": messageId, "References": messageId} :
            undefined,
        });
 
      if (forwardingError) {
        logger.error("Inbound email was stored, but Gmail forwarding failed.", {
          emailId,
          senderEmail,
          forwardingError,
        });
 
        await messageRef.update({
          forwardingError: String(forwardingError),
          updatedAt: FieldValue.serverTimestamp(),
        });
 
        // Ask Resend to retry the webhook.
        response.status(500).send("Email stored, but forwarding failed.");
        return;
      }
 
      await messageRef.update({
        forwardedAt: FieldValue.serverTimestamp(),
        forwardingEmailId: forwardedEmail?.id ?? null,
        forwardingError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
 
      logger.info("Inbound email forwarded successfully.", {
        emailId,
        senderEmail,
        forwardedTo: INBOUND_FORWARD_EMAIL,
        forwardingEmailId: forwardedEmail?.id ?? null,
      });
 
      response.status(200).json({
        success: true,
        emailId,
        mailbox: "platform",
        forwardedTo: INBOUND_FORWARD_EMAIL,
      });
    } catch (error: unknown) {
      logger.error("Failed to process inbound email webhook.", {error});
      response.status(500).send("Unable to process inbound email.");
    }
  },
);
 
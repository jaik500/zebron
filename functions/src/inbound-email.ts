/* eslint-disable max-len */
 
/**
 * Zebron inbound email.
 *
 * Every address @zebron.org is delivered by Resend to this webhook.
 * Messages are routed by recipient address:
 *
 *   <organization-slug>@zebron.org
 *     → organizations/{organizationId}/inboundMessages/{emailId}
 *       (the organization's main mailbox; NOT forwarded to Gmail)
 *
 *   <mailbox>.<organization-slug>@zebron.org
 *     → organizations/{organizationId}/mailboxes/{mailbox}/inboundMessages/{emailId}
 *       (a departmental mailbox such as admissions or hr; mail for a
 *       missing or turned-off mailbox goes to the main mailbox)
 *
 *   Older addresses keep working: org+<slug>@ and org+<slug>.<mailbox>@.
 *   Platform names (contact, support, noreply...) are reserved and never
 *   used as organization addresses; an organization whose slug is one of
 *   them keeps its org+<slug>@ address.
 *
 *   anything else, e.g. contact@zebron.org
 *     → contactMessages/{emailId}
 *       (the platform mailboxes: General, Support, Billing...)
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
 *   6. Platform mailbox only: forward a copy, if the mailbox has a
 *      "Forward a copy to" address (off by default: copies count
 *      toward the email allowance).
 */
 
import "./firebase-admin";
 
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

import {recordEmailUsage} from "./email-usage";
 
// ============================================================
// CONFIGURATION
// ============================================================
 
/** Domain that receives inbound mail. */
export const INBOUND_DOMAIN = "zebron.org";
 
/** Platform (Zebron) inbound address. */
export const PLATFORM_INBOUND_ADDRESS = `contact@${INBOUND_DOMAIN}`;
 
/** Prefix of the older organization addresses: org+<slug>@zebron.org (still accepted). */
export const ORGANIZATION_ADDRESS_PREFIX = "org";

/**
 * Address names kept for Zebron itself. Organizations cannot take these
 * as slugs (see organization-provisioning.ts), and mail to them always
 * goes to the platform mailbox.
 */
export const RESERVED_ADDRESS_NAMES: readonly string[] = [
  "abuse", "account", "accounts", "admin", "administrator", "alerts", "api", "app",
  "billing", "contact", "help", "hello", "hostmaster", "info", "legal", "mail",
  "mailer-daemon", "marketing", "news", "newsletter", "no-reply", "noreply",
  "notifications", "org", "partner", "partners", "postmaster", "privacy", "root",
  "sales", "security", "support", "system", "team", "webmaster", "www", "zebron",
];

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;
 
/** Sender used when forwarding platform mail to Gmail. */
const ZEBRON_FROM_EMAIL = "Zebron <noreply@zebron.org>";
 

// ============================================================
// PLATFORM MAILBOXES
// ============================================================

/**
 * Zebron's own mailboxes: platformMailboxes/{name}, where the name is a
 * reserved address name (support, billing, partners...). "contact" is
 * General: the contact form, contact@ and anything without its own
 * mailbox. Platform administrators manage them in the admin Mailbox.
 */
export const PLATFORM_GENERAL_MAILBOX = "contact";

/** Reserved names that can never be platform mailboxes (system addresses). */
const NON_MAILBOX_NAMES = ["noreply", "no-reply", "mailer-daemon", "org", "zebron", "www", "api", "app", "root", "system"];

export function isPlatformMailboxName(name: string): boolean {
  return RESERVED_ADDRESS_NAMES.includes(name) && !NON_MAILBOX_NAMES.includes(name);
}

interface PlatformMailboxConfig {
  mailboxId: string;
  name: string;
  /** Where a copy of each message goes, or null for none. */
  forwardTo: string | null;
}

async function platformMailboxConfig(mailboxId: string): Promise<PlatformMailboxConfig & {exists: boolean; active: boolean}> {
  const snapshot = await getFirestore().collection("platformMailboxes").doc(mailboxId).get();
  const data = snapshot.data() ?? {};
  const hasForwardSetting = typeof data["forwardTo"] === "string";

  const forwardTo = hasForwardSetting ? String(data["forwardTo"]).trim().toLowerCase() : "";

  return {
    mailboxId,
    exists: snapshot.exists,
    active: data["active"] !== false,
    name: typeof data["name"] === "string" && data["name"].trim() ? data["name"].trim() : (mailboxId === PLATFORM_GENERAL_MAILBOX ? "General" : mailboxId),
    // Copies are off unless an address is set in Manage mailboxes:
    // each copy is one more email against the free plan's allowance.
    forwardTo: hasForwardSetting && forwardTo ? forwardTo : null,
  };
}

/** Which platform mailbox a message to these recipients belongs to. */
async function resolvePlatformMailbox(recipients: string[]): Promise<PlatformMailboxConfig> {
  const names = [
    ...new Set(
      recipients
        .map((recipient) => extractAddress(recipient).split("@"))
        .filter(([, domain]) => domain === INBOUND_DOMAIN)
        .map(([localPart]) => localPart)
        .filter((localPart) => localPart !== PLATFORM_GENERAL_MAILBOX && isPlatformMailboxName(localPart)),
    ),
  ];

  for (const name of names) {
    const config = await platformMailboxConfig(name);
    if (config.exists && config.active) {
      return config;
    }
  }

  return platformMailboxConfig(PLATFORM_GENERAL_MAILBOX);
}

/**
 * Sender for email written in a platform mailbox: "Zebron Support"
 * <noreply@zebron.org>, replies to support@zebron.org.
 */
export async function platformMailboxSender(mailboxId: unknown): Promise<{mailboxId: string; from: string; replyTo: string}> {
  const requested = typeof mailboxId === "string" ? mailboxId.trim().toLowerCase() : "";
  const id = requested && isPlatformMailboxName(requested) ? requested : PLATFORM_GENERAL_MAILBOX;
  const config = await platformMailboxConfig(id);
  const usable = id === PLATFORM_GENERAL_MAILBOX || (config.exists && config.active);
  const finalId = usable ? id : PLATFORM_GENERAL_MAILBOX;
  const label = finalId === PLATFORM_GENERAL_MAILBOX ? "Zebron" : `Zebron ${config.name.replace(/[\r\n"<>,;\\]/g, " ").trim()}`;

  return {
    mailboxId: finalId,
    from: `"${label}" <noreply@${INBOUND_DOMAIN}>`,
    replyTo: `${finalId}@${INBOUND_DOMAIN}`,
  };
}
 
/** Organizations in these states do not receive mail. */
const NON_RECEIVING_ORGANIZATION_STATUSES = ["archived"];
 
// ============================================================
// ADDRESS HELPERS
// ============================================================
 
/**
 * Build an organization's inbound address from its slug.
 *
 * Example: "acme-academy" → "acme-academy@zebron.org"
 * (an older organization whose slug is a reserved name keeps "org+<slug>@").
 */
export function organizationInboundAddress(slug: string): string {
  return RESERVED_ADDRESS_NAMES.includes(slug) ?
    `${ORGANIZATION_ADDRESS_PREFIX}+${slug}@${INBOUND_DOMAIN}` :
    `${slug}@${INBOUND_DOMAIN}`;
}
 
/**
 * Build a departmental mailbox address.
 *
 * Example: ("acme-academy", "admissions") → "admissions.acme-academy@zebron.org"
 */
export function departmentInboundAddress(slug: string, mailboxKey: string): string {
  return `${mailboxKey}.${slug}@${INBOUND_DOMAIN}`;
}

/** Departmental mailbox keys: lowercase letters, digits and hyphens. */
export const MAILBOX_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * Extract the bare email address from "Name <a@b>" or "a@b".
 */
function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
 
  return (match?.[1] ?? value).trim().toLowerCase();
}
 
/**
 * Return the organization slug (and departmental mailbox, if any)
 * addressed by a recipient, or null when it is not an organization address.
 *
 *   acme-academy@                → {slug: "acme-academy", mailboxKey: null}
 *   admissions.acme-academy@     → {slug: "acme-academy", mailboxKey: "admissions"}
 *   org+acme-academy@            → older form, same as the first
 *   org+acme-academy.admissions@ → older form, same as the second
 *   contact@, support@ ...       → null (reserved for Zebron)
 */
function organizationAddressParts(address: string): {slug: string; mailboxKey: string | null} | null {
  const [localPart, domain] = extractAddress(address).split("@");

  if (!localPart || domain !== INBOUND_DOMAIN) {
    return null;
  }

  // Older form: org+<slug> or org+<slug>.<mailbox>
  const legacy = localPart.match(
    new RegExp(`^${ORGANIZATION_ADDRESS_PREFIX}\\+([a-z0-9][a-z0-9-]{0,99})(?:\\.([a-z0-9][a-z0-9-]{0,39}))?$`),
  );

  if (legacy) {
    return {slug: legacy[1], mailboxKey: legacy[2] ?? null};
  }

  // <mailbox>.<slug> (slugs never contain dots)
  const department = localPart.match(/^([a-z0-9][a-z0-9-]{0,39})\.([a-z0-9][a-z0-9-]{0,99})$/);

  if (department) {
    return {slug: department[2], mailboxKey: department[1]};
  }

  // <slug>, unless the name belongs to Zebron
  if (SLUG_PATTERN.test(localPart) && !RESERVED_ADDRESS_NAMES.includes(localPart)) {
    return {slug: localPart, mailboxKey: null};
  }

  return null;
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
      /** "main", or the departmental mailbox key. */
      mailboxId: string;
      mailboxName: string | null;
      routingNote: string | null;
    }
  | {
      mailbox: "platform";
      routingNote: string | null;
      /** Filled in after routing: the platform mailbox and its forwarding. */
      platformMailbox?: PlatformMailboxConfig;
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
 
  const targets = recipients
    .map((recipient) => organizationAddressParts(recipient))
    .filter((parts): parts is {slug: string; mailboxKey: string | null} => Boolean(parts));

  // One lookup per organization; departmental addresses first so a message
  // sent to both admissions and the main address lands in admissions.
  const seen = new Set<string>();
  const unique = [...targets]
    .sort((a, b) => Number(Boolean(b.mailboxKey)) - Number(Boolean(a.mailboxKey)))
    .filter((target) => {
      const key = `${target.slug}|${target.mailboxKey ?? ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

  if (unique.length === 0) {
    return {mailbox: "platform", routingNote: null};
  }

  for (const {slug, mailboxKey} of unique) {
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

    // Mailbox is on demand: without it, mail is kept in the platform mailbox.
    const mailboxEntitlement = await organization.ref.collection("applications").doc("mailbox").get();

    if (mailboxEntitlement.get("status") !== "active") {
      return {
        mailbox: "platform",
        routingNote: `Organization "${slug}" does not have the Mailbox; delivered to the platform mailbox.`,
      };
    }

    const name =
      (typeof data["name"] === "string" && data["name"].trim()) ||
      (typeof data["organizationName"] === "string" && data["organizationName"].trim()) ||
      null;

    let mailboxId = "main";
    let mailboxName: string | null = null;
    let routingNote: string | null = null;

    if (mailboxKey) {
      const mailbox = await organization.ref.collection("mailboxes").doc(mailboxKey).get();
      const mailboxData = mailbox.data();

      if (mailbox.exists && mailboxData?.["active"] !== false) {
        mailboxId = mailboxKey;
        mailboxName = typeof mailboxData?.["name"] === "string" ? mailboxData["name"] : mailboxKey;
      } else {
        routingNote = `Sent to ${departmentInboundAddress(slug, mailboxKey)}, which is not an active mailbox; delivered to the main mailbox.`;
      }
    }

    return {
      mailbox: "organization",
      organizationId: organization.id,
      organizationSlug: slug,
      organizationName: name,
      mailboxId,
      mailboxName,
      routingNote,
    };
  }

  return {
    mailbox: "platform",
    routingNote: `No organization matches ${unique.map((target) => target.mailboxKey ? departmentInboundAddress(target.slug, target.mailboxKey) : organizationInboundAddress(target.slug)).join(", ")}; delivered to the platform mailbox.`,
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

      if (destination.mailbox === "platform") {
        destination.platformMailbox = await resolvePlatformMailbox([...to, ...cc, ...bcc]);
      }
 
      const db = getFirestore();
 
      const organizationRef =
        destination.mailbox === "organization" ?
          db.collection("organizations").doc(destination.organizationId) :
          null;

      const messageRef =
        destination.mailbox === "organization" && organizationRef ?
          (destination.mailboxId === "main" ?
            organizationRef.collection("inboundMessages").doc(emailId) :
            organizationRef
              .collection("mailboxes")
              .doc(destination.mailboxId)
              .collection("inboundMessages")
              .doc(emailId)) :
          db.collection("contactMessages").doc(emailId);
 
      // --------------------------------------------------------
      // Idempotency: Resend retries webhooks.
      // --------------------------------------------------------
 
      const existing = await messageRef.get();
 
      if (existing.exists) {
        const alreadyComplete =
          destination.mailbox === "organization" ||
          Boolean(existing.data()?.["forwardedAt"]) ||
          existing.data()?.["forwardingSkipped"] === true;
 
        if (alreadyComplete) {
          logger.info("Inbound email already processed.", {
            emailId,
            mailbox: destination.mailbox,
          });
          response.status(200).json({success: true, duplicate: true});
          return;
        }
 
        logger.info("Inbound email exists but forwarding has not completed.", {emailId});
      } else {
        await recordEmailUsage("received", destination.mailbox === "organization" ? "organization_inbound" : "platform_inbound");
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
            mailboxId: destination.mailboxId,
            mailboxName: destination.mailboxName,
            routingNote: destination.routingNote,
            inboundAddress: destination.mailboxId === "main" ?
              organizationInboundAddress(destination.organizationSlug) :
              departmentInboundAddress(destination.organizationSlug, destination.mailboxId),
          },
          {merge: true},
        );
 
        logger.info("Inbound email stored in organization mailbox.", {
          emailId,
          organizationId: destination.organizationId,
          organizationSlug: destination.organizationSlug,
          mailboxId: destination.mailboxId,
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
      const platformMailbox = destination.platformMailbox ?? await platformMailboxConfig(PLATFORM_GENERAL_MAILBOX);
      const forwardTo = platformMailbox.forwardTo;

      await messageRef.set(
        {
          ...baseRecord,
          // The admin mailbox uses "unread" for new messages.
          status: "unread",
          mailboxId: platformMailbox.mailboxId,
          mailboxName: platformMailbox.name,
          routingNote: destination.routingNote,
          forwardedTo: forwardTo,
          forwardedAt: null,
          forwardingEmailId: null,
          forwardingSkipped: !forwardTo,
        },
        {merge: true},
      );

      logger.info("Inbound email stored in platform mailbox.", {
        emailId,
        senderEmail,
        subject,
        mailboxId: platformMailbox.mailboxId,
        routingNote: destination.routingNote,
      });

      // No copy configured for this mailbox: done.
      if (!forwardTo) {
        response.status(200).json({success: true, emailId, mailbox: "platform", mailboxId: platformMailbox.mailboxId});
        return;
      }
 
      // --------------------------------------------------------
      // 6. Forward a copy, when the mailbox asks for one.
      // --------------------------------------------------------
 
      const forwardedSubject = `[Zebron ${platformMailbox.name}] ${subject || "(No subject)"}`;
 
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
            Automatically forwarded from the Zebron ${escapeHtml(platformMailbox.name)} mailbox.
          </p>
        </div>
      `;
 
      const {data: forwardedEmail, error: forwardingError} =
        await resend.emails.send({
          from: ZEBRON_FROM_EMAIL,
          to: [forwardTo],
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
 
      await recordEmailUsage("sent", "platform_inbound_forward");

      await messageRef.update({
        forwardedAt: FieldValue.serverTimestamp(),
        forwardingEmailId: forwardedEmail?.id ?? null,
        forwardingError: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
 
      logger.info("Inbound email forwarded successfully.", {
        emailId,
        senderEmail,
        forwardedTo: forwardTo,
        forwardingEmailId: forwardedEmail?.id ?? null,
      });
 
      response.status(200).json({
        success: true,
        emailId,
        mailbox: "platform",
        mailboxId: platformMailbox.mailboxId,
        forwardedTo: forwardTo,
      });
    } catch (error: unknown) {
      logger.error("Failed to process inbound email webhook.", {error});
      response.status(500).send("Unable to process inbound email.");
    }
  },
);
 
/* eslint-disable max-len */
import { getAuth } from "firebase-admin/auth";
import { randomInt } from "node:crypto";
import {
  DocumentData,
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { isPlatformAdministrator } from "./platform-admin-authorization";
import { recordEmailUsage } from "./email-usage";

/**
 * Zebron Support Tickets
 *
 * Anyone (signed in or not) can open a ticket from the public Help page.
 * - Personal tickets: visible to the requester (by account, or by the
 *   verified email they used) and to Zebron staff.
 * - Organization tickets: opened by an organization's managers, admins or
 *   owners; visible to all of that organization's managers and above.
 * - Zebron staff are platform administrators. They see every ticket,
 *   reply, add internal notes, assign, and change status and priority.
 *
 * Who handles a ticket (handledBy):
 * - "zebron" (the default, and every ticket before this field existed):
 *   Zebron Support answers it.
 * - "organization": a member asked their own organization (courses,
 *   cohorts, access, grades). The organization's managers, admins and
 *   owners answer it from Administration → Support Tickets, with the same
 *   tools as Zebron staff (status, priority, assignment, internal notes).
 *   It isn't in Zebron's queue. They can escalate it to Zebron, which turns
 *   it into a "zebron" ticket the organization keeps following.
 *
 * Internal notes carry an audience: "zebron" (Zebron staff only; notes
 * without one), "organization" (that organization's handlers only), or
 * "shared" (both, never the requester; used for escalation notes).
 *
 * Data (server-only; clients have no direct Firestore access):
 *   supportTickets/{id}
 *   supportTickets/{id}/messages/{id}
 *
 * Ticket numbers look like ZB-261030-7K4QXM (date + random code). Older
 * tickets keep their ZB-1001 style numbers; counters/supportTickets is
 * no longer written.
 *
 * Status: open -> in_progress -> waiting_on_requester -> resolved -> closed
 * Resolved tickets close automatically after 7 days without a reply.
 */

const REGION = "us-central1";

/** Letters and digits that are hard to confuse (no 0/O, 1/I/L). */
const TICKET_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Human-friendly ticket number: ZB-YYMMDD-XXXXXX (about 887 million codes
 * per day). The ticket's document ID is the real unique key; the number is
 * for people, and a repeat on the same day is vanishingly rare.
 *
 * @param {Date} date Creation date (UTC).
 * @return {string} Ticket number.
 */
export function ticketNumberFor(date: Date): string {
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, "");
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += TICKET_CODE_ALPHABET[randomInt(TICKET_CODE_ALPHABET.length)];
  }
  return `ZB-${yymmdd}-${code}`;
}
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "Zebron Support <noreply@zebron.org>";
const SUPPORT_INBOX = "contact@zebron.org";
const SITE_URL = "https://zebron.org";

const AUTO_CLOSE_DAYS = 7;
const MAX_SUBJECT = 150;
const MAX_BODY = 10_000;
const GUEST_DAILY_LIMIT = 5;
const USER_DAILY_LIMIT = 20;

const MANAGER_ROLES = ["org_owner", "org_admin", "org_manager"];

export const TICKET_CATEGORIES = [
  "technical_issue",
  "account_access",
  "billing",
  "application_request",
  "content",
  "feature_request",
  "security",
  "other",
] as const;

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_on_requester",
  "resolved",
  "closed",
] as const;

type Category = (typeof TICKET_CATEGORIES)[number];
type HandledBy = "zebron" | "organization";
type NoteAudience = "zebron" | "organization" | "shared";

function handledByOf(ticket: DocumentData): HandledBy {
  return ticket.handledBy === "organization" ? "organization" : "zebron";
}
type Priority = (typeof TICKET_PRIORITIES)[number];
type Status = (typeof TICKET_STATUSES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  technical_issue: "Technical issue",
  account_access: "Account & sign-in",
  billing: "Billing",
  application_request: "Application or service request",
  content: "Content or data",
  feature_request: "Feature request",
  security: "Security concern",
  other: "Other",
};

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_requester: "Waiting for your reply",
  resolved: "Resolved",
  closed: "Closed",
};

const db = () => getFirestore();
const tickets = () => db().collection("supportTickets");

// ============================================================
// CALLER
// ============================================================

interface Caller {
  uid: string | null;
  name: string;
  email: string;
  emailVerified: boolean;
  isStaff: boolean;
}

async function loadCaller(request: CallableRequest<unknown>): Promise<Caller> {
  const uid = request.auth?.uid ?? null;

  if (!uid) {
    return { uid: null, name: "", email: "", emailVerified: false, isStaff: false };
  }

  const [isStaff, profileSnapshot] = await Promise.all([
    isPlatformAdministrator(request),
    db().collection("users").doc(uid).get(),
  ]);

  const profile = profileSnapshot.data() ?? {};

  return {
    uid,
    name: clean(profile.displayName) || joinName(profile.firstName, profile.lastName) || clean(request.auth?.token.name),
    email: (clean(request.auth?.token.email) || clean(profile.email)).toLowerCase(),
    emailVerified: request.auth?.token.email_verified === true,
    isStaff,
  };
}

function requireSignedIn(caller: Caller): asserts caller is Caller & { uid: string } {
  if (!caller.uid) {
    throw new HttpsError("unauthenticated", "Sign in to view your tickets.");
  }
}

async function managerOrganizations(uid: string): Promise<Map<string, string>> {
  const memberships = await db().collection("organizationMemberships").where("userId", "==", uid).get();
  const result = new Map<string, string>();

  for (const document of memberships.docs) {
    const data = document.data();

    if (data.active === true && MANAGER_ROLES.includes(clean(data.role))) {
      result.set(clean(data.organizationId), clean(data.role));
    }
  }

  return result;
}

/** Organizations the person is an active member of (any role), with names. */
async function memberOrganizations(uid: string): Promise<{ id: string; name: string; manager: boolean }[]> {
  const memberships = await db().collection("organizationMemberships").where("userId", "==", uid).get();
  const active = memberships.docs
    .map((document) => document.data())
    .filter((data) => data.active === true && clean(data.organizationId))
    .slice(0, 20);
  const organizations = await Promise.all(active.map((data) => db().collection("organizations").doc(clean(data.organizationId)).get()));

  return active
    .map((data, index) => ({
      id: clean(data.organizationId),
      name: clean(organizations[index].data()?.name) || "Organization",
      manager: MANAGER_ROLES.includes(clean(data.role)),
      exists: organizations[index].exists,
    }))
    .filter((organization) => organization.exists)
    .map(({ id, name, manager }) => ({ id, name, manager }));
}

type Access = "staff" | "requester" | "organization" | null;

/**
 * Who answers on this ticket: Zebron staff always may; an organization's
 * managers do for tickets their organization handles.
 */
function isHandler(access: Access, ticket: DocumentData): boolean {
  return access === "staff" || (access === "organization" && handledByOf(ticket) === "organization");
}

/** Internal notes and private events the caller may see. */
function canSeeInternal(access: Access, message: DocumentData): boolean {
  const audience = clean(message.audience) || "zebron";
  if (access === "staff") return audience === "zebron" || audience === "shared";
  if (access === "organization") return audience === "organization" || audience === "shared";
  return false;
}

async function accessTo(caller: Caller, ticket: DocumentData): Promise<Access> {
  if (caller.isStaff) {
    return "staff";
  }

  if (!caller.uid) {
    return null;
  }

  if (ticket.requesterUid === caller.uid) {
    return "requester";
  }

  if (caller.emailVerified && caller.email && ticket.requesterEmail === caller.email) {
    return "requester";
  }

  const organizationId = clean(ticket.organizationId);

  if (organizationId) {
    const membership = await db().collection("organizationMemberships").doc(`${caller.uid}_${organizationId}`).get();
    const data = membership.data();

    if (membership.exists && data?.active === true && MANAGER_ROLES.includes(clean(data.role))) {
      return "organization";
    }
  }

  return null;
}

// ============================================================
// CREATE
// ============================================================

export const createSupportTicket = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const data = (request.data ?? {}) as Record<string, unknown>;
    const caller = await loadCaller(request);

    // Honeypot for bots on the public form.
    if (clean(data.website)) {
      return { ticketId: null, ticketNumber: null };
    }

    const subject = clean(data.subject).replace(/[\r\n]+/g, " ").slice(0, MAX_SUBJECT);
    const description = clean(data.description).slice(0, MAX_BODY);
    const category = clean(data.category) as Category;
    const priority = (clean(data.priority) || "normal") as Priority;
    const organizationId = clean(data.organizationId) || null;
    const handledBy: HandledBy = data.handledBy === "organization" ? "organization" : "zebron";
    const pageUrl = clean(data.pageUrl).slice(0, 500) || null;
    const userAgent = clean(data.userAgent).slice(0, 300) || null;

    if (!subject || subject.length < 4) {
      throw new HttpsError("invalid-argument", "Add a short subject (at least 4 characters).");
    }

    if (!description || description.length < 10) {
      throw new HttpsError("invalid-argument", "Describe the issue in a little more detail (at least 10 characters).");
    }

    if (!TICKET_CATEGORIES.includes(category)) {
      throw new HttpsError("invalid-argument", "Choose a category.");
    }

    if (!TICKET_PRIORITIES.includes(priority)) {
      throw new HttpsError("invalid-argument", "Choose a valid priority.");
    }

    // Guests give their name and email; signed-in users use their account.
    const name = caller.uid ? caller.name || clean(data.name) : clean(data.name).slice(0, 120);
    const email = (caller.uid ? caller.email || clean(data.email) : clean(data.email)).toLowerCase().slice(0, 254);

    if (!name) {
      throw new HttpsError("invalid-argument", "Please tell us your name.");
    }

    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) {
      throw new HttpsError("invalid-argument", "Enter a valid email so we can reply.");
    }

    // Organization tickets: managers and above of that organization only.
    let organizationName: string | null = null;

    if (handledBy === "organization") {
      // Any active member can ask their own organization.
      if (!caller.uid) {
        throw new HttpsError("unauthenticated", "Sign in to send a request to your organization.");
      }
      if (!organizationId) {
        throw new HttpsError("invalid-argument", "Choose your organization.");
      }
      const membership = await db().collection("organizationMemberships").doc(`${caller.uid}_${organizationId}`).get();
      if (membership.get("active") !== true) {
        throw new HttpsError("permission-denied", "You can only send requests to an organization you belong to.");
      }
    }

    if (organizationId) {
      if (!caller.uid) {
        throw new HttpsError("unauthenticated", "Sign in to open a ticket for an organization.");
      }

      if (!caller.isStaff && handledBy === "zebron") {
        const organizations = await managerOrganizations(caller.uid);

        if (!organizations.has(organizationId)) {
          throw new HttpsError("permission-denied", "Only managers, admins and owners can open tickets for an organization.");
        }
      }

      const organization = await db().collection("organizations").doc(organizationId).get();

      if (!organization.exists) {
        throw new HttpsError("not-found", "The organization could not be found.");
      }

      organizationName = clean(organization.data()?.name) || "Organization";
    }

    // Rate limit.
    const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await (caller.uid ?
      tickets().where("requesterUid", "==", caller.uid).where("createdAt", ">=", since) :
      tickets().where("requesterEmail", "==", email).where("createdAt", ">=", since)
    ).count().get();

    if (recent.data().count >= (caller.uid ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT)) {
      throw new HttpsError("resource-exhausted", "You've opened several tickets today. Please add to an existing ticket, or try again tomorrow.");
    }

    // Ticket number: date + random code (e.g. ZB-261030-7K4QXM). No shared
    // counter document, so ticket creation never queues behind other
    // tickets. The document ID stays the unique key; the number is for people.
    const ticketRef = tickets().doc();
    const number = ticketNumberFor(new Date());
    const batch = db().batch();

    {
      batch.set(ticketRef, {
        id: ticketRef.id,
        number,
        subject,
        category,
        priority: category === "security" && priority === "normal" ? "high" : priority,
        status: "open" satisfies Status,
        scope: organizationId ? "organization" : "personal",
        handledBy,
        escalatedAt: null,
        escalatedByName: null,
        organizationId,
        organizationName,
        requesterUid: caller.uid,
        requesterName: name,
        requesterEmail: email,
        requesterIsGuest: !caller.uid,
        assigneeUid: null,
        assigneeName: null,
        pageUrl,
        userAgent,
        messageCount: 1,
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageBy: "requester",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      batch.set(ticketRef.collection("messages").doc(), {
        authorUid: caller.uid,
        authorName: name,
        authorRole: "requester",
        body: description,
        internal: false,
        kind: "message",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    const ticketNumber = number;

    logger.info("Support ticket created.", { ticketId: ticketRef.id, ticketNumber, category, organizationId, handledBy, guest: !caller.uid });

    if (handledBy === "organization") {
      await Promise.all([
        notify(
          [email],
          `[${ticketNumber}] ${organizationName} received your request: ${subject}`,
          `Hi ${name},\n\nYour request was sent to ${organizationName}. Your ticket number is ${ticketNumber}.\n\n` +
            `You'll get an email when someone replies. Follow it, reply or close it at ${SITE_URL}/support/tickets/${ticketRef.id}\n\n` +
            `Your message:\n${description}`,
          null,
        ),
        notify(
          await organizationHandlerEmails(organizationId as string, caller.uid),
          `[${ticketNumber}] New request from ${name}: ${subject}`,
          `${name} <${email}> sent a request to ${organizationName}.\n` +
            `Category: ${CATEGORY_LABELS[category]}\nPriority: ${priority}\n` +
            (pageUrl ? `Page: ${pageUrl}\n` : "") +
            `\n${description}\n\nAnswer it at ${SITE_URL}/support/tickets/${ticketRef.id}\n` +
            `All requests: ${SITE_URL}/partner/org/${organizationId}/support`,
          null,
        ),
      ]);
      return { ticketId: ticketRef.id, ticketNumber };
    }

    await Promise.all([
      notify(
        [email],
        `[${ticketNumber}] We received your request: ${subject}`,
        `Hi ${name},\n\nThanks for contacting Zebron. Your ticket number is ${ticketNumber}.\n\n` +
          `We'll reply by email. ${caller.uid ? `You can follow it at ${SITE_URL}/support/tickets/${ticketRef.id}` : `To follow it online, sign in or create an account at ${SITE_URL} with ${email}.`}\n\n` +
          `Your message:\n${description}`,
      ),
      notify(
        [SUPPORT_INBOX],
        `[${ticketNumber}] New ${CATEGORY_LABELS[category]}${organizationName ? ` · ${organizationName}` : ""}: ${subject}`,
        `From: ${name} <${email}>${caller.uid ? "" : " (guest)"}\n` +
          (organizationName ? `Organization: ${organizationName}\n` : "") +
          `Category: ${CATEGORY_LABELS[category]}\nPriority: ${priority}\n` +
          (pageUrl ? `Page: ${pageUrl}\n` : "") +
          `\n${description}\n\nOpen it in Zebron Admin → Support.`,
      ),
    ]);

    return { ticketId: ticketRef.id, ticketNumber };
  },
);

// ============================================================
// LIST
// ============================================================

export const listMySupportTickets = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request);
  requireSignedIn(caller);

  const queries = [tickets().where("requesterUid", "==", caller.uid).orderBy("updatedAt", "desc").limit(100).get()];

  if (caller.emailVerified && caller.email) {
    queries.push(tickets().where("requesterEmail", "==", caller.email).orderBy("updatedAt", "desc").limit(100).get());
  }

  const organizations = await managerOrganizations(caller.uid);
  const organizationIds = [...organizations.keys()].slice(0, 30);

  if (organizationIds.length > 0) {
    queries.push(tickets().where("organizationId", "in", organizationIds).orderBy("updatedAt", "desc").limit(200).get());
  }

  const [snapshots, memberOf] = await Promise.all([Promise.all(queries), memberOrganizations(caller.uid)]);
  const byId = new Map<string, DocumentData>();

  snapshots.forEach((snapshot, index) => {
    const isOrganizationQuery = index === snapshots.length - 1 && organizationIds.length > 0;
    for (const document of snapshot.docs) {
      const data = document.data();
      // Members' requests to the organization live in its inbox, not in the manager's own list.
      if (isOrganizationQuery && handledByOf(data) === "organization" && data.requesterUid !== caller.uid) continue;
      byId.set(document.id, data);
    }
  });

  return {
    tickets: [...byId.entries()]
      .map(([id, data]) => serializeTicket(id, data))
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    managedOrganizations: [...organizations.keys()],
    memberOrganizations: memberOf,
  };
});

export const listOrganizationSupportTickets = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request);
  requireSignedIn(caller);

  const organizationId = requireId((request.data as Record<string, unknown>)?.organizationId, "organizationId");

  if (!caller.isStaff) {
    const organizations = await managerOrganizations(caller.uid);

    if (!organizations.has(organizationId)) {
      throw new HttpsError("permission-denied", "Only managers, admins and owners can view the organization's tickets.");
    }
  }

  const snapshot = await tickets().where("organizationId", "==", organizationId).orderBy("updatedAt", "desc").limit(200).get();

  return { tickets: snapshot.docs.map((document) => serializeTicket(document.id, document.data())) };
});

export const listAllSupportTickets = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request);

  if (!caller.isStaff) {
    throw new HttpsError("permission-denied", "Only Zebron staff can view all tickets.");
  }

  const status = clean((request.data as Record<string, unknown>)?.status);
  let query = tickets().orderBy("updatedAt", "desc").limit(300);

  if (status && status !== "all" && status !== "active") {
    query = tickets().where("status", "==", status).orderBy("updatedAt", "desc").limit(300);
  }

  if (status === "active") {
    query = tickets().where("status", "in", ["open", "in_progress", "waiting_on_requester"]).orderBy("updatedAt", "desc").limit(300);
  }

  const snapshot = await query.get();

  // Requests an organization handles itself stay out of Zebron's queue (escalated ones come in).
  return {
    tickets: snapshot.docs
      .filter((document) => handledByOf(document.data()) === "zebron")
      .map((document) => serializeTicket(document.id, document.data())),
  };
});

// ============================================================
// DETAIL
// ============================================================

export const getSupportTicket = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request);
  requireSignedIn(caller);

  const ticketId = requireId((request.data as Record<string, unknown>)?.ticketId, "ticketId");
  const snapshot = await tickets().doc(ticketId).get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "This ticket could not be found.");
  }

  const ticket = snapshot.data() ?? {};
  const access = await accessTo(caller, ticket);

  if (!access) {
    throw new HttpsError("permission-denied", "You don't have access to this ticket.");
  }

  const messages = await snapshot.ref.collection("messages").orderBy("createdAt", "asc").limit(500).get();

  return {
    ticket: serializeTicket(snapshot.id, ticket),
    access,
    handler: isHandler(access, ticket),
    canEscalate: access === "organization" && handledByOf(ticket) === "organization",
    messages: messages.docs
      .map((document) => ({ id: document.id, ...document.data() }) as DocumentData)
      .filter((message) => message.internal !== true || canSeeInternal(access, message))
      .map((message) => ({
        id: clean(message.id),
        authorName: clean(message.authorName) || (message.authorRole === "staff" ? "Zebron Support" : "Requester"),
        audience: message.internal === true ? clean(message.audience) || "zebron" : null,
        authorRole: clean(message.authorRole) || "requester",
        body: clean(message.body),
        internal: message.internal === true,
        kind: clean(message.kind) || "message",
        createdAt: iso(message.createdAt),
      })),
  };
});

// ============================================================
// REPLY
// ============================================================

export const addSupportTicketMessage = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const caller = await loadCaller(request);
    requireSignedIn(caller);

    const data = (request.data ?? {}) as Record<string, unknown>;
    const ticketId = requireId(data.ticketId, "ticketId");
    const body = clean(data.body).slice(0, MAX_BODY);
    const internal = data.internal === true;

    if (!body) {
      throw new HttpsError("invalid-argument", "Write a message first.");
    }

    const ref = tickets().doc(ticketId);
    const ticket = (await ref.get()).data();

    if (!ticket) {
      throw new HttpsError("not-found", "This ticket could not be found.");
    }

    const access = await accessTo(caller, ticket);

    if (!access) {
      throw new HttpsError("permission-denied", "You don't have access to this ticket.");
    }

    const handler = isHandler(access, ticket);
    const isStaff = access === "staff";
    const organizationName = clean(ticket.organizationName) || "your organization";

    if (internal && !(handler || access === "organization")) {
      throw new HttpsError("permission-denied", "Only the people answering this ticket can add internal notes.");
    }

    const status = clean(ticket.status) as Status;

    // A requester reply reopens a waiting or resolved ticket; handler replies wait for the requester.
    let nextStatus: Status = status;

    if (!internal) {
      if (handler && (status === "open" || status === "in_progress")) {
        nextStatus = "waiting_on_requester";
      } else if (!handler && ["waiting_on_requester", "resolved", "closed"].includes(status)) {
        nextStatus = "open";
      }
    }

    const authorName = isStaff ?
      `${caller.name || "Zebron"} (Zebron Support)` :
      access === "organization" ? `${caller.name || caller.email} (${organizationName})` : caller.name || caller.email;
    const audience: NoteAudience = isStaff ? "zebron" : "organization";

    await db().runTransaction(async (transaction) => {
      transaction.set(ref.collection("messages").doc(), {
        authorUid: caller.uid,
        authorName,
        authorRole: isStaff ? "staff" : access === "organization" ? "organization" : "requester",
        body,
        internal,
        ...(internal ? { audience } : {}),
        kind: internal ? "note" : "message",
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.update(ref, {
        status: nextStatus,
        messageCount: FieldValue.increment(1),
        ...(internal ? {} : { lastMessageAt: FieldValue.serverTimestamp(), lastMessageBy: handler ? "staff" : "requester" }),
        ...(nextStatus === "open" && status !== "open" ? { resolvedAt: null, reopenedAt: FieldValue.serverTimestamp() } : {}),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: caller.uid,
      });

      if (nextStatus !== status) {
        transaction.set(ref.collection("messages").doc(), statusEvent(status, nextStatus, isStaff ? "Zebron Support" : authorName));
      }
    });

    const number = clean(ticket.number);
    const subject = clean(ticket.subject);

    if (!internal) {
      const byOrganization = handledByOf(ticket) === "organization";
      if (handler) {
        const who = isStaff ? "Zebron Support" : organizationName;
        await notify(
          byOrganization ? requesterOnly(ticket) : await requesterRecipients(ticket),
          `[${number}] ${who} replied: ${subject}`,
          `${body}\n\n— ${caller.name || who}\n\nReply or follow the ticket at ${SITE_URL}/support/tickets/${ticketId}`,
          byOrganization ? null : SUPPORT_INBOX,
        );
      } else if (byOrganization) {
        await notify(
          await organizationHandlerEmails(clean(ticket.organizationId), caller.uid),
          `[${number}] New reply from ${caller.name || caller.email}: ${subject}`,
          `${body}\n\nAnswer it at ${SITE_URL}/support/tickets/${ticketId}`,
          null,
        );
      } else {
        await notify(
          [SUPPORT_INBOX],
          `[${number}] New reply from ${caller.name || caller.email}: ${subject}`,
          `${body}\n\nOpen it in Zebron Admin → Support.`,
        );
      }
    }

    return { status: nextStatus };
  },
);

// ============================================================
// STATUS / PRIORITY / ASSIGNMENT
// ============================================================

export const updateSupportTicket = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const caller = await loadCaller(request);
    requireSignedIn(caller);

    const data = (request.data ?? {}) as Record<string, unknown>;
    const ticketId = requireId(data.ticketId, "ticketId");
    const ref = tickets().doc(ticketId);
    const ticket = (await ref.get()).data();

    if (!ticket) {
      throw new HttpsError("not-found", "This ticket could not be found.");
    }

    const access = await accessTo(caller, ticket);

    if (!access) {
      throw new HttpsError("permission-denied", "You don't have access to this ticket.");
    }

    const handler = isHandler(access, ticket);

    if (data.escalate === true) {
      return escalateTicket(ref, ticket, access, caller, clean(data.note).slice(0, MAX_BODY));
    }

    const current = clean(ticket.status) as Status;
    const status = clean(data.status) as Status | "";
    const priority = clean(data.priority) as Priority | "";
    const assignToMe = data.assignToMe === true;
    const unassign = data.unassign === true;

    const updates: Record<string, unknown> = {};
    const events: DocumentData[] = [];

    const noteAudience: NoteAudience = access === "staff" ? "zebron" : "organization";
    const handlerName = access === "staff" ? "Zebron Support" : caller.name || caller.email;

    if (!handler) {
      // Requesters, and organization managers following a Zebron ticket, may only close or reopen.
      if (priority || assignToMe || unassign) {
        throw new HttpsError("permission-denied", "Only the people answering this ticket can change priority or assignment.");
      }

      if (status === "closed" && current !== "closed") {
        updates.status = "closed";
        updates.closedAt = FieldValue.serverTimestamp();
      } else if (status === "open" && (current === "resolved" || current === "closed")) {
        updates.status = "open";
        updates.reopenedAt = FieldValue.serverTimestamp();
      } else {
        throw new HttpsError("failed-precondition", "You can close this ticket, or reopen it once it's resolved or closed.");
      }
    } else {
      if (status) {
        if (!TICKET_STATUSES.includes(status)) {
          throw new HttpsError("invalid-argument", "Unknown status.");
        }

        if (status !== current) {
          updates.status = status;

          if (status === "resolved") {
            updates.resolvedAt = FieldValue.serverTimestamp();
          }

          if (status === "closed") {
            updates.closedAt = FieldValue.serverTimestamp();
          }
        }
      }

      if (priority) {
        if (!TICKET_PRIORITIES.includes(priority)) {
          throw new HttpsError("invalid-argument", "Unknown priority.");
        }

        if (priority !== ticket.priority) {
          updates.priority = priority;
          events.push(systemEvent(`Priority changed from ${ticket.priority} to ${priority}`, handlerName, true, noteAudience));
        }
      }

      if (assignToMe) {
        updates.assigneeUid = caller.uid;
        updates.assigneeName = caller.name || caller.email;
        events.push(systemEvent(`Assigned to ${caller.name || caller.email}`, handlerName, true, noteAudience));

        if (current === "open" && !status) {
          updates.status = "in_progress";
        }
      }

      if (unassign) {
        updates.assigneeUid = null;
        updates.assigneeName = null;
        events.push(systemEvent("Unassigned", handlerName, true, noteAudience));
      }
    }

    if (Object.keys(updates).length === 0) {
      return { status: current };
    }

    const nextStatus = (updates.status as Status | undefined) ?? current;
    const actorName = access === "staff" ? "Zebron Support" : handler ? `${caller.name || caller.email} (${clean(ticket.organizationName) || "Organization"})` : caller.name || caller.email;

    if (nextStatus !== current) {
      events.push(statusEvent(current, nextStatus, actorName));
    }

    await db().runTransaction(async (transaction) => {
      transaction.update(ref, { ...updates, updatedAt: FieldValue.serverTimestamp(), updatedBy: caller.uid });

      for (const event of events) {
        transaction.set(ref.collection("messages").doc(), event);
      }
    });

    if (nextStatus !== current) {
      const number = clean(ticket.number);
      const subject = clean(ticket.subject);

      if (handler) {
        const byOrganization = handledByOf(ticket) === "organization";
        await notify(
          byOrganization ? requesterOnly(ticket) : await requesterRecipients(ticket),
          `[${number}] ${STATUS_LABELS[nextStatus]}: ${subject}`,
          nextStatus === "resolved" ?
            `We've marked your ticket as resolved. If anything is still wrong, just reply within ${AUTO_CLOSE_DAYS} days and it will reopen.\n\n${SITE_URL}/support/tickets/${ticketId}` :
            `Your ticket status is now: ${STATUS_LABELS[nextStatus]}.\n\n${SITE_URL}/support/tickets/${ticketId}`,
          byOrganization ? null : SUPPORT_INBOX,
        );
      } else if (handledByOf(ticket) === "organization") {
        await notify(
          await organizationHandlerEmails(clean(ticket.organizationId), caller.uid),
          `[${number}] ${STATUS_LABELS[nextStatus]} by requester: ${subject}`,
          `${caller.name || caller.email} changed the status to ${STATUS_LABELS[nextStatus]}.\n\n${SITE_URL}/support/tickets/${ticketId}`,
          null,
        );
      } else {
        await notify([SUPPORT_INBOX], `[${number}] ${STATUS_LABELS[nextStatus]} by requester: ${subject}`, `${caller.name || caller.email} changed the status to ${STATUS_LABELS[nextStatus]}.`);
      }
    }

    return { status: nextStatus };
  },
);

// ============================================================
// DAILY: CLOSE RESOLVED TICKETS AFTER 7 DAYS
// ============================================================

export const closeResolvedSupportTickets = onSchedule(
  { region: REGION, schedule: "every day 03:30", timeZone: "America/New_York" },
  async () => {
    const cutoff = Timestamp.fromMillis(Date.now() - AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000);
    const due = await tickets().where("status", "==", "resolved").where("resolvedAt", "<=", cutoff).limit(500).get();

    for (const document of due.docs) {
      await db().runTransaction(async (transaction) => {
        transaction.update(document.ref, {
          status: "closed",
          closedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: "system:auto-close",
        });

        transaction.set(document.ref.collection("messages").doc(), systemEvent(`Closed automatically ${AUTO_CLOSE_DAYS} days after it was resolved`, "Zebron", false));
      });
    }

    logger.info("Resolved support tickets closed.", { count: due.size });
  },
);

// ============================================================
// HELPERS
// ============================================================

function serializeTicket(id: string, data: DocumentData) {
  return {
    id,
    number: clean(data.number),
    subject: clean(data.subject),
    category: clean(data.category),
    priority: clean(data.priority) || "normal",
    status: clean(data.status) || "open",
    scope: clean(data.scope) || "personal",
    handledBy: handledByOf(data),
    escalatedAt: iso(data.escalatedAt),
    escalatedByName: clean(data.escalatedByName) || null,
    organizationId: clean(data.organizationId) || null,
    organizationName: clean(data.organizationName) || null,
    requesterName: clean(data.requesterName) || null,
    requesterEmail: clean(data.requesterEmail) || null,
    requesterIsGuest: data.requesterIsGuest === true,
    assigneeUid: clean(data.assigneeUid) || null,
    assigneeName: clean(data.assigneeName) || null,
    pageUrl: clean(data.pageUrl) || null,
    messageCount: Number(data.messageCount) || 0,
    lastMessageBy: clean(data.lastMessageBy) || null,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    resolvedAt: iso(data.resolvedAt),
    closedAt: iso(data.closedAt),
  };
}

function statusEvent(from: Status, to: Status, by: string): DocumentData {
  return systemEvent(`Status changed from ${STATUS_LABELS[from] ?? from} to ${STATUS_LABELS[to] ?? to}`, by, false);
}

function systemEvent(body: string, by: string, internal: boolean, audience: NoteAudience = "zebron"): DocumentData {
  return {
    authorUid: null,
    authorName: by,
    authorRole: "system",
    body,
    internal,
    ...(internal ? { audience } : {}),
    kind: "event",
    createdAt: FieldValue.serverTimestamp(),
  };
}

/** Requester, plus the organization's managers for organization tickets. */
async function requesterRecipients(ticket: DocumentData): Promise<string[]> {
  const recipients = new Set<string>();
  const email = clean(ticket.requesterEmail).toLowerCase();

  if (email) {
    recipients.add(email);
  }

  const organizationId = clean(ticket.organizationId);

  if (organizationId) {
    const managers = await db().collection("organizationMemberships").where("organizationId", "==", organizationId).get();

    for (const document of managers.docs.slice(0, 25)) {
      const data = document.data();

      if (data.active === true && MANAGER_ROLES.includes(clean(data.role))) {
        const profile = (await db().collection("users").doc(clean(data.userId)).get()).data() ?? {};
        let address = clean(profile.email);

        if (!address) {
          try {
            address = clean((await getAuth().getUser(clean(data.userId))).email);
          } catch {
            address = "";
          }
        }

        if (address) {
          recipients.add(address.toLowerCase());
        }
      }
    }
  }

  return [...recipients];
}

/** Just the requester (organization tickets: the organization's managers are the ones answering). */
function requesterOnly(ticket: DocumentData): string[] {
  const email = clean(ticket.requesterEmail).toLowerCase();
  return email ? [email] : [];
}

/** The organization's managers, admins and owners (up to 25), without the person acting. */
async function organizationHandlerEmails(organizationId: string, exceptUid: string | null): Promise<string[]> {
  if (!organizationId) return [];
  const memberships = await db().collection("organizationMemberships").where("organizationId", "==", organizationId).get();
  const handlers = memberships.docs
    .map((document) => document.data())
    .filter((data) => data.active === true && MANAGER_ROLES.includes(clean(data.role)) && clean(data.userId) && clean(data.userId) !== exceptUid)
    .slice(0, 25);
  const addresses = await Promise.all(
    handlers.map(async (data) => {
      const profile = (await db().collection("users").doc(clean(data.userId)).get()).data() ?? {};
      let address = clean(profile.email);
      if (!address) {
        try {
          address = clean((await getAuth().getUser(clean(data.userId))).email);
        } catch {
          address = "";
        }
      }
      return address.toLowerCase();
    }),
  );
  return addresses.filter(Boolean);
}

/**
 * The organization passes a request it can't solve to Zebron Support:
 * Zebron handles it from now on, the organization keeps following it.
 */
async function escalateTicket(
  ref: FirebaseFirestore.DocumentReference,
  ticket: DocumentData,
  access: Access,
  caller: Caller & { uid: string },
  note: string,
): Promise<{ status: Status; escalated: true }> {
  if (!(access === "organization" || access === "staff") || handledByOf(ticket) !== "organization") {
    throw new HttpsError("failed-precondition", "Only the organization answering this request can send it to Zebron Support.");
  }
  const organizationName = clean(ticket.organizationName) || "Organization";
  const byName = `${caller.name || caller.email} (${organizationName})`;
  const current = clean(ticket.status) as Status;

  await db().runTransaction(async (transaction) => {
    transaction.update(ref, {
      handledBy: "zebron",
      escalatedAt: FieldValue.serverTimestamp(),
      escalatedBy: caller.uid,
      escalatedByName: byName,
      status: "open",
      assigneeUid: null,
      assigneeName: null,
      lastMessageBy: "requester",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: caller.uid,
    });
    transaction.set(ref.collection("messages").doc(), systemEvent(`${organizationName} sent this request to Zebron Support`, byName, false));
    if (note) {
      transaction.set(ref.collection("messages").doc(), {
        authorUid: caller.uid,
        authorName: byName,
        authorRole: "organization",
        body: note,
        internal: true,
        audience: "shared",
        kind: "note",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    if (current !== "open") {
      transaction.set(ref.collection("messages").doc(), statusEvent(current, "open", byName));
    }
  });

  const number = clean(ticket.number);
  const subject = clean(ticket.subject);
  await Promise.all([
    notify(
      [SUPPORT_INBOX],
      `[${number}] Escalated by ${organizationName}: ${subject}`,
      `${byName} sent this request to Zebron Support.\n` +
        `From: ${clean(ticket.requesterName)} <${clean(ticket.requesterEmail)}>\n` +
        (note ? `\nNote from ${organizationName}:\n${note}\n` : "") +
        `\nOpen it in Zebron Admin → Support.`,
    ),
    notify(
      requesterOnly(ticket),
      `[${number}] Your request was passed to Zebron Support: ${subject}`,
      `${organizationName} asked Zebron Support to help with your request. You'll get an email when they reply.\n\n${SITE_URL}/support/tickets/${ref.id}`,
    ),
  ]);

  logger.info("Support ticket escalated to Zebron.", { ticketId: ref.id, organizationId: clean(ticket.organizationId), by: caller.uid });
  return { status: "open", escalated: true };
}

/** replyTo: the Zebron support inbox by default; null for organization tickets (they answer on Zebron). */
async function notify(to: string[], subject: string, text: string, replyTo: string | null = SUPPORT_INBOX): Promise<void> {
  const recipients = [...new Set(to.map((address) => address.trim().toLowerCase()).filter(Boolean))];
  const apiKey = process.env.RESEND_API_KEY;

  if (recipients.length === 0 || !apiKey) {
    return;
  }

  // One email per recipient so addresses are never shared.
  await Promise.all(
    recipients.map(async (recipient) => {
      try {
        const response = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM, to: [recipient], ...(replyTo ? { reply_to: replyTo } : {}), subject: subject.slice(0, 200), text }),
        });

        if (!response.ok) {
          logger.warn("Support notification failed.", { status: response.status, subject });
        } else {
          await recordEmailUsage("sent", "support_notification");
        }
      } catch (error) {
        logger.warn("Support notification failed.", { error, subject });
      }
    }),
  );
}

function requireId(value: unknown, field: string): string {
  const id = clean(value);

  if (!id || id.length > 200 || id.includes("/")) {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }

  return id;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function joinName(first: unknown, last: unknown): string {
  return [clean(first), clean(last)].filter(Boolean).join(" ");
}

function iso(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

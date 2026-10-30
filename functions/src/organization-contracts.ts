/* eslint-disable max-len */
import { getAuth } from "firebase-admin/auth";
import {
  DocumentReference,
  FieldValue,
  Firestore,
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

import { APPLICATION_PROVISIONING_POLICIES } from "./application-provisioning-policy";
import { provisionOrganizationApplications } from "./application-provisioning";
import {
  ContractTerms,
  DEFAULT_CONTRACT_TERMS,
  DEFAULT_NOTICE_PERIOD_DAYS,
} from "./contract-terms";
import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Zebron Contract & Billing
 *
 * Data (written only by these functions; clients have no direct access):
 *
 *   organizations/{id}/contract/current   the organization's contract
 *   contractTerms/current                 platform-wide agreement text
 *   organizationServiceRequests/{id}      requests to Zebron
 *
 * Request flow:
 *
 *   Managers and admins submit  -> awaiting_owner -> owner approves -> submitted
 *                                                  -> owner declines -> declined
 *   Owners submit               -> submitted
 *   Zebron (platform admin)     -> completed | rejected
 *   Requester or owner          -> withdrawn (while awaiting_owner/submitted)
 *
 * Termination: the owner gives notice (typed confirmation). The contract
 * enters a 30-day notice period and can be cancelled until it ends.
 * A daily job then suspends the organization.
 */

const REGION = "us-central1";
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM = "Zebron <noreply@zebron.org>";

/** Platform mailbox; stored in Contact Mailbox and forwarded to Zebron staff. */
const ZEBRON_REQUESTS_INBOX = "contact@zebron.org";

const ROLE_RANK: Record<string, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

const MANAGER_RANK = 3;
const OWNER_RANK = 5;

export type ServiceRequestType =
  | "add_application"
  | "suspend_application"
  | "resume_application"
  | "retire_application"
  | "terminate_contract"
  | "transfer_ownership"
  | "data_export"
  | "billing_question"
  | "other";

export type ServiceRequestStatus =
  | "awaiting_owner"
  | "submitted"
  | "completed"
  | "rejected"
  | "declined"
  | "withdrawn";

const REQUEST_TYPES: readonly ServiceRequestType[] = [
  "add_application",
  "suspend_application",
  "resume_application",
  "retire_application",
  "terminate_contract",
  "transfer_ownership",
  "data_export",
  "billing_question",
  "other",
];

/** Requests that change what the organization has; owners must approve. */
const NEEDS_OWNER_APPROVAL: readonly ServiceRequestType[] = [
  "add_application",
  "suspend_application",
  "resume_application",
  "retire_application",
  "data_export",
];

/** Only owners may make these requests. */
const OWNER_ONLY: readonly ServiceRequestType[] = [
  "terminate_contract",
  "transfer_ownership",
];

const REQUEST_LABELS: Record<ServiceRequestType, string> = {
  add_application: "Add application",
  suspend_application: "Suspend application",
  resume_application: "Resume application",
  retire_application: "Retire application",
  terminate_contract: "Terminate contract",
  transfer_ownership: "Transfer ownership",
  data_export: "Data export",
  billing_question: "Billing question",
  other: "Other request",
};

const db = (): Firestore => getFirestore();

// ============================================================
// CALLER
// ============================================================

interface Caller {
  uid: string;
  name: string;
  email: string;
  role: string;
  rank: number;
  isPlatformAdmin: boolean;
}

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerUserId: string | null;
  data: FirebaseFirestore.DocumentData;
}

async function loadCaller(
  request: CallableRequest<unknown>,
  organizationId: string | null,
): Promise<Caller> {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const [isPlatformAdmin, profileSnapshot, membershipSnapshot] = await Promise.all([
    isPlatformAdministrator(request),
    db().collection("users").doc(uid).get(),
    organizationId ?
      db().collection("organizationMemberships").doc(`${uid}_${organizationId}`).get() :
      Promise.resolve(null),
  ]);

  const profile = profileSnapshot.data() ?? {};
  const membership = membershipSnapshot?.data();
  const activeMember = membershipSnapshot?.exists === true && membership?.active === true;
  const role = activeMember ? clean(membership?.role) : "";

  return {
    uid,
    name: clean(profile.displayName) || joinName(profile.firstName, profile.lastName) || clean(request.auth?.token.name),
    email: (clean(profile.email) || clean(request.auth?.token.email)).toLowerCase(),
    role,
    rank: ROLE_RANK[role] ?? 0,
    isPlatformAdmin,
  };
}

function requireRank(caller: Caller, minimum: number, message: string): void {
  if (!caller.isPlatformAdmin && caller.rank < minimum) {
    throw new HttpsError("permission-denied", message);
  }
}

async function loadOrganization(organizationId: string): Promise<OrganizationInfo> {
  const snapshot = await db().collection("organizations").doc(organizationId).get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "The organization could not be found.");
  }

  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    name: clean(data.name) || clean(data.organizationName) || "Organization",
    slug: clean(data.slug),
    status: clean(data.status) || (data.active === false ? "suspended" : "active"),
    ownerUserId: clean(data.ownerUserId) || null,
    data,
  };
}

// ============================================================
// TERMS AND CONTRACT
// ============================================================

async function loadTerms(): Promise<ContractTerms & { updatedAt: string | null }> {
  const snapshot = await db().collection("contractTerms").doc("current").get();
  const data = snapshot.data();

  if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
    return { ...DEFAULT_CONTRACT_TERMS, updatedAt: null };
  }

  return {
    version: clean(data.version) || DEFAULT_CONTRACT_TERMS.version,
    title: clean(data.title) || DEFAULT_CONTRACT_TERMS.title,
    sections: (data.sections as unknown[])
      .map((section) => {
        const value = (section ?? {}) as Record<string, unknown>;
        return { heading: clean(value.heading), body: clean(value.body) };
      })
      .filter((section) => section.heading || section.body),
    updatedAt: iso(data.updatedAt),
  };
}

function contractRef(organizationId: string): DocumentReference {
  return db().collection("organizations").doc(organizationId).collection("contract").doc("current");
}

/** Returns the contract, creating it with defaults the first time. */
async function ensureContract(
  organization: OrganizationInfo,
  terms: ContractTerms,
): Promise<FirebaseFirestore.DocumentData> {
  const ref = contractRef(organization.id);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return snapshot.data() ?? {};
  }

  let billingName = "";
  let billingEmail = "";

  if (organization.ownerUserId) {
    const owner = (await db().collection("users").doc(organization.ownerUserId).get()).data() ?? {};
    billingName = clean(owner.displayName) || joinName(owner.firstName, owner.lastName);
    billingEmail = clean(owner.email).toLowerCase();
  }

  const effective =
    toDate(organization.data.activatedAt) ??
    toDate(organization.data.approvedAt) ??
    toDate(organization.data.createdAt) ??
    new Date();

  const contract = {
    organizationId: organization.id,
    contractNumber: `ZB-${effective.getUTCFullYear()}-${organization.id.slice(-6).toUpperCase()}`,
    planName: "Zebron Partner",
    status: "active",
    effectiveDate: Timestamp.fromDate(effective),
    noticePeriodDays: DEFAULT_NOTICE_PERIOD_DAYS,
    billingContact: {
      name: billingName || null,
      email: billingEmail || clean(organization.data.email).toLowerCase() || null,
      phone: clean(organization.data.phone) || null,
      address: null,
    },
    acceptedTermsVersion: null,
    acceptedAt: null,
    acceptedBy: null,
    acceptedByName: null,
    termination: null,
    currentTermsVersion: terms.version,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(contract);

  return { ...contract, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
}

function serializeContract(data: FirebaseFirestore.DocumentData) {
  const termination = data.termination as Record<string, unknown> | null | undefined;
  const billing = (data.billingContact ?? {}) as Record<string, unknown>;

  return {
    contractNumber: clean(data.contractNumber),
    planName: clean(data.planName) || "Zebron Partner",
    status: clean(data.status) || "active",
    effectiveDate: iso(data.effectiveDate),
    noticePeriodDays: Number(data.noticePeriodDays) || DEFAULT_NOTICE_PERIOD_DAYS,
    billingContact: {
      name: clean(billing.name) || null,
      email: clean(billing.email) || null,
      phone: clean(billing.phone) || null,
      address: clean(billing.address) || null,
    },
    acceptedTermsVersion: clean(data.acceptedTermsVersion) || null,
    acceptedAt: iso(data.acceptedAt),
    acceptedByName: clean(data.acceptedByName) || null,
    termination: termination ?
      {
        requestedAt: iso(termination.requestedAt),
        requestedByName: clean(termination.requestedByName) || null,
        effectiveDate: iso(termination.effectiveDate),
        reason: clean(termination.reason) || null,
        requestId: clean(termination.requestId) || null,
      } :
      null,
    terminatedAt: iso(data.terminatedAt),
  };
}

// ============================================================
// OVERVIEW (partner page)
// ============================================================

export const getOrganizationContractOverview = onCall({ region: REGION }, async (request) => {
  const organizationId = requireId((request.data as Record<string, unknown>)?.organizationId, "organizationId");
  const caller = await loadCaller(request, organizationId);

  requireRank(caller, MANAGER_RANK, "Only managers, administrators and owners can view the contract.");

  const organization = await loadOrganization(organizationId);
  const terms = await loadTerms();
  const contract = await ensureContract(organization, terms);

  const [applicationsSnapshot, requestsSnapshot] = await Promise.all([
    db().collection("organizations").doc(organizationId).collection("applications").get(),
    db()
      .collection("organizationServiceRequests")
      .where("organizationId", "==", organizationId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get(),
  ]);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: organization.status,
    },
    viewer: {
      role: caller.role || null,
      isPlatformAdmin: caller.isPlatformAdmin,
      isOwner: caller.rank >= OWNER_RANK,
      canRequest: caller.isPlatformAdmin || caller.rank >= MANAGER_RANK,
      canApprove: caller.isPlatformAdmin || caller.rank >= OWNER_RANK,
      uid: caller.uid,
    },
    contract: serializeContract(contract),
    terms,
    applications: applicationsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        applicationId: document.id,
        status: clean(data.status) || "available",
        activatedAt: iso(data.activatedAt),
        updatedAt: iso(data.updatedAt),
        suspendedAt: iso(data.suspendedAt),
      };
    }),
    requests: requestsSnapshot.docs.map((document) => serializeRequest(document.id, document.data())),
  };
});

// ============================================================
// SUBMIT A REQUEST
// ============================================================

export const submitOrganizationServiceRequest = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const data = (request.data ?? {}) as Record<string, unknown>;
    const organizationId = requireId(data.organizationId, "organizationId");
    const type = clean(data.type) as ServiceRequestType;
    const reason = clean(data.reason).slice(0, 2000);
    const applicationId = clean(data.applicationId) || null;

    if (!REQUEST_TYPES.includes(type)) {
      throw new HttpsError("invalid-argument", "Unknown request type.");
    }

    const caller = await loadCaller(request, organizationId);

    requireRank(caller, MANAGER_RANK, "Only managers, administrators and owners can make requests.");

    if (OWNER_ONLY.includes(type)) {
      requireRank(caller, OWNER_RANK, `Only the organization owner can request: ${REQUEST_LABELS[type]}.`);
    }

    const organization = await loadOrganization(organizationId);

    if (organization.status !== "active" && type !== "data_export" && type !== "other") {
      throw new HttpsError("failed-precondition", "The organization must be active to make this request.");
    }

    // ---------------- Type-specific checks ----------------
    let applicationStatus: string | null = null;
    let newOwnerUserId: string | null = null;
    let newOwnerName: string | null = null;

    if (type.endsWith("_application")) {
      if (!applicationId || !(applicationId in APPLICATION_PROVISIONING_POLICIES)) {
        throw new HttpsError("invalid-argument", "Choose a valid application.");
      }

      if (applicationId === "core") {
        throw new HttpsError("invalid-argument", "The core application cannot be changed.");
      }

      const entitlement = await db()
        .collection("organizations").doc(organizationId)
        .collection("applications").doc(applicationId).get();

      applicationStatus = entitlement.exists ? clean(entitlement.data()?.status) : null;

      const isActive = applicationStatus === "active";
      const isSuspended = applicationStatus === "suspended";

      if (type === "add_application" && (isActive || isSuspended)) {
        throw new HttpsError("failed-precondition", "This application is already provisioned.");
      }

      if (type === "suspend_application" && !isActive) {
        throw new HttpsError("failed-precondition", "Only active applications can be suspended.");
      }

      if (type === "resume_application" && !isSuspended) {
        throw new HttpsError("failed-precondition", "Only suspended applications can be resumed.");
      }

      if (type === "retire_application" && !isActive && !isSuspended) {
        throw new HttpsError("failed-precondition", "Only provisioned applications can be retired.");
      }
    }

    if (type === "transfer_ownership") {
      newOwnerUserId = requireId(data.newOwnerUserId, "newOwnerUserId");

      if (newOwnerUserId === caller.uid) {
        throw new HttpsError("invalid-argument", "Choose someone other than yourself.");
      }

      const membership = await db().collection("organizationMemberships").doc(`${newOwnerUserId}_${organizationId}`).get();

      if (!membership.exists || membership.data()?.active !== true) {
        throw new HttpsError("invalid-argument", "The new owner must be an active member of this organization.");
      }

      newOwnerName = await displayNameFor(newOwnerUserId);
    }

    if (type === "terminate_contract") {
      const confirmName = clean(data.confirmName);

      if (confirmName.toLowerCase() !== organization.name.toLowerCase()) {
        throw new HttpsError("invalid-argument", `Type the organization name exactly ("${organization.name}") to confirm.`);
      }

      if (!reason) {
        throw new HttpsError("invalid-argument", "Please tell us why you are ending the contract.");
      }
    }

    if (["billing_question", "other"].includes(type) && !reason) {
      throw new HttpsError("invalid-argument", "Please describe your request.");
    }

    // ---------------- No duplicate open requests ----------------
    const open = await db()
      .collection("organizationServiceRequests")
      .where("organizationId", "==", organizationId)
      .where("status", "in", ["awaiting_owner", "submitted"])
      .get();

    const duplicate = open.docs.find((document) => {
      const existing = document.data();
      return existing.type === type && (clean(existing.applicationId) || null) === applicationId;
    });

    if (duplicate) {
      throw new HttpsError("already-exists", "There is already an open request like this one.");
    }

    // ---------------- Create ----------------
    const status: ServiceRequestStatus =
      NEEDS_OWNER_APPROVAL.includes(type) && caller.rank < OWNER_RANK && !caller.isPlatformAdmin ?
        "awaiting_owner" :
        "submitted";

    const ref = db().collection("organizationServiceRequests").doc();

    const record: Record<string, unknown> = {
      id: ref.id,
      organizationId,
      organizationName: organization.name,
      type,
      applicationId,
      applicationStatusAtRequest: applicationStatus,
      reason: reason || null,
      newOwnerUserId,
      newOwnerName,
      status,
      requestedBy: caller.uid,
      requestedByName: caller.name || null,
      requestedByEmail: caller.email || null,
      requestedByRole: caller.role || (caller.isPlatformAdmin ? "platform_admin" : null),
      history: [historyEntry(caller, status === "awaiting_owner" ? "Submitted for owner approval" : "Submitted to Zebron")],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (type === "terminate_contract") {
      const terms = await loadTerms();
      const contract = await ensureContract(organization, terms);

      if (clean(contract.status) === "notice") {
        throw new HttpsError("failed-precondition", "The contract is already in its notice period.");
      }

      const noticeDays = Number(contract.noticePeriodDays) || DEFAULT_NOTICE_PERIOD_DAYS;
      const effective = new Date(Date.now() + noticeDays * 24 * 60 * 60 * 1000);

      record.terminationEffectiveDate = Timestamp.fromDate(effective);

      await db().runTransaction(async (transaction) => {
        transaction.set(ref, record);
        transaction.set(
          contractRef(organizationId),
          {
            status: "notice",
            termination: {
              requestId: ref.id,
              requestedAt: FieldValue.serverTimestamp(),
              requestedBy: caller.uid,
              requestedByName: caller.name || null,
              effectiveDate: Timestamp.fromDate(effective),
              reason,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
    } else {
      await ref.set(record);
    }

    logger.info("Service request submitted.", { organizationId, requestId: ref.id, type, status });

    // ---------------- Notify ----------------
    if (status === "awaiting_owner") {
      const owners = await ownerEmails(organizationId);
      await notify(
        owners,
        `[${organization.name}] Approval needed: ${requestTitle(type, applicationId)}`,
        `${caller.name || caller.email || "A manager"} asked for: ${requestTitle(type, applicationId)}.\n\n` +
          (reason ? `Reason: ${reason}\n\n` : "") +
          "Approve or decline it on the Contract & Billing page in the Zebron partner portal.",
      );
    } else {
      await notify(
        [ZEBRON_REQUESTS_INBOX],
        `[Partner request] ${organization.name}: ${requestTitle(type, applicationId)}`,
        requestSummary(organization.name, type, applicationId, reason, caller, newOwnerName, record.terminationEffectiveDate as Timestamp | undefined),
      );
    }

    return { requestId: ref.id, status };
  },
);

// ============================================================
// OWNER APPROVAL, DECLINE, WITHDRAW
// ============================================================

export const respondToOrganizationServiceRequest = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const data = (request.data ?? {}) as Record<string, unknown>;
    const requestId = requireId(data.requestId, "requestId");
    const action = clean(data.action);
    const note = clean(data.note).slice(0, 1000);

    if (!["approve", "decline", "withdraw"].includes(action)) {
      throw new HttpsError("invalid-argument", "Unknown action.");
    }

    const ref = db().collection("organizationServiceRequests").doc(requestId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new HttpsError("not-found", "The request could not be found.");
    }

    const existing = snapshot.data() ?? {};
    const organizationId = clean(existing.organizationId);
    const caller = await loadCaller(request, organizationId);
    const status = clean(existing.status) as ServiceRequestStatus;
    const isOwner = caller.isPlatformAdmin || caller.rank >= OWNER_RANK;

    let nextStatus: ServiceRequestStatus;

    if (action === "withdraw") {
      if (!["awaiting_owner", "submitted"].includes(status)) {
        throw new HttpsError("failed-precondition", "Only open requests can be withdrawn.");
      }

      if (existing.requestedBy !== caller.uid && !isOwner) {
        throw new HttpsError("permission-denied", "Only the person who asked, or the owner, can withdraw this request.");
      }

      if (existing.type === "terminate_contract") {
        throw new HttpsError("failed-precondition", "Use \"Cancel termination\" to withdraw a termination notice.");
      }

      nextStatus = "withdrawn";
    } else {
      if (!isOwner) {
        throw new HttpsError("permission-denied", "Only the organization owner can approve or decline requests.");
      }

      if (status !== "awaiting_owner") {
        throw new HttpsError("failed-precondition", "This request is not waiting for owner approval.");
      }

      nextStatus = action === "approve" ? "submitted" : "declined";
    }

    const label = action === "approve" ? "Approved by owner, sent to Zebron" : action === "decline" ? "Declined by owner" : "Withdrawn";

    await ref.update({
      status: nextStatus,
      ...(action === "approve" ? { ownerApprovedBy: caller.uid, ownerApprovedByName: caller.name || null, ownerApprovedAt: FieldValue.serverTimestamp() } : {}),
      ...(action === "decline" ? { ownerDeclinedBy: caller.uid, ownerDeclineNote: note || null } : {}),
      history: FieldValue.arrayUnion(historyEntry(caller, note ? `${label}: ${note}` : label)),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const type = clean(existing.type) as ServiceRequestType;
    const applicationId = clean(existing.applicationId) || null;
    const organizationName = clean(existing.organizationName);

    if (nextStatus === "submitted") {
      await notify(
        [ZEBRON_REQUESTS_INBOX],
        `[Partner request] ${organizationName}: ${requestTitle(type, applicationId)}`,
        requestSummary(organizationName, type, applicationId, clean(existing.reason), {
          name: clean(existing.requestedByName),
          email: clean(existing.requestedByEmail),
          role: clean(existing.requestedByRole),
        }, null, undefined) + `\n\nApproved by owner: ${caller.name || caller.email}`,
      );
    } else if (nextStatus === "declined" && existing.requestedByEmail) {
      await notify(
        [clean(existing.requestedByEmail)],
        `[${organizationName}] Request declined: ${requestTitle(type, applicationId)}`,
        `The organization owner declined your request: ${requestTitle(type, applicationId)}.` + (note ? `\n\nNote: ${note}` : ""),
      );
    }

    return { requestId, status: nextStatus };
  },
);

// ============================================================
// TERMINATION: CANCEL DURING NOTICE
// ============================================================

export const cancelOrganizationContractTermination = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const organizationId = requireId((request.data as Record<string, unknown>)?.organizationId, "organizationId");
    const caller = await loadCaller(request, organizationId);

    requireRank(caller, OWNER_RANK, "Only the organization owner can cancel the termination.");

    const organization = await loadOrganization(organizationId);
    const ref = contractRef(organizationId);
    const contract = (await ref.get()).data();

    if (!contract || clean(contract.status) !== "notice") {
      throw new HttpsError("failed-precondition", "The contract is not in a notice period.");
    }

    const requestId = clean((contract.termination as Record<string, unknown> | undefined)?.requestId);

    await db().runTransaction(async (transaction) => {
      transaction.set(
        ref,
        {
          status: "active",
          termination: null,
          lastTerminationCancelledAt: FieldValue.serverTimestamp(),
          lastTerminationCancelledBy: caller.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      if (requestId) {
        transaction.update(db().collection("organizationServiceRequests").doc(requestId), {
          status: "withdrawn",
          history: FieldValue.arrayUnion(historyEntry(caller, "Termination cancelled by owner")),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    await notify(
      [ZEBRON_REQUESTS_INBOX],
      `[Partner request] ${organization.name}: termination cancelled`,
      `${caller.name || caller.email} cancelled the termination notice for ${organization.name}. The contract remains active.`,
    );

    return { status: "active" };
  },
);

// ============================================================
// BILLING CONTACT AND TERMS ACCEPTANCE
// ============================================================

export const updateOrganizationBillingContact = onCall({ region: REGION }, async (request) => {
  const data = (request.data ?? {}) as Record<string, unknown>;
  const organizationId = requireId(data.organizationId, "organizationId");
  const caller = await loadCaller(request, organizationId);

  requireRank(caller, MANAGER_RANK, "Only managers, administrators and owners can change billing details.");

  const name = clean(data.name).slice(0, 120);
  const email = clean(data.email).toLowerCase().slice(0, 254);
  const phone = clean(data.phone).slice(0, 40);
  const address = clean(data.address).slice(0, 500);

  if (!name || !email) {
    throw new HttpsError("invalid-argument", "A billing contact name and email are required.");
  }

  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid billing email.");
  }

  const organization = await loadOrganization(organizationId);
  await ensureContract(organization, await loadTerms());

  await contractRef(organizationId).set(
    {
      billingContact: { name, email, phone: phone || null, address: address || null },
      billingContactUpdatedBy: caller.uid,
      billingContactUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { success: true };
});

export const acceptOrganizationContractTerms = onCall({ region: REGION }, async (request) => {
  const organizationId = requireId((request.data as Record<string, unknown>)?.organizationId, "organizationId");
  const caller = await loadCaller(request, organizationId);

  requireRank(caller, OWNER_RANK, "Only the organization owner can accept the agreement.");

  const organization = await loadOrganization(organizationId);
  const terms = await loadTerms();
  await ensureContract(organization, terms);

  await contractRef(organizationId).set(
    {
      acceptedTermsVersion: terms.version,
      acceptedAt: FieldValue.serverTimestamp(),
      acceptedBy: caller.uid,
      acceptedByName: caller.name || caller.email || null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { acceptedTermsVersion: terms.version };
});

// ============================================================
// ZEBRON: REVIEW QUEUE
// ============================================================

export const listOrganizationServiceRequests = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request, null);

  if (!caller.isPlatformAdmin) {
    throw new HttpsError("permission-denied", "Only Zebron platform administrators can view all requests.");
  }

  const [snapshot, terms] = await Promise.all([
    db().collection("organizationServiceRequests").orderBy("createdAt", "desc").limit(300).get(),
    loadTerms(),
  ]);

  return {
    requests: snapshot.docs.map((document) => serializeRequest(document.id, document.data())),
    terms,
  };
});

export const reviewOrganizationServiceRequest = onCall(
  { region: REGION, secrets: ["RESEND_API_KEY"] },
  async (request) => {
    const data = (request.data ?? {}) as Record<string, unknown>;
    const requestId = requireId(data.requestId, "requestId");
    const decision = clean(data.decision);
    const note = clean(data.note).slice(0, 2000);

    const caller = await loadCaller(request, null);

    if (!caller.isPlatformAdmin) {
      throw new HttpsError("permission-denied", "Only Zebron platform administrators can review requests.");
    }

    if (!["approve", "reject"].includes(decision)) {
      throw new HttpsError("invalid-argument", "Decision must be approve or reject.");
    }

    const ref = db().collection("organizationServiceRequests").doc(requestId);
    const existing = (await ref.get()).data();

    if (!existing) {
      throw new HttpsError("not-found", "The request could not be found.");
    }

    if (existing.status !== "submitted") {
      throw new HttpsError("failed-precondition", "Only submitted requests can be reviewed.");
    }

    const type = clean(existing.type) as ServiceRequestType;
    const organizationId = clean(existing.organizationId);
    const applicationId = clean(existing.applicationId) || null;

    if (decision === "reject" && !note) {
      throw new HttpsError("invalid-argument", "Add a note explaining why the request is rejected.");
    }

    if (decision === "reject" && type === "terminate_contract") {
      throw new HttpsError("failed-precondition", "A partner's termination notice cannot be rejected. Contact the partner instead.");
    }

    let outcome = note || "Completed";

    if (decision === "approve") {
      outcome = await carryOut(type, organizationId, applicationId, existing, caller.uid) + (note ? ` ${note}` : "");
    }

    const nextStatus: ServiceRequestStatus =
      decision === "reject" ? "rejected" :
        type === "terminate_contract" ? "submitted" : "completed";

    await ref.update({
      status: nextStatus,
      reviewedBy: caller.uid,
      reviewedByName: caller.name || null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewNote: note || null,
      outcome,
      ...(type === "terminate_contract" ? { acknowledgedByZebron: true } : {}),
      history: FieldValue.arrayUnion(
        historyEntry(caller, decision === "reject" ? `Rejected by Zebron: ${note}` : `Zebron: ${outcome}`),
      ),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const recipients = [clean(existing.requestedByEmail), ...(await ownerEmails(organizationId))].filter(Boolean);
    const organizationName = clean(existing.organizationName);

    await notify(
      [...new Set(recipients)],
      `[${organizationName}] ${decision === "reject" ? "Request not approved" : "Request completed"}: ${requestTitle(type, applicationId)}`,
      decision === "reject" ?
        `Zebron could not approve your request: ${requestTitle(type, applicationId)}.\n\nReason: ${note}` :
        `Zebron completed your request: ${requestTitle(type, applicationId)}.\n\n${outcome}`,
    );

    logger.info("Service request reviewed.", { requestId, organizationId, type, decision });

    return { requestId, status: nextStatus, outcome };
  },
);

/** Performs an approved request. Returns a short description for the partner. */
async function carryOut(
  type: ServiceRequestType,
  organizationId: string,
  applicationId: string | null,
  existing: FirebaseFirestore.DocumentData,
  actorUid: string,
): Promise<string> {
  const organizationRef = db().collection("organizations").doc(organizationId);
  const name = applicationId ? applicationName(applicationId) : "";

  switch (type) {
    case "add_application": {
      if (!applicationId) {
        throw new HttpsError("failed-precondition", "The request has no application.");
      }

      const policy = APPLICATION_PROVISIONING_POLICIES[applicationId as keyof typeof APPLICATION_PROVISIONING_POLICIES];
      const entitlementRef = organizationRef.collection("applications").doc(applicationId);
      const entitlement = await entitlementRef.get();
      const status = clean(entitlement.data()?.status);

      if (status !== "active") {
        await entitlementRef.set(
          {
            applicationId,
            organizationId,
            status: "selected",
            version: Number(entitlement.data()?.version) || 1,
            provisioningStrategy: policy?.provisioningStrategy ?? "default",
            requestedBy: clean(existing.requestedBy) || actorUid,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      const results = await provisionOrganizationApplications(db(), organizationId, actorUid, {
        mode: "requested",
        applicationIds: [applicationId],
      });

      const result = results.find((item) => item.applicationId === applicationId);

      if (result?.status !== "active") {
        throw new HttpsError(
          "failed-precondition",
          `${name} could not be provisioned${result?.reason ? `: ${result.reason}` : "."} The request is still open; fix the issue and approve again.`,
        );
      }

      return `${name} is now active.`;
    }

    case "suspend_application":
    case "resume_application":
    case "retire_application": {
      if (!applicationId) {
        throw new HttpsError("failed-precondition", "The request has no application.");
      }

      const entitlementRef = organizationRef.collection("applications").doc(applicationId);
      const current = clean((await entitlementRef.get()).data()?.status);

      const next = type === "suspend_application" ? "suspended" : type === "resume_application" ? "active" : "deactivated";
      const allowedFrom = type === "suspend_application" ? ["active"] : type === "resume_application" ? ["suspended"] : ["active", "suspended"];

      if (!allowedFrom.includes(current)) {
        throw new HttpsError("failed-precondition", `${name} is ${current || "not provisioned"} and cannot change to ${next}.`);
      }

      await entitlementRef.set(
        {
          status: next,
          ...(next === "suspended" ? { suspendedAt: FieldValue.serverTimestamp(), suspendedBy: actorUid } : {}),
          ...(next === "active" ? { resumedAt: FieldValue.serverTimestamp(), resumedBy: actorUid } : {}),
          ...(next === "deactivated" ? { deactivatedAt: FieldValue.serverTimestamp(), deactivatedBy: actorUid } : {}),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return type === "suspend_application" ?
        `${name} is suspended.` :
        type === "resume_application" ? `${name} is active again.` : `${name} has been retired.`;
    }

    case "transfer_ownership": {
      const newOwnerUserId = clean(existing.newOwnerUserId);
      const previousOwnerUserId = clean(existing.requestedBy);

      await db().runTransaction(async (transaction) => {
        const newRef = db().collection("organizationMemberships").doc(`${newOwnerUserId}_${organizationId}`);
        const newMembership = await transaction.get(newRef);

        if (!newMembership.exists || newMembership.data()?.active !== true) {
          throw new HttpsError("failed-precondition", "The new owner is no longer an active member.");
        }

        const owners = await transaction.get(
          db().collection("organizationMemberships")
            .where("organizationId", "==", organizationId)
            .where("role", "==", "org_owner"),
        );

        for (const owner of owners.docs) {
          if (owner.id !== newRef.id) {
            transaction.update(owner.ref, { role: "org_admin", updatedAt: FieldValue.serverTimestamp() });
          }
        }

        transaction.update(newRef, { role: "org_owner", updatedAt: FieldValue.serverTimestamp() });
        transaction.update(organizationRef, {
          ownerUserId: newOwnerUserId,
          previousOwnerUserId: previousOwnerUserId || null,
          ownershipTransferredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      return `${clean(existing.newOwnerName) || "The new owner"} is now the owner. The previous owner is now an administrator.`;
    }

    case "terminate_contract":
      return `Termination acknowledged. Access ends on ${formatDate(toDate(existing.terminationEffectiveDate))}.`;

    case "data_export":
      return "Your data export has been prepared and sent to the requester.";

    default:
      return "Your request has been handled.";
  }
}

// ============================================================
// ZEBRON: EDIT AGREEMENT TEXT
// ============================================================

export const updateContractTerms = onCall({ region: REGION }, async (request) => {
  const caller = await loadCaller(request, null);

  if (!caller.isPlatformAdmin) {
    throw new HttpsError("permission-denied", "Only Zebron platform administrators can edit the agreement.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const title = clean(data.title).slice(0, 200);
  const sections = Array.isArray(data.sections) ?
    data.sections
      .map((section) => {
        const value = (section ?? {}) as Record<string, unknown>;
        return { heading: clean(value.heading).slice(0, 200), body: clean(value.body).slice(0, 5000) };
      })
      .filter((section) => section.heading && section.body) :
    [];

  if (!title || sections.length === 0) {
    throw new HttpsError("invalid-argument", "The agreement needs a title and at least one section.");
  }

  if (sections.length > 40) {
    throw new HttpsError("invalid-argument", "The agreement can have at most 40 sections.");
  }

  const now = new Date();
  const version = `${now.toISOString().slice(0, 10)}-${now.getTime().toString(36).slice(-4)}`;

  await db().collection("contractTerms").doc("current").set({
    version,
    title,
    sections,
    updatedBy: caller.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Keep the previous versions for the record.
  await db().collection("contractTerms").doc("current").collection("versions").doc(version).set({
    version,
    title,
    sections,
    updatedBy: caller.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { version };
});

// ============================================================
// DAILY: END CONTRACTS WHOSE NOTICE PERIOD HAS PASSED
// ============================================================

export const processContractTerminations = onSchedule(
  { region: REGION, schedule: "every day 02:15", timeZone: "America/New_York", secrets: ["RESEND_API_KEY"] },
  async () => {
    const due = await db()
      .collectionGroup("contract")
      .where("status", "==", "notice")
      .where("termination.effectiveDate", "<=", Timestamp.now())
      .get();

    for (const document of due.docs) {
      const organizationId = clean(document.data().organizationId);

      if (!organizationId) {
        continue;
      }

      try {
        const organizationRef = db().collection("organizations").doc(organizationId);
        const requestId = clean((document.data().termination as Record<string, unknown> | undefined)?.requestId);

        await db().runTransaction(async (transaction) => {
          const organization = await transaction.get(organizationRef);
          const currentStatus = clean(organization.data()?.status) || "active";

          transaction.set(document.ref, {
            status: "terminated",
            terminatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });

          // Same fields as the platform's suspendOrganization.
          if (organization.exists && currentStatus !== "suspended" && currentStatus !== "archived") {
            transaction.update(organizationRef, {
              status: "suspended",
              previousStatus: currentStatus,
              active: false,
              suspendedAt: FieldValue.serverTimestamp(),
              suspendedBy: "system:contract-termination",
              suspensionReason: "Contract terminated by the partner.",
              lifecycleReason: "Contract terminated by the partner.",
              lifecycleUpdatedAt: FieldValue.serverTimestamp(),
              lifecycleUpdatedBy: "system:contract-termination",
              updatedAt: FieldValue.serverTimestamp(),
            });
          }

          if (requestId) {
            transaction.update(db().collection("organizationServiceRequests").doc(requestId), {
              status: "completed",
              outcome: "The contract ended and the organization was suspended.",
              history: FieldValue.arrayUnion({
                at: Timestamp.now(),
                by: "system",
                byName: "Zebron",
                message: "Notice period ended; organization suspended",
              }),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        });

        const organizationName = clean((await organizationRef.get()).data()?.name) || organizationId;
        const recipients = await ownerEmails(organizationId);

        await notify(
          [...recipients, ZEBRON_REQUESTS_INBOX],
          `[${organizationName}] Contract ended`,
          `The notice period has ended and the ${organizationName} organization has been suspended.\n\n` +
            "Your data is kept for 90 days. To request an export, reply to this email.",
        );

        logger.info("Contract terminated.", { organizationId });
      } catch (error) {
        logger.error("Could not process contract termination.", { organizationId, error });
      }
    }
  },
);

// ============================================================
// HELPERS
// ============================================================

function serializeRequest(id: string, data: FirebaseFirestore.DocumentData) {
  const history = Array.isArray(data.history) ? data.history : [];

  return {
    id,
    organizationId: clean(data.organizationId),
    organizationName: clean(data.organizationName),
    type: clean(data.type),
    title: requestTitle(clean(data.type) as ServiceRequestType, clean(data.applicationId) || null),
    applicationId: clean(data.applicationId) || null,
    reason: clean(data.reason) || null,
    newOwnerName: clean(data.newOwnerName) || null,
    status: clean(data.status),
    requestedBy: clean(data.requestedBy),
    requestedByName: clean(data.requestedByName) || clean(data.requestedByEmail) || null,
    requestedByRole: clean(data.requestedByRole) || null,
    ownerApprovedByName: clean(data.ownerApprovedByName) || null,
    reviewNote: clean(data.reviewNote) || null,
    outcome: clean(data.outcome) || null,
    terminationEffectiveDate: iso(data.terminationEffectiveDate),
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
    history: history.map((entry: Record<string, unknown>) => ({
      at: iso(entry.at),
      byName: clean(entry.byName) || null,
      message: clean(entry.message),
    })),
  };
}

function historyEntry(caller: Pick<Caller, "uid" | "name" | "email">, message: string) {
  return {
    at: Timestamp.now(),
    by: caller.uid,
    byName: caller.name || caller.email || null,
    message,
  };
}

function applicationName(applicationId: string): string {
  const names: Record<string, string> = {
    "core": "Core",
    "community": "Community",
    "test-center": "Test Center",
    "knowledge": "Knowledge Center",
    "configuration": "Configuration",
    "business-operations": "Business Operations",
    "cyber-range": "Cyber Range",
    "resources": "Resources",
    "jobs-training": "Jobs & Training",
    "tax-pay": "Tax & Pay",
    "content": "Content",
    "mailbox": "Mailbox",
  };

  return names[applicationId] ?? applicationId;
}

function requestTitle(type: ServiceRequestType, applicationId: string | null): string {
  const label = REQUEST_LABELS[type] ?? "Request";
  return applicationId ? `${label}: ${applicationName(applicationId)}` : label;
}

function requestSummary(
  organizationName: string,
  type: ServiceRequestType,
  applicationId: string | null,
  reason: string | null,
  requester: { name?: string; email?: string; role?: string },
  newOwnerName: string | null,
  effective: Timestamp | undefined,
): string {
  return [
    `Organization: ${organizationName}`,
    `Request: ${requestTitle(type, applicationId)}`,
    `Requested by: ${requester.name || requester.email || "Unknown"}${requester.role ? ` (${requester.role})` : ""}`,
    newOwnerName ? `New owner: ${newOwnerName}` : "",
    effective ? `Contract ends on: ${formatDate(effective.toDate())}` : "",
    reason ? `\nReason:\n${reason}` : "",
    "\nReview it in Zebron Admin → Partner Requests.",
  ].filter(Boolean).join("\n");
}

async function ownerEmails(organizationId: string): Promise<string[]> {
  const owners = await db()
    .collection("organizationMemberships")
    .where("organizationId", "==", organizationId)
    .where("role", "==", "org_owner")
    .get();

  const emails = await Promise.all(
    owners.docs
      .filter((document) => document.data().active === true)
      .map(async (document) => {
        const userId = clean(document.data().userId);
        const profile = (await db().collection("users").doc(userId).get()).data() ?? {};
        let email = clean(profile.email);

        if (!email) {
          try {
            email = clean((await getAuth().getUser(userId)).email);
          } catch {
            email = "";
          }
        }

        return email.toLowerCase();
      }),
  );

  return [...new Set(emails.filter(Boolean))];
}

async function displayNameFor(userId: string): Promise<string | null> {
  const profile = (await db().collection("users").doc(userId).get()).data() ?? {};
  const name = clean(profile.displayName) || joinName(profile.firstName, profile.lastName) || clean(profile.email);

  if (name) {
    return name;
  }

  try {
    const user = await getAuth().getUser(userId);
    return clean(user.displayName) || clean(user.email) || null;
  } catch {
    return null;
  }
}

/** Best-effort email; a failure never blocks the request. */
async function notify(to: string[], subject: string, text: string): Promise<void> {
  const recipients = [...new Set(to.map((address) => address.trim().toLowerCase()).filter(Boolean))];
  const apiKey = process.env.RESEND_API_KEY;

  if (recipients.length === 0 || !apiKey) {
    return;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: recipients, subject: subject.slice(0, 200), text }),
    });

    if (!response.ok) {
      logger.warn("Contract notification email failed.", { status: response.status, subject });
    }
  } catch (error) {
    logger.warn("Contract notification email failed.", { error, subject });
  }
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

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }

  return null;
}

function iso(value: unknown): string | null {
  return toDate(value)?.toISOString() ?? null;
}

function formatDate(date: Date | null): string {
  return date ?
    date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) :
    "the end of the notice period";
}

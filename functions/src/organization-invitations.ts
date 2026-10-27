import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { OrganizationInvitationRecord } from './organization-invitation.types';

import {
  advanceOnboarding,
  assertCurrentOnboardingStep,
  type OrganizationOnboardingTransitionState,
} from './organization-onboarding-transition';

import {
  createOrganizationInvitationOutboxData,
} from './organization-email-outbox';

type OrganizationInvitationRole = 'org_admin' | 'org_manager' | 'org_staff' | 'org_member';

type OrganizationInvitationStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

const ALLOWED_ROLES: OrganizationInvitationRole[] = [
  'org_admin',
  'org_manager',
  'org_staff',
  'org_member',
];



/**
 * Creates an organization invitation for a team member.
 */
function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'Email address is required.');
  }

  const email = value.trim().toLowerCase();

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }

  return email;
}

/**
 * Normalizes an organization invitation email address.
 */
function normalizeRole(value: unknown): OrganizationInvitationRole {
  if (typeof value !== 'string' || !ALLOWED_ROLES.includes(value as OrganizationInvitationRole)) {
    throw new HttpsError('invalid-argument', 'Invalid organization role.');
  }

  return value as OrganizationInvitationRole;
}

/**
 * Completes the invite-members onboarding step.
 */
function getRoleLabel(role: OrganizationInvitationRole): string {
  switch (role) {
    case 'org_admin':
      return 'Organization Admin';

    case 'org_manager':
      return 'Organization Manager';

    case 'org_staff':
      return 'Organization Staff';

    case 'org_member':
      return 'Organization Member';

    default:
      return role;
  }
}

/**
 * Verify that the caller has permission to manage
 * organization invitations.
 */
async function requireOrganizationInvitationAdmin(
  organizationId: string,
  uid: string,
  options: { requireInviteStep?: boolean } = {},
): Promise<{
  organization: FirebaseFirestore.DocumentData;
  onboarding: FirebaseFirestore.DocumentData;
}> {
  const db = getFirestore();

  const organizationRef = db.collection('organizations').doc(organizationId);

  const onboardingRef = db.collection('organizationOnboarding').doc(organizationId);

  const membershipRef = db.collection('organizationMemberships').doc(`${uid}_${organizationId}`);

  const [organizationSnapshot, onboardingSnapshot, membershipSnapshot] = await Promise.all([
    organizationRef.get(),
    onboardingRef.get(),
    membershipRef.get(),
  ]);

  if (!organizationSnapshot.exists) {
    throw new HttpsError('not-found', 'Organization not found.');
  }

  if (!onboardingSnapshot.exists) {
    throw new HttpsError(
      'failed-precondition',
      'Organization onboarding has not been initialized.',
    );
  }

  const organization = organizationSnapshot.data() ?? {};

  const onboarding = onboardingSnapshot.data() ?? {};

  if (!membershipSnapshot.exists) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to manage organization invitations.',
    );
  }

  const membership = membershipSnapshot.data() ?? {};

  const role = membership.role;

  if (membership.active !== true || (role !== 'org_owner' && role !== 'org_admin')) {
    throw new HttpsError(
      'permission-denied',
      'Only organization owners and administrators can manage invitations.',
    );
  }

  // Reading invitations is also needed when reviewing a completed
  // onboarding step. Only invitation creation should require the active
  // Invite Team step.
  if (options.requireInviteStep === true) {
    if (organization.status !== 'onboarding') {
      throw new HttpsError('failed-precondition', 'Organization onboarding is no longer active.');
    }

    if (onboarding.status !== 'in_progress') {
      throw new HttpsError('failed-precondition', 'Organization onboarding is not in progress.');
    }

    if (onboarding.currentStep !== 'invite_members') {
      throw new HttpsError(
        'failed-precondition',
        'The organization is not currently on the Invite Team step.',
      );
    }
  }

  return {
    organization,
    onboarding,
  };
}

/**
 * Create an organization invitation.
 */
export const createOrganizationInvitation = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const data = request.data as Record<string, unknown>;

    const organizationId =
      typeof data.organizationId === 'string' ? data.organizationId.trim() : '';

    if (!organizationId) {
      throw new HttpsError('invalid-argument', 'Organization ID is required.');
    }

    const email = normalizeEmail(data.email);

    const role = normalizeRole(data.role);

    const uid = request.auth.uid;

    const { organization, onboarding } = await requireOrganizationInvitationAdmin(
      organizationId,
      uid,
    );

    // Permit invitations during the Invite Team onboarding step
    // and after onboarding has been completed.
    const organizationStatus = organization.status;
    const onboardingStatus = onboarding.status;
    const currentStep = onboarding.currentStep;

    const isActiveOnboardingInviteStep =
      organizationStatus === 'onboarding' &&
      onboardingStatus === 'in_progress' &&
      currentStep === 'invite_members';

    const isCompletedOnboarding =
      organizationStatus === 'active' || onboardingStatus === 'completed';

    if (!isActiveOnboardingInviteStep && !isCompletedOnboarding) {
      throw new HttpsError(
        'failed-precondition',
        'Invitations are only available during the Invite Team onboarding step or after onboarding is complete.',
      );
    }

    const db = getFirestore();

    const invitationCollection = db.collection('organizationInvitations');

    /*
     * Prevent duplicate pending invitations
     * for the same organization/email.
     *
     * Firestore supports compound equality
     * queries without requiring a manual
     * composite index.
     */
    const existingSnapshot = await invitationCollection
      .where('organizationId', '==', organizationId)
      .where('normalizedEmail', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      throw new HttpsError(
        'already-exists',
        'A pending invitation already exists for this email address.',
      );
    }

    const invitationRef = invitationCollection.doc();

    const now = FieldValue.serverTimestamp();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const organizationName =
      typeof organization.name === 'string' ? organization.name : 'your organization';

    const invitation = {
      id: invitationRef.id,

      organizationId,

      email,

      normalizedEmail: email,

      role,

      invitedByUserId: uid,

      status: 'pending' as OrganizationInvitationStatus,

      expiresAt,

      acceptedAt: null,

      acceptedByUserId: null,

      createdAt: now,

      updatedAt: now,
    };

    /*
     * Create the invitation and its email outbox record atomically.
     *
     * The outbox worker sends the invitation email through Resend.
     * Its text and HTML bodies both include the acceptance URL.
     */
    const outboxRef = db.collection('organizationEmailOutbox').doc();

    const outboxData = createOrganizationInvitationOutboxData({
      invitationId: invitationRef.id,
      organizationId,
      organizationName,
      recipientEmail: email,
      role: getRoleLabel(role),
      expiresAt,
    });

    const emailStatus = 'queued' as const;

    // Store the queued status with the invitation so the invitation and
    // email outbox record are committed together.
    const invitationWithEmailStatus = {
      ...invitation,
      emailStatus,
    };

    await db.runTransaction(async (transaction) => {
      transaction.create(invitationRef, invitationWithEmailStatus);
      transaction.create(outboxRef, outboxData);
    });

    await db.collection('auditLogs').add({
      action: 'ORGANIZATION_INVITATION_CREATED',

      entityType: 'organizationInvitation',

      entityId: invitationRef.id,

      actorId: uid,

      actorEmail: request.auth.token.email ?? null,

      actorName: null,

      actorType: 'user',

      outcome: 'success',

      source: 'backend',

      reason: null,

      metadata: {
        organizationId,
        email,
        role,
        expiresAt,
        emailStatus,
      },

      before: null,

      after: {
        status: 'pending',

        role,

        email,
      },

      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info('Organization invitation created.', {
      organizationId,

      invitationId: invitationRef.id,

      actorId: uid,
    });

    return {
      success: true,

      invitationId: invitationRef.id,

      emailStatus,

      invitation: {
        ...invitationWithEmailStatus,

        expiresAt: expiresAt.toISOString(),
      },
    };
  },
);

/**
 * Retrieve invitations for the current organization.
 */
export const getOrganizationInvitations = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const data = request.data as Record<string, unknown>;

    const organizationId =
      typeof data.organizationId === 'string' ? data.organizationId.trim() : '';

    if (!organizationId) {
      throw new HttpsError('invalid-argument', 'Organization ID is required.');
    }

    const uid = request.auth.uid;

    await requireOrganizationInvitationAdmin(organizationId, uid);

    const db = getFirestore();

    const snapshot = await db
      .collection('organizationInvitations')
      .where('organizationId', '==', organizationId)
      .get();

    const invitations = snapshot.docs.map((snapshot) => {
      const data = snapshot.data() as OrganizationInvitationRecord;

      return {
        id: snapshot.id,
        ...data,
      };
    });
    invitations.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;

      return bTime - aTime;
    });

    return {
      invitations,
    };
  },
);

/**
 * Complete the Invite Team onboarding step.
 *
 * Invitations are optional, so an organization
 * may continue without inviting additional users.
 */

export const completeOrganizationInviteMembersStep = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const organizationId = request.data?.organizationId;

    if (typeof organizationId !== 'string' || !organizationId.trim()) {
      throw new HttpsError('invalid-argument', 'organizationId is required.');
    }

    const normalizedOrganizationId = organizationId.trim();

    const callerUid = request.auth.uid;

    const db = getFirestore();

    const organizationRef = db.collection('organizations').doc(normalizedOrganizationId);

    const membershipRef = db
      .collection('organizationMemberships')
      .doc(`${callerUid}_${normalizedOrganizationId}`);

    const onboardingRef = db.collection('organizationOnboarding').doc(normalizedOrganizationId);

    const result = await db.runTransaction(async (transaction) => {
      const [organizationSnapshot, membershipSnapshot, onboardingSnapshot] = await Promise.all([
        transaction.get(organizationRef),
        transaction.get(membershipRef),
        transaction.get(onboardingRef),
      ]);

      if (!organizationSnapshot.exists) {
        throw new HttpsError('not-found', 'Organization not found.');
      }

      const organization = organizationSnapshot.data();

      if (organization?.status !== 'onboarding') {
        throw new HttpsError(
          'failed-precondition',
          'The organization is not currently onboarding.',
        );
      }

      if (!membershipSnapshot.exists) {
        throw new HttpsError('permission-denied', 'You are not a member of this organization.');
      }

      const membership = membershipSnapshot.data();

      if (membership?.active !== true) {
        throw new HttpsError('permission-denied', 'Your organization membership is not active.');
      }

      if (membership.role !== 'org_owner' && membership.role !== 'org_admin') {
        throw new HttpsError(
          'permission-denied',
          'Only an organization owner or administrator can complete onboarding.',
        );
      }

      if (!onboardingSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Organization onboarding has not been initialized.',
        );
      }

      const onboarding = onboardingSnapshot.data() as OrganizationOnboardingTransitionState;

      assertCurrentOnboardingStep(onboarding, 'invite_members');

      const now = FieldValue.serverTimestamp();

      const transition = advanceOnboarding(onboarding);

      transaction.update(onboardingRef, {
        completedSteps: transition.completedSteps,

        currentStep: transition.currentStep,

        status: transition.status,

        ...(transition.isComplete
          ? {
              completedAt: now,
            }
          : {
              completedAt: null,
            }),

        updatedAt: now,
      });

      return {
        organizationId: normalizedOrganizationId,

        currentStep: transition.currentStep,

        completedSteps: transition.completedSteps,

        status: transition.status,

        isComplete: transition.isComplete,
      };
    });

    return {
      success: true,
      ...result,
    };
  },
);

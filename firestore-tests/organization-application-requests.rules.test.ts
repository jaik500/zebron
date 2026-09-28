import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import fs from 'node:fs';

describe('Zebron Firestore Security Rules - Organization Application Requests', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',

      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  async function seedUser(userId: string, role: 'user' | 'admin' = 'user'): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `users/${userId}`), {
        id: userId,
        email: `${userId}@example.com`,
        displayName: userId,
        role,
      });
    });
  }

  function requestData(
    applicantUserId: string,
    status:
      | 'draft'
      | 'submitted'
      | 'under_review'
      | 'approved'
      | 'rejected'
      | 'provisioning'
      | 'onboarding'
      | 'active'
      | 'cancelled' = 'draft',
  ) {
    return {
      applicantUserId,

      organizationName: 'Zebron Training Institute',

      organizationSlug: 'zebron-training-institute',

      organizationType: 'training_provider',

      contactName: 'John Doe',

      contactEmail: 'john@example.com',

      requestedApplications: ['test-center', 'community'],

      status,

      createdAt: new Date(),

      updatedAt: new Date(),
    };
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  it('allows an authenticated user to create their own draft request', async () => {
    await seedUser('applicant');

    const context = testEnv.authenticatedContext('applicant');

    await assertSucceeds(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'draft'),
      ),
    );
  });

  it('allows an authenticated user to submit their own request', async () => {
    await seedUser('applicant');

    const context = testEnv.authenticatedContext('applicant');

    await assertSucceeds(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      ),
    );
  });

  it('denies an unauthenticated user from creating a request', async () => {
    const context = testEnv.unauthenticatedContext();

    await assertFails(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant'),
      ),
    );
  });

  it('denies a user from creating a request for another user', async () => {
    await seedUser('attacker');

    const context = testEnv.authenticatedContext('attacker');

    await assertFails(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('victim'),
      ),
    );
  });

  it('denies an applicant from creating an approved request', async () => {
    await seedUser('applicant');

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'approved'),
      ),
    );
  });

  it('denies an applicant from creating a provisioning request', async () => {
    await seedUser('applicant');

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'provisioning'),
      ),
    );
  });

  // ==========================================================
  // READ
  // ==========================================================

  it('allows an applicant to read their own request', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertSucceeds(
      getDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1')),
    );
  });

  it('denies another user from reading an applicant request', async () => {
    await seedUser('applicant');
    await seedUser('other-user');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('other-user');

    await assertFails(
      getDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1')),
    );
  });

  it('allows a platform admin to read an application request', async () => {
    await seedUser('platform-admin', 'admin');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('platform-admin');

    await assertSucceeds(
      getDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1')),
    );
  });

  // ==========================================================
  // DRAFT UPDATE
  // ==========================================================

  it('allows an applicant to update their own draft', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'draft'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertSucceeds(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        organizationName: 'Updated Training Institute',
      }),
    );
  });

  it('denies an applicant from changing their applicantUserId', async () => {
    await seedUser('applicant');
    await seedUser('victim');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'draft'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        applicantUserId: 'victim',
      }),
    );
  });

  it('denies an applicant from changing draft to approved', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'draft'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        status: 'approved',
      }),
    );
  });

  it('denies an applicant from changing submitted request back to draft', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        status: 'draft',
      }),
    );
  });

  // ==========================================================
  // PLATFORM ADMIN
  // ==========================================================

  it('allows a platform admin to approve a request', async () => {
    await seedUser('platform-admin', 'admin');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('platform-admin');

    await assertSucceeds(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        status: 'approved',

        reviewedBy: 'platform-admin',
      }),
    );
  });

  it('allows a platform admin to reject a request', async () => {
    await seedUser('platform-admin', 'admin');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'under_review'),
      );
    });

    const context = testEnv.authenticatedContext('platform-admin');

    await assertSucceeds(
      updateDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1'), {
        status: 'rejected',

        reviewedBy: 'platform-admin',

        rejectionReason: 'Additional information required.',
      }),
    );
  });

  // ==========================================================
  // DELETE
  // ==========================================================

  it('allows an applicant to delete their own draft', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'draft'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertSucceeds(
      deleteDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1')),
    );
  });

  it('denies an applicant from deleting a submitted request', async () => {
    await seedUser('applicant');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), 'organizationApplicationRequests/request-1'),
        requestData('applicant', 'submitted'),
      );
    });

    const context = testEnv.authenticatedContext('applicant');

    await assertFails(
      import('firebase/firestore').then(({ deleteDoc }) =>
        deleteDoc(doc(context.firestore(), 'organizationApplicationRequests/request-1')),
      ),
    );
  });
  it('allows an applicant to submit their own existing draft', async () => {
  await seedUser('applicant');

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        'organizationApplicationRequests/request-1',
      ),
      requestData('applicant', 'draft'),
    );
  });

  const context = testEnv.authenticatedContext('applicant');

  await assertSucceeds(
    updateDoc(
      doc(
        context.firestore(),
        'organizationApplicationRequests/request-1',
      ),
      {
        status: 'submitted',
      },
    ),
  );
});
});

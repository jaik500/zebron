import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { readFileSync } from 'node:fs';

describe('Organization lifecycle security rules', () => {
  let testEnv: RulesTestEnvironment;

  const organizationId = 'lifecycle-org';
  const ownerId = 'lifecycle-owner';
  const platformAdminId = 'lifecycle-admin';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-organization-lifecycle-rules',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seedOrganization(
    status: string,
    active = status === 'active',
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, `organizations/${organizationId}`), {
        id: organizationId,
        name: 'Lifecycle Test Organization',
        status,
        active,
        verified: true,
      });

      await setDoc(
        doc(
          db,
          `organizationMemberships/${ownerId}_${organizationId}`,
        ),
        {
          userId: ownerId,
          organizationId,
          role: 'org_owner',
          active: true,
        },
      );

      await setDoc(doc(db, `users/${platformAdminId}`), {
        id: platformAdminId,
        role: 'admin',
      });
    });
  }

  it('allows an active organization member to read the organization', async () => {
    await seedOrganization('active');

    const db = testEnv.authenticatedContext(ownerId).firestore();

    await assertSucceeds(
      getDoc(doc(db, `organizations/${organizationId}`)),
    );
  });

  it('denies organization members access to a suspended organization document', async () => {
    await seedOrganization('suspended', false);

    const db = testEnv.authenticatedContext(ownerId).firestore();

    await assertFails(
      getDoc(doc(db, `organizations/${organizationId}`)),
    );
  });

  it('denies organization members access to an archived organization document', async () => {
    await seedOrganization('archived', false);

    const db = testEnv.authenticatedContext(ownerId).firestore();

    await assertFails(
      getDoc(doc(db, `organizations/${organizationId}`)),
    );
  });

  it('allows a platform administrator to read a suspended organization', async () => {
    await seedOrganization('suspended', false);

    const db = testEnv.authenticatedContext(platformAdminId).firestore();

    await assertSucceeds(
      getDoc(doc(db, `organizations/${organizationId}`)),
    );
  });

  it('denies client-side permanent organization deletion', async () => {
    await seedOrganization('active');

    const db = testEnv.authenticatedContext(platformAdminId).firestore();

    await assertFails(
      deleteDoc(doc(db, `organizations/${organizationId}`)),
    );
  });

  it('allows onboarding organization members to read the organization', async () => {
    await seedOrganization('onboarding', false);

    const db = testEnv.authenticatedContext(ownerId).firestore();

    await assertSucceeds(
      getDoc(doc(db, `organizations/${organizationId}`)),
    );
  });
});
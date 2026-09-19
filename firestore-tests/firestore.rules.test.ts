import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

import fs from 'node:fs';

describe('Zebron Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  // ---------------------------------------------------------------------------
  // TEST ENVIRONMENT
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // SEED HELPERS
  // ---------------------------------------------------------------------------

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

  async function seedOrganizationMembership(
    userId: string,
    organizationId: string,
    role: 'owner' | 'admin' | 'manager' | 'member' = 'member',
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `organizationMemberships/${userId}_${organizationId}`),
        {
          userId,
          organizationId,
          role,
          active,
        },
      );
    });
  }

  async function seedGroup(
    groupId: string,
    organizationId: string,
    options: {
      active?: boolean;
      systemManaged?: boolean;
      name?: string;
    } = {},
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `groups/${groupId}`), {
        organizationId,
        name: options.name ?? `Group ${groupId}`,
        slug: groupId,
        active: options.active ?? true,
        systemManaged: options.systemManaged ?? false,
      });
    });
  }

  async function seedGroupMembership(
    userId: string,
    groupId: string,
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `groupMemberships/${userId}_${groupId}`), {
        userId,
        groupId,
        active,
      });
    });
  }

  async function seedGroupRole(
    groupRoleId: string,
    groupId: string,
    options: {
      active?: boolean;
      systemManaged?: boolean;
      name?: string;
    } = {},
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), `groupRoles/${groupRoleId}`), {
        groupId,
        name: options.name ?? `Role ${groupRoleId}`,
        description: 'Test role',
        active: options.active ?? true,
        systemManaged: options.systemManaged ?? false,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------

  describe('users', () => {
    it('denies unauthenticated profile access', async () => {
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(getDoc(doc(db, 'users/user-1')));
    });

    it('allows a user to read their own profile', async () => {
      await seedUser('user-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'users/user-1')));
    });

    it('denies a user from reading another user profile', async () => {
      await seedUser('user-2');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(getDoc(doc(db, 'users/user-2')));
    });

    it('allows a platform admin to read another user profile', async () => {
      await seedUser('admin-1', 'admin');
      await seedUser('user-2');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'users/user-2')));
    });
  });

  // ---------------------------------------------------------------------------
  // ORGANIZATION MEMBERSHIPS
  // ---------------------------------------------------------------------------

  describe('organization memberships', () => {
    it('allows a user to read their own membership', async () => {
      await seedOrganizationMembership('user-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'organizationMemberships/user-1_org-1')));
    });

    it('denies an unrelated user from reading the membership', async () => {
      await seedOrganizationMembership('user-1', 'org-1');

      const db = testEnv.authenticatedContext('user-2').firestore();

      await assertFails(getDoc(doc(db, 'organizationMemberships/user-1_org-1')));
    });

    it('allows an organization admin to read a member membership', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      await seedOrganizationMembership('user-2', 'org-1', 'member');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'organizationMemberships/user-2_org-1')));
    });

    it('denies an organization admin from another organization', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      await seedOrganizationMembership('user-2', 'org-2', 'member');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(getDoc(doc(db, 'organizationMemberships/user-2_org-2')));
    });
  });

  // ---------------------------------------------------------------------------
  // GROUPS
  // ---------------------------------------------------------------------------

  describe('groups', () => {
    it('allows an organization member to read an active group', async () => {
      await seedOrganizationMembership('user-1', 'org-1');

      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'groups/group-1')));
    });

    it('denies a user from another organization', async () => {
      await seedOrganizationMembership('user-1', 'org-1');

      await seedGroup('group-1', 'org-2');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(getDoc(doc(db, 'groups/group-1')));
    });

    it('allows an organization admin to create a group', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'groups/group-1'), {
          organizationId: 'org-1',
          name: 'Test Group',
          slug: 'test-group',
          active: true,
          systemManaged: false,
        }),
      );
    });

    it('denies a regular member from creating a group', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(doc(db, 'groups/group-1'), {
          organizationId: 'org-1',
          name: 'Unauthorized Group',
          slug: 'unauthorized-group',
          active: true,
          systemManaged: false,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP MEMBERSHIPS
  // ---------------------------------------------------------------------------

  describe('group memberships', () => {
    it('allows a group member to read their own active membership', async () => {
      await seedOrganizationMembership('user-1', 'org-1');

      await seedGroup('group-1', 'org-1');

      await seedGroupMembership('user-1', 'group-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'groupMemberships/user-1_group-1')));
    });

    it('denies a user from another organization', async () => {
      await seedOrganizationMembership('user-1', 'org-2');

      await seedGroup('group-1', 'org-1');

      await seedGroupMembership('user-2', 'group-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(getDoc(doc(db, 'groupMemberships/user-2_group-1')));
    });

    it('allows an organization admin to create a group membership', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'groupMemberships/user-2_group-1'), {
          userId: 'user-2',
          groupId: 'group-1',
          active: true,
        }),
      );
    });

    it('denies a regular member from creating a group membership', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member');

      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(doc(db, 'groupMemberships/user-2_group-1'), {
          userId: 'user-2',
          groupId: 'group-1',
          active: true,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP ROLES
  // ---------------------------------------------------------------------------

  describe('group roles', () => {
    it('allows an organization admin to read group roles', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      await seedGroup('group-1', 'org-1');

      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'groupRoles/role-1')));
    });

    it('allows an organization admin to create a group role', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin');

      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'groupRoles/role-1'), {
          groupId: 'group-1',
          name: 'Moderator',
          description: 'Moderates community content',
          active: true,
          systemManaged: false,
        }),
      );
    });

    it('denies a regular member from creating a group role', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member');

      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(doc(db, 'groupRoles/role-1'), {
          groupId: 'group-1',
          name: 'Unauthorized Role',
          description: 'Should not be allowed',
          active: true,
          systemManaged: false,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // UNAUTHORIZED ACL ACCESS
  // ---------------------------------------------------------------------------

  describe('unauthorized ACL access', () => {
    it('denies an unauthenticated user from creating a group', async () => {
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        setDoc(doc(db, 'groups/group-1'), {
          organizationId: 'org-1',
          name: 'Unauthorized Group',
          slug: 'unauthorized-group',
          active: true,
          systemManaged: false,
        }),
      );
    });

    it('denies an unauthenticated user from reading a group', async () => {
      await seedGroup('group-1', 'org-1');

      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(getDoc(doc(db, 'groups/group-1')));
    });
  });

  // ---------------------------------------------------------------------------
  // QUERY / LIST AUTHORIZATION
  // ---------------------------------------------------------------------------

  describe('query and list authorization', () => {
it('allows a user to query their own organization memberships', async () => {
  await seedOrganizationMembership(
    'user-1',
    'org-1',
    'member',
    true,
  );

  await seedOrganizationMembership(
    'user-2',
    'org-1',
    'member',
    true,
  );

  const db = testEnv.authenticatedContext('user-1').firestore();

  const membershipsQuery = query(
    collection(db, 'organizationMemberships'),
    where('userId', '==', 'user-1'),
  );

  const snapshot = await getDocs(membershipsQuery);

  expect(snapshot.docs).toHaveLength(1);
  expect(snapshot.docs[0].id).toBe('user-1_org-1');
});

    it('denies an unscoped organization membership query', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'member', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(collection(db, 'organizationMemberships'));

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization admin to query memberships in their organization', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin', true);

      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'member', true);

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const membershipsQuery = query(
        collection(db, 'organizationMemberships'),
        where('organizationId', '==', 'org-1'),
      );

      const snapshot = await getDocs(membershipsQuery);

      expect(snapshot.docs).toHaveLength(2);

      expect(snapshot.docs.map((entry) => entry.id).sort()).toEqual([
        'admin-1_org-1',
        'user-1_org-1',
      ]);
    });

    it('denies an organization admin from using an unscoped membership query', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin', true);

      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'member', true);

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const membershipsQuery = query(collection(db, 'organizationMemberships'));

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization member to query groups in their organization', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroup('group-2', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroup('group-3', 'org-2', {
        active: true,
        systemManaged: false,
      });

      const db = testEnv.authenticatedContext('user-1').firestore();

      const groupsQuery = query(
        collection(db, 'groups'),
        where('organizationId', '==', 'org-1'),
        where('active', '==', true),
      );

      const snapshot = await getDocs(groupsQuery);

      expect(snapshot.docs).toHaveLength(2);

      expect(snapshot.docs.map((entry) => entry.id).sort()).toEqual(['group-1', 'group-2']);
    });

    it('denies an organization member from using an unscoped group query', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroup('group-2', 'org-2', {
        active: true,
        systemManaged: false,
      });

      const db = testEnv.authenticatedContext('user-1').firestore();

      const groupsQuery = query(collection(db, 'groups'));

      await assertFails(getDocs(groupsQuery));
    });

    it('allows a user to query their own group memberships', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroupMembership('user-1', 'group-1', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(
        collection(db, 'groupMemberships'),
        where('userId', '==', 'user-1'),
      );

      const snapshot = await getDocs(membershipsQuery);

      expect(snapshot.docs).toHaveLength(1);
      expect(snapshot.docs[0].id).toBe('user-1_group-1');
    });

    it('denies an unscoped group membership query', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'member', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroupMembership('user-1', 'group-1', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(collection(db, 'groupMemberships'));

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization admin to query group roles for their group', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroupRole('role-1', 'group-1', {
        active: true,
        systemManaged: false,
      });

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const rolesQuery = query(collection(db, 'groupRoles'), where('groupId', '==', 'group-1'));

      const snapshot = await getDocs(rolesQuery);

      expect(snapshot.docs).toHaveLength(1);
      expect(snapshot.docs[0].id).toBe('role-1');
    });

    it('denies an unscoped group role query', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'admin', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroupRole('role-1', 'group-1', {
        active: true,
        systemManaged: false,
        name: 'Group Admin',
      });

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const rolesQuery = query(collection(db, 'groupRoles'));

      await assertFails(getDocs(rolesQuery));
    });
  });
});

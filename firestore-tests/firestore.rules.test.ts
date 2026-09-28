import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

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
    role: 'org_owner' | 'org_admin' | 'org_manager' | 'org_staff' | 'org_member' = 'org_member',
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

  async function seedOrganization(
  organizationId: string,
  options: {
    active?: boolean;
    name?: string;
  } = {},
): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(
        context.firestore(),
        `organizations/${organizationId}`,
      ),
      {
        id: organizationId,
        name: options.name ?? `Organization ${organizationId}`,
        normalizedName:
          (options.name ?? `Organization ${organizationId}`)
            .toLowerCase(),
        active: options.active ?? true,
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
      await setDoc(
        doc(
          context.firestore(),
          `organizations/${organizationId}/groups/${groupId}`,
        ),
        {
          organizationId,
          name: options.name ?? `Group ${groupId}`,
          slug: groupId,
          active: options.active ?? true,
          systemManaged: options.systemManaged ?? false,
        },
      );
    });
  }

  async function seedGroupMembership(
    userId: string,
    organizationId: string,
    groupId: string,
    active = true,
  ): Promise<void> {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          `organizations/${organizationId}/groups/${groupId}/members/${userId}_${groupId}`,
        ),
        {
          userId,
          groupId,
          active,
        },
      );
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
      const organizationId = 'org-1';

      await setDoc(
        doc(
          context.firestore(),
          `organizations/${organizationId}/groups/${groupId}/roles/${groupRoleId}`,
        ),
        {
          groupId,
          name: options.name ?? `Role ${groupRoleId}`,
          description: 'Test role',
          active: options.active ?? true,
          systemManaged: options.systemManaged ?? false,
        },
      );
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
// ORGANIZATIONS
// ---------------------------------------------------------------------------

describe('organizations', () => {
  it('allows an active organization member to read their organization', async () => {
    await seedOrganization('org-1');

    await seedOrganizationMembership(
      'user-1',
      'org-1',
    );

    const db =
      testEnv
        .authenticatedContext('user-1')
        .firestore();

    await assertSucceeds(
      getDoc(
        doc(
          db,
          'organizations/org-1',
        ),
      ),
    );
  });

  it('denies an organization member from reading another organization', async () => {
    await seedOrganization('org-1');
    await seedOrganization('org-2');

    await seedOrganizationMembership(
      'user-1',
      'org-1',
    );

    const db =
      testEnv
        .authenticatedContext('user-1')
        .firestore();

    await assertFails(
      getDoc(
        doc(
          db,
          'organizations/org-2',
        ),
      ),
    );
  });

  it('denies an unauthenticated user from reading an organization', async () => {
    await seedOrganization('org-1');

    const db =
      testEnv
        .unauthenticatedContext()
        .firestore();

    await assertFails(
      getDoc(
        doc(
          db,
          'organizations/org-1',
        ),
      ),
    );
  });

  it('denies an organization member from listing organizations', async () => {
    await seedOrganization('org-1');
    await seedOrganization('org-2');

    await seedOrganizationMembership(
      'user-1',
      'org-1',
    );

    const db =
      testEnv
        .authenticatedContext('user-1')
        .firestore();

    await assertFails(
      getDocs(
        collection(
          db,
          'organizations',
        ),
      ),
    );
  });

  it('allows a platform admin to read any organization', async () => {
    await seedUser(
      'admin-1',
      'admin',
    );

    await seedOrganization('org-1');

    const db =
      testEnv
        .authenticatedContext('admin-1')
        .firestore();

    await assertSucceeds(
      getDoc(
        doc(
          db,
          'organizations/org-1',
        ),
      ),
    );
  });

  it('allows a platform admin to list organizations', async () => {
    await seedUser(
      'admin-1',
      'admin',
    );

    await seedOrganization('org-1');
    await seedOrganization('org-2');

    const db =
      testEnv
        .authenticatedContext('admin-1')
        .firestore();

    await assertSucceeds(
      getDocs(
        collection(
          db,
          'organizations',
        ),
      ),
    );
  });

  it('denies an organization member from creating an organization', async () => {
    await seedOrganizationMembership(
      'user-1',
      'org-1',
      'org_owner',
    );

    const db =
      testEnv
        .authenticatedContext('user-1')
        .firestore();

    await assertFails(
      setDoc(
        doc(
          db,
          'organizations/org-2',
        ),
        {
          id: 'org-2',
          name: 'Organization 2',
          normalizedName: 'organization 2',
          active: true,
        },
      ),
    );
  });

  it('denies an organization admin from modifying an organization', async () => {
    await seedOrganization('org-1');

    await seedOrganizationMembership(
      'user-1',
      'org-1',
      'org_admin',
    );

    const db =
      testEnv
        .authenticatedContext('user-1')
        .firestore();

    await assertFails(
      setDoc(
        doc(
          db,
          'organizations/org-1',
        ),
        {
          id: 'org-1',
          name: 'Modified Organization',
          normalizedName: 'modified organization',
          active: true,
        },
      ),
    );
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
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');

      await seedOrganizationMembership('user-2', 'org-1', 'org_member');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'organizationMemberships/user-2_org-1')));
    });

    it('denies an organization admin from another organization', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');

      await seedOrganizationMembership('user-2', 'org-2', 'org_member');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(getDoc(doc(db, 'organizationMemberships/user-2_org-2')));
    });
  });

  // ---------------------------------------------------------------------------
  // GROUPS
  // ---------------------------------------------------------------------------

  describe('groups', () => {
    it('allows an organization member to read an active group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1');
      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1',
          ),
        ),
      );
    });

    it('denies a user from another organization', async () => {
      await seedOrganization('org-1');
      await seedOrganization('org-2');
      await seedOrganizationMembership('user-1', 'org-1');
      await seedGroup('group-1', 'org-2');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'organizations/org-2/groups/group-1',
          ),
        ),
      );
    });

    it('denies a member from reading an inactive group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1');
      await seedGroup('group-1', 'org-1', { active: false });

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1',
          ),
        ),
      );
    });

    it('allows an organization admin to create a group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1',
          ),
          {
            organizationId: 'org-1',
            name: 'Test Group',
            slug: 'test-group',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });

    it('denies an organization admin from creating a group for another organization', async () => {
      await seedOrganization('org-1');
      await seedOrganization('org-2');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-2/groups/group-1',
          ),
          {
            organizationId: 'org-2',
            name: 'Unauthorized Group',
            slug: 'unauthorized-group',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });

    it('denies a regular member from creating a group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1',
          ),
          {
            organizationId: 'org-1',
            name: 'Unauthorized Group',
            slug: 'unauthorized-group',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP MEMBERSHIPS
  // ---------------------------------------------------------------------------

  describe('group memberships', () => {
    it('allows a group member to read their own active membership', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1');
      await seedGroup('group-1', 'org-1');
      await seedGroupMembership('user-1', 'org-1', 'group-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/members/user-1_group-1',
          ),
        ),
      );
    });

    it('denies a user from another organization', async () => {
      await seedOrganization('org-1');
      await seedOrganization('org-2');
      await seedOrganizationMembership('user-1', 'org-2');
      await seedGroup('group-1', 'org-1');
      await seedGroupMembership('user-2', 'org-1', 'group-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        getDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/members/user-2_group-1',
          ),
        ),
      );
    });

    it('allows an organization admin to create a group membership', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/members/user-2_group-1',
          ),
          {
            userId: 'user-2',
            groupId: 'group-1',
            active: true,
          },
        ),
      );
    });

    it('denies a regular member from creating a group membership', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');
      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/members/user-2_group-1',
          ),
          {
            userId: 'user-2',
            groupId: 'group-1',
            active: true,
          },
        ),
      );
    });

    it('prevents a membership from being moved to another group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');
      await seedGroup('group-2', 'org-1');
      await seedGroupMembership('user-2', 'org-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/members/user-2_group-1',
          ),
          {
            userId: 'user-2',
            groupId: 'group-2',
            active: true,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP ROLES
  // ---------------------------------------------------------------------------

  describe('group roles', () => {
    it('allows an organization admin to read group roles', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');
      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        getDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1',
          ),
        ),
      );
    });

    it('allows an organization admin to create a group role', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1',
          ),
          {
            groupId: 'group-1',
            name: 'Moderator',
            description: 'Moderates community content',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });

    it('denies a regular member from creating a group role', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');
      await seedGroup('group-1', 'org-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1',
          ),
          {
            groupId: 'group-1',
            name: 'Unauthorized Role',
            description: 'Should not be allowed',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });

    it('prevents a role from being moved to another group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');
      await seedGroup('group-2', 'org-1');
      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1',
          ),
          {
            groupId: 'group-2',
            name: 'Moved Role',
            description: 'Should not be allowed',
            active: true,
            systemManaged: false,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP ROLE PERMISSIONS
  // ---------------------------------------------------------------------------

  describe('group role permissions', () => {
    it('allows an organization admin to create a group role permission', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedGroup('group-1', 'org-1');
      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1/permissions/permission-1',
          ),
          {
            groupRoleId: 'role-1',
            permission: 'community.moderate',
            active: true,
          },
        ),
      );
    });

    it('denies a regular member from creating a group role permission', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');
      await seedGroup('group-1', 'org-1');
      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('user-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roles/role-1/permissions/permission-1',
          ),
          {
            groupRoleId: 'role-1',
            permission: 'community.moderate',
            active: true,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // GROUP ROLE ASSIGNMENTS
  // ---------------------------------------------------------------------------

  describe('group role assignments', () => {
    it('allows an organization admin to create a role assignment', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');
      await seedGroup('group-1', 'org-1');
      await seedGroupMembership('user-1', 'org-1', 'group-1');
      await seedGroupRole('role-1', 'group-1');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roleAssignments/assignment-1',
          ),
          {
            groupMembershipId: 'user-1_group-1',
            groupRoleId: 'role-1',
            active: true,
          },
        ),
      );
    });

    it('denies an assignment that references a role from another group', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member');
      await seedGroup('group-1', 'org-1');
      await seedGroup('group-2', 'org-1');
      await seedGroupMembership('user-1', 'org-1', 'group-1');
      await seedGroupRole('role-1', 'group-1');
      await seedGroupRole('role-2', 'group-2');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertFails(
        setDoc(
          doc(
            db,
            'organizations/org-1/groups/group-1/roleAssignments/assignment-1',
          ),
          {
            groupMembershipId: 'user-1_group-1',
            groupRoleId: 'role-2',
            active: true,
          },
        ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // TEST PROGRAMS
  // ---------------------------------------------------------------------------

  describe('test programs', () => {
    it('allows a platform admin to read any test program', async () => {
      await seedUser('platform-admin', 'admin');
      await seedOrganization('org-1');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('platform-admin').firestore();

      await assertSucceeds(getDoc(doc(db, 'testPrograms/program-1')));
    });

    it('allows an organization member to read a program in their organization', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('member-1', 'org-1', 'org_member');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('member-1').firestore();

      await assertSucceeds(getDoc(doc(db, 'testPrograms/program-1')));
    });

    it('denies an organization member from reading a program in another organization', async () => {
      await seedOrganization('org-1');
      await seedOrganization('org-2');
      await seedOrganizationMembership('member-1', 'org-1', 'org_member');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-2'), {
          organizationId: 'org-2',
          name: 'Program Two',
          slug: 'program-two',
          description: 'Other organization program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('member-1').firestore();

      await assertFails(getDoc(doc(db, 'testPrograms/program-2')));
    });

    it('allows an organization manager to create a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('manager-1', 'org-1', 'org_manager');

      const db = testEnv.authenticatedContext('manager-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('allows an organization admin to create a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin');

      const db = testEnv.authenticatedContext('admin-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('denies an organization staff member from creating a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('staff-1', 'org-1', 'org_staff');

      const db = testEnv.authenticatedContext('staff-1').firestore();

      await assertFails(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Unauthorized Program',
          slug: 'unauthorized-program',
          description: 'Should not be allowed',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('denies an organization member from creating a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('member-1', 'org-1', 'org_member');

      const db = testEnv.authenticatedContext('member-1').firestore();

      await assertFails(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Unauthorized Program',
          slug: 'unauthorized-program',
          description: 'Should not be allowed',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('allows an organization manager to update a program in their organization', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('manager-1', 'org-1', 'org_manager');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Original Program',
          slug: 'original-program',
          description: 'Original description',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('manager-1').firestore();

      await assertSucceeds(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Updated Program',
          slug: 'updated-program',
          description: 'Updated description',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('denies an organization manager from moving a program to another organization', async () => {
      await seedOrganization('org-1');
      await seedOrganization('org-2');
      await seedOrganizationMembership('manager-1', 'org-1', 'org_manager');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('manager-1').firestore();

      await assertFails(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-2',
          name: 'Moved Program',
          slug: 'moved-program',
          description: 'Should not be allowed',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('denies an organization member from updating a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('member-1', 'org-1', 'org_member');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('member-1').firestore();

      await assertFails(
        setDoc(doc(db, 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Unauthorized Update',
          slug: 'unauthorized-update',
          description: 'Should not be allowed',
          active: true,
          courseCount: 0,
        }),
      );
    });

    it('denies an organization member from deleting a program', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('member-1', 'org-1', 'org_member');

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'testPrograms/program-1'), {
          organizationId: 'org-1',
          name: 'Program One',
          slug: 'program-one',
          description: 'Test program',
          active: true,
          courseCount: 0,
        });
      });

      const db = testEnv.authenticatedContext('member-1').firestore();

      await assertFails(
        deleteDoc(doc(db, 'testPrograms/program-1')),
      );
    });
  });

  // UNAUTHORIZED ACL ACCESS
  // ---------------------------------------------------------------------------

  describe('unauthorized ACL access', () => {
    it('denies an unauthenticated user from creating a group', async () => {
      const db = testEnv.unauthenticatedContext().firestore();

      await assertFails(
        setDoc(doc(db, 'organizations/org-1/groups/group-1'), {
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

      await assertFails(getDoc(doc(db, 'organizations/org-1/groups/group-1')));
    });
  });

  // ---------------------------------------------------------------------------
  // QUERY / LIST AUTHORIZATION
  // ---------------------------------------------------------------------------

  describe('query and list authorization', () => {
    it('allows a user to query their own organization memberships', async () => {
      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);

      await seedOrganizationMembership('user-2', 'org-1', 'org_member', true);

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
      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'org_member', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(collection(db, 'organizationMemberships'));

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization admin to query memberships in their organization', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin', true);

      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'org_member', true);

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
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin', true);

      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);

      await seedOrganizationMembership('user-2', 'org-2', 'org_member', true);

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const membershipsQuery = query(collection(db, 'organizationMemberships'));

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization member to query groups in their organization', async () => {
  await seedOrganization('org-1');
  await seedOrganization('org-2');

  await seedOrganizationMembership(
    'user-1',
    'org-1',
    'org_member',
    true,
  );

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

  const db = testEnv
    .authenticatedContext('user-1')
    .firestore();

  const groupsQuery = query(
    collection(
      db,
      'organizations/org-1/groups',
    ),
    where('active', '==', true),
  );

  const snapshot = await getDocs(groupsQuery);

  expect(snapshot.docs).toHaveLength(2);

  expect(
    snapshot.docs
      .map((entry) => entry.id)
      .sort(),
  ).toEqual([
    'group-1',
    'group-2',
  ]);
});

    it('denies an organization member from querying groups without the active constraint', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroup('group-2', 'org-1', {
        active: false,
        systemManaged: false,
      });

      const db = testEnv.authenticatedContext('user-1').firestore();

      const groupsQuery = query(
        collection(db, 'organizations/org-1/groups'),
      );

      await assertFails(getDocs(groupsQuery));
    });

    it('allows a user to query their own group memberships', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);
      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });
      await seedGroupMembership('user-1', 'org-1', 'group-1', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(
        collection(
          db,
          'organizations/org-1/groups/group-1/members',
        ),
        where('userId', '==', 'user-1'),
        where('active', '==', true),
      );

      const snapshot = await getDocs(membershipsQuery);

      expect(snapshot.docs).toHaveLength(1);
      expect(snapshot.docs[0].id).toBe('user-1_group-1');
    });

    it('denies an unscoped group membership query', async () => {
      await seedOrganization('org-1');
      await seedOrganizationMembership('user-1', 'org-1', 'org_member', true);
      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });
      await seedGroupMembership('user-1', 'org-1', 'group-1', true);

      const db = testEnv.authenticatedContext('user-1').firestore();

      const membershipsQuery = query(
        collection(
          db,
          'organizations/org-1/groups/group-1/members',
        ),
      );

      await assertFails(getDocs(membershipsQuery));
    });

    it('allows an organization admin to query group roles for their group', async () => {
      await seedOrganizationMembership('admin-1', 'org-1', 'org_admin', true);

      await seedGroup('group-1', 'org-1', {
        active: true,
        systemManaged: false,
      });

      await seedGroupRole('role-1', 'group-1', {
        active: true,
        systemManaged: false,
      });

      const db = testEnv.authenticatedContext('admin-1').firestore();

      const rolesQuery = query(
        collection(
          db,
          'organizations/org-1/groups/group-1/roles',
        ),
      );

      const snapshot = await getDocs(rolesQuery);

      expect(snapshot.docs).toHaveLength(1);
      expect(snapshot.docs[0].id).toBe('role-1');
    });

it('denies an organization member from querying group roles', async () => {
  await seedOrganizationMembership(
    'user-1',
    'org-1',
    'org_member',
    true,
  );

  await seedGroup('group-1', 'org-1', {
    active: true,
    systemManaged: false,
  });

  await seedGroupRole('role-1', 'group-1', {
    active: true,
    systemManaged: false,
    name: 'Group Admin',
  });

  const db = testEnv
    .authenticatedContext('user-1')
    .firestore();

  const rolesQuery = query(
    collection(
      db,
      'organizations/org-1/groups/group-1/roles',
    ),
  );

  await assertFails(getDocs(rolesQuery));
});

it('denies client reads of organization invitations', async () => {
  const user = testEnv.authenticatedContext('user-1');

  await assertFails(
    getDoc(
      doc(
        user.firestore(),
        'organizationInvitations',
        'invitation-1',
      ),
    ),
  );
});

it('denies client creation of organization invitations', async () => {
  const user = testEnv.authenticatedContext('user-1');

  await assertFails(
    setDoc(
      doc(
        user.firestore(),
        'organizationInvitations',
        'invitation-1',
      ),
      {
        organizationId: 'org-1',
        email: 'test@example.com',
        normalizedEmail: 'test@example.com',
        role: 'org_member',
        invitedByUserId: 'user-1',
        status: 'pending',
      },
    ),
  );
});
    });
});

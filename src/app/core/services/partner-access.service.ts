import { Injectable, computed, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { PartnerOrganizationContextService } from './partner-organization-context.service';

export type PartnerRole =
  | 'org_owner'
  | 'org_admin'
  | 'org_manager'
  | 'org_staff'
  | 'org_member';

/**
 * Organization role ladder. Each role includes everything the
 * roles below it can do.
 */
export const PARTNER_ROLE_RANK: Record<PartnerRole, number> = {
  org_member: 1,
  org_staff: 2,
  org_manager: 3,
  org_admin: 4,
  org_owner: 5,
};

/** Roles ordered from lowest to highest. */
export const PARTNER_ROLES_ASCENDING: readonly PartnerRole[] = [
  'org_member',
  'org_staff',
  'org_manager',
  'org_admin',
  'org_owner',
];

/**
 * Partner permissions and the minimum role each one needs.
 *
 * This is the single place to change who can do what in the
 * partner dashboard. Route guards (`minimumOrganizationRole`) and
 * Firestore rules enforce the same ladder.
 */
export const PARTNER_PERMISSIONS = {
  /** See and open every provisioned application on the dashboard. */
  'applications.view': 'org_member',

  /** Settings icon on the Test Center card (Test Center management). */
  'testCenter.settings': 'org_staff',

  /** Administration card and the Organization Management page. */
  'administration.access': 'org_manager',

  /** Invite people and change roles of anyone below your own role. */
  'members.manage': 'org_manager',

  /** Organization mailbox: read and send email for the organization. */
  'mailbox.access': 'org_manager',

  /** Organization Community: hide/remove posts and comments, reports, topics. */
  'community.moderate': 'org_manager',

  /** Knowledge Center gear: write, publish and archive organization articles. */
  'knowledge.manage': 'org_staff',

  /** Dashboard banners: events, cohorts, graduations, shout-outs. */
  'announcements.manage': 'org_manager',

  /** Contracts and billing (planned). */
  'billing.manage': 'org_manager',

  /** Audit log on the Administration page. */
  'audit.view': 'org_admin',

  /** Configuration card on the Administration page. */
  'organization.configure': 'org_admin',

  /** Request new applications or retirement of existing ones. */
  'applications.request': 'org_admin',

  /** Approve application requests and retirements. */
  'applications.approve': 'org_owner',

  /** Terminate the partnership with Zebron. */
  'partnership.terminate': 'org_owner',
} as const satisfies Record<string, PartnerRole>;

export type PartnerPermission = keyof typeof PARTNER_PERMISSIONS;

@Injectable({
  providedIn: 'root',
})
export class PartnerAccessService {
  private readonly auth = inject(AuthService);

  private readonly context = inject(
    PartnerOrganizationContextService,
  );

  /**
   * ============================================================
   * PLATFORM ACCESS
   * ============================================================
   *
   * AuthService.isAdmin represents the platform-level
   * administrator role.
   *
   * Platform administrators are NOT required to have an
   * organization membership.
   */
  readonly isPlatformAdmin = computed(
    () => this.auth.isAdmin,
  );

  /**
   * ============================================================
   * ORGANIZATION ROLE
   * ============================================================
   *
   * Platform administrators may have no organization role
   * because their access is platform-wide.
   */
  readonly role = computed<PartnerRole>(() => {
    const role = this.context.organizationRole();

    switch (role) {
      case 'org_owner':
        return 'org_owner';

      case 'org_admin':
        return 'org_admin';

      case 'org_manager':
        return 'org_manager';

      case 'org_staff':
        return 'org_staff';

      case 'org_member':
        return 'org_member';

      default:
        return 'org_member';
    }
  });

  /**
   * ============================================================
   * ROLE LEVELS
   * ============================================================
   */

  /**
   * Organization owner.
   *
   * Platform administrators are treated as having unrestricted
   * access regardless of the current organization role.
   */
  readonly isOwner = computed(
    () =>
      this.isPlatformAdmin() ||
      this.role() === 'org_owner',
  );

  /**
   * Organization administrator.
   */
  readonly isAdmin = computed(
    () =>
      this.isPlatformAdmin() ||
      this.role() === 'org_owner' ||
      this.role() === 'org_admin',
  );

  /**
   * Manager or above.
   */
  readonly isManagerOrAbove = computed(
    () =>
      this.isPlatformAdmin() ||
      this.role() === 'org_owner' ||
      this.role() === 'org_admin' ||
      this.role() === 'org_manager',
  );

  /**
   * Staff or above.
   *
   * Staff can perform day-to-day operational work.
   */
  readonly isStaffOrAbove = computed(
    () =>
      this.isPlatformAdmin() ||
      this.role() === 'org_owner' ||
      this.role() === 'org_admin' ||
      this.role() === 'org_manager' ||
      this.role() === 'org_staff',
  );

  /**
   * ============================================================
   * ADMINISTRATION
   * ============================================================
   */

  /**
   * Whether the current user holds a permission in the selected
   * organization. Platform administrators hold every permission.
   */
  can(permission: PartnerPermission): boolean {
    return this.hasMinimumRole(PARTNER_PERMISSIONS[permission]);
  }

  /**
   * Access to the Administration card and the Organization
   * Management page: managers, admins and owners.
   */
  canAccessAdministration(): boolean {
    return this.can('administration.access');
  }

  /**
   * Whether the current user may change, deactivate or remove a
   * member who holds `targetRole`.
   *
   * Members can only be managed by someone with a higher role.
   * Platform administrators can manage everyone, including owners
   * (the fallback for ownership transfer requests sent to Zebron).
   */
  canManageRole(targetRole: PartnerRole): boolean {
    if (this.isPlatformAdmin()) {
      return true;
    }

    return (
      this.can('members.manage') &&
      PARTNER_ROLE_RANK[targetRole] < PARTNER_ROLE_RANK[this.role()]
    );
  }

  /**
   * Roles the current user may assign, through an invitation or a
   * role change: every role below their own. Owners are never
   * assigned here; ownership transfer is handled by Zebron.
   */
  assignableRoles(): PartnerRole[] {
    if (this.isPlatformAdmin()) {
      return PARTNER_ROLES_ASCENDING.filter((role) => role !== 'org_owner');
    }

    if (!this.can('members.manage')) {
      return [];
    }

    const ownRank = PARTNER_ROLE_RANK[this.role()];

    return PARTNER_ROLES_ASCENDING.filter(
      (role) => PARTNER_ROLE_RANK[role] < ownRank,
    );
  }

  /**
   * ============================================================
   * ORGANIZATION ADMINISTRATION
   * ============================================================
   */

  /**
   * Course administration.
   *
   * Managers can manage courses.
   */
  canManageCourses(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Program administration.
   */
  canManagePrograms(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Member administration.
   */
  canManageMembers(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Organization settings.
   *
   * Staff and managers cannot modify organization settings.
   */
  canManageSettings(): boolean {
    return this.isAdmin();
  }

  /**
   * Administrative activity.
   */
  canViewActivity(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Organization notifications.
   */
  canManageNotifications(): boolean {
    return this.isAdmin();
  }

  /**
   * ============================================================
   * DAY-TO-DAY STAFF OPERATIONS
   * ============================================================
   */

  /**
   * General operational content management.
   *
   * Staff are explicitly included here.
   */
  canManageOperationalContent(): boolean {
    return this.isStaffOrAbove();
  }

  /**
   * Question creation and editing.
   *
   * Staff can create and edit questions.
   */
  canManageQuestions(): boolean {
    return this.isStaffOrAbove();
  }

  /**
   * Submit questions for manager review.
   *
   * Staff can submit their work for review.
   */
  canSubmitQuestionsForReview(): boolean {
    return this.isStaffOrAbove();
  }

  /**
   * ============================================================
   * QUESTION REVIEW / APPROVAL
   * ============================================================
   *
   * Staff intentionally do NOT receive these permissions.
   */

  /**
   * Review questions submitted by staff.
   */
  canReviewQuestions(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Approve questions.
   */
  canApproveQuestions(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Reject/return questions for revision.
   */
  canRejectQuestions(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * Publish approved questions.
   */
  canPublishQuestions(): boolean {
    return this.isManagerOrAbove();
  }

  /**
   * ============================================================
   * ROLE HIERARCHY
   * ============================================================
   *
   * Platform administrator:
   *   unrestricted
   *
   * Organization:
   *   org_owner
   *   org_admin
   *   org_manager
   *   org_staff
   *   org_member
   */
  hasMinimumRole(
    requiredRole: PartnerRole,
  ): boolean {
    /*
     * Platform administrators are unrestricted.
     */
    if (this.isPlatformAdmin()) {
      return true;
    }

    return (
      PARTNER_ROLE_RANK[this.role()] >=
      PARTNER_ROLE_RANK[requiredRole]
    );
  }
}
import { Injectable, computed, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { PartnerOrganizationContextService } from './partner-organization-context.service';

export type PartnerRole =
  | 'org_owner'
  | 'org_admin'
  | 'org_manager'
  | 'org_staff'
  | 'org_member';

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
   * Access to the Partner Administration workspace.
   *
   * Platform administrators always have access.
   *
   * Organization-scoped access is limited to owners and admins.
   */
  canAccessAdministration(): boolean {
    return this.isAdmin();
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

    const levels: Record<PartnerRole, number> = {
      org_member: 1,
      org_staff: 2,
      org_manager: 3,
      org_admin: 4,
      org_owner: 5,
    };

    return (
      levels[this.role()] >=
      levels[requiredRole]
    );
  }
}
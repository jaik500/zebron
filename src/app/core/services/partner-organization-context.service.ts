import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Organization } from '../models/organization.model';
import { OrganizationMembership } from '../models/organization-membership.model';
import {
  ORGANIZATION_REPOSITORY,
} from '../repositories/organization.repository';
import { OrganizationMembershipRepository } from '../repositories/firestore/organization-membership.repository';
import { AuthService } from './auth.service';

export type PartnerOrganizationRole =
  | 'org_owner'
  | 'org_admin'
  | 'org_manager'
  | 'org_staff'
  | 'org_member';

/**
 * Tenant context used by partner-facing features.
 *
 * Platform administrators are allowed to access the Partner Portal without
 * belonging to an organization.
 *
 * Organization-scoped users can only select organizations for which they
 * have an active membership.
 */
@Injectable({ providedIn: 'root' })
export class PartnerOrganizationContextService {
  private readonly authService = inject(AuthService);

  private readonly organizationRepository =
    inject(ORGANIZATION_REPOSITORY);

  private readonly membershipRepository =
    inject(OrganizationMembershipRepository);

  private readonly membershipsState =
    signal<OrganizationMembership[]>([]);

  private readonly organizationsState =
    signal<Organization[]>([]);

  private readonly selectedOrganizationState =
    signal<Organization | null>(null);

    private initializePromise: Promise<void> | null = null;
private initializeOrganizationId: string | null = null;

  readonly memberships = computed(
    () => this.membershipsState(),
  );

  readonly organizations = computed(
    () => this.organizationsState(),
  );

  readonly organization = computed(
    () => this.selectedOrganizationState(),
  );

  readonly organizationId = computed(
    () => this.organization()?.id ?? null,
  );

  /**
   * True when the authenticated user is a platform administrator.
   *
   * Platform administration is intentionally separate from organization
   * membership and organization roles.
   */
  readonly isPlatformAdmin = computed(
    () => this.authService.isAdmin,
  );

  /**
   * Current organization role.
   *
   * Platform administrators may have no organization selected, in which
   * case this returns null. Their platform-level permissions are handled
   * separately by PartnerAccessService.
   */
  readonly organizationRole =
    computed<PartnerOrganizationRole | null>(() => {
      const organizationId = this.organizationId();

      if (!organizationId) {
        return null;
      }

      const membership = this.memberships().find(
        (item) =>
          item.organizationId === organizationId &&
          item.active === true,
      );

      return this.normalizeRole(membership?.role);
    });

  /**
   * Managers and administrators can manage organization-level
   * Test Center administration.
   *
   * Platform administrators are unrestricted.
   */
  readonly canManageCourses = computed(() => {
    if (this.isPlatformAdmin()) {
      return true;
    }

    const role = this.organizationRole();

    return (
      role === 'org_owner' ||
      role === 'org_admin' ||
      role === 'org_manager'
    );
  });

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  /**
   * Initialize the partner organization context.
   *
   * Platform administrators are allowed to initialize successfully even
   * when they have zero organization memberships.
   */
async initialize(
  preferredOrganizationId?: string | null,
): Promise<void> {
  const preferredId =
    preferredOrganizationId?.trim() || null;

  /*
   * If this exact organization is already being initialized,
   * wait for that initialization to finish instead of returning
   * before the context has been populated.
   */
  if (
    this.initializePromise &&
    this.initializeOrganizationId === preferredId
  ) {
    return this.initializePromise;
  }

  this.initializeOrganizationId = preferredId;

  this.initializePromise = this.initializeInternal(
    preferredId,
  );

  try {
    await this.initializePromise;
  } finally {
    if (
      this.initializeOrganizationId === preferredId
    ) {
      this.initializePromise = null;
      this.initializeOrganizationId = null;
    }
  }
}

private async initializeInternal(
  preferredOrganizationId: string | null,
): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  try {
    const user = this.authService.firebaseUser();

    if (!user?.uid) {
      throw new Error(
        'You must be signed in to access the Partner Portal.',
      );
    }

    const memberships =
      await this.membershipRepository.getMembershipsForUser(
        user.uid,
      );

    const activeMemberships =
      memberships.filter(
        (membership) =>
          membership.active === true,
      );

    this.membershipsState.set(
      activeMemberships,
    );

    const organizationResults =
      await Promise.all(
        activeMemberships.map(
          (membership) =>
            this.organizationRepository.getOrganization(
              membership.organizationId,
            ),
        ),
      );

    const organizations =
      organizationResults.filter(
        (
          organization,
        ): organization is Organization =>
          organization?.active === true,
      );

    this.organizationsState.set(
      organizations,
    );

    const currentId =
      this.selectedOrganizationState()?.id ??
      null;

    const selected =
      (
        preferredOrganizationId
          ? organizations.find(
              (organization) =>
                organization.id ===
                preferredOrganizationId,
            )
          : null
      ) ??
      organizations.find(
        (organization) =>
          organization.id === currentId,
      ) ??
      organizations[0] ??
      null;

    if (
      preferredOrganizationId &&
      !organizations.some(
        (organization) =>
          organization.id ===
          preferredOrganizationId,
      )
    ) {
      throw new Error(
        'You do not have access to the selected organization.',
      );
    }

    this.selectedOrganizationState.set(
      selected,
    );

    /*
     * Platform administrators do not require
     * an organization membership.
     */
    if (this.isPlatformAdmin()) {
      return;
    }

    /*
     * Organization-scoped partner users must belong
     * to at least one active organization.
     */
    if (!selected) {
      throw new Error(
        'Your account is not associated with an active partner organization.',
      );
    }
  } catch (error) {
    /*
     * Do not wipe the context for a platform administrator
     * simply because they have no organization memberships.
     */
    if (!this.isPlatformAdmin()) {
      this.organizationsState.set([]);
      this.selectedOrganizationState.set(null);
    }

    this.error.set(
      error instanceof Error
        ? error.message
        : 'Unable to load your partner organization.',
    );

    throw error;
  } finally {
    this.loading.set(false);
  }
}

  /**
   * Select an organization.
   *
   * Platform administrators can select any organization that has been
   * loaded into the current context.
   *
   * Organization-scoped users can only select an organization for which
   * they have an active membership.
   */
  async selectOrganization(
    organizationId: string,
  ): Promise<void> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      throw new Error(
        'An organization ID is required.',
      );
    }

    const organization =
      this.organizations().find(
        (item) => item.id === normalizedId,
      ) ?? null;

    if (!organization) {
      throw new Error(
        'The selected organization is unavailable.',
      );
    }

    /**
     * Platform administrators are not constrained by organization
     * membership.
     */
    if (this.isPlatformAdmin()) {
      this.selectedOrganizationState.set(
        organization,
      );

      return;
    }

    const membership = this.memberships().find(
      (item) =>
        item.organizationId === normalizedId &&
        item.active === true,
    );

    if (!membership) {
      throw new Error(
        'You are not an active member of that organization.',
      );
    }

    this.selectedOrganizationState.set(
      organization,
    );
  }

  /**
   * Require an organization for an organization-scoped operation.
   *
   * This intentionally remains strict. Being a platform administrator
   * does not magically turn an organization-scoped record into a
   * platform-scoped record.
   */
  requireOrganizationId(): string {
    const organizationId = this.organizationId();

    if (!organizationId) {
      throw new Error(
        'No partner organization is selected.',
      );
    }

    return organizationId;
  }

  /**
   * Convert legacy membership role values into the new namespaced
   * organization role model.
   *
   * This allows existing data to continue being read while the
   * organization membership records are migrated.
   *
   * New data should use the namespaced values.
   */
  private normalizeRole(
    role: OrganizationMembership['role'] | string | null | undefined,
  ): PartnerOrganizationRole | null {
    switch (role) {
      case 'org_owner':
      case 'org_admin':
      case 'org_manager':
      case 'org_staff':
      case 'org_member':
        return role;

      /**
       * Temporary compatibility with existing membership records.
       *
       * Remove these cases after the Firestore organization membership
       * data has been migrated completely to the namespaced roles.
       */
      case 'owner':
        return 'org_owner';

      case 'admin':
        return 'org_admin';

      case 'manager':
        return 'org_manager';

      case 'member':
        return 'org_member';

      default:
        return null;
    }
  }
}
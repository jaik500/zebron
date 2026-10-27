
import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Organization } from '../models/organization.model';
import { OrganizationMembership } from '../models/organization-membership.model';
import { ORGANIZATION_REPOSITORY } from '../repositories/organization.repository';
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
 * Platform administrators can access organizations without having
 * organization memberships.
 *
 * Organization-scoped users can access only organizations for which
 * they have an active membership.
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

  /**
   * Track concurrent initialization by organization ID.
   *
   * This prevents a request for one organization from accidentally
   * reusing a pending request for another organization.
   */
  private readonly initializationPromises =
    new Map<string, Promise<void>>();

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
   * Platform-level authorization is independent of organization roles.
   */
  readonly isPlatformAdmin = computed(
    () => this.authService.isAdmin,
  );

  /**
   * Returns the current user's role in the selected organization.
   *
   * Platform administrators do not need an organization role.
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
   * Platform administrators and organization owners, administrators,
   * and managers can manage courses.
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
   * Initialize the organization context.
   *
   * If an organization ID is provided, initialize that specific
   * organization. This is important when refreshing a deep URL such as:
   *
   * /partner/org/ORGANIZATION_ID/dashboard
   *
   * Platform administrators are handled separately from organization
   * members so their access does not depend on membership records.
   */
  async initialize(
    preferredOrganizationId?: string | null,
  ): Promise<void> {
    const preferredId =
      preferredOrganizationId?.trim() || null;

    const promiseKey = preferredId ?? '__default__';

    const existingPromise =
      this.initializationPromises.get(promiseKey);

    if (existingPromise) {
      return existingPromise;
    }

    const initializationPromise =
      this.initializeInternal(preferredId);

    this.initializationPromises.set(
      promiseKey,
      initializationPromise,
    );

    try {
      await initializationPromise;
    } finally {
      if (
        this.initializationPromises.get(promiseKey) ===
        initializationPromise
      ) {
        this.initializationPromises.delete(promiseKey);
      }
    }
  }

  /**
   * Perform initialization for the requested organization.
   */
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

      /*
       * Platform administrators do not need organization memberships.
       *
       * Load their requested organization directly before running the
       * organization-membership initialization used for regular users.
       */
      if (this.isPlatformAdmin()) {
        await this.initializePlatformAdminContext(
          preferredOrganizationId,
        );

        return;
      }

      /*
       * Regular users must have active organization memberships.
       */
      const memberships =
        await this.membershipRepository.getMembershipsForUser(
          user.uid,
        );

      const activeMemberships = memberships.filter(
        (membership) => membership.active === true,
      );

      this.membershipsState.set(activeMemberships);

      const organizationResults = await Promise.all(
        activeMemberships.map((membership) =>
          this.organizationRepository.getOrganization(
            membership.organizationId,
          ),
        ),
      );

      const organizations = organizationResults.filter(
        (
          organization,
        ): organization is Organization =>
          organization?.active === true,
      );

      this.organizationsState.set(organizations);

      const currentOrganizationId =
        this.selectedOrganizationState()?.id ?? null;

      const selectedOrganization =
        (
          preferredOrganizationId
            ? organizations.find(
                (organization) =>
                  organization.id === preferredOrganizationId,
              )
            : null
        ) ??
        organizations.find(
          (organization) =>
            organization.id === currentOrganizationId,
        ) ??
        organizations[0] ??
        null;

      /*
       * Never silently fall back to a different organization when the
       * URL explicitly requests an organization the user cannot access.
       */
      if (
        preferredOrganizationId &&
        !organizations.some(
          (organization) =>
            organization.id === preferredOrganizationId,
        )
      ) {
        throw new Error(
          'You do not have access to the selected organization.',
        );
      }

      this.selectedOrganizationState.set(
        selectedOrganization,
      );

      if (!selectedOrganization) {
        throw new Error(
          'Your account is not associated with an active partner organization.',
        );
      }
    } catch (error) {
      /*
       * Preserve the selected context for platform administrators.
       * Regular users should not retain a potentially unauthorized
       * organization selection after a failed initialization.
       */
      if (!this.isPlatformAdmin()) {
        this.organizationsState.set([]);
        this.selectedOrganizationState.set(null);
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load your partner organization.';

      this.error.set(message);

      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Initialize context for a platform administrator.
   *
   * When the URL specifies an organization, load that organization
   * directly from the repository. Do not require an organization
   * membership.
   */
  private async initializePlatformAdminContext(
    preferredOrganizationId: string | null,
  ): Promise<void> {
    /*
     * Load memberships when available for role/context display, but
     * do not make successful platform-admin access depend on them.
     */
    const user = this.authService.firebaseUser();

    if (user?.uid) {
      try {
        const memberships =
          await this.membershipRepository.getMembershipsForUser(
            user.uid,
          );

        this.membershipsState.set(
          memberships.filter(
            (membership) => membership.active === true,
          ),
        );
      } catch {
        /*
         * Membership data is optional for platform administrators.
         * Platform-level authorization is handled independently.
         */
        this.membershipsState.set([]);
      }
    }

    if (preferredOrganizationId) {
      const existingOrganization =
        this.organizationsState().find(
          (organization) =>
            organization.id === preferredOrganizationId,
        );

      const organization =
        existingOrganization ??
        await this.organizationRepository.getOrganization(
          preferredOrganizationId,
        );

      if (!organization) {
        throw new Error(
          'The requested organization could not be found.',
        );
      }

      /*
       * Do not silently switch to another organization.
       * Preserve the requested organization as the active context.
       */
      this.organizationsState.update((organizations) => {
        const alreadyLoaded = organizations.some(
          (item) => item.id === organization.id,
        );

        if (alreadyLoaded) {
          return organizations.map((item) =>
            item.id === organization.id
              ? organization
              : item,
          );
        }

        return [...organizations, organization];
      });

      this.selectedOrganizationState.set(organization);

      return;
    }

    /*
     * When no organization is specified, retain an existing selection
     * if possible. Otherwise load the organization's directory.
     */
    let organizations = this.organizationsState();

    if (organizations.length === 0) {
      organizations =
        await this.organizationRepository.getOrganizations();

      this.organizationsState.set(organizations);
    }

    const currentOrganizationId =
      this.selectedOrganizationState()?.id ?? null;

    const selectedOrganization =
      organizations.find(
        (organization) =>
          organization.id === currentOrganizationId,
      ) ??
      organizations[0] ??
      null;

    this.selectedOrganizationState.set(
      selectedOrganization,
    );
  }

  /**
   * Select an organization that is already available in the context.
   *
   * Platform administrators may load organizations directly.
   * Regular users must have an active membership.
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

    let organization =
      this.organizations().find(
        (item) => item.id === normalizedId,
      ) ?? null;

    if (this.isPlatformAdmin()) {
      if (!organization) {
        organization =
          await this.organizationRepository.getOrganization(
            normalizedId,
          );
      }

      if (!organization) {
        throw new Error(
          'The selected organization could not be found.',
        );
      }

      this.organizationsState.update((organizations) => {
        const alreadyLoaded = organizations.some(
          (item) => item.id === organization!.id,
        );

        if (alreadyLoaded) {
          return organizations.map((item) =>
            item.id === organization!.id
              ? organization!
              : item,
          );
        }

        return [...organizations, organization!];
      });

      this.selectedOrganizationState.set(organization);

      return;
    }

    if (!organization) {
      throw new Error(
        'The selected organization is unavailable.',
      );
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

    if (organization.active !== true) {
      throw new Error(
        'The selected organization is not active.',
      );
    }

    this.selectedOrganizationState.set(organization);
  }

  /**
   * Require an organization ID for organization-scoped operations.
   *
   * Platform-admin access does not turn organization-scoped operations
   * into platform-scoped operations.
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
   * Normalize legacy organization role names.
   *
   * New membership records should use namespaced role values.
   */
  private normalizeRole(
    role:
      | OrganizationMembership['role']
      | string
      | null
      | undefined,
  ): PartnerOrganizationRole | null {
    switch (role) {
      case 'org_owner':
      case 'org_admin':
      case 'org_manager':
      case 'org_staff':
      case 'org_member':
        return role;

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


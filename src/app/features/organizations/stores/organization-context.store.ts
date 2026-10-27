import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Organization } from '../../../core/models/organization.model';
import { OrganizationMembership } from '../../../core/models/organization-membership.model';
import { OrganizationApplication } from '../../../core/models/organization-application.model';

import { OrganizationService } from '../../../core/services/organization.service';

import { PartnerOrganizationSettings } from '../../partner/models/partner-organization-settings.model';

import {
  PartnerOrganizationContextService,
  PartnerOrganizationRole,
} from '../../../core/services/partner-organization-context.service';

import { PartnerSettingsService } from '../../partner/services/partner-settings.service';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../../../core/models/organization-onboarding.model';

import {
  PartnerOrganizationOnboardingService,
} from '../../partner/services/partner-organization-onboarding.service';

import {
  ORGANIZATION_APPLICATION_REPOSITORY,
  OrganizationApplicationRepository,
} from '../../../core/repositories/organization-application.repository';

// ============================================================
// ORGANIZATION STATE
// ============================================================

type OrganizationState = {
  // ----------------------------------------------------------
  // Existing organization state
  // ----------------------------------------------------------

  organizations: Organization[];

  selectedOrganization: Organization | null;

  loading: boolean;

  error: string | null;

  searchTerm: string;

  showInactive: boolean;

  // ----------------------------------------------------------
  // Organization applications
  // ----------------------------------------------------------

  organizationApplications: OrganizationApplication[];

  applicationsLoading: boolean;

  applicationsError: string | null;

  // ----------------------------------------------------------
  // Organization context
  // ----------------------------------------------------------

  membership: OrganizationMembership | null;

  memberships: OrganizationMembership[];

  organizationRole: PartnerOrganizationRole | null;

  // ----------------------------------------------------------
  // Organization settings
  // ----------------------------------------------------------

  settings: PartnerOrganizationSettings | null;

  settingsLoading: boolean;

  settingsError: string | null;

  // ----------------------------------------------------------
  // Organization onboarding
  // ----------------------------------------------------------

  onboarding: OrganizationOnboarding | null;

  onboardingLoading: boolean;

  onboardingError: string | null;

  // ----------------------------------------------------------
  // Context loading
  // ----------------------------------------------------------

  contextLoading: boolean;

  contextError: string | null;
};

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: OrganizationState = {
  // Existing organization state

  organizations: [],

  selectedOrganization: null,

  loading: false,

  error: null,

  searchTerm: '',

  showInactive: false,

  // Organization applications

  organizationApplications: [],

  applicationsLoading: false,

  applicationsError: null,

  // Organization context

  membership: null,

  memberships: [],

  organizationRole: null,

  // Settings

  settings: null,

  settingsLoading: false,

  settingsError: null,

  // Onboarding

  onboarding: null,

  onboardingLoading: false,

  onboardingError: null,

  // Context

  contextLoading: false,

  contextError: null,
};

// ============================================================
// OPTIONAL READ HELPER
// ============================================================

function isPermissionDenied(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : '';

  return (
    code === 'permission-denied' ||
    code === 'firestore/permission-denied' ||
    message.includes('Missing or insufficient permissions')
  );
}

/**
 * Run a read that some roles are not allowed to perform.
 *
 * When `strict` is true (owners, admins, platform admins) every failure is
 * rethrown, because those roles are expected to be able to read the data.
 * For everyone else a permission-denied result means "not visible to this
 * role" and the fallback is returned, so one restricted document does not
 * take down the whole organization context.
 */
async function loadOptional<T>(
  operation: string,
  loader: () => Promise<T>,
  fallback: T,
  strict: boolean,
): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    if (!strict && isPermissionDenied(error)) {
      console.info(`[Organization Context] ${operation}: not visible to this role.`);
      return fallback;
    }

    console.error(`[Organization Context] ${operation}: failed.`, error);
    throw error;
  }
}

// ============================================================
// ORGANIZATION STORE
// ============================================================

export const OrganizationContextStore = signalStore(
  {
    providedIn: 'root',
  },

  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),

  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed(
    ({
      organizations,
      selectedOrganization,
      membership,
      organizationRole,

      organizationApplications,

      settings,
      onboarding,

      loading,
      applicationsLoading,
      settingsLoading,
      onboardingLoading,
      contextLoading,

      error,
      applicationsError,
      settingsError,
      onboardingError,
      contextError,

      searchTerm,
      showInactive,
    }) => {
      // ------------------------------------------------------
      // Filtered organizations
      // ------------------------------------------------------

      const filteredOrganizations = computed(() => {
        const search = searchTerm().trim().toLowerCase();

        return organizations().filter((organization) => {
          // Active / inactive filtering

          if (!showInactive() && !organization.active) {
            return false;
          }

          // No search term

          if (!search) {
            return true;
          }

          // Searchable organization fields

          const searchableText = [
            organization.name,
            organization.companyNumber,
            organization.description,
            organization.email,
            organization.phone,
            organization.website,
            organization.slug,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchableText.includes(search);
        });
      });

      // ------------------------------------------------------
      // Active organizations
      // ------------------------------------------------------

      const activeOrganizations = computed(() =>
        organizations().filter((organization) => organization.active),
      );

      // ------------------------------------------------------
      // Inactive organizations
      // ------------------------------------------------------

      const inactiveOrganizations = computed(() =>
        organizations().filter((organization) => !organization.active),
      );

      // ------------------------------------------------------
      // Verified organizations
      // ------------------------------------------------------

      const verifiedOrganizations = computed(() =>
        organizations().filter((organization) => organization.verified),
      );

      // ------------------------------------------------------
      // Result count
      // ------------------------------------------------------

      const resultCount = computed(() => filteredOrganizations().length);

      // ------------------------------------------------------
      // Active filter state
      // ------------------------------------------------------

      const hasActiveFilters = computed(() => searchTerm().trim() !== '' || showInactive());

      // ======================================================
      // SELECTED ORGANIZATION
      // ======================================================

      const selectedOrganizationId = computed(() => selectedOrganization()?.id ?? null);

      const selectedOrganizationName = computed(() => selectedOrganization()?.name ?? '');

      const hasOrganization = computed(() => selectedOrganizationId() !== null);

      const isOrganizationActive = computed(() => selectedOrganization()?.active === true);

      // ======================================================
      // MEMBERSHIP
      // ======================================================

      const hasMembership = computed(() => membership() !== null);

      const isMembershipActive = computed(() => membership()?.active === true);

      // ======================================================
      // ORGANIZATION ROLES
      // ======================================================

      const isOrganizationOwner = computed(() => organizationRole() === 'org_owner');

      const isOrganizationAdmin = computed(() => organizationRole() === 'org_admin');

      const isOrganizationManager = computed(() => organizationRole() === 'org_manager');

      const isOrganizationStaff = computed(() => organizationRole() === 'org_staff');

      const isOrganizationMember = computed(() => organizationRole() === 'org_member');

      const canManageOrganization = computed(() => isOrganizationOwner() || isOrganizationAdmin());

      const canManageCourses = computed(
        () => isOrganizationOwner() || isOrganizationAdmin() || isOrganizationManager(),
      );

      // ======================================================
      // ORGANIZATION APPLICATIONS
      // ======================================================

      /**
       * All applications currently associated with
       * the selected organization.
       */
      const hasOrganizationApplications = computed(() => organizationApplications().length > 0);

      /**
       * Applications that are currently active for
       * this organization.
       */
      const activeOrganizationApplications = computed(() =>
        organizationApplications().filter(
          (application: OrganizationApplication) => application.status === 'active',
        ),
      );

      /**
       * Number of active organization applications.
       */
      const activeOrganizationApplicationCount = computed(
        () => activeOrganizationApplications().length,
      );

      // ======================================================
      // SETTINGS
      // ======================================================

      const hasSettings = computed(() => settings() !== null);

      const testCenterEnabled = computed(() => settings()?.testCenter?.enabled === true);

      const allowMemberTesting = computed(
        () => settings()?.testCenter?.allowMemberTesting === true,
      );

      const allowSelfRegistration = computed(
        () => settings()?.members?.allowSelfRegistration === true,
      );

      const defaultMemberRole = computed(() => settings()?.members?.defaultMemberRole ?? null);

      const courseVisibility = computed(() => settings()?.testCenter?.courseVisibility ?? null);

      // ======================================================
      // ONBOARDING
      // ======================================================

      const hasOnboarding = computed(() => onboarding() !== null);

      const onboardingStatus = computed(() => onboarding()?.status ?? null);

      const onboardingCurrentStep = computed(() => onboarding()?.currentStep ?? null);

      const onboardingCompleted = computed(() => onboarding()?.status === 'completed');

      const onboardingInProgress = computed(() => onboarding()?.status === 'in_progress');

      const onboardingNotStarted = computed(() => onboarding()?.status === 'not_started');

      const onboardingCompletedSteps = computed(() => onboarding()?.completedSteps ?? []);

      // ------------------------------------------------------
      // Onboarding progress
      //
      // Progress is based only on onboarding steps that are
      // actually required by the organization's active
      // applications.
      // ------------------------------------------------------

      const onboardingProgress = computed(() => {
        const currentOnboarding = onboarding();

        if (!currentOnboarding) {
          return 0;
        }

        if (currentOnboarding.status === 'completed') {
          return 100;
        }

        const requiredSteps = currentOnboarding.requiredSteps ?? [];

        if (requiredSteps.length === 0) {
          return 0;
        }

        const completedSteps = new Set(
          currentOnboarding.completedSteps ?? [],
        );

        const completedCount = requiredSteps.filter((step) =>
          completedSteps.has(step),
        ).length;

        return Math.min(
          100,
          Math.round((completedCount / requiredSteps.length) * 100),
        );
      });

      // ======================================================
      // LOADING
      // ======================================================

      const contextLoadingState = computed(
        () =>
          loading() ||
          applicationsLoading() ||
          settingsLoading() ||
          onboardingLoading() ||
          contextLoading(),
      );

      // ======================================================
      // ERROR
      // ======================================================

      const contextErrorState = computed(
        () =>
          contextError() ?? applicationsError() ?? settingsError() ?? onboardingError() ?? error(),
      );

      // ======================================================
      // RETURN COMPUTED STATE
      // ======================================================

      return {
        // Existing organization selectors

        filteredOrganizations,

        activeOrganizations,

        inactiveOrganizations,

        verifiedOrganizations,

        resultCount,

        hasActiveFilters,

        // Selected organization

        selectedOrganizationId,

        selectedOrganizationName,

        hasOrganization,

        isOrganizationActive,

        // Membership

        hasMembership,

        isMembershipActive,

        // Roles

        isOrganizationOwner,

        isOrganizationAdmin,

        isOrganizationManager,

        isOrganizationStaff,

        isOrganizationMember,

        canManageOrganization,

        canManageCourses,

        // Organization applications

        hasOrganizationApplications,

        activeOrganizationApplications,

        activeOrganizationApplicationCount,

        // Settings

        hasSettings,

        testCenterEnabled,

        allowMemberTesting,

        allowSelfRegistration,

        defaultMemberRole,

        courseVisibility,

        // Onboarding

        hasOnboarding,

        onboardingStatus,

        onboardingCurrentStep,

        onboardingCompleted,

        onboardingInProgress,

        onboardingNotStarted,

        onboardingCompletedSteps,

        onboardingProgress,

        // Aggregate state

        contextLoadingState,

        contextErrorState,
      };
    },
  ),

  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,

      organizationService = inject(OrganizationService),

      contextService = inject(PartnerOrganizationContextService),

      settingsService = inject(PartnerSettingsService),

      onboardingService = inject(PartnerOrganizationOnboardingService),

      organizationApplicationRepository = inject<OrganizationApplicationRepository>(
        ORGANIZATION_APPLICATION_REPOSITORY,
      ),

    ) => ({
      // ======================================================
      // EXISTING ORGANIZATION METHODS
      // ======================================================

      async loadOrganizations(): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const organizations = await organizationService.getAllOrganizations();

          patchState(store, {
            organizations,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to load organizations:', error);

          patchState(store, {
            organizations: [],
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load organizations. Please try again.',
          });

          throw error;
        }
      },

      // ======================================================
      // LOAD AVAILABLE ORGANIZATIONS
      // ======================================================

      async loadAvailableOrganizations(): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          await contextService.initialize();

          const organizations = contextService.organizations();

          const memberships = contextService.memberships();

          const currentSelection = store.selectedOrganization();

          const selectedOrganization = currentSelection
            ? (organizations.find((organization) => organization.id === currentSelection.id) ??
              null)
            : null;

          patchState(store, {
            organizations,
            memberships,
            selectedOrganization,
            loading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to load available organizations.';

          patchState(store, {
            loading: false,
            error: message,
          });

          throw error;
        }
      },

      // ======================================================
      // LOAD ORGANIZATION
      // ======================================================

      async loadOrganization(organizationId: string): Promise<void> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const organization = await organizationService.getOrganizationById(normalizedId);

          if (!organization) {
            throw new Error('Organization not found.');
          }

          patchState(store, {
            selectedOrganization: organization,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to load organization:', error);

          patchState(store, {
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load organization. Please try again.',
          });

          throw error;
        }
      },

      // ======================================================
      // GET ORGANIZATION BY ID
      // ======================================================

      async getOrganizationById(organizationId: string): Promise<Organization | null> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          return null;
        }

        try {
          return await organizationService.getOrganizationById(normalizedId);
        } catch (error) {
          console.error('Failed to get organization:', error);

          throw error;
        }
      },

      // ======================================================
      // SELECT ORGANIZATION
      // ======================================================

      selectOrganization(organization: Organization | null): void {
        patchState(store, {
          selectedOrganization: organization,
        });
      },

      // ======================================================
      // SELECT ORGANIZATION BY ID
      // ======================================================

      async selectOrganizationById(organizationId: string): Promise<Organization | null> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          patchState(store, {
            selectedOrganization: null,
          });

          return null;
        }

        const existing = store
          .organizations()
          .find((organization) => organization.id === normalizedId);

        if (existing) {
          patchState(store, {
            selectedOrganization: existing,
          });

          return existing;
        }

        const organization = await organizationService.getOrganizationById(normalizedId);

        if (organization) {
          patchState(store, {
            selectedOrganization: organization,
          });
        }

        return organization;
      },

      // ======================================================
      // FIND ORGANIZATION BY COMPANY NUMBER
      // ======================================================

      async findOrganizationByCompanyNumber(companyNumber: string): Promise<Organization | null> {
        const normalizedNumber = companyNumber.trim();

        if (!normalizedNumber) {
          return null;
        }

        try {
          return await organizationService.findOrganizationByCompanyNumber(normalizedNumber);
        } catch (error) {
          console.error('Failed to find organization by company number:', error);

          throw error;
        }
      },

      // ======================================================
      // FIND OR CREATE ORGANIZATION
      // ======================================================

      async findOrCreateOrganization(
        organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
      ): Promise<Organization> {
        try {
          return await organizationService.findOrCreateOrganization(organization);
        } catch (error) {
          console.error('Failed to find or create organization:', error);

          throw error;
        }
      },

      // ======================================================
      // CREATE ORGANIZATION
      // ======================================================

      async createOrganization(
        organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
      ): Promise<Organization> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const created = await organizationService.createOrganization(organization);

          patchState(store, {
            organizations: [...store.organizations(), created],
            selectedOrganization: created,
            loading: false,
          });

          return created;
        } catch (error) {
          console.error('Failed to create organization:', error);

          patchState(store, {
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to create organization. Please try again.',
          });

          throw error;
        }
      },

      // ======================================================
      // UPDATE ORGANIZATION
      // ======================================================

      async updateOrganization(
        organizationId: string,
        organization: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>,
      ): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          await organizationService.updateOrganization(organizationId, organization);

          const updated = await organizationService.getOrganizationById(organizationId);

          patchState(store, {
            organizations: store.organizations().map((item) =>
              item.id === organizationId
                ? (updated ?? {
                    ...item,
                    ...organization,
                  })
                : item,
            ),

            selectedOrganization:
              store.selectedOrganization()?.id === organizationId
                ? updated
                : store.selectedOrganization(),

            loading: false,
          });
        } catch (error) {
          console.error('Failed to update organization:', error);

          patchState(store, {
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to update organization. Please try again.',
          });

          throw error;
        }
      },

      // ======================================================
      // DELETE ORGANIZATION
      // ======================================================

      async deleteOrganization(organizationId: string): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          await organizationService.deleteOrganization(organizationId);

          patchState(store, {
            organizations: store
              .organizations()
              .filter((organization) => organization.id !== organizationId),

            selectedOrganization:
              store.selectedOrganization()?.id === organizationId
                ? null
                : store.selectedOrganization(),

            organizationApplications: [],
            applicationsLoading: false,
            applicationsError: null,

            loading: false,
          });
        } catch (error) {
          console.error('Failed to delete organization:', error);

          patchState(store, {
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to delete organization. Please try again.',
          });

          throw error;
        }
      },

      // ======================================================
      // ONBOARDING WORKFLOW
      // ======================================================

      getRequiredOnboardingSteps(): OrganizationOnboardingStep[] {
        return [...(store.onboarding()?.requiredSteps ?? [])];
      },

      getOnboardingStepCount(): number {
        return store.onboarding()?.requiredSteps?.length ?? 0;
      },

      isOnboardingStepRequired(
        step: OrganizationOnboardingStep,
      ): boolean {
        return store.onboarding()?.requiredSteps?.includes(step) ?? false;
      },

      getNextOnboardingStep(
        currentStep: OrganizationOnboardingStep,
      ): OrganizationOnboardingStep | null {
        const requiredSteps = store.onboarding()?.requiredSteps ?? [];
        const currentIndex = requiredSteps.indexOf(currentStep);

        if (currentIndex < 0) {
          return null;
        }

        return requiredSteps[currentIndex + 1] ?? null;
      },

      getPreviousOnboardingStep(
        currentStep: OrganizationOnboardingStep,
      ): OrganizationOnboardingStep | null {
        const requiredSteps = store.onboarding()?.requiredSteps ?? [];
        const currentIndex = requiredSteps.indexOf(currentStep);

        if (currentIndex <= 0) {
          return null;
        }

        return requiredSteps[currentIndex - 1] ?? null;
      },

      isFinalOnboardingStep(
        step: OrganizationOnboardingStep,
      ): boolean {
        const requiredSteps = store.onboarding()?.requiredSteps ?? [];

        return (
          requiredSteps.length > 0 &&
          requiredSteps[requiredSteps.length - 1] === step
        );
      },

      getOnboardingStepNumber(
        step: OrganizationOnboardingStep,
      ): number | null {
        const requiredSteps = store.onboarding()?.requiredSteps ?? [];
        const index = requiredSteps.indexOf(step);

        return index >= 0 ? index + 1 : null;
      },

      // ======================================================
      // SEARCH / FILTER
      // ======================================================

      setSearchTerm(searchTerm: string): void {
        patchState(store, {
          searchTerm,
        });
      },

      setShowInactive(showInactive: boolean): void {
        patchState(store, {
          showInactive,
        });
      },

      clearFilters(): void {
        patchState(store, {
          searchTerm: '',
          showInactive: false,
        });
      },

      // ======================================================
      // CLEAR SELECTED ORGANIZATION
      // ======================================================

      clearSelectedOrganization(): void {
        patchState(store, {
          selectedOrganization: null,

          membership: null,

          organizationRole: null,

          organizationApplications: [],

          applicationsLoading: false,

          applicationsError: null,

          settings: null,

          onboarding: null,

          settingsError: null,

          onboardingError: null,

          contextError: null,
        });
      },

      // ======================================================
      // LOAD MEMBERSHIP
      // ======================================================

      async loadMembership(organizationId: string): Promise<OrganizationMembership | null> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        try {
          await contextService.initialize(normalizedId);

          const membership =
            contextService
              .memberships()
              .find((item) => item.organizationId === normalizedId && item.active) ?? null;

          patchState(store, {
            membership,

            organizationRole: contextService.organizationRole(),
          });

          return membership;
        } catch (error) {
          console.error('Failed to load organization membership:', error);

          patchState(store, {
            membership: null,

            organizationRole: null,

            contextError:
              error instanceof Error ? error.message : 'Unable to load organization membership.',
          });

          throw error;
        }
      },

      // ======================================================
      // LOAD SETTINGS
      // ======================================================

      async loadSettings(organizationId: string): Promise<PartnerOrganizationSettings> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        patchState(store, {
          settingsLoading: true,
          settingsError: null,
        });

        try {
          const settings = await settingsService.getSettings(normalizedId);

          patchState(store, {
            settings,

            settingsLoading: false,
          });

          return settings;
        } catch (error) {
          console.error('Failed to load organization settings:', error);

          patchState(store, {
            settingsLoading: false,

            settingsError:
              error instanceof Error ? error.message : 'Unable to load organization settings.',
          });

          throw error;
        }
      },

      // ======================================================
      // LOAD ONBOARDING
      // ======================================================

      async loadOnboarding(organizationId: string): Promise<OrganizationOnboarding | null> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        patchState(store, {
          onboardingLoading: true,

          onboardingError: null,
        });

        try {
          const onboarding = await onboardingService.getOnboarding(normalizedId);

          patchState(store, {
            onboarding,

            onboardingLoading: false,
          });

          return onboarding;
        } catch (error) {
          console.error('Failed to load organization onboarding:', error);

          patchState(store, {
            onboardingLoading: false,

            onboardingError:
              error instanceof Error ? error.message : 'Unable to load organization onboarding.',
          });

          throw error;
        }
      },

      //==============================

      hasActiveApplication(applicationId: string): boolean {
        return store
          .organizationApplications()
          .some(
            (application: OrganizationApplication) =>
              application.applicationId === applicationId && application.status === 'active',
          );
      },

      // ======================================================
      // LOAD ORGANIZATION APPLICATIONS
      // ======================================================

      async loadOrganizationApplications(
        organizationId: string,
      ): Promise<OrganizationApplication[]> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        patchState(store, {
          applicationsLoading: true,

          applicationsError: null,
        });

        try {
          const applications =
            await organizationApplicationRepository.getApplications(normalizedId);

          patchState(store, {
            organizationApplications: applications,

            applicationsLoading: false,

            applicationsError: null,
          });

          return applications;
        } catch (error) {
          console.error('Failed to load organization applications:', error);

          patchState(store, {
            organizationApplications: [],

            applicationsLoading: false,

            applicationsError:
              error instanceof Error ? error.message : 'Unable to load organization applications.',
          });

          throw error;
        }
      },

      // ======================================================
      // LOAD COMPLETE ORGANIZATION CONTEXT
      // ======================================================

      async loadOrganizationContext(organizationId: string): Promise<void> {
        const normalizedId = organizationId.trim();

        if (!normalizedId) {
          throw new Error('Organization ID is required.');
        }

        patchState(store, {
          contextLoading: true,

          contextError: null,

          error: null,

          applicationsError: null,

          settingsError: null,

          onboardingError: null,
        });

        try {
          // ==================================================
          // 1. Initialize tenant context FIRST
          // ==================================================
          //
          // The PartnerOrganizationContextService is currently
          // the authority for:
          //
          // - authenticated user
          // - active organization membership
          // - organization
          // - organization role
          //
          // This MUST happen before organization-scoped reads.
          //

          await contextService.initialize(normalizedId);

          // ==================================================
          // 2. Get organization resolved by tenant context
          // ==================================================

          const organization = contextService.organization();

          if (!organization) {
            throw new Error('Organization not found.');
          }

          // ==================================================
          // 3. Store selected organization
          // ==================================================

          patchState(store, {
            selectedOrganization: organization,
          });

          // ==================================================
          // 4. Get authoritative membership
          // ==================================================

          const membership =
            contextService
              .memberships()
              .find((item) => item.organizationId === normalizedId && item.active === true) ?? null;

          // ==================================================
          // 5. Get authoritative organization role
          // ==================================================

          const organizationRole = contextService.organizationRole();

          // ==================================================
          // 6. Load applications, settings and onboarding
          // ==================================================

          patchState(store, {
            applicationsLoading: true,

            settingsLoading: true,

            onboardingLoading: true,

            applicationsError: null,

            settingsError: null,

            onboardingError: null,
          });

          const canReadAdministrativeSettings =
            contextService.isPlatformAdmin() ||
            organizationRole === 'org_owner' ||
            organizationRole === 'org_admin';

          const [applications, settings, onboarding] = await Promise.all([
            loadOptional(
              'Application entitlements',
              () => organizationApplicationRepository.getApplications(normalizedId),
              [] as OrganizationApplication[],
              canReadAdministrativeSettings,
            ),

            // Settings are owner/admin-only in Firestore rules.
            canReadAdministrativeSettings
              ? loadOptional(
                  'Organization settings',
                  () => settingsService.getSettings(normalizedId),
                  null as PartnerOrganizationSettings | null,
                  true,
                )
              : Promise.resolve(null),

            loadOptional(
              'Organization onboarding',
              () => onboardingService.getOnboarding(normalizedId),
              null as OrganizationOnboarding | null,
              canReadAdministrativeSettings,
            ),
          ]);

          // ==================================================
          // 7. Commit complete organization context
          // ==================================================

          patchState(store, {
            selectedOrganization: organization,

            membership,

            organizationRole,

            organizationApplications: applications,

            settings,

            onboarding,

            applicationsLoading: false,

            applicationsError: null,

            settingsLoading: false,

            settingsError: null,

            onboardingLoading: false,

            onboardingError: null,

            contextLoading: false,

            contextError: null,

            error: null,
          });
        } catch (error) {
          console.error('Failed to load organization context:', error);

          const message =
            error instanceof Error ? error.message : 'Unable to load organization context.';

          patchState(store, {
            contextLoading: false,

            applicationsLoading: false,

            settingsLoading: false,

            onboardingLoading: false,

            contextError: message,

            error: message,
          });

          throw error;
        }
      },

      // ======================================================
      // REFRESH ORGANIZATION CONTEXT
      // ======================================================

      async refreshOrganizationContext(): Promise<void> {
        const organizationId = store.selectedOrganization()?.id ?? null;

        if (!organizationId) {
          throw new Error('No organization is currently selected.');
        }

        const normalizedId = organizationId.trim();

        patchState(store, {
          contextLoading: true,

          contextError: null,

          error: null,

          applicationsError: null,

          settingsError: null,

          onboardingError: null,
        });

        try {
          // ==================================================
          // 1. Refresh organization
          // ==================================================

          const organization = await organizationService.getOrganizationById(normalizedId);

          if (!organization) {
            throw new Error('Organization not found.');
          }

          // ==================================================
          // 2. Refresh tenant context
          // ==================================================

          await contextService.initialize(normalizedId);

          // ==================================================
          // 3. Resolve membership and role
          // ==================================================

          const membership =
            contextService
              .memberships()
              .find((item) => item.organizationId === normalizedId && item.active) ?? null;

          const organizationRole = contextService.organizationRole();

          // ==================================================
          // 4. Refresh applications, settings and onboarding
          // ==================================================

          patchState(store, {
            applicationsLoading: true,

            settingsLoading: true,

            onboardingLoading: true,
          });

    //const organizationRole = contextService.organizationRole();

          const canReadAdministrativeSettings =
            contextService.isPlatformAdmin() ||
            organizationRole === 'org_owner' ||
            organizationRole === 'org_admin';

          const [applications, settings, onboarding] = await Promise.all([
            loadOptional(
              'Application entitlements',
              () => organizationApplicationRepository.getApplications(normalizedId),
              [] as OrganizationApplication[],
              canReadAdministrativeSettings,
            ),

            canReadAdministrativeSettings
              ? loadOptional(
                  'Organization settings',
                  () => settingsService.getSettings(normalizedId),
                  null as PartnerOrganizationSettings | null,
                  true,
                )
              : Promise.resolve(null),

            loadOptional(
              'Organization onboarding',
              () => onboardingService.getOnboarding(normalizedId),
              null as OrganizationOnboarding | null,
              canReadAdministrativeSettings,
            ),
          ]);

          // ==================================================
          // 5. Commit refreshed context
          // ==================================================

          patchState(store, {
            selectedOrganization: organization,

            membership,

            organizationRole,

            organizationApplications: applications,

            settings,

            onboarding,

            applicationsLoading: false,

            applicationsError: null,

            settingsLoading: false,

            settingsError: null,

            onboardingLoading: false,

            onboardingError: null,

            contextLoading: false,

            contextError: null,

            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to refresh organization context.';

          console.error('Failed to refresh organization context:', error);

          patchState(store, {
            contextLoading: false,

            applicationsLoading: false,

            settingsLoading: false,

            onboardingLoading: false,

            contextError: message,

            error: message,
          });

          throw error;
        }
      },

      // ======================================================
      // SYNC FROM PARTNER CONTEXT
      // ======================================================

      syncFromPartnerContext(): void {
        const organization = contextService.organization();

        patchState(store, {
          selectedOrganization: organization,

          membership:
            contextService
              .memberships()
              .find(
                (membership) => membership.organizationId === organization?.id && membership.active,
              ) ?? null,

          organizationRole: contextService.organizationRole(),
        });
      },

      // ======================================================
      // REQUIRE ORGANIZATION
      // ======================================================

      requireOrganizationId(): string {
        const organizationId = store.selectedOrganization()?.id ?? null;

        if (!organizationId) {
          throw new Error('No organization is currently selected.');
        }

        return organizationId;
      },

      // ======================================================
      // REQUIRE ACTIVE ORGANIZATION
      // ======================================================

      requireActiveOrganizationId(): string {
        const organization = store.selectedOrganization();

        if (!organization) {
          throw new Error('No organization is currently selected.');
        }

        if (!organization.active) {
          throw new Error(`Organization "${organization.name}" is inactive.`);
        }

        return organization.id;
      },

      // ======================================================
      // CLEAR ORGANIZATION CONTEXT
      // ======================================================

      clearOrganizationContext(): void {
        patchState(store, {
          selectedOrganization: null,

          membership: null,

          organizationRole: null,

          organizationApplications: [],

          applicationsLoading: false,

          applicationsError: null,

          settings: null,

          onboarding: null,

          settingsLoading: false,

          settingsError: null,

          onboardingLoading: false,

          onboardingError: null,

          contextLoading: false,

          contextError: null,
        });
      },
    }),
  ),
);
import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { Organization } from '../../../core/models/organization.model';
import { OrganizationMembership } from '../../../core/models/organization-membership.model';

import { OrganizationService } from '../../../core/services/organization.service';

import {
  PartnerOrganizationSettings,
} from '../../partner/models/partner-organization-settings.model';

import {
  PartnerOrganizationContextService,
  PartnerOrganizationRole,
} from '../../../core/services/partner-organization-context.service';

import {
  PartnerSettingsService,
} from '../../partner/services/partner-settings.service';

import {
  OrganizationOnboarding,
} from '../../../core/models/organization-onboarding.model';

import {
  OrganizationOnboardingService,
} from '../../partner/services/organization-onboarding.service';


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
// ORGANIZATION STORE
// ============================================================

export const OrganizationStore = signalStore(
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
      settings,
      onboarding,
      loading,
      settingsLoading,
      onboardingLoading,
      contextLoading,
      error,
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
        const search =
          searchTerm()
            .trim()
            .toLowerCase();

        return organizations().filter(
          (organization) => {

            // Active / inactive filtering
            if (
              !showInactive() &&
              !organization.active
            ) {
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

            return searchableText.includes(
              search,
            );
          },
        );
      });


      // ------------------------------------------------------
      // Active organizations
      // ------------------------------------------------------

      const activeOrganizations = computed(
        () =>
          organizations().filter(
            (organization) =>
              organization.active,
          ),
      );


      // ------------------------------------------------------
      // Inactive organizations
      // ------------------------------------------------------

      const inactiveOrganizations = computed(
        () =>
          organizations().filter(
            (organization) =>
              !organization.active,
          ),
      );


      // ------------------------------------------------------
      // Verified organizations
      // ------------------------------------------------------

      const verifiedOrganizations = computed(
        () =>
          organizations().filter(
            (organization) =>
              organization.verified,
          ),
      );


      // ------------------------------------------------------
      // Result count
      // ------------------------------------------------------

      const resultCount = computed(
        () =>
          filteredOrganizations().length,
      );


      // ------------------------------------------------------
      // Active filter state
      // ------------------------------------------------------

      const hasActiveFilters = computed(
        () =>
          searchTerm().trim() !== '' ||
          showInactive(),
      );


      // ======================================================
      // SELECTED ORGANIZATION
      // ======================================================

      const selectedOrganizationId =
        computed(
          () =>
            selectedOrganization()?.id ??
            null,
        );


      const selectedOrganizationName =
        computed(
          () =>
            selectedOrganization()?.name ??
            '',
        );


      const hasOrganization =
        computed(
          () =>
            selectedOrganizationId() !== null,
        );


      const isOrganizationActive =
        computed(
          () =>
            selectedOrganization()?.active ===
            true,
        );


      // ======================================================
      // MEMBERSHIP
      // ======================================================

      const hasMembership =
        computed(
          () =>
            membership() !== null,
        );


      const isMembershipActive =
        computed(
          () =>
            membership()?.active ===
            true,
        );


      // ======================================================
      // ORGANIZATION ROLES
      // ======================================================

      const isOrganizationOwner =
        computed(
          () =>
            organizationRole() ===
            'org_owner',
        );


      const isOrganizationAdmin =
        computed(
          () =>
            organizationRole() ===
            'org_admin',
        );


      const isOrganizationManager =
        computed(
          () =>
            organizationRole() ===
            'org_manager',
        );


      const isOrganizationStaff =
        computed(
          () =>
            organizationRole() ===
            'org_staff',
        );


      const isOrganizationMember =
        computed(
          () =>
            organizationRole() ===
            'org_member',
        );


      const canManageOrganization =
        computed(
          () =>
            isOrganizationOwner() ||
            isOrganizationAdmin(),
        );


      const canManageCourses =
        computed(
          () =>
            isOrganizationOwner() ||
            isOrganizationAdmin() ||
            isOrganizationManager(),
        );


      // ======================================================
      // SETTINGS
      // ======================================================

      const hasSettings =
        computed(
          () =>
            settings() !== null,
        );


      const testCenterEnabled =
        computed(
          () =>
            settings()
              ?.testCenter
              ?.enabled === true,
        );


      const allowMemberTesting =
        computed(
          () =>
            settings()
              ?.testCenter
              ?.allowMemberTesting === true,
        );


      const allowSelfRegistration =
        computed(
          () =>
            settings()
              ?.members
              ?.allowSelfRegistration ===
            true,
        );


      const defaultMemberRole =
        computed(
          () =>
            settings()
              ?.members
              ?.defaultMemberRole ??
            null,
        );


      const courseVisibility =
        computed(
          () =>
            settings()
              ?.testCenter
              ?.courseVisibility ??
            null,
        );


      // ======================================================
      // ONBOARDING
      // ======================================================

      const hasOnboarding =
        computed(
          () =>
            onboarding() !== null,
        );


      const onboardingStatus =
        computed(
          () =>
            onboarding()?.status ??
            null,
        );


      const onboardingCurrentStep =
        computed(
          () =>
            onboarding()?.currentStep ??
            null,
        );


      const onboardingCompleted =
        computed(
          () =>
            onboarding()?.status ===
            'completed',
        );


      const onboardingInProgress =
        computed(
          () =>
            onboarding()?.status ===
            'in_progress',
        );


      const onboardingNotStarted =
        computed(
          () =>
            onboarding()?.status ===
            'not_started',
        );


      const onboardingCompletedSteps =
        computed(
          () =>
            onboarding()
              ?.completedSteps ??
            [],
        );


      // ------------------------------------------------------
      // Onboarding progress
      //
      // Do not hard-code an 8-step percentage here.
      // The actual onboarding flow can contain the base
      // steps or continue into Test Center setup.
      // ------------------------------------------------------

      const onboardingProgress =
        computed(() => {

          const current =
            onboarding();

          if (!current) {
            return 0;
          }

          if (
            current.status ===
            'completed'
          ) {
            return 100;
          }

          const completed =
            current.completedSteps
              ?.length ?? 0;

          const total =
            8;

          return Math.min(
            100,
            Math.round(
              (completed / total) *
                100,
            ),
          );
        });


      // ======================================================
      // LOADING
      // ======================================================

      const contextLoadingState =
        computed(
          () =>
            loading() ||
            settingsLoading() ||
            onboardingLoading() ||
            contextLoading(),
        );


      // ======================================================
      // ERROR
      // ======================================================

      const contextErrorState =
        computed(
          () =>
            contextError() ??
            settingsError() ??
            onboardingError() ??
            error(),
        );


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

      organizationService =
        inject(OrganizationService),

      contextService =
        inject(
          PartnerOrganizationContextService,
        ),

      settingsService =
        inject(
          PartnerSettingsService,
        ),

      onboardingService =
        inject(
          OrganizationOnboardingService,
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
    const organizations =
      await organizationService.getAllOrganizations();

    patchState(store, {
      organizations,
      loading: false,
    });
  } catch (error) {
    console.error(
      'Failed to load organizations:',
      error,
    );

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

  // ==========================================================
    // LOAD AVAILABLE ORGANIZATIONS
    // ==========================================================

  async loadAvailableOrganizations(): Promise<void> {
  patchState(store, {
    loading: true,
    error: null,
  });

  try {
    await contextService.initialize();

    const organizations =
      contextService.organizations();

    const memberships =
      contextService.memberships();

    const currentSelection =
      store.selectedOrganization();

    const selectedOrganization =
      currentSelection
        ? organizations.find(
            (organization) =>
              organization.id ===
              currentSelection.id,
          ) ?? null
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
      error instanceof Error
        ? error.message
        : 'Failed to load available organizations.';

    patchState(store, {
      loading: false,
      error: message,
    });

    throw error;
  }
},



      async loadOrganization(
        organizationId: string,
      ): Promise<void> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {
          throw new Error(
            'Organization ID is required.',
          );
        }

        patchState(store, {
          loading: true,
          error: null,
        });

        try {

          const organization =
            await organizationService
              .getOrganizationById(
                normalizedId,
              );

          if (!organization) {
            throw new Error(
              'Organization not found.',
            );
          }

          patchState(store, {
            selectedOrganization:
              organization,
            loading: false,
          });

        } catch (error) {

          console.error(
            'Failed to load organization:',
            error,
          );

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


      async getOrganizationById(
        organizationId: string,
      ): Promise<Organization | null> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {
          return null;
        }

        try {

          return await organizationService
            .getOrganizationById(
              normalizedId,
            );

        } catch (error) {

          console.error(
            'Failed to get organization:',
            error,
          );

          throw error;
        }
      },


      selectOrganization(
        organization: Organization | null,
      ): void {

        patchState(store, {
          selectedOrganization:
            organization,
        });
      },


      async selectOrganizationById(
        organizationId: string,
      ): Promise<Organization | null> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {

          patchState(store, {
            selectedOrganization: null,
          });

          return null;
        }


        const existing =
          store
            .organizations()
            .find(
              (organization) =>
                organization.id ===
                normalizedId,
            );

        if (existing) {

          patchState(store, {
            selectedOrganization:
              existing,
          });

          return existing;
        }


        const organization =
          await organizationService
            .getOrganizationById(
              normalizedId,
            );

        if (organization) {

          patchState(store, {
            selectedOrganization:
              organization,
          });
        }

        return organization;
      },


      async findOrganizationByCompanyNumber(
        companyNumber: string,
      ): Promise<Organization | null> {

        const normalizedNumber =
          companyNumber.trim();

        if (!normalizedNumber) {
          return null;
        }

        try {

          return await organizationService
            .findOrganizationByCompanyNumber(
              normalizedNumber,
            );

        } catch (error) {

          console.error(
            'Failed to find organization by company number:',
            error,
          );

          throw error;
        }
      },


      async findOrCreateOrganization(
        organization: Omit<
          Organization,
          'id' | 'createdAt' | 'updatedAt'
        >,
      ): Promise<Organization> {

        try {

          return await organizationService
            .findOrCreateOrganization(
              organization,
            );

        } catch (error) {

          console.error(
            'Failed to find or create organization:',
            error,
          );

          throw error;
        }
      },


      async createOrganization(
        organization: Omit<
          Organization,
          'id' | 'createdAt' | 'updatedAt'
        >,
      ): Promise<Organization> {

        patchState(store, {
          loading: true,
          error: null,
        });

        try {

          const created =
            await organizationService
              .createOrganization(
                organization,
              );

          patchState(store, {
            organizations: [
              ...store.organizations(),
              created,
            ],
            selectedOrganization:
              created,
            loading: false,
          });

          return created;

        } catch (error) {

          console.error(
            'Failed to create organization:',
            error,
          );

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


      async updateOrganization(
        organizationId: string,
        organization: Partial<
          Omit<
            Organization,
            'id' | 'createdAt' | 'updatedAt'
          >
        >,
      ): Promise<void> {

        patchState(store, {
          loading: true,
          error: null,
        });

        try {

          await organizationService
            .updateOrganization(
              organizationId,
              organization,
            );

          const updated =
            await organizationService
              .getOrganizationById(
                organizationId,
              );

          patchState(store, {
            organizations:
              store
                .organizations()
                .map(
                  (item) =>
                    item.id ===
                    organizationId
                      ? updated ?? {
                          ...item,
                          ...organization,
                        }
                      : item,
                ),

            selectedOrganization:
              store
                .selectedOrganization()
                ?.id ===
              organizationId
                ? updated
                : store.selectedOrganization(),

            loading: false,
          });

        } catch (error) {

          console.error(
            'Failed to update organization:',
            error,
          );

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


      async deleteOrganization(
        organizationId: string,
      ): Promise<void> {

        patchState(store, {
          loading: true,
          error: null,
        });

        try {

          await organizationService
            .deleteOrganization(
              organizationId,
            );

          patchState(store, {

            organizations:
              store
                .organizations()
                .filter(
                  (organization) =>
                    organization.id !==
                    organizationId,
                ),

            selectedOrganization:
              store
                .selectedOrganization()
                ?.id ===
              organizationId
                ? null
                : store.selectedOrganization(),

            loading: false,
          });

        } catch (error) {

          console.error(
            'Failed to delete organization:',
            error,
          );

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
      // SEARCH / FILTER
      // ======================================================

      setSearchTerm(
        searchTerm: string,
      ): void {

        patchState(store, {
          searchTerm,
        });
      },


      setShowInactive(
        showInactive: boolean,
      ): void {

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


      clearSelectedOrganization(): void {

        patchState(store, {
          selectedOrganization: null,
          membership: null,
          organizationRole: null,
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

      async loadMembership(
        organizationId: string,
      ): Promise<OrganizationMembership | null> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {
          throw new Error(
            'Organization ID is required.',
          );
        }

        try {

          await contextService.initialize(
            normalizedId,
          );

          const membership =
            contextService
              .memberships()
              .find(
                (item) =>
                  item.organizationId ===
                    normalizedId &&
                  item.active,
              ) ?? null;

          patchState(store, {
            membership,

            organizationRole:
              contextService
                .organizationRole(),
          });

          return membership;

        } catch (error) {

          console.error(
            'Failed to load organization membership:',
            error,
          );

          patchState(store, {
            membership: null,
            organizationRole: null,
            contextError:
              error instanceof Error
                ? error.message
                : 'Unable to load organization membership.',
          });

          throw error;
        }
      },


      // ======================================================
      // LOAD SETTINGS
      // ======================================================

      async loadSettings(
        organizationId: string,
      ): Promise<PartnerOrganizationSettings> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {
          throw new Error(
            'Organization ID is required.',
          );
        }

        patchState(store, {
          settingsLoading: true,
          settingsError: null,
        });

        try {

          const settings =
            await settingsService
              .getSettings(
                normalizedId,
              );

          patchState(store, {
            settings,
            settingsLoading: false,
          });

          return settings;

        } catch (error) {

          console.error(
            'Failed to load organization settings:',
            error,
          );

          patchState(store, {
            settingsLoading: false,
            settingsError:
              error instanceof Error
                ? error.message
                : 'Unable to load organization settings.',
          });

          throw error;
        }
      },


      // ======================================================
      // LOAD ONBOARDING
      // ======================================================

      async loadOnboarding(
        organizationId: string,
      ): Promise<OrganizationOnboarding | null> {

        const normalizedId =
          organizationId.trim();

        if (!normalizedId) {
          throw new Error(
            'Organization ID is required.',
          );
        }

        patchState(store, {
          onboardingLoading: true,
          onboardingError: null,
        });

        try {

          const onboarding =
            await onboardingService
              .getOnboarding(
                normalizedId,
              );

          patchState(store, {
            onboarding,
            onboardingLoading: false,
          });

          return onboarding;

        } catch (error) {

          console.error(
            'Failed to load organization onboarding:',
            error,
          );

          patchState(store, {
            onboardingLoading: false,
            onboardingError:
              error instanceof Error
                ? error.message
                : 'Unable to load organization onboarding.',
          });

          throw error;
        }
      },


      // ======================================================
      // LOAD COMPLETE ORGANIZATION CONTEXT
      // ======================================================

   // ======================================================
// LOAD COMPLETE ORGANIZATION CONTEXT
// ======================================================

async loadOrganizationContext(
  organizationId: string,
): Promise<void> {

  const normalizedId =
    organizationId.trim();

  if (!normalizedId) {
    throw new Error(
      'Organization ID is required.',
    );
  }

  patchState(store, {
    contextLoading: true,
    contextError: null,
    error: null,
  });

  try {

    // ==========================================================
    // 1. Initialize tenant context FIRST
    // ==========================================================
    //
    // The PartnerOrganizationContextService is the authority
    // for:
    //
    // - authenticated user
    // - active organization membership
    // - organization
    // - organization role
    //
    // This MUST happen before the store performs any
    // organization-scoped reads.
    //

    await contextService.initialize(
      normalizedId,
    );


    // ==========================================================
    // 2. Get the organization resolved by tenant context
    // ==========================================================

    const organization =
      contextService.organization();

    if (!organization) {
      throw new Error(
        'Organization not found.',
      );
    }


    // ==========================================================
    // 3. Store the selected organization
    // ==========================================================

    patchState(store, {
      selectedOrganization:
        organization,
    });


    // ==========================================================
    // 4. Get authoritative membership
    // ==========================================================

    const membership =
      contextService
        .memberships()
        .find(
          (item) =>
            item.organizationId ===
              normalizedId &&
            item.active === true,
        ) ?? null;


    // ==========================================================
    // 5. Get authoritative organization role
    // ==========================================================

    const organizationRole =
      contextService.organizationRole();


    // ==========================================================
    // 6. Load organization settings
    //    and onboarding
    // ==========================================================

    patchState(store, {
      settingsLoading: true,
      onboardingLoading: true,
      settingsError: null,
      onboardingError: null,
    });

    const [
      settings,
      onboarding,
    ] = await Promise.all([
      settingsService.getSettings(
        normalizedId,
      ),

      onboardingService.getOnboarding(
        normalizedId,
      ),
    ]);


    // ==========================================================
    // 7. Commit complete organization context
    // ==========================================================

    patchState(store, {

      selectedOrganization:
        organization,

      membership,

      organizationRole,

      settings,

      onboarding,

      settingsLoading: false,

      onboardingLoading: false,

      contextLoading: false,

      contextError: null,

      settingsError: null,

      onboardingError: null,

      error: null,
    });

  } catch (error) {

    console.error(
      'Failed to load organization context:',
      error,
    );

    patchState(store, {

      contextLoading: false,

      settingsLoading: false,

      onboardingLoading: false,

      contextError:
        error instanceof Error
          ? error.message
          : 'Unable to load organization context.',
    });

    throw error;
  }
},


      // ======================================================
      // REFRESH ORGANIZATION CONTEXT
      // ======================================================

     async refreshOrganizationContext(): Promise<void> {
  const organizationId =
    store.selectedOrganizationId();

  if (!organizationId) {
    throw new Error(
      'No organization is currently selected.',
    );
  }

  const normalizedId = organizationId.trim();

  patchState(store, {
    contextLoading: true,
    contextError: null,
    error: null,
  });

  try {
    const organization =
      await organizationService.getOrganizationById(
        normalizedId,
      );

    if (!organization) {
      throw new Error(
        'Organization not found.',
      );
    }

    await contextService.initialize(
      normalizedId,
    );

    const membership =
      contextService
        .memberships()
        .find(
          (item) =>
            item.organizationId === normalizedId &&
            item.active,
        ) ?? null;

    const organizationRole =
      contextService.organizationRole();

    const [settings, onboarding] =
      await Promise.all([
        settingsService.getSettings(normalizedId),
        onboardingService.getOnboarding(normalizedId),
      ]);

    patchState(store, {
      selectedOrganization: organization,
      membership,
      organizationRole,
      settings,
      onboarding,
      settingsLoading: false,
      onboardingLoading: false,
      contextLoading: false,
      contextError: null,
      settingsError: null,
      onboardingError: null,
      error: null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to refresh organization context.';

    patchState(store, {
      contextLoading: false,
      settingsLoading: false,
      onboardingLoading: false,
      contextError: message,
    });

    throw error;
  }
},


      // ======================================================
      // SYNC FROM PARTNER CONTEXT
      // ======================================================

      syncFromPartnerContext(): void {

        const organization =
          contextService.organization();

        patchState(store, {

          selectedOrganization:
            organization,

          membership:
            contextService
              .memberships()
              .find(
                (membership) =>
                  membership.organizationId ===
                  organization?.id &&
                  membership.active,
              ) ?? null,

          organizationRole:
            contextService.organizationRole(),
        });
      },


      // ======================================================
      // REQUIRE ORGANIZATION
      // ======================================================

      requireOrganizationId(): string {

        const organizationId =
          store.selectedOrganizationId();

        if (!organizationId) {
          throw new Error(
            'No organization is currently selected.',
          );
        }

        return organizationId;
      },


      // ======================================================
      // REQUIRE ACTIVE ORGANIZATION
      // ======================================================

      requireActiveOrganizationId(): string {

        const organization =
          store.selectedOrganization();

        if (!organization) {
          throw new Error(
            'No organization is currently selected.',
          );
        }

        if (!organization.active) {
          throw new Error(
            `Organization "${organization.name}" is inactive.`,
          );
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

          settings: null,

          onboarding: null,

          settingsError: null,

          onboardingError: null,

          contextError: null,
        });
      },
    }),
  ),
);
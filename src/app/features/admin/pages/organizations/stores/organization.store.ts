import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import { Organization } from '../../../../../core/models/organization.model';
import { OrganizationService } from '../../../../../core/services/organization.service';

interface OrganizationState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  showInactive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationStore {
  private readonly organizationService = inject(OrganizationService);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  private readonly state = signal<OrganizationState>({
    organizations: [],
    selectedOrganization: null,
    loading: false,
    error: null,
    searchTerm: '',
    showInactive: false,
  });

  // ---------------------------------------------------------------------------
  // Public state
  // ---------------------------------------------------------------------------

  readonly organizations = computed(
    () => this.state().organizations,
  );

  readonly selectedOrganization = computed(
    () => this.state().selectedOrganization,
  );

  readonly loading = computed(
    () => this.state().loading,
  );

  readonly error = computed(
    () => this.state().error,
  );

  readonly searchTerm = computed(
    () => this.state().searchTerm,
  );

  readonly showInactive = computed(
    () => this.state().showInactive,
  );

  /**
   * Organizations displayed by organization-management screens.
   */
  readonly filteredOrganizations = computed(() => {
    const {
      organizations,
      searchTerm,
      showInactive,
    } = this.state();

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return organizations.filter((organization) => {
      if (!showInactive && organization.active === false) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        organization.name,
        organization.id,
        organization.description ?? '',
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    });
  });

  /**
   * Whether an organization has been selected.
   */
  readonly hasSelectedOrganization = computed(
    () => this.state().selectedOrganization !== null,
  );

  /**
   * ID of the selected organization.
   */
  readonly selectedOrganizationId = computed(
    () => this.state().selectedOrganization?.id ?? null,
  );

  // ---------------------------------------------------------------------------
  // State helpers
  // ---------------------------------------------------------------------------

  private setLoading(loading: boolean): void {
    this.state.update((state) => ({
      ...state,
      loading,
    }));
  }

  private setError(error: string | null): void {
    this.state.update((state) => ({
      ...state,
      error,
    }));
  }

  private clearError(): void {
    this.setError(null);
  }

  // ---------------------------------------------------------------------------
  // Organization loading
  // ---------------------------------------------------------------------------

  /**
   * Load all organizations.
   */
async loadOrganizations(): Promise<void> {
  this.setLoading(true);
  this.clearError();

  try {
    const organizations =
      await this.organizationService.getAllOrganizations();

    const currentSelection =
      this.state().selectedOrganization;

    const selectedOrganization =
      currentSelection
        ? organizations.find(
            (organization) =>
              organization.id === currentSelection.id,
          ) ?? null
        : null;

    this.state.update((state) => ({
      ...state,
      organizations,
      selectedOrganization,
      loading: false,
      error: null,
    }));
  } catch (error) {
    const message = this.getErrorMessage(
      error,
      'Failed to load organizations.',
    );

    this.state.update((state) => ({
      ...state,
      loading: false,
      error: message,
    }));

    throw error;
  }
}

  /**
   * Load one organization by ID and select it.
   */
  async loadOrganization(
  organizationId: string,
): Promise<Organization | null> {
  const normalizedId = organizationId.trim();

  if (!normalizedId) {
    this.setError('Organization ID is required.');
    return null;
  }

  this.setLoading(true);
  this.clearError();

  try {
    const organization =
      await this.organizationService.getOrganizationById(
        normalizedId,
      );

    if (!organization) {
      this.state.update((state) => ({
        ...state,
        loading: false,
        error: 'Organization not found.',
      }));

      return null;
    }

    this.state.update((state) => {
      const exists = state.organizations.some(
        (item) => item.id === organization.id,
      );

      return {
        ...state,

        organizations: exists
          ? state.organizations.map((item) =>
              item.id === organization.id
                ? organization
                : item,
            )
          : [
              ...state.organizations,
              organization,
            ],

        selectedOrganization: organization,
        loading: false,
        error: null,
      };
    });

    return organization;
  } catch (error) {
    const message =
      this.getErrorMessage(
        error,
        'Failed to load organization.',
      );

    this.state.update((state) => ({
      ...state,
      loading: false,
      error: message,
    }));

    throw error;
  }
}




// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Select an organization object as the current context.
 */
selectOrganization(
  organization: Organization | null,
): void {
  this.state.update((state) => ({
    ...state,
    selectedOrganization: organization,
    error: null,
  }));
}

/**
 * Select an organization by ID.
 *
 * If the organization is already loaded, use the existing
 * object. Otherwise load it from OrganizationService.
 */
async selectOrganizationById(
  organizationId: string,
): Promise<Organization | null> {
  const normalizedId = organizationId.trim();

  if (!normalizedId) {
    this.clearOrganization();
    return null;
  }

  const existing =
    this.state().organizations.find(
      (organization) =>
        organization.id === normalizedId,
    );

  if (existing) {
    this.selectOrganization(existing);
    return existing;
  }

  return this.loadOrganization(normalizedId);
}
/**
 * Clear the current organization selection.
 */
clearSelectedOrganization(): void {
  this.state.update((state) => ({
    ...state,
    selectedOrganization: null,
    error: null,
  }));
}

/**
 * Backward-compatible alias.
 */
clearOrganization(): void {
  this.clearSelectedOrganization();
}

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

async createOrganization(
  organization: Omit<
    Organization,
    'id' | 'createdAt' | 'updatedAt'
  >,
): Promise<Organization> {
  this.setLoading(true);
  this.clearError();

  try {
    const created =
      await this.organizationService.createOrganization(
        organization,
      );

    this.state.update((state) => ({
      ...state,

      organizations: [
        ...state.organizations,
        created,
      ],

      selectedOrganization: created,
      loading: false,
      error: null,
    }));

    return created;
  } catch (error) {
    const message =
      this.getErrorMessage(
        error,
        'Failed to create organization.',
      );

    this.state.update((state) => ({
      ...state,
      loading: false,
      error: message,
    }));

    throw error;
  }
}

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async updateOrganization(
    organizationId: string,
    changes: Partial<
      Omit<
        Organization,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<Organization> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      throw new Error('Organization ID is required.');
    }

    this.setLoading(true);
    this.clearError();

    try {
      const updated =
        await this.organizationService.updateOrganization(
          normalizedId,
          changes,
        );

      this.state.update((state) => ({
        ...state,
        organizations: state.organizations.map(
          (organization) =>
            organization.id === normalizedId
              ? updated
              : organization,
        ),
        selectedOrganization:
          state.selectedOrganization?.id === normalizedId
            ? updated
            : state.selectedOrganization,
        loading: false,
        error: null,
      }));

      return updated;
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Failed to update organization.',
      );

      this.state.update((state) => ({
        ...state,
        loading: false,
        error: message,
      }));

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Delete / deactivate
  // ---------------------------------------------------------------------------

  async deleteOrganization(
    organizationId: string,
  ): Promise<void> {
    const normalizedId = organizationId.trim();

    if (!normalizedId) {
      throw new Error('Organization ID is required.');
    }

    this.setLoading(true);
    this.clearError();

    try {
      await this.organizationService.deleteOrganization(
        normalizedId,
      );

      this.state.update((state) => ({
        ...state,
        organizations: state.organizations.filter(
          (organization) =>
            organization.id !== normalizedId,
        ),
        selectedOrganization:
          state.selectedOrganization?.id === normalizedId
            ? null
            : state.selectedOrganization,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        'Failed to delete organization.',
      );

      this.state.update((state) => ({
        ...state,
        loading: false,
        error: message,
      }));

      throw error;
    }
  }



  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  setSearchTerm(searchTerm: string): void {
    this.state.update((state) => ({
      ...state,
      searchTerm,
    }));
  }

  setShowInactive(showInactive: boolean): void {
    this.state.update((state) => ({
      ...state,
      showInactive,
    }));
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return fallback;
  }
}
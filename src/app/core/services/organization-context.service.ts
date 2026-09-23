import {
  Injectable,
  computed,
  inject,
} from '@angular/core';

import { Organization } from '../../core/models/organization.model';
import { OrganizationStore } from '../../features/organizations/stores/organization.store';

@Injectable({
  providedIn: 'root',
})
export class OrganizationContextService {
  private readonly organizationStore =
    inject(OrganizationStore);

  /**
   * Currently selected organization.
   */
  readonly organization = computed<Organization | null>(
    () => this.organizationStore.selectedOrganization(),
  );

  /**
   * Current organization ID.
   */
  readonly organizationId = computed<string | null>(
    () => this.organization()?.id ?? null,
  );

  /**
   * Current organization name.
   */
  readonly organizationName = computed<string>(
    () => this.organization()?.name ?? '',
  );

  /**
   * Whether an organization is currently selected.
   */
  readonly hasOrganization = computed<boolean>(
    () => this.organizationId() !== null,
  );

  /**
   * Whether the selected organization is active.
   */
  readonly isOrganizationActive = computed<boolean>(
    () => this.organization()?.active === true,
  );

  /**
   * Available organizations.
   */
  readonly organizations = computed<Organization[]>(
    () => this.organizationStore.organizations(),
  );

  /**
   * Loading state.
   */
  readonly loading = computed<boolean>(
    () => this.organizationStore.loading(),
  );

  /**
   * Error state.
   */
  readonly error = computed<string | null>(
    () => this.organizationStore.error(),
  );

  /**


  /**
   * Select an organization by ID.
   *
   * Uses an already-loaded organization when possible.
   * Otherwise loads the organization through the store.
   */
  async selectOrganizationById(
  organizationId: string,
): Promise<Organization | null> {
  const normalizedId = organizationId.trim();

  if (!normalizedId) {
    this.clearOrganization();
    return null;
  }

  const existingOrganization =
    this.organizations().find(
      (organization) =>
        organization.id === normalizedId,
    );

  if (existingOrganization) {
    // Your current store must provide the mechanism
    // for changing selectedOrganization.
    // Do not call a nonexistent selectOrganization().
    return existingOrganization;
  }

  const organization =
    await this.organizationStore.getOrganizationById(
      normalizedId,
    );

  return organization;
}

  /**
   * Clear the current organization context.
   */
  clearOrganization(): void {
    this.organizationStore.clearSelectedOrganization();
  }

  /**
   * Require a selected organization.
   *
   * Throws when a tenant-aware operation is attempted
   * without an organization context.
   */
  requireOrganizationId(): string {
    const organizationId =
      this.organizationId();

    if (!organizationId) {
      throw new Error(
        'No organization is currently selected.',
      );
    }

    return organizationId;
  }

  /**
   * Require an active organization.
   *
   * Use this for operations that create or modify
   * tenant-owned data.
   */
  requireActiveOrganizationId(): string {
    const organization = this.organization();

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
  }
}
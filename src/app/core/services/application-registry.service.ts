import { Injectable } from '@angular/core';

import {
  ApplicationAvailability,
  ApplicationCategory,
  ApplicationDefinition,
} from '../models/application-definition.model';

import { APPLICATION_DEFINITIONS } from '../registries/application.registry';

@Injectable({
  providedIn: 'root',
})
export class ApplicationRegistryService {
  /**
   * The canonical platform application catalog.
   *
   * The registry is intentionally exposed as readonly data.
   * Organization-specific activation belongs to
   * OrganizationApplication and is handled separately.
   */
  readonly applications: readonly ApplicationDefinition[] =
    APPLICATION_DEFINITIONS;

  // ============================================================
  // BASIC LOOKUPS
  // ============================================================

  /**
   * Get an application by its stable ID.
   */
  getById(
    applicationId: string,
  ): ApplicationDefinition | null {
    return (
      this.applications.find(
        (application) => application.id === applicationId,
      ) ?? null
    );
  }

  /**
   * Get an application by its stable application key.
   *
   * In the current architecture ID and key normally match,
   * but both are retained because they have different
   * semantic purposes.
   */
  getByKey(
    applicationKey: string,
  ): ApplicationDefinition | null {
    return (
      this.applications.find(
        (application) => application.key === applicationKey,
      ) ?? null
    );
  }

  /**
   * Determine whether an application exists.
   */
  exists(applicationKey: string): boolean {
    return this.getByKey(applicationKey) !== null;
  }

  // ============================================================
  // ENABLED APPLICATIONS
  // ============================================================

  /**
   * Get applications that are enabled in the platform catalog.
   *
   * This does NOT mean they are activated for an organization.
   */
  getEnabledApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) => application.enabled,
    );
  }

  /**
   * Determine whether an application definition is enabled.
   */
  isEnabled(applicationKey: string): boolean {
    return (
      this.getByKey(applicationKey)?.enabled === true
    );
  }

  // ============================================================
  // AVAILABILITY
  // ============================================================

  /**
   * Get applications by catalog availability.
   */
  getByAvailability(
    availability: ApplicationAvailability,
  ): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.availability === availability,
    );
  }

  /**
   * Get applications currently available for selection.
   *
   * "available" is deliberately different from "enabled".
   *
   * enabled:
   *   The platform definition is enabled.
   *
   * available:
   *   The application may be presented as available
   *   to organizations.
   */
  getAvailableApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.enabled &&
        application.availability === 'available',
    );
  }

  /**
   * Determine whether an application can currently be
   * requested/selected by an organization.
   */
  isAvailable(applicationKey: string): boolean {
    const application =
      this.getByKey(applicationKey);

    return (
      application?.enabled === true &&
      application.availability === 'available'
    );
  }

  /**
   * Get applications that are coming soon.
   */
  getComingSoonApplications(): ApplicationDefinition[] {
    return this.getByAvailability('coming_soon');
  }

  /**
   * Get internal platform applications.
   */
  getInternalApplications(): ApplicationDefinition[] {
    return this.getByAvailability('internal');
  }

  // ============================================================
  // CATEGORIES
  // ============================================================

  /**
   * Get applications by category.
   */
  getByCategory(
    category: ApplicationCategory,
  ): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.category === category,
    );
  }

  /**
   * Get all categories currently represented in the registry.
   */
  getCategories(): ApplicationCategory[] {
    return Array.from(
      new Set(
        this.applications.map(
          (application) => application.category,
        ),
      ),
    );
  }

  // ============================================================
  // ORGANIZATION REQUIREMENTS
  // ============================================================

  /**
   * Get applications that require an organization context.
   */
  getOrganizationApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.requiresOrganization,
    );
  }

  /**
   * Get applications that can operate without an organization.
   */
  getPlatformApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        !application.requiresOrganization,
    );
  }

  // ============================================================
  // APPROVAL
  // ============================================================

  /**
   * Get applications that require platform approval before
   * organization activation.
   */
  getApprovalRequiredApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.enabled &&
        application.requiresApproval,
    );
  }

  /**
   * Determine whether an application requires approval.
   */
  requiresApproval(
    applicationKey: string,
  ): boolean {
    return (
      this.getByKey(applicationKey)
        ?.requiresApproval === true
    );
  }

  // ============================================================
  // PROVISIONING
  // ============================================================

  /**
   * Get applications that have an actual provisioning strategy.
   */
  getProvisionableApplications(): ApplicationDefinition[] {
    return this.applications.filter(
      (application) =>
        application.provisioningStrategy !== 'none',
    );
  }

  /**
   * Determine whether an application requires provisioning.
   */
  requiresProvisioning(
    applicationKey: string,
  ): boolean {
    const application =
      this.getByKey(applicationKey);

    return (
      application !== null &&
      application.provisioningStrategy !== 'none'
    );
  }

  /**
   * Determine whether an application can be automatically
   * provisioned.
   */
  supportsAutomaticProvisioning(
    applicationKey: string,
  ): boolean {
    return (
      this.getByKey(applicationKey)
        ?.autoProvision === true
    );
  }

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  /**
   * Get application dependencies.
   */
  getDependencies(
    applicationKey: string,
  ): ApplicationDefinition[] {
    const application =
      this.getByKey(applicationKey);

    if (!application) {
      return [];
    }

    return application.dependencies
      .map((dependencyKey) =>
        this.getByKey(dependencyKey),
      )
      .filter(
        (
          dependency,
        ): dependency is ApplicationDefinition =>
          dependency !== null,
      );
  }

  /**
   * Determine whether an application depends on another
   * application.
   */
  hasDependency(
    applicationKey: string,
    dependencyKey: string,
  ): boolean {
    const application =
      this.getByKey(applicationKey);

    return (
      application?.dependencies.includes(
        dependencyKey,
      ) ?? false
    );
  }

  // ============================================================
  // IMPLEMENTATION / READINESS
  // ============================================================

  /**
   * Get the implementation manifest key associated with
   * an application.
   */
  getImplementationKey(
    applicationKey: string,
  ): string | null {
    return (
      this.getByKey(applicationKey)
        ?.implementationKey ?? null
    );
  }

  /**
   * Determine whether an application has an implementation
   * manifest registered.
   */
  hasImplementationManifest(
    applicationKey: string,
  ): boolean {
    return (
      this.getImplementationKey(
        applicationKey,
      ) !== null
    );
  }

  // ============================================================
  // PERMISSIONS
  // ============================================================

  /**
   * Get the permissions declared by an application.
   */
  getPermissions(
    applicationKey: string,
  ): string[] {
    return [
      ...(this.getByKey(applicationKey)
        ?.permissions ?? []),
    ];
  }

  /**
   * Determine whether an application declares a permission.
   */
  declaresPermission(
    applicationKey: string,
    permission: string,
  ): boolean {
    return this.getPermissions(
      applicationKey,
    ).includes(permission);
  }

  // ============================================================
  // SEARCH
  // ============================================================

  /**
   * Search the application catalog.
   *
   * Searches:
   * - application name
   * - key
   * - description
   * - category
   */
  search(
    searchTerm: string,
  ): ApplicationDefinition[] {
    const term = searchTerm
      .trim()
      .toLowerCase();

    if (!term) {
      return this.getEnabledApplications();
    }

    return this.getEnabledApplications().filter(
      (application) => {
        const searchableText = [
          application.id,
          application.key,
          application.name,
          application.description,
          application.category,
        ]
          .join(' ')
          .toLowerCase();

        return searchableText.includes(term);
      },
    );
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  /**
   * Validate the internal consistency of the registry.
   *
   * This is intentionally a lightweight catalog validation.
   * Runtime implementation readiness remains the responsibility
   * of ApplicationReadinessService.
   */
  validateRegistry(): string[] {
    const errors: string[] = [];

    const ids = new Set<string>();
    const keys = new Set<string>();

    for (const application of this.applications) {
      if (ids.has(application.id)) {
        errors.push(
          `Duplicate application ID: ${application.id}`,
        );
      }

      if (keys.has(application.key)) {
        errors.push(
          `Duplicate application key: ${application.key}`,
        );
      }

      ids.add(application.id);
      keys.add(application.key);

      for (const dependency of application.dependencies) {
        if (!keys.has(dependency)) {
          /**
           * We cannot immediately flag this here because the
           * dependency may be declared later in the array.
           *
           * Dependency validation is therefore completed below.
           */
        }
      }
    }

    for (const application of this.applications) {
      for (const dependency of application.dependencies) {
        if (!keys.has(dependency)) {
          errors.push(
            `Application "${application.key}" references unknown dependency "${dependency}".`,
          );
        }

        if (dependency === application.key) {
          errors.push(
            `Application "${application.key}" cannot depend on itself.`,
          );
        }
      }

      if (
        application.requiresOrganization &&
        !application.route.includes(
          ':organizationId',
        )
      ) {
        errors.push(
          `Organization application "${application.key}" should use an organization-scoped route.`,
        );
      }

      if (
        application.provisioningStrategy ===
          'none' &&
        application.autoProvision
      ) {
        errors.push(
          `Application "${application.key}" cannot enable automatic provisioning when its provisioning strategy is "none".`,
        );
      }
    }

    return errors;
  }
}
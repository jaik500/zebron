import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { LoggerService } from './logger.service';

import {
  FeatureAvailability,
  FeatureConfig,
} from '../models/feature-config.model';

import {
  CONFIGURATION_APPLICATIONS,
} from '../registries/configuration-application.registry';

import {
  catalogAdminRoute,
  catalogApplications,
  controlDetails,
  killSwitchDependencies,
} from '../registries/application-catalog';

// ============================================================
// DEFAULT FEATURE REGISTRY
// ============================================================

/**
 * One kill switch per application in the registry (see
 * application-catalog.ts). Saved choices in Firestore
 * featureConfigurations/{key} override these defaults.
 */
const DEFAULT_FEATURES: FeatureConfig[] = catalogApplications().map(
  (application) => {
    const details = controlDetails(application.key);

    return {
      id: application.key,
      key: application.key,
      name: application.name,
      description: application.description,
      availability: 'enabled',
      enabled: true,
      visibleInNavigation: details.showInNavigation ?? true,
      allowNewUsers: application.key !== 'configuration',
      core: details.core ?? false,
      dependencies: killSwitchDependencies(application),
      icon: application.icon ?? 'apps',
      route: catalogAdminRoute(application),
      version: '1.0.0',
    };
  },
);


// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root',
})
export class FeatureConfigService {

  // ============================================================
  // SERVICES
  // ============================================================

  private readonly authService =
    inject(AuthService);

  private readonly auditService =
    inject(AuditService);

  private readonly logger =
    inject(LoggerService);


  // ============================================================
  // STATE
  // ============================================================

  private readonly featuresState =
    signal<
      Record<
        string,
        FeatureConfig
      >
    >(
      this.createDefaultState(),
    );


  private readonly loadedState =
    signal(false);


  /**
   * Public feature collection.
   *
   * FeatureConfigService remains the source of truth
   * for application configuration.
   */
  readonly features =
    computed(() =>
      Object.values(
        this.featuresState(),
      ).sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
          ),
      ),
    );


  /**
   * Indicates whether the feature configuration
   * has completed its initial load attempt.
   */
  readonly loaded =
    this.loadedState.asReadonly();


  // ============================================================
  // LOADING
  // ============================================================

  /**
   * Ensure configuration has been loaded.
   */
  async ensureLoaded(
    force = false,
  ): Promise<void> {

    if (
      this.loadedState() &&
      !force
    ) {
      return;
    }


    await this.load();

  }


  /**
   * Load feature configuration from Firestore.
   *
   * Default configuration remains available if the
   * Firestore read fails.
   */
  async load(): Promise<void> {

    const operationId =
      this.logger.createOperationId();


    this.logger.info(
      'FeatureConfigService',
      'Loading feature configuration.',
      {
        operationId,
      },
    );


    try {

      const snapshot =
        await getDocs(
          collection(
            firestore,
            'featureConfigurations',
          ),
        );


      const state =
        this.createDefaultState();


      for (
        const document of snapshot.docs
      ) {

        const data =
          document.data();


        const defaultConfig =
          state[document.id];


        state[document.id] = {

          ...(defaultConfig ?? {

            id:
              document.id,

            key:
              document.id,

            name:
              document.id,

            availability:
              'enabled',

            enabled:
              true,

            visibleInNavigation:
              true,

            allowNewUsers:
              true,

            core:
              false,

            dependencies:
              [],

          }),

          ...data,

          id:
            document.id,

          key:
            typeof data['key'] === 'string'
              ? data['key']
              : document.id,

        } as FeatureConfig;

      }


      this.featuresState.set(
        state,
      );


      this.loadedState.set(
        true,
      );


      this.logger.info(
        'FeatureConfigService',
        'Feature configuration loaded.',
        {
          operationId,
          featureCount:
            Object.keys(state).length,
        },
      );

    } catch (error) {

      this.logger.error(
        'FeatureConfigService',
        'Failed to load feature configuration.',
        {
          operationId,
          error:
            this.getErrorMessage(error),
        },
      );


      /**
       * Defaults remain active so the application
       * can continue operating if configuration
       * is temporarily unavailable.
       */
      this.loadedState.set(
        true,
      );

    }

  }


  // ============================================================
  // READ
  // ============================================================

  /**
   * Return a feature configuration by key.
   */
  get(
    key: string,
  ): FeatureConfig | null {

    return (
      this.featuresState()[key] ??
      null
    );

  }


  /**
   * Determine whether an application is enabled.
   */
  isEnabled(
    key: string,
  ): boolean {

    const feature =
      this.get(key);


    return (
      feature?.availability ===
        'enabled' &&
      feature.enabled === true
    );

  }


  /**
   * Determine whether an application
   * is in maintenance mode.
   */
  isInMaintenance(
    key: string,
  ): boolean {

    return (
      this.get(key)
        ?.availability ===
      'maintenance'
    );

  }


  /**
   * Determine whether an application
   * is currently available.
   *
   * Both enabled and maintenance are considered
   * configured availability states.
   */
  isAvailable(
    key: string,
  ): boolean {

    const feature =
      this.get(key);


    return (
      feature?.availability ===
        'enabled' ||
      feature?.availability ===
        'maintenance'
    );

  }


  // ============================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================

  /**
   * Return all features that directly depend on
   * the supplied feature.
   *
   * Example:
   *
   * resources -> authentication
   *
   * getDependents('authentication')
   *
   * returns Resources.
   */
  getDependents(
    key: string,
  ): FeatureConfig[] {

    return this.features()
      .filter(
        (feature) =>
          feature.key !== key &&
          feature.dependencies.includes(
            key,
          ),
      );

  }


  /**
   * Return only enabled applications that
   * currently depend on the supplied feature.
   *
   * These applications prevent their dependency
   * from being disabled or placed into maintenance.
   */
  getEnabledDependents(
    key: string,
  ): FeatureConfig[] {

    return this.getDependents(
      key,
    ).filter(
      (feature) =>
        this.isEnabled(
          feature.key,
        ),
    );

  }


  /**
   * Return the dependency validation result
   * for an availability change.
   *
   * Returns null when the requested change is valid.
   * Returns a human-readable error message when
   * the requested change must be rejected.
   */
  canChangeAvailability(
    key: string,
    availability:
      FeatureAvailability,
  ): string | null {

    const feature =
      this.get(key);


    if (!feature) {

      return `Unknown feature: ${key}`;

    }


    // ----------------------------------------------------------
    // Core protection
    // ----------------------------------------------------------

    if (
      feature.core &&
      availability !== 'enabled'
    ) {

      return (
        `${feature.name} is a protected core ` +
        `application and cannot be disabled or ` +
        `placed into maintenance.`
      );

    }


    // ----------------------------------------------------------
    // Enabling / maintenance requires dependencies
    // ----------------------------------------------------------

    if (
      availability === 'enabled' ||
      availability === 'maintenance'
    ) {

      const unavailableDependencies =
        feature.dependencies.filter(
          (dependencyKey) =>
            !this.isEnabled(
              dependencyKey,
            ),
        );


      if (
        unavailableDependencies.length > 0
      ) {

        const dependencyNames =
          unavailableDependencies.map(
            (dependencyKey) => {

              const dependency =
                this.get(
                  dependencyKey,
                );

              return (
                dependency?.name ??
                dependencyKey
              );

            },
          );


        return (
          `${feature.name} cannot be set to ` +
          `${availability === 'maintenance'
            ? 'maintenance'
            : 'enabled'
          } because the following required ` +
          `dependencies are not enabled: ` +
          `${dependencyNames.join(', ')}.`
        );

      }

    }


    // ----------------------------------------------------------
    // Disabling / maintenance cannot break enabled dependents
    // ----------------------------------------------------------

    if (
      availability === 'disabled' ||
      availability === 'maintenance'
    ) {

      const enabledDependents =
        this.getEnabledDependents(
          key,
        );


      if (
        enabledDependents.length > 0
      ) {

        const dependentNames =
          enabledDependents.map(
            (dependent) =>
              dependent.name,
          );


        return (
          `${feature.name} cannot be ` +
          `${availability === 'maintenance'
            ? 'placed into maintenance'
            : 'disabled'
          } because the following enabled ` +
          `application(s) depend on it: ` +
          `${dependentNames.join(', ')}. ` +
          `Disable or reconfigure those applications first.`
        );

      }

    }


    return null;

  }


  /**
   * Validate and throw when an availability change
   * violates application dependency rules.
   *
   * This is intentionally enforced inside the service
   * rather than only in the UI.
   */
  private validateAvailabilityChange(
    feature: FeatureConfig,
    availability:
      FeatureAvailability,
  ): void {

    const validationError =
      this.canChangeAvailability(
        feature.key,
        availability,
      );


    if (!validationError) {
      return;
    }


    const operationId =
      this.logger.createOperationId();


    this.logger.warn(
      'FeatureConfigService',
      'Feature availability change rejected by dependency validation.',
      {
        operationId,
        featureKey:
          feature.key,
        requestedAvailability:
          availability,
        reason:
          validationError,
      },
    );


    throw new Error(
      validationError,
    );

  }


  // ============================================================
  // ADMIN CONFIGURATION
  // ============================================================

  /**
   * Change application availability.
   *
   * This method is the authoritative application-level
   * configuration boundary.
   *
   * Validation happens BEFORE the Firestore write.
   */
  async setAvailability(
    key: string,
    availability:
      FeatureAvailability,
  ): Promise<void> {

    this.ensureAdmin();


    const feature =
      this.get(key);


    if (!feature) {

      throw new Error(
        `Unknown feature: ${key}`,
      );

    }


    // ----------------------------------------------------------
    // Dependency and protection validation
    // ----------------------------------------------------------

    this.validateAvailabilityChange(
      feature,
      availability,
    );


    // Nothing to change.

    if (
      feature.availability ===
      availability
    ) {

      return;

    }


    const operationId =
      this.logger.createOperationId();


    const before =
      this.cloneFeature(
        feature,
      );


    const enabled =
      availability ===
      'enabled';


    const updatedBy =
      this.authService
        .firebaseUser()
        ?.uid ??
      null;


    const updatedAt =
      Timestamp.now();


    const updated:
      FeatureConfig =
      {

        ...feature,

        availability,

        enabled,

        updatedBy,

        updatedAt,

      };


    this.logger.info(
      'FeatureConfigService',
      'Updating feature availability.',
      {
        operationId,
        key,
        availability,
        updatedBy,
      },
    );


    try {

      // --------------------------------------------------------
      // Persist configuration
      // --------------------------------------------------------

      await setDoc(
        doc(
          firestore,
          'featureConfigurations',
          key,
        ),
        {

          ...updated,

          updatedAt:
            serverTimestamp(),

        },
        {
          merge: true,
        },
      );


      // --------------------------------------------------------
      // Synchronize local state only after persistence succeeds
      // --------------------------------------------------------

      this.updateLocal(
        updated,
      );


      // --------------------------------------------------------
      // Audit
      // --------------------------------------------------------

      await this.auditService.log(
        {

          action:
            'configuration.feature.updated',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'success',

          metadata: {

            operationId,

            property:
              'availability',

          },

          before,

          after:
            updated,

        },
      );


      this.logger.info(
        'FeatureConfigService',
        'Feature availability updated.',
        {
          operationId,
          key,
          availability,
        },
      );

    } catch (error) {

      // --------------------------------------------------------
      // Failed persistence is audited as a failure.
      // --------------------------------------------------------

      await this.auditService.log(
        {

          action:
            'configuration.feature.updated',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'failure',

          metadata: {

            operationId,

            property:
              'availability',

            error:
              this.getErrorMessage(
                error,
              ),

          },

          before,

          after:
            feature,

        },
      );


      this.logger.error(
        'FeatureConfigService',
        'Failed to update feature availability.',
        {
          operationId,
          key,
          availability,
          error:
            this.getErrorMessage(
              error,
            ),
        },
      );


      throw error;

    }

  }


  /**
   * Convenience method for enabling/disabling
   * an application.
   */
  async setEnabled(
    key: string,
    enabled: boolean,
  ): Promise<void> {

    await this.setAvailability(
      key,
      enabled
        ? 'enabled'
        : 'disabled',
    );

  }


  /**
   * Change whether an application appears
   * in navigation.
   */
  async setNavigationVisibility(
    key: string,
    visible: boolean,
  ): Promise<void> {

    this.ensureAdmin();


    const feature =
      this.get(key);


    if (!feature) {

      throw new Error(
        `Unknown feature: ${key}`,
      );

    }


    // Core applications cannot be hidden.

    if (feature.core) {

      throw new Error(
        `${feature.name} is a protected core application and cannot be hidden from navigation.`,
      );

    }


    const operationId =
      this.logger.createOperationId();


    const before =
      this.cloneFeature(
        feature,
      );


    const updatedBy =
      this.authService
        .firebaseUser()
        ?.uid ??
      null;


    const updatedAt =
      Timestamp.now();


    const updated:
      FeatureConfig =
      {

        ...feature,

        visibleInNavigation:
          visible,

        updatedBy,

        updatedAt,

      };


    this.logger.info(
      'FeatureConfigService',
      'Updating feature navigation visibility.',
      {
        operationId,
        key,
        visible,
        updatedBy,
      },
    );


    try {

      await setDoc(
        doc(
          firestore,
          'featureConfigurations',
          key,
        ),
        {

          visibleInNavigation:
            visible,

          updatedBy,

          updatedAt:
            serverTimestamp(),

        },
        {
          merge: true,
        },
      );


      this.updateLocal(
        updated,
      );


      await this.auditService.log(
        {

          action:
            'configuration.feature.navigation.updated',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'success',

          metadata: {

            operationId,

            property:
              'visibleInNavigation',

          },

          before,

          after:
            updated,

        },
      );


      this.logger.info(
        'FeatureConfigService',
        'Feature navigation visibility updated.',
        {
          operationId,
          key,
          visible,
        },
      );

    } catch (error) {

      await this.auditService.log(
        {

          action:
            'configuration.feature.navigation.updated',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'failure',

          metadata: {

            operationId,

            error:
              this.getErrorMessage(
                error,
              ),

          },

          before,

          after:
            feature,

        },
      );


      this.logger.error(
        'FeatureConfigService',
        'Failed to update navigation visibility.',
        {
          operationId,
          key,
          visible,
          error:
            this.getErrorMessage(
              error,
            ),
        },
      );


      throw error;

    }

  }


  /**
   * Reset a feature to its default configuration.
   */
  async reset(
    key: string,
  ): Promise<void> {

    this.ensureAdmin();


    const defaultFeature =
      DEFAULT_FEATURES.find(
        (feature) =>
          feature.key === key,
      );


    if (!defaultFeature) {

      throw new Error(
        `No default configuration exists for feature: ${key}`,
      );

    }


    const current =
      this.get(key);


    if (
      defaultFeature.core
    ) {

      throw new Error(
        'Core application configuration cannot be reset through this operation.',
      );

    }


    // ----------------------------------------------------------
    // Validate the default availability before resetting.
    // ----------------------------------------------------------

    this.validateAvailabilityChange(
      current ?? defaultFeature,
      defaultFeature.availability,
    );


    const operationId =
      this.logger.createOperationId();


    const updatedBy =
      this.authService
        .firebaseUser()
        ?.uid ??
      null;


    const updated:
      FeatureConfig =
      {

        ...defaultFeature,

        updatedBy,

        updatedAt:
          Timestamp.now(),

      };


    this.logger.info(
      'FeatureConfigService',
      'Resetting feature configuration.',
      {
        operationId,
        key,
      },
    );


    try {

      await setDoc(
        doc(
          firestore,
          'featureConfigurations',
          key,
        ),
        {

          ...defaultFeature,

          updatedBy,

          updatedAt:
            serverTimestamp(),

        },
        {
          merge: true,
        },
      );


      this.updateLocal(
        updated,
      );


      await this.auditService.log(
        {

          action:
            'configuration.feature.reset',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'success',

          metadata: {

            operationId,

          },

          before:
            current,

          after:
            updated,

        },
      );


      this.logger.info(
        'FeatureConfigService',
        'Feature configuration reset.',
        {
          operationId,
          key,
        },
      );

    } catch (error) {

      await this.auditService.log(
        {

          action:
            'configuration.feature.reset',

          entityType:
            'featureConfiguration',

          entityId:
            key,

          outcome:
            'failure',

          metadata: {

            operationId,

            error:
              this.getErrorMessage(
                error,
              ),

          },

          before:
            current,

          after:
            current,

        },
      );


      this.logger.error(
        'FeatureConfigService',
        'Failed to reset feature configuration.',
        {
          operationId,
          key,
          error:
            this.getErrorMessage(
              error,
            ),
        },
      );


      throw error;

    }

  }


  // ============================================================
  // INTERNAL
  // ============================================================

  /**
   * Create an in-memory copy of the default feature registry.
   */
  private createDefaultState():
    Record<
      string,
      FeatureConfig
    > {

    return Object.fromEntries(

      DEFAULT_FEATURES.map(
        (feature) => [

          feature.key,

          {

            ...feature,

            dependencies: [
              ...feature.dependencies,
            ],

          },

        ],
      ),

    );

  }


  /**
   * Update local state only after a successful
   * persistence operation.
   */
  private updateLocal(
    feature: FeatureConfig,
  ): void {

    this.featuresState.update(
      (current) => ({

        ...current,

        [feature.key]:
          feature,

      }),
    );

  }


  /**
   * Create a safe copy of a feature for
   * audit before/after snapshots.
   */
  private cloneFeature(
    feature: FeatureConfig,
  ): FeatureConfig {

    return {

      ...feature,

      dependencies: [
        ...feature.dependencies,
      ],

    };

  }


  /**
   * Verify that the current user has
   * administrative privileges.
   */
  private ensureAdmin(): void {

    if (
      !this.authService.isAdmin
    ) {

      throw new Error(
        'Administrator privileges are required.',
      );

    }

  }


  /**
   * Safely convert an unknown error
   * into a loggable string.
   */
  private getErrorMessage(
    error: unknown,
  ): string {

    if (
      error instanceof Error
    ) {

      return error.message;

    }


    if (
      typeof error === 'string'
    ) {

      return error;

    }


    try {

      return JSON.stringify(
        error,
      );

    } catch {

      return 'Unknown error';

    }

  }

}
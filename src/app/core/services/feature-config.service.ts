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

const DEFAULT_FEATURES: FeatureConfig[] = [
  {
    id: 'authentication',
    key: 'authentication',
    name: 'Authentication',
    description:
      'User authentication and identity management.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: false,
    allowNewUsers: true,
    core: true,
    dependencies: [],
    icon: 'lock',
    route: null,
    version: '1.0.0',
  },

  {
    id: 'resources',
    key: 'resources',
    name: 'Resources',
    description:
      'Zebron resource directory and discovery platform.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'library_books',
    route: '/resources',
    version: '1.0.0',
  },

  {
    id: 'community',
    key: 'community',
    name: 'Community',
    description:
      'Community discussions, posts, comments, reactions and social interactions.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'forum',
    route: '/community',
    version: '1.0.0',
  },

  {
    id: 'learning-lab',
    key: 'learning-lab',
    name: 'Learning Lab',
    description:
      'Learning activities, progress and achievements.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'school',
    route: '/learning-lab',
    version: '1.0.0',
  },

  {
    id: 'test-center',
    key: 'test-center',
    name: 'Test Center',
    description:
      'Courses, assessments, question banks and testing.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'quiz',
    route: '/test-center',
    version: '1.0.0',
  },

  {
    id: 'business-operations',
    key: 'business-operations',
    name: 'Business Operations',
    description:
      'Business management and operational functionality.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'business_center',
    route: null,
    version: '1.0.0',
  },

  {
    id: 'messaging',
    key: 'messaging',
    name: 'Messaging',
    description:
      'Private conversations and direct messaging.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'chat',
    route: null,
    version: '1.0.0',
  },

  {
    id: 'notifications',
    key: 'notifications',
    name: 'Notifications',
    description:
      'User and system notifications.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: false,
    allowNewUsers: true,
    core: false,
    dependencies: [
      'authentication',
    ],
    icon: 'notifications',
    route: null,
    version: '1.0.0',
  },

  {
    id: 'admin-center',
    key: 'admin-center',
    name: 'Admin Center',
    description:
      'Administrative management and system control.',
    availability: 'enabled',
    enabled: true,
    visibleInNavigation: true,
    allowNewUsers: false,
    core: true,
    dependencies: [
      'authentication',
    ],
    icon: 'admin_panel_settings',
    route: '/admin',
    version: '1.0.0',
  },
];

@Injectable({
  providedIn: 'root',
})
export class FeatureConfigService {
  private readonly authService =
    inject(AuthService);

  private readonly auditService =
    inject(AuditService);

  private readonly logger =
    inject(LoggerService);

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

  readonly loaded =
    this.loadedState.asReadonly();

  // ============================================================
  // LOADING
  // ============================================================

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
            id: document.id,
            key: document.id,
            name: document.id,
            availability:
              'enabled',
            enabled: true,
            visibleInNavigation:
              true,
            allowNewUsers: true,
            core: false,
            dependencies: [],
          }),

          ...data,

          id: document.id,

          key:
            typeof data['key'] ===
            'string'
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
            Object.keys(state)
              .length,
        },
      );
    } catch (error) {
      this.logger.error(
        'FeatureConfigService',
        'Failed to load feature configuration.',
        error,
        {
          operationId,
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

  get(
    key: string,
  ): FeatureConfig | null {
    return (
      this.featuresState()[
        key
      ] ?? null
    );
  }

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

  isInMaintenance(
    key: string,
  ): boolean {
    return (
      this.get(key)
        ?.availability ===
      'maintenance'
    );
  }

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
  // ADMIN CONFIGURATION
  // ============================================================

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

    if (
      feature.core &&
      availability !== 'enabled'
    ) {
      throw new Error(
        `${feature.name} is a protected core application and cannot be disabled.`,
      );
    }

    if (
      availability !== 'enabled' &&
      !this.dependenciesAllowChange(
        feature,
      )
    ) {
      throw new Error(
        `Cannot change ${feature.name} because one or more required dependencies are unavailable.`,
      );
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
      this.authService.firebaseUser()
        ?.uid ?? null;

    const updatedAt =
      Timestamp.now();

    const updated: FeatureConfig =
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

      this.updateLocal(
        updated,
      );

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

          after: updated,
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
          },

          before,
          after: feature,
        },
      );

      this.logger.error(
        'FeatureConfigService',
        'Failed to update feature availability.',
        error,
        {
          operationId,
          key,
          availability,
        },
      );

      throw error;
    }
  }

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

    const operationId =
      this.logger.createOperationId();

    const before =
      this.cloneFeature(
        feature,
      );

    const updatedBy =
      this.authService.firebaseUser()
        ?.uid ?? null;

    const updatedAt =
      Timestamp.now();

    const updated: FeatureConfig =
      {
        ...feature,

        visibleInNavigation:
          visible,

        updatedBy,

        updatedAt,
      };

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

          after: updated,
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
          },

          before,

          after: feature,
        },
      );

      this.logger.error(
        'FeatureConfigService',
        'Failed to update navigation visibility.',
        error,
        {
          operationId,
          key,
          visible,
        },
      );

      throw error;
    }
  }

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

    const operationId =
      this.logger.createOperationId();

    const updatedBy =
      this.authService.firebaseUser()
        ?.uid ?? null;

    const updated: FeatureConfig =
      {
        ...defaultFeature,

        updatedBy,

        updatedAt:
          Timestamp.now(),
      };

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
  }

  // ============================================================
  // INTERNAL
  // ============================================================

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

  private dependenciesAllowChange(
    feature: FeatureConfig,
  ): boolean {
    return feature.dependencies.every(
      (dependency) =>
        this.isEnabled(
          dependency,
        ),
    );
  }

  private ensureAdmin(): void {
    if (
      !this.authService.isAdmin
    ) {
      throw new Error(
        'Administrator privileges are required.',
      );
    }
  }
}
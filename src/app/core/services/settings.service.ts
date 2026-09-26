import { computed, inject, Injectable, signal } from '@angular/core';

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
  SystemSetting,
  SystemSettingType,
  SystemSettingValue,
} from '../models/system-setting.model';

/**
 * Centralized application settings registry.
 *
 * Important architectural distinction:
 *
 * FeatureConfig
 *   -> Controls whether an application is enabled,
 *      disabled, or in maintenance.
 *
 * SystemSetting
 *   -> Controls behavior/features inside an application.
 *
 * TaxPayConfiguration
 *   -> Contains actual tax rules/rates.
 *
 * OperationalMonitoring
 *   -> Observes application health, errors, events,
 *      diagnostics, and administrative activity.
 */
const DEFAULT_SETTINGS: SystemSetting[] = [
  // ============================================================
  // PLATFORM
  // ============================================================

  {
    id: 'logging.minimumLevel',
    key: 'logging.minimumLevel',
    applicationKey: 'platform',
    label: 'Minimum Log Level',
    group: 'Logging',
    description:
      'Minimum application log level emitted by the centralized logger.',
    type: 'string',
    value: 'info',
    defaultValue: 'info',
    editable: true,
    clientReadable: true,
  },

  // ============================================================
  // COMMUNITY
  // ============================================================

  {
    id: 'community.comment.maxLength',
    key: 'community.comment.maxLength',
    applicationKey: 'community',
    label: 'Maximum Comment Length',
    group: 'Content',
    description:
      'Maximum number of characters allowed in a community comment.',
    type: 'number',
    value: 2000,
    defaultValue: 2000,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.post.maxLength',
    key: 'community.post.maxLength',
    applicationKey: 'community',
    label: 'Maximum Post Length',
    group: 'Content',
    description:
      'Maximum number of characters allowed in a community post.',
    type: 'number',
    value: 5000,
    defaultValue: 5000,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.reactions.enabled',
    key: 'community.reactions.enabled',
    applicationKey: 'community',
    label: 'Community Reactions',
    group: 'Features',
    description:
      'Controls whether users can react to community content.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.bookmarks.enabled',
    key: 'community.bookmarks.enabled',
    applicationKey: 'community',
    label: 'Community Bookmarks',
    group: 'Features',
    description:
      'Controls whether users can bookmark community posts.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.moderation.required',
    key: 'community.moderation.required',
    applicationKey: 'community',
    label: 'Community Moderation',
    group: 'Moderation',
    description:
      'Determines whether new community posts require moderation approval.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  // ============================================================
  // RESOURCES
  // ============================================================

  {
    id: 'resources.search.enabled',
    key: 'resources.search.enabled',
    applicationKey: 'resources',
    label: 'Resource Search',
    group: 'Features',
    description:
      'Controls whether users can search the resource center.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'resources.categories.enabled',
    key: 'resources.categories.enabled',
    applicationKey: 'resources',
    label: 'Resource Categories',
    group: 'Features',
    description:
      'Controls whether resource category filtering is available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'resources.userSubmissions.enabled',
    key: 'resources.userSubmissions.enabled',
    applicationKey: 'resources',
    label: 'User Resource Submissions',
    group: 'Features',
    description:
      'Controls whether users can submit resources for review.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  // ============================================================
  // JOBS
  // ============================================================

  {
    id: 'jobs.search.enabled',
    key: 'jobs.search.enabled',
    applicationKey: 'jobs',
    label: 'Job Search',
    group: 'Features',
    description:
      'Controls whether job searching is available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'jobs.training.enabled',
    key: 'jobs.training.enabled',
    applicationKey: 'jobs',
    label: 'Training Opportunities',
    group: 'Features',
    description:
      'Controls whether training and bootcamp opportunities are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'jobs.applications.enabled',
    key: 'jobs.applications.enabled',
    applicationKey: 'jobs',
    label: 'Job Applications',
    group: 'Features',
    description:
      'Controls whether users can submit job applications through Zebron.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  // ============================================================
  // TEST CENTER
  // ============================================================

  {
    id: 'test-center.courses.enabled',
    key: 'test-center.courses.enabled',
    applicationKey: 'test-center',
    label: 'Test Courses',
    group: 'Features',
    description:
      'Controls whether test preparation courses are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'test-center.practice.enabled',
    key: 'test-center.practice.enabled',
    applicationKey: 'test-center',
    label: 'Practice Tests',
    group: 'Features',
    description:
      'Controls whether users can access practice tests.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  // ============================================================
  // TAX & PAY
  // ============================================================

  {
    id: 'tax-pay.calculator.enabled',
    key: 'tax-pay.calculator.enabled',
    applicationKey: 'tax-pay',
    label: 'Tax & Pay Calculator',
    group: 'Features',
    description:
      'Controls whether the Tax & Pay calculator is available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.w2.enabled',
    key: 'tax-pay.w2.enabled',
    applicationKey: 'tax-pay',
    label: 'W-2 Income',
    group: 'Income Types',
    description:
      'Controls whether W-2 income calculations are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.1099.enabled',
    key: 'tax-pay.1099.enabled',
    applicationKey: 'tax-pay',
    label: '1099 Income',
    group: 'Income Types',
    description:
      'Controls whether 1099 contractor income calculations are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.mixedIncome.enabled',
    key: 'tax-pay.mixedIncome.enabled',
    applicationKey: 'tax-pay',
    label: 'Mixed W-2 + 1099 Income',
    group: 'Income Types',
    description:
      'Controls whether mixed W-2 and 1099 income calculations are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.stateTax.enabled',
    key: 'tax-pay.stateTax.enabled',
    applicationKey: 'tax-pay',
    label: 'State Tax Calculations',
    group: 'Features',
    description:
      'Controls whether state income tax calculations are included.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.localTax.enabled',
    key: 'tax-pay.localTax.enabled',
    applicationKey: 'tax-pay',
    label: 'Local Tax Calculations',
    group: 'Features',
    description:
      'Controls whether local tax calculations are included when supported.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'tax-pay.estimatedPayments.enabled',
    key: 'tax-pay.estimatedPayments.enabled',
    applicationKey: 'tax-pay',
    label: 'Estimated Payments',
    group: 'Features',
    description:
      'Controls whether estimated tax payment calculations are available.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly authService = inject(AuthService);

  private readonly auditService = inject(AuditService);

  private readonly logger = inject(LoggerService);

  private readonly settingsState = signal<Record<string, SystemSetting>>(
    this.createDefaultState(),
  );

  private readonly loadedState = signal(false);

  /**
   * All settings.
   *
   * Sorted by application, group, then label.
   */
  readonly settings = computed(() =>
    Object.values(this.settingsState()).sort(
      (a, b) =>
        a.applicationKey.localeCompare(b.applicationKey) ||
        a.group.localeCompare(b.group) ||
        a.label.localeCompare(b.label),
    ),
  );

  readonly loaded = this.loadedState.asReadonly();

  // ============================================================
  // LOADING
  // ============================================================

  async ensureLoaded(force = false): Promise<void> {
    if (this.loadedState() && !force) {
      return;
    }

    await this.load();
  }

  async load(): Promise<void> {
    const operationId = this.logger.createOperationId();

    this.logger.info('SettingsService', 'Loading system settings.', {
      operationId,
    });

    try {
      const snapshot = await getDocs(
        collection(firestore, 'systemSettings'),
      );

      const state = this.createDefaultState();

      for (const document of snapshot.docs) {
        const remote = document.data();

        const defaultSetting = state[document.id];

        state[document.id] = {
          ...(defaultSetting ?? {
            id: document.id,
            key: document.id,
            applicationKey: this.inferApplicationKey(document.id),
            label: document.id,
            group: 'General',
            type: this.inferType(remote['value']),
            value: remote['value'],
            defaultValue: remote['value'],
            editable: true,
            clientReadable: true,
          }),

          ...remote,

          id: document.id,

          key:
            typeof remote['key'] === 'string'
              ? remote['key']
              : document.id,

          applicationKey:
            typeof remote['applicationKey'] === 'string'
              ? remote['applicationKey']
              : defaultSetting?.applicationKey ??
                this.inferApplicationKey(document.id),
        } as SystemSetting;
      }

      this.settingsState.set(state);

      this.loadedState.set(true);

      this.logger.info('SettingsService', 'System settings loaded.', {
        operationId,
        settingCount: Object.keys(state).length,
      });
    } catch (error) {
      this.logger.error(
        'SettingsService',
        'Failed to load system settings.',
        error,
        {
          operationId,
        },
      );

      /**
       * Keep defaults available if Firestore is temporarily unavailable.
       */
      this.loadedState.set(true);
    }
  }

  // ============================================================
  // READ
  // ============================================================

  get<T extends SystemSettingValue>(
    key: string,
    fallback?: T,
  ): T | undefined {
    const setting = this.settingsState()[key] as
      | SystemSetting<T>
      | undefined;

    if (!setting) {
      return fallback;
    }

    return setting.value;
  }

  getSetting(key: string): SystemSetting | null {
    return this.settingsState()[key] ?? null;
  }

  has(key: string): boolean {
    return this.settingsState()[key] !== undefined;
  }

  /**
   * Returns all settings belonging to an application.
   */
  getForApplication(applicationKey: string): SystemSetting[] {
    return this.settings()
      .filter(
        (setting) => setting.applicationKey === applicationKey,
      );
  }

  /**
   * Returns settings belonging to an application and group.
   */
  getForApplicationGroup(
    applicationKey: string,
    group: string,
  ): SystemSetting[] {
    return this.getForApplication(applicationKey).filter(
      (setting) => setting.group === group,
    );
  }

  /**
   * Returns the distinct setting groups for an application.
   */
  getApplicationGroups(applicationKey: string): string[] {
    return [
      ...new Set(
        this.getForApplication(applicationKey).map(
          (setting) => setting.group,
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Returns all applications represented by settings.
   */
  getApplicationKeys(): string[] {
    return [
      ...new Set(
        this.settings().map(
          (setting) => setting.applicationKey,
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }

  /**
   * Convenience method for boolean feature switches.
   */
  isEnabled(
    key: string,
    fallback = false,
  ): boolean {
    return this.get<boolean>(key, fallback) ?? fallback;
  }

  // ============================================================
  // ADMIN CONFIGURATION
  // ============================================================

  async set<T extends SystemSettingValue>(
    key: string,
    value: T,
  ): Promise<void> {
    this.ensureAdmin();

    const current = this.getSetting(key);

    if (!current) {
      throw new Error(`Unknown system setting: ${key}`);
    }

    if (!current.editable) {
      throw new Error(
        `System setting ${key} is read-only.`,
      );
    }

    this.validateValue(current.type, value);

    const operationId = this.logger.createOperationId();

    const before = this.cloneSetting(current);

    const updatedBy =
      this.authService.firebaseUser()?.uid ?? null;

    const updatedAt = Timestamp.now();

    const updated: SystemSetting = {
      ...current,
      value,
      updatedBy,
      updatedAt,
    };

    this.logger.info(
      'SettingsService',
      'Updating system setting.',
      {
        operationId,
        key,
        applicationKey: current.applicationKey,
        updatedBy,
      },
    );

    try {
      await setDoc(
        doc(firestore, 'systemSettings', key),
        {
          key,
          applicationKey: current.applicationKey,
          value,
          updatedBy,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      this.settingsState.update((state) => ({
        ...state,
        [key]: updated,
      }));

      await this.auditService.log({
        action: 'configuration.setting.updated',
        entityType: 'systemSetting',
        entityId: key,
        outcome: 'success',
        metadata: {
          operationId,
          applicationKey: current.applicationKey,
        },
        before,
        after: updated,
      });

      /**
       * Keep logger configuration synchronized.
       */
      if (key === 'logging.minimumLevel') {
        const logLevel = value;

        if (
          logLevel === 'debug' ||
          logLevel === 'info' ||
          logLevel === 'warn' ||
          logLevel === 'error'
        ) {
          this.logger.setMinimumLevel(logLevel);
        }
      }

      this.logger.info(
        'SettingsService',
        'System setting updated.',
        {
          operationId,
          key,
          applicationKey: current.applicationKey,
        },
      );
    } catch (error) {
      await this.auditService.log({
        action: 'configuration.setting.updated',
        entityType: 'systemSetting',
        entityId: key,
        outcome: 'failure',
        metadata: {
          operationId,
          applicationKey: current.applicationKey,
        },
        before,
        after: current,
      });

      this.logger.error(
        'SettingsService',
        'Failed to update system setting.',
        error,
        {
          operationId,
          key,
        },
      );

      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    this.ensureAdmin();

    const defaultSetting = DEFAULT_SETTINGS.find(
      (setting) => setting.key === key,
    );

    if (!defaultSetting) {
      throw new Error(
        `No default value exists for setting: ${key}`,
      );
    }

    const current = this.getSetting(key);

    if (!current) {
      throw new Error(
        `Unknown system setting: ${key}`,
      );
    }

    if (!current.editable) {
      throw new Error(
        `System setting ${key} is read-only.`,
      );
    }

    const operationId = this.logger.createOperationId();

    const before = this.cloneSetting(current);

    const updatedBy =
      this.authService.firebaseUser()?.uid ?? null;

    const updatedAt = Timestamp.now();

    const updated: SystemSetting = {
      ...defaultSetting,
      updatedBy,
      updatedAt,
    };

    try {
      await setDoc(
        doc(firestore, 'systemSettings', key),
        {
          key,
          applicationKey: defaultSetting.applicationKey,
          value: defaultSetting.defaultValue,
          updatedBy,
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      this.settingsState.update((state) => ({
        ...state,
        [key]: updated,
      }));

      await this.auditService.log({
        action: 'configuration.setting.reset',
        entityType: 'systemSetting',
        entityId: key,
        outcome: 'success',
        metadata: {
          operationId,
          applicationKey: defaultSetting.applicationKey,
        },
        before,
        after: updated,
      });

      this.logger.info(
        'SettingsService',
        'System setting reset to default.',
        {
          operationId,
          key,
        },
      );
    } catch (error) {
      await this.auditService.log({
        action: 'configuration.setting.reset',
        entityType: 'systemSetting',
        entityId: key,
        outcome: 'failure',
        metadata: {
          operationId,
          applicationKey: defaultSetting.applicationKey,
        },
        before,
        after: current,
      });

      this.logger.error(
        'SettingsService',
        'Failed to reset system setting.',
        error,
        {
          operationId,
          key,
        },
      );

      throw error;
    }
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private createDefaultState(): Record<
    string,
    SystemSetting
  > {
    return Object.fromEntries(
      DEFAULT_SETTINGS.map((setting) => [
        setting.key,
        {
          ...setting,
        },
      ]),
    );
  }

  private cloneSetting(
    setting: SystemSetting,
  ): SystemSetting {
    return {
      ...setting,
    };
  }

  private ensureAdmin(): void {
    if (!this.authService.isAdmin) {
      throw new Error(
        'Administrator privileges are required.',
      );
    }
  }

  private validateValue(
    type: SystemSettingType,
    value: SystemSettingValue,
  ): void {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(
            'This setting requires a string value.',
          );
        }
        break;

      case 'number':
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value)
        ) {
          throw new Error(
            'This setting requires a valid number.',
          );
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(
            'This setting requires a boolean value.',
          );
        }
        break;

      case 'json':
        /**
         * JSON settings are intentionally permissive.
         * Firestore validates serializability.
         */
        break;
    }
  }

  private inferType(
    value: unknown,
  ): SystemSettingType {
    if (typeof value === 'boolean') {
      return 'boolean';
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (typeof value === 'string') {
      return 'string';
    }

    return 'json';
  }

  /**
   * Provides backward compatibility for existing
   * systemSettings documents that do not yet have
   * applicationKey.
   */
  private inferApplicationKey(
    key: string,
  ): string {
    const [application] = key.split('.');

    if (!application) {
      return 'platform';
    }

    switch (application) {
      case 'community':
      case 'resources':
      case 'jobs':
      case 'test-center':
      case 'tax-pay':
      case 'logging':
        return application === 'logging'
          ? 'platform'
          : application;

      default:
        return 'platform';
    }
  }
}
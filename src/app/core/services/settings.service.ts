import { computed, inject, Injectable, signal } from '@angular/core';

import { collection, doc, getDocs, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

import { firestore } from './firebase-config';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { LoggerService } from './logger.service';

import {
  SystemSetting,
  SystemSettingType,
  SystemSettingValue,
} from '../models/system-setting.model';

const DEFAULT_SETTINGS: SystemSetting[] = [
  {
    id: 'community.comment.maxLength',
    key: 'community.comment.maxLength',
    label: 'Maximum Comment Length',
    group: 'Community',
    description: 'Maximum number of characters allowed in a community comment.',
    type: 'number',
    value: 2000,
    defaultValue: 2000,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.post.maxLength',
    key: 'community.post.maxLength',
    label: 'Maximum Post Length',
    group: 'Community',
    description: 'Maximum number of characters allowed in a community post.',
    type: 'number',
    value: 5000,
    defaultValue: 5000,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.reactions.enabled',
    key: 'community.reactions.enabled',
    label: 'Community Reactions',
    group: 'Community',
    description: 'Controls whether users can react to community content.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.bookmarks.enabled',
    key: 'community.bookmarks.enabled',
    label: 'Community Bookmarks',
    group: 'Community',
    description: 'Controls whether users can bookmark community posts.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'community.moderation.required',
    key: 'community.moderation.required',
    label: 'Community Moderation',
    group: 'Community',
    description: 'Determines whether new community posts require moderation approval.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    editable: true,
    clientReadable: true,
  },

  {
    id: 'logging.minimumLevel',
    key: 'logging.minimumLevel',
    label: 'Minimum Log Level',
    group: 'Logging',
    description: 'Minimum application log level emitted by the centralized logger.',
    type: 'string',
    value: 'info',
    defaultValue: 'info',
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

  private readonly settingsState = signal<Record<string, SystemSetting>>(this.createDefaultState());

  private readonly loadedState = signal(false);

  readonly settings = computed(() =>
    Object.values(this.settingsState()).sort(
      (a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label),
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
      const snapshot = await getDocs(collection(firestore, 'systemSettings'));

      const state = this.createDefaultState();

      for (const document of snapshot.docs) {
        const remote = document.data();

        const defaultSetting = state[document.id];

        state[document.id] = {
          ...(defaultSetting ?? {
            id: document.id,
            key: document.id,
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

          key: typeof remote['key'] === 'string' ? remote['key'] : document.id,
        } as SystemSetting;
      }

      this.settingsState.set(state);

      this.loadedState.set(true);

      this.logger.info('SettingsService', 'System settings loaded.', {
        operationId,
        settingCount: Object.keys(state).length,
      });
    } catch (error) {
      this.logger.error('SettingsService', 'Failed to load system settings.', error, {
        operationId,
      });

      this.loadedState.set(true);
    }
  }

  // ============================================================
  // READ
  // ============================================================

  get<T extends SystemSettingValue>(key: string, fallback?: T): T | undefined {
    const setting = this.settingsState()[key] as SystemSetting<T> | undefined;

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

  // ============================================================
  // ADMIN CONFIGURATION
  // ============================================================

  async set<T extends SystemSettingValue>(key: string, value: T): Promise<void> {
    this.ensureAdmin();

    const current = this.getSetting(key);

    if (!current) {
      throw new Error(`Unknown system setting: ${key}`);
    }

    if (!current.editable) {
      throw new Error(`System setting ${key} is read-only.`);
    }

    this.validateValue(current.type, value);

    const operationId = this.logger.createOperationId();

    const before = this.cloneSetting(current);

    const updatedBy = this.authService.firebaseUser()?.uid ?? null;

    const updatedAt = Timestamp.now();

    const updated: SystemSetting = {
      ...current,

      value,

      updatedBy,

      updatedAt,
    };

    this.logger.info('SettingsService', 'Updating system setting.', {
      operationId,
      key,
      updatedBy,
    });

    try {
      await setDoc(
        doc(firestore, 'systemSettings', key),
        {
          key,

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

      this.logger.info('SettingsService', 'System setting updated.', {
        operationId,
        key,
      });
    } catch (error) {
      await this.auditService.log({
        action: 'configuration.setting.updated',

        entityType: 'systemSetting',

        entityId: key,

        outcome: 'failure',

        metadata: {
          operationId,
        },

        before,

        after: current,
      });

      this.logger.error('SettingsService', 'Failed to update system setting.', error, {
        operationId,
        key,
      });

      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    this.ensureAdmin();

    const defaultSetting = DEFAULT_SETTINGS.find((setting) => setting.key === key);

    if (!defaultSetting) {
      throw new Error(`No default value exists for setting: ${key}`);
    }

    const current = this.getSetting(key);

    if (!current) {
      throw new Error(`Unknown system setting: ${key}`);
    }

    if (!current.editable) {
      throw new Error(`System setting ${key} is read-only.`);
    }

    const operationId = this.logger.createOperationId();

    const before = this.cloneSetting(current);

    const updatedBy = this.authService.firebaseUser()?.uid ?? null;

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
        },

        before,

        after: updated,
      });

      this.logger.info('SettingsService', 'System setting reset to default.', {
        operationId,
        key,
      });
    } catch (error) {
      await this.auditService.log({
        action: 'configuration.setting.reset',

        entityType: 'systemSetting',

        entityId: key,

        outcome: 'failure',

        metadata: {
          operationId,
        },

        before,

        after: current,
      });

      this.logger.error('SettingsService', 'Failed to reset system setting.', error, {
        operationId,
        key,
      });

      throw error;
    }
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private createDefaultState(): Record<string, SystemSetting> {
    return Object.fromEntries(
      DEFAULT_SETTINGS.map((setting) => [
        setting.key,
        {
          ...setting,
        },
      ]),
    );
  }

  private cloneSetting(setting: SystemSetting): SystemSetting {
    return {
      ...setting,
    };
  }

  private ensureAdmin(): void {
    if (!this.authService.isAdmin) {
      throw new Error('Administrator privileges are required.');
    }
  }

  private validateValue(type: SystemSettingType, value: SystemSettingValue): void {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error('This setting requires a string value.');
        }
        break;

      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error('This setting requires a valid number.');
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error('This setting requires a boolean value.');
        }
        break;

      case 'json':
        /**
         * JSON settings are intentionally permissive.
         * Firestore itself will validate serializability.
         */
        break;
    }
  }

  private inferType(value: unknown): SystemSettingType {
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
}

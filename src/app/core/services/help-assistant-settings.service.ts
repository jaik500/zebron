import { Injectable, signal } from '@angular/core';

import { doc, getDoc, setDoc } from 'firebase/firestore';

import { firestore } from './firebase-config';
import {
  DEFAULT_HELP_ASSISTANT_SETTINGS,
  HELP_ASSISTANT_SETTINGS_PATH,
  HelpAssistantSettings,
  normalizeHelpAssistantSettings,
} from '../models/help-assistant-settings.model';

/**
 * Loads and saves the help assistant settings. Reading is public (the
 * widget needs the welcome text and on/off switch); saving is limited to
 * platform administrators by the Firestore rules.
 */
@Injectable({ providedIn: 'root' })
export class HelpAssistantSettingsService {
  private readonly current = signal<HelpAssistantSettings>(DEFAULT_HELP_ASSISTANT_SETTINGS);
  private loading: Promise<HelpAssistantSettings> | null = null;

  /** Last loaded settings (defaults until the first load finishes). */
  readonly settings = this.current.asReadonly();

  /** Load once per page load; pass force to read again. */
  load(force = false): Promise<HelpAssistantSettings> {
    if (!this.loading || force) {
      this.loading = getDoc(doc(firestore, HELP_ASSISTANT_SETTINGS_PATH.collection, HELP_ASSISTANT_SETTINGS_PATH.id))
        .then((snapshot) => normalizeHelpAssistantSettings(snapshot.exists() ? snapshot.data() : {}))
        .catch(() => DEFAULT_HELP_ASSISTANT_SETTINGS)
        .then((settings) => {
          this.current.set(settings);
          return settings;
        });
    }
    return this.loading;
  }

  async save(settings: HelpAssistantSettings, uid: string): Promise<HelpAssistantSettings> {
    const clean = normalizeHelpAssistantSettings(settings);
    const record: HelpAssistantSettings = {
      ...clean,
      updatedAt: new Date().toISOString(),
      updatedBy: uid,
    };

    await setDoc(doc(firestore, HELP_ASSISTANT_SETTINGS_PATH.collection, HELP_ASSISTANT_SETTINGS_PATH.id), record);

    this.current.set(record);
    this.loading = Promise.resolve(record);
    return record;
  }
}

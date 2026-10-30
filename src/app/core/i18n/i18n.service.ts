import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { LocalizationService } from '../services/localization.service';
import { interpolate, type TranslationParams } from './interpolate';

export type { TranslationParams } from './interpolate';

/**
 * Lightweight translation layer (French).
 *
 * - The English text is the key: {{ 'Invite member' | t }}.
 * - Placeholders use {name} or {0}: {{ 'Hello {name}' | t: { name: user.name } }}.
 * - French text lives in core/i18n/fr/*.ts and is downloaded only when
 *   French is selected. Anything without a French entry shows in English.
 *
 * Templates use the `t` pipe; TypeScript uses I18nService.t().
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly localization = inject(LocalizationService);

  /** Base language code: "en", "fr". */
  readonly language = computed(() => (this.localization.language() ?? 'en').split('-')[0].toLowerCase());

  private readonly french = signal<Readonly<Record<string, string>> | null>(null);
  private loading: Promise<void> | null = null;

  constructor() {
    effect(() => {
      if (this.language() === 'fr') {
        void this.loadFrench();
      }
    });
  }

  /** Translates English text into the selected language. */
  t(text: string, params?: TranslationParams): string {
    const translated = this.language() === 'fr' ? this.french()?.[text] ?? text : text;
    return params ? interpolate(translated, params) : translated;
  }

  private loadFrench(): Promise<void> {
    this.loading ??= import('./fr')
      .then((module) => this.french.set(module.FRENCH))
      .catch((error) => {
        console.error('[i18n] French translations could not be loaded.', error);
        this.loading = null;
      });
    return this.loading;
  }
}

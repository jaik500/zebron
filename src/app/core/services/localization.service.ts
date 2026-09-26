import {
  DOCUMENT,
} from '@angular/common';

import {
  computed,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import { SUPPORTED_LANGUAGES } from '../config/supported-languages';
import { SupportedLanguage } from '../models/supported-language.model';

const DEFAULT_LANGUAGE = 'en-US';

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly document = inject(DOCUMENT);

  private readonly languageState = signal<string>(
    DEFAULT_LANGUAGE,
  );

  /**
   * Currently selected language.
   */
  readonly language = this.languageState.asReadonly();

  /**
   * Complete language catalog.
   */
  readonly languages = computed(() =>
    SUPPORTED_LANGUAGES,
  );

  /**
   * Languages currently enabled by Zebron.
   */
  readonly enabledLanguages = computed(() =>
    SUPPORTED_LANGUAGES.filter(
      (language) => language.enabled,
    ),
  );

  /**
   * Currently selected language definition.
   */
  readonly currentLanguage = computed(() =>
    SUPPORTED_LANGUAGES.find(
      (language) =>
        language.code === this.languageState(),
    ) ?? SUPPORTED_LANGUAGES[0],
  );

  /**
   * Initialize the user's language.
   *
   * Priority:
   * 1. Saved Zebron preference
   * 2. Browser language
   * 3. Zebron default language
   */
  initialize(): void {
    const savedLanguage =
      this.getSavedLanguage();

    if (
      savedLanguage &&
      this.isLanguageEnabled(savedLanguage)
    ) {
      this.setLanguage(savedLanguage);
      return;
    }

    const browserLanguage =
      this.getBrowserLanguage();

    if (
      browserLanguage &&
      this.isLanguageEnabled(browserLanguage)
    ) {
      this.setLanguage(browserLanguage);
      return;
    }

    this.setLanguage(DEFAULT_LANGUAGE);
  }

  /**
   * Change the current language.
   */
  setLanguage(languageCode: string): void {
    const language =
      SUPPORTED_LANGUAGES.find(
        (item) => item.code === languageCode,
      );

    if (!language || !language.enabled) {
      return;
    }

    this.languageState.set(language.code);

    this.saveLanguage(language.code);

    this.applyDocumentLanguage(language);
  }

  /**
   * Check whether a language is enabled.
   */
  isLanguageEnabled(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(
      (language) =>
        language.code === languageCode &&
        language.enabled,
    );
  }

  /**
   * Get a language by code.
   */
  getLanguage(
    languageCode: string,
  ): SupportedLanguage | undefined {
    return SUPPORTED_LANGUAGES.find(
      (language) =>
        language.code === languageCode,
    );
  }

  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem(
        'zebron.language',
      );
    } catch {
      return null;
    }
  }

  private saveLanguage(
    languageCode: string,
  ): void {
    try {
      localStorage.setItem(
        'zebron.language',
        languageCode,
      );
    } catch {
      // Ignore storage failures.
    }
  }

  private getBrowserLanguage(): string | null {
    if (
      typeof navigator === 'undefined'
    ) {
      return null;
    }

    const browserLanguage =
      navigator.language;

    if (
      this.isLanguageEnabled(browserLanguage)
    ) {
      return browserLanguage;
    }

    const baseLanguage =
      browserLanguage.split('-')[0];

    const match =
      SUPPORTED_LANGUAGES.find(
        (language) =>
          language.code.split('-')[0] ===
            baseLanguage &&
          language.enabled,
      );

    return match?.code ?? null;
  }

  private applyDocumentLanguage(
    language: SupportedLanguage,
  ): void {
    this.document.documentElement.lang =
      language.code;

    this.document.documentElement.dir =
      language.direction;
  }
}
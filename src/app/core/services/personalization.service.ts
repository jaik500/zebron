import { Injectable, signal } from '@angular/core';

/**
 * Visitor personalization preferences.
 *
 * Interest values contain category slugs rather than
 * maintaining a separate hard-coded interest taxonomy.
 */
export interface PersonalizationPreferences {
  interests: string[];
  locationId: string | null;
}

/**
 * Zebron personalization service.
 *
 * Responsibilities:
 * - Maintain visitor-selected category interests.
 * - Maintain visitor-selected location.
 * - Provide personalization state to the UI.
 * - Persist preferences locally for anonymous visitors.
 *
 * The CategoryService remains the source of truth for
 * available categories.
 */
@Injectable({
  providedIn: 'root',
})
export class PersonalizationService {

  // =========================================================
  // Storage
  // =========================================================

  private readonly storageKey =
    'zebron-personalization';

  // =========================================================
  // Preferences
  // =========================================================

  private readonly _preferences =
    signal<PersonalizationPreferences>(
      this.loadPreferences(),
    );

  /**
   * Public read-only preferences signal.
   */
  readonly preferences =
    this._preferences.asReadonly();

  // =========================================================
  // Interest Management
  // =========================================================

  /**
   * Add or remove a category slug from
   * the visitor's interests.
   */
  toggleInterest(
    interestSlug: string,
  ): void {

    const current =
      this._preferences();

    const interests =
      current.interests.includes(
        interestSlug,
      )
        ? current.interests.filter(
            (slug) =>
              slug !== interestSlug,
          )
        : [
            ...current.interests,
            interestSlug,
          ];

    this.updatePreferences({
      ...current,
      interests,
    });
  }

  /**
   * Replace the selected category interests.
   */
  setInterests(
    interests: string[],
  ): void {

    this.updatePreferences({
      ...this._preferences(),

      interests: [
        ...new Set(interests),
      ],
    });
  }

  // =========================================================
  // Location Management
  // =========================================================

  /**
   * Set the visitor's preferred location.
   */
  setLocation(
    locationId: string | null,
  ): void {

    this.updatePreferences({
      ...this._preferences(),
      locationId,
    });
  }

  // =========================================================
  // State Helpers
  // =========================================================

  /**
   * Determine whether the visitor has selected
   * at least one personalization preference.
   */
  hasPreferences(): boolean {

    const preferences =
      this._preferences();

    return (
      preferences.interests.length > 0 ||
      preferences.locationId !== null
    );
  }

  /**
   * Clear all personalization preferences.
   */
  clear(): void {

    const preferences:
      PersonalizationPreferences = {
        interests: [],
        locationId: null,
      };

    this._preferences.set(
      preferences,
    );

    this.persistPreferences(
      preferences,
    );
  }

  // =========================================================
  // Persistence
  // =========================================================

  /**
   * Update preferences and persist them locally.
   */
  private updatePreferences(
    preferences:
      PersonalizationPreferences,
  ): void {

    this._preferences.set(
      preferences,
    );

    this.persistPreferences(
      preferences,
    );
  }

  /**
   * Load preferences from localStorage.
   *
   * Anonymous visitors can therefore keep their
   * preferences without requiring authentication.
   */
  private loadPreferences():
    PersonalizationPreferences {

    const defaults:
      PersonalizationPreferences = {
        interests: [],
        locationId: null,
      };

    try {

      const stored =
        localStorage.getItem(
          this.storageKey,
        );

      if (!stored) {
        return defaults;
      }

      const parsed =
        JSON.parse(stored);

      return {
        interests:
          Array.isArray(
            parsed?.interests,
          )
            ? parsed.interests.filter(
                (interest: unknown) =>
                  typeof interest === 'string',
              )
            : [],

        locationId:
          typeof parsed?.locationId ===
          'string'
            ? parsed.locationId
            : null,
      };

    } catch (error) {

      console.warn(
        'Unable to load Zebron personalization preferences.',
        error,
      );

      return defaults;
    }
  }

  /**
   * Persist preferences locally.
   */
  private persistPreferences(
    preferences:
      PersonalizationPreferences,
  ): void {

    try {

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(
          preferences,
        ),
      );

    } catch (error) {

      console.warn(
        'Unable to persist Zebron personalization preferences.',
        error,
      );
    }
  }
}

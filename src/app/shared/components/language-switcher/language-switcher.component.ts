import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { LocalizationService } from '../../../core/services/localization.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,

  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <!-- Language button -->
    <button
      mat-button
      type="button"
      [matMenuTriggerFor]="languageMenu"
      aria-label="Select language"
      class="language-trigger"
    >
      <mat-icon aria-hidden="true">
        language
      </mat-icon>

      <span>
        {{ currentLanguageCode() }}
      </span>

      <mat-icon aria-hidden="true">
        expand_more
      </mat-icon>
    </button>


    <!-- Language menu -->
    <mat-menu
      #languageMenu="matMenu"
      xPosition="before"
      class="language-menu"
    >

      <!-- Menu title -->
      <div class="language-menu-title">
        <mat-icon aria-hidden="true">
          language
        </mat-icon>

        <span>
          Language
        </span>
      </div>


      <!-- Languages -->
      @for (
        language of localization.languages();
        track language.code
      ) {
        <button
          mat-menu-item
          type="button"
          [disabled]="!language.enabled"
          (click)="selectLanguage(language.code)"
        >
          <mat-icon
            class="language-check"
            [class.visible]="
              language.code === localization.language()
            "
            aria-hidden="true"
          >
            check
          </mat-icon>

          <span class="language-name">
            {{ language.nativeName }}
          </span>

          @if (!language.enabled) {
            <span class="language-soon">
              Soon
            </span>
          }
        </button>
      }

    </mat-menu>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly localization =
    inject(LocalizationService);

  protected currentLanguageCode(): string {
    return this.localization
      .currentLanguage()
      .code
      .split('-')[0]
      .toUpperCase();
  }

  protected selectLanguage(
    languageCode: string,
  ): void {
    if (
      !this.localization.isLanguageEnabled(
        languageCode,
      )
    ) {
      return;
    }

    this.localization.setLanguage(
      languageCode,
    );
  }
}
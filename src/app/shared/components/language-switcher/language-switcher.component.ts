import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { LocalizationService } from '../../../core/services/localization.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/**
 * Language picker in the global header.
 *
 * The menu renders in an overlay outside this component, so its styles
 * use Tailwind utility classes (global) rather than component styles.
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,

  imports: [
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <!-- Trigger: globe + current language code, white on the dark header -->
    <button
      type="button"
      [matMenuTriggerFor]="languageMenu"
      [attr.aria-label]="'Select language' | t"
      [title]="'Select language' | t"
      class="inline-flex h-9 items-center gap-1 rounded-full border border-white/25 px-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <mat-icon aria-hidden="true" class="!h-[18px] !w-[18px] !text-[18px]">language</mat-icon>
      <span class="tracking-wide">{{ currentLanguageCode() }}</span>
      <mat-icon aria-hidden="true" class="!h-[18px] !w-[18px] !text-[18px] opacity-80">expand_more</mat-icon>
    </button>

    <mat-menu #languageMenu="matMenu" xPosition="before" class="!min-w-[220px] !rounded-xl">
      <div class="flex items-center gap-2 border-b border-gray-100 px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <mat-icon aria-hidden="true" class="!h-4 !w-4 !text-base">translate</mat-icon>
        {{ 'Language' | t }}
      </div>

      @for (language of localization.languages(); track language.code) {
        @let selected = language.code === localization.language();
        <button
          mat-menu-item
          type="button"
          [disabled]="!language.enabled"
          [attr.aria-current]="selected ? 'true' : null"
          (click)="selectLanguage(language.code)"
        >
          <span class="flex w-full items-center gap-3">
            <span
              [class]="
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                (selected ? 'bg-[#007979] text-white' : 'bg-gray-100 text-gray-600')
              "
            >
              {{ shortCode(language.code) }}
            </span>

            <span class="min-w-0 flex-1">
              <span [class]="'block text-sm ' + (selected ? 'font-semibold text-[#007979]' : 'text-gray-900')">
                {{ language.nativeName }}
              </span>
              @if (language.nativeName !== language.name) {
                <span class="block text-xs text-gray-500">{{ language.name }}</span>
              }
            </span>

            @if (!language.enabled) {
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                {{ 'Soon' | t }}
              </span>
            } @else if (selected) {
              <mat-icon aria-hidden="true" class="!m-0 !text-[#007979]">check</mat-icon>
            }
          </span>
        </button>
      }
    </mat-menu>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly localization =
    inject(LocalizationService);

  protected currentLanguageCode(): string {
    return this.shortCode(this.localization.currentLanguage().code);
  }

  protected shortCode(code: string): string {
    return code.split('-')[0].toUpperCase();
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

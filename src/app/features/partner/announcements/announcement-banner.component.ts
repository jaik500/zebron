import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import {
  OrganizationAnnouncementInput,
  artworkOption,
  fontOption,
  isSafeHttpsUrl,
  themeOption,
  typeOption,
} from './organization-announcement.model';

/**
 * One announcement banner. Used on the dashboard, and as the live
 * preview in the Administration page editor.
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-announcement-banner',
  standalone: true,
  imports: [
    TranslatePipe,DatePipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="relative overflow-hidden rounded-2xl p-5 shadow-sm sm:p-6"
      [class]="theme().container"
      role="region"
      [attr.aria-label]="badge() + ': ' + announcement().title"
    >
      <!-- Decorative pattern (CSS only) -->
      @switch (theme().pattern) {
        @case ('dots') {
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]"
          ></div>
        }
        @case ('rays') {
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 [background:repeating-conic-gradient(currentColor_0deg_8deg,transparent_8deg_22deg)]"
          ></div>
        }
        @case ('confetti') {
          <div aria-hidden="true" class="pointer-events-none absolute inset-0">
            <span class="absolute left-[6%] top-3 h-2 w-2 rotate-12 rounded-sm bg-pink-400"></span>
            <span class="absolute left-[22%] bottom-4 h-2.5 w-1.5 -rotate-12 rounded-sm bg-amber-400"></span>
            <span class="absolute left-[48%] top-2 h-1.5 w-3 rotate-45 rounded-sm bg-sky-400"></span>
            <span class="absolute right-[30%] bottom-3 h-2 w-2 rounded-full bg-emerald-400"></span>
            <span class="absolute right-[14%] top-4 h-3 w-1.5 rotate-[30deg] rounded-sm bg-violet-400"></span>
            <span class="absolute right-[6%] bottom-6 h-1.5 w-1.5 rounded-full bg-rose-400"></span>
          </div>
        }
      }

      <div class="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <!-- Photo or artwork -->
        @if (photoUrl(); as photo) {
          <img
            [src]="photo"
            [alt]="announcement().honoreeName || ''"
            class="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white/40 sm:h-20 sm:w-20"
            referrerpolicy="no-referrer"
          />
        } @else if (artwork().icon) {
          <div
            aria-hidden="true"
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
            [class]="theme().artwork"
          >
            <mat-icon class="!h-8 !w-8 !text-[32px]">{{ artwork().icon }}</mat-icon>
          </div>
        }

        <div class="min-w-0 flex-1 pr-8">
          <p class="text-xs font-semibold uppercase tracking-wider" [class]="theme().muted">
            {{ badge() | t }}
            @if (announcement().eventDate) {
              <span> · {{ announcement().eventDate! + 'T00:00:00' | date: 'EEE, MMM d, y' }}</span>
            }
          </p>

          <h2 class="mt-1 break-words text-xl leading-tight sm:text-2xl" [class]="font().title">
            {{ announcement().title || ('Your headline' | t) }}
          </h2>

          @if (announcement().honoreeName) {
            <p class="mt-1 text-base font-semibold">{{ announcement().honoreeName }}</p>
          }

          @if (announcement().message) {
            <p class="mt-2 whitespace-pre-line break-words text-sm leading-6" [class]="theme().muted">
              {{ announcement().message | t }}
            </p>
          }
        </div>

        @if (ctaUrl(); as url) {
          <a
            [href]="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 self-start rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition sm:self-center"
            [class]="theme().button"
          >
            {{ announcement().ctaLabel || ('Learn more' | t) }}
            <mat-icon class="!h-4 !w-4 !text-base">open_in_new</mat-icon>
          </a>
        }
      </div>

      @if (dismissible()) {
        <button
          type="button"
          class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-current"
          [class]="theme().close"
          [attr.aria-label]="'Close announcement' | t"
          [title]="'Close' | t"
          (click)="dismissed.emit()"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </section>
  `,
})
export class AnnouncementBannerComponent {
  readonly announcement = input.required<OrganizationAnnouncementInput>();

  /** Show the close (X) button. */
  readonly dismissible = input(true);

  readonly dismissed = output<void>();

  protected readonly theme = computed(() => themeOption(this.announcement().theme));
  protected readonly font = computed(() => fontOption(this.announcement().font));
  protected readonly artwork = computed(() => artworkOption(this.announcement().artwork));
  protected readonly badge = computed(() => typeOption(this.announcement().type).badge);

  protected readonly ctaUrl = computed(() => {
    const url = this.announcement().ctaUrl;
    return isSafeHttpsUrl(url) ? url : null;
  });

  protected readonly photoUrl = computed(() => {
    const url = this.announcement().imageUrl;
    return isSafeHttpsUrl(url) ? url : null;
  });
}

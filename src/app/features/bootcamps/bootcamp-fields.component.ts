import { Component, computed, input } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { BootcampSummary, dateLabel, fieldLabel } from './bootcamp.model';

/**
 * What a bootcamp teaches, on cards and in "More in Bootcamps": up to three
 * field chips (+N more), the next class date and a "Recommended" mark.
 */
@Component({
  selector: 'app-bootcamp-fields',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (summary(); as info) {
      <ul class="flex flex-wrap items-center gap-1" aria-label="Programs">
        @for (field of shown(); track field) {
          <li class="rounded-full bg-white/80 px-2 py-0.5 font-medium text-[#035e5e] ring-1 ring-[#007979]/25 {{ small() ? 'text-[11px]' : 'text-xs' }}">
            {{ label(field) }}
          </li>
        }
        @if (more()) {
          <li class="text-xs font-medium text-gray-500">+{{ more() }} more</li>
        }
      </ul>
      @if (info.nextStart || info.recommended) {
        <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-gray-600 {{ small() ? 'text-[11px]' : 'text-xs' }}">
          @if (info.nextStart) {
            <span class="inline-flex items-center gap-1">
              <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">event</mat-icon>
              Next class {{ day(info.nextStart) }}
            </span>
          }
          @if (info.recommended) {
            <span class="inline-flex items-center gap-1 font-semibold text-[#007979]">
              <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">verified</mat-icon>
              Recommended
            </span>
          }
        </p>
      }
    }
  `,
})
export class BootcampFieldsComponent {
  readonly summary = input<BootcampSummary | null | undefined>(null);
  /** Smaller text for the sidebar. */
  readonly small = input(false);

  protected readonly shown = computed(() => (this.summary()?.fields ?? []).slice(0, 3));
  protected readonly more = computed(() => Math.max(0, (this.summary()?.fields.length ?? 0) - 3));

  protected label = fieldLabel;

  /** "Jan 12" (with the year only when it isn't this year). */
  protected day(value: string): string {
    const full = dateLabel(value);
    return value.startsWith(String(new Date().getFullYear())) ? full.replace(/, \d{4}$/, '') : full;
  }
}

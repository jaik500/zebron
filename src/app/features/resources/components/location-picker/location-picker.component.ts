import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { Location } from '../../../../core/models/location.model';

interface PlaceOption {
  id: string;
  city: string;
  state: string;
  label: string;
  count: number;
}

/**
 * "Where?" picker for the resource directory: a button that opens a
 * searchable list of places grouped by state, with resource counts.
 * '' means Anywhere. Keyboard: arrows move, Enter picks, Escape closes.
 */
@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [MatIconModule],
  host: {
    class: 'relative block min-w-0',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close(true)',
  },
  template: `
    <button
      #trigger
      type="button"
      (click)="toggle()"
      (keydown.arrowDown)="$event.preventDefault(); openAndFocus()"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
      [attr.aria-label]="'Where? ' + (selected()?.label ?? 'Anywhere')"
      class="flex w-full min-w-0 items-center gap-2 text-left focus:outline-none {{ size() === 'large' ? 'h-11 rounded-lg bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-[#12BFC3]' : 'h-9 px-3 text-sm' }}"
    >
      <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] {{ selected() ? 'text-[#007979]' : 'text-gray-400' }}" aria-hidden="true">
        {{ selected() ? 'location_on' : 'place' }}
      </mat-icon>
      <span class="min-w-0 flex-1 truncate {{ selected() ? 'font-medium text-gray-900' : 'text-gray-500' }}">
        {{ selected()?.label ?? (size() === 'large' ? 'City or area: anywhere' : 'Anywhere') }}
      </span>
      <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] text-gray-400 transition-transform {{ open() ? 'rotate-180' : '' }}" aria-hidden="true">expand_more</mat-icon>
    </button>

    @if (open()) {
      <div
        class="absolute top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl {{ size() === 'large' ? 'left-0 sm:w-full sm:min-w-[18rem]' : 'right-0' }} border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/15"
        (keydown.arrowDown)="$event.preventDefault(); move(1)"
        (keydown.arrowUp)="$event.preventDefault(); move(-1)"
        (keydown.enter)="$event.preventDefault(); pickActive()"
      >
        <!-- Filter the list -->
        <div class="border-b border-gray-100 p-2">
          <label class="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007979]/30">
            <mat-icon class="!h-4 !w-4 !text-base text-gray-400" aria-hidden="true">search</mat-icon>
            <span class="sr-only">Find a city or state</span>
            <input
              #filterBox
              type="text"
              [value]="query()"
              (input)="query.set($any($event.target).value); active.set(0)"
              placeholder="Find a city or state"
              autocomplete="off"
              class="h-9 w-full border-0 bg-transparent p-0 text-sm !outline-none placeholder:text-gray-400 focus:ring-0"
            />
          </label>
        </div>

        <ul role="listbox" aria-label="Places" class="max-h-72 overflow-y-auto py-1">
          <!-- Anywhere -->
          @if (!query()) {
            <li
              role="option"
              [attr.aria-selected]="!value()"
              (click)="pick('')"
              (mouseenter)="active.set(0)"
              class="mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 {{ active() === 0 ? 'bg-[#E8F4F4]' : '' }}"
            >
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F4F4] text-[#007979]">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">public</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold text-[#032D42]">Anywhere</span>
                <span class="block text-xs text-gray-500">Every place, plus online services</span>
              </span>
              @if (!value()) {
                <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">check</mat-icon>
              }
            </li>
          }

          @for (group of groups(); track group.state) {
            <li role="presentation" class="px-3.5 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">{{ group.state || 'Other places' }}</li>
            @for (option of group.options; track option.id) {
              <li
                role="option"
                [attr.aria-selected]="value() === option.id"
                (click)="pick(option.id)"
                (mouseenter)="active.set(indexOf(option))"
                class="mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 {{ active() === indexOf(option) ? 'bg-[#E8F4F4]' : '' }}"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {{ value() === option.id ? 'bg-[#007979] text-white' : 'bg-gray-100 text-gray-500' }}">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">location_on</mat-icon>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-[#032D42]">{{ option.city || option.label }}</span>
                  @if (option.count) {
                    <span class="block text-xs text-gray-500">{{ option.count }} {{ option.count === 1 ? 'resource' : 'resources' }}</span>
                  }
                </span>
                @if (value() === option.id) {
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">check</mat-icon>
                }
              </li>
            }
          } @empty {
            @if (query()) {
              <li class="px-4 py-6 text-center text-sm text-gray-500">No place matches “{{ query() }}”.</li>
            }
          }
        </ul>
      </div>
    }
  `,
})
export class LocationPickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly locations = input<Location[]>([]);
  /** Selected location id ('' = Anywhere). */
  readonly value = input('');
  /** Resources per location id, shown under each place. */
  readonly counts = input<Map<string, number>>(new Map());
  /** 'large' for the front page search box, 'compact' inside a search bar. */
  readonly size = input<'large' | 'compact'>('compact');

  readonly valueChange = output<string>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  /** Highlighted row: 0 = Anywhere (when shown), then places in order. */
  protected readonly active = signal(0);

  private readonly options = computed<PlaceOption[]>(() =>
    this.locations()
      .filter((place) => place.id)
      .map((place) => {
        const city = (place.city ?? '').trim();
        const state = (place.state ?? '').trim();
        return {
          id: place.id!,
          city,
          state,
          label: [city, state].filter(Boolean).join(', ') || place.address || place.country || 'Unnamed place',
          count: this.counts().get(place.id!) ?? 0,
        };
      })
      .sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city)),
  );

  protected readonly selected = computed(() => this.options().find((option) => option.id === this.value()) ?? null);

  private readonly matching = computed(() => {
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.options().filter((option) => words.every((word) => option.label.toLowerCase().includes(word)));
  });

  protected readonly groups = computed(() => {
    const map = new Map<string, PlaceOption[]>();
    for (const option of this.matching()) {
      map.set(option.state, [...(map.get(option.state) ?? []), option]);
    }
    return [...map.entries()].map(([state, options]) => ({ state, options }));
  });

  /** Keyboard order: Anywhere (when shown) then the places. */
  private readonly order = computed(() => (this.query() ? [] : [''] as string[]).concat(this.matching().map((option) => option.id)));

  protected indexOf(option: PlaceOption): number {
    return this.order().indexOf(option.id);
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openAndFocus();
    }
  }

  protected openAndFocus(): void {
    this.query.set('');
    this.open.set(true);
    this.active.set(Math.max(0, this.order().indexOf(this.value())));
    setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('input')?.focus());
  }

  protected close(returnFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) {
      this.host.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
    }
  }

  protected move(step: number): void {
    const last = this.order().length - 1;
    if (last < 0) return;
    this.active.update((index) => Math.min(last, Math.max(0, index + step)));
    setTimeout(() => this.host.nativeElement.querySelector('[role="option"].bg-\\[\\#E8F4F4\\]')?.scrollIntoView({ block: 'nearest' }));
  }

  protected pickActive(): void {
    const id = this.order()[this.active()];
    if (id !== undefined) {
      this.pick(id);
    }
  }

  protected pick(id: string): void {
    this.valueChange.emit(id);
    this.close(true);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}

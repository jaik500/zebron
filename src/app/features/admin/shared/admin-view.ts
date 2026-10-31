import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { AuthService } from '../../../core/services/auth.service';
import { firestore } from '../../../core/services/firebase-config';

/**
 * Shared "two views" pattern for admin management pages:
 *
 * - list view (default): the records, with search and a Create button;
 * - form view: the create/edit form, opened from Create or Edit;
 * - display preference per admin: expandable list, cards, or split
 *   (the form beside the list, the original layout).
 *
 * The preference is saved on the admin's profile
 * (users/{uid}.adminPreferences.<page>) and in the browser.
 */

export type AdminLayout = 'list' | 'cards' | 'split';

export const ADMIN_LAYOUT_OPTIONS: ReadonlyArray<{ key: AdminLayout; label: string; icon: string; title: string }> = [
  { key: 'list', label: 'List', icon: 'view_agenda', title: 'Expandable list' },
  { key: 'cards', label: 'Cards', icon: 'grid_view', title: 'Cards' },
  { key: 'split', label: 'Split', icon: 'vertical_split', title: 'Form beside the list' },
];

const isLayout = (value: unknown): value is AdminLayout => value === 'list' || value === 'cards' || value === 'split';

export class AdminViewState {
  /** List of records, or the create/edit form. */
  readonly view = signal<'list' | 'form'>('list');

  readonly layout = signal<AdminLayout>('list');

  readonly search = signal('');

  /** Record expanded in the list (list layout). */
  readonly expandedId = signal<string | null>(null);

  readonly showForm = computed(() => this.layout() === 'split' || this.view() === 'form');

  readonly showList = computed(() => this.layout() === 'split' || this.view() === 'list');

  private readonly storageKey: string;

  constructor(
    private readonly page: string,
    private readonly auth: AuthService,
  ) {
    this.storageKey = `zebron:admin:${page}-layout`;

    try {
      const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(this.storageKey);
      if (isLayout(saved)) {
        this.layout.set(saved);
      }
    } catch {
      // Storage unavailable.
    }

    void this.loadFromProfile();
  }

  openForm(): void {
    this.view.set('form');
    this.scrollToTop();
  }

  backToList(): void {
    this.view.set('list');
    this.scrollToTop();
  }

  toggleExpanded(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  /** Every search word appears in one of the given values. */
  matches(...values: Array<string | number | boolean | null | undefined>): boolean {
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return true;
    }
    const text = values.filter((value) => value !== null && value !== undefined).join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  }

  async setLayout(layout: AdminLayout): Promise<void> {
    this.layout.set(layout);

    try {
      localStorage.setItem(this.storageKey, layout);
    } catch {
      // Storage unavailable; the profile copy still applies.
    }

    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      return;
    }
    try {
      await updateDoc(doc(firestore, 'users', uid), { [`adminPreferences.${this.page}Layout`]: layout });
    } catch {
      // Kept for this browser only.
    }
  }

  private async loadFromProfile(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      return;
    }
    try {
      const saved = (await getDoc(doc(firestore, 'users', uid))).data()?.['adminPreferences']?.[`${this.page}Layout`];
      if (isLayout(saved)) {
        this.layout.set(saved);
        try {
          localStorage.setItem(this.storageKey, saved);
        } catch {
          // Storage unavailable.
        }
      }
    } catch {
      // Keep the browser preference.
    }
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

/** Call in a field initializer: `protected readonly viewState = adminViewState('categories');` */
export function adminViewState(page: string): AdminViewState {
  return new AdminViewState(page, inject(AuthService));
}

/**
 * Search box, optional extra filters (projected), the display
 * preference switch and the Create button, on one row.
 */
@Component({
  selector: 'app-admin-view-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative w-full min-w-0 sm:max-w-56">
        <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-gray-400" aria-hidden="true">search</mat-icon>
        <input
          #box
          type="search"
          class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-14 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007979] focus:ring-4 focus:ring-[#007979]/15"
          [placeholder]="placeholder()"
          [attr.aria-label]="placeholder()"
          [value]="state().search()"
          (input)="state().search.set(box.value)"
          (keydown.escape)="state().search.set('')"
        />
        @if (total() !== null) {
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{{ shown() }} / {{ total() }}</span>
        }
      </div>

      <ng-content />

      <div class="flex shrink-0 items-center gap-2 sm:ml-auto">
        <div class="inline-flex rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Display preference">
          @for (option of options(); track option.key) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="state().layout() === option.key"
              [title]="option.title"
              (click)="state().setLayout(option.key)"
              [class]="state().layout() === option.key
                ? 'inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-[#032D42] shadow-sm'
                : 'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-[#032D42]'"
            >
              <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ option.icon }}</mat-icon>
              <span class="hidden md:inline">{{ option.label }}</span>
            </button>
          }
        </div>

        @if (createLabel() && state().layout() !== 'split') {
          <button
            type="button"
            (click)="create.emit()"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#032D42] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#032D42]/90"
          >
            <mat-icon class="!h-5 !w-5 !text-[18px]" aria-hidden="true">add</mat-icon>
            <span>{{ createLabel() }}</span>
          </button>
        }
      </div>
    </div>
  `,
})
export class AdminViewToolbarComponent {
  readonly state = input.required<AdminViewState>();
  readonly placeholder = input('Search');
  readonly createLabel = input<string | null>(null);
  readonly shown = input<number>(0);
  readonly total = input<number | null>(null);

  /** Pages whose form or detail opens in a dialog have no split layout. */
  readonly allowSplit = input(true);

  readonly create = output<void>();

  protected readonly options = computed(() =>
    ADMIN_LAYOUT_OPTIONS.filter((option) => this.allowSplit() || option.key !== 'split'),
  );
}

/** Just the List / Cards (/ Split) switch, for pages with their own search. */
@Component({
  selector: 'app-admin-layout-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="inline-flex shrink-0 rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Display preference">
      @for (option of options(); track option.key) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="state().layout() === option.key"
          [title]="option.title"
          (click)="state().setLayout(option.key)"
          [class]="state().layout() === option.key
            ? 'inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-[#032D42] shadow-sm'
            : 'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-[#032D42]'"
        >
          <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ option.icon }}</mat-icon>
          <span class="hidden md:inline">{{ option.label }}</span>
        </button>
      }
    </div>
  `,
})
export class AdminLayoutSwitchComponent {
  readonly state = input.required<AdminViewState>();
  /** Pages whose form opens in a dialog have no split layout. */
  readonly allowSplit = input(true);

  protected readonly options = computed(() =>
    ADMIN_LAYOUT_OPTIONS.filter((option) => this.allowSplit() || option.key !== 'split'),
  );
}

/** "← Back to …" link shown above a form in the list/cards layouts. */
@Component({
  selector: 'app-admin-back-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      (click)="back.emit()"
      class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#007979] hover:underline"
    >
      <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">arrow_back</mat-icon>
      {{ label() }}
    </button>
  `,
})
export class AdminBackLinkComponent {
  readonly label = input('Back to the list');
  readonly back = output<void>();
}

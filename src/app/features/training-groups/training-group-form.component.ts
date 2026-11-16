import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import {
  DELIVERY_MODES,
  TRAINING_GROUP_TYPES,
  TrainingGroup,
  TrainingGroupManualStatus,
} from './training-group.service';

/** A person who can lead or instruct a group (staff and above). */
export interface GroupStaffOption {
  userId: string;
  name: string;
  role: string;
}

const RANK: Record<string, number> = { org_member: 1, org_staff: 2, org_manager: 3, org_admin: 4, org_owner: 5 };

/**
 * Create or edit a training group, in a dialog. Leads must be managers and
 * above; instructors staff and above. Members are added on the group's page.
 */
@Component({
  selector: 'app-training-group-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="cancelled.emit()">
      <form
        class="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-form-title"
        (click)="$event.stopPropagation()"
        (keydown.escape)="cancelled.emit()"
        (ngSubmit)="submit()"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
          <h2 id="group-form-title" class="truncate text-lg font-semibold text-white">
            {{ (draft().id ? 'Edit training group' : 'New training group') | t }}
          </h2>
          <button type="button" (click)="cancelled.emit()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div class="grid gap-4 sm:grid-cols-[1fr_160px]">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Name' | t }} *</span>
              <input
                name="name"
                class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                [placeholder]="'e.g. Cybersecurity Bootcamp – January 2027' | t"
                maxlength="150"
                required
                [ngModel]="draft().name"
                (ngModelChange)="patch({ name: $event })"
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Type' | t }}</span>
              <select name="type" class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" [ngModel]="draft().type" (ngModelChange)="patch({ type: $event })">
                @for (type of types; track type.value) {
                  <option [value]="type.value">{{ type.label | t }}</option>
                }
              </select>
            </label>
          </div>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ 'Description' | t }}</span>
            <textarea
              name="description"
              rows="3"
              maxlength="5000"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              [ngModel]="draft().description"
              (ngModelChange)="patch({ description: $event })"
            ></textarea>
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">{{ 'Program' | t }}</span>
            <input
              name="programName"
              class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              [placeholder]="'e.g. Cybersecurity' | t"
              maxlength="150"
              [ngModel]="draft().programName"
              (ngModelChange)="patch({ programName: $event })"
            />
          </label>

          <div class="grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Start date' | t }}</span>
              <input type="date" name="start" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" [ngModel]="dateValue(draft().startDate)" (ngModelChange)="patch({ startDate: parseDate($event) })" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'End date' | t }}</span>
              <input type="date" name="end" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" [ngModel]="dateValue(draft().endDate)" (ngModelChange)="patch({ endDate: parseDate($event) })" />
            </label>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Capacity' | t }}</span>
              <input
                type="number"
                name="capacity"
                min="0"
                max="10000"
                class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                [ngModel]="draft().capacity"
                (ngModelChange)="patch({ capacity: +$event || 0 })"
              />
              <span class="mt-0.5 block text-xs text-slate-500">{{ '0 = no limit' | t }}</span>
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend class="text-sm font-medium text-slate-700">{{ 'Delivery' | t }}</legend>
              <div class="mt-1 flex flex-wrap gap-2">
                @for (mode of deliveryModes; track mode.value) {
                  <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm" [class]="draft().deliveryMode === mode.value ? 'border-[#007979] bg-teal-50 text-[#006666]' : 'border-slate-300 text-slate-700'">
                    <input type="radio" name="delivery" class="sr-only" [value]="mode.value" [ngModel]="draft().deliveryMode" (ngModelChange)="patch({ deliveryMode: $event })" />
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ mode.icon }}</mat-icon>
                    {{ mode.label | t }}
                  </label>
                }
              </div>
            </fieldset>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Location' | t }}</span>
              <input
                name="location"
                maxlength="300"
                class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                [placeholder]="(draft().deliveryMode === 'online' ? 'Optional' : 'Address or room') | t"
                [ngModel]="draft().location"
                (ngModelChange)="patch({ location: $event })"
              />
            </label>
          </div>

          <fieldset>
            <legend class="text-sm font-medium text-slate-700">{{ 'Status' | t }}</legend>
            <div class="mt-1 flex flex-wrap gap-2">
              @for (option of statusOptions; track option.label) {
                <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm" [class]="draft().manualStatus === option.value ? 'border-[#007979] bg-teal-50 text-[#006666]' : 'border-slate-300 text-slate-700'">
                  <input type="radio" name="status" class="sr-only" [checked]="draft().manualStatus === option.value" (change)="patch({ manualStatus: option.value })" />
                  {{ option.label | t }}
                </label>
              }
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ 'Otherwise the status follows the dates: upcoming, active, then completed. Members don\\u0027t see draft groups.' | t }}</p>
          </fieldset>

          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend class="text-sm font-medium text-slate-700">{{ 'Leads' | t }}</legend>
              <p class="text-xs text-slate-500">{{ 'Managers who run this group. They can edit it and change its members.' | t }}</p>
              <div class="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                @for (person of leadOptions(); track person.userId) {
                  <label class="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="draft().leadIds.includes(person.userId)" (change)="toggle('leadIds', person.userId)" />
                    <span class="truncate">{{ person.name }}</span>
                  </label>
                } @empty {
                  <p class="text-xs text-slate-500">{{ 'No managers yet.' | t }}</p>
                }
              </div>
            </fieldset>
            <fieldset>
              <legend class="text-sm font-medium text-slate-700">{{ 'Instructors' | t }}</legend>
              <p class="text-xs text-slate-500">{{ 'Staff who teach this group. They see its members and progress.' | t }}</p>
              <div class="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                @for (person of instructorOptions(); track person.userId) {
                  <label class="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="draft().instructorIds.includes(person.userId)" (change)="toggle('instructorIds', person.userId)" />
                    <span class="truncate">{{ person.name }}</span>
                  </label>
                } @empty {
                  <p class="text-xs text-slate-500">{{ 'No staff yet.' | t }}</p>
                }
              </div>
            </fieldset>
          </div>

          @if (problem(); as message) {
            <p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">{{ message | t }}</p>
          }
          @if (error()) {
            <p class="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
          }
        </div>

        <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button type="button" (click)="cancelled.emit()" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {{ 'Cancel' | t }}
          </button>
          <button
            type="submit"
            [disabled]="saving() || !!problem()"
            class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ (saving() ? 'Saving…' : draft().id ? 'Save changes' : 'Create group') | t }}
          </button>
        </footer>
      </form>
    </div>
  `,
})
export class TrainingGroupFormComponent {
  readonly group = input.required<TrainingGroup>();
  readonly staff = input<GroupStaffOption[]>([]);
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  /** The signed-in user; a manager who is not an admin must stay a lead. */
  readonly currentUserId = input('');
  readonly mustLead = input(false);

  readonly saved = output<TrainingGroup>();
  readonly cancelled = output<void>();

  protected readonly types = TRAINING_GROUP_TYPES;
  protected readonly deliveryModes = DELIVERY_MODES;
  protected readonly statusOptions: { value: TrainingGroupManualStatus; label: string }[] = [
    { value: null, label: 'Follows the dates' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  private readonly edits = signal<Partial<TrainingGroup>>({});
  protected readonly draft = computed<TrainingGroup>(() => ({ ...this.group(), ...this.edits() }));

  protected readonly leadOptions = computed(() => this.staff().filter((person) => (RANK[person.role] ?? 0) >= 3));
  protected readonly instructorOptions = computed(() => this.staff().filter((person) => (RANK[person.role] ?? 0) >= 2));

  protected readonly problem = computed<string | null>(() => {
    const group = this.draft();
    if (!group.name.trim()) {
      return 'Give the group a name.';
    }
    if (group.startDate && group.endDate && group.endDate < group.startDate) {
      return 'The end date is before the start date.';
    }
    if (group.capacity > 0 && group.capacity < group.memberCount) {
      return 'The capacity is lower than the number of members already in the group.';
    }
    if (this.mustLead() && !group.leadIds.includes(this.currentUserId())) {
      return 'Keep yourself as a lead, or ask an admin to make this change.';
    }
    return null;
  });

  protected patch(change: Partial<TrainingGroup>): void {
    this.edits.set({ ...this.edits(), ...change });
  }

  protected toggle(field: 'leadIds' | 'instructorIds', userId: string): void {
    const current = this.draft()[field];
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    this.patch(field === 'leadIds' ? { leadIds: next } : { instructorIds: next });
  }

  protected dateValue(date: Date | null): string {
    if (!date) {
      return '';
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  /** <input type="date"> gives "YYYY-MM-DD": kept as local midnight. */
  protected parseDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  protected submit(): void {
    if (!this.problem() && !this.saving()) {
      this.saved.emit(this.draft());
    }
  }
}

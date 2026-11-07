import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../../core/services/auth.service';
import { JobService } from '../../../../core/services/job.service';
import {
  EmploymentType,
  isJobOpen,
  JOB_ALERT_IDS,
  JobAlert,
  SavedJob,
  WorkArrangement,
} from '../../../../core/models/job.model';
import { JobSeekerService } from '../../job-seeker.service';

type SavedState = 'open' | 'closed' | 'removed' | 'checking';

const ARRANGEMENTS: { value: WorkArrangement | ''; label: string }[] = [
  { value: '', label: 'Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];

const EMPLOYMENT_TYPES: { value: EmploymentType | ''; label: string }[] = [
  { value: '', label: 'Any' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
];

/**
 * /jobs/my: a job seeker's saved jobs and daily job alerts.
 * Free for everyone with a Zebron account.
 */
@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <main class="min-h-screen bg-gray-50">
      <header class="border-b border-gray-200 bg-[#032D42]">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#7ED6D1]">Zebron job board</p>
            <h1 class="text-xl font-bold text-white sm:text-2xl">My jobs</h1>
          </div>
          <a
            routerLink="/find/job"
            class="inline-flex h-10 shrink-0 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-[#7ED6D1] hover:text-[#032D42]"
          >
            Find jobs
          </a>
        </div>
      </header>

      <div class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        @if (auth.isLoading()) {
          <p class="text-sm text-gray-500">Loading…</p>
        } @else if (!seeker.userId()) {
          <section class="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h2 class="text-lg font-bold text-[#032D42]">Save jobs and get alerts</h2>
            <p class="mt-1 text-sm text-gray-600">Sign in to keep a list of jobs and get a daily email when new ones match your search. It's free.</p>
            <a
              routerLink="/login"
              [queryParams]="{ returnUrl: '/jobs/my' }"
              class="mt-4 inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              Sign in
            </a>
          </section>
        } @else {
          <!-- Saved jobs -->
          <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <h2 class="text-base font-bold text-[#032D42]">Saved jobs</h2>
              <span class="text-sm text-gray-500">{{ seeker.saved().length }}</span>
            </div>

            @if (seeker.saved().length === 0) {
              <p class="px-5 py-6 text-sm text-gray-500">
                No saved jobs yet. Use <strong>Save</strong> on any job to keep it here.
              </p>
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (item of seeker.saved(); track item.jobId) {
                  <li class="flex items-center gap-3 px-5 py-3">
                    <div class="min-w-0 flex-1">
                      @if (stateOf(item) === 'removed') {
                        <p class="truncate text-sm font-semibold text-gray-500">{{ item.title }}</p>
                      } @else {
                        <a [routerLink]="['/jobs', item.jobId]" class="block truncate text-sm font-semibold text-[#032D42] hover:text-[#007979]">
                          {{ item.title }}
                        </a>
                      }
                      <p class="truncate text-xs text-gray-500">
                        {{ item.organizationName }}
                        @if (stateOf(item) === 'closed') {
                          · <span class="font-medium text-amber-700">No longer open</span>
                        } @else if (stateOf(item) === 'removed') {
                          · <span class="font-medium text-gray-500">Removed from the board</span>
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      (click)="unsave(item)"
                      class="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-red-700"
                      [attr.aria-label]="'Remove ' + item.title"
                    >
                      Remove
                    </button>
                  </li>
                }
              </ul>
            }
          </section>

          <!-- Job alerts -->
          <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <div>
                <h2 class="text-base font-bold text-[#032D42]">Job alerts</h2>
                <p class="text-xs text-gray-500">A daily email when new jobs match. Up to {{ maxAlerts }}.</p>
              </div>
              @if (!editingId() && seeker.canAddAlert()) {
                <button
                  type="button"
                  (click)="startNew()"
                  class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]"
                >
                  <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>
                  New alert
                </button>
              }
            </div>

            @if (editingId()) {
              <form [formGroup]="form" (ngSubmit)="saveAlert()" class="space-y-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div class="grid gap-3 sm:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Keywords</mat-label>
                    <input matInput formControlName="keywords" placeholder="e.g. help desk" maxlength="100" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>State</mat-label>
                    <input matInput formControlName="state" placeholder="e.g. VA (blank for any)" maxlength="2" />
                    @if (form.controls.state.invalid) {
                      <mat-error>Use the two-letter state code, or leave it blank.</mat-error>
                    }
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Work arrangement</mat-label>
                    <mat-select formControlName="workArrangement">
                      @for (option of arrangements; track option.value) {
                        <mat-option [value]="option.value">{{ option.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Job type</mat-label>
                    <mat-select formControlName="employmentType">
                      @for (option of employmentTypes; track option.value) {
                        <mat-option [value]="option.value">{{ option.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
                @if (alertError()) {
                  <p class="text-sm text-red-600" role="alert">{{ alertError() }}</p>
                }
                <div class="flex justify-end gap-2">
                  <button type="button" (click)="cancel()" class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="form.invalid || busy()"
                    class="inline-flex h-9 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-60"
                  >
                    {{ editingId() === 'new' ? 'Create alert' : 'Save alert' }}
                  </button>
                </div>
              </form>
            }

            @if (seeker.alerts().length === 0 && !editingId()) {
              <p class="px-5 py-6 text-sm text-gray-500">No alerts yet. Create one to hear about new jobs by email.</p>
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (alert of seeker.alerts(); track alert.id) {
                  <li class="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold text-[#032D42]">{{ describe(alert) }}</p>
                      <p class="text-xs text-gray-500">
                        {{ alert.active ? 'Daily email' : 'Paused' }}
                        @if (sentOn(alert); as sent) {
                          · last sent {{ sent }}
                        }
                      </p>
                    </div>
                    <button type="button" (click)="togglePaused(alert)" class="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                      {{ alert.active ? 'Pause' : 'Resume' }}
                    </button>
                    <button type="button" (click)="edit(alert)" class="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                      Edit
                    </button>
                    <button type="button" (click)="remove(alert)" class="inline-flex h-9 items-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-red-700">
                      Delete
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
        }
      </div>
    </main>
  `,
})
export class MyJobsComponent {
  protected readonly auth = inject(AuthService);
  protected readonly seeker = inject(JobSeekerService);
  private readonly jobs = inject(JobService);
  private readonly fb = inject(FormBuilder);

  protected readonly maxAlerts = JOB_ALERT_IDS.length;
  protected readonly arrangements = ARRANGEMENTS;
  protected readonly employmentTypes = EMPLOYMENT_TYPES;

  /** 'new', an alert id being edited, or null. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly alertError = signal('');

  private readonly states = signal<Record<string, SavedState>>({});

  protected readonly form = this.fb.nonNullable.group({
    keywords: [''],
    state: ['', [Validators.pattern(/^[A-Za-z]{2}$|^$/)]],
    workArrangement: ['' as WorkArrangement | ''],
    employmentType: ['' as EmploymentType | ''],
  });

  private readonly savedIds = computed(() => this.seeker.saved().map((item) => item.jobId).join(','));

  constructor() {
    // Check whether each saved job is still open (one read per saved job).
    effect(() => {
      const ids = this.savedIds();
      if (ids) {
        void this.checkSaved(ids.split(','));
      }
    });
  }

  protected stateOf(item: SavedJob): SavedState {
    return this.states()[item.jobId] ?? 'checking';
  }

  private async checkSaved(ids: string[]): Promise<void> {
    const known = this.states();
    const missing = ids.filter((id) => !known[id]);
    const results = await Promise.all(
      missing.map(async (id): Promise<[string, SavedState]> => {
        try {
          const job = await this.jobs.getJob(id);
          return [id, !job ? 'removed' : isJobOpen(job) ? 'open' : 'closed'];
        } catch {
          // Drafts are not readable: treat as removed from the board.
          return [id, 'removed'];
        }
      }),
    );
    this.states.update((current) => ({ ...current, ...Object.fromEntries(results) }));
  }

  protected async unsave(item: SavedJob): Promise<void> {
    await this.seeker.toggleSaved({ id: item.jobId, title: item.title, organizationName: item.organizationName });
  }

  protected describe(alert: JobAlert): string {
    const arrangement = ARRANGEMENTS.find((option) => option.value === alert.workArrangement && option.value)?.label;
    const type = EMPLOYMENT_TYPES.find((option) => option.value === alert.employmentType && option.value)?.label;
    const parts = [alert.keywords ? `"${alert.keywords}"` : '', alert.state, arrangement ?? '', type ?? ''].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'All new jobs';
  }

  protected sentOn(alert: JobAlert): string {
    return alert.lastSentAt ? alert.lastSentAt.toDate().toLocaleDateString() : '';
  }

  protected startNew(): void {
    this.form.reset({ keywords: '', state: '', workArrangement: '', employmentType: '' });
    this.alertError.set('');
    this.editingId.set('new');
  }

  protected edit(alert: JobAlert): void {
    this.form.reset({
      keywords: alert.keywords,
      state: alert.state,
      workArrangement: alert.workArrangement,
      employmentType: alert.employmentType,
    });
    this.alertError.set('');
    this.editingId.set(alert.id);
  }

  protected cancel(): void {
    this.editingId.set(null);
  }

  protected async saveAlert(): Promise<void> {
    const id = this.editingId();
    if (!id || this.form.invalid) {
      return;
    }
    const existing = this.seeker.alerts().find((alert) => alert.id === id);
    this.busy.set(true);
    this.alertError.set('');
    try {
      await this.seeker.saveAlert({ ...this.form.getRawValue(), active: existing?.active ?? true }, id === 'new' ? undefined : id);
      this.editingId.set(null);
    } catch (error) {
      this.alertError.set(error instanceof Error ? error.message : 'Could not save this alert. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async togglePaused(alert: JobAlert): Promise<void> {
    await this.seeker.saveAlert({ ...alert, active: !alert.active }, alert.id);
  }

  protected async remove(alert: JobAlert): Promise<void> {
    await this.seeker.deleteAlert(alert.id);
    if (this.editingId() === alert.id) {
      this.editingId.set(null);
    }
  }
}

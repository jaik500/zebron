import { Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { Job } from '../../../core/models/job.model';
import { JobSeekerService } from '../job-seeker.service';

/**
 * Save / Saved toggle for a job board listing. Visitors are sent to sign
 * in and brought back to the page they were on.
 */
@Component({
  selector: 'app-save-job-button',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      (click)="toggle()"
      [disabled]="busy()"
      [attr.aria-pressed]="saved()"
      [attr.aria-label]="saved() ? 'Remove ' + job().title + ' from saved jobs' : 'Save ' + job().title"
      [class]="
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-60 ' +
        (full() ? 'h-11 w-full ' : 'h-10 ') +
        (saved()
          ? 'border-[#007979] bg-[#007979]/10 text-[#007979] hover:bg-[#007979]/15'
          : 'border-gray-300 bg-white text-gray-700 hover:border-[#007979] hover:text-[#007979]')
      "
    >
      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ saved() ? 'bookmark' : 'bookmark_border' }}</mat-icon>
      {{ saved() ? 'Saved' : 'Save' }}
    </button>
    @if (error()) {
      <p class="mt-1 text-xs text-red-600" role="alert">{{ error() }}</p>
    }
  `,
})
export class SaveJobButtonComponent {
  private readonly seeker = inject(JobSeekerService);
  private readonly router = inject(Router);

  readonly job = input.required<Job>();
  /** Full width (sidebar) instead of a compact button (cards). */
  readonly full = input(false);

  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly saved = computed(() => this.seeker.isSaved(this.job().id));

  protected async toggle(): Promise<void> {
    if (!this.seeker.userId()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.busy.set(true);
    this.error.set('');
    try {
      await this.seeker.toggleSaved(this.job());
    } catch {
      this.error.set('Could not save this job. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}

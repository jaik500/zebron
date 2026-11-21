import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { REVIEW_LIMITS, ReviewService, ReviewStatus, SiteReview } from '../../../home/reviews/review.service';

type Filter = ReviewStatus | 'all';

/**
 * Reviews of Zebron written for the home page (platform administrators).
 * Route: /admin/reviews
 *
 * New and edited reviews wait here until approved. Approve to show a
 * review on the home page; reject with a note the author sees; delete
 * spam. Administrators cannot change a review's words or rating.
 */
@Component({
  selector: 'app-review-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 class="text-2xl font-bold text-white">Reviews</h1>
            <p class="text-sm text-white/75">Reviews of Zebron for the home page. Only approved reviews are shown.</p>
          </div>
          <div class="flex gap-2">
            <a mat-stroked-button class="!border-white/40 !text-white" routerLink="/" fragment="home-reviews-title">
              <mat-icon>home</mat-icon>
              Home page
            </a>
            <a mat-stroked-button class="!border-white/40 !text-white" routerLink="/admin">
              <mat-icon>arrow_back</mat-icon>
              Admin
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- Status cards filter the list -->
        <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Filter reviews by status">
          @for (stat of stats(); track stat.key) {
            <button
              type="button"
              class="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
              [style.border-color]="filter() === stat.key ? '#007979' : null"
              [style.background-color]="filter() === stat.key ? '#ecfdf5' : null"
              [attr.aria-pressed]="filter() === stat.key"
              (click)="filter.set(stat.key)"
            >
              <p class="text-xs font-medium text-gray-500">{{ stat.label }}</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            </button>
          }
        </div>

        @if (error()) {
          <p class="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ error() }}</p>
        }

        @if (loading()) {
          <p class="p-6 text-center text-sm text-gray-500">Loading reviews…</p>
        } @else if (!visible().length) {
          <p class="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
            {{ filter() === 'pending' ? 'Nothing waiting for approval.' : 'No reviews here.' }}
          </p>
        }

        <ul class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          @for (review of visible(); track review.id) {
            <li class="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex" role="img" [attr.aria-label]="'Rated ' + review.rating + ' out of 5'">
                  @for (star of stars; track star) {
                    <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" [class.text-amber-500]="star <= review.rating" [class.text-slate-300]="star > review.rating" aria-hidden="true">star</mat-icon>
                  }
                </span>
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusBadge(review.status)">{{ statusLabel(review.status) }}</span>
                <span class="ml-auto text-xs text-gray-500">{{ dateOf(review) }}</span>
              </div>

              <p class="mt-3 whitespace-pre-line break-words text-sm leading-6 text-gray-800 [overflow-wrap:anywhere]">{{ review.text }}</p>

              <p class="mt-3 text-sm">
                <span class="font-semibold text-gray-900">{{ review.displayName }}</span>
                @if (review.about) {
                  <span class="text-gray-500"> · {{ review.about }}</span>
                }
              </p>
              <p class="mt-0.5 break-all text-[11px] text-gray-400">User ID: {{ review.userId }}</p>

              @if (review.moderatorNote && noteFor() !== review.id) {
                <p class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Note to the author: {{ review.moderatorNote }}</p>
              }

              @if (noteFor() === review.id) {
                <label class="mt-3 block text-xs font-semibold text-gray-700" [for]="'reject-note-' + review.id">
                  Why isn't it published? (the author sees this)
                </label>
                <textarea
                  #rejectNote
                  rows="2"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                  [id]="'reject-note-' + review.id"
                  [maxLength]="noteLimit"
                  [value]="note()"
                  placeholder="For example: Please remove the phone number."
                  (input)="note.set(rejectNote.value)"
                ></textarea>
                <div class="mt-2 flex justify-end gap-2">
                  <button mat-button type="button" (click)="noteFor.set(null)">Cancel</button>
                  <button mat-flat-button type="button" class="!bg-amber-600 !text-white" [disabled]="busy()" (click)="decide(review, 'rejected')">
                    Reject
                  </button>
                </div>
              } @else {
                <div class="mt-auto flex flex-wrap gap-2 pt-3">
                  @if (review.status !== 'approved') {
                    <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busy()" (click)="decide(review, 'approved')">
                      <mat-icon>check</mat-icon>
                      Approve
                    </button>
                  }
                  @if (review.status !== 'rejected') {
                    <button mat-stroked-button type="button" [disabled]="busy()" (click)="startReject(review)">
                      <mat-icon>block</mat-icon>
                      {{ review.status === 'approved' ? 'Unpublish' : 'Reject' }}
                    </button>
                  }
                  <button mat-button type="button" class="!text-rose-700" [disabled]="busy()" (click)="remove(review)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </div>
              }
            </li>
          }
        </ul>
      </main>
    </div>
  `,
})
export class ReviewAdminComponent {
  private readonly service = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly noteLimit = REVIEW_LIMITS.note;

  protected readonly reviews = signal<SiteReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('pending');
  protected readonly noteFor = signal<string | null>(null);
  protected readonly note = signal('');

  protected readonly stats = computed(() => {
    const reviews = this.reviews();
    const count = (status: ReviewStatus) => reviews.filter((review) => review.status === status).length;
    return [
      { key: 'pending' as Filter, label: 'Waiting for approval', value: count('pending') },
      { key: 'approved' as Filter, label: 'On the home page', value: count('approved') },
      { key: 'rejected' as Filter, label: 'Not published', value: count('rejected') },
      { key: 'all' as Filter, label: 'All reviews', value: reviews.length },
    ];
  });

  protected readonly visible = computed(() => {
    const filter = this.filter();
    return filter === 'all' ? this.reviews() : this.reviews().filter((review) => review.status === filter);
  });

  constructor() {
    inject(PageTitleService).setTitle('Reviews');
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.reviews.set(await this.service.listAll());
    } catch (error) {
      this.logger.error('ReviewAdmin', 'Could not load reviews.', error);
      this.error.set('Reviews could not be loaded. Check that the latest Firestore rules are deployed.');
    } finally {
      this.loading.set(false);
    }
  }

  protected startReject(review: SiteReview): void {
    this.note.set(review.moderatorNote);
    this.noteFor.set(review.id);
  }

  protected async decide(review: SiteReview, status: ReviewStatus): Promise<void> {
    const adminUid = this.auth.firebaseUser()?.uid;
    if (!adminUid || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const note = status === 'rejected' ? this.note() : '';
      await this.service.decide(review.id, status, note, adminUid);
      this.reviews.update((reviews) =>
        reviews.map((item) => (item.id === review.id ? { ...item, status, moderatorNote: note.trim() } : item)),
      );
      this.noteFor.set(null);
    } catch (error) {
      this.logger.error('ReviewAdmin', 'Could not update the review.', error);
      this.error.set('The review could not be updated. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(review: SiteReview): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete this review?',
      message: `The review by ${review.displayName} is deleted for good. The author can write a new one.`,
      icon: 'delete',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.service.remove(review.id);
      this.reviews.update((reviews) => reviews.filter((item) => item.id !== review.id));
    } catch (error) {
      this.logger.error('ReviewAdmin', 'Could not delete the review.', error);
      this.error.set('The review could not be deleted. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected statusLabel(status: ReviewStatus): string {
    return status === 'approved' ? 'On the home page' : status === 'rejected' ? 'Not published' : 'Waiting for approval';
  }

  protected statusBadge(status: ReviewStatus): string {
    return status === 'approved'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'rejected'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-slate-100 text-slate-700';
  }

  protected dateOf(review: SiteReview): string {
    const date = review.updatedAt?.toDate() ?? review.createdAt?.toDate();
    return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  }
}

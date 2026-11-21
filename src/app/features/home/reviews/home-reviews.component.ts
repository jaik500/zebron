import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { LoggerService } from '../../../core/services/logger.service';
import { REVIEW_LIMITS, ReviewService, ReviewSummary, SiteReview } from './review.service';

/** Reviews longer than this get "Read more". */
const LONG_REVIEW = 260;

/**
 * Home page: "What people say about Zebron". Approved reviews in a
 * carousel, the average rating, and a form for signed-in people to write
 * (or edit) their review, which a platform administrator approves first.
 *
 * The carousel never moves by itself: Previous / Next buttons, swiping or
 * scrolling, and arrow keys when it has focus.
 */
@Component({
  selector: 'app-home-reviews',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  host: { '(window:resize)': 'updateEnds()' },
  template: `
    <section class="bg-white" aria-labelledby="home-reviews-title">
      <div class="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div class="max-w-2xl">
            <p class="text-sm font-bold uppercase tracking-wider text-[#007979]">{{ 'Reviews' | t }}</p>
            <h2 id="home-reviews-title" class="mt-2 text-2xl font-bold tracking-tight text-[#032D42] sm:text-3xl">
              {{ 'What people say about Zebron' | t }}
            </h2>
            @if (summary(); as stats) {
              @if (stats.count && stats.average !== null) {
                <p class="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span class="inline-flex" [attr.aria-label]="'Rated {0} out of 5' | t: [averageText()]" role="img">
                    @for (star of stars; track star) {
                      <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none text-amber-500" aria-hidden="true">{{ starIcon(star, stats.average) }}</mat-icon>
                    }
                  </span>
                  <span class="font-semibold text-gray-900">{{ '{0} out of 5' | t: [averageText()] }}</span>
                  <span>· {{ (stats.count === 1 ? '1 review' : '{0} reviews') | t: [stats.count] }}</span>
                </p>
              }
            }
          </div>

          @if (!signedIn()) {
            <a
              routerLink="/login"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#007979] px-5 py-3 text-sm font-bold text-[#007979] transition hover:bg-[#E5F4F4]"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[18px]" aria-hidden="true">rate_review</mat-icon>
              {{ 'Sign in to write a review' | t }}
            </a>
          } @else if (!formOpen()) {
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007979] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#006666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] focus-visible:ring-offset-2"
              [attr.aria-expanded]="formOpen()"
              aria-controls="home-review-form"
              (click)="openForm()"
            >
              <mat-icon class="!m-0 !h-5 !w-5 !text-[18px]" aria-hidden="true">rate_review</mat-icon>
              {{ (mine() ? 'Edit your review' : 'Write a review') | t }}
            </button>
          }
        </div>

        @if (mine(); as own) {
          @if (!formOpen()) {
            <p class="mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-sm" [class]="statusClass(own)" role="status">
              <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px]" aria-hidden="true">{{ statusIcon(own) }}</mat-icon>
              <span>
                {{ statusText(own) | t }}
                @if (own.status === 'rejected' && own.moderatorNote) {
                  <span class="mt-1 block">{{ 'Note from Zebron: {0}' | t: [own.moderatorNote] }}</span>
                }
              </span>
            </p>
          }
        }

        <!-- Carousel -->
        @if (reviews().length) {
          <div
            class="relative mt-8"
            role="region"
            aria-roledescription="carousel"
            [attr.aria-label]="'Reviews of Zebron' | t"
          >
            <div class="mb-3 flex items-center justify-end gap-2">
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#007979] hover:text-[#007979] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-700"
                aria-controls="home-reviews-track"
                [attr.aria-label]="'Previous reviews' | t"
                [disabled]="atStart()"
                (click)="scroll(-1)"
              >
                <mat-icon aria-hidden="true">chevron_left</mat-icon>
              </button>
              <button
                type="button"
                class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-[#007979] hover:text-[#007979] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-700"
                aria-controls="home-reviews-track"
                [attr.aria-label]="'Next reviews' | t"
                [disabled]="atEnd()"
                (click)="scroll(1)"
              >
                <mat-icon aria-hidden="true">chevron_right</mat-icon>
              </button>
            </div>

            <ul
              #track
              id="home-reviews-track"
              tabindex="0"
              class="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
              [attr.aria-label]="'Reviews: use the arrow keys to scroll' | t"
              (scroll)="updateEnds()"
            >
              @for (review of reviews(); track review.id; let index = $index) {
                <li
                  class="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
                  role="group"
                  aria-roledescription="slide"
                  [attr.aria-label]="'{0} of {1}' | t: [index + 1, reviews().length]"
                >
                  <figure class="m-0 flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between gap-2">
                      <span class="inline-flex" role="img" [attr.aria-label]="'Rated {0} out of 5' | t: [review.rating]">
                        @for (star of stars; track star) {
                          <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" [class.text-amber-500]="star <= review.rating" [class.text-slate-300]="star > review.rating" aria-hidden="true">star</mat-icon>
                        }
                      </span>
                      <mat-icon class="!h-7 !w-7 !text-[28px] text-[#007979]/20" aria-hidden="true">format_quote</mat-icon>
                    </div>
                    <blockquote
                      [id]="'home-review-text-' + review.id"
                      class="m-0 mt-3 flex-1 whitespace-pre-line break-words text-[0.95rem] leading-7 text-slate-700 [overflow-wrap:anywhere]"
                      [class.line-clamp-6]="isLong(review) && !expanded().has(review.id)"
                    >{{ review.text }}</blockquote>
                    @if (isLong(review)) {
                      <button
                        type="button"
                        class="mt-2 self-start text-sm font-semibold text-[#007979] hover:underline"
                        [attr.aria-expanded]="expanded().has(review.id)"
                        [attr.aria-controls]="'home-review-text-' + review.id"
                        (click)="toggle(review.id)"
                      >
                        {{ (expanded().has(review.id) ? 'Show less' : 'Read more') | t }}
                      </button>
                    }
                    <figcaption class="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E5F4F4] text-sm font-bold text-[#007979]" aria-hidden="true">
                        {{ initials(review.displayName) }}
                      </span>
                      <span class="min-w-0">
                        <span class="block truncate font-semibold text-slate-900">{{ review.displayName }}</span>
                        @if (review.about) {
                          <span class="block truncate text-xs text-slate-500">{{ review.about }}</span>
                        }
                      </span>
                    </figcaption>
                  </figure>
                </li>
              }
            </ul>
          </div>
        } @else if (loaded()) {
          <p class="mt-8 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            {{ 'No reviews yet. Be the first to share your experience of Zebron.' | t }}
          </p>
        }

        <!-- Write or edit a review -->
        @if (formOpen()) {
          <form
            id="home-review-form"
            class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
            aria-labelledby="home-review-form-title"
            (submit)="$event.preventDefault(); save()"
          >
            <h3 #formTitle id="home-review-form-title" tabindex="-1" class="text-lg font-semibold text-slate-900 focus:outline-none">
              {{ (mine() ? 'Edit your review' : 'Write a review') | t }}
            </h3>
            @if (mine()) {
              <p class="mt-1 text-sm text-slate-600">{{ 'Saving changes sends your review for approval again.' | t }}</p>
            }

            <fieldset class="mt-4">
              <legend class="text-sm font-semibold text-slate-800">{{ 'Your rating' | t }} <span class="text-rose-700" aria-hidden="true">*</span></legend>
              <div class="mt-1 flex gap-1">
                @for (star of stars; track star) {
                  <label
                    class="cursor-pointer rounded-md p-0.5 focus-within:ring-2 focus-within:ring-[#007979]"
                    [title]="(star === 1 ? '1 star' : '{0} stars') | t: [star]"
                  >
                    <input
                      type="radio"
                      name="home-review-rating"
                      class="sr-only"
                      required
                      [value]="star"
                      [checked]="rating() === star"
                      [attr.aria-label]="(star === 1 ? '1 star' : '{0} stars') | t: [star]"
                      (change)="rating.set(star)"
                    />
                    <mat-icon class="!h-8 !w-8 !text-[32px] !leading-none" [class.text-amber-500]="star <= rating()" [class.text-slate-300]="star > rating()" aria-hidden="true">star</mat-icon>
                  </label>
                }
              </div>
            </fieldset>

            <label for="home-review-text" class="mt-4 block text-sm font-semibold text-slate-800">
              {{ 'Your review' | t }} <span class="text-rose-700" aria-hidden="true">*</span>
            </label>
            <textarea
              #reviewText
              id="home-review-text"
              rows="5"
              required
              class="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
              [attr.minlength]="limits.textMin"
              [maxLength]="limits.textMax"
              [value]="text()"
              [attr.placeholder]="'How has Zebron helped you?' | t"
              aria-describedby="home-review-text-count"
              (input)="text.set(reviewText.value)"
            ></textarea>
            <p id="home-review-text-count" class="mt-1 text-xs text-slate-500">
              {{ '{0}/{1} characters (at least {2})' | t: [text().trim().length, limits.textMax, limits.textMin] }}
            </p>

            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="min-w-0">
                <label for="home-review-name" class="block text-sm font-semibold text-slate-800">
                  {{ 'Name shown' | t }} <span class="text-rose-700" aria-hidden="true">*</span>
                </label>
                <input
                  #reviewName
                  id="home-review-name"
                  type="text"
                  required
                  autocomplete="name"
                  class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                  [maxLength]="limits.name"
                  [value]="displayName()"
                  (input)="displayName.set(reviewName.value)"
                />
              </div>
              <div class="min-w-0">
                <label for="home-review-about" class="block text-sm font-semibold text-slate-800">{{ 'About you (optional)' | t }}</label>
                <input
                  #reviewAbout
                  id="home-review-about"
                  type="text"
                  class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                  [maxLength]="limits.about"
                  [value]="about()"
                  [attr.placeholder]="'For example: Bootcamp graduate' | t"
                  (input)="about.set(reviewAbout.value)"
                />
              </div>
            </div>

            <p class="mt-4 flex gap-2 text-xs leading-5 text-slate-600">
              <mat-icon class="!h-4 !w-4 shrink-0 !text-[16px] text-slate-400" aria-hidden="true">info</mat-icon>
              {{ 'Your rating, review, name and the line about you appear on Zebron’s home page once a Zebron administrator approves them. Please don’t include phone numbers, email addresses or other private details.' | t }}
            </p>

            @if (formError()) {
              <p class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{{ formError()! | t }}</p>
            }

            <div class="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                class="h-10 rounded-lg bg-[#007979] px-5 text-sm font-bold text-white hover:bg-[#006666] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979] focus-visible:ring-offset-2 disabled:opacity-50"
                [disabled]="saving()"
              >
                {{ 'Send for approval' | t }}
              </button>
              <button type="button" class="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-200" (click)="closeForm()">
                {{ 'Cancel' | t }}
              </button>
              @if (mine()) {
                <button
                  type="button"
                  class="ml-auto h-10 rounded-lg px-4 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  [disabled]="saving()"
                  (click)="deleteMine()"
                >
                  {{ 'Delete my review' | t }}
                </button>
              }
            </div>
          </form>
        }

        @if (message()) {
          <p class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status" aria-live="polite">{{ message()! | t }}</p>
        }
      </div>
    </section>
  `,
})
export class HomeReviewsComponent {
  private readonly service = inject(ReviewService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly logger = inject(LoggerService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly injector = inject(Injector);

  protected readonly stars = [1, 2, 3, 4, 5];
  protected readonly limits = REVIEW_LIMITS;

  protected readonly reviews = signal<SiteReview[]>([]);
  protected readonly summary = signal<ReviewSummary | null>(null);
  protected readonly loaded = signal(false);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());
  protected readonly atStart = signal(true);
  protected readonly atEnd = signal(false);

  protected readonly signedIn = computed(() => !this.auth.isLoading() && !!this.auth.firebaseUser());
  protected readonly mine = signal<SiteReview | null>(null);

  protected readonly formOpen = signal(false);
  protected readonly rating = signal(0);
  protected readonly text = signal('');
  protected readonly displayName = signal('');
  protected readonly about = signal('');
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly averageText = computed(() => {
    const average = this.summary()?.average;
    return average === null || average === undefined
      ? ''
      : average.toLocaleString(this.i18n.language(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  });

  private readonly track = viewChild<ElementRef<HTMLUListElement>>('track');
  private readonly formTitle = viewChild<ElementRef<HTMLElement>>('formTitle');

  constructor() {
    void this.loadPublic();

    // The person's own review (status, and what the form starts with).
    effect(() => {
      const uid = this.auth.firebaseUser()?.uid ?? null;
      untracked(() => void this.loadMine(uid));
    });

    // Recheck the arrows when the reviews or the window size change.
    effect(() => {
      this.reviews();
      afterNextRender(() => this.updateEnds(), { injector: this.injector });
    });
  }

  /** Reviews and the star summary load separately: one failing never hides the other. */
  private async loadPublic(): Promise<void> {
    const [reviews, summary] = await Promise.allSettled([this.service.listApproved(), this.service.summary()]);

    if (reviews.status === 'fulfilled') {
      this.reviews.set(reviews.value);
    } else {
      // The home page still works without reviews.
      this.logger.error('HomeReviews', 'Could not load reviews.', reviews.reason);
    }

    if (summary.status === 'fulfilled') {
      this.summary.set(summary.value);
    } else {
      this.logger.error('HomeReviews', 'Could not count reviews.', summary.reason);
      // Fall back to the reviews shown.
      const shown = this.reviews();
      this.summary.set({
        count: shown.length,
        average: shown.length ? shown.reduce((total, review) => total + review.rating, 0) / shown.length : null,
      });
    }

    this.loaded.set(true);
  }

  private async loadMine(uid: string | null): Promise<void> {
    this.mine.set(null);
    if (!uid) return;
    try {
      this.mine.set(await this.service.getMine(uid));
    } catch (error) {
      this.logger.error('HomeReviews', 'Could not load your review.', error);
    }
  }

  // ------------------------------------------------------------------
  // Carousel
  // ------------------------------------------------------------------

  protected scroll(direction: 1 | -1): void {
    const track = this.track()?.nativeElement;
    if (!track) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: direction * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  protected updateEnds(): void {
    const track = this.track()?.nativeElement;
    if (!track) return;
    this.atStart.set(track.scrollLeft <= 2);
    this.atEnd.set(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
  }

  protected isLong(review: SiteReview): boolean {
    return review.text.length > LONG_REVIEW;
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected starIcon(star: number, average: number): string {
    if (average >= star - 0.25) return 'star';
    if (average >= star - 0.75) return 'star_half';
    return 'star_border';
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase() || '?';
  }

  protected statusText(review: SiteReview): string {
    if (review.status === 'approved') return 'Your review is live on the home page. Thank you!';
    if (review.status === 'rejected') return 'Your review wasn’t published. You can edit it and send it again.';
    return 'Thanks! Your review is waiting for approval.';
  }

  protected statusIcon(review: SiteReview): string {
    return review.status === 'approved' ? 'check_circle' : review.status === 'rejected' ? 'error_outline' : 'schedule';
  }

  protected statusClass(review: SiteReview): string {
    return review.status === 'approved'
      ? 'bg-emerald-50 text-emerald-900'
      : review.status === 'rejected'
        ? 'bg-amber-50 text-amber-900'
        : 'bg-slate-100 text-slate-700';
  }

  // ------------------------------------------------------------------
  // Form
  // ------------------------------------------------------------------

  protected openForm(): void {
    const own = this.mine();
    const user = this.auth.user();
    this.rating.set(own?.rating ?? 0);
    this.text.set(own?.text ?? '');
    this.about.set(own?.about ?? '');
    this.displayName.set(own?.displayName ?? defaultName(user?.preferredName || user?.firstName, user?.lastName, user?.displayName));
    this.formError.set(null);
    this.message.set(null);
    this.formOpen.set(true);
    afterNextRender(() => this.formTitle()?.nativeElement.focus(), { injector: this.injector });
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.formError.set(null);
  }

  protected async save(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid || this.saving()) return;

    const text = this.text().trim();
    if (this.rating() < 1) {
      this.formError.set('Choose a rating from 1 to 5 stars.');
      return;
    }
    if (text.length < REVIEW_LIMITS.textMin) {
      this.formError.set('Write at least 20 characters.');
      return;
    }
    if (!this.displayName().trim()) {
      this.formError.set('Enter the name to show with your review.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    try {
      await this.service.save(
        uid,
        { displayName: this.displayName(), about: this.about(), rating: this.rating(), text },
        this.mine(),
      );
      const wasLive = this.mine()?.status === 'approved';
      this.mine.set(await this.service.getMine(uid));
      this.formOpen.set(false);
      this.message.set('Thanks! Your review is waiting for approval.');
      // An edited live review leaves the carousel until it is approved again.
      if (wasLive) {
        this.reviews.update((reviews) => reviews.filter((review) => review.id !== uid));
        void this.service.summary().then((summary) => this.summary.set(summary)).catch(() => undefined);
      }
    } catch (error) {
      this.logger.error('HomeReviews', 'Could not save the review.', error);
      this.formError.set('Your review could not be sent. Check your connection and try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteMine(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    const confirmed = await this.confirmation.confirm({
      title: 'Delete your review?',
      message: 'Your review is removed from Zebron. You can write a new one at any time.',
      icon: 'delete',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    this.saving.set(true);
    try {
      await this.service.deleteMine(uid);
      this.mine.set(null);
      this.formOpen.set(false);
      this.reviews.update((reviews) => reviews.filter((review) => review.id !== uid));
      this.message.set('Your review was deleted.');
      void this.service.summary().then((summary) => this.summary.set(summary)).catch(() => undefined);
    } catch (error) {
      this.logger.error('HomeReviews', 'Could not delete the review.', error);
      this.formError.set('Your review could not be deleted. Try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

/** "Amara Kone" → "Amara K." (people can change it before sending). */
function defaultName(first: string | undefined, last: string | undefined, fallback: string | undefined): string {
  const firstName = (first ?? '').trim();
  const lastInitial = (last ?? '').trim().charAt(0);
  if (firstName) return lastInitial ? `${firstName} ${lastInitial.toUpperCase()}.` : firstName;
  return (fallback ?? '').trim().slice(0, REVIEW_LIMITS.name);
}

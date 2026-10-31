import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { TestQuestionService } from '../../services/test-question.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
interface FavoriteQuiz {
  id: string;
  title: string;
  slug: string;
  description?: string;
  questionCount?: number;
  courseName?: string;
}

interface StoredPracticeFavorites {
  courses?: string[];
  certifications?: string[];
  quizzes?: FavoriteQuiz[];
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-test-center-home',

  standalone: true,

  imports: [
    TranslatePipe,RouterLink, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule],

  template: `
    <main class="min-h-screen bg-gray-50 mt-16">
      <!-- ===================================================
           SITE HEADER
           =================================================== -->

      <header
        class="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 shadow-md"
      >
        <div
          class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6 lg:px-8"
        >
          <!-- Left: Test Center branding -->
          <div class="flex min-w-0 shrink-0 items-center gap-3 text-white">
            <a
              [routerLink]="['/partner/org', organizationId(), 'dashboard']"
              class="flex min-w-0 shrink-0 items-center gap-3 rounded-lg text-white transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              [attr.aria-label]="'Back to organization dashboard' | t"
              [title]="'Back to organization dashboard' | t"
            >
              <div
                class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:flex"
                aria-hidden="true"
              >
                <mat-icon class="!h-8 !w-8 !text-3xl">arrow_back</mat-icon>
              </div>
            </a>

            <span class="text-base font-bold tracking-tight sm:text-xl">
              {{ 'Learning & assessment' | t }}
            </span>
          </div>

          <!-- Right: Search bar (white, compact) -->
          <div class="min-w-0 flex-1 md:ml-8">
            <div class="relative ml-auto w-full max-w-xs">
              <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !h-5 !w-5 !text-[20px] !text-[#007979]" aria-hidden="true">search</mat-icon>
              <input
                id="test-center-search"
                type="search"
                autocomplete="off"
                class="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/40"
                [value]="searchTerm()"
                (input)="searchTerm.set($any($event.target).value)"
                [placeholder]="'Search Test Center' | t"
                [attr.aria-label]="'Search Test Center' | t"
              />
              @if (searchTerm()) {
                <button
                  type="button"
                  class="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                  [attr.aria-label]="'Clear search' | t"
                  (click)="searchTerm.set('')"
                >
                  <mat-icon class="!h-4 !w-4 !text-[16px]">close</mat-icon>
                </button>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- ===================================================
           MAIN CONTENT
           =================================================== -->

      <section class="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8">
        <!-- =================================================
             BROWSE
             ================================================= -->

        <div>
          <div class="mb-4">
            <h2 class="text-xl font-bold text-[#032D42]">
              {{ 'Browse the Test Center' | t }}
            </h2>

            <p class="mt-1 text-sm text-gray-600">
              {{ 'Find practice material based on what you\\u0027re learning.' | t }}
            </p>
          </div>

          <div class="grid grid-cols-4 gap-2 sm:gap-3">
            <!-- Certifications -->
            <a
              routerLink="/test-center/certifications"
              class="group rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
            >
              <div
                class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
              >
                <mat-icon aria-hidden="true"> workspace_premium </mat-icon>
              </div>

              <h3
                class="mt-1 text-[16px] text-center leading-tight sm:mt-2 sm:text-md font-bold text-[#032D42]"
              >
                {{ 'Certifications' | t }}
              </h3>

              <p class="hidden sm:block mt-1 text-xs leading-5 text-gray-600">
                {{ 'Prepare for professional certification exams.' | t }}
              </p>
            </a>

            <!-- Courses -->
            <a
              [routerLink]="[learnerBaseRoute(), 'courses']"
              class="group rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
            >
              <div
                class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
              >
                <mat-icon aria-hidden="true"> menu_book </mat-icon>
              </div>

              <h3
                class="mt-1 text-[16px] text-center leading-tight sm:mt-2 sm:text-md font-bold text-[#032D42]"
              >
                {{ 'Courses' | t }}
              </h3>

              <p class="hidden sm:block mt-1 text-xs leading-5 text-gray-600">
                {{ 'Practice what you\\u0027re learning in a course or program.' | t }}
              </p>
            </a>

            <!-- Quizzes -->
            <a
              [routerLink]="[learnerBaseRoute(), 'quizzes']"
              class="group rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
            >
              <div
                class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
              >
                <mat-icon aria-hidden="true">quiz</mat-icon>
              </div>

              <h3
                class="mt-1 text-[16px] text-center leading-tight sm:mt-2 sm:text-md font-bold text-[#032D42]"
              >
                {{ 'Quizzes' | t }}
              </h3>

              <p class="hidden sm:block mt-1 text-xs leading-5 text-gray-600">
                {{ 'Explore quizzes across your programs and courses.' | t }}
              </p>
            </a>

            <!-- Skills -->
            <a
              routerLink="/test-center/skills"
              class="group rounded-xl border border-gray-200 bg-white p-2 sm:p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
            >
              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
              >
                <mat-icon aria-hidden="true"> psychology </mat-icon>
              </div>

              <h3
                class="mt-1 text-[16px] text-center leading-tight sm:mt-2 sm:text-md font-bold text-[#032D42]"
              >
                {{ 'Skills' | t }}
              </h3>

              <p class="hidden sm:block mt-1 text-xs leading-5 text-gray-600">
                {{ 'Strengthen practical and professional skills.' | t }}
              </p>
            </a>
          </div>
        </div>

        <!-- =================================================
             POPULAR PRACTICE
             ================================================= -->

        <div class="mt-8">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-[#032D42]">
                {{ 'Popular Practice' | t }}
              </h2>

              <p class="mt-1 text-sm text-gray-600">
                {{ 'Your saved quizzes, courses, and certifications—plus more practice to explore.' | t }}
              </p>
            </div>

            <a
              [routerLink]="[learnerBaseRoute(), 'quizzes']"
              class="text-sm font-semibold text-[#007979] transition hover:text-[#032D42]"
            >
              {{ 'View all →' | t }}
            </a>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              @for (item of [1, 2, 3]; track item) {
                <div
                  class="animate-pulse rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div class="h-10 w-10 rounded-lg bg-gray-200"></div>
                  <div class="mt-4 h-4 w-2/3 rounded bg-gray-200"></div>
                  <div class="mt-2 h-3 w-1/3 rounded bg-gray-200"></div>
                  <div class="mt-4 h-3 w-full rounded bg-gray-200"></div>
                  <div class="mt-2 h-3 w-5/6 rounded bg-gray-200"></div>
                </div>
              }
            </div>
          }

          <!-- Error -->
          @if (!loading() && error()) {
            <div
              class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {{ error() | t }}
            </div>
          }

          <!-- Content -->
          @if (!loading() && !error()) {
            <!-- Favorite quizzes -->
            @if (favoriteQuizzes().length > 0) {
              <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                @for (quiz of favoriteQuizzes(); track quiz.id) {
                  <button
                    type="button"
                    (click)="startQuiz(quiz)"
                    class="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
                      >
                        <mat-icon aria-hidden="true">quiz</mat-icon>
                      </div>
                      <span
                        class="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700"
                      >
                        {{ 'Favorite quiz' | t }}
                      </span>
                    </div>
                    <h3
                      class="mt-3 text-base font-bold leading-5 text-[#032D42] group-hover:text-[#007979]"
                    >
                      {{ quiz.title }}
                    </h3>
                    @if (quiz.courseName) {
                      <p class="mt-1 text-xs font-medium text-[#007979]">
                        {{ quiz.courseName }}
                      </p>
                    }
                    <p class="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
                      {{ quiz.description || ('Continue practicing with this saved quiz.' | t) }}
                    </p>
                    <div
                      class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3"
                    >
                      <span class="text-xs text-gray-500">
                        {{ '{0} questions' | t: [quizQuestionCount(quiz)] }}
                      </span>
                      <span class="text-xs font-semibold text-[#007979]">
                        {{ 'Practice →' | t }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            }

            <!-- Courses & certifications -->
            @if (popularCourses().length > 0) {
              <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                @for (course of popularCourses(); track course.id) {
                  <a
                    [routerLink]="practiceRoute(course)"
                    class="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#12BFC3] hover:bg-[#E5F4F4] hover:shadow-md"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
                      >
                        <mat-icon aria-hidden="true"> school </mat-icon>
                      </div>

                      @if (course.type === 'certification') {
                        <span
                          class="rounded-full bg-[#E5F4F4] px-2 py-1 text-[10px] font-semibold text-[#007979]"
                        >
                          {{ 'Certification' | t }}
                        </span>
                      }
                    </div>

                    <h3
                      class="mt-3 text-base font-bold leading-5 text-[#032D42] group-hover:text-[#007979]"
                    >
                      {{ course.name }}
                    </h3>

                    @if (course.provider) {
                      <p class="mt-1 text-xs font-medium text-[#007979]">
                        {{ course.provider }}
                      </p>
                    }

                    <p class="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">
                      {{ course.description | t }}
                    </p>

                    <div
                      class="mt-4 flex items-center justify-between border-t border-gray-100 pt-3"
                    >
                      <span class="text-xs text-gray-500">
                        {{ '{0} questions' | t: [courseQuestionCount(course)] }}
                      </span>

                      <span class="text-xs font-semibold text-[#007979]">
                        {{ 'Practice →' | t }}
                      </span>
                    </div>
                  </a>
                }
              </div>
            }

            <!-- Empty state: only when there is nothing at all to show -->
            @if (favoriteQuizzes().length === 0 && popularCourses().length === 0) {
              <div
                class="mt-4 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center"
              >
                <div
                  class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E5F4F4] text-[#007979]"
                >
                  <mat-icon aria-hidden="true"> search_off </mat-icon>
                </div>

                <h3 class="mt-3 text-sm font-bold text-[#032D42]">
                  {{ 'No practice items found' | t }}
                </h3>

                <p class="mt-1 text-xs text-gray-600">
                  {{ 'Try another course, certification, quiz, or topic.' | t }}
                </p>
              </div>
            }
          }
        </div>
      </section>
    </main>
  `,

  styles: [],
})
export class TestCenterHomeComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
private readonly questionService = inject(TestQuestionService); // add

  readonly courses = signal<Quiz[]>([]);
  readonly favoriteQuizIds = signal<string[]>([]);
  readonly favoriteCertificationIds = signal<string[]>([]);
  readonly favoriteQuizzes = signal<FavoriteQuiz[]>([]);
  readonly questionCounts = signal<Record<string, number>>({}); // add
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly organizationId = computed(
  () =>
    this.route.snapshot.paramMap.get('organizationId') ??
    this.route.parent?.snapshot.paramMap.get('organizationId') ??
    null,
);

  readonly learnerBaseRoute = computed(() => {
    const organizationId = this.organizationId();
    return organizationId
      ? `/partner/org/${organizationId}/learn/test-center`
      : '/test-center';
  });

  readonly filteredCourses = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) return this.courses();

    return this.courses().filter((course) =>
      [
        course.name,
        course.description,
        course.provider ?? '',
        course.certificationCode ?? '',
      ].some((value) => value.toLowerCase().includes(search)),
    );
  });

  readonly popularCourses = computed(() => {
    const courseFavorites = new Set(this.favoriteQuizIds());
    const certificationFavorites = new Set(this.favoriteCertificationIds());
    const filtered = this.filteredCourses();

    // Show the learner's saved courses and certifications together.
    const saved = filtered.filter((course) =>
      course.type === 'certification'
        ? certificationFavorites.has(course.id) || courseFavorites.has(course.id)
        : courseFavorites.has(course.id),
    );

    // Preserve discovery behavior when the learner has not saved anything,
    // or when saved IDs no longer match available courses.
    return saved.length > 0 ? saved : filtered;
  });

  private favoriteStorageKey(organizationId: string | null): string {
    return `zebron:test-center:favorites:${organizationId?.trim() || 'platform'}`;
  }

  private favoriteQuizStorageKey(organizationId: string | null): string {
    return `zebron:test-center:favorite-quizzes:${organizationId?.trim() || 'platform'}`;
  }

  private parseStringIds(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : [];
  }

  private loadFavorites(organizationId: string | null): void {
    this.favoriteQuizIds.set([]);
    this.favoriteCertificationIds.set([]);
    this.favoriteQuizzes.set([]);

    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(this.favoriteStorageKey(organizationId));
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      // Backward compatibility: the original favorites value was string[].
      if (Array.isArray(parsed)) {
        this.favoriteQuizIds.set(this.parseStringIds(parsed));
      } else if (parsed && typeof parsed === 'object') {
        const favorites = parsed as StoredPracticeFavorites;
        this.favoriteQuizIds.set(this.parseStringIds(favorites.courses));
        this.favoriteCertificationIds.set(
          this.parseStringIds(favorites.certifications),
        );
        this.favoriteQuizzes.set(this.normalizeFavoriteQuizzes(favorites.quizzes));
      }

      // Also support quiz favorites saved separately by the quiz library.
      const quizRaw = localStorage.getItem(this.favoriteQuizStorageKey(organizationId));
      if (quizRaw) {
        const quizParsed: unknown = JSON.parse(quizRaw);
        const separateQuizzes = this.normalizeFavoriteQuizzes(quizParsed);
        const merged = new Map<string, FavoriteQuiz>();
        [...this.favoriteQuizzes(), ...separateQuizzes].forEach((quiz) =>
          merged.set(quiz.id || quiz.slug, quiz),
        );
        this.favoriteQuizzes.set([...merged.values()]);
      }
    } catch (error) {
      console.warn('Unable to read Popular Practice favorites:', error);
    }
  }

  private normalizeFavoriteQuizzes(value: unknown): FavoriteQuiz[] {
    if (!Array.isArray(value)) return [];

    return value
      .filter((item): item is FavoriteQuiz => {
        if (!item || typeof item !== 'object') return false;
        const quiz = item as Partial<FavoriteQuiz>;
        return (
          typeof quiz.title === 'string' &&
          typeof quiz.slug === 'string' &&
          (typeof quiz.id === 'string' || typeof quiz.slug === 'string')
        );
      })
      .map((quiz) => ({
        id: quiz.id || quiz.slug,
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description ?? '',
        questionCount: quiz.questionCount ?? 0,
        courseName: quiz.courseName ?? '',
      }));
  }

 practiceRoute(course: Quiz): string[] {
  return this.quizDetailsRoute(course.slug);
}

  /** Builds the quiz-details route for the current org / platform context. */
  private quizDetailsRoute(slug: string): string[] {
    const organizationId = this.organizationId();

    return organizationId
      ? ['/partner/org', organizationId, 'learn', 'test-center', 'quiz-details', slug]
      : ['/test-center', 'quiz-details', slug];
  }

  /** Routes to quiz-details/:slug. */
  startQuiz(quiz: Pick<FavoriteQuiz, 'slug'>): void {
    if (!quiz?.slug) {
      console.error('Cannot start quiz: missing quiz slug.', quiz);
      return;
    }

    void this.router.navigate(this.quizDetailsRoute(quiz.slug));
  }

  async ngOnInit(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set('');

      const organizationId = this.organizationId();
      this.loadFavorites(organizationId);

      const courses = await this.quizService.getAvailableQuizzes(organizationId);
      this.courses.set(courses);
      await this.loadQuestionCounts(courses, organizationId); // add

    } catch (error) {
      console.error('Failed to load Test Center practice items:', error);
      this.error.set('We could not load the practice items right now.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Live count when available, cached field as a fallback. */
courseQuestionCount(course: Quiz): number {
  return this.questionCounts()[course.id] ?? course.questionCount ?? 0;
}

/** Favorite quizzes are backed by courses, so match by course ID or slug. */
quizQuestionCount(quiz: FavoriteQuiz): number {
  const course = this.courses().find(
    (item) => item.id === quiz.id || item.slug === quiz.slug,
  );

  const live = course ? this.questionCounts()[course.id] : undefined;

  return live ?? quiz.questionCount ?? 0;
}

private async loadQuestionCounts(
  courses: Quiz[],
  organizationId: string | null,
): Promise<void> {
  const entries = await Promise.all(
    courses.map(async (course) => {
      const isPlatform = course.scope === 'platform';
      const ownerId = isPlatform ? null : organizationId?.trim() || null;

      if (!isPlatform && !ownerId) {
        return null;
      }

      try {
        const count = await this.questionService.getPublishedQuestionCount(
          ownerId,
          course.id,
          [],
          isPlatform ? 'platform' : 'organization',
        );

        return [course.id, count] as const;
      } catch (error) {
        console.warn(`Unable to load question count for "${course.id}".`, error);
        return null;
      }
    }),
  );

  this.questionCounts.set(
    Object.fromEntries(
      entries.filter((entry): entry is readonly [string, number] => entry !== null),
    ),
  );
}
}
 
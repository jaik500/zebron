import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../models/quiz.model';
import { TestTopicService } from '../../services/test-topic.service';
import { TestQuestionService } from '../../services/test-question.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type QuizStatus = 'Available' | 'In progress' | 'Completed';

interface QuizListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  topicCount: number;
  timeLimitMinutes: number;
  status: QuizStatus;
  isFavorite: boolean;
  score?: number;
  progress?: number;
  tags: string[];
  provider?: string;
  type?: string;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [
    TranslatePipe,CommonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <main class="mt-14 min-h-screen bg-slate-50">

      <!-- Page header: search and filters -->
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div class="min-w-0 lg:shrink-0">
              <h1 class="truncate text-lg font-semibold">{{ 'Quiz library' | t }}</h1>
              <p class="hidden truncate text-xs text-white/80 sm:block">
                {{ 'Practice by topic and track your progress.' | t }}
              </p>
            </div>

            <div
              class="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_160px_160px_auto] lg:ml-auto lg:max-w-4xl"
            >
              <!-- Search -->
              <mat-form-field
                appearance="outline"
                class="zb-field zb-field--flush zb-search col-span-2 sm:col-span-1"
                subscriptSizing="dynamic"
              >
                <mat-label>{{ 'Search quizzes' | t }}</mat-label>
                <mat-icon matPrefix aria-hidden="true">search</mat-icon>
                <input
                  matInput
                  type="search"
                  autocomplete="off"
                  [value]="searchTerm()"
                  (input)="setSearchTerm($any($event.target).value)"
                  [placeholder]="'Search quizzes...' | t"
                />
                @if (searchTerm()) {
                  <button
                    matSuffix
                    type="button"
                    (click)="setSearchTerm('')"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    [attr.aria-label]="'Clear search' | t"
                    [title]="'Clear search' | t"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </mat-form-field>

              <!-- Difficulty -->
              <mat-form-field
                appearance="outline"
                class="zb-field zb-field--flush zb-search"
                subscriptSizing="dynamic"
              >
                <mat-label>{{ 'Difficulty' | t }}</mat-label>
                <mat-select
                  [value]="difficultyFilter()"
                  (selectionChange)="setDifficultyFilter($event.value)"
                >
                  <mat-option value="All">{{ 'All difficulties' | t }}</mat-option>
                  @for (difficulty of availableDifficulties(); track difficulty) {
                    <mat-option [value]="difficulty">{{ difficulty | t }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <!-- Status -->
              <mat-form-field
                appearance="outline"
                class="zb-field zb-field--flush zb-search"
                subscriptSizing="dynamic"
              >
                <mat-label>{{ 'Status' | t }}</mat-label>
                <mat-select
                  [value]="statusFilter()"
                  (selectionChange)="setStatusFilter($event.value)"
                >
                  <mat-option value="All">{{ 'All statuses' | t }}</mat-option>
                  <mat-option value="Available">{{ 'Available' | t }}</mat-option>
                  <mat-option value="In progress">{{ 'In progress' | t }}</mat-option>
                  <mat-option value="Completed">{{ 'Completed' | t }}</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                type="button"
                (click)="clearFilters()"
                [disabled]="!hasActiveFilters()"
                class="col-span-2 h-10 rounded-lg border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent sm:col-span-1"
              >
                {{ 'Clear' | t }}
              </button>
            </div>
          </div>

          <!-- Categories and result count -->
          <div class="mt-3 flex items-center gap-3 border-t border-white/15 pt-2.5">
            <div
              class="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
              role="group"
              [attr.aria-label]="'Filter by category' | t"
            >
              @for (category of categories(); track category) {
                <button
                  type="button"
                  (click)="setCategoryFilter(category)"
                  class="shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
                  [ngClass]="
                    categoryFilter() === category
                      ? 'bg-white text-[#007979] shadow-sm'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white'
                  "
                  [attr.aria-pressed]="categoryFilter() === category"
                >
                  {{ category | t }}
                </button>
              }
            </div>

            @if (!loading() && !error()) {
              <p class="shrink-0 text-xs text-white/80" aria-live="polite">
                <span class="font-semibold text-white">{{ filteredQuizzes().length }}</span>
                {{ filteredQuizzes().length === 1 ? ('quiz' | t) : ('quizzes' | t) }}
              </p>
            }
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

        <!-- Loading state -->
        @if (loading()) {
          <section
            class="grid grid-cols-1 gap-5 lg:grid-cols-2"
            [attr.aria-label]="'Loading quizzes' | t"
            aria-busy="true"
          >
            @for (item of [1, 2, 3, 4]; track item) {
              <article
                class="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div class="h-2 w-full rounded bg-slate-200"></div>
                <div class="mt-5 h-5 w-2/3 rounded bg-slate-200"></div>
                <div class="mt-3 h-3 w-full rounded bg-slate-100"></div>
                <div class="mt-2 h-3 w-4/5 rounded bg-slate-100"></div>
                <div class="mt-6 h-16 rounded-xl bg-slate-100"></div>
                <div class="mt-5 h-11 rounded-xl bg-slate-200"></div>
              </article>
            }
          </section>
        }

        <!-- Error state -->
        @if (!loading() && error()) {
          <section
            class="rounded-2xl border border-red-200 bg-red-50 p-6"
            role="alert"
          >
            <h2 class="font-bold text-red-800">
              {{ 'Unable to load quizzes' | t }}
            </h2>

            <p class="mt-2 text-sm text-red-700">
              {{ error() | t }}
            </p>

            <button
              type="button"
              (click)="loadQuizzes()"
              class="mt-4 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {{ 'Try again' | t }}
            </button>
          </section>
        }

        @if (!loading() && !error()) {

          <!-- Summary cards -->
          <section
            class="mb-5 grid grid-cols-3 gap-2 sm:gap-3"
            [attr.aria-label]="'Quiz status summary' | t"
          >
            <button
              type="button"
              (click)="selectStatus('Available')"
              [attr.aria-pressed]="statusFilter() === 'Available'"
              class="cursor-pointer rounded-xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:p-4"
              [class.border-blue-500]="statusFilter() === 'Available'"
              [class.border-slate-200]="statusFilter() !== 'Available'"
            >
              <p class="text-md text-center font-medium text-slate-500 sm:text-md">
                {{ 'Available' | t }}
              </p>
              <p class="mt-1 text-center text-xl font-bold text-slate-900 sm:text-2xl">
                {{ availableCount() }}
              </p>
            </button>

            <button
              type="button"
              (click)="selectStatus('In progress')"
              [attr.aria-pressed]="statusFilter() === 'In progress'"
              class="cursor-pointer rounded-xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:p-4"
              [class.border-amber-500]="statusFilter() === 'In progress'"
              [class.border-slate-200]="statusFilter() !== 'In progress'"
            >
              <p class="text-md text-center font-medium text-slate-500 sm:text-md">
                {{ 'In progress' | t }}
              </p>
              <p class="mt-1 text-center text-xl font-bold text-slate-900 sm:text-2xl">
                {{ inProgressCount() }}
              </p>
            </button>

            <button
              type="button"
              (click)="selectStatus('Completed')"
              [attr.aria-pressed]="statusFilter() === 'Completed'"
              class="cursor-pointer rounded-xl border bg-white p-3 text-left shadow-sm transition hover:shadow-md sm:p-4"
              [class.border-emerald-500]="statusFilter() === 'Completed'"
              [class.border-slate-200]="statusFilter() !== 'Completed'"
            >
              <p class="text-md text-center font-medium text-slate-500 sm:text-md">
                {{ 'Completed' | t }}
              </p>
              <p class="mt-1 text-center text-xl font-bold text-slate-900 sm:text-2xl">
                {{ completedCount() }}
              </p>
            </button>
          </section>


          <!-- Quiz cards -->
          @if (filteredQuizzes().length > 0) {
            <section
              class="grid grid-cols-1 gap-5 lg:grid-cols-2"
              [attr.aria-label]="'Quiz list' | t"
            >
              @for (quiz of filteredQuizzes(); track quiz.id) {
                <article
                  class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#12BFC3] hover:shadow-md"
                >
                  <div
                    class="h-1.5"
                    [class.bg-blue-600]="quiz.difficulty === 'Beginner'"
                    [class.bg-amber-500]="quiz.difficulty === 'Intermediate'"
                    [class.bg-violet-600]="quiz.difficulty === 'Advanced'"
                    [class.bg-[#007979]]="!quiz.difficulty"
                  ></div>

                  <div class="flex flex-1 flex-col p-5 sm:p-6">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex min-w-0 items-start gap-3">
                        <div
                          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F4] text-xl text-[#007979]"
                          aria-hidden="true"
                        >
                          {{ getCategoryIcon(quiz.category) }}
                        </div>

                        <div class="min-w-0">
                          <p
                            class="text-xs font-semibold uppercase tracking-wider text-[#007979]"
                          >
                            {{ quiz.category | t }}
                          </p>

                          <h2
                            class="mt-1 text-lg font-bold text-slate-900 transition group-hover:text-[#007979]"
                          >
                            {{ quiz.title }}
                          </h2>

                          @if (quiz.provider) {
                            <p class="mt-1 text-xs font-medium text-[#007979]">
                              {{ quiz.provider }}
                            </p>
                          }
                        </div>
                      </div>

                      <div class="flex shrink-0 items-center gap-2">
                        <span
                          class="rounded-full px-3 py-1 text-xs font-semibold"
                          [class.bg-emerald-50]="quiz.status === 'Available'"
                          [class.text-emerald-700]="quiz.status === 'Available'"
                          [class.bg-amber-50]="quiz.status === 'In progress'"
                          [class.text-amber-700]="quiz.status === 'In progress'"
                          [class.bg-slate-100]="quiz.status === 'Completed'"
                          [class.text-slate-600]="quiz.status === 'Completed'"
                        >
                          {{ quiz.status | t }}
                        </span>

                        <button
                          type="button"
                          (click)="toggleFavorite(quiz)"
                          [attr.aria-pressed]="quiz.isFavorite"
                          [attr.aria-label]="(quiz.isFavorite ? 'Remove {0} from Popular Practice' : 'Add {0} to Popular Practice') | t: [quiz.title]"
                          [attr.title]="(quiz.isFavorite ? 'Remove from Popular Practice' : 'Add to Popular Practice') | t"
                          class="cursor-pointer inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-[#007979] focus:ring-offset-2"
                          [class.border-amber-300]="quiz.isFavorite"
                          [class.bg-amber-50]="quiz.isFavorite"
                          [class.text-amber-500]="quiz.isFavorite"
                          [class.border-slate-200]="!quiz.isFavorite"
                          [class.bg-white]="!quiz.isFavorite"
                          [class.text-slate-400]="!quiz.isFavorite"
                          [class.hover:border-amber-300]="!quiz.isFavorite"
                          [class.hover:bg-amber-50]="!quiz.isFavorite"
                          [class.hover:text-amber-500]="!quiz.isFavorite"
                        >
                          <svg
                            class="h-5 w-5"
                            viewBox="0 0 24 24"
                            [attr.fill]="quiz.isFavorite ? 'currentColor' : 'none'"
                            stroke="currentColor"
                            stroke-width="1.8"
                            aria-hidden="true"
                          >
                            <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01-4.36-4.25 6.03-.88L12 3Z" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p class="mt-4 text-sm leading-6 text-slate-600">
                      {{ quiz.description || ('Practice questions for this course.' | t) }}
                    </p>

                    @if (quiz.tags.length > 0) {
                      <div class="mt-4 flex flex-wrap gap-2">
                        @for (tag of quiz.tags; track tag) {
                          <span
                            class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {{ tag }}
                          </span>
                        }
                      </div>
                    }

                    <div class="mt-5 grid grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p class="text-xs text-slate-500">{{ 'Difficulty' | t }}</p>
                        <p
                          class="mt-1 text-sm font-semibold text-slate-800"
                          [class.text-emerald-700]="quiz.difficulty === 'Beginner'"
                          [class.text-amber-700]="quiz.difficulty === 'Intermediate'"
                          [class.text-violet-700]="quiz.difficulty === 'Advanced'"
                        >
                          {{ quiz.difficulty || ('Not specified' | t) }}
                        </p>
                      </div>

                      <div>
                        <p class="text-xs text-slate-500">{{ 'Topics' | t }}</p>
                        <p class="mt-1 text-sm font-semibold text-slate-800">
                          {{ quiz.topicCount }}
                        </p>
                      </div>

                      <div>
                        <p class="text-xs text-slate-500">{{ 'Questions' | t }}</p>
                        <p class="mt-1 text-sm font-semibold text-slate-800">
                          {{ quiz.questionCount }}
                        </p>
                      </div>

                      <div>
                        <p class="text-xs text-slate-500">{{ 'Time limit' | t }}</p>
                        <p class="mt-1 text-sm font-semibold text-slate-800">
                          {{ quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes + ' min' : ('Flexible' | t) }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                      <button
                        type="button"
                        (click)="startQuiz(quiz)"
                        class="cursor-pointer inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#007979] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#006666] focus:outline-none focus:ring-4 focus:ring-teal-200"
                      >
                        @if (quiz.status === 'In progress') {
                          {{ 'Continue practice' | t }} <span aria-hidden="true">→</span>
                        } @else if (quiz.status === 'Completed') {
                          {{ 'Practice again' | t }} <span aria-hidden="true">↻</span>
                        } @else {
                          {{ 'Start practice' | t }} <span aria-hidden="true">→</span>
                        }
                      </button>

                      @if (quiz.status === 'Completed') {
                        <button
                          type="button"
                          (click)="viewResults(quiz)"
                          class="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {{ 'View results' | t }}
                        </button>
                      }
                    </div>
                  </div>
                </article>
              }
            </section>
          } @else {
            <section
              class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
            >
              <div
                class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F4F4] text-2xl text-[#007979]"
                aria-hidden="true"
              >
                ⌕
              </div>

              <h2 class="mt-4 text-lg font-bold text-slate-900">
                {{ 'No quizzes found' | t }}
              </h2>

              <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {{ 'Try another search term or clear your filters to see all courses.' | t }}
              </p>

              <button
                type="button"
                (click)="clearFilters()"
                class="mt-5 rounded-xl bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#006666]"
              >
                {{ 'Clear search and filters' | t }}
              </button>
            </section>
          }
        }

        <footer
          class="mt-8 border-t border-slate-200 py-5 text-center text-xs text-slate-500"
        >
          {{ '{0} · Quiz Library' | t: [organizationName()] }}
        </footer>
      </div>
    </main>
  `,
})
export class QuizListComponent implements OnInit {
  private readonly organizationContext = inject(
    PartnerOrganizationContextService,
  );

  private readonly quizService = inject(QuizService);
  private readonly topicService = inject(TestTopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly questionService = inject(TestQuestionService);
  private readonly pageTitleService = inject(PageTitleService);

  /**
   * Platform pages (/test-center/quizzes) have no organizationId in the
   * route; they show Zebron, not the organization selected elsewhere.
   */
  private readonly isOrganizationRoute = this.route.snapshot.pathFromRoot.some(
    (snapshot) => snapshot.paramMap.has('organizationId'),
  );

  readonly organizationName = computed(() =>
    this.isOrganizationRoute
      ? this.organizationContext.organization()?.name?.trim() || 'Organization'
      : 'Zebron',
  );

  /**
   * Header title: "<Organization> Learning". An effect, so the title
   * updates when the organization finishes loading or changes.
   */
  private readonly headerTitle = effect(() => {
    this.pageTitleService.setTitle(`${this.organizationName()} Learning`);
  });

  readonly searchTerm = signal('');
  readonly difficultyFilter = signal('All');
  readonly statusFilter = signal('All');
  readonly categoryFilter = signal('All');

  readonly courses = signal<Quiz[]>([]);
  readonly favoriteQuizIds = signal<string[]>([]);
  readonly topicCounts = signal<Record<string, number>>({});
  readonly loading = signal(true);
  readonly error = signal('');
  readonly questionCounts = signal<Record<string, number>>({});

  /**
   * Normalize course records for the existing quiz-list presentation.
   *
   * Courses are the source of practice quizzes. Optional metadata is
   * read defensively so missing fields do not prevent the list rendering.
   */
  readonly quizzes = computed<QuizListItem[]>(() =>
    this.courses().map((course) => {
      const record = course as Quiz & Record<string, unknown>;

      const category =
        this.readString(record, 'category') ||
        this.readString(record, 'programName') ||
        this.readString(record, 'provider') ||
        (record.type === 'certification' ? 'Certification' : 'Course');

      const difficulty = this.normalizeDifficulty(
        this.readString(record, 'difficulty') ||
          this.readString(record, 'level'),
      );

      const tags = this.readStringArray(record, 'tags');

      const questionCount =
  this.questionCounts()[String(record.id ?? '')] ??
  this.readNumber(record, 'questionCount');

      const timeLimitMinutes =
        this.readNumber(record, 'timeLimitMinutes') ||
        this.readNumber(record, 'timeLimit');

      return {
        id: String(record.id ?? ''),
        slug: this.readString(record, 'slug') || String(record.id ?? ''),
        title: this.readString(record, 'name') || 'Untitled course',
        description: this.readString(record, 'description'),
        category,
        difficulty,
        questionCount,
        topicCount: this.topicCounts()[String(record.id ?? '')] ?? this.getEmbeddedTopicCount(record),
        timeLimitMinutes,
        status: 'Available' as QuizStatus,
        isFavorite: this.favoriteQuizIds().includes(String(record.id ?? '')),
        tags,
        provider: this.readString(record, 'provider'),
        type: this.readString(record, 'type'),
      };
    }).filter((quiz) => quiz.id.length > 0),
  );

  readonly hasActiveFilters = computed(
    () =>
      this.searchTerm().trim() !== '' ||
      this.difficultyFilter() !== 'All' ||
      this.statusFilter() !== 'All' ||
      this.categoryFilter() !== 'All',
  );

  readonly categories = computed(() => [
    'All',
    ...new Set(this.quizzes().map((quiz) => quiz.category)),
  ]);

  readonly availableDifficulties = computed(() =>
    [...new Set(
      this.quizzes()
        .map((quiz) => quiz.difficulty)
        .filter((difficulty): difficulty is QuizDifficulty => Boolean(difficulty)),
    )],
  );

  readonly filteredQuizzes = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const difficulty = this.difficultyFilter();
    const status = this.statusFilter();
    const category = this.categoryFilter();

    return this.quizzes().filter((quiz) => {
      const searchableText = [
        quiz.title,
        quiz.description,
        quiz.category,
        quiz.provider ?? '',
        ...quiz.tags,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (difficulty === 'All' || quiz.difficulty === difficulty) &&
        (status === 'All' || quiz.status === status) &&
        (category === 'All' || quiz.category === category)
      );
    });
  });

  readonly availableCount = computed(
    () => this.quizzes().filter((quiz) => quiz.status === 'Available').length,
  );

  // Learner-attempt integration can populate these statuses when available.
  readonly inProgressCount = computed(
    () => this.quizzes().filter((quiz) => quiz.status === 'In progress').length,
  );

  readonly completedCount = computed(
    () => this.quizzes().filter((quiz) => quiz.status === 'Completed').length,
  );

  readonly completionPercent = computed(() => {
    const total = this.quizzes().length;

    return total
      ? Math.round((this.completedCount() / total) * 100)
      : 0;
  });

  async ngOnInit(): Promise<void> {
    await this.loadQuizzes();
  }

  /**
   * Load the available courses for the current organization.
   * QuizService remains responsible for the Firebase query and access scope.
   */
  async loadQuizzes(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const organizationId =
        this.route.snapshot.paramMap.get('organizationId');

      this.loadFavoriteQuizIds(organizationId);

      const courses =
        await this.quizService.getAvailableQuizzes(organizationId);

      const availableCourses = courses ?? [];
      this.courses.set(availableCourses);

      // Topics live in the separate `quizTopics` collection, so the count
      // must be loaded by course ID instead of relying on a missing field
      // in the `quizzes` document.
      const resolvedTopicCounts: Record<string, number> = {};
const resolvedQuestionCounts: Record<string, number> = {};

await Promise.all(
  availableCourses.map(async (course) => {
    const quizId = String(course.id ?? '').trim();

    if (!quizId) {
      return;
    }

    const record = course as Quiz & Record<string, unknown>;
    const isPlatform = course.scope === 'platform';

    // Platform content is owned by null; organization content by the org.
    const ownerId = isPlatform ? null : organizationId?.trim() || null;
    const canQuery = isPlatform || ownerId !== null;
    const scope = isPlatform ? 'platform' : 'organization';

    const [topicCount, questionCount] = await Promise.all([
      canQuery
        ? this.topicService
            .getActiveTopics(ownerId, quizId)
            .then((topics) => topics.length)
            .catch((topicError) => {
              console.warn(`Unable to load topic count for "${quizId}".`, topicError);
              return null;
            })
        : Promise.resolve(null),

      canQuery
        ? this.questionService
            .getPublishedQuestionCount(ownerId, quizId, [], scope)
            .catch((questionError) => {
              console.warn(`Unable to load question count for "${quizId}".`, questionError);
              return null;
            })
        : Promise.resolve(null),
    ]);

    resolvedTopicCounts[quizId] =
      topicCount ?? this.getEmbeddedTopicCount(record);

    if (questionCount !== null) {
      resolvedQuestionCounts[quizId] = questionCount;
    }
  }),
);

this.topicCounts.set(resolvedTopicCounts);
this.questionCounts.set(resolvedQuestionCounts);
    } catch (error) {
      console.error('Failed to load Test Center quizzes:', error);

      this.courses.set([]);
      this.error.set(
        'We could not load the available courses right now. Please try again.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Toggle a course's learner-specific Popular Practice favorite.
   *
   * Favorites are stored per organization in browser storage so the quiz
   * list and Learning & Assessment dashboard can read the same selection.
   */
  toggleFavorite(quiz: QuizListItem): void {
    const favorites = new Set(this.favoriteQuizIds());

    if (favorites.has(quiz.id)) {
      favorites.delete(quiz.id);
    } else {
      favorites.add(quiz.id);
    }

    const nextFavorites = [...favorites];
    this.favoriteQuizIds.set(nextFavorites);
    this.persistFavoriteQuizIds(nextFavorites);
  }

  private favoriteStorageKey(organizationId: string | null): string {
    return `zebron:test-center:favorites:${organizationId?.trim() || 'platform'}`;
  }

  private loadFavoriteQuizIds(organizationId: string | null): void {
    if (typeof localStorage === 'undefined') {
      this.favoriteQuizIds.set([]);
      return;
    }

    try {
      const stored = localStorage.getItem(this.favoriteStorageKey(organizationId));
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      this.favoriteQuizIds.set(
        Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string')
          : [],
      );
    } catch (error) {
      console.warn('Unable to read Popular Practice favorites:', error);
      this.favoriteQuizIds.set([]);
    }
  }

  private persistFavoriteQuizIds(quizIds: string[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(
        this.favoriteStorageKey(this.route.snapshot.paramMap.get('organizationId')),
        JSON.stringify(quizIds),
      );
    } catch (error) {
      console.warn('Unable to save Popular Practice favorites:', error);
    }
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setDifficultyFilter(value: string): void {
    this.difficultyFilter.set(value);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  selectStatus(status: QuizStatus): void {
    this.statusFilter.set(
      this.statusFilter() === status ? 'All' : status,
    );
  }

  setCategoryFilter(value: string): void {
    this.categoryFilter.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.difficultyFilter.set('All');
    this.statusFilter.set('All');
    this.categoryFilter.set('All');
  }

  getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'cybersecurity':
        return '⌘';
      case 'cloud':
        return '☁';
      case 'programming':
        return '</>';
      case 'certification':
        return '★';
      default:
        return '▤';
    }
  }

  /**
   * Navigate using the organization-scoped learner route when an
   * organization ID is present; otherwise use the standard Test Center.
   */
 startQuiz(quiz: QuizListItem): void {
  const baseRoute = this.learnerBaseRoute();

  void this.router.navigate([
    baseRoute,
    'quiz-details',
    quiz.slug,
  ]);
}

  viewResults(quiz: QuizListItem): void {
    const baseRoute = this.learnerBaseRoute();

    void this.router.navigate([
      baseRoute,
      'courses',
      quiz.slug,
    ]);
  }

  private learnerBaseRoute(): string {
    const organizationId =
      this.route.snapshot.paramMap.get('organizationId');

    return organizationId
      ? `/partner/org/${organizationId}/learn/test-center`
      : '/test-center';
  }

  /**
   * Fallback for platform courses or when topic metadata is already
   * embedded in a course document. Organization course counts are
   * normally retrieved from the `quizTopics` collection.
   */
  private getEmbeddedTopicCount(
    record: Record<string, unknown>,
  ): number {
    const explicitCount =
      this.readNumber(record, 'topicCount') ||
      this.readNumber(record, 'topicsCount') ||
      this.readNumber(record, 'totalTopics');

    if (explicitCount > 0) {
      return explicitCount;
    }

    const topics = record['topics'];

    return Array.isArray(topics) ? topics.length : 0;
  }

  private readString(
    record: Record<string, unknown>,
    key: string,
  ): string {
    const value = record[key];

    return typeof value === 'string' ? value.trim() : '';
  }

  private readNumber(
    record: Record<string, unknown>,
    key: string,
  ): number {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, value);
    }

    return 0;
  }

  private readStringArray(
    record: Record<string, unknown>,
    key: string,
  ): string[] {
    const value = record[key];

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0,
    );
  }

  private normalizeDifficulty(value: string): QuizDifficulty {
    switch (value.trim().toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'Beginner';

      case 'intermediate':
      case 'medium':
        return 'Intermediate';

      case 'advanced':
      case 'hard':
        return 'Advanced';

      default:
        return 'Beginner';
    }
  }
}


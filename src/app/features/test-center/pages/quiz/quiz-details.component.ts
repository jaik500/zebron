import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TestCourse } from '../../models/test-course.model';
import { TestCourseService } from '../../services/test-course.service';
import { TestStore } from '../../store/test.store';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { TestQuestionService } from '../../services/test-question.service';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-quiz-details',

  standalone: true,

  imports: [
    TranslatePipe,RouterLink, MatIconModule],

  template: `
    <main class="min-h-screen bg-gray-50 mt-16">
      <!-- ===================================================
           HEADER
           =================================================== -->

   

      <!-- ===================================================
           LOADING QUIZ DETAILS
           =================================================== -->

      @if (loading()) {
        <section class="mx-auto max-w-5xl px-5 py-8 text-center sm:px-6 lg:px-8">
          <div
            class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#E5F4F4] border-t-[#007979]"
            [attr.aria-label]="'Loading' | t"
          ></div>

          <p class="mt-3 text-sm text-gray-500">{{ 'Loading quiz details...' | t }}</p>
        </section>
      }

      <!-- ===================================================
           QUIZ DETAILS ERROR
           =================================================== -->

      @if (!loading() && error()) {
        <section class="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <div
              class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600"
            >
              <mat-icon aria-hidden="true"> error_outline </mat-icon>
            </div>

            <h1 class="mt-3 text-lg font-bold text-gray-900">{{ 'Quiz not found' | t }}</h1>

            <p class="mt-1 text-sm text-gray-600">
              {{ error() | t }}
            </p>

            <a
              [routerLink]="learnerBaseRoute()"
              class="mt-4 inline-flex rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#006666]"
            >
              {{ 'Back to Test Center' | t }}
            </a>
          </div>
        </section>
      }

      <!-- ===================================================
           QUIZ DETAILS CONTENT
           =================================================== -->

      @if (!loading() && !error() && course()) {
        <!-- ================================================
             QUIZ DETAILS HERO
             ================================================ -->

       <section
  class="border-b border-white/10 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 px-5 py-3 text-white shadow-md sm:px-6 sm:py-5 lg:px-8"
>
  <div class="mx-auto max-w-5xl">

    <!-- Back to Quiz List -->
    <a
      [routerLink]="[learnerBaseRoute(), 'quizzes']"
      class="inline-flex items-center gap-1 text-sm font-semibold text-white/75 transition hover:text-white"
    >
      {{ '← Quiz List' | t }}
    </a>

    <!-- Course Details and Question Count -->
    <div
      class="mt-4 flex flex-row items-start justify-between gap-3 sm:mt-5 sm:gap-6"
    >

      <!-- Course Information: Left -->
      <div class="min-w-0 flex-1">

        <!-- Course Type and Certification -->
        <div class="flex flex-wrap items-center gap-2">

          <span
            class="rounded-full bg-[#12BFC3]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7DD3D3]"
          >
            {{ course()!.type | t }}
          </span>

          @if (course()!.certificationCode) {
            <span
              class="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white/80"
            >
              {{ course()!.certificationCode }}
            </span>
          }

        </div>

        <!-- Course Title -->
        <h1
          class="mt-2 break-words text-xl font-bold leading-tight tracking-tight sm:text-3xl"
        >
          {{ course()!.name }}
        </h1>

        <!-- Provider -->
        @if (course()!.provider) {
          <p
            class="mt-1 break-words text-sm font-medium text-[#7DD3D3]"
          >
            {{ course()!.provider }}
          </p>
        }

        <!-- Description -->
        @if (course()!.description) {
          <p
            class="mt-2 max-w-2xl break-words text-xs leading-5 text-white/70 sm:mt-3 sm:text-base sm:leading-6"
          >
            {{ course()!.description | t }}
          </p>
        }

      </div>

      <!-- Question Count: Right -->
      <div
        class="w-20 shrink-0 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center sm:w-auto sm:min-w-40 sm:px-5 sm:py-4"
      >
        <p class="text-2xl font-bold leading-tight text-white sm:text-3xl">
          {{ courseQuestionCount() ?? course()!.questionCount }}
        </p>

        <p class="mt-1 text-[10px] text-white/65 sm:text-xs">
          {{ 'questions' | t }}
        </p>
      </div>

    </div>
  </div>
</section>

        <!-- ================================================
             TOPIC SELECTION
             ================================================ -->

        <section class="mx-auto max-w-5xl px-5 py-7 sm:px-6 lg:px-8">
          <div class="grid gap-7 lg:grid-cols-[1fr_280px]">
            <!-- ============================================
                 TOPICS
                 ============================================ -->

            <div>
              <div>
                <h2 class="text-xl font-bold text-[#032D42]">{{ 'Choose quiz topics' | t }}</h2>

                <p class="mt-1 text-sm text-gray-600">
                  {{ 'Choose the topics to include in this quiz. You can select one or several topics.' | t }}
                </p>
              </div>

              <!-- SELECT ALL -->
              @if (topics().length > 0) {
                <div
                  class="mt-4 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div>
                    <p class="text-sm font-semibold text-[#032D42]">{{ 'Select all topics' | t }}</p>

                    <p class="text-xs text-gray-500">{{ 'Include every topic in this quiz.' | t }}</p>
                  </div>

                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-[#007979] px-3 py-1.5 text-xs font-semibold text-[#007979] transition hover:bg-[#E5F4F4]"
                    (click)="toggleAllTopics()"
                  >
                    {{ allTopicsSelected() ? ('Clear all' | t) : ('Select all' | t) }}
                  </button>
                </div>
              }

              <!-- TOPIC LOADING -->
              @if (topicsLoading()) {
                <div class="mt-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <div
                    class="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-[#E5F4F4] border-t-[#007979]"
                    [attr.aria-label]="'Loading topics' | t"
                  ></div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Loading topics...' | t }}</p>
                </div>
              }

              <!-- TOPIC ERROR -->
              @if (!topicsLoading() && topicsError()) {
                <div
                  class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {{ topicsError() | t }}
                </div>
              }

              <!-- TOPIC LIST -->
              @if (!topicsLoading() && !topicsError() && topics().length > 0) {
                <div class="mt-4 space-y-2.5">
                  @for (topic of topics(); track topic.id) {
                    <button
                      type="button"
                      class="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200"
                      [class.border-[#12BFC3]]="isSelected(topic.id)"
                      [class.bg-[#E5F4F4]]="isSelected(topic.id)"
                      [class.border-gray-200]="!isSelected(topic.id)"
                      [class.bg-white]="!isSelected(topic.id)"
                      [class.hover:border-[#12BFC3]]="!isSelected(topic.id)"
                      [class.hover:bg-[#E5F4F4]]="!isSelected(topic.id)"
                      (click)="toggleTopic(topic.id)"
                    >
                      <!-- Selection indicator -->
                      <span
                        class="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
                        [class.border-[#007979]]="isSelected(topic.id)"
                        [class.bg-[#007979]]="isSelected(topic.id)"
                        [class.border-gray-300]="!isSelected(topic.id)"
                      >
                        @if (isSelected(topic.id)) {
                          <mat-icon
                            class="!h-4 !w-4 !text-base !leading-4 !text-white"
                            aria-hidden="true"
                          >
                            check
                          </mat-icon>
                        }
                      </span>

                      <!-- Topic -->
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-bold text-[#032D42]">
                          {{ topic.name }}
                        </span>

                        @if (topic.description) {
                          <span class="mt-0.5 block text-xs leading-5 text-gray-600">
                            {{ topic.description | t }}
                          </span>
                        }
                      </span>

                      <!-- Question count -->
                      <span class="shrink-0 text-xs font-medium text-gray-500">
                        {{ '{0} questions' | t: [topicQuestionCountFor(topic)] }}
                      </span>
                    </button>
                  }
                </div>
              }

              <!-- NO TOPICS -->
              @if (!topicsLoading() && !topicsError() && topics().length === 0) {
                <div
                  class="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center"
                >
                  <div
                    class="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E5F4F4] text-[#007979]"
                  >
                    <mat-icon aria-hidden="true"> topic </mat-icon>
                  </div>

                  <h3 class="mt-3 text-sm font-bold text-[#032D42]">
                    {{ 'Quiz topics are not available yet' | t }}
                  </h3>

                  <p class="mt-1 text-xs text-gray-600">
                    {{ 'Topics for this quiz haven\\u0027t been published yet.' | t }}
                  </p>
                </div>
              }
            </div>

            <!-- ============================================
                 PRACTICE SUMMARY
                 ============================================ -->

            <aside>
              <div class="sticky top-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5F4F4] text-[#007979]"
                >
                  <mat-icon aria-hidden="true"> quiz </mat-icon>
                </div>

                <h2 class="mt-3 text-base font-bold text-[#032D42]">{{ 'Quiz setup' | t }}</h2>

                <dl class="mt-4 space-y-3">
                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-sm text-gray-600">{{ 'Topics' | t }}</dt>

                    <dd class="text-sm font-bold text-[#032D42]">
                      {{ selectedTopicCount() }}
                    </dd>
                  </div>

                  <div class="flex items-center justify-between gap-4">
                    <dt class="text-sm text-gray-600">{{ 'Questions' | t }}</dt>

                    <dd class="text-sm font-bold text-[#032D42]">
                      {{ selectedQuestionCount() }}
                    </dd>
                  </div>
                </dl>

                <div class="my-4 border-t border-gray-100"></div>

                <p class="text-xs leading-5 text-gray-500">
                  {{ 'Select the topics you want in this quiz. You can configure the number and difficulty of questions next.' | t }}
                </p>

                <button
                  type="button"
                  class="mt-5 w-full rounded-lg bg-[#007979] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:bg-gray-300"
                  [disabled]="selectedTopicCount() === 0"
                  (click)="continueToSetup()"
                >
                  {{ 'Continue →' | t }}
                </button>

                @if (selectedTopicCount() === 0) {
                  <p class="mt-2 text-center text-[11px] text-gray-500">
                    {{ 'Select at least one topic' | t }}
                  </p>
                }
              </div>
            </aside>
          </div>
        </section>
      }
    </main>
  `,

  styles: [],
})
export class QuizDetailsComponent implements OnInit {
  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly courseService = inject(TestCourseService);

  private readonly organizationContext = inject(OrganizationContextService);

  private readonly testStore = inject(TestStore);

  private readonly questionService = inject(TestQuestionService); // add

  // =====================================================
  // QUIZ DETAILS STATE
  // =====================================================

  readonly course = signal<TestCourse | null>(null);

  readonly loading = signal(true);

  readonly error = signal('');

  /** Real published-question counts. null until loaded. */
  readonly courseQuestionCount = signal<number | null>(null);

  readonly topicQuestionCounts = signal<Record<string, number>>({});

  // =====================================================
  // TEST STORE STATE
  // =====================================================

  /** Topics are owned by TestStore. */
  readonly topics = this.testStore.topics;

  /** Selected topics are also owned by TestStore. */
  readonly selectedTopics = this.testStore.selectedTopicIds;

  /** Topic loading/error state is owned by TestStore. */
  readonly topicsLoading = this.testStore.loading;

  readonly topicsError = this.testStore.error;

  // =====================================================
  // DERIVED STATE
  // =====================================================

  readonly selectedTopicCount = computed(() => this.selectedTopics().length);

  readonly selectedQuestionCount = this.testStore.selectedTopicQuestionCount;

  readonly allTopicsSelected = computed(() => {
    const topics = this.topics();

    const selected = this.selectedTopics();

    return topics.length > 0 && topics.every((topic) => selected.includes(topic.id));
  });

  /**
   * The organization ID is on the parent route
   * (partner/org/:organizationId/learn/test-center), so this checks
   * the current route, then the parent, then the organization context.
   */
  private resolveOrganizationId(): string | null {
    return (
      this.route.snapshot.paramMap.get('organizationId') ??
      this.route.parent?.snapshot.paramMap.get('organizationId') ??
      this.organizationContext.organizationId() ??
      null
    );
  }

  readonly organizationId = computed(() => this.resolveOrganizationId());

  readonly learnerBaseRoute = computed(() => {
    const organizationId = this.organizationId();

    return organizationId ? `/partner/org/${organizationId}/learn/test-center` : '/test-center';
  });

  backToCourses(): void {
    void this.router.navigate([this.learnerBaseRoute()]);
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('The quiz could not be identified.');
      this.loading.set(false);
      return;
    }

    // Resolve the organization once, before anything else runs.
    const organizationId = this.resolveOrganizationId();

    // The store must know the organization BEFORE topics or questions load,
    // otherwise its own organizationId() can be empty on this route.
    this.testStore.setOrganizationId(organizationId);

    // Start from a clean selection so topics from a previous course
    // don't carry over into this quiz.
    this.testStore.clearTopics();

    try {
      this.loading.set(true);
      this.error.set('');

      if (!organizationId) {
        this.error.set('Please select an organization before loading Test Center topics.');
        return;
      }

      const course = await this.courseService.getCourseBySlug(organizationId, slug);

      if (!course) {
        this.error.set('The requested quiz could not be found.');
        return;
      }

      this.course.set(course);
      this.testStore.setCourse(course);

      // Pass the organization ID from the URL directly to the store.
      await this.testStore.loadTopics(course.id, organizationId);
      await this.loadQuestionCounts(course, organizationId); // add
    } catch (error) {
      console.error('Failed to load quiz details:', error);

      this.error.set('We could not load these quiz details right now.');
    } finally {
      this.loading.set(false);
    }
  }

  // =====================================================
  // TOPIC SELECTION
  // =====================================================

  toggleTopic(topicId: string): void {
    this.testStore.toggleTopic(topicId);
  }

  isSelected(topicId: string): boolean {
    return this.selectedTopics().includes(topicId);
  }

  toggleAllTopics(): void {
    if (this.allTopicsSelected()) {
      this.testStore.setTopics([]);

      return;
    }

    this.testStore.setTopics(this.topics().map((topic) => topic.id));
  }

  // =====================================================
  // CONTINUE TO SETUP
  // =====================================================

  continueToSetup(): void {
    const course = this.course();

    const topics = this.selectedTopics();

    if (!course || topics.length === 0) {
      return;
    }

    /*
     * Course and topics are already in TestStore.
     *
     * We explicitly set them here as well so that
     * the transition into Test Setup is deterministic.
     */
    this.testStore.setCourse(course);

    this.testStore.setTopics(topics);

    void this.router.navigate([this.learnerBaseRoute(), 'setup']);
  }

  /** Live count when available, cached field as a fallback. */
  topicQuestionCountFor(topic: { id: string; questionCount: number }): number {
    if (this.courseQuestionCount() === null) {
      return topic.questionCount ?? 0;
    }

    return this.topicQuestionCounts()[topic.id] ?? 0;
  }

  private async loadQuestionCounts(
    course: TestCourse,
    organizationId: string | null,
  ): Promise<void> {
    const isPlatform = course.scope === 'platform';
    const ownerId = isPlatform ? null : organizationId;

    if (!isPlatform && !ownerId) {
      return;
    }

    try {
      const questions = await this.questionService.getQuestionsForTest(
        ownerId,
        course.id,
        [],
        'mixed',
        isPlatform ? 'platform' : 'organization',
      );

      const byTopic: Record<string, number> = {};

      for (const question of questions) {
        byTopic[question.topicId] = (byTopic[question.topicId] ?? 0) + 1;
      }

      this.topicQuestionCounts.set(byTopic);
      this.courseQuestionCount.set(questions.length);
    } catch (error) {
      // Keep the cached numbers if the live count can't be loaded.
      console.warn('Unable to load live question counts:', error);
    }
  }
}

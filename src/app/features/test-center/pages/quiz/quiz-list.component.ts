import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';

type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type QuizStatus = 'Available' | 'In progress' | 'Completed';

interface QuizListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  timeLimitMinutes: number;
  status: QuizStatus;
  score?: number;
  progress?: number;
  tags: string[];
}

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="mt-12 min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <!-- Page heading -->
    
      
        <!-- Search and filters -->
        <section class="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div
            class="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_160px_160px_auto]"
          >
            <!-- Search -->
            <label class="block w-full min-w-0">
              <span class="sr-only">Search quizzes</span>

              <div
                class="group box-border flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm transition-colors duration-200 hover:border-gray-400 focus-within:border-[#007979] focus-within:ring-2 focus-within:ring-[#007979]/15 sm:px-4"
              >
                <svg
                  class="h-5 w-5 shrink-0 text-[#007979]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="m16 16 4 4"></path>
                </svg>

                <input
                  type="search"
                  autocomplete="off"
                  [value]="searchTerm()"
                  (input)="setSearchTerm($any($event.target).value)"
                  placeholder="Search quizzes..."
                  class="box-border min-h-6 w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0"
                />
              </div>
            </label>

            <!-- Difficulty filter -->
            <label class="block min-w-0">
              <span class="sr-only">Filter by difficulty</span>

              <select
                [value]="difficultyFilter()"
                (change)="setDifficultyFilter($any($event.target).value)"
                class="box-border h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-700 shadow-sm outline-none transition-colors hover:border-gray-400 focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/15"
              >
                <option value="All">All difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>

         
<!-- Status filter: hidden on mobile -->
<label class="hidden min-w-0 sm:block">
  <span class="sr-only">Filter by status</span>

  <select
    [value]="statusFilter()"
    (change)="setStatusFilter($any($event.target).value)"
    class="box-border h-12 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-700 shadow-sm outline-none transition-colors hover:border-gray-400 focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/15"
  >
    <option value="All">All statuses</option>
    <option value="Available">Available</option>
    <option value="In progress">In progress</option>
    <option value="Completed">Completed</option>
  </select>
</label>



            <!-- Clear filters -->
            <button
              type="button"
              (click)="clearFilters()"
              class="h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-[#007979] hover:bg-teal-50 hover:text-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20"
            >
              Clear
            </button>
          </div>

          <!-- Results count and category filters -->
          <div
            class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs text-slate-500">
              Showing
              <span class="font-semibold text-slate-800">
                {{ filteredQuizzes().length }}
              </span>
              {{ filteredQuizzes().length === 1 ? 'quiz' : 'quizzes' }}
            </p>

            <div class="flex flex-wrap gap-2">
              @for (category of categories(); track category) {
                <button
                  type="button"
                  (click)="setCategoryFilter(category)"
                  class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                  [class.bg-[#007979]]="categoryFilter() === category"
                  [class.text-white]="categoryFilter() === category"
                  [class.bg-slate-100]="categoryFilter() !== category"
                  [class.text-slate-600]="categoryFilter() !== category"
                  [class.hover:bg-teal-50]="categoryFilter() !== category"
                  [class.hover:text-[#007979]]="categoryFilter() !== category"
                  [attr.aria-pressed]="categoryFilter() === category"
                >
                  {{ category }}
                </button>
              }
            </div>
          </div>
        </section>

<!-- Quiz Summary Cards -->
<section
  class="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4"
  aria-label="Filter quizzes by status"
>
  <!-- Available -->
 <button
  type="button"
  (click)="selectStatus('Available')"
  [attr.aria-pressed]="statusFilter() === 'Available'"
  [attr.aria-label]="'Filter available quizzes: ' + availableCount()"
  class="min-w-0 rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:p-4"
  [ngClass]="
    statusFilter() === 'Available'
      ? 'border-blue-500 ring-2 ring-blue-100'
      : 'border-slate-200 ring-0'
  "
>
    <div class="flex min-w-0 items-center justify-between gap-1">
      <p class="min-w-0 text-md font-medium leading-tight text-slate-500 sm:text-sm">
        Available
        <span class="sm:hidden">quizzes</span>
      </p>

      <!-- Icon: hidden on mobile -->
      <span
        class="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg text-blue-700 sm:flex"
        aria-hidden="true"
      >
        ▤
      </span>
    </div>

    <p class="mt-2 text-center text-xl font-bold leading-tight text-slate-900 sm:text-left sm:text-2xl">
  {{ availableCount() }}
</p>

    <!-- Description: hidden on mobile -->
    <p class="mt-1 hidden text-md text-slate-500 sm:inline-flex">
      Ready for you to start
    </p>
  </button>

  <!-- In Progress -->


<button
  type="button"
  (click)="selectStatus('In progress')"
  [attr.aria-pressed]="statusFilter() === 'In progress'"
  [attr.aria-label]="'Filter quizzes in progress: ' + inProgressCount()"
  class="box-border min-w-0 rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:p-4"
  [class.border-amber-500]="statusFilter() === 'In progress'"
  [class.border-slate-200]="statusFilter() !== 'In progress'"
  [class.ring-2]="statusFilter() === 'In progress'"
  [class.ring-amber-100]="statusFilter() === 'In progress'"
  [class.ring-0]="statusFilter() !== 'In progress'"
>

    <div class="flex min-w-0 items-center justify-between gap-1">
      <p class="min-w-0 text-md font-medium leading-tight text-slate-500 sm:text-sm">
        In progress
      </p>

      <!-- Icon: hidden on mobile -->
      <span
        class="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-lg text-amber-700 sm:flex"
        aria-hidden="true"
      >
        ◷
      </span>
    </div>

   <p class="mt-2 text-center text-xl font-bold leading-tight text-slate-900 sm:text-left sm:text-2xl">
  {{ inProgressCount() }}
</p>

    <!-- Description: hidden on mobile -->
    <p class="mt-1 hidden text-md text-slate-500 sm:inline-flex">
      Pick up where you left off
    </p>
  </button>

  <!-- Completed -->

<button
  type="button"
  (click)="selectStatus('Completed')"
  [attr.aria-pressed]="statusFilter() === 'Completed'"
  [attr.aria-label]="'Filter completed quizzes: ' + completedCount()"
  class="box-border min-w-0 rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:p-4"
  [class.border-emerald-500]="statusFilter() === 'Completed'"
  [class.border-slate-200]="statusFilter() !== 'Completed'"
  [class.ring-2]="statusFilter() === 'Completed'"
  [class.ring-emerald-100]="statusFilter() === 'Completed'"
  [class.ring-0]="statusFilter() !== 'Completed'"
>


    <div class="flex min-w-0 items-center justify-between gap-1">
      <p class="min-w-0 text-md font-medium leading-tight text-slate-500 sm:text-sm">
        Completed
      </p>

      <!-- Icon: hidden on mobile -->
      <span
        class="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-lg text-emerald-700 sm:flex"
        aria-hidden="true"
      >
        ✓
      </span>
    </div>

    <p class="mt-2 text-center text-xl font-bold leading-tight text-slate-900 sm:text-left sm:text-2xl">
  {{ completedCount() }}
</p>

    <!-- Description: hidden on mobile -->
    <p class="mt-1 hidden text-xs text-slate-500 sm:inline-flex">
      Review previous attempts
    </p>
  </button>

  <!-- Overall Quiz Progress: hidden on mobile -->
  <div
    class="hidden min-w-0 flex-col justify-between rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm sm:flex"
    aria-label="Overall quiz progress"
  >
    <div>
      <p class="text-sm font-medium text-blue-700">
        Your quiz progress
      </p>

      <div class="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span class="text-2xl font-bold leading-tight text-blue-900">
          {{ completedCount() }}
        </span>

        <span class="text-xs text-blue-700">
          of {{ quizzes().length }} completed
        </span>
      </div>
    </div>

    <div class="mt-4">
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-blue-100"
        role="progressbar"
        [attr.aria-valuenow]="completionPercent()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="'Quiz completion: ' + completionPercent() + '%'"
      >
        <div
          class="h-full rounded-full bg-blue-600 transition-all duration-300"
          [style.width.%]="completionPercent()"
        ></div>
      </div>

      <p class="mt-2 text-xs text-blue-700">
        {{ completionPercent() }}% complete
      </p>
    </div>
  </div>
</section>

        <!-- Quiz cards -->
        @if (filteredQuizzes().length > 0) {
          <section class="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Quiz list">
            @for (quiz of filteredQuizzes(); track quiz.id) {
              <article
                class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  class="h-1.5"
                  [class.bg-blue-600]="quiz.difficulty === 'Beginner'"
                  [class.bg-amber-500]="quiz.difficulty === 'Intermediate'"
                  [class.bg-violet-600]="quiz.difficulty === 'Advanced'"
                ></div>

                <div class="flex flex-1 flex-col p-5 sm:p-6">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex min-w-0 items-start gap-3">
                      <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700"
                      >
                        {{ getCategoryIcon(quiz.category) }}
                      </div>

                      <div class="min-w-0">
                        <p class="text-xs font-semibold uppercase tracking-wider text-blue-600">
                          {{ quiz.category }}
                        </p>

                        <h2
                          class="mt-1 text-lg font-bold text-slate-900 transition group-hover:text-blue-700"
                        >
                          {{ quiz.title }}
                        </h2>
                      </div>
                    </div>

                    <span
                      class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-emerald-50]="quiz.status === 'Available'"
                      [class.text-emerald-700]="quiz.status === 'Available'"
                      [class.bg-amber-50]="quiz.status === 'In progress'"
                      [class.text-amber-700]="quiz.status === 'In progress'"
                      [class.bg-slate-100]="quiz.status === 'Completed'"
                      [class.text-slate-600]="quiz.status === 'Completed'"
                    >
                      {{ quiz.status }}
                    </span>
                  </div>

                  <p class="mt-4 text-sm leading-6 text-slate-600">
                    {{ quiz.description }}
                  </p>

                  <div class="mt-4 flex flex-wrap gap-2">
                    @for (tag of quiz.tags; track tag) {
                      <span
                        class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>

                  <div class="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p class="text-xs text-slate-500">Difficulty</p>
                      <p
                        class="mt-1 text-sm font-semibold"
                        [class.text-emerald-700]="quiz.difficulty === 'Beginner'"
                        [class.text-amber-700]="quiz.difficulty === 'Intermediate'"
                        [class.text-violet-700]="quiz.difficulty === 'Advanced'"
                      >
                        {{ quiz.difficulty }}
                      </p>
                    </div>

                    <div>
                      <p class="text-xs text-slate-500">Questions</p>
                      <p class="mt-1 text-sm font-semibold text-slate-800">
                        {{ quiz.questionCount }}
                      </p>
                    </div>

                    <div>
                      <p class="text-xs text-slate-500">Time limit</p>
                      <p class="mt-1 text-sm font-semibold text-slate-800">
                        {{ quiz.timeLimitMinutes }} min
                      </p>
                    </div>
                  </div>

                  @if (quiz.status === 'In progress') {
                    <div class="mt-4">
                      <div class="mb-2 flex items-center justify-between text-xs">
                        <span class="font-medium text-slate-500">Progress</span>
                        <span class="font-semibold text-slate-700">
                          {{ quiz.progress ?? 0 }}%
                        </span>
                      </div>

                      <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          class="h-full rounded-full bg-amber-500 transition-all"
                          [style.width.%]="quiz.progress ?? 0"
                        ></div>
                      </div>
                    </div>
                  }

                  @if (quiz.status === 'Completed' && quiz.score !== undefined) {
                    <div
                      class="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                    >
                      <span class="text-sm font-medium text-emerald-800"> Latest score </span>
                      <span class="text-lg font-bold text-emerald-800"> {{ quiz.score }}% </span>
                    </div>
                  }

                  <div class="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                    <button
                      type="button"
                      (click)="startQuiz(quiz)"
                      class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                    >
                      @if (quiz.status === 'In progress') {
                        Continue quiz <span aria-hidden="true">→</span>
                      } @else if (quiz.status === 'Completed') {
                        Retake quiz <span aria-hidden="true">↻</span>
                      } @else {
                        Start quiz <span aria-hidden="true">→</span>
                      }
                    </button>

                    @if (quiz.status === 'Completed') {
                      <button
                        type="button"
                        (click)="viewResults(quiz)"
                        class="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View results
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
              class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500"
            >
              ⌕
            </div>

            <h2 class="mt-4 text-lg font-bold text-slate-900">No quizzes found</h2>

            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search term or clear your filters to see all quizzes.
            </p>

            <button
              type="button"
              (click)="clearFilters()"
              class="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Clear search and filters
            </button>
          </section>
        }

        <footer class="mt-8 border-t border-slate-200 py-5 text-center text-xs text-slate-500">
          {{ organizationName() }} · Quiz Library
        </footer>
      </div>
    </main>
  `,
})
export class QuizListComponent {
  private readonly organizationContext = inject(PartnerOrganizationContextService);
  private readonly router = inject(Router);

  readonly organizationName = computed(
    () => this.organizationContext.organization()?.name?.trim() || 'Organization',
  );

  readonly searchTerm = signal('');
  readonly difficultyFilter = signal('All');
  readonly statusFilter = signal('All');
  readonly categoryFilter = signal('All');

  // Sample data: replace with organization-scoped quizzes from the quiz service.
  readonly quizzes = signal<QuizListItem[]>([
    {
      id: 'cyber-basics',
      title: 'Cybersecurity Fundamentals',
      description:
        'Review core security concepts, common threats, and practical ways to protect systems and information.',
      category: 'Cybersecurity',
      difficulty: 'Beginner',
      questionCount: 15,
      timeLimitMinutes: 20,
      status: 'Available',
      tags: ['Security basics', 'Threats', 'Best practices'],
    },
    {
      id: 'cloud-essentials',
      title: 'Cloud Computing Essentials',
      description:
        'Check your understanding of cloud service models, deployment types, and shared responsibility.',
      category: 'Cloud',
      difficulty: 'Intermediate',
      questionCount: 20,
      timeLimitMinutes: 30,
      status: 'In progress',
      progress: 45,
      tags: ['Cloud concepts', 'Infrastructure', 'Services'],
    },
    {
      id: 'typescript-core',
      title: 'TypeScript Core Concepts',
      description:
        'Practice types, interfaces, narrowing, and the language features used in modern Angular applications.',
      category: 'Programming',
      difficulty: 'Intermediate',
      questionCount: 18,
      timeLimitMinutes: 25,
      status: 'Available',
      tags: ['TypeScript', 'Web development', 'Angular'],
    },
    {
      id: 'network-security',
      title: 'Network Security Assessment',
      description:
        'Test your knowledge of network defenses, secure protocols, access control, and risk reduction.',
      category: 'Cybersecurity',
      difficulty: 'Advanced',
      questionCount: 25,
      timeLimitMinutes: 40,
      status: 'Completed',
      score: 88,
      tags: ['Networking', 'Access control', 'Risk'],
    },
    {
      id: 'cloud-security',
      title: 'Cloud Security Checkpoint',
      description:
        'Apply cloud security principles to identity, configuration, monitoring, and data protection scenarios.',
      category: 'Cloud',
      difficulty: 'Advanced',
      questionCount: 12,
      timeLimitMinutes: 20,
      status: 'Available',
      tags: ['IAM', 'Monitoring', 'Data protection'],
    },
    {
      id: 'web-foundations',
      title: 'Web Development Foundations',
      description:
        'Reinforce foundational knowledge of browser behavior, HTML, CSS, and JavaScript.',
      category: 'Programming',
      difficulty: 'Beginner',
      questionCount: 10,
      timeLimitMinutes: 15,
      status: 'Completed',
      score: 94,
      tags: ['HTML', 'CSS', 'JavaScript'],
    },
  ]);

  readonly categories = computed(() => [
    'All',
    ...new Set(this.quizzes().map((quiz) => quiz.category)),
  ]);

  readonly filteredQuizzes = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const difficulty = this.difficultyFilter();
    const status = this.statusFilter();
    const category = this.categoryFilter();

    return this.quizzes().filter((quiz) => {
      const searchableText = [quiz.title, quiz.description, quiz.category, ...quiz.tags]
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

  readonly inProgressCount = computed(
    () => this.quizzes().filter((quiz) => quiz.status === 'In progress').length,
  );

  readonly completedCount = computed(
    () => this.quizzes().filter((quiz) => quiz.status === 'Completed').length,
  );

  readonly completionPercent = computed(() => {
    const total = this.quizzes().length;
    return total ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setDifficultyFilter(value: string): void {
    this.difficultyFilter.set(value);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
  }

  /** Click a summary card to filter by status; click it again to show all. */
  selectStatus(status: QuizStatus): void {
    this.statusFilter.set(this.statusFilter() === status ? 'All' : status);
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
    switch (category) {
      case 'Cybersecurity':
        return '⌘';
      case 'Cloud':
        return '☁';
      case 'Programming':
        return '</>';
      default:
        return '▤';
    }
  }

  startQuiz(quiz: QuizListItem): void {
    // Update this route to match your existing organization-scoped quiz runner.
    void this.router.navigate(['/test-center/quizzes', quiz.id]);
  }

  viewResults(quiz: QuizListItem): void {
    // Update this route to match your existing organization-scoped quiz results page.
    void this.router.navigate(['/test-center/quizzes', quiz.id, 'results']);
  }
}

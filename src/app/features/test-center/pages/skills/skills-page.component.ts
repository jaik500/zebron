import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../../core/services/logger.service';
import { useCoursesAvailable } from '../../learner-route';
import { Quiz } from '../../models/quiz.model';
import { QuizService } from '../../services/quiz.service';

interface SkillCard {
  id: string;
  slug: string;
  name: string;
  description: string;
  group: string;
  icon: string;
  level: string;
  questionCount: number;
  /** The Zebron course that teaches the skill, when there is one. */
  courseId: string | null;
}

interface SkillGroupMeta {
  key: string;
  label: string;
  description: string;
  icon: string;
  /** Tailwind classes: icon tile, accent strip, chip. */
  tile: string;
  strip: string;
}

/** Display order and look of the skill groups (quiz.skillGroup). */
const GROUPS: SkillGroupMeta[] = [
  {
    key: 'Mindsets',
    label: 'Mindsets',
    description: 'How you think about learning, effort, responsibility and the future.',
    icon: 'lightbulb',
    tile: 'bg-violet-100 text-violet-700',
    strip: 'from-violet-500 to-fuchsia-500',
  },
  {
    key: 'Behavioral skills',
    label: 'Behavioral skills',
    description: 'How you work with others and get things done.',
    icon: 'diversity_3',
    tile: 'bg-sky-100 text-sky-700',
    strip: 'from-sky-500 to-cyan-500',
  },
  {
    key: 'Workplace & career',
    label: 'Workplace & career',
    description: 'Growing your career, starting well, handling setbacks, people and pressure.',
    icon: 'work',
    tile: 'bg-amber-100 text-amber-700',
    strip: 'from-amber-500 to-orange-500',
  },
  {
    key: 'Leadership & management',
    label: 'Leadership & management',
    description: 'Leading people and managing work, with or without a title.',
    icon: 'flag',
    tile: 'bg-teal-100 text-[#007979]',
    strip: 'from-[#007979] to-[#2a835f]',
  },
  {
    key: 'Other skills',
    label: 'More skills',
    description: 'Other practical and professional skills.',
    icon: 'psychology',
    tile: 'bg-slate-100 text-slate-700',
    strip: 'from-slate-500 to-slate-600',
  },
];

/**
 * Test Center → Skills: Skill quizzes (practice questions on soft and
 * professional skills), grouped, each with the course that teaches it.
 */
@Component({
  selector: 'app-skills-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <main class="mt-14 min-h-screen bg-slate-50">
      <!-- Hero -->
      <header class="relative overflow-hidden bg-gradient-to-br from-[#032d42] via-[#00575a] to-[#007979] text-white">
        <div class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#12bfc3]/25 blur-3xl" aria-hidden="true"></div>
        <div class="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden="true"></div>
        <div class="relative mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <nav class="flex items-center gap-1 text-xs text-white/75" [attr.aria-label]="'Breadcrumb' | t">
            @if (coursesAvailable()) {
              <a [routerLink]="coursesLink" class="hover:text-white hover:underline">{{ 'Learning' | t }}</a>
              <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">chevron_right</mat-icon>
            }
            <a [routerLink]="base" class="hover:text-white hover:underline">{{ 'Test Center' | t }}</a>
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">chevron_right</mat-icon>
            <span class="font-semibold text-white">{{ 'Skills' | t }}</span>
          </nav>

          <div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-[#7ee8ea]">{{ 'Professional skills' | t }}</p>
              <h1 class="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{{ 'Skills that make the difference' | t }}</h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                {{ 'Practise the mindsets and behaviours employers look for, from growth mindset and teamwork to leadership. Each skill has practice questions and a short course.' | t }}
              </p>
              <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">psychology</mat-icon>{{ '{0} skills' | t: [skills().length] }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">quiz</mat-icon>{{ '{0} practice questions' | t: [totalQuestions()] }}
                </span>
                @if (coursesAvailable()) {
                  <a [routerLink]="certificationsLink" class="inline-flex items-center gap-1 rounded-full bg-[#12bfc3] px-3 py-1 text-[#032d42] hover:bg-[#3fd3d6]">
                    <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">workspace_premium</mat-icon>{{ 'Earn a certification' | t }}
                  </a>
                }
              </div>
            </div>

            <!-- Search -->
            <div class="rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
              <label class="sr-only" for="skill-search">{{ 'Search skills' | t }}</label>
              <div class="flex items-center gap-2 rounded-xl bg-white px-3 text-slate-800">
                <mat-icon class="text-slate-400" aria-hidden="true">search</mat-icon>
                <input
                  id="skill-search"
                  type="search"
                  autocomplete="off"
                  class="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                  [placeholder]="'Search skills, e.g. teamwork' | t"
                  [value]="search()"
                  (input)="search.set($any($event.target).value)"
                />
                @if (search()) {
                  <button type="button" (click)="search.set('')" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100" [attr.aria-label]="'Clear search' | t">
                    <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Group filter -->
      <div class="sticky top-14 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8" role="group" [attr.aria-label]="'Skill groups' | t">
          <button type="button" (click)="groupFilter.set(null)" [attr.aria-pressed]="groupFilter() === null" class="h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition" [class]="groupFilter() === null ? 'bg-[#032d42] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'">
            {{ 'All' | t }}
          </button>
          @for (group of visibleGroups(); track group.meta.key) {
            <button type="button" (click)="groupFilter.set(group.meta.key)" [attr.aria-pressed]="groupFilter() === group.meta.key" class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition" [class]="groupFilter() === group.meta.key ? 'bg-[#032d42] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ group.meta.icon }}</mat-icon>
              {{ group.meta.label | t }}
              <span class="text-xs opacity-70">{{ group.skills.length }}</span>
            </button>
          }
        </div>
      </div>

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="h-52 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200"></div>
            }
          </div>
          <p class="sr-only" role="status">{{ 'Loading skills…' | t }}</p>
        } @else if (error()) {
          <p class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{{ error() | t }}</p>
        } @else if (!skills().length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">psychology</mat-icon>
            <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'No skills yet' | t }}</h2>
            <p class="mx-auto mt-1 max-w-md text-sm text-slate-600">{{ 'Skill quizzes will appear here once they are published.' | t }}</p>
          </div>
        } @else {
          @for (group of shownGroups(); track group.meta.key) {
            <section class="mb-10" [attr.aria-labelledby]="'group-' + $index">
              <div class="mb-4 flex items-start gap-3">
                <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" [class]="group.meta.tile">
                  <mat-icon aria-hidden="true">{{ group.meta.icon }}</mat-icon>
                </span>
                <div class="min-w-0">
                  <h2 [id]="'group-' + $index" class="text-xl font-bold text-[#032d42]">{{ group.meta.label | t }}</h2>
                  <p class="text-sm text-slate-600">{{ group.meta.description | t }}</p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (skill of group.skills; track skill.id) {
                  <article class="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-[#12bfc3]">
                    <div class="h-1.5 bg-gradient-to-r" [class]="group.meta.strip" aria-hidden="true"></div>
                    <div class="flex flex-1 flex-col p-5">
                      <div class="flex items-start gap-3">
                        <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" [class]="group.meta.tile">
                          <mat-icon class="!h-7 !w-7 !text-[28px]" aria-hidden="true">{{ skill.icon }}</mat-icon>
                        </span>
                        <div class="min-w-0">
                          <h3 class="text-base font-bold leading-snug text-[#032d42]">{{ skill.name }}</h3>
                          <p class="mt-0.5 text-xs text-slate-500">
                            {{ skill.level | t }} · {{ '{0} questions' | t: [skill.questionCount] }}
                          </p>
                        </div>
                      </div>
                      <p class="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{{ skill.description }}</p>
                      <div class="mt-4 flex flex-wrap gap-2">
                        <a [routerLink]="[base, 'quiz-details', skill.slug]" class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">play_arrow</mat-icon>{{ 'Practise' | t }}
                        </a>
                        @if (skill.courseId && coursesAvailable()) {
                          <a [routerLink]="['/courses', skill.courseId]" class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-[#007979] hover:text-[#007979]">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">school</mat-icon>{{ 'Take the course' | t }}
                          </a>
                        }
                      </div>
                    </div>
                  </article>
                }
              </div>
            </section>
          } @empty {
            <p class="py-10 text-center text-sm text-slate-500">{{ 'No skills match "{0}".' | t: [search()] }}</p>
          }
        }
      </div>
    </main>
  `,
})
export class SkillsPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly quizService = inject(QuizService);
  private readonly logger = inject(LoggerService);

  private readonly organizationId = this.route.snapshot.paramMap.get('organizationId');
  protected readonly base = this.organizationId ? `/partner/org/${this.organizationId}/learn/test-center` : '/test-center';
  protected readonly coursesLink = this.organizationId ? `/partner/org/${this.organizationId}/courses` : '/courses';
  protected readonly certificationsLink = `${this.coursesLink}/certifications`;
  protected readonly coursesAvailable = useCoursesAvailable(this.route);

  protected readonly skills = signal<SkillCard[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly groupFilter = signal<string | null>(null);

  protected readonly totalQuestions = computed(() => this.skills().reduce((total, skill) => total + skill.questionCount, 0));

  /** Groups that have skills, in display order. */
  protected readonly visibleGroups = computed(() =>
    GROUPS.map((meta) => ({ meta, skills: this.skills().filter((skill) => skill.group === meta.key) })).filter((group) => group.skills.length),
  );

  /** Groups after the group filter and the search. */
  protected readonly shownGroups = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.visibleGroups()
      .filter((group) => !this.groupFilter() || group.meta.key === this.groupFilter())
      .map((group) => ({
        meta: group.meta,
        skills: query
          ? group.skills.filter((skill) => `${skill.name} ${skill.description} ${group.meta.label}`.toLowerCase().includes(query))
          : group.skills,
      }))
      .filter((group) => group.skills.length);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const quizzes = await this.quizService.getQuizzesForLearners(this.organizationId);
      this.skills.set(
        quizzes
          .filter((quiz) => quiz.type === 'skill' && quiz.active !== false)
          .map((quiz) => this.toCard(quiz))
          .sort((a, b) => this.groupIndex(a.group) - this.groupIndex(b.group)),
      );
    } catch (error) {
      this.logger.error('SkillsPageComponent', 'Could not load skills.', error);
      this.error.set('Skills could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private toCard(quiz: Quiz): SkillCard {
    const record = quiz as Quiz & Record<string, unknown>;
    const text = (key: string) => (typeof record[key] === 'string' ? (record[key] as string) : '');
    const group = GROUPS.some((meta) => meta.key === text('skillGroup')) ? text('skillGroup') : 'Other skills';
    // Program quizzes are named "<courseId>-quiz" (Zebron courses open to everyone at /courses).
    const courseId = quiz.scope === 'platform' && quiz.id.endsWith('-quiz') ? quiz.id.slice(0, -'-quiz'.length) : null;
    return {
      id: quiz.id,
      slug: quiz.slug || quiz.id,
      name: quiz.name,
      description: quiz.description,
      group,
      icon: text('icon') || GROUPS.find((meta) => meta.key === group)?.icon || 'psychology',
      level: text('level') || 'All levels',
      questionCount: quiz.questionCount ?? 0,
      courseId,
    };
  }

  private groupIndex(group: string): number {
    const index = GROUPS.findIndex((meta) => meta.key === group);
    return index === -1 ? GROUPS.length : index;
  }
}

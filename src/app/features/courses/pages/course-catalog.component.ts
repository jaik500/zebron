import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseCardComponent } from '../components/course-card.component';
import { CourseHeaderComponent } from '../components/course-header.component';
import {
  Course,
  COURSE_COVERS,
  COURSE_LEVEL_LABELS,
  courseContextFromRoute,
  CourseLevel,
  formatMinutes,
  isCourseComplete,
  progressId,
} from '../course.model';
import { CourseAccessService } from '../course-access.service';
import { CourseStore } from '../course.store';

const LEVEL_ORDER: Record<CourseLevel, number> = { beginner: 0, intermediate: 1, advanced: 2, all: 3 };

/**
 * Every published course: Zebron's, plus the organization's own on
 * organization pages. When browsing (no search or topic), courses that
 * belong to a program are shown together as an ordered path with the
 * learner's progress; the rest follow under More courses. Searching or
 * picking a topic shows a flat grid, program courses in step order.
 */
@Component({
  selector: 'app-course-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, CourseCardComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Catalog' }]"
        [activeTab]="'catalog'"
        [canManage]="canManage()"
        [showSearch]="true"
        [query]="store.query()"
        (queryChange)="store.setQuery($event)"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (store.topics().length > 1) {
          <div class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" [attr.aria-label]="'Topics' | t">
            @for (topic of store.topics(); track topic) {
              <button
                type="button"
                class="shrink-0 rounded-full border px-3 py-1 text-sm transition"
                [ngClass]="
                  topic === store.topic()
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                "
                [attr.aria-pressed]="topic === store.topic()"
                (click)="store.setTopic(topic)"
              >
                {{ topic === 'All' ? ('All' | t) : topic }}
              </button>
            }
          </div>
        }

        <div class="mb-3 mt-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ (store.filteredCatalog().length === 1 ? '{0} course' : '{0} courses') | t: [store.filteredCatalog().length] }}
          </h2>
          @if (store.query() || store.topic() !== 'All') {
            <button type="button" class="text-sm font-semibold text-[#007979] hover:underline" (click)="clear()">
              {{ 'Clear filters' | t }}
            </button>
          } @else if (context.organizationId) {
            <span class="text-sm text-slate-500">{{ 'Your organization\\u0027s courses and Zebron courses' | t }}</span>
          }
        </div>

        @if (store.catalogLoading() && !store.catalog().length) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (store.catalogError()) {
          <div class="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {{ store.catalogError()! | t }}
            <button type="button" class="font-semibold underline" (click)="store.loadCatalog(true)">{{ 'Try again' | t }}</button>
          </div>
        } @else if (browsing() && programs().length) {
          <!-- ================= PROGRAMS: ordered learning paths ================= -->
          <section aria-labelledby="programs-title">
            <h2 id="programs-title" class="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">route</mat-icon>
              {{ 'Programs' | t }}
            </h2>

            <div class="flex flex-col gap-4">
              @for (program of programs(); track program.name) {
                <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <header class="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                    <span class="h-12 w-12 shrink-0 rounded-xl" [style.background]="program.cover" aria-hidden="true"></span>
                    <div class="min-w-0 flex-1">
                      <h3 class="text-lg font-semibold text-slate-900">{{ program.name }}</h3>
                      <p class="text-sm text-slate-500">
                        {{ '{0} courses' | t: [program.courses.length] }} · {{ program.duration }} ·
                        @for (level of program.levels; track level; let last = $last) {
                          {{ level | t }}@if (!last) { – }
                        }
                      </p>
                      @if (program.done > 0) {
                        <div class="mt-2 flex items-center gap-2">
                          <span class="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-slate-200">
                            <span class="block h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f]" [style.width.%]="(program.done / program.courses.length) * 100"></span>
                          </span>
                          <span class="text-xs text-slate-500">{{ '{0} of {1} completed' | t: [program.done, program.courses.length] }}</span>
                        </div>
                      }
                    </div>
                    @if (program.next; as next) {
                      <a
                        [routerLink]="context.basePath + '/' + next.course.id"
                        class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
                      >
                        <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">play_arrow</mat-icon>
                        {{ (program.done || program.started ? 'Continue: step {0}' : 'Start with step {0}') | t: [next.step] }}
                      </a>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">workspace_premium</mat-icon>
                        {{ 'Program completed' | t }}
                      </span>
                    }
                    <button
                      type="button"
                      (click)="toggleProgram(program.name)"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                      [attr.aria-expanded]="!collapsed().has(program.name)"
                      [attr.aria-label]="(collapsed().has(program.name) ? 'Show courses in {0}' : 'Hide courses in {0}') | t: [program.name]"
                    >
                      <mat-icon>{{ collapsed().has(program.name) ? 'keyboard_arrow_down' : 'keyboard_arrow_up' }}</mat-icon>
                    </button>
                  </header>

                  @if (!collapsed().has(program.name)) {
                    <ol class="grid border-t border-slate-100 sm:grid-cols-2">
                      @for (item of program.courses; track item.course.id + (item.course.organizationId ?? '')) {
                        <li class="border-b border-slate-100 sm:odd:border-r">
                          <a
                            [routerLink]="context.basePath + '/' + item.course.id"
                            class="flex items-center gap-3 px-4 py-3 transition hover:bg-teal-50/60 sm:px-5"
                          >
                            <span
                              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                              [ngClass]="item.done ? 'bg-emerald-100 text-emerald-700' : item.percent > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'"
                              aria-hidden="true"
                            >
                              @if (item.done) {
                                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]">check</mat-icon>
                              } @else {
                                {{ item.step }}
                              }
                            </span>
                            <span class="min-w-0 flex-1">
                              <span class="block truncate font-medium text-slate-900">{{ item.course.title }}</span>
                              <span class="block text-xs text-slate-500">
                                {{ levelLabel(item.course) | t }} · {{ minutes(item.course) }} · {{ item.course.lessonCount }} {{ (item.course.lessonCount === 1 ? 'lesson' : 'lessons') | t }}
                                @if (item.done) {
                                  · <span class="font-semibold text-emerald-700">{{ 'Completed' | t }}</span>
                                } @else if (item.percent > 0) {
                                  · {{ '{percent}% complete' | t: { percent: item.percent } }}
                                }
                              </span>
                            </span>
                            <mat-icon class="shrink-0 text-slate-300" aria-hidden="true">chevron_right</mat-icon>
                          </a>
                        </li>
                      }
                    </ol>
                  }
                </article>
              }
            </div>
          </section>

          @if (standalone().length) {
            <section class="mt-8" aria-labelledby="more-courses-title">
              <h2 id="more-courses-title" class="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                <mat-icon class="text-[#007979]" aria-hidden="true">menu_book</mat-icon>
                {{ 'More courses' | t }}
              </h2>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @for (course of standalone(); track course.id + (course.organizationId ?? '')) {
                  <app-course-card
                    [course]="course"
                    [progress]="store.progressById().get(progressOf(course)) ?? null"
                    [exam]="store.exams()[progressOf(course)]"
                    [link]="context.basePath + '/' + course.id"
                  />
                }
              </div>
            </section>
          }
        } @else if (store.filteredCatalog().length) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (course of sortedResults(); track course.id + (course.organizationId ?? '')) {
              <app-course-card
                [course]="course"
                [progress]="store.progressById().get(progressOf(course)) ?? null"
                [exam]="store.exams()[progressOf(course)]"
                [link]="context.basePath + '/' + course.id"
              />
            }
          </div>
        } @else if (store.catalogLoaded()) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-9 !w-9 !text-[36px] text-slate-400" aria-hidden="true">search_off</mat-icon>
            <p class="mt-2 text-sm text-slate-600">
              {{ store.catalog().length ? ('No courses match. Try another skill or topic.' | t) : ('No courses are published yet. Check back soon.' | t) }}
            </p>
          </div>
        }
      </div>
    </main>
  `,
})
export class CourseCatalogComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly access = inject(CourseAccessService);
  protected readonly canManage = computed(() => this.access.canManage(this.context));
  protected readonly progressOf = progressId;

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  constructor() {
    this.store.setContext(this.context);
    void this.store.loadCatalog();

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });

    // Arriving from My learning's search: keep typing where you left off.
    afterNextRender(() => {
      if (this.store.query()) {
        document.getElementById('course-search')?.focus();
      }
    });
  }

  // ---------- Programs ----------

  /** Programs the learner has closed (all open by default). */
  protected readonly collapsed = signal<Set<string>>(new Set());

  /** No search and no topic: show programs, then other courses. */
  protected readonly browsing = computed(() => !this.store.query().trim() && this.store.topic() === 'All');

  protected readonly programs = computed(() => {
    const byName = new Map<string, Course[]>();
    for (const course of this.store.catalog()) {
      if (course.program) {
        byName.set(course.program, [...(byName.get(course.program) ?? []), course]);
      }
    }

    const progress = this.store.progressById();
    const exams = this.store.exams();

    return [...byName.entries()]
      .map(([name, courses]) => {
        const items = [...courses]
          .sort((a, b) => (a.programOrder ?? 999) - (b.programOrder ?? 999) || a.title.localeCompare(b.title))
          .map((course, index) => {
            const id = progressId(course);
            const record = progress.get(id) ?? null;
            return {
              course,
              step: course.programOrder ?? index + 1,
              done: isCourseComplete(record, exams[id]),
              percent: record?.percent ?? 0,
            };
          });
        const levels = [...new Set(items.map((item) => item.course.level))].sort((a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]);

        return {
          name,
          courses: items,
          done: items.filter((item) => item.done).length,
          started: items.some((item) => item.percent > 0),
          next: items.find((item) => !item.done) ?? null,
          duration: formatMinutes(items.reduce((total, item) => total + item.course.estimatedMinutes, 0)),
          // First and last level, such as Beginner – Intermediate.
          levels: [...new Set([levels[0] ?? 'all', levels[levels.length - 1] ?? 'all'])].map((level) => COURSE_LEVEL_LABELS[level]),
          cover: COURSE_COVERS[items[0]?.course.cover ?? 'teal'] ?? COURSE_COVERS.teal,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Courses that are not part of a program. */
  protected readonly standalone = computed(() => this.store.catalog().filter((course) => !course.program));

  /** Search and topic results: program courses grouped and in step order. */
  protected readonly sortedResults = computed(() =>
    [...this.store.filteredCatalog()].sort((a, b) => {
      if (a.program && b.program) {
        return a.program.localeCompare(b.program) || (a.programOrder ?? 999) - (b.programOrder ?? 999);
      }
      return Number(!!b.program) - Number(!!a.program);
    }),
  );

  protected toggleProgram(name: string): void {
    const next = new Set(this.collapsed());
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.collapsed.set(next);
  }

  protected levelLabel(course: Course): string {
    return COURSE_LEVEL_LABELS[course.level];
  }

  protected minutes(course: Course): string {
    return formatMinutes(course.estimatedMinutes);
  }

  protected clear(): void {
    this.store.setQuery('');
    this.store.setTopic('All');
  }
}

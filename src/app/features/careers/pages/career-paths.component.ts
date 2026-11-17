import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { CourseHeaderComponent } from '../../courses/components/course-header.component';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { allSteps, CAREER_LEVEL_LABELS, CareerPath, CareerPlan, totalHours } from '../career-path.model';
import { CareerPathService, isStepDone, LearnerRecords } from '../career-path.service';

interface PlanCard {
  path: CareerPath;
  plan: CareerPlan;
  done: number;
  total: number;
  percent: number;
}

/**
 * Learning → Career paths (/courses/careers): pick the job you want and
 * see the roadmap to get there. Signed-in learners also see the paths
 * they follow, with progress. Its own feature (features/careers); it only
 * borrows the Learning header and reads course progress.
 */
@Component({
  selector: 'app-career-paths',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <app-course-header
        basePath="/courses"
        [crumbs]="[{ label: 'Learning', link: '/courses' }, { label: 'Career paths' }]"
        [activeTab]="'careers'"
        [canManage]="isAdmin()"
        [showSearch]="true"
        searchLabel="Search career paths"
        searchPlaceholder="A job, such as nurse or AI engineer"
        [query]="search()"
        (queryChange)="search.set($event)"
      />

      <div class="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">route</mat-icon>
              {{ 'Where do you want to work?' | t }}
            </h1>
            <p class="mt-1 max-w-2xl text-slate-600">
              {{ 'Pick a job and get a step-by-step roadmap: the skills each stage needs and the courses that teach them.' | t }}
            </p>
          </div>
          @if (isAdmin()) {
            <a routerLink="/courses/careers/manage" class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-[#007979] hover:text-[#007979]">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">edit_note</mat-icon>
              {{ 'Manage career paths' | t }}
            </a>
          }
        </div>

        <!-- My plans -->
        @if (myPlans().length) {
          <section aria-labelledby="my-plans-title">
            <h2 id="my-plans-title" class="mb-3 text-lg font-semibold text-slate-900">{{ 'My career plans' | t }}</h2>
            <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              @for (item of myPlans(); track item.path.id) {
                <li>
                  <a
                    [routerLink]="['/courses/careers', item.path.id]"
                    class="flex items-center gap-3 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm transition hover:border-[#007979]"
                  >
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-[#007979]">
                      {{ item.percent }}%
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-semibold text-slate-900">{{ item.path.title }}</span>
                      <span class="block text-sm text-slate-500">{{ '{0} of {1} steps done' | t: [item.done, item.total] }}</span>
                      <span class="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                        <span class="block h-full rounded-full bg-[#007979]" [style.width.%]="item.percent"></span>
                      </span>
                    </span>
                    <mat-icon class="shrink-0 text-slate-300" aria-hidden="true">chevron_right</mat-icon>
                  </a>
                </li>
              }
            </ul>
          </section>
        }

        <!-- Fields -->
        @if (fields().length > 1) {
          <div class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" [attr.aria-label]="'Fields' | t">
            @for (item of fields(); track item) {
              <button
                type="button"
                class="shrink-0 rounded-full border px-3 py-1 text-sm transition"
                [class]="item === field() ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                [attr.aria-pressed]="item === field()"
                (click)="field.set(item)"
              >
                {{ item === 'All' ? ('All' | t) : item }}
              </button>
            }
          </div>
        }

        @if (loading()) {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="h-56 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <div class="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {{ 'Career paths could not be loaded.' | t }}
            <button type="button" class="font-semibold underline" (click)="load()">{{ 'Try again' | t }}</button>
          </div>
        } @else if (!filtered().length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">travel_explore</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">
              {{ (paths().length ? 'No career path matches your search.' : 'Career paths are coming soon.') | t }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ 'Meanwhile, browse courses or look at open jobs.' | t }}
            </p>
            <div class="mt-4 flex flex-wrap justify-center gap-2">
              <a routerLink="/courses/catalog" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Browse courses' | t }}</a>
              <a routerLink="/jobs" class="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-[#007979]">{{ 'See jobs' | t }}</a>
            </div>
          </div>
        } @else {
          <section aria-labelledby="paths-title">
            <h2 id="paths-title" class="mb-3 text-lg font-semibold text-slate-900">
              {{ (filtered().length === 1 ? '{0} career path' : '{0} career paths') | t: [filtered().length] }}
            </h2>
            <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (path of filtered(); track path.id) {
                <li>
                  <a
                    [routerLink]="['/courses/careers', path.id]"
                    class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md"
                  >
                    <span class="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      @if (path.field) {
                        <span class="rounded-full bg-teal-50 px-2 py-0.5 text-[#006666]">{{ path.field }}</span>
                      }
                      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{{ levelLabel(path) | t }}</span>
                      @if (planIds().has(path.id)) {
                        <span class="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{{ 'Following' | t }}</span>
                      }
                    </span>
                    <span class="mt-3 text-lg font-semibold text-slate-900">{{ path.title }}</span>
                    <span class="mt-1 line-clamp-3 flex-1 text-sm text-slate-600">{{ path.summary }}</span>
                    <span class="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-500">
                      <span class="inline-flex items-center gap-1">
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">format_list_numbered</mat-icon>
                        {{ '{0} steps' | t: [stepCount(path)] }}
                      </span>
                      @if (hours(path)) {
                        <span class="inline-flex items-center gap-1">
                          <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">schedule</mat-icon>
                          {{ 'About {0} hours' | t: [hours(path)] }}
                        </span>
                      }
                      @if (path.salaryRange) {
                        <span class="inline-flex items-center gap-1">
                          <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">payments</mat-icon>
                          {{ path.salaryRange }}
                        </span>
                      }
                    </span>
                  </a>
                </li>
              }
            </ul>
          </section>
        }
      </div>
    </main>
  `,
})
export class CareerPathsComponent {
  private readonly service = inject(CareerPathService);
  private readonly auth = inject(AuthService);

  protected readonly paths = signal<CareerPath[]>([]);
  protected readonly plans = signal<CareerPlan[]>([]);
  protected readonly records = signal<LearnerRecords | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly search = signal('');
  protected readonly field = signal('All');

  private readonly uid = computed(() => this.auth.firebaseUser()?.uid ?? null);
  protected readonly isAdmin = computed(() => !!this.auth.user() && this.auth.isAdmin);
  private readonly headerTitle = useLearningHeaderTitle(inject(ActivatedRoute));

  protected readonly fields = computed(() => [
    'All',
    ...[...new Set(this.paths().map((path) => path.field).filter(Boolean))].sort(),
  ]);

  protected readonly filtered = computed(() => {
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const field = this.field();
    return this.paths().filter((path) => {
      if (field !== 'All' && path.field !== field) return false;
      const haystack = `${path.title} ${path.summary} ${path.field} ${path.skills.join(' ')} ${path.jobKeywords}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  });

  protected readonly planIds = computed(() => new Set(this.plans().map((plan) => plan.pathId)));

  protected readonly myPlans = computed<PlanCard[]>(() => {
    const byId = new Map(this.paths().map((path) => [path.id, path]));
    const records = this.records();
    return this.plans()
      .map((plan) => {
        const path = byId.get(plan.pathId);
        if (!path) return null;
        const steps = allSteps(path);
        const done = steps.filter((step) => isStepDone(path.id, step, plan, records)).length;
        return { path, plan, done, total: steps.length, percent: steps.length ? Math.round((done / steps.length) * 100) : 0 };
      })
      .filter((item): item is PlanCard => !!item);
  });

  constructor() {
    void this.load();

    // The learner's plans load when they sign in.
    effect(() => {
      const uid = this.uid();
      if (!uid) {
        this.plans.set([]);
        this.records.set(null);
        return;
      }
      void this.loadPlans(uid);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.paths.set(await this.service.listPublished());
    } catch (error) {
      console.error('[Careers] Could not load career paths', error);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPlans(uid: string): Promise<void> {
    try {
      const [plans, records] = await Promise.all([this.service.listPlans(uid), this.service.learnerRecords(uid)]);
      this.plans.set(plans);
      this.records.set(records);
    } catch (error) {
      console.warn('[Careers] Could not load career plans', error);
    }
  }

  protected levelLabel(path: CareerPath): string {
    return CAREER_LEVEL_LABELS[path.level];
  }

  protected stepCount(path: CareerPath): number {
    return allSteps(path).length;
  }

  protected hours(path: CareerPath): number {
    return totalHours(path);
  }
}

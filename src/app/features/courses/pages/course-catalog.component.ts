import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseCardComponent } from '../components/course-card.component';
import { CourseHeaderComponent } from '../components/course-header.component';
import { courseContextFromRoute, progressId } from '../course.model';
import { CourseAccessService } from '../course-access.service';
import { CourseStore } from '../course.store';

/** Every published course: Zebron's, plus the organization's own on organization pages. */
@Component({
  selector: 'app-course-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, TranslatePipe, CourseHeaderComponent, CourseCardComponent],
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
        } @else if (store.filteredCatalog().length) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (course of store.filteredCatalog(); track course.id + (course.organizationId ?? '')) {
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

  protected clear(): void {
    this.store.setQuery('');
    this.store.setTopic('All');
  }
}

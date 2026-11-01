import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { Course, COURSE_COVERS, courseContextFromRoute, courseDate, formatMinutes } from '../course.model';
import { CourseService } from '../course.service';
import { CourseAccessService } from '../course-access.service';

const STATUS: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'In review', classes: 'bg-amber-100 text-amber-800' },
  published: { label: 'Published', classes: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archived', classes: 'bg-slate-100 text-slate-500' },
};

/** Course authors: every course here, drafts included, and New course. */
@Component({
  selector: 'app-course-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Manage courses' }]"
        [activeTab]="'manage'"
        [canManage]="true"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-semibold text-slate-900">
              {{ (context.organizationId ? 'Your organization\\u0027s courses' : 'Zebron courses') | t }}
            </h1>
            <p class="text-sm text-slate-500">
              {{ (canPublish() ? 'Drafts are only visible here until you publish them.' : 'Write drafts, then submit them for review: a manager publishes them.') | t }}
            </p>
          </div>
          <a
            [routerLink]="context.basePath + '/manage/new'"
            class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
          >
            <mat-icon aria-hidden="true">add</mat-icon>{{ 'New course' | t }}
          </a>
        </div>

        @if (loading()) {
          <div class="flex flex-col gap-2" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-20 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
        } @else if (courses().length) {
          @if (canPublish() && inReview().length) {
            <section class="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3" aria-labelledby="review-title">
              <h2 id="review-title" class="flex items-center gap-2 px-1 text-sm font-semibold text-amber-900">
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">rate_review</mat-icon>
                {{ 'Waiting for your review ({0})' | t: [inReview().length] }}
              </h2>
              <ul class="mt-2 flex flex-col gap-2">
                @for (course of inReview(); track course.id) {
                  <li>
                    <a
                      [routerLink]="[context.basePath, 'manage', course.id]"
                      class="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 transition hover:border-[#007979] hover:shadow-sm"
                    >
                      <span class="h-10 w-10 shrink-0 rounded-lg" [style.background]="cover(course)" aria-hidden="true"></span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-semibold text-slate-900">{{ course.title }}</span>
                        <span class="block text-xs text-slate-500">
                          {{ 'Submitted by {0}' | t: [course.review?.submittedByName || ('a staff member' | t)] }}
                          @if (submitted(course)) {
                            · {{ submitted(course) }}
                          }
                        </span>
                      </span>
                      <span class="shrink-0 text-sm font-semibold text-[#007979]">{{ 'Review' | t }}</span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          <ul class="flex flex-col gap-2">
            @for (course of courses(); track course.id) {
              <li>
                <a
                  [routerLink]="[context.basePath, 'manage', course.id]"
                  class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#007979] hover:shadow-sm"
                >
                  <span class="h-14 w-14 shrink-0 rounded-xl" [style.background]="cover(course)" aria-hidden="true"></span>
                  <span class="min-w-0 flex-1">
                    <span class="flex flex-wrap items-center gap-2">
                      <span class="truncate font-semibold text-slate-900">{{ course.title }}</span>
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [ngClass]="status(course).classes">{{ status(course).label | t }}</span>
                    </span>
                    <span class="mt-0.5 block text-xs text-slate-500">
                      {{ course.lessonCount }} {{ (course.lessonCount === 1 ? 'lesson' : 'lessons') | t }} · {{ minutes(course) }}
                      @if (updated(course)) {
                        · {{ 'Updated {0}' | t: [updated(course)] }}
                      }
                    </span>
                  </span>
                  <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">edit</mat-icon>
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">edit_note</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">{{ 'No courses yet' | t }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ 'Create your first course: add modules and lessons, then publish when it is ready.' | t }}</p>
          </div>
        }
      </div>
    </main>
  `,
})
export class CourseManageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CourseService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly courses = signal<Course[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly locale = computed(() => (this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'));

  private readonly access = inject(CourseAccessService);
  /** Managers and above publish; staff submit for review. */
  protected readonly canPublish = computed(() => this.access.canPublish(this.context));
  protected readonly inReview = computed(() => this.courses().filter((course) => course.status === 'in_review'));

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.courses.set(await this.service.listAll(this.context.organizationId));
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Could not list courses.', error);
      this.error.set('Courses could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected cover(course: Course): string {
    return COURSE_COVERS[course.cover] ?? COURSE_COVERS.teal;
  }

  protected status(course: Course): { label: string; classes: string } {
    return STATUS[course.status] ?? STATUS['draft'];
  }

  protected minutes(course: Course): string {
    return formatMinutes(course.estimatedMinutes);
  }

  protected submitted(course: Course): string {
    return courseDate(course.review?.submittedAt ?? null, this.locale());
  }

  protected updated(course: Course): string {
    return courseDate(course.updatedAt, this.locale());
  }
}

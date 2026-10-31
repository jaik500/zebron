import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../models/quiz.model';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    TranslatePipe,RouterLink],
  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- Page heading -->
      <section class="border-b border-gray-200 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <a
            [routerLink]="testCenterRoute()"
            class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#007979] hover:underline"
          >
            <span aria-hidden="true">←</span>
            {{ 'Test Center' | t }}
          </a>

          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-[#032D42] sm:text-4xl">
                {{ 'Courses' | t }}
              </h1>
              <p class="mt-2 max-w-2xl text-gray-600">
                {{ 'Explore available courses, review what you will learn, and enroll when you\\u0027re ready.' | t }}
              </p>
            </div>

            @if (!loading() && !error()) {
              <span class="text-sm text-gray-500">
                {{ courses().length }} {{ courses().length === 1 ? ('course' | t) : ('courses' | t) }}
              </span>
            }
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="flex min-h-48 items-center justify-center">
            <p class="text-sm text-gray-500">{{ 'Loading courses...' | t }}</p>
          </div>
        } @else if (error()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p class="font-medium text-red-700">{{ error() | t }}</p>
            <button
              type="button"
              (click)="loadCourses()"
              class="mt-4 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              {{ 'Try again' | t }}
            </button>
          </div>
        } @else if (courses().length === 0) {
          <div class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 class="text-lg font-semibold text-[#032D42]">{{ 'No courses available' | t }}</h2>
            <p class="mt-2 text-sm text-gray-500">
              {{ 'There are currently no active courses available.' | t }}
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @for (course of courses(); track course.id) {
              <article
                class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-[#007979]/40 hover:shadow-md"
              >
                <div class="flex-1 p-5 sm:p-6">
                  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                    @if (course.scope === 'platform') {
                      <span class="inline-flex rounded-full bg-[#007979]/10 px-2.5 py-1 text-xs font-semibold text-[#007979]">
                        {{ 'Zebron Course' | t }}
                      </span>
                    } @else {
                      <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        <span class="mr-1" aria-hidden="true">▦</span>
                        {{ 'Organization Course' | t }}
                      </span>
                    }

                    <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <span aria-hidden="true">◷</span>
                      {{ estimatedDuration(course) | t }}
                    </span>
                  </div>

                  <h2 class="text-lg font-bold leading-snug text-[#032D42]">
                    {{ course.name }}
                  </h2>

                  @if (course.description) {
                    <p class="mt-2 text-sm leading-6 text-gray-600">
                      {{ course.description | t }}
                    </p>
                  } @else {
                    <p class="mt-2 text-sm italic leading-6 text-gray-400">
                      {{ 'No course description available.' | t }}
                    </p>
                  }

                  @if (expandedQuizId() === course.id) {
                    <div class="mt-4 rounded-xl border border-[#007979]/15 bg-[#007979]/5 p-4">
                      <h3 class="text-sm font-semibold text-[#032D42]">{{ 'About this course' | t }}</h3>
                      <p class="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                        {{ detailedDescription(course) }}
                      </p>

                      <div class="mt-4 flex flex-wrap gap-2">
                        <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                          {{ 'Self-paced learning' | t }}
                        </span>
                        <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                          {{ 'Learn at your own speed' | t }}
                        </span>
                      </div>
                    </div>
                  }
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
                  <button
                    type="button"
                    (click)="toggleExpanded(course.id)"
                    [attr.aria-expanded]="expandedQuizId() === course.id"
                    class="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold text-[#007979] hover:text-[#005f5f] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                  >
                    {{ expandedQuizId() === course.id ? ('Show less' | t) : ('View details' | t) }}
                    <span class="text-base" aria-hidden="true">
                      {{ expandedQuizId() === course.id ? '⌃' : '⌄' }}
                    </span>
                  </button>

                  <a
                    [routerLink]="courseDetailRoute(course)"
                    class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006666] focus:outline-none focus:ring-2 focus:ring-[#007979]/40 focus:ring-offset-2"
                  >
                    {{ 'Enroll' | t }}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit {
  private readonly quizService = inject(QuizService);
  private readonly organizationContext = inject(OrganizationContextService);

  protected readonly courses = signal<Quiz[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedQuizId = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadCourses();
  }

  protected async loadCourses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const organizationId = this.organizationContext.organizationId();
      const courses = await this.quizService.getAvailableQuizzes(organizationId);
      this.courses.set(courses);
    } catch (error) {
      console.error('Failed to load Test Center courses:', error);
      this.courses.set([]);
      this.error.set('Unable to load courses. Please try again later.');
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleExpanded(quizId: string): void {
    this.expandedQuizId.update((current) => current === quizId ? null : quizId);
  }

  /**
   * Supports duration fields on existing or future course records without
   * requiring every older Firestore document to have one.
   */
  protected estimatedDuration(course: Quiz): string {
    const record = course as Quiz & {
      estimatedDuration?: string | number;
      estimatedDurationMinutes?: number;
      durationMinutes?: number;
      estimatedHours?: number;
    };

    if (typeof record.estimatedDuration === 'string' && record.estimatedDuration.trim()) {
      return record.estimatedDuration;
    }

    const minutes = record.estimatedDurationMinutes ?? record.durationMinutes;
    if (typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0) {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remainder = minutes % 60;
      return remainder ? `${hours} hr ${remainder} min` : `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
    }

    if (typeof record.estimatedHours === 'number' && record.estimatedHours > 0) {
      return `${record.estimatedHours} ${record.estimatedHours === 1 ? 'hour' : 'hours'}`;
    }

    return 'Time varies';
  }

  protected detailedDescription(course: Quiz): string {
    const record = course as Quiz & {
      detailedDescription?: string;
      longDescription?: string;
      learningObjectives?: string[];
    };

    const detail = record.detailedDescription?.trim() || record.longDescription?.trim();
    if (detail) return detail;

    const objectives = record.learningObjectives?.filter(Boolean) ?? [];
    const baseDescription = course.description?.trim();

    if (baseDescription && objectives.length) {
      return `${baseDescription}\n\nWhat you'll learn:\n${objectives.map((item) => `• ${item}`).join('\n')}`;
    }

    if (baseDescription) {
      return `${baseDescription}\n\nExplore the course content at your own pace. Enroll to open the course page and review the available learning activities.`;
    }

    return 'Detailed course information has not been added yet. Enroll to open the course page and review the available learning activities.';
  }

  protected testCenterRoute(): string {
    const organizationId = this.organizationContext.organizationId();
    return organizationId
      ? `/partner/org/${organizationId}/learn/test-center`
      : '/test-center';
  }

  protected courseDetailRoute(course: Quiz): string[] {
    const organizationId = this.organizationContext.organizationId();
    return organizationId
      ? ['/partner', 'org', organizationId, 'learn', 'test-center', 'courses', course.slug]
      : ['/test-center', 'courses', course.slug];
  }
}

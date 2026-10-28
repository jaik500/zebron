
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { TestCourseService } from '../../services/test-course.service';
import { TestCourse } from '../../models/test-course.model';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
  ],
  template: `
    <main class="min-h-screen bg-gray-50 mt-16">

      <!-- =====================================================
           STICKY HEADER WITH SEARCH
           ===================================================== -->

      <header
        class="sticky top-0 z-50 border-b border-white/10
               bg-gradient-to-br from-teal-800 via-teal-700
               to-teal-600 shadow-md"
      >
        <div
          class="mx-auto flex max-w-7xl items-center justify-between
                 gap-4 px-4 py-2 sm:gap-6 sm:px-6 lg:px-8"
        >

          <!-- Left: Page title -->
          <div
            class="flex min-w-0 shrink-0 items-center gap-3 text-white"
          >
            <div
              class="hidden h-10 w-10 shrink-0 items-center justify-center
                     rounded-xl bg-white/15 sm:flex"
              aria-hidden="true"
            >
              <mat-icon class="!h-8 !w-8 !text-3xl">
                school
              </mat-icon>
            </div>

            <div class="min-w-0">
              <h1
                class="text-base font-bold tracking-tight sm:text-xl"
              >
                Courses
              </h1>

              <p class="hidden text-xs text-teal-100 sm:block">
                Explore courses and start learning
              </p>
            </div>
          </div>

          <!-- Right: Search -->
          <div class="min-w-0 flex-1 md:ml-8">
            <div class="ml-auto max-w-2xl">
              <div
                class="group flex min-h-11 w-full items-center gap-3
                       rounded-xl border border-slate-200/80
                       bg-white px-3 py-2 shadow-md
                       transition-all duration-200
                       focus-within:border-teal-300
                       focus-within:ring-4
                       focus-within:ring-white/20
                       sm:min-h-12 sm:px-4"
              >
                <mat-icon
                  aria-hidden="true"
                  class="!h-5 !w-5 shrink-0 !text-xl !text-teal-700"
                >
                  search
                </mat-icon>

                <input
                  id="course-search"
                  type="search"
                  autocomplete="off"
                  [value]="searchTerm()"
                  (input)="
                    searchTerm.set($any($event.target).value)
                  "
                  placeholder="Search courses..."
                  aria-label="Search courses"
                  class="min-h-6 w-full min-w-0 flex-1 border-0
                         bg-transparent p-0 text-sm text-slate-900
                         outline-none placeholder:text-slate-400
                         focus:outline-none focus:ring-0 sm:text-base"
                />

                @if (searchTerm()) {
                  <button
                    type="button"
                    aria-label="Clear course search"
                    (click)="searchTerm.set('')"
                    class="inline-flex h-8 w-8 shrink-0
                           items-center justify-center rounded-lg
                           text-slate-500 transition
                           hover:bg-teal-50 hover:text-teal-800
                           focus:outline-none focus:ring-2
                           focus:ring-teal-600"
                  >
                    <mat-icon aria-hidden="true">
                      close
                    </mat-icon>
                  </button>
                }
              </div>
            </div>
          </div>

        </div>
      </header>


      <!-- =====================================================
           COURSE CONTENT
           ===================================================== -->

      <section
        class="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8"
      >

        <!-- Back navigation and course count -->
        <div
          class="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <a
            [routerLink]="[learnerBaseRoute()]"
            class="inline-flex min-h-10 items-center gap-2
                   rounded-lg text-sm font-medium text-[#007979]
                   transition hover:text-teal-900 hover:underline
                   focus:outline-none focus:ring-2
                   focus:ring-teal-600"
          >
            <span aria-hidden="true">←</span>
            Test Center
          </a>

          @if (!loading() && !error()) {
            <span class="text-sm text-gray-500">
              {{ filteredCourses().length }}
              {{ filteredCourses().length === 1 ? 'course' : 'courses' }}
            </span>
          }
        </div>


        <!-- Loading -->
        @if (loading()) {
          <div
            class="flex min-h-48 items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <div class="flex items-center gap-3">
              <span
                class="h-5 w-5 animate-spin rounded-full
                       border-2 border-teal-700
                       border-t-transparent"
                aria-hidden="true"
              ></span>

              <p class="text-sm text-gray-500">
                Loading courses...
              </p>
            </div>
          </div>
        }


        <!-- Error -->
        @else if (error()) {
          <div
            class="rounded-xl border border-red-200
                   bg-red-50 p-6 text-center"
            role="alert"
          >
            <mat-icon
              class="!h-8 !w-8 !text-3xl !text-red-600"
              aria-hidden="true"
            >
              error_outline
            </mat-icon>

            <p class="mt-2 font-medium text-red-700">
              {{ error() }}
            </p>

            <button
              type="button"
              (click)="loadCourses()"
              class="mt-4 rounded-lg bg-[#007979]
                     px-4 py-2 text-sm font-semibold
                     text-white transition hover:bg-[#006666]
                     focus:outline-none focus:ring-2
                     focus:ring-teal-600 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        }


        <!-- Empty results -->
        @else if (filteredCourses().length === 0) {
          <div
            class="rounded-2xl border border-gray-200
                   bg-white px-6 py-14 text-center shadow-sm"
          >
            <div
              class="mx-auto flex h-14 w-14 items-center
                     justify-center rounded-full bg-[#E5F4F4]
                     text-[#007979]"
            >
              <mat-icon
                class="!h-8 !w-8 !text-3xl"
                aria-hidden="true"
              >
                {{
                  searchTerm().trim()
                    ? 'search_off'
                    : 'menu_book'
                }}
              </mat-icon>
            </div>

            <h2
              class="mt-4 text-lg font-semibold text-[#032D42]"
            >
              {{
                searchTerm().trim()
                  ? 'No matching courses'
                  : 'No courses available'
              }}
            </h2>

            <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
              {{
                searchTerm().trim()
                  ? 'Try another search term or clear your search to see all available courses.'
                  : 'There are currently no active courses available in this learning area.'
              }}
            </p>

            @if (searchTerm().trim()) {
              <button
                type="button"
                (click)="searchTerm.set('')"
                class="mt-5 inline-flex items-center gap-2
                       rounded-lg border border-teal-700
                       px-4 py-2 text-sm font-semibold
                       text-teal-800 transition
                       hover:bg-teal-50"
              >
                <mat-icon aria-hidden="true">close</mat-icon>
                Clear search
              </button>
            }
          </div>
        }


        <!-- Course cards -->
        @else {
          <div
            class="grid grid-cols-1 gap-5
                   sm:grid-cols-2 lg:grid-cols-3"
          >
            @for (
              course of filteredCourses();
              track course.id
            ) {
              <a
                [routerLink]="[
                  learnerBaseRoute(),
                  'courses',
                  course.slug
                ]"
                class="group flex h-full flex-col rounded-2xl
                       border border-gray-200 bg-white p-6
                       shadow-sm transition-all duration-200
                       hover:-translate-y-0.5
                       hover:border-[#007979]/40
                       hover:shadow-md
                       focus:outline-none focus:ring-2
                       focus:ring-teal-600 focus:ring-offset-2"
              >

                <!-- Course scope -->
                <div class="mb-4 flex flex-wrap items-center gap-2">
                  @if (course.scope === 'platform') {
                    <span
                      class="inline-flex items-center gap-1.5
                             rounded-full bg-[#007979]/10
                             px-2.5 py-1 text-xs font-semibold
                             text-[#007979]"
                    >
                      <mat-icon
                        class="!h-4 !w-4 !text-base"
                        aria-hidden="true"
                      >
                        public
                      </mat-icon>

                      Zebron Course
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center gap-1.5
                             rounded-full bg-gray-100
                             px-2.5 py-1 text-xs font-semibold
                             text-gray-700"
                    >
                      <mat-icon
                        class="!h-4 !w-4 !text-base"
                        aria-hidden="true"
                      >
                        business
                      </mat-icon>

                      Organization Course
                    </span>
                  }
                </div>


                <!-- Course title -->
                <h2
                  class="text-lg font-bold text-[#032D42]
                         transition group-hover:text-[#007979]"
                >
                  {{ course.name }}
                </h2>


                <!-- Description -->
                @if (course.description) {
                  <p
                    class="mt-2 line-clamp-3 text-sm
                           leading-6 text-gray-600"
                  >
                    {{ course.description }}
                  </p>
                } @else {
                  <p
                    class="mt-2 text-sm italic text-gray-400"
                  >
                    No course description available.
                  </p>
                }


                <!-- Provider -->
                @if (course.provider) {
                  <p
                    class="mt-3 text-xs font-medium
                           text-gray-500"
                  >
                    {{ course.provider }}
                  </p>
                }


                <!-- Action -->
                <div
                  class="mt-auto flex items-center justify-between
                         border-t border-gray-100 pt-4 mt-5"
                >
                  <span
                    class="text-sm font-semibold text-[#007979]"
                  >
                    View course
                  </span>

                  <mat-icon
                    class="!transition-transform
                           group-hover:translate-x-1
                           !text-[#007979]"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </mat-icon>
                </div>

              </a>
            }
          </div>
        }

      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit {

  // =========================================================
  // Services
  // =========================================================

  private readonly courseService = inject(TestCourseService);
  private readonly route = inject(ActivatedRoute);


  // =========================================================
  // Route Context
  // =========================================================

  /**
   * Finds the organization ID anywhere in the active route hierarchy.
   * This supports nested organization-specific Test Center routes.
   */
  protected get organizationId(): string | null {
    for (const route of [...this.route.pathFromRoot].reverse()) {
      const organizationId =
        route.snapshot.paramMap.get('organizationId')?.trim();

      if (organizationId) {
        return organizationId;
      }
    }

    return null;
  }

  /**
   * Detects organization-specific routes so a missing organization ID
   * cannot silently fall back to the public platform course catalog.
   */
  private get isOrganizationRoute(): boolean {
    return this.route.pathFromRoot.some((route) =>
      route.routeConfig?.path
        ?.split('/')
        .includes(':organizationId'),
    );
  }

  /**
   * Maintains the appropriate route for platform and organization users.
   */
  protected learnerBaseRoute(): string {
    const organizationId = this.organizationId;

    return organizationId
      ? `/partner/org/${organizationId}/learn/test-center`
      : '/test-center';
  }


  // =========================================================
  // State
  // =========================================================

  protected readonly courses = signal<TestCourse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchTerm = signal('');

  /**
   * Filters the already-loaded courses locally.
   * Search does not issue additional Firestore requests.
   */
  protected readonly filteredCourses = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.courses();
    }

    return this.courses().filter((course) => {
      const searchableValues = [
        course.name,
        course.description,
        course.provider,
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(term),
      );
    });
  });


  // =========================================================
  // Initialization
  // =========================================================

  ngOnInit(): void {
    void this.loadCourses();
  }


  // =========================================================
  // Load Courses
  // =========================================================

  protected async loadCourses(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const organizationId = this.organizationId;

      // Fail closed if an organization route has no organization ID.
      if (this.isOrganizationRoute && !organizationId) {
        throw new Error(
          'The organization ID is missing from the course route.',
        );
      }

      const courses =
        await this.courseService.getAvailableCourses(
          organizationId,
        );

      this.courses.set(courses);
    } catch (error) {
      console.error(
        'Failed to load Test Center courses:',
        error,
      );

      this.courses.set([]);

      this.error.set(
        'Unable to load courses. Please try again later.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}


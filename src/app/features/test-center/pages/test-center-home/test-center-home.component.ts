import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TestCourse } from '../../models/test-course.model';
import { TestCourseService } from '../../services/test-course.service';
import { TestStore } from '../../store/test.store';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';

@Component({
  selector: 'app-test-center-home',

  standalone: true,

  imports: [RouterLink, MatIconModule],

  template: `
    <main class="min-h-screen bg-gray-50 mt-16">
      <!-- ===================================================
           SITE HEADER
           =================================================== -->

      <header class="border-b border-white/10 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-3 lg:px-8">
          <a
            routerLink="/"
            aria-label="Zebron home"
            class="inline-flex min-h-10 items-center gap-2 rounded-lg text-white transition focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            <div class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:flex" aria-hidden="true">
                <mat-icon class="!h-8 !w-8 !text-3xl">school</mat-icon>
              </div>
            <span class="text-lg font-bold tracking-tight sm:text-xl">Learning and assessment</span>
          </a>

          <nav class="hidden items-center gap-5 md:flex lg:gap-6" aria-label="Primary navigation">
            <a routerLink="/resources" class="min-h-11 inline-flex items-center text-sm font-medium text-white/90 transition hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">Resources</a>
            <a routerLink="/find" class="min-h-11 inline-flex items-center text-sm font-medium text-white/90 transition hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">Find Jobs</a>
            <a [routerLink]="learnerBaseRoute()" aria-current="page" class="min-h-11 inline-flex items-center border-b-2 border-teal-300 text-sm font-semibold text-teal-200">Test Center</a>
            <a routerLink="/about" class="min-h-11 inline-flex items-center text-sm font-medium text-white/90 transition hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">About</a>
            <a routerLink="/contact" class="min-h-11 inline-flex items-center text-sm font-medium text-white/90 transition hover:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">Contact</a>
          </nav>

          <a routerLink="/test-center" class="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-teal-300 md:hidden">
            <mat-icon aria-hidden="true" class="!h-5 !w-5 !text-xl">school</mat-icon>
            <span>Test Center</span>
          </a>
        </div>
      </header>

      <!-- ===================================================
           TEST CENTER HERO — aligned with the Organization
           Application header visual language
           =================================================== -->

      <section class="px-3 pt-4 sm:px-6 sm:pt-2 lg:px-8">
        <div class="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#e5f4f4] shadow-lg">
          <div class="px-5 py-2 sm:px-8 sm:py-4 lg:px-10 lg:py-4">
            <div class="flex items-start gap-4">
              <div class="min-w-0 flex-1">
                <p class="mt-1 max-w-2xl text-sm leading-6">
                  Prepare for certifications, courses, professional exams, and new skills with focused practice questions.
                </p>

                <!-- New form field styling: touch-friendly, responsive search -->
                <div class="mt-4 max-w-3xl">

                  <div class="group flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md transition-all duration-200 focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-white/25 sm:min-h-14 sm:px-5">
                    <mat-icon aria-hidden="true" class="!h-6 !w-6 shrink-0 !text-2xl !text-teal-700">search</mat-icon>

                    <input
                      id="test-center-search"
                      type="search"
                      autocomplete="off"
                      [value]="searchTerm()"
                      (input)="searchTerm.set($any($event.target).value)"
                      placeholder="Search courses, certifications, topics..."
                      aria-label="Search Test Center"
                      class="min-h-5 w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-sm"
                    />

                    @if (searchTerm()) {
                      <button
                        type="button"
                        aria-label="Clear search"
                        (click)="searchTerm.set('')"
                        class="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <mat-icon aria-hidden="true">close</mat-icon>
                      </button>
                    }
                  </div>
                  <p class="mt-2 text-xs leading-5 text-gray">Search by course name, certification, provider, or topic.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===================================================
           MAIN CONTENT
           =================================================== -->

      <section
        class="mx-auto
               max-w-7xl
               px-5
               py-7
               sm:px-6
               lg:px-8"
      >
        <!-- =================================================
             BROWSE
             ================================================= -->

        <div>
          <div class="mb-4">
            <h2
              class="text-xl
                     font-bold
                     text-[#032D42]"
            >
              Browse the Test Center
            </h2>

            <p
              class="mt-1
                     text-sm
                     text-gray-600"
            >
              Find practice material based on what you're learning.
            </p>
          </div>

          <div class="grid grid-cols-4 gap-2 sm:gap-3">
            <!-- Certifications -->

            <a
              routerLink="/test-center/certifications"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white p-2 sm:p-4 shadow-sm
                     transition-all
                     duration-200
                     hover:-translate-y-1
                     hover:border-[#12BFC3]
                     hover:bg-[#E5F4F4]
                     hover:shadow-md"
            >
              <div
                class="flex
                       h-8 w-8 sm:h-9 sm:w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true"> workspace_premium </mat-icon>
              </div>

              <h3
                class="mt-2 text-[13px] text-center leading-tight sm:mt-3 sm:text-sm font-bold
                       text-[#032D42]"
              >
                Certifications
              </h3>

              <p
                class="hidden sm:block mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Prepare for professional certification exams.
              </p>
            </a>

            <!-- Courses -->

            <a
              routerLink="/test-center/courses"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white p-2 sm:p-4 shadow-sm
                     transition-all
                     duration-200
                     hover:-translate-y-1
                     hover:border-[#12BFC3]
                     hover:bg-[#E5F4F4]
                     hover:shadow-md"
            >
              <div
                class="flex
                       h-8 w-8 sm:h-9 sm:w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true"> menu_book </mat-icon>
              </div>

              <h3
                class="mt-2 text-[13px] text-center leading-tight sm:mt-3 sm:text-sm font-bold
                       text-[#032D42]"
              >
                Courses
              </h3>

              <p
                class="hidden sm:block mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Practice what you're learning in a course or program.
              </p>
            </a>

            <!-- Subjects -->

            <a
              routerLink="/test-center/subjects"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white p-2 sm:p-4 shadow-sm
                     transition-all
                     duration-200
                     hover:-translate-y-1
                     hover:border-[#12BFC3]
                     hover:bg-[#E5F4F4]
                     hover:shadow-md"
            >
              <div
                class="flex
                       h-8 w-8 sm:h-9 sm:w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]
                       text-center"
              >
                <mat-icon aria-hidden="true" > school </mat-icon>
              </div>

              <h3
                class="mt-2 text-[13px] leading-tight sm:mt-3 text-center font-bold
                       text-[#032D42]"
              >
                Subjects
              </h3>

              <p
                class="hidden sm:block mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Test your knowledge across academic subjects.
              </p>
            </a>

            <!-- Skills -->

            <a
              routerLink="/test-center/skills"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white p-2 sm:p-4 shadow-sm
                     transition-all
                     duration-200
                     hover:-translate-y-1
                     hover:border-[#12BFC3]
                     hover:bg-[#E5F4F4]
                     hover:shadow-md"
            >
              <div
                class="flex
                       h-9
                       w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true"> psychology </mat-icon>
              </div>

              <h3
                class="mt-2 text-[13px] text-center leading-tight sm:mt-3 sm:text-sm font-bold
                       text-[#032D42]"
              >
                Skills
              </h3>

              <p
                class="hidden sm:block mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Strengthen practical and professional skills.
              </p>
            </a>
          </div>
        </div>

        <!-- =================================================
             POPULAR COURSES
             ================================================= -->

        <div class="mt-8">
          <div
            class="flex
                   items-end
                   justify-between
                   gap-4"
          >
            <div>
              <h2
                class="text-xl
                       font-bold
                       text-[#032D42]"
              >
                Popular Practice
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-gray-600"
              >
                Start practicing with available courses and certifications.
              </p>
            </div>

            <a
              routerLink="/test-center/courses"
              class="text-sm
                     font-semibold
                     text-[#007979]
                     transition
                     hover:text-[#032D42]"
            >
              View all →
            </a>
          </div>

          <!-- Loading -->

          @if (loading()) {
            <div
              class="mt-4
                     grid
                     gap-4
                     md:grid-cols-2
                     lg:grid-cols-3"
            >
              @for (item of [1, 2, 3]; track item) {
                <div
                  class="animate-pulse
                         rounded-xl
                         border
                         border-gray-200
                         bg-white
                         p-5"
                >
                  <div
                    class="h-10
                           w-10
                           rounded-lg
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-4
                           h-4
                           w-2/3
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2
                           h-3
                           w-1/3
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-4
                           h-3
                           w-full
                           rounded
                           bg-gray-200"
                  ></div>

                  <div
                    class="mt-2
                           h-3
                           w-5/6
                           rounded
                           bg-gray-200"
                  ></div>
                </div>
              }
            </div>
          }

          <!-- Error -->

          @if (!loading() && error()) {
            <div
              class="mt-4
                     rounded-xl
                     border
                     border-red-200
                     bg-red-50
                     p-4
                     text-sm
                     text-red-700"
            >
              {{ error() }}
            </div>
          }

          <!-- Courses -->

          @if (!loading() && !error()) {
            @if (filteredCourses().length > 0) {
              <div
                class="mt-4
                       grid
                       gap-4
                       md:grid-cols-2
                       lg:grid-cols-3"
              >
                @for (course of filteredCourses(); track course.id) {
                  <a
  [routerLink]="[
    learnerBaseRoute(),
    'courses',
    course.slug
  ]"
                    class="group
                           rounded-xl
                           border
                           border-gray-200
                           bg-white
                           p-5
                           shadow-sm
                           transition-all
                           duration-200
                           hover:-translate-y-1
                           hover:border-[#12BFC3]
                           hover:bg-[#E5F4F4]
                           hover:shadow-md"
                  >
                    <div
                      class="flex
                             items-start
                             justify-between
                             gap-4"
                    >
                      <div
                        class="flex
                               h-10
                               w-10
                               shrink-0
                               items-center
                               justify-center
                               rounded-lg
                               bg-[#E5F4F4]
                               text-[#007979]"
                      >
                        <mat-icon aria-hidden="true"> school </mat-icon>
                      </div>

                      @if (course.type === 'certification') {
                        <span
                          class="rounded-full
                                 bg-[#E5F4F4]
                                 px-2
                                 py-1
                                 text-[10px]
                                 font-semibold
                                 text-[#007979]"
                        >
                          Certification
                        </span>
                      }
                    </div>

                    <h3
                      class="mt-3
                             text-base
                             font-bold
                             leading-5
                             text-[#032D42]
                             group-hover:text-[#007979]"
                    >
                      {{ course.name }}
                    </h3>

                    @if (course.provider) {
                      <p
                        class="mt-1
                               text-xs
                               font-medium
                               text-[#007979]"
                      >
                        {{ course.provider }}
                      </p>
                    }

                    <p
                      class="mt-2
                             line-clamp-2
                             text-sm
                             leading-5
                             text-gray-600"
                    >
                      {{ course.description }}
                    </p>

                    <div
                      class="mt-4
                             flex
                             items-center
                             justify-between
                             border-t
                             border-gray-100
                             pt-3"
                    >
                      <span
                        class="text-xs
                               text-gray-500"
                      >
                        {{ course.questionCount }}
                        questions
                      </span>

                      <span
                        class="text-xs
                               font-semibold
                               text-[#007979]"
                      >
                        Practice →
                      </span>
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div
                class="mt-4
                       rounded-xl
                       border
                       border-dashed
                       border-gray-300
                       bg-white
                       px-6
                       py-10
                       text-center"
              >
                <div
                  class="mx-auto
                         flex
                         h-11
                         w-11
                         items-center
                         justify-center
                         rounded-full
                         bg-[#E5F4F4]
                         text-[#007979]"
                >
                  <mat-icon aria-hidden="true"> search_off </mat-icon>
                </div>

                <h3
                  class="mt-3
                         text-sm
                         font-bold
                         text-[#032D42]"
                >
                  No courses found
                </h3>

                <p
                  class="mt-1
                         text-xs
                         text-gray-600"
                >
                  Try another course, certification, or topic.
                </p>
              </div>
            }
          }
        </div>
      </section>
    </main>
  `,

  styles: [],
})
export class TestCenterHomeComponent implements OnInit {
  private readonly courseService = inject(TestCourseService);

  private readonly organizationContext = inject(OrganizationContextService);

  private readonly route = inject(ActivatedRoute);
private readonly router = inject(Router);

  /**
   * TestStore is injected now so the Test Center
   * follows the same state-management pattern as
   * the rest of the feature.
   */
  private readonly testStore = inject(TestStore);

  readonly courses = signal<TestCourse[]>([]);

  readonly searchTerm = signal('');

  readonly loading = signal(true);

  readonly error = signal('');

  /**
   * Filter courses locally so searching does not
   * create additional Firestore requests.
   */
  readonly filteredCourses = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.courses();
    }

    return this.courses().filter((course) => {
      return (
        course.name.toLowerCase().includes(search) ||
        course.description.toLowerCase().includes(search) ||
        course.provider?.toLowerCase().includes(search) ||
        course.certificationCode?.toLowerCase().includes(search)
      );
    });
  });

  readonly organizationId = computed(
  () => this.route.snapshot.paramMap.get('organizationId'),
);

readonly learnerBaseRoute = computed(() => {
  const organizationId = this.organizationId();

  return organizationId
    ? `/partner/org/${organizationId}/learn/test-center`
    : '/test-center';
});

openCourse(slug: string): void {
  void this.router.navigate([
    this.learnerBaseRoute(),
    'courses',
    slug,
  ]);
}

  async ngOnInit(): Promise<void> {
    try {
      this.loading.set(true);

      this.error.set('');

      const organizationId = this.organizationContext.organizationId();

      const courses = await this.courseService.getAvailableCourses(organizationId);

      this.courses.set(courses);
    } catch (error) {
      console.error('Failed to load Test Center courses:', error);

      this.error.set('We could not load the practice courses right now.');
    } finally {
      this.loading.set(false);
    }
  }
}

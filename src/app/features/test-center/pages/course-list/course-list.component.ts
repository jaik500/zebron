import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { TestCourseService } from '../../services/test-course.service';

import { TestCourse } from '../../models/test-course.model';


@Component({
  selector: 'app-course-list',
  standalone: true,

  imports: [
    RouterLink,
  ],

  template: `
    <main
      class="min-h-screen bg-gray-50"
    >

      <!-- =====================================================
           Header
           ===================================================== -->

      <section
        class="border-b
               border-gray-200
               bg-white"
      >
        <div
          class="mx-auto
                 max-w-7xl
                 px-4
                 py-10
                 sm:px-6
                 lg:px-8"
        >

          <a
            routerLink="/test-center"
            class="mb-4
                   inline-flex
                   items-center
                   gap-2
                   text-sm
                   font-medium
                   text-[#007979]
                   hover:underline"
          >
            <span aria-hidden="true">
              ←
            </span>

            Test Center
          </a>

          <h1
            class="text-3xl
                   font-bold
                   tracking-tight
                   text-[#032D42]
                   sm:text-4xl"
          >
            Courses
          </h1>

          <p
            class="mt-2
                   max-w-2xl
                   text-gray-600"
          >
            Explore available courses and choose a course
            to begin your preparation.
          </p>

        </div>
      </section>


      <!-- =====================================================
           Content
           ===================================================== -->

      <section
        class="mx-auto
               max-w-7xl
               px-4
               py-8
               sm:px-6
               lg:px-8"
      >

        <!-- Loading -->

        @if (loading()) {

          <div
            class="flex
                   min-h-48
                   items-center
                   justify-center"
          >
            <p
              class="text-sm
                     text-gray-500"
            >
              Loading courses...
            </p>
          </div>

        }


        <!-- Error -->

        @else if (error()) {

          <div
            class="rounded-xl
                   border
                   border-red-200
                   bg-red-50
                   p-6
                   text-center"
          >

            <p
              class="font-medium
                     text-red-700"
            >
              {{ error() }}
            </p>

            <button
              type="button"
              (click)="loadCourses()"
              class="mt-4
                     rounded-lg
                     bg-[#007979]
                     px-4
                     py-2
                     text-sm
                     font-semibold
                     text-white
                     hover:bg-[#006666]"
            >
              Try again
            </button>

          </div>

        }


        <!-- Empty -->

        @else if (courses().length === 0) {

          <div
            class="rounded-xl
                   border
                   border-gray-200
                   bg-white
                   p-10
                   text-center
                   shadow-sm"
          >

            <h2
              class="text-lg
                     font-semibold
                     text-[#032D42]"
            >
              No courses available
            </h2>

            <p
              class="mt-2
                     text-sm
                     text-gray-500"
            >
              There are currently no active courses available.
            </p>

          </div>

        }


        <!-- Courses -->

        @else {

          <div
            class="grid
                   grid-cols-1
                   gap-5
                   sm:grid-cols-2
                   lg:grid-cols-3"
          >

            @for (
              course of courses();
              track course.id
            ) {

              <a
                [routerLink]="[
                  '/test-center/courses',
                  course.slug
                ]"

                class="group
                       rounded-2xl
                       border
                       border-gray-200
                       bg-white
                       p-6
                       shadow-sm
                       transition
                       hover:-translate-y-0.5
                       hover:border-[#007979]/40
                       hover:shadow-md"
              >

                <!-- Course title -->

                <h2
                  class="text-lg
                         font-bold
                         text-[#032D42]
                         transition
                         group-hover:text-[#007979]"
                >
                  {{ course.name }}
                </h2>


                <!-- Description -->

                @if (course.description) {

                  <p
                    class="mt-2
                           line-clamp-3
                           text-sm
                           leading-6
                           text-gray-600"
                  >
                    {{ course.description }}
                  </p>

                }


                <!-- Action -->

                <div
                  class="mt-5
                         flex
                         items-center
                         justify-between"
                >

                  <span
                    class="text-sm
                           font-semibold
                           text-[#007979]"
                  >
                    View course
                  </span>

                  <span
                    class="text-lg
                           text-[#007979]
                           transition
                           group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>

                </div>

              </a>

            }

          </div>

        }

      </section>

    </main>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent
  implements OnInit {

  // =========================================================
  // Services
  // =========================================================

  private readonly courseService =
    inject(TestCourseService);


  // =========================================================
  // State
  // =========================================================

  protected readonly courses =
    signal<TestCourse[]>([]);

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);


  // =========================================================
  // Initialization
  // =========================================================

  ngOnInit(): void {
    this.loadCourses();
  }


  // =========================================================
  // Load Courses
  // =========================================================

  protected async loadCourses(): Promise<void> {

    this.loading.set(true);

    this.error.set(null);

    try {

      const courses =
        await this.courseService.getActiveCourses();

      this.courses.set(courses);

    } catch (error) {

      console.error(
        'Failed to load courses:',
        error,
      );

      this.error.set(
        'Unable to load courses. Please try again later.',
      );

    } finally {

      this.loading.set(false);
    }
  }
}

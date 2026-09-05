import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TestCourse } from '../../models/test-course.model';
import { TestCourseService } from '../../services/test-course.service';
import { TestStore } from '../../store/test.store';


@Component({
  selector: 'app-test-center-home',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule,
  ],

  template: `

    <main class="min-h-screen bg-gray-50">

      <!-- ===================================================
           HEADER
           =================================================== -->

      <header
        class="border-b
               border-white/10
               bg-[#032D42]"
      >

        <div
          class="mx-auto
                 flex
                 max-w-7xl
                 items-center
                 justify-between
                 gap-4
                 px-5
                 py-2
                 sm:px-6
                 lg:px-8"
        >

          <!-- Logo -->

          <a
            routerLink="/"
            aria-label="Zebron home"
            class="flex
                   items-center
                   gap-2
                   text-white"
          >

            <img
              src="/zebron-favicon.svg"
              alt=""
              class="h-7 w-7"
            />

            <span
              class="text-lg
                     font-bold
                     tracking-tight"
            >
              Zebron
            </span>

          </a>


          <!-- Navigation -->

          <nav
            class="hidden
                   items-center
                   gap-6
                   md:flex"
            aria-label="Primary navigation"
          >

            <a
              routerLink="/resources"
              class="text-sm
                     font-medium
                     text-white
                     transition
                     hover:text-[#12BFC3]"
            >
              Resources
            </a>

            <a
              routerLink="/find"
              class="text-sm
                     font-medium
                     text-white
                     transition
                     hover:text-[#12BFC3]"
            >
              Find Jobs
            </a>

            <a
              routerLink="/test-center"
              class="text-sm
                     font-semibold
                     text-[#12BFC3]"
              aria-current="page"
            >
              Test Center
            </a>

            <a
              routerLink="/about"
              class="text-sm
                     font-medium
                     text-white
                     transition
                     hover:text-[#12BFC3]"
            >
              About
            </a>

            <a
              routerLink="/contact"
              class="text-sm
                     font-medium
                     text-white
                     transition
                     hover:text-[#12BFC3]"
            >
              Contact
            </a>

          </nav>

        </div>

      </header>


      <!-- ===================================================
           HERO
           =================================================== -->

      <section
        class="bg-[#032D42]
               px-5
               pb-8
               pt-7
               text-white
               sm:px-6
               lg:px-8"
      >

        <div
          class="mx-auto
                 max-w-7xl"
        >

          <div class="max-w-3xl">

            <p
              class="text-xs
                     font-bold
                     uppercase
                     tracking-[0.18em]
                     text-[#7DD3D3]"
            >
              Zebron Test Center
            </p>


            <h1
              class="mt-1.5
                     text-3xl
                     font-bold
                     tracking-tight
                     sm:text-4xl"
            >
              Practice. Learn. Get Ready.
            </h1>


            <p
              class="mt-2
                     max-w-2xl
                     text-sm
                     leading-5
                     text-blue-100
                     sm:text-base
                     sm:leading-6"
            >
              Prepare for certifications, courses,
              professional exams, and new skills with
              focused practice questions.
            </p>


            <!-- Search -->

            <div
              class="mt-5
                     flex
                     max-w-2xl
                     items-center
                     gap-2
                     rounded-xl
                     bg-white
                     px-3
                     py-2.5
                     shadow-lg"
            >

              <mat-icon
                aria-hidden="true"
                class="!text-gray-400"
              >
                search
              </mat-icon>

              <input
                type="search"
                [value]="searchTerm()"
                (input)="
                  searchTerm.set(
                    $any($event.target).value
                  )
                "
                placeholder="Search courses, certifications, topics..."
                aria-label="Search Test Center"
                class="w-full
                       border-0
                       bg-transparent
                       text-sm
                       text-gray-900
                       outline-none
                       placeholder:text-gray-400"
              />

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
              Find practice material based on
              what you're learning.
            </p>

          </div>


          <div
            class="grid
                   gap-3
                   sm:grid-cols-2
                   lg:grid-cols-4"
          >

            <!-- Certifications -->

            <a
              routerLink="/test-center/certifications"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-4
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
                       h-9
                       w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true">
                  workspace_premium
                </mat-icon>
              </div>

              <h3
                class="mt-3
                       text-sm
                       font-bold
                       text-[#032D42]"
              >
                Certifications
              </h3>

              <p
                class="mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Prepare for professional
                certification exams.
              </p>

            </a>


            <!-- Courses -->

            <a
              routerLink="/test-center/courses"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-4
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
                       h-9
                       w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true">
                  menu_book
                </mat-icon>
              </div>

              <h3
                class="mt-3
                       text-sm
                       font-bold
                       text-[#032D42]"
              >
                Courses
              </h3>

              <p
                class="mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Practice what you're learning
                in a course or program.
              </p>

            </a>


            <!-- Subjects -->

            <a
              routerLink="/test-center/subjects"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-4
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
                       h-9
                       w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true">
                  school
                </mat-icon>
              </div>

              <h3
                class="mt-3
                       text-sm
                       font-bold
                       text-[#032D42]"
              >
                Subjects
              </h3>

              <p
                class="mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Test your knowledge across
                academic subjects.
              </p>

            </a>


            <!-- Skills -->

            <a
              routerLink="/test-center/skills"
              class="group
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     p-4
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
                       h-9
                       w-9
                       items-center
                       justify-center
                       rounded-lg
                       bg-[#E5F4F4]
                       text-[#007979]"
              >
                <mat-icon aria-hidden="true">
                  psychology
                </mat-icon>
              </div>

              <h3
                class="mt-3
                       text-sm
                       font-bold
                       text-[#032D42]"
              >
                Skills
              </h3>

              <p
                class="mt-1
                       text-xs
                       leading-5
                       text-gray-600"
              >
                Strengthen practical and
                professional skills.
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
                Start practicing with available
                courses and certifications.
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

              @for (
                item of [1, 2, 3];
                track item
              ) {

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

                @for (
                  course of filteredCourses();
                  track course.id
                ) {

                  <a
                    [routerLink]="[
                      '/test-center/courses',
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

                        <mat-icon aria-hidden="true">
                          school
                        </mat-icon>

                      </div>


                      @if (
                        course.type ===
                        'certification'
                      ) {

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

                  <mat-icon aria-hidden="true">
                    search_off
                  </mat-icon>

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
                  Try another course, certification,
                  or topic.
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
export class TestCenterHomeComponent
  implements OnInit {

  private readonly courseService =
    inject(TestCourseService);

  /**
   * TestStore is injected now so the Test Center
   * follows the same state-management pattern as
   * the rest of the feature.
   */
  private readonly testStore =
    inject(TestStore);


  readonly courses =
    signal<TestCourse[]>([]);

  readonly searchTerm =
    signal('');

  readonly loading =
    signal(true);

  readonly error =
    signal('');


  /**
   * Filter courses locally so searching does not
   * create additional Firestore requests.
   */
  readonly filteredCourses =
    computed(() => {

      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      if (!search) {
        return this.courses();
      }

      return this.courses().filter(
        (course) => {

          return (
            course.name
              .toLowerCase()
              .includes(search) ||

            course.description
              .toLowerCase()
              .includes(search) ||

            course.provider
              ?.toLowerCase()
              .includes(search) ||

            course.certificationCode
              ?.toLowerCase()
              .includes(search)
          );

        },
      );
    });


  async ngOnInit(): Promise<void> {

    try {

      this.loading.set(true);

      this.error.set('');

      const courses =
        await this.courseService
          .getActiveCourses();

      this.courses.set(courses);

    } catch (error) {

      console.error(
        'Failed to load Test Center courses:',
        error,
      );

      this.error.set(
        'We could not load the practice courses right now.',
      );

    } finally {

      this.loading.set(false);

    }

  }
}
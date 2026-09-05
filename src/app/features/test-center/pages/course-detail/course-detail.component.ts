import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TestCourse } from '../../models/test-course.model';
import { TestCourseService } from '../../services/test-course.service';
import { TestStore } from '../../store/test.store';


@Component({
  selector: 'app-test-course-detail',

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

          <!-- Zebron logo -->

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


          <!-- Desktop navigation -->

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
           LOADING COURSE
           =================================================== -->

      @if (loading()) {

        <section
          class="mx-auto
                 max-w-5xl
                 px-5
                 py-12
                 text-center
                 sm:px-6
                 lg:px-8"
        >

          <div
            class="mx-auto
                   h-8
                   w-8
                   animate-spin
                   rounded-full
                   border-4
                   border-[#E5F4F4]
                   border-t-[#007979]"
            aria-label="Loading"
          ></div>


          <p
            class="mt-3
                   text-sm
                   text-gray-500"
          >
            Loading course...
          </p>

        </section>

      }


      <!-- ===================================================
           COURSE ERROR
           =================================================== -->

      @if (!loading() && error()) {

        <section
          class="mx-auto
                 max-w-5xl
                 px-5
                 py-10
                 sm:px-6
                 lg:px-8"
        >

          <div
            class="rounded-xl
                   border
                   border-red-200
                   bg-red-50
                   p-6
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
                     bg-red-100
                     text-red-600"
            >

              <mat-icon aria-hidden="true">
                error_outline
              </mat-icon>

            </div>


            <h1
              class="mt-3
                     text-lg
                     font-bold
                     text-gray-900"
            >
              Course not found
            </h1>


            <p
              class="mt-1
                     text-sm
                     text-gray-600"
            >
              {{ error() }}
            </p>


            <a
              routerLink="/test-center"
              class="mt-4
                     inline-flex
                     rounded-lg
                     bg-[#007979]
                     px-4
                     py-2
                     text-sm
                     font-semibold
                     text-white
                     transition
                     hover:bg-[#006666]"
            >
              Back to Test Center
            </a>

          </div>

        </section>

      }


      <!-- ===================================================
           COURSE CONTENT
           =================================================== -->

      @if (!loading() && !error() && course()) {

        <!-- ================================================
             COURSE HERO
             ================================================ -->

        <section
          class="bg-[#032D42]
                 px-5
                 py-7
                 text-white
                 sm:px-6
                 lg:px-8"
        >

          <div
            class="mx-auto
                   max-w-5xl"
          >

            <!-- Back link -->

            <a
              routerLink="/test-center"
              class="inline-flex
                     items-center
                     gap-1
                     text-sm
                     font-semibold
                     text-white/75
                     transition
                     hover:text-white"
            >
              ← Test Center
            </a>


            <div
              class="mt-5
                     flex
                     flex-col
                     gap-5
                     sm:flex-row
                     sm:items-start
                     sm:justify-between"
            >

              <!-- Course information -->

              <div class="max-w-3xl">

                <div
                  class="flex
                         flex-wrap
                         items-center
                         gap-2"
                >

                  <span
                    class="rounded-full
                           bg-[#12BFC3]/15
                           px-2.5
                           py-1
                           text-[10px]
                           font-bold
                           uppercase
                           tracking-wider
                           text-[#7DD3D3]"
                  >
                    {{ course()!.type }}
                  </span>


                  @if (course()!.certificationCode) {

                    <span
                      class="rounded-full
                             border
                             border-white/20
                             px-2.5
                             py-1
                             text-[10px]
                             font-semibold
                             text-white/80"
                    >
                      {{ course()!.certificationCode }}
                    </span>

                  }

                </div>


                <h1
                  class="mt-2
                         text-2xl
                         font-bold
                         tracking-tight
                         sm:text-3xl"
                >
                  {{ course()!.name }}
                </h1>


                @if (course()!.provider) {

                  <p
                    class="mt-1
                           text-sm
                           font-medium
                           text-[#7DD3D3]"
                  >
                    {{ course()!.provider }}
                  </p>

                }


                @if (course()!.description) {

                  <p
                    class="mt-3
                           max-w-2xl
                           text-sm
                           leading-6
                           text-blue-100
                           sm:text-base"
                  >
                    {{ course()!.description }}
                  </p>

                }

              </div>


              <!-- Question count -->

              <div
                class="shrink-0
                       rounded-xl
                       border
                       border-white/10
                       bg-white/5
                       px-5
                       py-4
                       sm:min-w-40
                       sm:text-center"
              >

                <p
                  class="text-2xl
                         font-bold
                         text-white"
                >
                  {{ course()!.questionCount }}
                </p>


                <p
                  class="text-xs
                         text-white/65"
                >
                  practice questions
                </p>

              </div>

            </div>

          </div>

        </section>


        <!-- ================================================
             TOPIC SELECTION
             ================================================ -->

        <section
          class="mx-auto
                 max-w-5xl
                 px-5
                 py-7
                 sm:px-6
                 lg:px-8"
        >

          <div
            class="grid
                   gap-7
                   lg:grid-cols-[1fr_280px]"
          >

            <!-- ============================================
                 TOPICS
                 ============================================ -->

            <div>

              <div>

                <h2
                  class="text-xl
                         font-bold
                         text-[#032D42]"
                >
                  Choose your topics
                </h2>


                <p
                  class="mt-1
                         text-sm
                         text-gray-600"
                >
                  Select the areas you want to practice.
                  You can choose one or several topics.
                </p>

              </div>


              <!-- ==========================================
                   SELECT ALL
                   ========================================== -->

              @if (topics().length > 0) {

                <div
                  class="mt-4
                         flex
                         items-center
                         justify-between
                         gap-4
                         rounded-lg
                         border
                         border-gray-200
                         bg-white
                         px-4
                         py-3"
                >

                  <div>

                    <p
                      class="text-sm
                             font-semibold
                             text-[#032D42]"
                    >
                      Select all topics
                    </p>


                    <p
                      class="text-xs
                             text-gray-500"
                    >
                      Practice across the entire course.
                    </p>

                  </div>


                  <button
                    type="button"
                    class="shrink-0
                           rounded-lg
                           border
                           border-[#007979]
                           px-3
                           py-1.5
                           text-xs
                           font-semibold
                           text-[#007979]
                           transition
                           hover:bg-[#E5F4F4]"
                    (click)="toggleAllTopics()"
                  >
                    {{
                      allTopicsSelected()
                        ? 'Clear all'
                        : 'Select all'
                    }}
                  </button>

                </div>

              }


              <!-- ==========================================
                   TOPIC LOADING
                   ========================================== -->

              @if (topicsLoading()) {

                <div
                  class="mt-4
                         rounded-xl
                         border
                         border-gray-200
                         bg-white
                         p-8
                         text-center"
                >

                  <div
                    class="mx-auto
                           h-7
                           w-7
                           animate-spin
                           rounded-full
                           border-4
                           border-[#E5F4F4]
                           border-t-[#007979]"
                    aria-label="Loading topics"
                  ></div>


                  <p
                    class="mt-2
                           text-sm
                           text-gray-500"
                  >
                    Loading topics...
                  </p>

                </div>

              }


              <!-- ==========================================
                   TOPIC ERROR
                   ========================================== -->

              @if (
                !topicsLoading() &&
                topicsError()
              ) {

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
                  {{ topicsError() }}
                </div>

              }


              <!-- ==========================================
                   TOPIC LIST
                   ========================================== -->

              @if (
                !topicsLoading() &&
                !topicsError() &&
                topics().length > 0
              ) {

                <div
                  class="mt-4
                         space-y-2.5"
                >

                  @for (
                    topic of topics();
                    track topic.id
                  ) {

                    <button
                      type="button"
                      class="flex
                             w-full
                             items-center
                             gap-4
                             rounded-xl
                             border
                             p-4
                             text-left
                             transition-all
                             duration-200"
                      [class.border-[#12BFC3]]="
                        isSelected(topic.id)
                      "
                      [class.bg-[#E5F4F4]]="
                        isSelected(topic.id)
                      "
                      [class.border-gray-200]="
                        !isSelected(topic.id)
                      "
                      [class.bg-white]="
                        !isSelected(topic.id)
                      "
                      [class.hover:border-[#12BFC3]]="
                        !isSelected(topic.id)
                      "
                      [class.hover:bg-[#E5F4F4]]="
                        !isSelected(topic.id)
                      "
                      (click)="toggleTopic(topic.id)"
                    >

                      <!-- Selection indicator -->

                      <span
                        class="flex
                               h-5
                               w-5
                               shrink-0
                               items-center
                               justify-center
                               rounded
                               border
                               transition"
                        [class.border-[#007979]]="
                          isSelected(topic.id)
                        "
                        [class.bg-[#007979]]="
                          isSelected(topic.id)
                        "
                        [class.border-gray-300]="
                          !isSelected(topic.id)
                        "
                      >

                        @if (isSelected(topic.id)) {

                          <mat-icon
                            class="!h-4
                                   !w-4
                                   !text-base
                                   !leading-4
                                   !text-white"
                            aria-hidden="true"
                          >
                            check
                          </mat-icon>

                        }

                      </span>


                      <!-- Topic -->

                      <span
                        class="min-w-0
                               flex-1"
                      >

                        <span
                          class="block
                                 text-sm
                                 font-bold
                                 text-[#032D42]"
                        >
                          {{ topic.name }}
                        </span>


                        @if (topic.description) {

                          <span
                            class="mt-0.5
                                   block
                                   text-xs
                                   leading-5
                                   text-gray-600"
                          >
                            {{ topic.description }}
                          </span>

                        }

                      </span>


                      <!-- Question count -->

                      <span
                        class="shrink-0
                               text-xs
                               font-medium
                               text-gray-500"
                      >
                        {{ topic.questionCount }}
                        questions
                      </span>

                    </button>

                  }

                </div>

              }


              <!-- ==========================================
                   NO TOPICS
                   ========================================== -->

              @if (
                !topicsLoading() &&
                !topicsError() &&
                topics().length === 0
              ) {

                <div
                  class="mt-4
                         rounded-xl
                         border
                         border-dashed
                         border-gray-300
                         bg-white
                         p-8
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
                      topic
                    </mat-icon>

                  </div>


                  <h3
                    class="mt-3
                           text-sm
                           font-bold
                           text-[#032D42]"
                  >
                    Topics are coming soon
                  </h3>


                  <p
                    class="mt-1
                           text-xs
                           text-gray-600"
                  >
                    Practice topics for this course
                    haven't been published yet.
                  </p>

                </div>

              }

            </div>


            <!-- ============================================
                 PRACTICE SUMMARY
                 ============================================ -->

            <aside>

              <div
                class="sticky
                       top-4
                       rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >

                <div
                  class="flex
                         h-10
                         w-10
                         items-center
                         justify-center
                         rounded-lg
                         bg-[#E5F4F4]
                         text-[#007979]"
                >

                  <mat-icon aria-hidden="true">
                    quiz
                  </mat-icon>

                </div>


                <h2
                  class="mt-3
                         text-base
                         font-bold
                         text-[#032D42]"
                >
                  Your practice test
                </h2>


                <dl
                  class="mt-4
                         space-y-3"
                >

                  <div
                    class="flex
                           items-center
                           justify-between
                           gap-4"
                  >

                    <dt
                      class="text-sm
                             text-gray-600"
                    >
                      Topics
                    </dt>


                    <dd
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      {{ selectedTopicCount() }}
                    </dd>

                  </div>


                  <div
                    class="flex
                           items-center
                           justify-between
                           gap-4"
                  >

                    <dt
                      class="text-sm
                             text-gray-600"
                    >
                      Questions
                    </dt>


                    <dd
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      {{ selectedQuestionCount() }}
                    </dd>

                  </div>

                </dl>


                <div
                  class="my-4
                         border-t
                         border-gray-100"
                ></div>


                <p
                  class="text-xs
                         leading-5
                         text-gray-500"
                >
                  Select the topics you want to practice.
                  You can configure the number and
                  difficulty of questions next.
                </p>


                <button
                  type="button"
                  class="mt-5
                         w-full
                         rounded-lg
                         bg-[#007979]
                         px-4
                         py-3
                         text-sm
                         font-bold
                         text-white
                         shadow-sm
                         transition
                         hover:bg-[#006666]
                         disabled:cursor-not-allowed
                         disabled:bg-gray-300"
                  [disabled]="selectedTopicCount() === 0"
                  (click)="continueToSetup()"
                >
                  Continue →
                </button>


                @if (selectedTopicCount() === 0) {

                  <p
                    class="mt-2
                           text-center
                           text-[11px]
                           text-gray-500"
                  >
                    Select at least one topic
                  </p>

                }

              </div>

            </aside>

          </div>

        </section>

      }

    </main>
  `,

  styles: [],
})
export class TestCourseDetailComponent
  implements OnInit {

  // =====================================================
  // DEPENDENCIES
  // =====================================================

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly courseService =
    inject(TestCourseService);

  private readonly testStore =
    inject(TestStore);


  // =====================================================
  // COURSE STATE
  // =====================================================

  readonly course =
    signal<TestCourse | null>(null);

  readonly loading =
    signal(true);

  readonly error =
    signal('');


  // =====================================================
  // TEST STORE STATE
  // =====================================================

  /**
   * Topics are owned by TestStore.
   *
   * The component reads the signal directly from
   * the store instead of maintaining another topics
   * signal locally.
   */
  readonly topics =
    this.testStore.topics;


  /**
   * Selected topics are also owned by TestStore.
   */
  readonly selectedTopics =
    this.testStore.selectedTopicIds;


  /**
   * Topic loading/error state is owned by TestStore.
   */
  readonly topicsLoading =
    this.testStore.loading;


  readonly topicsError =
    this.testStore.error;


  // =====================================================
  // DERIVED STATE
  // =====================================================

  readonly selectedTopicCount =
    computed(() =>
      this.selectedTopics().length,
    );


 readonly selectedQuestionCount =
  this.testStore.selectedTopicQuestionCount;

  readonly allTopicsSelected =
    computed(() => {

      const topics =
        this.topics();

      const selected =
        this.selectedTopics();

      return (
        topics.length > 0 &&
        topics.every(
          (topic) =>
            selected.includes(topic.id),
        )
      );
    });


  // =====================================================
  // INITIALIZATION
  // =====================================================

  async ngOnInit(): Promise<void> {

    const slug =
      this.route.snapshot.paramMap.get(
        'slug',
      );


    if (!slug) {

      this.error.set(
        'The course could not be identified.',
      );

      this.loading.set(false);

      return;
    }


    try {

      this.loading.set(true);

      this.error.set('');


      // -----------------------------------------------
      // Load course
      // -----------------------------------------------

      const course =
        await this.courseService
          .getCourseBySlug(slug);


      if (!course) {

        this.error.set(
          'The course you requested could not be found.',
        );

        return;
      }


      this.course.set(course);


      // -----------------------------------------------
      // Store the selected course
      // -----------------------------------------------

      this.testStore.setCourse(course);


      // -----------------------------------------------
      // Load topics through TestStore
      // -----------------------------------------------

      await this.testStore
        .loadTopics(course.id);


    } catch (error) {

      console.error(
        'Failed to load Test Center course:',
        error,
      );


      this.error.set(
        'We could not load this course right now.',
      );

    } finally {

      this.loading.set(false);

    }

  }


  // =====================================================
  // TOPIC SELECTION
  // =====================================================

  toggleTopic(
    topicId: string,
  ): void {

    this.testStore.toggleTopic(
      topicId,
    );

  }


  isSelected(
    topicId: string,
  ): boolean {

    return this.selectedTopics()
      .includes(topicId);

  }


  toggleAllTopics(): void {

    if (this.allTopicsSelected()) {

      this.testStore.setTopics([]);

      return;
    }


    this.testStore.setTopics(
      this.topics().map(
        (topic) => topic.id,
      ),
    );

  }


  // =====================================================
  // CONTINUE TO SETUP
  // =====================================================

  continueToSetup(): void {

    const course =
      this.course();

    const topics =
      this.selectedTopics();


    if (
      !course ||
      topics.length === 0
    ) {

      return;
    }


    /*
     * Course and topics are already in TestStore.
     *
     * We explicitly set them here as well so that
     * the transition into Test Setup is deterministic.
     */

    this.testStore.setCourse(
      course,
    );

    this.testStore.setTopics(
      topics,
    );


    this.router.navigate([
      '/test-center/setup',
    ]);

  }

}
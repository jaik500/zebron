import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressBarModule,
} from '@angular/material/progress-bar';

import {
  MatChipsModule,
} from '@angular/material/chips';

import {
  MatDividerModule,
} from '@angular/material/divider';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  AuthService,
} from '../../../core/services/auth.service';

import {
  LoggerService,
} from '../../../core/services/logger.service';





@Component({
  selector:
    'app-learning-lab',

  standalone: true,

  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="min-h-screen bg-slate-50"
    >

      <!-- =====================================================
           PAGE HEADER
           ===================================================== -->

      <section
        class="border-b bg-white"
      >
        <div
          class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >

          <div
            class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
          >

            <div>

              <div
                class="mb-3 flex items-center gap-2 text-sm text-slate-500"
              >
                <mat-icon
                  class="!text-lg"
                >
                  school
                </mat-icon>

                Learning Lab
              </div>

              <h1
                class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Your Learning Journey
              </h1>

              <p
                class="mt-2 max-w-2xl text-base leading-7 text-slate-600"
              >
                Track your learning activities, monitor progress,
                build skills, and celebrate your achievements.
              </p>

            </div>


            <div
              class="flex flex-wrap gap-3"
            >

              <a
                mat-flat-button
                routerLink="/test-center"
              >
                <mat-icon>
                  quiz
                </mat-icon>

                Take a Test
              </a>

              <a
                mat-stroked-button
                routerLink="/find/training"
              >
                <mat-icon>
                  school
                </mat-icon>

                Find Training
              </a>

            </div>

          </div>

        </div>
      </section>


      <!-- =====================================================
           DASHBOARD CONTENT
           ===================================================== -->

      <main
        class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >


        <!-- ===================================================
             SUMMARY CARDS
             =================================================== -->

        <section
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >

          <!-- Courses -->
          <mat-card
            class="!rounded-2xl"
          >
            <mat-card-content
              class="!p-5"
            >

              <div
                class="flex items-start justify-between"
              >

                <div>

                  <p
                    class="text-sm font-medium text-slate-500"
                  >
                    Courses Started
                  </p>

                  <p
                    class="mt-2 text-3xl font-bold text-slate-900"
                  >
                    {{ coursesStarted() }}
                  </p>

                </div>

                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50"
                >
                  <mat-icon
                    class="!text-blue-600"
                  >
                    menu_book
                  </mat-icon>
                </div>

              </div>

              <p
                class="mt-3 text-sm text-slate-500"
              >
                {{ coursesCompleted() }} completed
              </p>

            </mat-card-content>
          </mat-card>


          <!-- Tests -->
          <mat-card
            class="!rounded-2xl"
          >
            <mat-card-content
              class="!p-5"
            >

              <div
                class="flex items-start justify-between"
              >

                <div>

                  <p
                    class="text-sm font-medium text-slate-500"
                  >
                    Tests Completed
                  </p>

                  <p
                    class="mt-2 text-3xl font-bold text-slate-900"
                  >
                    {{ testsCompleted() }}
                  </p>

                </div>

                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50"
                >
                  <mat-icon
                    class="!text-purple-600"
                  >
                    task_alt
                  </mat-icon>
                </div>

              </div>

              <p
                class="mt-3 text-sm text-slate-500"
              >
                {{ averageTestScore() }}% average score
              </p>

            </mat-card-content>
          </mat-card>


          <!-- Learning Hours -->
          <mat-card
            class="!rounded-2xl"
          >
            <mat-card-content
              class="!p-5"
            >

              <div
                class="flex items-start justify-between"
              >

                <div>

                  <p
                    class="text-sm font-medium text-slate-500"
                  >
                    Learning Hours
                  </p>

                  <p
                    class="mt-2 text-3xl font-bold text-slate-900"
                  >
                    {{ learningHours() }}
                  </p>

                </div>

                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"
                >
                  <mat-icon
                    class="!text-emerald-600"
                  >
                    schedule
                  </mat-icon>
                </div>

              </div>

              <p
                class="mt-3 text-sm text-slate-500"
              >
                {{ learningHoursThisWeek() }} hours this week
              </p>

            </mat-card-content>
          </mat-card>


          <!-- Achievements -->
          <mat-card
            class="!rounded-2xl"
          >
            <mat-card-content
              class="!p-5"
            >

              <div
                class="flex items-start justify-between"
              >

                <div>

                  <p
                    class="text-sm font-medium text-slate-500"
                  >
                    Achievements
                  </p>

                  <p
                    class="mt-2 text-3xl font-bold text-slate-900"
                  >
                    {{ earnedAchievements() }}
                  </p>

                </div>

                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50"
                >
                  <mat-icon
                    class="!text-amber-600"
                  >
                    emoji_events
                  </mat-icon>
                </div>

              </div>

              <p
                class="mt-3 text-sm text-slate-500"
              >
                {{ totalAchievements() }} available
              </p>

            </mat-card-content>
          </mat-card>

        </section>


        <!-- ===================================================
             OVERALL PROGRESS
             =================================================== -->

        <section
          class="mt-6"
        >

          <mat-card
            class="!rounded-2xl"
          >

            <mat-card-content
              class="!p-6"
            >

              <div
                class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>

                  <h2
                    class="text-xl font-semibold text-slate-900"
                  >
                    Overall Learning Progress
                  </h2>

                  <p
                    class="mt-1 text-sm text-slate-500"
                  >
                    Keep building your knowledge and skills.
                  </p>

                </div>

                <span
                  class="text-2xl font-bold text-slate-900"
                >
                  {{ overallProgress() }}%
                </span>

              </div>

              <mat-progress-bar
                class="mt-5"
                mode="determinate"
                [value]="overallProgress()"
              />

              <div
                class="mt-3 flex justify-between text-xs text-slate-500"
              >
                <span>
                  {{ completedActivities() }}
                  activities completed
                </span>

                <span>
                  {{ totalActivities() }}
                  total activities
                </span>
              </div>

            </mat-card-content>

          </mat-card>

        </section>


        <!-- ===================================================
             MAIN DASHBOARD GRID
             =================================================== -->

        <section
          class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >


          <!-- ===============================================
               CONTINUE LEARNING
               =============================================== -->

          <mat-card
            class="!rounded-2xl lg:col-span-2"
          >

            <mat-card-content
              class="!p-6"
            >

              <div
                class="flex items-center justify-between"
              >

                <div>

                  <h2
                    class="text-xl font-semibold text-slate-900"
                  >
                    Continue Learning
                  </h2>

                  <p
                    class="mt-1 text-sm text-slate-500"
                  >
                    Pick up where you left off.
                  </p>

                </div>

                <a
                  mat-button
                  routerLink="/find/training"
                >
                  View All
                </a>

              </div>


              <div
                class="mt-5 space-y-4"
              >

                @for (
                  activity of activeActivities();
                  track activity.id
                ) {

                  <div
                    class="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >

                    <div
                      class="flex items-start gap-4"
                    >

                      <div
                        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100"
                      >

                        <mat-icon>
                          {{ activityIcon(activity.type) }}
                        </mat-icon>

                      </div>


                      <div
                        class="min-w-0 flex-1"
                      >

                        <div
                          class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                        >

                          <div>

                            <h3
                              class="font-medium text-slate-900"
                            >
                              {{ activity.title }}
                            </h3>

                            <p
                              class="text-sm text-slate-500"
                            >
                              {{ activity.category }}
                            </p>

                          </div>

                          <span
                            class="text-sm font-semibold text-slate-700"
                          >
                            {{ activity.progress }}%
                          </span>

                        </div>


                        <mat-progress-bar
                          class="mt-3"
                          mode="determinate"
                          [value]="activity.progress"
                        />

                      </div>


                      @if (activity.route) {

                        <a
                          mat-icon-button
                          [routerLink]="activity.route"
                          matTooltip="Continue"
                          [attr.aria-label]="'Continue ' + activity.title"
                        >
                          <mat-icon>
                            arrow_forward
                          </mat-icon>
                        </a>

                      }

                    </div>

                  </div>

                }

              </div>

            </mat-card-content>

          </mat-card>


          <!-- ===============================================
               WEEKLY GOAL
               =============================================== -->

          <mat-card
            class="!rounded-2xl"
          >

            <mat-card-content
              class="!p-6"
            >

              <div
                class="flex items-center gap-3"
              >

                <div
                  class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"
                >

                  <mat-icon
                    class="!text-emerald-600"
                  >
                    flag
                  </mat-icon>

                </div>

                <div>

                  <h2
                    class="font-semibold text-slate-900"
                  >
                    Weekly Goal
                  </h2>

                  <p
                    class="text-sm text-slate-500"
                  >
                    Keep your momentum going.
                  </p>

                </div>

              </div>


              <div
                class="mt-6 text-center"
              >

                <div
                  class="text-4xl font-bold text-slate-900"
                >
                  {{ weeklyGoalProgress() }}%
                </div>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  of your weekly goal
                </p>

              </div>


              <mat-progress-bar
                class="mt-5"
                mode="determinate"
                [value]="weeklyGoalProgress()"
              />


              <div
                class="mt-4 text-center text-sm text-slate-500"
              >
                {{ weeklyGoal.current }}
                of
                {{ weeklyGoal.target }}
                {{ weeklyGoal.unit }}
              </div>


              <a
                mat-flat-button
                class="mt-5 !w-full"
                routerLink="/find/training"
              >
                Continue Learning
              </a>

            </mat-card-content>

          </mat-card>

        </section>


        <!-- ===================================================
             GOALS
             =================================================== -->

        <section
          class="mt-6"
        >

          <div
            class="mb-4"
          >

            <h2
              class="text-xl font-semibold text-slate-900"
            >
              Learning Goals
            </h2>

            <p
              class="mt-1 text-sm text-slate-500"
            >
              Track the milestones you're working toward.
            </p>

          </div>


          <div
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >

            @for (
              goal of goals();
              track goal.id
            ) {

              <mat-card
                class="!rounded-2xl"
              >

                <mat-card-content
                  class="!p-5"
                >

                  <h3
                    class="font-semibold text-slate-900"
                  >
                    {{ goal.title }}
                  </h3>

                  <p
                    class="mt-1 text-sm text-slate-500"
                  >
                    {{ goal.description }}
                  </p>

                  <div
                    class="mt-4"
                  >

                    <div
                      class="flex justify-between text-sm"
                    >

                      <span
                        class="text-slate-500"
                      >
                        Progress
                      </span>

                      <span
                        class="font-medium text-slate-700"
                      >
                        {{ goal.current }}
                        /
                        {{ goal.target }}
                        {{ goal.unit }}
                      </span>

                    </div>

                    <mat-progress-bar
                      class="mt-2"
                      mode="determinate"
                      [value]="goalProgress(goal)"
                    />

                  </div>

                </mat-card-content>

              </mat-card>

            }

          </div>

        </section>


        <!-- ===================================================
             ACHIEVEMENTS + RECENT ACTIVITY
             =================================================== -->

        <section
          class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
        >


          <!-- ===============================================
               ACHIEVEMENTS
               =============================================== -->

          <mat-card
            class="!rounded-2xl"
          >

            <mat-card-content
              class="!p-6"
            >

              <div
                class="flex items-center justify-between"
              >

                <div>

                  <h2
                    class="text-xl font-semibold text-slate-900"
                  >
                    Achievements
                  </h2>

                  <p
                    class="mt-1 text-sm text-slate-500"
                  >
                    Milestones you've earned.
                  </p>

                </div>

                <mat-icon
                  class="!text-amber-500"
                >
                  emoji_events
                </mat-icon>

              </div>


              <div
                class="mt-5 space-y-4"
              >

                @for (
                  achievement of achievements();
                  track achievement.id
                ) {

                  <div
                    class="flex items-center gap-4"
                  >

                    <div
                      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                      [class.bg-amber-100]="achievement.earned"
                      [class.bg-slate-100]="!achievement.earned"
                    >

                      <mat-icon
                        [class.!text-amber-600]="achievement.earned"
                        [class.!text-slate-400]="!achievement.earned"
                      >
                        {{ achievement.icon }}
                      </mat-icon>

                    </div>


                    <div
                      class="min-w-0 flex-1"
                    >

                      <h3
                        class="font-medium text-slate-900"
                      >
                        {{ achievement.title }}
                      </h3>

                      <p
                        class="text-sm text-slate-500"
                      >
                        {{ achievement.description }}
                      </p>

                    </div>


                    @if (achievement.earned) {

                      <mat-icon
                        class="!text-emerald-600"
                        matTooltip="Earned"
                      >
                        check_circle
                      </mat-icon>

                    }

                  </div>

                }

              </div>

            </mat-card-content>

          </mat-card>


          <!-- ===============================================
               RECENT ACTIVITY
               =============================================== -->

          <mat-card
            class="!rounded-2xl"
          >

            <mat-card-content
              class="!p-6"
            >

              <div>

                <h2
                  class="text-xl font-semibold text-slate-900"
                >
                  Recent Activity
                </h2>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  Your latest learning activity.
                </p>

              </div>


              <div
                class="mt-5"
              >

                @for (
                  activity of recentActivities();
                  track activity.id;
                  let last = $last
                ) {

                  <div
                    class="flex gap-4 py-4"
                    [class.border-b]="!last"
                    [class.border-slate-200]="!last"
                  >

                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
                    >

                      <mat-icon>
                        {{ activityIcon(activity.type) }}
                      </mat-icon>

                    </div>


                    <div
                      class="min-w-0 flex-1"
                    >

                      <p
                        class="font-medium text-slate-900"
                      >
                        {{ activity.title }}
                      </p>

                      <p
                        class="mt-1 text-sm text-slate-500"
                      >
                        {{ activity.category }}
                      </p>

                      <p
                        class="mt-1 text-xs text-slate-400"
                      >
                        {{ formatDate(activity.updatedAt) }}
                      </p>

                    </div>


                    @if (activity.completed) {

                      <mat-icon
                        class="!text-emerald-600"
                      >
                        check_circle
                      </mat-icon>

                    }

                  </div>

                }

              </div>

            </mat-card-content>

          </mat-card>

        </section>


        <!-- ===================================================
             EMPTY / FUTURE DATA NOTICE
             =================================================== -->

        @if (showDataNotice()) {

          <section
            class="mt-6"
          >

            <mat-card
              class="!rounded-2xl"
            >

              <mat-card-content
                class="!p-6"
              >

                <div
                  class="flex gap-4"
                >

                  <mat-icon
                    class="!text-blue-600"
                  >
                    info
                  </mat-icon>

                  <div>

                    <h2
                      class="font-semibold text-slate-900"
                    >
                      Your learning data is being prepared
                    </h2>

                    <p
                      class="mt-1 text-sm leading-6 text-slate-600"
                    >
                      As you complete courses, tests, lessons,
                      and other learning activities on Zebron,
                      your Learning Lab will automatically become
                      more personalized.
                    </p>

                  </div>

                </div>

              </mat-card-content>

            </mat-card>

          </section>

        }

      </main>

    </div>
  `,
})
export class LearningLabComponent {

  private readonly authService =
    inject(AuthService);

  private readonly logger =
    inject(LoggerService);


  // ===========================================================
  // DEMO / INITIAL DASHBOARD STATE
  // ===========================================================
  //
  // These signals intentionally provide the dashboard structure
  // before the Learning Lab data-access layer is connected.
  //
  // The next implementation stage can replace these values with
  // Firestore-backed LearningLabStore state without changing
  // the overall dashboard UI.
  // ===========================================================

  readonly activities =
    signal<LearningActivity[]>([
      {
        id: 'activity-1',
        title: 'Cybersecurity Fundamentals',
        type: 'course',
        category: 'Cybersecurity',
        progress: 68,
        completed: false,
        updatedAt: new Date(),
        route: '/test-center',
      },

      {
        id: 'activity-2',
        title: 'Workplace Readiness',
        type: 'lesson',
        category: 'Career Development',
        progress: 45,
        completed: false,
        updatedAt: new Date(),
        route: '/find/training',
      },

      {
        id: 'activity-3',
        title: 'Cybersecurity Practice Test',
        type: 'test',
        category: 'Cybersecurity',
        progress: 100,
        completed: true,
        updatedAt: new Date(),
        route: '/test-center',
      },

      {
        id: 'activity-4',
        title: 'Professional Communication',
        type: 'resource',
        category: 'Career Development',
        progress: 100,
        completed: true,
        updatedAt: new Date(),
      },
    ]);


  readonly achievements =
    signal<LearningAchievement[]>([
      {
        id: 'achievement-1',
        title: 'First Step',
        description:
          'Complete your first learning activity.',
        icon: 'flag',
        earned: true,
        earnedAt: new Date(),
      },

      {
        id: 'achievement-2',
        title: 'Knowledge Builder',
        description:
          'Complete five learning activities.',
        icon: 'auto_stories',
        earned: true,
        earnedAt: new Date(),
      },

      {
        id: 'achievement-3',
        title: 'Test Taker',
        description:
          'Complete your first practice test.',
        icon: 'quiz',
        earned: true,
        earnedAt: new Date(),
      },

      {
        id: 'achievement-4',
        title: 'Learning Streak',
        description:
          'Learn for seven consecutive days.',
        icon: 'local_fire_department',
        earned: false,
      },
    ]);


  readonly goals =
    signal<LearningGoal[]>([
      {
        id: 'goal-1',
        title: 'Complete 10 Activities',
        description:
          'Build a consistent learning habit.',
        target: 10,
        current: 6,
        unit: 'activities',
      },

      {
        id: 'goal-2',
        title: 'Pass a Certification',
        description:
          'Prepare for your next certification.',
        target: 1,
        current: 0,
        unit: 'certifications',
      },

      {
        id: 'goal-3',
        title: 'Study 20 Hours',
        description:
          'Invest time in your professional development.',
        target: 20,
        current: 12,
        unit: 'hours',
      },
    ]);


  readonly weeklyGoal: LearningGoal = {
    id: 'weekly',
    title: 'Weekly Learning Goal',
    description:
      'Complete learning activities this week.',
    target: 5,
    current: 3,
    unit: 'activities',
  };


  // ===========================================================
  // COMPUTED DASHBOARD VALUES
  // ===========================================================

  readonly activeActivities =
    computed(() =>
      this.activities()
        .filter(
          (activity) =>
            !activity.completed,
        ),
    );


  readonly recentActivities =
    computed(() =>
      [...this.activities()]
        .sort(
          (a, b) =>
            b.updatedAt.getTime() -
            a.updatedAt.getTime(),
        )
        .slice(0, 5),
    );


  readonly completedActivities =
    computed(() =>
      this.activities()
        .filter(
          (activity) =>
            activity.completed,
        )
        .length,
    );


  readonly totalActivities =
    computed(() =>
      this.activities().length,
    );


  readonly overallProgress =
    computed(() => {

      const activities =
        this.activities();

      if (!activities.length) {
        return 0;
      }

      const total =
        activities.reduce(
          (sum, activity) =>
            sum + activity.progress,
          0,
        );

      return Math.round(
        total /
          activities.length,
      );
    });


  readonly coursesStarted =
    computed(() =>
      this.activities()
        .filter(
          (activity) =>
            activity.type ===
            'course',
        )
        .length,
    );


  readonly coursesCompleted =
    computed(() =>
      this.activities()
        .filter(
          (activity) =>
            activity.type ===
              'course' &&
            activity.completed,
        )
        .length,
    );


  readonly testsCompleted =
    computed(() =>
      this.activities()
        .filter(
          (activity) =>
            activity.type ===
              'test' &&
            activity.completed,
        )
        .length,
    );


  readonly averageTestScore =
    signal(82);


  readonly learningHours =
    signal(24);


  readonly learningHoursThisWeek =
    signal(4);


  readonly earnedAchievements =
    computed(() =>
      this.achievements()
        .filter(
          (achievement) =>
            achievement.earned,
        )
        .length,
    );


  readonly totalAchievements =
    computed(() =>
      this.achievements().length,
    );


  readonly weeklyGoalProgress =
    computed(() => {

      if (
        this.weeklyGoal.target <=
        0
      ) {
        return 0;
      }

      return Math.min(
        100,
        Math.round(
          (
            this.weeklyGoal.current /
            this.weeklyGoal.target
          ) *
          100,
        ),
      );
    });


  readonly showDataNotice =
    computed(() =>
      this.activities().length ===
      0,
    );


  // ===========================================================
  // UI HELPERS
  // ===========================================================

  activityIcon(
    type: LearningActivity['type'],
  ): string {

    switch (type) {

      case 'course':
        return 'menu_book';

      case 'test':
        return 'quiz';

      case 'lesson':
        return 'school';

      case 'resource':
        return 'article';

      default:
        return 'school';
    }
  }


  goalProgress(
    goal: LearningGoal,
  ): number {

    if (
      goal.target <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (
          goal.current /
          goal.target
        ) *
        100,
      ),
    );
  }


  formatDate(
    date: Date,
  ): string {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(date);
  }
}
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { collection, getDocs, limit, query, where, Timestamp } from 'firebase/firestore';

import { AuthService } from '../../core/services/auth.service';
import { firestore } from '../../core/services/firebase-config';
import { CourseStore } from '../courses/course.store';
import {
  COURSE_COVERS,
  CourseContext,
  CourseProgress,
  courseDate,
  courseLink,
  hasCertificate,
} from '../courses/course.model';
import {
  CertificationService,
  CertificationStage,
  certificationStage,
} from '../courses/certification.service';
import { CareerPathService } from '../careers/career-path.service';
import { CareerPlan } from '../careers/career-path.model';

/** Most quiz results read for the profile. */
const RESULT_LIMIT = 50;

/** Zebron's own Learning pages: progress records link from here. */
const ZEBRON_CONTEXT: CourseContext = { basePath: '/courses', organizationId: null };

const STAGE: Record<CertificationStage, { label: string; classes: string }> = {
  'not-enrolled': { label: 'Not started', classes: 'bg-slate-100 text-slate-700' },
  'in-progress': { label: 'In progress', classes: 'bg-amber-100 text-amber-800' },
  'exam-ready': { label: 'Exam ready', classes: 'bg-sky-100 text-sky-800' },
  waiting: { label: 'Waiting period', classes: 'bg-rose-100 text-rose-800' },
  certified: { label: 'Certified', classes: 'bg-emerald-100 text-emerald-800' },
  expired: { label: 'Expired: renew', classes: 'bg-rose-100 text-rose-800' },
  prepared: { label: 'Ready for the real exam', classes: 'bg-emerald-100 text-emerald-800' },
};

interface CertificationEntry {
  key: string;
  title: string;
  link: string;
  stage: CertificationStage;
  done: number;
  total: number;
}

interface ResultEntry {
  id: string;
  quizName: string;
  mode: 'practice' | 'exam';
  score: number;
  completedAt: Date | null;
}

/**
 * The Learning tab of the profile: everything the person is learning, in one
 * place. Reuses CourseStore (already loaded by the course pages), plus the
 * learner's certifications, career path and recent Zebron Test Center results.
 *
 * Reads when opened: course progress and exams (shared with My learning, so
 * often already loaded), certification enrollments and their definitions,
 * career plans, and up to 50 Zebron quiz results.
 */
@Component({
  selector: 'app-profile-learning',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="p-6 sm:p-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="max-w-3xl">
          <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">Learning</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-tight text-[#032D42]">Your learning journey</h2>
          <p class="mt-2 text-sm leading-6 text-gray-500">
            Courses, certificates, certifications, your career path and test results, in one place.
          </p>
        </div>
        <a
          routerLink="/courses"
          class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
        >
          Open My learning
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
        </a>
      </div>

      @if (!store.progressLoaded()) {
        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="h-28 animate-pulse rounded-xl bg-gray-100"></div>
          }
        </div>
      } @else {
        <!-- Key figures -->
        <div class="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-sm font-medium text-gray-500">In progress</p>
            <p class="mt-1 text-3xl font-bold text-[#032D42]">{{ store.inProgress().length }}</p>
            <p class="mt-1 text-xs text-gray-500">Courses you are taking</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-sm font-medium text-gray-500">Completed</p>
            <p class="mt-1 text-3xl font-bold text-[#032D42]">{{ store.completed().length }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ certificates().length }} with a certificate</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-sm font-medium text-gray-500">Tests taken</p>
            <p class="mt-1 text-3xl font-bold text-[#032D42]">{{ resultsLoaded() ? resultCountLabel() : '…' }}</p>
            <p class="mt-1 text-xs text-gray-500">
              @if (averageScore() !== null) {
                Average score {{ averageScore() }}%
              } @else {
                Zebron Test Center
              }
            </p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-sm font-medium text-gray-500">Week streak</p>
            <p class="mt-1 text-3xl font-bold text-[#032D42]">{{ store.streakWeeks() }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ store.weekMinutes() }} min this week</p>
          </div>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <!-- Courses in progress -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="profile-in-progress">
            <h3 id="profile-in-progress" class="text-base font-semibold text-[#032D42]">Courses in progress</h3>
            @if (store.inProgress().length) {
              <ul class="mt-3 flex flex-col gap-2">
                @for (record of store.inProgress().slice(0, 5); track record.id) {
                  <li>
                    <a [routerLink]="link(record)" class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-[#007979]/40 hover:bg-gray-50">
                      <span class="h-10 w-10 shrink-0 rounded-lg" [style.background]="cover(record)" aria-hidden="true"></span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-[#032D42]">{{ record.courseTitle }}</span>
                        <span class="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                          <span class="block h-full rounded-full bg-[#007979]" [style.width.%]="record.percent"></span>
                        </span>
                        <span class="mt-0.5 block text-xs text-gray-500">
                          {{ record.status === 'completed' ? 'Lessons done · final exam next' : record.percent + '% complete' }}
                        </span>
                      </span>
                      <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">chevron_right</mat-icon>
                    </a>
                  </li>
                }
              </ul>
              @if (store.inProgress().length > 5) {
                <a routerLink="/courses" class="mt-2 inline-block text-sm font-semibold text-[#007979] hover:underline">
                  See all {{ store.inProgress().length }} in My learning
                </a>
              }
            } @else {
              <div class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No course in progress.
                <a routerLink="/courses/catalog" class="font-semibold text-[#007979] hover:underline">Browse the catalog</a>
              </div>
            }
          </section>

          <!-- Career path -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="profile-career">
            <h3 id="profile-career" class="text-base font-semibold text-[#032D42]">Career path</h3>
            @if (careerPlan(); as plan) {
              <a [routerLink]="['/courses/careers', plan.pathId]" class="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-[#007979]/40 hover:bg-gray-50">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#007979]/10 text-[#007979]" aria-hidden="true">
                  <mat-icon>route</mat-icon>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-[#032D42]">{{ plan.pathTitle }}</span>
                  <span class="block text-xs text-gray-500">See where you stand and what to learn next</span>
                </span>
                <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">chevron_right</mat-icon>
              </a>
            } @else {
              <div class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Not following a career path yet.
                <a routerLink="/courses/careers" class="font-semibold text-[#007979] hover:underline">Explore career paths</a>
              </div>
            }

            @if (skills().length) {
              <h4 class="mt-5 text-sm font-semibold text-[#032D42]">Skills from completed courses</h4>
              <div class="mt-2 flex flex-wrap gap-1.5">
                @for (skill of skills(); track skill) {
                  <span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-[#007979]">{{ skill }}</span>
                }
              </div>
            }
          </section>

          <!-- Certificates -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="profile-certificates">
            <div class="flex items-baseline justify-between gap-2">
              <h3 id="profile-certificates" class="text-base font-semibold text-[#032D42]">Certificates</h3>
              @if (certificates().length) {
                <a routerLink="/courses/certificates" class="text-sm font-semibold text-[#007979] hover:underline">View all</a>
              }
            </div>
            @if (certificates().length) {
              <ul class="mt-3 divide-y divide-gray-100">
                @for (record of certificates().slice(0, 5); track record.id) {
                  <li>
                    <a [routerLink]="link(record) + '/certificate'" class="flex items-center gap-3 py-2.5 hover:text-[#007979]">
                      <mat-icon class="shrink-0 text-amber-500" aria-hidden="true">workspace_premium</mat-icon>
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-[#032D42]">{{ record.courseTitle }}</span>
                      <span class="shrink-0 text-xs text-gray-500">{{ date(record.completedAt) }}</span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Pass the final exam of a course to earn a certificate.
              </p>
            }
          </section>

          <!-- Certifications -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="profile-certifications">
            <div class="flex items-baseline justify-between gap-2">
              <h3 id="profile-certifications" class="text-base font-semibold text-[#032D42]">Certifications</h3>
              <a routerLink="/courses/certifications" class="text-sm font-semibold text-[#007979] hover:underline">Browse</a>
            </div>
            @if (!certificationsLoaded()) {
              <div class="mt-3 h-16 animate-pulse rounded-xl bg-gray-100" aria-hidden="true"></div>
            } @else if (certifications().length) {
              <ul class="mt-3 flex flex-col gap-2">
                @for (entry of certifications(); track entry.key) {
                  <li>
                    <a [routerLink]="entry.link" class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-[#007979]/40 hover:bg-gray-50">
                      <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">military_tech</mat-icon>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-semibold text-[#032D42]">{{ entry.title }}</span>
                        <span class="block text-xs text-gray-500">{{ entry.done }} of {{ entry.total }} courses</span>
                      </span>
                      <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" [class]="stageOf(entry.stage).classes">{{ stageOf(entry.stage).label }}</span>
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                You haven't started a certification.
              </p>
            }
          </section>
        </div>

        <!-- Recent test results -->
        <section class="mt-6 rounded-2xl border border-gray-200 bg-white p-5" aria-labelledby="profile-results">
          <div class="flex items-baseline justify-between gap-2">
            <h3 id="profile-results" class="text-base font-semibold text-[#032D42]">Recent test results</h3>
            <a routerLink="/test-center" class="text-sm font-semibold text-[#007979] hover:underline">Test Center</a>
          </div>
          @if (!resultsLoaded()) {
            <div class="mt-3 h-16 animate-pulse rounded-xl bg-gray-100" aria-hidden="true"></div>
          } @else if (results().length) {
            <div class="mt-3 overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th class="py-2 pr-3 font-semibold">Quiz or exam</th>
                    <th class="py-2 pr-3 font-semibold">Mode</th>
                    <th class="py-2 pr-3 text-right font-semibold">Score</th>
                    <th class="py-2 text-right font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (result of results().slice(0, 6); track result.id) {
                    <tr>
                      <td class="max-w-[16rem] truncate py-2 pr-3 font-medium text-[#032D42]">{{ result.quizName }}</td>
                      <td class="py-2 pr-3 text-gray-600">{{ result.mode === 'exam' ? 'Exam' : 'Practice' }}</td>
                      <td class="py-2 pr-3 text-right font-semibold" [class]="result.score >= 70 ? 'text-emerald-700' : 'text-gray-700'">{{ result.score }}%</td>
                      <td class="py-2 text-right text-gray-500">{{ shortDate(result.completedAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="mt-2 text-xs text-gray-500">Zebron Test Center, course and certification exams. Your organization's own tests are in its Test Center.</p>
          } @else {
            <p class="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              No test results yet.
              <a routerLink="/test-center" class="font-semibold text-[#007979] hover:underline">Practise in the Test Center</a>
            </p>
          }
        </section>
      }
    </div>
  `,
})
export class ProfileLearningComponent {
  private readonly auth = inject(AuthService);
  protected readonly store = inject(CourseStore);
  private readonly certificationService = inject(CertificationService);
  private readonly careers = inject(CareerPathService);

  protected readonly certificates = computed(() =>
    this.store.completed().filter((record) => hasCertificate(record, this.store.exams()[record.id])),
  );
  protected readonly skills = computed(() =>
    [...new Set(this.store.completed().flatMap((record) => record.skills))].sort((a, b) => a.localeCompare(b)).slice(0, 24),
  );

  protected readonly careerPlan = signal<CareerPlan | null>(null);
  protected readonly certifications = signal<CertificationEntry[]>([]);
  protected readonly certificationsLoaded = signal(false);
  protected readonly results = signal<ResultEntry[]>([]);
  protected readonly resultsLoaded = signal(false);

  protected readonly resultCountLabel = computed(() => {
    const count = this.results().length;
    return count >= RESULT_LIMIT ? `${RESULT_LIMIT}+` : String(count);
  });
  protected readonly averageScore = computed(() => {
    const results = this.results();
    return results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : null;
  });

  constructor() {
    effect(() => {
      const uid = this.auth.firebaseUser()?.uid ?? null;
      untracked(() => {
        void this.store.loadProgress();
        if (uid) {
          void this.loadCareerPlan(uid);
          void this.loadCertifications(uid);
          void this.loadResults(uid);
        }
      });
    });
  }

  protected link(record: CourseProgress): string {
    return courseLink(record, ZEBRON_CONTEXT);
  }

  protected cover(record: CourseProgress): string {
    return COURSE_COVERS[record.cover] ?? COURSE_COVERS.teal;
  }

  protected date(value: Timestamp | null): string {
    return courseDate(value);
  }

  protected shortDate(value: Date | null): string {
    return value ? value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }

  protected stageOf(stage: CertificationStage): { label: string; classes: string } {
    return STAGE[stage];
  }

  private async loadCareerPlan(uid: string): Promise<void> {
    try {
      this.careerPlan.set((await this.careers.listPlans(uid))[0] ?? null);
    } catch {
      this.careerPlan.set(null);
    }
  }

  private async loadCertifications(uid: string): Promise<void> {
    try {
      const enrollments = await this.certificationService.myEnrollments(uid);
      const entries = await Promise.all(
        [...enrollments.values()].map(async (enrollment): Promise<CertificationEntry | null> => {
          const definition = await this.certificationService.getDefinition(enrollment.key).catch(() => null);
          if (!definition) {
            return null;
          }
          const separator = enrollment.key.indexOf('__');
          const organizationId = separator > 0 ? enrollment.key.slice(0, separator) : null;
          const base = organizationId ? `/partner/org/${encodeURIComponent(organizationId)}/courses` : '/courses';
          return {
            key: enrollment.key,
            title: definition.credentialName || definition.title,
            link: `${base}/certifications/${encodeURIComponent(enrollment.key)}`,
            stage: certificationStage(definition, enrollment),
            done: Object.keys(enrollment.stepPasses).length,
            total: definition.courses.length,
          };
        }),
      );
      this.certifications.set(entries.filter((entry): entry is CertificationEntry => entry !== null));
    } catch {
      this.certifications.set([]);
    } finally {
      this.certificationsLoaded.set(true);
    }
  }

  /** Zebron results only (organizationId null): the rules let learners list their own. */
  private async loadResults(uid: string): Promise<void> {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, 'quizResults'),
          where('organizationId', '==', null),
          where('userId', '==', uid),
          limit(RESULT_LIMIT),
        ),
      );
      const results = snapshot.docs
        .map((document): ResultEntry => {
          const data = document.data();
          const completed = data['completedAt'];
          return {
            id: document.id,
            quizName: typeof data['quizName'] === 'string' ? data['quizName'] : 'Quiz',
            mode: data['mode'] === 'exam' ? 'exam' : 'practice',
            score: typeof data['scorePercentage'] === 'number' ? Math.round(data['scorePercentage']) : 0,
            completedAt: completed instanceof Timestamp ? completed.toDate() : completed instanceof Date ? completed : null,
          };
        })
        .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
      this.results.set(results);
    } catch {
      this.results.set([]);
    } finally {
      this.resultsLoaded.set(true);
    }
  }
}


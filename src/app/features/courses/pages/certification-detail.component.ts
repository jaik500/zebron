import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import {
  CertificationCourseRef,
  CertificationDefinition,
  CertificationEnrollment,
  CertificationService,
  certificationStage,
  stepKey,
} from '../certification.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { COURSE_COVERS, courseContextFromRoute } from '../course.model';
import { CourseStore } from '../course.store';

type StepState = 'done' | 'current' | 'retake' | 'locked';

/**
 * One certification: its ordered courses with the learner's place in
 * them, the certification exam, and the credential. Steps are counted by
 * the server; this page only shows them (locked steps cannot be opened
 * from here, and their final exams refuse to start).
 */
@Component({
  selector: 'app-certification-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="context.basePath + '/certifications'"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: 'Certifications', link: context.basePath + '/certifications' },
          { label: definition()?.credentialName ?? 'Certification', translate: !definition() }
        ]"
      />

      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="h-96 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (!definition()) {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">
            {{ 'This certification is not available.' | t }}
          </div>
        } @else if (definition(); as cert) {
          <!-- ================= HEADER ================= -->
          <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div class="flex flex-wrap items-start gap-4 p-6 text-white" [style.background]="cover()">
              <mat-icon class="!h-14 !w-14 shrink-0 !text-[56px]" aria-hidden="true">military_tech</mat-icon>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/80">{{ cert.providerName }} · {{ 'Certification' | t }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ cert.credentialName }}</h1>
                <p class="mt-1 text-sm text-white/85">{{ cert.title }}</p>
              </div>
            </div>
            <div class="grid gap-4 p-6 md:grid-cols-[1fr_16rem]">
              <div>
                @if (cert.description || cert.summary) {
                  <p class="whitespace-pre-line text-sm leading-6 text-slate-700">{{ cert.description || cert.summary }}</p>
                }
                @if (cert.preparesFor.length) {
                  <p class="mt-3 text-sm text-slate-600">
                    <span class="font-semibold text-slate-800">{{ 'Prepares you for' | t }}:</span> {{ cert.preparesFor.join(', ') }}
                  </p>
                  <p class="mt-1 text-xs text-slate-500">{{ 'This is a Zebron credential. Vendor exams are booked with the vendor.' | t }}</p>
                }
              </div>
              <ul class="flex flex-col gap-2 text-sm text-slate-700">
                <li class="flex items-center gap-2"><mat-icon class="text-[#007979]" aria-hidden="true">format_list_numbered</mat-icon>{{ '{0} courses, in order' | t: [cert.courses.length] }}</li>
                <li class="flex items-center gap-2"><mat-icon class="text-[#007979]" aria-hidden="true">quiz</mat-icon>{{ '{0} exam questions' | t: [cert.exam.questionsPerCourse * cert.courses.length] }}</li>
                <li class="flex items-center gap-2"><mat-icon class="text-[#007979]" aria-hidden="true">flag</mat-icon>{{ '{0}% to pass' | t: [cert.exam.passMark] }}</li>
                <li class="flex items-center gap-2"><mat-icon class="text-[#007979]" aria-hidden="true">event_available</mat-icon>{{ 'Valid {0} years' | t: [cert.validityYears] }}</li>
              </ul>
            </div>

            @if (!signedIn()) {
              <div class="border-t border-slate-100 bg-slate-50 px-6 py-4">
                <a routerLink="/login" [queryParams]="{ returnUrl: here }" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">login</mat-icon>{{ 'Sign in to start' | t }}
                </a>
              </div>
            } @else if (!enrollment()) {
              <div class="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  (click)="enroll()"
                  [disabled]="busy()"
                  class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">flag</mat-icon>
                  {{ (busy() ? 'Starting...' : 'Start this certification') | t }}
                </button>
                <p class="text-xs text-slate-500">{{ 'Courses you already passed in order count automatically.' | t }}</p>
              </div>
            }
            @if (error()) {
              <p class="border-t border-rose-100 bg-rose-50 px-6 py-3 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
            }
          </section>

          <!-- ================= STEPS ================= -->
          <section class="mt-6" aria-labelledby="steps-title">
            <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="steps-title" class="text-lg font-semibold text-slate-900">{{ 'Courses' | t }}</h2>
              @if (enrollment()) {
                <span class="text-sm text-slate-500">{{ '{0} of {1} completed' | t: [doneCount(), cert.courses.length] }}</span>
              }
            </div>

            <ol class="relative flex flex-col gap-3">
              @for (step of steps(); track step.key; let index = $index) {
                <li
                  class="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4"
                  [ngClass]="step.state === 'current' || step.state === 'retake' ? 'border-[#007979] ring-1 ring-[#007979]/30' : 'border-slate-200'"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    [ngClass]="
                      step.state === 'done' ? 'bg-emerald-500 text-white'
                      : step.state === 'locked' ? 'bg-slate-100 text-slate-400'
                      : 'bg-[#007979] text-white'
                    "
                    aria-hidden="true"
                  >
                    @if (step.state === 'done') {
                      <mat-icon class="!h-5 !w-5 !text-[20px]">check</mat-icon>
                    } @else if (step.state === 'locked') {
                      <mat-icon class="!h-5 !w-5 !text-[20px]">lock</mat-icon>
                    } @else {
                      {{ index + 1 }}
                    }
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Step {0}' | t: [index + 1] }}</p>
                    <p class="font-semibold" [ngClass]="step.state === 'locked' ? 'text-slate-500' : 'text-slate-900'">{{ step.course.title }}</p>
                    <p class="text-xs text-slate-500">
                      @switch (step.state) {
                        @case ('done') {
                          {{ 'Completed {0}' | t: [dateLabel(step.passedAt)] }}
                        }
                        @case ('retake') {
                          <span class="text-amber-800">{{ 'You passed this before the step above it. Pass its final exam again to count it.' | t }}</span>
                        }
                        @case ('current') {
                          {{ (step.percent > 0 ? '{percent}% complete' : 'Your next course') | t: { percent: step.percent } }}
                        }
                        @default {
                          {{ 'Complete step {0} first.' | t: [index] }}
                        }
                      }
                    </p>
                  </div>
                  @switch (step.state) {
                    @case ('current') {
                      <a [routerLink]="step.link" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                        {{ (step.percent > 0 ? 'Continue' : 'Start course') | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                      </a>
                    }
                    @case ('retake') {
                      <a [routerLink]="step.link + '/exam'" [queryParams]="{ certification: cert.key }" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                        <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">replay</mat-icon>{{ 'Retake the final exam' | t }}
                      </a>
                    }
                    @case ('done') {
                      <a [routerLink]="step.link" class="text-sm font-semibold text-[#007979] hover:underline">{{ 'Review' | t }}</a>
                    }
                  }
                </li>
              }
            </ol>
          </section>

          <!-- ================= EXAM AND CREDENTIAL ================= -->
          <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="exam-title">
            <h2 id="exam-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">assignment</mat-icon>{{ 'Certification exam' | t }}
            </h2>
            <p class="mt-1 text-sm text-slate-600">
              {{ '{0} questions from all the courses · {1}% to pass · {2} attempts, then a {3}-day wait' | t: [cert.exam.questionsPerCourse * cert.courses.length, cert.exam.passMark, cert.exam.maxAttempts, cert.exam.cooldownDays] }}
              @if (cert.exam.timeLimitMinutes) {
                · {{ '{0} minutes' | t: [cert.exam.timeLimitMinutes] }}
              }
            </p>

            @switch (stage()) {
              @case ('certified') {
                @if (enrollment()?.credential; as credential) {
                  <div class="mt-4 rounded-xl bg-emerald-50 p-4">
                    <p class="flex items-center gap-2 font-semibold text-emerald-800">
                      <mat-icon aria-hidden="true">verified</mat-icon>{{ 'You are certified.' | t }}
                    </p>
                    <dl class="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                      <div><dt class="text-xs text-slate-500">{{ 'Credential code' | t }}</dt><dd class="font-mono text-slate-900">{{ credential.code }}</dd></div>
                      <div><dt class="text-xs text-slate-500">{{ 'Issued' | t }}</dt><dd class="text-slate-900">{{ dateLabel(credential.issuedAt) }}</dd></div>
                      <div><dt class="text-xs text-slate-500">{{ 'Valid until' | t }}</dt><dd class="text-slate-900">{{ dateLabel(credential.expiresAt) }}</dd></div>
                    </dl>
                    <a [routerLink]="['/verify', credential.code]" class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">open_in_new</mat-icon>{{ 'Public verification page' | t }}
                    </a>
                  </div>
                }
              }
              @case ('waiting') {
                <p class="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                  {{ 'You used all {0} attempts. You can try again on {1}.' | t: [cert.exam.maxAttempts, dateLabel(enrollment()?.exam?.lockedUntil ?? null)] }}
                </p>
              }
              @case ('exam-ready') {
                <div class="mt-4 flex flex-wrap items-center gap-3">
                  <a [routerLink]="[context.basePath, 'certifications', cert.key, 'exam']" class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]">
                    {{ (enrollment()?.exam?.openAttemptId ? 'Continue the exam' : 'Take the certification exam') | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
                  </a>
                  @if (enrollment()?.exam?.attempts) {
                    <span class="text-sm text-slate-500">{{ '{0} of {1} attempts used' | t: [enrollment()!.exam.attempts, cert.exam.maxAttempts] }}</span>
                  }
                </div>
              }
              @case ('expired') {
                <div class="mt-4 rounded-xl bg-amber-50 p-4">
                  <p class="text-sm text-amber-900">{{ 'Your certification expired on {0}. Pass the exam again to renew it.' | t: [dateLabel(enrollment()?.credential?.expiresAt ?? null)] }}</p>
                  <a [routerLink]="[context.basePath, 'certifications', cert.key, 'exam']" class="mt-3 inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                    {{ 'Renew' | t }}<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_forward</mat-icon>
                  </a>
                </div>
              }
              @default {
                <p class="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <mat-icon class="text-slate-400" aria-hidden="true">lock</mat-icon>
                  {{ 'The exam opens when every course is completed.' | t }}
                </p>
              }
            }
          </section>
        }
      </div>
    </main>
  `,
})
export class CertificationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly service = inject(CertificationService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly key = this.route.snapshot.paramMap.get('certificationKey') ?? '';
  protected readonly here = `${this.context.basePath}/certifications/${this.key}`;

  protected readonly definition = signal<CertificationDefinition | null>(null);
  protected readonly enrollment = signal<CertificationEnrollment | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly signedIn = computed(() => this.auth.firebaseUser() !== null);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  protected readonly cover = computed(() => COURSE_COVERS[this.definition()?.cover ?? 'navy'] ?? COURSE_COVERS.navy);
  protected readonly stage = computed(() => {
    const definition = this.definition();
    return definition ? certificationStage(definition, this.enrollment()) : 'not-enrolled';
  });

  protected readonly steps = computed(() => {
    const definition = this.definition();
    if (!definition) {
      return [];
    }
    const enrollment = this.enrollment();
    const exams = this.store.exams();
    const progress = this.store.progressById();
    let gapFound = false;

    return definition.courses.map((course) => {
      const key = stepKey(course);
      const passedAt = enrollment?.stepPasses[key] ?? null;
      let state: StepState;

      if (passedAt && !gapFound) {
        state = 'done';
      } else if (!gapFound) {
        gapFound = true;
        state = enrollment && exams[key]?.passed ? 'retake' : 'current';
      } else {
        state = 'locked';
      }

      return { key, course, state, passedAt, percent: progress.get(key)?.percent ?? 0, link: this.courseLink(course) };
    });
  });

  protected readonly doneCount = computed(() => this.steps().filter((step) => step.state === 'done').length);

  constructor() {
    this.store.setContext(this.context);

    effect(() => {
      const user = this.auth.firebaseUser();
      untracked(() => void this.load(user?.uid ?? null));
    });
  }

  protected async enroll(): Promise<void> {
    const definition = this.definition();
    const user = this.auth.firebaseUser();
    if (!definition || !user || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.service.enroll(definition);
      this.enrollment.set(await this.service.getEnrollment(user.uid, definition.key));
    } catch (error) {
      this.logger.error('CertificationDetailComponent', 'Could not enroll.', error);
      this.error.set(this.messageOf(error, 'The certification could not be started. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected dateLabel(value: Date | null): string {
    return value ? value.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  }

  private courseLink(course: CertificationCourseRef): string {
    return course.organizationId
      ? `/partner/org/${encodeURIComponent(course.organizationId)}/courses/${encodeURIComponent(course.courseId)}`
      : `${this.context.basePath}/${encodeURIComponent(course.courseId)}`;
  }

  private async load(userId: string | null): Promise<void> {
    try {
      const definition = await this.service.getDefinition(this.key);
      this.definition.set(definition);
      if (definition) {
        this.pageTitle.setDocumentTitle(definition.credentialName);
      }

      if (definition && userId) {
        void this.store.loadProgress();
        let enrollment = await this.service.getEnrollment(userId, definition.key);
        // Re-count the steps (courses passed since the last visit).
        if (enrollment) {
          try {
            await this.service.enroll(definition);
            enrollment = await this.service.getEnrollment(userId, definition.key);
          } catch {
            // The stored steps are still shown.
          }
        }
        this.enrollment.set(enrollment);
      } else {
        this.enrollment.set(null);
      }
    } catch (error) {
      this.logger.error('CertificationDetailComponent', 'Could not load the certification.', error);
      this.error.set('The certification could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private messageOf(error: unknown, fallback: string): string {
    const message = (error as { message?: string })?.message ?? '';
    return message && !/^internal$/i.test(message) ? message : fallback;
  }
}

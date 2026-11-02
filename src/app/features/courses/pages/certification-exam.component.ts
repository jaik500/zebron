import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, HostListener, inject, signal, untracked } from '@angular/core';
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
  CertificationDefinition,
  CertificationEnrollment,
  CertificationResult,
  CertificationService,
  CertificationSession,
  certificationStage,
} from '../certification.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { ProgressRingComponent } from '../components/progress-ring.component';
import { courseContextFromRoute } from '../course.model';
import { ExamQuestion } from '../course.service';

type Stage = 'intro' | 'taking' | 'submitting' | 'result';

/**
 * The certification exam: questions drawn from every course of the
 * certification, graded by submitCertificationExam. Same question screens
 * as a course final exam.
 */
@Component({
  selector: 'app-certification-exam',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent, ProgressRingComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="stage() === 'taking' ? null : detailPath"
        [crumbs]="[
          { label: 'Certifications', link: context.basePath + '/certifications' },
          { label: definition()?.credentialName ?? 'Certification', link: detailPath, translate: !definition() },
          { label: 'Exam' }
        ]"
      />

      <div class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        @if (loading()) {
          <div class="h-80 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (!definition()) {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-700">{{ 'This certification is not available.' | t }}</div>
        } @else if (definition(); as cert) {
          @switch (stage()) {
            @case ('intro') {
              <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div class="bg-gradient-to-r from-[#032d42] to-[#007979] px-6 py-6 text-white">
                  <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/80">{{ (cert.kind === 'exam-prep' ? 'Practice exam' : 'Certification exam') | t }}</p>
                  <h1 class="mt-1 text-2xl font-bold">{{ cert.credentialName }}</h1>
                </div>
                <div class="p-6">
                  <ul class="grid gap-3 sm:grid-cols-2">
                    <li class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <mat-icon class="text-[#007979]" aria-hidden="true">help</mat-icon>
                      @if (cert.kind === 'exam-prep') {
                        <span>{{ '{0} questions, weighted by exam domain' | t: [cert.exam.questionCount] }}</span>
                      } @else {
                        <span>{{ '{0} questions from all {1} courses' | t: [cert.exam.questionsPerCourse * cert.courses.length, cert.courses.length] }}</span>
                      }
                    </li>
                    <li class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <mat-icon class="text-[#007979]" aria-hidden="true">flag</mat-icon>
                      <span>{{ 'Pass mark' | t }} <strong>{{ cert.exam.passMark }}%</strong></span>
                    </li>
                    <li class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <mat-icon class="text-[#007979]" aria-hidden="true">timer</mat-icon>
                      <span>
                        @if (cert.exam.timeLimitMinutes) {
                          <strong>{{ cert.exam.timeLimitMinutes }} min</strong> · {{ 'submits itself when time is up' | t }}
                        } @else {
                          {{ 'No time limit' | t }}
                        }
                      </span>
                    </li>
                    <li class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <mat-icon class="text-[#007979]" aria-hidden="true">replay</mat-icon>
                      @if (cert.exam.maxAttempts > 0) {
                        <span>{{ '{0} of {1} attempts left, then a {2}-day wait' | t: [attemptsLeft(), cert.exam.maxAttempts, cert.exam.cooldownDays] }}</span>
                      } @else {
                        <span>{{ 'Unlimited practice' | t }}</span>
                      }
                    </li>
                  </ul>

                  <p class="mt-4 text-sm text-slate-600">
                    @if (cert.vendor; as vendor) {
                      {{ 'This practice exam is modelled on {0} {1} ({2}). Passing it means you are ready to book the real exam with {0}; it is not the real exam and does not award a credential.' | t: [vendor.name, vendor.exam, vendor.code] }}
                    } @else {
                      {{ 'Passing earns the {0} credential, valid for {1} years.' | t: [cert.credentialName, cert.validityYears] }}
                    }
                  </p>

                  @if (!ready()) {
                    <p class="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{{ notReadyMessage() | t }}</p>
                  }
                  @if (error()) {
                    <p class="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{{ error()! | t }}</p>
                  }

                  <div class="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="starting() || !ready()"
                      (click)="start()"
                    >
                      {{ (starting() ? 'Preparing your exam...' : enrollment()?.exam?.openAttemptId ? 'Continue the exam' : 'Start the exam') | t }}
                      <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                    </button>
                    <a [routerLink]="detailPath" class="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                      {{ 'Back to the certification' | t }}
                    </a>
                  </div>
                </div>
              </section>
            }

            @case ('taking') {
              @if (session(); as current) {
                <!-- Where you are, and the time left -->
                <div class="sticky top-16 z-10 -mx-1 bg-slate-50/95 px-1 pb-3 pt-1 backdrop-blur">
                  <div class="flex items-center justify-between gap-2 text-sm">
                    <span class="text-slate-600">
                      {{ 'Question {0} of {1}' | t: [index() + 1, current.questions.length] }} ·
                      {{ '{0} answered' | t: [answeredCount()] }}
                    </span>
                    @if (secondsLeft() !== null) {
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold tabular-nums"
                        [ngClass]="secondsLeft()! < 60 ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-700 ring-1 ring-slate-200'"
                        role="timer"
                        [attr.aria-label]="'Time left' | t"
                      >
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">timer</mat-icon>{{ clock() }}
                      </span>
                    }
                  </div>
                  <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-all" [style.width.%]="answeredPercent()"></div>
                  </div>
                </div>

                @if (error()) {
                  <p class="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{{ error()! | t }}</p>
                }

                @if (question(); as item) {
                  <article class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                    <p class="text-xs font-bold uppercase tracking-wide text-[#007979]">{{ 'Question {0}' | t: [index() + 1] }}</p>
                    <h2 class="mt-2 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{{ item.question }}</h2>

                    @switch (item.type) {
                      @case ('short-text') {
                        <input
                          type="text"
                          class="mt-5 h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-[#007979] focus:ring-2 focus:ring-teal-100"
                          [value]="answers()[item.id] || ''"
                          [placeholder]="'Type your answer' | t"
                          [attr.aria-label]="'Your answer' | t"
                          autocomplete="off"
                          (input)="choose(item.id, $any($event.target).value)"
                        />
                      }
                      @case ('numeric') {
                        <input
                          type="text"
                          inputmode="decimal"
                          class="mt-5 h-12 w-full max-w-xs rounded-xl border border-slate-300 px-4 text-base tabular-nums outline-none focus:border-[#007979] focus:ring-2 focus:ring-teal-100"
                          [value]="answers()[item.id] || ''"
                          [placeholder]="'Type a number' | t"
                          [attr.aria-label]="'Your answer' | t"
                          autocomplete="off"
                          (input)="choose(item.id, $any($event.target).value)"
                        />
                      }
                      @case ('ordering') {
                        <p class="mt-4 text-sm text-slate-500">{{ 'Use the arrows to put these in the right order.' | t }}</p>
                        <ol class="mt-2 flex flex-col gap-2">
                          @for (optionId of orderFor(item); track optionId; let position = $index; let first = $first; let last = $last) {
                            <li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-600">{{ position + 1 }}</span>
                              <span class="flex-1 text-slate-800">{{ optionText(item, optionId) }}</span>
                              <button type="button" class="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" [disabled]="first" (click)="moveItem(item, position, -1)" [attr.aria-label]="'Move up' | t">
                                <mat-icon>arrow_upward</mat-icon>
                              </button>
                              <button type="button" class="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" [disabled]="last" (click)="moveItem(item, position, 1)" [attr.aria-label]="'Move down' | t">
                                <mat-icon>arrow_downward</mat-icon>
                              </button>
                            </li>
                          }
                        </ol>
                      }
                      @default {
                        @if (item.type === 'multiple-select') {
                          <p class="mt-4 text-sm text-slate-500">{{ 'Select all that apply.' | t }}</p>
                        }
                        <div
                          class="flex flex-col gap-2"
                          [ngClass]="item.type === 'multiple-select' ? 'mt-2' : 'mt-5'"
                          [attr.role]="item.type === 'multiple-select' ? 'group' : 'radiogroup'"
                          [attr.aria-label]="'Answers' | t"
                        >
                          @for (option of item.options; track option.id; let optionIndex = $index) {
                            <button
                              type="button"
                              [attr.role]="item.type === 'multiple-select' ? 'checkbox' : 'radio'"
                              class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition"
                              [ngClass]="isChosen(item.id, option.id) ? 'border-[#007979] bg-teal-50 font-semibold text-[#00605f]' : 'border-slate-200 bg-white text-slate-800 hover:border-[#007979]'"
                              [attr.aria-checked]="isChosen(item.id, option.id)"
                              (click)="item.type === 'multiple-select' ? toggle(item.id, option.id) : choose(item.id, option.id)"
                            >
                              <span
                                class="flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-bold"
                                [ngClass]="[
                                  item.type === 'multiple-select' ? 'rounded-md' : 'rounded-full',
                                  isChosen(item.id, option.id) ? 'border-[#007979] bg-[#007979] text-white' : 'border-slate-300 text-slate-500'
                                ]"
                                aria-hidden="true"
                              >
                                @if (item.type === 'multiple-select' && isChosen(item.id, option.id)) {
                                  <mat-icon class="!h-4 !w-4 !text-base">check</mat-icon>
                                } @else {
                                  {{ letters[optionIndex] }}
                                }
                              </span>
                              <span class="flex-1">{{ option.text }}</span>
                            </button>
                          }
                        </div>
                      }
                    }


                    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        [disabled]="index() === 0"
                        (click)="go(index() - 1)"
                      >
                        <mat-icon aria-hidden="true">arrow_back</mat-icon>{{ 'Previous' | t }}
                      </button>

                      @if (index() < current.questions.length - 1) {
                        <button
                          type="button"
                          class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]"
                          (click)="go(index() + 1)"
                        >
                          {{ 'Next' | t }}<mat-icon aria-hidden="true">arrow_forward</mat-icon>
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]"
                          (click)="submit()"
                        >
                          {{ 'Submit the exam' | t }}<mat-icon aria-hidden="true">send</mat-icon>
                        </button>
                      }
                    </div>
                  </article>
                }

                <!-- Question map -->
                <nav class="mt-4 rounded-2xl border border-slate-200 bg-white p-4" [attr.aria-label]="'Questions' | t">
                  <div class="flex flex-wrap gap-1.5">
                    @for (item of current.questions; track item.id; let questionIndex = $index) {
                      <button
                        type="button"
                        class="h-9 w-9 rounded-lg text-sm font-semibold transition"
                        [ngClass]="
                          questionIndex === index()
                            ? 'bg-[#032d42] text-white'
                            : answers()[item.id]
                              ? 'bg-teal-100 text-[#00605f] hover:bg-teal-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        "
                        [attr.aria-label]="('Question {0}' | t: [questionIndex + 1]) + (answers()[item.id] ? ' ✓' : '')"
                        [attr.aria-current]="questionIndex === index() ? 'step' : null"
                        (click)="go(questionIndex)"
                      >
                        {{ questionIndex + 1 }}
                      </button>
                    }
                  </div>
                  <button type="button" class="mt-3 text-sm font-semibold text-[#007979] hover:underline" (click)="submit()">
                    {{ 'Submit the exam' | t }}
                  </button>
                </nav>
              }
            }

            @case ('submitting') {
              <div class="rounded-2xl border border-slate-200 bg-white p-10 text-center" role="status">
                <mat-icon class="!h-10 !w-10 animate-pulse !text-[40px] text-[#007979]" aria-hidden="true">fact_check</mat-icon>
                <p class="mt-2 font-semibold text-slate-800">{{ 'Checking your answers...' | t }}</p>
              </div>
            }

            @case ('result') {
              @if (result(); as outcome) {
                <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div class="flex flex-col items-center gap-3 px-6 py-8 text-center" [ngClass]="outcome.passed ? 'bg-emerald-50' : 'bg-rose-50/60'">
                    <app-progress-ring [percent]="outcome.score" [size]="104" [color]="outcome.passed ? '#047857' : '#be123c'" />
                    <h1 class="text-2xl font-bold" [ngClass]="outcome.passed ? 'text-emerald-800' : 'text-rose-800'">
                      {{ (outcome.examReady ? 'You are ready for the real exam!' : outcome.passed ? 'You are certified!' : cert.kind === 'exam-prep' ? 'Not ready yet' : 'Not passed this time') | t }}
                    </h1>
                    <p class="text-slate-700">{{ '{0} of {1} correct · pass mark {2}%' | t: [outcome.correct, outcome.total, outcome.passMark] }}</p>
                    @if (outcome.scaledScore != null && outcome.scale) {
                      <p class="text-sm text-slate-700">
                        {{ 'About {0} on the {1}–{2} scale ({3} passes the real exam). This is an estimate, not the vendor score.' | t: [outcome.scaledScore, outcome.scale.min, outcome.scale.max, outcome.scale.pass] }}
                      </p>
                    }
                    @if (outcome.late) {
                      <p class="text-sm text-rose-700">{{ 'Time ran out before the answers arrived, so they could not be counted.' | t }}</p>
                    }
                    @if (outcome.passed && outcome.certificateCode) {
                      <p class="text-sm text-slate-700">
                        {{ 'Credential code' | t }} <span class="font-mono font-semibold">{{ outcome.certificateCode }}</span>
                        @if (outcome.expiresAt) {
                          · {{ 'Valid until {0}' | t: [dateLabel(outcome.expiresAt)] }}
                        }
                      </p>
                    }
                  </div>

                  <div class="p-6">
                    @if (outcome.sections.length > 1) {
                      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ (cert.kind === 'exam-prep' ? 'By exam domain' : 'By course') | t }}</h2>
                      <ul class="mt-3 flex flex-col gap-3">
                        @for (section of outcome.sections; track section.name) {
                          <li>
                            <div class="flex justify-between text-sm">
                              <span class="text-slate-800">{{ section.name }}</span>
                              <span class="tabular-nums text-slate-500">{{ section.correct }}/{{ section.total }}</span>
                            </div>
                            <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div
                                class="h-full rounded-full"
                                [ngClass]="section.correct / section.total >= outcome.passMark / 100 ? 'bg-emerald-500' : 'bg-amber-500'"
                                [style.width.%]="(section.correct / section.total) * 100"
                              ></div>
                            </div>
                          </li>
                        }
                      </ul>
                    }

                    @if (!outcome.passed && outcome.missed.length) {
                      <h2 class="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">{{ 'Questions to review' | t }}</h2>
                      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        @for (missed of outcome.missed.slice(0, 10); track $index) {
                          <li>{{ missed }}</li>
                        }
                      </ul>
                    }

                    <div class="mt-6 flex flex-wrap items-center gap-2">
                      @if (outcome.examReady && cert.vendor?.bookingUrl) {
                        <a [href]="cert.vendor!.bookingUrl" target="_blank" rel="noopener noreferrer" class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]">
                          <mat-icon aria-hidden="true">open_in_new</mat-icon>{{ 'Book the exam with {0}' | t: [cert.vendor!.name] }}
                        </a>
                        <button type="button" class="inline-flex h-11 items-center gap-1 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50" (click)="retry()">
                          <mat-icon aria-hidden="true">replay</mat-icon>{{ 'Practice again' | t }}
                        </button>
                      } @else if (outcome.passed && outcome.certificateCode) {
                        <a [routerLink]="['/verify', outcome.certificateCode]" class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]">
                          <mat-icon aria-hidden="true">verified</mat-icon>{{ 'View your credential' | t }}
                        </a>
                      } @else if (outcome.lockedUntil) {
                        <p class="text-sm text-slate-700">{{ 'You used all {0} attempts. You can try again on {1}.' | t: [outcome.maxAttempts, dateLabel(outcome.lockedUntil)] }}</p>
                      } @else {
                        <button type="button" class="inline-flex h-11 items-center gap-1 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]" (click)="retry()">
                          <mat-icon aria-hidden="true">replay</mat-icon>{{ 'Try again' | t }}
                        </button>
                      }
                      <a [routerLink]="detailPath" class="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                        {{ 'Back to the certification' | t }}
                      </a>
                    </div>
                  </div>
                </section>
              }
            }
          }
        }
      </div>
    </main>
  `,
})
export class CertificationExamComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly service = inject(CertificationService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly key = this.route.snapshot.paramMap.get('certificationKey') ?? '';
  protected readonly detailPath = `${this.context.basePath}/certifications/${this.key}`;
  protected readonly letters = 'ABCDEFGHIJ'.split('');

  protected readonly definition = signal<CertificationDefinition | null>(null);
  protected readonly enrollment = signal<CertificationEnrollment | null>(null);
  protected readonly loading = signal(true);
  protected readonly stage = signal<Stage>('intro');
  protected readonly starting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly session = signal<CertificationSession | null>(null);
  protected readonly answers = signal<Record<string, string>>({});
  protected readonly index = signal(0);
  protected readonly result = signal<CertificationResult | null>(null);
  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Exam open now (every step counted, no waiting period, not already certified). */
  protected readonly ready = computed(() => {
    const definition = this.definition();
    const stage = definition ? certificationStage(definition, this.enrollment()) : 'not-enrolled';
    return stage === 'exam-ready' || stage === 'expired' || stage === 'prepared';
  });

  protected readonly notReadyMessage = computed(() => {
    const definition = this.definition();
    switch (definition ? certificationStage(definition, this.enrollment()) : 'not-enrolled') {
      case 'certified':
        return 'You already hold this certification.';
      case 'waiting':
        return 'You used all your attempts. The exam opens again after the waiting period.';
      case 'not-enrolled':
        return 'Start the certification first.';
      default:
        return definition?.kind === 'exam-prep' ? 'The practice exam opens when every course is completed.' : 'The exam opens when every course is completed.';
    }
  });

  protected readonly attemptsLeft = computed(() => {
    const max = this.definition()?.exam.maxAttempts ?? 0;
    const used = this.enrollment()?.exam.attempts ?? 0;
    return Math.max(0, max - used + (this.enrollment()?.exam.openAttemptId ? 1 : 0));
  });

  protected readonly question = computed(() => this.session()?.questions[this.index()] ?? null);
  protected readonly answeredCount = computed(() => Object.values(this.answers()).filter((answer) => !!answer && answer.trim() !== '').length);
  protected readonly answeredPercent = computed(() => {
    const total = this.session()?.questions.length ?? 0;
    return total ? (this.answeredCount() / total) * 100 : 0;
  });

  protected readonly secondsLeft = computed(() => {
    const deadline = this.session()?.deadline;
    return deadline ? Math.max(0, Math.floor((new Date(deadline).getTime() - this.now()) / 1000)) : null;
  });

  protected readonly clock = computed(() => {
    const seconds = this.secondsLeft() ?? 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly timeUp = effect(() => {
    if (this.stage() === 'taking' && this.secondsLeft() === 0) {
      untracked(() => void this.submit(true));
    }
  });

  constructor() {
    this.pageTitle.setDocumentTitle(this.i18n.t('Certification exam'));
    effect(() => {
      const user = this.auth.firebaseUser();
      untracked(() => void this.load(user?.uid ?? null));
    });
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.stage() === 'taking') {
      event.preventDefault();
    }
  }

  protected async start(): Promise<void> {
    const definition = this.definition();
    if (!definition || this.starting()) {
      return;
    }
    this.starting.set(true);
    this.error.set(null);
    try {
      const session = await this.service.startExam(definition);
      this.session.set(session);
      this.answers.set({});
      this.index.set(0);
      this.stage.set('taking');
      this.startTimer();
      window.scrollTo({ top: 0 });
    } catch (error) {
      this.logger.error('CertificationExamComponent', 'Could not start the exam.', error);
      this.error.set(this.messageOf(error, 'The exam could not be started. Try again.'));
    } finally {
      this.starting.set(false);
    }
  }

  protected choose(questionId: string, value: string): void {
    this.answers.update((current) => ({ ...current, [questionId]: value }));
  }

  // ----- answer types (stored as strings, see test-center/models/question-answers.ts) -----

  protected isChosen(questionId: string, optionId: string): boolean {
    return (this.answers()[questionId] ?? '').split('|').includes(optionId);
  }

  /** Multiple answers: add or remove an option. */
  protected toggle(questionId: string, optionId: string): void {
    const chosen = new Set((this.answers()[questionId] ?? '').split('|').filter(Boolean));
    if (chosen.has(optionId)) {
      chosen.delete(optionId);
    } else {
      chosen.add(optionId);
    }
    this.choose(questionId, [...chosen].sort().join('|'));
  }

  /**
   * Ordering questions count the order on screen as the answer once the
   * learner moves on (or submits), even if nothing was moved.
   */
  private keepOrder(all = false): void {
    const session = this.session();
    const questions = all ? session?.questions ?? [] : [this.question()].filter((item): item is ExamQuestion => !!item);
    for (const question of questions) {
      if (question.type === 'ordering' && !this.answers()[question.id]) {
        this.choose(question.id, this.orderFor(question).join('|'));
      }
    }
  }

  /** Ordering: the learner's order, or the order the server sent (already shuffled). */
  protected orderFor(question: ExamQuestion): string[] {
    const answer = (this.answers()[question.id] ?? '').split('|').filter(Boolean);
    return answer.length ? answer : question.options.map((option) => option.id);
  }

  protected optionText(question: ExamQuestion, optionId: string): string {
    return question.options.find((option) => option.id === optionId)?.text ?? '';
  }

  protected moveItem(question: ExamQuestion, position: number, delta: number): void {
    const order = [...this.orderFor(question)];
    const target = position + delta;
    if (target < 0 || target >= order.length) {
      return;
    }
    [order[position], order[target]] = [order[target], order[position]];
    this.choose(question.id, order.join('|'));
  }

  protected go(index: number): void {
    this.keepOrder();
    const total = this.session()?.questions.length ?? 0;
    this.index.set(Math.max(0, Math.min(total - 1, index)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected async submit(timeUp = false): Promise<void> {
    const definition = this.definition();
    const session = this.session();
    if (!definition || !session || this.stage() !== 'taking') {
      return;
    }

    this.keepOrder(true);
    const unanswered = session.questions.length - this.answeredCount();
    if (!timeUp && unanswered > 0 && !window.confirm(this.i18n.t('{0} questions are not answered yet. Submit anyway?', [unanswered]))) {
      return;
    }

    this.stopTimer();
    this.stage.set('submitting');

    try {
      this.result.set(await this.service.submitExam(definition, session.attemptId, this.answers()));
      this.stage.set('result');
      await this.refreshEnrollment();
    } catch (error) {
      this.logger.error('CertificationExamComponent', 'Could not submit the exam.', error);
      this.error.set(this.messageOf(error, 'Your answers could not be submitted. Check your connection and try again.'));
      this.stage.set('taking');
      this.startTimer();
    }
    window.scrollTo({ top: 0 });
  }

  protected retry(): void {
    this.result.set(null);
    this.session.set(null);
    this.stage.set('intro');
  }

  protected dateLabel(value: number | Date | null): string {
    if (value === null) {
      return '';
    }
    return new Date(value).toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private async load(userId: string | null): Promise<void> {
    try {
      const definition = await this.service.getDefinition(this.key);
      this.definition.set(definition);
      this.enrollment.set(definition && userId ? await this.service.getEnrollment(userId, definition.key) : null);
    } catch (error) {
      this.logger.error('CertificationExamComponent', 'Could not load the certification.', error);
      this.error.set('The certification could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private async refreshEnrollment(): Promise<void> {
    const user = this.auth.firebaseUser();
    const definition = this.definition();
    if (user && definition) {
      this.enrollment.set(await this.service.getEnrollment(user.uid, definition.key));
    }
  }

  private startTimer(): void {
    this.stopTimer();
    if (this.session()?.deadline) {
      this.now.set(Date.now());
      this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    }
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private messageOf(error: unknown, fallback: string): string {
    const message = (error as { message?: string })?.message ?? '';
    return message && !/^internal$/i.test(message) ? message : fallback;
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Course } from '../../courses/course.model';
import { CourseService } from '../../courses/course.service';
import { CourseCrumb, CourseHeaderComponent } from '../../courses/components/course-header.component';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import {
  allSteps,
  CAREER_LEVEL_LABELS,
  CAREER_STEP_KINDS,
  CareerPath,
  CareerPlan,
  CareerProject,
  CareerStage,
  CareerStep,
  COMPETENCY_LEVELS,
  CompetencyLevel,
  totalHours,
} from '../career-path.model';
import {
  canCheckOff,
  careerInsights,
  CareerJobMatch,
  CareerPathService,
  isStepDone,
  LearnerRecords,
  stageCompetency,
} from '../career-path.service';

const PROJECT_STATUS: Record<string, { label: string; classes: string }> = {
  none: { label: 'Not submitted', classes: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Waiting for review', classes: 'bg-sky-100 text-sky-800' },
  'needs-work': { label: 'Changes requested', classes: 'bg-amber-100 text-amber-900' },
  verified: { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800' },
};

/**
 * Learning → Career paths → one career (/courses/careers/:pathId).
 *
 * Career → Skills → Learning → Courses → Projects → Credentials → Employment:
 *  1. the skills the career requires, stage by stage (the roadmap)
 *  2. the skills the learner has: Verified, or Learned (needs proof)
 *  3–5. recommended courses, certifications and projects, with the next step
 *  6. matching jobs from the Job Board
 *
 * A finished course only makes a stage "Learned". A stage is "Verified"
 * when its assessments (certification exams) and projects (reviewed by an
 * administrator) are passed.
 */
@Component({
  selector: 'app-career-path-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <app-course-header basePath="/courses" backLink="/courses" [crumbs]="crumbs()" [activeTab]="'learning'" [canManage]="isAdmin()" />

      <div class="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <a routerLink="/courses" class="inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_back</mat-icon>{{ 'Back to My learning' | t }}
        </a>
      </div>

      @if (loading()) {
        <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-hidden="true">
          <div class="h-40 animate-pulse rounded-2xl bg-slate-200/70"></div>
          <div class="mt-6 h-72 animate-pulse rounded-2xl bg-slate-200/70"></div>
        </div>
      } @else if (!path()) {
        <div class="mx-auto max-w-xl px-4 py-16 text-center">
          <mat-icon class="!h-12 !w-12 !text-[48px] text-slate-300" aria-hidden="true">route</mat-icon>
          <h1 class="mt-2 text-xl font-bold text-slate-900">{{ 'This career path is not available.' | t }}</h1>
          <a routerLink="/courses/careers" class="mt-4 inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
            {{ 'See all career paths' | t }}
          </a>
        </div>
      } @else {
        @let p = path()!;
        @let info = insights();
        <div class="mx-auto max-w-6xl space-y-6 px-4 pb-6 pt-4 sm:px-6">
          <!-- ================= Overview ================= -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div class="flex flex-wrap gap-2 text-xs font-semibold">
              @if (p.field) {
                <span class="rounded-full bg-teal-50 px-2 py-0.5 text-[#006666]">{{ p.field }}</span>
              }
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{{ levelLabel() | t }}</span>
              @if (p.status === 'draft') {
                <span class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">{{ 'Draft: only administrators see this' | t }}</span>
              }
            </div>
            <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{{ p.title }}</h1>
            @if (p.summary) {
              <p class="mt-1 max-w-3xl text-slate-600">{{ p.summary }}</p>
            }

            <dl class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-xl bg-slate-50 px-4 py-3">
                <dt class="text-xs text-slate-500">{{ 'Roadmap' | t }}</dt>
                <dd class="font-semibold text-slate-900">
                  {{ '{0} stages' | t: [p.stages.length] }} · {{ '{0} skills' | t: [info.skills.length] }}@if (hours()) { · {{ 'about {0} hours' | t: [hours()] }} }
                </dd>
              </div>
              @if (p.salaryRange) {
                <div class="rounded-xl bg-slate-50 px-4 py-3">
                  <dt class="text-xs text-slate-500">{{ 'Typical pay' | t }}</dt>
                  <dd class="font-semibold text-slate-900">{{ p.salaryRange }}</dd>
                </div>
              }
              @if (p.outlook) {
                <div class="rounded-xl bg-slate-50 px-4 py-3">
                  <dt class="text-xs text-slate-500">{{ 'Job outlook' | t }}</dt>
                  <dd class="text-sm text-slate-800">{{ p.outlook }}</dd>
                </div>
              }
            </dl>

            <div class="mt-5 flex flex-wrap items-center gap-3">
              @if (!uid()) {
                <a routerLink="/login" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666]">
                  <mat-icon aria-hidden="true">login</mat-icon>
                  {{ 'Sign in to choose this career' | t }}
                </a>
              } @else if (!plan()) {
                <button type="button" (click)="follow()" [disabled]="busy()" class="inline-flex h-11 items-center gap-2 rounded-lg bg-[#007979] px-5 font-semibold text-white hover:bg-[#006666] disabled:opacity-60">
                  <mat-icon aria-hidden="true">flag</mat-icon>
                  {{ 'Choose this career' | t }}
                </button>
              } @else {
                <button type="button" (click)="leave()" [disabled]="busy()" class="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60">
                  <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
                  {{ 'Stop following' | t }}
                </button>
              }
            </div>
          </section>

          <!-- ================= Where you stand (signed in) ================= -->
          @if (uid()) {
            <section aria-labelledby="standing-title" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 id="standing-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <mat-icon class="text-[#007979]" aria-hidden="true">insights</mat-icon>
                {{ 'Where you stand' | t }}
              </h2>

              @if (info.jobReady) {
                <p class="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-800">
                  <mat-icon aria-hidden="true">verified</mat-icon>
                  {{ 'Every skill on this roadmap is verified. You are ready to apply.' | t }}
                </p>
              }

              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p class="text-2xl font-bold text-emerald-800">{{ info.verified.length }}</p>
                  <p class="text-sm font-semibold text-emerald-900">{{ 'Verified skills' | t }}</p>
                  <p class="text-xs text-emerald-900/80">{{ 'Proven by an assessment or project.' | t }}</p>
                </div>
                <div class="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                  <p class="text-2xl font-bold text-sky-800">{{ info.learned.length }}</p>
                  <p class="text-sm font-semibold text-sky-900">{{ 'Learned: needs proof' | t }}</p>
                  <p class="text-xs text-sky-900/80">{{ 'Courses done. Pass the assessment or project to verify.' | t }}</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p class="text-2xl font-bold text-slate-800">{{ info.gaps.length }}</p>
                  <p class="text-sm font-semibold text-slate-900">{{ 'Skill gaps' | t }}</p>
                  <p class="text-xs text-slate-600">{{ 'Not started or still learning.' | t }}</p>
                </div>
              </div>

              @if (info.skills.length) {
                <h3 class="mt-5 text-sm font-semibold text-slate-900">{{ 'Skills this career requires' | t }}</h3>
                <ul class="mt-2 flex flex-wrap gap-1.5" [attr.aria-label]="'Skills this career requires' | t">
                  @for (item of info.skills; track item.skill + item.stageIndex) {
                    <li class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" [class]="levelClasses(item.level)">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">{{ levelIcon(item.level) }}</mat-icon>
                      {{ item.skill }}
                      <span class="sr-only">: {{ levelName(item.level) | t }}</span>
                    </li>
                  }
                </ul>
                <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500" aria-hidden="true">
                  @for (level of legend; track level) {
                    <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded-full" [class]="levelClasses(level)"></span>{{ levelName(level) | t }}</span>
                  }
                </p>
              }

              @if (info.next; as next) {
                <div class="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                  <mat-icon class="text-[#007979]" aria-hidden="true">tips_and_updates</mat-icon>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold uppercase tracking-wide text-[#006666]">{{ 'Recommended next' | t }}</p>
                    <p class="font-semibold text-slate-900">{{ next.title }}</p>
                    <p class="text-sm text-slate-600">{{ kindLabel(next) | t }}</p>
                  </div>
                  @if (stepLink(next); as link) {
                    <a [routerLink]="link" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">play_arrow</mat-icon>
                      {{ 'Go' | t }}
                    </a>
                  } @else {
                    <a [href]="'#step-' + next.id" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                      {{ 'Show in roadmap' | t }}
                    </a>
                  }
                </div>
              }

              @if (info.fromOtherCourses.length) {
                <p class="mt-3 text-sm text-slate-600">
                  <mat-icon class="!h-4 !w-4 align-[-3px] !text-base text-[#007979]" aria-hidden="true">info</mat-icon>
                  {{ 'You studied some of these skills in other courses: {0}. Pass the stage assessment or project to count them as verified.' | t: [info.fromOtherCourses.join(', ')] }}
                </p>
              }
            </section>
          }

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <!-- ================= Roadmap: Stage | Required skills | Learning & proof ================= -->
            <section aria-labelledby="roadmap-title" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 id="roadmap-title" class="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-lg font-semibold text-slate-900">
                <mat-icon class="text-[#007979]" aria-hidden="true">route</mat-icon>
                {{ 'Career roadmap' | t }}
              </h2>
              <div class="hidden grid-cols-[64px_minmax(0,0.8fr)_minmax(0,1.6fr)] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid" aria-hidden="true">
                <span>{{ 'Stage' | t }}</span>
                <span>{{ 'Required skills' | t }}</span>
                <span>{{ 'Learning and proof' | t }}</span>
              </div>
              <ol>
                @for (stage of p.stages; track stage.id; let stageIndex = $index) {
                  @let level = competency(stage);
                  <li class="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[64px_minmax(0,0.8fr)_minmax(0,1.6fr)] md:gap-4">
                    <div class="flex items-center gap-2 md:block">
                      <span class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" [class]="level === 'verified' ? 'bg-emerald-600' : 'bg-[#032D42]'">
                        @if (level === 'verified') {
                          <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">verified</mat-icon>
                        } @else {
                          {{ stageIndex + 1 }}
                        }
                      </span>
                      <span class="sr-only">{{ 'Stage {0}' | t: [stageIndex + 1] }}</span>
                      @if (stage.title) {
                        <h3 class="font-semibold text-slate-900 md:hidden">{{ stage.title }}</h3>
                      }
                    </div>

                    <div>
                      @if (stage.title) {
                        <h3 class="hidden font-semibold text-slate-900 md:block">{{ stage.title }}</h3>
                      }
                      @if (uid()) {
                        <span class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="levelClasses(level)">
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">{{ levelIcon(level) }}</mat-icon>
                          {{ levelName(level) | t }}
                        </span>
                      }
                      @if (stage.skills.length) {
                        <ul class="mt-2 flex flex-wrap gap-1.5" [attr.aria-label]="'Required skills' | t">
                          @for (skill of stage.skills; track skill) {
                            <li class="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-[#006666]">{{ skill }}</li>
                          }
                        </ul>
                      }
                      @if (stage.description) {
                        <p class="mt-1.5 text-sm text-slate-600">{{ stage.description }}</p>
                      }
                    </div>

                    <ul class="space-y-2">
                      @for (step of stage.steps; track step.id) {
                        <li [id]="'step-' + step.id" class="scroll-mt-24 rounded-xl border p-3" [class]="done(step) ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'">
                          <div class="flex gap-2.5">
                            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" [class]="done(step) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                              <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">{{ done(step) ? 'check' : kindIcon(step) }}</mat-icon>
                              @if (done(step)) {
                                <span class="sr-only">{{ 'Done' | t }}</span>
                              }
                            </span>
                            <div class="min-w-0 flex-1">
                              <p class="text-[11px] font-semibold uppercase tracking-wide" [class]="isProof(step) ? 'text-violet-700' : 'text-slate-500'">
                                {{ kindLabel(step) | t }}@if (isProof(step)) { · {{ 'verifies skills' | t }} }@if (step.hours) { · {{ 'about {0} h' | t: [step.hours] }} }
                              </p>
                              <p class="font-semibold text-slate-900">{{ step.title }}</p>
                              @if (step.description) {
                                <p class="mt-0.5 whitespace-pre-line text-sm text-slate-600">{{ step.description }}</p>
                              }
                              @if (step.kind === 'course' && courseProgress(step) > 0 && !done(step)) {
                                <p class="mt-0.5 text-sm font-medium text-amber-800">{{ '{percent}% complete' | t: { percent: courseProgress(step) } }}</p>
                              }

                              <div class="mt-2 flex flex-wrap items-center gap-2">
                                @if (step.kind === 'course') {
                                  @if (courseAvailable(step)) {
                                    <a [routerLink]="['/courses', step.courseId]" class="inline-flex h-8 items-center rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                                      {{ (done(step) ? 'Review course' : courseProgress(step) > 0 ? 'Continue course' : 'Start course') | t }}
                                    </a>
                                  } @else {
                                    <span class="text-sm text-slate-500">{{ 'Course coming soon.' | t }}</span>
                                  }
                                }
                                @if (step.kind === 'certification' && step.certificationKey) {
                                  <a [routerLink]="['/courses/certifications', step.certificationKey]" class="inline-flex h-8 items-center rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800">
                                    {{ (done(step) ? 'View credential' : 'Take the assessment') | t }}
                                  </a>
                                }
                                @if (step.url) {
                                  <a [href]="step.url" target="_blank" rel="noopener noreferrer" class="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-[#007979] hover:text-[#007979]">
                                    {{ (step.kind === 'project' ? 'Project brief' : 'Open link') | t }}
                                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">open_in_new</mat-icon>
                                    <span class="sr-only">{{ '(opens in a new tab)' | t }}</span>
                                  </a>
                                }
                                @if (plan() && checkable(step)) {
                                  <button
                                    type="button"
                                    (click)="toggle(step)"
                                    [disabled]="busy()"
                                    class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-semibold disabled:opacity-60"
                                    [class]="done(step) ? 'text-slate-600 hover:bg-slate-100' : 'text-[#007979] hover:bg-teal-50'"
                                    [attr.aria-pressed]="done(step)"
                                  >
                                    <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ done(step) ? 'undo' : 'check_circle' }}</mat-icon>
                                    {{ (done(step) ? 'Mark as not done' : 'Mark as done') | t }}
                                  </button>
                                }
                              </div>

                              <!-- Project: submit a link for review -->
                              @if (step.kind === 'project') {
                                @let project = projectFor(step);
                                <div class="mt-3 rounded-lg bg-slate-50 p-3">
                                  <p class="flex flex-wrap items-center gap-2 text-sm">
                                    <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="projectStatus(project).classes">{{ projectStatus(project).label | t }}</span>
                                    @if (project?.url) {
                                      <a [href]="project!.url" target="_blank" rel="noopener noreferrer" class="truncate text-[#007979] underline">{{ 'Your submission' | t }}<span class="sr-only"> {{ '(opens in a new tab)' | t }}</span></a>
                                    }
                                  </p>
                                  @if (project?.feedback) {
                                    <p class="mt-2 whitespace-pre-line text-sm text-slate-700"><span class="font-semibold">{{ 'Reviewer feedback:' | t }}</span> {{ project!.feedback }}</p>
                                  }
                                  @if (plan() && project?.status !== 'verified') {
                                    @if (editingProject() === step.id) {
                                      <form class="mt-3 space-y-2" (submit)="$event.preventDefault(); submitProject(step)">
                                        <label class="block text-sm font-medium text-slate-800" [for]="'project-url-' + step.id">{{ 'Link to your work' | t }}</label>
                                        <input
                                          [id]="'project-url-' + step.id"
                                          type="url"
                                          required
                                          placeholder="https://"
                                          class="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-teal-100"
                                          [value]="projectUrl()"
                                          (input)="projectUrl.set($any($event.target).value)"
                                        />
                                        <label class="block text-sm font-medium text-slate-800" [for]="'project-notes-' + step.id">{{ 'Notes for the reviewer (optional)' | t }}</label>
                                        <textarea
                                          [id]="'project-notes-' + step.id"
                                          rows="3"
                                          maxlength="2000"
                                          class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-teal-100"
                                          [value]="projectNotes()"
                                          (input)="projectNotes.set($any($event.target).value)"
                                        ></textarea>
                                        <div class="flex gap-2">
                                          <button type="submit" [disabled]="busy()" class="inline-flex h-9 items-center rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">
                                            {{ 'Submit for review' | t }}
                                          </button>
                                          <button type="button" (click)="editingProject.set(null)" class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                                            {{ 'Cancel' | t }}
                                          </button>
                                        </div>
                                      </form>
                                    } @else {
                                      <button type="button" (click)="startProject(step)" class="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-violet-700 px-3 text-sm font-semibold text-white hover:bg-violet-800">
                                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">upload</mat-icon>
                                        {{ (project ? 'Update submission' : 'Submit your project') | t }}
                                      </button>
                                    }
                                  } @else if (!plan()) {
                                    <p class="mt-2 text-xs text-slate-500">{{ 'Choose this career to submit projects.' | t }}</p>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                        </li>
                      } @empty {
                        <li class="text-sm text-slate-500">{{ 'Learning for this stage is coming soon.' | t }}</li>
                      }
                    </ul>
                  </li>
                }
              </ol>
            </section>

            <!-- ================= Side: recommendations and jobs ================= -->
            <aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
              @if (info.courses.length) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="courses-title">
                  <h2 id="courses-title" class="flex items-center gap-2 font-semibold text-slate-900">
                    <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">school</mat-icon>
                    {{ 'Recommended courses' | t }}
                  </h2>
                  <ul class="mt-2 space-y-1.5">
                    @for (step of info.courses.slice(0, 5); track step.id) {
                      <li class="text-sm">
                        @if (stepLink(step); as link) {
                          <a [routerLink]="link" class="text-[#007979] hover:underline">{{ step.title }}</a>
                        } @else if (step.url) {
                          <a [href]="step.url" target="_blank" rel="noopener noreferrer" class="text-[#007979] hover:underline">{{ step.title }}<span class="sr-only"> {{ '(opens in a new tab)' | t }}</span></a>
                        } @else {
                          <span class="text-slate-700">{{ step.title }}</span> <span class="text-xs text-slate-500">({{ 'coming soon' | t }})</span>
                        }
                      </li>
                    }
                  </ul>
                </section>
              }

              @if (info.projects.length) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="projects-title">
                  <h2 id="projects-title" class="flex items-center gap-2 font-semibold text-slate-900">
                    <mat-icon class="!h-5 !w-5 !text-[20px] text-violet-700" aria-hidden="true">construction</mat-icon>
                    {{ 'Projects to complete' | t }}
                  </h2>
                  <ul class="mt-2 space-y-1.5">
                    @for (step of info.projects; track step.id) {
                      <li class="flex items-start justify-between gap-2 text-sm">
                        <a [href]="'#step-' + step.id" class="min-w-0 text-[#007979] hover:underline">{{ step.title }}</a>
                        <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="projectStatus(projectFor(step)).classes">{{ projectStatus(projectFor(step)).label | t }}</span>
                      </li>
                    }
                  </ul>
                </section>
              }

              @if (info.certifications.length) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="certs-title">
                  <h2 id="certs-title" class="flex items-center gap-2 font-semibold text-slate-900">
                    <mat-icon class="!h-5 !w-5 !text-[20px] text-violet-700" aria-hidden="true">workspace_premium</mat-icon>
                    {{ 'Recommended certifications' | t }}
                  </h2>
                  <ul class="mt-2 space-y-1">
                    @for (step of info.certifications; track step.id) {
                      <li><a [routerLink]="['/courses/certifications', step.certificationKey]" class="text-sm text-[#007979] hover:underline">{{ step.title }}</a></li>
                    }
                  </ul>
                </section>
              }

              <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="jobs-title">
                <h2 id="jobs-title" class="flex items-center gap-2 font-semibold text-slate-900">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">work</mat-icon>
                  {{ 'Matching jobs' | t }}
                </h2>
                @if (jobsLoading()) {
                  <p class="mt-2 text-sm text-slate-500">{{ 'Looking for jobs…' | t }}</p>
                } @else if (jobs().length) {
                  <ul class="mt-2 divide-y divide-slate-100">
                    @for (match of jobs(); track match.job.id) {
                      <li class="py-2">
                        <a [routerLink]="['/jobs', match.job.id]" class="block font-medium text-slate-900 hover:text-[#007979] hover:underline">{{ match.job.title }}</a>
                        <p class="text-xs text-slate-500">
                          {{ match.job.organizationName }}@if (match.job.location?.city) { · {{ match.job.location?.city }}, {{ match.job.location?.state }} }
                        </p>
                        @if (match.matchedSkills.length) {
                          <p class="mt-0.5 text-xs text-slate-600">{{ 'Asks for: {0}' | t: [match.matchedSkills.slice(0, 4).join(', ')] }}</p>
                        }
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="mt-2 text-sm text-slate-500">{{ 'No matching jobs on the Job Board right now.' | t }}</p>
                }
                @if (p.jobKeywords) {
                  <a routerLink="/jobs" [queryParams]="{ q: p.jobKeywords.split(',')[0].trim() }" class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
                    {{ 'Search the Job Board' | t }}
                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
                  </a>
                }
              </section>

              @if (p.description) {
                <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 class="font-semibold text-slate-900">{{ 'About this job' | t }}</h2>
                  <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ p.description }}</p>
                </section>
              }
              <p class="px-1 text-xs text-slate-500">
                {{ 'Pay and job outlook are estimates. Requirements can differ by employer and state.' | t }}
              </p>
            </aside>
          </div>
        </div>
      }
    </main>
  `,
})
export class CareerPathDetailComponent {
  private readonly service = inject(CareerPathService);
  private readonly courses = inject(CourseService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  /** Route parameter (component input binding). */
  readonly pathId = input.required<string>();

  protected readonly path = signal<CareerPath | null>(null);
  protected readonly plan = signal<CareerPlan | null>(null);
  protected readonly records = signal<LearnerRecords | null>(null);
  protected readonly jobs = signal<CareerJobMatch[]>([]);
  private readonly courseById = signal<Map<string, Course>>(new Map());
  protected readonly loading = signal(true);
  protected readonly jobsLoading = signal(false);
  protected readonly busy = signal(false);

  protected readonly editingProject = signal<string | null>(null);
  protected readonly projectUrl = signal('');
  protected readonly projectNotes = signal('');

  protected readonly uid = computed(() => this.auth.firebaseUser()?.uid ?? null);
  protected readonly isAdmin = computed(() => !!this.auth.user() && this.auth.isAdmin);
  private readonly headerTitle = useLearningHeaderTitle(inject(ActivatedRoute));

  protected readonly crumbs = computed<CourseCrumb[]>(() => [
    { label: 'Learning', link: '/courses' },
    { label: 'Career paths', link: '/courses/careers' },
    { label: this.path()?.title || 'Career path', translate: !this.path() },
  ]);

  protected readonly hours = computed(() => (this.path() ? totalHours(this.path()!) : 0));
  protected readonly levelLabel = computed(() => CAREER_LEVEL_LABELS[this.path()?.level ?? 'entry']);
  protected readonly insights = computed(() => careerInsights(this.path()!, this.plan(), this.records()));

  constructor() {
    effect(() => {
      void this.load(this.pathId());
    });

    effect(() => {
      const uid = this.uid();
      const path = this.path();
      if (!uid || !path) {
        this.plan.set(null);
        this.records.set(null);
        return;
      }
      void this.loadLearner(uid, path.id);
    });
  }

  private async load(pathId: string): Promise<void> {
    this.loading.set(true);
    try {
      const path = await this.service.get(pathId);
      this.path.set(path);
      if (path && allSteps(path).some((step) => step.kind === 'course')) {
        const list = await this.courses.listPublished(null).catch(() => []);
        this.courseById.set(new Map(list.map((course) => [course.id, course])));
      }
      if (path) void this.loadJobs(path);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadJobs(path: CareerPath): Promise<void> {
    this.jobsLoading.set(true);
    try {
      this.jobs.set(await this.service.matchingJobs(path));
    } catch (error) {
      console.warn('[Careers] Could not load matching jobs', error);
      this.jobs.set([]);
    } finally {
      this.jobsLoading.set(false);
    }
  }

  private async loadLearner(uid: string, pathId: string): Promise<void> {
    try {
      const [plan, records] = await Promise.all([this.service.getPlan(uid, pathId), this.service.learnerRecords(uid)]);
      this.plan.set(plan);
      this.records.set(records);
    } catch (error) {
      console.warn('[Careers] Could not load your plan', error);
    }
  }

  // ---------- Template helpers ----------

  protected done(step: CareerStep): boolean {
    const path = this.path();
    return !!path && isStepDone(path.id, step, this.plan(), this.records());
  }

  protected competency(stage: CareerStage): CompetencyLevel {
    return stageCompetency(stage, (step) => this.done(step));
  }

  protected readonly legend: CompetencyLevel[] = ['verified', 'learned', 'learning', 'gap'];

  protected levelName(level: CompetencyLevel): string {
    return COMPETENCY_LEVELS[level].label;
  }

  protected levelClasses(level: CompetencyLevel): string {
    return COMPETENCY_LEVELS[level].classes;
  }

  protected levelIcon(level: CompetencyLevel): string {
    return COMPETENCY_LEVELS[level].icon;
  }

  protected checkable(step: CareerStep): boolean {
    return canCheckOff(step);
  }

  protected isProof(step: CareerStep): boolean {
    return CAREER_STEP_KINDS[step.kind].role === 'verify';
  }

  protected courseAvailable(step: CareerStep): boolean {
    return !!step.courseId && this.courseById().has(step.courseId);
  }

  protected courseProgress(step: CareerStep): number {
    return (step.courseId && this.records()?.courseProgress.get(step.courseId)) || 0;
  }

  protected kindLabel(step: CareerStep): string {
    return CAREER_STEP_KINDS[step.kind].label;
  }

  protected kindIcon(step: CareerStep): string {
    return CAREER_STEP_KINDS[step.kind].icon;
  }

  /** In-app link for a step, when it has one. */
  protected stepLink(step: CareerStep): string[] | null {
    if (step.kind === 'course' && step.courseId && this.courseById().has(step.courseId)) return ['/courses', step.courseId];
    if (step.kind === 'certification' && step.certificationKey) return ['/courses/certifications', step.certificationKey];
    return null;
  }

  protected projectFor(step: CareerStep): CareerProject | null {
    const path = this.path();
    return (path && this.records()?.projects.get(`${path.id}__${step.id}`)) || null;
  }

  protected projectStatus(project: CareerProject | null): { label: string; classes: string } {
    return PROJECT_STATUS[project?.status ?? 'none'];
  }

  // ---------- Actions ----------

  async follow(): Promise<void> {
    const uid = this.uid();
    const path = this.path();
    if (!uid || !path) return;
    this.busy.set(true);
    try {
      this.plan.set(await this.service.savePlan(uid, path, [], null));
      this.notify.success('Added to My career plans.');
    } catch (error) {
      console.error('[Careers] Could not follow path', error);
      this.notify.error('Could not save. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async toggle(step: CareerStep): Promise<void> {
    const uid = this.uid();
    const path = this.path();
    const plan = this.plan();
    if (!uid || !path || !plan || !canCheckOff(step)) return;
    const ids = plan.completedStepIds.includes(step.id)
      ? plan.completedStepIds.filter((id) => id !== step.id)
      : [...plan.completedStepIds, step.id];
    // Keep only steps that still exist in the path.
    const known = new Set(allSteps(path).map((item) => item.id));
    this.busy.set(true);
    try {
      this.plan.set(await this.service.savePlan(uid, path, ids.filter((id) => known.has(id)), plan));
    } catch (error) {
      console.error('[Careers] Could not update step', error);
      this.notify.error('Could not save. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async leave(): Promise<void> {
    const uid = this.uid();
    const path = this.path();
    if (!uid || !path) return;
    this.busy.set(true);
    try {
      await this.service.leavePlan(uid, path.id);
      this.plan.set(null);
      this.notify.info('Removed from My career plans.');
    } catch (error) {
      console.error('[Careers] Could not leave path', error);
      this.notify.error('Could not save. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected startProject(step: CareerStep): void {
    const project = this.projectFor(step);
    this.projectUrl.set(project?.url ?? '');
    this.projectNotes.set(project?.notes ?? '');
    this.editingProject.set(step.id);
  }

  async submitProject(step: CareerStep): Promise<void> {
    const uid = this.uid();
    const path = this.path();
    const records = this.records();
    if (!uid || !path || !records) return;
    this.busy.set(true);
    try {
      const name = this.auth.user()?.displayName || this.auth.firebaseUser()?.displayName || '';
      const saved = await this.service.submitProject(uid, name, path, step, this.projectUrl(), this.projectNotes(), this.projectFor(step));
      const projects = new Map(records.projects);
      projects.set(`${path.id}__${step.id}`, saved);
      this.records.set({ ...records, projects });
      this.editingProject.set(null);
      this.notify.success('Project submitted for review.');
    } catch (error) {
      console.error('[Careers] Could not submit project', error);
      this.notify.error(error instanceof Error && error.message.startsWith('Add a link') ? error.message : 'Could not save. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}

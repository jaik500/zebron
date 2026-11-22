import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Course } from '../../courses/course.model';
import { CourseService } from '../../courses/course.service';
import { CertificationDefinition, CertificationService } from '../../courses/certification.service';
import { CourseHeaderComponent } from '../../courses/components/course-header.component';

import {
  allSteps,
  CAREER_LIMITS,
  CAREER_STEP_KINDS,
  CareerLevel,
  CareerPath,
  CareerProject,
  CareerStage,
  CareerStepKind,
  emptyPath,
  emptyStage,
  emptyStep,
  slugify,
  stepRole,
} from '../career-path.model';
import { CareerPathService } from '../career-path.service';

type Tab = 'paths' | 'reviews';

/** Stage skills are edited as one comma-separated line. */
interface EditableStage extends CareerStage {
  skillsText: string;
}

interface EditablePath extends Omit<CareerPath, 'stages'> {
  stages: EditableStage[];
  skillsText: string;
}

function toEditable(path: CareerPath): EditablePath {
  // Deep copy of the roadmap only: structuredClone would turn the Firestore
  // timestamps into plain objects (createdAt must be saved back unchanged).
  const copy = { ...path, skills: [...path.skills], stages: structuredClone(path.stages) };
  return {
    ...copy,
    skillsText: copy.skills.join(', '),
    stages: copy.stages.map((stage) => ({ ...stage, skillsText: stage.skills.join(', ') })),
  };
}

const splitSkills = (value: string, max: number) =>
  [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))].slice(0, max);

/**
 * Learning → Career paths → Manage (platform administrators):
 * write career roadmaps (with an AI first draft) and review the projects
 * learners submit. A project review is the practical check that turns a
 * "Learned" skill into a "Verified" one.
 */
@Component({
  selector: 'app-career-path-manage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <app-course-header
        basePath="/courses"
        backLink="/courses/careers"
        [crumbs]="[{ label: 'Learning', link: '/courses' }, { label: 'Career paths', link: '/courses/careers' }, { label: 'Manage' }]"
        [activeTab]="'learning'"
        [canManage]="true"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Manage career paths">
          <button type="button" role="tab" [attr.aria-selected]="tab() === 'paths'" (click)="tab.set('paths')"
            class="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold"
            [class]="tab() === 'paths' ? 'bg-[#032D42] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">route</mat-icon>
            Career paths
          </button>
          <button type="button" role="tab" [attr.aria-selected]="tab() === 'reviews'" (click)="tab.set('reviews'); loadReviews()"
            class="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold"
            [class]="tab() === 'reviews' ? 'bg-[#032D42] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">fact_check</mat-icon>
            Project reviews
            @if (reviews().length) {
              <span class="rounded-full bg-amber-400 px-2 text-xs text-amber-950">{{ reviews().length }}</span>
            }
          </button>
        </div>

        @if (tab() === 'reviews') {
          <!-- ================= Project reviews ================= -->
          <section class="space-y-3">
            <p class="text-sm text-slate-600">
              Projects learners submitted for a career roadmap. Verifying a project is what proves the skill: a finished course alone only counts as "Learned".
            </p>
            @if (reviewsLoading()) {
              <div class="h-32 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
            } @else if (!reviews().length) {
              <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                <mat-icon class="text-slate-400" aria-hidden="true">task_alt</mat-icon>
                <p class="mt-1">No projects are waiting for review.</p>
              </div>
            } @else {
              @for (project of reviews(); track project.id) {
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div class="flex flex-wrap items-start gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ project.pathTitle }}</p>
                      <h3 class="font-semibold text-slate-900">{{ project.stepTitle }}</h3>
                      <p class="text-sm text-slate-600">by {{ project.learnerName || 'a learner' }}@if (project.updatedAt) { · {{ project.updatedAt.toDate().toLocaleDateString() }} }</p>
                    </div>
                    <a [href]="project.url" target="_blank" rel="noopener noreferrer" class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-[#007979] hover:text-[#007979]">
                      Open the work
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">open_in_new</mat-icon>
                    </a>
                  </div>
                  @if (project.notes) {
                    <p class="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{{ project.notes }}</p>
                  }
                  @if (project.feedback) {
                    <p class="mt-2 text-xs text-slate-500">Earlier feedback: {{ project.feedback }}</p>
                  }
                  <mat-form-field appearance="outline" class="zb-field mt-3">
                    <mat-label>Feedback to the learner</mat-label>
                    <textarea matInput rows="2" maxlength="2000" [ngModel]="feedback()[project.id] || ''" (ngModelChange)="setFeedback(project.id, $event)"
                      placeholder="What works, and what to change if it needs more work."></textarea>
                  </mat-form-field>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" (click)="review(project, 'verified')" [disabled]="busy()" class="inline-flex h-10 items-center gap-1 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">verified</mat-icon>
                      Verify
                    </button>
                    <button type="button" (click)="review(project, 'needs-work')" [disabled]="busy() || !(feedback()[project.id] || '').trim()" class="inline-flex h-10 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      [title]="(feedback()[project.id] || '').trim() ? '' : 'Write feedback first'">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">replay</mat-icon>
                      Needs more work
                    </button>
                  </div>
                </article>
              }
            }
          </section>
        } @else {
          <!-- ================= Paths ================= -->
          <div class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside class="space-y-2">
              <button type="button" (click)="startNew()" class="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>
                New career path
              </button>
              @if (loading()) {
                <div class="h-40 animate-pulse rounded-xl bg-slate-200/70" aria-hidden="true"></div>
              }
              <ul class="space-y-1">
                @for (path of paths(); track path.id) {
                  <li>
                    <button type="button" (click)="edit(path)"
                      class="flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm"
                      [class]="editing()?.id === path.id && !isNew() ? 'border-[#007979] bg-teal-50' : 'border-slate-200 bg-white hover:border-slate-300'">
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-semibold text-slate-900">{{ path.title || 'Untitled' }}</span>
                        <span class="block text-xs text-slate-500">{{ path.stages.length }} stages · {{ stepCount(path) }} steps</span>
                      </span>
                      <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="path.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'">
                        {{ path.status === 'published' ? 'Live' : 'Draft' }}
                      </span>
                    </button>
                  </li>
                } @empty {
                  @if (!loading()) {
                    <li class="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No career paths yet.</li>
                  }
                }
              </ul>
            </aside>

            @if (editing(); as path) {
              <form (ngSubmit)="save()" class="min-w-0 space-y-4">
                <!-- Basics -->
                <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <h2 class="text-base font-semibold text-[#032D42]">{{ isNew() ? 'New career path' : 'Edit career path' }}</h2>
                    @if (!isNew()) {
                      <a [routerLink]="['/courses/careers', path.id]" target="_blank" class="ml-auto text-sm font-medium text-[#007979] hover:underline">View page</a>
                    }
                  </div>
                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Career (job title)</mat-label>
                      <input matInput name="title" [(ngModel)]="path.title" (ngModelChange)="onTitle()" required maxlength="120" placeholder="Cybersecurity Analyst" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Address key</mat-label>
                      <input matInput name="id" [(ngModel)]="path.id" [disabled]="!isNew()" required pattern="[a-z0-9-]+" maxlength="60" />
                      <mat-hint>/courses/careers/{{ path.id || '…' }}</mat-hint>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Field</mat-label>
                      <input matInput name="field" [(ngModel)]="path.field" maxlength="60" placeholder="Technology" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Level</mat-label>
                      <mat-select name="level" [(ngModel)]="path.level">
                        <mat-option value="entry">Entry level</mat-option>
                        <mat-option value="mid">Mid level</mat-option>
                        <mat-option value="senior">Senior</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <!-- AI first draft -->
                  <div class="mb-4 rounded-xl border border-[#007979]/30 bg-[#E8F4F4]/60 p-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="min-w-0 flex-1 text-sm text-slate-700">
                        Let AI draft the description, stages, required skills, courses, assessments and projects. It uses Zebron's published courses and certifications. Review everything before you publish.
                      </p>
                      <button type="button" (click)="draftWithAi()" [disabled]="drafting() || !path.title.trim()"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#007979]/40 bg-white px-3 text-sm font-semibold text-[#007979] hover:border-[#007979] disabled:opacity-50">
                        <mat-icon class="!h-[18px] !w-[18px] !text-[18px] {{ drafting() ? 'animate-spin' : '' }}" aria-hidden="true">{{ drafting() ? 'autorenew' : 'auto_awesome' }}</mat-icon>
                        {{ drafting() ? 'Drafting…' : 'Draft with AI' }}
                      </button>
                    </div>
                    <label class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      Area (for pay and outlook)
                      <input type="text" name="area" [(ngModel)]="area" class="h-8 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-xs focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20" />
                    </label>
                  </div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Summary (one line, on the card)</mat-label>
                    <input matInput name="summary" [(ngModel)]="path.summary" maxlength="240" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>About this job</mat-label>
                    <textarea matInput name="description" rows="4" [(ngModel)]="path.description" maxlength="3000"></textarea>
                  </mat-form-field>
                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Typical pay</mat-label>
                      <input matInput name="salaryRange" [(ngModel)]="path.salaryRange" maxlength="120" placeholder="$70,000–$95,000 a year" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Job Board search words</mat-label>
                      <input matInput name="jobKeywords" [(ngModel)]="path.jobKeywords" maxlength="100" placeholder="security analyst, SOC analyst" />
                      <mat-hint>Commas between. Matches open jobs by title.</mat-hint>
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Job outlook</mat-label>
                    <input matInput name="outlook" [(ngModel)]="path.outlook" maxlength="400" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Other skills (optional)</mat-label>
                    <input matInput name="skills" [(ngModel)]="path.skillsText" placeholder="Communication, Teamwork" />
                    <mat-hint>Commas between. Also used to match jobs. Required skills go on each stage below.</mat-hint>
                  </mat-form-field>
                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Status</mat-label>
                      <mat-select name="status" [(ngModel)]="path.status">
                        <mat-option value="draft">Draft (administrators only)</mat-option>
                        <mat-option value="published">Published</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Order</mat-label>
                      <input matInput type="number" name="order" [(ngModel)]="path.order" min="0" max="10000" />
                      <mat-hint>Lower shows first.</mat-hint>
                    </mat-form-field>
                  </div>
                </section>

                <!-- Roadmap -->
                <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 class="text-sm font-semibold text-[#032D42]">Roadmap</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    Each stage: the skills it requires, the learning that builds them, and an assessment or project that proves them.
                    Without an assessment or project a stage can only reach "Learned", never "Verified".
                  </p>

                  <ol class="mt-4 space-y-4">
                    @for (stage of path.stages; track stage.id; let stageIndex = $index; let firstStage = $first; let lastStage = $last) {
                      <li class="rounded-xl border border-slate-200 p-4">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#032D42] text-sm font-bold text-white">{{ stageIndex + 1 }}</span>
                          <span class="flex-1 text-sm font-semibold text-slate-700">Stage {{ stageIndex + 1 }}</span>
                          <button type="button" (click)="moveStage(stageIndex, -1)" [disabled]="firstStage" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move stage up"><mat-icon aria-hidden="true">arrow_upward</mat-icon></button>
                          <button type="button" (click)="moveStage(stageIndex, 1)" [disabled]="lastStage" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move stage down"><mat-icon aria-hidden="true">arrow_downward</mat-icon></button>
                          <button type="button" (click)="path.stages.splice(stageIndex, 1)" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Remove stage"><mat-icon aria-hidden="true">delete</mat-icon></button>
                        </div>
                        <div class="mt-3 grid gap-x-3 sm:grid-cols-2">
                          <mat-form-field appearance="outline" class="zb-field">
                            <mat-label>Stage name</mat-label>
                            <input matInput [name]="'stageTitle' + stage.id" [(ngModel)]="stage.title" maxlength="120" placeholder="Networking fundamentals" />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="zb-field">
                            <mat-label>Required skills</mat-label>
                            <input matInput [name]="'stageSkills' + stage.id" [(ngModel)]="stage.skillsText" placeholder="TCP/IP, DNS, Subnetting" />
                            <mat-hint>Commas between, up to {{ limits.skillsPerStage }}.</mat-hint>
                          </mat-form-field>
                        </div>
                        <mat-form-field appearance="outline" class="zb-field">
                          <mat-label>Stage description (optional)</mat-label>
                          <input matInput [name]="'stageDescription' + stage.id" [(ngModel)]="stage.description" maxlength="600" />
                        </mat-form-field>

                        @if (!hasVerification(stage)) {
                          <p class="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">warning</mat-icon>
                            No assessment or project: learners can't verify these skills yet.
                          </p>
                        }

                        <ul class="space-y-3">
                          @for (step of stage.steps; track step.id; let stepIndex = $index) {
                            <li class="rounded-lg border p-3" [class]="role(step.kind) === 'verify' ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'">
                              <div class="flex flex-wrap items-start gap-2">
                                <mat-form-field appearance="outline" class="zb-field w-48 shrink-0">
                                  <mat-label>Type</mat-label>
                                  <mat-select [name]="'kind' + step.id" [(ngModel)]="step.kind">
                                    @for (kind of kinds; track kind) {
                                      <mat-option [value]="kind">{{ kindLabel(kind) }} ({{ role(kind) === 'verify' ? 'proves' : 'learns' }})</mat-option>
                                    }
                                  </mat-select>
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="zb-field min-w-0 flex-1">
                                  <mat-label>Title</mat-label>
                                  <input matInput [name]="'stepTitle' + step.id" [(ngModel)]="step.title" maxlength="160" />
                                </mat-form-field>
                                <button type="button" (click)="moveStep(stage, stepIndex, -1)" [disabled]="stepIndex === 0" class="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white disabled:opacity-30" aria-label="Move step up"><mat-icon aria-hidden="true">arrow_upward</mat-icon></button>
                                <button type="button" (click)="stage.steps.splice(stepIndex, 1)" class="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Remove step"><mat-icon aria-hidden="true">close</mat-icon></button>
                              </div>

                              @if (step.kind === 'course') {
                                <mat-form-field appearance="outline" class="zb-field">
                                  <mat-label>Zebron course</mat-label>
                                  <mat-select [name]="'course' + step.id" [(ngModel)]="step.courseId" (ngModelChange)="onCourse(step)">
                                    <mat-option [value]="null">Not on Zebron yet (coming soon)</mat-option>
                                    @for (course of courses(); track course.id) {
                                      <mat-option [value]="course.id">{{ course.title }}</mat-option>
                                    }
                                  </mat-select>
                                  <mat-hint>Ticks itself when the learner finishes the course (and passes its final exam).</mat-hint>
                                </mat-form-field>
                              }
                              @if (step.kind === 'certification') {
                                <mat-form-field appearance="outline" class="zb-field">
                                  <mat-label>Zebron certification</mat-label>
                                  <mat-select [name]="'cert' + step.id" [(ngModel)]="step.certificationKey" (ngModelChange)="onCertification(step)">
                                    <mat-option [value]="null">None yet</mat-option>
                                    @for (certification of certifications(); track certification.key) {
                                      <mat-option [value]="certification.key">{{ certification.title }}</mat-option>
                                    }
                                  </mat-select>
                                  <mat-hint>Verified when the learner earns the credential.</mat-hint>
                                </mat-form-field>
                              }
                              @if (step.kind === 'project') {
                                <p class="mb-2 text-xs text-slate-600">The learner submits a link to their work; you verify it under Project reviews.</p>
                              }

                              <mat-form-field appearance="outline" class="zb-field">
                                <mat-label>{{ step.kind === 'project' ? 'Project brief: what to build' : 'Description (optional)' }}</mat-label>
                                <textarea matInput rows="2" [name]="'stepDescription' + step.id" [(ngModel)]="step.description" maxlength="1000"></textarea>
                              </mat-form-field>
                              <div class="grid gap-x-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                                <mat-form-field appearance="outline" class="zb-field">
                                  <mat-label>{{ step.kind === 'resource' ? 'Link' : 'Extra link (optional)' }}</mat-label>
                                  <input matInput [name]="'url' + step.id" [(ngModel)]="step.url" placeholder="https://…" maxlength="500" />
                                </mat-form-field>
                                <mat-form-field appearance="outline" class="zb-field">
                                  <mat-label>Hours</mat-label>
                                  <input matInput type="number" [name]="'hours' + step.id" [(ngModel)]="step.hours" min="0" max="2000" />
                                </mat-form-field>
                              </div>
                            </li>
                          }
                        </ul>
                        <div class="mt-2 flex flex-wrap gap-2">
                          <button type="button" (click)="addStep(stage, 'course')" [disabled]="stage.steps.length >= limits.stepsPerStage" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10 disabled:opacity-40">
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">add</mat-icon> Learning
                          </button>
                          <button type="button" (click)="addStep(stage, 'certification')" [disabled]="stage.steps.length >= limits.stepsPerStage" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">add</mat-icon> Assessment
                          </button>
                          <button type="button" (click)="addStep(stage, 'project')" [disabled]="stage.steps.length >= limits.stepsPerStage" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">add</mat-icon> Project
                          </button>
                        </div>
                      </li>
                    }
                  </ol>
                  <button type="button" (click)="path.stages.push(newStage())" [disabled]="path.stages.length >= limits.stages" class="mt-3 inline-flex h-9 items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-[#007979] hover:text-[#007979] disabled:opacity-40">
                    <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>
                    Add a stage
                  </button>
                </section>

                <div class="flex flex-wrap items-center gap-2">
                  <button type="submit" [disabled]="busy()" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-5 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                    {{ busy() ? 'Saving…' : isNew() ? 'Create career path' : 'Save career path' }}
                  </button>
                  <button type="button" (click)="editing.set(null)" class="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  @if (!isNew()) {
                    <button type="button" (click)="remove()" class="ml-auto text-sm font-medium text-red-600 hover:underline">Delete career path</button>
                  }
                </div>
              </form>
            } @else {
              <section class="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                <mat-icon class="text-slate-400" aria-hidden="true">route</mat-icon>
                <p class="mt-2">Pick a career path to edit, or start a new one.</p>
              </section>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class CareerPathManageComponent implements OnInit {
  private readonly service = inject(CareerPathService);
  private readonly courseService = inject(CourseService);
  private readonly certificationService = inject(CertificationService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  protected readonly limits = CAREER_LIMITS;
  protected readonly kinds = Object.keys(CAREER_STEP_KINDS) as CareerStepKind[];

  protected readonly tab = signal<Tab>('paths');
  protected readonly paths = signal<CareerPath[]>([]);
  protected readonly courses = signal<Course[]>([]);
  protected readonly certifications = signal<CertificationDefinition[]>([]);
  protected readonly editing = signal<EditablePath | null>(null);
  protected readonly isNew = signal(false);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly drafting = signal(false);
  protected area = 'United States';

  protected readonly reviews = signal<CareerProject[]>([]);
  protected readonly reviewsLoading = signal(false);
  protected readonly feedback = signal<Record<string, string>>({});

  private readonly courseById = computed(() => new Map(this.courses().map((course) => [course.id, course])));
  private readonly certificationByKey = computed(() => new Map(this.certifications().map((item) => [item.key, item])));

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadPaths(), this.loadCatalog(), this.loadReviews()]);
  }

  private async loadPaths(): Promise<void> {
    this.loading.set(true);
    try {
      this.paths.set(await this.service.listAll());
    } catch (error) {
      console.error('[Careers] Could not load career paths', error);
      this.notify.error('Career paths could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCatalog(): Promise<void> {
    const [courses, certifications] = await Promise.all([
      this.courseService.listPublished(null).catch(() => [] as Course[]),
      this.certificationService.listDefinitions(null).catch(() => [] as CertificationDefinition[]),
    ]);
    this.courses.set([...courses].sort((a, b) => a.title.localeCompare(b.title)));
    this.certifications.set([...certifications].sort((a, b) => a.title.localeCompare(b.title)));
  }

  async loadReviews(): Promise<void> {
    this.reviewsLoading.set(true);
    try {
      this.reviews.set(await this.service.listProjectsForReview());
    } catch (error) {
      console.error('[Careers] Could not load project reviews', error);
    } finally {
      this.reviewsLoading.set(false);
    }
  }

  // ---------- Editing ----------

  protected stepCount(path: CareerPath): number {
    return allSteps(path).length;
  }

  protected kindLabel(kind: CareerStepKind): string {
    return CAREER_STEP_KINDS[kind].label;
  }

  protected role(kind: CareerStepKind) {
    return stepRole({ kind });
  }

  protected hasVerification(stage: CareerStage): boolean {
    return stage.steps.some((step) => stepRole(step) === 'verify');
  }

  protected newStage(): EditableStage {
    return { ...emptyStage(), skillsText: '' };
  }

  startNew(): void {
    const path = emptyPath();
    this.editing.set({ ...path, skillsText: '', stages: path.stages.map((stage) => ({ ...stage, skillsText: '' })) });
    this.isNew.set(true);
  }

  edit(path: CareerPath): void {
    this.editing.set(toEditable(path));
    this.isNew.set(false);
  }

  onTitle(): void {
    const path = this.editing();
    if (path && this.isNew()) path.id = slugify(path.title);
  }

  /** Fills an empty title from the course picked. */
  onCourse(step: { title: string; courseId: string | null; hours: number }): void {
    const course = step.courseId ? this.courseById().get(step.courseId) : null;
    if (course && !step.title.trim()) step.title = course.title;
  }

  onCertification(step: { title: string; certificationKey: string | null }): void {
    const certification = step.certificationKey ? this.certificationByKey().get(step.certificationKey) : null;
    if (certification && !step.title.trim()) step.title = certification.title;
  }

  addStep(stage: EditableStage, kind: CareerStepKind): void {
    stage.steps.push(emptyStep(kind));
  }

  moveStage(index: number, delta: number): void {
    const stages = this.editing()?.stages;
    if (!stages) return;
    const [stage] = stages.splice(index, 1);
    stages.splice(index + delta, 0, stage);
  }

  moveStep(stage: EditableStage, index: number, delta: number): void {
    const [step] = stage.steps.splice(index, 1);
    stage.steps.splice(Math.max(0, index + delta), 0, step);
  }

  async save(): Promise<void> {
    const path = this.editing();
    if (!path) return;
    path.id = slugify(path.id);
    if (!path.title.trim() || !path.id) {
      this.notify.error('Add a career title and an address key.');
      return;
    }
    const stages: CareerStage[] = path.stages.map(({ skillsText, ...stage }) => ({
      ...stage,
      skills: splitSkills(skillsText, CAREER_LIMITS.skillsPerStage),
    }));
    if (path.status === 'published' && !stages.some((stage) => stage.steps.some((step) => step.title.trim()))) {
      this.notify.error('Add at least one step before publishing.');
      return;
    }
    const { skillsText, ...rest } = path;
    const toSave: CareerPath = { ...rest, skills: splitSkills(skillsText, CAREER_LIMITS.skills), stages };

    this.busy.set(true);
    try {
      if (this.isNew() && (await this.service.exists(toSave.id))) {
        this.notify.error('That address key is taken. Change it and save again.');
        return;
      }
      await this.service.save(toSave);
      this.notify.success(this.isNew() ? 'Career path created.' : 'Career path saved.');
      await this.loadPaths();
      const saved = this.paths().find((item) => item.id === toSave.id);
      if (saved) this.edit(saved);
    } catch (error) {
      console.error('[Careers] Could not save career path', error);
      this.notify.error('Could not save. Check the fields and try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    const path = this.editing();
    if (!path || !window.confirm(`Delete the career path "${path.title}"? Learners following it lose it from My career plans.`)) return;
    this.busy.set(true);
    try {
      await this.service.delete(path.id);
      this.editing.set(null);
      this.notify.success('Career path deleted.');
      await this.loadPaths();
    } catch (error) {
      console.error('[Careers] Could not delete career path', error);
      this.notify.error('Could not delete. Try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async draftWithAi(): Promise<void> {
    const path = this.editing();
    if (!path?.title.trim()) return;
    const hasContent = path.description.trim() || allSteps(path).some((step) => step.title.trim());
    if (hasContent && !window.confirm('Replace the description and roadmap with an AI draft? Nothing is saved until you click Save.')) return;
    this.drafting.set(true);
    try {
      const draft = await this.service.draftWithAi({
        title: path.title.trim(),
        level: path.level as CareerLevel,
        area: this.area.trim(),
        courses: this.courses().slice(0, 150).map((course) => ({ id: course.id, title: course.title, skills: course.skills.slice(0, 8) })),
        certifications: this.certifications().slice(0, 60).map((item) => ({ key: item.key, title: item.title })),
      });
      // Keep only course and certification ids that exist on Zebron.
      const stages = draft.stages.map((stage) => ({
        ...stage,
        skillsText: stage.skills.join(', '),
        steps: stage.steps.map((step) => ({
          ...step,
          courseId: step.courseId && this.courseById().has(step.courseId) ? step.courseId : null,
          certificationKey: step.certificationKey && this.certificationByKey().has(step.certificationKey) ? step.certificationKey : null,
        })),
      }));
      this.editing.set({
        ...path,
        summary: draft.summary || path.summary,
        description: draft.description || path.description,
        field: draft.field || path.field,
        salaryRange: draft.salaryRange || path.salaryRange,
        outlook: draft.outlook || path.outlook,
        jobKeywords: draft.jobKeywords || path.jobKeywords,
        skillsText: draft.skills.join(', ') || path.skillsText,
        stages: stages.length ? stages : path.stages,
        status: 'draft',
      });
      this.notify.info('Draft ready. Check pay, outlook and every step before you publish.');
    } catch (error) {
      console.error('[Careers] AI draft failed', error);
      this.notify.error('The AI draft did not work. Try again in a moment.');
    } finally {
      this.drafting.set(false);
    }
  }

  // ---------- Reviews ----------

  setFeedback(id: string, value: string): void {
    this.feedback.update((current) => ({ ...current, [id]: value }));
  }

  async review(project: CareerProject, status: 'verified' | 'needs-work'): Promise<void> {
    const reviewerId = this.auth.firebaseUser()?.uid;
    if (!reviewerId) return;
    this.busy.set(true);
    try {
      await this.service.reviewProject(reviewerId, project, status, this.feedback()[project.id] || '');
      this.reviews.update((list) => list.filter((item) => item.id !== project.id));
      this.notify.success(status === 'verified' ? 'Project verified.' : 'Sent back with your feedback.');
    } catch (error) {
      console.error('[Careers] Could not save review', error);
      this.notify.error('Could not save the review. Try again.');
    } finally {
      this.busy.set(false);
    }
  }
}

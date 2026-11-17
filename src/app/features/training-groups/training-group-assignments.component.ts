import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { doc, getDoc } from 'firebase/firestore';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { firestore } from '../../core/services/firebase-config';
import { LoggerService } from '../../core/services/logger.service';
import { downloadCsv } from '../../shared/csv-download';
import { CodeLabComponent } from '../coding-lab/code-lab.component';
import { CODE_LANGUAGES, CodeExercise, CodeLanguage } from '../coding-lab/code-lab.model';
import { MarkdownFieldComponent } from '../courses/builder/markdown-field.component';
import { renderKnowledgeContent } from '../partner/knowledge/knowledge-content.util';
import {
  AssignmentDraft,
  AssignmentFile,
  AssignmentLink,
  AssignmentSubmission,
  GroupAssignment,
  MAX_MATERIALS,
  MAX_SUBMISSION_FILES,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_TYPES,
  SubmissionStatus,
  SubmissionType,
  TrainingGroupAssignmentService,
} from './training-group-assignment.service';
import { TrainingGroupMember } from './training-group.service';

/** The assignment form (new or existing). */
interface EditDraft {
  id: string;
  isNew: boolean;
  wasPublished: boolean;
  title: string;
  kind: 'assignment' | 'project';
  instructions: string;
  due: string;
  acceptLate: boolean;
  submissionTypes: SubmissionType[];
  codeLanguage: CodeLanguage;
  links: AssignmentLink[];
  materials: AssignmentFile[];
}

/** A learner's work in progress. */
interface WorkDraft {
  text: string;
  links: AssignmentLink[];
  files: AssignmentFile[];
  code: string;
}

/** One line of the staff's submissions list: everyone on the roster, plus anyone who left after handing in. */
interface SubmissionRow {
  userId: string;
  name: string;
  email: string | null;
  submission: AssignmentSubmission | null;
  status: SubmissionStatus | 'not_submitted';
  leftGroup: boolean;
}

type RowFilter = 'all' | 'submitted' | 'needs_revision' | 'complete' | 'not_submitted';

/**
 * Assignments and individual projects in a training group.
 *
 * - Staff (managers, the group's leads and instructors): create, edit,
 *   publish and delete assignments; see who handed in; review each piece of
 *   work as Complete or Needs revision, with feedback.
 * - Members: see published assignments, hand in work (written answer,
 *   links, files, code), see feedback and hand in again when asked.
 *
 * Everything is checked again on the server (training-group-assignments.ts).
 */
@Component({
  selector: 'app-training-group-assignments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, TranslatePipe, MarkdownFieldComponent, CodeLabComponent],
  template: `
    @if (isStaff() || isMember()) {
    <section class="mt-5 rounded-2xl border border-slate-200 bg-white" aria-labelledby="group-assignments-title" id="assignments">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
        @if (view() !== 'list') {
          <button type="button" (click)="backToList()" class="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100" [attr.aria-label]="'Back to assignments' | t" [title]="'Back to assignments' | t">
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </button>
        }
        <h2 id="group-assignments-title" class="text-base font-semibold text-slate-900">{{ 'Assignments and projects' | t }}</h2>
        @if (view() === 'list') {
          <span class="rounded-full bg-slate-100 px-2 text-xs text-slate-600">{{ assignments().length }}</span>
          @if (isStaff() && !locked()) {
            <button type="button" (click)="startNew()" class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add_task</mat-icon>
              <span class="hidden sm:inline">{{ 'New assignment' | t }}</span>
              <span class="sm:hidden">{{ 'New' | t }}</span>
            </button>
          }
        }
      </div>

      @if (error()) {
        <p class="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ error() | t }}</p>
      }
      @if (notice()) {
        <p class="mx-5 mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">{{ notice() | t }}</p>
      }

      <!-- ============ LIST ============ -->
      @if (view() === 'list') {
        @if (loading()) {
          <p class="px-5 py-4 text-sm text-slate-500">{{ 'Loading assignments…' | t }}</p>
        } @else if (!assignments().length) {
          <p class="px-5 py-6 text-center text-sm text-slate-600">
            {{ (isStaff() ? 'No assignments yet. Create one to give the group written work, links, files or code to hand in, and review what they send.' : 'No assignments yet.') | t }}
          </p>
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (item of assignments(); track item.id) {
              <li>
                <button type="button" (click)="open(item)" class="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                  <mat-icon class="shrink-0 text-[#007979]" aria-hidden="true">{{ item.kind === 'project' ? 'rocket_launch' : 'assignment' }}</mat-icon>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-sm font-semibold text-slate-900">{{ item.title }}</span>
                      @if (item.status === 'draft') {
                        <span class="shrink-0 rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-700">{{ 'Draft' | t }}</span>
                      }
                    </span>
                    <span class="block truncate text-xs text-slate-500">
                      {{ (item.kind === 'project' ? 'Project' : 'Assignment') | t }}
                      @if (item.dueAt) {
                        ·
                        <span [class]="isOverdue(item) && !isStaff() && myStatus(item) !== 'complete' ? 'font-semibold text-rose-700' : ''">{{ 'Due {0}' | t: [item.dueAt | date: 'MMM d, h:mm a'] }}</span>
                      }
                    </span>
                  </span>
                  @if (isStaff()) {
                    <span class="hidden shrink-0 items-center gap-1.5 text-xs sm:flex">
                      @if (item.counts.submitted) {
                        <span class="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800">{{ '{0} to review' | t: [item.counts.submitted] }}</span>
                      }
                      <span class="text-slate-500">{{ '{0} of {1} complete' | t: [item.counts.complete, memberCount()] }}</span>
                    </span>
                    @if (item.counts.submitted) {
                      <span class="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 sm:hidden">{{ item.counts.submitted }}</span>
                    }
                  } @else {
                    <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusInfo(myStatus(item)).classes">{{ statusInfo(myStatus(item)).label | t }}</span>
                  }
                  <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">chevron_right</mat-icon>
                </button>
              </li>
            }
          </ul>
        }
      }

      <!-- ============ EDIT (staff) ============ -->
      @if (view() === 'edit' && draft(); as form) {
        <form class="space-y-5 px-5 py-4" (submit)="$event.preventDefault()">
          <fieldset>
            <legend class="text-sm font-semibold text-slate-800">{{ 'Type' | t }}</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              @for (option of kinds; track option.value) {
                <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" [class]="form.kind === option.value ? 'border-[#007979] bg-teal-50 font-semibold text-[#007979]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'">
                  <input type="radio" name="kind" class="sr-only" [checked]="form.kind === option.value" (change)="patch({ kind: option.value })" />
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ option.icon }}</mat-icon>
                  {{ option.label | t }}
                </label>
              }
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ 'Projects are larger pieces of individual work, usually with a later due date.' | t }}</p>
          </fieldset>

          <label class="block">
            <span class="text-sm font-semibold text-slate-800">{{ 'Title' | t }}</span>
            <input type="text" maxlength="150" class="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20" [value]="form.title" (input)="patch({ title: $any($event.target).value })" />
          </label>

          <div>
            <app-markdown-field [value]="form.instructions" [label]="'Instructions' | t" [rows]="8" [placeholder]="'What should learners do, and what does good work look like?' | t" (valueChange)="patch({ instructions: $event })" />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-semibold text-slate-800">{{ 'Due' | t }} <span class="font-normal text-slate-500">({{ 'optional' | t }})</span></span>
              <input type="datetime-local" class="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20" [value]="form.due" (input)="patch({ due: $any($event.target).value })" />
            </label>
            <label class="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="form.acceptLate" (change)="patch({ acceptLate: $any($event.target).checked })" />
              {{ 'Accept late work (marked late)' | t }}
            </label>
          </div>

          <fieldset>
            <legend class="text-sm font-semibold text-slate-800">{{ 'How learners hand in their work' | t }}</legend>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              @for (type of submissionTypes; track type.value) {
                <label class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="form.submissionTypes.includes(type.value)" (change)="toggleType(type.value, $any($event.target).checked)" />
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] text-slate-500" aria-hidden="true">{{ type.icon }}</mat-icon>
                  {{ type.label | t }}
                </label>
              }
            </div>
            @if (form.submissionTypes.includes('code')) {
              <label class="mt-2 flex items-center gap-2 text-sm text-slate-700">
                {{ 'Language' | t }}
                <select class="h-9 rounded-lg border border-slate-300 px-2 text-sm" [value]="form.codeLanguage" (change)="patch({ codeLanguage: $any($event.target).value })">
                  @for (language of codeLanguages; track language.value) {
                    <option [value]="language.value">{{ language.label }}</option>
                  }
                </select>
              </label>
            }
          </fieldset>

          <fieldset>
            <legend class="text-sm font-semibold text-slate-800">{{ 'Links for learners' | t }} <span class="font-normal text-slate-500">({{ 'optional' | t }})</span></legend>
            <div class="mt-2 space-y-2">
              @for (link of form.links; track $index; let index = $index) {
                <div class="flex flex-wrap gap-2 sm:flex-nowrap">
                  <input type="text" maxlength="150" class="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm sm:w-48" [placeholder]="'Label' | t" [value]="link.label" (input)="setFormLink(index, 'label', $any($event.target).value)" [attr.aria-label]="'Link label' | t" />
                  <input type="url" class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" placeholder="https://" [value]="link.url" (input)="setFormLink(index, 'url', $any($event.target).value)" [attr.aria-label]="'Link address' | t" />
                  <button type="button" (click)="removeFormLink(index)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700" [attr.aria-label]="'Remove link' | t" [title]="'Remove link' | t">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon>
                  </button>
                </div>
              }
              @if (form.links.length < 10) {
                <button type="button" (click)="addFormLink()" class="inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add_link</mat-icon>{{ 'Add a link' | t }}
                </button>
              }
            </div>
          </fieldset>

          <fieldset>
            <legend class="text-sm font-semibold text-slate-800">{{ 'Files for learners' | t }} <span class="font-normal text-slate-500">({{ 'optional, up to 25 MB each' | t }})</span></legend>
            <ul class="mt-2 space-y-1">
              @for (file of form.materials; track file.path) {
                <li class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                  <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] text-slate-500" aria-hidden="true">description</mat-icon>
                  <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                  <span class="shrink-0 text-xs text-slate-500">{{ fileSize(file.size) }}</span>
                  <button type="button" (click)="removeMaterial(file)" class="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-rose-50 hover:text-rose-700" [attr.aria-label]="'Remove {0}' | t: [file.name]">
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">close</mat-icon>
                  </button>
                </li>
              }
            </ul>
            @if (form.materials.length < maxMaterials) {
              <label class="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">upload_file</mat-icon>
                {{ (uploading() ? 'Uploading…' : 'Upload files') | t }}
                <input type="file" multiple class="sr-only" [disabled]="uploading()" (change)="uploadMaterials($event)" />
              </label>
            }
          </fieldset>

          <div class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            @if (!form.isNew) {
              <button type="button" (click)="confirmDelete.set(true)" [disabled]="busy()" class="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon>{{ 'Delete' | t }}
              </button>
            }
            <span class="flex-1"></span>
            <button type="button" (click)="backToList()" [disabled]="busy()" class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{{ 'Cancel' | t }}</button>
            @if (!form.wasPublished) {
              <button type="button" (click)="saveDraft('draft')" [disabled]="busy() || uploading()" class="inline-flex h-10 items-center justify-center rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50 disabled:opacity-50">{{ 'Save as draft' | t }}</button>
            }
            <button type="button" (click)="saveDraft('published')" [disabled]="busy() || uploading()" class="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ form.wasPublished ? 'save' : 'send' }}</mat-icon>
              {{ (form.wasPublished ? 'Save changes' : 'Publish to the group') | t }}
            </button>
          </div>

          @if (confirmDelete()) {
            <div class="rounded-xl border border-rose-200 bg-rose-50 p-4" role="alertdialog" aria-labelledby="delete-assignment-title">
              <p id="delete-assignment-title" class="text-sm font-semibold text-rose-900">{{ 'Delete this assignment?' | t }}</p>
              <p class="mt-1 text-sm text-rose-800">{{ 'Everything learners handed in for it, and its files, will be deleted too. This can’t be undone.' | t }}</p>
              <div class="mt-3 flex gap-2">
                <button type="button" (click)="deleteAssignment()" [disabled]="busy()" class="inline-flex h-9 items-center rounded-lg bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50">{{ 'Delete' | t }}</button>
                <button type="button" (click)="confirmDelete.set(false)" class="inline-flex h-9 items-center rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-slate-700">{{ 'Keep it' | t }}</button>
              </div>
            </div>
          }
        </form>
      }

      <!-- ============ OPEN ============ -->
      @if (view() === 'open' && current(); as item) {
        <div class="px-5 py-4">
          <div class="flex flex-wrap items-start gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">
                {{ (item.kind === 'project' ? 'Project' : 'Assignment') | t }}
                @if (item.status === 'draft') { · {{ 'Draft' | t }} }
              </p>
              <h3 class="mt-0.5 break-words text-lg font-semibold text-slate-900">{{ item.title }}</h3>
              <p class="mt-1 text-sm text-slate-600">
                @if (item.dueAt) {
                  <span [class]="isOverdue(item) ? 'font-semibold text-rose-700' : ''">{{ 'Due {0}' | t: [item.dueAt | date: 'EEEE, MMM d, y, h:mm a'] }}</span>
                  · {{ (item.acceptLate ? 'Late work accepted' : 'No late work') | t }}
                } @else {
                  {{ 'No due date' | t }}
                }
              </p>
            </div>
            @if (isStaff() && !locked()) {
              <button type="button" (click)="edit(item)" class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">edit</mat-icon>{{ 'Edit' | t }}
              </button>
            }
          </div>

          @if (item.instructions) {
            <div class="mt-4 break-words rounded-xl bg-slate-50 px-4 py-3 text-[0.975rem] leading-7 text-slate-800 [&_a]:text-teal-700 [&_a]:underline [&_code]:rounded [&_code]:bg-white [&_code]:px-1 [&_code]:text-sm [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-semibold [&_ol]:mb-3 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-50 [&_ul]:mb-3 [&_ul]:ml-6 [&_ul]:list-disc [&>*:last-child]:mb-0" [innerHTML]="html(item.instructions)"></div>
          }

          @if (item.links.length || item.materials.length) {
            <ul class="mt-3 flex flex-wrap gap-2">
              @for (link of item.links; track $index) {
                <li><a [href]="link.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#007979] hover:bg-teal-50"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">link</mat-icon>{{ link.label }}</a></li>
              }
              @for (file of item.materials; track file.path) {
                <li><button type="button" (click)="openFile(file)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#007979] hover:bg-teal-50"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>{{ file.name }}</button></li>
              }
            </ul>
          }

          <!-- ---------- Staff: who handed in, and review ---------- -->
          @if (isStaff()) {
            <div class="mt-6">
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-sm font-semibold text-slate-900">{{ 'Submissions' | t }}</h4>
                <span class="flex-1"></span>
                <button type="button" (click)="exportRows()" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>{{ 'Export CSV' | t }}
                </button>
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5" role="group" [attr.aria-label]="'Filter submissions' | t">
                @for (option of filters; track option.value) {
                  <button type="button" (click)="rowFilter.set(option.value)" class="rounded-full border px-2.5 py-1 text-xs font-semibold" [class]="rowFilter() === option.value ? 'border-[#007979] bg-[#007979] text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'" [attr.aria-pressed]="rowFilter() === option.value">
                    {{ option.label | t }} ({{ filterCount(option.value) }})
                  </button>
                }
              </div>

              @if (submissionsLoading()) {
                <p class="py-4 text-sm text-slate-500">{{ 'Loading submissions…' | t }}</p>
              } @else if (!shownRows().length) {
                <p class="py-4 text-sm text-slate-500">{{ 'Nobody here.' | t }}</p>
              } @else {
                <ul class="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  @for (row of shownRows(); track row.userId) {
                    <li>
                      <button type="button" (click)="selectRow(row)" [disabled]="!row.submission" class="flex w-full items-center gap-3 px-4 py-2.5 text-left enabled:hover:bg-slate-50 disabled:cursor-default" [class.bg-teal-50]="selected()?.userId === row.userId">
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-semibold text-slate-900">{{ row.name }}@if (row.leftGroup) { <span class="font-normal text-slate-500">({{ 'left the group' | t }})</span> }</span>
                          @if (row.submission) {
                            <span class="block truncate text-xs text-slate-500">
                              {{ 'Handed in {0}' | t: [row.submission.submittedAt | date: 'MMM d, h:mm a'] }}
                              @if (row.submission.attempt > 1) { · {{ 'Attempt {0}' | t: [row.submission.attempt] }} }
                              @if (row.submission.late) { · <span class="font-semibold text-rose-700">{{ 'Late' | t }}</span> }
                            </span>
                          }
                        </span>
                        <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusInfo(row.status).classes">{{ statusInfo(row.status).label | t }}</span>
                        @if (row.submission) {
                          <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">chevron_right</mat-icon>
                        }
                      </button>
                    </li>
                  }
                </ul>
              }

              @if (selected(); as work) {
                <div class="mt-4 rounded-xl border border-[#007979]/30 bg-white" id="review-panel">
                  <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
                    <h4 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{{ 'Work from {0}' | t: [work.userName] }}</h4>
                    <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusInfo(work.status).classes">{{ statusInfo(work.status).label | t }}</span>
                    <button type="button" (click)="selected.set(null)" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" [attr.aria-label]="'Close' | t"><mat-icon aria-hidden="true">close</mat-icon></button>
                  </div>
                  <div class="space-y-4 px-4 py-3">
                    @if (work.text) {
                      <div class="break-words text-sm leading-6 text-slate-800 [&_a]:text-teal-700 [&_a]:underline [&_li]:my-0.5 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:ml-5 [&_ul]:list-disc" [innerHTML]="html(work.text)"></div>
                    }
                    @if (work.links.length || work.files.length) {
                      <ul class="flex flex-wrap gap-2">
                        @for (link of work.links; track $index) {
                          <li><a [href]="link.url" target="_blank" rel="noopener noreferrer" class="inline-flex max-w-full items-center gap-1 truncate rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#007979] hover:bg-teal-50"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">open_in_new</mat-icon>{{ link.label }}</a></li>
                        }
                        @for (file of work.files; track file.path) {
                          <li><button type="button" (click)="openFile(file)" class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#007979] hover:bg-teal-50"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">download</mat-icon>{{ file.name }} <span class="font-normal text-slate-500">{{ fileSize(file.size) }}</span></button></li>
                        }
                      </ul>
                    }
                    @if (work.code && reviewExercise(); as exercise) {
                      <div>
                        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Code (you can run it)' | t }}</p>
                        <app-code-lab [exercise]="exercise" mode="example" [allowOpenInLab]="false" [instanceKey]="'review-' + work.userId + '-' + work.attempt" editorHeight="16rem" />
                      </div>
                    }

                    @if (work.history.length > 1) {
                      <details class="text-sm">
                        <summary class="cursor-pointer font-semibold text-slate-700">{{ 'History' | t }}</summary>
                        <ol class="mt-2 space-y-1.5">
                          @for (entry of work.history; track $index) {
                            <li class="text-slate-600">
                              <span class="font-semibold">{{ entry.at | date: 'MMM d, h:mm a' }}</span> · {{ historyLabel(entry.status) | t }} · {{ entry.byName }}
                              @if (entry.feedback) { <span class="block italic">“{{ entry.feedback }}”</span> }
                            </li>
                          }
                        </ol>
                      </details>
                    }

                    @if (!locked()) {
                      <div class="border-t border-slate-100 pt-3">
                        <label class="block">
                          <span class="text-sm font-semibold text-slate-800">{{ 'Feedback' | t }}</span>
                          <textarea rows="4" maxlength="5000" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20" [value]="feedback()" (input)="feedback.set($any($event.target).value)" [placeholder]="'What went well, and what to improve. Required for Needs revision.' | t"></textarea>
                        </label>
                        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <button type="button" (click)="review('needs_revision')" [disabled]="busy()" class="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">replay</mat-icon>{{ 'Needs revision' | t }}
                          </button>
                          <button type="button" (click)="review('complete')" [disabled]="busy()" class="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">check_circle</mat-icon>{{ 'Mark complete' | t }}
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- ---------- Member: my work ---------- -->
          @if (isMember() && !isStaff()) {
            <div class="mt-6">
              @if (mine(); as work) {
                <div class="rounded-xl border p-4" [class]="work.status === 'complete' ? 'border-emerald-200 bg-emerald-50' : work.status === 'needs_revision' ? 'border-amber-200 bg-amber-50' : 'border-sky-200 bg-sky-50'">
                  <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ statusInfo(work.status).icon }}</mat-icon>
                    {{ statusInfo(work.status).label | t }}
                  </p>
                  <p class="mt-1 text-xs text-slate-600">
                    {{ 'Handed in {0}' | t: [work.submittedAt | date: 'MMM d, h:mm a'] }}
                    @if (work.attempt > 1) { · {{ 'Attempt {0}' | t: [work.attempt] }} }
                    @if (work.late) { · {{ 'Late' | t }} }
                  </p>
                  @if (work.feedback && work.reviewedByName) {
                    <div class="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-800">
                      <p class="text-xs font-semibold text-slate-500">{{ 'Feedback from {0}' | t: [work.reviewedByName] }}</p>
                      <p class="mt-1 whitespace-pre-line">{{ work.feedback }}</p>
                    </div>
                  }
                </div>
              }

              @if (canSubmit(item)) {
                <div class="mt-4 space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900">{{ (mine() ? 'Hand in again' : 'Your work') | t }}</h4>
                  @if (item.submissionTypes.includes('text')) {
                    <app-markdown-field [value]="work().text" [label]="'Written answer' | t" [rows]="8" [compact]="true" (valueChange)="patchWork({ text: $event })" />
                  }
                  @if (item.submissionTypes.includes('link')) {
                    <fieldset>
                      <legend class="text-sm font-semibold text-slate-800">{{ 'Links' | t }}</legend>
                      <div class="mt-2 space-y-2">
                        @for (link of work().links; track $index; let index = $index) {
                          <div class="flex flex-wrap gap-2 sm:flex-nowrap">
                            <input type="text" maxlength="150" class="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm sm:w-48" [placeholder]="'Label (optional)' | t" [value]="link.label" (input)="setWorkLink(index, 'label', $any($event.target).value)" [attr.aria-label]="'Link label' | t" />
                            <input type="url" class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" placeholder="https://" [value]="link.url" (input)="setWorkLink(index, 'url', $any($event.target).value)" [attr.aria-label]="'Link address' | t" />
                            <button type="button" (click)="removeWorkLink(index)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700" [attr.aria-label]="'Remove link' | t"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon></button>
                          </div>
                        }
                        @if (work().links.length < 10) {
                          <button type="button" (click)="addWorkLink()" class="inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add_link</mat-icon>{{ 'Add a link' | t }}</button>
                        }
                      </div>
                    </fieldset>
                  }
                  @if (item.submissionTypes.includes('file')) {
                    <fieldset>
                      <legend class="text-sm font-semibold text-slate-800">{{ 'Files' | t }} <span class="font-normal text-slate-500">({{ 'up to {0}, 25 MB each' | t: [maxSubmissionFiles] }})</span></legend>
                      <ul class="mt-2 space-y-1">
                        @for (file of work().files; track file.path) {
                          <li class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                            <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] text-slate-500" aria-hidden="true">description</mat-icon>
                            <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
                            <span class="shrink-0 text-xs text-slate-500">{{ fileSize(file.size) }}</span>
                            <button type="button" (click)="removeWorkFile(file)" class="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-rose-50 hover:text-rose-700" [attr.aria-label]="'Remove {0}' | t: [file.name]"><mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">close</mat-icon></button>
                          </li>
                        }
                      </ul>
                      @if (work().files.length < maxSubmissionFiles) {
                        <label class="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
                          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">upload_file</mat-icon>
                          {{ (uploading() ? 'Uploading…' : 'Upload files') | t }}
                          <input type="file" multiple class="sr-only" [disabled]="uploading()" (change)="uploadWork($event)" />
                        </label>
                      }
                    </fieldset>
                  }
                  @if (item.submissionTypes.includes('code') && workExercise(); as exercise) {
                    <div>
                      <p class="mb-1 text-sm font-semibold text-slate-800">{{ 'Code' | t }}</p>
                      <app-code-lab [exercise]="exercise" mode="example" [allowOpenInLab]="false" [instanceKey]="'work-' + item.id" editorHeight="18rem" (codeChange)="patchWork({ code: $event })" />
                      <p class="mt-1 text-xs text-slate-500">{{ 'Run your code to test it. It’s handed in when you press Hand in.' | t }}</p>
                    </div>
                  }
                  <div class="flex justify-end">
                    <button type="button" (click)="submit()" [disabled]="busy() || uploading()" class="inline-flex h-11 items-center gap-2 rounded-xl bg-[#007979] px-5 font-semibold text-white shadow-sm hover:bg-[#006666] disabled:opacity-50">
                      <mat-icon aria-hidden="true">send</mat-icon>{{ (busy() ? 'Handing in…' : 'Hand in') | t }}
                    </button>
                  </div>
                  @if (isOverdue(item)) {
                    <p class="text-right text-xs font-semibold text-rose-700">{{ 'The due date has passed: your work will be marked late.' | t }}</p>
                  }
                </div>
              } @else if (!mine()) {
                <p class="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{{ closedReason(item) | t }}</p>
              }
            </div>
          }
        </div>
      }
    </section>
    }
  `,
})
export class TrainingGroupAssignmentsComponent {
  private readonly service = inject(TrainingGroupAssignmentService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);

  readonly organizationId = input.required<string>();
  readonly groupId = input.required<string>();
  readonly userId = input.required<string>();
  /** Managers, and the group's leads and instructors (canSeeRoster on the group page). */
  readonly isStaff = input(false);
  readonly locked = input(false);
  readonly cancelled = input(false);
  /** The roster, for staff (who hasn't handed in). */
  readonly members = input<TrainingGroupMember[]>([]);
  /** Open this assignment when the list has loaded (from ?assignment= on the page). */
  readonly openId = input<string | null>(null);

  protected readonly kinds = [
    { value: 'assignment' as const, label: 'Assignment', icon: 'assignment' },
    { value: 'project' as const, label: 'Individual project', icon: 'rocket_launch' },
  ];
  protected readonly submissionTypes = SUBMISSION_TYPES;
  protected readonly codeLanguages = CODE_LANGUAGES;
  protected readonly maxMaterials = MAX_MATERIALS;
  protected readonly maxSubmissionFiles = MAX_SUBMISSION_FILES;
  protected readonly filters: { value: RowFilter; label: string }[] = [
    { value: 'all', label: 'Everyone' },
    { value: 'submitted', label: 'To review' },
    { value: 'needs_revision', label: 'Needs revision' },
    { value: 'complete', label: 'Complete' },
    { value: 'not_submitted', label: 'Not handed in' },
  ];

  protected readonly view = signal<'list' | 'edit' | 'open'>('list');
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly confirmDelete = signal(false);

  protected readonly assignments = signal<GroupAssignment[]>([]);
  protected readonly current = signal<GroupAssignment | null>(null);
  protected readonly draft = signal<EditDraft | null>(null);
  /** Materials uploaded in this edit but not saved yet (removed again on cancel). */
  private unsavedUploads: string[] = [];

  // Members
  protected readonly isMember = signal(false);
  protected readonly myWork = signal<Map<string, AssignmentSubmission>>(new Map());
  protected readonly mine = computed(() => (this.current() ? this.myWork().get(this.current()!.id) ?? null : null));
  protected readonly work = signal<WorkDraft>({ text: '', links: [], files: [], code: '' });
  private unsavedWorkUploads: string[] = [];

  // Staff
  protected readonly submissions = signal<AssignmentSubmission[]>([]);
  protected readonly submissionsLoading = signal(false);
  protected readonly rowFilter = signal<RowFilter>('all');
  protected readonly selected = signal<AssignmentSubmission | null>(null);
  protected readonly feedback = signal('');

  protected readonly memberCount = computed(() => this.members().length);

  protected readonly rows = computed<SubmissionRow[]>(() => {
    const byUser = new Map(this.submissions().map((submission) => [submission.userId, submission]));
    const rows: SubmissionRow[] = this.members().map((member) => {
      const submission = byUser.get(member.userId) ?? null;
      byUser.delete(member.userId);
      return { userId: member.userId, name: member.name, email: member.email ?? null, submission, status: submission?.status ?? 'not_submitted', leftGroup: false };
    });
    for (const submission of byUser.values()) {
      rows.push({ userId: submission.userId, name: submission.userName, email: submission.email, submission, status: submission.status, leftGroup: true });
    }
    // Work to review first, then the rest by name.
    const order: Record<SubmissionRow['status'], number> = { submitted: 0, needs_revision: 1, not_submitted: 2, complete: 3 };
    return rows.sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
  });
  protected readonly shownRows = computed(() => {
    const filter = this.rowFilter();
    return filter === 'all' ? this.rows() : this.rows().filter((row) => row.status === filter);
  });

  /** Code to run: the learner's own draft (members) or the submission under review (staff). */
  protected readonly workExercise = computed<CodeExercise | null>(() => {
    const item = this.current();
    if (!item?.submissionTypes.includes('code')) return null;
    const language = item.codeLanguage ?? 'javascript';
    const starter = this.mine()?.code || CODE_LANGUAGES.find((entry) => entry.value === language)?.starter || '';
    return { language, title: '', instructions: '', starter, tests: [], hints: [], solution: '' };
  });
  protected readonly reviewExercise = computed<CodeExercise | null>(() => {
    const work = this.selected();
    if (!work?.code) return null;
    return { language: work.codeLanguage ?? 'javascript', title: '', instructions: '', starter: work.code, tests: [], hints: [], solution: '' };
  });

  constructor() {
    // Load when the group (or the person) is known.
    effect(() => {
      const organizationId = this.organizationId();
      const groupId = this.groupId();
      const userId = this.userId();
      const staff = this.isStaff();
      untracked(() => void this.load(organizationId, groupId, userId, staff));
    });
  }

  private async load(organizationId: string, groupId: string, userId: string, staff: boolean): Promise<void> {
    if (!organizationId || !groupId || !userId) return;
    this.loading.set(true);
    try {
      const member = staff ? false : await getDoc(doc(firestore, 'organizations', organizationId, 'trainingGroups', groupId, 'members', userId)).then((snapshot) => snapshot.exists()).catch(() => false);
      this.isMember.set(member);
      const list = staff || member ? await this.service.list(organizationId, groupId, staff) : [];
      this.assignments.set(list);
      if (member) {
        const own = await Promise.all(list.map((item) => this.service.getMine(organizationId, groupId, item.id, userId).catch(() => null)));
        const map = new Map<string, AssignmentSubmission>();
        own.forEach((submission, index) => {
          if (submission) map.set(list[index].id, submission);
        });
        this.myWork.set(map);
      }
      const wanted = this.openId();
      const target = wanted ? list.find((item) => item.id === wanted) : null;
      if (target && this.view() === 'list') {
        void this.open(target);
        scrollToId('assignments', 'start');
      }
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not load assignments.', error);
      this.error.set('Assignments could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  protected async open(item: GroupAssignment): Promise<void> {
    this.clearMessages();
    this.current.set(item);
    this.selected.set(null);
    this.view.set('open');
    if (this.isStaff()) {
      await this.loadSubmissions(item);
    } else {
      const mine = this.myWork().get(item.id);
      this.work.set({ text: mine?.text ?? '', links: mine?.links.map((link) => ({ ...link })) ?? [], files: [...(mine?.files ?? [])], code: mine?.code ?? '' });
      this.unsavedWorkUploads = [];
    }
  }

  protected backToList(): void {
    void this.discardUnsaved();
    this.clearMessages();
    this.confirmDelete.set(false);
    this.view.set('list');
    this.current.set(null);
    this.draft.set(null);
    this.selected.set(null);
  }

  private async loadSubmissions(item: GroupAssignment): Promise<void> {
    this.submissionsLoading.set(true);
    try {
      this.submissions.set(await this.service.listSubmissions(this.organizationId(), this.groupId(), item.id));
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not load submissions.', error);
      this.error.set('Submissions could not be loaded. Try again.');
    } finally {
      this.submissionsLoading.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Staff: create and edit
  // ------------------------------------------------------------------

  protected startNew(): void {
    this.clearMessages();
    this.unsavedUploads = [];
    this.draft.set({
      id: this.service.newId(this.organizationId(), this.groupId()),
      isNew: true,
      wasPublished: false,
      title: '',
      kind: 'assignment',
      instructions: '',
      due: '',
      acceptLate: true,
      submissionTypes: ['text', 'link', 'file'],
      codeLanguage: 'javascript',
      links: [],
      materials: [],
    });
    this.view.set('edit');
  }

  protected edit(item: GroupAssignment): void {
    this.clearMessages();
    this.unsavedUploads = [];
    this.draft.set({
      id: item.id,
      isNew: false,
      wasPublished: item.status === 'published',
      title: item.title,
      kind: item.kind,
      instructions: item.instructions,
      due: item.dueAt ? toDateTimeInput(item.dueAt) : '',
      acceptLate: item.acceptLate,
      submissionTypes: [...item.submissionTypes],
      codeLanguage: item.codeLanguage ?? 'javascript',
      links: item.links.map((link) => ({ ...link })),
      materials: [...item.materials],
    });
    this.view.set('edit');
  }

  protected patch(change: Partial<EditDraft>): void {
    this.draft.update((draft) => (draft ? { ...draft, ...change } : draft));
  }

  protected toggleType(type: SubmissionType, on: boolean): void {
    this.draft.update((draft) => {
      if (!draft) return draft;
      const types = on ? [...new Set([...draft.submissionTypes, type])] : draft.submissionTypes.filter((item) => item !== type);
      return { ...draft, submissionTypes: types };
    });
  }

  protected addFormLink(): void {
    this.draft.update((draft) => (draft ? { ...draft, links: [...draft.links, { label: '', url: '' }] } : draft));
  }

  protected setFormLink(index: number, field: 'label' | 'url', value: string): void {
    this.draft.update((draft) => (draft ? { ...draft, links: draft.links.map((link, at) => (at === index ? { ...link, [field]: value } : link)) } : draft));
  }

  protected removeFormLink(index: number): void {
    this.draft.update((draft) => (draft ? { ...draft, links: draft.links.filter((_, at) => at !== index) } : draft));
  }

  protected async uploadMaterials(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const draft = this.draft();
    const chosen = Array.from(input.files ?? []);
    input.value = '';
    if (!draft || !chosen.length) return;
    const room = MAX_MATERIALS - draft.materials.length;
    await this.uploadFiles(chosen.slice(0, room), 'materials', draft.id, (file) => {
      this.unsavedUploads.push(file.path);
      this.draft.update((current) => (current ? { ...current, materials: [...current.materials, file] } : current));
    });
    if (chosen.length > room) this.error.set('Some files were left out: an assignment can have up to 10 files.');
  }

  protected removeMaterial(file: AssignmentFile): void {
    this.draft.update((draft) => (draft ? { ...draft, materials: draft.materials.filter((item) => item.path !== file.path) } : draft));
    // Saved files are removed by the server when the assignment is saved.
    if (this.unsavedUploads.includes(file.path)) {
      this.unsavedUploads = this.unsavedUploads.filter((path) => path !== file.path);
      void this.service.discard(file.path);
    }
  }

  protected async saveDraft(status: 'draft' | 'published'): Promise<void> {
    const form = this.draft();
    if (!form) return;
    this.clearMessages();
    if (!form.title.trim()) {
      this.error.set('Give the assignment a title.');
      return;
    }
    if (!form.submissionTypes.length) {
      this.error.set('Choose at least one way for learners to hand in their work.');
      return;
    }
    const due = form.due ? new Date(form.due).getTime() : null;
    if (due !== null && Number.isNaN(due)) {
      this.error.set('Enter a valid due date.');
      return;
    }
    const assignment: AssignmentDraft = {
      title: form.title.trim(),
      kind: form.kind,
      instructions: form.instructions,
      links: form.links.filter((link) => link.url.trim()).map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
      materials: form.materials,
      dueAt: due,
      acceptLate: form.acceptLate,
      submissionTypes: form.submissionTypes,
      codeLanguage: form.codeLanguage,
      status: form.wasPublished ? 'published' : status,
    };
    this.busy.set(true);
    try {
      await this.service.save(this.organizationId(), this.groupId(), form.id, assignment);
      this.unsavedUploads = [];
      const list = await this.service.list(this.organizationId(), this.groupId(), true);
      this.assignments.set(list);
      const saved = list.find((item) => item.id === form.id);
      this.draft.set(null);
      if (saved) {
        await this.open(saved);
      } else {
        this.view.set('list');
      }
      this.notice.set(form.wasPublished ? 'Changes saved.' : status === 'published' ? 'Published: the group can see it now.' : 'Saved as a draft. Only staff can see it.');
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not save the assignment.', error);
      this.error.set(errorMessage(error, 'The assignment could not be saved. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async deleteAssignment(): Promise<void> {
    const form = this.draft();
    if (!form) return;
    this.busy.set(true);
    try {
      await this.service.delete(this.organizationId(), this.groupId(), form.id);
      this.assignments.update((list) => list.filter((item) => item.id !== form.id));
      this.unsavedUploads = [];
      this.backToList();
      this.notice.set('Assignment deleted.');
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not delete the assignment.', error);
      this.error.set(errorMessage(error, 'The assignment could not be deleted. Try again.'));
    } finally {
      this.busy.set(false);
      this.confirmDelete.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Staff: review
  // ------------------------------------------------------------------

  protected selectRow(row: SubmissionRow): void {
    if (!row.submission) return;
    this.selected.set(row.submission);
    this.feedback.set(row.submission.status === 'submitted' ? '' : row.submission.feedback);
    scrollToId('review-panel', 'nearest');
  }

  protected async review(decision: 'complete' | 'needs_revision'): Promise<void> {
    const work = this.selected();
    const item = this.current();
    if (!work || !item) return;
    this.clearMessages();
    if (decision === 'needs_revision' && !this.feedback().trim()) {
      this.error.set('Say what needs to change, so the learner knows what to do.');
      return;
    }
    this.busy.set(true);
    try {
      await this.service.review(this.organizationId(), this.groupId(), item.id, work.userId, decision, this.feedback().trim());
      await this.loadSubmissions(item);
      this.assignments.set(await this.service.list(this.organizationId(), this.groupId(), true));
      // Move on to the next piece of work waiting for review.
      const next = this.rows().find((row) => row.status === 'submitted' && row.userId !== work.userId)?.submission ?? null;
      this.selected.set(next);
      this.feedback.set('');
      this.notice.set(decision === 'complete' ? 'Marked complete.' : 'Sent back for revision.');
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not save the review.', error);
      this.error.set(errorMessage(error, 'The review could not be saved. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected filterCount(filter: RowFilter): number {
    return filter === 'all' ? this.rows().length : this.rows().filter((row) => row.status === filter).length;
  }

  protected exportRows(): void {
    const item = this.current();
    if (!item) return;
    const t = (text: string) => this.i18n.t(text);
    downloadCsv(`${item.title}-submissions`, [
      [t('Name'), t('Email'), t('Status'), t('Handed in'), t('Late'), t('Attempt'), t('Feedback')],
      ...this.rows().map((row) => [
        row.name,
        row.email ?? '',
        t(this.statusInfo(row.status).label),
        row.submission?.submittedAt ? row.submission.submittedAt.toLocaleString() : '',
        row.submission?.late ? t('Yes') : '',
        row.submission ? String(row.submission.attempt) : '',
        row.submission?.feedback ?? '',
      ]),
    ]);
  }

  // ------------------------------------------------------------------
  // Members: hand in
  // ------------------------------------------------------------------

  protected canSubmit(item: GroupAssignment): boolean {
    if (!this.isMember() || this.locked() || this.cancelled() || item.status !== 'published') return false;
    if (this.mine()?.status === 'complete') return false;
    return !(this.isOverdue(item) && !item.acceptLate);
  }

  protected closedReason(item: GroupAssignment): string {
    if (this.locked()) return 'This group has ended, so work can no longer be handed in.';
    if (this.cancelled()) return 'This group was cancelled.';
    if (this.isOverdue(item) && !item.acceptLate) return 'The due date has passed and this assignment doesn’t accept late work.';
    return 'Work can’t be handed in right now.';
  }

  protected patchWork(change: Partial<WorkDraft>): void {
    this.work.update((work) => ({ ...work, ...change }));
  }

  protected addWorkLink(): void {
    this.work.update((work) => ({ ...work, links: [...work.links, { label: '', url: '' }] }));
  }

  protected setWorkLink(index: number, field: 'label' | 'url', value: string): void {
    this.work.update((work) => ({ ...work, links: work.links.map((link, at) => (at === index ? { ...link, [field]: value } : link)) }));
  }

  protected removeWorkLink(index: number): void {
    this.work.update((work) => ({ ...work, links: work.links.filter((_, at) => at !== index) }));
  }

  protected async uploadWork(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const item = this.current();
    const chosen = Array.from(input.files ?? []);
    input.value = '';
    if (!item || !chosen.length) return;
    const room = MAX_SUBMISSION_FILES - this.work().files.length;
    await this.uploadFiles(chosen.slice(0, room), { submissionOf: this.userId() }, item.id, (file) => {
      this.unsavedWorkUploads.push(file.path);
      this.work.update((work) => ({ ...work, files: [...work.files, file] }));
    });
    if (chosen.length > room) this.error.set('Some files were left out: you can hand in up to 5 files.');
  }

  protected removeWorkFile(file: AssignmentFile): void {
    this.work.update((work) => ({ ...work, files: work.files.filter((item) => item.path !== file.path) }));
    if (this.unsavedWorkUploads.includes(file.path)) {
      this.unsavedWorkUploads = this.unsavedWorkUploads.filter((path) => path !== file.path);
      void this.service.discard(file.path);
    }
  }

  protected async submit(): Promise<void> {
    const item = this.current();
    if (!item) return;
    this.clearMessages();
    const work = this.work();
    const draft = {
      text: item.submissionTypes.includes('text') ? work.text : '',
      links: item.submissionTypes.includes('link') ? work.links.filter((link) => link.url.trim()).map((link) => ({ label: link.label.trim(), url: link.url.trim() })) : [],
      files: item.submissionTypes.includes('file') ? work.files : [],
      code: item.submissionTypes.includes('code') ? work.code : '',
    };
    if (draft.links.some((link) => !/^https?:\/\/\S+$/i.test(link.url))) {
      this.error.set('Links must start with https://');
      return;
    }
    if (!draft.text.trim() && !draft.links.length && !draft.files.length && !draft.code.trim()) {
      this.error.set('Add your work before handing it in.');
      return;
    }
    this.busy.set(true);
    try {
      const result = await this.service.submit(this.organizationId(), this.groupId(), item.id, draft);
      this.unsavedWorkUploads = [];
      const saved = await this.service.getMine(this.organizationId(), this.groupId(), item.id, this.userId());
      if (saved) this.myWork.update((map) => new Map(map).set(item.id, saved));
      this.notice.set(result.late ? 'Handed in (late). Your instructor will review it.' : 'Handed in. Your instructor will review it.');
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not hand in the work.', error);
      this.error.set(errorMessage(error, 'Your work could not be handed in. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Shared
  // ------------------------------------------------------------------

  private async uploadFiles(
    files: File[],
    folder: 'materials' | { submissionOf: string },
    assignmentId: string,
    added: (file: AssignmentFile) => void,
  ): Promise<void> {
    this.clearMessages();
    const tooBig = files.filter((file) => file.size > 25 * 1024 * 1024);
    if (tooBig.length) {
      this.error.set('Files can be up to 25 MB.');
    }
    this.uploading.set(true);
    try {
      for (const file of files.filter((item) => item.size > 0 && item.size <= 25 * 1024 * 1024)) {
        added(await this.service.upload(this.organizationId(), this.groupId(), assignmentId, folder, file));
      }
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not upload a file.', error);
      this.error.set('A file could not be uploaded. Try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  /** Files uploaded but not saved: remove them when leaving without saving. */
  private async discardUnsaved(): Promise<void> {
    const paths = [...this.unsavedUploads, ...this.unsavedWorkUploads];
    this.unsavedUploads = [];
    this.unsavedWorkUploads = [];
    await Promise.all(paths.map((path) => this.service.discard(path)));
  }

  protected async openFile(file: AssignmentFile): Promise<void> {
    try {
      const url = await this.service.fileUrl(file.path);
      window.open(url, '_blank', 'noopener');
    } catch (error) {
      this.logger.error('TrainingGroupAssignmentsComponent', 'Could not open a file.', error);
      this.error.set('The file could not be opened.');
    }
  }

  protected myStatus(item: GroupAssignment): SubmissionStatus | 'not_submitted' {
    return this.myWork().get(item.id)?.status ?? 'not_submitted';
  }

  protected statusInfo(status: SubmissionStatus | 'not_submitted'): { label: string; classes: string; icon: string } {
    return SUBMISSION_STATUS_LABELS[status];
  }

  protected historyLabel(status: SubmissionStatus): string {
    return status === 'submitted' ? 'Handed in' : SUBMISSION_STATUS_LABELS[status].label;
  }

  protected isOverdue(item: GroupAssignment): boolean {
    return !!item.dueAt && item.dueAt.getTime() < Date.now();
  }

  protected html(markdown: string): string {
    return renderKnowledgeContent(markdown);
  }

  protected fileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }

  private clearMessages(): void {
    this.error.set('');
    this.notice.set('');
  }
}

/** Scroll to an element once it has rendered (browser only). */
function scrollToId(id: string, block: ScrollLogicalPosition): void {
  if (typeof document === 'undefined') return;
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block }));
}

/** A date as a datetime-local input value, local time. */
function toDateTimeInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function errorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as { message?: string })?.message ?? '';
  return /resource-exhausted|permission-denied|failed-precondition|invalid-argument|already-exists|not-found/.test(code) && message && message.toLowerCase() !== 'internal' ? message : fallback;
}

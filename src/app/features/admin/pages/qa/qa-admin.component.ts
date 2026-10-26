import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  QaResultStatus,
  QaSubmission,
  QaTask,
  QaTaskStatus,
} from '../../../../core/models/qa.model';

import {
  QaService,
  QaTester,
} from '../../../../core/services/qa.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firestore } from '../../../../core/services/firebase-config';

interface QaTaskDocument {
  name: string;
  url: string;
  path: string;
  contentType: string;
  size: number;
  uploadedAt?: unknown;
}

@Component({
  selector: 'app-qa-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-gray-500">
          <a routerLink="/admin" class="transition hover:text-teal-700">
            Admin
          </a>
          <span>/</span>
          <span class="font-medium text-gray-900">QA Hub</span>
        </nav>

        <!-- Header -->
        <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wider text-teal-700">
              Platform administration
            </p>
            <h1 class="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              QA Hub
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Create QA tasks, assign testers, track testing progress,
              manage task statuses, and review results across Zebron.
            </p>
          </div>

          <button
            type="button"
            (click)="refresh()"
            [disabled]="loading() || saving()"
            class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh data
          </button>
        </header>

        <!-- Error -->
        @if (errorMessage()) {
          <div
            role="alert"
            class="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <div>
              <p class="font-semibold">Something went wrong</p>
              <p class="mt-1 break-words">{{ errorMessage() }}</p>
            </div>
            <button
              type="button"
              (click)="errorMessage.set('')"
              aria-label="Dismiss error"
              class="rounded px-2 py-1 hover:bg-red-100"
            >
              ✕
            </button>
          </div>
        }

        <!-- Success -->
        @if (successMessage()) {
          <div
            role="status"
            class="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <div>
              <p class="font-semibold">Success</p>
              <p class="mt-1">{{ successMessage() }}</p>
            </div>
            <button
              type="button"
              (click)="successMessage.set('')"
              aria-label="Dismiss success"
              class="rounded px-2 py-1 hover:bg-green-100"
            >
              ✕
            </button>
          </div>
        }

        <!-- Summary cards -->
        <section
          aria-label="QA summary"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-600">Total tasks</p>
            <p class="mt-3 text-3xl font-bold text-gray-900">
              {{ tasks().length }}
            </p>
            <p class="mt-1 text-xs text-gray-500">All QA tasks</p>
          </article>

          <article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-600">Open tasks</p>
            <p class="mt-3 text-3xl font-bold text-amber-700">
              {{ countTasks('open') }}
            </p>
            <p class="mt-1 text-xs text-gray-500">Waiting to be tested</p>
          </article>

          <article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-600">In progress</p>
            <p class="mt-3 text-3xl font-bold text-indigo-700">
              {{ countTasks('in_progress') }}
            </p>
            <p class="mt-1 text-xs text-gray-500">Currently being tested</p>
          </article>

          <article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-gray-600">Reported failures</p>
            <p class="mt-3 text-3xl font-bold text-red-700">
              {{ countResults('fail') }}
            </p>
            <p class="mt-1 text-xs text-gray-500">Failed test submissions</p>
          </article>
        </section>

        <!-- Create QA task -->
        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-teal-50">
            <div>
              <h2 class="text-lg font-bold text-gray-900">
                {{ isViewingTask() ? 'View task details' : isEditingTask() ? 'Edit QA task' : 'Create QA task' }}
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                {{ isViewingTask() ? 'Review the complete QA task details.' : isEditingTask() ? 'Update the test scenario and assigned testers.' : 'Define the test scenario and assign active QA testers.' }}
              </p>
            </div>
            @if (taskFormMode() !== 'create') {
              <button type="button" (click)="cancelEditTask()" class="shrink-0 self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:self-center">
                {{ isViewingTask() ? 'Close details' : 'Cancel edit' }}
              </button>
            }
          </div>

          <form class="space-y-6 p-5 sm:p-6" (ngSubmit)="submitTaskForm()">
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div class="md:col-span-2">
                <label for="qa-title" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Task title *
                </label>
                <input
                  id="qa-title"
                  [readonly]="isViewingTask()"
                  name="title"
                  type="text"
                  required
                  maxlength="200"
                  [(ngModel)]="form.title"
                  placeholder="Example: Verify organization onboarding"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label for="qa-application" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Application or feature *
                </label>
                <input
                  id="qa-application"
                  [readonly]="isViewingTask()"
                  name="application"
                  type="text"
                  required
                  maxlength="120"
                  [(ngModel)]="form.application"
                  placeholder="Example: Test Center"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label for="qa-description" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Description *
                </label>
                <input
                  id="qa-description"
                  [readonly]="isViewingTask()"
                  name="description"
                  type="text"
                  required
                  maxlength="1000"
                  [(ngModel)]="form.description"
                  placeholder="Briefly describe what needs testing"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label for="qa-instructions" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Testing instructions *
                </label>
                <textarea
                  id="qa-instructions"
                  [readonly]="isViewingTask()"
                  name="instructions"
                  required
                  rows="5"
                  maxlength="10000"
                  [(ngModel)]="form.instructions"
                  placeholder="Describe the steps the tester should follow."
                  class="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                ></textarea>
              </div>

              <div>
                <label for="qa-expected-result" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Expected result *
                </label>
                <textarea
                  id="qa-expected-result"
                  [readonly]="isViewingTask()"
                  name="expectedResult"
                  required
                  rows="5"
                  maxlength="10000"
                  [(ngModel)]="form.expectedResult"
                  placeholder="Describe the expected application behavior."
                  class="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                ></textarea>
              </div>
              <div>
                <label for="qa-status" class="mb-1.5 block text-sm font-semibold text-gray-700">
                  Status *
                </label>
                <select
                  id="qa-status"
                  name="status"
                  [(ngModel)]="form.status"
                  [disabled]="form.status === 'closed'"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100 disabled:text-gray-600"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="closed">Closed</option>
                </select>
               
              </div>

              <!-- Task documents -->
              <div class="md:col-span-2 rounded-xl border border-gray-200 p-4">
                <div>
                  <h3 class="text-sm font-bold text-gray-900">Supporting documents</h3>
                  <p class="mt-1 text-xs text-gray-500">Upload relevant test plans, screenshots, specifications, or other supporting files (maximum 10 MB per file).</p>
                </div>

                @if (taskDocuments().length > 0) {
                  <ul class="mt-3 space-y-2">
                    @for (document of taskDocuments(); track document.path) {
                      <li class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                        <span class="min-w-0 break-all text-sm text-gray-700">{{ document.name }}</span>
                        <a [href]="document.url" target="_blank" rel="noopener noreferrer" class="text-sm font-semibold text-teal-700 hover:text-teal-900">Open / download</a>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="mt-3 text-sm text-gray-500">No documents attached.</p>
                }

                @if (!isViewingTask()) {
                  <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      id="qa-document"
                      name="qaDocument"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
                      (change)="onDocumentSelected($event)"
                      class="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 hover:file:bg-teal-100"
                    />
                    <button type="button" (click)="uploadSelectedDocument()" [disabled]="!selectedDocument() || uploadingDocument() || saving() || savingTask()" class="shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                      {{ uploadingDocument() ? 'Uploading...' : taskFormMode() === 'create' ? 'Attach to task' : 'Upload document' }}
                    </button>
                  </div>
                  @if (selectedDocument()) {
                    <p class="mt-2 break-all text-xs text-gray-500">Selected: {{ selectedDocument()?.name }}</p>
                  }
                  @if (taskFormMode() === 'create') {
                    <p class="mt-2 text-xs text-gray-500">Choose a document and select “Attach to task”. It will upload automatically when you create the task.</p>
                  }
                }
              </div>
            </div>

        
<!-- Tester assignment -->
<div class="border-t border-gray-200 pt-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-sm font-bold text-gray-900">
        {{ isViewingTask() ? 'Assigned Platform Support testers' : 'Assign Platform Support testers *' }}
      </h3>

      <p class="mt-1 text-sm text-gray-500">
        {{ isViewingTask() ? 'Users assigned to test this feature.' : 'Select users assigned the Platform Support role to test this feature.' }}
      </p>
    </div>

    <span class="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
      {{ selectedTesterIds.size }} selected
    </span>
  </div>

  @if (testersLoading()) {
    <p class="mt-4 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
      Loading Platform Support users...
    </p>
  } @else if (testers().length === 0) {
    <p class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      No Platform Support users were found. Assign the Platform Support role
      to a user and refresh the tester list.
    </p>
  } @else {
    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      @for (tester of testers(); track tester.id) {
        <label
          class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition"
          [class.border-teal-500]="isTesterSelected(tester.id)"
          [class.bg-teal-50]="isTesterSelected(tester.id)"
          [class.border-gray-200]="!isTesterSelected(tester.id)"
          [class.bg-white]="!isTesterSelected(tester.id)"
        >
          <input
            type="checkbox"
            [checked]="isTesterSelected(tester.id)"
            [disabled]="isViewingTask()"
            (change)="toggleTester(tester.id, $any($event.target).checked)"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />

          <span class="min-w-0 flex-1">
            <span class="block break-words text-sm font-semibold text-gray-900">
              {{ testerLabel(tester.id) }}
            </span>

            @if (tester.email && tester.email !== testerLabel(tester.id)) {
              <span class="mt-1 block break-all text-xs text-gray-500">
                {{ tester.email }}
              </span>
            }

           
          </span>
        </label>
      }
    </div>
  }

  <div class="mt-3 flex justify-end" [class.hidden]="isViewingTask()">
    <button
      type="button"
      (click)="loadTesters()"
      [disabled]="testersLoading()"
      class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Refresh tester list
    </button>
  </div>
</div>



            <div class="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs text-gray-500">
                {{ isViewingTask() ? 'This task is displayed in read-only mode.' : isEditingTask() ? 'Save your changes to update this task.' : 'New tasks are created with the Open status.' }}
              </p>

              @if (!isViewingTask()) {
                <button
                  type="submit"
                  [disabled]="saving() || savingTask() || testersLoading() || testers().length === 0"
                  class="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ savingTask() ? 'Updating task...' : saving() ? 'Creating task...' : isEditingTask() ? 'Update QA task' : 'Create QA task' }}
                </button>
              }
            </div>
          </form>
        </section>

        <!-- QA task management -->
        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-gray-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-teal-50">
            <div>
              <h2 class="text-lg font-bold text-gray-900 ">QA tasks</h2>
              <p class="mt-1 text-sm text-gray-500">
                Select a task title to view its details.
              </p>
            </div>

            <span class="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {{ tasks().length }} tasks
            </span>
          </div>

          @if (loading() && tasks().length === 0) {
            <div class="p-10 text-center text-sm text-gray-500">
              Loading QA tasks...
            </div>
          } @else if (tasks().length === 0) {
            <div class="p-10 text-center">
              <h3 class="text-sm font-semibold text-gray-900">No QA tasks yet</h3>
              <p class="mt-1 text-sm text-gray-500">
                Create a task above to start organizing QA testing.
              </p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
                      Task
                    </th>
                    <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Application
                    </th>
                    <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Assigned testers
                    </th>
                    <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th> <th class="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Updated
                    </th>
                    <th class="min-w-48 whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-gray-100 bg-white">
                  @for (task of tasks(); track task.id) {
                    <tr class="align-top hover:bg-gray-50">

                      <td class="max-w-sm px-5 py-4 sm:px-6">
                        <button type="button" (click)="viewTask(task)" class="text-left text-sm font-semibold text-teal-800 hover:text-teal-950 hover:underline focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer" [attr.aria-label]="'View details for ' + task.title">
                          {{ task.title }}
                        </button>

                        <button type="button" (click)="viewTask(task)" class="mt-1 block max-w-full text-left whitespace-pre-wrap break-words text-sm text-gray-500 hover:text-gray-800">
                          {{ task.description }}
                        </button>


                      </td>

                      <td class="whitespace-nowrap px-5 py-4">
                        <span (click)="viewTask(task)" class="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 cursor-pointer">
                          {{ task.application }}
                        </span>
                      </td>

                      <td class="min-w-52 px-5 py-4">
                        @if (task.assignedTesterIds.length === 0) {
                          <span class="text-sm text-gray-400">No testers assigned</span>
                        } @else {
                          <div (click)="viewTask(task)" class="space-y-3 cursor-pointer">
                            @for (testerId of task.assignedTesterIds; track testerId) {
                              <div class="min-w-0">
                                <p class="break-words text-sm font-medium text-gray-800">
                                  {{ testerLabel(testerId) }}
                                </p>

                                @if (testerEmail(testerId)) {
                                  <p class="mt-0.5 break-all text-xs text-gray-500">
                                    {{ testerEmail(testerId) }}
                                  </p>
                                }
                              </div>
                            }
                          </div>
                        }
                      </td>

                      <td class="min-w-35 px-5 py-4">
                        <span
                          class="mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                          [ngClass]="statusClasses(task.status)"
                        >
                          {{ formatStatus(task.status) }}
                        </span>

                        <select
                          [id]="'status-' + task.id"
                          [name]="'status-' + task.id"
                          [ngModel]="draftStatus(task)"
                          (ngModelChange)="setDraftStatus(task.id, $event)"
                          class="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="submitted">Submitted</option>
                          <option value="closed">Closed</option>
                        </select>

                        @if (hasStatusChange(task)) {
                          <button
                            type="button"
                            (click)="saveTaskStatus(task)"
                            [disabled]="isUpdatingTask(task.id)"
                            class="mt-2 w-full rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                          >
                            {{ isUpdatingTask(task.id) ? 'Saving...' : 'Save status' }}
                          </button>
                        }
                      </td>

                      <td class="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {{ formatDate(task.createdAt) }}
                      </td> 
                      
                      <td class="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {{ formatDate(task.updatedAt) }}
                      </td>

                      <td class="min-w-56 px-5 py-4">
                        @if (isPlatformAdmin()) {
                          <div class="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              (click)="editTask(task)"
                              [disabled]="deletingTaskId() === task.id || savingTask()"
                              class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <mat-icon class="!h-4 !w-4 !text-base">edit</mat-icon>
                              Edit
                            </button>
                            <button
                              type="button"
                              (click)="deleteTask(task)"
                              [disabled]="deletingTaskId() === task.id || savingTask()"
                              class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <mat-icon class="!h-4 !w-4 !text-base">delete</mat-icon>
                              {{ deletingTaskId() === task.id ? 'Deleting...' : 'Delete' }}
                            </button>
                          </div>
                        } @else {
                          <span class="text-xs text-gray-400">Admin actions only</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        <!-- Test submissions -->
        <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Test submissions</h2>
              <p class="mt-1 text-sm text-gray-500">
                Review results and feedback submitted by QA testers.
              </p>
            </div>

            <div class="w-full sm:max-w-sm">
              <label
                for="submission-task-filter"
                class="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Filter by task
              </label>

              <select
                id="submission-task-filter"
                name="submissionTaskFilter"
                [ngModel]="selectedSubmissionTaskId()"
                (ngModelChange)="selectedSubmissionTaskId.set($event)"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">All tasks</option>

                @for (task of tasks(); track task.id) {
                  <option [value]="task.id">{{ task.title }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Filtered submission counts -->
          <div class="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3 sm:px-6">
            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {{ filteredSubmissions().length }} submissions
            </span>
            <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {{ countFilteredResults('pass') }} passed
            </span>
            <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              {{ countFilteredResults('fail') }} failed
            </span>
            <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {{ countFilteredResults('blocked') }} blocked
            </span>
          </div>

          @if (loading() && submissions().length === 0) {
            <div class="p-10 text-center text-sm text-gray-500">
              Loading test submissions...
            </div>
          } @else if (filteredSubmissions().length === 0) {
            <div class="p-10 text-center">
              <h3 class="text-sm font-semibold text-gray-900">
                No submissions found
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                @if (selectedSubmissionTaskId() === 'all') {
                  Test results will appear here when testers submit their work.
                } @else {
                  There are no submissions for the selected task.
                }
              </p>
            </div>
          } @else {
            <div class="divide-y divide-gray-100">
              @for (submission of filteredSubmissions(); track submission.id) {
                <article class="p-5 transition hover:bg-gray-50 sm:p-6">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div class="min-w-0 flex-1">
                      <h3 class="break-words text-base font-bold text-gray-900">
                        {{ taskTitle(submission.taskId) }}
                      </h3>

                      <p class="mt-1 break-all text-xs text-gray-400">
                        Task ID: {{ submission.taskId }}
                      </p>

                      <div class="mt-3">
                        <p class="break-words text-sm font-semibold text-gray-800">
                          Tester: {{ testerLabel(submission.testerId) }}
                        </p>

                        @if (testerEmail(submission.testerId)) {
                          <p class="mt-0.5 break-all text-xs text-gray-500">
                            {{ testerEmail(submission.testerId) }}
                          </p>
                        }

                        <p class="mt-0.5 break-all text-xs text-gray-400">
                          Tester ID: {{ submission.testerId }}
                        </p>
                      </div>

                      <div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                        <p class="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Tester feedback
                        </p>

                        @if (submission.feedback.trim()) {
                          <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                            {{ submission.feedback }}
                          </p>
                        } @else {
                          <p class="mt-2 text-sm italic text-gray-400">
                            No feedback provided.
                          </p>
                        }
                      </div>
                    </div>

                    <div class="flex shrink-0 flex-row items-center justify-between gap-4 lg:flex-col lg:items-end">
                      <span
                        class="inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
                        [ngClass]="resultClasses(submission.result)"
                      >
                        {{ formatResult(submission.result) }}
                      </span>

                      <div class="text-left lg:text-right">
                        <p class="text-xs font-medium text-gray-500">Submitted</p>
                        <p class="mt-1 text-sm text-gray-700">
                          {{ formatDate(submission.createdAt) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <footer class="pb-4 text-center text-xs text-gray-400">
          Zebron QA Hub · Platform administration
        </footer>

      </div>
    </div>
  `,
})
export class QaAdminComponent {
  private readonly qaService = inject(QaService);
  private readonly authService = inject(AuthService);

  // Data state
  readonly tasks = signal<QaTask[]>([]);
  readonly submissions = signal<QaSubmission[]>([]);
  readonly testers = signal<QaTester[]>([]);

  readonly loading = signal(false);
  readonly testersLoading = signal(false);
  readonly saving = signal(false);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly updatingTaskIds = signal<string[]>([]);
  readonly selectedSubmissionTaskId = signal('all');

  private readonly draftStatuses = new Map<string, QaTaskStatus>();
  private readonly pendingStatusUpdates = new Set<string>();

  readonly deletingTaskId = signal<string | null>(null);

  readonly isPlatformAdmin = computed(
  () => this.authService.isPlatformAdmin,
);

readonly selectedTaskId = signal<string | null>(null);
readonly isEditing = signal(false);
readonly savingTask = signal(false);
readonly uploadingDocument = signal(false);
readonly selectedDocument = signal<File | null>(null);
readonly taskDocuments = signal<QaTaskDocument[]>([]);
readonly taskFormMode = signal<'create' | 'edit' | 'view'>('create');

  isViewingTask(): boolean {
    return this.taskFormMode() === 'view';
  }

  isEditingTask(): boolean {
    return this.taskFormMode() === 'edit';
  }

  // Task creation form
  form = {
    title: '',
    description: '',
    application: '',
    instructions: '',
    expectedResult: '',
    status: 'open' as QaTaskStatus,
  };

  selectedTesterIds = new Set<string>();

  constructor() {
    void this.refresh();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

async refresh(): Promise<void> {
  this.loading.set(true);
  this.testersLoading.set(true);
  this.errorMessage.set('');

  try {
    const [tasks, submissions, testers] = await Promise.all([
      this.qaService.getAllTasks(),
      this.qaService.getAllSubmissions(),
      this.qaService.getActiveTesters(),
    ]);

    this.tasks.set(tasks);
    this.submissions.set(submissions);
    this.testers.set(testers);

    // Keep only currently active testers in the selection.
    const activeTesterIds = new Set(
      testers.map((tester) => tester.id),
    );

    this.selectedTesterIds = new Set(
      [...this.selectedTesterIds].filter(
        (testerId) => activeTesterIds.has(testerId),
      ),
    );

    // Remove drafts for tasks that no longer exist.
    const existingTaskIds = new Set(
      tasks.map((task) => task.id),
    );

    for (const taskId of this.draftStatuses.keys()) {
      if (!existingTaskIds.has(taskId)) {
        this.draftStatuses.delete(taskId);
      }
    }

    const selectedTaskId = this.selectedSubmissionTaskId();

    if (
      selectedTaskId !== 'all' &&
      !existingTaskIds.has(selectedTaskId)
    ) {
      this.selectedSubmissionTaskId.set('all');
    }
 } catch (error: unknown) {
  console.error(
    '[QA Hub] Failed to load tasks or submissions.',
    error,
  );

  this.errorMessage.set(
    this.errorText(
      error,
      'Unable to load QA tasks and submissions.',
    ),
  );
} finally {
  this.loading.set(false);
  this.testersLoading.set(false);
}
}


async loadTesters(): Promise<void> {
  this.testersLoading.set(true);

  try {
    const testers = await this.qaService.getActiveTesters();

    this.testers.set(testers);

    const eligibleIds = new Set(
      testers.map(tester => tester.id),
    );

    this.selectedTesterIds = new Set(
      [...this.selectedTesterIds].filter(
        id => eligibleIds.has(id),
      ),
    );

    console.info(
      `[QA Hub] Loaded ${testers.length} Platform Support testers.`,
    );
  } catch (error: unknown) {
    console.error(
      '[QA Hub] Failed to load Platform Support testers.',
      error,
    );

    this.errorMessage.set(
      this.errorText(
        error,
        'Unable to load Platform Support testers. Check Firestore Security Rules for read access to the users collection for platform administrators.',
      ),
    );
  } finally {
    this.testersLoading.set(false);
  }
}


  // ---------------------------------------------------------------------------
  // Task creation
  // ---------------------------------------------------------------------------


async createTask(): Promise<void> {
  console.info('[QA Hub] Create task submitted.');

  this.errorMessage.set('');
  this.successMessage.set('');

  if (this.saving()) {
    console.warn('[QA Hub] A task creation request is already running.');
    return;
  }

  const title = this.form.title.trim();
  const description = this.form.description.trim();
  const application = this.form.application.trim();
  const instructions = this.form.instructions.trim();
  const expectedResult = this.form.expectedResult.trim();

  if (
    !title ||
    !description ||
    !application ||
    !instructions ||
    !expectedResult
  ) {
    this.errorMessage.set(
      'Complete all required task fields before creating the task.',
    );
    return;
  }

  if (title.length > 200) {
    this.errorMessage.set('The task title cannot exceed 200 characters.');
    return;
  }

  if (application.length > 120) {
    this.errorMessage.set(
      'The application name cannot exceed 120 characters.',
    );
    return;
  }

  if (description.length > 1000) {
    this.errorMessage.set(
      'The description cannot exceed 1,000 characters.',
    );
    return;
  }

  if (instructions.length > 10000 || expectedResult.length > 10000) {
    this.errorMessage.set(
      'Instructions and expected results cannot exceed 10,000 characters each.',
    );
    return;
  }

  if (this.selectedTesterIds.size === 0) {
    this.errorMessage.set('Select at least one eligible tester.');
    return;
  }

  const eligibleTesterIds = new Set(
    this.testers().map(tester => tester.id),
  );

  const assignedTesterIds = [...this.selectedTesterIds].filter(
    testerId => eligibleTesterIds.has(testerId),
  );

  if (assignedTesterIds.length === 0) {
    this.errorMessage.set(
      'The selected tester is no longer eligible. Refresh the tester list and try again.',
    );
    return;
  }

  this.saving.set(true);

  try {
    console.info('[QA Hub] Creating task.', {
      title,
      application,
      assignedTesterCount: assignedTesterIds.length,
    });

    const taskId = await this.qaService.createTask({
      title,
      description,
      application,
      instructions,
      expectedResult,
      assignedTesterIds,
    });

    console.info('[QA Hub] Task created successfully.', { taskId });

    if (this.selectedDocument()) {
      await this.uploadDocumentForTask(taskId, this.selectedDocument()!);
    }

    this.form = {
      title: '',
      description: '',
      application: '',
      instructions: '',
      expectedResult: '',
      status: 'open',
    };

    this.selectedTesterIds = new Set<string>();
    this.selectedDocument.set(null);
    this.taskDocuments.set([]);

    this.successMessage.set(
      `QA task created successfully. Task ID: ${taskId}`,
    );

    await this.refresh();
  } catch (error: unknown) {
    console.error('[QA Hub] Task creation failed.', error);

    const firebaseError = error as {
      code?: string;
      message?: string;
    };

    if (
      firebaseError.code === 'permission-denied' ||
      firebaseError.code === 'firestore/permission-denied'
    ) {
      this.errorMessage.set(
        'Firebase denied task creation. Check the QA task Firestore rules and your platform administrator role.',
      );
    } else {
      this.errorMessage.set(
        firebaseError.message ||
          'Unable to create the QA task. Check the browser console for details.',
      );
    }
  } finally {
    this.saving.set(false);
  }
}

editTask(task: QaTask): void {
  if (!this.authService.isPlatformAdmin || this.savingTask()) return;
  this.loadTaskIntoSharedForm(task, 'edit');
}

viewTask(task: QaTask): void {
  this.loadTaskIntoSharedForm(task, 'view');
}

private loadTaskIntoSharedForm(task: QaTask, mode: 'edit' | 'view'): void {
  this.selectedTaskId.set(task.id);
  this.form = {
    title: task.title ?? '',
    description: task.description ?? '',
    application: task.application ?? '',
    instructions: task.instructions ?? '',
    expectedResult: task.expectedResult ?? '',
    status: task.status ?? 'open',
  };
  this.selectedTesterIds = new Set(task.assignedTesterIds ?? []);
  this.taskDocuments.set(((task as QaTask & { documents?: QaTaskDocument[] }).documents ?? []));
  this.selectedDocument.set(null);
  this.taskFormMode.set(mode);
  this.isEditing.set(mode === 'edit');
  this.errorMessage.set('');
  this.successMessage.set('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEditTask(): void {
  if (this.savingTask()) return;
  this.taskFormMode.set('create');
  this.isEditing.set(false);
  this.selectedTaskId.set(null);
  this.selectedTesterIds = new Set<string>();
  this.selectedDocument.set(null);
  this.taskDocuments.set([]);
  this.form = { title: '', description: '', application: '', instructions: '', expectedResult: '', status: 'open' };
}

async submitTaskForm(): Promise<void> {
  if (this.isViewingTask()) return;
  if (this.isEditingTask()) {
    await this.saveEditTask();
  } else {
    await this.createTask();
  }
}

async saveEditTask(): Promise<void> {
  const taskId = this.selectedTaskId();
  if (!this.authService.isPlatformAdmin || !taskId || this.savingTask()) return;
  this.errorMessage.set('');
  this.successMessage.set('');

  const updates = {
    title: this.form.title.trim(),
    description: this.form.description.trim(),
    application: this.form.application.trim(),
    instructions: this.form.instructions.trim(),
    expectedResult: this.form.expectedResult.trim(),
    status: this.form.status,
    assignedTesterIds: [...this.selectedTesterIds].filter(id => this.testers().some(tester => tester.id === id)),
  };

  if (!updates.title || !updates.description || !updates.application || !updates.instructions || !updates.expectedResult) {
    this.errorMessage.set('Complete all required task fields before saving.');
    return;
  }
  if (updates.title.length > 200 || updates.application.length > 120 || updates.description.length > 1000 || updates.instructions.length > 10000 || updates.expectedResult.length > 10000) {
    this.errorMessage.set('One or more fields exceed the allowed character limit.');
    return;
  }
  if (updates.assignedTesterIds.length === 0) {
    this.errorMessage.set('Assign at least one active Platform Support tester.');
    return;
  }

  this.savingTask.set(true);
  try {
    await this.qaService.updateTask(taskId, updates);
    await this.refresh();
    this.taskFormMode.set('create');
    this.isEditing.set(false);
    this.selectedTaskId.set(null);
    this.selectedTesterIds = new Set<string>();
    this.form = { title: '', description: '', application: '', instructions: '', expectedResult: '', status: 'open' };
    this.successMessage.set('QA task updated successfully.');
  } catch (error: unknown) {
    this.errorMessage.set(this.errorText(error, 'Unable to update the QA task.'));
  } finally {
    this.savingTask.set(false);
  }
}

onDocumentSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  this.errorMessage.set('');

  if (!file) {
    this.selectedDocument.set(null);
    return;
  }

  const maxBytes = 10 * 1024 * 1024;
  const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpe?g|webp)$/i;
  if (file.size > maxBytes) {
    this.errorMessage.set('Documents must be 10 MB or smaller.');
    input.value = '';
    this.selectedDocument.set(null);
    return;
  }
  if (!allowedExtensions.test(file.name)) {
    this.errorMessage.set('Unsupported file type. Upload PDF, Office documents, text, CSV, or image files.');
    input.value = '';
    this.selectedDocument.set(null);
    return;
  }
  this.selectedDocument.set(file);
}

async uploadSelectedDocument(): Promise<void> {
  if (this.isViewingTask()) return;
  const taskId = this.selectedTaskId();
  const file = this.selectedDocument();
  if (!file || this.uploadingDocument()) return;

  // During task creation, keep the selected file queued. The task ID is
  // created on submit, and createTask() uploads the queued file afterward.
  if (!taskId && this.taskFormMode() === 'create') {
    this.successMessage.set(`“${file.name}” is attached and will upload when you create the task.`);
    return;
  }

  if (!taskId) {
    this.errorMessage.set('Select or create a task before uploading a document.');
    return;
  }

  this.errorMessage.set('');
  this.successMessage.set('');
  this.uploadingDocument.set(true);
  try {
    await this.uploadDocumentForTask(taskId, file);
    this.selectedDocument.set(null);
    const input = document.getElementById('qa-document') as HTMLInputElement | null;
    if (input) input.value = '';
    await this.refresh();
    this.successMessage.set(`Document "${file.name}" uploaded successfully.`);
  } catch (error: unknown) {
    console.error('[QA Hub] Document upload failed.', error);
    this.errorMessage.set(this.errorText(error, 'Unable to upload the document. Check Firebase Storage permissions and configuration.'));
  } finally {
    this.uploadingDocument.set(false);
  }
}

private async uploadDocumentForTask(taskId: string, file: File): Promise<void> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `qaTasks/${taskId}/documents/${Date.now()}_${safeName}`;
  const storage = getStorage();
  const storageReference = ref(storage, storagePath);
  await uploadBytes(storageReference, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: { taskId },
  });
  const url = await getDownloadURL(storageReference);
  const documentMetadata: QaTaskDocument = {
    name: file.name,
    url,
    path: storagePath,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
  };
  const nextDocuments = [...this.taskDocuments(), documentMetadata];
  await updateDoc(doc(firestore, 'qaTasks', taskId), {
    documents: nextDocuments,
    updatedAt: serverTimestamp(),
  });
  this.taskDocuments.set(nextDocuments);
}

async deleteTask(task: QaTask): Promise<void> {
  if (!this.authService.isPlatformAdmin || this.deletingTaskId()) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
  );
  if (!confirmed) return;

  this.errorMessage.set('');
  this.successMessage.set('');
  this.deletingTaskId.set(task.id);

  try {
    await this.qaService.deleteTask(task.id);
    if (this.selectedTaskId() === task.id) {
      this.isEditing.set(false);
      this.taskFormMode.set('create');
      this.selectedTaskId.set(null);
    }
    await this.refresh();
    this.successMessage.set(`QA task "${task.title}" was deleted.`);
  } catch (error: unknown) {
    console.error('[QA Hub] Failed to delete QA task.', error);
    this.errorMessage.set(this.errorText(error, 'Unable to delete the QA task.'));
  } finally {
    this.deletingTaskId.set(null);
  }
}

  // Tester selection and identity
  // ---------------------------------------------------------------------------

  isTesterSelected(testerId: string): boolean {
    return this.selectedTesterIds.has(testerId);
  }

  toggleTester(testerId: string, checked: boolean): void {
    const next = new Set(this.selectedTesterIds);

    if (checked) {
      const isActiveTester = this.testers().some(
        tester => tester.id === testerId,
      );

      if (!isActiveTester) {
        this.errorMessage.set(
          'Only active QA testers can be assigned to a task.',
        );
        return;
      }

      next.add(testerId);
    } else {
      next.delete(testerId);
    }

    this.selectedTesterIds = next;
  }

  testerLabel(testerId: string): string {
    const tester = this.testers().find(
      item => item.id === testerId,
    );

    if (tester?.displayName?.trim()) {
      return tester.displayName.trim();
    }

    if (tester?.email?.trim()) {
      return tester.email.trim();
    }

    return testerId;
  }

  testerEmail(testerId: string): string {
    const tester = this.testers().find(
      item => item.id === testerId,
    );

    return tester?.email?.trim() ?? '';
  }

  // ---------------------------------------------------------------------------
  // Task and submission statistics
  // ---------------------------------------------------------------------------

  countTasks(status: QaTaskStatus): number {
    return this.tasks().filter(
      task => task.status === status,
    ).length;
  }

  countResults(result: QaResultStatus): number {
    return this.submissions().filter(
      submission => submission.result === result,
    ).length;
  }

  countFilteredResults(result: QaResultStatus): number {
    return this.filteredSubmissions().filter(
      submission => submission.result === result,
    ).length;
  }

  filteredSubmissions(): QaSubmission[] {
    const selectedTaskId = this.selectedSubmissionTaskId();
    const allSubmissions = this.submissions();

    if (selectedTaskId === 'all') {
      return allSubmissions;
    }

    return allSubmissions.filter(
      submission => submission.taskId === selectedTaskId,
    );
  }

  taskTitle(taskId: string): string {
    const task = this.tasks().find(
      item => item.id === taskId,
    );

    return task?.title ?? 'Unknown QA task';
  }

  // ---------------------------------------------------------------------------
  // Task status management
  // ---------------------------------------------------------------------------

  draftStatus(task: QaTask): QaTaskStatus {
    return this.draftStatuses.get(task.id) ?? task.status;
  }

  setDraftStatus(taskId: string, status: QaTaskStatus): void {
    const validStatuses: QaTaskStatus[] = [
      'open',
      'in_progress',
      'submitted',
      'closed',
    ];

    if (!validStatuses.includes(status)) {
      this.errorMessage.set('The selected task status is invalid.');
      return;
    }

    const task = this.tasks().find(
      item => item.id === taskId,
    );

    if (!task) {
      this.errorMessage.set('The selected QA task could not be found.');
      return;
    }

    if (this.pendingStatusUpdates.has(taskId)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    if (status === task.status) {
      this.draftStatuses.delete(taskId);
      return;
    }

    this.draftStatuses.set(taskId, status);
  }

  hasStatusChange(task: QaTask): boolean {
    return (
      this.draftStatuses.has(task.id) &&
      this.draftStatuses.get(task.id) !== task.status
    );
  }

  isUpdatingTask(taskId: string): boolean {
    return this.pendingStatusUpdates.has(taskId);
  }

  async saveTaskStatus(task: QaTask): Promise<void> {
    if (!this.authService.isPlatformAdmin) {
      this.errorMessage.set('Only platform administrators can change QA task status.');
      return;
    }

    const nextStatus = this.draftStatuses.get(task.id);

    if (!nextStatus || nextStatus === task.status) {
      this.draftStatuses.delete(task.id);
      return;
    }

    if (this.pendingStatusUpdates.has(task.id)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.pendingStatusUpdates.add(task.id);
    this.updatingTaskIds.set([...this.pendingStatusUpdates]);

    try {
      await this.qaService.updateTaskStatus(task.id, nextStatus);

      this.tasks.update(tasks =>
        tasks.map(item =>
          item.id === task.id
            ? { ...item, status: nextStatus }
            : item,
        ),
      );

      this.draftStatuses.delete(task.id);

      this.successMessage.set(
        `Task "${task.title}" status updated to ${this.formatStatus(nextStatus)}.`,
      );
    } catch (error: unknown) {
      this.errorMessage.set(
        this.errorText(error, 'Unable to update the QA task status.'),
      );
    } finally {
      this.pendingStatusUpdates.delete(task.id);
      this.updatingTaskIds.set([...this.pendingStatusUpdates]);
    }
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  formatStatus(status: QaTaskStatus): string {
    const labels: Record<QaTaskStatus, string> = {
      open: 'Open',
      in_progress: 'In progress',
      submitted: 'Submitted',
      closed: 'Closed',
    };

    return labels[status] ?? status;
  }

  statusClasses(status: QaTaskStatus): string {
    const classes: Record<QaTaskStatus, string> = {
      open: 'bg-amber-50 text-amber-800',
      in_progress: 'bg-indigo-50 text-indigo-800',
      submitted: 'bg-blue-50 text-blue-800',
      closed: 'bg-gray-100 text-gray-700',
    };

    return classes[status] ?? 'bg-gray-100 text-gray-700';
  }

  formatResult(result: QaResultStatus): string {
    const labels: Record<QaResultStatus, string> = {
      pass: 'Passed',
      fail: 'Failed',
      blocked: 'Blocked',
    };

    return labels[result] ?? result;
  }

  resultClasses(result: QaResultStatus): string {
    const classes: Record<QaResultStatus, string> = {
      pass: 'bg-green-50 text-green-800',
      fail: 'bg-red-50 text-red-800',
      blocked: 'bg-amber-50 text-amber-800',
    };

    return classes[result] ?? 'bg-gray-100 text-gray-700';
  }

  formatDate(value: unknown): string {
    if (!value) {
      return '—';
    }

    try {
      let date: Date | undefined;

      if (value instanceof Date) {
        date = value;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof value.toDate === 'function'
      ) {
        date = value.toDate() as Date;
      } else if (
        typeof value === 'object' &&
        value !== null &&
        'seconds' in value &&
        typeof value.seconds === 'number'
      ) {
        date = new Date(value.seconds * 1000);
      }

      if (!date || Number.isNaN(date.getTime())) {
        return '—';
      }

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '—';
    }
  }

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  private errorText(error: unknown, fallback: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    return fallback;
  }
}
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
 
import { FormsModule } from '@angular/forms';
 
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
 
import { HotToastService } from '@ngxpert/hot-toast';
 
import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
 
import { TestCourse } from '../../../test-center/models/test-course.model';
import { httpsCallable } from 'firebase/functions';
import { firebaseAuth, firebaseFunctions } from '../../../../core/services/firebase-config';
 
import {
  TestQuestion,
  TestQuestionDifficulty,
  TestQuestionOption,
  TestQuestionStatus,
  TestQuestionType,
} from '../../../test-center/models/test-question.model';
 
import { TestTopic } from '../../../test-center/models/test-topic.model';
 
import { TestCourseService } from '../../../test-center/services/test-course.service';
import { TestQuestionService } from '../../../test-center/services/test-question.service';
import { TestTopicService } from '../../../test-center/services/test-topic.service';
import { MatFormFieldModule } from '@angular/material/form-field';
 
// ============================================================
// FORM MODEL
// ============================================================
 
interface QuestionForm {
  courseId: string;
  topicId: string;
  question: string;
  type: TestQuestionType;
  options: TestQuestionOption[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: TestQuestionDifficulty;
  tagsText: string;
  sourceType: 'original' | 'licensed';
  sourceReference: string;
}
 
interface OrganizationEmailRecipient {
  uid: string;
  email: string;
  displayName?: string;
}
 
// ============================================================
// COMPONENT
// ============================================================
 
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-partner-test-questions',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- ====================================================== -->
      <!-- HEADER -->
      <!-- ====================================================== -->
 
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-sm text-white/60">
                <a routerLink="/partner" class="hover:text-white"> {{ 'Partner Portal' | t }} </a>
 
                <span>/</span>
 
                <a
                  [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
                  class="hover:text-white"                
                  > {{ 'Test Center' | t }}
                </a>
 
                <span>/</span>
 
                <span class="text-white/90"> {{ 'Questions' | t }} </span>
              </div>
 
              <p class="mt-1 text-sm text-white/70 hidden sm:block">
                {{ 'Create questions for your organization\\u0027s courses and move them through the review and publication workflow.' | t }}
              </p>
            </div>
 
            <a
              mat-stroked-button
              [routerLink]="['/partner/org', context.organizationId(), 'test-center']"
              class="!border-white/10 !text-white "
            >
              <mat-icon> arrow_back </mat-icon>
 
              {{ 'Test Center' | t }}
            </a>
          </div>
        </div>
      </header>
 
      <!-- ====================================================== -->
      <!-- MAIN -->
      <!-- ====================================================== -->
 
      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- ==================================================== -->
        <!-- CONTEXT LOADING -->
        <!-- ==================================================== -->
 
        @if (context.loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <mat-icon class="!h-8 !w-8 !text-3xl text-gray-500"> sync </mat-icon>
 
            <p class="mt-3 text-sm text-gray-600">{{ 'Loading your partner organization...' | t }}</p>
          </section>
        } @else if (context.error()) {
          <!-- ================================================== -->
          <!-- CONTEXT ERROR -->
          <!-- ================================================== -->
 
          <section class="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 class="font-semibold text-red-900">{{ 'Partner access unavailable' | t }}</h2>
 
            <p class="mt-1 text-sm text-red-700">
              {{ context.error() | t }}
            </p>
 
            <button
              type="button"
              (click)="initialize()"
              class="mt-4 rounded-lg bg-[#032D42] px-4 py-2 text-sm font-semibold text-white"
            >
              {{ 'Try again' | t }}
            </button>
          </section>
        } @else {
          <!-- ================================================== -->
          <!-- COURSE / TOPIC SELECTORS -->
          <!-- ================================================== -->
 
          <section class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <div class="grid gap-4 md:grid-cols-[1fr_1fr_0.5fr]">
              <!-- COURSE -->
              <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                <mat-label>{{ 'Course' | t }}</mat-label>
 
                <mat-select
                  [ngModel]="selectedCourseId()"
                  (ngModelChange)="onCourseChange($event)"
                >
                  <mat-option value="">{{ 'Select a course' | t }}</mat-option>
 
                  @for (course of courses(); track course.id) {
                    <mat-option [value]="course.id">
                      {{ course.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
 
              <!-- TOPIC -->
              <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                <mat-label>{{ 'Topic' | t }}</mat-label>
 
                <mat-select
                  [ngModel]="selectedTopicId()"
                  (ngModelChange)="onTopicChange($event)"
                  [disabled]="!selectedCourseId() || loadingTopics()"
                >
                  <mat-option value="">{{ 'Select a topic' | t }}</mat-option>
 
                  @for (topic of topics(); track topic.id) {
                    <mat-option [value]="topic.id">
                      {{ topic.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
 
              <!-- NEW QUESTION -->
              <div class="flex items-center">
                <button
                  type="button"
                  (click)="startNewQuestion()"
                  [disabled]="!selectedTopicId() || !access.canManageQuestions()"
                  class="mb-0 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#007979] px-5 py-3 text-base font-semibold text-white shadow-sm transition duration-200 hover:bg-[#006666] focus:outline-none focus:ring-4 focus:ring-[#007979]/20 disabled:cursor-not-allowed disabled:opacity-50 md:w-60"
                >
                  <mat-icon>add</mat-icon>
                  <span>{{ 'New Question' | t }}</span>
                </button>
              </div>
            </div>
          </section>
 
          <!-- ================================================== -->
          <!-- SELECTED COURSE / TOPIC -->
          <!-- ================================================== -->
 
          @if (selectedCourse(); as course) {
            <section class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="min-w-0 shrink-0">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ course.name }}
                  </p>
 
                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ selectedTopic()?.name || ('Select a topic' | t) }}
                  </h2>
                </div>
 
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-center">
                  @for (filter of statusFilters; track filter.value) {
                    <button
                      type="button"
                      (click)="setStatusFilter(filter.value)"
                      [attr.aria-pressed]="statusFilter() === filter.value"
                      class="inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition"
                      [class.border-[#007979]]="statusFilter() === filter.value"
                      [class.bg-[#007979]]="statusFilter() === filter.value"
                      [class.text-white]="statusFilter() === filter.value"
                      [class.border-gray-200]="statusFilter() !== filter.value"
                      [class.bg-white]="statusFilter() !== filter.value"
                      [class.text-gray-600]="statusFilter() !== filter.value"
                      [class.hover:border-[#007979]]="statusFilter() !== filter.value"
                    >
                      {{ filter.label | t }}
                      <span
                        class="rounded-full px-1.5 py-0.5 text-[14px]"
                        [class.bg-white/20]="statusFilter() === filter.value"
                        [class.bg-gray-100]="statusFilter() !== filter.value"
                        >{{ statusCount(filter.value) }}</span
                      >
                    </button>
                  }
                 
                </div>
 
<div class="flex flex-wrap items-center gap-2">
  <button
    type="button"
    (click)="prepareQuizEmail()"
    [disabled]="!selectedCourse() || !selectedTopic()"
    class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
  >
    <mat-icon>mail</mat-icon>
    {{ 'Email' | t }} 
  </button>
</div>
              </div>
            </section>
          }
 
 
          <!-- Generate and email a quiz link -->
 
 
@if (showQuizEmailForm()) {
  <div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
    <!-- Header: description on the left, member lookup on the right -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h3 class="text-lg font-bold text-gray-900">
          {{ 'Send Quiz Link' | t }}
        </h3>
 
        <p class="mt-1 text-sm text-gray-600">
          {{ 'Enter the recipient\\u0027s email address and send them the practice quiz link.' | t }}
        </p>
      </div>
 
      <button
        type="button"
        (click)="lookupOrganizationMembers()"
        [disabled]="lookingUpMembers()"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#007979] bg-white px-4 py-2 text-sm font-semibold text-[#007979] transition hover:bg-teal-50 disabled:opacity-50"
      >
        <mat-icon>person_search</mat-icon>
 
        {{ lookingUpMembers() ? ('Loading Members...' | t) : ('Look Up Members' | t) }}
      </button>
    </div>
 
<!-- Subject (pre-filled by the server, editable before sending) -->
<div class="mb-2">
  <mat-form-field appearance="outline" class="zb-field">
    <mat-label>{{ 'Subject' | t }}</mat-label>
 
    <input
      matInput
      type="text"
      maxlength="200"
      name="quizEmailSubject"
      [ngModel]="quizEmailSubject()"
      (ngModelChange)="quizEmailSubject.set($event)"
      [disabled]="loadingQuizDefaults()"
      [placeholder]="loadingQuizDefaults() ? ('Loading default subject...' | t) : ('Email subject' | t)"
    />
 
    <mat-hint align="end">{{ quizEmailSubject().length }} / 200</mat-hint>
  </mat-form-field>
 
  @if (quizEmailSignature()) {
    <p class="mt-1 text-xs text-gray-500">
      {{ 'The email will be signed "{0}".' | t: [quizEmailSignature()] }}
    </p>
  }
</div>
 
<!-- Multiple recipients -->
<div class="mb-4">
<mat-form-field appearance="outline" class="zb-field">
  <mat-label>{{ 'Recipient Emails' | t }}</mat-label>
 
  <textarea
    matInput
    [(ngModel)]="quizRecipientEmail"
    name="quizRecipientEmail"
    rows="3"
    [placeholder]="'learner1@example.com, learner2@example.com' | t"
  ></textarea>
</mat-form-field>
 
  <p class="mt-1 text-xs text-gray-500">
    {{ 'Enter multiple addresses separated by commas, semicolons, or new lines.' | t }}
  </p>
</div>
 
<!-- Organization member lookup -->
@if (showMemberLookup()) {
  <div class="mb-4 rounded-lg border border-gray-200 bg-white p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h4 class="font-semibold text-gray-900">
        {{ 'Organization Members' | t }}
      </h4>
 
      <button
        type="button"
        (click)="showMemberLookup.set(false)"
        class="text-sm text-gray-500 hover:text-gray-800"
      >
        {{ 'Close' | t }}
      </button>
    </div>
 
    <mat-form-field appearance="outline" class="zb-field w-full sm:max-w-xs zb-search" subscriptSizing="dynamic">
      <mat-label>{{ 'Search members' | t }}</mat-label>
      <mat-icon matPrefix aria-hidden="true">search</mat-icon>
      <input
        matInput
        type="search"
        [(ngModel)]="memberSearchTerm"
        [placeholder]="'Name or email' | t"
        autocomplete="off"
      />
    </mat-form-field>
 
    <div class="max-h-64 space-y-2 overflow-y-auto">
      @for (member of filteredOrganizationMembers(); track member.uid) {
        <div class="rounded-lg border border-gray-100 px-2 py-1 hover:bg-gray-50">
          <mat-checkbox
            class="w-full"
            [checked]="isMemberSelected(member.email)"
            (change)="toggleMemberRecipient(member.email, $event.checked)"
          >
            <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-gray-900">
              {{ member.displayName || member.email }}
            </span>
 
            <span class="block truncate text-xs text-gray-500">
              {{ member.email }}
            </span>
          </span>
          </mat-checkbox>
        </div>
      } @empty {
        <p class="py-4 text-center text-sm text-gray-500">
          {{ 'No organization members found.' | t }}
        </p>
      }
    </div>
 
    <div class="mt-4 flex justify-end">
      <button
        type="button"
        (click)="addSelectedMembers()"
        class="rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006666]"
      >
        {{ 'Add Selected Members' | t }}
      </button>
    </div>
  </div>
}
 
    <!-- Generated link -->
    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <mat-form-field appearance="outline" class="zb-field zb-field--grow zb-field--flush" subscriptSizing="dynamic">
        <mat-label>{{ 'Quiz link' | t }}</mat-label>
        <input
          matInput
          id="quiz-share-link"
          type="url"
          [value]="quizShareLink()"
          readonly
        />
      </mat-form-field>
 
      <button
        mat-stroked-button
        type="button"
        (click)="copyPreparedQuizLink()"
      >
        <mat-icon>content_copy</mat-icon>
        {{ 'Copy Link' | t }}
      </button>
    </div>
 
    <!-- Actions -->
    <div class="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        (click)="closeQuizEmailForm()"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
      >
        {{ 'Cancel' | t }}
      </button>
 
      <button
        type="button"
        (click)="sendQuizEmail()"
        [disabled]="sendingQuizEmail() || loadingQuizDefaults() || !quizEmailSubject().trim() || !quizRecipientEmail.trim() || !quizShareLink()"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#007979] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <mat-icon>{{ sendingQuizEmail() ? 'hourglass_top' : 'send' }}</mat-icon>
 
        {{ sendingQuizEmail() ? ('Sending...' | t) : ('Send Email' | t) }}
      </button>
    </div>
  </div>
}
 
          <!-- ================================================== -->
          <!-- QUESTION FORM -->
          <!-- ================================================== -->
 
          @if (showForm()) {
            <section
              id="question-form"
              class="mb-8 scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">
                    {{ editingQuestionId() ? ('Edit question' | t) : ('New question' | t) }}
                  </p>
 
                  <h2 class="mt-1 text-xl font-bold text-gray-900">
                    {{ editingQuestionId() ? ('Edit Question' | t) : ('Create Question' | t) }}
                  </h2>
                </div>
 
                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                  [attr.aria-label]="'Close question form' | t"
                >
                  <mat-icon> close </mat-icon>
                </button>
              </div>
 
              <div class="mt-6 space-y-1">
                <!-- QUESTION -->
 
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>{{ 'Question' | t }}</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="form.question"
                    rows="5"
                    [placeholder]="'Enter the question text.' | t"
                  ></textarea>
                </mat-form-field>
 
                <!-- TYPE / DIFFICULTY / SOURCE -->
 
                <div class="grid gap-x-5 md:grid-cols-3">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Type' | t }}</mat-label>
                    <mat-select [(ngModel)]="form.type" (ngModelChange)="onTypeChange()">
                      <mat-option value="multiple-choice">{{ 'Multiple Choice' | t }}</mat-option>
 
                      <mat-option value="true-false">{{ 'True / False' | t }}</mat-option>
                    </mat-select>
                  </mat-form-field>
 
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Difficulty' | t }}</mat-label>
                    <mat-select [(ngModel)]="form.difficulty">
                      <mat-option value="easy">{{ 'Easy' | t }}</mat-option>
 
                      <mat-option value="medium">{{ 'Medium' | t }}</mat-option>
 
                      <mat-option value="hard">{{ 'Hard' | t }}</mat-option>
                    </mat-select>
                  </mat-form-field>
 
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Source' | t }}</mat-label>
                    <mat-select [(ngModel)]="form.sourceType">
                      <mat-option value="original">{{ 'Original' | t }}</mat-option>
 
                      <mat-option value="licensed">{{ 'Licensed' | t }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
 
                <!-- ANSWER OPTIONS -->
 
                <div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-medium text-gray-700"> {{ 'Answer options' | t }} </span>
 
                    @if (form.type === 'multiple-choice') {
                      <button
                        type="button"
                        (click)="addOption()"
                        class="text-sm font-semibold text-[#007979]"
                      >
                        {{ '+ Add option' | t }}
                      </button>
                    }
                  </div>
 
                  <mat-radio-group
                    class="mt-3 block"
                    [(ngModel)]="form.correctAnswer"
                    [attr.aria-label]="'Correct answer' | t"
                  >
                    @for (option of form.options; track option.id) {
                      <div class="flex items-center gap-2">
                        <mat-radio-button
                          [value]="option.id"
                          [attr.aria-label]="'Mark option ' + ($index + 1) + ' as correct'"
                        ></mat-radio-button>
 
                        <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                          <mat-label>{{ 'Answer option ' + ($index + 1) }}</mat-label>
                          <input matInput [(ngModel)]="option.text" />
                        </mat-form-field>
 
                        @if (form.type === 'multiple-choice' && form.options.length > 2) {
                          <button
                            type="button"
                            (click)="removeOption(option.id)"
                            class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            [attr.aria-label]="'Remove option' | t"
                          >
                            <mat-icon> delete </mat-icon>
                          </button>
                        }
                      </div>
                    }
                  </mat-radio-group>
 
                  <p class="mt-1 text-xs text-gray-500">
                    {{ 'Select the radio button for the correct answer.' | t }}
                  </p>
                </div>
 
                <!-- EXPLANATION / HINT -->
 
                <div class="grid gap-x-5 md:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Explanation' | t }}</mat-label>
                    <textarea matInput [(ngModel)]="form.explanation" rows="4" [placeholder]="'Explain why the answer is correct.' | t"></textarea>
                  </mat-form-field>
 
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Hint' | t }}</mat-label>
                    <textarea matInput [(ngModel)]="form.hint" rows="4" [placeholder]="'Optional answer-neutral hint.' | t"></textarea>
                  </mat-form-field>
                </div>
 
                <!-- TAGS / SOURCE REFERENCE -->
 
                <div class="grid gap-x-5 md:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Tags' | t }}</mat-label>
                    <input matInput [(ngModel)]="form.tagsText" [placeholder]="'cmdb, discovery, itil' | t" />
                    <mat-hint>{{ 'Separate tags with commas.' | t }}</mat-hint>
                  </mat-form-field>
 
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Source reference' | t }}</mat-label>
                    <input matInput [(ngModel)]="form.sourceReference" [placeholder]="'Optional source or license reference' | t" />
                  </mat-form-field>
                </div>
              </div>
 
              <!-- FORM ACTIONS -->
 
              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700"
                >
                  {{ 'Cancel' | t }}
                </button>
 
                <button
                  type="button"
                  (click)="saveDraft()"
                  [disabled]="saving()"
                  class="rounded-lg border border-[#007979] px-5 py-2.5 text-sm font-semibold text-[#007979] disabled:opacity-50"
                >
                  {{ 'Save Draft' | t }}
                </button>
 
                <button
                  type="button"
                  (click)="saveAndSubmit()"
                  [disabled]="saving()"
                  class="rounded-lg bg-[#032D42] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {{ 'Save & Submit' | t }}
                </button>
              </div>
            </section>
          }
 
          <!-- ================================================== -->
          <!-- QUESTIONS -->
          <!-- ================================================== -->
 
          <section>
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ 'Questions' | t }}</h2>
 
                <p class="mt-1 text-sm text-gray-500">
                  {{ '{0} question{1}' | t: [filteredQuestions().length, (filteredQuestions().length === 1 ? '' : 's')] }}
                  @if (statusFilter() !== 'all') {
                    <span> · {{ statusLabel(statusFilter()) | t }}</span>
                  }
                </p>
              </div>
            </div>
 
            @if (loadingQuestions()) {
              <div class="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p class="text-sm text-gray-500">{{ 'Loading questions...' | t }}</p>
              </div>
            } @else if (!selectedTopicId()) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> topic </mat-icon>
 
                <p class="mt-3 font-semibold text-gray-900">{{ 'Select a topic' | t }}</p>
 
                <p class="mt-1 text-sm text-gray-500">
                  {{ 'Choose a course and topic to manage its questions.' | t }}
                </p>
              </div>
            } @else if (questions().length === 0) {
              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >
                <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400"> quiz </mat-icon>
 
                <p class="mt-3 font-semibold text-gray-900">{{ 'No questions yet' | t }}</p>
 
                <p class="mt-1 text-sm text-gray-500">{{ 'Create the first question for this topic.' | t }}</p>
 
                @if (access.canManageQuestions()) {
                  <button
                    type="button"
                    (click)="startNewQuestion()"
                    class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <mat-icon> add </mat-icon>
 
                    {{ 'Create Question' | t }}
                  </button>
                }
              </div>
            } @else {
              @if (filteredQuestions().length === 0) {
                <div
                  class="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center"
                >
                  <p class="font-semibold text-gray-900">{{ 'No questions in this status' | t }}</p>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ 'Choose another status filter to see more questions.' | t }}
                  </p>
                  <button
                    type="button"
                    (click)="setStatusFilter('all')"
                    class="mt-3 rounded-md bg-[#007979] px-3 py-2 text-sm font-semibold text-white"
                  >
                    {{ 'Show all questions' | t }}
                  </button>
                </div>
              } @else {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  @for (question of filteredQuestions(); track question.id) {
                    <article
                      class="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-4 sm:p-5"
                    >
                      <!-- QUESTION HEADER -->
 
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <span
                              class="rounded-full bg-gray-100 px-2 py-1 text-sm font-semibold uppercase tracking-wide text-gray-600"
                            >
                              {{ statusLabel(question.status) | t }}
                            </span>
 
                            <span
                              class="rounded-full bg-teal-50 px-2 py-1 text-sm font-semibold text-[#007979]"
                            >
                              {{ question.difficulty | t }}
                            </span>
 
                            <span class="text-mdtext-gray-500">
                              {{
                                question.type === 'multiple-choice'
                                  ? ('Multiple Choice' | t)
                                  : 'True / False'
                              }}
                            </span>
                          </div>
 
                          <!-- QUESTION TEXT -->
                          <p class="mt-3 break-words text-md font-semibold leading-5 text-gray-900">
                            {{ question.question }}
                          </p>
 
                          <!-- ANSWER OPTIONS -->
                          <div class="mt-3 space-y-2">
                            @for (option of question.options; track option.id) {
                              <div
                                class="flex min-w-0 items-start gap-2 rounded-md border px-2.5 py-2"
                                [class.border-green-200]="option.id === question.correctAnswer"
                                [class.bg-green-50]="option.id === question.correctAnswer"
                                [class.border-gray-200]="option.id !== question.correctAnswer"
                                [class.bg-gray-50]="option.id !== question.correctAnswer"
                              >
                                <!-- OPTION INDICATOR -->
                                <span
                                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                  [class.bg-green-600]="option.id === question.correctAnswer"
                                  [class.text-white]="option.id === question.correctAnswer"
                                  [class.bg-gray-200]="option.id !== question.correctAnswer"
                                  [class.text-gray-700]="option.id !== question.correctAnswer"
                                >
                                  {{ $index + 1 }}
                                </span>
 
                                <!-- OPTION TEXT -->
                                <span
                                  class="min-w-0 flex-1 break-words text-sm leading-5"
                                  [class.font-semibold]="option.id === question.correctAnswer"
                                  [class.text-green-800]="option.id === question.correctAnswer"
                                  [class.text-gray-700]="option.id !== question.correctAnswer"
                                >
                                  {{ option.text }}
                                </span>
 
                                <!-- CORRECT ANSWER INDICATOR -->
                                @if (option.id === question.correctAnswer) {
                                  <mat-icon
                                    class="!h-4 !w-4 !text-base text-green-600"
                                    [attr.aria-label]="'Correct answer' | t"
                                  >
                                    check_circle
                                  </mat-icon>
                                }
                              </div>
                            }
                          </div>
 
                          <!-- EXPLANATION, WHEN AVAILABLE -->
                          @if (question.explanation) {
                            <div
                              class="mt-3 rounded-md border-l-2 border-teal-500 bg-teal-50 px-3 py-2"
                            >
                              <p class="text-xs font-semibold text-teal-800">{{ 'Explanation' | t }}</p>
 
                              <p class="mt-1 break-words text-xs leading-5 text-gray-700">
                                {{ question.explanation }}
                              </p>
                            </div>
                          }
                        </div>
                      </div>
 
                      <!-- QUESTION ACTIONS -->
 
                      <div class="mt-auto flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                        @if (canEditQuestion(question)) {
                          <button
                            type="button"
                            (click)="editQuestion(question)"
                            class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                          >
                            {{ 'Edit' | t }}
                          </button>
                        }
 
                        @if (canSubmit(question)) {
                          <button
                            type="button"
                            (click)="submitForReview(question)"
                            class="rounded-lg bg-[#032D42] px-3 py-2 text-sm font-semibold text-white"
                          >
                            {{ 'Submit for Review' | t }}
                          </button>
                        }
 
                        @if (canStartReview(question)) {
                          <button
                            type="button"
                            (click)="startReview(question)"
                            class="rounded-lg bg-[#007979] px-3 py-2 text-sm font-semibold text-white"
                          >
                            {{ 'Start Review' | t }}
                          </button>
                        }
 
                        @if (canReturn(question)) {
                          <button
                            type="button"
                            (click)="returnQuestion(question)"
                            class="rounded-lg border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-700"
                          >
                            {{ 'Return' | t }}
                          </button>
                        }
 
                        @if (canApprove(question)) {
                          <button
                            type="button"
                            (click)="approveQuestion(question)"
                            class="rounded-lg bg-[#007979] px-3 py-2 text-xs font-semibold text-white"
                          >
                            {{ 'Approve' | t }}
                          </button>
                        }
 
                        @if (canPublish(question)) {
                          <button
                            type="button"
                            (click)="publishQuestion(question)"
                            class="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white"
                          >
                            {{ 'Publish' | t }}
                          </button>
                        }
 
                        @if (canRetireQuestion(question)) {
                          <button
                            type="button"
                            (click)="retireQuestion(question)"
                            class="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                          >
                            {{ 'Retire' | t }}
                          </button>
                        }
 
                        @if (canDeleteQuestion(question)) {
                          <button
                            type="button"
                            (click)="deleteQuestion(question)"
                            class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
                          >
                            {{ 'Delete' | t }}
                          </button>
                        }
                      </div>
                    </article>
                  }
                </div>
              }
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class PartnerTestQuestionsComponent implements OnInit {
  // ============================================================
  // SERVICES
  // ============================================================
 
  protected readonly context = inject(PartnerOrganizationContextService);
 
  protected readonly access = inject(PartnerAccessService);
 
  private readonly route = inject(ActivatedRoute);

  /** Messages built with values are translated where they are created. */
  private readonly i18n = inject(I18nService);
 
  private readonly router = inject(Router);
 
  private readonly courseService = inject(TestCourseService);
 
  private readonly topicService = inject(TestTopicService);
 
  private readonly questionService = inject(TestQuestionService);
 
  private readonly toast = inject(HotToastService);
 
  private readonly pageTitleService = inject(PageTitleService);
 
  // ============================================================
  // STATE
  // ============================================================
 
  protected readonly courses = signal<TestCourse[]>([]);
 
  protected readonly topics = signal<TestTopic[]>([]);
 
  protected readonly questions = signal<TestQuestion[]>([]);
 
  protected readonly loadingTopics = signal(false);
 
  protected readonly loadingQuestions = signal(false);
 
  protected readonly saving = signal(false);
 
  protected readonly showForm = signal(false);
 
  protected readonly editingQuestionId = signal<string | null>(null);
 
  protected readonly selectedCourseId = signal('');
 
  protected readonly selectedTopicId = signal('');
 
  protected readonly statusFilter = signal<TestQuestionStatus | 'all'>('all');
 
  protected readonly showQuizEmailForm = signal(false);
 
protected readonly quizShareLink = signal('');
 
protected readonly sendingQuizEmail = signal(false);
 
protected readonly lookingUpMembers = signal(false);
 
protected readonly showMemberLookup = signal(false);
 
protected readonly organizationMembers =
  signal<OrganizationEmailRecipient[]>([]);
 
protected readonly selectedMemberEmails =
  signal<string[]>([]);
 
/** Editable subject, pre-filled from getCommunicationDefaults. */
protected readonly quizEmailSubject = signal('');
 
/** Sign-off the server will add, shown as a hint. */
protected readonly quizEmailSignature = signal('');
 
protected readonly loadingQuizDefaults = signal(false);
 
protected memberSearchTerm = '';
 
protected quizRecipientEmail = '';
 
  protected readonly statusFilters: {
    label: string;
    value: TestQuestionStatus | 'all';
  }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'staff_submitted' },
    { label: 'Review', value: 'manager_review' },
    { label: 'Returned', value: 'rejected' },
    { label: 'Approved', value: 'approved' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ];
 
  protected readonly filteredQuestions = computed(() => {
    const filter = this.statusFilter();
    const questions = this.questions();
    return filter === 'all'
      ? questions
      : questions.filter((question) => question.status === filter);
  });
 
  // ============================================================
  // FORM
  // ============================================================
 
  protected form: QuestionForm = this.createEmptyForm();
 
  // ============================================================
  // COMPUTED
  // ============================================================
 
  protected readonly selectedCourse = computed(
    () => this.courses().find((course) => course.id === this.selectedCourseId()) ?? null,
  );
 
  protected readonly selectedTopic = computed(
    () => this.topics().find((topic) => topic.id === this.selectedTopicId()) ?? null,
  );
 
  // ============================================================
  // INITIALIZATION
  // ============================================================
 
  async ngOnInit(): Promise<void> {
    await this.initialize();
  }
 
  protected async initialize(): Promise<void> {
    try {
      await this.context.initialize();
 
      const organizationId = this.context.organizationId();
 
      if (!organizationId) {
        return;
      }
 
      const courses = await this.courseService.getAllCourses(organizationId);
 
      this.courses.set(
        courses.filter(
          (course) =>
            course.scope === 'organization' &&
            course.organizationId === organizationId &&
            course.active === true,
        ),
      );
 
      const courseId = this.route.snapshot.queryParamMap.get('courseId') ?? '';
 
      if (courseId && this.courses().some((course) => course.id === courseId)) {
        await this.onCourseChange(courseId);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load Test Center questions.';
 
      this.toast.error(message);
    }
 
    this.pageTitleService.setTitle(' Test Center Questions');
  }
 
  // ============================================================
  // COURSE CHANGE
  // ============================================================
 
  protected async onCourseChange(courseId: string): Promise<void> {
    this.selectedCourseId.set(courseId);
 
    this.selectedTopicId.set('');
 
    this.topics.set([]);
 
    this.questions.set([]);
 
    this.cancelForm();
 
    if (!courseId) {
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          courseId: null,
          topicId: null,
        },
        queryParamsHandling: 'merge',
      });
 
      return;
    }
 
    const organizationId = this.context.organizationId();
 
    if (!organizationId) {
      return;
    }
 
    try {
      this.loadingTopics.set(true);
 
      const topics = await this.topicService.getAllTopics(organizationId, courseId);
 
      this.topics.set(topics.filter((topic) => topic.active === true));
 
      const topicId = this.route.snapshot.queryParamMap.get('topicId') ?? '';
 
      if (topicId && this.topics().some((topic) => topic.id === topicId)) {
        await this.onTopicChange(topicId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load Test Center topics.';
 
      this.toast.error(message);
    } finally {
      this.loadingTopics.set(false);
    }
  }
 
  // ============================================================
  // TOPIC CHANGE
  // ============================================================
 
  protected async onTopicChange(topicId: string): Promise<void> {
    this.selectedTopicId.set(topicId);
 
    this.questions.set([]);
 
    this.cancelForm();
 
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        courseId: this.selectedCourseId(),
        topicId: topicId || null,
      },
      queryParamsHandling: 'merge',
    });
 
    if (!topicId) {
      return;
    }
 
    await this.loadQuestions();
  }
 
  // ============================================================
  // LOAD QUESTIONS
  // ============================================================
 
  private async loadQuestions(): Promise<void> {
    const organizationId = this.context.organizationId();
 
    const topicId = this.selectedTopicId();
 
    if (!organizationId || !topicId) {
      return;
    }
 
    try {
      this.loadingQuestions.set(true);
 
      const questions = await this.questionService.getAllQuestionsForTopic(organizationId, topicId);
 
      this.questions.set(questions);
    } catch (error) {
      this.questions.set([]);
 
      const message = error instanceof Error ? error.message : 'Unable to load questions.';
 
      this.toast.error(message);
    } finally {
      this.loadingQuestions.set(false);
    }
  }
 
  // ============================================================
  // CREATE QUESTION
  // ============================================================
 
  protected startNewQuestion(): void {
    const organizationId = this.context.organizationId();
 
    if (!organizationId) {
      this.toast.error('No partner organization is selected.');
 
      return;
    }
 
    if (!this.access.canManageQuestions()) {
      this.toast.error('You do not have permission to manage questions.');
 
      return;
    }
 
    const courseId = this.selectedCourseId();
 
    const topicId = this.selectedTopicId();
 
    if (!courseId) {
      this.toast.error('Select a course first.');
 
      return;
    }
 
    if (!topicId) {
      this.toast.error('Select a topic first.');
 
      return;
    }
 
    this.editingQuestionId.set(null);
 
    this.form = this.createEmptyForm();
 
    this.form.courseId = courseId;
 
    this.form.topicId = topicId;
 
    this.showForm.set(true);
 
    setTimeout(() => {
      document.getElementById('question-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }
 
  // ============================================================
  // EDIT QUESTION
  // ============================================================
 
  protected editQuestion(question: TestQuestion): void {
    if (!this.canEditQuestion(question)) {
      this.toast.error('This question cannot be edited in its current workflow state.');
 
      return;
    }
 
    this.editingQuestionId.set(question.id);
 
    this.form = {
      courseId: question.courseId,
 
      topicId: question.topicId,
 
      question: question.question ?? '',
 
      type: question.type,
 
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
 
      correctAnswer: question.correctAnswer,
 
      explanation: question.explanation ?? '',
 
      hint: question.hint ?? '',
 
      difficulty: question.difficulty,
 
      tagsText: question.tags.join(', '),
 
      sourceType: question.sourceType,
 
      sourceReference: question.sourceReference ?? '',
    };
 
    this.showForm.set(true);
 
    setTimeout(() => {
      document.getElementById('question-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }
 
  // ============================================================
  // CANCEL FORM
  // ============================================================
 
  protected cancelForm(): void {
    this.showForm.set(false);
 
    this.editingQuestionId.set(null);
 
    this.form = this.createEmptyForm();
  }
 
  // ============================================================
  // SAVE DRAFT
  // ============================================================
 
  protected async saveDraft(): Promise<void> {
    await this.saveQuestion('draft');
  }
 
  // ============================================================
  // SAVE + SUBMIT
  // ============================================================
 
  protected async saveAndSubmit(): Promise<void> {
    await this.saveQuestion('staff_submitted');
  }
 
  // ============================================================
  // SAVE QUESTION
  // ============================================================
 
  private async saveQuestion(status: TestQuestionStatus): Promise<void> {
    if (this.saving()) {
      return;
    }
 
    if (!this.access.canManageQuestions()) {
      this.toast.error('You do not have permission to manage questions.');
 
      return;
    }
 
    const organizationId = this.context.organizationId();
 
    if (!organizationId) {
      this.toast.error('No partner organization is selected.');
 
      return;
    }
 
    const validationError = this.validateForm();
 
    if (validationError) {
      this.toast.error(validationError);
 
      return;
    }
 
    try {
      this.saving.set(true);
 
      const payload: Omit<TestQuestion, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId,
 
        courseId: this.form.courseId,
 
        topicId: this.form.topicId,
 
        question: this.form.question.trim(),
 
        type: this.form.type,
 
        options: this.form.options.map((option) => ({
          id: option.id,
          text: option.text.trim(),
        })),
 
        correctAnswer: this.form.correctAnswer,
 
        explanation: this.form.explanation.trim(),
 
        hint: this.form.hint.trim(),
 
        difficulty: this.form.difficulty,
 
        tags: this.parseTags(this.form.tagsText),
 
        sourceType: this.form.sourceType,
 
        sourceReference: this.form.sourceReference.trim(),
 
        status,
      };
 
      const questionId = this.editingQuestionId();
 
      if (questionId) {
        await this.questionService.updateQuestion(organizationId, questionId, {
          courseId: payload.courseId,
 
          topicId: payload.topicId,
 
          question: payload.question,
 
          type: payload.type,
 
          options: payload.options,
 
          correctAnswer: payload.correctAnswer,
 
          explanation: payload.explanation,
 
          hint: payload.hint,
 
          difficulty: payload.difficulty,
 
          tags: payload.tags,
 
          sourceType: payload.sourceType,
 
          sourceReference: payload.sourceReference,
 
          status,
        });
 
        this.toast.success(
          status === 'staff_submitted' ? 'Question submitted for review.' : 'Question draft saved.',
        );
      } else {
        await this.questionService.createQuestion(organizationId, payload);
 
        this.toast.success(
          status === 'staff_submitted' ? 'Question submitted for review.' : 'Question draft saved.',
        );
      }
 
      this.cancelForm();
 
      await this.loadQuestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the question.';
 
      this.toast.error(message);
    } finally {
      this.saving.set(false);
    }
  }
 
  // ============================================================
  // SUBMIT FOR REVIEW
  // ============================================================
 
  protected async submitForReview(question: TestQuestion): Promise<void> {
    if (!this.access.canSubmitQuestionsForReview()) {
      return;
    }
 
    await this.runAction(
      () =>
        this.questionService.submitQuestionForReview(this.context.organizationId()!, question.id),
 
      'Question submitted for manager review.',
    );
  }
 
  // ============================================================
  // START REVIEW
  // ============================================================
 
  protected async startReview(question: TestQuestion): Promise<void> {
    if (!this.access.canReviewQuestions()) {
      return;
    }
 
    await this.runAction(
      () => this.questionService.startQuestionReview(this.context.organizationId()!, question.id),
 
      'Question moved into manager review.',
    );
  }
 
  // ============================================================
  // RETURN QUESTION
  // ============================================================
 
  protected async returnQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canRejectQuestions()) {
      return;
    }
 
    await this.runAction(
      () => this.questionService.returnQuestion(this.context.organizationId()!, question.id),
 
      'Question returned to staff.',
    );
  }
 
  // ============================================================
  // APPROVE QUESTION
  // ============================================================
 
  protected async approveQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canApproveQuestions()) {
      return;
    }
 
    await this.runAction(
      () => this.questionService.approveQuestion(this.context.organizationId()!, question.id),
 
      'Question approved.',
    );
  }
 
  // ============================================================
  // PUBLISH QUESTION
  // ============================================================
 
  protected async publishQuestion(question: TestQuestion): Promise<void> {
    if (!this.access.canPublishQuestions()) {
      return;
    }
 
    await this.runAction(
      () => this.questionService.publishQuestion(this.context.organizationId()!, question.id),
 
      'Question published.',
    );
  }
 
  // ============================================================
  // GENERIC WORKFLOW ACTION
  // ============================================================
 
  private async runAction(action: () => Promise<void>, successMessage: string): Promise<void> {
    try {
      await action();
 
      this.toast.success(successMessage);
 
      await this.loadQuestions();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'The question action could not be completed.';
 
      this.toast.error(message);
    }
  }
 
  // ============================================================
  // RETIRE PUBLISHED QUESTION
  // ============================================================
 
  /**
   * Retiring a published question archives it instead of permanently deleting it.
   * This keeps the question record available for audit/history while removing it
   * from normal published-question use, provided the query/UI respects status.
   */
  protected async retireQuestion(question: TestQuestion): Promise<void> {
    if (!this.canRetireQuestion(question)) {
      return;
    }
 
    const confirmed = window.confirm(
      'Retire this published question? It will be archived and will no longer be available as a published question.',
    );
 
    if (!confirmed) {
      return;
    }
 
    const organizationId = this.context.organizationId();
    if (!organizationId) {
      this.toast.error('No organization is selected.');
      return;
    }
 
    await this.runAction(
      () =>
        this.questionService.updateQuestion(organizationId, question.id, { status: 'archived' }),
      'Question retired and archived successfully.',
    );
  }
 
  // ============================================================
  // DELETE QUESTION
  // ============================================================
 
  protected async deleteQuestion(question: TestQuestion): Promise<void> {
    if (!this.canDeleteQuestion(question)) {
      return;
    }
 
    if (!window.confirm('Delete this question? This action cannot be undone.')) {
      return;
    }
 
    const organizationId = this.context.organizationId();
 
    if (!organizationId) {
      return;
    }
 
    try {
      await this.questionService.deleteQuestion(organizationId, question.id);
 
      this.toast.success('Question deleted successfully.');
 
      await this.loadQuestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete the question.';
 
      this.toast.error(message);
    }
  }
 
  // ============================================================
  // QUESTION PERMISSIONS
  // ============================================================
 
  protected canEditQuestion(question: TestQuestion): boolean {
    if (!this.access.canManageQuestions()) {
      return false;
    }
 
    return question.status === 'draft' || question.status === 'rejected';
  }
 
  protected canSubmit(question: TestQuestion): boolean {
    return (
      this.access.canSubmitQuestionsForReview() &&
      (question.status === 'draft' || question.status === 'rejected')
    );
  }
 
  protected canStartReview(question: TestQuestion): boolean {
    return this.access.canReviewQuestions() && question.status === 'staff_submitted';
  }
 
  protected canReturn(question: TestQuestion): boolean {
    return this.access.canRejectQuestions() && question.status === 'manager_review';
  }
 
  protected canApprove(question: TestQuestion): boolean {
    return this.access.canApproveQuestions() && question.status === 'manager_review';
  }
 
  protected canPublish(question: TestQuestion): boolean {
    return this.access.canPublishQuestions() && question.status === 'approved';
  }
 
  protected canRetireQuestion(question: TestQuestion): boolean {
    return this.access.canPublishQuestions() && question.status === 'published';
  }
 
  protected canDeleteQuestion(question: TestQuestion): boolean {
    return this.access.isAdmin() && question.status !== 'published';
  }
 
  // ============================================================
  // STATUS FILTERS
  // ============================================================
 
  protected setStatusFilter(status: TestQuestionStatus | 'all'): void {
    this.statusFilter.set(status);
  }
 
  protected statusCount(status: TestQuestionStatus | 'all'): number {
    return status === 'all'
      ? this.questions().length
      : this.questions().filter((question) => question.status === status).length;
  }
 
  // ============================================================
  // STATUS LABEL
  // ============================================================
 
  protected statusLabel(status: TestQuestionStatus | 'all'): string {
    switch (status) {
      case 'all':
        return 'All';
 
      case 'staff_submitted':
        return 'Submitted';
 
      case 'manager_review':
        return 'Manager Review';
 
      case 'rejected':
        return 'Returned';
 
      case 'approved':
        return 'Approved';
 
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
 
  // ============================================================
  // QUESTION TYPE
  // ============================================================
 
  protected onTypeChange(): void {
    if (this.form.type === 'true-false') {
      this.form.options = [
        {
          id: 'true',
          text: 'True',
        },
        {
          id: 'false',
          text: 'False',
        },
      ];
 
      if (this.form.correctAnswer !== 'true' && this.form.correctAnswer !== 'false') {
        this.form.correctAnswer = '';
      }
    } else if (this.form.options.length < 2) {
      this.form.options = [
        {
          id: 'option-a',
          text: '',
        },
        {
          id: 'option-b',
          text: '',
        },
      ];
 
      this.form.correctAnswer = '';
    }
  }
 
  // ============================================================
  // ADD OPTION
  // ============================================================
 
  protected addOption(): void {
    if (this.form.options.length >= 6) {
      return;
    }
 
    this.form.options.push({
      id: `option-${Date.now()}`,
      text: '',
    });
  }
 
  // ============================================================
  // REMOVE OPTION
  // ============================================================
 
  protected removeOption(optionId: string): void {
    if (this.form.options.length <= 2) {
      return;
    }
 
    this.form.options = this.form.options.filter((option) => option.id !== optionId);
 
    if (this.form.correctAnswer === optionId) {
      this.form.correctAnswer = '';
    }
  }
 
  // ============================================================
  // VALIDATION
  // ============================================================
 
  private validateForm(): string | null {
    if (!this.form.courseId) {
      return 'Course is required.';
    }
 
    if (!this.form.topicId) {
      return 'Topic is required.';
    }
 
    if (!this.form.question.trim()) {
      return 'Question text is required.';
    }
 
    if (this.form.options.length < 2) {
      return 'At least two answer options are required.';
    }
 
    if (this.form.options.some((option) => !option.text.trim())) {
      return 'Every answer option must contain text.';
    }
 
    if (!this.form.correctAnswer) {
      return 'Select the correct answer.';
    }
 
    if (!this.form.options.some((option) => option.id === this.form.correctAnswer)) {
      return 'The selected correct answer is invalid.';
    }
 
    return null;
  }
 
  // ============================================================
  // TAG PARSING
  // ============================================================
 
  private parseTags(value: string): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ];
  }
 
  // ============================================================
  // EMPTY FORM
  // ============================================================
 
  private createEmptyForm(): QuestionForm {
    return {
      courseId: '',
      topicId: '',
 
      question: '',
 
      type: 'multiple-choice',
 
      options: [
        {
          id: 'option-a',
          text: '',
        },
        {
          id: 'option-b',
          text: '',
        },
      ],
 
      correctAnswer: '',
 
      explanation: '',
 
      hint: '',
 
      difficulty: 'medium',
 
      tagsText: '',
 
      sourceType: 'original',
 
      sourceReference: '',
    };
  }
 
  /**
 * Generates and copies a shareable link to the selected
 * course's Quiz Details page for organization learners.
 */
protected async copyQuizLink(): Promise<void> {
  const course = this.selectedCourse();
  const topic = this.selectedTopic();
  const organizationId = this.context.organizationId();
 
 
 
  if (!course) {
    this.toast.error('Select a course before generating a test link.');
    return;
  }
 
  if (!topic) {
    this.toast.error('Select a topic before generating a test link.');
    return;
  }
 
  if (!organizationId) {
    this.toast.error('Unable to determine the organization.');
    return;
  }
 
  if (!course.slug) {
    this.toast.error('This course does not have a valid URL slug.');
    return;
  }
 
  try {
    // Load the latest questions for the selected topic.
    const questions = await this.questionService.getAllQuestionsForTopic(
      organizationId,
      topic.id,
    );
 
    // Only published questions are available to learners.
    const publishedQuestions = questions.filter(
      (question) => question.status === 'published',
    );
 
    if (publishedQuestions.length === 0) {
      this.toast.error(
        'Cannot generate a test link. This topic has no published questions.',
      );
      return;
    }
 
    const quizUrl = new URL(
      `/partner/org/${encodeURIComponent(organizationId)}/learn/test-center/quiz-details/${encodeURIComponent(course.slug)}`,
      window.location.origin,
    ).toString();
 
    await navigator.clipboard.writeText(quizUrl);
 
    this.toast.success(
      this.i18n.t('Test link copied! {0} published question(s) are available for this topic.', [publishedQuestions.length]),
    );
  } catch (error) {
    console.error('Failed to generate test link:', error);
    this.toast.error(
      'Unable to generate the test link. Please try again.',
    );
  }
}
 
protected async prepareQuizEmail(): Promise<void> {
  const course = this.selectedCourse();
  const topic = this.selectedTopic();
  const organizationId = this.context.organizationId();
 
  if (!course || !topic || !organizationId) {
    this.toast.error('Select a course and topic first.');
    return;
  }
 
  if (!course.slug) {
    this.toast.error('The selected course does not have a valid URL slug.');
    return;
  }
 
  try {
    const questions = await this.questionService.getAllQuestionsForTopic(
      organizationId,
      topic.id,
    );
 
    const publishedQuestions = questions.filter(
      (question) => question.status === 'published',
    );
 
    if (publishedQuestions.length === 0) {
      this.toast.error(
        'Cannot send the quiz link because this topic has no published questions.',
      );
      return;
    }
 
    const link = new URL(
      `/partner/org/${encodeURIComponent(organizationId)}/learn/test-center/quiz-details/${encodeURIComponent(course.slug)}`,
      window.location.origin,
    ).toString();
 
    this.quizShareLink.set(link);
    this.showQuizEmailForm.set(true);
 
    // Pre-fill the subject with the organization's default.
    await this.loadQuizEmailDefaults(organizationId, course.name, topic.name);
  } catch (error) {
    console.error('Unable to prepare quiz link:', error);
    this.toast.error('Unable to prepare the quiz link.');
  }
}
 
/**
 * Ask the server for the default subject and signature.
 *
 * The server prefixes the subject with the organization name,
 * e.g. "[Acme Academy] Practice quiz invitation: Biology 101".
 * Management can edit the subject before sending.
 */
private async loadQuizEmailDefaults(
  organizationId: string,
  courseName: string,
  topicName: string,
): Promise<void> {
  const fallbackSubject = `Practice quiz invitation: ${courseName}`;
 
  this.loadingQuizDefaults.set(true);
  this.quizEmailSubject.set('');
  this.quizEmailSignature.set('');
 
  try {
    await firebaseAuth.authStateReady();
 
    const getDefaults = httpsCallable<
      {
        organizationId: string;
        type: 'quiz_invitation';
        metadata: { courseName: string; quizTitle: string };
      },
      { subject: string; senderName: string; signature: string }
    >(firebaseFunctions, 'getCommunicationDefaults');
 
    const response = await getDefaults({
      organizationId,
      type: 'quiz_invitation',
      metadata: {
        courseName,
        quizTitle: topicName,
      },
    });
 
    this.quizEmailSubject.set(response.data.subject?.trim() || fallbackSubject);
    this.quizEmailSignature.set(response.data.signature?.trim() ?? '');
  } catch (error) {
    console.error('[Quiz Email] Unable to load default subject:', error);
    this.quizEmailSubject.set(fallbackSubject);
  } finally {
    this.loadingQuizDefaults.set(false);
  }
}
 
protected async copyPreparedQuizLink(): Promise<void> {
  const link = this.quizShareLink();
 
  if (!link) {
    this.toast.error('Generate a quiz link first.');
    return;
  }
 
  try {
    await navigator.clipboard.writeText(link);
    this.toast.success('Quiz link copied.');
  } catch (error) {
    console.error('Unable to copy quiz link:', error);
    window.prompt('Copy the quiz link:', link);
  }
}
 
protected closeQuizEmailForm(): void {
  this.showQuizEmailForm.set(false);
  this.quizRecipientEmail = '';
  this.quizShareLink.set('');
  this.quizEmailSubject.set('');
  this.quizEmailSignature.set('');
}
 
protected async sendQuizEmail(): Promise<void> {
  const organizationId = this.context.organizationId();
  const link = this.quizShareLink();
 
  const recipientEmails = this.parseRecipientEmails(
    this.quizRecipientEmail,
  );
 
  if (!organizationId) {
    this.toast.error('No organization is selected.');
    return;
  }
 
  if (!link) {
    this.toast.error('Generate the quiz link first.');
    return;
  }
 
  const subject = this.quizEmailSubject().replace(/\s+/g, ' ').trim();
 
  if (!subject) {
    this.toast.error('Enter a subject for the email.');
    return;
  }
 
  if (subject.length > 200) {
    this.toast.error('The subject must be 200 characters or fewer.');
    return;
  }
 
  if (recipientEmails.length === 0) {
    this.toast.error('Enter at least one recipient email address.');
    return;
  }
 
  const invalidEmails = recipientEmails.filter(
    (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  );
 
  if (invalidEmails.length > 0) {
    this.toast.error(
      this.i18n.t('Invalid email address: {0}', [invalidEmails[0]]),
    );
    return;
  }
 
  if (recipientEmails.length > 50) {
    this.toast.error('You can invite up to 50 members at a time.');
    return;
  }
 
  if (this.sendingQuizEmail()) {
    return;
  }
 
  this.sendingQuizEmail.set(true);
 
  try {
    const authenticated = await this.ensureAuthenticatedUser();
    if (!authenticated) {
      this.toast.error('Your sign-in session is not available. Please sign in again, then retry.');
      return;
    }
 
    /*
     * Resolve the requested email addresses against organization
     * membership records. Never trust an email address alone as
     * proof that someone belongs to the organization.
     */
    let members = this.organizationMembers();
 
    const requestedEmails = new Set(recipientEmails);
 
    const missingMembers = recipientEmails.some(
      (email) =>
        !members.some(
          (member) => member.email.toLowerCase() === email,
        ),
    );
 
    if (missingMembers) {
      const lookupRecipients = httpsCallable<
        { organizationId: string },
        {
          members?: Array<{
            userId?: string;
            uid?: string;
            email?: string;
            displayName?: string;
          }>;
        }
      >(firebaseFunctions, 'lookupCommunicationRecipients');
 
      const response = await lookupRecipients({ organizationId });
 
      members = (response.data.members ?? [])
        .filter(
          (member) =>
            Boolean(member.userId ?? member.uid) &&
            Boolean(member.email),
        )
        .map((member) => ({
          uid: member.userId ?? member.uid ?? '',
          email: member.email!.trim().toLowerCase(),
          displayName: member.displayName?.trim() || member.email!.trim(),
        }));
 
      this.organizationMembers.set(members);
    }
 
    const matchedMembers = members.filter((member) =>
      requestedEmails.has(member.email.toLowerCase()),
    );
 
    const matchedEmails = new Set(
      matchedMembers.map((member) => member.email.toLowerCase()),
    );
 
    const unmatchedEmails = recipientEmails.filter(
      (email) => !matchedEmails.has(email),
    );
 
    if (unmatchedEmails.length > 0) {
      this.toast.error(
        this.i18n.t('These addresses are not eligible organization members: {0}', [unmatchedEmails.join(', ')]),
      );
      return;
    }
 
    const recipientIds = [
      ...new Set(matchedMembers.map((member) => member.uid)),
    ].filter(Boolean);
 
    if (recipientIds.length === 0) {
      this.toast.error('Select at least one eligible organization member.');
      return;
    }
 
    const course = this.selectedCourse();
    const topic = this.selectedTopic();
 
    if (!course || !topic) {
      this.toast.error('Select a course and topic first.');
      return;
    }
 
    const sendCommunication = httpsCallable<
      {
        organizationId: string;
        type: 'quiz_invitation';
        subject: string;
        message: string;
        recipientIds: string[];
        metadata: {
          courseName: string;
          quizTitle: string;
        };
      },
      {
        success?: boolean;
        sent?: number;
        accepted?: number;
      }
    >(firebaseFunctions, 'sendOrganizationCommunication');
 
    const result = await sendCommunication({
      organizationId,
      type: 'quiz_invitation',
      // The subject the manager reviewed (and possibly edited).
      subject,
      message: [
        `You have been invited to take a practice quiz.`,
        '',
        `Course: ${course.name}`,
        `Topic: ${topic.name}`,
        '',
        'Open the quiz using the link below:',
        link,
        '',
        'Good luck!',
      ].join('\n'),
      recipientIds,
      metadata: {
        courseName: course.name,
        quizTitle: topic.name,
      },
    });
 
    // A successful callable response confirms the backend accepted the request.
    // The backend records per-recipient delivery outcomes separately.
    this.toast.success(
      this.i18n.t('Quiz invitation request submitted for {0} member(s). Check communication delivery status if a recipient does not receive it.', [recipientIds.length]),
    );
 
    this.closeQuizEmailForm();
  } catch (error) {
    console.error('Failed to send quiz invitations:', error);
 
    this.toast.error(
      'Unable to send quiz invitations. Please try again.',
    );
  } finally {
    this.sendingQuizEmail.set(false);
  }
}
 
protected filteredOrganizationMembers(): OrganizationEmailRecipient[] {
  const search = this.memberSearchTerm.trim().toLowerCase();
 
  if (!search) {
    return this.organizationMembers();
  }
 
  return this.organizationMembers().filter((member) =>
    member.email.toLowerCase().includes(search) ||
    (member.displayName ?? '').toLowerCase().includes(search),
  );
}
 
protected isMemberSelected(email: string): boolean {
  return this.selectedMemberEmails().includes(email.toLowerCase());
}
 
protected toggleMemberRecipient(
  email: string,
  selected: boolean,
): void {
  const normalizedEmail = email.trim().toLowerCase();
 
  if (selected) {
    this.selectedMemberEmails.update((emails) =>
      emails.includes(normalizedEmail)
        ? emails
        : [...emails, normalizedEmail],
    );
  } else {
    this.selectedMemberEmails.update((emails) =>
      emails.filter((item) => item !== normalizedEmail),
    );
  }
}
 
protected addSelectedMembers(): void {
  const existingEmails = this.parseRecipientEmails(
    this.quizRecipientEmail,
  );
 
  const combinedEmails = new Set([
    ...existingEmails,
    ...this.selectedMemberEmails(),
  ]);
 
  this.quizRecipientEmail = [...combinedEmails].join(', ');
 
  this.showMemberLookup.set(false);
 
  this.toast.success('Selected member emails added.');
}
 
private parseRecipientEmails(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[;,\n]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
 
/** Wait for Firebase to restore its initial session before invoking protected callables. */
private async ensureAuthenticatedUser(): Promise<boolean> {
  await firebaseAuth.authStateReady();
  return firebaseAuth.currentUser !== null;
}
 
protected async lookupOrganizationMembers(): Promise<void> {
  const organizationId = this.context.organizationId();
 
  if (!organizationId) {
    this.toast.error('No organization is selected.');
    return;
  }
 
  if (this.lookingUpMembers()) {
    return;
  }
 
  this.lookingUpMembers.set(true);
 
  try {
    // Wait for Firebase to finish restoring the authentication session.
    await firebaseAuth.authStateReady();
 
    const user = firebaseAuth.currentUser;
 
    // Diagnose missing authentication before calling the backend.
    console.info('[Member Lookup] Firebase configuration', {
      authenticated: !!user,
      authAppName: firebaseAuth.app.name,
      functionsAppName: firebaseFunctions.app.name,
      authProjectId: firebaseAuth.app.options.projectId,
      functionsProjectId: firebaseFunctions.app.options.projectId,
    });
 
    if (!user) {
      this.toast.error(
        'Your Firebase sign-in session is unavailable. Please sign in again.',
      );
      return;
    }
 
    // Refresh the ID token to rule out an expired authentication token.
    await user.getIdToken(true);
 
    const lookupRecipients = httpsCallable<
      { organizationId: string },
      {
        organizationId: string;
        members: Array<{
          userId: string;
          displayName?: string;
          email: string;
          role?: string;
        }>;
      }
    >(firebaseFunctions, 'lookupCommunicationRecipients');
 
    const response = await lookupRecipients({
      organizationId,
    });
 
    const members: OrganizationEmailRecipient[] =
      (response.data.members ?? [])
        .filter((member) => member.userId && member.email)
        .map((member) => ({
          uid: member.userId,
          email: member.email.trim().toLowerCase(),
          displayName:
            member.displayName?.trim() || member.email.trim(),
        }));
 
    this.organizationMembers.set(members);
    this.showMemberLookup.set(true);
 
    if (members.length === 0) {
      this.toast.error(
        'No eligible organization members with email addresses were found.',
      );
      return;
    }
 
    this.toast.success(`Loaded ${members.length} organization members.`);
  } catch (error) {
    console.error('[Member Lookup] Failed:', error);
 
    this.toast.error(
      error instanceof Error
        ? this.i18n.t('Member lookup failed: {0}', [error.message])
        : 'Unable to load organization members.',
    );
  } finally {
    this.lookingUpMembers.set(false);
  }
}
 
}
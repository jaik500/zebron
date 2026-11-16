import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { firebaseFunctions } from '../../../core/services/firebase-config';
import { Quiz } from '../models/quiz.model';

/** What deleting a quiz would touch (deleteTestCenterQuiz, action 'check'). */
interface QuizDeleteSummary {
  quizName: string;
  topics: number;
  questions: number;
  results: number;
  linkedOrganizations: number;
  courses: { courseId: string; title: string; status: string; organizationId: string | null }[];
  blocked: boolean;
}

/**
 * Confirm and delete a Test Center quiz (Zebron admin and organization
 * Test Center settings). The server deletes the quiz, its topics and its
 * questions; learner results are kept. Refused while a course uses the
 * quiz as its final exam.
 */
@Component({
  selector: 'app-quiz-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" (click)="cancel()">
      <section
        class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="quiz-delete-title"
        (click)="$event.stopPropagation()"
        (keydown.escape)="cancel()"
      >
        <h2 id="quiz-delete-title" class="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <mat-icon class="text-rose-600" aria-hidden="true">delete</mat-icon>
          {{ 'Delete this quiz?' | t }}
        </h2>
        <p class="mt-1 text-sm font-medium text-slate-800">{{ quiz().name }}</p>

        @if (loading()) {
          <p class="mt-4 text-sm text-slate-500">{{ 'Checking what uses this quiz…' | t }}</p>
        } @else if (summary(); as info) {
          @if (info.blocked) {
            <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              <p class="font-semibold">{{ 'This quiz is the final exam of these courses:' | t }}</p>
              <ul class="mt-1 list-disc pl-5">
                @for (course of info.courses; track course.courseId + (course.organizationId ?? '')) {
                  <li>{{ course.title }} <span class="text-xs">({{ course.status | t }})</span></li>
                }
              </ul>
              <p class="mt-2">{{ 'Choose another final exam for them in the course builder, then delete the quiz.' | t }}</p>
            </div>
          } @else {
            <ul class="mt-4 space-y-1 text-sm text-slate-700">
              <li>{{ '{0} topic(s) and {1} question(s) will be deleted.' | t: [info.topics, info.questions] }}</li>
              @if (info.results) {
                <li>{{ '{0} learner result(s) are kept, with the quiz name.' | t: [info.results] }}</li>
              }
              @if (info.linkedOrganizations) {
                <li>{{ 'It will be removed from {0} organization(s) that linked it.' | t: [info.linkedOrganizations] }}</li>
              }
            </ul>
            <p class="mt-3 text-sm font-semibold text-rose-700">{{ 'This cannot be undone. To hide it instead, make it inactive.' | t }}</p>
          }
        }

        @if (error()) {
          <p class="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700" role="alert">{{ error() | t }}</p>
        }

        <div class="mt-5 flex justify-end gap-2">
          <button type="button" (click)="cancel()" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Cancel' | t }}</button>
          @if (summary() && !summary()!.blocked) {
            <button
              type="button"
              (click)="confirm()"
              [disabled]="deleting()"
              class="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {{ (deleting() ? 'Deleting…' : 'Delete quiz') | t }}
            </button>
          }
        </div>
      </section>
    </div>
  `,
})
export class QuizDeleteDialogComponent implements OnInit {
  readonly quiz = input.required<Quiz>();
  /** true when the quiz was deleted. */
  readonly closed = output<boolean>();

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly summary = signal<QuizDeleteSummary | null>(null);
  protected readonly error = signal('');

  private readonly callable = httpsCallable<{ quizId: string; action: 'check' | 'delete' }, QuizDeleteSummary>(
    firebaseFunctions,
    'deleteTestCenterQuiz',
  );

  async ngOnInit(): Promise<void> {
    try {
      this.summary.set((await this.callable({ quizId: this.quiz().id, action: 'check' })).data);
    } catch (error) {
      this.error.set(messageOf(error, 'This quiz could not be checked. Try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async confirm(): Promise<void> {
    this.deleting.set(true);
    this.error.set('');
    try {
      await this.callable({ quizId: this.quiz().id, action: 'delete' });
      this.closed.emit(true);
    } catch (error) {
      this.error.set(messageOf(error, 'The quiz could not be deleted. Try again.'));
    } finally {
      this.deleting.set(false);
    }
  }

  protected cancel(): void {
    if (!this.deleting()) {
      this.closed.emit(false);
    }
  }
}

/** The server's explanation (blocked, not allowed, gone), otherwise a fallback. */
function messageOf(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as { message?: string })?.message ?? '';
  return /permission-denied|failed-precondition|not-found|invalid-argument/.test(code) && message ? message : fallback;
}

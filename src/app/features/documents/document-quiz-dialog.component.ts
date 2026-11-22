import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../core/services/firebase-config';
import { ConnectivityService } from '../../core/services/connectivity.service';
import { LoggerService } from '../../core/services/logger.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { QUIZ_TEXT_MIN } from './document-quiz-section';

/** What the reader passes in: the part being read. */
export interface DocumentQuizData {
  documentId: string;
  documentTitle: string;
  /** "Chapter 3", "Pages 4–8", "The whole document"… */
  section: string;
  text: string;
}

interface QuizQuestionView {
  id: string;
  question: string;
  options: string[];
  topic: string;
}

interface CreatedQuiz {
  quizId: string;
  questions: QuizQuestionView[];
}

interface GradedQuestion extends QuizQuestionView {
  answer: number;
  chosen: number | null;
  correct: boolean;
  explanation: string;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  questions: GradedQuestion[];
}

type Step = 'intro' | 'writing' | 'answering' | 'grading' | 'result' | 'error';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * "Quiz me on this chapter" (functions/src/document-quiz.ts): the learner
 * chooses 5 or 10 questions, the AI writes them from the part being read,
 * the learner answers and hands in; the server scores it and the result
 * appears on My learning with the other quizzes.
 */
@Component({
  selector: 'app-document-quiz-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="!flex items-start gap-2 !pb-1">
      <mat-icon class="mt-0.5 shrink-0 text-[#007979]" aria-hidden="true">quiz</mat-icon>
      <span class="min-w-0">
        <span class="block">{{ 'Quiz: {0}' | t: [data.section] }}</span>
        <span class="block truncate text-xs font-normal text-slate-500">{{ data.documentTitle }}</span>
      </span>
    </h2>

    <mat-dialog-content class="!pt-2">
      @switch (step()) {
        @case ('intro') {
          @if (tooShort) {
            <p class="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {{ "There isn't enough text here to make a quiz. Scanned pages and pictures have no text Zebron can read; try another chapter or page." | t }}
            </p>
          } @else {
            <p class="text-sm text-slate-700">{{ 'Check what you understood: Zebron writes multiple-choice questions from this part of your document.' | t }}</p>
            <fieldset class="mt-4">
              <legend class="text-sm font-semibold text-slate-900">{{ 'How many questions?' | t }}</legend>
              <div class="mt-2 flex gap-2">
                @for (option of [5, 10]; track option) {
                  <button
                    type="button"
                    class="h-10 rounded-full border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                    [style.background-color]="count() === option ? '#007979' : '#ffffff'"
                    [style.color]="count() === option ? '#ffffff' : '#00605f'"
                    [style.border-color]="count() === option ? '#007979' : '#cbd5e1'"
                    [attr.aria-pressed]="count() === option"
                    (click)="count.set(option)"
                  >
                    {{ '{0} questions' | t: [option] }}
                  </button>
                }
              </div>
            </fieldset>
            <p class="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <mat-icon class="!h-4 !w-4 shrink-0 !text-[16px]" aria-hidden="true">info</mat-icon>
              <span>{{ "The text of this part is sent to Zebron's AI service (Google Gemini) only to write the questions. AI can make mistakes: the explanations point back to your document." | t }}</span>
            </p>
          }
        }
        @case ('writing') {
          <div class="flex flex-col items-center gap-3 py-10 text-center" role="status">
            <span class="h-8 w-8 animate-spin rounded-full border-4 border-[#007979]/20 border-t-[#007979]" aria-hidden="true"></span>
            <p class="text-sm text-slate-700">{{ 'Writing {0} questions from {1}…' | t: [count(), data.section] }}</p>
            <p class="text-xs text-slate-500">{{ 'This takes about 10 to 30 seconds.' | t }}</p>
          </div>
        }
        @case ('error') {
          <p class="rounded-xl bg-rose-50 p-3 text-sm text-rose-900" role="alert">{{ error() | t }}</p>
        }
        @case ('result') {
          @if (result(); as graded) {
            <div class="rounded-2xl p-4 text-center" [style.background-color]="graded.scorePercentage >= 70 ? '#ecfdf5' : '#fffbeb'">
              <p class="text-3xl font-bold tabular-nums" [style.color]="graded.scorePercentage >= 70 ? '#047857' : '#b45309'">{{ graded.scorePercentage }}%</p>
              <p class="mt-1 text-sm text-slate-700">{{ '{0} of {1} right' | t: [graded.correctAnswers, graded.totalQuestions] }}</p>
              <p class="mt-1 text-xs text-slate-500">
                {{ (graded.scorePercentage >= 70 ? 'Well done. Your result is saved on My learning.' : 'Read the explanations below, then try new questions. Your result is saved on My learning.') | t }}
              </p>
            </div>
          }
        }
      }

      @if (step() === 'answering' || step() === 'grading' || step() === 'result') {
        <ol class="mt-3 flex flex-col gap-4">
          @for (question of shownQuestions(); track question.id; let index = $index) {
            <li>
              <fieldset [disabled]="step() !== 'answering'">
                <legend class="text-sm font-semibold text-slate-900">
                  <span class="mr-1 text-slate-500">{{ index + 1 }}.</span>{{ question.question }}
                </legend>
                <div class="mt-2 flex flex-col gap-1.5">
                  @for (option of question.options; track $index; let choice = $index) {
                    <button
                      type="button"
                      class="flex min-h-10 items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                      [style.background-color]="optionBackground(index, choice)"
                      [style.border-color]="optionBorder(index, choice)"
                      [attr.aria-pressed]="step() === 'answering' ? answers()[index] === choice : null"
                      (click)="choose(index, choice)"
                    >
                      <span class="w-4 shrink-0 font-semibold text-slate-500">{{ letters[choice] }}</span>
                      <span class="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{{ option }}</span>
                      @if (step() === 'result') {
                        @if (gradedAt(index)?.answer === choice) {
                          <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-emerald-600" [attr.aria-label]="'Right answer' | t">check_circle</mat-icon>
                        } @else if (gradedAt(index)?.chosen === choice) {
                          <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-rose-600" [attr.aria-label]="'Your answer' | t">cancel</mat-icon>
                        }
                      }
                    </button>
                  }
                </div>
                @if (step() === 'result' && gradedAt(index); as graded) {
                  <p class="mt-2 text-xs text-slate-600">
                    <span class="font-semibold" [style.color]="graded.correct ? '#047857' : '#be123c'">
                      {{ (graded.correct ? 'Right.' : graded.chosen === null ? 'Not answered.' : 'Not quite.') | t }}
                    </span>
                    {{ graded.explanation }}
                  </p>
                }
              </fieldset>
            </li>
          }
        </ol>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!flex-wrap !gap-2">
      @switch (step()) {
        @case ('intro') {
          <button type="button" class="zb-quiz-secondary" mat-dialog-close>{{ 'Cancel' | t }}</button>
          @if (!tooShort) {
            <button type="button" class="zb-quiz-primary" [disabled]="!connectivity.online()" (click)="create()">
              {{ (connectivity.online() ? 'Start the quiz' : 'Needs a connection') | t }}
            </button>
          }
        }
        @case ('writing') {
          <button type="button" class="zb-quiz-secondary" mat-dialog-close>{{ 'Cancel' | t }}</button>
        }
        @case ('error') {
          <button type="button" class="zb-quiz-secondary" mat-dialog-close>{{ 'Close' | t }}</button>
          <button type="button" class="zb-quiz-primary" [disabled]="!connectivity.online()" (click)="retry()">{{ 'Try again' | t }}</button>
        }
        @case ('answering') {
          <span class="mr-auto text-xs text-slate-500">{{ '{0} of {1} answered' | t: [answeredCount(), questions().length] }}</span>
          <button type="button" class="zb-quiz-primary" [disabled]="!answeredCount() || !connectivity.online()" (click)="handIn()">
            {{ (answeredCount() < questions().length ? 'Hand in ({0} unanswered)' : 'Hand in') | t: [questions().length - answeredCount()] }}
          </button>
        }
        @case ('grading') {
          <span class="text-sm text-slate-600" role="status">{{ 'Checking your answers…' | t }}</span>
        }
        @case ('result') {
          <button type="button" class="zb-quiz-secondary" (click)="openMyLearning()">{{ 'My learning' | t }}</button>
          <button type="button" class="zb-quiz-secondary" [disabled]="!connectivity.online()" (click)="newQuestions()">{{ 'New questions' | t }}</button>
          <button type="button" class="zb-quiz-primary" mat-dialog-close>{{ 'Back to reading' | t }}</button>
        }
      }
    </mat-dialog-actions>
  `,
  styles: `
    .zb-quiz-primary,
    .zb-quiz-secondary {
      display: inline-flex;
      height: 2.5rem;
      align-items: center;
      border-radius: 9999px;
      padding: 0 1rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .zb-quiz-primary {
      background: #007979;
      color: #fff;
    }
    .zb-quiz-primary:disabled {
      opacity: 0.5;
    }
    .zb-quiz-secondary {
      border: 1px solid #cbd5e1;
      color: #00605f;
      background: #fff;
    }
    .zb-quiz-secondary:disabled {
      opacity: 0.5;
    }
    .zb-quiz-primary:focus-visible,
    .zb-quiz-secondary:focus-visible {
      outline: 2px solid #007979;
      outline-offset: 2px;
    }
  `,
})
export class DocumentQuizDialogComponent {
  protected readonly data = inject<DocumentQuizData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DocumentQuizDialogComponent>);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  protected readonly connectivity = inject(ConnectivityService);

  private readonly createCallable = httpsCallable<
    { documentId: string; section: string; text: string; count: number },
    CreatedQuiz
  >(firebaseFunctions, 'createDocumentQuiz', { timeout: 120_000 });
  private readonly gradeCallable = httpsCallable<{ quizId: string; answers: (number | null)[] }, QuizResult>(
    firebaseFunctions,
    'gradeDocumentQuiz',
  );

  protected readonly letters = LETTERS;
  protected readonly tooShort = this.data.text.trim().length < QUIZ_TEXT_MIN;
  protected readonly step = signal<Step>('intro');
  protected readonly count = signal(5);
  protected readonly error = signal('');
  private readonly quizId = signal('');
  protected readonly questions = signal<QuizQuestionView[]>([]);
  protected readonly answers = signal<(number | null)[]>([]);
  protected readonly result = signal<QuizResult | null>(null);
  /** What failed last, for Try again. */
  private failed: 'create' | 'grade' = 'create';
  /** Ignore a reply that arrives after Cancel or a newer request. */
  private request = 0;

  protected readonly answeredCount = computed(() => this.answers().filter((answer) => answer !== null).length);
  protected readonly shownQuestions = computed<QuizQuestionView[]>(() => this.result()?.questions ?? this.questions());

  constructor() {
    this.dialogRef.afterClosed().subscribe(() => (this.request += 1));
  }

  protected async create(): Promise<void> {
    const request = ++this.request;
    this.failed = 'create';
    this.step.set('writing');
    this.result.set(null);
    try {
      const { data } = await this.createCallable({
        documentId: this.data.documentId,
        section: this.data.section,
        text: this.data.text,
        count: this.count(),
      });
      if (request !== this.request) return;
      this.quizId.set(data.quizId);
      this.questions.set(data.questions);
      this.answers.set(data.questions.map(() => null));
      this.step.set('answering');
    } catch (error) {
      if (request !== this.request) return;
      this.logger.error('DocumentQuiz', 'Could not make the quiz.', error);
      this.showError(error, 'The quiz could not be made right now. Try again in a minute.');
    }
  }

  protected choose(index: number, choice: number): void {
    if (this.step() !== 'answering') return;
    this.answers.update((answers) => answers.map((answer, position) => (position === index ? choice : answer)));
  }

  protected async handIn(): Promise<void> {
    const request = ++this.request;
    this.failed = 'grade';
    this.step.set('grading');
    try {
      const { data } = await this.gradeCallable({ quizId: this.quizId(), answers: this.answers() });
      if (request !== this.request) return;
      this.result.set(data);
      this.step.set('result');
    } catch (error) {
      if (request !== this.request) return;
      this.logger.error('DocumentQuiz', 'Could not grade the quiz.', error);
      this.showError(error, 'Your answers could not be checked. Check your connection and try again.');
    }
  }

  protected retry(): void {
    if (this.failed === 'grade' && this.quizId()) void this.handIn();
    else void this.create();
  }

  protected newQuestions(): void {
    this.quizId.set('');
    this.questions.set([]);
    this.answers.set([]);
    void this.create();
  }

  protected openMyLearning(): void {
    this.dialogRef.close();
    void this.router.navigateByUrl('/courses');
  }

  protected gradedAt(index: number): GradedQuestion | null {
    return this.result()?.questions[index] ?? null;
  }

  protected optionBackground(index: number, choice: number): string {
    if (this.step() === 'result') {
      const graded = this.gradedAt(index);
      if (graded?.answer === choice) return '#ecfdf5';
      if (graded?.chosen === choice) return '#fff1f2';
      return '#ffffff';
    }
    return this.answers()[index] === choice ? '#e6f4f4' : '#ffffff';
  }

  protected optionBorder(index: number, choice: number): string {
    if (this.step() === 'result') {
      const graded = this.gradedAt(index);
      if (graded?.answer === choice) return '#10b981';
      if (graded?.chosen === choice) return '#f43f5e';
      return '#e2e8f0';
    }
    return this.answers()[index] === choice ? '#007979' : '#e2e8f0';
  }

  /** The server's message when it is one meant for people (limits, not enough text), otherwise `fallback`. */
  private showError(error: unknown, fallback: string): void {
    const code = (error as { code?: string })?.code ?? '';
    const message = error instanceof Error ? error.message.replace(/^FirebaseError:\s*/, '') : '';
    const readable = ['functions/resource-exhausted', 'functions/invalid-argument', 'functions/not-found', 'functions/failed-precondition', 'functions/internal', 'functions/permission-denied'];
    this.error.set(readable.includes(code) && message && message !== 'internal' ? message : fallback);
    this.step.set('error');
  }
}

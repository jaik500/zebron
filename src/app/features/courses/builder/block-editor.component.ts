import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { CodeRunnerService } from '../../coding-lab/code-runner.service';
import { CODE_LANGUAGES, CodeLanguage, TestResult } from '../../coding-lab/code-lab.model';
import { LessonMediaComponent } from '../components/lesson-media.component';
import { MarkdownFieldComponent } from './markdown-field.component';
import { formatStartTime, LessonBlock, LessonCodeBlock, MEDIA_PROVIDERS, parseStartTime, resolveMedia } from '../course.model';

export const BLOCK_META: Record<LessonBlock['type'], { label: string; icon: string }> = {
  text: { label: 'Text', icon: 'notes' },
  video: { label: 'Video', icon: 'smart_display' },
  audio: { label: 'Audio', icon: 'headphones' },
  document: { label: 'PDF or slides', icon: 'slideshow' },
  image: { label: 'Image', icon: 'image' },
  tip: { label: 'Tip', icon: 'lightbulb' },
  check: { label: 'Quick check', icon: 'quiz' },
  code: { label: 'Coding exercise', icon: 'terminal' },
};

const MAX_OPTIONS = 6;
const MAX_QUESTIONS = 20;

/** Edit one lesson block. Every change is emitted as a whole new block. */
@Component({
  selector: 'app-block-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule, TranslatePipe, LessonMediaComponent, MarkdownFieldComponent],
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-4 focus-within:border-[#007979] focus-within:ring-2 focus-within:ring-teal-100">
      <header class="mb-3 flex items-center gap-2">
        <mat-icon class="text-[#007979]" aria-hidden="true">{{ meta().icon }}</mat-icon>
        <h3 class="min-w-0 flex-1 break-words text-sm font-bold text-slate-600">{{ meta().label | t }}</h3>
        <button type="button" class="icon-btn" [disabled]="index() === 0" (click)="blockMove.emit(-1)" [attr.aria-label]="'Move up' | t" [matTooltip]="'Move up' | t">
          <mat-icon>arrow_upward</mat-icon>
        </button>
        <button type="button" class="icon-btn" [disabled]="index() === count() - 1" (click)="blockMove.emit(1)" [attr.aria-label]="'Move down' | t" [matTooltip]="'Move down' | t">
          <mat-icon>arrow_downward</mat-icon>
        </button>
        <button type="button" class="icon-btn hover:!text-rose-600" (click)="blockRemove.emit()" [attr.aria-label]="'Delete block' | t" [matTooltip]="'Delete block' | t">
          <mat-icon>delete</mat-icon>
        </button>
      </header>

      @switch (block().type) {
        @case ('text') {
          <app-markdown-field label="Text" [rows]="8" [value]="textOf()" placeholder="Write the lesson text here." (valueChange)="set({ text: $event })" />
        }
        @case ('tip') {
          <app-markdown-field label="Tip" [rows]="3" [compact]="true" [value]="textOf()" placeholder="A key takeaway or a helpful tip." (valueChange)="set({ text: $event })" />
        }
        @case ('check') {
          <div class="flex flex-col gap-5">
            @for (question of check().questions; track $index; let questionIndex = $index) {
              <fieldset class="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:p-4">
                <div class="flex items-center justify-between gap-3">
                  <legend class="text-sm font-bold text-slate-700">{{ 'Question {0}' | t: [questionIndex + 1] }}</legend>
                  <button
                    type="button"
                    class="icon-btn hover:!text-rose-600"
                    [disabled]="check().questions.length <= 1"
                    (click)="removeQuestion(questionIndex)"
                    [attr.aria-label]="'Remove question' | t"
                    [matTooltip]="'Remove question' | t"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Question' | t }}</mat-label>
                  <textarea matInput rows="2" [value]="question.question" (input)="setQuestion(questionIndex, { question: value($event) })"></textarea>
                </mat-form-field>

                <fieldset class="flex flex-col gap-2">
                  <legend class="mb-1 text-xs font-semibold text-slate-500">{{ 'Answers: mark the right one' | t }}</legend>
                  @for (option of question.options; track $index; let optionIndex = $index) {
                    <div class="flex items-center gap-2">
                      <input
                        type="radio"
                        class="h-4 w-4 shrink-0 accent-[#007979]"
                        [name]="'answer-' + uid + '-' + questionIndex"
                        [checked]="question.answer === optionIndex"
                        (change)="setQuestion(questionIndex, { answer: optionIndex })"
                        [attr.aria-label]="'Right answer' | t"
                      />
                      <input
                        class="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm"
                        [ngClass]="question.answer === optionIndex ? 'border-[#007979] bg-teal-50' : 'border-slate-200 bg-white'"
                        [value]="option"
                        [placeholder]="'Answer {0}' | t: [optionIndex + 1]"
                        (input)="setQuestionOption(questionIndex, optionIndex, value($event))"
                      />
                      <button
                        type="button"
                        class="icon-btn"
                        [disabled]="question.options.length <= 2"
                        (click)="removeOption(questionIndex, optionIndex)"
                        [attr.aria-label]="'Remove answer' | t"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                  @if (question.options.length < maxOptions) {
                    <button type="button" class="self-start text-sm font-semibold text-[#007979] hover:underline" (click)="addOption(questionIndex)">
                      + {{ 'Add an answer' | t }}
                    </button>
                  }
                </fieldset>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Why it is right (shown after a correct answer)' | t }}</mat-label>
                  <input matInput [value]="question.explanation ?? ''" (input)="setQuestion(questionIndex, { explanation: value($event) })" />
                </mat-form-field>
              </fieldset>
            }

            @if (check().questions.length < maxQuestions) {
              <button
                type="button"
                class="self-start inline-flex items-center gap-2 rounded-lg border border-[#007979]/30 px-3 py-2 text-sm font-semibold text-[#007979] hover:bg-teal-50"
                (click)="addQuestion()"
              >
                <mat-icon class="!h-5 !w-5 !text-xl !leading-none">add</mat-icon>
                {{ 'Add another question' | t }}
              </button>
            }
          </div>
        }
        @case ('code') {
          <div class="flex flex-col gap-3">
            <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
              <mat-label>{{ 'Exercise title' | t }}</mat-label>
              <input matInput maxlength="120" [value]="code().title" (input)="set({ title: value($event) })" />
            </mat-form-field>
            <app-markdown-field label="Instructions" [rows]="3" [compact]="true" [value]="code().instructions" placeholder="What should learners do?" (valueChange)="set({ instructions: $event })" />
            <div class="-mt-1 flex flex-wrap items-center gap-2" role="group" [attr.aria-label]="'Language' | t">
              <span class="text-xs font-semibold text-slate-600">{{ 'Language' | t }}</span>
              @for (language of codeLanguages; track language.value) {
                <button type="button" (click)="setLanguage(language.value)" [attr.aria-pressed]="code().language === language.value" class="h-8 rounded-lg border px-3 text-sm font-semibold" [ngClass]="code().language === language.value ? 'border-[#007979] bg-teal-50 text-[#007979]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">{{ language.label }}</button>
              }
              <span class="text-xs text-slate-500">{{ 'Learners run it in their browser; it can\\u0027t reach the web page or other websites.' | t }}</span>
            </div>

            <label class="flex flex-col gap-1">
              <span class="text-xs font-semibold text-slate-600">{{ 'Starting code (what learners see first)' | t }}</span>
              <textarea class="code-input" rows="8" spellcheck="false" [value]="code().starter" (input)="set({ starter: value($event) })"></textarea>
            </label>

            <fieldset class="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
              <legend class="px-1 text-sm font-bold text-slate-700">{{ 'Checks' | t }}</legend>
              @if (code().language === 'python') {
                <p class="text-xs text-slate-500">{{ 'Each check is Python run after the learner\\u0027s code, with access to its functions and variables. It fails when it raises: use assert condition, "message". __output() returns what the code printed.' | t }}</p>
              } @else {
                <p class="text-xs text-slate-500">{{ 'Each check runs after the learner\\u0027s code and fails by throwing. Use assert(condition, message), assertEqual(actual, expected) and __output() (what the code printed).' | t }}</p>
              }
              @for (test of code().tests; track $index; let testIndex = $index) {
                <div class="flex flex-col gap-1.5 rounded-lg bg-slate-50 p-2">
                  <div class="flex items-center gap-2">
                    <input class="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm" [value]="test.name" [placeholder]="'What it checks, e.g. sum([1, 2]) returns 3' | t" (input)="setTest(testIndex, { name: value($event) })" [attr.aria-label]="'Check description' | t" />
                    <button type="button" class="icon-btn hover:!text-rose-600" (click)="removeTest(testIndex)" [attr.aria-label]="'Remove check' | t" [matTooltip]="'Remove check' | t"><mat-icon>delete</mat-icon></button>
                  </div>
                  <textarea class="code-input" rows="2" spellcheck="false" [value]="test.code" [placeholder]="code().language === 'python' ? 'assert total([1, 2]) == 3' : 'assertEqual(sum([1, 2]), 3);'" (input)="setTest(testIndex, { code: value($event) })" [attr.aria-label]="'Check code' | t"></textarea>
                  @if (testResults()[testIndex]; as result) {
                    <p class="text-xs font-semibold" [class]="result.passed ? 'text-emerald-700' : 'text-rose-700'">
                      {{ (result.passed ? 'The solution passes this check.' : 'The solution fails this check:') | t }} {{ result.passed ? '' : result.message }}
                    </p>
                  }
                </div>
              }
              <button type="button" class="self-start text-sm font-semibold text-[#007979] hover:underline" (click)="addTest()">+ {{ 'Add a check' | t }}</button>
            </fieldset>

            <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
              <mat-label>{{ 'Hints (one per line, shown one at a time)' | t }}</mat-label>
              <textarea matInput rows="3" [value]="hintsText()" (input)="setHints(value($event))"></textarea>
            </mat-form-field>

            <label class="flex flex-col gap-1">
              <span class="text-xs font-semibold text-slate-600">{{ 'Solution (optional; learners can see it after trying)' | t }}</span>
              <textarea class="code-input" rows="6" spellcheck="false" [value]="code().solution" (input)="set({ solution: value($event) })"></textarea>
            </label>

            @if (code().tests.length) {
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" (click)="testSolution()" [disabled]="testing() || !code().solution.trim()" class="inline-flex h-9 items-center gap-1 rounded-lg border border-[#007979] px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50 disabled:opacity-50">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">fact_check</mat-icon>
                  {{ (testing() ? 'Running…' : 'Run the checks on the solution') | t }}
                </button>
                @if (!code().solution.trim()) {
                  <span class="text-xs text-slate-500">{{ 'Add a solution to test your checks.' | t }}</span>
                }
                @if (testError()) {
                  <span class="text-xs text-rose-700">{{ testError() }}</span>
                }
              </div>
            }
          </div>
        }
        @default {
          <!-- Video, audio, PDF or slides, image -->
          <div class="flex flex-col gap-3">
            <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
              <mat-label>{{ urlLabel() | t }}</mat-label>
              <mat-icon matPrefix aria-hidden="true">link</mat-icon>
              <input matInput type="url" autocomplete="off" [value]="urlOf()" (input)="set({ url: value($event) })" placeholder="https://" />
            </mat-form-field>

            @if (mediaKind(); as kind) {
              <p
                class="flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
                [ngClass]="detection().tone === 'ok' ? 'bg-teal-50 text-[#00605f]' : detection().tone === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'"
                role="status"
              >
                <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px]" aria-hidden="true">{{ detection().icon }}</mat-icon>
                <span>{{ detection().text | t: [detection().provider] }}</span>
              </p>
              <div class="flex flex-wrap gap-1" [attr.aria-label]="'Sites that play inside the lesson' | t">
                @for (provider of providers()[kind]; track provider) {
                  <span
                    class="rounded-full border px-2 py-0.5 text-[11px]"
                    [ngClass]="provider === detection().provider ? 'border-[#007979] bg-teal-50 font-bold text-[#007979]' : 'border-slate-200 text-slate-500'"
                  >
                    {{ provider | t }}
                  </span>
                }
              </div>

              <app-lesson-media [kind]="kind" [url]="urlOf()" [start]="startOf()" [label]="titleOf()" [showEmpty]="true" />
            } @else if (urlOf().startsWith('https://')) {
              <img [src]="urlOf()" [alt]="altOf()" class="max-h-72 rounded-xl border border-slate-200 object-contain" />
            }

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              @if (block().type === 'video') {
                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Start at (optional)' | t }}</mat-label>
                  <input
                    matInput
                    inputmode="numeric"
                    placeholder="0:00"
                    [value]="startText()"
                    (change)="set({ start: parseStart(value($event)) })"
                  />
                </mat-form-field>
              }
              @if (block().type === 'document') {
                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Title (optional)' | t }}</mat-label>
                  <input matInput [value]="titleOf()" (input)="set({ title: value($event) })" />
                </mat-form-field>
              }
              @if (block().type === 'image') {
                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Describe the image (for screen readers)' | t }}</mat-label>
                  <input matInput [value]="altOf()" (input)="set({ alt: value($event) })" />
                </mat-form-field>
              }
              <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                <mat-label>{{ 'Caption (optional)' | t }}</mat-label>
                <input matInput [value]="captionOf()" (input)="set({ caption: value($event) })" />
              </mat-form-field>
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .icon-btn {
        display: inline-flex;
        height: 2rem;
        width: 2rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        color: #64748b;
      }
      .icon-btn:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
      }
      .code-input {
        width: 100%;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        background: #0b1f2a;
        color: #f1f5f9;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.8125rem;
        line-height: 1.55;
        padding: 0.5rem 0.75rem;
        tab-size: 2;
        white-space: pre;
        overflow-x: auto;
      }
      .code-input:focus {
        outline: 2px solid #14b8a6;
        outline-offset: 1px;
      }
      .icon-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    `,
  ],
})
export class BlockEditorComponent {
  readonly block = input.required<LessonBlock>();
  readonly index = input(0);
  readonly count = input(1);

  // Not named "change": native change events from the inputs inside would
  // bubble up to the host and reach that listener as DOM events.
  readonly blockChange = output<LessonBlock>();
  readonly blockMove = output<number>();
  readonly blockRemove = output<void>();

  protected readonly uid = Math.random().toString(36).slice(2, 9);
  protected readonly maxOptions = MAX_OPTIONS;
  protected readonly maxQuestions = MAX_QUESTIONS;
  protected readonly providers = computed(() => MEDIA_PROVIDERS);

  protected readonly meta = computed(() => BLOCK_META[this.block()?.type] ?? BLOCK_META.text);

  // ---------- Coding exercise ----------
  private readonly runner = inject(CodeRunnerService);
  protected readonly testing = signal(false);
  protected readonly testResults = signal<TestResult[]>([]);
  protected readonly testError = signal('');
  protected readonly codeLanguages = CODE_LANGUAGES;

  /** Switch language; untouched starting code switches to the new language's. */
  protected setLanguage(language: CodeLanguage): void {
    const block = this.code();
    const untouched = CODE_LANGUAGES.some((item) => item.starter.trim() === block.starter.trim()) || !block.starter.trim();
    const starter = untouched ? CODE_LANGUAGES.find((item) => item.value === language)?.starter ?? '' : block.starter;
    this.testResults.set([]);
    this.set({ language, starter });
  }

  protected readonly code = computed<LessonCodeBlock>(() => {
    const block = this.block();
    return block.type === 'code'
      ? block
      : { type: 'code', id: '', language: 'javascript', title: '', instructions: '', starter: '', tests: [], hints: [], solution: '' };
  });

  protected hintsText(): string {
    return this.code().hints.join('\n');
  }

  protected setHints(text: string): void {
    this.set({ hints: text.split('\n') });
  }

  protected setTest(index: number, changes: Partial<{ name: string; code: string }>): void {
    this.testResults.set([]);
    this.set({ tests: this.code().tests.map((test, position) => (position === index ? { ...test, ...changes } : test)) });
  }

  protected addTest(): void {
    this.set({ tests: [...this.code().tests, { name: '', code: '' }] });
  }

  protected removeTest(index: number): void {
    this.testResults.set([]);
    this.set({ tests: this.code().tests.filter((_, position) => position !== index) });
  }

  /** Run the checks against the solution, so authors know they work. */
  protected async testSolution(): Promise<void> {
    const block = this.code();
    this.testing.set(true);
    this.testError.set('');
    const result = await this.runner.run(block.language, block.solution, { tests: block.tests });
    this.testing.set(false);
    this.testResults.set(result.tests);
    this.testError.set(result.error ? result.error.split('\n')[0] : '');
  }

  protected readonly mediaKind = computed(() => {
    const type = this.block().type;
    return type === 'video' || type === 'audio' || type === 'document' ? type : null;
  });

  /** Normalize legacy single-question blocks for the multi-question editor. */
  protected readonly check = computed(() => {
    const block = this.block();
    if (block.type !== 'check') {
      return { questions: [{ question: '', options: ['', ''], answer: 0, explanation: '' }] };
    }
    if ('questions' in block && block.questions) {
      return { questions: block.questions };
    }
    return {
      questions: [{
        question: block.question ?? '',
        options: block.options ?? ['', ''],
        answer: block.answer ?? 0,
        explanation: block.explanation ?? '',
      }],
    };
  });

  protected readonly textOf = computed(() => {
    const block = this.block();
    return block.type === 'text' || block.type === 'tip' ? block.text : '';
  });

  protected readonly urlOf = computed(() => {
    const block = this.block();
    return 'url' in block ? block.url : '';
  });

  protected readonly captionOf = computed(() => {
    const block = this.block();
    return 'caption' in block ? block.caption ?? '' : '';
  });

  protected readonly titleOf = computed(() => {
    const block = this.block();
    return block.type === 'document' ? block.title ?? '' : '';
  });

  protected readonly altOf = computed(() => {
    const block = this.block();
    return block.type === 'image' ? block.alt : '';
  });

  protected readonly startOf = computed(() => {
    const block = this.block();
    return block.type === 'video' ? block.start ?? 0 : 0;
  });

  protected readonly startText = computed(() => formatStartTime(this.startOf()));

  protected readonly urlLabel = computed(() => {
    switch (this.block().type) {
      case 'video':
        return 'Video link';
      case 'audio':
        return 'Audio link';
      case 'document':
        return 'Link to the PDF or slides';
      default:
        return 'Image link';
    }
  });

  /** What the pasted link will become, in words. */
  protected readonly detection = computed(() => {
    const kind = this.mediaKind();
    const url = this.urlOf().trim();

    if (!kind || !url) {
      return { tone: 'info', icon: 'info', text: 'Paste a link from one of the sites below.', provider: '' };
    }

    const media = resolveMedia(url, kind, this.startOf());

    if (!media) {
      return { tone: 'warn', icon: 'error', text: 'Use a link that starts with https://', provider: '' };
    }

    if (media.mode === 'link') {
      return { tone: 'warn', icon: 'open_in_new', text: '{0} cannot play inside the lesson. Learners will get a button that opens it.', provider: media.provider };
    }

    return { tone: 'ok', icon: 'check_circle', text: '{0} found. It will play inside the lesson.', provider: media.provider };
  });

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected parseStart(value: string): number {
    return parseStartTime(value);
  }

  /** Merge changes into the block (fields that do not apply are ignored). */
  protected set(changes: Record<string, unknown>): void {
    this.blockChange.emit({ ...this.block(), ...changes } as LessonBlock);
  }

  private emitQuestions(questions: { question: string; options: string[]; answer: number; explanation?: string }[]): void {
    this.blockChange.emit({ type: 'check', questions } as LessonBlock);
  }

  protected setQuestion(index: number, changes: Partial<{ question: string; answer: number; explanation: string }>): void {
    const questions = this.check().questions.map((question, position) =>
      position === index ? { ...question, ...changes } : question,
    );
    this.emitQuestions(questions);
  }

  protected setQuestionOption(questionIndex: number, optionIndex: number, text: string): void {
    const questions = this.check().questions.map((question, position) =>
      position === questionIndex
        ? { ...question, options: question.options.map((option, index) => index === optionIndex ? text : option) }
        : question,
    );
    this.emitQuestions(questions);
  }

  protected addOption(questionIndex: number): void {
    const questions = this.check().questions.map((question, position) =>
      position === questionIndex && question.options.length < MAX_OPTIONS
        ? { ...question, options: [...question.options, ''] }
        : question,
    );
    this.emitQuestions(questions);
  }

  protected removeOption(questionIndex: number, optionIndex: number): void {
    const questions = this.check().questions.map((question, position) => {
      if (position !== questionIndex || question.options.length <= 2) return question;
      const options = question.options.filter((_, index) => index !== optionIndex);
      const answer = question.answer === optionIndex ? 0 : question.answer > optionIndex ? question.answer - 1 : question.answer;
      return { ...question, options, answer };
    });
    this.emitQuestions(questions);
  }

  protected addQuestion(): void {
    const questions = this.check().questions;
    if (questions.length < MAX_QUESTIONS) {
      this.emitQuestions([...questions, { question: '', options: ['', ''], answer: 0, explanation: '' }]);
    }
  }

  protected removeQuestion(index: number): void {
    const questions = this.check().questions;
    if (questions.length > 1) {
      this.emitQuestions(questions.filter((_, position) => position !== index));
    }
  }
}

import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { AnswerForm, nextOptionId } from '../models/question-answers';

/**
 * The answers part of a question form, for every answer type. Shared by
 * the Zebron and organization question editors. It edits the form object
 * it is given in place (template-driven forms), so the parent keeps one
 * form object and saves it with answerPayload().
 */
@Component({
  selector: 'app-question-answer-editor',
  standalone: true,
  imports: [NgClass, FormsModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  template: `
    @switch (form().type) {
      @case ('short-text') {
        <p class="mb-2 text-xs text-slate-500">
          {{ 'Learners type their answer. Capitals, accents, extra spaces and a final full stop are ignored.' | t }}
        </p>
        <div class="flex flex-col gap-2">
          @for (answer of form().acceptedAnswers ?? []; track $index; let i = $index) {
            <div class="flex items-center gap-2">
              <mat-form-field appearance="outline" class="zb-field zb-field--flush flex-1" subscriptSizing="dynamic">
                <mat-label>{{ (i === 0 ? 'Accepted answer' : 'Also accept') | t }}</mat-label>
                <input matInput [ngModel]="answer" (ngModelChange)="setAccepted(i, $event)" [ngModelOptions]="{ standalone: true }" />
              </mat-form-field>
              @if ((form().acceptedAnswers ?? []).length > 1) {
                <button type="button" class="answer-icon-btn" (click)="removeAccepted(i)" [attr.aria-label]="'Remove' | t">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }
        </div>
        <button type="button" class="mt-2 text-sm font-semibold text-[#007979] hover:underline" (click)="addAccepted()">
          + {{ 'Add another accepted answer' | t }}
        </button>
      }

      @case ('numeric') {
        <p class="mb-2 text-xs text-slate-500">{{ 'Learners type a number. Answers within the margin are accepted.' | t }}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Correct number' | t }}</mat-label>
            <input matInput type="number" step="any" [(ngModel)]="form().numericAnswer" [ngModelOptions]="{ standalone: true }" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Allowed margin (±)' | t }}</mat-label>
            <input matInput type="number" min="0" step="any" [(ngModel)]="form().numericTolerance" [ngModelOptions]="{ standalone: true }" />
          </mat-form-field>
        </div>
      }

      @default {
        <p class="mb-2 text-xs text-slate-500">{{ optionsHint() | t }}</p>
        <div class="flex flex-col gap-2">
          @for (option of form().options; track option.id; let i = $index; let first = $first; let last = $last) {
            <div
              class="flex items-center gap-2 rounded-lg border p-2"
              [ngClass]="isMarkedRight(option.id) ? 'border-emerald-400' : 'border-slate-200'"
            >
              @if (form().type === 'ordering') {
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{{ i + 1 }}</span>
              } @else {
                <button
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center border-2 transition"
                  [ngClass]="[
                    form().type === 'multiple-select' ? 'rounded-md' : 'rounded-full',
                    isMarkedRight(option.id) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'
                  ]"
                  [attr.aria-pressed]="isMarkedRight(option.id)"
                  [attr.aria-label]="'Mark as a right answer' | t"
                  (click)="markRight(option.id)"
                >
                  <mat-icon class="!h-4 !w-4 !text-base">check</mat-icon>
                </button>
              }

              <mat-form-field appearance="outline" class="zb-field zb-field--flush flex-1" subscriptSizing="dynamic">
                <mat-label>{{ (form().type === 'ordering' ? 'Step {0}' : 'Answer {0}') | t: [i + 1] }}</mat-label>
                <input
                  matInput
                  [(ngModel)]="option.text"
                  [ngModelOptions]="{ standalone: true }"
                  [readonly]="form().type === 'true-false'"
                />
              </mat-form-field>

              @if (form().type === 'ordering') {
                <button type="button" class="answer-icon-btn" [disabled]="first" (click)="move(i, -1)" [attr.aria-label]="'Move up' | t">
                  <mat-icon>arrow_upward</mat-icon>
                </button>
                <button type="button" class="answer-icon-btn" [disabled]="last" (click)="move(i, 1)" [attr.aria-label]="'Move down' | t">
                  <mat-icon>arrow_downward</mat-icon>
                </button>
              }
              @if (form().type !== 'true-false' && form().options.length > 2) {
                <button type="button" class="answer-icon-btn hover:!text-rose-600" (click)="removeOption(i)" [attr.aria-label]="'Remove' | t">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }
        </div>
        @if (form().type !== 'true-false' && form().options.length < 10) {
          <button type="button" class="mt-2 text-sm font-semibold text-[#007979] hover:underline" (click)="addOption()">
            + {{ (form().type === 'ordering' ? 'Add a step' : 'Add an answer') | t }}
          </button>
        }
      }
    }
  `,
  styles: [
    `
      .answer-icon-btn { display: inline-flex; height: 2rem; width: 2rem; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 0.5rem; color: #64748b; }
      .answer-icon-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }
      .answer-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    `,
  ],
})
export class QuestionAnswerEditorComponent {
  readonly form = input.required<AnswerForm>();

  protected optionsHint(): string {
    switch (this.form().type) {
      case 'multiple-select':
        return 'Tick every right answer. Learners must choose exactly these.';
      case 'ordering':
        return 'Write the steps in the right order. Learners see them shuffled.';
      case 'true-false':
        return 'Tick the right answer.';
      default:
        return 'Tick the one right answer.';
    }
  }

  protected isMarkedRight(optionId: string): boolean {
    const form = this.form();
    return form.type === 'multiple-select' ? (form.correctAnswers ?? []).includes(optionId) : form.type !== 'ordering' && form.correctAnswer === optionId;
  }

  protected markRight(optionId: string): void {
    const form = this.form();
    if (form.type === 'multiple-select') {
      const set = new Set(form.correctAnswers ?? []);
      if (set.has(optionId)) {
        set.delete(optionId);
      } else {
        set.add(optionId);
      }
      form.correctAnswers = [...set];
    } else {
      form.correctAnswer = optionId;
    }
  }

  protected addOption(): void {
    const form = this.form();
    form.options = [...form.options, { id: nextOptionId(form.options), text: '' }];
  }

  protected removeOption(index: number): void {
    const form = this.form();
    const removed = form.options[index];
    form.options = form.options.filter((_, position) => position !== index);
    if (removed && form.correctAnswer === removed.id) {
      form.correctAnswer = form.options[0]?.id ?? '';
    }
    form.correctAnswers = (form.correctAnswers ?? []).filter((id) => id !== removed?.id);
  }

  protected move(index: number, delta: number): void {
    const form = this.form();
    const options = [...form.options];
    const target = index + delta;
    if (target < 0 || target >= options.length) {
      return;
    }
    [options[index], options[target]] = [options[target], options[index]];
    form.options = options;
  }

  protected setAccepted(index: number, value: string): void {
    const form = this.form();
    form.acceptedAnswers = (form.acceptedAnswers ?? []).map((answer, position) => (position === index ? value : answer));
  }

  protected addAccepted(): void {
    const form = this.form();
    form.acceptedAnswers = [...(form.acceptedAnswers ?? []), ''];
  }

  protected removeAccepted(index: number): void {
    const form = this.form();
    form.acceptedAnswers = (form.acceptedAnswers ?? []).filter((_, position) => position !== index);
  }
}

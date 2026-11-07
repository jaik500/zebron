import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { POLL_LIMITS, PollDraft } from './poll.model';

/**
 * Write a poll: question, 2 to 10 answers, "more than one answer" and an
 * optional closing time. Two-way bound: <app-poll-editor [(draft)]="draft" />.
 */
@Component({
  selector: 'app-poll-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  template: `
    <div class="flex min-w-0 flex-col gap-3">
      <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
        <mat-label>{{ 'Question' | t }}</mat-label>
        <textarea
          matInput
          rows="2"
          [maxLength]="limits.questionLength"
          [value]="draft().question"
          (input)="patch({ question: value($event) })"
          [placeholder]="'What would you like to ask?' | t"
        ></textarea>
      </mat-form-field>

      <fieldset class="flex min-w-0 flex-col gap-2">
        <legend class="mb-1 text-xs font-semibold text-slate-500">{{ 'Answers' | t }}</legend>
        @for (option of draft().options; track $index; let index = $index) {
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500"
              aria-hidden="true"
              >{{ letter(index) }}</span
            >
            <input
              class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-teal-100"
              [maxLength]="limits.optionLength"
              [value]="option"
              [placeholder]="'Answer {0}' | t: [index + 1]"
              [attr.aria-label]="'Answer {0}' | t: [index + 1]"
              (input)="setOption(index, value($event))"
            />
            <button
              type="button"
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              [disabled]="draft().options.length <= limits.minOptions"
              (click)="removeOption(index)"
              [attr.aria-label]="'Remove answer' | t"
            >
              <mat-icon class="!h-5 !w-5 !text-xl !leading-none">close</mat-icon>
            </button>
          </div>
        }
        @if (draft().options.length < limits.maxOptions) {
          <button type="button" class="self-start text-sm font-semibold text-[#007979] hover:underline" (click)="addOption()">
            + {{ 'Add an answer' | t }}
          </button>
        }
      </fieldset>

      <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            class="h-4 w-4 accent-[#007979]"
            [checked]="draft().allowMultiple"
            (change)="patch({ allowMultiple: checked($event) })"
          />
          {{ 'People can pick more than one answer' | t }}
        </label>
        @if (draft().allowMultiple) {
          <label class="flex items-center gap-2 text-sm text-slate-700">
            {{ 'Up to' | t }}
            <select
              class="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              [value]="maxChoices()"
              (change)="patch({ maxChoices: +value($event) })"
            >
              @for (count of choiceCounts(); track count) {
                <option [value]="count" [selected]="count === maxChoices()">{{ count }}</option>
              }
            </select>
          </label>
        }
      </div>

      @if (showClosingTime()) {
        <label class="flex min-w-0 flex-col gap-1 text-sm">
          <span class="font-medium text-slate-700">{{ 'Closes (optional)' | t }}</span>
          <span class="flex min-w-0 items-center gap-2">
            <input
              type="datetime-local"
              class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:max-w-xs"
              [min]="nowLocal()"
              [value]="draft().closesAt"
              (input)="patch({ closesAt: value($event) })"
            />
            @if (draft().closesAt) {
              <button type="button" class="text-sm font-semibold text-slate-500 hover:underline" (click)="patch({ closesAt: '' })">
                {{ 'Clear' | t }}
              </button>
            }
          </span>
        </label>
      }
    </div>
  `,
})
export class PollEditorComponent {
  readonly draft = model.required<PollDraft>();
  /** Community polls can close at a set time; live polls are closed by the host. */
  readonly showClosingTime = input(true);

  protected readonly limits = POLL_LIMITS;

  protected readonly filledOptions = computed(() => this.draft().options.filter((option) => option.trim()).length);
  protected readonly choiceCounts = computed(() => {
    const most = Math.max(2, this.filledOptions());
    return Array.from({ length: most - 1 }, (_, index) => index + 2);
  });
  protected readonly maxChoices = computed(() => Math.min(this.draft().maxChoices, Math.max(2, this.filledOptions())));

  protected patch(change: Partial<PollDraft>): void {
    this.draft.update((current) => ({ ...current, ...change }));
  }

  protected setOption(index: number, text: string): void {
    this.draft.update((current) => ({
      ...current,
      options: current.options.map((option, position) => (position === index ? text : option)),
    }));
  }

  protected addOption(): void {
    this.draft.update((current) =>
      current.options.length >= POLL_LIMITS.maxOptions ? current : { ...current, options: [...current.options, ''] },
    );
  }

  protected removeOption(index: number): void {
    this.draft.update((current) =>
      current.options.length <= POLL_LIMITS.minOptions
        ? current
        : { ...current, options: current.options.filter((_, position) => position !== index) },
    );
  }

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected nowLocal(): string {
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
    return now.toISOString().slice(0, 16);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}

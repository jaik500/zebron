import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { LessonMediaComponent } from '../components/lesson-media.component';
import { formatStartTime, LessonBlock, MEDIA_PROVIDERS, parseStartTime, resolveMedia } from '../course.model';

export const BLOCK_META: Record<LessonBlock['type'], { label: string; icon: string }> = {
  text: { label: 'Text', icon: 'notes' },
  video: { label: 'Video', icon: 'smart_display' },
  audio: { label: 'Audio', icon: 'headphones' },
  document: { label: 'PDF or slides', icon: 'slideshow' },
  image: { label: 'Image', icon: 'image' },
  tip: { label: 'Tip', icon: 'lightbulb' },
  check: { label: 'Quick check', icon: 'quiz' },
};

const MAX_OPTIONS = 6;

/** Edit one lesson block. Every change is emitted as a whole new block. */
@Component({
  selector: 'app-block-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule, TranslatePipe, LessonMediaComponent],
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-4 focus-within:border-[#007979] focus-within:ring-2 focus-within:ring-teal-100">
      <header class="mb-3 flex items-center gap-2">
        <mat-icon class="text-[#007979]" aria-hidden="true">{{ meta().icon }}</mat-icon>
        <h3 class="flex-1 text-sm font-bold text-slate-600">{{ meta().label | t }}</h3>
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
          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Text' | t }}</mat-label>
            <textarea matInput rows="6" [value]="textOf()" (input)="set({ text: value($event) })"></textarea>
          </mat-form-field>
          <p class="mt-1 text-xs text-slate-500">{{ formattingHint | t }}</p>
        }
        @case ('tip') {
          <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
            <mat-label>{{ 'Tip' | t }}</mat-label>
            <textarea matInput rows="3" [value]="textOf()" (input)="set({ text: value($event) })"></textarea>
          </mat-form-field>
        }
        @case ('check') {
          <div class="flex flex-col gap-3">
            <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
              <mat-label>{{ 'Question' | t }}</mat-label>
              <textarea matInput rows="2" [value]="check().question" (input)="set({ question: value($event) })"></textarea>
            </mat-form-field>

            <fieldset class="flex flex-col gap-2">
              <legend class="mb-1 text-xs font-semibold text-slate-500">{{ 'Answers: mark the right one' | t }}</legend>
              @for (option of check().options; track $index; let optionIndex = $index) {
                <div class="flex items-center gap-2">
                  <input
                    type="radio"
                    class="h-4 w-4 shrink-0 accent-[#007979]"
                    [name]="'answer-' + uid"
                    [checked]="check().answer === optionIndex"
                    (change)="set({ answer: optionIndex })"
                    [attr.aria-label]="'Right answer' | t"
                  />
                  <input
                    class="h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm"
                    [ngClass]="check().answer === optionIndex ? 'border-[#007979] bg-teal-50' : 'border-slate-200 bg-white'"
                    [value]="option"
                    [placeholder]="'Answer {0}' | t: [optionIndex + 1]"
                    (input)="setOption(optionIndex, value($event))"
                  />
                  <button
                    type="button"
                    class="icon-btn"
                    [disabled]="check().options.length <= 2"
                    (click)="removeOption(optionIndex)"
                    [attr.aria-label]="'Remove answer' | t"
                  >
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
              @if (check().options.length < maxOptions) {
                <button type="button" class="self-start text-sm font-semibold text-[#007979] hover:underline" (click)="addOption()">
                  + {{ 'Add an answer' | t }}
                </button>
              }
            </fieldset>

            <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
              <mat-label>{{ 'Why it is right (shown after a correct answer)' | t }}</mat-label>
              <input matInput [value]="check().explanation ?? ''" (input)="set({ explanation: value($event) })" />
            </mat-form-field>
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

            <div class="grid gap-3 sm:grid-cols-2">
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
  protected readonly providers = computed(() => MEDIA_PROVIDERS);
  protected readonly formattingHint = 'Formatting: **bold**, *italic*, # heading, - list item, 1. numbered item, [link](https://…)';

  protected readonly meta = computed(() => BLOCK_META[this.block()?.type] ?? BLOCK_META.text);

  protected readonly mediaKind = computed(() => {
    const type = this.block().type;
    return type === 'video' || type === 'audio' || type === 'document' ? type : null;
  });

  protected readonly check = computed(() => {
    const block = this.block();
    return block.type === 'check' ? block : { type: 'check' as const, question: '', options: [], answer: 0, explanation: '' };
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

  protected setOption(index: number, text: string): void {
    const options = this.check().options.map((option, position) => (position === index ? text : option));
    this.set({ options });
  }

  protected addOption(): void {
    this.set({ options: [...this.check().options, ''] });
  }

  protected removeOption(index: number): void {
    const check = this.check();
    const options = check.options.filter((_, position) => position !== index);
    const answer = check.answer === index ? 0 : check.answer > index ? check.answer - 1 : check.answer;
    this.set({ options, answer });
  }
}

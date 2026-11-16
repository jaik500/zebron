import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoggerService } from '../../core/services/logger.service';
import { renderKnowledgeContent } from '../partner/knowledge/knowledge-content.util';

import { CodeEditorComponent } from './code-editor.component';
import { CodeExercise, CODE_LANGUAGES, OutputLine, TestResult } from './code-lab.model';
import { CodeLabStorageService } from './code-lab-storage.service';
import { CodeRunnerService } from './code-runner.service';

/**
 * Zebron Coding Lab panel: instructions, editor, Run / Check / Reset, hints,
 * output console and check results. Used for lesson exercises, runnable
 * lesson examples, and the Coding Lab page.
 */
@Component({
  selector: 'app-code-lab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe, CodeEditorComponent],
  template: `
    <section class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white" [attr.aria-label]="(exercise().title || 'Coding Lab') | t" (focusin)="warmUp()">
      @if (mode() === 'exercise') {
        <header class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <mat-icon class="text-[#007979]" aria-hidden="true">terminal</mat-icon>
          <h3 class="min-w-0 flex-1 text-base font-semibold text-slate-900">{{ exercise().title || ('Coding exercise' | t) }}</h3>
          @if (passed()) {
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">check_circle</mat-icon>{{ 'Passed' | t }}
            </span>
          }
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{{ languageLabel() }}</span>
        </header>
        @if (instructionsHtml()) {
          <div
            class="px-4 py-3 text-[0.975rem] leading-7 text-slate-800 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:text-sm [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:ml-6 [&_ul]:list-disc [&_ol]:ml-6 [&_ol]:list-decimal [&>*:last-child]:mb-0"
            [innerHTML]="instructionsHtml()"
          ></div>
        }
      }

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-1.5 border-b border-slate-800 bg-[#0f2b38] px-2 py-1.5">
        <button type="button" (click)="runCode()" [disabled]="running()" class="inline-flex h-8 items-center gap-1 rounded-md bg-[#12bfc3] px-3 text-sm font-semibold text-[#032d42] hover:bg-[#3fd3d6] disabled:opacity-60" [title]="'Run (Ctrl+Enter)' | t">
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ running() ? 'hourglass_empty' : 'play_arrow' }}</mat-icon>
          {{ (running() ? 'Running…' : 'Run') | t }}
        </button>
        @if (exercise().tests.length) {
          <button type="button" (click)="check()" [disabled]="running()" class="inline-flex h-8 items-center gap-1 rounded-md border border-teal-300/60 px-3 text-sm font-semibold text-teal-100 hover:bg-white/10 disabled:opacity-60">
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">fact_check</mat-icon>
            {{ 'Check my code' | t }}
          </button>
        }
        <span class="flex-1"></span>
        @if (saveState(); as state) {
          <span class="hidden px-1 text-xs text-slate-400 sm:inline" role="status">{{ state | t }}</span>
        }
        @if (exercise().hints.length && mode() === 'exercise') {
          <button type="button" (click)="nextHint()" [disabled]="hintsShown() >= exercise().hints.length" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 disabled:opacity-40 sm:w-auto sm:gap-1 sm:px-2" [attr.aria-label]="'Show a hint' | t" [title]="'Show a hint' | t">
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">lightbulb</mat-icon>
            <span class="hidden text-sm sm:inline">{{ 'Hint' | t }}</span>
          </button>
        }
        <button type="button" (click)="reset()" [disabled]="code() === exercise().starter" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 disabled:opacity-40 sm:w-auto sm:gap-1 sm:px-2" [attr.aria-label]="'Reset to the starting code' | t" [title]="'Reset to the starting code' | t">
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">restart_alt</mat-icon>
          <span class="hidden text-sm sm:inline">{{ 'Reset' | t }}</span>
        </button>
        @if (allowOpenInLab()) {
          <button type="button" (click)="openInLab()" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10" [attr.aria-label]="'Open in the Coding Lab' | t" [title]="'Open in the Coding Lab' | t">
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">open_in_new</mat-icon>
          </button>
        }
      </div>

      <app-code-editor [(code)]="code" [language]="exercise().language" [height]="editorHeight()" [label]="'Code editor' | t" (run)="runCode()" />

      <!-- Program input for prompt() -->
      <details class="border-t border-slate-800 bg-[#0b1f2a] text-sm text-slate-300" [open]="stdin().length > 0">
        <summary class="cursor-pointer px-3 py-1.5 text-xs text-slate-400">{{ (exercise().language === 'python' ? 'Program input (one line for each input())' : 'Program input (one line for each prompt())') | t }}</summary>
        <textarea class="block h-16 w-full resize-y border-0 bg-[#081822] px-3 py-2 font-mono text-xs text-slate-100 outline-none" [value]="stdin()" (input)="stdin.set($any($event.target).value)" [attr.aria-label]="'Program input' | t" spellcheck="false"></textarea>
      </details>

      <!-- Console -->
      @if (hasRun()) {
        <div class="border-t border-slate-800 bg-[#06141c]" role="log" aria-live="polite" [attr.aria-label]="'Output' | t">
          <div class="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <span>{{ 'Output' | t }}</span>
            <span class="font-normal normal-case tracking-normal">
              @if (duration() !== null) { {{ '{0} ms' | t: [duration()] }} }
              <button type="button" (click)="clearOutput()" class="ml-2 rounded px-1 text-slate-400 hover:text-white">{{ 'Clear' | t }}</button>
            </span>
          </div>
          <pre class="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-words px-3 pb-3 font-mono text-[13px] leading-relaxed">@for (line of output(); track $index) {<span [class]="line.stream === 'stderr' ? 'text-amber-300' : line.stream === 'system' ? 'text-slate-500' : 'text-slate-100'">{{ line.text }}
</span>}@if (error()) {<span class="text-rose-300">{{ error() }}</span>}@if (!output().length && !error() && !running()) {<span class="text-slate-500">{{ 'No output. Use {0} to print values.' | t: [printHint()] }}</span>}</pre>
        </div>
      }

      <!-- Check results -->
      @if (results().length) {
        <div class="border-t border-slate-200 px-4 py-3" aria-live="polite">
          <p class="mb-2 text-sm font-semibold" [class]="allPassed() ? 'text-emerald-700' : 'text-slate-900'">
            {{ allPassed() ? ('All checks passed. Well done!' | t) : ('{0} of {1} checks passed' | t: [passedCount(), results().length]) }}
          </p>
          <ul class="space-y-1 text-sm">
            @for (result of results(); track $index) {
              <li class="flex gap-2">
                <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px]" [class]="result.passed ? 'text-emerald-600' : 'text-rose-600'" aria-hidden="true">{{ result.passed ? 'check_circle' : 'cancel' }}</mat-icon>
                <span class="min-w-0">
                  <span class="text-slate-800">{{ result.name }}</span>
                  <span class="sr-only">{{ (result.passed ? 'passed' : 'failed') | t }}</span>
                  @if (!result.passed && result.message) {
                    <span class="block font-mono text-xs text-rose-700">{{ result.message }}</span>
                  }
                </span>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Hints and solution -->
      @if (hintsShown() || (exercise().solution && attempts() > 0)) {
        <div class="space-y-2 border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          @for (hint of exercise().hints.slice(0, hintsShown()); track $index) {
            <p class="flex gap-2"><mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-amber-600" aria-hidden="true">lightbulb</mat-icon><span class="whitespace-pre-line"><strong>{{ 'Hint {0}:' | t: [$index + 1] }}</strong> {{ hint }}</span></p>
          }
          @if (exercise().solution && attempts() > 0) {
            @if (showSolution()) {
              <div>
                <p class="mb-1 font-semibold">{{ 'One possible solution' | t }}</p>
                <pre class="m-0 overflow-auto rounded-lg bg-[#0b1f2a] p-3 font-mono text-xs text-slate-100">{{ exercise().solution }}</pre>
                <button type="button" (click)="useSolution()" class="mt-2 text-xs font-semibold text-[#007979] underline">{{ 'Put it in the editor' | t }}</button>
              </div>
            } @else {
              <button type="button" (click)="showSolution.set(true)" class="text-xs font-semibold text-amber-800 underline">{{ 'Show a solution' | t }}</button>
            }
          }
        </div>
      }
    </section>
  `,
})
export class CodeLabComponent {
  private readonly runner = inject(CodeRunnerService);
  private readonly storage = inject(CodeLabStorageService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);

  readonly exercise = input.required<CodeExercise>();
  /** Where the learner's code is saved; null to not save (runnable examples). */
  readonly saveKey = input<string | null>(null);
  /** What the panel shows (project or exercise id): a new value loads fresh code. */
  readonly instanceKey = input<string | null>(null);
  readonly mode = input<'exercise' | 'example'>('exercise');
  readonly editorHeight = input('18rem');
  readonly allowOpenInLab = input(true);
  /** Run once when shown (lesson examples opened with Run). */
  readonly autoRun = input(false);
  /** Coding Lab page: lab URL base (organization pages keep their own). */
  readonly labPath = input('/courses/coding-lab');

  /** All checks passed (first time in this session). */
  readonly passedChange = output<boolean>();
  /** The code changed (Coding Lab page projects save it themselves). */
  readonly codeChange = output<string>();

  protected readonly code = signal('');
  protected readonly stdin = signal('');
  protected readonly output = signal<OutputLine[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<TestResult[]>([]);
  protected readonly running = signal(false);
  protected readonly hasRun = signal(false);
  protected readonly duration = signal<number | null>(null);
  protected readonly hintsShown = signal(0);
  protected readonly attempts = signal(0);
  protected readonly showSolution = signal(false);
  protected readonly passed = signal(false);
  protected readonly saveState = signal<string | null>(null);

  protected readonly printHint = computed(() => CODE_LANGUAGES.find((item) => item.value === this.exercise().language)?.print ?? 'print()');
  protected readonly languageLabel = computed(() => CODE_LANGUAGES.find((item) => item.value === this.exercise().language)?.label ?? 'Code');
  protected readonly instructionsHtml = computed(() => (this.exercise().instructions.trim() ? renderKnowledgeContent(this.exercise().instructions) : ''));
  protected readonly passedCount = computed(() => this.results().filter((result) => result.passed).length);
  protected readonly allPassed = computed(() => this.results().length > 0 && this.results().every((result) => result.passed));

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private loadedIdentity: string | undefined = undefined;
  private lastSaved = '';

  constructor() {
    // Load the starter code, then the learner's saved work.
    effect(() => {
      const exercise = this.exercise();
      const key = this.saveKey();
      const identity = this.instanceKey() ?? key ?? exercise.starter;
      untracked(() => {
        if (identity === this.loadedIdentity) return;
        this.loadedIdentity = identity;
        this.code.set(exercise.starter);
        this.lastSaved = exercise.starter;
        this.results.set([]);
        this.output.set([]);
        this.error.set(null);
        this.hasRun.set(false);
        this.hintsShown.set(0);
        this.attempts.set(0);
        this.showSolution.set(false);
        this.passed.set(false);
        if (key) void this.loadSaved(key);
      });
    });

    // Save a moment after the learner stops typing.
    effect(() => {
      const code = this.code();
      untracked(() => {
        this.codeChange.emit(code);
        if (!this.saveKey() || !this.storage.signedIn || code === this.lastSaved) return;
        this.saveState.set('Saving…');
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => void this.save(false), 1500);
      });
    });

    afterNextRender(() => {
      if (this.autoRun()) void this.runCode();
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        void this.save(false);
      }
    });
  }

  private async loadSaved(key: string): Promise<void> {
    try {
      const work = await this.storage.loadExercise(key);
      if (work && this.saveKey() === key) {
        if (work.code) {
          this.code.set(work.code);
          this.lastSaved = work.code;
        }
        this.passed.set(work.passed);
        if (work.passed) this.passedChange.emit(true);
        this.saveState.set(work.code ? 'Saved' : null);
      }
    } catch (error) {
      this.logger.error('CodeLabComponent', 'Could not load saved code.', error);
    }
  }

  private async save(justPassed: boolean): Promise<void> {
    const key = this.saveKey();
    if (!key || !this.storage.signedIn) return;
    this.saveTimer = null;
    const code = this.code();
    try {
      await this.storage.saveExercise(key, this.exercise().language, code, justPassed, this.passed() && !justPassed);
      this.lastSaved = code;
      this.saveState.set('Saved');
    } catch (error) {
      this.logger.error('CodeLabComponent', 'Could not save the code.', error);
      this.saveState.set('Not saved');
    }
  }

  protected async runCode(withTests = false): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.hasRun.set(true);
    this.output.set([]);
    this.error.set(null);
    this.duration.set(null);
    const tests = withTests ? this.exercise().tests : [];
    const result = await this.runner.run(this.exercise().language, this.code(), {
      stdin: this.stdin(),
      tests,
      onOutput: (line) => this.output.update((lines) => [...lines, line]),
    });
    this.output.set(result.output);
    this.error.set(result.error);
    this.duration.set(result.durationMs);
    this.running.set(false);

    if (withTests) {
      this.attempts.update((count) => count + 1);
      this.results.set(result.tests);
      const allPassed = result.tests.length > 0 && result.tests.every((test) => test.passed);
      if (allPassed && !this.passed()) {
        this.passed.set(true);
        this.passedChange.emit(true);
        if (this.saveTimer) clearTimeout(this.saveTimer);
        await this.save(true);
      }
    }
  }

  /** Python takes a few seconds to start: begin when the learner starts working. */
  protected warmUp(): void {
    this.runner.warmUp(this.exercise().language);
  }

  protected check(): void {
    void this.runCode(true);
  }

  protected nextHint(): void {
    this.hintsShown.update((count) => Math.min(this.exercise().hints.length, count + 1));
  }

  protected reset(): void {
    if (this.code() !== this.exercise().starter && !confirm(this.i18n.t('Replace your code with the starting code?'))) {
      return;
    }
    this.code.set(this.exercise().starter);
    this.results.set([]);
  }

  protected useSolution(): void {
    if (confirm(this.i18n.t('Replace your code with this solution?'))) {
      this.code.set(this.exercise().solution);
    }
  }

  protected clearOutput(): void {
    this.output.set([]);
    this.error.set(null);
    this.hasRun.set(false);
  }

  protected openInLab(): void {
    void this.router.navigateByUrl(this.labPath(), {
      state: { codeLab: { language: this.exercise().language, code: this.code(), name: this.exercise().title } },
    });
  }
}

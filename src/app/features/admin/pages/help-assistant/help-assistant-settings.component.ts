import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { httpsCallable } from 'firebase/functions';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AuthService } from '../../../../core/services/auth.service';
import { firebaseFunctions } from '../../../../core/services/firebase-config';
import { HelpAssistantSettingsService } from '../../../../core/services/help-assistant-settings.service';
import { LoggerService } from '../../../../core/services/logger.service';
import {
  DEFAULT_HELP_ASSISTANT_SETTINGS,
  HELP_ASSISTANT_LIMITS,
  HELP_ASSISTANT_MODELS,
  HelpAssistantSettings,
  MODEL_PATTERN,
  normalizeHelpAssistantSettings,
} from '../../../../core/models/help-assistant-settings.model';

interface TestReply {
  answer: string;
  mode: 'ai' | 'search';
  citations: Array<{ number: number; title: string; kind: string }>;
}

const CUSTOM_MODEL = '__custom__';

/**
 * Admin → Configuration → Help assistant.
 * Platform administrators switch the assistant on or off, pick the model
 * and limits, edit what it says and choose which sources it answers from.
 */
@Component({
  selector: 'app-help-assistant-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <section class="mx-auto w-full max-w-5xl min-w-0 px-4 pb-28 pt-20 sm:px-6">
      <!-- Header -->
      <header class="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <nav class="flex items-center gap-1 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
            <a routerLink="/admin" class="hover:text-slate-700">Admin</a>
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400" aria-hidden="true">chevron_right</mat-icon>
            <a routerLink="/admin/configuration" class="hover:text-slate-700">Configuration</a>
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400" aria-hidden="true">chevron_right</mat-icon>
            <span class="text-slate-700">Help assistant</span>
          </nav>
          <div class="mt-3 flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007979] text-white shadow-sm">
              <mat-icon aria-hidden="true">forum</mat-icon>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Help assistant</h1>
              <p class="mt-0.5 text-sm text-slate-500">
                The "Ask for help" chat on partner and support pages. Changes apply within about a minute, with no deploy.
              </p>
            </div>
          </div>
        </div>
        <span [class]="statusPill()">
          <span class="h-2 w-2 rounded-full bg-current"></span>
          {{ statusText() }}
        </span>
      </header>

      @if (loading()) {
        <div class="mt-10 flex justify-center"><mat-spinner diameter="32"></mat-spinner></div>
      } @else {
        <div class="mt-6 grid min-w-0 gap-6">
          <!-- Status -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Status</h2>
            <div class="mt-4 divide-y divide-slate-100">
              <div class="flex items-start justify-between gap-4 pb-4">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">Show the assistant</p>
                  <p class="text-sm text-slate-500">When off, the "Ask for help" button is hidden and the assistant refuses questions. Zebron admins can still test it below.</p>
                </div>
                <mat-slide-toggle [(ngModel)]="form.enabled" (ngModelChange)="touch()" aria-label="Show the assistant"></mat-slide-toggle>
              </div>
              <div class="flex items-start justify-between gap-4 pt-4">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">AI answers</p>
                  <p class="text-sm text-slate-500">
                    When on, Gemini writes an answer from the matching sources. When off, or if the
                    <code class="rounded bg-slate-100 px-1 text-xs">GEMINI_API_KEY</code> secret isn't set, people get the best-matching articles instead.
                  </p>
                </div>
                <mat-slide-toggle [(ngModel)]="form.aiEnabled" (ngModelChange)="touch()" aria-label="AI answers"></mat-slide-toggle>
              </div>
            </div>
          </section>

          <!-- Model and limits -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Model and limits</h2>
            <div class="mt-4 grid min-w-0 grid-cols-1 gap-x-4 md:grid-cols-2">
              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Model</mat-label>
                <mat-select [(ngModel)]="modelChoice" (ngModelChange)="onModelChoice($event)" [disabled]="!form.aiEnabled">
                  @for (model of models; track model.id) {
                    <mat-option [value]="model.id">{{ model.label }}</mat-option>
                  }
                  <mat-option [value]="customModel">Other model name…</mat-option>
                </mat-select>
                <mat-hint>{{ modelHint() }}</mat-hint>
              </mat-form-field>

              @if (modelChoice === customModel) {
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>Model name</mat-label>
                  <input matInput [(ngModel)]="form.model" (ngModelChange)="touch()" placeholder="gemini-…" [disabled]="!form.aiEnabled" />
                  @if (!modelValid()) {
                    <mat-hint class="!text-red-700">Must look like gemini-2.5-flash</mat-hint>
                  } @else {
                    <mat-hint>Exact Gemini model ID from Google AI Studio</mat-hint>
                  }
                </mat-form-field>
              } @else {
                <div class="hidden md:block"></div>
              }

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Questions per person per hour</mat-label>
                <input matInput type="number" [min]="limits.hourlyLimit.min" [max]="limits.hourlyLimit.max" [(ngModel)]="form.hourlyLimit" (ngModelChange)="touch()" />
                <mat-hint>{{ limits.hourlyLimit.min }}–{{ limits.hourlyLimit.max }}. Protects the AI quota and bill.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Sources per answer</mat-label>
                <input matInput type="number" [min]="limits.maxSources.min" [max]="limits.maxSources.max" [(ngModel)]="form.maxSources" (ngModelChange)="touch()" />
                <mat-hint>{{ limits.maxSources.min }}–{{ limits.maxSources.max }} articles given to the model and shown as citations.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Answer length (words)</mat-label>
                <input matInput type="number" [min]="limits.maxAnswerWords.min" [max]="limits.maxAnswerWords.max" [step]="10" [(ngModel)]="form.maxAnswerWords" (ngModelChange)="touch()" />
                <mat-hint>{{ limits.maxAnswerWords.min }}–{{ limits.maxAnswerWords.max }}. Shorter answers are faster and cheaper.</mat-hint>
              </mat-form-field>
            </div>
          </section>

          <!-- What it says -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">What people see</h2>
            <div class="mt-4 grid min-w-0 grid-cols-1 gap-x-4 md:grid-cols-2">
              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>Assistant name</mat-label>
                <input matInput [maxlength]="limits.assistantName" [(ngModel)]="form.assistantName" (ngModelChange)="touch()" />
                <mat-hint>Shown in the chat header.</mat-hint>
              </mat-form-field>
              <div class="hidden md:block"></div>

              <mat-form-field appearance="outline" class="zb-field md:col-span-2">
                <mat-label>Welcome message</mat-label>
                <textarea matInput rows="2" [maxlength]="limits.welcomeMessage" [(ngModel)]="form.welcomeMessage" (ngModelChange)="touch()"
                  placeholder="I answer from Zebron's help articles and your organization's, based on what your role can do."></textarea>
                <mat-hint align="end">{{ form.welcomeMessage.length }} / {{ limits.welcomeMessage }}. Leave empty for the standard text.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field md:col-span-2">
                <mat-label>Suggested questions (one per line)</mat-label>
                <textarea matInput rows="4" [(ngModel)]="suggestionsText" (ngModelChange)="touch()"></textarea>
                <mat-hint>Up to {{ limits.suggestions }}, {{ limits.suggestion }} characters each. Shown as buttons before the first question.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="zb-field md:col-span-2">
                <mat-label>Extra guidance for the AI (optional)</mat-label>
                <textarea matInput rows="4" [maxlength]="limits.extraInstructions" [(ngModel)]="form.extraInstructions" (ngModelChange)="touch()"
                  placeholder="For example: Answer in French when the question is in French. Call our learners 'students'."></textarea>
                <mat-hint align="end">{{ form.extraInstructions.length }} / {{ limits.extraInstructions }}. Tone and wording only; it can't override the safety rules (answer only from sources, respect roles).</mat-hint>
              </mat-form-field>
            </div>

            <!-- Preview -->
            <div class="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div class="bg-gradient-to-r from-[#032D42] to-[#007979] px-4 py-2.5 text-sm font-semibold text-white">{{ form.assistantName || defaults.assistantName }}</div>
              <div class="bg-slate-50 p-4">
                <div class="rounded-xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                  <p class="font-semibold text-slate-900">Hi! How can I help?</p>
                  <p class="mt-1 text-slate-600">{{ form.welcomeMessage || standardWelcome }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (suggestion of previewSuggestions(); track $index) {
                      <span class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700">{{ suggestion }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Sources -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Sources it answers from</h2>
            <p class="mt-1 text-sm text-slate-500">Each source is always filtered by the person's role and organization; turning one off removes it for everyone.</p>
            <div class="mt-4 divide-y divide-slate-100">
              <div class="flex items-start justify-between gap-4 pb-4">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">Zebron Knowledge Center articles</p>
                  <p class="text-sm text-slate-500">Published articles from <a routerLink="/admin/configuration/knowledge" class="text-[#007979] hover:underline">Admin → Knowledge Center</a>, by audience and the organization's applications.</p>
                </div>
                <mat-slide-toggle [(ngModel)]="form.sources.platformArticles" (ngModelChange)="touch()" aria-label="Zebron Knowledge Center articles"></mat-slide-toggle>
              </div>
              <div class="flex items-start justify-between gap-4 py-4">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">Organization articles</p>
                  <p class="text-sm text-slate-500">Each organization's own published Knowledge Center articles, only for its members.</p>
                </div>
                <mat-slide-toggle [(ngModel)]="form.sources.organizationArticles" (ngModelChange)="touch()" aria-label="Organization articles"></mat-slide-toggle>
              </div>
              <div class="flex items-start justify-between gap-4 pt-4">
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">Built-in partner portal guides</p>
                  <p class="text-sm text-slate-500">Short how-tos for roles, invitations, Test Center, banners, mailbox, contract, audit log, tickets and profile.</p>
                </div>
                <mat-slide-toggle [(ngModel)]="form.sources.builtInGuides" (ngModelChange)="touch()" aria-label="Built-in partner portal guides"></mat-slide-toggle>
              </div>
            </div>
            @if (noSources()) {
              <p class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">With every source off, the assistant can't answer anything.</p>
            }
          </section>

          <!-- Test -->
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-slate-900">Try it</h2>
            <p class="mt-1 text-sm text-slate-500">Asks the live assistant with the <strong>saved</strong> settings, as a Zebron admin outside any organization. Counts toward your hourly limit.</p>
            <div class="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row">
              <mat-form-field appearance="outline" class="zb-field zb-field--grow min-w-0 flex-1">
                <mat-label>Question</mat-label>
                <input matInput [(ngModel)]="testQuestion" (keydown.enter)="runTest()" placeholder="How do I invite someone?" />
              </mat-form-field>
              <button mat-stroked-button type="button" class="sm:mt-1 sm:h-12" [disabled]="testing() || testQuestion.trim().length < 2" (click)="runTest()">
                <mat-icon>send</mat-icon>
                <span>{{ testing() ? 'Asking…' : 'Ask' }}</span>
              </button>
            </div>
            @if (testError()) {
              <p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{{ testError() }}</p>
            }
            @if (testReply(); as reply) {
              <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span [class]="reply.mode === 'ai'
                  ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                  : 'inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20'">
                  {{ reply.mode === 'ai' ? 'AI answer' : 'Matching articles only (AI off, no key, or the model failed)' }}
                </span>
                <p class="mt-2 whitespace-pre-wrap text-sm text-slate-800">{{ reply.answer }}</p>
                @if (reply.citations.length) {
                  <ol class="mt-3 list-decimal space-y-0.5 pl-5 text-xs text-slate-600">
                    @for (citation of reply.citations; track citation.number) {
                      <li>{{ citation.title }} <span class="text-slate-400">({{ kindLabel(citation.kind) }})</span></li>
                    }
                  </ol>
                }
              </div>
            }
          </section>
        </div>
      }

      <!-- Save bar -->
      @if (!loading()) {
        <div class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p class="text-sm text-slate-500">
              @if (message()) {
                <span [class]="failed() ? 'text-red-700' : 'text-emerald-700'">{{ message() }}</span>
              } @else if (dirty()) {
                You have unsaved changes.
              } @else if (saved().updatedAt) {
                Last saved {{ saved().updatedAt | date: 'MMM d, y, h:mm a' }}
              } @else {
                Using the standard settings.
              }
            </p>
            <div class="flex gap-2">
              <button mat-button type="button" [disabled]="saving()" (click)="resetToDefaults()">Reset to standard</button>
              <button mat-stroked-button type="button" [disabled]="saving() || !dirty()" (click)="discard()">Discard</button>
              <button mat-flat-button color="primary" type="button" [disabled]="saving() || !dirty() || !modelValid()" (click)="save()">
                {{ saving() ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class HelpAssistantSettingsComponent implements OnInit {
  private readonly service = inject(HelpAssistantSettingsService);
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);

  protected readonly models = HELP_ASSISTANT_MODELS;
  protected readonly limits = HELP_ASSISTANT_LIMITS;
  protected readonly defaults = DEFAULT_HELP_ASSISTANT_SETTINGS;
  protected readonly customModel = CUSTOM_MODEL;
  protected readonly standardWelcome = "I answer from Zebron's help articles and your organization's, based on what your role can do.";

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly failed = signal(false);
  protected readonly saved = signal<HelpAssistantSettings>(DEFAULT_HELP_ASSISTANT_SETTINGS);

  /** Bumped on every edit so computed values re-run (the form is a plain object). */
  private readonly version = signal(0);

  protected form: HelpAssistantSettings = this.copy(DEFAULT_HELP_ASSISTANT_SETTINGS);
  protected suggestionsText = '';
  protected modelChoice = DEFAULT_HELP_ASSISTANT_SETTINGS.model;

  protected testQuestion = '';
  protected readonly testing = signal(false);
  protected readonly testReply = signal<TestReply | null>(null);
  protected readonly testError = signal('');

  protected readonly dirty = computed(() => {
    this.version();
    return JSON.stringify(this.comparable(this.collect())) !== JSON.stringify(this.comparable(this.saved()));
  });

  protected readonly modelValid = computed(() => {
    this.version();
    return MODEL_PATTERN.test(this.form.model.trim().toLowerCase());
  });

  protected readonly noSources = computed(() => {
    this.version();
    const sources = this.form.sources;
    return !sources.platformArticles && !sources.organizationArticles && !sources.builtInGuides;
  });

  protected readonly previewSuggestions = computed(() => {
    this.version();
    return this.parseSuggestions(this.suggestionsText);
  });

  protected readonly modelHint = computed(() => {
    this.version();
    return this.models.find((model) => model.id === this.modelChoice)?.description ?? 'Any Gemini model your API key can use.';
  });

  protected readonly statusText = computed(() => {
    const settings = this.saved();
    if (!settings.enabled) return 'Off';
    return settings.aiEnabled ? 'On · AI answers' : 'On · Articles only';
  });

  protected readonly statusPill = computed(() => {
    const settings = this.saved();
    const base = 'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ';
    if (!settings.enabled) return base + 'bg-slate-100 text-slate-600 ring-slate-500/20';
    return settings.aiEnabled
      ? base + 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : base + 'bg-amber-50 text-amber-800 ring-amber-600/20';
  });

  async ngOnInit(): Promise<void> {
    const settings = await this.service.load(true);
    this.saved.set(settings);
    this.fill(settings);
    this.loading.set(false);
  }

  protected touch(): void {
    this.message.set('');
    this.version.update((value) => value + 1);
  }

  protected onModelChoice(choice: string): void {
    if (choice !== CUSTOM_MODEL) {
      this.form.model = choice;
    }
    this.touch();
  }

  protected discard(): void {
    this.fill(this.saved());
    this.touch();
  }

  protected resetToDefaults(): void {
    this.fill(DEFAULT_HELP_ASSISTANT_SETTINGS);
    this.touch();
    this.message.set('Standard settings filled in. Save to apply them.');
    this.failed.set(false);
  }

  protected async save(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      this.fail('Sign in as a Zebron platform administrator first.');
      return;
    }

    this.saving.set(true);
    try {
      const saved = await this.service.save(this.collect(), uid);
      this.saved.set(saved);
      this.fill(saved);
      this.touch();
      this.failed.set(false);
      this.message.set('Saved. The assistant uses the new settings within about a minute.');
    } catch (error) {
      this.logger.error('HelpAssistantSettingsComponent', 'Saving help assistant settings failed.', error);
      const code = (error as { code?: string })?.code;
      this.fail(code === 'permission-denied'
        ? 'The database refused the change: only Zebron platform administrators can save, and the rules must be deployed.'
        : 'The settings could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async runTest(): Promise<void> {
    const question = this.testQuestion.trim();
    if (question.length < 2 || this.testing()) return;

    this.testing.set(true);
    this.testError.set('');
    this.testReply.set(null);

    try {
      const callable = httpsCallable<{ question: string; organizationId: null; history: [] }, TestReply>(
        firebaseFunctions,
        'askSupportAssistant',
      );
      const result = await callable({ question, organizationId: null, history: [] });
      this.testReply.set(result.data);
    } catch (error) {
      this.testError.set(error instanceof Error ? error.message : 'The assistant did not answer.');
    } finally {
      this.testing.set(false);
    }
  }

  protected kindLabel(kind: string): string {
    if (kind === 'organization_article') return 'organization article';
    if (kind === 'guide') return 'built-in guide';
    return 'Zebron article';
  }

  private fill(settings: HelpAssistantSettings): void {
    this.form = this.copy(settings);
    this.suggestionsText = settings.suggestions.join('\n');
    this.modelChoice = this.models.some((model) => model.id === settings.model) ? settings.model : CUSTOM_MODEL;
  }

  private collect(): HelpAssistantSettings {
    return normalizeHelpAssistantSettings({
      ...this.form,
      model: this.form.model.trim().toLowerCase(),
      suggestions: this.parseSuggestions(this.suggestionsText),
    });
  }

  private parseSuggestions(value: string): string[] {
    return value
      .split('\n')
      .map((line) => line.trim().slice(0, HELP_ASSISTANT_LIMITS.suggestion))
      .filter(Boolean)
      .slice(0, HELP_ASSISTANT_LIMITS.suggestions);
  }

  private comparable(settings: HelpAssistantSettings): Omit<HelpAssistantSettings, 'updatedAt' | 'updatedBy'> {
    const rest: HelpAssistantSettings = { ...settings };
    delete rest.updatedAt;
    delete rest.updatedBy;
    return rest;
  }

  private copy(settings: HelpAssistantSettings): HelpAssistantSettings {
    return { ...settings, suggestions: [...settings.suggestions], sources: { ...settings.sources } };
  }

  private fail(text: string): void {
    this.failed.set(true);
    this.message.set(text);
  }
}

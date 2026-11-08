import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';
import { Timestamp, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../../../core/services/firebase-config';

interface EngineSettings {
  enabled: boolean;
  monthlyCallLimit: number;
  userDailyLimit: number;
  model: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
}

interface UsageCounter {
  calls?: number;
  estimatedCost?: number;
}

interface MonthUsage {
  calls?: number;
  failures?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  apps?: Record<string, UsageCounter>;
  tasks?: Record<string, UsageCounter>;
}

interface UsageLogEntry {
  id: string;
  app: string;
  task: string;
  model: string;
  ok: boolean;
  errorCode?: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  ms: number;
  at?: Timestamp;
}

interface LinkProblem {
  url: string;
  where: string;
  name: string;
  resourceId?: string;
  resourceSlug?: string;
  topicKey?: string;
  status: number;
  reason: string;
}

interface StaleResource {
  resourceId: string;
  resourceSlug: string;
  name: string;
  lastVerifiedAt: Timestamp | null;
  days: number | null;
}

interface DuplicateGroup {
  kind: string;
  value: string;
  resources: { resourceId: string; resourceSlug: string; name: string }[];
}

interface ContentChecks {
  ranAt?: Timestamp;
  trigger?: string;
  durationMs?: number;
  resourcesChecked?: number;
  linksChecked?: number;
  staleDays?: number;
  brokenLinks?: LinkProblem[];
  blockedLinks?: LinkProblem[];
  staleResources?: StaleResource[];
  duplicateGroups?: DuplicateGroup[];
}

const DEFAULTS: EngineSettings = {
  enabled: true,
  monthlyCallLimit: 2000,
  userDailyLimit: 100,
  model: '',
  inputCostPerMillion: 0,
  outputCostPerMillion: 0,
};

const APP_LABELS: Record<string, string> = {
  resources: 'Resources',
  jobs: 'Jobs',
  learning: 'Learning',
  blog: 'Blog',
  community: 'Community',
  knowledge: 'Knowledge Center',
  other: 'Other',
};

const TASK_LABELS: Record<string, string> = {
  'draft-topic': 'Draft a topic',
  improve: 'Improve text',
  summarize: 'Summarize',
  'classify-resource': 'Sort a resource',
};

/**
 * Admin → AI and content checks: the shared AI engine's settings and usage
 * (calls, tokens, estimated cost by app and task) and the weekly
 * directory checks (broken links, out-of-date listings, duplicates).
 */
@Component({
  selector: 'app-ai-content-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, DatePipe, DecimalPipe],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-gray-50">
      <div class="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/admin" class="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
            Admin
          </a>
          <h1 class="border-l border-gray-200 pl-3 text-base font-semibold text-[#032D42]">AI and content checks</h1>
        </div>

        <!-- ===================== Content checks ===================== -->
        <section class="rounded-2xl border border-gray-200 bg-white shadow-sm" aria-labelledby="checks-title">
          <div class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
            <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none text-[#007979]" aria-hidden="true">fact_check</mat-icon>
            <div class="min-w-0 flex-1">
              <h2 id="checks-title" class="text-sm font-semibold text-[#032D42]">Directory checks</h2>
              <p class="text-xs text-gray-500">
                @if (checks()?.ranAt) {
                  Last run {{ checks()!.ranAt!.toDate() | date: 'EEE, MMM d, h:mm a' }} ({{ checks()!.trigger === 'manual' ? 'by hand' : 'weekly' }}) ·
                  {{ checks()!.resourcesChecked ?? 0 }} listings, {{ checks()!.linksChecked ?? 0 }} links. Runs every Monday morning.
                } @else {
                  Not run yet. Runs every Monday morning, or now.
                }
              </p>
            </div>
            <button
              type="button"
              (click)="runChecks()"
              [disabled]="checking()"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none {{ checking() ? 'animate-spin' : '' }}" aria-hidden="true">{{ checking() ? 'autorenew' : 'play_arrow' }}</mat-icon>
              {{ checking() ? 'Checking… (a minute or two)' : 'Run now' }}
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 pt-2 [scrollbar-width:none]" role="tablist">
            @for (tab of tabs(); track tab.key) {
              <button
                type="button"
                role="tab"
                (click)="checkTab.set(tab.key)"
                [attr.aria-selected]="checkTab() === tab.key"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium {{
                  checkTab() === tab.key ? 'border-[#007979] text-[#007979]' : 'border-transparent text-gray-600 hover:text-gray-900'
                }}"
              >
                {{ tab.label }}
                <span class="rounded-full px-1.5 text-xs font-semibold {{ tab.count ? tab.tone : 'bg-gray-100 text-gray-500' }}">{{ tab.count }}</span>
              </button>
            }
          </div>

          <div class="max-h-[28rem] overflow-y-auto">
            @switch (checkTab()) {
              @case ('broken') {
                @if (checks()?.brokenLinks?.length) {
                  <ul class="divide-y divide-gray-100">
                    @for (problem of checks()!.brokenLinks!; track $index) {
                      <li class="flex flex-wrap items-start gap-x-3 gap-y-1 px-5 py-3 text-sm">
                        <div class="min-w-0 flex-1">
                          <p class="font-medium text-[#032D42]">{{ problem.name }}</p>
                          <p class="text-xs text-gray-500">{{ problem.where }} · <span class="text-red-600">{{ problem.reason }}</span></p>
                          <a [href]="problem.url" target="_blank" rel="noopener noreferrer" class="block truncate text-xs text-[#007979] hover:underline">{{ problem.url }}</a>
                        </div>
                        <a [routerLink]="fixLink(problem)" class="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-[#007979] hover:text-[#007979]">
                          {{ problem.topicKey ? 'Open topics' : 'Open resources' }}
                        </a>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="px-5 py-8 text-center text-sm text-gray-500">No broken links found.</p>
                }
              }
              @case ('blocked') {
                <p class="border-b border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-600">These sites refused or ignored the automatic check, which large sites often do to cloud servers. They usually work in a browser: open them to confirm.</p>
                @if (checks()?.blockedLinks?.length) {
                  <ul class="divide-y divide-gray-100">
                    @for (problem of checks()!.blockedLinks!; track $index) {
                      <li class="px-5 py-3 text-sm">
                        <p class="font-medium text-[#032D42]">{{ problem.name }} <span class="text-xs font-normal text-gray-500">· {{ problem.where }}</span></p>
                        <a [href]="problem.url" target="_blank" rel="noopener noreferrer" class="block truncate text-xs text-[#007979] hover:underline">{{ problem.url }}</a>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="px-5 py-8 text-center text-sm text-gray-500">None.</p>
                }
              }
              @case ('stale') {
                <p class="border-b border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-600">
                  Published listings never verified, or verified more than {{ checks()?.staleDays ?? 365 }} days ago. Call or check each one, then tick Verified in Resources.
                </p>
                @if (checks()?.staleResources?.length) {
                  <ul class="divide-y divide-gray-100">
                    @for (item of checks()!.staleResources!; track item.resourceId) {
                      <li class="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <a [routerLink]="['/resources', item.resourceSlug]" target="_blank" class="min-w-0 flex-1 truncate font-medium text-[#032D42] hover:text-[#007979]">{{ item.name }}</a>
                        <span class="shrink-0 text-xs {{ item.days === null ? 'text-red-600' : 'text-amber-700' }}">
                          {{ item.days === null ? 'Never verified' : 'Verified ' + item.days + ' days ago' }}
                        </span>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="px-5 py-8 text-center text-sm text-gray-500">Every listing was verified within the last year.</p>
                }
              }
              @case ('duplicates') {
                @if (checks()?.duplicateGroups?.length) {
                  <ul class="divide-y divide-gray-100">
                    @for (group of checks()!.duplicateGroups!; track group.kind + group.value) {
                      <li class="px-5 py-3 text-sm">
                        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Same {{ group.kind }}: <span class="normal-case tracking-normal text-gray-700">{{ group.value }}</span></p>
                        <ul class="mt-1 space-y-0.5">
                          @for (resource of group.resources; track resource.resourceId) {
                            <li>
                              <a [routerLink]="['/resources', resource.resourceSlug]" target="_blank" class="font-medium text-[#032D42] hover:text-[#007979]">{{ resource.name }}</a>
                            </li>
                          }
                        </ul>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="px-5 py-8 text-center text-sm text-gray-500">No likely duplicates.</p>
                }
              }
            }
          </div>
        </section>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <!-- ===================== Usage ===================== -->
          <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="usage-title">
            <div class="flex items-center gap-2">
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none text-[#007979]" aria-hidden="true">insights</mat-icon>
              <h2 id="usage-title" class="text-sm font-semibold text-[#032D42]">AI usage, {{ monthLabel }}</h2>
            </div>

            <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-xl bg-gray-50 px-3 py-2">
                <dt class="text-xs text-gray-500">Requests</dt>
                <dd class="text-lg font-bold text-[#032D42]">
                  {{ (usage()?.calls ?? 0) | number }}
                  @if (settings.monthlyCallLimit) {
                    <span class="text-xs font-medium text-gray-500">/ {{ settings.monthlyCallLimit | number }}</span>
                  }
                </dd>
              </div>
              <div class="rounded-xl bg-gray-50 px-3 py-2">
                <dt class="text-xs text-gray-500">Failed</dt>
                <dd class="text-lg font-bold text-[#032D42]">{{ (usage()?.failures ?? 0) | number }}</dd>
              </div>
              <div class="rounded-xl bg-gray-50 px-3 py-2">
                <dt class="text-xs text-gray-500">Tokens (in / out)</dt>
                <dd class="text-sm font-bold text-[#032D42]">{{ (usage()?.inputTokens ?? 0) | number }} / {{ (usage()?.outputTokens ?? 0) | number }}</dd>
              </div>
              <div class="rounded-xl bg-gray-50 px-3 py-2">
                <dt class="text-xs text-gray-500">Estimated cost</dt>
                <dd class="text-lg font-bold text-[#032D42]">
                  @if (pricesSet()) {
                    {{ (usage()?.estimatedCost ?? 0) | number: '1.2-4' }} USD
                  } @else {
                    <span class="text-xs font-medium text-gray-500">Set prices →</span>
                  }
                </dd>
              </div>
            </dl>

            @if (usage()?.calls) {
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 class="text-xs font-semibold text-gray-500">By app</h3>
                  <ul class="mt-1 space-y-1 text-sm">
                    @for (row of byApp(); track row.key) {
                      <li class="flex justify-between gap-2"><span>{{ row.label }}</span><span class="font-semibold text-[#032D42]">{{ row.calls | number }}</span></li>
                    }
                  </ul>
                </div>
                <div>
                  <h3 class="text-xs font-semibold text-gray-500">By task</h3>
                  <ul class="mt-1 space-y-1 text-sm">
                    @for (row of byTask(); track row.key) {
                      <li class="flex justify-between gap-2"><span>{{ row.label }}</span><span class="font-semibold text-[#032D42]">{{ row.calls | number }}</span></li>
                    }
                  </ul>
                </div>
              </div>
            }

            <h3 class="mt-5 text-xs font-semibold text-gray-500">Latest requests</h3>
            @if (log().length) {
              <ul class="mt-1 divide-y divide-gray-100 text-sm">
                @for (entry of log(); track entry.id) {
                  <li class="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-1.5">
                    <mat-icon class="!h-4 !w-4 !text-base !leading-none {{ entry.ok ? 'text-green-600' : 'text-red-600' }}" [attr.aria-label]="entry.ok ? 'Done' : 'Failed'">{{ entry.ok ? 'check_circle' : 'error' }}</mat-icon>
                    <span class="min-w-0 flex-1 truncate">{{ taskLabel(entry.task) }} · {{ appLabel(entry.app) }}</span>
                    <span class="text-xs text-gray-500">{{ entry.inputTokens + entry.outputTokens | number }} tokens · {{ entry.ms / 1000 | number: '1.1-1' }} s</span>
                    <span class="text-xs text-gray-400">{{ entry.at?.toDate() | date: 'MMM d, h:mm a' }}</span>
                  </li>
                }
              </ul>
            } @else {
              <p class="mt-1 text-sm text-gray-500">No AI requests yet.</p>
            }
          </section>

          <!-- ===================== Settings ===================== -->
          <form (ngSubmit)="saveSettings()" class="space-y-3 self-start rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="settings-title">
            <div class="flex items-center gap-2">
              <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none text-[#007979]" aria-hidden="true">tune</mat-icon>
              <h2 id="settings-title" class="text-sm font-semibold text-[#032D42]">AI settings</h2>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-800">
              <input type="checkbox" name="enabled" [(ngModel)]="settings.enabled" class="h-4 w-4 rounded border-gray-300 text-[#007979] focus:ring-[#007979]" />
              AI tools on
            </label>
            <label class="block text-xs font-semibold text-gray-600">
              Requests per month (whole platform, 0 = no limit)
              <input type="number" min="0" name="monthly" [(ngModel)]="settings.monthlyCallLimit" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
            </label>
            <label class="block text-xs font-semibold text-gray-600">
              Requests per person per day (0 = no limit)
              <input type="number" min="0" name="daily" [(ngModel)]="settings.userDailyLimit" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
            </label>
            <label class="block text-xs font-semibold text-gray-600">
              Model (empty = the help assistant's model)
              <input type="text" name="model" [(ngModel)]="settings.model" placeholder="gemini-2.5-flash-lite" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
            </label>
            <fieldset class="rounded-lg border border-gray-200 p-3">
              <legend class="px-1 text-xs font-semibold text-gray-600">Price per million tokens (USD), for estimates</legend>
              <div class="grid grid-cols-2 gap-2">
                <label class="text-xs text-gray-600">
                  Input
                  <input type="number" min="0" step="0.01" name="inCost" [(ngModel)]="settings.inputCostPerMillion" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm" />
                </label>
                <label class="text-xs text-gray-600">
                  Output
                  <input type="number" min="0" step="0.01" name="outCost" [(ngModel)]="settings.outputCostPerMillion" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm" />
                </label>
              </div>
              <p class="mt-2 text-[11px] leading-4 text-gray-500">Copy them from Google's Gemini pricing page for your model.</p>
            </fieldset>
            <button type="submit" [disabled]="saving()" class="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#007979] text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
              {{ saving() ? 'Saving…' : 'Save settings' }}
            </button>
          </form>
        </div>
      </div>
    </main>
  `,
})
export class AiContentAdminComponent implements OnInit {
  private readonly toast = inject(HotToastService);

  protected settings: EngineSettings = { ...DEFAULTS };
  protected readonly usage = signal<MonthUsage | null>(null);
  protected readonly log = signal<UsageLogEntry[]>([]);
  protected readonly checks = signal<ContentChecks | null>(null);
  protected readonly saving = signal(false);
  protected readonly checking = signal(false);
  protected readonly checkTab = signal<'broken' | 'blocked' | 'stale' | 'duplicates'>('broken');
  protected readonly pricesSet = signal(false);

  private readonly month = new Date().toISOString().slice(0, 7);
  protected readonly monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  protected readonly tabs = computed(() => {
    const value = this.checks();
    return [
      { key: 'broken' as const, label: 'Broken links', count: value?.brokenLinks?.length ?? 0, tone: 'bg-red-100 text-red-700' },
      { key: 'blocked' as const, label: 'Could not check', count: value?.blockedLinks?.length ?? 0, tone: 'bg-gray-200 text-gray-700' },
      { key: 'stale' as const, label: 'Out of date', count: value?.staleResources?.length ?? 0, tone: 'bg-amber-100 text-amber-800' },
      { key: 'duplicates' as const, label: 'Possible duplicates', count: value?.duplicateGroups?.length ?? 0, tone: 'bg-amber-100 text-amber-800' },
    ];
  });

  protected readonly byApp = computed(() => this.rows(this.usage()?.apps, APP_LABELS));
  protected readonly byTask = computed(() => this.rows(this.usage()?.tasks, TASK_LABELS));

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [settingsSnap, usageSnap, logSnap, checksSnap] = await Promise.all([
        getDoc(doc(firestore, 'aiEngineConfig', 'settings')),
        getDoc(doc(firestore, 'aiUsage', this.month)),
        getDocs(query(collection(firestore, 'aiUsageLog'), orderBy('at', 'desc'), limit(15))),
        getDoc(doc(firestore, 'contentChecks', 'latest')),
      ]);
      this.settings = { ...DEFAULTS, ...((settingsSnap.data() as Partial<EngineSettings>) ?? {}) };
      this.pricesSet.set(!!(this.settings.inputCostPerMillion || this.settings.outputCostPerMillion));
      this.usage.set((usageSnap.data() as MonthUsage) ?? null);
      this.log.set(logSnap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<UsageLogEntry, 'id'>) })));
      this.checks.set((checksSnap.data() as ContentChecks) ?? null);
    } catch (error) {
      console.error('Failed to load AI and content checks:', error);
      this.toast.error('Unable to load this page. Deploy the latest database rules?');
    }
  }

  protected async saveSettings(): Promise<void> {
    const number = (value: unknown, max: number) => Math.min(max, Math.max(0, Number(value) || 0));
    const model = this.settings.model.trim().toLowerCase();
    if (model && !/^gemini-[a-z0-9.-]{1,60}$/.test(model)) {
      this.toast.error('The model name should look like gemini-2.5-flash-lite.');
      return;
    }
    this.saving.set(true);
    try {
      const value: EngineSettings = {
        enabled: !!this.settings.enabled,
        monthlyCallLimit: Math.round(number(this.settings.monthlyCallLimit, 1_000_000)),
        userDailyLimit: Math.round(number(this.settings.userDailyLimit, 10_000)),
        model,
        inputCostPerMillion: number(this.settings.inputCostPerMillion, 1000),
        outputCostPerMillion: number(this.settings.outputCostPerMillion, 1000),
      };
      await setDoc(doc(firestore, 'aiEngineConfig', 'settings'), { ...value, updatedAt: serverTimestamp() });
      this.settings = value;
      this.pricesSet.set(!!(value.inputCostPerMillion || value.outputCostPerMillion));
      this.toast.success('AI settings saved.');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      this.toast.error('Could not save the settings.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async runChecks(): Promise<void> {
    this.checking.set(true);
    try {
      const run = httpsCallable<void, { broken: number; stale: number; duplicates: number }>(firebaseFunctions, 'runContentChecksNow', {
        timeout: 540_000,
      });
      const result = await run();
      this.toast.success(`Done: ${result.data.broken} broken links, ${result.data.stale} out of date, ${result.data.duplicates} possible duplicates.`);
      const snapshot = await getDoc(doc(firestore, 'contentChecks', 'latest'));
      this.checks.set((snapshot.data() as ContentChecks) ?? null);
    } catch (error) {
      console.error('Content checks failed:', error);
      this.toast.error('The checks could not run. Are the functions deployed?');
    } finally {
      this.checking.set(false);
    }
  }

  protected fixLink(problem: LinkProblem): string {
    return problem.topicKey ? '/admin/topics' : '/admin/resources';
  }

  protected appLabel(key: string): string {
    return APP_LABELS[key] ?? key;
  }

  protected taskLabel(key: string): string {
    return TASK_LABELS[key] ?? key;
  }

  private rows(source: Record<string, UsageCounter> | undefined, labels: Record<string, string>) {
    return Object.entries(source ?? {})
      .map(([key, value]) => ({ key, label: labels[key] ?? key, calls: value.calls ?? 0 }))
      .sort((a, b) => b.calls - a.calls);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { doc, getDoc, setDoc } from 'firebase/firestore';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { firestore } from '../../../../../core/services/firebase-config';
import { AuthService } from '../../../../../core/services/auth.service';
import { LoggerService } from '../../../../../core/services/logger.service';

import { GUIDE_ARTICLES, GUIDE_EDITION, GuideArticle } from './guide-articles';

type ImportOutcome = 'new' | 'update' | 'unchanged' | 'kept' | 'conflict';

/** The summary cards, which also filter the table. */
type StatKey = 'new' | 'update' | 'unchanged' | 'kept';

const STAT_OUTCOMES: Record<StatKey, ImportOutcome[]> = {
  new: ['new'],
  update: ['update'],
  unchanged: ['unchanged'],
  kept: ['kept', 'conflict'],
};

interface ImportRow {
  article: GuideArticle;
  id: string;
  outcome: ImportOutcome | null;
  done: boolean;
  error: string | null;
}

const SOURCE = 'platform-guide';
const ARTICLES = 'knowledgeArticles';
const VERSIONS = 'knowledgeArticleVersions';

const OUTCOME_LABELS: Record<ImportOutcome, string> = {
  new: 'New',
  update: 'Text changed: will update',
  unchanged: 'Up to date',
  kept: 'Edited in the Knowledge Center: kept',
  conflict: 'Another article uses this ID: kept',
};

/**
 * Platform-admin page that imports the Zebron Platform Guide into the
 * Knowledge Center as individual articles.
 *
 * Safe to run again:
 * - IDs are fixed (guide-<slug>), so nothing is duplicated.
 * - An article whose guide text changed is updated; its previous text is
 *   saved as a version first and the version number goes up.
 * - An article an admin has edited, published, archived or restored since
 *   the last import (updatedAt differs from metadata.importedAt) is kept.
 */
@Component({
  selector: 'app-knowledge-guide-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-5 px-4 py-6">
      <a routerLink="/admin/knowledge" class="inline-flex items-center gap-1 text-sm text-[#2a835f] hover:underline">
        <mat-icon class="!h-4 !w-4 !text-[16px]">arrow_back</mat-icon>
        Knowledge Center
      </a>

      <header class="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <h1 class="text-xl font-semibold text-gray-900">Import guide articles</h1>
            <p class="mt-1 text-sm text-gray-600">
              {{ rows().length }} articles from the Zebron Platform Guide (edition {{ edition }}): training,
              how-to and troubleshooting topics for members, organization managers, Zebron support and developers.
            </p>
            <p class="mt-2 text-sm text-gray-600">
              Running it again only updates articles whose guide text changed (the old text is saved as a version)
              and never overwrites an article someone has edited in the Knowledge Center.
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <button mat-stroked-button type="button" (click)="check()" [disabled]="busy()">
              <mat-icon>fact_check</mat-icon>
              <span class="ml-1">Check</span>
            </button>
            <button mat-flat-button color="primary" type="button" (click)="runImport()" [disabled]="busy()">
              <mat-icon>publish</mat-icon>
              <span class="ml-1">Import</span>
            </button>
          </div>
        </div>

        <fieldset class="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <legend class="sr-only">Status for new articles</legend>
          <span class="font-medium">New articles:</span>
          <label class="inline-flex items-center gap-2">
            <input type="radio" name="status" [checked]="publishNew()" (change)="publishNew.set(true)" />
            Publish
          </label>
          <label class="inline-flex items-center gap-2">
            <input type="radio" name="status" [checked]="!publishNew()" (change)="publishNew.set(false)" />
            Save as drafts to review first
          </label>
        </fieldset>

        @if (busy()) {
          <mat-progress-bar class="mt-4" mode="determinate" [value]="progress()"></mat-progress-bar>
        }

        @if (message()) {
          <p class="mt-4 rounded-lg px-3 py-2 text-sm"
             [class]="failed() ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-900'">
            {{ message() }}
          </p>
        }
      </header>

      <!-- Summary cards: click one to show only those articles; click again to show all. -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Filter articles by status">
        @for (stat of stats(); track stat.key) {
          <button
            type="button"
            class="rounded-xl border border-emerald-100 bg-white p-3 text-left shadow-sm transition
                   hover:border-emerald-300 disabled:hover:border-emerald-100
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007979]
                   disabled:cursor-default disabled:opacity-60"
            [style.border-color]="filter() === stat.key ? '#007979' : null"
            [style.background-color]="filter() === stat.key ? '#ecfdf5' : null"
            [style.box-shadow]="filter() === stat.key ? '0 0 0 2px rgba(0, 121, 121, 0.25)' : null"
            [attr.aria-pressed]="filter() === stat.key"
            [disabled]="stat.value === 0 && filter() !== stat.key"
            [title]="filter() === stat.key ? 'Show all articles' : 'Show only: ' + stat.label"
            (click)="toggleFilter(stat.key)"
          >
            <div class="text-2xl font-semibold text-gray-900">{{ stat.value }}</div>
            <div class="text-xs text-gray-600">{{ stat.label }}</div>
          </button>
        }
      </div>

      @if (filter()) {
        <div class="-mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700" aria-live="polite">
          <span>Showing {{ visibleRows().length }} of {{ rows().length }} articles: {{ filterLabel() }}</span>
          <button type="button" class="font-medium text-[#007979] hover:underline" (click)="filter.set(null)">
            Show all
          </button>
        </div>
      }

      <div class="min-w-0 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th class="px-4 py-3">Article</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Application</th>
              <th class="px-4 py-3">Audience</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of visibleRows(); track row.id) {
              <tr class="border-t border-gray-100 align-top">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ row.article.title }}</div>
                  <div class="mt-0.5 text-xs text-gray-500">{{ row.article.summary }}</div>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ row.article.category }}</td>
                <td class="px-4 py-3 text-gray-700">{{ row.article.contentType }}</td>
                <td class="px-4 py-3 text-gray-700">{{ row.article.applicationKey }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    @for (audience of row.article.audience; track audience) {
                      <span class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">{{ audienceLabel(audience) }}</span>
                    }
                  </div>
                </td>
                <td class="px-4 py-3 text-xs">
                  @if (row.error) {
                    <span class="text-red-700">{{ row.error }}</span>
                  } @else if (row.outcome) {
                    <span [class]="row.done ? 'font-medium text-emerald-800' : 'text-gray-700'">
                      {{ row.done ? doneLabel(row.outcome) : outcomeLabel(row.outcome) }}
                    </span>
                  } @else {
                    <span class="text-gray-400">Not checked</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500">
                  No articles with this status.
                  <button type="button" class="ml-1 font-medium text-[#007979] hover:underline" (click)="filter.set(null)">
                    Show all
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class KnowledgeGuideImportComponent {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);

  protected readonly edition = GUIDE_EDITION;

  protected readonly rows = signal<ImportRow[]>(
    GUIDE_ARTICLES.map((article) => ({
      article,
      id: `guide-${article.slug}`,
      outcome: null,
      done: false,
      error: null,
    })),
  );

  protected readonly publishNew = signal(true);
  protected readonly busy = signal(false);
  protected readonly processed = signal(0);
  protected readonly message = signal('');
  protected readonly failed = signal(false);

  protected readonly progress = computed(() =>
    this.rows().length ? Math.round((this.processed() / this.rows().length) * 100) : 0,
  );

  protected readonly stats = computed(() => {
    const rows = this.rows();
    const count = (...outcomes: ImportOutcome[]) =>
      rows.filter((row) => row.outcome && outcomes.includes(row.outcome)).length;
    const stat = (key: StatKey, label: string) => ({ key, label, value: count(...STAT_OUTCOMES[key]) });
    return [
      stat('new', 'New'),
      stat('update', 'To update'),
      stat('unchanged', 'Up to date'),
      stat('kept', 'Kept (edited or in use)'),
    ];
  });

  /** The card the table is filtered by, or null for all articles. */
  protected readonly filter = signal<StatKey | null>(null);

  protected readonly visibleRows = computed(() => {
    const filter = this.filter();
    if (!filter) return this.rows();
    const outcomes = STAT_OUTCOMES[filter];
    return this.rows().filter((row) => row.outcome !== null && outcomes.includes(row.outcome));
  });

  protected readonly filterLabel = computed(() => this.stats().find((stat) => stat.key === this.filter())?.label ?? '');

  protected toggleFilter(key: StatKey): void {
    this.filter.update((current) => (current === key ? null : key));
  }

  protected outcomeLabel(outcome: ImportOutcome | null): string {
    return outcome ? OUTCOME_LABELS[outcome] : '';
  }

  protected doneLabel(outcome: ImportOutcome | null): string {
    if (outcome === 'new') return 'Created';
    if (outcome === 'update') return 'Updated (old text saved as a version)';
    return outcome ? OUTCOME_LABELS[outcome] : '';
  }

  protected audienceLabel(audience: string): string {
    switch (audience) {
      case 'user':
        return 'Members & staff';
      case 'admin':
        return 'Managers & admins';
      case 'support':
        return 'Zebron support';
      case 'developer':
        return 'Developers';
      default:
        return 'Everyone';
    }
  }

  /** Work out what an import would do, without writing anything. */
  async check(): Promise<void> {
    await this.process(false);
  }

  async runImport(): Promise<void> {
    await this.process(true);
  }

  private async process(write: boolean): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      this.fail('Sign in as a Zebron platform administrator first.');
      return;
    }

    this.busy.set(true);
    this.processed.set(0);
    this.message.set('');
    this.failed.set(false);

    let errors = 0;

    for (const row of this.rows()) {
      try {
        const outcome = await this.processOne(row, uid, write);
        this.patch(row.id, { outcome, done: write, error: null });
      } catch (error) {
        errors++;
        this.logger.error('KnowledgeGuideImportComponent', `Guide article failed: ${row.id}`, error);
        this.patch(row.id, { error: this.describe(error), done: false });
      }
      this.processed.update((value) => value + 1);
    }

    this.busy.set(false);

    const [created, updated, unchanged, kept] = this.stats().map((stat) => stat.value);
    if (errors) {
      this.fail(`${errors} article(s) failed. Check the Status column; the rest were ${write ? 'imported' : 'checked'}.`);
    } else if (write) {
      this.message.set(
        `Done: ${created} created, ${updated} updated, ${unchanged} already up to date, ${kept} kept. ` +
          'Partners see them by audience and by the applications they have; the help assistant picks them up within about 5 minutes.',
      );
    } else {
      this.message.set(
        `Import would create ${created}, update ${updated}, leave ${unchanged} as they are and keep ${kept}. Nothing has been saved.`,
      );
    }
  }

  private async processOne(row: ImportRow, uid: string, write: boolean): Promise<ImportOutcome> {
    const reference = doc(firestore, ARTICLES, row.id);
    const snapshot = await getDoc(reference);
    const now = new Date().toISOString();
    const article = row.article;

    const fields = {
      applicationKey: article.applicationKey,
      title: article.title,
      summary: article.summary,
      content: article.content,
      contentType: article.contentType,
      category: article.category,
      tags: article.tags,
      audience: article.audience,
    };

    if (!snapshot.exists()) {
      if (write) {
        const publish = this.publishNew();
        await setDoc(reference, {
          id: row.id,
          ...fields,
          status: publish ? 'published' : 'draft',
          version: 1,
          authorId: uid,
          updatedBy: uid,
          createdAt: now,
          updatedAt: now,
          publishedAt: publish ? now : null,
          archivedAt: null,
          downloadable: true,
          metadata: this.metadata(article, now),
        });
      }
      return 'new';
    }

    const existing = snapshot.data() as Record<string, unknown>;
    const metadata = (existing['metadata'] ?? {}) as Record<string, unknown>;

    if (metadata['source'] !== SOURCE) {
      return 'conflict';
    }

    // Any change made in the Knowledge Center moves updatedAt away from importedAt.
    if (existing['updatedAt'] !== metadata['importedAt']) {
      return 'kept';
    }

    const same =
      existing['applicationKey'] === fields.applicationKey &&
      existing['title'] === fields.title &&
      (existing['summary'] ?? '') === fields.summary &&
      existing['content'] === fields.content &&
      existing['contentType'] === fields.contentType &&
      existing['category'] === fields.category &&
      JSON.stringify(existing['tags'] ?? []) === JSON.stringify(fields.tags) &&
      JSON.stringify(existing['audience'] ?? []) === JSON.stringify(fields.audience);

    if (same) {
      return 'unchanged';
    }

    if (write) {
      const version = typeof existing['version'] === 'number' ? existing['version'] : 1;
      const versionId = `${row.id}-v${version}`;
      const versionReference = doc(firestore, VERSIONS, versionId);

      // Versions are create-only; skip if a previous run already saved this one.
      if (!(await getDoc(versionReference)).exists()) {
        await setDoc(versionReference, {
          id: versionId,
          articleId: row.id,
          version,
          title: existing['title'] ?? '',
          summary: existing['summary'] ?? null,
          content: existing['content'] ?? '',
          contentType: existing['contentType'] ?? 'documentation',
          category: existing['category'] ?? '',
          tags: existing['tags'] ?? [],
          audience: existing['audience'] ?? ['all'],
          createdBy: uid,
          createdAt: now,
          publishedAt: existing['publishedAt'] ?? null,
          archivedAt: existing['archivedAt'] ?? null,
        });
      }

      const status = existing['status'] === 'draft' ? 'draft' : 'published';
      await setDoc(reference, {
        id: row.id,
        ...fields,
        status,
        version: version + 1,
        authorId: typeof existing['authorId'] === 'string' ? existing['authorId'] : uid,
        updatedBy: uid,
        createdAt: typeof existing['createdAt'] === 'string' ? existing['createdAt'] : now,
        updatedAt: now,
        publishedAt: status === 'published' ? now : null,
        archivedAt: null,
        downloadable: existing['downloadable'] !== false,
        metadata: this.metadata(article, now),
      });
    }

    return 'update';
  }

  private metadata(article: GuideArticle, now: string): Record<string, unknown> {
    return {
      source: SOURCE,
      guideSlug: article.slug,
      guideEdition: GUIDE_EDITION,
      importedAt: now,
    };
  }

  private patch(id: string, change: Partial<ImportRow>): void {
    this.rows.update((rows) => rows.map((row) => (row.id === id ? { ...row, ...change } : row)));
  }

  private fail(text: string): void {
    this.failed.set(true);
    this.message.set(text);
  }

  private describe(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'permission-denied') {
      return 'Refused by the database: platform administrators only.';
    }
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

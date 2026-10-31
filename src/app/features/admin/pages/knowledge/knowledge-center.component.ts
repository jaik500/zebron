import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatMenuModule } from '@angular/material/menu';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  KnowledgeContentType,
} from '../../../../core/models/knowledge-article.model';

import { KnowledgeArticleService } from '../../../../core/services/knowledge-article.service';

import { KnowledgePdfService } from '../../../../core/services/knowledge-pdf.service';

import { KNOWLEDGE_CONFIGURATION } from '../../../../core/config/knowledge.config';

import { LoggerService } from '../../../../core/services/logger.service';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { KnowledgeReportsPanelComponent } from '../../../partner/knowledge/knowledge-reports-panel.component';
type KnowledgeStatusFilter = 'all' | KnowledgeArticleStatus;

@Component({
  selector: 'app-knowledge-center',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule, MatFormFieldModule, MatInputModule, MatSelectModule, KnowledgeReportsPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-7xl min-w-0 px-4 pb-12 pt-20 sm:px-6">
      <!-- Header -->
      <header class="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0">
          <nav class="flex items-center gap-1 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
            <span>Admin</span>
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400" aria-hidden="true">chevron_right</mat-icon>
            <span>Configuration</span>
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400" aria-hidden="true">chevron_right</mat-icon>
            <span class="text-slate-700">Knowledge Center</span>
          </nav>

          <div class="mt-3 flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2a835f] text-white shadow-sm">
              <mat-icon aria-hidden="true">menu_book</mat-icon>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Knowledge Center</h1>
              <p class="mt-0.5 text-sm text-slate-500">
                Documentation, guides, troubleshooting and learning material for partners, Zebron support and the help assistant.
              </p>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <button mat-stroked-button type="button" class="!rounded-lg" (click)="importGuide()">
            <mat-icon>library_add</mat-icon>
            <span>Import guide articles</span>
          </button>
          <button mat-flat-button color="primary" type="button" class="!rounded-lg" (click)="createArticle()">
            <mat-icon>add</mat-icon>
            <span>New article</span>
          </button>
        </div>
      </header>

      <!-- Reports from readers on Zebron articles -->
      <div class="mt-6">
        <app-knowledge-reports-panel [organizationId]="null" />
      </div>

      <!-- Summary -->
      <div class="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        @for (card of summaryCards(); track card.key) {
          <button
            type="button"
            [class]="statusFilter() === card.key
              ? 'group min-w-0 rounded-xl border border-[#2a835f] bg-white p-4 text-left shadow-sm ring-2 ring-[#2a835f]/15 transition'
              : 'group min-w-0 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow'"
            [attr.aria-pressed]="statusFilter() === card.key"
            (click)="selectStatus(card.key)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-xs font-semibold uppercase tracking-wider text-slate-500">{{ card.label }}</span>
              <span [class]="'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' + card.tone">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ card.icon }}</mat-icon>
              </span>
            </div>
            <div class="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{{ card.value }}</div>
          </button>
        }
      </div>

      <!-- Toolbar -->
      <section class="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="grid min-w-0 grid-cols-1 gap-x-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <mat-form-field appearance="outline" class="zb-field zb-search">
            <mat-label>Search</mat-label>
            <mat-icon matPrefix aria-hidden="true">search</mat-icon>
            <input matInput type="search" placeholder="Title, text or tag" [value]="searchTerm()" (input)="onSearch($event)" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>Application</mat-label>
            <mat-select [value]="applicationKey()" (selectionChange)="onApplicationChange($event.value)">
              <mat-option value="">All applications</mat-option>
              @for (application of applications; track application.key) {
                <mat-option [value]="application.key">{{ application.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>Category</mat-label>
            <mat-select [value]="category()" (selectionChange)="category.set($event.value)">
              <mat-option value="">All categories</mat-option>
              @for (item of categories(); track item) {
                <mat-option [value]="item">{{ item }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>Content type</mat-label>
            <mat-select [value]="contentType()" (selectionChange)="onContentTypeChange($event.value)">
              <mat-option value="">All content types</mat-option>
              @for (type of contentTypes; track type) {
                <mat-option [value]="type">{{ contentTypeLabel(type) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div class="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Status">
            @for (status of statusTabs; track status.key) {
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="statusFilter() === status.key"
                [class]="statusFilter() === status.key
                  ? 'shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm'
                  : 'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900'"
                (click)="selectStatus(status.key)"
              >
                {{ status.label }}
              </button>
            }
          </div>

          <div class="flex items-center gap-3 text-sm text-slate-500">
            <span>{{ filteredArticles().length }} of {{ articles().length }} articles</span>
            @if (hasFilters()) {
              <button type="button" class="inline-flex items-center gap-1 font-medium text-[#2a835f] hover:underline" (click)="clearFilters()">
                <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">filter_alt_off</mat-icon>
                Clear filters
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Error -->
      @if (errorMessage()) {
        <div class="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <mat-icon class="shrink-0 text-red-600" aria-hidden="true">error_outline</mat-icon>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-red-800">{{ errorMessage() }}</p>
            <button mat-stroked-button type="button" class="mt-3" (click)="loadArticles()">
              <mat-icon>refresh</mat-icon>
              <span>Try again</span>
            </button>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (isLoading()) {
        <div class="mt-6 flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div class="flex flex-col items-center gap-3">
            <mat-spinner diameter="32"></mat-spinner>
            <span class="text-sm text-slate-500">Loading articles…</span>
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!isLoading() && !errorMessage() && filteredArticles().length === 0) {
        <div class="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <mat-icon class="text-slate-500" aria-hidden="true">search_off</mat-icon>
          </div>
          <h2 class="mt-4 font-semibold text-slate-900">
            {{ articles().length ? 'No articles match these filters' : 'No articles yet' }}
          </h2>
          <p class="mt-1 max-w-md text-sm text-slate-500">
            {{ articles().length ? 'Change or clear the filters to see more.' : 'Write your first article, or import the Zebron Platform Guide.' }}
          </p>
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            @if (articles().length) {
              <button mat-stroked-button type="button" (click)="clearFilters()">Clear filters</button>
            } @else {
              <button mat-stroked-button type="button" (click)="importGuide()">Import guide articles</button>
            }
            <button mat-flat-button color="primary" type="button" (click)="createArticle()">New article</button>
          </div>
        </div>
      }

      <!-- Articles -->
      @if (!isLoading() && filteredArticles().length > 0) {
        <div class="mt-6 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="hidden grid-cols-[minmax(0,1fr)_150px_120px_110px_96px_48px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <span>Article</span>
            <span>Application</span>
            <span>Type</span>
            <span>Status</span>
            <span>Updated</span>
            <span class="sr-only">Actions</span>
          </div>

          <ul class="divide-y divide-slate-100">
            @for (article of filteredArticles(); track article.id) {
              <li class="group grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_150px_120px_110px_96px_48px] lg:items-center">
                <button type="button" class="min-w-0 text-left" (click)="viewArticle(article)">
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="truncate font-medium text-slate-900 group-hover:text-[#2a835f]">{{ article.title }}</span>
                    <span class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">v{{ article.version }}</span>
                  </div>
                  @if (article.summary) {
                    <p class="mt-0.5 line-clamp-1 text-sm text-slate-500">{{ article.summary }}</p>
                  }
                  <div class="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    @if (article.category) {
                      <span class="inline-flex items-center gap-1">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">folder</mat-icon>
                        {{ article.category }}
                      </span>
                    }
                    <span class="inline-flex items-center gap-1">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">group</mat-icon>
                      {{ audienceLabel(article) }}
                    </span>
                    @if (isGuideArticle(article)) {
                      <span class="inline-flex items-center gap-1 text-[#2a835f]">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">auto_stories</mat-icon>
                        Platform Guide
                      </span>
                    }
                  </div>
                </button>

                <!-- Mobile: status + menu on the right -->
                <div class="flex items-start justify-end gap-1 lg:hidden">
                  <span [class]="statusClass(article.status)">{{ statusLabel(article.status) }}</span>
                </div>

                <span class="hidden truncate text-sm text-slate-700 lg:block">{{ applicationName(article.applicationKey) }}</span>
                <span class="hidden truncate text-sm text-slate-700 lg:block">{{ contentTypeLabel(article.contentType) }}</span>
                <span class="hidden lg:block"><span [class]="statusClass(article.status)">{{ statusLabel(article.status) }}</span></span>
                <span class="hidden text-sm tabular-nums text-slate-500 lg:block">{{ article.updatedAt | date: 'MMM d, y' }}</span>

                <div class="col-span-2 flex items-center justify-between gap-2 lg:col-span-1 lg:justify-end">
                  <span class="text-xs text-slate-500 lg:hidden">
                    {{ applicationName(article.applicationKey) }} · {{ contentTypeLabel(article.contentType) }} · {{ article.updatedAt | date: 'MMM d, y' }}
                  </span>
                  <button
                    mat-icon-button
                    type="button"
                    [matMenuTriggerFor]="articleMenu"
                    [matMenuTriggerData]="{ article }"
                    [attr.aria-label]="'Actions for ' + article.title"
                    matTooltip="Actions"
                  >
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </div>
              </li>
            }
          </ul>
        </div>
      }
    </section>

    <!-- Article actions menu -->
    <mat-menu #articleMenu="matMenu" xPosition="before">
      <ng-template matMenuContent let-article="article">
        <button mat-menu-item (click)="viewArticle(article)">
          <mat-icon>visibility</mat-icon>
          <span>View</span>
        </button>

        @if (article.status === 'draft') {
          <button mat-menu-item (click)="editArticle(article)">
            <mat-icon>edit</mat-icon>
            <span>Edit</span>
          </button>
          <button mat-menu-item (click)="publishArticle(article)">
            <mat-icon>publish</mat-icon>
            <span>Publish</span>
          </button>
        }

        @if (article.status === 'published') {
          <button mat-menu-item (click)="createVersion(article)">
            <mat-icon>library_add</mat-icon>
            <span>Create new version</span>
          </button>
          <button mat-menu-item (click)="archiveArticle(article)">
            <mat-icon>archive</mat-icon>
            <span>Archive</span>
          </button>
        }

        @if (article.status === 'archived') {
          <button mat-menu-item (click)="restoreArticle(article)">
            <mat-icon>unarchive</mat-icon>
            <span>Restore to drafts</span>
          </button>
        }

        @if (article.downloadable) {
          <mat-divider></mat-divider>
          <button mat-menu-item [disabled]="downloadingId() === article.id" (click)="downloadPdf(article)">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>{{ downloadingId() === article.id ? 'Preparing PDF…' : 'Download PDF' }}</span>
          </button>
        }
      </ng-template>
    </mat-menu>
  `,
})
export class KnowledgeCenterComponent implements OnInit {
  private readonly authService = inject(AuthService);

  private readonly knowledgeService = inject(KnowledgeArticleService);

  private readonly pdfService = inject(KnowledgePdfService);

  private readonly router = inject(Router);

  private readonly logger = inject(LoggerService);

  readonly applications = KNOWLEDGE_CONFIGURATION.applications;

  readonly contentTypes = KNOWLEDGE_CONFIGURATION.contentTypes;

  readonly statusTabs: Array<{
    key: KnowledgeStatusFilter;
    label: string;
  }> = [
    {
      key: 'all',
      label: 'All',
    },
    {
      key: 'draft',
      label: 'Drafts',
    },
    {
      key: 'published',
      label: 'Published',
    },
    {
      key: 'archived',
      label: 'Archived',
    },
  ];

  readonly articles = signal<KnowledgeArticle[]>([]);

  readonly isLoading = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly searchTerm = signal('');

  readonly applicationKey = signal('');

  readonly contentType = signal<KnowledgeContentType | ''>('');

  readonly statusFilter = signal<KnowledgeStatusFilter>('all');

  readonly downloadingId = signal<string | null>(null);

  readonly category = signal('');

  /** Categories used by the loaded articles, for the filter. */
  readonly categories = computed(() =>
    [...new Set(this.articles().map((article) => article.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  readonly hasFilters = computed(
    () =>
      !!this.searchTerm().trim() ||
      !!this.applicationKey() ||
      !!this.contentType() ||
      !!this.category() ||
      this.statusFilter() !== 'all',
  );

  /** Articles matching every filter except status (drives the counts). */
  private readonly matchingArticles = computed(() => {
    let results = this.articles();
    const application = this.applicationKey();
    const type = this.contentType();
    const category = this.category();
    const search = this.searchTerm().trim().toLowerCase();

    if (application) {
      results = results.filter((article) => article.applicationKey === application);
    }
    if (type) {
      results = results.filter((article) => article.contentType === type);
    }
    if (category) {
      results = results.filter((article) => article.category === category);
    }
    if (search) {
      results = results.filter(
        (article) =>
          article.title.toLowerCase().includes(search) ||
          article.summary?.toLowerCase().includes(search) ||
          article.category.toLowerCase().includes(search) ||
          article.content.toLowerCase().includes(search) ||
          article.tags.some((tag) => tag.toLowerCase().includes(search)),
      );
    }
    return results;
  });

  /**
   * Page title service.
   */
  private readonly pageTitleService = inject(PageTitleService);

  readonly summaryCards = computed(() => {
    const articles = this.matchingArticles();
    const count = (status: KnowledgeArticleStatus) =>
      articles.filter((article) => article.status === status).length;

    return [
      { key: 'all' as KnowledgeStatusFilter, label: 'All articles', value: articles.length, icon: 'menu_book', tone: 'bg-slate-100 text-slate-600' },
      { key: 'published' as KnowledgeStatusFilter, label: 'Published', value: count('published'), icon: 'check_circle', tone: 'bg-emerald-50 text-emerald-700' },
      { key: 'draft' as KnowledgeStatusFilter, label: 'Drafts', value: count('draft'), icon: 'edit_note', tone: 'bg-amber-50 text-amber-700' },
      { key: 'archived' as KnowledgeStatusFilter, label: 'Archived', value: count('archived'), icon: 'inventory_2', tone: 'bg-slate-100 text-slate-500' },
    ];
  });

  readonly filteredArticles = computed(() => {
    const status = this.statusFilter();
    const results = this.matchingArticles();
    return status === 'all' ? results : results.filter((article) => article.status === status);
  });

  ngOnInit(): void {
    void this.loadArticles();
    this.pageTitleService.setTitle('Knowledge Center');
  }

  async loadArticles(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      // All articles are loaded once and filtered in the browser, so the
      // counts stay correct whichever filter is selected.
      const articles = await this.knowledgeService.list({});

      this.articles.set(articles);
    } catch (error) {
      this.logger.error('KnowledgeCenterComponent', 'Failed to load knowledge articles.', error);

      this.errorMessage.set('The knowledge articles could not be loaded. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  onApplicationChange(applicationKey: string): void {
    this.applicationKey.set(applicationKey);
  }

  onContentTypeChange(contentType: KnowledgeContentType | ''): void {
    this.contentType.set(contentType);
  }

  selectStatus(status: KnowledgeStatusFilter): void {
    this.statusFilter.set(status);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.applicationKey.set('');
    this.contentType.set('');
    this.statusFilter.set('all');
    this.category.set('');
  }

  applicationName(applicationKey: string): string {
    return (
      this.applications.find((application) => application.key === applicationKey)?.name ??
      applicationKey
    );
  }

  contentTypeLabel(type: KnowledgeContentType): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  statusClass(status: KnowledgeArticleStatus): string {
    const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ';
    if (status === 'published') return base + 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (status === 'draft') return base + 'bg-amber-50 text-amber-800 ring-amber-600/20';
    return base + 'bg-slate-100 text-slate-600 ring-slate-500/20';
  }

  audienceLabel(article: KnowledgeArticle): string {
    const labels: Record<string, string> = {
      all: 'Everyone',
      user: 'Members',
      admin: 'Org admins',
      support: 'Zebron support',
      developer: 'Developers',
    };
    if (article.audience.includes('all')) return labels['all'];
    return article.audience.map((audience) => labels[audience] ?? audience).join(', ');
  }

  isGuideArticle(article: KnowledgeArticle): boolean {
    return article.metadata?.['source'] === 'platform-guide';
  }

  statusLabel(status: KnowledgeArticleStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

importGuide(): void {
  void this.router.navigate([
    '/admin/configuration/knowledge/import-guide',
  ]);
}

createArticle(): void {
  this.logger.info(
    'KnowledgeCenterComponent',
    'Navigating to new knowledge article editor.',
  );

  void this.router.navigate([
    '/admin/configuration/knowledge/new',
  ]);
}

viewArticle(article: KnowledgeArticle): void {
  this.logger.info(
    'KnowledgeCenterComponent',
    `Navigating to knowledge article: ${article.id}`,
  );

  void this.router.navigate([
    '/admin/configuration/knowledge',
    article.id,
  ]);
}

 editArticle(article: KnowledgeArticle): void {
  this.logger.info(
    'KnowledgeCenterComponent',
    `Navigating to edit knowledge article: ${article.id}`,
  );

  void this.router.navigate([
    '/admin/configuration/knowledge',
    article.id,
    'edit',
  ]);
}
 async createVersion(article: KnowledgeArticle): Promise<void> {
  if (article.status !== 'published') {
    this.errorMessage.set(
      'A new version can only be created from a published article.',
    );
    return;
  }

  const createdBy = this.getCurrentUserId();

  if (!createdBy) {
    this.errorMessage.set(
      'Your authenticated user could not be identified.',
    );
    return;
  }

  this.errorMessage.set(null);

  try {
    this.logger.info(
      'KnowledgeCenterComponent',
      `Creating new version for knowledge article: ${article.id}`,
    );

    const draft =
      await this.knowledgeService.createVersionDraft(
        article.id,
        createdBy,
      );

    this.logger.info(
      'KnowledgeCenterComponent',
      `Created knowledge article version ${draft.version}: ${draft.id}`,
    );

    await this.router.navigate([
      '/admin/configuration/knowledge',
      draft.id,
      'edit',
    ]);
  } catch (error) {
    this.logger.error(
      'KnowledgeCenterComponent',
      `Failed to create version for knowledge article: ${article.id}`,
      error,
    );

    this.errorMessage.set(
      'A new version of the article could not be created.',
    );
  }
}

  async publishArticle(article: KnowledgeArticle): Promise<void> {
    try {
      const updatedBy = this.authService.user()?.id;

      if (!updatedBy) {
        this.errorMessage.set('Your authenticated user could not be identified.');
        return;
      }

      await this.knowledgeService.publish(article.id, updatedBy);

      await this.loadArticles();
    } catch (error) {
      this.logger.error(
        'KnowledgeCenterComponent',
        `Failed to publish article: ${article.id}`,
        error,
      );

      this.errorMessage.set('The article could not be published.');
    }
  }

  async archiveArticle(article: KnowledgeArticle): Promise<void> {
    try {
      const updatedBy = this.authService.user()?.id;

      if (!updatedBy) {
        this.errorMessage.set('Your authenticated user could not be identified.');
        return;
      }

      await this.knowledgeService.archive(article.id, updatedBy);

      await this.loadArticles();
    } catch (error) {
      this.logger.error(
        'KnowledgeCenterComponent',
        `Failed to archive article: ${article.id}`,
        error,
      );

      this.errorMessage.set('The article could not be archived.');
    }
  }

  async restoreArticle(article: KnowledgeArticle): Promise<void> {
    try {
      const updatedBy = this.getCurrentUserId();

      if (!updatedBy) {
        this.errorMessage.set('Your authenticated user could not be identified.');
        return;
      }

      await this.knowledgeService.restore(article.id, updatedBy);

      await this.loadArticles();
    } catch (error) {
      this.logger.error(
        'KnowledgeCenterComponent',
        `Failed to restore article: ${article.id}`,
        error,
      );

      this.errorMessage.set('The article could not be restored.');
    }
  }

  async downloadPdf(article: KnowledgeArticle): Promise<void> {
    if (this.downloadingId()) {
      return;
    }

    this.downloadingId.set(article.id);

    try {
      await this.pdfService.download(article);
    } catch (error) {
      this.logger.error(
        'KnowledgeCenterComponent',
        `Failed to download article PDF: ${article.id}`,
        error,
      );

      this.errorMessage.set('The PDF could not be generated.');
    } finally {
      this.downloadingId.set(null);
    }
  }

  // Helper
  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }
}

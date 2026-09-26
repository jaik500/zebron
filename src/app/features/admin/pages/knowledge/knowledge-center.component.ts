import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatMenuModule } from '@angular/material/menu';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import {
  KnowledgeArticle,
  KnowledgeArticleFilter,
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

type KnowledgeStatusFilter = 'all' | KnowledgeArticleStatus;

@Component({
  selector: 'app-knowledge-center',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="w-full min-w-0 space-y-6 mt-16">
      <!-- Header -->
      <header
        class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-[#89D7B7]/60 "
      >
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10"
            >
              <mat-icon class="text-white"> menu_book </mat-icon>
            </div>

            <div class="min-w-0">
              <p class=" text-lg text-white/800 text-[white/400]">
                Manage reusable documentation, guides, troubleshooting content, and learning
                material across Zebron.
              </p>
            </div>
          </div>
        </div>

        <button
          mat-flat-button
          color="primary"
          type="button"
          class="shrink-0"
          (click)="createArticle()"
        >
          <mat-icon>add</mat-icon>
          <span class="ml-2">New Article</span>
        </button>
      </header>

      <!-- Summary -->
      <div class="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 px-4">
        @for (card of summaryCards(); track card.key) {
          <button
            type="button"
            class="min-w-0 rounded-xl border border-emerald-100 bg-[#2a835f]/90 p-4 text-left shadow-sm transition hover:border-[#2a835f]/40 hover:bg-[#2a835f]/60 hover:shadow-md"
            (click)="selectStatus(card.key)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-lg font-medium uppercase tracking-wide text-white">
                {{ card.label }}
              </span>

              <mat-icon class="shrink-0 text-[#2a835f]">
                {{ card.icon }}
              </mat-icon>
            </div>

            <div class="mt-1 text-center text-3xl font-semibold text-slate-800">
              {{ card.value }}
            </div>
          </button>
        }
      </div>

      <!-- Filters -->
      <section class="min-w-0 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div class="flex min-w-0 flex-col gap-4">
          <!-- Search -->
          <div class="relative min-w-0">
            <mat-icon
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2a835f]"
            >
              search
            </mat-icon>

            <input
              type="search"
              class="h-11 w-full min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/30 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#2a835f] focus:bg-white focus:ring-2 focus:ring-[#2a835f]/15"
              placeholder="Search articles..."
              [value]="searchTerm()"
              (input)="onSearch($event)"
            />
          </div>

          <!-- Filters -->
          <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              class="h-11 min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/30 px-3 text-sm text-slate-700 outline-none focus:border-[#2a835f] focus:bg-white focus:ring-2 focus:ring-[#2a835f]/15"
              [value]="applicationKey()"
              (change)="onApplicationChange($event)"
            >
              <option value="">All applications</option>

              @for (application of applications; track application.key) {
                <option [value]="application.key">
                  {{ application.name }}
                </option>
              }
            </select>

            <select
              class="h-11 min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/30 px-3 text-sm text-slate-700 outline-none focus:border-[#2a835f] focus:bg-white focus:ring-2 focus:ring-[#2a835f]/15"
              [value]="contentType()"
              (change)="onContentTypeChange($event)"
            >
              <option value="">All content types</option>

              @for (type of contentTypes; track type) {
                <option [value]="type">
                  {{ contentTypeLabel(type) }}
                </option>
              }
            </select>

            <button
              mat-stroked-button
              type="button"
              class="h-11 border-emerald-200 text-[#246f51]"
              (click)="clearFilters()"
            >
              <mat-icon>filter_alt_off</mat-icon>
              <span class="ml-2">Clear Filters</span>
            </button>
          </div>

          <!-- Status tabs -->
          <div class="flex min-w-0 gap-2 overflow-x-auto pb-1">
            @for (status of statusTabs; track status.key) {
              <button
                type="button"
                class="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition"
                [class.border-[#2a835f]]="statusFilter() === status.key"
                [class.bg-[#2a835f]]="statusFilter() === status.key"
                [class.text-white]="statusFilter() === status.key"
                [class.border-emerald-100]="statusFilter() !== status.key"
                [class.bg-emerald-50]="statusFilter() !== status.key"
                [class.text-[#246f51]]="statusFilter() !== status.key"
                (click)="selectStatus(status.key)"
              >
                {{ status.label }}
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Loading -->
      @if (isLoading()) {
        <div
          class="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 mx-4"
        >
          <div class="flex flex-col items-center gap-3">
            <mat-spinner diameter="36"></mat-spinner>

            <span class="text-sm text-slate-500 dark:text-slate-400">
              Loading knowledge articles...
            </span>
          </div>
        </div>
      }

      <!-- Error -->
      @if (!isLoading() && errorMessage()) {
        <div
          class="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20"
        >
          <div class="flex items-start gap-3">
            <mat-icon class="shrink-0 text-red-600"> error_outline </mat-icon>

            <div class="min-w-0">
              <h2 class="font-medium text-red-800 dark:text-red-300">
                Unable to load knowledge articles
              </h2>

              <p class="mt-1 text-sm text-red-700 dark:text-red-400">
                {{ errorMessage() }}
              </p>

              <button mat-stroked-button type="button" class="mt-4" (click)="loadArticles()">
                <mat-icon>refresh</mat-icon>
                <span class="ml-2">Try Again</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Empty -->
      @if (!isLoading() && !errorMessage() && filteredArticles().length === 0) {
        <div
          class="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 "
          >
            <mat-icon class="text-slate-500"> menu_book </mat-icon>
          </div>

          <h2 class="mt-4 font-semibold text-slate-900 dark:text-gray">No articles found</h2>

          <p class="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Try changing your filters or create a new knowledge article.
          </p>

          <button
            mat-flat-button
            color="primary"
            type="button"
            class="mt-4"
            (click)="createArticle()"
          >
            <mat-icon>add</mat-icon>
            <span class="ml-2">Create Article</span>
          </button>
        </div>
      }

      <!-- Articles -->
      @if (!isLoading() && !errorMessage() && filteredArticles().length > 0) {
        <div class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 p-4">
          @for (article of filteredArticles(); track article.id) {
            <article
              class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="p-5">
                <!-- Article heading -->
                <div class="flex min-w-0 items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="break-words text-base font-semibold text-slate-900 dark:text-white">
                      {{ article.title }}
                    </h2>

                    @if (article.summary) {
                      <p class="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {{ article.summary }}
                      </p>
                    }
                  </div>

                  <button
                    mat-icon-button
                    type="button"
                    [matMenuTriggerFor]="articleMenu"
                    [matMenuTriggerData]="{ article }"
                    matTooltip="Article actions"
                  >
                    <mat-icon> more_vert </mat-icon>
                  </button>
                </div>

                <!-- Metadata -->
                <div class="mt-4 flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {{ applicationName(article.applicationKey) }}
                  </span>

                  <span
                    class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {{ contentTypeLabel(article.contentType) }}
                  </span>

                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium"
                    [class.bg-amber-100]="article.status === 'draft'"
                    [class.text-amber-800]="article.status === 'draft'"
                    [class.bg-emerald-100]="article.status === 'published'"
                    [class.text-emerald-800]="article.status === 'published'"
                    [class.bg-slate-200]="article.status === 'archived'"
                    [class.text-slate-700]="article.status === 'archived'"
                  >
                    {{ statusLabel(article.status) }}
                  </span>

                  <span class="text-xs text-slate-400"> v{{ article.version }} </span>
                </div>

                <!-- Tags -->
                @if (article.tags.length > 0) {
                  <div class="mt-4 flex min-w-0 flex-wrap gap-1.5">
                    @for (tag of article.tags.slice(0, 5); track tag) {
                      <span
                        class="rounded bg-slate-50 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800/70 dark:text-slate-400"
                      >
                        #{{ tag }}
                      </span>
                    }
                  </div>
                }

                <!-- Actions -->
                <div
                  class="mt-5 flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800"
                >
                  <button mat-button type="button" (click)="viewArticle(article)">
                    <mat-icon>visibility</mat-icon>
                    <span class="ml-1">View</span>
                  </button>

                  @if (article.downloadable) {
                    <button
                      mat-button
                      type="button"
                      [disabled]="downloadingId() === article.id"
                      (click)="downloadPdf(article)"
                    >
                      <mat-icon>
                        {{ downloadingId() === article.id ? 'hourglass_top' : 'picture_as_pdf' }}
                      </mat-icon>

                      <span class="ml-1">
                        {{ downloadingId() === article.id ? 'Preparing...' : 'PDF' }}
                      </span>
                    </button>
                  }

                  @if (article.status === 'draft') {
                    <button
                      mat-button
                      color="primary"
                      type="button"
                      (click)="publishArticle(article)"
                    >
                      <mat-icon>publish</mat-icon>
                      <span class="ml-1">Publish</span>
                    </button>
                  }

                  @if (article.status === 'published') {
                    <button mat-button type="button" (click)="archiveArticle(article)">
                      <mat-icon>archive</mat-icon>
                      <span class="ml-1">Archive</span>
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <!-- Article actions menu -->
    <mat-menu #articleMenu="matMenu">
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
            <span>Create Version</span>
          </button>

          <button mat-menu-item (click)="archiveArticle(article)">
            <mat-icon>archive</mat-icon>
            <span>Archive</span>
          </button>
        }

        @if (article.status === 'archived') {
          <button mat-menu-item (click)="restoreArticle(article)">
            <mat-icon>unarchive</mat-icon>
            <span>Restore</span>
          </button>
        }

        <mat-divider></mat-divider>

        @if (article.downloadable) {
          <button mat-menu-item (click)="downloadPdf(article)">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>Download PDF</span>
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

  /**
   * Page title service.
   */
  private readonly pageTitleService = inject(PageTitleService);

  readonly summaryCards = computed(() => {
    const articles = this.articles();

    return [
      {
        key: 'all' as KnowledgeStatusFilter,
        label: 'All Articles',
        value: articles.length,
        icon: 'menu_book',
      },
      {
        key: 'draft' as KnowledgeStatusFilter,
        label: 'Drafts',
        value: articles.filter((article) => article.status === 'draft').length,
        icon: 'edit_note',
      },
      {
        key: 'published' as KnowledgeStatusFilter,
        label: 'Published',
        value: articles.filter((article) => article.status === 'published').length,
        icon: 'publish',
      },
      {
        key: 'archived' as KnowledgeStatusFilter,
        label: 'Archived',
        value: articles.filter((article) => article.status === 'archived').length,
        icon: 'archive',
      },
    ];
  });

  readonly filteredArticles = computed(() => {
    let results = this.articles();

    const status = this.statusFilter();

    const application = this.applicationKey();

    const type = this.contentType();

    const search = this.searchTerm().trim().toLowerCase();

    if (status !== 'all') {
      results = results.filter((article) => article.status === status);
    }

    if (application) {
      results = results.filter((article) => article.applicationKey === application);
    }

    if (type) {
      results = results.filter((article) => article.contentType === type);
    }

    if (search) {
      results = results.filter(
        (article) =>
          article.title.toLowerCase().includes(search) ||
          article.summary?.toLowerCase().includes(search) ||
          article.content.toLowerCase().includes(search) ||
          article.tags.some((tag) => tag.toLowerCase().includes(search)),
      );
    }

    return results;
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
      const filter = this.createFilter();

      const articles = await this.knowledgeService.list(filter);

      this.articles.set(articles);
    } catch (error) {
      this.logger.error('KnowledgeCenterComponent', 'Failed to load knowledge articles.', error);

      this.errorMessage.set('The knowledge articles could not be loaded. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private createFilter(): KnowledgeArticleFilter {
    const filter: KnowledgeArticleFilter = {};

    if (this.applicationKey()) {
      filter.applicationKey = this.applicationKey();
    }

    if (this.contentType()) {
      filter.contentType = this.contentType() as KnowledgeContentType;
    }

    if (this.statusFilter() !== 'all') {
      filter.status = this.statusFilter() as KnowledgeArticleStatus;
    }

    return filter;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  onApplicationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.applicationKey.set(select.value);

    void this.loadArticles();
  }

  onContentTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.contentType.set(select.value as KnowledgeContentType | '');

    void this.loadArticles();
  }

  selectStatus(status: KnowledgeStatusFilter): void {
    this.statusFilter.set(status);
    void this.loadArticles();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.applicationKey.set('');
    this.contentType.set('');
    this.statusFilter.set('all');

    void this.loadArticles();
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

  statusLabel(status: KnowledgeArticleStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  KnowledgeArticleVersion,
} from '../../../../../../core/models/knowledge-article.model';

import { KnowledgeArticleService } from '../../../../../../core/services/knowledge-article.service';
import { KnowledgePdfService } from '../../../../../../core/services/knowledge-pdf.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { PageTitleService } from '../../../../../../core/services/page-title.service';

import { KNOWLEDGE_CONFIGURATION } from '../../../../../../core/config/knowledge.config';

@Component({
  selector: 'app-knowledge-article-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-16 w-full min-w-0">
      <!-- Header -->
      <header
        class="flex min-w-0 flex-col gap-4 bg-[#2a835f] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex min-w-0 items-center gap-3">
          <button
            mat-icon-button
            type="button"
            class="shrink-0 text-white"
            aria-label="Back to Knowledge Center"
            matTooltip="Back to Knowledge Center"
            (click)="goBack()"
          >
            <mat-icon>arrow_back</mat-icon>
          </button>

          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"
              >
                <mat-icon class="text-white"> menu_book </mat-icon>
              </div>

              <div class="min-w-0">
                <p class="truncate text-lg font-semibold text-white">Knowledge Article</p>

                <p class="truncate text-sm text-white/80">
                  View reusable Zebron documentation and guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        @if (article(); as currentArticle) {
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <!-- Draft actions -->
            @if (currentArticle.status === 'draft') {
              <button
                mat-stroked-button
                type="button"
                class="border-white/40 text-white"
                (click)="editArticle()"
              >
                <mat-icon> edit </mat-icon>

                <span class="ml-2"> Edit </span>
              </button>

              <button
                mat-flat-button
                type="button"
                class="bg-white text-[#246f51]"
                [disabled]="isPublishing()"
                (click)="publishArticle()"
              >
                <mat-icon>
                  {{ isPublishing() ? 'hourglass_top' : 'publish' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isPublishing() ? 'Publishing...' : 'Publish' }}
                </span>
              </button>
            }

            <!-- Published actions -->
            @if (currentArticle.status === 'published') {
              <button
                mat-stroked-button
                type="button"
                class="border-white/40 text-white"
                [disabled]="isCreatingVersion()"
                (click)="createVersion()"
              >
                <mat-icon>
                  {{ isCreatingVersion() ? 'hourglass_top' : 'library_add' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isCreatingVersion() ? 'Creating...' : 'Create Version' }}
                </span>
              </button>

              <button
                mat-flat-button
                type="button"
                class="bg-white text-[#246f51]"
                [disabled]="isArchiving()"
                (click)="archiveArticle()"
              >
                <mat-icon>
                  {{ isArchiving() ? 'hourglass_top' : 'archive' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isArchiving() ? 'Archiving...' : 'Archive' }}
                </span>
              </button>
            }

            <!-- Archived actions -->
            @if (currentArticle.status === 'archived') {
              <button
                mat-flat-button
                type="button"
                class="bg-white text-[#246f51]"
                [disabled]="isRestoring()"
                (click)="restoreArticle()"
              >
                <mat-icon>
                  {{ isRestoring() ? 'hourglass_top' : 'unarchive' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isRestoring() ? 'Restoring...' : 'Restore' }}
                </span>
              </button>
            }

            <!-- PDF -->
            @if (currentArticle.downloadable) {
              <button
                mat-stroked-button
                type="button"
                class="border-white/40 text-white"
                [disabled]="isDownloading()"
                (click)="downloadPdf()"
              >
                <mat-icon>
                  {{ isDownloading() ? 'hourglass_top' : 'picture_as_pdf' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isDownloading() ? 'Preparing...' : 'PDF' }}
                </span>
              </button>
            }
          </div>
        }
      </header>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="flex min-h-64 items-center justify-center">
          <div class="flex flex-col items-center gap-3">
            <mat-spinner diameter="40"></mat-spinner>

            <span class="text-sm text-slate-500"> Loading knowledge article... </span>
          </div>
        </div>
      }

      <!-- Error -->
      @if (!isLoading() && errorMessage()) {
        <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div class="rounded-xl border border-red-200 bg-red-50 p-5">
            <div class="flex items-start gap-3">
              <mat-icon class="shrink-0 text-red-600"> error_outline </mat-icon>

              <div class="min-w-0">
                <h2 class="font-semibold text-red-800">Unable to load article</h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ errorMessage() }}
                </p>

                <button mat-stroked-button type="button" class="mt-4" (click)="loadArticle()">
                  <mat-icon> refresh </mat-icon>

                  <span class="ml-2"> Try Again </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Article -->
      @if (!isLoading() && !errorMessage() && article(); as currentArticle) {
        <main class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <!-- Article metadata -->
          <div class="rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div class="p-5 sm:p-8">
              <div
                class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div class="min-w-0">
                  <!-- Badges -->
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#246f51]"
                    >
                      {{ applicationName(currentArticle.applicationKey) }}
                    </span>

                    <span
                      class="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {{ contentTypeLabel(currentArticle.contentType) }}
                    </span>

                    <span
                      class="rounded-full px-3 py-1 text-xs font-medium"
                      [class.bg-amber-100]="currentArticle.status === 'draft'"
                      [class.text-amber-800]="currentArticle.status === 'draft'"
                      [class.bg-emerald-100]="currentArticle.status === 'published'"
                      [class.text-emerald-800]="currentArticle.status === 'published'"
                      [class.bg-slate-200]="currentArticle.status === 'archived'"
                      [class.text-slate-700]="currentArticle.status === 'archived'"
                    >
                      {{ statusLabel(currentArticle.status) }}
                    </span>

                    <span class="text-xs text-slate-400"> v{{ currentArticle.version }} </span>
                  </div>

                  <!-- Title -->
                  <h1
                    class="mt-5 break-words text-2xl font-bold leading-tight text-[#032D42] sm:text-4xl"
                  >
                    {{ currentArticle.title }}
                  </h1>

                  <!-- Summary -->
                  @if (currentArticle.summary) {
                    <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                      {{ currentArticle.summary }}
                    </p>
                  }
                </div>
              </div>

              <!-- Article information -->
              <div
                class="mt-6 grid min-w-0 grid-cols-1 gap-3 border-t border-emerald-50 pt-5 sm:grid-cols-3"
              >
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </p>

                  <p class="mt-1 text-sm font-medium text-slate-700">
                    {{ currentArticle.category }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Last Updated
                  </p>

                  <p class="mt-1 text-sm font-medium text-slate-700">
                    {{ formatDate(currentArticle.updatedAt) }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Audience
                  </p>

                  <p class="mt-1 text-sm font-medium text-slate-700">
                    {{ audienceLabel(currentArticle.audience) }}
                  </p>
                </div>
              </div>

              <!-- Tags -->
              @if (currentArticle.tags.length > 0) {
                <div class="mt-5 flex min-w-0 flex-wrap gap-1.5">
                  @for (tag of currentArticle.tags; track tag) {
                    <span class="rounded bg-emerald-50 px-2.5 py-1 text-xs text-[#246f51]">
                      #{{ tag }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Article content -->
          <article
            class="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
          >
            <div class="prose prose-slate max-w-none p-5 sm:p-8">
              <div
                class="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base"
              >
                {{ currentArticle.content }}
              </div>
            </div>
          </article>

          <!-- Version History -->
          <section
            class="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm"
          >
            <div class="border-b border-emerald-50 p-5 sm:p-6">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-[#032D42]">Version History</h2>

                  <p class="mt-1 text-sm text-slate-500">
                    Immutable historical revisions of this knowledge article.
                  </p>
                </div>

                <span
                  class="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#246f51]"
                >
                  {{ versions().length }} historical
                  {{ versions().length === 1 ? 'version' : 'versions' }}
                </span>
              </div>
            </div>

            @if (isLoadingVersions()) {
              <div class="flex min-h-32 items-center justify-center p-6">
                <div class="flex items-center gap-3">
                  <mat-spinner diameter="28"></mat-spinner>

                  <span class="text-sm text-slate-500"> Loading version history... </span>
                </div>
              </div>
            }

            @if (!isLoadingVersions() && versionHistoryError()) {
              <div class="p-6">
                <div class="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div class="flex items-start gap-3">
                    <mat-icon class="text-red-600"> error_outline </mat-icon>

                    <div>
                      <p class="text-sm font-medium text-red-800">
                        {{ versionHistoryError() }}
                      </p>

                      <button
                        mat-stroked-button
                        type="button"
                        class="mt-3"
                        (click)="loadVersionHistory()"
                      >
                        <mat-icon>refresh</mat-icon>

                        <span class="ml-2"> Try Again </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (!isLoadingVersions() && !versionHistoryError() && versions().length === 0) {
              <div class="p-6">
                <div
                  class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
                >
                  <mat-icon class="text-slate-400"> history </mat-icon>

                  <p class="mt-2 text-sm font-medium text-slate-600">No previous versions</p>

                  <p class="mt-1 text-xs text-slate-400">
                    Historical versions will appear here when a published article is revised.
                  </p>
                </div>
              </div>
            }

            @if (!isLoadingVersions() && !versionHistoryError() && versions().length > 0) {
              <div class="divide-y divide-emerald-50">
                <!-- Current version -->
                @if (article(); as currentArticle) {
                  <div class="p-5 sm:p-6">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                      >
                        <mat-icon class="text-[#246f51]"> check_circle </mat-icon>
                      </div>

                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span
                            class="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                          >
                            Current
                          </span>

                          <span class="text-sm font-semibold text-slate-800">
                            v{{ currentArticle.version }}
                          </span>

                          <span
                            class="rounded-full px-2.5 py-1 text-xs font-medium"
                            [class.bg-emerald-100]="currentArticle.status === 'published'"
                            [class.text-emerald-800]="currentArticle.status === 'published'"
                            [class.bg-amber-100]="currentArticle.status === 'draft'"
                            [class.text-amber-800]="currentArticle.status === 'draft'"
                            [class.bg-slate-200]="currentArticle.status === 'archived'"
                            [class.text-slate-700]="currentArticle.status === 'archived'"
                          >
                            {{ statusLabel(currentArticle.status) }}
                          </span>
                        </div>

                        <h3 class="mt-2 break-words font-medium text-slate-900">
                          {{ currentArticle.title }}
                        </h3>

                        <p class="mt-1 text-sm text-slate-500">
                          Updated
                          {{ formatDate(currentArticle.updatedAt) }}
                        </p>
                      </div>
                    </div>
                  </div>
                }

                <!-- Historical versions -->
                @for (version of versions(); track version.id) {
                  <div class="p-5 sm:p-6">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
                      >
                        <mat-icon class="text-slate-500"> history </mat-icon>
                      </div>

                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-sm font-semibold text-slate-800">
                            v{{ version.version }}
                          </span>

                          <span
                            class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            Historical
                          </span>

                          @if (version.publishedAt) {
                            <span
                              class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                            >
                              Published
                            </span>
                          }
                        </div>

                        <h3 class="mt-2 break-words font-medium text-slate-900">
                          {{ version.title }}
                        </h3>

                        @if (version.summary) {
                          <p class="mt-1 line-clamp-2 text-sm text-slate-500">
                            {{ version.summary }}
                          </p>
                        }

                        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            Created
                            {{ formatDate(version.createdAt) }}
                          </span>

                          @if (version.publishedAt) {
                            <span>
                              Published
                              {{ formatDate(version.publishedAt) }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Bottom actions -->
          <div
            class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 pt-5"
          >
            <button
              mat-stroked-button
              type="button"
              class="border-emerald-200 text-[#246f51]"
              (click)="goBack()"
            >
              <mat-icon> arrow_back </mat-icon>

              <span class="ml-2"> Back to Knowledge Center </span>
            </button>

            @if (currentArticle.downloadable) {
              <button
                mat-stroked-button
                type="button"
                class="border-emerald-200 text-[#246f51]"
                [disabled]="isDownloading()"
                (click)="downloadPdf()"
              >
                <mat-icon>
                  {{ isDownloading() ? 'hourglass_top' : 'picture_as_pdf' }}
                </mat-icon>

                <span class="ml-2">
                  {{ isDownloading() ? 'Preparing...' : 'Download PDF' }}
                </span>
              </button>
            }
          </div>
        </main>
      }
    </section>
  `,
})
export class KnowledgeArticleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly knowledgeService = inject(KnowledgeArticleService);

  private readonly pdfService = inject(KnowledgePdfService);

  private readonly authService = inject(AuthService);

  private readonly logger = inject(LoggerService);

  private readonly pageTitleService = inject(PageTitleService);

  readonly applications = KNOWLEDGE_CONFIGURATION.applications;

  readonly article = signal<KnowledgeArticle | null>(null);

  readonly isLoading = signal(false);

  readonly errorMessage = signal<string | null>(null);

  readonly isDownloading = signal(false);

  readonly isPublishing = signal(false);

  readonly isArchiving = signal(false);

  readonly isRestoring = signal(false);

  readonly isCreatingVersion = signal(false);

  readonly versions = signal<KnowledgeArticleVersion[]>([]);
  readonly isLoadingVersions = signal(false);
  readonly versionHistoryError = signal<string | null>(null);

  private articleId = '';

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('id') ?? '';

    this.pageTitleService.setTitle('Knowledge Article');

    if (!this.articleId) {
      this.errorMessage.set('The requested knowledge article could not be identified.');

      return;
    }

    void this.loadArticle();
  }

  async loadArticle(): Promise<void> {
    if (!this.articleId || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const article = await this.knowledgeService.getById(this.articleId);

      if (!article) {
        this.article.set(null);

        this.errorMessage.set('The requested knowledge article was not found.');

        return;
      }

      this.article.set(article);

      this.pageTitleService.setTitle(article.title);
      void this.loadVersionHistory();
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to load knowledge article: ${this.articleId}`,
        error,
      );

      this.errorMessage.set('The knowledge article could not be loaded. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadVersionHistory(): Promise<void> {
    if (!this.articleId) {
      return;
    }

    this.isLoadingVersions.set(true);
    this.versionHistoryError.set(null);

    try {
      const versions = await this.knowledgeService.getVersions(this.articleId);

      this.versions.set([...versions].sort((a, b) => b.version - a.version));
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to load version history: ${this.articleId}`,
        error,
      );

      this.versions.set([]);

      this.versionHistoryError.set('Version history could not be loaded.');
    } finally {
      this.isLoadingVersions.set(false);
    }
  }

  editArticle(): void {
    const currentArticle = this.article();

    if (!currentArticle) {
      return;
    }

    void this.router.navigate(['/admin/configuration/knowledge', currentArticle.id, 'edit']);
  }

  async createVersion(): Promise<void> {
    const currentArticle = this.article();

    const createdBy = this.authService.user()?.id;

    if (!currentArticle || !createdBy || this.isCreatingVersion()) {
      return;
    }

    if (currentArticle.status !== 'published') {
      this.errorMessage.set('Only published knowledge articles can be versioned.');

      return;
    }

    this.isCreatingVersion.set(true);
    this.errorMessage.set(null);

    try {
      const draft = await this.knowledgeService.createVersionDraft(currentArticle.id, createdBy);

      this.logger.info(
        'KnowledgeArticleDetailComponent',
        `Created version ${draft.version} draft for knowledge article: ${draft.id}`,
      );

      await this.router.navigate(['/admin/configuration/knowledge', draft.id, 'edit'], {
        queryParams: {
          mode: 'version',
        },
      });
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to create version for article: ${currentArticle.id}`,
        error,
      );

      this.errorMessage.set('The new article version could not be created. Please try again.');
    } finally {
      this.isCreatingVersion.set(false);
    }
  }

  async publishArticle(): Promise<void> {
    const currentArticle = this.article();

    const updatedBy = this.authService.user()?.id;

    if (!currentArticle || !updatedBy || this.isPublishing()) {
      return;
    }

    this.isPublishing.set(true);

    try {
      await this.knowledgeService.publish(currentArticle.id, updatedBy);

      await this.loadArticle();
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to publish article: ${currentArticle.id}`,
        error,
      );

      this.errorMessage.set('The article could not be published.');
    } finally {
      this.isPublishing.set(false);
    }
  }

  async archiveArticle(): Promise<void> {
    const currentArticle = this.article();

    const updatedBy = this.authService.user()?.id;

    if (!currentArticle || !updatedBy || this.isArchiving()) {
      return;
    }

    this.isArchiving.set(true);

    try {
      await this.knowledgeService.archive(currentArticle.id, updatedBy);

      await this.loadArticle();
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to archive article: ${currentArticle.id}`,
        error,
      );

      this.errorMessage.set('The article could not be archived.');
    } finally {
      this.isArchiving.set(false);
    }
  }

  async restoreArticle(): Promise<void> {
    const currentArticle = this.article();

    const updatedBy = this.authService.user()?.id;

    if (!currentArticle || !updatedBy || this.isRestoring()) {
      return;
    }

    this.isRestoring.set(true);

    try {
      await this.knowledgeService.restore(currentArticle.id, updatedBy);

      await this.loadArticle();
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to restore article: ${currentArticle.id}`,
        error,
      );

      this.errorMessage.set('The article could not be restored.');
    } finally {
      this.isRestoring.set(false);
    }
  }

  async downloadPdf(): Promise<void> {
    const currentArticle = this.article();

    if (!currentArticle || this.isDownloading()) {
      return;
    }

    this.isDownloading.set(true);

    try {
      await this.pdfService.download(currentArticle);
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleDetailComponent',
        `Failed to generate PDF: ${currentArticle.id}`,
        error,
      );

      this.errorMessage.set('The PDF could not be generated.');
    } finally {
      this.isDownloading.set(false);
    }
  }

  goBack(): void {
    void this.router.navigate(['/admin/configuration/knowledge']);
  }

  applicationName(applicationKey: string): string {
    return (
      this.applications.find((application) => application.key === applicationKey)?.name ??
      applicationKey
    );
  }

  contentTypeLabel(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  statusLabel(status: KnowledgeArticleStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  audienceLabel(audience: string[]): string {
    return audience.map((value) => this.contentTypeLabel(value)).join(', ');
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }
}

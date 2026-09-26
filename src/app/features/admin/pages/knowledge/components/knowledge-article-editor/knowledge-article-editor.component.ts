import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  KnowledgeArticle,
  KnowledgeAudience,
  KnowledgeContentType,
} from '../../../../../../core/models/knowledge-article.model';

import { KnowledgeArticleService } from '../../../../../../core/services/knowledge-article.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { LoggerService } from '../../../../../../core/services/logger.service';
import { KNOWLEDGE_CONFIGURATION } from '../../../../../../core/config/knowledge.config';
import { PageTitleService } from '../../../../../../core/services/page-title.service';

@Component({
  selector: 'app-knowledge-article-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-5xl p-4 sm:p-6 mt-10">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <button
              mat-icon-button
              type="button"
              aria-label="Back to Knowledge Center"
              (click)="cancel()"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>

            <span class="text-sm font-medium text-slate-500"> Knowledge Center </span>
          </div>

          <h1 class="text-2xl font-semibold text-slate-900">
            @if (isVersionMode()) {
              Create Knowledge Article Version
            } @else if (isEditMode()) {
              Edit Knowledge Article
            } @else {
              New Knowledge Article
            }
          </h1>

          <p class="mt-1 text-sm text-slate-600">
            @if (isVersionMode()) {
              Update this draft revision without changing the currently published article.
            } @else {
              Create reusable documentation that can be published to users, administrators, support
              teams, and future learning content.
            }
          </p>
          @if (isVersionMode()) {
            <div
              class="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
            >
              <mat-icon class="!h-4 !w-4 !text-base">library_add</mat-icon>
              <span>New revision — v{{ currentVersion() }}</span>
            </div>
          }
        </div>

        @if (isLoading()) {
          <mat-spinner diameter="32"></mat-spinner>
        }
      </div>

      @if (errorMessage()) {
        <div
          class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {{ errorMessage() }}
        </div>
      }

      <form [formGroup]="form" class="space-y-6" (ngSubmit)="saveDraft()">
        <!-- Basic Information -->
        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-5">
            <h2 class="text-lg font-semibold text-slate-900">Article Information</h2>
            <p class="mt-1 text-sm text-slate-500">
              Define how this article will be identified and categorized.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Title</mat-label>
              <input
                matInput
                formControlName="title"
                maxlength="200"
                placeholder="Enter article title"
              />

              @if (form.controls.title.hasError('required')) {
                <mat-error>Title is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Summary</mat-label>
              <textarea
                matInput
                formControlName="summary"
                rows="3"
                maxlength="500"
                placeholder="Briefly describe what this article covers"
              ></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Application</mat-label>

              <mat-select formControlName="applicationKey">
                @for (application of configuration.applications; track application.key) {
                  <mat-option [value]="application.key">
                    {{ application.name }}
                  </mat-option>
                }
              </mat-select>

              @if (form.controls.applicationKey.hasError('required')) {
                <mat-error>Application is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Content Type</mat-label>

              <mat-select formControlName="contentType">
                @for (contentType of configuration.contentTypes; track contentType) {
                  <mat-option [value]="contentType">
                    {{ formatContentType(contentType) }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Category</mat-label>

              <input
                matInput
                formControlName="category"
                maxlength="100"
                placeholder="Example: Administration"
              />

              @if (form.controls.category.hasError('required')) {
                <mat-error>Category is required.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Tags</mat-label>

              <input
                matInput
                formControlName="tags"
                placeholder="Example: configuration, troubleshooting"
              />

              <mat-hint> Separate tags with commas. </mat-hint>
            </mat-form-field>
          </div>
        </section>

        <!-- Audience -->
        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-5">
            <h2 class="text-lg font-semibold text-slate-900">Audience</h2>

            <p class="mt-1 text-sm text-slate-500">
              Select who should be able to use this documentation.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (audience of configuration.audiences; track audience) {
              <mat-checkbox
                [checked]="isAudienceSelected(audience)"
                (change)="toggleAudience(audience, $event.checked)"
              >
                {{ formatAudience(audience) }}
              </mat-checkbox>
            }
          </div>

          @if (audienceError()) {
            <p class="mt-3 text-sm text-red-600">Select at least one audience.</p>
          }
        </section>

        <!-- Content -->
        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-5">
            <h2 class="text-lg font-semibold text-slate-900">Article Content</h2>

            <p class="mt-1 text-sm text-slate-500">Use plain text or basic Markdown formatting.</p>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Content</mat-label>

            <textarea
              matInput
              formControlName="content"
              rows="20"
              maxlength="250000"
              placeholder="Write the knowledge article here..."
            ></textarea>

            @if (form.controls.content.hasError('required')) {
              <mat-error>Article content is required.</mat-error>
            }
          </mat-form-field>
        </section>

        <!-- Download -->
        <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="flex items-start gap-3">
            <mat-checkbox formControlName="downloadable"> Allow PDF download </mat-checkbox>
          </div>

          <p class="ml-8 mt-1 text-sm text-slate-500">
            The PDF is generated from the article's current content.
          </p>
        </section>

        <!-- Actions -->
        <div
          class="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end"
        >
          <button
            mat-stroked-button
            type="button"
            [disabled]="isSaving() || isPublishing()"
            (click)="cancel()"
          >
            Cancel
          </button>

          <button mat-stroked-button type="submit" [disabled]="isSaving() || isPublishing()">
            <mat-icon>
              {{ isSaving() ? 'hourglass_top' : 'save' }}
            </mat-icon>

            <span class="ml-2">
              {{ isSaving() ? 'Saving...' : 'Save Draft' }}
            </span>
          </button>

          <button
            mat-flat-button
            type="button"
            [disabled]="isSaving() || isPublishing()"
            (click)="publish()"
          >
            <mat-icon>
              {{ isPublishing() ? 'hourglass_top' : 'publish' }}
            </mat-icon>

            <span class="ml-2">
              {{ isPublishing() ? 'Publishing...' : 'Publish' }}
            </span>
          </button>
        </div>
      </form>
    </section>
  `,
})
export class KnowledgeArticleEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly knowledgeService = inject(KnowledgeArticleService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  readonly configuration = KNOWLEDGE_CONFIGURATION;

  readonly isEditMode = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isPublishing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly audienceError = signal(false);

  private articleId: string | null = null;
  private currentArticle: KnowledgeArticle | null = null;
  readonly currentVersion = signal<number | null>(null);
  readonly isVersionMode = signal(false);

  /**
   * Page title service.
   */
  private readonly pageTitleService = inject(PageTitleService);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    summary: ['', [Validators.maxLength(500)]],
    applicationKey: ['', Validators.required],
    contentType: ['documentation' as KnowledgeContentType, Validators.required],
    category: ['', Validators.required],
    tags: [''],
    audience: [[] as KnowledgeAudience[]],
    content: ['', Validators.required],
    downloadable: [true],
  });
  //this.pageTitleService.setTitle('Knowledge Editor');
  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Knowledge Editor');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    const id = this.route.snapshot.paramMap.get('id');

    this.isVersionMode.set(mode === 'version');

    this.pageTitleService.setTitle(
      this.isVersionMode() ? 'Create Knowledge Article Version' : 'Knowledge Editor',
    );

    if (!id) {
      this.form.patchValue({
        applicationKey: this.configuration.applications[0]?.key ?? '',
      });

      return;
    }

    this.articleId = id;
    this.isEditMode.set(true);

    await this.loadArticle(id);
  }

  private async loadArticle(id: string): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const article = await this.knowledgeService.getById(id);

      if (!article) {
        this.errorMessage.set('The requested knowledge article could not be found.');
        return;
      }

      this.currentArticle = article;

      this.form.patchValue({
        title: article.title,
        summary: article.summary ?? '',
        applicationKey: article.applicationKey,
        contentType: article.contentType,
        category: article.category,
        tags: article.tags.join(', '),
        audience: [...article.audience],
        content: article.content,
        downloadable: article.downloadable,
      });
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleEditorComponent',
        'Failed to load knowledge article.',
        error,
      );

      this.errorMessage.set('The knowledge article could not be loaded.');
    } finally {
      this.isLoading.set(false);
    }
  }

  isAudienceSelected(audience: KnowledgeAudience): boolean {
    return this.form.controls.audience.value.includes(audience);
  }

  toggleAudience(audience: KnowledgeAudience, selected: boolean): void {
    const current = this.form.controls.audience.value;

    const next = selected
      ? [...new Set([...current, audience])]
      : current.filter((item) => item !== audience);

    this.form.controls.audience.setValue(next);
    this.audienceError.set(next.length === 0);
  }

  async saveDraft(): Promise<void> {
    if (this.isSaving() || this.isPublishing()) {
      return;
    }

    const article = this.buildArticle();

    if (!article) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    try {
      await this.persistArticle(article);

      await this.router.navigate(['/admin/configuration/knowledge']);
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleEditorComponent',
        'Failed to save knowledge article.',
        error,
      );

      this.errorMessage.set('The knowledge article could not be saved.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async publish(): Promise<void> {
    if (this.isSaving() || this.isPublishing()) {
      return;
    }

    const article = this.buildArticle();

    if (!article) {
      return;
    }

    this.isPublishing.set(true);
    this.errorMessage.set(null);

    try {
      // Save the current editor state first.
      await this.persistArticle(article);

      const articleId = this.articleId ?? article.id;
      const userId = this.getCurrentUserId();

      if (!userId) {
        throw new Error('A signed-in user is required to publish a knowledge article.');
      }

      await this.knowledgeService.publish(articleId, userId);

      await this.router.navigate(['/admin/configuration/knowledge']);
    } catch (error) {
      this.logger.error(
        'KnowledgeArticleEditorComponent',
        'Failed to publish knowledge article.',
        error,
      );

      this.errorMessage.set('The knowledge article could not be published.');
    } finally {
      this.isPublishing.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/admin/configuration/knowledge']);
  }

  private buildArticle(): KnowledgeArticle | null {
    this.form.markAllAsTouched();

    const audience = this.form.controls.audience.value;

    if (this.form.invalid || audience.length === 0) {
      this.audienceError.set(audience.length === 0);
      return null;
    }

    const now = new Date().toISOString();
    const userId = this.getCurrentUserId();

    if (!userId) {
      this.errorMessage.set('A signed-in user is required to save a knowledge article.');
      return null;
    }

    const raw = this.form.getRawValue();

    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const id = this.currentArticle?.id ?? this.articleId ?? crypto.randomUUID();

    const version = this.currentArticle?.version ?? 1;

    const article: KnowledgeArticle = {
      id,
      applicationKey: raw.applicationKey,
      title: raw.title.trim(),
      summary: raw.summary.trim() || undefined,
      content: raw.content,
      contentType: raw.contentType,
      category: raw.category.trim(),
      tags,
      audience,
      status: this.currentArticle?.status ?? 'draft',
      version,
      authorId: this.currentArticle?.authorId ?? userId,
      updatedBy: userId,
      createdAt: this.currentArticle?.createdAt ?? now,
      updatedAt: now,
      publishedAt: this.currentArticle?.publishedAt,
      archivedAt: this.currentArticle?.archivedAt,
      downloadable: raw.downloadable,
      metadata: this.currentArticle?.metadata,
    };

    return article;
  }

  private async persistArticle(article: KnowledgeArticle): Promise<void> {
    if (this.currentArticle) {
      await this.knowledgeService.update(article);
      this.currentArticle = article;
      this.articleId = article.id;
      return;
    }

    await this.knowledgeService.create(article);

    this.currentArticle = article;
    this.articleId = article.id;
    this.isEditMode.set(true);
  }

  private getCurrentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  formatContentType(contentType: KnowledgeContentType): string {
    return contentType.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }

  formatAudience(audience: KnowledgeAudience): string {
    return audience.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
}

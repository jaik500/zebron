import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { KNOWLEDGE_CONFIGURATION } from '../../../core/config/knowledge.config';
import { KnowledgeArticleVersion, KnowledgeContentType } from '../../../core/models/knowledge-article.model';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import { parseTags, renderKnowledgeContent } from './knowledge-content.util';
import { KNOWLEDGE_TYPE_LABELS } from './organization-knowledge.component';
import {
  KNOWLEDGE_MAX_CONTENT,
  KnowledgeArticleInput,
  KnowledgeEntry,
  OrganizationKnowledgeService,
} from './organization-knowledge.service';

interface Draft {
  title: string;
  summary: string;
  content: string;
  contentType: KnowledgeContentType;
  category: string;
  tags: string;
  applicationKey: string;
  downloadable: boolean;
}

const EMPTY: Draft = {
  title: '',
  summary: '',
  content: '',
  contentType: 'guide',
  category: 'General',
  tags: '',
  applicationKey: 'organization',
  downloadable: true,
};

/**
 * Create or edit an organization Knowledge Center article.
 *
 * Routes (staff and above):
 *   /partner/org/:organizationId/knowledge/manage/new
 *   /partner/org/:organizationId/knowledge/manage/:articleId/edit
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-knowledge-editor',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host ::ng-deep .knowledge-body h2 { font-size: 1.25rem; font-weight: 700; margin: 1.2rem 0 0.5rem; }
      :host ::ng-deep .knowledge-body h3 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.4rem; }
      :host ::ng-deep .knowledge-body h4 { font-weight: 700; margin: 0.8rem 0 0.3rem; }
      :host ::ng-deep .knowledge-body p { margin: 0 0 0.8rem; line-height: 1.7; }
      :host ::ng-deep .knowledge-body ul { list-style: disc; margin: 0 0 0.8rem 1.3rem; }
      :host ::ng-deep .knowledge-body ol { list-style: decimal; margin: 0 0 0.8rem 1.3rem; }
      :host ::ng-deep .knowledge-body a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .knowledge-body code { background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.3rem; font-size: 0.875em; }
      :host ::ng-deep .knowledge-body pre { background: #111827; color: #f9fafb; border-radius: 8px; padding: 0.8rem; overflow-x: auto; margin: 0 0 0.8rem; }
      :host ::ng-deep .knowledge-body pre code { background: transparent; color: inherit; padding: 0; }
      :host ::ng-deep .knowledge-body blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.5rem 0.9rem; margin: 0 0 0.8rem; }
      :host ::ng-deep .knowledge-body > :first-child { margin-top: 0; }
      :host ::ng-deep .knowledge-body li > p { margin: 0; }
      :host ::ng-deep .knowledge-body :is(p, ul, ol, pre, blockquote) + :is(h2, h3, h4) { margin-top: 1.75rem; }
    `,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white">{{ existing() ? ('Edit article' | t) : ('New article' | t) }}</h1>
            @if (existing(); as current) {
              <p class="text-sm capitalize text-white/85">{{ '{0} · version {1}' | t: [current.status, current.version] }}</p>
            }
          </div>
          <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage']">
            <mat-icon>arrow_back</mat-icon>
            {{ 'All articles' | t }}
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }
        @if (notice()) {
          <p class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{{ notice() | t }}</p>
        }

        @if (loading()) {
          <p class="text-center text-sm text-gray-500">{{ 'Loading…' | t }}</p>
        } @else {
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <!-- FORM -->
            <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ 'Title' | t }}</mat-label>
                <input matInput required maxlength="200" [ngModel]="draft().title" (ngModelChange)="patch({ title: $event })" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>{{ 'Summary' | t }}</mat-label>
                <textarea matInput rows="2" maxlength="500" [ngModel]="draft().summary" (ngModelChange)="patch({ summary: $event })"></textarea>
                <mat-hint>{{ 'One or two sentences shown on the article card' | t }}</mat-hint>
              </mat-form-field>

              <div class="grid gap-x-4 sm:grid-cols-2">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Type' | t }}</mat-label>
                  <mat-select [value]="draft().contentType" (selectionChange)="patch({ contentType: $event.value })">
                    @for (type of contentTypes; track type) {
                      <mat-option [value]="type">{{ typeLabel(type) | t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Applies to' | t }}</mat-label>
                  <mat-select [value]="draft().applicationKey" (selectionChange)="patch({ applicationKey: $event.value })">
                    <mat-option value="organization">{{ 'General' | t }}</mat-option>
                    @for (application of applications(); track application.key) {
                      <mat-option [value]="application.key">{{ application.name | t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Category' | t }}</mat-label>
                  <input matInput maxlength="80" [ngModel]="draft().category" (ngModelChange)="patch({ category: $event })" />
                  <mat-hint>{{ 'For example Onboarding, Policies, IT' | t }}</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>{{ 'Tags' | t }}</mat-label>
                  <input matInput [ngModel]="draft().tags" (ngModelChange)="patch({ tags: $event })" />
                  <mat-hint>{{ 'Separate with commas' | t }}</mat-hint>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="mt-2 w-full">
                <mat-label>{{ 'Article' | t }}</mat-label>
                <textarea
                  matInput
                  rows="18"
                  class="!font-mono !text-sm"
                  [attr.maxlength]="maxContent"
                  [ngModel]="draft().content"
                  (ngModelChange)="patch({ content: $event })"
                ></textarea>
                <mat-hint>
                  {{ '# Heading · - bullet · 1. step · **bold** · \`code\` · [link](https://…) · > note' | t }}
                </mat-hint>
              </mat-form-field>

              <mat-slide-toggle class="mt-3" [checked]="draft().downloadable" (change)="patch({ downloadable: $event.checked })">
                {{ 'Allow PDF download' | t }}
              </mat-slide-toggle>

              <div class="mt-6 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                @if (existing()?.status !== 'published') {
                  <button mat-stroked-button type="button" [disabled]="saving() || !valid()" (click)="save()">
                    <mat-icon>save</mat-icon>
                    {{ 'Save draft' | t }}
                  </button>
                } @else {
                  <button mat-stroked-button type="button" [disabled]="saving() || !valid()" (click)="save()">
                    <mat-icon>save</mat-icon>
                    {{ 'Save without new version' | t }}
                  </button>
                }
                <button mat-flat-button type="button" [disabled]="saving() || !valid()" (click)="publish()">
                  <mat-icon>publish</mat-icon>
                  {{ existing()?.publishedAt ? ('Publish new version' | t) : ('Publish' | t) }}
                </button>
              </div>
            </section>

            <!-- PREVIEW -->
            <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">{{ 'Preview' | t }}</p>
              <h2 class="mt-2 text-2xl font-bold text-gray-900">{{ draft().title || ('Untitled article' | t) }}</h2>
              @if (draft().summary) {
                <p class="mt-1 text-gray-600">{{ draft().summary }}</p>
              }
              <hr class="my-4 border-gray-200" />
              @if (draft().content.trim()) {
                <div class="knowledge-body text-sm text-gray-800" [innerHTML]="preview()"></div>
              } @else {
                <p class="text-sm text-gray-400">{{ 'Start writing to see the article here.' | t }}</p>
              }

              @if (versions().length) {
                <div class="mt-8 border-t border-gray-100 pt-4">
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ 'Published versions' | t }}</p>
                  <ul class="mt-2 space-y-1 text-sm text-gray-700">
                    @for (version of versions(); track version.id) {
                      <li>v{{ version.version }} · {{ version.title }} · {{ formatDate(version.publishedAt ?? version.createdAt) }}</li>
                    }
                  </ul>
                </div>
              }
            </section>
          </div>
        }
      </main>
    </div>
  `,
})
export class OrganizationKnowledgeEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly knowledge = inject(OrganizationKnowledgeService);
  private readonly auth = inject(AuthService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  private readonly articleId = this.route.snapshot.paramMap.get('articleId');

  protected readonly contentTypes = KNOWLEDGE_CONFIGURATION.contentTypes;
  protected readonly maxContent = KNOWLEDGE_MAX_CONTENT;

  protected readonly existing = signal<KnowledgeEntry | null>(null);
  protected readonly versions = signal<KnowledgeArticleVersion[]>([]);
  protected readonly draft = signal<Draft>({ ...EMPTY });
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly preview = computed(() => renderKnowledgeContent(this.draft().content));
  protected readonly valid = computed(() => this.draft().title.trim().length > 0 && this.draft().content.trim().length > 0);

  /** Applications the organization has, for "Applies to". */
  protected readonly applications = computed(() =>
    KNOWLEDGE_CONFIGURATION.applications.filter(
      (application) => application.key !== 'platform' && this.organizationStore.hasActiveApplication(application.key),
    ),
  );

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.articleId ? 'Edit article' : 'New article');

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Application list falls back to General only.
    }

    if (this.articleId) {
      try {
        const article = await this.knowledge.getArticle(this.organizationId, 'organization', this.articleId);
        if (!article) {
          this.error.set('This article no longer exists.');
        } else {
          this.load(article);
          this.versions.set(await this.knowledge.getVersions(this.organizationId, article.id).catch(() => []));
        }
      } catch (error) {
        console.error('[Knowledge Center] Article could not be loaded.', error);
        this.error.set('The article could not be loaded. Staff, managers, admins and owners can edit articles.');
      }
    }

    this.loading.set(false);
  }

  protected patch(change: Partial<Draft>): void {
    this.draft.update((current) => ({ ...current, ...change }));
  }

  protected typeLabel(type: KnowledgeContentType): string {
    return KNOWLEDGE_TYPE_LABELS[type] ?? type;
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
  }

  protected async save(): Promise<void> {
    await this.submit(false);
  }

  protected async publish(): Promise<void> {
    await this.submit(true);
  }

  private async submit(publish: boolean): Promise<void> {
    const userId = this.auth.firebaseUser()?.uid;
    if (!userId) {
      this.error.set('Sign in again to save.');
      return;
    }

    const draft = this.draft();
    const input: KnowledgeArticleInput = {
      title: draft.title,
      summary: draft.summary,
      content: draft.content,
      contentType: draft.contentType,
      category: draft.category,
      tags: parseTags(draft.tags),
      applicationKey: draft.applicationKey,
      downloadable: draft.downloadable,
    };

    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);

    try {
      let current = this.existing();

      if (!current) {
        const id = await this.knowledge.createDraft(this.organizationId, input, userId);
        current = await this.knowledge.getArticle(this.organizationId, 'organization', id);
        if (!current) throw new Error('Created article could not be read back.');
      } else if (!publish) {
        await this.knowledge.saveArticle(this.organizationId, current, input, userId);
      }

      if (publish) {
        await this.knowledge.publish(this.organizationId, current, input, userId);
      }

      const saved = await this.knowledge.getArticle(this.organizationId, 'organization', current.id);
      if (saved) this.load(saved);
      this.versions.set(await this.knowledge.getVersions(this.organizationId, current.id).catch(() => []));
      this.notice.set(publish ? 'Published. Everyone in your organization can read it now.' : 'Saved.');

      if (!this.articleId) {
        // Keep this page (and the notice) but give it the article's address.
        this.location.replaceState(
          this.router.serializeUrl(
            this.router.createUrlTree(['/partner/org', this.organizationId, 'knowledge', 'manage', current.id, 'edit']),
          ),
        );
      }
    } catch (error) {
      console.error('[Knowledge Center] Save failed.', error);
      this.error.set('The article could not be saved. Check that the title and article are filled in and try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private load(article: KnowledgeEntry): void {
    this.existing.set(article);
    this.draft.set({
      title: article.title,
      summary: article.summary ?? '',
      content: article.content,
      contentType: article.contentType,
      category: article.category,
      tags: article.tags.join(', '),
      applicationKey: article.applicationKey,
      downloadable: article.downloadable,
    });
  }
}

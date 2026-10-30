import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { KnowledgePdfService } from '../../../core/services/knowledge-pdf.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { PartnerAccessService } from '../../../core/services/partner-access.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import { renderKnowledgeContent } from './knowledge-content.util';
import { KNOWLEDGE_TYPE_LABELS } from './organization-knowledge.component';
import { KnowledgeEntry, KnowledgeSource, OrganizationKnowledgeService } from './organization-knowledge.service';

/**
 * One Knowledge Center article.
 *
 * Route: /partner/org/:organizationId/knowledge/articles/:source/:articleId
 * (source = organization | zebron)
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-knowledge-article',
  standalone: true,
  imports: [
    TranslatePipe,DatePipe, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .knowledge-body :is(h2) { font-size: 1.35rem; font-weight: 700; margin: 1.6rem 0 0.6rem; color: #111827; }
      .knowledge-body :is(h3) { font-size: 1.15rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #111827; }
      .knowledge-body :is(h4) { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; color: #111827; }
      .knowledge-body p { margin: 0 0 0.9rem; line-height: 1.75; }
      .knowledge-body ul, .knowledge-body ol { margin: 0 0 1rem 1.4rem; line-height: 1.7; }
      .knowledge-body ul { list-style: disc; }
      .knowledge-body ol { list-style: decimal; }
      .knowledge-body li { margin: 0.2rem 0; }
      .knowledge-body a { color: #007979; text-decoration: underline; }
      .knowledge-body code { background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.875em; }
      .knowledge-body pre { background: #111827; color: #f9fafb; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
      .knowledge-body pre code { background: transparent; padding: 0; color: inherit; }
      .knowledge-body blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.6rem 1rem; margin: 0 0 1rem; border-radius: 0 6px 6px 0; }
    `,
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId, 'knowledge']">
            <mat-icon>arrow_back</mat-icon>
            {{ 'Knowledge Center' | t }}
          </a>
          @if (article(); as current) {
            <div class="flex flex-wrap gap-2">
              @if (current.downloadable) {
                <button mat-stroked-button type="button" class="!border-white/40 !text-white" (click)="download(current)">
                  <mat-icon>download</mat-icon>
                  {{ 'PDF' | t }}
                </button>
              }
              @if (canEdit()) {
                <a
                  mat-flat-button
                  class="!bg-white !text-[#007979]"
                  [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage', current.id, 'edit']"
                >
                  <mat-icon>edit</mat-icon>
                  {{ 'Edit' | t }}
                </a>
              }
            </div>
          }
        </div>
      </header>

      <main class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        @if (loading()) {
          <p class="text-center text-sm text-gray-500">{{ 'Loading article…' | t }}</p>
        } @else if (article(); as current) {
          <article class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span [class]="current.source === 'organization' ? 'rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800' : 'rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800'">
                {{ current.source === 'organization' ? organizationName() : ('Zebron' | t) }}
              </span>
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{{ typeLabel() | t }}</span>
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{{ current.category }}</span>
              @if (current.status !== 'published') {
                <span class="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">{{ current.status | t }}</span>
              }
            </div>

            <h1 class="mt-3 text-3xl font-bold text-gray-900">{{ current.title }}</h1>
            @if (current.summary) {
              <p class="mt-2 text-lg leading-7 text-gray-600">{{ current.summary }}</p>
            }
            <p class="mt-3 text-xs text-gray-500">
              {{ 'Version {0} · Updated {1}' | t: [current.version, (current.updatedAt | date: 'medium')] }}
            </p>

            <hr class="my-6 border-gray-200" />

            <div class="knowledge-body text-[15px] text-gray-800" [innerHTML]="html()"></div>

            @if (current.tags.length) {
              <div class="mt-8 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                @for (tag of current.tags; track tag) {
                  <span class="rounded-full bg-[#007979]/10 px-2.5 py-0.5 text-xs font-medium text-[#007979]">#{{ tag }}</span>
                }
              </div>
            }
          </article>
        } @else {
          <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p class="font-semibold text-gray-800">{{ 'This article is not available' | t }}</p>
            <p class="mt-1 text-sm text-gray-500">{{ 'It may have been archived or you may not have access to it.' | t }}</p>
          </div>
        }
      </main>
    </div>
  `,
})
export class OrganizationKnowledgeArticleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly knowledge = inject(OrganizationKnowledgeService);
  private readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitle = inject(PageTitleService);
  private readonly pdf = inject(KnowledgePdfService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  private readonly source: KnowledgeSource =
    this.route.snapshot.paramMap.get('source') === 'zebron' ? 'zebron' : 'organization';
  private readonly articleId = this.route.snapshot.paramMap.get('articleId') ?? '';

  protected readonly article = signal<KnowledgeEntry | null>(null);
  protected readonly loading = signal(true);

  protected readonly html = computed(() => renderKnowledgeContent(this.article()?.content ?? ''));
  protected readonly typeLabel = computed(() => {
    const type = this.article()?.contentType;
    return type ? KNOWLEDGE_TYPE_LABELS[type] ?? type : '';
  });
  protected readonly organizationName = computed(
    () => this.organizationStore.selectedOrganization()?.name ?? 'Your organization',
  );
  protected readonly canEdit = computed(
    () => this.article()?.source === 'organization' && this.access.can('knowledge.manage'),
  );

  async ngOnInit(): Promise<void> {
    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Name falls back.
    }

    try {
      const article = await this.knowledge.getArticle(this.organizationId, this.source, this.articleId);
      this.article.set(article);
      this.pageTitle.setTitle(article?.title ?? 'Knowledge Center');
    } catch (error) {
      // Members are denied drafts and archived articles by the rules.
      console.info('[Knowledge Center] Article not available.', error);
      this.article.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  protected async download(article: KnowledgeEntry): Promise<void> {
    await this.pdf.download(article);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { KNOWLEDGE_CONFIGURATION } from '../../../core/config/knowledge.config';
import { KnowledgeAudience, KnowledgeContentType } from '../../../core/models/knowledge-article.model';
import { PageTitleService } from '../../../core/services/page-title.service';
import { PartnerAccessService } from '../../../core/services/partner-access.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import { knowledgeExcerpt, matchesKnowledgeSearch } from './knowledge-content.util';
import { KnowledgeEntry, OrganizationKnowledgeService } from './organization-knowledge.service';

type SourceFilter = 'all' | 'organization' | 'zebron';

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeContentType, string> = {
  documentation: 'Documentation',
  guide: 'Guide',
  'how-to': 'How-to',
  troubleshooting: 'Troubleshooting',
  reference: 'Reference',
  faq: 'FAQ',
  learning: 'Learning',
};

export const KNOWLEDGE_TYPE_ICONS: Record<KnowledgeContentType, string> = {
  documentation: 'description',
  guide: 'map',
  'how-to': 'checklist',
  troubleshooting: 'build',
  reference: 'menu_book',
  faq: 'help',
  learning: 'school',
};

/**
 * Organization Knowledge Center (reader).
 *
 * Everyone in the organization reads published articles written by the
 * organization and published Zebron articles for their audience and the
 * organization's applications. Managers and above get "Manage articles".
 *
 * Route: /partner/org/:organizationId/knowledge
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-knowledge',
  standalone: true,
  imports: [
    TranslatePipe,DatePipe, FormsModule, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-bold text-white">{{ 'Knowledge Center' | t }}</h1>
              <span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/30" [title]="'Only members of {0} can see these articles.' | t: [organizationName()]">
                <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">lock</mat-icon>
                {{ 'Internal' | t }}
              </span>
            </div>
            <p class="text-sm text-white/85">
              {{ 'Documentation, policies and procedures for {0} members, plus articles from Zebron.' | t: [organizationName()] }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId]">
              <mat-icon>arrow_back</mat-icon>
              {{ 'Dashboard' | t }}
            </a>
            @if (canManage()) {
              <a mat-flat-button class="!bg-white !text-[#007979]" [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage']">
                <mat-icon>settings</mat-icon>
                {{ 'Manage articles' | t }}
              </a>
            }
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- Search and filters -->
        <section class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <label class="relative block">
            <span class="sr-only">{{ 'Search articles' | t }}</span>
            <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</mat-icon>
            <input
              type="search"
              class="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
              [placeholder]="'Search articles, procedures and answers' | t"
              [ngModel]="search()"
              (ngModelChange)="search.set($event)"
            />
          </label>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            @for (option of sourceOptions; track option.value) {
              <button
                type="button"
                [class]="chipClass(source() === option.value)"
                (click)="source.set(option.value)"
              >
                {{ option.label | t }}
              </button>
            }
            <span class="mx-1 hidden h-5 w-px bg-gray-200 sm:block"></span>
            <button type="button" [class]="chipClass(type() === '')" (click)="type.set('')">{{ 'All types' | t }}</button>
            @for (option of typeOptions(); track option) {
              <button type="button" [class]="chipClass(type() === option)" (click)="type.set(option)">
                {{ typeLabel(option) | t }}
              </button>
            }
          </div>
        </section>

        @if (error()) {
          <p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }

        @if (loading()) {
          <p class="mt-8 text-center text-sm text-gray-500">{{ 'Loading articles…' | t }}</p>
        } @else if (filtered().length === 0) {
          <div class="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <mat-icon class="!h-10 !w-10 !text-4xl text-gray-300">menu_book</mat-icon>
            <p class="mt-2 font-semibold text-gray-800">
              {{ articles().length === 0 ? ('No articles yet' | t) : ('No articles match your search' | t) }}
            </p>
            @if (articles().length === 0 && canManage()) {
              <a mat-flat-button class="mt-4" [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage', 'new']">
                <mat-icon>add</mat-icon>
                {{ 'Write the first article' | t }}
              </a>
            }
          </div>
        } @else {
          <p class="mt-6 text-sm text-gray-500">{{ '{0} article{1}' | t: [filtered().length, (filtered().length === 1 ? '' : 's')] }}</p>
          <div class="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            @for (article of filtered(); track article.source + article.id) {
              <a
                [routerLink]="['/partner/org', organizationId, 'knowledge', 'articles', article.source, article.id]"
                class="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]"
              >
                <div class="flex items-center gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#007979]/10 text-[#007979]">
                    <mat-icon>{{ typeIcon(article.contentType) }}</mat-icon>
                  </span>
                  <h2 class="min-w-0 flex-1 font-bold text-gray-900 group-hover:text-[#007979]">{{ article.title }}</h2>
                </div>
                <p class="mt-3 flex-1 text-sm leading-6 text-gray-600">{{ excerpt(article) }}</p>
                <div class="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span [class]="article.source === 'organization' ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800' : 'rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800'">
                    @if (article.source === 'organization') {
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">lock</mat-icon>
                      {{ organizationName() }} · {{ 'Internal' | t }}
                    } @else {
                      {{ 'Zebron' | t }}
                    }
                  </span>
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{{ typeLabel(article.contentType) | t }}</span>
                  <span class="text-gray-500">{{ 'Updated {0}' | t: [(article.updatedAt | date: 'mediumDate')] }}</span>
                </div>
              </a>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class OrganizationKnowledgeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly knowledge = inject(OrganizationKnowledgeService);
  private readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly articles = signal<KnowledgeEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly source = signal<SourceFilter>('all');
  protected readonly type = signal<KnowledgeContentType | ''>('');

  protected readonly sourceOptions: { value: SourceFilter; label: string }[] = [
    { value: 'all', label: 'All sources' },
    { value: 'organization', label: 'Our organization' },
    { value: 'zebron', label: 'Zebron' },
  ];

  protected readonly organizationName = computed(
    () => this.organizationStore.selectedOrganization()?.name ?? 'your organization',
  );

  protected readonly canManage = computed(() => this.access.can('knowledge.manage'));

  protected readonly typeOptions = computed(() => {
    const present = new Set(this.articles().map((article) => article.contentType));
    return KNOWLEDGE_CONFIGURATION.contentTypes.filter((type) => present.has(type));
  });

  protected readonly filtered = computed(() => {
    const term = this.search();
    const source = this.source();
    const type = this.type();

    return this.articles().filter(
      (article) =>
        (source === 'all' || article.source === source) &&
        (!type || article.contentType === type) &&
        matchesKnowledgeSearch(article, term),
    );
  });

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle('Knowledge Center');

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // The page still works without the context (name falls back).
    }

    await this.load();
  }

  protected chipClass(active: boolean): string {
    return active
      ? 'rounded-full border border-[#007979] bg-[#007979] px-3 py-1 text-xs font-semibold text-white'
      : 'rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-[#007979] hover:text-[#007979]';
  }

  protected typeLabel(type: KnowledgeContentType): string {
    return KNOWLEDGE_TYPE_LABELS[type] ?? type;
  }

  protected typeIcon(type: KnowledgeContentType): string {
    return KNOWLEDGE_TYPE_ICONS[type] ?? 'article';
  }

  protected excerpt(article: KnowledgeEntry): string {
    return knowledgeExcerpt(article);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const audiences: KnowledgeAudience[] = this.access.isPlatformAdmin()
      ? ['user', 'admin', 'support', 'developer', 'all']
      : this.canManage()
        ? ['user', 'admin', 'all']
        : ['user', 'all'];

    const [organization, zebron] = await Promise.allSettled([
      this.knowledge.listOrganizationArticles(this.organizationId, !this.canManage()),
      this.knowledge.listZebronArticles(audiences),
    ]);

    const organizationArticles =
      organization.status === 'fulfilled' ? organization.value.filter((article) => article.status === 'published') : [];
    const zebronArticles =
      zebron.status === 'fulfilled'
        ? zebron.value.filter(
            (article) =>
              article.applicationKey === 'platform' ||
              article.applicationKey === 'knowledge' ||
              this.organizationStore.hasActiveApplication(article.applicationKey),
          )
        : [];

    if (organization.status === 'rejected' && zebron.status === 'rejected') {
      console.error('[Knowledge Center] Articles could not be loaded.', organization.reason, zebron.reason);
      this.error.set('Articles could not be loaded. Refresh the page or try again later.');
    } else if (organization.status === 'rejected') {
      console.error('[Knowledge Center] Organization articles could not be loaded.', organization.reason);
      this.error.set('Your organization’s articles could not be loaded. Zebron articles are shown.');
    }

    this.articles.set(
      [...organizationArticles, ...zebronArticles].sort((a, b) => {
        if (a.source !== b.source) return a.source === 'organization' ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    );
    this.loading.set(false);
  }
}

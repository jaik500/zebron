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
import { MatMenuModule } from '@angular/material/menu';

import { KnowledgeArticleStatus } from '../../../core/models/knowledge-article.model';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { OrganizationContextStore } from '../../organizations/stores/organization-context.store';
import { matchesKnowledgeSearch } from './knowledge-content.util';
import { KNOWLEDGE_TYPE_LABELS } from './organization-knowledge.component';
import { KnowledgeEntry, OrganizationKnowledgeService } from './organization-knowledge.service';

type StatusFilter = 'all' | KnowledgeArticleStatus;

/**
 * Knowledge Center management for staff, managers, admins and owners.
 * Opened from the gear on the Knowledge Center dashboard card.
 *
 * Route: /partner/org/:organizationId/knowledge/manage (staff and above)
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { KnowledgeReportsPanelComponent } from './knowledge-reports-panel.component';

@Component({
  selector: 'app-organization-knowledge-manager',
  standalone: true,
  imports: [
    TranslatePipe, KnowledgeReportsPanelComponent, DatePipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white">{{ 'Manage Knowledge Center' | t }}</h1>
            <p class="text-sm text-white/85">{{ 'Write, publish and archive {0} articles' | t: [organizationName()] }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId, 'knowledge']">
              <mat-icon>visibility</mat-icon>
              {{ 'View as reader' | t }}
            </a>
            <a mat-flat-button class="!bg-white !text-[#007979]" [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage', 'new']">
              <mat-icon>add</mat-icon>
              {{ 'New article' | t }}
            </a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <!-- Reports from readers -->
        <app-knowledge-reports-panel [organizationId]="organizationId" />

        <!-- Counts -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          @for (item of counters(); track item.value) {
            <button
              type="button"
              (click)="status.set(item.value)"
              [class]="
                'rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ' +
                (status() === item.value ? 'border-[#007979] ring-2 ring-[#007979]/20' : 'border-gray-200 hover:border-[#007979]/40')
              "
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ item.label | t }}</p>
              <p class="mt-1 text-2xl font-bold text-gray-900">{{ item.count }}</p>
            </button>
          }
        </div>

        <label class="relative mt-4 block">
          <span class="sr-only">{{ 'Search' | t }}</span>
          <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</mat-icon>
          <input
            type="search"
            class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
            [placeholder]="'Search your articles' | t"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
          />
        </label>

        @if (error()) {
          <p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }
        @if (notice()) {
          <p class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{{ notice() | t }}</p>
        }

        <section class="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          @if (loading()) {
            <p class="p-6 text-center text-sm text-gray-500">{{ 'Loading…' | t }}</p>
          } @else if (filtered().length === 0) {
            <div class="p-10 text-center">
              <p class="font-semibold text-gray-800">{{ articles().length ? ('No articles match' | t) : ('No articles yet' | t) }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ 'Articles you write here appear in your Knowledge Center and in the Ask for help assistant once published.' | t }}</p>
            </div>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (article of filtered(); track article.id) {
                <li class="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <div class="min-w-0 flex-1">
                    <a
                      class="font-semibold text-gray-900 hover:text-[#007979]"
                      [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage', article.id, 'edit']"
                    >
                      {{ article.title }}
                    </a>
                    <p class="mt-0.5 text-xs text-gray-500">
                      {{ '{0} · {1} · v{2} · Updated {3}' | t: [typeLabel(article), article.category, article.version, (article.updatedAt | date: 'medium')] }}
                    </p>
                  </div>
                  <span [class]="statusClass(article.status)">{{ article.status | t }}</span>
                  <button mat-icon-button type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'Actions for ' + article.title" [disabled]="busyId() === article.id">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <a mat-menu-item [routerLink]="['/partner/org', organizationId, 'knowledge', 'manage', article.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                      {{ 'Edit' | t }}
                    </a>
                    <a mat-menu-item [routerLink]="['/partner/org', organizationId, 'knowledge', 'articles', 'organization', article.id]">
                      <mat-icon>visibility</mat-icon>
                      {{ 'Preview' | t }}
                    </a>
                    @if (article.status === 'published') {
                      <button mat-menu-item type="button" (click)="archive(article)">
                        <mat-icon>archive</mat-icon>
                        {{ 'Archive' | t }}
                      </button>
                    }
                    @if (article.status === 'archived') {
                      <button mat-menu-item type="button" (click)="restore(article)">
                        <mat-icon>unarchive</mat-icon>
                        {{ 'Move back to drafts' | t }}
                      </button>
                    }
                    @if (article.status === 'draft' && !article.publishedAt) {
                      <button mat-menu-item type="button" class="!text-red-700" (click)="remove(article)">
                        <mat-icon class="!text-red-700">delete</mat-icon>
                        {{ 'Delete draft' | t }}
                      </button>
                    }
                  </mat-menu>
                </li>
              }
            </ul>
          }
        </section>
      </main>
    </div>
  `,
})
export class OrganizationKnowledgeManagerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly knowledge = inject(OrganizationKnowledgeService);
  private readonly auth = inject(AuthService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly articles = signal<KnowledgeEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly status = signal<StatusFilter>('all');
  protected readonly search = signal('');

  protected readonly organizationName = computed(
    () => this.organizationStore.selectedOrganization()?.name ?? 'your organization',
  );

  protected readonly counters = computed(() => {
    const list = this.articles();
    const count = (status: KnowledgeArticleStatus) => list.filter((article) => article.status === status).length;
    return [
      { value: 'all' as StatusFilter, label: 'All', count: list.length },
      { value: 'published' as StatusFilter, label: 'Published', count: count('published') },
      { value: 'draft' as StatusFilter, label: 'Drafts', count: count('draft') },
      { value: 'archived' as StatusFilter, label: 'Archived', count: count('archived') },
    ];
  });

  protected readonly filtered = computed(() => {
    const status = this.status();
    const term = this.search();
    return this.articles().filter(
      (article) => (status === 'all' || article.status === status) && matchesKnowledgeSearch(article, term),
    );
  });

  async ngOnInit(): Promise<void> {
    this.pageTitle.setTitle('Manage Knowledge Center');
    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Name falls back.
    }
    await this.load();
  }

  protected typeLabel(article: KnowledgeEntry): string {
    return KNOWLEDGE_TYPE_LABELS[article.contentType] ?? article.contentType;
  }

  protected statusClass(status: KnowledgeArticleStatus): string {
    const base = 'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ';
    if (status === 'published') return base + 'bg-emerald-50 text-emerald-800';
    if (status === 'draft') return base + 'bg-amber-100 text-amber-900';
    return base + 'bg-gray-100 text-gray-600';
  }

  protected async archive(article: KnowledgeEntry): Promise<void> {
    await this.run(article, 'Article archived. It no longer appears to members.', (userId) =>
      this.knowledge.archive(this.organizationId, article, userId),
    );
  }

  protected async restore(article: KnowledgeEntry): Promise<void> {
    await this.run(article, 'Article moved back to drafts.', (userId) =>
      this.knowledge.restoreToDraft(this.organizationId, article, userId),
    );
  }

  protected async remove(article: KnowledgeEntry): Promise<void> {
    if (!confirm(`Delete the draft "${article.title}"? This cannot be undone.`)) return;
    await this.run(article, 'Draft deleted.', () => this.knowledge.deleteDraft(this.organizationId, article.id));
  }

  private async run(article: KnowledgeEntry, success: string, action: (userId: string) => Promise<void>): Promise<void> {
    const userId = this.auth.firebaseUser()?.uid;
    if (!userId) {
      this.error.set('Sign in again to make changes.');
      return;
    }

    this.busyId.set(article.id);
    this.error.set(null);
    this.notice.set(null);
    try {
      await action(userId);
      this.notice.set(success);
      await this.load();
    } catch (error) {
      console.error('[Knowledge Center] Action failed.', error);
      this.error.set('That change could not be saved. Check your role and try again.');
    } finally {
      this.busyId.set(null);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.articles.set(await this.knowledge.listOrganizationArticles(this.organizationId, false));
    } catch (error) {
      console.error('[Knowledge Center] Articles could not be loaded.', error);
      this.error.set('Articles could not be loaded. Staff, managers, admins and owners can manage articles.');
    } finally {
      this.loading.set(false);
    }
  }
}

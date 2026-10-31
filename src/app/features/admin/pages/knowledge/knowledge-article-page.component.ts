import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { KNOWLEDGE_CONFIGURATION } from '../../../../core/config/knowledge.config';
import {
  KnowledgeArticle,
  KnowledgeArticleStatus,
  KnowledgeArticleVersion,
} from '../../../../core/models/knowledge-article.model';
import { AuthService } from '../../../../core/services/auth.service';
import { KnowledgeArticleService } from '../../../../core/services/knowledge-article.service';
import { KnowledgePdfService } from '../../../../core/services/knowledge-pdf.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { renderKnowledgeContent } from '../../../partner/knowledge/knowledge-content.util';

type ArticleAction = 'edit' | 'publish' | 'version' | 'archive' | 'restore' | 'pdf' | 'delete';

interface ActionButton {
  key: ArticleAction;
  label: string;
  icon: string;
  primary?: boolean;
}

/**
 * Admin view of one Zebron Knowledge Center article (/admin/knowledge/:id).
 *
 * Page header: back button and breadcrumbs on the left, the article's
 * actions on the right (icons only on phones) and a ⋮ menu with every
 * action.
 */
@Component({
  selector: 'app-knowledge-article-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgClass,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  styles: [
    `
      :host ::ng-deep .knowledge-body h2 { font-size: 1.35rem; font-weight: 700; margin: 1.6rem 0 0.6rem; color: #032d42; }
      :host ::ng-deep .knowledge-body h3 { font-size: 1.15rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #032d42; }
      :host ::ng-deep .knowledge-body h4 { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; }
      :host ::ng-deep .knowledge-body p { margin: 0 0 0.9rem; line-height: 1.75; }
      :host ::ng-deep .knowledge-body ul, :host ::ng-deep .knowledge-body ol { margin: 0 0 1rem 1.4rem; line-height: 1.7; }
      :host ::ng-deep .knowledge-body ul { list-style: disc; }
      :host ::ng-deep .knowledge-body ol { list-style: decimal; }
      :host ::ng-deep .knowledge-body li { margin: 0.2rem 0; }
      :host ::ng-deep .knowledge-body a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .knowledge-body code { background: #f1f5f9; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.875em; }
      :host ::ng-deep .knowledge-body pre { background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
      :host ::ng-deep .knowledge-body pre code { background: transparent; padding: 0; color: inherit; }
      :host ::ng-deep .knowledge-body blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.6rem 1rem; margin: 0 0 1rem; border-radius: 0 6px 6px 0; }
      :host ::ng-deep .knowledge-body > :first-child { margin-top: 0; }
    `,
  ],
  template: `
    <!-- Page header -->
    <header class="mt-16 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
      <div class="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6">
        <a
          routerLink="/admin/knowledge"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Back to the Knowledge Center"
          title="Back to the Knowledge Center"
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
        </a>

        <nav class="flex min-w-0 flex-1 items-center gap-1 text-sm" aria-label="Breadcrumb">
          <a routerLink="/admin" class="hidden shrink-0 text-white/80 hover:text-white hover:underline md:inline">Admin</a>
          <mat-icon class="!h-4 !w-4 hidden shrink-0 !text-[16px] text-white/60 md:inline-block" aria-hidden="true">chevron_right</mat-icon>
          <a routerLink="/admin/knowledge" class="shrink-0 text-white/80 hover:text-white hover:underline">
            <span class="hidden sm:inline">Knowledge Center</span>
            <span class="sm:hidden">Knowledge</span>
          </a>
          @if (article(); as current) {
            <mat-icon class="!h-4 !w-4 shrink-0 !text-[16px] text-white/60" aria-hidden="true">chevron_right</mat-icon>
            <span class="truncate font-semibold" aria-current="page">{{ current.title }}</span>
          }
        </nav>

        @if (article()) {
          <div class="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            @for (action of headerActions(); track action.key) {
              <button
                type="button"
                (click)="run(action.key)"
                [disabled]="busy()"
                class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 md:px-3"
                [ngClass]="
                  action.primary
                    ? 'bg-white text-[#007979] shadow-sm hover:bg-teal-50'
                    : 'text-white/90 hover:bg-white/15 hover:text-white md:border md:border-white/30'
                "
                [attr.aria-label]="action.label"
                [matTooltip]="action.label"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ action.icon }}</mat-icon>
                <span class="hidden md:inline">{{ action.label }}</span>
              </button>
            }

            <button
              type="button"
              [matMenuTriggerFor]="moreMenu"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="More actions"
              matTooltip="More"
            >
              <mat-icon aria-hidden="true">more_vert</mat-icon>
            </button>
          </div>
        }
      </div>
    </header>

    <!-- ⋮ menu: every action -->
    <mat-menu #moreMenu="matMenu" xPosition="before" class="zb-article-menu">
      @for (action of allActions(); track action.key) {
        <button mat-menu-item type="button" (click)="run(action.key)" [disabled]="busy()">
          <mat-icon [class.text-red-600]="action.key === 'delete'">{{ action.icon }}</mat-icon>
          <span [class.text-red-600]="action.key === 'delete'">{{ action.label }}</span>
        </button>
      }
    </mat-menu>

    <main class="min-h-screen bg-slate-50">
      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        @if (errorMessage()) {
          <div class="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <mat-icon class="shrink-0 text-red-600" aria-hidden="true">error_outline</mat-icon>
            <span class="min-w-0 flex-1">{{ errorMessage() }}</span>
            <button type="button" class="shrink-0 font-semibold underline" (click)="errorMessage.set(null)">Dismiss</button>
          </div>
        }

        @if (loading()) {
          <div class="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <mat-spinner diameter="32"></mat-spinner>
          </div>
        } @else if (article(); as current) {
          <!-- Summary -->
          <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="rounded-full bg-[#e5f4f4] px-2.5 py-0.5 font-semibold text-[#007979]">{{ applicationName(current.applicationKey) }}</span>
              <span class="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">{{ contentTypeLabel(current.contentType) }}</span>
              <span [class]="statusClass(current.status)">{{ statusLabel(current.status) }}</span>
              <span class="text-slate-400">v{{ current.version }}</span>
            </div>

            <h1 class="mt-3 text-2xl font-bold tracking-tight text-[#032D42] sm:text-3xl">{{ current.title }}</h1>
            @if (current.summary) {
              <p class="mt-2 text-slate-600">{{ current.summary }}</p>
            }

            <dl class="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</dt>
                <dd class="mt-0.5 text-slate-800">{{ current.category || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">Last updated</dt>
                <dd class="mt-0.5 text-slate-800">{{ current.updatedAt | date: 'mediumDate' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wider text-slate-500">Audience</dt>
                <dd class="mt-0.5 text-slate-800">{{ audienceLabel(current) }}</dd>
              </div>
            </dl>

            @if (current.tags.length) {
              <div class="mt-4 flex flex-wrap gap-1.5">
                @for (tag of current.tags; track tag) {
                  <span class="rounded-md bg-[#e5f4f4] px-2 py-0.5 text-xs text-[#007979]">#{{ tag }}</span>
                }
              </div>
            }
          </section>

          <!-- Content -->
          <article class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div class="knowledge-body text-[15px] text-slate-800" [innerHTML]="html()"></div>
          </article>

          <!-- Versions -->
          @if (versions().length) {
            <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">Version history</h2>
              <ul class="mt-3 divide-y divide-slate-100 text-sm">
                @for (version of versions(); track version.id) {
                  <li class="flex items-center justify-between gap-3 py-2">
                    <span class="min-w-0 truncate text-slate-800"><b>v{{ version.version }}</b> · {{ version.title }}</span>
                    <span class="shrink-0 text-xs text-slate-500">{{ version.createdAt | date: 'mediumDate' }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        } @else {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">menu_book</mat-icon>
            <p class="mt-2 font-semibold text-slate-800">This article was not found.</p>
            <a routerLink="/admin/knowledge" class="mt-4 inline-flex rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white">
              Back to the Knowledge Center
            </a>
          </div>
        }
      </div>
    </main>
  `,
})
export class KnowledgeArticlePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly knowledge = inject(KnowledgeArticleService);
  private readonly pdf = inject(KnowledgePdfService);
  private readonly logger = inject(LoggerService);
  private readonly pageTitle = inject(PageTitleService);

  private readonly applications = KNOWLEDGE_CONFIGURATION.applications;

  readonly article = signal<KnowledgeArticle | null>(null);
  readonly versions = signal<KnowledgeArticleVersion[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly html = computed(() => renderKnowledgeContent(this.article()?.content ?? ''));

  /** Every action available for the article's status (shown in the ⋮ menu). */
  readonly allActions = computed<ActionButton[]>(() => {
    const article = this.article();
    if (!article) {
      return [];
    }

    const actions: ActionButton[] = [];

    if (article.status === 'draft') {
      actions.push(
        { key: 'publish', label: 'Publish', icon: 'publish', primary: true },
        { key: 'edit', label: 'Edit', icon: 'edit' },
      );
    }
    if (article.status === 'published') {
      actions.push(
        { key: 'version', label: 'New version', icon: 'library_add', primary: true },
        { key: 'archive', label: 'Archive', icon: 'archive' },
      );
    }
    if (article.status === 'archived') {
      actions.push({ key: 'restore', label: 'Restore to drafts', icon: 'unarchive', primary: true });
    }
    if (article.downloadable) {
      actions.push({ key: 'pdf', label: 'Download PDF', icon: 'picture_as_pdf' });
    }
    if (article.status !== 'published') {
      actions.push({ key: 'delete', label: 'Delete', icon: 'delete' });
    }

    return actions;
  });

  /** The header shows the main actions; Delete stays in the ⋮ menu. */
  readonly headerActions = computed(() => this.allActions().filter((action) => action.key !== 'delete'));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    try {
      const article = await this.knowledge.getById(id);
      this.article.set(article);

      if (article) {
        this.pageTitle.setTitle(`Knowledge Center`);
        this.pageTitle.setDocumentTitle(article.title);
        this.versions.set(
          [...(await this.knowledge.getVersions(article.id))].sort((a, b) => b.version - a.version),
        );
      }
    } catch (error) {
      this.logger.error('KnowledgeArticlePageComponent', `Failed to load knowledge article: ${id}`, error);
      this.errorMessage.set('The article could not be loaded. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async run(action: ArticleAction): Promise<void> {
    const article = this.article();
    const userId = this.auth.user()?.id ?? null;

    if (!article || this.busy()) {
      return;
    }

    if (action === 'edit') {
      await this.router.navigate(['/admin/knowledge', article.id, 'edit']);
      return;
    }

    if (action === 'delete') {
      this.confirmDelete(article);
      return;
    }

    if (action !== 'pdf' && !userId) {
      this.errorMessage.set('Your account could not be identified. Please sign in again.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);

    try {
      switch (action) {
        case 'publish':
          await this.knowledge.publish(article.id, userId!);
          break;
        case 'archive':
          await this.knowledge.archive(article.id, userId!);
          break;
        case 'restore':
          await this.knowledge.restore(article.id, userId!);
          break;
        case 'version': {
          const draft = await this.knowledge.createVersionDraft(article.id, userId!);
          await this.router.navigate(['/admin/knowledge', draft.id, 'edit']);
          return;
        }
        case 'pdf':
          await this.pdf.download(article);
          return;
      }

      this.article.set(await this.knowledge.getById(article.id));
    } catch (error) {
      this.logger.error('KnowledgeArticlePageComponent', `Article action failed: ${action}`, error);
      this.errorMessage.set(this.failureMessage(action));
    } finally {
      this.busy.set(false);
    }
  }

  private confirmDelete(article: KnowledgeArticle): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete article',
          message: `Delete "${article.title}"? This cannot be undone.`,
          icon: 'delete',
          confirmText: 'Delete',
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe(async (confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        try {
          await this.knowledge.delete(article.id);
          await this.router.navigate(['/admin/knowledge']);
        } catch (error) {
          this.logger.error('KnowledgeArticlePageComponent', `Failed to delete article: ${article.id}`, error);
          this.errorMessage.set('The article could not be deleted.');
        }
      });
  }

  private failureMessage(action: ArticleAction): string {
    const messages: Record<ArticleAction, string> = {
      edit: 'The editor could not be opened.',
      publish: 'The article could not be published.',
      version: 'A new version of the article could not be created.',
      archive: 'The article could not be archived.',
      restore: 'The article could not be restored.',
      pdf: 'The PDF could not be generated.',
      delete: 'The article could not be deleted.',
    };
    return messages[action];
  }

  applicationName(applicationKey: string): string {
    return this.applications.find((application) => application.key === applicationKey)?.name ?? applicationKey;
  }

  contentTypeLabel(type: string): string {
    return type.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  statusLabel(status: KnowledgeArticleStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  statusClass(status: KnowledgeArticleStatus): string {
    const base = 'rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ';
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
    if (article.audience.includes('all')) {
      return labels['all'];
    }
    return article.audience.map((audience) => labels[audience] ?? audience).join(', ');
  }

  isGuideArticle(article: KnowledgeArticle): boolean {
    return article.metadata?.['source'] === 'platform-guide';
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { KnowledgeArticle } from '../../core/models/knowledge-article.model';
import { AuthService } from '../../core/services/auth.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { PUBLIC_KNOWLEDGE_TYPE_LABELS, PublicKnowledgeService } from './public-knowledge.service';

/**
 * Public Knowledge Center (/knowledge): Zebron's published guides,
 * how-tos, troubleshooting and FAQs, for everyone.
 */
@Component({
  selector: 'app-public-knowledge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatIconModule, TranslatePipe],
  template: `
    <section class="relative overflow-hidden bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
      <div class="relative mx-auto max-w-7xl px-5 pb-5 pt-20 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-white/80">Zebron</p>
            <h1 class="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{{ 'Knowledge Center' | t }}</h1>
            <p class="mt-1 max-w-2xl text-sm text-white/85">
              {{ 'Articles, guides and answers from Zebron.' | t }}
            </p>
          </div>
          <div class="relative w-full shrink-0 lg:w-[26rem]">
            <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-slate-400" aria-hidden="true">search</mat-icon>
            <input
              #box
              type="search"
              class="h-10 w-full rounded-lg border-0 bg-white pl-10 pr-3 text-sm text-slate-900 shadow outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-[#89D7B7]/50"
              [placeholder]="'Search articles' | t"
              [attr.aria-label]="'Search articles' | t"
              [value]="search()"
              (input)="search.set(box.value)"
            />
          </div>
        </div>

        @if (categories().length) {
          <!--
            Mobile: one line of chips, most popular first; chips that don't
            fit wrap onto a hidden second line. "More" shows them all.
            Desktop: every category, alphabetical.
          -->
          <div class="mt-4 flex items-start gap-1.5">
            <nav
              [class]="'flex min-w-0 flex-1 flex-wrap gap-1.5' + (showAllCategories() ? '' : ' max-sm:h-[26px] max-sm:overflow-hidden')"
              [attr.aria-label]="'Categories' | t"
            >
              <button
                type="button"
                (click)="category.set('')"
                [class]="chipClass(!category())"
              >
                {{ 'All' | t }}
              </button>
              @for (item of categories(); track item) {
                <button
                  type="button"
                  (click)="category.set(item)"
                  [style.--rank]="rankOf(item)"
                  [class]="chipClass(category() === item) + ' max-sm:[order:var(--rank)]'"
                >
                  {{ item | t }}
                </button>
              }
            </nav>
            @if (categories().length > 2) {
              <button
                type="button"
                (click)="showAllCategories.set(!showAllCategories())"
                [attr.aria-expanded]="showAllCategories()"
                class="inline-flex shrink-0 items-center rounded-full border border-white/40 px-2.5 py-1 text-xs leading-4 text-white hover:bg-white/15 sm:hidden"
              >
                {{ (showAllCategories() ? 'Less' : 'More') | t }}
              </button>
            }
          </div>
        }
      </div>
    </section>

    <div class="bg-slate-50">
      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        @if (loading()) {
          <p class="py-16 text-center text-sm text-slate-500">{{ 'Loading articles…' | t }}</p>
        } @else if (filtered().length === 0) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <mat-icon class="!text-slate-400" aria-hidden="true">search_off</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">
              {{ (articles().length ? 'No articles match your search.' : 'No articles have been published yet.') | t }}
            </p>
            @if (!signedIn()) {
              <p class="mt-1 text-sm text-slate-500">
                <a routerLink="/login" class="font-semibold text-[#007979] hover:underline">{{ 'Sign in' | t }}</a>
                {{ 'to see more articles.' | t }}
              </p>
            }
          </div>
        } @else {
          <p class="mb-4 text-sm text-slate-500">{{ '{0} articles' | t: [filtered().length] }}</p>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (article of filtered(); track article.id) {
              <a
                [routerLink]="['/knowledge', article.id]"
                class="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md"
              >
                <div class="flex flex-wrap items-center gap-1.5 text-xs">
                  <span class="rounded-full bg-[#007979]/10 px-2 py-0.5 font-medium text-[#006666]">{{ typeLabel(article) | t }}</span>
                  @if (article.category) {
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ article.category | t }}</span>
                  }
                </div>
                <h2 class="mt-3 text-lg font-bold text-[#032D42] group-hover:text-[#007979]">{{ article.title }}</h2>
                @if (article.summary) {
                  <p class="mt-1.5 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{{ article.summary }}</p>
                }
                <p class="mt-4 text-xs text-slate-400">{{ 'Updated {0}' | t: [(article.updatedAt | date: 'mediumDate')] }}</p>
              </a>
            }
          </div>
        }

        @if (!signedIn()) {
          <p class="mt-8 text-center text-sm text-slate-500">
            {{ 'Members of an organization on Zebron also have their organization\\u0027s own Knowledge Center in the Partner Portal.' | t }}
          </p>
        }
      </div>
    </div>
  `,
})
export class PublicKnowledgeComponent {
  private readonly knowledge = inject(PublicKnowledgeService);
  private readonly auth = inject(AuthService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly articles = signal<KnowledgeArticle[]>([]);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly category = signal('');

  protected readonly signedIn = computed(() => !!this.auth.firebaseUser());

  /** Mobile: show every category chip instead of one line. */
  protected readonly showAllCategories = signal(false);

  /**
   * Mobile order of the category chips: the selected category first,
   * then by number of articles (most popular), then alphabetical.
   */
  private readonly categoryRanks = computed(() => {
    const counts = new Map<string, number>();
    for (const article of this.articles()) {
      if (article.category) {
        counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
      }
    }
    const selected = this.category();
    const ordered = [...counts.keys()].sort((a, b) =>
      (b === selected ? 1 : 0) - (a === selected ? 1 : 0) ||
      (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
      a.localeCompare(b),
    );
    return new Map(ordered.map((category, index) => [category, index + 1]));
  });

  protected readonly categories = computed(() =>
    [...new Set(this.articles().map((article) => article.category).filter(Boolean))].sort(),
  );

  protected readonly filtered = computed(() => {
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const category = this.category();
    return this.articles().filter((article) => {
      if (category && article.category !== category) {
        return false;
      }
      const text = [article.title, article.summary, article.category, article.content, ...article.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return words.every((word) => text.includes(word));
    });
  });

  constructor() {
    this.pageTitle.setTitle('Knowledge Center');

    // Load once sign-in is known, and again if it changes.
    effect(() => {
      if (this.auth.isLoading()) {
        return;
      }
      const signedIn = this.signedIn();
      untracked(() => void this.load(signedIn));
    });
  }

  private async load(signedIn: boolean): Promise<void> {
    this.loading.set(true);
    try {
      this.articles.set(await this.knowledge.list(signedIn));
    } catch (error) {
      console.info('[Knowledge Center] Articles not available.', error);
      this.articles.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected rankOf(category: string): number {
    return this.categoryRanks().get(category) ?? 999;
  }

  protected chipClass(active: boolean): string {
    return active
      ? 'shrink-0 rounded-full border border-white bg-white px-2.5 py-1 text-xs font-semibold leading-4 text-[#006666]'
      : 'shrink-0 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs leading-4 text-white hover:bg-white/20';
  }

  protected typeLabel(article: KnowledgeArticle): string {
    return PUBLIC_KNOWLEDGE_TYPE_LABELS[article.contentType] ?? article.contentType;
  }
}

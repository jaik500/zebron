import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { KnowledgeArticle } from '../../core/models/knowledge-article.model';
import { AuthService } from '../../core/services/auth.service';
import {
  KNOWLEDGE_REPORT_REASONS,
  KnowledgeArticleRef,
  KnowledgeFeedbackService,
  KnowledgeReportReason,
} from '../../core/services/knowledge-feedback.service';
import { KnowledgePdfService } from '../../core/services/knowledge-pdf.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { renderKnowledgeContent } from '../partner/knowledge/knowledge-content.util';
import { PUBLIC_KNOWLEDGE_TYPE_LABELS, PublicKnowledgeService } from './public-knowledge.service';

/**
 * One public Knowledge Center article (/knowledge/:articleId), with likes,
 * sharing (including to the Community) and reporting.
 */
@Component({
  selector: 'app-public-knowledge-article',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  styles: [
    `
      :host ::ng-deep .knowledge-body :is(h2) { font-size: 1.35rem; font-weight: 700; margin: 1.6rem 0 0.6rem; color: #111827; }
      :host ::ng-deep .knowledge-body :is(h3) { font-size: 1.15rem; font-weight: 700; margin: 1.4rem 0 0.5rem; color: #111827; }
      :host ::ng-deep .knowledge-body :is(h4) { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; color: #111827; }
      :host ::ng-deep .knowledge-body p { margin: 0 0 0.9rem; line-height: 1.75; }
      :host ::ng-deep .knowledge-body ul, :host ::ng-deep .knowledge-body ol { margin: 0 0 1rem 1.4rem; line-height: 1.7; }
      :host ::ng-deep .knowledge-body ul { list-style: disc; }
      :host ::ng-deep .knowledge-body ol { list-style: decimal; }
      :host ::ng-deep .knowledge-body li { margin: 0.2rem 0; }
      :host ::ng-deep .knowledge-body a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .knowledge-body code { background: #f3f4f6; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.875em; }
      :host ::ng-deep .knowledge-body pre { background: #111827; color: #f9fafb; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
      :host ::ng-deep .knowledge-body pre code { background: transparent; padding: 0; color: inherit; }
      :host ::ng-deep .knowledge-body blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.6rem 1rem; margin: 0 0 1rem; border-radius: 0 6px 6px 0; }
      :host ::ng-deep .knowledge-body > :first-child { margin-top: 0; }
      :host ::ng-deep .knowledge-body li > p { margin: 0; }
      :host ::ng-deep .knowledge-body :is(p, ul, ol, pre, blockquote) + :is(h2, h3, h4) { margin-top: 1.75rem; }
    `,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 pt-16">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
        <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a mat-stroked-button class="!border-white/40 !text-white" routerLink="/knowledge">
            <mat-icon>arrow_back</mat-icon>
            {{ 'Knowledge Center' | t }}
          </a>
          @if (article(); as current) {
            <div class="flex flex-wrap items-center gap-2">
              <button
                mat-stroked-button
                type="button"
                class="!border-white/40 !text-white"
                [attr.aria-pressed]="liked()"
                [disabled]="likeBusy()"
                (click)="toggleLike()"
                [title]="(uidSet() ? (liked() ? 'Unlike' : 'Like this article') : 'Sign in to like articles') | t"
              >
                <mat-icon [class]="liked() ? '!text-rose-300' : ''">{{ liked() ? 'favorite' : 'favorite_border' }}</mat-icon>
                @if (uidSet()) {
                  {{ likeCount() }}
                } @else {
                  {{ 'Like' | t }}
                }
              </button>

              <button mat-stroked-button type="button" class="!border-white/40 !text-white" [matMenuTriggerFor]="shareMenu">
                <mat-icon>share</mat-icon>
                {{ 'Share' | t }}
              </button>
              <mat-menu #shareMenu="matMenu" xPosition="before">
                <button mat-menu-item type="button" (click)="shareInCommunity(current)">
                  <mat-icon>forum</mat-icon>
                  <span>{{ 'Share in Community' | t }}</span>
                </button>
                <button mat-menu-item type="button" (click)="copyLink()">
                  <mat-icon>link</mat-icon>
                  <span>{{ 'Copy link' | t }}</span>
                </button>
                <a mat-menu-item [href]="emailLink(current)">
                  <mat-icon>mail</mat-icon>
                  <span>{{ 'Send by email' | t }}</span>
                </a>
                @if (canNativeShare) {
                  <button mat-menu-item type="button" (click)="nativeShare(current)">
                    <mat-icon>ios_share</mat-icon>
                    <span>{{ 'More options…' | t }}</span>
                  </button>
                }
              </mat-menu>

              @if (current.downloadable) {
                <button mat-stroked-button type="button" class="!border-white/40 !text-white" (click)="download(current)">
                  <mat-icon>download</mat-icon>
                  {{ 'PDF' | t }}
                </button>
              }

              <button mat-icon-button type="button" class="!text-white" [matMenuTriggerFor]="moreMenu" [attr.aria-label]="'More actions' | t">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #moreMenu="matMenu" xPosition="before">
                <button mat-menu-item type="button" (click)="copyLink()">
                  <mat-icon>link</mat-icon>
                  <span>{{ 'Copy link' | t }}</span>
                </button>
                <button mat-menu-item type="button" [disabled]="reported()" (click)="openReport()">
                  <mat-icon class="!text-red-600">flag</mat-icon>
                  <span>{{ (reported() ? 'Reported — thank you' : 'Report this article') | t }}</span>
                </button>
              </mat-menu>
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
              <span class="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800">Zebron</span>
              <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{{ typeLabel() | t }}</span>
              @if (current.category) {
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">{{ current.category | t }}</span>
              }
            </div>

            <h1 class="mt-3 text-3xl font-bold text-gray-900">{{ current.title }}</h1>
            @if (current.summary) {
              <p class="mt-2 text-lg leading-7 text-gray-600">{{ current.summary }}</p>
            }
            <p class="mt-3 text-xs text-gray-500">{{ 'Updated {0}' | t: [(current.updatedAt | date: 'mediumDate')] }}</p>

            <hr class="my-6 border-gray-200" />

            <div class="knowledge-body text-[15px] text-gray-800" [innerHTML]="html()"></div>

            @if (current.tags.length) {
              <div class="mt-8 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                @for (tag of current.tags; track tag) {
                  <span class="rounded-full bg-[#007979]/10 px-2.5 py-0.5 text-xs font-medium text-[#007979]">#{{ tag }}</span>
                }
              </div>
            }

            <div class="mt-8 flex flex-col items-start gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-slate-600">{{ 'Was this article helpful?' | t }}</p>
              <div class="flex gap-2">
                <button type="button" class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-[#007979]" (click)="toggleLike()">
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ liked() ? 'favorite' : 'favorite_border' }}</mat-icon>
                  {{ (liked() ? 'You like this' : 'Yes, I like it') | t }}
                </button>
                <a routerLink="/support" class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-[#007979]">
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">support_agent</mat-icon>
                  {{ 'I still need help' | t }}
                </a>
              </div>
            </div>
          </article>
        } @else {
          <div class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p class="font-semibold text-gray-800">{{ 'This article is not available' | t }}</p>
            <p class="mt-1 text-sm text-gray-500">
              {{ 'It may have been archived, or you may need to sign in to read it.' | t }}
            </p>
            <a routerLink="/knowledge" class="mt-3 inline-block text-sm font-semibold text-[#007979] hover:underline">{{ 'Back to the Knowledge Center' | t }}</a>
          </div>
        }
      </main>

      <!-- Report dialog -->
      @if (reportOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" (click)="reportOpen.set(false)">
          <section
            class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            [attr.aria-label]="'Report this article' | t"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">{{ 'Report this article' | t }}</h2>
                <p class="mt-1 text-sm text-gray-500">{{ 'Tell the people who look after this article what is wrong. Your report is private.' | t }}</p>
              </div>
              <button mat-icon-button type="button" (click)="reportOpen.set(false)" [attr.aria-label]="'Close' | t">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <fieldset class="mt-4 space-y-2">
              <legend class="mb-1 text-sm font-medium text-gray-800">{{ 'What is the problem?' | t }}</legend>
              @for (option of reasons; track option.value) {
                <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                  <input type="radio" name="reason" [value]="option.value" [checked]="reportReason() === option.value" (change)="reportReason.set(option.value)" />
                  {{ option.label | t }}
                </label>
              }
            </fieldset>

            <label class="mt-4 block text-sm font-medium text-gray-800" for="report-details">{{ 'Details (optional)' | t }}</label>
            <textarea
              id="report-details"
              rows="3"
              maxlength="1000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#007979] focus:ring-4 focus:ring-[#007979]/15"
              [(ngModel)]="reportDetails"
            ></textarea>

            <div class="mt-5 flex justify-end gap-2">
              <button mat-stroked-button type="button" (click)="reportOpen.set(false)">{{ 'Cancel' | t }}</button>
              <button mat-flat-button color="warn" type="button" [disabled]="!reportReason() || reportBusy()" (click)="submitReport()">
                {{ (reportBusy() ? 'Sending…' : 'Send report') | t }}
              </button>
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class PublicKnowledgeArticleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly knowledge = inject(PublicKnowledgeService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly pdf = inject(KnowledgePdfService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly feedback = inject(KnowledgeFeedbackService);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);

  private readonly articleId = this.route.snapshot.paramMap.get('articleId') ?? '';

  protected readonly article = signal<KnowledgeArticle | null>(null);
  protected readonly loading = signal(true);

  protected readonly html = computed(() => renderKnowledgeContent(this.article()?.content ?? ''));
  protected readonly typeLabel = computed(() => {
    const type = this.article()?.contentType;
    return type ? PUBLIC_KNOWLEDGE_TYPE_LABELS[type] ?? type : '';
  });
  protected readonly uidSet = computed(() => !!this.auth.firebaseUser());

  // Likes
  protected readonly liked = signal(false);
  protected readonly likeCount = signal(0);
  protected readonly likeBusy = signal(false);

  // Reports
  protected readonly reasons = KNOWLEDGE_REPORT_REASONS;
  protected readonly reportOpen = signal(false);
  protected readonly reportReason = signal<KnowledgeReportReason | null>(null);
  protected readonly reportBusy = signal(false);
  protected readonly reported = signal(false);
  protected reportDetails = '';

  protected readonly canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  constructor() {
    // Load once sign-in is known (signed-in readers see more articles).
    effect(() => {
      if (this.auth.isLoading()) {
        return;
      }
      const signedIn = this.uidSet();
      untracked(() => void this.load(signedIn));
    });
  }

  private async load(signedIn: boolean): Promise<void> {
    const article = await this.knowledge.get(this.articleId, signedIn);
    this.article.set(article);
    this.pageTitle.setTitle(article?.title ?? 'Knowledge Center');
    this.loading.set(false);
    if (article && signedIn) {
      // Likes and reports are for signed-in readers.
      void this.loadFeedback();
    }
  }

  protected async download(article: KnowledgeArticle): Promise<void> {
    await this.pdf.download(article);
  }

  // ===========================================================
  // Likes, sharing and reports
  // ===========================================================

  private get ref(): KnowledgeArticleRef {
    return { source: 'zebron', organizationId: null, articleId: this.articleId };
  }

  private get uid(): string | null {
    return this.auth.firebaseUser()?.uid ?? null;
  }

  private async loadFeedback(): Promise<void> {
    const uid = this.uid;
    try {
      const [count, liked, reported] = await Promise.all([
        this.feedback.likeCount(this.ref),
        uid ? this.feedback.hasLiked(this.ref, uid) : Promise.resolve(false),
        uid ? this.feedback.hasReported(this.ref, uid) : Promise.resolve(false),
      ]);
      this.likeCount.set(count);
      this.liked.set(liked);
      this.reported.set(reported);
    } catch (error) {
      console.info('[Knowledge Center] Likes not available.', error);
    }
  }

  protected async toggleLike(): Promise<void> {
    const uid = this.uid;
    if (!uid) {
      void this.router.navigate(['/login']);
      return;
    }
    if (this.likeBusy()) {
      return;
    }

    const wasLiked = this.liked();
    this.likeBusy.set(true);
    // Update straight away; undo if the save fails.
    this.liked.set(!wasLiked);
    this.likeCount.update((count) => Math.max(0, count + (wasLiked ? -1 : 1)));

    try {
      if (wasLiked) {
        await this.feedback.unlike(this.ref, uid);
      } else {
        await this.feedback.like(this.ref, uid);
      }
    } catch {
      this.liked.set(wasLiked);
      this.likeCount.update((count) => Math.max(0, count + (wasLiked ? 1 : -1)));
      this.toast.error(this.i18n.t('Your like could not be saved. Try again.'));
    } finally {
      this.likeBusy.set(false);
    }
  }

  private articleUrl(): string {
    const path = `/knowledge/${encodeURIComponent(this.articleId)}`;
    return typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
  }

  protected async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.articleUrl());
      this.toast.success(this.i18n.t('Link copied.'));
    } catch {
      this.toast.error(this.i18n.t('The link could not be copied.'));
    }
  }

  protected emailLink(article: KnowledgeArticle): string {
    const subject = encodeURIComponent(article.title);
    const body = encodeURIComponent(`${article.summary ? article.summary + '\n\n' : ''}${this.articleUrl()}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  protected async nativeShare(article: KnowledgeArticle): Promise<void> {
    try {
      await navigator.share({ title: article.title, text: article.summary ?? '', url: this.articleUrl() });
    } catch {
      // Cancelled.
    }
  }

  /** Opens the organization's Community with a new post ready to publish. */
  protected shareInCommunity(article: KnowledgeArticle): void {
    const text = [
      article.summary ?? '',
      `${this.i18n.t('Read it in the Knowledge Center:')} ${this.articleUrl()}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // Signed-out visitors are asked to sign in by the Community first.
    void this.router.navigate(['/community'], {
      queryParams: { shareTitle: article.title, shareText: text },
    });
  }

  protected openReport(): void {
    if (!this.uid) {
      void this.router.navigate(['/login']);
      return;
    }
    if (this.reported()) {
      return;
    }
    this.reportReason.set(null);
    this.reportDetails = '';
    this.reportOpen.set(true);
  }

  protected async submitReport(): Promise<void> {
    const uid = this.uid;
    const article = this.article();
    const reason = this.reportReason();
    if (!uid || !article || !reason) {
      return;
    }

    this.reportBusy.set(true);
    try {
      const user = this.auth.user();
      await this.feedback.report(this.ref, {
        uid,
        reporterName: user?.displayName || this.auth.firebaseUser()?.email || '',
        articleTitle: article.title,
        reason,
        details: this.reportDetails,
      });
      this.reported.set(true);
      this.reportOpen.set(false);
      this.toast.success(this.i18n.t('Thank you. The article has been reported for review.'));
    } catch {
      this.toast.error(this.i18n.t('The report could not be sent. Try again.'));
    } finally {
      this.reportBusy.set(false);
    }
  }
}

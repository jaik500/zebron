import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';

import { BlogAccessService, blogContextFromRoute } from '../blog-access.service';
import {
  BLOG_COVERS,
  BLOG_REACTIONS,
  BLOG_SECTION_META,
  BLOG_STATUS_META,
  blogDate,
  initialsOf,
} from '../blog.model';
import { BlogStore } from '../blog.store';

/** One blog post: article, contents list, reactions and comments. */
@Component({
  selector: 'app-blog-post',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, FormsModule, MatIconModule, TranslatePipe],
  styles: [
    `
      :host ::ng-deep .blog-prose h2 { font-size: 1.4rem; font-weight: 700; margin: 2rem 0 0.6rem; color: #032d42; scroll-margin-top: 5rem; }
      :host ::ng-deep .blog-prose h3 { font-size: 1.15rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #032d42; }
      :host ::ng-deep .blog-prose h4 { font-size: 1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; }
      :host ::ng-deep .blog-prose p { margin: 0 0 1rem; }
      :host ::ng-deep .blog-prose ul, :host ::ng-deep .blog-prose ol { margin: 0 0 1rem 1.4rem; }
      :host ::ng-deep .blog-prose ul { list-style: disc; }
      :host ::ng-deep .blog-prose ol { list-style: decimal; }
      :host ::ng-deep .blog-prose li { margin: 0.25rem 0; }
      :host ::ng-deep .blog-prose a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .blog-prose code { background: #f1f5f9; border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.875em; }
      :host ::ng-deep .blog-prose pre { background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0 0 1rem; }
      :host ::ng-deep .blog-prose pre code { background: transparent; padding: 0; color: inherit; }
      :host ::ng-deep .blog-prose blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.6rem 1rem; margin: 1.25rem 0; border-radius: 0 6px 6px 0; }
      :host ::ng-deep .blog-prose > :first-child { margin-top: 0; }
    `,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <a
            [routerLink]="context.basePath"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            [attr.aria-label]="'Back to the blog' | t"
            [title]="'Back to the blog' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ 'Blog' | t }}</p>

          @if (canEdit()) {
            <a
              [routerLink]="[context.basePath, 'write', store.post()!.id]"
              class="inline-flex h-9 items-center gap-1 rounded-lg border border-white/30 px-3 text-sm font-semibold transition hover:bg-white/15"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">edit</mat-icon>{{ 'Edit' | t }}
            </a>
          }
          @if (store.post()?.section === 'public' && store.post()?.status === 'published') {
            <button
              type="button"
              (click)="copyLink()"
              class="inline-flex h-9 items-center gap-1 rounded-lg border border-white/30 px-3 text-sm font-semibold transition hover:bg-white/15"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">link</mat-icon>{{ 'Copy link' | t }}
            </button>
          }
        </div>
      </header>

      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        @if (store.postLoading()) {
          <div class="mx-auto max-w-3xl animate-pulse space-y-4" aria-busy="true">
            <div class="h-8 w-3/4 rounded bg-slate-200"></div>
            <div class="h-4 w-1/2 rounded bg-slate-200"></div>
            <div class="h-64 rounded-xl bg-slate-200"></div>
          </div>
        } @else if (store.postError()) {
          <div class="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">article</mat-icon>
            <p class="mt-2 font-semibold text-slate-800">{{ store.postError()! | t }}</p>
            <a [routerLink]="context.basePath" class="mt-4 inline-flex rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white">
              {{ 'Back to the blog' | t }}
            </a>
          </div>
        } @else if (store.post(); as post) {
          <div class="grid gap-10 lg:grid-cols-[minmax(0,720px)_220px] lg:justify-center">
            <article class="min-w-0">
              @if (post.status !== 'published') {
                <div class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span class="rounded-full px-2 py-0.5 text-xs font-bold" [class]="statusMeta().badgeClass">{{ statusMeta().label | t }}</span>
                  {{ 'Preview: readers cannot see this post yet.' | t }}
                  @if (post.reviewNote) {
                    <span class="w-full text-xs">{{ 'Reviewer note: {0}' | t: [post.reviewNote] }}</span>
                  }
                </div>
              }

              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#007979]">{{ post.topic | t }}</span>
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="sectionMeta().badgeClass">
                  <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">{{ sectionMeta().icon }}</mat-icon>{{ sectionMeta().badge | t }}
                </span>
              </div>

              <h1 class="mt-2 text-3xl font-bold leading-tight text-[#032D42] sm:text-4xl">{{ post.title }}</h1>

              @if (post.excerpt) {
                <p class="mt-3 text-lg text-slate-600">{{ post.excerpt }}</p>
              }

              <div class="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#007979] text-xs font-bold text-white" aria-hidden="true">{{ initials() }}</span>
                <span><b class="text-slate-800">{{ post.authorName }}</b> · {{ date() }} · {{ '{0} min read' | t: [post.readingMinutes] }}</span>
              </div>

              <div class="my-6 h-56 rounded-xl sm:h-72" [style.background]="cover()" aria-hidden="true"></div>

              <div #prose class="blog-prose text-[17px] leading-8 text-slate-800" [innerHTML]="html()"></div>

              @if (post.status === 'published') {
                <!-- Reactions -->
                <div class="mt-8 flex flex-wrap gap-2" role="group" [attr.aria-label]="'Reactions' | t">
                  @for (reaction of reactions; track reaction.type) {
                    <button
                      type="button"
                      (click)="react(reaction.type)"
                      class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                      [ngClass]="
                        store.myReaction() === reaction.type
                          ? 'border-[#007979] bg-[#e5f4f4] font-semibold text-[#007979]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#007979]'
                      "
                      [attr.aria-pressed]="store.myReaction() === reaction.type"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ reaction.icon }}</mat-icon>
                      {{ reaction.label | t }} · {{ store.reactionCounts()[reaction.type] }}
                    </button>
                  }
                </div>

                <!-- Comments -->
                <section class="mt-8 border-t border-slate-200 pt-6" [attr.aria-label]="'Comments' | t">
                  <h2 class="text-lg font-bold text-[#032D42]">{{ 'Comments' | t }} · {{ store.comments().length }}</h2>

                  @if (signedIn()) {
                    <form class="mt-3 flex flex-col gap-2" (ngSubmit)="addComment()">
                      <label for="blog-comment" class="sr-only">{{ 'Add a comment' | t }}</label>
                      <textarea
                        id="blog-comment"
                        name="comment"
                        rows="3"
                        maxlength="2000"
                        [(ngModel)]="commentText"
                        [placeholder]="'Add a comment...' | t"
                        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/15"
                      ></textarea>
                      <div class="flex justify-end">
                        <button
                          type="submit"
                          [disabled]="!commentText.trim() || posting()"
                          class="rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {{ (posting() ? 'Posting...' : 'Post comment') | t }}
                        </button>
                      </div>
                    </form>
                  } @else {
                    <p class="mt-2 text-sm text-slate-500">
                      <a routerLink="/login" class="font-semibold text-[#007979] underline">{{ 'Sign in' | t }}</a>
                      {{ 'to react and join the conversation.' | t }}
                    </p>
                  }

                  <ul class="mt-4 space-y-4">
                    @for (comment of store.comments(); track comment.id) {
                      <li class="flex gap-3">
                        <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a835f] text-xs font-bold text-white" aria-hidden="true">
                          {{ initialsOf(comment.authorName) }}
                        </span>
                        <div class="min-w-0 flex-1">
                          <p class="text-sm">
                            <b class="text-slate-800">{{ comment.authorName }}</b>
                            <span class="text-xs text-slate-500"> · {{ blogDate(comment.createdAt) }}</span>
                          </p>
                          <p class="whitespace-pre-line break-words text-sm text-slate-700">{{ comment.text }}</p>
                        </div>
                        @if (canDeleteComment(comment.authorId)) {
                          <button
                            type="button"
                            (click)="deleteComment(comment.id)"
                            class="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600"
                            [attr.aria-label]="'Delete comment' | t"
                            [title]="'Delete comment' | t"
                          >
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon>
                          </button>
                        }
                      </li>
                    } @empty {
                      <li class="text-sm text-slate-500">{{ 'No comments yet.' | t }}</li>
                    }
                  </ul>
                </section>
              }
            </article>

            <!-- On this page -->
            @if (headings().length > 1) {
              <nav class="sticky top-24 hidden self-start text-sm lg:block" [attr.aria-label]="'On this page' | t">
                <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'On this page' | t }}</h2>
                @for (heading of headings(); track $index) {
                  <button
                    type="button"
                    (click)="scrollToHeading($index)"
                    class="block w-full border-l-2 border-slate-200 py-1 pl-3 text-left text-slate-600 hover:border-[#007979] hover:text-[#007979]"
                  >
                    {{ heading }}
                  </button>
                }
              </nav>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class BlogPostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(BlogAccessService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(HotToastService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(BlogStore);

  protected readonly context = blogContextFromRoute(this.route);
  protected readonly reactions = BLOG_REACTIONS;
  protected readonly initialsOf = initialsOf;
  protected readonly blogDate = blogDate;

  private readonly prose = viewChild<ElementRef<HTMLElement>>('prose');

  protected commentText = '';
  protected readonly posting = signal(false);

  protected readonly signedIn = computed(() => this.access.signedIn());
  protected readonly html = computed(() => renderKnowledgeContent(this.store.post()?.content ?? ''));
  protected readonly cover = computed(() => BLOG_COVERS[this.store.post()?.cover ?? 'teal'] ?? BLOG_COVERS.teal);
  protected readonly sectionMeta = computed(() => BLOG_SECTION_META[this.store.post()?.section ?? this.context.section]);
  protected readonly statusMeta = computed(() => BLOG_STATUS_META[this.store.post()?.status ?? 'draft']);
  protected readonly initials = computed(() => initialsOf(this.store.post()?.authorName ?? ''));
  protected readonly date = computed(() => blogDate(this.store.post()?.publishedAt ?? this.store.post()?.updatedAt));

  /** Top-level headings ("# Heading" in the post) for the contents list. */
  protected readonly headings = computed(() =>
    (this.store.post()?.content ?? '')
      .split('\n')
      .map((line) => /^#\s+(.+)$/.exec(line.trim())?.[1]?.replace(/[*`_]/g, '').trim())
      .filter((heading): heading is string => !!heading),
  );

  /** The author while it is a draft, and reviewers at any time. */
  protected readonly canEdit = computed(() => {
    const post = this.store.post();
    const uid = this.auth.firebaseUser()?.uid;

    if (!post) {
      return false;
    }

    return (
      this.access.canPublish(this.context) ||
      (post.authorId === uid && ['draft', 'in_review', 'changes_requested'].includes(post.status))
    );
  });

  private readonly tabTitle = effect(() => {
    const title = this.store.post()?.title;
    if (title) {
      this.pageTitle.setDocumentTitle(title);
    }
  });

  ngOnInit(): void {
    this.store.setContext(this.context);
    void this.store.openPost(this.route.snapshot.paramMap.get('postId') ?? '');
  }

  protected canDeleteComment(authorId: string): boolean {
    return authorId === this.auth.firebaseUser()?.uid || this.access.canPublish(this.context);
  }

  protected async react(type: (typeof BLOG_REACTIONS)[number]['type']): Promise<void> {
    if (!this.signedIn()) {
      this.toast.info(this.i18n.t('Sign in to react to posts.'));
      return;
    }

    await this.store.react(type);
  }

  protected async addComment(): Promise<void> {
    if (!this.commentText.trim() || this.posting()) {
      return;
    }

    this.posting.set(true);
    const added = await this.store.addComment(this.commentText);
    this.posting.set(false);

    if (added) {
      this.commentText = '';
    } else {
      this.toast.error(this.i18n.t('Your comment could not be posted. Please try again.'));
    }
  }

  protected async deleteComment(commentId: string): Promise<void> {
    try {
      await this.store.deleteComment(commentId);
    } catch {
      this.toast.error(this.i18n.t('The comment could not be deleted.'));
    }
  }

  protected scrollToHeading(index: number): void {
    const heading = this.prose()?.nativeElement.querySelectorAll('h2')[index];
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected async copyLink(): Promise<void> {
    const link = `${window.location.origin}${this.context.basePath}/${this.store.post()?.id ?? ''}`;

    try {
      await navigator.clipboard.writeText(link);
      this.toast.success(this.i18n.t('Link copied.'));
    } catch {
      this.toast.info(link);
    }
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { BlogAccessService, blogContextFromRoute } from '../blog-access.service';
import { BLOG_SECTION_META, BLOG_STATUS_META, BlogPost, BlogPostStatus, blogDate } from '../blog.model';
import { BlogStore } from '../blog.store';
import { BlogHeaderComponent } from '../components/blog-header.component';

type ManageFilter = 'all' | BlogPostStatus;

/** Review & manage: approve, send back, schedule, pin and delete posts. */
@Component({
  selector: 'app-blog-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, FormsModule, RouterLink, MatIconModule, TranslatePipe, BlogHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-blog-header
        title="Blog"
        subtitle="Approve, schedule and manage posts"
        [tabs]="tabs()"
        active="manage"
        [showSearch]="false"
        [writeLink]="context.basePath + '/write'"
        [pendingCount]="store.pendingReviewCount()"
      />

      <div class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <p class="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <mat-icon class="!h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">{{ sectionMeta.icon }}</mat-icon>
          {{ sectionMeta.hint | t }}
        </p>

        <div class="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]" role="group" [attr.aria-label]="'Filter by status' | t">
          @for (option of filters; track option.key) {
            <button
              type="button"
              (click)="filter.set(option.key)"
              class="shrink-0 rounded-full border px-3 py-1 text-sm transition"
              [ngClass]="
                filter() === option.key
                  ? 'border-[#032D42] bg-[#032D42] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#007979]'
              "
              [attr.aria-pressed]="filter() === option.key"
            >
              {{ option.label | t }} · {{ countFor(option.key) }}
            </button>
          }
        </div>

        @if (store.managedLoading()) {
          <div class="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" aria-busy="true"></div>
        } @else if (store.error()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">{{ store.error()! | t }}</div>
        } @else if (!visible().length) {
          <div class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            {{ 'Nothing here right now.' | t }}
          </div>
        } @else {
          <ul class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            @for (post of visible(); track post.id) {
              <li class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="statusMeta[post.status].badgeClass">
                      {{ statusMeta[post.status].label | t }}
                    </span>
                    @if (post.pinned) {
                      <span class="inline-flex items-center text-xs font-bold text-amber-700">
                        <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">push_pin</mat-icon>{{ 'Pinned' | t }}
                      </span>
                    }
                    <span class="text-xs text-slate-500">{{ post.topic | t }}</span>
                  </div>
                  <a [routerLink]="[context.basePath, post.id]" class="mt-1 block truncate font-semibold text-[#032D42] hover:text-[#007979]">
                    {{ post.title }}
                  </a>
                  <p class="text-xs text-slate-500">
                    {{ post.authorName }} · {{ whenLabel(post) }}
                    @if (post.reviewNote && post.status === 'changes_requested') {
                      · {{ 'Note: {0}' | t: [post.reviewNote] }}
                    }
                  </p>

                  @if (noteFor() === post.id) {
                    <div class="mt-2 flex flex-col gap-2 sm:flex-row">
                      <label [for]="'note-' + post.id" class="sr-only">{{ 'What should the author change?' | t }}</label>
                      <input
                        [id]="'note-' + post.id"
                        [(ngModel)]="note"
                        name="note"
                        maxlength="500"
                        [placeholder]="'What should the author change?' | t"
                        class="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#007979]"
                      />
                      <div class="flex gap-2">
                        <button type="button" (click)="review(post, 'request-changes')" class="h-9 rounded-lg bg-[#032D42] px-3 text-xs font-semibold text-white">
                          {{ 'Send back' | t }}
                        </button>
                        <button type="button" (click)="noteFor.set(null)" class="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold">
                          {{ 'Cancel' | t }}
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <div class="flex shrink-0 flex-wrap gap-1.5">
                  @if (post.status === 'in_review') {
                    <button type="button" (click)="review(post, 'approve')" class="h-8 rounded-lg bg-[#007979] px-3 text-xs font-semibold text-white hover:bg-[#006666]">
                      {{ (isFuture(post) ? 'Approve and schedule' : 'Approve and publish') | t }}
                    </button>
                    <button type="button" (click)="startNote(post)" class="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:border-[#007979]">
                      {{ 'Request changes' | t }}
                    </button>
                  }
                  @if (post.status === 'published') {
                    <button type="button" (click)="togglePin(post)" class="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:border-[#007979]">
                      {{ (post.pinned ? 'Unpin' : 'Pin') | t }}
                    </button>
                  }
                  @if (post.status === 'published' || post.status === 'scheduled') {
                    <button type="button" (click)="review(post, 'unpublish')" class="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:border-[#007979]">
                      {{ 'Unpublish' | t }}
                    </button>
                  }
                  <a [routerLink]="[context.basePath, 'write', post.id]" class="inline-flex h-8 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold hover:border-[#007979]">
                    {{ 'Edit' | t }}
                  </a>
                  <button
                    type="button"
                    (click)="remove(post)"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    [attr.aria-label]="'Delete post' | t"
                    [title]="'Delete post' | t"
                  >
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon>
                  </button>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </main>
  `,
})
export class BlogManageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(BlogAccessService);
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(HotToastService);
  protected readonly store = inject(BlogStore);

  protected readonly context = blogContextFromRoute(this.route);
  protected readonly sectionMeta = BLOG_SECTION_META[this.context.section];
  protected readonly statusMeta = BLOG_STATUS_META;
  protected readonly tabs = computed(() => this.access.tabs(this.context));

  protected readonly filters: { key: ManageFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in_review', label: 'In review' },
    { key: 'changes_requested', label: 'Changes requested' },
    { key: 'draft', label: 'Drafts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'published', label: 'Published' },
  ];

  protected readonly filter = signal<ManageFilter>('all');
  protected readonly noteFor = signal<string | null>(null);
  protected note = '';

  protected readonly visible = computed(() => {
    const filter = this.filter();
    return this.store.managedSorted().filter((post) => filter === 'all' || post.status === filter);
  });

  ngOnInit(): void {
    this.store.setContext(this.context);
    void this.store.loadManaged();
  }

  protected countFor(filter: ManageFilter): number {
    const posts = this.store.managed();
    return filter === 'all' ? posts.length : posts.filter((post) => post.status === filter).length;
  }

  protected isFuture(post: BlogPost): boolean {
    return !!post.publishAt && post.publishAt.toMillis() > Date.now();
  }

  protected whenLabel(post: BlogPost): string {
    if (post.status === 'scheduled' && post.publishAt) {
      return this.i18n.t('Publishes {0}', [post.publishAt.toDate().toLocaleString()]);
    }
    if (post.status === 'published') {
      return this.i18n.t('Published {0}', [blogDate(post.publishedAt)]);
    }
    return this.i18n.t('Updated {0}', [blogDate(post.updatedAt)]);
  }

  protected startNote(post: BlogPost): void {
    this.note = '';
    this.noteFor.set(post.id);
  }

  protected async review(post: BlogPost, action: 'approve' | 'request-changes' | 'unpublish'): Promise<void> {
    const done = await this.store.review(post.id, action, this.note);
    this.noteFor.set(null);

    if (!done) {
      this.toast.error(this.i18n.t('That did not work. Please try again.'));
      return;
    }

    const messages = {
      approve: this.isFuture(post) ? 'Post scheduled.' : 'Post published.',
      'request-changes': 'Sent back to the author.',
      unpublish: 'Post moved back to drafts.',
    } as const;
    this.toast.success(this.i18n.t(messages[action]));
  }

  protected async togglePin(post: BlogPost): Promise<void> {
    try {
      await this.store.togglePin(post.id);
    } catch {
      this.toast.error(this.i18n.t('That did not work. Please try again.'));
    }
  }

  protected remove(post: BlogPost): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: this.i18n.t('Delete post'),
          message: this.i18n.t('Delete "{0}"? This cannot be undone.', [post.title]),
          icon: 'delete',
          confirmText: this.i18n.t('Delete'),
          destructive: true,
        },
      })
      .afterClosed()
      .subscribe(async (confirmed: boolean) => {
        if (!confirmed) {
          return;
        }

        const deleted = await this.store.deletePost(post.id);
        if (deleted) {
          this.toast.success(this.i18n.t('Post deleted.'));
        } else {
          this.toast.error(this.i18n.t('The post could not be deleted.'));
        }
      });
  }
}

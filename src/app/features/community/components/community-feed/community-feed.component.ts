
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Router } from '@angular/router';

import { CommunityPost } from '../../models/community-post.model';

import { CommunityStore } from '../../store/community.store';

import { CommunityPostCardComponent } from '../community-post-card/community-post-card.component';


import { ShareService } from '../../../../core/services/share.service';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-community-feed',
  standalone: true,

  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommunityPostCardComponent,
  ],

  template: `
    <section class="space-y-4">

      <!-- ============================================================
           REFRESHING
           ============================================================ -->

      @if (store.refreshing()) {
        <div
          class="flex items-center justify-center gap-2
                 rounded-xl border border-[#D6E6E7]
                 bg-white px-4 py-3"
        >
          <mat-spinner diameter="20" />

          <span class="text-sm text-slate-600">
            Refreshing community…
          </span>
        </div>
      }

      <!-- ============================================================
           INITIAL LOADING
           ============================================================ -->

      @if (store.loading()) {
        <mat-card
          class="!rounded-2xl
                 !border !border-slate-200
                 !bg-white
                 !shadow-none"
        >
          <div
            class="flex min-h-[260px]
                   flex-col items-center
                   justify-center gap-3"
          >
            <mat-spinner diameter="36" />

            <p class="text-sm text-slate-500">
              Loading community posts…
            </p>
          </div>
        </mat-card>
      }

      <!-- ============================================================
           ERROR
           ============================================================ -->

      @else if (store.error()) {
        <mat-card
          class="!rounded-2xl
                 !border !border-red-200
                 !bg-red-50
                 !shadow-none"
        >
          <div
            class="flex items-start gap-3 p-5"
          >
            <mat-icon class="!text-red-600">
              error_outline
            </mat-icon>

            <div class="min-w-0 flex-1">

              <h3
                class="font-semibold text-red-900"
              >
                Unable to load community posts
              </h3>

              <p
                class="mt-1 text-sm
                       leading-6 text-red-700"
              >
                {{ store.error() }}
              </p>

              <button
                mat-stroked-button
                type="button"
                class="mt-4"
                (click)="refresh()"
              >
                <mat-icon>
                  refresh
                </mat-icon>

                Try again
              </button>

            </div>
          </div>
        </mat-card>
      }

      <!-- ============================================================
           EMPTY STATE
           ============================================================ -->

      @else if (store.isEmpty()) {
        <mat-card
          class="!rounded-2xl
                 !border !border-slate-200
                 !bg-white
                 !shadow-sm"
        >
          <div
            class="flex min-h-[280px]
                   flex-col items-center
                   justify-center
                   px-6 py-10
                   text-center"
          >

            <div
              class="mb-4 flex h-16 w-16
                     items-center justify-center
                     rounded-full
                     bg-[#087F80]/10"
            >
              <mat-icon
                class="!h-8 !w-8
                       !text-[32px]
                       !text-[#087F80]"
              >
                forum
              </mat-icon>
            </div>

            <h2
              class="text-lg
                     font-semibold
                     text-slate-900"
            >
              No posts found
            </h2>

            <p
              class="mt-2 max-w-md
                     text-sm leading-6
                     text-slate-500"
            >
              @if (store.hasActiveFilters()) {
                There are no posts matching your
                current filters. Try selecting
                another topic or clearing your
                filters.
              } @else {
                Be the first person to start a
                conversation with the Zebron
                community.
              }
            </p>

            @if (store.hasActiveFilters()) {
              <button
                mat-stroked-button
                type="button"
                class="mt-5"
                (click)="clearFilters()"
              >
                <mat-icon>
                  filter_alt_off
                </mat-icon>

                Clear filters
              </button>
            }

          </div>
        </mat-card>
      }

      <!-- ============================================================
           POSTS
           ============================================================ -->

      @else {
        <div class="space-y-3">

          @for (
            post of store.filteredPosts();
            track post.id
          ) {
            <app-community-post-card
              [post]="post"

              (postSelected)="
                openPost($event)
              "

              (topicSelected)="
                selectTopic($event)
              "

              (react)="
                reactToPost($event)
              "

              (comments)="
                openComments($event)
              "

              (bookmark)="
                bookmarkPost($event)
              "

              (share)="
                sharePost($event)
              "

              (report)="
                reportPost($event)
              "
            />
          }

        </div>

        <!-- ==========================================================
             LOAD MORE
             ========================================================== -->

        @if (store.hasMore()) {
          <div
            class="flex justify-center py-5"
          >

            @if (store.loadingMore()) {
              <button
                mat-stroked-button
                type="button"
                disabled
              >
                <mat-spinner
                  diameter="20"
                  class="mr-2"
                />

                Loading…
              </button>
            }

            @else {
              <button
                mat-stroked-button
                type="button"
                (click)="loadMore()"
              >
                <mat-icon>
                  expand_more
                </mat-icon>

                Load more posts
              </button>
            }

          </div>
        }
      }

    </section>
  `,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityFeedComponent {
  readonly store =
    inject(CommunityStore);

  private readonly shareService =
    inject(ShareService);

  private readonly logger =
    inject(LoggerService);

  private readonly router =
    inject(Router);

  // ============================================================
  // POST NAVIGATION
  // ============================================================

  openPost(post: CommunityPost): void {
    const postId =
      post.id?.trim();

    if (!postId) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Unable to open community post because the post ID is missing.',
      );

      return;
    }

    void this.router.navigate([
      '/community/post',
      postId,
    ]);
  }

  selectTopic(topicId: string): void {
    void this.store.selectTopic(
      topicId,
    );
  }

  openComments(
    post: CommunityPost,
  ): void {
    const postId =
      post.id?.trim();

    if (!postId) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Unable to open comments because the post ID is missing.',
      );

      return;
    }

    void this.router.navigate(
      [
        '/community/post',
        postId,
      ],
      {
        fragment:
          'community-comments',
      },
    );
  }

  // ============================================================
  // REACTIONS
  // ============================================================

  async reactToPost(
    post: CommunityPost,
  ): Promise<void> {
    const currentUser =
      this.store.currentUser();

    if (!currentUser) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Cannot react to community post because no authenticated user is available.',
        {
          postId: post.id,
        },
      );

      return;
    }

    await this.store.reactToPost(
      post.id,
      currentUser.id,
      'like',
    );
  }

  // ============================================================
  // BOOKMARK
  // ============================================================

  async bookmarkPost(
    post: CommunityPost,
  ): Promise<void> {
    const postId =
      post.id?.trim();

    if (!postId) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Unable to bookmark community post because the post ID is missing.',
      );

      return;
    }

    await this.store.toggleBookmark(
      postId,
    );
  }

  // ============================================================
  // SHARE
  // ============================================================

  async sharePost(
    post: CommunityPost,
  ): Promise<void> {
    const postId =
      post.id?.trim();

    if (!postId) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Unable to share community post because the post ID is missing.',
      );

      return;
    }

    const url =
      this.shareService.getCommunityPostUrl(
        postId,
      );

    if (!url) {
      this.logger.warn(
        'CommunityFeedComponent',
        'Unable to generate a share URL for the community post.',
        {
          postId,
        },
      );

      return;
    }

    await this.shareService.share({
      title: post.title,

      text:
        post.content.length > 180
          ? `${post.content
              .substring(0, 180)
              .trim()}…`
          : post.content,

      url,
    });
  }

  // ============================================================
  // REPORT
  // ============================================================

  reportPost(
    post: CommunityPost,
  ): void {
    /*
     * Reporting will eventually use the shared
     * confirmation/dialog pattern together with
     * CommunityReportService.
     *
     * For now, record the requested action
     * through centralized logging.
     */

    this.logger.info(
      'CommunityFeedComponent',
      'Report post action requested.',
      {
        postId: post.id,
      },
    );
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  loadMore(): void {
    void this.store.loadMore();
  }

  refresh(): void {
    void this.store.refresh();
  }

  // ============================================================
  // FILTERS
  // ============================================================

  clearFilters(): void {
    void this.store.clearFilters();
  }
}


import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CommunityStore } from '../../store/community.store';

import { CommunityComment } from '../../../../core/models/community/community-comment.model';


@Component({
  selector: 'app-community-post-detail',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="page">

      <div class="container">

        <!-- ====================================================
             BACK
             ==================================================== -->

        <a
          mat-button
          routerLink="/community"
          class="back-button"
        >
          <mat-icon>
            arrow_back
          </mat-icon>

          Back to Community
        </a>


        <!-- ====================================================
             LOADING
             ==================================================== -->

        @if (store.loadingPost()) {

          <div class="loading">

            <mat-spinner diameter="42"></mat-spinner>

            <p>
              Loading post...
            </p>

          </div>

        } @else if (store.selectedPost()) {

          <!-- ==================================================
               POST
               ================================================== -->

          <article>

            <mat-card
              class="post-card"
              appearance="outlined"
            >

              <mat-card-content>

                <!-- --------------------------------------------
                     META
                     -------------------------------------------- -->

                <div class="meta">

                  <mat-chip>
                    {{ postTypeLabel() }}
                  </mat-chip>

                  @if (store.selectedPost()!.pinned) {
                    <mat-chip>
                      <mat-icon>push_pin</mat-icon>
                      Pinned
                    </mat-chip>
                  }

                  @if (store.selectedPost()!.important) {
                    <mat-chip>
                      Important
                    </mat-chip>
                  }

                </div>


                <!-- --------------------------------------------
                     TITLE
                     -------------------------------------------- -->

                <h1>
                  {{ store.selectedPost()!.title }}
                </h1>


                <!-- --------------------------------------------
                     AUTHOR
                     -------------------------------------------- -->

                <div class="author">

                  <div class="avatar">

                    @if (
                      store.selectedPost()!.authorPhotoUrl
                    ) {

                      <img
                        [src]="store.selectedPost()!.authorPhotoUrl"
                        [alt]="store.selectedPost()!.authorName"
                      />

                    } @else {

                      {{ getInitials(
                        store.selectedPost()!.authorName
                      ) }}

                    }

                  </div>

                  <div>

                    <strong>
                      {{ store.selectedPost()!.authorName }}
                    </strong>

                    <span>
                      {{ formatDate(
                        store.selectedPost()!.publishedAt
                        ??
                        store.selectedPost()!.createdAt
                      ) }}
                    </span>

                  </div>

                </div>


                <mat-divider></mat-divider>


                <!-- --------------------------------------------
                     BODY
                     -------------------------------------------- -->

                <div class="post-body">
                  {{ store.selectedPost()!.content }}
                </div>


                <!-- --------------------------------------------
                     TAGS
                     -------------------------------------------- -->

                @if (
                  store.selectedPost()!.tags.length
                ) {

                  <div class="tags">

                    @for (
                      tag of store.selectedPost()!.tags;
                      track tag
                    ) {

                      <span>
                        #{{ tag }}
                      </span>

                    }

                  </div>

                }


                <!-- --------------------------------------------
                     STATS
                     -------------------------------------------- -->

                <div class="stats">

                  <span>
                    <mat-icon>visibility</mat-icon>
                    {{ store.selectedPost()!.viewCount || 0 }}
                    views
                  </span>

                  <span>
                    <mat-icon>chat_bubble_outline</mat-icon>
                    {{ store.selectedPost()!.commentCount || 0 }}
                    comments
                  </span>

                  <span>
                    <mat-icon>favorite_border</mat-icon>
                    {{ store.selectedPost()!.likeCount || 0 }}
                    likes
                  </span>

                </div>

              </mat-card-content>

            </mat-card>


            <!-- =================================================
                 COMMENTS
                 ================================================= -->

            <mat-card
              class="comments-card"
              appearance="outlined"
            >

              <mat-card-content>

                <div class="comments-header">

                  <div>

                    <div class="eyebrow">
                      COMMUNITY
                    </div>

                    <h2>
                      Comments
                    </h2>

                  </div>

                  <span>
                    {{ store.comments().length }}
                  </span>

                </div>


                @if (store.loadingComments()) {

                  <div class="comments-loading">

                    <mat-spinner diameter="32"></mat-spinner>

                  </div>

                } @else if (
                  store.comments().length > 0
                ) {

                  <div class="comments">

                    @for (
                      comment of store.comments();
                      track comment.id
                    ) {

                      <div class="comment">

                        <div class="comment-avatar">
                          {{ getInitials(
                            comment.authorName
                          ) }}
                        </div>

                        <div class="comment-content">

                          <div class="comment-meta">

                            <strong>
                              {{ comment.authorName }}
                            </strong>

                            <span>
                              {{ formatDate(
                                comment.createdAt
                              ) }}
                            </span>

                          </div>

                          <p>
                            {{ comment.content }}
                          </p>

                        </div>

                      </div>

                    }

                  </div>

                } @else {

                  <div class="empty-comments">

                    <mat-icon>
                      chat_bubble_outline
                    </mat-icon>

                    <h3>
                      No comments yet
                    </h3>

                    <p>
                      Be the first to join the conversation.
                    </p>

                  </div>

                }

              </mat-card-content>

            </mat-card>

          </article>

        } @else {

          <!-- ==================================================
               NOT FOUND
               ================================================== -->

          <mat-card
            class="not-found"
            appearance="outlined"
          >

            <mat-icon>
              search_off
            </mat-icon>

            <h2>
              Post not found
            </h2>

            <p>
              This community post may have been removed,
              archived, or no longer exists.
            </p>

            <a
              mat-flat-button
              color="primary"
              routerLink="/community"
            >
              Return to Community
            </a>

          </mat-card>

        }

      </div>

    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      .page {
        min-height: 100%;
        background: #f8fafc;
      }

      .container {
        width: min(900px, 100%);
        margin: 0 auto;

        padding: 24px 20px 60px;
      }

      .back-button {
        margin-bottom: 18px;
      }


      /* ========================================================
         LOADING
         ======================================================== */

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 100px 20px;

        color: #64748b;
      }


      /* ========================================================
         POST
         ======================================================== */

      .post-card {
        border-radius: 16px;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;

        margin-bottom: 18px;
      }

      .meta mat-chip mat-icon {
        width: 16px;
        height: 16px;

        margin-right: 3px;

        font-size: 16px;
      }

      h1 {
        margin: 0 0 22px;

        color: #172033;

        font-size: clamp(28px, 5vw, 42px);
        line-height: 1.15;
        font-weight: 800;
      }


      /* ========================================================
         AUTHOR
         ======================================================== */

      .author {
        display: flex;
        align-items: center;
        gap: 12px;

        margin-bottom: 22px;
      }

      .avatar {
        width: 44px;
        height: 44px;

        display: flex;
        align-items: center;
        justify-content: center;

        overflow: hidden;

        border-radius: 50%;

        background: #e2e8f0;

        color: #334155;

        font-size: 13px;
        font-weight: 700;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .author div:last-child {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .author span {
        color: #64748b;
        font-size: 13px;
      }


      /* ========================================================
         BODY
         ======================================================== */

      .post-body {
        margin-top: 26px;

        color: #334155;

        font-size: 16px;
        line-height: 1.8;

        white-space: pre-wrap;
      }


      /* ========================================================
         TAGS
         ======================================================== */

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;

        margin-top: 26px;
      }

      .tags span {
        padding: 5px 10px;

        border-radius: 999px;

        background: #f1f5f9;

        color: #475569;

        font-size: 12px;
      }


      /* ========================================================
         STATS
         ======================================================== */

      .stats {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;

        margin-top: 28px;
        padding-top: 18px;

        border-top: 1px solid #e2e8f0;

        color: #64748b;

        font-size: 13px;
      }

      .stats span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .stats mat-icon {
        width: 17px;
        height: 17px;

        font-size: 17px;
      }


      /* ========================================================
         COMMENTS
         ======================================================== */

      .comments-card {
        margin-top: 18px;

        border-radius: 16px;
      }

      .comments-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        margin-bottom: 20px;
      }

      .eyebrow {
        color: #64748b;

        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .comments-header h2 {
        margin: 4px 0 0;

        font-size: 23px;
      }

      .comments-header > span {
        min-width: 30px;
        padding: 5px 9px;

        border-radius: 999px;

        background: #f1f5f9;

        text-align: center;

        font-size: 12px;
        font-weight: 700;
      }

      .comments {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .comment {
        display: flex;
        gap: 12px;
      }

      .comment-avatar {
        width: 36px;
        height: 36px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: #e2e8f0;

        color: #334155;

        font-size: 11px;
        font-weight: 700;
      }

      .comment-content {
        min-width: 0;
      }

      .comment-meta {
        display: flex;
        align-items: center;
        gap: 8px;

        margin-bottom: 4px;
      }

      .comment-meta span {
        color: #94a3b8;
        font-size: 12px;
      }

      .comment-content p {
        margin: 0;

        color: #475569;

        font-size: 14px;
        line-height: 1.6;
      }

      .comments-loading {
        display: flex;
        justify-content: center;

        padding: 40px;
      }

      .empty-comments {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 35px 15px;

        text-align: center;
      }

      .empty-comments mat-icon {
        color: #94a3b8;
      }

      .empty-comments h3 {
        margin: 10px 0 5px;
      }

      .empty-comments p {
        margin: 0;

        color: #64748b;
      }


      /* ========================================================
         NOT FOUND
         ======================================================== */

      .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;

        padding: 70px 25px;

        text-align: center;

        border-radius: 16px;
      }

      .not-found > mat-icon {
        width: 46px;
        height: 46px;

        color: #94a3b8;

        font-size: 46px;
      }

      .not-found h2 {
        margin: 15px 0 8px;
      }

      .not-found p {
        max-width: 500px;

        margin: 0 0 22px;

        color: #64748b;
      }


      /* ========================================================
         MOBILE
         ======================================================== */

      @media (max-width: 600px) {

        .container {
          padding:
            18px
            14px
            45px;
        }

        .post-card mat-card-content,
        .comments-card mat-card-content {
          padding: 16px;
        }

        .stats {
          gap: 10px;
        }

      }
    `,
  ],
})
export class CommunityPostDetailComponent
  implements OnInit {

  protected readonly store =
    inject(CommunityStore);

  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);


  protected readonly postTypeLabel =
    computed(() => {

      const post =
        this.store.selectedPost();

      if (!post) {
        return 'Community';
      }

      switch (post.postType) {

        case 'discussion':
          return 'Discussion';

        case 'question':
          return 'Question';

        case 'announcement':
          return 'Announcement';

        case 'news':
          return 'News';

        case 'event':
          return 'Event';

        case 'opportunity':
          return 'Opportunity';

        case 'notice':
          return 'Notice';

        default:
          return 'Community';
      }
    });


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(params => {

        const postId =
          params.get('id');

        if (!postId) {
          return;
        }

        void this.store.loadPost(postId);
        void this.store.loadComments(postId);

      });

  }


  // ============================================================
  // INITIALS
  // ============================================================

  protected getInitials(
    name: string | undefined,
  ): string {

    if (!name?.trim()) {
      return 'Z';
    }

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  // ============================================================
  // DATE
  // ============================================================

  protected formatDate(
    timestamp:
      CommunityComment['createdAt'],
  ): string {

    if (!timestamp) {
      return '';
    }

    try {

      return timestamp
        .toDate()
        .toLocaleDateString(
          'en-US',
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        );

    } catch {

      return '';
    }
  }
}
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityCommentComponent } from '../../components/community-comment/community-comment.component';

import { CommunityComment } from '../../models/community-comment.model';
import { CommunityPost } from '../../models/community-post.model';
import { CommunityReactionType } from '../../models/community-reaction.model';

import { CommunityCommentStore } from '../../store/community-comment.store';
import { CommunityPostStore } from '../../store/community-post.store';

import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { ShareService } from '../../../../core/services/share.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { CommunityStore } from '../../store/community.store';

@Component({
  selector: 'app-community-post-detail',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormsModule,
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,

    CommunityCommentComponent,
  ],

  template: `
    <!-- ============================================================
         PAGE
         ============================================================ -->

    <main
      class="
        min-h-screen
        bg-slate-50
        px-4
        py-4
        pt-17
        sm:px-6
        lg:px-8
      "
    >
      <div
        class="
          mx-auto
          w-full
          max-w-4xl
        "
      >
        <!-- ========================================================
             LOADING STATE
             ======================================================== -->

        @if (store.loading()) {
          <div
            class="
              flex
              min-h-[320px]
              items-center
              justify-center
            "
          >
            <mat-spinner diameter="42" />
          </div>
        }

        <!-- ========================================================
             ERROR STATE
             ======================================================== -->

        @else if (store.error()) {
          <mat-card
            appearance="outlined"
            class="
              overflow-hidden
              rounded-2xl
            "
          >
            <div
              class="
                flex
                flex-col
                items-center
                justify-center
                px-6
                py-14
                text-center
              "
            >
              <div
                class="
                  mb-4
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-red-50
                  text-red-600
                "
              >
                <mat-icon>error_outline</mat-icon>
              </div>

              <h1
                class="
                  text-xl
                  font-semibold
                  text-slate-900
                "
              >
                Unable to load post
              </h1>

              <p
                class="
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                {{ store.error() }}
              </p>

              <div class="mt-6">
                <button mat-flat-button type="button" (click)="reloadPost()">
                  <mat-icon>refresh</mat-icon>
                  Try Again
                </button>
              </div>
            </div>
          </mat-card>
        }

        <!-- ========================================================
             POST
             ======================================================== -->

        @else if (store.post(); as post) {
          <mat-card
            appearance="outlined"
            class="
              overflow-hidden
              rounded-2xl
            "
          >
            <!-- ====================================================
                 POST HEADER
                 ==================================================== -->

            <div
              class="
    bg-[#2a835f]/80
    px-4
    py-2
    sm:px-6
    sm:py-2
  "
            >
              <!-- Back / Actions -->

              <div
                class="
      mb-2
      flex
      items-center
      justify-between
      gap-3
      text-white
    "
              >
                <!-- Back -->

                <a
                  mat-button
                  routerLink="/community"
                  class="
        !min-w-0
        !px-2
        !text-white
        hover:!bg-white/10
      "
                >
                  <mat-icon class="!text-white"> arrow_back </mat-icon>

                  <span class="text-sm font-medium"> Back to Community </span>
                </a>

                <!-- Post Menu -->

                <button
                  mat-icon-button
                  type="button"
                  aria-label="Post options"
                  matTooltip="Post options"
                  [matMenuTriggerFor]="postMenu"
                  class="!text-white"
                >
                  <mat-icon class="!text-white"> more_vert </mat-icon>
                </button>

                <mat-menu #postMenu="matMenu">
                  <!-- Save -->

                  <button mat-menu-item type="button" (click)="savePost(post.id)">
                    <mat-icon>
                      {{ post.bookmarkedByCurrentUser ? 'bookmark' : 'bookmark_border' }}
                    </mat-icon>

                    <span>
                      {{ post.bookmarkedByCurrentUser ? 'Remove saved post' : 'Save post' }}
                    </span>
                  </button>

                  <!-- Share -->

                  <button mat-menu-item type="button" (click)="sharePost(post)">
                    <mat-icon>share</mat-icon>

                    <span> Share post </span>
                  </button>

                  <!-- Report -->

                  <button mat-menu-item type="button" (click)="reportPost(post.id)">
                    <mat-icon>flag</mat-icon>

                    <span> Report post </span>
                  </button>
                </mat-menu>
              </div>

              <!-- Author -->

              <div
                class="
      flex
      items-center
      gap-2.5
    "
              >
                <!-- Avatar -->

                @if (post.author.photoUrl) {
                  <img
                    [src]="post.author.photoUrl"
                    [alt]="post.author.displayName"
                    class="
          h-9
          w-9
          shrink-0
          rounded-full
          object-cover
          ring-2
          ring-white/40
        "
                  />
                } @else {
                  <div
                    class="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white/20
          text-sm
          font-semibold
          text-white
          ring-2
          ring-white/30
        "
                  >
                    {{ getInitials(post.author.displayName) }}
                  </div>
                }

                <!-- Author Information -->

                <div class="min-w-0">
                  <div
                    class="
          truncate
          text-sm
          font-semibold
          text-white
        "
                  >
                    {{ post.author.displayName }}
                  </div>

                  <div
                    class="
          mt-0.5
          text-xs
          text-white/75
        "
                  >
                    {{ formatDate(post.createdAt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- ====================================================
                 POST CONTENT
                 ==================================================== -->

            <div
              class="
                px-5
                pb-5
                pt-5
                sm:px-7
                sm:pb-3
              "
            >
              <!-- Topic -->

              @if (post.topicName) {
                <button
                  type="button"
                  class="
                    mb-4
                    inline-flex
                    items-center
                    rounded-full
                    bg-blue-50
                    px-3
                    py-1
                    text-xs
                    font-medium
                    text-blue-700
                    transition
                    hover:bg-blue-100
                  "
                  (click)="selectTopic(post.topicId)"
                >
                  <mat-icon class="mr-1 !h-4 !w-4 !text-base"> forum </mat-icon>

                  {{ post.topicName }}
                </button>
              }

              <!-- Title -->

              <h1
                class="
                  text-2xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-slate-900
                  sm:text-2xl
                "
              >
                {{ post.title }}
              </h1>

              <!-- Body -->

              <div
                class="
                  mt-4
                  whitespace-pre-wrap
                  text-base
                  leading-7
                  text-slate-700
                "
              >
                {{ post.content }}
              </div>

              <!-- ==================================================
                   TAGS
                   ================================================== -->

              @if (post.tags && post.tags.length > 0) {
                <div
                  class="
                    mt-3
                    flex
                    flex-wrap
                    gap-2
                  "
                >
                  @for (tag of post.tags; track tag) {
                    <span
                      class="
                        rounded-full
                        bg-slate-100
                        px-3
                        pt-1
                        text-xs
                        font-medium
                        text-slate-600
                      "
                    >
                      #{{ tag }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- ====================================================
                 ENGAGEMENT BAR
                 ==================================================== -->

            <div
              class="
                flex
                flex-wrap
                items-center
                gap-2
                border-t
                border-slate-200
                px-5
                py-1
                sm:px-7
              "
            >
              <!-- Reactions -->

              <button mat-button type="button" (click)="reactToPost(post.id)">
                <mat-icon>
                  {{ post.currentUserReaction ? 'thumb_up' : 'thumb_up_off_alt' }}
                </mat-icon>

                <span>
                  {{ totalReactionCount(post) }}
                </span>
              </button>

              <!-- Comments -->

              <button mat-button type="button" (click)="scrollToComments()">
                <mat-icon> comment </mat-icon>

                <span>
                  {{ post.commentCount || 0 }}
                </span>
              </button>

              <!-- Views -->

              <div
                class="
                  ml-auto
                  flex
                  items-center
                  gap-1
                  px-2
                  text-sm
                  text-slate-500
                "
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]"> visibility </mat-icon>

                <span>
                  {{ post.viewCount || 0 }}
                </span>
              </div>
            </div>
          </mat-card>

          <!-- ======================================================
               COMMENTS
               ====================================================== -->

          <section id="community-comments" class="mt-6">
            <mat-card
              appearance="outlined"
              class="
                overflow-hidden
                rounded-2xl
              "
            >
              <!-- Comments Header -->

              <div
                class="
                  flex
                  items-center
                  justify-between
                  gap-4
                  border-b
                  border-slate-200
                  px-5
                  py-1
                  sm:px-7
                "
              >
                <div>
                  <h2
                    class="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Comments
                  </h2>

                  <p
                    class="
                      mt-0.5
                      text-sm
                      text-slate-500
                    "
                  >
                    Join the conversation.
                  </p>
                </div>

                @if (commentStore.commentCount() > 0) {
                  <span
                    class="
                      rounded-full
                      bg-slate-100
                      px-3
                      py-1
                      text-xs
                      font-medium
                      text-slate-600
                    "
                  >
                    {{ commentStore.commentCount() }}
                  </span>
                }
              </div>

              <!-- ==================================================
                   COMMENT COMPOSER
                   ================================================== -->

              <div
                class="
                  border-b
                  border-slate-200
                  bg-slate-50
                  px-5
                  py-5
                  sm:px-7
                "
              >
                <mat-form-field appearance="outline" class="w-full" floatLabel="always">
                  <mat-label> Add a comment </mat-label>

                  <textarea
                    matInput
                    rows="4"
                    maxlength="2000"
                    [(ngModel)]="commentText"
                    placeholder="Share your thoughts..."
                  ></textarea>

                  <mat-hint align="end"> {{ commentText.length }}/2000 </mat-hint>
                </mat-form-field>

                <!-- Comment Error -->

                @if (commentStore.error()) {
                  <div
                    class="
                      mt-2
                      flex
                      items-start
                      gap-2
                      rounded-lg
                      bg-red-50
                      px-3
                      py-2
                      text-sm
                      text-red-700
                    "
                  >
                    <mat-icon class="!h-5 !w-5 !text-[20px]"> error_outline </mat-icon>

                    <span>
                      {{ commentStore.error() }}
                    </span>
                  </div>
                }

                <!-- Submit -->

                <div class="mt-3 flex justify-end">
                  @if (commentStore.saving()) {
                    <button mat-flat-button type="button" disabled>
                      <mat-spinner diameter="18" class="mr-2" />

                      Posting...
                    </button>
                  } @else {
                    <button
                      mat-flat-button
                      type="button"
                      [disabled]="!canSubmitComment()"
                      (click)="addComment()"
                    >
                      <mat-icon> send </mat-icon>

                      Post Comment
                    </button>
                  }
                </div>
              </div>

              <!-- ==================================================
                   COMMENT LOADING
                   ================================================== -->

              @if (commentStore.loading()) {
                <div
                  class="
                    flex
                    items-center
                    justify-center
                    px-6
                    py-12
                  "
                >
                  <mat-spinner diameter="36" />
                </div>
              }

              <!-- ==================================================
                   COMMENT ERROR
                   ================================================== -->

              @else if (commentStore.error() && commentStore.isEmpty()) {
                <div
                  class="
                    px-6
                    py-10
                    text-center
                  "
                >
                  <mat-icon
                    class="
                      !h-10
                      !w-10
                      !text-[40px]
                      text-red-500
                    "
                  >
                    error_outline
                  </mat-icon>

                  <p
                    class="
                      mt-3
                      text-sm
                      text-slate-600
                    "
                  >
                    Unable to load comments.
                  </p>

                  <button mat-stroked-button type="button" class="mt-4" (click)="reloadComments()">
                    <mat-icon> refresh </mat-icon>

                    Try Again
                  </button>
                </div>
              }

              <!-- ==================================================
                   EMPTY COMMENTS
                   ================================================== -->

              @else if (commentStore.isEmpty()) {
                <div
                  class="
                    px-6
                    py-12
                    text-center
                  "
                >
                  <div
                    class="
                      mx-auto
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                      text-slate-500
                    "
                  >
                    <mat-icon> forum </mat-icon>
                  </div>

                  <h3
                    class="
                      mt-4
                      text-base
                      font-semibold
                      text-slate-900
                    "
                  >
                    No comments yet
                  </h3>

                  <p
                    class="
                      mx-auto
                      mt-1
                      max-w-sm
                      text-sm
                      leading-6
                      text-slate-500
                    "
                  >
                    Be the first person to join the conversation.
                  </p>
                </div>
              }

              <!-- ==================================================
                   COMMENTS LIST
                   ================================================== -->

              @else {
                <div
                  class="
                    divide-y
                    divide-slate-100
                  "
                >
                  @for (comment of commentStore.topLevelComments(); track comment.id) {
                    <div
                      class="
                        px-5
                        py-5
                        sm:px-7
                      "
                    >
                      <app-community-comment
                        [comment]="comment"
                        [depth]="0"
                        (react)="onCommentReaction($event)"
                        (commentDeleted)="onCommentDeleted($event)"
                        (replyCreated)="onReplyCreated($event)"
                      />
                    </div>
                  }
                </div>
              }
            </mat-card>
          </section>
        }
      </div>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      /*
       * Keep Material progress spinners aligned with text
       * when they appear inside action buttons.
       */
      mat-spinner {
        display: inline-block;
        vertical-align: middle;
      }
    `,
  ],
})
export class CommunityPostDetailComponent implements OnInit, OnDestroy {
  // ==============================================================
  // DEPENDENCIES
  // ==============================================================

  readonly store = inject(CommunityPostStore);

  readonly commentStore = inject(CommunityCommentStore);

  readonly communityStore = inject(CommunityStore);

  private readonly route = inject(ActivatedRoute);

  private readonly authService = inject(AuthService);

  private readonly logger = inject(LoggerService);

  private readonly shareService = inject(ShareService);

  readonly pageTitleService = inject(PageTitleService);

  // ==============================================================
  // STATE
  // ==============================================================

  postId = '';

  commentText = '';

  // ==============================================================
  // LIFECYCLE
  // ==============================================================

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('postId')?.trim() ?? '';

    if (!this.postId) {
      return;
    }

    /*
     * Load the post first so that the post-detail view is rendered
     * before attempting to scroll to the comments section.
     */
    void this.loadPostAndHandleFragment();

    /*
     * Comments can load independently from the post.
     */
    void this.commentStore.loadComments(this.postId);
  }

  ngOnDestroy(): void {
    /*
     * Clear both stores when leaving the page
     * so stale post/comment state isn't displayed
     * when another post is opened.
     */

    this.commentStore.clear();

    this.store.clear();
  }

  constructor() {
    this.pageTitleService.setTitle('Community | Post');
  }

  // ==============================================================
  // POST
  // ==============================================================

  private async loadPostAndHandleFragment(): Promise<void> {
    if (!this.postId) {
      return;
    }

    try {
      await this.store.loadPost(this.postId);

      /*
       * When the user clicked "Comments" from the feed,
       * the route contains:
       *
       * /community/post/{postId}#community-comments
       *
       * The post is loaded asynchronously, so we wait until
       * Angular has rendered the post and comments section.
       */

      if (this.route.snapshot.fragment === 'community-comments') {
        setTimeout(() => {
          this.scrollToComments();
        });
      }
    } catch (error) {
      this.logger.error('CommunityPostDetailComponent', 'Failed to load community post.', {
        postId: this.postId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  reloadPost(): void {
    if (!this.postId) {
      return;
    }

    void this.loadPostAndHandleFragment();
  }

  selectTopic(topicId: string): void {
    if (!topicId) {
      return;
    }

    /*
     * Topic navigation will be handled by the
     * Community Home/store routing flow.
     *
     * For now we return to Community.
     */

    window.location.href = `/community?topic=${encodeURIComponent(topicId)}`;
  }

  // ==============================================================
  // POST REACTIONS
  // ==============================================================

  async reactToPost(postId: string, type: CommunityReactionType = 'like'): Promise<void> {
    const id = postId.trim();

    if (!id) {
      return;
    }

    const currentUser = this.authService.user();

    if (!currentUser) {
      this.logger.warn(
        'CommunityPostDetailComponent',
        'Cannot react to post because no authenticated user is available.',
        {
          postId: id,
        },
      );

      return;
    }

    try {
      await this.store.reactToPost(id, currentUser.id, type);
    } catch (error) {
      this.logger.error('CommunityPostDetailComponent', 'Failed to react to community post.', {
        postId: id,
        userId: currentUser.id,
        reactionType: type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ==============================================================
  // SHARE
  // ==============================================================

  async sharePost(post: CommunityPost): Promise<void> {
    const postId = post.id?.trim();

    if (!postId) {
      this.logger.warn(
        'CommunityPostDetailComponent',
        'Unable to share community post because the post ID is missing.',
      );

      return;
    }

    const url = this.shareService.getCommunityPostUrl(postId);

    if (!url) {
      this.logger.warn(
        'CommunityPostDetailComponent',
        'Unable to generate a share URL for the community post.',
        {
          postId,
        },
      );

      return;
    }

    await this.shareService.share({
      title: post.title,

      text: post.content.length > 180 ? `${post.content.substring(0, 180).trim()}…` : post.content,

      url,
    });
  }

  // ==============================================================
  // SAVE
  // ==============================================================

  savePost(postId: string): void {
    /*
     * Bookmark persistence will be implemented
     * through CommunityBookmarkService/Store.
     *
     * Until that feature is implemented, record the
     * requested action through the centralized logger.
     */

    this.logger.info('CommunityPostDetailComponent', 'Save post action requested.', {
      postId,
    });
  }

  // ==============================================================
  // REPORT
  // ==============================================================

  reportPost(postId: string): void {
    /*
     * Reporting will eventually open a shared
     * Material confirmation/dialog workflow.
     *
     * Until that feature is implemented, record the
     * requested action through the centralized logger.
     */

    this.logger.info('CommunityPostDetailComponent', 'Report post action requested.', {
      postId,
    });
  }

  // ==============================================================
  // COMMENTS
  // ==============================================================

  canSubmitComment(): boolean {
    const text = this.commentText.trim();

    return text.length > 0 && text.length <= 2000 && !this.commentStore.saving();
  }

async addComment(): Promise<void> {
  const text = this.commentText.trim();

  if (!text || text.length > 2000 || !this.postId) {
    return;
  }

  try {

    const commentId =
      await this.commentStore.addComment(
        this.postId,
        text,
      );

    if (!commentId) {
      return;
    }

    this.commentText = '';

    // Refresh the detail-page post.
    await this.store.loadPost(
      this.postId,
    );

    // Keep the already-loaded Community feed
    // synchronized without another Firestore query.
    this.communityStore.updatePostCommentCount(
      this.postId,
      1,
    );

    this.logger.info(
      'CommunityPostDetailComponent',
      'Community comment created.',
      {
        postId: this.postId,
        commentId,
      },
    );

  } catch (error) {

    this.logger.error(
      'CommunityPostDetailComponent',
      'Failed to add community comment.',
      {
        postId: this.postId,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

  reloadComments(): void {
    if (!this.postId) {
      return;
    }

    void this.commentStore.loadComments(this.postId);
  }

  // ==============================================================
  // COMMENT EVENTS
  // ==============================================================

async onCommentDeleted(
  commentId: string,
): Promise<void> {

  const id = commentId.trim();

  if (!id || !this.postId) {
    return;
  }

  try {

    await this.store.loadPost(
      this.postId,
    );

    // The service decremented Firestore commentCount.
    // Mirror that change in the existing feed state.
    this.communityStore.updatePostCommentCount(
      this.postId,
      -1,
    );

    this.logger.info(
      'CommunityPostDetailComponent',
      'Community comment deleted.',
      {
        postId: this.postId,
        commentId: id,
      },
    );

  } catch (error) {

    this.logger.error(
      'CommunityPostDetailComponent',
      'Failed to refresh post after comment deletion.',
      {
        postId: this.postId,
        commentId: id,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}
async onReplyCreated(
  commentId: string,
): Promise<void> {

  const id = commentId.trim();

  if (!id || !this.postId) {
    return;
  }

  try {

    // Refresh the detail post.
    await this.store.loadPost(
      this.postId,
    );

    // Replies also increment the post's
    // denormalized commentCount.
    this.communityStore.updatePostCommentCount(
      this.postId,
      1,
    );

    this.logger.info(
      'CommunityPostDetailComponent',
      'Community comment reply created.',
      {
        postId: this.postId,
        commentId: id,
      },
    );

  } catch (error) {

    this.logger.error(
      'CommunityPostDetailComponent',
      'Failed to refresh post after reply creation.',
      {
        postId: this.postId,
        commentId: id,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );
  }
}

  onCommentReaction(comment: CommunityComment): void {
    /*
     * Comment reactions will be persisted through
     * CommunityReactionService once comment reaction
     * persistence is implemented.
     */

    this.logger.info('CommunityPostDetailComponent', 'Community comment reaction requested.', {
      commentId: comment.id,
      postId: this.postId,
    });
  }

  // ==============================================================
  // ENGAGEMENT
  // ==============================================================

  totalReactionCount(post: { reactionCounts?: Record<string, number> }): number {
    const counts = post.reactionCounts ?? {};

    return Object.values(counts).reduce((total, count) => total + Number(count || 0), 0);
  }

  scrollToComments(): void {
    document.getElementById('community-comments')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // ==============================================================
  // DISPLAY HELPERS
  // ==============================================================

  getInitials(name: string): string {
    const value = name?.trim();

    if (!value) {
      return 'Z';
    }

    const parts = value.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatDate(timestamp: any): string {
    if (!timestamp) {
      return '';
    }

    try {
      const date =
        typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return '';
      }

      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  }
}

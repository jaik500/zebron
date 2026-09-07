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

import { CommunityCommentStore } from '../../store/community-comment.store';

import { CommunityPostStore } from '../../store/community-post.store';

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
        py-6
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
             BACK BUTTON
             ======================================================== -->

        <div class="mb-5">
          <a mat-button routerLink="/community">
            <mat-icon> arrow_back </mat-icon>

            Back to Community
          </a>
        </div>

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
                <mat-icon> error_outline </mat-icon>
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
                  <mat-icon> refresh </mat-icon>

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
                flex
                items-start
                justify-between
                gap-4
                px-5
                pt-5
                sm:px-7
                sm:pt-7
              "
            >
              <div
                class="
                  flex
                  min-w-0
                  items-center
                  gap-3
                "
              >
                <!-- Avatar -->

                @if (post.author.photoUrl) {
                  <img
                    [src]="post.author.photoUrl"
                    [alt]="post.author.displayName"
                    class="
                      h-11
                      w-11
                      shrink-0
                      rounded-full
                      object-cover
                    "
                  />

                } @else {
                  <div
                    class="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-200
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    {{ getInitials(post.author.displayName) }}
                  </div>
                }

                <!-- Author -->

                <div class="min-w-0">
                  <div
                    class="
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    {{ post.author.displayName }}
                  </div>

                  <div
                    class="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    {{ formatDate(post.createdAt) }}
                  </div>
                </div>
              </div>

              <!-- Post Menu -->

              <button
                mat-icon-button
                type="button"
                [matMenuTriggerFor]="postMenu"
                matTooltip="Post options"
              >
                <mat-icon> more_vert </mat-icon>
              </button>

              <mat-menu #postMenu="matMenu">
                <button mat-menu-item type="button" (click)="savePost(post.id)">
                  <mat-icon> bookmark_border </mat-icon>

                  <span> Save post </span>
                </button>

                <button mat-menu-item type="button" (click)="reportPost(post.id)">
                  <mat-icon> flag </mat-icon>

                  <span> Report post </span>
                </button>
              </mat-menu>
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
                sm:pb-7
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
                  sm:text-3xl
                "
              >
                {{ post.title }}
              </h1>

              <!-- Body -->

              <div
                class="
                  mt-5
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
                    mt-6
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
                        py-1
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
                py-3
                sm:px-7
              "
            >
              <!-- Reactions -->

              <button mat-button type="button" (click)="reactToPost(post.id)">
                <mat-icon> thumb_up_off_alt </mat-icon>

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
                  py-4
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
                    <div class="px-5 py-5 sm:px-7">
                      <app-community-comment
                        [comment]="comment"
                        [depth]="0"
                        (react)="onCommentReaction($event)"
                        (deleted)="onCommentDeleted($event)"
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

  private readonly route = inject(ActivatedRoute);

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

    void this.store.loadPost(this.postId);

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

  // ==============================================================
  // POST
  // ==============================================================

  reloadPost(): void {
    if (!this.postId) {
      return;
    }

    void this.store.loadPost(this.postId);
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

  reactToPost(postId: string): void {
    /*
     * Persistence will be implemented in the
     * CommunityReactionService/Store next.
     */
    console.log('React to post:', postId);
  }

  // ==============================================================
  // SAVE
  // ==============================================================

  savePost(postId: string): void {
    /*
     * Bookmark persistence will be implemented
     * through CommunityBookmarkService/Store.
     */
    console.log('Save post:', postId);
  }

  // ==============================================================
  // REPORT
  // ==============================================================

  reportPost(postId: string): void {
    /*
     * Reporting will eventually open a shared
     * Material confirmation/dialog workflow.
     */
    console.log('Report post:', postId);
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

    if (!text) {
      return;
    }

    if (text.length > 2000) {
      return;
    }

    if (!this.postId) {
      return;
    }

    /*
     * CommunityCommentStore handles:
     *
     * 1. Authentication
     * 2. Validation
     * 3. Persistence
     * 4. Reloading comments
     *
     * CommunityCommentService now atomically
     * increments the post commentCount.
     */
    const commentId = await this.commentStore.addComment(this.postId, text);

    if (!commentId) {
      return;
    }

    this.commentText = '';
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

  onCommentDeleted(event: Event | CommunityComment): void {
    /*
     * CommunityCommentComponent currently exposes the
     * deleted event through Angular's event mechanism.
     *
     * The actual comment store/service is responsible for
     * deleting the comment and maintaining commentCount.
     */
    if (event instanceof Event) {
      return;
    }

    console.log('Comment deleted:', event.id);
  }

  onReplyCreated(commentId: string): void {
    /*
     * The child comment component emits the newly-created
     * reply ID.
     *
     * CommunityCommentStore has already refreshed the
     * comments collection, while CommunityCommentService
     * atomically increments the post commentCount.
     */
    console.log('Reply created:', commentId);
  }

  onCommentReaction(comment: CommunityComment): void {
    /*
     * Comment reactions will be persisted through
     * CommunityReactionService next.
     */
    console.log('Comment reaction:', comment.id);
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

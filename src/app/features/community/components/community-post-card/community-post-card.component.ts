
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityPost } from '../../models/community-post.model';
import { CommunityFollowStore } from '../../store/community-follow.store';

import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-community-post-card',
  standalone: true,

  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <article
      class="group overflow-hidden rounded-2xl border border-slate-200
             bg-white shadow-sm transition-all duration-200
             hover:-translate-y-0.5 hover:shadow-md mb-2"
    >
      <!-- ============================================================
           POST HEADER
           ============================================================ -->

      <div class="flex items-start gap-3 px-5 pt-5">

        <!-- ==========================================================
             AUTHOR AVATAR
             ========================================================== -->

        <a
          [routerLink]="['/community/users', post().author.id]"
          class="flex h-11 w-11 shrink-0 items-center justify-center
                 overflow-hidden rounded-full bg-[#087F80]/10
                 text-sm font-semibold text-[#087F80]
                 transition-all duration-200
                 hover:ring-2 hover:ring-[#087F80]/30"
        
          (click)="$event.stopPropagation()"
        >
          @if (post().author.photoUrl) {
            <img
              [src]="post().author.photoUrl"
              [alt]="post().author.displayName"
              class="h-full w-full object-cover"
            />
          } @else {
            {{ getInitials(post().author.displayName) }}
          }
        </a>

        <!-- ==========================================================
             AUTHOR INFORMATION
             ========================================================== -->

        <div class="min-w-0 flex-1">

          <!-- Author Name -->

          <a
            [routerLink]="['/community/users', post().author.id]"
            class="block truncate text-sm font-semibold text-slate-900
                   transition-colors hover:text-[#087F80] hover:underline"
            (click)="$event.stopPropagation()"
          >
            {{ post().author.displayName }}
          </a>

          <!-- Topic / Date -->

          <div
            class="mt-0.5 flex flex-wrap items-center gap-1.5
                   text-xs text-slate-500"
          >
            @if (post().topicName) {
              <button
                type="button"
                class="font-medium text-[#087F80] hover:underline"
                (click)="onTopicClick($event)"
              >
                {{ post().topicName }}
              </button>

              <span aria-hidden="true"> • </span>
            }

            <span>
              {{ formatDate(post().createdAt) }}
            </span>
          </div>

          <!-- ========================================================
               FOLLOW BUTTON
               ======================================================== -->

          @if (canFollowAuthor()) {
            <div class="mt-2">
              <button
                mat-stroked-button
                type="button"
                class="!min-h-8 !rounded-full !px-3 !py-0
                       !text-xs !font-medium"
                [class.!border-[#087F80]]="isFollowingAuthor()"
                [class.!text-[#087F80]]="isFollowingAuthor()"
                [disabled]="
                  followStore.togglingFollow() ||
                  followStore.checkingFollow()
                "
                (click)="onFollowClick($event)"
                [attr.aria-label]="
                  isFollowingAuthor()
                    ? 'Unfollow ' + post().author.displayName
                    : 'Follow ' + post().author.displayName
                "
              >
                @if (
                  followStore.togglingFollow() ||
                  followStore.checkingFollow()
                ) {
                  <mat-icon
                    class="mr-1 !h-[16px] !w-[16px] !text-[16px]"
                  >
                    sync
                  </mat-icon>
                } @else {
                  <mat-icon
                    class="mr-1 !h-[16px] !w-[16px] !text-[16px]"
                  >
                    {{
                      isFollowingAuthor()
                        ? 'person_remove'
                        : 'person_add'
                    }}
                  </mat-icon>
                }

                {{ isFollowingAuthor() ? 'Following' : 'Follow' }}
              </button>
            </div>
          }
        </div>

        <!-- ==========================================================
             POST ACTIONS
             ========================================================== -->

        <button
          mat-icon-button
          type="button"
          aria-label="Post actions"
          matTooltip="Post actions"
          [matMenuTriggerFor]="postMenu"
          (click)="$event.stopPropagation()"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>

        <mat-menu #postMenu="matMenu">

          <!-- Bookmark -->

          <button
            mat-menu-item
            type="button"
            (click)="onBookmarkClick($event)"
          >
            <mat-icon>
              {{
                post().bookmarkedByCurrentUser
                  ? 'bookmark'
                  : 'bookmark_border'
              }}
            </mat-icon>

            <span>
              {{
                post().bookmarkedByCurrentUser
                  ? 'Remove saved post'
                  : 'Save post'
              }}
            </span>
          </button>

          <!-- Report -->

          <button
            mat-menu-item
            type="button"
            (click)="onReportClick($event)"
          >
            <mat-icon>flag</mat-icon>

            <span>Report post</span>
          </button>

        </mat-menu>
      </div>

      <!-- ============================================================
           POST CONTENT
           ============================================================ -->

      <button
        type="button"
        class="block w-full cursor-pointer text-left"
        (click)="onPostClick()"
      >
        <div class="px-5 pb-4 pt-4">

          <!-- Title -->

          <h2
            class="text-lg font-bold leading-snug text-slate-900
                   transition-colors group-hover:text-[#087F80]"
          >
            {{ post().title }}
          </h2>

          <!-- Content -->

          <p
            class="mt-2 whitespace-pre-line text-sm leading-6
                   text-slate-600"
          >
            {{ getContentPreview(post().content) }}
          </p>

          <!-- Tags -->

          @if (post().tags?.length) {
            <div class="mt-4 flex flex-wrap gap-2">
              @for (tag of post().tags; track tag) {
                <span
                  class="rounded-full bg-slate-100 px-2.5 py-1
                         text-xs font-medium text-slate-600"
                >
                  #{{ tag }}
                </span>
              }
            </div>
          }

        </div>
      </button>

      <!-- ============================================================
           POST FOOTER
           ============================================================ -->

      <div class="border-t border-slate-100 px-4 py-2">

        <div class="flex items-center justify-between">

          <!-- ======================================================
               ENGAGEMENT
               ====================================================== -->

          <div class="flex items-center gap-1">

            <!-- Reaction -->

            <button
              mat-button
              type="button"
              class="!min-w-0 !px-2"
              [class.text-teal-700]="!!post().currentUserReaction"
              (click)="onReactionClick($event)"
            >
              <mat-icon class="mr-1 !text-[19px]">
                {{
                  post().currentUserReaction
                    ? 'thumb_up'
                    : 'thumb_up_off_alt'
                }}
              </mat-icon>

              <span class="text-xs">
                {{ totalReactionCount() }}
              </span>
            </button>

            <!-- Comments -->

            <button
              mat-button
              type="button"
              class="!min-w-0 !px-2"
              (click)="onCommentsClick($event)"
            >
              <mat-icon class="mr-1 !text-[19px]">
                chat_bubble_outline
              </mat-icon>

              <span class="text-xs">
                {{ post().commentCount }}
              </span>
            </button>

            <!-- Views -->

            <span
              class="flex items-center px-2 text-xs text-slate-500"
              matTooltip="Views"
            >
              <mat-icon class="mr-1 !text-[18px]">
                visibility
              </mat-icon>

              {{ post().viewCount }}
            </span>

          </div>

          <!-- ========================================================
               SHARE
               ======================================================== -->

        <div class="flex items-center gap-1">

  <!-- Bookmark -->

  <button
    mat-button
    type="button"
    class="!min-w-0 !px-2"
    [class.text-teal-700]="post().bookmarkedByCurrentUser"
    [matTooltip]="
      post().bookmarkedByCurrentUser
        ? 'Remove saved post'
        : 'Save post'
    "
    [attr.aria-label]="
      post().bookmarkedByCurrentUser
        ? 'Remove saved post'
        : 'Save post'
    "
    (click)="onBookmarkClick($event)"
  >
    <mat-icon class="mr-1 !text-[19px]">
      {{
        post().bookmarkedByCurrentUser
          ? 'bookmark'
          : 'bookmark_border'
      }}
    </mat-icon>

    <span class="text-xs">
      {{
        post().bookmarkedByCurrentUser
          ? 'Saved'
          : 'Save'
      }}
    </span>
  </button>

  <!-- Share -->

  <button
    mat-button
    type="button"
    class="!min-w-0 !px-2"
    (click)="onShareClick($event)"
  >
    <mat-icon class="mr-1 !text-[19px]">
      share
    </mat-icon>

    <span class="text-xs">
  share
    </span>
  </button>

</div>

        </div>
      </div>
    </article>
  `,
})
export class CommunityPostCardComponent {

  // ============================================================
  // SERVICES
  // ============================================================

  readonly followStore = inject(CommunityFollowStore);

  private readonly authService = inject(AuthService);

  private readonly logger = inject(LoggerService);

  // ============================================================
  // INPUTS
  // ============================================================

  readonly post = input.required<CommunityPost>();

  // ============================================================
  // OUTPUTS
  // ============================================================

  readonly postSelected = output<CommunityPost>();

  readonly topicSelected = output<string>();

  readonly react = output<CommunityPost>();

  readonly comments = output<CommunityPost>();

  readonly bookmark = output<CommunityPost>();

  readonly share = output<CommunityPost>();

  readonly report = output<CommunityPost>();

  // ============================================================
  // LOCAL STATE
  // ============================================================

  private readonly followInitialized = signal(false);

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor() {
    /**
     * Whenever the post changes, check the relationship
     * between the authenticated user and the post author.
     */
    effect(() => {
      const post = this.post();

      const currentUserId = this.currentUserId();

      const authorId = this.authorId();

      if (
        !currentUserId ||
        !authorId ||
        currentUserId === authorId
      ) {
        this.followInitialized.set(false);
        return;
      }

      const cachedStatus =
        this.followStore.getFollowStatus(
          currentUserId,
          authorId,
        );

      if (cachedStatus === null) {
        void this.loadFollowStatus(
          currentUserId,
          authorId,
        );
      } else {
        this.followInitialized.set(true);
      }
    });
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================

  private currentUserId(): string | null {
    return (
      this.authService.user()?.id ??
      this.authService.firebaseUser()?.uid ??
      null
    );
  }

  // ============================================================
  // AUTHOR
  // ============================================================

  private authorId(): string | null {
    return this.post().author.id || null;
  }

  // ============================================================
  // FOLLOW VISIBILITY
  // ============================================================

  canFollowAuthor(): boolean {
    const currentUserId = this.currentUserId();

    const authorId = this.authorId();

    return !!(
      currentUserId &&
      authorId &&
      currentUserId !== authorId
    );
  }

  // ============================================================
  // FOLLOW STATUS
  // ============================================================

  isFollowingAuthor(): boolean {
    const currentUserId = this.currentUserId();

    const authorId = this.authorId();

    if (
      !currentUserId ||
      !authorId ||
      currentUserId === authorId
    ) {
      return false;
    }

    return (
      this.followStore.getFollowStatus(
        currentUserId,
        authorId,
      ) === true
    );
  }

  // ============================================================
  // LOAD FOLLOW STATUS
  // ============================================================

  private async loadFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<void> {
    try {
      await this.followStore.checkFollowing(
        followerId,
        followingId,
      );

      this.followInitialized.set(true);
    } catch (error) {
      this.logger.error(
        'CommunityPostCard',
        'Failed to load author follow status.',
        error,
        {
          followerId,
          followingId,
          postId: this.post().id,
        },
      );
    }
  }

  // ============================================================
  // FOLLOW / UNFOLLOW
  // ============================================================

  async onFollowClick(event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const followerId = this.currentUserId();

    const followingId = this.authorId();

    if (
      !followerId ||
      !followingId ||
      followerId === followingId
    ) {
      return;
    }

    if (this.followStore.togglingFollow()) {
      return;
    }

    const wasFollowing =
      this.isFollowingAuthor();

    try {
      const newStatus =
        await this.followStore.toggleFollow(
          followerId,
          followingId,
        );

      this.logger.info(
        'CommunityPostCard',
        wasFollowing
          ? 'Community user unfollowed a post author.'
          : 'Community user followed a post author.',
        {
          followerId,
          followingId,
          postId: this.post().id,
          following: newStatus,
        },
      );
    } catch (error) {
      this.logger.error(
        'CommunityPostCard',
        'Failed to update author follow relationship.',
        error,
        {
          followerId,
          followingId,
          postId: this.post().id,
        },
      );
    }
  }

  // ============================================================
  // POST CLICK
  // ============================================================

  onPostClick(): void {
    this.postSelected.emit(this.post());
  }

  // ============================================================
  // TOPIC CLICK
  // ============================================================

  onTopicClick(event: MouseEvent): void {
    event.stopPropagation();

    const topicId = this.post().topicId;

    if (!topicId) {
      return;
    }

    this.topicSelected.emit(topicId);
  }

  // ============================================================
  // REACTION
  // ============================================================

  onReactionClick(event: MouseEvent): void {
    event.stopPropagation();

    this.react.emit(this.post());
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  onCommentsClick(event: MouseEvent): void {
    event.stopPropagation();

    this.comments.emit(this.post());
  }

  // ============================================================
  // BOOKMARK
  // ============================================================

  onBookmarkClick(event: MouseEvent): void {
    event.stopPropagation();

    this.bookmark.emit(this.post());
  }

  // ============================================================
  // REPORT
  // ============================================================

  onReportClick(event: MouseEvent): void {
    event.stopPropagation();

    this.report.emit(this.post());
  }

  // ============================================================
  // SHARE
  // ============================================================

  onShareClick(event: MouseEvent): void {
    event.stopPropagation();

    this.share.emit(this.post());
  }

  // ============================================================
  // REACTION COUNT
  // ============================================================

  totalReactionCount(): number {
    const counts =
      this.post().reactionCounts ?? {};

    return Object.values(counts).reduce(
      (total, count) =>
        total +
        (typeof count === 'number'
          ? count
          : 0),
      0,
    );
  }

  // ============================================================
  // INITIALS
  // ============================================================

  getInitials(
    displayName: string | null | undefined,
  ): string {
    if (!displayName?.trim()) {
      return '?';
    }

    const parts =
      displayName
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
  // CONTENT PREVIEW
  // ============================================================

  getContentPreview(
    content: string | null | undefined,
  ): string {
    if (!content) {
      return '';
    }

    const normalized =
      content.trim();

    const maxLength = 280;

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return (
      normalized
        .substring(0, maxLength)
        .trimEnd() + '…'
    );
  }

  // ============================================================
  // DATE
  // ============================================================

  formatDate(value: unknown): string {
    if (!value) {
      return '';
    }

    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate === 'function'
    ) {
      date = (
        value as {
          toDate: () => Date;
        }
      ).toDate();
    } else if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      const parsed =
        new Date(value);

      if (
        !Number.isNaN(
          parsed.getTime(),
        )
      ) {
        date = parsed;
      }
    }

    if (!date) {
      return '';
    }

    const now = new Date();

    const difference =
      now.getTime() -
      date.getTime();

    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;

    if (
      difference >= 0 &&
      difference < minute
    ) {
      return 'Just now';
    }

    if (
      difference >= 0 &&
      difference < hour
    ) {
      const minutes =
        Math.floor(
          difference / minute,
        );

      return `${minutes}m ago`;
    }

    if (
      difference >= 0 &&
      difference < day
    ) {
      const hours =
        Math.floor(
          difference / hour,
        );

      return `${hours}h ago`;
    }

    if (
      difference >= 0 &&
      difference < 7 * day
    ) {
      const days =
        Math.floor(
          difference / day,
        );

      return `${days}d ago`;
    }

    return new Intl.DateTimeFormat(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !==
          now.getFullYear()
            ? 'numeric'
            : undefined,
      },
    ).format(date);
  }
}

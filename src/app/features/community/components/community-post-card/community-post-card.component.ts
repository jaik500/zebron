import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityPost } from '../../models/community-post.model';

@Component({
  selector: 'app-community-post-card',
  standalone: true,

  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],

  template: `
    <article
      class="group overflow-hidden rounded-2xl border border-slate-200
             bg-white shadow-sm transition-all duration-200
             hover:-translate-y-0.5 hover:shadow-md"
    >

      <!-- ============================================================
           POST HEADER
           ============================================================ -->

      <div class="flex items-start gap-3 px-5 pt-5">

        <!-- Author Avatar -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center
                 overflow-hidden rounded-full bg-[#087F80]/10
                 text-sm font-semibold text-[#087F80]"
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

        </div>


        <!-- Author Information -->
        <div class="min-w-0 flex-1">

          <div
            class="truncate text-sm font-semibold text-slate-900"
          >
            {{ post().author.displayName }}
          </div>

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

              <span aria-hidden="true">•</span>

            }

            <span>
              {{ formatDate(post().createdAt) }}
            </span>

          </div>

        </div>


        <!-- Post Actions -->
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

              @for (
                tag of post().tags;
                track tag
              ) {

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

      <div
        class="border-t border-slate-100 px-4 py-2"
      >

        <div class="flex items-center justify-between">

          <!-- Engagement -->
          <div class="flex items-center gap-1">

            <!-- Reaction -->
          <button
  mat-button
  type="button"
  class="!min-w-0 !px-2"
  [class.text-teal-700]="
    !!post().currentUserReaction
  "
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


          <!-- Bookmark -->
          <button
            mat-icon-button
            type="button"
            aria-label="Save post"
            [matTooltip]="
              post().bookmarkedByCurrentUser
                ? 'Remove saved post'
                : 'Save post'
            "
            (click)="onBookmarkClick($event)"
          >

            <mat-icon>
              {{
                post().bookmarkedByCurrentUser
                  ? 'bookmark'
                  : 'bookmark_border'
              }}
            </mat-icon>

          </button>

        </div>

      </div>

    </article>
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPostCardComponent {

  // ============================================================
  // INPUT
  // ============================================================

  readonly post =
    input.required<CommunityPost>();


  // ============================================================
  // OUTPUTS
  // ============================================================

  readonly postSelected =
    output<CommunityPost>();

  readonly topicSelected =
    output<string>();

  readonly react =
    output<CommunityPost>();

  readonly comments =
    output<CommunityPost>();

  readonly bookmark =
    output<CommunityPost>();

  readonly report =
    output<CommunityPost>();


  // ============================================================
  // REACTION COUNT
  // ============================================================

  totalReactionCount(): number {

    const counts =
      this.post().reactionCounts ?? {};

    return Object.values(counts)
      .reduce(
        (total, count) =>
          total + Number(count || 0),
        0,
      );
  }


  // ============================================================
  // AUTHOR INITIALS
  // ============================================================

  getInitials(
    name: string | null | undefined,
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
  // CONTENT PREVIEW
  // ============================================================

  getContentPreview(
    content: string | null | undefined,
  ): string {

    if (!content) {
      return '';
    }

    const text =
      content.trim();

    const maxLength =
      320;

    if (
      text.length <= maxLength
    ) {
      return text;
    }

    return `${text
      .substring(0, maxLength)
      .trim()}…`;
  }


  // ============================================================
  // DATE FORMATTER
  // ============================================================

  formatDate(
    value: unknown,
  ): string {

    if (!value) {
      return 'Recently';
    }

    let date: Date | null =
      null;


    // JavaScript Date
    if (value instanceof Date) {

      date = value;

    }


    // Firestore Timestamp
    else if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate === 'function'
    ) {

      date =
        (
          value as {
            toDate: () => Date;
          }
        ).toDate();

    }


    // String / number
    else if (
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
      return 'Recently';
    }


    const difference =
      Math.max(
        0,
        Date.now() -
          date.getTime(),
      );


    const minute =
      60 * 1000;

    const hour =
      60 * minute;

    const day =
      24 * hour;


    if (
      difference < minute
    ) {
      return 'Just now';
    }


    if (
      difference < hour
    ) {

      const minutes =
        Math.floor(
          difference / minute,
        );

      return `${minutes}m ago`;
    }


    if (
      difference < day
    ) {

      const hours =
        Math.floor(
          difference / hour,
        );

      return `${hours}h ago`;
    }


    if (
      difference < 7 * day
    ) {

      const days =
        Math.floor(
          difference / day,
        );

      return `${days}d ago`;
    }


    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',

        year:
          date.getFullYear() !==
          new Date().getFullYear()
            ? 'numeric'
            : undefined,
      },
    );
  }


  // ============================================================
  // EVENTS
  // ============================================================

  onPostClick(): void {

    this.postSelected.emit(
      this.post(),
    );
  }


  onTopicClick(
    event: MouseEvent,
  ): void {

    event.stopPropagation();

    this.topicSelected.emit(
      this.post().topicId,
    );
  }


  onReactionClick(
    event: MouseEvent,
  ): void {

    event.stopPropagation();

    this.react.emit(
      this.post(),
    );
  }


  onCommentsClick(
    event: MouseEvent,
  ): void {

    event.stopPropagation();

    this.comments.emit(
      this.post(),
    );
  }


  onBookmarkClick(
    event: MouseEvent,
  ): void {

    event.stopPropagation();

    this.bookmark.emit(
      this.post(),
    );
  }


  onReportClick(
    event: MouseEvent,
  ): void {

    event.stopPropagation();

    this.report.emit(
      this.post(),
    );
  }
}
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatMenuModule } from '@angular/material/menu';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import { CommunityComment } from '../../models/community-comment.model';

import { CommunityCommentStore } from '../../store/community-comment.store';

@Component({
  selector: 'app-community-comment',

  standalone: true,

  imports: [
    FormsModule,

    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,

    forwardRef(() => CommunityCommentComponent),
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <!-- ==========================================================
         COMMENT
         ========================================================== -->

    <article class="group relative" [class.pl-10]="depth() > 0" [class.sm:pl-12]="depth() > 0">
      <!-- Reply connector -->

      @if (depth() > 0) {
        <div
          class="absolute left-4 top-0
                 h-full w-px
                 bg-slate-200
                 sm:left-5"
        ></div>
      }

      <div class="flex items-start gap-3">
        <!-- ======================================================
             AVATAR
             ====================================================== -->

        <div
          class="relative z-10 flex
                 h-9 w-9 shrink-0
                 items-center justify-center
                 overflow-hidden rounded-full
                 bg-[#087F80]/10
                 text-xs font-semibold
                 text-[#087F80]"
        >
          @if (comment().author.photoUrl) {
            <img
              [src]="comment().author.photoUrl"
              [alt]="comment().author.displayName"
              class="h-full w-full
                     object-cover"
            />
          } @else {
            {{ getInitials(comment().author.displayName) }}
          }
        </div>

        <!-- ======================================================
             COMMENT CONTENT
             ====================================================== -->

        <div class="min-w-0 flex-1">
          <!-- Header -->

          <div
            class="flex items-start
                   justify-between gap-2"
          >
            <div class="min-w-0">
              <div
                class="truncate text-sm
                       font-semibold
                       text-slate-900"
              >
                {{ comment().author.displayName }}
              </div>

              <div
                class="text-xs
                       text-slate-400"
              >
                {{ formatDate(comment().createdAt) }}
              </div>
            </div>

            <!-- ==================================================
                 COMMENT MENU
                 ================================================== -->

            @if (isCurrentUserComment()) {
              <button
                mat-icon-button
                type="button"
                aria-label="Comment options"
                matTooltip="Comment options"
                [matMenuTriggerFor]="commentMenu"
              >
                <mat-icon> more_vert </mat-icon>
              </button>

              <mat-menu #commentMenu="matMenu">
                <button
                  mat-menu-item
                  type="button"
                  [disabled]="commentStore.deleting()"
                  (click)="deleteComment()"
                >
                  <mat-icon> delete_outline </mat-icon>

                  <span> Delete comment </span>
                </button>
              </mat-menu>
            }
          </div>

          <!-- ====================================================
               BODY
               ==================================================== -->

          <div
            class="mt-2 whitespace-pre-line
                   break-words
                   text-sm leading-6
                   text-slate-700"
          >
            {{ comment().content }}
          </div>

          <!-- ====================================================
               ACTIONS
               ==================================================== -->

          <div
            class="mt-2 flex items-center
                   gap-1"
          >
            <!-- Reaction -->

            <button
              mat-button
              type="button"
              class="!min-w-0 !px-2
                     !text-xs"
              (click)="react.emit(comment())"
            >
              <mat-icon
                class="!mr-1 !h-[18px]
                       !w-[18px]
                       !text-[18px]"
              >
                thumb_up_off_alt
              </mat-icon>

              @if (reactionCount() > 0) {
                <span>
                  {{ reactionCount() }}
                </span>
              } @else {
                <span> Like </span>
              }
            </button>

            <!-- Reply -->

            <button
              mat-button
              type="button"
              class="!min-w-0 !px-2
                     !text-xs"
              (click)="toggleReply()"
            >
              <mat-icon
                class="!mr-1 !h-[18px]
                       !w-[18px]
                       !text-[18px]"
              >
                reply
              </mat-icon>

              <span> Reply </span>
            </button>
          </div>

          <!-- ====================================================
               REPLY COMPOSER
               ==================================================== -->

          @if (replying()) {
            <div
              class="mt-3 rounded-xl
                     border border-slate-200
                     bg-slate-50 p-3"
            >
              <mat-form-field appearance="outline" class="w-full" floatLabel="always">
                <mat-label>
                  Reply to
                  {{ comment().author.displayName }}
                </mat-label>

                <textarea
                  matInput
                  [(ngModel)]="replyText"
                  rows="2"
                  maxlength="2000"
                  placeholder="Write a reply..."
                ></textarea>

                <mat-hint align="end"> {{ replyText.length }}/2000 </mat-hint>
              </mat-form-field>

              <div class="flex justify-end gap-2">
                <button mat-button type="button" (click)="cancelReply()">Cancel</button>

                <button
                  mat-flat-button
                  type="button"
                  [disabled]="!replyText.trim() || commentStore.saving()"
                  (click)="submitReply()"
                >
                  @if (commentStore.saving()) {
                    <mat-spinner diameter="18" />
                  } @else {
                    <ng-container>
                      <mat-icon> send </mat-icon>

                      <span> Reply </span>
                    </ng-container>
                  }
                </button>
              </div>
            </div>
          }

          <!-- ====================================================
               REPLIES
               ==================================================== -->

          @if (replies().length > 0) {
            <div class="mt-4 space-y-4">
              @for (reply of replies(); track reply.id) {
                <app-community-comment
                  [comment]="reply"
                  [depth]="depth() + 1"
                  (react)="react.emit($event)"
                  (commentDeleted)="commentDeleted.emit($event)"
                  (replyCreated)="replyCreated.emit($event)"
                />
              }
            </div>
          }
        </div>
      </div>
    </article>
  `,
})
export class CommunityCommentComponent {
  // ============================================================
  // STORE
  // ============================================================

  readonly commentStore = inject(CommunityCommentStore);

  // ============================================================
  // INPUTS
  // ============================================================

  readonly comment = input.required<CommunityComment>();

  /**
   * Used to visually indent nested replies.
   */
  readonly depth = input<number>(0);

  // ============================================================
  // OUTPUTS
  // ============================================================

  readonly react = output<CommunityComment>();

  readonly commentDeleted = output<string>();

  readonly replyCreated = output<string>();

  // ============================================================
  // LOCAL STATE
  // ============================================================

  readonly replying = signal(false);

  replyText = '';

  // ============================================================
  // REPLIES
  // ============================================================

  replies() {
    return this.commentStore.getReplies(this.comment().id);
  }

  // ============================================================
  // REACTION COUNT
  // ============================================================

  reactionCount(): number {
    const counts = this.comment().reactionCounts ?? {};

    return Object.values(counts).reduce((total, count) => total + Number(count || 0), 0);
  }

  // ============================================================
  // CURRENT USER
  // ============================================================

  isCurrentUserComment(): boolean {
    const user = this.commentStore.currentUser();

    return !!user && user.id === this.comment().authorId;
  }

  // ============================================================
  // REPLY
  // ============================================================

  toggleReply(): void {
    const nextValue = !this.replying();

    this.replying.set(nextValue);

    if (!nextValue) {
      this.replyText = '';
    }
  }

  cancelReply(): void {
    this.replying.set(false);

    this.replyText = '';
  }

  async submitReply(): Promise<void> {
    const postId = this.comment().postId;

    const parentCommentId = this.comment().id;

    const text = this.replyText.trim();

    if (!postId || !parentCommentId || !text) {
      return;
    }

    const replyId = await this.commentStore.addReply(postId, parentCommentId, text);

    if (replyId) {
      this.replyText = '';

      this.replying.set(false);

      this.replyCreated.emit(replyId);
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteComment(): Promise<void> {
    const postId = this.comment().postId;

    const commentId = this.comment().id;

    const deleted = await this.commentStore.deleteComment(postId, commentId);

    if (deleted) {
      this.commentDeleted.emit(commentId);
    }
  }

  // ============================================================
  // INITIALS
  // ============================================================

  getInitials(name: string | null | undefined): string {
    if (!name?.trim()) {
      return '?';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // ============================================================
  // DATE
  // ============================================================

  formatDate(value: unknown): string {
    if (!value) {
      return 'Recently';
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
    } else if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
    }

    if (!date) {
      return 'Recently';
    }

    const difference = Math.max(0, Date.now() - date.getTime());

    const minute = 60 * 1000;

    const hour = 60 * minute;

    const day = 24 * hour;

    if (difference < minute) {
      return 'Just now';
    }

    if (difference < hour) {
      return `${Math.floor(difference / minute)}m ago`;
    }

    if (difference < day) {
      return `${Math.floor(difference / hour)}h ago`;
    }

    if (difference < 7 * day) {
      return `${Math.floor(difference / day)}d ago`;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }
}

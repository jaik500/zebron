import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatMenuModule,
} from '@angular/material/menu';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  MatFormFieldModule,
} from '@angular/material/form-field';

import {
  MatInputModule,
} from '@angular/material/input';

import {
  CommunityComment,
} from '../../models/community-comment.model';

import {
  CommunityCommentStore,
} from '../../store/community-comment.store';

import {
  LoggerService,
} from '../../../../core/services/logger.service';


// ================================================================
// COMPONENT
// ================================================================

@Component({
  selector: 'app-community-comment',

  standalone: true,

  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `

    <!-- ==========================================================
         COMMENT CONTAINER
         ========================================================== -->

    <div
      class="group relative"
      [class.ml-8]="depth() > 0"
      [class.mt-4]="depth() > 0"
    >

      <!-- ========================================================
           DELETED COMMENT
           ======================================================== -->

      @if (isDeleted()) {

        <div
          class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          role="status"
          aria-label="Deleted comment"
        >

          <div
            class="flex items-center gap-2 text-sm italic text-gray-500"
          >

            <mat-icon
              class="!h-5 !w-5 !text-[20px]"
              aria-hidden="true"
            >
              delete_outline
            </mat-icon>

            <span>
              This comment was deleted.
            </span>

          </div>

        </div>

      } @else {

        <!-- ======================================================
             ACTIVE COMMENT
             ====================================================== -->

        <div
          class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >

          <!-- ====================================================
               COMMENT HEADER
               ==================================================== -->

          <div
            class="flex items-start justify-between gap-3"
          >

            <div
              class="flex min-w-0 items-center gap-3"
            >

              <!-- Avatar -->

              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100"
              >

                @if (comment().author.photoUrl) {

                  <img
                    [src]="comment().author.photoUrl"
                    [alt]="comment().author.displayName"
                    class="h-full w-full object-cover"
                  />

                } @else {

                  <span
                    class="text-sm font-semibold text-slate-600"
                  >
                    {{ authorInitials() }}
                  </span>

                }

              </div>


              <!-- Author -->

              <div
                class="min-w-0"
              >

                <div
                  class="truncate text-sm font-semibold text-gray-900"
                >
                  {{ comment().author.displayName }}
                </div>

                <div
                  class="text-xs text-gray-500"
                >
                  {{ formattedDate() }}
                </div>

              </div>

            </div>


            <!-- ==================================================
                 COMMENT MENU
                 ================================================== -->

            @if (canDelete()) {

              <button
                mat-icon-button
                type="button"
                [matMenuTriggerFor]="commentMenu"
                aria-label="Comment actions"
                matTooltip="Comment actions"
              >
                <mat-icon>
                  more_vert
                </mat-icon>
              </button>

              <mat-menu #commentMenu="matMenu">

                <button
                  mat-menu-item
                  type="button"
                  [disabled]="commentStore.deleting()"
                  (click)="deleteComment()"
                >

                  <mat-icon>
                    delete_outline
                  </mat-icon>

                  <span>
                    Delete
                  </span>

                </button>

              </mat-menu>

            }

          </div>


          <!-- ====================================================
               COMMENT CONTENT
               ==================================================== -->

          <div
            class="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700"
          >
            {{ comment().content }}
          </div>


          <!-- ====================================================
               COMMENT ACTIONS
               ==================================================== -->

          <div
            class="mt-3 flex items-center gap-1"
          >

            <!-- Reaction -->

            <button
              mat-button
              type="button"
              class="!min-w-0"
              [class.!text-blue-600]="hasCurrentUserReaction()"
              [disabled]="commentStore.deleting()"
              (click)="onReactionClick()"
              [attr.aria-pressed]="hasCurrentUserReaction()"
              [attr.aria-label]="
                hasCurrentUserReaction()
                  ? 'Remove like'
                  : 'Like comment'
              "
              matTooltip="Like"
            >

              <mat-icon
                class="!mr-1"
              >
                {{
                  hasCurrentUserReaction()
                    ? 'thumb_up'
                    : 'thumb_up_off_alt'
                }}
              </mat-icon>

              <span>
                Like
              </span>

              @if (reactionCount() > 0) {

                <span
                  class="ml-1 text-xs"
                >
                  {{ reactionCount() }}
                </span>

              }

            </button>


            <!-- Reply -->

            @if (canReply()) {

              <button
                mat-button
                type="button"
                class="!min-w-0"
                (click)="startReply()"
                aria-label="Reply to comment"
                matTooltip="Reply"
              >

                <mat-icon
                  class="!mr-1"
                >
                  reply
                </mat-icon>

                <span>
                  Reply
                </span>

              </button>

            }

          </div>


          <!-- ====================================================
               REPLY COMPOSER
               ==================================================== -->

          @if (replying()) {

            <div
              class="mt-4"
            >

              <mat-form-field
                appearance="outline"
                class="w-full"
              >

                <mat-label>
                  Write a reply
                </mat-label>

                <textarea
                  matInput
                  rows="3"
                  maxlength="2000"
                  [value]="replyContent()"
                  [disabled]="commentStore.saving()"
                  (input)="onReplyInput($event)"
                  (keydown)="onReplyKeydown($event)"
                ></textarea>

                <mat-hint align="end">
                  {{ replyContent().length }}/2000
                </mat-hint>

              </mat-form-field>


              <div
                class="flex justify-end gap-2"
              >

                <button
                  mat-button
                  type="button"
                  [disabled]="commentStore.saving()"
                  (click)="cancelReply()"
                >
                  Cancel
                </button>

                <button
                  mat-flat-button
                  type="button"
                  [disabled]="
                    !canSubmitReply() ||
                    commentStore.saving()
                  "
                  (click)="submitReply()"
                >

                  @if (commentStore.saving()) {

                    <mat-icon>
                      hourglass_empty
                    </mat-icon>

                  } @else {

                    <mat-icon>
                      send
                    </mat-icon>

                  }

                  Reply

                </button>

              </div>

            </div>

          }


          <!-- ====================================================
               REPLIES
               ==================================================== -->

          @if (replies().length > 0) {

            <div
              class="mt-4 space-y-4 border-l-2 border-gray-100 pl-4"
            >

              @for (
                reply of replies();
                track reply.id
              ) {

                <app-community-comment
                  [comment]="reply"
                  [depth]="depth() + 1"
                  (replyCreated)="replyCreated.emit($event)"
                  (react)="react.emit($event)"
                  (commentDeleted)="commentDeleted.emit($event)"
                />

              }

            </div>

          }

        </div>

      }

      <!-- ========================================================
           DELETED COMMENT REPLIES
           ======================================================== -->

      @if (
        isDeleted() &&
        replies().length > 0
      ) {

        <div
          class="mt-4 space-y-4 border-l-2 border-gray-100 pl-4"
        >

          @for (
            reply of replies();
            track reply.id
          ) {

            <app-community-comment
              [comment]="reply"
              [depth]="depth() + 1"
              (replyCreated)="replyCreated.emit($event)"
              (react)="react.emit($event)"
              (commentDeleted)="commentDeleted.emit($event)"
            />

          }

        </div>

      }

    </div>
  `,

  styles: [`

    :host {
      display: block;
    }

  `],
})
export class CommunityCommentComponent {

  // ==============================================================
  // DEPENDENCIES
  // ==============================================================

  readonly commentStore =
    inject(CommunityCommentStore);

  private readonly logger =
    inject(LoggerService);


  // ==============================================================
  // INPUTS
  // ==============================================================

  readonly comment =
    input.required<CommunityComment>();

  readonly depth =
    input<number>(0);


  // ==============================================================
  // OUTPUTS
  // ==============================================================

 readonly replyCreated = output<string>();
readonly react = output<CommunityComment>();
readonly commentDeleted = output<string>();


  // ==============================================================
  // LOCAL STATE
  // ==============================================================

  readonly replying =
    signal(false);

  readonly replyContent =
    signal('');


  // ==============================================================
  // COMPUTED STATE
  // ==============================================================

  readonly replies =
    computed(() =>
      this.commentStore.getReplies(
        this.comment().id,
      ),
    );


  readonly isDeleted =
    computed(() =>
      this.comment().status === 'deleted',
    );


  readonly canReply =
    computed(() =>
      !this.isDeleted(),
    );


  readonly canDelete =
    computed(() => {

      const comment =
        this.comment();

      const user =
        this.commentStore.currentUser();

      if (
        this.isDeleted() ||
        !user
      ) {
        return false;
      }

      return (
        comment.authorId ===
        user.id
      );
    });


  readonly hasCurrentUserReaction =
    computed(() =>
      !!this.comment()
        .currentUserReaction,
    );


  readonly reactionCount =
    computed(() => {

      const counts =
        this.comment()
          .reactionCounts ?? {};

      return Object.values(
        counts,
      ).reduce(
        (total, count) =>
          total + (
            typeof count === 'number'
              ? count
              : 0
          ),
        0,
      );
    });


  readonly authorInitials =
    computed(() => {

      const name =
        this.comment()
          .author
          ?.displayName
          ?.trim();

      if (!name) {
        return 'Z';
      }

      const parts =
        name
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
    });


  readonly formattedDate =
    computed(() =>
      this.formatDate(
        this.comment().createdAt,
      ),
    );


  // ==============================================================
  // REPLY INPUT
  // ==============================================================

  onReplyInput(
    event: Event,
  ): void {

    const target =
      event.target as HTMLTextAreaElement;

    this.replyContent.set(
      target.value,
    );
  }


  // ==============================================================
  // REPLY KEYBOARD HANDLING
  // ==============================================================

  onReplyKeydown(
    event: KeyboardEvent,
  ): void {

    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key === 'Enter'
    ) {

      event.preventDefault();

      void this.submitReply();
    }
  }


  // ==============================================================
  // START REPLY
  // ==============================================================

  startReply(): void {

    if (this.isDeleted()) {
      return;
    }

    this.replying.set(true);

    this.replyContent.set('');
  }


  // ==============================================================
  // CANCEL REPLY
  // ==============================================================

  cancelReply(): void {

    this.replying.set(false);

    this.replyContent.set('');
  }


  // ==============================================================
  // REPLY VALIDATION
  // ==============================================================

  canSubmitReply(): boolean {

    if (this.isDeleted()) {
      return false;
    }

    const content =
      this.replyContent().trim();

    return (
      content.length > 0 &&
      content.length <= 2000
    );
  }


  // ==============================================================
  // SUBMIT REPLY
  // ==============================================================

  async submitReply(): Promise<void> {

    if (
      !this.canSubmitReply() ||
      this.commentStore.saving()
    ) {
      return;
    }

    const comment =
      this.comment();

    const content =
      this.replyContent().trim();


    try {

      const replyId =
  await this.commentStore.addReply(
    comment.postId,
    comment.id,
    content,
  );

if (!replyId) {
  return;
}

this.logger.info(
  'CommunityCommentComponent',
  'Community comment reply created.',
  {
    postId: comment.postId,
    parentCommentId: comment.id,
    replyId,
  },
);

this.replying.set(false);
this.replyContent.set('');

/*
 * The store returns the newly-created reply ID.
 * Emit that ID directly so the parent component
 * can synchronize its state.
 */
this.replyCreated.emit(replyId);

    } catch (error) {

      this.logger.error(
        'CommunityCommentComponent',
        'Failed to create community comment reply.',
        {
          postId:
            comment.postId,

          parentCommentId:
            comment.id,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

    }
  }


  // ==============================================================
  // REACTION
  // ==============================================================

  async onReactionClick(): Promise<void> {

    const comment =
      this.comment();


    if (
      this.isDeleted() ||
      !comment.postId ||
      !comment.id
    ) {
      return;
    }


    try {

      await this.commentStore
        .reactToComment(
          comment.postId,
          comment.id,
          'like',
        );


      /*
       * Emit the current comment from the
       * component state after persistence.
       */
      const updatedComment =
        this.commentStore
          .comments()
          .find(
            (item) =>
              item.id === comment.id,
          );


      if (updatedComment) {

        this.react.emit(
          updatedComment,
        );

      }


      this.logger.info(
        'CommunityCommentComponent',
        'Community comment reaction requested.',
        {
          postId:
            comment.postId,

          commentId:
            comment.id,
        },
      );

    } catch (error) {

      this.logger.error(
        'CommunityCommentComponent',
        'Failed to react to community comment.',
        {
          postId:
            comment.postId,

          commentId:
            comment.id,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

    }
  }


  // ==============================================================
  // DELETE COMMENT
  // ==============================================================

  async deleteComment(): Promise<void> {

    const comment =
      this.comment();


    if (
      this.isDeleted() ||
      !this.canDelete()
    ) {
      return;
    }


    try {

      const success =
        await this.commentStore
          .deleteComment(
            comment.postId,
            comment.id,
          );


      if (!success) {
        return;
      }


      this.logger.info(
        'CommunityCommentComponent',
        'Community comment soft-deleted.',
        {
          postId:
            comment.postId,

          commentId:
            comment.id,

          authorId:
            comment.authorId,
        },
      );


      /*
       * Emit the original comment identity so
       * the parent component can synchronize
       * any additional state.
       */
    this.commentDeleted.emit(comment.id);

    } catch (error) {

      this.logger.error(
        'CommunityCommentComponent',
        'Failed to delete community comment.',
        {
          postId:
            comment.postId,

          commentId:
            comment.id,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

    }
  }


  // ==============================================================
  // DATE FORMATTER
  // ==============================================================

  private formatDate(
    value:
      CommunityComment['createdAt'],
  ): string {

    if (!value) {
      return '';
    }


    try {

      const date =
        value.toDate();


      return new Intl.DateTimeFormat(
        undefined,
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        },
      ).format(date);

    } catch {

      return '';
    }
  }
}
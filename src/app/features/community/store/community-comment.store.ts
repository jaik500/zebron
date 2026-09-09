import {
  computed,
  inject,
} from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../../core/services/auth.service';

import {
  CommunityComment,
} from '../models/community-comment.model';

import {
  CommunityCommentService,
} from '../services/community-comment.service';

import { LoggerService } from '../../../core/services/logger.service';


interface CommunityCommentState {

  comments: CommunityComment[];

  loading: boolean;

  saving: boolean;

  deleting: boolean;

  error: string | null;
}


const initialState:
  CommunityCommentState = {

  comments: [],

  loading: false,

  saving: false,

  deleting: false,

  error: null,
};


export const CommunityCommentStore =
  signalStore(

    {
      providedIn: 'root',
    },


    withState(
      initialState,
    ),


    // ==========================================================
    // COMPUTED STATE
    // ==========================================================

    withComputed(
      (
        store,
        authService = inject(AuthService),
      ) => ({

        commentCount:
          computed(
            () =>
              store.comments().length,
          ),

        isEmpty:
          computed(
            () =>
              !store.loading() &&
              store.comments().length === 0,
          ),

        topLevelComments:
          computed(
            () =>
              store
                .comments()
                .filter(
                  (comment) =>
                    !comment.parentCommentId,
                ),
          ),

        currentUser:
          computed(
            () =>
              authService.user(),
          ),

      }),
    ),


    // ==========================================================
    // METHODS
    // ==========================================================

    withMethods(
      (
        store,

        commentService =
          inject(
            CommunityCommentService,
          ),

        authService =
          inject(
            AuthService,
          ),
          logger = inject(LoggerService),

      ) => ({

        // ======================================================
        // LOAD COMMENTS
        // ======================================================

        async loadComments(
          postId: string,
        ): Promise<void> {

          const id =
            postId.trim();


          if (!id) {

            patchState(
              store,
              {
                comments: [],
                loading: false,
                error:
                  'Post ID is required.',
              },
            );

            return;
          }


          patchState(
            store,
            {
              loading: true,
              error: null,
            },
          );


          try {

            const result =
              await commentService
                .getComments(id);


            patchState(
              store,
              {
                comments:
                  result.comments,

                loading: false,

                error: null,
              },
            );

          } catch (error) {

            logger.error(
  'Failed to load community comments',
  error instanceof Error ? error.message : String(error),
);


            patchState(
              store,
              {
                comments: [],

                loading: false,

                error:
                  'Unable to load comments right now. Please try again later.',
              },
            );
          }
        },


        // ======================================================
        // ADD TOP-LEVEL COMMENT
        // ======================================================

        async addComment(
          postId: string,
          content: string,
        ): Promise<string | null> {

          return this.createComment(
            postId,
            content,
            null,
          );
        },


        // ======================================================
        // ADD REPLY
        // ======================================================

        async addReply(
          postId: string,
          parentCommentId: string,
          content: string,
        ): Promise<string | null> {

          const parentId =
            parentCommentId.trim();


          if (!parentId) {

            patchState(
              store,
              {
                error:
                  'Parent comment ID is required.',
              },
            );

            return null;
          }


          return this.createComment(
            postId,
            content,
            parentId,
          );
        },


        // ======================================================
        // CREATE COMMENT / REPLY
        // ======================================================

        async createComment(
          postId: string,
          content: string,
          parentCommentId:
            string | null,
        ): Promise<string | null> {

          const user =
            authService.user();


          if (!user) {

            patchState(
              store,
              {
                error:
                  'You must be signed in to comment.',
              },
            );

            return null;
          }


          const text =
            content.trim();


          if (!text) {

            patchState(
              store,
              {
                error:
                  'Comment cannot be empty.',
              },
            );

            return null;
          }


          if (text.length > 2000) {

            patchState(
              store,
              {
                error:
                  'Comment cannot exceed 2,000 characters.',
              },
            );

            return null;
          }


          if (!postId.trim()) {

            patchState(
              store,
              {
                error:
                  'Post ID is required.',
              },
            );

            return null;
          }


          if (parentCommentId) {

            const parentExists =
              store
                .comments()
                .some(
                  (comment) =>
                    comment.id ===
                    parentCommentId,
                );


            if (!parentExists) {

              patchState(
                store,
                {
                  error:
                    'The comment you are replying to could not be found.',
                },
              );

              return null;
            }
          }


          patchState(
            store,
            {
              saving: true,
              error: null,
            },
          );


          try {

            const commentId =
              await commentService
                .createComment({

                  postId:
                    postId.trim(),

                  parentCommentId,

                  authorId:
                    user.id,

                  author: {

                    id:
                      user.id,

                    displayName:
                      user.displayName ||
                      'Zebron Community Member',

                    photoUrl:
                      user.photoUrl ??
                      undefined,
                  },

                  content: text,
                });


            /*
             * Reload the comments after creation.
             *
             * This guarantees the UI receives the same
             * Firestore representation used by the rest
             * of the application.
             */
            await commentService
  .getComments(postId.trim())
  .then((result) => {
    patchState(store, {
      comments: result.comments,
      error: null,
    });
  });


            patchState(
              store,
              {
                saving: false,
                error: null,
              },
            );


            return commentId;

          } catch (error) {

            logger.error(
  'Failed to create community comment',
  error instanceof Error ? error.message : String(error),
);


            patchState(
              store,
              {
                saving: false,

                error:
                  error instanceof Error
                    ? error.message
                    : 'Unable to add your comment.',
              },
            );


            return null;
          }
        },


        // ======================================================
        // DELETE COMMENT
        // ======================================================

        async deleteComment(
          postId: string,
          commentId: string,
        ): Promise<boolean> {

          const user =
            authService.user();


          if (!user) {

            patchState(
              store,
              {
                error:
                  'You must be signed in to delete a comment.',
              },
            );

            return false;
          }


          const id =
            commentId.trim();


          if (!id) {

            patchState(
              store,
              {
                error:
                  'Comment ID is required.',
              },
            );

            return false;
          }


          const comment =
            store
              .comments()
              .find(
                (item) =>
                  item.id === id,
              );


          if (!comment) {

            patchState(
              store,
              {
                error:
                  'Comment could not be found.',
              },
            );

            return false;
          }


          /*
           * This client-side check improves the UX.
           *
           * Firestore security rules MUST also enforce
           * ownership. Client-side checks are not security.
           */
          if (
            comment.authorId !==
            user.id
          ) {

            patchState(
              store,
              {
                error:
                  'You can only delete your own comments.',
              },
            );

            return false;
          }


          patchState(
            store,
            {
              deleting: true,
              error: null,
            },
          );


          try {

            await commentService
              .deleteComment(
                postId,
                id,
              );


            /*
             * Remove the comment immediately from local
             * state rather than waiting for another request.
             */
            patchState(
              store,
              {
                comments:
                  store
                    .comments()
                    .filter(
                      (item) =>
                        item.id !== id,
                    ),

                deleting: false,

                error: null,
              },
            );


            return true;

          } catch (error) {

           logger.error(
  'Failed to delete community comment',
  error instanceof Error ? error.message : String(error),
);


            patchState(
              store,
              {
                deleting: false,

                error:
                  error instanceof Error
                    ? error.message
                    : 'Unable to delete the comment.',
              },
            );


            return false;
          }
        },


        // ======================================================
        // GET REPLIES
        // ======================================================

        getReplies(
          parentCommentId: string,
        ): CommunityComment[] {

          const parentId =
            parentCommentId.trim();


          if (!parentId) {
            return [];
          }


          return store
            .comments()
            .filter(
              (comment) =>
                comment.parentCommentId ===
                parentId,
            );
        },


        // ======================================================
        // GET REPLY COUNT
        // ======================================================

        getReplyCount(
          parentCommentId: string,
        ): number {

          const parentId =
            parentCommentId.trim();


          if (!parentId) {
            return 0;
          }


          return store
            .comments()
            .filter(
              (comment) =>
                comment.parentCommentId ===
                parentId,
            )
            .length;
        },


        // ======================================================
        // CLEAR
        // ======================================================

        clear(): void {

          patchState(
            store,
            {
              comments: [],

              loading: false,

              saving: false,

              deleting: false,

              error: null,
            },
          );
        },

      }),
    ),
  );


// =================================================================


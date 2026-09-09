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
import { LoggerService } from '../../../core/services/logger.service';

import {
  CommunityComment,
} from '../models/community-comment.model';

import {
  CommunityReactionType,
} from '../models/community-reaction.model';

import {
  CommunityCommentService,
} from '../services/community-comment.service';


// ================================================================
// STATE
// ================================================================

interface CommunityCommentState {

  comments: CommunityComment[];

  loading: boolean;

  saving: boolean;

  deleting: boolean;

  error: string | null;
}


// ================================================================
// INITIAL STATE
// ================================================================

const initialState: CommunityCommentState = {

  comments: [],

  loading: false,

  saving: false,

  deleting: false,

  error: null,
};


// ================================================================
// STORE
// ================================================================

export const CommunityCommentStore =
  signalStore(

    {
      providedIn: 'root',
    },


    // ============================================================
    // STATE
    // ============================================================

    withState(
      initialState,
    ),


    // ============================================================
    // COMPUTED STATE
    // ============================================================

    withComputed(
      (
        store,
        authService = inject(AuthService),
      ) => ({

        // --------------------------------------------------------
        // TOTAL COMMENT COUNT
        // --------------------------------------------------------

        commentCount:
          computed(
            () =>
              store.comments().length,
          ),


        // --------------------------------------------------------
        // EMPTY STATE
        // --------------------------------------------------------

        isEmpty:
          computed(
            () =>
              !store.loading() &&
              store.comments().length === 0,
          ),


        // --------------------------------------------------------
        // TOP LEVEL COMMENTS
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // CURRENT USER
        // --------------------------------------------------------

        currentUser:
          computed(
            () =>
              authService.user(),
          ),

      }),
    ),


    // ============================================================
    // METHODS
    // ============================================================

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

        logger =
          inject(
            LoggerService,
          ),

      ) => {


        // ========================================================
        // HYDRATE USER REACTIONS
        // ========================================================

        const hydrateUserReactions =
          async (
            comments: CommunityComment[],
          ): Promise<CommunityComment[]> => {

            const user =
              authService.user();


            // No authenticated user means
            // there is no personal reaction state
            // to hydrate.

            if (
              !user ||
              comments.length === 0
            ) {

              return comments;
            }


            return Promise.all(

              comments.map(
                async (
                  comment,
                ) => {

                  try {

                    const reaction =
                      await commentService
                        .getUserReaction(
                          comment.postId,
                          comment.id,
                          user.id,
                        );


                    return {

                      ...comment,

                      currentUserReaction:
                        reaction,

                    };

                  } catch (error) {

                    logger.error(
                      'CommunityCommentStore',
                      'Failed to load community comment reaction.',
                      {
                        commentId:
                          comment.id,

                        postId:
                          comment.postId,

                        userId:
                          user.id,

                        error:
                          error instanceof Error
                            ? error.message
                            : String(error),
                      },
                    );


                    return {

                      ...comment,

                      currentUserReaction:
                        null,

                    };
                  }
                },
              ),
            );
          };


        // ========================================================
        // RETURN STORE METHODS
        // ========================================================

        return {


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


              // --------------------------------------------------
              // Load each comment's reaction state for the
              // currently authenticated user.
              // --------------------------------------------------

              const hydratedComments =
                await hydrateUserReactions(
                  result.comments,
                );


              patchState(
                store,
                {

                  comments:
                    hydratedComments,

                  loading: false,

                  error: null,

                },
              );

            } catch (error) {

              logger.error(
                'CommunityCommentStore',
                'Failed to load community comments.',
                {

                  postId:
                    id,

                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),

                },
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
          // REACT TO COMMENT
          // ======================================================

          async reactToComment(
            postId: string,

            commentId: string,

            type:
              CommunityReactionType =
                'like',

          ): Promise<void> {

            const user =
              authService.user();


            // ----------------------------------------------------
            // AUTHENTICATION
            // ----------------------------------------------------

            if (!user) {

              patchState(
                store,
                {

                  error:
                    'You must be signed in to like a comment.',

                },
              );

              return;
            }


            const post =
              postId.trim();

            const commentIdValue =
              commentId.trim();


            // ----------------------------------------------------
            // VALIDATION
            // ----------------------------------------------------

            if (!post) {

              patchState(
                store,
                {

                  error:
                    'Post ID is required.',

                },
              );

              return;
            }


            if (!commentIdValue) {

              patchState(
                store,
                {

                  error:
                    'Comment ID is required.',

                },
              );

              return;
            }


            // ----------------------------------------------------
            // FIND COMMENT IN LOCAL STATE
            // ----------------------------------------------------

            const existingComment =
              store
                .comments()
                .find(
                  (comment) =>
                    comment.id ===
                    commentIdValue,
                );


            if (!existingComment) {

              patchState(
                store,
                {

                  error:
                    'Comment could not be found.',

                },
              );

              return;
            }


            // ----------------------------------------------------
            // REMEMBER PREVIOUS REACTION
            // ----------------------------------------------------

            const previousType =
              existingComment
                .currentUserReaction ??
              null;


            try {

              patchState(
                store,
                {

                  error: null,

                },
              );


              // --------------------------------------------------
              // Persist the reaction.
              //
              // The service returns:
              //
              //   'like' -> reaction now exists
              //   null   -> reaction was removed
              // --------------------------------------------------

              const resultingType =
                await commentService
                  .toggleReaction(
                    post,
                    commentIdValue,
                    user.id,
                    type,
                  );


              // --------------------------------------------------
              // Update aggregate counts locally.
              // --------------------------------------------------

              const reactionCounts = {

                ...(
                  existingComment
                    .reactionCounts ??
                  {}
                ),

              };


              // --------------------------------------------------
              // Remove previous reaction count.
              //
              // Example:
              //
              // previous = like
              // result   = null
              //
              // like count goes from 1 -> 0
              // --------------------------------------------------

              if (
                previousType &&
                previousType !==
                  resultingType
              ) {

                reactionCounts[
                  previousType
                ] =
                  Math.max(
                    0,

                    (
                      reactionCounts[
                        previousType
                      ] ??
                      0
                    ) - 1,
                  );
              }


              // --------------------------------------------------
              // Add new reaction count.
              //
              // Example:
              //
              // previous = null
              // result   = like
              //
              // like count goes from 0 -> 1
              // --------------------------------------------------

              if (
                resultingType &&
                previousType !==
                  resultingType
              ) {

                reactionCounts[
                  resultingType
                ] =
                  (
                    reactionCounts[
                      resultingType
                    ] ??
                    0
                  ) + 1;
              }


              // --------------------------------------------------
              // Update only the affected comment.
              // --------------------------------------------------

              patchState(
                store,
                {

                  comments:
                    store
                      .comments()
                      .map(
                        (comment) => {

                          if (
                            comment.id !==
                            commentIdValue
                          ) {

                            return comment;
                          }


                          return {

                            ...comment,

                            reactionCounts,

                            currentUserReaction:
                              resultingType,

                          };
                        },
                      ),

                  error: null,

                },
              );


              logger.info(
                'CommunityCommentStore',
                'Community comment reaction updated.',
                {

                  postId:
                    post,

                  commentId:
                    commentIdValue,

                  userId:
                    user.id,

                  reactionType:
                    resultingType,

                },
              );

            } catch (error) {

              logger.error(
                'CommunityCommentStore',
                'Failed to react to community comment.',
                {

                  postId:
                    post,

                  commentId:
                    commentIdValue,

                  userId:
                    user.id,

                  reactionType:
                    type,

                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),

                },
              );


              patchState(
                store,
                {

                  error:
                    error instanceof Error
                      ? error.message
                      : 'Unable to update your comment reaction.',

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


            if (
              text.length >
              2000
            ) {

              patchState(
                store,
                {

                  error:
                    'Comment cannot exceed 2,000 characters.',

                },
              );

              return null;
            }


            const post =
              postId.trim();


            if (!post) {

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
                      post,

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

                    content:
                      text,

                  });


              // --------------------------------------------------
              // Reload comments so the newly-created comment has
              // the same Firestore representation as every other
              // comment.
              // --------------------------------------------------

              const result =
                await commentService
                  .getComments(post);


              const hydratedComments =
                await hydrateUserReactions(
                  result.comments,
                );


              patchState(
                store,
                {

                  comments:
                    hydratedComments,

                  saving: false,

                  error: null,

                },
              );


              return commentId;

            } catch (error) {

              logger.error(
                'CommunityCommentStore',
                'Failed to create community comment.',
                {

                  postId:
                    post,

                  parentCommentId,

                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),

                },
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


            // ----------------------------------------------------
            // Client-side ownership check.
            //
            // Firestore rules MUST enforce this as well.
            // ----------------------------------------------------

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


              // --------------------------------------------------
              // Remove the comment from local state.
              // --------------------------------------------------

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
                'CommunityCommentStore',
                'Failed to delete community comment.',
                {

                  postId,

                  commentId:
                    id,

                  userId:
                    user.id,

                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),

                },
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

        };
      },
    ),
  );
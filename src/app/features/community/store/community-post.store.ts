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

import { CommunityPost } from '../models/community-post.model';
import {
  CommunityReactionType,
} from '../models/community-reaction.model';

import { CommunityPostService } from '../services/community-post.service';
import { CommunityReactionService } from '../services/community-reaction.service';

import { LoggerService } from '../../../core/services/logger.service';

interface CommunityPostState {
  post: CommunityPost | null;
  loading: boolean;
  error: string | null;
}

const initialState: CommunityPostState = {
  post: null,
  loading: false,
  error: null,
};

export const CommunityPostStore = signalStore(
  {
    providedIn: 'root',
  },

  withState(initialState),

  withComputed((store) => ({
    hasPost: computed(
      () => store.post() !== null,
    ),

    totalReactionCount: computed(() => {
      const counts =
        store.post()?.reactionCounts ?? {};

      return Object.values(counts)
        .reduce(
          (total, count) =>
            total + Number(count || 0),
          0,
        );
    }),
  })),

  withMethods(
    (
      store,
      postService = inject(CommunityPostService),
      reactionService = inject(CommunityReactionService),
      logger = inject(LoggerService),
    ) => ({

      // ============================================================
      // LOAD POST
      // ============================================================

      async loadPost(
        postId: string,
      ): Promise<void> {

        const id =
          postId.trim();

        if (!id) {

          patchState(store, {
            post: null,
            loading: false,
            error:
              'The requested post could not be found.',
          });

          return;
        }

        patchState(store, {
          loading: true,
          error: null,
        });

        try {

          const post =
            await postService.getPostById(
              id,
            );

          if (!post) {

            patchState(store, {
              post: null,
              loading: false,
              error:
                'This post no longer exists or is unavailable.',
            });

            return;
          }

          // --------------------------------------------------------
          // Hydrate the current user's reaction.
          // --------------------------------------------------------

          const currentUserReaction =
            post.currentUserReaction ?? null;

          patchState(store, {
            post: {
              ...post,
              currentUserReaction,
            },
            loading: false,
            error: null,
          });

        } catch (error) {

          logger.error(
            'CommunityPostStore',
            'Failed to load community post.',
            {
              postId: id,
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );

          patchState(store, {
            post: null,
            loading: false,
            error:
              'Unable to load this post right now. Please try again later.',
          });
        }
      },


      // ============================================================
      // REACT TO POST
      // ============================================================

      async reactToPost(
        postId: string,
        userId: string,
        type: CommunityReactionType,
      ): Promise<void> {

        const id =
          postId.trim();

        const authenticatedUserId =
          userId.trim();

        if (!id) {
          return;
        }

        if (!authenticatedUserId) {
          return;
        }

        const currentPost =
          store.post();

        if (!currentPost) {
          return;
        }

        if (currentPost.id !== id) {
          return;
        }

        try {

          // --------------------------------------------------------
          // Keep the previous reaction so the local reaction counts
          // can be updated without another Firestore read.
          // --------------------------------------------------------

          const previousType =
            currentPost.currentUserReaction ?? null;

          // --------------------------------------------------------
          // Persist the reaction.
          //
          // toggleReaction() returns:
          //   - the reaction type when applied
          //   - null when removed
          // --------------------------------------------------------

          const resultingType =
            await reactionService.toggleReaction(
              id,
              authenticatedUserId,
              type,
            );

          const reactionCounts = {
            ...(currentPost.reactionCounts ?? {}),
          };

          // --------------------------------------------------------
          // Remove the previous reaction count when:
          // - the user had a previous reaction
          // - the resulting reaction changed
          // --------------------------------------------------------

          if (
            previousType &&
            previousType !== resultingType
          ) {

            reactionCounts[previousType] =
              Math.max(
                0,
                (reactionCounts[previousType] ?? 0) - 1,
              );
          }

          // --------------------------------------------------------
          // Add the new reaction count when:
          // - a reaction now exists
          // - the reaction changed or was newly created
          // --------------------------------------------------------

          if (
            resultingType &&
            previousType !== resultingType
          ) {

            reactionCounts[resultingType] =
              (reactionCounts[resultingType] ?? 0) + 1;
          }

          patchState(store, {
            post: {
              ...currentPost,
              reactionCounts,
              currentUserReaction:
                resultingType,
            },
            error: null,
          });

        } catch (error) {

          logger.error(
            'CommunityPostStore',
            'Failed to react to community post.',
            {
              postId: id,
              userId: authenticatedUserId,
              reactionType: type,
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );

          patchState(store, {
            error:
              error instanceof Error
                ? error.message
                : 'Unable to update your reaction. Please try again.',
          });
        }
      },


      // ============================================================
      // CLEAR
      // ============================================================

      clear(): void {

        patchState(store, {
          post: null,
          loading: false,
          error: null,
        });
      },

    }),
  ),
);
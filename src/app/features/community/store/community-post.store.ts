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
import { CommunityPostService } from '../services/community-post.service';
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
      logger = inject(LoggerService),
    ) => ({

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

          patchState(store, {
            post,
            loading: false,
            error: null,
          });

        } catch (error) {

          logger.error(
  'Failed to load community post:',
  error instanceof Error ? error.message : String(error),
);

          patchState(store, {
            post: null,
            loading: false,
            error:
              'Unable to load this post right now. Please try again later.',
          });
        }
      },


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
import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  CommunityReaction,
  CommunityReactionType,
} from '../models/community-reaction.model';

import { CommunityReactionService } from '../services/community-reaction.service';

interface CommunityReactionState {
  reactions: Record<string, CommunityReaction | null>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: CommunityReactionState = {
  reactions: {},
  loading: {},
  errors: {},
};

export const CommunityReactionStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => ({
    hasAnyLoading: computed(() =>
      Object.values(store.loading()).some(Boolean),
    ),
  })),

  withMethods(
    (
      store,
      reactionService = inject(CommunityReactionService),
    ) => ({
      /**
       * Get the current reaction for a post.
       */
      getReaction(
        postId: string,
      ): CommunityReaction | null {
        return store.reactions()[postId] ?? null;
      },

      /**
       * Get the current reaction type for a post.
       */
      getReactionType(
        postId: string,
      ): CommunityReactionType | null {
        return (
          store.reactions()[postId]?.type ??
          null
        );
      },

      /**
       * Determine whether a reaction request is
       * currently being processed.
       */
      isLoading(postId: string): boolean {
        return store.loading()[postId] ?? false;
      },

      /**
       * Return the current error for a post.
       */
      getError(postId: string): string | null {
        return store.errors()[postId] ?? null;
      },

      /**
       * Load the current user's reaction.
       */
      async loadReaction(
        postId: string,
        userId: string,
      ): Promise<void> {
        patchState(store, {
          loading: {
            ...store.loading(),
            [postId]: true,
          },
          errors: {
            ...store.errors(),
            [postId]: null,
          },
        });

        try {
          const reaction =
            await reactionService.getUserReaction(
              postId,
              userId,
            );

          patchState(store, {
            reactions: {
              ...store.reactions(),
              [postId]: reaction,
            },
          });
        } catch (error) {
          patchState(store, {
            errors: {
              ...store.errors(),
              [postId]:
                error instanceof Error
                  ? error.message
                  : 'Unable to load reaction.',
            },
          });
        } finally {
          patchState(store, {
            loading: {
              ...store.loading(),
              [postId]: false,
            },
          });
        }
      },

      /**
       * Toggle a reaction.
       *
       * If the requested reaction is already active,
       * it is removed.
       *
       * If another reaction is active, it is replaced.
       */
      async toggleReaction(
        postId: string,
        userId: string,
        type: CommunityReactionType,
      ): Promise<void> {
        patchState(store, {
          loading: {
            ...store.loading(),
            [postId]: true,
          },
          errors: {
            ...store.errors(),
            [postId]: null,
          },
        });

        try {
          const resultingType =
            await reactionService.toggleReaction(
              postId,
              userId,
              type,
            );

          const currentReaction =
            store.reactions()[postId];

          if (resultingType === null) {
            patchState(store, {
              reactions: {
                ...store.reactions(),
                [postId]: null,
              },
            });
          } else {
            patchState(store, {
              reactions: {
                ...store.reactions(),
                [postId]: {
                  id: userId,
                  postId,
                  userId,
                  type: resultingType,
                  createdAt:
                    currentReaction?.createdAt,
                },
              },
            });
          }
        } catch (error) {
          patchState(store, {
            errors: {
              ...store.errors(),
              [postId]:
                error instanceof Error
                  ? error.message
                  : 'Unable to update reaction.',
            },
          });
        } finally {
          patchState(store, {
            loading: {
              ...store.loading(),
              [postId]: false,
            },
          });
        }
      },

      /**
       * Explicitly remove a reaction.
       */
      async removeReaction(
        postId: string,
        userId: string,
      ): Promise<void> {
        patchState(store, {
          loading: {
            ...store.loading(),
            [postId]: true,
          },
          errors: {
            ...store.errors(),
            [postId]: null,
          },
        });

        try {
          await reactionService.removeReaction(
            postId,
            userId,
          );

          patchState(store, {
            reactions: {
              ...store.reactions(),
              [postId]: null,
            },
          });
        } catch (error) {
          patchState(store, {
            errors: {
              ...store.errors(),
              [postId]:
                error instanceof Error
                  ? error.message
                  : 'Unable to remove reaction.',
            },
          });
        } finally {
          patchState(store, {
            loading: {
              ...store.loading(),
              [postId]: false,
            },
          });
        }
      },

      /**
       * Clear the local reaction state for a post.
       */
      clearReaction(postId: string): void {
        const reactions = {
          ...store.reactions(),
        };

        delete reactions[postId];

        const errors = {
          ...store.errors(),
        };

        delete errors[postId];

        const loading = {
          ...store.loading(),
        };

        delete loading[postId];

        patchState(store, {
          reactions,
          errors,
          loading,
        });
      },
    }),
  ),
);
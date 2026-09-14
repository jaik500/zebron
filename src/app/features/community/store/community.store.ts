import { computed, inject } from '@angular/core';

import {
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../../core/services/auth.service';

import {
  CommunityPost,
  CommunityPostAuthor,
} from '../models/community-post.model';

import { CommunityTopic } from '../models/community-topic.model';

import { CommunityPostService } from '../services/community-post.service';
import { CommunityTopicService } from '../services/community-topic.service';

import { CommunityReactionService } from '../services/community-reaction.service';
import { CommunityReactionType } from '../models/community-reaction.model';

import { LoggerService } from '../../../core/services/logger.service';

import { CommunityBookmarkService } from '../services/community-bookmark.service';
import { CommunitySortMode, CommunityFeedMode } from '../models/community-feed.model';

// ============================================================
// TYPES
// ============================================================




// ============================================================
// STATE
// ============================================================

interface CommunityState {

  // ----------------------------------------------------------
  // Feed
  // ----------------------------------------------------------

  posts: CommunityPost[];

  /**
   * Controls the high-level Community feed being displayed.
   *
   * Home, Trending, Following, and Saved are intentionally
   * represented separately from topic selection so that a user
   * can eventually combine feed modes with other filters where
   * appropriate.
   */
  feedMode: CommunityFeedMode;


  // ----------------------------------------------------------
  // Topics
  // ----------------------------------------------------------

  topics: CommunityTopic[];


  // ----------------------------------------------------------
  // Active filters
  // ----------------------------------------------------------

  selectedTopicId: string | null;

  searchTerm: string;

  sortMode: CommunitySortMode;


  // ----------------------------------------------------------
  // Loading states
  // ----------------------------------------------------------

  loading: boolean;

  loadingMore: boolean;

  refreshing: boolean;


  // ----------------------------------------------------------
  // Error
  // ----------------------------------------------------------

  error: string | null;


  // ----------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------

  hasMore: boolean;

  lastDocument:
    DocumentSnapshot<DocumentData> | null;

}


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: CommunityState = {

  // Feed
  posts: [],

  feedMode: 'home',


  // Topics
  topics: [],


  // Filters
  selectedTopicId: null,

  searchTerm: '',

  sortMode: 'latest',


  // Loading
  loading: false,

  loadingMore: false,

  refreshing: false,


  // Error
  error: null,


  // Pagination
  hasMore: true,

  lastDocument: null,

};


// ============================================================
// COMMUNITY STORE
// ============================================================

export const CommunityStore = signalStore(

  {
    providedIn: 'root',
  },


  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),


  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed((store) => {

    const authService =
      inject(AuthService);


    // --------------------------------------------------------
    // Filtered posts
    // --------------------------------------------------------

    const filteredPosts =
      computed(() => {

        const posts =
          store.posts();

        const searchTerm =
          store
            .searchTerm()
            .trim()
            .toLowerCase();


        if (!searchTerm) {
          return posts;
        }


        return posts.filter((post) => {

          const title =
            post.title?.toLowerCase() ?? '';

          const content =
            post.content?.toLowerCase() ?? '';

          const topicName =
            post.topicName?.toLowerCase() ?? '';

          const tags =
            post.tags
              ?.join(' ')
              .toLowerCase() ?? '';


          return (
            title.includes(searchTerm) ||
            content.includes(searchTerm) ||
            topicName.includes(searchTerm) ||
            tags.includes(searchTerm)
          );

        });

      });


    // --------------------------------------------------------
    // Selected topic
    // --------------------------------------------------------

    const selectedTopic =
      computed(() => {

        const topicId =
          store.selectedTopicId();


        if (!topicId) {
          return null;
        }


        return (
          store
            .topics()
            .find(
              (topic) =>
                topic.id === topicId,
            ) ?? null
        );

      });


    // --------------------------------------------------------
    // Active filters
    // --------------------------------------------------------

    const hasActiveFilters =
      computed(() => {

        return (
          !!store.selectedTopicId() ||
          !!store.searchTerm().trim() ||
          store.sortMode() !== 'latest' ||
          store.feedMode() !== 'home'
        );

      });


    // --------------------------------------------------------
    // Current user
    // --------------------------------------------------------

    const currentUser =
      computed(() => {

        return authService.user();

      });


    // --------------------------------------------------------
    // Post count
    // --------------------------------------------------------

    const postCount =
      computed(() => {

        const posts =
          store.posts();

        const searchTerm =
          store
            .searchTerm()
            .trim()
            .toLowerCase();


        if (!searchTerm) {
          return posts.length;
        }


        return posts.filter((post) => {

          const title =
            post.title?.toLowerCase() ?? '';

          const content =
            post.content?.toLowerCase() ?? '';

          const topicName =
            post.topicName?.toLowerCase() ?? '';

          const tags =
            post.tags
              ?.join(' ')
              .toLowerCase() ?? '';


          return (
            title.includes(searchTerm) ||
            content.includes(searchTerm) ||
            topicName.includes(searchTerm) ||
            tags.includes(searchTerm)
          );

        }).length;

      });


    // --------------------------------------------------------
    // Empty state
    // --------------------------------------------------------

    const isEmpty =
      computed(() => {

        return (
          !store.loading() &&
          !store.loadingMore() &&
          postCount() === 0
        );

      });


    return {

      filteredPosts,

      selectedTopic,

      hasActiveFilters,

      currentUser,

      postCount,

      isEmpty,

    };

  }),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods((store) => {

    const authService =
      inject(AuthService);

    const postService =
      inject(CommunityPostService);

    const topicService =
      inject(CommunityTopicService);

    const reactionService =
      inject(CommunityReactionService);

    const logger =
      inject(LoggerService);

    const bookmarkService =
      inject(CommunityBookmarkService);


    // ========================================================
    // HYDRATE REACTION STATE
    // ========================================================

    const hydrateReactionState = async (
      posts: CommunityPost[],
      userId: string | null,
    ): Promise<CommunityPost[]> => {

      if (
        !userId ||
        posts.length === 0
      ) {
        return posts;
      }


      try {

        const hydratedPosts =
          await Promise.all(

            posts.map(
              async (post) => {

                try {

                  const reaction =
                    await reactionService
                      .getUserReaction(
                        post.id,
                        userId,
                      );


                  return {

                    ...post,

                    currentUserReaction:
                      reaction?.type ?? null,

                  };

                } catch (error) {

                  logger.error(
                    'CommunityStore',
                    'Failed to load reaction for community post.',
                    {
                      postId:
                        post.id,

                      userId,

                      error:
                        error instanceof Error
                          ? error.message
                          : String(error),
                    },
                  );


                  return {

                    ...post,

                    currentUserReaction:
                      null,

                  };

                }

              },
            ),

          );


        return hydratedPosts;

      } catch (error) {

        logger.error(
          'CommunityStore',
          'Failed to hydrate community reaction state.',
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );


        return posts;

      }

    };


    // ========================================================
    // HYDRATE BOOKMARK STATE
    // ========================================================

    const hydrateBookmarks = async (
      posts: CommunityPost[],
      userId: string | null,
    ): Promise<CommunityPost[]> => {

      if (
        !userId ||
        posts.length === 0
      ) {
        return posts;
      }


      const hydratedPosts =
        await Promise.all(

          posts.map(
            async (post) => {

              try {

                const bookmarked =
                  await bookmarkService
                    .isBookmarked(
                      post.id,
                      userId,
                    );


                return {

                  ...post,

                  bookmarkedByCurrentUser:
                    bookmarked,

                };

              } catch (error) {

                logger.error(
                  'CommunityStore',
                  'Failed to load bookmark state for community post.',
                  {
                    postId:
                      post.id,

                    userId,

                    error:
                      error instanceof Error
                        ? error.message
                        : String(error),
                  },
                );


                // Do not prevent the feed from
                // loading if bookmark hydration fails.
                return {

                  ...post,

                  bookmarkedByCurrentUser:
                    false,

                };

              }

            },
          ),

        );


      return hydratedPosts;

    };


    // ========================================================
    // HYDRATE VIEWER STATE
    // ========================================================

    /**
     * Applies all current-user-specific state to a collection
     * of posts.
     *
     * This keeps initial loading, topic selection, pagination,
     * refresh behavior, and Trending behavior consistent.
     */
    const hydrateViewerState = async (
      posts: CommunityPost[],
      userId: string | null,
    ): Promise<CommunityPost[]> => {

      const postsWithReactions =
        await hydrateReactionState(
          posts,
          userId,
        );


      return hydrateBookmarks(
        postsWithReactions,
        userId,
      );

    };


    // ========================================================
    // LOAD INITIAL DATA
    // ========================================================

    const loadInitialData =
      async (): Promise<void> => {

        patchState(store, {

          loading: true,

          error: null,

        });


        try {

          const currentFeedMode =
            store.feedMode();

          const currentSortMode =
            currentFeedMode === 'trending'
              ? 'trending'
              : store.sortMode();


          const [
            topics,
            postPage,
          ] = await Promise.all([

            topicService
              .getActiveTopics(),


            postService.getPosts({

              topicId:
                store.selectedTopicId(),

              sortMode:
                currentSortMode,

            }),

          ]);


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              postPage.posts,
              userId,
            );


          patchState(store, {

            topics,

            posts:
              hydratedPosts,

            lastDocument:
              postPage.lastDocument,

            hasMore:
              postPage.hasMore,

            error:
              null,

            loading:
              false,

          });


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to load community data.',
            {
              feedMode:
                store.feedMode(),

              sortMode:
                store.sortMode(),

              topicId:
                store.selectedTopicId(),

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading: false,

            error:
              'Unable to load the community right now. Please try again.',

          });

        }

      };


    // ========================================================
    // LOAD MORE POSTS
    // ========================================================

    const loadMore =
      async (): Promise<void> => {

        if (

          store.loading() ||

          store.loadingMore() ||

          !store.hasMore()

        ) {

          return;

        }


        patchState(store, {

          loadingMore: true,

          error: null,

        });


        try {

          const currentFeedMode =
            store.feedMode();

          const currentSortMode =
            currentFeedMode === 'trending'
              ? 'trending'
              : store.sortMode();


          const postPage =
            await postService.getPosts({

              topicId:
                store.selectedTopicId(),

              sortMode:
                currentSortMode,

              lastDocument:
                store.lastDocument(),

            });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              postPage.posts,
              userId,
            );


          patchState(store, {

            posts: [

              ...store.posts(),

              ...hydratedPosts,

            ],


            lastDocument:
              postPage.lastDocument,


            hasMore:
              postPage.hasMore,


            loadingMore:
              false,


            error:
              null,

          });


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to load more community posts.',
            {
              feedMode:
                store.feedMode(),

              sortMode:
                store.sortMode(),

              topicId:
                store.selectedTopicId(),

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loadingMore:
              false,

            error:
              error instanceof Error
                ? error.message
                : 'Unable to load more community posts.',

          });

        }

      };


    // ========================================================
    // REFRESH
    // ========================================================

    const refresh =
      async (): Promise<void> => {

        patchState(store, {

          refreshing: true,

          error: null,

        });


        try {

          const currentFeedMode =
            store.feedMode();

          const currentSortMode =
            currentFeedMode === 'trending'
              ? 'trending'
              : store.sortMode();


          const postPage =
            await postService.getPosts({

              topicId:
                store.selectedTopicId(),

              sortMode:
                currentSortMode,

          });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              postPage.posts,
              userId,
            );


          patchState(store, {

            posts:
              hydratedPosts,

            lastDocument:
              postPage.lastDocument,

            hasMore:
              postPage.hasMore,

            refreshing:
              false,

            error:
              null,

          });


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to refresh community posts.',
            {
              feedMode:
                store.feedMode(),

              sortMode:
                store.sortMode(),

              topicId:
                store.selectedTopicId(),

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            refreshing:
              false,

            error:
              error instanceof Error
                ? error.message
                : 'Unable to refresh the community right now.',

          });

        }

      };


    // ========================================================
    // FEED MODE
    // ========================================================

    /**
     * Changes the high-level Community feed.
     *
     * Trending uses the existing post sorting infrastructure
     * with the `trending` sort mode.
     *
     * Following and Saved are intentionally reserved for their
     * own implementations later.
     */
    const selectFeedMode =
      async (
        mode: CommunityFeedMode,
      ): Promise<void> => {

        if (
          store.feedMode() === mode
        ) {

          return;

        }


        // ------------------------------------------------------
        // Following and Saved are not implemented yet.
        // Keep the state model ready for them without silently
        // pretending they work.
        // ------------------------------------------------------

        if (
          mode === 'following' ||
          mode === 'saved'
        ) {

          logger.info(
            'CommunityStore',
            'Community feed mode selected but implementation is not yet available.',
            {
              feedMode:
                mode,
            },
          );


          return;

        }


        const sortMode:
          CommunitySortMode =
          mode === 'trending'
            ? 'trending'
            : 'latest';


        patchState(store, {

          feedMode:
            mode,

          sortMode,

          selectedTopicId:
            null,

          posts:
            [],

          lastDocument:
            null,

          hasMore:
            true,

          error:
            null,

          loading:
            true,

        });


        try {

          const postPage =
            await postService.getPosts({

              topicId:
                null,

              sortMode,

            });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              postPage.posts,
              userId,
            );


          patchState(store, {

            posts:
              hydratedPosts,

            lastDocument:
              postPage.lastDocument,

            hasMore:
              postPage.hasMore,

            loading:
              false,

            error:
              null,

          });


          logger.info(
            'CommunityStore',
            'Community feed mode selected.',
            {
              feedMode:
                mode,

              sortMode,

              postCount:
                hydratedPosts.length,
            },
          );


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to load selected community feed.',
            {
              feedMode:
                mode,

              sortMode,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading:
              false,

            error:
              mode === 'trending'
                ? 'Unable to load trending posts right now. Please try again.'
                : 'Unable to load the community feed right now. Please try again.',

          });

        }

      };


    // ========================================================
    // REACTIONS
    // ========================================================

    const reactToPost = async (
      postId: string,
      userId: string,
      type: CommunityReactionType,
    ): Promise<void> => {

      if (!postId.trim()) {
        return;
      }


      if (!userId.trim()) {
        return;
      }


      try {

        const previousPost =
          store
            .posts()
            .find(
              (post) =>
                post.id === postId,
            );


        if (!previousPost) {
          return;
        }


        const previousType =
          previousPost.currentUserReaction ??
          null;


        const resultingType =
          await reactionService
            .toggleReaction(
              postId,
              userId,
              type,
            );


        const updatedPosts =
          store
            .posts()
            .map((post) => {

              if (
                post.id !== postId
              ) {

                return post;

              }


              const reactionCounts = {

                ...(post.reactionCounts ?? {}),

              };


              // Remove the previous reaction count.
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
                      ] ?? 0

                    ) - 1,

                  );

              }


              // Add the new reaction count.
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
                    ] ?? 0

                  ) + 1;

              }


              return {

                ...post,

                reactionCounts,

                currentUserReaction:
                  resultingType,

              };

            });


        patchState(store, {

          posts:
            updatedPosts,

          error:
            null,

        });


      } catch (error) {

        logger.error(
          'CommunityStore',
          'Failed to react to community post.',
          {
            postId,

            userId,

            reactionType:
              type,

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

    };


    // ========================================================
    // SELECT TOPIC
    // ========================================================

    const selectTopic =
      async (
        topicId: string | null,
      ): Promise<void> => {

        const normalizedTopicId =
          topicId?.trim() || null;


        patchState(store, {

          selectedTopicId:
            normalizedTopicId,

          feedMode:
            'home',

          sortMode:
            'latest',

          posts:
            [],

          lastDocument:
            null,

          hasMore:
            true,

          error:
            null,

          loading:
            true,

        });


        try {

          const page =
            await postService.getPosts({

              topicId:
                normalizedTopicId,

              sortMode:
                'latest',

            });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          // IMPORTANT:
          // Topic changes must hydrate the same
          // viewer-specific state as initial loading.
          const hydratedPosts =
            await hydrateViewerState(
              page.posts,
              userId,
            );


          patchState(store, {

            posts:
              hydratedPosts,

            lastDocument:
              page.lastDocument,

            hasMore:
              page.hasMore,

            loading:
              false,

            error:
              null,

          });


          logger.info(
            'CommunityStore',
            'Community topic selected.',
            {
              topicId:
                normalizedTopicId,

              postCount:
                hydratedPosts.length,
            },
          );


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to select community topic.',
            {
              topicId:
                normalizedTopicId,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading:
              false,

            error:
              'Unable to load posts for this topic. Please try again.',

          });

        }

      };


    // ========================================================
    // CREATE POST
    // ========================================================

    const createPost =
      async (input: {

        title: string;

        content: string;

        topicId: string;

        topicName?: string;

        tags?: string[];

        authorId: string;

        author: CommunityPostAuthor;

      }): Promise<string | null> => {

        const currentUser =
          store.currentUser();


        if (!currentUser) {

          patchState(store, {

            error:
              'You must be signed in to create a post.',

          });


          return null;

        }


        // ------------------------------------------------------
        // Validate input
        // ------------------------------------------------------

        const title =
          input.title.trim();

        const content =
          input.content.trim();

        const topicId =
          input.topicId.trim();


        if (!title) {

          patchState(store, {

            error:
              'A post title is required.',

          });


          return null;

        }


        if (!content) {

          patchState(store, {

            error:
              'Post content is required.',

          });


          return null;

        }


        if (!topicId) {

          patchState(store, {

            error:
              'Please select a topic.',

          });


          return null;

        }


        // ------------------------------------------------------
        // Begin save
        // ------------------------------------------------------

        patchState(store, {

          loading:
            true,

          error:
            null,

        });


        try {

          const postId =
            await postService.createPost({

              authorId:
                input.authorId,

              author:
                input.author,

              topicId,

              topicName:
                input.topicName,

              title,

              content,

              tags:
                input.tags ?? [],

            });


          // The post was successfully written.
          patchState(store, {

            loading:
              false,

            error:
              null,

          });


          // Refresh the feed separately.
          // If the refresh fails, the post still exists.
          try {

            await loadInitialData();

          } catch (refreshError) {

            logger.error(
              'CommunityStore',
              'Post created, but community feed refresh failed.',
              {
                postId,

                error:
                  refreshError instanceof Error
                    ? refreshError.message
                    : String(refreshError),
              },
            );

          }


          return postId;

        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to create community post.',
            {
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading:
              false,

            error:
              error instanceof Error
                ? error.message
                : 'Unable to create your post. Please try again.',

          });


          return null;

        }

      };


    // ========================================================
    // UPDATE COMMENT COUNT
    // ========================================================

    const updatePostCommentCount =
      (
        postId: string,
        delta: number,
      ): void => {

        const id =
          postId.trim();


        if (

          !id ||

          !Number.isFinite(delta)

        ) {

          return;

        }


        patchState(store, {

          posts:
            store
              .posts()
              .map((post) => {

                if (
                  post.id !== id
                ) {

                  return post;

                }


                return {

                  ...post,

                  commentCount:
                    Math.max(

                      0,

                      (post.commentCount ?? 0) +
                        delta,

                    ),

                };

              }),

        });

      };


    // ========================================================
    // SEARCH
    // ========================================================

    const setSearchTerm =
      (
        searchTerm: string,
      ): void => {

        patchState(store, {

          searchTerm,

        });

      };


    // ========================================================
    // BOOKMARKS
    // ========================================================

    const toggleBookmark =
      async (
        postId: string,
      ): Promise<void> => {

        const id =
          postId.trim();


        if (!id) {
          return;
        }


        const currentUser =
          store.currentUser();


        if (!currentUser) {

          patchState(store, {

            error:
              'You must be signed in to save a post.',

          });


          return;

        }


        try {

          const bookmarked =
            await bookmarkService
              .toggleBookmark(
                id,
                currentUser.id,
              );


          patchState(store, {

            posts:
              store
                .posts()
                .map((post) =>

                  post.id === id

                    ? {

                        ...post,

                        bookmarkedByCurrentUser:
                          bookmarked,

                      }

                    : post,

                ),

            error:
              null,

          });


          logger.info(
            'CommunityStore',
            'Community post bookmark updated.',
            {
              postId:
                id,

              userId:
                currentUser.id,

              bookmarked,
            },
          );


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to update community post bookmark.',
            {
              postId:
                id,

              userId:
                currentUser.id,

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
                : 'Unable to save the post. Please try again.',

          });

        }

      };


    // ========================================================
    // SORT
    // ========================================================

    const setSortMode =
      async (
        sortMode: CommunitySortMode,
      ): Promise<void> => {

        patchState(store, {

          sortMode,

          feedMode:
            sortMode === 'trending'
              ? 'trending'
              : 'home',

          posts:
            [],

          lastDocument:
            null,

          hasMore:
            true,

          error:
            null,

          loading:
            true,

        });


        try {

          const page =
            await postService.getPosts({

              topicId:
                store.selectedTopicId(),

              sortMode,

            });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              page.posts,
              userId,
            );


          patchState(store, {

            posts:
              hydratedPosts,

            lastDocument:
              page.lastDocument,

            hasMore:
              page.hasMore,

            loading:
              false,

            error:
              null,

          });


          logger.info(
            'CommunityStore',
            'Community sort mode updated.',
            {
              sortMode,

              postCount:
                hydratedPosts.length,
            },
          );


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to update community sort mode.',
            {
              sortMode,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading:
              false,

            error:
              sortMode === 'trending'
                ? 'Unable to load trending posts right now. Please try again.'
                : 'Unable to update the community feed. Please try again.',

          });

        }

      };


    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    const clearFilters =
      async (): Promise<void> => {

        patchState(store, {

          searchTerm:
            '',

          sortMode:
            'latest',

          feedMode:
            'home',

          selectedTopicId:
            null,

          posts:
            [],

          lastDocument:
            null,

          hasMore:
            true,

          error:
            null,

          loading:
            true,

        });


        try {

          const page =
            await postService.getPosts({

              topicId:
                null,

              sortMode:
                'latest',

            });


          const currentUser =
            authService.user();


          const userId =
            currentUser?.id ?? null;


          const hydratedPosts =
            await hydrateViewerState(
              page.posts,
              userId,
            );


          patchState(store, {

            posts:
              hydratedPosts,

            lastDocument:
              page.lastDocument,

            hasMore:
              page.hasMore,

            loading:
              false,

            error:
              null,

          });


        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to clear community filters.',
            {
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );


          patchState(store, {

            loading:
              false,

            error:
              'Unable to reset the community feed. Please try again.',

          });

        }

      };


    // ========================================================
    // PUBLIC METHODS
    // ========================================================

    return {

      loadInitialData,

      loadMore,

      refresh,

      selectFeedMode,

      reactToPost,

      selectTopic,

      setSearchTerm,

      setSortMode,

      clearFilters,

      createPost,

      updatePostCommentCount,

      toggleBookmark,

    };

  }),

);
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
import { CommunityFollowService } from '../services/community-follow.service';



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

  /**
 * User IDs followed by the current user.
 *
 * Used by the Following feed.
 */
followingUserIds: string[];


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

    followingCursors: Record<
  string,
  DocumentSnapshot<DocumentData> | null
>;

savedCursor:
    DocumentSnapshot<DocumentData> | null;

}


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: CommunityState = {

  // Feed
  posts: [],

  feedMode: 'home',

  followingUserIds: [],


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

  followingCursors: {},

  savedCursor: null,

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

    const followService =
      inject(CommunityFollowService);

  


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
    // GET FOLLOWING USER IDS
    // ========================================================

    /**
     * Returns the IDs of users followed by the current user.
     *
     * The FollowService owns the relationship data. The Store
     * only converts that relationship into feed state.
     */
    const getFollowingUserIds =
      async (): Promise<string[]> => {

        const currentUser =
          authService.user();

        if (!currentUser?.id) {
          return [];
        }

        try {

          const following =
            await followService.getFollowing(
              currentUser.id,
            );

          return following
            .map(
              (follow) =>
                follow.followingId,
            )
            .filter(
              (id): id is string =>
                !!id?.trim(),
            );

        } catch (error) {

          logger.error(
            'CommunityStore',
            'Failed to load followed community users.',
            {
              userId:
                currentUser.id,

              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );

          throw error;
        }
      };


    // ========================================================
    // LOAD FOLLOWING PAGE
    // ========================================================

    /**
     * Loads one page of posts authored by users followed by
     * the current user.
     *
     * Following uses per-author cursors because the post service
     * merges multiple author queries into one chronological feed.
     */
    const loadFollowingPage =
      async (
        followingCursors:
          Record<
            string,
            DocumentSnapshot<DocumentData> | null
          > = {},
      ) => {

        const authorIds =
          await getFollowingUserIds();

        if (authorIds.length === 0) {
          return {
            authorIds,
            page: null,
          };
        }

        const page =
          await postService.getPosts({
            topicId: null,
            sortMode: 'latest',
            authorIds,
            followingCursors,
          });

        return {
          authorIds,
          page,
        };
      };


    // ========================================================
    // LOAD SAVED PAGE
    // ========================================================

    /**
     * Loads one page of saved posts. Bookmark documents own the
     * Saved feed ordering and cursor; post service resolves the
     * referenced IDs into visible Community posts.
     */
    const loadSavedPage =
      async (
        savedCursor:
          DocumentSnapshot<DocumentData> | null = null,
      ) => {

        const currentUser =
          authService.user();

        if (!currentUser?.id) {
          return {
            bookmarkPage: null,
            posts: [],
          };
        }

        const bookmarkPage =
          await bookmarkService
            .getSavedPostIds(
              currentUser.id,
              savedCursor,
            );

        const posts =
          await postService.getPostsByIds(
            bookmarkPage.postIds,
          );

        return {
          bookmarkPage,
          posts,
        };
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

          const topics =
            await topicService.getActiveTopics();

          // --------------------------------------------------------
          // SAVED
          // --------------------------------------------------------

          if (currentFeedMode === 'saved') {

            const currentUser =
              authService.user();

            if (!currentUser) {

              patchState(store, {
                topics,
                posts: [],
                followingUserIds: [],
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                error:
                  'You must be signed in to view your saved posts.',
                loading: false,
              });

              return;
            }

            const savedResult =
              await loadSavedPage(null);

            if (!savedResult.bookmarkPage) {

              patchState(store, {
                topics,
                posts: [],
                followingUserIds: [],
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                error: null,
                loading: false,
              });

              return;
            }

            const hydratedPosts =
              await hydrateViewerState(
                savedResult.posts,
                currentUser.id,
              );

            patchState(store, {
              topics,
              posts: hydratedPosts,
              followingUserIds: [],
              lastDocument: null,
              followingCursors: {},
              savedCursor:
                savedResult.bookmarkPage.lastDocument,
              hasMore:
                savedResult.bookmarkPage.hasMore,
              error: null,
              loading: false,
            });

            logger.info(
              'CommunityStore',
              'Saved feed loaded.',
              {
                userId: currentUser.id,
                postCount: hydratedPosts.length,
                hasMore:
                  savedResult.bookmarkPage.hasMore,
              },
            );

            return;
          }

          // --------------------------------------------------------
          // FOLLOWING
          // --------------------------------------------------------

          let postPage:
            Awaited<
              ReturnType<
                CommunityPostService['getPosts']
              >
            >;

          let followingUserIds:
            string[] = [];

          if (currentFeedMode === 'following') {

            const followingResult =
              await loadFollowingPage({});

            followingUserIds =
              followingResult.authorIds;

            if (!followingResult.page) {

              patchState(store, {
                topics,
                posts: [],
                followingUserIds,
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                error: null,
                loading: false,
              });

              logger.info(
                'CommunityStore',
                'Following feed loaded with no followed users.',
                {
                  userId:
                    authService.user()?.id ?? null,
                },
              );

              return;
            }

            postPage =
              followingResult.page;

          } else {

            postPage =
              await postService.getPosts({
                topicId:
                  store.selectedTopicId(),
                sortMode:
                  currentSortMode,
              });
          }

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
            posts: hydratedPosts,
            followingUserIds,
            lastDocument:
              postPage.lastDocument,
            followingCursors:
              currentFeedMode === 'following'
                ? postPage.followingCursors ?? {}
                : {},
            savedCursor: null,
            hasMore: postPage.hasMore,
            error: null,
            loading: false,
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
              store.feedMode() === 'following'
                ? 'Unable to load your following feed right now. Please try again.'
                : store.feedMode() === 'saved'
                  ? 'Unable to load your saved posts right now. Please try again.'
                  : 'Unable to load the community right now. Please try again.',
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

          let postPage:
            Awaited<
              ReturnType<
                CommunityPostService['getPosts']
              >
            >;

          let followingUserIds:
            string[] | undefined;

          if (currentFeedMode === 'saved') {

            const savedResult =
              await loadSavedPage(
                store.savedCursor(),
              );

            if (!savedResult.bookmarkPage) {

              patchState(store, {
                loadingMore: false,
                hasMore: false,
                error:
                  'You must be signed in to load more saved posts.',
              });

              return;
            }

            const hydratedPosts =
              await hydrateViewerState(
                savedResult.posts,
                authService.user()?.id ?? null,
              );

            patchState(store, {
              posts: [
                ...store.posts(),
                ...hydratedPosts,
              ],
              lastDocument: null,
              followingCursors: {},
              savedCursor:
                savedResult.bookmarkPage.lastDocument,
              hasMore:
                savedResult.bookmarkPage.hasMore,
              loadingMore: false,
              error: null,
            });

            return;

          } else if (currentFeedMode === 'following') {

            const followingResult =
              await loadFollowingPage(
                store.followingCursors(),
              );

            followingUserIds =
              followingResult.authorIds;

            if (!followingResult.page) {

              patchState(store, {
                followingUserIds,
                loadingMore: false,
                hasMore: false,
                error: null,
              });

              return;
            }

            postPage =
              followingResult.page;

          } else {

            postPage =
              await postService.getPosts({
                topicId:
                  store.selectedTopicId(),

                sortMode:
                  currentSortMode,

                lastDocument:
                  store.lastDocument(),
              });
          }

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

            followingUserIds:
              followingUserIds ??
              store.followingUserIds(),

            lastDocument:
              postPage.lastDocument,

            followingCursors:
              currentFeedMode === 'following'
                ? postPage.followingCursors ??
                  store.followingCursors()
                : {},

            hasMore:
              postPage.hasMore,

            loadingMore: false,

            error: null,
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
            loadingMore: false,

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

          // --------------------------------------------------------
          // SAVED
          // --------------------------------------------------------

          if (currentFeedMode === 'saved') {

            const currentUser =
              authService.user();

            if (!currentUser) {

              patchState(store, {
                posts: [],
                followingUserIds: [],
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                refreshing: false,
                error:
                  'You must be signed in to refresh your saved posts.',
              });

              return;
            }

            const savedResult =
              await loadSavedPage(null);

            if (!savedResult.bookmarkPage) {

              patchState(store, {
                posts: [],
                followingUserIds: [],
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                refreshing: false,
                error: null,
              });

              return;
            }

            const hydratedPosts =
              await hydrateViewerState(
                savedResult.posts,
                currentUser.id,
              );

            patchState(store, {
              posts: hydratedPosts,
              followingUserIds: [],
              lastDocument: null,
              followingCursors: {},
              savedCursor:
                savedResult.bookmarkPage.lastDocument,
              hasMore:
                savedResult.bookmarkPage.hasMore,
              refreshing: false,
              error: null,
            });

            logger.info(
              'CommunityStore',
              'Saved feed refreshed.',
              {
                userId: currentUser.id,
                postCount: hydratedPosts.length,
                hasMore:
                  savedResult.bookmarkPage.hasMore,
              },
            );

            return;
          }

          const currentSortMode =
            currentFeedMode === 'trending'
              ? 'trending'
              : store.sortMode();

          let postPage:
            Awaited<
              ReturnType<
                CommunityPostService['getPosts']
              >
            >;

          let followingUserIds:
            string[] = [];

          if (currentFeedMode === 'following') {

            const followingResult =
              await loadFollowingPage({});

            followingUserIds =
              followingResult.authorIds;

            if (!followingResult.page) {

              patchState(store, {
                posts: [],
                followingUserIds,
                lastDocument: null,
                followingCursors: {},
                savedCursor: null,
                hasMore: false,
                refreshing: false,
                error: null,
              });

              logger.info(
                'CommunityStore',
                'Following feed refreshed with no followed users.',
                {
                  userId:
                    authService.user()?.id ?? null,
                },
              );

              return;
            }

            postPage =
              followingResult.page;

          } else {

            postPage =
              await postService.getPosts({
                topicId:
                  store.selectedTopicId(),
                sortMode:
                  currentSortMode,
              });
          }

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
            posts: hydratedPosts,
            followingUserIds,
            lastDocument:
              postPage.lastDocument,
            followingCursors:
              currentFeedMode === 'following'
                ? postPage.followingCursors ?? {}
                : {},
            savedCursor: null,
            hasMore: postPage.hasMore,
            refreshing: false,
            error: null,
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
            refreshing: false,
            error:
              store.feedMode() === 'following'
                ? 'Unable to refresh your following feed right now. Please try again.'
                : store.feedMode() === 'saved'
                  ? 'Unable to refresh your saved posts right now. Please try again.'
                  : error instanceof Error
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
 * Home:
 *   All published/approved posts.
 *
 * Trending:
 *   All published/approved posts ordered by trending score.
 *
 * Following:
 *   Published/approved posts authored by users followed
 *   by the current user.
 *
 * Saved:
 *   Reserved for the Saved feed implementation.
 */
const selectFeedMode =
  async (
    mode: CommunityFeedMode,
  ): Promise<void> => {

    if (store.feedMode() === mode) {
      return;
    }

    const currentUser =
      authService.user();

    // ----------------------------------------------------------
    // FOLLOWING
    // ----------------------------------------------------------

    if (mode === 'following') {

      if (!currentUser) {
        patchState(store, {
          feedMode: mode,
          posts: [],
          lastDocument: null,
          followingCursors: {},
          hasMore: false,
          loading: false,
          error:
            'You must be signed in to view your following feed.',
        });

        return;
      }

      patchState(store, {
        feedMode: 'following',
        sortMode: 'latest',
        selectedTopicId: null,
        posts: [],
        lastDocument: null,
        followingCursors: {},
        hasMore: true,
        error: null,
        loading: true,
      });

      try {

        // ------------------------------------------------------
        // Get users the current user follows
        // ------------------------------------------------------

        const following =
          await followService.getFollowing(
            currentUser.id,
          );

        const authorIds =
          following
            .map((follow) => follow.followingId)
            .filter(
              (id): id is string =>
                !!id?.trim(),
            );

        // ------------------------------------------------------
        // No followed users
        // ------------------------------------------------------

        if (authorIds.length === 0) {

          patchState(store, {
            posts: [],
            followingCursors: {},
            lastDocument: null,
            hasMore: false,
            loading: false,
            error: null,
          });

          logger.info(
            'CommunityStore',
            'Following feed loaded with no followed users.',
            {
              userId: currentUser.id,
            },
          );

          return;
        }

        // ------------------------------------------------------
        // Load posts from followed users
        // ------------------------------------------------------

        const page =
          await postService.getPosts({
            topicId: null,
            sortMode: 'latest',
            authorIds,
            followingCursors: {},
          });

        const hydratedPosts =
          await hydrateViewerState(
            page.posts,
            currentUser.id,
          );

        patchState(store, {
          posts: hydratedPosts,
          lastDocument: page.lastDocument,
          followingCursors:
            page.followingCursors ?? {},
          hasMore: page.hasMore,
          loading: false,
          error: null,
        });

        logger.info(
          'CommunityStore',
          'Following feed loaded.',
          {
            userId: currentUser.id,
            followedUserCount:
              authorIds.length,
            postCount:
              hydratedPosts.length,
          },
        );

      } catch (error) {

        logger.error(
          'CommunityStore',
          'Failed to load following feed.',
          {
            userId: currentUser.id,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );

        patchState(store, {
          loading: false,
          error:
            'Unable to load your following feed right now. Please try again.',
        });
      }

      return;
    }

    // ----------------------------------------------------------
    // SAVED
    // ----------------------------------------------------------

    if (mode === 'saved') {

      if (!currentUser) {

        patchState(store, {
          feedMode: 'saved',
          sortMode: 'latest',
          selectedTopicId: null,
          posts: [],
          followingUserIds: [],
          lastDocument: null,
          followingCursors: {},
          savedCursor: null,
          hasMore: false,
          error:
            'You must be signed in to view your saved posts.',
          loading: false,
        });

        return;
      }

      patchState(store, {
        feedMode: 'saved',
        sortMode: 'latest',
        selectedTopicId: null,
        posts: [],
        followingUserIds: [],
        lastDocument: null,
        followingCursors: {},
        savedCursor: null,
        hasMore: true,
        error: null,
        loading: true,
      });

      try {

        const savedResult =
          await loadSavedPage(null);

        if (!savedResult.bookmarkPage) {
          patchState(store, {
            posts: [],
            savedCursor: null,
            hasMore: false,
            loading: false,
            error: null,
          });

          return;
        }

        const hydratedPosts =
          await hydrateViewerState(
            savedResult.posts,
            currentUser.id,
          );

        patchState(store, {
          posts: hydratedPosts,
          savedCursor:
            savedResult.bookmarkPage.lastDocument,
          hasMore:
            savedResult.bookmarkPage.hasMore,
          loading: false,
          error: null,
        });

        logger.info(
          'CommunityStore',
          'Saved feed selected.',
          {
            userId: currentUser.id,
            postCount: hydratedPosts.length,
            hasMore:
              savedResult.bookmarkPage.hasMore,
          },
        );

      } catch (error) {

        logger.error(
          'CommunityStore',
          'Failed to load saved community feed.',
          {
            userId: currentUser.id,
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );

        patchState(store, {
          loading: false,
          error:
            'Unable to load your saved posts right now. Please try again.',
        });
      }

      return;
    }

    // ----------------------------------------------------------
    // HOME / TRENDING
    // ----------------------------------------------------------

    const sortMode:
      CommunitySortMode =
      mode === 'trending'
        ? 'trending'
        : 'latest';

    patchState(store, {
  feedMode: mode,
  sortMode,
  selectedTopicId: null,
  posts: [],
  lastDocument: null,
  followingCursors: {},
  hasMore: true,
  error: null,
  loading: true,
});

    try {

      const postPage =
        await postService.getPosts({
          topicId: null,
          sortMode,
        });

      const userId =
        authService.user()?.id ?? null;

      const hydratedPosts =
        await hydrateViewerState(
          postPage.posts,
          userId,
        );

      patchState(store, {
        posts: hydratedPosts,
        lastDocument:
          postPage.lastDocument,
        followingCursors: {},
        hasMore:
          postPage.hasMore,
        loading: false,
        error: null,
      });

      logger.info(
        'CommunityStore',
        'Community feed mode selected.',
        {
          feedMode: mode,
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
          feedMode: mode,
          sortMode,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      patchState(store, {
        loading: false,
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

          followingUserIds:
            [],

          lastDocument:
            null,

          followingCursors:
            {},

          savedCursor:
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
              store.feedMode() === 'saved' &&
              !bookmarked

                ? store
                    .posts()
                    .filter(
                      (post) =>
                        post.id !== id,
                    )

                : store
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

          followingUserIds:
            [],

          lastDocument:
            null,

          followingCursors:
            {},

          savedCursor:
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

            followingUserIds:
              [],

            followingCursors:
              {},

            savedCursor:
              null,

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

          followingUserIds:
            [],

          lastDocument:
            null,

          followingCursors:
            {},

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

            followingUserIds:
              [],

            followingCursors:
              {},

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
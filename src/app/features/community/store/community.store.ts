import { computed, inject } from '@angular/core';
import { DocumentData, DocumentSnapshot } from 'firebase/firestore';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { AuthService } from '../../../core/services/auth.service';

import { CommunityPost } from '../models/community-post.model';
import { CommunityTopic } from '../models/community-topic.model';

import { CommunityPostService } from '../services/community-post.service';
import { CommunityTopicService } from '../services/community-topic.service';

// ============================================================
// TYPES
// ============================================================

export type CommunitySortMode = 'latest' | 'popular' | 'trending';

// ============================================================
// STATE
// ============================================================

interface CommunityState {
  // Feed
  posts: CommunityPost[];

  // Topics
  topics: CommunityTopic[];

  // Active filters
  selectedTopicId: string | null;
  searchTerm: string;
  sortMode: CommunitySortMode;

  // Loading states
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;

  // Error
  error: string | null;

  // Pagination
  hasMore: boolean;
  lastDocument: DocumentSnapshot<DocumentData> | null;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: CommunityState = {
  posts: [],

  topics: [],

  selectedTopicId: null,

  searchTerm: '',

  sortMode: 'latest',

  loading: false,

  loadingMore: false,

  refreshing: false,

  error: null,

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
    const authService = inject(AuthService);

    // --------------------------------------------------------
    // Filtered posts
    // --------------------------------------------------------

    const filteredPosts = computed(() => {
      const posts = store.posts();

      const searchTerm = store.searchTerm().trim().toLowerCase();

      if (!searchTerm) {
        return posts;
      }

      return posts.filter((post) => {
        const title = post.title?.toLowerCase() ?? '';

        const content = post.content?.toLowerCase() ?? '';

        const topicName = post.topicName?.toLowerCase() ?? '';

        const tags = post.tags?.join(' ').toLowerCase() ?? '';

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

    const selectedTopic = computed(() => {
      const topicId = store.selectedTopicId();

      if (!topicId) {
        return null;
      }

      return store.topics().find((topic) => topic.id === topicId) ?? null;
    });

    // --------------------------------------------------------
    // Active filters
    // --------------------------------------------------------

    const hasActiveFilters = computed(() => {
      return (
        !!store.selectedTopicId() || !!store.searchTerm().trim() || store.sortMode() !== 'latest'
      );
    });

    // --------------------------------------------------------
    // Current user
    // --------------------------------------------------------

    const currentUser = computed(() => {
      return authService.user();
    });

    // --------------------------------------------------------
    // Post count
    //
    // IMPORTANT:
    // Do not call filteredPosts() here because filteredPosts
    // is a sibling computed property in this same factory.
    // Calculate from the same source instead.
    // --------------------------------------------------------

    const postCount = computed(() => {
      const posts = store.posts();

      const searchTerm = store.searchTerm().trim().toLowerCase();

      if (!searchTerm) {
        return posts.length;
      }

      return posts.filter((post) => {
        const title = post.title?.toLowerCase() ?? '';

        const content = post.content?.toLowerCase() ?? '';

        const topicName = post.topicName?.toLowerCase() ?? '';

        const tags = post.tags?.join(' ').toLowerCase() ?? '';

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

    const isEmpty = computed(() => {
      return !store.loading() && !store.loadingMore() && postCount() === 0;
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
    const postService = inject(CommunityPostService);

    const topicService = inject(CommunityTopicService);

    // ========================================================
    // LOAD INITIAL DATA
    // ========================================================

    const loadInitialData = async (): Promise<void> => {
      patchState(store, {
        loading: true,
        error: null,
      });

      try {
        const [topics, postPage] = await Promise.all([
          topicService.getActiveTopics(),

          postService.getPosts({
            topicId: store.selectedTopicId(),
          }),
        ]);

        patchState(store, {
          topics,

          posts: postPage.posts,

          lastDocument: postPage.lastDocument,

          hasMore: postPage.hasMore,

          error: null,

          loading: false,
        });
      } catch (error) {
        console.error('Failed to load community data:', error);

        patchState(store, {
          loading: false,

          error: 'Unable to load the community right now. Please try again.',
        });
      }
    };

    // ========================================================
    // LOAD MORE POSTS
    // ========================================================

    const loadMore = async (): Promise<void> => {
      if (store.loading() || store.loadingMore() || !store.hasMore()) {
        return;
      }

      patchState(store, {
        loadingMore: true,

        error: null,
      });

      try {
        const page = await postService.getPosts({
          topicId: store.selectedTopicId(),

          lastDocument: store.lastDocument(),
        });

        patchState(store, {
          posts: [...store.posts(), ...page.posts],

          lastDocument: page.lastDocument,

          hasMore: page.hasMore,

          loadingMore: false,

          error: null,
        });
      } catch (error) {
        console.error('Failed to load more community posts:', error);

        patchState(store, {
          loadingMore: false,

          error: 'Unable to load more posts. Please try again.',
        });
      }
    };

    // ========================================================
    // REFRESH
    // ========================================================

    const refresh = async (): Promise<void> => {
      patchState(store, {
        refreshing: true,

        error: null,
      });

      try {
        const page = await postService.getPosts({
          topicId: store.selectedTopicId(),
        });

        patchState(store, {
          posts: page.posts,

          lastDocument: page.lastDocument,

          hasMore: page.hasMore,

          refreshing: false,

          error: null,
        });
      } catch (error) {
        console.error('Failed to refresh community:', error);

        patchState(store, {
          refreshing: false,

          error: 'Unable to refresh the community. Please try again.',
        });
      }
    };

    // ========================================================
    // SELECT TOPIC
    // ========================================================

    const selectTopic = async (topicId: string | null): Promise<void> => {
      patchState(store, {
        selectedTopicId: topicId,

        posts: [],

        lastDocument: null,

        hasMore: true,

        error: null,

        loading: true,
      });

      try {
        const page = await postService.getPosts({
          topicId,
        });

        patchState(store, {
          posts: page.posts,

          lastDocument: page.lastDocument,

          hasMore: page.hasMore,

          loading: false,

          error: null,
        });
      } catch (error) {
        console.error('Failed to load topic posts:', error);

        patchState(store, {
          loading: false,

          error: 'Unable to load posts for this topic. Please try again.',
        });
      }
    };

   // ========================================================
// CREATE POST
// ========================================================

const createPost = async (input: {
  title: string;
  content: string;
  topicId: string;
  topicName?: string;
  tags?: string[];
}): Promise<string | null> => {

  // --------------------------------------------------------
  // Current authenticated user
  // --------------------------------------------------------

  const currentUser = store.currentUser();

  if (!currentUser) {
    patchState(store, {
      error: 'You must be signed in to create a post.',
    });

    return null;
  }

  // --------------------------------------------------------
  // Validate input
  // --------------------------------------------------------

  const title = input.title.trim();
  const content = input.content.trim();
  const topicId = input.topicId.trim();

  if (!title) {
    patchState(store, {
      error: 'A post title is required.',
    });

    return null;
  }

  if (!content) {
    patchState(store, {
      error: 'Post content is required.',
    });

    return null;
  }

  if (!topicId) {
    patchState(store, {
      error: 'Please select a topic.',
    });

    return null;
  }

  // --------------------------------------------------------
  // Begin save
  // --------------------------------------------------------

  patchState(store, {
    loading: true,
    error: null,
  });

  try {
    const postId = await postService.createPost({
      authorId: currentUser.id,
      authorName:
        currentUser.displayName || 'Zebron Community Member',
      authorPhotoUrl: currentUser.photoUrl ?? null,

      topicId,
      topicName: input.topicName,

      title,
      content,
      tags: input.tags ?? [],
    });

    // The post has been successfully written to Firestore.
    // Mark the save as complete before refreshing the feed.
    patchState(store, {
      loading: false,
      error: null,
    });

    // Refresh the feed separately.
    // If refreshing fails, the post was still created successfully.
    try {
      await loadInitialData();
    } catch (refreshError) {
      console.error(
        'Post created, but community feed refresh failed:',
        refreshError,
      );
    }

    return postId;
  } catch (error) {
    console.error(
      'Failed to create community post:',
      error,
    );

    patchState(store, {
      loading: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create your post. Please try again.',
    });

    return null;
  } 
};

    // ========================================================
    // SEARCH
    // ========================================================

    const setSearchTerm = (searchTerm: string): void => {
      patchState(store, {
        searchTerm,
      });
    };

    // ========================================================
    // SORT
    // ========================================================

    const setSortMode = (sortMode: CommunitySortMode): void => {
      patchState(store, {
        sortMode,
      });
    };

    // ========================================================
    // CLEAR FILTERS
    // ========================================================

    const clearFilters = async (): Promise<void> => {
      patchState(store, {
        searchTerm: '',

        sortMode: 'latest',

        selectedTopicId: null,

        posts: [],

        lastDocument: null,

        hasMore: true,

        error: null,

        loading: true,
      });

      try {
        const page = await postService.getPosts({
          topicId: null,
        });

        patchState(store, {
          posts: page.posts,

          lastDocument: page.lastDocument,

          hasMore: page.hasMore,

          loading: false,

          error: null,
        });
      } catch (error) {
        console.error('Failed to clear community filters:', error);

        patchState(store, {
          loading: false,

          error: 'Unable to reset the community feed. Please try again.',
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

      selectTopic,

      setSearchTerm,

      setSortMode,

      clearFilters,

      createPost,
    };
  }),
);

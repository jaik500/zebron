
// ============================================================
// COMMUNITY SIGNAL STORE
// ============================================================
//
// Centralized state management for the Zebron Community feature.
//
// Architecture:
//
//   Community Components
//          ↓
//   CommunityStore
//          ↓
//   CommunityService
//          ↓
//      Firestore
//
// ============================================================

import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../../core/services/auth.service';
import { CommunityService } from '../../../core/services/community.service';

import {
  CommunityPost,
  CommunityPostStatus,
  CommunityPostType,
} from '../../../core/models/community/community-post.model';

import { CommunityComment } from '../../../core/models/community/community-comment.model';
import { CommunityCategory } from '../../../core/models/community/community-category.model';

import {
  CommunityReportReason,
} from '../../../core/models/community/community-report.model';


// ============================================================
// STATE
// ============================================================

interface CommunityState {

  posts: CommunityPost[];

  selectedPost: CommunityPost | null;

  comments: CommunityComment[];

  categories: CommunityCategory[];

  myPosts: CommunityPost[];

  loading: boolean;

  loadingPost: boolean;

  loadingComments: boolean;

  saving: boolean;

  error: string | null;

  searchTerm: string;

  selectedPostType: CommunityPostType | null;

  selectedCategoryId: string | null;
}


// ============================================================
// INITIAL STATE
// ============================================================

const initialState: CommunityState = {

  posts: [],

  selectedPost: null,

  comments: [],

  categories: [],

  myPosts: [],

  loading: false,

  loadingPost: false,

  loadingComments: false,

  saving: false,

  error: null,

  searchTerm: '',

  selectedPostType: null,

  selectedCategoryId: null,
};


// ============================================================
// FILTER HELPER
// ============================================================

function filterCommunityPosts(

  posts: CommunityPost[],

  searchTerm: string,

  postType: CommunityPostType | null,

  categoryId: string | null,

): CommunityPost[] {

  const search =
    searchTerm
      .trim()
      .toLowerCase();


  return posts

    // --------------------------------------------------------
    // Only published posts
    // --------------------------------------------------------

    .filter(
      (post: CommunityPost) =>
        post.status === 'published',
    )

    // --------------------------------------------------------
    // Post type
    // --------------------------------------------------------

    .filter(
      (post: CommunityPost) =>
        !postType ||
        post.postType === postType,
    )

    // --------------------------------------------------------
    // Category
    // --------------------------------------------------------

    .filter(
      (post: CommunityPost) =>
        !categoryId ||
        post.categoryId === categoryId,
    )

    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    .filter(
      (post: CommunityPost) => {

        if (!search) {
          return true;
        }


        const searchableText = [

          post.title,

          post.content,

          post.authorName,

          ...(post.tags ?? []),

        ]
          .join(' ')
          .toLowerCase();


        return searchableText.includes(search);
      },
    );
}


// ============================================================
// SIGNAL STORE
// ============================================================

export const CommunityStore = signalStore(

  // ============================================================
  // STATE
  // ============================================================

  withState(initialState),


  // ============================================================
  // COMPUTED STATE
  // ============================================================

  withComputed((store) => {

    const authService =
      inject(AuthService);


    return {

      // ========================================================
      // CURRENT USER
      // ========================================================

      currentUser: computed(
        () =>
          authService.user(),
      ),


      // ========================================================
      // PUBLISHED POSTS
      // ========================================================

      publishedPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published',
          ),
      ),


      // ========================================================
      // OFFICIAL POSTS
      // ========================================================

      officialPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              (
                post.postType === 'announcement' ||
                post.postType === 'news' ||
                post.postType === 'notice'
              ),
          ),
      ),


      // ========================================================
      // DISCUSSIONS
      // ========================================================

      discussionPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'discussion',
          ),
      ),


      // ========================================================
      // QUESTIONS
      // ========================================================

      questionPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'question',
          ),
      ),


      // ========================================================
      // NEWS
      // ========================================================

      newsPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'news',
          ),
      ),


      // ========================================================
      // ANNOUNCEMENTS
      // ========================================================

      announcementPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'announcement',
          ),
      ),


      // ========================================================
      // EVENTS
      // ========================================================

      eventPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'event',
          ),
      ),


      // ========================================================
      // OPPORTUNITIES
      // ========================================================

      opportunityPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'opportunity',
          ),
      ),


      // ========================================================
      // NOTICES
      // ========================================================

      noticePosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.postType === 'notice',
          ),
      ),


      // ========================================================
      // FEATURED
      // ========================================================

      featuredPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.featured === true,
          ),
      ),


      // ========================================================
      // PINNED
      // ========================================================

      pinnedPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.pinned === true,
          ),
      ),


      // ========================================================
      // IMPORTANT
      // ========================================================

      importantPosts: computed(
        () =>
          store.posts().filter(
            (post: CommunityPost) =>
              post.status === 'published' &&
              post.important === true,
          ),
      ),


      // ========================================================
      // FILTERED POSTS
      // ========================================================

      filteredPosts: computed(
        () =>
          filterCommunityPosts(

            store.posts(),

            store.searchTerm(),

            store.selectedPostType(),

            store.selectedCategoryId(),

          ),
      ),


      // ========================================================
      // RESULT COUNT
      // ========================================================

      resultCount: computed(
        () =>
          filterCommunityPosts(

            store.posts(),

            store.searchTerm(),

            store.selectedPostType(),

            store.selectedCategoryId(),

          ).length,
      ),


      // ========================================================
      // ACTIVE FILTERS
      // ========================================================

      hasActiveFilters: computed(
        () =>
          store.searchTerm().trim().length > 0 ||
          store.selectedPostType() !== null ||
          store.selectedCategoryId() !== null,
      ),


      // ========================================================
      // CURRENT USER POSTS
      // ========================================================

      currentUserPosts: computed(
        () => {

          const user =
            authService.user();


          if (!user) {
            return [];
          }


          return store.posts().filter(
            (post: CommunityPost) =>
              post.authorId === user.id,
          );
        },
      ),


      // ========================================================
      // COMMUNITY STATISTICS
      // ========================================================

      communityStats: computed(
        () => {

          const posts =
            store.posts();


          const published =
            posts.filter(
              (post: CommunityPost) =>
                post.status === 'published',
            );


          const discussions =
            published.filter(
              (post: CommunityPost) =>
                post.postType === 'discussion',
            );


          const questions =
            published.filter(
              (post: CommunityPost) =>
                post.postType === 'question',
            );


          const official =
            published.filter(
              (post: CommunityPost) =>
                post.postType === 'announcement' ||
                post.postType === 'news' ||
                post.postType === 'notice',
            );


          const totalComments =
            published.reduce(
              (
                total: number,
                post: CommunityPost,
              ) =>
                total +
                (post.commentCount ?? 0),
              0,
            );


          const totalLikes =
            published.reduce(
              (
                total: number,
                post: CommunityPost,
              ) =>
                total +
                (post.likeCount ?? 0),
              0,
            );


          const totalViews =
            published.reduce(
              (
                total: number,
                post: CommunityPost,
              ) =>
                total +
                (post.viewCount ?? 0),
              0,
            );


          return {

            totalPosts:
              published.length,

            discussions:
              discussions.length,

            questions:
              questions.length,

            official:
              official.length,

            totalComments,

            totalLikes,

            totalViews,

          };
        },
      ),

    };

  }),


  // ============================================================
  // METHODS
  // ============================================================

  withMethods(
    (
      store,

      communityService =
        inject(CommunityService),

      authService =
        inject(AuthService),

    ) => {


      // ========================================================
      // INTERNAL LOAD COMMUNITY HELPER
      // ========================================================
      //
      // Methods inside withMethods() cannot call other methods
      // through `store.loadCommunity()`.
      //
      // Therefore we define reusable local functions.
      //

      const loadCommunityInternal =
        async (): Promise<void> => {

          patchState(store, {

            loading: true,

            error: null,

          });


          try {

            const [
              posts,
              categories,
            ] = await Promise.all([

              communityService
                .getRecentPosts(50),

              communityService
                .getActiveCategories(),

            ]);


            const user =
              authService.user();


            const myPosts =
              user

                ? posts.filter(
                    (post: CommunityPost) =>
                      post.authorId === user.id,
                  )

                : [];


            patchState(store, {

              posts,

              categories,

              myPosts,

              loading: false,

              error: null,

            });

          } catch (error) {

            patchState(store, {

              loading: false,

              error:
                getErrorMessage(error),

            });

          }

        };


      // ========================================================
      // INTERNAL LOAD POST HELPER
      // ========================================================

      const loadPostInternal =
        async (
          postId: string,
        ): Promise<void> => {

          patchState(store, {

            loadingPost: true,

            error: null,

            selectedPost: null,

          });


          try {

            const post =
              await communityService
                .getPost(postId);


            // --------------------------------------------------
            // getPost() may return null.
            // --------------------------------------------------

            if (!post) {

              patchState(store, {

                loadingPost: false,

                error:
                  'The community post could not be found.',

              });

              return;

            }


            patchState(store, {

              selectedPost: post,

              loadingPost: false,

            });

          } catch (error) {

            patchState(store, {

              loadingPost: false,

              error:
                getErrorMessage(error),

            });

          }

        };


      // ========================================================
      // RETURN STORE METHODS
      // ========================================================

      return {


        // ======================================================
        // LOAD COMMUNITY
        // ======================================================

        async loadCommunity(): Promise<void> {

          await loadCommunityInternal();

        },


        // ======================================================
        // LOAD CATEGORIES
        // ======================================================

        async loadCategories(): Promise<void> {

          try {

            const categories =
              await communityService
                .getActiveCategories();


            patchState(store, {

              categories,

            });

          } catch (error) {

            patchState(store, {

              error:
                getErrorMessage(error),

            });

          }

        },


        // ======================================================
        // LOAD POST
        // ======================================================

        async loadPost(
          postId: string,
        ): Promise<void> {

          await loadPostInternal(
            postId,
          );

        },


        // ======================================================
        // CLEAR SELECTED POST
        // ======================================================

        clearSelectedPost(): void {

          patchState(store, {

            selectedPost: null,

            comments: [],

          });

        },


        // ======================================================
        // LOAD COMMENTS
        // ======================================================

        async loadComments(
          postId: string,
        ): Promise<void> {

          patchState(store, {

            loadingComments: true,

            error: null,

          });


          try {

            const comments =
              await communityService
                .getComments(postId);


            patchState(store, {

              comments,

              loadingComments: false,

            });

          } catch (error) {

            patchState(store, {

              loadingComments: false,

              error:
                getErrorMessage(error),

            });

          }

        },


        // ======================================================
        // CREATE POST
        // ======================================================

        async createPost(
          input: {

            title: string;

            content: string;

            authorId: string;

            authorName: string;

            authorPhotoUrl?: string;

            postType: CommunityPostType;

            categoryId?: string;

            tags?: string[];

            allowComments?: boolean;

            status?: CommunityPostStatus;

          },
        ): Promise<string | null> {

          patchState(store, {

            saving: true,

            error: null,

          });


          try {

            const postId =
              await communityService.createPost({

                title:
                  input.title,

                content:
                  input.content,

                authorId:
                  input.authorId,

                authorName:
                  input.authorName,

                authorPhotoUrl:
                  input.authorPhotoUrl,

                postType:
                  input.postType,

                categoryId:
                  input.categoryId,

                tags:
                  input.tags,

                allowComments:
                  input.allowComments,

                status:
                  input.status,

              });


            patchState(store, {

              saving: false,

            });


            // Reload using the local helper instead of
            // store.loadCommunity().

            await loadCommunityInternal();


            return postId;

          } catch (error) {

            patchState(store, {

              saving: false,

              error:
                getErrorMessage(error),

            });


            return null;

          }

        },


        // ======================================================
        // UPDATE POST
        // ======================================================

        async updatePost(
          postId: string,
          updates: Partial<CommunityPost>,
        ): Promise<boolean> {

          patchState(store, {

            saving: true,

            error: null,

          });


          try {

            await communityService.updatePost(
              postId,
              updates,
            );


            // Reload using local helper.

            await loadCommunityInternal();


            // If the currently selected post is the
            // post being updated, reload it.

            if (
              store.selectedPost()?.id ===
              postId
            ) {

              await loadPostInternal(
                postId,
              );

            }


            patchState(store, {

              saving: false,

            });


            return true;

          } catch (error) {

            patchState(store, {

              saving: false,

              error:
                getErrorMessage(error),

            });


            return false;

          }

        },


        // ======================================================
        // ADD COMMENT
        // ======================================================

        async addComment(
          input: {

            postId: string;

            authorId: string;

            authorName: string;

            authorPhotoUrl?: string;

            content: string;

          },
        ): Promise<string | null> {

          patchState(store, {

            saving: true,

            error: null,

          });


          try {

            const commentId =
              await communityService
                .createComment({

                  postId:
                    input.postId,

                  authorId:
                    input.authorId,

                  authorName:
                    input.authorName,

                  authorPhotoUrl:
                    input.authorPhotoUrl,

                  content:
                    input.content,

                });


            // --------------------------------------------------
            // Reload comments.
            // --------------------------------------------------

            const comments =
              await communityService
                .getComments(
                  input.postId,
                );


            // --------------------------------------------------
            // Retrieve updated post.
            //
            // createComment() already increments commentCount.
            // --------------------------------------------------

            const updatedPost =
              await communityService
                .getPost(
                  input.postId,
                );


            // --------------------------------------------------
            // Update local post state only if the post exists.
            // --------------------------------------------------

            if (updatedPost) {

              patchState(store, {

                comments,

                selectedPost:
                  store.selectedPost()?.id ===
                  input.postId

                    ? updatedPost

                    : store.selectedPost(),

                posts:
                  store.posts().map(
                    (post: CommunityPost) =>
                      post.id === input.postId
                        ? updatedPost
                        : post,
                  ),

                myPosts:
                  store.myPosts().map(
                    (post: CommunityPost) =>
                      post.id === input.postId
                        ? updatedPost
                        : post,
                  ),

                saving: false,

              });

            } else {

              patchState(store, {

                comments,

                saving: false,

              });

            }


            return commentId;

          } catch (error) {

            patchState(store, {

              saving: false,

              error:
                getErrorMessage(error),

            });


            return null;

          }

        },


        // ======================================================
        // REPORT CONTENT
        // ======================================================

        async reportContent(
          input: {

            postId?: string;

            commentId?: string;

            reportedBy: string;

            reason: CommunityReportReason;

            description?: string;

          },
        ): Promise<boolean> {

          patchState(store, {

            saving: true,

            error: null,

          });


          try {

            await communityService.reportContent({

              postId:
                input.postId,

              commentId:
                input.commentId,

              reportedBy:
                input.reportedBy,

              reason:
                input.reason,

              description:
                input.description,

            });


            patchState(store, {

              saving: false,

            });


            return true;

          } catch (error) {

            patchState(store, {

              saving: false,

              error:
                getErrorMessage(error),

            });


            return false;

          }

        },


        // ======================================================
        // SEARCH
        // ======================================================

        setSearchTerm(
          searchTerm: string,
        ): void {

          patchState(store, {

            searchTerm,

          });

        },


        // ======================================================
        // POST TYPE FILTER
        // ======================================================

        setPostType(
          postType: CommunityPostType | null,
        ): void {

          patchState(store, {

            selectedPostType:
              postType,

          });

        },


        // ======================================================
        // CATEGORY FILTER
        // ======================================================

        setCategory(
          categoryId: string | null,
        ): void {

          patchState(store, {

            selectedCategoryId:
              categoryId,

          });

        },


        // ======================================================
        // CLEAR FILTERS
        // ======================================================

        clearFilters(): void {

          patchState(store, {

            searchTerm: '',

            selectedPostType: null,

            selectedCategoryId: null,

          });

        },


        // ======================================================
        // CLEAR ERROR
        // ======================================================

        clearError(): void {

          patchState(store, {

            error: null,

          });

        },


        // ======================================================
        // RESET
        // ======================================================

        reset(): void {

          patchState(store, {

            ...initialState,

          });

        },

      };

    },
  ),
);


// ============================================================
// ERROR HELPER
// ============================================================

function getErrorMessage(
  error: unknown,
): string {

  if (
    error instanceof Error &&
    error.message
  ) {

    return error.message;

  }


  if (
    typeof error === 'string'
  ) {

    return error;

  }


  return (
    'An unexpected error occurred. Please try again.'
  );
}


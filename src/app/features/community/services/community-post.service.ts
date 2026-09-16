import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  DocumentData,
  DocumentSnapshot,
  documentId,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QuerySnapshot,
  serverTimestamp,
  startAfter,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

import {
  CommunityPost,
  CommunityPostAuthor,
} from '../models/community-post.model';

import {
  CommunitySortMode,
} from '../models/community-feed.model';


// ============================================================
// POST PAGE
// ============================================================

export interface CommunityPostPage {
  posts: CommunityPost[];

  /**
   * Firestore cursor used by the standard feed.
   *
   * For Following feeds this value represents the final
   * document from the merged page and should not be used as
   * the sole pagination cursor.
   */
  lastDocument:
    DocumentSnapshot<DocumentData> | null;

  /**
   * Indicates whether another page may exist.
   */
  hasMore: boolean;

  /**
   * Per-author-batch cursors used by the Following feed.
   *
   * The key identifies an author batch and the value represents
   * the final document consumed from that batch.
   */
  followingCursors?: Record<
    string,
    DocumentSnapshot<DocumentData> | null
  >;
}


// ============================================================
// CREATE POST INPUT
// ============================================================

export interface CreateCommunityPostInput {
  title: string;

  content: string;

  topicId: string;

  /**
   * Denormalized topic name used by the feed.
   */
  topicName?: string | null;

  /**
   * Optional hashtags/tags.
   */
  tags?: string[];

  /**
   * Optional uploaded media.
   */
  mediaUrls?: string[];

  authorId: string;

  author: CommunityPostAuthor;
}


// ============================================================
// GET POSTS OPTIONS
// ============================================================

export interface GetCommunityPostsOptions {

  /**
   * Optional topic filter.
   */
  topicId?: string | null;

  /**
   * Feed sorting mode.
   */
  sortMode?: CommunitySortMode;

  /**
   * Optional author filter.
   *
   * Used by the Following feed.
   */
  authorIds?: string[];

  /**
   * Standard Firestore cursor.
   *
   * Used by Home, Trending, Popular, and topic feeds.
   */
  lastDocument?:
    DocumentSnapshot<DocumentData> | null;

  /**
   * Per-author-batch cursors used by the Following feed.
   */
  followingCursors?: Record<
    string,
    DocumentSnapshot<DocumentData> | null
  >;
}


// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root',
})
export class CommunityPostService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Number of posts returned by a normal Community page.
   */
  private readonly pageSize = 20;

  /**
   * Maximum number of author IDs included in one Firestore
   * `in` query.
   *
   * Keeping this centralized makes the query behavior easy
   * to adjust if Firestore query limits change.
   */
  private readonly authorQueryBatchSize = 30;


  // ============================================================
  // FIRESTORE
  // ============================================================

  private readonly postsCollection =
    collection(
      firestore,
      'communityPosts',
    );


  // ============================================================
  // SERVICES
  // ============================================================

  private readonly logger =
    inject(LoggerService);


  // ============================================================
  // GET POSTS
  // ============================================================

  /**
   * Returns a paginated collection of published and approved
   * Community posts.
   *
   * Supported sort modes:
   *
   * latest:
   *   Newest posts first.
   *
   * popular:
   *   Posts with the highest view count first.
   *
   * trending:
   *   Posts with the highest trending score first.
   *
   * The optional authorIds property is used by the Following
   * feed.
   */
  async getPosts(
    options?: GetCommunityPostsOptions,
  ): Promise<CommunityPostPage> {

    // ----------------------------------------------------------
    // NORMALIZE OPTIONS
    // ----------------------------------------------------------

    const topicId =
      options?.topicId?.trim() ||
      null;

    const sortMode =
      options?.sortMode ??
      'latest';

    const authorIds =
      this.normalizeAuthorIds(
        options?.authorIds,
      );


    // ----------------------------------------------------------
    // EMPTY FOLLOWING RESULT
    // ----------------------------------------------------------

    /**
     * An explicitly supplied empty author list means the caller
     * is requesting a Following feed with no followed users.
     *
     * Do not issue an invalid Firestore `in: []` query.
     */
    if (
      options?.authorIds &&
      authorIds.length === 0
    ) {

      return {
        posts: [],
        lastDocument: null,
        hasMore: false,
        followingCursors: {},
      };
    }


    try {

      // --------------------------------------------------------
      // BASE FILTERS
      // --------------------------------------------------------

      const baseConstraints:
        QueryConstraint[] = [

          where(
            'status',
            '==',
            'published',
          ),

          where(
            'moderationStatus',
            '==',
            'approved',
          ),

        ];


      // --------------------------------------------------------
      // TOPIC FILTER
      // --------------------------------------------------------

      if (topicId) {

        baseConstraints.push(
          where(
            'topicId',
            '==',
            topicId,
          ),
        );
      }


      // --------------------------------------------------------
      // FOLLOWING FEED
      // --------------------------------------------------------

      if (authorIds.length > 0) {

        return await this.getPostsForAuthors(
          baseConstraints,
          authorIds,
          sortMode,
          options?.followingCursors ?? {},
          topicId,
        );
      }


      // --------------------------------------------------------
      // STANDARD FEED
      // --------------------------------------------------------

      const constraints = [
        ...baseConstraints,
      ];


      // --------------------------------------------------------
      // SORTING
      // --------------------------------------------------------

      switch (sortMode) {

        case 'trending':

          constraints.push(

            orderBy(
              'trendingScore',
              'desc',
            ),

            orderBy(
              'createdAt',
              'desc',
            ),

          );

          break;


        case 'popular':

          constraints.push(

            orderBy(
              'viewCount',
              'desc',
            ),

            orderBy(
              'createdAt',
              'desc',
            ),

          );

          break;


        case 'latest':

        default:

          constraints.push(
            orderBy(
              'createdAt',
              'desc',
            ),
          );

          break;
      }


      // --------------------------------------------------------
      // STANDARD CURSOR
      // --------------------------------------------------------

      if (
        options?.lastDocument
      ) {

        constraints.push(
          startAfter(
            options.lastDocument,
          ),
        );
      }


      // --------------------------------------------------------
      // PAGE LIMIT
      // --------------------------------------------------------

      constraints.push(
        limit(
          this.pageSize,
        ),
      );


      // --------------------------------------------------------
      // QUERY
      // --------------------------------------------------------

      const postsQuery =
        query(
          this.postsCollection,
          ...constraints,
        );


      const snapshot =
        await getDocs(
          postsQuery,
        );


      // --------------------------------------------------------
      // MAP POSTS
      // --------------------------------------------------------

      const posts =
        snapshot.docs.map(
          (document) => ({

            id:
              document.id,

            ...document.data(),

          }),
        ) as CommunityPost[];


      // --------------------------------------------------------
      // PAGINATION
      // --------------------------------------------------------

      const lastDocument =
        snapshot.docs.length > 0
          ? snapshot.docs[
              snapshot.docs.length - 1
            ]
          : (
              options?.lastDocument ??
              null
            );


      const hasMore =
        snapshot.docs.length ===
        this.pageSize;


      // --------------------------------------------------------
      // LOG
      // --------------------------------------------------------

      this.logger.info(
        'CommunityPostService',
        'Community posts loaded successfully.',
        {
          topicId,
          sortMode,
          resultCount:
            posts.length,
          hasMore,
        },
      );


      return {

        posts,

        lastDocument,

        hasMore,

      };

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to load community posts.',
        error,
        {
          topicId,
          sortMode,
          authorCount:
            authorIds.length,
        },
      );

      throw error;
    }
  }


  // ============================================================
  // GET POSTS FOR AUTHORS
  // ============================================================

  /**
   * Loads posts belonging to users followed by the current user.
   *
   * Following users are divided into stable batches because
   * Firestore `in` queries support a bounded number of values.
   *
   * Each batch has its own cursor.
   *
   * This is important because a single DocumentSnapshot cannot
   * safely represent pagination across several independent
   * Firestore queries.
   */
  private async getPostsForAuthors(
    baseConstraints: QueryConstraint[],
    authorIds: string[],
    sortMode: CommunitySortMode,
    followingCursors:
      Record<
        string,
        DocumentSnapshot<DocumentData> | null
      >,
    topicId: string | null,
  ): Promise<CommunityPostPage> {

    // ----------------------------------------------------------
    // CREATE STABLE AUTHOR BATCHES
    // ----------------------------------------------------------

    /**
     * Sorting the IDs makes the batches deterministic.
     *
     * This is important because the same cursor map must refer
     * to the same batch on subsequent pagination requests.
     */
    const sortedAuthorIds =
      [...authorIds].sort();


    const authorBatches =
      this.chunk(
        sortedAuthorIds,
        this.authorQueryBatchSize,
      );


    // ----------------------------------------------------------
    // BUILD BATCH KEYS
    // ----------------------------------------------------------

    const batches =
      authorBatches.map(
        (batch) => ({

          key:
            this.getAuthorBatchKey(
              batch,
            ),

          authorIds:
            batch,

        }),
      );


    // ----------------------------------------------------------
    // QUERY BATCHES
    // ----------------------------------------------------------

    const batchResults =
      await Promise.all(

        batches.map(
          async (batch) => {

         const constraints = [
  ...baseConstraints,

  where(
    'authorId',
    'in',
    batch.authorIds,
  ),

  this.getPrimaryOrderBy(
    sortMode,
  ),

  /**
   * `latest` already uses `createdAt` as its
   * primary ordering, so do not add it again.
   *
   * Trending and popular use their own primary
   * fields and therefore need `createdAt` as the
   * secondary ordering.
   */
  ...(sortMode === 'latest'
    ? []
    : [
        orderBy(
          'createdAt',
          'desc',
        ),
      ]),

  limit(
    this.pageSize,
  ),
];


            const batchCursor =
              followingCursors[
                batch.key
              ] ?? null;


            if (batchCursor) {

              constraints.push(
                startAfter(
                  batchCursor,
                ),
              );
            }


            const postsQuery =
              query(
                this.postsCollection,
                ...constraints,
              );


            const snapshot =
              await getDocs(
                postsQuery,
              );


            return {

              key:
                batch.key,

              snapshot,

            };

          },
        ),

      );


    // ----------------------------------------------------------
    // MAP RESULTS
    // ----------------------------------------------------------

    const mergedPosts:
      CommunityPost[] =
      batchResults.flatMap(
        (result) =>
          result.snapshot.docs.map(
            (document) => ({

              id:
                document.id,

              ...document.data(),

            }),
          ) as CommunityPost[],
      );


    // ----------------------------------------------------------
    // SORT MERGED RESULTS
    // ----------------------------------------------------------

    mergedPosts.sort(
      (left, right) =>
        this.comparePosts(
          left,
          right,
          sortMode,
        ),
    );


    // ----------------------------------------------------------
    // DEDUPLICATE
    // ----------------------------------------------------------

    const uniquePosts =
      this.deduplicatePosts(
        mergedPosts,
      );


    // ----------------------------------------------------------
    // SELECT GLOBAL PAGE
    // ----------------------------------------------------------

    const pagePosts =
      uniquePosts.slice(
        0,
        this.pageSize,
      );


    // ----------------------------------------------------------
    // BUILD NEXT CURSORS
    // ----------------------------------------------------------

    /**
     * Start with the existing cursors.
     *
     * A batch that contributes no posts to this page keeps its
     * current cursor.
     */
    const nextCursors:
      Record<
        string,
        DocumentSnapshot<DocumentData> | null
      > = {
        ...followingCursors,
      };


    for (
      const batchResult of batchResults
    ) {

      const batchPosts =
        batchResult.snapshot.docs.map(
          (document) => ({

            id:
              document.id,

            ...document.data(),

          }),
        ) as CommunityPost[];


      const consumedPosts =
        pagePosts.filter(
          (pagePost) =>
            batchPosts.some(
              (batchPost) =>
                batchPost.id ===
                pagePost.id,
            ),
        );


      // --------------------------------------------------------
      // NO POSTS CONSUMED FROM THIS BATCH
      // --------------------------------------------------------

      if (
        consumedPosts.length === 0
      ) {
        continue;
      }


      // --------------------------------------------------------
      // FIND LAST CONSUMED DOCUMENT
      // --------------------------------------------------------

      const lastConsumedPost =
        consumedPosts[
          consumedPosts.length - 1
        ];


      const lastConsumedDocument =
        batchResult.snapshot.docs.find(
          (document) =>
            document.id ===
            lastConsumedPost.id,
        );


      if (
        lastConsumedDocument
      ) {

        nextCursors[
          batchResult.key
        ] =
          lastConsumedDocument;
      }
    }


    // ----------------------------------------------------------
    // DETERMINE WHETHER MORE EXISTS
    // ----------------------------------------------------------

    let hasMore =
      false;


    for (
      const batchResult of batchResults
    ) {

      const batchPosts =
        batchResult.snapshot.docs.map(
          (document) => ({

            id:
              document.id,

            ...document.data(),

          }),
        ) as CommunityPost[];


      const consumedCount =
        batchPosts.filter(
          (post) =>
            pagePosts.some(
              (pagePost) =>
                pagePost.id ===
                post.id,
            ),
        ).length;


      /**
       * If Firestore returned a full page and we consumed
       * all of that page, more documents may exist.
       */
      if (
        batchResult.snapshot.size ===
        this.pageSize &&
        consumedCount ===
        batchResult.snapshot.size
      ) {

        hasMore = true;

        break;
      }


      /**
       * If there are unconsumed documents in this batch,
       * another page definitely exists.
       */
      if (
        batchResult.snapshot.size >
        consumedCount
      ) {

        hasMore = true;

        break;
      }
    }


    // ----------------------------------------------------------
    // STANDARD LAST DOCUMENT
    // ----------------------------------------------------------

    const lastDocument =
      pagePosts.length > 0
        ? this.findDocumentSnapshot(
            batchResults,
            pagePosts[
              pagePosts.length - 1
            ].id,
          )
        : null;


    // ----------------------------------------------------------
    // LOG
    // ----------------------------------------------------------

    this.logger.info(
      'CommunityPostService',
      'Following posts loaded successfully.',
      {
        topicId,

        sortMode,

        followedUserCount:
          authorIds.length,

        authorBatchCount:
          batches.length,

        resultCount:
          pagePosts.length,

        hasMore,
      },
    );


    return {

      posts:
        pagePosts,

      lastDocument,

      hasMore,

      followingCursors:
        nextCursors,

    };
  }


  // ============================================================
  // NORMALIZE AUTHOR IDS
  // ============================================================

  /**
   * Removes empty and duplicate author IDs.
   */
  private normalizeAuthorIds(
    authorIds?: string[],
  ): string[] {

    if (!authorIds) {
      return [];
    }


    return [
      ...new Set(
        authorIds
          .map(
            (id) =>
              id.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    ];
  }


  // ============================================================
  // CHUNK
  // ============================================================

  /**
   * Divides an array into stable batches.
   */
  private chunk<T>(
    values: T[],
    size: number,
  ): T[][] {

    const batches:
      T[][] = [];


    for (
      let index = 0;
      index < values.length;
      index += size
    ) {

      batches.push(
        values.slice(
          index,
          index + size,
        ),
      );
    }


    return batches;
  }


  // ============================================================
  // AUTHOR BATCH KEY
  // ============================================================

  /**
   * Creates a deterministic key for an author batch.
   *
   * The IDs are already sorted before this method is called.
   */
  private getAuthorBatchKey(
    authorIds: string[],
  ): string {

    return authorIds.join('|');
  }


  // ============================================================
  // PRIMARY ORDER
  // ============================================================

  /**
   * Returns the primary ordering for a feed.
   */
  private getPrimaryOrderBy(
    sortMode: CommunitySortMode,
  ): QueryConstraint {

    switch (sortMode) {

      case 'trending':

        return orderBy(
          'trendingScore',
          'desc',
        );


      case 'popular':

        return orderBy(
          'viewCount',
          'desc',
        );


      case 'latest':

      default:

        return orderBy(
          'createdAt',
          'desc',
        );
    }
  }


  // ============================================================
  // POST COMPARISON
  // ============================================================

  /**
   * Compares posts using the same ordering semantics as the
   * Firestore feed.
   */
  private comparePosts(
    left: CommunityPost,
    right: CommunityPost,
    sortMode: CommunitySortMode,
  ): number {

    if (
      sortMode === 'trending'
    ) {

      const scoreDifference =
        (right.trendingScore ?? 0) -
        (left.trendingScore ?? 0);


      if (
        scoreDifference !== 0
      ) {

        return scoreDifference;
      }
    }


    if (
      sortMode === 'popular'
    ) {

      const viewDifference =
        (right.viewCount ?? 0) -
        (left.viewCount ?? 0);


      if (
        viewDifference !== 0
      ) {

        return viewDifference;
      }
    }


    const leftTime =
      left.createdAt?.toMillis?.() ??
      0;


    const rightTime =
      right.createdAt?.toMillis?.() ??
      0;


    return (
      rightTime -
      leftTime
    );
  }


  // ============================================================
  // DEDUPLICATE POSTS
  // ============================================================

  /**
   * Removes duplicate posts after author-batch queries are
   * merged.
   */
  private deduplicatePosts(
    posts: CommunityPost[],
  ): CommunityPost[] {

    const seen =
      new Set<string>();


    return posts.filter(
      (post) => {

        if (
          seen.has(post.id)
        ) {

          return false;
        }


        seen.add(
          post.id,
        );


        return true;
      },
    );
  }


  // ============================================================
  // FIND DOCUMENT SNAPSHOT
  // ============================================================

  /**
   * Finds the Firestore snapshot associated with a post.
   */
private findDocumentSnapshot(
  batchResults: Array<{
    key: string;
    snapshot:
      QuerySnapshot<DocumentData>;
  }>,
  postId: string,
): DocumentSnapshot<DocumentData> | null {

  for (
    const batchResult of batchResults
  ) {

    const document =
      batchResult.snapshot.docs.find(
        (item) =>
          item.id ===
          postId,
      );

    if (document) {
      return document;
    }
  }

  return null;
}


  // ============================================================
  // GET POSTS BY IDS
  // ============================================================

  /**
   * Resolves saved post IDs into posts that are still published
   * and approved. The result preserves the supplied ID order so
   * the Saved feed follows bookmark order.
   */
  async getPostsByIds(
    postIds: string[],
  ): Promise<CommunityPost[]> {

    const normalizedIds = [
      ...new Set(
        postIds
          .map(
            (id) =>
              id.trim(),
          )
          .filter(
            Boolean,
          ),
      ),
    ];

    if (normalizedIds.length === 0) {
      return [];
    }

    try {

      const idBatches =
        this.chunk(
          normalizedIds,
          this.authorQueryBatchSize,
        );

      const snapshots =
        await Promise.all(
          idBatches.map(
            async (batch) => {

              const postsQuery =
                query(
                  this.postsCollection,

                  where(
                    'status',
                    '==',
                    'published',
                  ),

                  where(
                    'moderationStatus',
                    '==',
                    'approved',
                  ),

                  where(
                    documentId(),
                    'in',
                    batch,
                  ),
                );

              return getDocs(
                postsQuery,
              );
            },
          ),
        );

      const postsById =
        new Map<string, CommunityPost>();

      for (
        const snapshot of snapshots
      ) {

        for (
          const document of snapshot.docs
        ) {

          postsById.set(
            document.id,
            {
              id:
                document.id,
              ...document.data(),
            } as CommunityPost,
          );
        }
      }

      const posts =
        normalizedIds
          .map(
            (id) =>
              postsById.get(id),
          )
          .filter(
            (post): post is CommunityPost =>
              !!post,
          );

      this.logger.info(
        'CommunityPostService',
        'Saved community posts resolved successfully.',
        {
          requestedCount:
            normalizedIds.length,
          resultCount:
            posts.length,
        },
      );

      return posts;

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to resolve saved community posts.',
        error,
        {
          requestedCount:
            normalizedIds.length,
        },
      );

      throw error;
    }
  }


  // ============================================================
  // GET POST BY ID
  // ============================================================

  /**
   * Returns a single Community post.
   *
   * This method intentionally does not apply the feed's
   * published/approved filters because the post-detail page
   * may need to resolve a specific post before determining
   * how it should be displayed.
   */
  async getPostById(
    postId: string,
  ): Promise<CommunityPost | null> {

    const id =
      postId.trim();


    if (!id) {

      throw new Error(
        'Post ID is required.',
      );
    }


    try {

      const postReference =
        doc(
          firestore,
          'communityPosts',
          id,
        );


      const snapshot =
        await getDoc(
          postReference,
        );


      if (
        !snapshot.exists()
      ) {

        return null;
      }


      return {

        id:
          snapshot.id,

        ...snapshot.data(),

      } as CommunityPost;

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to load community post.',
        error,
        {
          postId:
            id,
        },
      );


      throw error;
    }
  }


  // ============================================================
  // CREATE POST
  // ============================================================

  /**
   * Creates a new Community post.
   *
   * Member-created posts are published immediately for the
   * current MVP and therefore receive an approved moderation
   * status.
   */
  async createPost(
    input: CreateCommunityPostInput,
  ): Promise<string> {

    const title =
      input.title.trim();


    const content =
      input.content.trim();


    const topicId =
      input.topicId.trim();


    const authorId =
      input.authorId.trim();


    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!title) {

      throw new Error(
        'Post title is required.',
      );
    }


    if (
      title.length > 200
    ) {

      throw new Error(
        'Post title cannot exceed 200 characters.',
      );
    }


    if (!content) {

      throw new Error(
        'Post content is required.',
      );
    }


    if (
      content.length > 10000
    ) {

      throw new Error(
        'Post content cannot exceed 10,000 characters.',
      );
    }


    if (!topicId) {

      throw new Error(
        'Post topic is required.',
      );
    }


    if (!authorId) {

      throw new Error(
        'Author ID is required.',
      );
    }


    if (
      !input.author?.id?.trim()
    ) {

      throw new Error(
        'Post author information is required.',
      );
    }


    if (
      input.author.id.trim() !==
      authorId
    ) {

      throw new Error(
        'Author ID does not match the post author.',
      );
    }


    const displayName =
      input.author.displayName?.trim();


    if (!displayName) {

      throw new Error(
        'Post author display name is required.',
      );
    }


    // ==========================================================
    // NORMALIZE TAGS
    // ==========================================================

    const tags =
      (input.tags ?? [])
        .map(
          (tag) =>
            tag.trim(),
        )
        .filter(
          Boolean,
        )
        .map(
          (tag) =>
            tag.startsWith('#')
              ? tag
              : `#${tag}`,
        );


    // ==========================================================
    // NORMALIZE MEDIA
    // ==========================================================

    const mediaUrls =
      (input.mediaUrls ?? [])
        .map(
          (url) =>
            url.trim(),
        )
        .filter(
          Boolean,
        );


    // ==========================================================
    // AUTHOR SNAPSHOT
    // ==========================================================

    const author:
      CommunityPostAuthor = {

      id:
        authorId,

      displayName,

      ...(input.author.photoUrl
        ? {
            photoUrl:
              input.author.photoUrl,
          }
        : {}),

      ...(input.author.firstName
        ? {
            firstName:
              input.author.firstName,
          }
        : {}),

      ...(input.author.lastName
        ? {
            lastName:
              input.author.lastName,
          }
        : {}),

      ...(input.author.preferredName
        ? {
            preferredName:
              input.author.preferredName,
          }
        : {}),

      ...(input.author.bio
        ? {
            bio:
              input.author.bio,
          }
        : {}),

      ...(input.author.countryOfOrigin
        ? {
            countryOfOrigin:
              input.author.countryOfOrigin,
          }
        : {}),

      ...(input.author.currentCountry
        ? {
            currentCountry:
              input.author.currentCountry,
          }
        : {}),

      ...(input.author.city
        ? {
            city:
              input.author.city,
          }
        : {}),

      ...(input.author.state
        ? {
            state:
              input.author.state,
          }
        : {}),

      ...(input.author.website
        ? {
            website:
              input.author.website,
          }
        : {}),
    };


    // ==========================================================
    // FIRESTORE DOCUMENT
    // ==========================================================

    const postData = {

      authorId,

      author,

      topicId,

      topicName:
        input.topicName?.trim() ||
        null,

      title,

      content,

      mediaUrls,

      tags,

      status:
        'published',

      moderationStatus:
        'approved',

      reactionCounts: {

        like: 0,

        love: 0,

        laugh: 0,

        celebrate: 0,

        support: 0,

        helpful: 0,

      },

      commentCount:
        0,

      viewCount:
        0,

      trendingScore:
        0,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

    };


    // ==========================================================
    // CREATE FIRESTORE DOCUMENT
    // ==========================================================

    try {

      const documentReference =
        await addDoc(
          this.postsCollection,
          postData,
        );


      this.logger.info(
        'CommunityPostService',
        'Community post created successfully.',
        {
          postId:
            documentReference.id,

          authorId,

          topicId,
        },
      );


      return documentReference.id;

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to create community post.',
        error,
        {
          authorId,

          topicId,
        },
      );


      throw error;
    }
  }
}
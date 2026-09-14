import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  DocumentData,
  DocumentSnapshot,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
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
   * Firestore cursor used to load the next page.
   */
  lastDocument: DocumentSnapshot<DocumentData> | null;

  /**
   * Indicates whether another page may exist.
   */
  hasMore: boolean;
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
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root',
})
export class CommunityPostService {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  private readonly pageSize = 20;

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
   * Trending uses the denormalized trendingScore field so
   * Firestore can perform the ranking before pagination.
   *
   * The sort mode is kept in the service contract so the
   * CommunityStore does not need to know how Firestore performs
   * the actual query.
   */
  async getPosts(
    options?: {
      topicId?: string | null;

      sortMode?: CommunitySortMode;

      lastDocument?: DocumentSnapshot<DocumentData> | null;
    },
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


    try {

      // --------------------------------------------------------
      // BASE FILTERS
      // --------------------------------------------------------

      const constraints: QueryConstraint[] = [

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
      // OPTIONAL TOPIC FILTER
      // --------------------------------------------------------

      if (topicId) {

        constraints.push(
          where(
            'topicId',
            '==',
            topicId,
          ),
        );
      }


      // --------------------------------------------------------
      // SORTING
      // --------------------------------------------------------

      switch (sortMode) {

        case 'trending':

          /**
           * Trending uses the denormalized trendingScore.
           *
           * The score is calculated by CommunityRankingService
           * and stored on the post document.
           *
           * createdAt provides a deterministic recency
           * tie-breaker when two posts have the same score.
           */
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

          /**
           * Popular currently uses viewCount as its primary
           * popularity signal.
           *
           * Later we can introduce a dedicated popularity score
           * based on reactions, comments, and views.
           */
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


      // ----------------------------------------------------------
      // CURSOR PAGINATION
      // ----------------------------------------------------------

      if (
        options?.lastDocument
      ) {

        constraints.push(
          startAfter(
            options.lastDocument,
          ),
        );
      }


      // ----------------------------------------------------------
      // PAGE LIMIT
      // ----------------------------------------------------------

      constraints.push(
        limit(
          this.pageSize,
        ),
      );


      // ----------------------------------------------------------
      // FIRESTORE QUERY
      // ----------------------------------------------------------

      const postsQuery =
        query(
          this.postsCollection,
          ...constraints,
        );


      const snapshot =
        await getDocs(
          postsQuery,
        );


      // ----------------------------------------------------------
      // MAP POSTS
      // ----------------------------------------------------------

      const posts =
        snapshot.docs.map(
          (document) => ({

            id:
              document.id,

            ...document.data(),

          }),
        ) as CommunityPost[];


      // ----------------------------------------------------------
      // PAGINATION
      // ----------------------------------------------------------

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


      // ----------------------------------------------------------
      // SUCCESS LOG
      // ----------------------------------------------------------

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


      // ----------------------------------------------------------
      // RETURN PAGE
      // ----------------------------------------------------------

      return {

        posts,

        lastDocument,

        hasMore,

      };

    } catch (error) {

      // ----------------------------------------------------------
      // ERROR LOG
      // ----------------------------------------------------------

      this.logger.error(
        'CommunityPostService',
        'Failed to load community posts.',
        error,
        {
          topicId,

          sortMode,
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


      if (!snapshot.exists()) {

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
   *
   * The Firestore document mirrors the CommunityPost model:
   *
   * - author
   * - topic
   * - content
   * - tags
   * - media
   * - status
   * - moderationStatus
   * - reactionCounts
   * - commentCount
   * - viewCount
   * - trendingScore
   * - timestamps
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


    if (title.length > 200) {

      throw new Error(
        'Post title cannot exceed 200 characters.',
      );
    }


    if (!content) {

      throw new Error(
        'Post content is required.',
      );
    }


    if (content.length > 10000) {

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


    if (!input.author?.id?.trim()) {

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

    const author: CommunityPostAuthor = {

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

      // --------------------------------------------------------
      // AUTHOR
      // --------------------------------------------------------

      authorId,

      author,


      // --------------------------------------------------------
      // TOPIC
      // --------------------------------------------------------

      topicId,

      topicName:
        input.topicName?.trim() ||
        null,


      // --------------------------------------------------------
      // CONTENT
      // --------------------------------------------------------

      title,

      content,


      // --------------------------------------------------------
      // OPTIONAL MEDIA
      // --------------------------------------------------------

      mediaUrls,


      // --------------------------------------------------------
      // OPTIONAL TAGS
      // --------------------------------------------------------

      tags,


      // --------------------------------------------------------
      // PUBLICATION STATUS
      // --------------------------------------------------------

      status:
        'published',

      /**
       * MVP behavior:
       *
       * Member-created posts are immediately approved.
       *
       * This can later become "pending" when a moderation
       * workflow is introduced.
       */
      moderationStatus:
        'approved',


      // --------------------------------------------------------
      // REACTION COUNTS
      // --------------------------------------------------------

      reactionCounts: {

        like: 0,

        love: 0,

        laugh: 0,

        celebrate: 0,

        support: 0,

        helpful: 0,

      },


      // --------------------------------------------------------
      // ENGAGEMENT COUNTS
      // --------------------------------------------------------

      commentCount:
        0,

      viewCount:
        0,

      /**
       * Initial Trending score.
       *
       * New posts begin at zero and are subsequently updated
       * by the ranking process.
       */
      trendingScore:
        0,


      // --------------------------------------------------------
      // TIMESTAMPS
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // SUCCESS LOG
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // ERROR LOG
      // --------------------------------------------------------

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


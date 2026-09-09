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
   * Pagination uses a Firestore document cursor so the entire
   * Community feed does not need to be downloaded at once.
   */
  async getPosts(
    options?: {
      topicId?: string | null;
      lastDocument?: DocumentSnapshot<DocumentData> | null;
    },
  ): Promise<CommunityPostPage> {

    try {

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

        orderBy(
          'createdAt',
          'desc',
        ),

        limit(
          this.pageSize,
        ),
      ];


      // ----------------------------------------------------------
      // OPTIONAL TOPIC FILTER
      // ----------------------------------------------------------

      if (
        options?.topicId &&
        options.topicId.trim()
      ) {

        constraints.splice(
          2,
          0,
          where(
            'topicId',
            '==',
            options.topicId.trim(),
          ),
        );
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


      const postsQuery =
        query(
          this.postsCollection,
          ...constraints,
        );


      const snapshot =
        await getDocs(
          postsQuery,
        );


      const posts =
        snapshot.docs.map(
          (document) => ({
            id: document.id,
            ...document.data(),
          }),
        ) as CommunityPost[];


      return {
        posts,

        lastDocument:
          snapshot.docs.length > 0
            ? snapshot.docs[
                snapshot.docs.length - 1
              ]
            : (
                options?.lastDocument ??
                null
              ),

        hasMore:
          snapshot.docs.length ===
          this.pageSize,
      };

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to load community posts.',
        {
          topicId:
            options?.topicId ??
            null,

          error:
            error instanceof Error
              ? error.message
              : String(error),
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
        id: snapshot.id,
        ...snapshot.data(),
      } as CommunityPost;

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to load community post.',
        {
          postId: id,

          error:
            error instanceof Error
              ? error.message
              : String(error),
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
        'Author display name is required.',
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
      id: authorId,

      displayName,

      ...(input.author.photoUrl
        ? {
            photoUrl:
              input.author.photoUrl,
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
       * member-created posts are immediately approved.
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

      commentCount: 0,

      viewCount: 0,


      // --------------------------------------------------------
      // TIMESTAMPS
      // --------------------------------------------------------

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };


    try {

      const documentReference =
        await addDoc(
          this.postsCollection,
          postData,
        );


      return documentReference.id;

    } catch (error) {

      this.logger.error(
        'CommunityPostService',
        'Failed to create community post.',
        {
          authorId,

          topicId,

          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      throw error;
    }
  }
}
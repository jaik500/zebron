import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  CommunityPost,
  CommunityPostStatus,
  CommunityPostType,
} from '../models/community/community-post.model';

import { CommunityCategory } from '../models/community/community-category.model';

import { CommunityComment } from '../models/community/community-comment.model';

import {
  CommunityReportReason,
} from '../models/community/community-report.model';

/**
 * Service responsible for Zebron Community data.
 *
 * Handles:
 * - Community posts
 * - Comments
 * - Categories
 * - Reports
 * - Engagement counters
 *
 * Authorization is NOT trusted to this service alone.
 * Firestore Security Rules must enforce authorization.
 */
@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  /**
   * Firestore collection references.
   */
  private readonly postsCollection = collection(
    firestore,
    'communityPosts',
  );

  private readonly categoriesCollection = collection(
    firestore,
    'communityCategories',
  );

  // ============================================================
  // POSTS
  // ============================================================

  /**
   * Get recently published community posts.
   *
   * Used primarily by the Community dashboard.
   */
  async getRecentPosts(
    maxResults = 20,
  ): Promise<CommunityPost[]> {
    const postsQuery = query(
      this.postsCollection,

      where(
        'status',
        '==',
        'published',
      ),

      orderBy(
        'createdAt',
        'desc',
      ),

      limit(maxResults),
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.map(
      (item) =>
        this.toPost(
          item.id,
          item.data(),
        ),
    );
  }

  /**
   * Get published posts by post type.
   *
   * Examples:
   *
   * discussion
   * question
   * news
   * announcement
   */
  async getPostsByType(
    postType: CommunityPostType,
    maxResults = 20,
  ): Promise<CommunityPost[]> {
    const postsQuery = query(
      this.postsCollection,

      where(
        'status',
        '==',
        'published',
      ),

      where(
        'postType',
        '==',
        postType,
      ),

      orderBy(
        'createdAt',
        'desc',
      ),

      limit(maxResults),
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.map(
      (item) =>
        this.toPost(
          item.id,
          item.data(),
        ),
    );
  }

  /**
   * Get official Zebron communications.
   *
   * This includes:
   *
   * - announcements
   * - news
   * - notices
   */
  async getOfficialPosts(
    maxResults = 10,
  ): Promise<CommunityPost[]> {
    const postsQuery = query(
      this.postsCollection,

      where(
        'status',
        '==',
        'published',
      ),

      where(
        'postType',
        'in',
        [
          'announcement',
          'news',
          'notice',
        ],
      ),

      orderBy(
        'createdAt',
        'desc',
      ),

      limit(maxResults),
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.map(
      (item) =>
        this.toPost(
          item.id,
          item.data(),
        ),
    );
  }

  /**
   * Get featured published posts.
   */
  async getFeaturedPosts(
    maxResults = 10,
  ): Promise<CommunityPost[]> {
    const postsQuery = query(
      this.postsCollection,

      where(
        'status',
        '==',
        'published',
      ),

      where(
        'featured',
        '==',
        true,
      ),

      orderBy(
        'createdAt',
        'desc',
      ),

      limit(maxResults),
    );

    const snapshot = await getDocs(postsQuery);

    return snapshot.docs.map(
      (item) =>
        this.toPost(
          item.id,
          item.data(),
        ),
    );
  }

  /**
   * Get a single community post.
   */
  async getPost(
    postId: string,
  ): Promise<CommunityPost | null> {
    const postRef = doc(
      firestore,
      'communityPosts',
      postId,
    );

    const snapshot = await getDoc(
      postRef,
    );

    if (!snapshot.exists()) {
      return null;
    }

    return this.toPost(
      snapshot.id,
      snapshot.data(),
    );
  }

  /**
   * Create a community post.
   *
   * Students can normally create:
   *
   * - discussion
   * - question
   *
   * Administrators can create additional
   * official content types.
   */
  async createPost(input: {
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
  }): Promise<string> {
    const title =
      input.title.trim();

    const content =
      input.content.trim();

    if (!title) {
      throw new Error(
        'Post title is required.',
      );
    }

    if (!content) {
      throw new Error(
        'Post content is required.',
      );
    }

    const status =
      input.status ??
      'published';

    const postRef =
      await addDoc(
        this.postsCollection,
        {
          title,

          content,

          authorId:
            input.authorId,

          authorName:
            input.authorName,

          authorPhotoUrl:
            input.authorPhotoUrl ??
            '',

          postType:
            input.postType,

          categoryId:
            input.categoryId ??
            '',

          /**
           * New posts are not automatically
           * featured, pinned, or important.
           */
          featured: false,

          pinned: false,

          important: false,

          status,

          allowComments:
            input.allowComments ??
            true,

          viewCount: 0,

          likeCount: 0,

          commentCount: 0,

          tags:
            this.normalizeTags(
              input.tags ??
              [],
            ),

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          ...(status === 'published'
            ? {
                publishedAt:
                  serverTimestamp(),
              }
            : {}),
        },
      );

    return postRef.id;
  }

  /**
   * Update an existing community post.
   */
  async updatePost(
    postId: string,

    updates: Partial<{
      title: string;

      content: string;

      categoryId: string;

      tags: string[];

      allowComments: boolean;

      status: CommunityPostStatus;

      featured: boolean;

      pinned: boolean;

      important: boolean;
    }>,
  ): Promise<void> {
    const postRef =
      doc(
        firestore,
        'communityPosts',
        postId,
      );

    const payload:
      Record<string, unknown> = {
        updatedAt:
          serverTimestamp(),
      };

    // ----------------------------------------------------------
    // TITLE
    // ----------------------------------------------------------

    if (
      updates.title !==
      undefined
    ) {
      const title =
        updates.title.trim();

      if (!title) {
        throw new Error(
          'Post title is required.',
        );
      }

      payload['title'] =
        title;
    }

    // ----------------------------------------------------------
    // CONTENT
    // ----------------------------------------------------------

    if (
      updates.content !==
      undefined
    ) {
      const content =
        updates.content.trim();

      if (!content) {
        throw new Error(
          'Post content is required.',
        );
      }

      payload['content'] =
        content;
    }

    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    if (
      updates.categoryId !==
      undefined
    ) {
      payload['categoryId'] =
        updates.categoryId;
    }

    // ----------------------------------------------------------
    // TAGS
    // ----------------------------------------------------------

    if (
      updates.tags !==
      undefined
    ) {
      payload['tags'] =
        this.normalizeTags(
          updates.tags,
        );
    }

    // ----------------------------------------------------------
    // COMMENTS
    // ----------------------------------------------------------

    if (
      updates.allowComments !==
      undefined
    ) {
      payload['allowComments'] =
        updates.allowComments;
    }

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (
      updates.status !==
      undefined
    ) {
      payload['status'] =
        updates.status;

      if (
        updates.status ===
        'published'
      ) {
        payload['publishedAt'] =
          serverTimestamp();
      }
    }

    // ----------------------------------------------------------
    // ADMIN FLAGS
    // ----------------------------------------------------------

    if (
      updates.featured !==
      undefined
    ) {
      payload['featured'] =
        updates.featured;
    }

    if (
      updates.pinned !==
      undefined
    ) {
      payload['pinned'] =
        updates.pinned;
    }

    if (
      updates.important !==
      undefined
    ) {
      payload['important'] =
        updates.important;
    }

    await updateDoc(
      postRef,
      payload,
    );
  }

  /**
   * Increment a post's view count.
   */
  async incrementViewCount(
    postId: string,
  ): Promise<void> {
    const postRef =
      doc(
        firestore,
        'communityPosts',
        postId,
      );

    await updateDoc(
      postRef,
      {
        viewCount:
          increment(1),
      },
    );
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  /**
   * Create a comment.
   */
  async createComment(input: {
    postId: string;

    authorId: string;

    authorName: string;

    authorPhotoUrl?: string;

    content: string;
  }): Promise<string> {
    const content =
      input.content.trim();

    if (!content) {
      throw new Error(
        'Comment content is required.',
      );
    }

    const commentsCollection =
      collection(
        firestore,
        'communityComments',
      );

    const commentRef =
      await addDoc(
        commentsCollection,
        {
          postId:
            input.postId,

          authorId:
            input.authorId,

          authorName:
            input.authorName,

          authorPhotoUrl:
            input.authorPhotoUrl ??
            '',

          content,

          status:
            'published',

          likeCount: 0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

    /**
     * Keep the post comment counter
     * synchronized with the new comment.
     */
    const postRef =
      doc(
        firestore,
        'communityPosts',
        input.postId,
      );

    await updateDoc(
      postRef,
      {
        commentCount:
          increment(1),

        updatedAt:
          serverTimestamp(),
      },
    );

    return commentRef.id;
  }

  /**
   * Get published comments for a post.
   */
  async getComments(
    postId: string,
  ): Promise<CommunityComment[]> {
    const commentsCollection =
      collection(
        firestore,
        'communityComments',
      );

    const commentsQuery =
      query(
        commentsCollection,

        where(
          'postId',
          '==',
          postId,
        ),

        where(
          'status',
          '==',
          'published',
        ),

        orderBy(
          'createdAt',
          'asc',
        ),
      );

    const snapshot =
      await getDocs(
        commentsQuery,
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      }),
    ) as CommunityComment[];
  }

  // ============================================================
  // REPORTS
  // ============================================================

  /**
   * Report a post or comment.
   *
   * At least one of postId or commentId must
   * be supplied.
   */
  async reportContent(input: {
    postId?: string;

    commentId?: string;

    reportedBy: string;

    reason: CommunityReportReason;

    description?: string;
  }): Promise<string> {
    if (
      !input.postId &&
      !input.commentId
    ) {
      throw new Error(
        'A post or comment must be specified.',
      );
    }

    const reportsCollection =
      collection(
        firestore,
        'communityReports',
      );

    const reportRef =
      await addDoc(
        reportsCollection,
        {
          postId:
            input.postId ??
            '',

          commentId:
            input.commentId ??
            '',

          reportedBy:
            input.reportedBy,

          reason:
            input.reason,

          description:
            input.description?.trim() ??
            '',

          status:
            'pending',

          createdAt:
            serverTimestamp(),
        },
      );

    return reportRef.id;
  }

  // ============================================================
  // CATEGORIES
  // ============================================================

  /**
   * Get active community categories.
   */
  async getActiveCategories():
    Promise<CommunityCategory[]> {
    const categoriesQuery =
      query(
        this.categoriesCollection,

        where(
          'active',
          '==',
          true,
        ),

        orderBy(
          'sortOrder',
          'asc',
        ),
      );

    const snapshot =
      await getDocs(
        categoriesQuery,
      );

    return snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      }),
    ) as CommunityCategory[];
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Convert Firestore data into a strongly typed
   * CommunityPost object.
   *
   * Defaults are provided so older/incomplete
   * documents do not immediately break the UI.
   */
  private toPost(
    id: string,

    data: Record<string, unknown>,
  ): CommunityPost {
    return {
      id,

      title:
        String(
          data['title'] ??
          '',
        ),

      content:
        String(
          data['content'] ??
          '',
        ),

      authorId:
        String(
          data['authorId'] ??
          '',
        ),

      authorName:
        String(
          data['authorName'] ??
          'Zebron Member',
        ),

      authorPhotoUrl:
        String(
          data['authorPhotoUrl'] ??
          '',
        ),

      postType:
        (
          data['postType'] ??
          'discussion'
        ) as CommunityPostType,

      categoryId:
        String(
          data['categoryId'] ??
          '',
        ),

      featured:
        Boolean(
          data['featured'],
        ),

      pinned:
        Boolean(
          data['pinned'],
        ),

      important:
        Boolean(
          data['important'],
        ),

      status:
        (
          data['status'] ??
          'published'
        ) as CommunityPostStatus,

      allowComments:
        data['allowComments'] ===
        undefined
          ? true
          : Boolean(
              data['allowComments'],
            ),

      viewCount:
        Number(
          data['viewCount'] ??
          0,
        ),

      likeCount:
        Number(
          data['likeCount'] ??
          0,
        ),

      commentCount:
        Number(
          data['commentCount'] ??
          0,
        ),

      tags:
        Array.isArray(
          data['tags'],
        )
          ? (
              data['tags'] as string[]
            )
          : [],

      createdAt:
        data['createdAt'] as
          CommunityPost['createdAt'],

      updatedAt:
        data['updatedAt'] as
          CommunityPost['updatedAt'],

      publishedAt:
        data['publishedAt'] as
          CommunityPost['publishedAt'],
    };
  }

  /**
   * Normalize tags before saving them.
   *
   * This:
   * - trims whitespace
   * - converts tags to lowercase
   * - removes empty tags
   * - removes duplicates
   */
  private normalizeTags(
    tags: string[],
  ): string[] {
    return [
      ...new Set(
        tags
          .map(
            (tag) =>
              tag
                .trim()
                .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ];
  }
}
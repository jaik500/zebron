import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  CommunityComment,
  CommunityCommentStatus,
} from '../models/community-comment.model';

import {
  CommunityReactionType,
} from '../models/community-reaction.model';


// ============================================================
// CREATE COMMENT INPUT
// ============================================================

export interface CreateCommunityCommentInput {
  postId: string;

  /**
   * null/undefined = top-level comment.
   *
   * A comment ID = reply to that comment.
   */
  parentCommentId?: string | null;

  authorId: string;

  author: {
    id: string;
    displayName: string;
    photoUrl?: string;
  };

  content: string;
}


// ============================================================
// COMMENT PAGE
// ============================================================

export interface CommunityCommentPage {
  comments: CommunityComment[];
}


// ============================================================
// SERVICE
// ============================================================

@Injectable({
  providedIn: 'root',
})
export class CommunityCommentService {

  private readonly pageSize = 30;


  // ============================================================
  // COMMENTS COLLECTION
  // ============================================================

  private commentsCollection(
    postId: string,
  ) {
    return collection(
      firestore,
      'communityPosts',
      postId,
      'comments',
    );
  }


  // ============================================================
  // POST DOCUMENT
  // ============================================================

  private postDocument(
    postId: string,
  ) {
    return doc(
      firestore,
      'communityPosts',
      postId,
    );
  }


  // ============================================================
  // COMMENT DOCUMENT
  // ============================================================

  private commentDocument(
    postId: string,
    commentId: string,
  ) {
    return doc(
      firestore,
      'communityPosts',
      postId,
      'comments',
      commentId,
    );
  }


  // ============================================================
  // COMMENT REACTION DOCUMENT
  // ============================================================

  /**
   * Each user gets one reaction document per comment.
   *
   * Path:
   *
   * communityPosts/{postId}/comments/{commentId}/reactions/{userId}
   */
  private commentReactionDocument(
    postId: string,
    commentId: string,
    userId: string,
  ) {
    return doc(
      firestore,
      'communityPosts',
      postId,
      'comments',
      commentId,
      'reactions',
      userId,
    );
  }


  // ============================================================
  // GET COMMENTS
  // ============================================================

  async getComments(
    postId: string,
  ): Promise<CommunityCommentPage> {

    const id =
      postId.trim();

    if (!id) {
      throw new Error(
        'Post ID is required.',
      );
    }


    const commentsQuery =
      query(
        this.commentsCollection(id),

        where(
          'status',
          '==',
          'published',
        ),

        orderBy(
          'createdAt',
          'asc',
        ),

        limit(
          this.pageSize,
        ),
      );


    const snapshot =
      await getDocs(
        commentsQuery,
      );


    const comments =
      snapshot.docs.map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as CommunityComment,
      );


    return {
      comments,
    };
  }


  // ============================================================
  // CREATE COMMENT
  // ============================================================

  async createComment(
    input: CreateCommunityCommentInput,
  ): Promise<string> {

    const postId =
      input.postId.trim();

    const content =
      input.content.trim();


    if (!postId) {
      throw new Error(
        'Post ID is required.',
      );
    }


    if (!input.authorId.trim()) {
      throw new Error(
        'Author ID is required.',
      );
    }


    if (!content) {
      throw new Error(
        'Comment cannot be empty.',
      );
    }


    if (content.length > 2000) {
      throw new Error(
        'Comment cannot exceed 2,000 characters.',
      );
    }


    const parentCommentId =
      input.parentCommentId?.trim() || null;


    /*
     * A batch ensures that the comment and the
     * post comment count are written together.
     */
    const batch =
      writeBatch(firestore);


    const commentReference =
      doc(
        this.commentsCollection(postId),
      );


    batch.set(
      commentReference,
      {
        postId,

        parentCommentId,

        authorId:
          input.authorId,

        author: {
          id:
            input.author.id,

          displayName:
            input.author.displayName?.trim() ||
            'Zebron Community Member',

          photoUrl:
            input.author.photoUrl ??
            null,
        },

        content,

        reactionCounts:
          {},

        status:
          'published' as CommunityCommentStatus,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );


    /*
     * Increment the denormalized comment count
     * on the parent post.
     *
     * This counts both top-level comments and replies.
     */
    batch.update(
      this.postDocument(postId),
      {
        commentCount:
          increment(1),

        updatedAt:
          serverTimestamp(),
      },
    );


    await batch.commit();


    return commentReference.id;
  }


  // ============================================================
  // GET USER COMMENT REACTION
  // ============================================================

  async getUserReaction(
    postId: string,
    commentId: string,
    userId: string,
  ): Promise<CommunityReactionType | null> {

    const post =
      postId.trim();

    const comment =
      commentId.trim();

    const user =
      userId.trim();


    if (!post || !comment || !user) {
      return null;
    }


    const reactionReference =
      this.commentReactionDocument(
        post,
        comment,
        user,
      );


    const reactionSnapshot =
      await getDoc(
        reactionReference,
      );


    if (!reactionSnapshot.exists()) {
      return null;
    }


    const data =
      reactionSnapshot.data();


    const type =
      data['type'];


    if (
      type !== 'like' &&
      type !== 'love' &&
      type !== 'laugh' &&
      type !== 'celebrate' &&
      type !== 'support' &&
      type !== 'helpful'
    ) {
      return null;
    }


    return type as CommunityReactionType;
  }


  // ============================================================
  // TOGGLE COMMENT REACTION
  // ============================================================

  async toggleReaction(
    postId: string,
    commentId: string,
    userId: string,
    type: CommunityReactionType = 'like',
  ): Promise<CommunityReactionType | null> {

    const post =
      postId.trim();

    const comment =
      commentId.trim();

    const user =
      userId.trim();


    if (!post) {
      throw new Error(
        'Post ID is required.',
      );
    }


    if (!comment) {
      throw new Error(
        'Comment ID is required.',
      );
    }


    if (!user) {
      throw new Error(
        'User ID is required.',
      );
    }


    const commentReference =
      this.commentDocument(
        post,
        comment,
      );


    const reactionReference =
      this.commentReactionDocument(
        post,
        comment,
        user,
      );


    /*
     * Read the user's current reaction.
     */
    const existingReaction =
      await getDoc(
        reactionReference,
      );


    /*
     * ==========================================================
     * REMOVE EXISTING REACTION
     * ==========================================================
     */

    if (existingReaction.exists()) {

      const existingData =
        existingReaction.data();


      const existingType =
        existingData['type'];


      /*
       * Only decrement known reaction types.
       */
      const validExistingType =
        existingType === 'like' ||
        existingType === 'love' ||
        existingType === 'laugh' ||
        existingType === 'celebrate' ||
        existingType === 'support' ||
        existingType === 'helpful'
          ? existingType as CommunityReactionType
          : null;


      const batch =
        writeBatch(firestore);


      /*
       * Remove the user's reaction.
       */
      batch.delete(
        reactionReference,
      );


      /*
       * Decrement the aggregate count.
       */
      if (validExistingType) {
        batch.update(
          commentReference,
          {
            [`reactionCounts.${validExistingType}`]:
              increment(-1),

            updatedAt:
              serverTimestamp(),
          },
        );
      } else {
        batch.update(
          commentReference,
          {
            updatedAt:
              serverTimestamp(),
          },
        );
      }


      await batch.commit();


      return null;
    }


    /*
     * ==========================================================
     * CREATE NEW REACTION
     * ==========================================================
     */

    const batch =
      writeBatch(firestore);


    /*
     * Store one reaction per user.
     */
    batch.set(
      reactionReference,
      {
        userId:
          user,

        type,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );


    /*
     * Increment aggregate reaction count.
     */
    batch.update(
      commentReference,
      {
        [`reactionCounts.${type}`]:
          increment(1),

        updatedAt:
          serverTimestamp(),
      },
    );


    await batch.commit();


    return type;
  }


  // ============================================================
  // DELETE COMMENT
  // ============================================================

  async deleteComment(
    postId: string,
    commentId: string,
  ): Promise<void> {

    const post =
      postId.trim();

    const comment =
      commentId.trim();


    if (!post) {
      throw new Error(
        'Post ID is required.',
      );
    }


    if (!comment) {
      throw new Error(
        'Comment ID is required.',
      );
    }


    const batch =
      writeBatch(firestore);


    const commentReference =
      this.commentDocument(
        post,
        comment,
      );


    batch.delete(
      commentReference,
    );


    /*
     * Keep the denormalized post comment count
     * synchronized with the actual comment deletion.
     */
    batch.update(
      this.postDocument(post),
      {
        commentCount:
          increment(-1),

        updatedAt:
          serverTimestamp(),
      },
    );


    await batch.commit();
  }
}
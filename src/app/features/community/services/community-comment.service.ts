import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  CommunityComment,
  CommunityCommentStatus,
} from '../models/community-comment.model';

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

export interface CommunityCommentPage {
  comments: CommunityComment[];
}

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
      doc(
        firestore,
        'communityPosts',
        post,
        'comments',
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
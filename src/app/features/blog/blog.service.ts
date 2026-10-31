import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';

import {
  BlogComment,
  BlogContext,
  BlogPost,
  BlogReactionType,
  BLOG_REACTIONS,
} from './blog.model';

const FEED_LIMIT = 60;
const MANAGE_LIMIT = 100;
const COMMENT_LIMIT = 200;

/**
 * Firestore access for the blog. Public and internal posts live in the
 * top-level `blogPosts` collection (told apart by `section`); organization
 * posts live under organizations/{id}/blogPosts. Queries always repeat the
 * fields the security rules check, so they can be proven allowed.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private posts(context: BlogContext): CollectionReference {
    return context.section === 'organization' && context.organizationId
      ? collection(firestore, 'organizations', context.organizationId, 'blogPosts')
      : collection(firestore, 'blogPosts');
  }

  private toPost(id: string, data: Record<string, unknown>): BlogPost {
    return {
      id,
      section: (data['section'] as BlogPost['section']) ?? 'public',
      organizationId: (data['organizationId'] as string | null) ?? null,
      title: String(data['title'] ?? ''),
      excerpt: String(data['excerpt'] ?? ''),
      content: String(data['content'] ?? ''),
      topic: String(data['topic'] ?? ''),
      cover: (data['cover'] as BlogPost['cover']) ?? 'teal',
      pinned: data['pinned'] === true,
      readingMinutes: Number(data['readingMinutes'] ?? 1),
      status: (data['status'] as BlogPost['status']) ?? 'draft',
      reviewNote: (data['reviewNote'] as string | null) ?? null,
      authorId: String(data['authorId'] ?? ''),
      authorName: String(data['authorName'] ?? ''),
      createdAt: (data['createdAt'] as Timestamp | null) ?? null,
      updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
      publishedAt: (data['publishedAt'] as Timestamp | null) ?? null,
      publishAt: (data['publishAt'] as Timestamp | null) ?? null,
    };
  }

  // ============================================================
  // POSTS
  // ============================================================

  /** Published posts, newest first. */
  async listPublished(context: BlogContext): Promise<BlogPost[]> {
    const constraints =
      context.section === 'organization'
        ? [where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(FEED_LIMIT)]
        : [
            where('section', '==', context.section),
            where('status', '==', 'published'),
            orderBy('publishedAt', 'desc'),
            limit(FEED_LIMIT),
          ];

    const snapshot = await getDocs(query(this.posts(context), ...constraints));
    return snapshot.docs.map((document) => this.toPost(document.id, document.data()));
  }

  /** Every post in the section, for Review & manage. */
  async listAll(context: BlogContext): Promise<BlogPost[]> {
    const constraints =
      context.section === 'organization'
        ? [orderBy('updatedAt', 'desc'), limit(MANAGE_LIMIT)]
        : [where('section', '==', context.section), orderBy('updatedAt', 'desc'), limit(MANAGE_LIMIT)];

    const snapshot = await getDocs(query(this.posts(context), ...constraints));
    return snapshot.docs.map((document) => this.toPost(document.id, document.data()));
  }

  async getPost(context: BlogContext, postId: string): Promise<BlogPost | null> {
    const snapshot = await getDoc(doc(this.posts(context), postId));

    if (!snapshot.exists()) {
      return null;
    }

    const post = this.toPost(snapshot.id, snapshot.data());
    return post.section === context.section ? post : null;
  }

  async createPost(context: BlogContext, postId: string, data: Record<string, unknown>): Promise<void> {
    await setDoc(doc(this.posts(context), postId), {
      ...data,
      section: context.section,
      organizationId: context.section === 'organization' ? context.organizationId : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updatePost(context: BlogContext, postId: string, changes: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(this.posts(context), postId), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }

  async deletePost(context: BlogContext, postId: string): Promise<void> {
    await deleteDoc(doc(this.posts(context), postId));
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  private comments(context: BlogContext, postId: string): CollectionReference {
    return collection(doc(this.posts(context), postId), 'comments');
  }

  async listComments(context: BlogContext, postId: string): Promise<BlogComment[]> {
    const snapshot = await getDocs(
      query(this.comments(context, postId), orderBy('createdAt', 'asc'), limit(COMMENT_LIMIT)),
    );

    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        authorId: String(data['authorId'] ?? ''),
        authorName: String(data['authorName'] ?? ''),
        text: String(data['text'] ?? ''),
        createdAt: (data['createdAt'] as Timestamp | null) ?? null,
      };
    });
  }

  async addComment(
    context: BlogContext,
    postId: string,
    comment: { authorId: string; authorName: string; text: string },
  ): Promise<string> {
    const reference = await addDoc(this.comments(context, postId), {
      ...comment,
      createdAt: serverTimestamp(),
    });

    return reference.id;
  }

  async deleteComment(context: BlogContext, postId: string, commentId: string): Promise<void> {
    await deleteDoc(doc(this.comments(context, postId), commentId));
  }

  // ============================================================
  // REACTIONS (one per person: reactions/{userId})
  // ============================================================

  private reactions(context: BlogContext, postId: string): CollectionReference {
    return collection(doc(this.posts(context), postId), 'reactions');
  }

  async reactionCounts(context: BlogContext, postId: string): Promise<Record<BlogReactionType, number>> {
    const entries = await Promise.all(
      BLOG_REACTIONS.map(async ({ type }) => {
        const snapshot = await getCountFromServer(
          query(this.reactions(context, postId), where('type', '==', type)),
        );
        return [type, snapshot.data().count] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<BlogReactionType, number>;
  }

  async myReaction(context: BlogContext, postId: string, userId: string): Promise<BlogReactionType | null> {
    const snapshot = await getDoc(doc(this.reactions(context, postId), userId));
    return snapshot.exists() ? ((snapshot.data()['type'] as BlogReactionType) ?? null) : null;
  }

  async setReaction(
    context: BlogContext,
    postId: string,
    userId: string,
    type: BlogReactionType | null,
  ): Promise<void> {
    const reference = doc(this.reactions(context, postId), userId);

    if (type === null) {
      await deleteDoc(reference);
      return;
    }

    await setDoc(reference, { userId, type, createdAt: serverTimestamp() });
  }
}

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
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firebaseStorage, firestore } from '../../core/services/firebase-config';

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
      coverImage: typeof data['coverImage'] === 'string' && data['coverImage'] ? (data['coverImage'] as string) : null,
      coverImageAlt: String(data['coverImageAlt'] ?? ''),
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
  // IMAGES
  // ============================================================

  /**
   * Upload a photo for a post and return its address. Public and staff
   * posts use blog-images/; an organization's posts use
   * organizations/{id}/blog-images/ (see storage.rules).
   */
  async uploadImage(context: BlogContext, file: File): Promise<string> {
    const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const folder =
      context.section === 'organization' && context.organizationId
        ? `organizations/${context.organizationId}/blog-images`
        : 'blog-images';

    const target = ref(firebaseStorage, `${folder}/${name}`);
    await uploadBytes(target, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
    return getDownloadURL(target);
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

  /**
   * Live feed of the newest published posts in a section: calls onChange
   * now and again whenever a post is published, edited or unpublished.
   * Call the returned function to stop listening.
   */
  watchPublished(
    context: BlogContext,
    count: number,
    onChange: (posts: BlogPost[]) => void,
    onError: (error: unknown) => void = () => undefined,
  ): Unsubscribe {
    const constraints =
      context.section === 'organization'
        ? [where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(count)]
        : [where('section', '==', context.section), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(count)];

    return onSnapshot(
      query(this.posts(context), ...constraints),
      (snapshot) => onChange(snapshot.docs.map((document) => this.toPost(document.id, document.data()))),
      onError,
    );
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

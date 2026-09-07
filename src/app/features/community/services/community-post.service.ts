import { Injectable } from '@angular/core';

import {
  collection,
  DocumentData,
  DocumentSnapshot,
  doc,
  getDocs,
  addDoc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  QueryConstraint,
  startAfter,
  where,
  getDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { CommunityPost } from '../models/community-post.model';

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

@Injectable({
  providedIn: 'root',
})
export class CommunityPostService {
  private readonly pageSize = 20;

  private readonly postsCollection = collection(firestore, 'communityPosts');

  /**
   * Get a page of published community posts.
   *
   * Pagination is cursor-based so the application
   * does not download the entire community feed.
   */
  async getPosts(options?: {
    topicId?: string | null;
    lastDocument?: DocumentSnapshot<DocumentData> | null;
  }): Promise<CommunityPostPage> {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'published'),
      where('moderationStatus', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(this.pageSize),
    ];

    if (options?.topicId) {
      constraints.splice(2, 0, where('topicId', '==', options.topicId));
    }

    if (options?.lastDocument) {
      constraints.push(startAfter(options.lastDocument));
    }

    const postsQuery = query(this.postsCollection, ...constraints);

    const snapshot = await getDocs(postsQuery);

    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CommunityPost[];

    return {
      posts,
      lastDocument:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : (options?.lastDocument ?? null),
      hasMore: snapshot.docs.length === this.pageSize,
    };
  }

  async getPostById(postId: string): Promise<CommunityPost | null> {
    const postReference = doc(firestore, 'communityPosts', postId);

    const snapshot = await getDoc(postReference);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as CommunityPost;
  }

  /**
   * Create a new community post.
   *
   * The service owns Firestore persistence.
   */
  async createPost(input: {
    title: string;
    content: string;
    topicId: string;
    topicName?: string;
    tags?: string[];
    authorId: string;
    authorName: string;
    authorPhotoUrl?: string | null;
  }): Promise<string> {
    const postsCollection = collection(firestore, 'communityPosts');

    const postData = {
      title: input.title.trim(),
      content: input.content.trim(),

      topicId: input.topicId,
      topicName: input.topicName ?? null,

      authorId: input.authorId,
      authorName: input.authorName.trim(),
      authorPhotoUrl: input.authorPhotoUrl ?? null,

      tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),

      // New member-created posts are published immediately
      // for the MVP.
      status: 'published',

      // Normal community member posts are discussions.
      postType: 'discussion',

      featured: false,
      pinned: false,
      important: false,

      allowComments: true,

      viewCount: 0,
      likeCount: 0,
      commentCount: 0,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
    };

    const documentReference = await addDoc(postsCollection, postData);

    return documentReference.id;
  }
}

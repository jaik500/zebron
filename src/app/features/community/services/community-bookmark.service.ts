import { Injectable, inject } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class CommunityBookmarkService {

  private readonly logger = inject(LoggerService);

  private readonly pageSize = 20;

  // ============================================================
  // BOOKMARK DOCUMENT
  // ============================================================

  private bookmarkDocument(
    postId: string,
    userId: string,
  ) {
    return doc(
      firestore,
      'users',
      userId,
      'communityBookmarks',
      postId,
    );
  }

  // ============================================================
  // BOOKMARK COLLECTION
  // ============================================================

  private bookmarkCollection(
    userId: string,
  ) {
    return collection(
      firestore,
      'users',
      userId,
      'communityBookmarks',
    );
  }

  // ============================================================
  // SAVED PAGE
  // ============================================================

  /**
   * Returns one page of post IDs saved by the current user.
   *
   * Bookmarks are ordered by the time they were created so the
   * Saved feed shows the most recently saved posts first.
   */
  async getSavedPostIds(
    userId: string,
    lastDocument:
      DocumentSnapshot<DocumentData> | null = null,
  ): Promise<{
    postIds: string[];
    lastDocument: DocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    const user = userId.trim();

    if (!user) {
      return {
        postIds: [],
        lastDocument: null,
        hasMore: false,
      };
    }

    try {
      const constraints = [
        orderBy(
          'createdAt',
          'desc',
        ),
        ...(lastDocument
          ? [startAfter(lastDocument)]
          : []),
        limit(this.pageSize),
      ];

      const snapshot = await getDocs(
        query(
          this.bookmarkCollection(user),
          ...constraints,
        ),
      );

      const postIds = snapshot.docs
        .map((bookmark) => {
          const data = bookmark.data();

          return typeof data['postId'] === 'string'
            ? data['postId'].trim()
            : bookmark.id.trim();
        })
        .filter(Boolean);

      return {
        postIds,
        lastDocument:
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : lastDocument,
        hasMore:
          snapshot.docs.length === this.pageSize,
      };

    } catch (error) {
      this.logger.error(
        'CommunityBookmarkService',
        'Failed to load saved community posts.',
        {
          userId: user,
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
  // CHECK BOOKMARK
  // ============================================================

  async isBookmarked(
    postId: string,
    userId: string,
  ): Promise<boolean> {

    const post = postId.trim();
    const user = userId.trim();

    if (!post || !user) {
      return false;
    }

    const snapshot = await getDoc(
      this.bookmarkDocument(post, user),
    );

    return snapshot.exists();
  }

  // ============================================================
  // TOGGLE BOOKMARK
  // ============================================================

  async toggleBookmark(
    postId: string,
    userId: string,
  ): Promise<boolean> {

    const post = postId.trim();
    const user = userId.trim();

    if (!post) {
      throw new Error('Post ID is required.');
    }

    if (!user) {
      throw new Error('User ID is required.');
    }

    const bookmarkReference =
      this.bookmarkDocument(post, user);

    try {

      const existing =
        await getDoc(bookmarkReference);

      if (existing.exists()) {

        await deleteDoc(
          bookmarkReference,
        );

        return false;
      }

      await setDoc(
        bookmarkReference,
        {
          postId: post,
          userId: user,
          createdAt: serverTimestamp(),
        },
      );

      return true;

    } catch (error) {

      this.logger.error(
        'CommunityBookmarkService',
        'Failed to toggle community post bookmark.',
        {
          postId: post,
          userId: user,
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

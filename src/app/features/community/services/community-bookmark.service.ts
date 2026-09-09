import { Injectable, inject } from '@angular/core';

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class CommunityBookmarkService {

  private readonly logger = inject(LoggerService);

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
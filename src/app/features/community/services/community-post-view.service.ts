import { Injectable, inject } from '@angular/core';

import { doc, increment, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Tracks authenticated community post views.
 *
 * View strategy:
 * - A user can generate one counted view for a post
 *   within a 24-hour window.
 * - The user's view record is stored under the post.
 * - The post's denormalized viewCount is incremented
 *   atomically with the view record update.
 *
 * Firestore structure:
 *
 * communityPosts/{postId}/views/{userId}
 *
 * Example view document:
 *
 * {
 *   userId: 'abc123',
 *   lastViewedAt: Timestamp
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class CommunityPostViewService {
  private readonly logger = inject(LoggerService);

  private readonly postsCollection = 'communityPosts';
  private readonly viewsCollection = 'views';

  /**
   * Number of milliseconds in the view cooldown window.
   *
   * A user can count as a new view again after 24 hours.
   */
  private readonly viewCooldownMilliseconds = 24 * 60 * 60 * 1000;

  // ================================================================
  // PUBLIC API
  // ================================================================

  /**
   * Records a view for a community post.
   *
   * Returns true when the view was counted.
   * Returns false when the view was ignored because
   * the user already viewed the post within the cooldown window.
   */
  async recordView(postId: string, userId: string): Promise<boolean> {
    const post = postId.trim();
    const user = userId.trim();

    if (!post) {
      throw new Error('Post ID is required.');
    }

    if (!user) {
      throw new Error('User ID is required.');
    }

    const postReference = this.postDocument(post);
    const viewReference = this.viewDocument(post, user);

    try {
      const counted = await runTransaction(firestore, async (transaction) => {
        /*
         * Read both documents before performing any writes.
         *
         * This keeps the decision and the counter update
         * inside the same Firestore transaction.
         */
        const [postSnapshot, viewSnapshot] = await Promise.all([
          transaction.get(postReference),
          transaction.get(viewReference),
        ]);

        if (!postSnapshot.exists()) {
          throw new Error('Post could not be found.');
        }

        const now = Date.now();

        /*
         * If a previous view exists, determine whether
         * the 24-hour cooldown has expired.
         */
        if (viewSnapshot.exists()) {
          const viewData = viewSnapshot.data();

          const lastViewedAt = this.getTimestamp(viewData['lastViewedAt']);

          if (lastViewedAt) {
            const elapsed = now - lastViewedAt.toDate().getTime();

            if (elapsed < this.viewCooldownMilliseconds) {
              return false;
            }
          }
        }

        /*
         * Count the view and update the user's
         * last-viewed timestamp atomically.
         */
        transaction.update(postReference, {
          viewCount: increment(1),
          updatedAt: serverTimestamp(),
        });

        transaction.set(
          viewReference,
          {
            userId: user,
            lastViewedAt: serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        return true;
      });

      if (counted) {
        this.logger.info('CommunityPostViewService', 'Community post view recorded.', {
          postId: post,
        });
      }

      return counted;
    } catch (error) {
      this.logger.error(
        'CommunityPostViewService',
        'Failed to record community post view.',
        error,
        {
          postId: post,
        },
      );

      throw error;
    }
  }

  // ================================================================
  // FIRESTORE REFERENCES
  // ================================================================

  /**
   * Returns the community post document reference.
   */
  private postDocument(postId: string) {
    return doc(firestore, this.postsCollection, postId);
  }

  /**
   * Returns the per-user view document reference.
   *
   * Path:
   *
   * communityPosts/{postId}/views/{userId}
   */
  private viewDocument(postId: string, userId: string) {
    return doc(firestore, this.postsCollection, postId, this.viewsCollection, userId);
  }

  // ================================================================
  // HELPERS
  // ================================================================

  /**
   * Safely converts a Firestore value into a Timestamp.
   *
   * This protects the view-tracking logic from malformed
   * or unexpected values in an existing view document.
   */
  private getTimestamp(value: unknown): Timestamp | null {
    if (value instanceof Timestamp) {
      return value;
    }

    return null;
  }
}

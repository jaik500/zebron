import { Injectable, inject } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

import { CommunityReaction, CommunityReactionType } from '../models/community-reaction.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityReactionService {
  private readonly logger = inject(LoggerService);

  private readonly postsCollection = 'communityPosts';
  private readonly reactionsCollection = 'reactions';

  /**
   * Add, change, or remove a user's reaction to a post.
   *
   * The reaction document is stored at:
   *
   * communityPosts/{postId}/reactions/{userId}
   *
   * This guarantees one active reaction per user per post.
   */
  async toggleReaction(
    postId: string,
    userId: string,
    type: CommunityReactionType,
  ): Promise<CommunityReactionType | null> {
    this.validateInput(postId, userId, type);

    const postReference = doc(firestore, this.postsCollection, postId);

    const reactionReference = doc(
      firestore,
      this.postsCollection,
      postId,
      this.reactionsCollection,
      userId,
    );

    try {
      return await runTransaction(firestore, async (transaction) => {
        const postSnapshot = await transaction.get(postReference);

        if (!postSnapshot.exists()) {
          throw new Error('Community post not found.');
        }

        const reactionSnapshot = await transaction.get(reactionReference);

        const existingReaction = reactionSnapshot.exists()
          ? (reactionSnapshot.data() as Partial<CommunityReaction>)
          : null;

        const existingType = existingReaction?.type ?? null;

        /*
         * --------------------------------------------------------
         * Existing reaction matches requested reaction.
         *
         * Remove it.
         * --------------------------------------------------------
         */
        if (existingType === type) {
          transaction.delete(reactionReference);

          transaction.update(postReference, {
            [`reactionCounts.${type}`]: increment(-1),
            updatedAt: serverTimestamp(),
          });

          return null;
        }

        /*
         * --------------------------------------------------------
         * User is changing from one reaction to another.
         * --------------------------------------------------------
         */
        if (existingType) {
          transaction.set(
            reactionReference,
            {
              id: userId,
              postId,
              userId,
              type,
              createdAt: existingReaction?.createdAt ?? serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          transaction.update(postReference, {
            [`reactionCounts.${existingType}`]: increment(-1),

            [`reactionCounts.${type}`]: increment(1),

            updatedAt: serverTimestamp(),
          });

          return type;
        }

        /*
         * --------------------------------------------------------
         * New reaction.
         * --------------------------------------------------------
         */
        transaction.set(reactionReference, {
          id: userId,
          postId,
          userId,
          type,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.update(postReference, {
          [`reactionCounts.${type}`]: increment(1),
          updatedAt: serverTimestamp(),
        });

        return type;
      });
    } catch (error) {
      this.logger.error(
        'Failed to toggle community post reaction.',
        error instanceof Error ? error.message : String(error),
        {
          feature: 'community',
          action: 'reaction.toggle',
          postId,
          userId,
          reactionType: type,
        },
      );

      throw error;
    }
  }

  /**
   * Get the current user's reaction for a post.
   */
  async getUserReaction(postId: string, userId: string): Promise<CommunityReaction | null> {
    this.validateIdentifiers(postId, userId);

    const reactionReference = doc(
      firestore,
      this.postsCollection,
      postId,
      this.reactionsCollection,
      userId,
    );

    try {
      const snapshot = await getDoc(reactionReference);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as CommunityReaction;
    } catch (error) {
      this.logger.error(
        'Failed to load community post reaction.',
        error instanceof Error ? error.message : String(error),
        {
          feature: 'community',
          action: 'reaction.get',
          postId,
          userId,
        },
      );

      throw error;
    }
  }

  /**
   * Remove the current user's reaction.
   *
   * This is useful when the UI needs an explicit
   * "remove reaction" operation instead of toggle behavior.
   */
  async removeReaction(postId: string, userId: string): Promise<void> {
    this.validateIdentifiers(postId, userId);

    const postReference = doc(firestore, this.postsCollection, postId);

    const reactionReference = doc(
      firestore,
      this.postsCollection,
      postId,
      this.reactionsCollection,
      userId,
    );

    try {
      await runTransaction(firestore, async (transaction) => {
        const reactionSnapshot = await transaction.get(reactionReference);

        if (!reactionSnapshot.exists()) {
          return;
        }

        const reaction = reactionSnapshot.data() as Partial<CommunityReaction>;

        const reactionType = reaction.type;

        transaction.delete(reactionReference);

        if (reactionType) {
          transaction.update(postReference, {
            [`reactionCounts.${reactionType}`]: increment(-1),

            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      this.logger.error(
        'Failed to remove community post reaction.',
        error instanceof Error ? error.message : String(error),
        {
          feature: 'community',
          action: 'reaction.remove',
          postId,
          userId,
        },
      );

      throw error;
    }
  }

  /**
   * Validate post/user identifiers.
   */
  private validateIdentifiers(postId: string, userId: string): void {
    if (!postId.trim()) {
      throw new Error('Post ID is required.');
    }

    if (!userId.trim()) {
      throw new Error('User ID is required.');
    }
  }

  /**
   * Validate reaction input.
   */
  private validateInput(postId: string, userId: string, type: CommunityReactionType): void {
    this.validateIdentifiers(postId, userId);

    const validTypes: CommunityReactionType[] = [
      'like',
      'love',
      'laugh',
      'celebrate',
      'support',
      'helpful',
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Unsupported community reaction type: ${type}`);
    }
  }
}

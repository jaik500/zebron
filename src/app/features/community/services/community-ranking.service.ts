
import { Injectable, inject } from '@angular/core';

import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

import { CommunityPost } from '../models/community-post.model';

/**
 * Centralized ranking service for Community posts.
 *
 * Responsibilities:
 * - Calculate a deterministic Trending score.
 * - Persist a calculated score when explicitly requested.
 *
 * Engagement services remain responsible for maintaining:
 * - reactionCounts
 * - commentCount
 * - viewCount
 *
 * This service owns the ranking formula so ranking logic
 * does not become duplicated across those services.
 */
@Injectable({
  providedIn: 'root',
})
export class CommunityRankingService {
  private readonly logger =
    inject(LoggerService);

  private readonly postsCollection =
    'communityPosts';

  // ================================================================
  // RANKING WEIGHTS
  // ================================================================

  /**
   * Reactions indicate stronger engagement than views.
   */
  private readonly reactionWeight = 3;

  /**
   * Comments represent deeper engagement than
   * a simple post view.
   */
  private readonly commentWeight = 5;

  /**
   * Views provide a lower-weight engagement signal.
   */
  private readonly viewWeight = 1;

  /**
   * Posts receive additional points based on
   * how recently they were created.
   */
  private readonly recencyWindowDays = 30;

  /**
   * Maximum number of points contributed by recency.
   */
  private readonly maximumRecencyScore = 100;

  // ================================================================
  // CALCULATE SCORE
  // ================================================================

  /**
   * Calculate the current Trending score for a post.
   *
   * Formula:
   *
   *   reactions × 3
   * + comments × 5
   * + views × 1
   * + recency bonus
   */
  calculateTrendingScore(
    post: CommunityPost,
    now: Date = new Date(),
  ): number {
    const reactionTotal =
      this.getReactionTotal(post);

    const commentCount =
      Math.max(
        0,
        post.commentCount ?? 0,
      );

    const viewCount =
      Math.max(
        0,
        post.viewCount ?? 0,
      );

    const recencyScore =
      this.calculateRecencyScore(
        post,
        now,
      );

    const engagementScore =
      reactionTotal *
        this.reactionWeight +
      commentCount *
        this.commentWeight +
      viewCount *
        this.viewWeight;

    return Math.max(
      0,
      engagementScore +
        recencyScore,
    );
  }

  // ================================================================
  // PERSIST SCORE
  // ================================================================

  /**
   * Recalculate and persist the Trending score
   * for a specific post.
   *
   * The latest Firestore post document is read first
   * so the calculation uses the current engagement
   * counters rather than a potentially stale object
   * held by the UI.
   */
  async updateTrendingScore(
    postId: string,
  ): Promise<number> {
    const id = postId.trim();

    if (!id) {
      throw new Error(
        'Post ID is required.',
      );
    }

    const postReference =
      doc(
        firestore,
        this.postsCollection,
        id,
      );

    try {
      const snapshot =
        await getDoc(
          postReference,
        );

      if (!snapshot.exists()) {
        throw new Error(
          'Community post not found.',
        );
      }

      const post = {
        id: snapshot.id,
        ...snapshot.data(),
      } as CommunityPost;

      const score =
        this.calculateTrendingScore(
          post,
        );

      await updateDoc(
        postReference,
        {
          trendingScore: score,
          updatedAt: serverTimestamp(),
        },
      );

      this.logger.info(
        'CommunityRankingService',
        'Community post Trending score updated.',
        {
          postId: id,
          trendingScore: score,
        },
      );

      return score;
    } catch (error) {
      this.logger.error(
        'CommunityRankingService',
        'Failed to update community post Trending score.',
        error,
        {
          postId: id,
        },
      );

      throw error;
    }
  }

  // ================================================================
  // REACTION TOTAL
  // ================================================================

  /**
   * Calculate the total number of reactions
   * across all supported reaction types.
   */
  private getReactionTotal(
    post: CommunityPost,
  ): number {
    if (!post.reactionCounts) {
      return 0;
    }

    return Object.values(
      post.reactionCounts,
    ).reduce(
      (total, count) =>
        total +
        Math.max(
          0,
          Number(count) || 0,
        ),
      0,
    );
  }

  // ================================================================
  // RECENCY
  // ================================================================

  /**
   * Calculate the recency contribution.
   *
   * A post receives the maximum recency score
   * when it is brand new and gradually loses the
   * bonus over 30 days.
   */
  private calculateRecencyScore(
    post: CommunityPost,
    now: Date,
  ): number {
    if (!post.createdAt) {
      return 0;
    }

    const createdAt =
      post.createdAt.toDate();

    const ageMilliseconds =
      Math.max(
        0,
        now.getTime() -
          createdAt.getTime(),
      );

    const ageDays =
      ageMilliseconds /
      (1000 * 60 * 60 * 24);

    if (
      ageDays >=
      this.recencyWindowDays
    ) {
      return 0;
    }

    const recencyRatio =
      1 -
      ageDays /
        this.recencyWindowDays;

    return (
      recencyRatio *
      this.maximumRecencyScore
    );
  }
}


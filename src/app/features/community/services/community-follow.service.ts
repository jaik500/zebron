import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { CommunityFollow } from '../models/community-follow.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityFollowService {
  // =============================================================
  // Firestore
  // =============================================================

  private readonly followsCollection = collection(
    firestore,
    'userFollows',
  );


  // =============================================================
  // Follow ID
  // =============================================================

  /**
   * Creates a deterministic follow document ID.
   *
   * Example:
   * followerId = userA
   * followingId = userB
   *
   * Document ID:
   * userA_userB
   */
  private getFollowId(
    followerId: string,
    followingId: string,
  ): string {
    return `${followerId}_${followingId}`;
  }


  // =============================================================
  // Check following status
  // =============================================================

  /**
   * Determine whether one user follows another user.
   */
  async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {

    if (
      !followerId ||
      !followingId ||
      followerId === followingId
    ) {
      return false;
    }

    const followId =
      this.getFollowId(
        followerId,
        followingId,
      );

    const followRef =
      doc(
        firestore,
        'userFollows',
        followId,
      );

    const snapshot =
      await getDoc(followRef);

    return snapshot.exists();
  }


  // =============================================================
  // Follow user
  // =============================================================

  /**
   * Follow another user.
   */
  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<void> {

    if (!followerId || !followingId) {
      throw new Error(
        'Both followerId and followingId are required.',
      );
    }

    if (followerId === followingId) {
      throw new Error(
        'Users cannot follow themselves.',
      );
    }

    const followId =
      this.getFollowId(
        followerId,
        followingId,
      );

    const followRef =
      doc(
        firestore,
        'userFollows',
        followId,
      );

    // Prevent duplicate follows.
    const existingFollow =
      await getDoc(followRef);

    if (existingFollow.exists()) {
      return;
    }

    await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
  }


  // =============================================================
  // Unfollow user
  // =============================================================

  /**
   * Remove an existing follow relationship.
   */
  async unfollowUser(
    followerId: string,
    followingId: string,
  ): Promise<void> {

    if (!followerId || !followingId) {
      throw new Error(
        'Both followerId and followingId are required.',
      );
    }

    const followId =
      this.getFollowId(
        followerId,
        followingId,
      );

    const followRef =
      doc(
        firestore,
        'userFollows',
        followId,
      );

    await deleteDoc(followRef);
  }


  // =============================================================
  // Toggle follow
  // =============================================================

  /**
   * Toggle the follow relationship.
   *
   * Returns:
   * true  = user is now followed
   * false = user is no longer followed
   */
  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {

    if (
      !followerId ||
      !followingId ||
      followerId === followingId
    ) {
      return false;
    }

    const following =
      await this.isFollowing(
        followerId,
        followingId,
      );

    if (following) {

      await this.unfollowUser(
        followerId,
        followingId,
      );

      return false;
    }

    await this.followUser(
      followerId,
      followingId,
    );

    return true;
  }


  // =============================================================
  // Get following
  // =============================================================

  /**
   * Get all users followed by a user.
   */
  async getFollowing(
    followerId: string,
  ): Promise<CommunityFollow[]> {

    if (!followerId) {
      return [];
    }

    const followingQuery =
      query(
        this.followsCollection,
        where(
          'followerId',
          '==',
          followerId,
        ),
      );

    const snapshot =
      await getDocs(followingQuery);

    return snapshot.docs.map(
      (followDoc) => {

        const data =
          followDoc.data();

        return {
          id: followDoc.id,
          followerId:
            data['followerId'] as string,
          followingId:
            data['followingId'] as string,
          createdAt:
            data['createdAt'] ?? null,
        };
      },
    );
  }


  // =============================================================
  // Get followers
  // =============================================================

  /**
   * Get all users who follow a user.
   */
  async getFollowers(
    followingId: string,
  ): Promise<CommunityFollow[]> {

    if (!followingId) {
      return [];
    }

    const followersQuery =
      query(
        this.followsCollection,
        where(
          'followingId',
          '==',
          followingId,
        ),
      );

    const snapshot =
      await getDocs(followersQuery);

    return snapshot.docs.map(
      (followDoc) => {

        const data =
          followDoc.data();

        return {
          id: followDoc.id,
          followerId:
            data['followerId'] as string,
          followingId:
            data['followingId'] as string,
          createdAt:
            data['createdAt'] ?? null,
        };
      },
    );
  }


  // =============================================================
  // Followers preview
  // =============================================================

  /**
   * Get a limited number of followers.
   *
   * Useful for profile summaries and sidebar cards.
   */
  async getFollowersPreview(
    followingId: string,
    maxResults = 5,
  ): Promise<CommunityFollow[]> {

    if (!followingId) {
      return [];
    }

    const followersQuery =
      query(
        this.followsCollection,
        where(
          'followingId',
          '==',
          followingId,
        ),
        limit(maxResults),
      );

    const snapshot =
      await getDocs(followersQuery);

    return snapshot.docs.map(
      (followDoc) => {

        const data =
          followDoc.data();

        return {
          id: followDoc.id,
          followerId:
            data['followerId'] as string,
          followingId:
            data['followingId'] as string,
          createdAt:
            data['createdAt'] ?? null,
        };
      },
    );
  }
}
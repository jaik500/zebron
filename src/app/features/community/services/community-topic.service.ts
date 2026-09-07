import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { CommunityTopic } from '../models/community-topic.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityTopicService {

  // ============================================================
  // FIRESTORE COLLECTION
  // ============================================================

  private readonly topicsCollection =
    collection(
      firestore,
      'communityTopics',
    );


  // ============================================================
  // GET ACTIVE TOPICS
  // ============================================================

  /**
   * Returns all active Community topics.
   *
   * We intentionally query only by `active`.
   * Topics are sorted in memory by `sortOrder`.
   *
   * This avoids requiring a composite Firestore index
   * for `active + sortOrder`.
   */
  async getActiveTopics(): Promise<CommunityTopic[]> {

    console.log(
      '[CommunityTopicService] Loading active community topics...',
    );

    const topicsQuery =
      query(
        this.topicsCollection,

        where(
          'active',
          '==',
          true,
        ),
      );


    const snapshot =
      await getDocs(
        topicsQuery,
      );


    console.log(
      '[CommunityTopicService] Topics returned from Firestore:',
      snapshot.size,
    );


    const topics =
      snapshot.docs
        .map(
          (document) =>
            ({
              id: document.id,
              ...document.data(),
            }) as CommunityTopic,
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0),
        );


    console.log(
      '[CommunityTopicService] Active topics:',
      topics,
    );


    return topics;
  }


  // ============================================================
  // GET ALL TOPICS
  // ============================================================

  /**
   * Returns all Community topics, including inactive topics.
   *
   * This will be useful later for Community administration.
   */
  async getAllTopics(): Promise<CommunityTopic[]> {

    console.log(
      '[CommunityTopicService] Loading all community topics...',
    );


    const snapshot =
      await getDocs(
        this.topicsCollection,
      );


    const topics =
      snapshot.docs
        .map(
          (document) =>
            ({
              id: document.id,
              ...document.data(),
            }) as CommunityTopic,
        )
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) -
            (b.sortOrder ?? 0),
        );


    console.log(
      '[CommunityTopicService] All topics:',
      topics,
    );


    return topics;
  }
}
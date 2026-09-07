import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { CommunityTopic } from '../models/community-topic.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityTopicService {
  private readonly topicsCollection = collection(
    firestore,
    'communityTopics',
  );

  /**
   * Get all active community topics.
   */
  async getActiveTopics(): Promise<CommunityTopic[]> {
    console.log(
      '[CommunityTopicService] Starting topic query...',
    );

    console.log(
      '[CommunityTopicService] Firestore:',
      firestore,
    );

    try {
      const topicsQuery = query(
        this.topicsCollection,
        where('active', '==', true),
        orderBy('sortOrder', 'asc'),
      );

      console.log(
        '[CommunityTopicService] Executing Firestore query...',
      );

      const snapshot = await getDocs(topicsQuery);

      console.log(
        '[CommunityTopicService] Documents returned:',
        snapshot.size,
      );

      const topics = snapshot.docs.map((doc) => {
        const data = doc.data();

        console.log(
          '[CommunityTopicService] Document:',
          doc.id,
          data,
        );

        return {
          id: doc.id,
          ...data,
        } as CommunityTopic;
      });

      console.log(
        '[CommunityTopicService] Final topics:',
        topics,
      );

      return topics;
    } catch (error) {
      console.error(
        '[CommunityTopicService] ERROR:',
        error,
      );

      throw error;
    }
  }
}
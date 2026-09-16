import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { LoggerService } from '../../../core/services/logger.service';

import { CommunityTopic } from '../models/community-topic.model';

export interface CreateCommunityTopicInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  sortOrder: number;
  active: boolean;
}

export type UpdateCommunityTopicInput =
  Partial<CreateCommunityTopicInput>;

@Injectable({
  providedIn: 'root',
})
export class CommunityTopicService {
  private readonly logger = inject(LoggerService);

  private readonly topicsCollection =
    collection(
      firestore,
      'communityTopics',
    );

  /**
   * Returns all active Community topics.
   *
   * Sorting is performed in memory so the query does not
   * require a composite Firestore index.
   */
  async getActiveTopics(): Promise<CommunityTopic[]> {
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
      await getDocs(topicsQuery);

    return snapshot.docs
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
  }

  /**
   * Returns all Community topics, including inactive topics.
   *
   * Used by Community administration.
   */
  async getAllTopics(): Promise<CommunityTopic[]> {
    const snapshot =
      await getDocs(
        this.topicsCollection,
      );

    return snapshot.docs
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
  }

  /**
   * Creates a new Community topic.
   */
  async createTopic(
    input: CreateCommunityTopicInput,
  ): Promise<CommunityTopic> {
    const name = input.name.trim();
    const slug = this.normalizeSlug(input.slug || name);

    if (!name) {
      throw new Error(
        'Topic name is required.',
      );
    }

    if (!slug) {
      throw new Error(
        'Topic slug is required.',
      );
    }

    const topicData = {
      name,
      slug,
      description:
        input.description?.trim() || null,
      icon:
        input.icon?.trim() || null,
      imageUrl:
        input.imageUrl?.trim() || null,
      sortOrder:
        Number(input.sortOrder) || 0,
      active:
        input.active,
      postCount: 0,
      createdAt:
        serverTimestamp(),
      updatedAt:
        serverTimestamp(),
    };

    const reference =
      await addDoc(
        this.topicsCollection,
        topicData,
      );

    this.logger.info(
      'CommunityTopicService',
      'Community topic created.',
      {
        topicId: reference.id,
        slug,
      },
    );

    return {
      id: reference.id,
      name,
      slug,
      description:
        input.description?.trim() || undefined,
      icon:
        input.icon?.trim() || undefined,
      imageUrl:
        input.imageUrl?.trim() || undefined,
      sortOrder:
        Number(input.sortOrder) || 0,
      active:
        input.active,
      postCount: 0,
    };
  }

  /**
   * Updates an existing Community topic.
   */
  async updateTopic(
    topicId: string,
    input: UpdateCommunityTopicInput,
  ): Promise<void> {
    if (!topicId) {
      throw new Error(
        'Topic ID is required.',
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt:
        serverTimestamp(),
    };

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new Error(
          'Topic name is required.',
        );
      }

      updates['name'] = name;
    }

    if (input.slug !== undefined) {
      const slug =
        this.normalizeSlug(
          input.slug,
        );

      if (!slug) {
        throw new Error(
          'Topic slug is required.',
        );
      }

      updates['slug'] = slug;
    }

    if (input.description !== undefined) {
      updates['description'] =
        input.description.trim() || null;
    }

    if (input.icon !== undefined) {
      updates['icon'] =
        input.icon.trim() || null;
    }

    if (input.imageUrl !== undefined) {
      updates['imageUrl'] =
        input.imageUrl.trim() || null;
    }

    if (input.sortOrder !== undefined) {
      updates['sortOrder'] =
        Number(input.sortOrder) || 0;
    }

    if (input.active !== undefined) {
      updates['active'] =
        input.active;
    }

    await updateDoc(
      doc(
        firestore,
        'communityTopics',
        topicId,
      ),
      updates,
    );

    this.logger.info(
      'CommunityTopicService',
      'Community topic updated.',
      {
        topicId,
      },
    );
  }

  /**
   * Changes only the active state of a topic.
   */
  async setTopicActive(
    topicId: string,
    active: boolean,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        'communityTopics',
        topicId,
      ),
      {
        active,
        updatedAt:
          serverTimestamp(),
      },
    );

    this.logger.info(
      'CommunityTopicService',
      'Community topic active state changed.',
      {
        topicId,
        active,
      },
    );
  }

  /**
   * Deletes a topic.
   *
   * The administration UI should prefer deactivation when
   * a topic has existing posts.
   */
  async deleteTopic(
    topicId: string,
  ): Promise<void> {
    if (!topicId) {
      throw new Error(
        'Topic ID is required.',
      );
    }

    await deleteDoc(
      doc(
        firestore,
        'communityTopics',
        topicId,
      ),
    );

    this.logger.info(
      'CommunityTopicService',
      'Community topic deleted.',
      {
        topicId,
      },
    );
  }

  private normalizeSlug(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
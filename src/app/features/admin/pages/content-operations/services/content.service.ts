import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../../../../core/services/firebase-config';
import { ContentItem } from '../models/content-operations.model';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly collectionName = 'contentItems';

  private readonly contentCollection = collection(
    firestore,
    this.collectionName,
  );

  /**
   * Create a new content item.
   */
  async createContent(
    content: Omit<
      ContentItem,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const docRef = await addDoc(
      this.contentCollection,
      {
        ...content,

        captureIds: content.captureIds ?? [],

        scheduledAt: content.scheduledAt ?? null,

        publishedAt: content.publishedAt ?? null,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      },
    );

    return docRef.id;
  }

  /**
   * Get all content items.
   */
  async getContents(): Promise<ContentItem[]> {
    const contentQuery = query(
      this.contentCollection,
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(contentQuery);

    return snapshot.docs.map(
      (contentDoc) =>
        ({
          id: contentDoc.id,
          ...contentDoc.data(),
        }) as ContentItem,
    );
  }

  /**
   * Get a single content item by ID.
   */
  async getContent(
    id: string,
  ): Promise<ContentItem | null> {
    const contentDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    if (!contentDoc.exists()) {
      return null;
    }

    return {
      id: contentDoc.id,
      ...contentDoc.data(),
    } as ContentItem;
  }

  /**
   * Update an existing content item.
   */
  async updateContent(
    id: string,
    changes: Partial<
      Omit<
        ContentItem,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        ...changes,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Delete a content item.
   */
  async deleteContent(
    id: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );
  }
}
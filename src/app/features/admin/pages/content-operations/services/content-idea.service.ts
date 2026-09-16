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

import {
  ContentIdea,
  ContentIdeaPriority,
  ContentIdeaStatus,
} from '../models/content-ideas.model';

@Injectable({
  providedIn: 'root',
})
export class ContentIdeaService {
  private readonly collectionName = 'contentIdeas';

  private readonly ideaCollection = collection(
    firestore,
    this.collectionName,
  );

  /**
   * Create a new content idea.
   */
  async createIdea(
    idea: Omit<ContentIdea, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const docRef = await addDoc(this.ideaCollection, {
      ...idea,

      captureIds: idea.captureIds ?? [],

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Get all content ideas.
   */
  async getIdeas(): Promise<ContentIdea[]> {
    const ideaQuery = query(
      this.ideaCollection,
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(ideaQuery);

    return snapshot.docs.map(
      (ideaDoc) =>
        ({
          id: ideaDoc.id,
          ...ideaDoc.data(),
        }) as ContentIdea,
    );
  }

  /**
   * Get a single content idea.
   */
  async getIdea(
    id: string,
  ): Promise<ContentIdea | null> {
    const ideaDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    if (!ideaDoc.exists()) {
      return null;
    }

    return {
      id: ideaDoc.id,
      ...ideaDoc.data(),
    } as ContentIdea;
  }

  /**
   * Update a content idea.
   */
  async updateIdea(
    id: string,
    changes: Partial<
      Omit<
        ContentIdea,
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
   * Delete a content idea.
   */
  async deleteIdea(
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

  /**
   * Update the idea status.
   */
  async updateStatus(
    id: string,
    status: ContentIdeaStatus,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        status,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Update the idea priority.
   */
  async updatePriority(
    id: string,
    priority: ContentIdeaPriority,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
      {
        priority,
        updatedAt: serverTimestamp(),
      },
    );
  }

  /**
   * Check whether an idea exists.
   */
  async ideaExists(
    id: string,
  ): Promise<boolean> {
    const ideaDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    return ideaDoc.exists();
  }
}
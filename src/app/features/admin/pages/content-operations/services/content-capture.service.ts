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
  ContentCapture,
  ContentCaptureStatus,
  ContentCaptureType,
} from '../models/content-captures.model';

@Injectable({
  providedIn: 'root',
})
export class ContentCaptureService {
  private readonly collectionName = 'contentCaptures';

  private readonly captureCollection = collection(
    firestore,
    this.collectionName,
  );

  /**
   * Create a new content capture.
   */
  async createCapture(
    capture: Omit<
      ContentCapture,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const docRef = await addDoc(this.captureCollection, {
      ...capture,

      tags: capture.tags ?? [],

      usedInContentIds:
        capture.usedInContentIds ?? [],

      capturedAt:
        capture.capturedAt ?? null,

      storageUrl:
        capture.storageUrl ?? '',

      description:
        capture.description ?? '',

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Retrieve all content captures.
   */
  async getCaptures(): Promise<ContentCapture[]> {
    const captureQuery = query(
      this.captureCollection,
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(captureQuery);

    return snapshot.docs.map(
      (captureDoc) =>
        ({
          id: captureDoc.id,
          ...captureDoc.data(),
        }) as ContentCapture,
    );
  }

  /**
   * Retrieve a single content capture.
   */
  async getCapture(
    id: string,
  ): Promise<ContentCapture | null> {
    const captureDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    if (!captureDoc.exists()) {
      return null;
    }

    return {
      id: captureDoc.id,
      ...captureDoc.data(),
    } as ContentCapture;
  }

  /**
   * Update an existing content capture.
   */
  async updateCapture(
    id: string,
    changes: Partial<
      Omit<
        ContentCapture,
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
   * Delete a content capture.
   */
  async deleteCapture(
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
   * Update only the capture status.
   */
  async updateStatus(
    id: string,
    status: ContentCaptureStatus,
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
   * Check whether a capture exists.
   */
  async captureExists(
    id: string,
  ): Promise<boolean> {
    const captureDoc = await getDoc(
      doc(
        firestore,
        this.collectionName,
        id,
      ),
    );

    return captureDoc.exists();
  }
}
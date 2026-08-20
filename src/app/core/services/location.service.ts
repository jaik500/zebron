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

import { firestore } from './firebase-config';
import { Location } from '../models/location.model';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly locationsCollection = collection(
    firestore,
    'locations'
  );

  /**
   * Get a location by its Firestore document ID.
   */
  async getLocationById(
    locationId: string
  ): Promise<Location | null> {
    const locationRef = doc(
      firestore,
      'locations',
      locationId
    );

    const snapshot = await getDoc(locationRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as Location;
  }

  /**
   * Get all locations.
   */
  async getAllLocations(): Promise<Location[]> {
    const locationsQuery = query(
      this.locationsCollection,
      orderBy('city')
    );

    const snapshot = await getDocs(locationsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Location & { id: string }
    );
  }

  /**
   * Create a new location.
   */
  async createLocation(
    location: Location
  ): Promise<string> {
    const document = await addDoc(
      this.locationsCollection,
      {
        ...location,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return document.id;
  }

  /**
   * Update an existing location.
   */
  async updateLocation(
    locationId: string,
    location: Partial<Location>
  ): Promise<void> {
    const locationRef = doc(
      firestore,
      'locations',
      locationId
    );

    await updateDoc(locationRef, {
      ...location,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a location.
   */
  async deleteLocation(
    locationId: string
  ): Promise<void> {
    const locationRef = doc(
      firestore,
      'locations',
      locationId
    );

    await deleteDoc(locationRef);
  }
}

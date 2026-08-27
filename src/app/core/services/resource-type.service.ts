import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { ResourceType } from '../models/resource-type.model';

@Injectable({
  providedIn: 'root',
})
export class ResourceTypeService {

  private readonly resourceTypesCollection =
    collection(firestore, 'resourceTypes');


  /**
   * Get all resource types.
   */
  async getAllResourceTypes(): Promise<ResourceType[]> {

    const resourceTypesQuery =
      query(
        this.resourceTypesCollection,
        orderBy('sortOrder'),
      );

    const snapshot =
      await getDocs(resourceTypesQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ResourceType
    );
  }


  /**
   * Get active resource types.
   */
  async getActiveResourceTypes(): Promise<ResourceType[]> {

    const types =
      await this.getAllResourceTypes();

    return types.filter(
      (type) => type.active,
    );
  }


  /**
   * Create a resource type.
   */
  async createResourceType(
    resourceType: ResourceType,
  ): Promise<string> {

    const document =
      await addDoc(
        this.resourceTypesCollection,
        {
          ...resourceType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

    return document.id;
  }


  /**
   * Update a resource type.
   */
  async updateResourceType(
    resourceTypeId: string,
    resourceType: Partial<ResourceType>,
  ): Promise<void> {

    const resourceTypeRef =
      doc(
        firestore,
        'resourceTypes',
        resourceTypeId,
      );

    await updateDoc(
      resourceTypeRef,
      {
        ...resourceType,
        updatedAt: serverTimestamp(),
      },
    );
  }


  /**
   * Delete a resource type.
   */
  async deleteResourceType(
    resourceTypeId: string,
  ): Promise<void> {

    const resourceTypeRef =
      doc(
        firestore,
        'resourceTypes',
        resourceTypeId,
      );

    await deleteDoc(
      resourceTypeRef,
    );
  }
}

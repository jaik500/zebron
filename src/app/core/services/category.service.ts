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
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly categoriesCollection = collection(
    firestore,
    'categories'
  );

  /**
   * Get active categories for the public resource filters.
   */
  async getActiveCategories(): Promise<Category[]> {
    const categoriesQuery = query(
      this.categoriesCollection,
      where('active', '==', true),
      orderBy('sortOrder')
    );

    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as Category[];
  }

    /**
   * Get a category by its Firestore document ID.
   */
  async getCategoryById(
    categoryId: string
  ): Promise<Category | null> {
    const categoryRef = doc(
      firestore,
      'categories',
      categoryId
    );

    const snapshot = await getDoc(categoryRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Category;
  }

  /**
   * Get all categories for the admin dashboard.
   */
  async getAllCategories(): Promise<Category[]> {
    const categoriesQuery = query(
      this.categoriesCollection,
      orderBy('sortOrder')
    );

    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as Category[];
  }

  /**
   * Create a new category.
   */
  async createCategory(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const document = await addDoc(
      this.categoriesCollection,
      {
        ...category,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return document.id;
  }

  /**
   * Update an existing category.
   */
  async updateCategory(
    categoryId: string,
    category: Partial<
      Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
    >
  ): Promise<void> {
    const categoryRef = doc(
      firestore,
      'categories',
      categoryId
    );

    await updateDoc(categoryRef, {
      ...category,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a category.
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const categoryRef = doc(
      firestore,
      'categories',
      categoryId
    );

    await deleteDoc(categoryRef);
  }
}

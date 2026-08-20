import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { firestore } from './firebase-config';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  async getActiveCategories(): Promise<Category[]> {
    const categoriesRef = collection(firestore, 'categories');

    // Load categories that are published.
    // We sort them in Angular instead of using Firestore orderBy()
    // so we do not need a composite Firestore index.
    const categoriesQuery = query(
      categoriesRef,
      where('status', '==', 'published')
    );

    const snapshot = await getDocs(categoriesQuery);

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];

    // Sort categories alphabetically by name.
    return categories.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
}
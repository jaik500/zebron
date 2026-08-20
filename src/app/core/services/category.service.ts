import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  orderBy,
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

    const categoriesQuery = query(
      categoriesRef,
      where('active', '==', true),
      orderBy('sortOrder')
    );

    const snapshot = await getDocs(categoriesQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  }
}

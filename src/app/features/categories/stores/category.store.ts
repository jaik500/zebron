import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';


// ============================================================
// STATE
// ============================================================

interface CategoryState {
  categories: Category[];
  selectedCategory: Category | null;

  loading: boolean;
  error: string | null;
}


const initialState: CategoryState = {

  categories: [],

  selectedCategory: null,

  loading: false,

  error: null,

};


// ============================================================
// CATEGORY STORE
// ============================================================

export const CategoryStore = signalStore(

  {
    providedIn: 'root',
  },


  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),


  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed(
    ({
      categories,
    }) => ({

      // --------------------------------------------------------
      // Active Categories
      // --------------------------------------------------------

      activeCategories: computed(() =>
        categories().filter(
          (category) =>
            category.active === true,
        ),
      ),


      // --------------------------------------------------------
      // Result Count
      // --------------------------------------------------------

      resultCount: computed(
        () =>
          categories().length,
      ),


      // --------------------------------------------------------
      // Active Result Count
      // --------------------------------------------------------

      activeResultCount: computed(() =>
        categories().filter(
          (category) =>
            category.active === true,
        ).length,
      ),

    }),
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,
      categoryService = inject(CategoryService),
    ) => ({


      // ========================================================
      // LOAD ALL CATEGORIES
      // ========================================================

      async loadCategories(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const categories =
            await categoryService
              .getAllCategories();


          patchState(
            store,
            {
              categories,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load categories:',
            error,
          );


          patchState(
            store,
            {
              categories: [],

              loading: false,

              error:
                'Unable to load categories. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // LOAD ACTIVE CATEGORIES
      // ========================================================

      async loadActiveCategories(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const categories =
            await categoryService
              .getActiveCategories();


          patchState(
            store,
            {
              categories,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load active categories:',
            error,
          );


          patchState(
            store,
            {
              categories: [],

              loading: false,

              error:
                'Unable to load categories. Please try again.',
            },
          );

        }

      },


      // ========================================================
      // GET CATEGORY
      // ========================================================

      async getCategory(
        categoryId: string,
      ): Promise<Category | null> {

        try {

          return await categoryService
            .getCategoryById(
              categoryId,
            );

        } catch (error) {

          console.error(
            'Failed to get category:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // CREATE CATEGORY
      // ========================================================

      async createCategory(
        category: Omit<
          Category,
          'id' | 'createdAt' | 'updatedAt'
        >,
      ): Promise<string> {

        try {

          const categoryId =
            await categoryService
              .createCategory(
                category,
              );


          return categoryId;

        } catch (error) {

          console.error(
            'Failed to create category:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // UPDATE CATEGORY
      // ========================================================

      async updateCategory(
        categoryId: string,

        changes: Partial<
          Omit<
            Category,
            'id' | 'createdAt' | 'updatedAt'
          >
        >,
      ): Promise<void> {

        try {

          await categoryService
            .updateCategory(
              categoryId,
              changes,
            );

        } catch (error) {

          console.error(
            'Failed to update category:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // DELETE CATEGORY
      // ========================================================

      async deleteCategory(
        categoryId: string,
      ): Promise<void> {

        try {

          await categoryService
            .deleteCategory(
              categoryId,
            );


          /*
           * Remove the category from local Store state
           * immediately after successful deletion.
           */
          patchState(
            store,
            {
              categories:
                store.categories()
                  .filter(
                    (category) =>
                      category.id !== categoryId,
                  ),
            },
          );

        } catch (error) {

          console.error(
            'Failed to delete category:',
            error,
          );

          throw error;

        }

      },


      // ========================================================
      // CLEAR SELECTED CATEGORY
      // ========================================================

      clearSelectedCategory(): void {

        patchState(
          store,
          {
            selectedCategory: null,
          },
        );

      },


      // ========================================================
      // SET SELECTED CATEGORY
      // ========================================================

      setSelectedCategory(
        category: Category | null,
      ): void {

        patchState(
          store,
          {
            selectedCategory: category,
          },
        );

      },

    }),
  ),

);
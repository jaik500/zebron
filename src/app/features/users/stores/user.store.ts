import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { User } from '../../../core/models/user.model';
import { UserAdminService } from '../../../core/services/user-admin.service';


// ============================================================
// CREATE USER REQUEST
// ============================================================

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';

  firstName?: string;
  lastName?: string;
  preferredName?: string;
  phone?: string;

  countryOfOrigin?: string;
  currentCountry?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  preferredLanguage?: string;

  bio?: string;
  website?: string;
}


// ============================================================
// CREATE USER RESPONSE
// ============================================================

interface CreateUserResponse {
  success: boolean;
  uid: string;
  email: string;
  role: 'user' | 'admin';
}


// ============================================================
// PASSWORD RESET RESPONSE
// ============================================================

interface ResetUserPasswordResponse {
  success: boolean;
  email: string;
  resetLink: string;
}


// ============================================================
// STATE
// ============================================================

interface UserState {
  users: User[];

  loading: boolean;

  error: string | null;
}


const initialState: UserState = {
  users: [],

  loading: false,

  error: null,
};


// ============================================================
// USER STORE
// ============================================================

export const UserStore = signalStore(
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
      users,
    }) => ({

      /**
       * Total number of users.
       */
      userCount: computed(
        () => users().length,
      ),


      /**
       * Number of administrators.
       */
      adminCount: computed(() =>
        users().filter(
          (user) =>
            user.role === 'admin',
        ).length,
      ),


      /**
       * Number of standard users.
       */
      standardUserCount: computed(() =>
        users().filter(
          (user) =>
            user.role === 'user',
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

      userAdminService =
        inject(UserAdminService),

    ) => ({

      // ======================================================
      // LOAD USERS
      // ======================================================

      async loadUsers(): Promise<void> {

        patchState(
          store,
          {
            loading: true,

            error: null,
          },
        );


        try {

          const users =
            await userAdminService.getUsers();


          patchState(
            store,
            {
              users,

              loading: false,

              error: null,
            },
          );

        } catch (error) {

          console.error(
            'Failed to load users:',
            error,
          );


          patchState(
            store,
            {
              loading: false,

              error:
                'Unable to load users. Please try again.',
            },
          );


          throw error;
        }

      },


      // ======================================================
      // CREATE USER
      // ======================================================

      async createUser(
        user: CreateUserRequest,
      ): Promise<CreateUserResponse> {

        const result =
          await userAdminService.createUser(
            user,
          );


        /*
         * The Firebase Function creates both the
         * Authentication account and Firestore profile.
         *
         * Refresh the Store so the newly-created
         * user appears in the current collection.
         */
        await this.loadUsers();


        return result;
      },


      // ======================================================
      // UPDATE USER
      // ======================================================

      async updateUser(
        userId: string,

        profile: Partial<User>,
      ): Promise<void> {

        await userAdminService.updateUser(
          userId,
          profile,
        );


        /*
         * Update the local Store immediately instead
         * of requiring another complete Firestore read.
         */
        patchState(
          store,
          {
            users:
              store.users().map(
                (user) =>
                  user.id === userId
                    ? {
                        ...user,

                        ...profile,
                      }
                    : user,
              ),
          },
        );

      },


      // ======================================================
      // DELETE USER
      // ======================================================

      async deleteUser(
        userId: string,
      ): Promise<void> {

        await userAdminService.deleteUser(
          userId,
        );


        /*
         * The current backend deletes the Firestore
         * profile only. Keep the local Store consistent
         * with that operation.
         */
        patchState(
          store,
          {
            users:
              store.users().filter(
                (user) =>
                  user.id !== userId,
              ),
          },
        );

      },


      // ======================================================
      // RESET USER PASSWORD
      // ======================================================

      async resetUserPassword(
        userId: string,
      ): Promise<ResetUserPasswordResponse> {

        return await userAdminService
          .resetUserPassword(
            userId,
          );

      },


      // ======================================================
      // CLEAR ERROR
      // ======================================================

      clearError(): void {

        patchState(
          store,
          {
            error: null,
          },
        );

      },

    }),
  ),
);
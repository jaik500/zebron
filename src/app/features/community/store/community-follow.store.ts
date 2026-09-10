import {
  computed,
  inject,
} from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { CommunityFollow } from '../models/community-follow.model';
import { CommunityUser } from '../models/community-user.model';

import { CommunityFollowService } from '../services/community-follow.service';
import { CommunityUserService } from '../services/community-user.service';


// =============================================================
// STATE
// =============================================================

interface CommunityFollowState {

  following: CommunityFollow[];

  followers: CommunityFollow[];

  followingUsers: CommunityUser[];

  followerUsers: CommunityUser[];

  loadingFollowing: boolean;

  loadingFollowers: boolean;

  checkingFollow: boolean;

  togglingFollow: boolean;

  error: string | null;

  followStatus: Record<string, boolean>;
}


// =============================================================
// INITIAL STATE
// =============================================================

const initialState: CommunityFollowState = {

  following: [],

  followers: [],

  followingUsers: [],

  followerUsers: [],

  loadingFollowing: false,

  loadingFollowers: false,

  checkingFollow: false,

  togglingFollow: false,

  error: null,

  followStatus: {},
};


// =============================================================
// SIGNAL STORE
// =============================================================

export const CommunityFollowStore = signalStore(

  {
    providedIn: 'root',
  },


  // ===========================================================
  // STATE
  // ===========================================================

  withState(initialState),


  // ===========================================================
  // COMPUTED
  // ===========================================================

  withComputed(
    (
      store,
    ) => ({

      followingCount:
        computed(
          () =>
            store.following().length,
        ),

      followersCount:
        computed(
          () =>
            store.followers().length,
        ),

      hasFollowing:
        computed(
          () =>
            store.following().length > 0,
        ),

      hasFollowers:
        computed(
          () =>
            store.followers().length > 0,
        ),

      isLoading:
        computed(
          () =>
            store.loadingFollowing() ||
            store.loadingFollowers() ||
            store.checkingFollow() ||
            store.togglingFollow(),
        ),

    }),
  ),


  // ===========================================================
  // METHODS
  // ===========================================================

  withMethods(
    (
      store,

      followService =
        inject(
          CommunityFollowService,
        ),

      userService =
        inject(
          CommunityUserService,
        ),
    ) => {

      // ---------------------------------------------------------
      // Follow status key
      // ---------------------------------------------------------

      const getFollowKey = (
        followerId: string,
        followingId: string,
      ): string =>
        `${followerId}_${followingId}`;


      // ---------------------------------------------------------
      // Hydrate users
      // ---------------------------------------------------------

      const hydrateUsers = async (
        follows: CommunityFollow[],
        userIdField:
          | 'followerId'
          | 'followingId',
      ): Promise<CommunityUser[]> => {

        const userIds =
          follows.map(
            (follow) =>
              follow[userIdField],
          );

        return userService.getUsersByIds(
          userIds,
        );
      };


      return {


        // =======================================================
        // LOAD FOLLOWING
        // =======================================================

        async loadFollowing(
          followerId: string,
        ): Promise<void> {

          if (!followerId) {
            return;
          }

          patchState(
            store,
            {
              loadingFollowing: true,
              error: null,
            },
          );

          try {

            const follows =
              await followService.getFollowing(
                followerId,
              );

            const users =
              await hydrateUsers(
                follows,
                'followingId',
              );

            patchState(
              store,
              {
                following: follows,
                followingUsers: users,
              },
            );

          } catch (error) {

            console.error(
              '[CommunityFollowStore] Failed to load following:',
              error,
            );

            patchState(
              store,
              {
                error:
                  'Unable to load following users.',
              },
            );

          } finally {

            patchState(
              store,
              {
                loadingFollowing: false,
              },
            );
          }
        },


        // =======================================================
        // LOAD FOLLOWERS
        // =======================================================

        async loadFollowers(
          followingId: string,
        ): Promise<void> {

          if (!followingId) {
            return;
          }

          patchState(
            store,
            {
              loadingFollowers: true,
              error: null,
            },
          );

          try {

            const follows =
              await followService.getFollowers(
                followingId,
              );

            const users =
              await hydrateUsers(
                follows,
                'followerId',
              );

            patchState(
              store,
              {
                followers: follows,
                followerUsers: users,
              },
            );

          } catch (error) {

            console.error(
              '[CommunityFollowStore] Failed to load followers:',
              error,
            );

            patchState(
              store,
              {
                error:
                  'Unable to load followers.',
              },
            );

          } finally {

            patchState(
              store,
              {
                loadingFollowers: false,
              },
            );
          }
        },


        // =======================================================
        // CHECK FOLLOWING
        // =======================================================

        async checkFollowing(
          followerId: string,
          followingId: string,
        ): Promise<boolean> {

          if (
            !followerId ||
            !followingId ||
            followerId === followingId
          ) {
            return false;
          }

          const key =
            getFollowKey(
              followerId,
              followingId,
            );

          patchState(
            store,
            {
              checkingFollow: true,
            },
          );

          try {

            const following =
              await followService.isFollowing(
                followerId,
                followingId,
              );

            patchState(
              store,
              {
                followStatus: {
                  ...store.followStatus(),
                  [key]: following,
                },
              },
            );

            return following;

          } catch (error) {

            console.error(
              '[CommunityFollowStore] Failed to check follow status:',
              error,
            );

            return false;

          } finally {

            patchState(
              store,
              {
                checkingFollow: false,
              },
            );
          }
        },


        // =======================================================
        // GET FOLLOW STATUS
        // =======================================================

        getFollowStatus(
          followerId: string,
          followingId: string,
        ): boolean | null {

          const key =
            getFollowKey(
              followerId,
              followingId,
            );

          const status =
            store.followStatus()[key];

          return status === undefined
            ? null
            : status;
        },


        // =======================================================
        // TOGGLE FOLLOW
        // =======================================================

        async toggleFollow(
          followerId: string,
          followingId: string,
        ): Promise<boolean> {

          if (
            !followerId ||
            !followingId ||
            followerId === followingId
          ) {
            return false;
          }

          const key =
            getFollowKey(
              followerId,
              followingId,
            );

          patchState(
            store,
            {
              togglingFollow: true,
              error: null,
            },
          );

          try {

            const following =
              await followService.toggleFollow(
                followerId,
                followingId,
              );

            patchState(
              store,
              {
                followStatus: {
                  ...store.followStatus(),
                  [key]: following,
                },
              },
            );

            return following;

          } catch (error) {

            console.error(
              '[CommunityFollowStore] Failed to toggle follow:',
              error,
            );

            patchState(
              store,
              {
                error:
                  'Unable to update follow status.',
              },
            );

            throw error;

          } finally {

            patchState(
              store,
              {
                togglingFollow: false,
              },
            );
          }
        },


        // =======================================================
        // FOLLOW USER
        // =======================================================

        async followUser(
          followerId: string,
          followingId: string,
        ): Promise<void> {

          await followService.followUser(
            followerId,
            followingId,
          );

          const key =
            getFollowKey(
              followerId,
              followingId,
            );

          patchState(
            store,
            {
              followStatus: {
                ...store.followStatus(),
                [key]: true,
              },
            },
          );
        },


        // =======================================================
        // UNFOLLOW USER
        // =======================================================

        async unfollowUser(
          followerId: string,
          followingId: string,
        ): Promise<void> {

          await followService.unfollowUser(
            followerId,
            followingId,
          );

          const key =
            getFollowKey(
              followerId,
              followingId,
            );

          patchState(
            store,
            {
              followStatus: {
                ...store.followStatus(),
                [key]: false,
              },
            },
          );
        },


        // =======================================================
        // CLEAR
        // =======================================================

        clear(): void {

          patchState(
            store,
            initialState,
          );
        },


        // =======================================================
        // CLEAR ERROR
        // =======================================================

        clearError(): void {

          patchState(
            store,
            {
              error: null,
            },
          );
        },

      };
    },
  ),
);
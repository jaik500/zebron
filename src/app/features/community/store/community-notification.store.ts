import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { CommunityNotification } from '../models/community-notification.model';
import { CommunityNotificationService } from '../services/community-notification.service';

interface CommunityNotificationState {
  notifications: CommunityNotification[];

  loading: boolean;

  loadingUnread: boolean;

  markingAsRead: boolean;

  markingAllAsRead: boolean;

  error: string | null;
}

const initialState: CommunityNotificationState = {
  notifications: [],

  loading: false,

  loadingUnread: false,

  markingAsRead: false,

  markingAllAsRead: false,

  error: null,
};

export const CommunityNotificationStore = signalStore(
  { providedIn: 'root' },

  // =============================================================
  // STATE
  // =============================================================

  withState(initialState),

  // =============================================================
  // COMPUTED STATE
  // =============================================================

  withComputed((store) => ({
    unreadNotifications: computed(() =>
      store.notifications().filter((notification) => !notification.read),
    ),

    unreadCount: computed(
      () => store.notifications().filter((notification) => !notification.read).length,
    ),

    hasUnread: computed(() => store.notifications().some((notification) => !notification.read)),

    notificationCount: computed(() => store.notifications().length),
  })),

  // =============================================================
  // METHODS
  // =============================================================

  withMethods((store, notificationService = inject(CommunityNotificationService)) => ({
    // ---------------------------------------------------------
    // LOAD NOTIFICATIONS
    // ---------------------------------------------------------

    async loadNotifications(recipientId: string, maxResults: number = 50): Promise<void> {
      if (!recipientId) {
        return;
      }

      patchState(store, {
        loading: true,
        error: null,
      });

      try {
        const notifications = await notificationService.getNotifications(recipientId, maxResults);

        patchState(store, {
          notifications,
        });
      } catch (error) {
        console.error('[CommunityNotificationStore] Failed to load notifications:', error);

        patchState(store, {
          error: 'Unable to load notifications.',
        });
      } finally {
        patchState(store, {
          loading: false,
        });
      }
    },

    // ---------------------------------------------------------
    // LOAD UNREAD NOTIFICATIONS
    // ---------------------------------------------------------

    async loadUnreadNotifications(recipientId: string, maxResults: number = 50): Promise<void> {
      if (!recipientId) {
        return;
      }

      patchState(store, {
        loadingUnread: true,
        error: null,
      });

      try {
        const unreadNotifications = await notificationService.getUnreadNotifications(
          recipientId,
          maxResults,
        );

        const unreadIds = new Set(unreadNotifications.map((notification) => notification.id));

        const existingNotifications = store.notifications();

        const mergedNotifications = existingNotifications.map((notification) =>
          unreadIds.has(notification.id)
            ? {
                ...notification,
                read: false,
                readAt: null,
              }
            : notification,
        );

        const existingIds = new Set(existingNotifications.map((notification) => notification.id));

        const newUnreadNotifications = unreadNotifications.filter(
          (notification) => !existingIds.has(notification.id),
        );

        patchState(store, {
          notifications: [...mergedNotifications, ...newUnreadNotifications].sort(
            (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
          ),
        });
      } catch (error) {
        console.error('[CommunityNotificationStore] Failed to load unread notifications:', error);

        patchState(store, {
          error: 'Unable to load unread notifications.',
        });
      } finally {
        patchState(store, {
          loadingUnread: false,
        });
      }
    },

    // ---------------------------------------------------------
    // CREATE NOTIFICATION
    // ---------------------------------------------------------

    async createNotification(input: {
      recipientId: string;
      actorId?: string | null;
      actorDisplayName?: string;
      actorPhotoUrl?: string;
      type: CommunityNotification['type'];
      message: string;
      postId?: string | null;
      commentId?: string | null;
      route?: string | null;
    }): Promise<string | null> {
      try {
        const notificationId = await notificationService.createNotification(input);

        return notificationId;
      } catch (error) {
        console.error('[CommunityNotificationStore] Failed to create notification:', error);

        return null;
      }
    },

    // ---------------------------------------------------------
    // MARK AS READ
    // ---------------------------------------------------------

    async markAsRead(notificationId: string): Promise<void> {
      if (!notificationId) {
        return;
      }

      patchState(store, {
        markingAsRead: true,
        error: null,
      });

      try {
        await notificationService.markAsRead(notificationId);

        patchState(store, {
          notifications: store.notifications().map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  read: true,
                  readAt: notification.readAt ?? null,
                }
              : notification,
          ),
        });
      } catch (error) {
        console.error('[CommunityNotificationStore] Failed to mark notification as read:', error);

        patchState(store, {
          error: 'Unable to update notification.',
        });
      } finally {
        patchState(store, {
          markingAsRead: false,
        });
      }
    },

    // ---------------------------------------------------------
    // MARK ALL AS READ
    // ---------------------------------------------------------

    async markAllAsRead(recipientId: string): Promise<void> {
      if (!recipientId) {
        return;
      }

      patchState(store, {
        markingAllAsRead: true,
        error: null,
      });

      try {
        await notificationService.markAllAsRead(recipientId);

        patchState(store, {
          notifications: store.notifications().map((notification) => ({
            ...notification,
            read: true,
            readAt: notification.readAt ?? null,
          })),
        });
      } catch (error) {
        console.error(
          '[CommunityNotificationStore] Failed to mark all notifications as read:',
          error,
        );

        patchState(store, {
          error: 'Unable to mark notifications as read.',
        });
      } finally {
        patchState(store, {
          markingAllAsRead: false,
        });
      }
    },

    // ---------------------------------------------------------
    // ADD NOTIFICATION LOCALLY
    // ---------------------------------------------------------

    addNotification(notification: CommunityNotification): void {
      const exists = store.notifications().some((existing) => existing.id === notification.id);

      if (exists) {
        return;
      }

      patchState(store, {
        notifications: [notification, ...store.notifications()],
      });
    },

    // ---------------------------------------------------------
    // REMOVE NOTIFICATION LOCALLY
    // ---------------------------------------------------------

    removeNotification(notificationId: string): void {
      if (!notificationId) {
        return;
      }

      patchState(store, {
        notifications: store
          .notifications()
          .filter((notification) => notification.id !== notificationId),
      });
    },

    // ---------------------------------------------------------
    // RESET
    // ---------------------------------------------------------

    reset(): void {
      patchState(store, initialState);
    },
  })),
);

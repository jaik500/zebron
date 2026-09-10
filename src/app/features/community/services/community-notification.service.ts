import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  CommunityNotification,
  CommunityNotificationType,
} from '../models/community-notification.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityNotificationService {
  private readonly collectionName = 'communityNotifications';

  // =============================================================
  // CREATE NOTIFICATION
  // =============================================================

  async createNotification(input: {
    recipientId: string;
    actorId?: string | null;
    actorDisplayName?: string;
    actorPhotoUrl?: string;
    type: CommunityNotificationType;
    message: string;
    postId?: string | null;
    commentId?: string | null;
    route?: string | null;
  }): Promise<string> {
    if (!input.recipientId) {
      throw new Error(
        'A recipient is required to create a notification.',
      );
    }

    const notificationsRef = collection(
      firestore,
      this.collectionName,
    );

    const notification = {
      recipientId: input.recipientId,

      actorId: input.actorId ?? null,

      actorDisplayName:
        input.actorDisplayName ?? 'Zebron User',

      actorPhotoUrl:
        input.actorPhotoUrl ?? null,

      type: input.type,

      message: input.message,

      postId: input.postId ?? null,

      commentId: input.commentId ?? null,

      route: input.route ?? null,

      read: false,

      createdAt: Timestamp.now(),

      readAt: null,
    };

    const document = await addDoc(
      notificationsRef,
      notification,
    );

    return document.id;
  }

  // =============================================================
  // GET NOTIFICATIONS
  // =============================================================

  async getNotifications(
    recipientId: string,
    maxResults: number = 50,
  ): Promise<CommunityNotification[]> {
    if (!recipientId) {
      return [];
    }

    const notificationsRef = collection(
      firestore,
      this.collectionName,
    );

    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', recipientId),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );

    const snapshot = await getDocs(
      notificationsQuery,
    );

    return snapshot.docs.map((notificationDoc) =>
      this.mapNotification(
        notificationDoc.id,
        notificationDoc.data(),
      ),
    );
  }

  // =============================================================
  // GET UNREAD NOTIFICATIONS
  // =============================================================

  async getUnreadNotifications(
    recipientId: string,
    maxResults: number = 50,
  ): Promise<CommunityNotification[]> {
    if (!recipientId) {
      return [];
    }

    const notificationsRef = collection(
      firestore,
      this.collectionName,
    );

    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', recipientId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );

    const snapshot = await getDocs(
      notificationsQuery,
    );

    return snapshot.docs.map((notificationDoc) =>
      this.mapNotification(
        notificationDoc.id,
        notificationDoc.data(),
      ),
    );
  }

  // =============================================================
  // GET UNREAD COUNT
  // =============================================================

  async getUnreadCount(
    recipientId: string,
  ): Promise<number> {
    const notifications =
      await this.getUnreadNotifications(
        recipientId,
        100,
      );

    return notifications.length;
  }

  // =============================================================
  // MARK AS READ
  // =============================================================

  async markAsRead(
    notificationId: string,
  ): Promise<void> {
    if (!notificationId) {
      return;
    }

    const notificationRef = doc(
      firestore,
      this.collectionName,
      notificationId,
    );

    await updateDoc(
      notificationRef,
      {
        read: true,
        readAt: Timestamp.now(),
      },
    );
  }

  // =============================================================
  // MARK ALL AS READ
  // =============================================================

  async markAllAsRead(
    recipientId: string,
  ): Promise<void> {
    if (!recipientId) {
      return;
    }

    const notificationsRef = collection(
      firestore,
      this.collectionName,
    );

    const notificationsQuery = query(
      notificationsRef,
      where('recipientId', '==', recipientId),
      where('read', '==', false),
    );

    const snapshot = await getDocs(
      notificationsQuery,
    );

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(firestore);
    const readAt = Timestamp.now();

    snapshot.docs.forEach(
      (notificationDoc) => {
        batch.update(
          notificationDoc.ref,
          {
            read: true,
            readAt,
          },
        );
      },
    );

    await batch.commit();
  }

  // =============================================================
  // MAP FIRESTORE DOCUMENT
  // =============================================================

  private mapNotification(
    id: string,
    data: Record<string, unknown>,
  ): CommunityNotification {
    return {
      id,

      recipientId:
        (data['recipientId'] as string) ?? '',

      actorId:
        (data['actorId'] as string | null) ?? null,

      actorDisplayName:
        (data['actorDisplayName'] as string) ??
        'Zebron User',

      actorPhotoUrl:
        (data['actorPhotoUrl'] as string) ??
        undefined,

      type:
        data['type'] as CommunityNotificationType,

      message:
        (data['message'] as string) ?? '',

      postId:
        (data['postId'] as string | null) ??
        null,

      commentId:
        (data['commentId'] as string | null) ??
        null,

      route:
        (data['route'] as string | null) ??
        null,

      read:
        (data['read'] as boolean) ?? false,

      createdAt:
        (data['createdAt'] as Timestamp | null) ??
        null,

      readAt:
        (data['readAt'] as Timestamp | null) ??
        null,
    };
  }
}
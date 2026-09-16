import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  CommunityConversation,
} from '../models/community-conversation.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityChatService {

  // =============================================================
  // Firestore
  // =============================================================

  private readonly conversationsCollection =
    collection(
      firestore,
      'communityConversations',
    );


  // =============================================================
  // Conversation ID
  // =============================================================

  /**
   * Creates a deterministic ID for a one-to-one conversation.
   *
   * The same two users will always produce the same conversation ID.
   *
   * Example:
   *
   * userB + userA
   * userA + userB
   *
   * Both resolve to:
   *
   * userA__userB
   */
  getConversationId(
    userIdA: string,
    userIdB: string,
  ): string {

    if (!userIdA || !userIdB) {
      throw new Error(
        'Both user IDs are required.',
      );
    }

    if (userIdA === userIdB) {
      throw new Error(
        'Users cannot start a conversation with themselves.',
      );
    }

    return [
      userIdA,
      userIdB,
    ]
      .sort()
      .join('__');
  }


  // =============================================================
  // Get conversation
  // =============================================================

  async getConversationById(
    conversationId: string,
  ): Promise<CommunityConversation | null> {

    if (!conversationId) {
      return null;
    }

    const conversationRef =
      doc(
        firestore,
        'communityConversations',
        conversationId,
      );

    const snapshot =
      await getDoc(
        conversationRef,
      );

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapConversation(
      snapshot,
    );
  }


  // =============================================================
  // Get or create conversation
  // =============================================================

  async getOrCreateConversation(
    userIdA: string,
    userIdB: string,
  ): Promise<CommunityConversation> {

    if (!userIdA || !userIdB) {
      throw new Error(
        'Both user IDs are required.',
      );
    }

    if (userIdA === userIdB) {
      throw new Error(
        'Users cannot start a conversation with themselves.',
      );
    }

    const participantIds =
      [
        userIdA,
        userIdB,
      ].sort();

    const conversationId =
      this.getConversationId(
        userIdA,
        userIdB,
      );

    const conversationRef =
      doc(
        firestore,
        'communityConversations',
        conversationId,
      );

    const existingConversation =
      await getDoc(
        conversationRef,
      );

    if (!existingConversation.exists()) {

      await setDoc(
        conversationRef,
        {
          participantIds,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          lastMessage:
            null,

          lastMessageAt:
            null,

          lastMessageSenderId:
            null,
        },
      );
    }

    const conversation =
      await getDoc(
        conversationRef,
      );

    if (!conversation.exists()) {
      throw new Error(
        'Failed to create community conversation.',
      );
    }

    return this.mapConversation(
      conversation,
    );
  }


  // =============================================================
  // Listen to user's conversations
  // =============================================================

  listenToUserConversations(
    userId: string,
    onChange: (
      conversations: CommunityConversation[],
    ) => void,
    onError?: (
      error: Error,
    ) => void,
  ): Unsubscribe {

    if (!userId) {
      throw new Error(
        'A user ID is required.',
      );
    }

    const conversationsQuery =
      query(
        this.conversationsCollection,

        where(
          'participantIds',
          'array-contains',
          userId,
        ),

        limit(50),
      );

    return onSnapshot(
      conversationsQuery,

      (snapshot) => {

        const conversations =
          snapshot.docs
            .map(
              (conversationDoc) =>
                this.mapConversation(
                  conversationDoc,
                ),
            );

        /**
         * Sort client-side so we do not introduce a composite
         * Firestore index requirement during Phase 1.
         */
        conversations.sort(
          (a, b) =>
            this.timestampToMillis(
              b.updatedAt,
            ) -
            this.timestampToMillis(
              a.updatedAt,
            ),
        );

        onChange(
          conversations,
        );
      },

      (error) => {

        if (onError) {
          onError(
            error,
          );
        }
      },
    );
  }


  // =============================================================
  // Listen to a single conversation
  // =============================================================

  listenToConversation(
    conversationId: string,
    onChange: (
      conversation: CommunityConversation | null,
    ) => void,
    onError?: (
      error: Error,
    ) => void,
  ): Unsubscribe {

    if (!conversationId) {
      throw new Error(
        'A conversation ID is required.',
      );
    }

    const conversationRef =
      doc(
        firestore,
        'communityConversations',
        conversationId,
      );

    return onSnapshot(
      conversationRef,

      (snapshot) => {

        if (!snapshot.exists()) {
          onChange(null);
          return;
        }

        onChange(
          this.mapConversation(
            snapshot,
          ),
        );
      },

      (error) => {

        if (onError) {
          onError(
            error,
          );
        }
      },
    );
  }


  // =============================================================
  // Map conversation
  // =============================================================

  private mapConversation(
    snapshot: DocumentSnapshot,
  ): CommunityConversation {

    const data =
      snapshot.data() ?? {};

    const participantIds =
      Array.isArray(
        data['participantIds'],
      )
        ? (
            data['participantIds'] as unknown[]
          )
            .filter(
              (
                id,
              ): id is string =>
                typeof id === 'string' &&
                id.length > 0,
            )
        : [];

    return {
      id:
        snapshot.id,

      participantIds,

      createdAt:
        (
          data['createdAt'] as
            | Timestamp
            | null
            | undefined
        ) ?? null,

      updatedAt:
        (
          data['updatedAt'] as
            | Timestamp
            | null
            | undefined
        ) ?? null,

      lastMessage:
        typeof data['lastMessage'] === 'string'
          ? data['lastMessage']
          : null,

      lastMessageAt:
        (
          data['lastMessageAt'] as
            | Timestamp
            | null
            | undefined
        ) ?? null,

      lastMessageSenderId:
        typeof data['lastMessageSenderId'] === 'string'
          ? data['lastMessageSenderId']
          : null,
    };
  }


  // =============================================================
  // Timestamp helper
  // =============================================================

  private timestampToMillis(
    timestamp: Timestamp | null,
  ): number {

    return timestamp?.toMillis() ?? 0;
  }
}
import { Injectable } from '@angular/core';

import {
  arrayUnion,
  collection,
  doc,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import {
  CommunityMessage,
} from '../models/community-message.model';

@Injectable({
  providedIn: 'root',
})
export class CommunityMessageService {

  // =============================================================
  // Constants
  // =============================================================

  private readonly maxMessageLength =
    2000;

  private readonly maxMessagesPerConversation =
    100;


  // =============================================================
  // Message collection
  // =============================================================

  private getMessagesCollection(
    conversationId: string,
  ) {

    return collection(
      firestore,
      'communityConversations',
      conversationId,
      'messages',
    );
  }


  // =============================================================
  // Create message
  // =============================================================

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<string> {

    if (!conversationId) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    if (!senderId) {
      throw new Error(
        'Sender ID is required.',
      );
    }

    const normalizedContent =
      content.trim();

    if (!normalizedContent) {
      throw new Error(
        'Message content cannot be empty.',
      );
    }

    if (
      normalizedContent.length >
      this.maxMessageLength
    ) {
      throw new Error(
        `Messages cannot exceed ${this.maxMessageLength} characters.`,
      );
    }

    const messagesCollection =
      this.getMessagesCollection(
        conversationId,
      );

    const messageRef =
      doc(
        messagesCollection,
      );

    await setDoc(
      messageRef,
      {
        senderId,

        content:
          normalizedContent,

        createdAt:
          serverTimestamp(),

        readBy:
          [
            senderId,
          ],
      },
    );

    /**
     * Phase 1 preview metadata.
     *
     * This is intentionally isolated here so it can later be
     * moved completely to a trusted Cloud Function without
     * changing the Chat UI/store architecture.
     */
    const conversationRef =
      doc(
        firestore,
        'communityConversations',
        conversationId,
      );

    await updateDoc(
      conversationRef,
      {
        lastMessage:
          normalizedContent,

        lastMessageAt:
          serverTimestamp(),

        lastMessageSenderId:
          senderId,

        updatedAt:
          serverTimestamp(),
      },
    );

    return messageRef.id;
  }


  // =============================================================
  // Listen to messages
  // =============================================================

  listenToMessages(
    conversationId: string,
    onChange: (
      messages: CommunityMessage[],
    ) => void,
    onError?: (
      error: Error,
    ) => void,
  ): Unsubscribe {

    if (!conversationId) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    const messagesQuery =
      query(
        this.getMessagesCollection(
          conversationId,
        ),

        orderBy(
          'createdAt',
          'asc',
        ),

        limitToLast(
          this.maxMessagesPerConversation,
        ),
      );

    return onSnapshot(
      messagesQuery,

      (snapshot) => {

        const messages =
          snapshot.docs.map(
            (messageDoc) => {

              const data =
                messageDoc.data();

              return this.mapMessage(
                messageDoc.id,
                conversationId,
                data,
              );
            },
          );

        onChange(
          messages,
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
  // Mark message as read
  // =============================================================

  async markMessageAsRead(
    conversationId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {

    if (
      !conversationId ||
      !messageId ||
      !userId
    ) {
      return;
    }

    const messageRef =
      doc(
        firestore,
        'communityConversations',
        conversationId,
        'messages',
        messageId,
      );

    await updateDoc(
      messageRef,
      {
        readBy:
          arrayUnion(
            userId,
          ),
      },
    );
  }


  // =============================================================
  // Map message
  // =============================================================

  private mapMessage(
    id: string,
    conversationId: string,
    data: Record<string, unknown>,
  ): CommunityMessage {

    const readBy =
      Array.isArray(
        data['readBy'],
      )
        ? (
            data['readBy'] as unknown[]
          )
            .filter(
              (
                userId,
              ): userId is string =>
                typeof userId === 'string' &&
                userId.length > 0,
            )
        : [];

    return {
      id,

      conversationId,

      senderId:
        typeof data['senderId'] === 'string'
          ? data['senderId']
          : '',

      content:
        typeof data['content'] === 'string'
          ? data['content']
          : '',

      createdAt:
        (
          data['createdAt'] as
            | Timestamp
            | null
            | undefined
        ) ?? null,

      readBy,
    };
  }
}
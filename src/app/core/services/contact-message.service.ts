import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  ContactMessage,
  ContactMessageStatus,
} from '../models/contact-message.model';

/**
 * Service responsible for retrieving and managing
 * contact messages submitted through the public
 * Zebron contact form.
 */
@Injectable({
  providedIn: 'root',
})
export class ContactMessageService {
  /**
   * Firestore contact messages collection.
   */
  private readonly contactMessagesCollection =
    collection(
      firestore,
      'contactMessages',
    );

  /**
   * Get all contact messages once.
   *
   * The newest messages are returned first.
   *
   * This method is retained for manual refreshes
   * and backwards compatibility.
   */
  async getAllContactMessages(): Promise<
    ContactMessage[]
  > {
    const messagesQuery =
      query(
        this.contactMessagesCollection,
        orderBy(
          'createdAt',
          'desc',
        ),
      );

    const snapshot =
      await getDocs(
        messagesQuery,
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ContactMessage,
    );
  }

  /**
   * Listen to contact messages in real time.
   *
   * The callback is executed whenever Firestore
   * detects:
   *
   * - a new message
   * - a message status change
   * - an updated message
   * - a deleted message
   *
   * Returns an unsubscribe function that should
   * be called when the component is destroyed.
   */
  listenToContactMessages(
    onMessages: (
      messages: ContactMessage[],
    ) => void,
    onError?: (
      error: Error,
    ) => void,
  ): () => void {
    const messagesQuery =
      query(
        this.contactMessagesCollection,
        orderBy(
          'createdAt',
          'desc',
        ),
      );

    const unsubscribe =
      onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messages =
            snapshot.docs.map(
              (document) =>
                ({
                  id: document.id,
                  ...document.data(),
                }) as ContactMessage,
            );

          onMessages(messages);
        },
        (error) => {
          console.error(
            'Contact message listener failed:',
            error,
          );

          onError?.(error);
        },
      );

    return unsubscribe;
  }

  /**
   * Backwards-compatible method for retrieving
   * contact messages.
   *
   * This provides a simple getMessages() method
   * for the administrator page.
   */
  async getMessages(): Promise<
    ContactMessage[]
  > {
    return this.getAllContactMessages();
  }

  /**
   * Get contact messages filtered by status.
   *
   * Example:
   *
   * getMessagesByStatus('new')
   */
  async getMessagesByStatus(
    status: ContactMessageStatus,
  ): Promise<ContactMessage[]> {
    const messages =
      await this.getAllContactMessages();

    return messages.filter(
      (message) =>
        message.status === status,
    );
  }

  /**
   * Get a single contact message by
   * its Firestore document ID.
   */
  async getContactMessageById(
    messageId: string,
  ): Promise<ContactMessage | null> {
    const messageRef =
      doc(
        firestore,
        'contactMessages',
        messageId,
      );

    const snapshot =
      await getDoc(
        messageRef,
      );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ContactMessage;
  }

  /**
   * Update the status of a contact message.
   *
   * The updatedAt timestamp is also recorded.
   */
  async updateMessageStatus(
    messageId: string,
    status: ContactMessageStatus,
  ): Promise<void> {
    const messageRef =
      doc(
        firestore,
        'contactMessages',
        messageId,
      );

    await updateDoc(
      messageRef,
      {
        status,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  /**
   * Mark a contact message as read.
   */
  async markAsRead(
    messageId: string,
  ): Promise<void> {
    await this.updateMessageStatus(
      messageId,
      'read',
    );
  }

  /**
   * Archive a contact message.
   */
  async archiveMessage(
    messageId: string,
  ): Promise<void> {
    await this.updateMessageStatus(
      messageId,
      'archived',
    );
  }

  /**
   * Mark an archived contact message
   * as read again.
   */
  async unarchiveMessage(
    messageId: string,
  ): Promise<void> {
    await this.updateMessageStatus(
      messageId,
      'read',
    );
  }

  /**
   * Delete a contact message permanently.
   *
   * This should only be exposed through an
   * administrator action.
   */
  async deleteMessage(
    messageId: string,
  ): Promise<void> {
    const messageRef =
      doc(
        firestore,
        'contactMessages',
        messageId,
      );

    await deleteDoc(
      messageRef,
    );
  }
}
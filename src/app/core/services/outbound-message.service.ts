import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

import { firestore } from './firebase-config';

import {
  OutboundMessage,
} from '../models/outbound-message.model';

/**
 * Service responsible for retrieving emails
 * sent through the Zebron administrator mailbox.
 */
@Injectable({
  providedIn: 'root',
})
export class OutboundMessageService {
  /**
   * Firestore outbound messages collection.
   */
  private readonly outboundMessagesCollection =
    collection(
      firestore,
      'outboundMessages',
    );

  /**
   * Get all outbound messages.
   *
   * The newest sent emails are returned first.
   */
  async getAllOutboundMessages(): Promise<
    OutboundMessage[]
  > {
    const messagesQuery =
      query(
        this.outboundMessagesCollection,
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
        }) as OutboundMessage,
    );
  }

  /**
   * Backwards-friendly method for retrieving
   * sent messages from the administrator mailbox.
   */
  async getMessages(): Promise<
    OutboundMessage[]
  > {
    return this.getAllOutboundMessages();
  }
}

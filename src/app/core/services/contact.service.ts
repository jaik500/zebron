import { Injectable } from '@angular/core';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

import { firebaseApp } from './firebase-config';

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;

  /**
   * Honeypot field used to reduce simple bot submissions.
   *
   * Legitimate users should leave this empty.
   */
  website?: string;
}

/**
 * Data required to send an administrator reply
 * to an existing contact message.
 */
export interface ContactReply {
  messageId: string;
  to: string;
  subject: string;
  message: string;
}

/**
 * Data required to send a new administrator email.
 */
export interface NewContactMessage {
  to: string;
  subject: string;
  message: string;
}

interface ContactFunctionResponse {
  success: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /**
   * Firebase Functions client.
   *
   * The backend functions are deployed to us-central1.
   */
  private readonly functions =
    getFunctions(
      firebaseApp,
      'us-central1',
    );

  /**
   * Send a contact message from the public
   * contact form to the Firebase backend.
   */
  async sendMessage(
    submission: ContactSubmission,
  ): Promise<void> {
    const sendContactMessage =
      httpsCallable<
        ContactSubmission,
        ContactFunctionResponse
      >(
        this.functions,
        'submitContactMessage',
      );

    await sendContactMessage(
      submission,
    );
  }

  /**
   * Send a reply to an existing contact message.
   *
   * The Firebase backend verifies that the caller
   * is an administrator before sending the email.
   */
  async sendReply(
    reply: ContactReply,
  ): Promise<void> {
    const sendContactReply =
      httpsCallable<
        ContactReply,
        ContactFunctionResponse
      >(
        this.functions,
        'sendContactReply',
      );

    await sendContactReply(
      reply,
    );
  }

  /**
   * Send a new message from the administrator mailbox.
   *
   * The Firebase backend verifies that the caller
   * is an administrator before sending the email.
   */
  async sendNewMessage(
    message: NewContactMessage,
  ): Promise<void> {
    const sendNewContactMessage =
      httpsCallable<
        NewContactMessage,
        ContactFunctionResponse
      >(
        this.functions,
        'sendNewContactMessage',
      );

    await sendNewContactMessage(
      message,
    );
  }
}

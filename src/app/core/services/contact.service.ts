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

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /**
   * Firebase Functions client.
   *
   * The backend function is deployed to us-central1,
   * which is also the region currently used by the
   * createUser function.
   */
  private readonly functions =
    getFunctions(
      firebaseApp,
      'us-central1',
    );


  /**
   * Send a contact message to the Firebase backend.
   */
  async sendMessage(
    submission: ContactSubmission,
  ): Promise<void> {
    const sendContactMessage =
      httpsCallable<
        ContactSubmission,
        { success: boolean }
      >(
        this.functions,
        'submitContactMessage',
      );

    await sendContactMessage(
      submission,
    );
  }
}
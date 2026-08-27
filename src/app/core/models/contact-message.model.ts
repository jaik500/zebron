import { Timestamp } from 'firebase/firestore';

/**
 * Status values for contact messages.
 *
 * new       - Message has not been reviewed.
 * read      - Administrator has reviewed the message.
 * archived  - Message has been archived.
 */
export type ContactMessageStatus =
  | 'unread'
  | 'read'
  | 'archived';

/**
 * Represents a message submitted through
 * the public Zebron contact form.
 */
export interface ContactMessage {
  id: string;

  name: string;

  email: string;

  subject: string;

  message: string;

  status: ContactMessageStatus;

  submittedBy?: string;

  createdAt: Timestamp;

  updatedAt?: Timestamp;
}

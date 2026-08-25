import { Timestamp } from 'firebase/firestore';

/**
 * Identifies how an outbound email was created.
 *
 * new   - A new administrator email.
 * reply - A reply to an existing contact message.
 */
export type OutboundMessageType =
  | 'new'
  | 'reply'
  | 'forward';

/**
 * Represents an email successfully sent through
 * the Zebron administrator mailbox.
 */
export interface OutboundMessage {
  /** Firestore document ID. */
  id: string;

  /** Sender email address. */
  from: string;

  /** Recipient email address. */
  to: string;

  /** Email subject. */
  subject: string;

  /** Email body. */
  message: string;

  /** Identifies whether this was a new email or reply. */
  type: OutboundMessageType;

  /**
   * Original contact message ID when this
   * outbound email is a reply.
   */
  replyToMessageId?: string;

  /** Firebase Auth UID of the administrator who sent it. */
  sentBy: string;

  /** Delivery status recorded by the backend. */
  status: 'sent';

  /** Time the email was recorded as sent. */
  createdAt: Timestamp;
}

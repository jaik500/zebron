import { Timestamp } from 'firebase/firestore';
import { Location } from './location.model';

export type SubmissionStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface ResourceSubmission {
  id: string;

  submittedBy?: string;

  resourceName: string;
  description: string;

  website?: string;

  categoryId?: string;

  organizationName?: string;

  location?: Location;

  submitterEmail?: string;

  status: SubmissionStatus;

  reviewedBy?: string;
  reviewedAt?: Timestamp;

  createdAt: Timestamp;
}
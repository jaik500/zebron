import { Timestamp } from 'firebase/firestore';

/**
 * Business document categories.
 */
export type BusinessDocumentCategory =
  | 'business-registration'
  | 'operating-agreement'
  | 'ein'
  | 'annual-report'
  | 'bank-statement'
  | 'invoice'
  | 'receipt'
  | 'tax'
  | 'license-permit'
  | 'contract'
  | 'government-correspondence'
  | 'insurance'
  | 'financial'
  | 'compliance'
  | 'other';

/**
 * Document lifecycle status.
 */
export type BusinessDocumentStatus =
  | 'active'
  | 'archived';

/**
 * Business document metadata.
 *
 * The actual file is stored in Firebase Storage.
 */
export interface BusinessDocument {
  id: string;

  businessId: string;

  name: string;

  category: BusinessDocumentCategory;

  description?: string;

  fileName: string;

  mimeType: string;

  sizeBytes: number;

  storagePath: string;

  downloadUrl: string;

  uploadedBy?: string;

  uploadedAt: Timestamp;

  expiresAt?: Timestamp;

  verified: boolean;

  status: BusinessDocumentStatus;

  notes?: string;

  createdAt: Timestamp;

  updatedAt: Timestamp;
}

/**
 * Data supplied by the UI before the file is uploaded.
 */
export interface BusinessDocumentInput {
  businessId: string;

  name: string;

  category: BusinessDocumentCategory;

  description?: string;

  expiresAt?: Timestamp;

  verified: boolean;

  notes?: string;
}
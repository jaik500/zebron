import { Timestamp } from 'firebase/firestore';

/**
 * Business document categories.
 */
export type BusinessDocumentCategory =
  | 'legal'
  | 'financial'
  | 'tax'
  | 'compliance'
  | 'license'
  | 'permit'
  | 'contract'
  | 'insurance'
  | 'government'
  | 'other';

/**
 * Metadata for documents stored in Firebase Storage.
 *
 * The Firestore record stores metadata while the
 * actual file is stored in Firebase Storage.
 */
export interface BusinessDocument {
  id: string;

  businessId: string;

  name: string;

  category: BusinessDocumentCategory;

  description?: string;

  fileName: string;

  storagePath: string;

  contentType?: string;

  sizeBytes?: number;

  uploadedBy: string;

  uploadedAt: Timestamp;

  updatedAt: Timestamp;
}
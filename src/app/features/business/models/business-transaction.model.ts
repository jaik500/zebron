import { Timestamp } from 'firebase/firestore';

/**
 * Identifies whether a transaction represents money
 * coming into or going out of the business.
 */
export type BusinessTransactionType =
  | 'revenue'
  | 'expense';

/**
 * Current lifecycle status of a transaction.
 */
export type BusinessTransactionStatus =
  | 'pending'
  | 'completed'
  | 'void'
  | 'refunded';

/**
 * A financial transaction belonging to a Zebron business.
 */
export interface BusinessTransaction {

  /**
   * Firestore document ID.
   */
  id: string;

  /**
   * Business this transaction belongs to.
   */
  businessId: string;

  /**
   * Revenue or expense.
   */
  type: BusinessTransactionType;

  /**
   * Transaction date.
   */
  date: Timestamp;

  /**
   * Positive monetary amount.
   */
  amount: number;

  /**
   * Business-specific category.
   */
  categoryId: string;

  /**
   * Short description of the transaction.
   */
  description?: string;

  /**
   * Customer/payer for revenue transactions.
   */
  customerId?: string;

  /**
   * Vendor/payee for expense transactions.
   */
  vendorId?: string;

  /**
   * Payment method used.
   */
  paymentMethod?: string;

  /**
   * Invoice, receipt, check, or other reference.
   */
  referenceNumber?: string;

  /**
   * Optional financial account.
   */
  accountId?: string;

  /**
   * Current transaction status.
   */
  status: BusinessTransactionStatus;

  /**
   * Indicates whether this is a recurring transaction.
   */
  recurring?: boolean;

  /**
   * Indicates whether an expense is tax deductible.
   */
  taxDeductible?: boolean;

  /**
   * Optional document/receipt associated with the transaction.
   */
  documentId?: string;

  /**
   * Optional business activity associated with the transaction.
   */
  activityId?: string;

  /**
   * Additional notes.
   */
  notes?: string;

  /**
   * UID of the administrator who created the transaction.
   */
  createdBy: string;

  /**
   * Creation timestamp.
   */
  createdAt: Timestamp;

  /**
   * Last update timestamp.
   */
  updatedAt: Timestamp;
}
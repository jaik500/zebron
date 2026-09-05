import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { Business } from '../models/business.model';

import { BusinessTransaction } from '../models/business-transaction.model';

import { BusinessActivity } from '../models/business-activity.model';

import { BusinessComplianceRequirement } from '../models/business-compliance.model';

import { BusinessDocument } from '../models/business-document.model';

/**
 * Service responsible for Business Operations
 * Firestore persistence.
 *
 * This service handles persistence only.
 *
 * UI state and derived calculations belong in
 * BusinessStore.
 */
@Injectable({
  providedIn: 'root',
})
export class BusinessService {
  private readonly firestore = firestore;

  // ============================================================
  // COLLECTION REFERENCES
  // ============================================================

  private readonly businessesCollection = collection(firestore, 'businesses');

  private readonly transactionsCollection = collection(firestore, 'businessTransactions');

  private readonly activitiesCollection = collection(firestore, 'businessActivities');

  private readonly complianceCollection = collection(firestore, 'businessCompliance');

  private readonly documentsCollection = collection(firestore, 'businessDocuments');

  // ============================================================
  // BUSINESS
  // ============================================================

  /**
   * Get all businesses.
   */
  async getBusinesses(): Promise<Business[]> {
    const snapshot = await getDocs(query(this.businessesCollection, orderBy('createdAt', 'desc')));

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Business,
    );
  }

  /**
   * Get a single business.
   */
  async getBusiness(businessId: string): Promise<Business | null> {
    const businessRef = doc(firestore, 'businesses', businessId);

    const snapshot = await getDoc(businessRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Business;
  }

  /**
   * Create a business.
   */
  async createBusiness(
    business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const reference = await addDoc(this.businessesCollection, {
      ...business,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  /**
   * Update a business.
   */
  async updateBusiness(
    businessId: string,
    changes: Partial<Omit<Business, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    await updateDoc(doc(firestore, 'businesses', businessId), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  /**
   * Get all business transactions.
   */
  async getTransactions(): Promise<BusinessTransaction[]> {
    const snapshot = await getDocs(query(this.transactionsCollection, orderBy('date', 'desc')));

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as BusinessTransaction,
    );
  }

  /**
   * Create a transaction.
   */
  async createTransaction(
    transaction: Omit<BusinessTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const docRef = doc(this.transactionsCollection);

    const cleanTransaction = Object.fromEntries(
      Object.entries(transaction).filter(([, value]) => value !== undefined),
    );

    await setDoc(docRef, {
      ...cleanTransaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Update a transaction.
   */
  async updateTransaction(id: string, changes: Partial<BusinessTransaction>): Promise<void> {
    const docRef = doc(this.transactionsCollection, id);

    const cleanChanges = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    await updateDoc(docRef, {
      ...cleanChanges,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a transaction.
   */
  async deleteTransaction(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'businessTransactions', id);

    await deleteDoc(docRef);
  }

  // ============================================================
  // ACTIVITIES
  // ============================================================

  /**
   * Get all business activities.
   */
  async getActivities(): Promise<BusinessActivity[]> {
    const snapshot = await getDocs(query(this.activitiesCollection, orderBy('createdAt', 'desc')));

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as BusinessActivity,
    );
  }

  /**
   * Create an activity.
   */
  /**
   * Create an activity.
   */
  async createActivity(
    activity: Omit<BusinessActivity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const cleanActivity = Object.fromEntries(
      Object.entries(activity).filter(([, value]) => value !== undefined),
    );

    const reference = await addDoc(this.activitiesCollection, {
      ...cleanActivity,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  /**
   * Update an activity.
   */
  /**
   * Update an activity.
   */
  async updateActivity(
    activityId: string,
    changes: Partial<Omit<BusinessActivity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const cleanChanges = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    await updateDoc(doc(firestore, 'businessActivities', activityId), {
      ...cleanChanges,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete an activity.
   */
  async deleteActivity(activityId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'businessActivities', activityId));
  }

  // ============================================================
  // COMPLIANCE
  // ============================================================

  /**
   * Get all compliance requirements.
   */
  async getComplianceRequirements(): Promise<BusinessComplianceRequirement[]> {
    const snapshot = await getDocs(this.complianceCollection);

    return snapshot.docs.map((document) => ({
      ...document.data(),
      id: document.id,
    })) as BusinessComplianceRequirement[];
  }

  /**
   * Create a compliance requirement.
   */
  async createComplianceRequirement(
    requirement: Omit<BusinessComplianceRequirement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const cleanRequirement = Object.fromEntries(
      Object.entries(requirement).filter(([, value]) => value !== undefined),
    );

    const reference = await addDoc(this.complianceCollection, {
      ...cleanRequirement,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  /**
   * Update a compliance requirement.
   */
  async updateComplianceRequirement(
    requirementId: string,
    changes: Partial<Omit<BusinessComplianceRequirement, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const cleanChanges = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    await updateDoc(doc(firestore, 'businessCompliance', requirementId), {
      ...cleanChanges,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Delete a compliance requirement.
   */
  async deleteComplianceRequirement(requirementId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'businessCompliance', requirementId));
  }

  // ============================================================
  // DOCUMENTS
  // ============================================================

  /**
   * Get document metadata.
   *
   * Actual files will later be retrieved from
   * Firebase Storage.
   */
  async getDocuments(): Promise<BusinessDocument[]> {
    const snapshot = await getDocs(query(this.documentsCollection, orderBy('uploadedAt', 'desc')));

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as BusinessDocument,
    );
  }

  /**
   * Re-evaluates the status of every business compliance requirement
   * against the current date.
   *
   * Status rules:
   *
   * completedDate exists
   *   → current
   *
   * status is not_applicable
   *   → remains not_applicable
   *
   * dueDate/renewalDate is in the future
   *   → upcoming
   *
   * dueDate/renewalDate is today
   *   → action_required
   *
   * dueDate/renewalDate is in the past
   *   → overdue
   *
   * Records without a due date or renewal date are left unchanged.
   */
  async refreshComplianceStatuses(): Promise<BusinessComplianceRequirement[]> {
    const snapshot = await getDocs(this.complianceCollection);

    const today = this.getLocalDateKey(new Date());

    const updates: Promise<void>[] = [];

    const updatedItems = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data() as Omit<BusinessComplianceRequirement, 'id'>;

      if (data.automaticMonitoring !== true) {
        return {
          ...data,
          id: snapshotDoc.id,
        } as BusinessComplianceRequirement;
      }

      let newStatus = data.status;

      /*
       * Completed requirements are always current.
       */
      if (data.completedDate) {
        newStatus = 'current';
      } else if (data.status === 'not_applicable') {

      /*
       * Do not automatically change requirements that have
       * explicitly been marked as not applicable.
       */
        newStatus = 'not_applicable';
      } else {
        /*
         * Prefer dueDate. If no dueDate exists, use renewalDate.
         */
        const targetDate = data.dueDate ?? data.renewalDate;

        if (targetDate instanceof Timestamp) {
          const targetDateKey = this.getLocalDateKey(targetDate.toDate());

          if (targetDateKey > today) {
            newStatus = 'upcoming';
          } else if (targetDateKey === today) {
            newStatus = 'action_required';
          } else {
            newStatus = 'overdue';
          }
        }
      }

      /*
       * Only write to Firestore when the status actually changed.
       */
      if (newStatus !== data.status) {
        updates.push(
          updateDoc(doc(this.complianceCollection, snapshotDoc.id), {
            status: newStatus,
            updatedAt: Timestamp.now(),
          }),
        );
      }

      return {
        ...data,
        id: snapshotDoc.id,
        status: newStatus,
      } as BusinessComplianceRequirement;
    });

    /*
     * Wait for all required Firestore updates.
     */
    await Promise.all(updates);

    return updatedItems;
  }

  /**
   * Converts a Date into a YYYY-MM-DD date key using
   * the application's business timezone.
   *
   * Zebron business operations currently use Eastern Time.
   */
  private getLocalDateKey(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value ?? '';

    const month = parts.find((part) => part.type === 'month')?.value ?? '';

    const day = parts.find((part) => part.type === 'day')?.value ?? '';

    return `${year}-${month}-${day}`;
  }
}

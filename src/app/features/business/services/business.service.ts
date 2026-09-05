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

import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

import {
  firebaseAuth,
  firestore,
} from '../../../core/services/firebase-config';

import { Business } from '../models/business.model';

import {
  BusinessTransaction,
} from '../models/business-transaction.model';

import {
  BusinessActivity,
} from '../models/business-activity.model';

import {
  BusinessComplianceRequirement,
} from '../models/business-compliance.model';

import {
  BusinessDocument,
  BusinessDocumentInput,
} from '../models/business-document.model';

/**
 * Service responsible for Business Operations
 * Firestore and Firebase Storage persistence.
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

  /**
   * Firebase Storage instance used for business documents.
   */
  private readonly storage = getStorage();

  // ============================================================
  // COLLECTION REFERENCES
  // ============================================================

  private readonly businessesCollection =
    collection(
      firestore,
      'businesses',
    );

  private readonly transactionsCollection =
    collection(
      firestore,
      'businessTransactions',
    );

  private readonly activitiesCollection =
    collection(
      firestore,
      'businessActivities',
    );

  private readonly complianceCollection =
    collection(
      firestore,
      'businessCompliance',
    );

  private readonly documentsCollection =
    collection(
      firestore,
      'businessDocuments',
    );

  // ============================================================
  // BUSINESS
  // ============================================================

  /**
   * Get all businesses.
   */
  async getBusinesses(): Promise<Business[]> {
    const snapshot =
      await getDocs(
        query(
          this.businessesCollection,
          orderBy(
            'createdAt',
            'desc',
          ),
        ),
      );

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
  async getBusiness(
    businessId: string,
  ): Promise<Business | null> {
    const businessRef =
      doc(
        firestore,
        'businesses',
        businessId,
      );

    const snapshot =
      await getDoc(
        businessRef,
      );

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
    business: Omit<
      Business,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const reference =
      await addDoc(
        this.businessesCollection,
        {
          ...business,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        },
      );

    return reference.id;
  }

  /**
   * Update a business.
   */
  async updateBusiness(
    businessId: string,
    changes: Partial<
      Omit<
        Business,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    await updateDoc(
      doc(
        firestore,
        'businesses',
        businessId,
      ),
      {
        ...changes,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  // ============================================================
  // TRANSACTIONS
  // ============================================================

  /**
   * Get all business transactions.
   */
  async getTransactions(): Promise<
    BusinessTransaction[]
  > {
    const snapshot =
      await getDocs(
        query(
          this.transactionsCollection,
          orderBy(
            'date',
            'desc',
          ),
        ),
      );

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
    transaction: Omit<
      BusinessTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const docRef =
      doc(
        this.transactionsCollection,
      );

    const cleanTransaction =
      Object.fromEntries(
        Object.entries(
          transaction,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    await setDoc(
      docRef,
      {
        ...cleanTransaction,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      },
    );

    return docRef.id;
  }

  /**
   * Update a transaction.
   */
  async updateTransaction(
    id: string,
    changes: Partial<BusinessTransaction>,
  ): Promise<void> {
    const docRef =
      doc(
        this.transactionsCollection,
        id,
      );

    const cleanChanges =
      Object.fromEntries(
        Object.entries(
          changes,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    await updateDoc(
      docRef,
      {
        ...cleanChanges,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  /**
   * Delete a transaction.
   */
  async deleteTransaction(
    id: string,
  ): Promise<void> {
    const docRef =
      doc(
        this.firestore,
        'businessTransactions',
        id,
      );

    await deleteDoc(
      docRef,
    );
  }

  // ============================================================
  // ACTIVITIES
  // ============================================================

  /**
   * Get all business activities.
   */
  async getActivities(): Promise<
    BusinessActivity[]
  > {
    const snapshot =
      await getDocs(
        query(
          this.activitiesCollection,
          orderBy(
            'createdAt',
            'desc',
          ),
        ),
      );

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
  async createActivity(
    activity: Omit<
      BusinessActivity,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const cleanActivity =
      Object.fromEntries(
        Object.entries(
          activity,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    const reference =
      await addDoc(
        this.activitiesCollection,
        {
          ...cleanActivity,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        },
      );

    return reference.id;
  }

  /**
   * Update an activity.
   */
  async updateActivity(
    activityId: string,
    changes: Partial<
      Omit<
        BusinessActivity,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    const cleanChanges =
      Object.fromEntries(
        Object.entries(
          changes,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    await updateDoc(
      doc(
        firestore,
        'businessActivities',
        activityId,
      ),
      {
        ...cleanChanges,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  /**
   * Delete an activity.
   */
  async deleteActivity(
    activityId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        firestore,
        'businessActivities',
        activityId,
      ),
    );
  }

  // ============================================================
  // COMPLIANCE
  // ============================================================

  /**
   * Get all compliance requirements.
   */
  async getComplianceRequirements(): Promise<
    BusinessComplianceRequirement[]
  > {
    const snapshot =
      await getDocs(
        this.complianceCollection,
      );

    return snapshot.docs.map(
      (document) => ({
        ...document.data(),
        id: document.id,
      }),
    ) as BusinessComplianceRequirement[];
  }

  /**
   * Create a compliance requirement.
   */
  async createComplianceRequirement(
    requirement: Omit<
      BusinessComplianceRequirement,
      'id' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<string> {
    const cleanRequirement =
      Object.fromEntries(
        Object.entries(
          requirement,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    const reference =
      await addDoc(
        this.complianceCollection,
        {
          ...cleanRequirement,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        },
      );

    return reference.id;
  }

  /**
   * Update a compliance requirement.
   */
  async updateComplianceRequirement(
    requirementId: string,
    changes: Partial<
      Omit<
        BusinessComplianceRequirement,
        'id' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<void> {
    const cleanChanges =
      Object.fromEntries(
        Object.entries(
          changes,
        ).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    await updateDoc(
      doc(
        firestore,
        'businessCompliance',
        requirementId,
      ),
      {
        ...cleanChanges,
        updatedAt:
          serverTimestamp(),
      },
    );
  }

  /**
   * Delete a compliance requirement.
   */
  async deleteComplianceRequirement(
    requirementId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        firestore,
        'businessCompliance',
        requirementId,
      ),
    );
  }

  // ============================================================
  // DOCUMENTS
  // ============================================================

  /**
   * Get all business document metadata.
   *
   * The actual files are stored in Firebase Storage.
   */
  async getDocuments(): Promise<
    BusinessDocument[]
  > {
    const snapshot =
      await getDocs(
        query(
          this.documentsCollection,
          orderBy(
            'uploadedAt',
            'desc',
          ),
        ),
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as BusinessDocument,
    );
  }

  /**
   * Upload a new business document.
   *
   * The binary file is written to Firebase Storage.
   * Firestore receives the document metadata and
   * generated download URL.
   */
  async createDocument(
    document: BusinessDocumentInput,
    file: File,
  ): Promise<BusinessDocument> {
    const uploadedBy =
      firebaseAuth.currentUser?.uid;

    const safeFileName =
      this.sanitizeFileName(
        file.name,
      );

    const storagePath =
      `business-documents/${document.businessId}/${Date.now()}-${safeFileName}`;

    const storageReference =
      ref(
        this.storage,
        storagePath,
      );

    try {
      /*
       * Upload the file first.
       */
      await uploadBytes(
        storageReference,
        file,
        {
          contentType:
            file.type ||
            'application/octet-stream',
        },
      );

      /*
       * Generate the download URL
       * after the Storage upload succeeds.
       */
      const downloadUrl =
        await getDownloadURL(
          storageReference,
        );

      /*
       * Save the metadata in Firestore.
       */
      const firestoreReference =
        await addDoc(
          this.documentsCollection,
          {
            ...document,

            fileName:
              file.name,

            mimeType:
              file.type ||
              'application/octet-stream',

            sizeBytes:
              file.size,

            storagePath,

            downloadUrl,

            uploadedBy,

            uploadedAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            status:
              'active',
          },
        );

      /*
       * Return the locally complete record so
       * BusinessStore can update immediately.
       */
      const now =
        Timestamp.now();

      return {
        ...document,

        id:
          firestoreReference.id,

        fileName:
          file.name,

        mimeType:
          file.type ||
          'application/octet-stream',

        sizeBytes:
          file.size,

        storagePath,

        downloadUrl,

        uploadedBy,

        uploadedAt:
          now,

        createdAt:
          now,

        updatedAt:
          now,

        status:
          'active',
      };
    } catch (error) {
      /*
       * If Firestore fails after Storage succeeds,
       * remove the uploaded file so we do not leave
       * an orphaned Storage object.
       */
      try {
        await deleteObject(
          storageReference,
        );
      } catch {
        /*
         * Preserve the original upload/Firestore error.
         */
      }

      throw error;
    }
  }

  /**
   * Update document metadata and optionally
   * replace the underlying Storage file.
   */
  async updateDocument(
    documentId: string,
    changes: Partial<BusinessDocument>,
    replacementFile?: File,
  ): Promise<BusinessDocument> {
    const documentReference =
      doc(
        this.documentsCollection,
        documentId,
      );

    const snapshot =
      await getDoc(
        documentReference,
      );

    if (!snapshot.exists()) {
      throw new Error(
        'Business document not found.',
      );
    }

    const existing =
      ({
        id: snapshot.id,
        ...snapshot.data(),
      }) as BusinessDocument;

    let updatedChanges:
      Record<string, unknown> = {
        ...changes,
      };

    let replacementStoragePath:
      string | undefined;

    /*
     * If the administrator selected a new file,
     * upload the replacement first.
     */
    if (replacementFile) {
      const safeFileName =
        this.sanitizeFileName(
          replacementFile.name,
        );

      replacementStoragePath =
        `business-documents/${existing.businessId}/${Date.now()}-${safeFileName}`;

      const replacementReference =
        ref(
          this.storage,
          replacementStoragePath,
        );

      await uploadBytes(
        replacementReference,
        replacementFile,
        {
          contentType:
            replacementFile.type ||
            'application/octet-stream',
        },
      );

      const downloadUrl =
        await getDownloadURL(
          replacementReference,
        );

      updatedChanges = {
        ...updatedChanges,

        fileName:
          replacementFile.name,

        mimeType:
          replacementFile.type ||
          'application/octet-stream',

        sizeBytes:
          replacementFile.size,

        storagePath:
          replacementStoragePath,

        downloadUrl,
      };
    }

    try {
      /*
       * Update Firestore only after the replacement
       * file has been uploaded successfully.
       */
      await updateDoc(
        documentReference,
        {
          ...this.removeUndefined(
            updatedChanges,
          ),

          updatedAt:
            serverTimestamp(),
        },
      );
    } catch (error) {
      /*
       * If the replacement file was uploaded but
       * Firestore failed, clean up the replacement.
       */
      if (replacementStoragePath) {
        try {
          await deleteObject(
            ref(
              this.storage,
              replacementStoragePath,
            ),
          );
        } catch {
          /*
           * Preserve the original Firestore error.
           */
        }
      }

      throw error;
    }

    /*
     * Delete the old file only after Firestore
     * successfully points to the replacement.
     */
    if (
      replacementStoragePath &&
      existing.storagePath &&
      existing.storagePath !==
        replacementStoragePath
    ) {
      try {
        await deleteObject(
          ref(
            this.storage,
            existing.storagePath,
          ),
        );
      } catch {
        /*
         * Firestore metadata is already correct.
         * Old-file cleanup failure should not make
         * the update appear unsuccessful.
         */
      }
    }

    return {
      ...existing,
      ...updatedChanges,
      updatedAt:
        Timestamp.now(),
    } as BusinessDocument;
  }

  /**
   * Delete both the Firestore metadata and
   * the associated Firebase Storage file.
   */
  async deleteDocument(
    documentId: string,
  ): Promise<void> {
    const documentReference =
      doc(
        this.documentsCollection,
        documentId,
      );

    const snapshot =
      await getDoc(
        documentReference,
      );

    if (!snapshot.exists()) {
      return;
    }

    const document =
      ({
        id: snapshot.id,
        ...snapshot.data(),
      }) as BusinessDocument;

    /*
     * Remove Firestore metadata first.
     */
    await deleteDoc(
      documentReference,
    );

    /*
     * Then remove the binary file.
     */
    if (document.storagePath) {
      try {
        await deleteObject(
          ref(
            this.storage,
            document.storagePath,
          ),
        );
      } catch {
        /*
         * Firestore deletion already succeeded.
         * Storage cleanup failure should not make
         * the metadata deletion appear unsuccessful.
         */
      }
    }
  }

  /**
   * Remove undefined properties before sending
   * update data to Firestore.
   */
  private removeUndefined(
    value: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(
        value,
      ).filter(
        ([, entryValue]) =>
          entryValue !== undefined,
      ),
    );
  }

  /**
   * Convert an uploaded file name into a safe
   * Firebase Storage path segment.
   */
  private sanitizeFileName(
    fileName: string,
  ): string {
    return fileName
      .trim()
      .replace(
        /[^a-zA-Z0-9._-]/g,
        '-',
      );
  }

  // ============================================================
  // COMPLIANCE STATUS REFRESH
  // ============================================================

  /**
   * Re-evaluates the status of every business compliance
   * requirement against the current date.
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
   * Records without a due date or renewal date are
   * left unchanged.
   */
  async refreshComplianceStatuses(): Promise<
    BusinessComplianceRequirement[]
  > {
    const snapshot =
      await getDocs(
        this.complianceCollection,
      );

    const today =
      this.getLocalDateKey(
        new Date(),
      );

    const updates:
      Promise<void>[] = [];

    const updatedItems =
      snapshot.docs.map(
        (snapshotDoc) => {
          const data =
            snapshotDoc.data() as Omit<
              BusinessComplianceRequirement,
              'id'
            >;

          if (
            data.automaticMonitoring !==
            true
          ) {
            return {
              ...data,
              id:
                snapshotDoc.id,
            } as BusinessComplianceRequirement;
          }

          let newStatus =
            data.status;

          /*
           * Completed requirements are always current.
           */
          if (data.completedDate) {
            newStatus =
              'current';
          } else if (
            data.status ===
            'not_applicable'
          ) {
            /*
             * Do not automatically change requirements
             * explicitly marked as not applicable.
             */
            newStatus =
              'not_applicable';
          } else {
            /*
             * Prefer dueDate. If no dueDate exists,
             * use renewalDate.
             */
            const targetDate =
              data.dueDate ??
              data.renewalDate;

            if (
              targetDate instanceof
              Timestamp
            ) {
              const targetDateKey =
                this.getLocalDateKey(
                  targetDate.toDate(),
                );

              if (
                targetDateKey >
                today
              ) {
                newStatus =
                  'upcoming';
              } else if (
                targetDateKey ===
                today
              ) {
                newStatus =
                  'action_required';
              } else {
                newStatus =
                  'overdue';
              }
            }
          }

          /*
           * Only write to Firestore when
           * the status actually changed.
           */
          if (
            newStatus !==
            data.status
          ) {
            updates.push(
              updateDoc(
                doc(
                  this.complianceCollection,
                  snapshotDoc.id,
                ),
                {
                  status:
                    newStatus,

                  updatedAt:
                    Timestamp.now(),
                },
              ),
            );
          }

          return {
            ...data,
            id:
              snapshotDoc.id,
            status:
              newStatus,
          } as BusinessComplianceRequirement;
        },
      );

    /*
     * Wait for all required Firestore updates.
     */
    await Promise.all(
      updates,
    );

    return updatedItems;
  }

  /**
   * Converts a Date into a YYYY-MM-DD date key
   * using the application's business timezone.
   *
   * Zebron Business Operations currently uses
   * Eastern Time.
   */
  private getLocalDateKey(
    date: Date,
  ): string {
    const parts =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone:
            'America/New_York',

          year:
            'numeric',

          month:
            '2-digit',

          day:
            '2-digit',
        },
      ).formatToParts(
        date,
      );

    const year =
      parts.find(
        (part) =>
          part.type === 'year',
      )?.value ?? '';

    const month =
      parts.find(
        (part) =>
          part.type === 'month',
      )?.value ?? '';

    const day =
      parts.find(
        (part) =>
          part.type === 'day',
      )?.value ?? '';

    return `${year}-${month}-${day}`;
  }
}

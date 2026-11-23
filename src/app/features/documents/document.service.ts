import { Injectable, computed, inject, signal } from '@angular/core';

import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getBytes, getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';

import { firebaseStorage, firestore } from '../../core/services/firebase-config';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { deleteDocumentAnnotations } from './document-annotation.store';
import { OfflineDocumentsService } from './offline-documents.service';
import { DocumentFormat, MAX_FILE_BYTES, UploadCheck, checkUpload, clampProgress } from './document-formats';
import { filledFileName } from './pdf-forms';

/**
 * My documents: a person's own files, read in Zebron (/courses/documents).
 *
 *   Firestore  users/{uid}/documents/{documentId}   title, format, size, where they stopped reading
 *   Storage    users/{uid}/documents/{documentId}/{fileName}   the file itself
 *
 * Both are private to the owner (firestore.rules, storage.rules).
 */
export interface ReadingPosition {
  /** PDF page (1-based). */
  page?: number;
  /** EPUB chapter (0-based). */
  chapter?: number;
  /** Scroll position from 0 to 1 (EPUB chapter, Word, text). */
  scroll?: number;
}

export interface UserDocument {
  id: string;
  title: string;
  fileName: string;
  format: DocumentFormat;
  contentType: string;
  size: number;
  storagePath: string;
  position: ReadingPosition;
  progress: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  openedAt: Date | null;
}

export type UploadOutcome = { ok: true; document: UserDocument } | Extract<UploadCheck, { ok: false }> | { ok: false; reason: 'failed' };

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toUserDocument(id: string, data: Record<string, unknown>): UserDocument {
  const position = (data['position'] ?? {}) as Record<string, unknown>;
  const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
  return {
    id,
    title: String(data['title'] ?? ''),
    fileName: String(data['fileName'] ?? ''),
    format: (data['format'] as DocumentFormat) ?? 'pdf',
    contentType: String(data['contentType'] ?? ''),
    size: Number(data['size'] ?? 0),
    storagePath: String(data['storagePath'] ?? ''),
    position: { page: number(position['page']), chapter: number(position['chapter']), scroll: number(position['scroll']) },
    progress: clampProgress(Number(data['progress'] ?? 0)),
    createdAt: toDate(data['createdAt']),
    updatedAt: toDate(data['updatedAt']),
    openedAt: toDate(data['openedAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly offline = inject(OfflineDocumentsService);

  private readonly items = signal<UserDocument[]>([]);
  private readonly loadedFor = signal<string | null>(null);

  /** The signed-in person's documents, most recently used first. */
  readonly documents = this.items.asReadonly();
  readonly totalBytes = computed(() => this.items().reduce((sum, item) => sum + item.size, 0));
  readonly loaded = computed(() => this.loadedFor() !== null && this.loadedFor() === (this.auth.firebaseUser()?.uid ?? null));

  private uid(): string {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) throw new Error('Sign in to use My documents.');
    return uid;
  }

  async load(): Promise<void> {
    const uid = this.uid();
    const snapshot = await getDocs(query(collection(firestore, 'users', uid, 'documents'), orderBy('updatedAt', 'desc')));
    this.items.set(snapshot.docs.map((item) => toUserDocument(item.id, item.data())));
    this.loadedFor.set(uid);
  }

  /** Offline: show the documents kept on this device instead of the full list. */
  showKept(documents: UserDocument[]): void {
    this.items.set([...documents].sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)));
    this.loadedFor.set(this.auth.firebaseUser()?.uid ?? null);
  }

  async get(documentId: string): Promise<UserDocument | null> {
    const snapshot = await getDoc(doc(firestore, 'users', this.uid(), 'documents', documentId));
    return snapshot.exists() ? toUserDocument(snapshot.id, snapshot.data()) : null;
  }

  /** Check a file against the formats and limits before uploading it. */
  check(file: File): UploadCheck {
    return checkUpload(file, { count: this.items().length, totalBytes: this.totalBytes() });
  }

  /**
   * Upload a file, then save its details. If saving the details fails, the
   * uploaded file is removed again so nothing is left behind.
   */
  async upload(file: File, onProgress?: (percent: number) => void, title?: string): Promise<UploadOutcome> {
    const checked = this.check(file);
    if (!checked.ok) return checked;
    if (title?.trim()) checked.title = title.replace(/\s+/g, ' ').trim().slice(0, 200);
    const uid = this.uid();
    const reference = doc(collection(firestore, 'users', uid, 'documents'));
    const storagePath = `users/${uid}/documents/${reference.id}/${checked.fileName}`;
    const fileRef = ref(firebaseStorage, storagePath);

    try {
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file, {
          contentType: checked.contentType,
          contentDisposition: `inline; filename="${checked.fileName}"`,
        });
        task.on(
          'state_changed',
          (snapshot) => onProgress?.(snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0),
          reject,
          () => resolve(),
        );
      });
    } catch (error) {
      this.logger.error('DocumentService', 'Upload failed.', error);
      return { ok: false, reason: 'failed' };
    }

    try {
      await setDoc(reference, {
        title: checked.title,
        fileName: checked.fileName,
        format: checked.format,
        contentType: checked.contentType,
        size: file.size,
        storagePath,
        position: {},
        progress: 0,
        openedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      this.logger.error('DocumentService', 'Saving the document details failed.', error);
      await deleteObject(fileRef).catch(() => undefined);
      return { ok: false, reason: 'failed' };
    }

    const now = new Date();
    const created: UserDocument = {
      id: reference.id,
      title: checked.title,
      fileName: checked.fileName,
      format: checked.format,
      contentType: checked.contentType,
      size: file.size,
      storagePath,
      position: {},
      progress: 0,
      createdAt: now,
      updatedAt: now,
      openedAt: null,
    };
    this.items.update((items) => [created, ...items]);
    return { ok: true, document: created };
  }

  async rename(documentId: string, title: string): Promise<void> {
    const clean = title.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!clean) return;
    await updateDoc(doc(firestore, 'users', this.uid(), 'documents', documentId), { title: clean, updatedAt: serverTimestamp() });
    this.items.update((items) => items.map((item) => (item.id === documentId ? { ...item, title: clean, updatedAt: new Date() } : item)));
  }

  /**
   * Delete the file, its highlights and notes, and its details. A file
   * already gone from Storage doesn't stop the delete.
   */
  async remove(document: UserDocument): Promise<void> {
    const uid = this.uid();
    await deleteObject(ref(firebaseStorage, document.storagePath)).catch((error: { code?: string }) => {
      if (error?.code !== 'storage/object-not-found') throw error;
    });
    await this.offline.remove(uid, document.id).catch(() => undefined);
    await deleteDocumentAnnotations(uid, document.id).catch((error) =>
      this.logger.error('DocumentService', 'Could not delete the highlights of a deleted document.', error),
    );
    await deleteDoc(doc(firestore, 'users', uid, 'documents', document.id));
    this.items.update((items) => items.filter((item) => item.id !== document.id));
  }

  /**
   * Save a filled-in PDF form over the document's file (the same name and
   * place), and update its size. Highlights and the reading place stay.
   */
  async replacePdf(document: UserDocument, bytes: Uint8Array): Promise<UserDocument> {
    if (document.format !== 'pdf') throw new Error('Only PDF forms can be saved.');
    if (!bytes.byteLength || bytes.byteLength > MAX_FILE_BYTES) throw new Error('The filled-in PDF is too large to save.');
    const uid = this.uid();
    await uploadBytes(ref(firebaseStorage, document.storagePath), bytes, {
      contentType: 'application/pdf',
      contentDisposition: `inline; filename="${document.fileName}"`,
    });
    await updateDoc(doc(firestore, 'users', uid, 'documents', document.id), { size: bytes.byteLength, updatedAt: serverTimestamp() });
    const updated: UserDocument = { ...document, size: bytes.byteLength, contentType: 'application/pdf', updatedAt: new Date() };
    this.items.update((items) => items.map((item) => (item.id === document.id ? updated : item)));
    return updated;
  }

  /** Save a filled-in PDF form as a new document, "Name (filled).pdf", keeping the original. */
  async savePdfCopy(document: UserDocument, bytes: Uint8Array): Promise<UploadOutcome> {
    // The limits on the number of files and space are checked against the full list.
    if (!this.loaded()) await this.load().catch(() => undefined);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const file = new File([copy.buffer], filledFileName(document.fileName), { type: 'application/pdf' });
    return this.upload(file, undefined, `${document.title} (filled)`);
  }

  /** The file's bytes, for the reader. Needs CORS on the Storage bucket (storage.cors.json). */
  async bytes(document: UserDocument): Promise<ArrayBuffer> {
    return getBytes(ref(firebaseStorage, document.storagePath), MAX_FILE_BYTES);
  }

  /** A link to download the original file. */
  async downloadUrl(document: UserDocument): Promise<string> {
    return getDownloadURL(ref(firebaseStorage, document.storagePath));
  }

  async markOpened(documentId: string): Promise<void> {
    await updateDoc(doc(firestore, 'users', this.uid(), 'documents', documentId), {
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Remember where the person stopped reading. */
  async savePosition(documentId: string, position: ReadingPosition, progress: number): Promise<void> {
    const clean: ReadingPosition = {};
    if (position.page !== undefined) clean.page = Math.max(1, Math.round(position.page));
    if (position.chapter !== undefined) clean.chapter = Math.max(0, Math.round(position.chapter));
    if (position.scroll !== undefined) clean.scroll = Math.min(1, Math.max(0, Math.round(position.scroll * 1000) / 1000));
    const value = clampProgress(progress);
    await updateDoc(doc(firestore, 'users', this.uid(), 'documents', documentId), {
      position: clean,
      progress: value,
      updatedAt: serverTimestamp(),
    });
    this.items.update((items) =>
      items.map((item) => (item.id === documentId ? { ...item, position: clean, progress: value, updatedAt: new Date() } : item)),
    );
  }
}

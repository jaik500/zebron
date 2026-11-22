import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { TextAnchor } from '../courses/annotations/annotation-anchoring';
import { ANNOTATION_LIMITS, AnnotationStore, HighlightColor, PaintableAnnotation } from '../courses/annotations/annotation.model';
import { OfflineDocumentsService } from './offline-documents.service';

/**
 * Highlights and notes in My documents, private to the reader:
 * users/{uid}/documentAnnotations/{id} (firestore.rules). The same four
 * colours, toolbar and painter as lessons (features/courses/annotations).
 *
 * blockIndex: the PDF page (0-based), the EPUB chapter, or 0 for Word,
 * text and markdown.
 */
export interface DocumentAnnotation extends PaintableAnnotation {
  documentId: string;
  documentTitle: string;
  createdAt: Date | null;
}

function toAnnotation(id: string, data: Record<string, unknown>): DocumentAnnotation {
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const created = data['createdAt'];
  return {
    id,
    kind: data['kind'] === 'note' ? 'note' : 'highlight',
    documentId: text(data['documentId']),
    documentTitle: text(data['documentTitle']),
    blockIndex: typeof data['blockIndex'] === 'number' ? data['blockIndex'] : 0,
    quote: text(data['quote']),
    prefix: text(data['prefix']),
    suffix: text(data['suffix']),
    color: (data['color'] as HighlightColor | null) ?? null,
    note: text(data['note']),
    createdAt: created instanceof Timestamp ? created.toDate() : null,
  };
}

function annotationsOf(uid: string) {
  return collection(firestore, 'users', uid, 'documentAnnotations');
}

/** A document's highlights and notes, read once (to keep them on the device with the document). */
export async function listDocumentAnnotations(uid: string, documentId: string): Promise<DocumentAnnotation[]> {
  const snapshot = await getDocs(query(annotationsOf(uid), where('documentId', '==', documentId)));
  return snapshot.docs.map((item) => toAnnotation(item.id, item.data()));
}

/** Delete every highlight and note of one document (used when the document is deleted). */
export async function deleteDocumentAnnotations(uid: string, documentId: string): Promise<void> {
  const snapshot = await getDocs(query(annotationsOf(uid), where('documentId', '==', documentId)));
  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = writeBatch(firestore);
    snapshot.docs.slice(index, index + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

/** Provided by the reader page, for the document it shows. */
@Injectable()
export class DocumentAnnotationStore extends AnnotationStore {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly offline = inject(OfflineDocumentsService);

  private readonly items = signal<DocumentAnnotation[]>([]);
  private readonly document = signal<{ id: string; title: string } | null>(null);
  private unsubscribe: (() => void) | null = null;

  /** This document's highlights and notes, in reading order (page or chapter, then when made). */
  readonly annotations = computed(() =>
    [...this.items()].sort(
      (a, b) => a.blockIndex - b.blockIndex || (a.createdAt?.getTime() ?? Infinity) - (b.createdAt?.getTime() ?? Infinity),
    ),
  );
  /** Highlighting needs a connection (offline, kept highlights are shown but can't be changed). */
  readonly available = computed(() => !!this.auth.firebaseUser() && !!this.document() && this.offline.online());

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.unsubscribe?.());
  }

  private uid(): string {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) throw new Error('Sign in to highlight.');
    return uid;
  }

  /**
   * Start following the highlights of one document. `kept`: the highlights
   * saved on this device with the document, shown until (or instead of,
   * when offline) the live ones.
   */
  open(documentId: string, title: string, kept: DocumentAnnotation[] = []): void {
    this.unsubscribe?.();
    this.items.set(kept);
    this.document.set({ id: documentId, title });
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    this.unsubscribe = onSnapshot(
      query(annotationsOf(uid), where('documentId', '==', documentId)),
      (snapshot) => {
        // Offline, Firestore may report an empty result from its (empty) cache: keep the kept copy.
        if (snapshot.metadata.fromCache && kept.length) return;
        this.items.set(snapshot.docs.map((item) => toAnnotation(item.id, item.data())));
      },
      (error) => this.logger.error('DocumentAnnotationStore', 'Could not load highlights.', error),
    );
  }

  async add(blockIndex: number, anchor: TextAnchor, color: HighlightColor | null, note = ''): Promise<void> {
    const current = this.document();
    if (!current) return;
    await addDoc(annotationsOf(this.uid()), {
      kind: color ? 'highlight' : 'note',
      documentId: current.id,
      documentTitle: current.title.slice(0, ANNOTATION_LIMITS.title),
      blockIndex: Math.max(0, Math.round(blockIndex)),
      quote: anchor.quote.slice(0, ANNOTATION_LIMITS.quote),
      prefix: anchor.prefix.slice(-ANNOTATION_LIMITS.context),
      suffix: anchor.suffix.slice(0, ANNOTATION_LIMITS.context),
      color,
      note: note.trim().slice(0, ANNOTATION_LIMITS.note),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async setColor(id: string, color: HighlightColor | null): Promise<void> {
    await updateDoc(doc(annotationsOf(this.uid()), id), { color, kind: color ? 'highlight' : 'note', updatedAt: serverTimestamp() });
  }

  async setNote(id: string, note: string): Promise<void> {
    await updateDoc(doc(annotationsOf(this.uid()), id), {
      note: note.trim().slice(0, ANNOTATION_LIMITS.note),
      updatedAt: serverTimestamp(),
    });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(annotationsOf(this.uid()), id));
  }
}

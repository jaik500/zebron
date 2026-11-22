import { Injectable, inject, signal } from '@angular/core';

import { ConnectivityService } from '../../core/services/connectivity.service';

import type { DocumentAnnotation } from './document-annotation.store';
import type { UserDocument } from './document.service';

/**
 * "Keep on this device" for My documents.
 *
 * A kept document's file, its details (with the reading position) and its
 * highlights are stored in this browser's Cache Storage, under the person's
 * account ID. The reader then opens it from the device: no download, no
 * data used, and it keeps working when the connection drops. The file never
 * changes after upload (storage.rules), so a kept copy is always current;
 * the details and highlights are refreshed whenever the reader is online.
 *
 * Kept copies stay until the person removes them, deletes the document, or
 * clears the browser's data. The browser is asked to keep them even when
 * space runs low (navigator.storage.persist()).
 *
 * Zebron itself opens with no connection through the service worker
 * (ngsw-config.json); this service keeps the documents.
 */
const CACHE_NAME = 'zebron-documents-v1';
/** The pdf.js worker (pdf-view.component.ts). */
const PDF_WORKER = '/pdfjs/pdf.worker.min.mjs';
/** Cache keys are same-origin URLs that are never fetched from the network. */
const KEY_PREFIX = '/__zebron-offline__/documents';

interface KeptDetails {
  document: StoredDocument;
  annotations: StoredAnnotation[];
  keptAt: string;
}

/** Dates as ISO strings for JSON. */
type StoredDocument = Omit<UserDocument, 'createdAt' | 'updatedAt' | 'openedAt'> & {
  createdAt: string | null;
  updatedAt: string | null;
  openedAt: string | null;
};
type StoredAnnotation = Omit<DocumentAnnotation, 'createdAt'> & { createdAt: string | null };

export interface KeptDocument {
  document: UserDocument;
  annotations: DocumentAnnotation[];
  bytes: ArrayBuffer;
}

const toIso = (date: Date | null) => (date ? date.toISOString() : null);
const fromIso = (value: string | null) => (value ? new Date(value) : null);

function key(uid: string, documentId: string, part: 'file' | 'details'): string {
  return `${KEY_PREFIX}/${encodeURIComponent(uid)}/${encodeURIComponent(documentId)}/${part}`;
}

@Injectable({ providedIn: 'root' })
export class OfflineDocumentsService {
  /** IDs of the signed-in person's documents kept on this device. */
  readonly keptIds = signal<ReadonlySet<string>>(new Set());
  /** False when the browser can't keep files (very old browsers, some private modes). */
  readonly supported = signal(typeof window !== 'undefined' && 'caches' in window);
  /** The device's connection, as the browser reports it. */
  readonly online = inject(ConnectivityService).online;

  private loadedFor: string | null = null;

  private async cache(): Promise<Cache | null> {
    if (!this.supported()) return null;
    try {
      return await caches.open(CACHE_NAME);
    } catch {
      this.supported.set(false);
      return null;
    }
  }

  /** Which of this person's documents are kept here. */
  async refresh(uid: string): Promise<void> {
    const cache = await this.cache();
    if (!cache) return;
    const prefix = `${KEY_PREFIX}/${encodeURIComponent(uid)}/`;
    const ids = new Set<string>();
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname;
      if (path.startsWith(prefix) && path.endsWith('/file')) {
        ids.add(decodeURIComponent(path.slice(prefix.length, -'/file'.length)));
      }
    }
    this.loadedFor = uid;
    this.keptIds.set(ids);
  }

  isKept(documentId: string): boolean {
    return this.keptIds().has(documentId);
  }

  /** Keep a document on this device. */
  async keep(uid: string, document: UserDocument, bytes: ArrayBuffer, annotations: DocumentAnnotation[] = []): Promise<boolean> {
    const cache = await this.cache();
    if (!cache) return false;
    try {
      await cache.put(
        key(uid, document.id, 'file'),
        new Response(new Blob([bytes], { type: document.contentType || 'application/octet-stream' })),
      );
      await this.writeDetails(cache, uid, document, annotations);
      // Ask the browser not to clear kept documents when space runs low.
      void navigator.storage?.persist?.().catch(() => false);
      // PDFs need the pdf.js worker: fetching it now lets the service worker keep it (ngsw-config.json "pdf-reader").
      if (document.format === 'pdf') void fetch(PDF_WORKER).catch(() => undefined);
      if (this.loadedFor !== uid) await this.refresh(uid);
      this.keptIds.update((ids) => new Set(ids).add(document.id));
      return true;
    } catch {
      // Out of space or blocked by the browser.
      await cache.delete(key(uid, document.id, 'file')).catch(() => false);
      return false;
    }
  }

  /** A kept document, or null when it isn't kept here (or the copy is unreadable). */
  async load(uid: string, documentId: string): Promise<KeptDocument | null> {
    const cache = await this.cache();
    if (!cache) return null;
    try {
      const [file, details] = await Promise.all([
        cache.match(key(uid, documentId, 'file')),
        cache.match(key(uid, documentId, 'details')),
      ]);
      if (!file || !details) return null;
      const stored = (await details.json()) as KeptDetails;
      return {
        bytes: await file.arrayBuffer(),
        document: {
          ...stored.document,
          createdAt: fromIso(stored.document.createdAt),
          updatedAt: fromIso(stored.document.updatedAt),
          openedAt: fromIso(stored.document.openedAt),
        },
        annotations: stored.annotations.map((item) => ({ ...item, createdAt: fromIso(item.createdAt) })),
      };
    } catch {
      return null;
    }
  }

  /** The details of every document kept here (no files), for My documents when offline. */
  async keptDocuments(uid: string): Promise<UserDocument[]> {
    await this.refresh(uid);
    const cache = await this.cache();
    if (!cache) return [];
    const documents: UserDocument[] = [];
    for (const id of this.keptIds()) {
      try {
        const details = await cache.match(key(uid, id, 'details'));
        if (!details) continue;
        const stored = ((await details.json()) as KeptDetails).document;
        documents.push({
          ...stored,
          createdAt: fromIso(stored.createdAt),
          updatedAt: fromIso(stored.updatedAt),
          openedAt: fromIso(stored.openedAt),
        });
      } catch {
        // An unreadable copy is skipped.
      }
    }
    return documents;
  }

  /** Update a kept document's details and highlights (only when it is kept). */
  async update(uid: string, document: UserDocument, annotations?: readonly DocumentAnnotation[]): Promise<void> {
    if (!this.isKept(document.id)) return;
    const cache = await this.cache();
    if (!cache) return;
    let current = annotations ? [...annotations] : null;
    if (!current) {
      const previous = await cache.match(key(uid, document.id, 'details'));
      current = previous
        ? ((await previous.json()) as KeptDetails).annotations.map((item) => ({ ...item, createdAt: fromIso(item.createdAt) }))
        : [];
    }
    await this.writeDetails(cache, uid, document, current).catch(() => undefined);
  }

  /** Remove a document from this device. */
  async remove(uid: string, documentId: string): Promise<void> {
    const cache = await this.cache();
    if (!cache) return;
    await Promise.all([cache.delete(key(uid, documentId, 'file')), cache.delete(key(uid, documentId, 'details'))]);
    this.keptIds.update((ids) => {
      const next = new Set(ids);
      next.delete(documentId);
      return next;
    });
  }

  private async writeDetails(cache: Cache, uid: string, document: UserDocument, annotations: readonly DocumentAnnotation[]): Promise<void> {
    const details: KeptDetails = {
      document: {
        ...document,
        createdAt: toIso(document.createdAt),
        updatedAt: toIso(document.updatedAt),
        openedAt: toIso(document.openedAt),
      },
      annotations: annotations.map((item) => ({ ...item, createdAt: toIso(item.createdAt) })),
      keptAt: new Date().toISOString(),
    };
    await cache.put(key(uid, document.id, 'details'), new Response(JSON.stringify(details), { headers: { 'Content-Type': 'application/json' } }));
  }
}

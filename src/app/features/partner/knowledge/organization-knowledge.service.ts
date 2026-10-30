import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import {
  KnowledgeArticle,
  KnowledgeArticleVersion,
  KnowledgeAudience,
  KnowledgeContentType,
} from '../../../core/models/knowledge-article.model';

/** Where an article comes from. */
export type KnowledgeSource = 'organization' | 'zebron';

export interface KnowledgeEntry extends KnowledgeArticle {
  source: KnowledgeSource;
}

/** Fields an organization editor fills in. */
export interface KnowledgeArticleInput {
  title: string;
  summary: string;
  content: string;
  contentType: KnowledgeContentType;
  category: string;
  tags: string[];
  applicationKey: string;
  downloadable: boolean;
}

/** Maximum article length (matches KNOWLEDGE_CONFIGURATION.maxContentLength). */
export const KNOWLEDGE_MAX_CONTENT = 250_000;

/**
 * Organization Knowledge Center data access.
 *
 * Organization articles live in
 *   organizations/{organizationId}/knowledgeArticles/{articleId}
 *   organizations/{organizationId}/knowledgeArticles/{articleId}/versions/{versionId}
 *
 * Firestore rules: active members read published articles; staff,
 * managers, admins and owners read everything and create, edit, publish, archive
 * and delete. Version records are immutable.
 *
 * Zebron articles (top-level knowledgeArticles) are read-only here:
 * published only, filtered by audience.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationKnowledgeService {
  private articles(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'knowledgeArticles');
  }

  /** Organization articles. Members must pass publishedOnly = true (rules). */
  async listOrganizationArticles(organizationId: string, publishedOnly: boolean): Promise<KnowledgeEntry[]> {
    const reference = this.articles(organizationId);
    const snapshot = await getDocs(publishedOnly ? query(reference, where('status', '==', 'published')) : reference);

    return snapshot.docs
      .map((item) => this.toEntry(item.id, item.data(), 'organization'))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  /** Published Zebron articles meant for the given audiences. */
  async listZebronArticles(audiences: KnowledgeAudience[]): Promise<KnowledgeEntry[]> {
    const snapshot = await getDocs(query(collection(firestore, 'knowledgeArticles'), where('status', '==', 'published')));

    return snapshot.docs
      .map((item) => this.toEntry(item.id, item.data(), 'zebron'))
      .filter((article) => article.audience.length === 0 || article.audience.some((audience) => audiences.includes(audience)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getArticle(organizationId: string, source: KnowledgeSource, articleId: string): Promise<KnowledgeEntry | null> {
    const reference =
      source === 'organization'
        ? doc(firestore, 'organizations', organizationId, 'knowledgeArticles', articleId)
        : doc(firestore, 'knowledgeArticles', articleId);
    const snapshot = await getDoc(reference);

    return snapshot.exists() ? this.toEntry(snapshot.id, snapshot.data(), source) : null;
  }

  async getVersions(organizationId: string, articleId: string): Promise<KnowledgeArticleVersion[]> {
    const snapshot = await getDocs(
      collection(firestore, 'organizations', organizationId, 'knowledgeArticles', articleId, 'versions'),
    );

    return snapshot.docs
      .map((item) => item.data() as KnowledgeArticleVersion)
      .sort((a, b) => b.version - a.version);
  }

  /** Creates a draft. Returns the new article ID. */
  async createDraft(organizationId: string, input: KnowledgeArticleInput, userId: string): Promise<string> {
    const reference = doc(this.articles(organizationId));
    const now = new Date().toISOString();
    const article: KnowledgeArticle = {
      id: reference.id,
      ...this.clean(input),
      audience: ['all'],
      status: 'draft',
      version: 1,
      authorId: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
      metadata: { organizationId },
    };

    await setDoc(reference, this.prune(article));
    return reference.id;
  }

  /** Saves edits. Edits to a published article stay published (see publish for versioning). */
  async saveArticle(organizationId: string, existing: KnowledgeArticle, input: KnowledgeArticleInput, userId: string): Promise<void> {
    const updated: KnowledgeArticle = {
      ...this.stripSource(existing),
      ...this.clean(input),
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(this.articles(organizationId), existing.id), this.prune(updated));
  }

  /**
   * Publishes the article and records an immutable version.
   * Re-publishing an already published or archived article increments the version.
   */
  async publish(organizationId: string, existing: KnowledgeArticle, input: KnowledgeArticleInput, userId: string): Promise<void> {
    const now = new Date().toISOString();
    const nextVersion = existing.publishedAt ? existing.version + 1 : existing.version;
    const fields = this.clean(input);
    const article: KnowledgeArticle = {
      ...this.stripSource(existing),
      ...fields,
      status: 'published',
      version: nextVersion,
      updatedBy: userId,
      updatedAt: now,
      publishedAt: now,
    };
    delete article.archivedAt;

    const version: KnowledgeArticleVersion = {
      id: `v${nextVersion}`,
      articleId: existing.id,
      version: nextVersion,
      title: fields.title,
      summary: fields.summary,
      content: fields.content,
      contentType: fields.contentType,
      category: fields.category,
      tags: fields.tags,
      audience: article.audience,
      createdBy: userId,
      createdAt: now,
      publishedAt: now,
    };

    const batch = writeBatch(firestore);
    batch.set(doc(this.articles(organizationId), existing.id), this.prune(article));
    batch.set(doc(this.articles(organizationId), existing.id, 'versions', version.id), this.prune(version));
    await batch.commit();
  }

  async archive(organizationId: string, existing: KnowledgeArticle, userId: string): Promise<void> {
    const now = new Date().toISOString();
    await setDoc(
      doc(this.articles(organizationId), existing.id),
      this.prune({ ...this.stripSource(existing), status: 'archived', archivedAt: now, updatedAt: now, updatedBy: userId }),
    );
  }

  /** Moves an archived article back to draft. */
  async restoreToDraft(organizationId: string, existing: KnowledgeArticle, userId: string): Promise<void> {
    const article: KnowledgeArticle = {
      ...this.stripSource(existing),
      status: 'draft',
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };
    delete article.archivedAt;
    await setDoc(doc(this.articles(organizationId), existing.id), this.prune(article));
  }

  /** Deletes a draft that was never published. Published history is kept by archiving instead. */
  async deleteDraft(organizationId: string, articleId: string): Promise<void> {
    await deleteDoc(doc(this.articles(organizationId), articleId));
  }

  // ----------------------------------------------------------

  private clean(input: KnowledgeArticleInput) {
    return {
      title: input.title.trim().slice(0, 200),
      summary: input.summary.trim().slice(0, 500),
      content: input.content.slice(0, KNOWLEDGE_MAX_CONTENT),
      contentType: input.contentType,
      category: input.category.trim().slice(0, 80) || 'General',
      tags: input.tags,
      applicationKey: input.applicationKey || 'organization',
      downloadable: input.downloadable,
    };
  }

  /** Removes the UI-only source field and undefined values (Firestore rejects undefined). */
  private stripSource(article: KnowledgeArticle | KnowledgeEntry): KnowledgeArticle {
    const copy = { ...article } as Partial<KnowledgeEntry>;
    delete copy.source;
    return copy as KnowledgeArticle;
  }

  private prune<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
  }

  private toEntry(id: string, data: Record<string, unknown>, source: KnowledgeSource): KnowledgeEntry {
    const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
    const list = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
    const date = (value: unknown) => {
      if (typeof value === 'string') return value;
      const maybe = value as { toDate?: () => Date } | null;
      return maybe?.toDate ? maybe.toDate().toISOString() : '';
    };

    return {
      id,
      source,
      applicationKey: text(data['applicationKey'], 'organization'),
      title: text(data['title'], 'Untitled article'),
      summary: text(data['summary']) || undefined,
      content: text(data['content']),
      contentType: text(data['contentType'], 'documentation') as KnowledgeContentType,
      category: text(data['category'], 'General'),
      tags: list(data['tags']),
      audience: list(data['audience']) as KnowledgeAudience[],
      status: text(data['status'], 'draft') as KnowledgeArticle['status'],
      version: typeof data['version'] === 'number' ? data['version'] : 1,
      authorId: text(data['authorId']),
      updatedBy: text(data['updatedBy']) || undefined,
      createdAt: date(data['createdAt']),
      updatedAt: date(data['updatedAt']) || date(data['createdAt']),
      publishedAt: date(data['publishedAt']) || undefined,
      archivedAt: date(data['archivedAt']) || undefined,
      downloadable: data['downloadable'] === true,
      metadata: (data['metadata'] as Record<string, unknown> | undefined) ?? undefined,
    };
  }
}

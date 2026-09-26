import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

import { Injectable, inject } from '@angular/core';

import {
  KnowledgeArticle,
  KnowledgeArticleFilter,
  KnowledgeArticleVersion,
} from '../../models/knowledge-article.model';

import { KnowledgeArticleRepository } from '../knowledge-article.repository';

import { firestore } from '../../services/firebase-config';

import { LoggerService } from '../../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class FirestoreKnowledgeArticleRepository
  extends KnowledgeArticleRepository
{
  private readonly logger = inject(LoggerService);

  private readonly articlesCollection = 'knowledgeArticles';

  private readonly versionsCollection = 'knowledgeArticleVersions';

  async getById(id: string): Promise<KnowledgeArticle | null> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        id,
      );

      const snapshot = await getDoc(reference);

      if (!snapshot.exists()) {
        return null;
      }

      return this.fromFirestore(
        snapshot.id,
        snapshot.data(),
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to retrieve knowledge article: ${id}`,
        error,
      );

      throw error;
    }
  }

  async list(
    filter?: KnowledgeArticleFilter,
  ): Promise<KnowledgeArticle[]> {
    try {
      const constraints = [];

      if (filter?.applicationKey) {
        constraints.push(
          where(
            'applicationKey',
            '==',
            filter.applicationKey,
          ),
        );
      }

      if (filter?.category) {
        constraints.push(
          where(
            'category',
            '==',
            filter.category,
          ),
        );
      }

      if (filter?.contentType) {
        constraints.push(
          where(
            'contentType',
            '==',
            filter.contentType,
          ),
        );
      }

      if (filter?.status) {
        constraints.push(
          where(
            'status',
            '==',
            filter.status,
          ),
        );
      }

      const articlesReference = collection(
        firestore,
        this.articlesCollection,
      );

      const articlesQuery = query(
        articlesReference,
        ...constraints,
        orderBy('updatedAt', 'desc'),
      );

      const snapshot = await getDocs(
        articlesQuery,
      );

      let articles = snapshot.docs.map((item) =>
        this.fromFirestore(
          item.id,
          item.data(),
        ),
      );

      /*
       * Audience, tags, and searchTerm are intentionally
       * handled in application code.
       *
       * This avoids requiring a large number of Firestore
       * composite indexes for every possible Knowledge
       * search combination.
       */

      if (filter?.audience) {
        articles = articles.filter((article) =>
          article.audience.includes(
            filter.audience!,
          ),
        );
      }

      if (filter?.tags?.length) {
        articles = articles.filter((article) =>
          filter.tags!.every((tag) =>
            article.tags.includes(tag),
          ),
        );
      }

      if (filter?.searchTerm?.trim()) {
        const searchTerm =
          filter.searchTerm
            .trim()
            .toLowerCase();

        articles = articles.filter((article) => {
          const searchableContent = [
            article.title,
            article.summary ?? '',
            article.content,
            article.category,
            ...article.tags,
          ]
            .join(' ')
            .toLowerCase();

          return searchableContent.includes(
            searchTerm,
          );
        });
      }

      return articles;
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        'Failed to list knowledge articles.',
        error,
      );

      throw error;
    }
  }

  async create(
    article: KnowledgeArticle,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        article.id,
      );

      const existing = await getDoc(reference);

      if (existing.exists()) {
        throw new Error(
          `Knowledge article already exists: ${article.id}`,
        );
      }

      await setDoc(
        reference,
        this.toFirestore(article),
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Created knowledge article: ${article.id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to create knowledge article: ${article.id}`,
        error,
      );

      throw error;
    }
  }

  async update(
    article: KnowledgeArticle,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        article.id,
      );

      const existing = await getDoc(reference);

      if (!existing.exists()) {
        throw new Error(
          `Knowledge article does not exist: ${article.id}`,
        );
      }

      await setDoc(
        reference,
        this.toFirestore(article),
        {
          merge: false,
        },
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Updated knowledge article: ${article.id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to update knowledge article: ${article.id}`,
        error,
      );

      throw error;
    }
  }

  async delete(
    id: string,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        id,
      );

      const existing = await getDoc(reference);

      if (!existing.exists()) {
        throw new Error(
          `Knowledge article does not exist: ${id}`,
        );
      }

      await deleteDoc(reference);

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Deleted knowledge article: ${id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to delete knowledge article: ${id}`,
        error,
      );

      throw error;
    }
  }

  async publish(
    id: string,
    publishedAt: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        id,
      );

      const existing = await getDoc(reference);

      if (!existing.exists()) {
        throw new Error(
          `Knowledge article does not exist: ${id}`,
        );
      }

      await setDoc(
        reference,
        {
          status: 'published',
          publishedAt,
          archivedAt: null,
          updatedBy,
          updatedAt: new Date().toISOString(),
        },
        {
          merge: true,
        },
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Published knowledge article: ${id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to publish knowledge article: ${id}`,
        error,
      );

      throw error;
    }
  }

  async archive(
    id: string,
    archivedAt: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        id,
      );

      const existing = await getDoc(reference);

      if (!existing.exists()) {
        throw new Error(
          `Knowledge article does not exist: ${id}`,
        );
      }

      await setDoc(
        reference,
        {
          status: 'archived',
          archivedAt,
          updatedBy,
          updatedAt: new Date().toISOString(),
        },
        {
          merge: true,
        },
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Archived knowledge article: ${id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to archive knowledge article: ${id}`,
        error,
      );

      throw error;
    }
  }

  async restore(
    id: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.articlesCollection,
        id,
      );

      const existing = await getDoc(reference);

      if (!existing.exists()) {
        throw new Error(
          `Knowledge article does not exist: ${id}`,
        );
      }

      await setDoc(
        reference,
        {
          status: 'draft',
          archivedAt: null,
          updatedBy,
          updatedAt: new Date().toISOString(),
        },
        {
          merge: true,
        },
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Restored knowledge article: ${id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to restore knowledge article: ${id}`,
        error,
      );

      throw error;
    }
  }

  /**
   * Retrieve immutable historical versions for an article.
   */
 async getVersions(
  articleId: string,
): Promise<KnowledgeArticleVersion[]> {
  try {
    const versionsReference = collection(
      firestore,
      this.versionsCollection,
    );

    /*
     * Query only by articleId.
     *
     * We intentionally do not use:
     *
     *   orderBy('version', 'desc')
     *
     * here because combining where(articleId == ...)
     * with orderBy(version) requires a composite
     * Firestore index.
     *
     * Knowledge version history is expected to be
     * small, so ordering the returned records in
     * application code is simpler and avoids creating
     * another infrastructure dependency.
     */
    const versionsQuery = query(
      versionsReference,
      where(
        'articleId',
        '==',
        articleId,
      ),
    );

    const snapshot = await getDocs(
      versionsQuery,
    );

    return snapshot.docs
      .map((item) =>
        this.versionFromFirestore(
          item.id,
          item.data(),
        ),
      )
      .sort(
        (left, right) =>
          right.version - left.version,
      );
  } catch (error) {
    this.logger.error(
      'FirestoreKnowledgeArticleRepository',
      `Failed to retrieve article versions: ${articleId}`,
      error,
    );

    throw error;
  }
}

  /**
   * Persist an immutable historical article version.
   */
  async saveVersion(
    version: KnowledgeArticleVersion,
  ): Promise<void> {
    try {
      const reference = doc(
        firestore,
        this.versionsCollection,
        version.id,
      );

      await setDoc(
        reference,
        this.versionToFirestore(version),
      );

      this.logger.info(
        'FirestoreKnowledgeArticleRepository',
        `Saved knowledge article version: ${version.id}`,
      );
    } catch (error) {
      this.logger.error(
        'FirestoreKnowledgeArticleRepository',
        `Failed to save knowledge article version: ${version.id}`,
        error,
      );

      throw error;
    }
  }

 /**
 * Create/update the current article as a new draft revision.
 *
 * This operation is intentionally separate from update() because update()
 * is subject to the service-level protection against overwriting published revisions.
 *
 * The service is responsible for:
 * - Creating the immutable historical version.
 * - Incrementing the article version.
 * - Changing the article status to draft.
 *
 * The repository is responsible only for persisting the resulting draft revision.
 */
async createVersionDraft(
  article: KnowledgeArticle,
): Promise<void> {
  try {
    const articleRef = doc(
      firestore,
      this.articlesCollection,
      article.id,
    );

    const existing = await getDoc(articleRef);

    if (!existing.exists()) {
      throw new Error(
        `Knowledge article does not exist: ${article.id}`,
      );
    }

    if (article.status !== 'draft') {
      throw new Error(
        'A version draft must have draft status.',
      );
    }

    await setDoc(
      articleRef,
      this.toFirestore({
        ...article,
        status: 'draft',
        publishedAt: undefined,
        archivedAt: undefined,
      }),
      {
        merge: false,
      },
    );

    this.logger.info(
      'FirestoreKnowledgeArticleRepository',
      `Created version ${article.version} draft for knowledge article: ${article.id}`,
    );
  } catch (error) {
    this.logger.error(
      'FirestoreKnowledgeArticleRepository',
      `Failed to create version draft for knowledge article: ${article.id}`,
      error,
    );

    throw error;
  }
}

  /**
   * Convert a domain article into its Firestore representation.
   */
  private toFirestore(
    article: KnowledgeArticle,
  ): Record<string, unknown> {
    return {
      id: article.id,
      applicationKey: article.applicationKey,
      title: article.title,
      summary: article.summary ?? null,
      content: article.content,
      contentType: article.contentType,
      category: article.category,
      tags: article.tags,
      audience: article.audience,
      status: article.status,
      version: article.version,
      authorId: article.authorId,
      updatedBy: article.updatedBy ?? null,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedAt: article.publishedAt ?? null,
      archivedAt: article.archivedAt ?? null,
      downloadable: article.downloadable,
      metadata: article.metadata ?? {},
    };
  }

  /**
   * Convert a Firestore document into the domain article model.
   */
  private fromFirestore(
    id: string,
    data: Record<string, unknown>,
  ): KnowledgeArticle {
    return {
      id,

      applicationKey:
        String(
          data['applicationKey'] ?? '',
        ),

      title:
        String(
          data['title'] ?? '',
        ),

      summary:
        data['summary'] == null
          ? undefined
          : String(
              data['summary'],
            ),

      content:
        String(
          data['content'] ?? '',
        ),

      contentType:
        (
          data['contentType'] ??
          'documentation'
        ) as KnowledgeArticle['contentType'],

      category:
        String(
          data['category'] ?? '',
        ),

      tags:
        Array.isArray(
          data['tags'],
        )
          ? data['tags'].map(String)
          : [],

      audience:
        Array.isArray(
          data['audience'],
        )
          ? data['audience'] as KnowledgeArticle['audience']
          : ['all'],

      status:
        (
          data['status'] ??
          'draft'
        ) as KnowledgeArticle['status'],

      version:
        this.toNumber(
          data['version'],
          1,
        ),

      authorId:
        String(
          data['authorId'] ?? '',
        ),

      updatedBy:
        data['updatedBy'] == null
          ? undefined
          : String(
              data['updatedBy'],
            ),

      createdAt:
        this.toIsoString(
          data['createdAt'],
        ),

      updatedAt:
        this.toIsoString(
          data['updatedAt'],
        ),

      publishedAt:
        this.toOptionalIsoString(
          data['publishedAt'],
        ),

      archivedAt:
        this.toOptionalIsoString(
          data['archivedAt'],
        ),

      downloadable:
        data['downloadable'] !== false,

      metadata:
        this.toMetadata(
          data['metadata'],
        ),
    };
  }

  /**
   * Convert a domain version into its Firestore representation.
   */
  private versionToFirestore(
    version: KnowledgeArticleVersion,
  ): Record<string, unknown> {
    return {
      id: version.id,
      articleId: version.articleId,
      version: version.version,
      title: version.title,
      summary: version.summary ?? null,
      content: version.content,
      contentType: version.contentType,
      category: version.category,
      tags: version.tags,
      audience: version.audience,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      publishedAt: version.publishedAt ?? null,
      archivedAt: version.archivedAt ?? null,
    };
  }

  /**
   * Convert a Firestore document into the domain version model.
   */
  private versionFromFirestore(
    id: string,
    data: Record<string, unknown>,
  ): KnowledgeArticleVersion {
    return {
      id,

      articleId:
        String(
          data['articleId'] ?? '',
        ),

      version:
        this.toNumber(
          data['version'],
          1,
        ),

      title:
        String(
          data['title'] ?? '',
        ),

      summary:
        data['summary'] == null
          ? undefined
          : String(
              data['summary'],
            ),

      content:
        String(
          data['content'] ?? '',
        ),

      contentType:
        (
          data['contentType'] ??
          'documentation'
        ) as KnowledgeArticleVersion['contentType'],

      category:
        String(
          data['category'] ?? '',
        ),

      tags:
        Array.isArray(
          data['tags'],
        )
          ? data['tags'].map(String)
          : [],

      audience:
        Array.isArray(
          data['audience'],
        )
          ? data['audience'] as KnowledgeArticleVersion['audience']
          : ['all'],

      createdBy:
        String(
          data['createdBy'] ?? '',
        ),

      createdAt:
        this.toIsoString(
          data['createdAt'],
        ),

      publishedAt:
        this.toOptionalIsoString(
          data['publishedAt'],
        ),

      archivedAt:
        this.toOptionalIsoString(
          data['archivedAt'],
        ),
    };
  }

  /**
   * Safely convert a Firestore value to a number.
   */
  private toNumber(
    value: unknown,
    fallback: number,
  ): number {
    return typeof value === 'number'
      ? value
      : fallback;
  }

  /**
   * Convert Firestore Timestamp/Date/string values
   * into ISO strings used by the domain model.
   */
  private toIsoString(
    value: unknown,
  ): string {
    if (value instanceof Timestamp) {
      return value
        .toDate()
        .toISOString();
    }

    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    ) {
      return value
        .toDate()
        .toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return new Date(0).toISOString();
  }

  /**
   * Convert an optional Firestore value to an ISO string.
   */
  private toOptionalIsoString(
    value: unknown,
  ): string | undefined {
    if (value == null) {
      return undefined;
    }

    return this.toIsoString(value);
  }

  /**
   * Safely convert Firestore metadata into the
   * domain metadata structure.
   */
  private toMetadata(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }
}
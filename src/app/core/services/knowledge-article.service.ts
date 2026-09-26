import { Injectable, inject } from '@angular/core';

import {
  KnowledgeArticle,
  KnowledgeArticleFilter,
  KnowledgeArticleSummary,
  KnowledgeArticleVersion,
} from '../models/knowledge-article.model';

import { KnowledgeArticleRepository } from '../repositories/knowledge-article.repository';

import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeArticleService {
  private readonly repository = inject(
    KnowledgeArticleRepository,
  );

  private readonly logger = inject(
    LoggerService,
  );

  /**
   * Retrieve a single article.
   */
  async getById(
    id: string,
  ): Promise<KnowledgeArticle | null> {
    return this.repository.getById(id);
  }

  /**
   * Retrieve articles using the supplied filter.
   */
  async list(
    filter?: KnowledgeArticleFilter,
  ): Promise<KnowledgeArticle[]> {
    return this.repository.list(filter);
  }

  /**
   * Retrieve published articles intended for users.
   *
   * This is the primary method that user-facing applications
   * should use instead of querying the repository directly.
   */
  async listPublished(
    applicationKey?: string,
  ): Promise<KnowledgeArticle[]> {
    return this.repository.list({
      applicationKey,
      status: 'published',
      audience: 'user',
    });
  }

  /**
   * Retrieve published articles for any supported audience.
   */
  async listPublishedForApplication(
    applicationKey: string,
  ): Promise<KnowledgeArticle[]> {
    return this.repository.list({
      applicationKey,
      status: 'published',
    });
  }

  /**
   * Create a new draft article.
   *
   * New articles always begin as drafts.
   */
  async create(
    article: KnowledgeArticle,
  ): Promise<void> {
    const draft: KnowledgeArticle = {
      ...article,
      status: 'draft',
      version: Math.max(
        article.version,
        1,
      ),
      publishedAt: undefined,
      archivedAt: undefined,
    };

    await this.repository.create(
      draft,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Created knowledge article: ${draft.id}`,
    );
  }

  /**
   * Update an existing article.
   *
   * Published articles cannot be silently overwritten.
   * A published article must first go through the
   * createVersionDraft() workflow.
   */
  async update(
    article: KnowledgeArticle,
  ): Promise<void> {
    const existing =
      await this.repository.getById(
        article.id,
      );

    if (!existing) {
      throw new Error(
        `Knowledge article does not exist: ${article.id}`,
      );
    }

    /*
     * A published article must not have its current
     * published revision overwritten.
     *
     * The controlled versioning workflow is:
     *
     * published v1
     *      ↓
     * createVersionDraft()
     *      ↓
     * draft v2
     *      ↓
     * edit
     *      ↓
     * publish v2
     */
    if (
      existing.status === 'published' &&
      article.version <= existing.version
    ) {
      throw new Error(
        'Published knowledge articles require a new version before they can be updated.',
      );
    }

    await this.repository.update(
      article,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Updated knowledge article: ${article.id}`,
    );
  }

  /**
   * Create an editable draft revision from a published article.
   *
   * Versioning workflow:
   *
   * 1. Retrieve the currently published article.
   * 2. Preserve that published revision as an immutable
   *    KnowledgeArticleVersion.
   * 3. Increment the article version.
   * 4. Convert the current article into a draft.
   * 5. Persist the new draft through createVersionDraft().
   *
   * Example:
   *
   * Current article:
   *   version = 1
   *   status  = published
   *
   * After this operation:
   *   version history = v1
   *   current article = v2 draft
   */
  async createVersionDraft(
    articleId: string,
    createdBy: string,
  ): Promise<KnowledgeArticle> {
    if (!articleId.trim()) {
      throw new Error(
        'A knowledge article ID is required to create a new version.',
      );
    }

    if (!createdBy.trim()) {
      throw new Error(
        'A signed-in user is required to create a knowledge article version.',
      );
    }

    const existing =
      await this.repository.getById(
        articleId,
      );

    if (!existing) {
      throw new Error(
        `Knowledge article does not exist: ${articleId}`,
      );
    }

    if (existing.status !== 'published') {
      throw new Error(
        'A new version can only be created from a published knowledge article.',
      );
    }

    const now =
      new Date().toISOString();

    const historicalVersion: KnowledgeArticleVersion = {
      id: `${existing.id}-v${existing.version}`,

      articleId: existing.id,

      version: existing.version,

      title: existing.title,

      summary: existing.summary,

      content: existing.content,

      contentType: existing.contentType,

      category: existing.category,

      tags: [
        ...existing.tags,
      ],

      audience: [
        ...existing.audience,
      ],

      createdBy:
        existing.updatedBy ??
        existing.authorId,

      createdAt:
        existing.updatedAt,

      publishedAt:
        existing.publishedAt,

      archivedAt:
        existing.archivedAt,
    };

    /*
     * Preserve the currently published revision before
     * converting the current article into the next draft.
     */
    await this.repository.saveVersion(
      historicalVersion,
    );

    const nextVersion =
      existing.version + 1;

    const draft: KnowledgeArticle = {
      ...existing,

      status: 'draft',

      version: nextVersion,

      updatedBy: createdBy,

      updatedAt: now,

      publishedAt: undefined,

      archivedAt: undefined,

      metadata: {
        ...(existing.metadata ?? {}),

        versionCreatedFrom:
          existing.version,

        versionCreatedAt:
          now,

        versionCreatedBy:
          createdBy,
      },
    };

    /*
     * Persist the new draft through the dedicated repository
     * operation. We intentionally do not use update() here
     * because the current article is still published.
     */
    await this.repository.createVersionDraft(
      draft,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Created version ${nextVersion} draft for knowledge article: ${articleId}`,
    );

    return draft;
  }

  /**
   * Backward-compatible version creation method.
   *
   * This now delegates to createVersionDraft() so callers
   * cannot accidentally create an incorrect historical
   * version snapshot.
   */
  async createVersion(
    article: KnowledgeArticle,
    createdBy: string,
  ): Promise<KnowledgeArticleVersion> {
    const draft =
      await this.createVersionDraft(
        article.id,
        createdBy,
      );

    /*
     * Return the historical version that was preserved.
     *
     * The historical version is the version immediately
     * preceding the newly created draft.
     */
    return {
      id: `${draft.id}-v${draft.version - 1}`,

      articleId: draft.id,

      version: draft.version - 1,

      title: article.title,

      summary: article.summary,

      content: article.content,

      contentType: article.contentType,

      category: article.category,

      tags: [
        ...article.tags,
      ],

      audience: [
        ...article.audience,
      ],

      createdBy:
        article.updatedBy ??
        article.authorId,

      createdAt:
        article.updatedAt,

      publishedAt:
        article.publishedAt,

      archivedAt:
        article.archivedAt,
    };
  }

  /**
   * Publish an article.
   *
   * Publishing is only allowed after the article has
   * passed the required content validation.
   */
  async publish(
    id: string,
    updatedBy: string,
  ): Promise<void> {
    if (!updatedBy.trim()) {
      throw new Error(
        'A signed-in user is required to publish a knowledge article.',
      );
    }

    const article =
      await this.repository.getById(
        id,
      );

    if (!article) {
      throw new Error(
        `Knowledge article does not exist: ${id}`,
      );
    }

    if (
      article.status === 'published'
    ) {
      return;
    }

    if (
      !article.title.trim()
    ) {
      throw new Error(
        'A knowledge article must have a title before it can be published.',
      );
    }

    if (
      !article.content.trim()
    ) {
      throw new Error(
        'A knowledge article must contain content before it can be published.',
      );
    }

    if (
      !article.applicationKey.trim()
    ) {
      throw new Error(
        'A knowledge article must have an applicationKey before it can be published.',
      );
    }

    if (
      !article.category.trim()
    ) {
      throw new Error(
        'A knowledge article must have a category before it can be published.',
      );
    }

    if (
      !article.audience.length
    ) {
      throw new Error(
        'A knowledge article must have at least one audience before it can be published.',
      );
    }

    const publishedAt =
      new Date().toISOString();

    await this.repository.publish(
      id,
      publishedAt,
      updatedBy,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Published knowledge article: ${id}`,
    );
  }

  /**
   * Archive an article.
   */
  async archive(
    id: string,
    updatedBy: string,
  ): Promise<void> {
    if (!updatedBy.trim()) {
      throw new Error(
        'A signed-in user is required to archive a knowledge article.',
      );
    }

    const article =
      await this.repository.getById(
        id,
      );

    if (!article) {
      throw new Error(
        `Knowledge article does not exist: ${id}`,
      );
    }

    if (
      article.status === 'archived'
    ) {
      return;
    }

    await this.repository.archive(
      id,
      new Date().toISOString(),
      updatedBy,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Archived knowledge article: ${id}`,
    );
  }

  /**
   * Restore an archived article to draft status.
   *
   * It must be explicitly published again.
   */
  async restore(
    id: string,
    updatedBy: string,
  ): Promise<void> {
    if (!updatedBy.trim()) {
      throw new Error(
        'A signed-in user is required to restore a knowledge article.',
      );
    }

    const article =
      await this.repository.getById(
        id,
      );

    if (!article) {
      throw new Error(
        `Knowledge article does not exist: ${id}`,
      );
    }

    if (
      article.status !== 'archived'
    ) {
      return;
    }

    await this.repository.restore(
      id,
      updatedBy,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Restored knowledge article: ${id}`,
    );
  }

  /**
   * Delete an article.
   *
   * Published articles must be archived before deletion.
   */
  async delete(
    id: string,
  ): Promise<void> {
    const article =
      await this.repository.getById(
        id,
      );

    if (!article) {
      throw new Error(
        `Knowledge article does not exist: ${id}`,
      );
    }

    if (
      article.status === 'published'
    ) {
      throw new Error(
        'Published knowledge articles must be archived before they can be deleted.',
      );
    }

    await this.repository.delete(
      id,
    );

    this.logger.info(
      'KnowledgeArticleService',
      `Deleted knowledge article: ${id}`,
    );
  }

  /**
   * Retrieve immutable version history.
   */
  async getVersions(
    articleId: string,
  ): Promise<KnowledgeArticleVersion[]> {
    return this.repository.getVersions(
      articleId,
    );
  }

  /**
   * Search published knowledge for an application.
   */
  async search(
    applicationKey: string,
    searchTerm: string,
  ): Promise<KnowledgeArticle[]> {
    const normalizedSearch =
      searchTerm.trim();

    if (!normalizedSearch) {
      return this.listPublishedForApplication(
        applicationKey,
      );
    }

    return this.repository.list({
      applicationKey,
      status: 'published',
      searchTerm:
        normalizedSearch,
    });
  }

  /**
   * Calculate article statistics.
   */
  async getSummary(
    applicationKey?: string,
  ): Promise<KnowledgeArticleSummary> {
    const articles =
      await this.repository.list(
        applicationKey
          ? {
              applicationKey,
            }
          : undefined,
      );

    return articles.reduce<KnowledgeArticleSummary>(
      (
        summary,
        article,
      ) => {
        summary.total++;

        switch (
          article.status
        ) {
          case 'draft':
            summary.drafts++;
            break;

          case 'published':
            summary.published++;
            break;

          case 'archived':
            summary.archived++;
            break;
        }

        return summary;
      },
      {
        total: 0,
        drafts: 0,
        published: 0,
        archived: 0,
      },
    );
  }

  /**
   * Determine whether an article can be displayed
   * to normal application users.
   */
  isUserVisible(
    article: KnowledgeArticle,
  ): boolean {
    if (
      article.status !==
      'published'
    ) {
      return false;
    }

    return (
      article.audience.includes(
        'user',
      ) ||
      article.audience.includes(
        'all',
      )
    );
  }

  /**
   * Determine whether an article is editable.
   */
  isEditable(
    article: KnowledgeArticle,
  ): boolean {
    return (
      article.status !==
      'archived'
    );
  }

  /**
   * Determine whether an article is published.
   */
  isPublished(
    article: KnowledgeArticle,
  ): boolean {
    return (
      article.status ===
      'published'
    );
  }

  /**
   * Determine whether an article is archived.
   */
  isArchived(
    article: KnowledgeArticle,
  ): boolean {
    return (
      article.status ===
      'archived'
    );
  }

  /**
   * Determine whether an article has sufficient
   * content to publish.
   */
  canPublish(
    article: KnowledgeArticle,
  ): boolean {
    return (
      article.title.trim()
        .length > 0 &&
      article.content.trim()
        .length > 0 &&
      article.applicationKey
        .trim()
        .length > 0 &&
      article.category
        .trim()
        .length > 0 &&
      article.audience.length > 0
    );
  }
}
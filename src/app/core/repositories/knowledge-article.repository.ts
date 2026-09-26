import {
  KnowledgeArticle,
  KnowledgeArticleFilter,
  KnowledgeArticleVersion,
} from '../models/knowledge-article.model';

import { InjectionToken } from '@angular/core';

export abstract class KnowledgeArticleRepository {
  abstract getById(
    id: string,
  ): Promise<KnowledgeArticle | null>;

  abstract list(
    filter?: KnowledgeArticleFilter,
  ): Promise<KnowledgeArticle[]>;

  abstract create(
    article: KnowledgeArticle,
  ): Promise<void>;

  abstract update(
    article: KnowledgeArticle,
  ): Promise<void>;

  abstract delete(
    id: string,
  ): Promise<void>;

  abstract publish(
    id: string,
    publishedAt: string,
    updatedBy: string,
  ): Promise<void>;

  abstract archive(
    id: string,
    archivedAt: string,
    updatedBy: string,
  ): Promise<void>;

  abstract restore(
    id: string,
    updatedBy: string,
  ): Promise<void>;

  /**
   * Retrieve immutable historical versions for an article.
   */
  abstract getVersions(
    articleId: string,
  ): Promise<KnowledgeArticleVersion[]>;

  /**
   * Persist an immutable historical article version.
   */
  abstract saveVersion(
    version: KnowledgeArticleVersion,
  ): Promise<void>;

  /**
   * Create an editable revision from a published article.
   *
   * This operation intentionally bypasses the normal update()
   * protection because it is the controlled transition from
   * published -> draft for a new version.
   *
   * The service is responsible for:
   * - Creating the immutable historical version.
   * - Incrementing the article version.
   * - Changing the article status to draft.
   *
   * The repository is responsible only for persisting
   * the resulting draft revision.
   */
  abstract createVersionDraft(
    article: KnowledgeArticle,
  ): Promise<void>;
}

export const KNOWLEDGE_ARTICLE_REPOSITORY =
  new InjectionToken<KnowledgeArticleRepository>(
    'KNOWLEDGE_ARTICLE_REPOSITORY',
  );
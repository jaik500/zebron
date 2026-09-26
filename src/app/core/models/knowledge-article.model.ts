export type KnowledgeArticleStatus =
  | 'draft'
  | 'published'
  | 'archived';

export type KnowledgeContentType =
  | 'documentation'
  | 'guide'
  | 'how-to'
  | 'troubleshooting'
  | 'reference'
  | 'faq'
  | 'learning';

export type KnowledgeAudience =
  | 'user'
  | 'admin'
  | 'support'
  | 'developer'
  | 'all';

export interface KnowledgeArticle {
  id: string;

  /**
   * Application that owns or primarily uses this article.
   *
   * Examples:
   * community
   * resources
   * jobs
   * test-center
   * tax-pay
   * platform
   */
  applicationKey: string;

  title: string;

  summary?: string;

  /**
   * Source content for the article.
   *
   * This remains the source of truth. Generated PDFs
   * are derived artifacts.
   */
  content: string;

  contentType: KnowledgeContentType;

  category: string;

  tags: string[];

  audience: KnowledgeAudience[];

  status: KnowledgeArticleStatus;

  /**
   * Article version.
   *
   * A published revision increments this value.
   */
  version: number;

  authorId: string;

  updatedBy?: string;

  createdAt: string;

  updatedAt: string;

  publishedAt?: string;

  archivedAt?: string;

  /**
   * Controls whether users/admins can generate/download
   * a PDF representation of the article.
   */
  downloadable: boolean;

  /**
   * Optional metadata for future capabilities without
   * changing the core article model.
   */
  metadata?: Record<string, unknown>;
}

export interface KnowledgeArticleVersion {
  id: string;

  articleId: string;

  version: number;

  title: string;

  summary?: string;

  content: string;

  contentType: KnowledgeContentType;

  category: string;

  tags: string[];

  audience: KnowledgeAudience[];

  createdBy: string;

  createdAt: string;

  publishedAt?: string;

  archivedAt?: string;
}

export interface KnowledgeArticleFilter {
  applicationKey?: string;

  category?: string;

  contentType?: KnowledgeContentType;

  audience?: KnowledgeAudience;

  status?: KnowledgeArticleStatus;

  tags?: string[];

  searchTerm?: string;
}

export interface KnowledgeArticleSummary {
  total: number;
  drafts: number;
  published: number;
  archived: number;
}
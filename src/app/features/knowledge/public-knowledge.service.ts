import { Injectable } from '@angular/core';

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { KnowledgeArticle } from '../../core/models/knowledge-article.model';
import { firestore } from '../../core/services/firebase-config';

/**
 * Zebron's published Knowledge Center articles for the public pages
 * (/knowledge). Everyone, including visitors who are not signed in, sees
 * articles whose audience includes "all"; signed-in people also see
 * "user" articles. Organization articles stay in the partner portal.
 */
@Injectable({ providedIn: 'root' })
export class PublicKnowledgeService {
  /** Audiences shown on the public pages. */
  audiencesFor(signedIn: boolean): string[] {
    return signedIn ? ['all', 'user'] : ['all'];
  }

  async list(signedIn: boolean): Promise<KnowledgeArticle[]> {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'knowledgeArticles'),
        where('status', '==', 'published'),
        // Visitors: array-contains "all", which the security rules check.
        signedIn
          ? where('audience', 'array-contains-any', this.audiencesFor(true))
          : where('audience', 'array-contains', 'all'),
      ),
    );

    return snapshot.docs
      .map((item) => this.toArticle(item.id, item.data()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(articleId: string, signedIn: boolean): Promise<KnowledgeArticle | null> {
    try {
      const snapshot = await getDoc(doc(firestore, 'knowledgeArticles', articleId));
      if (!snapshot.exists()) {
        return null;
      }
      const article = this.toArticle(snapshot.id, snapshot.data());
      const audiences = this.audiencesFor(signedIn);
      return article.status === 'published' && article.audience.some((audience) => audiences.includes(audience))
        ? article
        : null;
    } catch {
      // Not published, or not visible to this visitor.
      return null;
    }
  }

  private toArticle(id: string, data: Record<string, unknown>): KnowledgeArticle {
    const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
    const date = (value: unknown) => {
      if (typeof value === 'string') return value;
      const maybe = value as { toDate?: () => Date } | null;
      return typeof maybe?.toDate === 'function' ? maybe.toDate().toISOString() : new Date(0).toISOString();
    };

    return {
      id,
      applicationKey: text(data['applicationKey'], 'platform'),
      title: text(data['title'], 'Untitled article'),
      summary: text(data['summary']) || undefined,
      content: text(data['content']),
      contentType: (text(data['contentType'], 'documentation') as KnowledgeArticle['contentType']),
      category: text(data['category']),
      tags: Array.isArray(data['tags']) ? data['tags'].map(String) : [],
      audience: Array.isArray(data['audience']) ? (data['audience'] as KnowledgeArticle['audience']) : ['all'],
      status: (text(data['status'], 'draft') as KnowledgeArticle['status']),
      version: typeof data['version'] === 'number' ? data['version'] : 1,
      authorId: text(data['authorId']),
      createdAt: date(data['createdAt']),
      updatedAt: date(data['updatedAt']),
      publishedAt: data['publishedAt'] ? date(data['publishedAt']) : undefined,
      downloadable: data['downloadable'] !== false,
      metadata: (data['metadata'] as Record<string, unknown>) ?? {},
    };
  }
}

export const PUBLIC_KNOWLEDGE_TYPE_LABELS: Record<string, string> = {
  documentation: 'Documentation',
  guide: 'Guide',
  'how-to': 'How-to',
  troubleshooting: 'Troubleshooting',
  reference: 'Reference',
  faq: 'FAQ',
  learning: 'Learning',
};

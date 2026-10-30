import { describe, expect, it } from 'vitest';

import { KNOWLEDGE_CONFIGURATION } from '../../src/app/core/config/knowledge.config';
import { GUIDE_ARTICLES } from '../../src/app/features/admin/pages/knowledge/guide-import/guide-articles';
import { renderKnowledgeContent } from '../../src/app/features/partner/knowledge/knowledge-content.util';

describe('Platform Guide knowledge articles', () => {
  it('has unique slugs that make valid article IDs', () => {
    const slugs = GUIDE_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('uses only configured applications, content types and audiences', () => {
    const applications = KNOWLEDGE_CONFIGURATION.applications.map((application) => application.key);
    for (const article of GUIDE_ARTICLES) {
      expect(applications).toContain(article.applicationKey);
      expect(KNOWLEDGE_CONFIGURATION.contentTypes).toContain(article.contentType);
      expect(article.audience.length).toBeGreaterThan(0);
      for (const audience of article.audience) {
        expect(KNOWLEDGE_CONFIGURATION.audiences).toContain(audience);
      }
    }
  });

  it('has a title, summary, category and content that renders', () => {
    for (const article of GUIDE_ARTICLES) {
      expect(article.title.trim()).not.toBe('');
      expect(article.summary.trim()).not.toBe('');
      expect(article.category.trim()).not.toBe('');
      expect(article.content.length).toBeLessThan(KNOWLEDGE_CONFIGURATION.maxContentLength);
      expect(renderKnowledgeContent(article.content)).toContain('<h2>');
    }
  });
});

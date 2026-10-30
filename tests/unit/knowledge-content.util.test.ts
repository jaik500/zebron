import { describe, expect, it } from 'vitest';

import {
  knowledgeExcerpt,
  matchesKnowledgeSearch,
  parseTags,
  renderKnowledgeContent,
} from '../../src/app/features/partner/knowledge/knowledge-content.util';

describe('renderKnowledgeContent', () => {
  it('escapes HTML', () => {
    expect(renderKnowledgeContent('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('renders headings, lists and inline formatting', () => {
    const html = renderKnowledgeContent('# Title\n\n- **one**\n- `two`\n\n1. first\n2. second');
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<ul>\n<li><strong>one</strong></li>\n<li><code>two</code></li>\n</ul>');
    expect(html).toContain('<ol>\n<li>first</li>\n<li>second</li>\n</ol>');
  });

  it('links only https and mailto', () => {
    expect(renderKnowledgeContent('[ok](https://zebron.org)')).toContain('href="https://zebron.org"');
    expect(renderKnowledgeContent('[bad](javascript:alert(1))')).not.toContain('<a');
  });

  it('keeps fenced code unformatted', () => {
    expect(renderKnowledgeContent('```\n**x** <b>\n```')).toBe('<pre><code>**x** &lt;b&gt;</code></pre>');
  });
});

describe('helpers', () => {
  it('builds an excerpt from the summary or content', () => {
    expect(knowledgeExcerpt({ summary: 'Short', content: 'Long' })).toBe('Short');
    expect(knowledgeExcerpt({ content: '# Reset\n\nStep **one**' })).toBe('Reset Step one');
  });

  it('matches every search word', () => {
    const article = { title: 'Reset password', content: 'Use the profile page', tags: ['account'], category: 'Sign-in' };
    expect(matchesKnowledgeSearch(article, 'reset profile')).toBe(true);
    expect(matchesKnowledgeSearch(article, 'reset billing')).toBe(false);
  });

  it('parses tags', () => {
    expect(parseTags(' Account, account ,Sign-in,, ')).toEqual(['account', 'sign-in']);
  });
});

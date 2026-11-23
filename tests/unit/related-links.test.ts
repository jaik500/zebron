import { describe, expect, it } from 'vitest';

import { RelatedCandidate, groupRelated, isZebronPath, sanitizeRelated, suggestRelated } from '../../src/app/features/blog/related-links';

const candidate = (title: string, path: string, keywords: string[], kind: RelatedCandidate['kind'] = 'course'): RelatedCandidate => ({
  kind, title, path, query: null, note: '', keywords,
});

describe('Continue on Zebron links', () => {
  it('only allows Zebron paths', () => {
    expect(isZebronPath('/courses/python-foundations')).toBe(true);
    expect(isZebronPath('/resources/food-pantry')).toBe(true);
    expect(isZebronPath('https://evil.example')).toBe(false);
    expect(isZebronPath('//evil.example')).toBe(false);
    expect(isZebronPath('/a/../admin')).toBe(false);
    expect(isZebronPath('javascript:alert(1)')).toBe(false);
  });

  it('cleans stored links and drops bad ones', () => {
    const links = sanitizeRelated([
      { kind: 'course', title: ' Python Foundations ', path: '/courses/python', note: 'Course' },
      { kind: 'course', title: 'Duplicate', path: '/courses/python' },
      { kind: 'resource', title: 'Evil', path: 'https://evil.example' },
      { kind: 'jobs', title: 'Python jobs', path: '/anything', query: 'python developer' },
      { kind: 'jobs', title: 'No words', query: '' },
      { kind: 'unknown', title: 'X', path: '/x' },
    ]);
    expect(links).toHaveLength(2);
    expect(links[0].title).toBe('Python Foundations');
    expect(links[1]).toMatchObject({ kind: 'jobs', path: '/jobs', query: 'python developer' });
    expect(sanitizeRelated('nope')).toHaveLength(0);
  });

  it('groups links for readers', () => {
    const groups = groupRelated(sanitizeRelated([
      { kind: 'resource', title: 'Food pantry', path: '/resources/food' },
      { kind: 'course', title: 'Python', path: '/courses/python' },
    ]));
    expect(groups.map((group) => group.key)).toEqual(['learn', 'help']);
  });

  it('suggests what the post is about, best first', () => {
    const post = {
      title: 'How to start learning Python',
      excerpt: 'Your first steps in programming',
      topic: 'Tech skills',
      content: 'Python is a good first language for data analysis and machine learning.',
    };
    const suggestions = suggestRelated(post, [
      candidate('Python Foundations', '/courses/python', ['python', 'programming']),
      candidate('Machine Learning Basics', '/courses/ml', ['machine learning']),
      candidate('Food pantry', '/resources/food', ['food', 'groceries'], 'resource'),
    ], []);
    expect(suggestions.map((item) => item.path)).toEqual(['/courses/python', '/courses/ml']);
  });

  it('leaves out links already chosen', () => {
    const suggestions = suggestRelated(
      { title: 'Python', excerpt: '', topic: '', content: '' },
      [candidate('Python Foundations', '/courses/python', ['python'])],
      [{ kind: 'course', title: 'Python Foundations', path: '/courses/python', query: null, note: '' }],
    );
    expect(suggestions).toHaveLength(0);
  });
});

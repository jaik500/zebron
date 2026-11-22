import { describe, expect, it } from 'vitest';

import {
  isMainPage,
  isSkippedPage,
  parentUrl,
  pathSegments,
  routePatterns,
} from '../../src/app/core/navigation/back-navigation';

/** The top bar's back arrow: the page above an address, and main pages. */
describe('Back navigation', () => {
  const routes = [
    { path: '', children: [] },
    { path: 'login' },
    { path: 'jobs', children: [{ path: '' }, { path: ':id' }, { path: 'my' }] },
    {
      path: 'courses',
      children: [
        { path: '' },
        { path: 'documents' },
        { path: 'documents/:documentId' },
        { path: 'c/:courseId' },
        { path: 'c/:courseId/lessons/:lessonId' },
      ],
    },
    { path: 'partner/org/:organizationId', children: [{ path: 'dashboard' }, { path: 'training-groups/:groupId' }] },
    { path: '**' },
  ];
  const patterns = routePatterns(routes);

  it('reads nested routes and skips the not-found route', () => {
    expect(patterns).toContainEqual(['courses', 'documents', ':documentId']);
    expect(patterns).toContainEqual(['partner', 'org', ':organizationId', 'dashboard']);
    expect(patterns.some((pattern) => pattern.includes('**'))).toBe(false);
  });

  it('goes up to the nearest page that exists', () => {
    expect(parentUrl('/courses/documents/abc123', patterns)).toBe('/courses/documents');
    expect(parentUrl('/jobs/987?ref=home', patterns)).toBe('/jobs');
    // /courses/c/intro/lessons does not exist: up to the course.
    expect(parentUrl('/courses/c/intro/lessons/l2', patterns)).toBe('/courses/c/intro');
    // /courses/c does not exist: up to My learning.
    expect(parentUrl('/courses/c/intro', patterns)).toBe('/courses');
    expect(parentUrl('/partner/org/acme/training-groups/g1', patterns)).toBe('/partner/org/acme');
    expect(parentUrl('/jobs', patterns)).toBe('/');
    expect(parentUrl('/unknown/deep/page', patterns)).toBe('/');
  });

  it('hides the arrow on main pages', () => {
    expect(isMainPage('/')).toBe(true);
    expect(isMainPage('/jobs')).toBe(true);
    expect(isMainPage('/courses?tab=notes')).toBe(true);
    expect(isMainPage('/partner/org/acme/dashboard')).toBe(true);
    expect(isMainPage('/courses/documents')).toBe(false);
    expect(isMainPage('/jobs/987')).toBe(false);
  });

  it('never goes back to sign-in pages', () => {
    expect(isSkippedPage('/login?returnUrl=%2Fjobs')).toBe(true);
    expect(isSkippedPage('/register')).toBe(true);
    expect(isSkippedPage('/jobs')).toBe(false);
  });

  it('ignores query strings, fragments and matrix parameters', () => {
    expect(pathSegments('/jobs/9;view=full?x=1#top')).toEqual(['jobs', '9']);
  });
});

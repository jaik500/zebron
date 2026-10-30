import { describe, expect, it } from 'vitest';

import { communityOrganizationIdFromUrl } from '../../src/app/features/community/services/community-scope.util';

describe('communityOrganizationIdFromUrl', () => {
  it('finds the organization in partner Community URLs', () => {
    expect(communityOrganizationIdFromUrl('/partner/org/abc/community')).toBe('abc');
    expect(communityOrganizationIdFromUrl('/partner/org/abc/community/post/1')).toBe('abc');
    expect(communityOrganizationIdFromUrl('/partner/org/abc/community?topic=x')).toBe('abc');
    expect(communityOrganizationIdFromUrl('/partner/org/a%20b/community/topics')).toBe('a b');
  });

  it('returns null for the public Community and other pages', () => {
    expect(communityOrganizationIdFromUrl('/community')).toBeNull();
    expect(communityOrganizationIdFromUrl('/community/post/1')).toBeNull();
    expect(communityOrganizationIdFromUrl('/partner/org/abc')).toBeNull();
    expect(communityOrganizationIdFromUrl('/partner/org/abc/communityx')).toBeNull();
    expect(communityOrganizationIdFromUrl(null)).toBeNull();
  });
});

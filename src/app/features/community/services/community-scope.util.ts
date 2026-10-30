/**
 * Extracts the organization from a partner Community URL.
 *
 *   /partner/org/abc/community            -> "abc"
 *   /partner/org/abc/community/post/123   -> "abc"
 *   /community, /community/post/123       -> null (public Community)
 *
 * Kept free of Angular imports so it can be unit-tested directly.
 */
export function communityOrganizationIdFromUrl(url: string | null | undefined): string | null {
  const match = /^\/partner\/org\/([^/?#]+)\/community(?:[/?#]|$)/.exec(url ?? '');
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

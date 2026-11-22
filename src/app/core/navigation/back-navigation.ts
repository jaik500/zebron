/**
 * The top bar's back arrow (BackNavigationService): which page is "above"
 * an address, and which pages are main pages (no arrow).
 *
 * Route patterns come from the router configuration, so a parent is always
 * a page that exists: from /courses/c/intro/lessons/l2 the arrow walks up
 * until an address matches a route (/courses/c/intro).
 */

/** A route path split into segments; ':name' matches any one segment. */
export type RoutePattern = readonly string[];

interface RouteLike {
  path?: string;
  children?: readonly RouteLike[];
}

/** Main pages: the arrow is hidden (there is nothing above them). */
const MAIN_PAGES: readonly RoutePattern[] = [
  ['partner', 'dashboard'],
  ['partner', 'org', ':organizationId'],
  ['partner', 'org', ':organizationId', 'dashboard'],
];

/** Pages back should never return to (the arrow goes up instead). */
const SKIPPED_PAGES = new Set(['login', 'register']);

/** Every route path in the configuration, nested children joined to their parents. */
export function routePatterns(routes: readonly RouteLike[], prefix: readonly string[] = []): RoutePattern[] {
  const patterns: RoutePattern[] = [];
  for (const route of routes) {
    const path = route.path ?? '';
    if (path.includes('**')) continue;
    const segments = [...prefix, ...path.split('/').filter(Boolean)];
    if (!route.children?.length || path) patterns.push(segments);
    if (route.children?.length) patterns.push(...routePatterns(route.children, segments));
  }
  return patterns;
}

/** The path's segments, without query string or fragment. */
export function pathSegments(url: string): string[] {
  const path = url.split(/[?#]/)[0];
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.split(';')[0]);
}

function matches(segments: readonly string[], pattern: RoutePattern): boolean {
  return (
    segments.length === pattern.length &&
    pattern.every((part, index) => part.startsWith(':') || part === segments[index])
  );
}

/** True when some route has this address. */
export function isKnownPage(segments: readonly string[], patterns: readonly RoutePattern[]): boolean {
  return patterns.some((pattern) => matches(segments, pattern));
}

/** The nearest page above `url` that exists ('/' at the top). */
export function parentUrl(url: string, patterns: readonly RoutePattern[]): string {
  const segments = pathSegments(url);
  for (let length = segments.length - 1; length > 0; length--) {
    const candidate = segments.slice(0, length);
    if (isKnownPage(candidate, patterns)) return '/' + candidate.join('/');
  }
  return '/';
}

/** Home and section pages (one segment, like /jobs or /courses) and organization dashboards. */
export function isMainPage(url: string): boolean {
  const segments = pathSegments(url);
  if (segments.length <= 1) return true;
  return MAIN_PAGES.some((pattern) => matches(segments, pattern));
}

/** Sign-in pages, which back skips. */
export function isSkippedPage(url: string): boolean {
  const segments = pathSegments(url);
  return segments.length === 1 && SKIPPED_PAGES.has(segments[0]);
}

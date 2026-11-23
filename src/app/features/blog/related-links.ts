/**
 * "Continue on Zebron": links at the end of a blog post to Zebron's own
 * courses, certifications, bootcamps, resources, job searches and pages.
 *
 * The editor picks them (with suggestions from the post's words); each
 * link is stored on the post (blogPosts/{id}.related) with its title and
 * path, so readers need no extra reads. Only Zebron paths ("/...") are
 * allowed, never other sites.
 *
 * Plain functions, no Angular: unit-tested in tests/unit/related-links.test.ts.
 */

export type RelatedKind = 'course' | 'certification' | 'bootcamp' | 'resource' | 'jobs' | 'page';

export type RelatedGroup = 'learn' | 'help' | 'work' | 'explore';

export interface RelatedLink {
  kind: RelatedKind;
  title: string;
  /** A Zebron path such as "/courses/python-foundations". */
  path: string;
  /** Job search words, for kind "jobs" (/jobs?q=...). */
  query: string | null;
  /** One short line under the title: "Course", "Food · Free"… */
  note: string;
}

export const RELATED_MAX = 8;
export const RELATED_TITLE_MAX = 120;
export const RELATED_NOTE_MAX = 160;
export const RELATED_QUERY_MAX = 80;

export const RELATED_KINDS: Record<RelatedKind, { label: string; icon: string; group: RelatedGroup }> = {
  course: { label: 'Course', icon: 'school', group: 'learn' },
  certification: { label: 'Certification', icon: 'workspace_premium', group: 'learn' },
  bootcamp: { label: 'Bootcamp', icon: 'rocket_launch', group: 'learn' },
  resource: { label: 'Resource', icon: 'volunteer_activism', group: 'help' },
  jobs: { label: 'Job search', icon: 'work', group: 'work' },
  page: { label: 'Zebron page', icon: 'arrow_forward', group: 'explore' },
};

export const RELATED_GROUPS: Array<{ key: RelatedGroup; title: string }> = [
  { key: 'learn', title: 'Keep learning' },
  { key: 'help', title: 'Get help' },
  { key: 'work', title: 'Find work' },
  { key: 'explore', title: 'Explore Zebron' },
];

/** A Zebron path: starts with one "/", letters, digits, - _ . / only. */
export function isZebronPath(path: string): boolean {
  return /^\/(?!\/)[A-Za-z0-9\-_./]*$/.test(path) && !path.includes('..') && path.length <= 200;
}

/** Cleans links from a form or Firestore; drops anything invalid. */
export function sanitizeRelated(value: unknown): RelatedLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const links: RelatedLink[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const kind = String(item['kind'] ?? '') as RelatedKind;
    if (!(kind in RELATED_KINDS)) continue;
    const title = String(item['title'] ?? '').trim().slice(0, RELATED_TITLE_MAX);
    const path = kind === 'jobs' ? '/jobs' : String(item['path'] ?? '').trim();
    const query = kind === 'jobs' ? String(item['query'] ?? '').trim().slice(0, RELATED_QUERY_MAX) : '';
    if (!title || !isZebronPath(path) || (kind === 'jobs' && !query)) continue;
    const key = `${path}?${query}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ kind, title, path, query: query || null, note: String(item['note'] ?? '').trim().slice(0, RELATED_NOTE_MAX) });
    if (links.length >= RELATED_MAX) break;
  }
  return links;
}

/** The links of a post grouped for display, in RELATED_GROUPS order. */
export function groupRelated(links: RelatedLink[]): Array<{ key: RelatedGroup; title: string; links: RelatedLink[] }> {
  return RELATED_GROUPS
    .map((group) => ({ ...group, links: links.filter((link) => RELATED_KINDS[link.kind].group === group.key) }))
    .filter((group) => group.links.length > 0);
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

/** Something the editor could link to, with the words that describe it. */
export interface RelatedCandidate extends RelatedLink {
  /** Skills, tags, topic, category: matched against the post. */
  keywords: string[];
}

const STOP_WORDS = new Set(
  ('a an and are as at be by for from get how in into is it its of on or our the their this to was what when where who why will with you your ' +
    'about can do does more not new now one out over so than that them then there these they up use using we which while all any also ' +
    'zebron free help guide course courses program programs resource resources job jobs').split(' '),
);

/** "Python for AI: a Beginner's guide" → ["python", "ai", "beginner"]. */
export function words(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .split(' ')
    .map((word) => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word))
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Candidates that match the post, best first. A keyword phrase found in
 * the post counts most (title words three times, the excerpt and topic
 * twice); each matching word of the candidate's title counts once.
 */
export function suggestRelated(
  post: { title: string; excerpt: string; topic: string; content: string },
  candidates: RelatedCandidate[],
  chosen: RelatedLink[],
  limit = 6,
): RelatedCandidate[] {
  const titleWords = new Set(words(post.title));
  const leadWords = new Set([...words(post.excerpt), ...words(post.topic)]);
  const bodyWords = new Set(words(post.content.slice(0, 6000)));
  const allText = ` ${words(`${post.title} ${post.excerpt} ${post.topic} ${post.content.slice(0, 6000)}`).join(' ')} `;
  const taken = new Set(chosen.map((link) => `${link.path}?${link.query ?? ''}`));

  const weight = (word: string) => (titleWords.has(word) ? 3 : leadWords.has(word) ? 2 : bodyWords.has(word) ? 1 : 0);

  return candidates
    .filter((candidate) => !taken.has(`${candidate.path}?${candidate.query ?? ''}`))
    .map((candidate) => {
      let score = 0;
      for (const keyword of candidate.keywords) {
        const phrase = words(keyword);
        if (!phrase.length) continue;
        if (phrase.length === 1) {
          score += weight(phrase[0]) * 2;
        } else if (allText.includes(` ${phrase.join(' ')} `)) {
          score += 4 + Math.max(...phrase.map(weight));
        }
      }
      for (const word of new Set(words(candidate.title))) {
        score += weight(word);
      }
      return { candidate, score };
    })
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, limit)
    .map((item) => item.candidate);
}

/** The words for a job search suggested from the post's title. */
export function suggestJobQuery(title: string): string {
  return words(title).slice(0, 3).join(' ');
}

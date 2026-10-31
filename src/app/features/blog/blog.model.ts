import { Timestamp } from 'firebase/firestore';

/**
 * Zebron Blog
 *
 *   public        blogPosts/{postId}                              everyone
 *   internal      blogPosts/{postId}                              Zebron staff (platform admins)
 *   organization  organizations/{organizationId}/blogPosts/{id}   that organization's members
 *
 * Each post has comments/{commentId} and reactions/{userId} beneath it.
 */
export type BlogSection = 'public' | 'organization' | 'internal';

/**
 * draft → in_review → published (or scheduled → published by the
 * publishScheduledBlogPosts function). A reviewer can send a post back
 * with changes_requested.
 */
export type BlogPostStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'scheduled'
  | 'published';

/** Cover styles: Zebron-palette gradients, no uploads needed. */
export type BlogCover = 'teal' | 'navy' | 'sunrise' | 'violet' | 'sky' | 'slate';

export const BLOG_COVERS: Record<BlogCover, string> = {
  teal: 'linear-gradient(135deg, #007979, #2a835f)',
  navy: 'linear-gradient(135deg, #032d42, #007979)',
  sunrise: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  violet: 'linear-gradient(135deg, #5b3fb3, #007979)',
  sky: 'linear-gradient(135deg, #0ea5e9, #2a835f)',
  slate: 'linear-gradient(135deg, #334155, #0f766e)',
};

export const BLOG_TOPICS: Record<BlogSection, string[]> = {
  public: ['Careers', 'Tech skills', 'Employers', 'Zebron news', 'Stories'],
  organization: ['Announcements', 'Study tips', 'Community', 'Careers', 'Events'],
  internal: ['Release notes', 'Runbooks', 'Support', 'Announcements', 'Product'],
};

export interface BlogPost {
  id: string;
  section: BlogSection;
  organizationId: string | null;

  title: string;
  excerpt: string;
  /** Light Markdown, rendered with renderKnowledgeContent(). */
  content: string;
  topic: string;
  cover: BlogCover;
  pinned: boolean;
  readingMinutes: number;

  status: BlogPostStatus;
  reviewNote: string | null;

  authorId: string;
  authorName: string;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  publishedAt: Timestamp | null;
  /** When a scheduled post goes live. */
  publishAt: Timestamp | null;
}

export type BlogPostDraft = Pick<
  BlogPost,
  'title' | 'excerpt' | 'content' | 'topic' | 'cover' | 'pinned'
>;

export interface BlogComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp | null;
}

export type BlogReactionType = 'helpful' | 'insightful';

export const BLOG_REACTIONS: { type: BlogReactionType; label: string; icon: string }[] = [
  { type: 'helpful', label: 'Helpful', icon: 'thumb_up' },
  { type: 'insightful', label: 'Learned something', icon: 'lightbulb' },
];

/** Where the blog is being viewed, read from the route. */
export interface BlogContext {
  section: BlogSection;
  organizationId: string | null;
  /** '/blog', '/partner/org/<id>/blog' or '/admin/blog'. */
  basePath: string;
}

export function sameBlogContext(a: BlogContext | null, b: BlogContext | null): boolean {
  return !!a && !!b && a.section === b.section && a.organizationId === b.organizationId;
}

export function readingMinutes(text: string): number {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function initialsOf(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'Z') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Readable, unique document ID used in links: "landing-your-first-it-job-k3f9". */
export function blogPostId(title: string): string {
  const slug = (title ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return `${slug || 'post'}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Label, icon and badge colours for each section. */
export const BLOG_SECTION_META: Record<
  BlogSection,
  { badge: string; icon: string; badgeClass: string; hint: string }
> = {
  public: {
    badge: 'Public',
    icon: 'public',
    badgeClass: 'bg-[#e5f4f4] text-[#007979]',
    hint: 'Open to everyone: graduates, professionals, employers and visitors.',
  },
  organization: {
    badge: 'Members only',
    icon: 'lock',
    badgeClass: 'bg-amber-50 text-amber-700',
    hint: 'Only members of this organization can read these posts.',
  },
  internal: {
    badge: 'Zebron staff',
    icon: 'shield_person',
    badgeClass: 'bg-violet-50 text-violet-700',
    hint: 'Zebron staff and platform administrators only.',
  },
};

export const BLOG_STATUS_META: Record<BlogPostStatus, { label: string; badgeClass: string }> = {
  draft: { label: 'Draft', badgeClass: 'border border-slate-200 bg-slate-50 text-slate-600' },
  in_review: { label: 'In review', badgeClass: 'bg-amber-50 text-amber-700' },
  changes_requested: { label: 'Changes requested', badgeClass: 'bg-rose-50 text-rose-700' },
  scheduled: { label: 'Scheduled', badgeClass: 'bg-violet-50 text-violet-700' },
  published: { label: 'Published', badgeClass: 'bg-[#e5f4f4] text-[#007979]' },
};

export function blogDate(value: { toDate(): Date } | null | undefined, locale = 'en-US'): string {
  const date = value?.toDate?.();
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
}

import { ResourceKind, resourceKind } from './resource-kinds';

/**
 * How often resources are checked again ("verified"), per category.
 *
 * A category can set its own interval (Admin → Categories → "Check
 * resources every … days"). Otherwise the default for its kind applies.
 * Crisis, hotline and emergency categories are checked most often
 * because a wrong number there does the most harm.
 *
 * functions/src/content-checks.ts uses the same defaults for the weekly
 * "Due for review" list: keep the two in step.
 */

export const CRISIS_REVIEW_DAYS = 30;

export const DEFAULT_REVIEW_DAYS: Record<ResourceKind, number> = {
  food: 60,
  housing: 60,
  government: 60,
  health: 90,
  legal: 90,
  employment: 90,
  business: 180,
  education: 180,
  bootcamp: 180,
  general: 180,
};

const CRISIS_WORDS = /crisis|hotline|emergenc|suicide|shelter|domestic/i;

/** Smallest and largest interval an admin can set. */
export const REVIEW_DAYS_MIN = 7;
export const REVIEW_DAYS_MAX = 730;

const DAY_MS = 24 * 60 * 60 * 1000;

type CategoryLike = { slug?: string; name?: string; reviewIntervalDays?: number | null } | null | undefined;

/** The default interval for a category, ignoring any value it sets. */
export function defaultReviewDays(category: CategoryLike): number {
  if (CRISIS_WORDS.test(`${category?.slug ?? ''} ${category?.name ?? ''}`)) {
    return CRISIS_REVIEW_DAYS;
  }
  return DEFAULT_REVIEW_DAYS[resourceKind(category).kind];
}

/** The interval that applies to a category's resources. */
export function reviewIntervalDays(category: CategoryLike): number {
  const own = category?.reviewIntervalDays;
  if (typeof own === 'number' && Number.isFinite(own) && own >= REVIEW_DAYS_MIN && own <= REVIEW_DAYS_MAX) {
    return Math.round(own);
  }
  return defaultReviewDays(category);
}

export interface ReviewState {
  /** True when it was never verified, or its next check date has passed. */
  due: boolean;
  /** Never verified at all. */
  never: boolean;
  /** When it should be checked next (null when never verified). */
  nextReview: Date | null;
  /** Days overdue (0 when not due). */
  overdueDays: number;
  intervalDays: number;
}

export function reviewState(
  resource: { verified?: boolean; lastVerifiedAt?: { toDate(): Date } | null },
  category: CategoryLike,
  now = new Date(),
): ReviewState {
  const intervalDays = reviewIntervalDays(category);
  const last = resource.lastVerifiedAt?.toDate() ?? null;

  if (!resource.verified || !last) {
    return { due: true, never: true, nextReview: null, overdueDays: 0, intervalDays };
  }

  const nextReview = new Date(last.getTime() + intervalDays * DAY_MS);
  const overdue = now.getTime() - nextReview.getTime();
  return {
    due: overdue > 0,
    never: false,
    nextReview,
    overdueDays: overdue > 0 ? Math.floor(overdue / DAY_MS) : 0,
    intervalDays,
  };
}

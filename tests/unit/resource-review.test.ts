import { describe, expect, it } from 'vitest';

import { defaultReviewDays, reviewIntervalDays, reviewState } from '../../src/app/features/resources/resource-review';

const DAY = 24 * 60 * 60 * 1000;
const at = (date: Date) => ({ toDate: () => date });

describe('resource review schedule', () => {
  it('uses the default for the kind of category', () => {
    expect(defaultReviewDays({ name: 'Food', slug: 'food' })).toBe(60);
    expect(defaultReviewDays({ name: 'Health Care', slug: 'health-care' })).toBe(90);
    expect(defaultReviewDays({ name: 'Tech Bootcamps', slug: 'tech-bootcamps' })).toBe(180);
    expect(defaultReviewDays({ name: 'Events and Community', slug: 'events' })).toBe(180);
  });

  it('checks crisis and hotline categories most often', () => {
    expect(defaultReviewDays({ name: 'Crisis', slug: 'crisis' })).toBe(30);
    expect(defaultReviewDays({ name: 'Emergency Shelter', slug: 'emergency-shelter' })).toBe(30);
  });

  it("prefers the category's own interval when it is in range", () => {
    expect(reviewIntervalDays({ name: 'Food', reviewIntervalDays: 45 })).toBe(45);
    expect(reviewIntervalDays({ name: 'Food', reviewIntervalDays: null })).toBe(60);
    expect(reviewIntervalDays({ name: 'Food', reviewIntervalDays: 2 })).toBe(60);
    expect(reviewIntervalDays({ name: 'Food', reviewIntervalDays: 5000 })).toBe(60);
  });

  it('is due when never verified', () => {
    const state = reviewState({ verified: false }, { name: 'Food' });
    expect(state.due).toBe(true);
    expect(state.never).toBe(true);
  });

  it('is due once the interval has passed', () => {
    const now = new Date('2026-11-23T12:00:00Z');
    const recent = reviewState({ verified: true, lastVerifiedAt: at(new Date(now.getTime() - 30 * DAY)) }, { name: 'Food' }, now);
    expect(recent.due).toBe(false);
    const old = reviewState({ verified: true, lastVerifiedAt: at(new Date(now.getTime() - 70 * DAY)) }, { name: 'Food' }, now);
    expect(old.due).toBe(true);
    expect(old.overdueDays).toBe(10);
  });
});

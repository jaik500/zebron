import { describe, expect, it } from 'vitest';

import { interpolate } from '../../src/app/core/i18n/interpolate';
import { FRENCH } from '../../src/app/core/i18n/fr';

describe('French translations', () => {
  it('fills {name} and {0} placeholders', () => {
    expect(interpolate('Step {0} of {1}', [2, 4])).toBe('Step 2 of 4');
    expect(interpolate('Hello {name}', { name: 'Ada' })).toBe('Hello Ada');
    expect(interpolate('Keep {missing}', {})).toBe('Keep {missing}');
  });

  it('keeps every placeholder from the English text', () => {
    const problems = Object.entries(FRENCH).filter(([english, french]) => {
      // Each placeholder must appear in the French (it may appear more than once).
      const placeholders = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join(',');
      return placeholders(english) !== placeholders(french);
    });
    expect(problems).toEqual([]);
  });

  it('has no empty translations', () => {
    expect(Object.entries(FRENCH).filter(([, french]) => !french.trim())).toEqual([]);
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BRAND_MARKS,
  DEFAULT_PLACEMENT,
  brandMarkFor,
  clampPlacement,
  customLook,
  hiddenLookKeys,
  isBuiltInLook,
  letterStyle,
  placementStyle,
} from '../../src/app/core/config/brand-marks';

/** Admin → Home page look: the gallery of "e" decorations. */
describe('Home page look gallery', () => {
  it('starts with the standard look and has unique keys', () => {
    expect(BRAND_MARKS[0]).toMatchObject({ key: 'standard', image: null });
    expect(new Set(BRAND_MARKS.map((mark) => mark.key)).size).toBe(BRAND_MARKS.length);
  });

  it('has a picture for every decorated look, drawn on the shared frame', () => {
    for (const mark of BRAND_MARKS.filter((item) => item.image)) {
      const file = join(process.cwd(), 'public', mark.image!);
      expect(existsSync(file), mark.image!).toBe(true);
      expect(readFileSync(file, 'utf8')).toContain('viewBox="82 72 176 140"');
    }
  });

  it('falls back to the standard look for unknown or missing values', () => {
    expect(brandMarkFor('santa-hat').label).toBe('Santa hat');
    expect(brandMarkFor('pumpkin').key).toBe('standard');
    expect(brandMarkFor(undefined).key).toBe('standard');
    expect(brandMarkFor(42).key).toBe('standard');
  });

  it('places the built-in pictures where they were drawn', () => {
    expect(placementStyle(DEFAULT_PLACEMENT)).toEqual({
      width: '0.765em',
      left: 'calc(50% - 0.47em)',
      top: '0.02em',
      transform: 'scaleX(-1) rotate(0deg)',
    });
  });

  it('keeps builder placements inside the allowed ranges', () => {
    expect(clampPlacement({ size: 5, x: -2, y: 'up', rotate: 90 })).toEqual({ size: 1.6, x: -0.8, y: 0.02, rotate: 60 });
    expect(clampPlacement(null)).toEqual(DEFAULT_PLACEMENT);
  });

  it('reads looks built in the admin builder and finds them by id', () => {
    const look = customLook('pumpkin', {
      label: 'Pumpkin',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/p.svg',
      imagePath: 'home-looks/pumpkin/1-p.svg',
      placement: { size: 0.5, x: 0, y: 0.1, rotate: -10 },
      circle: 'ornament',
    });
    expect(look).toMatchObject({ key: 'pumpkin', custom: true, circle: 'ornament', placement: { size: 0.5, rotate: -10 } });
    expect(brandMarkFor('pumpkin', [look]).label).toBe('Pumpkin');
    expect(customLook('x', { imageUrl: 'javascript:alert(1)', circle: 'snowman' })).toMatchObject({ image: null, circle: 'standard' });
    expect(isBuiltInLook('santa-hat')).toBe(true);
    expect(isBuiltInLook('pumpkin')).toBe(false);
  });

  it('turns the circle into an ornament only for the Santa hat looks among the built-in ones', () => {
    expect(BRAND_MARKS.filter((mark) => mark.circle === 'ornament').map((mark) => mark.key)).toEqual(['santa-hat', 'santa-hat-snug']);
  });

  it('sits the snug Santa hat lower on the "e" than the standard one', () => {
    expect(brandMarkFor('santa-hat-snug').placement.y).toBeGreaterThan(brandMarkFor('santa-hat').placement.y);
    expect(placementStyle(brandMarkFor('santa-hat-snug').placement).top).toBe('0.09em');
  });

  it('draws the letter in sparkler gold or red and gold paper-cut for those looks', () => {
    expect(letterStyle('standard')).toBeNull();
    expect(letterStyle(brandMarkFor('sparkler').letter)).toMatchObject({ color: '#FFE3A0' });
    const paper = letterStyle(brandMarkFor('lunar-new-year').letter)!;
    expect(paper['background-image']).toBe('url(/images/brand/paper-cut-waves.svg)');
    expect(paper['background-clip']).toBe('text');
    expect(existsSync(join(process.cwd(), 'public/images/brand/paper-cut-waves.svg'))).toBe(true);
    expect(customLook('x', { letter: 'sparkler' }).letter).toBe('sparkler');
    expect(customLook('x', { letter: 'neon' }).letter).toBe('standard');
  });

  it('reads the hidden looks and never hides the standard look', () => {
    expect(hiddenLookKeys(['party-hat', 'standard', 7, 'fireworks'])).toEqual(['party-hat', 'fireworks']);
    expect(hiddenLookKeys('party-hat')).toEqual([]);
    expect(hiddenLookKeys(undefined)).toEqual([]);
  });
});

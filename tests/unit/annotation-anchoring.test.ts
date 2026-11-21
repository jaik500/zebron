import { describe, expect, it } from 'vitest';

import { anchor, locate } from '../../src/app/features/courses/annotations/annotation-anchoring';

/**
 * Highlights remember their words and the text around them, so they find
 * their place again after a lesson is edited.
 */
describe('Annotation anchoring', () => {
  const text = 'Data is stored in a bucket. Data in transit is encrypted. Data at rest is encrypted too.';

  it('finds the highlighted words where they were', () => {
    const start = text.indexOf('Data in transit');
    const saved = anchor(text, start, start + 'Data in transit'.length);
    expect(locate(text, saved)).toEqual({ start, end: start + 'Data in transit'.length });
  });

  it('picks the right occurrence when the words appear more than once', () => {
    const start = text.indexOf('Data at rest');
    const saved = anchor(text, start, start + 4); // just "Data", the third one
    expect(locate(text, saved)).toEqual({ start, end: start + 4 });
  });

  it('follows the words after text is added before them', () => {
    const start = text.indexOf('encrypted too');
    const saved = anchor(text, start, start + 'encrypted too'.length);
    const edited = 'New introduction paragraph. ' + text;
    const found = locate(edited, saved);
    expect(found && edited.slice(found.start, found.end)).toBe('encrypted too');
    expect(found!.start).toBe(edited.indexOf('encrypted too'));
  });

  it('still finds the words when the text around them changed', () => {
    const start = text.indexOf('in transit');
    const saved = anchor(text, start, start + 'in transit'.length);
    const edited = text.replace('Data in transit is encrypted.', 'Anything in transit is always encrypted.');
    const found = locate(edited, saved);
    expect(found && edited.slice(found.start, found.end)).toBe('in transit');
  });

  it('returns null when the words were removed from the lesson', () => {
    const start = text.indexOf('bucket');
    const saved = anchor(text, start, start + 'bucket'.length);
    expect(locate(text.replace('bucket', 'container'), saved)).toBeNull();
  });

  it('keeps at most 32 characters of context on each side', () => {
    const long = 'x'.repeat(100) + 'target' + 'y'.repeat(100);
    const saved = anchor(long, 100, 106);
    expect(saved.quote).toBe('target');
    expect(saved.prefix).toHaveLength(32);
    expect(saved.suffix).toHaveLength(32);
  });
});

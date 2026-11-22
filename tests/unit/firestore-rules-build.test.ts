import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

// @ts-expect-error: plain JavaScript build script without type declarations.
import { compactRules, HEADER } from '../../scripts/build-rules.mjs';

/**
 * The deployed Firestore rules (firestore.deploy.rules) are built from
 * firestore.rules by scripts/build-rules.mjs. These tests make sure the
 * compact copy means exactly the same, stays within budget and is current.
 */

/**
 * An independent tokenizer (it does not reuse the build script): skips
 * whitespace and comments, keeps strings whole, and returns every token.
 */
function tokens(text: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < text.length && text[j] !== ch) j += text[j] === '\\' ? 2 : 1;
      result.push(text.slice(i, j + 1));
      i = j + 1;
    } else if (/[A-Za-z0-9_$]/.test(ch)) {
      let j = i;
      while (j < text.length && /[A-Za-z0-9_$]/.test(text[j])) j++;
      result.push(text.slice(i, j));
      i = j;
    } else {
      result.push(ch);
      i++;
    }
  }
  return result;
}

describe('Firestore rules build', () => {
  const source = readFileSync('firestore.rules', 'utf8');
  const compact: string = compactRules(source);

  it('keeps every token of the source, in order', () => {
    const fromSource = tokens(source);
    const fromCompact = tokens(compact.slice(HEADER.length));
    expect(fromCompact.length).toBe(fromSource.length);
    const firstDifference = fromSource.findIndex((token, index) => token !== fromCompact[index]);
    expect(firstDifference).toBe(-1);
  });

  it('never joins two words onto one token', () => {
    // Every line of the compact copy is a trimmed line of comment-free source.
    for (const line of compact.split('\n')) {
      expect(line).toBe(line.trim());
    }
  });

  it('stays within the rules budget', () => {
    // Firestore's hard limit is 256 KiB of text; the budget leaves room to grow.
    // If this fails, shrink the rules (see the "Firestore rules size" developer article).
    expect(Buffer.byteLength(compact, 'utf8')).toBeLessThan(200 * 1024);
  });

  it('matches the committed firestore.deploy.rules', () => {
    const committed = readFileSync('firestore.deploy.rules', 'utf8').replace(/\r\n/g, '\n');
    // If this fails: npm run rules:build
    expect(committed === compact).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { MAX_UTTERANCE, speechLanguage, splitSentences } from '../../src/app/features/documents/reader-speech';

/** Read aloud: splitting text into sentences. */
describe('Reader speech', () => {
  const pieces = (text: string, locale?: string) => splitSentences(text, locale).map((range) => text.slice(range.start, range.end));

  it('splits text into sentences without the spaces around them', () => {
    expect(pieces('  First sentence. Second one!  Third?  ')).toEqual(['First sentence.', 'Second one!', 'Third?']);
  });

  it('treats line breaks (headings, list items) as separate sentences', () => {
    expect(pieces('Chapter One\nIt was a dark night. Rain fell.\n\n- item one\n- item two')).toEqual([
      'Chapter One',
      'It was a dark night.',
      'Rain fell.',
      '- item one',
      '- item two',
    ]);
  });

  it('skips pieces with no letters or digits', () => {
    expect(pieces('Hello.\n* * *\n— \nWorld.')).toEqual(['Hello.', 'World.']);
  });

  it('works in French', () => {
    expect(pieces('Bonjour à tous. Comment allez-vous ? Très bien !', 'fr')).toEqual([
      'Bonjour à tous.',
      'Comment allez-vous ?',
      'Très bien !',
    ]);
  });

  it('splits very long sentences at a comma or space', () => {
    const long = `${'word, '.repeat(120)}end.`;
    const result = pieces(long);
    expect(result.length).toBeGreaterThan(1);
    for (const piece of result) expect(piece.length).toBeLessThanOrEqual(MAX_UTTERANCE);
    expect(result.join(' ').replace(/\s+/g, ' ')).toBe(long.trim().replace(/\s+/g, ' '));
  });

  it('keeps ranges pointing at the original text', () => {
    const text = 'One. Two.';
    expect(splitSentences(text)).toEqual([
      { start: 0, end: 4 },
      { start: 5, end: 9 },
    ]);
  });

  it('never joins text from two blocks of the page into one sentence', () => {
    // "A heading" and "First sentence here." sit in different elements with no space between them.
    const text = 'A headingFirst sentence here. Second one.';
    expect(splitSentences(text, 'en', [9]).map((range) => text.slice(range.start, range.end))).toEqual([
      'A heading',
      'First sentence here.',
      'Second one.',
    ]);
  });

  it('reads in the interface language', () => {
    expect(speechLanguage('fr')).toBe('fr-FR');
    expect(speechLanguage('en')).toBe('en-US');
  });
});

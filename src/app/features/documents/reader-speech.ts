/**
 * Read aloud in the reader: splitting text into sentences (pure, tested in
 * tests/unit/reader-speech.test.ts) and finding a sentence on the page.
 *
 * The voice is the browser's own (speechSynthesis): free, offline on most
 * devices, in the languages the device has voices for.
 */
export interface SentenceRange {
  start: number;
  end: number;
}

/** Utterances longer than this are split, as some browsers stop long ones early. */
export const MAX_UTTERANCE = 280;

/**
 * Sentences in `text` as character ranges, without surrounding spaces. Uses
 * Intl.Segmenter when the browser has it, otherwise a punctuation rule.
 * Very long sentences are split at a comma, semicolon or space.
 *
 * `breaks`: offsets where a new block starts (a heading, paragraph, list item
 * or line break on the page, from blockBreaks()). Text from two blocks is
 * never read as one sentence, even with no space between them.
 */
export function splitSentences(text: string, locale = 'en', breaks: readonly number[] = []): SentenceRange[] {
  const edges = [0, ...[...breaks].filter((offset) => offset > 0 && offset < text.length).sort((a, b) => a - b), text.length];
  const result: SentenceRange[] = [];
  for (let index = 0; index < edges.length - 1; index++) {
    const from = edges[index];
    const to = edges[index + 1];
    if (to <= from) continue;
    for (const range of splitBlock(text.slice(from, to), locale)) {
      result.push({ start: range.start + from, end: range.end + from });
    }
  }
  return result;
}

function splitBlock(text: string, locale: string): SentenceRange[] {
  const raw: SentenceRange[] = [];
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Segmenter) {
    for (const part of new Segmenter(locale, { granularity: 'sentence' }).segment(text)) {
      raw.push({ start: part.index, end: part.index + part.segment.length });
    }
  } else {
    const pattern = /[^.!?\n]+(?:[.!?]+["'”’)\]]*|\n+|$)/g;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      if (!match[0]) {
        pattern.lastIndex++;
        continue;
      }
      raw.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  const sentences: SentenceRange[] = [];
  for (const range of raw) {
    // Line breaks inside a "sentence" (headings, list items) are separate sentences.
    let from = range.start;
    for (const line of text.slice(range.start, range.end).split(/(\n+)/)) {
      const to = from + line.length;
      if (!/^\n+$/.test(line)) pushTrimmed(text, from, to, sentences);
      from = to;
    }
  }
  return sentences;
}

function pushTrimmed(text: string, start: number, end: number, into: SentenceRange[]): void {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  if (end <= start || !/[\p{L}\p{N}]/u.test(text.slice(start, end))) return;
  while (end - start > MAX_UTTERANCE) {
    const window = text.slice(start, start + MAX_UTTERANCE);
    const cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '));
    const space = window.lastIndexOf(' ');
    const at = cut > MAX_UTTERANCE / 2 ? cut + 1 : space > MAX_UTTERANCE / 2 ? space : MAX_UTTERANCE;
    pushTrimmed(text, start, start + at, into);
    start += at;
    while (start < end && /\s/.test(text[start])) start++;
  }
  if (end > start) into.push({ start, end });
}

/** The language to read in: the reader's interface language as a BCP 47 tag. */
export function speechLanguage(language: string): string {
  return language === 'fr' ? 'fr-FR' : 'en-US';
}

const BLOCK_ELEMENTS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'CAPTION', 'DD', 'DIV', 'DL', 'DT', 'FIGCAPTION', 'FIGURE', 'FOOTER',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TD', 'TH', 'TR', 'UL',
]);

/**
 * Offsets (in the same text as textOf(root)) where a new block of the page
 * starts: a different paragraph, heading, list item or table cell, or after
 * a line break (<br>). Browser only.
 */
export function blockBreaks(root: HTMLElement): number[] {
  const breaks: number[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let position = 0;
  let previousBlock: Node | null = null;
  let lineBreak = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).tagName === 'BR') lineBreak = true;
      continue;
    }
    let block: Node = node.parentNode ?? root;
    while (block !== root && !(block instanceof Element && BLOCK_ELEMENTS.has(block.tagName))) block = block.parentNode ?? root;
    if (position > 0 && (lineBreak || block !== previousBlock)) breaks.push(position);
    previousBlock = block;
    lineBreak = false;
    position += (node as Text).data.length;
  }
  return breaks;
}

/** A DOM Range for characters start..end of the text inside `root` (browser only). */
export function rangeFor(root: Node, start: number, end: number): Range | null {
  const walker = root.ownerDocument!.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = root.ownerDocument!.createRange();
  let position = 0;
  let started = false;
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const next = position + node.data.length;
    if (!started && start < next) {
      range.setStart(node, start - position);
      started = true;
    }
    if (started && end <= next) {
      range.setEnd(node, end - position);
      return range;
    }
    position = next;
  }
  return null;
}

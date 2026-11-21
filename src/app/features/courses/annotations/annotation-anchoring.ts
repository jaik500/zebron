/**
 * Finding highlighted text again, and painting highlights into lesson HTML.
 *
 * The text side (anchor, locate) is plain string work, unit-tested in
 * tests/unit/annotation-anchoring.test.ts. The DOM side (textOf, offsets,
 * paint, unpaint) works on the lesson section elements in the browser.
 */

export const CONTEXT_LENGTH = 32;

export interface TextAnchor {
  quote: string;
  prefix: string;
  suffix: string;
}

export interface TextRange {
  start: number;
  end: number;
}

/** The anchor for text[start, end): the words plus a little text on each side. */
export function anchor(text: string, start: number, end: number): TextAnchor {
  return {
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: text.slice(end, end + CONTEXT_LENGTH),
  };
}

/** Characters shared at the end of a and the end of b (prefix match, read backwards). */
function sharedEnd(a: string, b: string): number {
  let count = 0;
  while (count < a.length && count < b.length && a[a.length - 1 - count] === b[b.length - 1 - count]) count++;
  return count;
}

/** Characters shared at the start of a and the start of b. */
function sharedStart(a: string, b: string): number {
  let count = 0;
  while (count < a.length && count < b.length && a[count] === b[count]) count++;
  return count;
}

/**
 * Where the anchored words are in text now, or null when they are gone.
 * When the words appear more than once, the occurrence whose surrounding
 * text matches best wins (so highlighting "data" in one sentence never
 * jumps to another "data").
 */
export function locate(text: string, target: TextAnchor): TextRange | null {
  const { quote } = target;
  if (!quote) return null;

  let best: TextRange | null = null;
  let bestScore = -1;
  let from = 0;

  for (;;) {
    const start = text.indexOf(quote, from);
    if (start < 0) break;
    const end = start + quote.length;
    const score =
      sharedEnd(text.slice(Math.max(0, start - target.prefix.length), start), target.prefix) +
      sharedStart(text.slice(end, end + target.suffix.length), target.suffix);
    if (score > bestScore) {
      best = { start, end };
      bestScore = score;
    }
    from = start + 1;
  }

  return best;
}

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

export const MARK_ATTRIBUTE = 'data-annotation-id';

/** Text nodes of a section, in reading order. */
function textNodes(root: Node): Text[] {
  const walker = root.ownerDocument!.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  return nodes;
}

/** The section's text, exactly as the offsets below count it. */
export function textOf(root: Node): string {
  return textNodes(root)
    .map((node) => node.data)
    .join('');
}

/** Offset in textOf(root) of a point inside root (from a Range boundary). */
export function offsetOf(root: Node, container: Node, offset: number): number {
  if (container.nodeType !== Node.TEXT_NODE) {
    // A boundary between child nodes: count the text before that child.
    const range = root.ownerDocument!.createRange();
    range.selectNodeContents(root);
    range.setEnd(container, offset);
    return range.toString().length;
  }
  let total = 0;
  for (const node of textNodes(root)) {
    if (node === container) return total + offset;
    total += node.data.length;
  }
  return total;
}

export interface PaintRequest {
  id: string;
  range: TextRange;
  className: string;
  title: string;
}

/**
 * Wrap each range in <mark> elements (one per text node it crosses).
 * Ranges are painted from last to first so earlier offsets stay valid.
 */
export function paint(root: HTMLElement, requests: PaintRequest[]): void {
  const sorted = [...requests].sort((a, b) => b.range.start - a.range.start);

  for (const request of sorted) {
    let position = 0;
    // Snapshot the nodes first: wrapping changes the tree.
    const nodes = textNodes(root).map((node) => {
      const start = position;
      position += node.data.length;
      return { node, start, end: position };
    });

    for (const { node, start, end } of nodes) {
      const from = Math.max(request.range.start, start);
      const to = Math.min(request.range.end, end);
      if (from >= to) continue;
      // Skip whitespace-only pieces between block elements (they would paint gaps in lists and tables).
      if (!node.data.slice(from - start, to - start).trim() && node.parentElement?.closest('ul,ol,table,tr')) continue;

      let target = node;
      if (to - start < target.data.length) target.splitText(to - start);
      if (from - start > 0) target = target.splitText(from - start);

      const mark = root.ownerDocument.createElement('mark');
      mark.className = request.className;
      mark.setAttribute(MARK_ATTRIBUTE, request.id);
      mark.title = request.title;
      target.parentNode!.insertBefore(mark, target);
      mark.appendChild(target);
    }
  }
}

/** Remove every highlight mark from root, leaving the text as it was. */
export function unpaint(root: HTMLElement): void {
  const marks = Array.from(root.querySelectorAll(`mark[${MARK_ATTRIBUTE}]`));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}

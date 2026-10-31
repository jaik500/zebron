/**
 * Small, safe formatter for Knowledge Center article text.
 *
 * Articles are stored as plain text with light Markdown:
 *   # Heading, ## Subheading, ### Small heading
 *   - bullet or * bullet, 1. numbered
 *   **bold**, *italic*, `code`, [link](https://...)
 *   ``` fenced code blocks ```
 *   > quote
 *   | Column | Column |   tables: a header row, a separator row
 *   | ------ | -----: |   (:--- left, :---: centre, ---: right), then rows
 *
 * All text is HTML-escaped first, and only https/mailto links are
 * turned into anchors, so the output is safe to bind with [innerHTML].
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(text: string): string {
  let html = escapeHtml(text);

  // Code first so its content is not formatted further.
  const codes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_match, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\(((?:https:\/\/|mailto:)[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

  return html.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codes[Number(index)] ?? '');
}

/** Splits "| a | b |" into ["a", "b"]; "\\|" stays a literal pipe. */
function tableCells(row: string): string[] {
  const body = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return body
    .replace(/\\\|/g, '\u0001')
    .split('|')
    .map((cell) => cell.replace(/\u0001/g, '|').trim());
}

function isTableRow(line: string): boolean {
  return line.includes('|');
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(line.trim());
}

function renderTable(header: string[], alignments: string[], rows: string[][]): string {
  const columns = header.length;
  const align = (index: number) => {
    const value = alignments[index] ?? '';
    return value ? ` class="kc-${value}"` : '';
  };
  const cells = (row: string[], tag: 'th' | 'td') =>
    Array.from({ length: columns }, (_unused, index) => `<${tag}${align(index)}>${inline(row[index] ?? '')}</${tag}>`).join('');

  return (
    '<div class="kc-table-wrap"><table class="kc-table">' +
    `<thead><tr>${cells(header, 'th')}</tr></thead>` +
    `<tbody>${rows.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody>` +
    '</table></div>'
  );
}

export function renderKnowledgeContent(source: string): string {
  const lines = (source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];
  let code: string[] | null = null;

  const closeParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (code) {
      if (line.trim().startsWith('```')) {
        out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      closeParagraph();
      closeList();
      code = [];
      continue;
    }

    if (!trimmed) {
      closeParagraph();
      closeList();
      continue;
    }

    // Table: a row with pipes followed by a separator row (| --- | --- |).
    if (isTableRow(trimmed) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      closeParagraph();
      closeList();

      const header = tableCells(trimmed);
      const alignments = tableCells(lines[index + 1]).map((cell) =>
        cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : '',
      );
      const rows: string[][] = [];

      index += 2;
      while (index < lines.length && lines[index].trim() && isTableRow(lines[index])) {
        rows.push(tableCells(lines[index]));
        index++;
      }
      index--; // the for loop moves on to the line after the table

      out.push(renderTable(header, alignments, rows));
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeParagraph();
      closeList();
      const level = heading[1].length + 1; // # -> h2 (the page title is h1)
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || numbered) {
      closeParagraph();
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((bullet ?? numbered)![1])}</li>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      closeParagraph();
      closeList();
      out.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  if (code) {
    out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  }
  closeParagraph();
  closeList();

  return out.join('\n');
}

/** Plain-text preview for cards and search. */
export function knowledgeExcerpt(article: { summary?: string; content: string }, length = 180): string {
  const text = (article.summary?.trim() || article.content)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`_[\]()|:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

/** Case-insensitive match across title, summary, tags, category and content. */
export function matchesKnowledgeSearch(
  article: { title: string; summary?: string; content: string; tags: string[]; category: string },
  term: string,
): boolean {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [article.title, article.summary ?? '', article.category, article.tags.join(' '), article.content]
    .join(' ')
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** Parses a comma-separated tag field into a clean, unique list. */
export function parseTags(value: string): string[] {
  return [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

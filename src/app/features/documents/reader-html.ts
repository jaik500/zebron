/**
 * Safe HTML for the reader. EPUB chapters and converted Word documents are
 * HTML written by someone else, so only an allowlist of reading elements and
 * attributes survives: no scripts, styles, forms, frames, event handlers or
 * outside resources. Links to the web open in a new tab; images must be
 * blob: or data:image URLs made by the reader itself. Angular's own
 * sanitizer runs again when the result is bound with [innerHTML].
 *
 * Browser only (uses DOMParser).
 */

const ALLOWED_ELEMENTS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup',
  'dd', 'del', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre', 'q', 'rp', 'rt', 'ruby', 's',
  'samp', 'section', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'time', 'tr', 'u', 'ul', 'var', 'wbr', 'article', 'aside', 'header', 'footer', 'nav', 'main',
]);

/** Elements removed together with everything inside them. */
const DROPPED_WITH_CONTENT = new Set([
  'script', 'style', 'noscript', 'template', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
  'form', 'input', 'button', 'select', 'textarea', 'option', 'link', 'meta', 'base', 'audio', 'video',
  'source', 'track', 'canvas', 'svg', 'math', 'head', 'title',
]);

// Kept in step with Angular's sanitizer, so binding the result never logs "sanitizing HTML stripped some content".
const ALLOWED_ATTRIBUTES = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'lang', 'dir', 'start', 'datetime']);

const SAFE_IMAGE_SRC = /^(blob:|data:image\/(png|jpe?g|gif|webp);base64,)/i;
const SAFE_WEB_LINK = /^(https?:|mailto:)/i;

export interface SanitizeOptions {
  /**
   * Called for each image src that isn't already a safe blob:/data: URL
   * (for example a path inside an EPUB). Return a safe URL, or null to drop
   * the image.
   */
  resolveImage?: (src: string) => string | null;
  /**
   * Called for each link that isn't a web or mail link (for example another
   * chapter of an EPUB). Return the href to keep (such as "#zb-ch-3"), or
   * null to keep the text without the link.
   */
  resolveLink?: (href: string) => string | null;
}

/** Clean HTML (a fragment or a whole document) down to the allowlist. Returns the body's inner HTML. */
export function sanitizeReaderHtml(html: string, options: SanitizeOptions = {}): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  cleanChildren(parsed.body, options);
  return parsed.body.innerHTML;
}

/** Clean an element that is already parsed (for example an EPUB chapter's body). */
export function sanitizeReaderElement(element: Element, options: SanitizeOptions = {}): string {
  // Copy into a fresh HTML document: an XHTML chapter would otherwise
  // serialize as XML (xmlns attributes, <div/> style empty tags).
  const htmlDocument = document.implementation.createHTMLDocument('');
  const holder = htmlDocument.createElement('div');
  for (const child of Array.from(element.childNodes)) holder.appendChild(htmlDocument.importNode(child, true));
  cleanChildren(holder, options);
  return holder.innerHTML;
}

function cleanChildren(parent: Element, options: SanitizeOptions): void {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === 3) continue; // text
    if (node.nodeType !== 1) {
      node.remove(); // comments, processing instructions
      continue;
    }
    const element = node as Element;
    const name = element.localName.toLowerCase();

    if (DROPPED_WITH_CONTENT.has(name)) {
      element.remove();
      continue;
    }
    if (!ALLOWED_ELEMENTS.has(name)) {
      // Unknown wrapper (for example epub:switch or body in XHTML): keep its content.
      cleanChildren(element, options);
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      if (!ALLOWED_ATTRIBUTES.has(attributeName)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (name === 'img') {
      const src = element.getAttribute('src') ?? '';
      const safe = SAFE_IMAGE_SRC.test(src) ? src : (options.resolveImage?.(src) ?? null);
      if (!safe || !SAFE_IMAGE_SRC.test(safe)) {
        element.remove();
        continue;
      }
      element.setAttribute('src', safe);
    } else {
      element.removeAttribute('src');
    }

    if (name === 'a') {
      const href = (element.getAttribute('href') ?? '').trim();
      if (SAFE_WEB_LINK.test(href)) {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      } else {
        const kept = href ? (options.resolveLink?.(href) ?? null) : null;
        if (kept && kept.startsWith('#')) element.setAttribute('href', kept);
        else element.removeAttribute('href');
      }
    } else {
      element.removeAttribute('href');
    }

    cleanChildren(element, options);
  }
}

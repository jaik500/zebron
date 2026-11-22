/**
 * Opens an EPUB (2 or 3) in the browser: reads the zip with JSZip, finds the
 * package file, the reading order (spine) and the table of contents (EPUB 3
 * nav or EPUB 2 NCX), and turns each chapter into safe HTML (reader-html.ts)
 * with its images as blob: URLs. Links to other chapters become
 * "#zb-ch-<index>" so the reader can move between chapters.
 *
 * Browser only (DOMParser, URL.createObjectURL). Call dispose() when the
 * book is closed to free the image URLs.
 */
import type JSZip from 'jszip';

import { resolveZipPath } from './document-formats';
import { sanitizeReaderElement } from './reader-html';

export interface EpubChapter {
  /** Path of the chapter file inside the zip. */
  path: string;
}

export interface EpubTocEntry {
  title: string;
  chapterIndex: number;
  depth: number;
}

export interface EpubBook {
  title: string;
  author: string;
  chapters: EpubChapter[];
  toc: EpubTocEntry[];
  /** Safe HTML for one chapter. */
  chapterHtml(index: number): Promise<string>;
  dispose(): void;
}

const IMAGE_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

export class EpubError extends Error {}

function parseXml(text: string): Document {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) {
    // Some books are not well-formed XML: fall back to the forgiving HTML parser.
    return new DOMParser().parseFromString(text, 'text/html');
  }
  return xml;
}

/** Elements by local name, whatever their namespace prefix (opf:item, dc:title...). */
function byName(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagName('*')).filter((element) => element.localName === localName);
}

function textOf(element: Element | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export async function openEpub(data: ArrayBuffer, Zip: typeof JSZip): Promise<EpubBook> {
  let zip: JSZip;
  try {
    zip = await Zip.loadAsync(data);
  } catch {
    throw new EpubError('This file is not a valid EPUB.');
  }

  const read = async (path: string): Promise<string | null> => zip.file(path)?.async('string') ?? null;

  const container = await read('META-INF/container.xml');
  if (!container) throw new EpubError('This EPUB has no META-INF/container.xml.');
  const opfPath = byName(parseXml(container), 'rootfile')[0]?.getAttribute('full-path') ?? '';
  const opfText = opfPath ? await read(opfPath) : null;
  if (!opfText) throw new EpubError('This EPUB has no package file.');
  const opf = parseXml(opfText);

  const title = textOf(byName(opf, 'title')[0]) || 'Untitled book';
  const author = textOf(byName(opf, 'creator')[0]);

  // Manifest: id → { path, type, properties }
  const manifest = new Map<string, { path: string; type: string; properties: string }>();
  for (const item of byName(opf, 'item')) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) {
      manifest.set(id, {
        path: resolveZipPath(opfPath, href),
        type: item.getAttribute('media-type') ?? '',
        properties: item.getAttribute('properties') ?? '',
      });
    }
  }

  const spine = byName(opf, 'spine')[0];
  const chapters: EpubChapter[] = byName(opf, 'itemref')
    .filter((ref) => ref.getAttribute('linear') !== 'no')
    .map((ref) => manifest.get(ref.getAttribute('idref') ?? ''))
    .filter((item): item is { path: string; type: string; properties: string } => !!item && /html|xml/.test(item.type))
    .map((item) => ({ path: item.path }));
  if (!chapters.length) throw new EpubError('This EPUB has no readable chapters.');

  const chapterIndexOf = (path: string): number => chapters.findIndex((chapter) => chapter.path === path);

  // Table of contents: EPUB 3 nav document, else EPUB 2 NCX, else the chapters themselves.
  const toc: EpubTocEntry[] = [];
  const navItem = [...manifest.values()].find((item) => item.properties.split(/\s+/).includes('nav'));
  const ncxItem = manifest.get(spine?.getAttribute('toc') ?? '') ?? [...manifest.values()].find((item) => item.type === 'application/x-dtbncx+xml');

  if (navItem) {
    const navText = await read(navItem.path);
    if (navText) {
      const navDoc = parseXml(navText);
      const tocNav =
        byName(navDoc, 'nav').find((nav) => (nav.getAttribute('epub:type') ?? nav.getAttributeNS('http://www.idpf.org/2007/ops', 'type') ?? '').includes('toc')) ??
        byName(navDoc, 'nav')[0];
      const walk = (list: Element | undefined, depth: number) => {
        if (!list) return;
        for (const li of Array.from(list.children).filter((child) => child.localName === 'li')) {
          const link = Array.from(li.children).find((child) => child.localName === 'a');
          if (link) {
            const index = chapterIndexOf(resolveZipPath(navItem.path, link.getAttribute('href') ?? ''));
            if (index >= 0) toc.push({ title: textOf(link), chapterIndex: index, depth });
          }
          walk(Array.from(li.children).find((child) => child.localName === 'ol'), depth + 1);
        }
      };
      walk(tocNav ? Array.from(tocNav.children).find((child) => child.localName === 'ol') : undefined, 0);
    }
  }
  if (!toc.length && ncxItem) {
    const ncxText = await read(ncxItem.path);
    if (ncxText) {
      const walk = (parent: Element, depth: number) => {
        for (const point of Array.from(parent.children).filter((child) => child.localName === 'navPoint')) {
          const label = byName(point, 'text')[0];
          const content = Array.from(point.children).find((child) => child.localName === 'content');
          const index = chapterIndexOf(resolveZipPath(ncxItem.path, content?.getAttribute('src') ?? ''));
          if (index >= 0) toc.push({ title: textOf(label), chapterIndex: index, depth });
          walk(point, depth + 1);
        }
      };
      const navMap = byName(parseXml(ncxText), 'navMap')[0];
      if (navMap) walk(navMap, 0);
    }
  }
  if (!toc.length) {
    chapters.forEach((_, index) => toc.push({ title: `Section ${index + 1}`, chapterIndex: index, depth: 0 }));
  }

  // Images become blob: URLs, made once per book.
  const imageUrls = new Map<string, string>();
  const imageUrl = async (path: string): Promise<string | null> => {
    if (imageUrls.has(path)) return imageUrls.get(path)!;
    const extension = path.split('.').pop()?.toLowerCase() ?? '';
    const type = IMAGE_TYPES[extension];
    const file = zip.file(path);
    if (!type || !file) return null;
    const url = URL.createObjectURL(new Blob([await file.async('arraybuffer')], { type }));
    imageUrls.set(path, url);
    return url;
  };

  return {
    title,
    author,
    chapters,
    toc,
    async chapterHtml(index: number): Promise<string> {
      const chapter = chapters[index];
      if (!chapter) return '';
      const text = await read(chapter.path);
      if (!text) return '';
      const page = parseXml(text);
      const body = byName(page, 'body')[0] ?? page.documentElement;

      // Load this chapter's images first, so the sanitizer can swap their paths.
      const sources = new Map<string, string | null>();
      for (const img of byName(body, 'img')) {
        const src = img.getAttribute('src') ?? '';
        if (!sources.has(src)) sources.set(src, await imageUrl(resolveZipPath(chapter.path, src)));
      }
      // SVG cover images (<svg><image xlink:href>) become plain images.
      for (const svgImage of byName(body, 'image')) {
        const href = svgImage.getAttribute('href') ?? svgImage.getAttribute('xlink:href') ?? svgImage.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? '';
        const url = await imageUrl(resolveZipPath(chapter.path, href));
        const svg = svgImage.closest('svg');
        if (url && svg) {
          const img = page.createElementNS('http://www.w3.org/1999/xhtml', 'img');
          img.setAttribute('src', url);
          img.setAttribute('alt', '');
          svg.replaceWith(img);
        }
      }

      return sanitizeReaderElement(body, {
        resolveImage: (src) => sources.get(src) ?? null,
        resolveLink: (href) => {
          const target = chapterIndexOf(resolveZipPath(chapter.path, href));
          return target >= 0 ? `#zb-ch-${target}` : null;
        },
      });
    },
    dispose(): void {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
      imageUrls.clear();
    },
  };
}

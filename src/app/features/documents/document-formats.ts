/**
 * My documents: the formats the reader opens, and the upload limits.
 * Pure functions (no Angular, no Firebase), tested in
 * tests/unit/document-formats.test.ts.
 *
 * Limits: 50 MB per file (also enforced by storage.rules and
 * firestore.rules), 100 documents and 500 MB per person (checked by the app).
 */
export type DocumentFormat = 'pdf' | 'epub' | 'docx' | 'txt' | 'md';

export interface DocumentFormatInfo {
  format: DocumentFormat;
  label: string;
  /** Material icon. */
  icon: string;
  extensions: readonly string[];
  /** The type stored with the file (storage.rules accepts only these). */
  contentType: string;
}

export const DOCUMENT_FORMATS: readonly DocumentFormatInfo[] = [
  { format: 'pdf', label: 'PDF', icon: 'picture_as_pdf', extensions: ['pdf'], contentType: 'application/pdf' },
  { format: 'epub', label: 'EPUB', icon: 'menu_book', extensions: ['epub'], contentType: 'application/epub+zip' },
  {
    format: 'docx',
    label: 'Word',
    icon: 'description',
    extensions: ['docx'],
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  { format: 'txt', label: 'Text', icon: 'article', extensions: ['txt', 'text'], contentType: 'text/plain' },
  { format: 'md', label: 'Markdown', icon: 'notes', extensions: ['md', 'markdown'], contentType: 'text/markdown' },
];

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 500 * 1024 * 1024;
export const MAX_DOCUMENTS = 100;

/** For the file picker's accept attribute. */
export const ACCEPTED_EXTENSIONS = DOCUMENT_FORMATS.flatMap((info) => info.extensions.map((ext) => `.${ext}`)).join(',');

export function formatInfo(format: DocumentFormat): DocumentFormatInfo {
  return DOCUMENT_FORMATS.find((info) => info.format === format) ?? DOCUMENT_FORMATS[0];
}

function extensionOf(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return match ? match[1].toLowerCase() : '';
}

/** The format of a file, from its extension (the browser's type is often empty for .md and .epub). */
export function formatOf(fileName: string): DocumentFormat | null {
  const extension = extensionOf(fileName);
  return DOCUMENT_FORMATS.find((info) => info.extensions.includes(extension))?.format ?? null;
}

/**
 * A file name that is safe in a storage path: no folders, no control or
 * reserved characters, at most 120 characters, extension kept.
 */
export function safeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  const extension = extensionOf(base);
  const stem = (extension ? base.slice(0, -(extension.length + 1)) : base)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._ -]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 110);
  return `${stem || 'document'}${extension ? `.${extension}` : ''}`;
}

/** "security_plus-notes v2.pdf" → "Security plus notes v2". */
export function titleFromFileName(fileName: string): string {
  const base = (fileName.split(/[\\/]/).pop() ?? '').replace(/\.[a-z0-9]+$/i, '');
  const words = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const title = words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Untitled document';
  return title.slice(0, 200);
}

export type UploadCheck =
  | { ok: true; format: DocumentFormat; contentType: string; fileName: string; title: string }
  | { ok: false; reason: 'format' | 'empty' | 'too-large' | 'too-many' | 'quota' };

/** Whether a file can be added, given what the person already has. */
export function checkUpload(
  file: { name: string; size: number },
  existing: { count: number; totalBytes: number },
): UploadCheck {
  const format = formatOf(file.name);
  if (!format) return { ok: false, reason: 'format' };
  if (!(file.size > 0)) return { ok: false, reason: 'empty' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'too-large' };
  if (existing.count >= MAX_DOCUMENTS) return { ok: false, reason: 'too-many' };
  if (existing.totalBytes + file.size > MAX_TOTAL_BYTES) return { ok: false, reason: 'quota' };
  return {
    ok: true,
    format,
    contentType: formatInfo(format).contentType,
    fileName: safeFileName(file.name),
    title: titleFromFileName(file.name),
  };
}

/** 2400000 → "2.3 MB". */
export function formatBytes(bytes: number): string {
  if (!(bytes > 0)) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** A whole percentage between 0 and 100. */
export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

/**
 * Resolve a path inside an EPUB (zip) relative to the file that refers to it:
 * ("OEBPS/text/ch1.xhtml", "../images/a.png") → "OEBPS/images/a.png".
 * Drops any #fragment or ?query; never climbs above the root.
 */
export function resolveZipPath(fromFile: string, relative: string): string {
  const clean = decodeURIComponentSafe(relative.split('#')[0].split('?')[0]);
  if (!clean) return '';
  const parts = clean.startsWith('/') ? [] : fromFile.split('/').slice(0, -1);
  for (const part of clean.replace(/^\/+/, '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

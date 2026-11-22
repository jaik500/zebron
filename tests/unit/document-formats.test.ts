import { describe, expect, it } from 'vitest';

import {
  checkUpload,
  clampProgress,
  formatBytes,
  formatOf,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  resolveZipPath,
  safeFileName,
  titleFromFileName,
} from '../../src/app/features/documents/document-formats';

/** My documents: formats, file names and upload limits. */
describe('Document formats', () => {
  it('recognizes formats by extension, whatever the case', () => {
    expect(formatOf('Notes.PDF')).toBe('pdf');
    expect(formatOf('book.epub')).toBe('epub');
    expect(formatOf('report.docx')).toBe('docx');
    expect(formatOf('readme.md')).toBe('md');
    expect(formatOf('log.txt')).toBe('txt');
    expect(formatOf('old.doc')).toBeNull();
    expect(formatOf('slides.pptx')).toBeNull();
    expect(formatOf('no-extension')).toBeNull();
  });

  it('makes file names safe for storage paths and keeps the extension', () => {
    expect(safeFileName('C:\\Users\\me\\My Notes (final).pdf')).toBe('My-Notes-final.pdf');
    expect(safeFileName('../../etc/passwd.txt')).toBe('passwd.txt');
    expect(safeFileName('Économie générale.epub')).toBe('Economie-generale.epub');
    expect(safeFileName('???.md')).toBe('document.md');
    expect(safeFileName(`${'a'.repeat(300)}.pdf`).length).toBeLessThanOrEqual(120);
  });

  it('turns file names into readable titles', () => {
    expect(titleFromFileName('security_plus-notes v2.pdf')).toBe('Security plus notes v2');
    expect(titleFromFileName('.pdf')).toBe('Untitled document');
  });

  it('accepts a supported file within the limits', () => {
    const result = checkUpload({ name: 'Chapter 1.docx', size: 1000 }, { count: 0, totalBytes: 0 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('docx');
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.fileName).toBe('Chapter-1.docx');
      expect(result.title).toBe('Chapter 1');
    }
  });

  it('refuses unsupported, empty, oversized and over-quota files', () => {
    const none = { count: 0, totalBytes: 0 };
    expect(checkUpload({ name: 'a.exe', size: 10 }, none)).toEqual({ ok: false, reason: 'format' });
    expect(checkUpload({ name: 'a.pdf', size: 0 }, none)).toEqual({ ok: false, reason: 'empty' });
    expect(checkUpload({ name: 'a.pdf', size: MAX_FILE_BYTES + 1 }, none)).toEqual({ ok: false, reason: 'too-large' });
    expect(checkUpload({ name: 'a.pdf', size: 10 }, { count: 100, totalBytes: 0 })).toEqual({ ok: false, reason: 'too-many' });
    expect(checkUpload({ name: 'a.pdf', size: 10 }, { count: 1, totalBytes: MAX_TOTAL_BYTES })).toEqual({ ok: false, reason: 'quota' });
  });

  it('shows sizes in KB and MB', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(300)).toBe('1 KB');
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
    expect(formatBytes(30 * 1024 * 1024)).toBe('30 MB');
  });

  it('keeps progress between 0 and 100', () => {
    expect(clampProgress(42.6)).toBe(43);
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(250)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it('resolves paths inside an EPUB', () => {
    expect(resolveZipPath('OEBPS/text/ch1.xhtml', '../images/a.png')).toBe('OEBPS/images/a.png');
    expect(resolveZipPath('OEBPS/content.opf', 'text/ch%201.xhtml')).toBe('OEBPS/text/ch 1.xhtml');
    expect(resolveZipPath('OEBPS/text/ch1.xhtml', 'ch2.xhtml#part')).toBe('OEBPS/text/ch2.xhtml');
    expect(resolveZipPath('OEBPS/text/ch1.xhtml', '/root.xhtml')).toBe('root.xhtml');
    expect(resolveZipPath('a.xhtml', '../../../escape.png')).toBe('escape.png');
    expect(resolveZipPath('a.xhtml', '#only-fragment')).toBe('');
  });
});

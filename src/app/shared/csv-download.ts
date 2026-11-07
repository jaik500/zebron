/**
 * CSV downloads built in the browser from data a page already has: no
 * extra reads, no server work. Used by Team progress, Test Center learner
 * results, dashboard widgets and live session attendance.
 *
 * Every cell is quoted, and a cell starting with = + - or @ gets a leading
 * apostrophe so spreadsheet apps never run it as a formula. The file starts
 * with a byte-order mark so Excel opens accents correctly.
 */

export type CsvCell = string | number | boolean | Date | null | undefined;

export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value =
            cell === null || cell === undefined
              ? ''
              : cell instanceof Date
                ? cell.toISOString().slice(0, 10)
                : String(cell);
          const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\r\n');
}

/** Save rows as `<name>-<YYYY-MM-DD>.csv`. Does nothing during server rendering. */
export function downloadCsv(name: string, rows: readonly (readonly CsvCell[])[]): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileSlug(name)}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** A safe file name from a title: 'Courses completed per week' → 'courses-completed-per-week'. */
export function fileSlug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export'
  );
}

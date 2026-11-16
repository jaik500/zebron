import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

import { TrainingGroup, TrainingGroupCourse, TrainingGroupMember, TrainingGroupSummary } from './training-group.service';

const MARGIN = 54;
const BRAND: [number, number, number] = [0, 121, 121];
const DARK: [number, number, number] = [3, 45, 66];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [229, 231, 235];
const COURSES_PER_TABLE = 7;

/** Everything the cohort report shows; the page passes what it already has. */
export interface TrainingGroupReport {
  organizationName: string;
  group: TrainingGroup;
  statusLabel: string;
  locked: boolean;
  archived: boolean;
  deliveryLabel: string;
  leadNames: string;
  instructorNames: string;
  courses: TrainingGroupCourse[];
  members: TrainingGroupMember[];
  summary: TrainingGroupSummary | null;
}

/**
 * The cohort report (Training Groups → group → Download PDF): details,
 * courses, members, and each member's progress in each group course, from
 * the completion summary. Same look as the contract PDF.
 */
@Injectable({ providedIn: 'root' })
export class TrainingGroupPdfService {
  download(report: TrainingGroupReport): void {
    const { group, summary } = report;
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    let width = pdf.internal.pageSize.getWidth();
    let height = pdf.internal.pageSize.getHeight();
    let contentWidth = width - MARGIN * 2;
    let y = MARGIN;

    const newPage = (orientation: 'portrait' | 'landscape' = 'portrait'): void => {
      pdf.addPage('letter', orientation);
      width = pdf.internal.pageSize.getWidth();
      height = pdf.internal.pageSize.getHeight();
      contentWidth = width - MARGIN * 2;
      y = MARGIN;
    };

    const ensureSpace = (needed: number): boolean => {
      if (y + needed > height - MARGIN) {
        newPage(width > height ? 'landscape' : 'portrait');
        return true;
      }
      return false;
    };

    const heading = (text: string, size = 13): void => {
      if (y > MARGIN) {
        y += size >= 13 ? 16 : 10;
      }
      ensureSpace(size + 30);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(size);
      pdf.setTextColor(...DARK);
      pdf.text(text, MARGIN, y);
      y += size + 10;
    };

    const paragraph = (text: string, size = 10, color: [number, number, number] = TEXT): void => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      const lineHeight = size * 1.45;
      for (const line of pdf.splitTextToSize(text, contentWidth) as string[]) {
        ensureSpace(lineHeight);
        pdf.text(line, MARGIN, y);
        y += lineHeight;
      }
      y += 6;
    };

    const row = (label: string, value: string): void => {
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(value || '—', contentWidth - 150) as string[];
      ensureSpace(lines.length * 14 + 4);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...MUTED);
      pdf.text(label, MARGIN, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...TEXT);
      lines.forEach((line, index) => pdf.text(line, MARGIN + 150, y + index * 14));
      y += lines.length * 14 + 4;
    };

    /** A table with a shaded header row, repeated on each new page. */
    const table = (columns: { label: string; width: number }[], rows: string[][], size = 9): void => {
      const drawHeader = (): void => {
        pdf.setFillColor(240, 247, 247);
        pdf.rect(MARGIN, y - 12, contentWidth, 18, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(size);
        pdf.setTextColor(...DARK);
        let x = MARGIN + 6;
        for (const column of columns) {
          pdf.text(fit(pdf, column.label, column.width - 8), x, y);
          x += column.width;
        }
        y += 18;
      };

      y += 4;
      ensureSpace(42);
      drawHeader();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      for (const cells of rows) {
        if (ensureSpace(18)) {
          drawHeader();
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(size);
        }
        pdf.setTextColor(...TEXT);
        let x = MARGIN + 6;
        cells.forEach((cell, index) => {
          pdf.text(fit(pdf, cell, columns[index].width - 8), x, y);
          x += columns[index].width;
        });
        pdf.setDrawColor(...LINE);
        pdf.line(MARGIN, y + 6, MARGIN + contentWidth, y + 6);
        y += 18;
      }
      y += 8;
    };

    // ---------------- Header band ----------------
    pdf.setFillColor(...DARK);
    pdf.rect(0, 0, width, 86, 'F');
    pdf.setFillColor(...BRAND);
    pdf.rect(0, 86, width, 4, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(fit(pdf, group.name, contentWidth), MARGIN, 46);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Cohort report  ·  ${report.organizationName}`, MARGIN, 66);
    y = 112;

    // ---------------- Details ----------------
    heading('Group details');
    row('Type', 'Cohort');
    row('Program', group.programName);
    row('Status', report.statusLabel + (report.archived ? ' (archived)' : report.locked ? ' (locked)' : group.reopened ? ' (reopened)' : ''));
    row('Dates', `${date(group.startDate)} – ${date(group.endDate)}`);
    row('Delivery', report.deliveryLabel + (group.location ? ` · ${group.location}` : ''));
    row('Members', `${group.memberCount}${group.capacity ? ` of ${group.capacity} places` : ''}`);
    row('Leads', report.leadNames);
    row('Instructors', report.instructorNames);
    if (group.description) {
      row('Description', group.description);
    }

    // ---------------- Completion ----------------
    heading('Completion');
    if (summary) {
      paragraph(
        `${summary.finishedAll} of ${summary.memberCount} member(s) finished every group course. ` +
          `Progress as of ${dateTime(summary.generatedAt)}.` +
          (summary.truncated ? ' Only the first 2,000 members are included.' : ''),
      );
    } else {
      paragraph('No completion summary yet.', 10, MUTED);
    }

    // ---------------- Courses ----------------
    heading('Courses');
    if (!report.courses.length) {
      paragraph('No courses were assigned to this group.', 10, MUTED);
    } else {
      const counts = new Map((summary?.courses ?? []).map((course) => [course.key, course]));
      table(
        [
          { label: '#', width: 26 },
          { label: 'Course', width: 200 },
          { label: 'Due', width: 76 },
          { label: 'Required', width: 56 },
          { label: 'Done', width: 46 },
          { label: 'In progress', width: 62 },
          { label: 'Not started', width: contentWidth - 466 },
        ],
        report.courses.map((course, index) => {
          const count = counts.get(course.key);
          return [
            `C${index + 1}`,
            courseLabel(course),
            date(course.dueAt),
            course.required ? 'Yes' : 'No',
            count ? String(count.done) : '—',
            count ? String(count.inProgress) : '—',
            count ? String(count.notStarted) : '—',
          ];
        }),
      );
      const notes = report.courses.map((course, index) => ({ index, note: course.note })).filter((item) => item.note);
      for (const item of notes) {
        paragraph(`C${item.index + 1} note to learners: ${item.note}`, 9, MUTED);
      }
    }

    // ---------------- Members ----------------
    heading('Members');
    if (!report.members.length) {
      paragraph('No members.', 10, MUTED);
    } else {
      const progress = new Map((summary?.members ?? []).map((member) => [member.userId, member]));
      const keys = report.courses.map((course) => course.key);
      table(
        [
          { label: 'Name', width: 150 },
          { label: 'Email', width: 190 },
          { label: 'Added', width: 80 },
          { label: 'Courses done', width: contentWidth - 420 },
        ],
        report.members.map((member) => {
          const line = progress.get(member.userId);
          const done = line ? keys.filter((key) => line.status[key] === 'completed').length : null;
          return [
            member.name,
            member.email ?? '',
            date(member.enrolledAt),
            !keys.length ? '—' : done === null ? 'Not in summary' : `${done} of ${keys.length}${line?.finishedAll ? '  (all)' : ''}`,
          ];
        }),
      );
    }

    // ---------------- Progress by member and course (landscape) ----------------
    if (summary && report.courses.length && report.members.length) {
      const progress = new Map(summary.members.map((member) => [member.userId, member]));
      for (let start = 0; start < report.courses.length; start += COURSES_PER_TABLE) {
        const slice = report.courses.slice(start, start + COURSES_PER_TABLE);
        newPage('landscape');
        heading(
          report.courses.length > COURSES_PER_TABLE ?
            `Progress by member (C${start + 1}–C${start + slice.length})` :
            'Progress by member',
        );
        paragraph('Done shows the completion date. Course numbers match the Courses table.', 9, MUTED);
        const nameWidth = 170;
        const cell = (contentWidth - nameWidth) / slice.length;
        table(
          [{ label: 'Member', width: nameWidth }, ...slice.map((course, index) => ({ label: `C${start + index + 1} ${course.courseTitle}`, width: cell }))],
          report.members.map((member) => {
            const line = progress.get(member.userId);
            return [
              member.name,
              ...slice.map((course) => {
                const status = line?.status[course.key];
                if (status === 'completed') {
                  const when = line?.completedAt[course.key];
                  return when ? `Done ${shortDate(new Date(when))}` : 'Done';
                }
                return status === 'in_progress' ? 'In progress' : line ? 'Not started' : '—';
              }),
            ];
          }),
          8,
        );
      }
    }

    // ---------------- Footer on every page ----------------
    const pages = pdf.getNumberOfPages();
    const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    for (let page = 1; page <= pages; page++) {
      pdf.setPage(page);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text(fit(pdf, `${report.organizationName} · ${group.name} · Generated ${generated}`, pageWidth - MARGIN * 2 - 80), MARGIN, pageHeight - 28);
      pdf.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 28, { align: 'right' });
    }

    const safeName = group.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'training-group';
    pdf.save(`cohort-report-${safeName}.pdf`);
  }
}

/** Cut text to a width, ending with … when it doesn't fit. */
function fit(pdf: jsPDF, text: string, maxWidth: number): string {
  if (pdf.getTextWidth(text) <= maxWidth) {
    return text;
  }
  let cut = text;
  while (cut.length > 1 && pdf.getTextWidth(`${cut}…`) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

function courseLabel(course: TrainingGroupCourse): string {
  return course.lessonTitle ? `${course.courseTitle} · ${course.lessonTitle}` : course.courseTitle;
}

function date(value: Date | null): string {
  return value ? value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

function shortDate(value: Date): string {
  return value.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function dateTime(value: Date | null): string {
  return value ? value.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'an unknown time';
}

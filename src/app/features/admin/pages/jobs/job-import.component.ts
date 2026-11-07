import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

import { MatIconModule } from '@angular/material/icon';

import {
  EmploymentType,
  Job,
  JobStatus,
  WorkArrangement,
  jobExpiresAt,
} from '../../../../core/models/job.model';
import { AuthService } from '../../../../core/services/auth.service';
import { Organization } from '../../../../core/models/organization.model';
import { downloadCsv } from '../../../../shared/csv-download';
import { JobStore } from '../../../jobs/stores/job.store';
import { OrganizationContextStore } from '../../../organizations/stores/organization-context.store';

/** Columns of the import file, in the template's order. */
const COLUMNS = [
  'title',
  'employer',
  'description',
  'employmentType',
  'workArrangement',
  'category',
  'city',
  'state',
  'applicationUrl',
  'applicationDeadline',
  'datePosted',
  'sourceSite',
  'payMin',
  'payMax',
  'payPeriod',
  'skills',
  'tags',
  'status',
] as const;

type Column = (typeof COLUMNS)[number];

const EMPLOYMENT_TYPES: EmploymentType[] = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
const ARRANGEMENTS: WorkArrangement[] = ['on-site', 'hybrid', 'remote'];
const MAX_ROWS = 200;

interface ImportRow {
  line: number;
  values: Record<Column, string>;
  errors: string[];
  /** Same application link as a job on the board or an earlier row. */
  duplicate: string;
  include: boolean;
  result: '' | 'imported' | 'failed';
}

/**
 * Admin → Jobs → Import CSV: many listings at once.
 *
 * Reads the file in the browser, checks every row (required fields, allowed
 * values, dates, links), flags links already on the board, and creates the
 * jobs one by one. The employer is found or created like in the job form.
 * Imported jobs get the same posted date and expiry rules as the form.
 */
@Component({
  selector: 'app-job-import',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <div>
          <h2 class="text-base font-bold text-[#032D42]">Import jobs from a CSV file</h2>
          <p class="text-xs text-gray-500">Up to {{ maxRows }} rows. Download the template to see the columns.</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" (click)="downloadTemplate()" class="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:border-[#007979] hover:text-[#007979]">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">download</mat-icon>
            Template
          </button>
          <button type="button" (click)="closed.emit()" class="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>

      <div class="space-y-4 px-5 py-4">
        <label class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-600 hover:border-[#007979]">
          <mat-icon class="text-gray-400" aria-hidden="true">upload_file</mat-icon>
          <span><strong class="text-[#007979]">Choose a CSV file</strong> ({{ fileName() || 'none chosen' }})</span>
          <span class="text-xs text-gray-500">Saved from Excel or Google Sheets as "CSV UTF-8".</span>
          <input type="file" accept=".csv,text/csv" class="sr-only" (change)="onFile($event)" />
        </label>

        @if (fileError()) {
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ fileError() }}</p>
        }

        @if (rows().length) {
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span><strong>{{ rows().length }}</strong> rows</span>
            <span class="text-green-700"><strong>{{ readyCount() }}</strong> ready</span>
            @if (errorCount()) {
              <span class="text-red-700"><strong>{{ errorCount() }}</strong> with problems (skipped)</span>
            }
            @if (duplicateCount()) {
              <span class="text-amber-700"><strong>{{ duplicateCount() }}</strong> already on the board (unticked)</span>
            }
          </div>

          <div class="max-h-[420px] overflow-auto rounded-lg border border-gray-200">
            <table class="w-full text-left text-sm">
              <thead class="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th class="px-3 py-2"><span class="sr-only">Import</span></th>
                  <th class="px-3 py-2">Row</th>
                  <th class="px-3 py-2">Job</th>
                  <th class="px-3 py-2">Status</th>
                  <th class="px-3 py-2">Check</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (row of rows(); track row.line) {
                  <tr [class.bg-red-50]="row.errors.length" [class.bg-amber-50]="!row.errors.length && row.duplicate">
                    <td class="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        [checked]="row.include"
                        [disabled]="row.errors.length > 0 || importing() || row.result === 'imported'"
                        (change)="toggle(row)"
                        [attr.aria-label]="'Import row ' + row.line"
                      />
                    </td>
                    <td class="px-3 py-2 align-top text-gray-500">{{ row.line }}</td>
                    <td class="px-3 py-2 align-top">
                      <span class="block font-medium text-[#032D42]">{{ row.values.title || '(no title)' }}</span>
                      <span class="block text-xs text-gray-500">{{ row.values.employer }}{{ row.values.city ? ' · ' + row.values.city : '' }}{{ row.values.state ? ', ' + row.values.state : '' }}</span>
                    </td>
                    <td class="px-3 py-2 align-top text-xs">{{ row.values.status || 'draft' }}</td>
                    <td class="px-3 py-2 align-top text-xs">
                      @if (row.result === 'imported') {
                        <span class="font-semibold text-green-700">Imported</span>
                      } @else if (row.result === 'failed') {
                        <span class="font-semibold text-red-700">Failed, try again</span>
                      } @else if (row.errors.length) {
                        <span class="text-red-700">{{ row.errors.join('; ') }}</span>
                      } @else if (row.duplicate) {
                        <span class="text-amber-800">{{ row.duplicate }}</span>
                      } @else {
                        <span class="text-green-700">Ready</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3">
            @if (importing()) {
              <span class="text-sm text-gray-600" aria-live="polite">Importing {{ done() }} of {{ selectedCount() }}…</span>
            } @else if (summary()) {
              <span class="text-sm text-gray-700" aria-live="polite">{{ summary() }}</span>
            }
            <button
              type="button"
              (click)="importSelected()"
              [disabled]="importing() || selectedCount() === 0"
              class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
            >
              Import {{ selectedCount() }} {{ selectedCount() === 1 ? 'job' : 'jobs' }}
            </button>
          </div>
        }
      </div>
    </section>
  `,
})
export class JobImportComponent {
  private readonly jobStore = inject(JobStore);
  private readonly organizations = inject(OrganizationContextStore);
  private readonly auth = inject(AuthService);

  /** Jobs already on the board, to flag duplicate links. */
  readonly existingJobs = input<Job[]>([]);

  /** After at least one job was imported. */
  readonly imported = output<void>();
  readonly closed = output<void>();

  protected readonly maxRows = MAX_ROWS;
  protected readonly fileName = signal('');
  protected readonly fileError = signal('');
  protected readonly rows = signal<ImportRow[]>([]);
  protected readonly importing = signal(false);
  protected readonly done = signal(0);
  protected readonly summary = signal('');

  protected readonly readyCount = computed(() => this.rows().filter((row) => !row.errors.length && !row.duplicate).length);
  protected readonly errorCount = computed(() => this.rows().filter((row) => row.errors.length).length);
  protected readonly duplicateCount = computed(() => this.rows().filter((row) => !row.errors.length && row.duplicate).length);
  protected readonly selectedCount = computed(
    () => this.rows().filter((row) => row.include && !row.errors.length && row.result !== 'imported').length,
  );

  protected downloadTemplate(): void {
    downloadCsv('zebron-jobs-import-template', [
      [...COLUMNS],
      [
        'Help Desk Analyst',
        'Acme Health',
        'Support staff and devices for a 300-person hospital. Tickets, Microsoft 365, onboarding.',
        'full-time',
        'on-site',
        'Technology & IT',
        'Silver Spring',
        'MD',
        'https://careers.example.com/jobs/1234',
        '2026-12-15',
        '2026-11-07',
        'Indeed',
        '52000',
        '60000',
        'year',
        'Help desk; Microsoft 365; Customer service',
        'entry-level',
        'draft',
      ],
    ]);
  }

  protected async onFile(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    fileInput.value = '';
    this.fileError.set('');
    this.summary.set('');
    this.rows.set([]);

    if (!file) {
      return;
    }
    this.fileName.set(file.name);

    if (file.size > 2 * 1024 * 1024) {
      this.fileError.set('The file is larger than 2 MB. Split it into smaller files.');
      return;
    }

    const records = parseCsv(await file.text());
    if (records.length < 2) {
      this.fileError.set('The file has no job rows. The first row must be the column names from the template.');
      return;
    }

    const header = records[0].map((cell) => cell.trim());
    const missing = ['title', 'employer', 'description', 'applicationUrl'].filter((column) => !header.includes(column));
    if (missing.length) {
      this.fileError.set(`Missing columns: ${missing.join(', ')}. Use the template's column names.`);
      return;
    }

    const body = records.slice(1).filter((record) => record.some((cell) => cell.trim() !== ''));
    if (body.length > MAX_ROWS) {
      this.fileError.set(`The file has ${body.length} rows; the limit is ${MAX_ROWS}. Split it into smaller files.`);
      return;
    }

    const existing = new Map(
      this.existingJobs()
        .filter((job) => job.applicationUrl)
        .map((job) => [normalizeUrl(job.applicationUrl), job]),
    );
    const seen = new Map<string, number>();

    this.rows.set(
      body.map((record, index) => {
        const values = Object.fromEntries(
          COLUMNS.map((column) => {
            const position = header.indexOf(column);
            return [column, position >= 0 ? (record[position] ?? '').trim() : ''];
          }),
        ) as Record<Column, string>;

        const line = index + 2;
        const errors = validate(values);
        const url = normalizeUrl(values.applicationUrl);
        const onBoard = url ? existing.get(url) : undefined;
        const earlier = url ? seen.get(url) : undefined;
        const duplicate = onBoard
          ? `Already on the board: ${onBoard.title} (${onBoard.status})`
          : earlier
            ? `Same link as row ${earlier}`
            : '';
        if (url && !earlier) {
          seen.set(url, line);
        }

        return { line, values, errors, duplicate, include: !errors.length && !duplicate, result: '' as const };
      }),
    );
  }

  protected toggle(row: ImportRow): void {
    this.rows.update((rows) => rows.map((item) => (item === row ? { ...item, include: !item.include } : item)));
  }

  protected async importSelected(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) {
      this.summary.set('Sign in again to import.');
      return;
    }

    const selected = this.rows().filter((row) => row.include && !row.errors.length && row.result !== 'imported');
    this.importing.set(true);
    this.done.set(0);
    this.summary.set('');

    const employers = new Map<string, { id: string; name: string }>();
    let imported = 0;
    let failed = 0;

    for (const row of selected) {
      try {
        const values = row.values;
        const employerKey = values.employer.toLowerCase();
        let employer = employers.get(employerKey);
        if (!employer) {
          const organization = await this.organizations.findOrCreateOrganization({
            name: values.employer,
            companyNumber: '',
            slug: values.employer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            verified: false,
            active: true,
            website: '',
            phone: '',
            email: '',
          } as Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>);
          employer = { id: organization.id, name: organization.name };
          employers.set(employerKey, employer);
        }

        await this.jobStore.createJob(toJob(values, employer, uid));
        imported++;
        this.setResult(row, 'imported');
      } catch (error) {
        console.error(`Job import failed for row ${row.line}:`, error);
        failed++;
        this.setResult(row, 'failed');
      }
      this.done.update((value) => value + 1);
    }

    this.importing.set(false);
    this.summary.set(
      failed
        ? `Imported ${imported}; ${failed} failed (marked in the list, try again).`
        : `Imported ${imported} ${imported === 1 ? 'job' : 'jobs'}.`,
    );
    if (imported) {
      this.imported.emit();
    }
  }

  private setResult(row: ImportRow, result: ImportRow['result']): void {
    this.rows.update((rows) =>
      rows.map((item) => (item.line === row.line ? { ...item, result, include: result !== 'imported' && item.include } : item)),
    );
  }
}

// ============================================================
// Helpers
// ============================================================

/** RFC 4180 CSV: quoted cells, doubled quotes, commas and line breaks inside quotes, BOM. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, '');
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index++) {
    const character = source[index];

    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      record.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') {
        index++;
      }
      record.push(cell);
      records.push(record);
      record = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (cell !== '' || record.length) {
    record.push(cell);
    records.push(record);
  }

  return records;
}

function normalizeUrl(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '').toLowerCase();
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

/** Splits a list cell on semicolons (or commas when there are none). */
function list(value: string): string[] {
  const separator = value.includes(';') ? ';' : ',';
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function validate(values: Record<Column, string>): string[] {
  const errors: string[] = [];

  if (!values.title) errors.push('title is required');
  if (!values.employer) errors.push('employer is required');
  if (!values.description) errors.push('description is required');
  if (!/^https?:\/\/.+/i.test(values.applicationUrl)) errors.push('applicationUrl must start with http:// or https://');

  if (values.employmentType && !EMPLOYMENT_TYPES.includes(values.employmentType.toLowerCase() as EmploymentType)) {
    errors.push(`employmentType must be one of ${EMPLOYMENT_TYPES.join(', ')}`);
  }
  if (values.workArrangement && !ARRANGEMENTS.includes(values.workArrangement.toLowerCase() as WorkArrangement)) {
    errors.push(`workArrangement must be one of ${ARRANGEMENTS.join(', ')}`);
  }
  if (values.applicationDeadline && !isDate(values.applicationDeadline)) errors.push('applicationDeadline must be YYYY-MM-DD');
  if (values.datePosted && !isDate(values.datePosted)) errors.push('datePosted must be YYYY-MM-DD');
  if (values.payMin && Number.isNaN(Number(values.payMin))) errors.push('payMin must be a number');
  if (values.payMax && Number.isNaN(Number(values.payMax))) errors.push('payMax must be a number');
  if (values.payPeriod && !['hour', 'year'].includes(values.payPeriod.toLowerCase())) errors.push('payPeriod must be hour or year');
  if (values.status && !['draft', 'active'].includes(values.status.toLowerCase())) errors.push('status must be draft or active');

  return errors;
}

function toJob(
  values: Record<Column, string>,
  employer: { id: string; name: string },
  uid: string,
): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  const applicationDeadline = values.applicationDeadline ? Timestamp.fromDate(new Date(`${values.applicationDeadline}T00:00:00`)) : null;
  const postedAt = values.datePosted ? Timestamp.fromDate(new Date(`${values.datePosted}T00:00:00`)) : Timestamp.now();
  const payMin = values.payMin ? Number(values.payMin) : undefined;
  const payMax = values.payMax ? Number(values.payMax) : undefined;

  return {
    title: values.title,
    organizationId: employer.id,
    organizationName: employer.name,
    description: values.description,
    employmentType: (values.employmentType.toLowerCase() || 'full-time') as EmploymentType,
    workArrangement: (values.workArrangement.toLowerCase() || 'on-site') as WorkArrangement,
    ...(values.category ? { categoryName: values.category } : {}),
    location: { city: values.city, state: values.state.toUpperCase(), country: 'United States' },
    ...(payMin !== undefined || payMax !== undefined
      ? {
          compensation: {
            ...(payMin !== undefined ? { min: payMin } : {}),
            ...(payMax !== undefined ? { max: payMax } : {}),
            currency: 'USD',
            period: (values.payPeriod.toLowerCase() || 'year') as 'hour' | 'year',
          },
        }
      : {}),
    skills: list(values.skills),
    tags: list(values.tags),
    applicationUrl: values.applicationUrl,
    applicationDeadline,
    sourceName: values.sourceSite,
    postedAt,
    expiresAt: jobExpiresAt({ applicationDeadline, postedAt }),
    closedReason: null,
    status: (values.status.toLowerCase() || 'draft') as JobStatus,
    featured: false,
    createdBy: uid,
  };
}

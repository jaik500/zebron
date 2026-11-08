import { Timestamp } from 'firebase/firestore';

/**
 * Bootcamp programs. A bootcamp is a resource in the Bootcamps category
 * (resources/{resourceId}: name, about, website, contact, cost). Its programs,
 * start dates and Zebron's take are kept beside it:
 *
 *   bootcamps/{resourceId}                        programs[] (admins write, anyone reads)
 *   bootcampStats/{resourceId}__{programId}       views, applyClicks (anyone adds 1)
 *
 * Page views use the program id "_page".
 */

export type BootcampField =
  | 'software'
  | 'data'
  | 'cybersecurity'
  | 'cloud'
  | 'it-support'
  | 'ux'
  | 'product'
  | 'servicenow'
  | 'salesforce'
  | 'ai'
  | 'other';

export type BootcampFormat = 'online' | 'in-person' | 'hybrid';

export type BootcampSchedule = 'full-time' | 'part-time' | 'evenings' | 'weekends' | 'self-paced';

export type BootcampFinancing =
  | 'free'
  | 'grant'
  | 'wioa'
  | 'scholarship'
  | 'payment-plan'
  | 'deferred'
  | 'isa'
  | 'gi-bill'
  | 'employer';

export interface BootcampStart {
  /** First day of class, YYYY-MM-DD. */
  date: string;
  /** Last day to apply, YYYY-MM-DD (optional). */
  deadline?: string;
}

export interface BootcampProgram {
  /** Short, stable id within the bootcamp (slug of the title). */
  id: string;
  title: string;
  field: BootcampField;
  summary: string;
  format: BootcampFormat;
  schedule: BootcampSchedule;
  durationWeeks: number | null;
  hoursPerWeek: number | null;
  /** Tuition in US dollars; 0 when free. Null when not published. */
  tuition: number | null;
  financing: BootcampFinancing[];
  costNote: string;
  prerequisites: string;
  /** False when no college degree is needed. */
  requiresDegree: boolean;
  /** English support for non-native speakers. */
  englishSupport: boolean;
  /** Work authorization or residency requirements, in the bootcamp's words. */
  workAuthorization: string;
  certifications: string[];
  skills: string[];
  /** Graduates hired within 6 months, in percent, with the source. */
  placementRate: number | null;
  outcomesSource: string;
  applyUrl: string;
  starts: BootcampStart[];
  /** "Recommended by Zebron" badge and note. */
  recommended: boolean;
  zebronTake: string;
}

/** bootcamps/{resourceId}: the programs of one bootcamp resource. */
export interface BootcampDetails {
  resourceId: string;
  programs: BootcampProgram[];
  updatedBy?: string;
  updatedAt?: Timestamp | null;
}

// ============================================================
// Labels
// ============================================================

export const BOOTCAMP_FIELDS: { value: BootcampField; label: string }[] = [
  { value: 'software', label: 'Software development' },
  { value: 'data', label: 'Data and analytics' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'cloud', label: 'Cloud and DevOps' },
  { value: 'it-support', label: 'IT support' },
  { value: 'ux', label: 'UX and design' },
  { value: 'product', label: 'Product and project management' },
  { value: 'servicenow', label: 'ServiceNow' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'ai', label: 'AI and machine learning' },
  { value: 'other', label: 'Other' },
];

export const BOOTCAMP_FORMATS: { value: BootcampFormat; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In person' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const BOOTCAMP_SCHEDULES: { value: BootcampSchedule; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'self-paced', label: 'Self-paced' },
];

export const BOOTCAMP_FINANCING: { value: BootcampFinancing; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'grant', label: 'Grants' },
  { value: 'wioa', label: 'WIOA funding' },
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'payment-plan', label: 'Payment plan' },
  { value: 'deferred', label: 'Pay after you are hired' },
  { value: 'isa', label: 'Income share agreement' },
  { value: 'gi-bill', label: 'GI Bill' },
  { value: 'employer', label: 'Employer sponsored' },
];

const labelOf = <T extends string>(list: { value: T; label: string }[], value: T): string =>
  list.find((item) => item.value === value)?.label ?? value;

export const fieldLabel = (value: BootcampField) => labelOf(BOOTCAMP_FIELDS, value);
export const formatLabel = (value: BootcampFormat) => labelOf(BOOTCAMP_FORMATS, value);
export const scheduleLabel = (value: BootcampSchedule) => labelOf(BOOTCAMP_SCHEDULES, value);
export const financingLabel = (value: BootcampFinancing) => labelOf(BOOTCAMP_FINANCING, value);

// ============================================================
// Helpers
// ============================================================

/** Today as YYYY-MM-DD in the visitor's time zone. */
export function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Start dates still open: the deadline (or, without one, the start date) has not passed. Soonest first. */
export function openStarts(program: BootcampProgram, today = todayKey()): BootcampStart[] {
  return [...(program.starts ?? [])]
    .filter((start) => (start.deadline || start.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** True when the program costs nothing to the learner. */
export function isFree(program: BootcampProgram): boolean {
  return program.tuition === 0 || program.financing.includes('free');
}

/** "Free", "$12,500", or "Contact for price". */
export function costLabel(program: BootcampProgram): string {
  if (isFree(program)) {
    return 'Free';
  }
  if (program.tuition === null || program.tuition === undefined) {
    return 'Contact for price';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(program.tuition);
}

/** "16 weeks · 15 h/week". */
export function lengthLabel(program: BootcampProgram): string {
  return [
    program.durationWeeks ? `${program.durationWeeks} ${program.durationWeeks === 1 ? 'week' : 'weeks'}` : '',
    program.hoursPerWeek ? `${program.hoursPerWeek} h/week` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** "Mar 3, 2027" from YYYY-MM-DD, without time-zone shifts. */
export function dateLabel(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Lower-case slug for ids: "Cybersecurity Evening" → "cybersecurity-evening". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** A program as stored, with every field present (older or partial records). */
export function normalizeProgram(raw: Partial<BootcampProgram>): BootcampProgram {
  return {
    id: raw.id ?? slugify(raw.title ?? 'program'),
    title: raw.title ?? '',
    field: raw.field ?? 'other',
    summary: raw.summary ?? '',
    format: raw.format ?? 'online',
    schedule: raw.schedule ?? 'part-time',
    durationWeeks: raw.durationWeeks ?? null,
    hoursPerWeek: raw.hoursPerWeek ?? null,
    tuition: raw.tuition ?? null,
    financing: raw.financing ?? [],
    costNote: raw.costNote ?? '',
    prerequisites: raw.prerequisites ?? '',
    requiresDegree: raw.requiresDegree ?? false,
    englishSupport: raw.englishSupport ?? false,
    workAuthorization: raw.workAuthorization ?? '',
    certifications: raw.certifications ?? [],
    skills: raw.skills ?? [],
    placementRate: raw.placementRate ?? null,
    outcomesSource: raw.outcomesSource ?? '',
    applyUrl: raw.applyUrl ?? '',
    starts: raw.starts ?? [],
    recommended: raw.recommended ?? false,
    zebronTake: raw.zebronTake ?? '',
  };
}

// ============================================================
// Summaries for lists (resource cards, "More in Bootcamps")
// ============================================================

/** What a bootcamp teaches, in short: shown on cards and used by the field filter. */
export interface BootcampSummary {
  /** Fields of its programs, recommended programs first, no repeats. */
  fields: BootcampField[];
  programCount: number;
  /** The soonest open start date of any program. */
  nextStart: string | null;
  recommended: boolean;
}

export function bootcampSummary(programs: BootcampProgram[], today = todayKey()): BootcampSummary | null {
  if (!programs.length) {
    return null;
  }
  const ordered = [...programs].sort((a, b) => Number(b.recommended) - Number(a.recommended));
  const nextStarts = programs.flatMap((program) => openStarts(program, today).map((start) => start.date)).sort();
  return {
    fields: [...new Set(ordered.map((program) => program.field))],
    programCount: programs.length,
    nextStart: nextStarts[0] ?? null,
    recommended: programs.some((program) => program.recommended),
  };
}

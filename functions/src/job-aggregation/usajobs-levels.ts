/**
 * Experience levels for USAJOBS listings.
 *
 * Zebron imports entry, mid and senior level jobs, and leaves out executive
 * and other very senior positions. A listing's level comes from its pay plan
 * and grade where USAJOBS gives them (JobGrade and UserArea.Details.LowGrade /
 * HighGrade), otherwise from its title.
 *
 * General Schedule grades (GS and its equivalents):
 *   entry  GS-1 to GS-7   (trainees, assistants, technicians, recent graduates)
 *   mid    GS-8 to GS-11
 *   senior GS-12 to GS-14 (experienced specialists, team leads)
 *   left out: GS-15 and above (division chiefs and similar), and the executive
 *   pay plans below, whatever the grade.
 *
 * Pay plans: https://data.usajobs.gov/api/codelist/payplans
 */
export type ExperienceLevel = 'entry' | 'mid' | 'senior';

/** A listing's level, or 'executive' when Zebron leaves it out. */
export type LevelDecision = ExperienceLevel | 'executive';

/**
 * Executive and very senior pay plans: Senior Executive Service (ES),
 * Executive Schedule (EX), Senior Level (SL), Scientific and Professional (ST),
 * intelligence and other agency executive services, and Administrative Law Judges (AL).
 */
export const EXECUTIVE_PAY_PLANS: readonly string[] = ['ES', 'EX', 'SL', 'ST', 'SES', 'IE', 'EF', 'EV', 'AL', 'CA', 'FE', 'SR'];

/** Pay plans graded like the General Schedule (1 to 15). */
export const GENERAL_SCHEDULE_PLANS: readonly string[] = ['GS', 'GG', 'GL', 'GM'];

/** The highest General Schedule grade Zebron imports. */
export const HIGHEST_GRADE = 14;

/**
 * Titles of executive and top leadership roles. Kept narrow on purpose:
 * "Systems Administrator", "Executive Assistant" and "Director of Nursing
 * Education Assistant"-style support titles are not caught.
 */
const EXECUTIVE_TITLE =
  /(?:^|[^a-z])(chief(?! (nurse|nursing) (assistant|technician))|director|deputy director|associate director|assistant director|executive(?! (assistant|secretary|officer assistant))|commissioner|assistant secretary|under secretary|deputy secretary|chief of staff|superintendent|senior executive|(chief|principal) (information|technology|medical|nursing|data|security) officer)(?![a-z])/i;

const SENIOR_TITLE = /(?:^|[^a-z])(senior|sr\.?|lead|supervisory|supervisor|manager|principal|expert|staff)(?![a-z])/i;
const ENTRY_TITLE =
  /(?:^|[^a-z])(trainee|intern|internship|student|apprentice|recent graduate|pathways|entry[- ]level|junior|jr\.?|assistant|aid|aide|clerk|technician)(?![a-z])/i;

/** True for executive or top leadership titles. */
export function isExecutiveTitle(title: string): boolean {
  return EXECUTIVE_TITLE.test(title);
}

function grade(value: unknown): number | null {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function levelFromTitle(title: string): ExperienceLevel {
  if (SENIOR_TITLE.test(title)) return 'senior';
  if (ENTRY_TITLE.test(title)) return 'entry';
  return 'mid';
}

/**
 * Decide a listing's level.
 *
 * @param payPlans its JobGrade codes (for example ["GS"] or ["VN"])
 * @param lowGrade and highGrade its grade range, as USAJOBS sends them ("07", "11")
 * @param title its position title
 */
export function classifyLevel(input: {
  payPlans: readonly string[];
  lowGrade?: unknown;
  highGrade?: unknown;
  title: string;
}): LevelDecision {
  const plans = input.payPlans.map((plan) => plan.trim().toUpperCase()).filter(Boolean);
  const title = input.title ?? '';

  if (plans.some((plan) => EXECUTIVE_PAY_PLANS.includes(plan))) return 'executive';
  if (isExecutiveTitle(title)) return 'executive';

  const low = grade(input.lowGrade);
  const high = grade(input.highGrade);
  if (plans.some((plan) => GENERAL_SCHEDULE_PLANS.includes(plan)) && (low ?? high) !== null) {
    // A range like GS-12/15 is kept (it starts at senior); GS-15 only is left out.
    const start = low ?? high!;
    if (start > HIGHEST_GRADE) return 'executive';
    if (start <= 7) return 'entry';
    if (start <= 11) return 'mid';
    return 'senior';
  }

  // Other pay plans (VA nurses VN, physicians VM, wage grade WG, bands...): use the title.
  return levelFromTitle(title);
}

export function levelLabel(level: ExperienceLevel): string {
  return level === 'entry' ? 'Entry level' : level === 'mid' ? 'Mid level' : 'Senior level';
}

import type { BootcampField, BootcampProgram } from '../bootcamps/bootcamp.model';
import type { Course } from './course.model';

/**
 * What to do after finishing a course (course summary page):
 * the next course in its program, similar courses, and bootcamps that
 * teach the same skills (Zebron's own pages only).
 *
 * Plain functions, no Angular: unit-tested in tests/unit/next-steps.test.ts.
 */

/** Where the learner is with a course. */
export type CourseState = 'completed' | 'in_progress' | null;

/** Courses only need these fields here. */
export type CourseLike = Pick<
  Course,
  'id' | 'organizationId' | 'title' | 'topic' | 'program' | 'programOrder' | 'level' | 'skills'
>;

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

/** Common spellings of the same skill, so "Amazon Web Services" matches "AWS". */
const SKILL_ALIASES: Record<string, string> = {
  'amazon web services': 'aws',
  'microsoft azure': 'azure',
  'google cloud': 'gcp',
  'google cloud platform': 'gcp',
  'js': 'javascript',
  'ts': 'typescript',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'genai': 'generative ai',
  'gen ai': 'generative ai',
  'llm': 'large language models',
  'llms': 'large language models',
  'k8s': 'kubernetes',
  'ux': 'user experience',
  'ui': 'user interface',
  'ux design': 'user experience',
  'cyber security': 'cybersecurity',
  'infosec': 'information security',
  'pm': 'project management',
  'snow': 'servicenow',
  'service now': 'servicenow',
  'iam': 'identity and access management',
  'sql databases': 'sql',
  'python programming': 'python',
};

/** "  Amazon Web Services (AWS) " → "aws". */
export function normalizeSkill(skill: string): string {
  const cleaned = skill
    .toLowerCase()
    .replace(/\(([^)]*)\)/g, ' $1 ')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // "amazon web services aws" (from "Amazon Web Services (AWS)"): use the short form if it is known.
  const words = cleaned.split(' ');
  const last = words[words.length - 1];
  if (words.length > 1 && SKILL_ALIASES[words.slice(0, -1).join(' ')] === last) return last;
  return SKILL_ALIASES[cleaned] ?? cleaned;
}

function skillSet(skills: readonly string[]): Set<string> {
  return new Set(skills.map(normalizeSkill).filter(Boolean));
}

function shared(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const item of a) if (b.has(item)) count++;
  return count;
}

// ---------------------------------------------------------------------------
// Next in the program
// ---------------------------------------------------------------------------

export interface ProgramStep<T extends CourseLike = CourseLike> {
  program: string;
  /** The next course to take, or null when the program is finished. */
  next: T | null;
  /** 1-based position of `next` among the program's courses. */
  position: number;
  total: number;
  /** Courses in the program the learner has finished (including this one). */
  completed: number;
}

/**
 * The course after this one in its program (same provider), skipping
 * courses already finished. Null when the course isn't in a program.
 */
export function nextInProgram<T extends CourseLike>(
  current: CourseLike,
  catalog: readonly T[],
  stateOf: (course: CourseLike) => CourseState,
): ProgramStep<T> | null {
  const program = current.program.trim();
  if (!program) return null;

  const steps = catalog
    .filter(
      (course) =>
        course.program.trim().toLowerCase() === program.toLowerCase() &&
        (course.organizationId ?? null) === (current.organizationId ?? null),
    )
    .sort((a, b) => (a.programOrder ?? 1e6) - (b.programOrder ?? 1e6) || a.title.localeCompare(b.title));
  if (!steps.some((course) => course.id === current.id)) return null;

  const isDone = (course: CourseLike) => course.id === current.id || stateOf(course) === 'completed';
  const index = steps.findIndex((course) => course.id === current.id);
  // The first unfinished course after this one, else the first unfinished one before it.
  const next =
    steps.slice(index + 1).find((course) => !isDone(course)) ?? steps.slice(0, index).find((course) => !isDone(course)) ?? null;

  return {
    program,
    next,
    position: next ? steps.indexOf(next) + 1 : steps.length,
    total: steps.length,
    completed: steps.filter(isDone).length,
  };
}

// ---------------------------------------------------------------------------
// Similar courses
// ---------------------------------------------------------------------------

const LEVEL_RANK: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, all: 0 };

export interface ScoredCourse<T extends CourseLike = CourseLike> {
  course: T;
  score: number;
  /** Skills the course shares with the finished one (as written on the suggested course). */
  sharedSkills: string[];
  state: CourseState;
}

/**
 * Courses like the finished one: shared skills first, then the same topic,
 * then a sensible next level. Finished courses, the course itself and
 * `exclude` (for example the next course in the program) are left out.
 */
export function similarCourses<T extends CourseLike>(
  current: CourseLike,
  catalog: readonly T[],
  stateOf: (course: CourseLike) => CourseState,
  options: { limit?: number; exclude?: readonly CourseLike[] } = {},
): ScoredCourse<T>[] {
  const limit = options.limit ?? 4;
  const excluded = new Set((options.exclude ?? []).map((course) => `${course.organizationId ?? ''}/${course.id}`));
  const skills = skillSet(current.skills);
  const topic = current.topic.trim().toLowerCase();
  const program = current.program.trim().toLowerCase();
  const level = LEVEL_RANK[current.level] ?? 0;

  const scored: ScoredCourse<T>[] = [];
  for (const course of catalog) {
    if (course.id === current.id && (course.organizationId ?? null) === (current.organizationId ?? null)) continue;
    if (excluded.has(`${course.organizationId ?? ''}/${course.id}`)) continue;
    const state = stateOf(course);
    if (state === 'completed') continue;

    const sharedSkills = course.skills.filter((skill) => skills.has(normalizeSkill(skill)));
    const sameTopic = !!topic && course.topic.trim().toLowerCase() === topic;
    const sameProgram = !!program && course.program.trim().toLowerCase() === program;
    const otherLevel = LEVEL_RANK[course.level] ?? 0;

    let score = sharedSkills.length * 3 + (sameTopic ? 2 : 0) + (sameProgram ? 1 : 0);
    if (score === 0) continue;
    // Prefer the same level or one step up; going back down is less useful.
    if (level && otherLevel) {
      if (otherLevel === level + 1) score += 1;
      else if (otherLevel === level) score += 0.5;
      else if (otherLevel < level) score -= 0.5;
    }
    // A course already started is a good suggestion too: finish it.
    if (state === 'in_progress') score += 0.5;

    scored.push({ course, score, sharedSkills, state });
  }

  return scored.sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Bootcamps
// ---------------------------------------------------------------------------

/** Words in a course's title, topic, program or skills that point to a bootcamp field. */
const FIELD_KEYWORDS: [BootcampField, string][] = [
  ['cybersecurity', 'cyber|cybersecurity|security\\+|security|soc|siem|penetration testing|ethical hacking|incident response|grc'],
  ['cloud', 'cloud|aws|azure|gcp|devops|kubernetes|docker|terraform'],
  ['data', 'data|sql|analytics|tableau|power bi|excel|statistics|etl'],
  ['ai', 'artificial intelligence|machine learning|generative ai|large language models|prompt engineering|prompt|rag|embeddings|mlops|llmops'],
  ['servicenow', 'servicenow'],
  ['salesforce', 'salesforce'],
  ['ux', 'user experience|user interface|ui design|figma|design thinking'],
  ['product', 'agile|scrum|safe agile|scaled agile|project management|pmp|product management|kanban'],
  ['it-support', 'it support|help desk|comptia a\\+|networking|network\\+|troubleshooting'],
  ['software', 'javascript|typescript|angular|react|python|java|web development|software|programming|html|css|node'],
];

/** Whole words only: "java" never matches "javascript", "+" endings work. */
const FIELD_PATTERNS: [BootcampField, RegExp][] = FIELD_KEYWORDS.map(([field, words]) => [
  field,
  new RegExp(`(?<![a-z0-9])(?:${words})(?![a-z0-9])`),
]);

/** Bootcamp fields a course belongs to (from its title, topic, program and skills). */
export function courseFields(course: CourseLike): Set<BootcampField> {
  const text = [course.title, course.topic, course.program, ...course.skills.map(normalizeSkill)]
    .join(' ')
    .toLowerCase();
  const fields = new Set<BootcampField>();
  for (const [field, pattern] of FIELD_PATTERNS) if (pattern.test(text)) fields.add(field);
  return fields;
}

export interface BootcampMatch {
  resourceId: string;
  program: BootcampProgram;
  score: number;
  sharedSkills: string[];
  /** Next start date (YYYY-MM-DD) from today, or null. */
  nextStart: string | null;
}

/**
 * Bootcamp programs that teach what the course taught: shared skills and
 * certifications first, then the same field. At most one program per
 * bootcamp, so several providers are suggested.
 */
export function matchBootcamps(
  current: CourseLike,
  bootcamps: readonly { resourceId: string; programs: readonly BootcampProgram[] }[],
  options: { limit?: number; today?: string } = {},
): BootcampMatch[] {
  const limit = options.limit ?? 3;
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const skills = skillSet(current.skills);
  const fields = courseFields(current);

  const best = new Map<string, BootcampMatch>();
  for (const bootcamp of bootcamps) {
    for (const program of bootcamp.programs) {
      const sharedSkills = [...program.skills, ...program.certifications].filter((skill) => skills.has(normalizeSkill(skill)));
      const sameField = fields.has(program.field);
      if (!sharedSkills.length && !sameField) continue;

      const nextStart = program.starts.map((start) => start.date).filter((date) => date >= today).sort()[0] ?? null;
      const score = sharedSkills.length * 3 + (sameField ? 2 : 0) + (program.recommended ? 1 : 0) + (nextStart ? 0.5 : 0);

      const previous = best.get(bootcamp.resourceId);
      if (!previous || score > previous.score) {
        best.set(bootcamp.resourceId, { resourceId: bootcamp.resourceId, program, score, sharedSkills, nextStart });
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.program.title.localeCompare(b.program.title))
    .slice(0, limit);
}

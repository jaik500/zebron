import { Timestamp } from 'firebase/firestore';

/**
 * Career paths: "what to study to become a …".
 *
 *   careerPaths/{pathId}                 written by platform administrators,
 *                                        readable by anyone once published
 *   users/{uid}/careerPlans/{pathId}     the paths a learner follows, and
 *                                        the steps they marked done
 *
 *   careerProjects/{uid}__{pathId}__{stepId}
 *                                        a learner's project, reviewed by
 *                                        a platform administrator
 *
 * The chain: Career → Skills → Learning → Courses → Projects →
 * Credentials → Employment. A path is a role (AI Engineer, Cybersecurity
 * Analyst…) with a roadmap of ordered stages. Each stage names the skills
 * it requires, the learning that builds them (courses, outside resources,
 * practice) and the practical checks that prove them (certification
 * exams, reviewed projects). The path's job keywords link it to the Job
 * Board.
 *
 * Completing a course alone never verifies a skill: it makes the stage
 * "Learned". "Verified" needs every assessment and project in the stage.
 * The roadmap uses this to show the learner's skills, gaps and next step.
 */

export type CareerStepKind = 'course' | 'resource' | 'skill' | 'certification' | 'project';

/**
 * What a step proves:
 * - 'learn': studying (courses, reading, practice). Finishing these makes a
 *   stage "Learned", never "Verified": a finished course alone does not
 *   establish competency.
 * - 'verify': a practical check (a certification exam, a reviewed project).
 *   A stage is "Verified" only when all of these are passed.
 */
export type CareerStepRole = 'learn' | 'verify';
export type CareerLevel = 'entry' | 'mid' | 'senior';
export type CareerPathStatus = 'draft' | 'published';

export const CAREER_STEP_KINDS: Record<CareerStepKind, { label: string; icon: string; role: CareerStepRole }> = {
  course: { label: 'Zebron course', icon: 'school', role: 'learn' },
  resource: { label: 'Outside resource', icon: 'open_in_new', role: 'learn' },
  skill: { label: 'Skill to practice', icon: 'fitness_center', role: 'learn' },
  certification: { label: 'Assessment', icon: 'workspace_premium', role: 'verify' },
  project: { label: 'Project', icon: 'construction', role: 'verify' },
};

export function stepRole(step: Pick<CareerStep, 'kind'>): CareerStepRole {
  return CAREER_STEP_KINDS[step.kind].role;
}

/**
 * Where a learner stands on a stage's required skills:
 * - gap:         nothing done yet
 * - learning:    some learning done
 * - learned:     all learning done, not yet proven
 * - verified:    every assessment and project passed
 */
export type CompetencyLevel = 'gap' | 'learning' | 'learned' | 'verified';

export const COMPETENCY_LEVELS: Record<CompetencyLevel, { label: string; classes: string; icon: string }> = {
  gap: { label: 'Not started', classes: 'bg-slate-100 text-slate-700', icon: 'radio_button_unchecked' },
  learning: { label: 'Learning', classes: 'bg-amber-100 text-amber-800', icon: 'pending' },
  learned: { label: 'Learned: needs proof', classes: 'bg-sky-100 text-sky-800', icon: 'school' },
  verified: { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800', icon: 'verified' },
};

/**
 * A learner's project for a project step:
 * careerProjects/{uid}__{pathId}__{stepId}. The learner submits a link;
 * a platform administrator verifies it or asks for changes.
 */
export type ProjectStatus = 'submitted' | 'needs-work' | 'verified';

export interface CareerProject {
  id: string;
  userId: string;
  learnerName: string;
  pathId: string;
  pathTitle: string;
  stepId: string;
  stepTitle: string;
  /** https link to the work (repository, document, demo). */
  url: string;
  notes: string;
  status: ProjectStatus;
  feedback: string;
  reviewerId: string | null;
  reviewedAt: Timestamp | null;
  submittedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export function projectId(uid: string, pathId: string, stepId: string): string {
  return `${uid}__${pathId}__${stepId}`;
}

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  entry: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
};

/** Limits shared with firestore.rules. */
export const CAREER_LIMITS = {
  stages: 10,
  stepsPerStage: 15,
  skillsPerStage: 10,
  skills: 20,
  completedSteps: 200,
} as const;

export interface CareerStep {
  /** Stable id: a learner's checkmarks follow the step when it moves. */
  id: string;
  kind: CareerStepKind;
  title: string;
  description: string;
  /** kind 'course': a published Zebron course. */
  courseId: string | null;
  /** kind 'certification': a published Zebron certification key. */
  certificationKey: string | null;
  /** kind 'resource': the link. kind 'project': the brief (optional). Any step: extra reading. */
  url: string;
  /** Rough study time; 0 = not given. */
  hours: number;
}

/**
 * One stage of the roadmap: the skills it requires, and the learning
 * (steps) that builds them. Example, AI Engineer stage 1:
 * skills ["Programming fundamentals"], steps [course "Python Fundamentals"].
 */
export interface CareerStage {
  id: string;
  title: string;
  description: string;
  /** Required skills for this stage. */
  skills: string[];
  steps: CareerStep[];
}

export interface CareerPath {
  id: string;
  title: string;
  /** One line for the card. */
  summary: string;
  /** What the job is like, day to day. */
  description: string;
  /** Group on the browse page, such as "Technology" or "Healthcare". */
  field: string;
  level: CareerLevel;
  /** Free text, such as "$45,000–$65,000 a year in the DMV". */
  salaryRange: string;
  /** Free text: demand, growth. */
  outlook: string;
  /** Search words for the job board ("data analyst"). */
  jobKeywords: string;
  skills: string[];
  stages: CareerStage[];
  status: CareerPathStatus;
  /** Lower first on the browse page. */
  order: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CareerPlan {
  /** Same as the path id. */
  pathId: string;
  pathTitle: string;
  completedStepIds: string[];
  startedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyStep(kind: CareerStepKind = 'course'): CareerStep {
  return { id: newId('step'), kind, title: '', description: '', courseId: null, certificationKey: null, url: '', hours: 0 };
}

export function emptyStage(): CareerStage {
  return { id: newId('stage'), title: '', description: '', skills: [], steps: [] };
}

export function emptyPath(): CareerPath {
  return {
    id: '',
    title: '',
    summary: '',
    description: '',
    field: '',
    level: 'entry',
    salaryRange: '',
    outlook: '',
    jobKeywords: '',
    skills: [],
    stages: [emptyStage()],
    status: 'draft',
    order: 100,
    createdAt: null,
    updatedAt: null,
  };
}

export function allSteps(path: Pick<CareerPath, 'stages'>): CareerStep[] {
  return path.stages.flatMap((stage) => stage.steps);
}

export function totalHours(path: Pick<CareerPath, 'stages'>): number {
  return allSteps(path).reduce((sum, step) => sum + (step.hours || 0), 0);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

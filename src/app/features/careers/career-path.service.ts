import { Injectable, inject } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

import { isJobOpen, Job } from '../../core/models/job.model';
import { AiService } from '../../core/services/ai.service';
import { firestore } from '../../core/services/firebase-config';
import { isCourseComplete } from '../courses/course.model';
import { CourseService } from '../courses/course.service';
import { CertificationService } from '../courses/certification.service';

import {
  allSteps,
  CAREER_LIMITS,
  CareerLevel,
  CareerPath,
  CareerPlan,
  CareerProject,
  CareerStage,
  CareerStep,
  CareerStepKind,
  CompetencyLevel,
  newId,
  projectId,
  ProjectStatus,
  stepRole,
} from './career-path.model';

const KINDS: CareerStepKind[] = ['course', 'resource', 'skill', 'certification', 'project'];
const LEVELS: CareerLevel[] = ['entry', 'mid', 'senior'];

const text = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const strings = (value: unknown, maxItems: number, maxLength: number): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
const numberOr = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const httpsOnly = (value: unknown): string => {
  const url = text(value, 500);
  return /^https:\/\//i.test(url) ? url : '';
};

function toStep(value: unknown): CareerStep {
  const data = (value ?? {}) as Record<string, unknown>;
  const kind = KINDS.includes(data['kind'] as CareerStepKind) ? (data['kind'] as CareerStepKind) : 'skill';
  return {
    id: text(data['id'], 40) || newId('step'),
    kind,
    title: text(data['title'], 160),
    description: text(data['description'], 1000),
    courseId: kind === 'course' ? text(data['courseId'], 120) || null : null,
    certificationKey: kind === 'certification' ? text(data['certificationKey'], 160) || null : null,
    url: httpsOnly(data['url']),
    hours: Math.round(numberOr(data['hours'], 0, 0, 2000)),
  };
}

function toStage(value: unknown): CareerStage {
  const data = (value ?? {}) as Record<string, unknown>;
  return {
    id: text(data['id'], 40) || newId('stage'),
    title: text(data['title'], 120),
    description: text(data['description'], 600),
    skills: strings(data['skills'], CAREER_LIMITS.skillsPerStage, 60),
    steps: (Array.isArray(data['steps']) ? data['steps'] : []).slice(0, CAREER_LIMITS.stepsPerStage).map(toStep),
  };
}

export function toCareerPath(id: string, data: Record<string, unknown>): CareerPath {
  return {
    id,
    title: text(data['title'], 120),
    summary: text(data['summary'], 240),
    description: text(data['description'], 3000),
    field: text(data['field'], 60),
    level: LEVELS.includes(data['level'] as CareerLevel) ? (data['level'] as CareerLevel) : 'entry',
    salaryRange: text(data['salaryRange'], 120),
    outlook: text(data['outlook'], 400),
    jobKeywords: text(data['jobKeywords'], 100),
    skills: strings(data['skills'], CAREER_LIMITS.skills, 60),
    stages: (Array.isArray(data['stages']) ? data['stages'] : []).slice(0, CAREER_LIMITS.stages).map(toStage),
    status: data['status'] === 'published' ? 'published' : 'draft',
    order: Math.round(numberOr(data['order'], 100, 0, 10000)),
    createdAt: (data['createdAt'] as Timestamp | null) ?? null,
    updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
  };
}

function toPlan(id: string, data: Record<string, unknown>): CareerPlan {
  return {
    pathId: id,
    pathTitle: text(data['pathTitle'], 200),
    completedStepIds: strings(data['completedStepIds'], CAREER_LIMITS.completedSteps, 40),
    startedAt: (data['startedAt'] as Timestamp | null) ?? null,
    updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
  };
}

/** What a learner has already finished elsewhere on Zebron. */
export interface LearnerRecords {
  completedCourseIds: Set<string>;
  courseProgress: Map<string, number>;
  certifiedKeys: Set<string>;
  /** Skills listed on the Zebron courses the learner completed (lower case). */
  courseSkills: Set<string>;
  /** The learner's projects, by "<pathId>__<stepId>". */
  projects: Map<string, CareerProject>;
}

const PROJECT_STATUSES: ProjectStatus[] = ['submitted', 'needs-work', 'verified'];

function toProject(id: string, data: Record<string, unknown>): CareerProject {
  return {
    id,
    userId: text(data['userId'], 128),
    learnerName: text(data['learnerName'], 120),
    pathId: text(data['pathId'], 120),
    pathTitle: text(data['pathTitle'], 200),
    stepId: text(data['stepId'], 40),
    stepTitle: text(data['stepTitle'], 160),
    url: httpsOnly(data['url']),
    notes: text(data['notes'], 2000),
    status: PROJECT_STATUSES.includes(data['status'] as ProjectStatus) ? (data['status'] as ProjectStatus) : 'submitted',
    feedback: text(data['feedback'], 2000),
    reviewerId: text(data['reviewerId'], 128) || null,
    reviewedAt: (data['reviewedAt'] as Timestamp | null) ?? null,
    submittedAt: (data['submittedAt'] as Timestamp | null) ?? null,
    updatedAt: (data['updatedAt'] as Timestamp | null) ?? null,
  };
}

/** A job from the Job Board that fits the path, and why. */
export interface CareerJobMatch {
  job: Job;
  /** Path skills the listing asks for. */
  matchedSkills: string[];
}

/** An AI draft of a path, for the administrator to review. */
export interface CareerPathDraft {
  summary: string;
  description: string;
  field: string;
  salaryRange: string;
  outlook: string;
  jobKeywords: string;
  skills: string[];
  stages: CareerStage[];
}

/** Newest open listings looked at for "Matching jobs", and how long they are reused. */
const JOB_SAMPLE = 100;
const JOB_CACHE_MS = 10 * 60 * 1000;

const byOrder = (a: CareerPath, b: CareerPath) => a.order - b.order || a.title.localeCompare(b.title);

/**
 * Firestore access for career paths and learners' career plans.
 * Public queries filter on status == "published", which the rules require.
 */
@Injectable({ providedIn: 'root' })
export class CareerPathService {
  private readonly courses = inject(CourseService);
  private readonly certifications = inject(CertificationService);
  private readonly ai = inject(AiService);

  // ---------- Paths ----------

  async listPublished(): Promise<CareerPath[]> {
    const snapshot = await getDocs(query(collection(firestore, 'careerPaths'), where('status', '==', 'published')));
    return snapshot.docs.map((item) => toCareerPath(item.id, item.data())).sort(byOrder);
  }

  /** Administrators only: drafts too. */
  async listAll(): Promise<CareerPath[]> {
    const snapshot = await getDocs(collection(firestore, 'careerPaths'));
    return snapshot.docs.map((item) => toCareerPath(item.id, item.data())).sort(byOrder);
  }

  async get(pathId: string): Promise<CareerPath | null> {
    if (!pathId || pathId.includes('/')) return null;
    try {
      const snapshot = await getDoc(doc(firestore, 'careerPaths', pathId));
      return snapshot.exists() ? toCareerPath(snapshot.id, snapshot.data()) : null;
    } catch {
      // A draft is not readable by visitors: treat it as not found.
      return null;
    }
  }

  async exists(pathId: string): Promise<boolean> {
    const snapshot = await getDoc(doc(firestore, 'careerPaths', pathId));
    return snapshot.exists();
  }

  /** Creates or replaces a path. Steps without a title are dropped. */
  async save(path: CareerPath): Promise<void> {
    const stages = path.stages
      .map((stage) => ({
        id: stage.id,
        title: stage.title.trim().slice(0, 120),
        description: stage.description.trim().slice(0, 600),
        skills: strings(stage.skills, CAREER_LIMITS.skillsPerStage, 60),
        steps: stage.steps
          .filter((step) => step.title.trim())
          .slice(0, CAREER_LIMITS.stepsPerStage)
          .map((step) => ({
            id: step.id,
            kind: step.kind,
            title: step.title.trim().slice(0, 160),
            description: step.description.trim().slice(0, 1000),
            courseId: step.kind === 'course' ? step.courseId || null : null,
            certificationKey: step.kind === 'certification' ? step.certificationKey || null : null,
            url: httpsOnly(step.url),
            hours: Math.round(numberOr(step.hours, 0, 0, 2000)),
          })),
      }))
      .filter((stage) => stage.title || stage.skills.length || stage.steps.length)
      .slice(0, CAREER_LIMITS.stages);

    await setDoc(doc(firestore, 'careerPaths', path.id), {
      title: path.title.trim().slice(0, 120),
      summary: path.summary.trim().slice(0, 240),
      description: path.description.trim().slice(0, 3000),
      field: path.field.trim().slice(0, 60),
      level: path.level,
      salaryRange: path.salaryRange.trim().slice(0, 120),
      outlook: path.outlook.trim().slice(0, 400),
      jobKeywords: path.jobKeywords.trim().slice(0, 100),
      skills: strings(path.skills, CAREER_LIMITS.skills, 60),
      stages,
      status: path.status,
      order: Math.round(numberOr(path.order, 100, 0, 10000)),
      createdAt: path.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async delete(pathId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'careerPaths', pathId));
  }

  /**
   * Asks the AI engine for a first draft of a path (administrators only).
   * Courses and certifications on Zebron are sent so the draft can point
   * to them; nothing is saved until the administrator saves.
   */
  async draftWithAi(input: {
    title: string;
    level: CareerLevel;
    area: string;
    courses: Array<{ id: string; title: string; skills: string[] }>;
    certifications: Array<{ key: string; title: string }>;
  }): Promise<CareerPathDraft> {
    const result = await this.ai.run<Record<string, unknown>>('learning', 'draft-career-path', input);
    const path = toCareerPath('draft', { ...result, title: input.title, level: input.level });
    return {
      summary: path.summary,
      description: path.description,
      field: path.field,
      salaryRange: path.salaryRange,
      outlook: path.outlook,
      jobKeywords: path.jobKeywords,
      skills: path.skills,
      stages: path.stages,
    };
  }

  // ---------- A learner's plans ----------

  async listPlans(uid: string): Promise<CareerPlan[]> {
    const snapshot = await getDocs(collection(firestore, 'users', uid, 'careerPlans'));
    return snapshot.docs
      .map((item) => toPlan(item.id, item.data()))
      .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  }

  async getPlan(uid: string, pathId: string): Promise<CareerPlan | null> {
    const snapshot = await getDoc(doc(firestore, 'users', uid, 'careerPlans', pathId));
    return snapshot.exists() ? toPlan(snapshot.id, snapshot.data()) : null;
  }

  /** Starts following a path, or saves the steps a learner checked off. */
  async savePlan(uid: string, path: Pick<CareerPath, 'id' | 'title'>, completedStepIds: string[], existing: CareerPlan | null): Promise<CareerPlan> {
    const ids = [...new Set(completedStepIds)].slice(0, CAREER_LIMITS.completedSteps);
    const values = {
      pathId: path.id,
      pathTitle: path.title.slice(0, 200),
      completedStepIds: ids,
    };
    const ref = doc(firestore, 'users', uid, 'careerPlans', path.id);
    if (existing) {
      // startedAt stays as the server wrote it (the rules check it).
      await updateDoc(ref, { pathTitle: values.pathTitle, completedStepIds: ids, updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...values, startedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    return { ...values, startedAt: existing?.startedAt ?? Timestamp.now(), updatedAt: Timestamp.now() };
  }

  async leavePlan(uid: string, pathId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'users', uid, 'careerPlans', pathId));
  }

  /** What the learner finished on Zebron: courses, certifications and projects. */
  async learnerRecords(uid: string): Promise<LearnerRecords> {
    const [progress, exams, enrollments, projects] = await Promise.all([
      this.courses.listProgress(uid).catch(() => []),
      this.courses.listExamRecords(uid).catch(() => []),
      this.certifications.myEnrollments(uid).catch(() => new Map()),
      getDocs(query(collection(firestore, 'careerProjects'), where('userId', '==', uid)))
        .then((snapshot) => snapshot.docs.map((item) => toProject(item.id, item.data())))
        .catch(() => [] as CareerProject[]),
    ]);
    const examById = new Map(exams.map((exam) => [exam.id, exam]));
    const completedCourseIds = new Set<string>();
    const courseProgress = new Map<string, number>();
    const courseSkills = new Set<string>();
    // Zebron courses only: their progress id is the course id.
    for (const item of progress.filter((entry) => !entry.organizationId)) {
      courseProgress.set(item.courseId, item.percent);
      if (isCourseComplete(item, examById.get(item.id))) {
        completedCourseIds.add(item.courseId);
        item.skills.forEach((skill) => courseSkills.add(skill.trim().toLowerCase()));
      }
    }
    const certifiedKeys = new Set<string>();
    for (const [key, enrollment] of enrollments) {
      if (enrollment.credential || enrollment.readiness) certifiedKeys.add(key);
    }
    return {
      completedCourseIds,
      courseProgress,
      certifiedKeys,
      courseSkills,
      projects: new Map(projects.map((project) => [`${project.pathId}__${project.stepId}`, project])),
    };
  }

  // ---------- Projects ----------

  /** Submits (or resubmits) a project for review. */
  async submitProject(
    uid: string,
    learnerName: string,
    path: Pick<CareerPath, 'id' | 'title'>,
    step: Pick<CareerStep, 'id' | 'title'>,
    url: string,
    notes: string,
    existing: CareerProject | null,
  ): Promise<CareerProject> {
    const link = httpsOnly(url);
    if (!link) throw new Error('Add a link that starts with https://');
    const id = projectId(uid, path.id, step.id);
    const ref = doc(firestore, 'careerProjects', id);
    const learner = {
      learnerName: learnerName.trim().slice(0, 120),
      url: link,
      notes: notes.trim().slice(0, 2000),
      status: 'submitted' as const,
    };
    if (existing) {
      // Resubmission: only the learner's own fields change; the review stays for the record.
      await updateDoc(ref, { ...learner, updatedAt: serverTimestamp() });
      return { ...existing, ...learner, updatedAt: Timestamp.now() };
    }
    const values = {
      userId: uid,
      pathId: path.id,
      pathTitle: path.title.slice(0, 200),
      stepId: step.id,
      stepTitle: step.title.slice(0, 160),
      ...learner,
      feedback: '',
      reviewerId: null,
      reviewedAt: null,
    };
    await setDoc(ref, { ...values, submittedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id, ...values, submittedAt: Timestamp.now(), updatedAt: Timestamp.now() };
  }

  /** Administrators: projects waiting for review, oldest first. */
  async listProjectsForReview(): Promise<CareerProject[]> {
    const snapshot = await getDocs(query(collection(firestore, 'careerProjects'), where('status', '==', 'submitted')));
    return snapshot.docs
      .map((item) => toProject(item.id, item.data()))
      .sort((a, b) => (a.updatedAt?.toMillis() ?? 0) - (b.updatedAt?.toMillis() ?? 0));
  }

  /** Administrators: verify a project, or send it back with feedback. */
  async reviewProject(reviewerId: string, project: CareerProject, status: 'verified' | 'needs-work', feedback: string): Promise<void> {
    await updateDoc(doc(firestore, 'careerProjects', project.id), {
      status,
      feedback: feedback.trim().slice(0, 2000),
      reviewerId,
      reviewedAt: serverTimestamp(),
    });
  }

  // ---------- Job Board ----------

  /**
   * Newest open jobs, read at most once every 10 minutes per visitor and
   * shared by every career page: browsing several paths costs one query of
   * at most JOB_SAMPLE reads, not a read of the whole Job Board per page.
   */
  private jobSample: { at: number; jobs: Promise<Job[]> } | null = null;

  private recentJobs(): Promise<Job[]> {
    if (!this.jobSample || Date.now() - this.jobSample.at > JOB_CACHE_MS) {
      const jobs = getDocs(
        // Same index as the Job Board (status + createdAt desc).
        query(collection(firestore, 'jobs'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(JOB_SAMPLE)),
      ).then((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Job, 'id'>) })).filter((job) => isJobOpen(job)));
      // A failed read is not cached: the next career page tries again.
      jobs.catch(() => (this.jobSample = null));
      this.jobSample = { at: Date.now(), jobs };
    }
    return this.jobSample.jobs;
  }

  /**
   * Open jobs on the Job Board that fit the path: the job keywords in the
   * title, or at least two of the path's skills in the listing. Looks at
   * the newest JOB_SAMPLE listings; "Search the Job Board" covers the rest.
   */
  async matchingJobs(path: CareerPath, max = 6): Promise<CareerJobMatch[]> {
    const jobs = await this.recentJobs();
    const keywords = path.jobKeywords.toLowerCase().split(/[,;]/).map((word) => word.trim()).filter(Boolean);
    const skills = [...new Set([...path.skills, ...path.stages.flatMap((stage) => stage.skills)])];
    return jobs
      .map((job) => {
        const title = (job.title ?? '').toLowerCase();
        const listing = `${title} ${(job.skills ?? []).join(' ')} ${(job.tags ?? []).join(' ')} ${job.description ?? ''}`.toLowerCase();
        const matchedSkills = skills.filter((skill) => listing.includes(skill.toLowerCase()));
        const titleMatch = keywords.some((word) => title.includes(word));
        return { job, matchedSkills, score: (titleMatch ? 10 : 0) + matchedSkills.length };
      })
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map(({ job, matchedSkills }) => ({ job, matchedSkills }));
  }
}

/**
 * True when the step is done:
 * - course: finished on Zebron (final exam passed when it has one)
 * - certification: credential earned (or practice exam passed for exam prep)
 * - project: verified by a reviewer
 * - skill / resource: checked off by the learner
 */
export function isStepDone(pathId: string, step: CareerStep, plan: CareerPlan | null, records: LearnerRecords | null): boolean {
  switch (step.kind) {
    case 'course':
      return !!step.courseId && !!records?.completedCourseIds.has(step.courseId);
    case 'certification':
      return !!step.certificationKey && !!records?.certifiedKeys.has(step.certificationKey);
    case 'project':
      return records?.projects.get(`${pathId}__${step.id}`)?.status === 'verified';
    default:
      return !!plan?.completedStepIds.includes(step.id);
  }
}

/** Steps the learner checks off by hand (the rest follow Zebron records). */
export function canCheckOff(step: CareerStep): boolean {
  return step.kind === 'skill' || step.kind === 'resource';
}

/**
 * Competency on a stage's required skills. A finished course alone never
 * verifies: "verified" needs every assessment and project of the stage
 * (and at least one of them).
 */
export function stageCompetency(stage: CareerStage, isDone: (step: CareerStep) => boolean): CompetencyLevel {
  const learn = stage.steps.filter((step) => stepRole(step) === 'learn');
  const verify = stage.steps.filter((step) => stepRole(step) === 'verify');
  if (verify.length && verify.every(isDone)) return 'verified';
  const doneCount = stage.steps.filter(isDone).length;
  if (!doneCount) return 'gap';
  return learn.length && learn.every(isDone) ? 'learned' : 'learning';
}

export interface SkillStatus {
  skill: string;
  stageIndex: number;
  level: CompetencyLevel;
}

export interface CareerInsights {
  /** 1. Every required skill, with the learner's level. */
  skills: SkillStatus[];
  /** 2. Skills the learner has: verified, or learned (needs proof). */
  verified: SkillStatus[];
  learned: SkillStatus[];
  /** Required skills not yet started or in progress. */
  gaps: SkillStatus[];
  /** Required skills already listed on courses the learner finished elsewhere. */
  fromOtherCourses: string[];
  /** 3–5. What is left to do, in roadmap order. */
  courses: CareerStep[];
  certifications: CareerStep[];
  projects: CareerStep[];
  /** The single best next step: finish learning in the first unverified stage, then prove it. */
  next: CareerStep | null;
  /** Stages with no assessment or project: they can only reach "Learned". */
  unverifiableStages: number;
  /** Every stage verified. */
  jobReady: boolean;
}

export function careerInsights(path: CareerPath, plan: CareerPlan | null, records: LearnerRecords | null): CareerInsights {
  const isDone = (step: CareerStep) => isStepDone(path.id, step, plan, records);
  const skills: SkillStatus[] = [];
  let next: CareerStep | null = null;
  path.stages.forEach((stage, stageIndex) => {
    const level = stageCompetency(stage, isDone);
    stage.skills.forEach((skill) => skills.push({ skill, stageIndex, level }));
    if (!next && level !== 'verified') {
      next =
        stage.steps.find((step) => stepRole(step) === 'learn' && !isDone(step)) ??
        stage.steps.find((step) => stepRole(step) === 'verify' && !isDone(step)) ??
        null;
    }
  });
  const open = allSteps(path).filter((step) => !isDone(step));
  const completedSkills = records?.courseSkills ?? new Set<string>();
  const gaps = skills.filter((item) => item.level === 'gap' || item.level === 'learning');
  return {
    skills,
    verified: skills.filter((item) => item.level === 'verified'),
    learned: skills.filter((item) => item.level === 'learned'),
    gaps,
    fromOtherCourses: gaps.map((item) => item.skill).filter((skill) => completedSkills.has(skill.toLowerCase())),
    courses: open.filter((step) => step.kind === 'course' || step.kind === 'resource'),
    certifications: open.filter((step) => step.kind === 'certification'),
    projects: allSteps(path).filter((step) => step.kind === 'project'),
    next,
    unverifiableStages: path.stages.filter((stage) => !stage.steps.some((step) => stepRole(step) === 'verify')).length,
    jobReady: path.stages.length > 0 && path.stages.every((stage) => stageCompetency(stage, isDone) === 'verified'),
  };
}

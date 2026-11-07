import { inject } from '@angular/core';

import { DashboardStatsService, LearningStats } from '../../shared/dashboards/dashboard-stats.service';
import { DashboardContext, DataSourceDefinition, NumberData, ProgressData, SeriesData } from '../../shared/dashboards/data-source.registry';
import { CourseAssignmentService } from './course-assignment.service';
import { isCourseComplete, progressId } from './course.model';
import { CourseService } from './course.service';

/**
 * Learning data sources for dashboards.
 *
 * - learning.*: org-wide figures from organizations/{id}/stats/learning (one
 *   read), for managers and above (permission learning.insights).
 * - me.*: the viewer's own progress and assignments (a few reads of their
 *   own records), for every member.
 */

const APP = 'courses';
const PENDING = 'Figures appear after tonight’s update.';

const coursesPath = (context: DashboardContext) => `${context.basePath}/courses`;
const teamProgressPath = (context: DashboardContext) => `${context.basePath}/learning/progress`;

/** An org-wide figure read from the learning summary. */
function statsNumber(
  key: string,
  name: string,
  pick: (stats: LearningStats) => Omit<NumberData, 'kind'>,
): DataSourceDefinition {
  return {
    key,
    name,
    appId: APP,
    shape: 'number',
    permission: 'learning.insights',
    async load(context) {
      const service = inject(DashboardStatsService);
      const stats = await service.learning(context.organizationId);
      if (!stats) return { kind: 'number', value: 0, pending: PENDING };
      return { kind: 'number', link: teamProgressPath(context), asOf: stats.updatedAt, ...pick(stats) };
    },
  };
}

export const LEARNING_DATA_SOURCES: DataSourceDefinition[] = [
  statsNumber('learning.completionPercent', 'Course completion (organization)', (stats) => ({
    value: stats.completionPercent,
    unit: '%',
    caption: `${stats.coursesCompleted} of ${stats.coursesStarted} started courses completed`,
  })),
  statsNumber('learning.activeLearners', 'Active learners, last 7 days', (stats) => ({
    value: stats.activeLast7Days,
    caption: `of ${stats.members} members`,
  })),
  statsNumber('learning.overdueAssignments', 'Overdue assignments', (stats) => ({
    value: stats.overdueAssignments,
    caption: `of ${stats.assignments} assignments`,
  })),
  statsNumber('learning.certificates', 'Certificates earned', (stats) => ({
    value: stats.certificates,
    caption: 'course certificates in your organization',
  })),
  statsNumber('learning.members', 'Members', (stats) => ({
    value: stats.members,
    caption: `${stats.coursesPublished} published courses`,
  })),

  {
    key: 'learning.assignmentProgress',
    name: 'Assignments completed (organization)',
    appId: APP,
    shape: 'progress',
    permission: 'learning.insights',
    async load(context): Promise<ProgressData> {
      const service = inject(DashboardStatsService);
      const stats = await service.learning(context.organizationId);
      if (!stats) return { kind: 'progress', value: 0, target: 0, pending: PENDING };
      return {
        kind: 'progress',
        value: stats.assignmentsCompleted,
        target: stats.assignments,
        caption: `${stats.overdueAssignments} overdue`,
        link: teamProgressPath(context),
        asOf: stats.updatedAt,
      };
    },
  },

  // ---------- Charts (from the same summary) ----------

  {
    key: 'learning.completionsByWeek',
    name: 'Courses completed per week',
    appId: APP,
    shape: 'series',
    permission: 'learning.insights',
    async load(context): Promise<SeriesData> {
      const stats = await inject(DashboardStatsService).learning(context.organizationId);
      if (!stats || !stats.completionsByWeek.length) return { kind: 'series', points: [], pending: PENDING };
      return {
        kind: 'series',
        unit: 'courses',
        highlightLast: true,
        asOf: stats.updatedAt,
        points: stats.completionsByWeek.map((point) => ({ label: weekLabel(point.label), value: point.value })),
      };
    },
  },
  {
    key: 'learning.completionsByCourse',
    name: 'Completions by course',
    appId: APP,
    shape: 'series',
    permission: 'learning.insights',
    async load(context): Promise<SeriesData> {
      const stats = await inject(DashboardStatsService).learning(context.organizationId);
      if (!stats) return { kind: 'series', points: [], pending: PENDING };
      return { kind: 'series', unit: 'completions', asOf: stats.updatedAt, points: stats.completionsByCourse };
    },
  },
  {
    key: 'learning.assignmentStatus',
    name: 'Assignments by status',
    appId: APP,
    shape: 'series',
    permission: 'learning.insights',
    async load(context): Promise<SeriesData> {
      const stats = await inject(DashboardStatsService).learning(context.organizationId);
      if (!stats) return { kind: 'series', points: [], pending: PENDING };
      const open = Math.max(0, stats.assignments - stats.assignmentsCompleted - stats.overdueAssignments);
      return {
        kind: 'series',
        unit: 'assignments',
        asOf: stats.updatedAt,
        points: [
          { label: 'Completed', value: stats.assignmentsCompleted },
          { label: 'Open', value: open },
          { label: 'Overdue', value: stats.overdueAssignments },
        ],
      };
    },
  },

  // ---------- The viewer's own learning ----------

  {
    key: 'me.coursesCompleted',
    name: 'My completed courses',
    appId: APP,
    shape: 'number',
    async load(context): Promise<NumberData> {
      const courses = inject(CourseService);
      if (!context.userId) return { kind: 'number', value: 0, pending: 'Sign in to see your courses.' };
      const [progress, exams] = await Promise.all([courses.listProgress(context.userId), courses.listExamRecords(context.userId)]);
      const mine = progress.filter((record) => record.organizationId === context.organizationId);
      const examById = new Map(exams.map((exam) => [exam.id, exam]));
      const done = mine.filter((record) => isCourseComplete(record, examById.get(record.id))).length;
      return { kind: 'number', value: done, caption: `of ${mine.length} courses started`, link: coursesPath(context) };
    },
  },

  {
    key: 'me.assignmentProgress',
    name: 'My assignments completed',
    appId: APP,
    shape: 'progress',
    async load(context): Promise<ProgressData> {
      const assignments = inject(CourseAssignmentService);
      const courses = inject(CourseService);
      if (!context.userId) return { kind: 'progress', value: 0, target: 0, pending: 'Sign in to see your assignments.' };
      const [mine, progress, exams] = await Promise.all([
        assignments.listMine(context.organizationId, context.userId),
        courses.listProgress(context.userId),
        courses.listExamRecords(context.userId),
      ]);
      const examById = new Map(exams.map((exam) => [exam.id, exam]));
      const done = mine.filter((assignment) => {
        const id = progressId({ id: assignment.courseId, organizationId: context.organizationId });
        const record = progress.find((item) => item.id === id);
        return assignment.lessonId ? !!record?.completedLessonIds.includes(assignment.lessonId) : isCourseComplete(record, examById.get(id));
      }).length;
      return { kind: 'progress', value: done, target: mine.length, caption: 'assigned to you', link: coursesPath(context) };
    },
  },

  {
    key: 'me.openAssignments',
    name: 'My open assignments',
    appId: APP,
    shape: 'list',
    async load(context, config) {
      const assignments = inject(CourseAssignmentService);
      const courses = inject(CourseService);
      if (!context.userId) return { kind: 'list', items: [] };
      const [mine, progress, exams] = await Promise.all([
        assignments.listMine(context.organizationId, context.userId),
        courses.listProgress(context.userId),
        courses.listExamRecords(context.userId),
      ]);
      const examById = new Map(exams.map((exam) => [exam.id, exam]));
      const open = mine
        .filter((assignment) => {
          const id = progressId({ id: assignment.courseId, organizationId: context.organizationId });
          const record = progress.find((item) => item.id === id);
          return assignment.lessonId ? !record?.completedLessonIds.includes(assignment.lessonId) : !isCourseComplete(record, examById.get(id));
        })
        .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));

      return {
        kind: 'list',
        link: coursesPath(context),
        items: open.slice(0, limitOf(config)).map((assignment) => ({
          title: assignment.lessonTitle || assignment.courseTitle,
          subtitle: assignment.dueAt ? `Due ${assignment.dueAt.toLocaleDateString()}` : assignment.lessonTitle ? `Lesson in ${assignment.courseTitle}` : undefined,
          link: `${coursesPath(context)}/${assignment.courseId}`,
          icon: assignment.dueAt && assignment.dueAt.getTime() < Date.now() ? 'schedule' : 'assignment',
        })),
      };
    },
  },

  {
    key: 'me.coursesInProgress',
    name: 'My courses in progress',
    appId: APP,
    shape: 'list',
    async load(context, config) {
      const courses = inject(CourseService);
      if (!context.userId) return { kind: 'list', items: [] };
      const progress = await courses.listProgress(context.userId);
      const open = progress.filter((record) => record.organizationId === context.organizationId && record.status !== 'completed');
      return {
        kind: 'list',
        link: coursesPath(context),
        items: open.slice(0, limitOf(config)).map((record) => ({
          title: record.courseTitle || 'Course',
          subtitle: `${Math.round(record.percent)}% done`,
          link: `${coursesPath(context)}/${record.courseId}`,
          icon: 'play_circle',
        })),
      };
    },
  },
];

/** '2026-10-19' → 'Oct 19' (the week's Monday). */
function weekLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function limitOf(config: Record<string, unknown>): number {
  return Math.min(8, Math.max(1, Number(config['limit']) || 5));
}

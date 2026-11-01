import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';

import {
  allLessons,
  Course,
  CourseContext,
  CourseExamRecord,
  CourseOutlineLesson,
  CourseProgress,
  dayKey,
  daysThisWeek,
  isCourseComplete,
  Lesson,
  mergeActivity,
  minutesThisWeek,
  progressId,
  trimActivity,
  weekStreak,
} from './course.model';
import { CourseService } from './course.service';

interface CourseState {
  context: CourseContext | null;

  // Catalog
  catalog: Course[];
  catalogLoading: boolean;
  catalogLoaded: boolean;
  catalogError: string | null;
  query: string;
  topic: string;

  // The signed-in learner's progress in every course
  progress: CourseProgress[];
  progressLoading: boolean;
  progressLoaded: boolean;
  progressUserId: string | null;
  /** Final exam records by progress id (written by Cloud Functions). */
  exams: Record<string, CourseExamRecord>;

  // Course page and lesson player
  course: Course | null;
  courseLoading: boolean;
  courseError: string | null;
  lesson: Lesson | null;
  lessonLoading: boolean;
  lessonError: string | null;

  saving: boolean;
}

const initialState: CourseState = {
  context: null,
  catalog: [],
  catalogLoading: false,
  catalogLoaded: false,
  catalogError: null,
  query: '',
  topic: 'All',
  progress: [],
  progressLoading: false,
  progressLoaded: false,
  progressUserId: null,
  exams: {},
  course: null,
  courseLoading: false,
  courseError: null,
  lesson: null,
  lessonLoading: false,
  lessonError: null,
  saving: false,
};

function message(error: unknown, fallback: string): string {
  return (error as { code?: string })?.code === 'permission-denied'
    ? 'You do not have access to this course.'
    : fallback;
}

/** What happened when a lesson was completed. */
export interface LessonCompletion {
  nextLessonId: string | null;
  /** Every lesson is done. */
  courseCompleted: boolean;
  /** Every lesson is done and the final exam is still to pass. */
  examNext: boolean;
}

/**
 * State for the course pages: My learning, the catalog, the course page,
 * the lesson player and certificates. Each page calls setContext() with
 * the place it is served from (Zebron or an organization).
 */
export const CourseStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => ({
    topics: computed(() => ['All', ...new Set(store.catalog().map((course) => course.topic).filter(Boolean))]),

    filteredCatalog: computed(() => {
      const term = store.query().trim().toLowerCase();
      const topic = store.topic();

      return store.catalog().filter(
        (course) =>
          (topic === 'All' || course.topic === topic) &&
          (!term ||
            `${course.title} ${course.summary} ${course.topic} ${course.skills.join(' ')} ${course.providerName}`
              .toLowerCase()
              .includes(term)),
      );
    }),

    progressById: computed(() => new Map(store.progress().map((record) => [record.id, record]))),

    /** Not complete yet: lessons left, or the final exam still to pass. */
    inProgress: computed(() => store.progress().filter((record) => !isCourseComplete(record, store.exams()[record.id]))),

    completed: computed(() => store.progress().filter((record) => isCourseComplete(record, store.exams()[record.id]))),

    activity: computed(() => mergeActivity(store.progress())),

    outline: computed(() => allLessons(store.course())),
  })),

  withComputed((store) => ({
    streakWeeks: computed(() => weekStreak(store.activity())),
    weekMinutes: computed(() => minutesThisWeek(store.activity())),
    weekDays: computed(() => daysThisWeek(store.activity())),

    skillsEarned: computed(() => new Set(store.completed().flatMap((record) => record.skills)).size),

    /** The most recently touched unfinished course. */
    continueRecord: computed(() => store.inProgress()[0] ?? null),

    /** Courses not started yet, newest first. */
    recommended: computed(() =>
      store
        .catalog()
        .filter((course) => !store.progressById().has(progressId(course)))
        .slice(0, 6),
    ),

    courseProgress: computed(() => {
      const course = store.course();
      return course ? store.progressById().get(progressId(course)) ?? null : null;
    }),

    /** The learner's final exam record for the open course. */
    courseExam: computed(() => {
      const course = store.course();
      return course ? store.exams()[progressId(course)] ?? null : null;
    }),

    lessonIndex: computed(() => {
      const lesson = store.lesson();
      return lesson ? store.outline().findIndex((item) => item.id === lesson.id) : -1;
    }),
  })),

  withComputed((store) => ({
    completedIds: computed(() => new Set(store.courseProgress()?.completedLessonIds ?? [])),

    /** Where Resume goes: the first unfinished lesson after the last one done. */
    resumeLesson: computed((): CourseOutlineLesson | null => {
      const outline = store.outline();
      const done = new Set(store.courseProgress()?.completedLessonIds ?? []);
      return outline.find((lesson) => !done.has(lesson.id)) ?? outline[0] ?? null;
    }),

    previousLesson: computed(() => {
      const index = store.lessonIndex();
      return index > 0 ? store.outline()[index - 1] : null;
    }),

    nextLesson: computed(() => {
      const index = store.lessonIndex();
      return index >= 0 ? store.outline()[index + 1] ?? null : null;
    }),
  })),

  withMethods((store) => {
    const service = inject(CourseService);
    const auth = inject(AuthService);
    const logger = inject(LoggerService);

    const currentUser = () => {
      const firebaseUser = auth.firebaseUser();
      if (!firebaseUser) {
        return null;
      }

      const profile = auth.user();
      const name =
        profile?.displayName?.trim() ||
        firebaseUser.displayName?.trim() ||
        firebaseUser.email?.split('@')[0] ||
        'Zebron learner';

      return { uid: firebaseUser.uid, name };
    };

    const sameContext = (context: CourseContext) =>
      store.context()?.basePath === context.basePath;

    const replaceProgress = (record: CourseProgress) => {
      const others = store.progress().filter((item) => item.id !== record.id);
      patchState(store, { progress: [record, ...others] });
    };

    return {
      setContext(context: CourseContext): void {
        if (sameContext(context)) {
          return;
        }

        patchState(store, {
          context,
          catalog: [],
          catalogLoaded: false,
          catalogError: null,
          query: '',
          topic: 'All',
          course: null,
          lesson: null,
        });
      },

      setQuery(query: string): void {
        patchState(store, { query });
      },

      setTopic(topic: string): void {
        patchState(store, { topic });
      },

      async loadCatalog(force = false): Promise<void> {
        const context = store.context();
        if (!context || (store.catalogLoaded() && !force) || store.catalogLoading()) {
          return;
        }

        patchState(store, { catalogLoading: true, catalogError: null });

        try {
          const catalog = await service.listCatalog(context);
          if (sameContext(context)) {
            patchState(store, { catalog, catalogLoaded: true });
          }
        } catch (error) {
          logger.error('CourseStore', 'Could not load the course catalog.', error);
          patchState(store, { catalogError: message(error, 'Courses could not be loaded. Try again.') });
        } finally {
          patchState(store, { catalogLoading: false });
        }
      },

      /** The signed-in learner's progress (nothing for guests). */
      async loadProgress(force = false): Promise<void> {
        const user = currentUser();
        if (!user) {
          patchState(store, { progress: [], progressLoaded: true, progressUserId: null });
          return;
        }

        const sameUser = store.progressUserId() === user.uid;
        if ((store.progressLoaded() && sameUser && !force) || store.progressLoading()) {
          return;
        }

        patchState(store, { progressLoading: true });

        try {
          const [progress, exams] = await Promise.all([
            service.listProgress(user.uid),
            service.listExamRecords(user.uid).catch(() => []),
          ]);
          patchState(store, {
            progress,
            exams: Object.fromEntries(exams.map((exam) => [exam.id, exam])),
            progressLoaded: true,
            progressUserId: user.uid,
          });
        } catch (error) {
          logger.error('CourseStore', 'Could not load course progress.', error);
          patchState(store, { progressLoaded: true });
        } finally {
          patchState(store, { progressLoading: false });
        }
      },

      async openCourse(courseId: string): Promise<void> {
        const context = store.context();
        if (!context) {
          return;
        }

        if (store.course()?.id === courseId) {
          return;
        }

        patchState(store, { course: null, courseLoading: true, courseError: null, lesson: null });

        try {
          const course = await service.getCourse(context, courseId);
          patchState(store, {
            course,
            courseError: course ? null : 'This course is not available.',
          });
        } catch (error) {
          logger.error('CourseStore', 'Could not load the course.', error);
          patchState(store, { courseError: message(error, 'The course could not be loaded. Try again.') });
        } finally {
          patchState(store, { courseLoading: false });
        }
      },

      async openLesson(lessonId: string): Promise<void> {
        const course = store.course();
        if (!course) {
          return;
        }

        if (store.lesson()?.id === lessonId) {
          return;
        }

        patchState(store, { lesson: null, lessonLoading: true, lessonError: null });

        try {
          const lesson = await service.getLesson(course, lessonId);
          patchState(store, { lesson, lessonError: lesson ? null : 'This lesson is not available.' });
        } catch (error) {
          logger.error('CourseStore', 'Could not load the lesson.', error);
          patchState(store, { lessonError: message(error, 'The lesson could not be loaded. Try again.') });
        } finally {
          patchState(store, { lessonLoading: false });
        }
      },

      /**
       * Mark the open lesson done. score is the first-try result of its
       * quick checks (null when it has none). Completing the last lesson
       * completes the course and issues the certificate code.
       */
      async completeLesson(score: number | null): Promise<LessonCompletion | null> {
        const course = store.course();
        const lesson = store.lesson();
        const user = currentUser();

        if (!course || !lesson || !user || store.saving()) {
          return null;
        }

        const outline = allLessons(course);
        const existing = store.progressById().get(progressId(course)) ?? null;
        const done = new Set(existing?.completedLessonIds ?? []);
        const isNewLesson = !done.has(lesson.id);
        done.add(lesson.id);

        const completedLessonIds = outline.map((item) => item.id).filter((id) => done.has(id));
        const percent = outline.length ? Math.round((completedLessonIds.length / outline.length) * 100) : 0;
        const finished = outline.length > 0 && completedLessonIds.length === outline.length;
        const justCompleted = finished && existing?.status !== 'completed';

        const checkScores = { ...(existing?.checkScores ?? {}) };
        if (score !== null && checkScores[lesson.id] === undefined) {
          checkScores[lesson.id] = Math.max(0, Math.min(100, Math.round(score)));
        }

        const today = dayKey();
        const activity = { ...(existing?.activity ?? {}) };
        if (isNewLesson) {
          activity[today] = (activity[today] ?? 0) + Math.max(1, Math.round(lesson.minutes));
        }

        const record: CourseProgress = {
          id: progressId(course),
          userId: user.uid,
          courseId: course.id,
          organizationId: course.organizationId,
          courseTitle: course.title,
          cover: course.cover,
          lessonCount: outline.length,
          finalExam: !!course.finalExam,
          completedLessonIds,
          lastLessonId: lesson.id,
          percent,
          status: finished ? 'completed' : 'in_progress',
          checkScores,
          activity: trimActivity(activity),
          learnerName: existing?.learnerName || user.name,
          // Certificates come only from a passed final exam (issued on the server).
          certificateCode: null,
          skills: course.skills,
          startedAt: existing?.startedAt ?? null,
          updatedAt: existing?.updatedAt ?? null,
          completedAt: existing?.completedAt ?? null,
        };

        patchState(store, { saving: true });

        try {
          await service.saveProgress(record, justCompleted);
          // Read it back so the server timestamps are filled in.
          replaceProgress((await service.getProgress(user.uid, record.id)) ?? record);

          const index = outline.findIndex((item) => item.id === lesson.id);
          const nextUnfinished =
            outline.slice(index + 1).find((item) => !done.has(item.id)) ??
            outline.find((item) => !done.has(item.id)) ??
            null;

          return {
            nextLessonId: nextUnfinished?.id ?? null,
            courseCompleted: finished,
            examNext: finished && !!course.finalExam && store.exams()[record.id]?.passed !== true,
          };
        } catch (error) {
          logger.error('CourseStore', 'Could not save lesson progress.', error);
          throw new Error(message(error, 'Your progress could not be saved. Try again.'));
        } finally {
          patchState(store, { saving: false });
        }
      },

      /** Forget the signed-in learner's data (after signing out). */
      /** Reload the final exam records (after an exam is submitted). */
      async refreshExams(): Promise<void> {
        const user = currentUser();
        if (!user) {
          return;
        }
        try {
          const exams = await service.listExamRecords(user.uid);
          patchState(store, { exams: Object.fromEntries(exams.map((exam) => [exam.id, exam])) });
        } catch (error) {
          logger.error('CourseStore', 'Could not load exam records.', error);
        }
      },

      resetProgress(): void {
        patchState(store, { progress: [], progressLoaded: false, progressUserId: null, exams: {} });
      },
    };
  }),
);

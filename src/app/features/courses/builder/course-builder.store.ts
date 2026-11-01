import { computed, inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';

import {
  CourseCover,
  CourseFinalExam,
  CourseLevel,
  CourseReview,
  CourseStatus,
  LessonBlock,
  LessonBlockType,
} from '../course.model';
import { CourseService } from '../course.service';

export interface DraftDetails {
  title: string;
  summary: string;
  description: string;
  topic: string;
  level: CourseLevel;
  cover: CourseCover;
  outcomes: string[];
  skills: string[];
  /** A Test Center quiz as the final exam; null for none (then no certificate). */
  finalExam: CourseFinalExam | null;
  status: CourseStatus;
}

export interface DraftModule {
  id: string;
  title: string;
  lessonIds: string[];
}

export interface DraftLesson {
  id: string;
  title: string;
  minutes: number;
  blocks: LessonBlock[];
}

export type BuilderSelection = { kind: 'details' } | { kind: 'lesson'; id: string };

interface BuilderState {
  organizationId: string | null;
  providerName: string;
  courseId: string | null;
  isNew: boolean;
  details: DraftDetails;
  modules: DraftModule[];
  lessons: Record<string, DraftLesson>;
  /** Lessons saved before and removed since, deleted on the next save. */
  removedLessonIds: string[];
  savedLessonIds: string[];
  selection: BuilderSelection;
  /** Who submitted the course for review, and the manager's note when sent back. */
  review: CourseReview | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const EMPTY_DETAILS: DraftDetails = {
  title: '',
  summary: '',
  description: '',
  topic: '',
  level: 'beginner',
  cover: 'teal',
  outcomes: [],
  skills: [],
  finalExam: null,
  status: 'draft',
};

const initialState: BuilderState = {
  organizationId: null,
  providerName: 'Zebron',
  courseId: null,
  isNew: true,
  details: EMPTY_DETAILS,
  modules: [],
  lessons: {},
  removedLessonIds: [],
  savedLessonIds: [],
  selection: { kind: 'details' },
  review: null,
  dirty: false,
  loading: false,
  saving: false,
  error: null,
};

const MAX_BLOCKS = 60;

export function randomId(length = 8): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (value) => alphabet[value % alphabet.length]).join('');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function emptyBlock(type: LessonBlockType): LessonBlock {
  switch (type) {
    case 'text':
      return { type: 'text', text: '' };
    case 'tip':
      return { type: 'tip', text: '' };
    case 'video':
      return { type: 'video', url: '', caption: '', start: 0 };
    case 'audio':
      return { type: 'audio', url: '', caption: '' };
    case 'document':
      return { type: 'document', url: '', title: '', caption: '' };
    case 'image':
      return { type: 'image', url: '', alt: '', caption: '' };
    case 'check':
      return { type: 'check', question: '', options: ['', ''], answer: 0, explanation: '' };
  }
}

/** Problems that stop a course from being published, in reading order. */
function publishProblems(details: DraftDetails, modules: DraftModule[], lessonMap: Record<string, DraftLesson>): string[] {
  const problems: string[] = [];
  const lessons = modules.flatMap((module) => module.lessonIds.map((id) => lessonMap[id])).filter(Boolean);

  if (!details.title.trim()) {
    problems.push('Give the course a title.');
  }
  if (!lessons.length) {
    problems.push('Add at least one lesson.');
  }
  if (details.finalExam && !details.finalExam.quizId) {
    problems.push('Choose the Test Center quiz for the final exam, or switch the final exam off.');
  }

  for (const lesson of lessons) {
    const name = lesson.title.trim() || 'Untitled lesson';
    if (!lesson.blocks.length) {
      problems.push(`"${name}" has no content yet.`);
    }
    lesson.blocks.forEach((block) => {
      if (block.type === 'check') {
        const options = block.options.map((option) => option.trim());
        if (!block.question.trim() || options.filter(Boolean).length < 2 || !options[block.answer]) {
          problems.push(`"${name}": finish its quick check (a question, two answers and the right one marked).`);
        }
      }
      if ((block.type === 'video' || block.type === 'audio' || block.type === 'document' || block.type === 'image') && !/^https:\/\//i.test(block.url.trim())) {
        problems.push(`"${name}": a ${block.type} block needs an https:// link.`);
      }
    });
  }

  return [...new Set(problems)];
}

/** Clean a block for saving: trim text, drop empty answer options. */
function cleanBlock(block: LessonBlock): LessonBlock {
  switch (block.type) {
    case 'text':
    case 'tip':
      return { type: block.type, text: block.text.trim() };
    case 'video':
      return { type: 'video', url: block.url.trim(), caption: block.caption?.trim() ?? '', start: Math.max(0, Math.floor(block.start ?? 0)) };
    case 'audio':
      return { type: 'audio', url: block.url.trim(), caption: block.caption?.trim() ?? '' };
    case 'document':
      return { type: 'document', url: block.url.trim(), title: block.title?.trim() ?? '', caption: block.caption?.trim() ?? '' };
    case 'image':
      return { type: 'image', url: block.url.trim(), alt: block.alt.trim(), caption: block.caption?.trim() ?? '' };
    case 'check': {
      const kept = block.options.map((option, index) => ({ option: option.trim(), index })).filter((item) => item.option);
      const answer = Math.max(0, kept.findIndex((item) => item.index === block.answer));
      return {
        type: 'check',
        question: block.question.trim(),
        options: kept.map((item) => item.option),
        answer,
        explanation: block.explanation?.trim() ?? '',
      };
    }
  }
}

function message(error: unknown, fallback: string): string {
  return (error as { code?: string })?.code === 'permission-denied'
    ? 'You do not have permission to change this course.'
    : fallback;
}

/**
 * The course being edited in the builder: details, modules, lessons and
 * their blocks, held as a draft until Save. Provided by the builder page.
 */
export const CourseBuilderStore = signalStore(
  withState(initialState),

  withComputed((store) => ({
    selectedLesson: computed(() => {
      const selection = store.selection();
      return selection.kind === 'lesson' ? store.lessons()[selection.id] ?? null : null;
    }),

    lessonCount: computed(() => store.modules().reduce((total, module) => total + module.lessonIds.length, 0)),

    totalMinutes: computed(() =>
      store
        .modules()
        .flatMap((module) => module.lessonIds)
        .reduce((total, id) => total + (store.lessons()[id]?.minutes ?? 0), 0),
    ),

    problems: computed(() => publishProblems(store.details(), store.modules(), store.lessons())),
  })),

  withMethods((store) => {
    const service = inject(CourseService);
    const auth = inject(AuthService);
    const logger = inject(LoggerService);

    const changed = (changes: Partial<BuilderState>) => patchState(store, { ...changes, dirty: true });

    const updateLesson = (lessonId: string, update: (lesson: DraftLesson) => DraftLesson) => {
      const lesson = store.lessons()[lessonId];
      if (lesson) {
        changed({ lessons: { ...store.lessons(), [lessonId]: update(lesson) } });
      }
    };

    const updateBlocks = (lessonId: string, update: (blocks: LessonBlock[]) => LessonBlock[]) =>
      updateLesson(lessonId, (lesson) => ({ ...lesson, blocks: update(lesson.blocks) }));

    const move = <T>(items: T[], index: number, delta: number): T[] => {
      const target = index + delta;
      if (index < 0 || target < 0 || target >= items.length) {
        return items;
      }
      const copy = [...items];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    };

    const newLesson = (title: string): DraftLesson => ({ id: randomId(), title, minutes: 5, blocks: [emptyBlock('text')] });

    return {
      /** Start a new course: one module with one empty lesson. */
      startNew(organizationId: string | null, providerName: string): void {
        const lesson = newLesson('Introduction');
        patchState(store, {
          ...initialState,
          organizationId,
          providerName,
          modules: [{ id: randomId(), title: 'Getting started', lessonIds: [lesson.id] }],
          lessons: { [lesson.id]: lesson },
          selection: { kind: 'details' },
        });
      },

      async load(organizationId: string | null, providerName: string, courseId: string): Promise<void> {
        patchState(store, { ...initialState, organizationId, providerName, loading: true });

        try {
          const result = await service.getForEditing(organizationId, courseId);
          if (!result) {
            patchState(store, { error: 'This course was not found.' });
            return;
          }

          const { course, lessons } = result;
          const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));

          patchState(store, {
            courseId: course.id,
            isNew: false,
            review: course.review,
            providerName: course.providerName || providerName,
            details: {
              title: course.title,
              summary: course.summary,
              description: course.description,
              topic: course.topic,
              level: course.level,
              cover: course.cover,
              outcomes: course.outcomes,
              skills: course.skills,
              finalExam: course.finalExam,
              status: course.status,
            },
            modules: course.modules.map((module) => ({
              id: module.id,
              title: module.title,
              lessonIds: module.lessons.map((lesson) => lesson.id),
            })),
            lessons: Object.fromEntries(
              course.modules
                .flatMap((module) => module.lessons)
                .map((outline) => {
                  const lesson = byId.get(outline.id);
                  return [
                    outline.id,
                    { id: outline.id, title: lesson?.title || outline.title, minutes: lesson?.minutes ?? outline.minutes, blocks: lesson?.blocks ?? [] },
                  ];
                }),
            ),
            savedLessonIds: lessons.map((lesson) => lesson.id),
            dirty: false,
          });
        } catch (error) {
          logger.error('CourseBuilderStore', 'Could not load the course for editing.', error);
          patchState(store, { error: message(error, 'The course could not be loaded. Try again.') });
        } finally {
          patchState(store, { loading: false });
        }
      },

      select(selection: BuilderSelection): void {
        patchState(store, { selection });
      },

      // ---------- Details ----------

      patchDetails(changes: Partial<DraftDetails>): void {
        changed({ details: { ...store.details(), ...changes } });
      },

      // ---------- Modules ----------

      addModule(): void {
        const lesson = newLesson('New lesson');
        changed({
          modules: [...store.modules(), { id: randomId(), title: `Module ${store.modules().length + 1}`, lessonIds: [lesson.id] }],
          lessons: { ...store.lessons(), [lesson.id]: lesson },
          selection: { kind: 'lesson', id: lesson.id },
        });
      },

      renameModule(moduleId: string, title: string): void {
        changed({ modules: store.modules().map((module) => (module.id === moduleId ? { ...module, title } : module)) });
      },

      moveModule(moduleId: string, delta: number): void {
        const index = store.modules().findIndex((module) => module.id === moduleId);
        changed({ modules: move(store.modules(), index, delta) });
      },

      removeModule(moduleId: string): void {
        const module = store.modules().find((item) => item.id === moduleId);
        if (!module) {
          return;
        }

        const lessons = { ...store.lessons() };
        module.lessonIds.forEach((id) => delete lessons[id]);
        const saved = new Set(store.savedLessonIds());
        const selection = store.selection();

        changed({
          modules: store.modules().filter((item) => item.id !== moduleId),
          lessons,
          removedLessonIds: [...store.removedLessonIds(), ...module.lessonIds.filter((id) => saved.has(id))],
          selection: selection.kind === 'lesson' && module.lessonIds.includes(selection.id) ? { kind: 'details' } : selection,
        });
      },

      // ---------- Lessons ----------

      addLesson(moduleId: string): void {
        const lesson = newLesson('New lesson');
        changed({
          modules: store.modules().map((module) =>
            module.id === moduleId ? { ...module, lessonIds: [...module.lessonIds, lesson.id] } : module,
          ),
          lessons: { ...store.lessons(), [lesson.id]: lesson },
          selection: { kind: 'lesson', id: lesson.id },
        });
      },

      patchLesson(lessonId: string, changes: Partial<Pick<DraftLesson, 'title' | 'minutes'>>): void {
        updateLesson(lessonId, (lesson) => ({ ...lesson, ...changes }));
      },

      /** Move a lesson up or down; at a module's edge it moves into the next module. */
      moveLesson(lessonId: string, delta: number): void {
        const modules = store.modules().map((module) => ({ ...module, lessonIds: [...module.lessonIds] }));
        const moduleIndex = modules.findIndex((module) => module.lessonIds.includes(lessonId));
        if (moduleIndex < 0) {
          return;
        }

        const ids = modules[moduleIndex].lessonIds;
        const index = ids.indexOf(lessonId);
        const target = index + delta;

        if (target >= 0 && target < ids.length) {
          modules[moduleIndex].lessonIds = move(ids, index, delta);
        } else {
          const nextModule = modules[moduleIndex + delta];
          if (!nextModule) {
            return;
          }
          ids.splice(index, 1);
          if (delta < 0) {
            nextModule.lessonIds.push(lessonId);
          } else {
            nextModule.lessonIds.unshift(lessonId);
          }
        }

        changed({ modules });
      },

      removeLesson(lessonId: string): void {
        const lessons = { ...store.lessons() };
        delete lessons[lessonId];
        const selection = store.selection();

        changed({
          modules: store.modules().map((module) => ({ ...module, lessonIds: module.lessonIds.filter((id) => id !== lessonId) })),
          lessons,
          removedLessonIds: store.savedLessonIds().includes(lessonId)
            ? [...store.removedLessonIds(), lessonId]
            : store.removedLessonIds(),
          selection: selection.kind === 'lesson' && selection.id === lessonId ? { kind: 'details' } : selection,
        });
      },

      // ---------- Blocks ----------

      addBlock(lessonId: string, type: LessonBlockType, index?: number): void {
        updateBlocks(lessonId, (blocks) => {
          if (blocks.length >= MAX_BLOCKS) {
            return blocks;
          }
          const copy = [...blocks];
          copy.splice(index ?? copy.length, 0, emptyBlock(type));
          return copy;
        });
      },

      updateBlock(lessonId: string, index: number, block: LessonBlock): void {
        if (!block || typeof block !== 'object' || !('type' in block)) {
          return;
        }
        updateBlocks(lessonId, (blocks) => blocks.map((item, position) => (position === index ? block : item)));
      },

      moveBlock(lessonId: string, index: number, delta: number): void {
        updateBlocks(lessonId, (blocks) => move(blocks, index, delta));
      },

      removeBlock(lessonId: string, index: number): void {
        updateBlocks(lessonId, (blocks) => blocks.filter((_, position) => position !== index));
      },

      // ---------- Saving ----------

      /**
       * Save the draft. The other actions also change the status:
       *   publish    -> published (managers; approves a course in review)
       *   unpublish  -> draft (managers)
       *   submit     -> in_review (staff: ask a manager to publish)
       *   withdraw   -> draft (take a submitted course back)
       *   sendBack   -> draft with the manager's note (managers)
       * Returns the course id (new courses get one on their first save).
       */
      async save(
        action: 'save' | 'publish' | 'unpublish' | 'submit' | 'withdraw' | 'sendBack' = 'save',
        note: string | null = null,
      ): Promise<string | null> {
        if (store.saving()) {
          return null;
        }

        // A published course is live, and a submitted one should be ready to go live.
        const goingLive =
          action === 'publish' || action === 'submit' || (action === 'save' && store.details().status === 'published');
        if (goingLive && store.problems().length) {
          patchState(store, { error: store.problems()[0] });
          return null;
        }

        const details = store.details();
        const title = details.title.trim() || 'Untitled course';
        patchState(store, { saving: true, error: null });

        try {
          const organizationId = store.organizationId();
          let courseId = store.courseId();

          if (!courseId) {
            const base = slugify(title) || 'course';
            courseId = base;
            while (await service.courseExists(organizationId, courseId)) {
              courseId = `${base}-${randomId(4)}`;
            }
          }

          let order = 0;
          const lessons: { id: string; data: Record<string, unknown> }[] = [];
          const modules = store.modules().map((module) => ({
            id: module.id,
            title: module.title.trim() || 'Untitled module',
            lessons: module.lessonIds
              .map((id) => store.lessons()[id])
              .filter((lesson): lesson is DraftLesson => !!lesson)
              .map((lesson) => {
                order += 1;
                const blocks = lesson.blocks.map(cleanBlock);
                const minutes = Math.max(1, Math.min(600, Math.round(lesson.minutes || 1)));
                const lessonTitle = lesson.title.trim() || 'Untitled lesson';
                lessons.push({ id: lesson.id, data: { title: lessonTitle, moduleId: module.id, order, minutes, blocks } });
                return { id: lesson.id, title: lessonTitle, minutes, hasCheck: blocks.some((block) => block.type === 'check') };
              }),
          }));

          const status: CourseStatus =
            action === 'publish'
              ? 'published'
              : action === 'submit'
                ? 'in_review'
                : action === 'unpublish' || action === 'withdraw' || action === 'sendBack'
                  ? 'draft'
                  : details.status;
          const user = auth.firebaseUser();
          const userName = auth.user()?.displayName?.trim() || user?.displayName || user?.email || '';
          const review =
            action === 'submit'
              ? { submit: { by: user?.uid ?? '', name: userName } }
              : action === 'sendBack' || (action === 'publish' && details.status === 'in_review')
                ? { decision: { by: user?.uid ?? '', name: userName, note: action === 'sendBack' ? (note?.trim().slice(0, 1000) || null) : null } }
                : undefined;

          await service.saveCourse(
            organizationId,
            courseId,
            {
              title,
              summary: details.summary.trim(),
              description: details.description.trim(),
              topic: details.topic.trim(),
              level: details.level,
              cover: details.cover,
              outcomes: details.outcomes.map((item) => item.trim()).filter(Boolean),
              skills: details.skills.map((item) => item.trim()).filter(Boolean),
              finalExam: details.finalExam?.quizId ? details.finalExam : null,
              modules,
              lessonCount: lessons.length,
              estimatedMinutes: lessons.reduce((total, lesson) => total + Number(lesson.data['minutes']), 0),
              status,
              providerName: store.providerName(),
              ...(store.isNew() ? { authorId: user?.uid ?? '', authorName: auth.user()?.displayName?.trim() || user?.displayName || '' } : {}),
            },
            lessons,
            store.removedLessonIds(),
            { isNew: store.isNew(), publishing: action === 'publish' && details.status !== 'published', review },
          );

          patchState(store, {
            courseId,
            isNew: false,
            details: { ...details, title, status },
            review:
              action === 'submit'
                ? { submittedBy: user?.uid ?? null, submittedByName: userName, submittedAt: null, note: null, reviewedBy: null, reviewedByName: null, reviewedAt: null }
                : review?.decision
                  ? { ...(store.review() ?? { submittedBy: null, submittedByName: null, submittedAt: null }), note: review.decision.note, reviewedBy: review.decision.by, reviewedByName: userName, reviewedAt: null }
                  : store.review(),
            savedLessonIds: lessons.map((lesson) => lesson.id),
            removedLessonIds: [],
            dirty: false,
          });

          return courseId;
        } catch (error) {
          logger.error('CourseBuilderStore', 'Could not save the course.', error);
          patchState(store, { error: message(error, 'The course could not be saved. Try again.') });
          return null;
        } finally {
          patchState(store, { saving: false });
        }
      },

      async deleteCourse(): Promise<boolean> {
        const courseId = store.courseId();
        if (!courseId) {
          return true;
        }

        patchState(store, { saving: true, error: null });
        try {
          await service.deleteCourse(store.organizationId(), courseId);
          patchState(store, { dirty: false });
          return true;
        } catch (error) {
          logger.error('CourseBuilderStore', 'Could not delete the course.', error);
          patchState(store, { error: message(error, 'The course could not be deleted. Try again.') });
          return false;
        } finally {
          patchState(store, { saving: false });
        }
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);

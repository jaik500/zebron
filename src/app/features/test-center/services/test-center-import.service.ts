import { Injectable, inject } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestCourse } from '../models/test-course.model';
import { TestProgram } from '../models/test-program.model';
import { TestQuestion } from '../models/test-question.model';
import { TestTopic } from '../models/test-topic.model';

import { TestCourseService } from './test-course.service';
import { TestProgramService } from './test-program.service';
import { TestQuestionService } from './test-question.service';
import { TestTopicService } from './test-topic.service';
import {
  COLUMN_ALIASES,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  ImportDefaults,
  ImportPlan,
  ImportProgress,
  ImportResult,
  ImportRow,
  ImportRowError,
  OPTION_LETTERS,
  PlannedCourse,
  PlannedProgram,
  PlannedQuestion,
  PlannedTopic,
  TEMPLATE_COLUMNS,
  collectImportRow,
  csvCell,
  isRecord,
  keyOf,
  normalizeHeader,
  normalizeKeys,
  parseCsvTable,
  slugify,
  str,
  toOptions,
} from './test-center-import.utils';

export * from './test-center-import.utils';

/** Parallel Firestore writes. Each write is checked by security rules on its own. */
const WRITE_CONCURRENCY = 8;


/**
 * Imports programs, courses, topics and questions into an
 * organization's Test Center from a CSV or JSON file.
 *
 * Flow:
 * 1. parseFile()  -> rows + row errors (nothing touches Firestore)
 * 2. buildPlan()  -> matches rows to existing programs/courses/topics/questions
 * 3. runImport()  -> creates what is missing, updates repeated questions
 *
 * Re-importing the same file updates questions instead of duplicating
 * them: each question is matched by its "id" column when present,
 * otherwise by its text within the same topic.
 *
 * Writes go through the same Firestore rules as manual editing, so
 * only managers, admins and owners (and platform admins) can import.
 */
@Injectable({
  providedIn: 'root',
})
export class TestCenterImportService {
  private readonly programService = inject(TestProgramService);
  private readonly courseService = inject(TestCourseService);
  private readonly topicService = inject(TestTopicService);
  private readonly questionService = inject(TestQuestionService);

  // ============================================================
  // TEMPLATE
  // ============================================================

  /** CSV template with two example rows (multiple choice and true/false). */
  buildTemplateCsv(): string {
    const examples = [
      {
        program: 'Onboarding',
        course: 'Workplace Safety',
        topic: 'Fire Safety',
        question: 'What should you do first when the fire alarm sounds?',
        type: 'multiple-choice',
        option_a: 'Finish your current task',
        option_b: 'Leave by the nearest safe exit',
        option_c: 'Use the elevator',
        option_d: 'Wait for instructions by email',
        correct_answer: 'b',
        explanation: 'Evacuate immediately using the nearest safe exit. Never use elevators.',
        hint: 'Think about getting out quickly and safely.',
        difficulty: 'easy',
        tags: 'safety;evacuation',
      },
      {
        program: 'Onboarding',
        course: 'Workplace Safety',
        topic: 'Fire Safety',
        question: 'Fire doors may be propped open on hot days.',
        type: 'true-false',
        correct_answer: 'false',
        explanation: 'Fire doors must stay closed so they can slow the spread of fire and smoke.',
        difficulty: 'easy',
        tags: 'safety',
      },
    ];

    const lines = [
      TEMPLATE_COLUMNS.join(','),
      ...examples.map((example) =>
        TEMPLATE_COLUMNS.map((column) =>
          csvCell((example as Record<string, string>)[column] ?? ''),
        ).join(','),
      ),
    ];

    // BOM so Excel opens the file as UTF-8.
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  // ============================================================
  // 1. PARSE
  // ============================================================

  async parseFile(file: File): Promise<{ rows: ImportRow[]; errors: ImportRowError[] }> {
    if (file.size > IMPORT_MAX_FILE_BYTES) {
      throw new Error('The file is larger than 5 MB. Split it into smaller files.');
    }

    const name = file.name.toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      throw new Error(
        'Excel files are not supported directly. In Excel, choose File → Save As → CSV UTF-8, then import the .csv file.',
      );
    }

    const text = (await file.text()).replace(/^﻿/, '');

    if (!text.trim()) {
      throw new Error('The file is empty.');
    }

    const result =
      name.endsWith('.json') || /^\s*[[{]/.test(text)
        ? this.parseJson(text)
        : this.parseCsv(text);

    if (result.rows.length === 0 && result.errors.length === 0) {
      throw new Error('The file contains no questions.');
    }

    if (result.rows.length + result.errors.length > IMPORT_MAX_ROWS) {
      throw new Error(
        `The file has more than ${IMPORT_MAX_ROWS} questions. Split it into smaller files.`,
      );
    }

    return result;
  }

  private parseCsv(text: string): { rows: ImportRow[]; errors: ImportRowError[] } {
    const table = parseCsvTable(text);

    if (table.length < 2) {
      throw new Error('The CSV file needs a header row and at least one question row.');
    }

    const header = table[0].map((cell) => normalizeHeader(cell));
    const columnIndex = new Map<string, number>();

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      const index = header.findIndex((cell) => aliases.includes(cell));

      if (index >= 0) {
        columnIndex.set(field, index);
      }
    }

    if (!columnIndex.has('question')) {
      throw new Error('The CSV file must have a "question" column. Download the template to see the format.');
    }

    if (!columnIndex.has('correctAnswer')) {
      throw new Error('The CSV file must have a "correct_answer" column. Download the template to see the format.');
    }

    const rows: ImportRow[] = [];
    const errors: ImportRowError[] = [];

    table.slice(1).forEach((cells, index) => {
      const line = index + 2;

      if (cells.every((cell) => !cell.trim())) {
        return;
      }

      const value = (field: string): string => {
        const column = columnIndex.get(field);
        return column === undefined ? '' : (cells[column] ?? '').trim();
      };

      const options = OPTION_LETTERS.map((letter) => ({
        id: letter,
        text: value(`option${letter.toUpperCase()}`),
      })).filter((option) => option.text);

      collectImportRow(
        {
          line,
          externalId: value('externalId'),
          program: value('program'),
          programDescription: value('programDescription'),
          course: value('course'),
          courseDescription: value('courseDescription'),
          provider: value('provider'),
          topic: value('topic'),
          topicDescription: value('topicDescription'),
          question: value('question'),
          type: value('type'),
          options,
          correctAnswer: value('correctAnswer'),
          explanation: value('explanation'),
          hint: value('hint'),
          difficulty: value('difficulty'),
          tags: value('tags'),
        },
        rows,
        errors,
      );
    });

    return { rows, errors };
  }

  /**
   * Accepts either:
   * - an array of row objects using the CSV column names, or
   * - the existing Zebron question-bank format
   *   { course?, topics: [{ key, name, ... }], questions: [...] }.
   */
  private parseJson(text: string): { rows: ImportRow[]; errors: ImportRowError[] } {
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The file contains invalid JSON.');
    }

    const rows: ImportRow[] = [];
    const errors: ImportRowError[] = [];

    if (Array.isArray(parsed)) {
      parsed.forEach((item, index) => {
        const record = isRecord(item) ? normalizeKeys(item) : {};
        const get = (field: string): unknown => {
          for (const alias of COLUMN_ALIASES[field] ?? [field]) {
            if (alias in record) {
              return record[alias];
            }
          }
          return undefined;
        };

        const options = Array.isArray(record['options'])
          ? toOptions(record['options'])
          : OPTION_LETTERS.map((letter) => ({
              id: letter,
              text: str(get(`option${letter.toUpperCase()}`)),
            })).filter((option) => option.text);

        collectImportRow(
          {
            line: index + 1,
            externalId: str(get('externalId')),
            program: str(get('program')),
            programDescription: str(get('programDescription')),
            course: str(get('course')),
            courseDescription: str(get('courseDescription')),
            provider: str(get('provider')),
            topic: str(get('topic')),
            topicDescription: str(get('topicDescription')),
            question: str(get('question')),
            type: str(get('type')),
            options,
            correctAnswer: str(get('correctAnswer')),
            explanation: str(get('explanation')),
            hint: str(get('hint')),
            difficulty: str(get('difficulty')),
            tags: Array.isArray(get('tags')) ? (get('tags') as unknown[]).map(str).join(';') : str(get('tags')),
          },
          rows,
          errors,
        );
      });

      return { rows, errors };
    }

    if (isRecord(parsed) && Array.isArray(parsed['questions'])) {
      const course = isRecord(parsed['course']) ? parsed['course'] : {};
      const topics = Array.isArray(parsed['topics']) ? parsed['topics'] : [];

      const topicsByKey = new Map<string, Record<string, unknown>>();

      for (const topic of topics) {
        if (isRecord(topic) && str(topic['key'])) {
          topicsByKey.set(str(topic['key']), topic);
        }
      }

      (parsed['questions'] as unknown[]).forEach((item, index) => {
        const record = isRecord(item) ? item : {};
        const topic = topicsByKey.get(str(record['topicKey'])) ?? {};

        collectImportRow(
          {
            line: index + 1,
            externalId: str(record['seedId']) || str(record['id']),
            program: str(record['program']),
            programDescription: '',
            course: str(record['course']) || str(course['name']),
            courseDescription: str(course['description']),
            provider: str(course['provider']),
            topic: str(topic['name']) || str(record['topic']) || str(record['topicKey']),
            topicDescription: str(topic['description']),
            question: str(record['question']),
            type: str(record['type']),
            options: toOptions(record['options']),
            correctAnswer: str(record['correctAnswer']),
            explanation: str(record['explanation']),
            hint: str(record['hint']),
            difficulty: str(record['difficulty']),
            tags: Array.isArray(record['tags']) ? record['tags'].map(str).join(';') : str(record['tags']),
          },
          rows,
          errors,
        );
      });

      return { rows, errors };
    }

    throw new Error(
      'Unrecognized JSON. Use a list of questions with the template column names, or a Zebron question bank with "topics" and "questions".',
    );
  }

  // ============================================================
  // 2. PLAN
  // ============================================================

  async buildPlan(
    organizationId: string,
    fileName: string,
    rows: ImportRow[],
    parseErrors: ImportRowError[],
    defaults: ImportDefaults,
  ): Promise<ImportPlan> {
    const [programs, courses] = await Promise.all([
      this.programService.getOrganizationPrograms(organizationId),
      this.courseService.getAllCourses(organizationId),
    ]);

    const errors: ImportRowError[] = [...parseErrors];

    const programsByKey = new Map<string, PlannedProgram>();
    const coursesByKey = new Map<string, PlannedCourse>();
    const topicsByKey = new Map<string, PlannedTopic>();

    const findProgram = (name: string): TestProgram | null =>
      programs.find(
        (program) => keyOf(program.name) === keyOf(name) || program.slug === slugify(name),
      ) ?? null;

    const findCourse = (name: string): TestCourse | null =>
      courses.find(
        (course) => keyOf(course.name) === keyOf(name) || course.slug === slugify(name),
      ) ?? null;

    const defaultCourse = defaults.courseId
      ? courses.find((course) => course.id === defaults.courseId) ?? null
      : null;

    const defaultProgram = defaults.programId
      ? programs.find((program) => program.id === defaults.programId) ?? null
      : null;

    const planned: Array<{ row: ImportRow; courseKey: string; topicKey: string }> = [];

    for (const row of rows) {
      // ---------------- Course ----------------
      const courseName = row.course || defaultCourse?.name || '';

      if (!courseName) {
        errors.push({
          line: row.line,
          message: 'No course. Fill in the "course" column or choose a course to import into.',
        });
        continue;
      }

      const courseKey = keyOf(courseName);
      let course = coursesByKey.get(courseKey);

      if (!course) {
        const existing = row.course ? findCourse(row.course) : defaultCourse;
        let programKey: string | null = null;

        if (!existing) {
          // A new course needs a program.
          const programName = row.program || defaultProgram?.name || '';

          if (!programName) {
            errors.push({
              line: row.line,
              message: `"${courseName}" is a new course and needs a program. Fill in the "program" column or choose a default program.`,
            });
            continue;
          }

          programKey = keyOf(programName);

          if (!programsByKey.has(programKey)) {
            programsByKey.set(programKey, {
              key: programKey,
              name: programName,
              description: row.programDescription,
              existing: row.program ? findProgram(row.program) : defaultProgram,
            });
          }
        }

        course = {
          key: courseKey,
          name: existing?.name ?? courseName,
          description: row.courseDescription,
          provider: row.provider,
          programKey,
          existing,
        };

        coursesByKey.set(courseKey, course);
      }

      // ---------------- Topic ----------------
      const topicName = row.topic || defaults.topicName.trim();

      if (!topicName) {
        errors.push({
          line: row.line,
          message: 'No topic. Fill in the "topic" column or set a default topic.',
        });
        continue;
      }

      const topicKey = `${courseKey}|${keyOf(topicName)}`;

      if (!topicsByKey.has(topicKey)) {
        topicsByKey.set(topicKey, {
          key: topicKey,
          courseKey,
          name: topicName,
          description: row.topicDescription,
          existing: null,
        });
      }

      planned.push({ row, courseKey, topicKey });
    }

    // ---------------- Existing topics and questions ----------------
    const existingCourses = [...coursesByKey.values()].filter((course) => course.existing);

    const existingByCourse = new Map<
      string,
      { topics: TestTopic[]; questions: TestQuestion[] }
    >();

    await Promise.all(
      existingCourses.map(async (course) => {
        const courseId = course.existing!.id;
        const [topics, questions] = await Promise.all([
          this.topicService.getAllTopics(organizationId, courseId),
          this.questionService.getAllQuestionsForCourse(organizationId, courseId),
        ]);

        existingByCourse.set(course.key, { topics, questions });
      }),
    );

    for (const topic of topicsByKey.values()) {
      const existing = existingByCourse.get(topic.courseKey);

      topic.existing =
        existing?.topics.find(
          (item) => keyOf(item.name) === keyOf(topic.name) || item.slug === slugify(topic.name),
        ) ?? null;

      if (topic.existing) {
        topic.name = topic.existing.name;
      }
    }

    // ---------------- Questions ----------------
    const seen = new Set<string>();
    let duplicatesInFile = 0;
    const questions: PlannedQuestion[] = [];

    for (const item of planned) {
      const topic = topicsByKey.get(item.topicKey)!;

      const importKey = item.row.externalId
        ? `id:${item.row.externalId.toLowerCase()}`
        : `q:${item.topicKey}|${keyOf(item.row.question)}`;

      const fileKey = `${item.courseKey}|${importKey}`;

      if (seen.has(fileKey)) {
        duplicatesInFile++;
        continue;
      }

      seen.add(fileKey);

      let existingId: string | null = null;
      const existing = existingByCourse.get(item.courseKey);

      if (existing && topic.existing) {
        const match = existing.questions.find((question) => {
          const stored = (question as TestQuestion & { importKey?: string }).importKey;

          if (stored && stored === importKey) {
            return question.topicId === topic.existing!.id;
          }

          // Questions created by hand: same text in the same topic.
          return (
            question.topicId === topic.existing!.id &&
            keyOf(question.question) === keyOf(item.row.question)
          );
        });

        existingId = match?.id ?? null;
      }

      questions.push({
        row: item.row,
        courseKey: item.courseKey,
        topicKey: item.topicKey,
        importKey,
        existingId,
      });
    }

    errors.sort((a, b) => a.line - b.line);

    return {
      fileName,
      totalRows: rows.length + parseErrors.length,
      programs: [...programsByKey.values()],
      courses: [...coursesByKey.values()],
      topics: [...topicsByKey.values()],
      questions,
      errors,
      duplicatesInFile,
      defaults,
    };
  }

  // ============================================================
  // 3. RUN
  // ============================================================

  async runImport(
    organizationId: string,
    plan: ImportPlan,
    onProgress: (progress: ImportProgress) => void = () => undefined,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      programsCreated: 0,
      coursesCreated: 0,
      topicsCreated: 0,
      questionsCreated: 0,
      questionsUpdated: 0,
      failed: 0,
      errors: [],
    };

    const programIds = new Map<string, string>();
    const courseIds = new Map<string, string>();
    const topicIds = new Map<string, string>();

    // ---------------- Programs ----------------
    const newPrograms = plan.programs.filter((program) => !program.existing);

    for (const program of plan.programs) {
      if (program.existing) {
        programIds.set(program.key, program.existing.id);
      }
    }

    for (const [index, program] of newPrograms.entries()) {
      onProgress({ stage: 'programs', done: index, total: newPrograms.length });

      try {
        programIds.set(program.key, await this.createProgram(organizationId, program));
        result.programsCreated++;
      } catch (error) {
        result.errors.push(`Program "${program.name}": ${message(error)}`);
      }
    }

    // ---------------- Courses ----------------
    const newCourses = plan.courses.filter((course) => !course.existing);

    for (const course of plan.courses) {
      if (course.existing) {
        courseIds.set(course.key, course.existing.id);
      }
    }

    for (const [index, course] of newCourses.entries()) {
      onProgress({ stage: 'courses', done: index, total: newCourses.length });

      const programId = course.programKey ? programIds.get(course.programKey) : undefined;

      if (!programId) {
        result.errors.push(`Course "${course.name}": its program could not be created.`);
        continue;
      }

      try {
        const id = await this.courseService.createCourse(organizationId, {
          name: course.name,
          slug: slugify(course.name),
          description: course.description,
          provider: course.provider || undefined,
          type: 'course',
          active: true,
          programId,
        });

        courseIds.set(course.key, id);
        result.coursesCreated++;
      } catch (error) {
        result.errors.push(`Course "${course.name}": ${message(error)}`);
      }
    }

    // ---------------- Topics ----------------
    const newTopics = plan.topics.filter((topic) => !topic.existing);
    const nextSortOrder = new Map<string, number>();

    for (const topic of plan.topics) {
      if (topic.existing) {
        topicIds.set(topic.key, topic.existing.id);

        nextSortOrder.set(
          topic.courseKey,
          Math.max(nextSortOrder.get(topic.courseKey) ?? 0, topic.existing.sortOrder + 1),
        );
      }
    }

    for (const [index, topic] of newTopics.entries()) {
      onProgress({ stage: 'topics', done: index, total: newTopics.length });

      const courseId = courseIds.get(topic.courseKey);

      if (!courseId) {
        result.errors.push(`Topic "${topic.name}": its course could not be created.`);
        continue;
      }

      try {
        const sortOrder = nextSortOrder.get(topic.courseKey) ?? 0;
        nextSortOrder.set(topic.courseKey, sortOrder + 1);

        const id = await this.topicService.createTopic(organizationId, {
          scope: 'organization',
          organizationId,
          courseId,
          name: topic.name,
          slug: slugify(topic.name),
          description: topic.description,
          sortOrder,
          questionCount: 0,
          active: true,
        });

        topicIds.set(topic.key, id);
        result.topicsCreated++;
      } catch (error) {
        result.errors.push(`Topic "${topic.name}": ${message(error)}`);
      }
    }

    // ---------------- Questions ----------------
    const questionsCollection = collection(firestore, 'testQuestions');
    let done = 0;

    await runWithConcurrency(plan.questions, WRITE_CONCURRENCY, async (item) => {
      const courseId = courseIds.get(item.courseKey);
      const topicId = topicIds.get(item.topicKey);

      try {
        if (!courseId || !topicId) {
          throw new Error('its course or topic could not be created.');
        }

        const payload = {
          scope: 'organization',
          organizationId,
          courseId,
          topicId,
          question: item.row.question,
          type: item.row.type,
          options: item.row.options,
          correctAnswer: item.row.correctAnswer,
          explanation: item.row.explanation || null,
          hint: item.row.hint || null,
          difficulty: item.row.difficulty,
          tags: item.row.tags,
          sourceType: 'original',
          sourceReference: null,
          status: plan.defaults.status,
          importKey: item.importKey,
          updatedAt: serverTimestamp(),
        };

        if (item.existingId) {
          await setDoc(doc(questionsCollection, item.existingId), payload, { merge: true });
          result.questionsUpdated++;
        } else {
          await addDoc(questionsCollection, { ...payload, createdAt: serverTimestamp() });
          result.questionsCreated++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Line ${item.row.line}: ${message(error)}`);
      } finally {
        done++;
        onProgress({ stage: 'questions', done, total: plan.questions.length });
      }
    });

    // ---------------- Published question counts ----------------
    const touchedCourses = [...new Set(plan.questions.map((item) => courseIds.get(item.courseKey)))]
      .filter((id): id is string => Boolean(id));

    for (const [index, courseId] of touchedCourses.entries()) {
      onProgress({ stage: 'counts', done: index, total: touchedCourses.length });

      try {
        await this.refreshCounts(organizationId, courseId);
      } catch (error) {
        // Counts are display values; the questions are already saved.
        console.warn('[TestCenterImport] Could not refresh question counts.', error);
      }
    }

    return result;
  }

  /**
   * Program IDs are their slug, and slugs are shared by every
   * organization. If another organization already uses the slug,
   * retry with a short suffix.
   */
  private async createProgram(organizationId: string, program: PlannedProgram): Promise<string> {
    const slug = slugify(program.name);

    const create = (programSlug: string) =>
      this.programService.createProgram(organizationId, {
        name: program.name,
        slug: programSlug,
        description: program.description,
        active: true,
      });

    try {
      return await create(slug);
    } catch (error) {
      if (!isPermissionDenied(error)) {
        throw error;
      }

      const suffix = Math.random().toString(36).slice(2, 6);
      return await create(`${slug}-${suffix}`);
    }
  }

  private async refreshCounts(organizationId: string, courseId: string): Promise<void> {
    const [topics, questions] = await Promise.all([
      this.topicService.getAllTopics(organizationId, courseId),
      this.questionService.getAllQuestionsForCourse(organizationId, courseId),
    ]);

    const published = questions.filter((question) => question.status === 'published');
    const byTopic = new Map<string, number>();

    for (const question of published) {
      byTopic.set(question.topicId, (byTopic.get(question.topicId) ?? 0) + 1);
    }

    await Promise.all(
      topics.map((topic) =>
        updateDoc(doc(firestore, 'testTopics', topic.id), {
          questionCount: byTopic.get(topic.id) ?? 0,
          updatedAt: serverTimestamp(),
        }),
      ),
    );

    await updateDoc(doc(firestore, 'testCourses', courseId), {
      questionCount: published.length,
      updatedAt: serverTimestamp(),
    });
  }
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as { code: unknown }).code).includes('permission-denied')
  );
}

function message(error: unknown): string {
  if (isPermissionDenied(error)) {
    return 'you do not have permission to save this. Imports need a manager, admin or owner role.';
  }

  return error instanceof Error && error.message ? error.message : 'Unexpected error.';
}

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });

  await Promise.all(runners);
}

import {
  TestQuestionDifficulty,
  TestQuestionOption,
  TestQuestionStatus,
  TestQuestionType,
} from '../models/test-question.model';
import { Quiz } from '../models/quiz.model';
import { TestProgram } from '../models/test-program.model';
import { TestTopic } from '../models/test-topic.model';

/*
 * Pure helpers for the Test Center importer: types, CSV parsing,
 * row validation, and name matching. No Firebase imports, so they
 * can be unit-tested directly.
 */

// ============================================================
// PUBLIC TYPES
// ============================================================

/** One question as read from a file, before it is matched to Firestore. */
export interface ImportRow {
  /** 1-based line (CSV) or item number (JSON), for error messages. */
  line: number;
  externalId: string;
  program: string;
  programDescription: string;
  course: string;
  courseDescription: string;
  provider: string;
  topic: string;
  topicDescription: string;
  question: string;
  type: TestQuestionType;
  options: TestQuestionOption[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: TestQuestionDifficulty;
  tags: string[];
}

export interface ImportRowError {
  line: number;
  message: string;
}

/** Where rows without program/course/topic columns should go. */
export interface ImportDefaults {
  /** Existing program ID, used for new courses that name no program. */
  programId: string | null;
  /** Existing course ID, used for rows that name no course. */
  quizId: string | null;
  /** Topic name used for rows that name no topic. */
  topicName: string;
  /** Status given to new and updated questions. */
  status: Extract<TestQuestionStatus, 'draft' | 'published'>;
}

export interface PlannedProgram {
  key: string;
  name: string;
  description: string;
  existing: TestProgram | null;
}

export interface PlannedCourse {
  key: string;
  name: string;
  description: string;
  provider: string;
  programKey: string | null;
  existing: Quiz | null;
}

export interface PlannedTopic {
  key: string;
  courseKey: string;
  name: string;
  description: string;
  existing: TestTopic | null;
}

export interface PlannedQuestion {
  row: ImportRow;
  courseKey: string;
  topicKey: string;
  importKey: string;
  /** Existing question to update, when the same question was imported before. */
  existingId: string | null;
}

/** Everything the import will do, shown to the user before anything is written. */
export interface ImportPlan {
  fileName: string;
  totalRows: number;
  programs: PlannedProgram[];
  courses: PlannedCourse[];
  topics: PlannedTopic[];
  questions: PlannedQuestion[];
  /** Rows that will be skipped. The import can still run without them. */
  errors: ImportRowError[];
  /** Rows dropped because the file repeats the same question. */
  duplicatesInFile: number;
  defaults: ImportDefaults;
}

export interface ImportProgress {
  stage: 'programs' | 'courses' | 'topics' | 'questions' | 'counts';
  done: number;
  total: number;
}

export interface ImportResult {
  programsCreated: number;
  coursesCreated: number;
  topicsCreated: number;
  questionsCreated: number;
  questionsUpdated: number;
  failed: number;
  errors: string[];
}

// ============================================================
// LIMITS AND COLUMN NAMES
// ============================================================

export const IMPORT_MAX_ROWS = 2000;
export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;

export const OPTION_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;


/**
 * Accepted header names (lower-case, spaces/dashes as underscores).
 * The first name in each list is the one used in the template.
 */
export const COLUMN_ALIASES: Record<string, readonly string[]> = {
  externalId: ['id', 'question_id', 'external_id', 'key'],
  program: ['program', 'program_name'],
  programDescription: ['program_description'],
  course: ['course', 'course_name'],
  courseDescription: ['course_description'],
  provider: ['provider', 'course_provider'],
  topic: ['topic', 'topic_name'],
  topicDescription: ['topic_description'],
  question: ['question', 'question_text', 'prompt'],
  type: ['type', 'question_type'],
  optionA: ['option_a', 'a', 'answer_a', 'choice_a'],
  optionB: ['option_b', 'b', 'answer_b', 'choice_b'],
  optionC: ['option_c', 'c', 'answer_c', 'choice_c'],
  optionD: ['option_d', 'd', 'answer_d', 'choice_d'],
  optionE: ['option_e', 'e', 'answer_e', 'choice_e'],
  optionF: ['option_f', 'f', 'answer_f', 'choice_f'],
  correctAnswer: ['correct_answer', 'answer', 'correct'],
  explanation: ['explanation'],
  hint: ['hint'],
  difficulty: ['difficulty', 'level'],
  tags: ['tags'],
};

export const TEMPLATE_COLUMNS = [
  'program',
  'course',
  'topic',
  'question',
  'type',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'option_e',
  'option_f',
  'correct_answer',
  'explanation',
  'hint',
  'difficulty',
  'tags',
  'id',
  'program_description',
  'course_description',
  'topic_description',
  'provider',
];


/** Validates and normalizes one row, adding it to rows or errors. */
export function collectImportRow(
  raw: {
    line: number;
    externalId: string;
    program: string;
    programDescription: string;
    course: string;
    courseDescription: string;
    provider: string;
    topic: string;
    topicDescription: string;
    question: string;
    type: string;
    options: TestQuestionOption[];
    correctAnswer: string;
    explanation: string;
    hint: string;
    difficulty: string;
    tags: string;
  },
  rows: ImportRow[],
  errors: ImportRowError[],
): void {
  const fail = (message: string): void => {
    errors.push({ line: raw.line, message });
  };

  const question = raw.question.trim();

  if (!question) {
    fail('Question text is missing.');
    return;
  }

  const answer = raw.correctAnswer.trim();
  const typeText = raw.type.trim().toLowerCase().replace(/[\s_]+/g, '-');

  let type: TestQuestionType;

  if (['true-false', 'truefalse', 'tf', 'boolean', 'true/false'].includes(typeText)) {
    type = 'true-false';
  } else if (['', 'multiple-choice', 'multiplechoice', 'mc', 'mcq', 'single-choice'].includes(typeText)) {
    type =
      !typeText && raw.options.length === 0 && /^(true|false|t|f|yes|no)$/i.test(answer)
        ? 'true-false'
        : 'multiple-choice';
  } else {
    fail(`Unknown question type "${raw.type}". Use multiple-choice or true-false.`);
    return;
  }

  let options: TestQuestionOption[];
  let correctAnswer: string;

  if (type === 'true-false') {
    // Same shape as the built-in question banks: a = True, b = False.
    options = [
      { id: 'a', text: 'True' },
      { id: 'b', text: 'False' },
    ];

    const normalized = answer.toLowerCase();

    if (['true', 't', 'yes', 'y', 'a'].includes(normalized)) {
      correctAnswer = 'a';
    } else if (['false', 'f', 'no', 'n', 'b'].includes(normalized)) {
      correctAnswer = 'b';
    } else {
      fail(`Correct answer "${answer}" must be true or false.`);
      return;
    }
  } else {
    options = raw.options
      .map((option, index) => ({
        id: option.id?.trim().toLowerCase() || OPTION_LETTERS[index] || String(index + 1),
        text: option.text.trim(),
      }))
      .filter((option) => option.text);

    if (options.length < 2) {
      fail('Multiple-choice questions need at least two options.');
      return;
    }

    const ids = new Set(options.map((option) => option.id));

    if (ids.size !== options.length) {
      fail('Two options have the same letter.');
      return;
    }

    if (!answer) {
      fail('Correct answer is missing.');
      return;
    }

    const byLetter = options.find((option) => option.id === answer.toLowerCase());
    const byText = options.find(
      (option) => option.text.toLowerCase() === answer.toLowerCase(),
    );
    const match = byLetter ?? byText;

    if (!match) {
      fail(`Correct answer "${answer}" doesn't match any option. Use the option letter (a, b, c…) or its exact text.`);
      return;
    }

    correctAnswer = match.id;
  }

  const difficultyText = raw.difficulty.trim().toLowerCase();
  let difficulty: TestQuestionDifficulty = 'medium';

  if (difficultyText) {
    if (['easy', 'beginner', 'low', '1'].includes(difficultyText)) {
      difficulty = 'easy';
    } else if (['medium', 'intermediate', 'moderate', '2'].includes(difficultyText)) {
      difficulty = 'medium';
    } else if (['hard', 'advanced', 'difficult', 'high', '3'].includes(difficultyText)) {
      difficulty = 'hard';
    } else {
      fail(`Unknown difficulty "${raw.difficulty}". Use easy, medium or hard.`);
      return;
    }
  }

  rows.push({
    line: raw.line,
    externalId: raw.externalId.trim(),
    program: raw.program.trim(),
    programDescription: raw.programDescription.trim(),
    course: raw.course.trim(),
    courseDescription: raw.courseDescription.trim(),
    provider: raw.provider.trim(),
    topic: raw.topic.trim(),
    topicDescription: raw.topicDescription.trim(),
    question,
    type,
    options,
    correctAnswer,
    explanation: raw.explanation.trim(),
    hint: raw.hint.trim(),
    difficulty,
    tags: [
      ...new Set(
        raw.tags
          .split(/[;,|]/)
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ],
  });
}

// ============================================================
// HELPERS
// ============================================================

export function parseCsvTable(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = [',', ';', '\t']
    .map((candidate) => ({ candidate, count: firstLine.split(candidate).length }))
    .sort((a, b) => b.count - a.count)[0].candidate;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index++;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s\-]+/g, '_');
}

export function normalizeKeys(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    // camelCase -> snake_case, then the same normalization as CSV headers.
    result[normalizeHeader(key.replace(/([a-z])([A-Z])/g, '$1_$2'))] = value;
  }

  return result;
}

export function keyOf(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

export function str(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toOptions(value: unknown): TestQuestionOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((option, index) => {
      if (typeof option === 'string') {
        return { id: OPTION_LETTERS[index] ?? String(index + 1), text: option.trim() };
      }

      if (isRecord(option)) {
        return {
          id: str(option['id']) || OPTION_LETTERS[index] || String(index + 1),
          text: str(option['text']),
        };
      }

      return { id: '', text: '' };
    })
    .filter((option) => option.text);
}

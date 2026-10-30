import { describe, expect, it } from 'vitest';

import {
  ImportRow,
  ImportRowError,
  collectImportRow,
  keyOf,
  parseCsvTable,
  slugify,
} from '../../src/app/features/test-center/services/test-center-import.utils';

/** Builds a raw row with sensible defaults for collectImportRow. */
function raw(overrides: Partial<Parameters<typeof collectImportRow>[0]> = {}) {
  return {
    line: 2,
    externalId: '',
    program: 'Onboarding',
    programDescription: '',
    course: 'Safety',
    courseDescription: '',
    provider: '',
    topic: 'Fire',
    topicDescription: '',
    question: 'What should you do first?',
    type: 'multiple-choice',
    options: [
      { id: 'a', text: 'Wait' },
      { id: 'b', text: 'Leave by the nearest exit' },
    ],
    correctAnswer: 'b',
    explanation: '',
    hint: '',
    difficulty: '',
    tags: '',
    ...overrides,
  };
}

function collect(overrides: Partial<Parameters<typeof collectImportRow>[0]> = {}) {
  const rows: ImportRow[] = [];
  const errors: ImportRowError[] = [];

  collectImportRow(raw(overrides), rows, errors);

  return { row: rows[0], error: errors[0]?.message };
}

describe('parseCsvTable', () => {
  it('parses quoted cells with commas, quotes and line breaks', () => {
    const table = parseCsvTable(
      'question,option_a\r\n"Is ""this"", ok?","line one\nline two"\r\n',
    );

    expect(table).toEqual([
      ['question', 'option_a'],
      ['Is "this", ok?', 'line one\nline two'],
    ]);
  });

  it('detects semicolon delimiters used by European Excel', () => {
    expect(parseCsvTable('question;correct_answer\nQ1;a')).toEqual([
      ['question', 'correct_answer'],
      ['Q1', 'a'],
    ]);
  });

  it('keeps empty trailing cells', () => {
    expect(parseCsvTable('a,b,c\n1,,\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', ''],
    ]);
  });
});

describe('collectImportRow', () => {
  it('accepts the correct answer as an option letter', () => {
    const { row, error } = collect({ correctAnswer: 'B' });

    expect(error).toBeUndefined();
    expect(row.correctAnswer).toBe('b');
    expect(row.difficulty).toBe('medium');
  });

  it('accepts the correct answer as the exact option text', () => {
    expect(collect({ correctAnswer: 'leave by the nearest exit' }).row.correctAnswer).toBe('b');
  });

  it('rejects an answer that matches no option', () => {
    expect(collect({ correctAnswer: 'z' }).error).toMatch(/doesn't match any option/);
  });

  it('needs at least two options for multiple choice', () => {
    expect(
      collect({ options: [{ id: 'a', text: 'Only one' }], correctAnswer: 'a' }).error,
    ).toMatch(/at least two options/);
  });

  it('builds true/false options and maps the answer', () => {
    const { row } = collect({ type: 'true-false', options: [], correctAnswer: 'False' });

    expect(row.type).toBe('true-false');
    expect(row.options).toEqual([
      { id: 'a', text: 'True' },
      { id: 'b', text: 'False' },
    ]);
    expect(row.correctAnswer).toBe('b');
  });

  it('infers true/false when the type is blank and there are no options', () => {
    const { row } = collect({ type: '', options: [], correctAnswer: 'true' });

    expect(row.type).toBe('true-false');
    expect(row.correctAnswer).toBe('a');
  });

  it('reports unknown types and difficulties', () => {
    expect(collect({ type: 'essay' }).error).toMatch(/Unknown question type/);
    expect(collect({ difficulty: 'extreme' }).error).toMatch(/Unknown difficulty/);
  });

  it('normalizes difficulty synonyms and tags', () => {
    const { row } = collect({ difficulty: 'Advanced', tags: 'Safety; fire , safety|drills' });

    expect(row.difficulty).toBe('hard');
    expect(row.tags).toEqual(['safety', 'fire', 'drills']);
  });

  it('rejects rows without question text', () => {
    expect(collect({ question: '   ' }).error).toBe('Question text is missing.');
  });
});

describe('name matching', () => {
  it('matches names regardless of case, spacing and punctuation', () => {
    expect(keyOf('Fire  Safety!')).toBe(keyOf('fire safety'));
  });

  it('builds URL-safe slugs', () => {
    expect(slugify('Café & Kitchen Safety 101')).toBe('cafe-kitchen-safety-101');
    expect(slugify('!!!')).toBe('item');
  });
});

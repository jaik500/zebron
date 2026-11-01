import { TestQuestion, TestQuestionOption, TestQuestionType } from './test-question.model';

/**
 * Answer types for Test Center questions, and how answers are stored,
 * checked and shown. Used by the question editors, the practice and
 * results pages, and (as a copy) the course exam Cloud Function.
 *
 *   multiple-choice  one option              answer: option id
 *   true-false       True or False           answer: 'true' | 'false'
 *   multiple-select  every correct option    answer: option ids joined by '|', sorted
 *   short-text       typed word or phrase    answer: the text
 *   numeric          typed number            answer: the text of the number
 *   ordering         options in order        answer: option ids joined by '|', in the learner's order
 *
 * Answers are kept as strings so a test session stays a simple
 * Record<questionId, string>.
 */

export const ANSWER_SEPARATOR = '|';

export const QUESTION_TYPES: { value: TestQuestionType; label: string; hint: string }[] = [
  { value: 'multiple-choice', label: 'Multiple choice', hint: 'One right answer' },
  { value: 'multiple-select', label: 'Multiple answers', hint: 'Select all that apply' },
  { value: 'true-false', label: 'True / False', hint: 'True or false' },
  { value: 'short-text', label: 'Short answer', hint: 'Type a word or phrase' },
  { value: 'numeric', label: 'Number', hint: 'Type a number' },
  { value: 'ordering', label: 'Put in order', hint: 'Arrange the steps' },
];

export function questionTypeLabel(type: string): string {
  return QUESTION_TYPES.find((item) => item.value === type)?.label ?? 'Multiple choice';
}

/** Types answered with a single click (the answer is final at once). */
export function isSingleClick(type: string): boolean {
  return type === 'multiple-choice' || type === 'true-false' || !type;
}

export function usesOptions(type: string): boolean {
  return type !== 'short-text' && type !== 'numeric';
}

export function splitAnswer(answer: string | null | undefined): string[] {
  return (answer ?? '').split(ANSWER_SEPARATOR).filter(Boolean);
}

/** Lower case, no accents, single spaces, no closing punctuation. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '');
}

export function parseNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = (value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!cleaned || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(cleaned)) {
    return null;
  }
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

/** The correct option ids for multiple-select (falls back to correctAnswer). */
export function correctSet(question: Pick<TestQuestion, 'correctAnswer' | 'correctAnswers'>): string[] {
  const answers = question.correctAnswers?.length ? question.correctAnswers : splitAnswer(question.correctAnswer);
  return [...new Set(answers)].sort();
}

/** The correct order for ordering questions (falls back to the option order as written). */
export function correctOrder(question: Pick<TestQuestion, 'correctOrder' | 'options'>): string[] {
  return question.correctOrder?.length ? question.correctOrder : question.options.map((option) => option.id);
}

export function isAnswered(answer: string | null | undefined): boolean {
  return !!answer && answer.trim() !== '';
}

export function isAnswerCorrect(question: TestQuestion, answer: string | null | undefined): boolean {
  if (!isAnswered(answer)) {
    return false;
  }
  const value = answer as string;

  switch (question.type) {
    case 'multiple-select':
      return splitAnswer(value).sort().join(ANSWER_SEPARATOR) === correctSet(question).join(ANSWER_SEPARATOR);

    case 'short-text': {
      const typed = normalizeText(value);
      return (question.acceptedAnswers ?? []).some((accepted) => normalizeText(accepted) === typed);
    }

    case 'numeric': {
      const typed = parseNumber(value);
      const expected = parseNumber(question.numericAnswer ?? null);
      return typed !== null && expected !== null && Math.abs(typed - expected) <= Math.abs(question.numericTolerance ?? 0) + 1e-9;
    }

    case 'ordering':
      return splitAnswer(value).join(ANSWER_SEPARATOR) === correctOrder(question).join(ANSWER_SEPARATOR);

    default:
      return value === question.correctAnswer;
  }
}

/** The correct answer, stored the same way as a learner's answer. */
export function correctAnswerValue(question: TestQuestion): string {
  switch (question.type) {
    case 'multiple-select':
      return correctSet(question).join(ANSWER_SEPARATOR);
    case 'short-text':
      return question.acceptedAnswers?.[0] ?? '';
    case 'numeric':
      return question.numericAnswer === undefined || question.numericAnswer === null ? '' : String(question.numericAnswer);
    case 'ordering':
      return correctOrder(question).join(ANSWER_SEPARATOR);
    default:
      return question.correctAnswer;
  }
}

/** An answer in words, for result reviews. */
export function answerText(question: Pick<TestQuestion, 'type' | 'options' | 'numericTolerance'>, answer: string | null | undefined): string {
  if (!isAnswered(answer)) {
    return '';
  }
  const value = answer as string;
  const textOf = (id: string) => question.options.find((option) => option.id === id)?.text ?? id;

  switch (question.type) {
    case 'multiple-select':
      return splitAnswer(value).map(textOf).join(', ');
    case 'ordering':
      return splitAnswer(value).map((id, index) => `${index + 1}. ${textOf(id)}`).join('  ');
    case 'short-text':
      return value;
    case 'numeric':
      return question.numericTolerance ? `${value} (± ${question.numericTolerance})` : value;
    default:
      return textOf(value);
  }
}

// ============================================================
// EDITING (both question editors)
// ============================================================

/** The answer fields of a question form. */
export interface AnswerForm {
  type: TestQuestionType;
  options: TestQuestionOption[];
  correctAnswer: string;
  correctAnswers?: string[];
  acceptedAnswers?: string[];
  numericAnswer?: number | null;
  numericTolerance?: number | null;
}

function letter(index: number): string {
  return String.fromCharCode(97 + index);
}

export function blankOptions(count = 4): TestQuestionOption[] {
  return Array.from({ length: count }, (_, index) => ({ id: `option-${letter(index)}`, text: '' }));
}

/** Set sensible answer fields after the type changes. */
export function resetAnswersForType(form: AnswerForm): void {
  const isTrueFalse = form.options.length === 2 && form.options[0]?.id === 'true' && form.options[1]?.id === 'false';

  switch (form.type) {
    case 'true-false':
      form.options = [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ];
      form.correctAnswer = form.correctAnswer === 'false' ? 'false' : 'true';
      break;
    case 'short-text':
      form.options = [];
      form.correctAnswer = '';
      form.acceptedAnswers = form.acceptedAnswers?.length ? form.acceptedAnswers : [''];
      break;
    case 'numeric':
      form.options = [];
      form.correctAnswer = '';
      form.numericAnswer = form.numericAnswer ?? null;
      form.numericTolerance = form.numericTolerance ?? 0;
      break;
    default:
      if (form.options.length < 2 || isTrueFalse) {
        form.options = blankOptions(form.type === 'ordering' ? 3 : 4);
      }
      if (form.type === 'multiple-select') {
        form.correctAnswers = form.correctAnswers?.filter((id) => form.options.some((option) => option.id === id)) ?? [];
      }
      if (form.type === 'multiple-choice' && !form.options.some((option) => option.id === form.correctAnswer)) {
        form.correctAnswer = form.options[0]?.id ?? '';
      }
  }
}

export function nextOptionId(options: TestQuestionOption[]): string {
  const used = new Set(options.map((option) => option.id));
  for (let index = 0; index < 26; index += 1) {
    const id = `option-${letter(index)}`;
    if (!used.has(id)) {
      return id;
    }
  }
  return `option-${Date.now()}`;
}

/** What is wrong with the answer fields, or null. */
export function answerProblem(form: AnswerForm): string | null {
  const options = form.options.map((option) => ({ ...option, text: option.text.trim() }));

  switch (form.type) {
    case 'short-text':
      return (form.acceptedAnswers ?? []).some((answer) => answer.trim()) ? null : 'Add at least one accepted answer.';
    case 'numeric':
      if (parseNumber(form.numericAnswer ?? null) === null) {
        return 'Enter the correct number.';
      }
      return (form.numericTolerance ?? 0) < 0 ? 'The margin cannot be negative.' : null;
    default:
      if (options.length < 2) {
        return 'At least two answer options are required.';
      }
      if (options.some((option) => !option.text)) {
        return 'Every answer option must contain text.';
      }
      if (form.type === 'multiple-select') {
        return (form.correctAnswers ?? []).length ? null : 'Tick every correct answer.';
      }
      if (form.type === 'ordering') {
        return null;
      }
      return options.some((option) => option.id === form.correctAnswer) ? null : 'Select the correct answer.';
  }
}

/** The answer fields to save, for every type. */
export function answerPayload(form: AnswerForm): Pick<
  TestQuestion,
  'type' | 'options' | 'correctAnswer' | 'correctAnswers' | 'acceptedAnswers' | 'numericAnswer' | 'numericTolerance' | 'correctOrder'
> {
  const options = form.options.map((option) => ({ id: option.id, text: option.text.trim() }));

  switch (form.type) {
    case 'multiple-select': {
      const correct = [...new Set(form.correctAnswers ?? [])].filter((id) => options.some((option) => option.id === id)).sort();
      return { type: form.type, options, correctAnswer: correct.join(ANSWER_SEPARATOR), correctAnswers: correct };
    }
    case 'short-text': {
      const accepted = (form.acceptedAnswers ?? []).map((answer) => answer.trim()).filter(Boolean);
      return { type: form.type, options: [], correctAnswer: accepted[0] ?? '', acceptedAnswers: accepted };
    }
    case 'numeric': {
      const value = parseNumber(form.numericAnswer ?? null) ?? 0;
      return { type: form.type, options: [], correctAnswer: String(value), numericAnswer: value, numericTolerance: Math.abs(form.numericTolerance ?? 0) };
    }
    case 'ordering': {
      const order = options.map((option) => option.id);
      return { type: form.type, options, correctAnswer: order.join(ANSWER_SEPARATOR), correctOrder: order };
    }
    default:
      return { type: form.type, options, correctAnswer: form.correctAnswer };
  }
}

/** Copy a stored question's answer fields into a form. */
export function answerFormFrom(question: TestQuestion): AnswerForm {
  return {
    type: question.type ?? 'multiple-choice',
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctAnswer: question.correctAnswer,
    correctAnswers: question.type === 'multiple-select' ? correctSet(question) : [],
    acceptedAnswers: question.acceptedAnswers?.length ? [...question.acceptedAnswers] : [''],
    numericAnswer: question.numericAnswer ?? null,
    numericTolerance: question.numericTolerance ?? 0,
  };
}

/** The optional answer fields that are set (Firestore rejects undefined values). */
export function answerExtras(
  payload: Partial<Pick<TestQuestion, 'correctAnswers' | 'acceptedAnswers' | 'numericAnswer' | 'numericTolerance' | 'correctOrder'>>,
): Partial<Pick<TestQuestion, 'correctAnswers' | 'acceptedAnswers' | 'numericAnswer' | 'numericTolerance' | 'correctOrder'>> {
  return Object.fromEntries(
    (['correctAnswers', 'acceptedAnswers', 'numericAnswer', 'numericTolerance', 'correctOrder'] as const)
      .filter((key) => payload[key] !== undefined)
      .map((key) => [key, payload[key]]),
  );
}

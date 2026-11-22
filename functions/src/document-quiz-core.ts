/* eslint-disable max-len */
/**
 * "Quiz me on this chapter" (My documents reader): the pure parts, shared
 * by document-quiz.ts and the unit tests (tests/unit/document-quiz.test.ts).
 *
 * - `cleanQuestions` checks the AI's questions: four different, non-empty
 *   options, one correct answer, short texts; broken questions are dropped.
 * - `shuffleOptions` mixes the options (models tend to put the right answer
 *   first) and moves the correct answer with them.
 * - `gradeQuiz` scores the learner's answers and groups them by topic, the
 *   same shape as Test Center results (topicPerformance).
 */

export const QUIZ_LIMITS = {
  /** Shortest section worth a quiz (characters). */
  minText: 300,
  /** Longest section sent to the model (characters). */
  maxText: 24_000,
  minQuestions: 3,
  maxQuestions: 10,
  defaultQuestions: 5,
  question: 300,
  option: 200,
  explanation: 400,
  topic: 60,
  title: 200,
  section: 120,
} as const;

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index of the correct option (0 to 3). Never sent to the browser before grading. */
  answer: number;
  explanation: string;
  topic: string;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  answeredQuestions: number;
  correctAnswers: number;
}

export interface GradedQuestion extends QuizQuestion {
  /** The learner's choice, or null when skipped. */
  chosen: number | null;
  correct: boolean;
}

export interface QuizGrade {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  topicPerformance: TopicPerformance[];
  questions: GradedQuestion[];
}

const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** A stable id for a topic name ("Cell division" → "cell-division"). */
export function topicId(name: string): string {
  const id = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return id || "general";
}

/** The model's questions, checked. Questions that don't meet the rules are dropped. */
export function cleanQuestions(raw: unknown, max: number = QUIZ_LIMITS.maxQuestions): QuizQuestion[] {
  const list = Array.isArray(raw) ? raw : [];
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const question = text(entry.question, QUIZ_LIMITS.question);
    const options = Array.isArray(entry.options) ? entry.options.map((option) => text(option, QUIZ_LIMITS.option)) : [];
    const answer = typeof entry.answer === "number" ? entry.answer : Number.NaN;
    if (!question || options.length !== 4 || options.some((option) => !option)) continue;
    if (new Set(options.map((option) => option.toLowerCase())).size !== 4) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    questions.push({
      id: `q${questions.length + 1}`,
      question,
      options,
      answer,
      explanation: text(entry.explanation, QUIZ_LIMITS.explanation),
      topic: text(entry.topic, QUIZ_LIMITS.topic) || "General",
    });
    if (questions.length >= max) break;
  }
  return questions;
}

/** Mixes each question's options; `random` returns numbers in [0, 1). */
export function shuffleOptions(questions: QuizQuestion[], random: () => number = Math.random): QuizQuestion[] {
  return questions.map((question) => {
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return {
      ...question,
      options: order.map((index) => question.options[index]),
      answer: order.indexOf(question.answer),
    };
  });
}

/** Scores the answers (one per question, in order; null or anything else = skipped). */
export function gradeQuiz(questions: QuizQuestion[], answers: unknown): QuizGrade {
  const given = Array.isArray(answers) ? answers : [];
  const graded: GradedQuestion[] = questions.map((question, index) => {
    const value = given[index];
    const chosen = Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3 ? (value as number) : null;
    return { ...question, chosen, correct: chosen !== null && chosen === question.answer };
  });

  const topics = new Map<string, TopicPerformance>();
  for (const question of graded) {
    const id = topicId(question.topic);
    const entry = topics.get(id) ?? { topicId: id, topicName: question.topic, answeredQuestions: 0, correctAnswers: 0 };
    if (question.chosen !== null) entry.answeredQuestions += 1;
    if (question.correct) entry.correctAnswers += 1;
    topics.set(id, entry);
  }

  const total = graded.length;
  const correct = graded.filter((question) => question.correct).length;
  return {
    totalQuestions: total,
    answeredQuestions: graded.filter((question) => question.chosen !== null).length,
    correctAnswers: correct,
    scorePercentage: total ? Math.round((correct / total) * 100) : 0,
    topicPerformance: [...topics.values()],
    questions: graded,
  };
}

/** What the browser may see before grading: no answers, no explanations. */
export function questionsForLearner(questions: QuizQuestion[]): Array<Pick<QuizQuestion, "id" | "question" | "options" | "topic">> {
  return questions.map(({ id, question, options, topic }) => ({ id, question, options, topic }));
}

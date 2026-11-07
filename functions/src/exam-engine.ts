/* eslint-disable max-len */
import { randomInt } from "node:crypto";

import { getFirestore, Timestamp, WriteBatch } from "firebase-admin/firestore";

/**
 * The exam engine shared by every graded exam: course final exams
 * (course-exams.ts), Test Center exams (quiz-exams.ts) and certification
 * exams (certifications.ts).
 *
 * Each engine keeps its own gating (who may start, attempt limits,
 * cooldowns). What they must agree on lives here: how questions are sent
 * without answers, how every answer type is graded, the late-answer grace,
 * the score, and the record written to the shared Test Center history.
 */

/** Extra time allowed after the deadline for the answers to arrive. */
export const GRACE_MS = 2 * 60 * 1000;

export interface ExamQuestion {
  id: string;
  question: string;
  type: string;
  options: { id: string; text: string }[];
}

export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A readable certificate code, e.g. ZB-7Q4K-M2XP. */
export function certificateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const characters = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `ZB-${characters.slice(0, 4)}-${characters.slice(4)}`;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function toExamQuestion(id: string, data: FirebaseFirestore.DocumentData): ExamQuestion {
  const type = text(data.type) || "multiple-choice";
  const options = (Array.isArray(data.options) ? data.options : [])
    .map((option: { id?: unknown; text?: unknown }) => ({ id: text(option.id), text: text(option.text) }))
    .filter((option: { id: string }) => option.id);

  return {
    id,
    question: text(data.question),
    type,
    // Ordering questions must not arrive in the right order.
    options: type === "ordering" ? shuffle(options) : options,
  };
}

// ------------------------------------------------------------
// Grading for every answer type. Keep in step with
// src/app/features/test-center/models/question-answers.ts.
// ------------------------------------------------------------

const SEPARATOR = "|";

function splitAnswer(value: string): string[] {
  return value.split(SEPARATOR).filter(Boolean);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(cleaned)) {
    return null;
  }
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

export function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

export function isAnswerCorrect(question: FirebaseFirestore.DocumentData, answer: string): boolean {
  if (!answer) {
    return false;
  }

  switch (text(question.type)) {
    case "multiple-select": {
      const right = strings(question.correctAnswers).length ? strings(question.correctAnswers) : splitAnswer(text(question.correctAnswer));
      return [...new Set(splitAnswer(answer))].sort().join(SEPARATOR) === [...new Set(right)].sort().join(SEPARATOR);
    }
    case "short-text":
      return strings(question.acceptedAnswers).some((accepted) => normalizeText(accepted) === normalizeText(answer));
    case "numeric": {
      const typed = parseNumber(answer);
      const expected = parseNumber(question.numericAnswer);
      const margin = Math.abs(parseNumber(question.numericTolerance) ?? 0);
      return typed !== null && expected !== null && Math.abs(typed - expected) <= margin + 1e-9;
    }
    case "ordering": {
      const order = strings(question.correctOrder).length ?
        strings(question.correctOrder) :
        (Array.isArray(question.options) ? question.options : []).map((option: { id?: unknown }) => text(option.id));
      return splitAnswer(answer).join(SEPARATOR) === order.join(SEPARATOR);
    }
    default:
      return answer === text(question.correctAnswer);
  }
}

export async function questionsById(ids: string[]): Promise<Map<string, FirebaseFirestore.DocumentData>> {
  if (!ids.length) {
    return new Map();
  }

  const db = getFirestore();
  const snapshots = await db.getAll(...ids.map((id) => db.doc(`quizQuestions/${id}`)));
  return new Map(
    snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => [snapshot.id, snapshot.data() as FirebaseFirestore.DocumentData]),
  );
}

/** Whole-number percentage, 0 when there are no questions. */
export function scoreOf(correct: number, total: number): number {
  return total ? Math.round((correct / total) * 100) : 0;
}

/** True when the answers arrived after the deadline and its grace period. */
export function isLate(deadline: Timestamp | null | undefined, now = Date.now()): boolean {
  return !!deadline && now > deadline.toMillis() + GRACE_MS;
}

// ------------------------------------------------------------
// Shared history (quizAttempts + quizResults)
// ------------------------------------------------------------

export interface HistoryItem {
  questionId: string;
  question: string;
  /** Topic or section the question is reported under. */
  topicId: string;
  /** "" when unanswered. */
  answer: string;
  isCorrect: boolean;
}

export interface HistoryEntry {
  organizationId: string | null;
  userId: string;
  /** The Test Center quiz, or "certification:<key>" for certification exams. */
  quizId: string;
  quizName: string;
  source: "course" | "certification";
  items: HistoryItem[];
  /** Display names per topicId; missing ones show as "Other". */
  topicNames: Map<string, string>;
  score: number;
  passed: boolean;
  startedAt: Timestamp;
  submittedAt: Timestamp;
  /** Extra fields kept on both records, e.g. courseId and courseTitle. */
  details?: Record<string, unknown>;
}

/**
 * Add one exam to the Test Center history in the caller's batch, so every
 * assessment appears in the same results pages, reports and exports.
 * Right answers and explanations are never stored here (examOnly).
 */
export function writeExamHistory(batch: WriteBatch, entry: HistoryEntry): { attemptId: string; resultId: string } {
  const db = getFirestore();
  const attemptRef = db.collection("quizAttempts").doc();
  const resultRef = db.collection("quizResults").doc();

  const total = entry.items.length;
  const answered = entry.items.filter((item) => item.answer).length;
  const correct = entry.items.filter((item) => item.isCorrect).length;
  const topicIds = [...new Set(entry.items.map((item) => item.topicId))];

  const common = {
    organizationId: entry.organizationId,
    userId: entry.userId,
    quizId: entry.quizId,
    quizName: entry.quizName,
    scope: entry.organizationId ? "organization" : "platform",
    mode: "exam",
    source: entry.source,
    passed: entry.passed,
    ...(entry.details ?? {}),
  };

  batch.set(attemptRef, {
    ...common,
    id: attemptRef.id,
    topicIds,
    questionIds: entry.items.map((item) => item.questionId),
    questionCount: total,
    correctCount: correct,
    score: entry.score,
    status: "completed",
    results: entry.items.map((item) => ({ questionId: item.questionId, selectedAnswer: item.answer, correct: item.isCorrect })),
    startedAt: entry.startedAt,
    completedAt: entry.submittedAt,
  });

  batch.set(resultRef, {
    ...common,
    id: resultRef.id,
    attemptId: attemptRef.id,
    totalQuestions: total,
    answeredQuestions: answered,
    correctAnswers: correct,
    incorrectAnswers: answered - correct,
    unansweredQuestions: total - answered,
    scorePercentage: entry.score,
    difficulty: "mixed",
    examOnly: true,
    topicPerformance: topicIds.map((topicId) => {
      const items = entry.items.filter((item) => item.topicId === topicId);
      const topicCorrect = items.filter((item) => item.isCorrect).length;
      return {
        topicId,
        topicName: entry.topicNames.get(topicId) ?? "Other",
        totalQuestions: items.length,
        answeredQuestions: items.filter((item) => item.answer).length,
        correctAnswers: topicCorrect,
        incorrectAnswers: items.filter((item) => item.answer && !item.isCorrect).length,
        percentage: scoreOf(topicCorrect, items.length),
      };
    }),
    questionResults: entry.items.map((item) => ({
      questionId: item.questionId,
      question: item.question,
      topicId: item.topicId,
      selectedAnswerId: item.answer || null,
      correctAnswerId: "",
      isCorrect: item.isCorrect,
      explanation: "",
    })),
    completedAt: entry.submittedAt,
    createdAt: entry.submittedAt,
  });

  return { attemptId: attemptRef.id, resultId: resultRef.id };
}

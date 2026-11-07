/* eslint-disable max-len */
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import { ExamQuestion, isAnswerCorrect, questionsById, scoreOf, shuffle, strings, text, toExamQuestion } from "./exam-engine";
import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Test Center exams, graded on the server: the one exam engine.
 *
 * Practice mode stays in the browser (answers are checked as you go). Exam
 * mode runs here, with the same grading as course final exams
 * (isAnswerCorrect in course-exams.ts):
 *
 *   startQuizExam   checks access, picks the questions and records the
 *                   attempt (quizAttempts, status in-progress). Returns the
 *                   questions without their answers.
 *   submitQuizExam  grades the answers, writes the result (quizResults,
 *                   mode exam) and closes the attempt.
 *
 * Browsers may only save practice results (firestore.rules), so an exam
 * score always comes from here. Banks marked exam-only (quiz.examOnly)
 * never reach a learner's browser: their questions are readable only by
 * Test Center managers, and results don't reveal the right answers.
 */

const REGION = "us-central1";
const MAX_QUESTIONS = 200;
const MAX_BANK = 3000;
const MAX_TOPICS = 30;
const ANSWER_SEPARATOR = "|";

interface QuizAccess {
  uid: string;
  quizId: string;
  quiz: FirebaseFirestore.DocumentData;
  /** Owner of the bank: an organization, or null for Zebron's. */
  quizOrganizationId: string | null;
  scope: "platform" | "organization";
  examOnly: boolean;
}

/** May this person take this quiz? Same people as the Test Center rules (isTestCenterMember). */
async function checkAccess(request: CallableRequest<unknown>, quizId: string): Promise<QuizAccess> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to take an exam.");
  }
  if (!quizId || quizId.includes("/")) {
    throw new HttpsError("invalid-argument", "A quiz is required.");
  }

  const db = getFirestore();
  const uid = request.auth.uid;
  const [quizSnapshot, isAdmin] = await Promise.all([
    db.doc(`quizzes/${quizId}`).get(),
    isPlatformAdministrator(request),
  ]);
  const quiz = quizSnapshot.data();

  if (!quizSnapshot.exists || !quiz || (quiz.active !== true && !isAdmin)) {
    throw new HttpsError("not-found", "This quiz is not available.");
  }

  const quizOrganizationId = text(quiz.organizationId) || null;
  const scope = quizOrganizationId ? "organization" : "platform";

  if (quizOrganizationId && !isAdmin) {
    const [organization, membership, entitlement] = await Promise.all([
      db.doc(`organizations/${quizOrganizationId}`).get(),
      db.doc(`organizationMemberships/${uid}_${quizOrganizationId}`).get(),
      db.doc(`organizations/${quizOrganizationId}/applications/test-center`).get(),
    ]);
    const status = organization.get("status") ?? (organization.get("active") === false ? "suspended" : "active");
    if (!organization.exists || status !== "active" || membership.get("active") !== true || entitlement.get("status") !== "active") {
      throw new HttpsError("permission-denied", "This quiz is for members of the organization.");
    }
  }

  if (!quizOrganizationId && !isAdmin && quiz.accessType !== "public") {
    throw new HttpsError("permission-denied", "This quiz is not available.");
  }

  return { uid, quizId, quiz, quizOrganizationId, scope, examOnly: quiz.examOnly === true };
}

/** The value the result review shows as the right answer (same as correctAnswerValue in models/question-answers.ts). */
function correctAnswerValue(question: FirebaseFirestore.DocumentData): string {
  switch (text(question.type)) {
    case "multiple-select":
      return (strings(question.correctAnswers).length ? strings(question.correctAnswers) : text(question.correctAnswer).split(ANSWER_SEPARATOR).filter(Boolean)).join(ANSWER_SEPARATOR);
    case "short-text":
      return strings(question.acceptedAnswers)[0] ?? "";
    case "numeric":
      return question.numericAnswer === undefined || question.numericAnswer === null ? "" : String(question.numericAnswer);
    case "ordering": {
      const order = strings(question.correctOrder);
      return (order.length ? order : (Array.isArray(question.options) ? question.options : []).map((option: { id?: unknown }) => text(option.id))).join(ANSWER_SEPARATOR);
    }
    default:
      return text(question.correctAnswer);
  }
}

// ============================================================
// START
// ============================================================

export const startQuizExam = onCall({ region: REGION }, async (request) => {
  const data = (request.data ?? {}) as Record<string, unknown>;
  const access = await checkAccess(request, text(data.quizId));
  const db = getFirestore();

  const topicIds = strings(data.topicIds).slice(0, MAX_TOPICS);
  const difficulty = text(data.difficulty) || "mixed";
  const wanted = Math.min(Math.max(Number(data.questionCount) || 20, 1), MAX_QUESTIONS);

  const published = await db.collection("quizQuestions")
    .where("organizationId", "==", access.quizOrganizationId)
    .where("quizId", "==", access.quizId)
    .where("status", "==", "published")
    .limit(MAX_BANK)
    .get();

  const pool = published.docs.filter((question) =>
    (!topicIds.length || topicIds.includes(text(question.get("topicId")))) &&
    (difficulty === "mixed" || text(question.get("difficulty")) === difficulty),
  );

  if (!pool.length) {
    throw new HttpsError("failed-precondition", "No published questions are available for the selected topics and difficulty.");
  }

  const chosen = (data.randomizeQuestions === false ? pool : shuffle(pool)).slice(0, wanted);
  const attemptRef = db.collection("quizAttempts").doc();

  await attemptRef.set({
    id: attemptRef.id,
    organizationId: access.quizOrganizationId,
    userId: access.uid,
    quizId: access.quizId,
    quizName: text(access.quiz.name),
    scope: access.scope,
    topicIds,
    questionIds: chosen.map((question) => question.id),
    questionCount: chosen.length,
    correctCount: 0,
    score: 0,
    mode: "exam",
    status: "in-progress",
    source: "test-center",
    difficulty,
    startedAt: FieldValue.serverTimestamp(),
    completedAt: null,
  });

  const questions: (ExamQuestion & { topicId: string; difficulty: string })[] = chosen.map((question) => {
    const exam = toExamQuestion(question.id, question.data());
    return {
      ...exam,
      options: data.randomizeAnswers === false || exam.type === "ordering" ? exam.options : shuffle(exam.options),
      topicId: text(question.get("topicId")),
      difficulty: text(question.get("difficulty")) || "medium",
    };
  });

  return { attemptId: attemptRef.id, examOnly: access.examOnly, questions };
});

// ============================================================
// SUBMIT
// ============================================================

export const submitQuizExam = onCall({ region: REGION, timeoutSeconds: 60 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to submit the exam.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const attemptId = text(data.attemptId);
  const answers = (data.answers && typeof data.answers === "object" ? data.answers : {}) as Record<string, unknown>;

  if (!attemptId || attemptId.includes("/")) {
    throw new HttpsError("invalid-argument", "The exam attempt is missing.");
  }

  const db = getFirestore();
  const attemptRef = db.doc(`quizAttempts/${attemptId}`);
  const attempt = await attemptRef.get();

  if (!attempt.exists || attempt.get("userId") !== request.auth.uid || attempt.get("mode") !== "exam") {
    throw new HttpsError("not-found", "This exam attempt was not found.");
  }
  if (attempt.get("status") !== "in-progress") {
    throw new HttpsError("failed-precondition", "This exam has already been submitted.");
  }

  // Access is checked again: membership may have ended since the start.
  const access = await checkAccess(request, text(attempt.get("quizId")));
  const ids = strings(attempt.get("questionIds"));
  const questions = await questionsById(ids);

  const topicIds = [...new Set([...questions.values()].map((question) => text(question.topicId)).filter(Boolean))];
  const topicSnapshots = topicIds.length ? await db.getAll(...topicIds.map((id) => db.doc(`quizTopics/${id}`))) : [];
  const topicNames = new Map(topicSnapshots.map((snapshot) => [snapshot.id, text(snapshot.get("name")) || "Other"]));

  const questionResults = ids
    .filter((id) => questions.has(id))
    .map((id) => {
      const question = questions.get(id)!;
      const answer = text(answers[id]).slice(0, 500);
      return {
        questionId: id,
        question: text(question.question),
        topicId: text(question.topicId),
        selectedAnswerId: answer || null,
        // Exam-only banks keep their answers private, even afterwards.
        correctAnswerId: access.examOnly ? "" : correctAnswerValue(question),
        isCorrect: isAnswerCorrect(question, answer),
        explanation: access.examOnly ? "" : text(question.explanation),
      };
    });

  const total = questionResults.length;
  const answered = questionResults.filter((item) => item.selectedAnswerId !== null).length;
  const correct = questionResults.filter((item) => item.isCorrect).length;
  const score = scoreOf(correct, total);

  const topicPerformance = topicIds
    .map((topicId) => {
      const items = questionResults.filter((item) => item.topicId === topicId);
      const topicCorrect = items.filter((item) => item.isCorrect).length;
      return {
        topicId,
        topicName: topicNames.get(topicId) ?? "Other",
        totalQuestions: items.length,
        answeredQuestions: items.filter((item) => item.selectedAnswerId !== null).length,
        correctAnswers: topicCorrect,
        incorrectAnswers: items.filter((item) => item.selectedAnswerId !== null && !item.isCorrect).length,
        percentage: items.length ? Math.round((topicCorrect / items.length) * 100) : 0,
      };
    })
    .filter((topic) => topic.totalQuestions > 0);

  const resultRef = db.collection("quizResults").doc();
  const result = {
    id: resultRef.id,
    organizationId: access.quizOrganizationId,
    userId: request.auth.uid,
    attemptId,
    quizId: access.quizId,
    quizName: text(access.quiz.name),
    totalQuestions: total,
    answeredQuestions: answered,
    correctAnswers: correct,
    incorrectAnswers: answered - correct,
    unansweredQuestions: total - answered,
    scorePercentage: score,
    mode: "exam" as const,
    source: "test-center",
    examOnly: access.examOnly,
    difficulty: text(attempt.get("difficulty")) || "mixed",
    topicPerformance,
    questionResults,
  };

  const batch = db.batch();
  batch.set(resultRef, {
    ...result,
    scope: access.scope,
    completedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(attemptRef, {
    status: "completed",
    correctCount: correct,
    score,
    results: questionResults.map((item) => ({ questionId: item.questionId, selectedAnswer: item.selectedAnswerId ?? "", correct: item.isCorrect })),
    completedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  logger.info("Quiz exam submitted", { quizId: access.quizId, organizationId: access.quizOrganizationId, score });

  return { ...result, completedAt: Timestamp.now().toDate().toISOString() };
});

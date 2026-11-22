/* eslint-disable max-len */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { runTask } from "./ai-engine";
import { QUIZ_LIMITS, QuizQuestion, gradeQuiz, questionsForLearner, shuffleOptions } from "./document-quiz-core";

/**
 * "Quiz me on this chapter" in the My documents reader.
 *
 *   createDocumentQuiz({ documentId, section, text, count })
 *     The AI engine (task "document-quiz", learner limits) writes questions
 *     from the text the learner is reading. They are saved in
 *     users/{uid}/documentQuizzes/{quizId} with status "open" and the
 *     answers; the browser gets the questions only.
 *   gradeDocumentQuiz({ quizId, answers })
 *     Scores the answers, saves the result (status "graded", score,
 *     topicPerformance like Test Center results) and returns every question
 *     with the right answer and explanation. Grading twice returns the
 *     saved result.
 *   cleanUpDocumentQuizzes (trigger)
 *     Deleting a document deletes its quizzes.
 *
 * Rules: the learner can read their own quizzes only once graded (so the
 * answers stay hidden), and never write them. My learning lists graded
 * quizzes with the Test Center results.
 */

const REGION = "us-central1";

const clip = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");

const quizzesOf = (uid: string) => getFirestore().collection("users").doc(uid).collection("documentQuizzes");

export const createDocumentQuiz = onCall({ region: REGION, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to make a quiz.");
  const uid = request.auth.uid;
  const data = (request.data ?? {}) as Record<string, unknown>;
  const documentId = clip(data.documentId, 128);
  const section = clip(data.section, QUIZ_LIMITS.section);
  const text = typeof data.text === "string" ? data.text.replace(/\s+/g, " ").trim().slice(0, QUIZ_LIMITS.maxText) : "";
  const count = typeof data.count === "number" ? data.count : QUIZ_LIMITS.defaultQuestions;
  if (!documentId || documentId.includes("/")) throw new HttpsError("invalid-argument", "Open a document first.");
  if (text.length < QUIZ_LIMITS.minText) throw new HttpsError("invalid-argument", "There isn't enough text here to make a quiz.");

  // Only the learner's own documents (the title comes from Zebron, not the browser).
  const document = await getFirestore().collection("users").doc(uid).collection("documents").doc(documentId).get();
  if (!document.exists) throw new HttpsError("not-found", "This document was not found in your documents.");
  const documentTitle = clip(document.get("title"), QUIZ_LIMITS.title) || "Document";

  const answer = (await runTask(request, "learning", "document-quiz", { text, count, title: documentTitle, section })) as { questions: QuizQuestion[] };
  const questions = shuffleOptions(answer.questions);

  // One open quiz per document: an unfinished earlier one is replaced.
  const open = await quizzesOf(uid).where("documentId", "==", documentId).where("status", "==", "open").get();
  const batch = getFirestore().batch();
  open.docs.forEach((item) => batch.delete(item.ref));
  const quizRef = quizzesOf(uid).doc();
  batch.set(quizRef, {
    documentId,
    documentTitle,
    section,
    status: "open",
    questions,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { quizId: quizRef.id, documentId, documentTitle, section, questions: questionsForLearner(questions) };
});

export const gradeDocumentQuiz = onCall({ region: REGION, timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in to hand in the quiz.");
  const data = (request.data ?? {}) as Record<string, unknown>;
  const quizId = clip(data.quizId, 128);
  if (!quizId || quizId.includes("/")) throw new HttpsError("invalid-argument", "This quiz was not found.");

  const quizRef = quizzesOf(request.auth.uid).doc(quizId);
  const snapshot = await quizRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "This quiz was not found. Make a new one.");
  const stored = snapshot.data() as Record<string, unknown>;
  const questions = (Array.isArray(stored.questions) ? stored.questions : []) as QuizQuestion[];

  const details = {
    quizId,
    documentId: clip(stored.documentId, 128),
    documentTitle: clip(stored.documentTitle, QUIZ_LIMITS.title),
    section: clip(stored.section, QUIZ_LIMITS.section),
  };

  if (stored.status === "graded") {
    // Already handed in (a second tap, or a retry after a lost connection).
    return { ...details, ...gradeQuiz(questions, stored.answers) };
  }

  const grade = gradeQuiz(questions, data.answers);
  await quizRef.update({
    status: "graded",
    answers: grade.questions.map((question) => question.chosen),
    totalQuestions: grade.totalQuestions,
    answeredQuestions: grade.answeredQuestions,
    correctAnswers: grade.correctAnswers,
    scorePercentage: grade.scorePercentage,
    topicPerformance: grade.topicPerformance,
    completedAt: FieldValue.serverTimestamp(),
  });
  logger.info("Document quiz graded", { score: grade.scorePercentage, questions: grade.totalQuestions });
  return { ...details, ...grade };
});

/** Deleting a document deletes its quizzes (questions quote the document). */
export const cleanUpDocumentQuizzes = onDocumentDeleted({ region: REGION, document: "users/{uid}/documents/{documentId}" }, async (event) => {
  const { uid, documentId } = event.params;
  const snapshot = await quizzesOf(uid).where("documentId", "==", documentId).get();
  for (let start = 0; start < snapshot.docs.length; start += 400) {
    const batch = getFirestore().batch();
    snapshot.docs.slice(start, start + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  if (snapshot.size) logger.info("Deleted document quizzes", { count: snapshot.size });
});

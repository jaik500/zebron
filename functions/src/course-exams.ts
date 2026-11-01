import { randomInt } from "node:crypto";

import {
  DocumentReference,
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Course final exams, graded on the server.
 *
 * A course can name a Test Center quiz as its final exam
 * (course.finalExam: quizId, questionCount, passMark, timeLimitMinutes,
 * maxAttempts). Learners never see the right answers during the exam:
 *
 *   startCourseExam   checks access and that every lesson is done, picks
 *                     the questions, starts the clock and counts the attempt.
 *                     Returns the questions without their answers.
 *   submitCourseExam  grades the answers against the stored questions,
 *                     records the score and, on a pass, issues the
 *                     certificate code.
 *
 * Records (written only here; the learner can read them):
 *   users/{uid}/courseExams/{progressId}
 *   users/{uid}/courseExams/{progressId}/attempts/{attemptId}
 *
 * progressId is the course id for Zebron courses and
 * "<organizationId>__<courseId>" for organization courses (the same id as
 * the learner's courseProgress record).
 */

const REGION = "us-central1";
/** Extra time allowed after the deadline for the answers to arrive. */
const GRACE_MS = 2 * 60 * 1000;
const MAX_QUESTIONS = 200;

interface FinalExam {
  quizId: string;
  questionCount: number;
  passMark: number;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
}

interface CourseContext {
  uid: string;
  isAdmin: boolean;
  organizationId: string | null;
  courseId: string;
  progressId: string;
  course: FirebaseFirestore.DocumentData;
  exam: FinalExam;
  examRef: DocumentReference;
}

interface ExamQuestion {
  id: string;
  question: string;
  type: string;
  options: { id: string; text: string }[];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readFinalExam(value: unknown): FinalExam | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const exam = value as Record<string, unknown>;
  const quizId = text(exam.quizId);
  const count = Number(exam.questionCount);
  const passMark = Number(exam.passMark);
  const minutes = Number(exam.timeLimitMinutes);
  const attempts = Number(exam.maxAttempts);

  if (!quizId) {
    return null;
  }

  return {
    quizId,
    questionCount: Number.isInteger(count) && count > 0 ? Math.min(count, MAX_QUESTIONS) : 20,
    passMark: Number.isFinite(passMark) && passMark > 0 && passMark <= 100 ? passMark : 70,
    timeLimitMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : null,
    maxAttempts: Number.isInteger(attempts) && attempts > 0 ? attempts : null,
  };
}

/** A readable certificate code, e.g. ZB-7Q4K-M2XP. */
function certificateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const characters = Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `ZB-${characters.slice(0, 4)}-${characters.slice(4)}`;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/**
 * Who is asking, which course, and whether they may take its exam:
 * a published course with a final exam, membership for organization
 * courses, and every lesson completed (platform administrators may skip
 * the lessons so they can try the exam).
 */
async function loadContext(request: CallableRequest<unknown>): Promise<CourseContext> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to take the final exam.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const courseId = text(data.courseId);
  const organizationId = text(data.organizationId) || null;

  if (!courseId || courseId.includes("/") || (organizationId && organizationId.includes("/"))) {
    throw new HttpsError("invalid-argument", "A course is required.");
  }

  const db = getFirestore();
  const uid = request.auth.uid;
  const isAdmin = await isPlatformAdministrator(request);

  const courseRef = organizationId ?
    db.doc(`organizations/${organizationId}/courses/${courseId}`) :
    db.doc(`courses/${courseId}`);

  const [courseSnapshot, membershipSnapshot, coursesEntitlement] = await Promise.all([
    courseRef.get(),
    organizationId ? db.doc(`organizationMemberships/${uid}_${organizationId}`).get() : Promise.resolve(null),
    organizationId ? db.doc(`organizations/${organizationId}/applications/courses`).get() : Promise.resolve(null),
  ]);

  const course = courseSnapshot.data();
  if (!courseSnapshot.exists || !course || (course.status !== "published" && !isAdmin)) {
    throw new HttpsError("not-found", "This course is not available.");
  }

  if (organizationId && !isAdmin && membershipSnapshot?.get("active") !== true) {
    throw new HttpsError("permission-denied", "This course is for members of the organization.");
  }

  // Organization courses need the organization's Courses capability.
  if (organizationId && !isAdmin && coursesEntitlement?.get("status") !== "active") {
    throw new HttpsError("permission-denied", "Courses is not active for this organization.");
  }

  const exam = readFinalExam(course.finalExam);
  if (!exam) {
    throw new HttpsError("failed-precondition", "This course has no final exam.");
  }

  const progressId = organizationId ? `${organizationId}__${courseId}` : courseId;

  if (!isAdmin) {
    const progress = await db.doc(`users/${uid}/courseProgress/${progressId}`).get();
    const done = new Set<string>(Array.isArray(progress.get("completedLessonIds")) ? progress.get("completedLessonIds") : []);
    const lessonIds: string[] = (Array.isArray(course.modules) ? course.modules : [])
      .flatMap((module: { lessons?: { id?: string }[] }) => module.lessons ?? [])
      .map((lesson: { id?: string }) => text(lesson.id))
      .filter(Boolean);

    if (lessonIds.some((id) => !done.has(id))) {
      throw new HttpsError("failed-precondition", "Finish every lesson before the final exam.");
    }
  }

  return {
    uid,
    isAdmin,
    organizationId,
    courseId,
    progressId,
    course,
    exam,
    examRef: db.doc(`users/${uid}/courseExams/${progressId}`),
  };
}

/** The published questions of the exam's quiz, checked against the course's organization. */
async function loadQuiz(context: CourseContext): Promise<{ name: string; organizationId: string | null }> {
  const quiz = await getFirestore().doc(`quizzes/${context.exam.quizId}`).get();
  const quizOrganizationId = text(quiz.get("organizationId")) || null;

  if (!quiz.exists || quiz.get("active") === false) {
    throw new HttpsError("failed-precondition", "The final exam is not available right now.");
  }

  // Zebron courses use Zebron quizzes; organization courses use their own or Zebron's.
  if (quizOrganizationId && quizOrganizationId !== context.organizationId) {
    throw new HttpsError("failed-precondition", "The final exam is not available right now.");
  }

  return { name: text(quiz.get("name")), organizationId: quizOrganizationId };
}

function toExamQuestion(id: string, data: FirebaseFirestore.DocumentData): ExamQuestion {
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

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : [];
}

function isAnswerCorrect(question: FirebaseFirestore.DocumentData, answer: string): boolean {
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

async function questionsById(ids: string[]): Promise<Map<string, FirebaseFirestore.DocumentData>> {
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

function summary(context: CourseContext, record: FirebaseFirestore.DocumentData | undefined) {
  return {
    passMark: context.exam.passMark,
    maxAttempts: context.exam.maxAttempts,
    attemptsUsed: Number(record?.attempts ?? 0),
    bestScore: typeof record?.bestScore === "number" ? record.bestScore : null,
    passed: record?.passed === true,
  };
}

// ============================================================
// START
// ============================================================

export const startCourseExam = onCall({ region: REGION }, async (request) => {
  const context = await loadContext(request);
  const quiz = await loadQuiz(context);
  const db = getFirestore();

  const recordSnapshot = await context.examRef.get();
  const record = recordSnapshot.data();

  if (record?.passed === true) {
    throw new HttpsError("already-exists", "You have already passed this exam.");
  }

  // An attempt still in progress continues (a page refresh does not draw new questions).
  const openAttemptId = text(record?.openAttemptId);
  if (openAttemptId) {
    const attempt = await context.examRef.collection("attempts").doc(openAttemptId).get();
    const deadline = attempt.get("deadline") as Timestamp | null;

    if (attempt.exists && !attempt.get("submittedAt") && (!deadline || deadline.toMillis() + GRACE_MS > Date.now())) {
      const ids: string[] = attempt.get("questionIds") ?? [];
      const questions = await questionsById(ids);

      return {
        attemptId: attempt.id,
        quizName: quiz.name,
        deadline: deadline ? deadline.toDate().toISOString() : null,
        questions: ids.filter((id) => questions.has(id)).map((id) => toExamQuestion(id, questions.get(id)!)),
        ...summary(context, record),
      };
    }
  }

  const used = Number(record?.attempts ?? 0);
  if (context.exam.maxAttempts && used >= context.exam.maxAttempts && !context.isAdmin) {
    throw new HttpsError("resource-exhausted", "You have used all your attempts at this exam. Contact your course manager.");
  }

  const published = await db
    .collection("quizQuestions")
    .where("organizationId", "==", quiz.organizationId)
    .where("quizId", "==", context.exam.quizId)
    .where("status", "==", "published")
    .get();

  if (published.empty) {
    throw new HttpsError("failed-precondition", "The final exam has no questions yet.");
  }

  const chosen = shuffle(published.docs).slice(0, context.exam.questionCount);
  const startedAt = Timestamp.now();
  const deadline = context.exam.timeLimitMinutes ?
    Timestamp.fromMillis(startedAt.toMillis() + context.exam.timeLimitMinutes * 60 * 1000) :
    null;

  const attemptRef = context.examRef.collection("attempts").doc();
  const batch = db.batch();

  batch.set(attemptRef, {
    quizId: context.exam.quizId,
    questionIds: chosen.map((question) => question.id),
    passMark: context.exam.passMark,
    startedAt,
    deadline,
    submittedAt: null,
  });

  batch.set(
    context.examRef,
    {
      userId: context.uid,
      courseId: context.courseId,
      organizationId: context.organizationId,
      courseTitle: text(context.course.title),
      quizId: context.exam.quizId,
      quizName: quiz.name,
      passMark: context.exam.passMark,
      attempts: FieldValue.increment(1),
      openAttemptId: attemptRef.id,
      passed: record?.passed === true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  return {
    attemptId: attemptRef.id,
    quizName: quiz.name,
    deadline: deadline ? deadline.toDate().toISOString() : null,
    questions: chosen.map((question) => toExamQuestion(question.id, question.data())),
    ...summary(context, { ...record, attempts: used + 1 }),
  };
});

// ============================================================
// SUBMIT
// ============================================================

export const submitCourseExam = onCall({ region: REGION }, async (request) => {
  const context = await loadContext(request);
  const db = getFirestore();
  const data = (request.data ?? {}) as Record<string, unknown>;
  const attemptId = text(data.attemptId);
  const answers = (data.answers && typeof data.answers === "object" ? data.answers : {}) as Record<string, unknown>;

  if (!attemptId || attemptId.includes("/")) {
    throw new HttpsError("invalid-argument", "The exam attempt is missing.");
  }

  const attemptRef = context.examRef.collection("attempts").doc(attemptId);
  const [attempt, recordSnapshot] = await Promise.all([attemptRef.get(), context.examRef.get()]);
  const record = recordSnapshot.data();

  if (!attempt.exists) {
    throw new HttpsError("not-found", "This exam attempt was not found.");
  }

  if (attempt.get("submittedAt")) {
    throw new HttpsError("failed-precondition", "This exam has already been submitted.");
  }

  const deadline = attempt.get("deadline") as Timestamp | null;
  const late = !!deadline && Date.now() > deadline.toMillis() + GRACE_MS;

  const ids: string[] = attempt.get("questionIds") ?? [];
  const questions = await questionsById(ids);

  const topicIds = [...new Set([...questions.values()].map((question) => text(question.topicId)).filter(Boolean))];
  const topicSnapshots = topicIds.length ? await db.getAll(...topicIds.map((id) => db.doc(`quizTopics/${id}`))) : [];
  const topicNames = new Map(topicSnapshots.map((snapshot) => [snapshot.id, text(snapshot.get("name")) || "Other"]));

  const topics = new Map<string, { name: string; correct: number; total: number }>();
  const missed: string[] = [];
  const graded: Record<string, string> = {};
  let correct = 0;

  for (const id of ids) {
    const question = questions.get(id);
    if (!question) {
      continue;
    }

    const answer = late ? "" : text(answers[id]).slice(0, 500);
    const isCorrect = isAnswerCorrect(question, answer);
    const topicId = text(question.topicId) || "other";
    const topic = topics.get(topicId) ?? { name: topicNames.get(topicId) ?? "Other", correct: 0, total: 0 };

    topic.total += 1;
    if (isCorrect) {
      topic.correct += 1;
      correct += 1;
    } else {
      missed.push(text(question.question));
    }

    topics.set(topicId, topic);
    graded[id] = answer;
  }

  const total = [...questions.keys()].filter((id) => ids.includes(id)).length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const passed = score >= context.exam.passMark;
  const firstPass = passed && record?.passed !== true;
  const code = firstPass ? certificateCode() : text(record?.certificateCode) || null;
  const submittedAt = Timestamp.now();

  // On the first pass, publish the certificate for verification (certificates/{code}).
  let learnerName = "";
  if (firstPass && code) {
    const [progress, profile] = await Promise.all([
      db.doc(`users/${context.uid}/courseProgress/${context.progressId}`).get(),
      db.doc(`users/${context.uid}`).get(),
    ]);
    learnerName = text(progress.get("learnerName")) || text(profile.get("displayName")) || "Zebron learner";
  }

  const batch = db.batch();

  if (firstPass && code) {
    batch.set(db.doc(`certificates/${code}`), {
      code,
      userId: context.uid,
      learnerName,
      courseId: context.courseId,
      courseTitle: text(context.course.title),
      organizationId: context.organizationId,
      providerName: text(context.course.providerName) || "Zebron",
      skills: strings(context.course.skills),
      score,
      issuedAt: submittedAt,
      revoked: false,
    });
  }

  batch.update(attemptRef, {
    answers: graded,
    correct,
    total,
    score,
    passed,
    late,
    submittedAt,
  });

  batch.set(
    context.examRef,
    {
      openAttemptId: null,
      lastScore: score,
      bestScore: Math.max(score, typeof record?.bestScore === "number" ? record.bestScore : 0),
      passed: passed || record?.passed === true,
      ...(firstPass ? { passedAt: submittedAt, passScore: score, certificateCode: code } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();

  logger.info("Course exam submitted", {
    courseId: context.courseId,
    organizationId: context.organizationId,
    score,
    passed,
    late,
  });

  const attemptsUsed = Number(record?.attempts ?? 1);

  return {
    score,
    correct,
    total,
    passed,
    late,
    passMark: context.exam.passMark,
    attemptsUsed,
    maxAttempts: context.exam.maxAttempts,
    certificateCode: passed ? code : null,
    topics: [...topics.values()],
    missed: passed ? [] : missed.slice(0, 50),
  };
});

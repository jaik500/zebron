/* eslint-disable max-len */
import { DocumentReference, FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import {
  certificateCode,
  isAnswerCorrect,
  questionsById,
  shuffle,
  strings,
  text,
  toExamQuestion,
} from "./course-exams";
import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Certifications: an ordered path of courses ending in a certification
 * exam, graded on the server.
 *
 * Definitions (written by Zebron's seed scripts now, by organization
 * managers later):
 *   certifications/{certificationId}                         Zebron
 *   organizations/{orgId}/certifications/{certificationId}   an organization
 *
 * The learner's enrollment (written only by Cloud Functions):
 *   users/{uid}/certifications/{key}            key = id, or "<orgId>__<id>"
 *   users/{uid}/certifications/{key}/attempts/{attemptId}
 *
 * Rules:
 * - Steps are counted in order. A course already passed when enrolling
 *   counts only if it was passed after the step before it; from the first
 *   gap on, courses are retaken (course-exams.ts enforces the order and
 *   allows those retakes).
 * - The exam opens when every step is counted. After maxAttempts failed
 *   attempts there is a waiting period (cooldownDays), then a new round.
 * - Passing issues a credential that expires after validityYears; once it
 *   expires the exam opens again to renew it.
 */

const REGION = "us-central1";
const GRACE_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

interface CertificationCourse {
  courseId: string;
  organizationId: string | null;
  title: string;
}

interface CertificationExamRules {
  questionsPerCourse: number;
  passMark: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  cooldownDays: number;
}

interface Context {
  uid: string;
  isAdmin: boolean;
  certificationId: string;
  organizationId: string | null;
  key: string;
  definition: FirebaseFirestore.DocumentData;
  courses: CertificationCourse[];
  courseKeys: string[];
  exam: CertificationExamRules;
  validityYears: number;
  enrollmentRef: DocumentReference;
}

function progressIdOf(course: CertificationCourse): string {
  return course.organizationId ? `${course.organizationId}__${course.courseId}` : course.courseId;
}

function readCourses(value: unknown): CertificationCourse[] {
  return (Array.isArray(value) ? value : [])
    .map((item: Record<string, unknown>) => ({
      courseId: text(item?.courseId),
      organizationId: text(item?.organizationId) || null,
      title: text(item?.title),
    }))
    .filter((course) => course.courseId && !course.courseId.includes("/") && !(course.organizationId ?? "").includes("/"));
}

function readExam(value: unknown): CertificationExamRules {
  const exam = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const number = (key: string, fallback: number, min: number, max: number) => {
    const parsed = Number(exam[key]);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? Math.round(parsed) : fallback;
  };
  const minutes = Number(exam.timeLimitMinutes);

  return {
    questionsPerCourse: number("questionsPerCourse", 5, 1, 50),
    passMark: number("passMark", 75, 1, 100),
    timeLimitMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : null,
    maxAttempts: number("maxAttempts", 3, 1, 20),
    cooldownDays: number("cooldownDays", 7, 0, 365),
  };
}

function millis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

/** Load the definition and check the learner may use it. */
async function loadContext(request: CallableRequest<unknown>): Promise<Context> {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to work toward a certification.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const certificationId = text(data.certificationId);
  const organizationId = text(data.organizationId) || null;

  if (!certificationId || certificationId.includes("/") || (organizationId ?? "").includes("/")) {
    throw new HttpsError("invalid-argument", "A certification is required.");
  }

  const db = getFirestore();
  const uid = request.auth.uid;
  const isAdmin = await isPlatformAdministrator(request);

  const [definitionSnapshot, membership, entitlement] = await Promise.all([
    db.doc(organizationId ? `organizations/${organizationId}/certifications/${certificationId}` : `certifications/${certificationId}`).get(),
    organizationId ? db.doc(`organizationMemberships/${uid}_${organizationId}`).get() : Promise.resolve(null),
    organizationId ? db.doc(`organizations/${organizationId}/applications/courses`).get() : Promise.resolve(null),
  ]);

  const definition = definitionSnapshot.data();
  if (!definitionSnapshot.exists || !definition || (definition.status !== "published" && !isAdmin)) {
    throw new HttpsError("not-found", "This certification is not available.");
  }

  if (organizationId && !isAdmin && (membership?.get("active") !== true || entitlement?.get("status") !== "active")) {
    throw new HttpsError("permission-denied", "This certification is for members of the organization.");
  }

  const courses = readCourses(definition.courses);
  if (!courses.length) {
    throw new HttpsError("failed-precondition", "This certification has no courses yet.");
  }

  const key = organizationId ? `${organizationId}__${certificationId}` : certificationId;
  const years = Number(definition.validityYears);

  return {
    uid,
    isAdmin,
    certificationId,
    organizationId,
    key,
    definition,
    courses,
    courseKeys: courses.map(progressIdOf),
    exam: readExam(definition.exam),
    validityYears: Number.isFinite(years) && years > 0 ? years : 3,
    enrollmentRef: db.doc(`users/${uid}/certifications/${key}`),
  };
}

/**
 * Count steps in order from the course exam records: a passed course
 * counts when it was passed at or after the step before it. Stops at the
 * first gap; everything after it is retaken.
 */
async function countSteps(context: Context, existing: Record<string, unknown>): Promise<Record<string, Timestamp>> {
  const db = getFirestore();
  const exams = await db.getAll(...context.courseKeys.map((key) => db.doc(`users/${context.uid}/courseExams/${key}`)));
  const passes: Record<string, Timestamp> = {};
  let last = 0;

  for (const [index, key] of context.courseKeys.entries()) {
    const kept = existing[key];
    if (kept instanceof Timestamp && kept.toMillis() >= last) {
      passes[key] = kept;
      last = kept.toMillis();
      continue;
    }

    const exam = exams[index];
    const passedAt = exam.get("passedAt");
    if (exam.get("passed") === true && passedAt instanceof Timestamp && passedAt.toMillis() >= last) {
      passes[key] = passedAt;
      last = passedAt.toMillis();
      continue;
    }

    break;
  }

  return passes;
}

function summaryOf(context: Context, enrollment: FirebaseFirestore.DocumentData | undefined) {
  const passes = (enrollment?.stepPasses ?? {}) as Record<string, unknown>;
  const exam = (enrollment?.exam ?? {}) as Record<string, unknown>;
  const credential = (enrollment?.credential ?? null) as Record<string, unknown> | null;

  return {
    key: context.key,
    stepsDone: context.courseKeys.filter((key) => passes[key]).length,
    steps: context.courseKeys.length,
    attemptsUsed: Number(exam.attempts ?? 0),
    maxAttempts: context.exam.maxAttempts,
    lockedUntil: millis(exam.lockedUntil),
    credentialCode: credential ? text(credential.code) || null : null,
    expiresAt: credential ? millis(credential.expiresAt) : null,
  };
}

// ============================================================
// ENROLL (also re-syncs the steps)
// ============================================================

export const enrollInCertification = onCall({ region: REGION }, async (request) => {
  const context = await loadContext(request);
  const snapshot = await context.enrollmentRef.get();
  const existing = snapshot.data();
  const stepPasses = await countSteps(context, (existing?.stepPasses ?? {}) as Record<string, unknown>);

  const enrollment = {
    userId: context.uid,
    certificationId: context.certificationId,
    organizationId: context.organizationId,
    title: text(context.definition.title),
    credentialName: text(context.definition.credentialName) || text(context.definition.title),
    courseKeys: context.courseKeys,
    courseTitles: context.courses.map((course) => course.title),
    stepPasses,
    updatedAt: FieldValue.serverTimestamp(),
    ...(snapshot.exists ? {} : { enrolledAt: FieldValue.serverTimestamp(), exam: { attempts: 0 }, credential: null }),
  };

  // stepPasses is replaced as a whole so steps no longer in order are dropped.
  await context.enrollmentRef.set(enrollment, { merge: true });
  await context.enrollmentRef.update({ stepPasses });

  logger.info("Certification enrollment.", { certificationId: context.certificationId, organizationId: context.organizationId, steps: Object.keys(stepPasses).length });

  return summaryOf(context, { ...existing, stepPasses });
});

// ============================================================
// START THE CERTIFICATION EXAM
// ============================================================

export const startCertificationExam = onCall({ region: REGION, timeoutSeconds: 120 }, async (request) => {
  const context = await loadContext(request);
  const db = getFirestore();
  const snapshot = await context.enrollmentRef.get();
  const enrollment = snapshot.data();

  if (!snapshot.exists || !enrollment) {
    throw new HttpsError("failed-precondition", "Enroll in the certification first.");
  }

  const passes = (enrollment.stepPasses ?? {}) as Record<string, unknown>;
  const gap = context.courseKeys.findIndex((key) => !passes[key]);
  if (gap >= 0 && !context.isAdmin) {
    throw new HttpsError("failed-precondition", `Pass every course first. Next: step ${gap + 1}, ${context.courses[gap].title}.`);
  }

  const credential = (enrollment.credential ?? null) as Record<string, unknown> | null;
  const expiresAt = credential ? millis(credential.expiresAt) : null;
  if (credential && expiresAt && expiresAt > Date.now()) {
    throw new HttpsError("already-exists", "You already hold this certification. You can renew it when it expires.");
  }

  const exam = (enrollment.exam ?? {}) as Record<string, unknown>;
  const lockedUntil = millis(exam.lockedUntil);
  if (lockedUntil && lockedUntil > Date.now() && !context.isAdmin) {
    throw new HttpsError("resource-exhausted", `You can try again on ${new Date(lockedUntil).toISOString().slice(0, 10)}.`);
  }

  // An attempt in progress continues after a page refresh.
  const openAttemptId = text(exam.openAttemptId);
  if (openAttemptId) {
    const attempt = await context.enrollmentRef.collection("attempts").doc(openAttemptId).get();
    const deadline = attempt.get("deadline") as Timestamp | null;
    if (attempt.exists && !attempt.get("submittedAt") && (!deadline || deadline.toMillis() + GRACE_MS > Date.now())) {
      const ids: string[] = attempt.get("questionIds") ?? [];
      const questions = await questionsById(ids);
      return {
        attemptId: attempt.id,
        deadline: deadline ? deadline.toDate().toISOString() : null,
        questions: ids.filter((id) => questions.has(id)).map((id) => toExamQuestion(id, questions.get(id)!)),
        passMark: context.exam.passMark,
        ...summaryOf(context, enrollment),
      };
    }
  }

  const used = lockedUntil && lockedUntil <= Date.now() ? 0 : Number(exam.attempts ?? 0);
  if (used >= context.exam.maxAttempts && !context.isAdmin) {
    throw new HttpsError("resource-exhausted", "You have used all your attempts for now.");
  }

  // Draw questions from each course's final exam quiz.
  const chosenIds: string[] = [];
  const chosenCourses: string[] = [];
  const questionData = new Map<string, FirebaseFirestore.DocumentData>();

  for (const course of context.courses) {
    const courseSnapshot = await db.doc(course.organizationId ? `organizations/${course.organizationId}/courses/${course.courseId}` : `courses/${course.courseId}`).get();
    const quizId = text((courseSnapshot.get("finalExam") ?? {}).quizId);
    if (!quizId) {
      continue;
    }

    const quiz = await db.doc(`quizzes/${quizId}`).get();
    const quizOrganizationId = text(quiz.get("organizationId")) || null;
    if (!quiz.exists || quiz.get("active") === false || (quizOrganizationId && quizOrganizationId !== course.organizationId)) {
      continue;
    }

    const published = await db
      .collection("quizQuestions")
      .where("organizationId", "==", quizOrganizationId)
      .where("quizId", "==", quizId)
      .where("status", "==", "published")
      .get();

    for (const question of shuffle(published.docs).slice(0, context.exam.questionsPerCourse)) {
      chosenIds.push(question.id);
      chosenCourses.push(course.title);
      questionData.set(question.id, question.data());
    }
  }

  if (!chosenIds.length) {
    throw new HttpsError("failed-precondition", "The certification exam has no questions yet.");
  }

  // Mix the courses together, keeping each question's course for the results.
  const order = shuffle(chosenIds.map((_, index) => index));
  const questionIds = order.map((index) => chosenIds[index]);
  const questionCourses = order.map((index) => chosenCourses[index]);

  const startedAt = Timestamp.now();
  const deadline = context.exam.timeLimitMinutes ? Timestamp.fromMillis(startedAt.toMillis() + context.exam.timeLimitMinutes * 60 * 1000) : null;
  const attemptRef = context.enrollmentRef.collection("attempts").doc();

  const batch = db.batch();
  batch.set(attemptRef, { questionIds, questionCourses, passMark: context.exam.passMark, startedAt, deadline, submittedAt: null });
  batch.set(
    context.enrollmentRef,
    { exam: { attempts: used + 1, openAttemptId: attemptRef.id, lockedUntil: null }, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await batch.commit();

  return {
    attemptId: attemptRef.id,
    deadline: deadline ? deadline.toDate().toISOString() : null,
    questions: questionIds.map((id) => toExamQuestion(id, questionData.get(id)!)),
    passMark: context.exam.passMark,
    ...summaryOf(context, { ...enrollment, exam: { ...exam, attempts: used + 1, lockedUntil: null } }),
  };
});

// ============================================================
// SUBMIT THE CERTIFICATION EXAM
// ============================================================

export const submitCertificationExam = onCall({ region: REGION }, async (request) => {
  const context = await loadContext(request);
  const db = getFirestore();
  const data = (request.data ?? {}) as Record<string, unknown>;
  const attemptId = text(data.attemptId);
  const answers = (data.answers && typeof data.answers === "object" ? data.answers : {}) as Record<string, unknown>;

  if (!attemptId || attemptId.includes("/")) {
    throw new HttpsError("invalid-argument", "The exam attempt is missing.");
  }

  const attemptRef = context.enrollmentRef.collection("attempts").doc(attemptId);
  const [attempt, enrollmentSnapshot] = await Promise.all([attemptRef.get(), context.enrollmentRef.get()]);
  const enrollment = enrollmentSnapshot.data() ?? {};

  if (!attempt.exists) {
    throw new HttpsError("not-found", "This exam attempt was not found.");
  }
  if (attempt.get("submittedAt")) {
    throw new HttpsError("failed-precondition", "This exam has already been submitted.");
  }

  const deadline = attempt.get("deadline") as Timestamp | null;
  const late = !!deadline && Date.now() > deadline.toMillis() + GRACE_MS;
  const ids: string[] = attempt.get("questionIds") ?? [];
  const courseOf: string[] = attempt.get("questionCourses") ?? [];
  const questions = await questionsById(ids);

  const sections = new Map<string, { name: string; correct: number; total: number }>();
  const missed: string[] = [];
  const graded: Record<string, string> = {};
  let correct = 0;
  let total = 0;

  ids.forEach((id, index) => {
    const question = questions.get(id);
    if (!question) {
      return;
    }
    const answer = late ? "" : text(answers[id]).slice(0, 500);
    const right = isAnswerCorrect(question, answer);
    const name = courseOf[index] || "Other";
    const section = sections.get(name) ?? { name, correct: 0, total: 0 };
    section.total += 1;
    total += 1;
    if (right) {
      section.correct += 1;
      correct += 1;
    } else {
      missed.push(text(question.question));
    }
    sections.set(name, section);
    graded[id] = answer;
  });

  const score = total ? Math.round((correct / total) * 100) : 0;
  const passed = score >= context.exam.passMark;
  const submittedAt = Timestamp.now();
  const exam = (enrollment.exam ?? {}) as Record<string, unknown>;
  const attemptsUsed = Number(exam.attempts ?? 1);
  const bestScore = Math.max(score, typeof exam.bestScore === "number" ? exam.bestScore : 0);

  const batch = db.batch();
  batch.update(attemptRef, { answers: graded, correct, total, score, passed, late, submittedAt });

  let code: string | null = null;
  let expiresAt: Timestamp | null = null;
  let lockedUntil: Timestamp | null = null;

  if (passed) {
    code = certificateCode();
    const expiry = new Date(submittedAt.toMillis());
    expiry.setFullYear(expiry.getFullYear() + context.validityYears);
    expiresAt = Timestamp.fromDate(expiry);

    const profile = await db.doc(`users/${context.uid}`).get();
    const learnerName =
      text(profile.get("displayName")) ||
      [text(profile.get("firstName")), text(profile.get("lastName"))].filter(Boolean).join(" ") ||
      "Zebron learner";

    batch.set(db.doc(`certificates/${code}`), {
      code,
      kind: "certification",
      userId: context.uid,
      learnerName,
      certificationId: context.certificationId,
      courseId: null,
      courseTitle: text(context.definition.credentialName) || text(context.definition.title),
      organizationId: context.organizationId,
      providerName: text(context.definition.providerName) || "Zebron",
      skills: strings(context.definition.preparesFor),
      score,
      issuedAt: submittedAt,
      expiresAt,
      revoked: false,
    });

    batch.set(
      context.enrollmentRef,
      {
        exam: { attempts: 0, openAttemptId: null, lockedUntil: null, lastScore: score, bestScore, passedAt: submittedAt },
        credential: { code, issuedAt: submittedAt, expiresAt, score },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    // After the last attempt of a round, wait before a new round starts.
    const roundOver = attemptsUsed >= context.exam.maxAttempts;
    lockedUntil = roundOver && context.exam.cooldownDays > 0 ? Timestamp.fromMillis(submittedAt.toMillis() + context.exam.cooldownDays * DAY_MS) : null;

    batch.set(
      context.enrollmentRef,
      {
        exam: {
          attempts: roundOver ? 0 : attemptsUsed,
          openAttemptId: null,
          lockedUntil,
          lastScore: score,
          bestScore,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await batch.commit();

  logger.info("Certification exam submitted.", { certificationId: context.certificationId, organizationId: context.organizationId, score, passed, late });

  return {
    score,
    correct,
    total,
    passed,
    late,
    passMark: context.exam.passMark,
    attemptsUsed,
    maxAttempts: context.exam.maxAttempts,
    lockedUntil: lockedUntil ? lockedUntil.toMillis() : null,
    certificateCode: code,
    expiresAt: expiresAt ? expiresAt.toMillis() : null,
    sections: [...sections.values()],
    missed: passed ? [] : missed.slice(0, 50),
  };
});

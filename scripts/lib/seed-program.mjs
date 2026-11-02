/**
 * Shared engine for Zebron program seed scripts (Cybersecurity, ServiceNow, …).
 *
 * A program is a folder of course files (01-….mjs, 02-….mjs) built with
 * helpers.mjs. For each course it writes, as Zebron (platform) content:
 *   courses/{courseId}                     the course (outline, final exam)
 *   courses/{courseId}/lessons/{lessonId}  lesson blocks, each with a quick check
 *   quizzes/{courseId}-quiz                the course's question bank (platform, public)
 *   quizTopics/{quizId}--{topic}           one topic per lesson
 *   quizQuestions/{quizId}--q01 …          published questions of several types
 *
 * Platform quizzes have no program record (programs belong to
 * organizations), so the program name is stored as programName and shows
 * as the quiz category in the learner quiz library.
 *
 * Flags read from the command line:
 *   --check       validate the content only (no Firebase)
 *   (none)        dry run: what would be written
 *   --apply       write courses and quizzes that do not exist yet
 *   --overwrite   with --apply, replace existing ones from this program
 *                 (learner progress and results are kept)
 *   --update-programs  only set program and step on existing courses, and
 *                 write the program's certification (add --apply to write)
 */
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const COVERS = ["teal", "navy", "sunrise", "violet", "sky", "slate"];
const LEVELS = ["beginner", "intermediate", "advanced", "all"];
const TYPES = ["multiple-choice", "true-false", "multiple-select", "short-text", "numeric", "ordering"];
const DIFFICULTIES = ["easy", "medium", "hard"];

/**
 * Seed one program folder.
 *
 * @param {object} options
 * @param {string} options.programName  shown as the quiz category, e.g. "Cybersecurity Program"
 * @param {string} options.courseTopic  the course catalog topic, e.g. "Cybersecurity"
 * @param {string} options.folder       absolute path of the folder with 01-….mjs content files
 * @param {string} options.idPrefix     course id prefix removed for question tags, e.g. "cybersecurity-"
 * @param {object} [options.certification]  a certification over all the program's courses, in order:
 *   { id, title, credentialName, summary, description, preparesFor[], level, cover,
 *     exam: { questionsPerCourse, passMark, timeLimitMinutes, maxAttempts, cooldownDays }, validityYears }
 */
export async function seedProgram({ programName, courseTopic, folder, idPrefix, certification = null }) {
const PROGRAM_NAME = programName;
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");

// ------------------------------------------------------------------
// Load and validate the content
// ------------------------------------------------------------------

const files = (await readdir(folder)).filter((name) => /^\d\d-.+\.mjs$/.test(name)).sort();
const courses = [];

for (const file of files) {
  courses.push((await import(pathToFileURL(join(folder, file)).href)).default);
}

const problems = [];
const problem = (course, message) => problems.push(`${course?.id ?? "?"}: ${message}`);

for (const course of courses) {
  validateCourse(course);
}

let totalLessons = 0;
let totalQuestions = 0;

for (const course of courses) {
  const lessons = course.modules.flatMap((module) => module.lessons);
  totalLessons += lessons.length;
  totalQuestions += course.questions.length;
  const types = course.questions.reduce((counts, question) => ({ ...counts, [question.type]: (counts[question.type] ?? 0) + 1 }), {});
  console.log(
    `${String(course.order).padStart(2)}. ${course.title}: ${lessons.length} lessons, ${course.topics.length} topics, ` +
      `${course.questions.length} questions (${Object.entries(types).map(([type, count]) => `${count} ${type}`).join(", ")})`,
  );
}

console.log(`\n${courses.length} courses, ${totalLessons} lessons, ${totalQuestions} questions.`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

console.log("Content is valid.");

if (CHECK_ONLY) {
  return;
}

// ------------------------------------------------------------------
// Write
// ------------------------------------------------------------------

const { initializeApp, applicationDefault } = await import("firebase-admin/app");
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();
const now = FieldValue.serverTimestamp();

console.log(`\nProject ${PROJECT_ID}${APPLY ? "" : " (dry run)"}\n`);

if (args.has("--update-programs")) {
  await seedCertification(true);
  // Only set program and step on courses that already exist (nothing else changes).
  for (const course of courses) {
    const ref = db.collection("courses").doc(course.id);
    if (!(await ref.get()).exists) {
      console.log(`skip   course ${course.id} (not created yet; run --apply first)`);
      continue;
    }
    console.log(`${APPLY ? "update" : "would "} course ${course.id}: program "${PROGRAM_NAME}", step ${course.order}`);
    if (APPLY) {
      await ref.update({ program: PROGRAM_NAME, programOrder: course.order, updatedAt: now });
    }
  }
  console.log(APPLY ? "\nDone." : "\nDry run only. Run again with --apply to write.");
  return;
}

for (const course of courses) {
  await seedQuiz(course);
  await seedCourse(course);
}
await seedCertification(OVERWRITE);

console.log(APPLY ? "\nDone." : "\nDry run only. Run again with --apply to write.");

// ------------------------------------------------------------------

/** certifications/{id}: the program's courses in order, with the exam rules. */
async function seedCertification(replace) {
  if (!certification) {
    return;
  }
  const ref = db.collection("certifications").doc(certification.id);
  const existing = await ref.get();
  if (existing.exists && !replace) {
    console.log(`skip   certification ${certification.id} (already exists; pass --overwrite to replace)`);
    return;
  }
  // Explicit course list (for example the Cybersecurity courses plus this folder's), or this folder's courses.
  const pathCourses = certification.courses ?? courses.map((course) => ({ courseId: course.id, title: course.title }));
  console.log(`${APPLY ? "write " : "would "} certification ${certification.id}: ${pathCourses.length} courses in order${certification.kind === "exam-prep" ? `, ${certification.objectives?.length ?? 0} objectives mapped` : ""}`);
  if (!APPLY) {
    return;
  }
  await ref.set({
    title: certification.title,
    credentialName: certification.credentialName,
    summary: certification.summary ?? "",
    description: certification.description ?? "",
    preparesFor: certification.preparesFor ?? [],
    level: certification.level ?? "intermediate",
    cover: certification.cover ?? "navy",
    providerName: "Zebron",
    programName: PROGRAM_NAME,
    organizationId: null,
    courses: pathCourses.map((course) => ({ courseId: course.courseId, organizationId: null, title: course.title })),
    // Industry exam preparation: vendor exam, official domains and the objective map.
    kind: certification.kind ?? "zebron",
    ...(certification.kind === "exam-prep"
      ? { vendor: certification.vendor, domains: certification.domains, objectives: certification.objectives }
      : {}),
    exam: {
      questionsPerCourse: 5,
      passMark: 75,
      timeLimitMinutes: 60,
      maxAttempts: 3,
      cooldownDays: 7,
      ...(certification.exam ?? {}),
    },
    validityYears: certification.validityYears ?? 3,
    status: "published",
    createdAt: existing.exists ? existing.get("createdAt") ?? now : now,
    updatedAt: now,
  });
}

function quizIdOf(course) {
  return `${course.id}-quiz`;
}

async function seedQuiz(course) {
  const quizId = quizIdOf(course);
  const quizRef = db.collection("quizzes").doc(quizId);
  const existing = await quizRef.get();

  // Platform quiz slugs must be unique.
  const sameSlug = await db.collection("quizzes").where("scope", "==", "platform").where("slug", "==", course.quiz.slug).get();
  if (sameSlug.docs.some((doc) => doc.id !== quizId)) {
    console.log(`skip   quiz ${course.quiz.slug} (another platform quiz already uses this slug)`);
    return;
  }

  if (existing.exists && !OVERWRITE) {
    console.log(`skip   quiz ${quizId} (already exists; pass --overwrite to replace)`);
    return;
  }

  console.log(`${APPLY ? "write " : "would "} quiz ${quizId}: ${course.topics.length} topics, ${course.questions.length} questions`);
  if (!APPLY) {
    return;
  }

  const batch = db.batch();
  const countsByTopic = course.questions.reduce((counts, question) => ({ ...counts, [question.topic]: (counts[question.topic] ?? 0) + 1 }), {});

  batch.set(quizRef, {
    organizationId: null,
    scope: "platform",
    accessType: "public",
    programId: null,
    programName: PROGRAM_NAME,
    name: course.quiz.name,
    slug: course.quiz.slug,
    description: course.quiz.description,
    provider: "Zebron",
    type: "course",
    certificationCode: null,
    imageUrl: null,
    level: capitalize(course.level),
    tags: course.quiz.tags ?? [],
    active: true,
    questionCount: course.questions.length,
    createdAt: existing.exists ? existing.get("createdAt") ?? now : now,
    updatedAt: now,
  });

  // Topics: one per lesson, in lesson order.
  const topicIds = new Map();
  course.topics.forEach((topic, index) => {
    const topicId = `${quizId}--${topic.key}`;
    topicIds.set(topic.key, topicId);
    batch.set(db.collection("quizTopics").doc(topicId), {
      scope: "platform",
      organizationId: null,
      quizId,
      name: topic.name,
      slug: topic.key,
      description: topic.description,
      sortOrder: index,
      questionCount: countsByTopic[topic.key] ?? 0,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Questions.
  const keptQuestionIds = new Set();
  course.questions.forEach((question, index) => {
    const questionId = `${quizId}--q${String(index + 1).padStart(2, "0")}`;
    keptQuestionIds.add(questionId);
    const { topic, hint, ...fields } = question;
    batch.set(db.collection("quizQuestions").doc(questionId), {
      ...fields,
      scope: "platform",
      organizationId: null,
      quizId,
      topicId: topicIds.get(topic),
      hint: hint ?? null,
      tags: [course.id.startsWith(idPrefix) ? course.id.slice(idPrefix.length) : course.id, topic],
      sourceType: "original",
      sourceReference: null,
      status: "published",
      importKey: questionId,
      createdAt: now,
      updatedAt: now,
    });
  });

  // On overwrite, remove topics and questions this program wrote before but no longer has.
  if (existing.exists) {
    const [oldTopics, oldQuestions] = await Promise.all([
      db.collection("quizTopics").where("quizId", "==", quizId).get(),
      db.collection("quizQuestions").where("quizId", "==", quizId).get(),
    ]);
    const keptTopicIds = new Set(topicIds.values());
    oldTopics.docs.filter((doc) => doc.id.startsWith(`${quizId}--`) && !keptTopicIds.has(doc.id)).forEach((doc) => batch.delete(doc.ref));
    oldQuestions.docs.filter((doc) => doc.id.startsWith(`${quizId}--`) && !keptQuestionIds.has(doc.id)).forEach((doc) => batch.delete(doc.ref));
  }

  await batch.commit();
}

async function seedCourse(course) {
  const courseRef = db.collection("courses").doc(course.id);
  const existing = await courseRef.get();

  if (existing.exists && !OVERWRITE) {
    console.log(`skip   course ${course.id} (already exists; pass --overwrite to replace)`);
    return;
  }

  let order = 0;
  const lessons = [];
  const modules = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => {
      order += 1;
      lessons.push({ ...lesson, moduleId: module.id, order });
      return { id: lesson.id, title: lesson.title, minutes: lesson.minutes, hasCheck: lesson.blocks.some((block) => block.type === "check") };
    }),
  }));
  const estimatedMinutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);

  console.log(`${APPLY ? "write " : "would "} course ${course.id}: ${modules.length} modules, ${lessons.length} lessons, ${estimatedMinutes} min`);
  if (!APPLY) {
    return;
  }

  const batch = db.batch();
  batch.set(courseRef, {
    title: course.title,
    summary: course.summary,
    description: course.description,
    topic: courseTopic,
    program: PROGRAM_NAME,
    programOrder: course.order,
    level: course.level,
    cover: course.cover,
    outcomes: course.outcomes,
    skills: course.skills,
    modules,
    lessonCount: lessons.length,
    estimatedMinutes,
    finalExam: {
      quizId: quizIdOf(course),
      quizName: course.quiz.name,
      questionCount: Math.min(20, course.questions.length),
      passMark: 70,
      timeLimitMinutes: 30,
      maxAttempts: 3,
    },
    status: "published",
    providerName: "Zebron",
    authorId: "",
    authorName: "Zebron",
    organizationId: null,
    review: null,
    createdAt: existing.exists ? existing.get("createdAt") ?? now : now,
    publishedAt: existing.exists ? existing.get("publishedAt") ?? now : now,
    updatedAt: now,
  });

  const keep = new Set(lessons.map((lesson) => lesson.id));
  if (existing.exists) {
    const current = await courseRef.collection("lessons").get();
    current.docs.filter((doc) => !keep.has(doc.id)).forEach((doc) => batch.delete(doc.ref));
  }

  for (const lesson of lessons) {
    batch.set(courseRef.collection("lessons").doc(lesson.id), {
      title: lesson.title,
      moduleId: lesson.moduleId,
      order: lesson.order,
      minutes: lesson.minutes,
      blocks: lesson.blocks,
      updatedAt: now,
    });
  }

  await batch.commit();
}

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------

function validateCourse(course) {
  if (!/^[a-z0-9-]{3,80}$/.test(course.id ?? "")) problem(course, "id must be lower-case letters, digits and dashes");
  if (!course.title || course.title.length > 200) problem(course, "title missing or too long");
  if ((course.summary ?? "").length > 400) problem(course, "summary over 400 characters");
  if (!LEVELS.includes(course.level)) problem(course, `level must be one of ${LEVELS.join(", ")}`);
  if (!COVERS.includes(course.cover)) problem(course, `cover must be one of ${COVERS.join(", ")}`);
  if (!course.quiz?.name || !/^[a-z0-9-]{3,80}$/.test(course.quiz?.slug ?? "")) problem(course, "quiz name or slug missing");

  const topicKeys = new Set(course.topics.map((topic) => topic.key));
  if (topicKeys.size !== course.topics.length) problem(course, "duplicate topic keys");

  const lessonIds = new Set();
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lessonIds.has(lesson.id)) problem(course, `duplicate lesson id ${lesson.id}`);
      lessonIds.add(lesson.id);
      if (!/^[a-z0-9-]{2,80}$/.test(lesson.id)) problem(course, `lesson id ${lesson.id} must be lower-case letters, digits and dashes`);
      if (lesson.blocks.length > 60) problem(course, `${lesson.id}: more than 60 blocks`);
      if (!lesson.blocks.some((block) => block.type === "check")) problem(course, `${lesson.id}: no quick check`);
      for (const block of lesson.blocks) {
        if (block.type === "check" && !(block.answer >= 0 && block.answer < block.options.length)) {
          problem(course, `${lesson.id}: quick check answer out of range`);
        }
        if ((block.type === "text" || block.type === "tip") && !block.text) problem(course, `${lesson.id}: empty ${block.type} block`);
      }
    }
  }

  const seen = new Set();
  course.questions.forEach((question, index) => {
    const where = `question ${index + 1}`;
    if (!topicKeys.has(question.topic)) problem(course, `${where}: unknown topic ${question.topic}`);
    if (!TYPES.includes(question.type)) problem(course, `${where}: unknown type ${question.type}`);
    if (!DIFFICULTIES.includes(question.difficulty)) problem(course, `${where}: difficulty must be easy, medium or hard`);
    if (!question.question?.trim()) problem(course, `${where}: no text`);
    if (!question.explanation?.trim()) problem(course, `${where}: no explanation`);
    if (seen.has(question.question)) problem(course, `${where}: duplicate question`);
    seen.add(question.question);

    const ids = question.options.map((option) => option.id);
    if (question.options.some((option) => !option.text?.trim())) problem(course, `${where}: empty option`);
    if (new Set(question.options.map((option) => option.text.trim())).size !== question.options.length) {
      problem(course, `${where}: duplicate options`);
    }

    switch (question.type) {
      case "multiple-choice":
        if (ids.length < 3 || !ids.includes(question.correctAnswer)) problem(course, `${where}: needs 3+ options and a valid answer`);
        break;
      case "multiple-select":
        if (ids.length < 3 || !question.correctAnswers.length || question.correctAnswers.some((id) => !ids.includes(id))) {
          problem(course, `${where}: invalid multiple-select answers`);
        }
        if (question.correctAnswers.length === ids.length) problem(course, `${where}: every option is correct`);
        break;
      case "ordering":
        if (ids.length < 3) problem(course, `${where}: ordering needs 3+ steps`);
        break;
      case "short-text":
        if (!question.acceptedAnswers?.length) problem(course, `${where}: no accepted answers`);
        break;
      case "numeric":
        if (!Number.isFinite(question.numericAnswer)) problem(course, `${where}: no numeric answer`);
        break;
    }
  });

  for (const topic of course.topics) {
    const count = course.questions.filter((question) => question.topic === topic.key).length;
    if (count < 3) problem(course, `topic ${topic.key} has only ${count} questions`);
  }

  if (course.questions.length < 20) problem(course, "fewer than 20 questions (the final exam draws 20)");
}

function capitalize(value) {
  return value === "all" ? "All levels" : value.charAt(0).toUpperCase() + value.slice(1);
}
} // end seedProgram

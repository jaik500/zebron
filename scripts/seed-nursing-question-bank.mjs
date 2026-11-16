/**
 * Seed the NCLEX-RN Practice Question Bank into the Test Center (platform,
 * public): one quiz, eight topics (the NCLEX-RN Client Needs categories) and
 * 200 published questions. There is no course; learners practise by topic or
 * take mixed tests. Content: scripts/nursing-question-bank/nclex-rn-practice.mjs.
 *
 * Writes:
 *   quizzes/nclex-rn-practice-quiz
 *   quizTopics/nclex-rn-practice-quiz--{topic}
 *   quizQuestions/nclex-rn-practice-quiz--q001 … q200
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-nursing-question-bank.mjs --check              # validate only (no Firebase)
 *   node scripts/seed-nursing-question-bank.mjs                      # dry run
 *   node scripts/seed-nursing-question-bank.mjs --apply              # write if it doesn't exist yet
 *   node scripts/seed-nursing-question-bank.mjs --apply --overwrite  # replace (results are kept)
 */
import { QUESTIONS, QUIZ, TOPICS } from "./nursing-question-bank/nclex-rn-practice.mjs";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const TYPES = ["multiple-choice", "true-false", "multiple-select", "short-text", "numeric", "ordering"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");

// ------------------------------------------------------------------
// Validate
// ------------------------------------------------------------------

const problems = [];
const topicKeys = new Set(TOPICS.map((topic) => topic.key));
if (topicKeys.size !== TOPICS.length) problems.push("duplicate topic keys");
if (!/^[a-z0-9-]{3,80}$/.test(QUIZ.slug)) problems.push("invalid quiz slug");

const seen = new Set();
QUESTIONS.forEach((question, index) => {
  const where = `question ${index + 1}`;
  if (!topicKeys.has(question.topic)) problems.push(`${where}: unknown topic ${question.topic}`);
  if (!TYPES.includes(question.type)) problems.push(`${where}: unknown type ${question.type}`);
  if (!DIFFICULTIES.includes(question.difficulty)) problems.push(`${where}: bad difficulty`);
  if (!question.question?.trim()) problems.push(`${where}: no text`);
  if (!question.explanation?.trim()) problems.push(`${where}: no explanation`);
  if (seen.has(question.question)) problems.push(`${where}: duplicate question`);
  seen.add(question.question);

  const ids = question.options.map((option) => option.id);
  if (question.options.some((option) => !option.text?.trim())) problems.push(`${where}: empty option`);
  if (new Set(question.options.map((option) => option.text.trim())).size !== question.options.length) {
    problems.push(`${where}: duplicate options`);
  }
  switch (question.type) {
    case "multiple-choice":
      if (ids.length < 3 || !ids.includes(question.correctAnswer)) problems.push(`${where}: needs 3+ options and a valid answer`);
      break;
    case "multiple-select":
      if (ids.length < 3 || !question.correctAnswers.length || question.correctAnswers.some((id) => !ids.includes(id))) {
        problems.push(`${where}: invalid multiple-select answers`);
      }
      if (question.correctAnswers.length === ids.length) problems.push(`${where}: every option is correct`);
      break;
    case "ordering":
      if (ids.length < 3) problems.push(`${where}: ordering needs 3+ steps`);
      break;
    case "numeric":
      if (!Number.isFinite(question.numericAnswer)) problems.push(`${where}: no numeric answer`);
      break;
  }
});

const countsByTopic = QUESTIONS.reduce((counts, question) => ({ ...counts, [question.topic]: (counts[question.topic] ?? 0) + 1 }), {});
const countsByType = QUESTIONS.reduce((counts, question) => ({ ...counts, [question.type]: (counts[question.type] ?? 0) + 1 }), {});

console.log(`${QUIZ.name}: ${QUESTIONS.length} questions`);
for (const topic of TOPICS) {
  const count = countsByTopic[topic.key] ?? 0;
  console.log(`  ${String(count).padStart(3)}  ${topic.name}`);
  if (count < 3) problems.push(`topic ${topic.key} has only ${count} questions`);
}
console.log(`  types: ${Object.entries(countsByType).map(([type, count]) => `${count} ${type}`).join(", ")}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Content is valid.");

if (CHECK_ONLY) {
  process.exit(0);
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

const quizId = QUIZ.id;
const quizRef = db.collection("quizzes").doc(quizId);
const existing = await quizRef.get();

const sameSlug = await db.collection("quizzes").where("scope", "==", "platform").where("slug", "==", QUIZ.slug).get();
if (sameSlug.docs.some((doc) => doc.id !== quizId)) {
  console.log(`skip   quiz ${QUIZ.slug} (another platform quiz already uses this slug)`);
  process.exit(0);
}
if (existing.exists && !OVERWRITE) {
  console.log(`skip   quiz ${quizId} (already exists; pass --overwrite to replace)`);
  process.exit(0);
}

console.log(`${APPLY ? "write " : "would "} quiz ${quizId}: ${TOPICS.length} topics, ${QUESTIONS.length} questions`);
if (!APPLY) {
  console.log("\nDry run only. Run again with --apply to write.");
  process.exit(0);
}

const batch = db.batch();

batch.set(quizRef, {
  organizationId: null,
  scope: "platform",
  accessType: "public",
  programId: null,
  programName: QUIZ.programName,
  name: QUIZ.name,
  slug: QUIZ.slug,
  description: QUIZ.description,
  provider: "Zebron",
  type: QUIZ.type,
  certificationCode: null,
  imageUrl: null,
  level: QUIZ.level,
  tags: QUIZ.tags,
  active: true,
  questionCount: QUESTIONS.length,
  createdAt: existing.exists ? existing.get("createdAt") ?? now : now,
  updatedAt: now,
});

const topicIds = new Map();
TOPICS.forEach((topic, index) => {
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

const keptQuestionIds = new Set();
QUESTIONS.forEach((question, index) => {
  const questionId = `${quizId}--q${String(index + 1).padStart(3, "0")}`;
  keptQuestionIds.add(questionId);
  const { topic, hint, ...fields } = question;
  batch.set(db.collection("quizQuestions").doc(questionId), {
    ...fields,
    scope: "platform",
    organizationId: null,
    quizId,
    topicId: topicIds.get(topic),
    hint: hint ?? null,
    tags: ["nclex-rn", topic],
    sourceType: "original",
    sourceReference: null,
    status: "published",
    importKey: questionId,
    createdAt: now,
    updatedAt: now,
  });
});

// On overwrite, remove topics and questions written before but no longer in the bank.
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
console.log("\nDone.");

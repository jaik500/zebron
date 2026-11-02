/**
 * Seed the CompTIA Security+ exam preparation track:
 *   - the Security+ Readiness course and its quiz (scripts/securityplus-program/)
 *   - certifications/comptia-security-plus: kind "exam-prep", the nine courses
 *     in order (the eight Cybersecurity Program courses first), the official
 *     domains and the objective map (scripts/securityplus-program/track.mjs)
 *
 * Load the Cybersecurity Program first (scripts/seed-cybersecurity-program.mjs).
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-securityplus-prep.mjs --check      # validate content and print objective coverage (no Firebase)
 *   node scripts/seed-securityplus-prep.mjs              # dry run
 *   node scripts/seed-securityplus-prep.mjs --apply      # write what does not exist yet
 *   node scripts/seed-securityplus-prep.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";
import { CERTIFICATION, DOMAINS, OBJECTIVES } from "./securityplus-program/track.mjs";

const here = dirname(fileURLToPath(import.meta.url));

// ---------- Objective coverage report ----------
const courseFiles = [
  ...(await readdir(join(here, "cybersecurity-program"))).filter((name) => /^\d\d-.+\.mjs$/.test(name)).map((name) => join(here, "cybersecurity-program", name)),
  ...(await readdir(join(here, "securityplus-program"))).filter((name) => /^\d\d-.+\.mjs$/.test(name)).map((name) => join(here, "securityplus-program", name)),
];
const coursesById = new Map();
for (const file of courseFiles) {
  const course = (await import(pathToFileURL(file).href)).default;
  coursesById.set(course.id, course);
}

const problems = [];
const weightTotal = DOMAINS.reduce((total, domain) => total + domain.weight, 0);
if (weightTotal !== 100) problems.push(`domain weights add up to ${weightTotal}, not 100`);

for (const course of CERTIFICATION.courses) {
  if (!coursesById.has(course.courseId)) problems.push(`course ${course.courseId} not found`);
}

console.log("Security+ objective coverage (lessons / questions):");
for (const domain of DOMAINS) {
  console.log(`\nDomain ${domain.code}: ${domain.name} (${domain.weight}%)`);
  for (const objective of OBJECTIVES.filter((item) => item.domain === domain.code)) {
    let questions = 0;
    for (const { course, topic } of objective.refs) {
      const found = coursesById.get(course);
      if (!found || !found.topics.some((item) => item.key === topic)) {
        problems.push(`${objective.code}: ${course} has no topic ${topic}`);
        continue;
      }
      questions += found.questions.filter((question) => question.topic === topic).length;
    }
    const flag = objective.refs.length === 0 ? "  <-- NOT COVERED" : questions < 5 ? "  <-- fewer than 5 questions" : "";
    console.log(`  ${objective.code.padEnd(5)} ${String(objective.refs.length).padStart(2)} / ${String(questions).padStart(3)}  ${objective.text}${flag}`);
    if (!objective.refs.length) problems.push(`${objective.code} has no lessons`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nEvery objective is mapped.\n");

// Store each mapped lesson's title with the objective so the certification page can list them.
const objectives = OBJECTIVES.map((objective) => ({
  ...objective,
  refs: objective.refs.map(({ course, topic }) => ({
    course,
    topic,
    title: coursesById.get(course).topics.find((item) => item.key === topic).name ?? topic,
  })),
}));

await seedProgram({
  programName: "Security+ Exam Prep",
  courseTopic: "Cybersecurity",
  folder: join(here, "securityplus-program"),
  idPrefix: "securityplus-",
  certification: { ...CERTIFICATION, objectives },
});

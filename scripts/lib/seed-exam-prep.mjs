/**
 * Shared engine for industry exam preparation tracks (Security+, CSA, ...):
 * validates the objective map against the course content, prints the
 * coverage of each objective, then seeds the track's own course(s) and the
 * "exam-prep" certification with seedProgram.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { seedProgram } from "./seed-program.mjs";

/**
 * @param {object} track
 * @param {string} track.label             e.g. "Security+"
 * @param {string[]} track.courseFolders   folders holding every course in the path
 * @param {string} track.folder            the track's own course folder (seeded)
 * @param {string} track.programName
 * @param {string} track.courseTopic
 * @param {string} track.idPrefix
 * @param {object} track.certification     CERTIFICATION from the track file
 */
export async function seedExamPrep(track) {
  const certification = await prepareExamPrep(track);
  await seedProgram({
    programName: track.programName,
    courseTopic: track.courseTopic,
    folder: track.folder,
    idPrefix: track.idPrefix,
    certification: [...(track.extraCertifications ?? []), certification],
  });
}

/**
 * Validate an exam preparation track against the course content, print the
 * objective coverage, and return the certification with each mapped lesson's
 * title added (exits on problems).
 */
export async function prepareExamPrep(track) {
  const { certification } = track;
  const coursesById = new Map();
  for (const folder of track.courseFolders) {
    for (const name of (await readdir(folder)).filter((item) => /^\d\d-.+\.mjs$/.test(item))) {
      const course = (await import(pathToFileURL(join(folder, name)).href)).default;
      coursesById.set(course.id, course);
    }
  }

  const types = certification.exam?.questionTypes ?? null;
  const usable = (question) => !types || types.includes(question.type);

  const problems = [];
  const weightTotal = certification.domains.reduce((total, domain) => total + domain.weight, 0);
  if (weightTotal !== 100) problems.push(`domain weights add up to ${weightTotal}, not 100`);

  for (const course of certification.courses) {
    if (!coursesById.has(course.courseId)) problems.push(`course ${course.courseId} not found`);
  }

  console.log(`${track.label} objective coverage (lessons / questions${types ? ` of type ${types.join(", ")}` : ""}):`);
  for (const domain of certification.domains) {
    const wanted = Math.round((domain.weight / 100) * (certification.exam?.questionCount ?? 0));
    const pool = new Set();
    console.log(`\nDomain ${domain.code}: ${domain.name} (${domain.weight}%, ${wanted} questions in the practice exam)`);
    for (const objective of certification.objectives.filter((item) => item.domain === domain.code)) {
      let questions = 0;
      for (const { course, topic } of objective.refs) {
        const found = coursesById.get(course);
        if (!found || !found.topics.some((item) => item.key === topic)) {
          problems.push(`${objective.code}: ${course} has no topic ${topic}`);
          continue;
        }
        const matching = found.questions.filter((question) => question.topic === topic && usable(question));
        questions += matching.length;
        matching.forEach((question) => pool.add(`${course}/${question.question}`));
      }
      const flag = objective.refs.length === 0 ? "  <-- NOT COVERED" : questions < 3 ? "  <-- fewer than 3 questions" : "";
      console.log(`  ${objective.code.padEnd(5)} ${String(objective.refs.length).padStart(2)} / ${String(questions).padStart(3)}  ${objective.text}${flag}`);
      if (!objective.refs.length) problems.push(`${objective.code} has no lessons`);
    }
    console.log(`  pool: ${pool.size} questions`);
    if (pool.size < wanted) problems.push(`domain ${domain.code} needs ${wanted} questions but its pool has ${pool.size}`);
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log("\nEvery objective is mapped.\n");

  // Store each mapped lesson's title with the objective so the certification page can list them.
  const objectives = certification.objectives.map((objective) => ({
    ...objective,
    refs: objective.refs.map(({ course, topic }) => ({
      course,
      topic,
      title: coursesById.get(course).topics.find((item) => item.key === topic).name ?? topic,
    })),
  }));

  return { ...certification, objectives };
}

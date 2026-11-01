/**
 * Seed the Zebron Cybersecurity Program: 8 learning courses and their
 * Test Center quizzes, as Zebron (platform) content everyone can use.
 * Content: scripts/cybersecurity-program/. Engine: scripts/lib/seed-program.mjs.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-cybersecurity-program.mjs --check      # validate the content only (no Firebase)
 *   node scripts/seed-cybersecurity-program.mjs              # dry run: what would be written
 *   node scripts/seed-cybersecurity-program.mjs --apply      # write courses and quizzes that do not exist yet
 *   node scripts/seed-cybersecurity-program.mjs --apply --overwrite
 *        # also replace existing ones from this program (learner progress and results are kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

await seedProgram({
  programName: "Cybersecurity Program",
  courseTopic: "Cybersecurity",
  folder: join(dirname(fileURLToPath(import.meta.url)), "cybersecurity-program"),
  idPrefix: "cybersecurity-",
  certification: {
    id: "cybersecurity-associate",
    title: "Cybersecurity Program Certification",
    credentialName: "Zebron Certified Cybersecurity Associate",
    summary: "Complete the 8 Cybersecurity Program courses in order, then pass the certification exam.",
    description:
      "Shows you can explain and apply the core of cybersecurity: networks, systems, identity and cryptography, threats, security operations, incident response, cloud and governance.\n\nComplete the eight courses in order (each one's final exam must be passed before the next opens), then pass a 40-question certification exam drawn from all eight. The credential is valid for three years.",
    preparesFor: ["CompTIA Security+", "ISC2 Certified in Cybersecurity (CC)"],
    level: "intermediate",
    cover: "navy",
    exam: { questionsPerCourse: 5, passMark: 75, timeLimitMinutes: 60, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 3,
  },
});

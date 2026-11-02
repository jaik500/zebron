/**
 * Seed the Zebron ServiceNow Application Developer Program: 6 learning
 * courses (one per CAD exam blueprint domain) and their Test Center
 * quizzes, plus two certifications over the same courses:
 *   - servicenow-developer: the Zebron Certified ServiceNow Application Developer credential
 *   - servicenow-cad: ServiceNow CAD exam preparation (External Professional Certifications)
 * Content: scripts/servicenow-developer-program/ (CAD map in track.mjs).
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-servicenow-developer-program.mjs --check      # validate content and CAD coverage (no Firebase)
 *   node scripts/seed-servicenow-developer-program.mjs              # dry run
 *   node scripts/seed-servicenow-developer-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-servicenow-developer-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { prepareExamPrep } from "./lib/seed-exam-prep.mjs";
import { seedProgram } from "./lib/seed-program.mjs";
import { CERTIFICATION as CAD } from "./servicenow-developer-program/track.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "servicenow-developer-program");

const cad = await prepareExamPrep({ label: "ServiceNow CAD", courseFolders: [folder], certification: CAD });

await seedProgram({
  programName: "ServiceNow Application Developer Program",
  courseTopic: "ServiceNow",
  folder,
  idPrefix: "servicenow-dev-",
  certification: [
    {
      id: "servicenow-developer",
      title: "ServiceNow Application Developer Program Certification",
      credentialName: "Zebron Certified ServiceNow Application Developer",
      summary: "Complete the 6 ServiceNow Application Developer Program courses in order, then pass the certification exam.",
      description:
        "Shows you can design, build, secure, automate, integrate and manage scoped applications on ServiceNow.\n\nComplete the six courses in order (each one's final exam must be passed before the next opens), then pass a 42-question certification exam drawn from all six. The credential is valid for three years.",
      preparesFor: ["ServiceNow Certified Application Developer (CAD)"],
      level: "intermediate",
      cover: "violet",
      exam: { questionsPerCourse: 7, passMark: 75, timeLimitMinutes: 60, maxAttempts: 3, cooldownDays: 7 },
      validityYears: 3,
    },
    cad,
  ],
});

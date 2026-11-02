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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedExamPrep } from "./lib/seed-exam-prep.mjs";
import { CERTIFICATION } from "./securityplus-program/track.mjs";

const here = dirname(fileURLToPath(import.meta.url));

await seedExamPrep({
  label: "Security+",
  courseFolders: [join(here, "cybersecurity-program"), join(here, "securityplus-program")],
  folder: join(here, "securityplus-program"),
  programName: "Security+ Exam Prep",
  courseTopic: "Cybersecurity",
  idPrefix: "securityplus-",
  certification: CERTIFICATION,
});

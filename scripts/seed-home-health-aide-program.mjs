/**
 * Seed the Zebron Home Health Aide Program: 6 courses for people preparing to
 * work as home health aides in the DMV area (District of Columbia, Maryland
 * and Virginia), each with a course quiz, and a program certification.
 *
 *   1  The Home Health Aide Role and DMV Requirements
 *   2  Communication, Culture and Documentation
 *   3  Infection Control, Safety and Emergencies
 *   4  Personal Care, Skin Care and Safe Mobility
 *   5  Vital Signs, Nutrition and Delegated Tasks
 *   6  Dementia, End-of-Life Care, the Home and Self-Care
 *
 * The program is a study aid alongside state-approved training: it does not
 * replace approved training, supervised clinical hours or a state exam, and
 * it does not certify or license anyone. Requirements were checked in
 * November 2026 against 42 CFR 484.80, the DC Board of Nursing HHA
 * curriculum, the Maryland Board of Nursing CNA changes (April 1, 2026) and
 * 12VAC5-381 (Virginia home care organizations).
 *
 * Content: scripts/home-health-aide-program/.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-home-health-aide-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-home-health-aide-program.mjs              # dry run
 *   node scripts/seed-home-health-aide-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-home-health-aide-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "home-health-aide-program");

await seedProgram({
  programName: "Home Health Aide Program",
  courseTopic: "Healthcare",
  folder,
  idPrefix: "hha-",
  quizType: "course",
  examQuestions: 20,
  certification: {
    id: "home-health-aide-prep",
    title: "Home Health Aide Program Certificate",
    credentialName: "Zebron Home Health Aide Program (Study Aid)",
    summary: "Complete the 6 Home Health Aide Program courses in order, then pass the program exam. A study aid for DC, Maryland and Virginia; not a state certification or licence.",
    description:
      "Shows you have studied the knowledge home health aides need in the DMV area: the role and the DC, Maryland and Virginia paths; communication, culturally respectful care and documentation; infection control, safety and emergencies; personal care, skin care and safe mobility; vital signs, nutrition and delegated tasks; and dementia, end-of-life care, home management and self-care.\n\nComplete the six courses in order (each one's final exam must be passed before the next opens), then pass a 30-question program exam drawn from all of them.\n\n**Important:** this Zebron certificate is a study aid and record of learning. It is not a state certification or licence and does not qualify you to work as a home health aide or nursing assistant. To work in the District of Columbia, Maryland or Virginia you must complete a state-approved training program, including supervised clinical hours, and pass the required competency evaluation or exam. Confirm current requirements with the DC Board of Nursing, the Maryland Board of Nursing or the Virginia Department of Health and Board of Nursing.",
    preparesFor: ["DC Home Health Aide exam (Credentia)", "NNAAP Nurse Aide exam (Maryland CNA-I)", "Home health aide competency evaluation (42 CFR 484.80)"],
    level: "beginner",
    cover: "teal",
    exam: { questionsPerCourse: 5, passMark: 75, timeLimitMinutes: 45, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 2,
  },
});

/**
 * Seed the Zebron CNA Program: 6 courses for people preparing to become
 * certified nursing assistants in the DMV area (District of Columbia,
 * Maryland and Virginia), each with a course quiz, and a program certificate.
 *
 *   1  The CNA Role, Resident Rights and DMV Certification
 *   2  Communication, Observation and Documentation
 *   3  Infection Control, Safety and Emergencies
 *   4  Personal Care Skills and Bedmaking
 *   5  Measurements, Elimination and Restorative Care
 *   6  Dementia, Common Conditions, End-of-Life Care and NNAAP Prep
 *
 * The program is a study aid alongside a state-approved nurse aide training
 * program: it does not replace approved training, supervised clinical hours
 * or the NNAAP exam, and it does not certify anyone. Requirements were
 * checked in November 2026 against 42 CFR 483.152, the DC Board of Nursing,
 * the Maryland Board of Nursing CNA changes (April 1, 2026), the Virginia
 * Board of Nursing and Credentia's NNAAP candidate information.
 *
 * Content: scripts/cna-program/.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-cna-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-cna-program.mjs              # dry run
 *   node scripts/seed-cna-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-cna-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "cna-program");

await seedProgram({
  programName: "CNA Program",
  courseTopic: "Healthcare",
  folder,
  idPrefix: "cna-",
  quizType: "course",
  examQuestions: 20,
  certification: {
    id: "cna-prep",
    title: "CNA Program Certificate",
    credentialName: "Zebron CNA Program (Study Aid)",
    summary: "Complete the 6 CNA Program courses in order, then pass the program exam. A study aid for the NNAAP exam in DC, Maryland and Virginia; not a state certification.",
    description:
      "Shows you have studied the knowledge certified nursing assistants need in the DMV area: the CNA role, residents' rights and the DC, Maryland and Virginia certification paths; communication and documentation; infection control, safety and emergencies; personal care skills and bedmaking; measurements, elimination and restorative care; and dementia, common conditions, end-of-life care and NNAAP exam preparation.\n\nComplete the six courses in order (each one's final exam must be passed before the next opens), then pass a 30-question program exam drawn from all of them.\n\n**Important:** this Zebron certificate is a study aid and record of learning. It is not CNA certification and does not place you on any nurse aide registry. To work as a CNA in the District of Columbia, Maryland or Virginia you must complete a Board-approved nurse aide training program, including supervised clinical hours, and pass the NNAAP written (or oral) exam and skills evaluation. Confirm current requirements with the DC Board of Nursing, the Maryland Board of Nursing or the Virginia Board of Nursing.",
    preparesFor: ["NNAAP Nurse Aide exam (Credentia)", "DC Certified Nurse Aide", "Maryland CNA-I", "Virginia Certified Nurse Aide"],
    level: "beginner",
    cover: "navy",
    exam: { questionsPerCourse: 5, passMark: 75, timeLimitMinutes: 45, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 2,
  },
});

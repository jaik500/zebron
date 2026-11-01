/**
 * Seed the Zebron ServiceNow Administrator Program: 8 learning courses and
 * their Test Center quizzes, aligned with the ServiceNow Certified System
 * Administrator (CSA) exam areas, as Zebron (platform) content.
 * Content: scripts/servicenow-program/. Engine: scripts/lib/seed-program.mjs.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-servicenow-program.mjs --check      # validate the content only (no Firebase)
 *   node scripts/seed-servicenow-program.mjs              # dry run: what would be written
 *   node scripts/seed-servicenow-program.mjs --apply      # write courses and quizzes that do not exist yet
 *   node scripts/seed-servicenow-program.mjs --apply --overwrite
 *        # also replace existing ones from this program (learner progress and results are kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

await seedProgram({
  programName: "ServiceNow Administrator Program",
  courseTopic: "ServiceNow",
  folder: join(dirname(fileURLToPath(import.meta.url)), "servicenow-program"),
  idPrefix: "servicenow-admin-",
  certification: {
    id: "servicenow-administrator",
    title: "ServiceNow Administrator Program Certification",
    credentialName: "Zebron Certified ServiceNow Administrator",
    summary: "Complete the 8 ServiceNow Administrator Program courses in order, then pass the certification exam.",
    description:
      "Shows you can administer a ServiceNow instance: navigation and configuration, the data model and CMDB, users and access control, ITSM, the service catalog, automation, data imports and instance management.\n\nComplete the eight courses in order (each one's final exam must be passed before the next opens), then pass a 40-question certification exam drawn from all eight. The credential is valid for three years.",
    preparesFor: ["ServiceNow Certified System Administrator (CSA)"],
    level: "intermediate",
    cover: "teal",
    exam: { questionsPerCourse: 5, passMark: 75, timeLimitMinutes: 60, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 3,
  },
});

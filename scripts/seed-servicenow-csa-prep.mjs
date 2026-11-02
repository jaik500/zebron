/**
 * Seed the ServiceNow CSA exam preparation track:
 *   - the CSA Readiness course and its quiz (scripts/servicenow-csa-program/)
 *   - certifications/servicenow-csa: kind "exam-prep", the nine courses in
 *     order (the eight ServiceNow Administrator Program courses first), the
 *     blueprint domains and the objective map (scripts/servicenow-csa-program/track.mjs)
 *
 * Load the ServiceNow Administrator Program first (scripts/seed-servicenow-program.mjs).
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-servicenow-csa-prep.mjs --check      # validate content and print blueprint coverage (no Firebase)
 *   node scripts/seed-servicenow-csa-prep.mjs              # dry run
 *   node scripts/seed-servicenow-csa-prep.mjs --apply      # write what does not exist yet
 *   node scripts/seed-servicenow-csa-prep.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedExamPrep } from "./lib/seed-exam-prep.mjs";
import { CERTIFICATION } from "./servicenow-csa-program/track.mjs";

const here = dirname(fileURLToPath(import.meta.url));

await seedExamPrep({
  label: "ServiceNow CSA",
  courseFolders: [join(here, "servicenow-program"), join(here, "servicenow-csa-program")],
  folder: join(here, "servicenow-csa-program"),
  programName: "ServiceNow CSA Exam Prep",
  courseTopic: "ServiceNow",
  idPrefix: "servicenow-csa-",
  certification: CERTIFICATION,
});

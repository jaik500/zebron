/**
 * Seed the AWS Certification Prep program:
 *   - the AWS Cloud Practitioner (CLF-C02) and AWS AI Practitioner (AIF-C01)
 *     exam prep courses, with their Test Center quizzes (scripts/aws-program/)
 *   - certifications/aws-cloud-practitioner and certifications/aws-ai-practitioner:
 *     kind "exam-prep", each with its course, the official domains and the
 *     task-statement map (scripts/aws-program/track.mjs)
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-aws-certification-prep.mjs --check      # validate content and print task-statement coverage (no Firebase)
 *   node scripts/seed-aws-certification-prep.mjs              # dry run
 *   node scripts/seed-aws-certification-prep.mjs --apply      # write what does not exist yet
 *   node scripts/seed-aws-certification-prep.mjs --apply --overwrite   # replace (learner progress is kept)
 *
 * Zebron is not affiliated with or endorsed by Amazon Web Services.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { prepareExamPrep } from "./lib/seed-exam-prep.mjs";
import { seedProgram } from "./lib/seed-program.mjs";
import { AIF_CERTIFICATION, CLF_CERTIFICATION } from "./aws-program/track.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const folder = join(here, "aws-program");

const certifications = [];
for (const [label, certification] of [
  ["AWS Cloud Practitioner (CLF-C02)", CLF_CERTIFICATION],
  ["AWS AI Practitioner (AIF-C01)", AIF_CERTIFICATION],
]) {
  certifications.push(await prepareExamPrep({ label, courseFolders: [folder], certification }));
}

await seedProgram({
  programName: "AWS Certification Prep",
  courseTopic: "Cloud Computing",
  folder,
  idPrefix: "aws-",
  certification: certifications,
});

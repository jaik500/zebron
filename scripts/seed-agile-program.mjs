/**
 * Seed the Zebron Project & Agile Delivery Program, with each course's Test
 * Center quiz:
 *   1. Project Management Fundamentals (aligned with the PMBOK Guide, 8th ed.)
 *   2. SAFe Agile: Scaling Agile with the Scaled Agile Framework
 * Add more courses (03-….mjs, …) to the folder as the program grows.
 * Content: scripts/agile-program/.
 *
 * Independent Zebron content, not affiliated with or endorsed by PMI or
 * Scaled Agile, Inc. PMI, PMBOK, CAPM and PMP are registered marks of the
 * Project Management Institute, Inc. SAFe® and Scaled Agile Framework® are
 * registered trademarks of Scaled Agile, Inc.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-agile-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-agile-program.mjs              # dry run
 *   node scripts/seed-agile-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-agile-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "agile-program");

await seedProgram({
  programName: "Project & Agile Delivery Program",
  courseTopic: "Project Management & Agile",
  folder,
  idPrefix: "",
});

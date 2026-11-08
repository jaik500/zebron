/**
 * Seed the Zebron Web Foundations Program: 7 courses from basic to advanced
 * (HTML; CSS foundations; modern CSS; JavaScript foundations; JavaScript in
 * the browser and async code; TypeScript; advanced JavaScript, tooling,
 * testing and web security), their Test Center quizzes, and a program
 * certification. The Angular 21 Developer Program follows on from it.
 * Content: scripts/web-foundations-program/.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-web-foundations-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-web-foundations-program.mjs              # dry run
 *   node scripts/seed-web-foundations-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-web-foundations-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "web-foundations-program");

await seedProgram({
  programName: "Web Foundations Program",
  courseTopic: "Web Development",
  folder,
  idPrefix: "web-",
  certification: {
    id: "web-foundations",
    title: "Web Foundations Program Certification",
    credentialName: "Zebron Certified Web Developer (Foundations)",
    summary: "Complete the 7 Web Foundations Program courses in order, then pass the certification exam.",
    description:
      "Shows you can build accessible, responsive web pages with HTML and modern CSS, write JavaScript and TypeScript for the browser, work with APIs and async code, and use professional tooling, testing and security practices.\n\nComplete the seven courses in order (each one's final exam must be passed before the next opens), then pass a 35-question certification exam drawn from all seven. The credential is valid for three years.",
    preparesFor: [],
    level: "beginner",
    cover: "sunrise",
    exam: { questionsPerCourse: 5, passMark: 75, timeLimitMinutes: 60, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 3,
  },
});

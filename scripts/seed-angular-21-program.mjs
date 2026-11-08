/**
 * Seed the Zebron Angular 21 Developer Program: 6 courses (foundations,
 * signals, services and routing, forms, UI/performance/SSR, testing and
 * deployment), their Test Center quizzes, and a program certification.
 * Content: scripts/angular-21-program/ (generated from the course sources;
 * edit the .mjs files directly for small fixes).
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-angular-21-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-angular-21-program.mjs              # dry run
 *   node scripts/seed-angular-21-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-angular-21-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "angular-21-program");

await seedProgram({
  programName: "Angular 21 Developer Program",
  courseTopic: "Web Development",
  folder,
  idPrefix: "angular21-",
  certification: {
    id: "angular21-developer",
    title: "Angular 21 Developer Program Certification",
    credentialName: "Zebron Certified Angular Developer",
    summary: "Complete the 6 Angular 21 Developer Program courses in order, then pass the certification exam.",
    description:
      "Shows you can build, test and deploy modern Angular 21 applications: components and templates, signals and zoneless change detection, services, routing and HTTP, forms, UI, performance and server rendering, and testing with Firebase deployment.\n\nComplete the six courses in order (each one's final exam must be passed before the next opens), then pass a 36-question certification exam drawn from all six. The credential is valid for three years.",
    preparesFor: [],
    level: "intermediate",
    cover: "navy",
    exam: { questionsPerCourse: 6, passMark: 75, timeLimitMinutes: 60, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 3,
  },
});

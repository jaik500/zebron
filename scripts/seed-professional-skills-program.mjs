/**
 * Seed the Zebron Professional Skills Program: 17 short courses on the soft
 * skills employers look for, each with a Skill quiz shown on the Test
 * Center's Skills page, and a program certification.
 *
 *   Mindsets            1-4   Growth Mindset, Persistence, Personal Responsibility, Future Orientation
 *   Behavioral skills   5-8   Teamwork, Communication, Proactiveness, Orientation to Detail
 *   Workplace & career  9-15  Career Development (up, across and beyond), Being a New Teammate,
 *                             Bouncing Back from Early Failure, Working with Challenging Coworkers,
 *                             Peer Coaching, Managing Time and Priorities, Stress Management
 *   Leadership & mgmt   16-17 Leadership, Management
 *
 * Content: scripts/professional-skills-program/.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/seed-professional-skills-program.mjs --check      # validate content (no Firebase)
 *   node scripts/seed-professional-skills-program.mjs              # dry run
 *   node scripts/seed-professional-skills-program.mjs --apply      # write what does not exist yet
 *   node scripts/seed-professional-skills-program.mjs --apply --overwrite   # replace (learner progress is kept)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { seedProgram } from "./lib/seed-program.mjs";

const folder = join(dirname(fileURLToPath(import.meta.url)), "professional-skills-program");

await seedProgram({
  programName: "Professional Skills Program",
  courseTopic: "Professional Skills",
  folder,
  idPrefix: "skills-",
  quizType: "skill",
  examQuestions: 12,
  certification: {
    id: "professional-skills",
    title: "Professional Skills Program Certification",
    credentialName: "Zebron Certified Professional Skills",
    summary: "Complete the 17 Professional Skills Program courses in order, then pass the certification exam.",
    description:
      "Shows you have the mindsets and behaviours employers look for: a growth mindset, persistence, responsibility and future orientation; teamwork, clear communication, proactiveness and attention to detail; career planning, starting well in a new team, bouncing back from failure, handling difficult working relationships, peer coaching, managing time and stress; and the foundations of leadership and management.\n\nComplete the seventeen short courses in order (each one's final exam must be passed before the next opens), then pass a 51-question certification exam drawn from all of them. The credential is valid for three years.",
    preparesFor: [],
    level: "beginner",
    cover: "teal",
    exam: { questionsPerCourse: 3, passMark: 75, timeLimitMinutes: 75, maxAttempts: 3, cooldownDays: 7 },
    validityYears: 3,
  },
});

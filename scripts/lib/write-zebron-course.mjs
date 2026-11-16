/**
 * Shared writer for Zebron course seed scripts.
 *
 * A seed script describes one course (COURSE, MODULES) and calls
 * runCourseSeed(). This file checks the content and writes it to
 * Firestore in the shape the app reads:
 *
 *   courses/{id}                  course document (card, outline, totals)
 *   courses/{id}/lessons/{lesson} title, moduleId, order, minutes, blocks
 *
 * Usage (from the repository root):
 *   node scripts/<folder>/<seed>.mjs                      dry run: check only
 *   node scripts/<folder>/<seed>.mjs --apply              create the course
 *   node scripts/<folder>/<seed>.mjs --apply --overwrite  update an existing course
 *
 * Updating keeps what was set in the app: the course's status (draft or
 * published), publishedAt, final exam, review and createdAt. Lessons that
 * are no longer in the script are deleted.
 */

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const COVERS = ['teal', 'navy', 'sunrise', 'violet', 'sky', 'slate'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'all'];
const BLOCK_TYPES = ['text', 'tip', 'video', 'audio', 'document', 'image', 'check', 'code'];

export async function runCourseSeed({ course, modules, script }) {
  const apply = process.argv.includes('--apply');
  const overwrite = process.argv.includes('--overwrite');
  const projectId = process.env.GCLOUD_PROJECT || 'zebron-2b49f';

  const lessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
  );
  lessons.forEach((lesson, index) => {
    lesson.order = index + 1;
  });

  validate(course, modules, lessons);

  const estimatedMinutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const checks = lessons.reduce(
    (total, lesson) => total + lesson.blocks.filter((block) => block.type === 'check').length,
    0,
  );

  console.log('\n========================================');
  console.log(`${course.title}`);
  console.log('========================================');
  console.log(`Project: ${projectId}`);
  console.log(`Course ID: ${course.id}`);
  console.log(`Program: ${course.program} (step ${course.programOrder})`);
  console.log(`Modules: ${modules.length}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Quick checks: ${checks}`);
  console.log(`Estimated time: ${estimatedMinutes} minutes`);

  if (!apply) {
    console.log('\nDRY RUN: the content is valid; nothing was written.');
    console.log(`\nCreate it:  node ${script} --apply`);
    console.log(`Update it:  node ${script} --apply --overwrite`);
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore();
  const courseRef = db.collection('courses').doc(course.id);
  const existing = await courseRef.get();

  if (existing.exists && !overwrite) {
    throw new Error(`Course "${course.id}" already exists. Add --overwrite to update it.`);
  }

  const kept = existing.exists ? existing.data() : {};
  const outline = modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      minutes: lesson.minutes,
      hasCheck: lesson.blocks.some((block) => block.type === 'check'),
    })),
  }));

  // Only the fields the app and firestore.rules know (courseFieldNames).
  const courseData = {
    id: course.id,
    title: course.title,
    summary: course.summary,
    description: course.description,
    topic: course.topic,
    program: course.program,
    programOrder: course.programOrder,
    level: course.level,
    cover: course.cover,
    outcomes: course.outcomes,
    skills: course.skills,
    modules: outline,
    lessonCount: lessons.length,
    estimatedMinutes,
    organizationId: null,
    providerName: 'Zebron',
    authorName: kept.authorName || 'Zebron',
    status: kept.status || 'draft',
    publishedAt: kept.publishedAt ?? null,
    finalExam: kept.finalExam ?? null,
    review: kept.review ?? null,
    createdAt: kept.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (kept.authorId) {
    courseData.authorId = kept.authorId;
  }

  const existingLessons = await courseRef.collection('lessons').get();
  const wanted = new Set(lessons.map((lesson) => lesson.id));
  const stale = existingLessons.docs.filter((doc) => !wanted.has(doc.id));

  const writes = [
    (batch) => batch.set(courseRef, courseData),
    ...lessons.map((lesson) => (batch) =>
      batch.set(courseRef.collection('lessons').doc(lesson.id), {
        title: lesson.title,
        moduleId: lesson.moduleId,
        order: lesson.order,
        minutes: lesson.minutes,
        blocks: lesson.blocks,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ),
    ...stale.map((doc) => (batch) => batch.delete(doc.ref)),
  ];

  for (let index = 0; index < writes.length; index += 400) {
    const batch = db.batch();
    writes.slice(index, index + 400).forEach((write) => write(batch));
    await batch.commit();
  }

  console.log('\nWRITTEN');
  console.log(`Course: courses/${course.id} (status kept: ${courseData.status})`);
  console.log(`Lessons written: ${lessons.length}`);
  console.log(`Old lessons removed: ${stale.length}`);
}

function validate(course, modules, lessons) {
  const errors = [];
  const need = (condition, message) => {
    if (!condition) errors.push(message);
  };

  need(/^[A-Za-z0-9_-]{1,128}$/.test(course.id ?? ''), 'course.id is missing or invalid');
  need(course.title && course.title.length <= 200, 'course.title is missing or longer than 200 characters');
  need(course.summary && course.summary.length <= 400, 'course.summary is missing or longer than 400 characters');
  need((course.description ?? '').length <= 20000, 'course.description is longer than 20,000 characters');
  need(COVERS.includes(course.cover), `course.cover must be one of ${COVERS.join(', ')}`);
  need(LEVELS.includes(course.level), `course.level must be one of ${LEVELS.join(', ')}`);
  need((course.program ?? '').length <= 80, 'course.program is longer than 80 characters');
  need(Array.isArray(course.outcomes) && course.outcomes.length > 0 && course.outcomes.length <= 30, 'course.outcomes needs 1 to 30 items');
  need(Array.isArray(course.skills) && course.skills.length > 0 && course.skills.length <= 30, 'course.skills needs 1 to 30 items');
  need(modules.length > 0 && modules.length <= 60, 'a course needs 1 to 60 modules');

  const ids = new Set();
  for (const module of modules) {
    need(module.id && module.title, `a module is missing its id or title`);
    need(module.lessons.length > 0 && module.lessons.length <= 60, `module "${module.title}" needs 1 to 60 lessons`);
  }
  for (const lesson of lessons) {
    need(/^[A-Za-z0-9_-]{1,128}$/.test(lesson.id ?? ''), `lesson id "${lesson.id}" is invalid`);
    need(!ids.has(lesson.id), `lesson id "${lesson.id}" is used twice`);
    ids.add(lesson.id);
    need(Number.isInteger(lesson.minutes) && lesson.minutes > 0, `lesson "${lesson.id}" needs whole minutes`);
    need(lesson.blocks.length > 0 && lesson.blocks.length <= 60, `lesson "${lesson.id}" needs 1 to 60 blocks`);
    need(lesson.blocks.some((block) => block.type === 'text'), `lesson "${lesson.id}" has no text block`);

    for (const block of lesson.blocks) {
      need(BLOCK_TYPES.includes(block.type), `lesson "${lesson.id}" has an unknown block type "${block.type}"`);
      if (block.type === 'text' || block.type === 'tip') {
        need((block.text ?? '').trim().length > 0, `lesson "${lesson.id}" has an empty ${block.type} block`);
        need(((block.text ?? '').match(/```/g) ?? []).length % 2 === 0, `lesson "${lesson.id}" has an unclosed code block`);
      }
      if (block.type === 'code') {
        // Zebron Coding Lab exercise (JavaScript): an id, a title, instructions and starting code.
        need(/^[A-Za-z0-9_-]{1,60}$/.test(block.id ?? ''), `lesson "${lesson.id}" has a coding exercise without a valid id`);
        need(['javascript', 'python'].includes(block.language), `lesson "${lesson.id}" has a coding exercise in an unsupported language`);
        need(block.title && block.instructions && typeof block.starter === 'string', `lesson "${lesson.id}" has an incomplete coding exercise`);
        need((block.tests ?? []).every((test) => test.name && test.code), `lesson "${lesson.id}" has a coding exercise check without a name or code`);
      }
      if (block.type === 'check') {
        const questions = block.questions ?? [block];
        for (const question of questions) {
          need(
            question.question &&
              Array.isArray(question.options) &&
              question.options.length >= 2 &&
              Number.isInteger(question.answer) &&
              question.answer >= 0 &&
              question.answer < question.options.length,
            `lesson "${lesson.id}" has an invalid quick check`,
          );
        }
      }
    }
  }

  if (errors.length) {
    console.error('\nCONTENT CHECK FAILED:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
}

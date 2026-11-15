/**
 * Publish Zebron course:
 * AI Agents & Workflow Automation
 *
 * Dry run:
 * node scripts/ai-agents/publish-ai-agents.mjs
 *
 * Publish:
 * node scripts/ai-agents/publish-ai-agents.mjs --apply
 */

import {
  applicationDefault,
  initializeApp,
} from 'firebase-admin/app';

import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'zebron-2b49f';
const COURSE_ID = 'ai-agents-workflow-automation';

const APPLY = process.argv.includes('--apply');

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

async function publishCourse() {
  const courseRef = db.collection('courses').doc(COURSE_ID);

  // 1. Verify course exists.
  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error(
      `Course ${COURSE_ID} does not exist. Seed it first.`
    );
  }

  const course = courseSnapshot.data();

  // 2. Retrieve lessons.
  const lessonsSnapshot = await courseRef
    .collection('lessons')
    .get();

  const lessons = lessonsSnapshot.docs;

  // 3. Validate course structure.
  if (course.modules?.length !== 11) {
    throw new Error(
      `Expected 11 modules. Found ${course.modules?.length ?? 0}.`
    );
  }

  if (lessons.length !== 33) {
    throw new Error(
      `Expected 33 lessons. Found ${lessons.length}.`
    );
  }

  const invalidLessons = lessons.filter((doc) => {
    const lesson = doc.data();

    if (!lesson.title || !Array.isArray(lesson.blocks)) {
      return true;
    }

    const checks = lesson.blocks.filter(
      (block) => block.type === 'check'
    );

    return checks.length !== 1;
  });

  if (invalidLessons.length > 0) {
    throw new Error(
      `Found ${invalidLessons.length} lessons with invalid content or Quick Checks.`
    );
  }

  // 4. Display publishing summary.
  console.log('\nCOURSE PUBLISHING');
  console.log('------------------------------');
  console.log(`Course: ${course.title}`);
  console.log(`Course ID: ${COURSE_ID}`);
  console.log(`Firebase project: ${PROJECT_ID}`);
  console.log(`Modules: ${course.modules.length}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Current status: ${course.status}`);
  console.log(`Mode: ${APPLY ? 'PUBLISH' : 'DRY RUN'}`);

  if (!APPLY) {
    console.log('\nValidation successful.');
    console.log('No Firestore changes made.');
    console.log('\nTo publish, run:');
    console.log(
      'node scripts/ai-agents/publish-ai-agents.mjs --apply'
    );
    return;
  }

  // 5. Publish course and lessons.
  const batch = db.batch();
  const publishedAt = FieldValue.serverTimestamp();

  batch.update(courseRef, {
    status: 'published',
    publishedAt,
    updatedAt: FieldValue.serverTimestamp(),
  });

  for (const lessonDoc of lessons) {
    batch.update(lessonDoc.ref, {
      status: 'published',
      publishedAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  console.log('\nSUCCESS!');
  console.log('Course published successfully.');
  console.log(`Published lessons: ${lessons.length}`);
  console.log(`Firestore path: courses/${COURSE_ID}`);
}

publishCourse().catch((error) => {
  console.error('\nPublishing failed:', error);
  process.exitCode = 1;
});

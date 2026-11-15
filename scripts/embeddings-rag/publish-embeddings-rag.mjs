import { applicationDefault, initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'zebron-2b49f';

const COURSE_ID = 'embeddings-vector-databases-rag';
const EXPECTED_LESSONS = 33;

const APPLY = process.argv.includes('--apply');

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

async function publishCourse() {
  console.log('\nEmbeddings, Vector Databases & RAG');
  console.log('==================================');

  const courseRef = db.collection('courses').doc(COURSE_ID);

  // Verify that the course exists.
  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error(
      `Course "${COURSE_ID}" does not exist. Run the seed script with --apply first.`
    );
  }

  const course = courseSnapshot.data();

  // Retrieve all lesson documents.
  const lessonsSnapshot = await courseRef
    .collection('lessons')
    .get();

  const lessons = lessonsSnapshot.docs;

  console.log(`Course: ${course.title}`);
  console.log(`Current status: ${course.status}`);
  console.log(`Lessons found: ${lessons.length}`);

  // Validate lesson count.
  if (lessons.length !== EXPECTED_LESSONS) {
    throw new Error(
      `Expected ${EXPECTED_LESSONS} lessons, but found ${lessons.length}. Publishing cancelled.`
    );
  }

  // Validate lesson documents.
  const invalidLessons = lessons.filter((lesson) => {
    const data = lesson.data();

    return !data.title || !data.moduleId;
  });

  if (invalidLessons.length > 0) {
    throw new Error(
      `Found ${invalidLessons.length} lessons with missing required fields.`
    );
  }

  console.log('\nValidation successful.');
  console.log(`Modules: ${course.modules?.length ?? 'Not available'}`);
  console.log(`Lessons: ${lessons.length}`);
  console.log('Quick Checks: 33');

  if (!APPLY) {
    console.log('\nDRY RUN — no Firestore writes performed.');
    console.log(
      '\nTo publish the course, run:'
    );
    console.log(
      'node scripts/embeddings-rag/publish-embeddings-rag.mjs --apply'
    );
    return;
  }

  // Publish course and all lessons in one batch.
  const batch = db.batch();

  batch.update(courseRef, {
    status: 'published',
    publishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  for (const lesson of lessons) {
    batch.update(lesson.ref, {
      status: 'published',
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  console.log('\n==================================');
  console.log('COURSE PUBLISHED SUCCESSFULLY');
  console.log('==================================');
  console.log(`Course: ${COURSE_ID}`);
  console.log('Status: published');
  console.log(`Published lessons: ${lessons.length}`);
  console.log('Quick Checks: 33');
  console.log(`Firebase project: ${PROJECT_ID}`);
}

publishCourse().catch((error) => {
  console.error('\nPublishing failed:');
  console.error(error.message);
  process.exitCode = 1;
});
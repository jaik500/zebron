import {
  applicationDefault,
  initializeApp,
} from 'firebase-admin/app';

import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'zebron-2b49f',
});

const db = getFirestore();

async function publishCourse() {
  const courseRef = db
    .collection('courses')
    .doc('enterprise-ai-architecture');

  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error('Course does not exist.');
  }

  const lessonsSnapshot = await courseRef
    .collection('lessons')
    .get();

  if (lessonsSnapshot.size !== 33) {
    throw new Error(
      `Expected 33 lessons, found ${lessonsSnapshot.size}.`
    );
  }

  const batch = db.batch();

  // Publish course
  batch.update(courseRef, {
    status: 'published',
    publishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Publish all lessons
  lessonsSnapshot.docs.forEach((lessonDoc) => {
    batch.update(lessonDoc.ref, {
      status: 'published',
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  console.log('\nCOURSE PUBLISHED SUCCESSFULLY');
  console.log('================================');
  console.log('Course: Enterprise AI Architecture');
  console.log('Course status: published');
  console.log(`Published lessons: ${lessonsSnapshot.size}`);
}

publishCourse().catch((error) => {
  console.error('PUBLISH FAILED:', error);
  process.exitCode = 1;
});
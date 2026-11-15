import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'zebron-2b49f',
});

const db = getFirestore();

async function verifyCourse() {
  const courseRef = db
    .collection('courses')
    .doc('enterprise-ai-architecture');

  const course = await courseRef.get();

  console.log('\nENTERPRISE AI ARCHITECTURE VERIFICATION');
  console.log('=======================================');
  console.log('Course exists:', course.exists);

  if (!course.exists) {
    console.log('Course document was not found.');
    return;
  }

  const courseData = course.data();

  console.log('Title:', courseData.title);
  console.log('Status:', courseData.status);
  console.log('Expected lessons:', courseData.totalLessons);

  const lessons = await courseRef.collection('lessons').get();

  console.log('Actual lessons:', lessons.size);

  const statusCounts = {};

  lessons.forEach(doc => {
    const status = doc.data().status || 'missing';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('Lesson statuses:', statusCounts);

  if (lessons.size !== 33) {
    console.log('\nWARNING: Expected 33 lessons.');
  } else {
    console.log('\nSUCCESS: All 33 lessons exist.');
  }
}

verifyCourse().catch(error => {
  console.error('VERIFICATION FAILED:', error);
  process.exitCode = 1;
});
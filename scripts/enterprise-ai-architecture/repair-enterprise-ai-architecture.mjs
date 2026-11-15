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

async function repairCourse() {
  const courseRef = db
    .collection('courses')
    .doc('enterprise-ai-architecture');

  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error('Course does not exist.');
  }

  const courseData = courseSnapshot.data();

  if (courseData.status !== 'published') {
    throw new Error('Course is not published.');
  }

  const lessonsSnapshot = await courseRef
    .collection('lessons')
    .get();

  if (lessonsSnapshot.size !== 33) {
    throw new Error(
      `Expected 33 lessons, found ${lessonsSnapshot.size}.`
    );
  }

  const modules = courseData.modules;

  if (!Array.isArray(modules) || modules.length !== 11) {
    throw new Error('Expected 11 existing modules.');
  }

  const lessonsByModule = new Map();

  for (const doc of lessonsSnapshot.docs) {
    const lesson = doc.data();

    if (!lesson.moduleId) {
      throw new Error(`Lesson ${doc.id} has no moduleId.`);
    }

    const moduleLessons = lessonsByModule.get(lesson.moduleId) ?? [];

    moduleLessons.push({
      id: doc.id,
      title: lesson.title,
      order: lesson.order,
      minutes: lesson.minutes,
      hasCheck: Array.isArray(lesson.blocks) &&
        lesson.blocks.some(block => block.type === 'check'),
    });

    lessonsByModule.set(lesson.moduleId, moduleLessons);
  }

  const repairedModules = modules.map(module => {
    const lessons = lessonsByModule.get(module.id) ?? [];

    if (lessons.length !== 3) {
      throw new Error(
        `Module ${module.id} has ${lessons.length} lessons; expected 3.`
      );
    }

    lessons.sort((a, b) => a.order - b.order);

    return {
      id: module.id,
      title: module.title,
      order: module.order,
      lessons,
    };
  });

  const batch = db.batch();

  batch.update(courseRef, {
    modules: repairedModules,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log('\nCOURSE MODULE STRUCTURE REPAIRED');
  console.log('================================');
  console.log('Course:', courseData.title);
  console.log('Modules:', repairedModules.length);
  console.log(
    'Lessons:',
    repairedModules.reduce(
      (total, module) => total + module.lessons.length,
      0
    )
  );

  for (const module of repairedModules) {
    console.log(
      `${module.order}. ${module.title}: ${module.lessons.length} lessons`
    );
  }
}

repairCourse().catch(error => {
  console.error('REPAIR FAILED:', error);
  process.exitCode = 1;
});
/**
 * Course overview videos for the Enterprise AI & Solutions Architecture program.
 *
 * 1. Uploads each video in ./videos to Firebase Storage with a fixed download
 *    token (manifest.json), so its link never changes.
 * 2. Puts a video block at the top of each course's first lesson, unless that
 *    lesson already has it. Nothing else in the course changes.
 *
 * Dry run (shows what would happen, changes nothing):
 *   node scripts/course-videos/upload-course-videos.mjs
 * Do it:
 *   node scripts/course-videos/upload-course-videos.mjs --apply
 * Also number the program's courses 1 to 9 (programOrder):
 *   node scripts/course-videos/upload-course-videos.mjs --apply --renumber
 *
 * Credentials: GOOGLE_APPLICATION_CREDENTIALS pointing to the service account
 * key kept outside the project (as for the course seeds).
 */
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const here = dirname(fileURLToPath(import.meta.url));
const apply = process.argv.includes('--apply');
const renumber = process.argv.includes('--renumber');
const projectId = process.env.GCLOUD_PROJECT || 'zebron-2b49f';
const bucketName = process.env.STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
const videos = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const CAPTION = 'Course overview: what you will learn, the modules and the skills you will build (about 50 seconds, no sound).';

initializeApp({ credential: applicationDefault(), projectId, storageBucket: bucketName });
const db = getFirestore();
const bucket = getStorage().bucket();

console.log(`Project: ${projectId}`);
console.log(`Bucket: ${bucketName}`);
console.log(apply ? 'Mode: APPLY' : 'Mode: DRY RUN (nothing changes)');

for (const video of videos) {
  const file = join(here, 'videos', video.file);
  const size = (statSync(file).size / 1e6).toFixed(1);
  console.log(`\n${video.courseId}`);

  const courseRef = db.collection('courses').doc(video.courseId);
  const course = await courseRef.get();
  if (!course.exists) {
    console.log('  ! Course not found: seed it first. Skipped.');
    continue;
  }

  // First lesson by order (the seeds' first lesson id may differ in older data).
  const first = await courseRef.collection('lessons').orderBy('order').limit(1).get();
  if (first.empty) {
    console.log('  ! The course has no lessons. Skipped.');
    continue;
  }
  const lesson = first.docs[0];
  const blocks = Array.isArray(lesson.get('blocks')) ? lesson.get('blocks') : [];
  const hasVideo = blocks.some((block) => block?.type === 'video' && String(block.url ?? '').includes(video.path.replace('/', '%2F')));

  console.log(`  Upload ${video.file} (${size} MB) -> ${video.path}`);
  console.log(hasVideo ? `  Lesson "${lesson.get('title')}" already has the video.` : `  Add the video to the top of "${lesson.get('title')}".`);
  if (renumber && course.get('programOrder') !== video.programOrder) {
    console.log(`  Program order ${course.get('programOrder')} -> ${video.programOrder}`);
  }

  if (!apply) continue;

  await bucket.upload(file, {
    destination: video.path,
    resumable: false,
    metadata: {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=86400',
      metadata: { firebaseStorageDownloadTokens: video.token },
    },
  });

  if (!hasVideo) {
    await lesson.ref.update({
      blocks: [{ type: 'video', url: video.url, caption: CAPTION }, ...blocks],
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  if (renumber && course.get('programOrder') !== video.programOrder) {
    await courseRef.update({ programOrder: video.programOrder, updatedAt: FieldValue.serverTimestamp() });
  }
  console.log('  Done.');
}

console.log(apply ? '\nFinished.' : '\nDRY RUN finished: add --apply to make these changes.');

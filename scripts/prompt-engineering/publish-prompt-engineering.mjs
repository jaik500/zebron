import { applicationDefault, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const COURSE_ID = "prompt-engineering-structured-outputs";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

async function publishCourse() {
  const courseRef = db.collection("courses").doc(COURSE_ID);

  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error("Course not found. Run the seed script with --apply first.");
  }

  const lessonsSnapshot = await courseRef.collection("lessons").get();

  if (lessonsSnapshot.size !== 33) {
    throw new Error(
      `Expected 33 lessons, found ${lessonsSnapshot.size}. Publishing cancelled.`
    );
  }

  const batch = db.batch();

  batch.update(courseRef, {
    status: "published",
    updatedAt: FieldValue.serverTimestamp(),
  });

  for (const lesson of lessonsSnapshot.docs) {
    batch.update(lesson.ref, {
      status: "published",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  console.log("\nCOURSE SUCCESSFULLY PUBLISHED");
  console.log(`Course: ${COURSE_ID}`);
  console.log(`Lessons published: ${lessonsSnapshot.size}`);
  console.log("Course status: published");
}

publishCourse().catch((error) => {
  console.error("Publishing failed:", error);
  process.exit(1);
});
import { initializeApp, applicationDefault } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const COURSE_ID = "mathematiques-fondamentales";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

async function publishCourse() {
  const courseRef = db.collection("courses").doc(COURSE_ID);

  // Verify that the course exists.
  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error(`Course ${COURSE_ID} does not exist.`);
  }

  // Retrieve all lessons belonging to the course.
  const lessonsSnapshot = await courseRef
    .collection("lessons")
    .get();

  if (lessonsSnapshot.size !== 33) {
    throw new Error(
      `Expected 33 lessons, found ${lessonsSnapshot.size}. Publishing cancelled.`
    );
  }

  const batch = db.batch();

  // Publish the course.
  batch.update(courseRef, {
    status: "published",
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Publish all lessons.
  for (const lessonDoc of lessonsSnapshot.docs) {
    batch.update(lessonDoc.ref, {
      status: "published",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  console.log("\nCourse successfully published.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log("Course status: published");
  console.log(`Lessons published: ${lessonsSnapshot.size}`);
}

publishCourse()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Publishing failed:", error);
    process.exit(1);
  });
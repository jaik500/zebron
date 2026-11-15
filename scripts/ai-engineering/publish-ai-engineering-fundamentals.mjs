import { applicationDefault, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const COURSE_ID = "ai-engineering-fundamentals-llms";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

async function publishCourse() {
  console.log(`Publishing course: ${COURSE_ID}`);

  const courseRef = db.collection("courses").doc(COURSE_ID);
  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error("Course does not exist. Run the seed script with --apply first.");
  }

  const lessonsSnapshot = await courseRef.collection("lessons").get();

  if (lessonsSnapshot.size !== 33) {
    throw new Error(
      `Expected 33 lessons, but found ${lessonsSnapshot.size}. Publishing cancelled.`
    );
  }

  const batch = db.batch();
  const timestamp = FieldValue.serverTimestamp();

  batch.update(courseRef, {
    status: "published",
    updatedAt: timestamp,
  });

  lessonsSnapshot.docs.forEach((lesson) => {
    batch.update(lesson.ref, {
      status: "published",
      updatedAt: timestamp,
    });
  });

  await batch.commit();

  console.log("\nCourse successfully published!");
  console.log(`Course: ${COURSE_ID}`);
  console.log(`Lessons published: ${lessonsSnapshot.size}`);
  console.log("Status: published");
}

publishCourse().catch((error) => {
  console.error("Publishing failed:", error);
  process.exit(1);
});
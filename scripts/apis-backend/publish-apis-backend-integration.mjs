
import {
  applicationDefault,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.GCLOUD_PROJECT || "zebron-2b49f";

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const COURSE_ID = "apis-json-backend-integration";
const EXPECTED_LESSONS = 30;

async function publishCourse() {
  const courseRef = db.collection("courses").doc(COURSE_ID);

  const courseSnapshot = await courseRef.get();

  if (!courseSnapshot.exists) {
    throw new Error(
      `Course ${COURSE_ID} does not exist. Run the seed script first.`
    );
  }

  const lessonsSnapshot = await courseRef
    .collection("lessons")
    .get();

  if (lessonsSnapshot.size !== EXPECTED_LESSONS) {
    throw new Error(
      `Expected ${EXPECTED_LESSONS} lessons, found ${lessonsSnapshot.size}. Publishing cancelled.`
    );
  }

  const batch = db.batch();

  batch.update(courseRef, {
    status: "published",
    updatedAt: FieldValue.serverTimestamp(),
  });

  lessonsSnapshot.docs.forEach((lessonDoc) => {
    batch.update(lessonDoc.ref, {
      status: "published",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  console.log("\nCourse successfully published.");
  console.log(`Course ID: ${COURSE_ID}`);
  console.log("Course status: published");
  console.log(`Lessons published: ${lessonsSnapshot.size}`);
}

publishCourse()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nPublishing failed:", error);
    process.exit(1);
  });

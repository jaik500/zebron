import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
  projectId: "zebron-2b49f",
});

const db = getFirestore();

async function publishCourse() {
  const courseRef = db
    .collection("courses")
    .doc("python-for-ai-engineering");

  const course = await courseRef.get();

  if (!course.exists) {
    throw new Error("Python for AI Engineering course not found.");
  }

  if (course.get("status") === "published") {
    console.log("Course is already published.");
    return;
  }

  await courseRef.update({
    status: "published",
    publishedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("Python for AI Engineering is now PUBLISHED.");
}

publishCourse().catch((error) => {
  console.error("Publishing failed:", error);
  process.exitCode = 1;
});
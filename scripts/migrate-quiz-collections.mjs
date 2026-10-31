/**
 * One-off migration: Test Center "course" names -> "quiz" names.
 *
 *   testCourses   -> quizzes
 *   testTopics    -> quizTopics
 *   testQuestions -> quizQuestions
 *   testAttempts  -> quizAttempts
 *   testResults   -> quizResults
 *
 * Fields renamed on every copied document:
 *   courseId -> quizId, courseName -> quizName, courseCount -> quizCount
 *
 * Also updated in place:
 *   testPrograms/*                               courseCount -> quizCount
 *   organizations/{id}/applications/test-center  onboarding.firstCourseId -> firstQuizId,
 *                                                step "first_course" -> "first_quiz"
 *   organizationOnboarding/*                     same as above (legacy setup state)
 *
 * Document IDs are kept, so every reference between documents stays valid.
 * Old collections are NOT deleted unless you pass --delete-old.
 *
 * Usage (from the project root):
 *   gcloud auth application-default login        (once)
 *   node scripts/migrate-quiz-collections.mjs                 # dry run: counts only
 *   node scripts/migrate-quiz-collections.mjs --apply         # copy + rename
 *   node scripts/migrate-quiz-collections.mjs --apply --overwrite
 *        # also re-copy documents that already exist in the new collections
 *   node scripts/migrate-quiz-collections.mjs --delete-old    # later, after checking the app
 *
 * Safe to re-run: by default documents that already exist in the new
 * collection are skipped, so edits made through the new app are never
 * overwritten with old data.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");
const DELETE_OLD = args.has("--delete-old");

const COLLECTIONS = [
  ["testCourses", "quizzes"],
  ["testTopics", "quizTopics"],
  ["testQuestions", "quizQuestions"],
  ["testAttempts", "quizAttempts"],
  ["testResults", "quizResults"],
];

const FIELD_RENAMES = [
  ["courseId", "quizId"],
  ["courseName", "quizName"],
  ["courseCount", "quizCount"],
];

const PAGE_SIZE = 400;

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

function renameFields(data) {
  const next = { ...data };
  let changed = false;

  for (const [from, to] of FIELD_RENAMES) {
    if (from in next) {
      if (!(to in next)) {
        next[to] = next[from];
      }
      delete next[from];
      changed = true;
    }
  }

  return { next, changed };
}

const renameStep = (step) => (step === "first_course" ? "first_quiz" : step);

/** Rename setup fields on an onboarding state object. Returns null if nothing changed. */
function migrateSetupState(state) {
  if (!state || typeof state !== "object") {
    return null;
  }

  const next = { ...state };
  let changed = false;

  if ("firstCourseId" in next) {
    if (!("firstQuizId" in next)) {
      next.firstQuizId = next.firstCourseId;
    }
    delete next.firstCourseId;
    changed = true;
  }

  for (const key of ["steps", "completedSteps"]) {
    if (Array.isArray(next[key]) && next[key].includes("first_course")) {
      next[key] = next[key].map(renameStep);
      changed = true;
    }
  }

  if (next.currentStep === "first_course") {
    next.currentStep = "first_quiz";
    changed = true;
  }

  return changed ? next : null;
}

async function* pages(collectionRef) {
  let last = null;

  for (;;) {
    let query = collectionRef.orderBy("__name__").limit(PAGE_SIZE);
    if (last) {
      query = query.startAfter(last);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      return;
    }

    yield snapshot.docs;
    last = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.size < PAGE_SIZE) {
      return;
    }
  }
}

async function copyCollection(from, to) {
  const target = db.collection(to);
  const stats = { source: 0, copied: 0, skipped: 0, renamed: 0 };
  const writer = APPLY ? db.bulkWriter() : null;

  for await (const docs of pages(db.collection(from))) {
    const existing = OVERWRITE || !APPLY
      ? new Set()
      : new Set(
          (await db.getAll(...docs.map((doc) => target.doc(doc.id))))
            .filter((snapshot) => snapshot.exists)
            .map((snapshot) => snapshot.id),
        );

    for (const doc of docs) {
      stats.source++;
      const { next, changed } = renameFields(doc.data());
      if (changed) {
        stats.renamed++;
      }

      if (existing.has(doc.id)) {
        stats.skipped++;
        continue;
      }

      stats.copied++;
      writer?.set(target.doc(doc.id), next);
    }
  }

  await writer?.close();
  return stats;
}

async function migratePrograms() {
  let updated = 0;
  const writer = APPLY ? db.bulkWriter() : null;

  for await (const docs of pages(db.collection("testPrograms"))) {
    for (const doc of docs) {
      const data = doc.data();
      if (!("courseCount" in data)) {
        continue;
      }

      updated++;
      writer?.update(doc.ref, {
        quizCount: data.quizCount ?? data.courseCount,
        courseCount: FieldValue.delete(),
      });
    }
  }

  await writer?.close();
  return updated;
}

async function migrateSetup() {
  let entitlements = 0;
  let legacy = 0;

  for await (const docs of pages(db.collection("organizations"))) {
    for (const organization of docs) {
      const ref = organization.ref.collection("applications").doc("test-center");
      const snapshot = await ref.get();
      if (!snapshot.exists) {
        continue;
      }

      const onboarding = migrateSetupState(snapshot.get("onboarding"));
      if (onboarding) {
        entitlements++;
        if (APPLY) {
          await ref.update({ onboarding });
        }
      }
    }
  }

  for await (const docs of pages(db.collection("organizationOnboarding"))) {
    for (const doc of docs) {
      const migrated = migrateSetupState(doc.data());
      if (!migrated) {
        continue;
      }

      legacy++;
      if (APPLY) {
        await doc.ref.update({
          ...migrated,
          ...("firstCourseId" in doc.data() ? { firstCourseId: FieldValue.delete() } : {}),
        });
      }
    }
  }

  return { entitlements, legacy };
}

async function deleteOld() {
  for (const [from, to] of COLLECTIONS) {
    const [source, target] = await Promise.all([
      db.collection(from).count().get(),
      db.collection(to).count().get(),
    ]);
    const sourceCount = source.data().count;
    const targetCount = target.data().count;

    if (targetCount < sourceCount) {
      console.log(`  ${from}: NOT deleted - ${to} has ${targetCount} of ${sourceCount} documents. Run --apply first.`);
      continue;
    }

    await db.recursiveDelete(db.collection(from));
    console.log(`  ${from}: deleted ${sourceCount} documents (${to} has ${targetCount}).`);
  }
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);

  if (DELETE_OLD) {
    console.log("Deleting old collections (only where the new one is complete)...");
    await deleteOld();
    return;
  }

  console.log(APPLY ? "Mode: APPLY (writing changes)" : "Mode: DRY RUN (no changes; add --apply to write)");
  console.log("");

  for (const [from, to] of COLLECTIONS) {
    const stats = await copyCollection(from, to);
    console.log(
      `${from.padEnd(14)} -> ${to.padEnd(14)} ${String(stats.source).padStart(6)} docs, ` +
        `${stats.copied} ${APPLY ? "copied" : "to copy"}, ${stats.skipped} already there, ` +
        `${stats.renamed} with renamed fields`,
    );
  }

  const programs = await migratePrograms();
  console.log(`testPrograms   courseCount -> quizCount on ${programs} docs`);

  const setup = await migrateSetup();
  console.log(`Test Center setup state updated: ${setup.entitlements} entitlements, ${setup.legacy} legacy onboarding docs`);

  console.log("");
  console.log(APPLY ? "Done. Old collections are still there as a backup." : "Dry run complete. Nothing was written.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

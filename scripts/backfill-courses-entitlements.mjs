/**
 * One-off backfill for the Learning restructure.
 *
 * Courses is now a Learning capability an organization requests
 * (organizations/{id}/applications/courses). Before this, every
 * organization had courses. This script keeps courses working for
 * organizations that already use the Test Center:
 *
 *   - Every organization whose Test Center is active gets an active
 *     Courses entitlement (unless it already has one).
 *   - Organizations that have their own courses but no active Test
 *     Center are listed so you can decide; pass --include-course-owners
 *     to give them both Test Center and Courses.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/backfill-courses-entitlements.mjs            # dry run
 *   node scripts/backfill-courses-entitlements.mjs --apply
 *   node scripts/backfill-courses-entitlements.mjs --apply --include-course-owners
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const INCLUDE_COURSE_OWNERS = args.has("--include-course-owners");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const ACTOR = "backfill-courses-entitlements";

function activeEntitlement(organizationId, applicationId) {
  return {
    applicationId,
    organizationId,
    status: "active",
    version: 1,
    provisioningStrategy: "default",
    activatedAt: FieldValue.serverTimestamp(),
    activatedBy: ACTOR,
    provisionedAt: FieldValue.serverTimestamp(),
    configuration: {},
    provisioningError: null,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function statusOf(organizationRef, applicationId) {
  const snapshot = await organizationRef.collection("applications").doc(applicationId).get();
  return snapshot.exists ? String(snapshot.get("status") ?? "") : null;
}

const organizations = await db.collection("organizations").get();
const granted = [];
const alreadyActive = [];
const courseOwnersWithoutTestCenter = [];

for (const organization of organizations.docs) {
  const ref = organization.ref;
  const name = organization.get("name") ?? organization.id;
  const [testCenter, courses] = await Promise.all([statusOf(ref, "test-center"), statusOf(ref, "courses")]);

  if (courses === "active") {
    alreadyActive.push(name);
    continue;
  }

  if (testCenter === "active") {
    granted.push({ id: organization.id, name, alsoTestCenter: false });
    continue;
  }

  const ownCourses = await ref.collection("courses").limit(1).get();
  if (!ownCourses.empty) {
    if (INCLUDE_COURSE_OWNERS) {
      granted.push({ id: organization.id, name, alsoTestCenter: true });
    } else {
      courseOwnersWithoutTestCenter.push(name);
    }
  }
}

console.log(`${organizations.size} organizations checked.`);
console.log(`Courses already active: ${alreadyActive.length}`);
console.log(`${APPLY ? "Granting" : "Would grant"} Courses to ${granted.length}:`);
for (const item of granted) {
  console.log(`  - ${item.name} (${item.id})${item.alsoTestCenter ? " + Test Center" : ""}`);
}

if (courseOwnersWithoutTestCenter.length) {
  console.log(
    `\n${courseOwnersWithoutTestCenter.length} organizations have their own courses but no active Test Center ` +
      "(rerun with --include-course-owners to give them both):",
  );
  for (const name of courseOwnersWithoutTestCenter) {
    console.log(`  - ${name}`);
  }
}

if (!APPLY) {
  console.log("\nDry run. Rerun with --apply to write.");
  process.exit(0);
}

for (const item of granted) {
  const applications = db.collection("organizations").doc(item.id).collection("applications");
  const batch = db.batch();

  if (item.alsoTestCenter) {
    batch.set(applications.doc("test-center"), activeEntitlement(item.id, "test-center"), { merge: true });
  }

  batch.set(applications.doc("courses"), activeEntitlement(item.id, "courses"), { merge: true });
  await batch.commit();
}

console.log(`\nDone: ${granted.length} organizations updated.`);

/**
 * One-off backfill: the organization Mailbox is now an on-demand application
 * (organizations/{id}/applications/mailbox). Organizations that already use
 * the mailbox keep it:
 *
 *   - any organization with received or sent mail, or a departmental mailbox,
 *     gets an active Mailbox entitlement (unless it already has one).
 *
 * Others can request it from the Contract page.
 *
 * Usage (from the project root, same credentials as the other scripts):
 *   node scripts/backfill-mailbox-entitlements.mjs           # dry run
 *   node scripts/backfill-mailbox-entitlements.mjs --apply
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
const APPLY = process.argv.includes("--apply");

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const organizations = await db.collection("organizations").get();
const grant = [];
let alreadyActive = 0;

for (const organization of organizations.docs) {
  const ref = organization.ref;
  const entitlement = await ref.collection("applications").doc("mailbox").get();

  if (entitlement.get("status") === "active") {
    alreadyActive++;
    continue;
  }

  const [inbound, sent, departments] = await Promise.all([
    ref.collection("inboundMessages").limit(1).get(),
    ref.collection("sentMessages").limit(1).get(),
    ref.collection("mailboxes").limit(1).get(),
  ]);

  if (!inbound.empty || !sent.empty || !departments.empty) {
    grant.push({ id: organization.id, name: organization.get("name") ?? organization.id });
  }
}

console.log(`${organizations.size} organizations checked; ${alreadyActive} already have the Mailbox.`);
console.log(`${APPLY ? "Granting" : "Would grant"} the Mailbox to ${grant.length} organizations that already use it:`);
for (const item of grant) {
  console.log(`  - ${item.name} (${item.id})`);
}

if (!APPLY) {
  console.log("\nDry run. Rerun with --apply to write.");
  process.exit(0);
}

for (const item of grant) {
  await db.collection("organizations").doc(item.id).collection("applications").doc("mailbox").set(
    {
      applicationId: "mailbox",
      organizationId: item.id,
      status: "active",
      version: 1,
      provisioningStrategy: "default",
      activatedAt: FieldValue.serverTimestamp(),
      activatedBy: "backfill-mailbox-entitlements",
      provisionedAt: FieldValue.serverTimestamp(),
      configuration: {},
      provisioningError: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

console.log(`\nDone: ${grant.length} organizations updated.`);

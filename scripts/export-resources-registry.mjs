/**
 * Write docs/RESOURCES-REGISTRY.md: every listing in the public Resources
 * directory (/resources), read from Firestore, grouped by category, plus the
 * providers that were checked and left out (scripts/resources-left-out.json)
 * and any listings that already look like duplicates of each other.
 *
 * Run it after adding or changing listings (seed scripts or Admin → Resources),
 * and read the registry before adding new ones, so nothing is listed twice.
 *
 *   node scripts/export-resources-registry.mjs
 *
 * Read-only: it changes nothing in Firestore.
 */
import fs from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PROJECT_ID, AUTHOR, buildIndex, findDuplicates } from "./lib/seed-resources.mjs";

const OUT = new URL("../docs/RESOURCES-REGISTRY.md", import.meta.url);
const LEFT_OUT = new URL("./resources-left-out.json", import.meta.url);

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore();

const cell = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim() || "—";
const host = (url) => String(url ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (value._ts) return new Date(value._ts);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
const day = (value) => toDate(value)?.toISOString().slice(0, 10) ?? "—";

async function main() {
  const [resources, categories, types, locations] = await Promise.all(
    ["resources", "categories", "resourceTypes", "locations"].map((name) => db.collection(name).get()),
  );
  const byId = (snapshot) => new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
  const categoryOf = byId(categories);
  const typeOf = byId(types);
  const locationOf = byId(locations);

  const rows = resources.docs.map((doc) => {
    const r = doc.data();
    const location = locationOf.get(r.locationId);
    return {
      id: doc.id,
      name: r.name,
      slug: r.slug ?? doc.id,
      category: categoryOf.get(r.categoryId)?.name ?? "(no category)",
      type: typeOf.get(r.resourceType)?.name ?? "—",
      area: r.serviceArea || (r.online ? "Online" : ""),
      phone: r.phone,
      website: host(r.website),
      address: location ? `${location.address}, ${location.city}, ${location.state} ${location.zipCode}` : r.online ? "Online" : "",
      status: r.status ?? "—",
      verified: r.verified ? day(r.lastVerifiedAt) : "not verified",
      addedBy: r.createdBy === AUTHOR ? "seed script" : "admin",
    };
  });

  const statusCount = {};
  for (const row of rows) statusCount[row.status] = (statusCount[row.status] ?? 0) + 1;

  const groups = new Map();
  for (const row of rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))) {
    if (!groups.has(row.category)) groups.set(row.category, []);
    groups.get(row.category).push(row);
  }

  // Listings already in Firestore that match each other by name or website.
  const index = buildIndex(resources.docs);
  const pairs = new Set();
  for (const doc of resources.docs) {
    const { blocking } = findDuplicates(index, { name: doc.get("name"), website: doc.get("website"), slug: doc.get("slug") ?? doc.id });
    for (const other of blocking) pairs.add([doc.get("name"), other].sort().join("  ↔  "));
  }

  const leftOut = fs.existsSync(LEFT_OUT) ? JSON.parse(fs.readFileSync(LEFT_OUT, "utf8")).leftOut ?? [] : [];
  const now = new Date();

  const out = [];
  out.push("# Resources registry", "");
  out.push(
    `Generated ${now.toISOString().slice(0, 16).replace("T", " ")} UTC from Firestore project \`${PROJECT_ID}\` by \`node scripts/export-resources-registry.mjs\`. Do not edit by hand: change the listings (seed scripts or Admin → Resources), or \`scripts/resources-left-out.json\`, and run the export again.`,
    "",
  );
  out.push(
    `**${rows.length} listings**: ${Object.entries(statusCount).map(([status, count]) => `${count} ${status}`).join(", ")}. ` +
      `${rows.filter((r) => r.addedBy === "seed script").length} added by seed scripts, ${rows.filter((r) => r.addedBy === "admin").length} by admins.`,
    "",
  );
  out.push("## Before adding resources", "");
  out.push(
    "1. Run the export so this file is current, then search it for the provider's **name, website and phone**.",
    "2. Check **Checked and left out** below: those were already researched and dropped, with the reason.",
    "3. Put new listings in a new batch script (`scripts/seed-resources-<area>-<n>.mjs`) that calls `seedResources()` from `scripts/lib/seed-resources.mjs`. The engine skips a listing whose slug exists and **refuses** one whose name or website matches any listing in Firestore (whoever added it), unless `--allow-duplicates`. A shared phone number only prints a note, because one call centre often serves several programs.",
    "4. After loading, run this export again and commit the updated registry.",
    "",
  );

  out.push("## Listings by category", "");
  for (const [category, list] of groups) {
    out.push(`### ${category} (${list.length})`, "");
    out.push("| Name | Slug | Type | Area served | Phone | Website | Address | Status | Verified | Added by |");
    out.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const r of list) {
      out.push(`| ${[r.name, `\`${r.slug}\``, r.type, r.area, r.phone, r.website, r.address, r.status, r.verified, r.addedBy].map(cell).join(" | ")} |`);
    }
    out.push("");
  }

  out.push("## Possible duplicates already in the directory", "");
  if (pairs.size) {
    out.push("These listings share a name or website. Check whether each pair is really two services, and merge or delete if not.", "");
    for (const pair of [...pairs].sort()) out.push(`- ${pair}`);
  } else {
    out.push("None found (no two listings share a name or website).");
  }
  out.push("");

  out.push("## Checked and left out", "");
  if (leftOut.length) {
    out.push("Researched but not added. Don't research these again unless the reason no longer applies; remove an entry from `scripts/resources-left-out.json` when the provider is added.", "");
    out.push("| Provider | Area | Why it was left out | Checked |", "| --- | --- | --- | --- |");
    for (const item of leftOut) out.push(`| ${[item.name, item.area, item.reason, item.checked].map(cell).join(" | ")} |`);
  } else {
    out.push("None.");
  }
  out.push("");

  fs.mkdirSync(new URL("../docs/", import.meta.url), { recursive: true });
  fs.writeFileSync(OUT, out.join("\n"));
  console.log(`Wrote docs/RESOURCES-REGISTRY.md: ${rows.length} listings in ${groups.size} categories, ${pairs.size} possible duplicate pair(s), ${leftOut.length} left out.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

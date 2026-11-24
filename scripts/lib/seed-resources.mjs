/**
 * Shared engine for the Resources directory seed scripts
 * (scripts/seed-resources-*.mjs). Each batch script holds only its listings
 * and calls seedResources(); this module finds or creates the categories,
 * resource types and locations, refuses duplicates, and writes the listings.
 *
 * Duplicates: before writing, it loads every resource already in Firestore
 * (whoever added it). A listing whose slug exists is skipped (or replaced with
 * --overwrite). A listing whose name or website matches another listing is
 * refused unless --allow-duplicates. A shared phone number only prints a note.
 *
 * The list of what is already in the directory is docs/RESOURCES-REGISTRY.md,
 * refreshed with: node scripts/export-resources-registry.mjs
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

export const PROJECT_ID = process.env.GCLOUD_PROJECT || "zebron-2b49f";
export const AUTHOR = "zebron-platform";
/** Default verification date; a listing can set its own with verifiedOn: new Date(...). */
const VERIFIED_ON = new Date("2026-11-23T12:00:00-05:00");

// ============================================================
// Categories, one per "Search by Category" topic
// (keywords copied from src/app/features/resources/resource-needs.ts)
// ============================================================

export const TOPICS = [
  ["food", ["food", "pantry", "meal", "nutrition", "snap"]],
  ["housing", ["housing", "shelter", "rent", "apartment", "homeless"]],
  ["mental-health", ["mental", "counsel", "behavioral"]],
  ["health", ["health", "medical", "clinic", "dental", "insurance"]],
  ["crisis", ["crisis", "emergency", "violence", "abuse", "hotline"]],
  ["substance", ["substance", "addiction", "recovery", "alcohol", "drug"]],
  ["jobs", ["employment", "job", "career", "workforce", "income"]],
  ["bootcamps", ["bootcamp", "coding"]],
  ["education", ["education", "school", "college", "universit", "language", "esl", "literacy", "training"]],
  ["legal", ["legal", "immigration", "law", "citizenship", "asylum"]],
  ["money", ["financ", "money", "scholarship", "benefit", "tax", "cash"]],
  ["utilities", ["utilit", "energy", "heat", "electric", "water bill"]],
  ["basic-needs", ["basic need", "clothing", "diaper", "household", "furniture"]],
  ["transportation", ["transport", "transit", "rides"]],
  ["families", ["child", "famil", "parent", "daycare"]],
  ["youth", ["youth", "teen", "young"]],
  ["older-adults", ["older", "senior", "elder"]],
  ["business", ["business", "entrepreneur", "startup"]],
  ["community", ["event", "community", "workshop", "activit", "recreation"]],
  ["government", ["government", "public", "id card", "dmv"]],
  ["reentry", ["re-entry", "reentry", "incarcerat", "justice"]],
];

/** The topic a category name/slug falls under (first match wins, as on /resources). */
export const topicOf = (category) => {
  const text = `${category.slug ?? ""} ${category.name ?? ""}`.toLowerCase();
  return TOPICS.find(([, words]) => words.some((word) => text.includes(word)))?.[0];
};

/** The category each listing goes in, created only if no existing category covers the topic. */
export const CATEGORIES = {
  food: { slug: "food", name: "Food", description: "Food banks, pantries, meals and SNAP help.", icon: "restaurant" },
  housing: { slug: "housing-and-shelter", name: "Housing and shelter", description: "Shelter, rent help, eviction prevention and housing counseling.", icon: "home" },
  "mental-health": { slug: "mental-health", name: "Mental health", description: "Counseling, treatment and crisis support.", icon: "psychology" },
  health: { slug: "health-care", name: "Health care", description: "Community health centers, clinics and dental care.", icon: "medical_services" },
  crisis: { slug: "crisis-hotlines", name: "Crisis hotlines", description: "24/7 hotlines for crisis, violence and abuse.", icon: "emergency" },
  substance: { slug: "substance-use", name: "Substance use", description: "Treatment referrals and recovery support.", icon: "healing" },
  jobs: { slug: "employment", name: "Employment", description: "Job centers, career help and job training.", icon: "work" },
  education: { slug: "education-and-english-classes", name: "Education and English classes", description: "Adult education, English (ESL) and GED classes.", icon: "school" },
  legal: { slug: "legal-and-immigration", name: "Legal and immigration", description: "Free legal aid and immigration legal services.", icon: "gavel" },
  money: { slug: "money-and-taxes", name: "Money and taxes", description: "Free tax preparation, benefits and financial coaching.", icon: "savings" },
  utilities: { slug: "utility-assistance", name: "Utility assistance", description: "Help paying for heat, electricity and water.", icon: "bolt" },
  "basic-needs": { slug: "basic-needs", name: "Basic needs", description: "Furniture, household items, clothing and diapers.", icon: "inventory_2" },
  transportation: { slug: "transportation", name: "Transportation", description: "Reduced fares and rides.", icon: "directions_bus" },
  families: { slug: "child-care-and-families", name: "Child care and families", description: "Help paying for child care and family support.", icon: "family_restroom" },
  youth: { slug: "youth-programs", name: "Youth programs", description: "Education, jobs and support for young people.", icon: "groups" },
  "older-adults": { slug: "older-adults", name: "Older adults", description: "Services for seniors, people with disabilities and caregivers.", icon: "elderly" },
  business: { slug: "small-business", name: "Small business", description: "Free advising and help starting or growing a business.", icon: "storefront" },
  government: { slug: "government-and-public-services", name: "Government and public services", description: "211 helplines and public benefit offices.", icon: "account_balance" },
  reentry: { slug: "re-entry", name: "Re-entry", description: "Support after incarceration.", icon: "door_open" },
};

// ============================================================
// Resource types (matched the way resource-form-profile.ts does)
// ============================================================

export const TYPES = {
  // Only a generic type ("Service", "Place", "Provider"…), never a specific one such as "Legal Service".
  place: { name: "Service", slug: "service", description: "A place people visit or call for help.", test: (t) => /^(services?|place|provider|agency|organi[sz]ation)( |$)/.test(t) },
  hotline: { name: "Hotline", slug: "hotline", description: "A phone, text or chat line.", test: (t) => /hotline|helpline|phone line|crisis line/.test(t) },
  online: { name: "Online tool", slug: "online-tool", description: "A website or online application.", test: (t) => /online|website|web site|tool|app\b|digital|portal/.test(t) && !/hotline|helpline/.test(t) },
  program: { name: "Program", slug: "program", description: "A program people enroll or apply in.", test: (t) => /program|course|training|class/.test(t) && !/event|workshop|webinar|hotline|helpline|online|website|tool|portal/.test(t) },
};

// ============================================================
// Helpers for the listings below
// ============================================================

export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** hours({ "monday-thursday": ["08:30", "17:00"], friday: ["08:30", "15:00"] }) */
export function hours(spec, extra = {}) {
  const result = { alwaysAvailable: false, byAppointment: false, ...extra };
  for (const day of DAYS) result[day] = { open: false };
  for (const [range, [openTime, closeTime]] of Object.entries(spec)) {
    const [from, to = from] = range.split("-");
    const start = DAYS.indexOf(from);
    const end = DAYS.indexOf(to);
    if (start < 0 || end < start) throw new Error(`Bad day range: ${range}`);
    for (let i = start; i <= end; i++) result[DAYS[i]] = { open: true, openTime, closeTime };
  }
  return result;
}

export const ALWAYS = { alwaysAvailable: true, byAppointment: false };
export const NONE = { alwaysAvailable: false, byAppointment: false };
export const APPOINTMENT = { alwaysAvailable: false, byAppointment: true };

export const EN = ["English"];
export const EN_ES = ["English", "Spanish"];

// ============================================================

// ============================================================
// Duplicate guard
// ============================================================

export const digits = (phone) => String(phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

export const normalName = (name) =>
  String(name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|inc|llc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalUrl = (url) =>
  String(url ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");

/**
 * Index of every resource already in the directory, whoever added it.
 * A new listing is a duplicate when its name or website matches an existing
 * listing with another slug; a shared phone number is only a warning, because
 * one call centre often serves several programs (for example Virginia's
 * 855-635-4370 for SNAP, energy and child care).
 */
export function buildIndex(docs) {
  const index = { slug: new Map(), name: new Map(), url: new Map(), phone: new Map() };
  const add = (map, key, entry) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  };
  for (const doc of docs) {
    const entry = { id: doc.id, slug: doc.get("slug"), name: doc.get("name"), doc };
    add(index.slug, entry.slug, entry);
    add(index.name, normalName(entry.name), entry);
    add(index.url, normalUrl(doc.get("website")), entry);
    const phone = digits(doc.get("phone"));
    if (phone.length >= 10) add(index.phone, phone, entry);
  }
  return index;
}

export function findDuplicates(index, item) {
  const others = (list) => (list ?? []).filter((entry) => entry.slug !== item.slug);
  const byName = others(index.name.get(normalName(item.name)));
  const byUrl = others(index.url.get(normalUrl(item.website)));
  const phone = digits(item.phone);
  const byPhone = phone.length >= 10 ? others(index.phone.get(phone)) : [];
  const blocking = [...new Map([...byName, ...byUrl].map((entry) => [entry.id, entry])).values()];
  const reasons = (entry) =>
    [byName.includes(entry) && "same name", byUrl.includes(entry) && "same website"].filter(Boolean).join(", ");
  return {
    blocking: blocking.map((entry) => `${entry.name} (${entry.slug ?? entry.id}; ${reasons(entry)})`),
    warnings: byPhone.filter((entry) => !blocking.includes(entry)).map((entry) => `${entry.name} (${entry.slug ?? entry.id})`),
  };
}

// ============================================================
// Write
// ============================================================

/**
 * Seed one batch of resource listings. Options are read from the command line:
 *   (none)              dry run
 *   --apply             write
 *   --draft             save new listings as drafts
 *   --overwrite         replace listings whose slug already exists
 *   --retype            only correct the resource type of listings this engine created
 *   --allow-duplicates  create a listing even when it matches another listing's name or website
 */
export async function seedResources({ resources, label }) {
  const args = new Set(process.argv.slice(2));
  const APPLY = args.has("--apply");
  const DRAFT = args.has("--draft");
  const OVERWRITE = args.has("--overwrite");
  const RETYPE = args.has("--retype");
  const ALLOW_DUPLICATES = args.has("--allow-duplicates");

  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  // ---------- checks on the batch itself ----------
  const seen = { slug: new Map(), name: new Map(), url: new Map() };
  for (const item of resources) {
    if (!CATEGORIES[item.topic]) throw new Error(`${item.slug}: unknown topic ${item.topic}`);
    if (!TYPES[item.type]) throw new Error(`${item.slug}: unknown type ${item.type}`);
    for (const key of ["website", "applyUrl", "sourceUrl"]) {
      if (item[key] && !/^https:\/\/\S+\.\S+/.test(item[key])) throw new Error(`${item.slug}: ${key} must start with https://`);
    }
    for (const [kind, key] of [["slug", item.slug], ["name", normalName(item.name)], ["url", normalUrl(item.website)]]) {
      if (!key) continue;
      if (seen[kind].has(key)) throw new Error(`${item.slug}: same ${kind} as ${seen[kind].get(key)} in this batch`);
      seen[kind].set(key, item.slug);
    }
  }

  // ---------- categories ----------
  async function resolveCategories() {
    const snapshot = await db.collection("categories").get();
    const existing = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const maxOrder = Math.max(0, ...existing.map((c) => (typeof c.sortOrder === "number" ? c.sortOrder : 0)));
    const ids = {};
    let added = 0;
    for (const topic of new Set(resources.map((item) => item.topic))) {
      const wanted = CATEGORIES[topic];
      const found =
        existing.find((c) => c.slug === wanted.slug) ??
        existing.find((c) => c.active !== false && topicOf(c) === topic);
      if (found) {
        ids[topic] = found.id;
        console.log(`  category  use     ${found.name} (${found.slug})`);
        continue;
      }
      const ref = db.collection("categories").doc();
      ids[topic] = ref.id;
      added++;
      console.log(`  category  create  ${wanted.name} (${wanted.slug})`);
      if (APPLY) {
        await ref.set({
          ...wanted,
          active: true,
          sortOrder: maxOrder + added,
          reviewIntervalDays: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    return ids;
  }

  // ---------- resource types ----------
  async function resolveTypes() {
    const snapshot = await db.collection("resourceTypes").get();
    const existing = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const maxOrder = Math.max(0, ...existing.map((t) => (typeof t.sortOrder === "number" ? t.sortOrder : 0)));
    const ids = {};
    let added = 0;
    for (const key of new Set(resources.map((item) => item.type))) {
      const wanted = TYPES[key];
      const text = (t) => `${t.name ?? ""} ${t.slug ?? ""}`.toLowerCase();
      const found =
        existing.find((t) => t.slug === wanted.slug) ??
        existing.find((t) => t.active !== false && wanted.test(text(t)));
      if (found) {
        ids[key] = found.id;
        console.log(`  type      use     ${found.name}`);
        continue;
      }
      const ref = db.collection("resourceTypes").doc();
      ids[key] = ref.id;
      added++;
      console.log(`  type      create  ${wanted.name}`);
      if (APPLY) {
        await ref.set({
          name: wanted.name,
          slug: wanted.slug,
          description: wanted.description,
          active: true,
          sortOrder: maxOrder + added,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    return ids;
  }

  // ---------- locations ----------
  const locationCache = new Map();
  async function resolveLocation(location) {
    if (!location) return "";
    const key = `${location.address.toLowerCase()}|${location.zipCode}`;
    if (locationCache.has(key)) return locationCache.get(key);
    const snapshot = await db.collection("locations").where("zipCode", "==", location.zipCode).get();
    const found = snapshot.docs.find((doc) => (doc.get("address") ?? "").trim().toLowerCase() === location.address.toLowerCase());
    let id;
    if (found) {
      id = found.id;
    } else {
      const ref = db.collection("locations").doc();
      id = ref.id;
      console.log(`  location  create  ${location.address}, ${location.city}, ${location.state} ${location.zipCode}`);
      if (APPLY) {
        await ref.set({
          ...location,
          country: "United States",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    locationCache.set(key, id);
    return id;
  }

  // ---------- run ----------
  console.log(
    RETYPE
      ? `${APPLY ? "Fixing" : "Dry run: checking"} resource types of ${label} listings in ${PROJECT_ID}\n`
      : `${APPLY ? "Writing" : "Dry run:"} ${resources.length} resources (${label}) to ${PROJECT_ID} as ${DRAFT ? "drafts" : "published"}\n`,
  );

  const categoryIds = await resolveCategories();
  const typeIds = await resolveTypes();
  console.log("");

  const index = buildIndex((await db.collection("resources").get()).docs);

  if (RETYPE) {
    let changed = 0;
    for (const item of resources) {
      const current = index.slug.get(item.slug)?.[0]?.doc;
      if (!current || current.get("createdBy") !== AUTHOR) continue;
      const wanted = typeIds[item.type];
      if (current.get("resourceType") === wanted) continue;
      changed++;
      console.log(`  retype    ${item.slug}  → ${TYPES[item.type].name}`);
      if (APPLY) await current.ref.update({ resourceType: wanted, updatedAt: FieldValue.serverTimestamp() });
    }
    console.log(`\n${changed} listing(s) ${APPLY ? "retyped" : "to retype"}.`);
    if (!APPLY) console.log("Nothing written. Add --apply to write.");
    return;
  }

  const counts = { create: 0, replace: 0, skip: 0, duplicate: 0 };

  for (const item of resources) {
    const current = index.slug.get(item.slug)?.[0]?.doc;

    if (current && !OVERWRITE) {
      counts.skip++;
      console.log(`  skip      ${item.slug} (already exists; use --overwrite to replace)`);
      continue;
    }

    const { blocking, warnings } = findDuplicates(index, item);
    if (blocking.length && !ALLOW_DUPLICATES) {
      counts.duplicate++;
      console.log(`  DUPLICATE ${item.slug}: already listed as ${blocking.join("; ")}. Not added (use --allow-duplicates if it really is different).`);
      continue;
    }
    for (const warning of warnings) console.log(`  note      ${item.slug}: same phone as ${warning}`);

    const locationId = await resolveLocation(item.location);
    const data = {
      name: item.name,
      slug: item.slug,
      description: item.description,
      categoryId: categoryIds[item.topic],
      organizationId: "",
      resourceType: typeIds[item.type],
      website: item.website ?? "",
      phone: item.phone ?? "",
      email: item.email ?? "",
      locationId,
      availability: item.availability,
      online: item.online,
      eventStart: "",
      eventEnd: "",
      cost: item.cost,
      tags: item.tags.map((tag) => tag.toLowerCase()),
      eligibility: item.eligibility ?? "",
      documentsNeeded: item.documentsNeeded ?? "",
      howToApply: item.howToApply ?? "",
      applyUrl: item.applyUrl ?? "",
      languages: item.languages ?? [],
      serviceArea: item.serviceArea ?? "",
      sourceUrl: item.sourceUrl,
      status: DRAFT ? "draft" : "published",
      verified: true,
      lastVerifiedAt: Timestamp.fromDate(item.verifiedOn ?? VERIFIED_ON),
      featured: false,
      createdBy: current?.get("createdBy") ?? AUTHOR,
      updatedAt: FieldValue.serverTimestamp(),
      ...(current ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };

    counts[current ? "replace" : "create"]++;
    console.log(`  ${current ? "replace" : "create "}   ${item.slug}  [${CATEGORIES[item.topic].name}, ${TYPES[item.type].name}]`);

    if (APPLY) {
      const ref = current ? current.ref : db.collection("resources").doc();
      await ref.set(data, { merge: !!current });
    }
  }

  console.log(
    `\n${counts.create} to create, ${counts.replace} to replace, ${counts.skip} skipped (same slug), ${counts.duplicate} refused as duplicates.`,
  );
  console.log(
    APPLY
      ? "Done. Open Admin → Resources (/admin/resources) to review them, then refresh the registry: node scripts/export-resources-registry.mjs"
      : "Nothing written. Add --apply to write.",
  );
}

/** Run a batch script's main and exit non-zero on failure. */
export function run(promise) {
  promise.catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

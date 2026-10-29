import fs from "node:fs";

const INDEXES_PATH = "firestore.indexes.json";
const FIREBASE_JSON_PATH = "firebase.json";

const REQUIRED_INDEXES = [
  {
    collectionGroup: "organizationEmailOutbox",
    queryScope: "COLLECTION",
    fields: [
      {fieldPath: "status", order: "ASCENDING"},
      {fieldPath: "nextAttemptAt", order: "ASCENDING"},
    ],
  },
  {
    collectionGroup: "organizationEmailOutbox",
    queryScope: "COLLECTION",
    fields: [
      {fieldPath: "status", order: "ASCENDING"},
      {fieldPath: "leaseExpiresAt", order: "ASCENDING"},
    ],
  },
];

function indexKey(index) {
  return JSON.stringify([
    index.collectionGroup,
    index.queryScope ?? "COLLECTION",
    (index.fields ?? []).map((field) => [
      field.fieldPath,
      field.order ?? field.arrayConfig ?? field.vectorConfig ?? null,
    ]),
  ]);
}

let data = {indexes: [], fieldOverrides: []};

if (fs.existsSync(INDEXES_PATH)) {
  try {
    data = JSON.parse(fs.readFileSync(INDEXES_PATH, "utf8"));
  } catch (error) {
    console.error(`${INDEXES_PATH} is not valid JSON, so it was left unchanged.`);
    console.error(error.message);
    process.exit(1);
  }
} else {
  console.log(`${INDEXES_PATH} not found; creating it.`);
}

data.indexes ??= [];
data.fieldOverrides ??= [];

const existingKeys = new Set(data.indexes.map(indexKey));
let added = 0;

for (const index of REQUIRED_INDEXES) {
  const label = `${index.collectionGroup} (${index.fields.map((f) => f.fieldPath).join(", ")})`;
  if (existingKeys.has(indexKey(index))) {
    console.log(`Already present: ${label}`);
    continue;
  }
  data.indexes.push(index);
  added += 1;
  console.log(`Added: ${label}`);
}

fs.writeFileSync(INDEXES_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(`${added} index(es) added; ${data.indexes.length} total in ${INDEXES_PATH}.`);

if (fs.existsSync(FIREBASE_JSON_PATH)) {
  try {
    const firebaseJson = JSON.parse(fs.readFileSync(FIREBASE_JSON_PATH, "utf8"));
    const configs = Array.isArray(firebaseJson.firestore)
      ? firebaseJson.firestore
      : [firebaseJson.firestore ?? {}];
    if (!configs.some((c) => c?.indexes === INDEXES_PATH)) {
      console.warn(`\nWarning: ${FIREBASE_JSON_PATH} does not reference ${INDEXES_PATH}. ` +
        `Add "indexes": "${INDEXES_PATH}" to its "firestore" section before deploying.`);
    }
  } catch {
    console.warn(`\nWarning: could not read ${FIREBASE_JSON_PATH} to check it references ${INDEXES_PATH}.`);
  }
}

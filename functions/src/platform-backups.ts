/* eslint-disable max-len */
import "./firebase-admin";

import { createGzip } from "node:zlib";
import { once } from "node:events";

import { applicationDefault, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { requirePlatformAdministrator } from "./platform-admin-authorization";

/**
 * Platform backups (Admin → Backups).
 *
 * One backup is a document platformBackups/{backupId} plus a folder in
 * the default Storage bucket:
 *
 *   platform-backups/{backupId}/firestore/...      Google's managed Firestore export (complete, restorable with `gcloud firestore import`)
 *   platform-backups/{backupId}/records.ndjson.gz  every document, one JSON line each: {"path": "...", "data": {...}}
 *   platform-backups/{backupId}/auth-users.json    every sign-in account (no password hashes)
 *   platform-backups/{backupId}/files.csv          list of every uploaded file (path, size, type, updated)
 *   platform-backups/{backupId}/summary.json       counts
 *
 * Flow: startPlatformBackup (callable, platform administrators) or the
 * weekly schedule creates the document; runPlatformBackup (Firestore
 * trigger) does the work; refreshPlatformBackup polls the managed export
 * until Google finishes it. Only the newest KEEP_BACKUPS are kept.
 *
 * Storage rules let platform administrators read platform-backups/**;
 * nobody can write there from the app. Firestore rules let platform
 * administrators read platformBackups; only functions write.
 *
 * Needs (one-time, see the "Backups: set up" Knowledge Center article):
 *   - the functions service account has roles/datastore.importExportAdmin
 *   - the Firestore service agent can write to the bucket
 */

const REGION = "us-central1";
const COLLECTION = "platformBackups";
const FOLDER = "platform-backups";
const KEEP_BACKUPS = 8;
const PAGE_SIZE = 500;
/** Stop the readable export before the 540 s function timeout. */
const RECORDS_TIME_BUDGET_MS = 420 * 1000;
/** A backup still "running" after this long is treated as stuck. */
const STUCK_AFTER_MS = 30 * 60 * 1000;

type BackupTrigger = "manual" | "scheduled";

interface FirestoreExportState {
  operation?: string;
  state: "not-started" | "PROCESSING" | "SUCCESSFUL" | "FAILED" | "CANCELLED" | "UNKNOWN";
  outputUri?: string;
  documents?: number;
  bytes?: number;
  error?: string;
}

// ------------------------------------------------------------
// Google APIs (REST, with the function's own credentials)
// ------------------------------------------------------------

function projectId(): string {
  const id = getApp().options.projectId || process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!id) {
    throw new Error("Project ID is not available.");
  }
  return id;
}

async function googleFetch(url: string, init: { method?: string; body?: unknown } = {}): Promise<Record<string, unknown>> {
  const token = await applicationDefault().getAccessToken();
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) as unknown : {};

  if (!response.ok) {
    const message = (json as { error?: { message?: string } })?.error?.message ?? text.slice(0, 300);
    throw new Error(`${response.status} ${message}`);
  }

  return (Array.isArray(json) ? { results: json } : json) as Record<string, unknown>;
}

const DOCUMENTS_ROOT = () => `projects/${projectId()}/databases/(default)/documents`;

/** Firestore REST value → plain JSON. */
export function fromRestValue(value: Record<string, unknown> | undefined): unknown {
  if (!value) {
    return null;
  }
  if ("nullValue" in value) {
    return null;
  }
  if ("booleanValue" in value) {
    return value.booleanValue;
  }
  if ("integerValue" in value) {
    const parsed = Number(value.integerValue);
    return Number.isSafeInteger(parsed) ? parsed : String(value.integerValue);
  }
  if ("doubleValue" in value) {
    return Number(value.doubleValue);
  }
  if ("timestampValue" in value) {
    return value.timestampValue;
  }
  if ("stringValue" in value) {
    return value.stringValue;
  }
  if ("bytesValue" in value) {
    return { $bytes: value.bytesValue };
  }
  if ("referenceValue" in value) {
    const reference = String(value.referenceValue);
    const marker = "/documents/";
    const index = reference.indexOf(marker);
    return { $ref: index >= 0 ? reference.slice(index + marker.length) : reference };
  }
  if ("geoPointValue" in value) {
    return value.geoPointValue;
  }
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: Array<Record<string, unknown>> })?.values ?? [];
    return values.map((item) => fromRestValue(item));
  }
  if ("mapValue" in value) {
    return fromRestFields((value.mapValue as { fields?: Record<string, Record<string, unknown>> })?.fields);
  }
  return null;
}

export function fromRestFields(fields: Record<string, Record<string, unknown>> | undefined): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    result[key] = fromRestValue(value);
  }
  return result;
}

/** Writes a chunk, waiting when the stream asks us to slow down. */
async function writeChunk(stream: NodeJS.WritableStream, chunk: string): Promise<void> {
  if (!stream.write(chunk)) {
    await once(stream, "drain");
  }
}

async function finish(stream: NodeJS.WritableStream, done: Promise<unknown>): Promise<void> {
  stream.end();
  await done;
}

function storageUpload(path: string, contentType: string) {
  const file = getStorage().bucket().file(path);
  const stream = file.createWriteStream({ resumable: true, metadata: { contentType, cacheControl: "private, no-store" } });
  const done = new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
  return { stream, done };
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

// ------------------------------------------------------------
// Steps
// ------------------------------------------------------------

/** Starts Google's managed export of the whole database into the backup folder. */
async function startManagedExport(backupId: string): Promise<FirestoreExportState> {
  const outputUri = `gs://${getStorage().bucket().name}/${FOLDER}/${backupId}/firestore`;
  try {
    const operation = await googleFetch(
      `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default):exportDocuments`,
      { method: "POST", body: { outputUriPrefix: outputUri } },
    );
    return { operation: String(operation.name ?? ""), state: "PROCESSING", outputUri };
  } catch (error) {
    logger.error("Managed Firestore export could not start.", { backupId, error: String(error) });
    return { state: "FAILED", outputUri, error: String(error).slice(0, 500) };
  }
}

/** Checks a managed export; returns the new state. */
async function pollManagedExport(current: FirestoreExportState): Promise<FirestoreExportState> {
  if (!current.operation || current.state !== "PROCESSING") {
    return current;
  }

  try {
    const operation = await googleFetch(`https://firestore.googleapis.com/v1/${current.operation}`);
    const metadata = (operation.metadata ?? {}) as {
      operationState?: string;
      progressDocuments?: { completedWork?: string };
      progressBytes?: { completedWork?: string };
    };
    const error = operation.error as { message?: string } | undefined;
    const state = error ? "FAILED" : (metadata.operationState ?? (operation.done ? "SUCCESSFUL" : "PROCESSING"));

    return {
      ...current,
      state: (["PROCESSING", "SUCCESSFUL", "FAILED", "CANCELLED"].includes(state) ? state : (operation.done ? "SUCCESSFUL" : "PROCESSING")) as FirestoreExportState["state"],
      documents: Number(metadata.progressDocuments?.completedWork ?? current.documents ?? 0),
      bytes: Number(metadata.progressBytes?.completedWork ?? current.bytes ?? 0),
      ...(error?.message ? { error: error.message.slice(0, 500) } : {}),
    };
  } catch (error) {
    logger.warn("Managed export status could not be read.", { operation: current.operation, error: String(error) });
    return current;
  }
}

/**
 * Every document in the database (all collections and subcollections),
 * one JSON line each, gzip-compressed. Uses a kindless "all descendants"
 * query ordered by document name, so it pages through everything without
 * knowing the collection names.
 */
async function exportRecords(backupId: string, startedAt: number) {
  const { stream, done } = storageUpload(`${FOLDER}/${backupId}/records.ndjson.gz`, "application/gzip");
  const gzip = createGzip();
  gzip.pipe(stream);

  const root = DOCUMENTS_ROOT();
  const prefix = `${root}/`;
  const collections: Record<string, number> = {};
  let total = 0;
  let last: string | null = null;
  let complete = true;

  for (;;) {
    if (Date.now() - startedAt > RECORDS_TIME_BUDGET_MS) {
      complete = false;
      break;
    }

    const structuredQuery: Record<string, unknown> = {
      from: [{ allDescendants: true }],
      orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }],
      limit: PAGE_SIZE,
    };
    if (last) {
      structuredQuery.startAt = { values: [{ referenceValue: last }], before: false };
    }

    const response = await googleFetch(
      `https://firestore.googleapis.com/v1/${root}:runQuery`,
      { method: "POST", body: { structuredQuery } },
    );
    const rows = (response.results as Array<{ document?: { name: string; fields?: Record<string, Record<string, unknown>>; createTime?: string; updateTime?: string } }>) ?? [];
    const documents = rows.map((row) => row.document).filter((document): document is NonNullable<typeof document> => !!document);

    for (const document of documents) {
      const path = document.name.startsWith(prefix) ? document.name.slice(prefix.length) : document.name;
      const top = path.split("/")[0] ?? "";
      collections[top] = (collections[top] ?? 0) + 1;
      total += 1;
      await writeChunk(gzip, JSON.stringify({
        path,
        createTime: document.createTime,
        updateTime: document.updateTime,
        data: fromRestFields(document.fields),
      }) + "\n");
    }

    if (documents.length < PAGE_SIZE) {
      break;
    }
    last = documents[documents.length - 1].name;
  }

  await finish(gzip, done);
  return { total, collections, complete };
}

/** Every sign-in account, without password hashes. */
async function exportAuthUsers(backupId: string): Promise<number> {
  const { stream, done } = storageUpload(`${FOLDER}/${backupId}/auth-users.json`, "application/json");
  let count = 0;
  let pageToken: string | undefined;

  await writeChunk(stream, "[\n");
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const user of page.users) {
      await writeChunk(stream, (count ? ",\n" : "") + JSON.stringify({
        uid: user.uid,
        email: user.email ?? null,
        emailVerified: user.emailVerified,
        displayName: user.displayName ?? null,
        phoneNumber: user.phoneNumber ?? null,
        photoURL: user.photoURL ?? null,
        disabled: user.disabled,
        providers: user.providerData.map((provider) => provider.providerId),
        customClaims: user.customClaims ?? {},
        createdAt: user.metadata.creationTime,
        lastSignInAt: user.metadata.lastSignInTime ?? null,
      }));
      count += 1;
    }
    pageToken = page.pageToken;
  } while (pageToken);
  await writeChunk(stream, "\n]\n");

  await finish(stream, done);
  return count;
}

/** A list of every uploaded file (not the files themselves). */
async function exportFileList(backupId: string): Promise<{ count: number; bytes: number }> {
  const bucket = getStorage().bucket();
  const { stream, done } = storageUpload(`${FOLDER}/${backupId}/files.csv`, "text/csv");
  let count = 0;
  let bytes = 0;
  let pageToken: string | undefined;

  await writeChunk(stream, "path,bytes,contentType,updated\n");
  do {
    const [files, next] = await bucket.getFiles({ autoPaginate: false, maxResults: 1000, pageToken });
    for (const file of files) {
      if (file.name.startsWith(`${FOLDER}/`)) {
        continue;
      }
      const size = Number(file.metadata.size ?? 0);
      count += 1;
      bytes += size;
      await writeChunk(stream, [file.name, size, file.metadata.contentType ?? "", file.metadata.updated ?? ""].map(csvCell).join(",") + "\n");
    }
    pageToken = (next as { pageToken?: string } | null | undefined)?.pageToken;
  } while (pageToken);

  await finish(stream, done);
  return { count, bytes };
}

async function folderSize(backupId: string): Promise<number> {
  const [files] = await getStorage().bucket().getFiles({ prefix: `${FOLDER}/${backupId}/` });
  return files.reduce((sum, file) => sum + Number(file.metadata.size ?? 0), 0);
}

/** Keeps the newest KEEP_BACKUPS backups; deletes the rest and their files. */
async function pruneOldBackups(): Promise<number> {
  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").offset(KEEP_BACKUPS).limit(50).get();
  for (const document of snapshot.docs) {
    if (document.get("keep") === true) {
      continue;
    }
    await getStorage().bucket().deleteFiles({ prefix: `${FOLDER}/${document.id}/`, force: true });
    await document.ref.delete();
  }
  return snapshot.size;
}

async function createBackupRequest(trigger: BackupTrigger, requestedBy: { uid: string; email: string | null } | null): Promise<string> {
  const db = getFirestore();
  const running = await db.collection(COLLECTION).where("status", "in", ["queued", "running"]).limit(5).get();
  const active = running.docs.filter((document) => {
    const created = (document.get("createdAt") as Timestamp | undefined)?.toMillis() ?? 0;
    return Date.now() - created < STUCK_AFTER_MS;
  });

  if (active.length) {
    if (trigger === "manual") {
      throw new HttpsError("failed-precondition", "A backup is already running. Wait for it to finish, then try again.");
    }
    return active[0].id;
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const ref = db.collection(COLLECTION).doc(`${stamp}-${trigger}`);
  await ref.set({
    status: "queued",
    trigger,
    requestedBy,
    keep: false,
    createdAt: FieldValue.serverTimestamp(),
    firestoreExport: { state: "not-started" },
  });
  return ref.id;
}

// ------------------------------------------------------------
// Functions
// ------------------------------------------------------------

/** Admin → Backups → Back up now. */
export const startPlatformBackup = onCall({ region: REGION }, async (request) => {
  await requirePlatformAdministrator(request);
  const id = await createBackupRequest("manual", { uid: request.auth!.uid, email: (request.auth!.token.email as string | undefined) ?? null });
  return { id };
});

/** Admin → Backups: refreshes the managed export's progress, or keeps / unkeeps a backup. */
export const refreshPlatformBackup = onCall({ region: REGION }, async (request) => {
  await requirePlatformAdministrator(request);
  const data = (request.data ?? {}) as { id?: unknown; keep?: unknown };
  const id = typeof data.id === "string" ? data.id : "";
  if (!/^[0-9A-Za-z-]{1,80}$/.test(id)) {
    throw new HttpsError("invalid-argument", "Choose a backup.");
  }

  const ref = getFirestore().collection(COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "That backup no longer exists.");
  }

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (typeof data.keep === "boolean") {
    update.keep = data.keep;
  }

  const current = (snapshot.get("firestoreExport") ?? { state: "not-started" }) as FirestoreExportState;
  const next = await pollManagedExport(current);
  update.firestoreExport = next;
  if (next.state === "SUCCESSFUL" && current.state !== "SUCCESSFUL") {
    update.totalBytes = await folderSize(id);
  }

  await ref.set(update, { merge: true });
  return { firestoreExport: next };
});

/** Does the work for a new platformBackups document. */
export const runPlatformBackup = onDocumentCreated(
  { region: REGION, document: `${COLLECTION}/{backupId}`, timeoutSeconds: 540, memory: "1GiB", retry: false },
  async (event) => {
    const backupId = event.params.backupId;
    const ref = getFirestore().collection(COLLECTION).doc(backupId);
    const startedAt = Date.now();

    await ref.set({ status: "running", startedAt: FieldValue.serverTimestamp() }, { merge: true });

    const problems: string[] = [];
    const firestoreExport = await startManagedExport(backupId);
    if (firestoreExport.error) {
      problems.push(`Full database export: ${firestoreExport.error}`);
    }
    await ref.set({ firestoreExport }, { merge: true });

    let records = { total: 0, collections: {} as Record<string, number>, complete: false };
    let users = 0;
    let files = { count: 0, bytes: 0 };

    try {
      records = await exportRecords(backupId, startedAt);
      if (!records.complete) {
        problems.push("Readable records: stopped at the time limit, so the file is incomplete. The full database export is still complete.");
      }
    } catch (error) {
      logger.error("Readable records export failed.", { backupId, error: String(error) });
      problems.push(`Readable records: ${String(error).slice(0, 300)}`);
    }

    try {
      users = await exportAuthUsers(backupId);
    } catch (error) {
      logger.error("Sign-in accounts export failed.", { backupId, error: String(error) });
      problems.push(`Sign-in accounts: ${String(error).slice(0, 300)}`);
    }

    try {
      files = await exportFileList(backupId);
    } catch (error) {
      logger.error("File list export failed.", { backupId, error: String(error) });
      problems.push(`File list: ${String(error).slice(0, 300)}`);
    }

    const summary = {
      backupId,
      createdAt: new Date().toISOString(),
      project: projectId(),
      records: { total: records.total, complete: records.complete, collections: records.collections },
      users,
      files,
      firestoreExport: { outputUri: firestoreExport.outputUri, state: firestoreExport.state },
      problems,
    };

    try {
      const { stream, done } = storageUpload(`${FOLDER}/${backupId}/summary.json`, "application/json");
      await writeChunk(stream, JSON.stringify(summary, null, 2));
      await finish(stream, done);
    } catch (error) {
      problems.push(`Summary file: ${String(error).slice(0, 300)}`);
    }

    const allFailed = !records.total && !users && firestoreExport.state === "FAILED";
    await ref.set({
      status: allFailed ? "failed" : (problems.length ? "partial" : "complete"),
      finishedAt: FieldValue.serverTimestamp(),
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      records: summary.records,
      users,
      files,
      problems,
      totalBytes: await folderSize(backupId).catch(() => 0),
    }, { merge: true });

    logger.info("Platform backup finished.", { backupId, records: records.total, users, files: files.count, problems: problems.length });

    await pruneOldBackups().catch((error) => logger.warn("Old backups could not be removed.", { error: String(error) }));
  },
);

/**
 * Every Monday at 3:15 a.m. (New York): a new backup, progress for any
 * managed exports still running, and old backups removed.
 */
export const scheduledPlatformBackup = onSchedule(
  { region: REGION, schedule: "15 3 * * 1", timeZone: "America/New_York", timeoutSeconds: 300 },
  async () => {
    const db = getFirestore();

    const processing = await db.collection(COLLECTION).where("firestoreExport.state", "==", "PROCESSING").limit(10).get();
    for (const document of processing.docs) {
      const next = await pollManagedExport(document.get("firestoreExport") as FirestoreExportState);
      await document.ref.set({ firestoreExport: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    const id = await createBackupRequest("scheduled", null);
    const removed = await pruneOldBackups();
    logger.info("Scheduled platform backup requested.", { id, removed });
  },
);

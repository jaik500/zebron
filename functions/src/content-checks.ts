/* eslint-disable max-len */
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { inBatches, linkStatus } from "./link-check";
import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Content checks for the resource directory (no AI, so almost free):
 *
 * - Broken links: every published resource's website, every topic link
 *   (Admin → Topics) and every bootcamp program's Apply link.
 * - Out of date: published resources never verified, or verified more
 *   than STALE_DAYS ago.
 * - Possible duplicates: published resources with the same name, phone
 *   number or website.
 *
 * Runs every Monday morning and from Admin → AI and content checks
 * ("Run now"). The result is stored in contentChecks/latest (platform
 * admins read it there).
 */

const REGION = "us-central1";
const TIME_ZONE = "America/New_York";
const STALE_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 300;

interface LinkSource {
  url: string;
  /** Where the link is used, e.g. "Resource website" or "Topic: Food". */
  where: string;
  resourceId?: string;
  resourceSlug?: string;
  name: string;
  topicKey?: string;
}

export interface ContentCheckSummary {
  linksChecked: number;
  broken: number;
  blocked: number;
  stale: number;
  duplicates: number;
}

/** Firestore refuses undefined values: drop them. */
const strip = <T extends object>(value: T): T => {
  const clean: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) clean[key] = item;
  }
  return clean as T;
};

const normalizeName = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(-10);
const normalizeSite = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return "";
  }
};

export async function runContentChecks(trigger: "schedule" | "manual", uid = ""): Promise<ContentCheckSummary> {
  const started = Date.now();
  const db = getFirestore();
  const [resourcesSnap, topicsSnap, bootcampsSnap] = await Promise.all([
    db.collection("resources").where("status", "==", "published").get(),
    db.collection("resourceTopics").get(),
    db.collection("bootcamps").get(),
  ]);

  type ResourceData = Record<string, unknown> & { id: string };
  const resources: ResourceData[] = resourcesSnap.docs.map((doc) => ({ ...(doc.data() as Record<string, unknown>), id: doc.id }));
  const nameOf = new Map(resources.map((resource) => [resource.id, String(resource["name"] ?? "Untitled")]));
  const slugOf = new Map(resources.map((resource) => [resource.id, String(resource["slug"] ?? "")]));

  // ---------------- Links ----------------
  const sources: LinkSource[] = [];
  for (const resource of resources) {
    const website = String(resource["website"] ?? "").trim();
    if (website) {
      sources.push({ url: website, where: "Resource website", resourceId: resource.id, resourceSlug: slugOf.get(resource.id), name: nameOf.get(resource.id)! });
    }
  }
  for (const doc of topicsSnap.docs) {
    const topic = doc.data() as { title?: string; active?: boolean; links?: Array<{ label?: string; url?: string }> };
    if (topic.active === false) continue;
    for (const link of topic.links ?? []) {
      if (link.url && /^https?:\/\//i.test(link.url)) {
        sources.push({ url: link.url, where: `Topic: ${topic.title ?? doc.id}`, topicKey: doc.id, name: link.label ?? link.url });
      }
    }
  }
  for (const doc of bootcampsSnap.docs) {
    const programs = (doc.get("programs") as Array<{ title?: string; applyUrl?: string }> | undefined) ?? [];
    for (const program of programs) {
      if (program.applyUrl) {
        sources.push({
          url: program.applyUrl,
          where: `Apply link: ${program.title ?? "program"}`,
          resourceId: doc.id,
          resourceSlug: slugOf.get(doc.id),
          name: nameOf.get(doc.id) ?? "Bootcamp",
        });
      }
    }
  }

  // Each address is opened once, however many places use it.
  const uniqueUrls = [...new Set(sources.map((source) => source.url))];
  const statuses = new Map<string, Awaited<ReturnType<typeof linkStatus>>>();
  await inBatches(uniqueUrls, 8, async (url) => {
    statuses.set(url, await linkStatus(url));
  });

  const broken = sources
    .filter((source) => { const status = statuses.get(source.url); return status && !status.ok && !status.blocked; })
    .map((source) => strip({ ...source, status: statuses.get(source.url)!.status, reason: statuses.get(source.url)!.reason }))
    .slice(0, MAX_ITEMS);
  const blocked = sources
    .filter((source) => statuses.get(source.url)?.blocked)
    .map((source) => strip({ ...source, status: statuses.get(source.url)!.status, reason: statuses.get(source.url)!.reason }))
    .slice(0, MAX_ITEMS);

  // ---------------- Out of date ----------------
  const now = Date.now();
  const stale = resources
    .map((resource) => {
      const verified = resource["lastVerifiedAt"] instanceof Timestamp ? (resource["lastVerifiedAt"] as Timestamp).toMillis() : 0;
      return { resourceId: resource.id, resourceSlug: slugOf.get(resource.id) ?? "", name: nameOf.get(resource.id)!, lastVerifiedAt: verified ? Timestamp.fromMillis(verified) : null, days: verified ? Math.floor((now - verified) / DAY_MS) : null };
    })
    .filter((item) => item.days === null || item.days > STALE_DAYS)
    .sort((a, b) => (b.days ?? 99999) - (a.days ?? 99999))
    .slice(0, MAX_ITEMS);

  // ---------------- Possible duplicates ----------------
  const groups = new Map<string, { kind: string; value: string; ids: Set<string> }>();
  const add = (kind: string, value: string, id: string) => {
    if (!value) return;
    const key = `${kind}:${value}`;
    const group = groups.get(key) ?? { kind, value, ids: new Set<string>() };
    group.ids.add(id);
    groups.set(key, group);
  };
  for (const resource of resources) {
    add("name", normalizeName(String(resource["name"] ?? "")), resource.id);
    const phone = normalizePhone(String(resource["phone"] ?? ""));
    if (phone.length === 10) add("phone", phone, resource.id);
    add("website", normalizeSite(String(resource["website"] ?? "")), resource.id);
  }
  const duplicates = [...groups.values()]
    .filter((group) => group.ids.size > 1)
    .map((group) => ({
      kind: group.kind,
      value: group.value,
      resources: [...group.ids].map((id) => ({ resourceId: id, resourceSlug: slugOf.get(id) ?? "", name: nameOf.get(id) ?? "" })),
    }))
    .slice(0, MAX_ITEMS);

  const summary: ContentCheckSummary = {
    linksChecked: uniqueUrls.length,
    broken: broken.length,
    blocked: blocked.length,
    stale: stale.length,
    duplicates: duplicates.length,
  };

  await db.collection("contentChecks").doc("latest").set({
    ...summary,
    resourcesChecked: resources.length,
    staleDays: STALE_DAYS,
    brokenLinks: broken,
    blockedLinks: blocked,
    staleResources: stale,
    duplicateGroups: duplicates,
    trigger,
    triggeredBy: uid,
    durationMs: Date.now() - started,
    ranAt: FieldValue.serverTimestamp(),
  });

  logger.info("Content checks done", summary);
  return summary;
}

/** Every Monday morning. */
export const weeklyContentChecks = onSchedule(
  { schedule: "every monday 03:20", timeZone: TIME_ZONE, region: REGION, timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    await runContentChecks("schedule");
  },
);

/** Admin → AI and content checks → Run now. */
export const runContentChecksNow = onCall({ region: REGION, timeoutSeconds: 540, memory: "512MiB" }, async (request) => {
  if (!(await isPlatformAdministrator(request))) {
    throw new HttpsError("permission-denied", "Only Zebron administrators can run content checks.");
  }
  return runContentChecks("manual", request.auth?.uid ?? "");
});

/* eslint-disable max-len */
import { DocumentData, QuerySnapshot, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Directory knowledge for the help assistant.
 *
 * Turns Zebron's public, published content into short "sources" the
 * assistant can search and cite: resources, bootcamp programs, open jobs,
 * the topic pages (intros, tips, trusted links) and recent blog posts.
 * Only published content is read, so drafts, pending submissions and
 * private data never reach the model. Loaded at most every few minutes
 * per server instance.
 *
 * Also here: synonyms that widen a search ("food stamps" finds SNAP),
 * crisis detection, and the action cards (Call, Directions, Website,
 * Apply) the chat shows under an answer.
 */

/** Buttons the chat shows for a resource, program or job. */
export interface DirectoryCard {
  type: "resource" | "program" | "job";
  /** Short facts, e.g. "Free", "Online", "Starts Jan 12". */
  badges: string[];
  /** Where it is, as text ("Silver Spring, MD"), when known. */
  place: string;
  phone: string | null;
  website: string | null;
  applyUrl: string | null;
  /** Text to search on a map for directions, when it has a place. */
  mapsQuery: string | null;
}

export interface DirectorySource {
  id: string;
  kind: "resource" | "program" | "job" | "topic" | "blog" | "safety";
  title: string;
  summary: string;
  content: string;
  tags: string[];
  applicationKey: string;
  link: string | null;
  card?: DirectoryCard;
  /** Resource location id, to favour results in the person's area. */
  locationId?: string | null;
  online?: boolean;
}

const CACHE_MS = 5 * 60 * 1000;
const MAX_RESOURCES = 2000;
const MAX_JOBS = 400;
const MAX_POSTS = 60;

let cache: { at: number; sources: DirectorySource[]; locations: Map<string, string> } | null = null;

const text = (value: unknown, max = 4000): string =>
  typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const FIELD_LABELS: Record<string, string> = {
  "software": "Software development",
  "data": "Data and analytics",
  "cybersecurity": "Cybersecurity",
  "cloud": "Cloud and DevOps",
  "it-support": "IT support",
  "ux": "UX and design",
  "product": "Product and project management",
  "servicenow": "ServiceNow",
  "salesforce": "Salesforce",
  "ai": "AI and machine learning",
  "other": "Other",
};

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function clock(value: unknown): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text(value));
  if (!match) return "";
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}${match[2] === "00" ? "" : `:${match[2]}`} ${suffix}`;
}

/** "Open 24/7", "By appointment", or "Mon 9 AM–5 PM; Tue …". */
function hoursOf(availability: DocumentData | undefined): string {
  if (!availability) return "";
  if (availability.alwaysAvailable) return "Open 24/7";
  const days = DAYS.map((day) => {
    const value = availability[day] as DocumentData | undefined;
    if (!value?.open) return null;
    const range = [clock(value.openTime), clock(value.closeTime)].filter(Boolean).join("–");
    return `${day.slice(0, 3)[0].toUpperCase()}${day.slice(1, 3)} ${range || "open"}`;
  }).filter(Boolean);
  const parts = [days.join("; "), availability.byAppointment ? "by appointment" : ""].filter(Boolean);
  return parts.join(", ");
}

function shortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "";
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function website(value: unknown): string | null {
  const url = text(value, 500);
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Public directory content as assistant sources, cached for a few minutes. */
export async function loadDirectory(): Promise<{ sources: DirectorySource[]; locations: Map<string, string> }> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache;
  }

  const db = getFirestore();
  const safe = <T>(promise: Promise<T>, fallback: T, what: string) =>
    promise.catch((error) => {
      logger.warn(`Assistant directory: could not load ${what}.`, { error: String(error) });
      return fallback;
    });

  const empty = { docs: [] } as unknown as QuerySnapshot;

  const [categories, locations, types, topics, resources, bootcamps, jobs, posts] = await Promise.all([
    safe(db.collection("categories").get(), empty, "categories"),
    safe(db.collection("locations").get(), empty, "locations"),
    safe(db.collection("resourceTypes").get(), empty, "resource types"),
    safe(db.collection("resourceTopics").get(), empty, "topics"),
    safe(db.collection("resources").where("status", "==", "published").limit(MAX_RESOURCES).get(), empty, "resources"),
    safe(db.collection("bootcamps").get(), empty, "bootcamps"),
    safe(db.collection("jobs").where("status", "==", "active").limit(MAX_JOBS).get(), empty, "jobs"),
    safe(db.collection("blogPosts").where("section", "==", "public").where("status", "==", "published").orderBy("publishedAt", "desc").limit(MAX_POSTS).get(), empty, "blog posts"),
  ]);

  const categoryNames = new Map(categories.docs.map((item) => [item.id, text(item.data().name, 120)] as [string, string]));
  const typeNames = new Map(types.docs.map((item) => [item.id, text(item.data().name, 120)] as [string, string]));
  const locationNames = new Map(
    locations.docs.map((item) => {
      const data = item.data();
      const label = [text(data.city, 80) || text(data.county, 80), text(data.state, 40)].filter(Boolean).join(", ") || text(data.name, 120);
      return [item.id, label] as [string, string];
    }),
  );
  const locationAddress = new Map(
    locations.docs.map((item) => {
      const data = item.data();
      return [item.id, [text(data.address, 200), text(data.city, 80), text(data.state, 40), text(data.zipCode ?? data.postalCode, 20)].filter(Boolean).join(", ")] as [string, string];
    }),
  );

  const sources: DirectorySource[] = [];

  // ---------------- Resources
  const resourceById = new Map<string, DocumentData>();
  for (const item of resources.docs) {
    const data = item.data();
    resourceById.set(item.id, data);
    const name = text(data.name, 200);
    if (!name) continue;

    const category = categoryNames.get(text(data.categoryId)) ?? "";
    const type = typeNames.get(text(data.resourceType)) ?? "";
    const locationId = text(data.locationId) || null;
    const place = locationId ? locationNames.get(locationId) ?? "" : "";
    const address = locationId ? locationAddress.get(locationId) ?? "" : "";
    const free = data.cost?.free === true;
    const hours = hoursOf(data.availability);
    const badges = [free ? "Free" : "", data.online ? "Online" : "", data.verified ? "Verified" : ""].filter(Boolean);

    sources.push({
      id: `resource:${item.id}`,
      kind: "resource",
      title: name,
      summary: text(data.description, 400),
      content: [
        category && `Category: ${category}.`,
        type && `Type: ${type}.`,
        place ? `Where: ${address || place}.` : data.online ? "Where: online." : "",
        data.online && place ? "Also available online." : "",
        free ? "Cost: free." : text(data.cost?.description, 200) ? `Cost: ${text(data.cost?.description, 200)}.` : "",
        hours && `Hours: ${hours}.`,
        text(data.eventStart) && `Event date: ${shortDate(text(data.eventStart))}.`,
        text(data.phone, 40) && `Phone: ${text(data.phone, 40)}.`,
        data.verified ? "Details checked by the Zebron team." : "",
        text(data.description, 900),
      ].filter(Boolean).join(" "),
      tags: [...(Array.isArray(data.tags) ? data.tags.map((tag: unknown) => text(tag, 60)) : []), category, type].filter(Boolean),
      applicationKey: "resources",
      link: `/resources/${text(data.slug) || item.id}`,
      locationId,
      online: data.online === true,
      card: {
        type: "resource",
        badges,
        place,
        phone: text(data.phone, 40) || null,
        website: website(data.website),
        applyUrl: null,
        mapsQuery: address || (place ? `${name}, ${place}` : null),
      },
    });
  }

  // ---------------- Bootcamp programs (only for published bootcamp listings)
  const today = new Date().toISOString().slice(0, 10);
  for (const item of bootcamps.docs) {
    const listing = resourceById.get(item.id);
    if (!listing) continue;
    const school = text(listing.name, 200);
    const locationId = text(listing.locationId) || null;
    const place = locationId ? locationNames.get(locationId) ?? "" : "";
    const programs = Array.isArray(item.data().programs) ? (item.data().programs as DocumentData[]) : [];

    for (const program of programs) {
      const title = text(program.title, 200);
      if (!title) continue;
      const next = (Array.isArray(program.starts) ? program.starts : [])
        .map((start: DocumentData) => text(start?.date))
        .filter((date: string) => date && date >= today)
        .sort()[0];
      const tuition = typeof program.tuition === "number" ? (program.tuition === 0 ? "Free" : `$${program.tuition.toLocaleString("en-US")}`) : "";
      const field = FIELD_LABELS[text(program.field)] ?? "";

      sources.push({
        id: `program:${item.id}:${text(program.id) || title}`,
        kind: "program",
        title: `${title} (${school})`,
        summary: text(program.summary, 400),
        content: [
          `Bootcamp program at ${school}${place ? `, ${place}` : ""}.`,
          field && `Field: ${field}.`,
          text(program.format) && `Format: ${text(program.format)}.`,
          text(program.schedule) && `Schedule: ${text(program.schedule)}.`,
          typeof program.durationWeeks === "number" && `Length: ${program.durationWeeks} weeks.`,
          tuition && `Tuition: ${tuition}.`,
          Array.isArray(program.financing) && program.financing.length ? `Ways to pay: ${program.financing.join(", ")}.` : "",
          next ? `Next class starts ${shortDate(next)}.` : "",
          Array.isArray(program.certifications) && program.certifications.length ? `Certifications: ${program.certifications.join(", ")}.` : "",
          program.requiresDegree === false ? "No college degree needed." : "",
          text(program.prerequisites, 300) && `Prerequisites: ${text(program.prerequisites, 300)}.`,
          typeof program.placementRate === "number" ? `Graduates hired within 6 months: ${program.placementRate}%.` : "",
          text(program.summary, 600),
        ].filter(Boolean).join(" "),
        tags: ["bootcamp", "training", "course", field, ...(Array.isArray(program.skills) ? program.skills : [])].filter(Boolean),
        applicationKey: "resources",
        link: `/resources/${text(listing.slug) || item.id}`,
        locationId,
        online: text(program.format) === "online",
        card: {
          type: "program",
          badges: [field, tuition === "Free" ? "Free" : "", next ? `Starts ${shortDate(next)}` : ""].filter(Boolean),
          place: text(program.format) === "online" ? "Online" : place,
          phone: text(listing.phone, 40) || null,
          website: website(listing.website),
          applyUrl: website(program.applyUrl),
          mapsQuery: place && text(program.format) !== "online" ? `${school}, ${place}` : null,
        },
      });
    }
  }

  // ---------------- Open jobs
  for (const item of jobs.docs) {
    const data = item.data();
    const title = text(data.title, 200);
    if (!title) continue;
    const place = [text(data.location?.city, 80), text(data.location?.state, 40)].filter(Boolean).join(", ");
    const arrangement = text(data.workArrangement);
    const pay = data.compensation && (typeof data.compensation.min === "number" || typeof data.compensation.max === "number") ?
      `Pay: ${[data.compensation.min, data.compensation.max].filter((value: unknown) => typeof value === "number").map((value: number) => `$${value.toLocaleString("en-US")}`).join("–")}${data.compensation.period === "hour" ? " an hour" : data.compensation.period === "year" ? " a year" : ""}.` :
      "";

    sources.push({
      id: `job:${item.id}`,
      kind: "job",
      title: `${title} at ${text(data.organizationName, 160) || "an employer"}`,
      summary: text(data.description, 300),
      content: [
        `Job opening at ${text(data.organizationName, 160)}.`,
        place && `Location: ${place}.`,
        arrangement && `Work: ${arrangement}.`,
        text(data.employmentType) && `Type: ${text(data.employmentType)}.`,
        pay,
        Array.isArray(data.skills) && data.skills.length ? `Skills: ${data.skills.slice(0, 12).join(", ")}.` : "",
        text(data.description, 800),
      ].filter(Boolean).join(" "),
      tags: ["job", "jobs", "work", "employment", "hiring", text(data.categoryName, 80), ...(Array.isArray(data.skills) ? data.skills.slice(0, 12) : [])].filter(Boolean),
      applicationKey: "jobs",
      link: `/jobs/${item.id}`,
      online: arrangement === "remote",
      card: {
        type: "job",
        badges: [arrangement === "remote" ? "Remote" : arrangement === "hybrid" ? "Hybrid" : "", text(data.employmentType).replace("-", " ")].filter(Boolean),
        place: arrangement === "remote" ? "Remote" : place,
        phone: null,
        website: null,
        applyUrl: website(data.applicationUrl),
        mapsQuery: null,
      },
    });
  }

  // ---------------- Topic pages (intro, tips, trusted links)
  for (const item of topics.docs) {
    const data = item.data();
    if (data.active === false) continue;
    const title = text(data.title, 120);
    const tips = Array.isArray(data.tips) ? data.tips.map((tip: unknown) => text(tip, 300)).filter(Boolean) : [];
    const links = Array.isArray(data.links) ? data.links.map((link: DocumentData) => [text(link?.label, 120), text(link?.url, 300)].filter(Boolean).join(": ")).filter(Boolean) : [];
    if (!title || (!text(data.intro) && !tips.length && !links.length)) continue;

    sources.push({
      id: `topic:${item.id}`,
      kind: "topic",
      title: `${title} help`,
      summary: text(data.text, 200),
      content: [text(data.intro, 1500), tips.length ? `Tips: ${tips.join(" ")}` : "", links.length ? `Trusted links: ${links.join("; ")}.` : ""].filter(Boolean).join(" "),
      tags: [...(Array.isArray(data.keywords) ? data.keywords : []), title].filter(Boolean),
      applicationKey: "resources",
      link: text(data.route) || `/resources?topic=${encodeURIComponent(item.id)}`,
    });
  }

  // ---------------- Recent public blog posts
  for (const item of posts.docs) {
    const data = item.data();
    const title = text(data.title, 200);
    if (!title) continue;
    const body = text(String(data.content ?? "").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/[#*`>|]/g, " "), 2500);

    sources.push({
      id: `blog:${item.id}`,
      kind: "blog",
      title,
      summary: text(data.excerpt, 300),
      content: body,
      tags: [text(data.topic, 60), "blog", "article"].filter(Boolean),
      applicationKey: "platform",
      link: `/blog/${item.id}`,
    });
  }

  cache = { at: Date.now(), sources, locations: locationNames };
  return cache;
}

// ============================================================
// SYNONYMS (widen the search with everyday words)
// ============================================================

const SYNONYMS: Array<[RegExp, string]> = [
  [/\bfood stamps?\b|\bebt\b/i, "snap food benefits groceries"],
  [/\bhungry|no food|groceries|meal/i, "food pantry meals snap"],
  [/\brent\b|evict|landlord|behind on rent/i, "rental assistance housing eviction tenant legal"],
  [/\bhomeless|shelter|nowhere to sleep/i, "shelter housing emergency homeless"],
  [/\bjobs?\b|find work|looking for work|hiring|unemploy|laid off/i, "jobs employment career training unemployment"],
  [/\bbootcamp|coding|tech career|learn to code/i, "bootcamp training program software cybersecurity"],
  [/\bgreen card|visa|daca|tps|asylum|citizenship|immigra/i, "immigration legal help lawyer accredited"],
  [/\blawyer|attorney|legal aid|court\b/i, "legal help lawyer free"],
  [/\bdoctor|clinic|sick|medical|insurance|medicaid/i, "health clinic medicaid insurance free clinic"],
  [/\bdepress|anxiety|therap|counsel|mental/i, "mental health counseling therapy support"],
  [/\bbills?\b|electric|utility|gas bill|water bill/i, "utilities bill assistance energy"],
  [/\bged\b|english class|esl|school|college|fafsa|pell/i, "education adult education ged english classes financial aid"],
  [/\bchild ?care|daycare|kids|children/i, "families child care youth"],
  [/\bsenior|elderly|older adult/i, "older adults seniors aging"],
  [/\bbus\b|metro|ride|transport|car repair/i, "transportation rides transit"],
  [/\bloan|business|start a company|small business/i, "business small business loans grants"],
  [/\bscam|notario|fraud/i, "fraud scam report legal help"],
  // French
  [/\baide alimentaire|nourriture|faim\b/i, "food pantry snap"],
  [/\blogement|loyer|expulsion/i, "housing rental assistance eviction"],
  [/\bemploi|travail|chômage/i, "jobs employment training"],
  [/\bimmigration|avocat|asile/i, "immigration legal help lawyer"],
];

/** Adds everyday-word synonyms to a search ("food stamps" also finds SNAP). */
export function expandQuery(query: string): string {
  const extra = SYNONYMS.filter(([pattern]) => pattern.test(query)).map(([, words]) => words);
  return extra.length ? `${query} ${extra.join(" ")}` : query;
}

// ============================================================
// SAFETY (always first when someone may be in danger)
// ============================================================

const CRISIS = /\b(suicid|kill (my|him|her)self|want to die|end my life|self[- ]harm|overdos|being abused|abuse[sd]? me|hits? me|domestic violence|in danger|not safe at home|no food (tonight|today)|nowhere to (sleep|stay) tonight|evicted today|sleeping outside)\b/i;
const CRISIS_FR = /\b(suicid|me tuer|en danger|violence conjugale|me frappe|pas de nourriture ce soir|dormir dehors)\b/i;

export function isCrisis(question: string): boolean {
  return CRISIS.test(question) || CRISIS_FR.test(question);
}

export const SAFETY_SOURCE: DirectorySource = {
  id: "guide:urgent-help",
  kind: "safety",
  title: "Urgent help, any time",
  summary: "In an emergency call 911. For a mental health or suicide crisis call or text 988.",
  content:
    "If you or someone else is in immediate danger, call 911. " +
    "For a suicide or mental health crisis, call or text 988 (988 Suicide and Crisis Lifeline), free and open 24 hours a day. " +
    "For domestic violence, call the National Domestic Violence Hotline at 1-800-799-7233 or text START to 88788. " +
    "For food, shelter or other urgent needs today, dial 211 to reach a local helpline, or use the Crisis and Housing topics on Zebron (/resources).",
  tags: ["emergency", "crisis", "988", "911", "danger", "suicide", "abuse", "shelter", "urgent"],
  applicationKey: "platform",
  link: "/resources?topic=crisis",
};

/* eslint-disable max-len */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";

import { getHelpAssistantSettings } from "./help-assistant-settings";
import { isPlatformAdministrator } from "./platform-admin-authorization";
import { linkStatus } from "./link-check";

/**
 * Zebron AI engine: one place where every application asks AI for help.
 *
 *   aiAssist({ app, task, input })   one callable for every task
 *
 * - Tasks are listed in TASKS below (draft-topic, improve, summarize,
 *   classify-resource). Each says which apps may use it and how its answer
 *   is checked; add new tasks there.
 * - Settings: aiEngineConfig/settings (Admin → AI and content checks):
 *   on/off, a monthly call limit, a daily limit per person, an optional
 *   model, and optional prices per million tokens for cost estimates.
 * - Every call is logged (aiUsageLog) and counted per month
 *   (aiUsage/{yyyy-mm}: calls, tokens and estimated cost by app and task).
 * - Only platform administrators can use it for now; organization roles
 *   can be added per task later.
 * - Nothing is saved or published here: callers review the result first.
 * - Only the content being worked on is sent to the model, never people's
 *   personal details.
 *
 * Uses the help assistant's Gemini key (GEMINI_API_KEY) and, unless the
 * settings name another, its model.
 */

const REGION = "us-central1";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_PATTERN = /^gemini-[a-z0-9.-]{1,60}$/;

// ============================================================
// Settings
// ============================================================

export interface AiEngineSettings {
  enabled: boolean;
  /** Calls per calendar month for the whole platform. */
  monthlyCallLimit: number;
  /** Calls per person per day. */
  userDailyLimit: number;
  /** '' = the help assistant's model. */
  model: string;
  /** USD per million tokens, for estimates only (0 = not set). */
  inputCostPerMillion: number;
  outputCostPerMillion: number;
}

const DEFAULTS: AiEngineSettings = {
  enabled: true,
  monthlyCallLimit: 2000,
  userDailyLimit: 100,
  model: "",
  inputCostPerMillion: 0,
  outputCostPerMillion: 0,
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, typeof value === "number" && Number.isFinite(value) ? value : fallback));

export async function getAiEngineSettings(): Promise<AiEngineSettings> {
  try {
    const snapshot = await getFirestore().collection("aiEngineConfig").doc("settings").get();
    const data = (snapshot.data() ?? {}) as Record<string, unknown>;
    const model = typeof data.model === "string" ? data.model.trim().toLowerCase() : "";
    return {
      enabled: typeof data.enabled === "boolean" ? data.enabled : DEFAULTS.enabled,
      monthlyCallLimit: Math.round(clampNumber(data.monthlyCallLimit, 0, 1_000_000, DEFAULTS.monthlyCallLimit)),
      userDailyLimit: Math.round(clampNumber(data.userDailyLimit, 0, 10_000, DEFAULTS.userDailyLimit)),
      model: MODEL_PATTERN.test(model) ? model : "",
      inputCostPerMillion: clampNumber(data.inputCostPerMillion, 0, 1000, 0),
      outputCostPerMillion: clampNumber(data.outputCostPerMillion, 0, 1000, 0),
    };
  } catch (error) {
    logger.warn("AI engine settings unavailable; using defaults", error);
    return DEFAULTS;
  }
}

// ============================================================
// Tasks
// ============================================================

interface ModelRequest {
  system: string;
  prompt: string;
  json: boolean;
  maxTokens: number;
  /** Let the model search Google while answering (billed separately by Google). */
  search?: boolean;
}

/** Web pages the model used when it searched. */
interface ModelExtras {
  sources: Array<{ uri: string; title: string }>;
}

interface TaskDefinition {
  /** Apps that may use the task ("*" = any). */
  apps: string[] | "*";
  build(input: Record<string, unknown>): ModelRequest;
  /** Checks and shapes the model's answer. */
  parse(text: string, input: Record<string, unknown>, extras: ModelExtras): Promise<unknown>;
}

const clip = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");

const STYLE =
  "Write in plain English at about a 6th-grade reading level, warm and respectful, no jargon. Zebron is a free platform that helps " +
  "newcomers, immigrants, job seekers and families find everyday help, jobs and learning.";

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Answers written with web search may wrap the JSON in a sentence.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // fall through
      }
    }
    throw new HttpsError("internal", "The AI reply could not be read. Try again.");
  }
}

const MAX_LINKS = 8;
const MAX_FINDINGS = 10;

const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
const hostOf = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

export const TASKS: Record<string, TaskDefinition> = {
  /** Introduction, tips and helpful links for a "Search by Category" topic. */
  "draft-topic": {
    apps: ["resources"],
    build(input) {
      const title = clip(input.title, 80);
      if (!title) throw new HttpsError("invalid-argument", "Give the topic a title first.");
      const area = clip(input.area, 120) || "Maryland, Washington DC and Virginia";
      const keywords = Array.isArray(input.keywords) ? input.keywords.filter((word): word is string => typeof word === "string").slice(0, 20).join(", ") : "";
      const intro = clip(input.intro, 1500);
      return {
        json: true,
        maxTokens: 1500,
        system:
          `You write short, practical help content for Zebron's resource directory. ${STYLE} ` +
          `Focus on ${area}, plus national programs that work there. ` +
          "Only include official or well-established organizations (government .gov sites, 211, major nonprofits). " +
          "Only give links you are confident exist; prefer an organization's home page over deep links. Phone numbers use tel: links. " +
          "Never invent programs, phone numbers or eligibility rules. Never give legal or medical advice beyond pointing to help. " +
          "Reply with JSON only: {\"intro\": string (2 to 3 sentences, under 450 characters), " +
          "\"tips\": string[] (3 to 5 tips, each under 140 characters), " +
          `"links": [{"label": string (under 50 characters), "url": string}] (3 to ${MAX_LINKS} links)}.`,
        prompt:
          `Topic: ${title}\n` +
          (clip(input.text, 200) ? `What it covers: ${clip(input.text, 200)}\n` : "") +
          (keywords ? `Keywords: ${keywords}\n` : "") +
          (intro ? `Current introduction (improve it, keep facts): ${intro}\n` : ""),
      };
    },
    async parse(text) {
      const parsed = parseJson(text);
      const tips = Array.isArray(parsed.tips) ?
        parsed.tips.filter((tip): tip is string => typeof tip === "string" && !!tip.trim()).map((tip) => tip.trim().slice(0, 200)).slice(0, 6) :
        [];
      const seen = new Set<string>();
      const links: Array<{ label: string; url: string }> = [];
      for (const item of Array.isArray(parsed.links) ? parsed.links : []) {
        const link = item as { label?: unknown; url?: unknown };
        const label = clip(link.label, 60);
        const url = clip(link.url, 300);
        if (!label || !/^(https:\/\/|tel:)/i.test(url) || seen.has(url.toLowerCase())) continue;
        seen.add(url.toLowerCase());
        links.push({ label, url });
        if (links.length >= MAX_LINKS) break;
      }
      // Open every link once: those that are gone or don't exist are flagged for the admin
      // (sites that refuse automatic checks are not, since they usually work in a browser).
      const checked = await Promise.all(
        links.map(async (link) => {
          if (link.url.startsWith("tel:")) return { ...link, checked: true };
          const status = await linkStatus(link.url);
          return { ...link, checked: status.ok || status.blocked };
        }),
      );
      return { intro: clip(parsed.intro, 1500), tips, links: checked };
    },
  },

  /**
   * Finds organizations and programs on the web for the resource directory.
   * Every proposal needs a real website; websites are opened once, possible
   * duplicates of existing listings are flagged, and nothing is saved here
   * (the admin adds the ones they want as Pending).
   */
  "find-resources": {
    apps: ["resources"],
    build(input) {
      const request = clip(input.query, 300);
      if (!request) throw new HttpsError("invalid-argument", "Describe what to look for.");
      const area = clip(input.area, 120) || "Maryland, Washington DC and Virginia";
      const categories = Array.isArray(input.categories) ?
        (input.categories as Array<{ id?: unknown; name?: unknown }>).map((category) => `${clip(category.id, 60)}: ${clip(category.name, 80)}`).slice(0, 60) :
        [];
      const count = Math.round(clampNumber(input.count, 1, MAX_FINDINGS, 6));
      return {
        json: true,
        search: true,
        maxTokens: 4000,
        system:
          "You find real community resources for Zebron, a free directory for newcomers, immigrants, job seekers and families. " +
          `Search the web and only include organizations or programs you found on their own official website, serving ${area}. ` +
          "Prefer government agencies, community colleges, libraries and established nonprofits. Never invent names, phone numbers, addresses or links. " +
          "Leave a field empty when you are not sure. Descriptions: 2 or 3 plain sentences saying what is offered, who it is for and the cost, without marketing words. " +
          `Reply with JSON only (no other text): {"resources": [{"name": string, "description": string, "website": string (https, official site), ` +
          "\"phone\": string, \"email\": string, \"address\": string, \"city\": string, \"state\": string (2 letters), \"online\": boolean, " +
          "\"free\": boolean, \"costDescription\": string, \"categoryId\": string (one id from the list, or empty), \"tags\": string[] (3 to 6 lowercase), " +
          `"sourceUrl": string (the page where you found it)}]}, at most ${count} resources.`,
        prompt: `Find: ${request}\nArea: ${area}\n` + (categories.length ? `Categories (id: name):\n${categories.join("\n")}\n` : ""),
      };
    },
    async parse(text, input, extras) {
      const parsed = parseJson(text);
      const categoryIds = new Set(
        (Array.isArray(input.categories) ? (input.categories as Array<{ id?: unknown }>) : []).map((category) => clip(category.id, 60)),
      );
      const existing = (Array.isArray(input.existing) ? (input.existing as Array<{ name?: unknown; website?: unknown }>) : []).map((item) => ({
        name: clip(item.name, 160),
        key: normalize(clip(item.name, 160)),
        host: hostOf(clip(item.website, 300)),
      }));
      const seen = new Set<string>();
      const findings: Array<Record<string, unknown>> = [];
      for (const item of Array.isArray(parsed.resources) ? (parsed.resources as Array<Record<string, unknown>>) : []) {
        const name = clip(item.name, 160);
        const website = clip(item.website, 300);
        if (!name || !/^https:\/\//i.test(website)) continue;
        const key = normalize(name);
        if (seen.has(key)) continue;
        seen.add(key);
        const host = hostOf(website);
        const duplicate = existing.find((listing) => listing.key === key || (!!host && listing.host === host));
        const categoryId = clip(item.categoryId, 60);
        const sourceUrl = clip(item.sourceUrl, 400);
        findings.push({
          name,
          description: clip(item.description, 1200),
          website,
          phone: clip(item.phone, 40),
          email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clip(item.email, 120)) ? clip(item.email, 120) : "",
          address: clip(item.address, 200),
          city: clip(item.city, 80),
          state: clip(item.state, 2).toUpperCase(),
          online: item.online === true,
          free: item.free === true,
          costDescription: clip(item.costDescription, 200),
          categoryId: categoryIds.has(categoryId) ? categoryId : "",
          tags: Array.isArray(item.tags) ?
            item.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 8) :
            [],
          sourceUrl: /^https:\/\//i.test(sourceUrl) ? sourceUrl : website,
          duplicateOf: duplicate?.name ?? "",
        });
        if (findings.length >= MAX_FINDINGS) break;
      }
      // Open every website once.
      const checked = await Promise.all(
        findings.map(async (finding) => {
          const status = await linkStatus(String(finding.website));
          return { ...finding, websiteStatus: status.ok ? "ok" : status.blocked ? "unchecked" : "broken", websiteNote: status.reason };
        }),
      );
      return { resources: checked, searchedPages: extras.sources.slice(0, 12) };
    },
  },

  /** Rewrites text more clearly without adding facts. */
  "improve": {
    apps: "*",
    build(input) {
      const text = clip(input.text, 6000);
      if (!text) throw new HttpsError("invalid-argument", "There is no text to improve.");
      const purpose = clip(input.purpose, 120);
      return {
        json: true,
        maxTokens: 2500,
        system:
          `You edit text for Zebron. ${STYLE} Fix spelling and grammar, make it clearer and shorter where possible. ` +
          "Keep every fact, name, number, date and link exactly as given; never add new facts. Keep the same language. " +
          "Reply with JSON only: {\"text\": string}.",
        prompt: (purpose ? `This text is: ${purpose}\n\n` : "") + text,
      };
    },
    async parse(text) {
      const parsed = parseJson(text);
      const improved = clip(parsed.text, 8000);
      if (!improved) throw new HttpsError("internal", "The AI returned no text. Try again.");
      return { text: improved };
    },
  },

  /** A short summary of a longer text. */
  "summarize": {
    apps: "*",
    build(input) {
      const text = clip(input.text, 12000);
      if (!text) throw new HttpsError("invalid-argument", "There is no text to summarize.");
      const words = Math.round(clampNumber(input.maxWords, 20, 300, 60));
      return {
        json: true,
        maxTokens: 800,
        system: `You summarize text for Zebron. ${STYLE} Use only facts in the text. Reply with JSON only: {"text": string} in at most ${words} words.`,
        prompt: text,
      };
    },
    async parse(text) {
      const parsed = parseJson(text);
      return { text: clip(parsed.text, 3000) };
    },
  },

  /** Suggests the topic and tags of a resource listing. */
  "classify-resource": {
    apps: ["resources"],
    build(input) {
      const name = clip(input.name, 160);
      const description = clip(input.description, 3000);
      const topics = Array.isArray(input.topics) ?
        (input.topics as Array<{ key?: unknown; title?: unknown }>).map((topic) => `${clip(topic.key, 40)}: ${clip(topic.title, 80)}`).filter((line) => !line.startsWith(":")).slice(0, 40) :
        [];
      if (!name || !topics.length) throw new HttpsError("invalid-argument", "A name and the list of topics are needed.");
      return {
        json: true,
        maxTokens: 300,
        system:
          "You sort community resources into topics. Pick exactly one topic key from the list, and 3 to 6 short lowercase tags people would search for. " +
          "Reply with JSON only: {\"topicKey\": string, \"tags\": string[]}.",
        prompt: `Topics:\n${topics.join("\n")}\n\nResource: ${name}\n${description}`,
      };
    },
    async parse(text, input) {
      const parsed = parseJson(text);
      const keys = new Set(
        (Array.isArray(input.topics) ? (input.topics as Array<{ key?: unknown }>) : []).map((topic) => clip(topic.key, 40)),
      );
      const topicKey = clip(parsed.topicKey, 40);
      const tags = Array.isArray(parsed.tags) ?
        parsed.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim().toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 8) :
        [];
      return { topicKey: keys.has(topicKey) ? topicKey : "", tags };
    },
  },
};

// ============================================================
// Engine
// ============================================================

const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);
const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

/** Runs one task for the caller, within the limits, and records the usage. */
export async function runTask(request: CallableRequest<unknown>, app: string, taskName: string, input: Record<string, unknown>): Promise<unknown> {
  if (!(await isPlatformAdministrator(request))) {
    throw new HttpsError("permission-denied", "Only Zebron administrators can use AI tools for now.");
  }
  const uid = request.auth!.uid;
  const task = TASKS[taskName];
  if (!task) throw new HttpsError("invalid-argument", `Unknown AI task "${taskName}".`);
  if (task.apps !== "*" && !task.apps.includes(app)) {
    throw new HttpsError("invalid-argument", `The task "${taskName}" is not available in ${app || "this app"}.`);
  }

  const settings = await getAiEngineSettings();
  if (!settings.enabled) throw new HttpsError("failed-precondition", "AI tools are turned off (Admin → AI and content checks).");

  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) throw new HttpsError("failed-precondition", "The AI key is not set up (GEMINI_API_KEY).");

  const db = getFirestore();
  const month = monthKey();
  const monthRef = db.collection("aiUsage").doc(month);
  const dailyRef = db.collection("aiUsageDaily").doc(`${dayKey()}_${uid}`);
  const [monthSnap, dailySnap] = await Promise.all([monthRef.get(), dailyRef.get()]);
  if (settings.monthlyCallLimit && ((monthSnap.get("calls") as number | undefined) ?? 0) >= settings.monthlyCallLimit) {
    throw new HttpsError("resource-exhausted", "This month's AI limit is reached. An administrator can raise it in Admin → AI and content checks.");
  }
  if (settings.userDailyLimit && ((dailySnap.get("calls") as number | undefined) ?? 0) >= settings.userDailyLimit) {
    throw new HttpsError("resource-exhausted", "You reached today's AI limit. Try again tomorrow.");
  }

  const model = settings.model || (await getHelpAssistantSettings()).model;
  const modelRequest = task.build(input);
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let ok = false;
  let errorCode = "";

  try {
    const response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: modelRequest.system }] },
        contents: [{ role: "user", parts: [{ text: modelRequest.prompt }] }],
        // Web search and a JSON-only reply can't be combined: search answers are parsed from text.
        ...(modelRequest.search ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          temperature: 0.3,
          ...(modelRequest.json && !modelRequest.search ? { responseMimeType: "application/json" } : {}),
          // Larger models spend part of the budget on "thinking" first.
          maxOutputTokens: modelRequest.maxTokens + (model.includes("lite") ? 1024 : 2048),
        },
      }),
      signal: AbortSignal.timeout(modelRequest.search ? 120_000 : 45_000),
    });
    if (!response.ok) throw new Error(`Gemini returned HTTP ${response.status}`);
    const result = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
      }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
    };
    inputTokens = result.usageMetadata?.promptTokenCount ?? 0;
    outputTokens = (result.usageMetadata?.candidatesTokenCount ?? 0) + (result.usageMetadata?.thoughtsTokenCount ?? 0);
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!text) throw new Error("Gemini returned no text");
    const sources = (result.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [])
      .map((chunk) => ({ uri: chunk.web?.uri ?? "", title: chunk.web?.title ?? "" }))
      .filter((source) => source.uri);
    const answer = await task.parse(text, input, { sources });
    ok = true;
    return answer;
  } catch (error) {
    errorCode = error instanceof HttpsError ? error.code : "unavailable";
    logger.error("AI task failed", { app, task: taskName, error: error instanceof Error ? error.message : String(error) });
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unavailable", "The AI could not finish this right now. Try again in a minute.");
  } finally {
    const cost =
      (inputTokens * settings.inputCostPerMillion + outputTokens * settings.outputCostPerMillion) / 1_000_000;
    const increments = {
      calls: FieldValue.increment(1),
      failures: FieldValue.increment(ok ? 0 : 1),
      inputTokens: FieldValue.increment(inputTokens),
      outputTokens: FieldValue.increment(outputTokens),
      estimatedCost: FieldValue.increment(cost),
    };
    try {
      await Promise.all([
        monthRef.set(
          {
            month,
            ...increments,
            apps: { [app || "other"]: { calls: FieldValue.increment(1), estimatedCost: FieldValue.increment(cost) } },
            tasks: { [taskName]: { calls: FieldValue.increment(1), estimatedCost: FieldValue.increment(cost) } },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        dailyRef.set({ uid, day: dayKey(), calls: FieldValue.increment(1) }, { merge: true }),
        db.collection("aiUsageLog").add({
          uid,
          app: app || "other",
          task: taskName,
          model,
          ok,
          errorCode,
          inputTokens,
          outputTokens,
          estimatedCost: cost,
          ms: Date.now() - started,
          at: FieldValue.serverTimestamp(),
        }),
      ]);
    } catch (error) {
      logger.warn("Could not record AI usage", error);
    }
  }
}

/** aiAssist({ app, task, input }): every app's way to ask AI for help. */
export const aiAssist = onCall({ region: REGION, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 240 }, async (request) => {
  const data = (request.data ?? {}) as { app?: unknown; task?: unknown; input?: unknown };
  const input = data.input && typeof data.input === "object" ? (data.input as Record<string, unknown>) : {};
  return runTask(request, clip(data.app, 40), clip(data.task, 60), input);
});

/** Admin → Topics → Draft with AI (kept for the current admin page). */
export const draftTopicContent = onCall({ region: REGION, secrets: ["GEMINI_API_KEY"], timeoutSeconds: 90 }, async (request) => {
  const input = (request.data && typeof request.data === "object" ? request.data : {}) as Record<string, unknown>;
  return runTask(request, "resources", "draft-topic", input);
});

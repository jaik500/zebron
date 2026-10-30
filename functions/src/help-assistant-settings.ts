/* eslint-disable max-len */
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Help assistant settings, edited by platform administrators on
 * Admin → Configuration → Help assistant and stored in
 * platformConfig/helpAssistant. Mirrors
 * src/app/core/models/help-assistant-settings.model.ts; every value is
 * clamped here as well, so a bad document can't raise costs or limits.
 */

export interface HelpAssistantSettings {
  enabled: boolean;
  aiEnabled: boolean;
  model: string;
  hourlyLimit: number;
  maxSources: number;
  maxAnswerWords: number;
  extraInstructions: string;
  sources: {
    platformArticles: boolean;
    organizationArticles: boolean;
    builtInGuides: boolean;
  };
}

export const DEFAULT_SETTINGS: HelpAssistantSettings = {
  enabled: true,
  aiEnabled: true,
  model: "gemini-2.5-flash-lite",
  hourlyLimit: 40,
  maxSources: 5,
  maxAnswerWords: 180,
  extraInstructions: "",
  sources: { platformArticles: true, organizationArticles: true, builtInGuides: true },
};

const MODEL_PATTERN = /^gemini-[a-z0-9.-]{1,60}$/;
const CACHE_MS = 60 * 1000;

let cached: { at: number; settings: HelpAssistantSettings } | null = null;

const clampInt = (value: unknown, min: number, max: number, fallback: number) =>
  Math.min(max, Math.max(min, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback));

const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

export function normalizeSettings(raw: unknown): HelpAssistantSettings {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sources = (data.sources && typeof data.sources === "object" ? data.sources : {}) as Record<string, unknown>;
  const model = typeof data.model === "string" ? data.model.trim().toLowerCase() : "";
  const defaults = DEFAULT_SETTINGS;

  return {
    enabled: flag(data.enabled, defaults.enabled),
    aiEnabled: flag(data.aiEnabled, defaults.aiEnabled),
    model: MODEL_PATTERN.test(model) ? model : defaults.model,
    hourlyLimit: clampInt(data.hourlyLimit, 1, 1000, defaults.hourlyLimit),
    maxSources: clampInt(data.maxSources, 1, 10, defaults.maxSources),
    maxAnswerWords: clampInt(data.maxAnswerWords, 50, 500, defaults.maxAnswerWords),
    extraInstructions: typeof data.extraInstructions === "string" ? data.extraInstructions.trim().slice(0, 2000) : "",
    sources: {
      platformArticles: flag(sources.platformArticles, defaults.sources.platformArticles),
      organizationArticles: flag(sources.organizationArticles, defaults.sources.organizationArticles),
      builtInGuides: flag(sources.builtInGuides, defaults.sources.builtInGuides),
    },
  };
}

/** Current settings, cached for a minute per instance. Falls back to defaults. */
export async function getHelpAssistantSettings(): Promise<HelpAssistantSettings> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.settings;
  }

  let settings = DEFAULT_SETTINGS;

  try {
    const snapshot = await getFirestore().collection("platformConfig").doc("helpAssistant").get();
    settings = normalizeSettings(snapshot.exists ? snapshot.data() : {});
  } catch (error) {
    logger.warn("Help assistant settings could not be read; using defaults.", { error: String(error) });
  }

  cached = { at: Date.now(), settings };
  return settings;
}

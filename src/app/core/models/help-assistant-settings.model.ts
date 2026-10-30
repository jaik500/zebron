/**
 * Settings for the "Ask for help" assistant, stored in
 * platformConfig/helpAssistant. Edited on Admin → Configuration → Help
 * assistant and read by the askSupportAssistant function (which applies
 * the same limits) and by the assistant widget.
 *
 * The Gemini API key is never stored here; it stays a Functions secret.
 */

export interface HelpAssistantSources {
  /** Published Zebron Knowledge Center articles. */
  platformArticles: boolean;
  /** Published articles from the person's organization. */
  organizationArticles: boolean;
  /** Built-in partner portal how-to guides. */
  builtInGuides: boolean;
}

export interface HelpAssistantSettings {
  enabled: boolean;
  aiEnabled: boolean;
  model: string;
  hourlyLimit: number;
  maxSources: number;
  maxAnswerWords: number;
  assistantName: string;
  welcomeMessage: string;
  suggestions: string[];
  extraInstructions: string;
  sources: HelpAssistantSources;
  updatedAt?: string;
  updatedBy?: string;
}

export const HELP_ASSISTANT_SETTINGS_PATH = { collection: 'platformConfig', id: 'helpAssistant' } as const;

export const HELP_ASSISTANT_MODELS: ReadonlyArray<{ id: string; label: string; description: string }> = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', description: 'Fastest and cheapest. Good for short how-to answers.' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Better reasoning; a little slower and costs more.' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most capable; slowest and most expensive, small free quota.' },
];

export const HELP_ASSISTANT_LIMITS = {
  hourlyLimit: { min: 1, max: 1000 },
  maxSources: { min: 1, max: 10 },
  maxAnswerWords: { min: 50, max: 500 },
  assistantName: 60,
  welcomeMessage: 500,
  suggestion: 80,
  suggestions: 6,
  extraInstructions: 2000,
} as const;

export const MODEL_PATTERN = /^gemini-[a-z0-9.-]{1,60}$/;

export const DEFAULT_HELP_ASSISTANT_SETTINGS: HelpAssistantSettings = {
  enabled: true,
  aiEnabled: true,
  model: 'gemini-2.5-flash-lite',
  hourlyLimit: 40,
  maxSources: 5,
  maxAnswerWords: 180,
  assistantName: 'Zebron Assistant',
  welcomeMessage: '',
  suggestions: [
    'What can my role do?',
    'How do I invite someone?',
    'How do I import questions?',
    'How do I contact Zebron support?',
  ],
  extraInstructions: '',
  sources: { platformArticles: true, organizationArticles: true, builtInGuides: true },
};

function clampInt(value: unknown, range: { min: number; max: number }, fallback: number): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.min(range.max, Math.max(range.min, number));
}

function text(value: unknown, max: number, fallback: string): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Fill in defaults and clamp every value to its allowed range. */
export function normalizeHelpAssistantSettings(raw: unknown): HelpAssistantSettings {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const defaults = DEFAULT_HELP_ASSISTANT_SETTINGS;
  const sources = (data['sources'] && typeof data['sources'] === 'object' ? data['sources'] : {}) as Record<string, unknown>;
  const model = text(data['model'], 64, defaults.model).toLowerCase();

  const suggestions = Array.isArray(data['suggestions'])
    ? data['suggestions']
        .map((item) => text(item, HELP_ASSISTANT_LIMITS.suggestion, ''))
        .filter(Boolean)
        .slice(0, HELP_ASSISTANT_LIMITS.suggestions)
    : defaults.suggestions;

  const settings: HelpAssistantSettings = {
    enabled: flag(data['enabled'], defaults.enabled),
    aiEnabled: flag(data['aiEnabled'], defaults.aiEnabled),
    model: MODEL_PATTERN.test(model) ? model : defaults.model,
    hourlyLimit: clampInt(data['hourlyLimit'], HELP_ASSISTANT_LIMITS.hourlyLimit, defaults.hourlyLimit),
    maxSources: clampInt(data['maxSources'], HELP_ASSISTANT_LIMITS.maxSources, defaults.maxSources),
    maxAnswerWords: clampInt(data['maxAnswerWords'], HELP_ASSISTANT_LIMITS.maxAnswerWords, defaults.maxAnswerWords),
    assistantName: text(data['assistantName'], HELP_ASSISTANT_LIMITS.assistantName, defaults.assistantName) || defaults.assistantName,
    welcomeMessage: text(data['welcomeMessage'], HELP_ASSISTANT_LIMITS.welcomeMessage, defaults.welcomeMessage),
    suggestions,
    extraInstructions: text(data['extraInstructions'], HELP_ASSISTANT_LIMITS.extraInstructions, defaults.extraInstructions),
    sources: {
      platformArticles: flag(sources['platformArticles'], defaults.sources.platformArticles),
      organizationArticles: flag(sources['organizationArticles'], defaults.sources.organizationArticles),
      builtInGuides: flag(sources['builtInGuides'], defaults.sources.builtInGuides),
    },
  };

  if (typeof data['updatedAt'] === 'string') settings.updatedAt = data['updatedAt'];
  if (typeof data['updatedBy'] === 'string') settings.updatedBy = data['updatedBy'];

  return settings;
}

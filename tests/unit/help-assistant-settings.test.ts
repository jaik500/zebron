import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HELP_ASSISTANT_SETTINGS,
  normalizeHelpAssistantSettings,
} from '../../src/app/core/models/help-assistant-settings.model';

describe('normalizeHelpAssistantSettings', () => {
  it('returns the defaults for an empty or missing document', () => {
    expect(normalizeHelpAssistantSettings(undefined)).toEqual(DEFAULT_HELP_ASSISTANT_SETTINGS);
    expect(normalizeHelpAssistantSettings({})).toEqual(DEFAULT_HELP_ASSISTANT_SETTINGS);
  });

  it('clamps numbers and rejects bad models', () => {
    const settings = normalizeHelpAssistantSettings({ hourlyLimit: 99999, maxSources: 0, maxAnswerWords: 12.7, model: 'GPT-4' });
    expect(settings.hourlyLimit).toBe(1000);
    expect(settings.maxSources).toBe(1);
    expect(settings.maxAnswerWords).toBe(50);
    expect(settings.model).toBe(DEFAULT_HELP_ASSISTANT_SETTINGS.model);
    expect(normalizeHelpAssistantSettings({ model: ' Gemini-2.5-Pro ' }).model).toBe('gemini-2.5-pro');
  });

  it('keeps chosen text, sources and up to six suggestions', () => {
    const settings = normalizeHelpAssistantSettings({
      enabled: false,
      welcomeMessage: '  Hello  ',
      suggestions: ['a', '', 'b', 'c', 'd', 'e', 'f', 'g'],
      sources: { builtInGuides: false },
    });
    expect(settings.enabled).toBe(false);
    expect(settings.welcomeMessage).toBe('Hello');
    expect(settings.suggestions).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(settings.sources).toEqual({ platformArticles: true, organizationArticles: true, builtInGuides: false });
    expect(normalizeHelpAssistantSettings({ assistantName: '   ' }).assistantName).toBe('Zebron Assistant');
  });
});

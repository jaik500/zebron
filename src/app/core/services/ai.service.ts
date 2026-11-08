import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from './firebase-config';

/** Apps that call the AI engine (used for usage reports). */
export type AiApp = 'resources' | 'jobs' | 'learning' | 'blog' | 'community' | 'knowledge' | 'other';

/**
 * Client for the Zebron AI engine (functions/src/ai-engine.ts). Every app
 * asks through here, so limits and usage reports cover everything.
 * Results are drafts: show them for review, never publish them directly.
 */
@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly callable = httpsCallable<{ app: AiApp; task: string; input: Record<string, unknown> }, unknown>(
    firebaseFunctions,
    'aiAssist',
  );

  async run<T>(app: AiApp, task: string, input: Record<string, unknown>): Promise<T> {
    const result = await this.callable({ app, task, input });
    return result.data as T;
  }

  /** Clearer wording, same facts. */
  improve(app: AiApp, text: string, purpose = ''): Promise<{ text: string }> {
    return this.run(app, 'improve', { text, purpose });
  }

  summarize(app: AiApp, text: string, maxWords = 60): Promise<{ text: string }> {
    return this.run(app, 'summarize', { text, maxWords });
  }

  /** A readable message for an AI error (limits, turned off, no key). */
  static message(error: unknown): string {
    const message = error instanceof Error ? error.message.replace(/^FirebaseError:\s*/, '') : '';
    return message || 'The AI could not finish this. Try again.';
  }
}

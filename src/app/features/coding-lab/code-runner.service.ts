import { Injectable } from '@angular/core';

import { CodeLanguage, CodeTest, OutputLine, RunResult } from './code-lab.model';

const WORKERS: Record<CodeLanguage, string> = {
  javascript: '/coding-lab/js-worker.js',
};

/** A run longer than this is stopped (an endless loop, usually). */
const TIME_LIMIT_MS = 8000;
/** Lines kept from one run; the rest are dropped with a note. */
const MAX_LINES = 1000;

/**
 * Runs learners' code in a Web Worker: a separate thread with no access to
 * the page, the learner's session or Firestore. Each run gets a fresh
 * worker, which is terminated afterwards (or when it runs too long).
 */
@Injectable({ providedIn: 'root' })
export class CodeRunnerService {
  run(
    language: CodeLanguage,
    code: string,
    options: { stdin?: string; tests?: CodeTest[]; onOutput?: (line: OutputLine) => void } = {},
  ): Promise<RunResult> {
    const started = performance.now();
    const output: OutputLine[] = [];
    let dropped = 0;

    return new Promise((resolve) => {
      let worker: Worker;
      try {
        worker = new Worker(WORKERS[language]);
      } catch {
        resolve({ output, error: 'The Coding Lab could not start in this browser.', tests: [], timedOut: false, durationMs: 0 });
        return;
      }

      const finish = (result: Omit<RunResult, 'output' | 'durationMs'>) => {
        clearTimeout(timer);
        worker.terminate();
        if (dropped) {
          output.push({ stream: 'system', text: `… ${dropped} more lines not shown.` });
        }
        resolve({ ...result, output, durationMs: Math.round(performance.now() - started) });
      };

      const timer = setTimeout(
        () =>
          finish({
            error: `Stopped after ${TIME_LIMIT_MS / 1000} seconds. Is there a loop that never ends?`,
            tests: (options.tests ?? []).map((test) => ({ name: test.name, passed: false, message: 'Not checked: the code was stopped.' })),
            timedOut: true,
          }),
        TIME_LIMIT_MS,
      );

      worker.onmessage = ({ data }) => {
        if (data?.type === 'stdout' || data?.type === 'stderr') {
          if (output.length >= MAX_LINES) {
            dropped++;
            return;
          }
          const line: OutputLine = { stream: data.type, text: String(data.text ?? '') };
          output.push(line);
          options.onOutput?.(line);
        } else if (data?.type === 'done') {
          finish({ error: data.error ?? null, tests: Array.isArray(data.tests) ? data.tests : [], timedOut: false });
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        finish({ error: event.message || 'The code could not run.', tests: [], timedOut: false });
      };

      worker.postMessage({ id: 1, code, stdin: options.stdin ?? '', tests: options.tests ?? [] });
    });
  }
}

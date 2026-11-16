import { Injectable, signal } from '@angular/core';

import { CodeLanguage, CodeTest, OutputLine, RunResult } from './code-lab.model';

/** A run longer than this is stopped (an endless loop, usually). */
const TIME_LIMIT_MS: Record<CodeLanguage, number> = { javascript: 8000, python: 15000 };
/** Python downloads once (about 10 MB) and is then cached by the browser. */
const PYTHON_LOAD_LIMIT_MS = 90_000;
/** Lines kept from one run; the rest are dropped with a note. */
const MAX_LINES = 1000;

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'failed';

/**
 * Runs learners' code in Web Workers: separate threads with no access to the
 * page, the learner's session or Firestore.
 *
 * JavaScript: a fresh worker per run, terminated afterwards.
 * Python: one worker kept between runs (Python takes a few seconds to
 * start); it is terminated and started again when a run takes too long.
 */
@Injectable({ providedIn: 'root' })
export class CodeRunnerService {
  readonly pythonStatus = signal<PythonStatus>('idle');

  private pythonWorker: Worker | null = null;
  private pythonReady: Promise<Worker> | null = null;
  private runId = 0;
  /** Python runs one at a time (one interpreter). */
  private pythonQueue: Promise<unknown> = Promise.resolve();

  /** Start loading Python before the first run (when a Python panel opens). */
  warmUp(language: CodeLanguage): void {
    if (language === 'python') {
      void this.python().catch(() => undefined);
    }
  }

  run(
    language: CodeLanguage,
    code: string,
    options: { stdin?: string; tests?: CodeTest[]; onOutput?: (line: OutputLine) => void } = {},
  ): Promise<RunResult> {
    if (language === 'python') {
      const run = this.pythonQueue.then(() => this.runPython(code, options));
      this.pythonQueue = run.catch(() => undefined);
      return run;
    }
    return this.runJavaScript(code, options);
  }

  // ---------- JavaScript ----------

  private runJavaScript(code: string, options: RunOptions): Promise<RunResult> {
    let worker: Worker;
    try {
      worker = new Worker('/coding-lab/js-worker.js');
    } catch {
      return Promise.resolve(failed('The Coding Lab could not start in this browser.'));
    }
    return this.execute(worker, 'javascript', code, options, () => worker.terminate(), () => worker.terminate());
  }

  // ---------- Python ----------

  private async runPython(code: string, options: RunOptions): Promise<RunResult> {
    let worker: Worker;
    try {
      if (this.pythonStatus() !== 'ready') {
        options.onOutput?.({ stream: 'system', text: 'Starting Python… The first time takes a few seconds.' });
      }
      worker = await this.python();
    } catch {
      return failed('Python could not be loaded. Check your internet connection and try again.');
    }
    return this.execute(
      worker,
      'python',
      code,
      options,
      () => undefined,
      // A run that takes too long: stop Python; the next run starts it again.
      () => this.resetPython(),
    );
  }

  private python(): Promise<Worker> {
    if (this.pythonReady) return this.pythonReady;
    this.pythonStatus.set('loading');
    this.pythonReady = new Promise<Worker>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker('/coding-lab/python-worker.js');
      } catch (error) {
        reject(error);
        return;
      }
      const timer = setTimeout(() => fail(), PYTHON_LOAD_LIMIT_MS);
      const fail = () => {
        clearTimeout(timer);
        worker.terminate();
        this.pythonWorker = null;
        this.pythonReady = null;
        this.pythonStatus.set('failed');
        reject(new Error('Python could not be loaded.'));
      };
      worker.addEventListener('message', ({ data }) => {
        if (data?.type !== 'status') return;
        if (data.status === 'ready') {
          clearTimeout(timer);
          this.pythonWorker = worker;
          this.pythonStatus.set('ready');
          resolve(worker);
        } else if (data.status === 'failed') {
          fail();
        }
      });
      worker.addEventListener('error', (event) => {
        event.preventDefault();
        fail();
      });
      worker.postMessage({ id: 'warmup' });
    });
    return this.pythonReady;
  }

  private resetPython(): void {
    this.pythonWorker?.terminate();
    this.pythonWorker = null;
    this.pythonReady = null;
    this.pythonStatus.set('idle');
  }

  // ---------- Shared ----------

  private execute(
    worker: Worker,
    language: CodeLanguage,
    code: string,
    options: RunOptions,
    onDone: () => void,
    onTimeout: () => void,
  ): Promise<RunResult> {
    const id = ++this.runId;
    const started = performance.now();
    const output: OutputLine[] = [];
    let dropped = 0;
    const limit = TIME_LIMIT_MS[language];

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: Omit<RunResult, 'output' | 'durationMs'>, timedOut = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        if (timedOut) onTimeout();
        else onDone();
        if (dropped) output.push({ stream: 'system', text: `… ${dropped} more lines not shown.` });
        resolve({ ...result, output, durationMs: Math.round(performance.now() - started) });
      };

      const onMessage = ({ data }: MessageEvent) => {
        if (data?.id !== id) return;
        if (data.type === 'stdout' || data.type === 'stderr' || data.type === 'system') {
          if (output.length >= MAX_LINES) {
            dropped++;
            return;
          }
          const line: OutputLine = { stream: data.type, text: String(data.text ?? '') };
          output.push(line);
          options.onOutput?.(line);
        } else if (data.type === 'done') {
          finish({ error: data.error ?? null, tests: Array.isArray(data.tests) ? data.tests : [], timedOut: false });
        }
      };
      const onError = (event: ErrorEvent) => {
        event.preventDefault();
        finish({ error: event.message || 'The code could not run.', tests: [], timedOut: false }, true);
      };

      const timer = setTimeout(
        () =>
          finish(
            {
              error: `Stopped after ${limit / 1000} seconds. Is there a loop that never ends?`,
              tests: (options.tests ?? []).map((test) => ({ name: test.name, passed: false, message: 'Not checked: the code was stopped.' })),
              timedOut: true,
            },
            true,
          ),
        limit,
      );

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({ id, code, stdin: options.stdin ?? '', tests: options.tests ?? [] });
    });
  }
}

interface RunOptions {
  stdin?: string;
  tests?: CodeTest[];
  onOutput?: (line: OutputLine) => void;
}

function failed(error: string): RunResult {
  return { output: [], error, tests: [], timedOut: false, durationMs: 0 };
}

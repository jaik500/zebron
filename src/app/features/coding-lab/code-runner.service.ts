import { Injectable, signal } from '@angular/core';

import { CodeLanguage, CodeTest, OutputLine, RunResult } from './code-lab.model';

/** A run longer than this is stopped (an endless loop, usually). */
const TIME_LIMIT_MS: Record<CodeLanguage, number> = { javascript: 8000, python: 15000 };
/** Python downloads once (about 10 MB) and is then cached by the browser. */
const PYTHON_LOAD_LIMIT_MS = 90_000;
/** Lines kept from one run; the rest are dropped with a note. */
const MAX_LINES = 1000;
/** How long the sandbox page may take to load. */
const SANDBOX_LOAD_LIMIT_MS = 20_000;

/**
 * The sandbox page (public/coding-lab/sandbox.html). Bump v when the page
 * changes: static files are cached for a long time.
 */
const SANDBOX_URL = '/coding-lab/sandbox.html?v=1';

/** Worker sources, sent into the sandbox (which cannot load them itself). */
const WORKER_SOURCE_URLS: Record<CodeLanguage, string> = {
  javascript: '/coding-lab/js-worker.js',
  python: '/coding-lab/python-worker.js',
};

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'failed';

interface SandboxMessageEvent {
  // Messages come from learners' code: treat them as untrusted data.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

interface SandboxErrorEvent {
  message: string;
  preventDefault(): void;
}

/**
 * A Web Worker running inside the Coding Lab sandbox. Offers the part of
 * the Worker API that CodeRunnerService uses.
 */
class SandboxedWorker {
  private readonly messageListeners = new Set<(event: SandboxMessageEvent) => void>();
  private readonly errorListeners = new Set<(event: SandboxErrorEvent) => void>();

  constructor(
    private readonly sandbox: CodingSandbox,
    readonly id: number,
  ) {}

  postMessage(data: unknown): void {
    this.sandbox.post(this.id, data);
  }

  terminate(): void {
    this.sandbox.terminate(this.id);
  }

  addEventListener(type: 'message', listener: (event: SandboxMessageEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SandboxErrorEvent) => void): void;
  addEventListener(type: 'message' | 'error', listener: (event: never) => void): void {
    if (type === 'message') this.messageListeners.add(listener as (event: SandboxMessageEvent) => void);
    else this.errorListeners.add(listener as (event: SandboxErrorEvent) => void);
  }

  removeEventListener(type: 'message', listener: (event: SandboxMessageEvent) => void): void;
  removeEventListener(type: 'error', listener: (event: SandboxErrorEvent) => void): void;
  removeEventListener(type: 'message' | 'error', listener: (event: never) => void): void {
    if (type === 'message') this.messageListeners.delete(listener as (event: SandboxMessageEvent) => void);
    else this.errorListeners.delete(listener as (event: SandboxErrorEvent) => void);
  }

  /** Called by CodingSandbox. */
  receiveMessage(data: unknown): void {
    for (const listener of [...this.messageListeners]) listener({ data });
  }

  /** Called by CodingSandbox. */
  receiveError(message: string): void {
    const event: SandboxErrorEvent = { message, preventDefault: () => undefined };
    for (const listener of [...this.errorListeners]) listener(event);
  }
}

/**
 * The hidden sandbox iframe. It has sandbox="allow-scripts" without
 * allow-same-origin, so it and the workers it starts get an opaque origin:
 * learners' code cannot reach the learner's sign-in (Firebase keeps it in
 * IndexedDB), cookies, storage or the page, and cannot call Zebron as them.
 */
class CodingSandbox {
  private frame: HTMLIFrameElement | null = null;
  private ready: Promise<void> | null = null;
  private readonly workers = new Map<number, SandboxedWorker>();
  private readonly sources = new Map<CodeLanguage, Promise<string>>();
  private nextId = 0;

  async createWorker(language: CodeLanguage): Promise<SandboxedWorker> {
    const [, source] = await Promise.all([this.start(), this.source(language)]);
    const worker = new SandboxedWorker(this, ++this.nextId);
    this.workers.set(worker.id, worker);
    this.send({ type: 'create', workerId: worker.id, workerSource: source });
    return worker;
  }

  post(workerId: number, data: unknown): void {
    this.send({ type: 'post', workerId, data });
  }

  terminate(workerId: number): void {
    if (!this.workers.delete(workerId)) return;
    this.send({ type: 'terminate', workerId });
  }

  private send(message: Record<string, unknown>): void {
    // The sandbox has an opaque origin, so no target origin can name it.
    // Only learners' code and its input are sent.
    this.frame?.contentWindow?.postMessage({ source: 'zebron-code-lab', ...message }, '*');
  }

  private source(language: CodeLanguage): Promise<string> {
    let source = this.sources.get(language);
    if (!source) {
      // no-cache: check for a newer worker after each deploy.
      source = fetch(WORKER_SOURCE_URLS[language], { cache: 'no-cache' }).then((response) => {
        if (!response.ok) throw new Error(`Could not load ${WORKER_SOURCE_URLS[language]}.`);
        return response.text();
      });
      source.catch(() => this.sources.delete(language));
      this.sources.set(language, source);
    }
    return source;
  }

  private start(): Promise<void> {
    if (this.ready) return this.ready;

    this.ready = new Promise<void>((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('The Coding Lab runs in the browser only.'));
        return;
      }

      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.title = 'Coding Lab sandbox';
      frame.tabIndex = -1;
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';

      let started = false;
      const timer = setTimeout(() => fail(new Error('The Coding Lab sandbox did not load.')), SANDBOX_LOAD_LIMIT_MS);

      const onMessage = (event: MessageEvent) => {
        // Only messages from our own sandbox frame.
        if (!frame.contentWindow || event.source !== frame.contentWindow) return;
        const data = event.data;
        if (!data || data.source !== 'zebron-code-sandbox') return;

        if (data.type === 'ready') {
          if (!started) {
            started = true;
            clearTimeout(timer);
            resolve();
          }
          return;
        }

        const worker = typeof data.workerId === 'number' ? this.workers.get(data.workerId) : undefined;
        if (!worker) return;
        if (data.type === 'message') worker.receiveMessage(data.data);
        else if (data.type === 'error') worker.receiveError(String(data.message ?? ''));
      };

      const fail = (error: Error) => {
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        frame.remove();
        this.frame = null;
        this.ready = null;
        reject(error);
      };

      window.addEventListener('message', onMessage);
      frame.src = SANDBOX_URL;
      this.frame = frame;
      document.body.appendChild(frame);
    });

    return this.ready;
  }
}

/**
 * Runs learners' code in Web Workers inside the Coding Lab sandbox
 * (an opaque-origin iframe): no access to the page, the learner's
 * session or Firestore.
 *
 * JavaScript: a fresh worker per run, terminated afterwards.
 * Python: one worker kept between runs (Python takes a few seconds to
 * start); it is terminated and started again when a run takes too long.
 */
@Injectable({ providedIn: 'root' })
export class CodeRunnerService {
  readonly pythonStatus = signal<PythonStatus>('idle');

  private readonly sandbox = new CodingSandbox();
  private pythonWorker: SandboxedWorker | null = null;
  private pythonReady: Promise<SandboxedWorker> | null = null;
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

  private async runJavaScript(code: string, options: RunOptions): Promise<RunResult> {
    let worker: SandboxedWorker;
    try {
      worker = await this.sandbox.createWorker('javascript');
    } catch {
      return failed('The Coding Lab could not start in this browser.');
    }
    return this.execute(worker, 'javascript', code, options, () => worker.terminate(), () => worker.terminate());
  }

  // ---------- Python ----------

  private async runPython(code: string, options: RunOptions): Promise<RunResult> {
    let worker: SandboxedWorker;
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

  private python(): Promise<SandboxedWorker> {
    if (this.pythonReady) return this.pythonReady;
    this.pythonStatus.set('loading');

    const ready: Promise<SandboxedWorker> = this.sandbox.createWorker('python').then(
      (worker) =>
        new Promise<SandboxedWorker>((resolve, reject) => {
          const timer = setTimeout(() => fail(), PYTHON_LOAD_LIMIT_MS);
          const fail = () => {
            clearTimeout(timer);
            worker.terminate();
            if (this.pythonReady === ready) {
              this.pythonWorker = null;
              this.pythonReady = null;
              this.pythonStatus.set('failed');
            }
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
        }),
      (error: unknown) => {
        if (this.pythonReady === ready) {
          this.pythonReady = null;
          this.pythonStatus.set('failed');
        }
        throw error;
      },
    );

    this.pythonReady = ready;
    return ready;
  }

  private resetPython(): void {
    this.pythonWorker?.terminate();
    this.pythonWorker = null;
    this.pythonReady = null;
    this.pythonStatus.set('idle');
  }

  // ---------- Shared ----------

  private execute(
    worker: SandboxedWorker,
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

      const onMessage = ({ data }: SandboxMessageEvent) => {
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
      const onError = (event: SandboxErrorEvent) => {
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

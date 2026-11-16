/*
 * Zebron Coding Lab: runs learners' JavaScript in this worker, away from the
 * page (no access to the page, cookies or the learner's session).
 *
 * Messages in:  { id, code, stdin, tests: [{ name, code }] }
 * Checks can use assert(condition, message), assertEqual(actual, expected)
 * and __output() (everything the code printed with console.log).
 * Messages out: { id, type: 'stdout' | 'stderr', text }
 *               { id, type: 'done', error, tests }
 *
 * Each run uses a fresh worker; the page terminates it afterwards or when
 * it takes too long.
 */
function post(message) {
  self.postMessage(message);
}

function format(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || String(value);
  try {
    const compact = JSON.stringify(value);
    if (compact === undefined) return String(value);
    return compact.length <= 80 ? compact.replace(/,(?=["{[\w-])/g, ', ') : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function errorText(error) {
  if (!(error instanceof Error)) return String(error);
  const frames = (error.stack || '')
    .split('\n')
    .slice(1)
    .filter((line) => line.includes('eval at') && !line.includes('onmessage'))
    .map((line) => line.replace(/\(?eval at .*?<anonymous>:(\d+):(\d+)\)?/, (_m, l, c) => `(line ${Math.max(1, Number(l) - 2)}, column ${c})`))
    .slice(0, 3);
  const lines = [`${error.name}: ${error.message}`, ...frames];
  const missing = /^(\w+) is not defined$/.exec(error.message)?.[1];
  if (error.name === 'ReferenceError' && missing && PAGE_ONLY.has(missing)) {
    lines.push(`(The Coding Lab runs plain JavaScript without a web page, so ${missing} isn't available here.)`);
  } else if (error.name === 'ReferenceError' && missing && NODE_ONLY.has(missing)) {
    lines.push(`(${missing} belongs to Node.js; the Coding Lab runs JavaScript in your browser.)`);
  }
  return lines.join('\n');
}

const PAGE_ONLY = new Set(['document', 'window', 'localStorage', 'sessionStorage', 'alert', 'HTMLElement']);
const NODE_ONLY = new Set(['require', 'process', 'module', '__dirname', 'Buffer']);

self.onmessage = async (event) => {
  const { id, code, stdin = '', tests = [] } = event.data || {};
  const id_ = id;
  const printed = [];
  const out = (type) => (...args) => {
    const text = args.map(format).join(' ');
    if (type === 'stdout') printed.push(text);
    post({ id: id_, type, text });
  };
  // Checks can look at what the code printed: __output().includes('...')
  const __output = () => printed.join('\n');
  self.console = { log: out('stdout'), info: out('stdout'), debug: out('stdout'), table: out('stdout'), warn: out('stderr'), error: out('stderr') };

  const inputLines = String(stdin).split('\n');
  const prompt = () => (inputLines.length ? inputLines.shift() : null);
  const assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed');
  };
  const assertEqual = (actual, expected, message) => {
    const same = JSON.stringify(actual) === JSON.stringify(expected);
    if (!same) throw new Error(message || `Expected ${format(expected)} but got ${format(actual)}`);
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const testList = tests.map((test) => `async () => {\n${test.code}\n}`).join(',\n');
  let error = null;
  let testFns = [];
  try {
    const run = new AsyncFunction('console', 'prompt', 'assert', 'assertEqual', '__output', `${code}\n;return [${testList}];`);
    testFns = await run(self.console, prompt, assert, assertEqual, __output);
  } catch (err) {
    error = errorText(err);
  }

  const results = [];
  for (let index = 0; index < tests.length; index++) {
    if (error || !Array.isArray(testFns)) {
      results.push({ name: tests[index].name, passed: false, message: 'Fix the error above first.' });
      continue;
    }
    try {
      await testFns[index]();
      results.push({ name: tests[index].name, passed: true, message: '' });
    } catch (err) {
      results.push({ name: tests[index].name, passed: false, message: err instanceof Error ? err.message : String(err) });
    }
  }
  post({ id: id_, type: 'done', error, tests: results });
};

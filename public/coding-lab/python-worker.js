/*
 * Zebron Coding Lab: runs learners' Python in this worker with Pyodide
 * (CPython compiled to WebAssembly). Nothing runs on Zebron's servers.
 *
 * Messages in:  { id: 'warmup' } loads Python ahead of the first run
 *                { id, code, stdin, tests: [{ name, code }] }
 * Checks are Python statements run after the learner's code, in the same
 * namespace; they fail by raising (assert ..., "message"). __output() returns
 * everything the code printed.
 * Messages out: { id, type: 'status', status }      loading | ready
 *               { id, type: 'stdout' | 'stderr', text }
 *               { id, type: 'done', error, tests }
 *
 * The page stops a run that takes too long by terminating this worker.
 */
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
let pyodideReady = null;
let current = null;
let printed = [];

function post(message) {
  self.postMessage(message);
}

function load() {
  if (!pyodideReady) {
    post({ id: null, type: 'status', status: 'loading' });
    importScripts(PYODIDE_URL + 'pyodide.js');
    pyodideReady = loadPyodide({ indexURL: PYODIDE_URL }).then((pyodide) => {
      pyodide.setStdout({
        batched: (text) => {
          printed.push(text);
          post({ id: current, type: 'stdout', text });
        },
      });
      pyodide.setStderr({ batched: (text) => post({ id: current, type: 'stderr', text }) });
      post({ id: null, type: 'status', status: 'ready' });
      return pyodide;
    });
  }
  return pyodideReady;
}

/** Keep the learner's part of a traceback (frames in their code, and the error). */
function cleanError(error) {
  const text = String((error && error.message) || error);
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.includes('File "<exec>"'));
  const kept = start >= 0 ? ['Traceback (most recent call last):', ...lines.slice(start)] : lines;
  let result = kept
    .join('\n')
    .replace(/File "<exec>"/g, 'File "main.py"')
    .trim();
  if (/EOFError/.test(result)) {
    result += '\n(input() reads the lines under Program input: add one line for each input().)';
  } else if (/ModuleNotFoundError/.test(result)) {
    result += '\n(The Coding Lab includes the standard library and common packages such as numpy and pandas, but not every package.)';
  }
  return result;
}

function lastLine(text) {
  const lines = text.trim().split('\n');
  return lines[lines.length - 1] || text;
}

self.onmessage = async (event) => {
  const { id, code, stdin = '', tests = [] } = event.data || {};
  if (id === 'warmup') {
    try {
      await load();
    } catch (error) {
      post({ id: null, type: 'status', status: 'failed' });
    }
    return;
  }
  current = id;
  let pyodide;
  try {
    pyodide = await load();
  } catch (error) {
    post({ id, type: 'done', error: 'Python could not be loaded. Check your internet connection and try again.', tests: [] });
    return;
  }

  const inputLines = String(stdin).split('\n');
  if (inputLines.length && inputLines[inputLines.length - 1] === '') inputLines.pop();
  pyodide.setStdin({ stdin: () => (inputLines.length ? inputLines.shift() : null), autoEOF: true });

  printed = [];
  const namespace = pyodide.globals.get('dict')();
  namespace.set('__output', () => printed.join('\n'));
  let error = null;
  try {
    await pyodide.loadPackagesFromImports(code, {
      messageCallback: (message) => {
        if (/^Loading /.test(message)) post({ id, type: 'system', text: message });
      },
      errorCallback: () => {},
    });
    await pyodide.runPythonAsync(code, { globals: namespace, filename: '<exec>' });
  } catch (err) {
    error = cleanError(err);
  }

  const results = [];
  for (const test of tests) {
    if (error) {
      results.push({ name: test.name, passed: false, message: 'Fix the error above first.' });
      continue;
    }
    try {
      await pyodide.runPythonAsync(test.code, { globals: namespace, filename: '<test>' });
      results.push({ name: test.name, passed: true, message: '' });
    } catch (err) {
      const message = lastLine(String((err && err.message) || err));
      results.push({
        name: test.name,
        passed: false,
        message: message === 'AssertionError' ? 'This check failed.' : message.replace(/^AssertionError: /, ''),
      });
    }
  }

  namespace.destroy();
  post({ id, type: 'done', error, tests: results });
};

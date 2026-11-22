#!/usr/bin/env node
/**
 * Which collections in firestore.rules does the code still use?
 *
 * Lists every collection name that appears in a `match /name/...` rule and
 * counts how often the app (src/), the Cloud Functions (functions/src/) and
 * the scripts (scripts/) mention it as a path: 'name', "name", `name`, or
 * between slashes. Tests (tests/) are counted separately: a collection only
 * the tests mention is not used by Zebron.
 *
 * Collections with no mention in src/, functions/src/ or scripts/ are
 * candidates for removing their rules (check each one by hand first: a
 * name can be built at run time).
 *
 * Usage: npm run rules:usage   (or node scripts/rules-usage-report.mjs)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stripComments } from './build-rules.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CODE_DIRS = ['src', 'functions/src', 'scripts'];
const TEST_DIRS = ['tests'];
const EXTENSIONS = new Set(['.ts', '.mjs', '.js', '.cjs', '.html', '.json']);
const SKIP = new Set(['node_modules', 'lib', 'dist', '.angular', '.git']);
const IGNORE_FILES = new Set([
  // The knowledge articles describe collections; they are not code that uses them.
  'src/app/features/admin/pages/knowledge/guide-import/guide-articles.ts',
  'scripts/rules-usage-report.mjs',
  'scripts/build-rules.mjs',
]);

function filesUnder(dir) {
  const out = [];
  const walk = (path) => {
    let entries;
    try {
      entries = readdirSync(path);
    } catch {
      return;
    }
    for (const name of entries) {
      if (SKIP.has(name)) continue;
      const full = join(path, name);
      const stats = statSync(full);
      if (stats.isDirectory()) walk(full);
      else if (EXTENSIONS.has(extname(name))) out.push(full);
    }
  };
  walk(resolve(ROOT, dir));
  return out;
}

function relative(path) {
  return path.slice(ROOT.length + 1).replace(/\\/g, '/');
}

/** Collection names from `match /a/{x}/b/{y}` lines, with the path they appear in. */
function collectionsInRules() {
  const rules = stripComments(readFileSync(resolve(ROOT, 'firestore.rules'), 'utf8'));
  const found = new Map();
  for (const match of rules.matchAll(/match\s+(\/[^\s{][^\s]*)\s*\{/g)) {
    const path = match[1];
    for (const segment of path.split('/')) {
      if (!segment || segment.startsWith('{') || segment === 'databases' || segment === 'documents') continue;
      if (!found.has(segment)) found.set(segment, new Set());
      found.get(segment).add(path);
    }
  }
  return found;
}

function countMentions(name, files) {
  const pattern = new RegExp(`['"\`/]${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`/]`, 'g');
  let count = 0;
  const where = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const hits = text.match(pattern)?.length ?? 0;
    if (hits) {
      count += hits;
      where.push(relative(file));
    }
  }
  return { count, where };
}

const collections = collectionsInRules();
const codeFiles = CODE_DIRS.flatMap(filesUnder).filter((file) => !IGNORE_FILES.has(relative(file)));
const testFiles = TEST_DIRS.flatMap(filesUnder);

const rows = [...collections.keys()].sort().map((name) => {
  const code = countMentions(name, codeFiles);
  const tests = countMentions(name, testFiles);
  return { name, code: code.count, files: code.where.length, tests: tests.count, paths: [...collections.get(name)] };
});

const unused = rows.filter((row) => row.code === 0);

console.log(`Collections in firestore.rules: ${rows.length}. Code files searched: ${codeFiles.length}.`);
console.log('');
console.log('NOT MENTIONED in src/, functions/src/ or scripts/ (candidates to remove):');
if (!unused.length) console.log('  (none)');
for (const row of unused) {
  console.log(`  ${row.name}  [tests: ${row.tests}]  in: ${row.paths.join(', ')}`);
}
console.log('');
console.log('All collections (code mentions / files / test mentions):');
for (const row of rows) {
  console.log(`  ${row.name.padEnd(36)} ${String(row.code).padStart(4)} ${String(row.files).padStart(4)} ${String(row.tests).padStart(4)}`);
}

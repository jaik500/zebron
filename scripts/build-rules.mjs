#!/usr/bin/env node
/**
 * Builds the compact Firestore rules that are deployed.
 *
 *   firestore.rules          the rules you edit: readable, with comments
 *   firestore.deploy.rules   generated: comments, indentation and blank lines removed
 *
 * Firestore allows at most 256 KiB of rules text, and comments and spaces
 * count, so the readable file is never deployed. firebase.json points at
 * firestore.deploy.rules and rebuilds it before every deploy (predeploy).
 * Nothing inside quoted strings is touched, and each remaining line keeps
 * its tokens in order, so the rules mean exactly the same.
 *
 * Usage:
 *   node scripts/build-rules.mjs            write firestore.deploy.rules
 *   node scripts/build-rules.mjs --check    fail if the committed copy is out of date
 *
 * Tests: tests/unit/firestore-rules-build.test.ts (same tokens as the source,
 * size budget, committed copy up to date).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCE_FILE = resolve(ROOT, 'firestore.rules');
export const OUTPUT_FILE = resolve(ROOT, 'firestore.deploy.rules');

export const HEADER = '// Generated from firestore.rules by scripts/build-rules.mjs. Do not edit: edit firestore.rules, then run npm run rules:build.';

/**
 * Remove // and /* *\/ comments outside quoted strings. A block comment
 * becomes a space so the tokens on either side never join.
 */
export function stripComments(source) {
  let out = '';
  let i = 0;
  const n = source.length;
  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '"' || ch === "'") {
      // Copy the whole string, including escaped quotes.
      let j = i + 1;
      while (j < n && source[j] !== ch) {
        if (source[j] === '\\') j++;
        if (source[j] === '\n') break; // unterminated: stop at the line end
        j++;
      }
      out += source.slice(i, j + 1);
      i = j + 1;
    } else if (ch === '/' && next === '/') {
      while (i < n && source[i] !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) throw new Error('Unclosed /* comment in firestore.rules');
      // Keep line breaks so line structure stays close to the source.
      out += source.slice(i, end + 2).includes('\n') ? '\n' : ' ';
      i = end + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** Comments removed, each line trimmed, blank lines dropped. */
export function compactRules(source) {
  const lines = stripComments(source.replace(/\r\n?/g, '\n'))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return `${HEADER}\n${lines.join('\n')}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const compact = compactRules(readFileSync(SOURCE_FILE, 'utf8'));
  const bytes = Buffer.byteLength(compact, 'utf8');
  const sourceBytes = Buffer.byteLength(readFileSync(SOURCE_FILE, 'utf8'), 'utf8');

  if (check) {
    // Git on Windows may check the file out with CRLF line endings.
    const current = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== compact) {
      console.error('firestore.deploy.rules is out of date. Run: npm run rules:build');
      process.exit(1);
    }
    console.log(`firestore.deploy.rules is up to date (${(bytes / 1024).toFixed(1)} KiB).`);
    return;
  }

  writeFileSync(OUTPUT_FILE, compact, 'utf8');
  console.log(
    `firestore.deploy.rules: ${(bytes / 1024).toFixed(1)} KiB (source ${(sourceBytes / 1024).toFixed(1)} KiB; limit 256 KiB).`,
  );
  if (bytes > 256 * 1024) {
    console.error('The compact rules are over Firestore\'s 256 KiB limit.');
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

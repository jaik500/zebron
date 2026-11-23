#!/usr/bin/env node
/**
 * Saved Security Rules versions ("rulesets") for the Firebase project.
 *
 * Every rules deploy (Firestore and Storage) keeps a ruleset, and a
 * project can keep at most 2,500. At the limit, deploys and the console's
 * Publish fail with vague errors (409 "Release ... already exists",
 * "Error saving rules - An unknown error occurred").
 *
 *   node scripts/rulesets.mjs                       count them (reads only)
 *   node scripts/rulesets.mjs --delete-oldest 500   show which 500 would be deleted
 *   node scripts/rulesets.mjs --delete-oldest 500 --apply   delete them
 *
 * Rulesets in use by a release (the live Firestore and Storage rules) are
 * never deleted. Old rulesets are only history: the console's rules
 * history shows fewer versions afterwards.
 *
 * Needs the Google Cloud CLI signed in as a project owner
 * (gcloud auth login). Project: --project <id>, default zebron-2b49f.
 */
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const project = option('--project') ?? 'zebron-2b49f';
const deleteOldest = Number(option('--delete-oldest') ?? 0);
const apply = args.includes('--apply');
const LIMIT = 2500;
const API = 'https://firebaserules.googleapis.com/v1';

let token;
try {
  token = execSync('gcloud auth print-access-token', { encoding: 'utf8', shell: true }).trim();
} catch {
  console.error('Could not get a token from gcloud. Install the Google Cloud CLI and run: gcloud auth login');
  process.exit(1);
}

async function call(url, method = 'GET') {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': project } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${url} → ${response.status} ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

const rulesets = [];
let pageToken = '';
do {
  const page = await call(`${API}/projects/${project}/rulesets?pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
  rulesets.push(...(page.rulesets ?? []));
  pageToken = page.nextPageToken ?? '';
  process.stdout.write(`\rReading rulesets… ${rulesets.length}`);
} while (pageToken);
console.log('');

const releases = (await call(`${API}/projects/${project}/releases?pageSize=100`)).releases ?? [];
const inUse = new Set(releases.map((release) => release.rulesetName));

rulesets.sort((a, b) => String(a.createTime).localeCompare(String(b.createTime)));
console.log(`Project ${project}: ${rulesets.length} rulesets (limit ${LIMIT}).`);
if (rulesets.length) {
  console.log(`Oldest: ${rulesets[0].createTime}   Newest: ${rulesets[rulesets.length - 1].createTime}`);
}
console.log('Live releases:');
for (const release of releases) {
  console.log(`  ${release.name.split('/releases/')[1]} → ${release.rulesetName.split('/rulesets/')[1]} (updated ${release.updateTime})`);
}
if (rulesets.length >= LIMIT - 50) {
  console.log(`\nAt or near the limit: this is why saving rules fails. Run with --delete-oldest 500 to free space.`);
}

if (deleteOldest > 0) {
  const victims = rulesets.filter((ruleset) => !inUse.has(ruleset.name)).slice(0, deleteOldest);
  console.log(`\n${apply ? 'Deleting' : 'Would delete'} the ${victims.length} oldest unused rulesets (${victims[0]?.createTime ?? '-'} to ${victims[victims.length - 1]?.createTime ?? '-'}).`);
  if (!apply) {
    console.log('Nothing deleted. Add --apply to delete them.');
  } else {
    let done = 0;
    for (const ruleset of victims) {
      await call(`${API}/${ruleset.name}`, 'DELETE');
      done += 1;
      if (done % 25 === 0 || done === victims.length) {
        process.stdout.write(`\rDeleted ${done}/${victims.length}`);
      }
    }
    console.log(`\nDone. ${rulesets.length - done} rulesets left.`);
  }
}

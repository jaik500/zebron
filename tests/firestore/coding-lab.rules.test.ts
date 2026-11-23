import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import fs from 'node:fs';

/**
 * Coding Lab work (users/{uid}/codeLabProjects and codeLabExercises,
 * firestore.rules): private to each learner; languages are javascript,
 * python and web (HTML, CSS and JavaScript pages); code is at most 50,000
 * characters.
 */
describe('Zebron Firestore Security Rules - Coding Lab', () => {
  let testEnv: RulesTestEnvironment;

  const UID = 'lab-learner';
  const OTHER_UID = 'lab-other';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'zebron-rules-test',
      firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  const learner = () => testEnv.authenticatedContext(UID, { zv: 1 }).firestore();
  const other = () => testEnv.authenticatedContext(OTHER_UID, { zv: 1 }).firestore();

  const project = (overrides: Record<string, unknown> = {}) => ({
    name: 'My first web page',
    language: 'web',
    code: '--- html ---\n<h1>Hello</h1>\n--- css ---\nh1 { color: teal; }\n--- js ---\n',
    updatedAt: serverTimestamp(),
    ...overrides,
  });

  const exercise = (overrides: Record<string, unknown> = {}) => ({
    key: 'lab__web-heading',
    language: 'web',
    code: '--- html ---\n<h1>My first page</h1>',
    passed: true,
    passedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  });

  it('lets a learner save web page, JavaScript and Python projects', async () => {
    await assertSucceeds(setDoc(doc(learner(), `users/${UID}/codeLabProjects/web1`), project()));
    await assertSucceeds(setDoc(doc(learner(), `users/${UID}/codeLabProjects/js1`), project({ language: 'javascript', code: 'console.log(1);' })));
    await assertSucceeds(setDoc(doc(learner(), `users/${UID}/codeLabProjects/py1`), project({ language: 'python', code: 'print(1)' })));
  });

  it('refuses other languages and code over 50,000 characters', async () => {
    await assertFails(setDoc(doc(learner(), `users/${UID}/codeLabProjects/p1`), project({ language: 'php' })));
    await assertFails(setDoc(doc(learner(), `users/${UID}/codeLabProjects/p2`), project({ code: 'x'.repeat(50001) })));
  });

  it('lets a learner save work on a web exercise', async () => {
    await assertSucceeds(setDoc(doc(learner(), `users/${UID}/codeLabExercises/lab__web-heading`), exercise()));
    await assertFails(setDoc(doc(learner(), `users/${UID}/codeLabExercises/lab__x`), exercise({ language: 'ruby' })));
  });

  it('keeps projects private to the learner', async () => {
    await assertSucceeds(setDoc(doc(learner(), `users/${UID}/codeLabProjects/web1`), project()));
    await assertFails(getDoc(doc(other(), `users/${UID}/codeLabProjects/web1`)));
    await assertFails(setDoc(doc(other(), `users/${UID}/codeLabProjects/web2`), project()));
  });
});

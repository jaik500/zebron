import { CodeExercise } from './code-lab.model';

export interface LabExercise extends CodeExercise {
  id: string;
  level: 'Starter' | 'Practice' | 'Challenge';
}

/** Starter templates for new projects on the Coding Lab page. */
export const LAB_TEMPLATES: { id: string; name: string; code: string }[] = [
  {
    id: 'blank',
    name: 'Blank',
    code: `// Write JavaScript here, then press Run (Ctrl+Enter).\nconsole.log('Hello, Zebron!');\n`,
  },
  {
    id: 'arrays',
    name: 'Working with arrays',
    code: `const scores = [72, 95, 58, 88, 64];

const passed = scores.filter((score) => score >= 70);
const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

console.log('Passed:', passed);
console.log('Average:', average.toFixed(1));
`,
  },
  {
    id: 'objects',
    name: 'Objects and JSON',
    code: `const learner = { name: 'Amina', course: 'APIs, JSON & Backend Integration', progress: 0.6 };

const json = JSON.stringify(learner);
console.log(json);

const parsed = JSON.parse(json);
console.log(\`\${parsed.name} is \${Math.round(parsed.progress * 100)}% through \${parsed.course}.\`);
`,
  },
  {
    id: 'functions',
    name: 'Functions',
    code: `function greet(name, course) {
  return \`Welcome, \${name}! Ready for \${course}?\`;
}

const initials = (fullName) =>
  fullName
    .split(' ')
    .map((part) => part[0].toUpperCase())
    .join('');

console.log(greet('Jordan', 'Prompt Engineering'));
console.log(initials('jordan lee'));
`,
  },
  {
    id: 'async',
    name: 'Async and await',
    code: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadCourse(id) {
  await wait(300); // pretend this is a request to an API
  return { id, title: 'AI Agents & Workflow Automation', lessons: 33 };
}

const course = await loadCourse('ai-agents');
console.log(\`\${course.title}: \${course.lessons} lessons\`);
`,
  },
];

/** Guided exercises on the Coding Lab page. */
export const LAB_EXERCISES: LabExercise[] = [
  {
    id: 'js-hello',
    level: 'Starter',
    language: 'javascript',
    title: 'Say hello',
    instructions: 'Print the exact text `Hello, Zebron!` with `console.log`.',
    starter: `// Print Hello, Zebron!\n`,
    tests: [
      {
        name: 'Prints "Hello, Zebron!"',
        code: `assert(__output().includes('Hello, Zebron!'), 'Nothing printed "Hello, Zebron!" yet.');`,
      },
    ],
    hints: ['console.log(...) prints whatever you put between the brackets.', "Text goes in quotes: console.log('Hello, Zebron!');"],
    solution: `console.log('Hello, Zebron!');\n`,
  },
  {
    id: 'js-sum',
    level: 'Starter',
    language: 'javascript',
    title: 'Add up a list',
    instructions: 'Complete `sum(numbers)` so it returns the total of the numbers in the array. An empty array adds up to `0`.',
    starter: `function sum(numbers) {\n  // your code here\n}\n\nconsole.log(sum([1, 2, 3]));\n`,
    tests: [
      { name: 'sum([1, 2, 3]) returns 6', code: `assertEqual(sum([1, 2, 3]), 6);` },
      { name: 'sum([]) returns 0', code: `assertEqual(sum([]), 0);` },
      { name: 'sum([-5, 10, 2.5]) returns 7.5', code: `assertEqual(sum([-5, 10, 2.5]), 7.5);` },
    ],
    hints: ['Start a total at 0 and add each number with a for...of loop.', 'Or use numbers.reduce((total, n) => total + n, 0).'],
    solution: `function sum(numbers) {\n  return numbers.reduce((total, n) => total + n, 0);\n}\n`,
  },
  {
    id: 'js-full-name',
    level: 'Starter',
    language: 'javascript',
    title: 'Format a name',
    instructions:
      'Complete `fullName(first, last)` so it returns the two names with a space between them, each starting with a capital letter, and with extra spaces removed.\n\nExample: `fullName("  amina ", "diallo")` returns `"Amina Diallo"`.',
    starter: `function fullName(first, last) {\n  // your code here\n}\n`,
    tests: [
      { name: 'fullName("amina", "diallo") returns "Amina Diallo"', code: `assertEqual(fullName('amina', 'diallo'), 'Amina Diallo');` },
      { name: 'Removes extra spaces', code: `assertEqual(fullName('  jordan ', ' lee  '), 'Jordan Lee');` },
      { name: 'Keeps the rest of the name as typed', code: `assertEqual(fullName('mcKenzie', 'o\\'Brien'), "McKenzie O'Brien");` },
    ],
    hints: ['text.trim() removes spaces at both ends.', 'word[0].toUpperCase() + word.slice(1) capitalizes the first letter.'],
    solution: `const capitalize = (word) => word[0].toUpperCase() + word.slice(1);\n\nfunction fullName(first, last) {\n  return \`\${capitalize(first.trim())} \${capitalize(last.trim())}\`;\n}\n`,
  },
  {
    id: 'js-passed',
    level: 'Practice',
    language: 'javascript',
    title: 'Who passed?',
    instructions:
      'Each result looks like `{ name: "Amina", score: 82 }`. Complete `passedNames(results, passMark)` so it returns the **names** of everyone whose score is at least `passMark`, in the same order.',
    starter: `function passedNames(results, passMark) {\n  // your code here\n}\n\nconst results = [\n  { name: 'Amina', score: 82 },\n  { name: 'Jordan', score: 64 },\n  { name: 'Lee', score: 70 },\n];\nconsole.log(passedNames(results, 70));\n`,
    tests: [
      {
        name: 'Returns the names at or above the pass mark',
        code: `assertEqual(passedNames([{ name: 'Amina', score: 82 }, { name: 'Jordan', score: 64 }, { name: 'Lee', score: 70 }], 70), ['Amina', 'Lee']);`,
      },
      { name: 'Returns [] when nobody passed', code: `assertEqual(passedNames([{ name: 'Sam', score: 10 }], 50), []);` },
      {
        name: 'Does not change the original array',
        code: `const list = [{ name: 'A', score: 90 }]; assertEqual(passedNames(list, 50), ['A']); assertEqual(list, [{ name: 'A', score: 90 }]);`,
      },
    ],
    hints: ['filter keeps the results you want; map turns each result into its name.', 'results.filter((r) => r.score >= passMark).map((r) => r.name)'],
    solution: `function passedNames(results, passMark) {\n  return results.filter((result) => result.score >= passMark).map((result) => result.name);\n}\n`,
  },
  {
    id: 'js-average',
    level: 'Practice',
    language: 'javascript',
    title: 'Average score',
    instructions: 'Complete `average(scores)` so it returns the average rounded to **one decimal place** (as a number). For an empty array, return `null`.',
    starter: `function average(scores) {\n  // your code here\n}\n`,
    tests: [
      { name: 'average([70, 80, 95]) returns 81.7', code: `assertEqual(average([70, 80, 95]), 81.7);` },
      { name: 'average([100]) returns 100', code: `assertEqual(average([100]), 100);` },
      { name: 'average([]) returns null', code: `assertEqual(average([]), null);` },
    ],
    hints: ['Divide the total by scores.length.', 'Math.round(value * 10) / 10 rounds to one decimal place.'],
    solution: `function average(scores) {\n  if (!scores.length) return null;\n  const total = scores.reduce((sum, score) => sum + score, 0);\n  return Math.round((total / scores.length) * 10) / 10;\n}\n`,
  },
  {
    id: 'js-group',
    level: 'Practice',
    language: 'javascript',
    title: 'Group by status',
    instructions:
      'Complete `countByStatus(enrollments)`. Each enrollment has a `status` such as `"active"`, `"completed"` or `"withdrawn"`. Return an object that counts each status, for example `{ active: 2, completed: 1 }`.',
    starter: `function countByStatus(enrollments) {\n  // your code here\n}\n`,
    tests: [
      {
        name: 'Counts each status',
        code: `assertEqual(countByStatus([{ status: 'active' }, { status: 'completed' }, { status: 'active' }]), { active: 2, completed: 1 });`,
      },
      { name: 'Returns {} for no enrollments', code: `assertEqual(countByStatus([]), {});` },
    ],
    hints: ['Start with an empty object: const counts = {};', 'counts[status] = (counts[status] ?? 0) + 1;'],
    solution: `function countByStatus(enrollments) {\n  const counts = {};\n  for (const { status } of enrollments) {\n    counts[status] = (counts[status] ?? 0) + 1;\n  }\n  return counts;\n}\n`,
  },
  {
    id: 'js-json',
    level: 'Challenge',
    language: 'javascript',
    title: 'Read an API response',
    instructions:
      'An API sends back JSON text like the one in the starter code. Complete `courseTitles(json)` so it returns the titles of the **published** courses, sorted alphabetically. If the text is not valid JSON, return `[]` instead of crashing.',
    starter: `function courseTitles(json) {\n  // your code here\n}\n\nconst response = '{"courses":[{"title":"RAG","status":"published"},{"title":"Agents","status":"draft"},{"title":"APIs","status":"published"}]}';\nconsole.log(courseTitles(response));\n`,
    tests: [
      {
        name: 'Returns the published titles in order',
        code: `assertEqual(courseTitles('{"courses":[{"title":"RAG","status":"published"},{"title":"Agents","status":"draft"},{"title":"APIs","status":"published"}]}'), ['APIs', 'RAG']);`,
      },
      { name: 'Returns [] for invalid JSON', code: `assertEqual(courseTitles('not json'), []);` },
      { name: 'Returns [] when there are no courses', code: `assertEqual(courseTitles('{"courses":[]}'), []);` },
    ],
    hints: ['JSON.parse turns the text into an object; wrap it in try { ... } catch { return []; }.', 'filter by status, map to title, then .sort().'],
    solution: `function courseTitles(json) {\n  try {\n    const data = JSON.parse(json);\n    return (data.courses ?? [])\n      .filter((course) => course.status === 'published')\n      .map((course) => course.title)\n      .sort();\n  } catch {\n    return [];\n  }\n}\n`,
  },
  {
    id: 'js-async',
    level: 'Challenge',
    language: 'javascript',
    title: 'Wait for two requests',
    instructions:
      '`fetchLearner()` and `fetchProgress()` each return a promise (they pretend to call an API). Complete `loadDashboard()` so it waits for **both at the same time** and returns `{ name, percent }`.',
    starter: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nconst fetchLearner = async () => { await wait(200); return { name: 'Amina' }; };\nconst fetchProgress = async () => { await wait(200); return { done: 12, total: 33 }; };\n\nasync function loadDashboard() {\n  // your code here: return { name, percent } with percent rounded to a whole number\n}\n\nconsole.log(await loadDashboard());\n`,
    tests: [
      { name: 'Returns the name and the rounded percentage', code: `assertEqual(await loadDashboard(), { name: 'Amina', percent: 36 });` },
      {
        name: 'Runs both requests at the same time',
        code: `const started = Date.now(); const result = await loadDashboard(); assert(result && result.name, 'loadDashboard() did not return the dashboard yet.'); assert(Date.now() - started < 350, 'Took too long: use Promise.all to wait for both together.');`,
      },
    ],
    hints: ['const [learner, progress] = await Promise.all([fetchLearner(), fetchProgress()]);', 'Math.round(progress.done / progress.total * 100)'],
    solution: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nconst fetchLearner = async () => { await wait(200); return { name: 'Amina' }; };\nconst fetchProgress = async () => { await wait(200); return { done: 12, total: 33 }; };\n\nasync function loadDashboard() {\n  const [learner, progress] = await Promise.all([fetchLearner(), fetchProgress()]);\n  return { name: learner.name, percent: Math.round((progress.done / progress.total) * 100) };\n}\n\nconsole.log(await loadDashboard());\n`,
  },
];

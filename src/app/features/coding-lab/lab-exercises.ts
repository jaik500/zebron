import { CodeExercise, CodeLanguage } from './code-lab.model';

export interface LabExercise extends CodeExercise {
  id: string;
  level: 'Starter' | 'Practice' | 'Challenge';
}

/** Starter templates for new projects on the Coding Lab page. */
export const LAB_TEMPLATES: { id: string; language: CodeLanguage; name: string; code: string }[] = [
  {
    id: 'blank',
    language: 'javascript',
    name: 'Blank',
    code: `// Write JavaScript here, then press Run (Ctrl+Enter).\nconsole.log('Hello, Zebron!');\n`,
  },
  {
    id: 'arrays',
    language: 'javascript',
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
    language: 'javascript',
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
    language: 'javascript',
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
    language: 'javascript',
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

/** Python starter templates. */
export const PYTHON_TEMPLATES: { id: string; language: CodeLanguage; name: string; code: string }[] = [
  {
    id: 'py-blank',
    language: 'python',
    name: 'Blank',
    code: `# Write Python here, then press Run (Ctrl+Enter).\nprint("Hello, Zebron!")\n`,
  },
  {
    id: 'py-lists',
    language: 'python',
    name: 'Lists and loops',
    code: `scores = [72, 95, 58, 88, 64]

passed = [score for score in scores if score >= 70]
average = sum(scores) / len(scores)

print("Passed:", passed)
print(f"Average: {average:.1f}")

for position, score in enumerate(sorted(scores, reverse=True), start=1):
    print(position, score)
`,
  },
  {
    id: 'py-dicts',
    language: 'python',
    name: 'Dictionaries and JSON',
    code: `import json

learner = {"name": "Amina", "course": "Python for AI Engineering", "progress": 0.6}

text = json.dumps(learner)
print(text)

data = json.loads(text)
print(f"{data['name']} is {round(data['progress'] * 100)}% through {data['course']}.")
`,
  },
  {
    id: 'py-functions',
    language: 'python',
    name: 'Functions',
    code: `def greet(name, course):
    return f"Welcome, {name}! Ready for {course}?"


def initials(full_name):
    return "".join(part[0].upper() for part in full_name.split())


print(greet("Jordan", "Prompt Engineering"))
print(initials("jordan lee"))
`,
  },
  {
    id: 'py-classes',
    language: 'python',
    name: 'Classes',
    code: `class Course:
    def __init__(self, title, lessons):
        self.title = title
        self.lessons = lessons
        self.completed = 0

    def complete_lesson(self):
        if self.completed < self.lessons:
            self.completed += 1

    def progress(self):
        return self.completed / self.lessons


course = Course("AI Agents & Workflow Automation", 33)
for _ in range(11):
    course.complete_lesson()
print(f"{course.title}: {course.progress():.0%} done")
`,
  },
];

/** Guided Python exercises. Checks are Python statements (assert ..., "message"). */
export const PYTHON_EXERCISES: LabExercise[] = [
  {
    id: 'py-hello',
    level: 'Starter',
    language: 'python',
    title: 'Say hello',
    instructions: 'Print the exact text `Hello, Zebron!` with `print`.',
    starter: `# Print Hello, Zebron!\n`,
    tests: [{ name: 'Prints "Hello, Zebron!"', code: `assert "Hello, Zebron!" in __output(), 'Nothing printed "Hello, Zebron!" yet.'` }],
    hints: ['print(...) shows whatever you put between the brackets.', 'Text goes in quotes: print("Hello, Zebron!")'],
    solution: `print("Hello, Zebron!")\n`,
  },
  {
    id: 'py-total',
    level: 'Starter',
    language: 'python',
    title: 'Add up a list',
    instructions: 'Complete `total(numbers)` so it returns the sum of the numbers in the list. An empty list adds up to `0`. Try it with a loop, without using the built-in `sum`.',
    starter: `def total(numbers):\n    # your code here\n    pass\n\n\nprint(total([1, 2, 3]))\n`,
    tests: [
      { name: 'total([1, 2, 3]) returns 6', code: `assert total([1, 2, 3]) == 6, f"Got {total([1, 2, 3])!r}"` },
      { name: 'total([]) returns 0', code: `assert total([]) == 0, f"Got {total([])!r}"` },
      { name: 'total([-5, 10, 2.5]) returns 7.5', code: `assert total([-5, 10, 2.5]) == 7.5, f"Got {total([-5, 10, 2.5])!r}"` },
    ],
    hints: ['Start with result = 0, then add each number in a for loop.', 'for number in numbers:\n    result += number'],
    solution: `def total(numbers):\n    result = 0\n    for number in numbers:\n        result += number\n    return result\n`,
  },
  {
    id: 'py-grade',
    level: 'Starter',
    language: 'python',
    title: 'Letter grade',
    instructions: 'Complete `letter_grade(score)`: 90 and above is `"A"`, 80 and above `"B"`, 70 and above `"C"`, 60 and above `"D"`, anything lower `"F"`.',
    starter: `def letter_grade(score):\n    # your code here\n    pass\n`,
    tests: [
      { name: '95 is an A, 90 is an A', code: `assert letter_grade(95) == "A" and letter_grade(90) == "A", "90 and above should be A"` },
      { name: '85 is a B, 72 is a C, 60 is a D', code: `assert [letter_grade(85), letter_grade(72), letter_grade(60)] == ["B", "C", "D"], f"Got {[letter_grade(85), letter_grade(72), letter_grade(60)]}"` },
      { name: '59 is an F', code: `assert letter_grade(59) == "F", f"Got {letter_grade(59)!r}"` },
    ],
    hints: ['Use if / elif / else, starting with the highest grade.', 'if score >= 90:\n    return "A"\nelif score >= 80: ...'],
    solution: `def letter_grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    elif score >= 60:\n        return "D"\n    return "F"\n`,
  },
  {
    id: 'py-passed',
    level: 'Practice',
    language: 'python',
    title: 'Who passed?',
    instructions: 'Each result is a dictionary such as `{"name": "Amina", "score": 82}`. Complete `passed_names(results, pass_mark)` so it returns the **names** of everyone whose score is at least `pass_mark`, in the same order.',
    starter: `def passed_names(results, pass_mark):\n    # your code here\n    pass\n\n\nresults = [\n    {"name": "Amina", "score": 82},\n    {"name": "Jordan", "score": 64},\n    {"name": "Lee", "score": 70},\n]\nprint(passed_names(results, 70))\n`,
    tests: [
      {
        name: 'Returns the names at or above the pass mark',
        code: `assert passed_names([{"name": "Amina", "score": 82}, {"name": "Jordan", "score": 64}, {"name": "Lee", "score": 70}], 70) == ["Amina", "Lee"]`,
      },
      { name: 'Returns [] when nobody passed', code: `assert passed_names([{"name": "Sam", "score": 10}], 50) == []` },
    ],
    hints: ['A list comprehension can filter and pick the name in one line.', '[r["name"] for r in results if r["score"] >= pass_mark]'],
    solution: `def passed_names(results, pass_mark):\n    return [result["name"] for result in results if result["score"] >= pass_mark]\n`,
  },
  {
    id: 'py-words',
    level: 'Practice',
    language: 'python',
    title: 'Count the words',
    instructions: 'Complete `word_counts(text)` so it returns a dictionary of how often each word appears. Ignore upper and lower case, and the punctuation `. , ! ?`.\n\nExample: `word_counts("AI helps. AI learns!")` returns `{"ai": 2, "helps": 1, "learns": 1}`.',
    starter: `def word_counts(text):\n    # your code here\n    pass\n`,
    tests: [
      { name: 'Counts words, ignoring case and punctuation', code: `assert word_counts("AI helps. AI learns!") == {"ai": 2, "helps": 1, "learns": 1}, f"Got {word_counts('AI helps. AI learns!')}"` },
      { name: 'Returns {} for empty text', code: `assert word_counts("") == {}` },
    ],
    hints: ['text.lower() and text.replace(".", "") clean the text; text.split() gives the words.', 'counts[word] = counts.get(word, 0) + 1'],
    solution: `def word_counts(text):\n    for mark in ".,!?":\n        text = text.replace(mark, "")\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n`,
  },
  {
    id: 'py-average',
    level: 'Practice',
    language: 'python',
    title: 'Average score',
    instructions: 'Complete `average(scores)` so it returns the average rounded to **one decimal place**. For an empty list, return `None`.',
    starter: `def average(scores):\n    # your code here\n    pass\n`,
    tests: [
      { name: 'average([70, 80, 95]) returns 81.7', code: `assert average([70, 80, 95]) == 81.7, f"Got {average([70, 80, 95])!r}"` },
      { name: 'average([100]) returns 100', code: `assert average([100]) == 100` },
      { name: 'average([]) returns None', code: `assert average([]) is None, f"Got {average([])!r}"` },
    ],
    hints: ['if not scores: return None', 'round(sum(scores) / len(scores), 1)'],
    solution: `def average(scores):\n    if not scores:\n        return None\n    return round(sum(scores) / len(scores), 1)\n`,
  },
  {
    id: 'py-json',
    level: 'Challenge',
    language: 'python',
    title: 'Read an API response',
    instructions: 'An API sends back JSON text like the one in the starter code. Complete `course_titles(text)` so it returns the titles of the **published** courses, sorted alphabetically. If the text is not valid JSON, return `[]` instead of crashing.',
    starter: `import json\n\n\ndef course_titles(text):\n    # your code here\n    pass\n\n\nresponse = '{"courses": [{"title": "RAG", "status": "published"}, {"title": "Agents", "status": "draft"}, {"title": "APIs", "status": "published"}]}'\nprint(course_titles(response))\n`,
    tests: [
      {
        name: 'Returns the published titles in order',
        code: `assert course_titles('{"courses": [{"title": "RAG", "status": "published"}, {"title": "Agents", "status": "draft"}, {"title": "APIs", "status": "published"}]}') == ["APIs", "RAG"]`,
      },
      { name: 'Returns [] for invalid JSON', code: `assert course_titles("not json") == []` },
      { name: 'Returns [] when there are no courses', code: `assert course_titles('{"courses": []}') == []` },
    ],
    hints: ['json.loads(text) turns the text into a dictionary; catch json.JSONDecodeError.', 'sorted(c["title"] for c in data.get("courses", []) if c["status"] == "published")'],
    solution: `import json\n\n\ndef course_titles(text):\n    try:\n        data = json.loads(text)\n    except json.JSONDecodeError:\n        return []\n    return sorted(course["title"] for course in data.get("courses", []) if course["status"] == "published")\n`,
  },
  {
    id: 'py-class',
    level: 'Challenge',
    language: 'python',
    title: 'A Learner class',
    instructions: 'Write a class `Learner` that takes a `name`. It has a method `add_score(score)` that keeps the score, and a method `best()` that returns the highest score, or `None` if there are no scores yet.',
    starter: `class Learner:\n    # your code here\n    pass\n\n\namina = Learner("Amina")\namina.add_score(72)\namina.add_score(91)\nprint(amina.name, amina.best())\n`,
    tests: [
      { name: 'Keeps the name', code: `assert Learner("Amina").name == "Amina"` },
      { name: 'best() returns the highest score', code: `learner = Learner("Lee")\nlearner.add_score(72)\nlearner.add_score(91)\nlearner.add_score(85)\nassert learner.best() == 91, f"Got {learner.best()!r}"` },
      { name: 'best() returns None with no scores', code: `assert Learner("Sam").best() is None` },
      { name: 'Learners keep separate scores', code: `a, b = Learner("A"), Learner("B")\na.add_score(50)\nassert b.best() is None, "Each learner needs its own list (create it in __init__)."` },
    ],
    hints: ['def __init__(self, name): set self.name and an empty list self.scores.', 'max(self.scores) if self.scores else None'],
    solution: `class Learner:\n    def __init__(self, name):\n        self.name = name\n        self.scores = []\n\n    def add_score(self, score):\n        self.scores.append(score)\n\n    def best(self):\n        return max(self.scores) if self.scores else None\n`,
  },
];

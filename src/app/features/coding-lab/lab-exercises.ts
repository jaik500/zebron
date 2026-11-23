import { CodeExercise, CodeLanguage, WEB_STARTER } from './code-lab.model';

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

/** Web page starter templates (HTML, CSS and JavaScript tabs). */
export const WEB_TEMPLATES: { id: string; language: CodeLanguage; name: string; code: string }[] = [
  {
    id: 'web-blank',
    language: 'web',
    name: 'Blank page',
    code: WEB_STARTER,
  },
  {
    id: 'web-cards',
    language: 'web',
    name: 'Card layout',
    code: `--- html ---
<h1>Courses</h1>
<div class="cards">
  <article class="card">
    <h2>HTML basics</h2>
    <p>Headings, paragraphs, links and images.</p>
  </article>
  <article class="card">
    <h2>CSS styling</h2>
    <p>Colours, spacing and layout with flexbox.</p>
  </article>
  <article class="card">
    <h2>JavaScript</h2>
    <p>Make the page respond to clicks and typing.</p>
  </article>
</div>
--- css ---
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
  background: #f1f5f9;
}

.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 12rem;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-top: 0;
  color: #007979;
}
--- js ---
`,
  },
  {
    id: 'web-interactive',
    language: 'web',
    name: 'Interactive page',
    code: `--- html ---
<h1>Click counter</h1>
<p>You clicked <strong id="count">0</strong> times.</p>
<button id="add">Click me</button>
--- css ---
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 8px;
  background: #007979;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}
--- js ---
let count = 0;
const button = document.querySelector('#add');
const output = document.querySelector('#count');

button.addEventListener('click', () => {
  count++;
  output.textContent = count;
  console.log('Clicked', count, 'times');
});
`,
  },
];

/** Guided web page exercises: checks look at the page in the preview. */
export const WEB_EXERCISES: LabExercise[] = [
  {
    id: 'web-heading',
    level: 'Starter',
    language: 'web',
    title: 'Your first web page',
    instructions: 'Add a main heading (`<h1>`) that says **My first page**, and under it a paragraph (`<p>`) with a sentence about yourself. Watch the preview change as you type.',
    starter: `--- html ---\n<!-- Add an h1 and a p here -->\n`,
    tests: [
      { name: 'The page has an h1 that says "My first page"', code: `assertEqual(text('h1'), 'My first page');` },
      { name: 'The page has a paragraph with some text', code: `assert($('p') && text('p').length > 0, 'Add a <p> with a sentence in it.');` },
    ],
    hints: ['A heading looks like <h1>My first page</h1>.', 'A paragraph looks like <p>I am learning to build web pages.</p>.'],
    solution: `--- html ---\n<h1>My first page</h1>\n<p>I am learning to build web pages on Zebron.</p>\n`,
  },
  {
    id: 'web-list',
    level: 'Starter',
    language: 'web',
    title: 'A list of favourites',
    instructions: 'Under the heading, add an **unordered list** (`<ul>`) with at least **three** items (`<li>`): your favourite foods, places or songs.',
    starter: `--- html ---\n<h1>My favourites</h1>\n`,
    tests: [
      { name: 'The page has an unordered list', code: `assert($('ul'), 'Add a <ul> element.');` },
      { name: 'The list has at least three items', code: `const items = $$('ul li');\nassert(items.length >= 3, \`The list has \${items.length} item(s); add at least 3.\`);` },
      { name: 'Every item has text', code: `assert($$('ul li').every((item) => item.textContent.trim()), 'One of the items is empty.');` },
    ],
    hints: ['A list starts with <ul> and ends with </ul>.', 'Each item goes inside <li> … </li>, between the <ul> tags.'],
    solution: `--- html ---\n<h1>My favourites</h1>\n<ul>\n  <li>Jollof rice</li>\n  <li>Pho</li>\n  <li>Tacos</li>\n</ul>\n`,
  },
  {
    id: 'web-links',
    level: 'Practice',
    language: 'web',
    title: 'Links and images',
    instructions: 'Add a link (`<a>`) to **https://www.w3.org** with the text **Web standards**, and an image (`<img>`) of your choice. Every image needs an `alt` text that describes it for people who can\'t see it.',
    starter: `--- html ---\n<h1>Useful links</h1>\n`,
    tests: [
      { name: 'There is a link to https://www.w3.org', code: `const link = $('a');\nassert(link, 'Add an <a> element.');\nassert(link.getAttribute('href').startsWith('https://www.w3.org'), 'The link\\'s href should be https://www.w3.org');` },
      { name: 'The link text is "Web standards"', code: `assertEqual(text('a'), 'Web standards');` },
      { name: 'There is an image with alt text', code: `const image = $('img');\nassert(image, 'Add an <img> element.');\nassert((image.getAttribute('alt') || '').trim(), 'Give the image an alt="…" description.');` },
    ],
    hints: ['<a href="https://www.w3.org">Web standards</a>', '<img src="https://picsum.photos/300/200" alt="A random landscape photo">'],
    solution: `--- html ---\n<h1>Useful links</h1>\n<p><a href="https://www.w3.org">Web standards</a></p>\n<img src="https://picsum.photos/300/200" alt="A random landscape photo">\n`,
  },
  {
    id: 'web-colors',
    level: 'Practice',
    language: 'web',
    title: 'Colours with CSS',
    instructions: 'In the **CSS** tab, make the heading **teal** (`#007979`) and give the page a light grey background (`#f1f5f9`). Then give the paragraph with the class `note` a left border of **4px** solid teal.',
    starter: `--- html ---\n<h1>Styling with CSS</h1>\n<p>CSS changes how the page looks.</p>\n<p class="note">This note should stand out.</p>\n--- css ---\nbody {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n}\n`,
    tests: [
      { name: 'The heading is teal (#007979)', code: `assertEqual(style('h1', 'color'), color('#007979'), 'Set color: #007979 on h1.');` },
      { name: 'The page background is #f1f5f9', code: `assertEqual(style('body', 'background-color'), color('#f1f5f9'), 'Set background: #f1f5f9 on body.');` },
      { name: 'The note has a 4px solid left border', code: `assertEqual(style('.note', 'border-left-width'), '4px');\nassertEqual(style('.note', 'border-left-style'), 'solid');` },
    ],
    hints: ['h1 { color: #007979; }', 'A class is selected with a dot: .note { border-left: 4px solid #007979; }'],
    solution: `--- html ---\n<h1>Styling with CSS</h1>\n<p>CSS changes how the page looks.</p>\n<p class="note">This note should stand out.</p>\n--- css ---\nbody {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n  background: #f1f5f9;\n}\n\nh1 {\n  color: #007979;\n}\n\n.note {\n  border-left: 4px solid #007979;\n  padding-left: 0.75rem;\n}\n`,
  },
  {
    id: 'web-flex',
    level: 'Practice',
    language: 'web',
    title: 'Side by side with flexbox',
    instructions: 'The three boxes are stacked. In the CSS tab, make `.row` a **flex** container so the boxes sit **side by side**, with a `gap` of at least **12px** between them.',
    starter: `--- html ---\n<div class="row">\n  <div class="box">One</div>\n  <div class="box">Two</div>\n  <div class="box">Three</div>\n</div>\n--- css ---\n.box {\n  padding: 1rem;\n  background: #ccfbf1;\n  border-radius: 8px;\n}\n`,
    tests: [
      { name: '.row is a flex container', code: `assertEqual(style('.row', 'display'), 'flex');` },
      { name: 'There is a gap of at least 12px', code: `const gap = parseFloat(style('.row', 'column-gap'));\nassert(gap >= 12, \`The gap is \${gap || 0}px.\`);` },
      { name: 'The boxes are side by side', code: `const [a, b] = $$('.box').map((box) => box.getBoundingClientRect());\nassert(Math.abs(a.top - b.top) < 2 && b.left > a.left, 'The second box should be to the right of the first.');` },
    ],
    hints: ['.row { display: flex; }', 'Add gap: 12px; (or 1rem) to .row.'],
    solution: `--- html ---\n<div class="row">\n  <div class="box">One</div>\n  <div class="box">Two</div>\n  <div class="box">Three</div>\n</div>\n--- css ---\n.row {\n  display: flex;\n  gap: 1rem;\n}\n\n.box {\n  padding: 1rem;\n  background: #ccfbf1;\n  border-radius: 8px;\n}\n`,
  },
  {
    id: 'web-counter',
    level: 'Challenge',
    language: 'web',
    title: 'A click counter',
    instructions: 'In the **JavaScript** tab, make the button work: each click on `#add` adds 1 to the number shown in `#count`.',
    starter: `--- html ---\n<p>Clicks: <span id="count">0</span></p>\n<button id="add">Add one</button>\n--- css ---\nbody { font-family: system-ui, sans-serif; margin: 2rem; }\n--- js ---\nconst button = document.querySelector('#add');\nconst count = document.querySelector('#count');\n\n// your code here\n`,
    tests: [
      { name: 'The count starts at 0', code: `assertEqual(text('#count'), '0');` },
      { name: 'One click shows 1', code: `click('#add');\nassertEqual(text('#count'), '1');` },
      { name: 'Two more clicks show 3', code: `click('#add');\nclick('#add');\nassertEqual(text('#count'), '3');` },
    ],
    hints: ['button.addEventListener(\'click\', () => { … });', 'Keep a number in a variable, add 1 in the click handler, then set count.textContent.'],
    solution: `--- html ---\n<p>Clicks: <span id="count">0</span></p>\n<button id="add">Add one</button>\n--- css ---\nbody { font-family: system-ui, sans-serif; margin: 2rem; }\n--- js ---\nconst button = document.querySelector('#add');\nconst count = document.querySelector('#count');\nlet clicks = 0;\n\nbutton.addEventListener('click', () => {\n  clicks++;\n  count.textContent = clicks;\n});\n`,
  },
  {
    id: 'web-greeting',
    level: 'Challenge',
    language: 'web',
    title: 'A greeting form',
    instructions: 'When the form is submitted, show **Hello, NAME!** in `#greeting`, using the name typed in `#name`. Stop the page from reloading with `event.preventDefault()`. If the box is empty, show **Please enter your name.**',
    starter: `--- html ---\n<form id="form">\n  <label for="name">Your name</label>\n  <input id="name">\n  <button>Say hello</button>\n</form>\n<p id="greeting"></p>\n--- js ---\nconst form = document.querySelector('#form');\n\n// your code here\n`,
    tests: [
      { name: 'Shows "Hello, Ada!" for Ada', code: `type('#name', 'Ada');\nclick('button');\nawait wait(20);\nassertEqual(text('#greeting'), 'Hello, Ada!');` },
      { name: 'Trims spaces around the name', code: `type('#name', '  Grace  ');\nclick('button');\nawait wait(20);\nassertEqual(text('#greeting'), 'Hello, Grace!');` },
      { name: 'Asks for a name when the box is empty', code: `type('#name', '');\nclick('button');\nawait wait(20);\nassertEqual(text('#greeting'), 'Please enter your name.');` },
    ],
    hints: ["form.addEventListener('submit', (event) => { event.preventDefault(); … });", "const name = document.querySelector('#name').value.trim();"],
    solution: `--- html ---\n<form id="form">\n  <label for="name">Your name</label>\n  <input id="name">\n  <button>Say hello</button>\n</form>\n<p id="greeting"></p>\n--- js ---\nconst form = document.querySelector('#form');\n\nform.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const name = document.querySelector('#name').value.trim();\n  document.querySelector('#greeting').textContent = name ? \`Hello, \${name}!\` : 'Please enter your name.';\n});\n`,
  },
  {
    id: 'web-todo',
    level: 'Challenge',
    language: 'web',
    title: 'A to-do list',
    instructions: 'Clicking **Add** should add the text in `#task` as a new `<li>` in `#list`, then clear the box. Ignore empty tasks.',
    starter: `--- html ---\n<h1>To do</h1>\n<input id="task" placeholder="New task">\n<button id="add">Add</button>\n<ul id="list"></ul>\n--- css ---\nbody { font-family: system-ui, sans-serif; margin: 2rem; }\nli { padding: 0.25rem 0; }\n--- js ---\n// your code here\n`,
    tests: [
      { name: 'Adds a task to the list', code: `type('#task', 'Read lesson 3');\nclick('#add');\nassertEqual($$('#list li').map((item) => item.textContent.trim()), ['Read lesson 3']);` },
      { name: 'Clears the box after adding', code: `type('#task', 'Practise CSS');\nclick('#add');\nassertEqual($('#task').value, '');` },
      { name: 'Ignores empty tasks', code: `const before = $$('#list li').length;\ntype('#task', '   ');\nclick('#add');\nassertEqual($$('#list li').length, before);` },
    ],
    hints: ["document.createElement('li') makes a new item; list.append(item) adds it.", 'Check input.value.trim() before adding, then set input.value = \'\'.'],
    solution: `--- html ---\n<h1>To do</h1>\n<input id="task" placeholder="New task">\n<button id="add">Add</button>\n<ul id="list"></ul>\n--- css ---\nbody { font-family: system-ui, sans-serif; margin: 2rem; }\nli { padding: 0.25rem 0; }\n--- js ---\nconst input = document.querySelector('#task');\nconst list = document.querySelector('#list');\n\ndocument.querySelector('#add').addEventListener('click', () => {\n  const text = input.value.trim();\n  if (!text) return;\n  const item = document.createElement('li');\n  item.textContent = text;\n  list.append(item);\n  input.value = '';\n});\n`,
  },
];

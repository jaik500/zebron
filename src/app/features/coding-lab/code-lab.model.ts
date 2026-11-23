/** Zebron Coding Lab: shared types. */

/**
 * Languages the lab runs, all in the learner's browser. 'web' is a web page
 * (HTML, CSS and JavaScript tabs with a live preview; see web-code.ts).
 */
export type CodeLanguage = 'javascript' | 'python' | 'web';

/** Starting code for a new web exercise or page (all three tabs). */
export const WEB_STARTER = `--- html ---
<h1>Hello, Zebron!</h1>
<p>Change the HTML, CSS and JavaScript tabs. The preview updates as you type.</p>
--- css ---
body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}

h1 {
  color: #007979;
}
--- js ---
console.log('The page is ready.');
`;

export const CODE_LANGUAGES: { value: CodeLanguage; label: string; badge: string; fence: string[]; print: string; starter: string }[] = [
  { value: 'javascript', label: 'JavaScript', badge: 'JS', fence: ['js', 'javascript'], print: 'console.log()', starter: '// Write your code here\n' },
  { value: 'python', label: 'Python', badge: 'PY', fence: ['py', 'python'], print: 'print()', starter: '# Write your code here\n' },
  { value: 'web', label: 'HTML & CSS', badge: 'WEB', fence: ['html'], print: 'console.log()', starter: WEB_STARTER },
];

export function isCodeLanguage(value: unknown): value is CodeLanguage {
  return CODE_LANGUAGES.some((language) => language.value === value);
}

export interface CodeTest {
  /** What the check verifies, shown to the learner ("sum([1, 2, 3]) returns 6"). */
  name: string;
  /** Code run after the learner's code; it fails by throwing (assert, assertEqual). */
  code: string;
}

/** A guided exercise: in a lesson (code block) or on the Coding Lab page. */
export interface CodeExercise {
  language: CodeLanguage;
  title: string;
  /** Light Markdown, like lesson text. */
  instructions: string;
  starter: string;
  tests: CodeTest[];
  hints: string[];
  /** Optional model answer, shown on request after a first attempt. */
  solution: string;
}

export interface OutputLine {
  stream: 'stdout' | 'stderr' | 'system';
  text: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface RunResult {
  output: OutputLine[];
  error: string | null;
  tests: TestResult[];
  timedOut: boolean;
  durationMs: number;
}

/** A learner's saved project (Coding Lab page). */
export interface CodeProject {
  id: string;
  name: string;
  language: CodeLanguage;
  code: string;
  updatedAt: Date | null;
}

/** A learner's saved work on one exercise. */
export interface ExerciseWork {
  code: string;
  passed: boolean;
  passedAt: Date | null;
  updatedAt: Date | null;
}

export const MAX_CODE_LENGTH = 50_000;

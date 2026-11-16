/** Zebron Coding Lab: shared types. */

/** Languages the lab runs. JavaScript first; Python can follow (same model). */
export type CodeLanguage = 'javascript';

export const CODE_LANGUAGES: { value: CodeLanguage; label: string; fence: string[] }[] = [
  { value: 'javascript', label: 'JavaScript', fence: ['js', 'javascript'] },
];

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

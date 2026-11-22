/**
 * "Quiz me on this chapter": which text the questions are written from.
 * The server accepts at most QUIZ_TEXT_MAX characters
 * (functions/src/document-quiz-core.ts QUIZ_LIMITS.maxText).
 */
export const QUIZ_TEXT_MIN = 300;
export const QUIZ_TEXT_MAX = 24_000;

export interface QuizSection {
  text: string;
  /** True when the text is a window of a longer one. */
  partial: boolean;
}

/**
 * The text to quiz on. Short texts are used whole; for longer ones, a window
 * of `max` characters starting a little before where the reader is
 * (`position` 0 to 1), beginning at a sentence.
 */
export function quizSection(text: string, position: number, max: number = QUIZ_TEXT_MAX): QuizSection {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return { text: clean, partial: false };

  const at = Math.min(1, Math.max(0, Number.isFinite(position) ? position : 0));
  let start = Math.round(at * clean.length - max * 0.25);
  start = Math.min(Math.max(0, start), clean.length - max);
  if (start > 0) {
    // Begin at the next sentence, if one starts soon.
    const match = /[.!?…]["'”’)\]]?\s+(?=\S)/g;
    match.lastIndex = start;
    const found = match.exec(clean);
    if (found && found.index - start < 400) start = found.index + found[0].length;
  }
  return { text: clean.slice(start, start + max).trim(), partial: true };
}

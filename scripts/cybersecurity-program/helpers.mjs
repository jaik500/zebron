/**
 * Small builders for the Cybersecurity Program content files.
 *
 * Lesson blocks match the course builder (text and tips are Markdown).
 * Questions match the Test Center question model; option ids use the
 * editor's format (option-a, option-b, …).
 */

export const text = (value) => ({ type: "text", text: dedent(value) });

export const tip = (value) => ({ type: "tip", text: dedent(value) });

/** A quick check at the end of a lesson: answer is the index of the right option. */
export const check = (question, options, answer, explanation) => ({
  type: "check",
  question,
  options,
  answer,
  explanation,
});

const optionId = (index) => `option-${String.fromCharCode(97 + index)}`;
const toOptions = (texts) => texts.map((value, index) => ({ id: optionId(index), text: value }));

/** Multiple choice: one right answer (index into options). */
export const mc = (topic, difficulty, question, options, answer, explanation, hint = null) => ({
  topic,
  difficulty,
  question,
  type: "multiple-choice",
  options: toOptions(options),
  correctAnswer: optionId(answer),
  explanation,
  hint,
});

/** True / false. */
export const tf = (topic, difficulty, statement, answer, explanation, hint = null) => ({
  topic,
  difficulty,
  question: statement,
  type: "true-false",
  options: [
    { id: "true", text: "True" },
    { id: "false", text: "False" },
  ],
  correctAnswer: answer ? "true" : "false",
  explanation,
  hint,
});

/** Multiple answers: every right option (indexes). */
export const ms = (topic, difficulty, question, options, answers, explanation, hint = null) => {
  const correct = [...new Set(answers)].sort((a, b) => a - b).map(optionId);
  return {
    topic,
    difficulty,
    question,
    type: "multiple-select",
    options: toOptions(options),
    correctAnswer: correct.join("|"),
    correctAnswers: correct,
    explanation,
    hint,
  };
};

/** Put in order: give the steps in the right order; learners see them shuffled. */
export const ord = (topic, difficulty, question, steps, explanation, hint = null) => {
  const options = toOptions(steps);
  const order = options.map((option) => option.id);
  return {
    topic,
    difficulty,
    question,
    type: "ordering",
    options,
    correctAnswer: order.join("|"),
    correctOrder: order,
    explanation,
    hint,
  };
};

/** Short answer: accepted answers (case, accents and extra spaces are ignored). */
export const st = (topic, difficulty, question, accepted, explanation, hint = null) => ({
  topic,
  difficulty,
  question,
  type: "short-text",
  options: [],
  correctAnswer: accepted[0],
  acceptedAnswers: accepted,
  explanation,
  hint,
});

/** Number: the answer and the allowed margin either side. */
export const num = (topic, difficulty, question, answer, tolerance, explanation, hint = null) => ({
  topic,
  difficulty,
  question,
  type: "numeric",
  options: [],
  correctAnswer: String(answer),
  numericAnswer: answer,
  numericTolerance: tolerance,
  explanation,
  hint,
});

/** Remove the shared indentation of template literals. */
function dedent(value) {
  const lines = value.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const indent = Math.min(...lines.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length));
  return lines.map((line) => line.slice(indent)).join("\n").trim();
}

import { describe, expect, it } from 'vitest';

import {
  QUIZ_LIMITS,
  cleanQuestions,
  gradeQuiz,
  questionsForLearner,
  shuffleOptions,
  topicId,
} from '../../functions/src/document-quiz-core';
import { quizSection } from '../../src/app/features/documents/document-quiz-section';

/** "Quiz me on this chapter" (My documents reader). */
describe('Document quiz', () => {
  const good = (question: string, answer = 0, topic = 'Cells') => ({
    question,
    options: ['A cell', 'A tissue', 'An organ', 'A system'],
    answer,
    explanation: 'The text says so.',
    topic,
  });

  describe('checking the AI questions', () => {
    it('keeps well-formed questions and numbers them', () => {
      const questions = cleanQuestions([good('What is the smallest unit of life?'), good('Which is made of cells?', 1)]);
      expect(questions.map((question) => question.id)).toEqual(['q1', 'q2']);
      expect(questions[1].answer).toBe(1);
    });

    it('drops questions without four different options or a valid answer', () => {
      const questions = cleanQuestions([
        { ...good('Three options?'), options: ['a', 'b', 'c'] },
        { ...good('Same options?'), options: ['a', 'A', 'b', 'c'] },
        { ...good('Empty option?'), options: ['a', '', 'b', 'c'] },
        { ...good('Answer out of range?'), answer: 4 },
        { ...good('Answer as text?'), answer: '1' },
        good('Fine question?'),
        good('fine question?'),
        null,
        'text',
      ]);
      expect(questions.map((question) => question.question)).toEqual(['Fine question?']);
    });

    it('stops at the number asked for and gives untitled topics a name', () => {
      const many = Array.from({ length: 12 }, (_, index) => ({ ...good(`Question ${index}?`), topic: '' }));
      const questions = cleanQuestions(many, 5);
      expect(questions).toHaveLength(5);
      expect(questions[0].topic).toBe('General');
      expect(cleanQuestions(many)).toHaveLength(QUIZ_LIMITS.maxQuestions);
    });

    it('trims long texts', () => {
      const [question] = cleanQuestions([{ ...good('x'.repeat(1000)), explanation: 'y'.repeat(1000) }]);
      expect(question.question.length).toBe(QUIZ_LIMITS.question);
      expect(question.explanation.length).toBe(QUIZ_LIMITS.explanation);
    });
  });

  it('moves the right answer with the shuffled options', () => {
    const [question] = cleanQuestions([good('Which is the smallest?', 0)]);
    let seed = 0.37;
    const random = () => (seed = (seed * 9301 + 49297) % 1);
    const [shuffled] = shuffleOptions([question], random);
    expect(shuffled.options.slice().sort()).toEqual(question.options.slice().sort());
    expect(shuffled.options[shuffled.answer]).toBe('A cell');
  });

  it('never sends answers or explanations to the browser before grading', () => {
    const learner = questionsForLearner(cleanQuestions([good('Which?')]));
    expect(Object.keys(learner[0]).sort()).toEqual(['id', 'options', 'question', 'topic']);
  });

  describe('grading', () => {
    const questions = cleanQuestions([
      good('One?', 0, 'Cells'),
      good('Two?', 1, 'Cells'),
      good('Three?', 2, 'Organs'),
      good('Four?', 3, 'Organs'),
    ]);

    it('scores right, wrong and skipped answers and groups them by topic', () => {
      const grade = gradeQuiz(questions, [0, 0, null, 3]);
      expect(grade.correctAnswers).toBe(2);
      expect(grade.answeredQuestions).toBe(3);
      expect(grade.scorePercentage).toBe(50);
      expect(grade.topicPerformance).toEqual([
        { topicId: 'cells', topicName: 'Cells', answeredQuestions: 2, correctAnswers: 1 },
        { topicId: 'organs', topicName: 'Organs', answeredQuestions: 1, correctAnswers: 1 },
      ]);
      expect(grade.questions[2]).toMatchObject({ chosen: null, correct: false });
    });

    it('treats bad answers as skipped', () => {
      const grade = gradeQuiz(questions, [7, -1, 'a', 1.5]);
      expect(grade.answeredQuestions).toBe(0);
      expect(grade.scorePercentage).toBe(0);
      expect(gradeQuiz(questions, 'nonsense').answeredQuestions).toBe(0);
    });

    it('makes stable topic ids', () => {
      expect(topicId('Cell división & growth')).toBe('cell-division-growth');
      expect(topicId('***')).toBe('general');
    });
  });

  describe('choosing the text to quiz on', () => {
    const words = (count: number, word = 'word') => Array.from({ length: count }, (_, index) => `${word}${index}.`).join(' ');

    it('uses a short document whole', () => {
      const text = words(100);
      expect(quizSection(text, 0.9)).toEqual({ text, partial: false });
    });

    it('takes a window from where the reader is in a long document, starting at a sentence', () => {
      const text = words(6000);
      const section = quizSection(text, 0.5, 2000);
      expect(section.partial).toBe(true);
      expect(section.text.length).toBeLessThanOrEqual(2000);
      expect(section.text.startsWith('word')).toBe(true);
      expect(text.indexOf(section.text)).toBeGreaterThan(text.length * 0.4);
    });

    it('keeps the window inside the text at the end', () => {
      const text = words(6000);
      const section = quizSection(text, 1, 2000);
      expect(text.endsWith(section.text)).toBe(true);
    });

    it('collapses white space', () => {
      expect(quizSection('  a \n\n b\tc ', 0).text).toBe('a b c');
    });
  });
});

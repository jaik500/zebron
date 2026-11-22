import { describe, expect, it } from 'vitest';

import {
  QuizResultLike,
  quizOverview,
  summarizeQuizzes,
  topicsToReview,
} from '../../src/app/features/courses/quiz-tracking';

/** Quiz tracking on My learning. */
describe('Quiz tracking', () => {
  const result = (id: string, quizId: string, score: number, day: number, overrides: Partial<QuizResultLike> = {}): QuizResultLike => ({
    id,
    quizId,
    quizName: `Quiz ${quizId}`,
    scorePercentage: score,
    mode: 'practice',
    completedAt: new Date(2026, 10, day),
    topicPerformance: [],
    ...overrides,
  });

  it('gives an empty overview without results', () => {
    expect(quizOverview([])).toEqual({ attempts: 0, quizzes: 0, average: null });
  });

  it('counts attempts and quizzes and averages the scores', () => {
    const overview = quizOverview([result('1', 'a', 50, 1), result('2', 'a', 70, 2), result('3', 'b', 91, 3)]);
    expect(overview).toEqual({ attempts: 3, quizzes: 2, average: 70 });
  });

  it('summarizes each quiz with best, latest and attempts, newest quiz first', () => {
    const summaries = summarizeQuizzes([
      result('1', 'a', 80, 1),
      result('2', 'a', 60, 5),
      result('3', 'b', 40, 3),
    ]);
    expect(summaries.map((quiz) => quiz.quizId)).toEqual(['a', 'b']);
    expect(summaries[0].attempts).toBe(2);
    expect(summaries[0].best).toBe(80);
    expect(summaries[0].latest).toBe(60);
    expect(summaries[0].trend).toBe('down');
    expect(summaries[1].trend).toBeNull();
  });

  it('marks small changes as the same and bigger ones as up', () => {
    expect(summarizeQuizzes([result('1', 'a', 70, 1), result('2', 'a', 73, 2)])[0].trend).toBe('same');
    expect(summarizeQuizzes([result('1', 'a', 70, 1), result('2', 'a', 75, 2)])[0].trend).toBe('up');
  });

  it('flags exams and keeps the course of a course final exam', () => {
    const [summary] = summarizeQuizzes([
      result('1', 'x', 85, 2, { mode: 'exam', source: 'course', courseId: 'python-basics', courseTitle: 'Python basics' }),
    ]);
    expect(summary.hasExam).toBe(true);
    expect(summary.source).toBe('course');
    expect(summary.courseId).toBe('python-basics');
  });

  it('keeps scores between 0 and 100', () => {
    const [summary] = summarizeQuizzes([result('1', 'a', 140, 1), result('2', 'a', Number.NaN, 2)]);
    expect(summary.best).toBe(100);
    expect(summary.latest).toBe(0);
  });

  it('lists the weakest topics across attempts, lowest first', () => {
    const topics = (rows: [string, number, number][]) =>
      rows.map(([topicId, answeredQuestions, correctAnswers]) => ({ topicId, topicName: topicId.toUpperCase(), answeredQuestions, correctAnswers }));
    const review = topicsToReview([
      result('1', 'a', 50, 1, { topicPerformance: topics([['loops', 4, 1], ['types', 4, 4], ['io', 2, 0]]) }),
      result('2', 'a', 60, 2, { topicPerformance: topics([['loops', 4, 3], ['classes', 5, 2]]) }),
    ]);
    // loops 4/8 = 50%, classes 2/5 = 40%; types is strong; io has too few answers.
    expect(review.map((topic) => topic.topicId)).toEqual(['classes', 'loops']);
    expect(review[1].percentage).toBe(50);
    expect(review[1].answered).toBe(8);
  });

  it('keeps the same topic name in different quizzes apart', () => {
    const weak = [{ topicId: 'basics', topicName: 'Basics', answeredQuestions: 5, correctAnswers: 1 }];
    const review = topicsToReview([
      result('1', 'a', 20, 1, { topicPerformance: weak }),
      result('2', 'b', 20, 2, { topicPerformance: weak }),
    ]);
    expect(review).toHaveLength(2);
  });

  it('groups reader quizzes by document and keeps the document for its link', () => {
    const [summary] = summarizeQuizzes([
      result('1', 'document:d1', 40, 1, { source: 'document', documentId: 'd1', quizName: 'Biology notes' }),
      result('2', 'document:d1', 80, 2, { source: 'document', documentId: 'd1', quizName: 'Biology notes' }),
    ]);
    expect(summary).toMatchObject({ quizId: 'document:d1', attempts: 2, best: 80, source: 'document', documentId: 'd1', courseId: null });
  });
});

/**
 * Quiz tracking on My learning: pure functions that turn a learner's
 * `quizResults` into a per-quiz summary and a short list of topics to review.
 *
 * Results come from the Test Center (practice and exams), course final exams,
 * certification exams and "Quiz me" in the My documents reader (Zebron only;
 * one entry per document, quizId `document:<id>`). My learning reads only the learner's own results
 * for the current place: the organization's on its pages, Zebron's on /courses.
 */

/** The fields of a `quizResults` document that tracking needs. */
export interface QuizResultLike {
  id: string;
  quizId: string;
  quizName: string;
  scorePercentage: number;
  mode: 'practice' | 'exam';
  source?: QuizSource;
  completedAt: Date | null;
  topicPerformance: { topicId: string; topicName: string; answeredQuestions: number; correctAnswers: number }[];
  /** Course final exams record their course. */
  courseId?: string | null;
  courseTitle?: string | null;
  /** Reader quizzes record their document. */
  documentId?: string | null;
}

export type QuizSource = 'test-center' | 'course' | 'certification' | 'document';

export type QuizTrend = 'up' | 'down' | 'same';

export interface QuizSummary {
  quizId: string;
  quizName: string;
  attempts: number;
  best: number;
  latest: number;
  /** Compared with the attempt before the latest; null after one attempt. */
  trend: QuizTrend | null;
  lastTaken: Date | null;
  /** At least one attempt was an exam. */
  hasExam: boolean;
  source: QuizSource;
  courseId: string | null;
  courseTitle: string | null;
  documentId: string | null;
}

export interface TopicToReview {
  quizId: string;
  quizName: string;
  topicId: string;
  topicName: string;
  answered: number;
  correct: number;
  percentage: number;
}

export interface QuizOverview {
  /** Every recorded attempt. */
  attempts: number;
  /** Different quizzes taken. */
  quizzes: number;
  /** Average score of all attempts, rounded; null without attempts. */
  average: number | null;
}

/** A change of at least this many points counts as up or down. */
export const TREND_THRESHOLD = 5;
/** Topics scoring below this percentage are worth reviewing. */
export const REVIEW_BELOW = 70;

const time = (date: Date | null) => date?.getTime() ?? 0;
const score = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0);

export function quizOverview(results: readonly QuizResultLike[]): QuizOverview {
  if (!results.length) return { attempts: 0, quizzes: 0, average: null };
  const total = results.reduce((sum, result) => sum + score(result.scorePercentage), 0);
  return {
    attempts: results.length,
    quizzes: new Set(results.map((result) => result.quizId)).size,
    average: Math.round(total / results.length),
  };
}

/** One entry per quiz, most recently taken first. */
export function summarizeQuizzes(results: readonly QuizResultLike[]): QuizSummary[] {
  const byQuiz = new Map<string, QuizResultLike[]>();
  for (const result of results) {
    if (!result.quizId) continue;
    byQuiz.set(result.quizId, [...(byQuiz.get(result.quizId) ?? []), result]);
  }

  return [...byQuiz.values()]
    .map((attempts) => {
      const ordered = [...attempts].sort((a, b) => time(b.completedAt) - time(a.completedAt));
      const latest = ordered[0];
      const previous = ordered[1];
      let trend: QuizTrend | null = null;
      if (previous) {
        const change = score(latest.scorePercentage) - score(previous.scorePercentage);
        trend = change >= TREND_THRESHOLD ? 'up' : change <= -TREND_THRESHOLD ? 'down' : 'same';
      }
      const withCourse = ordered.find((result) => result.courseId);
      return {
        quizId: latest.quizId,
        quizName: latest.quizName || withCourse?.courseTitle || '',
        attempts: ordered.length,
        best: Math.round(Math.max(...ordered.map((result) => score(result.scorePercentage)))),
        latest: Math.round(score(latest.scorePercentage)),
        trend,
        lastTaken: latest.completedAt,
        hasExam: ordered.some((result) => result.mode === 'exam'),
        source: latest.source ?? 'test-center',
        courseId: withCourse?.courseId ?? null,
        courseTitle: withCourse?.courseTitle ?? null,
        documentId: ordered.find((result) => result.documentId)?.documentId ?? null,
      };
    })
    .sort((a, b) => time(b.lastTaken) - time(a.lastTaken));
}

/**
 * The weakest topics across all attempts: topics with at least `minAnswered`
 * answered questions scoring below REVIEW_BELOW, lowest first.
 */
export function topicsToReview(
  results: readonly QuizResultLike[],
  { limit = 5, minAnswered = 3 }: { limit?: number; minAnswered?: number } = {},
): TopicToReview[] {
  const byTopic = new Map<string, TopicToReview>();
  for (const result of results) {
    for (const topic of result.topicPerformance ?? []) {
      if (!topic.topicId || !(topic.answeredQuestions > 0)) continue;
      const key = `${result.quizId}\u0000${topic.topicId}`;
      const entry = byTopic.get(key) ?? {
        quizId: result.quizId,
        quizName: result.quizName,
        topicId: topic.topicId,
        topicName: topic.topicName || topic.topicId,
        answered: 0,
        correct: 0,
        percentage: 0,
      };
      entry.answered += topic.answeredQuestions;
      entry.correct += Math.min(topic.correctAnswers, topic.answeredQuestions);
      byTopic.set(key, entry);
    }
  }

  return [...byTopic.values()]
    .map((entry) => ({ ...entry, percentage: Math.round((entry.correct / entry.answered) * 100) }))
    .filter((entry) => entry.answered >= minAnswered && entry.percentage < REVIEW_BELOW)
    .sort((a, b) => a.percentage - b.percentage || b.answered - a.answered)
    .slice(0, limit);
}

/**
 * Firestore still stores a quiz reference under its original field name,
 * `courseId`, on topics, questions, attempts and results. In code the same
 * value is called `quizId`. These helpers convert at the read/write boundary
 * so the rest of the app only ever sees `quizId`.
 *
 * Queries keep using the stored name: `where(STORED_QUIZ_ID_FIELD, ...)`.
 */
export const STORED_QUIZ_ID_FIELD = 'courseId';

/** Stored document data → model shape (`courseId` becomes `quizId`). */
export function withQuizId<T>(data: Record<string, unknown>): T {
  const { courseId, ...rest } = data;

  return {
    ...rest,
    quizId: (rest['quizId'] as unknown) ?? courseId,
  } as T;
}

/** Model-shaped payload → stored shape (`quizId` becomes `courseId`). */
export function toStoredQuizId<T extends object>(
  payload: T,
): Record<string, unknown> {
  const { quizId, ...rest } = payload as T & { quizId?: unknown };

  return quizId === undefined
    ? { ...rest }
    : { ...rest, courseId: quizId };
}

import { Injectable } from '@angular/core';

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { Course, Lesson, progressId } from '../course.model';

/**
 * Course flashcards: every lesson's Quick Check questions become cards,
 * with no extra authoring. Front: the question. Back: the correct answer
 * and its explanation.
 *
 * Spaced repetition (Leitner boxes): "Got it" moves a card up a box and
 * shows it again later (1, 3, 7, 16, then 35 days); "Again" sends it back
 * to box 1 and repeats it this session. A learner's boxes are kept in
 * users/{uid}/flashcards/{progressId}: { courseId, organizationId,
 * cards: { <cardId>: { b: box, d: due ms } }, updatedAt }.
 */

export interface Flashcard {
  /** "<lessonId>~<block>~<question>": stable while the lesson keeps its checks in order. */
  id: string;
  lessonId: string;
  lessonTitle: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface CardState {
  /** Leitner box, 1 (new or missed) to 5 (well known). */
  b: number;
  /** When the card is due again (ms). */
  d: number;
}

export const BOX_COUNT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Days until the next review after "Got it", by the box the card moves into. */
const INTERVAL_DAYS: Record<number, number> = { 2: 1, 3: 3, 4: 7, 5: 16 };
const MASTERED_INTERVAL_DAYS = 35;
/** Firestore document limit, with plenty of room (see firestore.rules). */
export const MAX_SAVED_CARDS = 500;

/** Every Quick Check question in the course's lessons, in lesson order. */
export function buildDeck(lessons: Lesson[]): Flashcard[] {
  const cards: Flashcard[] = [];
  for (const lesson of lessons) {
    lesson.blocks.forEach((block, blockIndex) => {
      if (block.type !== 'check') return;
      const questions = block.questions ?? [{ question: block.question, options: block.options, answer: block.answer, explanation: block.explanation }];
      questions.forEach((item, questionIndex) => {
        const answer = item.options?.[item.answer];
        if (!item.question?.trim() || !answer?.trim()) return;
        cards.push({
          id: `${lesson.id}~${blockIndex}~${questionIndex}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          question: item.question.trim(),
          answer: answer.trim(),
          explanation: (item.explanation ?? '').trim(),
        });
      });
    });
  }
  return cards;
}

/** The state after an answer. */
export function nextState(current: CardState | undefined, knewIt: boolean, now = Date.now()): CardState {
  if (!knewIt) return { b: 1, d: now };
  const box = Math.min(BOX_COUNT, (current?.b ?? 1) + 1);
  const days = (current?.b ?? 0) >= BOX_COUNT ? MASTERED_INTERVAL_DAYS : INTERVAL_DAYS[box] ?? 1;
  return { b: box, d: now + days * DAY_MS };
}

/** New cards (never seen) and cards whose review date has come. */
export function isDue(state: CardState | undefined, now = Date.now()): boolean {
  return !state || state.d <= now;
}

@Injectable({ providedIn: 'root' })
export class FlashcardService {
  private ref(uid: string, course: Pick<Course, 'id' | 'organizationId'>) {
    return doc(firestore, 'users', uid, 'flashcards', progressId(course));
  }

  async load(uid: string, course: Pick<Course, 'id' | 'organizationId'>): Promise<Record<string, CardState>> {
    const snapshot = await getDoc(this.ref(uid, course));
    const cards = (snapshot.data()?.['cards'] ?? {}) as Record<string, unknown>;
    const result: Record<string, CardState> = {};
    for (const [id, value] of Object.entries(cards)) {
      const state = value as Partial<CardState>;
      if (typeof state?.b === 'number' && typeof state?.d === 'number') result[id] = { b: state.b, d: state.d };
    }
    return result;
  }

  /** Saves every card's state (only cards that still exist in the course). */
  async save(uid: string, course: Pick<Course, 'id' | 'organizationId'>, states: Record<string, CardState>, cardIds: Set<string>): Promise<void> {
    const cards = Object.fromEntries(
      Object.entries(states)
        .filter(([id]) => cardIds.has(id))
        .slice(0, MAX_SAVED_CARDS),
    );
    await setDoc(this.ref(uid, course), {
      courseId: course.id,
      organizationId: course.organizationId ?? null,
      cards,
      updatedAt: serverTimestamp(),
    });
  }
}

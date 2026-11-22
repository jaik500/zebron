import type { Signal } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

import type { TextAnchor } from './annotation-anchoring';

/**
 * Personal study tools in lessons: highlights, notes and lesson bookmarks.
 *
 * Stored privately per learner in users/{uid}/courseAnnotations/{id}
 * (firestore.rules: only the learner reads or writes them).
 *
 * A highlight remembers the highlighted words (quote) and a little text on
 * each side (prefix, suffix), not character positions, so it finds its
 * place again after the author edits the lesson. blockIndex is only a hint.
 */
export type AnnotationKind = 'highlight' | 'note' | 'bookmark';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface CourseAnnotation {
  id: string;
  kind: AnnotationKind;
  /** progressId(course): "<courseId>" for Zebron courses, "<orgId>__<courseId>" for organization courses. */
  courseKey: string;
  courseId: string;
  organizationId: string | null;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** Lesson section the text was in when saved (a hint for finding it again). -1 for bookmarks. */
  blockIndex: number;
  /** Highlighted words ('' for bookmarks). */
  quote: string;
  prefix: string;
  suffix: string;
  /** Highlights only. */
  color: HighlightColor | null;
  /** The learner's note ('' when none). */
  note: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** Limits, kept in step with firestore.rules (users/{uid}/courseAnnotations). */
export const ANNOTATION_LIMITS = {
  quote: 1000,
  context: 64,
  note: 2000,
  title: 200,
  id: 300,
} as const;

export interface HighlightColorOption {
  color: HighlightColor;
  /** What the colour means (shown and read out, never colour alone). */
  label: string;
  icon: string;
  /** Mark background in the lesson. */
  background: string;
  /** Swatch and accents (darker, for borders and icons). */
  accent: string;
}

export const HIGHLIGHT_COLORS: readonly HighlightColorOption[] = [
  { color: 'yellow', label: 'Important concept', icon: 'star', background: '#fef08a', accent: '#a16207' },
  { color: 'green', label: 'Key definition', icon: 'menu_book', background: '#bbf7d0', accent: '#15803d' },
  { color: 'blue', label: 'Example or explanation', icon: 'lightbulb', background: '#bfdbfe', accent: '#1d4ed8' },
  { color: 'pink', label: 'Review later', icon: 'replay', background: '#fbcfe8', accent: '#be185d' },
];

/** What the painter and the toolbar need from a highlight or note (lessons and My documents). */
export type PaintableAnnotation = Pick<CourseAnnotation, 'id' | 'kind' | 'blockIndex' | 'quote' | 'prefix' | 'suffix' | 'color' | 'note'>;

/**
 * Where the highlight toolbar saves. Lessons use AnnotationService (the
 * default, nothing to provide). Other readers, such as My documents, provide
 * their own store:
 *
 *   providers: [HighlightPainter, { provide: AnnotationStore, useExisting: DocumentAnnotationStore }]
 */
export abstract class AnnotationStore {
  abstract readonly annotations: Signal<readonly PaintableAnnotation[]>;
  /** False while signed out or before the reader is ready. */
  abstract readonly available: Signal<boolean>;
  abstract add(blockIndex: number, anchor: TextAnchor, color: HighlightColor | null, note?: string): Promise<unknown>;
  abstract setColor(id: string, color: HighlightColor | null): Promise<void>;
  abstract setNote(id: string, note: string): Promise<void>;
  abstract remove(id: string): Promise<void>;
}

export function highlightOption(color: HighlightColor | null): HighlightColorOption | null {
  return HIGHLIGHT_COLORS.find((option) => option.color === color) ?? null;
}

/** Bookmarks have a fixed ID per lesson, so the bookmark button can toggle it. */
export function bookmarkId(courseKey: string, lessonId: string): string {
  return `bookmark__${courseKey}__${lessonId}`.slice(0, ANNOTATION_LIMITS.id);
}

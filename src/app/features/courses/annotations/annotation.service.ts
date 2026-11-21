import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { Course, Lesson, progressId } from '../course.model';
import {
  ANNOTATION_LIMITS,
  AnnotationKind,
  CourseAnnotation,
  HighlightColor,
  bookmarkId,
} from './annotation.model';
import { TextAnchor } from './annotation-anchoring';

/**
 * A learner's highlights, notes and bookmarks for the open course
 * (users/{uid}/courseAnnotations, private to the learner).
 *
 * The lesson player calls watch(course) when a course opens; the list
 * stays live (other tabs and devices update it) until watch(null).
 */
@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly auth = inject(AuthService);
  private readonly logger = inject(LoggerService);

  private readonly course = signal<Pick<Course, 'id' | 'organizationId' | 'title'> | null>(null);
  private readonly items = signal<CourseAnnotation[]>([]);
  private readonly loadedState = signal(false);

  /** Annotations for the open course, in lesson order then newest first within a lesson is up to callers. */
  readonly annotations = this.items.asReadonly();
  readonly loaded = this.loadedState.asReadonly();

  /** The learner is signed in: annotations can be saved. */
  readonly available = computed(() => !!this.auth.firebaseUser() && !!this.course());

  readonly courseKey = computed(() => {
    const course = this.course();
    return course ? progressId(course) : '';
  });

  private unsubscribe: Unsubscribe | null = null;

  /**
   * Ask before removing from My learning (users/{uid}/preferences/study).
   * On until the learner ticks "Don't ask me again".
   */
  private readonly confirmRemovalState = signal(true);
  readonly confirmRemoval = this.confirmRemovalState.asReadonly();

  constructor() {
    // Re-subscribe when the course or the signed-in person changes.
    effect(() => {
      const uid = this.auth.firebaseUser()?.uid ?? null;
      const key = this.courseKey();
      untracked(() => this.subscribe(uid, key));
    });
    effect(() => {
      const uid = this.auth.firebaseUser()?.uid ?? null;
      untracked(() => void this.loadPreferences(uid));
    });
    inject(DestroyRef).onDestroy(() => this.unsubscribe?.());
  }

  /** Start (or stop, with null) following a course's annotations. */
  watch(course: Pick<Course, 'id' | 'organizationId' | 'title'> | null): void {
    const current = this.course();
    if (current && course && current.id === course.id && current.organizationId === course.organizationId) {
      if (current.title !== course.title) this.course.set(course);
      return;
    }
    this.course.set(course);
  }

  private subscribe(uid: string | null, key: string): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.items.set([]);
    this.loadedState.set(false);
    if (!uid || !key) return;

    this.unsubscribe = onSnapshot(
      query(collection(firestore, 'users', uid, 'courseAnnotations'), where('courseKey', '==', key)),
      (snapshot) => {
        this.items.set(snapshot.docs.map((document) => toAnnotation(document.id, document.data())));
        this.loadedState.set(true);
      },
      (error) => {
        this.logger.error('AnnotationService', 'Could not load highlights and notes.', error, { courseKey: key });
        this.loadedState.set(true);
      },
    );
  }

  /**
   * The learner's most recent highlights, notes and bookmarks across all
   * courses (My learning). One read of up to `max` documents.
   */
  async listRecent(max = 300): Promise<CourseAnnotation[]> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return [];
    const snapshot = await getDocs(
      query(collection(firestore, 'users', uid, 'courseAnnotations'), orderBy('updatedAt', 'desc'), limit(max)),
    );
    return snapshot.docs.map((document) => toAnnotation(document.id, document.data()));
  }

  private async loadPreferences(uid: string | null): Promise<void> {
    this.confirmRemovalState.set(true);
    if (!uid) return;
    try {
      const snapshot = await getDoc(doc(firestore, 'users', uid, 'preferences', 'study'));
      this.confirmRemovalState.set(snapshot.get('confirmRemoveFromMyLearning') !== false);
    } catch (error) {
      // Keep asking: the safe default.
      this.logger.error('AnnotationService', 'Could not load study preferences.', error);
    }
  }

  /** Turn the "Remove from My learning?" question on or off for this learner. */
  async setConfirmRemoval(value: boolean): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'preferences', 'study'), {
      confirmRemoveFromMyLearning: value,
      updatedAt: serverTimestamp(),
    });
    this.confirmRemovalState.set(value);
  }

  forLesson(lessonId: string): CourseAnnotation[] {
    return this.items().filter((item) => item.lessonId === lessonId);
  }

  isBookmarked(lessonId: string): boolean {
    const key = this.courseKey();
    return this.items().some((item) => item.kind === 'bookmark' && item.id === bookmarkId(key, lessonId));
  }

  // ------------------------------------------------------------------
  // Changes
  // ------------------------------------------------------------------

  /** Save a highlight (color) or a note (color null, note text). Returns the new ID. */
  async add(
    lesson: Pick<Lesson, 'id' | 'title'>,
    blockIndex: number,
    anchor: TextAnchor,
    color: HighlightColor | null,
    note = '',
  ): Promise<string> {
    const kind: AnnotationKind = color ? 'highlight' : 'note';
    const ref = doc(this.collectionRef());
    await setDoc(ref, {
      ...this.base(kind, lesson, blockIndex),
      quote: anchor.quote.slice(0, ANNOTATION_LIMITS.quote),
      prefix: anchor.prefix.slice(-ANNOTATION_LIMITS.context),
      suffix: anchor.suffix.slice(0, ANNOTATION_LIMITS.context),
      color,
      note: note.trim().slice(0, ANNOTATION_LIMITS.note),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Change a highlight's colour, or turn a note into a highlight (and back with null). */
  async setColor(id: string, color: HighlightColor | null): Promise<void> {
    await updateDoc(doc(this.collectionRef(), id), {
      color,
      kind: color ? 'highlight' : 'note',
      updatedAt: serverTimestamp(),
    });
  }

  async setNote(id: string, note: string): Promise<void> {
    await updateDoc(doc(this.collectionRef(), id), {
      note: note.trim().slice(0, ANNOTATION_LIMITS.note),
      updatedAt: serverTimestamp(),
    });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef(), id));
  }

  /** Put back an annotation that was just removed (Undo). It keeps its ID; its dates are new. */
  async restore(item: CourseAnnotation): Promise<void> {
    await setDoc(doc(this.collectionRef(), item.id), {
      kind: item.kind,
      courseKey: item.courseKey,
      courseId: item.courseId,
      organizationId: item.organizationId,
      courseTitle: item.courseTitle,
      lessonId: item.lessonId,
      lessonTitle: item.lessonTitle,
      blockIndex: item.blockIndex,
      quote: item.quote,
      prefix: item.prefix,
      suffix: item.suffix,
      color: item.color,
      note: item.note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Bookmark the lesson, or remove its bookmark. Returns the new state. */
  async toggleBookmark(lesson: Pick<Lesson, 'id' | 'title'>): Promise<boolean> {
    const id = bookmarkId(this.courseKey(), lesson.id);
    const ref = doc(this.collectionRef(), id);
    if (this.isBookmarked(lesson.id)) {
      await deleteDoc(ref);
      return false;
    }
    await setDoc(ref, {
      ...this.base('bookmark', lesson, -1),
      quote: '',
      prefix: '',
      suffix: '',
      color: null,
      note: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  }

  private base(kind: AnnotationKind, lesson: Pick<Lesson, 'id' | 'title'>, blockIndex: number) {
    const course = this.course();
    if (!course) throw new Error('No course is open.');
    return {
      kind,
      courseKey: this.courseKey(),
      courseId: course.id,
      organizationId: course.organizationId ?? null,
      courseTitle: (course.title ?? '').slice(0, ANNOTATION_LIMITS.title),
      lessonId: lesson.id,
      lessonTitle: (lesson.title ?? '').slice(0, ANNOTATION_LIMITS.title),
      blockIndex,
    };
  }

  private collectionRef() {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) throw new Error('Sign in to save highlights and notes.');
    return collection(firestore, 'users', uid, 'courseAnnotations');
  }
}

function toAnnotation(id: string, data: Record<string, unknown>): CourseAnnotation {
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const color = data['color'];
  return {
    id,
    kind: (['highlight', 'note', 'bookmark'].includes(text(data['kind'])) ? data['kind'] : 'highlight') as AnnotationKind,
    courseKey: text(data['courseKey']),
    courseId: text(data['courseId']),
    organizationId: typeof data['organizationId'] === 'string' ? (data['organizationId'] as string) : null,
    courseTitle: text(data['courseTitle']),
    lessonId: text(data['lessonId']),
    lessonTitle: text(data['lessonTitle']),
    blockIndex: typeof data['blockIndex'] === 'number' ? (data['blockIndex'] as number) : -1,
    quote: text(data['quote']),
    prefix: text(data['prefix']),
    suffix: text(data['suffix']),
    color: color === 'yellow' || color === 'green' || color === 'blue' || color === 'pink' ? color : null,
    note: text(data['note']),
    createdAt: (data['createdAt'] as CourseAnnotation['createdAt']) ?? null,
    updatedAt: (data['updatedAt'] as CourseAnnotation['updatedAt']) ?? null,
  };
}

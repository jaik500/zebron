import { Injectable, inject } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { AuthService } from '../../core/services/auth.service';
import { firestore } from '../../core/services/firebase-config';

import { CodeLanguage, CodeProject, ExerciseWork, MAX_CODE_LENGTH } from './code-lab.model';

/**
 * Learners' Coding Lab work, private to each learner:
 *
 *   users/{uid}/codeLabProjects/{projectId}   saved projects (Coding Lab page)
 *   users/{uid}/codeLabExercises/{key}        work on an exercise, and whether it passed
 *
 * Exercise keys: "lab__<exerciseId>" on the Coding Lab page,
 * "<courseId>__<lessonId>__<blockId>" in lessons.
 */
@Injectable({ providedIn: 'root' })
export class CodeLabStorageService {
  private readonly auth = inject(AuthService);

  private uid(): string | null {
    return this.auth.firebaseUser()?.uid ?? null;
  }

  get signedIn(): boolean {
    return this.uid() !== null;
  }

  // ---------- Exercises ----------

  async loadExercise(key: string): Promise<ExerciseWork | null> {
    const uid = this.uid();
    if (!uid) return null;
    const snapshot = await getDoc(doc(firestore, 'users', uid, 'codeLabExercises', safeKey(key)));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      code: typeof data['code'] === 'string' ? data['code'] : '',
      passed: data['passed'] === true,
      passedAt: toDate(data['passedAt']),
      updatedAt: toDate(data['updatedAt']),
    };
  }

  /** Save the learner's code; passing is kept once reached. */
  async saveExercise(key: string, language: CodeLanguage, code: string, passed: boolean, alreadyPassed: boolean): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await setDoc(
      doc(firestore, 'users', uid, 'codeLabExercises', safeKey(key)),
      {
        key: key.slice(0, 300),
        language,
        code: code.slice(0, MAX_CODE_LENGTH),
        passed: passed || alreadyPassed,
        ...(passed && !alreadyPassed ? { passedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  /** Keys of passed exercises (for the Coding Lab page's ticks). */
  async passedExercises(): Promise<Set<string>> {
    const uid = this.uid();
    if (!uid) return new Set();
    const snapshot = await getDocs(collection(firestore, 'users', uid, 'codeLabExercises'));
    return new Set(snapshot.docs.filter((item) => item.data()['passed'] === true).map((item) => String(item.data()['key'] ?? item.id)));
  }

  // ---------- Projects ----------

  async listProjects(): Promise<CodeProject[]> {
    const uid = this.uid();
    if (!uid) return [];
    const snapshot = await getDocs(query(collection(firestore, 'users', uid, 'codeLabProjects'), orderBy('updatedAt', 'desc'), limit(100)));
    return snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        name: typeof data['name'] === 'string' ? data['name'] : 'Untitled',
        language: 'javascript',
        code: typeof data['code'] === 'string' ? data['code'] : '',
        updatedAt: toDate(data['updatedAt']),
      };
    });
  }

  async saveProject(project: Pick<CodeProject, 'id' | 'name' | 'language' | 'code'>): Promise<void> {
    const uid = this.uid();
    if (!uid) throw new Error('Sign in to save projects.');
    await setDoc(doc(firestore, 'users', uid, 'codeLabProjects', project.id), {
      name: project.name.trim().slice(0, 80) || 'Untitled',
      language: project.language,
      code: project.code.slice(0, MAX_CODE_LENGTH),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteProject(id: string): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    await deleteDoc(doc(firestore, 'users', uid, 'codeLabProjects', id));
  }

  newProjectId(): string {
    return doc(collection(firestore, 'users', this.uid() ?? 'anonymous', 'codeLabProjects')).id;
  }
}

/** Firestore ids can't contain "/" and must stay short. */
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 300) || 'exercise';
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

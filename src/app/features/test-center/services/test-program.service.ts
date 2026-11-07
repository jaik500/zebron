import { Injectable } from '@angular/core';

import {
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
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestProgram } from '../models/test-program.model';

@Injectable({
  providedIn: 'root',
})
export class TestProgramService {
  private readonly programsCollection = collection(
    firestore,
    'testPrograms',
  );

  // ============================================================
  // GET ONE
  // ============================================================

  async getProgram(
    programId: string,
  ): Promise<TestProgram | null> {
    const programReference = doc(
      firestore,
      'testPrograms',
      programId,
    );

    const snapshot = await getDoc(
      programReference,
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as TestProgram;
  }

  // ============================================================
  // PROGRAM NAME FOR A QUIZ (learner pages)
  // ============================================================

  /**
   * The program a learner sees a quiz under, or ''.
   *
   * - On organization pages, a Zebron quiz shows under the organization's
   *   program that links it (platformQuizIds).
   * - Otherwise the quiz's own program (programId), or the program name
   *   stored on Zebron's seeded quizzes (programName).
   *
   * Zebron programs aren't readable by learners, so failures fall through
   * quietly to the next option.
   */
  async getProgramNameForQuiz(
    quiz: { id: string; organizationId: string | null; programId?: string | null; programName?: string | null },
    viewerOrganizationId: string | null,
  ): Promise<string> {
    if (!quiz.organizationId && viewerOrganizationId) {
      try {
        const linked = await getDocs(
          query(
            this.programsCollection,
            where('organizationId', '==', viewerOrganizationId),
            where('platformQuizIds', 'array-contains', quiz.id),
            limit(1),
          ),
        );
        const name = linked.docs[0]?.get('name');
        if (typeof name === 'string' && name.trim()) return name.trim();
      } catch {
        // Not readable here: try the quiz's own program.
      }
    }

    if (quiz.programId) {
      try {
        const program = await this.getProgram(quiz.programId);
        if (program?.name?.trim()) return program.name.trim();
      } catch {
        // Zebron programs are readable only by platform administrators.
      }
    }

    return quiz.programName?.trim() ?? '';
  }

  // ============================================================
  // GET ORGANIZATION PROGRAMS
  // ============================================================

  async getOrganizationPrograms(
    organizationId: string,
  ): Promise<TestProgram[]> {
    this.requireOrganizationId(
      organizationId,
    );

    const programsQuery = query(
      this.programsCollection,
      where(
        'organizationId',
        '==',
        organizationId,
      ),
      orderBy(
        'name',
        'asc',
      ),
    );

    const snapshot =
      await getDocs(programsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as TestProgram,
    );
  }

  // ============================================================
  // GET ACTIVE ORGANIZATION PROGRAMS
  // ============================================================

  async getActiveOrganizationPrograms(
    organizationId: string,
  ): Promise<TestProgram[]> {
    this.requireOrganizationId(
      organizationId,
    );

    const programsQuery = query(
      this.programsCollection,
      where(
        'organizationId',
        '==',
        organizationId,
      ),
      where(
        'active',
        '==',
        true,
      ),
      orderBy(
        'name',
        'asc',
      ),
    );

    const snapshot =
      await getDocs(programsQuery);

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as TestProgram,
    );
  }

  // ============================================================
  // CREATE
  // ============================================================

  async createProgram(
    organizationId: string,
    program: {
      name: string;
      slug: string;
      description: string;
      active: boolean;
      platformQuizIds?: string[];
    },
  ): Promise<string> {
    this.requireOrganizationId(
      organizationId,
    );

    const name =
      program.name?.trim() ?? '';

    const slug =
      this.normalizeSlug(
        program.slug,
      );

    const description =
      program.description?.trim() ?? '';

    if (!name) {
      throw new Error(
        'Program name is required.',
      );
    }

    if (!slug) {
      throw new Error(
        'Program slug is required.',
      );
    }

    const programReference = doc(
      this.programsCollection,
      slug,
    );

    await setDoc(
      programReference,
      {
        organizationId,
        name,
        slug,
        description,
        active:
          program.active === true,
        platformQuizIds:
          this.normalizePlatformQuizIds(program.platformQuizIds),
        quizCount: 0,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      },
    );

    return programReference.id;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async updateProgram(
    organizationId: string,
    programId: string,
    changes: {
      name?: string;
      slug?: string;
      description?: string;
      active?: boolean;
      platformQuizIds?: string[];
    },
  ): Promise<void> {
    this.requireOrganizationId(
      organizationId,
    );

    if (!programId?.trim()) {
      throw new Error(
        'Program ID is required.',
      );
    }

    const programReference = doc(
      firestore,
      'testPrograms',
      programId,
    );

    const existing =
      await getDoc(programReference);

    if (!existing.exists()) {
      throw new Error(
        'Program not found.',
      );
    }

    const existingData =
      existing.data();

    if (
      existingData['organizationId'] !==
      organizationId
    ) {
      throw new Error(
        'You cannot update a program belonging to another organization.',
      );
    }

    const payload: Record<
      string,
      unknown
    > = {
      updatedAt:
        serverTimestamp(),
    };

    if (
      changes.name !== undefined
    ) {
      const name =
        changes.name.trim();

      if (!name) {
        throw new Error(
          'Program name is required.',
        );
      }

      payload['name'] = name;
    }

    /*
     * Keep the program slug immutable.
     *
     * Courses may reference this program,
     * so changing the slug is unnecessary
     * and creates avoidable identity problems.
     */
    if (
      changes.slug !== undefined &&
      changes.slug.trim() !==
        existingData['slug']
    ) {
      throw new Error(
        'Program slugs cannot be changed after creation.',
      );
    }

    if (
      changes.description !==
      undefined
    ) {
      payload['description'] =
        changes.description.trim();
    }

    if (
      changes.active !== undefined
    ) {
      payload['active'] =
        changes.active === true;
    }

    if (
      changes.platformQuizIds !== undefined
    ) {
      payload['platformQuizIds'] =
        this.normalizePlatformQuizIds(changes.platformQuizIds);
    }

    await updateDoc(
      programReference,
      payload,
    );
  }

  // ============================================================
  // ZEBRON (PLATFORM) PROGRAMS — platform administrators
  // ============================================================

  /** Zebron programs, inactive ones included, in name order. */
  async getPlatformPrograms(): Promise<TestProgram[]> {
    const snapshot = await getDocs(
      query(
        this.programsCollection,
        where('scope', '==', 'platform'),
        where('organizationId', '==', null),
      ),
    );

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as TestProgram)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Creates a Zebron program. Its ID is "zebron-<slug>" so it never collides
   * with an organization program (those use the bare slug).
   * Returns the existing program's ID when one with this slug already exists.
   */
  async createPlatformProgram(program: {
    name: string;
    description?: string;
    active?: boolean;
  }): Promise<{ id: string; created: boolean }> {
    const name = program.name?.trim() ?? '';
    const slug = this.normalizeSlug(name);

    if (!name || !slug) {
      throw new Error('Program name is required.');
    }

    const reference = doc(this.programsCollection, `zebron-${slug}`);
    const existing = await getDoc(reference);

    if (existing.exists()) {
      return { id: reference.id, created: false };
    }

    await setDoc(reference, {
      scope: 'platform',
      organizationId: null,
      name,
      slug,
      description: program.description?.trim() ?? '',
      active: program.active !== false,
      quizCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: reference.id, created: true };
  }

  async updatePlatformProgram(
    programId: string,
    changes: { name?: string; description?: string; active?: boolean },
  ): Promise<void> {
    const reference = doc(firestore, 'testPrograms', programId);
    const existing = await getDoc(reference);

    if (!existing.exists() || existing.data()['scope'] !== 'platform') {
      throw new Error('This is not a Zebron program.');
    }

    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new Error('Program name is required.');
      }
      payload['name'] = name;
    }
    if (changes.description !== undefined) payload['description'] = changes.description.trim();
    if (changes.active !== undefined) payload['active'] = changes.active === true;

    await updateDoc(reference, payload);
  }

  /** Linked Zebron quiz IDs: trimmed, unique, at most 50 (the rules allow 50). */
  private normalizePlatformQuizIds(
    ids: string[] | undefined,
  ): string[] {
    return [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))].slice(0, 50);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteProgram(
    organizationId: string,
    programId: string,
  ): Promise<void> {
    this.requireOrganizationId(
      organizationId,
    );

    if (!programId?.trim()) {
      throw new Error(
        'Program ID is required.',
      );
    }

    const programReference = doc(
      firestore,
      'testPrograms',
      programId,
    );

    const existing =
      await getDoc(programReference);

    if (!existing.exists()) {
      throw new Error(
        'Program not found.',
      );
    }

    const existingData =
      existing.data();

    if (
      existingData['organizationId'] !==
      organizationId
    ) {
      throw new Error(
        'You cannot delete a program belonging to another organization.',
      );
    }

    const quizCount =
      Number(
        existingData['quizCount'] ??
          0,
      );

    if (quizCount > 0) {
      throw new Error(
        'Programs with courses cannot be deleted. Remove or move the courses first.',
      );
    }

    /*
     * Firestore rules currently intentionally
     * deny program deletion.
     *
     * Keep this method blocked until the
     * lifecycle/rules design explicitly supports
     * deletion.
     */
    throw new Error(
      'Program deletion is currently disabled.',
    );
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  private requireOrganizationId(
    organizationId: string,
  ): void {
    if (
      !organizationId ||
      !organizationId.trim()
    ) {
      throw new Error(
        'Organization ID is required.',
      );
    }
  }

  private normalizeSlug(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      );
  }
}
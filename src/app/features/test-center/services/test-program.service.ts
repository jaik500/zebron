import { Injectable } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
        courseCount: 0,
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

    await updateDoc(
      programReference,
      payload,
    );
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

    const courseCount =
      Number(
        existingData['courseCount'] ??
          0,
      );

    if (courseCount > 0) {
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
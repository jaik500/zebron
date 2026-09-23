import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestCourse } from '../models/test-course.model';

@Injectable({
  providedIn: 'root',
})
export class TestCourseService {
  // ============================================================
  // FIRESTORE COLLECTION
  // ============================================================

  private readonly coursesCollection = collection(
    firestore,
    'testCourses',
  );

  // ============================================================
  // GET ALL COURSES
  // ============================================================

  /**
   * Returns all courses belonging to an organization.
   *
   * Organization scope is mandatory.
   */
  async getAllCourses(
    organizationId: string,
  ): Promise<TestCourse[]> {
    this.requireOrganizationId(organizationId);

    const q = query(
      this.coursesCollection,
      where(
        'organizationId',
        '==',
        organizationId,
      ),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestCourse,
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      );
  }

  // ============================================================
  // GET ACTIVE COURSES
  // ============================================================

  /**
   * Returns active courses belonging to an organization.
   *
   * Active filtering is done in Firestore.
   * Name sorting is done in memory to avoid an additional
   * composite index.
   */
  async getActiveCourses(
    organizationId: string,
  ): Promise<TestCourse[]> {
    this.requireOrganizationId(organizationId);

    const q = query(
      this.coursesCollection,

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
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestCourse,
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      );
  }

  // ============================================================
  // GET COURSE BY ID
  // ============================================================

  /**
   * Gets a course by ID only if it belongs to the
   * supplied organization.
   */
  async getCourseById(
    organizationId: string,
    courseId: string,
  ): Promise<TestCourse | null> {
    this.requireOrganizationId(organizationId);

    if (!courseId?.trim()) {
      return null;
    }

    const reference = doc(
      firestore,
      'testCourses',
      courseId,
    );

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    if (
      data['organizationId'] !== organizationId
    ) {
      return null;
    }

    return {
      id: snapshot.id,
      ...data,
    } as TestCourse;
  }

  // ============================================================
  // GET COURSE BY SLUG
  // ============================================================

  /**
   * Gets an active course by slug within an organization.
   */
  async getCourseBySlug(
    organizationId: string,
    slug: string,
  ): Promise<TestCourse | null> {
    this.requireOrganizationId(organizationId);

    const normalizedSlug =
      this.normalizeSlug(slug);

    if (!normalizedSlug) {
      return null;
    }

    const q = query(
      this.coursesCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'slug',
        '==',
        normalizedSlug,
      ),

      where(
        'active',
        '==',
        true,
      ),
    );

    const snapshot = await getDocs(q);

    const document = snapshot.docs[0];

    if (!document) {
      return null;
    }

    return {
      id: document.id,
      ...document.data(),
    } as TestCourse;
  }

  // ============================================================
  // CREATE COURSE
  // ============================================================

  /**
   * Creates a course inside an organization.
   *
   * The organizationId is written directly onto the document.
   */
  async createCourse(
    organizationId: string,
    course: {
      name: string;
      slug: string;
      description: string;
      provider?: string;
      type: TestCourse['type'];
      certificationCode?: string;
      imageUrl?: string;
      active: boolean;
    },
  ): Promise<string> {
    this.requireOrganizationId(organizationId);

    const name = course.name?.trim() ?? '';
    const slug = this.normalizeSlug(course.slug);

    if (!name) {
      throw new Error(
        'Course name is required.',
      );
    }

    if (!slug) {
      throw new Error(
        'Course slug is required.',
      );
    }

    // ----------------------------------------------------------
    // Prevent duplicate slugs inside the same organization
    // ----------------------------------------------------------

    const existingQuery = query(
      this.coursesCollection,

      where(
        'organizationId',
        '==',
        organizationId,
      ),

      where(
        'slug',
        '==',
        slug,
      ),
    );

    const existingSnapshot =
      await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error(
        `A course with the slug "${slug}" already exists in this organization.`,
      );
    }

    // ----------------------------------------------------------
    // Create
    // ----------------------------------------------------------

    const reference = await addDoc(
      this.coursesCollection,
      {
        organizationId,

        name,

        slug,

        description:
          course.description?.trim() ?? '',

        provider:
          course.provider?.trim() || null,

        type: course.type,

        certificationCode:
          course.certificationCode?.trim() || null,

        imageUrl:
          course.imageUrl?.trim() || null,

        active:
          course.active === true,

        questionCount: 0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

    return reference.id;
  }

  // ============================================================
  // UPDATE COURSE
  // ============================================================

  /**
   * Updates a course only when the course belongs to the
   * supplied organization.
   *
   * organizationId and slug cannot be changed here.
   */
  async updateCourse(
    organizationId: string,
    courseId: string,
    changes: Partial<
      Omit<
        TestCourse,
        | 'id'
        | 'organizationId'
        | 'createdAt'
        | 'updatedAt'
        | 'slug'
      >
    >,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing =
      await this.getCourseById(
        organizationId,
        courseId,
      );

    if (!existing) {
      throw new Error(
        'Test Center course was not found in the current organization.',
      );
    }

    const updatePayload: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };

    // Never allow the service caller to move the record
    // between organizations.
    delete updatePayload['organizationId'];

    // Slug is immutable after creation.
    delete updatePayload['slug'];

    // ID is not a Firestore field, but remove it defensively.
    delete updatePayload['id'];

    await updateDoc(
      doc(
        firestore,
        'testCourses',
        courseId,
      ),
      updatePayload,
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private requireOrganizationId(
    organizationId: string,
  ): void {
    if (!organizationId?.trim()) {
      throw new Error(
        'An organization is required for Test Center operations.',
      );
    }
  }

  private normalizeSlug(
    value: string,
  ): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
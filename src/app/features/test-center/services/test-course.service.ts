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
  // GET AVAILABLE COURSES
  // ============================================================

  /**
   * Returns every course available to the current user:
   *
   * 1. Public Zebron/platform courses.
   * 2. Active courses belonging to the supplied organization.
   *
   * Organization is optional because platform courses do not require
   * organization membership.
   */
  async getAvailableCourses(
    organizationId?: string | null,
  ): Promise<TestCourse[]> {
    // ----------------------------------------------------------
    // Platform courses
    // ----------------------------------------------------------

    const platformQuery = query(
      this.coursesCollection,
      where(
        'scope',
        '==',
        'platform',
      ),
      where(
        'accessType',
        '==',
        'public',
      ),
      where(
        'active',
        '==',
        true,
      ),
    );

    const platformSnapshot = await getDocs(
      platformQuery,
    );

    const platformCourses =
      platformSnapshot.docs.map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestCourse,
      );

    // ----------------------------------------------------------
    // Organization courses
    // ----------------------------------------------------------

    let organizationCourses: TestCourse[] = [];

    if (organizationId?.trim()) {
      const organizationQuery = query(
        this.coursesCollection,

        where(
          'scope',
          '==',
          'organization',
        ),

        where(
          'organizationId',
          '==',
          organizationId,
        ),

        where(
          'accessType',
          '==',
          'organization-members',
        ),

        where(
          'active',
          '==',
          true,
        ),
      );

      const organizationSnapshot =
        await getDocs(organizationQuery);

      organizationCourses =
        organizationSnapshot.docs.map(
          (document) =>
            ({
              id: document.id,
              ...document.data(),
            }) as TestCourse,
        );
    }

    return [
      ...platformCourses,
      ...organizationCourses,
    ].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  // ============================================================
  // GET COURSE BY ID
  // ============================================================

  /**
   * Gets a course that the caller is allowed to access.
   *
   * Platform/public courses do not require an organization.
   * Organization courses require the supplied organization.
   *
   * Firestore rules remain the authoritative security boundary.
   */
  async getCourseById(
    organizationId: string | null | undefined,
    courseId: string,
  ): Promise<TestCourse | null> {
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

    const data = snapshot.data() as Record<
      string,
      unknown
    >;

    const scope = data['scope'];

    // ----------------------------------------------------------
    // Zebron/platform course
    // ----------------------------------------------------------

    if (
      scope === 'platform' &&
      data['accessType'] === 'public' &&
      data['active'] === true
    ) {
      return {
        id: snapshot.id,
        ...data,
      } as TestCourse;
    }

    // ----------------------------------------------------------
    // Organization course
    // ----------------------------------------------------------

    if (
      scope === 'organization' &&
      organizationId &&
      data['organizationId'] === organizationId
    ) {
      return {
        id: snapshot.id,
        ...data,
      } as TestCourse;
    }

    return null;
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
  // CREATE ORGANIZATION COURSE
  // ============================================================

  /**
   * Creates a course inside an organization.
   *
   * Organization courses require:
   *
   * - organizationId
   * - programId
   *
   * The organizationId is written directly onto the document.
   *
   * Firestore rules remain the authoritative security boundary.
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
      programId: string | null;
    },
  ): Promise<string> {
    this.requireOrganizationId(organizationId);

    const name = course.name?.trim() ?? '';

    const slug = this.normalizeSlug(
      course.slug,
    );

    const programId =
      course.programId?.trim() ?? '';

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------

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

    if (!programId) {
      throw new Error(
        'A program is required for organization courses.',
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

        scope: 'organization',

        accessType: 'organization-members',

        programId,

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
  // CREATE PLATFORM COURSE
  // ============================================================

  /**
   * Creates a Zebron-owned platform course.
   *
   * Platform courses:
   *
   * - are not owned by an organization
   * - are publicly available to authenticated users
   * - do not belong to an organization program
   * - can only be created by a platform administrator
   *
   * Firestore security rules enforce the platform-admin
   * authorization boundary.
   */
  async createPlatformCourse(
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
    const name = course.name?.trim() ?? '';

    const slug = this.normalizeSlug(
      course.slug,
    );

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------

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
    // Prevent duplicate platform slugs
    // ----------------------------------------------------------

    const existingQuery = query(
      this.coursesCollection,

      where(
        'scope',
        '==',
        'platform',
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
        `A platform course with the slug "${slug}" already exists.`,
      );
    }

    // ----------------------------------------------------------
    // Create platform course
    // ----------------------------------------------------------

    const reference = await addDoc(
      this.coursesCollection,
      {
        organizationId: null,

        scope: 'platform',

        accessType: 'public',

        programId: null,

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
   * Updates an organization-owned course.
   *
   * organizationId and slug cannot be changed here.
   *
   * programId may be changed, allowing an organization
   * administrator to move a course between programs.
   *
   * Firestore rules should validate that the new program
   * belongs to the same organization.
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
  this.requireOrganizationId(
    organizationId,
  );

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

  // ----------------------------------------------------------
  // Validate programId when supplied.
  //
  // Organization courses must always have a program.
  // ----------------------------------------------------------

  if (
    changes.programId !== undefined &&
    (
      typeof changes.programId !== 'string' ||
      !changes.programId.trim()
    )
  ) {
    throw new Error(
      'A program is required for organization courses.',
    );
  }

  const updatePayload: Record<
    string,
    unknown
  > = {
    ...changes,
    updatedAt: serverTimestamp(),
  };

  // ----------------------------------------------------------
  // Never allow the service caller to move the record
  // between organizations.
  // ----------------------------------------------------------

  delete updatePayload[
    'organizationId'
  ];

  // ----------------------------------------------------------
  // Slug is immutable after creation.
  // ----------------------------------------------------------

  delete updatePayload['slug'];

  // ----------------------------------------------------------
  // ID is not a Firestore field, but remove it defensively.
  // ----------------------------------------------------------

  delete updatePayload['id'];

  // ----------------------------------------------------------
  // Normalize programId if supplied.
  // ----------------------------------------------------------

  if (typeof changes.programId === 'string') {
    updatePayload['programId'] =
      changes.programId.trim();
  }

  // ----------------------------------------------------------
  // Update
  // ----------------------------------------------------------

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
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /-+/g,
        '-',
      )
      .replace(
        /^-|-$/g,
        '');
  }

  // ============================================================
  // ADMIN — GET ALL COURSES
  // ============================================================

  /**
   * Returns every Test Center course.
   *
   * This method is intended for platform administrators.
   *
   * Unlike getAvailableCourses(), this does not filter by
   * organization, scope, access type, or active status.
   *
   * Firestore security rules are responsible for ensuring that
   * only authorized platform administrators can execute the
   * unscoped collection query.
   */
  async getAllCoursesForAdmin(): Promise<
    TestCourse[]
  > {
    const snapshot = await getDocs(
      this.coursesCollection,
    );

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
}
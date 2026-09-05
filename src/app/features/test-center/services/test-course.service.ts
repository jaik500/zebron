import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firestore } from '../../../core/services/firebase-config';

import { TestCourse } from '../models/test-course.model';

@Injectable({
  providedIn: 'root',
})
export class TestCourseService {

  // =========================================================
  // FIRESTORE COLLECTION
  // =========================================================

  private readonly coursesCollection =
    collection(firestore, 'testCourses');


  // =========================================================
  // GET ALL COURSES
  // =========================================================

  /**
   * Get every Test Center course.
   *
   * This method is intended primarily for administration,
   * because inactive courses must also be visible to admins.
   *
   * Sorting is performed in application memory so that the
   * query does not require a Firestore composite index.
   */
  async getAllCourses(): Promise<TestCourse[]> {

    const snapshot =
      await getDocs(
        this.coursesCollection,
      );


    const courses =
      snapshot.docs.map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as TestCourse,
      );


    return courses.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: 'base',
          },
        ),
    );
  }


  // =========================================================
  // GET ACTIVE COURSES
  // =========================================================

  /**
   * Get all active Test Center courses.
   *
   * Courses are sorted by name in application memory so
   * the query does not require a Firestore composite index.
   */
  async getActiveCourses(): Promise<TestCourse[]> {

    const q = query(
      this.coursesCollection,
      where('active', '==', true),
    );


    const snapshot =
      await getDocs(q);


    const courses =
      snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as TestCourse,
      );


    return courses.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          {
            sensitivity: 'base',
          },
        ),
    );
  }


  // =========================================================
  // GET COURSE BY ID
  // =========================================================

  /**
   * Get a course by its Firestore document ID.
   */
  async getCourseById(
    courseId: string,
  ): Promise<TestCourse | null> {

    if (!courseId) {
      return null;
    }


    const reference =
      doc(
        this.coursesCollection,
        courseId,
      );


    const snapshot =
      await getDoc(reference);


    if (!snapshot.exists()) {
      return null;
    }


    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as TestCourse;
  }


  // =========================================================
  // GET COURSE BY SLUG
  // =========================================================

  /**
   * Get an active course by its URL slug.
   *
   * The slug is queried first and the active state is
   * checked in application memory. This avoids requiring
   * a composite Firestore index for slug + active.
   */
  async getCourseBySlug(
    slug: string,
  ): Promise<TestCourse | null> {

    const q = query(
      this.coursesCollection,
      where('slug', '==', slug),
    );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {
      return null;
    }


    const document =
      snapshot.docs.find(
        (doc) =>
          doc.data()['active'] === true,
      );


    if (!document) {
      return null;
    }


    return {
      id: document.id,
      ...document.data(),
    } as TestCourse;
  }


  // =========================================================
  // CREATE COURSE
  // =========================================================

  /**
   * Create a new Test Center course.
   *
   * The slug is used as the Firestore document ID.
   *
   * This gives us a stable, human-readable course ID such as:
   *
   * cybersecurity-fundamentals
   *
   * Question count starts at zero and is maintained by the
   * question/topic functionality rather than manually entered
   * by an administrator.
   */
  async createCourse(
    course: {
      name: string;
      slug: string;
      description: string;
      provider?: string;
      type: string;
      certificationCode?: string;
      active: boolean;
    },
  ): Promise<TestCourse> {

    const name =
      course.name.trim();

    const slug =
      course.slug.trim().toLowerCase();

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


    const courseReference =
      doc(
        this.coursesCollection,
        slug,
      );


    // -------------------------------------------------------
    // Prevent duplicate course IDs / slugs
    // -------------------------------------------------------

    const existing =
      await getDoc(
        courseReference,
      );


    if (existing.exists()) {
      throw new Error(
        `A course with the slug "${slug}" already exists.`,
      );
    }


    // -------------------------------------------------------
    // Create course
    // -------------------------------------------------------

    await setDoc(
      courseReference,
      {
        name,

        slug,

        description:
          course.description.trim(),

        provider:
          course.provider?.trim() || '',

        type:
          course.type.trim(),

        certificationCode:
          course.certificationCode?.trim() || '',

        active:
          course.active,

        // Question count is system-maintained.
        questionCount: 0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );


    const createdCourse =
      await this.getCourseById(slug);


    if (!createdCourse) {
      throw new Error(
        'Course was created but could not be retrieved.',
      );
    }


    return createdCourse;
  }


  // =========================================================
  // UPDATE COURSE
  // =========================================================

  /**
   * Update an existing Test Center course.
   *
   * The document ID and slug are deliberately not changed.
   *
   * This prevents existing course URLs and question
   * relationships from being broken.
   */
  async updateCourse(
    courseId: string,
    changes: {
      name?: string;
      description?: string;
      provider?: string;
      type?: string;
      certificationCode?: string;
      active?: boolean;
    },
  ): Promise<void> {

    if (!courseId) {
      throw new Error(
        'Course ID is required.',
      );
    }


    const courseReference =
      doc(
        this.coursesCollection,
        courseId,
      );


    const existing =
      await getDoc(
        courseReference,
      );


    if (!existing.exists()) {
      throw new Error(
        'The selected course does not exist.',
      );
    }


    const payload: Record<string, unknown> = {
      updatedAt:
        serverTimestamp(),
    };


    if (changes.name !== undefined) {
      payload['name'] =
        changes.name.trim();
    }


    if (changes.description !== undefined) {
      payload['description'] =
        changes.description.trim();
    }


    if (changes.provider !== undefined) {
      payload['provider'] =
        changes.provider.trim();
    }


    if (changes.type !== undefined) {
      payload['type'] =
        changes.type.trim();
    }


    if (changes.certificationCode !== undefined) {
      payload['certificationCode'] =
        changes.certificationCode.trim();
    }


    if (changes.active !== undefined) {
      payload['active'] =
        changes.active;
    }


    await updateDoc(
      courseReference,
      payload,
    );
  }
}
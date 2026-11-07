import { Injectable, inject } from '@angular/core';

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

import { Quiz } from '../models/quiz.model';
import { TestProgramService } from './test-program.service';

/**
 * Quizzes in the Test Center: question banks (with topics and questions)
 * that learners practise with. Not to be confused with learning Courses.
 *
 * Quizzes are stored in the Firestore collection `quizzes`; that stored
 * name is kept so no data migration is needed.
 */
@Injectable({
  providedIn: 'root',
})
export class QuizService {
  // ============================================================
  // FIRESTORE COLLECTION
  // ============================================================

  /** Stored name kept for existing data: quizzes live in `quizzes`. */
  private readonly quizzesCollection = collection(firestore, 'quizzes');

  private readonly programService = inject(TestProgramService);

  // ============================================================
  // ORGANIZATION LEARNERS — OWN QUIZZES + LINKED ZEBRON QUIZZES
  // ============================================================

  /**
   * Quizzes an organization's learners see: the organization's own active
   * quizzes, plus the active Zebron quizzes the organization linked to one
   * of its active programs (Test Center → program → "Zebron quizzes in this
   * program"). Without an organization this is the Zebron list.
   */
  async getQuizzesForLearners(organizationId: string | null): Promise<Quiz[]> {
    const owner = organizationId?.trim() || null;

    if (!owner) {
      return this.getAvailableQuizzes(null);
    }

    const [own, linked] = await Promise.all([
      this.getAvailableQuizzes(owner),
      this.getLinkedPlatformQuizzes(owner).catch((error) => {
        // Linked Zebron quizzes are an extra; the organization's own list still loads.
        console.warn('[QuizService] Could not load linked Zebron quizzes.', error);
        return [] as Quiz[];
      }),
    ]);

    const ownIds = new Set(own.map((quiz) => quiz.id));
    return [...own, ...linked.filter((quiz) => !ownIds.has(quiz.id))];
  }

  /** Active Zebron quizzes linked to any of the organization's active programs. */
  async getLinkedPlatformQuizzes(organizationId: string): Promise<Quiz[]> {
    const programs = await this.programService.getActiveOrganizationPrograms(organizationId);
    const linkedIds = new Set(programs.flatMap((program) => program.platformQuizIds ?? []));

    if (!linkedIds.size) {
      return [];
    }

    const platform = await this.getAvailableQuizzes(null);
    return platform.filter((quiz) => linkedIds.has(quiz.id));
  }

  // ============================================================
  // GET ALL QUIZZES
  // ============================================================

  /**
   * Returns all quizzes belonging to an organization.
   *
   * Organization scope is mandatory.
   */
  async getAllQuizzes(organizationId: string): Promise<Quiz[]> {
    this.requireOrganizationId(organizationId);
    const q = query(
      this.quizzesCollection,
      where('organizationId', '==', organizationId),
      where('scope', '==', 'organization'),
      where('accessType', '==', 'organization-members'),
      where('active', '==', true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as Quiz)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ============================================================
  // GET ACTIVE QUIZZES
  // ============================================================

  /**
   * Returns active quizzes belonging to an organization.
   *
   * Active filtering is done in Firestore.
   * Name sorting is done in memory to avoid an additional
   * composite index.
   */
  async getActiveQuizzes(organizationId: string): Promise<Quiz[]> {
    this.requireOrganizationId(organizationId);

    const q = query(
      this.quizzesCollection,

      where('organizationId', '==', organizationId),

      where('active', '==', true),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as Quiz,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // ============================================================
  // GET AVAILABLE QUIZZES
  // ============================================================


  /**
   * Returns quizzes available in the current context.
   *
   * Organization context:
   *   Returns only active quizzes owned by that organization.
   *
   * Platform context:
   *   Returns active public platform quizzes.
   *
   * Platform quizzes are deliberately excluded from organization
   * learner dashboards.
   */
async getAvailableQuizzes(
  organizationId?: string | null,
): Promise<Quiz[]> {
  const normalizedOrganizationId = organizationId?.trim();

  if (normalizedOrganizationId) {
    // Organization context: return only that organization's quizzes.
    const organizationQuery = query(
      this.quizzesCollection,
      where('scope', '==', 'organization'),
      where('organizationId', '==', normalizedOrganizationId),
      where('accessType', '==', 'organization-members'),
      where('active', '==', true),
    );

    const snapshot = await getDocs(organizationQuery);

    return snapshot.docs.map(document => ({
      ...document.data(),
      id: document.id,
    }) as Quiz);
  }

  // Platform context: return only public platform quizzes.
  const platformQuery = query(
    this.quizzesCollection,
    where('scope', '==', 'platform'),
    where('accessType', '==', 'public'),
    where('active', '==', true),
  );

  const snapshot = await getDocs(platformQuery);

  return snapshot.docs.map(document => ({
    ...document.data(),
    id: document.id,
  }) as Quiz);
}


  // ============================================================
  // GET QUIZ BY ID
  // ============================================================

  /**
   * Gets a quiz that the caller is allowed to access.
   *
   * Platform/public quizzes do not require an organization.
   * Organization quizzes require the supplied organization.
   *
   * Firestore rules remain the authoritative security boundary.
   */
  async getQuizById(
    organizationId: string | null | undefined,
    quizId: string,
  ): Promise<Quiz | null> {
    if (!quizId?.trim()) {
      return null;
    }

    const reference = doc(firestore, 'quizzes', quizId);

    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as Record<string, unknown>;

    const scope = data['scope'];

    // ----------------------------------------------------------
    // Zebron/platform quiz
    // ----------------------------------------------------------

    if (scope === 'platform' && data['accessType'] === 'public' && data['active'] === true) {
      return {
        id: snapshot.id,
        ...data,
      } as Quiz;
    }

    // ----------------------------------------------------------
    // Organization quiz
    // ----------------------------------------------------------

    if (scope === 'organization' && organizationId && data['organizationId'] === organizationId) {
      return {
        id: snapshot.id,
        ...data,
      } as Quiz;
    }

    return null;
  }

  // ============================================================
  // GET QUIZ BY SLUG
  // ============================================================

  /**
   * Gets an active Test Center quiz by slug.
   *
   * Platform quizzes can be retrieved without an organization.
   * Organization quizzes require a valid organization ID.
   *
   * Firestore rules remain responsible for enforcing access.
   */

async getQuizBySlug(
  organizationId: string | null | undefined,
  slug: string,
): Promise<Quiz | null> {
  const normalizedSlug = this.normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const constraints = [
    where('slug', '==', normalizedSlug),
    where('active', '==', true),
  ];

  // Search organization quizzes first.
  if (organizationId?.trim()) {
    const organizationQuery = query(
  this.quizzesCollection,
  where('organizationId', '==', organizationId),
  where('scope', '==', 'organization'),
  where('accessType', '==', 'organization-members'),
  where('slug', '==', normalizedSlug),
  where('active', '==', true),
);

    let organizationSnapshot;

    try {
      organizationSnapshot = await getDocs(organizationQuery);
    } catch (error) {
      console.error(
        '[QuizService] Organization course query failed',
        {
          organizationId,
          slug: normalizedSlug,
          error,
        },
      );

      throw error;
    }

    const organizationDocument = organizationSnapshot.docs[0];

    if (organizationDocument) {
      return {
        id: organizationDocument.id,
        ...organizationDocument.data(),
      } as Quiz;
    }
  }

  // Fall back to public platform quizzes.
  const platformQuery = query(
    this.quizzesCollection,
    ...constraints,
    where('scope', '==', 'platform'),
    where('organizationId', '==', null),
    where('accessType', '==', 'public'),
  );

  let platformSnapshot;

  try {
    platformSnapshot = await getDocs(platformQuery);
  } catch (error) {
    console.error(
      '[QuizService] Public platform course query failed',
      {
        slug: normalizedSlug,
        error,
      },
    );

    throw error;
  }

  const platformDocument = platformSnapshot.docs[0];

  if (!platformDocument) {
    return null;
  }

  return {
    id: platformDocument.id,
    ...platformDocument.data(),
  } as Quiz;
}



  // ============================================================
  // CREATE ORGANIZATION QUIZ
  // ============================================================

  /**
   * Creates a quiz inside an organization.
   *
   * Organization quizzes require:
   *
   * - organizationId
   * - programId
   *
   * The organizationId is written directly onto the document.
   *
   * Firestore rules remain the authoritative security boundary.
   */
  async createQuiz(
    organizationId: string,
    course: {
      name: string;
      slug: string;
      description: string;
      provider?: string;
      type: Quiz['type'];
      certificationCode?: string;
      imageUrl?: string;
      active: boolean;
      /** Exam-only bank (see Quiz.examOnly). */
      examOnly?: boolean;
      programId: string | null;
    },
  ): Promise<string> {
    this.requireOrganizationId(organizationId);

    const name = course.name?.trim() ?? '';

    const slug = this.normalizeSlug(course.slug);

    const programId = course.programId?.trim() ?? '';

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------

    if (!name) {
      throw new Error('Course name is required.');
    }

    if (!slug) {
      throw new Error('Course slug is required.');
    }

    if (!programId) {
      throw new Error('A program is required for organization courses.');
    }

    // ----------------------------------------------------------
    // Prevent duplicate slugs inside the same organization
    // ----------------------------------------------------------

    console.log('[QuizService] Starting duplicate-slug check', {
      organizationId,
      slug,
    });

    const existingQuery = query(
      this.quizzesCollection,
      where('organizationId', '==', organizationId),
      where('scope', '==', 'organization'),
      where('accessType', '==', 'organization-members'),
      where('active', '==', true),
      where('slug', '==', slug),
    );

    let existingSnapshot;

    try {
      existingSnapshot = await getDocs(existingQuery);

      console.log('[QuizService] Duplicate-slug check succeeded', {
        matchCount: existingSnapshot.size,
      });
    } catch (error) {
      console.error('[QuizService] Duplicate-slug query failed', error);

      throw error;
    }

    if (!existingSnapshot.empty) {
      throw new Error(`A course with the slug "${slug}" already exists in this organization.`);
    }

    // ----------------------------------------------------------
    // Create
    // ----------------------------------------------------------

    console.log('[QuizService] Course creation request', {
      organizationId,
      scope: 'organization',
      accessType: 'organization-members',
      programId,
      name,
      slug,
    });

    const reference = await addDoc(this.quizzesCollection, {
      organizationId,

      scope: 'organization',

      accessType: 'organization-members',

      programId,

      name,

      slug,

      description: course.description?.trim() ?? '',

      provider: course.provider?.trim() || null,

      type: course.type,

      certificationCode: course.certificationCode?.trim() || null,

      imageUrl: course.imageUrl?.trim() || null,

      active: course.active === true,

      examOnly: course.examOnly === true,

      questionCount: 0,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  // ============================================================
  // CREATE PLATFORM QUIZ
  // ============================================================

  /**
   * Creates a Zebron-owned platform quiz.
   *
   * Platform quizzes:
   *
   * - are not owned by an organization
   * - are publicly available to authenticated users
   * - do not belong to an organization program
   * - can only be created by a platform administrator
   *
   * Firestore security rules enforce the platform-admin
   * authorization boundary.
   */
  async createPlatformQuiz(course: {
    name: string;
    slug: string;
    description: string;
    provider?: string;
    type: Quiz['type'];
    certificationCode?: string;
    imageUrl?: string;
    active: boolean;
    /** Exam-only bank (see Quiz.examOnly). */
    examOnly?: boolean;
    /** Optional Zebron program (testPrograms, scope 'platform'). */
    programId?: string | null;
  }): Promise<string> {
    const name = course.name?.trim() ?? '';

    const slug = this.normalizeSlug(course.slug);

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------

    if (!name) {
      throw new Error('Course name is required.');
    }

    if (!slug) {
      throw new Error('Course slug is required.');
    }

    // ----------------------------------------------------------
    // Prevent duplicate platform slugs
    // ----------------------------------------------------------

    const existingQuery = query(
      this.quizzesCollection,

      where('scope', '==', 'platform'),

      where('slug', '==', slug),
    );

    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error(`A platform course with the slug "${slug}" already exists.`);
    }

    // ----------------------------------------------------------
    // Create platform quiz
    // ----------------------------------------------------------

    const reference = await addDoc(this.quizzesCollection, {
      organizationId: null,

      scope: 'platform',

      accessType: 'public',

      programId: course.programId?.trim() || null,

      name,

      slug,

      description: course.description?.trim() ?? '',

      provider: course.provider?.trim() || null,

      type: course.type,

      certificationCode: course.certificationCode?.trim() || null,

      imageUrl: course.imageUrl?.trim() || null,

      active: course.active === true,

      examOnly: course.examOnly === true,

      questionCount: 0,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  // ============================================================
  // UPDATE QUIZ
  // ============================================================

  /**
   * Updates an organization-owned quiz.
   *
   * organizationId and slug cannot be changed here.
   *
   * programId may be changed, allowing an organization
   * administrator to move a quiz between programs.
   *
   * Firestore rules should validate that the new program
   * belongs to the same organization.
   */
  async updateQuiz(
    organizationId: string,
    quizId: string,
    changes: Partial<
      Omit<Quiz, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'slug'>
    >,
  ): Promise<void> {
    this.requireOrganizationId(organizationId);

    const existing = await this.getQuizById(organizationId, quizId);

    if (!existing) {
      throw new Error('Test Center course was not found in the current organization.');
    }

    // ----------------------------------------------------------
    // Validate programId when supplied.
    //
    // Organization quizzes must always have a program.
    // ----------------------------------------------------------

    if (
      changes.programId !== undefined &&
      (typeof changes.programId !== 'string' || !changes.programId.trim())
    ) {
      throw new Error('A program is required for organization courses.');
    }

    const updatePayload: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };

    // ----------------------------------------------------------
    // Never allow the service caller to move the record
    // between organizations.
    // ----------------------------------------------------------

    delete updatePayload['organizationId'];

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
      updatePayload['programId'] = changes.programId.trim();
    }

    // ----------------------------------------------------------
    // Update
    // ----------------------------------------------------------

    await updateDoc(doc(firestore, 'quizzes', quizId), updatePayload);
  }

  // ============================================================
  // UPDATE PLATFORM QUIZ
  // ============================================================

  /**
   * Updates a Zebron-owned platform quiz (platform administrators).
   *
   * Scope, owner, access type, program and slug never change here.
   */
  async updatePlatformQuiz(
    quizId: string,
    changes: {
      name?: string;
      description?: string;
      provider?: string;
      type?: Quiz['type'];
      certificationCode?: string;
      active?: boolean;
      examOnly?: boolean;
      /** Zebron program ID, or null for no program. */
      programId?: string | null;
    },
  ): Promise<void> {
    if (!quizId?.trim()) {
      throw new Error('Quiz ID is required.');
    }

    const existing = await getDoc(doc(firestore, 'quizzes', quizId));

    if (!existing.exists() || existing.data()['scope'] !== 'platform') {
      throw new Error('This is not a Zebron quiz.');
    }

    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

    if (changes.name !== undefined) {
      const name = changes.name.trim();
      if (!name) {
        throw new Error('Quiz name is required.');
      }
      payload['name'] = name;
    }
    if (changes.description !== undefined) payload['description'] = changes.description.trim();
    if (changes.provider !== undefined) payload['provider'] = changes.provider.trim() || null;
    if (changes.type !== undefined) payload['type'] = changes.type;
    if (changes.certificationCode !== undefined) payload['certificationCode'] = changes.certificationCode.trim() || null;
    if (changes.active !== undefined) payload['active'] = changes.active === true;
    if (changes.examOnly !== undefined) payload['examOnly'] = changes.examOnly === true;
    if (changes.programId !== undefined) payload['programId'] = changes.programId?.trim() || null;

    await updateDoc(doc(firestore, 'quizzes', quizId), payload);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private requireOrganizationId(organizationId: string): void {
    if (!organizationId?.trim()) {
      throw new Error('An organization is required for Test Center operations.');
    }
  }

  private normalizeSlug(value: string): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ============================================================
  // ADMIN — GET ALL QUIZZES
  // ============================================================

  /**
   * Returns every Test Center quiz.
   *
   * This method is intended for platform administrators.
   *
   * Unlike getAvailableQuizzes(), this does not filter by
   * organization, scope, access type, or active status.
   *
   * Firestore security rules are responsible for ensuring that
   * only authorized platform administrators can execute the
   * unscoped collection query.
   */
  async getAllQuizzesForAdmin(): Promise<Quiz[]> {
    const snapshot = await getDocs(this.quizzesCollection);

    return snapshot.docs
      .map(
        (document) =>
          ({
            id: document.id,
            ...document.data(),
          }) as Quiz,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

import { Timestamp } from 'firebase/firestore';

export interface TestProgram {
  id: string;

  /**
   * Organization that owns this program.
   *
   * Platform programs are not represented by this model.
   * Organization programs always belong to exactly one organization.
   */
  organizationId: string;

  /**
   * Human-readable program name.
   */
  name: string;

  /**
   * URL/query-safe identifier.
   */
  slug: string;

  /**
   * Program description.
   */
  description: string;

  /**
   * Whether the program is currently available.
   */
  active: boolean;

  /**
   * Number of courses currently associated with the program.
   *
   * This is a denormalized display value and should not be
   * treated as the authorization source of truth.
   */
  quizCount: number;

  /**
   * Zebron (platform) quizzes this organization links to the program.
   *
   * Platform quizzes have no programId and are shared by every
   * organization, so each organization records here which of them
   * belong to its own programs. Optional: older programs don't have it.
   */
  platformQuizIds?: string[];

  createdAt: Timestamp;

  updatedAt: Timestamp;
}
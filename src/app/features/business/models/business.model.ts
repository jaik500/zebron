import { Timestamp } from 'firebase/firestore';

export type BusinessStatus =
  | 'active'
  | 'inactive'
  | 'closed';

export interface Business {
  id: string;

  /**
   * User/account that owns the business record.
   */
  ownerId: string;

  /**
   * Legal business identity.
   */
  legalName: string;
  tradeName?: string;

  /**
   * Legal entity information.
   */
  entityType: string;
  stateOfFormation?: string;
  formationDate?: Timestamp;

  /**
   * Government/business identifiers.
   */
  ein?: string;
  registrationNumber?: string;

  /**
   * Business classification.
   */
  industry?: string;
  naicsCode?: string;

  /**
   * Centralized location reference.
   *
   * The actual address is stored in:
   *
   * locations/{locationId}
   */
  locationId?: string;

  /**
   * Business lifecycle status.
   */
  status: BusinessStatus;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
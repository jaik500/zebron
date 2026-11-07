import { Timestamp } from 'firebase/firestore';

export type BusinessStatus =
  | 'active'
  | 'inactive'
  | 'closed';

/**
 * Address kept on the business record itself. Used for organization
 * businesses (Partner portal): the shared locations collection is
 * public, so a partner's private address never goes there.
 */
export interface BusinessAddress {
  street: string;
  city: string;
  county?: string;
  state?: string;
  postalCode?: string;
  country: string;
}

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

  /** Organization businesses: the address itself (see BusinessAddress). */
  address?: BusinessAddress;

  /**
   * Business lifecycle status.
   */
  status: BusinessStatus;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
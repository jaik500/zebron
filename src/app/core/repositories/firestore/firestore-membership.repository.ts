import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  setDoc,
} from 'firebase/firestore';

import { Injectable, inject } from '@angular/core';
import { Firestore } from 'firebase/firestore';

import { OrganizationMembership } from '../../models/organization-membership.model';
import { MembershipRepository } from '../membership.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreMembershipRepository
  implements MembershipRepository
{
  private readonly firestore = inject(Firestore);

  private readonly collectionName = 'organizationMemberships';

  private collectionRef() {
    return collection(
      this.firestore,
      this.collectionName,
    );
  }

  /**
   * Deterministic membership document ID.
   *
   * Format:
   *   {userId}_{organizationId}
   *
   * This allows Firestore Security Rules to resolve a user's
   * organization membership without querying an arbitrary document.
   */
  private membershipId(
    userId: string,
    organizationId: string,
  ): string {
    return `${userId}_${organizationId}`;
  }

  async getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null> {
    const snapshot = await getDoc(
      doc(
        this.firestore,
        this.collectionName,
        membershipId,
      ),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as OrganizationMembership;
  }

  async getMembershipsForUser(
    userId: string,
  ): Promise<OrganizationMembership[]> {
    const snapshot = await getDocs(
      query(
        this.collectionRef(),
        where('userId', '==', userId),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as OrganizationMembership[];
  }

  async getMembershipsForOrganization(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    const snapshot = await getDocs(
      query(
        this.collectionRef(),
        where('organizationId', '==', organizationId),
      ),
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as OrganizationMembership[];
  }

  async getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const membershipId = this.membershipId(
      userId,
      organizationId,
    );

    return this.getMembership(membershipId);
  }

  async createMembership(
    membership: Omit<OrganizationMembership, 'id'>,
  ): Promise<string> {
    const id = this.membershipId(
      membership.userId,
      membership.organizationId,
    );

    const reference = doc(
      this.firestore,
      this.collectionName,
      id,
    );

    await setDoc(reference, membership);

    return id;
  }

  async updateMembership(
    membershipId: string,
    changes: Partial<Omit<OrganizationMembership, 'id'>>,
  ): Promise<void> {
    const reference = doc(
      this.firestore,
      this.collectionName,
      membershipId,
    );

    await updateDoc(reference, changes);
  }

  async deleteMembership(
    membershipId: string,
  ): Promise<void> {
    const reference = doc(
      this.firestore,
      this.collectionName,
      membershipId,
    );

    await deleteDoc(reference);
  }
}
import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OrganizationMembership } from '../../models/organization-membership.model';
import { OrganizationMembershipRepository } from './organization-membership.repository';
import { firestore } from '../../services/firebase-config';
@Injectable({ providedIn: 'root' })
export class FirestoreMembershipRepository implements OrganizationMembershipRepository {
  /** * Shared Firestore instance provided by Zebron's * centralized Firebase infrastructure. * * Do not inject Firestore through Angular DI here. * Zebron uses the Firebase Web SDK directly. */ private readonly db =
    firestore;
  private readonly collectionName = 'organizationMemberships';
  /** * Deterministic membership ID. * * Format: * {userId}_{organizationId} */ private membershipId(
    userId: string,
    organizationId: string,
  ): string {
    return `${userId}_${organizationId}`;
  }
  /** * Get a membership by its document ID. */ async getMembership(
    membershipId: string,
  ): Promise<OrganizationMembership | null> {
    const membershipRef = doc(this.db, this.collectionName, membershipId);
    const snapshot = await getDoc(membershipRef);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as OrganizationMembership;
  }
  /** * Get all memberships for a user. */ async getMembershipsForUser(
    userId: string,
  ): Promise<OrganizationMembership[]> {
    const membershipsRef = collection(this.db, this.collectionName);
    const membershipsQuery = query(membershipsRef, where('userId', '==', userId));
    const snapshot = await getDocs(membershipsQuery);
    return snapshot.docs.map(
      (membershipDoc) =>
        ({ id: membershipDoc.id, ...membershipDoc.data() }) as OrganizationMembership,
    );
  }
  /** * Get all memberships for an organization. */ async getMembershipsForOrganization(
    organizationId: string,
  ): Promise<OrganizationMembership[]> {
    const membershipsRef = collection(this.db, this.collectionName);
    const membershipsQuery = query(membershipsRef, where('organizationId', '==', organizationId));
    const snapshot = await getDocs(membershipsQuery);
    return snapshot.docs.map(
      (membershipDoc) =>
        ({ id: membershipDoc.id, ...membershipDoc.data() }) as OrganizationMembership,
    );
  }
  /** * Get a user's membership in a specific organization. */ async getMembershipForUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null> {
    const membershipId = this.membershipId(userId, organizationId);
    return this.getMembership(membershipId);
  }
  /** * Create a membership using the deterministic document ID. */ async createMembership(
    membership: Omit<OrganizationMembership, 'id'>,
  ): Promise<string> {
    const membershipId = this.membershipId(membership.userId, membership.organizationId);
    const membershipRef = doc(this.db, this.collectionName, membershipId);
    await setDoc(membershipRef, {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      active: membership.active,
    });
    return membershipId;
  }
  /** * Update an existing membership. */ async updateMembership(
    membershipId: string,
    changes: Partial<Omit<OrganizationMembership, 'id'>>,
  ): Promise<void> {
    const membershipRef = doc(this.db, this.collectionName, membershipId);
    await updateDoc(membershipRef, changes);
  }
  /** * Delete an existing membership. */ async deleteMembership(
    membershipId: string,
  ): Promise<void> {
    const membershipRef = doc(this.db, this.collectionName, membershipId);
    await deleteDoc(membershipRef);
  }
}

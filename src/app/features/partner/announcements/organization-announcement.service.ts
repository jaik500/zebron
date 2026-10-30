import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { firebaseAuth, firestore } from '../../../core/services/firebase-config';

import {
  OrganizationAnnouncement,
  OrganizationAnnouncementInput,
  isAnnouncementLive,
  isSafeHttpsUrl,
} from './organization-announcement.model';

/**
 * Reads and writes organization banner announcements.
 *
 * Firestore rules: every active member can read active announcements;
 * managers, admins and owners can read all of them and write them.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationAnnouncementService {
  private collectionFor(organizationId: string) {
    return collection(firestore, 'organizations', organizationId, 'announcements');
  }

  /** Active announcements that are live today, newest first. For the dashboard. */
  async getLiveAnnouncements(organizationId: string): Promise<OrganizationAnnouncement[]> {
    const snapshot = await getDocs(
      query(this.collectionFor(organizationId), where('active', '==', true)),
    );

    return this.map(organizationId, snapshot.docs)
      .filter((announcement) => isAnnouncementLive(announcement))
      .sort((a, b) => this.millis(b) - this.millis(a));
  }

  /** Every announcement, newest first. For managers on the Administration page. */
  async getAllAnnouncements(organizationId: string): Promise<OrganizationAnnouncement[]> {
    const snapshot = await getDocs(this.collectionFor(organizationId));

    return this.map(organizationId, snapshot.docs).sort((a, b) => this.millis(b) - this.millis(a));
  }

  async createAnnouncement(
    organizationId: string,
    input: OrganizationAnnouncementInput,
  ): Promise<string> {
    const uid = firebaseAuth.currentUser?.uid;

    if (!uid) {
      throw new Error('You must be signed in to create announcements.');
    }

    const reference = await addDoc(this.collectionFor(organizationId), {
      ...this.clean(input),
      organizationId,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return reference.id;
  }

  async updateAnnouncement(
    organizationId: string,
    announcementId: string,
    input: OrganizationAnnouncementInput,
  ): Promise<void> {
    await updateDoc(doc(this.collectionFor(organizationId), announcementId), {
      ...this.clean(input),
      updatedAt: serverTimestamp(),
    });
  }

  async setActive(organizationId: string, announcementId: string, active: boolean): Promise<void> {
    await updateDoc(doc(this.collectionFor(organizationId), announcementId), {
      active,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteAnnouncement(organizationId: string, announcementId: string): Promise<void> {
    await deleteDoc(doc(this.collectionFor(organizationId), announcementId));
  }

  /** Validates and trims what is written, matching the Firestore rules. */
  private clean(input: OrganizationAnnouncementInput): OrganizationAnnouncementInput {
    const title = input.title.trim();

    if (!title) {
      throw new Error('A title is required.');
    }

    if (title.length > 120) {
      throw new Error('The title must be 120 characters or fewer.');
    }

    const message = input.message.trim();

    if (message.length > 500) {
      throw new Error('The message must be 500 characters or fewer.');
    }

    const ctaLabel = input.ctaLabel?.trim() || null;
    const ctaUrl = input.ctaUrl?.trim() || null;

    if (ctaUrl && !isSafeHttpsUrl(ctaUrl)) {
      throw new Error('The button link must start with https://');
    }

    if (ctaLabel && !ctaUrl) {
      throw new Error('Add a link for the button, or clear the button text.');
    }

    const imageUrl = input.imageUrl?.trim() || null;

    if (imageUrl && !isSafeHttpsUrl(imageUrl)) {
      throw new Error('The photo link must start with https://');
    }

    const startsOn = input.startsOn || null;
    const endsOn = input.endsOn || null;

    if (startsOn && endsOn && endsOn < startsOn) {
      throw new Error('The end date must be on or after the start date.');
    }

    return {
      type: input.type,
      title,
      message,
      ctaLabel: ctaUrl ? ctaLabel ?? 'Learn more' : null,
      ctaUrl,
      eventDate: input.eventDate || null,
      honoreeName: input.honoreeName?.trim() || null,
      theme: input.theme,
      font: input.font,
      artwork: input.artwork,
      imageUrl,
      startsOn,
      endsOn,
      active: input.active === true,
    };
  }

  private map(
    organizationId: string,
    docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  ): OrganizationAnnouncement[] {
    return docs.map(
      (document) =>
        ({
          ...document.data(),
          id: document.id,
          organizationId,
        }) as OrganizationAnnouncement,
    );
  }

  private millis(announcement: OrganizationAnnouncement): number {
    const value = announcement.updatedAt ?? announcement.createdAt;

    return value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
  }
}

import { Injectable } from '@angular/core';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import {
  PartnerOrganizationSettings,
} from '../models/partner-organization-settings.model';

import { firestore } from '../../../core/services/firebase-config';

@Injectable({
  providedIn: 'root',
})
export class PartnerSettingsRepository {
  private readonly db = firestore;

  private settingsRef(organizationId: string) {
    return doc(
      this.db,
      `organizations/${organizationId}/settings/partner`,
    );
  }

  async get(
    organizationId: string,
  ): Promise<PartnerOrganizationSettings | null> {
    const snapshot = await getDoc(
      this.settingsRef(organizationId),
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      organizationId,
      ...(snapshot.data() as Omit<
        PartnerOrganizationSettings,
        'organizationId'
      >),
    };
  }

  async save(
    settings: PartnerOrganizationSettings,
  ): Promise<void> {
    await setDoc(
      this.settingsRef(settings.organizationId),
      {
        organizationId: settings.organizationId,
        testCenter: settings.testCenter,
        members: settings.members,
        notifications: settings.notifications,
        updatedAt: serverTimestamp(),
        updatedBy: settings.updatedBy,
      },
      {
        merge: true,
      },
    );
  }
}
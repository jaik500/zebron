import { Injectable, inject } from '@angular/core';
import { getAuth } from 'firebase/auth';

import {
  PartnerOrganizationSettings,
} from '../models/partner-organization-settings.model';

import {
  PartnerSettingsRepository,
} from '../repositotories/partner-settings.repository';

import { firebaseAuth } from '../../../core/services/firebase-config';

@Injectable({
  providedIn: 'root',
})
export class PartnerSettingsService {
  private readonly repository = inject(
    PartnerSettingsRepository,
  );

  private readonly auth = firebaseAuth;

  async getSettings(
    organizationId: string,
  ): Promise<PartnerOrganizationSettings> {
    const existing =
      await this.repository.get(organizationId);

    if (existing) {
      return existing;
    }

    return this.defaultSettings(organizationId);
  }

  async saveSettings(
    settings: PartnerOrganizationSettings,
  ): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error(
        'You must be authenticated to save organization settings.',
      );
    }

    await this.repository.save({
      ...settings,
      updatedBy: user.uid,
    });
  }

  private defaultSettings(
    organizationId: string,
  ): PartnerOrganizationSettings {
    return {
      organizationId,

      testCenter: {
        enabled: true,
        allowMemberTesting: true,
        courseVisibility: 'all',
      },

      members: {
        allowSelfRegistration: false,
        defaultMemberRole: 'org_member',
      },

      notifications: {
        adminNotifications: true,
        testResultNotifications: true,
      },

      updatedAt: null,
      updatedBy: '',
    };
  }
}
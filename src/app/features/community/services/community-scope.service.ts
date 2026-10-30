import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { communityOrganizationIdFromUrl } from './community-scope.util';

export { communityOrganizationIdFromUrl };

/**
 * Which Community the user is in.
 *
 * - Public Zebron Community: organizationId is null.
 * - Organization community (/partner/org/:organizationId/community/...):
 *   private to that organization's members.
 *
 * Every post query filters on organizationId and new posts are stamped
 * with it; Firestore rules enforce the same boundary.
 *
 * The scope is read from the URL being navigated to (during navigation)
 * or the current URL, so services pick it up even while a page is still
 * being created.
 */
@Injectable({ providedIn: 'root' })
export class CommunityScopeService {
  private readonly router = inject(Router);

  organizationId(): string | null {
    const navigation = this.router.getCurrentNavigation();
    const url = navigation?.finalUrl
      ? this.router.serializeUrl(navigation.finalUrl)
      : this.router.url;

    return communityOrganizationIdFromUrl(url);
  }

  isOrganizationCommunity(): boolean {
    return this.organizationId() !== null;
  }

  /** Base route of the current Community (for links). */
  homeRoute(): string[] {
    const organizationId = this.organizationId();
    return organizationId ? ['/partner/org', organizationId, 'community'] : ['/community'];
  }
}

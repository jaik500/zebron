import { Injectable, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';

import { CourseContext } from './course.model';

/**
 * Who can write courses:
 *
 *   Zebron courses        platform administrators
 *   organization courses  staff and above write drafts and submit them for
 *                         review; managers and above publish, send back,
 *                         unpublish and change live courses
 *
 * The same rules are enforced in firestore.rules.
 */
@Injectable({ providedIn: 'root' })
export class CourseAccessService {
  private readonly auth = inject(AuthService);
  private readonly partnerAccess = inject(PartnerAccessService);

  canManage(context: CourseContext): boolean {
    this.auth.user();

    if (!this.auth.firebaseUser()) {
      return false;
    }

    return context.organizationId ? this.partnerAccess.isStaffOrAbove() : this.auth.isAdmin;
  }

  /** Publish, approve, send back, unpublish, and edit live courses. */
  canPublish(context: CourseContext): boolean {
    this.auth.user();

    if (!this.auth.firebaseUser()) {
      return false;
    }

    return context.organizationId ? this.partnerAccess.isManagerOrAbove() : this.auth.isAdmin;
  }
}

import { Injectable, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';

import { CourseContext } from './course.model';

/**
 * Who can write courses:
 *
 *   Zebron courses        platform administrators
 *   organization courses  managers and above (and platform administrators)
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

    return context.organizationId ? this.partnerAccess.isManagerOrAbove() : this.auth.isAdmin;
  }
}

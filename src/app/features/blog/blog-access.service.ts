import { Injectable, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';
import { PartnerOrganizationContextService } from '../../core/services/partner-organization-context.service';

import { BlogContext, BlogSection } from './blog.model';

export interface BlogTab {
  key: BlogSection | 'manage';
  label: string;
  icon: string;
  link: string;
  /** Translate the label (organization names are not translated). */
  translate: boolean;
}

/**
 * Who can read, write and publish in each blog section.
 *
 *   public / internal  write and publish: Zebron platform administrators
 *   organization       write: staff and above · publish: managers and above
 *
 * The same rules are enforced in firestore.rules.
 */
@Injectable({ providedIn: 'root' })
export class BlogAccessService {
  private readonly auth = inject(AuthService);
  private readonly partnerAccess = inject(PartnerAccessService);
  private readonly organizationContext = inject(PartnerOrganizationContextService);

  readonly signedIn = computed(() => this.auth.firebaseUser() !== null);

  readonly isPlatformAdmin = computed(() => {
    this.auth.user();
    return this.auth.isAdmin;
  });

  /** The organization the user is working in, if any (for the Organization tab). */
  readonly organization = computed(() => this.organizationContext.organization());

  canWrite(context: BlogContext | null): boolean {
    if (!context || !this.signedIn()) {
      return false;
    }

    return context.section === 'organization'
      ? this.partnerAccess.isStaffOrAbove()
      : this.isPlatformAdmin();
  }

  canPublish(context: BlogContext | null): boolean {
    if (!context || !this.signedIn()) {
      return false;
    }

    return context.section === 'organization'
      ? this.partnerAccess.isManagerOrAbove()
      : this.isPlatformAdmin();
  }

  /** Comment and react: anyone signed in who can read the post. */
  canInteract(): boolean {
    return this.signedIn();
  }

  /** Sections this person can read, as header tabs, plus Review & manage. */
  tabs(context: BlogContext | null): BlogTab[] {
    const tabs: BlogTab[] = [
      { key: 'public', label: 'Public', icon: 'public', link: '/blog', translate: true },
    ];

    const selected = this.organization();
    const organizationId =
      context?.section === 'organization' ? context.organizationId : selected?.id ?? null;
    const organizationName = selected?.id === organizationId ? selected?.name?.trim() ?? '' : '';

    if (organizationId && this.signedIn()) {
      tabs.push({
        key: 'organization',
        label: organizationName || 'Organization',
        icon: 'lock',
        link: `/partner/org/${encodeURIComponent(organizationId)}/blog`,
        translate: !organizationName,
      });
    }

    if (this.isPlatformAdmin()) {
      tabs.push({ key: 'internal', label: 'Internal', icon: 'shield_person', link: '/admin/blog', translate: true });
    }

    if (this.canPublish(context) && context) {
      tabs.push({ key: 'manage', label: 'Review & manage', icon: 'fact_check', link: `${context.basePath}/manage`, translate: true });
    }

    return tabs;
  }
}

/** Read the blog section and organization from the current route. */
export function blogContextFromRoute(route: ActivatedRoute): BlogContext {
  let section: BlogSection = 'public';
  let organizationId: string | null = null;

  for (const snapshot of route.snapshot.pathFromRoot) {
    const value = snapshot.data['blogSection'] as BlogSection | undefined;
    if (value) {
      section = value;
    }
    organizationId = snapshot.paramMap.get('organizationId') ?? organizationId;
  }

  if (section === 'organization' && organizationId) {
    return { section, organizationId, basePath: `/partner/org/${encodeURIComponent(organizationId)}/blog` };
  }

  return section === 'internal'
    ? { section, organizationId: null, basePath: '/admin/blog' }
    : { section: 'public', organizationId: null, basePath: '/blog' };
}

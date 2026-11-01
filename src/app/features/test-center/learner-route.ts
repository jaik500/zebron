import { effect, EffectRef, inject, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { doc, getDoc } from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';

import { PageTitleService } from '../../core/services/page-title.service';
import { PartnerOrganizationContextService } from '../../core/services/partner-organization-context.service';

/**
 * The learner pages (quiz list, quiz details, setup, practice, results)
 * are served in two places:
 *
 *   /test-center/...                                  platform quizzes
 *   /partner/org/:organizationId/learn/test-center/... organization quizzes
 *
 * These helpers read the current route so links stay in the same place.
 */
export function routeOrganizationId(route: ActivatedRoute): string | null {
  for (const snapshot of route.snapshot.pathFromRoot) {
    const organizationId = snapshot.paramMap.get('organizationId');

    if (organizationId) {
      return organizationId;
    }
  }

  return null;
}

/** '/test-center' or '/partner/org/<id>/learn/test-center'. */
export function learnerBaseRoute(route: ActivatedRoute): string {
  const organizationId = routeOrganizationId(route);

  return organizationId
    ? `/partner/org/${organizationId}/learn/test-center`
    : '/test-center';
}

/**
 * Global header title: "<Organization> Learning" on organization pages,
 * "Zebron Learning" on platform pages. Call from a field initializer.
 */
export function useLearningHeaderTitle(route: ActivatedRoute): EffectRef {
  const pageTitleService = inject(PageTitleService);
  const organizationContext = inject(PartnerOrganizationContextService);
  const isOrganizationRoute = routeOrganizationId(route) !== null;

  return effect(() => {
    const name = isOrganizationRoute
      ? organizationContext.organization()?.name?.trim() || 'Organization'
      : 'Zebron';

    pageTitleService.setTitle(`${name} Learning`);
  });
}

/**
 * Whether Courses is available alongside this Test Center. Always on
 * Zebron's own pages; on organization pages only while the organization's
 * Courses capability is active (an organization can have the Test Center
 * on its own). Starts false there so course links never flash in.
 */
export function useCoursesAvailable(route: ActivatedRoute): Signal<boolean> {
  const organizationId = routeOrganizationId(route);
  const available = signal(organizationId === null);

  if (organizationId) {
    getDoc(doc(firestore, 'organizations', organizationId, 'applications', 'courses'))
      .then((snapshot) => available.set(snapshot.data()?.['status'] === 'active'))
      .catch(() => available.set(false));
  }

  return available.asReadonly();
}

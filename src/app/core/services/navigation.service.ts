import { Injectable, computed, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { FeatureConfigService } from './feature-config.service';
import { LoggerService } from './logger.service';

import {
NavigationItem,
NavigationItemState,
} from '../models/navigation-item.model';

import { FeatureAvailability } from '../models/feature-config.model';

import { OrganizationContextStore } from '../../features/organizations/stores/organization-context.store';

/**

Identifies the major application area currently being viewed.


The header uses this to display contextual navigation.
*/
export type NavigationContext =
| 'global'
| 'resources'
| 'community'
| 'learning-lab'
| 'test-center'
| 'business'
| 'admin';

@Injectable({
providedIn: 'root',
})
export class NavigationService {
private readonly authService = inject(AuthService);
private readonly featureConfigService = inject(FeatureConfigService);
private readonly organizationContextStore = inject(OrganizationContextStore);
private readonly logger = inject(LoggerService);

// ============================================================
// GLOBAL NAVIGATION
// ============================================================

/**

These are the major application destinations.


They are also used by the universal three-dot menu.


Organization-specific applications declare applicationId.
Their navigation is hidden unless the selected organization
has the corresponding active application entitlement.
*/
private readonly navigationItems: NavigationItem[] = [
{
key: 'home',
label: 'Home',
route: '/',
icon: 'home',
},
{
key: 'resources',
label: 'Resources',
route: '/resources',
icon: 'library_books',
featureKey: 'resources',
},
{
key: 'find',
label: 'Find',
route: '/find',
icon: 'search',
},
{
key: 'jobs',
label: 'Jobs',
route: '/find/job',
icon: 'work',
},
{
key: 'training',
label: 'Training',
route: '/find/training',
icon: 'school',
},
{
key: 'test-center',
label: 'Test Center',
route: '/partner/org//test-center',
icon: 'quiz',
featureKey: 'test-center',
applicationId: 'test-center',
requiresAuth: true,
},
{
key: 'community',
label: 'Community',
route: '/community',
icon: 'groups',
featureKey: 'community',
requiresAuth: true,
},
{
key: 'learning-lab',
label: 'Learning Lab',
route: '/learning',
icon: 'school',
featureKey: 'learning-lab',
requiresAuth: true,
},
{
key: 'business-operations',
label: 'Business',
route: '/admin/business',
icon: 'business_center',
featureKey: 'business-operations',
requiresAdmin: true,
},
{
key: 'profile',
label: 'Profile',
route: '/profile',
icon: 'person',
requiresAuth: true,
},
{
key: 'admin',
label: 'Admin',
route: '/admin',
icon: 'admin_panel_settings',
requiresAdmin: true,
},
];

// ============================================================
// CONTEXT NAVIGATION
// ============================================================

/**

Navigation shown on the right side of the desktop header.


Keep these routes conservative and based on routes that
actually exist in the application.
*/
private readonly contextNavigation: Record<
NavigationContext,
NavigationItem[]>

= {
global: [],

resources: [
  {
    key: 'resources',
    label: 'Resources',
    route: '/resources',
    icon: 'library_books',
    featureKey: 'resources',
  },
],

community: [
  {
    key: 'community',
    label: 'Community',
    route: '/community',
    icon: 'groups',
    featureKey: 'community',
    requiresAuth: true,
  },
],

'learning-lab': [
  {
    key: 'learning-dashboard',
    label: 'Learning Lab',
    route: '/learning',
    icon: 'school',
    featureKey: 'learning-lab',
    requiresAuth: true,
  },
],

'test-center': [
  {
    key: 'test-center',
    label: 'Test Center',
    route: '/partner/org/:organizationId/test-center',
    icon: 'quiz',
    featureKey: 'test-center',
    applicationId: 'test-center',
    requiresAuth: true,
  },
],

business: [
  {
    key: 'business-operations',
    label: 'Business',
    route: '/admin/business',
    icon: 'business_center',
    featureKey: 'business-operations',
    requiresAdmin: true,
  },
],

admin: [
  {
    key: 'admin',
    label: 'Admin',
    route: '/admin',
    icon: 'admin_panel_settings',
    requiresAdmin: true,
  },
],

};

// ============================================================
// PUBLIC STATE
// ============================================================

/**

Complete navigation available to the current user.


Used by the universal three-dot menu.
*/
readonly items = computed(() => this.navigationItems);

readonly visibleItems = computed<NavigationItemState[]>(() =>
this.navigationItems
.map((item) => this.resolveItem(item))
.filter((item) => item.visible),
);

// ============================================================
// PUBLIC API
// ============================================================

/**

Get a single navigation item.
*/
getItem(key: string): NavigationItemState | undefined {
const item = this.navigationItems.find((entry) => entry.key === key);
if (!item) {
  return undefined;
}

return this.resolveItem(item);

}

/**

Determine whether a navigation item is currently visible.
*/
isVisible(key: string): boolean {
return this.getItem(key)?.visible ?? false;
}

/**

Get contextual navigation for the current application area.
*/
getContextItems(context: NavigationContext): NavigationItemState[] {
const items = this.contextNavigation[context] ?? [];
return items
  .map((item) => this.resolveItem(item))
  .filter((item) => item.visible);

}

/**

Get Home when the current URL is not Home.
*/
getHomeItem(currentUrl: string): NavigationItemState | undefined {
if (this.isHomeRoute(currentUrl)) {
return undefined;
}
const home = this.navigationItems.find(
  (item) => item.key === 'home',
);

return home ? this.resolveItem(home) : undefined;

}

/**

Resolve the major application context from the current URL.
*/
getContextFromUrl(url: string): NavigationContext {
const normalizedUrl = this.normalizeUrl(url);
if (
  normalizedUrl === '/resources' ||
  normalizedUrl.startsWith('/resources/')
) {
  return 'resources';
}

if (
  normalizedUrl === '/community' ||
  normalizedUrl.startsWith('/community/')
) {
  return 'community';
}

if (
  normalizedUrl === '/learning' ||
  normalizedUrl.startsWith('/learning/')
) {
  return 'learning-lab';
}

if (
  normalizedUrl === '/test-center' ||
  normalizedUrl.startsWith('/test-center/') ||
  /^\/partner\/org\/[^/]+\/test-center(?:\/|$)/.test(normalizedUrl)
) {
  return 'test-center';
}

if (
  normalizedUrl === '/admin/business' ||
  normalizedUrl.startsWith('/admin/business/')
) {
  return 'business';
}

if (
  normalizedUrl === '/admin' ||
  normalizedUrl.startsWith('/admin/')
) {
  return 'admin';
}

return 'global';

}

/**

Determine whether a navigation route represents the page
currently being viewed.
*/
isCurrentRoute(
itemRoute: string,
currentUrl: string,
): boolean {
const route = this.normalizeUrl(itemRoute);
const current = this.normalizeUrl(currentUrl);
if (route === '/') {
  return current === '/';
}

// Organization application routes contain a placeholder.
// Compare the route suffix/pattern against the current URL
// without treating the placeholder as a literal segment.
if (route.includes(':organizationId')) {
  const routePattern = route
    .split('/')
    .map((segment) =>
      segment === ':organizationId' ? '[^/]+' : this.escapeRegExp(segment),
    )
    .join('/');

  return new RegExp(`^${routePattern}(?:/|$)`).test(current);
}

return (
  current === route ||
  current.startsWith(`${route}/`)
);

}

// ============================================================
// PRIVATE
// ============================================================

private resolveItem(item: NavigationItem): NavigationItemState {
let visible = true;
let availability: FeatureAvailability | undefined;

// ----------------------------------------------------------
// Authentication
// ----------------------------------------------------------

if (item.requiresAuth && !this.authService.firebaseUser) {
  visible = false;
}

// ----------------------------------------------------------
// Administrator authorization
// ----------------------------------------------------------

if (item.requiresAdmin && !this.authService.isAdmin) {
  visible = false;
}

// ----------------------------------------------------------
// Organization application entitlement
// ----------------------------------------------------------

if (visible && item.applicationId) {
  const store = this.organizationContextStore;

  const selectedOrganizationId = store.selectedOrganizationId();
  const applicationsLoading = store.applicationsLoading();
  const applicationsError = store.applicationsError();

  /**
   * Fail closed when:
   * - there is no selected organization,
   * - application entitlements are still loading,
   * - the entitlement lookup failed, or
   * - the application is not active for this organization.
   *
   * This also prevents an old organization's entitlement
   * from being used to display navigation for a new one.
   */
  if (
    !selectedOrganizationId ||
    applicationsLoading ||
    applicationsError ||
    !store.hasActiveApplication(item.applicationId)
  ) {
    visible = false;
  }
}

// ----------------------------------------------------------
// Global feature availability
// ----------------------------------------------------------

if (visible && item.featureKey) {
  const feature = this.featureConfigService.get(item.featureKey);

  if (!feature) {
    this.logger.warn(
      'NavigationService',
      'Navigation item references an unknown feature.',
      {
        key: item.key,
        featureKey: item.featureKey,
      },
    );
  } else {
    availability = feature.availability;

    if (
      !feature.enabled ||
      feature.availability !== 'enabled' ||
      !feature.visibleInNavigation
    ) {
      visible = false;
    }
  }
}

return {
  ...item,
  availability,
  visible,
};

}

private isHomeRoute(url: string): boolean {
return this.normalizeUrl(url) === '/';
}

private normalizeUrl(url: string): string {
const cleanUrl = url.split('?')[0].split('#')[0];

if (!cleanUrl || cleanUrl === '/') {
  return '/';
}

return cleanUrl.endsWith('/')
  ? cleanUrl.slice(0, -1)
  : cleanUrl;

}

private escapeRegExp(value: string): string {
return value.replace(/[.*+?^${}()|[]\]/g, '\$&');
}

/**

Returns the navigation displayed directly in the desktop header.


Rules:


Home appears on every non-home page.


Home does not appear on the Home page.


Related contextual navigation is included.


The current page/section is excluded.


Hidden or unauthorized navigation items are excluded.
*/
getHeaderItems(
currentUrl: string,
): NavigationItemState[] {
const normalizedUrl = this.normalizeUrl(currentUrl);
if (normalizedUrl === '/') {
  return [];
}

const context = this.getContextFromUrl(normalizedUrl);

const relatedItems = this.getContextItems(context)
  .filter(
    (item) => !this.isCurrentRoute(item.route, normalizedUrl),
  );

const home = this.getItem('home');

const result: NavigationItemState[] = [];

if (home?.visible) {
  result.push(home);
}

result.push(...relatedItems);

const seen = new Set<string>();

return result.filter((item) => {
  if (seen.has(item.key)) {
    return false;
  }

  seen.add(item.key);

  return true;
});

}
}
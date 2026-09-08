import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { FeatureConfigService } from './feature-config.service';
import { LoggerService } from './logger.service';
import {
  NavigationItem,
  NavigationItemState,
} from '../models/navigation-item.model';
import { FeatureAvailability } from '../models/feature-config.model';

/**
 * Identifies the major application area currently being viewed.
 *
 * The header uses this to display contextual navigation.
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
  private readonly logger = inject(LoggerService);

  // ============================================================
  // GLOBAL NAVIGATION
  // ============================================================

  /**
   * These are the major application destinations.
   *
   * They are also used by the universal three-dot menu.
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
      route: '/test-center',
      icon: 'quiz',
      featureKey: 'test-center',
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
   * Navigation shown on the right side of the desktop header.
   *
   * Keep these routes conservative and based on routes that
   * actually exist in the application.
   */
  private readonly contextNavigation: Record<
    NavigationContext,
    NavigationItem[]
  > = {
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
        route: '/test-center',
        icon: 'quiz',
        featureKey: 'test-center',
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

  readonly items = computed(() => this.navigationItems);

  /**
   * Complete navigation available to the current user.
   *
   * Used by the universal three-dot menu.
   */
  readonly visibleItems = computed<NavigationItemState[]>(() =>
    this.navigationItems
      .map((item) => this.resolveItem(item))
      .filter((item) => item.visible),
  );

  // ============================================================
  // PUBLIC API
  // ============================================================

  /**
   * Get a single navigation item.
   */
  getItem(key: string): NavigationItemState | undefined {
    const item = this.navigationItems.find((entry) => entry.key === key);

    if (!item) {
      return undefined;
    }

    return this.resolveItem(item);
  }

  /**
   * Determine whether a navigation item is currently visible.
   */
  isVisible(key: string): boolean {
    return this.getItem(key)?.visible ?? false;
  }

  /**
   * Get contextual navigation for the current application area.
   */
  getContextItems(context: NavigationContext): NavigationItemState[] {
    const items = this.contextNavigation[context] ?? [];

    return items
      .map((item) => this.resolveItem(item))
      .filter((item) => item.visible);
  }

  /**
   * Get Home when the current URL is not Home.
   *
   * This is intentionally separate from contextual navigation.
   *
   * Every application page should provide a way back Home,
   * while the Home page itself should not display a Home link.
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
   * Resolve the major application context from the current URL.
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
      normalizedUrl.startsWith('/test-center/')
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
   * Determine whether a navigation route represents the page
   * currently being viewed.
   *
   * Example:
   *
   * /community
   * /community/post/123
   *
   * are both considered part of the Community section.
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
    // Feature availability
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

        /**
         * Do not hide the navigation item simply because the
         * configuration has not been registered yet.
         *
         * Authentication and authorization checks above still
         * apply.
         */
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

  /**
 * Returns the navigation displayed directly in the desktop
 * Zebron header.
 *
 * Rules:
 *
 * - Home appears on every non-home page.
 * - Home does not appear on the Home page.
 * - Related contextual navigation is included.
 * - The current page/section is excluded.
 * - Hidden, disabled, maintenance, unauthorized, and
 *   unavailable navigation items are excluded.
 */
getHeaderItems(
  currentUrl: string,
): NavigationItemState[] {

  const normalizedUrl =
    this.normalizeUrl(currentUrl);

  // Home page has no header navigation.
  if (normalizedUrl === '/') {
    return [];
  }

  const context =
    this.getContextFromUrl(normalizedUrl);

  const relatedItems =
    this.getContextItems(context)
      .filter(
        (item) =>
          !this.isCurrentRoute(
            item.route,
            normalizedUrl,
          ),
      );

  // Home should always be first on non-home pages.
  const home =
    this.getItem('home');

  const result: NavigationItemState[] = [];

  if (home?.visible) {
    result.push(home);
  }

  result.push(...relatedItems);

  // Prevent duplicate navigation entries.
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
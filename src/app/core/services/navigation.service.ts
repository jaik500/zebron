import {
  Injectable,
  computed,
  inject,
} from '@angular/core';

import {
  NavigationItem,
  NavigationItemState,
} from '../models/navigation-item.model';

import {
  FeatureConfigService,
} from './feature-config.service';

import {
  LoggerService,
} from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {

  private readonly featureConfigService =
    inject(FeatureConfigService);

  private readonly logger =
    inject(LoggerService);

  /**
   * =========================================================
   * ZEBRON PRIMARY NAVIGATION
   * =========================================================
   *
   * This is the central definition of application navigation.
   *
   * Do not put feature-availability logic directly into
   * individual header/sidebar components.
   */
  private readonly navigationItems:
    NavigationItem[] = [

    // -------------------------------------------------------
    // HOME
    // -------------------------------------------------------
    {
      key: 'home',
      label: 'Home',
      route: '/',
      icon: 'home',
    },

    // -------------------------------------------------------
    // RESOURCES
    // -------------------------------------------------------
    {
      key: 'resources',
      label: 'Resources',
      route: '/resources',
      icon: 'library_books',
      featureKey: 'resources',
    },

    // -------------------------------------------------------
    // FIND
    // -------------------------------------------------------
    {
      key: 'find',
      label: 'Find Resources',
      route: '/find',
      icon: 'search',
    },

    // -------------------------------------------------------
    // JOBS
    // -------------------------------------------------------
    {
      key: 'jobs',
      label: 'Jobs',
      route: '/find/job',
      icon: 'work',
    },

    // -------------------------------------------------------
    // TRAINING
    // -------------------------------------------------------
    {
      key: 'training',
      label: 'Training',
      route: '/find/training',
      icon: 'school',
    },

    // -------------------------------------------------------
    // TEST CENTER
    // -------------------------------------------------------
    {
      key: 'test-center',
      label: 'Test Center',
      route: '/test-center',
      icon: 'quiz',
      featureKey: 'test-center',
    },

    // -------------------------------------------------------
    // COMMUNITY
    // -------------------------------------------------------
    {
      key: 'community',
      label: 'Community',
      route: '/community',
      icon: 'groups',
      featureKey: 'community',
      requiresAuth: true,
    },

    // -------------------------------------------------------
    // LEARNING LAB
    // -------------------------------------------------------
    {
      key: 'learning-lab',
      label: 'Learning Lab',
      route: '/profile',
      icon: 'school',
      featureKey: 'learning-lab',
      requiresAuth: true,
    },

    // -------------------------------------------------------
    // BUSINESS OPERATIONS
    // -------------------------------------------------------
    {
      key: 'business-operations',
      label: 'Business',
      route: '/admin/business',
      icon: 'business_center',
      featureKey: 'business-operations',
      requiresAdmin: true,
    },

    // -------------------------------------------------------
    // PROFILE
    // -------------------------------------------------------
    {
      key: 'profile',
      label: 'Profile',
      route: '/profile',
      icon: 'account_circle',
      requiresAuth: true,
    },

    // -------------------------------------------------------
    // ADMIN
    // -------------------------------------------------------
    {
      key: 'admin',
      label: 'Admin',
      route: '/admin',
      icon: 'admin_panel_settings',
      requiresAdmin: true,
    },
  ];

  /**
   * Raw navigation definitions.
   */
  readonly items =
    computed(() =>
      this.navigationItems,
    );

  /**
   * Navigation items that are currently visible.
   *
   * A feature-controlled item is visible only when:
   *
   * 1. The feature exists.
   * 2. visibleInNavigation is true.
   * 3. The feature is enabled.
   */
  readonly visibleItems =
    computed(() => {

      return this.navigationItems
        .map(
          (item) =>
            this.resolveItem(item),
        )
        .filter(
          (
            item,
          ) => item.visible,
        );
    });

  /**
   * Return the navigation state for one item.
   */
  getItem(
    key: string,
  ): NavigationItemState | null {

    const item =
      this.navigationItems.find(
        (navigationItem) =>
          navigationItem.key === key,
      );

    if (!item) {
      return null;
    }

    return this.resolveItem(item);
  }

  /**
   * Determine whether an item is visible.
   */
  isVisible(
    key: string,
  ): boolean {

    return (
      this.getItem(key)
        ?.visible ??
      false
    );
  }

  /**
   * Resolve feature configuration into
   * navigation state.
   */
  private resolveItem(
    item: NavigationItem,
  ): NavigationItemState {

    /*
     * Items without feature configuration are
     * always available from the feature perspective.
     */
    if (!item.featureKey) {

      return {
        ...item,
        visible: true,
      };
    }

    const feature =
      this.featureConfigService.get(
        item.featureKey,
      );

    /*
     * If the feature hasn't been configured yet,
     * fail safely by keeping the item visible.
     *
     * The route guard remains the enforcement layer.
     */
    if (!feature) {

      this.logger.warn(
        'NavigationService',
        'Navigation item references an unknown feature.',
        {
          navigationKey:
            item.key,

          featureKey:
            item.featureKey,
        },
      );

      return {
        ...item,
        visible: true,
      };
    }

    const visible =
      feature.enabled &&
      feature.availability ===
        'enabled' &&
      feature.visibleInNavigation;

    return {
      ...item,

      availability:
        feature.availability,

      visible,
    };
  }
}
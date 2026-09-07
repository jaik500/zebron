import { FeatureAvailability } from './feature-config.model';

export interface NavigationItem {
  key: string;
  label: string;
  route: string;
  icon: string;

  /**
   * Optional feature configuration key.
   *
   * When present, navigation visibility and availability
   * are controlled by FeatureConfigService.
   */
  featureKey?: string;

  /**
   * Whether authentication is required.
   */
  requiresAuth?: boolean;

  /**
   * Whether administrator privileges are required.
   */
  requiresAdmin?: boolean;

  /**
   * Optional children for grouped navigation.
   */
  children?: NavigationItem[];
}

export interface NavigationItemState
  extends NavigationItem {
  availability?: FeatureAvailability;
  visible: boolean;
}
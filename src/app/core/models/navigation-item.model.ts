import { FeatureAvailability } from './feature-config.model';

/**

* Defines an item that can appear in application navigation.
*
* `applicationId` is optional. When provided, the item is visible only
* when the selected organization has that application activated.
*
* This is a UI visibility rule, not a security boundary. Routes and backend
* operations must independently enforce application access.
  */
  export interface NavigationItem {
  key: string;
  label: string;
  route: string;
  icon: string;

/** Global feature configuration key. */
featureKey?: string;

/** Organization application entitlement required to show this item. */
applicationId?: string;

requiresAuth?: boolean;
requiresAdmin?: boolean;

children?: NavigationItem[];
}

/**

* Navigation item with its resolved runtime visibility and availability.
  */
  export interface NavigationItemState extends NavigationItem {
  availability?: FeatureAvailability;
  visible: boolean;
  }

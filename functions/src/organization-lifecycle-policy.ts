/**
 * Organization lifecycle states supported by Zebron.
 */
export type OrganizationLifecycleStatus =
  | "pending"
  | "provisioning"
  | "onboarding"
  | "active"
  | "suspended"
  | "archived";

/**
 * Lifecycle operations available to platform administrators.
 */
export type OrganizationLifecycleAction =
  | "suspend"
  | "reactivate"
  | "archive"
  | "restore";

/**
 * Saved lifecycle statuses used to restore an organization.
 */
export interface OrganizationLifecycleState {
  status: OrganizationLifecycleStatus;
  previousStatus?: OrganizationLifecycleStatus;
  preArchiveStatus?: OrganizationLifecycleStatus;
}

/**
 * Determine whether a status is supported.
 */
export function isOrganizationLifecycleStatus(
  value: unknown,
): value is OrganizationLifecycleStatus {
  return (
    typeof value === "string" &&
    [
      "pending",
      "provisioning",
      "onboarding",
      "active",
      "suspended",
      "archived",
    ].includes(value)
  );
}

/**
 * Resolve a legacy organization record.
 *
 * Records without status use the legacy active boolean.
 */
export function resolveOrganizationLifecycleStatus(
  status: unknown,
  active?: boolean,
): OrganizationLifecycleStatus {
  if (status !== undefined) {
    if (!isOrganizationLifecycleStatus(status)) {
      throw new Error(
        `Unsupported organization lifecycle status: ${String(status)}.`,
      );
    }

    return status;
  }

  return active === false ? "suspended" : "active";
}

/**
 * Resolve a valid lifecycle transition.
 *
 * This function is deliberately independent of Firebase.
 * It can be tested quickly using Vitest.
 */
export function resolveOrganizationLifecycleTransition(
  action: OrganizationLifecycleAction,
  organization: OrganizationLifecycleState,
): {
  previousStatus: OrganizationLifecycleStatus;
  status: OrganizationLifecycleStatus;
} {
  const currentStatus = organization.status;

  switch (action) {
    case "suspend": {
      if (
        currentStatus !== "active" &&
        currentStatus !== "onboarding"
      ) {
        throw new Error(
          `An organization in ${currentStatus} status cannot be suspended.`,
        );
      }

      return {
        previousStatus: currentStatus,
        status: "suspended",
      };
    }

    case "reactivate": {
      if (currentStatus !== "suspended") {
        throw new Error(
          "Only suspended organizations can be reactivated.",
        );
      }

      const previousStatus =
        organization.previousStatus ?? "active";

      if (
        previousStatus !== "active" &&
        previousStatus !== "onboarding"
      ) {
        throw new Error(
          "The saved previous status cannot be reactivated.",
        );
      }

      return {
        previousStatus: currentStatus,
        status: previousStatus,
      };
    }

    case "archive": {
      if (
        currentStatus !== "active" &&
        currentStatus !== "onboarding"
      ) {
        throw new Error(
          `An organization in ${currentStatus} status cannot be archived.`,
        );
      }

      return {
        previousStatus: currentStatus,
        status: "archived",
      };
    }

    case "restore": {
      if (currentStatus !== "archived") {
        throw new Error(
          "Only archived organizations can be restored.",
        );
      }

      const previousStatus =
        organization.preArchiveStatus ?? "active";

      if (
        previousStatus !== "active" &&
        previousStatus !== "onboarding"
      ) {
        throw new Error(
          "The saved pre-archive status cannot be restored.",
        );
      }

      return {
        previousStatus: currentStatus,
        status: previousStatus,
      };
    }
  }
}
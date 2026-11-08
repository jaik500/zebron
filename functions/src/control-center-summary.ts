import { getFirestore } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";

import { requirePlatformAdministrator } from "./platform-admin-authorization";

const REGION = "us-central1";
const UNRESOLVED = ["open", "investigating", "acknowledged"];

/**
 * Counts for Control Center -> Overview, in one call. Some of these
 * collections (partner requests, support tickets) are server-only, so
 * the browser cannot count them itself. Platform administrators only.
 * Callable name: getControlCenterSummary
 */
export const getControlCenterSummary = onCall({ region: REGION }, async (request) => {
  await requirePlatformAdministrator(request);

  const db = getFirestore();
  const count = async (query: FirebaseFirestore.Query): Promise<number | null> => {
    try {
      return (await query.count().get()).data().count;
    } catch {
      // A missing index or collection must not break the whole summary.
      return null;
    }
  };

  const organizations = db.collection("organizations");
  const events = db.collection("operationalEvents");

  const [
    activeOrganizations,
    suspendedOrganizations,
    onboardingOrganizations,
    partnerRequests,
    organizationSignUps,
    resourceSubmissions,
    openTickets,
    openEvents,
    criticalEvents,
  ] = await Promise.all([
    count(organizations.where("status", "==", "active")),
    count(organizations.where("status", "==", "suspended")),
    count(organizations.where("status", "in", ["pending", "provisioning", "onboarding"])),
    count(db.collection("organizationServiceRequests").where("status", "==", "submitted")),
    count(db.collection("organizationApplicationRequests").where("status", "in", ["submitted", "under_review"])),
    count(db.collection("submissions").where("status", "==", "pending")),
    count(db.collection("supportTickets").where("status", "in", ["open", "in_progress"])),
    count(events.where("status", "in", UNRESOLVED)),
    count(events.where("status", "in", UNRESOLVED).where("severity", "==", "critical")),
  ]);

  return {
    organizations: {
      active: activeOrganizations,
      suspended: suspendedOrganizations,
      onboarding: onboardingOrganizations,
    },
    waiting: {
      partnerRequests,
      organizationSignUps,
      resourceSubmissions,
      openTickets,
    },
    events: {
      open: openEvents,
      critical: criticalEvents,
    },
    generatedAt: new Date().toISOString(),
  };
});

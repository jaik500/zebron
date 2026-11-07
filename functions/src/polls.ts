/* eslint-disable max-len */
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { isPlatformAdministrator } from "./platform-admin-authorization";

/**
 * Shared polls (community posts and live sessions): cast or change a vote.
 *
 * polls/{pollId}                  question, options, settings (written by the browser, checked by rules)
 * polls/{pollId}/results/summary  { counts: { [optionId]: number }, totalVoters }  (written only here)
 * polls/{pollId}/votes/{uid}      { optionIds }  (written only here; readable only by the voter)
 *
 * Counting on the server keeps totals honest, supports several answers per
 * person and changing a vote, and keeps everyone's answer private.
 */

const REGION = "us-central1";

export const castPollVote = onCall({ region: REGION }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to vote.");
  }

  const data = (request.data ?? {}) as Record<string, unknown>;
  const pollId = clean(data.pollId);
  const optionIds = Array.isArray(data.optionIds) ?
    [...new Set(data.optionIds.filter((id): id is string => typeof id === "string").map((id) => id.trim()))] :
    [];

  if (!pollId || pollId.includes("/") || optionIds.length === 0) {
    throw new HttpsError("invalid-argument", "Pick an answer.");
  }

  const db = getFirestore();
  const pollRef = db.collection("polls").doc(pollId);
  const resultsRef = pollRef.collection("results").doc("summary");
  const voteRef = pollRef.collection("votes").doc(uid);

  const pollSnapshot = await pollRef.get();
  if (!pollSnapshot.exists) {
    throw new HttpsError("not-found", "This poll no longer exists.");
  }

  await requireAccess(request, uid, pollSnapshot.get("contextType"), clean(pollSnapshot.get("organizationId")) || null);

  await db.runTransaction(async (transaction) => {
    const [poll, results, vote] = await Promise.all([
      transaction.get(pollRef),
      transaction.get(resultsRef),
      transaction.get(voteRef),
    ]);

    if (!poll.exists) {
      throw new HttpsError("not-found", "This poll no longer exists.");
    }

    const closesAt = poll.get("closesAt") as Timestamp | null | undefined;
    if (poll.get("status") !== "open" || (closesAt && closesAt.toMillis() <= Date.now())) {
      throw new HttpsError("failed-precondition", "This poll is closed.");
    }

    const validIds = new Set(
      ((poll.get("options") ?? []) as Array<{ id?: unknown }>)
        .map((option) => (typeof option?.id === "string" ? option.id : ""))
        .filter(Boolean),
    );
    if (optionIds.some((id) => !validIds.has(id))) {
      throw new HttpsError("invalid-argument", "That answer is not part of this poll.");
    }

    const allowMultiple = poll.get("allowMultiple") === true;
    const maxChoices = allowMultiple ? Math.max(1, Number(poll.get("maxChoices") ?? validIds.size)) : 1;
    if (optionIds.length > maxChoices) {
      throw new HttpsError("invalid-argument", maxChoices === 1 ? "Pick one answer." : `Pick up to ${maxChoices} answers.`);
    }

    const previous = vote.exists ?
      ((vote.get("optionIds") ?? []) as unknown[]).filter((id): id is string => typeof id === "string") :
      [];

    const counts: Record<string, number> = {};
    const stored = (results.get("counts") ?? {}) as Record<string, unknown>;
    for (const id of validIds) {
      counts[id] = Math.max(0, Number(stored[id] ?? 0) || 0);
    }
    for (const id of previous) {
      if (id in counts) counts[id] = Math.max(0, counts[id] - 1);
    }
    for (const id of optionIds) {
      counts[id] = (counts[id] ?? 0) + 1;
    }

    const totalVoters = Math.max(0, Number(results.get("totalVoters") ?? 0) || 0) + (vote.exists ? 0 : 1);

    transaction.set(resultsRef, { counts, totalVoters, updatedAt: FieldValue.serverTimestamp() });
    transaction.set(voteRef, {
      optionIds,
      updatedAt: FieldValue.serverTimestamp(),
      ...(vote.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });
  });

  logger.info("Poll vote.", { pollId });

  return { ok: true };
});

/**
 * The same boundary as the Firestore rules: anyone signed in for the public
 * Community; active members for an organization community; members of an
 * organization with the Virtual Classroom for live sessions.
 */
async function requireAccess(
  request: Parameters<typeof isPlatformAdministrator>[0],
  uid: string,
  contextType: unknown,
  organizationId: string | null,
): Promise<void> {
  if (contextType === "community" && organizationId === null) {
    return;
  }

  if (!organizationId || organizationId.includes("/") || (contextType !== "community" && contextType !== "live")) {
    throw new HttpsError("permission-denied", "You can't vote in this poll.");
  }

  if (await isPlatformAdministrator(request)) {
    return;
  }

  const db = getFirestore();
  const organizationRef = db.collection("organizations").doc(organizationId);
  const [organization, membership, entitlement] = await Promise.all([
    organizationRef.get(),
    db.doc(`organizationMemberships/${uid}_${organizationId}`).get(),
    contextType === "live" ? organizationRef.collection("applications").doc("virtual-classroom").get() : Promise.resolve(null),
  ]);

  const status = organization.exists ?
    (organization.get("status") ?? (organization.get("active") === false ? "suspended" : "active")) :
    "missing";

  if (status !== "active" || membership.get("active") !== true) {
    throw new HttpsError("permission-denied", "Only members of this organization can vote.");
  }

  if (entitlement && entitlement.get("status") !== "active") {
    throw new HttpsError("failed-precondition", "This organization does not have the Virtual Classroom.");
  }
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

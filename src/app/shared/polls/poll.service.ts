import { Injectable } from '@angular/core';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';
import {
  POLL_LIMITS,
  Poll,
  PollContext,
  PollDraft,
  PollResults,
  PollResultsVisibility,
  PollStatus,
  pollFromData,
} from './poll.model';

/** Stop listening. */
export type Unsubscribe = () => void;

/**
 * Shared polls for the community feed and live sessions.
 *
 * Reads are real time (onSnapshot). Voting goes through the castPollVote
 * Cloud Function, which checks the person may vote and updates the totals
 * in one transaction.
 */
@Injectable({ providedIn: 'root' })
export class PollService {
  private readonly polls = collection(firestore, 'polls');

  /** An id for a poll that will be created later (lets a post link to it first). */
  newPollId(): string {
    return doc(this.polls).id;
  }

  /** Create a poll from the editor's draft. Returns the poll id. */
  async create(
    context: PollContext,
    draft: PollDraft,
    options: {
      id?: string;
      status: PollStatus;
      resultsVisibility: PollResultsVisibility;
      createdBy: string;
      createdByName: string;
    },
  ): Promise<string> {
    const ref = options.id ? doc(this.polls, options.id) : doc(this.polls);
    const answers = draft.options
      .map((option) => option.trim().slice(0, POLL_LIMITS.optionLength))
      .filter(Boolean)
      .slice(0, POLL_LIMITS.maxOptions)
      .map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
    const closesAt = draft.closesAt ? new Date(draft.closesAt) : null;

    await setDoc(ref, {
      contextType: context.type,
      organizationId: context.organizationId,
      parentId: context.parentId,
      question: draft.question.trim().slice(0, POLL_LIMITS.questionLength),
      options: answers,
      allowMultiple: draft.allowMultiple,
      maxChoices: draft.allowMultiple ? Math.max(2, Math.min(answers.length, Math.round(draft.maxChoices))) : 1,
      status: options.status,
      resultsVisibility: options.resultsVisibility,
      showResults: false,
      closesAt: closesAt && !Number.isNaN(closesAt.getTime()) ? Timestamp.fromDate(closesAt) : null,
      createdBy: options.createdBy,
      createdByName: options.createdByName.trim().slice(0, 120),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  }

  watchPoll(pollId: string, next: (poll: Poll | null) => void, error?: (error: unknown) => void): Unsubscribe {
    return onSnapshot(
      doc(this.polls, pollId),
      (snapshot) => next(snapshot.exists() ? pollFromData(snapshot.id, snapshot.data() ?? {}) : null),
      (problem) => error?.(problem),
    );
  }

  /**
   * Totals. Firestore refuses the read until the person may see them (see
   * firestore.rules), so `error` is the normal "not yet" signal: callers
   * keep listening and get the totals once they are revealed.
   */
  watchResults(pollId: string, next: (results: PollResults) => void, error?: (error: unknown) => void): Unsubscribe {
    return onSnapshot(
      doc(this.polls, pollId, 'results', 'summary'),
      (snapshot) => {
        const data = snapshot.data() ?? {};
        const counts: Record<string, number> = {};
        const raw = (data['counts'] ?? {}) as Record<string, unknown>;
        for (const [key, value] of Object.entries(raw)) {
          counts[key] = Math.max(0, Number(value) || 0);
        }
        next({ counts, totalVoters: Math.max(0, Number(data['totalVoters']) || 0) });
      },
      (problem) => error?.(problem),
    );
  }

  /** The signed-in person's own answer (empty = not voted). */
  watchMyVote(pollId: string, userId: string, next: (optionIds: string[]) => void): Unsubscribe {
    return onSnapshot(
      doc(this.polls, pollId, 'votes', userId),
      (snapshot) => {
        const ids = snapshot.data()?.['optionIds'];
        next(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
      },
      () => next([]),
    );
  }

  /**
   * Polls of one live session, newest first. Hosts see drafts too; everyone
   * else only open and closed polls (the query must say so for the rules).
   */
  watchSessionPolls(
    organizationId: string,
    sessionId: string,
    includeDrafts: boolean,
    next: (polls: Poll[]) => void,
    error?: (error: unknown) => void,
  ): Unsubscribe {
    const filters = [
      where('contextType', '==', 'live'),
      where('organizationId', '==', organizationId),
      where('parentId', '==', sessionId),
      ...(includeDrafts ? [] : [where('status', 'in', ['open', 'closed'])]),
    ];

    return onSnapshot(
      query(this.polls, ...filters),
      (snapshot) =>
        next(
          snapshot.docs
            .map((document) => pollFromData(document.id, document.data()))
            .sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now())),
        ),
      (problem) => error?.(problem),
    );
  }

  /** Vote, or change your vote. */
  async vote(pollId: string, optionIds: string[]): Promise<void> {
    const callable = httpsCallable<{ pollId: string; optionIds: string[] }, { ok: boolean }>(
      firebaseFunctions,
      'castPollVote',
    );
    await callable({ pollId, optionIds });
  }

  /** Host / author controls: open, close, reveal totals, change the closing time. */
  update(pollId: string, patch: Partial<{ status: PollStatus; showResults: boolean; closesAt: Date | null }>): Promise<void> {
    return updateDoc(doc(this.polls, pollId), {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.showResults !== undefined ? { showResults: patch.showResults } : {}),
      ...(patch.closesAt !== undefined ? { closesAt: patch.closesAt ? Timestamp.fromDate(patch.closesAt) : null } : {}),
      updatedAt: serverTimestamp(),
    });
  }

  remove(pollId: string): Promise<void> {
    return deleteDoc(doc(this.polls, pollId));
  }
}

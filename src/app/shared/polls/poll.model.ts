import { Timestamp } from 'firebase/firestore';

/**
 * Shared polls: one poll model for every place Zebron asks a quick question.
 *
 *   polls/{pollId}                  the question, options and settings
 *   polls/{pollId}/results/summary  vote totals (written by castPollVote)
 *   polls/{pollId}/votes/{uid}      a person's own answer (written by castPollVote)
 *
 * Votes are counted on the server so totals can't be tampered with, and
 * nobody can read another person's answer. Who can read the totals, and
 * when, is decided by `resultsVisibility` (see firestore.rules).
 */

/** Where the poll lives. */
export type PollContextType = 'community' | 'live';

export interface PollContext {
  type: PollContextType;
  /** null = public Zebron Community. Live sessions always have one. */
  organizationId: string | null;
  /** The community post or live session the poll belongs to. */
  parentId: string;
}

/**
 * - draft: only the host sees it (live sessions).
 * - open: people can vote.
 * - closed: voting has ended; totals are visible to everyone who can see the poll.
 */
export type PollStatus = 'draft' | 'open' | 'closed';

/**
 * - afterVote: you see the totals once you have voted (community).
 * - host: the host decides when everyone sees the totals (live sessions).
 * Totals are always visible to whoever runs the poll, and to everyone once it closes.
 */
export type PollResultsVisibility = 'afterVote' | 'host';

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  contextType: PollContextType;
  organizationId: string | null;
  parentId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  /** Most answers one person may pick (1 when allowMultiple is off). */
  maxChoices: number;
  status: PollStatus;
  resultsVisibility: PollResultsVisibility;
  /** Live sessions: the host has revealed the totals. */
  showResults: boolean;
  /** Voting ends automatically at this time (optional). */
  closesAt: Date | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date | null;
}

export interface PollResults {
  /** Votes per option id. */
  counts: Record<string, number>;
  /** People who voted (one person can pick several options). */
  totalVoters: number;
}

/** What the editor produces; the service turns it into a Poll. */
export interface PollDraft {
  question: string;
  options: string[];
  allowMultiple: boolean;
  maxChoices: number;
  /** <input type="datetime-local"> value, or '' for no closing time. */
  closesAt: string;
}

export const POLL_LIMITS = {
  questionLength: 300,
  optionLength: 120,
  minOptions: 2,
  maxOptions: 10,
} as const;

export function emptyPollDraft(): PollDraft {
  return { question: '', options: ['', ''], allowMultiple: false, maxChoices: 2, closesAt: '' };
}

/** Problems that stop the draft being saved (empty list = ready). */
export function pollDraftProblems(draft: PollDraft): string[] {
  const problems: string[] = [];
  const options = draft.options.map((option) => option.trim()).filter(Boolean);

  if (!draft.question.trim()) {
    problems.push('Add a question.');
  }
  if (options.length < POLL_LIMITS.minOptions) {
    problems.push('Add at least two answers.');
  }
  if (new Set(options.map((option) => option.toLocaleLowerCase())).size !== options.length) {
    problems.push('Each answer must be different.');
  }
  if (draft.closesAt) {
    const closes = new Date(draft.closesAt);
    if (Number.isNaN(closes.getTime()) || closes.getTime() <= Date.now()) {
      problems.push('Pick a closing time in the future.');
    }
  }
  return problems;
}

/** True once the closing time has passed, or the poll was closed. */
export function isPollClosed(poll: Pick<Poll, 'status' | 'closesAt'>, now = Date.now()): boolean {
  return poll.status === 'closed' || (!!poll.closesAt && poll.closesAt.getTime() <= now);
}

/** Map a Firestore document to a Poll (missing fields get safe defaults). */
export function pollFromData(id: string, data: Record<string, unknown>): Poll {
  const options = Array.isArray(data['options'])
    ? (data['options'] as unknown[])
        .map((option) => {
          const value = (option ?? {}) as Record<string, unknown>;
          return { id: text(value['id']), text: text(value['text']) };
        })
        .filter((option) => option.id && option.text)
    : [];
  const allowMultiple = data['allowMultiple'] === true;
  const status = data['status'];

  return {
    id,
    contextType: data['contextType'] === 'live' ? 'live' : 'community',
    organizationId: text(data['organizationId']) || null,
    parentId: text(data['parentId']),
    question: text(data['question']),
    options,
    allowMultiple,
    maxChoices: allowMultiple ? Math.max(2, Math.min(options.length, Number(data['maxChoices'] ?? options.length))) : 1,
    status: status === 'draft' || status === 'closed' ? status : 'open',
    resultsVisibility: data['resultsVisibility'] === 'host' ? 'host' : 'afterVote',
    showResults: data['showResults'] === true,
    closesAt: (data['closesAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
    createdBy: text(data['createdBy']),
    createdByName: text(data['createdByName']),
    createdAt: (data['createdAt'] as Timestamp | null | undefined)?.toDate?.() ?? null,
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

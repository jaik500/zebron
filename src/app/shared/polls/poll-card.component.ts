import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { Poll, PollResults, isPollClosed } from './poll.model';
import { PollService, Unsubscribe } from './poll.service';

/**
 * One poll: vote, change your vote, see the totals when allowed, and (for
 * whoever runs it) open, reveal, close, reopen or delete it.
 *
 *   <app-poll-card [pollId]="post.pollId" [canManage]="isAuthor" />
 *   <app-poll-card [poll]="poll" [canManage]="isHost" />   (already loaded)
 */
@Component({
  selector: 'app-poll-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgClass, MatIconModule, TranslatePipe],
  template: `
    @if (poll(); as poll) {
      <section
        class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4"
        [attr.aria-labelledby]="'poll-q-' + poll.id"
        (click)="$event.stopPropagation()"
      >
        <div class="flex min-w-0 items-start gap-2">
          <mat-icon class="mt-0.5 !h-5 !w-5 shrink-0 !text-xl !leading-none text-[#007979]" aria-hidden="true">poll</mat-icon>
          <div class="min-w-0 flex-1">
            <h3 [id]="'poll-q-' + poll.id" class="break-words text-base font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
              {{ poll.question }}
            </h3>
            <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              <span>{{ poll.allowMultiple ? ('Pick up to {0}' | t: [poll.maxChoices]) : ('Pick one' | t) }}</span>
              @if (results(); as totals) {
                <span>· {{ (totals.totalVoters === 1 ? '1 vote' : '{0} votes') | t: [totals.totalVoters] }}</span>
              }
              @if (poll.status === 'draft') {
                <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{{ 'Draft · only hosts see it' | t }}</span>
              } @else if (closed()) {
                <span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{{ 'Closed' | t }}</span>
              } @else if (poll.closesAt) {
                <span>· {{ 'Closes {0}' | t: [(poll.closesAt | date: 'MMM d, h:mm a') ?? ''] }}</span>
              }
            </p>
          </div>
        </div>

        <!-- Vote -->
        @if (votingMode()) {
          <div
            class="mt-3 flex flex-col gap-2"
            [attr.role]="poll.allowMultiple ? 'group' : 'radiogroup'"
            [attr.aria-labelledby]="'poll-q-' + poll.id"
          >
            @for (option of poll.options; track option.id) {
              <button
                type="button"
                class="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                [ngClass]="
                  selection().has(option.id)
                    ? 'border-[#007979] bg-teal-50 font-semibold text-[#00605f]'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-[#007979]'
                "
                [attr.role]="poll.allowMultiple ? 'checkbox' : 'radio'"
                [attr.aria-checked]="selection().has(option.id)"
                [disabled]="busy() || !signedIn()"
                (click)="toggle(poll, option.id)"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center border-2"
                  [ngClass]="[
                    poll.allowMultiple ? 'rounded' : 'rounded-full',
                    selection().has(option.id) ? 'border-[#007979] bg-[#007979] text-white' : 'border-slate-300'
                  ]"
                  aria-hidden="true"
                >
                  @if (selection().has(option.id)) {
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none">check</mat-icon>
                  }
                </span>
                <span class="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{{ option.text }}</span>
              </button>
            }
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            @if (signedIn()) {
              <button
                type="button"
                class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
                [disabled]="busy() || selection().size === 0"
                (click)="submit(poll)"
              >
                {{ (busy() ? 'Saving…' : myVote().length ? 'Update vote' : 'Vote') | t }}
              </button>
              @if (myVote().length) {
                <button type="button" class="h-9 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100" (click)="cancelChange()">
                  {{ 'Cancel' | t }}
                </button>
              }
            } @else {
              <p class="text-sm text-slate-500">{{ 'Sign in to vote.' | t }}</p>
            }
          </div>
        } @else {
          <!-- Results, or "waiting for the host" -->
          @if (results(); as totals) {
            <ul class="mt-3 flex flex-col gap-1.5">
              @for (option of poll.options; track option.id) {
                <li
                  class="relative min-w-0 overflow-hidden rounded-lg border px-3 py-2 text-sm"
                  [ngClass]="myVote().includes(option.id) ? 'border-[#007979]' : 'border-slate-200'"
                >
                  <span
                    class="absolute inset-y-0 left-0 transition-[width] duration-500"
                    [ngClass]="isLeader(option.id) ? 'bg-teal-100' : 'bg-slate-100'"
                    [style.width.%]="percent(option.id)"
                    aria-hidden="true"
                  ></span>
                  <span class="relative flex min-w-0 items-center gap-2">
                    @if (myVote().includes(option.id)) {
                      <mat-icon class="!h-4 !w-4 shrink-0 !text-base !leading-none text-[#007979]" [attr.aria-label]="'Your answer' | t">check_circle</mat-icon>
                    }
                    <span class="min-w-0 flex-1 break-words [overflow-wrap:anywhere]" [class.font-semibold]="isLeader(option.id)">{{ option.text }}</span>
                    <span class="shrink-0 tabular-nums text-slate-700">
                      {{ percent(option.id) }}%
                      <span class="text-xs text-slate-500">({{ totals.counts[option.id] || 0 }})</span>
                    </span>
                  </span>
                </li>
              }
            </ul>
          } @else if (myVote().length) {
            <p class="mt-3 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-[#00605f]">
              <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] !leading-none" aria-hidden="true">how_to_vote</mat-icon>
              {{ 'Thanks, your vote is in. Results appear when the host shares them.' | t }}
            </p>
          } @else if (poll.status === 'draft') {
            <p class="mt-3 text-sm text-slate-500">{{ 'Open the poll when you are ready for answers.' | t }}</p>
          }

          @if (canChangeVote()) {
            <button type="button" class="mt-2 text-sm font-semibold text-[#007979] hover:underline" (click)="startChange()">
              {{ 'Change vote' | t }}
            </button>
          }
        }

        @if (error()) {
          <p class="mt-2 text-sm text-rose-700" role="alert">{{ error() | t }}</p>
        }

        <!-- Controls for whoever runs the poll -->
        @if (canManage()) {
          <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            @if (poll.status === 'draft') {
              <button type="button" class="poll-btn poll-btn--primary" [disabled]="busy()" (click)="setStatus(poll, 'open')">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">play_arrow</mat-icon>{{ 'Open poll' | t }}
              </button>
            } @else if (!closed()) {
              <button type="button" class="poll-btn" [disabled]="busy()" (click)="setStatus(poll, 'closed')">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">lock</mat-icon>{{ 'Close poll' | t }}
              </button>
            } @else {
              <button type="button" class="poll-btn" [disabled]="busy()" (click)="setStatus(poll, 'open')">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">lock_open</mat-icon>{{ 'Reopen' | t }}
              </button>
            }
            @if (poll.resultsVisibility === 'host' && poll.status !== 'draft') {
              <button type="button" class="poll-btn" [disabled]="busy()" (click)="toggleShowResults(poll)">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">{{ poll.showResults ? 'visibility_off' : 'visibility' }}</mat-icon>
                {{ (poll.showResults ? 'Hide results' : 'Show results to everyone') | t }}
              </button>
            }
            <button type="button" class="poll-btn ml-auto !text-rose-700" [disabled]="busy()" (click)="remove(poll)">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">delete</mat-icon>{{ 'Delete' | t }}
            </button>
          </div>
        }
      </section>
    } @else if (missing()) {
      <p class="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">{{ 'This poll is no longer available.' | t }}</p>
    }
  `,
  styles: [
    `
      .poll-btn {
        display: inline-flex;
        height: 2.25rem;
        align-items: center;
        gap: 0.375rem;
        border-radius: 0.5rem;
        border: 1px solid #cbd5e1;
        padding: 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
      }
      .poll-btn:hover:not(:disabled) {
        background: #f8fafc;
      }
      .poll-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .poll-btn--primary {
        border-color: #007979;
        background: #007979;
        color: #fff;
      }
      .poll-btn--primary:hover:not(:disabled) {
        background: #006666;
      }
    `,
  ],
})
export class PollCardComponent {
  private readonly service = inject(PollService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  /** Load the poll by id (community posts)… */
  readonly pollId = input<string | null | undefined>(null);
  /** …or pass one that is already loaded (live session boards). */
  readonly pollData = input<Poll | null>(null, { alias: 'poll' });
  /** Show open / close / reveal / delete. Firestore rules have the final say. */
  readonly canManage = input(false);

  private readonly watched = signal<Poll | null>(null);
  protected readonly poll = computed(() => this.pollData() ?? this.watched());
  protected readonly missing = signal(false);
  /** null = the person may not see the totals yet. */
  protected readonly results = signal<PollResults | null>(null);
  protected readonly myVote = signal<string[]>([]);
  protected readonly selection = signal<Set<string>>(new Set());
  protected readonly changing = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private readonly now = signal(Date.now());

  private readonly uid = computed(() => this.auth.firebaseUser()?.uid ?? '');
  /** Stable keys, so listeners restart only when something that matters changes. */
  private readonly currentId = computed(() => this.poll()?.id ?? null);
  private readonly accessKey = computed(() => {
    const poll = this.poll();
    return poll
      ? [poll.id, this.myVote().length > 0, poll.showResults, poll.status, this.closed(), this.canManage(), this.uid()].join('|')
      : null;
  });
  protected readonly signedIn = computed(() => !!this.uid());
  protected readonly closed = computed(() => {
    const poll = this.poll();
    return !!poll && isPollClosed(poll, this.now());
  });

  /** A live-session host watches the totals; everyone else votes first. */
  private readonly hostWatching = computed(() => this.canManage() && this.poll()?.contextType === 'live');

  protected readonly votingMode = computed(() => {
    const poll = this.poll();
    return (
      !!poll &&
      poll.status === 'open' &&
      !this.closed() &&
      !this.hostWatching() &&
      (this.myVote().length === 0 || this.changing())
    );
  });

  protected readonly canChangeVote = computed(() => {
    const poll = this.poll();
    return !!poll && poll.status === 'open' && !this.closed() && this.myVote().length > 0 && !this.changing();
  });

  constructor() {
    if (typeof window !== 'undefined') {
      const timer = setInterval(() => this.now.set(Date.now()), 30_000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }

    // The poll itself, when only an id was given.
    this.watch(() => {
      const id = this.pollId();
      if (!id || this.pollData()) return null;
      this.missing.set(false);
      return this.service.watchPoll(
        id,
        (poll) => {
          this.watched.set(poll);
          this.missing.set(!poll);
        },
        () => this.missing.set(true),
      );
    });

    // My own vote.
    this.watch(() => {
      const id = this.currentId();
      const uid = this.uid();
      if (!id || !uid) {
        untracked(() => this.myVote.set([]));
        return null;
      }
      return this.service.watchMyVote(id, uid, (optionIds) => {
        this.myVote.set(optionIds);
        if (!this.changing()) this.selection.set(new Set(optionIds));
      });
    });

    // Totals. Re-subscribe whenever the person's access may have changed:
    // after voting, when the host reveals or hides them, or when the poll closes.
    this.watch(() => {
      const id = this.currentId();
      if (!this.accessKey() || !id) return null;
      return this.service.watchResults(
        id,
        (results) => this.results.set(results),
        () => this.results.set(null),
      );
    });
  }

  protected toggle(poll: Poll, optionId: string): void {
    this.error.set('');
    this.selection.update((current) => {
      if (!poll.allowMultiple) return new Set([optionId]);
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else if (next.size < poll.maxChoices) {
        next.add(optionId);
      } else {
        this.error.set(this.i18n.t('You can pick up to {0} answers.', [poll.maxChoices]));
      }
      return next;
    });
  }

  protected async submit(poll: Poll): Promise<void> {
    const optionIds = poll.options.map((option) => option.id).filter((id) => this.selection().has(id));
    if (!optionIds.length) return;

    this.busy.set(true);
    this.error.set('');
    try {
      await this.service.vote(poll.id, optionIds);
      this.changing.set(false);
    } catch (problem) {
      this.error.set(messageOf(problem, 'Your vote could not be saved. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected startChange(): void {
    this.selection.set(new Set(this.myVote()));
    this.changing.set(true);
  }

  protected cancelChange(): void {
    this.selection.set(new Set(this.myVote()));
    this.changing.set(false);
    this.error.set('');
  }

  protected async setStatus(poll: Poll, status: 'open' | 'closed'): Promise<void> {
    // Reopening a poll whose closing time has passed clears the closing time.
    const clearClosing = status === 'open' && !!poll.closesAt && poll.closesAt.getTime() <= Date.now();
    await this.run(() => this.service.update(poll.id, { status, ...(clearClosing ? { closesAt: null } : {}) }));
  }

  protected async toggleShowResults(poll: Poll): Promise<void> {
    await this.run(() => this.service.update(poll.id, { showResults: !poll.showResults }));
  }

  protected async remove(poll: Poll): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(this.i18n.t('Delete this poll and its votes?'))) return;
    await this.run(() => this.service.remove(poll.id));
  }

  protected percent(optionId: string): number {
    const totals = this.results();
    const poll = this.poll();
    if (!totals || !poll) return 0;
    // Share of all answers given, so percentages add up to 100 even with several picks each.
    const answers = poll.options.reduce((sum, option) => sum + (totals.counts[option.id] || 0), 0);
    return answers ? Math.round(((totals.counts[optionId] ?? 0) / answers) * 100) : 0;
  }

  protected isLeader(optionId: string): boolean {
    const totals = this.results();
    if (!totals) return false;
    const most = Math.max(0, ...Object.values(totals.counts));
    return most > 0 && (totals.counts[optionId] ?? 0) === most;
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
    } catch (problem) {
      this.error.set(messageOf(problem, 'That did not work. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  /** Run a listener for as long as its inputs stay the same; restart it when they change. */
  private watch(start: () => Unsubscribe | null): void {
    effect((onCleanup) => {
      const stop = start();
      if (stop) onCleanup(stop);
    });
  }
}

function messageOf(problem: unknown, fallback: string): string {
  const message = (problem as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message && !message.startsWith('internal') ? message : fallback;
}

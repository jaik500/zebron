import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../../shared/dashboards/data-source.registry';
import { DashboardWidget, roleRank } from '../../shared/dashboards/dashboard.model';
import { PollBoardComponent } from '../../shared/polls/poll-board.component';
import { LiveSession, LiveSessionService, sessionEnd } from './live-session.service';

/**
 * Live polls widget: the polls of the session that's on now (from 15 minutes
 * before the start until 30 minutes after the end), in real time. Hosts
 * (staff and above) open and run polls here; everyone else votes.
 *
 * Reads: the next 3 sessions once when the widget opens (a clock moves the
 * widget into a session as it starts), plus the poll listeners while one is on.
 * Polls are the one place the cost rules allow live listeners.
 */
@Component({
  selector: 'app-live-polls-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, TranslatePipe, PollBoardComponent],
  template: `
    @if (loading()) {
      <div class="h-6 w-2/3 animate-pulse rounded bg-slate-200/70" aria-hidden="true"></div>
    } @else if (current(); as session) {
      <p class="mb-3 flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span class="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{{ 'Live now' | t }}</span>
        <span class="min-w-0 break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ session.title }}</span>
      </p>
      <app-poll-board [organizationId]="context().organizationId" [parentId]="session.id" [canManage]="isHost()" />
    } @else {
      <p class="text-sm text-slate-600">{{ 'No live session right now.' | t }}</p>
      @if (next(); as session) {
        <p class="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
          {{ 'Next: {0}, {1}' | t: [session.title, (session.startAt | date: 'EEE MMM d, h:mm a') ?? ''] }}
        </p>
      }
      <a [routerLink]="context().basePath + '/live'" class="mt-2 inline-block text-sm font-semibold text-[#007979] hover:underline">
        {{ 'Live sessions' | t }}
      </a>
    }
  `,
})
export class LivePollsWidgetComponent {
  private readonly service = inject(LiveSessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly sessions = signal<LiveSession[]>([]);
  protected readonly loading = signal(true);
  private readonly now = signal(Date.now());

  protected readonly current = computed(() => {
    const now = this.now();
    return (
      this.sessions().find(
        (session) =>
          session.status === 'scheduled' &&
          now >= session.startAt.getTime() - 15 * 60_000 &&
          now <= sessionEnd(session).getTime() + 30 * 60_000,
      ) ?? null
    );
  });

  protected readonly next = computed(
    () => this.sessions().find((session) => session.status === 'scheduled' && session.startAt.getTime() > this.now()) ?? null,
  );

  protected readonly isHost = computed(() => this.context().isPlatformAdmin || roleRank(this.context().role) >= 2);

  constructor() {
    if (typeof window !== 'undefined') {
      const timer = setInterval(() => this.now.set(Date.now()), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }

    effect(() => {
      const organizationId = this.context().organizationId;
      untracked(() => void this.load(organizationId));
    });
  }

  private async load(organizationId: string): Promise<void> {
    try {
      this.sessions.set(await this.service.listUpcoming(organizationId, 3));
    } catch {
      this.sessions.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}

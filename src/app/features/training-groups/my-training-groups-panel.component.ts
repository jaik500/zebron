import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { STATUS_LABELS, TrainingGroup, TrainingGroupService, groupStatus } from './training-group.service';
import { MyAssignment, SUBMISSION_STATUS_LABELS, TrainingGroupAssignmentService } from './training-group-assignment.service';

/**
 * "Your training groups" panel for the organization dashboard.
 *
 * Shows the signed-in person's own groups (cohorts) with a direct link to
 * each, plus their next few assignments or projects still to do. Renders
 * nothing for people who are not in a group, so staff and other members
 * see no change.
 *
 * Reads: the person's enrollment index, their groups, and their
 * assignments in those groups (the same queries My learning uses).
 */
@Component({
  selector: 'app-my-training-groups-panel',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (groups().length) {
      <section class="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-my-groups-title">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 id="dashboard-my-groups-title" class="flex items-center gap-2 text-lg font-bold text-gray-900">
            <mat-icon class="text-[color:var(--zb-accent,#007979)]" aria-hidden="true">groups</mat-icon>
            {{ (groups().length === 1 ? 'Your training group' : 'Your training groups') | t }}
          </h2>
          @if (overdueCount()) {
            <span class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
              {{ (overdueCount() === 1 ? '1 overdue' : '{0} overdue') | t: [overdueCount()] }}
            </span>
          }
        </div>

        <ul class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          @for (group of groups(); track group.id) {
            <li>
              <a
                [routerLink]="['/partner/org', organizationId(), 'training-groups', group.id]"
                class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-[color:var(--zb-accent,#007979)]/40 hover:shadow-sm"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-gray-900">{{ group.name }}</span>
                  <span class="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    <span class="rounded-full px-1.5 font-semibold" [class]="badge(group).classes">{{ badge(group).label | t }}</span>
                    {{ dates(group) }}
                  </span>
                </span>
                <mat-icon class="shrink-0 text-gray-400" aria-hidden="true">chevron_right</mat-icon>
              </a>
            </li>
          }
        </ul>

        @if (nextWork().length) {
          <h3 class="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <mat-icon class="!h-5 !w-5 !text-[20px] text-[color:var(--zb-accent,#007979)]" aria-hidden="true">assignment</mat-icon>
            {{ 'Up next' | t }}
          </h3>
          <ul class="mt-2 divide-y divide-gray-100 rounded-xl border border-gray-200">
            @for (entry of nextWork(); track entry.groupId + entry.assignment.id) {
              <li>
                <a
                  [routerLink]="['/partner/org', organizationId(), 'training-groups', entry.groupId]"
                  [queryParams]="{ assignment: entry.assignment.id }"
                  class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
                >
                  <mat-icon class="shrink-0 text-gray-500" aria-hidden="true">{{ entry.assignment.kind === 'project' ? 'rocket_launch' : 'assignment' }}</mat-icon>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-semibold text-gray-900">{{ entry.assignment.title }}</span>
                    <span class="block truncate text-xs text-gray-500">
                      {{ entry.groupName }}
                      @if (entry.assignment.dueAt) {
                        ·
                        <span [class]="overdue(entry) ? 'font-semibold text-rose-700' : ''">{{ 'Due {0}' | t: [dueLabel(entry.assignment.dueAt)] }}</span>
                      }
                    </span>
                  </span>
                  <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" [class]="workBadge(entry).classes">{{ workBadge(entry).label | t }}</span>
                </a>
              </li>
            }
          </ul>
          @if (openWork().length > nextWork().length) {
            <p class="mt-2 text-xs text-gray-500">
              {{ '{0} more in your groups' | t: [openWork().length - nextWork().length] }}
            </p>
          }
        }
      </section>
    }
  `,
})
export class MyTrainingGroupsPanelComponent {
  /** The organization whose dashboard is showing. */
  readonly organizationId = input.required<string>();

  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly service = inject(TrainingGroupService);
  private readonly assignments = inject(TrainingGroupAssignmentService);

  protected readonly groups = signal<TrainingGroup[]>([]);
  private readonly work = signal<MyAssignment[]>([]);

  /** Not complete yet, soonest due first (undated last). */
  protected readonly openWork = computed(() =>
    this.work()
      .filter((entry) => entry.submission?.status !== 'complete')
      .sort((a, b) => (a.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.assignment.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)),
  );

  protected readonly nextWork = computed(() => this.openWork().slice(0, 3));

  protected readonly overdueCount = computed(() => this.openWork().filter((entry) => this.overdue(entry)).length);

  /** Load whenever the organization or the signed-in person changes. */
  private loadToken = 0;

  constructor() {
    effect(() => {
      const organizationId = this.organizationId();
      const userId = this.auth.firebaseUser()?.uid ?? null;
      untracked(() => void this.load(organizationId, userId));
    });
  }

  private async load(organizationId: string, userId: string | null): Promise<void> {
    const token = ++this.loadToken;
    if (!organizationId || !userId) {
      this.groups.set([]);
      this.work.set([]);
      return;
    }
    try {
      const groups = (await this.service.listMine(organizationId, userId)).filter((group) => group.manualStatus !== 'cancelled');
      if (token !== this.loadToken) return;
      this.groups.set(groups);
      const work = groups.length ? await this.assignments.listMineAcrossGroups(organizationId, userId, groups) : [];
      if (token !== this.loadToken) return;
      this.work.set(work);
    } catch {
      // The panel is a shortcut: on failure it simply stays hidden.
      if (token === this.loadToken) {
        this.groups.set([]);
        this.work.set([]);
      }
    }
  }

  protected badge(group: TrainingGroup): { label: string; classes: string } {
    return STATUS_LABELS[groupStatus(group)];
  }

  protected workBadge(entry: MyAssignment): { label: string; classes: string } {
    return SUBMISSION_STATUS_LABELS[entry.submission?.status ?? 'not_submitted'];
  }

  protected overdue(entry: MyAssignment): boolean {
    return !entry.submission && !!entry.assignment.dueAt && entry.assignment.dueAt.getTime() < Date.now();
  }

  private locale(): string {
    return this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US';
  }

  protected dueLabel(date: Date): string {
    return date.toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  protected dates(group: TrainingGroup): string {
    const format = (date: Date) => date.toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', year: 'numeric' });
    if (!group.startDate && !group.endDate) {
      return '';
    }
    return `${group.startDate ? format(group.startDate) : '…'} – ${group.endDate ? format(group.endDate) : '…'}`;
  }
}

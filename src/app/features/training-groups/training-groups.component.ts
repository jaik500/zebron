import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';
import { OrganizationContextStore } from '../organizations/stores/organization-context.store';
import { PartnerMemberService } from '../partner/services/partner-member.service';
import { GroupStaffOption, TrainingGroupFormComponent } from './training-group-form.component';
import {
  DELIVERY_MODES,
  OwnRequest,
  PublicGroupInfo,
  STATUS_LABELS,
  TrainingGroup,
  TrainingGroupService,
  TrainingGroupStatus,
  groupStatus,
  isArchived,
  newTrainingGroup,
} from './training-group.service';

/** 'all' leaves archived groups out; they have their own tab. */
type StatusTab = 'all' | TrainingGroupStatus | 'archived';

/**
 * Training Groups: cohorts and other groups of learners.
 *
 * - Staff and above: every group, by status.
 * - Managers and above: New group (managers lead the groups they create).
 * - Members: their own groups.
 *
 * Route: /partner/org/:organizationId/training-groups
 */
@Component({
  selector: 'app-training-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatIconModule, TranslatePipe, TrainingGroupFormComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'dashboard']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Dashboard' | t"
            [title]="'Dashboard' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-semibold">{{ 'Training Groups' | t }}</h1>
            <p class="text-sm text-white/85">{{ 'Cohorts and other groups of learners going through training together.' | t }}</p>
          </div>
          @if (canCreate()) {
            <button
              type="button"
              (click)="openNew()"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#006666] shadow-sm hover:bg-white/90"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
              {{ 'New group' | t }}
            </button>
          }
        </div>
      </header>

      <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ error() | t }}</p>
        }

        <!-- Groups open for enrollment (request to join or apply) -->
        @if (openGroups().length) {
          <section class="mb-5 rounded-2xl border border-teal-200 bg-teal-50/60 p-4" aria-labelledby="open-groups-title">
            <h2 id="open-groups-title" class="flex items-center gap-2 text-base font-semibold text-slate-900">
              <mat-icon class="text-[#007979]" aria-hidden="true">how_to_reg</mat-icon>
              {{ 'Open for enrollment' | t }}
            </h2>
            <ul class="mt-3 grid gap-2 sm:grid-cols-2">
              @for (open of openGroups(); track open.groupId) {
                <li class="rounded-xl border border-slate-200 bg-white p-3">
                  <p class="font-semibold text-slate-900">{{ open.name }}</p>
                  <p class="text-xs text-slate-500">
                    {{ open.startDate ? (open.startDate | date: 'mediumDate') : '…' }} – {{ open.endDate ? (open.endDate | date: 'mediumDate') : '…' }}
                    @if (open.spotsLeft !== null) { · {{ (open.spotsLeft ? '{0} places left' : 'Full') | t: [open.spotsLeft] }} }
                  </p>
                  <a [routerLink]="['/join', organizationId, open.groupId]" class="mt-2 inline-flex h-8 items-center rounded-lg bg-[#007979] px-3 text-xs font-semibold text-white hover:bg-[#006666]">
                    {{ (open.request ? 'View my request' : open.mode === 'application' ? 'Apply' : 'Ask to join') | t }}
                  </a>
                </li>
              }
            </ul>
          </section>
        }

        @if (isStaff() && groups().length) {
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <nav class="flex flex-wrap gap-1" [attr.aria-label]="'Status' | t">
              @for (tab of tabs(); track tab.key) {
                <button
                  type="button"
                  (click)="statusTab.set(tab.key)"
                  [attr.aria-pressed]="statusTab() === tab.key"
                  [class]="statusTab() === tab.key
                    ? 'inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979]/10 px-3 text-sm font-semibold text-[#006666]'
                    : 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100'"
                >
                  {{ tab.label | t }}
                  <span class="rounded-full bg-white px-1.5 text-xs text-slate-600">{{ tab.count }}</span>
                </button>
              }
            </nav>
            <input
              type="search"
              class="ml-auto h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-64"
              [placeholder]="'Search groups' | t"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>
        }

        @if (loading()) {
          <div class="grid gap-3 sm:grid-cols-2" aria-hidden="true">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
            }
          </div>
        } @else if (!groups().length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">groups</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">
              {{ (isStaff() ? 'No training groups yet' : 'You are not in a training group yet') | t }}
            </p>
            @if (canCreate()) {
              <p class="mt-1 text-sm text-slate-600">{{ 'Create a cohort, set its dates and capacity, then add members.' | t }}</p>
              <button type="button" (click)="openNew()" class="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
                {{ 'New group' | t }}
              </button>
            }
          </div>
        } @else if (!shown().length) {
          <p class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{{ 'No groups match.' | t }}</p>
        } @else {
          <ul class="grid gap-3 sm:grid-cols-2">
            @for (group of shown(); track group.id) {
              <li>
                <a
                  [routerLink]="['/partner/org', organizationId, 'training-groups', group.id]"
                  class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#007979]/40 hover:shadow-md"
                >
                  <span class="flex flex-wrap items-center gap-1.5">
                    <span class="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-[#006666]">{{ 'Cohort' | t }}</span>
                    <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusOf(group).classes">{{ statusOf(group).label | t }}</span>
                    @if (isStaff() && group.pendingRequests) {
                      <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">{{ '{0} to review' | t: [group.pendingRequests] }}</span>
                    }
                  </span>
                  <span class="mt-2 block text-base font-semibold text-slate-900">{{ group.name }}</span>
                  @if (group.programName) {
                    <span class="block text-sm text-slate-600">{{ group.programName }}</span>
                  }
                  <span class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span class="inline-flex items-center gap-1">
                      <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">event</mat-icon>
                      @if (group.startDate || group.endDate) {
                        {{ group.startDate ? (group.startDate | date: 'mediumDate') : '…' }} – {{ group.endDate ? (group.endDate | date: 'mediumDate') : '…' }}
                      } @else {
                        {{ 'No dates' | t }}
                      }
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ deliveryOf(group).icon }}</mat-icon>
                      {{ deliveryOf(group).label | t }}
                    </span>
                    @if (isStaff()) {
                      <span class="inline-flex items-center gap-1">
                        <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">group</mat-icon>
                        {{ group.capacity ? (group.memberCount + ' / ' + group.capacity) : group.memberCount }} {{ 'members' | t }}
                      </span>
                    }
                  </span>
                </a>
              </li>
            }
          </ul>
        }
      </div>

      @if (editing(); as group) {
        <app-training-group-form
          [group]="group"
          [staff]="staffOptions()"
          [saving]="saving()"
          [error]="formError()"
          [currentUserId]="userId()"
          [mustLead]="!access.isAdmin()"
          (saved)="save($event)"
          (cancelled)="editing.set(null)"
        />
      }
    </main>
  `,
})
export class TrainingGroupsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TrainingGroupService);
  private readonly members = inject(PartnerMemberService);
  private readonly auth = inject(AuthService);
  protected readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly groups = signal<TrainingGroup[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly statusTab = signal<StatusTab>('all');
  protected readonly query = signal('');

  protected readonly editing = signal<TrainingGroup | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly staffOptions = signal<GroupStaffOption[]>([]);

  protected readonly isStaff = computed(() => this.access.isStaffOrAbove());
  protected readonly canCreate = computed(() => this.access.isManagerOrAbove());
  protected readonly userId = computed(() => this.auth.firebaseUser()?.uid ?? '');

  protected readonly tabs = computed(() => {
    const counts: Record<string, number> = {};
    for (const group of this.groups()) {
      const key = tabOf(group);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const current = this.groups().length - (counts['archived'] ?? 0);
    const tabs: { key: StatusTab; label: string; count: number }[] = [{ key: 'all', label: 'All', count: current }];
    for (const key of ['active', 'upcoming', 'completed', 'draft', 'cancelled'] as TrainingGroupStatus[]) {
      if (counts[key]) {
        tabs.push({ key, label: STATUS_LABELS[key].label, count: counts[key] });
      }
    }
    if (counts['archived']) {
      tabs.push({ key: 'archived', label: 'Archived', count: counts['archived'] });
    }
    return tabs;
  });

  protected readonly shown = computed(() => {
    const tab = this.statusTab();
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.groups().filter((group) => {
      const key = tabOf(group);
      if (tab === 'all' ? key === 'archived' : key !== tab) {
        return false;
      }
      const haystack = `${group.name} ${group.programName} ${group.location}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  });

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.i18n.t('Training Groups'));

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Context errors are shown elsewhere.
    }

    await this.load();
  }

  /** Groups taking requests or applications that the user isn't in yet. */
  protected readonly openGroups = signal<(PublicGroupInfo & { request: OwnRequest | null })[]>([]);

  private async loadOpenGroups(): Promise<void> {
    try {
      this.openGroups.set(await this.service.listOpenGroups(this.organizationId));
    } catch (error) {
      this.logger.error('TrainingGroupsComponent', 'Could not load groups open for enrollment.', error);
    }
  }

  private async load(): Promise<void> {
    void this.loadOpenGroups();
    this.loading.set(true);
    this.error.set('');
    try {
      this.groups.set(
        this.isStaff()
          ? await this.service.list(this.organizationId)
          : await this.service.listMine(this.organizationId, this.userId()),
      );
    } catch (error) {
      this.logger.error('TrainingGroupsComponent', 'Could not load training groups.', error);
      this.error.set('Training groups could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected statusOf(group: TrainingGroup): { label: string; classes: string } {
    return isArchived(group) ? { label: 'Archived', classes: 'bg-slate-200 text-slate-700' } : STATUS_LABELS[groupStatus(group)];
  }

  protected deliveryOf(group: TrainingGroup): { label: string; icon: string } {
    return DELIVERY_MODES.find((mode) => mode.value === group.deliveryMode) ?? DELIVERY_MODES[0];
  }

  protected async openNew(): Promise<void> {
    this.formError.set(null);
    this.editing.set(newTrainingGroup(this.organizationId, this.access.isAdmin() ? '' : this.userId()));
    if (!this.staffOptions().length) {
      this.staffOptions.set(await loadStaffOptions(this.members, this.organizationId, this.logger, this.service));
    }
  }

  protected async save(group: TrainingGroup): Promise<void> {
    this.saving.set(true);
    this.formError.set(null);
    try {
      const id = await this.service.save(group, this.userId());
      this.editing.set(null);
      await this.router.navigate(['/partner/org', this.organizationId, 'training-groups', id]);
    } catch (error) {
      this.logger.error('TrainingGroupsComponent', 'Could not save the training group.', error);
      this.formError.set('The group could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

/** Staff and above of the organization, for the Leads and Instructors lists. */
export async function loadStaffOptions(
  members: PartnerMemberService,
  organizationId: string,
  logger: LoggerService,
  groups: TrainingGroupService,
): Promise<GroupStaffOption[]> {
  // The directory has real names (managers and above); staff fall back to memberships.
  try {
    const people = await groups.loadDirectory(organizationId);
    return people
      .filter((person) => person.active && person.role !== 'org_member')
      .map((person) => ({ userId: person.userId, name: person.name, role: person.role }));
  } catch {
    // Not a manager, or the directory is unavailable.
  }
  try {
    const active = await members.getActiveMembers(organizationId);
    return active
      .filter((member) => member.role !== 'org_member')
      .map((member) => ({
        userId: member.userId,
        name: member.displayName?.trim() || member.email || 'Member',
        role: member.role,
      }));
  } catch (error) {
    logger.error('TrainingGroups', 'Could not load staff for leads and instructors.', error);
    return [];
  }
}

/** The tab a group is listed under: its status, or 'archived'. */
function tabOf(group: TrainingGroup): StatusTab {
  return isArchived(group) ? 'archived' : groupStatus(group);
}

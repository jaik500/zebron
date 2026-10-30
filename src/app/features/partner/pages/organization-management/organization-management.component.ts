import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import {
  OrganizationMembership,
  OrganizationMembershipRole,
} from '../../../../core/models/organization-membership.model';
import { OrganizationMembershipService } from '../../../../core/services/organization-membership.service';
import { OrganizationContextStore } from '../../../organizations/stores/organization-context.store';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { firebaseFunctions } from '../../../../core/services/firebase-config';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AnnouncementManagerComponent } from '../../announcements/announcement-manager.component';
import { OrganizationAuditLogComponent } from '../../audit/organization-audit-log.component';
import {
  OrganizationMailboxService,
  organizationMailboxAddress,
} from '../../mailbox/organization-mailbox.service';
interface CreateOrganizationInvitationRequest {
  organizationId: string;
  email: string;
  role: Exclude<OrganizationMembershipRole, 'org_owner'>;
}

interface CreateOrganizationInvitationResponse {
  success: boolean;
  invitationId: string;
  organizationId: string;
  email: string;
  role: Exclude<OrganizationMembershipRole, 'org_owner'>;
  status: 'pending';
  expiresAt: string;
  createdByUserId: string;
}

interface MemberDirectoryEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
}

type MemberStatusFilter = 'all' | 'active' | 'inactive';
type MemberSummaryFilter = 'all' | 'active' | 'administrators' | 'managers' | 'staff';

interface RoleGroup {
  role: OrganizationMembershipRole;
  title: string;
  description: string;
  icon: string;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [
    TranslatePipe,RouterLink, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, AnnouncementManagerComponent, OrganizationAuditLogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-gray-50 pt-14">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <!-- Page title and description -->
            <div>
              <p class=" text-sm text-white/80">
                {{ 'Manage organization setup, configuration, staff, and access.' | t }}
              </p>
            </div>

            <!-- Back button on the right -->
            <a
              [routerLink]="[
                '/partner/org',
                organizationStore.selectedOrganizationId(),
                'dashboard',
              ]"
              class="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              {{ '← Organization Dashboard' | t }}
            </a>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        @if (
          organizationStore.contextLoading() ||
          organizationStore.onboardingLoading() ||
          organizationStore.settingsLoading()
        ) {
          <section
            class="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm"
          >
            {{ 'Loading organization management details…' | t }}
          </section>
        } @else if (organizationStore.contextError()) {
          <section class="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 class="font-semibold text-red-800">{{ 'Unable to load organization' | t }}</h2>

            <p class="mt-2 text-sm text-red-700">
              {{ organizationStore.contextError() | t }}
            </p>
          </section>
        } @else {
          <section class="mb-6">
            <h2 class=" text-2xl font-bold text-gray-900">
              {{ organizationStore.selectedOrganization()?.name ?? ('Organization' | t) }}
            </h2>

            <p class=" text-sm text-gray-500">
              @if (canManageOrganization()) {
                {{ 'Review onboarding, configuration, and organization membership.' | t }}
              } @else {
                {{ 'Manage staff, access, and organization members.' | t }}
              }
            </p>
          </section>

          <!-- ORGANIZATION SETUP AND CONFIGURATION: admins and owners only -->

          @if (canManageOrganization()) {
          <div class="mb-8 grid gap-5 lg:grid-cols-2">
            <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  [class.bg-emerald-50]="setupComplete()"
                  [class.text-emerald-700]="setupComplete()"
                  [class.bg-amber-50]="!setupComplete()"
                  [class.text-amber-700]="!setupComplete()"
                >
                  <mat-icon>
                    {{ setupComplete() ? 'task_alt' : 'pending_actions' }}
                  </mat-icon>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-gray-900">{{ 'Organization Setup' | t }}</h3>

                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold"
                      [class.bg-emerald-50]="setupComplete()"
                      [class.text-emerald-700]="setupComplete()"
                      [class.bg-amber-50]="!setupComplete()"
                      [class.text-amber-800]="!setupComplete()"
                    >
                      {{ setupComplete() ? ('Completed' | t) : ('In progress' | t) }}
                    </span>
                  </div>

                  <p class="mt-2 text-sm text-gray-600">
                    @if (setupComplete()) {
                      {{ 'All four core organization onboarding steps are complete.' | t }}
                    } @else {
                      {{ 'Complete the organization profile, owner profile, member invitations, and configuration steps.' | t }}
                    }
                  </p>

                  @if (!setupComplete()) {
                    <a
                      mat-flat-button
                      class="mt-4 !bg-[#007979] !text-white"
                      [routerLink]="[
                        '/partner/org',
                        organizationStore.selectedOrganizationId(),
                        'onboarding',
                      ]"
                    >
                      <mat-icon>checklist</mat-icon>
                      {{ 'Continue setup' | t }}
                    </a>
                  }
                </div>
              </div>
            </section>

              <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    [class.bg-emerald-50]="configurationSaved()"
                    [class.text-emerald-700]="configurationSaved()"
                    [class.bg-amber-50]="!configurationSaved()"
                    [class.text-amber-700]="!configurationSaved()"
                  >
                    <mat-icon>
                      {{ configurationSaved() ? 'settings_suggest' : 'settings' }}
                    </mat-icon>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-semibold text-gray-900">{{ 'Configuration' | t }}</h3>

                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class.bg-emerald-50]="configurationSaved()"
                        [class.text-emerald-700]="configurationSaved()"
                        [class.bg-amber-50]="!configurationSaved()"
                        [class.text-amber-800]="!configurationSaved()"
                      >
                        {{ configurationSaved() ? ('Configured' | t) : ('Not configured' | t) }}
                      </span>
                    </div>

                    <p class="mt-2 text-sm text-gray-600">
                      @if (configurationSaved()) {
                        {{ 'Organization settings are available, including registration, default member role, administrator notifications, and branding colors.' | t }}
                      } @else {
                        {{ 'Organization settings have not been saved yet.' | t }}
                      }
                    </p>

                    <a
                      mat-flat-button
                      class="mt-4 !bg-[#007979] !text-white"
                      [routerLink]="[
                        '/partner/org',
                        organizationStore.selectedOrganizationId(),
                        'onboarding',
                      ]"
                    >
                      <mat-icon>tune</mat-icon>
                      {{ configurationSaved() ? ('Update configuration' | t) : ('Configure organization' | t) }}
                    </a>
                  </div>
                </div>
              </section>
          </div>
          }

          <!-- CONTRACT & BILLING and MAILBOX: side by side on larger screens -->
          <div class="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @if (canManageBilling()) {
            <a
              [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'contract']"
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <mat-icon>handshake</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Zebron partnership' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Contract & Billing' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Your agreement, applications, billing contact and requests to Zebron.' | t }}</span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[#007979]">arrow_forward</mat-icon>
            </a>
          }

          <!-- SUPPORT TICKETS: managers and above -->
          @if (canManageBilling()) {
            <a
              [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'support']"
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <mat-icon>confirmation_number</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Zebron support' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Support Tickets' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Report issues, request services and track their status.' | t }}</span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[#007979]">arrow_forward</mat-icon>
            </a>
          }

          <!-- MAILBOX: managers and above -->
          @if (canUseMailbox()) {
            <a
              [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'mailbox']"
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <mat-icon>mail</mat-icon>
                  @if (mailboxUnread() > 0) {
                    <span class="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#007979] px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                      {{ mailboxUnread() > 99 ? '99+' : mailboxUnread() }}
                    </span>
                  }
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Communication' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Mailbox' | t }}</span>
                  <span class="mt-1 block break-all text-sm text-gray-600">
                    {{ mailboxAddress() ? ('Send and receive email at {0}.' | t: [mailboxAddress()]) : ('Send and receive email.' | t) }}
                  </span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[#007979]">arrow_forward</mat-icon>
            </a>
          }

          </div>

          <!-- DASHBOARD BANNERS: managers and above -->
          @if (canManageAnnouncements()) {
            <section class="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-6"
                [attr.aria-expanded]="announcementsExpanded()"
                aria-controls="organization-announcements-panel"
                (click)="announcementsExpanded.set(!announcementsExpanded())"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <mat-icon>campaign</mat-icon>
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Communication' | t }}</span>
                    <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Dashboard Banners' | t }}</span>
                    <span class="mt-1 block text-sm text-gray-600">{{ 'Announce events, new cohorts, graduations and student shout-outs.' | t }}</span>
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#007979]">
                  <span class="hidden sm:inline">{{ announcementsExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                  <mat-icon>{{ announcementsExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
                </span>
              </button>

              @if (announcementsExpanded() && organizationStore.selectedOrganizationId(); as organizationId) {
                <app-announcement-manager id="organization-announcements-panel" [organizationId]="organizationId"></app-announcement-manager>
              }
            </section>
          }

          <!-- ACCESS CONTROL: collapsed by default -->
          <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-6"
              [attr.aria-expanded]="accessControlExpanded()"
              aria-controls="organization-access-control-panel"
              (click)="toggleAccessControl()"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]">
                  <mat-icon>admin_panel_settings</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Access Control' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Staff & Access Management' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Manage roles, invitations, and organization access.' | t }}</span>
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#007979]">
                <span class="hidden sm:inline">{{ accessControlExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                <mat-icon>{{ accessControlExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              </span>
            </button>

            @if (accessControlExpanded()) {
              <div id="organization-access-control-panel" class="border-t border-gray-100 p-5 sm:p-6">
                @if (canManageMembers()) {
                  <div class="mb-5 flex justify-end">
                    <button mat-flat-button class="!bg-[#007979] !text-white" type="button" (click)="toggleInviteForm()">
                      <mat-icon>{{ inviteFormVisible() ? 'close' : 'person_add' }}</mat-icon>
                      {{ inviteFormVisible() ? ('Cancel invitation' | t) : ('Invite member' | t) }}
                    </button>
                  </div>
                }
              @if (memberError()) {
                <div class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
                  <div class="flex items-start gap-3">
                    <mat-icon class="text-red-700">error_outline</mat-icon>

                    <div class="min-w-0 flex-1">
                      <h3 class="font-semibold text-red-900">{{ 'Unable to load organization members' | t }}</h3>

                      <p class="mt-1 break-words text-sm text-red-800">
                        {{ memberError() | t }}
                      </p>

                      <button mat-stroked-button type="button" class="mt-3" (click)="loadMembers()">
                        <mat-icon>refresh</mat-icon>
                        {{ 'Try again' | t }}
                      </button>
                    </div>
                  </div>
                </div>
              }

              @if (inviteFormVisible() && canManageMembers()) {
                <section class="mt-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div class="flex items-start gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#007979]"
                    >
                      <mat-icon>mail</mat-icon>
                    </div>

                    <div class="min-w-0 flex-1">
                      <h3 class="font-semibold text-gray-900">{{ 'Invite a team member' | t }}</h3>

                      <p class="mt-1 text-sm text-gray-600">
                        {{ 'Send an invitation through Zebron\\u0027s existing invitation workflow. The recipient will be invited with the role you select.' | t }}
                      </p>
                    </div>
                  </div>

                  <form class="mt-5 grid gap-4 md:grid-cols-2" (ngSubmit)="sendInvitation()">
                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>{{ 'Email address' | t }}</mat-label>
                        <input matInput
                        id="inviteEmail"
                        name="inviteEmail"
                        type="email"
                        required
                        email
                        autocomplete="email"
                        [(ngModel)]="inviteEmail"
                        [placeholder]="'colleague@example.com' | t"
                      />
                      </mat-form-field>
                    </div>

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>{{ 'Organization role' | t }}</mat-label>
                        <mat-select
                        id="inviteRole"
                        name="inviteRole"
                        required
                        [(ngModel)]="inviteRole"
                      >
                        @for (role of assignableRoles(); track role) {
                          <mat-option [value]="role">{{ roleLabel(role) | t }}</mat-option>
                        }
                      </mat-select>
                      </mat-form-field>
                    </div>

                    @if (invitationError()) {
                      <div
                        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2"
                        role="alert"
                      >
                        {{ invitationError() | t }}
                      </div>
                    }

                    @if (invitationSuccess()) {
                      <div
                        class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2"
                        role="status"
                      >
                        {{ invitationSuccess() | t }}
                      </div>
                    }

                    <div class="flex flex-wrap gap-3 md:col-span-2">
                      <button
                        mat-flat-button
                        type="submit"
                        [disabled]="sendingInvitation()"
                        class="!bg-[#007979] !text-white"
                      >
                        <mat-icon>
                          {{ sendingInvitation() ? 'hourglass_top' : 'send' }}
                        </mat-icon>

                        {{ sendingInvitation() ? ('Sending invitation…' | t) : ('Send invitation' | t) }}
                      </button>

                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="sendingInvitation()"
                        (click)="toggleInviteForm()"
                      >
                        {{ 'Cancel' | t }}
                      </button>
                    </div>
                  </form>
                </section>
              }

              <!-- MEMBERSHIP SUMMARY -->

              <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" [attr.aria-label]="'Membership summary filters' | t">
                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]" [class.border-[#007979]]="summaryFilter() === 'all'" [class.ring-2]="summaryFilter() === 'all'" [class.ring-teal-100]="summaryFilter() === 'all'" [attr.aria-pressed]="summaryFilter() === 'all'" (click)="selectSummaryFilter('all')">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700"
                  >
                    <mat-icon>groups</mat-icon>
                  </div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Total memberships' | t }}</p>

                  <p class="mt-1 text-3xl font-bold text-gray-900">
                    {{ members().length }}
                  </p>
                </button>

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]" [class.border-[#007979]]="summaryFilter() === 'active'" [class.ring-2]="summaryFilter() === 'active'" [class.ring-teal-100]="summaryFilter() === 'active'" [attr.aria-pressed]="summaryFilter() === 'active'" (click)="selectSummaryFilter('active')">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
                  >
                    <mat-icon>check_circle</mat-icon>
                  </div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Active members' | t }}</p>

                  <p class="mt-1 text-3xl font-bold text-gray-900">
                    {{ activeMemberCount() }}
                  </p>
                </button>

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]" [class.border-[#007979]]="summaryFilter() === 'administrators'" [class.ring-2]="summaryFilter() === 'administrators'" [class.ring-teal-100]="summaryFilter() === 'administrators'" [attr.aria-pressed]="summaryFilter() === 'administrators'" (click)="selectSummaryFilter('administrators')">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700"
                  >
                    <mat-icon>admin_panel_settings</mat-icon>
                  </div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Administrators' | t }}</p>

                  <p class="mt-1 text-3xl font-bold text-gray-900">
                    {{ administratorCount() }}
                  </p>
                </button>

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]" [class.border-[#007979]]="summaryFilter() === 'managers'" [class.ring-2]="summaryFilter() === 'managers'" [class.ring-teal-100]="summaryFilter() === 'managers'" [attr.aria-pressed]="summaryFilter() === 'managers'" (click)="selectSummaryFilter('managers')">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"
                  >
                    <mat-icon>supervisor_account</mat-icon>
                  </div>

                  <p class="mt-2 text-sm text-gray-500">{{ 'Managers' | t }}</p>

                  <p class="mt-1 text-3xl font-bold text-gray-900">
                    {{ managerCount() }}
                  </p>
                </button>

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]" [class.border-[#007979]]="summaryFilter() === 'staff'" [class.ring-2]="summaryFilter() === 'staff'" [class.ring-teal-100]="summaryFilter() === 'staff'" [attr.aria-pressed]="summaryFilter() === 'staff'" (click)="selectSummaryFilter('staff')">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700"
                  >
                    <mat-icon>badge</mat-icon>
                  </div>

                  <p class="mt-4 text-sm text-gray-500">{{ 'Staff' | t }}</p>

                  <p class="mt-1 text-3xl font-bold text-gray-900">
                    {{ staffCount() }}
                  </p>
                </button>
              </div>

              <!-- SEARCH AND FILTERS -->

              <section class="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div class="grid gap-x-4 md:grid-cols-[1fr_220px]">
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>{{ 'Search memberships' | t }}</mat-label>
                      <mat-icon matPrefix class="ml-3 mr-1 !text-[#007979]" aria-hidden="true">search</mat-icon>
                      <input matInput
                        id="memberSearch"
                        type="search"
                        [value]="memberSearch()"
                        (input)="setMemberSearch($any($event.target).value)"
                        [placeholder]="'Search by name, email or role' | t"
                      />
                    </mat-form-field>
                  </div>

                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>{{ 'Membership status' | t }}</mat-label>
                      <mat-select
                      id="memberStatus"
                      [value]="statusFilter()"
                      (selectionChange)="setStatusFilter($event.value)"
                    >
                      <mat-option value="all">{{ 'All memberships' | t }}</mat-option>
                      <mat-option value="active">{{ 'Active only' | t }}</mat-option>
                      <mat-option value="inactive">{{ 'Inactive only' | t }}</mat-option>
                    </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div
                  class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4"
                >
                  <p class="text-sm text-gray-500">
                    {{ 'Showing {0} of {1} memberships' | t: [filteredMembers().length, members().length] }}
                  </p>

                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="membersLoading()"
                    (click)="loadMembers()"
                  >
                    <mat-icon>refresh</mat-icon>
                    {{ 'Refresh' | t }}
                  </button>
                </div>
              </section>

              <!-- ROLE-GROUPED MEMBER LIST -->

              @if (membersLoading()) {
                <section
                  class="mt-5 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm"
                >
                  <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]">
                    progress_activity
                  </mat-icon>

                  <p class="mt-3 text-sm text-gray-600">{{ 'Loading organization memberships…' | t }}</p>
                </section>
              } @else if (!memberError() && filteredMembers().length === 0) {
                <section
                  class="mt-5 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm"
                >
                  <div
                    class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                  >
                    <mat-icon class="!h-7 !w-7 !text-[28px]"> group_off </mat-icon>
                  </div>

                  <h3 class="mt-4 font-semibold text-gray-900">{{ 'No matching memberships' | t }}</h3>

                  <p class="mt-2 text-sm text-gray-500">
                    {{ 'Try changing your search or membership-status filter.' | t }}
                  </p>
                </section>
              } @else if (!memberError()) {
                <div class="mt-5 space-y-5">
                  @for (group of roleGroups; track group.role) {
                    @if (membersForRole(group.role).length > 0) {
                      <section
                        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                      >
                        <div
                          class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"
                        >
                          <div class="flex items-center gap-3">
                            <div
                              class="flex h-10 w-10 items-center justify-center rounded-lg"
                              [class.bg-amber-50]="group.role === 'org_owner'"
                              [class.text-amber-700]="group.role === 'org_owner'"
                              [class.bg-violet-50]="group.role === 'org_admin'"
                              [class.text-violet-700]="group.role === 'org_admin'"
                              [class.bg-blue-50]="group.role === 'org_manager'"
                              [class.text-blue-700]="group.role === 'org_manager'"
                              [class.bg-teal-50]="group.role === 'org_staff'"
                              [class.text-teal-700]="group.role === 'org_staff'"
                              [class.bg-gray-100]="group.role === 'org_member'"
                              [class.text-gray-700]="group.role === 'org_member'"
                            >
                              <mat-icon>{{ group.icon }}</mat-icon>
                            </div>

                            <div>
                              <h3 class="font-semibold text-gray-900">
                                {{ group.title | t }}
                              </h3>

                              <p class="mt-0.5 text-xs text-gray-500">
                                {{ group.description | t }}
                              </p>
                            </div>
                          </div>

                          <span
                            class="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700"
                          >
                            {{ membersForRole(group.role).length }}
                          </span>
                        </div>

                        <div class="divide-y divide-gray-100">
                          @for (member of membersForRole(group.role); track member.id) {
                            <article
                              class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div class="flex min-w-0 items-center gap-3">
                                <a
                                  [routerLink]="memberProfileRoute(member)"
                                  [attr.aria-label]="'View profile of ' + memberName(member)"
                                  [title]="'View profile' | t"
                                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 transition hover:bg-teal-50 hover:text-[#007979] hover:ring-2 hover:ring-[#007979]/30 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                                >
                                  {{ initials(member) }}
                                </a>

                                <div class="min-w-0">
                                  <a
                                    [routerLink]="memberProfileRoute(member)"
                                    class="block break-words text-sm font-semibold text-gray-900 hover:text-[#007979] hover:underline"
                                  >
                                    {{ memberName(member) }}
                                  </a>

                                  @if (memberEmail(member); as email) {
                                    <p class="mt-1 break-all text-xs text-gray-500">{{ email }}</p>
                                  }
                                </div>
                              </div>

                              <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                                <span
                                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                                  [class.bg-emerald-50]="member.active"
                                  [class.text-emerald-700]="member.active"
                                  [class.bg-gray-100]="!member.active"
                                  [class.text-gray-600]="!member.active"
                                >
                                  {{ member.active ? ('Active' | t) : ('Inactive' | t) }}
                                </span>

                                @if (canEditMember(member)) {
                                  <mat-form-field
                                    appearance="outline"
                                    class="zb-field zb-field--flush zb-field--dense w-44"
                                    subscriptSizing="dynamic"
                                  >
                                    <mat-label>{{ 'Role' | t }}</mat-label>
                                    <mat-select
                                      [value]="member.role"
                                      [disabled]="updatingMemberId() === member.id"
                                      (selectionChange)="changeMemberRole(member, $event.value)"
                                    >
                                      @for (role of assignableRoles(); track role) {
                                        <mat-option [value]="role">{{ roleLabel(role) | t }}</mat-option>
                                      }
                                    </mat-select>
                                  </mat-form-field>

                                  <button
                                    mat-stroked-button
                                    type="button"
                                    [disabled]="updatingMemberId() === member.id"
                                    (click)="toggleMemberActive(member)"
                                  >
                                    <mat-icon>{{ member.active ? 'person_off' : 'person_check' }}</mat-icon>
                                    {{ member.active ? ('Deactivate' | t) : ('Reactivate' | t) }}
                                  </button>
                                } @else {
                                  <span
                                    class="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#007979]"
                                  >
                                    {{ roleLabel(member.role) | t }}
                                  </span>
                                }
                              </div>
                            </article>
                          }
                        </div>
                      </section>
                    }
                  }
                </div>
              }

              <div
                class="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
              >
                <mat-icon class="text-blue-700">info</mat-icon>

                <div>
                  <h3 class="text-sm font-semibold text-blue-900">{{ 'About organization access' | t }}</h3>

                  <p class="mt-1 text-sm text-blue-800">
                    {{ 'Organization memberships are separate from platform administrator roles. Role changes and membership removal will be enabled after the corresponding authorization safeguards are verified.' | t }}
                  </p>
                </div>
              </div>
              </div>
            }
          </section>

          <!-- REGULAR ORGANIZATION MEMBERS: separate, collapsed by default -->
          <section class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-6"
              [attr.aria-expanded]="membersDirectoryExpanded()"
              aria-controls="organization-members-directory-panel"
              (click)="toggleMembersDirectory()"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <mat-icon>groups</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Learning & Development' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Organization Members' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Browse regular members and open their learning dashboard.' | t }}</span>
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#007979]">
                <span class="hidden sm:inline">{{ membersDirectoryExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                <mat-icon>{{ membersDirectoryExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              </span>
            </button>

            @if (membersDirectoryExpanded()) {
              <div id="organization-members-directory-panel" class="border-t border-gray-100 p-5 sm:p-6">
                <div class="mb-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>{{ 'Search regular members' | t }}</mat-label>
                      <input matInput
                      id="regularMemberSearch"
                      type="search"
                      [value]="regularMemberSearch()"
                      (input)="setRegularMemberSearch($any($event.target).value)"
                      [placeholder]="'Search by name or email' | t"
                    />
                    </mat-form-field>
                  </div>
                  <p class="text-sm text-gray-500">{{ '{0} regular member(s)' | t: [filteredRegularMembers().length] }}</p>
                </div>

                @if (membersLoading()) {
                  <div class="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-600">{{ 'Loading organization members…' | t }}</div>
                } @else if (memberError()) {
                  <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                    {{ memberError() | t }}
                    <button type="button" class="ml-2 font-semibold underline" (click)="loadMembers()">{{ 'Try again' | t }}</button>
                  </div>
                } @else if (filteredRegularMembers().length === 0) {
                  <div class="rounded-lg bg-gray-50 p-8 text-center">
                    <mat-icon class="text-gray-400">person_search</mat-icon>
                    <p class="mt-2 font-semibold text-gray-800">{{ 'No regular members found' | t }}</p>
                    <p class="mt-1 text-sm text-gray-500">{{ 'Try another search or invite members to this organization.' | t }}</p>
                  </div>
                } @else {
                  <div class="divide-y divide-gray-100 rounded-lg border border-gray-100">
                    @for (member of filteredRegularMembers(); track member.id) {
                      <article class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex min-w-0 items-center gap-3">
                          <a
                            [routerLink]="memberProfileRoute(member)"
                            [attr.aria-label]="'View profile of ' + memberName(member)"
                            [title]="'View profile' | t"
                            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-[#007979] transition hover:ring-2 hover:ring-[#007979]/30 focus:outline-none focus:ring-2 focus:ring-[#007979]"
                          >{{ initials(member) }}</a>
                          <div class="min-w-0">
                            <a
                              [routerLink]="memberProfileRoute(member)"
                              class="block break-words text-sm font-semibold text-gray-900 hover:text-[#007979] hover:underline"
                            >{{ memberName(member) }}</a>
                            @if (memberEmail(member); as email) {
                              <p class="mt-1 break-all text-xs text-gray-500">{{ email }}</p>
                            }
                            <p class="mt-1 text-xs text-gray-500">{{ 'Regular member · {0}' | t: [(member.active ? 'Active' : 'Inactive')] }}</p>
                            <p class="mt-1 text-xs text-gray-500">{{ 'Learning progress will appear here when the LMS learner records are connected.' | t }}</p>
                          </div>
                        </div>
                        <a
                          mat-stroked-button
                          [routerLink]="['/learning']"
                          [queryParams]="{ organizationId: organizationStore.selectedOrganizationId(), memberId: member.userId }"
                          [attr.aria-label]="'Open learning dashboard for ' + memberName(member)"
                          class="shrink-0"
                        >
                          <mat-icon>school</mat-icon>
                          {{ 'View Learning Dashboard' | t }}
                        </a>
                      </article>
                    }
                  </div>
                }
                <p class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  {{ 'Learning summaries are not fabricated: course enrollments, accomplishments, assessment results, and activity need to be connected to the existing LMS records. The dashboard route must also enforce authorization before showing another member\\u0027s data.' | t }}
                </p>
              </div>
            }
          </section>

          <!-- AUDIT LOG: admins and owners -->
          @if (canViewAudit()) {
            <section class="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-6"
                [attr.aria-expanded]="auditExpanded()"
                aria-controls="organization-audit-panel"
                (click)="auditExpanded.set(!auditExpanded())"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <mat-icon>history</mat-icon>
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-semibold uppercase tracking-wider text-[#007979]">{{ 'Security & compliance' | t }}</span>
                    <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Audit Log' | t }}</span>
                    <span class="mt-1 block text-sm text-gray-600">{{ 'Every change made by your organization, by Zebron, and by the system.' | t }}</span>
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#007979]">
                  <span class="hidden sm:inline">{{ auditExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                  <mat-icon>{{ auditExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
                </span>
              </button>

              @if (auditExpanded() && organizationStore.selectedOrganizationId(); as organizationId) {
                <app-organization-audit-log id="organization-audit-panel" [organizationId]="organizationId"></app-organization-audit-log>
              }
            </section>
          }
        }
      </div>
    </main>
  `,
})
export class OrganizationManagementComponent implements OnInit {
  protected readonly organizationStore = inject(OrganizationContextStore);

  private readonly access = inject(PartnerAccessService);
  private readonly route = inject(ActivatedRoute);
  private readonly pageTitleService = inject(PageTitleService);

  private readonly membershipService = inject(OrganizationMembershipService);
  private readonly mailboxService = inject(OrganizationMailboxService);

  protected readonly members = signal<OrganizationMembership[]>([]);
  protected readonly accessControlExpanded = signal(false);
  protected readonly announcementsExpanded = signal(false);

  /** Audit log: admins and owners. */
  protected readonly canViewAudit = computed(() => this.access.can('audit.view'));
  protected readonly auditExpanded = signal(false);

  /** Contract & Billing: managers and above. */
  protected readonly canManageBilling = computed(() => this.access.can('billing.manage'));

  /** Organization mailbox: managers and above. */
  protected readonly canUseMailbox = computed(() => this.access.can('mailbox.access'));

  protected readonly mailboxUnread = signal(0);

  protected readonly mailboxAddress = computed(() =>
    organizationMailboxAddress(this.organizationStore.selectedOrganization()?.slug),
  );

  /** Dashboard banners: managers and above. */
  protected readonly canManageAnnouncements = computed(() =>
    this.access.can('announcements.manage'),
  );
  protected readonly membersDirectoryExpanded = signal(false);
  protected readonly regularMemberSearch = signal('');
  protected readonly membersLoading = signal(false);
  protected readonly memberError = signal('');

  protected readonly memberSearch = signal('');
  protected readonly statusFilter = signal<MemberStatusFilter>('all');
  protected readonly summaryFilter = signal<MemberSummaryFilter>('all');

  protected readonly inviteFormVisible = signal(false);
  protected readonly sendingInvitation = signal(false);
  protected readonly invitationError = signal('');
  protected readonly invitationSuccess = signal('');

  protected inviteEmail = '';
  protected inviteRole: Exclude<OrganizationMembershipRole, 'org_owner'> = 'org_member';

  protected readonly roleGroups: RoleGroup[] = [
    {
      role: 'org_owner',
      title: 'Organization Owner',
      description: 'Primary organization ownership',
      icon: 'verified_user',
    },
    {
      role: 'org_admin',
      title: 'Administrators',
      description: 'Organization administration and configuration',
      icon: 'admin_panel_settings',
    },
    {
      role: 'org_manager',
      title: 'Managers',
      description: 'Organization management responsibilities',
      icon: 'supervisor_account',
    },
    {
      role: 'org_staff',
      title: 'Staff',
      description: 'Operational organization access',
      icon: 'badge',
    },
    {
      role: 'org_member',
      title: 'Members',
      description: 'Standard organization membership',
      icon: 'person',
    },
  ];

  /** Configuration card and status: admins and owners only. */
  protected readonly canManageOrganization = computed(() =>
    this.access.can('organization.configure'),
  );

  /** Invite people and change roles below your own: managers and above. */
  protected readonly canManageMembers = computed(() =>
    this.access.can('members.manage'),
  );

  /** Roles the current user can hand out (always below their own). */
  protected readonly assignableRoles = computed(
    () => this.access.assignableRoles() as Exclude<OrganizationMembershipRole, 'org_owner'>[],
  );

  protected readonly updatingMemberId = signal<string | null>(null);

  /** userId -> display name and email. */
  protected readonly memberDetails = signal(new Map<string, MemberDirectoryEntry>());

  protected readonly setupComplete = computed(
    () => this.organizationStore.onboarding()?.status === 'completed',
  );

  protected readonly configurationSaved = computed(() => {
    const settings = this.organizationStore.settings();

    return (
      !!settings &&
      !this.organizationStore.settingsLoading() &&
      !this.organizationStore.settingsError()
    );
  });

  protected readonly activeMemberCount = computed(
    () => this.members().filter((member) => member.active).length,
  );

  protected readonly administratorCount = computed(
    () =>
      this.members().filter(
        (member) => member.active && (member.role === 'org_owner' || member.role === 'org_admin'),
      ).length,
  );

  protected readonly managerCount = computed(
    () => this.members().filter((member) => member.active && member.role === 'org_manager').length,
  );

  protected readonly staffCount = computed(
    () => this.members().filter((member) => member.active && member.role === 'org_staff').length,
  );

  protected readonly filteredMembers = computed(() => {
    const search = this.memberSearch().trim().toLowerCase();
    const status = this.statusFilter();
    const summary = this.summaryFilter();

    return this.members().filter((member) => {
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && member.active) ||
        (status === 'inactive' && !member.active);

      const matchesSummary =
        summary === 'all' ||
        (summary === 'active' && member.active) ||
        (summary === 'administrators' && member.active && (member.role === 'org_owner' || member.role === 'org_admin')) ||
        (summary === 'managers' && member.active && member.role === 'org_manager') ||
        (summary === 'staff' && member.active && member.role === 'org_staff');

      const matchesSearch =
        !search ||
        this.memberSearchText(member).includes(search) ||
        this.roleLabel(member.role).toLowerCase().includes(search);

      return matchesStatus && matchesSummary && matchesSearch;
    });
  });

  protected readonly filteredRegularMembers = computed(() => {
    const search = this.regularMemberSearch().trim().toLowerCase();
    return this.members()
      .filter((member) => member.role === 'org_member')
      .filter((member) => !search || this.memberSearchText(member).includes(search))
      .sort((a, b) => this.memberName(a).localeCompare(this.memberName(b)));
  });

  async ngOnInit(): Promise<void> {
    const organizationId = this.route.snapshot.paramMap.get('organizationId');

    if (!organizationId) {
      return;
    }

    try {
      await this.organizationStore.loadOrganizationContext(organizationId);

      this.pageTitleService.setTitle('Organization Management');

      if (this.canUseMailbox()) {
        this.mailboxService
          .countUnread(organizationId)
          .then((count) => this.mailboxUnread.set(count))
          .catch(() => this.mailboxUnread.set(0));
      }

      await this.loadMembers();
    } catch {
      // The organization store and membership state expose user-facing errors.
    }
  }

  protected async loadMembers(): Promise<void> {
    const organizationId =
      this.organizationStore.selectedOrganizationId() ??
      this.route.snapshot.paramMap.get('organizationId');

    if (!organizationId) {
      this.memberError.set('An organization must be selected.');
      return;
    }

    this.membersLoading.set(true);
    this.memberError.set('');

    try {
      const [result] = await Promise.all([
        this.membershipService.getOrganizationMembers(organizationId),
        // Names only need loading once; role changes don't change them.
        this.memberDetails().size === 0
          ? this.loadMemberDetails(organizationId)
          : Promise.resolve(),
      ]);

      this.members.set(result);
    } catch (error: unknown) {
      console.error('Failed to load organization memberships.', error);

      this.memberError.set(this.getErrorMessage(error));
    } finally {
      this.membersLoading.set(false);
    }
  }

  /** Members can only be changed by someone with a higher role. */
  protected canEditMember(member: OrganizationMembership): boolean {
    return member.role !== 'org_owner' && this.access.canManageRole(member.role);
  }

  protected async changeMemberRole(
    member: OrganizationMembership,
    role: OrganizationMembershipRole,
  ): Promise<void> {
    if (role === member.role) {
      return;
    }

    if (!this.canEditMember(member) || !this.assignableRoles().some((item) => item === role)) {
      this.memberError.set('You can only assign roles below your own.');
      await this.loadMembers();
      return;
    }

    this.updatingMemberId.set(member.id);
    this.memberError.set('');

    try {
      await this.membershipService.updateMemberRole(member.id, role);
      await this.loadMembers();
    } catch (error: unknown) {
      console.error('Failed to change member role.', error);
      this.memberError.set(this.getErrorMessage(error));
      await this.loadMembers();
    } finally {
      this.updatingMemberId.set(null);
    }
  }

  protected async toggleMemberActive(member: OrganizationMembership): Promise<void> {
    if (!this.canEditMember(member)) {
      return;
    }

    this.updatingMemberId.set(member.id);
    this.memberError.set('');

    try {
      await this.membershipService.setMemberActive(member.id, !member.active);
      await this.loadMembers();
    } catch (error: unknown) {
      console.error('Failed to update member status.', error);
      this.memberError.set(this.getErrorMessage(error));
    } finally {
      this.updatingMemberId.set(null);
    }
  }

  protected membersForRole(role: OrganizationMembershipRole): OrganizationMembership[] {
    return this.filteredMembers()
      .filter((member) => member.role === role)
      .sort((a, b) => this.memberName(a).localeCompare(this.memberName(b)));
  }

  protected roleLabel(role: OrganizationMembershipRole): string {
    const labels: Record<OrganizationMembershipRole, string> = {
      org_owner: 'Owner',
      org_admin: 'Administrator',
      org_manager: 'Manager',
      org_staff: 'Staff',
      org_member: 'Member',
    };

    return labels[role] ?? role;
  }

  protected memberProfileRoute(member: OrganizationMembership): string[] {
    return ['/partner/org', member.organizationId, 'members', member.userId];
  }

  /** Name, then email, then a neutral label. Never the raw user ID. */
  protected memberName(member: OrganizationMembership): string {
    const details = this.memberDetails().get(member.userId);

    return details?.displayName || details?.email || 'Unnamed member';
  }

  /** Email shown under the name (omitted when it is already the name). */
  protected memberEmail(member: OrganizationMembership): string | null {
    const details = this.memberDetails().get(member.userId);

    return details?.displayName && details.email ? details.email : null;
  }

  private memberSearchText(member: OrganizationMembership): string {
    const details = this.memberDetails().get(member.userId);

    return [
      details?.displayName,
      details?.email,
      this.roleLabel(member.role),
      member.userId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  protected initials(member: OrganizationMembership): string {
    const details = this.memberDetails().get(member.userId);
    const name = details?.displayName?.trim();

    if (name) {
      const words = name.split(/\s+/).filter(Boolean);

      return (
        words.length > 1
          ? words[0][0] + words[words.length - 1][0]
          : words[0].slice(0, 2)
      ).toUpperCase();
    }

    const email = details?.email?.trim();

    return email ? email.slice(0, 2).toUpperCase() : '?';
  }

  /**
   * Names and emails come from a server function, because membership
   * records only hold user IDs and user profiles are private.
   * If it fails, the page still works and shows "Unnamed member".
   */
  private async loadMemberDetails(organizationId: string): Promise<void> {
    try {
      const getDirectory = httpsCallable<
        { organizationId: string },
        { organizationId: string; members: MemberDirectoryEntry[] }
      >(firebaseFunctions, 'getOrganizationMemberDirectory');

      const result = await getDirectory({ organizationId });

      this.memberDetails.set(
        new Map(result.data.members.map((entry) => [entry.userId, entry])),
      );
    } catch (error: unknown) {
      console.warn('Unable to load member names and emails.', error);
    }
  }

  protected toggleAccessControl(): void {
    this.accessControlExpanded.update((expanded) => !expanded);
  }

  protected toggleMembersDirectory(): void {
    this.membersDirectoryExpanded.update((expanded) => !expanded);
  }

  protected setRegularMemberSearch(value: string): void {
    this.regularMemberSearch.set(value);
  }

  protected setMemberSearch(value: string): void {
    this.memberSearch.set(value);
  }

  protected selectSummaryFilter(filter: MemberSummaryFilter): void {
    this.summaryFilter.set(filter);
    this.statusFilter.set('all');
    this.memberSearch.set('');
  }

  protected setStatusFilter(value: string): void {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      this.statusFilter.set(value);
      this.summaryFilter.set('all');
    }
  }

  protected toggleInviteForm(): void {
    this.inviteFormVisible.update((visible) => !visible);

    this.invitationError.set('');
    this.invitationSuccess.set('');

    if (!this.inviteFormVisible()) {
      this.inviteEmail = '';
      this.inviteRole = 'org_member';
    }
  }

  protected async sendInvitation(): Promise<void> {
    if (!this.canManageMembers() || !this.assignableRoles().includes(this.inviteRole)) {
      this.invitationError.set('You can only invite people to roles below your own.');
      return;
    }

    const organizationId =
      this.organizationStore.selectedOrganizationId() ??
      this.route.snapshot.paramMap.get('organizationId');

    const email = this.inviteEmail.trim();

    if (!organizationId) {
      this.invitationError.set('An organization must be selected before sending an invitation.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.invitationError.set('Enter a valid email address.');
      return;
    }

    this.sendingInvitation.set(true);
    this.invitationError.set('');
    this.invitationSuccess.set('');

    try {
      const createInvitation = httpsCallable<
        CreateOrganizationInvitationRequest,
        CreateOrganizationInvitationResponse
      >(firebaseFunctions, 'createOrganizationInvitation');

      const result = await createInvitation({
        organizationId,
        email,
        role: this.inviteRole,
      });

      if (!result.data.success) {
        throw new Error('The invitation could not be created.');
      }

      this.invitationSuccess.set(
        `Invitation created for ${result.data.email}. The invitation expires on ${new Date(result.data.expiresAt).toLocaleDateString()}.`,
      );

      this.inviteEmail = '';
      this.inviteRole = 'org_member';
    } catch (error: unknown) {
      console.error('Failed to create organization invitation.', error);

      this.invitationError.set(this.getErrorMessage(error));
    } finally {
      this.sendingInvitation.set(false);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

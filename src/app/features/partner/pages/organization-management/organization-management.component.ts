import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
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
import { GroupFilter, TrainingGroupService } from '../../../training-groups/training-group.service';
import { ACCENT_PRESETS, BACKGROUND_PRESETS, DEFAULT_ACCENT, DEFAULT_BACKGROUND, LOGO_TYPES, OrganizationBrandingService, accentPreset, accentStyle, backgroundPreset, pageBackground } from '../../branding/organization-branding';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [
    TranslatePipe,RouterLink, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, AnnouncementManagerComponent, OrganizationAuditLogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-gray-50 pt-14" [style]="accentStyle()">
      <header class="border-b border-white/10 bg-gradient-to-r from-[color:var(--zb-accent,#007979)] via-[color:var(--zb-accent-dark,#00706f)] to-[color:var(--zb-accent-end,#2a835f)]">
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
                      class="mt-4 !bg-[color:var(--zb-accent,#007979)] !text-white"
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
                      class="mt-4 !bg-[color:var(--zb-accent,#007979)] !text-white"
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
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <mat-icon>handshake</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Zebron partnership' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Contract & Billing' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Your agreement, applications, billing contact and requests to Zebron.' | t }}</span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[color:var(--zb-accent,#007979)]">arrow_forward</mat-icon>
            </a>
          }

          <!-- SUPPORT TICKETS: managers and above -->
          @if (canManageBilling()) {
            <a
              [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'support']"
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <mat-icon>confirmation_number</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Zebron support' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Support Tickets' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Report issues, request services and track their status.' | t }}</span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[color:var(--zb-accent,#007979)]">arrow_forward</mat-icon>
            </a>
          }

          <!-- MAILBOX: managers and above -->
          @if (canUseMailbox()) {
            <a
              [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'mailbox']"
              class="flex h-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)]/40 hover:shadow-md sm:px-6"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <mat-icon>mail</mat-icon>
                  @if (mailboxUnread() > 0) {
                    <span class="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[color:var(--zb-accent,#007979)] px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                      {{ mailboxUnread() > 99 ? '99+' : mailboxUnread() }}
                    </span>
                  }
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Communication' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Mailbox' | t }}</span>
                  <span class="mt-1 block break-all text-sm text-gray-600">
                    {{ mailboxAddress() ? ('Send and receive email at {0}.' | t: [mailboxAddress()]) : ('Send and receive email.' | t) }}
                  </span>
                </span>
              </span>
              <mat-icon class="shrink-0 text-[color:var(--zb-accent,#007979)]">arrow_forward</mat-icon>
            </a>
          }

          </div>

          <!-- APPEARANCE: the dashboard accent color (owners and administrators) -->
          @if (canManageOrganization()) {
            <section id="organization-appearance" class="mb-8 scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <!-- Header: shows or hides the color picker (hidden by default; opened by ?section=appearance) -->
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-6"
                [attr.aria-expanded]="appearanceExpanded()"
                aria-controls="organization-appearance-panel"
                (click)="appearanceExpanded.set(!appearanceExpanded())"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white" [style.background]="accentPreset(savedAccent()).base" aria-hidden="true">
                    <mat-icon>palette</mat-icon>
                  </span>
                  <span class="min-w-0">
                    <span class="block text-lg font-bold text-gray-900">{{ 'Appearance' | t }}</span>
                    <span class="mt-0.5 block text-sm text-gray-500">
                      {{ 'Color: {0}' | t: [(accentPreset(savedAccent()).label | t)] }} ·
                      {{ 'Background: {0}' | t: [(backgroundPreset(savedBackground()).label | t)] }} ·
                      {{ (branding.logoUrl() ? 'Logo uploaded' : 'No logo') | t }}
                    </span>
                  </span>
                </span>
                <span class="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[color:var(--zb-accent,#007979)]">
                  <span class="max-sm:sr-only">{{ (appearanceExpanded() ? 'Hide' : 'Show') | t }}</span>
                  <mat-icon aria-hidden="true">{{ appearanceExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
                </span>
              </button>

              @if (appearanceExpanded()) {
              <div id="organization-appearance-panel" class="border-t border-gray-200 px-5 pb-5 pt-4 sm:px-6">
              <!-- Logo -->
              <div class="mb-5 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-5">
                <span class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  @if (branding.logoUrl(); as logo) {
                    <img [src]="logo" [alt]="'Organization logo' | t" class="h-full w-full object-contain p-1" />
                  } @else {
                    <mat-icon class="text-gray-400" aria-hidden="true">business</mat-icon>
                  }
                </span>
                <!-- Title and file hints: hidden on phones (the picture and buttons are enough there) -->
                <div class="min-w-0 flex-1 max-md:hidden">
                  <p class="font-semibold text-gray-900">{{ 'Logo' | t }}</p>
                  <p class="text-sm text-gray-500">{{ 'PNG, JPEG or WebP, up to 5 MB. A square image works best; it is resized to 256 pixels.' | t }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <label
                    class="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    [class.pointer-events-none]="logoBusy()"
                    [class.opacity-60]="logoBusy()"
                  >
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">upload</mat-icon>
                    {{ (logoBusy() ? 'Uploading...' : branding.logoUrl() ? 'Replace logo' : 'Upload logo') | t }}
                    <input type="file" class="sr-only" [accept]="logoTypes" [disabled]="logoBusy()" (change)="onLogoPicked($event)" />
                  </label>
                  @if (branding.logoUrl()) {
                    <button
                      type="button"
                      (click)="removeLogo()"
                      [disabled]="logoBusy()"
                      class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">delete</mat-icon>
                      {{ 'Remove' | t }}
                    </button>
                  }
                </div>
                @if (logoMessage(); as message) {
                  <p class="w-full text-sm" [class]="message.error ? 'text-rose-700' : 'text-emerald-700'" role="status">{{ message.text | t }}</p>
                }
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-sm text-gray-500">{{ 'Choose the color and page background members see on every page of your organization.' | t }}</p>
                <button
                  mat-flat-button
                  type="button"
                  class="!bg-[color:var(--zb-accent,#007979)] !text-white"
                  [disabled]="(accent() === savedAccent() && background() === savedBackground()) || savingAccent()"
                  (click)="saveAccent()"
                >
                  {{ savingAccent() ? ('Saving...' | t) : ('Save' | t) }}
                </button>
              </div>

              <div role="radiogroup" [attr.aria-label]="'Accent color' | t" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                @for (preset of accentPresets; track preset.key) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="accent() === preset.key"
                    (click)="accent.set(preset.key)"
                    class="flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition"
                    [class]="accent() === preset.key ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-400'"
                  >
                    <span
                      class="h-8 w-8 shrink-0 rounded-lg"
                      [style.background]="'linear-gradient(135deg, ' + preset.base + ', ' + preset.end + ')'"
                      aria-hidden="true"
                    ></span>
                    <span class="min-w-0 flex-1 truncate font-medium text-gray-800">{{ preset.label | t }}</span>
                    @if (accent() === preset.key) {
                      <mat-icon class="!h-5 !w-5 !text-[20px] text-gray-900" aria-hidden="true">check_circle</mat-icon>
                    }
                  </button>
                }
              </div>

              <!-- Page background -->
              <p class="mt-5 text-sm font-semibold text-gray-900">{{ 'Page background' | t }}</p>
              <div role="radiogroup" [attr.aria-label]="'Page background' | t" class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                @for (preset of backgroundPresets; track preset.key) {
                  <button
                    type="button"
                    role="radio"
                    [attr.aria-checked]="background() === preset.key"
                    (click)="background.set(preset.key)"
                    class="flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition"
                    [class]="background() === preset.key ? 'border-gray-900 ring-2 ring-gray-900/20' : 'border-gray-200 hover:border-gray-400'"
                  >
                    <span class="h-8 w-8 shrink-0 rounded-lg border border-gray-300" [style.background]="backgroundColor(preset.key)" aria-hidden="true"></span>
                    <span class="min-w-0 flex-1 truncate font-medium text-gray-800">{{ preset.label | t }}</span>
                    @if (background() === preset.key) {
                      <mat-icon class="!h-5 !w-5 !text-[20px] text-gray-900" aria-hidden="true">check_circle</mat-icon>
                    }
                  </button>
                }
              </div>
              <p class="mt-2 text-xs text-gray-500">{{ 'Only light shades are offered, so titles and text on the page stay readable.' | t }}</p>

              <!-- Preview: the dashboard header band and a card -->
              <div class="mt-4 overflow-hidden rounded-xl border border-gray-200" aria-hidden="true">
                <div class="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white" [style.background]="'linear-gradient(to right, ' + accentPreview().base + ', ' + accentPreview().dark + ', ' + accentPreview().end + ')'">
                  @if (branding.logoUrl(); as logo) {
                    <img [src]="logo" alt="" class="h-7 w-7 rounded-md bg-white object-contain p-0.5" />
                  }
                  {{ organizationStore.selectedOrganization()?.name ?? ('Your organization' | t) }}
                </div>
                <div class="p-3" [style.background]="backgroundColor(background())">
                <div class="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                  <span class="flex h-10 w-10 items-center justify-center rounded-xl text-white" [style.background]="accentPreview().base">
                    <mat-icon>school</mat-icon>
                  </span>
                  <span class="text-sm font-semibold" [style.color]="accentPreview().base">{{ 'Learning' | t }}</span>
                </div>
                </div>
              </div>

              @if (accentMessage(); as message) {
                <p class="mt-3 text-sm" [class]="message.error ? 'text-rose-700' : 'text-emerald-700'" role="status">{{ message.text | t }}</p>
              } @else {
                <p class="mt-3 text-xs text-gray-500">{{ 'Every color keeps text readable.' | t }}</p>
              }
              </div>
              }
            </section>
          }

          <!-- APPLICATION SETTINGS: the same pages as the gears on the dashboard cards -->
          @if (applicationSettings().length) {
            <section class="mb-8" aria-labelledby="application-settings-title">
              <h3 id="application-settings-title" class="text-lg font-bold text-gray-900">{{ 'Application settings' | t }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ 'Manage each application your organization uses. These are the same pages as the gear on each dashboard card.' | t }}</p>

              <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @for (item of applicationSettings(); track item.id) {
                  <a
                    [routerLink]="item.route"
                    class="flex h-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)]/40 hover:shadow-md"
                  >
                    <span class="flex min-w-0 items-center gap-3">
                      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[color:var(--zb-accent,#007979)]">
                        <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
                      </span>
                      <span class="min-w-0">
                        <span class="block font-semibold text-gray-900">{{ item.title | t }}</span>
                        <span class="mt-0.5 block text-sm text-gray-600">{{ item.description | t }}</span>
                      </span>
                    </span>
                    <mat-icon class="shrink-0 text-[color:var(--zb-accent,#007979)]" aria-hidden="true">settings</mat-icon>
                  </a>
                }
              </div>
            </section>
          }

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
                    <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Communication' | t }}</span>
                    <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Dashboard Banners' | t }}</span>
                    <span class="mt-1 block text-sm text-gray-600">{{ 'Announce events, new cohorts, graduations and student shout-outs.' | t }}</span>
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--zb-accent,#007979)]">
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
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[color:var(--zb-accent,#007979)]">
                  <mat-icon>admin_panel_settings</mat-icon>
                </span>
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Access Control' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Staff & Access Management' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Manage roles, invitations, and organization access.' | t }}</span>
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--zb-accent,#007979)]">
                <span class="hidden sm:inline">{{ accessControlExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                <mat-icon>{{ accessControlExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              </span>
            </button>

            @if (accessControlExpanded()) {
              <div id="organization-access-control-panel" class="border-t border-gray-100 p-5 sm:p-6">
                @if (canManageMembers()) {
                  <div class="mb-5 flex justify-end">
                    <button mat-flat-button class="!bg-[color:var(--zb-accent,#007979)] !text-white" type="button" (click)="toggleInviteForm()">
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
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[color:var(--zb-accent,#007979)]"
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
                        class="!bg-[color:var(--zb-accent,#007979)] !text-white"
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
                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]" [class.border-[color:var(--zb-accent,#007979)]]="summaryFilter() === 'all'" [class.ring-2]="summaryFilter() === 'all'" [class.ring-teal-100]="summaryFilter() === 'all'" [attr.aria-pressed]="summaryFilter() === 'all'" (click)="selectSummaryFilter('all')">
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

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]" [class.border-[color:var(--zb-accent,#007979)]]="summaryFilter() === 'active'" [class.ring-2]="summaryFilter() === 'active'" [class.ring-teal-100]="summaryFilter() === 'active'" [attr.aria-pressed]="summaryFilter() === 'active'" (click)="selectSummaryFilter('active')">
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

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]" [class.border-[color:var(--zb-accent,#007979)]]="summaryFilter() === 'administrators'" [class.ring-2]="summaryFilter() === 'administrators'" [class.ring-teal-100]="summaryFilter() === 'administrators'" [attr.aria-pressed]="summaryFilter() === 'administrators'" (click)="selectSummaryFilter('administrators')">
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

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]" [class.border-[color:var(--zb-accent,#007979)]]="summaryFilter() === 'managers'" [class.ring-2]="summaryFilter() === 'managers'" [class.ring-teal-100]="summaryFilter() === 'managers'" [attr.aria-pressed]="summaryFilter() === 'managers'" (click)="selectSummaryFilter('managers')">
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

                <button type="button" class="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--zb-accent,#007979)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]" [class.border-[color:var(--zb-accent,#007979)]]="summaryFilter() === 'staff'" [class.ring-2]="summaryFilter() === 'staff'" [class.ring-teal-100]="summaryFilter() === 'staff'" [attr.aria-pressed]="summaryFilter() === 'staff'" (click)="selectSummaryFilter('staff')">
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

                    <mat-form-field appearance="outline" class="zb-field w-full sm:max-w-xs zb-search">
                      <mat-label>{{ 'Search memberships' | t }}</mat-label>
                      <mat-icon matPrefix aria-hidden="true">search</mat-icon>
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
                  <mat-icon class="!h-10 !w-10 !text-[40px] text-[color:var(--zb-accent,#007979)]">
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
                                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 transition hover:bg-teal-50 hover:text-[color:var(--zb-accent,#007979)] hover:ring-2 hover:ring-[color:var(--zb-accent,#007979)]/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]"
                                >
                                  {{ initials(member) }}
                                </a>

                                <div class="min-w-0">
                                  <a
                                    [routerLink]="memberProfileRoute(member)"
                                    class="block break-words text-sm font-semibold text-gray-900 hover:text-[color:var(--zb-accent,#007979)] hover:underline"
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
                                    class="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[color:var(--zb-accent,#007979)]"
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
                  <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Learning & Development' | t }}</span>
                  <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Organization Members' | t }}</span>
                  <span class="mt-1 block text-sm text-gray-600">{{ 'Browse regular members and open their learning dashboard.' | t }}</span>
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--zb-accent,#007979)]">
                <span class="hidden sm:inline">{{ membersDirectoryExpanded() ? ('Collapse' | t) : ('Expand' | t) }}</span>
                <mat-icon>{{ membersDirectoryExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              </span>
            </button>

            @if (membersDirectoryExpanded()) {
              <div id="organization-members-directory-panel" class="border-t border-gray-100 p-5 sm:p-6">
                <div class="mb-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div class="flex flex-wrap gap-x-4">

                    <mat-form-field appearance="outline" class="zb-field w-full sm:max-w-xs zb-search">
                      <mat-label>{{ 'Search regular members' | t }}</mat-label>
                      <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <input matInput
                      id="regularMemberSearch"
                      type="search"
                      [value]="regularMemberSearch()"
                      (input)="setRegularMemberSearch($any($event.target).value)"
                      [placeholder]="'Search by name or email' | t"
                    />
                    </mat-form-field>

                    @if (groupFilter(); as filter) {
                      <mat-form-field appearance="outline" class="zb-field w-full sm:max-w-xs">
                        <mat-label>{{ 'Training group' | t }}</mat-label>
                        <mat-select [value]="groupId()" (selectionChange)="groupId.set($event.value)">
                          <mat-option value="">{{ 'All training groups' | t }}</mat-option>
                          @for (group of filter.groups; track group.id) {
                            <mat-option [value]="group.id">{{ group.name }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    }
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
                            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-[color:var(--zb-accent,#007979)] transition hover:ring-2 hover:ring-[color:var(--zb-accent,#007979)]/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--zb-accent,#007979)]"
                          >{{ initials(member) }}</a>
                          <div class="min-w-0">
                            <a
                              [routerLink]="memberProfileRoute(member)"
                              class="block break-words text-sm font-semibold text-gray-900 hover:text-[color:var(--zb-accent,#007979)] hover:underline"
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
                    <span class="block text-xs font-semibold uppercase tracking-wider text-[color:var(--zb-accent,#007979)]">{{ 'Security & compliance' | t }}</span>
                    <span class="mt-1 block text-lg font-bold text-gray-900">{{ 'Audit Log' | t }}</span>
                    <span class="mt-1 block text-sm text-gray-600">{{ 'Every change made by your organization, by Zebron, and by the system.' | t }}</span>
                  </span>
                </span>
                <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-[color:var(--zb-accent,#007979)]">
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

  /**
   * Settings for each active application the person can manage. Same pages
   * and the same role rules as the gears on the dashboard cards
   * (PartnerAdminComponent.settingsRoute); keep the two in step.
   */
  protected readonly applicationSettings = computed(() => {
    const organizationId = this.organizationStore.selectedOrganizationId();
    if (!organizationId) {
      return [];
    }
    const active = (id: string) => this.organizationStore.hasActiveApplication(id);
    const base = ['/partner/org', organizationId];
    const items: { id: string; icon: string; title: string; description: string; route: string[] }[] = [];

    if (this.access.isStaffOrAbove() && (active('courses') || active('virtual-classroom') || active('training-groups'))) {
      items.push({
        id: 'learning',
        icon: 'school',
        title: 'Learning administration',
        description: 'Courses, assignments, team progress, the Virtual Classroom and Training Groups.',
        route: [...base, 'learning', 'manage'],
      });
    }
    if (this.access.isStaffOrAbove() && active('training-groups')) {
      items.push({
        id: 'training-groups',
        icon: 'groups',
        title: 'Training Groups',
        description: 'Cohorts: dates, capacity, leads, instructors and members.',
        route: [...base, 'training-groups'],
      });
    }
    if (this.access.can('testCenter.settings') && active('test-center')) {
      items.push({
        id: 'test-center',
        icon: 'quiz',
        title: 'Test Center',
        description: 'Programs, quizzes, topics, questions and linked Zebron quizzes.',
        route: [...base, 'test-center'],
      });
    }
    if (this.access.can('knowledge.manage') && active('knowledge')) {
      items.push({
        id: 'knowledge',
        icon: 'menu_book',
        title: 'Knowledge Center',
        description: 'Write, review and publish your organization\u0027s articles.',
        route: [...base, 'knowledge', 'manage'],
      });
    }
    if (this.access.isManagerOrAbove() && active('blog')) {
      items.push({
        id: 'blog',
        icon: 'article',
        title: 'Blog',
        description: 'Review, schedule and publish posts.',
        route: [...base, 'blog', 'manage'],
      });
    }
    return items;
  });

  /** Organization mailbox: managers and above. */
  /** Mailbox is on demand: shown once the organization has it. */
  protected readonly canUseMailbox = computed(
    () => this.access.can('mailbox.access') && this.organizationStore.hasActiveApplication('mailbox'),
  );

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

  // ---------- Appearance (organizations/{id}/settings/branding) ----------
  protected readonly branding = inject(OrganizationBrandingService);
  protected readonly accentPresets = ACCENT_PRESETS;
  protected readonly logoTypes = LOGO_TYPES.join(',');
  protected readonly logoBusy = signal(false);
  protected readonly logoMessage = signal<{ text: string; error: boolean } | null>(null);

  protected async onLogoPicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const organizationId = this.organizationStore.selectedOrganizationId();
    if (!file || !organizationId) return;
    this.logoBusy.set(true);
    this.logoMessage.set(null);
    try {
      await this.branding.uploadLogo(organizationId, file);
      this.logoMessage.set({ text: 'Logo saved. Your dashboard shows it now.', error: false });
    } catch (error) {
      const message = error instanceof Error && /PNG|5 MB|browser/.test(error.message)
        ? error.message
        : 'The logo could not be uploaded. Try again.';
      this.logoMessage.set({ text: message, error: true });
    } finally {
      this.logoBusy.set(false);
    }
  }

  protected async removeLogo(): Promise<void> {
    const organizationId = this.organizationStore.selectedOrganizationId();
    if (!organizationId) return;
    this.logoBusy.set(true);
    this.logoMessage.set(null);
    try {
      await this.branding.removeLogo(organizationId);
      this.logoMessage.set({ text: 'Logo removed.', error: false });
    } catch {
      this.logoMessage.set({ text: 'The logo could not be removed. Try again.', error: true });
    } finally {
      this.logoBusy.set(false);
    }
  }
  protected readonly accent = signal<string>(DEFAULT_ACCENT);
  protected readonly savedAccent = signal<string>(DEFAULT_ACCENT);
  protected readonly savingAccent = signal(false);
  protected readonly accentMessage = signal<{ text: string; error: boolean } | null>(null);
  protected readonly accentPreview = computed(() => accentPreset(this.accent()));
  protected readonly accentPreset = accentPreset;
  protected readonly backgroundPreset = backgroundPreset;
  protected readonly backgroundPresets = BACKGROUND_PRESETS;
  protected readonly background = signal<string>(DEFAULT_BACKGROUND);
  protected readonly savedBackground = signal<string>(DEFAULT_BACKGROUND);
  protected backgroundColor(key: string): string {
    return pageBackground(this.accent(), key);
  }
  /** The page follows the organization's saved accent color (as the dashboard does). */
  protected readonly accentStyle = computed(() => accentStyle(this.branding.accent(), this.branding.background()));
  /**
   * The Appearance card starts closed, except when opened from a link with
   * ?section=appearance (Admin > Organizations > Appearance), which also
   * scrolls to it once the page has loaded.
   */
  private readonly openAppearance = inject(ActivatedRoute).snapshot.queryParamMap.get('section') === 'appearance';
  protected readonly appearanceExpanded = signal(this.openAppearance);
  private appearanceScrolled = false;
  private readonly scrollToAppearance = effect(() => {
    if (!this.openAppearance || this.appearanceScrolled || !this.canManageOrganization()) return;
    this.appearanceScrolled = true;
    // The section appears once the organization has loaded: look for it for up to 5 seconds.
    let tries = 0;
    const scroll = () => {
      const section = document.getElementById('organization-appearance');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (++tries < 20) {
        setTimeout(scroll, 250);
      }
    };
    setTimeout(scroll, 250);
  });

  private readonly loadAccent = effect(() => {
    const organizationId = this.organizationStore.selectedOrganizationId();
    if (!organizationId) return;
    untracked(() => {
      void this.branding.loadBranding(organizationId).then((branding) => {
        this.savedAccent.set(branding.accent);
        this.accent.set(branding.accent);
        this.savedBackground.set(branding.background);
        this.background.set(branding.background);
      });
    });
  });

  protected async saveAccent(): Promise<void> {
    const organizationId = this.organizationStore.selectedOrganizationId();
    if (!organizationId) return;
    this.savingAccent.set(true);
    this.accentMessage.set(null);
    try {
      await this.branding.save(organizationId, this.accent(), this.background());
      this.savedAccent.set(this.accent());
      this.savedBackground.set(this.background());
      this.accentMessage.set({ text: 'Saved. Your organization pages use it now.', error: false });
    } catch {
      this.accentMessage.set({ text: 'The appearance could not be saved. Try again.', error: true });
    } finally {
      this.savingAccent.set(false);
    }
  }

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

  // Training group filter on Organization Members (when the organization has Training Groups).
  private readonly trainingGroups = inject(TrainingGroupService);
  protected readonly groupFilter = signal<GroupFilter | null>(null);
  protected readonly groupId = signal('');

  protected readonly filteredRegularMembers = computed(() => {
    const search = this.regularMemberSearch().trim().toLowerCase();
    const groupId = this.groupId();
    const groupMembers = groupId ? this.groupFilter()?.members.get(groupId) : null;
    return this.members()
      .filter((member) => member.role === 'org_member')
      .filter((member) => !groupMembers || groupMembers.has(member.userId))
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

    if (this.organizationStore.hasActiveApplication('training-groups') && this.access.isStaffOrAbove()) {
      void this.trainingGroups.loadGroupFilter(organizationId).then((filter) => this.groupFilter.set(filter));
    }

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

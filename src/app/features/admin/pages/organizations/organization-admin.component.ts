import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { AuthService } from '../../../../core/services/auth.service';
import { firestore } from '../../../../core/services/firebase-config';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';

import { Organization } from '../../../../core/models/organization.model';
import { OrganizationMembership } from '../../../../core/models/organization-membership.model';
import { OrganizationMembershipRole } from '../../../../core/models/organization-membership.model';
import { Location } from '../../../../core/models/location.model';

import { OrganizationMembershipService } from '../../../../core/services/organization-membership.service';

import { OrganizationContextStore  } from '../../../organizations/stores/organization-context.store';
import { LocationStore } from '../../../locations/stores/location.store';
import { UserStore } from '../../../users/stores/user.store';

import {
  OrganizationLifecycleService,
  type OrganizationLifecycleAction,
} from '../../../../core/services/organization-lifecycle.service';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
@Component({
  selector: 'app-organization-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatExpansionModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="border-b border-gray-200 bg-[#007979]">
        <div
          class="mx-auto flex max-w-7xl items-center
                 justify-between gap-4 px-4 py-1
                 sm:px-6 lg:px-8"
        >
          <div>
            <p class="text-sm text-white/80">
              Create and manage organizations associated with Zebron resources.
            </p>

          </div>


        </div>
      </header>

      <!-- =========================================================
           MAIN
           ========================================================= -->

      <main class="mx-auto max-w-6xl p-4 sm:p-2">
        <!-- =======================================================
             ORGANIZATION MANAGEMENT
             ======================================================= -->

        <section
          class="mt-2 rounded-2xl border
                 border-gray-200 bg-white shadow-sm"
        >
          <div class="grid gap-0 lg:grid-cols-3">
            <!-- ===================================================
                 ORGANIZATION FORM
                 =================================================== -->

            @if (showForm()) {
            <div [class]="layout() === 'split' ? 'lg:col-span-2 p-4 sm:p-6' : 'lg:col-span-3 p-4 sm:p-6'">
              @if (layout() !== 'split') {
                <button
                  type="button"
                  (click)="backToDirectory()"
                  class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#007979] hover:underline"
                >
                  <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">arrow_back</mat-icon>
                  Back to organizations
                </button>
              }
              <div
                class="flex flex-col gap-1
                       border-b border-gray-200 pb-5 "
              >
                <p
                  class="text-xs font-semibold uppercase
                         tracking-wide text-[#007979]"
                >
                  {{ editingId() ? 'Edit organization' : 'New organization' }}
                </p>

                <h2 class="text-xl font-semibold text-[#032D42]">
                  {{ editingId() ? 'Update organization' : 'Create organization' }}
                </h2>

                <p class="text-sm text-gray-500">
                  {{
                    editingId()
                      ? 'Update the organization details and location information.'
                      : 'Add an organization and its location information.'
                  }}
                </p>
              </div>

              <!-- =================================================
                   FORM
                   ================================================= -->

              <form class="mt-6 space-y-7" (ngSubmit)="saveOrganization()">
                <!-- =================================================
                     BASIC INFORMATION
                     ================================================= -->

                <section>
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Basic information</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Core information used to identify the organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- Name -->

                    <div class="sm:col-span-2">

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Organization name</mat-label>
                        <input matInput
                        id="name"
                        name="name"
                        type="text"
                        [(ngModel)]="form.name"
                        (ngModelChange)="generateSlug()"
                        required
                        placeholder="Maryland Food Bank"
                      />
                      </mat-form-field>
                    </div>

                    <!-- Slug -->

                    <div class="sm:col-span-2">

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Slug</mat-label>
                        <input matInput
                        id="slug"
                        name="slug"
                        type="text"
                        [(ngModel)]="form.slug"
                        required
                        placeholder="maryland-food-bank"
                      />
                      </mat-form-field>

                      <p class="mt-1.5 text-xs text-gray-500">
                        Automatically generated from the organization name.
                      </p>
                    </div>

                    <!-- Description -->

                    <div class="sm:col-span-2">

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Description</mat-label>
                        <textarea matInput
                        id="description"
                        name="description"
                        rows="4"
                        [(ngModel)]="form.description"
                        placeholder="Describe the organization and the services it provides."
                      ></textarea>
                      </mat-form-field>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     CONTACT INFORMATION
                     ================================================= -->

                <section class="border-t border-gray-200 pt-6">
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Contact information</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Optional ways users can contact the organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- Website -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Website</mat-label>
                        <input matInput
                        id="website"
                        name="website"
                        type="url"
                        [(ngModel)]="form.website"
                        placeholder="https://example.org"
                      />
                      </mat-form-field>
                    </div>

                    <!-- Phone -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Phone</mat-label>
                        <input matInput
                        id="phone"
                        name="phone"
                        type="tel"
                        [(ngModel)]="form.phone"
                        placeholder="301-555-1234"
                      />
                      </mat-form-field>
                    </div>

                    <!-- Email -->

                    <div class="sm:col-span-2">

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Email</mat-label>
                        <input matInput
                        id="email"
                        name="email"
                        type="email"
                        [(ngModel)]="form.email"
                        placeholder="info@example.org"
                      />
                      </mat-form-field>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     LOCATION
                     ================================================= -->

                <section class="border-t border-gray-200 pt-6">
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Location</h3>

                    <p class="mt-1 text-xs text-gray-500">
                      The location is stored separately in the
                      <code>locations</code> collection and linked to this organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">
                    <!-- Address -->

                    <div class="sm:col-span-2">

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Street address</mat-label>
                        <input matInput
                        id="address"
                        name="address"
                        type="text"
                        [(ngModel)]="form.address"
                        placeholder="123 Main Street"
                      />
                      </mat-form-field>
                    </div>

                    <!-- City -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>City</mat-label>
                        <input matInput
                        id="city"
                        name="city"
                        type="text"
                        [(ngModel)]="form.city"
                        placeholder="Baltimore"
                      />
                      </mat-form-field>
                    </div>

                    <!-- State -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>State</mat-label>
                        <input matInput
                        id="state"
                        name="state"
                        type="text"
                        maxlength="2"
                        [(ngModel)]="form.state"
                        placeholder="MD"
                      />
                      </mat-form-field>
                    </div>

                    <!-- ZIP -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>ZIP code</mat-label>
                        <input matInput
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        [(ngModel)]="form.zipCode"
                        placeholder="21201"
                      />
                      </mat-form-field>
                    </div>

                    <!-- Country -->

                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Country</mat-label>
                        <input matInput
                        id="country"
                        name="country"
                        type="text"
                        [(ngModel)]="form.country"
                        placeholder="United States"
                      />
                      </mat-form-field>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     STATUS
                     ================================================= -->

                <section class="border-t border-gray-200 pt-6">
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-gray-900">Status</h3>
                  </div>

                  <div class="flex flex-wrap gap-6">
                    <mat-checkbox name="verified" [(ngModel)]="form.verified">Verified organization</mat-checkbox>

                    <mat-checkbox name="active" [(ngModel)]="form.active">Active organization</mat-checkbox>
                  </div>
                </section>

                <!-- =================================================
                     ERROR
                     ================================================= -->

                @if (error()) {
                  <div
                    class="rounded-lg border border-red-200
                           bg-red-50 px-4 py-3
                           text-sm text-red-700"
                  >
                    {{ error() }}
                  </div>
                }

                <!-- =================================================
                     FORM ACTIONS
                     ================================================= -->

                <div
                  class="flex flex-wrap items-center
                         gap-2 border-t border-gray-200 pt-6"
                >
                  <button
                    type="submit"
                    [disabled]="saving()"
                    class="rounded-lg bg-[#032D42]
                           px-4 py-2 text-sm font-medium
                           text-white transition
                           hover:bg-[#032D42]/90
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                  >
                    {{
                      saving()
                        ? 'Saving...'
                        : editingId()
                          ? 'Update organization'
                          : 'Create organization'
                    }}
                  </button>

                  @if (editingId() || layout() !== 'split') {
                    <button
                      type="button"
                      (click)="cancelEdit()"
                      [disabled]="saving()"
                      class="rounded-lg border
                             border-gray-300 bg-white
                             px-4 py-2 text-sm
                             font-medium text-gray-700
                             transition hover:bg-gray-50
                             disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  }
                </div>
              </form>
            </div>
            }

            <!-- ===================================================
                 EXISTING ORGANIZATIONS
                 =================================================== -->

            @if (showDirectory()) {
            <aside
              [class]="layout() === 'split'
                ? 'border-t border-gray-200 bg-gray-50/60 lg:border-l lg:border-t-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto'
                : 'lg:col-span-3'"
            >
              <div class="p-4 sm:p-6">
                <div
                  class="flex items-start
                         justify-between gap-3"
                >
                  <div>
                    <p
                      class="text-xs font-semibold uppercase
                             tracking-wide text-[#007979]"
                    >
                      Directory
                    </p>

                    <h2
                      class="mt-1 text-xl font-semibold
                             text-[#032D42]"
                    >
                      Existing organizations
                    </h2>

                    <p class="mt-1 text-sm text-gray-500">
                      Expand an organization to view, edit or manage it.
                    </p>
                  </div>

                  @if (layout() !== 'split') {
                    <button
                      type="button"
                      (click)="startCreate()"
                      class="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#032D42] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#032D42]/90"
                    >
                      <mat-icon class="!h-5 !w-5 !text-[18px]" aria-hidden="true">add</mat-icon>
                      <span>Create Organization</span>
                    </button>
                  }

                  @if (!loading()) {
                    <span
                      class="inline-flex min-w-7
                             items-center justify-center
                             rounded-full bg-white
                             px-2 py-1 text-xs
                             font-semibold text-gray-600
                             shadow-sm ring-1 ring-gray-200"
                    >
                      {{ organizations().length }}
                    </span>
                  }
                </div>

                <!-- Search, status filter and display preference -->

                <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div class="relative w-full min-w-0 sm:max-w-56">
                    <mat-icon class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 !text-gray-400" aria-hidden="true">search</mat-icon>
                    <input
                      #orgSearch
                      type="search"
                      class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#007979] focus:ring-4 focus:ring-[#007979]/15"
                      placeholder="Search by name, email or website"
                      aria-label="Search organizations"
                      [value]="search()"
                      (input)="search.set(orgSearch.value)"
                      (keydown.escape)="search.set('')"
                    />
                  </div>

                  <select
                    class="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#007979]"
                    aria-label="Filter by status"
                    [value]="statusFilter()"
                    (change)="statusFilter.set($any($event.target).value)"
                  >
                    <option value="">All statuses</option>
                    @for (status of statusOptions(); track status) {
                      <option [value]="status">{{ status | titlecase }}</option>
                    }
                  </select>

                  <!-- Display preference (saved per admin) -->
                  <div class="inline-flex shrink-0 rounded-lg bg-gray-100 p-1 sm:ml-auto" role="radiogroup" aria-label="Display preference">
                    @for (option of layoutOptions; track option.key) {
                      <button
                        type="button"
                        role="radio"
                        [attr.aria-checked]="layout() === option.key"
                        [title]="option.title"
                        (click)="setLayout(option.key)"
                        [class]="layout() === option.key
                          ? 'inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-[#032D42] shadow-sm'
                          : 'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-[#032D42]'"
                      >
                        <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">{{ option.icon }}</mat-icon>
                        <span class="hidden sm:inline">{{ option.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Loading -->

                @if (loading()) {
                  <div
                    class="mt-6 rounded-xl border
                           border-gray-200 bg-white p-5"
                  >
                    <p class="text-sm text-gray-500">Loading organizations...</p>
                  </div>
                }

                <!-- Empty -->

                @if (!loading() && organizations().length === 0) {
                  <div
                    class="mt-6 rounded-xl border
                           border-dashed border-gray-300
                           bg-white p-6 text-center"
                  >
                    <p
                      class="text-sm font-medium
                             text-gray-700"
                    >
                      No organizations found.
                    </p>

                    <p class="mt-1 text-xs text-gray-500">
                      Use Create Organization to add the first one.
                    </p>
                  </div>
                }

                <!-- Organization list -->

                @if (organizations().length > 0 && filteredOrganizations().length === 0) {
                  <div class="mt-5 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                    <p class="text-sm font-medium text-gray-700">No organizations match your search.</p>
                    <button type="button" class="mt-2 text-sm font-medium text-[#007979] hover:underline" (click)="clearFilters()">Clear filters</button>
                  </div>
                }

                @if (filteredOrganizations().length > 0) {
                  <div
                    [class]="layout() === 'cards'
                      ? 'mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                      : 'mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'"
                  >
                    @for (organization of filteredOrganizations(); track organization.id) {
                      <div [class]="layout() === 'cards' ? 'min-w-0' : 'border-b border-gray-200 last:border-b-0'">
                        <mat-expansion-panel
                          [expanded]="layout() === 'cards' || expandedId() === organization.id"
                          (opened)="expandedId.set(organization.id)"
                          class="!overflow-hidden !rounded-xl !border !border-gray-200 !shadow-none
         !bg-white
         [&.mat-expanded]:!bg-white"
                        >
                          <!-- First line: Organization name, status, and toggle arrow -->
                          <mat-expansion-panel-header
                            class="!bg-gray-50 !px-4
           [&.mat-expanded]:!bg-white"
                          >
                            <mat-panel-title class="!mr-3 !min-w-0">
                              <span class="truncate text-sm font-semibold text-gray-900">
                                {{ organization.name }}
                              </span>
                            </mat-panel-title>

                            <mat-panel-description class="!mr-2 !flex-grow-0 !items-center">
                              <span
                                class="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
                                [class.bg-green-100]="organization.active"
                                [class.text-green-700]="organization.active"
                                [class.bg-gray-100]="!organization.active"
                                [class.text-gray-600]="!organization.active"
                              >
                                {{ organizationStatus(organization) | titlecase }}
                              </span>
                            </mat-panel-description>
                          </mat-expansion-panel-header>

                          <!-- Everything below the header is collapsible -->

                          <!-- Description and verification badge -->
                          <div class="flex items-center justify-between gap-3">
                            @if (organization.description) {
                              <p
                                class="line-clamp-2 min-w-0 flex-1 text-sm leading-5 text-gray-600"
                              >
                                {{ organization.description }}
                              </p>
                            }

                            @if (organization.verified) {
                              <span
                                class="inline-flex shrink-0 items-center text-xs font-medium text-[#007979]"
                              >
                                <mat-icon aria-label="Verified organization"> verified </mat-icon>
                              </span>
                            }
                          </div>

                          <!-- Organization actions -->
                          <div class="mt-4 flex items-center justify-between gap-3">
                            <div class="shrink-0"></div>

                            <div class="flex shrink-0 flex-wrap justify-end gap-1.5">
                              <!-- Edit -->
                              <button
                                type="button"
                                (click)="editOrganization(organization)"
                                [disabled]="saving()"
                                class="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#007979]/40 hover:bg-[#007979]/5 disabled:opacity-50"
                              >
                                View/Edit
                              </button>

                              <!-- Suspend -->
                              @if (canPerformLifecycleAction(organization, 'suspend')) {
                                <button
                                  type="button"
                                  (click)="performLifecycleAction(organization, 'suspend')"
                                  [disabled]="saving() || lifecycleSavingId() !== null"
                                  class="rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                >
                                  {{
                                    lifecycleSavingId() === organization.id
                                      ? 'Suspending...'
                                      : 'Suspend'
                                  }}
                                </button>
                              }

                              <!-- Reactivate -->
                              @if (canPerformLifecycleAction(organization, 'reactivate')) {
                                <button
                                  type="button"
                                  (click)="performLifecycleAction(organization, 'reactivate')"
                                  [disabled]="saving() || lifecycleSavingId() !== null"
                                  class="rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  {{
                                    lifecycleSavingId() === organization.id
                                      ? 'Reactivating...'
                                      : 'Reactivate'
                                  }}
                                </button>
                              }

                              <!-- Archive -->
                              @if (canPerformLifecycleAction(organization, 'archive')) {
                                <button
                                  type="button"
                                  (click)="performLifecycleAction(organization, 'archive')"
                                  [disabled]="saving() || lifecycleSavingId() !== null"
                                  class="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Archive
                                </button>
                              }

                              <!-- Restore -->
                              @if (canPerformLifecycleAction(organization, 'restore')) {
                                <button
                                  type="button"
                                  (click)="performLifecycleAction(organization, 'restore')"
                                  [disabled]="saving() || lifecycleSavingId() !== null"
                                  class="rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                >
                                  Restore
                                </button>
                              }

                              <!-- Delete -->
                              <button
                                type="button"
                                (click)="deleteOrganization(organization)"
                                [disabled]="saving()"
                                class="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </mat-expansion-panel>
                      </div>
                    }
                  </div>
                }
              </div>
            </aside>
            }
          </div>
        </section>

        <!-- =========================================================
             ORGANIZATION MEMBERS
             ========================================================= -->

        @if (editingId()) {
          <section
            class="mt-6 overflow-hidden rounded-2xl
                   border border-gray-200 bg-white
                   shadow-sm"
          >
            <!-- Header -->

            <div
              class="flex flex-col gap-4
                     border-b border-gray-200
                     px-5 py-5
                     sm:flex-row sm:items-center
                     sm:justify-between"
            >
              <div>
                <p
                  class="text-xs font-semibold uppercase
                         tracking-wide text-[#007979]"
                >
                  Organization access
                </p>

                <h2
                  class="mt-1 text-xl font-semibold
                         text-[#032D42]"
                >
                  Members
                </h2>

                <p class="mt-1 text-sm text-gray-500">
                  Manage users who can access
                  {{ form.name }} organization resources.
                </p>
              </div>

              <button
                type="button"
                (click)="startAddMember()"
                [disabled]="membershipSaving()"
                class="rounded-lg bg-[#032D42]
                       px-4 py-2 text-sm font-semibold
                       text-white transition
                       hover:bg-[#032D42]/90
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                + Add member
              </button>
            </div>

            <!-- =====================================================
                 ADD MEMBER FORM
                 ===================================================== -->

            @if (showMemberForm()) {
              <div
                class="border-b border-gray-200
                       bg-gray-50 px-5 py-5"
              >
                <div class="mb-4">
                  <h3
                    class="text-sm font-semibold
                           text-gray-900"
                  >
                    Add organization member
                  </h3>

                  <p class="mt-1 text-xs text-gray-500">
                    Select an existing Zebron user and assign their organization role.
                  </p>
                </div>

                <div
                  class="grid gap-4
                         md:grid-cols-[minmax(0,1fr)_220px_auto]"
                >
                  <!-- User -->

                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>User</mat-label>
                      <mat-select
                      id="memberUser"
                      name="memberUser"
                      [ngModel]="selectedMemberUserId()"
                      (ngModelChange)="selectedMemberUserId.set($event)"
                    >
                      <mat-option value="">Select a user</mat-option>

                      @for (user of userStore.users(); track user.id) {
                        <mat-option [value]="user.id">
                          {{ user.displayName || user.preferredName || user.email || user.id }}
                          @if (user.email) {
                            — {{ user.email }}
                          }
                        </mat-option>
                      }
                    </mat-select>
                    </mat-form-field>
                  </div>

                  <!-- Role -->

                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Role</mat-label>
                      <mat-select
                      id="memberRole"
                      name="memberRole"
                      [ngModel]="selectedMemberRole()"
                      (ngModelChange)="selectedMemberRole.set($event)"
                    >
                      @for (role of membershipRoles; track role) {
                        <mat-option [value]="role">
                          {{ role | titlecase }}
                        </mat-option>
                      }
                    </mat-select>
                    </mat-form-field>
                  </div>

                  <!-- Actions -->

                  <div class="flex items-end gap-2">
                    <button
                      type="button"
                      (click)="addMember()"
                      [disabled]="membershipSaving()"
                      class="rounded-lg bg-[#007979]
                             px-4 py-2.5
                             text-sm font-semibold
                             text-white transition
                             hover:bg-[#006666]
                             disabled:cursor-not-allowed
                             disabled:opacity-50"
                    >
                      {{ membershipSaving() ? 'Adding...' : 'Add' }}
                    </button>

                    <button
                      type="button"
                      (click)="cancelAddMember()"
                      [disabled]="membershipSaving()"
                      class="rounded-lg border
                             border-gray-300 bg-white
                             px-4 py-2.5
                             text-sm font-medium
                             text-gray-700
                             hover:bg-gray-50
                             disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- =====================================================
                 MEMBERSHIP ERROR
                 ===================================================== -->

            @if (membershipError()) {
              <div
                class="mx-5 mt-5 rounded-lg
                       border border-red-200
                       bg-red-50 px-4 py-3
                       text-sm text-red-700"
              >
                {{ membershipError() }}
              </div>
            }

            <!-- =====================================================
                 MEMBERS
                 ===================================================== -->

            <div class="p-5">
              @if (membershipLoading()) {
                <div
                  class="rounded-xl border
                         border-gray-200
                         bg-gray-50 p-6 text-center"
                >
                  <p class="text-sm text-gray-500">Loading members...</p>
                </div>
              } @else if (!membershipLoading() && memberships().length === 0) {
                <div
                  class="rounded-xl border
                         border-dashed border-gray-300
                         bg-gray-50 p-8 text-center"
                >
                  <p
                    class="text-sm font-medium
                           text-gray-700"
                  >
                    No members yet
                  </p>

                  <p
                    class="mt-1 text-xs
                           text-gray-500"
                  >
                    Add a user to give them access to organization resources.
                  </p>
                </div>
              } @else {
                <div
                  class="overflow-hidden rounded-xl
                         border border-gray-200"
                >
                  <!-- Table header -->

                  <div
                    class="hidden
                           grid-cols-[minmax(0,1fr)_160px_110px_90px]
                           gap-4 bg-gray-50 px-4 py-3
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500
                           md:grid"
                  >
                    <span>User</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span></span>
                  </div>

                  <!-- Members -->

                  @for (membership of memberships(); track membership.id) {
                    <div
                      class="grid gap-4
                             border-t border-gray-200
                             px-4 py-4
                             first:border-t-0
                             md:grid-cols-[minmax(0,1fr)_160px_110px_90px]
                             md:items-center"
                    >
                      <!-- User -->

                      <div class="min-w-0">
                        <p
                          class="truncate text-sm
                                 font-semibold
                                 text-gray-900"
                        >
                          {{ getUserName(membership.userId) }}
                        </p>

                        <p
                          class="mt-1 truncate
                                 text-xs text-gray-500"
                        >
                          {{ getUserEmail(membership.userId) }}
                        </p>
                      </div>

                      <!-- Role -->

                      <div>
                        <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                          <mat-label>Role</mat-label>
                          <mat-select
                          [ngModel]="membership.role"
                          (ngModelChange)="updateMemberRole(membership, $event)"
                          [disabled]="membershipSaving()"
                        >
                          @for (role of membershipRoles; track role) {
                            <mat-option [value]="role">
                              {{ role | titlecase }}
                            </mat-option>
                          }
                        </mat-select>
                        </mat-form-field>
                      </div>

                      <!-- Status -->

                      <div>
                        <button
                          type="button"
                          (click)="updateMemberActive(membership, !membership.active)"
                          [disabled]="membershipSaving()"
                          class="rounded-full
                                 px-2.5 py-1
                                 text-xs font-medium
                                 transition"
                          [class.bg-green-100]="membership.active"
                          [class.text-green-700]="membership.active"
                          [class.bg-gray-100]="!membership.active"
                          [class.text-gray-600]="!membership.active"
                        >
                          {{ membership.active ? 'Active' : 'Inactive' }}
                        </button>
                      </div>

                      <!-- Remove -->

                      <div
                        class="flex justify-start
                               md:justify-end"
                      >
                        <button
                          type="button"
                          (click)="removeMember(membership)"
                          [disabled]="membershipSaving()"
                          class="rounded-md border
                                 border-red-200
                                 bg-white px-2.5 py-1.5
                                 text-xs font-medium
                                 text-red-600 transition
                                 hover:bg-red-50
                                 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </section>
        }
      </main>
    </div>
  `,
})
export class OrganizationAdminComponent implements OnInit {
  // ===============================================================
  // Services
  // ===============================================================

  private readonly locationStore = inject(LocationStore);

  private readonly toast = inject(HotToastService);

  private readonly membershipService = inject(OrganizationMembershipService);

  private readonly organizationLifecycleService = inject(OrganizationLifecycleService);

  protected readonly organizationStore = inject(OrganizationContextStore );

  protected readonly userStore = inject(UserStore);

  // ===============================================================
  // Organization state
  // ===============================================================

  protected readonly organizations = this.organizationStore.organizations;

  // ===============================================================
  // Views and display preference
  // ===============================================================

  private readonly authService = inject(AuthService);

  private static readonly LAYOUT_KEY = 'zebron:admin:organizations-layout';

  /** Directory (list of organizations) or the create/edit form. */
  protected readonly view = signal<'list' | 'form'>('list');

  /** Expandable list, cards, or the form beside the list (split). */
  protected readonly layout = signal<'list' | 'cards' | 'split'>(this.readLocalLayout());

  protected readonly layoutOptions = [
    { key: 'list' as const, label: 'List', icon: 'view_agenda', title: 'Expandable list' },
    { key: 'cards' as const, label: 'Cards', icon: 'grid_view', title: 'Cards' },
    { key: 'split' as const, label: 'Split', icon: 'vertical_split', title: 'Form beside the list' },
  ];

  protected readonly showForm = computed(() => this.layout() === 'split' || this.view() === 'form');

  protected readonly showDirectory = computed(() => this.layout() === 'split' || this.view() === 'list');

  protected readonly search = signal('');

  protected readonly statusFilter = signal('');

  protected readonly expandedId = signal<string | null>(null);

  protected readonly statusOptions = computed(() =>
    [...new Set(this.organizations().map((organization) => this.organizationStatus(organization)))].sort(),
  );

  protected readonly filteredOrganizations = computed(() => {
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const status = this.statusFilter();

    return this.organizations().filter((organization) => {
      if (status && this.organizationStatus(organization) !== status) {
        return false;
      }
      if (!words.length) {
        return true;
      }
      const text = [organization.name, organization.slug, organization.description, organization.email, organization.website]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return words.every((word) => text.includes(word));
    });
  });

  protected clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
  }

  /** "Create Organization": empty form. */
  protected startCreate(): void {
    this.resetForm();
    this.view.set('form');
    this.scrollToTop();
  }

  protected backToDirectory(): void {
    this.resetForm();
    this.view.set('list');
    this.scrollToTop();
  }

  protected async setLayout(layout: 'list' | 'cards' | 'split'): Promise<void> {
    this.layout.set(layout);

    try {
      localStorage.setItem(OrganizationAdminComponent.LAYOUT_KEY, layout);
    } catch {
      // Storage unavailable; the profile copy still applies.
    }

    const uid = this.authService.firebaseUser()?.uid;
    if (uid) {
      try {
        await updateDoc(doc(firestore, 'users', uid), { 'adminPreferences.organizationsLayout': layout });
      } catch {
        // Kept for this browser only.
      }
    }
  }

  private async loadLayoutPreference(): Promise<void> {
    const uid = this.authService.firebaseUser()?.uid;
    if (!uid) {
      return;
    }
    try {
      const saved = (await getDoc(doc(firestore, 'users', uid))).data()?.['adminPreferences']?.['organizationsLayout'];
      if (saved === 'list' || saved === 'cards' || saved === 'split') {
        this.layout.set(saved);
      }
    } catch {
      // Keep the browser preference.
    }
  }

  private readLocalLayout(): 'list' | 'cards' | 'split' {
    try {
      const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(OrganizationAdminComponent.LAYOUT_KEY);
      return saved === 'cards' || saved === 'split' ? saved : 'list';
    } catch {
      return 'list';
    }
  }

  private scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected readonly loading = this.organizationStore.loading;

  protected readonly storeError = this.organizationStore.error;

  protected readonly error = signal<string | null>(null);

  // ===============================================================
  // Membership state
  // ===============================================================

  protected readonly memberships = signal<OrganizationMembership[]>([]);

  protected readonly membershipLoading = signal(false);

  protected readonly membershipSaving = signal(false);

  protected readonly membershipError = signal<string | null>(null);

  protected readonly showMemberForm = signal(false);

  protected readonly selectedMemberUserId = signal('');

  protected readonly selectedMemberRole = signal<OrganizationMembershipRole>('org_member');

  protected readonly membershipRoles: OrganizationMembershipRole[] = [
    'org_owner',
    'org_admin',
    'org_manager',
    'org_staff',
    'org_member',
  ];

  // ===============================================================
  // Local UI state
  // ===============================================================

  protected readonly saving = signal(false);

  protected readonly lifecycleSavingId = signal<string | null>(null);

  protected readonly editingId = signal<string | null>(null);

  // ===============================================================
  // Organization form
  // ===============================================================

  protected form = {
    name: '',
    slug: '',
    description: '',
    website: '',
    phone: '',
    email: '',

    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',

    verified: false,
    active: true,
  };

  // ===============================================================
  // Lifecycle
  // ===============================================================

  protected readonly provisioningRepairing = signal(false);

  ngOnInit(): void {
    void this.loadOrganizations();
    void this.loadUsers();
    void this.loadLayoutPreference();
  }

  // ===============================================================
  // Load organizations
  // ===============================================================

  private async loadOrganizations(): Promise<void> {
    try {
      await this.organizationStore.loadOrganizations();
    } catch (error) {
      console.error('Failed to load organizations:', error);

      this.error.set('Unable to load organizations.');
    }
  }

  // ===============================================================
  // Load users
  // ===============================================================

  private async loadUsers(): Promise<void> {
    try {
      await this.userStore.loadUsers();
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  // ===============================================================
  // Save organization
  // ===============================================================

  protected async saveOrganization(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const name = this.form.name?.trim() || '';

    const slug = this.form.slug?.trim().toLowerCase() || '';

    if (!name) {
      this.toast.error('Organization name is required.');

      return;
    }

    if (!slug) {
      this.toast.error('Organization slug is required.');

      return;
    }

    const description = this.form.description?.trim() || '';

    const website = this.form.website?.trim() || '';

    const phone = this.form.phone?.trim() || '';

    const email = this.form.email?.trim() || '';

    const address = this.form.address?.trim() || '';

    const city = this.form.city?.trim() || '';

    const state = this.form.state?.trim().toUpperCase() || '';

    const zipCode = this.form.zipCode?.trim() || '';

    const country = this.form.country?.trim() || '';

    const hasLocation = !!(address || city || state || zipCode || country);

    if (hasLocation && !country) {
      this.toast.error('Country is required for a location.');

      return;
    }

    const normalizedCountry = country.toLowerCase();

    const isUnitedStates =
      normalizedCountry === 'united states' ||
      normalizedCountry === 'usa' ||
      normalizedCountry === 'us';

    if (hasLocation && !address) {
      this.toast.error('Street address is required when adding a location.');

      return;
    }

    if (hasLocation && !city) {
      this.toast.error('City is required when adding a location.');

      return;
    }

    if (hasLocation && isUnitedStates && !state) {
      this.toast.error('State is required for United States locations.');

      return;
    }

    if (hasLocation && isUnitedStates && !zipCode) {
      this.toast.error('ZIP code is required for United States locations.');

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const editingId = this.editingId();

    try {
      const organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        slug,
        verified: this.form.verified,
        active: this.form.active,
      };

      if (description) {
        organization.description = description;
      }

      if (website) {
        organization.website = website;
      }

      if (phone) {
        organization.phone = phone;
      }

      if (email) {
        organization.email = email;
      }

      // =============================================================
      // Location
      // =============================================================

      if (hasLocation) {
        const location: Location = {
          country,
        };

        if (address) {
          location.address = address;
        }

        if (city) {
          location.city = city;
        }

        if (state) {
          location.state = state;
        }

        if (zipCode) {
          location.zipCode = zipCode;
        }

        if (editingId) {
          const existingOrganization = this.organizations().find((item) => item.id === editingId);

          if (existingOrganization?.locationId) {
            await this.locationStore.updateLocation(existingOrganization.locationId, location);

            organization.locationId = existingOrganization.locationId;
          } else {
            const locationId = await this.locationStore.createLocation(location);

            organization.locationId = locationId;
          }
        } else {
          const locationId = await this.locationStore.createLocation(location);

          organization.locationId = locationId;
        }
      }

      // =============================================================
      // Create / update
      // =============================================================

      if (editingId) {
        await this.organizationStore.updateOrganization(editingId, organization);

        this.toast.success('Organization updated successfully.');
      } else {
        await this.organizationStore.createOrganization(organization);

        this.toast.success('Organization created successfully.');
      }

      this.resetForm();
      this.view.set('list');
    } catch (error) {
      console.error('Failed to save organization:', error);

      const message = error instanceof Error ? error.message : 'Unable to save organization.';

      this.error.set(message);

      this.toast.error(`Unable to save organization: ${message}`);
    } finally {
      this.saving.set(false);
    }
  }

  // ===============================================================
  // Load organization memberships
  // ===============================================================

  private async loadMemberships(organizationId: string | null): Promise<void> {
    if (!organizationId) {
      this.memberships.set([]);
      return;
    }

    this.membershipLoading.set(true);
    this.membershipError.set(null);

    try {
      const memberships = await this.membershipService.getOrganizationMembers(organizationId);

      this.memberships.set(memberships);
    } catch (error) {
      console.error('Failed to load organization memberships:', error);

      this.memberships.set([]);

      this.membershipError.set('Unable to load organization members.');
    } finally {
      this.membershipLoading.set(false);
    }
  }

  // ===============================================================
  // Add member form
  // ===============================================================

  protected startAddMember(): void {
    if (!this.editingId()) {
      this.toast.error('Select an organization before adding members.');

      return;
    }

    this.selectedMemberUserId.set('');
    this.selectedMemberRole.set('org_member');
    this.membershipError.set(null);
    this.showMemberForm.set(true);
  }

  protected cancelAddMember(): void {
    this.showMemberForm.set(false);
    this.selectedMemberUserId.set('');
    this.selectedMemberRole.set('org_member');
    this.membershipError.set(null);
  }

  // ===============================================================
  // Add member
  // ===============================================================

  protected async addMember(): Promise<void> {
    if (this.membershipSaving()) {
      return;
    }

    const organizationId = this.editingId();

    const userId = this.selectedMemberUserId().trim();

    const role = this.selectedMemberRole();

    if (!organizationId) {
      this.toast.error('Select an organization before adding a member.');

      return;
    }

    if (!userId) {
      this.toast.error('Select a user.');

      return;
    }

    const alreadyMember = this.memberships().some((membership) => membership.userId === userId);

    if (alreadyMember) {
      this.toast.error('This user is already a member of the organization.');

      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.addMember(organizationId, userId, role);

      this.toast.success('Member added successfully.');

      this.showMemberForm.set(false);
      this.selectedMemberUserId.set('');
      this.selectedMemberRole.set('org_member');

      await this.loadMemberships(organizationId);
    } catch (error) {
      console.error('Failed to add organization member:', error);

      const message = error instanceof Error ? error.message : 'Unable to add organization member.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Update member role
  // ===============================================================

  protected async updateMemberRole(
    membership: OrganizationMembership,
    role: OrganizationMembershipRole,
  ): Promise<void> {
    if (this.membershipSaving() || membership.role === role) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.updateMemberRole(membership.id, role);

      this.memberships.update((members) =>
        members.map((item) =>
          item.id === membership.id
            ? {
                ...item,
                role,
              }
            : item,
        ),
      );

      this.toast.success('Member role updated.');
    } catch (error) {
      console.error('Failed to update member role:', error);

      const message = error instanceof Error ? error.message : 'Unable to update member role.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Update member active state
  // ===============================================================

  protected async updateMemberActive(
    membership: OrganizationMembership,
    active: boolean,
  ): Promise<void> {
    if (this.membershipSaving() || membership.active === active) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.setMemberActive(membership.id, active);

      this.memberships.update((members) =>
        members.map((item) =>
          item.id === membership.id
            ? {
                ...item,
                active,
              }
            : item,
        ),
      );

      this.toast.success(active ? 'Member activated.' : 'Member deactivated.');
    } catch (error) {
      console.error('Failed to update member status:', error);

      const message = error instanceof Error ? error.message : 'Unable to update member status.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Remove member
  // ===============================================================

  protected async removeMember(membership: OrganizationMembership): Promise<void> {
    if (this.membershipSaving()) {
      return;
    }

    const confirmed = window.confirm('Remove this user from the organization?');

    if (!confirmed) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.removeMember(membership.id);

      this.memberships.update((members) => members.filter((item) => item.id !== membership.id));

      this.toast.success('Member removed successfully.');
    } catch (error) {
      console.error('Failed to remove organization member:', error);

      const message =
        error instanceof Error ? error.message : 'Unable to remove organization member.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Edit organization
  // ===============================================================

  protected async editOrganization(organization: Organization): Promise<void> {
    this.error.set(null);

    this.view.set('form');
    this.scrollToTop();

    this.editingId.set(organization.id);

    this.form = {
      name: organization.name,
      slug: organization.slug,
      description: organization.description ?? '',
      website: organization.website ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',

      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',

      verified: organization.verified,
      active: organization.active,
    };

    // =============================================================
    // Load linked location
    // =============================================================

    if (organization.locationId) {
      try {
        const location = await this.locationStore.getLocation(organization.locationId);

        if (location) {
          this.form = {
            ...this.form,

            address: location.address ?? '',

            city: location.city ?? '',

            state: location.state ?? '',

            zipCode: location.zipCode ?? '',

            country: location.country || 'United States',
          };
        }
      } catch (error) {
        console.error('Failed to load organization location:', error);

        this.error.set('Unable to load the organization location.');
      }
    }

    // =============================================================
    // Load members
    // =============================================================

    await this.loadMemberships(organization.id);

    // =============================================================
    // Scroll to form
    // =============================================================

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ===============================================================
  // Cancel edit
  // ===============================================================

  protected cancelEdit(): void {
    this.resetForm();
    this.view.set('list');
  }

  // ===============================================================
  // Resolve organization lifecycle status
  // ===============================================================

  protected organizationStatus(organization: Organization): string {
    // Preserve compatibility with older organization records.
    return organization.status ?? (organization.active ? 'active' : 'suspended');
  }

  // ===============================================================
  // Determine whether an organization supports a lifecycle action
  // ===============================================================

  protected canPerformLifecycleAction(
    organization: Organization,
    action: OrganizationLifecycleAction,
  ): boolean {
    const status = this.organizationStatus(organization);

    switch (action) {
      case 'suspend':
      case 'archive':
        return status === 'active' || status === 'onboarding';

      case 'reactivate':
        return status === 'suspended';

      case 'restore':
        return status === 'archived';

      default:
        return false;
    }
  }

  // ===============================================================
  // Execute organization lifecycle action
  // ===============================================================

  protected async performLifecycleAction(
    organization: Organization,
    action: OrganizationLifecycleAction,
  ): Promise<void> {
    if (
      this.saving() ||
      this.lifecycleSavingId() !== null ||
      !this.canPerformLifecycleAction(organization, action)
    ) {
      return;
    }

    const actionLabels: Record<OrganizationLifecycleAction, string> = {
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      archive: 'Archive',
      restore: 'Restore',
    };

    const label = actionLabels[action];

    const confirmed = window.confirm(`${label} "${organization.name}"?`);

    if (!confirmed) {
      return;
    }

    const reasonPrompts: Record<OrganizationLifecycleAction, string> = {
      suspend: 'Why should this organization be suspended?',
      reactivate: 'Why should this organization be reactivated?',
      archive: 'Why should this organization be archived?',
      restore: 'Why should this organization be restored?',
    };

    const reason = window.prompt(reasonPrompts[action]);

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      this.toast.error('A reason is required for this operation.');
      return;
    }

    this.error.set(null);
    this.lifecycleSavingId.set(organization.id);

    try {
      const result = await this.organizationLifecycleService.transition(
        action,
        organization.id,
        reason.trim(),
      );

      this.toast.success(`${organization.name} is now ${result.status}.`);

      // Reload the authoritative organization records.
      await this.loadOrganizations();
    } catch (error) {
      console.error(`Failed to ${action} organization:`, error);

      const message = error instanceof Error ? error.message : `Unable to ${action} organization.`;

      this.error.set(message);
      this.toast.error(message);
    } finally {
      this.lifecycleSavingId.set(null);
    }
  }

  // ===============================================================
  // Delete organization
  // ===============================================================

  protected deleteOrganization(organization: Organization): void {
    this.toast.show(DeleteConfirmationComponent, {
      position: 'top-center',

      autoClose: false,
      dismissible: false,

      theme: 'toast',

      style: {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        padding: '20px',
        marginTop: '70px',
        background: '#FBF5DD',
        color: '#032D42',
      },

      data: {
        title: 'Delete organization?',

        message: `${organization.name} will be permanently deleted.`,

        onConfirm: async () => {
          await this.confirmDeleteOrganization(organization);
        },
      },
    });
  }

  // ===============================================================
  // Confirm organization deletion
  // ===============================================================

  private async confirmDeleteOrganization(organization: Organization): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.error.set(null);
    this.saving.set(true);

    try {
      await this.organizationStore.deleteOrganization(organization.id);

      if (organization.locationId) {
        await this.locationStore.deleteLocation(organization.locationId);
      }

      if (this.editingId() === organization.id) {
        this.resetForm();
      }

      this.toast.success('Organization deleted successfully.');
    } catch (error) {
      console.error('Failed to delete organization:', error);

      this.error.set('Unable to delete organization. Please try again.');

      this.toast.error('Unable to delete organization. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  // ===============================================================
  // Reset form
  // ===============================================================

  private resetForm(): void {
    this.editingId.set(null);

    this.error.set(null);

    this.memberships.set([]);

    this.showMemberForm.set(false);

    this.selectedMemberUserId.set('');

    this.selectedMemberRole.set('org_member');

    this.membershipError.set(null);

    this.form = {
      name: '',
      slug: '',
      description: '',
      website: '',
      phone: '',
      email: '',

      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',

      verified: false,
      active: true,
    };
  }

  // ===============================================================
  // Generate slug
  // ===============================================================

  protected generateSlug(): void {
    if (this.editingId()) {
      return;
    }

    this.form.slug = this.form.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ===============================================================
  // User helpers
  // ===============================================================

  protected getUserName(userId: string): string {
    const user = this.userStore.users().find((item) => item.id === userId);

    if (!user) {
      return userId;
    }

    return (
      user.displayName ||
      user.preferredName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      userId
    );
  }

  protected getUserEmail(userId: string): string {
    const user = this.userStore.users().find((item) => item.id === userId);

    return user?.email ?? '';
  }

  protected async repairHiveProvisioning(): Promise<void> {
  const requestId = 'kNotqjjwpX3crMqbpziU';

  const confirmed = window.confirm(
    'Repair Hive provisioning? This will create the missing Core entitlement ' +
    'and provision Core and Community. Test Center will not be provisioned.'
  );

  if (!confirmed) {
    return;
  }

  this.provisioningRepairing.set(true);

  try {
    const result =
      await this.organizationLifecycleService.repairApplicationProvisioning(
        requestId
      );

    console.log('Hive provisioning recovery result:', result);

    this.toast.success(
      'Hive provisioning recovery completed successfully.'
    );
  } catch (error) {
    console.error('Hive provisioning recovery failed:', error);

    this.toast.error(
      error instanceof Error
        ? error.message
        : 'Hive provisioning recovery failed. Check the console for details.'
    );
  } finally {
    this.provisioningRepairing.set(false);
  }
}
}

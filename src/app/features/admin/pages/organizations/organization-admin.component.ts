import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';

import { Organization } from '../../../../core/models/organization.model';
import { OrganizationMembership } from '../../../../core/models/organization-membership.model';
import { OrganizationMembershipRole } from '../../../../core/models/organization-membership.model';
import { Location } from '../../../../core/models/location.model';

import { OrganizationMembershipService } from '../../../../core/services/organization-membership.service';

import { OrganizationStore } from '../../../organizations/stores/organization.store';
import { LocationStore } from '../../../locations/stores/location.store';
import { UserStore } from '../../../users/stores/user.store';

@Component({
  selector: 'app-organization-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">

      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="border-b border-gray-200 bg-[#032D42]">
        <div
          class="mx-auto flex max-w-7xl items-center
                 justify-between gap-4 px-4 py-4
                 sm:px-6 lg:px-8"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-wider text-[#7ED6D1]"
            >
              Administration
            </p>

            <h1
              class="text-xl font-bold text-white
                     sm:text-3xl"
            >
              Organization
            </h1>

            <p class="mt-1 text-sm text-white/80">
              Create and manage organizations associated
              with Zebron resources.
            </p>
          </div>

          <a
            routerLink="/admin"
            class="shrink-0 rounded-lg border
                   border-gray-300 bg-white px-3 py-2
                   text-sm font-semibold text-gray-700
                   hover:border-[#032D42]
                   hover:text-[#032D42]"
          >
            Admin Dashboard
          </a>
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

            <div class="lg:col-span-2 p-4 sm:p-6">

              <div
                class="flex flex-col gap-1
                       border-b border-gray-200 pb-5"
              >
                <p
                  class="text-xs font-semibold uppercase
                         tracking-wide text-[#007979]"
                >
                  {{
                    editingId()
                      ? 'Edit organization'
                      : 'New organization'
                  }}
                </p>

                <h2
                  class="text-xl font-semibold text-[#032D42]"
                >
                  {{
                    editingId()
                      ? 'Update organization'
                      : 'Create organization'
                  }}
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

              <form
                class="mt-6 space-y-7"
                (ngSubmit)="saveOrganization()"
              >

                <!-- =================================================
                     BASIC INFORMATION
                     ================================================= -->

                <section>
                  <div class="mb-4">
                    <h3
                      class="text-sm font-semibold text-gray-900"
                    >
                      Basic information
                    </h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Core information used to identify
                      the organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">

                    <!-- Name -->

                    <div class="sm:col-span-2">
                      <label
                        for="name"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Organization name
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        [(ngModel)]="form.name"
                        (ngModelChange)="generateSlug()"
                        required
                        placeholder="Maryland Food Bank"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm text-gray-900
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- Slug -->

                    <div class="sm:col-span-2">
                      <label
                        for="slug"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Slug
                      </label>

                      <input
                        id="slug"
                        name="slug"
                        type="text"
                        [(ngModel)]="form.slug"
                        required
                        placeholder="maryland-food-bank"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm text-gray-700
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />

                      <p
                        class="mt-1.5 text-xs text-gray-500"
                      >
                        Automatically generated from the
                        organization name.
                      </p>
                    </div>

                    <!-- Description -->

                    <div class="sm:col-span-2">
                      <label
                        for="description"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Description
                      </label>

                      <textarea
                        id="description"
                        name="description"
                        rows="4"
                        [(ngModel)]="form.description"
                        placeholder="Describe the organization and the services it provides."
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm text-gray-900
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      ></textarea>
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     CONTACT INFORMATION
                     ================================================= -->

                <section
                  class="border-t border-gray-200 pt-6"
                >
                  <div class="mb-4">
                    <h3
                      class="text-sm font-semibold text-gray-900"
                    >
                      Contact information
                    </h3>

                    <p class="mt-1 text-xs text-gray-500">
                      Optional ways users can contact the
                      organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">

                    <!-- Website -->

                    <div>
                      <label
                        for="website"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Website
                      </label>

                      <input
                        id="website"
                        name="website"
                        type="url"
                        [(ngModel)]="form.website"
                        placeholder="https://example.org"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- Phone -->

                    <div>
                      <label
                        for="phone"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Phone
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        [(ngModel)]="form.phone"
                        placeholder="301-555-1234"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- Email -->

                    <div class="sm:col-span-2">
                      <label
                        for="email"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        [(ngModel)]="form.email"
                        placeholder="info@example.org"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     LOCATION
                     ================================================= -->

                <section
                  class="border-t border-gray-200 pt-6"
                >
                  <div class="mb-4">
                    <h3
                      class="text-sm font-semibold text-gray-900"
                    >
                      Location
                    </h3>

                    <p class="mt-1 text-xs text-gray-500">
                      The location is stored separately in the
                      <code>locations</code> collection and
                      linked to this organization.
                    </p>
                  </div>

                  <div class="grid gap-5 sm:grid-cols-2">

                    <!-- Address -->

                    <div class="sm:col-span-2">
                      <label
                        for="address"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Street address
                      </label>

                      <input
                        id="address"
                        name="address"
                        type="text"
                        [(ngModel)]="form.address"
                        placeholder="123 Main Street"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- City -->

                    <div>
                      <label
                        for="city"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        City
                      </label>

                      <input
                        id="city"
                        name="city"
                        type="text"
                        [(ngModel)]="form.city"
                        placeholder="Baltimore"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- State -->

                    <div>
                      <label
                        for="state"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        State
                      </label>

                      <input
                        id="state"
                        name="state"
                        type="text"
                        maxlength="2"
                        [(ngModel)]="form.state"
                        placeholder="MD"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm uppercase
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- ZIP -->

                    <div>
                      <label
                        for="zipCode"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        ZIP code
                      </label>

                      <input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        [(ngModel)]="form.zipCode"
                        placeholder="21201"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>

                    <!-- Country -->

                    <div>
                      <label
                        for="country"
                        class="block text-sm font-medium
                               text-gray-700"
                      >
                        Country
                      </label>

                      <input
                        id="country"
                        name="country"
                        type="text"
                        [(ngModel)]="form.country"
                        placeholder="United States"
                        class="mt-1 block w-full rounded-lg
                               border border-gray-300
                               bg-gray-50 px-4 py-2.5
                               text-sm
                               placeholder:text-gray-400
                               focus:border-[#007979]
                               focus:bg-white
                               focus:outline-none
                               focus:ring-2
                               focus:ring-[#007979]/20"
                      />
                    </div>
                  </div>
                </section>

                <!-- =================================================
                     STATUS
                     ================================================= -->

                <section
                  class="border-t border-gray-200 pt-6"
                >
                  <div class="mb-4">
                    <h3
                      class="text-sm font-semibold text-gray-900"
                    >
                      Status
                    </h3>
                  </div>

                  <div class="flex flex-wrap gap-6">

                    <label
                      class="flex cursor-pointer
                             items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        name="verified"
                        [(ngModel)]="form.verified"
                        class="h-4 w-4 rounded
                               border-gray-300
                               text-[#007979]
                               focus:ring-[#007979]"
                      />

                      <span class="text-sm text-gray-700">
                        Verified organization
                      </span>
                    </label>

                    <label
                      class="flex cursor-pointer
                             items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        name="active"
                        [(ngModel)]="form.active"
                        class="h-4 w-4 rounded
                               border-gray-300
                               text-[#007979]
                               focus:ring-[#007979]"
                      />

                      <span class="text-sm text-gray-700">
                        Active organization
                      </span>
                    </label>
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

                  @if (editingId()) {
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

            <!-- ===================================================
                 EXISTING ORGANIZATIONS
                 =================================================== -->

            <aside
              class="border-t border-gray-200
                     bg-gray-50/60
                     lg:border-l lg:border-t-0"
            >
              <div class="p-6 sm:p-8">

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

                    <p
                      class="mt-1 text-sm text-gray-500"
                    >
                      Select an organization to edit or
                      delete it.
                    </p>
                  </div>

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

                <!-- Loading -->

                @if (loading()) {
                  <div
                    class="mt-6 rounded-xl border
                           border-gray-200 bg-white p-5"
                  >
                    <p class="text-sm text-gray-500">
                      Loading organizations...
                    </p>
                  </div>
                }

                <!-- Empty -->

                @if (
                  !loading() &&
                  organizations().length === 0
                ) {
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

                    <p
                      class="mt-1 text-xs text-gray-500"
                    >
                      Create the first organization using
                      the form.
                    </p>
                  </div>
                }

                <!-- Organization list -->

                @if (organizations().length > 0) {
                  <div
                    class="mt-6 overflow-hidden rounded-xl
                           border border-gray-200
                           bg-white shadow-sm"
                  >
                    @for (
                      organization of organizations();
                      track organization.id
                    ) {
                      <div
                        class="border-b border-gray-200
                               p-4 last:border-b-0"
                      >

                        <div
                          class="flex items-start
                                 justify-between gap-3"
                        >
                          <div class="min-w-0">
                            <h3
                              class="truncate text-sm
                                     font-semibold
                                     text-gray-900"
                            >
                              {{ organization.name }}
                            </h3>

                            <p
                              class="mt-1 truncate
                                     text-xs text-gray-500"
                            >
                              {{ organization.slug }}
                            </p>
                          </div>

                          <span
                            class="shrink-0 rounded-full
                                   px-2 py-1 text-xs
                                   font-medium"
                            [class.bg-green-100]="
                              organization.active
                            "
                            [class.text-green-700]="
                              organization.active
                            "
                            [class.bg-gray-100]="
                              !organization.active
                            "
                            [class.text-gray-600]="
                              !organization.active
                            "
                          >
                            {{
                              organization.active
                                ? 'Active'
                                : 'Inactive'
                            }}
                          </span>
                        </div>

                        @if (organization.description) {
                          <p
                            class="mt-3 line-clamp-2
                                   text-sm leading-5
                                   text-gray-600"
                          >
                            {{ organization.description }}
                          </p>
                        }

                        <div
                          class="mt-4 flex items-center
                                 justify-between gap-3"
                        >
                          <div class="shrink-0">
                            @if (organization.verified) {
                              <span
                                class="inline-flex
                                       rounded-full
                                       bg-[#007979]/10
                                       px-2.5 py-1
                                       text-xs font-medium
                                       text-[#007979]"
                              >
                                Verified
                              </span>
                            } @else {
                              <span
                                class="inline-flex
                                       rounded-full
                                       bg-gray-100
                                       px-2.5 py-1
                                       text-xs font-medium
                                       text-gray-500"
                              >
                                Not verified
                              </span>
                            }
                          </div>

                          <div
                            class="flex shrink-0 gap-1.5"
                          >
                            <button
                              type="button"
                              (click)="
                                editOrganization(
                                  organization
                                )
                              "
                              [disabled]="saving()"
                              class="rounded-md border
                                     border-gray-300
                                     bg-white px-2.5 py-1.5
                                     text-xs font-medium
                                     text-gray-700
                                     transition
                                     hover:border-[#007979]/40
                                     hover:bg-[#007979]/5
                                     disabled:opacity-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              (click)="
                                deleteOrganization(
                                  organization
                                )
                              "
                              [disabled]="saving()"
                              class="rounded-md border
                                     border-red-200
                                     bg-white px-2.5 py-1.5
                                     text-xs font-medium
                                     text-red-600
                                     transition
                                     hover:bg-red-50
                                     disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </aside>
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

                <p
                  class="mt-1 text-sm text-gray-500"
                >
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

                  <p
                    class="mt-1 text-xs text-gray-500"
                  >
                    Select an existing Zebron user and
                    assign their organization role.
                  </p>
                </div>

                <div
                  class="grid gap-4
                         md:grid-cols-[minmax(0,1fr)_220px_auto]"
                >

                  <!-- User -->

                  <div>
                    <label
                      for="memberUser"
                      class="mb-1.5 block
                             text-sm font-medium
                             text-gray-700"
                    >
                      User
                    </label>

                    <select
                      id="memberUser"
                      name="memberUser"
                      [ngModel]="selectedMemberUserId()"
                      (ngModelChange)="
                        selectedMemberUserId.set($event)
                      "
                      class="w-full rounded-lg
                             border border-gray-300
                             bg-white px-3 py-2.5
                             text-sm text-gray-900
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    >
                      <option value="">
                        Select a user
                      </option>

                      @for (
                        user of userStore.users();
                        track user.id
                      ) {
                        <option [value]="user.id">
                          {{
                            user.displayName ||
                            user.preferredName ||
                            user.email ||
                            user.id
                          }}
                          @if (user.email) {
                            — {{ user.email }}
                          }
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Role -->

                  <div>
                    <label
                      for="memberRole"
                      class="mb-1.5 block
                             text-sm font-medium
                             text-gray-700"
                    >
                      Role
                    </label>

                    <select
                      id="memberRole"
                      name="memberRole"
                      [ngModel]="selectedMemberRole()"
                      (ngModelChange)="
                        selectedMemberRole.set($event)
                      "
                      class="w-full rounded-lg
                             border border-gray-300
                             bg-white px-3 py-2.5
                             text-sm text-gray-900
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2
                             focus:ring-[#007979]/20"
                    >
                      @for (
                        role of membershipRoles;
                        track role
                      ) {
                        <option [value]="role">
                          {{ role | titlecase }}
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Actions -->

                  <div
                    class="flex items-end gap-2"
                  >
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
                      {{
                        membershipSaving()
                          ? 'Adding...'
                          : 'Add'
                      }}
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
                  <p
                    class="text-sm text-gray-500"
                  >
                    Loading members...
                  </p>
                </div>
              }

              @else if (
                !membershipLoading() &&
                memberships().length === 0
              ) {
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
                    Add a user to give them access
                    to organization resources.
                  </p>
                </div>
              }

              @else {
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

                  @for (
                    membership of memberships();
                    track membership.id
                  ) {
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
                          {{
                            getUserName(
                              membership.userId
                            )
                          }}
                        </p>

                        <p
                          class="mt-1 truncate
                                 text-xs text-gray-500"
                        >
                          {{
                            getUserEmail(
                              membership.userId
                            )
                          }}
                        </p>
                      </div>

                      <!-- Role -->

                      <div>
                        <select
                          [ngModel]="membership.role"
                          (ngModelChange)="
                            updateMemberRole(
                              membership,
                              $event
                            )
                          "
                          [disabled]="membershipSaving()"
                          class="w-full rounded-lg
                                 border border-gray-300
                                 bg-white px-2.5 py-2
                                 text-sm text-gray-700
                                 focus:border-[#007979]
                                 focus:outline-none"
                        >
                          @for (
                            role of membershipRoles;
                            track role
                          ) {
                            <option [value]="role">
                              {{ role | titlecase }}
                            </option>
                          }
                        </select>
                      </div>

                      <!-- Status -->

                      <div>
                        <button
                          type="button"
                          (click)="
                            updateMemberActive(
                              membership,
                              !membership.active
                            )
                          "
                          [disabled]="membershipSaving()"
                          class="rounded-full
                                 px-2.5 py-1
                                 text-xs font-medium
                                 transition"
                          [class.bg-green-100]="
                            membership.active
                          "
                          [class.text-green-700]="
                            membership.active
                          "
                          [class.bg-gray-100]="
                            !membership.active
                          "
                          [class.text-gray-600]="
                            !membership.active
                          "
                        >
                          {{
                            membership.active
                              ? 'Active'
                              : 'Inactive'
                          }}
                        </button>
                      </div>

                      <!-- Remove -->

                      <div
                        class="flex justify-start
                               md:justify-end"
                      >
                        <button
                          type="button"
                          (click)="
                            removeMember(
                              membership
                            )
                          "
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

  private readonly locationStore =
    inject(LocationStore);

  private readonly toast =
    inject(HotToastService);

  private readonly membershipService =
    inject(OrganizationMembershipService);

  protected readonly organizationStore =
    inject(OrganizationStore);

  protected readonly userStore =
    inject(UserStore);

  // ===============================================================
  // Organization state
  // ===============================================================

  protected readonly organizations =
    this.organizationStore.organizations;

  protected readonly loading =
    this.organizationStore.loading;

  protected readonly storeError =
    this.organizationStore.error;

  protected readonly error =
    signal<string | null>(null);

  // ===============================================================
  // Membership state
  // ===============================================================

  protected readonly memberships =
    signal<OrganizationMembership[]>([]);

  protected readonly membershipLoading =
    signal(false);

  protected readonly membershipSaving =
    signal(false);

  protected readonly membershipError =
    signal<string | null>(null);

  protected readonly showMemberForm =
    signal(false);

  protected readonly selectedMemberUserId =
    signal('');

  protected readonly selectedMemberRole =
  signal<OrganizationMembershipRole>('org_member');

protected readonly membershipRoles:
  OrganizationMembershipRole[] = [
    'org_owner',
    'org_admin',
    'org_manager',
    'org_staff',
    'org_member',
  ];

  // ===============================================================
  // Local UI state
  // ===============================================================

  protected readonly saving =
    signal(false);

  protected readonly editingId =
    signal<string | null>(null);

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

  ngOnInit(): void {
    void this.loadOrganizations();
    void this.loadUsers();
  }

  // ===============================================================
  // Load organizations
  // ===============================================================

  private async loadOrganizations(): Promise<void> {
    try {
      await this.organizationStore.loadOrganizations();
    } catch (error) {
      console.error(
        'Failed to load organizations:',
        error,
      );

      this.error.set(
        'Unable to load organizations.',
      );
    }
  }

  // ===============================================================
  // Load users
  // ===============================================================

  private async loadUsers(): Promise<void> {
    try {
      await this.userStore.loadUsers();
    } catch (error) {
      console.error(
        'Failed to load users:',
        error,
      );
    }
  }

  // ===============================================================
  // Save organization
  // ===============================================================

  protected async saveOrganization(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const name =
      this.form.name?.trim() || '';

    const slug =
      this.form.slug?.trim().toLowerCase() || '';

    if (!name) {
      this.toast.error(
        'Organization name is required.',
      );

      return;
    }

    if (!slug) {
      this.toast.error(
        'Organization slug is required.',
      );

      return;
    }

    const description =
      this.form.description?.trim() || '';

    const website =
      this.form.website?.trim() || '';

    const phone =
      this.form.phone?.trim() || '';

    const email =
      this.form.email?.trim() || '';

    const address =
      this.form.address?.trim() || '';

    const city =
      this.form.city?.trim() || '';

    const state =
      this.form.state?.trim().toUpperCase() || '';

    const zipCode =
      this.form.zipCode?.trim() || '';

    const country =
      this.form.country?.trim() || '';

    const hasLocation =
      !!(
        address ||
        city ||
        state ||
        zipCode ||
        country
      );

    if (hasLocation && !country) {
      this.toast.error(
        'Country is required for a location.',
      );

      return;
    }

    const normalizedCountry =
      country.toLowerCase();

    const isUnitedStates =
      normalizedCountry === 'united states' ||
      normalizedCountry === 'usa' ||
      normalizedCountry === 'us';

    if (hasLocation && !address) {
      this.toast.error(
        'Street address is required when adding a location.',
      );

      return;
    }

    if (hasLocation && !city) {
      this.toast.error(
        'City is required when adding a location.',
      );

      return;
    }

    if (
      hasLocation &&
      isUnitedStates &&
      !state
    ) {
      this.toast.error(
        'State is required for United States locations.',
      );

      return;
    }

    if (
      hasLocation &&
      isUnitedStates &&
      !zipCode
    ) {
      this.toast.error(
        'ZIP code is required for United States locations.',
      );

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const editingId =
      this.editingId();

    try {
      const organization:
        Omit<
          Organization,
          'id' | 'createdAt' | 'updatedAt'
        > = {
        name,
        slug,
        verified: this.form.verified,
        active: this.form.active,
      };

      if (description) {
        organization.description =
          description;
      }

      if (website) {
        organization.website =
          website;
      }

      if (phone) {
        organization.phone =
          phone;
      }

      if (email) {
        organization.email =
          email;
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
          const existingOrganization =
            this.organizations().find(
              (item) =>
                item.id === editingId,
            );

          if (
            existingOrganization?.locationId
          ) {
            await this.locationStore.updateLocation(
              existingOrganization.locationId,
              location,
            );

            organization.locationId =
              existingOrganization.locationId;
          } else {
            const locationId =
              await this.locationStore.createLocation(
                location,
              );

            organization.locationId =
              locationId;
          }
        } else {
          const locationId =
            await this.locationStore.createLocation(
              location,
            );

          organization.locationId =
            locationId;
        }
      }

      // =============================================================
      // Create / update
      // =============================================================

      if (editingId) {
        await this.organizationStore.updateOrganization(
          editingId,
          organization,
        );

        this.toast.success(
          'Organization updated successfully.',
        );
      } else {
        await this.organizationStore.createOrganization(
          organization,
        );

        this.toast.success(
          'Organization created successfully.',
        );
      }

      this.resetForm();
    } catch (error) {
      console.error(
        'Failed to save organization:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save organization.';

      this.error.set(message);

      this.toast.error(
        `Unable to save organization: ${message}`,
      );
    } finally {
      this.saving.set(false);
    }
  }

  // ===============================================================
  // Load organization memberships
  // ===============================================================

  private async loadMemberships(
    organizationId: string | null,
  ): Promise<void> {
    if (!organizationId) {
      this.memberships.set([]);
      return;
    }

    this.membershipLoading.set(true);
    this.membershipError.set(null);

    try {
      const memberships =
        await this.membershipService
          .getOrganizationMembers(
            organizationId,
          );

      this.memberships.set(
        memberships,
      );
    } catch (error) {
      console.error(
        'Failed to load organization memberships:',
        error,
      );

      this.memberships.set([]);

      this.membershipError.set(
        'Unable to load organization members.',
      );
    } finally {
      this.membershipLoading.set(false);
    }
  }

  // ===============================================================
  // Add member form
  // ===============================================================

  protected startAddMember(): void {
    if (!this.editingId()) {
      this.toast.error(
        'Select an organization before adding members.',
      );

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

    const organizationId =
      this.editingId();

    const userId =
      this.selectedMemberUserId().trim();

    const role =
      this.selectedMemberRole();

    if (!organizationId) {
      this.toast.error(
        'Select an organization before adding a member.',
      );

      return;
    }

    if (!userId) {
      this.toast.error(
        'Select a user.',
      );

      return;
    }

    const alreadyMember =
      this.memberships().some(
        (membership) =>
          membership.userId === userId,
      );

    if (alreadyMember) {
      this.toast.error(
        'This user is already a member of the organization.',
      );

      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.addMember(
        organizationId,
        userId,
        role,
      );

      this.toast.success(
        'Member added successfully.',
      );

      this.showMemberForm.set(false);
      this.selectedMemberUserId.set('');
      this.selectedMemberRole.set('org_member');

      await this.loadMemberships(
        organizationId,
      );
    } catch (error) {
      console.error(
        'Failed to add organization member:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to add organization member.';

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
    if (
      this.membershipSaving() ||
      membership.role === role
    ) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.updateMemberRole(
        membership.id,
        role,
      );

      this.memberships.update(
        (members) =>
          members.map((item) =>
            item.id === membership.id
              ? {
                  ...item,
                  role,
                }
              : item,
          ),
      );

      this.toast.success(
        'Member role updated.',
      );
    } catch (error) {
      console.error(
        'Failed to update member role:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update member role.';

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
    if (
      this.membershipSaving() ||
      membership.active === active
    ) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.setMemberActive(
        membership.id,
        active,
      );

      this.memberships.update(
        (members) =>
          members.map((item) =>
            item.id === membership.id
              ? {
                  ...item,
                  active,
                }
              : item,
          ),
      );

      this.toast.success(
        active
          ? 'Member activated.'
          : 'Member deactivated.',
      );
    } catch (error) {
      console.error(
        'Failed to update member status:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update member status.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Remove member
  // ===============================================================

  protected async removeMember(
    membership: OrganizationMembership,
  ): Promise<void> {
    if (this.membershipSaving()) {
      return;
    }

    const confirmed = window.confirm(
      'Remove this user from the organization?',
    );

    if (!confirmed) {
      return;
    }

    this.membershipSaving.set(true);
    this.membershipError.set(null);

    try {
      await this.membershipService.removeMember(
        membership.id,
      );

      this.memberships.update(
        (members) =>
          members.filter(
            (item) =>
              item.id !== membership.id,
          ),
      );

      this.toast.success(
        'Member removed successfully.',
      );
    } catch (error) {
      console.error(
        'Failed to remove organization member:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to remove organization member.';

      this.membershipError.set(message);
      this.toast.error(message);
    } finally {
      this.membershipSaving.set(false);
    }
  }

  // ===============================================================
  // Edit organization
  // ===============================================================

  protected async editOrganization(
    organization: Organization,
  ): Promise<void> {
    this.error.set(null);

    this.editingId.set(
      organization.id,
    );

    this.form = {
      name: organization.name,
      slug: organization.slug,
      description:
        organization.description ?? '',
      website:
        organization.website ?? '',
      phone:
        organization.phone ?? '',
      email:
        organization.email ?? '',

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
        const location =
          await this.locationStore.getLocation(
            organization.locationId,
          );

        if (location) {
          this.form = {
            ...this.form,

            address:
              location.address ?? '',

            city:
              location.city ?? '',

            state:
              location.state ?? '',

            zipCode:
              location.zipCode ?? '',

            country:
              location.country ||
              'United States',
          };
        }
      } catch (error) {
        console.error(
          'Failed to load organization location:',
          error,
        );

        this.error.set(
          'Unable to load the organization location.',
        );
      }
    }

    // =============================================================
    // Load members
    // =============================================================

    await this.loadMemberships(
      organization.id,
    );

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
  }

  // ===============================================================
  // Delete organization
  // ===============================================================

  protected deleteOrganization(
    organization: Organization,
  ): void {
    this.toast.show(
      DeleteConfirmationComponent,
      {
        position: 'top-center',

        autoClose: false,
        dismissible: false,

        theme: 'toast',

        style: {
          width: '360px',
          maxWidth:
            'calc(100vw - 32px)',
          padding: '20px',
          marginTop: '70px',
          background: '#FBF5DD',
          color: '#032D42',
        },

        data: {
          title: 'Delete organization?',

          message:
            `${organization.name} will be permanently deleted.`,

          onConfirm: async () => {
            await this.confirmDeleteOrganization(
              organization,
            );
          },
        },
      },
    );
  }

  // ===============================================================
  // Confirm organization deletion
  // ===============================================================

  private async confirmDeleteOrganization(
    organization: Organization,
  ): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.error.set(null);
    this.saving.set(true);

    try {
      await this.organizationStore.deleteOrganization(
        organization.id,
      );

      if (organization.locationId) {
        await this.locationStore.deleteLocation(
          organization.locationId,
        );
      }

      if (
        this.editingId() ===
        organization.id
      ) {
        this.resetForm();
      }

      this.toast.success(
        'Organization deleted successfully.',
      );
    } catch (error) {
      console.error(
        'Failed to delete organization:',
        error,
      );

      this.error.set(
        'Unable to delete organization. Please try again.',
      );

      this.toast.error(
        'Unable to delete organization. Please try again.',
      );
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

    this.selectedMemberRole.set(
      'org_member',
    );

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

    this.form.slug =
      this.form.name
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '');
  }

  // ===============================================================
  // User helpers
  // ===============================================================

  protected getUserName(
    userId: string,
  ): string {
    const user =
      this.userStore
        .users()
        .find(
          (item) =>
            item.id === userId,
        );

    if (!user) {
      return userId;
    }

    return (
      user.displayName ||
      user.preferredName ||
      [
        user.firstName,
        user.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      user.email ||
      userId
    );
  }

  protected getUserEmail(
    userId: string,
  ): string {
    const user =
      this.userStore
        .users()
        .find(
          (item) =>
            item.id === userId,
        );

    return user?.email ?? '';
  }
}
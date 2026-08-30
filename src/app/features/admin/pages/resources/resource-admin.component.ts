import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Resource, ResourceStatus } from '../../../../core/models/resource.model';
import { ResourceType } from '../../../../core/models/resource-type.model';
import { Category } from '../../../../core/models/category.model';
import { Location } from '../../../../core/models/location.model';

import { ResourceStore } from '../../../resources/stores/resource.store';
import { CategoryStore } from '../../../categories/stores/category.store';
import { LocationStore } from '../../../locations/stores/location.store';
import { ResourceTypeStore } from '../../../resource-types/stores/resource-type.store';
import { AuthService } from '../../../../core/services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

import { DeleteConfirmationComponent } from '../../../../shared/components/delete-confirmation/delete-confirmation';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-resource-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, MatDividerModule, MatMenuModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <!-- <div class="mb-2">
        <a routerLink="/admin" class="text-sm text-gray-600 transition hover:text-gray-900">
          ← Admin Dashboard
        </a>
      </div> -->
      <header class="border-b border-gray-200 bg-[#032D42]">
        <div
          class="mx-auto flex max-w-7xl items-center
                 justify-between gap-4 px-4 py-4
                 sm:px-6 lg:px-8 "
        >
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wider
             text-[#7ED6D1]"
            >
              Resoucrce management
            </p>
            <h1
              class="text-xl font-bold text-white
                     sm:text-3xl"
            >
              Resources
            </h1>

            <p class="mt-1 text-sm text-white/80">
              Create and manage resources in the Zebron database.
            </p>
          </div>

          <!-- =====================================================
     Admin Header Actions
     Desktop:
       Admin Dashboard + 3-dot menu

     Mobile:
       3-dot menu only
     ===================================================== -->
          <div
            class="flex shrink-0
         items-center
         gap-2"
          >
            <!-- Admin Dashboard
       Hidden on mobile -->
            <a
              routerLink="/admin"
              class="hidden
           rounded-lg
           border border-gray-300
           bg-white
           px-3 py-2
           text-sm
           font-semibold
           text-gray-700
           transition
           hover:border-[#032D42]
           hover:text-[#032D42]
           sm:inline-flex"
            >
              Admin Dashboard
            </a>

            <!-- =====================================================
       Admin Navigation Menu
       ===================================================== -->
            <button
              type="button"
              [matMenuTriggerFor]="adminMenu"
              aria-label="Open navigation menu"
              class="flex
           h-10
           w-10
           shrink-0
           items-center
           justify-center
           rounded-full
           text-white
           transition
           hover:bg-white/10
           focus:outline-none
           focus:ring-2
           focus:ring-white/30"
            >
              <mat-icon aria-hidden="true" class="!m-0 !h-6 !w-6 !text-[26px]">
                more_vert
              </mat-icon>
            </button>
          </div>

          <mat-menu #adminMenu="matMenu" xPosition="before" yPosition="below">
            <!-- Home -->
            <button mat-menu-item routerLink="/">
              <mat-icon>home</mat-icon>
              <span>Home</span>
            </button>

            <!-- Dashboard -->
            <button mat-menu-item routerLink="/admin">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </button>

            <!-- Categories -->
            <button mat-menu-item routerLink="/admin/categories">
              <mat-icon>category</mat-icon>
              <span>Categories</span>
            </button>

            <!-- Submissions -->
            <button mat-menu-item routerLink="/admin/submissions">
              <mat-icon>assignment</mat-icon>
              <span>Submissions</span>
            </button>

            <!-- Users -->
            <button mat-menu-item routerLink="/admin/users">
              <mat-icon>group</mat-icon>
              <span>Users</span>
            </button>

            <!-- Resource Types -->
            <button mat-menu-item routerLink="/admin/resource-types">
              <mat-icon>list_alt</mat-icon>
              <span>Resource Types</span>
            </button>

            <!-- Locations -->
            <button mat-menu-item routerLink="/admin/locations">
              <mat-icon>location_on</mat-icon>
              <span>Locations</span>
            </button>

            <!-- Mailbox -->
            <button mat-menu-item routerLink="/admin/contact">
              <mat-icon>mail</mat-icon>
              <span>Mailbox</span>
            </button>

            <mat-divider></mat-divider>

            <!-- Sign out -->
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <main
        class="mx-auto max-w-7xl px-4 py-2
               sm:px-6 lg:px-8"
      >
        <!-- Resource management -->
        <section class="mt-2">
          <div class="grid items-start gap-6 lg:grid-cols-3">
            <!-- =======================================================
           Resource form
           ======================================================= -->
            <div class="lg:col-span-2">
              <div
                class="overflow-hidden rounded-2xl border
                 border-gray-200 bg-white shadow-sm"
              >
                <!-- Form header -->
                <div
                  class="border-b border-gray-200 bg-gray-50
         px-6 py-2"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase
               tracking-wider text-[#007979]"
                      >
                        Resource details
                      </p>

                      <h2 class="mt-1 text-xl font-semibold text-[#032D42]">
                        {{ editingId() ? 'Edit resource' : 'Create resource' }}
                      </h2>

                      <p class="mt-1 text-sm text-gray-500">
                        {{
                          editingId()
                            ? 'Update the resource information below.'
                            : 'Add a resource that users can discover through Zebron.'
                        }}
                      </p>
                    </div>

                    <!-- =====================================================
         EDIT MODE
         ===================================================== -->
                    @if (editingId()) {
                      <div
                        class="flex shrink-0
               flex-col
               items-stretch
               gap-1.5
               sm:flex-row
               sm:items-center"
                      >
                        <!-- Cancel -->
                        <button
                          type="button"
                          (click)="cancelEdit()"
                          [disabled]="saving()"
                          class="rounded-md
                 border border-gray-300
                 bg-white
                 px-2.5 py-1
                 text-[11px]
                 font-medium
                 text-gray-700
                 transition
                 hover:border-[#007979]/40
                 hover:bg-[#007979]/5
                 focus:outline-none
                 focus:ring-2
                 focus:ring-[#007979]/20
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <!-- Update -->
                        <button
                          type="submit"
                          form="resourceForm"
                          [disabled]="saving()"
                          class="rounded-md
                 bg-[#007979]
                 px-2.5 py-1
                 text-[11px]
                 font-semibold
                 text-white
                 transition
                 hover:bg-[#032D42]/90
                 focus:outline-none
                 focus:ring-2
                 focus:ring-[#032D42]/30
                 disabled:cursor-not-allowed
                 disabled:opacity-50"
                        >
                          {{ saving() ? 'Saving...' : 'Update' }}
                        </button>

                        <!-- Editing indicator -->
                        <span
                          class="hidden
                 rounded-full
                 bg-[#007979]/10
                 px-2.5 py-1
                 text-[11px]
                 font-semibold
                 text-[#007979]
                 sm:inline-flex"
                        >
                          Editing
                        </span>
                      </div>
                    }

                    <!-- =====================================================
         CREATE MODE
         ===================================================== -->
                    @if (!editingId()) {
                      <button
                        type="button"
                        (click)="toggleNewResourceForm()"
                        [attr.aria-expanded]="showNewResourceForm()"
                        [attr.aria-label]="
                          showNewResourceForm() ? 'Hide resource form' : 'Show resource form'
                        "
                        class="inline-flex
               shrink-0
               items-center
               gap-1
               border-0
               bg-transparent
               p-0
               text-xs
               font-semibold
               text-[#007979]
               transition
               hover:text-[#032D42]
               focus:outline-none"
                      >
                        <span>
                          {{ showNewResourceForm() ? 'Hide' : 'Show' }}
                        </span>

                        <mat-icon
                          aria-hidden="true"
                          class="!m-0
                 !h-4
                 !w-4
                 !text-[18px]"
                        >
                          {{ showNewResourceForm() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}
                        </mat-icon>
                      </button>
                    }
                  </div>
                </div>

                <form id="resourceForm" class="space-y-8 p-6" (ngSubmit)="saveResource()">
                  @if (editingId() || showNewResourceForm()) {
                    <!-- =================================================
                 Basic information
                 ================================================= -->
                    <section>
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">Basic information</h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Core information users will see about this resource.
                        </p>
                      </div>

                      <div class="space-y-5">
                        <!-- Name / Slug -->
                        <div class="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label
                              for="resourceName"
                              class="block text-sm font-medium text-gray-700"
                            >
                              Name
                              <span class="text-red-500">*</span>
                            </label>

                            <input
                              id="resourceName"
                              name="name"
                              type="text"
                              [(ngModel)]="form.name"
                              (ngModelChange)="generateSlug()"
                              required
                              placeholder="Food Assistance"
                              class="mt-1.5 block w-full rounded-lg border
                             border-gray-300 bg-gray-50 px-4 py-2.5
                             text-sm text-gray-900
                             placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2 focus:ring-[#007979]/20
                             focus:bg-white"
                            />
                          </div>

                          <div>
                            <label
                              for="resourceSlug"
                              class="block text-sm font-medium text-gray-700"
                            >
                              Slug
                              <span class="text-red-500">*</span>
                            </label>

                            <input
                              id="resourceSlug"
                              name="slug"
                              type="text"
                              [(ngModel)]="form.slug"
                              required
                              placeholder="food-assistance"
                              class="mt-1.5 block w-full rounded-lg
                             border border-gray-300 bg-gray-50
                             px-4 py-2.5 font-mono text-sm
                             text-gray-700 placeholder:text-gray-400
                             focus:border-[#007979]
                             focus:bg-white focus:outline-none
                             focus:ring-2 focus:ring-[#007979]/20
                             focus:bg-white"
                            />

                            <p class="mt-1.5 text-xs text-gray-500">
                              Automatically generated from the resource name.
                            </p>
                          </div>
                        </div>

                        <!-- Category / Type -->
                        <div class="grid gap-5 sm:grid-cols-2">
                          <div>
                            <label for="categoryId" class="block text-sm font-medium text-gray-700">
                              Category
                              <span class="text-red-500">*</span>
                            </label>

                            <select
                              id="categoryId"
                              name="categoryId"
                              [(ngModel)]="form.categoryId"
                              required
                              class="mt-1.5 block w-full rounded-lg
                             border border-gray-300 bg-gray-50
                             px-4 py-2.5 text-sm text-gray-900
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2 focus:ring-[#007979]/20
                             focus:bg-white"
                            >
                              <option value="">Select a category</option>

                              @for (category of categories(); track category.id) {
                                <option [value]="category.id">
                                  {{ category.name }}
                                </option>
                              }
                            </select>
                          </div>

                          <div>
                            <label
                              for="resourceType"
                              class="block text-sm font-medium text-gray-700"
                            >
                              Resource type
                              <span class="text-red-500">*</span>
                            </label>

                            <select
                              id="resourceType"
                              name="resourceType"
                              [(ngModel)]="form.resourceType"
                              required
                              class="mt-1.5 block w-full rounded-lg
                             border border-gray-300 bg-gray-50
                             px-4 py-2.5 text-sm text-gray-900
                             focus:border-[#007979]
                             focus:outline-none
                             focus:ring-2 focus:ring-[#007979]/20
                             focus:bg-white"
                            >
                              @for (type of resourceTypes(); track type.id) {
                                <option [value]="type.id">
                                  {{ type.name }}
                                </option>
                              }
                            </select>
                          </div>
                        </div>

                        <!-- Location -->
                        <div>
                          <label for="locationId" class="block text-sm font-medium text-gray-700">
                            Location
                          </label>

                          <select
                            id="locationId"
                            name="locationId"
                            [(ngModel)]="form.locationId"
                            class="mt-1.5 block w-full rounded-lg
           border border-gray-300 bg-gray-50
           px-4 py-2.5 text-sm text-gray-900
           focus:border-[#007979]
           focus:outline-none
           focus:ring-2 focus:ring-[#007979]/20
           focus:bg-white"
                          >
                            <option value="">Select a location</option>

                            @for (location of locations(); track location.id) {
                              <option [value]="location.id">
                                {{ location.city }}, {{ location.state }}
                                @if (location.zipCode) {
                                  {{ location.zipCode }}
                                }
                              </option>
                            }
                          </select>

                          <p class="mt-1.5 text-xs text-gray-500">
                            Select the location where this resource is available.
                          </p>
                        </div>

                        <!-- Description -->
                        <div>
                          <label for="description" class="block text-sm font-medium text-gray-700">
                            Description
                            <span class="text-red-500">*</span>
                          </label>

                          <textarea
                            id="description"
                            name="description"
                            rows="4"
                            [(ngModel)]="form.description"
                            required
                            placeholder="Describe this resource."
                            class="mt-1.5 block w-full resize-y rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          ></textarea>
                        </div>
                      </div>
                    </section>

                    <!-- =================================================
                 Contact & organization
                 ================================================= -->
                    <section class="border-t border-gray-200 pt-7">
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">
                          Contact & organization
                        </h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Information users can use to reach or identify the organization behind
                          this resource.
                        </p>
                      </div>

                      <div class="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label for="website" class="block text-sm font-medium text-gray-700">
                            Website
                          </label>

                          <input
                            id="website"
                            name="website"
                            type="url"
                            [(ngModel)]="form.website"
                            placeholder="https://example.org"
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          />
                        </div>

                        <div>
                          <label for="phone" class="block text-sm font-medium text-gray-700">
                            Phone
                          </label>

                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            [(ngModel)]="form.phone"
                            placeholder="555-555-5555"
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          />
                        </div>

                        <div>
                          <label for="email" class="block text-sm font-medium text-gray-700">
                            Email
                          </label>

                          <input
                            id="email"
                            name="email"
                            type="email"
                            [(ngModel)]="form.email"
                            placeholder="contact@example.org"
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          />
                        </div>

                        <div>
                          <label
                            for="organizationId"
                            class="block text-sm font-medium text-gray-700"
                          >
                            Organization ID
                          </label>

                          <input
                            id="organizationId"
                            name="organizationId"
                            type="text"
                            [(ngModel)]="form.organizationId"
                            placeholder="Optional"
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          />

                          <p class="mt-1.5 text-xs text-gray-500">
                            The Firestore ID of the associated organization.
                          </p>
                        </div>
                      </div>
                    </section>

                    <!-- =================================================
                 Availability
                 ================================================= -->
                    <section class="border-t border-gray-200 pt-7">
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">Availability</h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Tell users how and when this resource can be accessed.
                        </p>
                      </div>

                      <div class="grid gap-3 sm:grid-cols-3">
                        <label
                          class="flex cursor-pointer items-start gap-3
                         rounded-xl border border-gray-200
                         bg-gray-50 p-4 transition
                         hover:border-[#007979]/40
                         hover:bg-[#007979]/5"
                        >
                          <input
                            type="checkbox"
                            name="online"
                            [(ngModel)]="form.online"
                            class="mt-0.5 h-4 w-4 rounded border-gray-300
                           text-[#007979] focus:ring-[#007979]"
                          />

                          <span>
                            <span class="block text-sm font-semibold text-gray-900">
                              Available online
                            </span>

                            <span class="mt-1 block text-xs leading-5 text-gray-500">
                              Users can access this resource online.
                            </span>
                          </span>
                        </label>

                        <label
                          class="flex cursor-pointer items-start gap-3
                         rounded-xl border border-gray-200
                         bg-gray-50 p-4 transition
                         hover:border-[#007979]/40
                         hover:bg-[#007979]/5"
                        >
                          <input
                            type="checkbox"
                            name="alwaysAvailable"
                            [(ngModel)]="form.alwaysAvailable"
                            class="mt-0.5 h-4 w-4 rounded border-gray-300
                           text-[#007979] focus:ring-[#007979]"
                          />

                          <span>
                            <span class="block text-sm font-semibold text-gray-900">
                              Always available
                            </span>

                            <span class="mt-1 block text-xs leading-5 text-gray-500">
                              No appointment or schedule is required.
                            </span>
                          </span>
                        </label>

                        <label
                          class="flex cursor-pointer items-start gap-3
                         rounded-xl border border-gray-200
                         bg-gray-50 p-4 transition
                         hover:border-[#007979]/40
                         hover:bg-[#007979]/5"
                        >
                          <input
                            type="checkbox"
                            name="byAppointment"
                            [(ngModel)]="form.byAppointment"
                            class="mt-0.5 h-4 w-4 rounded border-gray-300
                           text-[#007979] focus:ring-[#007979]"
                          />

                          <span>
                            <span class="block text-sm font-semibold text-gray-900">
                              By appointment
                            </span>

                            <span class="mt-1 block text-xs leading-5 text-gray-500">
                              Users must schedule an appointment.
                            </span>
                          </span>
                        </label>
                      </div>
                    </section>

                    <!-- =================================================
                 Cost
                 ================================================= -->
                    <section class="border-t border-gray-200 pt-7">
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">Cost</h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Describe whether users pay for this resource.
                        </p>
                      </div>

                      <div class="space-y-5">
                        <label
                          class="flex cursor-pointer items-start gap-3
                         rounded-xl border border-gray-200
                         bg-gray-50 p-4 transition
                         hover:border-[#007979]/40
                         hover:bg-[#007979]/5"
                        >
                          <input
                            type="checkbox"
                            name="free"
                            [(ngModel)]="form.free"
                            class="mt-0.5 h-4 w-4 rounded border-gray-300
                           text-[#007979] focus:ring-[#007979]"
                          />

                          <span>
                            <span class="block text-sm font-semibold text-gray-900">
                              Free service
                            </span>

                            <span class="mt-1 block text-xs leading-5 text-gray-500">
                              This resource does not require payment.
                            </span>
                          </span>
                        </label>

                        <div>
                          <label
                            for="costDescription"
                            class="block text-sm font-medium text-gray-700"
                          >
                            Cost description
                          </label>

                          <input
                            id="costDescription"
                            name="costDescription"
                            type="text"
                            [(ngModel)]="form.costDescription"
                            placeholder="Free for eligible residents."
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          />
                        </div>
                      </div>
                    </section>

                    <!-- =================================================
                 Tags
                 ================================================= -->
                    <section class="border-t border-gray-200 pt-7">
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">Tags</h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Add keywords that help users discover this resource.
                        </p>
                      </div>

                      <input
                        id="tags"
                        name="tags"
                        type="text"
                        [(ngModel)]="form.tags"
                        placeholder="food, assistance, community"
                        class="block w-full rounded-lg border
                       border-gray-300 bg-gray-50 px-4 py-2.5
                       text-sm text-gray-900
                       placeholder:text-gray-400
                       focus:border-[#007979]
                       focus:outline-none
                       focus:ring-2 focus:ring-[#007979]/20
                       focus:bg-white"
                      />

                      <p class="mt-1.5 text-xs text-gray-500">Separate tags with commas.</p>
                    </section>

                    <!-- =================================================
                 Publishing
                 ================================================= -->
                    <section class="border-t border-gray-200 pt-7">
                      <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-900">Publishing</h3>

                        <p class="mt-1 text-sm text-gray-500">
                          Control the resource's publication and visibility.
                        </p>
                      </div>

                      <div class="space-y-5">
                        <div>
                          <label for="status" class="block text-sm font-medium text-gray-700">
                            Status
                          </label>

                          <select
                            id="status"
                            name="status"
                            [(ngModel)]="form.status"
                            class="mt-1.5 block w-full rounded-lg
                           border border-gray-300 bg-gray-50
                           px-4 py-2.5 text-sm text-gray-900
                           focus:border-[#007979]
                           focus:outline-none
                           focus:ring-2 focus:ring-[#007979]/20
                           focus:bg-white"
                          >
                            @for (status of resourceStatuses; track status) {
                              <option [value]="status">
                                {{ formatLabel(status) }}
                              </option>
                            }
                          </select>
                        </div>

                        <div class="grid gap-3 sm:grid-cols-2">
                          <label
                            class="flex cursor-pointer items-start gap-3
                           rounded-xl border border-gray-200
                           bg-gray-50 p-4 transition
                           hover:border-[#007979]/40
                           hover:bg-[#007979]/5"
                          >
                            <input
                              type="checkbox"
                              name="verified"
                              [(ngModel)]="form.verified"
                              class="mt-0.5 h-4 w-4 rounded border-gray-300
                             text-[#007979] focus:ring-[#007979]"
                            />

                            <span>
                              <span class="block text-sm font-semibold text-gray-900">
                                Verified
                              </span>

                              <span class="mt-1 block text-xs leading-5 text-gray-500">
                                Mark this resource as verified.
                              </span>
                            </span>
                          </label>

                          <label
                            class="flex cursor-pointer items-start gap-3
                           rounded-xl border border-gray-200
                           bg-gray-50 p-4 transition
                           hover:border-[#007979]/40
                           hover:bg-[#007979]/5"
                          >
                            <input
                              type="checkbox"
                              name="featured"
                              [(ngModel)]="form.featured"
                              class="mt-0.5 h-4 w-4 rounded border-gray-300
                             text-[#007979] focus:ring-[#007979]"
                            />

                            <span>
                              <span class="block text-sm font-semibold text-gray-900">
                                Featured
                              </span>

                              <span class="mt-1 block text-xs leading-5 text-gray-500">
                                Highlight this resource in featured results.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>
                    </section>

                    <!-- Error -->
                    @if (error()) {
                      <div
                        class="rounded-xl border border-red-200
                       bg-red-50 p-4 text-sm text-red-700"
                      >
                        {{ error() }}
                      </div>
                    }

                    <!-- Actions -->
                    <div
                      class="flex flex-row
         items-center
         justify-end
         gap-2
         border-t border-gray-200
         pt-6"
                    >
                      @if (editingId()) {
                        <button
                          type="button"
                          (click)="cancelEdit()"
                          class="rounded-lg border border-gray-300
                         bg-white px-5 py-2.5 text-sm font-medium
                         text-gray-700 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      }

                      <button
                        type="submit"
                        [disabled]="saving()"
                        class="rounded-lg bg-[#032D42] px-5 py-2.5
                       text-sm font-semibold text-white shadow-sm
                       transition hover:bg-[#032D42]/90
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
                      >
                        {{
                          saving()
                            ? 'Saving...'
                            : editingId()
                              ? 'Update resource'
                              : 'Create resource'
                        }}
                      </button>
                    </div>
                  }
                </form>
              </div>
            </div>

            <!-- =======================================================
           Existing resources
           ======================================================= -->
            <aside class="lg:sticky lg:top-6 lg:col-span-1">
              <div
                class="overflow-hidden rounded-2xl border
                 border-gray-200 bg-white shadow-sm"
              >
                <!-- Directory header -->
                <div
                  class="border-b border-gray-200 bg-[#66BB6A]/80
                   px-5 py-2"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase
                         tracking-wider text-[#007979]"
                      >
                        Directory
                      </p>

                      <h2 class="mt-1 text-lg font-semibold text-[#032D42]">Existing resources</h2>

                      <p class="mt-1 text-sm text-white">Select a resource to edit or delete it.</p>
                    </div>

                    @if (!loading()) {
                      <span
                        class="rounded-full bg-gray-100 px-2.5 py-1
                         text-xs font-semibold text-gray-600"
                      >
                        {{ resources().length }}
                      </span>
                    } @else {
                      <span class="text-xs text-gray-500"> Loading... </span>
                    }
                  </div>
                </div>

                <!-- =====================================================
     Resource Search
     ===================================================== -->
                <div
                  class="border-b
         border-gray-100
         px-4
         py-1"
                >
                  <label for="resource-search" class="sr-only"> Search resources </label>

                  <input
                    id="resource-search"
                    name="resourceSearch"
                    type="search"
                    [value]="searchTerm()"
                    (input)="onSearch($event)"
                    placeholder="Search resources..."
                    class="block
           w-full
           rounded-lg
           border
           border-gray-300
           bg-white
           px-3.5 py-2.5
           text-sm
           text-gray-900
           placeholder:text-gray-400
           focus:border-[#007979]
           focus:outline-none
           focus:ring-2
           focus:ring-[#007979]/20"
                  />
                </div>

                <!-- Empty state -->
                @if (!loading() && resources().length === 0) {
                  <div class="p-6 text-center">
                    <div
                      class="mx-auto flex h-10 w-10 items-center
                       justify-center rounded-full bg-gray-100
                       text-gray-400"
                    >
                      —
                    </div>

                    <p class="mt-3 text-sm font-medium text-gray-700">No resources found</p>

                    <p class="mt-1 text-xs text-gray-500">Create a resource using the form.</p>
                  </div>
                }

                <!-- Resource list -->
                @if (filteredResources().length > 0) {
                  <div class="divide-y divide-gray-200">
                    @for (resource of filteredResources(); track resource.id) {
                      <div
                        class="p-4 transition hover:bg-gray-50"
                        [class.bg-[#007979]/5]="editingId() === resource.id"
                      >
                        <!-- =====================================================
         Resource name + Show / Hide toggle
         ===================================================== -->
                        <div
                          class="flex items-center
             justify-between
             gap-3"
                        >
                          <div class="min-w-0">
                            <h3
                              class="truncate text-sm
                 font-semibold
                 text-gray-900"
                            >
                              {{ resource.name }}
                            </h3>
                          </div>

                          <!-- Individual resource toggle -->
                          <button
                            type="button"
                            (click)="toggleExistingResource(resource.id)"
                            [attr.aria-expanded]="isExistingResourceExpanded(resource.id)"
                            class="inline-flex
               shrink-0
               items-center
               gap-1
               border-0
               bg-transparent
               p-0
               text-xs
               font-semibold
               text-[#007979]
               transition
               hover:text-[#032D42]
               focus:outline-none"
                          >
                            <span>
                              {{ isExistingResourceExpanded(resource.id) ? 'Hide' : 'Show' }}
                            </span>

                            <span aria-hidden="true" class="text-base leading-none">
                              {{ isExistingResourceExpanded(resource.id) ? '▲' : '▼' }}
                            </span>
                          </button>
                        </div>

                        <!-- =====================================================
         Existing resource details
         ===================================================== -->
                        @if (isExistingResourceExpanded(resource.id)) {
                          <!-- Slug + status -->
                          <div
                            class="mt-1 flex items-start
               justify-between
               gap-3"
                          >
                            <p
                              class="min-w-0 truncate
                 font-mono
                 text-xs
                 text-gray-500"
                            >
                              {{ resource.slug }}
                            </p>

                            <span
                              class="shrink-0
                 rounded-full
                 bg-gray-100
                 px-2
                 py-1
                 text-xs
                 font-medium
                 text-gray-700"
                            >
                              {{ formatLabel(resource.status) }}
                            </span>
                          </div>

                          <!-- Description -->
                          @if (resource.description) {
                            <p
                              class="mt-3
                 line-clamp-3
                 text-sm
                 leading-5
                 text-gray-600"
                            >
                              {{ resource.description }}
                            </p>
                          }

                          <!-- Verification status and actions -->
                          <div
                            class="mt-4 flex
               items-center
               justify-between
               gap-3"
                          >
                            <!-- Verification status -->
                            <div>
                              @if (resource.verified) {
                                <span
                                  class="inline-flex
                     rounded-full
                     bg-[#007979]/10
                     px-2.5
                     py-1
                     text-xs
                     font-medium
                     text-[#007979]"
                                >
                                  Verified
                                </span>
                              } @else {
                                <span
                                  class="inline-flex
                     rounded-full
                     bg-gray-100
                     px-2.5
                     py-1
                     text-xs
                     font-medium
                     text-gray-500"
                                >
                                  Not verified
                                </span>
                              }
                            </div>

                            <!-- Actions -->
                            <div class="flex gap-1.5">
                              <button
                                type="button"
                                (click)="editResource(resource)"
                                class="rounded-md
                   border
                   border-gray-300
                   bg-white
                   px-2.5
                   py-1.5
                   text-xs
                   font-medium
                   text-gray-700
                   transition
                   hover:border-[#007979]/40
                   hover:bg-[#007979]/5"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                (click)="deleteResource(resource)"
                                class="rounded-md
                   border
                   border-red-200
                   px-2.5
                   py-1.5
                   text-xs
                   font-medium
                   text-red-600
                   transition
                   hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  `,
})
export class ResourceAdminComponent implements OnInit {
  private readonly resourceStore = inject(ResourceStore);
  private readonly categoryStore = inject(CategoryStore);
  private readonly locationStore = inject(LocationStore);
  private readonly resourceTypeStore = inject(ResourceTypeStore);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(HotToastService);

  protected readonly resources = this.resourceStore.resources;
  protected readonly categories = this.categoryStore.categories;
  protected readonly locations = this.locationStore.locations;
 protected readonly resourceTypes =
  this.resourceTypeStore.activeResourceTypes;

  /**
   * Search text used to filter existing resources.
   */
  protected readonly searchTerm = signal('');

  /**
   * Existing resources filtered by the search field.
   *
   * Searches across the resource name, slug,
   * description, and website.
   */
  protected readonly filteredResources = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.resources();
    }

    return this.resources().filter(
      (resource) =>
        resource.name?.toLowerCase().includes(search) ||
        resource.slug?.toLowerCase().includes(search) ||
        resource.description?.toLowerCase().includes(search) ||
        resource.website?.toLowerCase().includes(search),
    );
  });

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  // =========================================================
  // New Resource Form Visibility
  // =========================================================

  /**
   * Controls whether the new-resource form fields
   * are visible.
   *
   * The form starts open so users can immediately
   * begin entering a new resource.
   */
  protected readonly showNewResourceForm = signal(true);

  /**
   * Toggle the new-resource form visibility.
   */
  protected toggleNewResourceForm(): void {
    this.showNewResourceForm.update((visible) => !visible);
  }

  // =========================================================
  // Existing Resource Expand / Collapse State
  // =========================================================

  /**
   * Tracks which existing resource records are expanded.
   *
   * Each resource is tracked independently by its Firestore ID.
   */
  protected readonly expandedResources = signal<Set<string>>(new Set());

  /**
   * Toggle the details for one existing resource.
   */
  protected toggleExistingResource(resourceId: string): void {
    this.expandedResources.update((expanded) => {
      const next = new Set(expanded);

      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }

      return next;
    });
  }

  /**
   * Determine whether an existing resource
   * is currently expanded.
   */
  protected isExistingResourceExpanded(resourceId: string): boolean {
    return this.expandedResources().has(resourceId);
  }

  protected readonly resourceStatuses: ResourceStatus[] = [
    'draft',
    'pending',
    'published',
    'archived',
  ];

  protected form = this.createEmptyForm();

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load resources, categories, and locations for the admin page.
   */
  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await Promise.all([
        this.resourceStore.loadAllResources(),
        this.categoryStore.loadCategories(),
        this.locationStore.loadLocations(),
        this.resourceTypeStore.loadResourceTypes(),
      ]);
    } catch (error) {
      console.error('Failed to load resource admin data:', error);

      this.error.set('Unable to load resources. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Automatically create a URL-friendly slug from the resource name.
   */
  protected generateSlug(): void {
    if (this.editingId()) {
      return;
    }

    this.form.slug = this.form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Save a new or existing resource.
   */
  /**
   * Create a new resource or update an existing resource.
   */
  protected async saveResource(): Promise<void> {
    // =========================================================
    // Prevent duplicate submissions
    // =========================================================

    if (this.saving()) {
      return;
    }

    // =========================================================
    // Basic required-field validation
    //
    // These checks are intentionally performed in TypeScript
    // so resources cannot be saved with empty required values
    // even if browser form validation is bypassed.
    // =========================================================

    const name = this.form.name?.trim() || '';

    const slug = this.form.slug?.trim().toLowerCase() || '';

    const description = this.form.description?.trim() || '';

    const categoryId = this.form.categoryId?.trim() || '';

    const resourceType = this.form.resourceType?.trim() || '';

    if (!name) {
      this.toast.error('Resource name is required.');

      return;
    }

    if (!slug) {
      this.toast.error('Resource slug is required.');

      return;
    }

    if (!description) {
      this.toast.error('Resource description is required.');

      return;
    }

    if (!categoryId) {
      this.toast.error('Please select a category.');

      return;
    }

    if (!resourceType) {
      this.toast.error('Please select a resource type.');

      return;
    }

    // =========================================================
    // Authentication
    // =========================================================

    const currentUser = this.authService.user();

    if (!currentUser) {
      this.toast.error('You must be signed in to save a resource.');

      return;
    }

    // =========================================================
    // Normalize optional values
    // =========================================================

    const website = this.form.website?.trim() || '';

    const phone = this.form.phone?.trim() || '';

    const email = this.form.email?.trim() || '';

    const organizationId = this.form.organizationId?.trim() || '';

    const locationId = this.form.locationId?.trim() || '';

    const tags =
      this.form.tags
        ?.split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean) || [];

    // =========================================================
    // Build cost information
    // =========================================================

    const costDescription = this.form.costDescription?.trim() || '';

    const cost = {
      free: this.form.free,

      ...(costDescription
        ? {
            description: costDescription,
          }
        : {}),
    };

    // =========================================================
    // Build availability information
    // =========================================================

    const availability = {
      alwaysAvailable: this.form.alwaysAvailable,

      byAppointment: this.form.byAppointment,
    };

    // =========================================================
    // Build resource
    // =========================================================

    const resource = {
      ...this.form,

      name,

      slug,

      description,

      categoryId,

      locationId,

      organizationId,

      resourceType,

      website,

      phone,

      email,

      tags,

      cost,

      availability,

      online: this.form.online,

      status: this.form.status,

      verified: this.form.verified,

      featured: this.form.featured,

      createdBy: currentUser.id,
    };

    // =========================================================
    // Save
    // =========================================================

    this.saving.set(true);

    this.error.set(null);

    const editingId = this.editingId();

    try {
      if (editingId) {
        await this.resourceStore.updateResource(editingId, resource);

        this.toast.success('Resource updated successfully.');
      } else {
        await this.resourceStore.createResource(resource);

        this.toast.success('Resource created successfully.');
      }

      // =======================================================
      // Reset and refresh
      // =======================================================

      this.resetForm();

      await this.loadData();
    } catch (error) {
      console.error('Failed to save resource:', error);

      this.toast.error(
        `Unable to save resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Load a resource into the form for editing.
   */
  protected editResource(resource: Resource): void {
    this.editingId.set(resource.id);

    this.form = {
      name: resource.name,
      slug: resource.slug,
      description: resource.description,

      categoryId: resource.categoryId,

      locationId: resource.locationId ?? '',

      organizationId: resource.organizationId ?? '',

      resourceType: resource.resourceType,

      website: resource.website ?? '',
      phone: resource.phone ?? '',
      email: resource.email ?? '',

      online: resource.online,

      alwaysAvailable: resource.availability?.alwaysAvailable ?? false,

      byAppointment: resource.availability?.byAppointment ?? false,

      free: resource.cost?.free ?? true,

      costDescription: resource.cost?.description ?? '',

      tags: resource.tags.join(', '),

      status: resource.status,

      verified: resource.verified,

      featured: resource.featured,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Cancel editing and return to a blank form.
   */
  protected cancelEdit(): void {
    this.resetForm();
  }

  /**
   * Search existing resources.
   */
  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  /**
   * Clear the resource search.
   */
  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  /**
   * Sign the current administrator out of Firebase.
   *
   * Uses the existing AuthService logout implementation.
   */
  protected async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Failed to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    }
  }

  /**
   * Delete a resource.
   */

  /**
   * Show a Hot Toast confirmation before deleting
   * a resource.
   */
  /**
   * Show a Hot Toast confirmation before deleting
   * a resource.
   */
  protected deleteResource(resource: Resource): void {
    this.toast.show(DeleteConfirmationComponent, {
      position: 'top-center',

      // Keep the confirmation open until the
      // administrator chooses Cancel or Delete.
      autoClose: false,
      dismissible: false,

      // Use Hot Toast's normal white toast theme.
      theme: 'toast',

      // The Hot Toast itself is the confirmation card.
      style: {
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        padding: '20px',
        marginTop: '70px',
        background: '#FBF5DD',
        color: '#032D42',
      },

      data: {
        title: 'Delete resource?',
        message: `${resource.name} will be permanently deleted.`,

        onConfirm: async () => {
          await this.confirmDeleteResource(resource);
        },
      },
    });
  }

  /**
   * Delete the resource after confirmation.
   */
  private async confirmDeleteResource(resource: Resource): Promise<void> {
    this.saving.set(true);
    this.error.set(null);

    try {
      await this.resourceStore.deleteResource(resource.id);

      // Clear the form if the deleted resource
      // was currently being edited.
      if (this.editingId() === resource.id) {
        this.resetForm();
      }

      await this.loadData();

      this.toast.success('Resource deleted successfully.');
    } catch (error) {
      console.error('Failed to delete resource:', error);

      this.toast.error('Unable to delete resource. Please try again.');

      throw error;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Reset the form to its default values.
   */
  private resetForm(): void {
    this.editingId.set(null);
    this.form = this.createEmptyForm();
  }

  /**
   * Create default values for a new resource.
   */
  private createEmptyForm() {
    return {
      name: '',
      slug: '',
      description: '',

      categoryId: '',

      locationId: '',

      organizationId: '',

      resourceType: '',

      website: '',
      phone: '',
      email: '',

      online: false,

      alwaysAvailable: false,
      byAppointment: false,

      free: true,
      costDescription: '',

      tags: '',

      status: 'draft' as ResourceStatus,

      verified: false,
      featured: false,
    };
  }

  /**
   * Convert values such as "food-assistance"
   * into readable labels such as "Food Assistance".
   */
  protected formatLabel(value: string): string {
    return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

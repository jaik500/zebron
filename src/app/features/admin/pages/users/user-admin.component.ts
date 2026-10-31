import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminLayoutSwitchComponent, adminViewState } from '../../shared/admin-view';
import { Router, RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { User } from '../../../../core/models/user.model';
import { UserStore } from '../../../users/stores/user.store';
import { AuthService } from '../../../../core/services/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { PlatformRole } from '../../../../core/models/role.model';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [AdminLayoutSwitchComponent, FormsModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <header class="border-b border-white/10 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f]">
      <div
        class="mx-auto flex max-w-7xl
           items-center justify-between
           gap-4 px-4 py-4
           sm:px-6 lg:px-8"
      >
        <!-- Header information -->
        <div class="min-w-0">
          <p
            class="text-xs
               font-semibold
               uppercase
               tracking-wider
               text-[#7ED6D1]"
          >
            Administration
          </p>

          <h1
            class="text-xl
               font-bold
               text-white
               sm:text-3xl"
          >
            Users
          </h1>

          <p
            class="mt-1
               text-sm
               text-white/80"
          >
            Manage Zebron user profiles, roles, and account information.
          </p>
        </div>

        <!-- =====================================================
         Angular Material administration menu
         ===================================================== -->
        <button
          mat-icon-button
          [matMenuTriggerFor]="adminMenu"
          aria-label="Open administration menu"
          class="!shrink-0
             !text-white
             hover:!bg-white/10"
        >
          <mat-icon> more_vert </mat-icon>
        </button>

        <!-- =====================================================
         Administration menu
         ===================================================== -->
        <mat-menu
          #adminMenu="matMenu"
          xPosition="before"
          yPosition="below"
          class="admin-header-menu"
        >
          <!-- Home -->
          <a mat-menu-item routerLink="/">
            <mat-icon> home </mat-icon>

            <span> Home </span>
          </a>

          <!-- Admin Dashboard -->
          <a mat-menu-item routerLink="/admin">
            <mat-icon> dashboard </mat-icon>

            <span> Admin Dashboard </span>
          </a>

          <!-- Divider -->
          <mat-divider></mat-divider>

          <!-- Resource Types -->
          <a mat-menu-item routerLink="/admin/resources">
            <mat-icon> category </mat-icon>

            <span> Resource Types </span>
          </a>

          <!-- Organizations -->
          <a mat-menu-item routerLink="/admin/organizations">
            <mat-icon> business </mat-icon>

            <span> Organizations </span>
          </a>

          <!-- Categories -->
          <a mat-menu-item routerLink="/admin/categories">
            <mat-icon> folder </mat-icon>

            <span> Categories </span>
          </a>

          <!-- Submissions -->
          <a mat-menu-item routerLink="/admin/submissions">
            <mat-icon> assignment </mat-icon>

            <span> Submissions </span>
          </a>

          <!-- Divider -->
          <mat-divider></mat-divider>

          <!-- Sign Out -->
          <button mat-menu-item type="button" (click)="signOut()">
            <mat-icon> logout </mat-icon>

            <span> Sign Out </span>
          </button>
        </mat-menu>
      </div>
    </header>

    <main class="mx-auto max-w-7xl p-6 sm:p-8">
      <!-- =========================================================
           PAGE NAVIGATION
           ========================================================= -->
      <div
        class="mb-5 flex items-center
               justify-between gap-4"
      >
        <a
          routerLink="/admin"
          class="inline-flex items-center gap-1
                 text-sm font-medium text-gray-500
                 transition hover:text-[#007979]"
        >
          ← Admin Dashboard
        </a>

        <a
          routerLink="/resources"
          class="inline-flex items-center gap-1
                 text-sm font-medium text-gray-500
                 transition hover:text-[#007979]"
        >
          Home →
        </a>
      </div>

      <!-- =========================================================
           PAGE HEADER
           ========================================================= -->

      <!-- =========================================================
           SEARCH / ACTIONS
           ========================================================= -->
      <section
        class="mt-4 rounded-2xl
               border border-gray-200
               bg-white p-5 shadow-sm"
      >
        <div
          class="flex flex-col gap-4
                 sm:flex-row
                 sm:items-start
                 sm:justify-between"
        >
          <!-- Search -->
          <div class="w-full sm:max-w-xs">

            <mat-form-field appearance="outline" class="zb-field zb-field--flush w-full sm:max-w-xs zb-search" subscriptSizing="dynamic">
              <mat-label>Search users</mat-label>
              <mat-icon matPrefix aria-hidden="true">search</mat-icon>
              <input matInput
                id="userSearch"
                name="userSearch"
                type="search"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                placeholder="Search users..."
                autocomplete="off"
              />
              @if (searchTerm()) {
                <button mat-icon-button matSuffix type="button" aria-label="Clear search" (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <!-- Search result status -->
            @if (searchTerm().trim()) {
              @if (filteredUsers().length > 0) {
                <p
                  class="mt-2 text-sm
                         text-gray-500"
                >
                  {{ filteredUsers().length }}
                  {{ filteredUsers().length === 1 ? 'user' : 'users' }}
                  found for

                  <span
                    class="font-medium
                           text-gray-700"
                  >
                    "{{ searchTerm().trim() }}"
                  </span>
                </p>
              } @else {
                <p
                  class="mt-2 text-sm
                         text-gray-600"
                >
                  No users found for

                  <span
                    class="font-medium
                           text-gray-800"
                  >
                    "{{ searchTerm().trim() }}"
                  </span>
                </p>
              }
            } @else {
              <p
                class="mt-2 text-xs
                       text-gray-400"
              >
                Search by name, email, role, or location.
              </p>
            }
          </div>

          <div
            class="flex flex-col gap-3
         sm:flex-row
         sm:items-center
         sm:justify-between"
          >
            <!-- =====================================================
       RIGHT SIDE: Add User + Total Users
       Opposite the search bar
       ===================================================== -->
            <div
              class="flex
           shrink-0
           items-center
           justify-end
           gap-2"
            >
              <!-- Display preference: table or cards (saved per admin) -->
              <app-admin-layout-switch [state]="viewState" [allowSplit]="false" />

              <!-- Add User -->
              <button
                type="button"
                (click)="openCreateForm()"
                class="inline-flex
             h-10
             items-center
             justify-center
             gap-1.5
             rounded-lg
             bg-[#032D42]
             px-4
             text-sm
             font-semibold
             text-white
             shadow-sm
             transition
             hover:bg-[#064b68]"
              >
                <mat-icon
                  class="!m-0
               !h-5
               !w-5
               !text-[20px]"
                >
                  person_add
                </mat-icon>

                Add User
              </button>

              <!-- Total Users -->
              <div
                class="flex
             h-10
             items-center
             gap-2
             rounded-lg
             border border-gray-200
             bg-white
             px-4
             shadow-sm"
              >
                <span
                  class="text-xs
               font-medium
               text-gray-500"
                >
                  Total Users
                </span>

                <span
                  class="text-sm
               font-bold
               text-[#032D42]"
                >
                  {{ users().length }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================
           LOADING
           ========================================================= -->
      @if (loading()) {
        <section
          class="mt-6 rounded-2xl
                 border border-gray-200
                 bg-white p-8 shadow-sm"
        >
          <div
            class="flex items-center
                   justify-center gap-3"
          >
            <div
              class="h-5 w-5 animate-spin
                     rounded-full border-2
                     border-gray-300
                     border-t-[#007979]"
            ></div>

            <p class="text-sm text-gray-500">Loading users...</p>
          </div>
        </section>
      }

      <!-- =========================================================
           ERROR
           ========================================================= -->
      @if (error()) {
        <section
          class="mt-6 rounded-lg
                 border border-red-200
                 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p class="text-sm text-red-700">
            {{ error() }}
          </p>
        </section>
      }

      <!-- =========================================================
           USERS
           ========================================================= -->
      @if (!loading()) {
        <section
          class="mt-6 overflow-hidden
                 rounded-2xl
                 border border-gray-200
                 bg-white shadow-sm"
        >
          <!-- =====================================================
               DESKTOP TABLE
               ===================================================== -->
          <div
            [class]="viewState.layout() === 'cards' ? 'hidden' : 'hidden overflow-x-auto md:block'"
          >
            <table
              class="min-w-full
                     divide-y divide-gray-200"
            >
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-4 text-left
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500"
                  >
                    User
                  </th>

                  <th
                    scope="col"
                    class="px-6 py-4 text-left
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500"
                  >
                    Email
                  </th>

                  <th
                    scope="col"
                    class="px-6 py-4 text-left
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500"
                  >
                    Role
                  </th>

                  <th
                    scope="col"
                    class="px-6 py-4 text-left
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500"
                  >
                    Location
                  </th>

                  <th
                    scope="col"
                    class="px-6 py-4 text-right
                           text-xs font-semibold
                           uppercase tracking-wide
                           text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody
                class="divide-y divide-gray-200
                       bg-white"
              >
                @for (user of filteredUsers(); track user.id) {
                  <tr
                    class="transition
                           hover:bg-gray-50"
                  >
                    <!-- User -->
                    <td class="px-6 py-4">
                      <div
                        class="flex items-center
                               gap-3"
                      >
                        <div
                          class="flex h-10 w-10
                                 shrink-0
                                 items-center
                                 justify-center
                                 rounded-full
                                 bg-[#032D42]
                                 text-sm font-bold
                                 text-white"
                        >
                          {{ initials(user.preferredName || user.displayName || user.email) }}
                        </div>

                        <div class="min-w-0">
                          <p
                            class="truncate
                                   text-sm
                                   font-semibold
                                   text-gray-900"
                          >
                            {{ user.preferredName || user.displayName || 'Unnamed user' }}
                          </p>

                          @if (user.firstName || user.lastName) {
                            <p
                              class="text-xs
                                     text-gray-500"
                            >
                              {{ user.firstName }}
                              {{ user.lastName }}
                            </p>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Email -->
                    <td class="px-6 py-4">
                      <span
                        class="text-sm
                               text-gray-700"
                      >
                        {{ user.email }}
                      </span>
                    </td>

                    <!-- Role -->
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex
                               rounded-full
                               px-2.5 py-1
                               text-xs font-semibold"
                        [class.bg-[#007979]/10]="user.platformRole === 'platform-admin'"
                        [class.text-[#007979]]="user.platformRole === 'platform-admin'"
                        [class.bg-gray-100]="user.platformRole !== 'platform-admin'"
                        [class.text-gray-700]="user.platformRole !== 'platform-admin'"
                      >
                        {{ user.platformRole || 'User' }}
                      </span>
                    </td>

                    <!-- Location -->
                    <td class="px-6 py-4">
                      <span
                        class="text-sm
                               text-gray-600"
                      >
                        {{ locationLabel(user) }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td
                      class="px-6 py-4
                             text-right"
                    >
                      <div
                        class="flex justify-end
                               gap-2"
                      >
                        <button
                          type="button"
                          (click)="openEditForm(user)"
                          class="rounded-lg
                                 border
                                 border-gray-300
                                 bg-white
                                 px-3 py-2
                                 text-xs font-semibold
                                 text-gray-700
                                 transition
                                 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          (click)="resetUserPassword(user)"
                          [disabled]="resettingUserId() === user.id"
                          class="rounded-lg
                            border border-[#007979]/30
                            bg-white px-3 py-2
                            text-xs font-semibold
                            text-[#007979]
                            transition
                            hover:bg-[#007979]/5
                            disabled:cursor-not-allowed
                            disabled:opacity-50"
                        >
                          @if (resettingUserId() === user.id) {
                            Sending...
                          } @else {
                            Reset Password
                          }
                        </button>
                        <button
                          type="button"
                          (click)="confirmDelete(user)"
                          class="rounded-lg
                                 border
                                 border-red-200
                                 bg-white
                                 px-3 py-2
                                 text-xs font-semibold
                                 text-red-700
                                 transition
                                 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td
                      colspan="5"
                      class="px-6 py-14
                             text-center"
                    >
                      @if (searchTerm().trim()) {
                        <p
                          class="text-sm
                                 font-semibold
                                 text-gray-700"
                        >
                          No users found.
                        </p>

                        <p
                          class="mt-1 text-sm
                                 text-gray-500"
                        >
                          Try a different search term.
                        </p>
                      } @else {
                        <p
                          class="text-sm
                                 font-semibold
                                 text-gray-700"
                        >
                          No users available.
                        </p>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- =====================================================
               MOBILE CARDS
               ===================================================== -->
          <div
            [class]="viewState.layout() === 'cards'
              ? 'grid gap-3 bg-gray-50 p-3 sm:grid-cols-2 lg:grid-cols-3'
              : 'divide-y divide-gray-200 md:hidden'"
          >
            @for (user of filteredUsers(); track user.id) {
              <article [class]="viewState.layout() === 'cards' ? 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm' : 'p-5'">
                <div
                  class="flex items-start
                         justify-between gap-4"
                >
                  <div
                    class="flex min-w-0
                           items-center gap-3"
                  >
                    <div
                      class="flex h-10 w-10
                             shrink-0
                             items-center
                             justify-center
                             rounded-full
                             bg-[#032D42]
                             text-sm font-bold
                             text-white"
                    >
                      {{ initials(user.preferredName || user.displayName || user.email) }}
                    </div>

                    <div class="min-w-0">
                      <p
                        class="truncate
                               text-sm
                               font-semibold
                               text-gray-900"
                      >
                        {{ user.preferredName || user.displayName || 'Unnamed user' }}
                      </p>

                      <p
                        class="truncate
                               text-xs
                               text-gray-500"
                      >
                        {{ user.email }}
                      </p>
                    </div>
                  </div>

                  <span
                    class="shrink-0
                           rounded-full
                           px-2.5 py-1
                           text-xs font-semibold"
                    [class.bg-[#007979]/10]="user.platformRole === 'platform-admin'"
                    [class.text-[#007979]]="user.platformRole === 'platform-admin'"
                    [class.bg-gray-100]="user.platformRole !== 'platform-admin'"
                    [class.text-gray-700]="user.platformRole !== 'platform-admin'"
                  >
                    {{ user.platformRole || 'User' }}
                  </span>
                </div>

                <div
                  class="mt-4 text-sm
                         text-gray-600"
                >
                  {{ locationLabel(user) }}
                </div>

                <div class="mt-4 flex gap-2">
                  <button
                    type="button"
                    (click)="openEditForm(user)"
                    class="flex-1 rounded-lg
                           border border-gray-300
                           bg-white px-3 py-2
                           text-xs font-semibold
                           text-gray-700
                           transition
                           hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    (click)="confirmDelete(user)"
                    class="flex-1 rounded-lg
                           border border-red-200
                           bg-white px-3 py-2
                           text-xs font-semibold
                           text-red-700
                           transition
                           hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            } @empty {
              <div
                class="px-6 py-14
                       text-center"
              >
                @if (searchTerm().trim()) {
                  <p
                    class="text-sm
                           font-semibold
                           text-gray-700"
                  >
                    No users found.
                  </p>

                  <p
                    class="mt-1 text-sm
                           text-gray-500"
                  >
                    Try a different search term.
                  </p>
                } @else {
                  <p
                    class="text-sm
                           font-semibold
                           text-gray-700"
                  >
                    No users available.
                  </p>
                }
              </div>
            }
          </div>
        </section>
      }

      <!-- =========================================================
           CREATE / EDIT USER MODAL
           ========================================================= -->
      @if (showForm()) {
        <div
          class="fixed inset-0 z-50
                 overflow-y-auto"
        >
          <!-- Backdrop -->
          <div
            class="fixed inset-0
                   bg-black/40"
            (click)="closeForm()"
          ></div>

          <div
            class="relative flex min-h-full
                   items-start justify-center
                   p-4 sm:p-8"
          >
            <section
              class="relative my-8 w-full
                     max-w-3xl overflow-hidden
                     rounded-2xl
                     border border-gray-200
                     bg-white shadow-xl"
            >
              <!-- Form header -->
              <header
                class="flex items-start
                       justify-between gap-4
                       border-b border-gray-200
                       bg-gray-50/60
                       px-6 py-5 sm:px-8"
              >
                <div>
                  <p
                    class="text-xs font-semibold
                           uppercase tracking-wide
                           text-[#007979]"
                  >
                    User Management
                  </p>

                  <h2
                    class="mt-1 text-xl
                           font-semibold
                           text-[#032D42]"
                  >
                    {{ editingUser() ? 'Edit User' : 'Create User' }}
                  </h2>

                  <p
                    class="mt-1 text-sm
                           text-gray-500"
                  >
                    {{
                      editingUser()
                        ? 'Update the user profile.'
                        : 'Create a new Zebron user account.'
                    }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="closeForm()"
                  aria-label="Close form"
                  class="rounded-lg p-2
                         text-gray-400
                         transition
                         hover:bg-gray-100
                         hover:text-gray-700"
                >
                  ✕
                </button>
              </header>

              <!-- =================================================
                   USER FORM
                   ================================================= -->
              <form
                class="space-y-7
                       px-6 py-6 sm:px-8"
                (ngSubmit)="saveUser()"
              >
                <!-- =================================================
                     ACCOUNT
                     ================================================= -->
                <div>
                  <h3
                    class="text-base
                           font-semibold
                           text-[#032D42]"
                  >
                    Account information
                  </h3>

                  <p
                    class="mt-1 text-sm
                           text-gray-500"
                  >
                    Basic account information.
                  </p>
                </div>

                <!-- Display name -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Display name</mat-label>
                    <input matInput
                    id="adminDisplayName"
                    name="adminDisplayName"
                    type="text"
                    [(ngModel)]="form.displayName"
                    required
                  />
                  </mat-form-field>
                </div>

                <!-- Email -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Email address</mat-label>
                    <input matInput
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    [(ngModel)]="form.email"
                    [disabled]="!!editingUser()"
                    required
                    autocomplete="email"
                  />
                  </mat-form-field>

                  @if (editingUser()) {
                    <p
                      class="mt-1.5 text-xs
                             text-gray-500"
                    >
                      Email changes will be handled through Firebase Authentication.
                    </p>
                  }
                </div>

                <!-- =================================================
                     PASSWORD - CREATE ONLY
                     ================================================= -->
                @if (!editingUser()) {
                  <div
                    class="border-t border-gray-200
                           pt-7"
                  >
                    <h3
                      class="text-base font-semibold
                             text-[#032D42]"
                    >
                      Account password
                    </h3>

                    <p
                      class="mt-1 text-sm
                             text-gray-500"
                    >
                      Set the initial password for this user.
                    </p>
                  </div>

                  <div
                    class="grid gap-6
                           sm:grid-cols-2"
                  >
                    <!-- Password -->
                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Password</mat-label>
                        <input matInput
                        id="adminPassword"
                        name="adminPassword"
                        type="password"
                        [(ngModel)]="form.password"
                        autocomplete="new-password"
                        required
                        minlength="6"
                      />
                      </mat-form-field>

                      <p
                        class="mt-1.5 text-xs
                               text-gray-500"
                      >
                        Minimum 6 characters.
                      </p>
                    </div>

                    <!-- Confirm password -->
                    <div>

                      <mat-form-field appearance="outline" class="zb-field">
                        <mat-label>Confirm password</mat-label>
                        <input matInput
                        id="adminConfirmPassword"
                        name="adminConfirmPassword"
                        type="password"
                        [(ngModel)]="form.confirmPassword"
                        autocomplete="new-password"
                        required
                        minlength="6"
                      />
                      </mat-form-field>
                    </div>
                  </div>
                }

                <!-- Role -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Role</mat-label>
                    <mat-select
                    id="adminRole"
                    name="adminRole"
                    [(ngModel)]="form.platformRole"
                  >
                    <mat-option [value]="undefined">Standard User</mat-option>
                    <mat-option value="platform-admin">Platform Administrator</mat-option>
                    <mat-option value="platform-operator">Platform Operator</mat-option>
                    <mat-option value="platform-support">Platform Support</mat-option>
                    <mat-option value="platform-auditor">Platform Auditor</mat-option>
                  </mat-select>
                  </mat-form-field>
                </div>

                <!-- =================================================
                     PERSONAL INFORMATION
                     ================================================= -->
                <div
                  class="border-t border-gray-200
                         pt-7"
                >
                  <h3
                    class="text-base font-semibold
                           text-[#032D42]"
                  >
                    Personal information
                  </h3>
                </div>

                <div
                  class="grid gap-6
                         sm:grid-cols-2"
                >
                  <!-- First name -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>First name</mat-label>
                      <input matInput
                      id="adminFirstName"
                      name="adminFirstName"
                      type="text"
                      [(ngModel)]="form.firstName"
                      autocomplete="given-name"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Last name -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Last name</mat-label>
                      <input matInput
                      id="adminLastName"
                      name="adminLastName"
                      type="text"
                      [(ngModel)]="form.lastName"
                      autocomplete="family-name"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Preferred name -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Preferred name</mat-label>
                      <input matInput
                      id="adminPreferredName"
                      name="adminPreferredName"
                      type="text"
                      [(ngModel)]="form.preferredName"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Phone -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Phone</mat-label>
                      <input matInput
                      id="adminPhone"
                      name="adminPhone"
                      type="tel"
                      [(ngModel)]="form.phone"
                      autocomplete="tel"
                    />
                    </mat-form-field>
                  </div>
                </div>

                <!-- =================================================
                     LOCATION
                     ================================================= -->
                <div
                  class="border-t border-gray-200
                         pt-7"
                >
                  <h3
                    class="text-base font-semibold
                           text-[#032D42]"
                  >
                    Location
                  </h3>
                </div>

                <div
                  class="grid gap-6
                         sm:grid-cols-2"
                >
                  <!-- Country of origin -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Country of origin</mat-label>
                      <input matInput
                      id="adminCountryOfOrigin"
                      name="adminCountryOfOrigin"
                      type="text"
                      [(ngModel)]="form.countryOfOrigin"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Current country -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Current country</mat-label>
                      <input matInput
                      id="adminCurrentCountry"
                      name="adminCurrentCountry"
                      type="text"
                      [(ngModel)]="form.currentCountry"
                    />
                    </mat-form-field>
                  </div>

                  <!-- City -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>City</mat-label>
                      <input matInput
                      id="adminCity"
                      name="adminCity"
                      type="text"
                      [(ngModel)]="form.city"
                    />
                    </mat-form-field>
                  </div>

                  <!-- State -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>State / Province</mat-label>
                      <input matInput
                      id="adminState"
                      name="adminState"
                      type="text"
                      [(ngModel)]="form.state"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Postal code -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>ZIP / Postal code</mat-label>
                      <input matInput
                      id="adminPostalCode"
                      name="adminPostalCode"
                      type="text"
                      [(ngModel)]="form.postalCode"
                      autocomplete="postal-code"
                    />
                    </mat-form-field>
                  </div>

                  <!-- Preferred language -->
                  <div>

                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Preferred language</mat-label>
                      <input matInput
                      id="adminLanguage"
                      name="adminLanguage"
                      type="text"
                      [(ngModel)]="form.preferredLanguage"
                      placeholder="English, French, etc."
                    />
                    </mat-form-field>
                  </div>
                </div>

                <!-- =================================================
                     PROFILE
                     ================================================= -->
                <div
                  class="border-t border-gray-200
                         pt-7"
                >
                  <h3
                    class="text-base font-semibold
                           text-[#032D42]"
                  >
                    Profile
                  </h3>
                </div>

                <!-- Bio -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>About</mat-label>
                    <textarea matInput
                    id="adminBio"
                    name="adminBio"
                    rows="4"
                    maxlength="500"
                    [(ngModel)]="form.bio"
                  ></textarea>
                  </mat-form-field>

                  <p
                    class="mt-1.5 text-xs
                           text-gray-500"
                  >
                    Maximum 500 characters.
                  </p>
                </div>

                <!-- Website -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Website / LinkedIn</mat-label>
                    <input matInput
                    id="adminWebsite"
                    name="adminWebsite"
                    type="url"
                    [(ngModel)]="form.website"
                    placeholder="https://example.com"
                  />
                  </mat-form-field>
                </div>

                <!-- =================================================
                     FORM ACTIONS
                     ================================================= -->
                <div
                  class="flex flex-col-reverse
                         gap-3 border-t
                         border-gray-200
                         pt-6 sm:flex-row
                         sm:justify-end"
                >
                  <button
                    type="button"
                    (click)="closeForm()"
                    [disabled]="saving()"
                    class="rounded-lg
                           border border-gray-300
                           bg-white px-5 py-2.5
                           text-sm font-semibold
                           text-gray-700
                           transition
                           hover:bg-gray-50
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    [disabled]="saving()"
                    class="rounded-lg
                           bg-[#032D42]
                           px-5 py-2.5
                           text-sm font-semibold
                           text-white
                           transition
                           hover:bg-[#032D42]/90
                           disabled:cursor-not-allowed
                           disabled:opacity-50"
                  >
                    @if (saving()) {
                      Saving...
                    } @else {
                      {{ editingUser() ? 'Save Changes' : 'Create User' }}
                    }
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      }

      <!-- =========================================================
           DELETE CONFIRMATION
           ========================================================= -->
      @if (userToDelete(); as user) {
        <div
          class="fixed inset-0 z-[60]
                 flex items-center
                 justify-center
                 bg-black/40 p-4"
        >
          <section
            class="w-full max-w-md
                   rounded-2xl
                   border border-gray-200
                   bg-white p-6
                   shadow-xl"
          >
            <div
              class="flex h-11 w-11
                     items-center
                     justify-center
                     rounded-full
                     bg-red-50
                     font-bold
                     text-red-600"
            >
              !
            </div>

            <h2
              class="mt-4 text-lg
                     font-semibold
                     text-gray-900"
            >
              Delete user profile?
            </h2>

            <p
              class="mt-2 text-sm
                     leading-6 text-gray-500"
            >
              This will remove the Firestore profile for

              <strong class="text-gray-700"> {{ user.displayName || user.email }} </strong>.
            </p>

            <div
              class="mt-3 rounded-lg
                     bg-amber-50 px-3 py-2"
            >
              <p
                class="text-xs leading-5
                       text-amber-700"
              >
                This currently removes the Firestore profile only. The Firebase Authentication
                account will be handled through the secure backend.
              </p>
            </div>

            <div
              class="mt-6 flex
                     flex-col-reverse
                     gap-3 sm:flex-row
                     sm:justify-end"
            >
              <button
                type="button"
                (click)="cancelDelete()"
                [disabled]="deleting()"
                class="rounded-lg
                       border border-gray-300
                       bg-white px-4 py-2.5
                       text-sm font-semibold
                       text-gray-700
                       transition
                       hover:bg-gray-50
                       disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="deleteUser()"
                [disabled]="deleting()"
                class="rounded-lg
                       bg-red-600
                       px-4 py-2.5
                       text-sm font-semibold
                       text-white
                       transition
                       hover:bg-red-700
                       disabled:cursor-not-allowed
                       disabled:opacity-50"
              >
                @if (deleting()) {
                  Deleting...
                } @else {
                  Delete User
                }
              </button>
            </div>
          </section>
        </div>
      }
    </main>
  `,
})
export class UserAdminComponent implements OnInit {
  // =============================================================
  // SERVICES
  // =============================================================

  private readonly userStore = inject(UserStore);

  private readonly toast = inject(HotToastService);

  /**
   * Firebase authentication service.
   */
  protected readonly authService = inject(AuthService);

  /**
   * Angular router.
   */
  private readonly router = inject(Router);

  // =============================================================
  // USER STATE
  // =============================================================

  readonly users = this.userStore.users;

  readonly loading = this.userStore.loading;

  protected readonly saving = signal(false);

  protected readonly deleting = signal(false);

  readonly error = this.userStore.error;

  protected readonly resettingUserId = signal<string | null>(null);

  /**
   * Prevent duplicate sign-out requests
   * while Firebase processes the request.
   */
  protected readonly signingOut = signal(false);

  // =============================================================
  // SEARCH
  // =============================================================

  /**
   * Search text is a signal so the computed
   * filteredUsers() value automatically
   * recalculates as the user types.
   */
  protected readonly searchTerm = signal('');

  /** Table or cards, saved per admin (the user form opens in a dialog). */
  protected readonly viewState = adminViewState('users');

  /**
   * Users matching the current search.
   */
  protected readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    const allUsers = this.users();

    // No search = return all users.
    if (!search) {
      return allUsers;
    }

    return allUsers.filter((user) => {
      const searchableValues = [
        user.displayName,
        user.preferredName,
        user.firstName,
        user.lastName,
        user.email,
        user.platformRole,
        user.phone,
        user.countryOfOrigin,
        user.currentCountry,
        user.city,
        user.state,
        user.postalCode,
        user.preferredLanguage,
      ];

      return searchableValues.some((value) => value?.toString().toLowerCase().includes(search));
    });
  });

  // =============================================================
  // FORM STATE
  // =============================================================

  protected readonly showForm = signal(false);

  protected readonly editingUser = signal<User | null>(null);

  protected readonly userToDelete = signal<User | null>(null);

  protected form = this.createEmptyForm();

  // =============================================================
  // INITIALIZATION
  // =============================================================

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  // =============================================================
  // LOAD USERS
  // =============================================================

  /**
   * Load all user profiles from the User Store.
   */
  private async loadUsers(): Promise<void> {
    try {
      await this.userStore.loadUsers();
    } catch (error) {
      console.error('Failed to load users:', error);

      this.toast.error('Unable to load users.');
    }
  }

  // =============================================================
  // SEARCH
  // =============================================================

  /**
   * Clear the current search.
   */
  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  // =============================================================
  // CREATE FORM
  // =============================================================

  /**
   * Open the create-user form.
   */
  protected openCreateForm(): void {
    this.editingUser.set(null);

    this.form = this.createEmptyForm();

    this.userStore.clearError();

    this.showForm.set(true);
  }

  // =============================================================
  // EDIT FORM
  // =============================================================

  /**
   * Open the edit form for an existing user.
   */
  protected openEditForm(user: User): void {
    this.editingUser.set(user);

    this.form = {
      displayName: user.displayName ?? '',

      email: user.email ?? '',

      platformRole: user.platformRole,

      password: '',
      confirmPassword: '',

      firstName: user.firstName ?? '',

      lastName: user.lastName ?? '',

      preferredName: user.preferredName ?? '',

      phone: user.phone ?? '',

      countryOfOrigin: user.countryOfOrigin ?? '',

      currentCountry: user.currentCountry ?? '',

      city: user.city ?? '',

      state: user.state ?? '',

      postalCode: user.postalCode ?? '',

      preferredLanguage: user.preferredLanguage ?? '',

      bio: user.bio ?? '',

      website: user.website ?? '',
    };

    this.userStore.clearError();

    this.showForm.set(true);
  }

  // =============================================================
  // CLOSE FORM
  // =============================================================

  /**
   * Close the create/edit form.
   */
  protected closeForm(): void {
    if (this.saving()) {
      return;
    }

    this.showForm.set(false);
    this.editingUser.set(null);

    this.form = this.createEmptyForm();
  }

  // =============================================================
  // SAVE USER
  // =============================================================

  /**
   * Create or update a user.
   *
   * New users are created through the secure
   * Firebase Functions backend.
   *
   * Existing users update their Firestore profile.
   */
  protected async saveUser(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const displayName = this.form.displayName.trim();

    const email = this.form.email.trim();

    const editingUser = this.editingUser();

    // -----------------------------------------------------------
    // Basic validation
    // -----------------------------------------------------------

    if (!displayName) {
      this.toast.error('Display name is required.');

      return;
    }

    if (!email) {
      this.toast.error('Email address is required.');

      return;
    }

    // -----------------------------------------------------------
    // New-user password validation
    // -----------------------------------------------------------

    if (!editingUser) {
      if (!this.form.password) {
        this.toast.error('Password is required.');

        return;
      }

      if (this.form.password.length < 6) {
        this.toast.error('Password must be at least 6 characters.');

        return;
      }

      if (this.form.password !== this.form.confirmPassword) {
        this.toast.error('Passwords do not match.');

        return;
      }
    }

    this.saving.set(true);

    try {
      // =========================================================
      // CREATE
      // =========================================================

      if (!editingUser) {
        await this.userStore.createUser({
          email,

          password: this.form.password,

          displayName,

          platformRole: this.form.platformRole,

          firstName: this.clean(this.form.firstName),

          lastName: this.clean(this.form.lastName),

          preferredName: this.clean(this.form.preferredName),

          phone: this.clean(this.form.phone),

          countryOfOrigin: this.clean(this.form.countryOfOrigin),

          currentCountry: this.clean(this.form.currentCountry),

          city: this.clean(this.form.city),

          state: this.clean(this.form.state),

          postalCode: this.clean(this.form.postalCode),

          preferredLanguage: this.clean(this.form.preferredLanguage),

          bio: this.clean(this.form.bio),

          website: this.clean(this.form.website),
        });

        this.toast.success('User created successfully.');

        await this.loadUsers();

        // Close the user form after successful creation.
        this.showForm.set(false);

        return;
      }

      // =========================================================
      // UPDATE
      // =========================================================

      const profile: Partial<User> = {
        displayName,

        email,

        platformRole: this.form.platformRole,

        firstName: this.clean(this.form.firstName),

        lastName: this.clean(this.form.lastName),

        preferredName: this.clean(this.form.preferredName),

        phone: this.clean(this.form.phone),

        countryOfOrigin: this.clean(this.form.countryOfOrigin),

        currentCountry: this.clean(this.form.currentCountry),

        city: this.clean(this.form.city),

        state: this.clean(this.form.state),

        postalCode: this.clean(this.form.postalCode),

        preferredLanguage: this.clean(this.form.preferredLanguage),

        bio: this.clean(this.form.bio),

        website: this.clean(this.form.website),
      };

      await this.userStore.updateUser(editingUser.id, profile);

      this.toast.success('User updated successfully.');

      await this.loadUsers();

      this.showForm.set(false);
    } catch (error) {
      console.error('Failed to save user:', error);

      this.toast.error(this.getUserErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }

  // =============================================================
  // DELETE CONFIRMATION
  // =============================================================

  /**
   * Open the delete confirmation.
   */
  protected confirmDelete(user: User): void {
    this.userToDelete.set(user);
  }

  /**
   * Cancel delete.
   */
  protected cancelDelete(): void {
    if (this.deleting()) {
      return;
    }

    this.userToDelete.set(null);
  }

  // =============================================================
  // DELETE USER
  // =============================================================

  /**
   * Delete the user's Firestore profile.
   *
   * Firebase Authentication deletion will be
   * connected through the secure backend later.
   */
  protected async deleteUser(): Promise<void> {
    const user = this.userToDelete();

    if (!user || this.deleting()) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.userStore.deleteUser(user.id);

      this.toast.success('User profile deleted successfully.');

      this.userToDelete.set(null);

      await this.loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);

      this.toast.error('Unable to delete user profile.');
    } finally {
      this.deleting.set(false);
    }
  }

  /**
   * Generate a password-reset link for the selected user.
   *
   * The secure operation is performed by the Firebase Function.
   */
  protected async resetUserPassword(user: User): Promise<void> {
    if (this.resettingUserId()) {
      return;
    }

    const confirmed = window.confirm(`Send a password reset email to ${user.email}?`);

    if (!confirmed) {
      return;
    }

    this.resettingUserId.set(user.id);

    try {
      const result = await this.userStore.resetUserPassword(user.id);

      console.log('Password reset link generated for:', result.email);

      this.toast.success(`Password reset link generated for ${result.email}.`);
    } catch (error) {
      console.error('Failed to reset user password:', error);

      this.toast.error(this.getUserErrorMessage(error));
    } finally {
      this.resettingUserId.set(null);
    }
  }

  /**
   * Sign the administrator out of Firebase,
   * show feedback, and return to the login page.
   */
  protected async signOut(): Promise<void> {
    /**
     * Prevent multiple sign-out requests
     * from repeated button clicks.
     */
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);

    try {
      /**
       * Sign out through the existing
       * authentication service.
       */
      await this.authService.logout();

      /**
       * Show confirmation to the administrator.
       */
      this.toast.success('You have been signed out.');

      /**
       * Return to the login page.
       */
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);

      this.toast.error('Unable to sign out. Please try again.');
    } finally {
      this.signingOut.set(false);
    }
  }

  // =============================================================
  // HELPERS
  // =============================================================

  /**
   * Convert Firebase Function errors
   * into user-friendly messages.
   */
  private getUserErrorMessage(error: unknown): string {
    const firebaseError = error as {
      code?: string;
      message?: string;
    };

    switch (firebaseError?.code) {
      case 'functions/already-exists':
        return 'A user with this email address already exists.';

      case 'functions/invalid-argument':
        return firebaseError.message || 'The information provided is invalid.';

      case 'functions/permission-denied':
        return 'You do not have permission to perform this action.';

      case 'functions/unauthenticated':
        return 'Your session has expired. Please sign in again.';

      default:
        return firebaseError?.message || 'Unable to save user. Please try again.';
    }
  }

  /**
   * Return initials for a user avatar.
   */
  protected initials(value: string | null | undefined): string {
    if (!value) {
      return '?';
    }

    const parts = value.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Format the user's location.
   */
  protected locationLabel(user: User): string {
    const parts = [user.city, user.state, user.currentCountry].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : '—';
  }

  /**
   * Remove unnecessary whitespace.
   */
  private clean(value: string): string {
    return value.trim();
  }

  /**
   * Create a blank user form.
   */
  private createEmptyForm(): UserForm {
    return {
      displayName: '',
      email: '',
      platformRole: undefined,

      password: '',
      confirmPassword: '',

      firstName: '',
      lastName: '',
      preferredName: '',
      phone: '',

      countryOfOrigin: '',
      currentCountry: '',
      city: '',
      state: '',
      postalCode: '',

      preferredLanguage: '',

      bio: '',
      website: '',
    };
  }
}

/**
 * Form-only model.
 *
 * Keeping this separate from User prevents
 * accidental changes to id and timestamps.
 */
interface UserForm {
  displayName: string;
  email: string;
  platformRole?: PlatformRole;

  password: string;
  confirmPassword: string;

  firstName: string;
  lastName: string;
  preferredName: string;
  phone: string;

  countryOfOrigin: string;
  currentCountry: string;
  city: string;
  state: string;
  postalCode: string;

  preferredLanguage: string;

  bio: string;
  website: string;
}

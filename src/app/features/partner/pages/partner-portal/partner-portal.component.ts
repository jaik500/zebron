import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-partner-portal',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">

      <!-- HEADER -->
      <header class="border-b border-white/10 bg-[#032D42]">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <p class="text-sm font-medium text-white/60">
            Partner Portal
          </p>

          <h1 class="mt-1 text-3xl font-bold text-white">
            Select an Organization
          </h1>

          <p class="mt-2 max-w-2xl text-sm text-white/70">
            Choose the organization you want to manage or access.
          </p>

        </div>
      </header>

      <!-- CONTENT -->
      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        @if (context.loading()) {

          <section
            class="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm"
          >
            <mat-icon class="!h-10 !w-10 !text-4xl">
              sync
            </mat-icon>

            <p class="mt-4 text-sm text-gray-600">
              Loading your organizations...
            </p>
          </section>

        } @else if (context.error()) {

          <section
            class="rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <div class="flex gap-4">

              <mat-icon class="text-red-600">
                error_outline
              </mat-icon>

              <div>
                <h2 class="font-semibold text-red-900">
                  Partner access unavailable
                </h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ context.error() }}
                </p>

                <button
                  type="button"
                  mat-stroked-button
                  class="mt-4"
                  (click)="initialize()"
                >
                  Try Again
                </button>
              </div>

            </div>
          </section>

        } @else if (context.organizations().length === 0) {

          <section
            class="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm"
          >
            <mat-icon class="!h-12 !w-12 !text-5xl text-gray-400">
              business
            </mat-icon>

            <h2 class="mt-4 text-xl font-semibold text-gray-900">
              No organizations available
            </h2>

            <p class="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Your account is not currently associated with an active
              partner organization.
            </p>
          </section>

        } @else {

          <div class="mb-6">
            <h2 class="text-xl font-bold text-gray-900">
              Your Organizations
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Select an organization to enter its partner dashboard.
            </p>
          </div>

          <div
            class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >

            @for (
              organization of context.organizations();
              track organization.id
            ) {

              <a
                [routerLink]="[
                  '/partner/org',
                  organization.id,
                  'dashboard'
                ]"
                class="
                  group block overflow-hidden rounded-2xl
                  border border-gray-200 bg-white
                  shadow-sm transition-all
                  hover:-translate-y-1 hover:border-[#2a835f]
                  hover:shadow-lg
                "
              >

                <!-- Card header -->
                <div
                  class="
                    flex h-28 items-center justify-center
                    bg-gradient-to-br from-[#032D42] to-[#2a835f]
                  "
                >
                  <div
                    class="
                      flex h-16 w-16 items-center justify-center
                      rounded-2xl bg-white/15
                      text-2xl font-bold text-white
                      ring-1 ring-white/20
                    "
                  >
                    {{ organizationInitials(organization.name) }}
                  </div>
                </div>

                <!-- Card body -->
                <div class="p-5">

                  <div class="flex items-start justify-between gap-3">

                    <div class="min-w-0">

                      <h3
                        class="
                          truncate text-lg font-bold
                          text-gray-900
                          group-hover:text-[#2a835f]
                        "
                      >
                        {{ organization.name }}
                      </h3>

                      <p class="mt-1 text-sm text-gray-500">
                        Partner organization
                      </p>

                    </div>

                    <mat-icon
                      class="
                        shrink-0 text-gray-400
                        transition-transform
                        group-hover:translate-x-1
                        group-hover:text-[#2a835f]
                      "
                    >
                      arrow_forward
                    </mat-icon>

                  </div>

                  <div
                    class="
                      mt-5 flex items-center justify-between
                      border-t border-gray-100 pt-4
                    "
                  >

                    <span class="text-xs font-medium text-gray-500">
                      {{ roleFor(organization.id) }}
                    </span>

                    <span
                      class="
                        inline-flex items-center gap-1
                        text-sm font-semibold text-[#2a835f]
                      "
                    >
                      Enter
                      <mat-icon class="!h-4 !w-4 !text-base">
                        login
                      </mat-icon>
                    </span>

                  </div>

                </div>

              </a>

            }

          </div>

        }

      </main>

    </div>
  `,
})
export class PartnerPortalComponent implements OnInit {

  protected readonly context =
    inject(PartnerOrganizationContextService);

  private readonly pageTitleService =
    inject(PageTitleService);

  async ngOnInit(): Promise<void> {
    await this.initialize();

    this.pageTitleService.setTitle(
      'Partner Portal',
    );
  }

  protected async initialize(): Promise<void> {
    try {
      await this.context.initialize();
    } catch {
      // Context exposes the user-facing error.
    }
  }

  protected organizationInitials(
    name: string | null | undefined,
  ): string {
    const value = name?.trim() || 'Organization';

    const words = value
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  }

protected roleFor(
  organizationId: string,
): string {
  const role = this.context
    .memberships()
    .find(
      membership =>
        membership.organizationId === organizationId &&
        membership.active === true,
    )?.role;

  switch (role) {
    case 'org_owner':
      return 'Owner';

    case 'org_admin':
      return 'Administrator';

    case 'org_manager':
      return 'Manager';

    case 'org_staff':
      return 'Staff';

    case 'org_member':
      return 'Member';

    default:
      return 'Member';
  }
}
}
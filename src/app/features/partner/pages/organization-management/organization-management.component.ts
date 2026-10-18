import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { OrganizationContextStore  } from '../../../organizations/stores/organization-context.store';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';
import { PageTitleService } from '../../../../core/services/page-title.service';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'dashboard']"
            class="text-sm text-white/80 transition hover:text-white"
          >
            ← Organization Dashboard
          </a>
          <h1 class="mt-2 text-2xl font-bold text-white">Organization Management</h1>
          <p class="mt-1 text-sm text-white/80">
            Review organization setup and configuration status.
          </p>
        </div>
      </header>

      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        @if (organizationStore.contextLoading() || organizationStore.onboardingLoading() || organizationStore.settingsLoading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Loading organization management details…
          </section>
        } @else if (organizationStore.contextError()) {
          <section class="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h2 class="font-semibold text-red-800">Unable to load organization</h2>
            <p class="mt-2 text-sm text-red-700">{{ organizationStore.contextError() }}</p>
          </section>
        } @else {
          <section class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-[#007979]">Organization</p>
            <h2 class="mt-1 text-2xl font-bold text-gray-900">
              {{ organizationStore.selectedOrganization()?.name ?? 'Organization' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500">
              These statuses reflect the organization's core onboarding workflow and saved settings.
            </p>
          </section>

          <div class="grid gap-5 lg:grid-cols-2">
            <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  [class.bg-emerald-50]="setupComplete()"
                  [class.text-emerald-700]="setupComplete()"
                  [class.bg-amber-50]="!setupComplete()"
                  [class.text-amber-700]="!setupComplete()"
                >
                  <mat-icon>{{ setupComplete() ? 'task_alt' : 'pending_actions' }}</mat-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-gray-900">Organization Setup</h3>
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold"
                      [class.bg-emerald-50]="setupComplete()"
                      [class.text-emerald-700]="setupComplete()"
                      [class.bg-amber-50]="!setupComplete()"
                      [class.text-amber-800]="!setupComplete()"
                    >
                      {{ setupComplete() ? 'Completed' : 'In progress' }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">
                    @if (setupComplete()) {
                      All four core organization onboarding steps are complete.
                    } @else {
                      Complete the organization profile, owner profile, member invitations, and configuration steps.
                    }
                  </p>
                  @if (!setupComplete() && canManageOrganization()) {
                    <a
                      mat-flat-button
                      class="mt-4 !bg-[#007979] !text-white"
                      [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'onboarding']"
                    >
                      <mat-icon>checklist</mat-icon>
                      Continue setup
                    </a>
                  }
                </div>
              </div>
            </section>

            @if (canManageOrganization()) {
              <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div class="flex items-start gap-4">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    [class.bg-emerald-50]="configurationSaved()"
                    [class.text-emerald-700]="configurationSaved()"
                    [class.bg-amber-50]="!configurationSaved()"
                    [class.text-amber-700]="!configurationSaved()"
                  >
                    <mat-icon>{{ configurationSaved() ? 'settings_suggest' : 'settings' }}</mat-icon>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="font-semibold text-gray-900">Configuration</h3>
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class.bg-emerald-50]="configurationSaved()"
                        [class.text-emerald-700]="configurationSaved()"
                        [class.bg-amber-50]="!configurationSaved()"
                        [class.text-amber-800]="!configurationSaved()"
                      >
                        {{ configurationSaved() ? 'Configured' : 'Not configured' }}
                      </span>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">
                      @if (configurationSaved()) {
                        Organization settings are available, including registration, default member role, administrator notifications, and branding colors.
                      } @else {
                        Organization settings have not been saved yet.
                      }
                    </p>
                    <a
                      mat-flat-button
                      class="mt-4 !bg-[#007979] !text-white"
                      [routerLink]="['/partner/org', organizationStore.selectedOrganizationId(), 'onboarding']"
                    >
                      <mat-icon>tune</mat-icon>
                      {{ configurationSaved() ? 'Update configuration' : 'Configure organization' }}
                    </a>
                  </div>
                </div>
              </section>
            }
          </div>

          @if (!canManageOrganization()) {
            <p class="mt-5 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Configuration status is visible only to organization owners and administrators.
            </p>
          }
        }
      </div>
    </main>
  `,
})
export class OrganizationManagementComponent implements OnInit {
  protected readonly organizationStore = inject(OrganizationContextStore );
  private readonly access = inject(PartnerAccessService);
  private readonly route = inject(ActivatedRoute);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly canManageOrganization = computed(() => {
    const role = this.access.role();
    return role === 'org_owner' || role === 'org_admin';
  });

  protected readonly setupComplete = computed(
    () => this.organizationStore.onboarding()?.status === 'completed',
  );

  protected readonly configurationSaved = computed(() => {
    const settings = this.organizationStore.settings();
    return !!settings && !this.organizationStore.settingsLoading() && !this.organizationStore.settingsError();
  });

  async ngOnInit(): Promise<void> {
    const organizationId = this.route.snapshot.paramMap.get('organizationId');
    if (!organizationId) return;

    try {
      await this.organizationStore.loadOrganizationContext(organizationId);
      this.pageTitleService.setTitle('Organization Management');
    } catch {
      // OrganizationStore exposes the user-facing error state.
    }
  }
}

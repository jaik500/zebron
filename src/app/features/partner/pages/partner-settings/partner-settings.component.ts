import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { OrganizationContextStore  } from '../../../organizations/stores/organization-context.store';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { PartnerSettingsService } from '../../services/partner-settings.service';
import {
  PartnerOrganizationSettings,
  PartnerCourseVisibility,
} from '../../models/partner-organization-settings.model';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-partner-settings',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 mt-10">

      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white shadow-sm">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            class="flex min-h-16 items-center justify-between gap-4"
          >
            <div class="min-w-0">

              <div
                class="flex items-center gap-2 text-sm text-white/80"
              >
                <a
                  routerLink="/partner/admin"
                  class="transition hover:text-white"
                >
                  {{ 'Administration' | t }}
                </a>

                <mat-icon
                  class="!h-4 !w-4 !text-[16px]"
                >
                  chevron_right
                </mat-icon>

                <span class="text-white">
                  {{ 'Settings' | t }}
                </span>
              </div>

              <h1
                class="mt-1 truncate text-xl font-semibold sm:text-2xl"
              >
                {{ 'Organization settings' | t }}
              </h1>
            </div>

            <a
              mat-stroked-button
              routerLink="/partner/admin"
              class="!border-white/50 !text-white"
            >
              <mat-icon>arrow_back</mat-icon>
              {{ 'Administration' | t }}
            </a>
          </div>
        </div>
      </header>

      <!-- =========================================================
           MAIN
           ========================================================= -->

      <main
        class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >

        <!-- =======================================================
             LOADING
             ======================================================= -->

        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-center">
              <mat-icon
                class="mb-3 !h-10 !w-10 !text-[40px] animate-spin"
              >
                sync
              </mat-icon>

              <p class="text-sm text-slate-600">
                {{ 'Loading organization settings...' | t }}
              </p>
            </div>
          </div>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->

        @else if (errorMessage()) {
          <section
            class="rounded-xl border border-red-200 bg-red-50 p-6"
          >
            <div class="flex items-start gap-3">

              <mat-icon class="text-red-600">
                error_outline
              </mat-icon>

              <div>
                <h2 class="font-semibold text-red-900">
                  {{ 'Unable to load settings' | t }}
                </h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ errorMessage() | t }}
                </p>

                <button
                  mat-stroked-button
                  type="button"
                  class="mt-4"
                  (click)="initialize()"
                >
                  {{ 'Retry' | t }}
                </button>
              </div>
            </div>
          </section>
        }

        <!-- =======================================================
             SETTINGS
             ======================================================= -->

        @else {
          <!-- Organization context -->

          <section
            class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {{ 'Organization' | t }}
                </p>

                <h2
                  class="mt-1 text-xl font-semibold text-slate-900"
                >
                  {{ organizationName() }}
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                  {{ 'Configure settings for your organization and partner portal.' | t }}
                </p>
              </div>

              <div
                class="rounded-lg bg-slate-100 px-4 py-3"
              >
                <p class="text-xs text-slate-500">
                  {{ 'Access level' | t }}
                </p>

                <p class="font-medium text-slate-800">
                  {{ roleLabel() | t }}
                </p>
              </div>
            </div>
          </section>

          <!-- Settings navigation -->

          <div class="grid gap-6 lg:grid-cols-3">

            <!-- =================================================
                 SIDEBAR
                 ================================================= -->

            <aside class="lg:col-span-1">
              <div
                class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <p
                  class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {{ 'Settings' | t }}
                </p>

                @for (
                  section of sections;
                  track section.id
                ) {
                  <button
                    type="button"
                    class="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition"
                    [class.bg-emerald-50]="
                      activeSection() === section.id
                    "
                    [class.text-emerald-800]="
                      activeSection() === section.id
                    "
                    [class.text-slate-700]="
                      activeSection() !== section.id
                    "
                    (click)="selectSection(section.id)"
                  >
                    <mat-icon class="mt-0.5">
                      {{ section.icon }}
                    </mat-icon>

                    <span class="min-w-0">
                      <span class="block font-medium">
                        {{ section.title | t }}
                      </span>

                      <span
                        class="mt-0.5 block text-xs text-slate-500"
                      >
                        {{ section.description | t }}
                      </span>
                    </span>
                  </button>
                }
              </div>
            </aside>

            <!-- =================================================
                 CONTENT
                 ================================================= -->

            <section class="lg:col-span-2">

              @switch (activeSection()) {

                <!-- =============================================
                     ORGANIZATION
                     ============================================= -->

                @case ('organization') {
                  <div class="settings-panel">

                    <div class="settings-heading">
                      <mat-icon>
                        business
                      </mat-icon>

                      <div>
                        <h2>
                          {{ 'Organization' | t }}
                        </h2>

                        <p>
                          {{ 'View and manage organization-level information.' | t }}
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <div class="field">
                        <mat-form-field appearance="outline" class="zb-field">
                          <mat-label>{{ 'Organization name' | t }}</mat-label>
                          <input matInput
                          type="text"
                          [value]="organizationName()"
                          disabled
                        />
                          <mat-hint>{{ 'Organization identity is managed by the platform.' | t }}</mat-hint>
                        </mat-form-field>
                      </div>

                      <div class="field">
                        <label>
                          {{ 'Organization status' | t }}
                        </label>

                        <div class="status-badge">
                          <span class="status-dot"></span>
                          {{ 'Active' | t }}
                        </div>
                      </div>

                    </div>
                  </div>
                }

                <!-- =============================================
                     TEST CENTER
                     ============================================= -->

                @case ('test-center') {
                  <div class="settings-panel">

                    <div class="settings-heading">
                      <mat-icon>
                        school
                      </mat-icon>

                      <div>
                        <h2>
                          {{ 'Test Center' | t }}
                        </h2>

                        <p>
                          {{ 'Configure testing behavior for your organization.' | t }}
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Enable Test Center -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Enable Test Center' | t }}
                          </h3>

                          <p>
                            {{ 'Allow members of this organization to access Test Center resources.' | t }}
                          </p>
                        </div>

                        <mat-slide-toggle
                          [(ngModel)]="settings.testCenter.enabled"
                          [disabled]="!canEditSettings()"
                          [attr.aria-label]="'Enable Test Center' | t"
                        ></mat-slide-toggle>
                      </div>

                      <!-- Member testing -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Allow member testing' | t }}
                          </h3>

                          <p>
                            {{ 'Allow organization members to take available tests.' | t }}
                          </p>
                        </div>

                        <mat-slide-toggle
                          [(ngModel)]="settings.testCenter.allowMemberTesting"
                          [disabled]="!canEditSettings()"
                          [attr.aria-label]="'Allow member testing' | t"
                        ></mat-slide-toggle>
                      </div>

                      <!-- Course visibility -->

                      <div class="field">
                        <mat-form-field appearance="outline" class="zb-field">
                          <mat-label>{{ 'Course visibility' | t }}</mat-label>
                          <mat-select
                          [(ngModel)]="
                            settings.testCenter.courseVisibility
                          "
                          [disabled]="!canEditSettings()"
                        >
                          <mat-option value="organization">
                            {{ 'Organization courses only' | t }}
                          </mat-option>

                          <mat-option value="all">
                            {{ 'Organization and public courses' | t }}
                          </mat-option>
                        </mat-select>
                        </mat-form-field>
                      </div>

                    </div>
                  </div>
                }

                <!-- =============================================
                     MEMBERS
                     ============================================= -->

                @case ('members') {
                  <div class="settings-panel">

                    <div class="settings-heading">
                      <mat-icon>
                        groups
                      </mat-icon>

                      <div>
                        <h2>
                          {{ 'Members' | t }}
                        </h2>

                        <p>
                          {{ 'Configure organization member behavior.' | t }}
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Self registration -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Member self-registration' | t }}
                          </h3>

                          <p>
                            {{ 'Allow users to request membership in this organization.' | t }}
                          </p>
                        </div>

                        <mat-slide-toggle
                          [(ngModel)]="settings.members.allowSelfRegistration"
                          [disabled]="!canEditSettings()"
                          [attr.aria-label]="'Member self-registration' | t"
                        ></mat-slide-toggle>
                      </div>

                      <!-- Default role -->

                      <div class="field">
                        <mat-form-field appearance="outline" class="zb-field">
                          <mat-label>{{ 'Default member role' | t }}</mat-label>
                          <mat-select
                          [(ngModel)]="
                            settings.members.defaultMemberRole
                          "
                          [disabled]="!canEditSettings()"
                        >
                          <mat-option value="org_member">
                            {{ 'Member' | t }}
                          </mat-option>

                          <mat-option value="org_manager">
                            {{ 'Manager' | t }}
                          </mat-option>
                        </mat-select>
                        </mat-form-field>
                      </div>

                    </div>
                  </div>
                }

                <!-- =============================================
                     NOTIFICATIONS
                     ============================================= -->

                @case ('notifications') {
                  <div class="settings-panel">

                    <div class="settings-heading">
                      <mat-icon>
                        notifications
                      </mat-icon>

                      <div>
                        <h2>
                          {{ 'Notifications' | t }}
                        </h2>

                        <p>
                          {{ 'Configure administrative and member notifications.' | t }}
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Administrative notifications -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Administrative notifications' | t }}
                          </h3>

                          <p>
                            {{ 'Receive important organization administration notifications.' | t }}
                          </p>
                        </div>

                        <mat-slide-toggle
                          [(ngModel)]="settings.notifications.adminNotifications"
                          [disabled]="!canEditSettings()"
                          [attr.aria-label]="'Administrative notifications' | t"
                        ></mat-slide-toggle>
                      </div>

                      <!-- Test results -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Test result notifications' | t }}
                          </h3>

                          <p>
                            {{ 'Receive notifications related to member test results.' | t }}
                          </p>
                        </div>

                        <mat-slide-toggle
                          [(ngModel)]="settings.notifications.testResultNotifications"
                          [disabled]="!canEditSettings()"
                          [attr.aria-label]="'Test result notifications' | t"
                        ></mat-slide-toggle>
                      </div>

                    </div>
                  </div>
                }

                <!-- =============================================
                     SECURITY
                     ============================================= -->

                @case ('security') {
                  <div class="settings-panel">

                    <div class="settings-heading">
                      <mat-icon>
                        security
                      </mat-icon>

                      <div>
                        <h2>
                          {{ 'Security' | t }}
                        </h2>

                        <p>
                          {{ 'Review organization-level security behavior.' | t }}
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Organization administrators' | t }}
                          </h3>

                          <p>
                            {{ 'Only authorized organization administrators can modify partner settings.' | t }}
                          </p>
                        </div>

                        <mat-icon class="text-emerald-600">
                          verified_user
                        </mat-icon>
                      </div>

                      <div class="setting-row">
                        <div>
                          <h3>
                            {{ 'Organization isolation' | t }}
                          </h3>

                          <p>
                            {{ 'Organization resources remain scoped to the current organization.' | t }}
                          </p>
                        </div>

                        <mat-icon class="text-emerald-600">
                          shield
                        </mat-icon>
                      </div>

                    </div>
                  </div>
                }

              }

              <!-- =================================================
                   SAVE
                   ================================================= -->

              <div
                class="mt-6 flex flex-col items-end gap-2 sm:flex-row sm:justify-end"
              >

                @if (!canEditSettings()) {
                  <p
                    class="mr-auto text-sm text-slate-500"
                  >
                    {{ 'Only organization owners and administrators can modify these settings.' | t }}
                  </p>
                }

                <button
                  mat-flat-button
                  type="button"
                  class="!bg-[#2a835f] !text-white"
                  [disabled]="
                    isSaving() || !canEditSettings()
                  "
                  (click)="saveSettings()"
                >
                  <mat-icon>
                    {{ isSaving() ? 'sync' : 'save' }}
                  </mat-icon>

                  {{
                    isSaving()
                      ? ('Saving...' | t)
                      : ('Save Settings' | t)
                  }}
                </button>

              </div>

            </section>
          </div>
        }
      </main>
    </div>
  `,

  styles: [`
    :host {
      display: block;
    }

    .settings-panel {
      overflow: hidden;
      border: 1px solid rgb(226 232 240);
      border-radius: 1rem;
      background: white;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
    }

    .settings-heading {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1.5rem;
      border-bottom: 1px solid rgb(226 232 240);
    }

    .settings-heading > mat-icon {
      color: #2a835f;
    }

    .settings-heading h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: rgb(15 23 42);
    }

    .settings-heading p {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: rgb(100 116 139);
    }

    .settings-content {
      padding: 1.5rem;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgb(241 245 249);
    }

    .setting-row:first-child {
      padding-top: 0;
    }

    .setting-row:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .setting-row h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: rgb(30 41 59);
    }

    .setting-row p {
      margin: 0.25rem 0 0;
      max-width: 38rem;
      font-size: 0.8125rem;
      line-height: 1.4;
      color: rgb(100 116 139);
    }

    .field {
      margin-bottom: 0.25rem;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    .field label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: rgb(51 65 85);
    }




    .field p {
      margin-top: 0.375rem;
      font-size: 0.75rem;
      color: rgb(100 116 139);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 9999px;
      background: rgb(220 252 231);
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: rgb(22 101 52);
    }

    .status-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background: rgb(34 197 94);
    }







  `],
})
export class PartnerSettingsComponent implements OnInit {
 protected readonly organizationStore =
  inject(OrganizationContextStore );

  private readonly settingsService =
    inject(PartnerSettingsService);

  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly toast =
    inject(HotToastService);

    private readonly route =
  inject(ActivatedRoute);

  protected readonly isLoading =
    signal(true);

  protected readonly isSaving =
    signal(false);

  protected readonly errorMessage =
    signal<string | null>(null);

  protected readonly activeSection =
    signal('organization');

 protected readonly organizationName =
  computed(
    () =>
      this.organizationStore.selectedOrganization()?.name ??
      'Partner',
  );

  protected readonly roleLabel =
    computed(() => {
      const role =
        this.organizationStore.organizationRole();

      switch (role) {
        case 'org_owner':
          return 'Owner';

        case 'org_admin':
          return 'Administrator';

        case 'org_manager':
          return 'Manager';

        case 'org_member':
          return 'Member';

        case 'org_staff':
          return 'Staff';

        default:
          return 'Partner';
      }
    });

  private readonly access = inject(
  PartnerAccessService,
);

protected readonly canEditSettings = computed(
  () => this.access.canManageSettings(),
);
  protected readonly sections:
    SettingsSection[] = [
      {
        id: 'organization',
        title: 'Organization',
        description:
          'Organization information and status.',
        icon: 'business',
      },
      {
        id: 'test-center',
        title: 'Test Center',
        description:
          'Testing and course behavior.',
        icon: 'school',
      },
      {
        id: 'members',
        title: 'Members',
        description:
          'Membership and access behavior.',
        icon: 'groups',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description:
          'Administrative notifications.',
        icon: 'notifications',
      },
      {
        id: 'security',
        title: 'Security',
        description:
          'Organization security controls.',
        icon: 'security',
      },
    ];

  protected settings:
    PartnerOrganizationSettings =
      this.createDefaultSettings();

  async ngOnInit(): Promise<void> {
    await this.initialize();
  }

  protected async initialize(): Promise<void> {
  this.isLoading.set(true);
  this.errorMessage.set(null);

  try {
    const organizationId =
      this.route.snapshot.paramMap.get('organizationId');

    if (!organizationId) {
      throw new Error(
        'Organization ID is missing from the URL.',
      );
    }

    await this.organizationStore.loadOrganizationContext(
      organizationId,
    );

    this.pageTitleService.setDocumentTitle(
      `${this.organizationName()} Settings`,
    );

    this.settings =
      await this.settingsService.getSettings(
        organizationId,
      );
  } catch (error) {
    console.error(
      'Failed to initialize partner settings:',
      error,
    );

    this.errorMessage.set(
      error instanceof Error
        ? error.message
        : 'The organization settings could not be loaded.',
    );
  } finally {
    this.isLoading.set(false);
  }
}

  protected selectSection(
    sectionId: string,
  ): void {
    this.activeSection.set(sectionId);
  }

  protected async saveSettings(): Promise<void> {
    const organizationId =
      this.organizationStore.selectedOrganizationId();

    if (!organizationId) {
      this.toast.error(
        'No partner organization is selected.',
      );
      return;
    }

    if (!this.canEditSettings()) {
      this.toast.error(
        'You do not have permission to modify organization settings.',
      );
      return;
    }

    this.isSaving.set(true);

    try {
      this.settings = {
        ...this.settings,
        organizationId,
      };

      await this.settingsService.saveSettings(
        this.settings,
      );

      this.toast.success(
        'Organization settings saved.',
      );
    } catch (error) {
      console.error(
        'Failed to save partner settings:',
        error,
      );

      this.toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to save organization settings.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private createDefaultSettings():
    PartnerOrganizationSettings {
    return {
      organizationId: '',

      testCenter: {
        enabled: true,
        allowMemberTesting: true,
        courseVisibility:
          'all' as PartnerCourseVisibility,
      },

      members: {
        allowSelfRegistration: false,
        defaultMemberRole: 'org_member',
      },

      notifications: {
        adminNotifications: true,
        testResultNotifications: true,
      },

      updatedAt: null,
      updatedBy: '',
    };
  }
}
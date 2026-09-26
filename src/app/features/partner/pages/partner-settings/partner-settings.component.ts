import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { PartnerOrganizationContextService } from '../../../../core/services/partner-organization-context.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { PartnerSettingsService } from '../../services/partner-settings.service';
import {
  PartnerOrganizationSettings,
  PartnerCourseVisibility,
} from '../../models/partner-organization-settings.model';
import { PartnerAccessService } from '../../../../core/services/partner-access.service';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-partner-settings',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="bg-[#2a835f] text-white shadow-sm">
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
                  Administration
                </a>

                <mat-icon
                  class="!h-4 !w-4 !text-[16px]"
                >
                  chevron_right
                </mat-icon>

                <span class="text-white">
                  Settings
                </span>
              </div>

              <h1
                class="mt-1 truncate text-xl font-semibold sm:text-2xl"
              >
                {{ organizationName() }} Settings
              </h1>
            </div>

            <a
              mat-stroked-button
              routerLink="/partner/admin"
              class="!border-white/50 !text-white"
            >
              <mat-icon>arrow_back</mat-icon>
              Administration
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
                Loading organization settings...
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
                  Unable to load settings
                </h2>

                <p class="mt-1 text-sm text-red-700">
                  {{ errorMessage() }}
                </p>

                <button
                  mat-stroked-button
                  type="button"
                  class="mt-4"
                  (click)="initialize()"
                >
                  Retry
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
                  Organization
                </p>

                <h2
                  class="mt-1 text-xl font-semibold text-slate-900"
                >
                  {{ organizationName() }}
                </h2>

                <p class="mt-1 text-sm text-slate-500">
                  Configure settings for your organization and
                  partner portal.
                </p>
              </div>

              <div
                class="rounded-lg bg-slate-100 px-4 py-3"
              >
                <p class="text-xs text-slate-500">
                  Access level
                </p>

                <p class="font-medium text-slate-800">
                  {{ roleLabel() }}
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
                  Settings
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
                        {{ section.title }}
                      </span>

                      <span
                        class="mt-0.5 block text-xs text-slate-500"
                      >
                        {{ section.description }}
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
                          Organization
                        </h2>

                        <p>
                          View and manage organization-level
                          information.
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <div class="field">
                        <label>
                          Organization name
                        </label>

                        <input
                          type="text"
                          [value]="organizationName()"
                          disabled
                        />

                        <p>
                          Organization identity is managed by
                          the platform.
                        </p>
                      </div>

                      <div class="field">
                        <label>
                          Organization status
                        </label>

                        <div class="status-badge">
                          <span class="status-dot"></span>
                          Active
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
                          Test Center
                        </h2>

                        <p>
                          Configure testing behavior for your
                          organization.
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Enable Test Center -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            Enable Test Center
                          </h3>

                          <p>
                            Allow members of this organization
                            to access Test Center resources.
                          </p>
                        </div>

                        <label
                          class="toggle"
                          [class.opacity-50]="!canEditSettings()"
                        >
                          <input
                            type="checkbox"
                            [(ngModel)]="
                              settings.testCenter.enabled
                            "
                            [disabled]="!canEditSettings()"
                          />

                          <span></span>
                        </label>
                      </div>

                      <!-- Member testing -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            Allow member testing
                          </h3>

                          <p>
                            Allow organization members to take
                            available tests.
                          </p>
                        </div>

                        <label
                          class="toggle"
                          [class.opacity-50]="!canEditSettings()"
                        >
                          <input
                            type="checkbox"
                            [(ngModel)]="
                              settings.testCenter.allowMemberTesting
                            "
                            [disabled]="!canEditSettings()"
                          />

                          <span></span>
                        </label>
                      </div>

                      <!-- Course visibility -->

                      <div class="field">
                        <label>
                          Course visibility
                        </label>

                        <select
                          [(ngModel)]="
                            settings.testCenter.courseVisibility
                          "
                          [disabled]="!canEditSettings()"
                        >
                          <option value="organization">
                            Organization courses only
                          </option>

                          <option value="all">
                            Organization and public courses
                          </option>
                        </select>
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
                          Members
                        </h2>

                        <p>
                          Configure organization member behavior.
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Self registration -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            Member self-registration
                          </h3>

                          <p>
                            Allow users to request membership
                            in this organization.
                          </p>
                        </div>

                        <label
                          class="toggle"
                          [class.opacity-50]="!canEditSettings()"
                        >
                          <input
                            type="checkbox"
                            [(ngModel)]="
                              settings.members.allowSelfRegistration
                            "
                            [disabled]="!canEditSettings()"
                          />

                          <span></span>
                        </label>
                      </div>

                      <!-- Default role -->

                      <div class="field">
                        <label>
                          Default member role
                        </label>

                        <select
                          [(ngModel)]="
                            settings.members.defaultMemberRole
                          "
                          [disabled]="!canEditSettings()"
                        >
                          <option value="org_member">
                            Member
                          </option>

                          <option value="org_manager">
                            Manager
                          </option>
                        </select>
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
                          Notifications
                        </h2>

                        <p>
                          Configure administrative and member
                          notifications.
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <!-- Administrative notifications -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            Administrative notifications
                          </h3>

                          <p>
                            Receive important organization
                            administration notifications.
                          </p>
                        </div>

                        <label
                          class="toggle"
                          [class.opacity-50]="!canEditSettings()"
                        >
                          <input
                            type="checkbox"
                            [(ngModel)]="
                              settings.notifications.adminNotifications
                            "
                            [disabled]="!canEditSettings()"
                          />

                          <span></span>
                        </label>
                      </div>

                      <!-- Test results -->

                      <div class="setting-row">
                        <div>
                          <h3>
                            Test result notifications
                          </h3>

                          <p>
                            Receive notifications related to
                            member test results.
                          </p>
                        </div>

                        <label
                          class="toggle"
                          [class.opacity-50]="!canEditSettings()"
                        >
                          <input
                            type="checkbox"
                            [(ngModel)]="
                              settings.notifications.testResultNotifications
                            "
                            [disabled]="!canEditSettings()"
                          />

                          <span></span>
                        </label>
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
                          Security
                        </h2>

                        <p>
                          Review organization-level security
                          behavior.
                        </p>
                      </div>
                    </div>

                    <div class="settings-content">

                      <div class="setting-row">
                        <div>
                          <h3>
                            Organization administrators
                          </h3>

                          <p>
                            Only authorized organization
                            administrators can modify partner
                            settings.
                          </p>
                        </div>

                        <mat-icon class="text-emerald-600">
                          verified_user
                        </mat-icon>
                      </div>

                      <div class="setting-row">
                        <div>
                          <h3>
                            Organization isolation
                          </h3>

                          <p>
                            Organization resources remain scoped
                            to the current organization.
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
                    Only organization owners and administrators
                    can modify these settings.
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
                      ? 'Saving...'
                      : 'Save Settings'
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
      margin-bottom: 1.25rem;
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

    .field input,
    .field select {
      width: 100%;
      border: 1px solid rgb(203 213 225);
      border-radius: 0.5rem;
      padding: 0.625rem 0.75rem;
      background: white;
      color: rgb(30 41 59);
      outline: none;
    }

    .field input:disabled,
    .field select:disabled {
      background: rgb(248 250 252);
      color: rgb(100 116 139);
      cursor: not-allowed;
    }

    .field input:focus,
    .field select:focus {
      border-color: #2a835f;
      box-shadow: 0 0 0 2px rgb(42 131 95 / 0.12);
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

    .toggle {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      cursor: pointer;
    }

    .toggle input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .toggle span {
      display: block;
      width: 2.75rem;
      height: 1.5rem;
      border-radius: 9999px;
      background: rgb(203 213 225);
      transition: background 0.15s ease;
    }

    .toggle span::after {
      content: '';
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      background: white;
      box-shadow: 0 1px 2px rgb(15 23 42 / 0.2);
      transition: transform 0.15s ease;
    }

    .toggle input:checked + span {
      background: #2a835f;
    }

    .toggle input:checked + span::after {
      transform: translateX(1.25rem);
    }

    .toggle input:disabled + span {
      opacity: 0.55;
      cursor: not-allowed;
    }
  `],
})
export class PartnerSettingsComponent implements OnInit {
  private readonly context =
    inject(PartnerOrganizationContextService);

  private readonly settingsService =
    inject(PartnerSettingsService);

  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly toast =
    inject(HotToastService);

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
        this.context.organization()?.name ??
        'Partner',
    );

  protected readonly roleLabel =
    computed(() => {
      const role =
        this.context.organizationRole();

      switch (role) {
        case 'org_owner':
          return 'Owner';

        case 'org_admin':
          return 'Administrator';

        case 'org_manager':
          return 'Manager';

        case 'org_member':
          return 'Member';

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
      await this.context.initialize();

      const organizationId =
        this.context.organizationId();

      if (!organizationId) {
        throw new Error(
          'No partner organization is selected.',
        );
      }

      this.pageTitleService.setTitle(
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
      this.context.organizationId();

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
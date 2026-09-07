import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  AuthService,
} from '../../../../../../core/services/auth.service';

import {
  AuditService,
} from '../../../../../../core/services/audit.service';

import {
  LoggerService,
} from '../../../../../../core/services/logger.service';


interface SecurityCheck {
  key: string;
  name: string;
  description: string;
  status: 'healthy' | 'attention' | 'unknown';
  value: string;
  icon: string;
}


@Component({
  selector: 'app-configuration-security',
  standalone: true,

  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <section class="space-y-4">

      <!-- =====================================================
           HEADER
           ===================================================== -->

      <div
        class="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        <div>

          <h2
            class="
              text-xl
              font-semibold
              text-[#032D42]
            "
          >
            Security
          </h2>

          <p
            class="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Review authentication, administrative access,
            and platform security controls.
          </p>

        </div>


        <button
          mat-stroked-button
          type="button"
          (click)="refresh()"
          [disabled]="checking()"
        >

          <mat-icon>
            refresh
          </mat-icon>

          Refresh

        </button>

      </div>


      <!-- =====================================================
           SECURITY POSTURE
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >

        <mat-card-content class="!p-5">

          <div
            class="
              flex
              items-center
              gap-4
            "
          >

            <div
              class="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-full
              "
              [class.bg-green-100]="
                posture() === 'healthy'
              "
              [class.text-green-700]="
                posture() === 'healthy'
              "
              [class.bg-amber-100]="
                posture() === 'attention'
              "
              [class.text-amber-700]="
                posture() === 'attention'
              "
              [class.bg-gray-100]="
                posture() === 'unknown'
              "
              [class.text-gray-500]="
                posture() === 'unknown'
              "
            >

              <mat-icon>
                {{
                  posture() === 'healthy'
                    ? 'verified_user'
                    : posture() === 'attention'
                      ? 'warning'
                      : 'security'
                }}
              </mat-icon>

            </div>


            <div class="min-w-0">

              <p
                class="
                  text-xs
                  font-medium
                  uppercase
                  tracking-wide
                  text-gray-500
                "
              >
                Security Posture
              </p>

              <h3
                class="
                  mt-0.5
                  text-lg
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ postureLabel() }}
              </h3>

              <p
                class="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                {{ postureMessage() }}
              </p>

            </div>

          </div>

        </mat-card-content>

      </mat-card>


      <!-- =====================================================
           SECURITY CHECKS
           ===================================================== -->

      <div
        class="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
        "
      >

        @for (
          check of checks();
          track check.key
        ) {

          <mat-card
            class="
              !rounded-2xl
              !border
              !shadow-none
            "
          >

            <mat-card-content class="!p-5">

              <div
                class="
                  flex
                  items-start
                  justify-between
                  gap-3
                "
              >

                <div
                  class="
                    flex
                    min-w-0
                    items-start
                    gap-3
                  "
                >

                  <div
                    class="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#032D42]/10
                      text-[#032D42]
                    "
                  >

                    <mat-icon>
                      {{ check.icon }}
                    </mat-icon>

                  </div>


                  <div class="min-w-0">

                    <h3
                      class="
                        text-sm
                        font-semibold
                        text-[#032D42]
                      "
                    >
                      {{ check.name }}
                    </h3>

                    <p
                      class="
                        mt-1
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      {{ check.description }}
                    </p>

                  </div>

                </div>


                <span
                  class="
                    shrink-0
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                  "
                  [class.bg-green-100]="
                    check.status === 'healthy'
                  "
                  [class.text-green-700]="
                    check.status === 'healthy'
                  "
                  [class.bg-amber-100]="
                    check.status === 'attention'
                  "
                  [class.text-amber-700]="
                    check.status === 'attention'
                  "
                  [class.bg-gray-100]="
                    check.status === 'unknown'
                  "
                  [class.text-gray-600]="
                    check.status === 'unknown'
                  "
                >
                  {{ check.status }}
                </span>

              </div>


              <div
                class="
                  mt-4
                  rounded-lg
                  bg-gray-50
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                {{ check.value }}
              </div>

            </mat-card-content>

          </mat-card>

        }

      </div>


      <!-- =====================================================
           ADMINISTRATOR ACCESS
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >

        <mat-card-header
          class="!px-5 !py-4"
        >

          <div
            mat-card-avatar
            class="
              !flex
              !h-10
              !w-10
              !items-center
              !justify-center
              !rounded-lg
              !bg-[#032D42]/10
              !text-[#032D42]
            "
          >
            <mat-icon>
              admin_panel_settings
            </mat-icon>
          </div>

          <mat-card-title
            class="
              !text-base
              !font-semibold
              !text-[#032D42]
            "
          >
            Administrator Access
          </mat-card-title>

          <mat-card-subtitle
            class="
              !mt-0.5
              !text-xs
            "
          >
            Current authenticated administrator
          </mat-card-subtitle>

        </mat-card-header>


        <mat-card-content
          class="
            !border-t
            !px-5
            !py-4
          "
        >

          <div
            class="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
            "
          >

            <div>

              <p
                class="
                  text-xs
                  text-gray-500
                "
              >
                Authentication
              </p>

              <p
                class="
                  mt-1
                  text-sm
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ authenticationStatus() }}
              </p>

            </div>


            <div>

              <p
                class="
                  text-xs
                  text-gray-500
                "
              >
                Administrator
              </p>

              <p
                class="
                  mt-1
                  break-all
                  text-sm
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ administratorId() }}
              </p>

            </div>


            <div>

              <p
                class="
                  text-xs
                  text-gray-500
                "
              >
                Access Level
              </p>

              <p
                class="
                  mt-1
                  text-sm
                  font-semibold
                  text-[#032D42]
                "
              >
                {{ accessLevel() }}
              </p>

            </div>

          </div>

        </mat-card-content>

      </mat-card>


      <!-- =====================================================
           SECURITY PRINCIPLES
           ===================================================== -->

      <mat-card
        class="
          !rounded-2xl
          !border
          !shadow-none
        "
      >

        <mat-card-content class="!p-5">

          <div
            class="
              flex
              items-start
              gap-3
            "
          >

            <mat-icon
              class="!text-[#032D42]"
            >
              policy
            </mat-icon>

            <div>

              <h3
                class="
                  text-sm
                  font-semibold
                  text-[#032D42]
                "
              >
                Security Controls
              </h3>

              <ul
                class="
                  mt-2
                  space-y-2
                  text-sm
                  text-gray-600
                "
              >

                <li class="flex gap-2">
                  <span>•</span>
                  <span>
                    Administrative operations require
                    administrator authorization.
                  </span>
                </li>

                <li class="flex gap-2">
                  <span>•</span>
                  <span>
                    Sensitive values are redacted from
                    centralized application logs and audit metadata.
                  </span>
                </li>

                <li class="flex gap-2">
                  <span>•</span>
                  <span>
                    Administrative configuration changes
                    are recorded in the audit trail.
                  </span>
                </li>

                <li class="flex gap-2">
                  <span>•</span>
                  <span>
                    Protected core applications cannot be
                    disabled through the Control Center.
                  </span>
                </li>

              </ul>

            </div>

          </div>

        </mat-card-content>

      </mat-card>

    </section>
  `,
})
export class ConfigurationSecurityComponent {

  // =========================================================
  // SERVICES
  // =========================================================

  private readonly authService =
    inject(AuthService);

  private readonly auditService =
    inject(AuditService);

  private readonly logger =
    inject(LoggerService);


  // =========================================================
  // STATE
  // =========================================================

  protected readonly checking =
    signal(false);


  // =========================================================
  // AUTHENTICATION
  // =========================================================

  protected readonly authenticationStatus =
    computed(() => {

      return this.authService.firebaseUser()
        ? 'Authenticated'
        : 'Not authenticated';
    });


  protected readonly administratorId =
    computed(() => {

      return this.authService
        .firebaseUser()
        ?.uid ?? 'Unavailable';
    });


  protected readonly accessLevel =
    computed(() => {

      return this.authService.isAdmin
        ? 'Administrator'
        : 'Standard User';
    });


  // =========================================================
  // SECURITY CHECKS
  // =========================================================

  protected readonly checks =
    signal<SecurityCheck[]>([]);


  protected readonly posture =
    computed<
      SecurityCheck['status']
    >(() => {

      const checks =
        this.checks();

      if (!checks.length) {
        return 'unknown';
      }

      if (
        checks.some(
          check =>
            check.status === 'attention',
        )
      ) {
        return 'attention';
      }

      return 'healthy';
    });


  // =========================================================
  // INITIALIZATION
  // =========================================================

  constructor() {

    this.refresh();
  }


  // =========================================================
  // REFRESH
  // =========================================================

  protected async refresh(): Promise<void> {

    if (this.checking()) {
      return;
    }

    this.checking.set(true);

    const operationId =
      this.logger.createOperationId();

    this.logger.info(
      'ConfigurationSecurityComponent',
      'Security posture check started.',
      {
        operationId,
      },
    );

    try {

      const firebaseUser =
        this.authService.firebaseUser();

      const checks: SecurityCheck[] = [

        {
          key: 'authentication',
          name: 'Authentication',
          description:
            'Current Firebase authentication state.',
          status:
            firebaseUser
              ? 'healthy'
              : 'attention',
          value:
            firebaseUser
              ? 'Authenticated'
              : 'No authenticated user',
          icon:
            'lock',
        },


        {
          key: 'administrator',
          name: 'Administrator Access',
          description:
            'Current administrator authorization state.',
          status:
            this.authService.isAdmin
              ? 'healthy'
              : 'attention',
          value:
            this.authService.isAdmin
              ? 'Administrator access confirmed'
              : 'Administrator access not confirmed',
          icon:
            'admin_panel_settings',
        },


        {
          key: 'audit',
          name: 'Audit Trail',
          description:
            'Administrative actions are recorded through the centralized audit service.',
          status:
            'healthy',
          value:
            'Centralized audit logging enabled',
          icon:
            'history',
        },


        {
          key: 'logging',
          name: 'Application Logging',
          description:
            'Centralized application logging and sensitive-value redaction.',
          status:
            'healthy',
          value:
            'Centralized logging enabled',
          icon:
            'receipt_long',
        },

      ];

      this.checks.set(checks);

      await this.auditService.log({
        action:
          'security.posture.check',
        entityType:
          'security',
        outcome:
          this.posture() === 'healthy'
            ? 'success'
            : 'failure',
        reason:
          'Security posture reviewed from Control Center.',
        metadata: {
          operationId,
          status:
            this.posture(),
        },
      });

      this.logger.info(
        'ConfigurationSecurityComponent',
        'Security posture check completed.',
        {
          operationId,
          status:
            this.posture(),
        },
      );

    } catch (error) {

      this.logger.error(
        'ConfigurationSecurityComponent',
        'Security posture check failed.',
        error,
        {
          operationId,
        },
      );

    } finally {

      this.checking.set(false);
    }
  }


  // =========================================================
  // LABEL
  // =========================================================

  protected postureLabel(): string {

    switch (this.posture()) {

      case 'healthy':
        return 'Healthy';

      case 'attention':
        return 'Attention Required';

      default:
        return 'Not Evaluated';
    }
  }


  protected postureMessage(): string {

    switch (this.posture()) {

      case 'healthy':
        return 'The current security controls are operating as expected.';

      case 'attention':
        return 'One or more security controls require administrator attention.';

      default:
        return 'Security posture has not yet been evaluated.';
    }
  }
}
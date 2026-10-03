import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

import { MatIconModule } from '@angular/material/icon';

import { OrganizationOnboardingService } from '../../services/organization-onboarding.service';

@Component({
  selector: 'app-organization-invitation-acceptance',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <main class="invitation-page mt-8">
      <section class="invitation-shell">
        <!-- =====================================================
             Brand
        ====================================================== -->

        <header class="brand">
          <div class="brand-icon">
            <mat-icon>business</mat-icon>
          </div>

          <div class="brand-text">
            <div class="brand-name">
              @if (organizationName()) {
                {{ organizationName() }}
              } @else {
                Zebron
              }
            </div>

            <div class="brand-subtitle">Organization Invitation</div>
          </div>
        </header>

        <!-- =====================================================
             Loading
        ====================================================== -->

        @if (isLoading()) {
          <section class="invitation-card">
            <div class="state-container">
              <div class="spinner"></div>

              <h1>Checking your invitation</h1>

              <p>Please wait while we verify your invitation and account.</p>
            </div>
          </section>
        }

        <!-- =====================================================
             Missing invitation
        ====================================================== -->

        @else if (missingInvitation()) {
          <section class="invitation-card">
            <div class="state-container">
              <div class="state-icon error">
                <mat-icon> link_off </mat-icon>
              </div>

              <h1>Invitation Link Invalid</h1>

              <p>
                This invitation link is missing the invitation information required to continue.
              </p>

              <a routerLink="/" class="primary-button">
                <mat-icon> home </mat-icon>

                <span> Go to Zebron </span>
              </a>
            </div>
          </section>
        }

        <!-- =====================================================
             Authentication required
        ====================================================== -->

        @else if (!currentUser()) {
          <section class="invitation-card">
            <div class="card-header">
              <div class="state-icon invitation">
                <mat-icon> group_add </mat-icon>
              </div>

              <div class="header-content">
                <span class="eyebrow"> ORGANIZATION INVITATION </span>

                <h1>
                  You've been invited to join
                  @if (organizationName()) {
                    {{ organizationName() }}
                  } @else {
                    an organization
                  }
                </h1>
              </div>
            </div>

            <p class="description">
              You have received an invitation to join
              @if (organizationName()) {
                <strong>
                  {{ organizationName() }}
                </strong>
              } @else {
                an organization
              }
              on Zebron.
            </p>

            <!-- Organization -->

            @if (organizationName()) {
              <div class="organization-card">
                <div class="organization-icon">
                  <mat-icon> business </mat-icon>
                </div>

                <div class="organization-details">
                  <span class="organization-label"> ORGANIZATION </span>

                  <span class="organization-name">
                    {{ organizationName() }}
                  </span>
                </div>
              </div>
            }

            <!-- Sign-in notice -->

            <div class="notice">
              <mat-icon> lock </mat-icon>

              <div>
                <strong> Sign in to continue </strong>

                <p>
                  Sign in using the email address that received this invitation. If you don't have a
                  Zebron account yet, you can create one first.
                </p>
              </div>
            </div>

            <!-- Actions -->

            <div class="actions">
              <a
                class="primary-button"
                [routerLink]="['/login']"
                [queryParams]="{
                  returnUrl: returnUrl(),
                }"
              >
                <mat-icon> login </mat-icon>

                <span> Sign In </span>
              </a>

              <a
                class="secondary-button"
                [routerLink]="['/register']"
                [queryParams]="{
                  returnUrl: returnUrl(),
                }"
              >
                <mat-icon> person_add </mat-icon>

                <span> Create Account </span>
              </a>
            </div>

            <!-- Security -->

            @if (accepted()) {
              <p class="security-note">
                <mat-icon>verified_user</mat-icon>

                <span> Your organization membership has been created securely. </span>
              </p>
            } @else {
              <p class="security-note">
                <mat-icon>verified_user</mat-icon>

                <span>
                  Your organization membership will be created securely when you accept this
                  invitation.
                </span>
              </p>
            }
          </section>
        }

        <!-- =====================================================
             Authenticated
        ====================================================== -->

        @else {
          <section class="invitation-card">
            <div class="card-header">
              <div class="state-icon invitation">
                <mat-icon> group_add </mat-icon>
              </div>

              <div class="header-content">
                <span class="eyebrow"> ORGANIZATION INVITATION </span>

                <h1>
                  Accept your invitation
                  @if (organizationName()) {
                    to join {{ organizationName() }}
                  }
                </h1>
              </div>
            </div>

            <p class="description">
              You are signed in and ready to accept your invitation to join
              @if (organizationName()) {
                <strong>
                  {{ organizationName() }}
                </strong>
              } @else {
                the organization
              }
              on Zebron.
            </p>

            <!-- =================================================
                 Organization
            ================================================== -->

            @if (organizationName()) {
              <div class="organization-card">
                <div class="organization-icon">
                  <mat-icon> business </mat-icon>
                </div>

                <div class="organization-details">
                  <span class="organization-label"> ORGANIZATION </span>

                  <span class="organization-name">
                    {{ organizationName() }}
                  </span>
                </div>
              </div>
            }

            <!-- =================================================
                 Signed-in account
            ================================================== -->

            <div class="account-card">
              <div class="account-icon">
                <mat-icon> person </mat-icon>
              </div>

              <div class="account-details">
                <span class="account-label"> SIGNED IN AS </span>

                <span class="account-email">
                  {{ currentUser()?.email || 'Authenticated account' }}
                </span>
              </div>
            </div>

            <!-- =================================================
                 Error
            ================================================== -->

            @if (errorMessage()) {
              <div class="alert error-alert">
                <mat-icon> error </mat-icon>

                <div>
                  <strong> Unable to accept invitation </strong>

                  <p>
                    {{ errorMessage() }}
                  </p>
                </div>
              </div>
            }

            <!-- =================================================
                 Success
            ================================================== -->

            @if (successMessage()) {
              <div class="alert success-alert">
                <mat-icon> check_circle </mat-icon>

                <div>
                  <strong> Invitation accepted </strong>

                  <p>
                    {{ successMessage() }}
                  </p>
                </div>
              </div>
            }

            <!-- =================================================
                 Actions
            ================================================== -->

            <div class="actions">
              @if (!accepted()) {
                <button
                  type="button"
                  class="primary-button"
                  [disabled]="isAccepting()"
                  (click)="acceptInvitation()"
                >
                  @if (isAccepting()) {
                    <span class="button-spinner"></span>

                    <span> Accepting... </span>
                  } @else {
                    <mat-icon> how_to_reg </mat-icon>

                    <span> Accept Invitation </span>
                  }
                </button>

                <button
                  type="button"
                  class="secondary-button"
                  [disabled]="isAccepting()"
                  (click)="signOutAndSwitchAccount()"
                >
                  <mat-icon> logout </mat-icon>

                  <span> Use Another Account </span>
                </button>
              } @else {
                <button type="button" class="primary-button" (click)="goToPartnerPortal()">
                  <mat-icon> dashboard </mat-icon>

                  <span> Go to Partner Portal </span>
                </button>
              }
            </div>

            <!-- =================================================
                 Security note
            ================================================== -->

            <p class="security-note">
              <mat-icon> verified_user </mat-icon>

              <span>
                Your organization membership will be created securely when you accept this
                invitation.
              </span>
            </p>
          </section>
        }

        <!-- =====================================================
             Footer
        ====================================================== -->

        <footer class="page-footer">
          <span> © {{ currentYear }} Zebron </span>

          <span class="footer-separator"> • </span>

          <span> Organization Management </span>
        </footer>
      </section>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }

      * {
        box-sizing: border-box;
      }

      /* =========================================================
       Page
    ========================================================= */

      .invitation-page {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        padding: 40px 24px 32px;

        background:
          radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 35%),
          radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.08), transparent 35%),
          #f8fafc;
      }

      .invitation-shell {
        width: 100%;
        max-width: 720px;
      }

      /* =========================================================
       Brand
    ========================================================= */

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 22px;
        padding-left: 2px;
      }

      .brand-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 11px;

        background: #111827;
        color: #ffffff;

        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
      }

      .brand-icon mat-icon {
        width: 22px;
        height: 22px;
        font-size: 22px;
        line-height: 22px;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .brand-name {
        font-size: 19px;
        font-weight: 750;
        line-height: 1.2;
        color: #111827;
      }

      .brand-subtitle {
        font-size: 12px;
        line-height: 1.2;
        color: #64748b;
      }

      /* =========================================================
       Main Card
    ========================================================= */

      .invitation-card {
        width: 100%;

        background: #ffffff;

        border: 1px solid #e2e8f0;
        border-radius: 20px;

        padding: 34px;

        box-shadow:
          0 18px 45px rgba(15, 23, 42, 0.07),
          0 3px 10px rgba(15, 23, 42, 0.025);
      }

      /* =========================================================
       Card Header
    ========================================================= */

      .card-header {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .header-content {
        min-width: 0;
      }

      .state-icon {
        width: 58px;
        height: 58px;
        flex: 0 0 58px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 16px;
      }

      .state-icon.invitation {
        background: #eff6ff;
        color: #2563eb;
      }

      .state-icon.error {
        background: #fef2f2;
        color: #dc2626;
      }

      .state-icon mat-icon {
        width: 30px;
        height: 30px;
        font-size: 30px;
        line-height: 30px;
      }

      .eyebrow {
        display: block;

        margin-bottom: 7px;

        font-size: 10px;
        line-height: 1;

        letter-spacing: 0.11em;

        font-weight: 750;

        color: #2563eb;
      }

      h1 {
        margin: 0;

        font-size: 28px;
        line-height: 1.22;

        letter-spacing: -0.025em;

        font-weight: 750;

        color: #111827;
      }

      .description {
        margin: 18px 0 22px;

        font-size: 14px;
        line-height: 1.6;

        color: #64748b;
      }

      .description strong {
        font-weight: 700;
        color: #334155;
      }

      /* =========================================================
       Organization
    ========================================================= */

      .organization-card {
        display: flex;
        align-items: center;

        gap: 13px;

        padding: 14px 15px;

        margin: 0 0 18px;

        border: 1px solid #dbeafe;
        border-radius: 13px;

        background: #f8fbff;
      }

      .organization-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 11px;

        background: #eff6ff;
        color: #2563eb;
      }

      .organization-icon mat-icon {
        width: 21px;
        height: 21px;

        font-size: 21px;
        line-height: 21px;
      }

      .organization-details {
        min-width: 0;

        display: flex;
        flex-direction: column;

        gap: 3px;
      }

      .organization-label {
        font-size: 9px;

        font-weight: 750;

        letter-spacing: 0.09em;

        color: #64748b;
      }

      .organization-name {
        overflow: hidden;

        text-overflow: ellipsis;

        white-space: nowrap;

        font-size: 15px;

        font-weight: 700;

        color: #172554;
      }

      /* =========================================================
       Notice
    ========================================================= */

      .notice {
        display: flex;
        align-items: flex-start;

        gap: 12px;

        padding: 15px 16px;

        margin-bottom: 22px;

        border: 1px solid #dbeafe;
        border-radius: 13px;

        background: #eff6ff;
      }

      .notice > mat-icon {
        width: 20px;
        height: 20px;

        flex: 0 0 20px;

        margin-top: 1px;

        font-size: 20px;
        line-height: 20px;

        color: #2563eb;
      }

      .notice strong {
        display: block;

        margin-bottom: 3px;

        font-size: 13px;

        color: #1e3a8a;
      }

      .notice p {
        margin: 0;

        font-size: 12px;

        line-height: 1.55;

        color: #36558a;
      }

      /* =========================================================
       Account
    ========================================================= */

      .account-card {
        display: flex;
        align-items: center;

        gap: 12px;

        padding: 13px 15px;

        margin: 0 0 22px;

        border: 1px solid #e2e8f0;
        border-radius: 13px;

        background: #f8fafc;
      }

      .account-icon {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: #e0e7ff;

        color: #4338ca;
      }

      .account-icon mat-icon {
        width: 20px;
        height: 20px;

        font-size: 20px;
        line-height: 20px;
      }

      .account-details {
        min-width: 0;

        display: flex;
        flex-direction: column;

        gap: 3px;
      }

      .account-label {
        font-size: 9px;

        font-weight: 750;

        letter-spacing: 0.09em;

        color: #64748b;
      }

      .account-email {
        overflow: hidden;

        text-overflow: ellipsis;

        white-space: nowrap;

        font-size: 13px;

        font-weight: 600;

        color: #1e293b;
      }

      /* =========================================================
       Alerts
    ========================================================= */

      .alert {
        display: flex;
        align-items: flex-start;

        gap: 11px;

        padding: 13px 14px;

        margin-bottom: 20px;

        border-radius: 12px;
      }

      .alert > mat-icon {
        width: 20px;
        height: 20px;

        flex: 0 0 20px;

        margin-top: 1px;

        font-size: 20px;
        line-height: 20px;
      }

      .alert strong {
        display: block;

        margin-bottom: 3px;

        font-size: 13px;
      }

      .alert p {
        margin: 0;

        font-size: 12px;

        line-height: 1.5;
      }

      .error-alert {
        border: 1px solid #fecaca;

        background: #fef2f2;

        color: #991b1b;
      }

      .error-alert mat-icon {
        color: #dc2626;
      }

      .error-alert p {
        color: #b91c1c;
      }

      .success-alert {
        border: 1px solid #bbf7d0;

        background: #f0fdf4;

        color: #166534;
      }

      .success-alert mat-icon {
        color: #16a34a;
      }

      .success-alert p {
        color: #15803d;
      }

      /* =========================================================
       Actions
    ========================================================= */

      .actions {
        display: flex;
        flex-wrap: wrap;

        gap: 10px;

        margin-top: 4px;
      }

      .primary-button,
      .secondary-button {
        min-height: 44px;

        padding: 0 17px;

        border-radius: 10px;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        gap: 8px;

        font-family: inherit;

        font-size: 13px;

        font-weight: 650;

        line-height: 1;

        text-decoration: none;

        cursor: pointer;

        transition:
          transform 120ms ease,
          box-shadow 120ms ease,
          background 120ms ease,
          border-color 120ms ease;
      }

      .primary-button {
        border: 1px solid #111827;

        background: #111827;

        color: #ffffff;

        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.1);
      }

      .primary-button:hover:not(:disabled) {
        background: #1f2937;

        transform: translateY(-1px);

        box-shadow: 0 7px 15px rgba(15, 23, 42, 0.14);
      }

      .secondary-button {
        border: 1px solid #cbd5e1;

        background: #ffffff;

        color: #334155;
      }

      .secondary-button:hover:not(:disabled) {
        border-color: #94a3b8;

        background: #f8fafc;

        transform: translateY(-1px);
      }

      .primary-button:disabled,
      .secondary-button:disabled {
        cursor: not-allowed;

        opacity: 0.6;

        transform: none;

        box-shadow: none;
      }

      .primary-button mat-icon,
      .secondary-button mat-icon {
        width: 18px;
        height: 18px;

        font-size: 18px;
        line-height: 18px;
      }

      /* =========================================================
       Security
    ========================================================= */

      .security-note {
        display: flex;
        align-items: flex-start;

        gap: 7px;

        margin: 18px 0 0;

        font-size: 11px;

        line-height: 1.5;

        color: #64748b;
      }

      .security-note mat-icon {
        width: 16px;
        height: 16px;

        flex: 0 0 16px;

        font-size: 16px;
        line-height: 16px;

        color: #64748b;
      }

      /* =========================================================
       Loading
    ========================================================= */

      .state-container {
        min-height: 300px;

        display: flex;
        flex-direction: column;

        align-items: center;
        justify-content: center;

        text-align: center;
      }

      .state-container .state-icon {
        margin-bottom: 18px;
      }

      .state-container h1 {
        margin-bottom: 9px;
      }

      .state-container p {
        max-width: 460px;

        margin: 0 0 24px;

        color: #64748b;

        line-height: 1.6;
      }

      .spinner {
        width: 38px;
        height: 38px;

        margin-bottom: 18px;

        border: 3px solid #e2e8f0;

        border-top-color: #2563eb;

        border-radius: 50%;

        animation: spin 0.8s linear infinite;
      }

      .button-spinner {
        width: 16px;
        height: 16px;

        border: 2px solid rgba(255, 255, 255, 0.35);

        border-top-color: #ffffff;

        border-radius: 50%;

        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* =========================================================
       Footer
    ========================================================= */

      .page-footer {
        display: flex;
        align-items: center;
        justify-content: center;

        gap: 8px;

        margin-top: 18px;

        font-size: 11px;

        color: #94a3b8;
      }

      .footer-separator {
        color: #cbd5e1;
      }

      /* =========================================================
       Responsive
    ========================================================= */

      @media (max-width: 640px) {
        .invitation-page {
          padding: 24px 16px;
        }

        .invitation-card {
          padding: 25px 20px;

          border-radius: 17px;
        }

        .card-header {
          align-items: flex-start;

          gap: 14px;
        }

        .state-icon {
          width: 50px;
          height: 50px;

          flex-basis: 50px;

          border-radius: 14px;
        }

        .state-icon mat-icon {
          width: 25px;
          height: 25px;

          font-size: 25px;

          line-height: 25px;
        }

        h1 {
          font-size: 23px;
        }

        .actions {
          flex-direction: column;
        }

        .primary-button,
        .secondary-button {
          width: 100%;
        }

        .organization-name {
          max-width: 230px;
        }
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationInvitationAcceptanceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly onboardingService = inject(OrganizationOnboardingService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly auth = getAuth();

  /* ===========================================================
     Public state
  ============================================================ */

  readonly currentYear = new Date().getFullYear();

  readonly invitationId = signal<string>('');

  readonly currentUser = signal<User | null>(null);

  readonly organizationName = signal<string>('');

  readonly isLoading = signal(true);

  readonly isAccepting = signal(false);

  readonly accepted = signal(false);

  readonly missingInvitation = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');

  readonly returnUrl = signal('');

  /* ===========================================================
     Internal state
  ============================================================ */

  private readonly authResolved = signal(false);

  private readonly previewResolved = signal(false);

  private acceptedOrganizationId: string | null = null;

  /* ===========================================================
     Initialization
  ============================================================ */

  ngOnInit(): void {
    const invitationId = this.route.snapshot.queryParamMap.get('invitationId')?.trim() ?? '';

    if (!invitationId) {
      this.missingInvitation.set(true);

      this.isLoading.set(false);

      return;
    }

    this.invitationId.set(invitationId);

    /*
     * Preserve the invitation URL when the user
     * goes through Sign In or Create Account.
     */
    const returnUrl = `/organization/invitations/accept?invitationId=${encodeURIComponent(
      invitationId,
    )}`;

    this.returnUrl.set(returnUrl);

    /*
     * Load organization information.
     */
    void this.loadInvitationPreview();

    /*
     * Resolve authentication state.
     */
    const unsubscribe = onAuthStateChanged(
      this.auth,

      (user) => {
        this.currentUser.set(user);

        this.authResolved.set(true);

        this.updateLoadingState();
      },

      (error) => {
        console.error('Failed to determine authentication state.', error);

        this.currentUser.set(null);

        this.errorMessage.set(
          'We could not determine your sign-in status. Please refresh the page and try again.',
        );

        this.authResolved.set(true);

        this.updateLoadingState();
      },
    );

    this.destroyRef.onDestroy(() => {
      unsubscribe();
    });
  }

  /* ===========================================================
     Invitation preview
  ============================================================ */

  private async loadInvitationPreview(): Promise<void> {
    try {
      const response = await this.onboardingService.getOrganizationInvitationPreview(
        this.invitationId(),
      );

      if (!response?.success) {
        throw new Error('Unable to load invitation details.');
      }

      this.organizationName.set(response.organizationName);
    } catch (error: unknown) {
      console.error('Failed to load organization invitation preview.', error);

      this.errorMessage.set(this.getInvitationErrorMessage(error));
    } finally {
      this.previewResolved.set(true);

      this.updateLoadingState();
    }
  }

  /* ===========================================================
     Loading state
  ============================================================ */

  private updateLoadingState(): void {
    if (this.authResolved() && this.previewResolved()) {
      this.isLoading.set(false);
    }
  }

  /* ===========================================================
     Accept invitation
  ============================================================ */

  async acceptInvitation(): Promise<void> {
    const invitationId = this.invitationId();

    if (!invitationId) {
      this.errorMessage.set('The invitation link is missing the invitation ID.');

      return;
    }

    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('Please sign in before accepting the invitation.');

      return;
    }

    this.isAccepting.set(true);

    this.errorMessage.set('');

    this.successMessage.set('');

    try {
      const response = await this.onboardingService.acceptOrganizationInvitation(invitationId);

      if (!response?.success) {
        throw new Error('The invitation could not be accepted.');
      }

      this.acceptedOrganizationId = response.organizationId;

      this.accepted.set(true);

      this.successMessage.set(
        `Your invitation to join ${
          this.organizationName() || 'the organization'
        } has been accepted successfully.`,
      );
    } catch (error: unknown) {
      console.error('Failed to accept organization invitation.', error);

      this.errorMessage.set(this.getInvitationErrorMessage(error));
    } finally {
      this.isAccepting.set(false);
    }
  }

  /* ===========================================================
     Switch account
  ============================================================ */

  async signOutAndSwitchAccount(): Promise<void> {
    try {
      await this.auth.signOut();

      this.currentUser.set(null);

      this.errorMessage.set('');

      this.successMessage.set('');
    } catch (error) {
      console.error('Failed to sign out.', error);

      this.errorMessage.set('We could not sign you out. Please try again.');
    }
  }

  /* ===========================================================
     Navigate to organization
  ============================================================ */

  goToPartnerPortal(): void {
    const organizationId = this.acceptedOrganizationId;

    if (organizationId) {
      void this.router.navigate(['/partner/org', organizationId, 'dashboard']);

      return;
    }

    void this.router.navigate(['/partner']);
  }

  /* ===========================================================
     Error handling
  ============================================================ */

  private getInvitationErrorMessage(error: unknown): string {
    const candidate = error as {
      code?: string;
      message?: string;
    } | null;

    const code = candidate?.code ?? '';

    const message = candidate?.message ?? '';

    const normalizedMessage = message.toLowerCase();

    if (code.includes('not-found') || normalizedMessage.includes('invitation not found')) {
      return (
        'This invitation could not be found. ' +
        'It may have been deleted or the invitation link may be invalid.'
      );
    }

    if (code.includes('failed-precondition') || normalizedMessage.includes('expired')) {
      return (
        'This invitation is no longer available. ' +
        'Please contact the organization administrator and request a new invitation.'
      );
    }

    if (code.includes('permission-denied') || normalizedMessage.includes('email')) {
      return (
        'The signed-in account does not match the email address ' +
        'that received this invitation. Please sign out and use ' +
        'the invited email address.'
      );
    }

    if (code.includes('already-exists') || normalizedMessage.includes('already accepted')) {
      return 'This invitation has already been accepted.';
    }

    if (message) {
      return message;
    }

    return (
      'We could not process this invitation. ' +
      'Please try again or contact the organization administrator.'
    );
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatDividerModule } from '@angular/material/divider';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatTooltipModule } from '@angular/material/tooltip';

import { doc, getDoc, getFirestore } from 'firebase/firestore';

import { Organization } from '../../../../core/models/organization.model';

import {
  OrganizationOnboarding,
  OrganizationOnboardingStep,
} from '../../../../core/models/organization-onboarding.model';

import {
  OrganizationOnboardingProfileInput,
  PartnerOrganizationOnboardingService,
} from '../../services/partner-organization-onboarding.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import {
  OrganizationInvitation,
  OrganizationInvitationRole,
} from '../../../../core/models/organization-invitation.model';

import { OrganizationInvitationService } from '../../services/organization-invitation.service';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

interface OnboardingStep {
  key: OrganizationOnboardingStep;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-partner-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
  ],
  template: `
    <div class="onboarding-page">
      <!-- =========================================================
           PAGE CONTAINER
           ========================================================= -->
      <div class="onboarding-container">
        <!-- =======================================================
             PAGE HEADER
             ======================================================= -->
        <header class="page-header">
          <div class="header-navigation">
            <button
              mat-icon-button
              type="button"
              class="back-button"
              matTooltip="Back to Partner Dashboard"
              aria-label="Back to Partner Dashboard"
              (click)="goBack()"
            >
              <mat-icon> arrow_back </mat-icon>
            </button>

            <div class="header-breadcrumb">
              <span class="breadcrumb-primary"> Partner Portal </span>

              <mat-icon class="breadcrumb-separator"> chevron_right </mat-icon>

              <span class="breadcrumb-current"> Organization Onboarding </span>
            </div>
          </div>

          <div class="header-content">
            <div class="header-icon">
              <mat-icon> business_center </mat-icon>
            </div>

            <div>
              <h1>Organization Onboarding</h1>

              @if (organization()) {
                <p>
                  Complete the setup for
                  <strong>
                    {{ organization()?.name }}
                  </strong>
                </p>
              } @else {
                <p>Complete the setup for your organization.</p>
              }
            </div>
          </div>
        </header>

        <!-- =======================================================
             LOADING
             ======================================================= -->
        @if (loading()) {
          <section class="state-card">
            <div class="state-content">
              <div class="loading-icon">
                <mat-spinner diameter="36"></mat-spinner>
              </div>

              <h2>Loading your onboarding</h2>

              <p>We're retrieving your organization's onboarding information.</p>
            </div>
          </section>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->
        @else if (error()) {
          <section class="state-card error-state-card">
            <div class="state-content">
              <div class="state-icon error-icon">
                <mat-icon> error_outline </mat-icon>
              </div>

              <h2>Unable to load onboarding</h2>

              <p>
                {{ error() }}
              </p>

              <button
                mat-flat-button
                type="button"
                class="primary-button state-action"
                (click)="load()"
              >
                <mat-icon> refresh </mat-icon>

                Try Again
              </button>
            </div>
          </section>
        }

        <!-- =======================================================
             ONBOARDING CONTENT
             ======================================================= -->
        @else if (onboarding() && showReviewPage()) {
          <section class="state-card onboarding-review-card">
            <div class="state-content">
              <div class="state-icon success-icon">
                <mat-icon>task_alt</mat-icon>
              </div>

              <h2>Review your organization setup</h2>

              <p>
                The configuration has been submitted and your organization's onboarding is complete.
                Review the details below before continuing to your Partner Dashboard.
              </p>

              <div class="review-summary">
                <div class="review-summary-row">
                  <span>Organization</span>
                  <strong>{{ organization()?.name || 'Your organization' }}</strong>
                </div>
                <div class="review-summary-row">
                  <span>Onboarding status</span>
                  <strong>Completed</strong>
                </div>
                <div class="review-summary-row">
                  <span>Setup steps</span>
                  <strong>4 of 4 completed</strong>
                </div>
                <div class="review-summary-row">
                  <span>Default member role</span>
                  <strong>{{ configuration.defaultMemberRole }}</strong>
                </div>
                <div class="review-summary-row">
                  <span>Self-registration</span>
                  <strong>{{
                    configuration.allowSelfRegistration ? 'Enabled' : 'Disabled'
                  }}</strong>
                </div>
                <div class="review-summary-row">
                  <span>Administrator notifications</span>
                  <strong>{{ configuration.adminNotifications ? 'Enabled' : 'Disabled' }}</strong>
                </div>
              </div>

              <div class="review-branding">
                <span>Organization branding</span>
                <div class="review-color-row">
                  <span
                    class="review-color-swatch"
                    [style.backgroundColor]="configuration.primaryColor"
                  ></span>
                  <span>Primary: {{ configuration.primaryColor }}</span>
                </div>
                <div class="review-color-row">
                  <span
                    class="review-color-swatch"
                    [style.backgroundColor]="configuration.secondaryColor"
                  ></span>
                  <span>Secondary: {{ configuration.secondaryColor }}</span>
                </div>
              </div>

              <div class="form-actions review-actions">
                <button
                  type="button"
                  mat-stroked-button
                  class="secondary-button"
                  (click)="editOrganizationSetup()"
                >
                  <mat-icon>edit</mat-icon>
                  <span>Edit Setup</span>
                </button>

                <button
                  type="button"
                  mat-flat-button
                  class="primary-button save-button"
                  (click)="goToPartnerDashboard()"
                >
                  <span>Go to Partner Dashboard</span>
                  <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </section>
        } @else if (onboarding()) {
          <!-- =====================================================
               PROGRESS CARD
               ===================================================== -->
          <section class="progress-card">
            <!-- Progress header -->
            <div class="progress-header">
              <div class="progress-heading">
                <div class="progress-heading-icon">
                  <mat-icon> checklist </mat-icon>
                </div>

                <div>
                  <h2>Setup Progress</h2>

                  <p>Step {{ currentStepNumber() }} of {{ steps.length }}</p>
                </div>
              </div>

              <div class="progress-summary">
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
                </div>

                <span class="progress-percentage"> {{ progressPercentage() }}% </span>
              </div>
            </div>

            <!-- Progress steps -->
            <div class="progress-body">
              <div class="steps-grid">
                @for (step of steps; track step.key; let index = $index) {
                  <button
                    type="button"
                    class="step-card"
                    [class.step-current]="isCurrentStep(step.key)"
                    [class.step-completed]="isStepCompleted(step.key)"
                    [class.step-upcoming]="!isCurrentStep(step.key) && !isStepCompleted(step.key)"
                    [class.step-reviewing]="reviewingStep() === step.key"
                    [disabled]="!isStepCompleted(step.key)"
                    [attr.aria-label]="
                      isStepCompleted(step.key) ? 'Review ' + step.label : step.label
                    "
                    [attr.aria-current]="isCurrentStep(step.key) ? 'step' : null"
                    (click)="reviewCompletedStep(step.key)"
                  >
                    <div class="step-content">
                      <!-- Step title -->
                      <div class="step-title">
                        {{ step.label }}
                      </div>

                      <!-- Step description -->
                      <div class="step-description">
                        {{ step.description }}
                      </div>

                      <!-- Bottom indicator -->
                      <div class="step-indicator">
                        <!-- Step number -->
                        <span
                          class="step-number"
                          [class.step-number-current]="isCurrentStep(step.key)"
                          [class.step-number-completed]="isStepCompleted(step.key)"
                        >
                          @if (isStepCompleted(step.key)) {
                            <mat-icon> check </mat-icon>
                          } @else {
                            {{ index + 1 }}
                          }
                        </span>

                        <!-- Current indicator -->
                        @if (isCurrentStep(step.key)) {
                          <span class="step-status current-status"> CURRENT </span>
                        }
                      </div>
                    </div>
                  </button>
                }
              </div>
            </div>
          </section>

          <!-- =====================================================
               MAIN FORM CARD
               ===================================================== -->
          <section class="form-card" [class.reviewing-step]="isReviewingCompletedStep()">
            <!-- Form header -->
            <div class="form-header">
              <div class="form-step-indicator">
                <div class="form-step-number">
                  {{ displayedStepNumber() }}
                </div>

                <div>
                  <span class="form-step-label"> STEP {{ displayedStepNumber() }} </span>

                  <h2>
                    {{ displayedStepLabel() }}
                  </h2>

                  <p>
                    @if (displayedStep() === 'organization_profile') {
                      Tell us about your organization.
                    } @else if (displayedStep() === 'owner_profile') {
                      Confirm the primary administrator's information.
                    } @else if (displayedStep() === 'invite_members') {
                      Confirm the primary administrator's information.
                    } @else if (displayedStep() === 'configuration') {
                      Set organization-wide access, notifications, and branding preferences.
                    } @else {
                      Complete this step to continue your organization's setup.
                    }
                  </p>
                </div>
              </div>
            </div>

            <div class="form-divider"></div>

            @if (isReviewingCompletedStep()) {
              <div class="review-banner" role="status">
                <div class="review-banner-icon">
                  <mat-icon>visibility</mat-icon>
                </div>
                <div class="review-banner-content">
                  <strong>Reviewing completed step</strong>
                  <span
                    >This step is read-only. Your current onboarding progress is unchanged.</span
                  >
                </div>
                <button
                  mat-stroked-button
                  type="button"
                  class="review-return-button"
                  (click)="returnToCurrentStep()"
                >
                  <mat-icon>arrow_forward</mat-icon>
                  Return to Current Step
                </button>
              </div>
            }

            @if (reviewError()) {
              <div class="form-error review-error" role="alert">
                <mat-icon>error_outline</mat-icon>
                <span>{{ reviewError() }}</span>
              </div>
            }

            <!-- =================================================
                 STEP 1
                 ================================================= -->
            @if (displayedStep() === 'organization_profile') {
              <form
                [formGroup]="organizationForm"
                (ngSubmit)="saveOrganizationProfile()"
                class="organization-form"
              >
                <!-- -----------------------------------------------
                     ORGANIZATION DETAILS
                     ----------------------------------------------- -->
                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon> business </mat-icon>
                    </div>

                    <div>
                      <h3>Organization Details</h3>

                      <p>
                        Provide the basic information that members and administrators will see
                        throughout Zebron.
                      </p>
                    </div>
                  </div>

                  <!-- Organization Name -->
                  <mat-form-field appearance="outline" class="organization-form-field full-field">
                    <mat-label> Organization Name </mat-label>

                    <mat-icon matPrefix> business </mat-icon>

                    <input matInput formControlName="name" autocomplete="organization" />
                    <mat-hint>Enter organization name</mat-hint>

                    @if (organizationForm.controls.name.hasError('required')) {
                      <mat-error> Organization name is required. </mat-error>
                    }

                    @if (organizationForm.controls.name.hasError('maxlength')) {
                      <mat-error> Organization name is too long. </mat-error>
                    }
                  </mat-form-field>

                  <!-- Short fields -->
                  <div class="field-grid">
                    <!-- Organization Slug -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Organization Slug </mat-label>

                      <mat-icon matPrefix> link </mat-icon>

                      <input matInput formControlName="slug" readonly />

                      <mat-hint> URL-friendly identifier. </mat-hint>
                    </mat-form-field>

                    <!-- Company Number -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Company / Registration Number </mat-label>

                      <mat-icon matPrefix> badge </mat-icon>

                      <input matInput formControlName="companyNumber" />
                      <mat-hint>Enter organization name</mat-hint>
                    </mat-form-field>
                  </div>

                  <!-- Description -->
                  <mat-form-field appearance="outline" class="organization-form-field full-field">
                    <mat-label> Organization Description </mat-label>

                    <mat-icon matPrefix> description </mat-icon>

                    <textarea matInput formControlName="description" rows="5"></textarea>

                    <mat-hint> A short description of your organization. </mat-hint>
                  </mat-form-field>
                </div>

                <!-- -----------------------------------------------
                     CONTACT INFORMATION
                     ----------------------------------------------- -->
                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon> contact_mail </mat-icon>
                    </div>

                    <div>
                      <h3>Contact Information</h3>

                      <p>Provide contact details for your organization.</p>
                    </div>
                  </div>

                  <div class="field-grid">
                    <!-- Website -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Website </mat-label>

                      <mat-icon matPrefix> language </mat-icon>

                      <input matInput formControlName="website" type="url" autocomplete="url" />
                      <mat-hint> Ex. https://example.org </mat-hint>
                    </mat-form-field>

                    <!-- Phone -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Organization Phone </mat-label>

                      <mat-icon matPrefix> phone </mat-icon>

                      <input matInput formControlName="phone" type="tel" autocomplete="tel" />
                      <mat-hint> Optional </mat-hint>
                    </mat-form-field>

                    <!-- Email -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Organization Email </mat-label>

                      <mat-icon matPrefix> email </mat-icon>

                      <input matInput formControlName="email" type="email" autocomplete="email" />
                      <mat-hint> Ex. organization@example.org. </mat-hint>

                      @if (organizationForm.controls.email.hasError('email')) {
                        <mat-error> Enter a valid email address. </mat-error>
                      }
                    </mat-form-field>

                    <!-- Location -->
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Location </mat-label>

                      <mat-icon matPrefix> location_on </mat-icon>

                      <input matInput formControlName="locationId" />

                      <mat-hint> Organization location reference (Optional). </mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <!-- -----------------------------------------------
                     SAVE ERROR
                     ----------------------------------------------- -->
                @if (saveError()) {
                  <div class="save-error">
                    <div class="save-error-icon">
                      <mat-icon> error_outline </mat-icon>
                    </div>

                    <div class="save-error-content">
                      <h4>Unable to save organization profile</h4>

                      <p>
                        {{ saveError() }}
                      </p>
                    </div>
                  </div>
                }

                <!-- -----------------------------------------------
                     FORM ACTIONS
                     ----------------------------------------------- -->
                <div class="form-actions">
                  <button
                    mat-stroked-button
                    type="button"
                    class="secondary-button"
                    [disabled]="saving()"
                    (click)="goBack()"
                  >
                    <mat-icon> arrow_back </mat-icon>

                    Back
                  </button>

                  <button
                    type="button"
                    mat-flat-button
                    class="primary-button save-button"
                    [disabled]="saving() || organizationForm.invalid || isReviewingCompletedStep()"
                    (click)="saveOrganizationProfile()"
                  >
                    @if (saving()) {
                      <mat-spinner diameter="19" class="button-spinner"></mat-spinner>
                      <span>Saving...</span>
                    } @else {
                      <span>Save &amp; Continue</span>
                      <ng-container>
                        <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                      </ng-container>
                    }
                  </button>
                </div>
              </form>
            } @else if (displayedStep() === 'owner_profile') {
              <section class="onboarding-form-section">
                @if (ownerSaveError()) {
                  <div class="form-error" role="alert">
                    <mat-icon> error_outline </mat-icon>

                    <span>
                      {{ ownerSaveError() }}
                    </span>
                  </div>
                }

                <form
                  [formGroup]="ownerForm"
                  class="organization-form"
                  (ngSubmit)="saveOwnerProfile()"
                >
                  <div class="form-section">
                    <div class="section-heading">
                      <div class="section-heading-icon">
                        <mat-icon> person </mat-icon>
                      </div>

                      <div>
                        <h3>Personal Information</h3>

                        <p>Provide the primary administrator's contact information.</p>
                      </div>
                    </div>

                    <div class="field-grid">
                      <!-- First Name -->
                      <mat-form-field appearance="outline" class="organization-form-field">
                        <mat-label> First Name </mat-label>

                        <mat-icon matPrefix> person </mat-icon>

                        <input matInput formControlName="firstName" autocomplete="given-name" />

                        @if (ownerForm.controls.firstName.hasError('required')) {
                          <mat-error> First name is required. </mat-error>
                        }
                      </mat-form-field>

                      <!-- Last Name -->
                      <mat-form-field appearance="outline" class="organization-form-field">
                        <mat-label> Last Name </mat-label>

                        <mat-icon matPrefix> person </mat-icon>

                        <input matInput formControlName="lastName" autocomplete="family-name" />

                        @if (ownerForm.controls.lastName.hasError('required')) {
                          <mat-error> Last name is required. </mat-error>
                        }
                      </mat-form-field>

                      <!-- Preferred Name -->
                      <mat-form-field appearance="outline" class="organization-form-field">
                        <mat-label> Preferred Name </mat-label>

                        <mat-icon matPrefix> badge </mat-icon>

                        <input matInput formControlName="preferredName" autocomplete="nickname" />

                        <mat-hint> Optional </mat-hint>
                      </mat-form-field>

                      <!-- Phone -->
                      <mat-form-field appearance="outline" class="organization-form-field">
                        <mat-label> Phone </mat-label>

                        <mat-icon matPrefix> phone </mat-icon>

                        <input matInput formControlName="phone" type="tel" autocomplete="tel" />

                        <mat-hint> Optional </mat-hint>
                      </mat-form-field>

                      <!-- Email -->
                      <mat-form-field
                        appearance="outline"
                        class="organization-form-field full-field"
                      >
                        <mat-label> Email </mat-label>

                        <mat-icon matPrefix> email </mat-icon>

                        <input
                          matInput
                          formControlName="email"
                          readonly
                          aria-readonly="true"
                          autocomplete="email"
                        />

                        <mat-hint> Email is linked to your Zebron account. </mat-hint>
                      </mat-form-field>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="form-actions">
                    <button
                      type="button"
                      mat-stroked-button
                      class="secondary-button"
                      (click)="goBack()"
                      [disabled]="ownerSaving() || isReviewingCompletedStep()"
                      (click)="goToPreviousStep()"
                    >
                      <mat-icon> arrow_back </mat-icon>

                      Back
                    </button>

                    <button
                      type="submit"
                      mat-stroked-button
                      class="primary-button save-button"
                      [disabled]="ownerSaving() || ownerForm.invalid"
                    >
                      @if (ownerSaving()) {
                        <mat-spinner diameter="18" class="button-spinner"></mat-spinner>
                        <span>Saving...</span>
                      } @else {
                        <span>Save &amp; Continue</span>
                        <ng-container>
                          <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                        </ng-container>
                      }
                    </button>
                  </div>
                </form>
              </section>
            }

            @if (displayedStep() === 'invite_members') {
              <section class="onboarding-form-section">
                @if (invitationError()) {
                  <div class="form-error" role="alert">
                    <mat-icon> error_outline </mat-icon>

                    <span>
                      {{ invitationError() }}
                    </span>
                  </div>
                }

                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon> person_add </mat-icon>
                    </div>

                    <div>
                      <h3>Add a Team Member</h3>

                      <p>Send an invitation and assign the appropriate organization role.</p>
                    </div>
                  </div>

                  <div class="field-grid">
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Email Address </mat-label>

                      <mat-icon matPrefix> email </mat-icon>

                      <input
                        matInput
                        type="email"
                        [value]="invitationEmail()"
                        (input)="invitationEmail.set($any($event.target).value)"
                        autocomplete="email"
                      />

                      <mat-hint>
                        The person will receive an invitation to join your organization.
                      </mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label> Organization Role </mat-label>

                      <mat-icon matPrefix> badge </mat-icon>

                      <mat-select
                        [value]="invitationRole()"
                        (selectionChange)="invitationRole.set($event.value)"
                      >
                        @for (role of invitationRoles; track role.value) {
                          <mat-option [value]="role.value">
                            {{ role.label }}
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="invite-action-row">
                    <button
                      type="button"
                      mat-stroked-button
                      class="secondary-button"
                      [disabled]="invitationSaving()"
                      (click)="addInvitation()"
                    >
                      <mat-icon> add </mat-icon>

                      Add Invitation
                    </button>
                  </div>
                </div>

                @if (invitations().length > 0) {
                  <div class="form-section">
                    <div class="section-heading">
                      <div class="section-heading-icon">
                        <mat-icon> mail </mat-icon>
                      </div>

                      <div>
                        <h3>Invitations</h3>

                        <p>Team members who have been invited to join your organization.</p>
                      </div>
                    </div>

                    <div class="invitation-list">
                      @for (invitation of invitations(); track invitation.id) {
                        <div class="invitation-item">
                          <div class="invitation-icon">
                            <mat-icon> person </mat-icon>
                          </div>

                          <div class="invitation-details">
                            <strong>
                              {{ invitation.email }}
                            </strong>

                            <span>
                              {{ invitationRoleLabel(invitation.role) }}
                            </span>
                          </div>

                          <span class="invitation-status">
                            {{ invitation.status }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }

                <div class="form-actions">
                  <button
                    type="button"
                    mat-stroked-button
                    class="secondary-button"
                    [disabled]="invitationSaving()"
                    (click)="goToPreviousStep()"
                  >
                    <mat-icon> arrow_back </mat-icon>

                    Back
                  </button>

                  <div class="form-actions-right">
                    <button
                      type="button"
                      mat-button
                      class="skip-button"
                      [disabled]="invitationSaving()"
                      (click)="continueInviteMembers()"
                    >
                      Skip for now
                    </button>

                    <button
                      type="button"
                       mat-stroked-button
                      class="primary-button save-button"
                      [disabled]="invitationSaving()"
                      (click)="continueInviteMembers()"
                    >
                      <span> Continue </span>

                      <mat-icon> arrow_forward </mat-icon>
                    </button>
                  </div>
                </div>
              </section>
            }

            @if (displayedStep() === 'configuration') {
              <section class="onboarding-form-section">
                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon>manage_accounts</mat-icon>
                    </div>

                    <div>
                      <h3>Member Access</h3>
                      <p>Define course visibility and default member access.</p>
                    </div>
                  </div>

                  <div class="field-grid">
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label>Default Member Role</mat-label>
                      <mat-icon matPrefix>person</mat-icon>

                      <mat-select
                        [(ngModel)]="configuration.defaultMemberRole"
                        [disabled]="configurationSaving()"
                      >
                        <mat-option value="org_member"> Organization Member </mat-option>

                        <mat-option value="org_staff"> Organization Staff </mat-option>

                        <mat-option value="org_manager"> Organization Manager </mat-option>
                      </mat-select>

                      <mat-hint> Role assigned to newly registered members. </mat-hint>
                    </mat-form-field>
                  </div>

                  <label class="configuration-option">
                    <div class="configuration-option-content">
                      <div class="configuration-option-title">Allow Self Registration</div>

                      <div class="configuration-option-description">
                        Allow users to register themselves with the organization.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      [(ngModel)]="configuration.allowSelfRegistration"
                      [disabled]="configurationSaving()"
                    />
                  </label>
                </div>

                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon>notifications</mat-icon>
                    </div>

                    <div>
                      <h3>Notifications</h3>
                      <p>Choose which organization events should generate notifications.</p>
                    </div>
                  </div>

                  <div class="configuration-options">
                    <label class="configuration-option">
                      <div class="configuration-option-content">
                        <div class="configuration-option-title">Administrator Notifications</div>

                        <div class="configuration-option-description">
                          Notify organization administrators about relevant activity.
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        [(ngModel)]="configuration.adminNotifications"
                        [disabled]="configurationSaving()"
                      />
                    </label>
                  </div>
                </div>

                <div class="form-section">
                  <div class="section-heading">
                    <div class="section-heading-icon">
                      <mat-icon>palette</mat-icon>
                    </div>

                    <div>
                      <h3>Organization Branding</h3>
                      <p>Choose the primary and secondary colors for your organization.</p>
                    </div>
                  </div>

                  <div class="field-grid">
                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label>Primary Color</mat-label>
                      <mat-icon matPrefix>format_color_fill</mat-icon>

                      <input
                        matInput
                        type="text"
                        maxlength="7"
                        [(ngModel)]="configuration.primaryColor"
                        [disabled]="configurationSaving()"
                        placeholder="#007979"
                      />

                      <mat-hint>Hex color, for example #007979.</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="organization-form-field">
                      <mat-label>Secondary Color</mat-label>
                      <mat-icon matPrefix>format_color_fill</mat-icon>

                      <input
                        matInput
                        type="text"
                        maxlength="7"
                        [(ngModel)]="configuration.secondaryColor"
                        [disabled]="configurationSaving()"
                        placeholder="#032D42"
                      />

                      <mat-hint>Hex color, for example #032D42.</mat-hint>
                    </mat-form-field>
                  </div>
                </div>

                <!-- Final onboarding step: save configuration and submit onboarding. -->
                <div class="form-actions">
                  <button
                    type="button"
                    mat-stroked-button
                    class="secondary-button"
                    [disabled]="configurationSaving() || isReviewingCompletedStep()"
                    (click)="goToPreviousStep()"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    Back
                  </button>

                  <button
                    type="button"
                    mat-stroked-button
                      class="primary-button save-button"
                    [disabled]="configurationSaving() || isReviewingCompletedStep()"
                    (click)="saveConfiguration()"
                  >
                    @if (configurationSaving()) {
                      <mat-spinner diameter="19" class="button-spinner text-white"></mat-spinner>
                      <span>Submitting...</span>
                    } @else {
                      <span>Submit</span>
                      <ng-container>
                        <mat-icon iconPositionEnd>arrow_forward</mat-icon>
                      </ng-container>
                    }
                  </button>
                </div>
              </section>
            }
          </section>
        }
      </div>
    </div>
  `,

  styles: [
    `
      :host {
        --zebron-navy: #032d42;
        --zebron-navy-light: #08445c;
        --zebron-teal: #007979;
        --zebron-teal-dark: #005f5f;
        --zebron-cyan: #12bfc3;
        --zebron-mint: #b9f0ed;
        --zebron-pale: #e5f4f4;

        --page-background: #f5f8fa;
        --surface: #ffffff;
        --surface-soft: #f8fafc;

        --border: #dce7eb;
        --border-light: #e7eef1;

        --text-primary: #032d42;
        --text-secondary: #58717b;
        --text-muted: #78909a;

        --error: #b42318;
        --error-background: #fff4f2;
        --error-border: #f4c7c2;

        display: block;
        min-height: 100%;
      }

      .onboarding-page {
        min-height: 100vh;
        background: linear-gradient(180deg, #f1f7f8 0%, #f8fafb 36%, #f5f8fa 100%);
        color: var(--text-primary);
      }

      .onboarding-container {
        width: min(100% - 2rem, 1440px);
        margin: 0 auto;
        padding: 1.5rem 0 4rem;
      }

      .page-header {
        margin-bottom: 1.5rem;
      }

      .header-navigation {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
      }

      .back-button {
        color: var(--zebron-navy);
        transition:
          background-color 160ms ease,
          color 160ms ease;
      }

      .back-button:hover {
        background: var(--zebron-pale);
        color: var(--zebron-teal);
      }

      .header-breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8rem;
      }

      .breadcrumb-primary {
        color: var(--text-muted);
      }

      .breadcrumb-separator {
        width: 1rem;
        height: 1rem;
        font-size: 1rem;
        color: #a4b4ba;
      }

      .breadcrumb-current {
        color: var(--zebron-teal);
        font-weight: 600;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .header-icon {
        display: flex;
        width: 3.25rem;
        height: 3.25rem;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 0.9rem;
        background: linear-gradient(135deg, var(--zebron-teal), var(--zebron-navy-light));
        color: white;
        box-shadow: 0 8px 20px rgba(3, 45, 66, 0.14);
      }

      .header-icon mat-icon {
        width: 1.7rem;
        height: 1.7rem;
        font-size: 1.7rem;
      }

      .header-content h1 {
        margin: 0;
        color: var(--zebron-navy);
        font-size: clamp(1.7rem, 3vw, 2.15rem);
        font-weight: 750;
        letter-spacing: -0.025em;
        line-height: 1.15;
      }

      .header-content p {
        margin: 0.45rem 0 0;
        color: var(--text-secondary);
        font-size: 0.92rem;
      }

      .header-content strong {
        color: var(--zebron-navy);
        font-weight: 650;
      }

      .state-card {
        display: flex;
        min-height: 420px;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border);
        border-radius: 1.1rem;
        background: var(--surface);
        box-shadow: 0 8px 30px rgba(3, 45, 66, 0.05);
      }

      .state-content {
        max-width: 420px;
        padding: 2rem;
        text-align: center;
      }

      .state-content h2 {
        margin: 1rem 0 0;
        color: var(--zebron-navy);
        font-size: 1.15rem;
        font-weight: 700;
      }

      .state-content p {
        margin: 0.5rem 0 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .loading-icon {
        display: flex;
        justify-content: center;
      }

      .state-icon {
        display: flex;
        width: 3.5rem;
        height: 3.5rem;
        margin: 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .error-icon {
        background: var(--error-background);
        color: var(--error);
      }

      .state-action {
        margin-top: 1.5rem;
      }

      .progress-card {
        overflow: hidden;
        margin-bottom: 1.5rem;
        border: 1px solid var(--border);
        border-radius: 1.1rem;
        background: var(--surface);
        box-shadow: 0 8px 30px rgba(3, 45, 66, 0.055);
      }

      .progress-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.25rem 1.5rem;
        background: linear-gradient(
          110deg,
          var(--zebron-navy) 0%,
          var(--zebron-navy-light) 55%,
          #075a68 100%
        );
        color: white;
      }

      .progress-heading {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .progress-heading-icon {
        display: flex;
        width: 2.55rem;
        height: 2.55rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.7rem;
        background: rgba(18, 191, 195, 0.18);
        color: var(--zebron-cyan);
      }

      .progress-heading-icon mat-icon {
        width: 1.35rem;
        height: 1.35rem;
        font-size: 1.35rem;
      }

      .progress-heading h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
      }

      .progress-heading p {
        margin: 0.2rem 0 0;
        color: var(--zebron-mint);
        font-size: 0.76rem;
      }

      .progress-summary {
        display: flex;
        min-width: 180px;
        align-items: center;
        gap: 0.75rem;
      }

      .progress-track {
        width: 100%;
        height: 0.45rem;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
      }

      .progress-fill {
        height: 100%;
        min-width: 0;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--zebron-cyan), #72e3df);
        box-shadow: 0 0 10px rgba(18, 191, 195, 0.45);
        transition: width 450ms ease;
      }

      .progress-percentage {
        min-width: 2.75rem;
        color: white;
        font-size: 0.78rem;
        font-weight: 700;
        text-align: right;
      }

      .progress-body {
        padding: 1rem;
      }

      .steps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 0.75rem;
      }

      .step-card {
        appearance: none;
        font: inherit;
        min-height: 112px;

        display: flex;
        align-items: stretch;
        justify-content: center;

        border: 1px solid var(--border-light);
        border-radius: 0.8rem;

        padding: 0.85rem;

        background: #ffffff;

        text-align: center;

        transition:
          border-color 160ms ease,
          background-color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }
      .step-current {
        border-color: #52b7b7;
        background: var(--zebron-pale);

        box-shadow: 0 4px 14px rgba(0, 121, 121, 0.1);
      }

      .step-completed {
        border-color: #9bdad7;
        background: #f3fbfb;
      }

      .step-upcoming {
        border-color: var(--border-light);
        background: #ffffff;
      }

      .step-content {
        display: flex;

        width: 100%;
        min-width: 0;

        flex-direction: column;
        align-items: center;

        text-align: center;
      }

      .step-title {
        width: 100%;

        color: var(--text-primary);

        font-size: 1.2rem;
        font-weight: 750;

        line-height: 1.25;

        text-align: center;
      }

      .step-current .step-title {
        color: var(--zebron-teal-dark);
      }

      .step-description {
        width: 100%;

        margin-top: 0.3rem;

        color: var(--text-muted);

        font-size: 0.87rem;
        line-height: 1.4;

        text-align: center;
      }

      .step-indicator {
        display: flex;

        width: 100%;

        min-height: 2rem;

        margin-top: auto;
        padding-top: 0.7rem;

        align-items: center;
        justify-content: center;

        gap: 0.4rem;
      }

      .step-number {
        display: inline-flex;

        width: 1.6rem;
        height: 1.6rem;

        flex: 0 0 1.6rem;

        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: #eef2f4;
        color: #72838a;

        font-size: 0.85rem;
        font-weight: 750;

        text-align: center;

        transition:
          background-color 160ms ease,
          color 160ms ease,
          box-shadow 160ms ease;
      }

      .step-number-current {
        background: var(--zebron-teal);
        color: #ffffff;

        box-shadow: 0 3px 8px rgba(0, 121, 121, 0.22);
      }

      .step-number-completed {
        background: var(--zebron-navy);
        color: #ffffff;
      }

      .step-number mat-icon {
        width: 0.9rem;
        height: 0.9rem;

        font-size: 0.9rem;

        line-height: 0.9rem;
      }

      .step-status {
        display: inline-flex;

        min-height: 1.45rem;

        align-items: center;
        justify-content: center;

        border-radius: 999px;

        padding: 0.2rem 0.55rem;

        font-size: 0.82rem;
        font-weight: 800;

        letter-spacing: 0.06em;
        line-height: 1;

        text-transform: uppercase;

        white-space: nowrap;
      }

      .current-status {
        background: var(--zebron-teal);
        color: #ffffff;

        box-shadow: 0 3px 8px rgba(0, 121, 121, 0.2);
      }

      .form-card {
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 1.1rem;
        background: var(--surface);
        box-shadow: 0 8px 30px rgba(3, 45, 66, 0.055);
      }

      .form-header {
        padding: 1.75rem 1.75rem 1.6rem;
      }

      .form-step-indicator {
        display: flex;
        align-items: center;
        gap: 0.9rem;
      }

      .form-step-number {
        display: flex;
        width: 2.7rem;
        height: 2.7rem;
        flex: 0 0 2.7rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        background: var(--zebron-pale);
        color: var(--zebron-teal-dark);
        font-size: 0.95rem;
        font-weight: 800;
      }

      .form-step-label {
        display: block;
        color: var(--zebron-teal);
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .form-header h2 {
        margin: 0.2rem 0 0;
        color: var(--zebron-navy);
        font-size: 1.45rem;
        font-weight: 750;
        letter-spacing: -0.015em;
      }

      .form-header p {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
        font-size: 0.88rem;
      }

      .form-divider {
        height: 1px;
        background: var(--border-light);
      }

      .onboarding-form-section {
        padding: 2rem 1.75rem 1.75rem;
      }
      .form-kicker {
        color: var(--zebron-teal);
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .form-error {
        display: flex;
        align-items: flex-start;
        gap: 0.65rem;
        margin-bottom: 1.25rem;
        border: 1px solid var(--error-border);
        border-radius: 0.8rem;
        background: var(--error-background);
        padding: 0.9rem 1rem;
        color: var(--error);
      }

      .form-error mat-icon {
        flex: 0 0 auto;
      }

      .form-error span {
        font-size: 0.82rem;
        line-height: 1.5;
      }

      .organization-form {
        padding: 2rem 1.75rem 1.75rem;
      }

      .form-section {
        margin-bottom: 2.25rem;
      }

      .form-section:last-of-type {
        margin-bottom: 0;
      }

      .section-heading {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }

      .section-heading-icon {
        display: flex;
        width: 2.25rem;
        height: 2.25rem;
        flex: 0 0 2.25rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.65rem;
        background: var(--zebron-pale);
        color: var(--zebron-teal);
      }

      .section-heading-icon mat-icon {
        width: 1.2rem;
        height: 1.2rem;
        font-size: 1.2rem;
      }

      .section-heading h3 {
        margin: 0;
        color: var(--zebron-navy);
        font-size: 1rem;
        font-weight: 750;
      }

      .section-heading p {
        max-width: 700px;
        margin: 0.25rem 0 0;
        color: var(--text-secondary);
        font-size: 0.8rem;
        line-height: 1.5;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));

        column-gap: 1.25rem;
        row-gap: 1.25rem;

        width: 100%;
      }

      .full-field {
        width: 100%;
        margin-bottom: 1.75rem;
      }

      .organization-form-field {
        display: block;
        width: 100%;
        margin-bottom: 1.75rem;
      }

      :host ::ng-deep .organization-form-field .mat-mdc-text-field-wrapper {
        min-height: 56px;
        border-radius: 0.7rem;
        background-color: #f7fafb;
        transition:
          background-color 160ms ease,
          box-shadow 160ms ease;
      }

      :host ::ng-deep .organization-form-field .mdc-notched-outline__leading,
      :host ::ng-deep .organization-form-field .mdc-notched-outline__notch,
      :host ::ng-deep .organization-form-field .mdc-notched-outline__trailing {
        border-color: #d3e0e4;
        transition:
          border-color 160ms ease,
          border-width 160ms ease;
      }

      :host ::ng-deep .organization-form-field .mat-mdc-text-field-wrapper.mdc-text-field--focused {
        background-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(0, 121, 121, 0.08);
      }

      :host
        ::ng-deep
        .organization-form-field
        .mat-mdc-text-field-wrapper.mdc-text-field--focused
        .mdc-notched-outline__leading,
      :host
        ::ng-deep
        .organization-form-field
        .mat-mdc-text-field-wrapper.mdc-text-field--focused
        .mdc-notched-outline__notch,
      :host
        ::ng-deep
        .organization-form-field
        .mat-mdc-text-field-wrapper.mdc-text-field--focused
        .mdc-notched-outline__trailing {
        border-color: var(--zebron-teal) !important;
        border-width: 2px;
      }

      :host
        ::ng-deep
        .organization-form-field
        .mat-mdc-text-field-wrapper.mdc-text-field--focused
        .mdc-floating-label {
        color: var(--zebron-teal) !important;
      }

      :host ::ng-deep .organization-form-field input.mat-mdc-input-element,
      :host ::ng-deep .organization-form-field textarea.mat-mdc-input-element {
        color: var(--zebron-navy);
        font-size: 0.9rem;
      }

      :host ::ng-deep .organization-form-field input::placeholder,
      :host ::ng-deep .organization-form-field textarea::placeholder {
        color: #91a2a9;
        opacity: 1;
      }

      :host ::ng-deep .organization-form-field .mat-mdc-form-field-icon-prefix mat-icon {
        margin-right: 0.5rem;
        color: #78909a;
        transition: color 160ms ease;
      }

      :host
        ::ng-deep
        .organization-form-field
        .mat-mdc-text-field-wrapper.mdc-text-field--focused
        .mat-mdc-form-field-icon-prefix
        mat-icon {
        color: var(--zebron-teal);
      }

      :host ::ng-deep .organization-form-field .mat-mdc-form-field-hint-wrapper {
        padding-left: 0.25rem;
      }

      :host ::ng-deep .organization-form-field .mat-mdc-form-field-hint {
        color: var(--text-muted);
        font-size: 0.7rem;
      }

      :host ::ng-deep .organization-form-field textarea {
        min-height: 100px;
        resize: vertical;
      }

      .save-error {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-top: 1.5rem;
        border: 1px solid var(--error-border);
        border-radius: 0.8rem;
        background: var(--error-background);
        padding: 0.9rem 1rem;
      }

      .save-error-icon {
        display: flex;
        width: 2rem;
        height: 2rem;
        flex: 0 0 2rem;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #fde3df;
        color: var(--error);
      }

      .save-error-icon mat-icon {
        width: 1.1rem;
        height: 1.1rem;
        font-size: 1.1rem;
      }

      .save-error-content h4 {
        margin: 0;
        color: #7a271a;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .save-error-content p {
        margin: 0.25rem 0 0;
        color: #9b2c1e;
        font-size: 0.78rem;
        line-height: 1.5;
      }

      .form-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 2rem;
        border-top: 1px solid var(--border-light);
        padding-top: 1.5rem;
      }

      .secondary-button {
        min-height: 44px;
        border-color: #ccd9dd !important;
        border-radius: 0.65rem !important;
        color: var(--zebron-navy) !important;
        font-weight: 650;
      }

      .secondary-button:hover:not(:disabled) {
        background: var(--zebron-pale);
        border-color: #9ccdcc !important;
        color: var(--zebron-teal-dark) !important;
      }

      .primary-button {
        min-height: 44px;
        border-radius: 0.65rem !important;
        background: var(--zebron-teal) !important;
        color: white !important;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(0, 121, 121, 0.18);
        transition:
          background-color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }

      .primary-button:hover:not(:disabled) {
        background: var(--zebron-navy) !important;
        box-shadow: 0 6px 16px rgba(3, 45, 66, 0.2);
        transform: translateY(-1px);
      }

      .primary-button:disabled {
        opacity: 0.55;
        box-shadow: none;
      }

      .save-button {
        min-width: 160px;
        padding: 0 1.25rem;
      }

      .button-spinner {
        margin-right: 0.5rem;
      }

      .icon-hidden {
        visibility: hidden;
      }

      .form-toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 1.25rem;
        padding: 1rem 1.1rem;
        border: 1px solid #dbe7ea;
        border-radius: 0.9rem;
        background: #f8fbfc;
      }

      .form-toggle-row strong {
        display: block;
        color: var(--zebron-navy);
        font-size: 0.9rem;
      }

      .form-toggle-row p {
        margin: 0.25rem 0 0;
        color: #6f8b92;
        font-size: 0.78rem;
      }

      .future-step h3 {
        margin: 0.35rem 0 0;
        color: var(--zebron-navy);
        font-size: 1.35rem;
        font-weight: 750;
      }

      .future-step p {
        max-width: 450px;
        margin: 0.5rem 0 0;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }

      @media (max-width: 1280px) {
      }

      @media (max-width: 900px) {
        .onboarding-container {
          width: min(100% - 1.5rem, 100%);
        }

        .progress-header {
          align-items: flex-start;
          flex-direction: column;
        }

        .progress-summary {
          width: 100%;
        }
      }

      /* Step 8 fields span the full available form width. */
      .onboarding-form .full-width,
      .onboarding-form .full-width mat-form-field {
        width: 100%;
      }

      @media (max-width: 700px) {
      }

      @media (max-width: 640px) {
        .onboarding-container {
          width: min(100% - 1rem, 100%);
          padding-top: 1rem;
        }

        .header-content {
          align-items: flex-start;
        }

        .header-icon {
          width: 2.8rem;
          height: 2.8rem;
        }

        .header-content h1 {
          font-size: 1.55rem;
        }

        .progress-header {
          padding: 1rem;
        }

        .progress-body {
          padding: 0.75rem;
        }

        .steps-grid {
          grid-template-columns: 1fr;
        }

        .step-card {
          min-height: auto;
        }

        .form-header {
          padding: 1.25rem;
        }

        .organization-form {
          padding: 1.5rem 1.25rem 1.25rem;
        }

        .field-grid {
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .form-actions {
          align-items: stretch;
          flex-direction: column-reverse;
        }

        .secondary-button,
        .save-button {
          width: 100%;
        }

        .button-content {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .button-spinner {
          flex: 0 0 auto;
        }
      }

      .step-card.step-completed {
        cursor: pointer;
      }

      .step-card.step-completed:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(3, 45, 66, 0.12);
      }

      .step-card.step-completed:focus-visible {
        outline: 3px solid var(--zebron-cyan);
        outline-offset: 2px;
      }

      .step-card.step-reviewing {
        box-shadow: 0 0 0 2px var(--zebron-teal);
      }

      .review-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 20px 0 0;
        padding: 14px 16px;
        border: 1px solid #b9e5e2;
        border-radius: 12px;
        background: var(--zebron-pale);
      }

      .review-banner-icon {
        display: grid;
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        place-items: center;
        border-radius: 10px;
        background: var(--surface);
        color: var(--zebron-teal);
      }

      .review-banner-content {
        display: grid;
        gap: 3px;
        flex: 1;
      }

      .review-banner-content strong {
        color: var(--text-primary);
      }

      .review-banner-content span {
        color: var(--text-secondary);
        font-size: 0.88rem;
      }

      .review-return-button {
        flex: 0 0 auto;
      }

      .reviewing-step .organization-form,
      .reviewing-step .onboarding-form,
      .reviewing-step .form-actions {
        pointer-events: none;
      }

      .reviewing-step .review-banner,
      .reviewing-step .review-banner * {
        pointer-events: auto;
      }

      @media (max-width: 700px) {
        .review-banner {
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .review-return-button {
          width: 100%;
        }
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerOnboardingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly onboardingService = inject(PartnerOrganizationOnboardingService);

  private readonly invitationService = inject(OrganizationInvitationService);
  /**
   * Page title service.
   */
  private readonly pageTitleService = inject(PageTitleService);

  private readonly firestore = getFirestore();

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);

  protected readonly organization = signal<Organization | null>(null);

  protected readonly onboarding = signal<OrganizationOnboarding | null>(null);

  protected readonly reviewingStep = signal<OrganizationOnboardingStep | null>(null);
  protected readonly reviewLoading = signal(false);
  protected readonly reviewError = signal<string | null>(null);

  protected readonly organizationId = signal<string | null>(null);

  protected readonly ownerSaving = signal(false);

  protected readonly ownerSaveError = signal<string | null>(null);
  protected readonly invitations = signal<OrganizationInvitation[]>([]);

  protected readonly invitationSaving = signal(false);

  protected readonly invitationError = signal<string | null>(null);

  protected readonly invitationEmail = signal('');

  protected readonly invitationRole = signal<OrganizationInvitationRole>('org_member');

  protected readonly isEditingSetup = signal(false);

  /** Presentation metadata for the four core organization onboarding steps. */
  protected readonly stepMetadata: Partial<Record<OrganizationOnboardingStep, OnboardingStep>> = {
    organization_profile: {
      key: 'organization_profile',
      label: 'Organization Profile',
      description: 'Organization details',
      icon: 'business',
    },
    owner_profile: {
      key: 'owner_profile',
      label: 'Owner Profile',
      description: 'Owner information',
      icon: 'person',
    },
    invite_members: {
      key: 'invite_members',
      label: 'Invite Team',
      description: 'Add team members',
      icon: 'group_add',
    },
    configuration: {
      key: 'configuration',
      label: 'Configuration',
      description: 'Configure organization',
      icon: 'settings',
    },
  };

  /** Canonical core onboarding workflow, including legacy organizations. */
  private readonly legacyBaseOnboardingSteps: OrganizationOnboardingStep[] = [
    'organization_profile',
    'owner_profile',
    'invite_members',
    'configuration',
  ];

  /**
   * Organization onboarding is always the four-step core workflow.
   * Application-specific setup is managed by each application entitlement.
   */
  protected get requiredOnboardingSteps(): OrganizationOnboardingStep[] {
    return [...this.legacyBaseOnboardingSteps];
  }

  /**
   * Render only the steps required by this organization.
   */
  protected get steps(): OnboardingStep[] {
    return this.requiredOnboardingSteps
      .map((step) => this.stepMetadata[step])
      .filter((step): step is OnboardingStep => step !== undefined);
  }

  protected readonly invitationRoles: {
    value: OrganizationInvitationRole;
    label: string;
  }[] = [
    {
      value: 'org_admin',
      label: 'Organization Admin',
    },
    {
      value: 'org_manager',
      label: 'Organization Manager',
    },
    {
      value: 'org_staff',
      label: 'Organization Staff',
    },
    {
      value: 'org_member',
      label: 'Organization Member',
    },
  ];

  protected readonly organizationForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],

    slug: ['', [Validators.maxLength(150)]],

    companyNumber: ['', [Validators.maxLength(100)]],

    description: ['', [Validators.maxLength(2000)]],

    website: ['', [Validators.maxLength(500)]],

    phone: ['', [Validators.maxLength(50)]],

    email: ['', [Validators.email, Validators.maxLength(254)]],

    locationId: ['', [Validators.maxLength(150)]],
  });

  protected readonly ownerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],

    lastName: ['', [Validators.required, Validators.maxLength(100)]],

    preferredName: ['', [Validators.maxLength(100)]],

    email: [
      {
        value: '',
        disabled: true,
      },
    ],

    phone: ['', [Validators.maxLength(50)]],
  });

  protected readonly configurationSaving = signal(false);

  protected readonly configurationSaveError = signal<string | null>(null);

  /** Show the confirmation/review screen after the backend completes onboarding. */
  protected readonly showReviewPage = signal(false);

  protected configuration = {
    allowSelfRegistration: false,
    defaultMemberRole: 'org_member' as 'org_member' | 'org_staff' | 'org_manager',
    adminNotifications: true,
    primaryColor: '#007979',
    secondaryColor: '#032D42',
  };

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const organizationId = this.route.snapshot.paramMap.get('organizationId');

      if (!organizationId) {
        throw new Error('Organization ID is missing from the URL.');
      }

      this.organizationId.set(organizationId);

      const [onboarding, organization] = await Promise.all([
        this.onboardingService.getOnboarding(organizationId),
        this.getOrganization(organizationId),
      ]);

      if (!onboarding) {
        throw new Error('No onboarding record was found for this organization.');
      }

      if (!organization) {
        throw new Error('The organization could not be found.');
      }

      this.onboarding.set(onboarding);
      console.log('CURRENT STEP:', onboarding.currentStep);
      console.log('COMPLETED STEPS:', onboarding.completedSteps);
      this.organization.set(organization);

      this.pageTitleService.setTitle(`${organization.name}`);

      this.populateOrganizationForm(organization);
      this.populateOwnerForm();
      await this.loadOrganizationConfiguration(organizationId);
    } catch (error: unknown) {
      console.error('Failed to load organization onboarding.', error);

      this.error.set(this.getErrorMessage(error, 'Unable to load onboarding.'));
    } finally {
      this.loading.set(false);
    }
  }

  private async getOrganization(organizationId: string): Promise<Organization | null> {
    const organizationRef = doc(this.firestore, 'organizations', organizationId);

    const snapshot = await getDoc(organizationRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Organization;
  }

  private populateOrganizationForm(organization: Organization): void {
    this.organizationForm.patchValue({
      name: organization.name ?? '',

      slug: organization.slug ?? '',

      companyNumber: organization.companyNumber ?? '',

      description: organization.description ?? '',

      website: organization.website ?? '',

      phone: organization.phone ?? '',

      email: organization.email ?? '',

      locationId: organization.locationId ?? '',
    });
  }

  protected async saveOrganizationProfile(): Promise<void> {
    this.saveError.set(null);

    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    const organizationId = this.organizationId();

    if (!organizationId) {
      this.saveError.set('Organization ID is missing.');
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.organizationForm.getRawValue();

      const profile: OrganizationOnboardingProfileInput = {
        name: formValue.name.trim(),
        slug: formValue.slug.trim(),
        companyNumber: formValue.companyNumber.trim(),
        description: formValue.description.trim(),
        website: formValue.website.trim(),
        phone: formValue.phone.trim(),
        email: formValue.email.trim(),
        locationId: formValue.locationId.trim(),
      };

      const response = await this.onboardingService.updateOrganizationProfile(
        organizationId,
        profile,
      );

      if (!response?.success) {
        throw new Error('The organization profile could not be saved.');
      }

      /*
       * The backend owns the onboarding transition.
       *
       * Expected:
       *
       * organization_profile
       *        ↓
       * owner_profile
       */
      const updatedOnboarding = await this.onboardingService.getOnboarding(organizationId);

      if (!updatedOnboarding) {
        throw new Error(
          'The organization profile was saved, but the updated onboarding state could not be loaded.',
        );
      }

      this.onboarding.set(updatedOnboarding);

      const updatedOrganization = await this.getOrganization(organizationId);

      this.organization.set(updatedOrganization);

      if (updatedOrganization) {
        this.populateOrganizationForm(updatedOrganization);
      }

      /*
       * Step 2 needs the owner profile loaded only
       * after the backend has moved us to owner_profile.
       */
      if (updatedOnboarding.currentStep === 'owner_profile') {
        this.populateOwnerForm();
      }

      this.saveError.set(null);
    } catch (error: unknown) {
      console.error('Failed to save organization profile.', error);

      this.saveError.set(this.getErrorMessage(error, 'Unable to save organization profile.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected isCurrentStep(step: OrganizationOnboardingStep): boolean {
    return this.displayedStep() === step;
  }

  protected isStepCompleted(step: OrganizationOnboardingStep): boolean {
    return this.onboarding()?.completedSteps?.includes(step) ?? false;
  }

  protected isReviewingCompletedStep(): boolean {
    return this.reviewingStep() !== null;
  }

  protected displayedStep(): OrganizationOnboardingStep | null {
    // Completed organizations can reopen the configuration form for settings edits.
    if (this.isEditingSetup()) {
      return 'configuration';
    }

    const reviewing = this.reviewingStep();
    if (reviewing && this.requiredOnboardingSteps.includes(reviewing)) {
      return reviewing;
    }

    const onboarding = this.onboarding();
    if (!onboarding) {
      return null;
    }

    const currentStep = onboarding.currentStep;
    if (currentStep && this.requiredOnboardingSteps.includes(currentStep)) {
      return currentStep;
    }

    return (
      this.requiredOnboardingSteps.find(
        (step) => !(onboarding.completedSteps ?? []).includes(step),
      ) ?? 'configuration'
    );
  }

  protected displayedStepNumber(): number {
    const step = this.displayedStep();

    if (!step) {
      return 1;
    }

    const index = this.requiredOnboardingSteps.indexOf(step);

    return index >= 0 ? index + 1 : 1;
  }

  protected displayedStepLabel(): string {
    const step = this.displayedStep();

    if (!step) {
      return 'Organization Onboarding';
    }

    return this.stepMetadata[step]?.label ?? 'Organization Onboarding';
  }

  protected async reviewCompletedStep(step: OrganizationOnboardingStep): Promise<void> {
    if (!this.isStepCompleted(step)) {
      return;
    }

    this.reviewLoading.set(true);
    this.reviewError.set(null);

    try {
      const organizationId = this.organizationId();
      const onboarding = this.onboarding();

      if (!organizationId || !onboarding) {
        throw new Error('Onboarding information is not available.');
      }

      switch (step) {
        case 'organization_profile':
          if (this.organization()) {
            this.populateOrganizationForm(this.organization()!);
          }
          break;
        case 'owner_profile':
          await this.loadOwnerProfile(onboarding.ownerUserId);
          break;
        case 'invite_members':
          await this.loadInvitations();
          break;
        case 'configuration':
          await this.loadOrganizationConfiguration(organizationId);
          break;
      }

      this.reviewingStep.set(step);
    } catch (error: unknown) {
      console.error('Failed to load completed onboarding step for review.', error);
      this.reviewError.set(
        this.getErrorMessage(error, 'Unable to load the completed step for review.'),
      );
    } finally {
      this.reviewLoading.set(false);
    }
  }

  protected returnToCurrentStep(): void {
    this.reviewingStep.set(null);
    this.reviewError.set(null);
  }

  protected currentStepNumber(): number {
    const currentStep = this.onboarding()?.currentStep;

    if (!currentStep) {
      return 1;
    }

    const index = this.requiredOnboardingSteps.indexOf(currentStep);

    return index >= 0 ? index + 1 : 1;
  }

  protected currentStepLabel(): string {
    const currentStep = this.onboarding()?.currentStep;

    return currentStep && this.requiredOnboardingSteps.includes(currentStep)
      ? (this.stepMetadata[currentStep]?.label ?? 'Organization Onboarding')
      : 'Organization Onboarding';
  }

  protected progressPercentage(): number {
    const onboarding = this.onboarding();

    if (!onboarding) {
      return 0;
    }

    if (onboarding.status === 'completed') {
      return 100;
    }

    const requiredSteps = this.requiredOnboardingSteps;

    if (requiredSteps.length === 0) {
      return 0;
    }

    const completedSteps = new Set(onboarding.completedSteps ?? []);
    const completedCount = requiredSteps.filter((step) => completedSteps.has(step)).length;

    return Math.min(100, Math.round((completedCount / requiredSteps.length) * 100));
  }

  protected async goToPreviousStep(): Promise<void> {
    const currentStep = this.displayedStep();
    const currentIndex = currentStep ? this.requiredOnboardingSteps.indexOf(currentStep) : -1;

    if (currentIndex <= 0) {
      this.goBack();
      return;
    }

    const previousStep = this.requiredOnboardingSteps[currentIndex - 1];
    if (this.isStepCompleted(previousStep)) {
      await this.reviewCompletedStep(previousStep);
      return;
    }

    this.reviewingStep.set(null);
    this.reviewError.set(null);
  }

  protected goBack(): void {
    const organizationId = this.organizationId();

    if (!organizationId) {
      return;
    }

    void this.router.navigate(['/partner/org', organizationId, 'dashboard']);
  }

  protected async goToPartnerDashboard(): Promise<void> {
    const organizationId = this.organizationId();
    const onboarding = this.onboarding();

    if (!organizationId || onboarding?.status !== 'completed') {
      return;
    }

    await this.router.navigate(['/partner/org', organizationId, 'dashboard']);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (
        error as {
          message?: unknown;
        }
      ).message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  private populateOwnerForm(): void {
    const organizationId = this.organizationId();

    if (!organizationId) {
      return;
    }

    const onboarding = this.onboarding();

    if (!onboarding?.ownerUserId) {
      return;
    }

    void this.loadOwnerProfile(onboarding.ownerUserId);
  }

  private async loadOwnerProfile(ownerUserId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', ownerUserId);

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        return;
      }

      const user = snapshot.data() as Record<string, unknown>;

      this.ownerForm.patchValue({
        firstName: typeof user['firstName'] === 'string' ? user['firstName'] : '',

        lastName: typeof user['lastName'] === 'string' ? user['lastName'] : '',

        preferredName: typeof user['preferredName'] === 'string' ? user['preferredName'] : '',

        email: typeof user['email'] === 'string' ? user['email'] : '',

        phone: typeof user['phone'] === 'string' ? user['phone'] : '',
      });
    } catch (error) {
      console.error('Failed to load owner profile.', error);
    }
  }

  protected async saveOwnerProfile(): Promise<void> {
    this.ownerSaveError.set(null);

    if (this.ownerForm.invalid) {
      this.ownerForm.markAllAsTouched();
      return;
    }

    const organizationId = this.organizationId();

    if (!organizationId) {
      this.ownerSaveError.set('Organization ID is missing.');

      return;
    }

    this.ownerSaving.set(true);

    try {
      const formValue = this.ownerForm.getRawValue();

      const response = await this.onboardingService.updateOwnerProfile(organizationId, {
        firstName: formValue.firstName,

        lastName: formValue.lastName,

        preferredName: formValue.preferredName,

        phone: formValue.phone,
      });

      if (!response.success) {
        throw new Error('The owner profile could not be saved.');
      }

      const updatedOnboarding = await this.onboardingService.getOnboarding(organizationId);

      this.onboarding.set(updatedOnboarding);

      this.ownerSaveError.set(null);
    } catch (error: unknown) {
      console.error('Failed to save owner profile.', error);

      this.ownerSaveError.set(this.getErrorMessage(error, 'Unable to save owner profile.'));
    } finally {
      this.ownerSaving.set(false);
    }
  }
  protected async addInvitation(): Promise<void> {
    this.invitationError.set(null);

    const organizationId = this.organizationId();

    if (!organizationId) {
      this.invitationError.set('Organization ID is missing.');

      return;
    }

    const email = this.invitationEmail().trim().toLowerCase();

    if (!email) {
      this.invitationError.set('Enter an email address.');

      return;
    }

    this.invitationSaving.set(true);

    try {
      const response = await this.invitationService.createInvitation({
        organizationId,
        email,
        role: this.invitationRole(),
      });

      if (!response.success) {
        throw new Error('The invitation could not be created.');
      }

      this.invitationEmail.set('');

      await this.loadInvitations();
    } catch (error: unknown) {
      console.error('Failed to create organization invitation.', error);

      this.invitationError.set(this.getErrorMessage(error, 'Unable to create invitation.'));
    } finally {
      this.invitationSaving.set(false);
    }
  }
  protected invitationRoleLabel(role: OrganizationInvitationRole): string {
    return this.invitationRoles.find((item) => item.value === role)?.label ?? role;
  }
  private async loadInvitations(): Promise<void> {
    const organizationId = this.organizationId();

    if (!organizationId) {
      return;
    }

    const response = await this.invitationService.getInvitations(organizationId);

    this.invitations.set(response.invitations);
  }
  protected async continueInviteMembers(): Promise<void> {
    const organization = this.organization();
    const onboarding = this.onboarding();

    if (!organization || !onboarding) {
      return;
    }

    this.invitationSaving.set(true);
    this.invitationError.set(null);

    try {
      await this.invitationService.completeInviteMembersStep(organization.id);

      await this.load();
    } catch (error) {
      console.error('Failed to complete invite members onboarding step:', error);

      this.invitationError.set(
        error instanceof Error ? error.message : 'Unable to continue onboarding. Please try again.',
      );
    } finally {
      this.invitationSaving.set(false);
    }
  }

  private async loadOrganizationConfiguration(organizationId: string): Promise<void> {
    try {
      const settingsRef = doc(this.firestore, 'organizationSettings', organizationId);

      const snapshot = await getDoc(settingsRef);

      if (!snapshot.exists()) {
        return;
      }

      const settings = snapshot.data() as Record<string, unknown>;

      this.configuration = {
        allowSelfRegistration:
          typeof settings['allowSelfRegistration'] === 'boolean'
            ? settings['allowSelfRegistration']
            : false,
        defaultMemberRole:
          settings['defaultMemberRole'] === 'org_staff' ||
          settings['defaultMemberRole'] === 'org_manager' ||
          settings['defaultMemberRole'] === 'org_member'
            ? settings['defaultMemberRole']
            : 'org_member',
        adminNotifications:
          typeof settings['adminNotifications'] === 'boolean'
            ? settings['adminNotifications']
            : true,
        primaryColor:
          typeof settings['primaryColor'] === 'string' ? settings['primaryColor'] : '#007979',
        secondaryColor:
          typeof settings['secondaryColor'] === 'string' ? settings['secondaryColor'] : '#032D42',
      };
    } catch (error) {
      console.error('Failed to load organization configuration.', error);
    }
  }

  protected async saveConfiguration(): Promise<void> {
    this.configurationSaveError.set(null);

    const organizationId = this.organizationId();

    if (!organizationId) {
      this.configurationSaveError.set('Organization ID is missing.');

      return;
    }

    this.configurationSaving.set(true);

    try {
      const response = await this.onboardingService.completeOrganizationConfiguration(
        organizationId,
        // The onboarding UI sends only organization-wide settings. Keep the
        // service/callable contract aligned with this core-only payload.
        this.configuration as Parameters<
          PartnerOrganizationOnboardingService['completeOrganizationConfiguration']
        >[1],
      );

      if (!response.success) {
        throw new Error('The organization configuration could not be saved.');
      }

      /**
       * Reload the authoritative onboarding state.
       */
      const updatedOnboarding = await this.onboardingService.getOnboarding(organizationId);

      /**
       * The onboarding document should exist because
       * the Cloud Function just completed Step 4.
       */
      if (!updatedOnboarding) {
        throw new Error(
          'Organization onboarding could not be found after configuration was saved.',
        );
      }

      /**
       * Update the component state only after confirming
       * the backend returned a valid onboarding document.
       */
      this.onboarding.set(updatedOnboarding);

      if (updatedOnboarding.status !== 'completed') {
        throw new Error(
          'Configuration was saved, but the backend has not marked organization onboarding as completed. Please try again or contact support.',
        );
      }

      this.configurationSaveError.set(null);
      this.isEditingSetup.set(false);
      this.reviewingStep.set(null);
      this.showReviewPage.set(true);
    } catch (error: unknown) {
      console.error('Failed to save organization configuration.', error);

      const message = this.getErrorMessage(error, 'Unable to submit organization configuration.');
      this.configurationSaveError.set(
        /test.?center|test center setting/i.test(message)
          ? 'Unable to submit organization configuration. Please try again.'
          : message,
      );
    } finally {
      this.configurationSaving.set(false);
    }
  }

  protected async editOrganizationSetup(): Promise<void> {
    const organizationId = this.organizationId();

    if (!organizationId) {
      this.configurationSaveError.set('Organization ID is missing.');
      return;
    }

    this.reviewError.set(null);
    this.configurationSaveError.set(null);
    this.reviewingStep.set(null);
    await this.loadOrganizationConfiguration(organizationId);
    this.isEditingSetup.set(true);
    this.showReviewPage.set(false);
  }
}

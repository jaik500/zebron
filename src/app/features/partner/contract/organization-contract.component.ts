import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { httpsCallable } from 'firebase/functions';

import { ApplicationRegistryService } from '../../../core/services/application-registry.service';
import { firebaseFunctions } from '../../../core/services/firebase-config';
import { PageTitleService } from '../../../core/services/page-title.service';
import { ContractPdfService } from './contract-pdf.service';
import {
  ContractOverview,
  OrganizationContractService,
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestType,
} from './organization-contract.service';

interface RequestForm {
  type: ServiceRequestType;
  applicationId: string | null;
  reason: string;
  newOwnerUserId: string | null;
  confirmName: string;
}

interface ApplicationRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  activatedAt: string | null;
  openRequest: ServiceRequest | null;
}

const APPLICATION_STATUS: Record<string, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-700' },
  suspended: { label: 'Suspended', classes: 'bg-amber-50 text-amber-800' },
  deactivated: { label: 'Retired', classes: 'bg-gray-100 text-gray-600' },
  selected: { label: 'Requested', classes: 'bg-sky-50 text-sky-800' },
  provisioning: { label: 'Provisioning', classes: 'bg-sky-50 text-sky-800' },
  failed: { label: 'Provisioning failed', classes: 'bg-red-50 text-red-700' },
  none: { label: 'Not provisioned', classes: 'bg-gray-50 text-gray-500' },
};

const FORM_COPY: Record<ServiceRequestType, { title: string; reasonLabel: string; reasonRequired: boolean; button: string }> = {
  add_application: { title: 'Request an application', reasonLabel: 'What will you use it for? (optional)', reasonRequired: false, button: 'Send request' },
  suspend_application: { title: 'Request suspension', reasonLabel: 'Why should it be suspended? (optional)', reasonRequired: false, button: 'Send request' },
  resume_application: { title: 'Request to resume', reasonLabel: 'Anything Zebron should know? (optional)', reasonRequired: false, button: 'Send request' },
  retire_application: { title: 'Request retirement', reasonLabel: 'Why are you retiring it? (optional)', reasonRequired: false, button: 'Send request' },
  terminate_contract: { title: 'Terminate the contract', reasonLabel: 'Why are you ending the contract?', reasonRequired: true, button: 'Give notice of termination' },
  transfer_ownership: { title: 'Transfer ownership', reasonLabel: 'Note for Zebron (optional)', reasonRequired: false, button: 'Send to Zebron' },
  data_export: { title: 'Request a data export', reasonLabel: 'What data do you need? (optional)', reasonRequired: false, button: 'Send request' },
  billing_question: { title: 'Billing question', reasonLabel: 'Your question', reasonRequired: true, button: 'Send to Zebron' },
  other: { title: 'Other request', reasonLabel: 'Describe your request', reasonRequired: true, button: 'Send to Zebron' },
};

/**
 * Contract & Billing for an organization (managers and above).
 *
 * Shows the contract, provisioned applications, billing contact and the
 * agreement (downloadable as PDF), and lets the organization send
 * requests to Zebron. Managers and admins' application requests go to
 * the owner for approval first. Termination and ownership transfer are
 * owner-only.
 *
 * Route: /partner/org/:organizationId/contract
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-organization-contract',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 pt-16">
      <header class="border-b border-white/10 bg-[#2a835f]">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div class="min-w-0">
            <h1 class="text-2xl font-bold text-white">{{ 'Contract & Billing' | t }}</h1>
            <p class="text-sm text-white/80">{{ 'Your agreement with Zebron, applications and requests.' | t }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <a mat-stroked-button class="!border-white/40 !text-white" [routerLink]="['/partner/org', organizationId, 'settings']">
              <mat-icon>arrow_back</mat-icon>
              {{ 'Administration' | t }}
            </a>

            <button mat-flat-button type="button" class="!bg-white !text-[#007979]" [disabled]="!overview()" (click)="downloadPdf()">
              <mat-icon>picture_as_pdf</mat-icon>
              {{ 'Download PDF' | t }}
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (message(); as note) {
          <p class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{{ note }}</p>
        }

        @if (error()) {
          <p class="mb-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error() | t }}</p>
        }

        @if (loading()) {
          <section class="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">{{ 'Loading your contract…' | t }}</section>
        } @else if (overview(); as data) {
          <!-- ============ TERMINATION NOTICE ============ -->
          @if (data.contract.status === 'notice' && data.contract.termination; as termination) {
            <section class="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
              <div class="flex items-start gap-3">
                <mat-icon class="shrink-0 text-red-700">event_busy</mat-icon>
                <div>
                  <p class="font-semibold text-red-900">{{ 'This contract ends on {0}' | t: [(termination.effectiveDate | date: 'longDate')] }}</p>
                  <p class="mt-1 text-sm text-red-800">
                    {{ 'Notice given by {0} on {1}. Everyone keeps access until then. Request a data export before it ends if you need your data.' | t: [(termination.requestedByName || 'the owner'), (termination.requestedAt | date: 'mediumDate')] }}
                  </p>
                </div>
              </div>

              @if (data.viewer.isOwner) {
                <button mat-flat-button type="button" class="shrink-0 !bg-red-700 !text-white" [disabled]="busy()" (click)="cancelTermination()">
                  <mat-icon>undo</mat-icon>
                  {{ 'Cancel termination' | t }}
                </button>
              }
            </section>
          }

          @if (data.contract.status === 'terminated') {
            <section class="mb-5 rounded-xl border border-gray-300 bg-gray-100 p-5 text-sm text-gray-800">
              {{ 'This contract ended on {0}. Contact Zebron to restart your partnership.' | t: [(data.contract.terminatedAt | date: 'longDate')] }}
            </section>
          }

          <!-- ============ TERMS ACCEPTANCE ============ -->
          @if (needsAcceptance()) {
            <section class="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <mat-icon class="shrink-0 text-amber-700">gavel</mat-icon>
                <div>
                  <p class="font-semibold text-amber-900">
                    {{ data.contract.acceptedTermsVersion ? ('The agreement has been updated' | t) : ('Please review and accept the agreement' | t) }}
                  </p>
                  <p class="mt-1 text-sm text-amber-800">
                    @if (data.viewer.isOwner) {
                      {{ 'Read the agreement below, then accept it on behalf of {0}.' | t: [data.organization.name] }}
                    } @else {
                      {{ 'The organization owner needs to accept version {0}.' | t: [data.terms.version] }}
                    }
                  </p>
                </div>
              </div>

              @if (data.viewer.isOwner) {
                <div class="flex shrink-0 gap-2">
                  <button mat-stroked-button type="button" (click)="termsOpen.set(true); scrollToTerms()">{{ 'Read agreement' | t }}</button>
                  <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busy()" (click)="acceptTerms()">
                    <mat-icon>task_alt</mat-icon>
                    {{ 'Accept' | t }}
                  </button>
                </div>
              }
            </section>
          }

          <!-- ============ REQUEST FORM ============ -->
          @if (form(); as current) {
            <section class="mb-6 rounded-xl border-2 p-5 shadow-sm sm:p-6"
              [class]="current.type === 'terminate_contract' ? 'border-red-300 bg-white' : 'border-[#007979]/30 bg-white'">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h2 class="text-lg font-bold" [class]="current.type === 'terminate_contract' ? 'text-red-800' : 'text-gray-900'">
                  {{ formCopy(current.type).title | t }}
                  @if (current.applicationId) {
                    : {{ applicationName(current.applicationId) | t }}
                  }
                </h2>
                <button mat-button type="button" (click)="form.set(null)">
                  <mat-icon>close</mat-icon>
                  {{ 'Cancel' | t }}
                </button>
              </div>

              @if (approvalNote(current.type); as note) {
                <p class="mb-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">{{ note }}</p>
              }

              @if (current.type === 'terminate_contract') {
                <div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <p class="font-semibold">{{ 'What happens next' | t }}</p>
                  <ul class="mt-1 list-disc space-y-0.5 pl-5">
                    <li>{{ 'Your {0}-day notice period starts today. Access ends on {1}.' | t: [data.contract.noticePeriodDays, (terminationDate() | date: 'longDate')] }}</li>
                    <li>{{ 'You can cancel the termination any time before then.' | t }}</li>
                    <li>{{ 'After it ends, your organization is suspended and your data is kept for 90 days for export.' | t }}</li>
                  </ul>
                </div>
              }

              @if (current.type === 'transfer_ownership') {
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>{{ 'New owner' | t }}</mat-label>
                  <mat-select [value]="current.newOwnerUserId" (selectionChange)="patchForm({ newOwnerUserId: $event.value })">
                    @for (member of transferCandidates(); track member.userId) {
                      <mat-option [value]="member.userId">{{ member.displayName || member.email || ('Unnamed member' | t) }}</mat-option>
                    } @empty {
                      <mat-option [value]="null" disabled>{{ 'No other members found' | t }}</mat-option>
                    }
                  </mat-select>
                  <mat-hint>{{ 'You become an administrator once Zebron completes the transfer.' | t }}</mat-hint>
                </mat-form-field>
              }

              <mat-form-field appearance="outline" class="zb-field">
                <mat-label>{{ formCopy(current.type).reasonLabel | t }}</mat-label>
                <textarea matInput rows="3" maxlength="2000" [ngModel]="current.reason" (ngModelChange)="patchForm({ reason: $event })" name="reason"></textarea>
              </mat-form-field>

              @if (current.type === 'terminate_contract') {
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>{{ 'Type "{0}" to confirm' | t: [data.organization.name] }}</mat-label>
                  <input matInput autocomplete="off" [ngModel]="current.confirmName" (ngModelChange)="patchForm({ confirmName: $event })" name="confirmName" />
                </mat-form-field>
              }

              <div class="flex justify-end gap-2">
                <button mat-button type="button" (click)="form.set(null)">{{ 'Cancel' | t }}</button>
                <button
                  mat-flat-button
                  type="button"
                  [class]="current.type === 'terminate_contract' ? '!bg-red-700 !text-white' : '!bg-[#007979] !text-white'"
                  [disabled]="busy() || !formValid()"
                  (click)="submitForm()"
                >
                  {{ busy() ? ('Sending…' | t) : formCopy(current.type).button }}
                </button>
              </div>
            </section>
          }

          <!-- ============ SUMMARY + BILLING ============ -->
          <div class="grid gap-5 lg:grid-cols-2">
            <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#007979]">description</mat-icon>
                <h2 class="text-lg font-bold text-gray-900">{{ 'Contract' | t }}</h2>
                <span class="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold" [class]="contractStatusClass()">{{ contractStatusLabel() | t }}</span>
              </div>

              <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt class="text-xs text-gray-500">{{ 'Contract number' | t }}</dt><dd class="font-medium text-gray-900">{{ data.contract.contractNumber }}</dd></div>
                <div><dt class="text-xs text-gray-500">{{ 'Plan' | t }}</dt><dd class="font-medium text-gray-900">{{ data.contract.planName }}</dd></div>
                <div><dt class="text-xs text-gray-500">{{ 'Effective date' | t }}</dt><dd class="font-medium text-gray-900">{{ data.contract.effectiveDate | date: 'mediumDate' }}</dd></div>
                <div><dt class="text-xs text-gray-500">{{ 'Notice period' | t }}</dt><dd class="font-medium text-gray-900">{{ '{0} days' | t: [data.contract.noticePeriodDays] }}</dd></div>
                <div class="col-span-2">
                  <dt class="text-xs text-gray-500">{{ 'Agreement' | t }}</dt>
                  <dd class="font-medium text-gray-900">
                    {{ 'Version {0}' | t: [data.terms.version] }}
                    @if (data.contract.acceptedAt) {
                      <span class="block text-xs font-normal text-gray-500">
                        {{ 'Accepted by {0} on {1}' | t: [(data.contract.acceptedByName || 'the owner'), (data.contract.acceptedAt | date: 'mediumDate')] }}
                        @if (data.contract.acceptedTermsVersion !== data.terms.version) {
                          {{ '(version {0})' | t: [data.contract.acceptedTermsVersion] }}
                        }
                      </span>
                    } @else {
                      <span class="block text-xs font-normal text-amber-700">{{ 'Not accepted yet' | t }}</span>
                    }
                  </dd>
                </div>
              </dl>
            </section>

            <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div class="flex items-center gap-2">
                <mat-icon class="text-[#007979]">receipt_long</mat-icon>
                <h2 class="text-lg font-bold text-gray-900">{{ 'Billing' | t }}</h2>
                @if (!editingBilling()) {
                  <button mat-button type="button" class="!ml-auto" (click)="startBillingEdit()">
                    <mat-icon>edit</mat-icon>
                    {{ 'Edit' | t }}
                  </button>
                }
              </div>

              @if (editingBilling()) {
                <div class="mt-4 grid gap-x-4 sm:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Billing contact name' | t }}</mat-label>
                    <input matInput [(ngModel)]="billing.name" name="billingName" required />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Billing email' | t }}</mat-label>
                    <input matInput type="email" inputmode="email" [(ngModel)]="billing.email" name="billingEmail" required />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>{{ 'Phone' | t }}</mat-label>
                    <input matInput type="tel" inputmode="tel" [(ngModel)]="billing.phone" name="billingPhone" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field sm:col-span-2">
                    <mat-label>{{ 'Billing address' | t }}</mat-label>
                    <textarea matInput rows="2" [(ngModel)]="billing.address" name="billingAddress"></textarea>
                  </mat-form-field>
                </div>
                <div class="flex justify-end gap-2">
                  <button mat-button type="button" (click)="editingBilling.set(false)">{{ 'Cancel' | t }}</button>
                  <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busy() || !billing.name.trim() || !billing.email.trim()" (click)="saveBilling()">{{ 'Save' | t }}</button>
                </div>
              } @else {
                <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><dt class="text-xs text-gray-500">{{ 'Contact' | t }}</dt><dd class="break-words font-medium text-gray-900">{{ data.contract.billingContact.name || '—' }}</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ 'Email' | t }}</dt><dd class="break-all font-medium text-gray-900">{{ data.contract.billingContact.email || '—' }}</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ 'Phone' | t }}</dt><dd class="font-medium text-gray-900">{{ data.contract.billingContact.phone || '—' }}</dd></div>
                  <div><dt class="text-xs text-gray-500">{{ 'Address' | t }}</dt><dd class="whitespace-pre-line break-words font-medium text-gray-900">{{ data.contract.billingContact.address || '—' }}</dd></div>
                </dl>
                <p class="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  {{ 'No fees are set up for your organization. Any pricing will be agreed with Zebron and shown here.' | t }}
                </p>
                <button mat-button type="button" class="mt-2" (click)="openForm('billing_question')">
                  <mat-icon>help</mat-icon>
                  {{ 'Ask a billing question' | t }}
                </button>
              }
            </section>
          </div>

          <!-- ============ APPLICATIONS ============ -->
          <section class="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 sm:px-6">
              <mat-icon class="text-[#007979]">apps</mat-icon>
              <h2 class="text-lg font-bold text-gray-900">{{ 'Applications' | t }}</h2>
              <span class="ml-auto text-sm text-gray-500">{{ '{0} provisioned' | t: [provisionedCount()] }}</span>
            </div>

            <ul class="divide-y divide-gray-100">
              @for (app of applicationRows(); track app.id) {
                <li class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                  <div class="flex min-w-0 flex-1 items-start gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]">
                      <mat-icon>{{ app.icon }}</mat-icon>
                    </span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="font-semibold text-gray-900">{{ app.name | t }}</p>
                        <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusInfo(app.status).classes">{{ statusInfo(app.status).label | t }}</span>
                        @if (app.openRequest; as pending) {
                          <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="requestStatusClass(pending.status)">
                            {{ pending.title.split(':')[0] }} · {{ requestStatusLabel(pending.status) | t }}
                          </span>
                        }
                      </div>
                      <p class="mt-0.5 line-clamp-2 text-sm text-gray-500">{{ app.description | t }}</p>
                      @if (app.activatedAt && app.status === 'active') {
                        <p class="mt-0.5 text-xs text-gray-400">{{ 'Active since {0}' | t: [(app.activatedAt | date: 'mediumDate')] }}</p>
                      }
                    </div>
                  </div>

                  @if (data.viewer.canRequest && !app.openRequest && data.contract.status !== 'terminated') {
                    <div class="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      @switch (app.status) {
                        @case ('active') {
                          <button mat-stroked-button type="button" (click)="openForm('suspend_application', app.id)">
                            <mat-icon>pause_circle</mat-icon>
                            {{ 'Suspend' | t }}
                          </button>
                          <button mat-stroked-button type="button" (click)="openForm('retire_application', app.id)">
                            <mat-icon>remove_circle</mat-icon>
                            {{ 'Retire' | t }}
                          </button>
                        }
                        @case ('suspended') {
                          <button mat-stroked-button type="button" (click)="openForm('resume_application', app.id)">
                            <mat-icon>play_circle</mat-icon>
                            {{ 'Resume' | t }}
                          </button>
                          <button mat-stroked-button type="button" (click)="openForm('retire_application', app.id)">
                            <mat-icon>remove_circle</mat-icon>
                            {{ 'Retire' | t }}
                          </button>
                        }
                        @case ('provisioning') {}
                        @default {
                          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" (click)="openForm('add_application', app.id)">
                            <mat-icon>add</mat-icon>
                            {{ 'Request' | t }}
                          </button>
                        }
                      }
                    </div>
                  }
                </li>
              }
            </ul>
          </section>

          <!-- ============ REQUESTS ============ -->
          <section class="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-4 sm:px-6">
              <mat-icon class="text-[#007979]">assignment</mat-icon>
              <h2 class="text-lg font-bold text-gray-900">{{ 'Requests' | t }}</h2>
              @if (awaitingOwnerCount() > 0 && data.viewer.canApprove) {
                <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{{ '{0} need your approval' | t: [awaitingOwnerCount()] }}</span>
              }
              <button mat-icon-button type="button" class="!ml-auto" [attr.aria-label]="'Refresh' | t" [title]="'Refresh' | t" (click)="load()">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>

            @if (data.requests.length === 0) {
              <p class="px-5 py-6 text-sm text-gray-500 sm:px-6">{{ 'No requests yet.' | t }}</p>
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (item of data.requests; track item.id) {
                  <li class="px-5 py-4 sm:px-6">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="font-semibold text-gray-900">{{ item.title }}</p>
                          <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="requestStatusClass(item.status)">{{ requestStatusLabel(item.status) | t }}</span>
                        </div>
                        <p class="mt-0.5 text-xs text-gray-500">
                          {{ item.requestedByName || ('Someone' | t) }} · {{ item.createdAt | date: 'medium' }}
                          @if (item.ownerApprovedByName) {
                            {{ '· approved by {0}' | t: [item.ownerApprovedByName] }}
                          }
                        </p>
                        @if (item.newOwnerName) {
                          <p class="mt-1 text-sm text-gray-700">{{ 'New owner: {0}' | t: [item.newOwnerName] }}</p>
                        }
                        @if (item.reason) {
                          <p class="mt-1 whitespace-pre-line break-words text-sm text-gray-700">{{ item.reason }}</p>
                        }
                        @if (item.outcome || item.reviewNote) {
                          <p class="mt-1 rounded-lg bg-gray-50 p-2 text-sm text-gray-700"><strong>{{ 'Zebron:' | t }}</strong> {{ item.outcome || item.reviewNote }}</p>
                        }
                      </div>

                      <div class="flex shrink-0 flex-wrap gap-2">
                        @if (item.status === 'awaiting_owner' && data.viewer.canApprove) {
                          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" [disabled]="busy()" (click)="respond(item, 'approve')">
                            <mat-icon>check</mat-icon>
                            {{ 'Approve' | t }}
                          </button>
                          <button mat-stroked-button type="button" [disabled]="busy()" (click)="respond(item, 'decline')">{{ 'Decline' | t }}</button>
                        }
                        @if (canWithdraw(item)) {
                          <button mat-button type="button" [disabled]="busy()" (click)="respond(item, 'withdraw')">
                            <mat-icon>undo</mat-icon>
                            {{ 'Withdraw' | t }}
                          </button>
                        }
                      </div>
                    </div>
                  </li>
                }
              </ul>
            }
          </section>

          <!-- ============ MORE ACTIONS ============ -->
          @if (data.viewer.canRequest && data.contract.status !== 'terminated') {
            <section class="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 class="text-lg font-bold text-gray-900">{{ 'More requests' | t }}</h2>
              <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button type="button" class="rounded-xl border border-gray-200 p-4 text-left transition hover:border-[#007979]/40 hover:bg-teal-50/40" (click)="openForm('data_export')">
                  <mat-icon class="text-[#007979]">download</mat-icon>
                  <p class="mt-2 font-semibold text-gray-900">{{ 'Export our data' | t }}</p>
                  <p class="text-sm text-gray-500">{{ 'Get a copy of your organization\\u0027s data.' | t }}</p>
                </button>

                <button type="button" class="rounded-xl border border-gray-200 p-4 text-left transition hover:border-[#007979]/40 hover:bg-teal-50/40" (click)="openForm('other')">
                  <mat-icon class="text-[#007979]">support_agent</mat-icon>
                  <p class="mt-2 font-semibold text-gray-900">{{ 'Something else' | t }}</p>
                  <p class="text-sm text-gray-500">{{ 'Contract changes, support or questions.' | t }}</p>
                </button>

                @if (data.viewer.isOwner) {
                  <button type="button" class="rounded-xl border border-gray-200 p-4 text-left transition hover:border-[#007979]/40 hover:bg-teal-50/40" (click)="openForm('transfer_ownership')">
                    <mat-icon class="text-[#007979]">swap_horiz</mat-icon>
                    <p class="mt-2 font-semibold text-gray-900">{{ 'Transfer ownership' | t }}</p>
                    <p class="text-sm text-gray-500">{{ 'Hand the owner role to another member.' | t }}</p>
                  </button>

                  @if (data.contract.status === 'active') {
                    <button type="button" class="rounded-xl border border-red-200 p-4 text-left transition hover:bg-red-50" (click)="openForm('terminate_contract')">
                      <mat-icon class="text-red-700">cancel</mat-icon>
                      <p class="mt-2 font-semibold text-red-800">{{ 'Terminate contract' | t }}</p>
                      <p class="text-sm text-red-700/80">{{ '{0}-day notice, can be cancelled.' | t: [data.contract.noticePeriodDays] }}</p>
                    </button>
                  }
                }
              </div>
              @if (!data.viewer.isOwner) {
                <p class="mt-3 text-xs text-gray-500">{{ 'Only the owner can transfer ownership or terminate the contract.' | t }}</p>
              }
            </section>
          }

          <!-- ============ AGREEMENT ============ -->
          <section id="contract-terms" class="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 sm:px-6"
              [attr.aria-expanded]="termsOpen()"
              (click)="termsOpen.set(!termsOpen())"
            >
              <span class="flex items-center gap-2">
                <mat-icon class="text-[#007979]">gavel</mat-icon>
                <span>
                  <span class="block text-lg font-bold text-gray-900">{{ data.terms.title }}</span>
                  <span class="block text-xs text-gray-500">{{ 'Version {0}' | t: [data.terms.version] }}</span>
                </span>
              </span>
              <mat-icon>{{ termsOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>

            @if (termsOpen()) {
              <div class="space-y-4 border-t border-gray-100 px-5 py-5 sm:px-6">
                @for (section of data.terms.sections; track $index) {
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ section.heading | t }}</h3>
                    <p class="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">{{ section.body }}</p>
                  </div>
                }
              </div>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class OrganizationContractComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contracts = inject(OrganizationContractService);
  private readonly pdf = inject(ContractPdfService);
  private readonly registry = inject(ApplicationRegistryService);
  private readonly pageTitleService = inject(PageTitleService);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  protected readonly overview = signal<ContractOverview | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly termsOpen = signal(false);
  protected readonly editingBilling = signal(false);
  protected readonly form = signal<RequestForm | null>(null);
  protected readonly members = signal<Array<{ userId: string; displayName: string | null; email: string | null }>>([]);

  protected billing = { name: '', email: '', phone: '', address: '' };

  protected readonly applicationRows = computed<ApplicationRow[]>(() => {
    const data = this.overview();

    if (!data) {
      return [];
    }

    const entitlements = new Map(data.applications.map((item) => [item.applicationId, item]));
    const openRequests = data.requests.filter((item) => item.status === 'awaiting_owner' || item.status === 'submitted');

    return this.registry
      .getEnabledApplications()
      .filter((application) => application.requiresOrganization && application.id !== 'core')
      .map((application) => {
        const entitlement = entitlements.get(application.id);

        return {
          id: application.id,
          name: application.name,
          description: application.description,
          icon: application.icon ?? 'apps',
          status: entitlement?.status && entitlement.status !== 'available' ? entitlement.status : 'none',
          activatedAt: entitlement?.activatedAt ?? null,
          openRequest: openRequests.find((item) => item.applicationId === application.id) ?? null,
        };
      })
      .sort((a, b) => this.statusOrder(a.status) - this.statusOrder(b.status) || a.name.localeCompare(b.name));
  });

  protected readonly provisionedCount = computed(
    () => this.applicationRows().filter((row) => row.status === 'active' || row.status === 'suspended').length,
  );

  protected readonly awaitingOwnerCount = computed(
    () => this.overview()?.requests.filter((item) => item.status === 'awaiting_owner').length ?? 0,
  );

  protected readonly needsAcceptance = computed(() => {
    const data = this.overview();
    return Boolean(data && data.contract.status !== 'terminated' && data.contract.acceptedTermsVersion !== data.terms.version);
  });

  protected readonly transferCandidates = computed(() =>
    this.members().filter((member) => member.userId !== this.overview()?.viewer.uid),
  );

  protected readonly terminationDate = computed(() => {
    const days = this.overview()?.contract.noticePeriodDays ?? 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  });

  protected readonly contractStatusLabel = computed(() => {
    switch (this.overview()?.contract.status) {
      case 'notice':
        return 'Ending';
      case 'terminated':
        return 'Ended';
      default:
        return 'Active';
    }
  });

  protected readonly contractStatusClass = computed(() => {
    switch (this.overview()?.contract.status) {
      case 'notice':
        return 'bg-red-50 text-red-700';
      case 'terminated':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-emerald-50 text-emerald-700';
    }
  });

  protected readonly formValid = computed(() => {
    const current = this.form();
    const data = this.overview();

    if (!current || !data) {
      return false;
    }

    if (FORM_COPY[current.type].reasonRequired && !current.reason.trim()) {
      return false;
    }

    if (current.type === 'transfer_ownership' && !current.newOwnerUserId) {
      return false;
    }

    if (current.type === 'terminate_contract') {
      return current.confirmName.trim().toLowerCase() === data.organization.name.toLowerCase();
    }

    return true;
  });

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Contract & Billing');
    await this.load();
  }

  protected async load(): Promise<void> {
    this.error.set('');

    try {
      this.overview.set(await this.contracts.getOverview(this.organizationId));
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------- Requests ----------------

  protected openForm(type: ServiceRequestType, applicationId: string | null = null): void {
    this.message.set('');
    this.error.set('');
    this.form.set({ type, applicationId, reason: '', newOwnerUserId: null, confirmName: '' });

    if (type === 'transfer_ownership' && this.members().length === 0) {
      void this.loadMembers();
    }

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected patchForm(changes: Partial<RequestForm>): void {
    const current = this.form();

    if (current) {
      this.form.set({ ...current, ...changes });
    }
  }

  protected async submitForm(): Promise<void> {
    const current = this.form();

    if (!current || !this.formValid()) {
      return;
    }

    await this.run(async () => {
      const result = await this.contracts.submitRequest({
        organizationId: this.organizationId,
        type: current.type,
        applicationId: current.applicationId,
        reason: current.reason.trim(),
        newOwnerUserId: current.newOwnerUserId ?? undefined,
        confirmName: current.confirmName.trim(),
      });

      this.form.set(null);
      this.message.set(
        current.type === 'terminate_contract'
          ? 'Your termination notice has been recorded. You can cancel it until the notice period ends.'
          : result.status === 'awaiting_owner'
            ? 'Request saved. The organization owner has been asked to approve it before it goes to Zebron.'
            : 'Request sent to Zebron. You will get an email when it is handled.',
      );
    });
  }

  protected async respond(item: ServiceRequest, action: 'approve' | 'decline' | 'withdraw'): Promise<void> {
    await this.run(async () => {
      await this.contracts.respond(item.id, action);
      this.message.set(
        action === 'approve'
          ? 'Approved and sent to Zebron.'
          : action === 'decline'
            ? 'Request declined. The requester has been told.'
            : 'Request withdrawn.',
      );
    });
  }

  protected canWithdraw(item: ServiceRequest): boolean {
    const data = this.overview();

    return Boolean(
      data &&
        item.type !== 'terminate_contract' &&
        (item.status === 'awaiting_owner' || item.status === 'submitted') &&
        (item.requestedBy === data.viewer.uid || data.viewer.isOwner),
    );
  }

  protected async cancelTermination(): Promise<void> {
    await this.run(async () => {
      await this.contracts.cancelTermination(this.organizationId);
      this.message.set('Termination cancelled. Your contract remains active.');
    });
  }

  protected async acceptTerms(): Promise<void> {
    await this.run(async () => {
      await this.contracts.acceptTerms(this.organizationId);
      this.message.set('Thank you. The agreement has been accepted.');
    });
  }

  // ---------------- Billing ----------------

  protected startBillingEdit(): void {
    const contact = this.overview()?.contract.billingContact;

    this.billing = {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      address: contact?.address ?? '',
    };

    this.editingBilling.set(true);
  }

  protected async saveBilling(): Promise<void> {
    await this.run(async () => {
      await this.contracts.updateBillingContact(this.organizationId, this.billing);
      this.editingBilling.set(false);
      this.message.set('Billing details saved.');
    });
  }

  // ---------------- PDF ----------------

  protected downloadPdf(): void {
    const data = this.overview();

    if (data) {
      this.pdf.download(data, (id) => this.applicationName(id));
    }
  }

  // ---------------- View helpers ----------------

  protected applicationName(id: string): string {
    return this.registry.getEnabledApplications().find((application) => application.id === id)?.name ?? id;
  }

  protected formCopy(type: ServiceRequestType) {
    return FORM_COPY[type];
  }

  protected approvalNote(type: ServiceRequestType): string | null {
    const data = this.overview();

    if (!data) {
      return null;
    }

    const needsOwner = ['add_application', 'suspend_application', 'resume_application', 'retire_application', 'data_export'].includes(type);

    if (needsOwner && !data.viewer.isOwner && !data.viewer.isPlatformAdmin) {
      return 'The organization owner approves this request before it goes to Zebron.';
    }

    if (type === 'transfer_ownership') {
      return 'Zebron verifies and completes ownership transfers.';
    }

    return null;
  }

  protected statusInfo(status: string) {
    return APPLICATION_STATUS[status] ?? APPLICATION_STATUS['none'];
  }

  protected requestStatusLabel(status: ServiceRequestStatus): string {
    return REQUEST_STATUS_LABELS[status] ?? status;
  }

  protected requestStatusClass(status: ServiceRequestStatus): string {
    return REQUEST_STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-600';
  }

  protected scrollToTerms(): void {
    setTimeout(() => document.getElementById('contract-terms')?.scrollIntoView({ behavior: 'smooth' }));
  }

  private statusOrder(status: string): number {
    return ['active', 'suspended', 'provisioning', 'selected', 'failed', 'deactivated', 'none'].indexOf(status);
  }

  private async loadMembers(): Promise<void> {
    try {
      const callable = httpsCallable<
        { organizationId: string },
        { members: Array<{ userId: string; displayName: string | null; email: string | null }> }
      >(firebaseFunctions, 'getOrganizationMemberDirectory');

      this.members.set((await callable({ organizationId: this.organizationId })).data.members ?? []);
    } catch (error) {
      this.error.set(`Members could not be loaded. ${this.messageOf(error)}`);
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.message.set('');

    try {
      await action();
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }

  private messageOf(error: unknown): string {
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

    if (code.includes('not-found') && error instanceof Error && /internal|NOT_FOUND/i.test(error.message)) {
      return 'The contract service is not available yet. Deploy the Cloud Functions and try again.';
    }

    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}

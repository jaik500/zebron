import { CommonModule } from '@angular/common';

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatChipsModule } from '@angular/material/chips';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';

import { MatInputModule } from '@angular/material/input';

import { MatProgressBarModule } from '@angular/material/progress-bar';

import { MatTooltipModule } from '@angular/material/tooltip';

import { firstValueFrom } from 'rxjs';

import { Timestamp } from 'firebase/firestore';

import { HotToastService } from '@ngxpert/hot-toast';

import { BusinessStore } from '../../store/business.store';

import { BusinessDocument, BusinessDocumentCategory } from '../../models/business-document.model';

import {
  BusinessDocumentDialogComponent,
  BusinessDocumentDialogData,
  BusinessDocumentDialogResult,
} from '../../components/document-dialog/business-document-dialog.component';

import { CollapsibleRecord } from '../../../../shared/components/collapsible-record/collapsible-record';

@Component({
  selector: 'app-business-documents',
  standalone: true,

  imports: [
    CommonModule,

    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,

    CollapsibleRecord,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="space-y-4">
      <!-- ============================================================
     DOCUMENT HEADER
     ============================================================ -->

      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <!-- Business Documents -->
        <div class="shrink-0">
          <h2 class="text-lg font-semibold text-slate-900">Business Documents</h2>

          <p class="text-sm text-slate-500">Store and manage important business documents.</p>
        </div>

        <!-- Search -->
        <div class="w-full lg:max-w-md lg:flex-1 lg:px-6">
          <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
            <mat-label> Search documents </mat-label>

            <mat-icon matPrefix class="mr-2"> search </mat-icon>

            <input
              matInput
              type="search"
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              placeholder="Search documents..."
            />

            @if (search()) {
              <button
                mat-icon-button
                matSuffix
                type="button"
                aria-label="Clear search"
                matTooltip="Clear search"
                (click)="search.set('')"
              >
                <mat-icon> close </mat-icon>
              </button>
            }
          </mat-form-field>
        </div>

        <!-- Add Document -->
        <div class="shrink-0">
          <button mat-flat-button type="button" (click)="openCreateDialog()">
            <mat-icon class="mr-1.5"> upload_file </mat-icon>

            Add Document
          </button>
        </div>
      </div>

      <!-- ============================================================
           LOADING
           ============================================================ -->

      @if (store.loading()) {
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <mat-progress-bar mode="indeterminate" />

          <p class="mt-3 text-sm text-slate-500">Loading documents...</p>
        </div>
      }

      <!-- ============================================================
           ERROR
           ============================================================ -->

      @if (!store.loading() && store.error()) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <div class="flex items-start gap-3">
            <mat-icon class="text-red-600"> error_outline </mat-icon>

            <div>
              <p class="font-medium text-red-800">Unable to load documents</p>

              <p class="mt-1 text-sm text-red-700">
                {{ store.error() }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- ============================================================
           EMPTY STATE
           ============================================================ -->

      @if (!store.loading() && !store.error() && documents().length === 0) {
        <div
          class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
        >
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <mat-icon class="text-slate-500"> folder_open </mat-icon>
          </div>

          <h3 class="mt-4 text-base font-semibold text-slate-900">No documents yet</h3>

          <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Upload business registrations, licenses, contracts, financial records, and other
            important documents.
          </p>

          <button mat-flat-button type="button" class="mt-5" (click)="openCreateDialog()">
            <mat-icon class="mr-1.5"> upload_file </mat-icon>

            Add Document
          </button>
        </div>
      }

      <!-- ============================================================
           NO SEARCH RESULTS
           ============================================================ -->

      @if (
        !store.loading() &&
        !store.error() &&
        documents().length > 0 &&
        filteredDocuments().length === 0
      ) {
        <div class="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
          <mat-icon class="text-4xl text-slate-400"> search_off </mat-icon>

          <h3 class="mt-3 font-semibold text-slate-900">No matching documents</h3>

          <p class="mt-1 text-sm text-slate-500">Try a different search term.</p>
        </div>
      }

      <!-- ============================================================
           DOCUMENT LIST
           ============================================================ -->

      @if (!store.loading() && filteredDocuments().length > 0) {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (document of filteredDocuments(); track document.id) {
            <app-collapsible-record
              [title]="document.name"
              [subtitle]="getCategoryLabel(document.category)"
              [expanded]="false"
              [editTooltip]="'Edit document'"
              [deleteTooltip]="'Delete document'"
              (edit)="editDocument(document)"
              (remove)="deleteDocument(document)"
            >
              <!-- ======================================================
                   HEADER META
                   ====================================================== -->

              <!-- ========================================================
       FILE NAME + VERIFIED
       ======================================================== -->

              <div class="rounded-lg bg-slate-50 px-3 py-2.5">
                <!-- Label + verified badge -->
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">File</p>

                  @if (document.verified) {
                    <span
                      class="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    >
                      <mat-icon class="mr-0.5 !h-3.5 !w-3.5 !text-[14px]"> verified </mat-icon>

                      Verified
                    </span>
                    <!-- Archived -->
                    @if (document.status === 'archived') {
                      <span
                        class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      >
                        Archived
                      </span>
                    }
                  }
                </div>

                <!-- File name -->
                <p
                  class="mt-0.5 truncate text-sm font-medium text-slate-800"
                  [matTooltip]="document.fileName"
                >
                  {{ document.fileName }}
                </p>
              </div>

              <!-- ======================================================
                   DOCUMENT BODY
                   ====================================================== -->

              <div class="space-y-4">
                <!-- Description -->
                @if (document.description) {
                  <div>
                    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Description
                    </p>

                    <p class="mt-1 text-sm text-slate-700">
                      {{ document.description }}
                    </p>
                  </div>
                }

                <!-- ==========================================================
     FILE DETAILS
     ========================================================== -->

                <div class="grid grid-cols-2 gap-2">
                  <!-- Size -->
                  <div class="rounded-lg bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Size</p>

                    <p class="mt-1 text-sm font-medium text-slate-800">
                      {{ formatFileSize(document.sizeBytes) }}
                    </p>
                  </div>

                  <!-- Uploaded -->
                  <div class="rounded-lg bg-slate-50 p-3">
                    <p class="text-xs text-slate-500">Uploaded</p>

                    <p class="mt-1 text-sm font-medium text-slate-800">
                      {{ formatDate(document.uploadedAt) }}
                    </p>
                  </div>
                </div>
                <!-- Notes -->
                @if (document.notes) {
                  <div class="rounded-lg border border-slate-200 bg-white p-3">
                    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>

                    <p class="mt-1 whitespace-pre-line text-sm text-slate-700">
                      {{ document.notes }}
                    </p>
                  </div>
                }

                <!-- ====================================================
                     BOTTOM ACTIONS
                     ==================================================== -->

                <div class="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                  <!-- Open -->
                  <button
                    mat-stroked-button
                    type="button"
                    [disabled]="!document.downloadUrl"
                    matTooltip="Open document"
                    (click)="viewDocument(document)"
                  >
                    <mat-icon class="mr-1.5"> open_in_new </mat-icon>

                    Open
                  </button>

                  <!-- Download -->
                  <button
                    mat-flat-button
                    type="button"
                    [disabled]="!document.downloadUrl"
                    matTooltip="Download document"
                    (click)="downloadDocument(document)"
                  >
                    <mat-icon class="mr-1.5"> download </mat-icon>

                    Download
                  </button>
                </div>
              </div>
            </app-collapsible-record>
          }
        </div>
      }
    </div>
  `,

  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BusinessDocumentsComponent {
  // ============================================================
  // DEPENDENCIES
  // ============================================================

  readonly store = inject(BusinessStore);

  private readonly dialog = inject(MatDialog);

  readonly toast = inject(HotToastService);

  // ============================================================
  // STATE
  // ============================================================

  readonly search = signal('');

  // ============================================================
  // DOCUMENTS
  // ============================================================

  readonly documents = computed(() => {
    return this.store.documents();
  });

  /**
   * Documents filtered by the current search text.
   */
  readonly filteredDocuments = computed(() => {
    const term = this.search().trim().toLowerCase();

    const documents = this.documents();

    if (!term) {
      return documents;
    }

    return documents.filter((document) => {
      return [
        document.name,
        document.fileName,
        document.category,
        document.description,
        document.notes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  });

  // ============================================================
  // CREATE
  // ============================================================

  async openCreateDialog(): Promise<void> {
    const business = this.store.selectedBusiness();

    if (!business) {
      this.toast.error('No business is currently selected.');

      return;
    }

    const businessId = business.id;

    const dialogRef = this.dialog.open<
      BusinessDocumentDialogComponent,
      BusinessDocumentDialogData,
      BusinessDocumentDialogResult
    >(BusinessDocumentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',

      data: {
        businessId,
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    if (!result.file) {
      this.toast.error('Please select a file.');

      return;
    }

    try {
      await this.store.createDocument(
        {
          businessId,

          name: result.name,

          category: result.category,

          description: result.description,

          expiresAt: result.expiresAt ? Timestamp.fromDate(result.expiresAt) : undefined,

          verified: result.verified,

          notes: result.notes,
        },

        result.file,
      );

      this.toast.success('Document uploaded successfully.');
    } catch (error) {
      console.error('Error creating business document:', error);

      this.toast.error('Failed to upload document.');
    }
  }

  // ============================================================
  // EDIT
  // ============================================================

  async editDocument(document: BusinessDocument): Promise<void> {
    const dialogRef = this.dialog.open<
      BusinessDocumentDialogComponent,
      BusinessDocumentDialogData,
      BusinessDocumentDialogResult
    >(BusinessDocumentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',

      data: {
        businessId: document.businessId,
        document,
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    if (!result) {
      return;
    }

    try {
      await this.store.updateDocument(
        document.id,
        {
          name: result.name,

          category: result.category,

          description: result.description,

          expiresAt: result.expiresAt ? Timestamp.fromDate(result.expiresAt) : undefined,

          verified: result.verified,

          notes: result.notes,
        },

        result.file,
      );

      this.toast.success('Document updated successfully.');
    } catch (error) {
      console.error('Error updating business document:', error);

      this.toast.error('Failed to update document.');
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteDocument(document: BusinessDocument): Promise<void> {
    const confirmed = window.confirm(`Delete "${document.name}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      await this.store.deleteDocument(document.id);

      this.toast.success('Document deleted successfully.');
    } catch (error) {
      console.error('Error deleting business document:', error);

      this.toast.error('Failed to delete document.');
    }
  }

  // ============================================================
  // OPEN
  // ============================================================

  /**
   * Opens the Firebase Storage file in a new browser tab.
   */
  viewDocument(document: BusinessDocument): void {
    if (!document.downloadUrl) {
      this.toast.error('Document URL is not available.');

      return;
    }

    window.open(document.downloadUrl, '_blank', 'noopener,noreferrer');
  }

  // ============================================================
  // DOWNLOAD
  // ============================================================

  /**
   * Starts a browser download for the document.
   */
  downloadDocument(document: BusinessDocument): void {
    if (!document.downloadUrl) {
      this.toast.error('Document URL is not available.');

      return;
    }

    const link = window.document.createElement('a');

    link.href = document.downloadUrl;

    link.download = document.fileName || document.name;

    link.target = '_blank';

    link.rel = 'noopener noreferrer';

    window.document.body.appendChild(link);

    link.click();

    link.remove();
  }

  // ============================================================
  // CATEGORY
  // ============================================================

  getCategoryLabel(category: BusinessDocumentCategory): string {
    const labels: Record<BusinessDocumentCategory, string> = {
      'business-registration': 'Business Registration',

      'operating-agreement': 'Operating Agreement',

      ein: 'EIN',

      'annual-report': 'Annual Report',

      'bank-statement': 'Bank Statement',

      invoice: 'Invoice',

      receipt: 'Receipt',

      tax: 'Tax',

      'license-permit': 'License / Permit',

      contract: 'Contract',

      'government-correspondence': 'Government Correspondence',

      insurance: 'Insurance',

      financial: 'Financial',

      compliance: 'Compliance',

      other: 'Other',
    };

    return labels[category] ?? category;
  }

  // ============================================================
  // FILE SIZE
  // ============================================================

  formatFileSize(bytes: number): string {
    if (!bytes || bytes <= 0) {
      return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    const value = bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  // ============================================================
  // DATE
  // ============================================================

  formatDate(value: Timestamp | Date | undefined): string {
    if (!value) {
      return '—';
    }

    const date = value instanceof Timestamp ? value.toDate() : value;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  // ============================================================
  // EXPIRATION
  // ============================================================

  isExpired(document: BusinessDocument): boolean {
    if (!document.expiresAt) {
      return false;
    }

    return document.expiresAt.toDate().getTime() < Date.now();
  }

  isExpiringSoon(document: BusinessDocument): boolean {
    if (!document.expiresAt) {
      return false;
    }

    const expiration = document.expiresAt.toDate().getTime();

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return expiration >= Date.now() && expiration <= Date.now() + thirtyDays;
  }

  getExpirationLabel(document: BusinessDocument): string {
    if (!document.expiresAt) {
      return 'No expiration';
    }

    if (this.isExpired(document)) {
      return `Expired ${this.formatDate(document.expiresAt)}`;
    }

    if (this.isExpiringSoon(document)) {
      return `Expires ${this.formatDate(document.expiresAt)}`;
    }

    return this.formatDate(document.expiresAt);
  }
}

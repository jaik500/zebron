import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { Timestamp } from 'firebase/firestore';

import {
  BusinessDocument,
  BusinessDocumentCategory,
  BusinessDocumentInput,
} from '../../models/business-document.model';

import { BusinessStore } from '../../store/business.store';

import {
  BusinessDocumentDialogComponent,
  BusinessDocumentDialogData,
  BusinessDocumentDialogResult,
} from '../../components/document-dialog/business-document-dialog.component';


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
    MatTooltipModule,
    MatMenuModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <section class="business-documents">

      <!-- ============================================================
           HEADER
           ============================================================ -->

      <div class="documents-header">

        <div>
          <div class="documents-title-row">

            <mat-icon class="documents-title-icon">
              folder_copy
            </mat-icon>

            <div>
              <h2>Business Documents</h2>

              <p>
                Manage important documents and files associated with
                this business.
              </p>
            </div>

          </div>
        </div>


        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="openAddDocument()"
          [disabled]="!businessId() || store.saving()"
        >
          <mat-icon>upload_file</mat-icon>
          Upload Document
        </button>

      </div>


      <!-- ============================================================
           SEARCH
           ============================================================ -->

      <div class="documents-toolbar">

        <mat-form-field
          appearance="outline"
          class="document-search"
        >

          <mat-label>Search documents</mat-label>

          <mat-icon matPrefix>
            search
          </mat-icon>

          <input
            matInput
            type="search"
            [value]="documentSearch()"
            (input)="setDocumentSearch($any($event.target).value)"
            placeholder="Search by name, category, or file name"
          />

          @if (documentSearch()) {
            <button
              mat-icon-button
              matSuffix
              type="button"
              aria-label="Clear document search"
              matTooltip="Clear search"
              (click)="clearDocumentSearch()"
            >
              <mat-icon>close</mat-icon>
            </button>
          }

        </mat-form-field>


        <div class="document-count">
          {{ filteredDocuments().length }}
          {{ filteredDocuments().length === 1 ? 'document' : 'documents' }}
        </div>

      </div>


      <!-- ============================================================
           LOADING
           ============================================================ -->

      @if (store.loading()) {

        <div class="documents-loading">

          <mat-icon>hourglass_top</mat-icon>

          <span>
            Loading business documents...
          </span>

        </div>
      }


      <!-- ============================================================
           ERROR
           ============================================================ -->

      @if (store.error()) {

        <div class="documents-error">

          <mat-icon>error_outline</mat-icon>

          <div>
            <strong>Unable to load documents</strong>

            <p>
              {{ store.error() }}
            </p>
          </div>

        </div>
      }


      <!-- ============================================================
           EMPTY STATE
           ============================================================ -->

      @if (
        !store.loading() &&
        !store.error() &&
        store.documents().length === 0
      ) {

        <mat-card class="documents-empty">

          <div class="empty-icon">
            <mat-icon>folder_open</mat-icon>
          </div>

          <h3>No business documents yet</h3>

          <p>
            Upload important business records such as registration
            documents, operating agreements, EIN documentation,
            licenses, contracts, tax documents, and financial records.
          </p>

          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="openAddDocument()"
          >
            <mat-icon>upload_file</mat-icon>
            Upload First Document
          </button>

        </mat-card>
      }


      <!-- ============================================================
           SEARCH EMPTY STATE
           ============================================================ -->

      @if (
        !store.loading() &&
        store.documents().length > 0 &&
        filteredDocuments().length === 0
      ) {

        <mat-card class="documents-empty">

          <div class="empty-icon">
            <mat-icon>search_off</mat-icon>
          </div>

          <h3>No documents found</h3>

          <p>
            No documents match
            <strong>{{ documentSearch() }}</strong>.
          </p>

          <button
            mat-stroked-button
            type="button"
            (click)="clearDocumentSearch()"
          >
            Clear Search
          </button>

        </mat-card>
      }


      <!-- ============================================================
           DOCUMENT GRID
           ============================================================ -->

      @if (
        !store.loading() &&
        filteredDocuments().length > 0
      ) {

        <div class="documents-grid">

          @for (
            document of filteredDocuments();
            track document.id
          ) {

            <mat-card class="document-card">

              <!-- ----------------------------------------------------
                   DOCUMENT HEADER
                   ---------------------------------------------------- -->

              <div class="document-card-header">

                <div class="document-file-icon">
                  <mat-icon>
                    {{ getDocumentIcon(document) }}
                  </mat-icon>
                </div>

                <div class="document-heading">

                  <h3
                    [matTooltip]="document.name"
                  >
                    {{ document.name }}
                  </h3>

                  <span class="document-file-name">
                    {{ document.fileName }}
                  </span>

                </div>

                <button
                  mat-icon-button
                  type="button"
                  [matMenuTriggerFor]="documentMenu"
                  aria-label="Document actions"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>

                <mat-menu #documentMenu="matMenu">

                  <a
                    mat-menu-item
                    [href]="document.downloadUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <mat-icon>open_in_new</mat-icon>
                    <span>Open Document</span>
                  </a>

                  <button
                    mat-menu-item
                    type="button"
                    (click)="openEditDocument(document)"
                  >
                    <mat-icon>edit</mat-icon>
                    <span>Edit Details</span>
                  </button>

                  <button
                    mat-menu-item
                    type="button"
                    (click)="deleteDocument(document)"
                  >
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>

                </mat-menu>

              </div>


              <!-- ----------------------------------------------------
                   CATEGORY / STATUS
                   ---------------------------------------------------- -->

              <div class="document-chips">

                <mat-chip>
                  {{ formatDocumentCategory(document.category) }}
                </mat-chip>

                @if (document.verified) {

                  <mat-chip class="verified-chip">
                    <mat-icon>verified</mat-icon>
                    Verified
                  </mat-chip>

                }

                @if (document.status === 'archived') {

                  <mat-chip>
                    Archived
                  </mat-chip>

                }

              </div>


              <!-- ----------------------------------------------------
                   DESCRIPTION
                   ---------------------------------------------------- -->

              @if (document.description) {

                <p class="document-description">
                  {{ document.description }}
                </p>

              }


              <!-- ----------------------------------------------------
                   METADATA
                   ---------------------------------------------------- -->

              <div class="document-metadata">

                <div class="metadata-row">

                  <mat-icon>insert_drive_file</mat-icon>

                  <span>
                    {{ formatDocumentFileSize(document.sizeBytes) }}
                  </span>

                </div>


                <div class="metadata-row">

                  <mat-icon>calendar_today</mat-icon>

                  <span>
                    Uploaded
                    {{ formatDate(document.uploadedAt) }}
                  </span>

                </div>


                @if (document.expiresAt) {

                  <div
                    class="metadata-row"
                    [class.document-expired]="
                      isDocumentExpired(document)
                    "
                    [class.document-expiring]="
                      isDocumentExpiringSoon(document)
                    "
                  >

                    <mat-icon>
                      event
                    </mat-icon>

                    <span>

                      @if (isDocumentExpired(document)) {
                        Expired
                      } @else {
                        Expires
                      }

                      {{ formatDate(document.expiresAt) }}

                    </span>

                  </div>

                }

              </div>


              <!-- ----------------------------------------------------
                   NOTES
                   ---------------------------------------------------- -->

              @if (document.notes) {

                <div class="document-notes">

                  <mat-icon>notes</mat-icon>

                  <span>
                    {{ document.notes }}
                  </span>

                </div>

              }


              <!-- ----------------------------------------------------
                   ACTIONS
                   ---------------------------------------------------- -->

              <div class="document-actions">

                <a
                  mat-stroked-button
                  [href]="document.downloadUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <mat-icon>open_in_new</mat-icon>
                  Open
                </a>

                <button
                  mat-button
                  type="button"
                  (click)="openEditDocument(document)"
                >
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>

              </div>

            </mat-card>

          }

        </div>

      }

    </section>
  `,

  styles: [`

    :host {
      display: block;
    }

    .business-documents {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }


    /* ================================================================
       HEADER
       ================================================================ */

    .documents-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .documents-title-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .documents-title-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      line-height: 40px;
    }

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }

    .documents-header p {
      margin: 5px 0 0;
      color: #6b7280;
      font-size: 14px;
    }


    /* ================================================================
       TOOLBAR
       ================================================================ */

    .documents-toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .document-search {
      width: min(100%, 600px);
    }

    .document-count {
      margin-left: auto;
      white-space: nowrap;
      color: #6b7280;
      font-size: 14px;
    }


    /* ================================================================
       LOADING / ERROR
       ================================================================ */

    .documents-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      min-height: 160px;
      color: #6b7280;
    }

    .documents-error {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border: 1px solid #fecaca;
      border-radius: 12px;
      background: #fef2f2;
      color: #991b1b;
    }

    .documents-error p {
      margin: 4px 0 0;
    }


    /* ================================================================
       EMPTY STATE
       ================================================================ */

    .documents-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 50px 24px;
    }

    .empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      margin-bottom: 18px;
      border-radius: 50%;
      background: #f3f4f6;
    }

    .empty-icon mat-icon {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }

    .documents-empty h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }

    .documents-empty p {
      max-width: 650px;
      margin: 0 0 22px;
      color: #6b7280;
      line-height: 1.6;
    }


    /* ================================================================
       DOCUMENT GRID
       ================================================================ */

    .documents-grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fill, minmax(320px, 1fr));
      gap: 18px;
    }

    .document-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      min-width: 0;
    }


    /* ================================================================
       DOCUMENT HEADER
       ================================================================ */

    .document-card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .document-file-icon {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 10px;
      background: #f3f4f6;
    }

    .document-file-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .document-heading {
      flex: 1;
      min-width: 0;
    }

    .document-heading h3 {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 16px;
      font-weight: 600;
    }

    .document-file-name {
      display: block;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #6b7280;
      font-size: 12px;
    }


    /* ================================================================
       CHIPS
       ================================================================ */

    .document-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .verified-chip {
      display: inline-flex;
      align-items: center;
    }

    .verified-chip mat-icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      font-size: 16px;
    }


    /* ================================================================
       DESCRIPTION
       ================================================================ */

    .document-description {
      margin: 0;
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
    }


    /* ================================================================
       METADATA
       ================================================================ */

    .document-metadata {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .metadata-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 13px;
    }

    .metadata-row mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .document-expired {
      color: #b91c1c;
      font-weight: 600;
    }

    .document-expiring {
      color: #b45309;
      font-weight: 600;
    }


    /* ================================================================
       NOTES
       ================================================================ */

    .document-notes {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #f9fafb;
      color: #4b5563;
      font-size: 13px;
      line-height: 1.45;
    }

    .document-notes mat-icon {
      flex: 0 0 auto;
      width: 18px;
      height: 18px;
      font-size: 18px;
    }


    /* ================================================================
       ACTIONS
       ================================================================ */

    .document-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: auto;
      padding-top: 4px;
    }


    /* ================================================================
       RESPONSIVE
       ================================================================ */

    @media (max-width: 700px) {

      .documents-header {
        flex-direction: column;
        align-items: stretch;
      }

      .documents-header button {
        width: 100%;
      }

      .documents-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .document-search {
        width: 100%;
      }

      .document-count {
        margin-left: 0;
      }

      .documents-grid {
        grid-template-columns: 1fr;
      }

    }

  `],
})
export class BusinessDocumentsComponent {

  // ================================================================
  // DEPENDENCIES
  // ================================================================

  readonly store = inject(BusinessStore);

  private readonly dialog = inject(MatDialog);


  // ================================================================
  // LOCAL STATE
  // ================================================================

  readonly documentSearch = signal('');


  // ================================================================
  // SELECTED BUSINESS
  // ================================================================

  readonly businessId = computed(
    () => this.store.selectedBusiness()?.id ?? ''
  );


  // ================================================================
  // FILTERED DOCUMENTS
  // ================================================================

  readonly filteredDocuments = computed(() => {

    const documents = this.store.documents();

    const search = this.documentSearch()
      .trim()
      .toLowerCase();

    if (!search) {
      return documents;
    }

    return documents.filter(document => {

      const searchableText = [
        document.name,
        document.fileName,
        document.category,
        document.description ?? '',
        document.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);

    });

  });


  // ================================================================
  // SEARCH
  // ================================================================

  setDocumentSearch(value: string): void {
    this.documentSearch.set(value);
  }


  clearDocumentSearch(): void {
    this.documentSearch.set('');
  }


  // ================================================================
  // ADD DOCUMENT
  // ================================================================

  async openAddDocument(): Promise<void> {

    const businessId = this.businessId();

    if (!businessId) {
      return;
    }

    const dialogRef = this.dialog.open<
      BusinessDocumentDialogComponent,
      BusinessDocumentDialogData,
      BusinessDocumentDialogResult
    >(
      BusinessDocumentDialogComponent,
      {
        width: '680px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,

        data: {
          businessId,
        },
      },
    );

    const result = await dialogRef
      .afterClosed()
      .toPromise();

    if (!result?.file) {
      return;
    }

    const input: BusinessDocumentInput = {
      businessId,
      name: result.name,
      category: result.category,
      description: result.description,
      expiresAt: result.expiresAt
        ? Timestamp.fromDate(result.expiresAt)
        : undefined,
      verified: result.verified,
      notes: result.notes,
    };

    await this.store.createDocument(
      input,
      result.file,
    );
  }


  // ================================================================
  // EDIT DOCUMENT
  // ================================================================

  async openEditDocument(
    document: BusinessDocument,
  ): Promise<void> {

    const dialogRef = this.dialog.open<
      BusinessDocumentDialogComponent,
      BusinessDocumentDialogData,
      BusinessDocumentDialogResult
    >(
      BusinessDocumentDialogComponent,
      {
        width: '680px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,

        data: {
          businessId: document.businessId,
          document,
        },
      },
    );

    const result = await dialogRef
      .afterClosed()
      .toPromise();

    if (!result) {
      return;
    }

    const changes: Partial<BusinessDocumentInput> = {
      businessId: document.businessId,
      name: result.name,
      category: result.category,
      description: result.description,
      expiresAt: result.expiresAt
        ? Timestamp.fromDate(result.expiresAt)
        : undefined,
      verified: result.verified,
      notes: result.notes,
    };

    await this.store.updateDocument(
      document.id,
      changes,
      result.file,
    );
  }


  // ================================================================
  // DELETE DOCUMENT
  // ================================================================

  async deleteDocument(
    document: BusinessDocument,
  ): Promise<void> {

    const confirmed = window.confirm(
      `Delete "${document.name}"?\n\n` +
      `This will permanently remove the document and its file.`
    );

    if (!confirmed) {
      return;
    }

    await this.store.deleteDocument(document.id);
  }


  // ================================================================
  // DOCUMENT CATEGORY
  // ================================================================

  formatDocumentCategory(
    category: BusinessDocumentCategory,
  ): string {

    const labels: Record<
      BusinessDocumentCategory,
      string
    > = {

      'business-registration':
        'Business Registration',

      'operating-agreement':
        'Operating Agreement',

      ein:
        'EIN',

      'annual-report':
        'Annual Report',

      'bank-statement':
        'Bank Statement',

      invoice:
        'Invoice',

      receipt:
        'Receipt',

      tax:
        'Tax Document',

      'license-permit':
        'License / Permit',

      contract:
        'Contract',

      'government-correspondence':
        'Government Correspondence',

      insurance:
        'Insurance',

      financial:
        'Financial',

      compliance:
        'Compliance',

      other:
        'Other',
    };

    return labels[category] ?? category;
  }


  // ================================================================
  // FILE ICON
  // ================================================================

  getDocumentIcon(
    document: BusinessDocument,
  ): string {

    const mimeType =
      document.mimeType.toLowerCase();

    if (mimeType.includes('pdf')) {
      return 'picture_as_pdf';
    }

    if (mimeType.includes('word') ||
        mimeType.includes('document')) {
      return 'description';
    }

    if (mimeType.includes('excel') ||
        mimeType.includes('spreadsheet')) {
      return 'table_chart';
    }

    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    if (mimeType.includes('zip') ||
        mimeType.includes('compressed')) {
      return 'folder_zip';
    }

    return 'insert_drive_file';
  }


  // ================================================================
  // FILE SIZE
  // ================================================================

  formatDocumentFileSize(
    bytes: number,
  ): string {

    if (!bytes || bytes <= 0) {
      return '0 Bytes';
    }

    const units = [
      'Bytes',
      'KB',
      'MB',
      'GB',
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    const unitIndex = Math.min(
      index,
      units.length - 1,
    );

    const value =
      bytes / Math.pow(1024, unitIndex);

    return `${value.toFixed(
      unitIndex === 0 ? 0 : 1
    )} ${units[unitIndex]}`;
  }


  // ================================================================
  // DATE FORMATTING
  // ================================================================

  formatDate(
    timestamp: Timestamp,
  ): string {

    return timestamp
      .toDate()
      .toLocaleDateString(
        undefined,
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
      );
  }


  // ================================================================
  // EXPIRATION
  // ================================================================

  isDocumentExpired(
    document: BusinessDocument,
  ): boolean {

    if (!document.expiresAt) {
      return false;
    }

    return document.expiresAt
      .toDate()
      .getTime() < Date.now();
  }


  isDocumentExpiringSoon(
    document: BusinessDocument,
  ): boolean {

    if (!document.expiresAt) {
      return false;
    }

    const expiration =
      document.expiresAt.toDate().getTime();

    const thirtyDays =
      Date.now() +
      30 * 24 * 60 * 60 * 1000;

    return (
      expiration >= Date.now() &&
      expiration <= thirtyDays
    );
  }

}
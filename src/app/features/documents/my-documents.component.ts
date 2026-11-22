import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { LoggerService } from '../../core/services/logger.service';
import { CourseHeaderComponent } from '../courses/components/course-header.component';
import { CourseAccessService } from '../courses/course-access.service';
import { courseContextFromRoute } from '../courses/course.model';
import { useLearningHeaderTitle } from '../test-center/learner-route';
import {
  ACCEPTED_EXTENSIONS,
  MAX_DOCUMENTS,
  MAX_FILE_BYTES,
  MAX_TOTAL_BYTES,
  formatBytes,
  formatInfo,
} from './document-formats';
import { listDocumentAnnotations } from './document-annotation.store';
import { DocumentService, UserDocument } from './document.service';
import { OfflineDocumentsService } from './offline-documents.service';

interface UploadRow {
  key: number;
  name: string;
  percent: number;
  status: 'uploading' | 'done' | 'error';
  message: string;
}

const FORMAT_COLORS: Record<string, { background: string; color: string }> = {
  pdf: { background: '#fee2e2', color: '#b91c1c' },
  epub: { background: '#e0f2f1', color: '#00605f' },
  docx: { background: '#dbeafe', color: '#1d4ed8' },
  txt: { background: '#f1f5f9', color: '#334155' },
  md: { background: '#ede9fe', color: '#6d28d9' },
};

/**
 * My documents (/courses/documents): upload your own PDF, EPUB, Word, text
 * or markdown files and read them in Zebron on any device. Private to the
 * person. See document.service.ts.
 */
@Component({
  selector: 'app-my-documents',
  imports: [RouterLink, MatIconModule, MatMenuModule, TranslatePipe, CourseHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mt-16 min-h-screen bg-slate-50 pb-12">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'My documents' }]"
        [activeTab]="'documents'"
        [canManage]="canManage()"
      />

      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="text-xl font-bold text-slate-900">{{ 'My documents' | t }}</h1>
            <p class="mt-1 text-sm text-slate-600">
              {{ 'Read your PDF, EPUB, Word, text and markdown files here, on any device, without other apps. Only you can see them.' | t }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
            [disabled]="!service.loaded() || !offline.online()"
            (click)="fileInput.click()"
          >
            <mat-icon aria-hidden="true">upload_file</mat-icon>{{ 'Add documents' | t }}
          </button>
          <input #fileInput type="file" class="hidden" multiple [accept]="accepted" (change)="onPicked($event)" />
        </div>

        @if (!offline.online() && !offlineNoticeClosed()) {
          <div class="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
            <mat-icon class="shrink-0 text-amber-700" aria-hidden="true">cloud_off</mat-icon>
            <span>{{ 'You are offline. Documents kept on this device can still be read; adding, renaming and deleting need a connection.' | t }}</span>
            <button type="button" class="-my-1 -mr-1 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]" [attr.aria-label]="'Close' | t" [title]="'Close' | t" (click)="offlineNoticeClosed.set(true)">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
            </button>
          </div>
        }

        <!-- Drop zone -->
        <div
          class="mt-4 rounded-2xl border-2 border-dashed px-4 py-5 text-center text-sm transition"
          [class.border-slate-300]="!dragging()"
          [class.bg-white]="!dragging()"
          [class.border-teal-600]="dragging()"
          [class.bg-teal-50]="dragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="dragging.set(false)"
          (drop)="onDrop($event)"
        >
          <p class="text-slate-700">{{ 'Drag files here, or press Add documents.' | t }}</p>
          <p class="mt-1 text-xs text-slate-500">
            {{ 'PDF, EPUB, Word (.docx), text and markdown, up to {0} each.' | t: [maxFile] }}
          </p>
        </div>

        @if (service.loaded()) {
          <p class="mt-3 text-xs text-slate-500" aria-live="polite">
            {{ '{0} of {1} used · {2} of {3} documents' | t: [usedLabel(), maxTotal, service.documents().length, maxDocuments] }}
          </p>
        }

        <!-- Uploads in progress -->
        @if (uploads().length) {
          <ul class="mt-4 flex flex-col gap-2" [attr.aria-label]="'Uploads' | t">
            @for (row of uploads(); track row.key) {
              <li class="rounded-xl border border-slate-200 bg-white p-3">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="min-w-0 truncate font-medium text-slate-800">{{ row.name }}</span>
                  <span class="flex shrink-0 items-center gap-1 text-xs" [style.color]="row.status === 'error' ? '#be123c' : '#475569'">
                    @if (row.status === 'uploading') {
                      {{ row.percent }}%
                    } @else if (row.status === 'done') {
                      {{ 'Added' | t }}
                    } @else {
                      {{ row.message | t }}
                    }
                    @if (row.status !== 'uploading') {
                      <button type="button" class="-my-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]" [attr.aria-label]="'Close' | t" [title]="'Close' | t" (click)="dismissUpload(row.key)">
                        <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
                      </button>
                    }
                  </span>
                </div>
                @if (row.status === 'uploading') {
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" [attr.aria-valuenow]="row.percent" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Uploading {0}' | t: [row.name]">
                    <div class="h-full bg-[#007979] transition-[width]" [style.width.%]="row.percent"></div>
                  </div>
                }
              </li>
            }
          </ul>
        }

        @if (loadError()) {
          <div class="mt-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            <span>{{ loadError() | t }}</span>
            <button type="button" class="-my-1 -mr-1 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]" [attr.aria-label]="'Close' | t" [title]="'Close' | t" (click)="loadError.set('')">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">close</mat-icon>
            </button>
          </div>
        } @else if (!service.loaded()) {
          <p class="mt-8 text-center text-sm text-slate-500" role="status">{{ 'Loading your documents...' | t }}</p>
        } @else if (!service.documents().length) {
          <div class="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">library_books</mat-icon>
            <p class="mt-2 font-semibold text-slate-800">{{ 'No documents yet' | t }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ 'Add a file to start reading it here.' | t }}</p>
          </div>
        } @else {
          <ul class="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            @for (item of service.documents(); track item.id) {
              <li class="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  [style.background]="colors(item).background"
                  [style.color]="colors(item).color"
                  aria-hidden="true"
                >
                  <mat-icon>{{ info(item).icon }}</mat-icon>
                </span>

                <div class="min-w-0 flex-1">
                  @if (renaming() === item.id) {
                    <form class="flex items-center gap-2" (submit)="saveRename($event, item)">
                      <input
                        #renameInput
                        class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm focus:border-[#007979] focus:outline-none"
                        maxlength="200"
                        [value]="item.title"
                        [attr.aria-label]="'Document name' | t"
                        (keydown.escape)="renaming.set(null)"
                      />
                      <button type="submit" class="h-9 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white">{{ 'Save' | t }}</button>
                    </form>
                  } @else {
                    <a
                      [routerLink]="['/courses/documents', item.id]"
                      class="block break-words font-semibold leading-snug text-slate-900 hover:text-[#007979] [overflow-wrap:anywhere]"
                    >
                      {{ item.title }}
                    </a>
                  }
                  <p class="mt-0.5 text-xs text-slate-500">
                    @if (offline.isKept(item.id)) {
                      <span class="mr-1 inline-flex items-center gap-0.5 font-semibold text-[#007979]">
                        <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">offline_pin</mat-icon>{{ 'On this device' | t }}
                      </span>
                      ·
                    }
                    {{ info(item).label | t }} · {{ size(item) }}
                    @if (item.openedAt) {
                      · {{ 'Opened {0}' | t: [dateLabel(item.openedAt)] }}
                    } @else {
                      · {{ 'Not opened yet' | t }}
                    }
                  </p>
                  @if (item.progress > 0) {
                    <div class="mt-2 flex items-center gap-2">
                      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div class="h-full bg-[#007979]" [style.width.%]="item.progress"></div>
                      </div>
                      <span class="text-xs tabular-nums text-slate-500">{{ '{0}% read' | t: [item.progress] }}</span>
                    </div>
                  }
                </div>

                <button
                  type="button"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]"
                  [matMenuTriggerFor]="actions"
                  [attr.aria-label]="'Actions for {0}' | t: [item.title]"
                >
                  <mat-icon aria-hidden="true">more_vert</mat-icon>
                </button>
                <mat-menu #actions="matMenu" xPosition="before">
                  <a mat-menu-item [routerLink]="['/courses/documents', item.id]">
                    <mat-icon aria-hidden="true">chrome_reader_mode</mat-icon>{{ 'Read' | t }}
                  </a>
                  @if (offline.supported()) {
                    @if (offline.isKept(item.id)) {
                      <button mat-menu-item type="button" (click)="forget(item)">
                        <mat-icon aria-hidden="true">mobiledata_off</mat-icon>{{ 'Remove from this device' | t }}
                      </button>
                    } @else {
                      <button mat-menu-item type="button" [disabled]="!offline.online() || keeping().has(item.id)" (click)="keep(item)">
                        <mat-icon aria-hidden="true">download_for_offline</mat-icon>
                        {{ (keeping().has(item.id) ? 'Saving to this device...' : 'Keep on this device') | t }}
                      </button>
                    }
                  }
                  <button mat-menu-item type="button" [disabled]="!offline.online()" (click)="startRename(item)">
                    <mat-icon aria-hidden="true">edit</mat-icon>{{ 'Rename' | t }}
                  </button>
                  <button mat-menu-item type="button" [disabled]="!offline.online()" (click)="download(item)">
                    <mat-icon aria-hidden="true">download</mat-icon>{{ 'Download' | t }}
                  </button>
                  <button mat-menu-item type="button" [disabled]="!offline.online()" (click)="remove(item)">
                    <mat-icon aria-hidden="true">delete</mat-icon>{{ 'Delete' | t }}
                  </button>
                </mat-menu>
              </li>
            }
          </ul>
        }
      </div>
    </main>
  `,
})
export class MyDocumentsComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly service = inject(DocumentService);
  private readonly auth = inject(AuthService);
  private readonly access = inject(CourseAccessService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(HotToastService);
  protected readonly offline = inject(OfflineDocumentsService);
  private readonly headerTitle = useLearningHeaderTitle(this.route);

  /** Documents being saved to this device. */
  protected readonly keeping = signal<ReadonlySet<string>>(new Set());
  /** Offline: the list shows only documents kept on this device. */
  private readonly showingKept = signal(false);
  /** The offline notice was closed; it shows again the next time the connection drops. */
  protected readonly offlineNoticeClosed = signal(false);
  /** Every message here has a close button. */
  private readonly toastOptions = { dismissible: true, closeLabel: this.i18n.t('Close') };

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly canManage = computed(() => this.access.canManage(this.context));

  protected readonly accepted = ACCEPTED_EXTENSIONS;
  protected readonly maxFile = formatBytes(MAX_FILE_BYTES);
  protected readonly maxTotal = formatBytes(MAX_TOTAL_BYTES);
  protected readonly maxDocuments = MAX_DOCUMENTS;

  protected readonly uploads = signal<UploadRow[]>([]);
  protected readonly dragging = signal(false);
  protected readonly renaming = signal<string | null>(null);
  protected readonly loadError = signal('');
  protected readonly usedLabel = computed(() => formatBytes(this.service.totalBytes()));

  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');
  private uploadKey = 0;

  constructor() {
    afterNextRender(() => void this.loadList());

    // Back online after showing only the kept documents: load the full list.
    effect(() => {
      if (this.offline.online() && this.showingKept()) untracked(() => void this.loadList());
    });

    effect(() => {
      if (this.offline.online()) this.offlineNoticeClosed.set(false);
    });
  }

  private async loadList(): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    this.loadError.set('');
    await this.offline.refresh(uid);
    try {
      await this.service.load();
      this.showingKept.set(false);
    } catch (error) {
      if (!this.offline.online()) {
        // Offline: list the documents kept on this device.
        this.service.showKept(await this.offline.keptDocuments(uid));
        this.showingKept.set(true);
        return;
      }
      this.logger.error('MyDocuments', 'Could not load documents.', error);
      this.loadError.set('Your documents could not be loaded. Refresh the page to try again.');
    }
  }

  // ---------- Keep on this device ----------

  protected async keep(item: UserDocument): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    this.keeping.update((ids) => new Set(ids).add(item.id));
    try {
      const [bytes, annotations] = await Promise.all([
        this.service.bytes(item),
        listDocumentAnnotations(uid, item.id).catch(() => []),
      ]);
      const kept = await this.offline.keep(uid, item, bytes, annotations);
      if (kept) this.toast.success(this.i18n.t('"{0}" is kept on this device.', [item.title]), this.toastOptions);
      else this.toast.error(this.i18n.t('This device has no room to keep "{0}".', [item.title]), this.toastOptions);
    } catch (error) {
      this.logger.error('MyDocuments', 'Could not keep the document on this device.', error);
      this.toast.error(this.i18n.t('Could not save the document to this device. Try again.'), this.toastOptions);
    } finally {
      this.keeping.update((ids) => {
        const next = new Set(ids);
        next.delete(item.id);
        return next;
      });
    }
  }

  protected async forget(item: UserDocument): Promise<void> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) return;
    await this.offline.remove(uid, item.id);
    this.toast.success(this.i18n.t('Removed from this device. It is still in your documents.'), this.toastOptions);
  }

  protected info(item: UserDocument) {
    return formatInfo(item.format);
  }

  protected colors(item: UserDocument) {
    return FORMAT_COLORS[item.format] ?? FORMAT_COLORS['txt'];
  }

  protected size(item: UserDocument): string {
    return formatBytes(item.size);
  }

  protected dateLabel(date: Date): string {
    return date.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- Upload ----------

  protected onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    void this.uploadAll(files);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    void this.uploadAll(Array.from(event.dataTransfer?.files ?? []));
  }

  private async uploadAll(files: File[]): Promise<void> {
    if (!this.service.loaded() || !this.offline.online()) return;
    for (const file of files) {
      const key = ++this.uploadKey;
      this.uploads.update((rows) => [...rows, { key, name: file.name, percent: 0, status: 'uploading', message: '' }]);
      const update = (change: Partial<UploadRow>) =>
        this.uploads.update((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
      const outcome = await this.service.upload(file, (percent) => update({ percent }));
      if (outcome.ok) {
        update({ status: 'done', percent: 100 });
        setTimeout(() => this.uploads.update((rows) => rows.filter((row) => row.key !== key)), 3000);
      } else {
        update({ status: 'error', message: this.reasonText(outcome.reason) });
      }
    }
  }

  protected dismissUpload(key: number): void {
    this.uploads.update((rows) => rows.filter((row) => row.key !== key));
  }

  private reasonText(reason: string): string {
    switch (reason) {
      case 'format':
        return 'Not a supported file (PDF, EPUB, Word .docx, text or markdown).';
      case 'empty':
        return 'This file is empty.';
      case 'too-large':
        return 'Too large: files can be up to 50 MB.';
      case 'too-many':
        return 'You have 100 documents, the most allowed. Delete one first.';
      case 'quota':
        return 'Not enough space: you can keep up to 500 MB. Delete a document first.';
      default:
        return 'Upload failed. Try again.';
    }
  }

  // ---------- Rename, download, delete ----------

  protected startRename(item: UserDocument): void {
    this.renaming.set(item.id);
    setTimeout(() => this.renameInput()?.nativeElement.select());
  }

  protected async saveRename(event: Event, item: UserDocument): Promise<void> {
    event.preventDefault();
    const title = this.renameInput()?.nativeElement.value ?? '';
    this.renaming.set(null);
    if (!title.trim() || title.trim() === item.title) return;
    try {
      await this.service.rename(item.id, title);
    } catch (error) {
      this.logger.error('MyDocuments', 'Rename failed.', error);
      this.toast.error(this.i18n.t('The document could not be renamed. Try again.'), this.toastOptions);
    }
  }

  protected async download(item: UserDocument): Promise<void> {
    try {
      window.open(await this.service.downloadUrl(item), '_blank', 'noopener');
    } catch (error) {
      this.logger.error('MyDocuments', 'Could not get the download link.', error);
      this.toast.error(this.i18n.t('The download could not start. Try again.'), this.toastOptions);
    }
  }

  protected async remove(item: UserDocument): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete this document?',
      message: this.i18n.t('"{0}", its highlights and notes, and where you stopped reading will be deleted. This can\'t be undone.', [item.title]),
      icon: 'delete',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.service.remove(item);
    } catch (error) {
      this.logger.error('MyDocuments', 'Delete failed.', error);
      this.toast.error(this.i18n.t('The document could not be deleted. Try again.'), this.toastOptions);
    }
  }
}

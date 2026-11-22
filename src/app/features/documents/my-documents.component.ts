import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

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
import { DocumentService, UserDocument } from './document.service';

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
            [disabled]="!service.loaded()"
            (click)="fileInput.click()"
          >
            <mat-icon aria-hidden="true">upload_file</mat-icon>{{ 'Add documents' | t }}
          </button>
          <input #fileInput type="file" class="hidden" multiple [accept]="accepted" (change)="onPicked($event)" />
        </div>

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
                  <span class="shrink-0 text-xs" [style.color]="row.status === 'error' ? '#be123c' : '#475569'">
                    @if (row.status === 'uploading') {
                      {{ row.percent }}%
                    } @else if (row.status === 'done') {
                      {{ 'Added' | t }}
                    } @else {
                      {{ row.message | t }}
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
          <p class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{{ loadError() | t }}</p>
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
                  <button mat-menu-item type="button" (click)="startRename(item)">
                    <mat-icon aria-hidden="true">edit</mat-icon>{{ 'Rename' | t }}
                  </button>
                  <button mat-menu-item type="button" (click)="download(item)">
                    <mat-icon aria-hidden="true">download</mat-icon>{{ 'Download' | t }}
                  </button>
                  <button mat-menu-item type="button" (click)="remove(item)">
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
  private readonly headerTitle = useLearningHeaderTitle(this.route);

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
    afterNextRender(() => {
      if (!this.auth.firebaseUser()) return;
      this.service.load().catch((error) => {
        this.logger.error('MyDocuments', 'Could not load documents.', error);
        this.loadError.set('Your documents could not be loaded. Refresh the page to try again.');
      });
    });
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
    if (!this.service.loaded()) return;
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
    }
  }

  protected async download(item: UserDocument): Promise<void> {
    try {
      window.open(await this.service.downloadUrl(item), '_blank', 'noopener');
    } catch (error) {
      this.logger.error('MyDocuments', 'Could not get the download link.', error);
    }
  }

  protected async remove(item: UserDocument): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete this document?',
      message: this.i18n.t('"{0}" and where you stopped reading will be deleted. This can\'t be undone.', [item.title]),
      icon: 'delete',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.service.remove(item);
    } catch (error) {
      this.logger.error('MyDocuments', 'Delete failed.', error);
    }
  }
}

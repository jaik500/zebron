import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getBlob, ref } from 'firebase/storage';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { firebaseApp, firebaseFunctions, firebaseStorage, firestore } from '../../../../core/services/firebase-config';
import { LoggerService } from '../../../../core/services/logger.service';
import { ExportState, PlatformBackup, isStuckBackup, toBackup } from './platform-backup.model';

interface DownloadFile {
  name: string;
  label: string;
  hint: string;
  icon: string;
}

/** The files a backup holds that can be downloaded from the page. */
const DOWNLOADS: DownloadFile[] = [
  { name: 'records.ndjson.gz', label: 'All records', hint: 'Every document, one JSON line each (gzip)', icon: 'dataset' },
  { name: 'auth-users.json', label: 'Sign-in accounts', hint: 'Emails, names and sign-in methods (no passwords)', icon: 'badge' },
  { name: 'files.csv', label: 'Uploaded files list', hint: 'Path, size and type of every uploaded file', icon: 'folder_zip' },
  { name: 'summary.json', label: 'Summary', hint: 'Counts and any problems', icon: 'summarize' },
];

/** One-time Google Cloud commands, shown in "Set up Google Cloud protection". */
const PROJECT = String(firebaseApp.options.projectId ?? 'zebron-2b49f');
const BUCKET = String(firebaseApp.options.storageBucket ?? `${PROJECT}.firebasestorage.app`);
const PROJECT_NUMBER = String(firebaseApp.options.messagingSenderId ?? 'PROJECT_NUMBER');

const SETUP_STEPS: Array<{ title: string; text: string; command: string }> = [
  {
    title: 'Daily database backups (kept 14 days)',
    text: "Google's own backups, independent of Zebron's code. Restore from the Firebase console or with gcloud.",
    command: `gcloud firestore backups schedules create --project=${PROJECT} --database="(default)" --recurrence=daily --retention=14d`,
  },
  {
    title: 'Point-in-time recovery (last 7 days, to the minute)',
    text: 'Lets you read or restore the database as it was at any minute in the past 7 days, for example just before a bad import.',
    command: `gcloud firestore databases update --project=${PROJECT} --database="(default)" --enable-pitr`,
  },
  {
    title: 'Allow the Back up now button to run full exports',
    text: 'Gives Cloud Functions permission to start a managed export, and Firestore permission to write it to the bucket.',
    command:
      `gcloud projects add-iam-policy-binding ${PROJECT} --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/datastore.importExportAdmin"\n` +
      `gcloud storage buckets add-iam-policy-binding gs://${BUCKET} --member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-firestore.iam.gserviceaccount.com" --role="roles/storage.admin"`,
  },
  {
    title: 'Keep old versions of uploaded files (30 days)',
    text: 'Uploaded files are not in database backups. With versioning, a deleted or replaced file can be recovered.',
    command:
      `gcloud storage buckets update gs://${BUCKET} --versioning\n` +
      `gcloud storage buckets update gs://${BUCKET} --lifecycle-file=storage-lifecycle.json`,
  },
  {
    title: 'Sign-in accounts with password hashes (for moving to another Firebase project)',
    text: "The backup's Sign-in accounts file has no passwords. To move accounts with their passwords, export them with the Firebase CLI and keep the file somewhere safe.",
    command: `firebase auth:export users-with-hashes.json --format=json --project=${PROJECT}`,
  },
];

/**
 * Admin → Backups (/admin/backups).
 * Platform administrators back up everything on demand (a backup also
 * runs every Monday), download the readable files, and see how to switch
 * on Google Cloud's own backups. Cloud Functions in
 * functions/src/platform-backups.ts do the work.
 */
@Component({
  selector: 'app-platform-backups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <section class="mx-auto w-full max-w-5xl min-w-0 px-4 pb-28 pt-20 sm:px-6">
      <header class="flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <nav class="flex items-center gap-1 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
            <a routerLink="/admin" class="hover:text-slate-700">Admin</a>
            <mat-icon class="!h-4 !w-4 !text-[16px] text-slate-400" aria-hidden="true">chevron_right</mat-icon>
            <span class="text-slate-700">Backups</span>
          </nav>
          <div class="mt-3 flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007979] text-white shadow-sm">
              <mat-icon aria-hidden="true">backup</mat-icon>
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Backups</h1>
              <p class="mt-0.5 text-sm text-slate-500">
                A copy of every Zebron record, sign-in account and file list. Runs every Monday at 3:15 a.m. (New York); the newest {{ keepCount }} are kept.
              </p>
            </div>
          </div>
        </div>
        <button mat-flat-button class="!bg-[#007979] !text-white" type="button" (click)="backUpNow()" [disabled]="starting() || running()">
          @if (starting()) {
            <mat-spinner diameter="18" class="mr-2 inline-block"></mat-spinner>
          } @else {
            <mat-icon>cloud_upload</mat-icon>
          }
          Back up now
        </button>
      </header>

      @if (message(); as note) {
        <div [class]="note.error
            ? 'mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
            : 'mt-4 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900'" role="status">
          <mat-icon class="!h-5 !w-5 !text-[20px] shrink-0">{{ note.error ? 'error' : 'check_circle' }}</mat-icon>
          <span class="min-w-0">{{ note.text }}</span>
        </div>
      }

      <!-- What a backup holds -->
      <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-900">What each backup holds</h2>
        <ul class="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <li class="flex gap-2"><mat-icon class="shrink-0 text-[#007979]">storage</mat-icon><span><strong class="text-slate-800">Full database export.</strong> Google's complete copy, restorable with <code class="rounded bg-slate-100 px-1 text-xs">gcloud firestore import</code>. Download it with the command on each backup.</span></li>
          <li class="flex gap-2"><mat-icon class="shrink-0 text-[#007979]">dataset</mat-icon><span><strong class="text-slate-800">All records.</strong> Every document as readable JSON, one per line, to open or load elsewhere.</span></li>
          <li class="flex gap-2"><mat-icon class="shrink-0 text-[#007979]">badge</mat-icon><span><strong class="text-slate-800">Sign-in accounts.</strong> Every account's email, name and sign-in methods. No passwords.</span></li>
          <li class="flex gap-2"><mat-icon class="shrink-0 text-[#007979]">folder_zip</mat-icon><span><strong class="text-slate-800">Uploaded files list.</strong> The files themselves stay in Storage; copy them with the command on each backup.</span></li>
        </ul>
      </section>

      <!-- Backups -->
      <section class="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-900">Backups</h2>
          <span class="text-xs text-slate-500">{{ backups().length }} shown</span>
        </div>

        @if (loading()) {
          <div class="flex justify-center p-10"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (loadError()) {
          <p class="p-5 text-sm text-red-700">{{ loadError() }}</p>
        } @else if (!backups().length) {
          <div class="p-8 text-center text-sm text-slate-500">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300">cloud_off</mat-icon>
            <p class="mt-2">No backups yet. Press <strong>Back up now</strong> to make the first one.</p>
          </div>
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (backup of backups(); track backup.id) {
              @let state = displayStatus(backup);
              <li class="min-w-0 px-5 py-4">
                <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-medium text-slate-900">
                      {{ backup.createdAt ? (backup.createdAt | date: 'EEE d MMM y, h:mm a') : 'Just now' }}
                      <span class="ml-1 text-xs font-normal text-slate-500">
                        · {{ backup.trigger === 'scheduled' ? 'Weekly' : 'Manual' }}{{ backup.requestedBy?.email ? ' by ' + backup.requestedBy?.email : '' }}
                      </span>
                    </p>
                    <p class="mt-1 text-sm text-slate-600">
                      @if (backup.records) {
                        {{ backup.records.total | number }} records ·
                      }
                      @if (backup.users !== null) {
                        {{ backup.users | number }} accounts ·
                      }
                      @if (backup.files) {
                        {{ backup.files.count | number }} files ({{ size(backup.files.bytes) }}) ·
                      }
                      @if (backup.totalBytes) {
                        backup size {{ size(backup.totalBytes) }}
                      }
                      @if (backup.durationSeconds !== null) {
                        · took {{ backup.durationSeconds }} s
                      }
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    @if (backup.keep) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"><mat-icon class="!h-4 !w-4 !text-[16px]">push_pin</mat-icon>Kept</span>
                    }
                    <span [class]="state.pill">
                      @if (state.busy) {
                        <mat-spinner diameter="12" class="!inline-block"></mat-spinner>
                      }
                      {{ state.label }}
                    </span>
                  </div>
                </div>

                <!-- Managed export -->
                <div class="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <mat-icon class="!h-5 !w-5 !text-[20px] text-slate-500">storage</mat-icon>
                  <span class="text-slate-700">Full database export:</span>
                  <span [class]="exportClass(backup.firestoreExport.state)">{{ exportLabel(backup) }}</span>
                  @if (backup.firestoreExport.state === 'PROCESSING') {
                    <button mat-button type="button" class="!min-w-0 !px-2 !text-[#007979]" (click)="refresh(backup)" [disabled]="busy() === backup.id">
                      <mat-icon>refresh</mat-icon>Check progress
                    </button>
                  }
                </div>

                @if (backup.problems.length) {
                  <ul class="mt-2 list-disc space-y-0.5 pl-6 text-xs text-amber-800">
                    @for (problem of backup.problems; track $index) {
                      <li>{{ problem }}</li>
                    }
                  </ul>
                }

                @if (backup.status !== 'queued' && backup.status !== 'running') {
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (file of downloads; track file.name) {
                      <button mat-stroked-button type="button" class="!text-slate-700" [matTooltip]="file.hint" (click)="download(backup, file)" [disabled]="busy() === backup.id + file.name">
                        @if (busy() === backup.id + file.name) {
                          <mat-spinner diameter="16" class="mr-2 !inline-block"></mat-spinner>
                        } @else {
                          <mat-icon>{{ file.icon }}</mat-icon>
                        }
                        {{ file.label }}
                      </button>
                    }
                    <button mat-button type="button" class="!text-slate-600" (click)="copy(copyCommand(backup), 'Command copied. Run it in a terminal signed in with gcloud.')"
                      matTooltip="Copies a gcloud command that downloads the whole backup folder, including the full database export">
                      <mat-icon>terminal</mat-icon>Copy download command
                    </button>
                    <button mat-button type="button" class="!text-slate-600" (click)="toggleKeep(backup)" [disabled]="busy() === backup.id"
                      [matTooltip]="backup.keep ? 'Allow this backup to be removed when it gets old' : 'Never remove this backup automatically'">
                      <mat-icon>{{ backup.keep ? 'push_pin' : 'bookmark_border' }}</mat-icon>{{ backup.keep ? 'Stop keeping' : 'Keep forever' }}
                    </button>
                  </div>
                }
              </li>
            }
          </ul>
        }
      </section>

      <!-- Google Cloud protection -->
      <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-base font-semibold text-slate-900">Set up Google Cloud protection (one time)</h2>
        <p class="mt-1 text-sm text-slate-500">
          Run these once in a terminal signed in to Google Cloud as a project owner. This page can't check whether they are already on;
          see the Google Cloud console → Firestore → Disaster recovery.
        </p>
        <ol class="mt-4 space-y-4">
          @for (step of setupSteps; track step.title; let i = $index) {
            <li class="min-w-0">
              <p class="font-medium text-slate-800">{{ i + 1 }}. {{ step.title }}</p>
              <p class="text-sm text-slate-500">{{ step.text }}</p>
              <div class="mt-2 flex min-w-0 items-start gap-2">
                <pre class="min-w-0 flex-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">{{ step.command }}</pre>
                <button mat-icon-button type="button" aria-label="Copy command" matTooltip="Copy" (click)="copy(step.command, 'Command copied.')">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </li>
          }
        </ol>
        <p class="mt-4 text-xs text-slate-500">
          Step 4 uses <code class="rounded bg-slate-100 px-1">storage-lifecycle.json</code> in the Zebron repository, which deletes old file versions after 30 days.
        </p>
      </section>
    </section>
  `,
})
export class PlatformBackupsComponent {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly downloads = DOWNLOADS;
  protected readonly setupSteps = SETUP_STEPS;
  protected readonly keepCount = 8;

  protected readonly backups = signal<PlatformBackup[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly starting = signal(false);
  protected readonly busy = signal<string | null>(null);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly running = computed(() =>
    this.backups().some((backup) => (backup.status === 'queued' || backup.status === 'running') && !this.isStuck(backup)),
  );

  private readonly refreshed = new Set<string>();

  constructor() {
    afterNextRender(() => {
      const unsubscribe = onSnapshot(
        query(collection(firestore, 'platformBackups'), orderBy('createdAt', 'desc'), limit(20)),
        (snapshot) => {
          const backups = snapshot.docs.map((document) => toBackup(document.id, document.data()));
          this.backups.set(backups);
          this.loading.set(false);
          this.loadError.set('');
          this.autoRefresh(backups);
        },
        (error) => {
          this.logger.error('PlatformBackupsComponent', 'Backups could not be loaded.', error);
          this.loading.set(false);
          this.loadError.set('Backups could not be loaded. Only Zebron platform administrators can see this page.');
        },
      );
      this.destroyRef.onDestroy(unsubscribe);
    });
  }

  protected async backUpNow(): Promise<void> {
    this.starting.set(true);
    this.message.set(null);
    try {
      await httpsCallable(firebaseFunctions, 'startPlatformBackup')({});
      this.message.set({ text: 'Backup started. It usually takes a few minutes; this page updates by itself.', error: false });
    } catch (error) {
      this.logger.error('PlatformBackupsComponent', 'Backup could not start.', error);
      this.message.set({ text: errorText(error, 'The backup could not start. Try again in a minute.'), error: true });
    } finally {
      this.starting.set(false);
    }
  }

  protected async refresh(backup: PlatformBackup): Promise<void> {
    await this.callRefresh(backup.id, {});
  }

  protected async toggleKeep(backup: PlatformBackup): Promise<void> {
    await this.callRefresh(backup.id, { keep: !backup.keep });
  }

  protected async download(backup: PlatformBackup, file: DownloadFile): Promise<void> {
    this.busy.set(backup.id + file.name);
    this.message.set(null);
    try {
      const blob = await getBlob(ref(firebaseStorage, `platform-backups/${backup.id}/${file.name}`));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zebron-${backup.id}-${file.name}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      this.logger.error('PlatformBackupsComponent', 'Backup file could not be downloaded.', error);
      const code = (error as { code?: string })?.code ?? '';
      this.message.set({
        text: code === 'storage/object-not-found'
          ? `${file.label} isn't in this backup (see the problems listed on it).`
          : 'The file could not be downloaded. Large files are easier with "Copy download command".',
        error: true,
      });
    } finally {
      this.busy.set(null);
    }
  }

  protected copyCommand(backup: PlatformBackup): string {
    return `gcloud storage cp -r gs://${BUCKET}/platform-backups/${backup.id} .`;
  }

  protected async copy(text: string, done: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.message.set({ text: done, error: false });
    } catch {
      this.message.set({ text: 'Copying is blocked in this browser. Select the text and copy it instead.', error: true });
    }
  }

  protected size(bytes: number | null | undefined): string {
    const value = bytes ?? 0;
    if (value < 1024) {
      return `${value} B`;
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let amount = value / 1024;
    let unit = 0;
    while (amount >= 1024 && unit < units.length - 1) {
      amount /= 1024;
      unit += 1;
    }
    return `${amount.toFixed(amount < 10 ? 1 : 0)} ${units[unit]}`;
  }

  protected displayStatus(backup: PlatformBackup): { label: string; pill: string; busy: boolean } {
    const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium';
    if ((backup.status === 'queued' || backup.status === 'running') && this.isStuck(backup)) {
      return { label: 'Stopped', pill: `${base} bg-red-100 text-red-800`, busy: false };
    }
    switch (backup.status) {
      case 'queued':
        return { label: 'Waiting', pill: `${base} bg-slate-100 text-slate-700`, busy: true };
      case 'running':
        return { label: 'Backing up…', pill: `${base} bg-sky-100 text-sky-800`, busy: true };
      case 'complete':
        return { label: 'Complete', pill: `${base} bg-emerald-100 text-emerald-800`, busy: false };
      case 'partial':
        return { label: 'Finished with problems', pill: `${base} bg-amber-100 text-amber-800`, busy: false };
      default:
        return { label: 'Failed', pill: `${base} bg-red-100 text-red-800`, busy: false };
    }
  }

  protected exportLabel(backup: PlatformBackup): string {
    const exported = backup.firestoreExport;
    switch (exported.state) {
      case 'PROCESSING':
        return exported.documents ? `in progress (${exported.documents.toLocaleString()} documents so far)` : 'in progress';
      case 'SUCCESSFUL':
        return exported.documents ? `ready (${exported.documents.toLocaleString()} documents)` : 'ready';
      case 'FAILED':
        return 'failed';
      case 'CANCELLED':
        return 'cancelled';
      case 'not-started':
        return backup.status === 'queued' || backup.status === 'running' ? 'starting' : 'not started';
      default:
        return 'unknown';
    }
  }

  protected exportClass(state: ExportState): string {
    switch (state) {
      case 'SUCCESSFUL':
        return 'font-medium text-emerald-700';
      case 'FAILED':
      case 'CANCELLED':
        return 'font-medium text-red-700';
      default:
        return 'font-medium text-slate-700';
    }
  }

  private isStuck(backup: PlatformBackup): boolean {
    return isStuckBackup(backup);
  }

  /** Checks each still-running managed export once when the page opens. */
  private autoRefresh(backups: PlatformBackup[]): void {
    for (const backup of backups) {
      if (backup.firestoreExport.state === 'PROCESSING' && backup.status !== 'running' && !this.refreshed.has(backup.id)) {
        this.refreshed.add(backup.id);
        void this.callRefresh(backup.id, {}, true);
      }
    }
  }

  private async callRefresh(id: string, extra: { keep?: boolean }, quiet = false): Promise<void> {
    if (!quiet) {
      this.busy.set(id);
    }
    try {
      await httpsCallable(firebaseFunctions, 'refreshPlatformBackup')({ id, ...extra });
    } catch (error) {
      this.logger.error('PlatformBackupsComponent', 'Backup could not be updated.', error);
      if (!quiet) {
        this.message.set({ text: errorText(error, 'The backup could not be updated. Try again.'), error: true });
      }
    } finally {
      if (!quiet) {
        this.busy.set(null);
      }
    }
  }
}

function errorText(error: unknown, fallback: string): string {
  const message = (error as { message?: string })?.message ?? '';
  return message && !/^internal$/i.test(message) ? message : fallback;
}

import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { firebaseFunctions, firestore } from '../../../../core/services/firebase-config';
import { LoggerService } from '../../../../core/services/logger.service';
import { OVERDUE_AFTER_MS, PlatformBackup, isStuckBackup, toBackup } from './platform-backup.model';

type Health = 'good' | 'warning' | 'problem' | 'running' | 'none';

const HEALTH_STYLE: Record<Health, { pill: string; dot: string; icon: string }> = {
  good: { pill: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', icon: 'verified' },
  warning: { pill: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', icon: 'warning' },
  problem: { pill: 'bg-red-100 text-red-800', dot: 'bg-red-500', icon: 'error' },
  running: { pill: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500', icon: 'sync' },
  none: { pill: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', icon: 'cloud_off' },
};

/**
 * Backups tile for Configuration → Overview: health of the latest
 * backup, the full database export, the last five runs, and Back up now.
 * Live from platformBackups (platform administrators only).
 *
 *   <app-backup-status-card />
 */
@Component({
  selector: 'app-backup-status-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="backup-status-title">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#007979] text-white">
            <mat-icon aria-hidden="true">backup</mat-icon>
          </div>
          <div class="min-w-0">
            <h2 id="backup-status-title" class="text-base font-semibold text-slate-900">Backups</h2>
            <p class="text-xs text-slate-500">Weekly on Mondays, 3:15 a.m. (New York) · newest 8 kept</p>
          </div>
        </div>
        @if (!loading()) {
          <span [class]="'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ' + style().pill">
            @if (health() === 'running') {
              <mat-spinner diameter="12" class="!inline-block"></mat-spinner>
            } @else {
              <span [class]="'h-2 w-2 rounded-full ' + style().dot"></span>
            }
            {{ headline() }}
          </span>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center py-6"><mat-spinner diameter="28"></mat-spinner></div>
      } @else if (loadError()) {
        <p class="mt-4 text-sm text-red-700">{{ loadError() }}</p>
      } @else {
        @if (latest(); as last) {
          <div class="mt-4 grid min-w-0 grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div class="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
              <p class="text-xs text-slate-500">Last backup</p>
              <p class="truncate font-medium text-slate-900">{{ ago(last.createdAt) }}</p>
            </div>
            <div class="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
              <p class="text-xs text-slate-500">Records</p>
              <p class="font-medium text-slate-900">{{ last.records ? (last.records.total | number) : '–' }}</p>
            </div>
            <div class="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
              <p class="text-xs text-slate-500">Accounts</p>
              <p class="font-medium text-slate-900">{{ last.users !== null ? (last.users | number) : '–' }}</p>
            </div>
            <div class="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
              <p class="text-xs text-slate-500">Full database export</p>
              <p [class]="'font-medium ' + exportTone(last)">{{ exportText(last) }}</p>
            </div>
          </div>

          @if (detail()) {
            <p class="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
              <mat-icon [class]="'!h-5 !w-5 shrink-0 !text-[20px] ' + (health() === 'problem' ? 'text-red-600' : 'text-amber-600')">{{ style().icon }}</mat-icon>
              <span class="min-w-0">{{ detail() }}</span>
            </p>
          }

          <h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent activity</h3>
          <ul class="mt-1 divide-y divide-slate-100 text-sm">
            @for (backup of backups(); track backup.id) {
              <li class="flex min-w-0 items-center justify-between gap-3 py-2">
                <span class="min-w-0 truncate text-slate-700">
                  {{ backup.createdAt ? (backup.createdAt | date: 'EEE d MMM, h:mm a') : 'Just now' }}
                  <span class="text-slate-400">· {{ backup.trigger === 'scheduled' ? 'Weekly' : 'Manual' }}{{ backup.requestedBy?.email ? ' by ' + backup.requestedBy?.email : '' }}</span>
                </span>
                <span [class]="'shrink-0 text-xs font-medium ' + statusTone(backup)">{{ statusText(backup) }}</span>
              </li>
            }
          </ul>
        } @else {
          <p class="mt-4 text-sm text-slate-600">
            No backups yet. Make the first one now; after that one runs every Monday.
          </p>
        }

        @if (message(); as note) {
          <p [class]="'mt-3 text-sm ' + (note.error ? 'text-red-700' : 'text-teal-800')" role="status">{{ note.text }}</p>
        }

        <div class="mt-4 flex flex-wrap gap-2">
          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" (click)="backUpNow()" [disabled]="starting() || health() === 'running'">
            <mat-icon>cloud_upload</mat-icon>Back up now
          </button>
          <a mat-stroked-button routerLink="/admin/backups" class="!text-[#007979]">
            <mat-icon>open_in_new</mat-icon>Open Backups
          </a>
        </div>
      }
    </section>
  `,
})
export class BackupStatusCardComponent {
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly backups = signal<PlatformBackup[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly starting = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  /** The newest backup. */
  protected readonly latest = computed(() => this.backups()[0] ?? null);

  /** The newest backup that finished (complete or partial). */
  private readonly lastFinished = computed(() =>
    this.backups().find((backup) => backup.status === 'complete' || backup.status === 'partial') ?? null,
  );

  protected readonly health = computed<Health>(() => {
    const last = this.latest();
    if (!last) {
      return 'none';
    }
    if ((last.status === 'queued' || last.status === 'running') && !isStuckBackup(last)) {
      return 'running';
    }
    const finished = this.lastFinished();
    if (!finished || last.status === 'failed' || isStuckBackup(last)) {
      return 'problem';
    }
    if (this.overdue(finished) || last.status === 'partial' || ['FAILED', 'CANCELLED'].includes(last.firestoreExport.state)) {
      return 'warning';
    }
    return 'good';
  });

  protected readonly style = computed(() => HEALTH_STYLE[this.health()]);

  protected readonly headline = computed(() => {
    switch (this.health()) {
      case 'good':
        return 'Healthy';
      case 'warning':
        return 'Needs attention';
      case 'problem':
        return 'Problem';
      case 'running':
        return 'Backing up…';
      default:
        return 'No backups';
    }
  });

  /** One sentence saying what is wrong, when something is. */
  protected readonly detail = computed(() => {
    const last = this.latest();
    const finished = this.lastFinished();
    if (!last || this.health() === 'good' || this.health() === 'running') {
      return '';
    }
    if (isStuckBackup(last)) {
      return 'The latest backup stopped before finishing. Start another, then check the Cloud Functions logs for runPlatformBackup.';
    }
    if (last.status === 'failed') {
      return `The latest backup failed${last.problems[0] ? ': ' + last.problems[0] : '.'}`;
    }
    if (!finished) {
      return 'No backup has finished yet.';
    }
    if (this.overdue(finished)) {
      return `The last finished backup is ${this.ago(finished.createdAt)}, so a weekly run was missed. Check that scheduledPlatformBackup is deployed.`;
    }
    if (['FAILED', 'CANCELLED'].includes(last.firestoreExport.state)) {
      return 'The full database export failed. Admin → Backups shows the error; usually the one-time export permissions are missing.';
    }
    if (last.status === 'partial') {
      return last.problems[0] ?? 'The latest backup finished with problems.';
    }
    return '';
  });

  constructor() {
    afterNextRender(() => {
      const unsubscribe = onSnapshot(
        query(collection(firestore, 'platformBackups'), orderBy('createdAt', 'desc'), limit(5)),
        (snapshot) => {
          this.backups.set(snapshot.docs.map((document) => toBackup(document.id, document.data())));
          this.loading.set(false);
          this.loadError.set('');
        },
        (error) => {
          this.logger.error('BackupStatusCardComponent', 'Backup status could not be loaded.', error);
          this.loading.set(false);
          this.loadError.set('Backup status could not be loaded.');
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
      this.message.set({ text: 'Backup started. This tile updates by itself.', error: false });
    } catch (error) {
      this.logger.error('BackupStatusCardComponent', 'Backup could not start.', error);
      const text = (error as { message?: string })?.message ?? '';
      this.message.set({ text: text && !/^internal$/i.test(text) ? text : 'The backup could not start. Try again in a minute.', error: true });
    } finally {
      this.starting.set(false);
    }
  }

  protected ago(date: Date | null): string {
    if (!date) {
      return 'just now';
    }
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} h ago`;
    }
    const days = Math.round(hours / 24);
    return days === 1 ? 'yesterday' : `${days} days ago`;
  }

  protected exportText(backup: PlatformBackup): string {
    switch (backup.firestoreExport.state) {
      case 'SUCCESSFUL':
        return 'Ready';
      case 'PROCESSING':
        return 'In progress';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'not-started':
        return backup.status === 'queued' || backup.status === 'running' ? 'Starting' : 'Not started';
      default:
        return 'Unknown';
    }
  }

  protected exportTone(backup: PlatformBackup): string {
    const state = backup.firestoreExport.state;
    return state === 'SUCCESSFUL' ? 'text-emerald-700' : state === 'FAILED' || state === 'CANCELLED' ? 'text-red-700' : 'text-slate-900';
  }

  protected statusText(backup: PlatformBackup): string {
    if (isStuckBackup(backup)) {
      return 'Stopped';
    }
    switch (backup.status) {
      case 'queued':
        return 'Waiting';
      case 'running':
        return 'Backing up…';
      case 'complete':
        return 'Complete';
      case 'partial':
        return 'With problems';
      default:
        return 'Failed';
    }
  }

  protected statusTone(backup: PlatformBackup): string {
    if (isStuckBackup(backup) || backup.status === 'failed') {
      return 'text-red-700';
    }
    if (backup.status === 'partial') {
      return 'text-amber-700';
    }
    if (backup.status === 'complete') {
      return 'text-emerald-700';
    }
    return 'text-sky-700';
  }

  private overdue(backup: PlatformBackup): boolean {
    return !!backup.createdAt && Date.now() - backup.createdAt.getTime() > OVERDUE_AFTER_MS;
  }
}

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { NotificationService } from '../../core/services/notification.service';

import { LearnerNotification, LearnerNotificationService, NOTIFICATION_KINDS } from './learner-notification.service';

/**
 * /notifications: the learner's updates (courses assigned, assignments,
 * reviews, due dates) and the switch for the summary email.
 */
@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatIconModule, TranslatePipe],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="flex flex-1 items-center gap-2 text-2xl font-bold text-slate-900">
            <mat-icon class="text-[#007979]" aria-hidden="true">notifications</mat-icon>
            {{ 'Notifications' | t }}
          </h1>
          @if (service.unreadCount()) {
            <button type="button" (click)="markAllRead()" class="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">done_all</mat-icon>
              {{ 'Mark all as read' | t }}
            </button>
          }
        </div>

        <!-- Email summary switch -->
        <section class="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <mat-icon class="text-slate-500" aria-hidden="true">mail</mat-icon>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-900">{{ 'Email me a summary' | t }}</p>
            <p class="text-sm text-slate-600">{{ 'Only when there is something new, and at most every few days unless something is due.' | t }}</p>
          </div>
          @if (emails() !== null) {
            <label class="inline-flex cursor-pointer items-center gap-2">
              <span class="sr-only">{{ 'Email me a summary' | t }}</span>
              <input type="checkbox" class="peer sr-only" [checked]="emails()" [disabled]="saving()" (change)="setEmails($any($event.target).checked)" />
              <span class="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#007979] peer-focus-visible:ring-2 peer-focus-visible:ring-teal-300 peer-disabled:opacity-60 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" aria-hidden="true"></span>
              <span class="w-8 text-sm font-medium text-slate-700">{{ (emails() ? 'On' : 'Off') | t }}</span>
            </label>
          }
        </section>

        <!-- Updates -->
        @if (!service.loaded()) {
          <div class="mt-4 space-y-2" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-20 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (!service.items().length) {
          <div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">notifications_none</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">{{ 'No notifications yet.' | t }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ 'You will see new courses, assignments, feedback and due dates here.' | t }}</p>
          </div>
        } @else {
          <ul class="mt-4 space-y-2">
            @for (item of service.items(); track item.id) {
              <li class="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm" [class]="item.read ? 'border-slate-200' : 'border-teal-200 bg-teal-50/30'">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" [class]="kind(item).classes" aria-hidden="true">
                  <mat-icon class="!h-5 !w-5 !text-[20px]">{{ kind(item).icon }}</mat-icon>
                </span>
                <a [routerLink]="item.link" (click)="open(item, $event)" class="min-w-0 flex-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
                  <span class="block font-semibold text-slate-900">
                    @if (!item.read) {
                      <span class="mr-1 inline-block h-2 w-2 rounded-full bg-[#007979] align-middle" aria-hidden="true"></span>
                      <span class="sr-only">{{ 'New:' | t }}</span>
                    }
                    {{ item.title }}
                  </span>
                  @if (item.body) {
                    <span class="mt-0.5 block text-sm text-slate-600">{{ item.body }}</span>
                  }
                  @if (item.createdAt) {
                    <span class="mt-1 block text-xs text-slate-500">{{ item.createdAt | date: 'MMM d, h:mm a' }}</span>
                  }
                </a>
                <button type="button" (click)="remove(item)" class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" [attr.aria-label]="'Remove' | t" [title]="'Remove' | t">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">close</mat-icon>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </main>
  `,
})
export class NotificationsComponent implements OnInit {
  protected readonly service = inject(LearnerNotificationService);
  private readonly notify = inject(NotificationService);

  protected readonly emails = signal<boolean | null>(null);
  protected readonly saving = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.emails.set(await this.service.emailsEnabled());
    } catch {
      this.emails.set(true);
    }
  }

  protected kind(item: LearnerNotification) {
    return NOTIFICATION_KINDS[item.kind];
  }

  protected open(item: LearnerNotification, event: MouseEvent): void {
    void this.service.markRead(item).catch(() => undefined);
    // Same page: nothing to navigate to.
    if (item.link === '/notifications') event.preventDefault();
  }

  protected async markAllRead(): Promise<void> {
    try {
      await this.service.markAllRead();
    } catch {
      this.notify.error('Could not update. Try again.');
    }
  }

  protected async remove(item: LearnerNotification): Promise<void> {
    try {
      await this.service.remove(item);
    } catch {
      this.notify.error('Could not remove it. Try again.');
    }
  }

  protected async setEmails(enabled: boolean): Promise<void> {
    this.saving.set(true);
    try {
      await this.service.setEmailsEnabled(enabled);
      this.emails.set(enabled);
      this.notify.success(enabled ? 'Summary emails are on.' : 'Summary emails are off.');
    } catch {
      this.notify.error('Could not save. Try again.');
    } finally {
      this.saving.set(false);
    }
  }
}

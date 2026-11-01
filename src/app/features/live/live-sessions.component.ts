import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';
import { OrganizationContextStore } from '../organizations/stores/organization-context.store';
import {
  LIVE_PROVIDERS,
  LiveProvider,
  LiveRegistration,
  LiveSession,
  LiveSessionService,
  canJoinNow,
  newJitsiLink,
  providerFromUrl,
  sessionCalendarFile,
  sessionEnd,
} from './live-session.service';

/** The schedule / edit form. */
interface SessionForm {
  isNew: boolean;
  session: LiveSession;
  /** <input type="datetime-local"> value, in the person's time zone. */
  start: string;
}

const DURATIONS = [30, 45, 60, 90, 120, 180];

/**
 * Virtual Classroom: instructor-led live sessions.
 *
 * - Members: upcoming sessions, register or cancel, add to calendar, and
 *   Join (open 15 minutes before the start); recordings of past sessions.
 * - Staff and above: schedule, edit, cancel and delete sessions, create the
 *   meeting link (Jitsi automatically, or open Google Meet, Zoom or Teams,
 *   or paste any link) and mark attendance.
 *
 * Route: /partner/org/:organizationId/live
 */
@Component({
  selector: 'app-live-sessions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgClass, RouterLink, MatIconModule, MatMenuModule, TranslatePipe],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'dashboard']"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Dashboard' | t"
            [title]="'Dashboard' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-semibold">{{ 'Virtual Classroom' | t }}</h1>
            <p class="text-sm text-white/85">{{ 'Live sessions with an instructor. Times are shown in your time zone ({0}).' | t: [timeZone] }}</p>
          </div>
          @if (canRun()) {
            <button
              type="button"
              (click)="newSession()"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#006666] shadow-sm hover:bg-white/90"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>
              {{ 'Schedule session' | t }}
            </button>
          }
        </div>
      </header>

      <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">{{ error() | t }}</p>
        }

        <nav class="mb-4 flex gap-1" [attr.aria-label]="'Sessions' | t">
          @for (tab of tabs; track tab.key) {
            <button
              type="button"
              (click)="view.set(tab.key)"
              [attr.aria-pressed]="view() === tab.key"
              [class]="view() === tab.key
                ? 'inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979]/10 px-3 text-sm font-semibold text-[#006666]'
                : 'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100'"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ tab.icon }}</mat-icon>
              {{ tab.label | t }}
              <span class="rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">{{ tab.key === 'upcoming' ? upcoming().length : past().length }}</span>
            </button>
          }
        </nav>

        @if (loading()) {
          <div class="space-y-3" aria-busy="true">
            @for (row of [1, 2, 3]; track row) {
              <div class="h-28 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (shown().length === 0) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">video_camera_front</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">{{ (view() === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet') | t }}</p>
            @if (canRun() && view() === 'upcoming') {
              <p class="mt-1 text-sm text-slate-600">{{ 'Schedule a session: Zebron makes a Jitsi link, or use Google Meet, Zoom or Teams.' | t }}</p>
            }
          </div>
        } @else {
          <ul class="space-y-3">
            @for (session of shown(); track session.id) {
              <li class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" [class.opacity-70]="session.status === 'cancelled'">
                <div class="flex gap-4">
                  <!-- Date tile -->
                  <div class="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-[#007979]">
                    <span class="text-xs font-semibold uppercase">{{ session.startAt | date: 'MMM' }}</span>
                    <span class="text-2xl font-bold leading-none">{{ session.startAt | date: 'd' }}</span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-base font-semibold text-slate-900">{{ session.title }}</h2>
                      @if (session.status === 'cancelled') {
                        <span class="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">{{ 'Cancelled' | t }}</span>
                      } @else if (isLive(session)) {
                        <span class="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">{{ 'Live now' | t }}</span>
                      }
                      @if (registered().has(session.id)) {
                        <span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">check</mat-icon>{{ 'Registered' | t }}
                        </span>
                      }
                    </div>
                    <p class="mt-0.5 text-sm text-slate-600">
                      {{ session.startAt | date: 'EEEE, MMMM d · h:mm a' }} – {{ end(session) | date: 'h:mm a' }}
                      · {{ providerName(session.provider) | t }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      @if (session.instructorName) {
                        {{ 'With {0}' | t: [session.instructorName] }} ·
                      }
                      {{ session.capacity ? ('{0} of {1} places taken' | t: [session.registeredCount, session.capacity]) : ('{0} registered' | t: [session.registeredCount]) }}
                    </p>
                    @if (session.description) {
                      <p class="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-700">{{ session.description }}</p>
                    }

                    <!-- Actions -->
                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      @if (session.status === 'scheduled' && view() === 'upcoming') {
                        @if (canJoin(session)) {
                          <a
                            [href]="session.meetingUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">login</mat-icon>
                            {{ 'Join' | t }}
                          </a>
                        }
                        @if (registered().has(session.id)) {
                          <button type="button" (click)="register(session, 'cancel')" [disabled]="busyId() === session.id" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            {{ 'Cancel registration' | t }}
                          </button>
                        } @else if (!isFull(session)) {
                          <button type="button" (click)="register(session, 'register')" [disabled]="busyId() === session.id" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                            <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">how_to_reg</mat-icon>
                            {{ 'Register' | t }}
                          </button>
                        } @else {
                          <span class="text-sm font-semibold text-amber-700">{{ 'Full' | t }}</span>
                        }
                        <button type="button" (click)="downloadCalendar(session)" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">event</mat-icon>
                          {{ 'Add to calendar' | t }}
                        </button>
                        @if (!canJoin(session)) {
                          <span class="text-xs text-slate-500">{{ 'Join opens 15 minutes before the start.' | t }}</span>
                        }
                      }
                      @if (view() === 'past' && session.recordingUrl) {
                        <a [href]="session.recordingUrl" target="_blank" rel="noopener noreferrer" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
                          <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">play_circle</mat-icon>
                          {{ 'Watch the recording' | t }}
                        </a>
                      }

                      @if (canRun()) {
                        <button
                          type="button"
                          [matMenuTriggerFor]="sessionMenu"
                          [matMenuTriggerData]="{ session: session }"
                          class="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                          [attr.aria-label]="'Manage session' | t"
                          [title]="'Manage session' | t"
                        >
                          <mat-icon aria-hidden="true">more_vert</mat-icon>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </main>

    <mat-menu #sessionMenu="matMenu" xPosition="before">
      <ng-template matMenuContent let-session="session">
        <button mat-menu-item type="button" (click)="editSession(session)">
          <mat-icon>edit</mat-icon><span>{{ (isPast(session) ? 'Edit / add recording' : 'Edit') | t }}</span>
        </button>
        <button mat-menu-item type="button" (click)="openAttendance(session)">
          <mat-icon>fact_check</mat-icon><span>{{ 'Registrations and attendance' | t }}</span>
        </button>
        @if (session.status === 'scheduled' && !isPast(session)) {
          <button mat-menu-item type="button" (click)="cancelSession(session)">
            <mat-icon>event_busy</mat-icon><span>{{ 'Cancel session' | t }}</span>
          </button>
        }
        <button mat-menu-item type="button" class="!text-red-600" (click)="deleteSession(session)">
          <mat-icon class="!text-red-600">delete</mat-icon><span>{{ 'Delete' | t }}</span>
        </button>
      </ng-template>
    </mat-menu>

    <!-- ================= SCHEDULE / EDIT ================= -->
    @if (form(); as current) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="closeForm()">
        <section
          class="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-form-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <h2 id="session-form-title" class="text-lg font-semibold text-white">{{ (current.isNew ? 'Schedule session' : 'Edit session') | t }}</h2>
            <button type="button" (click)="closeForm()" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>

          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            @if (formError()) {
              <p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ formError() | t }}</p>
            }

            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Title' | t }}</span>
              <input class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" maxlength="200" [value]="current.session.title" (input)="patch({ title: $any($event.target).value })" />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-slate-700">{{ 'Description (optional)' | t }}</span>
              <textarea class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows="3" maxlength="5000" [value]="current.session.description" (input)="patch({ description: $any($event.target).value })"></textarea>
            </label>

            <div class="grid gap-4 sm:grid-cols-3">
              <label class="block sm:col-span-2">
                <span class="text-sm font-medium text-slate-700">{{ 'Starts' | t }}</span>
                <input type="datetime-local" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" [value]="current.start" (input)="setStart($any($event.target).value)" />
                <span class="mt-0.5 block text-xs text-slate-500">{{ 'Your time zone: {0}' | t: [timeZone] }}</span>
              </label>
              <label class="block">
                <span class="text-sm font-medium text-slate-700">{{ 'Length' | t }}</span>
                <select class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2" [value]="current.session.durationMinutes" (change)="patch({ durationMinutes: +$any($event.target).value })">
                  @for (minutes of durations; track minutes) {
                    <option [value]="minutes" [selected]="minutes === current.session.durationMinutes">{{ '{0} minutes' | t: [minutes] }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-medium text-slate-700">{{ 'Instructor' | t }}</span>
                <input class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" maxlength="120" [value]="current.session.instructorName" (input)="patch({ instructorName: $any($event.target).value })" />
              </label>
              <label class="block">
                <span class="text-sm font-medium text-slate-700">{{ 'Places (0 = no limit)' | t }}</span>
                <input type="number" min="0" max="10000" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" [value]="current.session.capacity" (input)="patch({ capacity: +$any($event.target).value || 0 })" />
              </label>
            </div>

            <!-- Meeting link -->
            <fieldset class="rounded-xl border border-slate-200 p-4">
              <legend class="px-1 text-sm font-semibold text-slate-900">{{ 'Meeting link' | t }}</legend>
              <div class="flex flex-wrap gap-2">
                <button type="button" (click)="useJitsi()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">auto_awesome</mat-icon>
                  {{ 'Create a Jitsi link' | t }}
                </button>
                @for (provider of quickCreate; track provider.id) {
                  <a
                    [href]="provider.createUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    (click)="patch({ provider: provider.id })"
                    class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">open_in_new</mat-icon>
                    {{ 'Open {0}' | t: [provider.name] }}
                  </a>
                }
              </div>
              <p class="mt-2 text-xs text-slate-500">{{ 'Jitsi is free and learners need no account. For Google Meet, Zoom or Teams, create the meeting in the tab that opens, then paste its link here.' | t }}</p>
              <label class="mt-3 block">
                <span class="sr-only">{{ 'Meeting link' | t }}</span>
                <input
                  type="url"
                  class="h-10 w-full rounded-lg border border-slate-300 px-3"
                  placeholder="https://"
                  [value]="current.session.meetingUrl"
                  (input)="setMeetingUrl($any($event.target).value)"
                />
              </label>
              @if (current.session.meetingUrl) {
                <p class="mt-1 text-xs text-slate-500">{{ 'Detected: {0}' | t: [(providerName(current.session.provider) | t)] }}</p>
              }
            </fieldset>

            @if (!current.isNew) {
              <label class="block">
                <span class="text-sm font-medium text-slate-700">{{ 'Recording link (optional)' | t }}</span>
                <input type="url" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3" placeholder="https://" [value]="current.session.recordingUrl" (input)="patch({ recordingUrl: $any($event.target).value })" />
                <span class="mt-0.5 block text-xs text-slate-500">{{ 'Shown to learners on past sessions.' | t }}</span>
              </label>
            }
          </div>

          <footer class="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button type="button" (click)="closeForm()" class="h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">{{ 'Cancel' | t }}</button>
            <button type="button" (click)="saveForm()" [disabled]="saving()" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ saving() ? 'hourglass_top' : 'save' }}</mat-icon>
              {{ (current.isNew ? 'Schedule' : 'Save') | t }}
            </button>
          </footer>
        </section>
      </div>
    }

    <!-- ================= REGISTRATIONS AND ATTENDANCE ================= -->
    @if (attendanceFor(); as session) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="attendanceFor.set(null)">
        <section
          class="flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <div class="min-w-0">
              <h2 id="attendance-title" class="truncate text-lg font-semibold text-white">{{ 'Registrations and attendance' | t }}</h2>
              <p class="truncate text-xs text-white/85">{{ session.title }} · {{ session.startAt | date: 'MMM d, h:mm a' }}</p>
            </div>
            <button type="button" (click)="attendanceFor.set(null)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto">
            @if (attendanceLoading()) {
              <p class="p-5 text-sm text-slate-500">{{ 'Loading…' | t }}</p>
            } @else if (attendees().length === 0) {
              <p class="p-5 text-sm text-slate-500">{{ 'No one has registered yet.' | t }}</p>
            } @else {
              <p class="border-b border-slate-100 px-5 py-2 text-xs text-slate-500">
                {{ '{0} registered · {1} attended' | t: [attendees().length, attendedCount()] }}
              </p>
              <ul class="divide-y divide-slate-100">
                @for (person of attendees(); track person.userId) {
                  <li>
                    <label class="flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-slate-50">
                      <input type="checkbox" class="h-4 w-4 cursor-pointer accent-[#007979]" [checked]="person.attended" (change)="toggleAttended(session, person)" />
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium text-slate-900">{{ person.name }}</span>
                        @if (person.email) {
                          <span class="block truncate text-xs text-slate-500">{{ person.email }}</span>
                        }
                      </span>
                      <span class="text-xs" [ngClass]="person.attended ? 'font-semibold text-emerald-700' : 'text-slate-400'">{{ (person.attended ? 'Attended' : 'Not marked') | t }}</span>
                    </label>
                  </li>
                }
              </ul>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class LiveSessionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(LiveSessionService);
  private readonly auth = inject(AuthService);
  private readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  protected readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected readonly durations = DURATIONS;
  protected readonly quickCreate = LIVE_PROVIDERS.filter((provider) => provider.createUrl);
  protected readonly tabs = [
    { key: 'upcoming' as const, label: 'Upcoming', icon: 'event_upcoming' },
    { key: 'past' as const, label: 'Past', icon: 'history' },
  ];

  protected readonly sessions = signal<LiveSession[]>([]);
  protected readonly registered = signal<Set<string>>(new Set());
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly busyId = signal<string | null>(null);
  protected readonly view = signal<'upcoming' | 'past'>('upcoming');
  /** Re-evaluated every minute so Join and "Live now" appear on time. */
  private readonly now = signal(Date.now());

  protected readonly canRun = computed(() => this.access.isStaffOrAbove());

  protected readonly upcoming = computed(() =>
    this.sessions()
      .filter((session) => sessionEnd(session).getTime() + 30 * 60_000 >= this.now())
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
  );

  protected readonly past = computed(() =>
    this.sessions().filter((session) => sessionEnd(session).getTime() + 30 * 60_000 < this.now()),
  );

  protected readonly shown = computed(() => (this.view() === 'upcoming' ? this.upcoming() : this.past()));

  // Form
  protected readonly form = signal<SessionForm | null>(null);
  protected readonly formError = signal('');
  protected readonly saving = signal(false);

  // Attendance
  protected readonly attendanceFor = signal<LiveSession | null>(null);
  protected readonly attendees = signal<LiveRegistration[]>([]);
  protected readonly attendanceLoading = signal(false);
  protected readonly attendedCount = computed(() => this.attendees().filter((person) => person.attended).length);

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.i18n.t('Virtual Classroom'));

    if (typeof window !== 'undefined') {
      const timer = setInterval(() => this.now.set(Date.now()), 60_000);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }

    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
    } catch {
      // Context errors are shown elsewhere.
    }

    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const sessions = await this.service.list(this.organizationId);
      this.sessions.set(sessions);

      const uid = this.auth.firebaseUser()?.uid;
      if (uid) {
        const upcomingIds = sessions.filter((session) => sessionEnd(session).getTime() >= Date.now()).map((session) => session.id);
        this.registered.set(await this.service.myRegistrations(this.organizationId, upcomingIds, uid));
      }
    } catch (error) {
      this.logger.error('LiveSessionsComponent', 'Could not load sessions.', error);
      this.error.set('Live sessions could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  // ------------------------------------------------------------
  // Learners
  // ------------------------------------------------------------

  protected end(session: LiveSession): Date {
    return sessionEnd(session);
  }

  protected canJoin(session: LiveSession): boolean {
    this.now();
    return canJoinNow(session);
  }

  protected isLive(session: LiveSession): boolean {
    const now = this.now();
    return session.status === 'scheduled' && now >= session.startAt.getTime() && now <= sessionEnd(session).getTime();
  }

  protected isPast(session: LiveSession): boolean {
    return sessionEnd(session).getTime() < this.now();
  }

  protected isFull(session: LiveSession): boolean {
    return session.capacity > 0 && session.registeredCount >= session.capacity;
  }

  protected providerName(provider: LiveProvider): string {
    return LIVE_PROVIDERS.find((item) => item.id === provider)?.name ?? 'Other link';
  }

  protected async register(session: LiveSession, action: 'register' | 'cancel'): Promise<void> {
    this.busyId.set(session.id);
    this.error.set('');

    try {
      const result = await this.service.register(this.organizationId, session.id, action);
      const next = new Set(this.registered());
      if (result.registered) {
        next.add(session.id);
      } else {
        next.delete(session.id);
      }
      this.registered.set(next);
      this.sessions.update((items) => items.map((item) => (item.id === session.id ? { ...item, registeredCount: result.registeredCount } : item)));
    } catch (error) {
      this.error.set(error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.');
    } finally {
      this.busyId.set(null);
    }
  }

  protected downloadCalendar(session: LiveSession): void {
    const name = this.organizationStore.selectedOrganization()?.name ?? 'Zebron';
    const blob = new Blob([sessionCalendarFile(session, name)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 60) || 'session'}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ------------------------------------------------------------
  // Staff: schedule and manage
  // ------------------------------------------------------------

  protected newSession(): void {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);

    const user = this.auth.firebaseUser();
    this.formError.set('');
    this.form.set({
      isNew: true,
      start: toLocalInput(start),
      session: {
        id: '',
        title: '',
        description: '',
        instructorId: user?.uid ?? null,
        instructorName: this.auth.user()?.displayName?.trim() || user?.displayName || '',
        startAt: start,
        durationMinutes: 60,
        capacity: 0,
        provider: 'jitsi',
        meetingUrl: '',
        recordingUrl: '',
        status: 'scheduled',
        registeredCount: 0,
      },
    });
  }

  protected editSession(session: LiveSession): void {
    this.formError.set('');
    this.form.set({ isNew: false, start: toLocalInput(session.startAt), session: { ...session } });
  }

  protected closeForm(): void {
    if (!this.saving()) {
      this.form.set(null);
    }
  }

  protected patch(changes: Partial<LiveSession>): void {
    const current = this.form();
    if (current) {
      this.form.set({ ...current, session: { ...current.session, ...changes } });
    }
  }

  protected setStart(value: string): void {
    const current = this.form();
    const date = new Date(value);
    if (current && !Number.isNaN(date.getTime())) {
      this.form.set({ ...current, start: value, session: { ...current.session, startAt: date } });
    }
  }

  protected setMeetingUrl(value: string): void {
    const url = value.trim();
    this.patch({ meetingUrl: url, provider: url ? providerFromUrl(url) : this.form()?.session.provider ?? 'other' });
  }

  protected useJitsi(): void {
    this.patch({ meetingUrl: newJitsiLink(this.organizationStore.selectedOrganization()?.slug), provider: 'jitsi' });
  }

  protected async saveForm(): Promise<void> {
    const current = this.form();
    const uid = this.auth.firebaseUser()?.uid;
    if (!current || !uid || this.saving()) {
      return;
    }

    const session = current.session;
    if (!session.title.trim()) {
      this.formError.set('Give the session a title.');
      return;
    }
    if (current.isNew && session.startAt.getTime() < Date.now() - 5 * 60_000) {
      this.formError.set('Choose a start time in the future.');
      return;
    }
    for (const url of [session.meetingUrl, session.recordingUrl].filter(Boolean)) {
      if (!/^https:\/\/\S+$/i.test(url)) {
        this.formError.set('Links must start with https://');
        return;
      }
    }

    this.saving.set(true);
    this.formError.set('');

    try {
      await this.service.save(this.organizationId, session, current.isNew, uid);
      this.form.set(null);
      await this.load();
    } catch (error) {
      this.logger.error('LiveSessionsComponent', 'Could not save the session.', error);
      this.formError.set('The session could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async cancelSession(session: LiveSession): Promise<void> {
    if (!window.confirm(this.i18n.t('Cancel "{0}"? Registered learners will see it as cancelled.', [session.title]))) {
      return;
    }
    try {
      await this.service.save(this.organizationId, { ...session, status: 'cancelled' }, false, this.auth.firebaseUser()?.uid ?? '');
      await this.load();
    } catch (error) {
      this.error.set('The session could not be saved. Try again.');
    }
  }

  protected async deleteSession(session: LiveSession): Promise<void> {
    if (!window.confirm(this.i18n.t('Delete "{0}" and its registrations? This cannot be undone.', [session.title]))) {
      return;
    }
    try {
      await this.service.remove(this.organizationId, session.id);
      await this.load();
    } catch (error) {
      this.error.set('The session could not be deleted. Try again.');
    }
  }

  protected async openAttendance(session: LiveSession): Promise<void> {
    this.attendanceFor.set(session);
    this.attendanceLoading.set(true);
    try {
      this.attendees.set(await this.service.listRegistrations(this.organizationId, session.id));
    } catch (error) {
      this.logger.error('LiveSessionsComponent', 'Could not load registrations.', error);
      this.attendees.set([]);
    } finally {
      this.attendanceLoading.set(false);
    }
  }

  protected async toggleAttended(session: LiveSession, person: LiveRegistration): Promise<void> {
    const attended = !person.attended;
    this.attendees.update((items) => items.map((item) => (item.userId === person.userId ? { ...item, attended } : item)));
    try {
      await this.service.setAttendance(this.organizationId, session.id, person.userId, attended);
    } catch {
      this.attendees.update((items) => items.map((item) => (item.userId === person.userId ? { ...item, attended: !attended } : item)));
    }
  }
}

/** Date -> "YYYY-MM-DDTHH:mm" in the person's time zone. */
function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

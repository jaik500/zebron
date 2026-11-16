import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import {
  DELIVERY_MODES,
  JoinRequestStatus,
  OwnRequest,
  PublicGroupInfo,
  REQUEST_STATUS_LABELS,
  TrainingGroupService,
} from './training-group.service';

/**
 * The page behind a training group's join link:
 * /join/:organizationId/:groupId
 *
 * Shows the group's public details and lets a signed-in person ask to join
 * (members, "Request to join") or apply (anyone, "Application"), see their
 * status, or withdraw. People who aren't signed in are sent to sign in and
 * brought back here.
 */
@Component({
  selector: 'app-training-group-join',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, MatIconModule, RouterLink, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#032d42] via-[#00706f] to-[#2a835f] px-4 py-8 text-white sm:px-6">
        <div class="mx-auto max-w-3xl">
          @if (info(); as group) {
            <p class="text-sm text-white/80">{{ group.organizationName }}</p>
            <h1 class="mt-1 text-2xl font-bold sm:text-3xl">{{ group.name }}</h1>
            @if (group.programName) {
              <p class="mt-1 text-white/90">{{ group.programName }}</p>
            }
          } @else {
            <h1 class="text-2xl font-bold">{{ 'Join a training group' | t }}</h1>
          }
        </div>
      </header>

      <main class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        @if (!auth.firebaseUser() && !auth.isLoading()) {
          <section class="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">school</mat-icon>
            <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'Sign in to apply' | t }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ 'Use your Zebron account, or create one for free, to see this group and apply.' | t }}</p>
            <div class="mt-4 flex flex-wrap justify-center gap-2">
              <a [routerLink]="['/login']" [queryParams]="{ returnUrl: here }" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Sign in' | t }}</a>
              <a [routerLink]="['/register']" class="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{{ 'Create an account' | t }}</a>
            </div>
            <p class="mt-3 text-xs text-slate-500">{{ 'After creating an account, open this link again to apply.' | t }}</p>
          </section>
        } @else if (loading()) {
          <p class="text-sm text-slate-500">{{ 'Loading…' | t }}</p>
        } @else if (loadError()) {
          <section class="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">link_off</mat-icon>
            <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'This group isn\\u0027t available' | t }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ loadError()! | t }}</p>
          </section>
        } @else if (info(); as group) {
          <section class="rounded-2xl border border-slate-200 bg-white p-5">
            <dl class="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Dates' | t }}</dt>
                <dd class="mt-0.5 text-slate-900">{{ group.startDate ? (group.startDate | date: 'mediumDate') : '…' }} – {{ group.endDate ? (group.endDate | date: 'mediumDate') : '…' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Delivery' | t }}</dt>
                <dd class="mt-0.5 text-slate-900">{{ deliveryLabel(group.deliveryMode) | t }}{{ group.location ? ' · ' + group.location : '' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ 'Places' | t }}</dt>
                <dd class="mt-0.5 text-slate-900">
                  @if (group.spotsLeft === null) {
                    {{ 'Open' | t }}
                  } @else if (group.spotsLeft > 0) {
                    {{ '{0} left' | t: [group.spotsLeft] }}
                  } @else {
                    {{ (group.waitlistEnabled ? 'Full: waitlist open' : 'Full') | t }}
                  }
                </dd>
              </div>
            </dl>
            @if (group.description) {
              <p class="mt-4 whitespace-pre-line text-sm text-slate-700">{{ group.description }}</p>
            }
            @if (group.closesAt && !group.closedReason) {
              <p class="mt-3 text-xs text-slate-500">{{ 'Enrollment closes {0}.' | t: [group.closesAt | date: 'mediumDate'] }}</p>
            }
          </section>

          <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5" aria-live="polite">
            @if (isGroupMember()) {
              <p class="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <mat-icon aria-hidden="true">check_circle</mat-icon>
                {{ 'You\\u0027re in this group.' | t }}
              </p>
              <a [routerLink]="['/partner/org', group.organizationId, 'training-groups', group.groupId]" class="mt-3 inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Open the group' | t }}</a>
            } @else if (request(); as own) {
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-slate-900">{{ 'Your request' | t }}</h2>
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="statusBadge(own.status).classes">{{ statusBadge(own.status).label | t }}</span>
              </div>
              <p class="mt-2 text-sm text-slate-600">{{ statusHelp(own.status) | t }}</p>
              @if (own.decisionNote) {
                <p class="mt-2 rounded-lg bg-slate-50 p-3 text-sm italic text-slate-700">“{{ own.decisionNote }}”</p>
              }
              @if (own.status === 'pending' || own.status === 'waitlisted') {
                <button type="button" (click)="withdraw()" [disabled]="busy()" class="mt-3 h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{{ 'Withdraw my request' | t }}</button>
              }
              @if ((own.status === 'declined' || own.status === 'withdrawn') && !group.closedReason) {
                <button type="button" (click)="request.set(null)" class="mt-3 h-9 rounded-lg border border-[#007979] px-3 text-sm font-semibold text-[#007979] hover:bg-teal-50">{{ 'Apply again' | t }}</button>
              }
            } @else if (group.closedReason) {
              <p class="text-sm text-slate-700">{{ group.closedReason | t }}</p>
            } @else {
              <h2 class="text-base font-semibold text-slate-900">{{ (group.mode === 'application' ? 'Apply to join' : 'Ask to join') | t }}</h2>
              @if (group.mode === 'application' && !isOrganizationMember()) {
                <p class="mt-1 text-sm text-slate-600">{{ 'If you\\u0027re accepted, you\\u0027ll receive an invitation to {0} at your account email. Accepting it adds you to this group.' | t: [group.organizationName] }}</p>
              }
              <form class="mt-3 space-y-3" (ngSubmit)="submit()">
                @for (question of group.questions; track $index) {
                  <label class="block text-sm">
                    <span class="font-medium text-slate-700">{{ question }}</span>
                    <textarea [name]="'answer' + $index" rows="3" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" [ngModel]="answerAt($index)" (ngModelChange)="setAnswer($index, $event)"></textarea>
                  </label>
                }
                <button type="submit" [disabled]="busy()" class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                  {{ (busy() ? 'Sending…' : group.mode === 'application' ? 'Send application' : 'Send request') | t }}
                </button>
              </form>
            }
            @if (error()) {
              <p class="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
            }
          </section>
        }
      </main>
    </div>
  `,
})
export class TrainingGroupJoinComponent {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(TrainingGroupService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  private readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  private readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';
  protected readonly here = this.router.url;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly info = signal<PublicGroupInfo | null>(null);
  protected readonly isOrganizationMember = signal(false);
  protected readonly isGroupMember = signal(false);
  protected readonly request = signal<OwnRequest | null>(null);
  protected readonly answers = signal<string[]>([]);

  protected answerAt(index: number): string {
    return this.answers()[index] ?? '';
  }
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly signedInUid = computed(() => this.auth.firebaseUser()?.uid ?? null);

  constructor() {
    effect(() => {
      if (this.signedInUid()) {
        void this.load();
      }
    });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const result = await this.service.getEnrollment(this.organizationId, this.groupId);
      this.info.set(result.group);
      this.isOrganizationMember.set(result.isOrganizationMember);
      this.isGroupMember.set(result.isGroupMember);
      this.request.set(result.request);
      this.answers.set(result.group.questions.map(() => ''));
    } catch (error) {
      this.logger.error('TrainingGroupJoinComponent', 'Could not load the group.', error);
      this.loadError.set(messageOf(error, 'The link may be wrong, or the group no longer accepts requests.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected setAnswer(index: number, value: string): void {
    this.answers.update((answers) => answers.map((answer, position) => (position === index ? value : answer)));
  }

  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.service.submitRequest(this.organizationId, this.groupId, 'submit', this.answers());
      await this.load();
    } catch (error) {
      this.logger.error('TrainingGroupJoinComponent', 'Could not send the request.', error);
      this.error.set(messageOf(error, 'Your request could not be sent. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected async withdraw(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.service.submitRequest(this.organizationId, this.groupId, 'withdraw');
      await this.load();
    } catch (error) {
      this.logger.error('TrainingGroupJoinComponent', 'Could not withdraw the request.', error);
      this.error.set(messageOf(error, 'Your request could not be withdrawn. Try again.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected statusBadge(status: JoinRequestStatus): { label: string; classes: string } {
    return REQUEST_STATUS_LABELS[status] ?? REQUEST_STATUS_LABELS.pending;
  }

  protected statusHelp(status: JoinRequestStatus): string {
    const help: Record<JoinRequestStatus, string> = {
      pending: 'A group lead will review your request.',
      waitlisted: "The group is full. You'll move up automatically when a place opens.",
      invited: 'Check your email for the invitation to the organization. Accepting it adds you to this group.',
      enrolled: "You're in. Open the group from your learning page.",
      declined: "Your request wasn't accepted this time.",
      withdrawn: 'You withdrew your request.',
    };
    return help[status] ?? '';
  }

  protected deliveryLabel(mode: string): string {
    return DELIVERY_MODES.find((option) => option.value === mode)?.label ?? mode;
  }
}

function messageOf(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = (error as { message?: string })?.message ?? '';
  return /not-found|failed-precondition|already-exists|permission-denied|resource-exhausted|invalid-argument/.test(code) && message ? message : fallback;
}

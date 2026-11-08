import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../../core/services/firebase-config';

/** Answer from the getOrganizationAccessStatus function. */
interface OrganizationAccessStatus {
  organizationId: string;
  name: string;
  status: string;
  role: string;
  reason: string | null;
  since: string | null;
  contactEmail: string;
}

/**
 * Shown to members when their organization is suspended, archived or
 * not yet active, instead of partner pages that cannot load. Owners and
 * admins also see the reason Zebron gave.
 */
@Component({
  selector: 'app-organization-unavailable',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[70vh] items-center justify-center p-6">
      <div class="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        @if (loading()) {
          <p class="text-sm text-gray-500">Checking your organization…</p>
        } @else {
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <mat-icon class="!h-8 !w-8 !text-[32px] !text-amber-700" aria-hidden="true">{{ icon() }}</mat-icon>
          </div>

          <h1 class="text-2xl font-semibold text-gray-900">{{ heading() }}</h1>

          <p class="mt-3 text-sm leading-6 text-gray-600">{{ message() }}</p>

          @if (info()?.reason) {
            <div class="mt-5 rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-900">
              <p class="font-semibold">Reason from Zebron</p>
              <p class="mt-1">{{ info()!.reason }}</p>
            </div>
          }

          @if (info()?.since) {
            <p class="mt-3 text-xs text-gray-500">Since {{ info()!.since | date: 'longDate' }}</p>
          }

          <div class="mt-7 flex flex-wrap justify-center gap-3">
            <a mat-flat-button class="!bg-[#032D42] !text-white" [href]="mailto()">
              <mat-icon>mail</mat-icon>
              Contact Zebron
            </a>
            <a mat-stroked-button routerLink="/partner">Your organizations</a>
            <a mat-button routerLink="/">Zebron home</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class OrganizationUnavailableComponent implements OnInit {
  /** Route parameter :organizationId (component input binding). */
  readonly organizationId = input<string>('');

  protected readonly loading = signal(true);
  protected readonly info = signal<OrganizationAccessStatus | null>(null);

  protected readonly icon = computed(() => (this.info()?.status === 'archived' ? 'inventory_2' : 'pause_circle'));

  protected readonly heading = computed(() => {
    const info = this.info();
    if (!info) return 'This organization is unavailable';
    switch (info.status) {
      case 'suspended':
        return `${info.name} is suspended`;
      case 'archived':
        return `${info.name} has been closed`;
      case 'active':
        return `${info.name} is available`;
      default:
        return `${info.name} is not open yet`;
    }
  });

  protected readonly message = computed(() => {
    const info = this.info();
    if (!info) {
      return 'You cannot open this organization right now. If you think this is a mistake, contact Zebron.';
    }
    const manager = info.role === 'org_owner' || info.role === 'org_admin';
    switch (info.status) {
      case 'suspended':
        return manager
          ? 'Zebron has paused this organization, so members cannot use its applications. Your data is kept. Contact Zebron to resolve this and reactivate it.'
          : 'This organization is paused, so its applications are not available. Your data is kept. Please contact your organization’s administrator.';
      case 'archived':
        return 'This organization is no longer active on Zebron. Its records are kept. Contact Zebron if you need anything from it.';
      case 'active':
        return 'This organization is available again. Go back to your organizations to open it.';
      default:
        return 'This organization is still being set up. Its administrators will let you know when it is ready.';
    }
  });

  protected readonly mailto = computed(() => {
    const info = this.info();
    const email = info?.contactEmail ?? 'contact@zebron.org';
    const subject = encodeURIComponent(`Organization access: ${info?.name ?? this.organizationId()}`);
    return `mailto:${email}?subject=${subject}`;
  });

  async ngOnInit(): Promise<void> {
    const organizationId = this.organizationId();
    if (!organizationId) {
      this.loading.set(false);
      return;
    }
    try {
      const call = httpsCallable<{ organizationId: string }, OrganizationAccessStatus>(
        firebaseFunctions,
        'getOrganizationAccessStatus',
      );
      this.info.set((await call({ organizationId })).data);
    } catch {
      this.info.set(null);
    } finally {
      this.loading.set(false);
    }
  }
}

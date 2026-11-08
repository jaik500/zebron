import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { HotToastService } from '@ngxpert/hot-toast';

import { firebaseFunctions, firestore } from '../../../../core/services/firebase-config';
import { getApplicationById } from '../../../../core/registries/application.registry';

/** One row of organizations/{organizationId}/applications. */
interface OrganizationApp {
  id: string;
  name: string;
  status: string;
  reason: string | null;
}

/** Apps that only change with the whole organization. */
const ORGANIZATION_LEVEL = new Set(['core', 'configuration']);

/**
 * Lists an organization's applications for Zebron admins, with
 * Suspend and Resume. Suspending asks for a reason, which is emailed to
 * the organization's owners. Use the organization's Suspend button to
 * stop everything at once.
 */
@Component({
  selector: 'app-organization-apps-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-t border-gray-200 pt-6">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Applications</h3>
          <p class="text-xs text-gray-500">
            Suspend one application (for example, an unpaid add-on). To stop everything, suspend the organization.
          </p>
        </div>
        <button
          type="button"
          class="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          [disabled]="loading()"
          (click)="load()"
        >
          Refresh
        </button>
      </div>

      @if (loading() && apps().length === 0) {
        <p class="text-sm text-gray-500">Loading applications…</p>
      } @else if (error()) {
        <p class="text-sm text-red-700" role="alert">{{ error() }}</p>
      } @else if (apps().length === 0) {
        <p class="text-sm text-gray-500">This organization has no applications yet.</p>
      } @else {
        <ul class="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          @for (app of apps(); track app.id) {
            <li class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
              <span class="min-w-0 flex-1 font-medium text-[#032D42]">{{ app.name }}</span>

              <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="statusClasses(app.status)">
                {{ statusLabel(app.status) }}
              </span>

              @if (app.status === 'active' && !organizationLevel(app.id)) {
                <button
                  type="button"
                  class="rounded-md border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  [disabled]="busyId() !== null"
                  (click)="change(app, 'suspend')"
                >
                  {{ busyId() === app.id ? 'Suspending…' : 'Suspend' }}
                </button>
              }
              @if (app.status === 'suspended') {
                <button
                  type="button"
                  class="rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  [disabled]="busyId() !== null"
                  (click)="change(app, 'resume')"
                >
                  {{ busyId() === app.id ? 'Resuming…' : 'Resume' }}
                </button>
              }

              @if (app.status === 'suspended' && app.reason) {
                <p class="w-full text-xs text-amber-800">Reason: {{ app.reason }}</p>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class OrganizationAppsPanelComponent {
  private readonly toast = inject(HotToastService);

  readonly organizationId = input<string | null>(null);

  protected readonly apps = signal<OrganizationApp[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const organizationId = this.organizationId();
      this.apps.set([]);
      if (organizationId) {
        void this.load();
      }
    });
  }

  protected async load(): Promise<void> {
    const organizationId = this.organizationId();
    if (!organizationId) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const snapshot = await getDocs(collection(firestore, 'organizations', organizationId, 'applications'));
      this.apps.set(
        snapshot.docs
          .map((d) => ({
            id: d.id,
            name: getApplicationById(d.id)?.name ?? d.id,
            status: String(d.get('status') ?? 'unknown'),
            reason: (d.get('statusReason') as string | null | undefined) ?? null,
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch {
      this.error.set('The applications could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async change(app: OrganizationApp, action: 'suspend' | 'resume'): Promise<void> {
    const organizationId = this.organizationId();
    if (!organizationId || this.busyId()) return;

    const reason = window.prompt(
      action === 'suspend'
        ? `Why suspend ${app.name}? The organization's owners will receive this reason by email.`
        : `Resume ${app.name}? Add an optional note for the owners.`,
      '',
    );
    if (reason === null) return;
    if (action === 'suspend' && !reason.trim()) {
      this.toast.error('A reason is required to suspend an application.');
      return;
    }

    this.busyId.set(app.id);
    try {
      const call = httpsCallable(firebaseFunctions, 'setOrganizationApplicationStatus');
      await call({ organizationId, applicationId: app.id, action, reason: reason.trim() });
      this.toast.success(action === 'suspend' ? `${app.name} suspended.` : `${app.name} resumed.`);
      await this.load();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'The change could not be saved.');
    } finally {
      this.busyId.set(null);
    }
  }

  protected organizationLevel(id: string): boolean {
    return ORGANIZATION_LEVEL.has(id);
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended':
        return 'Suspended';
      case 'deactivated':
        return 'Retired';
      case 'selected':
      case 'provisioning':
        return 'Setting up';
      case 'failed':
        return 'Setup failed';
      default:
        return status;
    }
  }

  protected statusClasses(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'suspended':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}

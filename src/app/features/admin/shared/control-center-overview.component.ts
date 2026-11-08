import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../core/services/firebase-config';
import { FeatureConfigService } from '../../../core/services/feature-config.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';

/** Answer from the getControlCenterSummary function; null = could not count. */
interface ControlCenterSummary {
  organizations: { active: number | null; suspended: number | null; onboarding: number | null };
  waiting: {
    partnerRequests: number | null;
    organizationSignUps: number | null;
    resourceSubmissions: number | null;
    openTickets: number | null;
  };
  events: { open: number | null; critical: number | null };
  generatedAt: string;
}

interface Tile {
  label: string;
  value: number | null;
  hint: string;
  link: string;
  icon: string;
  tone: 'ok' | 'warn' | 'bad' | 'neutral';
}

/**
 * Control Center -> Overview: what needs attention now. Every number
 * links to the page where you deal with it.
 */
@Component({
  selector: 'app-configuration-overview',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-[#032D42]">Overview</h2>
          <p class="mt-1 text-sm text-gray-500">What needs attention right now. Click a number to deal with it.</p>
        </div>
        <button mat-stroked-button type="button" [disabled]="loading()" (click)="refresh()">
          <mat-icon [class.animate-spin]="loading()">refresh</mat-icon>
          {{ loading() ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>

      @if (maintenance.enabled()) {
        <a
          routerLink="/admin/configuration/maintenance"
          class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 no-underline"
        >
          <mat-icon>build</mat-icon>
          <span><strong>Maintenance mode is on.</strong> Visitors cannot use Zebron. Turn it off in Maintenance.</span>
        </a>
      }

      @if (error()) {
        <p class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{{ error() }}</p>
      }

      @for (group of groups(); track group.title) {
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{{ group.title }}</h3>
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            @for (tile of group.tiles; track tile.label) {
              <a
                [routerLink]="tile.link"
                class="tile"
                [class.tile-warn]="tile.tone === 'warn'"
                [class.tile-bad]="tile.tone === 'bad'"
                [class.tile-ok]="tile.tone === 'ok'"
              >
                <span class="flex items-center justify-between gap-2">
                  <span class="text-xs font-medium text-gray-600">{{ tile.label }}</span>
                  <mat-icon class="!h-5 !w-5 !text-xl text-gray-400">{{ tile.icon }}</mat-icon>
                </span>
                <span class="mt-1 text-2xl font-bold tabular-nums text-[#032D42]">
                  {{ tile.value === null ? '–' : tile.value }}
                </span>
                <span class="text-xs text-gray-500">{{ tile.hint }}</span>
              </a>
            }
          </div>
        </div>
      }

      @if (switchedOff().length > 0) {
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Applications not fully on</h3>
          <ul class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            @for (app of switchedOff(); track app.key) {
              <li class="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <span class="font-medium text-[#032D42]">{{ app.name }}</span>
                <a
                  routerLink="/admin/configuration/applications"
                  class="rounded-full px-2 py-0.5 text-[11px] font-semibold no-underline"
                  [class]="app.availability === 'disabled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'"
                >
                  {{ app.availability === 'disabled' ? 'Off' : 'Maintenance' }}
                </a>
              </li>
            }
          </ul>
        </div>
      }

      @if (updatedAt()) {
        <p class="text-right text-xs text-gray-400">Updated {{ updatedAt() }}</p>
      }
    </section>
  `,
  styles: `
    .tile {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      background: #fff;
      padding: 0.75rem 1rem;
      text-decoration: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .tile:hover,
    .tile:focus-visible {
      border-color: #032d42;
      box-shadow: 0 1px 4px rgb(3 45 66 / 0.12);
    }
    .tile-warn {
      border-color: #fcd34d;
      background: #fffbeb;
    }
    .tile-bad {
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .tile-ok {
      background: #fff;
    }
  `,
})
export class ControlCenterOverviewComponent implements OnInit {
  private readonly features = inject(FeatureConfigService);
  protected readonly maintenance = inject(MaintenanceService);

  protected readonly summary = signal<ControlCenterSummary | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly updatedAt = signal('');

  /** Applications switched off or in maintenance on the kill switch. */
  protected readonly switchedOff = computed(() =>
    this.features
      .features()
      .filter((feature) => feature.availability !== 'enabled')
      .map((feature) => ({ key: feature.key, name: feature.name, availability: feature.availability })),
  );

  protected readonly groups = computed<{ title: string; tiles: Tile[] }[]>(() => {
    const summary = this.summary();
    const off = this.switchedOff();
    const waiting = summary?.waiting;
    const orgs = summary?.organizations;
    const events = summary?.events;
    const pending = (value: number | null | undefined): Tile['tone'] =>
      value === null || value === undefined ? 'neutral' : value > 0 ? 'warn' : 'ok';

    return [
      {
        title: 'Waiting for you',
        tiles: [
          {
            label: 'Partner requests',
            value: waiting?.partnerRequests ?? null,
            hint: 'Add, suspend or retire apps',
            link: '/admin/organizations/requests',
            icon: 'assignment',
            tone: pending(waiting?.partnerRequests),
          },
          {
            label: 'Organization sign-ups',
            value: waiting?.organizationSignUps ?? null,
            hint: 'Applying to join Zebron',
            link: '/admin/organizations/applications',
            icon: 'how_to_reg',
            tone: pending(waiting?.organizationSignUps),
          },
          {
            label: 'Resource submissions',
            value: waiting?.resourceSubmissions ?? null,
            hint: 'Sent in by the public',
            link: '/admin/submissions',
            icon: 'inbox',
            tone: pending(waiting?.resourceSubmissions),
          },
          {
            label: 'Open support tickets',
            value: waiting?.openTickets ?? null,
            hint: 'Open or in progress',
            link: '/admin/support',
            icon: 'support_agent',
            tone: pending(waiting?.openTickets),
          },
        ],
      },
      {
        title: 'Health',
        tiles: [
          {
            label: 'Critical events',
            value: events?.critical ?? null,
            hint: 'Not yet resolved',
            link: '/admin/configuration/operational-monitoring',
            icon: 'report',
            tone: events?.critical ? 'bad' : events?.critical === 0 ? 'ok' : 'neutral',
          },
          {
            label: 'Open events',
            value: events?.open ?? null,
            hint: 'All severities',
            link: '/admin/configuration/operational-monitoring',
            icon: 'monitor_heart',
            tone: pending(events?.open),
          },
          {
            label: 'Apps off or in maintenance',
            value: this.features.loaded() ? off.length : null,
            hint: 'Kill switch',
            link: '/admin/configuration/applications',
            icon: 'toggle_off',
            tone: !this.features.loaded() ? 'neutral' : off.length > 0 ? 'warn' : 'ok',
          },
          {
            label: 'Security',
            value: null,
            hint: 'Run the live checks',
            link: '/admin/configuration/security',
            icon: 'shield',
            tone: 'neutral',
          },
        ],
      },
      {
        title: 'Organizations',
        tiles: [
          {
            label: 'Active',
            value: orgs?.active ?? null,
            hint: 'Using Zebron',
            link: '/admin/organizations',
            icon: 'corporate_fare',
            tone: 'neutral',
          },
          {
            label: 'Suspended',
            value: orgs?.suspended ?? null,
            hint: 'Members are locked out',
            link: '/admin/organizations',
            icon: 'pause_circle',
            tone: orgs?.suspended ? 'warn' : 'neutral',
          },
          {
            label: 'Setting up',
            value: orgs?.onboarding ?? null,
            hint: 'Pending or onboarding',
            link: '/admin/organizations',
            icon: 'hourglass_top',
            tone: 'neutral',
          },
        ],
      },
    ];
  });

  ngOnInit(): void {
    void this.refresh();
  }

  protected async refresh(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const [result] = await Promise.all([
        httpsCallable<void, ControlCenterSummary>(firebaseFunctions, 'getControlCenterSummary')(),
        this.features.load().catch(() => undefined),
      ]);
      this.summary.set(result.data);
      this.updatedAt.set(new Date(result.data.generatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
    } catch {
      this.error.set('The live numbers could not be loaded. If you just updated Zebron, deploy the getControlCenterSummary function.');
    } finally {
      this.loading.set(false);
    }
  }
}

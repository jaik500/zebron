import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { multiFactor } from 'firebase/auth';

import { AuthService } from '../../../core/services/auth.service';
import { AuditService } from '../../../core/services/audit.service';
import { APP_CHECK_SITE_KEY, firestore } from '../../../core/services/firebase-config';

type CheckStatus = 'healthy' | 'attention' | 'critical' | 'unknown';

interface SecurityCheck {
  key: string;
  name: string;
  status: CheckStatus;
  value: string;
  help?: string;
  icon: string;
  /** Knowledge Center article that explains the fix. */
  article?: { id: string; title: string };
}

/** Imported guide articles have the ID guide-<slug>. */
const FIX_ARTICLE = { id: 'guide-security-checks', title: 'Fixing Security tab warnings' };
const RUNBOOK_ARTICLE = { id: 'guide-dev-scaling-runbook', title: 'Scaling, cost and security runbook' };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Control Center -> Security. Every check is measured when the tab
 * opens (or on Re-check); nothing is assumed healthy.
 */
@Component({
  selector: 'app-configuration-security',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-[#032D42]">Security</h2>
          <p class="mt-1 text-sm text-gray-500">Live checks of your account, administrator access, the audit trail and app protection.</p>
        </div>
        <button mat-stroked-button type="button" [disabled]="loading()" (click)="run()">
          <mat-icon [class.animate-spin]="loading()">refresh</mat-icon>
          {{ loading() ? 'Checking…' : 'Re-check' }}
        </button>
      </div>

      @if (checks().length > 0) {
        <p class="rounded-xl px-4 py-3 text-sm font-medium" [class]="summaryClasses()">
          {{ summary() }}
        </p>
      }

      <ul class="grid gap-3 sm:grid-cols-2">
        @for (check of checks(); track check.key) {
          <li class="rounded-xl border border-gray-200 bg-white p-4">
            <div class="flex items-start gap-3">
              <mat-icon class="shrink-0" [class]="iconColor(check.status)">{{ check.icon }}</mat-icon>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold text-gray-900">{{ check.name }}</h3>
                  <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [class]="pillClasses(check.status)">
                    {{ statusLabel(check.status) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-700">{{ check.value }}</p>
                @if (check.status !== 'healthy') {
                  @if (check.help) {
                    <p class="mt-1 text-xs text-gray-500">{{ check.help }}</p>
                  }
                  <a
                    class="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#007979] hover:underline"
                    [routerLink]="['/admin/knowledge', (check.article ?? fixArticle).id]"
                  >
                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">menu_book</mat-icon>
                    How to fix: {{ (check.article ?? fixArticle).title }}
                  </a>
                }
              </div>
            </div>
          </li>
        }
      </ul>

      @if (checkedAt()) {
        <p class="text-right text-xs text-gray-400">Checked {{ checkedAt() }}</p>
      }
    </section>
  `,
})
export class SecurityChecksComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);

  protected readonly fixArticle = FIX_ARTICLE;
  protected readonly checks = signal<SecurityCheck[]>([]);
  protected readonly loading = signal(false);
  protected readonly checkedAt = signal('');

  protected readonly summary = computed(() => {
    const checks = this.checks();
    const critical = checks.filter((check) => check.status === 'critical').length;
    const attention = checks.filter((check) => check.status === 'attention').length;
    if (critical > 0) return `${critical} problem${critical === 1 ? '' : 's'} need fixing now.`;
    if (attention > 0) return `${attention} item${attention === 1 ? '' : 's'} to look at.`;
    return 'All checks passed.';
  });

  protected readonly summaryClasses = computed(() => {
    const statuses = this.checks().map((check) => check.status);
    if (statuses.includes('critical')) return 'bg-red-50 text-red-800';
    if (statuses.includes('attention')) return 'bg-amber-50 text-amber-900';
    return 'bg-green-50 text-green-800';
  });

  ngOnInit(): void {
    void this.run();
  }

  protected async run(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const results = await Promise.all([
        this.signInCheck(),
        this.twoStepCheck(),
        this.adminAccessCheck(),
        this.auditChecks(),
        this.securityEventsCheck(),
        Promise.resolve(this.appCheckCheck()),
      ]);
      this.checks.set(results.flat());
      this.checkedAt.set(new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }));
    } finally {
      this.loading.set(false);
    }
  }

  private async signInCheck(): Promise<SecurityCheck> {
    const user = this.auth.firebaseUser();
    if (!user) {
      return { key: 'sign-in', name: 'Your sign-in', status: 'critical', value: 'Not signed in.', icon: 'lock' };
    }
    return {
      key: 'sign-in',
      name: 'Your sign-in',
      status: user.emailVerified ? 'healthy' : 'attention',
      value: user.emailVerified ? `Signed in as ${user.email ?? 'you'}; email verified.` : `Signed in as ${user.email ?? 'you'}; email not verified.`,
      help: 'Zebron has no verify-email screen yet; the article explains how a developer confirms the address.',
      icon: 'lock',
    };
  }

  private async twoStepCheck(): Promise<SecurityCheck> {
    const user = this.auth.firebaseUser();
    const factors = user ? multiFactor(user).enrolledFactors.length : 0;
    // Covers Google or Microsoft sign-in if it is added later.
    const provider = user?.providerData[0]?.providerId ?? '';
    const viaGoogle = provider === 'google.com' || provider === 'microsoft.com';
    return {
      key: 'two-step',
      name: 'Two-step verification',
      status: factors > 0 || viaGoogle ? 'healthy' : 'attention',
      value:
        factors > 0
          ? `On for this account (${factors} method${factors === 1 ? '' : 's'}).`
          : viaGoogle
            ? 'You sign in with Google or Microsoft; two-step verification is handled there.'
            : 'Off for this account.',
      help: 'Zebron has no two-step setup screen yet, so this stays here until one is added. Use a long, unique password meanwhile.',
      icon: 'phonelink_lock',
    };
  }

  private async adminAccessCheck(): Promise<SecurityCheck> {
    const user = this.auth.firebaseUser();
    if (!user) {
      return { key: 'admin', name: 'Administrator access', status: 'critical', value: 'Not signed in.', icon: 'admin_panel_settings' };
    }
    try {
      const token = await user.getIdTokenResult();
      const tokenAdmin = token.claims['zpa'] === true;
      const appAdmin = this.auth.isAdmin;
      if (tokenAdmin && appAdmin) {
        return { key: 'admin', name: 'Administrator access', status: 'healthy', value: 'Confirmed by the app and by the database sign-in token.', icon: 'admin_panel_settings' };
      }
      return {
        key: 'admin',
        name: 'Administrator access',
        status: 'attention',
        value: appAdmin
          ? 'The app sees you as an admin, but your sign-in token does not yet. Some admin saves may be refused.'
          : 'Your account is not an administrator.',
        help: 'Sign out and back in to refresh your token. If it stays, check that Admin → Users shows platform-admin for your account.',
        icon: 'admin_panel_settings',
      };
    } catch {
      return { key: 'admin', name: 'Administrator access', status: 'unknown', value: 'Could not read your sign-in token.', icon: 'admin_panel_settings' };
    }
  }

  private async auditChecks(): Promise<SecurityCheck[]> {
    try {
      const logs = await this.audit.getRecentLogs(100);
      const latest = logs[0]?.createdAt?.toDate() ?? null;
      const ageDays = latest ? (Date.now() - latest.getTime()) / DAY_MS : null;
      const trail: SecurityCheck = {
        key: 'audit',
        name: 'Audit trail',
        status: latest === null ? 'attention' : ageDays! > 14 ? 'attention' : 'healthy',
        value:
          latest === null
            ? 'Readable, but no records yet.'
            : `Recording. Latest entry ${latest.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.`,
        help: 'Admin changes should appear here. If nothing has been recorded for two weeks, check that audit writes are not failing.',
        icon: 'history',
      };

      const recent = logs.filter((log) => {
        const at = log.createdAt?.toDate();
        return at && Date.now() - at.getTime() < 7 * DAY_MS;
      });
      const failed = recent.filter((log) => log.outcome === 'denied' || log.outcome === 'failure');
      const denied = failed.filter((log) => log.outcome === 'denied').length;
      const actions: SecurityCheck = {
        key: 'failed-actions',
        name: 'Refused or failed actions (7 days)',
        status: denied >= 5 ? 'critical' : failed.length > 0 ? 'attention' : 'healthy',
        value:
          failed.length === 0
            ? 'None in the last 7 days.'
            : `${failed.length} in the last 7 days (${denied} refused for lack of permission).`,
        help: 'Open Monitoring → Audit Trail and look at the red and orange entries. Many refusals from one account can mean someone is probing.',
        icon: 'gpp_maybe',
      };
      return [trail, actions];
    } catch {
      return [
        {
          key: 'audit',
          name: 'Audit trail',
          status: 'critical',
          value: 'The audit trail could not be read.',
          help: 'Check the database rules for auditLogs and that you are signed in as an admin.',
          icon: 'history',
        },
      ];
    }
  }

  private async securityEventsCheck(): Promise<SecurityCheck> {
    try {
      const snapshot = await getCountFromServer(
        query(collection(firestore, 'operationalEvents'), where('type', '==', 'security'), where('status', '==', 'open')),
      );
      const open = snapshot.data().count;
      return {
        key: 'security-events',
        name: 'Open security events',
        status: open > 0 ? 'critical' : 'healthy',
        value: open > 0 ? `${open} open security event${open === 1 ? '' : 's'}.` : 'No open security events.',
        help: 'Review them in Monitoring → Operational Events and acknowledge or resolve each one.',
        icon: 'security',
      };
    } catch {
      return {
        key: 'security-events',
        name: 'Open security events',
        status: 'unknown',
        value: 'Operational events could not be read.',
        help: 'Deploy the latest firestore.rules (operationalEvents).',
        icon: 'security',
      };
    }
  }

  private appCheckCheck(): SecurityCheck {
    const configured = APP_CHECK_SITE_KEY.trim().length > 0;
    return {
      key: 'app-check',
      name: 'App Check (bot protection)',
      status: configured ? 'healthy' : 'attention',
      value: configured ? 'Configured in this build.' : 'Not configured. Scripts that copy the app’s keys can call the database directly.',
      help: 'Create a reCAPTCHA Enterprise key, register it in Firebase App Check and set APP_CHECK_SITE_KEY in firebase-config.ts.',
      article: RUNBOOK_ARTICLE,
      icon: 'verified_user',
    };
  }

  protected statusLabel(status: CheckStatus): string {
    return { healthy: 'OK', attention: 'Look at this', critical: 'Fix now', unknown: 'Unknown' }[status];
  }

  protected pillClasses(status: CheckStatus): string {
    return {
      healthy: 'bg-green-100 text-green-700',
      attention: 'bg-amber-100 text-amber-800',
      critical: 'bg-red-100 text-red-700',
      unknown: 'bg-gray-100 text-gray-600',
    }[status];
  }

  protected iconColor(status: CheckStatus): string {
    return {
      healthy: 'text-green-600',
      attention: 'text-amber-600',
      critical: 'text-red-600',
      unknown: 'text-gray-400',
    }[status];
  }
}

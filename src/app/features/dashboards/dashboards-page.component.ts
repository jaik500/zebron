import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { PageTitleService } from '../../core/services/page-title.service';
import { PartnerAccessService } from '../../core/services/partner-access.service';
import { DashboardBuilderComponent } from '../../shared/dashboards/dashboard-builder.component';
import { DashboardGridComponent } from '../../shared/dashboards/dashboard-grid.component';
import { DashboardStatsService, StatsAppId } from '../../shared/dashboards/dashboard-stats.service';
import { DashboardDataSourceRegistry } from '../../shared/dashboards/data-source.registry';
import { DASHBOARD_LIMITS, Dashboard, DashboardTemplate, canEditDashboard } from '../../shared/dashboards/dashboard.model';
import { DashboardService } from '../../shared/dashboards/dashboard.service';
import { OrganizationContextStore } from '../organizations/stores/organization-context.store';
import { injectDashboardContext } from './dashboard-context';
import { setUpDashboards } from './dashboard-setup';
import { DASHBOARD_TEMPLATES } from './dashboard-templates';

/**
 * An organization's dashboards (Shared Dashboard Engine, milestone 1).
 *
 * - Everyone: pick a dashboard they may see; widgets they can't use are hidden.
 * - Managers and above: create from a template or blank, edit, delete.
 * - Admins and owners: choose the default dashboard.
 *
 * Route: /partner/org/:organizationId/dashboards (?d=<dashboard id>)
 */
@Component({
  selector: 'app-dashboards-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, MatMenuModule, TranslatePipe, DashboardGridComponent, DashboardBuilderComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-7xl min-w-0 flex-wrap items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <a
            [routerLink]="['/partner/org', organizationId, 'dashboard']"
            class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white md:inline-flex"
            [attr.aria-label]="'Back to the partner dashboard' | t"
            [title]="'Back to the partner dashboard' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="text-lg font-semibold leading-tight">{{ 'Dashboards' | t }}</h1>
            @if (selected(); as dashboard) {
              @if (dashboard.description) {
                <p class="break-words text-xs text-white/80 [overflow-wrap:anywhere]">{{ dashboard.description }}</p>
              }
            }
          </div>

          @if (dashboards().length > 1 && mode() === 'view') {
            <label class="sr-only" for="dashboard-picker">{{ 'Dashboard' | t }}</label>
            <select
              id="dashboard-picker"
              class="h-9 w-full min-w-0 max-w-full truncate rounded-lg border-0 bg-white px-3 text-sm text-slate-900 sm:w-auto sm:max-w-xs"
              (change)="select(value($event))"
            >
              @for (dashboard of dashboards(); track dashboard.id) {
                <option [value]="dashboard.id" [selected]="dashboard.id === selected()?.id">
                  {{ dashboard.name }}{{ dashboard.isDefault ? ' ★' : '' }}
                </option>
              }
            </select>
          }

          @if (mode() === 'view') {
            @if (selected(); as dashboard) {
              @if (canEdit(dashboard)) {
                <button type="button" class="head-btn" (click)="mode.set('edit')">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">edit</mat-icon>{{ 'Edit' | t }}
                </button>
              }
            }
            @if (canManage()) {
              <button type="button" class="head-btn" (click)="openCreate()">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">add</mat-icon>
                <span class="hidden sm:inline">{{ 'New dashboard' | t }}</span>
                <span class="sm:hidden">{{ 'New' | t }}</span>
              </button>
            }
            @if (selected() && (canSetDefault() || canRefresh() || canEdit(selected()!))) {
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15"
                [matMenuTriggerFor]="pageMenu"
                [attr.aria-label]="'More' | t"
                [title]="'More' | t"
              >
                <mat-icon aria-hidden="true">more_vert</mat-icon>
              </button>
            }
          }
        </div>
      </header>

      <mat-menu #pageMenu="matMenu" xPosition="before">
        @if (selected(); as dashboard) {
          @if (canSetDefault() && !dashboard.isDefault) {
            <button mat-menu-item type="button" (click)="makeDefault(dashboard)">
              <mat-icon>star</mat-icon><span>{{ 'Make this the default' | t }}</span>
            </button>
          }
          @if (canRefresh()) {
            <button mat-menu-item type="button" [disabled]="refreshing()" (click)="refreshFigures('learning')">
              <mat-icon>refresh</mat-icon><span>{{ 'Refresh learning figures' | t }}</span>
            </button>
          }
          @if (canRefreshBusiness()) {
            <button mat-menu-item type="button" [disabled]="refreshing()" (click)="refreshFigures('business')">
              <mat-icon>refresh</mat-icon><span>{{ 'Refresh business figures' | t }}</span>
            </button>
          }
          @if (canEdit(dashboard)) {
            <button mat-menu-item type="button" class="!text-rose-700" (click)="remove(dashboard)">
              <mat-icon class="!text-rose-700">delete</mat-icon><span>{{ 'Delete dashboard' | t }}</span>
            </button>
          }
        }
      </mat-menu>

      <div class="mx-auto max-w-7xl min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        @if (error()) {
          <p class="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{{ error() | t }}</p>
        }

        @if (loading()) {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12" aria-hidden="true">
            <div class="h-40 animate-pulse rounded-2xl bg-slate-200/70 md:col-span-3 lg:col-span-3"></div>
            <div class="h-40 animate-pulse rounded-2xl bg-slate-200/70 md:col-span-3 lg:col-span-3"></div>
            <div class="h-40 animate-pulse rounded-2xl bg-slate-200/70 md:col-span-6 lg:col-span-6"></div>
          </div>
        } @else if (selected(); as dashboard) {
          @if (mode() === 'edit') {
            <app-dashboard-builder
              [dashboard]="dashboard"
              [context]="context()"
              (saved)="afterSave()"
              (cancelled)="mode.set('view')"
              (reloadRequested)="reloadSelected()"
            />
          } @else {
            <div class="mb-4 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 class="min-w-0 break-words text-xl font-bold text-slate-900 [overflow-wrap:anywhere]">{{ dashboard.name }}</h2>
              @if (dashboard.isDefault) {
                <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{{ 'Default' | t }}</span>
                @if (dashboard.appId === 'organization') {
                  <span class="text-xs text-slate-500">{{ 'Shown on the partner dashboard' | t }}</span>
                }
              }
            </div>
            <app-dashboard-grid [widgets]="dashboard.widgets" [context]="context()" />
          }
        } @else {
          <!-- No dashboards yet -->
          <section class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center sm:p-8">
            <mat-icon class="!h-10 !w-10 !text-[40px] !leading-none text-[#007979]" aria-hidden="true">dashboard_customize</mat-icon>
            <h2 class="mt-2 text-lg font-semibold text-slate-900">{{ 'No dashboards yet' | t }}</h2>
            @if (canManage()) {
              <p class="mx-auto mt-1 max-w-md text-sm text-slate-600">{{ 'Start from a template and change it to suit your organization.' | t }}</p>
              <div class="mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
                @for (template of templates(); track template.id) {
                  <button
                    type="button"
                    class="flex min-w-0 flex-col gap-1 rounded-xl border border-slate-200 p-4 transition hover:border-[#007979] hover:bg-teal-50/40 disabled:opacity-50"
                    [disabled]="creating()"
                    (click)="createFrom(template, template.name)"
                  >
                    <span class="text-sm font-semibold text-slate-900">{{ template.name | t }}</span>
                    <span class="text-xs text-slate-500">{{ template.description | t }}</span>
                  </button>
                }
              </div>
            } @else {
              <p class="mx-auto mt-1 max-w-md text-sm text-slate-600">{{ 'Your organization\\u0027s managers can create dashboards for everyone.' | t }}</p>
            }
          </section>
        }
      </div>
    </main>

    <!-- ================= NEW DASHBOARD ================= -->
    @if (creatingForm(); as form) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="creatingForm.set(null)">
        <section
          class="flex h-[100dvh] w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-dashboard-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <h2 id="new-dashboard-title" class="text-lg font-semibold text-white">{{ 'New dashboard' | t }}</h2>
            <button type="button" (click)="creatingForm.set(null)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>
          <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <label class="flex min-w-0 flex-col gap-1 text-sm">
              <span class="font-medium text-slate-700">{{ 'Name' | t }}</span>
              <input
                class="h-10 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-teal-100"
                [maxLength]="limits.nameLength"
                [value]="form.name"
                (input)="creatingForm.set({ name: value($event), templateId: form.templateId })"
              />
            </label>
            <fieldset class="flex min-w-0 flex-col gap-2">
              <legend class="mb-1 text-sm font-medium text-slate-700">{{ 'Start from' | t }}</legend>
              @for (choice of templateChoices(); track choice.id) {
                <label
                  class="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3"
                  [ngClass]="form.templateId === choice.id ? 'border-[#007979] bg-teal-50' : 'border-slate-200'"
                >
                  <input
                    type="radio"
                    name="dashboard-template"
                    class="mt-1 h-4 w-4 accent-[#007979]"
                    [checked]="form.templateId === choice.id"
                    (change)="creatingForm.set({ name: form.name || choice.name, templateId: choice.id })"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-slate-900">{{ choice.name | t }}</span>
                    <span class="block text-xs text-slate-500">{{ choice.description | t }}</span>
                  </span>
                </label>
              }
            </fieldset>
          </div>
          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button type="button" class="h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100" (click)="creatingForm.set(null)">{{ 'Cancel' | t }}</button>
            <button
              type="button"
              class="inline-flex h-9 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
              [disabled]="creating() || !form.name.trim()"
              (click)="createFromForm()"
            >
              {{ (creating() ? 'Creating…' : 'Create') | t }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .head-btn {
        display: inline-flex;
        height: 2.25rem;
        align-items: center;
        gap: 0.375rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.4);
        padding: 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #fff;
      }
      .head-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }
    `,
  ],
})
export class DashboardsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly access = inject(PartnerAccessService);
  private readonly organizationStore = inject(OrganizationContextStore);
  private readonly service = inject(DashboardService);
  private readonly stats = inject(DashboardStatsService);
  private readonly sources = inject(DashboardDataSourceRegistry);
  private readonly pageTitle = inject(PageTitleService);
  private readonly i18n = inject(I18nService);
  private readonly logger = inject(LoggerService);

  private readonly builder = viewChild(DashboardBuilderComponent);

  protected readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  protected readonly limits = DASHBOARD_LIMITS;
  /** Templates for apps the organization has, and the viewer may use. */
  protected readonly templates = computed(() =>
    DASHBOARD_TEMPLATES.filter(
      (template) =>
        (!template.requiresApp || this.organizationStore.hasActiveApplication(template.requiresApp)) &&
        (!template.permission || this.access.can(template.permission)),
    ),
  );
  protected readonly templateChoices = computed<{ id: string; name: string; description: string }[]>(() => [
    ...this.templates().map((template) => ({ id: template.id, name: template.name, description: template.description })),
    { id: '', name: 'Blank', description: 'Start empty and add widgets yourself.' },
  ]);

  protected readonly dashboards = signal<Dashboard[]>([]);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly mode = signal<'view' | 'edit'>('view');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly creating = signal(false);
  protected readonly creatingForm = signal<{ name: string; templateId: string } | null>(null);
  protected readonly refreshing = signal(false);
  /** Bumped to make every widget reload (after a refresh or a save). */
  private readonly revision = signal(0);

  protected readonly selected = computed<Dashboard | null>(
    () => this.dashboards().find((dashboard) => dashboard.id === this.selectedId()) ?? this.dashboards()[0] ?? null,
  );

  protected readonly canManage = computed(() => this.access.can('dashboards.manage'));
  protected readonly canSetDefault = computed(() => this.access.isAdmin());
  protected readonly canRefresh = computed(() => this.access.can('learning.insights') && this.organizationStore.hasActiveApplication('courses'));
  protected readonly canRefreshBusiness = computed(
    () => this.access.can('business.manage') && this.organizationStore.hasActiveApplication('business-operations'),
  );

  protected readonly context = injectDashboardContext(
    () => this.organizationId,
    () => this.selected()?.appId ?? 'organization',
    () => this.revision(),
  );

  constructor() {
    setUpDashboards();
  }

  async ngOnInit(): Promise<void> {
    this.pageTitle.setDocumentTitle(this.i18n.t('Dashboards'));
    try {
      await this.organizationStore.loadOrganizationContext(this.organizationId);
      await this.load(this.route.snapshot.queryParamMap.get('d'));
    } catch (problem) {
      this.logger.error('DashboardsPage', 'Dashboards could not be loaded.', problem);
      this.error.set('Dashboards could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  /** For the leave-page guard. */
  canLeave(): boolean {
    const builder = this.builder();
    if (!builder?.hasUnsavedChanges()) return true;
    return typeof window === 'undefined' || window.confirm(this.i18n.t('Leave without saving your changes?'));
  }

  protected canEdit(dashboard: Dashboard): boolean {
    return canEditDashboard(dashboard, this.access.role(), this.access.isPlatformAdmin());
  }

  protected select(id: string): void {
    this.selectedId.set(id);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { d: id }, replaceUrl: true });
  }

  protected openCreate(): void {
    const first = DASHBOARD_TEMPLATES[0];
    this.creatingForm.set({ name: first.name, templateId: first.id });
  }

  protected async createFromForm(): Promise<void> {
    const form = this.creatingForm();
    if (!form) return;
    const template = DASHBOARD_TEMPLATES.find((item) => item.id === form.templateId) ?? null;
    await this.createFrom(template, form.name);
    this.creatingForm.set(null);
  }

  protected async createFrom(template: DashboardTemplate | null, name: string): Promise<void> {
    const userId = this.auth.firebaseUser()?.uid;
    if (!userId || !name.trim()) return;

    this.creating.set(true);
    this.error.set('');
    try {
      const id = await this.service.create(this.organizationId, { name, appId: template?.appId ?? 'organization', template }, userId);
      await this.load(id);
      // A blank dashboard opens in the builder.
      this.mode.set(template ? 'view' : 'edit');
    } catch (problem) {
      this.logger.error('DashboardsPage', 'Dashboard could not be created.', problem);
      this.error.set('The dashboard could not be created. Try again.');
    } finally {
      this.creating.set(false);
    }
  }

  protected async afterSave(): Promise<void> {
    await this.load(this.selected()?.id ?? null);
    this.revision.update((value) => value + 1);
    this.mode.set('view');
  }

  /** Someone else saved: load their version and keep editing from it. */
  protected async reloadSelected(): Promise<void> {
    await this.load(this.selected()?.id ?? null);
  }

  protected async makeDefault(dashboard: Dashboard): Promise<void> {
    const userId = this.auth.firebaseUser()?.uid;
    if (!userId) return;
    try {
      await this.service.setDefault(dashboard, this.dashboards(), userId);
      await this.load(dashboard.id);
    } catch {
      this.error.set('The default could not be changed. Try again.');
    }
  }

  protected async remove(dashboard: Dashboard): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(this.i18n.t('Delete the dashboard "{0}"?', [dashboard.name]))) return;
    try {
      await this.service.remove(this.organizationId, dashboard.id);
      await this.load(null);
    } catch {
      this.error.set('The dashboard could not be deleted. Try again.');
    }
  }

  protected async refreshFigures(appId: StatsAppId): Promise<void> {
    this.refreshing.set(true);
    try {
      await this.stats.refresh(this.organizationId, appId);
      this.sources.clear();
      this.revision.update((value) => value + 1);
    } catch {
      this.error.set('The figures could not be refreshed. Try again later.');
    } finally {
      this.refreshing.set(false);
    }
  }

  private async load(selectId: string | null): Promise<void> {
    const list = await this.service.list(this.organizationId, this.access.role(), this.access.isPlatformAdmin());
    this.dashboards.set(list);
    const chosen = list.find((dashboard) => dashboard.id === selectId) ?? list.find((dashboard) => dashboard.isDefault) ?? list[0] ?? null;
    this.selectedId.set(chosen?.id ?? null);
    if (chosen && chosen.id !== this.route.snapshot.queryParamMap.get('d')) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { d: chosen.id }, replaceUrl: true });
    }
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}

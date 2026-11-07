import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { PartnerRole } from '../../core/services/partner-access.service';
import { DashboardContext, DashboardDataSourceRegistry } from './data-source.registry';
import { WIDGET_SPAN } from './dashboard-grid.component';
import {
  DASHBOARD_LIMITS,
  Dashboard,
  DashboardWidget,
  MAX_WIDGETS,
  WIDGET_SIZES,
  WidgetSize,
  dashboardProblems,
  newWidgetId,
  roleRank,
} from './dashboard.model';
import { DashboardConflictError, DashboardService } from './dashboard.service';
import { WidgetCardComponent } from './widget-card.component';
import { DashboardWidgetRegistry, WidgetDefinition, WidgetSetting } from './widget.registry';

const ROLE_LABELS: { role: PartnerRole; label: string }[] = [
  { role: 'org_member', label: 'Members and above' },
  { role: 'org_staff', label: 'Staff and above' },
  { role: 'org_manager', label: 'Managers and above' },
  { role: 'org_admin', label: 'Admins and owners' },
  { role: 'org_owner', label: 'Owners only' },
];

/** The settings panel's working copy. */
interface SettingsForm {
  widgetId: string;
  title: string;
  size: WidgetSize;
  config: Record<string, unknown>;
}

/**
 * Edit a dashboard: reorder widgets by dragging (or the move buttons, for
 * keyboards and screen readers), change sizes, edit settings, add and
 * remove widgets, and save the whole dashboard in one write.
 *
 *   <app-dashboard-builder [dashboard]="dashboard" [context]="context" (saved)="…" (cancelled)="…" />
 *
 * Unsaved changes: `hasUnsavedChanges()` for a route guard, plus the
 * browser's own "leave this page?" prompt.
 */
@Component({
  selector: 'app-dashboard-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, MatIconModule, MatMenuModule, TranslatePipe, WidgetCardComponent],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  template: `
    <section class="flex min-w-0 flex-col gap-4">
      <!-- Toolbar -->
      <div
        class="sticky top-16 z-20 flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"
      >
        <span class="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <mat-icon class="!h-5 !w-5 !text-xl !leading-none text-[#007979]" aria-hidden="true">edit</mat-icon>
          {{ 'Editing' | t }}
        </span>
        @if (dirty()) {
          <span class="text-xs font-medium text-amber-700">
            <span class="hidden sm:inline">{{ 'Unsaved changes' | t }}</span>
            <span class="sm:hidden" [attr.aria-label]="'Unsaved changes' | t">●</span>
          </span>
        }
        <span class="flex-1"></span>
        <button
          type="button"
          class="tool-btn"
          [disabled]="full()"
          [title]="full() ? ('A dashboard can hold up to {0} widgets.' | t: [maxWidgets]) : ''"
          [attr.aria-label]="'Add widget' | t"
          (click)="adding.set(true)"
        >
          <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">add</mat-icon>
          <span class="hidden sm:inline">{{ 'Add widget' | t }}</span>
        </button>
        <button type="button" class="tool-btn !border-transparent" [disabled]="saving()" (click)="cancel()">{{ 'Cancel' | t }}</button>
        <button type="button" class="tool-btn tool-btn--primary" [disabled]="saving() || !dirty()" (click)="save()">
          {{ (saving() ? 'Saving…' : 'Save') | t }}
        </button>
      </div>

      @if (error()) {
        <div class="flex min-w-0 flex-wrap items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] !leading-none" aria-hidden="true">error</mat-icon>
          <span class="min-w-0 flex-1 break-words">{{ error() | t }}</span>
          @if (conflict()) {
            <button type="button" class="font-semibold underline" (click)="reloadRequested.emit()">{{ 'Reload' | t }}</button>
          }
        </div>
      }

      <!-- Details -->
      <div class="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label class="flex min-w-0 flex-col gap-1 text-sm">
          <span class="font-medium text-slate-700">{{ 'Name' | t }}</span>
          <input
            class="field"
            [maxLength]="limits.nameLength"
            [value]="draft().name"
            (input)="patch({ name: value($event) })"
          />
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-sm">
          <span class="font-medium text-slate-700">{{ 'Description (optional)' | t }}</span>
          <input
            class="field"
            [maxLength]="limits.descriptionLength"
            [value]="draft().description"
            (input)="patch({ description: value($event) })"
          />
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-sm">
          <span class="font-medium text-slate-700">{{ 'Who can see it' | t }}</span>
          <select class="field" (change)="setViewRole(value($event))">
            @for (option of roleOptions; track option.role) {
              <option [value]="option.role" [selected]="option.role === draft().viewMinRole">{{ option.label | t }}</option>
            }
          </select>
        </label>
        <label class="flex min-w-0 flex-col gap-1 text-sm">
          <span class="font-medium text-slate-700">{{ 'Who can edit it' | t }}</span>
          <select class="field" (change)="setEditRole(value($event))">
            @for (option of editRoleOptions(); track option.role) {
              <option [value]="option.role" [selected]="option.role === draft().editMinRole">{{ option.label | t }}</option>
            }
          </select>
        </label>
        <p class="text-xs text-slate-500 md:col-span-2">
          {{ 'Sharing shares the layout only. Each widget shows people just what they can already see.' | t }}
          {{ '{0} of {1} widgets.' | t: [draft().widgets.length, maxWidgets] }}
        </p>
      </div>

      <!-- Widgets: drag to reorder -->
      <div
        cdkDropList
        cdkDropListOrientation="mixed"
        (cdkDropListDropped)="drop($event)"
        class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12"
        [attr.aria-label]="'Dashboard widgets' | t"
      >
        @for (widget of draft().widgets; track widget.id; let index = $index; let first = $first; let last = $last) {
          <div cdkDrag [cdkDragData]="widget" [class]="span(widget.size)">
            <app-widget-card class="block h-full" [widget]="widget" [context]="context()">
              <div cardActions class="-mr-2 flex shrink-0 items-center">
                <button type="button" cdkDragHandle class="icon-btn cursor-grab" [attr.aria-label]="'Drag to move' | t" [title]="'Drag to move' | t">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none">drag_indicator</mat-icon>
                </button>
                <button type="button" class="icon-btn" [disabled]="first" (click)="move(index, -1)" [attr.aria-label]="'Move earlier' | t" [title]="'Move earlier' | t">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none">arrow_upward</mat-icon>
                </button>
                <button type="button" class="icon-btn" [disabled]="last" (click)="move(index, 1)" [attr.aria-label]="'Move later' | t" [title]="'Move later' | t">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none">arrow_downward</mat-icon>
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  [matMenuTriggerFor]="moreMenu"
                  [matMenuTriggerData]="{ widget: widget }"
                  [attr.aria-label]="'Widget options' | t"
                  [title]="'Widget options' | t"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none">more_vert</mat-icon>
                </button>
              </div>
            </app-widget-card>
            <div *cdkDragPlaceholder class="min-h-40 rounded-2xl border-2 border-dashed border-[#007979]/40 bg-teal-50/40" [class]="span(widget.size)"></div>
          </div>
        } @empty {
          <div class="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] !leading-none text-slate-400" aria-hidden="true">dashboard_customize</mat-icon>
            <p class="mt-2 text-sm text-slate-600">{{ 'This dashboard is empty.' | t }}</p>
            <button type="button" class="tool-btn tool-btn--primary mt-3" (click)="adding.set(true)">{{ 'Add your first widget' | t }}</button>
          </div>
        }
      </div>
    </section>

    <mat-menu #moreMenu="matMenu" xPosition="before">
      <ng-template matMenuContent let-widget="widget">
        <button mat-menu-item type="button" (click)="openSettings(widget)">
          <mat-icon>tune</mat-icon><span>{{ 'Settings' | t }}</span>
        </button>
        @for (size of sizesFor(widget); track size) {
          <button mat-menu-item type="button" [disabled]="size === widget.size" (click)="resize(widget, size)">
            <mat-icon>{{ size === widget.size ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
            <span>{{ sizes[size].label | t }}</span>
          </button>
        }
        <button mat-menu-item type="button" class="!text-rose-700" (click)="remove(widget)">
          <mat-icon class="!text-rose-700">delete</mat-icon><span>{{ 'Remove' | t }}</span>
        </button>
      </ng-template>
    </mat-menu>

    <!-- ================= ADD WIDGET ================= -->
    @if (adding()) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="adding.set(false)">
        <section
          class="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-widget-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <h2 id="add-widget-title" class="text-lg font-semibold text-white">{{ 'Add a widget' | t }}</h2>
            <button type="button" (click)="adding.set(false)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>
          <ul class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
            @for (definition of available(); track definition.type) {
              <li class="min-w-0">
                <button
                  type="button"
                  class="flex h-full w-full min-w-0 items-start gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-[#007979] hover:bg-teal-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                  [disabled]="full()"
                  (click)="add(definition)"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]">
                    <mat-icon class="!h-5 !w-5 !text-xl !leading-none" aria-hidden="true">{{ definition.icon }}</mat-icon>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-semibold text-slate-900">{{ definition.name | t }}</span>
                    <span class="block break-words text-xs text-slate-500">{{ definition.description | t }}</span>
                  </span>
                </button>
              </li>
            }
          </ul>
        </section>
      </div>
    }

    <!-- ================= WIDGET SETTINGS ================= -->
    @if (settings(); as form) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="settings.set(null)">
        <section
          class="flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-settings-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <h2 id="widget-settings-title" class="min-w-0 truncate text-lg font-semibold text-white">
              {{ (settingsDefinition()?.name ?? 'Widget') | t }} · {{ 'Settings' | t }}
            </h2>
            <button type="button" (click)="settings.set(null)" class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>

          <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <label class="flex min-w-0 flex-col gap-1 text-sm">
              <span class="font-medium text-slate-700">{{ 'Title (optional)' | t }}</span>
              <input
                class="field"
                [maxLength]="limits.widgetTitleLength"
                [value]="form.title"
                [placeholder]="(settingsDefinition()?.name ?? '') | t"
                (input)="patchSettings({ title: value($event) })"
              />
            </label>

            <label class="flex min-w-0 flex-col gap-1 text-sm">
              <span class="font-medium text-slate-700">{{ 'Size' | t }}</span>
              <select class="field" (change)="patchSettings({ size: sizeOf(value($event)) })">
                @for (size of settingsSizes(); track size) {
                  <option [value]="size" [selected]="size === form.size">{{ sizes[size].label | t }}</option>
                }
              </select>
            </label>

            @for (setting of settingsDefinition()?.settings ?? []; track setting.key) {
              <label class="flex min-w-0 gap-1 text-sm" [ngClass]="setting.kind === 'toggle' ? 'flex-row items-center gap-2' : 'flex-col'">
                <span class="font-medium text-slate-700">{{ setting.label | t }}</span>
                @switch (setting.kind) {
                  @case ('textarea') {
                    <textarea
                      class="field min-h-28 py-2"
                      rows="5"
                      [maxLength]="setting.max ?? 1000"
                      [value]="textSetting(form, setting)"
                      (input)="setConfig(setting, value($event))"
                    ></textarea>
                  }
                  @case ('number') {
                    <input
                      class="field"
                      type="number"
                      min="1"
                      [max]="setting.max ?? 100"
                      [value]="textSetting(form, setting)"
                      (input)="setConfig(setting, numberOf(value($event), setting))"
                    />
                  }
                  @case ('select') {
                    <select class="field" (change)="setConfig(setting, value($event))">
                      @for (option of setting.options ?? []; track option.value) {
                        <option [value]="option.value" [selected]="option.value === textSetting(form, setting)">{{ option.label | t }}</option>
                      }
                    </select>
                  }
                  @case ('toggle') {
                    <input
                      type="checkbox"
                      class="order-first h-4 w-4 accent-[#007979]"
                      [checked]="form.config[setting.key] === true"
                      (change)="setConfig(setting, checked($event))"
                    />
                  }
                  @default {
                    <input class="field" [maxLength]="setting.max ?? 200" [value]="textSetting(form, setting)" (input)="setConfig(setting, value($event))" />
                  }
                }
                @if (setting.hint) {
                  <span class="text-xs text-slate-500">{{ setting.hint | t }}</span>
                }
              </label>
            }
          </div>

          <footer class="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button type="button" class="tool-btn !border-transparent" (click)="settings.set(null)">{{ 'Cancel' | t }}</button>
            <button type="button" class="tool-btn tool-btn--primary" (click)="applySettings()">{{ 'Apply' | t }}</button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .tool-btn {
        display: inline-flex;
        height: 2.25rem;
        align-items: center;
        gap: 0.375rem;
        border-radius: 0.5rem;
        border: 1px solid #cbd5e1;
        background: #fff;
        padding: 0 0.875rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
      }
      .tool-btn:hover:not(:disabled) {
        background: #f8fafc;
      }
      .tool-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .tool-btn--primary {
        border-color: #007979;
        background: #007979;
        color: #fff;
      }
      .tool-btn--primary:hover:not(:disabled) {
        background: #006666;
      }
      .icon-btn {
        display: inline-flex;
        height: 2rem;
        width: 2rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        color: #64748b;
      }
      .icon-btn:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
      }
      .icon-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .field {
        height: 2.5rem;
        width: 100%;
        min-width: 0;
        border-radius: 0.5rem;
        border: 1px solid #cbd5e1;
        background: #fff;
        padding: 0 0.75rem;
        font-size: 0.875rem;
        color: #0f172a;
      }
      textarea.field {
        height: auto;
        resize: vertical;
      }
      .field:focus {
        outline: none;
        border-color: #007979;
        box-shadow: 0 0 0 3px rgba(0, 121, 121, 0.15);
      }
      .cdk-drag-preview {
        border-radius: 1rem;
        box-shadow: 0 16px 32px -12px rgba(15, 23, 42, 0.35);
      }
      .cdk-drag-animating,
      .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class DashboardBuilderComponent {
  private readonly widgetRegistry = inject(DashboardWidgetRegistry);
  private readonly sources = inject(DashboardDataSourceRegistry);
  private readonly service = inject(DashboardService);

  readonly dashboard = input.required<Dashboard>();
  readonly context = input.required<DashboardContext>();

  /** Saved: the page reloads the dashboard and leaves edit mode. */
  readonly saved = output<void>();
  readonly cancelled = output<void>();
  /** Someone else saved meanwhile: the page reloads (discarding this edit). */
  readonly reloadRequested = output<void>();

  protected readonly limits = DASHBOARD_LIMITS;
  protected readonly maxWidgets = MAX_WIDGETS;
  protected readonly sizes = WIDGET_SIZES;
  protected readonly roleOptions = ROLE_LABELS;

  protected readonly draft = signal<Dashboard>(this.blank());
  private readonly original = signal<string>('');
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly conflict = signal(false);
  protected readonly adding = signal(false);
  protected readonly settings = signal<SettingsForm | null>(null);

  protected readonly dirty = computed(() => snapshot(this.draft()) !== this.original());
  protected readonly full = computed(() => this.draft().widgets.length >= MAX_WIDGETS);
  protected readonly available = computed(() => this.widgetRegistry.availableFor(this.draft().appId));

  /** Edit rights can't be given below managers, nor above the editor's own role. */
  protected readonly editRoleOptions = computed(() => {
    const context = this.context();
    const mine = context.isPlatformAdmin ? 5 : roleRank(context.role);
    return ROLE_LABELS.filter((option) => roleRank(option.role) >= 3 && roleRank(option.role) <= mine);
  });

  protected readonly settingsDefinition = computed(() => {
    const form = this.settings();
    const widget = form && this.draft().widgets.find((item) => item.id === form.widgetId);
    return widget ? this.widgetRegistry.get(widget.type) : undefined;
  });

  protected readonly settingsSizes = computed(() => this.settingsDefinition()?.sizes ?? (Object.keys(WIDGET_SIZES) as WidgetSize[]));

  constructor() {
    // Start (or restart) from the dashboard given in.
    effect(() => {
      const dashboard = this.dashboard();
      untracked(() => {
        const copy = clone(dashboard);
        this.draft.set(copy);
        this.original.set(snapshot(copy));
        this.error.set('');
        this.conflict.set(false);
      });
    });
  }

  /** For a route guard: true when leaving would lose changes. */
  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  // ---------- Details ----------

  protected patch(change: Partial<Pick<Dashboard, 'name' | 'description'>>): void {
    this.draft.update((current) => ({ ...current, ...change }));
  }

  protected setViewRole(role: string): void {
    const option = ROLE_LABELS.find((item) => item.role === role);
    if (!option) return;
    this.draft.update((current) => ({
      ...current,
      viewMinRole: option.role,
      // Editors must be able to see what they edit.
      editMinRole: roleRank(current.editMinRole) < roleRank(option.role) ? option.role : current.editMinRole,
    }));
  }

  protected setEditRole(role: string): void {
    const option = ROLE_LABELS.find((item) => item.role === role);
    if (!option) return;
    this.draft.update((current) => ({
      ...current,
      editMinRole: option.role,
      viewMinRole: roleRank(current.viewMinRole) > roleRank(option.role) ? option.role : current.viewMinRole,
    }));
  }

  // ---------- Widgets ----------

  protected drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.draft.update((current) => {
      const widgets = [...current.widgets];
      moveItemInArray(widgets, event.previousIndex, event.currentIndex);
      return { ...current, widgets };
    });
  }

  protected move(index: number, step: -1 | 1): void {
    this.draft.update((current) => {
      const target = index + step;
      if (target < 0 || target >= current.widgets.length) return current;
      const widgets = [...current.widgets];
      moveItemInArray(widgets, index, target);
      return { ...current, widgets };
    });
  }

  protected resize(widget: DashboardWidget, size: WidgetSize): void {
    this.updateWidget(widget.id, { size });
  }

  protected remove(widget: DashboardWidget): void {
    this.draft.update((current) => ({ ...current, widgets: current.widgets.filter((item) => item.id !== widget.id) }));
  }

  protected add(definition: WidgetDefinition): void {
    if (this.full()) return;
    const widget: DashboardWidget = {
      id: newWidgetId(),
      type: definition.type,
      size: definition.defaultSize,
      title: '',
      config: this.widgetRegistry.configWithDefaults(definition.type, {}),
    };
    this.draft.update((current) => ({ ...current, widgets: [...current.widgets, widget] }));
    this.adding.set(false);
    // Widgets with settings open them straight away.
    if (definition.settings.length) this.openSettings(widget);
  }

  protected sizesFor(widget: DashboardWidget): WidgetSize[] {
    return this.widgetRegistry.get(widget.type)?.sizes ?? (Object.keys(WIDGET_SIZES) as WidgetSize[]);
  }

  protected span(size: WidgetSize): string {
    return `min-w-0 ${WIDGET_SPAN[size]}`;
  }

  // ---------- Settings panel ----------

  protected openSettings(widget: DashboardWidget): void {
    this.settings.set({
      widgetId: widget.id,
      title: widget.title,
      size: widget.size,
      config: this.widgetRegistry.configWithDefaults(widget.type, widget.config),
    });
  }

  protected patchSettings(change: Partial<SettingsForm>): void {
    this.settings.update((current) => (current ? { ...current, ...change } : current));
  }

  protected setConfig(setting: WidgetSetting, value: unknown): void {
    this.settings.update((current) => (current ? { ...current, config: { ...current.config, [setting.key]: value } } : current));
  }

  protected applySettings(): void {
    const form = this.settings();
    if (!form) return;
    this.updateWidget(form.widgetId, { title: form.title.trim(), size: form.size, config: form.config });
    this.settings.set(null);
  }

  protected textSetting(form: SettingsForm, setting: WidgetSetting): string {
    const value = form.config[setting.key];
    return value === undefined || value === null ? '' : String(value);
  }

  protected numberOf(text: string, setting: WidgetSetting): number {
    const number = Math.round(Number(text) || 1);
    return Math.min(setting.max ?? 100, Math.max(1, number));
  }

  protected sizeOf(text: string): WidgetSize {
    return text === 's' || text === 'm' || text === 'w' || text === 'f' ? text : 'm';
  }

  // ---------- Save ----------

  protected cancel(): void {
    if (this.dirty() && typeof window !== 'undefined' && !window.confirm('Discard your changes?')) return;
    this.cancelled.emit();
  }

  protected async save(): Promise<void> {
    const draft = this.draft();
    const problems = dashboardProblems(draft);
    if (problems.length) {
      this.error.set(problems[0]);
      return;
    }
    if (!this.context().userId) {
      this.error.set('Sign in to save.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      await this.service.save(draft, this.context().userId!, this.dashboard().updatedAt);
      // Settings may have changed what widgets show.
      this.sources.clear();
      this.original.set(snapshot(draft));
      this.saved.emit();
    } catch (problem) {
      if (problem instanceof DashboardConflictError) {
        this.conflict.set(true);
        this.error.set(problem.message);
      } else {
        this.error.set('The dashboard could not be saved. Try again.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  private updateWidget(widgetId: string, change: Partial<DashboardWidget>): void {
    this.draft.update((current) => ({
      ...current,
      widgets: current.widgets.map((item) => (item.id === widgetId ? { ...item, ...change } : item)),
    }));
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  private blank(): Dashboard {
    return {
      id: '',
      organizationId: '',
      name: '',
      description: '',
      appId: 'organization',
      scope: 'shared',
      ownerId: '',
      viewMinRole: 'org_member',
      editMinRole: 'org_manager',
      isDefault: false,
      widgets: [],
      templateId: '',
      templateVersion: 0,
      createdAt: null,
      updatedAt: null,
      updatedBy: '',
    };
  }
}

function clone(dashboard: Dashboard): Dashboard {
  return { ...dashboard, widgets: dashboard.widgets.map((widget) => ({ ...widget, config: { ...widget.config } })) };
}

/** What counts as a change (dates and audit fields aside). */
function snapshot(dashboard: Dashboard): string {
  return JSON.stringify({
    name: dashboard.name,
    description: dashboard.description,
    viewMinRole: dashboard.viewMinRole,
    editMinRole: dashboard.editMinRole,
    widgets: dashboard.widgets,
  });
}

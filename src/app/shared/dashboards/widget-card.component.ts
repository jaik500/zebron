import { ChangeDetectionStrategy, Component, Type, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, NgComponentOutlet } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DashboardContext, DashboardDataSourceRegistry, WidgetData } from './data-source.registry';
import { DashboardWidget } from './dashboard.model';
import { ALWAYS_ON, DashboardWidgetRegistry } from './widget.registry';

type CardState = 'loading' | 'ready' | 'empty' | 'denied' | 'inactive' | 'unknown' | 'error';


/**
 * The card every widget sits in. It checks the widget is allowed and its
 * app is active, loads its data through the data-source registry, and shows
 * loading, empty, no-access and error states, so widgets only draw content.
 *
 * Layout rules from the phone fixes: shrinkable, titles wrap, nothing
 * pushes the page wider.
 */
@Component({
  selector: 'app-widget-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, NgComponentOutlet, MatIconModule, TranslatePipe],
  template: `
    <article class="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header class="flex min-w-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
        @if (definition(); as definition) {
          <mat-icon class="!h-5 !w-5 shrink-0 !text-xl !leading-none text-[#007979]" aria-hidden="true">{{ definition.icon }}</mat-icon>
        }
        <h3 class="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
          {{ widget().title || ((definition()?.name ?? 'Widget') | t) }}
        </h3>
        <ng-content select="[cardActions]" />
      </header>

      <div class="min-h-24 min-w-0 flex-1 p-4">
        @switch (state()) {
          @case ('loading') {
            <div class="flex flex-col gap-2" aria-hidden="true">
              <div class="h-4 w-1/2 animate-pulse rounded bg-slate-200/70"></div>
              <div class="h-8 w-1/3 animate-pulse rounded bg-slate-200/70"></div>
            </div>
            <span class="sr-only">{{ 'Loading…' | t }}</span>
          }
          @case ('ready') {
            @if (component(); as component) {
              <ng-container *ngComponentOutlet="component; inputs: { widget: widget(), context: context(), data: data() }" />
            }
          }
          @case ('empty') {
            <p class="text-sm text-slate-500">{{ (data()?.pending || 'Nothing to show yet.') | t }}</p>
          }
          @case ('denied') {
            <p class="flex items-start gap-2 text-sm text-slate-500">
              <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] !leading-none" aria-hidden="true">lock</mat-icon>
              {{ 'You don\\u0027t have access to this information.' | t }}
            </p>
          }
          @case ('inactive') {
            <p class="text-sm text-slate-500">{{ 'This application isn\\u0027t switched on for your organization.' | t }}</p>
          }
          @case ('unknown') {
            <p class="text-sm text-slate-500">{{ 'This widget is no longer available.' | t }}</p>
          }
          @case ('error') {
            <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{{ 'This could not be loaded.' | t }}</span>
              <button type="button" class="font-semibold text-[#007979] hover:underline" (click)="reload()">{{ 'Try again' | t }}</button>
            </div>
          }
        }
      </div>

      @if (state() === 'ready' && data()?.asOf; as asOf) {
        <p class="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          {{ 'Updated {0}' | t: [(asOf | date: 'MMM d, h:mm a') ?? ''] }}
        </p>
      }
    </article>
  `,
})
export class WidgetCardComponent {
  private readonly widgets = inject(DashboardWidgetRegistry);
  private readonly sources = inject(DashboardDataSourceRegistry);

  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();

  protected readonly definition = computed(() => this.widgets.get(this.widget().type));
  protected readonly component = signal<Type<unknown> | null>(null);
  protected readonly data = signal<WidgetData | null>(null);
  protected readonly state = signal<CardState>('loading');
  private readonly attempt = signal(0);

  /** Reload when the widget's type or settings change (the builder edits them). */
  private readonly loadKey = computed(() =>
    JSON.stringify([this.widget().type, this.widget().config, this.context().organizationId, this.context().revision ?? 0, this.attempt()]),
  );

  constructor() {
    effect(() => {
      this.loadKey();
      const force = this.attempt() > 0 || (this.context().revision ?? 0) > 0;
      untracked(() => void this.load(force));
    });
  }

  protected reload(): void {
    this.attempt.update((value) => value + 1);
  }

  private async load(force: boolean): Promise<void> {
    const widget = this.widget();
    const context = this.context();
    const definition = this.widgets.get(widget.type);

    if (!definition) {
      this.state.set('unknown');
      return;
    }
    if (definition.permission && !context.can(definition.permission)) {
      this.state.set('denied');
      return;
    }
    if (definition.requiresApp && !ALWAYS_ON.has(definition.requiresApp) && !context.isAppActive(definition.requiresApp)) {
      this.state.set('inactive');
      return;
    }

    const sourceKey = this.widgets.dataSourceOf(widget);
    const source = sourceKey ? this.sources.get(sourceKey) : undefined;
    if (sourceKey && !source) {
      this.state.set('unknown');
      return;
    }
    if (source?.permission && !context.can(source.permission)) {
      this.state.set('denied');
      return;
    }
    if (source && !ALWAYS_ON.has(source.appId) && !context.isAppActive(source.appId)) {
      this.state.set('inactive');
      return;
    }

    this.state.set('loading');
    try {
      const config = this.widgets.configWithDefaults(widget.type, widget.config);
      const [component, data] = await Promise.all([
        this.component() ? Promise.resolve(this.component()!) : definition.component(),
        sourceKey ? this.sources.load(sourceKey, context, config, force) : Promise.resolve(null),
      ]);

      this.component.set(component);
      this.data.set(data);
      this.state.set(isEmpty(data) ? 'empty' : 'ready');
    } catch (problem) {
      this.state.set(isPermissionError(problem) ? 'denied' : 'error');
    }
  }
}

function isEmpty(data: WidgetData | null): boolean {
  if (!data) return false;
  if (data.pending) return true;
  switch (data.kind) {
    case 'list':
      return data.items.length === 0;
    case 'series':
      return data.points.length === 0;
    default:
      return false;
  }
}

function isPermissionError(problem: unknown): boolean {
  const code = (problem as { code?: unknown } | null)?.code;
  return code === 'permission-denied' || code === 'functions/permission-denied';
}

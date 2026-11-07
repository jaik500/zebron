import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { DashboardContext, DashboardDataSourceRegistry } from './data-source.registry';
import { DashboardWidget, WidgetSize } from './dashboard.model';
import { WidgetCardComponent } from './widget-card.component';
import { DashboardWidgetRegistry } from './widget.registry';

/** Column spans: 12 columns from 1024 px, 6 on tablets, 1 on phones. */
export const WIDGET_SPAN: Record<WidgetSize, string> = {
  s: 'md:col-span-3 lg:col-span-3',
  m: 'md:col-span-6 lg:col-span-6',
  w: 'md:col-span-6 lg:col-span-9',
  f: 'md:col-span-6 lg:col-span-12',
};

/**
 * A dashboard in view mode. Each widget loads only when it scrolls into
 * view (cost rule 2), so widgets below the fold cost nothing until seen.
 * The builder (stage 3) wraps this grid with drag handles and settings.
 */
@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WidgetCardComponent],
  template: `
    <div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
      @for (widget of visible(); track widget.id) {
        <div class="min-w-0" [class]="span(widget.size)">
          @defer (on viewport) {
            <app-widget-card class="block h-full" [widget]="widget" [context]="context()" />
          } @placeholder {
            <div class="h-40 rounded-2xl border border-slate-200 bg-white" aria-hidden="true"></div>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardGridComponent {
  private readonly registry = inject(DashboardWidgetRegistry);
  private readonly sources = inject(DashboardDataSourceRegistry);

  readonly widgets = input.required<DashboardWidget[]>();
  readonly context = input.required<DashboardContext>();

  /** Widgets this viewer can use; the rest (e.g. managers' figures for members) are hidden. */
  protected readonly visible = computed(() =>
    this.widgets().filter((widget) => this.registry.isUsable(widget, this.context(), this.sources)),
  );

  protected span(size: WidgetSize): string {
    return `min-w-0 ${WIDGET_SPAN[size]}`;
  }
}

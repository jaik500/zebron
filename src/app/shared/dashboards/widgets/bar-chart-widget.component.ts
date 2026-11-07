import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** Labels that mean "needs attention" are drawn in red. */
const ALERT_LABELS = new Set(['overdue', 'late', 'failed', 'expired']);

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const MONEY_SHORT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

/**
 * Bar chart drawn with plain HTML and CSS (no chart package): columns for a
 * short run such as weeks, horizontal bars when labels are long (course
 * names). Values are printed on the bars; a hidden table gives screen
 * readers the same figures.
 */
@Component({
  selector: 'app-bar-chart-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TranslatePipe],
  template: `
    @if (series(); as series) {
      @if (allZero()) {
        <p class="mb-3 text-sm text-slate-500">{{ 'Nothing recorded in this period yet.' | t }}</p>
      }

      @if (horizontal()) {
        <ul class="flex min-w-0 flex-col gap-2.5" role="img" [attr.aria-label]="summary()">
          @for (point of series.points; track $index) {
            <li class="min-w-0" aria-hidden="true">
              <div class="mb-1 flex min-w-0 items-baseline justify-between gap-2 text-xs">
                <span class="min-w-0 break-words text-slate-700 [overflow-wrap:anywhere]">{{ point.label | t }}</span>
                <span class="shrink-0 font-semibold tabular-nums text-slate-900">{{ display(point.value) }}</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full transition-[width] duration-500" [ngClass]="barColor(point.label)" [style.width.%]="share(point.value)"></div>
              </div>
            </li>
          }
        </ul>
      } @else {
        <div class="flex h-40 min-w-0 items-stretch gap-1.5 border-b border-slate-200 sm:gap-2" role="img" [attr.aria-label]="summary()">
          @for (point of series.points; track $index) {
            <div class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" aria-hidden="true">
              <span class="max-w-full truncate text-[11px] font-semibold tabular-nums text-slate-700">{{ display(point.value, true) }}</span>
              <div
                class="w-full max-w-10 rounded-t-md transition-[height] duration-500"
                [ngClass]="barColor(point.label, $last && !!series.highlightLast)"
                [style.height.%]="columnHeight(point.value)"
              ></div>
            </div>
          }
        </div>
        <div class="mt-1 flex min-w-0 gap-1.5 sm:gap-2" aria-hidden="true">
          @for (point of series.points; track $index) {
            <span class="min-w-0 flex-1 truncate text-center text-[10.5px] text-slate-500">{{ point.label | t }}</span>
          }
        </div>
      }

      <table class="sr-only">
        <caption>{{ (widget().title || 'Chart') | t }}</caption>
        <tbody>
          @for (point of series.points; track $index) {
            <tr><th scope="row">{{ point.label | t }}</th><td>{{ display(point.value) }}</td></tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class BarChartWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly series = computed(() => {
    const data = this.data();
    return data?.kind === 'series' ? data : null;
  });

  private readonly max = computed(() => Math.max(1, ...(this.series()?.points.map((point) => point.value) ?? [0])));

  protected readonly allZero = computed(() => (this.series()?.points ?? []).every((point) => point.value === 0));

  /** Long labels or many points read better as horizontal bars. */
  protected readonly horizontal = computed(() => {
    const points = this.series()?.points ?? [];
    return points.length > 8 || points.some((point) => point.label.length > 9);
  });

  protected readonly summary = computed(() => {
    const series = this.series();
    if (!series) return '';
    const unit = series.unit ? ` ${series.unit}` : '';
    return series.points.map((point) => `${point.label}: ${this.display(point.value)}${unit}`).join('; ');
  });

  /** Money as dollars (short form, e.g. $12.3K, above columns); other values as they are. */
  protected display(value: number, short = false): string {
    if (this.series()?.format !== 'money') return String(value);
    return (short ? MONEY_SHORT : MONEY).format(value);
  }

  protected share(value: number): number {
    return Math.round((value / this.max()) * 100);
  }

  /** Columns keep a sliver at zero so the baseline position is visible. */
  protected columnHeight(value: number): number {
    return value === 0 ? 2 : Math.max(4, Math.round((value / this.max()) * 88));
  }

  protected barColor(label: string, emphasise = false): string {
    if (ALERT_LABELS.has(label.trim().toLowerCase())) return 'bg-rose-500';
    return emphasise ? 'bg-[#007979]' : 'bg-teal-500/70';
  }
}

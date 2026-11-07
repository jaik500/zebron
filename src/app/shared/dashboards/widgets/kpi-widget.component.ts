import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** One figure with a caption and a link (KPI widget). */
@Component({
  selector: 'app-kpi-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, TranslatePipe],
  template: `
    @if (number(); as figure) {
      <div class="flex min-w-0 flex-col gap-1">
        <p class="flex min-w-0 items-baseline gap-0.5">
          @if (figure.format === 'money') {
            <span class="min-w-0 break-words text-3xl font-bold tabular-nums leading-none text-slate-900 [overflow-wrap:anywhere]">{{ figure.value | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
          } @else {
            <span class="text-3xl font-bold tabular-nums leading-none text-slate-900">{{ figure.value | number: '1.0-0' }}</span>
          }
          @if (figure.unit) {
            <span class="text-lg font-semibold text-slate-500">{{ figure.unit }}</span>
          }
        </p>
        @if (figure.caption) {
          <p class="break-words text-sm text-slate-600 [overflow-wrap:anywhere]">{{ figure.caption | t }}</p>
        }
        @if (figure.link) {
          <a [routerLink]="figure.link" class="mt-1 self-start text-sm font-semibold text-[#007979] hover:underline">{{ 'View details' | t }}</a>
        }
      </div>
    }
  `,
})
export class KpiWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly number = computed(() => {
    const data = this.data();
    return data?.kind === 'number' ? data : null;
  });
}

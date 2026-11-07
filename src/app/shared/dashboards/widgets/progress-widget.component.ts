import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** Progress against a target, e.g. assignments completed. */
@Component({
  selector: 'app-progress-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    @if (progress(); as progress) {
      <div class="flex min-w-0 flex-col gap-2">
        <p class="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span class="text-3xl font-bold tabular-nums leading-none text-slate-900">{{ percent() }}%</span>
          <span class="text-sm text-slate-600">{{ '{0} of {1}' | t: [progress.value, progress.target] }}</span>
        </p>
        <div
          class="h-2.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          [attr.aria-valuenow]="percent()"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-label]="(widget().title || 'Progress') | t"
        >
          <div class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f] transition-[width] duration-500" [style.width.%]="percent()"></div>
        </div>
        @if (progress.caption) {
          <p class="break-words text-sm text-slate-600 [overflow-wrap:anywhere]">{{ progress.caption | t }}</p>
        }
        @if (progress.link) {
          <a [routerLink]="progress.link" class="self-start text-sm font-semibold text-[#007979] hover:underline">{{ 'View details' | t }}</a>
        }
      </div>
    }
  `,
})
export class ProgressWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly progress = computed(() => {
    const data = this.data();
    return data?.kind === 'progress' ? data : null;
  });

  protected readonly percent = computed(() => {
    const progress = this.progress();
    return progress && progress.target > 0 ? Math.min(100, Math.round((progress.value / progress.target) * 100)) : 0;
  });
}

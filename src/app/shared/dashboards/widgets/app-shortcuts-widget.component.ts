import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** The organization's active apps as tiles (the partner dashboard's app cards). */
@Component({
  selector: 'app-app-shortcuts-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    @if (list(); as list) {
      <ul class="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        @for (app of list.items; track app.title) {
          <li class="min-w-0">
            <a
              [routerLink]="app.link"
              class="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#007979] hover:bg-teal-50/40"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]">
                <mat-icon class="!h-5 !w-5 !text-xl !leading-none" aria-hidden="true">{{ app.icon || 'apps' }}</mat-icon>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">{{ app.title | t }}</span>
                @if (app.subtitle && widget().size !== 's') {
                  <span class="line-clamp-2 block text-xs text-slate-500">{{ app.subtitle | t }}</span>
                }
              </span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class AppShortcutsWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly list = computed(() => {
    const data = this.data();
    return data?.kind === 'list' ? data : null;
  });
}

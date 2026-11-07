import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** Up to 8 linked items, e.g. upcoming sessions or recent posts. */
@Component({
  selector: 'app-list-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, MatIconModule, TranslatePipe],
  template: `
    @if (list(); as list) {
      <ul class="-mx-2 flex min-w-0 flex-col">
        @for (item of list.items; track $index) {
          <li class="min-w-0">
            @if (item.link) {
              <a [routerLink]="item.link" class="flex min-w-0 items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
              </a>
            } @else {
              <div class="flex min-w-0 items-start gap-3 px-2 py-2">
                <ng-container *ngTemplateOutlet="row; context: { $implicit: item }" />
              </div>
            }
          </li>
        }
      </ul>
      @if (list.link) {
        <a [routerLink]="list.link" class="mt-2 inline-block text-sm font-semibold text-[#007979] hover:underline">{{ 'See all' | t }}</a>
      }
    }

    <ng-template #row let-item>
      @if (item.icon) {
        <mat-icon class="mt-0.5 !h-5 !w-5 shrink-0 !text-xl !leading-none text-[#007979]" aria-hidden="true">{{ item.icon }}</mat-icon>
      }
      <span class="min-w-0 flex-1">
        <span class="block break-words text-sm font-medium text-slate-900 [overflow-wrap:anywhere]">{{ item.title }}</span>
        @if (item.subtitle) {
          <span class="block break-words text-xs text-slate-500 [overflow-wrap:anywhere]">{{ item.subtitle | t }}</span>
        }
      </span>
    </ng-template>
  `,
})
export class ListWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly list = computed(() => {
    const data = this.data();
    return data?.kind === 'list' ? data : null;
  });
}

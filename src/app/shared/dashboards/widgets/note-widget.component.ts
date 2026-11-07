import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { DashboardContext, WidgetData } from '../data-source.registry';
import { DashboardWidget } from '../dashboard.model';

/** Text the editor writes: an announcement, instructions, a welcome. No data reads. */
@Component({
  selector: 'app-note-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    @if (text()) {
      <p class="whitespace-pre-line break-words text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{{ text() }}</p>
    } @else {
      <p class="text-sm text-slate-500">{{ 'Edit the dashboard to write this note.' | t }}</p>
    }
  `,
})
export class NoteWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly context = input.required<DashboardContext>();
  readonly data = input<WidgetData | null>(null);

  protected readonly text = computed(() => {
    const value = this.widget().config['text'];
    return typeof value === 'string' ? value.trim().slice(0, 1000) : '';
  });
}

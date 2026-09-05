import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  MatCheckboxModule,
} from '@angular/material/checkbox';

@Component({
  selector: 'app-scheduler-config',
  standalone: true,
  imports: [
    MatCheckboxModule,
  ],
  template: `
    <div
      class="rounded-xl border border-gray-200
             bg-gray-50 p-4"
    >

      <mat-checkbox
        [checked]="enabled"
        (change)="enabledChange.emit($event.checked)"
      >
        <span class="font-medium text-gray-800">
          Add to Scheduler
        </span>
      </mat-checkbox>

      <p
        class="ml-8 mt-1 text-sm text-gray-500"
      >
        Enable automatic processing of this
        item by Zebron's scheduled automation.
      </p>

    </div>
  `,
})
export class SchedulerConfigComponent {
  /**
   * Current scheduler state.
   */
  @Input()
  enabled = false;

  /**
   * Emits whenever the checkbox changes.
   */
  @Output()
  readonly enabledChange =
    new EventEmitter<boolean>();
}
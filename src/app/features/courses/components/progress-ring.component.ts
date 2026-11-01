import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A circular progress indicator with the percentage in the middle. */
@Component({
  selector: 'app-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="label()"
    >
      <circle
        [attr.cx]="center()"
        [attr.cy]="center()"
        [attr.r]="radius()"
        fill="none"
        [attr.stroke]="trackColor()"
        stroke-width="6"
      />
      <circle
        [attr.cx]="center()"
        [attr.cy]="center()"
        [attr.r]="radius()"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="6"
        stroke-linecap="round"
        [attr.stroke-dasharray]="circumference()"
        [attr.stroke-dashoffset]="offset()"
        [attr.transform]="rotate()"
        style="transition: stroke-dashoffset 0.4s ease"
      />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="central"
        [attr.fill]="color()"
        [attr.font-size]="fontSize()"
        font-weight="700"
      >
        {{ clamped() }}%
      </text>
    </svg>
  `,
})
export class ProgressRingComponent {
  readonly percent = input(0);
  readonly size = input(64);
  readonly color = input('#007979');
  readonly trackColor = input('#e2e8f0');

  protected readonly clamped = computed(() => Math.max(0, Math.min(100, Math.round(this.percent()))));
  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => this.size() / 2 - 5);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly offset = computed(() => this.circumference() * (1 - this.clamped() / 100));
  protected readonly viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);
  protected readonly rotate = computed(() => `rotate(-90 ${this.center()} ${this.center()})`);
  protected readonly fontSize = computed(() => Math.max(11, Math.round(this.size() / 4.4)));
  protected readonly label = computed(() => `${this.clamped()}%`);
}

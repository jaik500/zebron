import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BrandMark, placementStyle } from '../../../core/config/brand-marks';

/**
 * The picture on the Zebron "e" (a hat, a cap…), from the gallery in
 * core/config/brand-marks.ts or a look built in Admin → Home page look.
 * Place it inside the mirrored "e" (a `position: relative` element with
 * `transform: scaleX(-1)`): it is sized in em, so it fits any font size,
 * and mirrors itself back. Decorative only.
 *
 * `image` replaces the look's picture (the builder's preview of a file
 * that isn't uploaded yet).
 */
@Component({
  selector: 'app-brand-e-decoration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (source(); as src) {
      <img
        [src]="src"
        alt=""
        aria-hidden="true"
        draggable="false"
        class="pointer-events-none absolute max-w-none select-none"
        [style]="style()"
      />
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class BrandEDecorationComponent {
  readonly mark = input.required<BrandMark>();
  readonly image = input<string | null>(null);

  protected readonly source = computed(() => this.image() ?? this.mark().image);
  protected readonly style = computed(() => placementStyle(this.mark().placement));
}

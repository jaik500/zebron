import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Christmas ornament look for the home page's big round "e"
 * (BrandMark.circle === 'ornament'): a string and a gold cap above the
 * circle, a gold band and a shine across it. Place it inside the circle,
 * which must be `position: relative` (or absolute) and round. Decorative.
 */
@Component({
  selector: 'app-brand-ornament',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span aria-hidden="true" class="pointer-events-none absolute bottom-[calc(100%+0.6rem)] left-1/2 h-14 w-px -translate-x-1/2 bg-white/50"></span>
    <span aria-hidden="true" class="pointer-events-none absolute -top-3 left-1/2 h-5 w-10 -translate-x-1/2 rounded-md bg-[#EF9F27] shadow-sm ring-2 ring-[#BA7517]/60">
      <span class="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#EF9F27]"></span>
    </span>
    <svg aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-full" viewBox="0 0 100 100">
      <path d="M0 58 Q 50 76 100 58" fill="none" stroke="#EF9F27" stroke-width="4" opacity="0.9" />
      <path d="M0 66 Q 50 84 100 66" fill="none" stroke="#FAC775" stroke-width="1.5" opacity="0.7" />
      <path d="M22 30 A 34 34 0 0 1 46 15" fill="none" stroke="#9FE1CB" stroke-width="4" stroke-linecap="round" opacity="0.6" />
    </svg>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class BrandOrnamentComponent {}

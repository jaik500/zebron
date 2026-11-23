import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { RELATED_KINDS, RelatedLink, groupRelated, sanitizeRelated } from '../related-links';

/**
 * End of a blog post: "Continue on Zebron", the post's related courses,
 * bootcamps, resources, job searches and pages, grouped as Keep learning,
 * Get help, Find work and Explore Zebron. Shows nothing when the post has
 * no links.
 */
@Component({
  selector: 'app-continue-on-zebron',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    @if (groups().length) {
      <section class="mt-10 rounded-2xl border border-[#007979]/20 bg-[#f2fafa] p-5 sm:p-6" aria-labelledby="continue-title">
        <h2 id="continue-title" class="flex items-center gap-2 text-lg font-bold text-[#032D42]">
          <mat-icon class="!h-6 !w-6 !text-[24px] text-[#007979]" aria-hidden="true">explore</mat-icon>
          {{ 'Continue on Zebron' | t }}
        </h2>
        <div class="mt-4 grid gap-5 sm:grid-cols-2">
          @for (group of groups(); track group.key) {
            <div class="min-w-0">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#007979]">{{ group.title | t }}</h3>
              <ul class="mt-2 space-y-2">
                @for (link of group.links; track link.path + (link.query ?? '')) {
                  <li>
                    <a
                      [routerLink]="link.path"
                      [queryParams]="link.query ? { q: link.query } : null"
                      class="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 no-underline transition hover:border-[#007979] hover:shadow-sm"
                    >
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5f4f4] text-[#007979]">
                        <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ kinds[link.kind].icon }}</mat-icon>
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold leading-5 text-[#032D42] group-hover:text-[#007979]">{{ link.title }}</span>
                        <span class="block truncate text-xs text-slate-500">{{ link.note || (kinds[link.kind].label | t) }}</span>
                      </span>
                      <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-slate-300 group-hover:text-[#007979]" aria-hidden="true">chevron_right</mat-icon>
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class ContinueOnZebronComponent {
  readonly links = input<RelatedLink[] | null | undefined>([]);

  protected readonly kinds = RELATED_KINDS;
  protected readonly groups = computed(() => groupRelated(sanitizeRelated(this.links() ?? [])));
}

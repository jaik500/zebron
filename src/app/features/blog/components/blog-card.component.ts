import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { BLOG_COVERS, BLOG_SECTION_META, BlogPost, blogDate, initialsOf } from '../blog.model';

/** A post in the feed: large (featured) or as a grid card. */
@Component({
  selector: 'app-blog-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <a
      [routerLink]="[basePath(), post().id]"
      class="group flex h-full overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-px hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#007979]/40"
      [class]="featured() ? 'flex-col sm:flex-row' : 'flex-col'"
    >
      <div
        class="shrink-0"
        [class]="featured() ? 'h-44 sm:h-auto sm:w-1/2' : 'h-28'"
        [style.background]="cover()"
        aria-hidden="true"
      ></div>

      <div class="flex min-w-0 flex-1 flex-col gap-2 p-4" [class]="featured() ? 'sm:p-6' : ''">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#007979]">{{ post().topic | t }}</span>
          @if (post().pinned) {
            <span class="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700">
              <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">push_pin</mat-icon>{{ 'Pinned' | t }}
            </span>
          } @else {
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" [class]="section().badgeClass">
              <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">{{ section().icon }}</mat-icon>{{ section().badge | t }}
            </span>
          }
        </div>

        <h3
          class="font-bold leading-snug text-[#032D42] group-hover:text-[#007979]"
          [class]="featured() ? 'text-xl sm:text-2xl' : 'text-base'"
        >
          {{ post().title }}
        </h3>

        @if (post().excerpt) {
          <p class="text-sm text-slate-600" [class]="featured() ? 'line-clamp-3' : 'line-clamp-2'">{{ post().excerpt }}</p>
        }

        <div class="mt-auto flex items-center gap-2 pt-1 text-xs text-slate-500">
          <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007979] text-[10px] font-bold text-white" aria-hidden="true">
            {{ initials() }}
          </span>
          <span class="truncate">{{ post().authorName }} · {{ date() }} · {{ '{0} min read' | t: [post().readingMinutes] }}</span>
        </div>
      </div>
    </a>
  `,
})
export class BlogCardComponent {
  readonly post = input.required<BlogPost>();
  readonly basePath = input.required<string>();
  readonly featured = input(false);

  protected readonly cover = computed(() => BLOG_COVERS[this.post().cover] ?? BLOG_COVERS.teal);
  protected readonly section = computed(() => BLOG_SECTION_META[this.post().section]);
  protected readonly initials = computed(() => initialsOf(this.post().authorName));
  protected readonly date = computed(() => blogDate(this.post().publishedAt));
}

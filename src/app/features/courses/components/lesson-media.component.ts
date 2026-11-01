import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { resolveMedia } from '../course.model';

/**
 * A video, audio or document block in a lesson: the site's own player when
 * Zebron knows the site (YouTube, Vimeo, Loom, Google Drive, Slides, Docs,
 * Microsoft Stream, SoundCloud, Spotify), the browser's player for direct
 * media files, and otherwise a button that opens the link in a new tab.
 */
@Component({
  selector: 'app-lesson-media',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, MatIconModule, TranslatePipe],
  template: `
    @if (media(); as item) {
      <figure class="m-0">
        @if (item.mode === 'iframe' && frameSrc()) {
          <div
            class="overflow-hidden rounded-xl border border-slate-200"
            [ngClass]="{
              'aspect-video bg-slate-900': item.frame === 'video',
              'h-[166px] bg-white': item.frame === 'audio',
              'aspect-[4/3] bg-white sm:aspect-video': item.frame === 'document'
            }"
          >
            <iframe
              class="h-full w-full"
              [src]="frameSrc()"
              [title]="label() || item.provider"
              loading="lazy"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        } @else if (item.mode === 'video') {
          <video class="aspect-video w-full rounded-xl bg-slate-900" [src]="item.src" controls preload="metadata" playsinline>
            {{ 'Your browser cannot play this video.' | t }}
          </video>
        } @else if (item.mode === 'audio') {
          <audio class="w-full" [src]="item.src" controls preload="metadata">
            {{ 'Your browser cannot play this audio.' | t }}
          </audio>
        } @else {
          <a
            [href]="item.src"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#007979] hover:bg-teal-50"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#007979]">
              <mat-icon aria-hidden="true">{{ linkIcon() }}</mat-icon>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold text-[#007979]">{{ linkLabel() | t }}</span>
              <span class="block truncate text-xs text-slate-500">{{ label() || item.provider }}</span>
            </span>
            <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">open_in_new</mat-icon>
          </a>
        }
        @if (caption()) {
          <figcaption class="mt-2 text-sm text-slate-500">{{ caption() }}</figcaption>
        }
      </figure>
    } @else if (showEmpty()) {
      <div class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        {{ 'Paste a link to see a preview.' | t }}
      </div>
    }
  `,
})
export class LessonMediaComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly kind = input.required<'video' | 'audio' | 'document'>();
  readonly url = input('');
  readonly start = input(0);
  readonly label = input('');
  readonly caption = input('');
  /** Show a placeholder when there is no usable link (the builder). */
  readonly showEmpty = input(false);

  protected readonly media = computed(() => resolveMedia(this.url(), this.kind(), this.start()));

  /**
   * Safe to trust: resolveMedia only returns iframe addresses it rebuilt
   * itself for known players (or a Microsoft Stream embed on sharepoint.com).
   */
  protected readonly frameSrc = computed(() => {
    const media = this.media();
    return media?.mode === 'iframe' ? this.sanitizer.bypassSecurityTrustResourceUrl(media.src) : null;
  });

  protected readonly linkLabel = computed(() =>
    this.kind() === 'video' ? 'Watch the video' : this.kind() === 'audio' ? 'Listen' : 'Open the document',
  );

  protected readonly linkIcon = computed(() =>
    this.kind() === 'video' ? 'smart_display' : this.kind() === 'audio' ? 'headphones' : 'description',
  );
}

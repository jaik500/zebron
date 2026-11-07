import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../core/i18n/translate.pipe';

/**
 * Share a public link, such as a certificate's /verify page: "Share" opens
 * the phone's or computer's share sheet where there is one, otherwise the
 * link is copied. Nothing is sent to Zebron.
 */
@Component({
  selector: 'app-share-link-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <button
      type="button"
      (click)="share()"
      [disabled]="!url()"
      class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">{{ copied() ? 'check' : 'link' }}</mat-icon>
      {{ (copied() ? 'Link copied' : label()) | t }}
    </button>
    <span class="sr-only" aria-live="polite">{{ copied() ? ('Link copied' | t) : '' }}</span>
  `,
})
export class ShareLinkButtonComponent {
  readonly url = input.required<string>();
  /** Title for the share sheet, e.g. the course name. */
  readonly title = input('');
  readonly label = input('Share verification link');

  protected readonly copied = signal(false);

  protected async share(): Promise<void> {
    const url = this.url();
    if (!url || typeof navigator === 'undefined') return;

    // Phones (and some computers): the system share sheet.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: this.title() || undefined, url });
        return;
      } catch (error) {
        // Cancelled by the person: nothing to do.
        if ((error as { name?: string } | null)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      // Clipboard blocked: show the link so it can be copied by hand.
      window.prompt('Copy this link', url);
    }
  }
}

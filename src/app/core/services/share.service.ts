import { Injectable, inject } from '@angular/core';

import { LoggerService } from './logger.service';

export interface ShareContent {
  title: string;
  text?: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class ShareService {
  private readonly logger = inject(LoggerService);

  /**
   * Share content using the native Web Share API when available.
   *
   * Falls back to the clipboard when native sharing is unavailable.
   *
   * Returns true when sharing/copying succeeds.
   */
  async share(content: ShareContent): Promise<boolean> {
    const title = content.title.trim();
    const text = content.text?.trim() || '';
    const url = content.url.trim();

    if (!title || !url) {
      this.logger.warn(
        'ShareService',
        'Share request was ignored because required content was missing.',
        {
          hasTitle: !!title,
          hasUrl: !!url,
        },
      );

      return false;
    }

    /*
     * Angular SSR safety:
     *
     * window and navigator do not exist during server-side rendering.
     */
    if (typeof window === 'undefined') {
      this.logger.warn(
        'ShareService',
        'Share request was ignored because the browser environment is unavailable.',
      );

      return false;
    }

    try {
      /*
       * Prefer the native Web Share API.
       *
       * This gives mobile users the familiar system share sheet.
       */
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share({
          title,
          text,
          url,
        });

        this.logger.info(
          'ShareService',
          'Content shared successfully.',
          {
            url,
          },
        );

        return true;
      }

      /*
       * Desktop browsers may not support navigator.share.
       *
       * Use the clipboard as the fallback.
       */
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(url);

        this.logger.info(
          'ShareService',
          'Share URL copied to clipboard.',
          {
            url,
          },
        );

        return true;
      }

      this.logger.warn(
        'ShareService',
        'No supported sharing mechanism is available.',
        {
          url,
        },
      );

      return false;

    } catch (error) {
      /*
       * Closing the native share sheet produces an AbortError.
       * That is a normal user action, not an application failure.
       */
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        this.logger.info(
          'ShareService',
          'User cancelled the share operation.',
          {
            url,
          },
        );

        return false;
      }

      this.logger.error(
        'ShareService',
        'Failed to share content.',
        {
          url,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return false;
    }
  }

  /**
   * Build a canonical Zebron Community post URL.
   */
  getCommunityPostUrl(postId: string): string | null {
    const id = postId.trim();

    if (!id || typeof window === 'undefined') {
      return null;
    }

    return `${window.location.origin}/community/post/${encodeURIComponent(id)}`;
  }
}
import { Directive, ElementRef, afterNextRender, inject, DestroyRef } from '@angular/core';

/**
 * Fades an element (and, with the reveal-group class, its children one
 * after another) into view the first time it scrolls onto the screen.
 *
 * The page that uses it supplies the .reveal / .is-visible styles. Content
 * is only hidden once this runs in the browser, so it is never lost on the
 * server or without IntersectionObserver.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      // Already on screen when the page opens: show it without waiting.
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) {
        element.classList.add('reveal', 'is-visible');
        return;
      }

      element.classList.add('reveal');

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            element.classList.add('is-visible');
            observer.disconnect();
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
      );

      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

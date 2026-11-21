import { DestroyRef, Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

import { HighlightPainter } from './highlight-painter.service';

/**
 * Marks a lesson text section as a place where learners can highlight and
 * take notes. Put it on the element that receives the section's
 * [innerHTML]; the HighlightPainter provided by the page draws the
 * highlights after Angular sets the HTML.
 *
 *   <div [innerHTML]="html" zbHighlightLayer [zbBlockIndex]="i" [zbHtml]="html"></div>
 *
 * Quick checks, exams and code exercises never use it.
 */
@Directive({
  selector: '[zbHighlightLayer]',
  host: {
    'data-annotation-section': '',
    '[attr.data-block-index]': 'zbBlockIndex()',
  },
})
export class HighlightLayerDirective {
  /** The lesson section (block) this text belongs to. */
  readonly zbBlockIndex = input.required<number>();
  /** The section's HTML: a change means Angular replaced the content, so repaint. */
  readonly zbHtml = input<string>('');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly painter = inject(HighlightPainter);

  constructor() {
    afterRenderEffect(() => {
      this.zbHtml();
      this.painter.register(this.element, this.zbBlockIndex());
    });
    inject(DestroyRef).onDestroy(() => this.painter.unregister(this.element));
  }
}

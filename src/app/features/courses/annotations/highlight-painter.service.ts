import { Injectable, NgZone, inject, signal } from '@angular/core';

import { I18nService } from '../../../core/i18n/i18n.service';
import { CourseAnnotation, highlightOption } from './annotation.model';
import { PaintRequest, locate, paint, textOf, unpaint } from './annotation-anchoring';

/**
 * Paints a lesson's highlights and notes into its text sections.
 *
 * Provided by the lesson player (one per page). Each text section registers
 * itself through HighlightLayerDirective; whenever a section's HTML or the
 * learner's annotations change, every section is repainted in one pass, so
 * an annotation is drawn once even if its section moved.
 */
@Injectable()
export class HighlightPainter {
  private readonly zone = inject(NgZone);
  private readonly i18n = inject(I18nService);

  private readonly sections = new Map<HTMLElement, number>();
  private annotations: CourseAnnotation[] = [];
  private frame = 0;

  /** Where each annotation was drawn: annotation ID → lesson section index. */
  readonly placed = signal<ReadonlyMap<string, number>>(new Map());
  /** Annotations whose words are no longer in the lesson. */
  readonly missing = signal<ReadonlySet<string>>(new Set());

  register(element: HTMLElement, blockIndex: number): void {
    this.sections.set(element, blockIndex);
    this.schedule();
  }

  unregister(element: HTMLElement): void {
    this.sections.delete(element);
    this.schedule();
  }

  setAnnotations(annotations: CourseAnnotation[]): void {
    this.annotations = annotations.filter((item) => item.kind !== 'bookmark' && item.quote);
    this.schedule();
  }

  /** Repaint after the browser has applied the latest HTML. */
  schedule(): void {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.repaint();
      });
    });
  }

  /** The highlight mark(s) for an annotation, if drawn. */
  marks(id: string): HTMLElement[] {
    for (const element of this.sections.keys()) {
      const found = element.querySelectorAll<HTMLElement>(`mark[data-annotation-id="${CSS.escape(id)}"]`);
      if (found.length) return Array.from(found);
    }
    return [];
  }

  private repaint(): void {
    const sections = Array.from(this.sections.entries()).filter(([element]) => element.isConnected);
    for (const [element] of sections) unpaint(element);

    const texts = sections.map(([element, blockIndex]) => ({ element, blockIndex, text: textOf(element) }));
    const requests = new Map<HTMLElement, PaintRequest[]>();
    const placed = new Map<string, number>();
    const missing = new Set<string>();

    for (const annotation of this.annotations) {
      // The section it was saved in first, then the rest of the lesson.
      const ordered = [
        ...texts.filter((section) => section.blockIndex === annotation.blockIndex),
        ...texts.filter((section) => section.blockIndex !== annotation.blockIndex),
      ];
      let done = false;
      for (const section of ordered) {
        const range = locate(section.text, annotation);
        if (!range) continue;
        const list = requests.get(section.element) ?? [];
        list.push({ id: annotation.id, range, className: 'zb-annotation', title: this.titleFor(annotation) });
        requests.set(section.element, list);
        placed.set(annotation.id, section.blockIndex);
        done = true;
        break;
      }
      if (!done) missing.add(annotation.id);
    }

    for (const [element, list] of requests) {
      paint(element, list);
      for (const mark of Array.from(element.querySelectorAll<HTMLElement>('mark[data-annotation-id]'))) {
        const annotation = this.annotations.find((item) => item.id === mark.getAttribute('data-annotation-id'));
        if (annotation) styleMark(mark, annotation);
      }
    }

    this.zone.run(() => {
      this.placed.set(placed);
      this.missing.set(missing);
    });
  }

  /** Hover text: what the colour means, and the note. */
  private titleFor(annotation: CourseAnnotation): string {
    const option = highlightOption(annotation.color);
    const label = this.i18n.t(option ? option.label : 'Note');
    return annotation.note ? `${label}: ${annotation.note}` : label;
  }
}

/** Colours are inline: lesson HTML is outside the component's styles. */
function styleMark(mark: HTMLElement, annotation: CourseAnnotation): void {
  const option = highlightOption(annotation.color);
  mark.style.color = 'inherit';
  mark.style.borderRadius = '2px';
  mark.style.cursor = 'pointer';
  mark.style.padding = '0';
  mark.style.boxDecorationBreak = 'clone';
  mark.style.setProperty('-webkit-box-decoration-break', 'clone');
  if (option) {
    mark.style.backgroundColor = option.background;
    // A thin line in the colour's darker shade: visible to colour-blind readers and in print.
    mark.style.boxShadow = `inset 0 -2px 0 ${option.accent}`;
  } else {
    mark.style.backgroundColor = 'transparent';
    mark.style.borderBottom = '2px dotted #007979';
  }
  if (annotation.note && option) {
    mark.style.textDecoration = 'underline dotted';
    mark.style.textDecorationColor = option.accent;
    mark.style.textUnderlineOffset = '3px';
  }
}

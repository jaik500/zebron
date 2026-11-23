/**
 * Fillable PDF forms and links in the My documents reader (pdf-view.component).
 *
 * pdf.js draws the page without its form fields (AnnotationMode.ENABLE_FORMS)
 * and an annotation layer puts real inputs, checkboxes, radio buttons and
 * lists on top. What the person types is kept in the document's
 * annotationStorage, so it survives zoom and scrolling, and
 * PDFDocumentProxy.saveDocument() writes it into a new copy of the file.
 *
 * Only form fields (widgets) and links are put in the layer. Links open
 * https and mailto addresses in a new tab, or go to a page of the PDF. The
 * PDF's own scripts never run (enableScripting is off).
 */
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

type Pdfjs = typeof import('pdfjs-dist');
type Viewport = ReturnType<PDFPageProxy['getViewport']>;

/** Addresses a link in a PDF may open. */
const SAFE_LINK = /^(https?:|mailto:)/i;

/** What pdf.js's annotation layer needs from a link service (pdf_link_service.js). */
export interface ReaderLinkService {
  externalLinkEnabled: boolean;
  eventBus: undefined;
  addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
  getDestinationHash(destination: unknown): string;
  getAnchorUrl(hash: string): string;
  goToDestination(destination: unknown): Promise<void>;
  executeNamedAction(action: string): void;
  executeSetOCGState(action: unknown): void;
}

export function createLinkService(
  getPdf: () => PDFDocumentProxy | null,
  pages: { goTo(page: number): void; current(): number; count(): number },
): ReaderLinkService {
  return {
    externalLinkEnabled: true,
    eventBus: undefined,
    addLinkAttributes(link, url) {
      if (!SAFE_LINK.test(String(url ?? '').trim())) {
        link.removeAttribute('href');
        link.title = String(url ?? '');
        return;
      }
      link.href = String(url).trim();
      link.target = '_blank';
      link.rel = 'noopener noreferrer nofollow';
      link.title = link.href;
    },
    getDestinationHash: () => '#',
    getAnchorUrl: () => '#',
    async goToDestination(destination) {
      const pdf = getPdf();
      if (!pdf) return;
      try {
        const explicit = typeof destination === 'string' ? await pdf.getDestination(destination) : destination;
        if (!Array.isArray(explicit) || !explicit.length) return;
        const target = explicit[0];
        const index =
          typeof target === 'number'
            ? target
            : target && typeof target === 'object'
              ? await pdf.getPageIndex(target as Parameters<PDFDocumentProxy['getPageIndex']>[0])
              : -1;
        if (index >= 0) pages.goTo(index + 1);
      } catch {
        // A broken link inside the PDF: do nothing.
      }
    },
    executeNamedAction(action) {
      const page = pages.current();
      const actions: Record<string, number> = { NextPage: page + 1, PrevPage: page - 1, FirstPage: 1, LastPage: pages.count() };
      if (action in actions) pages.goTo(actions[action]);
    },
    executeSetOCGState: () => undefined,
  };
}

/** True when the PDF has form fields a person can fill in. */
export async function hasFillableFields(pdf: PDFDocumentProxy): Promise<boolean> {
  try {
    const fields = await pdf.getFieldObjects();
    if (!fields) return false;
    return Object.values(fields).some((widgets) =>
      (widgets as { type?: string; editable?: boolean; readOnly?: boolean }[]).some(
        (widget) => widget.editable !== false && !widget.readOnly && widget.type !== 'button' && widget.type !== 'signature',
      ),
    );
  } catch {
    return false;
  }
}

/**
 * Put the page's form fields and links on top of the drawn page. Returns the
 * layer, or null when the page has neither.
 */
export async function renderFormLayer(options: {
  pdfjs: Pdfjs;
  pdf: PDFDocumentProxy;
  page: PDFPageProxy;
  viewport: Viewport;
  container: HTMLElement;
  linkService: ReaderLinkService;
  annotationCanvasMap: Map<string, HTMLCanvasElement>;
  /** False when the page was redrawn while the fields were loading. */
  isCurrent?: () => boolean;
}): Promise<HTMLDivElement | null> {
  const { pdfjs, pdf, page, viewport, container, linkService, annotationCanvasMap } = options;
  const isCurrent = options.isCurrent ?? (() => true);
  const all = await page.getAnnotations({ intent: 'display' });
  const annotations = all.filter(
    (annotation: { annotationType?: number }) =>
      annotation.annotationType === pdfjs.AnnotationType.WIDGET || annotation.annotationType === pdfjs.AnnotationType.LINK,
  );
  if (!annotations.length || !isCurrent()) return null;

  const div = document.createElement('div');
  div.className = 'annotationLayer';
  container.appendChild(div);
  const layer = new pdfjs.AnnotationLayer({
    div,
    accessibilityManager: null,
    annotationCanvasMap,
    annotationEditorUIManager: null,
    page,
    viewport: viewport.clone({ dontFlip: true }),
    structTreeLayer: null,
    commentManager: null,
    linkService,
    annotationStorage: pdf.annotationStorage,
  });
  await layer.render({
    viewport: viewport.clone({ dontFlip: true }),
    div,
    annotations,
    page,
    linkService: linkService as never,
    annotationStorage: pdf.annotationStorage,
    imageResourcesPath: '',
    renderForms: true,
    enableScripting: false,
    hasJSActions: false,
    fieldObjects: null,
    annotationCanvasMap,
  });
  if (!isCurrent()) {
    div.remove();
    return null;
  }
  return div;
}

/** File name for a filled-in copy: "Form.pdf" → "Form (filled).pdf". */
export function filledFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '').replace(/ \(filled( \d+)?\)$/i, '');
  return `${base} (filled).pdf`;
}

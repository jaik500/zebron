import { CanDeactivateFn } from '@angular/router';

import type { DocumentReaderComponent } from './document-reader.component';

/** Ask before leaving a PDF form with answers that aren't saved. */
export const leaveDocumentReaderGuard: CanDeactivateFn<DocumentReaderComponent> = (component) =>
  component?.canLeave?.() ?? true;

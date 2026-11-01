import { CanDeactivateFn } from '@angular/router';

import type { CourseBuilderComponent } from './course-builder.component';

/** Ask before leaving the course builder with unsaved changes. */
export const leaveCourseBuilderGuard: CanDeactivateFn<CourseBuilderComponent> = (component) =>
  component?.canLeave?.() ?? true;

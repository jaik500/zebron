import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { Job } from '../../../core/models/job.model';
import { JobStore } from '../stores/job.store';

/**
 * Loads the job before /jobs/:id renders, so the server-rendered page
 * (app.routes.server.ts) already holds the job and its Google job data.
 * An unavailable job resolves to null; the page shows its own message.
 */
export const jobResolver: ResolveFn<Job | null> = async (route) => {
  const store = inject(JobStore);
  const id = route.paramMap.get('id');

  if (!id) {
    return null;
  }

  // Already loaded (for example during hydration after server rendering).
  const current = store.selectedJob();
  if (current?.id === id) {
    return current;
  }

  await store.loadPublicJob(id);
  return store.selectedJob();
};

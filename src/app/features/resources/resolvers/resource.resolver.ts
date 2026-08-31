import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { Resource } from '../../../core/models/resource.model';
import { ResourceStore } from '../stores/resource.store';

export const resourceResolver: ResolveFn<Resource | null> = async (route) => {
  const resourceStore = inject(ResourceStore);

  const slug = route.paramMap.get('slug');

  console.log('[SSR RESOURCE RESOLVER] slug:', slug);

  if (!slug) {
    return null;
  }

  const resource = await resourceStore.loadResourceBySlug(slug);

  console.log(
    '[SSR RESOURCE RESOLVER] resource:',
    resource?.name ?? 'NOT FOUND',
  );

  return resource;
};
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { Location } from '../../core/models/location.model';
import { Resource } from '../../core/models/resource.model';
import { CategoryService } from '../../core/services/category.service';
import { LocationService } from '../../core/services/location.service';
import { ResourceService } from '../../core/services/resource.service';
import { resourceKind } from '../resources/resource-kinds';
import { BootcampProgram } from './bootcamp.model';
import { BootcampService } from './bootcamp.service';

/** A bootcamp on /bootcamps: its resource, programs and place. */
export interface BootcampEntry {
  resource: Resource;
  programs: BootcampProgram[];
  /** "City, ST", or '' when it has no location. */
  place: string;
}

/**
 * Loads every published bootcamp (resources in a Bootcamps category) with
 * its programs before /bootcamps renders, so the server-rendered page lists
 * them for Google. Never fails: an empty list shows instead.
 */
export const bootcampDirectoryResolver: ResolveFn<BootcampEntry[]> = async () => {
  const categoryService = inject(CategoryService);
  const resourceService = inject(ResourceService);
  const locationService = inject(LocationService);
  const bootcampService = inject(BootcampService);

  try {
    const [categories, resources, details, locations] = await Promise.all([
      categoryService.getActiveCategories(),
      resourceService.getPublishedResources(),
      bootcampService.listAll().catch(() => []),
      locationService.getAllLocations().catch(() => [] as Location[]),
    ]);

    const bootcampCategoryIds = new Set(
      categories.filter((category) => resourceKind(category).kind === 'bootcamp').map((category) => category.id),
    );
    const programsById = new Map(details.map((item) => [item.resourceId, item.programs]));
    const placesById = new Map(locations.map((place) => [place.id ?? '', [place.city, place.state].filter(Boolean).join(', ')]));

    return resources
      .filter((resource) => bootcampCategoryIds.has(resource.categoryId))
      .map((resource) => ({
        resource,
        programs: programsById.get(resource.id) ?? [],
        place: (resource.locationId && placesById.get(resource.locationId)) || '',
      }));
  } catch (error) {
    console.error('Failed to load bootcamps:', error);
    return [];
  }
};

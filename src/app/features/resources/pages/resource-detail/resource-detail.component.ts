import { Component, inject, input, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ResourceCardComponent } from '../../components/resource-card/resource-card.component';
import { Resource } from '../../../../core/models/resource.model';
import { ResourceService } from '../../../../core/services/resource.service';
import { Location } from '../../../../core/models/location.model';
import { LocationService } from '../../../../core/services/location.service';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [RouterLink, ResourceCardComponent, CommonModule],
  template: `
   <main class="mx-auto max-w-7xl p-8">
  <a
    routerLink="/resources"
    class="text-sm text-gray-600 hover:text-gray-900"
  >
    ← Back to resources
  </a>

  @if (loading()) {
    <p class="mt-8 text-gray-600">
      Loading resource...
    </p>
  }

  @if (error()) {
    <div class="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
      <p class="text-red-700">
        {{ error() }}
      </p>
    </div>
  }

  @if (!loading() && !error() && resource()) {
    <!-- Main content + right sidebar -->
    <div class="mt-8 grid gap-8 lg:grid-cols-3">

      <!-- Main resource content -->
      <article class="lg:col-span-2">

        <!-- Resource header -->
        <div class="flex items-start justify-between gap-6">
          <div>
            <h1 class="text-4xl font-bold text-gray-900">
              {{ resource()!.name }}
            </h1>

            @if (category()) {
              <a
                [routerLink]="['/resources']"
                [queryParams]="{ category: category()!.slug }"
                class="mt-2 inline-block text-sm font-medium text-blue-600
                      hover:text-blue-800 hover:underline"
              >
                {{ category()!.name }}
              </a>
            }

            <p class="mt-1 text-gray-500">
              {{ resource()!.resourceType }}
            </p>
          </div>

          @if (resource()!.featured) {
            <span
              class="rounded-full bg-yellow-100 px-3 py-1 text-sm
                     font-medium text-yellow-800"
            >
              Featured
            </span>
          }
        </div>

        @if (resource()!.verified) {
          <div
            class="mt-4 inline-flex items-center gap-2 rounded-full
                  bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700"
          >
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full
                    bg-green-600 text-xs text-white"
            >
              ✓
            </span>

            Verified resource
          </div>
        } @else {
          <div
            class="mt-4 inline-flex items-center gap-2 rounded-full
                  bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600"
          >
            <span
              class="flex h-5 w-5 items-center justify-center rounded-full
                    bg-gray-400 text-xs text-white"
            >
              ?
            </span>

            Not yet verified
          </div>
        }

        @if (resource()!.lastVerifiedAt) {
          <p class="mt-2 text-sm text-gray-500">
            Last verified
            {{ resource()!.lastVerifiedAt!.toDate() | date:'MMMM d, y' }}
          </p>
        }

        <!-- About -->
        <div class="mt-8">
          <h2 class="text-xl font-semibold">
            About this resource
          </h2>

          <p class="mt-3 leading-7 text-gray-600">
            {{ resource()!.description }}
          </p>
        </div>

        <!-- Contact and availability -->
        <div class="mt-8 grid gap-6 sm:grid-cols-2">

          @if (resource()!.website) {
            <div>
              <h3 class="font-semibold">
                Website
              </h3>

              <a
                [href]="resource()!.website"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 block text-blue-600 hover:underline"
              >
                Visit website
              </a>
            </div>
          }

          @if (resource()!.phone) {
            <div>
              <h3 class="font-semibold">
                Phone
              </h3>

              <a
                [href]="'tel:' + resource()!.phone"
                class="mt-1 block text-blue-600 hover:underline"
              >
                {{ resource()!.phone }}
              </a>
            </div>
          }

          @if (resource()!.email) {
            <div>
              <h3 class="font-semibold">
                Email
              </h3>

              <a
                [href]="'mailto:' + resource()!.email"
                class="mt-1 block text-blue-600 hover:underline"
              >
                {{ resource()!.email }}
              </a>
            </div>
          }

          @if (resource()!.online) {
            <div>
              <h3 class="font-semibold">
                Availability
              </h3>

              <p class="mt-1 text-gray-600">
                Available online
              </p>
            </div>
          }

        </div>

        <!-- Location -->
        @if (location()) {
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900">
              Location
            </h2>

            <div
              class="mt-4 rounded-xl border border-gray-200
                     bg-gray-50 p-5"
            >

              @if (location()?.address) {
                <p class="text-gray-700">
                  {{ location()?.address }}
                </p>
              }

              @if (
                location()?.city ||
                location()?.state ||
                location()?.zipCode
              ) {
                <p class="mt-1 text-gray-600">

                  @if (location()?.city) {
                    {{ location()?.city }}
                  }

                  @if (
                    location()?.city &&
                    location()?.state
                  ) {
                    ,
                  }

                  @if (location()?.state) {
                    {{ location()?.state }}
                  }

                  @if (location()?.zipCode) {
                    {{ location()?.zipCode }}
                  }

                </p>
              }

              @if (location()?.country) {
                <p class="mt-1 text-gray-600">
                  {{ location()?.country }}
                </p>
              }

              @if (
                location()?.latitude !== undefined &&
                location()?.longitude !== undefined
              ) {
                <a
                  class="mt-4 inline-block text-blue-600 hover:underline"
                  [href]="
                    'https://www.google.com/maps/search/?api=1&query=' +
                    location()?.latitude +
                    ',' +
                    location()?.longitude
                  "
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on map
                </a>
              }

            </div>
          </div>
        }

        <!-- Cost -->
        @if (resource()!.cost) {
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900">
              Cost
            </h2>

            <div
              class="mt-3 rounded-xl border border-gray-200
                     bg-gray-50 p-5"
            >

              @if (resource()!.cost!.free) {
                <p class="font-medium text-green-700">
                  Free
                </p>
              } @else {
                <p class="font-medium text-gray-700">
                  Cost information available
                </p>
              }

              @if (resource()!.cost!.description) {
                <p class="mt-2 text-gray-600">
                  {{ resource()!.cost!.description }}
                </p>
              }

            </div>
          </div>
        }

        <!-- Availability -->
        @if (resource()!.availability) {
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900">
              Availability
            </h2>

            <div
              class="mt-4 rounded-xl border border-gray-200
                    bg-gray-50 p-5"
            >

              @if (resource()!.availability!.alwaysAvailable) {
                <p class="font-medium text-green-700">
                  Available 24/7
                </p>
              }

              @if (resource()!.availability!.byAppointment) {
                <p class="font-medium text-blue-700">
                  Available by appointment
                </p>
              }

              @if (
                !resource()!.availability!.alwaysAvailable &&
                !resource()!.availability!.byAppointment
              ) {
                <div class="space-y-2 text-sm">

                  @if (resource()!.availability!.monday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Monday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.monday!.open) {
                          {{ resource()!.availability!.monday!.openTime }}
                          –
                          {{ resource()!.availability!.monday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.tuesday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Tuesday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.tuesday!.open) {
                          {{ resource()!.availability!.tuesday!.openTime }}
                          –
                          {{ resource()!.availability!.tuesday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.wednesday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Wednesday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.wednesday!.open) {
                          {{ resource()!.availability!.wednesday!.openTime }}
                          –
                          {{ resource()!.availability!.wednesday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.thursday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Thursday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.thursday!.open) {
                          {{ resource()!.availability!.thursday!.openTime }}
                          –
                          {{ resource()!.availability!.thursday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.friday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Friday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.friday!.open) {
                          {{ resource()!.availability!.friday!.openTime }}
                          –
                          {{ resource()!.availability!.friday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.saturday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Saturday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.saturday!.open) {
                          {{ resource()!.availability!.saturday!.openTime }}
                          –
                          {{ resource()!.availability!.saturday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                  @if (resource()!.availability!.sunday) {
                    <div class="flex justify-between gap-4">
                      <span class="font-medium text-gray-700">
                        Sunday
                      </span>

                      <span class="text-gray-600">
                        @if (resource()!.availability!.sunday!.open) {
                          {{ resource()!.availability!.sunday!.openTime }}
                          –
                          {{ resource()!.availability!.sunday!.closeTime }}
                        } @else {
                          Closed
                        }
                      </span>
                    </div>
                  }

                </div>
              }

            </div>
          </div>
        }

        <!-- Tags -->
        @if (resource()!.tags.length > 0) {
          <div class="mt-8">
            <h2 class="font-semibold">
              Tags
            </h2>

            <div class="mt-3 flex flex-wrap gap-2">
              @for (tag of resource()!.tags; track tag) {
                <span
                  class="rounded-full bg-gray-100 px-3 py-1 text-sm
                         text-gray-700"
                >
                  {{ tag }}
                </span>
              }
            </div>
          </div>
        }

      </article>

      <!-- Right sidebar -->
      <aside class="lg:col-span-1">

        @if (relatedLoading()) {
          <div
            class="rounded-xl border border-gray-200
                   bg-white p-5 shadow-sm"
          >
            <h2 class="text-xl font-semibold text-gray-900">
              Related Resources
            </h2>

            <p class="mt-3 text-sm text-gray-500">
              Loading related resources...
            </p>
          </div>
        }

        @if (
          !relatedLoading() &&
          relatedResources().length > 0
        ) {
          <div class="lg:sticky lg:top-6">
            <div
              class="rounded-xl border border-gray-200
                     bg-white p-5 shadow-sm"
            >
              <h2 class="text-xl font-semibold text-gray-900">
                Related Resources
              </h2>

              <p class="mt-2 text-sm text-gray-600">
                Other resources in this category.
              </p>

              <div class="mt-6 grid gap-2">
                @for (
                  relatedResource of relatedResources();
                  track relatedResource.id
                ) {
                  <app-resource-card
                    [resource]="relatedResource"
                  />
                }
              </div>

            </div>
          </div>
        }

      </aside>

    </div>
  }
</main>
  `,
  styles: [],
})
export class ResourceDetailComponent {
  private readonly resourceService = inject(ResourceService);
  private readonly locationService = inject(LocationService);
  private readonly categoryService = inject(CategoryService);

  readonly slug = input.required<string>();

  protected readonly resource = signal<Resource | null>(null);
  protected readonly location = signal<Location | null>(null);
  protected readonly category = signal<Category | null>(null);
  protected readonly relatedResources = signal<Resource[]>([]);
  protected readonly relatedLoading = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
  // Reload the resource whenever the route slug changes.
  effect(() => {
    this.slug();
    this.loadResource();
  });
}

 private async loadResource(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);

  try {
    const resource =
      await this.resourceService.getResourceBySlug(this.slug());

    if (!resource) {
      this.error.set('Resource not found.');
      return;
    }

    this.resource.set(resource);

    // Load the location associated with this resource.
    if (resource.locationId) {
      const location =
        await this.locationService.getLocationById(
          resource.locationId
        );

      this.location.set(location);
    }

        // Load the category associated with this resource.
    if (resource.categoryId) {
      const category =
        await this.categoryService.getCategoryById(
          resource.categoryId
        );

      this.category.set(category);
    }

    // Load other published resources from the same category.
    await this.loadRelatedResources(resource);
  } catch (error) {
    console.error('Failed to load resource:', error);

    this.error.set(
      'Unable to load this resource. Please try again later.'
    );
  } finally {
    this.loading.set(false);
  }
}

  private async loadRelatedResources(
    resource: Resource
  ): Promise<void> {
    if (!resource.categoryId) {
      return;
    }

    this.relatedLoading.set(true);

    try {
      const related =
        await this.resourceService.getRelatedResources(
          resource.categoryId,
          resource.id
        );

      this.relatedResources.set(related);
    } catch (error) {
      console.error(
        'Failed to load related resources:',
        error
      );
    } finally {
      this.relatedLoading.set(false);
    }
  }
}
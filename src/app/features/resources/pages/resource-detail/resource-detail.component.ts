import { Component, DOCUMENT, effect, inject, input, signal } from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { Resource } from '../../../../core/models/resource.model';

import { ResourceStore } from '../../stores/resource.store';

import { Location } from '../../../../core/models/location.model';

import { LocationService } from '../../../../core/services/location.service';

import { Category } from '../../../../core/models/category.model';

import { CategoryService } from '../../../../core/services/category.service';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-resource-detail',

  standalone: true,

  imports: [CommonModule, RouterLink, MatIconModule],

  template: `
    <!-- =========================================================
         ZEBRON HEADER
         ========================================================= -->
    <header
      class="border-b
         border-white/10
         bg-[#032D42]"
    >
      <div
        class="mx-auto
           flex
           max-w-7xl
           items-center
           justify-between
           px-5
           py-3
           sm:px-6
           lg:px-8"
      >
        <!-- Logo -->

        <a
          routerLink="/"
          class="flex
             items-center
             gap-2
             text-white"
          aria-label="Zebron home"
        >
          <img
            src="/zebron-favicon.svg"
            alt=""
            class="h-7
               w-7"
          />

          <span
            class="text-lg
               font-bold
               tracking-tight"
          >
            Zebron
          </span>
        </a>

        <!-- Desktop navigation -->

        <nav
          class="hidden
             items-center
             gap-6
             md:flex"
          aria-label="Primary navigation"
        >
          <a
            routerLink="/resources"
            class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
          >
            Resources
          </a>

          <a
            routerLink="/find"
            class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
          >
            Find Jobs
          </a>

          <a
            routerLink="/test-center"
            class="text-sm
         font-medium
         text-white
         transition
         hover:text-[#12BFC3]"
          >
            Test Center
          </a>

          <a
            routerLink="/about"
            class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
          >
            About
          </a>

          <a
            routerLink="/contact"
            class="text-sm
               font-medium
               text-white
               transition
               hover:text-[#12BFC3]"
          >
            Contact
          </a>

          <a
            routerLink="/submit"
            class="rounded-lg
                   bg-[#007979]
                   px-4
                   py-2
                   text-sm
                   font-semibold
                   text-white
                   shadow-sm
                   transition
                   hover:bg-[#006666]"
          >
            Add Resource
          </a>
        </nav>
      </div>
    </header>

    <!-- =========================================================
         PAGE
         ========================================================= -->

    <main
      class="mx-auto
             max-w-7xl
             px-5
             py-8
             sm:px-6
             lg:px-8
             lg:py-10"
    >
      <!-- =======================================================
           LOADING
           ======================================================= -->

      @if (loading()) {
        <div
          class="py-16
                 text-center
                 text-sm
                 text-gray-500"
        >
          Loading resource...
        </div>
      }

      <!-- =======================================================
           ERROR
           ======================================================= -->

      @if (error()) {
        <div
          class="rounded-xl
                 border
                 border-red-200
                 bg-red-50
                 p-5"
        >
          <p
            class="text-sm
                   text-red-700"
          >
            {{ error() }}
          </p>
        </div>
      }

      <!-- =======================================================
           RESOURCE CONTENT
           ======================================================= -->

      @if (!loading() && !error() && resource()) {
        <div
          class="grid
                 gap-8
                 lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]
                 lg:items-start"
        >
          <!-- ===================================================
               MAIN RESOURCE
               =================================================== -->

          <article>
            <!-- =================================================
                 RESOURCE HEADER
                 ================================================= -->

            <header
              class="border-b
                     border-gray-200
                     pb-6"
            >
              <div
                class="flex
                       flex-wrap
                       items-start
                       justify-between
                       gap-4"
              >
                <div
                  class="min-w-0
                         flex-1"
                >
                  <h1
                    class="text-3xl
                           font-bold
                           tracking-tight
                           text-[#032D42]
                           sm:text-4xl"
                  >
                    {{ resource()!.name }}
                  </h1>

                  <!-- Category -->

                  @if (category()) {
                    <a
                      [routerLink]="['/resources']"
                      [queryParams]="{
                        category: category()!.slug,
                      }"
                      class="mt-2
                             inline-block
                             text-sm
                             font-semibold
                             text-[#007979]
                             hover:underline"
                    >
                      {{ category()!.name }}
                    </a>
                  }
                </div>

                <!-- Featured -->

                @if (resource()!.featured) {
                  <span
                    class="shrink-0
                           rounded-full
                           border
                           border-yellow-300
                           bg-yellow-50
                           px-3
                           py-1
                           text-xs
                           font-semibold
                           text-yellow-800"
                  >
                    Featured
                  </span>
                }
              </div>

              <!-- Verification -->

              @if (resource()!.verified) {
                <div
                  class="mt-4
                         inline-flex
                         items-center
                         gap-2
                         rounded-full
                         bg-green-50
                         px-3
                         py-1.5
                         text-sm
                         font-medium
                         text-green-700"
                >
                  <span
                    class="flex
                           h-5
                           w-5
                           items-center
                           justify-center
                           rounded-full
                           bg-green-600
                           text-xs
                           font-bold
                           text-white"
                  >
                    ✓
                  </span>

                  Verified resource
                </div>
              } @else {
                <div
                  class="mt-4
                         inline-flex
                         items-center
                         gap-2
                         rounded-full
                         bg-gray-100
                         px-3
                         py-1.5
                         text-sm
                         font-medium
                         text-gray-600"
                >
                  <span
                    class="flex
                           h-5
                           w-5
                           items-center
                           justify-center
                           rounded-full
                           bg-gray-400
                           text-xs
                           font-bold
                           text-white"
                  >
                    ?
                  </span>

                  Not yet verified
                </div>
              }

              <!-- Last verified -->

              @if (resource()!.lastVerifiedAt) {
                <p
                  class="mt-2
                         text-xs
                         text-gray-500"
                >
                  Last verified
                  {{ resource()!.lastVerifiedAt!.toDate() | date: 'MMMM d, y' }}
                </p>
              }
            </header>

            <!-- =================================================
                 ABOUT
                 ================================================= -->

            <section
              class="border-b
                     border-gray-200
                     py-6"
            >
              <h2
                class="text-lg
                       font-bold
                       text-[#032D42]"
              >
                About this resource
              </h2>

              <p
                class="mt-2
                       text-sm
                       leading-6
                       text-gray-600"
              >
                {{ resource()!.description }}
              </p>
            </section>

            <!-- =================================================
                 CONTACT / AVAILABILITY
                 ================================================= -->

            <section
              class="grid
                     gap-5
                     border-b
                     border-gray-200
                     py-6
                     sm:grid-cols-2"
            >
              <!-- Website -->

              @if (resource()!.website) {
                <div
                  class="flex
                         gap-3"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> language </mat-icon>

                  <div>
                    <h3
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      Website
                    </h3>

                    <a
                      [href]="resource()!.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-1
                             inline-flex
                             items-center
                             gap-1
                             text-sm
                             font-medium
                             text-[#007979]
                             hover:underline"
                    >
                      Visit website
                      <mat-icon
                        aria-hidden="true"
                        class="!m-0
                               !h-4
                               !w-4
                               !text-[16px]"
                      >
                        open_in_new
                      </mat-icon>
                    </a>
                  </div>
                </div>
              }

              <!-- Phone -->

              @if (resource()!.phone) {
                <div
                  class="flex
                         gap-3"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> phone </mat-icon>

                  <div>
                    <h3
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      Phone
                    </h3>

                    <a
                      [href]="'tel:' + resource()!.phone"
                      class="mt-1
                             block
                             text-sm
                             font-medium
                             text-[#007979]
                             hover:underline"
                    >
                      {{ resource()!.phone }}
                    </a>
                  </div>
                </div>
              }

              <!-- Email -->

              @if (resource()!.email) {
                <div
                  class="flex
                         gap-3"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> mail_outline </mat-icon>

                  <div>
                    <h3
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      Email
                    </h3>

                    <a
                      [href]="'mailto:' + resource()!.email"
                      class="mt-1
                             block
                             break-all
                             text-sm
                             font-medium
                             text-[#007979]
                             hover:underline"
                    >
                      {{ resource()!.email }}
                    </a>
                  </div>
                </div>
              }

              <!-- Online -->

              @if (resource()!.online) {
                <div
                  class="flex
                         gap-3"
                >
                  <mat-icon aria-hidden="true" class="!text-[#007979]"> computer </mat-icon>

                  <div>
                    <h3
                      class="text-sm
                             font-bold
                             text-[#032D42]"
                    >
                      Availability
                    </h3>

                    <p
                      class="mt-1
                             text-sm
                             text-gray-600"
                    >
                      Available online
                    </p>
                  </div>
                </div>
              }
            </section>

            <!-- =================================================
                 LOCATION
                 ================================================= -->

            @if (location()) {
              <section
                class="border-b
                       border-gray-200
                       py-6"
              >
                <h2
                  class="text-lg
                         font-bold
                         text-[#032D42]"
                >
                  Location
                </h2>

                <div
                  class="mt-3
                         flex
                         items-center
                         justify-between
                         gap-4
                         rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  <div
                    class="flex
                           min-w-0
                           gap-3"
                  >
                    <mat-icon aria-hidden="true" class="!text-[#007979]"> location_on </mat-icon>

                    <div
                      class="text-sm
                             leading-6
                             text-gray-600"
                    >
                      @if (location()?.address) {
                        <p>
                          {{ location()?.address }}
                        </p>
                      }

                      @if (location()?.city || location()?.state || location()?.zipCode) {
                        <p>
                          @if (location()?.city) {
                            {{ location()?.city }}
                          }

                          @if (location()?.city && location()?.state) {
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
                        <p>
                          {{ location()?.country }}
                        </p>
                      }
                    </div>
                  </div>

                  @if (location()?.latitude !== undefined && location()?.longitude !== undefined) {
                    <a
                      class="shrink-0
                             text-xs
                             font-semibold
                             text-[#007979]
                             hover:underline"
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
                      <mat-icon
                        aria-hidden="true"
                        class="!m-0
                               !h-4
                               !w-4
                               !text-[15px]
                               !align-middle"
                      >
                        open_in_new
                      </mat-icon>
                    </a>
                  }
                </div>
              </section>
            }

            <!-- =================================================
                 COST
                 ================================================= -->

            @if (resource()!.cost) {
              <section
                class="border-b
                       border-gray-200
                       py-6"
              >
                <h2
                  class="text-lg
                         font-bold
                         text-[#032D42]"
                >
                  Cost
                </h2>

                <div
                  class="mt-3
                         rounded-xl
                         border
                         border-green-200
                         bg-green-50
                         p-4"
                >
                  <div
                    class="flex
                           items-center
                           gap-3"
                  >
                    <span
                      class="flex
                             h-7
                             w-7
                             items-center
                             justify-center
                             rounded-full
                             bg-green-600
                             text-sm
                             font-bold
                             text-white"
                    >
                      $
                    </span>

                    <div>
                      @if (resource()!.cost!.free) {
                        <p
                          class="text-sm
                                 font-bold
                                 text-green-700"
                        >
                          Free
                        </p>
                      } @else {
                        <p
                          class="text-sm
                                 font-semibold
                                 text-gray-700"
                        >
                          Cost information available
                        </p>
                      }

                      @if (resource()!.cost!.description) {
                        <p
                          class="mt-1
                                 text-xs
                                 text-gray-600"
                        >
                          {{ resource()!.cost!.description }}
                        </p>
                      }
                    </div>
                  </div>
                </div>
              </section>
            }

            <!-- =================================================
                 AVAILABILITY
                 ================================================= -->

            @if (resource()!.availability) {
              <section
                class="border-b
                       border-gray-200
                       py-6"
              >
                <h2
                  class="text-lg
                         font-bold
                         text-[#032D42]"
                >
                  Availability
                </h2>

                <div
                  class="mt-3
                         rounded-xl
                         border
                         border-gray-200
                         bg-gray-50
                         p-4"
                >
                  @if (resource()!.availability!.alwaysAvailable) {
                    <p
                      class="text-sm
                             font-semibold
                             text-green-700"
                    >
                      Available 24/7
                    </p>
                  }

                  @if (resource()!.availability!.byAppointment) {
                    <p
                      class="text-sm
                             font-semibold
                             text-[#007979]"
                    >
                      Available by appointment
                    </p>
                  }

                  @if (
                    !resource()!.availability!.alwaysAvailable &&
                    !resource()!.availability!.byAppointment
                  ) {
                    <div
                      class="space-y-2
                             text-sm"
                    >
                      @if (resource()!.availability!.monday) {
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
                        <div
                          class="flex
                                 justify-between
                                 gap-4"
                        >
                          <span
                            class="font-medium
                                   text-gray-700"
                          >
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
              </section>
            }

            <!-- =================================================
                 TAGS
                 ================================================= -->

            @if (resource()!.tags.length > 0) {
              <section class="py-6">
                <h2
                  class="text-lg
                         font-bold
                         text-[#032D42]"
                >
                  Tags
                </h2>

                <div
                  class="mt-3
                         flex
                         flex-wrap
                         gap-2"
                >
                  @for (tag of resource()!.tags; track tag) {
                    <span
                      class="rounded-full
                             bg-gray-100
                             px-3
                             py-1
                             text-xs
                             font-medium
                             text-gray-700"
                    >
                      {{ tag }}
                    </span>
                  }
                </div>
              </section>
            }
          </article>

          <!-- ===================================================
               RELATED RESOURCES
               =================================================== -->

          @if (!relatedLoading() && relatedResources().length > 0) {
            <aside
              class="lg:sticky
                     lg:top-6"
            >
              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <!-- Header -->

                <div
                  class="flex
                         items-center
                         justify-between
                         gap-3"
                >
                  <div>
                    <h2
                      class="text-lg
                             font-bold
                             text-[#032D42]"
                    >
                      Related Resources
                    </h2>

                    <p
                      class="mt-1
                             text-xs
                             text-gray-500"
                    >
                      Other resources in this category.
                    </p>
                  </div>

                  <span
                    class="flex
                           h-9
                           w-9
                           shrink-0
                           items-center
                           justify-center
                           rounded-full
                           bg-[#E8F4F4]"
                  >
                    <mat-icon aria-hidden="true" class="!text-[#007979]"> hub </mat-icon>
                  </span>
                </div>

                <!-- Related resources -->

                <div
                  class="mt-4
                         divide-y
                         divide-gray-200"
                >
                  @for (relatedResource of relatedResources(); track relatedResource.id) {
                    <a
                      [routerLink]="['/resources', relatedResource.slug]"
                      class="block
                             py-4
                             first:pt-0
                             last:pb-0
                             transition
                             hover:bg-gray-50"
                    >
                      <div
                        class="flex
                               items-start
                               justify-between
                               gap-2"
                      >
                        <h3
                          class="min-w-0
                                 text-sm
                                 font-bold
                                 leading-5
                                 text-[#032D42]"
                        >
                          {{ relatedResource.name }}
                        </h3>

                        @if (relatedResource.featured) {
                          <span
                            class="shrink-0
                                   rounded-full
                                   bg-yellow-50
                                   px-2
                                   py-0.5
                                   text-[10px]
                                   font-semibold
                                   text-yellow-700"
                          >
                            Featured
                          </span>
                        }
                      </div>

                      @if (relatedResource.description) {
                        <p
                          class="mt-2
                                 line-clamp-3
                                 text-xs
                                 leading-5
                                 text-gray-600"
                        >
                          {{ relatedResource.description }}
                        </p>
                      }

                      <div
                        class="mt-2
                               flex
                               items-center
                               justify-between
                               gap-3
                               text-[11px]
                               text-gray-500"
                      >
                        @if (relatedResource.online) {
                          <span
                            class="inline-flex
                                   items-center
                                   gap-1"
                          >
                            <mat-icon
                              aria-hidden="true"
                              class="!m-0
                                     !h-4
                                     !w-4
                                     !text-[15px]"
                            >
                              computer
                            </mat-icon>

                            Available online
                          </span>
                        } @else {
                          <span></span>
                        }

                        @if (relatedResource.cost?.free) {
                          <span
                            class="font-semibold
                                   text-green-700"
                          >
                            Free
                          </span>
                        }
                      </div>
                    </a>
                  }
                </div>

                <!-- More resources -->

                <a
                  [routerLink]="['/resources']"
                  [queryParams]="{
                    category: category()?.slug,
                  }"
                  class="mt-4
                         flex
                         items-center
                         justify-center
                         gap-2
                         border-t
                         border-gray-200
                         pt-4
                         text-sm
                         font-semibold
                         text-[#007979]
                         hover:text-[#032D42]"
                >
                  View more resources

                  <mat-icon
                    aria-hidden="true"
                    class="!m-0
                           !h-5
                           !w-5
                           !text-[18px]"
                  >
                    arrow_forward
                  </mat-icon>
                </a>
              </section>
            </aside>
          }
        </div>
      }
    </main>
  `,

  styles: [],
})
export class ResourceDetailComponent {
  // =========================================================
  // SERVICES
  // =========================================================

  private readonly resourceStore = inject(ResourceStore);

  private readonly title = inject(Title);

  private readonly document = inject(DOCUMENT);

  private readonly meta = inject(Meta);

  private readonly locationService = inject(LocationService);

  private readonly categoryService = inject(CategoryService);

  // =========================================================
  // ROUTE INPUT
  // =========================================================

  readonly slug = input.required<string>();

  // =========================================================
  // VIEW STATE
  // =========================================================

  protected readonly location = signal<Location | null>(null);

  protected readonly category = signal<Category | null>(null);

  protected readonly relatedLoading = signal(false);

  // =========================================================
  // RESOURCE STORE STATE
  // =========================================================

  protected readonly resource = this.resourceStore.selectedResource;

  protected readonly relatedResources = this.resourceStore.relatedResources;

  protected readonly loading = this.resourceStore.loading;

  protected readonly error = this.resourceStore.error;

  // =========================================================
  // INITIALIZATION
  // =========================================================

  constructor() {
    effect(() => {
      const resource = this.resourceStore.selectedResource();

      if (!resource) {
        return;
      }

      // Update SEO whenever the selected resource changes.

      this.updateSeoMetadata(resource);

      this.updateStructuredData(resource);

      // Load supporting data.

      this.loadCategory(resource.categoryId);

      this.loadLocation(resource.locationId);

      this.loadRelatedResources(resource);
    });
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  private async loadCategory(categoryId?: string): Promise<void> {
    if (!categoryId) {
      this.category.set(null);

      return;
    }

    try {
      const category = await this.categoryService.getCategoryById(categoryId);

      this.category.set(category);
    } catch (error) {
      console.error('Failed to load resource category:', error);

      this.category.set(null);
    }
  }

  // =========================================================
  // LOCATION
  // =========================================================

  private async loadLocation(locationId?: string): Promise<void> {
    if (!locationId) {
      this.location.set(null);

      return;
    }

    try {
      const location = await this.locationService.getLocationById(locationId);

      this.location.set(location);
    } catch (error) {
      console.error('Failed to load resource location:', error);

      this.location.set(null);
    }
  }

  // =========================================================
  // RELATED RESOURCES
  // =========================================================

  private async loadRelatedResources(resource: Resource): Promise<void> {
    if (!resource.categoryId || !resource.id) {
      return;
    }

    this.relatedLoading.set(true);

    try {
      await this.resourceStore.loadRelatedResources(resource.categoryId, resource.id, 3);
    } catch (error) {
      console.error('Failed to load related resources:', error);
    } finally {
      this.relatedLoading.set(false);
    }
  }

  // =========================================================
  // SEO DESCRIPTION
  // =========================================================

  /**
   * Create an SEO-friendly description
   * without cutting a word in the middle.
   */

  private createSeoDescription(description: string, maxLength = 160): string {
    const text = description.trim();

    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);

    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace <= 0) {
      return truncated;
    }

    return `${truncated.substring(0, lastSpace)}…`;
  }

  // =========================================================
  // STRUCTURED DATA
  // =========================================================

  /**
   * Add JSON-LD structured data to the
   * server-generated document.
   */

  private updateStructuredData(resource: Resource): void {
    const name = resource.name?.trim() || 'Resource';

    const description = resource.description?.trim() || `Learn more about ${name} on Zebron.`;

    const canonicalUrl = `https://zebron.org/resources/${resource.slug}`;

    const existingScript = this.document.head.querySelector(
      'script[data-zebron-structured-data="resource"]',
    );

    const script = existingScript ?? this.document.createElement('script');

    script.setAttribute('type', 'application/ld+json');

    script.setAttribute('data-zebron-structured-data', 'resource');

    const structuredData: Record<string, unknown> = {
      '@context': 'https://schema.org',

      '@type': 'WebPage',

      name,

      description: this.createSeoDescription(description),

      url: canonicalUrl,

      isPartOf: {
        '@type': 'WebSite',

        name: 'Zebron',

        url: 'https://zebron.org/',
      },

      publisher: {
        '@type': 'Organization',

        name: 'Zebron',

        url: 'https://zebron.org/',
      },
    };

    if (resource.website) {
      structuredData['mainEntity'] = {
        '@type': 'Thing',

        name,

        url: resource.website,
      };
    }

    script.textContent = JSON.stringify(structuredData);

    if (!existingScript) {
      this.document.head.appendChild(script);
    }
  }

  // =========================================================
  // SEO METADATA
  // =========================================================

  private updateSeoMetadata(resource: Resource): void {
    const name = resource.name?.trim() || 'Resource';

    const description = resource.description?.trim() || `Learn more about ${name} on Zebron.`;

    const seoDescription = this.createSeoDescription(description);

    const pageTitle = `${name} | Zebron`;

    const canonicalUrl = `https://zebron.org/resources/${resource.slug}`;

    // Browser / search title.

    this.title.setTitle(pageTitle);

    // Description.

    this.meta.updateTag({
      name: 'description',

      content: seoDescription,
    });

    // Canonical URL.

    const canonicalLink = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      const link = this.document.createElement('link');

      link.setAttribute('rel', 'canonical');

      link.setAttribute('href', canonicalUrl);

      this.document.head.appendChild(link);
    }

    // Open Graph.

    this.meta.updateTag({
      property: 'og:title',

      content: pageTitle,
    });

    this.meta.updateTag({
      property: 'og:description',

      content: seoDescription,
    });

    this.meta.updateTag({
      property: 'og:type',

      content: 'website',
    });

    this.meta.updateTag({
      property: 'og:url',

      content: canonicalUrl,
    });

    // Twitter.

    this.meta.updateTag({
      name: 'twitter:card',

      content: 'summary',
    });

    this.meta.updateTag({
      name: 'twitter:title',

      content: pageTitle,
    });

    this.meta.updateTag({
      name: 'twitter:description',

      content: seoDescription,
    });
  }
}

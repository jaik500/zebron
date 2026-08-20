import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Resource } from '../../../../core/models/resource.model';
import { ResourceService } from '../../../../core/services/resource.service';

@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-4xl p-8">
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
        <article class="mt-8">
          <div class="flex items-start justify-between gap-6">
            <div>
              <h1 class="text-4xl font-bold text-gray-900">
                {{ resource()!.name }}
              </h1>

              <p class="mt-2 text-gray-500">
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

          <div class="mt-8">
            <h2 class="text-xl font-semibold">
              About this resource
            </h2>

            <p class="mt-3 leading-7 text-gray-600">
              {{ resource()!.description }}
            </p>
          </div>

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
      }
    </main>
  `,
  styles: [],
})
export class ResourceDetailComponent implements OnInit {
  private readonly resourceService = inject(ResourceService);

  readonly slug = input.required<string>();

  protected readonly resource = signal<Resource | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadResource();
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
    } catch (error) {
      console.error('Failed to load resource:', error);

      this.error.set(
        'Unable to load this resource. Please try again later.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
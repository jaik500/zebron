import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Resource } from '../../../../core/models/resource.model';

@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/resources', resource().slug]"
      class="block rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm
             transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <!-- Card Header -->
      <div class="flex items-start justify-between gap-1">
        <div class="min-w-0 flex-1">
          <!-- Resource name -->
          <h2
            class="truncate text-base font-semibold
             leading-5 text-gray-900
             sm:text-xl sm:leading-6"
            [title]="resource().name"
          >
            {{ resource().name }}
          </h2>

          <!-- Resource metadata -->
          <div class="mt-0.5 flex flex-wrap items-center gap-1">
            <!-- Resource type -->
            <span
              class="rounded-full bg-gray-100
               px-1.5 py-0
               text-[13px] font-medium
               leading-3 text-gray-700"
            >
              {{ resource().resourceType }}
            </span>

            <!-- Category -->
            @if (categoryName()) {
              <span
                class="rounded-full bg-blue-50
                 px-1.5 py-0
                 text-[14px] font-medium
                 leading-3 text-blue-700"
              >
                {{ categoryName() }}
              </span>
            }
          </div>
        </div>

        <!-- Featured -->
        @if (resource().featured) {
          <span
            class="shrink-0 rounded-full
             bg-yellow-100
             px-1.5 py-0
             text-[12px] font-medium
             leading-3 text-yellow-800"
          >
            Featured
          </span>
        }
      </div>

      <p class="mt-4 line-clamp-3 text-gray-600">
        {{ resource().description }}
      </p>

      @if (resource().online) {
        <div class="mt-4 text-sm text-gray-500">Available online</div>
      }

      @if (resource().cost) {
        <div class="mt-2 text-md">
          @if (resource().cost?.free) {
            <span class="font-medium text-green-600"> Free </span>
          } @else if (resource().cost?.description) {
            <span class="text-gray-600">
              {{ resource().cost?.description }}
            </span>
          }
        </div>
      }
    </a>
  `,
  styles: [],
})
export class ResourceCardComponent {
  readonly resource = input.required<Resource>();

  // The category name associated with this resource.
  readonly categoryName = input<string>('');
}

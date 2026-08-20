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
      class="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm
             transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ resource().name }}
          </h2>

          <p class="mt-1 text-sm text-gray-500">
            {{ resource().resourceType }}
          </p>
        </div>

        @if (resource().featured) {
          <span
            class="rounded-full bg-yellow-100 px-3 py-1 text-xs
                   font-medium text-yellow-800"
          >
            Featured
          </span>
        }
      </div>

      <p class="mt-4 line-clamp-3 text-gray-600">
        {{ resource().description }}
      </p>

      @if (resource().online) {
        <div class="mt-4 text-sm text-gray-500">
          Available online
        </div>
      }

      @if (resource().cost) {
        <div class="mt-2 text-sm">
          @if (resource().cost?.free) {
            <span class="font-medium text-green-600">
              Free
            </span>
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
}
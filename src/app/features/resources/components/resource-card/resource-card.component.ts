import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Category } from '../../../../core/models/category.model';
import { Resource } from '../../../../core/models/resource.model';
import { BootcampSummary } from '../../../bootcamps/bootcamp.model';
import { BootcampFieldsComponent } from '../../../bootcamps/bootcamp-fields.component';
import { resourceKind } from '../../resource-kinds';

/**
 * A resource in the directory: kind icon, name, category, a short
 * description (or, for bootcamps, what it teaches) and quick facts.
 */
@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [RouterLink, MatIconModule, BootcampFieldsComponent],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/resources', resource().slug]"
      class="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]/50"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {{ kind().tint }}">
          <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ kind().icon }}</mat-icon>
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="line-clamp-2 text-[15px] font-semibold leading-5 text-[#032D42] group-hover:text-[#007979]">
            {{ resource().name }}
            @if (resource().verified) {
              <mat-icon class="!h-4 !w-4 align-[-3px] !text-base text-green-600" aria-label="Verified">check_circle</mat-icon>
            }
          </h2>
          @if (category()) {
            <p class="mt-0.5 truncate text-xs font-medium text-gray-500">{{ category()!.name }}</p>
          }
        </div>
        @if (resource().featured) {
          <span class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Featured</span>
        }
      </div>

      @if (programs()) {
        <div class="mt-3">
          <app-bootcamp-fields [summary]="programs()" />
        </div>
        <p class="mb-4 mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{{ resource().description }}</p>
      } @else {
        <p class="mb-4 mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{{ resource().description }}</p>
      }

      <!-- Quick facts -->
      <div class="mt-auto flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
        @if (resource().cost?.free) {
          <span class="inline-flex h-6 items-center gap-1 rounded-full bg-green-50 px-2 text-xs font-semibold leading-none text-green-700 ring-1 ring-inset ring-green-200">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none" aria-hidden="true">savings</mat-icon>
            Free
          </span>
        } @else if (resource().cost?.description) {
          <span class="inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-gray-50 px-2 text-xs font-medium leading-none text-gray-700 ring-1 ring-inset ring-gray-200">
            <mat-icon class="!h-3.5 !w-3.5 shrink-0 !text-[14px] !leading-none text-gray-500" aria-hidden="true">payments</mat-icon>
            <span class="truncate">{{ resource().cost?.description }}</span>
          </span>
        }
        @if (resource().online) {
          <span class="inline-flex h-6 items-center gap-1 rounded-full bg-sky-50 px-2 text-xs font-medium leading-none text-sky-700 ring-1 ring-inset ring-sky-200">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none" aria-hidden="true">language</mat-icon>
            Online
          </span>
        }
        @if (place()) {
          <span class="inline-flex h-6 min-w-0 max-w-full items-center gap-1 rounded-full bg-gray-50 px-2 text-xs font-medium leading-none text-gray-700 ring-1 ring-inset ring-gray-200">
            <mat-icon class="!h-3.5 !w-3.5 shrink-0 !text-[14px] !leading-none text-gray-500" aria-hidden="true">location_on</mat-icon>
            <span class="truncate">{{ place() }}</span>
          </span>
        }
        <span class="ml-auto inline-flex items-center gap-0.5 text-xs font-semibold text-[#007979] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
          Details
          <mat-icon class="!h-4 !w-4 !text-base !leading-none">arrow_forward</mat-icon>
        </span>
      </div>
    </a>
  `,
})
export class ResourceCardComponent {
  readonly resource = input.required<Resource>();
  readonly category = input<Category | null | undefined>(null);
  /** "City, ST" of the resource's location, when it has one. */
  readonly place = input('');
  /** Programs of a bootcamp (fields, next class), when it has any. */
  readonly programs = input<BootcampSummary | null | undefined>(null);

  protected readonly kind = computed(() => resourceKind(this.category()));
}

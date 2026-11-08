import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { Category } from '../../../../core/models/category.model';
import { Resource } from '../../../../core/models/resource.model';
import { BootcampSummary } from '../../../bootcamps/bootcamp.model';
import { BootcampFieldsComponent } from '../../../bootcamps/bootcamp-fields.component';
import { openState } from '../../resource-hours';
import { resourceKind } from '../../resource-kinds';

/**
 * A resource in the directory: kind icon, name, category, open now, a short
 * description (or, for bootcamps, what it teaches), quick facts and the
 * ways to act right away (Call, Directions, Website).
 *
 * The whole card opens the resource page (the title link covers the card);
 * the action buttons sit above it so they can be used on their own.
 */
@Component({
  selector: 'app-resource-card',
  standalone: true,
  imports: [RouterLink, MatIconModule, BootcampFieldsComponent],
  host: { class: 'block' },
  template: `
    <article
      class="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#007979]/40 hover:shadow-md focus-within:ring-2 focus-within:ring-[#007979]/40"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {{ kind().tint }}">
          <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ kind().icon }}</mat-icon>
        </span>
        <div class="min-w-0 flex-1">
          <h2 class="line-clamp-2 text-[15px] font-semibold leading-5 text-[#032D42] group-hover:text-[#007979]">
            <!-- This link covers the whole card. -->
            <a [routerLink]="['/resources', resource().slug]" class="after:absolute after:inset-0 after:rounded-2xl focus:outline-none">
              {{ resource().name }}
            </a>
            @if (resource().verified) {
              <mat-icon class="!h-4 !w-4 align-[-3px] !text-base text-green-600" aria-label="Verified">check_circle</mat-icon>
            }
          </h2>
          <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
            @if (category()) {
              <span class="truncate font-medium text-gray-500">{{ category()!.name }}</span>
            }
            @if (hours().label) {
              <span class="font-semibold {{ hours().open === true ? 'text-green-700' : hours().open === false ? 'text-red-600' : 'text-gray-500' }}">
                {{ hours().label }}
              </span>
            }
          </p>
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
      </div>

      <!-- Act right away (above the card link) -->
      @if (actions().length) {
        <div class="relative z-10 mt-3 flex gap-2">
          @for (action of actions(); track action.label) {
            <a
              [href]="action.href"
              [attr.target]="action.external ? '_blank' : null"
              [attr.rel]="action.external ? 'noopener noreferrer' : null"
              [attr.aria-label]="action.label + ': ' + resource().name"
              class="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2 text-sm font-semibold text-[#007979] transition hover:border-[#007979] hover:bg-[#E8F4F4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007979]/50"
            >
              <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] !leading-none" aria-hidden="true">{{ action.icon }}</mat-icon>
              <span class="truncate">{{ action.label }}</span>
            </a>
          }
        </div>
      }
    </article>
  `,
})
export class ResourceCardComponent {
  readonly resource = input.required<Resource>();
  readonly category = input<Category | null | undefined>(null);
  /** "City, ST" of the resource's location, when it has one. */
  readonly place = input('');
  /** Full address (street, city, state, ZIP) for Directions; '' when none. */
  readonly address = input('');
  /** Programs of a bootcamp (fields, next class), when it has any. */
  readonly programs = input<BootcampSummary | null | undefined>(null);

  protected readonly kind = computed(() => resourceKind(this.category()));

  /** Open now / closed, from the opening hours. */
  protected readonly hours = computed(() => openState(this.resource().availability));

  /** Call, Directions and Website, when the resource has them. */
  protected readonly actions = computed(() => {
    const resource = this.resource();
    const list: { label: string; icon: string; href: string; external: boolean }[] = [];
    if (resource.phone) {
      list.push({ label: 'Call', icon: 'call', href: `tel:${resource.phone.replace(/[^\d+]/g, '')}`, external: false });
    }
    if (this.address()) {
      list.push({
        label: 'Directions',
        icon: 'directions',
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.address())}`,
        external: true,
      });
    }
    if (resource.website) {
      list.push({ label: 'Website', icon: 'open_in_new', href: resource.website, external: true });
    }
    return list;
  });
}

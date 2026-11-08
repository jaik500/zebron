import { Component, DOCUMENT, PLATFORM_ID, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, Location, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { Availability, AvailabilityDay } from '../../../../core/models/availability.model';
import { Category } from '../../../../core/models/category.model';
import { Location as PlaceLocation } from '../../../../core/models/location.model';
import { Resource } from '../../../../core/models/resource.model';
import { CategoryService } from '../../../../core/services/category.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { LocationService } from '../../../../core/services/location.service';
import { ShareService } from '../../../../core/services/share.service';
import {
  BootcampProgram,
  costLabel,
  dateLabel,
  fieldLabel,
  formatLabel,
  lengthLabel,
  openStarts,
  scheduleLabel,
} from '../../../bootcamps/bootcamp.model';
import { BootcampService, PAGE_STATS_ID } from '../../../bootcamps/bootcamp.service';
import { BootcampFieldsComponent } from '../../../bootcamps/bootcamp-fields.component';
import { ResourceActionType, resourceKind } from '../../resource-kinds';
import { ResourceStore } from '../../stores/resource.store';

/** One way to get help, shown in the "how to get this help" card. */
interface ResourceAction {
  type: ResourceActionType;
  label: string;
  detail: string;
  icon: string;
  href: string;
  external: boolean;
  /** Bootcamp program to count an Apply click for. */
  programId?: string;
}

interface HoursRow {
  day: string;
  text: string;
  today: boolean;
}

const DAYS: { key: keyof Availability; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

/**
 * Public resource page (/resources/:slug), rendered on the server.
 *
 * The layout adapts to the resource's kind (from its category): the ways to
 * get help are ordered for that kind (call first for legal and health help,
 * Apply first for bootcamps, directions first for food), with a short
 * checklist. Bootcamps also show their programs, start dates and Zebron's take.
 */
@Component({
  selector: 'app-resource-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, BootcampFieldsComponent],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-gray-50">
      <!-- ===================== Action bar (the universal header shows "Resources" or "Bootcamps") ===================== -->
      <div class="sticky top-16 z-40 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white shadow-sm">
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <button
            type="button"
            (click)="back()"
            class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
            {{ section() }}
          </button>

          @if (resource(); as barResource) {
            <span class="hidden min-w-0 flex-1 truncate border-l border-white/25 pl-3 text-sm font-semibold md:block">
              {{ barResource.name }}
            </span>
            <div class="ml-auto flex shrink-0 items-center gap-1">
              <button
                type="button"
                (click)="share()"
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Share this resource"
                title="Share"
              >
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">share</mat-icon>
              </button>
              @if (primaryAction(); as action) {
                <a
                  [href]="action.href"
                  [attr.target]="action.external ? '_blank' : null"
                  [attr.rel]="action.external ? 'noopener noreferrer' : null"
                  (click)="onAction(action)"
                  class="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold text-[#007979] shadow-sm hover:bg-gray-100"
                >
                  <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">{{ action.icon }}</mat-icon>
                  {{ action.label }}
                </a>
              }
            </div>
          }
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        @if (loading()) {
          <section class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#007979]"></div>
            <p class="mt-4 text-sm text-gray-500">Loading resource…</p>
          </section>
        } @else if (error() || !resource()) {
          <section class="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
            <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <mat-icon class="text-gray-500" aria-hidden="true">search_off</mat-icon>
            </span>
            <h1 class="mt-4 text-lg font-bold text-[#032D42]">We couldn't find this resource</h1>
            <p class="mt-1 text-sm text-gray-600">It may have moved or no longer be listed.</p>
            <a routerLink="/resources" class="mt-5 inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">
              Browse resources
            </a>
          </section>
        } @else {
          @let item = resource()!;

          <!-- ===================== Header card ===================== -->
          <header class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div class="h-1.5 bg-gradient-to-r from-[#007979] via-[#12BFC3] to-[#2a835f]"></div>
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
              <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl {{ kind().tint }}">
                <mat-icon class="!h-7 !w-7 !text-[28px]" aria-hidden="true">{{ kind().icon }}</mat-icon>
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  @if (category(); as itemCategory) {
                    <a
                      [routerLink]="listLink()"
                      [queryParams]="listQuery()"
                      class="rounded-full bg-[#E8F4F4] px-2.5 py-0.5 text-xs font-semibold text-[#007979] hover:bg-[#d5ecec]"
                    >
                      {{ itemCategory.name }}
                    </a>
                  }
                  @if (item.featured) {
                    <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Featured</span>
                  }
                  @if (hasRecommended()) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-[#007979] px-2.5 py-0.5 text-xs font-semibold text-white">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">verified</mat-icon>
                      Recommended by Zebron
                    </span>
                  }
                </div>

                <h1 class="mt-2 text-2xl font-bold tracking-tight text-[#032D42] [overflow-wrap:anywhere] sm:text-3xl">{{ item.name }}</h1>

                <p class="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm">
                  @if (item.verified) {
                    <mat-icon class="!h-4 !w-4 !text-base text-green-600" aria-hidden="true">check_circle</mat-icon>
                    <span class="font-medium text-green-700">Verified by Zebron</span>
                    @if (item.lastVerifiedAt) {
                      <span class="text-gray-500">· {{ item.lastVerifiedAt.toDate() | date: 'MMM d, y' }}</span>
                    }
                  } @else {
                    <mat-icon class="!h-4 !w-4 !text-base text-gray-400" aria-hidden="true">help</mat-icon>
                    <span class="text-gray-500">Not yet verified. Confirm details with the provider.</span>
                  }
                </p>

                <!-- Quick facts -->
                <ul class="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Quick facts">
                  @if (item.cost) {
                    <li class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 {{ item.cost.free ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-700' }}">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">payments</mat-icon>
                      {{ item.cost.free ? 'Free' : item.cost.description || 'Fees apply' }}
                    </li>
                  }
                  @if (item.online) {
                    <li class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">laptop</mat-icon>
                      Available online
                    </li>
                  }
                  @if (placeLine()) {
                    <li class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">location_on</mat-icon>
                      {{ placeLine() }}
                    </li>
                  }
                  @if (hoursSummary()) {
                    <li class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">schedule</mat-icon>
                      {{ hoursSummary() }}
                    </li>
                  }
                  @if (programs().length) {
                    <li class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">menu_book</mat-icon>
                      {{ programs().length }} {{ programs().length === 1 ? 'program' : 'programs' }}
                    </li>
                  }
                </ul>
              </div>
            </div>
          </header>

          <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_1fr]">
            <!-- ===================== How to get this help ===================== -->
            <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-start-2 lg:row-start-1" aria-labelledby="actions-title">
              <h2 id="actions-title" class="text-base font-bold text-[#032D42]">{{ kind().actionsTitle }}</h2>
              @if (actions().length) {
                <ul class="mt-3 space-y-2">
                  @for (action of actions(); track action.type + (action.programId ?? ''); let first = $first) {
                    <li>
                      <a
                        [href]="action.href"
                        [attr.target]="action.external ? '_blank' : null"
                        [attr.rel]="action.external ? 'noopener noreferrer' : null"
                        (click)="onAction(action)"
                        class="group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition {{
                          first ? 'border-[#007979] bg-[#007979] text-white hover:bg-[#006666]' : 'border-gray-200 text-[#032D42] hover:border-[#007979] hover:bg-[#E8F4F4]'
                        }}"
                      >
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg {{ first ? 'bg-white/15' : 'bg-[#E8F4F4] text-[#007979]' }}">
                          <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ action.icon }}</mat-icon>
                        </span>
                        <span class="min-w-0 flex-1">
                          <span class="block text-sm font-semibold">{{ action.label }}</span>
                          <span class="block truncate text-xs {{ first ? 'text-white/80' : 'text-gray-500' }}">{{ action.detail }}</span>
                        </span>
                        @if (action.external) {
                          <mat-icon class="!h-4 !w-4 !text-base opacity-70" aria-hidden="true">open_in_new</mat-icon>
                          <span class="sr-only">(opens another site)</span>
                        }
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="mt-2 text-sm text-gray-600">No contact details are listed yet. Ask our assistant or contact us and we'll help you reach them.</p>
              }
              <p class="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                Zebron lists this resource to help you; we are not the provider.
                <a routerLink="/contact" class="font-medium text-[#007979] hover:underline">Report a problem</a>
              </p>
            </section>

            <!-- ===================== Main column ===================== -->
            <div class="min-w-0 space-y-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="about-title">
                <h2 id="about-title" class="text-base font-bold text-[#032D42]">About</h2>
                <p class="mt-2 whitespace-pre-line text-[15px] leading-7 text-gray-700 [overflow-wrap:anywhere]">{{ item.description }}</p>
                @if (item.tags.length) {
                  <ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                    @for (tag of item.tags; track tag) {
                      <li class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">#{{ tag }}</li>
                    }
                  </ul>
                }
              </section>

              <!-- Programs (bootcamps and any resource with programs) -->
              @if (programs().length) {
                <section id="programs" class="scroll-mt-32 space-y-3" aria-labelledby="programs-title">
                  <h2 id="programs-title" class="px-1 text-base font-bold text-[#032D42]">Programs</h2>
                  @for (program of programs(); track program.id) {
                    <article class="overflow-hidden rounded-2xl border bg-white shadow-sm {{ program.recommended ? 'border-[#007979]/40' : 'border-gray-200' }}">
                      <div class="p-5 sm:p-6">
                        <div class="flex flex-wrap items-start gap-2">
                          <div class="min-w-0 flex-1">
                            <p class="text-xs font-semibold uppercase tracking-wide text-[#007979]">{{ fieldName(program) }}</p>
                            <h3 class="mt-0.5 text-lg font-bold text-[#032D42]">{{ program.title }}</h3>
                          </div>
                          @if (program.recommended) {
                            <span class="inline-flex items-center gap-1 rounded-full bg-[#007979] px-2.5 py-1 text-xs font-semibold text-white">
                              <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">verified</mat-icon>
                              Recommended
                            </span>
                          }
                        </div>

                        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                          <div class="rounded-xl bg-gray-50 px-3 py-2">
                            <dt class="text-xs text-gray-500">Cost</dt>
                            <dd class="font-semibold {{ cost(program) === 'Free' ? 'text-green-700' : 'text-[#032D42]' }}">{{ cost(program) }}</dd>
                          </div>
                          <div class="rounded-xl bg-gray-50 px-3 py-2">
                            <dt class="text-xs text-gray-500">Format</dt>
                            <dd class="font-semibold text-[#032D42]">{{ format(program) }}</dd>
                          </div>
                          <div class="rounded-xl bg-gray-50 px-3 py-2">
                            <dt class="text-xs text-gray-500">Schedule</dt>
                            <dd class="font-semibold text-[#032D42]">{{ schedule(program) }}</dd>
                          </div>
                          <div class="rounded-xl bg-gray-50 px-3 py-2">
                            <dt class="text-xs text-gray-500">Length</dt>
                            <dd class="font-semibold text-[#032D42]">{{ length(program) || 'Ask them' }}</dd>
                          </div>
                        </dl>

                        @if (program.summary) {
                          <p class="mt-4 whitespace-pre-line text-sm leading-6 text-gray-700">{{ program.summary }}</p>
                        }

                        @if (program.costNote || program.financing.length) {
                          <p class="mt-3 text-sm text-gray-700">
                            <span class="font-semibold text-[#032D42]">Paying for it:</span>
                            {{ financingText(program) }}
                          </p>
                        }

                        @if (program.skills.length) {
                          <div class="mt-4">
                            <h4 class="text-xs font-semibold text-gray-500">You'll learn</h4>
                            <ul class="mt-1.5 flex flex-wrap gap-1.5">
                              @for (skill of program.skills; track skill) {
                                <li class="rounded-full bg-[#E8F4F4] px-2.5 py-0.5 text-xs font-medium text-[#035e5e]">{{ skill }}</li>
                              }
                            </ul>
                          </div>
                        }
                        @if (program.certifications.length) {
                          <p class="mt-3 text-sm text-gray-700">
                            <span class="font-semibold text-[#032D42]">Prepares you for:</span>
                            {{ program.certifications.join(', ') }}
                          </p>
                        }

                        <!-- Who it's for -->
                        <ul class="mt-4 space-y-1.5 text-sm text-gray-700">
                          @if (program.prerequisites) {
                            <li class="flex gap-2">
                              <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px] text-gray-400" aria-hidden="true">checklist</mat-icon>
                              <span><span class="font-medium text-[#032D42]">Before you start:</span> {{ program.prerequisites }}</span>
                            </li>
                          }
                          <li class="flex gap-2">
                            <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px] text-gray-400" aria-hidden="true">school</mat-icon>
                            <span>{{ program.requiresDegree ? 'A college degree is required.' : 'No college degree needed.' }}</span>
                          </li>
                          @if (program.englishSupport) {
                            <li class="flex gap-2">
                              <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px] text-gray-400" aria-hidden="true">translate</mat-icon>
                              <span>Support for non-native English speakers.</span>
                            </li>
                          }
                          @if (program.workAuthorization) {
                            <li class="flex gap-2">
                              <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px] text-gray-400" aria-hidden="true">badge</mat-icon>
                              <span><span class="font-medium text-[#032D42]">Eligibility:</span> {{ program.workAuthorization }}</span>
                            </li>
                          }
                          @if (program.placementRate !== null) {
                            <li class="flex gap-2">
                              <mat-icon class="!h-5 !w-5 shrink-0 !text-[18px] text-gray-400" aria-hidden="true">trending_up</mat-icon>
                              <span>
                                {{ program.placementRate }}% of graduates hired within 6 months{{ program.outcomesSource ? ' (' + program.outcomesSource + ')' : '' }}.
                              </span>
                            </li>
                          }
                        </ul>

                        <!-- Start dates -->
                        @if (starts(program).length) {
                          <div class="mt-4">
                            <h4 class="text-xs font-semibold text-gray-500">Next start dates</h4>
                            <ul class="mt-1.5 flex flex-wrap gap-2">
                              @for (start of starts(program); track start.date) {
                                <li class="rounded-lg border border-gray-200 px-2.5 py-1 text-sm">
                                  <span class="font-semibold text-[#032D42]">{{ day(start.date) }}</span>
                                  @if (start.deadline) {
                                    <span class="text-xs text-gray-500"> · apply by {{ day(start.deadline) }}</span>
                                  }
                                </li>
                              }
                            </ul>
                          </div>
                        } @else if (program.starts.length) {
                          <p class="mt-4 text-sm text-gray-500">No upcoming start date is listed. Ask them about the next class.</p>
                        }

                        @if (program.applyUrl || item.website) {
                          <a
                            [href]="program.applyUrl || item.website"
                            target="_blank"
                            rel="noopener noreferrer"
                            (click)="countApply(program.id)"
                            class="mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
                          >
                            Apply to {{ program.title }}
                            <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">open_in_new</mat-icon>
                            <span class="sr-only">(opens the bootcamp's site)</span>
                          </a>
                        }
                      </div>

                      @if (program.zebronTake) {
                        <div class="flex gap-3 border-t border-[#007979]/20 bg-[#E8F4F4] px-5 py-4 sm:px-6">
                          <img src="/zebron-favicon.svg" alt="" class="mt-0.5 h-6 w-6 shrink-0" />
                          <div>
                            <h4 class="text-sm font-bold text-[#032D42]">Zebron's take</h4>
                            <p class="mt-1 whitespace-pre-line text-sm leading-6 text-gray-700">{{ program.zebronTake }}</p>
                          </div>
                        </div>
                      }
                    </article>
                  }
                </section>
              }

              <!-- Hours -->
              @if (item.availability; as availability) {
                <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="hours-title">
                  <div class="flex items-center gap-2">
                    <h2 id="hours-title" class="text-base font-bold text-[#032D42]">Hours</h2>
                    @if (openNow() !== null) {
                      <span class="rounded-full px-2 py-0.5 text-xs font-semibold {{ openNow() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">
                        {{ openNow() ? 'Open now' : 'Closed now' }}
                      </span>
                    }
                  </div>
                  @if (availability.alwaysAvailable) {
                    <p class="mt-2 text-sm font-medium text-green-700">Open 24 hours, every day.</p>
                  }
                  @if (availability.byAppointment) {
                    <p class="mt-2 text-sm font-medium text-[#007979]">By appointment. Contact them to book a time.</p>
                  }
                  @if (hours().length) {
                    <dl class="mt-3 divide-y divide-gray-100 text-sm">
                      @for (row of hours(); track row.day) {
                        <div class="flex justify-between gap-4 py-1.5 {{ row.today ? 'font-semibold text-[#032D42]' : 'text-gray-700' }}">
                          <dt>{{ row.day }}{{ row.today ? ' (today)' : '' }}</dt>
                          <dd class="{{ row.text === 'Closed' ? 'text-gray-400' : '' }}">{{ row.text }}</dd>
                        </div>
                      }
                    </dl>
                  }
                </section>
              }

              <!-- Location -->
              @if (location(); as place) {
                @if (addressLines().length) {
                  <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="location-title">
                    <h2 id="location-title" class="text-base font-bold text-[#032D42]">Location</h2>
                    <div class="mt-3 flex flex-wrap items-start gap-4">
                      <address class="flex min-w-0 flex-1 gap-2 text-sm not-italic leading-6 text-gray-700">
                        <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-[#007979]" aria-hidden="true">location_on</mat-icon>
                        <span>
                          @for (line of addressLines(); track line) {
                            <span class="block">{{ line }}</span>
                          }
                        </span>
                      </address>
                      @if (mapsUrl()) {
                        <a
                          [href]="mapsUrl()"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-[#007979] hover:border-[#007979]"
                        >
                          <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">directions</mat-icon>
                          Directions
                        </a>
                      }
                    </div>
                  </section>
                }
              }

              <!-- Checklist for this kind of help -->
              @if (kind().tips.length) {
                <section class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6" aria-labelledby="tips-title">
                  <h2 id="tips-title" class="flex items-center gap-2 text-base font-bold text-[#032D42]">
                    <mat-icon class="!h-5 !w-5 !text-[20px] text-amber-600" aria-hidden="true">lightbulb</mat-icon>
                    Before you reach out
                  </h2>
                  <ul class="mt-3 space-y-2 text-sm leading-6 text-gray-700">
                    @for (tip of kind().tips; track tip) {
                      <li class="flex gap-2">
                        <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
                        <span>{{ tip }}</span>
                      </li>
                    }
                  </ul>
                  @if (kind().kind === 'bootcamp') {
                    <div class="mt-4 flex flex-wrap gap-2">
                      <a routerLink="/courses" class="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold text-[#007979] shadow-sm hover:bg-gray-50">
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">play_lesson</mat-icon>
                        Free courses
                      </a>
                      <a routerLink="/test-center" class="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold text-[#007979] shadow-sm hover:bg-gray-50">
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">quiz</mat-icon>
                        Practice tests
                      </a>
                      <a routerLink="/jobs" class="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold text-[#007979] shadow-sm hover:bg-gray-50">
                        <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">work</mat-icon>
                        Tech jobs
                      </a>
                    </div>
                  }
                </section>
              }
            </div>

            <!-- ===================== Related ===================== -->
            @if (relatedResources().length) {
              <aside class="self-start rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-start-2 lg:row-start-2" aria-labelledby="related-title">
                <h2 id="related-title" class="text-base font-bold text-[#032D42]">More {{ category()?.name ? 'in ' + category()!.name : 'like this' }}</h2>
                <ul class="mt-3 divide-y divide-gray-100">
                  @for (related of relatedResources(); track related.id) {
                    <li>
                      <a [routerLink]="['/resources', related.slug]" class="block rounded-lg py-3 transition hover:bg-gray-50">
                        <span class="flex items-start justify-between gap-2">
                          <span class="text-sm font-semibold leading-5 text-[#032D42]">{{ related.name }}</span>
                          @if (related.cost?.free) {
                            <span class="shrink-0 text-xs font-semibold text-green-700">Free</span>
                          }
                        </span>
                        @if (programSummaries().get(related.id); as relatedPrograms) {
                          <span class="mt-1.5 block">
                            <app-bootcamp-fields [summary]="relatedPrograms" [small]="true" />
                          </span>
                          <span class="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">{{ related.description }}</span>
                        } @else {
                          <span class="mt-1 line-clamp-5 text-xs leading-5 text-gray-600">{{ related.description }}</span>
                        }
                      </a>
                    </li>
                  }
                </ul>
                <a
                  [routerLink]="listLink()"
                  [queryParams]="listQuery()"
                  class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline"
                >
                  See all
                  <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">arrow_forward</mat-icon>
                </a>
              </aside>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class ResourceDetailComponent {
  private readonly resourceStore = inject(ResourceStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly locationService = inject(LocationService);
  private readonly categoryService = inject(CategoryService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly bootcampService = inject(BootcampService);
  private readonly shareService = inject(ShareService);
  private readonly toast = inject(HotToastService);
  private readonly router = inject(Router);
  private readonly browserLocation = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Route parameter (bound by the router); the resolver loads the resource. */
  readonly slug = input<string>();

  protected readonly resource = this.resourceStore.selectedResource;
  protected readonly relatedResources = this.resourceStore.relatedResources;
  protected readonly loading = this.resourceStore.loading;
  protected readonly error = this.resourceStore.error;

  protected readonly location = signal<PlaceLocation | null>(null);
  protected readonly category = signal<Category | null>(null);
  private readonly programList = signal<BootcampProgram[]>([]);

  /** Presentation and action order for this kind of resource. */
  protected readonly kind = computed(() => resourceKind(this.category()));

  /** Recommended programs first. */
  protected readonly programs = computed(() =>
    [...this.programList()].sort((a, b) => Number(b.recommended) - Number(a.recommended)),
  );
  /** "Bootcamps" for bootcamps, else "Resources": the universal header and the back button. */
  protected readonly section = computed(() => (this.kind().kind === 'bootcamp' ? 'Bootcamps' : 'Resources'));

  /** Where the category link and Back go: /bootcamps, or /resources?category=… */
  protected readonly listLink = computed(() => (this.kind().kind === 'bootcamp' ? '/bootcamps' : '/resources'));
  protected readonly listQuery = computed(() =>
    this.kind().kind === 'bootcamp' || !this.category() ? {} : { category: this.category()!.slug },
  );

  protected readonly hasRecommended = computed(() => this.programList().some((program) => program.recommended));

  private countedViewFor = '';

  /** Programs of other bootcamps, for "More in Bootcamps". */
  protected readonly programSummaries = this.bootcampService.summaries;

  constructor() {
    void this.bootcampService.loadSummaries();

    effect(() => {
      const title = this.section();
      untracked(() => this.pageTitle.setTitle(title));
    });

    effect(() => {
      const resource = this.resource();
      if (!resource) {
        return;
      }
      untracked(() => {
        this.updateSeoMetadata(resource);
        this.updateStructuredData(resource);
        void this.loadCategory(resource.categoryId);
        void this.loadLocation(resource.locationId);
        void this.loadPrograms(resource);
        if (resource.categoryId && resource.id) {
          void this.resourceStore.loadRelatedResources(resource.categoryId, resource.id, 4).catch(() => undefined);
        }
      });
    });
  }

  // ----------------------------------------------------------
  // Ways to get help
  // ----------------------------------------------------------

  protected readonly actions = computed<ResourceAction[]>(() => {
    const resource = this.resource();
    if (!resource) {
      return [];
    }
    const found = new Map<ResourceActionType, ResourceAction>();
    const host = (url: string) => {
      try {
        return new URL(url).hostname.replace(/^www\./, '');
      } catch {
        return url;
      }
    };

    // Apply: one program → its link; several → jump to the programs.
    const withLinks = this.programs().filter((program) => program.applyUrl);
    if (withLinks.length === 1) {
      found.set('apply', {
        type: 'apply',
        label: 'Apply',
        detail: withLinks[0].title,
        icon: 'how_to_reg',
        href: withLinks[0].applyUrl,
        external: true,
        programId: withLinks[0].id,
      });
    } else if (this.programs().length > 1) {
      found.set('apply', {
        type: 'apply',
        label: 'Compare programs and apply',
        detail: `${this.programs().length} programs`,
        icon: 'how_to_reg',
        href: '#programs',
        external: false,
      });
    }

    if (resource.website) {
      found.set('website', {
        type: 'website',
        label: this.kind().websiteLabel,
        detail: host(resource.website),
        icon: 'language',
        href: resource.website,
        external: true,
      });
    }
    if (resource.phone) {
      found.set('call', { type: 'call', label: 'Call', detail: resource.phone, icon: 'call', href: `tel:${resource.phone.replace(/[^\d+]/g, '')}`, external: false });
    }
    if (resource.email) {
      found.set('email', { type: 'email', label: 'Email', detail: resource.email, icon: 'mail', href: `mailto:${resource.email}`, external: false });
    }
    const maps = this.mapsUrl();
    if (maps) {
      found.set('directions', { type: 'directions', label: 'Get directions', detail: this.placeLine() || 'Open in Maps', icon: 'directions', href: maps, external: true });
    }
    if (resource.availability?.byAppointment && (resource.phone || resource.website)) {
      found.set('appointment', {
        type: 'appointment',
        label: 'Book an appointment',
        detail: resource.phone ? `By phone: ${resource.phone}` : 'On their website',
        icon: 'event_available',
        href: resource.phone ? `tel:${resource.phone.replace(/[^\d+]/g, '')}` : resource.website!,
        external: !resource.phone,
      });
    }

    return this.kind()
      .actionOrder.map((type) => found.get(type))
      .filter((action): action is ResourceAction => !!action);
  });

  protected readonly primaryAction = computed(() => this.actions()[0] ?? null);

  protected onAction(action: ResourceAction): void {
    if (action.programId) {
      this.countApply(action.programId);
    }
  }

  protected countApply(programId: string): void {
    const resource = this.resource();
    if (resource && this.isBrowser) {
      void this.bootcampService.record(resource.id, programId, 'applyClicks');
    }
  }

  protected async share(): Promise<void> {
    const resource = this.resource();
    if (!resource) {
      return;
    }
    const nativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const done = await this.shareService.share({
      title: resource.name,
      text: resource.description.slice(0, 140),
      url: `https://zebron.org/resources/${resource.slug}`,
    });
    if (done && !nativeShare) {
      this.toast.success('Link copied.');
    }
  }

  protected back(): void {
    const state = this.browserLocation.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.browserLocation.back();
    } else {
      void this.router.navigate([this.listLink()], { queryParams: this.listQuery() });
    }
  }

  // ----------------------------------------------------------
  // Place and hours
  // ----------------------------------------------------------

  protected readonly placeLine = computed(() => {
    const place = this.location();
    return place ? [place.city, place.state].filter(Boolean).join(', ') : '';
  });

  protected readonly addressLines = computed(() => {
    const place = this.location();
    if (!place) {
      return [];
    }
    const cityLine = [[place.city, place.state].filter(Boolean).join(', '), place.zipCode || place.postalCode].filter(Boolean).join(' ');
    return [place.address, cityLine, place.country && place.country !== 'US' && place.country !== 'USA' ? place.country : '']
      .map((line) => (line ?? '').trim())
      .filter(Boolean);
  });

  protected readonly mapsUrl = computed(() => {
    const place = this.location();
    if (!place) {
      return '';
    }
    if (place.latitude !== undefined && place.longitude !== undefined) {
      return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    }
    const lines = this.addressLines();
    return place.address && lines.length ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lines.join(', '))}` : '';
  });

  /** Index into DAYS for today (Monday = 0). On the server, no day is "today". */
  private readonly todayIndex = this.isBrowser ? (new Date().getDay() + 6) % 7 : -1;

  protected readonly hours = computed<HoursRow[]>(() => {
    const availability = this.resource()?.availability;
    if (!availability || availability.alwaysAvailable) {
      return [];
    }
    return DAYS.flatMap(({ key, label }, index) => {
      const day = availability[key] as AvailabilityDay | undefined;
      if (!day) {
        return [];
      }
      return [{ day: label, text: this.dayText(day), today: index === this.todayIndex }];
    });
  });

  protected readonly hoursSummary = computed(() => {
    const availability = this.resource()?.availability;
    if (!availability) {
      return '';
    }
    if (availability.alwaysAvailable) {
      return 'Open 24/7';
    }
    const today = this.hours().find((row) => row.today);
    if (today) {
      return today.text === 'Closed' ? 'Closed today' : `Today ${today.text}`;
    }
    return availability.byAppointment ? 'By appointment' : '';
  });

  /** Open right now (browser only; null when unknown). */
  protected readonly openNow = computed<boolean | null>(() => {
    const availability = this.resource()?.availability;
    if (!this.isBrowser || !availability) {
      return null;
    }
    if (availability.alwaysAvailable) {
      return true;
    }
    const day = availability[DAYS[this.todayIndex].key] as AvailabilityDay | undefined;
    const open = this.minutes(day?.openTime);
    const close = this.minutes(day?.closeTime);
    if (!day || open === null || close === null) {
      return day && !day.open ? false : null;
    }
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    return day.open && current >= open && current < close;
  });

  private dayText(day: AvailabilityDay): string {
    if (!day.open) {
      return 'Closed';
    }
    if (!day.openTime && !day.closeTime) {
      return 'Open';
    }
    return `${this.clock(day.openTime)} – ${this.clock(day.closeTime)}`;
  }

  /** "09:00" or "17:30" → "9:00 AM" / "5:30 PM"; other text is shown as is. */
  private clock(value: string | undefined): string {
    const minutes = this.minutes(value);
    if (minutes === null) {
      return value ?? '';
    }
    const hours = Math.floor(minutes / 60);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
  }

  private minutes(value: string | undefined): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? '');
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  // ----------------------------------------------------------
  // Program labels
  // ----------------------------------------------------------

  protected fieldName = (program: BootcampProgram) => fieldLabel(program.field);
  protected format = (program: BootcampProgram) => formatLabel(program.format);
  protected schedule = (program: BootcampProgram) => scheduleLabel(program.schedule);
  protected length = (program: BootcampProgram) => lengthLabel(program);
  protected cost = (program: BootcampProgram) => costLabel(program);
  protected starts = (program: BootcampProgram) => openStarts(program).slice(0, 4);
  protected day = (value: string) => dateLabel(value);

  protected financingText(program: BootcampProgram): string {
    const labels: Record<string, string> = {
      free: 'free seats',
      'payment-plan': 'payment plans',
      isa: 'income share agreements',
      wioa: 'WIOA grants',
      gi: 'GI Bill',
      scholarship: 'scholarships',
      employer: 'employer sponsorship',
      loan: 'loans',
    };
    const ways = program.financing.map((value) => labels[value] ?? value);
    const list = ways.length ? `Options include ${ways.join(', ')}.` : '';
    return [program.costNote, list].filter(Boolean).join(' ');
  }

  // ----------------------------------------------------------
  // Loading
  // ----------------------------------------------------------

  private async loadCategory(categoryId?: string): Promise<void> {
    if (!categoryId) {
      this.category.set(null);
      return;
    }
    try {
      this.category.set(await this.categoryService.getCategoryById(categoryId));
    } catch (error) {
      console.error('Failed to load resource category:', error);
      this.category.set(null);
    }
  }

  private async loadLocation(locationId?: string): Promise<void> {
    if (!locationId) {
      this.location.set(null);
      return;
    }
    try {
      this.location.set(await this.locationService.getLocationById(locationId));
    } catch (error) {
      console.error('Failed to load resource location:', error);
      this.location.set(null);
    }
  }

  /** Programs exist for bootcamps (and any resource an admin adds them to). */
  private async loadPrograms(resource: Resource): Promise<void> {
    this.programList.set([]);
    try {
      const details = await this.bootcampService.get(resource.id);
      this.programList.set(details?.programs ?? []);
      if (details?.programs.length) {
        this.updateStructuredData(resource);
        if (this.isBrowser && this.countedViewFor !== resource.id) {
          this.countedViewFor = resource.id;
          void this.bootcampService.record(resource.id, PAGE_STATS_ID, 'views');
        }
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  }

  // ----------------------------------------------------------
  // SEO
  // ----------------------------------------------------------

  /** An SEO description that doesn't cut a word in half. */
  private createSeoDescription(description: string, maxLength = 160): string {
    const text = description.trim();
    if (text.length <= maxLength) {
      return text;
    }
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace <= 0 ? truncated : `${truncated.substring(0, lastSpace)}…`;
  }

  private schemaType(): string {
    switch (this.kind().kind) {
      case 'bootcamp':
      case 'education':
        return 'EducationalOrganization';
      case 'legal':
        return 'LegalService';
      case 'health':
        return 'MedicalOrganization';
      case 'government':
        return 'GovernmentOrganization';
      default:
        return 'Organization';
    }
  }

  /** JSON-LD for the server-rendered page. */
  private updateStructuredData(resource: Resource): void {
    const name = resource.name?.trim() || 'Resource';
    const description = this.createSeoDescription(resource.description?.trim() || `Learn more about ${name} on Zebron.`);
    const url = `https://zebron.org/resources/${resource.slug}`;

    const entity: Record<string, unknown> = { '@type': this.schemaType(), name, description };
    if (resource.website) entity['url'] = resource.website;
    if (resource.phone) entity['telephone'] = resource.phone;
    if (resource.email) entity['email'] = resource.email;
    const place = this.location();
    if (place && (place.address || place.city)) {
      entity['address'] = {
        '@type': 'PostalAddress',
        streetAddress: place.address,
        addressLocality: place.city,
        addressRegion: place.state,
        postalCode: place.zipCode || place.postalCode,
        addressCountry: place.country || 'US',
      };
    }
    if (this.programList().length) {
      entity['hasCourse'] = this.programList().map((program) => ({
        '@type': 'Course',
        name: program.title,
        description: program.summary || program.title,
        provider: { '@type': 'Organization', name, ...(resource.website ? { sameAs: resource.website } : {}) },
      }));
    }

    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name,
      description,
      url,
      isPartOf: { '@type': 'WebSite', name: 'Zebron', url: 'https://zebron.org/' },
      publisher: { '@type': 'Organization', name: 'Zebron', url: 'https://zebron.org/' },
      mainEntity: entity,
    };

    const existing = this.document.head.querySelector('script[data-zebron-structured-data="resource"]');
    const script = existing ?? this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-zebron-structured-data', 'resource');
    script.textContent = JSON.stringify(data);
    if (!existing) {
      this.document.head.appendChild(script);
    }
  }

  private updateSeoMetadata(resource: Resource): void {
    const name = resource.name?.trim() || 'Resource';
    const description = this.createSeoDescription(resource.description?.trim() || `Learn more about ${name} on Zebron.`);
    const pageTitle = `${name} | Zebron`;
    const url = `https://zebron.org/resources/${resource.slug}`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });

    const canonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    } else {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }
}

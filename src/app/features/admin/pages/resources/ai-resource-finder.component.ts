import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import { Category } from '../../../../core/models/category.model';
import { Location } from '../../../../core/models/location.model';
import { Resource } from '../../../../core/models/resource.model';
import { ResourceType } from '../../../../core/models/resource-type.model';
import { AiService } from '../../../../core/services/ai.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ResourceStore } from '../../../resources/stores/resource.store';

/** A resource the AI found, as returned by the find-resources task. */
interface Finding {
  name: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  online: boolean;
  free: boolean;
  costDescription: string;
  categoryId: string;
  tags: string[];
  sourceUrl: string;
  duplicateOf: string;
  websiteStatus: 'ok' | 'unchecked' | 'broken';
  websiteNote: string;
}

interface FindResult {
  resources: Finding[];
  searchedPages: { uri: string; title: string }[];
}

/** A finding on screen: can be edited, then added. */
interface Proposal extends Finding {
  resourceType: string;
  added: boolean;
  adding: boolean;
  open: boolean;
}

const EXAMPLES = [
  'Free IT training programs for adults in Maryland',
  'Food pantries in Prince George\'s County open on Saturdays',
  'Free English classes for adults in Montgomery County',
  'Immigration legal help for low-income families in DC',
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/**
 * Admin → Resources → Find with AI: describe what to look for; the AI
 * searches the web and proposes listings, each with its website checked
 * and its source. Chosen ones are added as Pending (never published) so
 * someone confirms them before they go live.
 */
@Component({
  selector: 'app-ai-resource-finder',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <section class="border-b border-gray-200 bg-gradient-to-br from-[#E8F4F4] to-white px-5 py-5" aria-labelledby="ai-finder-title">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#007979] text-white">
          <mat-icon aria-hidden="true">travel_explore</mat-icon>
        </span>
        <div class="min-w-0 flex-1">
          <h3 id="ai-finder-title" class="text-base font-bold text-[#032D42]">Find resources with AI</h3>
          <p class="text-sm text-gray-600">
            Describe what to look for. The AI searches the web and suggests listings with their sources. Ones you add are saved as
            <strong>Pending</strong>: confirm the details before publishing.
          </p>
        </div>
        <button type="button" (click)="closed.emit()" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-white" aria-label="Close">
          <mat-icon aria-hidden="true">close</mat-icon>
        </button>
      </div>

      <form (ngSubmit)="search()" class="mt-4 space-y-2">
        <div class="flex flex-col gap-2 sm:flex-row">
          <label class="min-w-0 flex-[3]">
            <span class="sr-only">What to look for</span>
            <input
              type="text"
              name="query"
              [(ngModel)]="query"
              maxlength="300"
              placeholder="e.g. Free IT training programs for adults in Maryland"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20"
            />
          </label>
          <label class="min-w-0 flex-[2]">
            <span class="sr-only">Area</span>
            <input
              type="text"
              name="area"
              [(ngModel)]="area"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20"
            />
          </label>
          <button
            type="submit"
            [disabled]="searching() || !query.trim()"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#007979] px-5 text-sm font-bold text-white hover:bg-[#006666] disabled:opacity-50"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none {{ searching() ? 'animate-spin' : '' }}" aria-hidden="true">{{ searching() ? 'autorenew' : 'search' }}</mat-icon>
            {{ searching() ? 'Searching…' : 'Find' }}
          </button>
        </div>
        @if (!proposals().length && !searching()) {
          <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            Try:
            @for (example of examples; track example) {
              <button type="button" (click)="query = example" class="text-[#007979] hover:underline">{{ example }}</button>
            }
          </p>
        }
        @if (searching()) {
          <p class="text-xs text-gray-500" role="status">Searching the web and checking every website. This takes up to a minute.</p>
        }
      </form>

      @if (proposals().length) {
        <div class="mt-5 flex flex-wrap items-center gap-2">
          <p class="text-sm font-semibold text-[#032D42]">{{ proposals().length }} found</p>
          <span class="text-xs text-gray-500">· {{ addedCount() }} added</span>
          @if (addable().length) {
            <button
              type="button"
              (click)="addAll()"
              class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-[#007979] bg-white px-3 text-sm font-semibold text-[#007979] hover:bg-[#E8F4F4]"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">playlist_add</mat-icon>
              Add {{ addable().length }} as pending
            </button>
          }
        </div>

        <ul class="mt-3 space-y-3">
          @for (item of proposals(); track item.name; let index = $index) {
            <li class="rounded-xl border bg-white shadow-sm {{ item.added ? 'border-green-300' : item.duplicateOf || item.websiteStatus === 'broken' ? 'border-amber-300' : 'border-gray-200' }}">
              <div class="flex flex-wrap items-start gap-3 p-4">
                <div class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-center gap-2">
                    <span class="text-[15px] font-bold text-[#032D42]">{{ item.name }}</span>
                    @if (item.free) {
                      <span class="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-200">Free</span>
                    }
                    @if (item.online) {
                      <span class="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">Online</span>
                    }
                  </p>
                  <p class="mt-1 text-sm leading-6 text-gray-700">{{ item.description }}</p>
                  <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <a [href]="item.website" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-medium text-[#007979] hover:underline">
                      <mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">language</mat-icon>
                      {{ host(item.website) }}
                    </a>
                    <span class="inline-flex items-center gap-1 {{ item.websiteStatus === 'ok' ? 'text-green-700' : item.websiteStatus === 'broken' ? 'text-red-600' : 'text-gray-500' }}">
                      <mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">{{ item.websiteStatus === 'ok' ? 'check_circle' : item.websiteStatus === 'broken' ? 'error' : 'help' }}</mat-icon>
                      {{ item.websiteStatus === 'ok' ? 'Website opens' : item.websiteStatus === 'broken' ? item.websiteNote : 'Could not check: open it to confirm' }}
                    </span>
                    @if (item.phone) {
                      <span class="inline-flex items-center gap-1"><mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">call</mat-icon>{{ item.phone }}</span>
                    }
                    @if (item.city || item.state) {
                      <span class="inline-flex items-center gap-1"><mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">location_on</mat-icon>{{ item.city }}{{ item.city && item.state ? ', ' : '' }}{{ item.state }}</span>
                    }
                    <a [href]="item.sourceUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 hover:text-[#007979] hover:underline">
                      <mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">source</mat-icon>
                      Source
                    </a>
                  </p>
                  @if (item.duplicateOf) {
                    <p class="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                      Possibly already listed as <strong>{{ item.duplicateOf }}</strong>.
                    </p>
                  }
                </div>

                <div class="flex shrink-0 flex-col items-end gap-2">
                  @if (item.added) {
                    <span class="inline-flex h-9 items-center gap-1 rounded-lg bg-green-50 px-3 text-sm font-semibold text-green-700">
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">check</mat-icon>
                      Added as pending
                    </span>
                  } @else {
                    <button
                      type="button"
                      (click)="add(item)"
                      [disabled]="item.adding || !item.categoryId || !item.resourceType"
                      class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none" aria-hidden="true">add</mat-icon>
                      {{ item.adding ? 'Adding…' : 'Add as pending' }}
                    </button>
                    <button type="button" (click)="toggle(index)" class="text-xs font-medium text-gray-600 hover:text-[#007979]">
                      {{ item.open ? 'Hide details' : 'Edit before adding' }}
                    </button>
                  }
                </div>
              </div>

              <!-- Category and type are required; the rest can be fixed here or later. -->
              @if (!item.added) {
                <div class="grid gap-2 border-t border-gray-100 px-4 py-3 sm:grid-cols-2">
                  <label class="text-xs font-semibold text-gray-600">
                    Category
                    <select [(ngModel)]="item.categoryId" [name]="'category' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm font-normal {{ item.categoryId ? '' : 'border-amber-400' }}">
                      <option value="">Choose a category</option>
                      @for (category of categories(); track category.id) {
                        <option [value]="category.id">{{ category.name }}</option>
                      }
                    </select>
                  </label>
                  <label class="text-xs font-semibold text-gray-600">
                    Resource type
                    <select [(ngModel)]="item.resourceType" [name]="'type' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm font-normal">
                      @for (type of resourceTypes(); track type.id) {
                        <option [value]="type.id">{{ type.name }}</option>
                      }
                    </select>
                  </label>
                  @if (item.open) {
                    <label class="text-xs font-semibold text-gray-600 sm:col-span-2">
                      Name
                      <input [(ngModel)]="item.name" [name]="'name' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
                    </label>
                    <label class="text-xs font-semibold text-gray-600 sm:col-span-2">
                      Description
                      <textarea [(ngModel)]="item.description" [name]="'description' + index" rows="3" class="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-normal"></textarea>
                    </label>
                    <label class="text-xs font-semibold text-gray-600">
                      Website
                      <input [(ngModel)]="item.website" [name]="'website' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
                    </label>
                    <label class="text-xs font-semibold text-gray-600">
                      Phone
                      <input [(ngModel)]="item.phone" [name]="'phone' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
                    </label>
                    <label class="text-xs font-semibold text-gray-600">
                      Cost note
                      <input [(ngModel)]="item.costDescription" [name]="'cost' + index" class="mt-1 h-9 w-full rounded-lg border border-gray-300 px-2 text-sm font-normal" />
                    </label>
                    <label class="flex items-end gap-4 text-xs font-semibold text-gray-600">
                      <span class="flex items-center gap-1.5"><input type="checkbox" [(ngModel)]="item.free" [name]="'free' + index" /> Free</span>
                      <span class="flex items-center gap-1.5"><input type="checkbox" [(ngModel)]="item.online" [name]="'online' + index" /> Online</span>
                    </label>
                  }
                </div>
              }
            </li>
          }
        </ul>

        @if (searchedPages().length) {
          <details class="mt-3 text-xs text-gray-500">
            <summary class="cursor-pointer">Pages the AI looked at ({{ searchedPages().length }})</summary>
            <ul class="mt-1 list-disc space-y-0.5 pl-5">
              @for (page of searchedPages(); track page.uri) {
                <li><a [href]="page.uri" target="_blank" rel="noopener noreferrer" class="hover:text-[#007979] hover:underline">{{ page.title || page.uri }}</a></li>
              }
            </ul>
          </details>
        }
      } @else if (searched() && !searching()) {
        <p class="mt-4 rounded-lg bg-white px-4 py-3 text-sm text-gray-600">Nothing found with a working official website. Try wording it differently or a wider area.</p>
      }
    </section>
  `,
})
export class AiResourceFinderComponent {
  private readonly ai = inject(AiService);
  private readonly auth = inject(AuthService);
  private readonly store = inject(ResourceStore);
  private readonly toast = inject(HotToastService);

  readonly categories = input<Category[]>([]);
  readonly resourceTypes = input<ResourceType[]>([]);
  readonly locations = input<Location[]>([]);
  readonly existing = input<Resource[]>([]);

  /** Emitted after resources are added, so the list reloads. */
  readonly added = output<void>();
  readonly closed = output<void>();

  protected readonly examples = EXAMPLES;
  protected query = '';
  protected area = 'Maryland, Washington DC and Virginia';

  protected readonly searching = signal(false);
  protected readonly searched = signal(false);
  protected readonly proposals = signal<Proposal[]>([]);
  protected readonly searchedPages = signal<{ uri: string; title: string }[]>([]);

  protected readonly addedCount = computed(() => this.proposals().filter((item) => item.added).length);
  /** Ready to add in one go: category and type set, not a likely duplicate, website not broken. */
  // A method, not computed(): category and type are edited in place.
  protected addable(): Proposal[] {
    return this.proposals().filter((item) => !item.added && item.categoryId && item.resourceType && !item.duplicateOf && item.websiteStatus !== 'broken');
  }

  protected async search(): Promise<void> {
    const query = this.query.trim();
    if (!query) return;
    this.searching.set(true);
    this.proposals.set([]);
    this.searchedPages.set([]);
    try {
      const result = await this.ai.run<FindResult>('resources', 'find-resources', {
        query,
        area: this.area,
        count: 8,
        categories: this.categories().map((category) => ({ id: category.id, name: category.name })),
        existing: this.existing().map((resource) => ({ name: resource.name, website: resource.website ?? '' })),
      });
      const defaultType = this.resourceTypes()[0]?.id ?? '';
      this.proposals.set(
        result.resources.map((finding) => ({ ...finding, resourceType: defaultType, added: false, adding: false, open: false })),
      );
      this.searchedPages.set(result.searchedPages ?? []);
    } catch (error) {
      this.toast.error(AiService.message(error));
    } finally {
      this.searching.set(false);
      this.searched.set(true);
    }
  }

  protected toggle(index: number): void {
    this.proposals.update((items) => items.map((item, position) => (position === index ? { ...item, open: !item.open } : item)));
  }

  protected async addAll(): Promise<void> {
    for (const item of this.addable()) {
      await this.add(item, false);
    }
    this.added.emit();
  }

  /** Saves one finding as a Pending, unverified resource. */
  protected async add(item: Proposal, emit = true): Promise<void> {
    const uid = this.auth.user()?.id ?? '';
    if (!uid || !item.categoryId || !item.resourceType) return;
    this.patch(item, { adding: true });
    try {
      const taken = new Set(this.existing().map((resource) => resource.slug));
      let slug = slugify(item.name) || 'resource';
      for (let suffix = 2; taken.has(slug); suffix++) {
        slug = `${slugify(item.name)}-${suffix}`;
      }
      const location = this.locations().find(
        (place) =>
          !!item.city &&
          place.city?.trim().toLowerCase() === item.city.trim().toLowerCase() &&
          (!item.state || place.state?.trim().toUpperCase() === item.state),
      );
      await this.store.createResource({
        name: item.name.trim(),
        slug,
        description: [item.description.trim(), item.address ? `Address: ${item.address}.` : ''].filter(Boolean).join('\n\n'),
        categoryId: item.categoryId,
        resourceType: item.resourceType,
        website: item.website.trim(),
        phone: item.phone.trim(),
        email: item.email.trim(),
        locationId: location?.id ?? '',
        organizationId: '',
        online: item.online,
        cost: { free: item.free, ...(item.costDescription.trim() ? { description: item.costDescription.trim() } : {}) },
        tags: [...item.tags, 'found-with-ai'],
        status: 'pending',
        verified: false,
        featured: false,
        createdBy: uid,
      } as unknown as Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>);
      this.patch(item, { added: true, adding: false });
      if (emit) {
        this.toast.success(`${item.name} added as pending.`);
        this.added.emit();
      }
    } catch (error) {
      console.error('Failed to add resource:', error);
      this.toast.error(`Could not add ${item.name}.`);
      this.patch(item, { adding: false });
    }
  }

  protected host(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  private patch(item: Proposal, changes: Partial<Proposal>): void {
    this.proposals.update((items) => items.map((current) => (current === item || current.name === item.name ? { ...current, ...changes } : current)));
  }
}

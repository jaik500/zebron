import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PageTitleService } from '../../../../../../core/services/page-title.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

import { ContentItem } from '../../models/content-operations.model';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 mt-15">

      <!-- =========================================================
           HEADER
           ========================================================= -->
      <div class="bg-[#2a835f] px-4 sm:px-6 lg:px-18 ">
        <div class="flex items-center justify-between gap-3">

          <!-- Breadcrumbs -->
          <div
            class="flex min-w-0 items-center gap-2
                   overflow-hidden text-sm"
          >
            <a
              routerLink="/admin"
              class="shrink-0 text-white/80 transition hover:text-white"
            >
              Admin
            </a>

            <span class="shrink-0 text-white/60">
              /
            </span>

            <a
              routerLink="/admin/content-operations"
              class="shrink-0 text-white/80 transition hover:text-white"
            >
              Content & Operations
            </a>

            <span class="shrink-0 text-white/60">
              /
            </span>

            <span class="truncate text-white">
              Content
            </span>
          </div>

          <!-- New Content -->
          <a
            routerLink="/admin/content-operations/content/create"
            class="inline-flex shrink-0 items-center justify-center
                   gap-2 rounded-lg bg-white/15
                   px-3 py-1 text-sm font-semibold text-white
                   shadow-sm transition hover:bg-white/25
                   sm:px-4 sm:py-2.5"
          >
            <span class="text-lg leading-none">
              +
            </span>

            <span class="hidden sm:inline">
              New Content
            </span>

            <span class="sm:hidden">
              New
            </span>
          </a>
        </div>

        <!-- Description -->
        <p
          class="hidden max-w-2xl pb-1 text-sm text-white sm:block"
        >
          Plan, create, manage, and publish content across
          your platforms.
        </p>
      </div>

      <!-- =========================================================
           MAIN CONTENT
           ========================================================= -->
      <div
        class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >

        <!-- =======================================================
             METRICS
             ======================================================= -->
        <div
          class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >

          <!-- Total -->
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Total
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ totalContent() }}
            </p>
          </div>

          <!-- Ideas -->
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Ideas
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ ideasCount() }}
            </p>
          </div>

          <!-- Production -->
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              In Production
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ productionCount() }}
            </p>
          </div>

          <!-- Ready -->
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Ready
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ readyCount() }}
            </p>
          </div>

          <!-- Published -->
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-medium text-slate-500">
              Published
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-900">
              {{ publishedCount() }}
            </p>
          </div>

        </div>

        <!-- =======================================================
             PRODUCTION PIPELINE
             ======================================================= -->
        <section
          class="mb-8 rounded-2xl border border-slate-200
                 bg-white p-6 shadow-sm"
        >
          <div class="mb-5">
            <h2 class="text-lg font-semibold text-slate-900">
              Production Pipeline
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              Track content as it moves from idea to publication.
            </p>
          </div>

          <div
            class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >

            <!-- Ideas -->
            <button
              type="button"
              (click)="setStatusFilter('idea')"
              class="rounded-xl border border-slate-200
                     p-4 text-left transition
                     hover:border-slate-400 hover:bg-slate-50"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-slate-500"
              >
                Ideas
              </p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ ideasCount() }}
              </p>
            </button>

            <!-- Capturing -->
            <button
              type="button"
              (click)="setStatusFilter('capturing')"
              class="rounded-xl border border-slate-200
                     p-4 text-left transition
                     hover:border-slate-400 hover:bg-slate-50"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-slate-500"
              >
                Capturing
              </p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ capturingCount() }}
              </p>
            </button>

            <!-- Editing -->
            <button
              type="button"
              (click)="setStatusFilter('editing')"
              class="rounded-xl border border-slate-200
                     p-4 text-left transition
                     hover:border-slate-400 hover:bg-slate-50"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-slate-500"
              >
                Editing
              </p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ editingCount() }}
              </p>
            </button>

            <!-- Ready -->
            <button
              type="button"
              (click)="setStatusFilter('ready')"
              class="rounded-xl border border-slate-200
                     p-4 text-left transition
                     hover:border-slate-400 hover:bg-slate-50"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-slate-500"
              >
                Ready
              </p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ readyCount() }}
              </p>
            </button>

            <!-- Published -->
            <button
              type="button"
              (click)="setStatusFilter('published')"
              class="rounded-xl border border-slate-200
                     p-4 text-left transition
                     hover:border-slate-400 hover:bg-slate-50"
            >
              <p
                class="text-xs font-semibold uppercase
                       tracking-wide text-slate-500"
              >
                Published
              </p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ publishedCount() }}
              </p>
            </button>

          </div>
        </section>

        <!-- =======================================================
             FILTERS
             ======================================================= -->
        <section
          class="mb-8 rounded-2xl border border-slate-200
                 bg-white p-6 shadow-sm"
        >
          <div class="grid gap-4 md:grid-cols-3">

            <!-- Search -->
            <div>
              <label
                for="content-search"
                class="mb-2 block text-sm font-medium
                       text-slate-700"
              >
                Search
              </label>

              <input
                id="content-search"
                type="search"
                [value]="searchQuery()"
                (input)="onSearch($event)"
                placeholder="Search content..."
                class="w-full rounded-xl border border-slate-300
                       px-4 py-3 text-sm outline-none transition
                       focus:border-slate-500
                       focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <!-- Platform -->
            <div>
              <label
                for="platform-filter"
                class="mb-2 block text-sm font-medium
                       text-slate-700"
              >
                Platform
              </label>

              <select
                id="platform-filter"
                [value]="platformFilter()"
                (change)="onPlatformChange($event)"
                class="w-full rounded-xl border border-slate-300
                       bg-white px-4 py-3 text-sm outline-none
                       transition focus:border-slate-500
                       focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  All Platforms
                </option>

                <option value="youtube">
                  YouTube
                </option>

                <option value="youtube-short">
                  YouTube Shorts
                </option>

                <option value="instagram">
                  Instagram
                </option>

                <option value="tiktok">
                  TikTok
                </option>

                <option value="linkedin">
                  LinkedIn
                </option>

                <option value="website">
                  Website
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label
                for="status-filter"
                class="mb-2 block text-sm font-medium
                       text-slate-700"
              >
                Status
              </label>

              <select
                id="status-filter"
                [value]="statusFilter()"
                (change)="onStatusChange($event)"
                class="w-full rounded-xl border border-slate-300
                       bg-white px-4 py-3 text-sm outline-none
                       transition focus:border-slate-500
                       focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="idea">
                  Idea
                </option>

                <option value="planned">
                  Planned
                </option>

                <option value="capturing">
                  Capturing
                </option>

                <option value="scripting">
                  Scripting
                </option>

                <option value="editing">
                  Editing
                </option>

                <option value="review">
                  Review
                </option>

                <option value="ready">
                  Ready
                </option>

                <option value="published">
                  Published
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>
            </div>

          </div>

          @if (hasActiveFilters()) {
            <div class="mt-4 flex justify-end">
              <button
                type="button"
                (click)="clearFilters()"
                class="text-sm font-medium text-slate-600
                       transition hover:text-slate-900"
              >
                Clear filters
              </button>
            </div>
          }
        </section>

        <!-- =======================================================
             LOADING
             ======================================================= -->
        @if (loading()) {
          <div
            class="rounded-2xl border border-slate-200
                   bg-white p-10 text-center shadow-sm"
          >
            <p class="text-sm text-slate-500">
              Loading content...
            </p>
          </div>
        }

        <!-- =======================================================
             ERROR
             ======================================================= -->
        @if (error()) {
          <div
            class="rounded-2xl border border-red-200
                   bg-red-50 p-6"
          >
            <h2 class="font-semibold text-red-900">
              Unable to load content
            </h2>

            <p class="mt-2 text-sm text-red-700">
              {{ error() }}
            </p>

            <button
              type="button"
              (click)="loadContent()"
              class="mt-4 rounded-lg bg-red-900
                     px-4 py-2 text-sm font-medium
                     text-white transition hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        }

        <!-- =======================================================
             CONTENT LIST
             ======================================================= -->
        @if (!loading() && !error()) {

          @if (filteredContents().length > 0) {

            <div class="grid gap-5 lg:grid-cols-2">

              @for (
                content of filteredContents();
                track content.id
              ) {

                <article
                  class="rounded-2xl border border-slate-200
                         bg-white p-6 shadow-sm
                         transition hover:shadow-md"
                >

                  <!-- Card Header -->
                  <div
                    class="flex items-start justify-between gap-4"
                  >
                    <div class="min-w-0">

                      <!-- Type / Platform -->
                      <div
                        class="mb-3 flex flex-wrap items-center gap-2"
                      >
                        <span
                          class="rounded-full bg-slate-100
                                 px-3 py-1 text-xs font-semibold
                                 text-slate-700"
                        >
                          {{ formatType(content.type) }}
                        </span>

                        <span
                          class="rounded-full bg-slate-100
                                 px-3 py-1 text-xs font-semibold
                                 text-slate-700"
                        >
                          {{ formatPlatform(content.platform) }}
                        </span>
                      </div>

                      <!-- Title -->
                      <h2
                        class="text-xl font-semibold
                               text-slate-900"
                      >
                        {{ content.title }}
                      </h2>
                    </div>

                    <!-- Status -->
                    <span
                      class="shrink-0 rounded-full px-3 py-1
                             text-xs font-semibold"
                      [class.bg-emerald-100]="
                        content.status === 'published'
                      "
                      [class.text-emerald-700]="
                        content.status === 'published'
                      "
                      [class.bg-blue-100]="
                        content.status === 'ready'
                      "
                      [class.text-blue-700]="
                        content.status === 'ready'
                      "
                      [class.bg-amber-100]="
                        content.status === 'idea' ||
                        content.status === 'planned'
                      "
                      [class.text-amber-700]="
                        content.status === 'idea' ||
                        content.status === 'planned'
                      "
                      [class.bg-violet-100]="
                        content.status === 'capturing' ||
                        content.status === 'scripting' ||
                        content.status === 'editing' ||
                        content.status === 'review'
                      "
                      [class.text-violet-700]="
                        content.status === 'capturing' ||
                        content.status === 'scripting' ||
                        content.status === 'editing' ||
                        content.status === 'review'
                      "
                      [class.bg-slate-100]="
                        content.status === 'archived'
                      "
                      [class.text-slate-600]="
                        content.status === 'archived'
                      "
                    >
                      {{ formatStatus(content.status) }}
                    </span>
                  </div>

                  <!-- Description -->
                  @if (content.description) {
                    <p
                      class="mt-4 line-clamp-3 text-sm
                             leading-6 text-slate-600"
                    >
                      {{ content.description }}
                    </p>
                  }

                  <!-- Metadata -->
                  @if (
                    content.category ||
                    content.milestoneId
                  ) {
                    <div
                      class="mt-5 grid gap-3
                             border-t border-slate-100
                             pt-5 sm:grid-cols-2"
                    >

                      @if (content.category) {
                        <div>
                          <p
                            class="text-xs font-semibold
                                   uppercase tracking-wide
                                   text-slate-400"
                          >
                            Category
                          </p>

                          <p
                            class="mt-1 text-sm text-slate-700"
                          >
                            {{ content.category }}
                          </p>
                        </div>
                      }

                      @if (content.milestoneId) {
                        <div>
                          <p
                            class="text-xs font-semibold
                                   uppercase tracking-wide
                                   text-slate-400"
                          >
                            Milestone
                          </p>

                          <p
                            class="mt-1 truncate text-sm
                                   text-slate-700"
                          >
                            {{ content.milestoneId }}
                          </p>
                        </div>
                      }

                    </div>
                  }

                  <!-- =================================================
                       ACTIONS
                       ================================================= -->
                  <div
                    class="mt-6 flex flex-wrap items-center
                           gap-3 border-t border-slate-100
                           pt-5"
                  >

                    <!-- Edit -->
                    <a
                      [routerLink]="[
                        '/admin/content-operations/content',
                        content.id,
                        'edit'
                      ]"
                      class="inline-flex items-center
                             justify-center rounded-lg
                             bg-slate-900 px-4 py-2.5
                             text-sm font-semibold
                             text-white transition
                             hover:bg-slate-800"
                    >
                      Edit
                    </a>

                    <!-- Open Assets -->
                    @if (content.externalFolderUrl) {
                      <a
                        [href]="content.externalFolderUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center
                               justify-center rounded-lg
                               border border-slate-300
                               bg-white px-4 py-2.5
                               text-sm font-medium
                               text-slate-700 transition
                               hover:bg-slate-50"
                      >
                        Open Assets
                      </a>
                    }

                    <!-- View Published -->
                    @if (content.publishedUrl) {
                      <a
                        [href]="content.publishedUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center
                               justify-center rounded-lg
                               border border-slate-300
                               bg-white px-4 py-2.5
                               text-sm font-medium
                               text-slate-700 transition
                               hover:bg-slate-50"
                      >
                        View Published
                      </a>
                    }

                    <!-- Delete -->
                    <button
                      type="button"
                      (click)="deleteContent(content)"
                      [disabled]="loading()"
                      class="inline-flex items-center
                             justify-center rounded-lg
                             border border-red-200
                             bg-white px-4 py-2.5
                             text-sm font-semibold
                             text-red-600 transition
                             hover:bg-red-50
                             disabled:cursor-not-allowed
                             disabled:opacity-50"
                    >
                      Delete
                    </button>

                  </div>

                </article>
              }

            </div>

          } @else {

            <!-- =====================================================
                 EMPTY STATE
                 ===================================================== -->
            <div
              class="rounded-2xl border border-dashed
                     border-slate-300 bg-white p-12
                     text-center"
            >
              <div
                class="mx-auto flex h-14 w-14 items-center
                       justify-center rounded-full
                       bg-slate-100 text-2xl"
              >
                +
              </div>

              <h2
                class="mt-5 text-lg font-semibold
                       text-slate-900"
              >
                No content found
              </h2>

              <p
                class="mx-auto mt-2 max-w-md text-sm
                       leading-6 text-slate-500"
              >
                @if (hasActiveFilters()) {
                  No content matches the current filters.
                } @else {
                  Start building your content pipeline by creating
                  your first content item.
                }
              </p>

              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="mt-5 rounded-lg border
                         border-slate-300 bg-white
                         px-4 py-2.5 text-sm font-medium
                         text-slate-700 transition
                         hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              } @else {
                <a
                  routerLink="/admin/content-operations/content/create"
                  class="mt-5 inline-flex items-center
                         rounded-lg bg-slate-900
                         px-4 py-2.5 text-sm font-semibold
                         text-white transition
                         hover:bg-slate-800"
                >
                  Create Content
                </a>
              }
            </div>

          }

        }

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent implements OnInit {
  private readonly pageTitleService =
    inject(PageTitleService);

  private readonly contentService =
    inject(ContentService);

  private readonly dialog =
    inject(MatDialog);

  readonly contents =
    signal<ContentItem[]>([]);

  readonly loading =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly searchQuery =
    signal('');

  readonly platformFilter =
    signal('all');

  readonly statusFilter =
    signal('all');

  /**
   * Total content count.
   */
  readonly totalContent = computed(
    () => this.contents().length,
  );

  /**
   * Idea and planned content count.
   */
  readonly ideasCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'idea' ||
          content.status === 'planned',
      ).length,
  );

  /**
   * Content currently in production.
   */
  readonly productionCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'capturing' ||
          content.status === 'scripting' ||
          content.status === 'editing' ||
          content.status === 'review',
      ).length,
  );

  /**
   * Content currently being captured.
   */
  readonly capturingCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'capturing',
      ).length,
  );

  /**
   * Content currently being edited.
   */
  readonly editingCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'editing',
      ).length,
  );

  /**
   * Content ready for publishing.
   */
  readonly readyCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'ready',
      ).length,
  );

  /**
   * Published content count.
   */
  readonly publishedCount = computed(
    () =>
      this.contents().filter(
        (content) =>
          content.status === 'published',
      ).length,
  );

  /**
   * Content after search and filter criteria.
   */
  readonly filteredContents = computed(() => {
    const search =
      this.searchQuery()
        .trim()
        .toLowerCase();

    const platform =
      this.platformFilter();

    const status =
      this.statusFilter();

    return this.contents().filter(
      (content) => {
        const matchesSearch =
          !search ||
          content.title
            .toLowerCase()
            .includes(search) ||
          content.description
            ?.toLowerCase()
            .includes(search) ||
          content.category
            ?.toLowerCase()
            .includes(search);

        const matchesPlatform =
          platform === 'all' ||
          content.platform === platform;

        const matchesStatus =
          status === 'all' ||
          content.status === status;

        return (
          matchesSearch &&
          matchesPlatform &&
          matchesStatus
        );
      },
    );
  });

  /**
   * Whether any filters are currently active.
   */
  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.platformFilter() !== 'all' ||
      this.statusFilter() !== 'all',
  );

  constructor() {
    this.pageTitleService.setTitle(
      'Content',
    );
  }

  async ngOnInit(): Promise<void> {
    await this.loadContent();
  }

  /**
   * Load content items from Firestore.
   */
  async loadContent(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const contents =
        await this.contentService.getContents();

      this.contents.set(contents);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load content.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete a content item after confirmation.
   */
  async deleteContent(
    content: ContentItem,
  ): Promise<void> {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Content',
      message: `Are you sure you want to delete "${content.title}"?`,
      warning:
        'This action permanently removes this content item from the Content & Operations system.',
      icon: 'delete_outline',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    };

    const dialogRef =
      this.dialog.open(
        ConfirmationDialogComponent,
        {
          width: '520px',
          maxWidth: 'calc(100vw - 32px)',
          data: dialogData,
        },
      );

    const confirmed =
      await firstValueFrom(
        dialogRef.afterClosed(),
      );

    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.contentService.deleteContent(
        content.id,
      );

      await this.loadContent();
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to delete content.',
      );

      this.loading.set(false);
    }
  }

  /**
   * Update the search filter.
   */
  onSearch(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.searchQuery.set(
      input.value,
    );
  }

  /**
   * Update the platform filter.
   */
  onPlatformChange(event: Event): void {
    const select =
      event.target as HTMLSelectElement;

    this.platformFilter.set(
      select.value,
    );
  }

  /**
   * Update the status filter.
   */
  onStatusChange(event: Event): void {
    const select =
      event.target as HTMLSelectElement;

    this.statusFilter.set(
      select.value,
    );
  }

  /**
   * Set a status filter from the pipeline.
   */
  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
  }

  /**
   * Reset all filters.
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.platformFilter.set('all');
    this.statusFilter.set('all');
  }

  /**
   * Format content type for display.
   */
  formatType(
    type: ContentItem['type'],
  ): string {
    const labels: Record<
      ContentItem['type'],
      string
    > = {
      video: 'Video',
      short: 'Short',
      post: 'Post',
      article: 'Article',
      tutorial: 'Tutorial',
      image: 'Image',
    };

    return labels[type];
  }

  /**
   * Format platform for display.
   */
  formatPlatform(
    platform: ContentItem['platform'],
  ): string {
    const labels: Record<
      ContentItem['platform'],
      string
    > = {
      youtube: 'YouTube',
      'youtube-short': 'YouTube Shorts',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      linkedin: 'LinkedIn',
      website: 'Website',
      other: 'Other',
    };

    return labels[platform];
  }

  /**
   * Format pipeline status for display.
   */
  formatStatus(
    status: ContentItem['status'],
  ): string {
    const labels: Record<
      ContentItem['status'],
      string
    > = {
      idea: 'Idea',
      planned: 'Planned',
      capturing: 'Capturing',
      scripting: 'Scripting',
      editing: 'Editing',
      review: 'Review',
      ready: 'Ready',
      published: 'Published',
      archived: 'Archived',
    };

    return labels[status];
  }
}
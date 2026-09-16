import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { PageTitleService } from '../../../../../core/services/page-title.service';

import { ContentMilestone } from '../models/content-operations.model';

import { ContentItem } from '../models/content-operations.model';

import { ContentService } from '../services/content.service';

@Component({
  selector: 'app-content-operations',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 mt-16">
      <!-- =========================================================
           PAGE HEADER
           ========================================================= -->

      <header
        class="border-b border-gray-200
               bg-[#2a835f] text-white"
      >
        <div
          class="mx-auto max-w-7xl
                 px-4 py-1
                 sm:px-6 lg:px-8"
        >
          <div
            class="flex flex-col gap-4
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >
            <!-- Title -->

            <div>
              <div class="flex items-center gap-2">
                <a
                  routerLink="/admin"
                  class="text-sm text-white/70
                         transition hover:text-white"
                >
                  Admin Dashboard
                </a>

                <span class="text-white/40"> / </span>

                <span class="text-sm text-white/90"> Content & Operations </span>
              </div>

              <p
                class="mt-1 max-w-2xl
                       text-sm text-white/75"
              >
                Manage Figure Out With J content, development milestones, captures, production
                tools, and operational resources.
              </p>
            </div>

            <!-- Actions -->

            <div class="flex flex-wrap gap-2">
              <a
                routerLink="/admin"
                class="inline-flex items-center
                       rounded-xl
                       border border-white/25
                       bg-white/10
                       px-4 py-2
                       text-sm font-semibold
                       text-white
                       transition hover:bg-white/20"
              >
                ← Admin Dashboard
              </a>

              <a
                href="https://studio.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center
                       rounded-xl
                       bg-[#007979]
                       px-4 py-2
                       text-sm font-semibold
                       text-white
                       transition hover:bg-[#006666]"
              >
                YouTube Studio ↗
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- =========================================================
           MAIN CONTENT
           ========================================================= -->

      <main
        class="mx-auto max-w-7xl
               px-3 py-5
               sm:px-6 sm:py-7
               lg:px-8"
      >
        <!-- =======================================================
             FIGURE OUT WITH J HERO
             ======================================================= -->

        <section
          class="overflow-hidden
                 rounded-2xl
                 border border-[#B8D1D3]
                 bg-white shadow-sm"
        >
          <div
            class="grid
                   lg:grid-cols-[1.5fr_1fr]"
          >
            <!-- Channel introduction -->

            <div
              class="bg-[#032D42]
                     p-6 text-white
                     sm:p-8"
            >
              <div
                class="mb-4 inline-flex
                       items-center gap-2
                       rounded-full
                       border border-[#7ED6D1]/30
                       bg-[#007979]/20
                       px-3 py-1.5
                       text-xs font-semibold
                       uppercase tracking-wider
                       text-[#7ED6D1]"
              >
                <span
                  class="h-2 w-2 rounded-full
                         bg-[#7ED6D1]"
                ></span>

                Figure Out With J
              </div>

              <h2
                class="max-w-xl
                       text-3xl font-bold
                       tracking-tight
                       sm:text-4xl"
              >
                If I figure it out, I'll show you how.
              </h2>

              <p
                class="mt-4 max-w-2xl
                       text-sm leading-6
                       text-white/75
                       sm:text-base"
              >
                A practical content platform built around real problems, real solutions, and the
                journey of building Zebron.
              </p>

              <div class="mt-6 flex flex-wrap gap-3">
                <a
                  routerLink="/admin/content-operations/milestones"
                  class="inline-flex items-center
                         rounded-xl
                         bg-white
                         px-4 py-2.5
                         text-sm font-semibold
                         text-[#032D42]
                         transition hover:bg-gray-100"
                >
                  View Milestones
                </a>

                <a
                  routerLink="/admin/content-operations/captures"
                  class="inline-flex items-center
                         rounded-xl
                         border border-white/25
                         bg-white/10
                         px-4 py-2.5
                         text-sm font-semibold
                         text-white
                         transition hover:bg-white/15"
                >
                  Capture Moments
                </a>
              </div>
            </div>

            <!-- Channel pillars -->

            <div class="p-6 sm:p-8">
              <p
                class="text-xs font-semibold
                       uppercase tracking-wider
                       text-[#007979]"
              >
                Content direction
              </p>

              <h3
                class="mt-1 text-xl
                       font-bold text-[#032D42]"
              >
                What we're building around
              </h3>

              <div
                class="mt-5 grid
                       grid-cols-2 gap-3"
              >
                @for (pillar of contentPillars; track pillar.name) {
                  <div
                    class="rounded-xl
                           border border-gray-200
                           bg-gray-50
                           p-4"
                  >
                    <div class="text-xl">
                      {{ pillar.icon }}
                    </div>

                    <p
                      class="mt-2 text-sm
                             font-semibold
                             text-gray-900"
                    >
                      {{ pillar.name }}
                    </p>

                    <p
                      class="mt-1 text-xs
                             leading-5
                             text-gray-500"
                    >
                      {{ pillar.description }}
                    </p>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>

        <!-- =======================================================
             CONTENT METRICS
             ======================================================= -->

        <section class="mt-6">
          <div class="mb-3">
            <p
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Content overview
            </p>

            <h2
              class="text-xl font-bold
                     text-[#032D42]"
            >
              Production at a glance
            </h2>
          </div>

          @if (error()) {
            <div
              class="mb-4 rounded-xl
                     border border-red-200
                     bg-red-50 p-4"
              role="alert"
            >
              <p
                class="text-sm font-semibold
                       text-red-800"
              >
                Unable to load content
              </p>

              <p
                class="mt-1 text-sm
                       text-red-700"
              >
                {{ error() }}
              </p>

              <button
                type="button"
                class="mt-2 text-sm
                       font-semibold
                       text-red-800
                       underline"
                (click)="loadContent()"
              >
                Try again
              </button>
            </div>
          }

          <div
            class="grid
                   grid-cols-2
                   gap-3
                   lg:grid-cols-4"
          >
            @for (metric of contentMetrics(); track metric.label) {
              <div
                class="rounded-2xl
                       border border-gray-200
                       bg-white
                       p-4
                       shadow-sm
                       sm:p-5"
              >
                <div
                  class="flex items-start
                         justify-between gap-3"
                >
                  <div>
                    <p
                      class="text-sm
                             font-medium
                             text-gray-500"
                    >
                      {{ metric.label }}
                    </p>

                    <p
                      class="mt-1 text-3xl
                             font-bold
                             text-[#032D42]"
                    >
                      {{ metric.value }}
                    </p>
                  </div>

                  <div
                    class="flex h-10 w-10
                           items-center
                           justify-center
                           rounded-xl
                           bg-[#007979]/10
                           text-xl"
                  >
                    {{ metric.icon }}
                  </div>
                </div>

                <p
                  class="mt-3 text-xs
                         leading-5
                         text-gray-500"
                >
                  {{ metric.description }}
                </p>
              </div>
            }
          </div>
        </section>

        <!-- =======================================================
             CURRENT DEVELOPMENT MILESTONE
             ======================================================= -->

        <section class="mt-6">
          <div
            class="mb-3 flex flex-col
                   gap-2 sm:flex-row
                   sm:items-end
                   sm:justify-between"
          >
            <div>
              <p
                class="text-xs font-semibold
                       uppercase tracking-wider
                       text-[#007979]"
              >
                Current development
              </p>

              <h2
                class="mt-1 text-xl
                       font-bold
                       text-[#032D42]"
              >
                {{ currentMilestone.title }}
              </h2>
            </div>

            <span
              class="inline-flex w-fit
                     rounded-full
                     bg-amber-50
                     px-3 py-1
                     text-xs font-semibold
                     text-amber-700"
            >
              YouTube Production:
              {{ currentMilestone.content }}
            </span>
          </div>

          <div
            class="rounded-2xl
                   border border-gray-200
                   bg-white
                   p-5 shadow-sm
                   sm:p-6"
          >
            <div
              class="grid gap-6
                     lg:grid-cols-[1.4fr_1fr]"
            >
              <!-- Milestone details -->

              <div>
                <p
                  class="text-sm
                         leading-6
                         text-gray-600"
                >
                  {{ currentMilestone.feature }}
                  is a completed Zebron development milestone that can become a Figure Out With J
                  development story.
                </p>

                <div
                  class="mt-5 grid
                         grid-cols-2 gap-3
                         sm:grid-cols-4"
                >
                  <div
                    class="rounded-xl
                           bg-emerald-50
                           p-3"
                  >
                    <p
                      class="text-xs
                             text-emerald-700"
                    >
                      Development
                    </p>

                    <p
                      class="mt-1 text-sm
                             font-bold
                             text-emerald-800"
                    >
                      {{ currentMilestone.development }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl
                           bg-emerald-50
                           p-3"
                  >
                    <p
                      class="text-xs
                             text-emerald-700"
                    >
                      Testing
                    </p>

                    <p
                      class="mt-1 text-sm
                             font-bold
                             text-emerald-800"
                    >
                      {{ currentMilestone.testing }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl
                           bg-emerald-50
                           p-3"
                  >
                    <p
                      class="text-xs
                             text-emerald-700"
                    >
                      Capture
                    </p>

                    <p
                      class="mt-1 text-sm
                             font-bold
                             text-emerald-800"
                    >
                      {{ currentMilestone.capture }}
                    </p>
                  </div>

                  <div
                    class="rounded-xl
                           bg-amber-50
                           p-3"
                  >
                    <p
                      class="text-xs
                             text-amber-700"
                    >
                      Content
                    </p>

                    <p
                      class="mt-1 text-sm
                             font-bold
                             text-amber-800"
                    >
                      {{ currentMilestone.content }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Capture summary -->

              <div
                class="rounded-xl
                       border border-[#B8D1D3]
                       bg-[#F7FBFB]
                       p-5"
              >
                <p
                  class="text-xs font-semibold
                         uppercase tracking-wider
                         text-[#007979]"
                >
                  Captured evidence
                </p>

                <div class="mt-4 space-y-3">
                  <div
                    class="flex items-center
                           justify-between"
                  >
                    <span class="text-sm text-gray-600"> Screenshots </span>

                    <span
                      class="font-bold
                             text-[#032D42]"
                    >
                      {{ currentMilestone.screenshots }}
                    </span>
                  </div>

                  <div
                    class="flex items-center
                           justify-between"
                  >
                    <span class="text-sm text-gray-600"> Recordings </span>

                    <span
                      class="font-bold
                             text-[#032D42]"
                    >
                      {{ currentMilestone.recordings }}
                    </span>
                  </div>

                  <div
                    class="flex items-center
                           justify-between"
                  >
                    <span class="text-sm text-gray-600"> Milestone notes </span>

                    <span
                      class="font-bold
                             text-[#032D42]"
                    >
                      {{ currentMilestone.notes }}
                    </span>
                  </div>
                </div>

                <div
                  class="mt-5 border-t
                         border-gray-200
                         pt-4"
                >
                  <p
                    class="text-xs
                           font-semibold
                           uppercase
                           tracking-wider
                           text-gray-500"
                  >
                    Potential YouTube episode
                  </p>

                  <p
                    class="mt-1 text-sm
                           font-semibold
                           leading-5
                           text-[#032D42]"
                  >
                    {{ currentMilestone.potentialYoutube }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- =======================================================
             QUICK MANAGEMENT AREAS
             ======================================================= -->

        <section class="mt-6">
          <div class="mb-3">
            <p
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Manage
            </p>

            <h2
              class="text-xl font-bold
                     text-[#032D42]"
            >
              Content & Operations
            </h2>
          </div>

          <div
            class="grid gap-4
                   sm:grid-cols-2
                   lg:grid-cols-4"
          >
            @for (area of managementAreas; track area.title) {
              <a
                [routerLink]="area.route"
                class="group rounded-2xl
                       border border-gray-200
                       bg-white
                       p-5 shadow-sm
                       transition
                       hover:-translate-y-0.5
                       hover:border-[#B8D1D3]
                       hover:shadow-md"
              >
                <div
                  class="flex h-11 w-11
                         items-center
                         justify-center
                         rounded-xl
                         bg-[#007979]/10
                         text-xl"
                >
                  {{ area.icon }}
                </div>

                <h3
                  class="mt-4 text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ area.title }}
                </h3>

                <p
                  class="mt-1 text-sm
                         leading-5
                         text-gray-500"
                >
                  {{ area.description }}
                </p>

                <div
                  class="mt-4 text-sm
                         font-semibold
                         text-[#007979]"
                >
                  Open →
                </div>
              </a>
            }
          </div>
        </section>

        <!-- =======================================================
             TOOLS
             ======================================================= -->

        <section class="mt-6">
          <div
            class="mb-3 flex flex-col
                   gap-2 sm:flex-row
                   sm:items-end
                   sm:justify-between"
          >
            <div>
              <p
                class="text-xs font-semibold
                       uppercase tracking-wider
                       text-[#007979]"
              >
                Production stack
              </p>

              <h2
                class="text-xl font-bold
                       text-[#032D42]"
              >
                Tools we use
              </h2>
            </div>

            <a
              routerLink="/admin/content-operations/tools"
              class="text-sm font-semibold
                     text-[#007979]
                     hover:underline"
            >
              View all tools →
            </a>
          </div>

          <div
            class="grid gap-4
                   sm:grid-cols-2
                   lg:grid-cols-3"
          >
            @for (tool of tools; track tool.name) {
              <div
                class="rounded-2xl
                       border border-gray-200
                       bg-white
                       p-5 shadow-sm"
              >
                <div
                  class="flex items-start
                         justify-between gap-3"
                >
                  <div
                    class="flex h-11 w-11
                           shrink-0
                           items-center
                           justify-center
                           rounded-xl
                           bg-gray-100
                           text-xl"
                  >
                    {{ tool.icon }}
                  </div>

                  @if (tool.free) {
                    <span
                      class="rounded-full
                             bg-emerald-50
                             px-2.5 py-1
                             text-[11px]
                             font-semibold
                             text-emerald-700"
                    >
                      Free
                    </span>
                  }
                </div>

                <p
                  class="mt-4 text-xs
                         font-semibold
                         uppercase
                         tracking-wider
                         text-[#007979]"
                >
                  {{ tool.category }}
                </p>

                <h3
                  class="mt-1 text-base
                         font-bold
                         text-[#032D42]"
                >
                  {{ tool.name }}
                </h3>

                <p
                  class="mt-2 text-sm
                         leading-5
                         text-gray-500"
                >
                  {{ tool.description }}
                </p>

                <a
                  [href]="tool.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-4 inline-flex
                         text-sm font-semibold
                         text-[#007979]
                         hover:underline"
                >
                  Official website ↗
                </a>
              </div>
            }
          </div>
        </section>

        <!-- =======================================================
             CAPTURE WORKFLOW
             ======================================================= -->

        <section
          class="mt-6 rounded-2xl
                 border border-[#B8D1D3]
                 bg-[#F7FBFB]
                 p-5 sm:p-6"
        >
          <div
            class="flex flex-col
                   gap-5
                   lg:flex-row
                   lg:items-start
                   lg:justify-between"
          >
            <div class="max-w-2xl">
              <div
                class="inline-flex
                       items-center gap-2
                       rounded-full
                       bg-[#007979]/10
                       px-3 py-1.5
                       text-xs font-semibold
                       text-[#007979]"
              >
                🎥 Figure Out With J
              </div>

              <h2
                class="mt-3 text-xl
                       font-bold
                       text-[#032D42]"
              >
                Capture the important moments.
              </h2>

              <p
                class="mt-2 text-sm
                       leading-6
                       text-gray-600"
              >
                When a Zebron development milestone creates something worth showing, capture the
                evidence while it is available.
              </p>
            </div>

            <div
              class="grid gap-2
                     sm:grid-cols-2
                     lg:w-[520px]"
            >
              @for (step of captureSteps; track step.number) {
                <div
                  class="flex gap-3
                         rounded-xl
                         border border-gray-200
                         bg-white
                         p-3"
                >
                  <div
                    class="flex h-7 w-7
                           shrink-0
                           items-center
                           justify-center
                           rounded-full
                           bg-[#032D42]
                           text-xs font-bold
                           text-white"
                  >
                    {{ step.number }}
                  </div>

                  <div>
                    <p
                      class="text-sm
                             font-semibold
                             text-gray-900"
                    >
                      {{ step.title }}
                    </p>

                    <p
                      class="mt-0.5 text-xs
                             leading-5
                             text-gray-500"
                    >
                      {{ step.description }}
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- =======================================================
             EXTERNAL STORAGE
             ======================================================= -->

        <section class="mt-6">
          <div class="mb-3">
            <p
              class="text-xs font-semibold
                     uppercase tracking-wider
                     text-[#007979]"
            >
              Media storage
            </p>

            <h2
              class="text-xl font-bold
                     text-[#032D42]"
            >
              External assets
            </h2>
          </div>

          <div
            class="grid gap-4
                   md:grid-cols-2"
          >
            <!-- Development Media -->

            <div
              class="rounded-2xl
                     border border-gray-200
                     bg-white
                     p-5 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11
                         items-center
                         justify-center
                         rounded-xl
                         bg-[#007979]/10
                         text-xl"
                >
                  ☁️
                </div>

                <div>
                  <h3
                    class="font-bold
                           text-[#032D42]"
                  >
                    Development Media
                  </h3>

                  <p
                    class="text-xs
                           text-gray-500"
                  >
                    Screenshots, recordings, audio and editing files
                  </p>
                </div>
              </div>

              <p
                class="mt-4 text-sm
                       leading-5
                       text-gray-600"
              >
                Store large media outside Git and use Zebron to keep the metadata and external
                storage link organized.
              </p>

              <button
                type="button"
                disabled
                class="mt-4 inline-flex
                       cursor-not-allowed
                       items-center
                       rounded-xl
                       border border-gray-200
                       bg-gray-50
                       px-4 py-2
                       text-sm font-semibold
                       text-gray-400"
              >
                Storage link not configured
              </button>
            </div>

            <!-- Git Repository -->

            <div
              class="rounded-2xl
                     border border-gray-200
                     bg-white
                     p-5 shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11
                         items-center
                         justify-center
                         rounded-xl
                         bg-gray-100
                         text-xl"
                >
                  🧑‍💻
                </div>

                <div>
                  <h3
                    class="font-bold
                           text-[#032D42]"
                  >
                    Git Repository
                  </h3>

                  <p
                    class="text-xs
                           text-gray-500"
                  >
                    Zebron source code and development history
                  </p>
                </div>
              </div>

              <p
                class="mt-4 text-sm
                       leading-5
                       text-gray-600"
              >
                Source code and meaningful development history remain in Git. Large video and media
                files should not be committed here.
              </p>

              <button
                type="button"
                disabled
                class="mt-4 inline-flex
                       cursor-not-allowed
                       items-center
                       rounded-xl
                       border border-gray-200
                       bg-gray-50
                       px-4 py-2
                       text-sm font-semibold
                       text-gray-400"
              >
                Repository link not configured
              </button>
            </div>
          </div>
        </section>

        <!-- =======================================================
             FOOTER NOTE
             ======================================================= -->

        <section class="mt-6 pb-8 text-center">
          <p
            class="text-xs leading-5
                   text-gray-400"
          >
            Figure Out With J — building in public by solving real problems and showing what it
            takes to figure them out.
          </p>
        </section>
      </main>
    </div>
  `,

  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentOperationsComponent implements OnInit {
  // ===========================================================
  // SERVICES
  // ===========================================================

  private readonly pageTitleService = inject(PageTitleService);

  private readonly contentService = inject(ContentService);

  // ===========================================================
  // CONTENT STATE
  // ===========================================================

  readonly contents = signal<ContentItem[]>([]);

  readonly loading = signal(false);

  readonly error = signal<string | null>(null);

  // ===========================================================
  // FIGURE OUT WITH J CONTENT PILLARS
  // ===========================================================

  readonly contentPillars = [
    {
      name: 'Tech',
      icon: '💻',
      description: 'Development, software, platforms, and technical problem solving.',
    },

    {
      name: 'AI',
      icon: '🤖',
      description: 'Practical AI tools, workflows, and real-world use cases.',
    },

    {
      name: 'Travel',
      icon: '✈️',
      description: 'Travel experiences, planning, logistics, and lessons learned.',
    },

    {
      name: 'Career',
      icon: '📈',
      description: 'Career development, business, opportunities, and professional growth.',
    },

    {
      name: 'Life',
      icon: '🧭',
      description: 'Useful how-to content and lessons from figuring things out.',
    },
  ];

  // ===========================================================
  // CURRENT DEVELOPMENT MILESTONE
  // ===========================================================

  readonly currentMilestone: ContentMilestone = {
    title: 'Community Notifications',

    feature: 'Community notification system',

    development: 'Complete',

    testing: 'Complete',

    capture: 'Complete',

    content: 'In Production',

    potentialYoutube: 'How I Built a Notification System From Scratch',

    screenshots: 4,

    recordings: 3,

    notes: 1,
  };

  // ===========================================================
  // CONTENT METRICS
  // ===========================================================

  readonly contentMetrics = computed(() => {
    const contents = this.contents();

    return [
      {
        label: 'Ideas',
        value: contents.filter(
          (content) => content.status === 'idea' || content.status === 'planned',
        ).length,
        icon: '💡',
        description: 'Content ideas waiting to be developed.',
      },

      {
        label: 'Capturing',
        value: contents.filter((content) => content.status === 'capturing').length,
        icon: '🎥',
        description: 'Development milestones currently being captured.',
      },

      {
        label: 'Editing',
        value: contents.filter((content) => content.status === 'editing').length,
        icon: '🎬',
        description: 'Content currently in the editing stage.',
      },

      {
        label: 'Published',
        value: contents.filter((content) => content.status === 'published').length,
        icon: '🚀',
        description: 'Content pieces already published.',
      },
    ];
  });

  // ===========================================================
  // MANAGEMENT AREAS
  // ===========================================================

  readonly managementAreas = [
    {
      title: 'Content',
      description: 'Plan videos, Shorts, tutorials, and social content.',
      icon: '🎬',
      route: '/admin/content-operations/content',
    },

    {
      title: 'Milestones',
      description: 'Connect Zebron development achievements to future content.',
      icon: '🏗️',
      route: '/admin/content-operations/milestones',
    },

    {
      title: 'Capture',
      description: 'Register screenshots, recordings, demos, and notes.',
      icon: '📸',
      route: '/admin/content-operations/captures',
    },

    {
      title: 'Tools',
      description: 'Manage the tools used for AI, production, design, and publishing.',
      icon: '🧰',
      route: '/admin/content-operations/tools',
    },

    {
      title: 'Content Ideas',
      description: 'Capture, organize, prioritize, and develop ideas for future content.',
      route: '/admin/content-operations/ideas',
      icon: '💡',
    },
  ];

  // ===========================================================
  // TOOLS
  // ===========================================================

  readonly tools = [
    {
      name: 'ChatGPT',
      category: 'AI',
      description:
        'Ideas, scripts, research, storyboards, titles, descriptions, and production assistance.',
      icon: '🤖',
      website: 'https://chatgpt.com/',
      free: true,
    },

    {
      name: 'OBS Studio',
      category: 'Production',
      description:
        'Screen recording for Zebron development, demos, tutorials, and development stories.',
      icon: '🎥',
      website: 'https://obsproject.com/',
      free: true,
    },

    {
      name: 'DaVinci Resolve',
      category: 'Production',
      description: 'Primary long-form video editing, color, motion graphics, and audio production.',
      icon: '🎬',
      website: 'https://www.blackmagicdesign.com/products/davinciresolve',
      free: true,
    },

    {
      name: 'Canva',
      category: 'Design',
      description:
        'Thumbnails, graphics, channel branding, social graphics, and supporting visuals.',
      icon: '🎨',
      website: 'https://www.canva.com/',
      free: true,
    },

    {
      name: 'Audacity',
      category: 'Audio',
      description: 'Voice recording and audio cleanup for narration and production.',
      icon: '🎙️',
      website: 'https://www.audacityteam.org/',
      free: true,
    },

    {
      name: 'YouTube Studio',
      category: 'Publishing',
      description:
        'Publishing, thumbnails, descriptions, analytics, comments, and channel management.',
      icon: '▶️',
      website: 'https://studio.youtube.com/',
      free: true,
    },
  ];

  // ===========================================================
  // CAPTURE WORKFLOW
  // ===========================================================

  readonly captureSteps = [
    {
      number: 1,
      title: 'Identify',
      description: 'Recognize a development moment worth showing.',
    },

    {
      number: 2,
      title: 'Capture',
      description: 'Take the screenshot or record the workflow.',
    },

    {
      number: 3,
      title: 'Store',
      description: 'Keep large media in external storage.',
    },

    {
      number: 4,
      title: 'Register',
      description: 'Connect the capture to its Zebron milestone.',
    },
  ];

  // ===========================================================
  // INITIALIZATION
  // ===========================================================

  async ngOnInit(): Promise<void> {
    this.pageTitleService.setTitle('Content & Operations');

    await this.loadContent();
  }

  // ===========================================================
  // LOAD CONTENT
  // ===========================================================

  async loadContent(): Promise<void> {
    this.loading.set(true);

    this.error.set(null);

    try {
      const contents = await this.contentService.getContents();

      this.contents.set(contents);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to load content.');
    } finally {
      this.loading.set(false);
    }
  }
}

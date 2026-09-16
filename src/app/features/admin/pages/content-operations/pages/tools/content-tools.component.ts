import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageTitleService } from '../../../../../../core/services/page-title.service';

import { OperationTool } from '../../models/tools.model';

@Component({
  selector: 'app-content-tools',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50">

      <!-- =========================================================
           PAGE HEADER
      ========================================================== -->
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-6 py-8">

          <!-- Breadcrumbs -->
          <nav
            class="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
            aria-label="Breadcrumb"
          >
            <a
              routerLink="/admin"
              class="transition hover:text-slate-900"
            >
              Admin Dashboard
            </a>

            <span>/</span>

            <a
              routerLink="/admin/content-operations"
              class="transition hover:text-slate-900"
            >
              Content & Operations
            </a>

            <span>/</span>

            <span class="font-medium text-slate-900">
              Tools
            </span>
          </nav>

          <div
            class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>

              <div
                class="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Figure Out With J
              </div>

              <h1
                class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Tools
              </h1>

              <p
                class="mt-3 max-w-3xl text-base leading-7 text-slate-600"
              >
                Maintain the tools used to build Zebron, create Figure Out
                With J content, manage media, publish content, and run
                day-to-day operations.
              </p>

            </div>

            <div class="flex flex-wrap gap-3">

              <a
                routerLink="/admin/content-operations"
                class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Operations Hub
              </a>

              <a
                routerLink="/admin/content-operations/captures"
                class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Capture Moments
              </a>

            </div>
          </div>

        </div>
      </header>

      <!-- =========================================================
           MAIN CONTENT
      ========================================================== -->
      <main class="mx-auto max-w-7xl px-6 py-8">

        <!-- =======================================================
             METRICS
        ======================================================== -->
        <section class="mb-8">

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <!-- Total Tools -->
            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Total Tools
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ tools.length }}
              </div>

              <p class="mt-2 text-xs text-slate-500">
                Tools currently registered
              </p>
            </div>

            <!-- Active Tools -->
            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Active Tools
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ activeTools }}
              </div>

              <p class="mt-2 text-xs text-slate-500">
                Tools currently used
              </p>
            </div>

            <!-- Free Tier -->
            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Free Tier
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ freeTools }}
              </div>

              <p class="mt-2 text-xs text-slate-500">
                Tools with a free option
              </p>
            </div>

            <!-- Categories -->
            <div
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div class="text-sm font-medium text-slate-500">
                Categories
              </div>

              <div class="mt-2 text-3xl font-bold text-slate-900">
                {{ categories.length }}
              </div>

              <p class="mt-2 text-xs text-slate-500">
                Operational tool categories
              </p>
            </div>

          </div>

        </section>

        <!-- =======================================================
             TOOL PHILOSOPHY
        ======================================================== -->
        <section
          class="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          <div class="grid gap-0 lg:grid-cols-[1.4fr_1fr]">

            <!-- Main -->
            <div class="p-6 sm:p-8">

              <div
                class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-6 w-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.25 6.75 17.25 3.75l3 3-3 3"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m17.25 6.75-6.5 6.5"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m8.25 17.25-3 3-1.5-1.5 3-3"
                  />

                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m7.5 13.5 3 3"
                  />
                </svg>
              </div>

              <h2 class="text-xl font-bold text-slate-900">
                Use tools intentionally.
              </h2>

              <p
                class="mt-3 max-w-2xl text-sm leading-6 text-slate-600"
              >
                The goal is not to collect hundreds of tools. The goal is to
                maintain a small, reliable toolkit that helps build Zebron,
                document the journey, produce useful content, and operate the
                platform efficiently.
              </p>

              <div class="mt-6 grid gap-3 sm:grid-cols-3">

                @for (
                  principle of toolPrinciples;
                  track principle.title
                ) {

                  <div
                    class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <h3
                      class="mb-2 text-sm font-semibold text-slate-900"
                    >
                      {{ principle.title }}
                    </h3>

                    <p
                      class="text-xs leading-5 text-slate-600"
                    >
                      {{ principle.description }}
                    </p>

                  </div>

                }

              </div>

            </div>

            <!-- Principle -->
            <div
              class="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0 sm:p-8"
            >

              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Operating Principle
              </div>

              <blockquote
                class="mt-3 border-l-4 border-slate-300 pl-4 text-lg font-semibold leading-7 text-slate-800"
              >
                “Choose the simplest tool that gets the job done well.”
              </blockquote>

              <p
                class="mt-4 text-sm leading-6 text-slate-500"
              >
                Document why each important tool exists and how it fits into
                the overall workflow.
              </p>

            </div>

          </div>

        </section>

        <!-- =======================================================
             CATEGORY FILTERS
        ======================================================== -->
        <section class="mb-6">

          <div class="mb-4">

            <div
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Tool Categories
            </div>

            <h2 class="mt-1 text-xl font-bold text-slate-900">
              Browse the Toolkit
            </h2>

          </div>

          <div class="flex flex-wrap gap-2">

            <!-- All -->
            <button
              type="button"
              (click)="selectedCategory = 'all'"
              class="rounded-full px-4 py-2 text-sm font-semibold transition"
              [class.bg-slate-900]="selectedCategory === 'all'"
              [class.text-white]="selectedCategory === 'all'"
              [class.bg-white]="selectedCategory !== 'all'"
              [class.text-slate-600]="selectedCategory !== 'all'"
              [class.ring-1]="selectedCategory !== 'all'"
              [class.ring-slate-200]="selectedCategory !== 'all'"
            >
              All
            </button>

            <!-- Categories -->
            @for (
              category of categories;
              track category
            ) {

              <button
                type="button"
                (click)="selectedCategory = category"
                class="rounded-full px-4 py-2 text-sm font-semibold transition"
                [class.bg-slate-900]="selectedCategory === category"
                [class.text-white]="selectedCategory === category"
                [class.bg-white]="selectedCategory !== category"
                [class.text-slate-600]="selectedCategory !== category"
                [class.ring-1]="selectedCategory !== category"
                [class.ring-slate-200]="selectedCategory !== category"
              >
                {{ categoryLabel(category) }}
              </button>

            }

          </div>

        </section>

        <!-- =======================================================
             TOOL LIBRARY
        ======================================================== -->
        <section class="mb-8">

          <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Tool Library
              </div>

              <h2 class="mt-1 text-xl font-bold text-slate-900">
                Current Toolkit
              </h2>

            </div>

            <span class="text-sm text-slate-500">
              {{ filteredTools.length }} tools shown
            </span>

          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            @for (
              tool of filteredTools;
              track tool.id
            ) {

              <article
                class="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >

                <!-- =================================================
                     TOOL HEADER
                ================================================== -->
                <div
                  class="flex items-start justify-between gap-4"
                >

                  <div class="flex min-w-0 items-start gap-3">

                    <!-- Category Icon -->
                    <div
                      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold uppercase text-slate-700"
                    >
                      {{ tool.category.slice(0, 2) }}
                    </div>

                    <div class="min-w-0">

                      <h3
                        class="text-base font-bold text-slate-900"
                      >
                        {{ tool.name }}
                      </h3>

                      <div
                        class="mt-1 text-xs font-medium text-slate-500"
                      >
                        {{ categoryLabel(tool.category) }}
                      </div>

                    </div>

                  </div>

                  <!-- Status -->
                  @if (tool.active) {

                    <span
                      class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    >
                      Active
                    </span>

                  } @else {

                    <span
                      class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500"
                    >
                      Inactive
                    </span>

                  }

                </div>

                <!-- =================================================
                     DESCRIPTION
                ================================================== -->
                <p
                  class="mt-4 text-sm leading-6 text-slate-600"
                >
                  {{ tool.description }}
                </p>

                <!-- =================================================
                     PURPOSE
                ================================================== -->
                <div class="mt-5">

                  <div
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Purpose
                  </div>

                  <p
                    class="mt-2 text-sm leading-6 text-slate-700"
                  >
                    {{ tool.purpose }}
                  </p>

                </div>

                <!-- =================================================
                     HOW WE USE IT
                ================================================== -->
                <div class="mt-5">

                  <div
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    How We Use It
                  </div>

                  <ul class="mt-2 space-y-2">

                    @for (
                      use of tool.howWeUseIt;
                      track use
                    ) {

                      <li
                        class="flex gap-2 text-xs leading-5 text-slate-600"
                      >

                        <span
                          class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                        ></span>

                        <span>
                          {{ use }}
                        </span>

                      </li>

                    }

                  </ul>

                </div>

                <!-- =================================================
                     INSTRUCTIONS
                ================================================== -->
                <div class="mt-5">

                  <div
                    class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Workflow
                  </div>

                  <ol class="mt-2 space-y-2">

                    @for (
                      instruction of tool.instructions.slice(0, 3);
                      track instruction;
                      let index = $index
                    ) {

                      <li
                        class="flex gap-2 text-xs leading-5 text-slate-600"
                      >

                        <span
                          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600"
                        >
                          {{ index + 1 }}
                        </span>

                        <span>
                          {{ instruction }}
                        </span>

                      </li>

                    }

                  </ol>

                </div>

                <!-- =================================================
                     TIPS
                ================================================== -->
                @if (tool.tips?.length) {

                  <div class="mt-5 rounded-xl bg-slate-50 p-4">

                    <div
                      class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Tips
                    </div>

                    <ul class="mt-2 space-y-2">

                      @for (
                        tip of tool.tips;
                        track tip
                      ) {

                        <li
                          class="text-xs leading-5 text-slate-600"
                        >
                          {{ tip }}
                        </li>

                      }

                    </ul>

                  </div>

                }

                <!-- =================================================
                     TOOL FOOTER
                ================================================== -->
                <div
                  class="mt-auto pt-6"
                >

                  <div
                    class="border-t border-slate-100 pt-4"
                  >

                    <div
                      class="flex flex-wrap items-center justify-between gap-3"
                    >

                      <div>

                        <div
                          class="text-xs font-medium text-slate-500"
                        >
                          Pricing
                        </div>

                        <div
                          class="mt-1 text-xs font-semibold text-slate-700"
                        >
                          {{ tool.pricing ?? 'Not specified' }}
                        </div>

                      </div>

                      <div>

                        @if (tool.freeTier) {

                          <span
                            class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          >
                            Free Tier
                          </span>

                        } @else {

                          <span
                            class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          >
                            Paid
                          </span>

                        }

                      </div>

                    </div>

                    <!-- Website -->
                    <a
                      [href]="tool.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                    >
                      Visit Website

                      <span aria-hidden="true">
                        ↗
                      </span>
                    </a>

                  </div>

                </div>

              </article>

            }

          </div>

          <!-- Empty State -->
          @if (filteredTools.length === 0) {

            <div
              class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
            >

              <h3
                class="text-base font-semibold text-slate-900"
              >
                No tools found
              </h3>

              <p
                class="mt-2 text-sm text-slate-500"
              >
                No tools are currently registered in this category.
              </p>

            </div>

          }

        </section>

        <!-- =======================================================
             PRODUCTION WORKFLOW
        ======================================================== -->
        <section
          class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          <div
            class="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Production Workflow
          </div>

          <h2 class="mt-1 text-xl font-bold text-slate-900">
            How the Tools Fit Together
          </h2>

          <p
            class="mt-2 max-w-3xl text-sm leading-6 text-slate-600"
          >
            The tools should support the workflow rather than become the
            workflow.
          </p>

          <div
            class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >

            @for (
              step of workflow;
              track step.number
            ) {

              <div>

                <div
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
                >
                  {{ step.number }}
                </div>

                <h3
                  class="mt-3 text-sm font-bold text-slate-900"
                >
                  {{ step.title }}
                </h3>

                <p
                  class="mt-1 text-xs leading-5 text-slate-500"
                >
                  {{ step.description }}
                </p>

              </div>

            }

          </div>

        </section>

        <!-- =======================================================
             TOOL MANAGEMENT
        ======================================================== -->
        <section
          class="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8"
        >

          <div
            class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"
          >

            <div>

              <div
                class="text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Tool Management
              </div>

              <h2 class="mt-1 text-xl font-bold">
                Keep the toolkit current.
              </h2>

              <p
                class="mt-3 max-w-3xl text-sm leading-6 text-slate-300"
              >
                When a new tool is adopted, document its purpose, website,
                pricing model, workflow, and practical usage instructions.
                Remove tools that are no longer useful.
              </p>

            </div>

            <div
              class="rounded-xl border border-slate-700 bg-slate-800 px-5 py-4"
            >

              <div class="text-xs text-slate-400">
                Current Focus
              </div>

              <div class="mt-1 text-sm font-semibold">
                Build • Capture • Edit • Publish
              </div>

              <div class="mt-1 text-xs text-slate-400">
                Keep the production stack simple.
              </div>

            </div>

          </div>

        </section>

      </main>

      <!-- =========================================================
           FOOTER
      ========================================================== -->
      <footer class="border-t border-slate-200 bg-white">

        <div
          class="mx-auto max-w-7xl px-6 py-6 text-center text-xs text-slate-500"
        >
          Figure Out With J • Zebron Content & Operations
        </div>

      </footer>

    </div>
  `,
})
export class ContentToolsComponent {
  private readonly pageTitleService = inject(PageTitleService);

  // =========================================================
  // FILTER
  // =========================================================

  selectedCategory = 'all';

  // =========================================================
  // TOOL PRINCIPLES
  // =========================================================

  readonly toolPrinciples = [
    {
      title: 'Keep It Simple',
      description:
        'Prefer a small set of reliable tools instead of constantly switching between platforms.',
    },
    {
      title: 'Know the Workflow',
      description:
        'Every important tool should have a clear purpose and documented way of being used.',
    },
    {
      title: 'Review Regularly',
      description:
        'Remove tools that no longer provide enough value for the cost or complexity.',
    },
  ];

  // =========================================================
  // TOOL LIBRARY
  // =========================================================

  readonly tools: OperationTool[] = [
    // =======================================================
    // AI
    // =======================================================

    {
      id: 'chatgpt',
      name: 'ChatGPT',
      category: 'ai',
      description:
        'AI assistant used for research, planning, writing, troubleshooting, brainstorming, and development support.',
      purpose:
        'Development and content-production assistant.',
      website: 'https://chatgpt.com',
      pricing: 'Free and paid plans',
      freeTier: true,
      howWeUseIt: [
        'Research ideas and plan features.',
        'Troubleshoot development issues.',
        'Develop content concepts and YouTube outlines.',
      ],
      instructions: [
        'Provide real project context when troubleshooting.',
        'Use generated material as a starting point.',
        'Review all generated content before publishing.',
      ],
      tips: [
        'Use real Zebron development context rather than generic prompts.',
        'Use AI to accelerate work while keeping the final voice authentic.',
      ],
      active: true,
    },

    // =======================================================
    // PRODUCTION
    // =======================================================

    {
      id: 'obs-studio',
      name: 'OBS Studio',
      category: 'production',
      description:
        'Open-source recording and streaming software used to capture development footage, tutorials, and demonstrations.',
      purpose:
        'Capture meaningful Zebron development moments and tutorial footage.',
      website: 'https://obsproject.com',
      pricing: 'Free',
      freeTier: true,
      howWeUseIt: [
        'Record meaningful Zebron development moments.',
        'Capture screen demonstrations for Figure Out With J.',
        'Record technical walkthroughs and tutorials.',
      ],
      instructions: [
        'Record only meaningful development moments.',
        'Capture the application and relevant development context.',
        'Organize recordings in the appropriate external storage folder.',
      ],
      tips: [
        'Do not record every small development change.',
        'Start recording when a feature reaches a meaningful demonstration point.',
      ],
      active: true,
    },

    {
      id: 'davinci-resolve',
      name: 'DaVinci Resolve',
      category: 'production',
      description:
        'Video editing and post-production application for assembling long-form videos, Shorts, audio, and visual effects.',
      purpose:
        'Edit and produce Figure Out With J video content.',
      website:
        'https://www.blackmagicdesign.com/products/davinciresolve',
      pricing: 'Free and paid versions',
      freeTier: true,
      howWeUseIt: [
        'Edit Figure Out With J videos.',
        'Create Shorts from longer recordings.',
        'Assemble development footage into a coherent story.',
      ],
      instructions: [
        'Import recorded development footage.',
        'Remove unnecessary sections and organize the story.',
        'Add narration, graphics, captions, and supporting visuals.',
      ],
      tips: [
        'Keep the story focused on the problem, process, solution, and result.',
      ],
      active: true,
    },

    {
      id: 'audacity',
      name: 'Audacity',
      category: 'production',
      description:
        'Audio recording and editing software for voice recordings, narration, and audio cleanup.',
      purpose:
        'Record and prepare clean voice-over audio.',
      website: 'https://www.audacityteam.org',
      pricing: 'Free',
      freeTier: true,
      howWeUseIt: [
        'Record voice-over narration.',
        'Clean audio for video production.',
      ],
      instructions: [
        'Record clean voice-over audio.',
        'Remove unwanted noise and unnecessary silence.',
        'Export finished audio for video editing.',
      ],
      tips: [
        'Prioritize clear, natural narration over heavily processed audio.',
      ],
      active: true,
    },

    // =======================================================
    // DESIGN
    // =======================================================

    {
      id: 'canva',
      name: 'Canva',
      category: 'design',
      description:
        'Design platform used for thumbnails, graphics, social media assets, presentations, and supporting visuals.',
      purpose:
        'Create visual assets for Figure Out With J and Zebron.',
      website: 'https://www.canva.com',
      pricing: 'Free and paid plans',
      freeTier: true,
      howWeUseIt: [
        'Create YouTube thumbnails.',
        'Create social media graphics.',
        'Create diagrams and supporting visuals.',
      ],
      instructions: [
        'Create reusable visual templates.',
        'Maintain consistent Figure Out With J branding.',
        'Export assets in platform-appropriate dimensions.',
      ],
      tips: [
        'Keep thumbnails visually simple and easy to understand at small sizes.',
      ],
      active: true,
    },

    // =======================================================
    // STORAGE
    // =======================================================

    {
      id: 'google-drive',
      name: 'Google Drive',
      category: 'storage',
      description:
        'External storage location for large media files, screenshots, recordings, and production assets.',
      purpose:
        'Store large media and production assets outside the Zebron database.',
      website: 'https://drive.google.com',
      pricing: 'Free storage with paid upgrades',
      freeTier: true,
      howWeUseIt: [
        'Store Figure Out With J recordings.',
        'Store screenshots and development captures.',
        'Store audio and editing assets.',
      ],
      instructions: [
        'Organize media by project and development milestone.',
        'Keep large media outside Firestore.',
        'Store relevant folder links in Zebron metadata.',
      ],
      tips: [
        'Use a consistent folder structure so captured material can be found later.',
      ],
      active: true,
    },

    // =======================================================
    // PUBLISHING
    // =======================================================

    {
      id: 'youtube-studio',
      name: 'YouTube Studio',
      category: 'publishing',
      description:
        'YouTube management platform used to upload, schedule, analyze, and manage channel content.',
      purpose:
        'Publish and manage Figure Out With J YouTube content.',
      website: 'https://studio.youtube.com',
      pricing: 'Free',
      freeTier: true,
      howWeUseIt: [
        'Upload finished videos.',
        'Schedule publications.',
        'Monitor channel performance and analytics.',
      ],
      instructions: [
        'Upload the finished video.',
        'Add the title, description, thumbnail, chapters, and metadata.',
        'Review analytics after publication.',
      ],
      tips: [
        'Use analytics to learn what viewers respond to without compromising authenticity.',
      ],
      active: true,
    },

    // =======================================================
    // DEVELOPMENT
    // =======================================================

    {
      id: 'github',
      name: 'GitHub',
      category: 'development',
      description:
        'Source-control and collaboration platform used to maintain Zebron source code and development history.',
      purpose:
        'Maintain Zebron source code and meaningful development history.',
      website: 'https://github.com',
      pricing: 'Free and paid plans',
      freeTier: true,
      howWeUseIt: [
        'Maintain Zebron source code.',
        'Track meaningful development changes.',
        'Preserve the history of the platform build.',
      ],
      instructions: [
        'Commit completed development steps.',
        'Push meaningful changes regularly.',
        'Use commit history as supporting development evidence when appropriate.',
      ],
      tips: [
        'Keep commits meaningful enough that the development journey remains understandable.',
      ],
      active: true,
    },
  ];

  // =========================================================
  // PRODUCTION WORKFLOW
  // =========================================================

  readonly workflow = [
    {
      number: 1,
      title: 'Build',
      description:
        'Use development tools to build and solve the problem.',
    },
    {
      number: 2,
      title: 'Capture',
      description:
        'Use recording and screenshot tools to document meaningful moments.',
    },
    {
      number: 3,
      title: 'Edit',
      description:
        'Turn raw footage and assets into useful content.',
    },
    {
      number: 4,
      title: 'Design',
      description:
        'Create thumbnails, graphics, and supporting visual assets.',
    },
    {
      number: 5,
      title: 'Publish',
      description:
        'Publish finished content and review its performance.',
    },
  ];

  // =========================================================
  // GETTERS
  // =========================================================

  get activeTools(): number {
    return this.tools.filter(
      (tool) => tool.active,
    ).length;
  }

  get freeTools(): number {
    return this.tools.filter(
      (tool) => tool.freeTier,
    ).length;
  }

  get categories(): string[] {
    return [
      ...new Set(
        this.tools.map(
          (tool) => tool.category,
        ),
      ),
    ];
  }

  get filteredTools(): OperationTool[] {
    if (this.selectedCategory === 'all') {
      return this.tools;
    }

    return this.tools.filter(
      (tool) =>
        tool.category === this.selectedCategory,
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  categoryLabel(
    category: string,
  ): string {
    const labels: Record<string, string> = {
      ai: 'AI',
      production: 'Production',
      design: 'Design',
      development: 'Development',
      marketing: 'Marketing',
      storage: 'Storage',
      operations: 'Operations',
      publishing: 'Publishing',
      other: 'Other',
    };

    return labels[category] ?? category;
  }

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor() {
    this.pageTitleService.setTitle(
      'Content & Operations | Tools',
    );
  }
}
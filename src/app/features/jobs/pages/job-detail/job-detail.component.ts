import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import { CommonModule, DOCUMENT, Location, isPlatformBrowser } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Job, EmploymentType, WorkArrangement, jobExpiresAtMillis } from '../../../../core/models/job.model';

import { JobStore } from '../../stores/job.store';

import { SaveJobButtonComponent } from '../../components/save-job-button.component';

import { CourseService } from '../../../courses/course.service';

@Component({
  selector: 'app-job-detail',

  standalone: true,

  imports: [CommonModule, RouterLink, MatIconModule, SaveJobButtonComponent],

  template: `
    <!-- =========================================================
         PAGE
         ========================================================= -->
    <main
      class="min-h-screen overflow-x-clip
             bg-gray-50 mt-16"
    >
      <!-- =======================================================
           ACTION BAR (the universal header shows "Job board")
           ======================================================= -->
      <div class="sticky top-16 z-40 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white shadow-sm">
        <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <button
            type="button"
            (click)="back()"
            class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
            Job board
          </button>

          @if (job(); as barJob) {
            <span class="hidden min-w-0 flex-1 truncate border-l border-white/25 pl-3 text-sm font-semibold text-white md:block">
              {{ barJob.title }}
            </span>
            <div class="ml-auto flex shrink-0 items-center gap-1">
              <app-save-job-button [job]="barJob" [iconOnly]="true" [onDark]="true" />
              @if (barJob.applicationUrl) {
                <a
                  [href]="barJob.applicationUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold text-[#007979] shadow-sm hover:bg-gray-100"
                >
                  Apply
                  <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">open_in_new</mat-icon>
                  <span class="sr-only">(opens the employer's site)</span>
                </a>
              }
            </div>
          }
        </div>
      </div>

      <!-- =======================================================
           CONTENT
           ======================================================= -->
      <div
        class="mx-auto
               max-w-6xl
               px-4
               py-6
               sm:px-6
               sm:py-8
               lg:px-8"
      >
        <!-- =====================================================
             LOADING
             ===================================================== -->
        @if (loading()) {
          <section
            class="rounded-xl
                   border
                   border-gray-200
                   bg-white
                   px-6
                   py-16
                   text-center
                   shadow-sm"
          >
            <div
              class="mx-auto
                     h-10
                     w-10
                     animate-spin
                     rounded-full
                     border-2
                     border-gray-200
                     border-t-[#007979]"
            ></div>

            <p
              class="mt-4
                     text-sm
                     text-gray-500"
            >
              Loading job details...
            </p>
          </section>
        }

        <!-- =====================================================
             ERROR
             ===================================================== -->
        @else if (error()) {
          <section
            class="rounded-xl
                   border
                   border-red-200
                   bg-white
                   px-6
                   py-12
                   text-center
                   shadow-sm"
          >
            <div
              class="mx-auto
                     flex
                     h-12
                     w-12
                     items-center
                     justify-center
                     rounded-full
                     bg-red-50
                     text-xl"
            >
              !
            </div>

            <h2
              class="mt-4
                     text-lg
                     font-bold
                     text-[#032D42]"
            >
              Job unavailable
            </h2>

            <p
              class="mx-auto
                     mt-2
                     max-w-md
                     text-sm
                     leading-6
                     text-gray-500"
            >
              {{ error() }}
            </p>

            <a
              routerLink="/jobs"
              class="mt-6
                     inline-flex
                     items-center
                     rounded-lg
                     bg-[#007979]
                     px-5
                     py-2.5
                     text-sm
                     font-semibold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]"
            >
              ← Browse Jobs
            </a>
          </section>
        }

        <!-- =====================================================
             JOB
             ===================================================== -->
        @else if (job(); as currentJob) {
          <div
            class="grid
                   gap-6
                   lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <!-- =================================================
                 MAIN JOB CONTENT
                 ================================================= -->
            <article
              class="min-w-0
                     rounded-xl
                     border
                     border-gray-200
                     bg-white
                     shadow-sm"
            >
              <!-- =================================================
                   JOB HEADER
                   ================================================= -->
              <div
                class="border-b
                       border-gray-100
                       p-6
                       sm:p-8"
              >
                <!-- Featured -->
                @if (currentJob.featured) {
                  <span
                    class="inline-flex
                           items-center
                           rounded-full
                           bg-yellow-100
                           px-2.5
                           py-1
                           text-xs
                           font-semibold
                           text-yellow-700"
                  >
                    ⭐ Featured Opportunity
                  </span>
                }

                <!-- Title -->
                <h1
                  class="mt-3
                         text-2xl
                         font-bold
                         leading-tight
                         tracking-tight
                         text-[#032D42]
                         sm:text-3xl"
                >
                  {{ currentJob.title }}
                </h1>

                <!-- Organization -->
                <p
                  class="mt-2
                         text-base
                         font-medium
                         text-gray-600"
                >
                  {{ currentJob.organizationName }}
                </p>

                @if (currentJob.sourceName || currentJob.postedAt || currentJob.createdAt) {
                  <p class="mt-1 text-sm text-gray-500">
                    @if (currentJob.sourceName) {
                      Listed on {{ currentJob.sourceName }}
                    }
                    @if (currentJob.postedAt ?? currentJob.createdAt; as postedOn) {
                      @if (currentJob.sourceName) {
                        ·
                      }
                      Posted {{ formatDeadline(postedOn) }}
                    }
                  </p>
                }

                <!-- Quick information -->
                <div
                  class="mt-5
                         flex
                         flex-wrap
                         gap-2"
                >
                  <span
                    class="inline-flex
                           items-center
                           rounded-full
                           bg-[#007979]/10
                           px-3
                           py-1.5
                           text-xs
                           font-medium
                           text-[#007979]"
                  >
                    {{ formatEmploymentType(currentJob.employmentType) }}
                  </span>

                  <span
                    class="inline-flex
                           items-center
                           rounded-full
                           bg-gray-100
                           px-3
                           py-1.5
                           text-xs
                           font-medium
                           text-gray-700"
                  >
                    {{ formatWorkArrangement(currentJob.workArrangement) }}
                  </span>

                  @if (currentJob.categoryName) {
                    <span
                      class="inline-flex
                             items-center
                             rounded-full
                             bg-gray-100
                             px-3
                             py-1.5
                             text-xs
                             font-medium
                             text-gray-700"
                    >
                      {{ currentJob.categoryName }}
                    </span>
                  }

                  <span
                    class="inline-flex
                           items-center
                           rounded-full
                           bg-gray-100
                           px-3
                           py-1.5
                           text-xs
                           font-medium
                           text-gray-700"
                  >
                    📍
                    {{ formatLocation(currentJob) }}
                  </span>
                </div>
              </div>

              <!-- =================================================
                   JOB DESCRIPTION
                   ================================================= -->
              <div
                class="p-6
                       sm:p-8"
              >
                <section>
                  <h3
                    class="text-lg
                           font-bold
                           text-[#032D42]"
                  >
                    Job Description
                  </h3>

                  <div
                    class="mt-4
                           whitespace-pre-line
                           text-sm
                           leading-7
                           text-gray-700"
                  >
                    {{ currentJob.description }}
                  </div>
                </section>

                <!-- =================================================
                     SKILLS
                     ================================================= -->
                @if (currentJob.skills.length) {
                  <section
                    class="mt-8
                           border-t
                           border-gray-100
                           pt-8"
                  >
                    <h3
                      class="text-lg
                             font-bold
                             text-[#032D42]"
                    >
                      Skills
                    </h3>

                    <div
                      class="mt-4
                             flex
                             flex-wrap
                             gap-2"
                    >
                      @for (skill of currentJob.skills; track skill) {
                        <span
                          class="rounded-full
                                 border
                                 border-gray-200
                                 bg-gray-50
                                 px-3
                                 py-1.5
                                 text-sm
                                 text-gray-700"
                        >
                          {{ skill }}
                        </span>
                      }
                    </div>
                  </section>
                }

                <!-- =================================================
                     TAGS
                     ================================================= -->
                @if (currentJob.tags.length) {
                  <section
                    class="mt-8
                           border-t
                           border-gray-100
                           pt-8"
                  >
                    <h3
                      class="text-lg
                             font-bold
                             text-[#032D42]"
                    >
                      Tags
                    </h3>

                    <div
                      class="mt-4
                             flex
                             flex-wrap
                             gap-2"
                    >
                      @for (tag of currentJob.tags; track tag) {
                        <span
                          class="rounded-full
                                 bg-[#007979]/10
                                 px-3
                                 py-1.5
                                 text-sm
                                 text-[#007979]"
                        >
                          #{{ tag }}
                        </span>
                      }
                    </div>
                  </section>
                }

                <!-- =================================================
                     PREPARE FOR THIS JOB (Zebron courses sharing its skills)
                     ================================================= -->
                @if (preparation().length) {
                  <section class="mt-8 border-t border-gray-100 pt-8">
                    <h3 class="text-lg font-bold text-[#032D42]">Prepare for this job</h3>
                    <p class="mt-1 text-sm text-gray-500">Free Zebron courses that teach skills this job asks for.</p>
                    <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                      @for (course of preparation(); track course.id) {
                        <li>
                          <a
                            [routerLink]="['/courses', course.id]"
                            class="block h-full rounded-lg border border-gray-200 p-4 transition hover:border-[#007979] hover:shadow-sm"
                          >
                            <span class="block text-sm font-semibold text-[#032D42]">{{ course.title }}</span>
                            <span class="mt-1 block text-xs text-gray-500">{{ course.matched.join(', ') }}</span>
                          </a>
                        </li>
                      }
                    </ul>
                  </section>
                }

                <!-- =================================================
                     MOBILE APPLY
                     ================================================= -->
                <div
                  class="mt-8
                         border-t
                         border-gray-100
                         pt-8
                         lg:hidden"
                >
                  @if (currentJob.applicationUrl) {
                    <a
                      [href]="currentJob.applicationUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex
                             w-full
                             items-center
                             justify-center
                             rounded-lg
                             bg-[#007979]
                             px-5
                             py-3
                             text-sm
                             font-semibold
                             text-white
                             shadow-sm
                             transition
                             hover:bg-[#006666]"
                    >
                      Apply Now →
                    </a>
                  } @else {
                    <div
                      class="rounded-lg
                             bg-gray-50
                             p-4
                             text-center
                             text-sm
                             text-gray-500"
                    >
                      Application information is not currently available.
                    </div>
                  }
                  <div class="mt-3">
                    <app-save-job-button [job]="currentJob" [full]="true" />
                  </div>
                </div>
              </div>
            </article>

            <!-- =================================================
                 SIDEBAR
                 ================================================= -->
            <aside class="space-y-4">
              <!-- =================================================
                   APPLY CARD
                   ================================================= -->
              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <h3
                  class="text-base
                         font-bold
                         text-[#032D42]"
                >
                  Interested in this opportunity?
                </h3>

                <p
                  class="mt-2
                         text-sm
                         leading-6
                         text-gray-500"
                >
                  Review the requirements and submit your application through the employer.
                </p>

                @if (currentJob.applicationUrl) {
                  <a
                    [href]="currentJob.applicationUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-5
                           flex
                           w-full
                           items-center
                           justify-center
                           rounded-lg
                           bg-[#007979]
                           px-5
                           py-3
                           text-sm
                           font-semibold
                           text-white
                           shadow-sm
                           transition
                           hover:bg-[#006666]"
                  >
                    Apply Now →
                  </a>
                } @else {
                  <div
                    class="mt-5
                           rounded-lg
                           bg-gray-50
                           p-3
                           text-center
                           text-xs
                           text-gray-500"
                  >
                    No application link provided.
                  </div>
                }

                <div class="mt-3">
                  <app-save-job-button [job]="currentJob" [full]="true" />
                </div>

                <a routerLink="/jobs/my" class="mt-3 block text-center text-sm font-medium text-[#007979] hover:underline">
                  Saved jobs and alerts
                </a>
              </section>

              <!-- =================================================
                   JOB INFORMATION
                   ================================================= -->
              <section
                class="rounded-xl
                       border
                       border-gray-200
                       bg-white
                       p-5
                       shadow-sm"
              >
                <h3
                  class="text-base
                         font-bold
                         text-[#032D42]"
                >
                  Job Information
                </h3>

                <dl
                  class="mt-4
                         space-y-4"
                >
                  <!-- Organization -->
                  <div>
                    <dt
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-400"
                    >
                      Organization
                    </dt>

                    <dd
                      class="mt-1
                             text-sm
                             font-medium
                             text-gray-700"
                    >
                      {{ currentJob.organizationName }}
                    </dd>
                  </div>

                  <!-- Location -->
                  <div>
                    <dt
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-400"
                    >
                      Location
                    </dt>

                    <dd
                      class="mt-1
                             text-sm
                             text-gray-700"
                    >
                      {{ formatLocation(currentJob) }}
                    </dd>
                  </div>

                  <!-- Employment -->
                  <div>
                    <dt
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-400"
                    >
                      Employment
                    </dt>

                    <dd
                      class="mt-1
                             text-sm
                             text-gray-700"
                    >
                      {{ formatEmploymentType(currentJob.employmentType) }}
                    </dd>
                  </div>

                  <!-- Work arrangement -->
                  <div>
                    <dt
                      class="text-xs
                             font-semibold
                             uppercase
                             tracking-wide
                             text-gray-400"
                    >
                      Work Arrangement
                    </dt>

                    <dd
                      class="mt-1
                             text-sm
                             text-gray-700"
                    >
                      {{ formatWorkArrangement(currentJob.workArrangement) }}
                    </dd>
                  </div>

                  <!-- Category -->
                  @if (currentJob.categoryName) {
                    <div>
                      <dt
                        class="text-xs
                               font-semibold
                               uppercase
                               tracking-wide
                               text-gray-400"
                      >
                        Category
                      </dt>

                      <dd
                        class="mt-1
                               text-sm
                               text-gray-700"
                      >
                        {{ currentJob.categoryName }}
                      </dd>
                    </div>
                  }

                  <!-- Compensation -->
                  @if (hasCompensation(currentJob)) {
                    <div>
                      <dt
                        class="text-xs
                               font-semibold
                               uppercase
                               tracking-wide
                               text-gray-400"
                      >
                        Compensation
                      </dt>

                      <dd
                        class="mt-1
                               text-sm
                               font-medium
                               text-gray-700"
                      >
                        {{ formatCompensation(currentJob) }}
                      </dd>
                    </div>
                  }

                  <!-- Application deadline -->
                  @if (currentJob.applicationDeadline) {
                    <div>
                      <dt
                        class="text-xs
                               font-semibold
                               uppercase
                               tracking-wide
                               text-gray-400"
                      >
                        Application Deadline
                      </dt>

                      <dd
                        class="mt-1
                               text-sm
                               text-gray-700"
                      >
                        {{ formatDeadline(currentJob.applicationDeadline) }}
                      </dd>
                    </div>
                  }
                </dl>
              </section>

              <!-- =================================================
                   BACK TO JOBS
                   ================================================= -->
              <a
                routerLink="/jobs"
                class="flex
                       items-center
                       justify-center
                       rounded-lg
                       border
                       border-gray-300
                       bg-white
                       px-4
                       py-2.5
                       text-sm
                       font-semibold
                       text-gray-700
                       transition
                       hover:border-[#007979]
                       hover:text-[#007979]"
              >
                ← Browse All Jobs
              </a>
            </aside>
          </div>
        }
      </div>
    </main>
  `,
})
export class JobDetailComponent implements OnInit {
  // =========================================================
  // Services
  // =========================================================

  private readonly jobStore = inject(JobStore);

  private readonly title = inject(Title);

  private readonly meta = inject(Meta);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly location = inject(Location);

  private readonly document = inject(DOCUMENT);

  private readonly destroyRef = inject(DestroyRef);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // =========================================================
  // State
  // =========================================================

  protected readonly job = this.jobStore.selectedJob;

  protected readonly loading = this.jobStore.loading;

  protected readonly error = this.jobStore.error;

  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.removeStructuredData());
    void this.loadJob();
  }

  /**
   * Back to the job board. When the visitor came from the board, go back in
   * history so their search and scroll position are kept; otherwise (a link
   * from an email or another site) open the board.
   */
  protected back(): void {
    // Angular numbers its navigations in the history state: above 1 means
    // this page was opened from another page of the app.
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/jobs']);
  }

  // =========================================================
  // Load Job
  // =========================================================

  //  =========================================================

  private async loadJob(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    // jobResolver has usually loaded it already (always on the server).
    if (this.jobStore.selectedJob()?.id !== id) {
      await this.jobStore.loadPublicJob(id);
    }

    const job = this.jobStore.selectedJob();

    if (job) {
      this.updateSeoMetadata(job);
      this.setStructuredData(job);
      this.setRobots('index, follow');
      // Course suggestions are for people, not search engines: browser only.
      if (this.isBrowser) {
        void this.loadPreparation(job);
      }
    } else {
      // Closed, expired or missing: keep it out of search results.
      this.removeStructuredData();
      this.setRobots('noindex');
    }
  }

  // =========================================================
  // Google job listings (schema.org JobPosting)
  // =========================================================

  private static readonly STRUCTURED_DATA_ID = 'zebron-job-posting';

  /**
   * Adds the job as schema.org JobPosting data, which Google uses to show
   * it in Google job search. Rendered on the server (app.routes.server.ts),
   * so the data is in the HTML Google fetches.
   * https://developers.google.com/search/docs/appearance/structured-data/job-posting
   */
  private setStructuredData(job: Job): void {
    this.removeStructuredData();

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JobDetailComponent.STRUCTURED_DATA_ID;
    // "</" would end the script element early: escape it.
    script.textContent = JSON.stringify(this.jobPosting(job)).replace(/<\//g, '<\\/');
    this.document.head.appendChild(script);

    this.setCanonical(`https://zebron.org/jobs/${encodeURIComponent(job.id ?? '')}`);
  }

  private removeStructuredData(): void {
    this.document.getElementById(JobDetailComponent.STRUCTURED_DATA_ID)?.remove();
  }

  private setRobots(content: string): void {
    this.meta.updateTag({ name: 'robots', content });
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private jobPosting(job: Job): Record<string, unknown> {
    const toDate = (value: { toDate?: () => Date } | null | undefined): Date | null =>
      value && typeof value.toDate === 'function' ? value.toDate() : null;

    const posted = toDate(job.postedAt) ?? toDate(job.createdAt) ?? new Date();
    const expires = toDate(job.expiresAt) ?? (() => {
      const millis = jobExpiresAtMillis(job);
      return millis === null ? null : new Date(millis);
    })();

    const employmentTypes: Record<EmploymentType, string> = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      contract: 'CONTRACTOR',
      internship: 'INTERN',
      temporary: 'TEMPORARY',
    };

    const location: NonNullable<Job['location']> = job.location ?? {};
    const country = this.countryCode(location.country);
    const hasPlace = !!(location.city?.trim() || location.state?.trim());

    const posting: Record<string, unknown> = {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.title,
      description: this.descriptionHtml(job),
      datePosted: posted.toISOString().slice(0, 10),
      employmentType: employmentTypes[job.employmentType] ?? 'OTHER',
      hiringOrganization: {
        '@type': 'Organization',
        name: job.organizationName,
      },
      url: `https://zebron.org/jobs/${encodeURIComponent(job.id ?? '')}`,
      directApply: false,
    };

    if (expires) {
      posting['validThrough'] = expires.toISOString();
    }

    if (hasPlace || job.workArrangement !== 'remote') {
      posting['jobLocation'] = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          ...(location.city?.trim() ? { addressLocality: location.city.trim() } : {}),
          ...(location.state?.trim() ? { addressRegion: location.state.trim() } : {}),
          addressCountry: country,
        },
      };
    }

    if (job.workArrangement === 'remote') {
      posting['jobLocationType'] = 'TELECOMMUTE';
      posting['applicantLocationRequirements'] = { '@type': 'Country', name: country };
    }

    const pay = job.compensation;
    if (pay && (pay.min != null || pay.max != null)) {
      posting['baseSalary'] = {
        '@type': 'MonetaryAmount',
        currency: pay.currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
          ...(pay.min != null && pay.max != null && pay.min !== pay.max
            ? { minValue: pay.min, maxValue: pay.max }
            : { value: pay.min ?? pay.max }),
          unitText: pay.period === 'hour' ? 'HOUR' : 'YEAR',
        },
      };
    }

    if (job.skills?.length) {
      posting['skills'] = job.skills.join(', ');
    }

    return posting;
  }

  /** The description as simple HTML (Google requires HTML), with the text escaped. */
  private descriptionHtml(job: Job): string {
    const escape = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return (job.description ?? '')
      .trim()
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  /** Two-letter country code; listings are in the United States unless they say otherwise. */
  private countryCode(country: string | undefined): string {
    const value = (country ?? '').trim();
    if (!value || /^(us|usa|united states( of america)?)$/i.test(value)) {
      return 'US';
    }
    return value.length === 2 ? value.toUpperCase() : value;
  }

  // =========================================================
  // Prepare for this job
  // =========================================================

  /** Up to 4 published Zebron courses whose skills match the job's skills. */
  protected readonly preparation = signal<{ id: string; title: string; matched: string[] }[]>([]);

  private readonly courses = inject(CourseService);

  private async loadPreparation(job: Job): Promise<void> {
    const wanted = new Map((job.skills ?? []).map((skill) => [skill.trim().toLowerCase(), skill.trim()]));
    if (!wanted.size) {
      return;
    }

    try {
      const catalog = await this.courses.listPublished(null);
      const matches = catalog
        .map((course) => ({
          id: course.id,
          title: course.title,
          matched: (course.skills ?? []).filter((skill) => wanted.has(skill.trim().toLowerCase())),
        }))
        .filter((course) => course.matched.length > 0)
        .sort((a, b) => b.matched.length - a.matched.length || a.title.localeCompare(b.title))
        .slice(0, 4);
      this.preparation.set(matches);
    } catch {
      // Course suggestions are a bonus: the job page works without them.
      this.preparation.set([]);
    }
  }

  // =========================================================
  // Employment Type
  // =========================================================

  protected formatEmploymentType(value: EmploymentType): string {
    const labels: Record<EmploymentType, string> = {
      'full-time': 'Full-time',

      'part-time': 'Part-time',

      contract: 'Contract',

      internship: 'Internship',

      temporary: 'Temporary',
    };

    return labels[value] ?? value;
  }

  // =========================================================
  // Work Arrangement
  // =========================================================

  protected formatWorkArrangement(value: WorkArrangement): string {
    const labels: Record<WorkArrangement, string> = {
      'on-site': 'On-site',

      hybrid: 'Hybrid',

      remote: 'Remote',
    };

    return labels[value] ?? value;
  }

  // =========================================================
  // Location
  // =========================================================

  protected formatLocation(job: Job): string {
    const city = job.location?.city?.trim();

    const state = job.location?.state?.trim();

    const country = job.location?.country?.trim();

    const parts = [city, state, country].filter(Boolean);

    if (parts.length) {
      return parts.join(', ');
    }

    if (job.workArrangement === 'remote') {
      return 'Remote';
    }

    return 'Location not specified';
  }

  // =========================================================
  // Compensation Check
  // =========================================================

  protected hasCompensation(job: Job): boolean {
    return Boolean(job.compensation?.min !== undefined || job.compensation?.max !== undefined);
  }

  // =========================================================
  // Compensation Formatting
  // =========================================================

  protected formatCompensation(job: Job): string {
    const compensation = job.compensation;

    if (!compensation) {
      return '';
    }

    const currency = compensation.currency ?? 'USD';

    const period = compensation.period === 'hour' ? '/hour' : '/year';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });

    const min = compensation.min;

    const max = compensation.max;

    if (min !== undefined && max !== undefined) {
      return `${formatter.format(min)} – ${formatter.format(max)}${period}`;
    }

    if (min !== undefined) {
      return `${formatter.format(min)}+${period}`;
    }

    if (max !== undefined) {
      return `Up to ${formatter.format(max)}${period}`;
    }

    return '';
  }

  // =========================================================
  // Deadline Formatting
  // =========================================================

  protected formatDeadline(deadline: NonNullable<Job['applicationDeadline']>): string {
    /*
     * Firestore Timestamp provides
     * toDate(). This also keeps the
     * component compatible with the
     * existing Job model.
     */

    if (typeof deadline.toDate !== 'function') {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(deadline.toDate());
  }

  /**
   * Update document metadata for the public job page.
   */
  private updateSeoMetadata(job: Job): void {
    const title = job.title?.trim() || 'Job Opportunity';

    const organization = job.organizationName?.trim();

    const pageTitle = organization ? `${title} at ${organization} | Zebron` : `${title} | Zebron`;

    const description = job.description?.trim() || `View this job opportunity on Zebron.`;

    const id = job.id;

    const canonicalUrl = `https://zebron.org/jobs/${id}`;

    this.title.setTitle(pageTitle);

    this.meta.updateTag({
      name: 'description',
      content: description.substring(0, 160),
    });

    this.meta.updateTag({
      property: 'og:title',
      content: pageTitle,
    });

    this.meta.updateTag({
      property: 'og:description',
      content: description.substring(0, 160),
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'website',
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl,
    });

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary',
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: pageTitle,
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: description.substring(0, 160),
    });
  }
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfigurationSystemHealthComponent } from '../system-health/configuration-system-health.component';
import { ConfigurationAuditComponent } from '../audit/configuration-audit.component';

import { OperationalMonitoringStore } from '../../stores/operational-monitoring.store';

import {
  OperationalEvent,
  OperationalEventSeverity,
} from '../../../../../../core/models/operational-event.model';

import { AuthService } from '../../../.././../../core/services/auth.service';
import { ConfigurationApplicationReadinessComponent } from '../../components/application-readiness/configuration-application-readiness.component';

import {
  KnowledgeArticle,
  KnowledgeContentType,
} from '../../../../../../core/models/knowledge-article.model';

import { KnowledgeArticleService } from '../../../../../../core/services/knowledge-article.service';

import { KNOWLEDGE_CONFIGURATION } from '../../../../../../core/config/knowledge.config';
import { Router } from '@angular/router';
import { LoggerService } from '../../../../../../core/services/logger.service';


@Component({
  selector: 'app-configuration-operational-monitoring',
  standalone: true,

  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,

    ConfigurationApplicationReadinessComponent,
    ConfigurationSystemHealthComponent,
    ConfigurationAuditComponent,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <div class="space-y-6">
      <!-- =========================================================
           MONITORING HEADER
           ========================================================= -->

      <div
        class="rounded-2xl
               border border-slate-200
               bg-white
               p-6
               shadow-sm"
      >
        <div
          class="flex flex-col
                 gap-4
                 lg:flex-row
                 lg:items-center
                 lg:justify-between"
        >
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12
                     shrink-0
                     items-center justify-center
                     rounded-xl
                     bg-[#2a835f]/10"
            >
              <mat-icon class="!text-[#2a835f]"> monitor_heart </mat-icon>
            </div>

            <div>
              <h2
                class="text-xl font-semibold
                       text-slate-900"
              >
                Operational Monitoring
              </h2>

              <p
                class="mt-1 max-w-3xl
                       text-sm leading-6
                       text-slate-500"
              >
                Monitor system health, operational events, application errors, user reports, and
                administrative activity.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (hasActiveIssues()) {
              <span
                class="inline-flex
                       items-center gap-2
                       rounded-full
                       bg-amber-50
                       px-3 py-1.5
                       text-xs font-semibold
                       text-amber-700"
              >
                <span
                  class="h-2 w-2
                         rounded-full
                         bg-amber-500"
                ></span>

                Attention Required
              </span>
            } @else {
              <span
                class="inline-flex
                       items-center gap-2
                       rounded-full
                       bg-green-50
                       px-3 py-1.5
                       text-xs font-semibold
                       text-green-700"
              >
                <span
                  class="h-2 w-2
                         rounded-full
                         bg-green-500"
                ></span>

                Operational
              </span>
            }
          </div>
        </div>
      </div>

      <div class="mb-8">
        <app-configuration-application-readiness />
      </div>

      <!-- =========================================================
           SUMMARY
           ========================================================= -->

      <div
        class="grid grid-cols-1
               gap-4
               md:grid-cols-2
               xl:grid-cols-4"
      >
        <!-- System Health -->

        <div
          class="rounded-xl
                 border border-slate-200
                 bg-white
                 p-5
                 shadow-sm"
        >
          <div
            class="flex items-center
                   justify-between"
          >
            <div>
              <p
                class="text-sm
                       text-slate-500"
              >
                System Health
              </p>

              <p
                class="mt-1 text-lg
                       font-semibold
                       text-slate-900"
              >
                Active
              </p>
            </div>

            <mat-icon class="!text-green-600"> health_and_safety </mat-icon>
          </div>
        </div>

        <!-- Active Events -->

        <div
          class="rounded-xl
                 border border-slate-200
                 bg-white
                 p-5
                 shadow-sm"
        >
          <div
            class="flex items-center
                   justify-between"
          >
            <div>
              <p
                class="text-sm
                       text-slate-500"
              >
                Active Events
              </p>

              <p
                class="mt-1 text-2xl
                       font-semibold
                       text-slate-900"
              >
                {{ activeEvents().length }}
              </p>
            </div>

            <mat-icon [class]="hasActiveIssues() ? '!text-amber-500' : '!text-green-600'">
              notifications_active
            </mat-icon>
          </div>
        </div>

        <!-- Errors -->

        <div
          class="rounded-xl
                 border border-slate-200
                 bg-white
                 p-5
                 shadow-sm"
        >
          <div
            class="flex items-center
                   justify-between"
          >
            <div>
              <p
                class="text-sm
                       text-slate-500"
              >
                Errors
              </p>

              <p
                class="mt-1 text-2xl
                       font-semibold
                       text-slate-900"
              >
                {{ errorEvents().length }}
              </p>
            </div>

            <mat-icon class="!text-red-500"> error_outline </mat-icon>
          </div>
        </div>

        <!-- User Reports -->

        <div
          class="rounded-xl
                 border border-slate-200
                 bg-white
                 p-5
                 shadow-sm"
        >
          <div
            class="flex items-center
                   justify-between"
          >
            <div>
              <p
                class="text-sm
                       text-slate-500"
              >
                User Reports
              </p>

              <p
                class="mt-1 text-2xl
                       font-semibold
                       text-slate-900"
              >
                {{ userReports().length }}
              </p>
            </div>

            <mat-icon class="!text-blue-500"> report_problem </mat-icon>
          </div>
        </div>
      </div>

      <!-- =========================================================
           SYSTEM HEALTH
           ========================================================= -->

      <app-configuration-system-health />

      <!-- =========================================================
           OPERATIONAL EVENTS
           ========================================================= -->

      <section
        class="rounded-2xl
               border border-slate-200
               bg-white
               shadow-sm"
      >
        <div
          class="flex flex-col
                 gap-4
                 border-b border-slate-200
                 px-6 py-5
                 md:flex-row
                 md:items-center
                 md:justify-between"
        >
          <div>
            <h3
              class="text-lg font-semibold
                     text-slate-900"
            >
              Operational Events
            </h3>

            <p
              class="mt-1 text-sm
                     text-slate-500"
            >
              Review and manage application, infrastructure, background-job, security, and
              user-reported events.
            </p>
          </div>

          <button mat-stroked-button type="button" [disabled]="store.loading()" (click)="refresh()">
            <mat-icon> refresh </mat-icon>

            <span class="ml-2"> Refresh </span>
          </button>
        </div>

        <!-- Loading -->

        @if (store.loading()) {
          <div
            class="flex items-center
                   justify-center
                   gap-3
                   p-10"
          >
            <mat-spinner diameter="28" />

            <span
              class="text-sm
                     text-slate-500"
            >
              Loading operational events...
            </span>
          </div>
        }

        <!-- Error -->

        @else if (store.error()) {
          <div class="p-6">
            <div
              class="rounded-xl
                     border border-red-200
                     bg-red-50
                     p-5"
            >
              <div class="flex items-start gap-3">
                <mat-icon class="!text-red-600"> error_outline </mat-icon>

                <div>
                  <p
                    class="font-semibold
                           text-red-800"
                  >
                    Unable to load operational events
                  </p>

                  <p
                    class="mt-1 text-sm
                           text-red-700"
                  >
                    {{ store.error() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Empty -->

        @else if (store.events().length === 0) {
          <div
            class="flex flex-col
                   items-center
                   justify-center
                   p-12 text-center"
          >
            <mat-icon
              class="!h-12 !w-12
                     !text-5xl
                     !text-green-500"
            >
              check_circle
            </mat-icon>

            <h4
              class="mt-4
                     font-semibold
                     text-slate-900"
            >
              No operational events
            </h4>

            <p
              class="mt-1 max-w-md
                     text-sm leading-6
                     text-slate-500"
            >
              There are currently no operational events requiring attention.
            </p>
          </div>
        }

        <!-- Events -->

        @else {
          <div class="divide-y divide-slate-100">
            @for (event of store.events(); track event.id) {
              <article
                class="p-6 transition
                       hover:bg-slate-50"
              >
                <div
                  class="flex flex-col
                         gap-5
                         xl:flex-row
                         xl:items-start
                         xl:justify-between"
                >
                  <!-- Event information -->

                  <div class="min-w-0 flex-1">
                    <div
                      class="flex flex-wrap
                             items-center gap-2"
                    >
                      <span
                        class="inline-flex
                               items-center
                               rounded-full
                               px-2.5 py-1
                               text-xs font-semibold"
                        [class]="severityClass(event.severity)"
                      >
                        <mat-icon
                          class="mr-1 !h-4 !w-4
                                 !text-[16px]"
                        >
                          {{ severityIcon(event.severity) }}
                        </mat-icon>

                        {{ event.severity }}
                      </span>

                      <span
                        class="rounded-full
                               bg-slate-100
                               px-2.5 py-1
                               text-xs font-medium
                               text-slate-600"
                      >
                        {{ event.type }}
                      </span>

                      <span
                        class="rounded-full
                               bg-slate-100
                               px-2.5 py-1
                               text-xs font-medium
                               text-slate-600"
                      >
                        {{ event.status }}
                      </span>
                    </div>

                    <h4
                      class="mt-3
                             text-base font-semibold
                             text-slate-900"
                    >
                      {{ event.title }}
                    </h4>

                    @if (event.description) {
                      <p
                        class="mt-2 max-w-4xl
                               text-sm leading-6
                               text-slate-600"
                      >
                        {{ event.description }}
                      </p>
                    }

                    <div
                      class="mt-4 flex flex-wrap
                             gap-x-5 gap-y-2
                             text-xs
                             text-slate-500"
                    >
                      @if (event.feature) {
                        <span>
                          <strong>Feature:</strong>
                          {{ event.feature }}
                        </span>
                      }

                      @if (event.service) {
                        <span>
                          <strong>Service:</strong>
                          {{ event.service }}
                        </span>
                      }

                      @if (event.source) {
                        <span>
                          <strong>Source:</strong>
                          {{ event.source }}
                        </span>
                      }

                      <span>
                        <strong>Created:</strong>
                        {{ formatDate(event.createdAt) }}
                      </span>

                      @if ((event.occurrenceCount ?? 1) > 1) {
                        <span>
                          <strong>Occurrences:</strong>
                          {{ event.occurrenceCount ?? 1 }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- =================================================
                       EVENT ACTIONS
                       ================================================= -->

                  @if (isAdmin()) {
                    <div
                      class="flex shrink-0
           flex-wrap
           gap-2"
                    >
                      @if (event.status === 'open') {
                        <button
                          mat-stroked-button
                          type="button"
                          matTooltip="Acknowledge this event"
                          (click)="acknowledge(event)"
                        >
                          <mat-icon> done </mat-icon>

                          Acknowledge
                        </button>
                      }

                      @if (event.status === 'open' || event.status === 'acknowledged') {
                        <button
                          mat-stroked-button
                          type="button"
                          matTooltip="Mark this event as under investigation"
                          (click)="investigate(event)"
                        >
                          <mat-icon> search </mat-icon>

                          Investigate
                        </button>
                      }

                      @if (
                        event.status === 'open' ||
                        event.status === 'acknowledged' ||
                        event.status === 'investigating'
                      ) {
                        <button
                          mat-flat-button
                          type="button"
                          matTooltip="Resolve this event"
                          (click)="resolve(event)"
                        >
                          <mat-icon> check_circle </mat-icon>

                          Resolve
                        </button>
                      }

                      @if (event.status === 'resolved') {
                        <button
                          mat-stroked-button
                          type="button"
                          matTooltip="Close this event"
                          (click)="close(event)"
                        >
                          <mat-icon> archive </mat-icon>

                          Close
                        </button>
                      }
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>

      <!-- =========================================================
     KNOWLEDGE / TROUBLESHOOTING
     ========================================================= -->

<section
  class="rounded-2xl
         border border-slate-200
         bg-white
         shadow-sm"
>
  <div
    class="flex flex-col
           gap-4
           border-b border-slate-200
           px-6 py-5
           md:flex-row
           md:items-center
           md:justify-between"
  >
    <div class="flex items-start gap-3">
      <mat-icon class="!text-[#2a835f]">
        menu_book
      </mat-icon>

      <div>
        <h3
          class="text-lg font-semibold
                 text-slate-900"
        >
          Troubleshooting & Runbooks
        </h3>

        <p
          class="mt-1 max-w-3xl
                 text-sm leading-6
                 text-slate-500"
        >
          Access published troubleshooting guides, how-to articles,
          references, and runbooks for the selected application.
        </p>
      </div>
    </div>

  <button
  mat-stroked-button
  type="button"
  (click)="openKnowledgeCenter()"
>
  <mat-icon>menu_book</mat-icon>
  Open Knowledge Center
</button>
  </div>

  <div class="p-6">

    <!-- Application selector -->
    <div
      class="mb-5 flex flex-col gap-2
             sm:flex-row sm:items-center
             sm:justify-between"
    >
      <div>
        <label
          for="monitoring-knowledge-application"
          class="text-sm font-medium
                 text-slate-700"
        >
          Application
        </label>

        <p
          class="mt-1 text-xs
                 text-slate-400"
        >
          Documentation is scoped to the selected application.
        </p>
      </div>

      <select
        id="monitoring-knowledge-application"
        class="h-10 min-w-0
               rounded-lg
               border border-slate-200
               bg-white
               px-3
               text-sm text-slate-700
               outline-none
               focus:border-[#2a835f]
               focus:ring-2
               focus:ring-[#2a835f]/15
               sm:w-72"
        [value]="knowledgeApplicationKey()"
        (change)="onKnowledgeApplicationChange($event)"
      >
        @for (
          application of knowledgeApplications;
          track application.key
        ) {
          <option
            [value]="application.key"
          >
            {{ application.name }}
          </option>
        }
      </select>
    </div>

    <!-- Loading -->
    @if (knowledgeLoading()) {
      <div
        class="flex min-h-32
               items-center
               justify-center
               gap-3"
      >
        <mat-spinner
          diameter="28"
        />

        <span
          class="text-sm
                 text-slate-500"
        >
          Loading troubleshooting documentation...
        </span>
      </div>
    }

    <!-- Error -->
    @else if (knowledgeError()) {
      <div
        class="rounded-xl
               border border-red-200
               bg-red-50
               p-5"
      >
        <div class="flex items-start gap-3">

          <mat-icon
            class="shrink-0
                   !text-red-600"
          >
            error_outline
          </mat-icon>

          <div>
            <p
              class="font-semibold
                     text-red-800"
            >
              Unable to load documentation
            </p>

            <p
              class="mt-1 text-sm
                     text-red-700"
            >
              {{ knowledgeError() }}
            </p>

            <button
              mat-stroked-button
              type="button"
              class="mt-3"
              (click)="loadKnowledgeArticles()"
            >
              <mat-icon>
                refresh
              </mat-icon>

              <span class="ml-2">
                Try Again
              </span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Empty -->
    @else if (
      knowledgeArticles().length === 0
    ) {
      <div
        class="rounded-xl
               border border-dashed
               border-slate-200
               bg-slate-50
               p-8
               text-center"
      >
        <mat-icon
          class="!h-10
                 !w-10
                 !text-4xl
                 !text-slate-400"
        >
          menu_book
        </mat-icon>

        <h4
          class="mt-3
                 font-semibold
                 text-slate-800"
        >
          No troubleshooting documentation
        </h4>

        <p
          class="mx-auto mt-1
                 max-w-lg
                 text-sm leading-6
                 text-slate-500"
        >
          No published troubleshooting, guide, how-to,
          reference, or FAQ articles are currently available
          for this application.
        </p>

       <button
  mat-stroked-button
  type="button"
  (click)="openKnowledgeCenter()"
>
  <mat-icon>menu_book</mat-icon>
  Open Knowledge Center
</button>
      </div>
    }

    <!-- Articles -->
    @else {
      <div
        class="grid grid-cols-1
               gap-3
               lg:grid-cols-2"
      >
        @for (
          article of knowledgeArticles();
          track article.id
        ) {
          <button
            type="button"
            class="group
                   min-w-0
                   rounded-xl
                   border border-slate-200
                   bg-white
                   p-4
                   text-left
                   transition
                   hover:border-[#2a835f]/40
                   hover:bg-emerald-50/30
                   hover:shadow-sm"
            (click)="openKnowledgeArticle(article)"
          >
            <div
              class="flex items-start
                     justify-between
                     gap-3"
            >
              <div class="min-w-0">

                <div
                  class="flex flex-wrap
                         items-center gap-2"
                >
                  <span
                    class="rounded-full
                           bg-emerald-50
                           px-2.5 py-1
                           text-xs font-semibold
                           text-[#246f51]"
                  >
                    {{ contentTypeLabel(article.contentType) }}
                  </span>

                  <span
                    class="text-xs
                           text-slate-400"
                  >
                    v{{ article.version }}
                  </span>
                </div>

                <h4
                  class="mt-2
                         break-words
                         font-semibold
                         text-slate-900
                         group-hover:text-[#246f51]"
                >
                  {{ article.title }}
                </h4>

                @if (article.summary) {
                  <p
                    class="mt-1
                           line-clamp-2
                           text-sm leading-5
                           text-slate-500"
                  >
                    {{ article.summary }}
                  </p>
                }

                <p
                  class="mt-3
                         text-xs
                         text-slate-400"
                >
                  Updated
                  {{ formatDate(article.updatedAt) }}
                </p>

              </div>

              <mat-icon
                class="shrink-0
                       text-slate-300
                       transition
                       group-hover:text-[#2a835f]"
              >
                arrow_forward
              </mat-icon>
            </div>
          </button>
        }
      </div>
    }

  </div>
</section>

      <!-- =========================================================
           AUDIT
           ========================================================= -->

      <app-configuration-audit />

      <!-- =========================================================
           DIAGNOSTICS / TELEMETRY
           ========================================================= -->

      <section
        class="rounded-2xl
               border border-slate-200
               bg-white
               p-6
               shadow-sm"
      >
        <div class="flex items-start gap-3">
          <mat-icon class="!text-[#2a835f]"> analytics </mat-icon>

          <div>
            <h3
              class="font-semibold
                     text-slate-900"
            >
              Diagnostics & Telemetry
            </h3>

            <p
              class="mt-1 text-sm
                     leading-6
                     text-slate-500"
            >
              Operational telemetry is collected through the application monitoring pipeline and can
              be extended with additional infrastructure providers without coupling the application
              domain to Firebase.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class ConfigurationOperationalMonitoringComponent implements OnInit {
  protected readonly store = inject(OperationalMonitoringStore);

  private readonly authService = inject(AuthService);

  private readonly knowledgeService =
  inject(KnowledgeArticleService);

private readonly router =
  inject(Router);

  private readonly logger =
  inject(LoggerService);

protected readonly knowledgeApplications =
  KNOWLEDGE_CONFIGURATION.applications;

protected readonly knowledgeArticles =
  signal<KnowledgeArticle[]>([]);

protected readonly knowledgeApplicationKey =
  signal(
    KNOWLEDGE_CONFIGURATION.applications[0]?.key ?? '',
  );

protected readonly knowledgeLoading =
  signal(false);

protected readonly knowledgeError =
  signal<string | null>(null);


  protected openKnowledgeCenter(): void {
  void this.router.navigate(['/admin/configuration/knowledge']);
}


  protected readonly events = computed(() => this.store.events());

  protected readonly activeEvents = computed(() =>
    this.events().filter((event) => event.status !== 'resolved' && event.status !== 'closed'),
  );

  protected readonly errorEvents = computed(() =>
    this.events().filter((event) => event.severity === 'error' || event.severity === 'critical'),
  );

  protected readonly userReports = computed(() =>
    this.events().filter((event) => event.type === 'user-report'),
  );

  protected readonly hasActiveIssues = computed(() => this.activeEvents().length > 0);

  protected readonly isAdmin = computed(() => this.authService.isAdmin);

  ngOnInit(): void {
    this.store.load();

    void this.loadKnowledgeArticles();
  }

  protected refresh(): void {
    this.store.refresh();
  }


  protected async acknowledge(event: OperationalEvent): Promise<void> {
    const userId = this.currentUserId();

    if (!userId) {
      return;
    }

    await this.store.acknowledge(event.id, userId);
  }

  protected async investigate(event: OperationalEvent): Promise<void> {
    await this.store.investigate(event.id);
  }

  protected async resolve(event: OperationalEvent): Promise<void> {
    const userId = this.currentUserId();

    if (!userId) {
      return;
    }

    await this.store.resolve(event.id, userId);
  }

  protected async close(event: OperationalEvent): Promise<void> {
    await this.store.close(event.id);
  }

  protected severityIcon(severity: OperationalEventSeverity): string {
    switch (severity) {
      case 'critical':
        return 'error';

      case 'error':
        return 'error_outline';

      case 'warning':
        return 'warning';

      default:
        return 'info';
    }
  }

  protected severityClass(severity: OperationalEventSeverity): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';

      case 'error':
        return 'bg-red-50 text-red-700';

      case 'warning':
        return 'bg-amber-50 text-amber-700';

      default:
        return 'bg-blue-50 text-blue-700';
    }
  }

  protected async loadKnowledgeArticles(): Promise<void> {
  const applicationKey =
    this.knowledgeApplicationKey();

  if (!applicationKey || this.knowledgeLoading()) {
    return;
  }

  this.knowledgeLoading.set(true);
  this.knowledgeError.set(null);

  try {
    const articles =
      await this.knowledgeService.list({
        applicationKey,
        status: 'published',
      });

    const supportedTypes: KnowledgeContentType[] = [
      'troubleshooting',
      'how-to',
      'guide',
      'reference',
      'faq',
    ];

    const filteredArticles = articles
      .filter((article) =>
        supportedTypes.includes(article.contentType),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      )
      .slice(0, 6);

    this.knowledgeArticles.set(
      filteredArticles,
    );
  } catch (error) {
    this.logger.error(
      'ConfigurationOperationalMonitoringComponent',
      `Failed to load knowledge articles for application: ${applicationKey}`,
      error,
    );

    this.knowledgeArticles.set([]);

    this.knowledgeError.set(
      'Troubleshooting documentation could not be loaded.',
    );
  } finally {
    this.knowledgeLoading.set(false);
  }
}

protected onKnowledgeApplicationChange(
  event: Event,
): void {
  const select =
    event.target as HTMLSelectElement;

  this.knowledgeApplicationKey.set(
    select.value,
  );

  void this.loadKnowledgeArticles();
}

protected openKnowledgeArticle(
  article: KnowledgeArticle,
): void {
  void this.router.navigate([
    '/admin/configuration/knowledge',
    article.id,
  ]);
}

  protected contentTypeLabel(type: KnowledgeContentType): string {
  return type
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private currentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }
}

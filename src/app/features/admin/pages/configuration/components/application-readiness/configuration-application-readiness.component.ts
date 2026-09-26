import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ApplicationDependencyStatus } from '../../../../../../core/models/application-implementation.model';

import { ApplicationReadinessService } from '../../../../../../core/services/application-readiness.service';

@Component({
  selector: 'app-configuration-application-readiness',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <mat-icon class="text-primary-600"> account_tree </mat-icon>

            <h2 class="text-xl font-semibold text-gray-900">Application Readiness</h2>
          </div>

          <p class="mt-1 max-w-3xl text-sm text-gray-600">
            Verify that the implementation components, services, repositories, data, routes, and
            infrastructure required by each application are present.
          </p>
        </div>

        <button
          mat-stroked-button
          type="button"
          class="shrink-0"
          [disabled]="isValidating()"
          (click)="validate()"
        >
          <mat-icon>
            {{ isValidating() ? 'hourglass_top' : 'fact_check' }}
          </mat-icon>

          <span class="ml-2">
            {{ isValidating() ? 'Validating...' : 'Validate' }}
          </span>
        </button>
      </div>

      <!-- Overall Summary -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <!-- Applications -->
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">Applications</div>

          <div class="mt-2 text-2xl font-semibold text-gray-900">
            {{ readiness().length }}
          </div>
        </div>

        <!-- Operational -->
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">Operational</div>

          <div class="mt-2 flex items-center gap-2">
            <span class="text-2xl font-semibold text-gray-900">
              {{ operationalCount() }}
            </span>

            <mat-icon
              class="text-green-600"
              matTooltip="No required dependencies are missing or in error."
            >
              check_circle
            </mat-icon>
          </div>
        </div>

        <!-- Attention -->
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">Attention</div>

          <div class="mt-2 flex items-center gap-2">
            <span class="text-2xl font-semibold text-gray-900">
              {{ attentionCount() }}
            </span>

            <mat-icon
              class="text-amber-600"
              matTooltip="Applications with warnings, missing dependencies, or errors."
            >
              warning
            </mat-icon>
          </div>
        </div>

        <!-- Implementation Items -->
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="text-xs font-medium uppercase tracking-wide text-gray-500">
            Implementation Items
          </div>

          <div class="mt-2 text-2xl font-semibold text-gray-900">
            {{ dependencyCount() }}
          </div>

          <div class="mt-1 text-xs text-gray-500">
            {{ discoveredCount() }} discovered

            @if (declaredCount() > 0) {
              <span> · {{ declaredCount() }} declared </span>
            }
          </div>
        </div>
      </div>

      <!-- Application Cards -->
      <div class="space-y-4">
        @for (item of readiness(); track item.summary.applicationKey) {
          <article class="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <!-- Application Header -->
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <!-- Status Icon -->
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    [class.bg-green-100]="item.summary.operational"
                    [class.bg-red-100]="!item.summary.operational"
                  >
                    <mat-icon
                      [class.text-green-700]="item.summary.operational"
                      [class.text-red-700]="!item.summary.operational"
                    >
                      {{ item.summary.operational ? 'check_circle' : 'error' }}
                    </mat-icon>
                  </div>

                  <!-- Application Name -->
                  <div class="min-w-0">
                    <h3 class="truncate text-base font-semibold text-gray-900">
                      {{ item.summary.applicationName }}
                    </h3>

                    <p class="text-xs text-gray-500">
                      {{ item.summary.applicationKey }}
                    </p>
                  </div>
                </div>

                @if (item.manifest.description) {
                  <p class="mt-3 text-sm text-gray-600">
                    {{ item.manifest.description }}
                  </p>
                }
              </div>

              <!-- Status -->
              <div class="shrink-0">
                @if (item.summary.operational) {
                  <span
                    class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                  >
                    Operational
                  </span>
                } @else {
                  <span
                    class="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                  >
                    Attention Required
                  </span>
                }
              </div>

              @if (validationResult(item.summary.applicationKey); as validation) {
                <div class="mt-2 text-right text-xs text-gray-500">
                  Validation:
                  <span
                    class="font-medium"
                    [class.text-green-700]="validation.status === 'passed'"
                    [class.text-amber-700]="validation.status === 'warning'"
                    [class.text-red-700]="validation.status === 'failed'"
                  >
                    {{ getValidationStatusLabel(validation.status) }}
                  </span>
                </div>
              }
            </div>

            <!-- Application Summary -->
            <div
              class="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 md:grid-cols-7"
            >
              <!-- Total -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Total</div>

                <div class="mt-1 font-semibold text-gray-900">
                  {{ item.summary.total }}
                </div>
              </div>

              <!-- Discovered -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Discovered</div>

                <div class="mt-1 font-semibold text-green-700">
                  {{ item.summary.discovered }}
                </div>
              </div>

              <!-- Declared -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Declared</div>

                <div class="mt-1 font-semibold text-blue-700">
                  {{ item.summary.declared }}
                </div>
              </div>

              <!-- Detected -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Detected</div>

                <div class="mt-1 font-semibold text-green-700">
                  {{ item.summary.detected }}
                </div>
              </div>

              <!-- Missing -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Missing</div>

                <div class="mt-1 font-semibold text-red-700">
                  {{ item.summary.missing }}
                </div>
              </div>

              <!-- Warnings -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Warnings</div>

                <div class="mt-1 font-semibold text-amber-700">
                  {{ item.summary.warnings }}
                </div>
              </div>

              <!-- Errors -->
              <div class="bg-gray-50 p-4">
                <div class="text-xs text-gray-500">Errors</div>

                <div class="mt-1 font-semibold text-red-700">
                  {{ item.summary.errors }}
                </div>
              </div>
            </div>

            <!-- Dependency Section -->
            <div class="border-t border-gray-200">
              <!-- Expand/Collapse -->
              <button
                type="button"
                class="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                [attr.aria-expanded]="isExpanded(item.summary.applicationKey)"
                (click)="toggle(item.summary.applicationKey)"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <mat-icon class="text-gray-500"> account_tree </mat-icon>

                  <div class="min-w-0">
                    <div class="text-sm font-medium text-gray-800">Implementation Dependencies</div>

                    <div class="mt-0.5 text-xs text-gray-500">
                      {{ item.summary.total }}
                      implementation items
                    </div>
                  </div>
                </div>

                <mat-icon class="shrink-0">
                  {{ isExpanded(item.summary.applicationKey) ? 'expand_less' : 'expand_more' }}
                </mat-icon>
              </button>

              <!-- Dependencies -->
              @if (isExpanded(item.summary.applicationKey)) {
                <div class="border-t border-gray-100">
                  @for (dependency of item.dependencies; track dependency.id) {
                    <div
                      class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <!-- Dependency Details -->
                      <div class="min-w-0">
                        <div class="flex items-start gap-2">
                          <!-- Status Icon -->
                          <mat-icon
                            class="!mt-0.5 !h-5 !w-5 !text-[20px] !leading-5"
                            [class.text-green-600]="dependency.status === 'detected'"
                            [class.text-red-600]="
                              dependency.status === 'missing' || dependency.status === 'error'
                            "
                            [class.text-amber-600]="dependency.status === 'warning'"
                            [class.text-gray-400]="dependency.status === 'unknown'"
                          >
                            {{ getStatusIcon(dependency.status) }}
                          </mat-icon>

                          <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="break-words text-sm font-medium text-gray-800">
                                {{ dependency.name }}
                              </span>

                              @if (dependency.required) {
                                <span
                                  class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-600"
                                >
                                  Required
                                </span>
                              }
                            </div>

                            @if (dependency.path) {
                              <div class="mt-1 break-all text-xs text-gray-500">
                                {{ dependency.path }}
                              </div>
                            }

                            @if (dependency.description) {
                              <div class="mt-1 break-words text-xs text-gray-500">
                                {{ dependency.description }}
                              </div>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Dependency Status -->
                      <span
                        class="inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
                        [class.bg-green-100]="dependency.status === 'detected'"
                        [class.text-green-800]="dependency.status === 'detected'"
                        [class.bg-red-100]="
                          dependency.status === 'missing' || dependency.status === 'error'
                        "
                        [class.text-red-800]="
                          dependency.status === 'missing' || dependency.status === 'error'
                        "
                        [class.bg-amber-100]="dependency.status === 'warning'"
                        [class.text-amber-800]="dependency.status === 'warning'"
                        [class.bg-gray-100]="dependency.status === 'unknown'"
                        [class.text-gray-700]="dependency.status === 'unknown'"
                      >
                        {{ getStatusLabel(dependency.status) }}
                      </span>
                    </div>
                  } @empty {
                    <div class="px-5 py-8 text-center text-sm text-gray-500">
                      No implementation dependencies are registered.
                    </div>
                  }
                </div>
              }
            </div>
          </article>
        } @empty {
          <!-- Empty State -->
          <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <mat-icon class="text-gray-400"> account_tree </mat-icon>

            <p class="mt-2 text-sm text-gray-600">
              No application implementation inventory is available.
            </p>
          </div>
        }
      </div>
    </section>
  `,
})
export class ConfigurationApplicationReadinessComponent {
  private readonly readinessService = inject(ApplicationReadinessService);

  private readonly expandedState = signal<Set<string>>(new Set());

  readonly isValidating = signal(false);

  readonly readiness = computed(() => this.readinessService.getAllReadiness());

  readonly operationalCount = computed(
    () => this.readiness().filter((item) => item.summary.operational).length,
  );

  readonly attentionCount = computed(
    () => this.readiness().filter((item) => !item.summary.operational).length,
  );

  /**
   * Total canonical implementation items after
   * reconciliation between generated inventory and
   * declared application requirements.
   */
  readonly dependencyCount = computed(() =>
    this.readiness().reduce((total, item) => total + item.summary.total, 0),
  );

  /**
   * Number of physical source/infrastructure artifacts
   * discovered by the inventory generator.
   */
  readonly discoveredCount = computed(() =>
    this.readiness().reduce((total, item) => total + item.summary.discovered, 0),
  );

  /**
   * Number of logical requirements declared by the
   * application architecture.
   */
  readonly declaredCount = computed(() =>
    this.readiness().reduce((total, item) => total + item.summary.declared, 0),
  );

  async validate(): Promise<void> {
    if (this.isValidating()) {
      return;
    }

    this.isValidating.set(true);

    try {
      await this.readinessService.validate();
    } finally {
      this.isValidating.set(false);
    }
  }

  toggle(applicationKey: string): void {
    this.expandedState.update((current) => {
      const next = new Set(current);

      if (next.has(applicationKey)) {
        next.delete(applicationKey);
      } else {
        next.add(applicationKey);
      }

      return next;
    });
  }

  isExpanded(applicationKey: string): boolean {
    return this.expandedState().has(applicationKey);
  }

  getStatusIcon(status: ApplicationDependencyStatus): string {
    switch (status) {
      case 'detected':
        return 'check_circle';

      case 'missing':
        return 'cancel';

      case 'warning':
        return 'warning';

      case 'error':
        return 'error';

      case 'unknown':
      default:
        return 'help';
    }
  }

  getStatusLabel(status: ApplicationDependencyStatus): string {
    switch (status) {
      case 'detected':
        return 'Detected';

      case 'missing':
        return 'Missing';

      case 'warning':
        return 'Warning';

      case 'error':
        return 'Error';

      case 'unknown':
      default:
        return 'Unknown';
    }
  }

  validationResult(applicationKey: string) {
    return (
      this.readinessService
        .validationResults()
        .find((result) => result.applicationKey === applicationKey) ?? null
    );
  }

  getValidationStatusLabel(status: 'passed' | 'warning' | 'failed'): string {
    switch (status) {
      case 'passed':
        return 'Passed';

      case 'warning':
        return 'Warnings';

      case 'failed':
        return 'Failed';

      default:
        return 'Not validated';
    }
  }
}

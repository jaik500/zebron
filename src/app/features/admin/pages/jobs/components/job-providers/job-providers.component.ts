import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions } from '../../../../../../core/services/firebase-config';

export type ProviderStatus =
  | 'connected'
  | 'disconnected'
  | 'checking'
  | 'error';

interface JobProvider {
  id: string;
  name: string;
  description: string;
  status: ProviderStatus;
  lastCheckedAt?: Date;
  lastSyncAt?: Date;
  enabled: boolean;
  lastError?: string;
  lastMessage?: string;
  returnedResults?: number;
  availableResults?: number;
}

interface USAJOBSVerificationResponse {
  success: boolean;
  message: string;
  returnedResults?: number;
  availableResults?: number;
  httpStatus?: number;
}

interface USAJOBSSyncResponse {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  returned: number;
  totalAvailable: number;
  syncedAt: string;
}

@Component({
  selector: 'app-job-providers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">

      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            Job Providers
          </h2>

          <p class="mt-1 text-sm text-gray-500">
            Monitor external job connections and synchronization.
          </p>
        </div>

        <button
          type="button"
          (click)="refreshAll()"
          [disabled]="refreshing()"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm
                 font-medium text-white hover:bg-indigo-700
                 disabled:cursor-not-allowed disabled:opacity-50">

          {{ refreshing() ? 'Checking...' : 'Refresh Connections' }}
        </button>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div class="rounded-xl border bg-white p-5">
          <p class="text-sm text-gray-500">
            Total Providers
          </p>

          <p class="mt-2 text-2xl font-bold text-gray-900">
            {{ providers().length }}
          </p>
        </div>

        <div class="rounded-xl border bg-white p-5">
          <p class="text-sm text-gray-500">
            Connected
          </p>

          <p class="mt-2 text-2xl font-bold text-green-600">
            {{ connectedCount() }}
          </p>
        </div>

        <div class="rounded-xl border bg-white p-5">
          <p class="text-sm text-gray-500">
            Issues
          </p>

          <p class="mt-2 text-2xl font-bold text-red-600">
            {{ issueCount() }}
          </p>
        </div>

      </div>

      <!-- Provider List -->
      <div class="overflow-hidden rounded-xl border bg-white">

        <div class="border-b px-5 py-4">
          <h3 class="font-semibold text-gray-900">
            External Integrations
          </h3>

          <p class="mt-1 text-sm text-gray-500">
            Connection health and provider availability.
          </p>
        </div>

        @for (provider of providers(); track provider.id) {

          <div class="flex flex-wrap items-center justify-between
                      gap-4 border-b p-5 last:border-0">

            <!-- Provider Information -->
            <div class="min-w-[240px] flex-1">

              <div class="flex flex-wrap items-center gap-2">

                <h4 class="font-semibold text-gray-900">
                  {{ provider.name }}
                </h4>

                <span
                  class="rounded-full px-2 py-1 text-xs font-medium"
                  [ngClass]="{
                    'bg-green-100 text-green-700':
                      provider.status === 'connected',
                    'bg-red-100 text-red-700':
                      provider.status === 'error' ||
                      provider.status === 'disconnected',
                    'bg-yellow-100 text-yellow-700':
                      provider.status === 'checking'
                  }">

                  {{ provider.status | titlecase }}

                </span>

                @if (provider.enabled) {
                  <span
                    class="rounded-full bg-blue-50 px-2 py-1
                           text-xs font-medium text-blue-700">
                    Enabled
                  </span>
                }

              </div>

              <p class="mt-1 text-sm text-gray-500">
                {{ provider.description }}
              </p>

              <!-- Last Checked -->
              <p class="mt-3 text-xs text-gray-400">
                <span class="font-medium text-gray-500">
                  Last checked:
                </span>

                {{ provider.lastCheckedAt
                  ? (provider.lastCheckedAt | date:'medium')
                  : 'Never' }}
              </p>

              <!-- Last Sync -->
              <p class="mt-1 text-xs text-gray-400">
                <span class="font-medium text-gray-500">
                  Last sync:
                </span>

                {{ provider.lastSyncAt
                  ? (provider.lastSyncAt | date:'medium')
                  : 'Not recorded' }}
              </p>

              <!-- API Results -->
              @if (provider.returnedResults !== undefined) {

                <p class="mt-2 text-xs text-gray-500">
                  API returned
                  <strong>{{ provider.returnedResults }}</strong>
                  of
                  <strong>{{ provider.availableResults ?? 0 }}</strong>
                  available results.
                </p>

              }

              <!-- Last Message -->
              @if (provider.lastMessage) {

                <p class="mt-2 text-xs text-green-700">
                  {{ provider.lastMessage }}
                </p>

              }

              <!-- Error -->
              @if (provider.lastError) {

                <div class="mt-3 rounded-lg border border-red-100
                            bg-red-50 p-3 text-sm text-red-700">

                  <p class="font-semibold">
                    Connection issue
                  </p>

                  <p class="mt-1">
                    {{ provider.lastError }}
                  </p>

                </div>

              }

            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-2">

              <button
                type="button"
                (click)="testConnection(provider)"
                [disabled]="provider.status === 'checking'"
                class="rounded-lg border border-gray-300 px-3 py-2
                       text-sm font-medium text-gray-700
                       hover:bg-gray-50
                       disabled:cursor-not-allowed disabled:opacity-50">

                @if (provider.status === 'checking') {
                  Checking...
                } @else {
                  Test Connection
                }

              </button>

              <button
                type="button"
                (click)="syncProvider(provider)"
                [disabled]="!provider.enabled"
                title="Manual synchronization requires an HTTP or callable backend trigger."
                class="rounded-lg bg-indigo-600 px-3 py-2
                       text-sm font-medium text-white
                       hover:bg-indigo-700
                       disabled:cursor-not-allowed disabled:opacity-50">

                Sync Now

              </button>

            </div>

          </div>

        }

      </div>

      <!-- General Message -->
      @if (message()) {

        <div
          class="rounded-lg border border-blue-200
                 bg-blue-50 p-4 text-sm text-blue-800">

          {{ message() }}

        </div>

      }

      <!-- Sync Information -->
      <div class="rounded-xl border border-indigo-100
                  bg-indigo-50 p-5">

        <div class="flex items-start gap-3">

          <span class="material-icons text-indigo-600">
            schedule
          </span>

          <div>
            <h3 class="font-semibold text-indigo-900">
              Automatic Synchronization
            </h3>

            <p class="mt-1 text-sm text-indigo-800">
              USAJOBS synchronization currently runs automatically
              every 12 hours through the scheduled Firebase function.
            </p>

            <p class="mt-2 text-xs text-indigo-700">
              Manual synchronization is available to platform administrators.
              Automatic USAJOBS synchronization continues every 12 hours.
            </p>
          </div>

        </div>

      </div>

    </section>
  `
})
export class JobProvidersComponent {

  /**
   * Deployed Firebase HTTP function.
   *
   * This is the Cloud Run URL for verifyUsajobsCredentials.
   */
  private readonly usaJobsVerificationUrl =
    'https://verifyusajobscredentials-m5xx6al62a-uc.a.run.app';

  providers = signal<JobProvider[]>([
    {
      id: 'usajobs',
      name: 'USAJOBS',
      description:
        'United States federal government job listings.',
      status: 'disconnected',
      enabled: true
    }
  ]);

  refreshing = signal(false);

  syncing = signal(false);

  message = signal('');

  connectedCount = () =>
    this.providers().filter(
      provider => provider.status === 'connected'
    ).length;

  issueCount = () =>
    this.providers().filter(
      provider =>
        provider.status === 'error' ||
        provider.status === 'disconnected'
    ).length;

  /**
   * Refresh all provider connections.
   */
  async refreshAll(): Promise<void> {
    this.refreshing.set(true);
    this.message.set('');

    try {
      const enabledProviders = this.providers().filter(
        provider => provider.enabled
      );

      await Promise.all(
        enabledProviders.map(provider =>
          this.testConnection(provider)
        )
      );

      this.message.set(
        'Provider connection checks completed.'
      );

    } finally {
      this.refreshing.set(false);
    }
  }

  /**
   * Test USAJOBS API credentials.
   */
  async testConnection(
    provider: JobProvider
  ): Promise<void> {

    if (provider.id !== 'usajobs') {
      return;
    }

    this.message.set('');

    this.updateProvider(provider.id, {
      status: 'checking',
      lastError: undefined,
      lastMessage: undefined
    });

    try {

      const response = await fetch(
        this.usaJobsVerificationUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          cache: 'no-store'
        }
      );

      const result =
        await response.json() as USAJOBSVerificationResponse;

      const checkedAt = new Date();

      if (!response.ok || !result.success) {

        this.updateProvider(provider.id, {
          status: 'error',
          lastCheckedAt: checkedAt,
          lastError:
            result.message ||
            `USAJOBS verification failed. HTTP ${response.status}.`,
          lastMessage: undefined,
          returnedResults: result.returnedResults,
          availableResults: result.availableResults
        });

        this.message.set(
          'USAJOBS credentials could not be verified.'
        );

        return;
      }

      this.updateProvider(provider.id, {
        status: 'connected',
        lastCheckedAt: checkedAt,
        lastError: undefined,
        lastMessage: result.message,
        returnedResults: result.returnedResults,
        availableResults: result.availableResults
      });

      this.message.set(
        'USAJOBS connection verified successfully.'
      );

    } catch (error: unknown) {

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected connection error occurred.';

      this.updateProvider(provider.id, {
        status: 'error',
        lastCheckedAt: new Date(),
        lastError:
          `${errorMessage}. Check the function CORS configuration and network connectivity.`,
        lastMessage: undefined
      });

      this.message.set(
        'Unable to reach the USAJOBS verification endpoint.'
      );

    }

  }

  /**
   * Manual sync is not yet supported by the backend.
   *
   * syncUsajobsJobs currently uses onSchedule and runs
   * automatically every 12 hours.
   */
  async syncProvider(provider: JobProvider): Promise<void> {
  if (provider.id !== 'usajobs' || this.syncing()) {
    return;
  }

  if (!provider.enabled) {
    return;
  }

  this.syncing.set(true);
  this.message.set('USAJOBS synchronization is running...');

  try {
    const sync = httpsCallable<void, USAJOBSSyncResponse>(
      firebaseFunctions,
      'triggerUsajobsSync',
      {
        timeout: 540_000,
      }
    );

    const result = await sync();
    const data = result.data;

    this.updateProvider('usajobs', {
      status: 'connected',
      lastSyncAt: data.syncedAt ? new Date(data.syncedAt) : new Date(),
      returnedResults: data.returned,
      availableResults: data.totalAvailable,
      lastError: undefined,
      lastMessage: 'USAJOBS synchronization completed successfully.',
    });

    this.message.set(
      `USAJOBS sync completed: ${data.imported} imported, ` +
      `${data.updated} updated, ${data.skipped} skipped.`
    );

  } catch (error) {
    console.error('USAJOBS synchronization failed:', error);

    const firebaseError = error as {
      code?: string;
      message?: string;
    };

    if (firebaseError.code === 'functions/permission-denied') {
      this.message.set(
        'Access denied. Only platform administrators can synchronize USAJOBS.'
      );
    } else {
      this.message.set(
        'USAJOBS synchronization failed. Please check your connection and try again.'
      );
    }

    this.updateProvider('usajobs', {
      lastError: this.message(),
    });

  } finally {
    this.syncing.set(false);
  }
}

  /**
   * Update provider state.
   */
  private updateProvider(
    id: string,
    changes: Partial<JobProvider>
  ): void {

    this.providers.update(items =>
      items.map(item =>
        item.id === id
          ? { ...item, ...changes }
          : item
      )
    );

  }

}
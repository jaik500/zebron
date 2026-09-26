
import { inject } from '@angular/core';

import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  OperationalEvent,
  OperationalEventQuery,
  OperationalEventSeverity,
  OperationalEventStatus,
  OperationalEventType,
} from '../../../../../core/models/operational-event.model';

import { OperationalMonitoringService } from '../../../../../core/services/operational-monitoring.service';
import { LoggerService } from '../../../../../core/services/logger.service';

interface OperationalMonitoringState {
  events: OperationalEvent[];
  loading: boolean;
  error: string | null;
  query: OperationalEventQuery;
  lastLoadedAt: string | null;
}

const initialState: OperationalMonitoringState = {
  events: [],
  loading: false,
  error: null,

  query: {
    limit: 50,
  },

  lastLoadedAt: null,
};

export const OperationalMonitoringStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withMethods(
    (
      store,

      operationalMonitoringService = inject(
        OperationalMonitoringService,
      ),

      logger = inject(LoggerService),
    ) => ({
      /**
       * Load operational events using the current query.
       */
      async load(): Promise<void> {
        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const events =
            await operationalMonitoringService.query(
              store.query(),
            );

          patchState(store, {
            events,
            loading: false,
            error: null,
            lastLoadedAt:
              new Date().toISOString(),
          });
        } catch (error) {
          logger.error(
            'OperationalMonitoringStore',
            'Failed to load operational events.',
            error,
          );

          patchState(store, {
            loading: false,
            error:
              'Unable to load operational events.',
          });
        }
      },

      /**
       * Refresh the current operational event view.
       */
      async refresh(): Promise<void> {
        await this.load();
      },

      /**
       * Update the query and reload events.
       */
      async setQuery(
        query: OperationalEventQuery,
      ): Promise<void> {
        patchState(store, {
          query: {
            ...store.query(),
            ...query,
          },
        });

        await this.load();
      },

      /**
       * Filter by event status.
       */
      async filterByStatus(
        status?: OperationalEventStatus,
      ): Promise<void> {
        await this.setQuery({
          status,
        });
      },

      /**
       * Filter by severity.
       */
      async filterBySeverity(
        severity?: OperationalEventSeverity,
      ): Promise<void> {
        await this.setQuery({
          severity,
        });
      },

      /**
       * Filter by event type.
       */
      async filterByType(
        type?: OperationalEventType,
      ): Promise<void> {
        await this.setQuery({
          type,
        });
      },

      /**
       * Filter by feature.
       */
      async filterByFeature(
        feature?: string,
      ): Promise<void> {
        await this.setQuery({
          feature,
        });
      },

      /**
       * Acknowledge an operational event.
       */
      async acknowledge(
        eventId: string,
        userId: string,
      ): Promise<void> {
        try {
          await operationalMonitoringService.acknowledge(
            eventId,
            userId,
          );

          await this.load();
        } catch (error) {
          logger.error(
            'OperationalMonitoringStore',
            'Failed to acknowledge operational event.',
            error,
          );

          patchState(store, {
            error:
              'Unable to acknowledge the operational event.',
          });
        }
      },

      /**
       * Move an event into investigation.
       */
      async investigate(
        eventId: string,
      ): Promise<void> {
        try {
          await operationalMonitoringService.investigate(
            eventId,
          );

          await this.load();
        } catch (error) {
          logger.error(
            'OperationalMonitoringStore',
            'Failed to update operational event.',
            error,
          );

          patchState(store, {
            error:
              'Unable to update the operational event.',
          });
        }
      },

      /**
       * Resolve an operational event.
       */
      async resolve(
        eventId: string,
        userId: string,
      ): Promise<void> {
        try {
          await operationalMonitoringService.resolve(
            eventId,
            userId,
          );

          await this.load();
        } catch (error) {
          logger.error(
            'OperationalMonitoringStore',
            'Failed to resolve operational event.',
            error,
          );

          patchState(store, {
            error:
              'Unable to resolve the operational event.',
          });
        }
      },

      /**
       * Close an operational event.
       */
      async close(
        eventId: string,
      ): Promise<void> {
        try {
          await operationalMonitoringService.close(
            eventId,
          );

          await this.load();
        } catch (error) {
          logger.error(
            'OperationalMonitoringStore',
            'Failed to close operational event.',
            error,
          );

          patchState(store, {
            error:
              'Unable to close the operational event.',
          });
        }
      },

      /**
       * Clear the current error.
       */
      clearError(): void {
        patchState(store, {
          error: null,
        });
      },
    }),
  ),
);

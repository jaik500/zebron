
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';

import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

import { provideHotToastConfig } from '@ngxpert/hot-toast';

import { routes } from './app.routes';

import { JOB_REPOSITORY } from './core/repositories/job.repository';
import { FirestoreJobRepository } from './core/repositories/firestore/firestore-job.repository';

import { OperationalEventRepository } from './core/repositories/operational-event.repository';
import { FirebaseOperationalEventRepository } from './core/repositories/firebase-operational-event.repository';

import { TaxPayConfigurationRepository } from './core/repositories/tax-pay-configuration.repository';
import { FirestoreTaxPayConfigurationRepository } from './core/repositories/firestore/firestore-tax-pay-configuration.repository';

import { KnowledgeArticleRepository } from './core/repositories/knowledge-article.repository';
import { FirestoreKnowledgeArticleRepository } from './core/repositories/firestore/firestore-knowledge-article.repository';

import { OrganizationMembershipRepository } from './core/repositories/firestore/organization-membership.repository';
import { FirestoreMembershipRepository } from './core/repositories/firestore/firestore-membership.repository';
import {
  ORGANIZATION_REPOSITORY,
} from './core/repositories/organization.repository';

import {
  FirestoreOrganizationRepository,
} from './core/repositories/firestore-organization.repository';

import { LocalizationService } from './core/services/localization.service';
import {
  ORGANIZATION_APPLICATION_REPOSITORY,
} from './core/repositories/organization-application.repository';

import {
  FirestoreOrganizationApplicationRepository,
} from './core/repositories/firestore-organization-application.repository';

import {
  ORGANIZATION_APPLICATION_REQUEST_REPOSITORY,
} from './core/repositories/organization-application-request.repository';

import {
  FirestoreOrganizationApplicationRequestRepository,
} from './core/repositories/firestore-organization-application-request.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),

    provideClientHydration(
      withEventReplay(),
    ),

    provideHotToastConfig({
      position: 'top-center',
      stacking: 'depth',
      duration: 3000,
      style: {
        marginTop: '70px',
      },
    }),

    provideHttpClient(
      withFetch(),
    ),

    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
        subscriptSizing: 'dynamic',
        floatLabel: 'never',
      },
    },

    // ─────────────────────────────────────────────
    // Repository bindings
    // ─────────────────────────────────────────────

    {
      provide: JOB_REPOSITORY,
      useExisting: FirestoreJobRepository,
    },

    {
      provide: OperationalEventRepository,
      useClass: FirebaseOperationalEventRepository,
    },

    {
      provide: TaxPayConfigurationRepository,
      useClass: FirestoreTaxPayConfigurationRepository,
    },

    {
      provide: KnowledgeArticleRepository,
      useClass: FirestoreKnowledgeArticleRepository,
    },

    {
      provide: OrganizationMembershipRepository,
      useClass: FirestoreMembershipRepository,
    },
    {
  provide: ORGANIZATION_REPOSITORY,
  useClass: FirestoreOrganizationRepository,
},
{
  provide: ORGANIZATION_APPLICATION_REPOSITORY,
  useClass: FirestoreOrganizationApplicationRepository,
},
{
  provide: ORGANIZATION_APPLICATION_REQUEST_REPOSITORY,
  useClass: FirestoreOrganizationApplicationRequestRepository,
},

    // ─────────────────────────────────────────────
    // Application initialization
    // ─────────────────────────────────────────────

    provideAppInitializer(() => {
      const localizationService =
        inject(LocalizationService);

      localizationService.initialize();
    }),

    // ─────────────────────────────────────────────
    // Angular Material
    // ─────────────────────────────────────────────

    provideNativeDateAdapter(),
  ],
};

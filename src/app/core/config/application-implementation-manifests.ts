import {
  ApplicationImplementationManifest,
} from '../models/application-implementation.model';

/**
 * Central application implementation manifests.
 *
 * IMPORTANT:
 *
 * This registry describes the architectural pieces that an application
 * requires. It does not replace the source code, Firestore configuration,
 * FeatureConfig, SystemSetting, or TaxPayConfiguration systems.
 *
 * The source code remains authoritative.
 */
export const APPLICATION_IMPLEMENTATION_MANIFESTS:
  ApplicationImplementationManifest[] = [
    // ============================================================
    // COMMUNITY
    // ============================================================

    {
      applicationKey: 'community',
      applicationName: 'Community',
      description:
        'Community discussion, posts, comments, reactions, topics, and user interaction.',
      dependencies: [
        {
          id: 'community.pages',
          applicationKey: 'community',
          name: 'Community Pages',
          path: 'src/app/features/community/pages',
          type: 'page',
          required: true,
          status: 'unknown',
        },
        {
          id: 'community.components',
          applicationKey: 'community',
          name: 'Community Components',
          path: 'src/app/features/community/components',
          type: 'component',
          required: true,
          status: 'unknown',
        },
        {
          id: 'community.models',
          applicationKey: 'community',
          name: 'Community Models',
          path: 'src/app/features/community/models',
          type: 'model',
          required: true,
          status: 'unknown',
        },
        {
          id: 'community.services',
          applicationKey: 'community',
          name: 'Community Services',
          path: 'src/app/features/community/services',
          type: 'service',
          required: true,
          status: 'unknown',
        },
        {
          id: 'community.store',
          applicationKey: 'community',
          name: 'Community State Management',
          path: 'src/app/features/community',
          type: 'store',
          required: true,
          status: 'unknown',
        },
        {
          id: 'community.firestore',
          applicationKey: 'community',
          name: 'Community Firestore Data',
          type: 'firestore-collection',
          required: true,
          status: 'unknown',
        },
      ],
    },

    // ============================================================
    // RESOURCES
    // ============================================================

    {
      applicationKey: 'resources',
      applicationName: 'Resources',
      description:
        'Resource discovery, categories, resource details, media, and administration.',
      dependencies: [
        {
          id: 'resources.pages',
          applicationKey: 'resources',
          name: 'Resource Pages',
          path: 'src/app/features/resources',
          type: 'page',
          required: true,
          status: 'unknown',
        },
        {
          id: 'resources.components',
          applicationKey: 'resources',
          name: 'Resource Components',
          path: 'src/app/features/resources',
          type: 'component',
          required: true,
          status: 'unknown',
        },
        {
          id: 'resources.models',
          applicationKey: 'resources',
          name: 'Resource Models',
          path: 'src/app/features/resources',
          type: 'model',
          required: true,
          status: 'unknown',
        },
        {
          id: 'resources.services',
          applicationKey: 'resources',
          name: 'Resource Services',
          path: 'src/app/features/resources',
          type: 'service',
          required: true,
          status: 'unknown',
        },
        {
          id: 'resources.firestore',
          applicationKey: 'resources',
          name: 'Resource Firestore Data',
          type: 'firestore-collection',
          required: true,
          status: 'unknown',
        },
      ],
    },

    // ============================================================
    // JOBS
    // ============================================================

    {
      applicationKey: 'jobs',
      applicationName: 'Jobs',
      description:
        'Jobs, training opportunities, bootcamps, and employment resources.',
      dependencies: [
        {
          id: 'jobs.pages',
          applicationKey: 'jobs',
          name: 'Jobs Pages',
          path: 'src/app/features/jobs',
          type: 'page',
          required: true,
          status: 'unknown',
        },
        {
          id: 'jobs.components',
          applicationKey: 'jobs',
          name: 'Jobs Components',
          path: 'src/app/features/jobs',
          type: 'component',
          required: true,
          status: 'unknown',
        },
        {
          id: 'jobs.models',
          applicationKey: 'jobs',
          name: 'Jobs Models',
          path: 'src/app/features/jobs',
          type: 'model',
          required: true,
          status: 'unknown',
        },
        {
          id: 'jobs.services',
          applicationKey: 'jobs',
          name: 'Jobs Services',
          path: 'src/app/features/jobs',
          type: 'service',
          required: true,
          status: 'unknown',
        },
      ],
    },

    // ============================================================
    // TEST CENTER
    // ============================================================

    {
      applicationKey: 'test-center',
      applicationName: 'Test Center',
      description:
        'Test preparation courses, questions, practice tests, and assessments.',
      dependencies: [
        {
          id: 'test-center.pages',
          applicationKey: 'test-center',
          name: 'Test Center Pages',
          path: 'src/app/features/test-center',
          type: 'page',
          required: true,
          status: 'unknown',
        },
        {
          id: 'test-center.components',
          applicationKey: 'test-center',
          name: 'Test Center Components',
          path: 'src/app/features/test-center',
          type: 'component',
          required: true,
          status: 'unknown',
        },
        {
          id: 'test-center.models',
          applicationKey: 'test-center',
          name: 'Test Center Models',
          path: 'src/app/features/test-center',
          type: 'model',
          required: true,
          status: 'unknown',
        },
        {
          id: 'test-center.services',
          applicationKey: 'test-center',
          name: 'Test Center Services',
          path: 'src/app/features/test-center',
          type: 'service',
          required: true,
          status: 'unknown',
        },
      ],
    },

    // ============================================================
    // TAX & PAY
    // ============================================================

    {
      applicationKey: 'tax-pay',
      applicationName: 'Tax & Pay',
      description:
        'W-2, 1099, mixed-income, net-pay, tax, state, and local tax calculations.',
      dependencies: [
        {
          id: 'tax-pay.calculator',
          applicationKey: 'tax-pay',
          name: 'Tax Calculator',
          path: 'src/app/features/tax-pay-calculator',
          type: 'page',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.calculator-service',
          applicationKey: 'tax-pay',
          name: 'TaxCalculatorService',
          path:
            'src/app/features/tax-pay-calculator/services/tax-calculator.service.ts',
          type: 'service',
          required: true,
          status: 'unknown',
          description:
            'Calculates federal, FICA, self-employment, state, local, W-2, 1099, and mixed income results.',
        },

        {
          id: 'tax-pay.configuration-service',
          applicationKey: 'tax-pay',
          name: 'TaxCalculatorConfigurationService',
          path:
            'src/app/features/tax-pay-calculator/services/tax-calculator-configuration.service.ts',
          type: 'service',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.admin',
          applicationKey: 'tax-pay',
          name: 'TaxPayAdminComponent',
          path:
            'src/app/features/admin/pages/tax-pay-admin',
          type: 'component',
          required: true,
          status: 'unknown',
          description:
            'Administrative management of tax-year configurations.',
        },

        {
          id: 'tax-pay.configuration-model',
          applicationKey: 'tax-pay',
          name: 'TaxPayConfiguration',
          path:
            'src/app/features/tax-pay-calculator/models',
          type: 'model',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.calculator-model',
          applicationKey: 'tax-pay',
          name: 'TaxCalculatorInput / TaxCalculatorResult',
          path:
            'src/app/features/tax-pay-calculator/models',
          type: 'model',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.repository',
          applicationKey: 'tax-pay',
          name: 'TaxPayConfigurationRepository',
          path:
            'src/app/core/repositories',
          type: 'repository',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.firestore-adapter',
          applicationKey: 'tax-pay',
          name: 'FirestoreTaxPayConfigurationRepository',
          path:
            'src/app/core/repositories/firestore',
          type: 'adapter',
          required: true,
          status: 'unknown',
          description:
            'Firebase-specific implementation of the tax configuration repository.',
        },

        {
          id: 'tax-pay.seed-2026',
          applicationKey: 'tax-pay',
          name: '2026 Tax Configuration Seed',
          path:
            'src/app/features/tax-pay-calculator/data/tax-pay-configuration-2026.ts',
          type: 'data',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.maryland-local-tax',
          applicationKey: 'tax-pay',
          name: 'Maryland Local Tax Data',
          path:
            'src/app/features/tax-pay-calculator/data/maryland-local-tax-rates.data.ts',
          type: 'data',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.us-counties',
          applicationKey: 'tax-pay',
          name: 'US County Data',
          path:
            'src/app/features/tax-pay-calculator/data/us-counties.data.ts',
          type: 'data',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.firestore',
          applicationKey: 'tax-pay',
          name: 'Tax Configuration Firestore Data',
          type: 'firestore-collection',
          required: true,
          status: 'unknown',
          description:
            'Stores tax-year configurations independently from source-code tax data.',
        },

        {
          id: 'tax-pay.firestore-indexes',
          applicationKey: 'tax-pay',
          name: 'Firestore Indexes',
          path: 'firestore.indexes.json',
          type: 'firestore-index',
          required: true,
          status: 'unknown',
        },

        {
          id: 'tax-pay.firestore-rules',
          applicationKey: 'tax-pay',
          name: 'Firestore Security Rules',
          path: 'firestore.rules',
          type: 'firestore-rule',
          required: true,
          status: 'unknown',
        },
      ],
    },
  ];
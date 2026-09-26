import {
  LocalTaxConfiguration,
  TaxBracket,
  TaxPayConfiguration,
} from '../../../core/models/tax-pay-configuration.model';

import { MARYLAND_LOCAL_TAX_RATES_2026 } from './maryland-local-tax-rates.data';

/**
 * 2026 federal income-tax brackets for Single filers.
 *
 * Values are annual taxable-income thresholds.
 */
const FEDERAL_BRACKETS_SINGLE_2026: TaxBracket[] = [
  { min: 0, max: 12_400, rate: 0.1 },
  { min: 12_400, max: 50_400, rate: 0.12 },
  { min: 50_400, max: 105_700, rate: 0.22 },
  { min: 105_700, max: 201_775, rate: 0.24 },
  { min: 201_775, max: 256_225, rate: 0.32 },
  { min: 256_225, max: 640_600, rate: 0.35 },
  { min: 640_600, max: null, rate: 0.37 },
];

/**
 * 2026 federal income-tax brackets for Married Filing Jointly.
 */
const FEDERAL_BRACKETS_MARRIED_JOINTLY_2026: TaxBracket[] = [
  { min: 0, max: 24_800, rate: 0.1 },
  { min: 24_800, max: 100_800, rate: 0.12 },
  { min: 100_800, max: 211_400, rate: 0.22 },
  { min: 211_400, max: 403_550, rate: 0.24 },
  { min: 403_550, max: 512_450, rate: 0.32 },
  { min: 512_450, max: 768_700, rate: 0.35 },
  { min: 768_700, max: null, rate: 0.37 },
];

/**
 * 2026 federal income-tax brackets for Head of Household.
 */
const FEDERAL_BRACKETS_HEAD_OF_HOUSEHOLD_2026: TaxBracket[] = [
  { min: 0, max: 17_700, rate: 0.1 },
  { min: 17_700, max: 67_450, rate: 0.12 },
  { min: 67_450, max: 105_700, rate: 0.22 },
  { min: 105_700, max: 201_750, rate: 0.24 },
  { min: 201_750, max: 256_200, rate: 0.32 },
  { min: 256_200, max: 640_600, rate: 0.35 },
  { min: 640_600, max: null, rate: 0.37 },
];

/**
 * 2026 federal income-tax brackets for Married Filing Separately.
 *
 * The current TaxPayConfiguration model does not expose a separate
 * MFS bracket collection, so MFS is intentionally not added here.
 * The calculator's existing filing-status handling determines how
 * the configured brackets are consumed.
 */
const FEDERAL_BRACKETS_MARRIED_SEPARATELY_2026: TaxBracket[] = [
  { min: 0, max: 12_400, rate: 0.1 },
  { min: 12_400, max: 50_400, rate: 0.12 },
  { min: 50_400, max: 105_700, rate: 0.22 },
  { min: 105_700, max: 201_775, rate: 0.24 },
  { min: 201_775, max: 256_225, rate: 0.32 },
  { min: 256_225, max: 384_350, rate: 0.35 },
  { min: 384_350, max: null, rate: 0.37 },
];

/**
 * Maryland 2026 state income-tax brackets for:
 * - Single
 * - Married Filing Separately
 * - Dependent taxpayers
 * - Fiduciaries
 */
const MARYLAND_BRACKETS_SINGLE_2026: TaxBracket[] = [
  { min: 0, max: 1_000, rate: 0.02 },
  { min: 1_000, max: 2_000, rate: 0.03 },
  { min: 2_000, max: 3_000, rate: 0.04 },
  { min: 3_000, max: 100_000, rate: 0.0475 },
  { min: 100_000, max: 125_000, rate: 0.05 },
  { min: 125_000, max: 150_000, rate: 0.0525 },
  { min: 150_000, max: 250_000, rate: 0.055 },
  { min: 250_000, max: 500_000, rate: 0.0575 },
  { min: 500_000, max: 1_000_000, rate: 0.0625 },
  { min: 1_000_000, max: null, rate: 0.065 },
];

/**
 * Maryland 2026 state income-tax brackets for:
 * - Married Filing Jointly
 * - Head of Household
 * - Qualifying Surviving Spouse
 */
const MARYLAND_BRACKETS_MARRIED_JOINTLY_2026: TaxBracket[] = [
  { min: 0, max: 1_000, rate: 0.02 },
  { min: 1_000, max: 2_000, rate: 0.03 },
  { min: 2_000, max: 3_000, rate: 0.04 },
  { min: 3_000, max: 150_000, rate: 0.0475 },
  { min: 150_000, max: 175_000, rate: 0.05 },
  { min: 175_000, max: 225_000, rate: 0.0525 },
  { min: 225_000, max: 300_000, rate: 0.055 },
  { min: 300_000, max: 600_000, rate: 0.0575 },
  { min: 600_000, max: 1_200_000, rate: 0.0625 },
  { min: 1_200_000, max: null, rate: 0.065 },
];

/**
 * Converts the existing Maryland 2026 local-tax data into the
 * provider-neutral LocalTaxConfiguration model.
 */
function buildMarylandLocalTaxes2026(): LocalTaxConfiguration[] {
  return Object.entries(MARYLAND_LOCAL_TAX_RATES_2026).map(([countyCode, rule]) => ({
    stateCode: 'MD',
    countyCode,
    countyName: rule.county,
    rate: rule.brackets[0]?.rate ?? 0,
  }));
}

/**
 * Creates the initial 2026 tax configuration used to initialize
 * Zebron's tax calculator.
 *
 * This is a seed/factory only. Runtime calculation should obtain
 * the active configuration through TaxPayConfigurationRepository.
 */
export function createTaxPayConfiguration2026(): TaxPayConfiguration {
  const now = new Date().toISOString();

  return {
    id: '2026',

    taxYear: 2026,

    federal: {
      standardDeductionSingle: 16_100,
      standardDeductionMarriedJointly: 32_200,
      standardDeductionHeadOfHousehold: 24_150,

      bracketsSingle: FEDERAL_BRACKETS_SINGLE_2026,

      bracketsMarriedJointly: FEDERAL_BRACKETS_MARRIED_JOINTLY_2026,

      bracketsHeadOfHousehold: FEDERAL_BRACKETS_HEAD_OF_HOUSEHOLD_2026,

      childTaxCredit: 2_200,

      additionalChildTaxCredit: 1_700,
    },

    fica: {
      socialSecurityRate: 0.062,

      socialSecurityWageBase: 184_500,

      medicareRate: 0.0145,

      additionalMedicareRate: 0.009,

      additionalMedicareThresholdSingle: 200_000,

      additionalMedicareThresholdMarriedJointly: 200_000,
    },

    selfEmployment: {
      selfEmploymentTaxRate: 0.153,

      socialSecurityWageBase: 184_500,

      taxableEarningsRate: 0.9235,

      seTaxDeductionRate: 0.5,
    },

   /**
 * Maryland 2026 state-tax configuration.
 *
 * Single and Married Filing Separately use the Maryland
 * single-filer schedule. Married Filing Jointly and Head
 * of Household use the joint-filer schedule.
 *
 * Maryland local income-tax rates are maintained separately
 * in the provider-neutral local-tax configuration.
 */
    state: {
  stateCode: 'MD',

  stateName: 'Maryland',

  personalExemption: 3_200,

  standardDeductionRate: 0.15,

  standardDeductionMinimum: 1_850,

  standardDeductionMaximum: 2_800,

  bracketsSingle:
    MARYLAND_BRACKETS_SINGLE_2026,

  bracketsMarriedJointly:
    MARYLAND_BRACKETS_MARRIED_JOINTLY_2026,

  bracketsHeadOfHousehold:
    MARYLAND_BRACKETS_MARRIED_JOINTLY_2026,

  bracketsMarriedSeparately:
    MARYLAND_BRACKETS_SINGLE_2026,

  localTaxSupported: true,
},

    localTaxes: buildMarylandLocalTaxes2026(),

    payFrequency: {
      weekly: 52,
      biweekly: 26,
      semimonthly: 24,
      monthly: 12,
      quarterly: 4,
      annually: 1,
    },

    active: false,

    createdAt: now,

    updatedAt: now,
  };
}

/**
 * Exported seed configuration.
 *
 * Keeping this as a factory result makes it easy for an admin
 * initialization workflow to save it through the repository.
 */
export const TAX_PAY_CONFIGURATION_2026 = createTaxPayConfiguration2026();

/**
 * Exported separately so tests/admin tooling can inspect the
 * federal MFS schedule without changing the domain model.
 */
export const FEDERAL_BRACKETS_MARRIED_SEPARATELY_2026_EXPORT =
  FEDERAL_BRACKETS_MARRIED_SEPARATELY_2026;

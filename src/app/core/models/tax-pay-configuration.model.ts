// src/app/core/models/tax-pay-configuration.model.ts

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface FederalTaxConfiguration {
  standardDeductionSingle: number;
  standardDeductionMarriedJointly: number;
  standardDeductionHeadOfHousehold: number;

  bracketsSingle: TaxBracket[];
  bracketsMarriedJointly: TaxBracket[];
  bracketsHeadOfHousehold: TaxBracket[];

  childTaxCredit: number;
  additionalChildTaxCredit: number;
}

export interface FicaConfiguration {
  socialSecurityRate: number;
  socialSecurityWageBase: number;
  medicareRate: number;
  additionalMedicareRate: number;

  additionalMedicareThresholdSingle: number;
  additionalMedicareThresholdMarriedJointly: number;
}

export interface SelfEmploymentConfiguration {
  /**
   * Social Security portion of self-employment tax.
   * Example: 0.124 = 12.4%
   */
  selfEmploymentTaxRate: number;

  /**
   * Maximum earnings subject to the Social Security portion
   * of self-employment tax.
   */
  socialSecurityWageBase: number;

  /**
   * Percentage of net self-employment earnings subject to
   * self-employment tax.
   *
   * Standard calculation: 92.35% = 0.9235
   */
  taxableEarningsRate: number;

  /**
   * Deductible portion of self-employment tax.
   *
   * Standard calculation: 50% = 0.5
   */
  seTaxDeductionRate: number;
}

export interface StateTaxConfiguration {
  stateCode: string;
  stateName: string;

  personalExemption: number;

  standardDeductionRate: number;
  standardDeductionMinimum: number;
  standardDeductionMaximum: number;

  bracketsSingle: TaxBracket[];
  bracketsMarriedJointly: TaxBracket[];
  bracketsHeadOfHousehold: TaxBracket[];
  bracketsMarriedSeparately: TaxBracket[];

  localTaxSupported: boolean;
}

export interface LocalTaxConfiguration {
  stateCode: string;
  countyCode: string;
  countyName: string;
  rate: number;
}

export interface PayFrequencyConfiguration {
  weekly: number;
  biweekly: number;
  semimonthly: number;
  monthly: number;
  quarterly: number;
  annually: number;
}

export interface TaxPayConfiguration {
  id: string;
  taxYear: number;

  federal: FederalTaxConfiguration;
  fica: FicaConfiguration;
  selfEmployment: SelfEmploymentConfiguration;

  state: StateTaxConfiguration;
  localTaxes: LocalTaxConfiguration[];

  payFrequency: PayFrequencyConfiguration;

  active: boolean;

  createdAt: string;
  updatedAt: string;
}
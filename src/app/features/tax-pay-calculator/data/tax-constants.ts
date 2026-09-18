import { TaxProfile } from '../models/tax-calculator-input.model';

export const DEFAULT_TAX_YEAR = 2026;

export const DEFAULT_TAX_PROFILE: TaxProfile = {
  taxYear: DEFAULT_TAX_YEAR,
  filingStatus: 'single',
  state: 'MD',
  county: '',
  dependents: 0,
  additionalFederalWithholding: 0,
  additionalStateWithholding: 0,
};

export const PAY_PERIODS_PER_YEAR: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

export const WORK_WEEKS_PER_YEAR = 52;
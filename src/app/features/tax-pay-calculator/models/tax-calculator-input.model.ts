import {
  Deduction,
  FilingStatus,
  PayFrequency,
  W2PayType,
  WorkerType,
} from './tax-calculator-types.model';

export interface W2Income {
  payType: W2PayType;

  annualSalary: number;

  hourlyRate: number;

  regularHours: number;

  overtimeHours: number;

  bonus: number;

  commission: number;

  payFrequency: PayFrequency;
}

export interface ContractorExpense {
  id: string;

  name: string;

  amount: number;
}

export interface ContractorIncome {
  grossIncome: number;

  businessExpenses: ContractorExpense[];

  estimatedTaxPayments: number;
}

export interface TaxProfile {
  taxYear: number;

  filingStatus: FilingStatus;

  state: string;

  /**
   * Census county / county-equivalent FIPS.
   *
   * Example:
   * Maryland / Montgomery County = 24031
   */
  county: string;

  /**
   * Number of qualifying dependents.
   */
  dependents: number;

  /**
   * Whether the taxpayer is age 65 or older.
   */
  taxpayerAge65OrOlder?: boolean;

  /**
   * Whether the taxpayer is legally blind.
   */
  taxpayerBlind?: boolean;

  /**
   * Whether the spouse is age 65 or older.
   *
   * Relevant for married filing jointly.
   */
  spouseAge65OrOlder?: boolean;

  /**
   * Whether the spouse is legally blind.
   *
   * Relevant for married filing jointly.
   */
  spouseBlind?: boolean;

  additionalFederalWithholding: number;

  additionalStateWithholding: number;
}

export interface TaxCalculatorInput {
  workerType: WorkerType;

  taxProfile: TaxProfile;

  w2Income?: W2Income;

  contractorIncome?: ContractorIncome;

  preTaxDeductions: Deduction[];

  postTaxDeductions: Deduction[];
}
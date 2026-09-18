export interface TaxCalculatorResult {
  workerType: 'w2' | '1099' | 'mixed';

  grossIncome: number;

  businessExpenses: number;

  preTaxDeductions: number;

  taxableIncome: number;

  federalIncomeTax: number;

  socialSecurityTax: number;

  medicareTax: number;

  selfEmploymentTax: number;

  stateTax: number;

  localTax: number;

  additionalFederalWithholding: number;

  additionalStateWithholding: number;

  estimatedTaxPayments: number;

  postTaxDeductions: number;

  totalTaxes: number;

  totalDeductions: number;

  netIncome: number;

  effectiveTaxRate: number;

  annual: PayPeriodResult;

  monthly: PayPeriodResult;

  semimonthly: PayPeriodResult;

  biweekly: PayPeriodResult;

  weekly: PayPeriodResult;
}

export interface PayPeriodResult {
  grossIncome: number;
  taxes: number;
  deductions: number;
  netIncome: number;
}
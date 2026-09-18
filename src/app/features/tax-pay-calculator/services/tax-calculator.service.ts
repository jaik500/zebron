import { Injectable } from '@angular/core';

import {
  TaxCalculatorInput,
  ContractorIncome,
  W2Income,
} from '../models/tax-calculator-input.model';

import {
  PayPeriodResult,
  TaxCalculatorResult,
} from '../models/tax-calculator-result.model';

import {
  PAY_PERIODS_PER_YEAR,
  WORK_WEEKS_PER_YEAR,
} from '../data/tax-constants';

import {
  MARYLAND_LOCAL_TAX_RATES_2026,
} from '../data/maryland-local-tax-rates.data';

@Injectable({
  providedIn: 'root',
})
export class TaxCalculatorService {
  // ============================================================
  // 2026 FEDERAL TAX CONSTANTS
  // ============================================================

  private readonly FEDERAL_STANDARD_DEDUCTIONS = {
    single: 16_100,
    'married-filing-separately': 16_100,
    'married-filing-jointly': 32_200,
    'head-of-household': 24_150,
  } as const;

  /**
   * 2026 federal income-tax brackets.
   *
   * These are taxable-income brackets, not gross-income brackets.
   */
  private readonly FEDERAL_BRACKETS = {
    single: [
      { upTo: 12_400, rate: 0.10 },
      { upTo: 50_400, rate: 0.12 },
      { upTo: 105_700, rate: 0.22 },
      { upTo: 201_775, rate: 0.24 },
      { upTo: 256_225, rate: 0.32 },
      { upTo: 640_600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],

    'married-filing-separately': [
      { upTo: 12_400, rate: 0.10 },
      { upTo: 50_400, rate: 0.12 },
      { upTo: 105_700, rate: 0.22 },
      { upTo: 201_775, rate: 0.24 },
      { upTo: 256_225, rate: 0.32 },
      { upTo: 384_350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],

    'married-filing-jointly': [
      { upTo: 24_800, rate: 0.10 },
      { upTo: 100_800, rate: 0.12 },
      { upTo: 211_400, rate: 0.22 },
      { upTo: 403_550, rate: 0.24 },
      { upTo: 512_450, rate: 0.32 },
      { upTo: 768_700, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],

    'head-of-household': [
      { upTo: 17_700, rate: 0.10 },
      { upTo: 67_450, rate: 0.12 },
      { upTo: 105_700, rate: 0.22 },
      { upTo: 201_750, rate: 0.24 },
      { upTo: 256_200, rate: 0.32 },
      { upTo: 640_600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  } as const;

  // ============================================================
  // 2026 MARYLAND TAX CONSTANTS
  // ============================================================

  /**
   * Maryland 2026 standard deductions.
   */
  private readonly MARYLAND_STANDARD_DEDUCTIONS = {
    single: 3_350,
    'married-filing-separately': 3_350,
    'married-filing-jointly': 6_700,
    'head-of-household': 6_700,
  } as const;

  /**
   * Maryland personal exemption amount before phaseout.
   *
   * Maryland generally allows $3,200 per exemption.
   */
  private readonly MARYLAND_PERSONAL_EXEMPTION = 3_200;

  /**
   * Additional Maryland exemption for a taxpayer or spouse
   * who is age 65 or older and/or legally blind.
   */
  private readonly MARYLAND_ADDITIONAL_AGE_BLIND_EXEMPTION =
    1_000;

  // ============================================================
  // PAYROLL TAX CONSTANTS
  // ============================================================

  private readonly SOCIAL_SECURITY_RATE = 0.062;

  private readonly MEDICARE_RATE = 0.0145;

  private readonly ADDITIONAL_MEDICARE_RATE = 0.009;

  private readonly SOCIAL_SECURITY_WAGE_BASE = 184_500;

  /**
   * Employee Additional Medicare thresholds.
   */
  private readonly ADDITIONAL_MEDICARE_THRESHOLDS = {
    single: 200_000,
    'married-filing-separately': 125_000,
    'married-filing-jointly': 250_000,
    'head-of-household': 200_000,
  } as const;

  // ============================================================
  // PUBLIC CALCULATION
  // ============================================================

  calculate(
    input: TaxCalculatorInput,
  ): TaxCalculatorResult {
    const grossIncome =
      this.calculateGrossIncome(input);

    const w2Income =
      this.calculateW2GrossIncome(input);

    const contractorProfit =
      this.calculateContractorProfit(input);

    const businessExpenses =
      this.calculateBusinessExpenses(input);

    const preTaxDeductions =
      this.calculateDeductionTotal(
        input.preTaxDeductions,
      );

    const postTaxDeductions =
      this.calculateDeductionTotal(
        input.postTaxDeductions,
      );

    // ----------------------------------------------------------
    // SELF-EMPLOYMENT TAX
    // ----------------------------------------------------------

    const selfEmploymentTax =
      this.calculateSelfEmploymentTax(
        input,
        contractorProfit,
        w2Income,
      );

    // ----------------------------------------------------------
    // FEDERAL ADJUSTED INCOME
    // ----------------------------------------------------------

    /**
     * Federal adjusted income starts with gross income
     * after business expenses and pre-tax deductions.
     *
     * For self-employed income, one-half of self-employment
     * tax is deductible.
     */
    const federalAdjustedIncome =
      Math.max(
        grossIncome -
          businessExpenses -
          preTaxDeductions -
          this.calculateHalfSelfEmploymentTaxDeduction(
            selfEmploymentTax,
            input,
          ),
        0,
      );

    // ----------------------------------------------------------
    // FEDERAL STANDARD DEDUCTION
    // ----------------------------------------------------------

    const federalStandardDeduction =
      this.getFederalStandardDeduction(
        input.taxProfile.filingStatus,
      );

    // ----------------------------------------------------------
    // FEDERAL TAXABLE INCOME
    // ----------------------------------------------------------

    const taxableIncome =
      Math.max(
        federalAdjustedIncome -
          federalStandardDeduction,
        0,
      );

    // ----------------------------------------------------------
    // FEDERAL INCOME TAX
    // ----------------------------------------------------------

    const federalIncomeTax =
      this.calculateFederalIncomeTax(
        taxableIncome,
        input,
      );

    // ----------------------------------------------------------
    // W-2 PAYROLL TAXES
    // ----------------------------------------------------------

    const socialSecurityTax =
      this.calculateSocialSecurityTax(
        input,
        w2Income,
      );

    const medicareTax =
      this.calculateMedicareTax(
        input,
        w2Income,
      );

    // ----------------------------------------------------------
    // MARYLAND TAXABLE INCOME
    // ----------------------------------------------------------

    /**
     * Maryland uses its own standard deduction and personal
     * exemption rules.
     *
     * Therefore Maryland taxable income is calculated
     * separately from federal taxable income.
     */
    const marylandTaxableIncome =
      this.calculateMarylandTaxableIncome(
        federalAdjustedIncome,
        input,
      );

    // ----------------------------------------------------------
    // MARYLAND STATE TAX
    // ----------------------------------------------------------

    const stateTax =
      this.calculateStateTax(
        marylandTaxableIncome,
        input,
      );

    // ----------------------------------------------------------
    // MARYLAND LOCAL TAX
    // ----------------------------------------------------------

    const localTax =
      this.calculateLocalTax(
        marylandTaxableIncome,
        input.taxProfile.county,
        input,
      );

    // ----------------------------------------------------------
    // ADDITIONAL WITHHOLDING
    // ----------------------------------------------------------

    const additionalFederalWithholding =
      this.nonNegative(
        input.taxProfile.additionalFederalWithholding,
      );

    const additionalStateWithholding =
      this.nonNegative(
        input.taxProfile.additionalStateWithholding,
      );

    // ----------------------------------------------------------
    // ESTIMATED 1099 TAX PAYMENTS
    // ----------------------------------------------------------

    const estimatedTaxPayments =
      this.nonNegative(
        input.contractorIncome?.estimatedTaxPayments ?? 0,
      );

    // ----------------------------------------------------------
    // TOTAL TAXES
    // ----------------------------------------------------------

    const totalTaxes =
      federalIncomeTax +
      socialSecurityTax +
      medicareTax +
      selfEmploymentTax +
      stateTax +
      localTax +
      additionalFederalWithholding +
      additionalStateWithholding;

    // ----------------------------------------------------------
    // TOTAL DEDUCTIONS
    // ----------------------------------------------------------

    const totalDeductions =
      preTaxDeductions +
      postTaxDeductions;

    // ----------------------------------------------------------
    // NET ANNUAL INCOME
    // ----------------------------------------------------------

    /**
     * Estimated tax payments are treated as payments already
     * made toward the user's tax obligation and therefore are
     * added back when estimating remaining take-home cash flow.
     */
    const netIncome =
      Math.max(
        grossIncome -
          businessExpenses -
          totalTaxes -
          totalDeductions +
          estimatedTaxPayments,
        0,
      );

    // ----------------------------------------------------------
    // EFFECTIVE TAX RATE
    // ----------------------------------------------------------

    const effectiveTaxRate =
      grossIncome > 0
        ? totalTaxes / grossIncome
        : 0;

    // ----------------------------------------------------------
    // RETURN
    // ----------------------------------------------------------

    return {
      workerType: input.workerType,

      grossIncome,

      businessExpenses,

      preTaxDeductions,

      taxableIncome,

      federalIncomeTax,

      socialSecurityTax,

      medicareTax,

      selfEmploymentTax,

      stateTax,

      localTax,

      additionalFederalWithholding,

      additionalStateWithholding,

      estimatedTaxPayments,

      postTaxDeductions,

      totalTaxes,

      totalDeductions,

      netIncome,

      effectiveTaxRate,

      annual: this.buildPeriodResult(
        grossIncome,
        totalTaxes,
        totalDeductions,
        netIncome,
        1,
      ),

      monthly: this.buildPeriodResult(
        grossIncome,
        totalTaxes,
        totalDeductions,
        netIncome,
        PAY_PERIODS_PER_YEAR['monthly'],
      ),

      semimonthly: this.buildPeriodResult(
        grossIncome,
        totalTaxes,
        totalDeductions,
        netIncome,
        PAY_PERIODS_PER_YEAR['semimonthly'],
      ),

      biweekly: this.buildPeriodResult(
        grossIncome,
        totalTaxes,
        totalDeductions,
        netIncome,
        PAY_PERIODS_PER_YEAR['biweekly'],
      ),

      weekly: this.buildPeriodResult(
        grossIncome,
        totalTaxes,
        totalDeductions,
        netIncome,
        PAY_PERIODS_PER_YEAR['weekly'],
      ),
    };
  }

  // ============================================================
  // GROSS INCOME
  // ============================================================

  private calculateGrossIncome(
    input: TaxCalculatorInput,
  ): number {
    let total = 0;

    // ----------------------------------------------------------
    // W-2
    // ----------------------------------------------------------

    if (
      input.workerType === 'w2' ||
      input.workerType === 'mixed'
    ) {
      if (input.w2Income) {
        total += this.calculateW2Income(
          input.w2Income,
        );
      }
    }

    // ----------------------------------------------------------
    // 1099
    // ----------------------------------------------------------

    if (
      input.workerType === '1099' ||
      input.workerType === 'mixed'
    ) {
      total += this.nonNegative(
        input.contractorIncome?.grossIncome ?? 0,
      );
    }

    return Math.max(total, 0);
  }

  // ============================================================
  // W-2 INCOME
  // ============================================================

  private calculateW2Income(
    income: W2Income,
  ): number {
    // ----------------------------------------------------------
    // SALARY
    // ----------------------------------------------------------

    if (income.payType === 'salary') {
      return (
        this.nonNegative(income.annualSalary) +
        this.nonNegative(income.bonus) +
        this.nonNegative(income.commission)
      );
    }

    // ----------------------------------------------------------
    // HOURLY
    // ----------------------------------------------------------

    /**
     * Hourly wages are annualized using the standard
     * 52-work-week assumption.
     *
     * Example:
     *
     * $62 × 40 hours × 52 weeks
     * = $128,960
     *
     * Overtime is calculated at 1.5× the regular hourly rate.
     */

    const hourlyRate =
      this.nonNegative(income.hourlyRate);

    const regularHours =
      this.nonNegative(income.regularHours);

    const overtimeHours =
      this.nonNegative(income.overtimeHours);

    const regularPay =
      hourlyRate *
      regularHours *
      WORK_WEEKS_PER_YEAR;

    const overtimePay =
      hourlyRate *
      1.5 *
      overtimeHours *
      WORK_WEEKS_PER_YEAR;

    const bonus =
      this.nonNegative(income.bonus);

    const commission =
      this.nonNegative(income.commission);

    return (
      regularPay +
      overtimePay +
      bonus +
      commission
    );
  }

  // ============================================================
  // W-2 GROSS ONLY
  //
  // Used for FICA.
  //
  // Contractor income must NOT be treated as W-2 wages.
  // ============================================================

  private calculateW2GrossIncome(
    input: TaxCalculatorInput,
  ): number {
    if (
      input.workerType !== 'w2' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    return input.w2Income
      ? this.calculateW2Income(input.w2Income)
      : 0;
  }

  // ============================================================
  // CONTRACTOR PROFIT
  // ============================================================

  private calculateContractorProfit(
    input: TaxCalculatorInput,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    const gross =
      this.nonNegative(
        input.contractorIncome?.grossIncome ?? 0,
      );

    const expenses =
      this.calculateBusinessExpenses(input);

    return Math.max(
      gross - expenses,
      0,
    );
  }

  // ============================================================
  // BUSINESS EXPENSES
  // ============================================================

  private calculateBusinessExpenses(
    input: TaxCalculatorInput,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    const expenses =
      input.contractorIncome?.businessExpenses ?? [];

    return expenses.reduce(
      (total, expense) =>
        total +
        this.nonNegative(expense.amount),
      0,
    );
  }

  // ============================================================
  // DEDUCTIONS
  // ============================================================

  private calculateDeductionTotal(
    deductions:
      TaxCalculatorInput['preTaxDeductions'],
  ): number {
    return deductions.reduce(
      (total, deduction) =>
        total +
        this.nonNegative(deduction.amount),
      0,
    );
  }

  // ============================================================
  // FEDERAL STANDARD DEDUCTION
  // ============================================================

  private getFederalStandardDeduction(
    filingStatus:
      TaxCalculatorInput['taxProfile']['filingStatus'],
  ): number {
    return (
      this.FEDERAL_STANDARD_DEDUCTIONS[
        filingStatus
      ] ??
      this.FEDERAL_STANDARD_DEDUCTIONS.single
    );
  }

  // ============================================================
  // FEDERAL INCOME TAX
  // ============================================================

  private calculateFederalIncomeTax(
    taxableIncome: number,
    input: TaxCalculatorInput,
  ): number {
    if (taxableIncome <= 0) {
      return 0;
    }

    const filingStatus =
      input.taxProfile.filingStatus;

    const brackets =
      this.FEDERAL_BRACKETS[
        filingStatus
      ] ??
      this.FEDERAL_BRACKETS.single;

    let remainingIncome =
      taxableIncome;

    let previousLimit = 0;

    let tax = 0;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) {
        break;
      }

      const bracketWidth =
        bracket.upTo === Infinity
          ? remainingIncome
          : Math.min(
              taxableIncome,
              bracket.upTo,
            ) - previousLimit;

      const amountInBracket =
        Math.max(
          Math.min(
            remainingIncome,
            bracketWidth,
          ),
          0,
        );

      tax +=
        amountInBracket *
        bracket.rate;

      remainingIncome -=
        amountInBracket;

      previousLimit =
        bracket.upTo;
    }

    return Math.max(tax, 0);
  }

  // ============================================================
  // SOCIAL SECURITY
  // ============================================================

  private calculateSocialSecurityTax(
    input: TaxCalculatorInput,
    w2Income: number,
  ): number {
    if (
      input.workerType === '1099'
    ) {
      return 0;
    }

    const taxableWages =
      Math.min(
        Math.max(w2Income, 0),
        this.SOCIAL_SECURITY_WAGE_BASE,
      );

    return (
      taxableWages *
      this.SOCIAL_SECURITY_RATE
    );
  }

  // ============================================================
  // MEDICARE
  // ============================================================

  private calculateMedicareTax(
    input: TaxCalculatorInput,
    w2Income: number,
  ): number {
    if (
      input.workerType === '1099'
    ) {
      return 0;
    }

    const wages =
      this.nonNegative(w2Income);

    const regularMedicare =
      wages *
      this.MEDICARE_RATE;

    const filingStatus =
      input.taxProfile.filingStatus;

    const threshold =
      this.ADDITIONAL_MEDICARE_THRESHOLDS[
        filingStatus
      ] ??
      this.ADDITIONAL_MEDICARE_THRESHOLDS.single;

    const additionalMedicare =
      Math.max(
        wages - threshold,
        0,
      ) *
      this.ADDITIONAL_MEDICARE_RATE;

    return (
      regularMedicare +
      additionalMedicare
    );
  }

  // ============================================================
  // SELF-EMPLOYMENT TAX
  // ============================================================

  private calculateSelfEmploymentTax(
    input: TaxCalculatorInput,
    contractorProfit: number,
    w2Income: number,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    if (contractorProfit <= 0) {
      return 0;
    }

    /**
     * Net earnings from self-employment are generally
     * 92.35% of net self-employment profit for this
     * calculation.
     */
    const netEarnings =
      contractorProfit *
      0.9235;

    // ----------------------------------------------------------
    // SOCIAL SECURITY PORTION
    // ----------------------------------------------------------

    /**
     * W-2 wages consume the Social Security wage base first.
     * The remaining wage base is available for self-employment
     * income.
     */
    const remainingSocialSecurityBase =
      Math.max(
        this.SOCIAL_SECURITY_WAGE_BASE -
          this.nonNegative(w2Income),
        0,
      );

    const socialSecurityBase =
      Math.min(
        netEarnings,
        remainingSocialSecurityBase,
      );

    const socialSecurity =
      socialSecurityBase *
      this.SOCIAL_SECURITY_RATE;

    // ----------------------------------------------------------
    // MEDICARE PORTION
    // ----------------------------------------------------------

    const medicare =
      netEarnings *
      this.MEDICARE_RATE;

    // ----------------------------------------------------------
    // ADDITIONAL MEDICARE
    // ----------------------------------------------------------

    const filingStatus =
      input.taxProfile.filingStatus;

    const threshold =
      this.ADDITIONAL_MEDICARE_THRESHOLDS[
        filingStatus
      ] ??
      this.ADDITIONAL_MEDICARE_THRESHOLDS.single;

    const combinedMedicareIncome =
      this.nonNegative(w2Income) +
      netEarnings;

    const additionalMedicare =
      Math.max(
        combinedMedicareIncome -
          threshold,
        0,
      ) *
      this.ADDITIONAL_MEDICARE_RATE;

    return (
      socialSecurity +
      medicare +
      additionalMedicare
    );
  }

  // ============================================================
  // HALF SELF-EMPLOYMENT TAX DEDUCTION
  // ============================================================

  private calculateHalfSelfEmploymentTaxDeduction(
    selfEmploymentTax: number,
    input: TaxCalculatorInput,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    return selfEmploymentTax / 2;
  }

  // ============================================================
  // MARYLAND TAXABLE INCOME
  // ============================================================

  private calculateMarylandTaxableIncome(
    federalAdjustedIncome: number,
    input: TaxCalculatorInput,
  ): number {
    if (
      input.taxProfile.state !== 'MD' ||
      federalAdjustedIncome <= 0
    ) {
      return 0;
    }

    const filingStatus =
      input.taxProfile.filingStatus;

    const standardDeduction =
      this.MARYLAND_STANDARD_DEDUCTIONS[
        filingStatus
      ] ??
      this.MARYLAND_STANDARD_DEDUCTIONS.single;

    const personalExemption =
      this.calculateMarylandPersonalExemption(
        federalAdjustedIncome,
        input,
      );

    return Math.max(
      federalAdjustedIncome -
        standardDeduction -
        personalExemption,
      0,
    );
  }

  // ============================================================
  // MARYLAND PERSONAL EXEMPTION
  // ============================================================

  private calculateMarylandPersonalExemption(
    federalAdjustedIncome: number,
    input: TaxCalculatorInput,
  ): number {
    if (
      input.taxProfile.state !== 'MD' ||
      federalAdjustedIncome <= 0
    ) {
      return 0;
    }

    const filingStatus =
      input.taxProfile.filingStatus;

    /**
     * Maryland uses the same exemption phaseout thresholds
     * for Joint, Head of Household, and Qualifying Surviving
     * Spouse returns.
     */
    const jointLike =
      filingStatus ===
        'married-filing-jointly' ||
      filingStatus ===
        'head-of-household';

    let exemptionAmount = 0;

    // ----------------------------------------------------------
    // SINGLE / MFS
    // ----------------------------------------------------------

    if (!jointLike) {
      if (
        federalAdjustedIncome <=
        100_000
      ) {
        exemptionAmount = 3_200;
      } else if (
        federalAdjustedIncome <=
        125_000
      ) {
        exemptionAmount = 1_600;
      } else if (
        federalAdjustedIncome <=
        150_000
      ) {
        exemptionAmount = 800;
      } else {
        exemptionAmount = 0;
      }
    }

    // ----------------------------------------------------------
    // JOINT / HOH
    // ----------------------------------------------------------

    else {
      if (
        federalAdjustedIncome <=
        150_000
      ) {
        exemptionAmount = 3_200;
      } else if (
        federalAdjustedIncome <=
        175_000
      ) {
        exemptionAmount = 1_600;
      } else if (
        federalAdjustedIncome <=
        200_000
      ) {
        exemptionAmount = 800;
      } else {
        exemptionAmount = 0;
      }
    }

    // ----------------------------------------------------------
    // TAXPAYER / SPOUSE AGE 65+ OR BLIND
    // ----------------------------------------------------------

    let totalExemption =
      exemptionAmount;

    if (
      input.taxProfile
        .taxpayerAge65OrOlder ||
      input.taxProfile.taxpayerBlind
    ) {
      totalExemption +=
        this.MARYLAND_ADDITIONAL_AGE_BLIND_EXEMPTION;
    }

    if (
      filingStatus ===
        'married-filing-jointly' &&
      (
        input.taxProfile
          .spouseAge65OrOlder ||
        input.taxProfile.spouseBlind
      )
    ) {
      totalExemption +=
        this.MARYLAND_ADDITIONAL_AGE_BLIND_EXEMPTION;
    }

    // ----------------------------------------------------------
    // DEPENDENTS
    // ----------------------------------------------------------

    /**
     * Each qualifying dependent receives the applicable
     * Maryland personal exemption amount.
     *
     * The current UI stores only the number of dependents,
     * not whether an individual dependent is age 65+.
     *
     * Therefore the additional dependent age-65 exemption
     * cannot yet be calculated per dependent.
     */
    const dependents =
      Math.max(
        Number(
          input.taxProfile.dependents ?? 0,
        ) || 0,
        0,
      );

    if (dependents > 0) {
      totalExemption +=
        exemptionAmount *
        Math.floor(dependents);
    }

    return Math.max(
      totalExemption,
      0,
    );
  }

  // ============================================================
  // MARYLAND STATE TAX
  // ============================================================

  private calculateStateTax(
    taxableIncome: number,
    input: TaxCalculatorInput,
  ): number {
    if (
      input.taxProfile.state !== 'MD' ||
      taxableIncome <= 0
    ) {
      return 0;
    }

    /**
     * Maryland 2026 graduated state income-tax rates.
     *
     * Single / Married Filing Separately:
     *
     * 2%      through $1,000
     * 3%      $1,001 - $2,000
     * 4%      $2,001 - $3,000
     * 4.75%   $3,001 - $100,000
     * 5.00%   $100,001 - $125,000
     * 5.25%   $125,001 - $150,000
     * 5.50%   $150,001 - $250,000
     * 5.75%   $250,001 - $500,000
     * 6.25%   $500,001 - $1,000,000
     * 6.50%   over $1,000,000
     *
     * Married Filing Jointly / Head of Household:
     *
     * 2%      through $1,000
     * 3%      $1,001 - $2,000
     * 4%      $2,001 - $3,000
     * 4.75%   $3,001 - $150,000
     * 5.00%   $150,001 - $175,000
     * 5.25%   $175,001 - $225,000
     * 5.50%   $225,001 - $300,000
     * 5.75%   $300,001 - $600,000
     * 6.25%   $600,001 - $1,200,000
     * 6.50%   over $1,200,000
     */

    const filingStatus =
      input.taxProfile.filingStatus;

    const singleLike =
      filingStatus === 'single' ||
      filingStatus ===
        'married-filing-separately';

    if (singleLike) {
      return this.calculateMarylandTax(
        taxableIncome,
        [
          {
            upTo: 1_000,
            rate: 0.02,
          },
          {
            upTo: 2_000,
            rate: 0.03,
          },
          {
            upTo: 3_000,
            rate: 0.04,
          },
          {
            upTo: 100_000,
            rate: 0.0475,
          },
          {
            upTo: 125_000,
            rate: 0.05,
          },
          {
            upTo: 150_000,
            rate: 0.0525,
          },
          {
            upTo: 250_000,
            rate: 0.055,
          },
          {
            upTo: 500_000,
            rate: 0.0575,
          },
          {
            upTo: 1_000_000,
            rate: 0.0625,
          },
          {
            upTo: Infinity,
            rate: 0.065,
          },
        ],
      );
    }

    return this.calculateMarylandTax(
      taxableIncome,
      [
        {
          upTo: 1_000,
          rate: 0.02,
        },
        {
          upTo: 2_000,
          rate: 0.03,
        },
        {
          upTo: 3_000,
          rate: 0.04,
        },
        {
          upTo: 150_000,
          rate: 0.0475,
        },
        {
          upTo: 175_000,
          rate: 0.05,
        },
        {
          upTo: 225_000,
          rate: 0.0525,
        },
        {
          upTo: 300_000,
          rate: 0.055,
        },
        {
          upTo: 600_000,
          rate: 0.0575,
        },
        {
          upTo: 1_200_000,
          rate: 0.0625,
        },
        {
          upTo: Infinity,
          rate: 0.065,
        },
      ],
    );
  }

  // ============================================================
  // MARYLAND STATE BRACKET CALCULATION
  // ============================================================

  private calculateMarylandTax(
    taxableIncome: number,
    brackets: ReadonlyArray<{
      upTo: number;
      rate: number;
    }>,
  ): number {
    let tax = 0;

    let previousLimit = 0;

    for (const bracket of brackets) {
      if (
        taxableIncome <=
        previousLimit
      ) {
        break;
      }

      const upperLimit =
        Math.min(
          taxableIncome,
          bracket.upTo,
        );

      const amount =
        Math.max(
          upperLimit -
            previousLimit,
          0,
        );

      tax +=
        amount *
        bracket.rate;

      previousLimit =
        bracket.upTo;

      if (
        bracket.upTo ===
        Infinity
      ) {
        break;
      }
    }

    return Math.max(
      tax,
      0,
    );
  }

  // ============================================================
  // LOCAL TAX
  // ============================================================

  private calculateLocalTax(
    taxableIncome: number,
    county: string,
    input: TaxCalculatorInput,
  ): number {
    if (
      !county ||
      taxableIncome <= 0 ||
      input.taxProfile.state !== 'MD'
    ) {
      return 0;
    }

    // ----------------------------------------------------------
    // NORMALIZE MARYLAND COUNTY IDENTIFIER
    // ----------------------------------------------------------

    /**
     * The UI may provide a Maryland county as:
     *
     * 24033
     * 033
     * md-033
     *
     * The local-tax data uses:
     *
     * md-033
     *
     * Example:
     *
     * 24033 = Prince George's County
     *       -> md-033
     */

    const rawCounty =
      county
        .trim()
        .toLowerCase();

    let countyKey =
      rawCounty;

    // Five-digit Maryland FIPS
    if (
      /^\d{5}$/.test(
        rawCounty,
      )
    ) {
      const stateFips =
        rawCounty.substring(
          0,
          2,
        );

      const countyFips =
        rawCounty.substring(
          2,
        );

      if (
        stateFips === '24'
      ) {
        countyKey =
          `md-${countyFips}`;
      }
    }

    // Three-digit county FIPS
    else if (
      /^\d{3}$/.test(
        rawCounty,
      )
    ) {
      countyKey =
        `md-${rawCounty}`;
    }

    // Already normalized
    else if (
      /^md-\d{3}$/.test(
        rawCounty,
      )
    ) {
      countyKey =
        rawCounty;
    }

    // ----------------------------------------------------------
    // FIND LOCAL TAX RULE
    // ----------------------------------------------------------

    const rule =
      MARYLAND_LOCAL_TAX_RATES_2026[
        countyKey
      ];

    if (!rule) {
      return 0;
    }

    const brackets =
      rule.brackets;

    // ----------------------------------------------------------
    // CALCULATE LOCAL TAX
    // ----------------------------------------------------------

    return this.calculateMarylandLocalTax(
      taxableIncome,
      brackets,
    );
  }

  // ============================================================
  // MARYLAND LOCAL TAX BRACKET CALCULATION
  // ============================================================

  private calculateMarylandLocalTax(
    taxableIncome: number,
    brackets: ReadonlyArray<{
      upTo: number;
      rate: number;
    }>,
  ): number {
    let tax = 0;

    let previousLimit = 0;

    for (const bracket of brackets) {
      if (
        taxableIncome <=
        previousLimit
      ) {
        break;
      }

      const upperLimit =
        Math.min(
          taxableIncome,
          bracket.upTo,
        );

      const amount =
        Math.max(
          upperLimit -
            previousLimit,
          0,
        );

      tax +=
        amount *
        bracket.rate;

      previousLimit =
        bracket.upTo;

      if (
        bracket.upTo ===
        Infinity
      ) {
        break;
      }
    }

    return Math.max(
      tax,
      0,
    );
  }

  // ============================================================
  // PAY PERIOD RESULTS
  // ============================================================

  private buildPeriodResult(
    annualGross: number,
    annualTaxes: number,
    annualDeductions: number,
    annualNet: number,
    periodsPerYear: number,
  ): PayPeriodResult {
    return {
      grossIncome:
        annualGross /
        periodsPerYear,

      taxes:
        annualTaxes /
        periodsPerYear,

      deductions:
        annualDeductions /
        periodsPerYear,

      netIncome:
        annualNet /
        periodsPerYear,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private nonNegative(
    value: number | null | undefined,
  ): number {
    return Math.max(
      Number(value) || 0,
      0,
    );
  }
}
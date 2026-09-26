import { Injectable, inject } from '@angular/core';

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
  WORK_WEEKS_PER_YEAR,
} from '../data/tax-constants';

import {
  TaxPayConfiguration,
  TaxBracket,
} from '../../../core/models/tax-pay-configuration.model';

import { TaxCalculatorConfigurationService } from './tax-calculator-configuration.service';

@Injectable({
  providedIn: 'root',
})
export class TaxCalculatorService {
  private readonly configurationService =
    inject(TaxCalculatorConfigurationService);

  private configuration: TaxPayConfiguration | null =
    null;

  /**
   * Load the configuration used by the calculator.
   *
   * The public calculator component should call this during
   * initialization before allowing calculations.
   */
  setConfiguration(
    configuration: TaxPayConfiguration,
  ): void {
    this.configuration =
      structuredClone(configuration);
  }

  /**
   * Load the active configuration directly.
   *
   * This is provided for callers that want the calculator
   * service itself to initialize its configuration.
   */
async loadConfiguration(): Promise<void> {
  const configuration =
    await this.configurationService.getActive();

  if (!configuration) {
    throw new Error(
      'No active tax configuration is available.',
    );
  }

  this.setConfiguration(configuration);
}

  /**
   * Returns the configuration currently used by the calculator.
   */
  getConfiguration(): TaxPayConfiguration | null {
    return this.configuration;
  }

  /**
   * Perform the calculation.
   */
  calculate(
    input: TaxCalculatorInput,
  ): TaxCalculatorResult {
    const configuration =
      this.requireConfiguration();

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
        configuration,
      );

    // ----------------------------------------------------------
    // FEDERAL ADJUSTED INCOME
    // ----------------------------------------------------------

    const federalAdjustedIncome =
      Math.max(
        grossIncome -
          businessExpenses -
          preTaxDeductions -
          this.calculateHalfSelfEmploymentTaxDeduction(
            selfEmploymentTax,
            input,
            configuration,
          ),
        0,
      );

    // ----------------------------------------------------------
    // FEDERAL STANDARD DEDUCTION
    // ----------------------------------------------------------

    const federalStandardDeduction =
      this.getFederalStandardDeduction(
        input.taxProfile.filingStatus,
        configuration,
      );

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
        configuration,
      );

    // ----------------------------------------------------------
    // W-2 PAYROLL TAXES
    // ----------------------------------------------------------

    const socialSecurityTax =
      this.calculateSocialSecurityTax(
        input,
        w2Income,
        configuration,
      );

    const medicareTax =
      this.calculateMedicareTax(
        input,
        w2Income,
        configuration,
      );

    // ----------------------------------------------------------
    // STATE TAXABLE INCOME
    // ----------------------------------------------------------

    const stateTaxableIncome =
      this.calculateStateTaxableIncome(
        federalAdjustedIncome,
        input,
        configuration,
      );

    // ----------------------------------------------------------
    // STATE TAX
    // ----------------------------------------------------------

    const stateTax =
      this.calculateStateTax(
        stateTaxableIncome,
        input,
        configuration,
      );

    // ----------------------------------------------------------
    // LOCAL TAX
    // ----------------------------------------------------------

    const localTax =
      this.calculateLocalTax(
        stateTaxableIncome,
        input,
        configuration,
      );

    // ----------------------------------------------------------
    // ADDITIONAL WITHHOLDING
    // ----------------------------------------------------------

    const additionalFederalWithholding =
      this.nonNegative(
        input.taxProfile
          .additionalFederalWithholding,
      );

    const additionalStateWithholding =
      this.nonNegative(
        input.taxProfile
          .additionalStateWithholding,
      );

    // ----------------------------------------------------------
    // ESTIMATED 1099 TAX PAYMENTS
    // ----------------------------------------------------------

    const estimatedTaxPayments =
      this.nonNegative(
        input.contractorIncome
          ?.estimatedTaxPayments ?? 0,
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

    const netIncome =
      Math.max(
        grossIncome -
          businessExpenses -
          totalTaxes -
          totalDeductions +
          estimatedTaxPayments,
        0,
      );

    const effectiveTaxRate =
      grossIncome > 0
        ? totalTaxes / grossIncome
        : 0;

    // ----------------------------------------------------------
    // PAY FREQUENCY
    // ----------------------------------------------------------

    const payFrequency =
      configuration.payFrequency;

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

      annual:
        this.buildPeriodResult(
          grossIncome,
          totalTaxes,
          totalDeductions,
          netIncome,
          payFrequency.annually,
        ),

      monthly:
        this.buildPeriodResult(
          grossIncome,
          totalTaxes,
          totalDeductions,
          netIncome,
          payFrequency.monthly,
        ),

      semimonthly:
        this.buildPeriodResult(
          grossIncome,
          totalTaxes,
          totalDeductions,
          netIncome,
          payFrequency.semimonthly,
        ),

      biweekly:
        this.buildPeriodResult(
          grossIncome,
          totalTaxes,
          totalDeductions,
          netIncome,
          payFrequency.biweekly,
        ),

      weekly:
        this.buildPeriodResult(
          grossIncome,
          totalTaxes,
          totalDeductions,
          netIncome,
          payFrequency.weekly,
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

    if (
      input.workerType === '1099' ||
      input.workerType === 'mixed'
    ) {
      total += this.nonNegative(
        input.contractorIncome
          ?.grossIncome ?? 0,
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
    if (income.payType === 'salary') {
      return (
        this.nonNegative(
          income.annualSalary,
        ) +
        this.nonNegative(
          income.bonus,
        ) +
        this.nonNegative(
          income.commission,
        )
      );
    }

    const hourlyRate =
      this.nonNegative(
        income.hourlyRate,
      );

    const regularHours =
      this.nonNegative(
        income.regularHours,
      );

    const overtimeHours =
      this.nonNegative(
        income.overtimeHours,
      );

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
      this.nonNegative(
        income.bonus,
      );

    const commission =
      this.nonNegative(
        income.commission,
      );

    return (
      regularPay +
      overtimePay +
      bonus +
      commission
    );
  }

  // ============================================================
  // W-2 GROSS ONLY
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
      ? this.calculateW2Income(
          input.w2Income,
        )
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
        input.contractorIncome
          ?.grossIncome ?? 0,
      );

    const expenses =
      this.calculateBusinessExpenses(
        input,
      );

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
      input.contractorIncome
        ?.businessExpenses ?? [];

    return expenses.reduce(
      (total, expense) =>
        total +
        this.nonNegative(
          expense.amount,
        ),
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
        this.nonNegative(
          deduction.amount,
        ),
      0,
    );
  }

  // ============================================================
  // FEDERAL STANDARD DEDUCTION
  // ============================================================

  private getFederalStandardDeduction(
    filingStatus:
      TaxCalculatorInput['taxProfile']['filingStatus'],
    configuration:
      TaxPayConfiguration,
  ): number {
    switch (filingStatus) {
      case 'married-filing-jointly':
        return configuration.federal
          .standardDeductionMarriedJointly;

      case 'head-of-household':
        return configuration.federal
          .standardDeductionHeadOfHousehold;

      case 'married-filing-separately':
      case 'single':
      default:
        return configuration.federal
          .standardDeductionSingle;
    }
  }

  // ============================================================
  // FEDERAL INCOME TAX
  // ============================================================

  private calculateFederalIncomeTax(
    taxableIncome: number,
    input: TaxCalculatorInput,
    configuration:
      TaxPayConfiguration,
  ): number {
    if (taxableIncome <= 0) {
      return 0;
    }

    const filingStatus =
      input.taxProfile.filingStatus;

    let brackets:
      TaxBracket[];

    switch (filingStatus) {
      case 'married-filing-jointly':
        brackets =
          configuration.federal
            .bracketsMarriedJointly;
        break;

      case 'head-of-household':
        brackets =
          configuration.federal
            .bracketsHeadOfHousehold;
        break;

      case 'married-filing-separately':
      case 'single':
      default:
        brackets =
          configuration.federal
            .bracketsSingle;
        break;
    }

    return this.calculateProgressiveTax(
      taxableIncome,
      brackets,
    );
  }

  // ============================================================
  // PROGRESSIVE TAX
  // ============================================================

  private calculateProgressiveTax(
    taxableIncome: number,
    brackets: ReadonlyArray<TaxBracket>,
  ): number {
    if (
      taxableIncome <= 0 ||
      brackets.length === 0
    ) {
      return 0;
    }

    let tax = 0;

    for (const bracket of brackets) {
      const min =
        this.nonNegative(
          bracket.min,
        );

      const max =
        bracket.max === null
          ? Infinity
          : Math.max(
              bracket.max,
              min,
            );

      if (taxableIncome <= min) {
        continue;
      }

      const upper =
        Math.min(
          taxableIncome,
          max,
        );

      const amount =
        Math.max(
          upper - min,
          0,
        );

      tax +=
        amount *
        this.normalizeRate(
          bracket.rate,
        );

      if (
        max !== Infinity &&
        taxableIncome <= max
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
  // SOCIAL SECURITY
  // ============================================================

  private calculateSocialSecurityTax(
    input: TaxCalculatorInput,
    w2Income: number,
    configuration:
      TaxPayConfiguration,
  ): number {
    if (
      input.workerType === '1099'
    ) {
      return 0;
    }

    const taxableWages =
      Math.min(
        Math.max(
          w2Income,
          0,
        ),
        configuration.fica
          .socialSecurityWageBase,
      );

    return (
      taxableWages *
      this.normalizeRate(
        configuration.fica
          .socialSecurityRate,
      )
    );
  }

  // ============================================================
  // MEDICARE
  // ============================================================

  private calculateMedicareTax(
    input: TaxCalculatorInput,
    w2Income: number,
    configuration:
      TaxPayConfiguration,
  ): number {
    if (
      input.workerType === '1099'
    ) {
      return 0;
    }

    const wages =
      this.nonNegative(
        w2Income,
      );

    const regularMedicare =
      wages *
      this.normalizeRate(
        configuration.fica
          .medicareRate,
      );

    const filingStatus =
      input.taxProfile.filingStatus;

    const threshold =
      filingStatus ===
        'married-filing-jointly'
        ? configuration.fica
            .additionalMedicareThresholdMarriedJointly
        : configuration.fica
            .additionalMedicareThresholdSingle;

    const additionalMedicare =
      Math.max(
        wages - threshold,
        0,
      ) *
      this.normalizeRate(
        configuration.fica
          .additionalMedicareRate,
      );

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
    configuration:
      TaxPayConfiguration,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    if (
      contractorProfit <= 0
    ) {
      return 0;
    }

   const netEarnings =
  contractorProfit *
  this.normalizeRate(
    configuration.selfEmployment.taxableEarningsRate,
  );

    const remainingSocialSecurityBase =
      Math.max(
        configuration
          .selfEmployment
          .socialSecurityWageBase -
          this.nonNegative(
            w2Income,
          ),
        0,
      );

    const socialSecurityBase =
      Math.min(
        netEarnings,
        remainingSocialSecurityBase,
      );

    const socialSecurity =
      socialSecurityBase *
      this.normalizeRate(
        configuration
          .selfEmployment
          .selfEmploymentTaxRate,
      );

    const medicare =
      netEarnings *
      this.normalizeRate(
        configuration.fica
          .medicareRate,
      );

    const filingStatus =
      input.taxProfile.filingStatus;

    const threshold =
      filingStatus ===
        'married-filing-jointly'
        ? configuration.fica
            .additionalMedicareThresholdMarriedJointly
        : configuration.fica
            .additionalMedicareThresholdSingle;

    const combinedMedicareIncome =
      this.nonNegative(
        w2Income,
      ) +
      netEarnings;

    const additionalMedicare =
      Math.max(
        combinedMedicareIncome -
          threshold,
        0,
      ) *
      this.normalizeRate(
        configuration.fica
          .additionalMedicareRate,
      );

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
    configuration:
      TaxPayConfiguration,
  ): number {
    if (
      input.workerType !== '1099' &&
      input.workerType !== 'mixed'
    ) {
      return 0;
    }

    return (
      selfEmploymentTax *
      this.normalizeRate(
        configuration
          .selfEmployment
          .seTaxDeductionRate,
      )
    );
  }

  // ============================================================
  // MARYLAND / STATE TAX
  // ============================================================

private calculateStateTax(
  taxableIncome: number,
  input: TaxCalculatorInput,
  configuration: TaxPayConfiguration,
): number {
  if (
    taxableIncome <= 0 ||
    !input.taxProfile.state
  ) {
    return 0;
  }

  const state = configuration.state;

  if (
    state.stateCode !==
    input.taxProfile.state
  ) {
    return 0;
  }

  const brackets = this.getStateTaxBrackets(
    state,
    input.taxProfile.filingStatus,
  );

  return this.calculateProgressiveTax(
    taxableIncome,
    brackets,
  );
}



private calculateStateTaxableIncome(
  adjustedIncome: number,
  input: TaxCalculatorInput,
  configuration: TaxPayConfiguration,
): number {
  const state =
    configuration.state;

  /*
   * Maryland's standard deduction is 15% of Maryland
   * adjusted gross income, subject to the configured
   * minimum and maximum.
   */
  const standardDeduction =
    Math.min(
      Math.max(
        adjustedIncome *
          this.normalizeRate(
            state.standardDeductionRate,
          ),
        state.standardDeductionMinimum,
      ),
      state.standardDeductionMaximum,
    );

  /*
   * The current calculator exposes dependents as a
   * simple count. Each configured exemption is applied
   * using the Maryland personal-exemption value.
   *
   * Age/blind additional exemptions are not applied here
   * because those attributes are not currently represented
   * by TaxCalculatorInput.
   */
  const dependents =
    this.nonNegative(
      input.taxProfile.dependents,
    );

  const personalExemptions =
    1 + dependents;

  const exemptionAmount =
    personalExemptions *
    this.nonNegative(
      state.personalExemption,
    );

  return Math.max(
    adjustedIncome -
      standardDeduction -
      exemptionAmount,
    0,
  );
}

private getStateTaxBrackets(
  state: TaxPayConfiguration['state'],
  filingStatus:
    TaxCalculatorInput['taxProfile']['filingStatus'],
): TaxBracket[] {
  switch (filingStatus) {
    case 'married-filing-jointly':
      return state.bracketsMarriedJointly;

    case 'head-of-household':
      return state.bracketsHeadOfHousehold;

    case 'married-filing-separately':
      return state.bracketsMarriedSeparately;

    case 'single':
    default:
      return state.bracketsSingle;
  }
}

  // ============================================================
  // LOCAL TAX
  // ============================================================

  private calculateLocalTax(
    taxableIncome: number,
    input: TaxCalculatorInput,
    configuration:
      TaxPayConfiguration,
  ): number {
    if (
      taxableIncome <= 0 ||
      !input.taxProfile.county
    ) {
      return 0;
    }

    if (
      !input.taxProfile.state
    ) {
      return 0;
    }

    const countyValue =
      input.taxProfile.county
        .trim()
        .toLowerCase();

    const stateCode =
      input.taxProfile.state
        .trim()
        .toUpperCase();

    const rule =
      configuration.localTaxes.find(
        (localTax) =>
          localTax.stateCode
            .trim()
            .toUpperCase() ===
            stateCode &&
          (
            localTax.countyCode
              .trim()
              .toLowerCase() ===
              countyValue ||
            localTax.countyName
              .trim()
              .toLowerCase() ===
              countyValue
          ),
      );

    if (!rule) {
      return 0;
    }

    return (
      taxableIncome *
      this.normalizeRate(
        rule.rate,
      )
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
    const periods =
      periodsPerYear > 0
        ? periodsPerYear
        : 1;

    return {
      grossIncome:
        annualGross /
        periods,

      taxes:
        annualTaxes /
        periods,

      deductions:
        annualDeductions /
        periods,

      netIncome:
        annualNet /
        periods,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private requireConfiguration():
    TaxPayConfiguration {
    if (!this.configuration) {
      throw new Error(
        'Tax calculator configuration has not been loaded.',
      );
    }

    return this.configuration;
  }

  /**
   * Configuration rates are stored as decimal fractions:
   *
   * 0.062 = 6.2%
   *
   * The helper also tolerates an accidental whole percentage:
   *
   * 6.2 -> 0.062
   */
  private normalizeRate(
    rate: number,
  ): number {
    if (!Number.isFinite(rate)) {
      return 0;
    }

    if (rate > 1) {
      return rate / 100;
    }

    return Math.max(
      rate,
      0,
    );
  }

  private nonNegative(
    value: number | null | undefined,
  ): number {
    return Math.max(
      Number(value) || 0,
      0,
    );
  }
}

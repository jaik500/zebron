import { Injectable, inject } from '@angular/core';

import { TaxPayConfiguration } from '../../../core/models/tax-pay-configuration.model';
import { TaxPayConfigurationRepository } from '../../../core/repositories/tax-pay-configuration.repository';

@Injectable({
  providedIn: 'root',
})
export class TaxCalculatorConfigurationService {
  private readonly repository = inject(
    TaxPayConfigurationRepository,
  );

  /**
   * Returns the currently active tax configuration.
   */
  async getActive(): Promise<TaxPayConfiguration | null> {
    return this.repository.getActive();
  }

  /**
   * Returns the configuration for a specific tax year.
   */
  async getByTaxYear(
    taxYear: number,
  ): Promise<TaxPayConfiguration | null> {
    return this.repository.getByTaxYear(taxYear);
  }
}

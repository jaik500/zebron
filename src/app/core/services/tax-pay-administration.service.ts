// src/app/core/services/tax-pay-administration.service.ts

import { Injectable, inject } from '@angular/core';

import { TaxPayConfiguration } from '../models/tax-pay-configuration.model';
import { TaxPayConfigurationRepository } from '../repositories/tax-pay-configuration.repository';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class TaxPayAdministrationService {
  private readonly repository = inject(TaxPayConfigurationRepository);

  private readonly logger = inject(LoggerService);

  async getActive(): Promise<TaxPayConfiguration | null> {
    return this.repository.getActive();
  }

  async getByTaxYear(taxYear: number): Promise<TaxPayConfiguration | null> {
    return this.repository.getByTaxYear(taxYear);
  }

  async list(): Promise<TaxPayConfiguration[]> {
    return this.repository.list();
  }

  async save(configuration: TaxPayConfiguration): Promise<void> {
    try {
      await this.repository.save(configuration);

      this.logger.info(
        'TaxPayAdministrationService',
        `Saved tax configuration for ${configuration.taxYear}.`,
      );
    } catch (error) {
      this.logger.error('TaxPayAdministrationService', 'Failed to save tax configuration.', error);

      throw error;
    }
  }

  async setActive(taxYear: number): Promise<void> {
    try {
      await this.repository.setActive(taxYear);

      this.logger.info(
        'TaxPayAdministrationService',
        `Activated tax configuration for ${taxYear}.`,
      );
    } catch (error) {
      this.logger.error(
        'TaxPayAdministrationService',
        `Failed to activate tax configuration for ${taxYear}.`,
        error,
      );

      throw error;
    }
  }

  async deactivate(taxYear: number): Promise<void> {
    try {
      await this.repository.deactivate(taxYear);

      this.logger.info(
        'TaxPayAdministrationService',
        `Deactivated tax configuration for ${taxYear}.`,
      );
    } catch (error) {
      this.logger.error(
        'TaxPayAdministrationService',
        `Failed to deactivate tax configuration for ${taxYear}.`,
        error,
      );

      throw error;
    }
  }

  async delete(taxYear: number): Promise<void> {
    try {
      await this.repository.delete(taxYear);

      this.logger.info('TaxPayAdministrationService', `Deleted tax configuration for ${taxYear}.`);
    } catch (error) {
      this.logger.error(
        'TaxPayAdministrationService',
        `Failed to delete tax configuration for ${taxYear}.`,
        error,
      );

      throw error;
    }
  }
}

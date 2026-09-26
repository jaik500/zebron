import { Injectable, inject } from '@angular/core';

import { TaxPayConfiguration } from '../models/tax-pay-configuration.model';
import { TaxPayConfigurationRepository } from '../repositories/tax-pay-configuration.repository';
import { LoggerService } from './logger.service';

import {
  createTaxPayConfiguration2026,
} from '../../features/tax-pay-calculator/data/tax-pay-configuration-2026';

@Injectable({
  providedIn: 'root',
})
export class TaxPayConfigurationSeedService {
  private readonly repository = inject(
    TaxPayConfigurationRepository,
  );

  private readonly logger = inject(LoggerService);

  /**
   * Creates the initial 2026 configuration if it does not
   * already exist.
   *
   * The configuration is saved inactive so an administrator
   * explicitly controls activation.
   */
  async seed2026(): Promise<TaxPayConfiguration> {
    const existing =
      await this.repository.getByTaxYear(2026);

    if (existing) {
      this.logger.info(
        'TaxPayConfigurationSeedService',
        '2026 tax configuration already exists.',
      );

      return existing;
    }

    const configuration =
      createTaxPayConfiguration2026();

    await this.repository.save(configuration);

    this.logger.info(
      'TaxPayConfigurationSeedService',
      'Created initial 2026 tax configuration.',
    );

    return configuration;
  }

  /**
   * Creates the 2026 configuration and activates it.
   *
   * This should only be called from an authenticated
   * administrative workflow.
   */
  async seedAndActivate2026(): Promise<TaxPayConfiguration> {
    const existing =
      await this.seed2026();

    await this.repository.setActive(2026);

    const active =
      await this.repository.getByTaxYear(2026);

    if (!active) {
      throw new Error(
        '2026 tax configuration could not be loaded after activation.',
      );
    }

    this.logger.info(
      'TaxPayConfigurationSeedService',
      'Created and activated 2026 tax configuration.',
    );

    return active;
  }
}
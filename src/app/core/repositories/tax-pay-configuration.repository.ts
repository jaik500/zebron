import { TaxPayConfiguration } from '../models/tax-pay-configuration.model';

export abstract class TaxPayConfigurationRepository {
  abstract getByTaxYear(
    taxYear: number,
  ): Promise<TaxPayConfiguration | null>;

  abstract getActive(): Promise<TaxPayConfiguration | null>;

  abstract save(
    configuration: TaxPayConfiguration,
  ): Promise<void>;

  abstract list(): Promise<TaxPayConfiguration[]>;

  abstract setActive(
    taxYear: number,
  ): Promise<void>;

  abstract deactivate(
    taxYear: number,
  ): Promise<void>;

  abstract delete(
    taxYear: number,
  ): Promise<void>;
}
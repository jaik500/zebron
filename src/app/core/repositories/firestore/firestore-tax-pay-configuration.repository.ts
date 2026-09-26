// src/app/core/repositories/firestore/firestore-tax-pay-configuration.repository.ts

import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { firestore } from '../../services/firebase-config';
import { TaxPayConfiguration } from '../../models/tax-pay-configuration.model';
import { TaxPayConfigurationRepository } from '../tax-pay-configuration.repository';

@Injectable({
  providedIn: 'root',
})
export class FirestoreTaxPayConfigurationRepository
  extends TaxPayConfigurationRepository {

  private readonly collectionName = 'taxPayConfigurations';

  async getByTaxYear(
    taxYear: number,
  ): Promise<TaxPayConfiguration | null> {
    const snapshot = await getDocs(
      collection(firestore, this.collectionName),
    );

    const match = snapshot.docs.find(
      (item) => item.data()['taxYear'] === taxYear,
    );

    if (!match) {
      return null;
    }

    return this.mapDocument(match.id, match.data());
  }

  async getActive(): Promise<TaxPayConfiguration | null> {
    const snapshot = await getDocs(
      collection(firestore, this.collectionName),
    );

    const match = snapshot.docs.find(
      (item) => item.data()['active'] === true,
    );

    if (!match) {
      return null;
    }

    return this.mapDocument(match.id, match.data());
  }

  async list(): Promise<TaxPayConfiguration[]> {
    const snapshot = await getDocs(
      collection(firestore, this.collectionName),
    );

    return snapshot.docs
      .map((item) => this.mapDocument(item.id, item.data()))
      .sort((a, b) => b.taxYear - a.taxYear);
  }

  async save(
    configuration: TaxPayConfiguration,
  ): Promise<void> {
    const reference = doc(
      firestore,
      this.collectionName,
      configuration.id,
    );

    await setDoc(
      reference,
      configuration,
      { merge: true },
    );
  }

async setActive(taxYear: number): Promise<void> {
  const snapshot = await getDocs(
    collection(
      firestore,
      this.collectionName,
    ),
  );

  const operations = snapshot.docs.map(
    async (item) => {
      const configuration =
        this.mapDocument(
          item.id,
          item.data(),
        );

      const reference = doc(
        firestore,
        this.collectionName,
        item.id,
      );

      await setDoc(
        reference,
        {
          active:
            configuration.taxYear === taxYear,
          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        },
      );
    },
  );

  await Promise.all(operations);
}

  private mapDocument(
    id: string,
    data: Record<string, any>,
  ): TaxPayConfiguration {
    return {
      id,
      taxYear: data['taxYear'],
      federal: data['federal'],
      fica: data['fica'],
      selfEmployment: data['selfEmployment'],
      state: data['state'],
      localTaxes: data['localTaxes'] ?? [],
      payFrequency: data['payFrequency'],
      active: data['active'] ?? false,
      createdAt: this.toIsoString(data['createdAt']),
      updatedAt: this.toIsoString(data['updatedAt']),
    };
  }

  private toIsoString(value: unknown): string {
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value
    ) {
      return (
        value as { toDate: () => Date }
      ).toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    return new Date().toISOString();
  }

  async deactivate(
  taxYear: number,
): Promise<void> {
  const snapshot = await getDocs(
    collection(
      firestore,
      this.collectionName,
    ),
  );

  const configuration =
    snapshot.docs.find(
      (item) =>
        item.data()['taxYear'] === taxYear,
    );

  if (!configuration) {
    throw new Error(
      `Tax configuration for ${taxYear} was not found.`,
    );
  }

  await setDoc(
    doc(
      firestore,
      this.collectionName,
      configuration.id,
    ),
    {
      active: false,
      updatedAt:
        new Date().toISOString(),
    },
    {
      merge: true,
    },
  );
}

async delete(
  taxYear: number,
): Promise<void> {
  const snapshot = await getDocs(
    collection(
      firestore,
      this.collectionName,
    ),
  );

  const configuration =
    snapshot.docs.find(
      (item) =>
        item.data()['taxYear'] === taxYear,
    );

  if (!configuration) {
    throw new Error(
      `Tax configuration for ${taxYear} was not found.`,
    );
  }

  if (configuration.data()['active'] === true) {
    throw new Error(
      `The active ${taxYear} tax configuration cannot be deleted. Deactivate it first.`,
    );
  }

  await deleteDoc(
    doc(
      firestore,
      this.collectionName,
      configuration.id,
    ),
  );
}
}
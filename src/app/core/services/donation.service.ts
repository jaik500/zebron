import { Injectable } from '@angular/core';

import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

@Injectable({
  providedIn: 'root',
})
export class DonationService {
  /**
   * Firebase Functions client.
   *
   * Zebron Cloud Functions run in us-central1.
   */
  private readonly functions = getFunctions(
    undefined,
    'us-central1',
  );

  /**
   * Create a Stripe Checkout session.
   *
   * The Stripe secret key never reaches the browser.
   * Firebase creates the Checkout session and returns
   * only the Stripe Checkout URL.
   */
  async createCheckout(
    amount: number,
    email?: string,
  ): Promise<string> {
    const createCheckout =
      httpsCallable<
        {
          amount: number;
          email?: string;
        },
        {
          url: string;
        }
      >(
        this.functions,
        'createDonationCheckout',
      );

    const result =
      await createCheckout({
        amount,
        email:
          email?.trim() || undefined,
      });

    if (!result.data?.url) {
      throw new Error(
        'Stripe Checkout URL was not returned.',
      );
    }

    return result.data.url;
  }
}

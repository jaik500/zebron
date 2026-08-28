import {
  Component,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  RouterLink,
} from '@angular/router';

import { inject } from '@angular/core';
import { DonationService } from '../../../../core/services/donation.service';

@Component({
  selector: 'app-donate',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
  ],
  template: `
     <!-- Header -->
         <!-- Header -->
<div
  class="bg-[#032D42]
         px-6 py-4
         text-white
         sm:px-10 sm:py-4"
>
  <!-- Header top row -->
  <div class="flex items-center justify-between gap-4">
    <p
      class="text-xs font-semibold
             uppercase tracking-wider
             text-[#7ED6D1]"
    >
      Support Zebron
    </p>

    <!-- Home -->
    <a
      routerLink="/"
      class="inline-flex shrink-0
             items-center
             gap-1.5
             rounded-lg
             border border-white/20
             bg-white/10
             px-3 py-1.5
             text-sm font-medium
             text-white
             transition
             hover:bg-white/20
             focus:outline-none
             focus:ring-2
             focus:ring-white/40"
    >
      <span aria-hidden="true">⌂</span>
      Home
    </a>
  </div>

  <h1
    class="mt-3 text-3xl
           font-bold tracking-tight
           sm:text-4xl"
  >
    Help us make resources easier to find
  </h1>

  <p
    class="mt-4 max-w-2xl
           text-sm leading-6
           text-blue-100
           sm:text-base"
  >
    Your support helps Zebron connect people
    with trusted resources, services,
    organizations, and opportunities.
  </p>
</div>
          
    <main
      class="min-h-[calc(100vh-4rem)]
             bg-gray-50 px-4 py-2
             sm:px-6 sm:py-2
             lg:px-8"
    >
      <div class="mx-auto max-w-3xl">

       

        <!-- Donation card -->
        <section
          class="mt-1 overflow-hidden
                 rounded-2xl
                 border border-gray-200
                 bg-white shadow-lg"
        >

          <!-- Donation form -->
          <div class="px-6 py-8 sm:px-10">

            <!-- Amount -->
            <div>
              <h2
                class="text-lg font-semibold
                       text-gray-900"
              >
                Choose a donation amount
              </h2>

              <div
                class="mt-4 grid grid-cols-2
                       gap-3 sm:grid-cols-4"
              >
                @for (
                  amount of presetAmounts;
                  track amount
                ) {
                  <button
                    type="button"
                    (click)="selectAmount(amount)"
                    [class.border-[#007979]]="
                      selectedAmount() === amount
                    "
                    [class.bg-[#007979]/5]="
                      selectedAmount() === amount
                    "
                    class="rounded-xl
                           border border-gray-200
                           px-4 py-3
                           text-center
                           text-base font-semibold
                           text-gray-900
                           transition
                           hover:border-[#007979]
                           hover:bg-[#007979]/5"
                  >
                    {{ formatCurrency(amount) }}
                  </button>
                }
              </div>
            </div>

            <!-- Custom amount -->
            <div class="mt-6">
              <label
                for="customAmount"
                class="block text-sm
                       font-medium
                       text-gray-700"
              >
                Or enter a custom amount
              </label>

              <div class="relative mt-2">
                <span
                  class="absolute inset-y-0
                         left-0 flex
                         items-center
                         pl-4
                         text-gray-500"
                >
                  $
                </span>

                <input
                  id="customAmount"
                  name="customAmount"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  [ngModel]="customAmount()"
                  (ngModelChange)="
                    setCustomAmount($event)
                  "
                  placeholder="25.00"
                  class="block w-full
                         rounded-xl
                         border border-gray-300
                         bg-white
                         py-3 pl-9 pr-4
                         text-gray-900
                         focus:border-[#007979]
                         focus:outline-none
                         focus:ring-2
                         focus:ring-[#007979]/20"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="mt-6">
              <label
                for="email"
                class="block text-sm
                       font-medium
                       text-gray-700"
              >
                Email
                <span
                  class="font-normal
                         text-gray-400"
                >
                  (optional)
                </span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                [(ngModel)]="email"
                placeholder="you@example.com"
                class="mt-2 block w-full
                       rounded-xl
                       border border-gray-300
                       bg-white
                       px-4 py-3
                       text-sm text-gray-900
                       placeholder:text-gray-400
                       focus:border-[#007979]
                       focus:outline-none
                       focus:ring-2
                       focus:ring-[#007979]/20"
              />

              <p
                class="mt-2 text-xs
                       text-gray-500"
              >
                Your email can be used to send a
                donation receipt.
              </p>
            </div>

            <!-- Error -->
            @if (error()) {
              <div
                class="mt-6 rounded-xl
                       border border-red-200
                       bg-red-50
                       px-4 py-3
                       text-sm text-red-700"
              >
                {{ error() }}
              </div>
            }

            <!-- Donate button -->
            <button
              type="button"
              (click)="donate()"
              [disabled]="processing()"
              class="mt-8 flex w-full
                     items-center
                     justify-center
                     rounded-xl
                     bg-[#007979]
                     px-5 py-3.5
                     text-sm font-semibold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]
                     disabled:cursor-not-allowed
                     disabled:opacity-60"
            >
              @if (processing()) {
                Processing...
              } @else {
                Donate
                @if (selectedAmount() > 0) {
                  {{ formatCurrency(selectedAmount()) }}
                }
              }
            </button>

            <p
              class="mt-4 text-center
                     text-xs leading-5
                     text-gray-500"
            >
              Secure payment powered by Stripe.
              Zebron does not store your card information.
            </p>

          </div>
        </section>
      </div>
    </main>
  `,
})
export class DonateComponent {

  private readonly donationService =
  inject(DonationService);

  protected readonly presetAmounts =
    [10, 25, 50, 100];

  protected readonly selectedAmount =
    signal(25);

  protected readonly customAmount =
    signal<number | null>(null);

  protected readonly processing =
    signal(false);

  protected readonly error =
    signal<string | null>(null);

  protected email = '';

  protected selectAmount(
    amount: number,
  ): void {
    this.selectedAmount.set(amount);
    this.customAmount.set(null);
    this.error.set(null);
  }

  protected setCustomAmount(
    value: number | string | null,
  ): void {

    const amount =
      Number(value);

    if (
      Number.isFinite(amount) &&
      amount > 0
    ) {
      this.customAmount.set(amount);
      this.selectedAmount.set(amount);
    } else {
      this.customAmount.set(null);
      this.selectedAmount.set(0);
    }

    this.error.set(null);
  }

  protected formatCurrency(
    amount: number,
  ): string {
    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      },
    ).format(amount);
  }

  protected async donate(): Promise<void> {
  if (this.processing()) {
    return;
  }

  const amount =
    Number(this.selectedAmount());

  /*
   * Validate the donation amount on the client
   * for immediate user feedback.
   *
   * The Firebase function validates it again
   * on the server.
   */
  if (
    !Number.isFinite(amount) ||
    amount < 1
  ) {
    this.error.set(
      'Please enter a donation amount of at least $1.',
    );

    return;
  }

  if (amount > 10000) {
    this.error.set(
      'The maximum donation is $10,000.',
    );

    return;
  }

  this.processing.set(true);
  this.error.set(null);

  try {
    /*
     * Ask Firebase to create the Stripe Checkout
     * session.
     */
    const checkoutUrl =
      await this.donationService.createCheckout(
        amount,
        this.email,
      );

    /*
     * Redirect the donor to Stripe-hosted Checkout.
     *
     * Card information never passes through Zebron.
     */
    window.location.href =
      checkoutUrl;

  } catch (error) {
    console.error(
      'Donation checkout failed:',
      error,
    );

    this.error.set(
      'Unable to start the donation. Please try again.',
    );

    this.processing.set(false);
  }
}

}

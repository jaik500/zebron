import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatDividerModule,
} from '@angular/material/divider';

import {
  FeatureConfigService,
} from '../../../core/services/feature-config.service';

import {
  LoggerService,
} from '../../../core/services/logger.service';

@Component({
  selector:
    'app-feature-unavailable',

  standalone: true,

  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="min-h-[70vh] flex items-center justify-center p-6"
    >
      <mat-card
        class="w-full max-w-xl"
      >
        <mat-card-content
          class="!p-8 text-center"
        >

          <div
            class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100"
          >
            <mat-icon
              class="!h-8 !w-8 !text-amber-700"
              aria-hidden="true"
            >
              construction
            </mat-icon>
          </div>

          <h1
            class="text-2xl font-semibold text-gray-900"
          >
            {{ featureName() }}
          </h1>

          <p
            class="mt-3 text-base leading-7 text-gray-600"
          >
            {{ message() }}
          </p>

          <mat-divider
            class="my-6"
          />

          <div
            class="flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <a
              mat-flat-button
              routerLink="/"
            >
              <mat-icon>
                home
              </mat-icon>

              Return Home
            </a>

            <button
              mat-stroked-button
              type="button"
              (click)="goBack()"
            >
              <mat-icon>
                arrow_back
              </mat-icon>

              Go Back
            </button>
          </div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class FeatureUnavailableComponent {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly featureConfigService =
    inject(FeatureConfigService);

  private readonly logger =
    inject(LoggerService);

  readonly featureKey =
    this.route.snapshot.queryParamMap.get(
      'feature',
    ) ?? '';

  readonly feature =
    this.featureConfigService.get(
      this.featureKey,
    );

  featureName(): string {
    return (
      this.feature?.name ??
      'This application'
    );
  }

  message(): string {
    if (
      this.feature?.availability ===
      'maintenance'
    ) {
      return (
        `${this.featureName()} is temporarily unavailable ` +
        'while maintenance is being performed. Please try again later.'
      );
    }

    return (
      `${this.featureName()} is currently unavailable. ` +
      'Please try again later.'
    );
  }

  goBack(): void {
    this.logger.debug(
      'FeatureUnavailableComponent',
      'User navigated back from unavailable feature page.',
      {
        featureKey:
          this.featureKey,
      },
    );

    this.router.navigateByUrl('/');
  }
}
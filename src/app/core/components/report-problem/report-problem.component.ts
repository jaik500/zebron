import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OperationalMonitoringService } from '../../services/operational-monitoring.service';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-report-problem',

  standalone: true,

  imports: [
    FormsModule,

    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <section
      class="rounded-2xl
             border border-slate-200
             bg-white
             shadow-sm"
    >
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <div
        class="border-b border-slate-200
               px-6 py-5"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10
                   shrink-0
                   items-center justify-center
                   rounded-xl
                   bg-[#2a835f]/10"
          >
            <mat-icon class="!text-[#2a835f]"> report_problem </mat-icon>
          </div>

          <div>
            <h2
              class="text-lg font-semibold
                     text-slate-900"
            >
              Report a Problem
            </h2>

            <p
              class="mt-1 text-sm
                     leading-6
                     text-slate-500"
            >
              Tell us what went wrong and our team can investigate the issue.
            </p>
          </div>
        </div>
      </div>

      <!-- =========================================================
           SUCCESS STATE
           ========================================================= -->

      @if (submitted()) {
        <div class="p-8">
          <div
            class="rounded-xl
                   border border-green-200
                   bg-green-50
                   p-6 text-center"
          >
            <div
              class="mx-auto flex h-12 w-12
                     items-center justify-center
                     rounded-full
                     bg-green-100"
            >
              <mat-icon class="!text-green-600"> check_circle </mat-icon>
            </div>

            <h3
              class="mt-4 text-base
                     font-semibold
                     text-green-900"
            >
              Problem reported
            </h3>

            <p
              class="mx-auto mt-2
                     max-w-lg
                     text-sm leading-6
                     text-green-800"
            >
              Your report has been submitted. Our team can now review the issue through Operational
              Monitoring.
            </p>

            <button mat-stroked-button type="button" class="mt-5" (click)="reset()">
              Report Another Problem
            </button>
          </div>
        </div>
      } @else {
        <!-- =======================================================
             FORM
             ======================================================= -->

        <form class="space-y-5 p-6" (ngSubmit)="submit()">
          <!-- Error -->

          @if (error()) {
            <div
              class="rounded-xl
                     border border-red-200
                     bg-red-50 p-4"
            >
              <div class="flex items-start gap-3">
                <mat-icon class="!text-red-600"> error_outline </mat-icon>

                <div>
                  <p
                    class="text-sm font-semibold
                           text-red-800"
                  >
                    Unable to submit report
                  </p>

                  <p
                    class="mt-1 text-sm
                           text-red-700"
                  >
                    {{ error() }}
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Problem -->

          <mat-form-field appearance="outline" class="w-full">
            <mat-label> What went wrong? </mat-label>

            <input
              matInput
              name="title"
              [(ngModel)]="title"
              maxlength="150"
              required
              placeholder="Briefly describe the problem"
            />

            <mat-hint align="end"> {{ title.length }}/150 </mat-hint>
          </mat-form-field>

          <!-- Description -->

          <mat-form-field appearance="outline" class="w-full">
            <mat-label> Describe the problem </mat-label>

            <textarea
              matInput
              name="description"
              [(ngModel)]="description"
              rows="6"
              maxlength="3000"
              required
              placeholder="Tell us what happened, what you expected, and what you saw instead."
            ></textarea>

            <mat-hint align="end"> {{ description.length }}/3000 </mat-hint>
          </mat-form-field>

          <!-- Feature -->

          <mat-form-field appearance="outline" class="w-full">
            <mat-label> Where did this happen? </mat-label>

            <mat-select name="feature" [(ngModel)]="feature">
              <mat-option value=""> Select an area </mat-option>

              <mat-option value="community"> Community </mat-option>

              <mat-option value="tax-pay-calculator"> Tax & Pay Calculator </mat-option>

              <mat-option value="test-center"> Test Center </mat-option>

              <mat-option value="jobs"> Jobs </mat-option>

              <mat-option value="resources"> Resources </mat-option>

              <mat-option value="authentication"> Sign In / Account </mat-option>

              <mat-option value="other"> Other </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Optional reference -->

          <mat-form-field appearance="outline" class="w-full">
            <mat-label> Additional reference </mat-label>

            <input
              matInput
              name="correlationId"
              [(ngModel)]="correlationId"
              maxlength="100"
              placeholder="Optional page, post, resource, or other reference"
            />

            <mat-hint>
              Don't include passwords, payment information, or other sensitive information.
            </mat-hint>
          </mat-form-field>

          <!-- Actions -->

          <div
            class="flex flex-col-reverse
                   gap-3
                   sm:flex-row
                   sm:justify-end"
          >
            <button mat-button type="button" [disabled]="submitting()" (click)="reset()">
              Cancel
            </button>

            <button mat-flat-button type="submit" [disabled]="submitting() || !isValid()">
              @if (submitting()) {
                <mat-spinner diameter="20" />

                <span class="ml-2"> Submitting... </span>
              } @else {
                <ng-container>
                  <mat-icon> send </mat-icon>
                </ng-container>
                <span class="ml-2"> Submit Report </span>
              }
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class ReportProblemComponent {
  private readonly operationalMonitoringService = inject(OperationalMonitoringService);

  private readonly authService = inject(AuthService);

  private readonly logger = inject(LoggerService);

  protected title = '';

  protected description = '';

  protected feature = '';

  protected correlationId = '';

  protected readonly submitting = signal(false);

  protected readonly submitted = signal(false);

  protected readonly error = signal<string | null>(null);

  protected isValid(): boolean {
    return this.title.trim().length > 0 && this.description.trim().length > 0;
  }

  protected async submit(): Promise<void> {
    if (this.submitting() || !this.isValid()) {
      return;
    }

    this.submitting.set(true);

    this.error.set(null);

    try {
      const user = this.authService.user();

      await this.operationalMonitoringService.recordUserReport(
        this.title.trim(),
        this.description.trim(),
        {
          userId: user?.id,

          feature: this.feature || undefined,

          correlationId: this.correlationId.trim() || undefined,

          metadata: {
            source: 'report-problem',
          },
        },
      );

      this.submitted.set(true);
    } catch (error) {
      this.logger.error('ReportProblemComponent', 'Failed to submit user problem report.', error);

      this.error.set('We could not submit your report. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected reset(): void {
    this.title = '';

    this.description = '';

    this.feature = '';

    this.correlationId = '';

    this.error.set(null);

    this.submitted.set(false);
  }
}

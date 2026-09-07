import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { SystemSetting } from '../../../../../../core/models/system-setting.model';

import { SettingsService } from '../../../../../../core/services/settings.service';
import { LoggerService } from '../../../../../../core/services/logger.service';

@Component({
  selector:
    'app-configuration-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">

      <!-- HEADER -->

      <div>

        <h2
          class="text-xl font-semibold text-slate-900"
        >
          System Settings
        </h2>

        <p
          class="mt-1 text-sm text-slate-600"
        >
          Configure runtime behavior without
          changing application code.
        </p>

      </div>


      <!-- LOADING -->

      @if (loading()) {

        <div
          class="flex items-center
                 justify-center py-16"
        >

          <mat-spinner
            diameter="40"
          />

        </div>

      }


      <!-- ERROR -->

      @if (error()) {

        <div
          class="rounded-xl border
                 border-red-200
                 bg-red-50 p-4"
        >

          <div
            class="flex items-start gap-3"
          >

            <mat-icon
              class="text-red-600"
            >
              error
            </mat-icon>

            <div>

              <p
                class="font-medium
                       text-red-900"
              >
                Configuration error
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


      @if (!loading()) {

        @for (
          group of groups();
          track group
        ) {

          <section>

            <div class="mb-3">

              <h3
                class="text-base font-semibold
                       text-slate-900"
              >
                {{ group }}
              </h3>

            </div>


            <div
              class="space-y-3"
            >

              @for (
                setting of settingsForGroup(group);
                track setting.key
              ) {

                <mat-card
                  appearance="outlined"
                  class="!rounded-xl"
                >

                  <mat-card-content>

                    <div
                      class="flex flex-col gap-4
                             lg:flex-row
                             lg:items-center
                             lg:justify-between"
                    >

                      <!-- DESCRIPTION -->

                      <div>

                        <div
                          class="flex items-center
                                 gap-2"
                        >

                          <h4
                            class="font-medium
                                   text-slate-900"
                          >
                            {{ setting.label }}
                          </h4>

                        </div>

                        @if (
                          setting.description
                        ) {

                          <p
                            class="mt-1 max-w-2xl
                                   text-sm
                                   text-slate-600"
                          >
                            {{
                              setting.description
                            }}
                          </p>

                        }

                        <p
                          class="mt-2 font-mono
                                 text-xs
                                 text-slate-400"
                        >
                          {{ setting.key }}
                        </p>

                      </div>


                      <!-- VALUE -->

                      <div
                        class="flex
                               w-full
                               items-center
                               gap-2
                               lg:w-auto"
                      >

                        @if (
                          setting.type ===
                          'boolean'
                        ) {

                          <mat-slide-toggle
                            [checked]="
                              setting.value === true
                            "
                            [disabled]="
                              !setting.editable ||
                              savingKey() ===
                                setting.key
                            "
                            (change)="
                              updateBoolean(
                                setting,
                                $event.checked
                              )
                            "
                          >
                            {{
                              setting.value === true
                                ? 'Enabled'
                                : 'Disabled'
                            }}
                          </mat-slide-toggle>

                        }


                        @if (
                          setting.type ===
                          'number'
                        ) {

                          <mat-form-field
                            appearance="outline"
                            class="w-full
                                   sm:w-48"
                          >

                            <mat-label>
                              Value
                            </mat-label>

                            <input
                              matInput
                              type="number"
                              [ngModel]="
                                setting.value
                              "
                              [disabled]="
                                !setting.editable ||
                                savingKey() ===
                                  setting.key
                              "
                              (ngModelChange)="
                                updateNumber(
                                  setting,
                                  $event
                                )
                              "
                            />

                          </mat-form-field>

                        }


                        @if (
                          setting.type ===
                          'string'
                        ) {

                          <mat-form-field
                            appearance="outline"
                            class="w-full
                                   sm:w-72"
                          >

                            <mat-label>
                              Value
                            </mat-label>

                            <input
                              matInput
                              type="text"
                              [ngModel]="
                                setting.value
                              "
                              [disabled]="
                                !setting.editable ||
                                savingKey() ===
                                  setting.key
                              "
                              (ngModelChange)="
                                updateString(
                                  setting,
                                  $event
                                )
                              "
                            />

                          </mat-form-field>

                        }


                        @if (
                          savingKey() ===
                          setting.key
                        ) {

                          <mat-spinner
                            diameter="20"
                          />

                        }

                      </div>

                    </div>


                    <!-- RESET -->

                    @if (
                      setting.editable
                    ) {

                      <div
                        class="mt-4 flex
                               justify-end
                               border-t
                               border-slate-100
                               pt-3"
                      >

                        <button
                          mat-button
                          type="button"
                          [disabled]="
                            savingKey() ===
                            setting.key
                          "
                          (click)="
                            resetSetting(setting)
                          "
                        >

                          <mat-icon>
                            restore
                          </mat-icon>

                          Reset to default

                        </button>

                      </div>

                    }

                  </mat-card-content>

                </mat-card>

              }

            </div>

          </section>

        }

      }

    </div>
  `,
})
export class ConfigurationSettingsComponent
  implements OnInit {

  private readonly settingsService =
    inject(SettingsService);

  private readonly logger =
    inject(LoggerService);

  readonly settings =
    this.settingsService.settings;

  readonly loading =
    signal(true);

  readonly savingKey =
    signal<string | null>(null);

  readonly error =
    signal<string | null>(null);

  readonly groups =
    signal<string[]>([]);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {

      await this.settingsService
        .load();

      this.refreshGroups();

    } catch (error) {

      this.logger.error(
        'ConfigurationSettingsComponent',
        'Failed to load settings.',
        error,
      );

      this.error.set(
        'The system settings could not be loaded.',
      );

    } finally {
      this.loading.set(false);
    }
  }

  settingsForGroup(
    group: string,
  ): SystemSetting[] {

    return this.settings()
      .filter(
        (setting) =>
          setting.group ===
          group,
      );
  }

  async updateBoolean(
    setting: SystemSetting,
    value: boolean,
  ): Promise<void> {

    await this.update(
      setting,
      value,
    );
  }

  async updateNumber(
    setting: SystemSetting,
    value: number,
  ): Promise<void> {

    if (
      typeof value !==
      'number' ||
      !Number.isFinite(value)
    ) {
      return;
    }

    await this.update(
      setting,
      value,
    );
  }

  async updateString(
    setting: SystemSetting,
    value: string,
  ): Promise<void> {

    await this.update(
      setting,
      value,
    );
  }

  async resetSetting(
    setting: SystemSetting,
  ): Promise<void> {

    this.savingKey.set(
      setting.key,
    );

    this.error.set(null);

    try {

      await this.settingsService
        .reset(
          setting.key,
        );

    } catch (error) {

      this.logger.error(
        'ConfigurationSettingsComponent',
        'Failed to reset system setting.',
        error,
        {
          settingKey:
            setting.key,
        },
      );

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to reset the setting.',
      );

    } finally {
      this.savingKey.set(
        null,
      );
    }
  }

  private async update(
    setting: SystemSetting,
    value:
      string |
      number |
      boolean,
  ): Promise<void> {

    if (
      !setting.editable
    ) {
      return;
    }

    if (
      setting.value ===
      value
    ) {
      return;
    }

    this.savingKey.set(
      setting.key,
    );

    this.error.set(null);

    try {

      await this.settingsService
        .set(
          setting.key,
          value,
        );

    } catch (error) {

      this.logger.error(
        'ConfigurationSettingsComponent',
        'Failed to update system setting.',
        error,
        {
          settingKey:
            setting.key,
        },
      );

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to update the system setting.',
      );

    } finally {
      this.savingKey.set(
        null,
      );
    }
  }

  private refreshGroups(): void {

    const groups =
      Array.from(
        new Set(
          this.settings()
            .map(
              (setting) =>
                setting.group,
            ),
        ),
      );

    this.groups.set(
      groups,
    );
  }
}
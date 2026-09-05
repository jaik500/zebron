import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatNativeDateModule } from '@angular/material/core';

import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HotToastService } from '@ngxpert/hot-toast';

import { Timestamp } from 'firebase/firestore';

import { BusinessStore } from '../../store/business.store';

import { AuthService } from '../../../../core/services/auth.service';

import { Business } from '../../models/business.model';

import { Location } from '../../../../core/models/location.model';

import { LocationService } from '../../../../core/services/location.service';

@Component({
  selector: 'app-business-profile',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,

    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ],

  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- =========================================================
           HEADER
           ========================================================= -->

      <header class="bg-[#032D42] text-white">
        <div
          class="mx-auto max-w-5xl
                 px-4 py-6
                 sm:px-6
                 lg:px-8"
        >
          <div
            class="flex flex-col
                   gap-4
                   sm:flex-row
                   sm:items-center
                   sm:justify-between"
          >
            <div>
              <p
                class="text-xs
                       font-semibold
                       uppercase
                       tracking-wider
                       text-[#7ED6D1]"
              >
                Business Operations
              </p>

              <h1
                class="mt-1
                       text-2xl
                       font-bold
                       sm:text-3xl"
              >
                Business Profile
              </h1>

              <p
                class="mt-2
                       max-w-2xl
                       text-sm
                       leading-6
                       text-gray-200"
              >
                Maintain the legal and operational identity of the business.
              </p>
            </div>

            <a
              routerLink="/admin/business"
              mat-stroked-button
              class="!border-white
                     !text-white"
            >
              <mat-icon> arrow_back </mat-icon>

              Business Operations
            </a>
          </div>
        </div>
      </header>

      <!-- =========================================================
           CONTENT
           ========================================================= -->

      <div
        class="mx-auto max-w-5xl
               px-4 py-6
               sm:px-6
               lg:px-8"
      >
        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" class="mb-6" />
        }

        <!-- =======================================================
             PROFILE FORM
             ======================================================= -->

        <form [formGroup]="form" (ngSubmit)="save()">
          <!-- =====================================================
               BUSINESS IDENTITY
               ===================================================== -->

          <mat-card
            class="!border
                   !shadow-sm"
          >
            <mat-card-header>
              <mat-icon
                mat-card-avatar
                class="!flex
                       !items-center
                       !justify-center
                       !rounded-xl
                       !bg-[#007979]/10
                       !text-[#007979]"
              >
                business
              </mat-icon>

              <mat-card-title> Business Identity </mat-card-title>

              <mat-card-subtitle> Legal and operating information </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content class="!pt-6">
              <div
                class="grid
                       grid-cols-1
                       gap-5
                       md:grid-cols-2"
              >
                <!-- =================================================
                     LEGAL NAME
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Legal Business Name </mat-label>

                  <input matInput formControlName="legalName" placeholder="Zebron LLC" />

                  @if (
                    form.controls.legalName.hasError('required') && form.controls.legalName.touched
                  ) {
                    <mat-error> Legal business name is required. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     TRADE NAME
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Trade Name / DBA </mat-label>

                  <input matInput formControlName="tradeName" placeholder="Zebron" />
                </mat-form-field>

                <!-- =================================================
                     ENTITY TYPE
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Entity Type </mat-label>

                  <mat-select formControlName="entityType">
                    @for (type of entityTypes; track type) {
                      <mat-option [value]="type">
                        {{ type }}
                      </mat-option>
                    }
                  </mat-select>

                  @if (
                    form.controls.entityType.hasError('required') &&
                    form.controls.entityType.touched
                  ) {
                    <mat-error> Entity type is required. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     STATE OF FORMATION
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> State of Formation </mat-label>

                  <mat-select formControlName="stateOfFormation">
                    @for (state of states; track state.code) {
                      <mat-option [value]="state.code">
                        {{ state.name }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- =================================================
                     FORMATION DATE
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Formation Date </mat-label>

                  <input
                    matInput
                    [matDatepicker]="formationPicker"
                    formControlName="formationDate"
                  />

                  <mat-datepicker-toggle matIconSuffix [for]="formationPicker" />

                  <mat-datepicker #formationPicker />
                </mat-form-field>

                <!-- =================================================
                     BUSINESS STATUS
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Business Status </mat-label>

                  <mat-select formControlName="status">
                    <mat-option value="active"> Active </mat-option>

                    <mat-option value="inactive"> Inactive </mat-option>

                    <mat-option value="closed"> Closed </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- =================================================
                     EIN
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> EIN </mat-label>

                  <input matInput formControlName="ein" placeholder="XX-XXXXXXX" />

                  <mat-hint> Store only if appropriate for your administrative records. </mat-hint>
                </mat-form-field>

                <!-- =================================================
                     REGISTRATION NUMBER
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Registration Number </mat-label>

                  <input matInput formControlName="registrationNumber" />
                </mat-form-field>

                <!-- =================================================
                     INDUSTRY
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Industry </mat-label>

                  <input matInput formControlName="industry" placeholder="Information Technology" />
                </mat-form-field>

                <!-- =================================================
                     NAICS CODE
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> NAICS Code </mat-label>

                  <input matInput formControlName="naicsCode" placeholder="541512" />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- =====================================================
               BUSINESS ADDRESS
               ===================================================== -->

          <mat-card
            class="mt-6
                   !border
                   !shadow-sm"
          >
            <mat-card-header>
              <mat-icon
                mat-card-avatar
                class="!flex
                       !items-center
                       !justify-center
                       !rounded-xl
                       !bg-[#007979]/10
                       !text-[#007979]"
              >
                location_on
              </mat-icon>

              <mat-card-title> Business Address </mat-card-title>

              <mat-card-subtitle> Primary business address </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content class="!pt-6">
              <p
                class="mb-5
                       text-sm
                       leading-6
                       text-gray-500"
              >
                This address is stored in Zebron's centralized
                <strong>locations</strong> collection. The business record stores only the
                associated location ID.
              </p>

              <div
                formGroupName="address"
                class="grid
                       grid-cols-1
                       gap-5
                       md:grid-cols-2"
              >
                <!-- =================================================
                     STREET
                     ================================================= -->

                <mat-form-field
                  appearance="outline"
                  class="w-full
                         md:col-span-2"
                >
                  <mat-label> Street Address </mat-label>

                  <input matInput formControlName="street" placeholder="123 Main Street" />

                  @if (
                    form.controls.address.controls.street.hasError('required') &&
                    form.controls.address.controls.street.touched
                  ) {
                    <mat-error> Street address is required. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     CITY
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> City </mat-label>

                  <input matInput formControlName="city" placeholder="Baltimore" />

                  @if (
                    form.controls.address.controls.city.hasError('required') &&
                    form.controls.address.controls.city.touched
                  ) {
                    <mat-error> City is required. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     COUNTY
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> County </mat-label>

                  <input matInput formControlName="county" placeholder="Baltimore County" />
                </mat-form-field>

                <!-- =================================================
                     STATE
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> State </mat-label>

                  <mat-select formControlName="state">
                    @for (state of states; track state.code) {
                      <mat-option [value]="state.code">
                        {{ state.name }}
                      </mat-option>
                    }
                  </mat-select>

                  @if (
                    form.controls.address.controls.state.hasError('required') &&
                    form.controls.address.controls.state.touched
                  ) {
                    <mat-error> State is required for U.S. addresses. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     ZIP CODE
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> ZIP / Postal Code </mat-label>

                  <input matInput formControlName="postalCode" placeholder="21201" />

                  @if (
                    form.controls.address.controls.postalCode.hasError('required') &&
                    form.controls.address.controls.postalCode.touched
                  ) {
                    <mat-error> ZIP / Postal Code is required. </mat-error>
                  }
                </mat-form-field>

                <!-- =================================================
                     COUNTRY
                     ================================================= -->

                <mat-form-field appearance="outline" class="w-full">
                  <mat-label> Country </mat-label>

                  <input matInput formControlName="country" placeholder="United States" />

                  @if (
                    form.controls.address.controls.country.hasError('required') &&
                    form.controls.address.controls.country.touched
                  ) {
                    <mat-error> Country is required. </mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- ===================================================
                   LOCATION INFORMATION
                   =================================================== -->

              @if (location(); as currentLocation) {
                <div
                  class="mt-5
                         rounded-xl
                         border
                         border-[#007979]/20
                         bg-[#007979]/5
                         p-4"
                >
                  <div
                    class="flex
                           items-start
                           gap-3"
                  >
                    <mat-icon class="!text-[#007979]"> check_circle </mat-icon>

                    <div>
                      <p
                        class="text-sm
                               font-semibold
                               text-gray-900"
                      >
                        Linked to centralized location
                      </p>

                      <p
                        class="mt-1
                               text-xs
                               leading-5
                               text-gray-600"
                      >
                        Location ID:
                        <span class="font-mono">
                          {{ currentLocation.id || 'existing location' }}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- =====================================================
               ACTIONS
               ===================================================== -->

          <div
            class="mt-6
                   flex
                   flex-col
                   gap-3
                   sm:flex-row
                   sm:justify-end"
          >
            <a routerLink="/admin/business" mat-stroked-button type="button"> Cancel </a>

            <button mat-flat-button color="primary" type="submit" [disabled]="store.saving()">
              <mat-icon> save </mat-icon>

              {{ store.saving() ? 'Saving...' : 'Save Business Profile' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      mat-card {
        border-radius: 16px;
      }
    `,
  ],
})
export class BusinessProfileComponent implements OnInit {
  private readonly router = inject(Router);

  // ============================================================
  // SERVICES
  // ============================================================

  protected readonly store = inject(BusinessStore);

  private readonly authService = inject(AuthService);

  private readonly locationService = inject(LocationService);

  private readonly toast = inject(HotToastService);

  private readonly fb = inject(FormBuilder);

  // ============================================================
  // LOCATION STATE
  // ============================================================

  /**
   * The location associated with the current business.
   *
   * The actual address is stored in:
   *
   * locations/{locationId}
   */
  protected readonly location = signal<Location | null>(null);

  // ============================================================
  // FORM
  // ============================================================

  protected readonly form = this.fb.nonNullable.group({
    // ----------------------------------------------------------
    // Business identity
    // ----------------------------------------------------------

    legalName: ['', [Validators.required]],

    tradeName: [''],

    entityType: ['LLC', [Validators.required]],

    stateOfFormation: [''],

    formationDate: [null as Date | null],

    ein: [''],

    registrationNumber: [''],

    industry: [''],

    naicsCode: [''],

    status: ['active' as 'active' | 'inactive' | 'closed', [Validators.required]],

    // ----------------------------------------------------------
    // Address
    //
    // These fields exist only for form entry.
    //
    // They are NOT stored inside businesses/{businessId}.
    // They are persisted through LocationService into:
    //
    // locations/{locationId}
    // ----------------------------------------------------------

    address: this.fb.nonNullable.group({
      street: ['', [Validators.required]],

      city: ['', [Validators.required]],

      county: [''],

      state: [''],

      postalCode: [''],

      country: ['United States', [Validators.required]],
    }),
  });

  // ============================================================
  // OPTIONS
  // ============================================================

  protected readonly entityTypes = [
    'LLC',

    'Corporation',

    'S Corporation',

    'Partnership',

    'Sole Proprietorship',

    'Nonprofit',

    'Other',
  ];

  protected readonly states = [
    {
      code: 'AL',
      name: 'Alabama',
    },

    {
      code: 'AK',
      name: 'Alaska',
    },

    {
      code: 'AZ',
      name: 'Arizona',
    },

    {
      code: 'AR',
      name: 'Arkansas',
    },

    {
      code: 'CA',
      name: 'California',
    },

    {
      code: 'CO',
      name: 'Colorado',
    },

    {
      code: 'CT',
      name: 'Connecticut',
    },

    {
      code: 'DE',
      name: 'Delaware',
    },

    {
      code: 'FL',
      name: 'Florida',
    },

    {
      code: 'GA',
      name: 'Georgia',
    },

    {
      code: 'HI',
      name: 'Hawaii',
    },

    {
      code: 'ID',
      name: 'Idaho',
    },

    {
      code: 'IL',
      name: 'Illinois',
    },

    {
      code: 'IN',
      name: 'Indiana',
    },

    {
      code: 'IA',
      name: 'Iowa',
    },

    {
      code: 'KS',
      name: 'Kansas',
    },

    {
      code: 'KY',
      name: 'Kentucky',
    },

    {
      code: 'LA',
      name: 'Louisiana',
    },

    {
      code: 'ME',
      name: 'Maine',
    },

    {
      code: 'MD',
      name: 'Maryland',
    },

    {
      code: 'MA',
      name: 'Massachusetts',
    },

    {
      code: 'MI',
      name: 'Michigan',
    },

    {
      code: 'MN',
      name: 'Minnesota',
    },

    {
      code: 'MS',
      name: 'Mississippi',
    },

    {
      code: 'MO',
      name: 'Missouri',
    },

    {
      code: 'MT',
      name: 'Montana',
    },

    {
      code: 'NE',
      name: 'Nebraska',
    },

    {
      code: 'NV',
      name: 'Nevada',
    },

    {
      code: 'NH',
      name: 'New Hampshire',
    },

    {
      code: 'NJ',
      name: 'New Jersey',
    },

    {
      code: 'NM',
      name: 'New Mexico',
    },

    {
      code: 'NY',
      name: 'New York',
    },

    {
      code: 'NC',
      name: 'North Carolina',
    },

    {
      code: 'ND',
      name: 'North Dakota',
    },

    {
      code: 'OH',
      name: 'Ohio',
    },

    {
      code: 'OK',
      name: 'Oklahoma',
    },

    {
      code: 'OR',
      name: 'Oregon',
    },

    {
      code: 'PA',
      name: 'Pennsylvania',
    },

    {
      code: 'RI',
      name: 'Rhode Island',
    },

    {
      code: 'SC',
      name: 'South Carolina',
    },

    {
      code: 'SD',
      name: 'South Dakota',
    },

    {
      code: 'TN',
      name: 'Tennessee',
    },

    {
      code: 'TX',
      name: 'Texas',
    },

    {
      code: 'UT',
      name: 'Utah',
    },

    {
      code: 'VT',
      name: 'Vermont',
    },

    {
      code: 'VA',
      name: 'Virginia',
    },

    {
      code: 'WA',
      name: 'Washington',
    },

    {
      code: 'WV',
      name: 'West Virginia',
    },

    {
      code: 'WI',
      name: 'Wisconsin',
    },

    {
      code: 'WY',
      name: 'Wyoming',
    },
  ];

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    /**
     * The Business Profile page can be opened directly.
     *
     * Therefore we cannot assume that BusinessStore has already
     * loaded its data from the Business Dashboard.
     */
    try {
      await this.store.loadBusinessData();

      const business = this.store.selectedBusiness();

      if (!business) {
        return;
      }

      this.populateForm(business);

      await this.loadBusinessLocation(business);
    } catch (error) {
      console.error('Failed to load business profile:', error);

      this.toast.error('Unable to load the business profile.');
    }
  }

  // ============================================================
  // POPULATE BUSINESS FORM
  // ============================================================

  private populateForm(business: Business): void {
    this.form.patchValue({
      legalName: business.legalName,

      tradeName: business.tradeName ?? '',

      entityType: business.entityType,

      stateOfFormation: business.stateOfFormation ?? '',

      formationDate: business.formationDate ? business.formationDate.toDate() : null,

      ein: business.ein ?? '',

      registrationNumber: business.registrationNumber ?? '',

      industry: business.industry ?? '',

      naicsCode: business.naicsCode ?? '',

      status: business.status,
    });
  }

  // ============================================================
  // LOAD LINKED LOCATION
  // ============================================================

  private async loadBusinessLocation(business: Business): Promise<void> {
    /**
     * A business may legitimately exist without a location,
     * especially if it was created before the centralized
     * location architecture was implemented.
     */
    if (!business.locationId) {
      this.location.set(null);

      return;
    }

    try {
      const location = await this.locationService.getLocationById(business.locationId);

      if (!location) {
        this.location.set(null);

        return;
      }

      this.location.set(location);

      // ----------------------------------------------------------
      // Populate the address form from locations/{locationId}
      // ----------------------------------------------------------

      this.form.controls.address.patchValue({
        street: location.address ?? '',

        city: location.city ?? '',

        county: this.readLocationCounty(location),

        state: location.state ?? '',

        postalCode: location.zipCode ?? location.postalCode ?? '',

        country: location.country ?? 'United States',
      });
    } catch (error) {
      console.error('Failed to load business location:', error);

      this.toast.error('Unable to load the business address.');
    }
  }

  // ============================================================
  // LOCATION COUNTY
  // ============================================================

  /**
   * The current Location interface does not guarantee a county
   * property, but existing Location records may contain one.
   *
   * Read it safely without requiring a model change.
   */
  private readLocationCounty(location: Location): string {
    const locationRecord = location as Location & {
      county?: string;
    };

    return locationRecord.county ?? '';
  }

  // ============================================================
  // SAVE
  // ============================================================

  protected async save(): Promise<void> {
    // ----------------------------------------------------------
    // Validate business form
    // ----------------------------------------------------------

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.toast.error('Please complete all required business fields.');

      return;
    }

    // ----------------------------------------------------------
    // Verify authenticated administrator
    // ----------------------------------------------------------

    const user = this.authService.user();

    if (!user) {
      this.toast.error('You must be signed in to manage the business profile.');

      return;
    }

    const selectedBusiness = this.store.selectedBusiness();

    // ----------------------------------------------------------
    // Extract business fields
    // ----------------------------------------------------------

    const legalName = this.form.controls.legalName.value.trim();

    const tradeName = this.form.controls.tradeName.value.trim();

    const entityType = this.form.controls.entityType.value;

    const stateOfFormation = this.form.controls.stateOfFormation.value;

    const formationDate = this.form.controls.formationDate.value;

    const ein = this.form.controls.ein.value.trim();

    const registrationNumber = this.form.controls.registrationNumber.value.trim();

    const industry = this.form.controls.industry.value.trim();

    const naicsCode = this.form.controls.naicsCode.value.trim();

    const status = this.form.controls.status.value;

    // ----------------------------------------------------------
    // Extract address fields
    // ----------------------------------------------------------

    const addressForm = this.form.controls.address;

    const address = addressForm.controls.street.value.trim();

    const city = addressForm.controls.city.value.trim();

    const county = addressForm.controls.county.value.trim();

    const state = addressForm.controls.state.value.trim().toUpperCase();

    const postalCode = addressForm.controls.postalCode.value.trim();

    const country = addressForm.controls.country.value.trim();

    // ----------------------------------------------------------
    // Validate address
    // ----------------------------------------------------------

    if (!address) {
      this.toast.error('Business street address is required.');

      addressForm.controls.street.markAsTouched();

      return;
    }

    if (!city) {
      this.toast.error('Business city is required.');

      addressForm.controls.city.markAsTouched();

      return;
    }

    if (!country) {
      this.toast.error('Business country is required.');

      addressForm.controls.country.markAsTouched();

      return;
    }

    // ----------------------------------------------------------
    // U.S.-specific validation
    // ----------------------------------------------------------

    const normalizedCountry = country.toLowerCase();

    const isUnitedStates =
      normalizedCountry === 'united states' ||
      normalizedCountry === 'usa' ||
      normalizedCountry === 'us';

    if (isUnitedStates && !state) {
      this.toast.error('State is required for United States locations.');

      addressForm.controls.state.markAsTouched();

      return;
    }

    if (isUnitedStates && !postalCode) {
      this.toast.error('ZIP Code is required for United States locations.');

      addressForm.controls.postalCode.markAsTouched();

      return;
    }

    // ==========================================================
    // SAVE LOCATION
    // ==========================================================

    let locationId = selectedBusiness?.locationId;

    let newlyCreatedLocationId: string | null = null;

    try {
      /**
       * IMPORTANT:
       *
       * The address entered on this form is NOT saved into
       * businesses/{businessId}.
       *
       * It is persisted through LocationService into:
       *
       * locations/{locationId}
       */

      const locationData = this.buildLocation(address, city, county, state, postalCode, country);

      // --------------------------------------------------------
      // Existing business with existing location
      // --------------------------------------------------------

      if (locationId) {
        await this.locationService.updateLocation(locationId, locationData);
      }

      // --------------------------------------------------------
      // New business or existing business without a location
      // --------------------------------------------------------
      else {
        locationId = await this.locationService.createLocation(locationData);

        newlyCreatedLocationId = locationId;
      }

      // --------------------------------------------------------
      // Load the saved location into local state
      // --------------------------------------------------------

      if (locationId) {
        const savedLocation = await this.locationService.getLocationById(locationId);

        this.location.set(savedLocation);
      }

      // ========================================================
      // BUILD BUSINESS RECORD
      // ========================================================

      /**
       * Notice that there is NO `address` property here.
       *
       * The business stores only:
       *
       * locationId
       *
       * This is the central relationship between the business
       * and the location collection.
       */

      const businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'> = {
        ownerId: selectedBusiness?.ownerId ?? user.id,

        legalName,

        ...(tradeName
          ? {
              tradeName,
            }
          : {}),

        entityType,

        ...(stateOfFormation
          ? {
              stateOfFormation,
            }
          : {}),

        ...(formationDate
          ? {
              formationDate: Timestamp.fromDate(formationDate),
            }
          : {}),

        ...(ein
          ? {
              ein,
            }
          : {}),

        ...(registrationNumber
          ? {
              registrationNumber,
            }
          : {}),

        ...(industry
          ? {
              industry,
            }
          : {}),

        ...(naicsCode
          ? {
              naicsCode,
            }
          : {}),

        /**
         * Centralized address relationship.
         */
        locationId,

        status,
      };

      // ========================================================
      // CREATE OR UPDATE BUSINESS
      // ========================================================

      if (selectedBusiness) {
        await this.store.updateBusiness(selectedBusiness.id, businessData);

        this.toast.success('Business profile updated successfully.');
      } else {
        await this.store.createBusiness(businessData);

        this.toast.success('Business profile created successfully.');
      }

      // --------------------------------------------------------
      // Refresh BusinessStore
      // --------------------------------------------------------

      await this.store.loadBusinessData();

      this.toast.success('Business profile saved successfully.');

      await this.router.navigate(['/admin/business'], {
        queryParams: { tab: 'settings' },
      });
    } catch (error) {
      console.error('Failed to save business profile:', error);

      // --------------------------------------------------------
      // Roll back a newly-created location if the business
      // itself could not be saved.
      //
      // This prevents orphaned locations when creating a new
      // business fails after the location has already succeeded.
      // --------------------------------------------------------

      if (newlyCreatedLocationId) {
        try {
          await this.locationService.deleteLocation(newlyCreatedLocationId);
        } catch (rollbackError) {
          console.error('Failed to roll back newly created location:', rollbackError);
        }
      }

      this.toast.error(error instanceof Error ? error.message : 'Unable to save business profile.');
    }
  }

  // ============================================================
  // BUILD LOCATION
  // ============================================================

  private buildLocation(
    address: string,
    city: string,
    county: string,
    state: string,
    postalCode: string,
    country: string,
  ): Location {
    /**
     * The existing Location model contains both zipCode and
     * postalCode. The current LocationService/admin implementation
     * uses zipCode as the primary field, so we use zipCode here.
     */
    const location = {
      address,

      city,

      state,

      zipCode: postalCode,

      country,
    } as Location;

    /**
     * Preserve county in the centralized location record.
     *
     * The current Location interface does not explicitly expose
     * county, but the existing location administration code
     * already reads/writes county values.
     */
    if (county) {
      (
        location as Location & {
          county?: string;
        }
      ).county = county;
    }

    return location;
  }
}

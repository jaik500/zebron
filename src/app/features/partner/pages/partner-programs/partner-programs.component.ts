import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatMenuModule,
} from '@angular/material/menu';

import {
  HotToastService,
} from '@ngxpert/hot-toast';

import {
  TestProgram,
} from '../../../../features/test-center/models/test-program.model';

import {
  TestProgramService,
} from '../../../../features/test-center/services/test-program.service';

import {
  PartnerOrganizationContextService,
} from '../../../../core/services/partner-organization-context.service';

import {
  PartnerAccessService,
} from '../../../../core/services/partner-access.service';

import {
  PageTitleService,
} from '../../../../core/services/page-title.service';

interface ProgramForm {
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-partner-programs',

  standalone: true,

  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    <div
      class="min-h-screen bg-gray-50 mt-16"
    >

      <!-- ===================================================== -->
      <!-- HEADER -->
      <!-- ===================================================== -->

      <header
        class="border-b border-white/10 bg-[#2a835f]"
      >

        <div
          class="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8"
        >

          <div
            class="flex items-start justify-between gap-4"
          >

            <div class="min-w-0">

              <div
                class="flex items-center gap-2 text-sm text-white/60"
              >

                <a
                  routerLink="/partner/dashboard"
                  class="hover:text-white"
                >
                  Partner Dashboard
                </a>

                <span>/</span>

                <span class="text-white/90">
                  Programs
                </span>

              </div>



              <p
                class=" max-w-2xl text-sm text-white/70"
              >
                Organize your organization's courses
                into training programs and learning paths.
              </p>

            </div>


            <!-- HEADER ACTIONS -->

            <div
              class="hidden items-center gap-2 sm:flex"
            >

              <a
                routerLink="/partner/dashboard"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >

                <mat-icon>
                  arrow_back
                </mat-icon>

                Dashboard

              </a>

              <button
                type="button"
                (click)="startNewProgram()"
                [disabled]="saving()"
                class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <mat-icon>
                  add
                </mat-icon>

                Create Program

              </button>

            </div>


            <!-- MOBILE MENU -->

            <div class="sm:hidden">

              <button
                type="button"
                mat-icon-button
                [matMenuTriggerFor]="programMenu"
                class="!text-white"
                aria-label="Programs menu"
              >

                <mat-icon>
                  more_vert
                </mat-icon>

              </button>

              <mat-menu
                #programMenu="matMenu"
              >

                <a
                  mat-menu-item
                  routerLink="/partner/dashboard"
                >
                  <mat-icon>
                    dashboard
                  </mat-icon>

                  <span>
                    Dashboard
                  </span>
                </a>

                <a
                  mat-menu-item
                  routerLink="/partner/test-center"
                >
                  <mat-icon>
                    quiz
                  </mat-icon>

                  <span>
                    Test Center
                  </span>
                </a>

                <button
                  type="button"
                  mat-menu-item
                  (click)="startNewProgram()"
                  [disabled]="saving()"
                >
                  <mat-icon>
                    add
                  </mat-icon>

                  <span>
                    Create Program
                  </span>
                </button>

              </mat-menu>

            </div>

          </div>

        </div>

      </header>


      <!-- ===================================================== -->
      <!-- MAIN -->
      <!-- ===================================================== -->

      <main
        class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      >

        <!-- =================================================== -->
        <!-- CONTEXT LOADING -->
        <!-- =================================================== -->

        @if (context.loading()) {

          <section
            class="rounded-xl border border-gray-200 bg-white p-10 text-center"
          >

            <mat-icon
              class="!h-8 !w-8 !text-3xl text-gray-400"
            >
              sync
            </mat-icon>

            <p
              class="mt-3 text-sm text-gray-600"
            >
              Loading your organization...
            </p>

          </section>

        }

        <!-- =================================================== -->
        <!-- ERROR -->
        <!-- =================================================== -->

        @else if (context.error()) {

          <section
            class="rounded-xl border border-red-200 bg-red-50 p-6"
          >

            <div
              class="flex gap-3"
            >

              <mat-icon
                class="text-red-600"
              >
                error_outline
              </mat-icon>

              <div>

                <h2
                  class="font-semibold text-red-900"
                >
                  Partner access unavailable
                </h2>

                <p
                  class="mt-1 text-sm text-red-700"
                >
                  {{ context.error() }}
                </p>

              </div>

            </div>

          </section>

        }

        @else {

          <!-- ================================================= -->
          <!-- ORGANIZATION SUMMARY -->
          <!-- ================================================= -->




          <!-- ================================================= -->
          <!-- PROGRAM FORM -->
          <!-- ================================================= -->

          @if (showForm()) {

            <section
              class="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >

              <div
                class="flex items-start justify-between gap-4"
              >

                <div>

                  <p
                    class="text-xs font-semibold uppercase tracking-wider text-[#007979]"
                  >
                    {{ editingProgramId()
                      ? 'Edit program'
                      : 'New program' }}
                  </p>

                  <h2
                    class="mt-1 text-xl font-bold text-gray-900"
                  >
                    {{
                      editingProgramId()
                        ? form.name || 'Edit program'
                        : 'Create your program'
                    }}
                  </h2>

                  <p
                    class="mt-1 text-sm text-gray-500"
                  >
                    This program belongs exclusively to
                    {{ organizationName() }}.
                  </p>

                </div>


                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                  aria-label="Close program form"
                >

                  <mat-icon>
                    close
                  </mat-icon>

                </button>

              </div>


              <!-- FORM -->

              <div
                class="mt-6 grid gap-5 md:grid-cols-2"
              >

                <!-- NAME -->

                <label class="block">

                  <span
                    class="text-sm font-medium text-gray-700"
                  >
                    Program name
                  </span>

                  <input
                    [(ngModel)]="form.name"
                    (ngModelChange)="onNameChange()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/10"
                    placeholder="e.g. ServiceNow Certification Program"
                  />

                </label>


                <!-- SLUG -->

                <label class="block">

                  <span
                    class="text-sm font-medium text-gray-700"
                  >
                    Slug
                  </span>

                  <input
                    [(ngModel)]="form.slug"
                    [disabled]="!!editingProgramId()"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#007979] disabled:bg-gray-100"
                    placeholder="servicenow-certification-program"
                  />

                  @if (editingProgramId()) {

                    <p
                      class="mt-1 text-xs text-gray-500"
                    >
                      Program slugs cannot be changed
                      after creation.
                    </p>

                  }

                </label>


                <!-- DESCRIPTION -->

                <label
                  class="block md:col-span-2"
                >

                  <span
                    class="text-sm font-medium text-gray-700"
                  >
                    Description
                  </span>

                  <textarea
                    [(ngModel)]="form.description"
                    rows="4"
                    class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#007979] focus:ring-2 focus:ring-[#007979]/10"
                    placeholder="Describe the purpose and learning path for this program."
                  ></textarea>

                </label>


                <!-- ACTIVE -->

                <label
                  class="flex items-center gap-3"
                >

                  <input
                    type="checkbox"
                    [(ngModel)]="form.active"
                    class="h-4 w-4 rounded border-gray-300"
                  />

                  <span
                    class="text-sm font-medium text-gray-700"
                  >
                    Program is active
                  </span>

                </label>

              </div>


              <!-- FORM ACTIONS -->

              <div
                class="mt-6 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5"
              >

                <button
                  type="button"
                  (click)="cancelForm()"
                  class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  (click)="saveProgram()"
                  [disabled]="saving()"
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-[#007979] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  @if (saving()) {

                    Saving...

                  } @else {

                    <mat-icon>
                      save
                    </mat-icon>

                    {{
                      editingProgramId()
                        ? 'Save Changes'
                        : 'Create Program'
                    }}

                  }

                </button>

              </div>

            </section>

          }


          <!-- ================================================= -->
          <!-- PROGRAM DIRECTORY -->
          <!-- ================================================= -->

          <section>

            <div
              class="mb-4 flex items-end justify-between gap-4"
            >

              <div>

                <h2
                  class="text-xl font-bold text-gray-900"
                >
                  Programs
                </h2>

                <p
                  class="mt-1 text-sm text-gray-500"
                >
                  Organize courses into reusable training
                  paths for your organization.
                </p>

              </div>

              @if (loadingPrograms()) {

                <span
                  class="text-sm text-gray-500"
                >
                  Loading...
                </span>

              }

            </div>


            <!-- EMPTY -->

            @if (
              !loadingPrograms() &&
              programs().length === 0
            ) {

              <div
                class="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center"
              >

                <mat-icon
                  class="!h-10 !w-10 !text-4xl text-gray-400"
                >
                  account_tree
                </mat-icon>

                <h3
                  class="mt-3 font-semibold text-gray-900"
                >
                  No programs yet
                </h3>

                <p
                  class="mx-auto mt-1 max-w-md text-sm text-gray-500"
                >
                  Create your first program and then
                  assign organization courses to it.
                </p>

                @if (access.canManagePrograms()) {

                  <button
                    type="button"
                    (click)="startNewProgram()"
                    class="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-[#007979] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >

                    <mat-icon>
                      add
                    </mat-icon>

                    Create Program

                  </button>

                }

              </div>

            }

            <!-- PROGRAMS -->

            @else if (!loadingPrograms()) {

              <div
                class="grid gap-4 lg:grid-cols-2"
              >

                @for (
                  program of programs();
                  track program.id
                ) {

                  <article
                    class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >

                    <div
                      class="flex items-start justify-between gap-4"
                    >

                      <div class="min-w-0">

                        <div
                          class="flex flex-wrap items-center gap-2"
                        >

                          <h3
                            class="text-lg font-bold text-gray-900"
                          >
                            {{ program.name }}
                          </h3>

                          <span
                            class="rounded-full px-2 py-0.5 text-xs font-semibold"
                            [class.bg-green-100]="program.active"
                            [class.text-green-700]="program.active"
                            [class.bg-gray-100]="!program.active"
                            [class.text-gray-600]="!program.active"
                          >
                            {{
                              program.active
                                ? 'Active'
                                : 'Inactive'
                            }}
                          </span>

                        </div>

                        <p
                          class="mt-2 text-sm text-gray-500"
                        >
                          {{
                            program.description ||
                              'No description.'
                          }}
                        </p>

                      </div>


                      @if (
                        access.canManagePrograms()
                      ) {

                        <button
                          type="button"
                          (click)="editProgram(program)"
                          class="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                          aria-label="Edit program"
                        >

                          <mat-icon>
                            edit
                          </mat-icon>

                        </button>

                      }

                    </div>


                    <!-- DETAILS -->

                    <div
                      class="mt-4 grid grid-cols-2 gap-3"
                    >

                      <div
                        class="rounded-lg bg-gray-50 p-3"
                      >

                        <p
                          class="text-xs text-gray-500"
                        >
                          Courses
                        </p>

                        <p
                          class="mt-1 font-semibold text-gray-900"
                        >
                          {{ program.courseCount }}
                        </p>

                      </div>

                      <div
                        class="rounded-lg bg-gray-50 p-3"
                      >

                        <p
                          class="text-xs text-gray-500"
                        >
                          Slug
                        </p>

                        <p
                          class="mt-1 truncate font-medium text-gray-900"
                        >
                          {{ program.slug }}
                        </p>

                      </div>

                    </div>


                    <!-- ACTION -->

                    <div
                      class="mt-4 border-t border-gray-100 pt-4"
                    >

                      <a
                        mat-stroked-button
                        routerLink="/partner/test-center"
                        [queryParams]="{
                          programId: program.id
                        }"
                      >

                        <mat-icon>
                          school
                        </mat-icon>

                        View Courses

                      </a>

                    </div>

                  </article>

                }

              </div>

            }

          </section>

        }

      </main>

    </div>
  `,
})
export class PartnerProgramsComponent
  implements OnInit
{
  // ============================================================
  // SERVICES
  // ============================================================

  protected readonly context =
    inject(
      PartnerOrganizationContextService,
    );

  protected readonly access =
    inject(
      PartnerAccessService,
    );

  private readonly programService =
    inject(
      TestProgramService,
    );

  private readonly router =
    inject(Router);

  private readonly toast =
    inject(HotToastService);

  private readonly pageTitleService =
    inject(PageTitleService);


  // ============================================================
  // STATE
  // ============================================================

  protected readonly programs =
    signal<TestProgram[]>([]);

  protected readonly loadingPrograms =
    signal(false);

  protected readonly saving =
    signal(false);

  protected readonly showForm =
    signal(false);

  protected readonly editingProgramId =
    signal<string | null>(null);


  // ============================================================
  // COMPUTED
  // ============================================================

  protected readonly organizationName =
    computed(
      () =>
        this.context.organization()?.name ??
        'Partner',
    );


  // ============================================================
  // FORM
  // ============================================================

  protected form: ProgramForm =
    this.createEmptyForm();


  // ============================================================
  // INITIALIZATION
  // ============================================================

  async ngOnInit(): Promise<void> {
    await this.initialize();

    this.pageTitleService.setTitle(
      `${this.organizationName()} Programs`,
    );
  }


  protected async initialize(): Promise<void> {
    try {
      await this.context.initialize();

      if (
        !this.access.canManagePrograms() &&
        !this.access.isPlatformAdmin()
      ) {
        await this.router.navigate([
          '/partner/dashboard',
        ]);

        return;
      }

      await this.loadPrograms();

    } catch {
      /*
       * PartnerOrganizationContextService
       * exposes the user-facing error state.
       */
    }
  }


  // ============================================================
  // LOAD
  // ============================================================

  private async loadPrograms(): Promise<void> {
    const organizationId =
      this.context.organizationId();

    if (!organizationId) {
      this.programs.set([]);

      return;
    }

    try {
      this.loadingPrograms.set(true);

      const programs =
        await this.programService
          .getOrganizationPrograms(
            organizationId,
          );

      this.programs.set(programs);

    } catch (error) {
      this.programs.set([]);

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load programs.';

      this.toast.error(message);

    } finally {
      this.loadingPrograms.set(false);
    }
  }


  // ============================================================
  // CREATE
  // ============================================================

  protected startNewProgram(): void {
    if (
      !this.access.canManagePrograms()
    ) {
      this.toast.error(
        'You do not have permission to manage programs.',
      );

      return;
    }

    if (
      !this.context.organizationId()
    ) {
      this.toast.error(
        'No partner organization is selected.',
      );

      return;
    }

    this.editingProgramId.set(
      null,
    );

    this.form =
      this.createEmptyForm();

    this.showForm.set(true);
  }


  // ============================================================
  // EDIT
  // ============================================================

  protected editProgram(
    program: TestProgram,
  ): void {
    if (
      !this.access.canManagePrograms()
    ) {
      this.toast.error(
        'You do not have permission to manage programs.',
      );

      return;
    }

    this.editingProgramId.set(
      program.id,
    );

    this.form = {
      name: program.name ?? '',
      slug: program.slug ?? '',
      description:
        program.description ?? '',
      active:
        program.active === true,
    };

    this.showForm.set(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  // ============================================================
  // NAME → SLUG
  // ============================================================

  protected onNameChange(): void {
    if (
      this.editingProgramId()
    ) {
      return;
    }

    this.form.slug =
      this.slugify(
        this.form.name,
      );
  }


  // ============================================================
  // SAVE
  // ============================================================

  protected async saveProgram(): Promise<void> {
    if (
      !this.access.canManagePrograms()
    ) {
      this.toast.error(
        'You do not have permission to manage programs.',
      );

      return;
    }

    const organizationId =
      this.context.organizationId();

    if (!organizationId) {
      this.toast.error(
        'No partner organization is selected.',
      );

      return;
    }

    const validationError =
      this.validateForm();

    if (validationError) {
      this.toast.error(
        validationError,
      );

      return;
    }

    try {
      this.saving.set(true);

      const editingId =
        this.editingProgramId();

      if (editingId) {

        await this.programService
          .updateProgram(
            organizationId,
            editingId,
            {
              name:
                this.form.name.trim(),

              description:
                this.form.description.trim(),

              active:
                this.form.active,
            },
          );

        this.toast.success(
          'Program updated successfully.',
        );

      } else {

        await this.programService
          .createProgram(
            organizationId,
            {
              name:
                this.form.name.trim(),

              slug:
                this.form.slug.trim(),

              description:
                this.form.description.trim(),

              active:
                this.form.active,
            },
          );

        this.toast.success(
          'Program created successfully.',
        );
      }

      await this.loadPrograms();

      this.cancelForm();

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save the program.';

      this.toast.error(
        message,
      );

    } finally {
      this.saving.set(false);
    }
  }


  // ============================================================
  // CANCEL
  // ============================================================

  protected cancelForm(): void {
    this.showForm.set(false);

    this.editingProgramId.set(
      null,
    );

    this.form =
      this.createEmptyForm();
  }


  // ============================================================
  // VALIDATION
  // ============================================================

  private validateForm(): string | null {
    if (
      !this.form.name.trim()
    ) {
      return 'Program name is required.';
    }

    if (
      !this.form.slug.trim()
    ) {
      return 'Program slug is required.';
    }

    if (
      this.form.slug.trim().length < 3
    ) {
      return 'Program slug must contain at least 3 characters.';
    }

    return null;
  }


  // ============================================================
  // EMPTY FORM
  // ============================================================

  private createEmptyForm(): ProgramForm {
    return {
      name: '',
      slug: '',
      description: '',
      active: true,
    };
  }


  // ============================================================
  // SLUG
  // ============================================================

  private slugify(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '');
  }
}
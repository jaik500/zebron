import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import { getAuth } from 'firebase/auth';

import { HotToastService } from '@ngxpert/hot-toast';

import { SubmissionService } from '../../../../core/services/submission.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-submit-resource',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],

  template: `
    <main class="min-h-screen bg-gray-50">

      <!-- =====================================================
           Zebron Header
           ===================================================== -->
      <section
        class="bg-[#032D42] px-4 py-8
               text-white sm:px-6
               lg:px-8"
      >

        <div class="mx-auto max-w-5xl">

          <!-- Top navigation -->
          <div
            class="flex items-center
                   justify-between gap-4"
          >

            <a
              routerLink="/resources"
              class="text-sm font-semibold
                     text-white/90
                     transition
                     hover:text-white"
            >
              ← Resource Directory
            </a>

            <div
              class="rounded-full
                     border border-white/20
                     bg-white/10
                     px-3 py-1.5
                     text-xs font-semibold
                     text-[#7DD3D3]"
            >
              Zebron Community
            </div>

          </div>


          <!-- Header content -->
          <div class="mt-8 max-w-3xl">

            <p
              class="text-xs font-bold
                     uppercase tracking-[0.18em]
                     text-[#7DD3D3]
                     sm:text-sm"
            >
              Help grow the directory
            </p>

            <h1
              class="mt-2 text-3xl font-bold
                     tracking-tight text-white
                     sm:text-4xl lg:text-5xl"
            >
              Submit a Resource
            </h1>

            <p
              class="mt-4 max-w-2xl
                     text-sm leading-6
                     text-blue-100
                     sm:text-lg sm:leading-7"
            >
              Know about a helpful organization,
              service, program, or tool? Share it
              with the Zebron community.
            </p>

            <!-- Brand accent -->
            <div
              class="mt-6 h-1 w-16
                     rounded-full
                     bg-[#007979]"
            ></div>

          </div>

        </div>

      </section>


      <!-- =====================================================
           Main Content
           ===================================================== -->
      <div
        class="mx-auto max-w-5xl
               px-4 py-8
               sm:px-6 sm:py-10
               lg:px-8"
      >

        <!-- ===================================================
             Review Information
             =================================================== -->
        <section
          class="rounded-2xl
                 border border-[#007979]/20
                 bg-[#007979]/5
                 p-5 sm:p-6"
        >

          <div
            class="flex gap-4"
          >

            <!-- Information icon -->
            <div
              class="flex h-10 w-10
                     shrink-0 items-center
                     justify-center
                     rounded-full
                     bg-[#007979]
                     text-lg font-bold
                     text-white"
            >
              i
            </div>

            <div>

              <h2
                class="text-base font-bold
                       text-[#032D42]"
              >
                How submissions work
              </h2>

              <p
                class="mt-1 text-sm
                       leading-6 text-gray-600"
              >
                Your submission will be reviewed by
                the Zebron team before it appears in
                the public resource directory.
              </p>

              <p
                class="mt-2 text-sm
                       font-medium
                       text-[#032D42]"
              >
                Please provide accurate and useful
                information about the resource.
              </p>

            </div>

          </div>

        </section>


        <!-- ===================================================
             Form
             =================================================== -->
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="mt-6 overflow-hidden
                 rounded-2xl
                 border border-gray-200
                 bg-white shadow-sm"
        >

          <!-- =================================================
               Resource Information
               ================================================= -->
          <section
            class="border-b border-gray-200
                   p-5 sm:p-8"
          >

            <div>
              <p
                class="text-xs font-bold
                       uppercase tracking-wide
                       text-[#007979]"
              >
                Step 1
              </p>

              <h2
                class="mt-1 text-xl font-bold
                       text-[#032D42]"
              >
                Resource Information
              </h2>

              <p
                class="mt-1 text-sm
                       text-gray-500"
              >
                Tell us about the resource you
                would like to recommend.
              </p>
            </div>


            <div
              class="mt-7 space-y-6"
            >

              <!-- =================================================
                   Resource Name
                   ================================================= -->
              <div>

                <label
                  for="resourceName"
                  class="mb-2 block
                         text-sm font-semibold
                         text-gray-700"
                >
                  Resource Name
                  <span class="text-red-600">
                    *
                  </span>
                </label>

                <input
                  id="resourceName"
                  type="text"
                  formControlName="resourceName"
                  placeholder="Example: Community Food Bank"
                  autocomplete="organization"
                  class="w-full rounded-xl
                         border border-gray-300
                         bg-white px-4 py-3
                         text-sm text-gray-900
                         outline-none
                         transition
                         placeholder:text-gray-400
                         hover:border-gray-400
                         focus:border-[#007979]
                         focus:ring-4
                         focus:ring-[#007979]/10"
                  [class.border-red-400]="
                    isInvalid('resourceName')
                  "
                />

                @if (
                  isInvalid('resourceName')
                ) {
                  <p
                    class="mt-2 text-sm
                           text-red-600"
                  >
                    Resource name is required.
                  </p>
                }

              </div>


              <!-- =================================================
                   Description
                   ================================================= -->
              <div>

                <label
                  for="description"
                  class="mb-2 block
                         text-sm font-semibold
                         text-gray-700"
                >
                  Description
                  <span class="text-red-600">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  formControlName="description"
                  rows="6"
                  placeholder="Describe what this resource provides, who it helps, and any important details users should know."
                  class="w-full resize-y
                         rounded-xl
                         border border-gray-300
                         bg-white px-4 py-3
                         text-sm text-gray-900
                         outline-none
                         transition
                         placeholder:text-gray-400
                         hover:border-gray-400
                         focus:border-[#007979]
                         focus:ring-4
                         focus:ring-[#007979]/10"
                  [class.border-red-400]="
                    isInvalid('description')
                  "
                ></textarea>

                <div
                  class="mt-2 flex
                         justify-between gap-4"
                >

                  @if (
                    isInvalid('description')
                  ) {
                    <p
                      class="text-sm
                             text-red-600"
                    >
                      Description is required.
                    </p>
                  } @else {
                    <p
                      class="text-xs
                             text-gray-500"
                    >
                      Provide enough detail to help
                      someone decide whether this
                      resource is right for them.
                    </p>
                  }

                  <span
                    class="shrink-0 text-xs
                           text-gray-400"
                  >
                    {{ form.controls.description.value.length }}/3000
                  </span>

                </div>

              </div>


              <!-- =================================================
                   Website
                   ================================================= -->
              <div>

                <label
                  for="website"
                  class="mb-2 block
                         text-sm font-semibold
                         text-gray-700"
                >
                  Website
                </label>

                <input
                  id="website"
                  type="url"
                  formControlName="website"
                  placeholder="https://example.org"
                  autocomplete="url"
                  class="w-full rounded-xl
                         border border-gray-300
                         bg-white px-4 py-3
                         text-sm text-gray-900
                         outline-none
                         transition
                         placeholder:text-gray-400
                         hover:border-gray-400
                         focus:border-[#007979]
                         focus:ring-4
                         focus:ring-[#007979]/10"
                  [class.border-red-400]="
                    isInvalid('website')
                  "
                />

                @if (
                  isInvalid('website')
                ) {
                  <p
                    class="mt-2 text-sm
                           text-red-600"
                  >
                    Please enter a valid website
                    beginning with http:// or https://.
                  </p>
                }

              </div>


              <!-- =================================================
                   Category / Organization
                   ================================================= -->
              <div
                class="grid gap-6
                       sm:grid-cols-2"
              >

                <!-- Category -->
                <div>

                  <label
                    for="categoryId"
                    class="mb-2 block
                           text-sm font-semibold
                           text-gray-700"
                  >
                    Category
                  </label>

                  <select
                    id="categoryId"
                    formControlName="categoryId"
                    class="w-full rounded-xl
                           border border-gray-300
                           bg-white px-4 py-3
                           text-sm text-gray-900
                           outline-none
                           transition
                           hover:border-gray-400
                           focus:border-[#007979]
                           focus:ring-4
                           focus:ring-[#007979]/10"
                  >

                    <option value="">
                      Select a category
                    </option>

                    @for (
                      category of categories();
                      track category.id
                    ) {
                      <option
                        [value]="category.id"
                      >
                        {{ category.name }}
                      </option>
                    }

                  </select>

                </div>


                <!-- Organization -->
                <div>

                  <label
                    for="organizationName"
                    class="mb-2 block
                           text-sm font-semibold
                           text-gray-700"
                  >
                    Organization Name
                  </label>

                  <input
                    id="organizationName"
                    type="text"
                    formControlName="organizationName"
                    placeholder="Organization or provider"
                    autocomplete="organization"
                    class="w-full rounded-xl
                           border border-gray-300
                           bg-white px-4 py-3
                           text-sm text-gray-900
                           outline-none
                           transition
                           placeholder:text-gray-400
                           hover:border-gray-400
                           focus:border-[#007979]
                           focus:ring-4
                           focus:ring-[#007979]/10"
                  />

                </div>

              </div>

            </div>

          </section>


          <!-- =================================================
               Submitter Information
               ================================================= -->
          <section
            class="border-b border-gray-200
                   p-5 sm:p-8"
          >

            <p
              class="text-xs font-bold
                     uppercase tracking-wide
                     text-[#007979]"
            >
              Step 2
            </p>

            <h2
              class="mt-1 text-xl font-bold
                     text-[#032D42]"
            >
              Your Information
            </h2>

            <p
              class="mt-1 text-sm
                     text-gray-500"
            >
              We'll associate your submission with
              your Zebron account.
            </p>


            <div class="mt-7">

              <label
                for="submitterEmail"
                class="mb-2 block
                       text-sm font-semibold
                       text-gray-700"
              >
                Email
              </label>

              <input
                id="submitterEmail"
                type="email"
                formControlName="submitterEmail"
                placeholder="you@example.com"
                autocomplete="email"
                class="w-full rounded-xl
                       border border-gray-300
                       bg-white px-4 py-3
                       text-sm text-gray-900
                       outline-none
                       transition
                       placeholder:text-gray-400
                       hover:border-gray-400
                       focus:border-[#007979]
                       focus:ring-4
                       focus:ring-[#007979]/10"
                [class.border-red-400]="
                  isInvalid('submitterEmail')
                "
              />

              @if (
                isInvalid('submitterEmail')
              ) {
                <p
                  class="mt-2 text-sm
                         text-red-600"
                >
                  Please enter a valid email address.
                </p>
              }

              <div
                class="mt-4 rounded-xl
                       border border-[#032D42]/10
                       bg-[#032D42]/5
                       p-4"
              >

                <p
                  class="text-sm leading-6
                         text-gray-600"
                >
                  Your account information is used
                  only to associate you with this
                  submission and allow our team to
                  follow up if necessary.
                </p>

              </div>

            </div>

          </section>


          <!-- =================================================
               Submission Review Notice
               ================================================= -->
          <section
            class="border-b border-gray-200
                   bg-gray-50 p-5 sm:p-8"
          >

            <div
              class="rounded-xl
                     border border-[#007979]/20
                     bg-white p-4"
            >

              <div
                class="flex items-start gap-3"
              >

                <div
                  class="flex h-8 w-8
                         shrink-0 items-center
                         justify-center
                         rounded-full
                         bg-[#007979]
                         text-sm font-bold
                         text-white"
                >
                  ✓
                </div>

                <div>

                  <h3
                    class="text-sm font-bold
                           text-[#032D42]"
                  >
                    Before you submit
                  </h3>

                  <p
                    class="mt-1 text-sm
                           leading-6
                           text-gray-600"
                  >
                    Please make sure the resource
                    information is accurate. Your
                    submission will be marked as
                    pending until an administrator
                    reviews it.
                  </p>

                </div>

              </div>

            </div>

          </section>


          <!-- =================================================
               Form Actions
               ================================================= -->
          <section
            class="flex flex-col-reverse
                   gap-3 p-5
                   sm:flex-row
                   sm:justify-between
                   sm:p-8"
          >

            <a
              routerLink="/resources"
              class="rounded-xl
                     border border-gray-300
                     bg-white px-6 py-3
                     text-center text-sm
                     font-semibold
                     text-[#032D42]
                     transition
                     hover:border-[#032D42]
                     hover:bg-[#032D42]/5"
            >
              Cancel
            </a>


            <button
              type="submit"
              [disabled]="
                submitting() ||
                form.invalid
              "
              class="rounded-xl
                     bg-[#007979]
                     px-7 py-3
                     text-sm font-bold
                     text-white
                     shadow-sm
                     transition
                     hover:bg-[#006666]
                     focus:outline-none
                     focus:ring-4
                     focus:ring-[#007979]/20
                     disabled:cursor-not-allowed
                     disabled:opacity-50"
            >

              @if (submitting()) {

                <span
                  class="flex items-center
                         justify-center gap-2"
                >

                  <span
                    class="h-4 w-4
                           animate-spin
                           rounded-full
                           border-2
                           border-white/40
                           border-t-white"
                  ></span>

                  Submitting...

                </span>

              } @else {

                Submit Resource

              }

            </button>

          </section>

        </form>


        <!-- ===================================================
             Footer Help
             =================================================== -->
        <div
          class="mt-6 text-center"
        >

          <p
            class="text-sm text-gray-500"
          >
            Looking for resources instead?
            <a
              routerLink="/resources"
              class="font-semibold
                     text-[#007979]
                     hover:text-[#006666]"
            >
              Browse the Resource Directory
            </a>
          </p>

        </div>

      </div>

    </main>
  `,
})
export class SubmitResourceComponent
  implements OnInit {

  private readonly fb =
    inject(FormBuilder);

  private readonly router =
    inject(Router);

  private readonly toast =
    inject(HotToastService);

  private readonly submissionService =
    inject(SubmissionService);

  private readonly categoryService =
    inject(CategoryService);


  /**
   * Available active categories.
   */
  readonly categories =
    signal<Category[]>([]);


  /**
   * Prevents duplicate submissions.
   */
  readonly submitting =
    signal(false);


  /**
   * Resource submission form.
   */
  readonly form =
    this.fb.nonNullable.group({

      resourceName: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
        ],
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(3000),
        ],
      ],

      website: [
        '',
        [
          Validators.pattern(
            /^https?:\/\/.+/i
          ),
        ],
      ],

      categoryId: [''],

      organizationName: [
        '',
        Validators.maxLength(150),
      ],

      submitterEmail: [
        '',
        Validators.email,
      ],
    });


  /**
   * Load form data when the page initializes.
   */
  ngOnInit(): void {
    this.loadCategories();
    this.loadCurrentUserEmail();
  }


  /**
   * Load active categories for the form.
   */
  private async loadCategories(): Promise<void> {
    try {

      const categories =
        await this.categoryService
          .getActiveCategories();

      this.categories.set(
        categories
      );

    } catch (error) {

      console.error(
        'Failed to load categories:',
        error
      );

      this.toast.error(
        'Unable to load categories.'
      );
    }
  }


  /**
   * Pre-fill the email field using
   * the currently authenticated user.
   */
  private loadCurrentUserEmail(): void {

    const user =
      getAuth().currentUser;

    if (
      user?.email &&
      !this.form.controls.submitterEmail.value
    ) {

      this.form.controls.submitterEmail
        .setValue(user.email);

    }
  }


  /**
   * Submit the resource for administrator review.
   */
  async submit(): Promise<void> {

    this.form.markAllAsTouched();

    if (this.form.invalid) {

      this.toast.error(
        'Please correct the highlighted fields.'
      );

      return;
    }


    const user =
      getAuth().currentUser;

    if (!user) {

      this.toast.error(
        'You must be signed in to submit a resource.'
      );

      await this.router.navigate([
        '/login',
      ]);

      return;
    }


    if (this.submitting()) {
      return;
    }


    this.submitting.set(true);

    try {

      const value =
        this.form.getRawValue();


      await this.submissionService
        .createSubmission({

          submittedBy:
            user.uid,

          resourceName:
            value.resourceName.trim(),

          description:
            value.description.trim(),

          website:
            value.website.trim() ||
            undefined,

          categoryId:
            value.categoryId ||
            undefined,

          organizationName:
            value.organizationName.trim() ||
            undefined,

          submitterEmail:
            value.submitterEmail.trim() ||
            user.email ||
            undefined,
        });


      this.toast.success(
        'Resource submitted successfully. It will be reviewed by our team.'
      );


      // Reset the form after a successful submission.
      this.form.reset();


      // Restore the authenticated user's email.
      if (user.email) {

        this.form.controls.submitterEmail
          .setValue(user.email);

      }


      // Return the user to the resource directory.
      await this.router.navigate([
        '/resources',
      ]);

    } catch (error) {

      console.error(
        'Failed to submit resource:',
        error
      );

      this.toast.error(
        'Unable to submit the resource. Please try again.'
      );

    } finally {

      this.submitting.set(false);

    }
  }


  /**
   * Determine whether a control should
   * display a validation error.
   */
  isInvalid(
    controlName: string
  ): boolean {

    const control =
      this.form.get(controlName);

    return !!control &&
      control.invalid &&
      control.touched;
  }
}
import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { HotToastService } from '@ngxpert/hot-toast';

import { ContactService } from '../../../../core/services/contact.service';
import {
  ContactMessage,
  ContactMessageStatus,
} from '../../../../core/models/contact-message.model';

import { ContactMessageService } from '../../../../core/services/contact-message.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-contact',
  standalone: true,

  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule],

  template: `
    <main class="min-h-screen bg-gray-50">
      <!-- =====================================================
           Zebron Contact Header
           ===================================================== -->
      <section
        class="bg-[#032D42]
         px-4 py-6
         text-white
         sm:px-6
         sm:py-7
         lg:px-8"
      >
        <div class="mx-auto max-w-5xl">
          <!-- Header row -->

          <div
            class="flex
             items-center
             justify-between
             gap-4"
          >
            <!-- Title -->

            <div class="min-w-0">
              <p
                class="text-xs
                 font-bold
                 uppercase
                 tracking-[0.18em]
                 text-[#7DD3D3]"
              >
                Get in touch
              </p>

              <h1
                class="mt-1.5
                 text-2xl
                 font-bold
                 tracking-tight
                 text-white
                 sm:text-3xl"
              >
                Contact Zebron
              </h1>
            </div>

            <!-- Resource Directory -->

            <a
              routerLink="/resources"
              class="shrink-0
               text-sm
               font-semibold
               text-white/80
               transition
               hover:text-[#12BFC3]"
            >
              ← Resource Directory
            </a>
          </div>

          <!-- Description -->

          <p
            class="mt-3
             max-w-2xl
             text-sm
             leading-5
             text-blue-100
             sm:text-base
             sm:leading-6"
          >
            Have a question, suggestion, partnership idea, or need help with something on Zebron?
            Send us a message.
          </p>

          <!-- Accent -->

          <div
            class="mt-4
             h-1
             w-12
             rounded-full
             bg-[#007979]"
          ></div>
        </div>
      </section>

      <!-- =====================================================
           Main Content
           ===================================================== -->
      <div
        class="mx-auto max-w-5xl
               px-4 py-8
               sm:px-6
               sm:py-10
               lg:px-8"
      >
        <div
          class="grid gap-6
                 lg:grid-cols-3"
        >
          <!-- =================================================
               Contact Information
               ================================================= -->
          <aside class="lg:col-span-1">
            <section
              class="rounded-2xl
                     border border-gray-200
                     bg-white
                     p-6
                     shadow-sm"
            >
              <p
                class="text-xs
                       font-bold
                       uppercase
                       tracking-wide
                       text-[#007979]"
              >
                Connect
              </p>

              <h2
                class="mt-1
                       text-xl
                       font-bold
                       text-[#032D42]"
              >
                We'd love to hear from you
              </h2>

              <p
                class="mt-3
                       text-sm
                       leading-6
                       text-gray-600"
              >
                Whether you're suggesting a resource, reporting an issue, exploring a partnership,
                or simply have a question, we're here to listen.
              </p>

              <!-- Resource suggestion -->
              <div
                class="mt-6
                       rounded-xl
                       border
                       border-[#007979]/20
                       bg-[#007979]/5
                       p-4"
              >
                <h3
                  class="text-sm
                         font-bold
                         text-[#032D42]"
                >
                  Have a resource to share?
                </h3>

                <p
                  class="mt-1
                         text-sm
                         leading-5
                         text-gray-600"
                >
                  Use our dedicated resource submission form so our team can review it.
                </p>

                <a
                  routerLink="/submit-resource"
                  class="mt-3
                         inline-flex
                         text-sm
                         font-bold
                         text-[#007979]
                         hover:text-[#006666]"
                >
                  Submit a resource →
                </a>
              </div>

              <!-- Help -->
              <div
                class="mt-4
                       rounded-xl
                       border
                       border-gray-200
                       bg-gray-50
                       p-4"
              >
                <h3
                  class="text-sm
                         font-bold
                         text-[#032D42]"
                >
                  Looking for resources?
                </h3>

                <p
                  class="mt-1
                         text-sm
                         leading-5
                         text-gray-600"
                >
                  Browse the Zebron Resource Directory to find organizations, programs, services,
                  and tools.
                </p>

                <a
                  routerLink="/resources"
                  class="mt-3
                         inline-flex
                         text-sm
                         font-bold
                         text-[#007979]
                         hover:text-[#006666]"
                >
                  Browse resources →
                </a>
              </div>
            </section>
          </aside>

          <!-- =================================================
               Contact Form
               ================================================= -->
          <section
            class="overflow-hidden
                   rounded-2xl
                   border border-gray-200
                   bg-white
                   shadow-sm
                   lg:col-span-2"
          >
            <!-- Form header -->
            <div
              class="border-b
                     border-gray-200
                     bg-[#032D42]
                     px-6 py-5
                     text-white
                     sm:px-8"
            >
              <p
                class="text-xs
                       font-bold
                       uppercase
                       tracking-wide
                       text-[#7DD3D3]"
              >
                Message
              </p>

              <h2
                class="mt-1
                       text-xl
                       font-bold"
              >
                Send us a message
              </h2>

              <p
                class="mt-1
                       text-sm
                       text-white/70"
              >
                Fields marked with
                <span class="text-[#7DD3D3]">*</span>
                are required.
              </p>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 sm:p-8">
              <div class="space-y-1">
                <!-- =================================================
                     Name
                     ================================================= -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Your name</mat-label>
                    <input matInput
                    id="name"
                    type="text"
                    formControlName="name"
                    autocomplete="name"
                    placeholder="Your name"
                  />
                    @if (invalid('name')) {
                      <mat-error>Please enter your name.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- =================================================
                     Email
                     ================================================= -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Email address</mat-label>
                    <input matInput
                    id="email"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                  />
                    @if (invalid('email')) {
                      <mat-error>Please enter a valid email address.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- =================================================
                     Subject
                     ================================================= -->
                <div>

                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Subject</mat-label>
                    <input matInput
                    id="subject"
                    type="text"
                    formControlName="subject"
                    placeholder="How can we help?"
                  />
                    @if (invalid('subject')) {
                      <mat-error>Please enter a subject.</mat-error>
                    }
                  </mat-form-field>
                </div>

                <!-- =================================================
                     Message
                     ================================================= -->
                <div>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Message</mat-label>
                    <textarea matInput
                    id="message"
                    formControlName="message"
                    rows="8"
                    maxlength="5000"
                    placeholder="Tell us how we can help..."
                  ></textarea>
                    @if (invalid('message')) {
                      <mat-error>Please enter a message.</mat-error>
                    }
                    <mat-hint align="end">{{ form.controls.message.value.length }}/5000</mat-hint>
                  </mat-form-field>
                </div>

                <!-- =================================================
                     Honeypot
                     ================================================= -->
                <div
                  class="absolute
                         left-[-9999px]
                         h-px
                         w-px
                         overflow-hidden"
                  aria-hidden="true"
                >
                  <label for="website"> Website </label>

                  <input
                    id="website"
                    type="text"
                    formControlName="website"
                    tabindex="-1"
                    autocomplete="off"
                  />
                </div>

                <!-- =================================================
                     Privacy notice
                     ================================================= -->
                <div
                  class="rounded-xl
                         border
                         border-[#032D42]/10
                         bg-[#032D42]/5
                         p-4"
                >
                  <p
                    class="text-sm
                           leading-6
                           text-gray-600"
                  >
                    Your message will be securely received by Zebron and used only to respond to
                    your inquiry.
                  </p>
                </div>

                <!-- =================================================
                     Submit
                     ================================================= -->
                <div
                  class="flex
                         flex-col-reverse
                         gap-3
                         sm:flex-row
                         sm:justify-end"
                >
                  <a
                    routerLink="/resources"
                    class="rounded-xl
                           border
                           border-gray-300
                           px-6 py-3
                           text-center
                           text-sm
                           font-semibold
                           text-[#032D42]
                           transition
                           hover:bg-gray-50"
                  >
                    Cancel
                  </a>

                  <button
                    type="submit"
                    [disabled]="submitting() || form.invalid"
                    class="rounded-xl
                           bg-[#007979]
                           px-7 py-3
                           text-sm
                           font-bold
                           text-white
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
                        class="flex
                               items-center
                               justify-center
                               gap-2"
                      >
                        <span
                          class="h-4 w-4
                                 animate-spin
                                 rounded-full
                                 border-2
                                 border-white/40
                                 border-t-white"
                        ></span>

                        Sending...
                      </span>
                    } @else {
                      Send Message
                    }
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  `,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  private readonly toast = inject(HotToastService);

  private readonly contactService = inject(ContactService);

  /**
   * Prevent duplicate submissions.
   */
  readonly submitting = signal(false);

  /**
   * Contact form.
   */
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],

    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],

    subject: ['', [Validators.required, Validators.maxLength(200)]],

    message: ['', [Validators.required, Validators.maxLength(5000)]],

    /**
     * Honeypot field.
     *
     * Humans never see or fill this field.
     */
    website: [''],
  });

  /**
   * Submit the contact message.
   */
  async submit(): Promise<void> {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.toast.error('Please complete the required fields.');

      return;
    }

    if (this.submitting()) {
      return;
    }

    const value = this.form.getRawValue();

    // Bots that fill the hidden honeypot
    // are silently rejected.
    if (value.website.trim()) {
      this.form.reset();
      return;
    }

    this.submitting.set(true);

    try {
      await this.contactService.sendMessage({
        name: value.name.trim(),
        email: value.email.trim(),
        subject: value.subject.trim(),
        message: value.message.trim(),
        website: '',
      });

      this.toast.success('Your message has been sent successfully.');

      this.form.reset();

      await this.router.navigate(['/resources']);
    } catch (error) {
      console.error('Failed to send contact message:', error);

      this.toast.error('Unable to send your message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Determine whether a form control
   * should display a validation error.
   */
  invalid(controlName: string): boolean {
    const control = this.form.get(controlName);

    return !!control && control.invalid && control.touched;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PageTitleService } from '../../../../../../core/services/page-title.service';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-create-content',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
  
    <div class="min-h-screen bg-slate-50 mt-16">
      <div class=" bg-[#2a835f] px-4 sm:px-6 lg:px-18">
          <div class=" flex items-center gap-2 text-sm text-white/80 ">
            <a
              routerLink="/admin/content-operations"
              class="transition hover:text-white"
            >
              Content & Operations
            </a>

            <span>/</span>

            <a
              routerLink="/admin/content-operations/content"
              class="transition hover:text-white"
            >
              Content
            </a>

            <span>/</span>

            <span class="text-white">
              Create
            </span>
          </div>

          <div>
                    <p class=" text-white">
              Create a content item for the Figure Out With J
              content pipeline.
            </p>
          </div>
        </div>
    <div class="mx-auto max-w-4xl px-4 py-2 sm:px-6 lg:px-8">

        <!-- Header -->
        

        <!-- Error -->
        @if (error()) {
          <div
            class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <div class="font-semibold">
              Unable to create content
            </div>

            <div class="mt-1">
              {{ error() }}
            </div>
          </div>
        }

        <!-- Form -->
        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="space-y-6"
        >

          <!-- Basic Information -->
          <section
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-slate-900">
                Basic Information
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                Define the core information for this content item.
              </p>
            </div>

            <div class="space-y-5">

              <!-- Title -->
              <div>
                <label
                  for="title"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Title
                  <span class="text-red-500">*</span>
                </label>

                <input
                  id="title"
                  type="text"
                  formControlName="title"
                  placeholder="e.g. How I Built a Notification System From Scratch"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                @if (
                  form.controls.title.touched &&
                  form.controls.title.invalid
                ) {
                  <p class="mt-2 text-sm text-red-600">
                    A title is required.
                  </p>
                }
              </div>

              <!-- Description -->
              <div>
                <label
                  for="description"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  rows="5"
                  formControlName="description"
                  placeholder="Describe the content and what the audience will learn."
                  class="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                ></textarea>
              </div>

              <!-- Category -->
              <div>
                <label
                  for="category"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>

                <input
                  id="category"
                  type="text"
                  formControlName="category"
                  placeholder="e.g. Tech, AI, Career, Business"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

            </div>
          </section>

          <!-- Content Configuration -->
          <section
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-slate-900">
                Content Configuration
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                Define what type of content this is and where it will
                be published.
              </p>
            </div>

            <div class="grid gap-5 md:grid-cols-2">

              <!-- Type -->
              <div>
                <label
                  for="type"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Content Type
                  <span class="text-red-500">*</span>
                </label>

                <select
                  id="type"
                  formControlName="type"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="video">
                    Video
                  </option>

                  <option value="short">
                    Short
                  </option>

                  <option value="post">
                    Post
                  </option>

                  <option value="article">
                    Article
                  </option>

                  <option value="tutorial">
                    Tutorial
                  </option>

                  <option value="image">
                    Image
                  </option>
                </select>
              </div>

              <!-- Platform -->
              <div>
                <label
                  for="platform"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Platform
                  <span class="text-red-500">*</span>
                </label>

                <select
                  id="platform"
                  formControlName="platform"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="youtube">
                    YouTube
                  </option>

                  <option value="youtube-short">
                    YouTube Shorts
                  </option>

                  <option value="instagram">
                    Instagram
                  </option>

                  <option value="tiktok">
                    TikTok
                  </option>

                  <option value="linkedin">
                    LinkedIn
                  </option>

                  <option value="website">
                    Website
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <!-- Status -->
              <div>
                <label
                  for="status"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Pipeline Status
                  <span class="text-red-500">*</span>
                </label>

                <select
                  id="status"
                  formControlName="status"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="idea">
                    Idea
                  </option>

                  <option value="planned">
                    Planned
                  </option>

                  <option value="capturing">
                    Capturing
                  </option>

                  <option value="scripting">
                    Scripting
                  </option>

                  <option value="editing">
                    Editing
                  </option>

                  <option value="review">
                    Review
                  </option>

                  <option value="ready">
                    Ready
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>

              <!-- Milestone -->
              <div>
                <label
                  for="milestoneId"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Milestone ID
                </label>

                <input
                  id="milestoneId"
                  type="text"
                  formControlName="milestoneId"
                  placeholder="Optional milestone ID"
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p class="mt-2 text-xs text-slate-500">
                  We will connect this to the milestone selector once
                  milestone CRUD is wired.
                </p>
              </div>

            </div>
          </section>

          <!-- Publishing -->
          <section
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-slate-900">
                Publishing & Storage
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                Optional links to your external content and storage
                locations.
              </p>
            </div>

            <div class="space-y-5">

              <!-- External Folder -->
              <div>
                <label
                  for="externalFolderUrl"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  External Folder URL
                </label>

                <input
                  id="externalFolderUrl"
                  type="url"
                  formControlName="externalFolderUrl"
                  placeholder="https://drive.google.com/..."
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p class="mt-2 text-xs text-slate-500">
                  Use this for the Google Drive, OneDrive, or other
                  external storage folder containing production assets.
                </p>
              </div>

              <!-- Published URL -->
              <div>
                <label
                  for="publishedUrl"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  Published URL
                </label>

                <input
                  id="publishedUrl"
                  type="url"
                  formControlName="publishedUrl"
                  placeholder="https://youtube.com/..."
                  class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />

                <p class="mt-2 text-xs text-slate-500">
                  Add this after the content has been published.
                </p>
              </div>

            </div>
          </section>

          <!-- Actions -->
          <div
            class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          >
            <a
              routerLink="/admin/content-operations/content"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </a>

            <button
              type="submit"
              [disabled]="saving()"
              class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              @if (saving()) {
                <span>
                  Creating...
                </span>
              } @else {
                <span>
                  Create Content
                </span>
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateContentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly pageTitleService =
    inject(PageTitleService);
  private readonly contentService =
    inject(ContentService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
      ],
    ],

    description: [
      '',
      Validators.maxLength(5000),
    ],

    type: [
      'video' as
        | 'video'
        | 'short'
        | 'post'
        | 'article'
        | 'tutorial'
        | 'image',
      Validators.required,
    ],

    platform: [
      'youtube' as
        | 'youtube'
        | 'youtube-short'
        | 'instagram'
        | 'tiktok'
        | 'linkedin'
        | 'website'
        | 'other',
      Validators.required,
    ],

    category: [
      '',
      Validators.maxLength(100),
    ],

    status: [
      'idea' as
        | 'idea'
        | 'planned'
        | 'capturing'
        | 'scripting'
        | 'editing'
        | 'review'
        | 'ready'
        | 'published'
        | 'archived',
      Validators.required,
    ],

    milestoneId: [
      '',
      Validators.maxLength(200),
    ],

    externalFolderUrl: [
      '',
      Validators.maxLength(1000),
    ],

    publishedUrl: [
      '',
      Validators.maxLength(1000),
    ],
  });

  constructor() {
    this.pageTitleService.setTitle(
      'Content & Ops | Create Content',
    );
  }

  /**
   * Save the content item to Firestore.
   */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const formValue = this.form.getRawValue();

      await this.contentService.createContent({
        title: formValue.title.trim(),

        description:
          formValue.description.trim(),

        type: formValue.type,

        platform: formValue.platform,

        category:
          formValue.category.trim(),

        status: formValue.status,

        milestoneId:
          formValue.milestoneId.trim(),

        externalFolderUrl:
          formValue.externalFolderUrl.trim(),

        publishedUrl:
          formValue.publishedUrl.trim(),

        captureIds: [],

        scheduledAt: null,

        publishedAt: null,
      });

      await this.router.navigate([
        '/admin/content-operations/content',
      ]);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to create content.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
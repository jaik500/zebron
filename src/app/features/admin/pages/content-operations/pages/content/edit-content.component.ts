import {
  ChangeDetectionStrategy,
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
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { PageTitleService } from '../../../../../../core/services/page-title.service';
import { ContentItem } from '../../models/content-operations.model';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-edit-content',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-4xl">

        <!-- Header -->
        <div class="mb-8">
          <div class="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <a
              routerLink="/admin/content-operations"
              class="transition hover:text-slate-900"
            >
              Content & Operations
            </a>

            <span>/</span>

            <a
              routerLink="/admin/content-operations/content"
              class="transition hover:text-slate-900"
            >
              Content
            </a>

            <span>/</span>

            <span class="text-slate-700">
              Edit
            </span>
          </div>

          <h1
            class="text-3xl font-bold tracking-tight text-slate-900"
          >
            Edit Content
          </h1>

          <p class="mt-2 text-slate-600">
            Update this content item's information and pipeline status.
          </p>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div
            class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
          >
            <div class="text-sm text-slate-500">
              Loading content...
            </div>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div
            class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <div class="font-semibold">
              Unable to load content
            </div>

            <div class="mt-1">
              {{ error() }}
            </div>
          </div>
        }

        @if (!loading() && content()) {
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
                  Update the core information for this content item.
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
                  Manage the content type, platform, and production status.
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
                    <option value="video">Video</option>
                    <option value="short">Short</option>
                    <option value="post">Post</option>
                    <option value="article">Article</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="image">Image</option>
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
                    <option value="youtube">YouTube</option>
                    <option value="youtube-short">
                      YouTube Shorts
                    </option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
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
                    <option value="idea">Idea</option>
                    <option value="planned">Planned</option>
                    <option value="capturing">Capturing</option>
                    <option value="scripting">Scripting</option>
                    <option value="editing">Editing</option>
                    <option value="review">Review</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
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
                  Manage external storage and published content links.
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
                  <span>Saving...</span>
                } @else {
                  <span>Save Changes</span>
                }
              </button>
            </div>

          </form>
        }

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditContentComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageTitleService =
    inject(PageTitleService);
  private readonly contentService =
    inject(ContentService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly content = signal<ContentItem | null>(null);

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
      'Admin | Content & Operations | Edit Content',
    );
  }

  async ngOnInit(): Promise<void> {
    const contentId =
      this.route.snapshot.paramMap.get('id');

    if (!contentId) {
      this.error.set(
        'No content ID was provided.',
      );

      return;
    }

    await this.loadContent(contentId);
  }

  /**
   * Load the content item from Firestore.
   */
  private async loadContent(
    contentId: string,
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const existingContent =
        await this.contentService.getContent(
          contentId,
        );

      if (!existingContent) {
        this.error.set(
          'The requested content item could not be found.',
        );

        return;
      }

      this.content.set(existingContent);

      this.form.patchValue({
        title: existingContent.title ?? '',
        description:
          existingContent.description ?? '',
        type: existingContent.type,
        platform: existingContent.platform,
        category:
          existingContent.category ?? '',
        status: existingContent.status,
        milestoneId:
          existingContent.milestoneId ?? '',
        externalFolderUrl:
          existingContent.externalFolderUrl ?? '',
        publishedUrl:
          existingContent.publishedUrl ?? '',
      });
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to load content.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Save changes to Firestore.
   */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const contentId =
      this.content()?.id;

    if (!contentId) {
      this.error.set(
        'Unable to determine the content ID.',
      );

      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const formValue =
        this.form.getRawValue();

      await this.contentService.updateContent(
        contentId,
        {
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
        },
      );

      await this.router.navigate([
        '/admin/content-operations/content',
      ]);
    } catch (error) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to save changes.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
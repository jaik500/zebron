import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { CommunityStore } from '../../store/community.store';

import { CommunityPostType } from '../../../../core/models/community/community-post.model';

import { AuthService } from '../../../../core/services/auth.service';
import { MatDividerModule } from '@angular/material/divider';

import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-community-create-post',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDividerModule,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `
    <main class="page">
      <div class="container">
        <!-- ====================================================
             HEADER
             ==================================================== -->

        <div class="page-header">
          <div>
            <a mat-button routerLink="/community" class="back-link">
              <mat-icon> arrow_back </mat-icon>

              Back to Community
            </a>

            <div class="eyebrow">COMMUNITY</div>

            <h1>Create a Post</h1>

            <p>
              Share a question, discussion, opportunity, event, or useful information with the
              Zebron community.
            </p>
          </div>
        </div>

        <!-- ====================================================
             FORM
             ==================================================== -->

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <mat-card appearance="outlined" class="form-card">
            <mat-card-content>
              <!-- ==============================================
                   POST TYPE
                   ============================================== -->

              <section>
                <div class="section-heading">
                  <div class="section-icon">
                    <mat-icon> category </mat-icon>
                  </div>

                  <div>
                    <h2>Post Type</h2>

                    <p>Choose the type that best describes your post.</p>
                  </div>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label> Post type </mat-label>

                  <mat-select formControlName="postType">
                    @for (option of postTypes; track option.value) {
                      <mat-option [value]="option.value">
                        <mat-icon>
                          {{ option.icon }}
                        </mat-icon>

                        {{ option.label }}
                      </mat-option>
                    }
                  </mat-select>

                  @if (
                    form.controls.postType.touched && form.controls.postType.hasError('required')
                  ) {
                    <mat-error> Select a post type. </mat-error>
                  }
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- ==============================================
                   BASIC INFORMATION
                   ============================================== -->

              <section>
                <div class="section-heading">
                  <div class="section-icon">
                    <mat-icon> edit </mat-icon>
                  </div>

                  <div>
                    <h2>Post Details</h2>

                    <p>Give your post a clear title and useful description.</p>
                  </div>
                </div>

                <!-- TITLE -->

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label> Title </mat-label>

                  <input
                    matInput
                    formControlName="title"
                    maxlength="160"
                    placeholder="Enter a clear title"
                  />

                  <mat-hint align="end"> {{ form.controls.title.value.length || 0 }}/160 </mat-hint>

                  @if (form.controls.title.touched && form.controls.title.hasError('required')) {
                    <mat-error> Title is required. </mat-error>
                  }

                  @if (form.controls.title.touched && form.controls.title.hasError('minlength')) {
                    <mat-error> Title must contain at least 5 characters. </mat-error>
                  }
                </mat-form-field>

                <!-- CONTENT -->

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label> What would you like to share? </mat-label>

                  <textarea
                    matInput
                    formControlName="content"
                    rows="10"
                    maxlength="10000"
                    placeholder="Write your post here..."
                  ></textarea>

                  <mat-hint> Be clear, respectful, and helpful. </mat-hint>

                  <mat-hint align="end">
                    {{ form.controls.content.value.length || 0 }}/10000
                  </mat-hint>

                  @if (
                    form.controls.content.touched && form.controls.content.hasError('required')
                  ) {
                    <mat-error> Post content is required. </mat-error>
                  }

                  @if (
                    form.controls.content.touched && form.controls.content.hasError('minlength')
                  ) {
                    <mat-error> Please provide at least 10 characters. </mat-error>
                  }
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- ==============================================
                   CATEGORY
                   ============================================== -->

              <section>
                <div class="section-heading">
                  <div class="section-icon">
                    <mat-icon> folder </mat-icon>
                  </div>

                  <div>
                    <h2>Category</h2>

                    <p>Optionally organize your post under a community category.</p>
                  </div>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label> Category </mat-label>

                  <mat-select formControlName="categoryId">
                    <mat-option [value]="null"> No category </mat-option>

                    @for (category of store.categories(); track category.id) {
                      <mat-option [value]="category.id">
                        {{ category.name }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- ==============================================
                   TAGS
                   ============================================== -->

              <section>
                <div class="section-heading">
                  <div class="section-icon">
                    <mat-icon> sell </mat-icon>
                  </div>

                  <div>
                    <h2>Tags</h2>

                    <p>Add a few keywords to make your post easier to discover.</p>
                  </div>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label> Tags </mat-label>

                  <input matInput formControlName="tags" placeholder="immigration, jobs, housing" />

                  <mat-hint> Separate tags with commas. </mat-hint>
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- ==============================================
                   COMMENTS
                   ============================================== -->

              <section>
                <div class="section-heading">
                  <div class="section-icon">
                    <mat-icon> chat </mat-icon>
                  </div>

                  <div>
                    <h2>Comments</h2>

                    <p>Choose whether other community members can comment on your post.</p>
                  </div>
                </div>

                <mat-checkbox formControlName="allowComments">
                  Allow community members to comment on this post
                </mat-checkbox>
              </section>

              <!-- ==============================================
                   ERROR
                   ============================================== -->

              @if (submitError()) {
                <div class="submit-error" role="alert">
                  <mat-icon> error_outline </mat-icon>

                  <span>
                    {{ submitError() }}
                  </span>
                </div>
              }

              <!-- ==============================================
                   ACTIONS
                   ============================================== -->

              <div class="actions">
                <a mat-button routerLink="/community" [disabled]="store.saving()"> Cancel </a>

                <button mat-flat-button color="primary" type="submit" [disabled]="store.saving()">
                  @if (store.saving()) {
                    <ng-container>
                      <mat-spinner diameter="20"></mat-spinner>

                      <span> Publishing... </span>
                    </ng-container>
                  } @else {
                    <ng-container>
                      <mat-icon> publish </mat-icon>

                      <span> Publish Post </span>
                    </ng-container>
                  }
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </form>
      </div>
    </main>
  `,

  styles: [
    `
      :host {
        display: block;
      }

      .page {
        min-height: 100%;
        background: #f8fafc;
      }

      .container {
        width: min(900px, 100%);
        margin: 0 auto;
        padding: 24px 20px 60px;
      }

      /* ========================================================
         HEADER
         ======================================================== */

      .page-header {
        margin-bottom: 20px;
      }

      .back-link {
        margin-bottom: 18px;
      }

      .eyebrow {
        margin-top: 4px;

        color: #64748b;

        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }

      .page-header h1 {
        margin: 5px 0 8px;

        color: #172033;

        font-size: clamp(30px, 5vw, 42px);
        line-height: 1.15;
        font-weight: 800;
      }

      .page-header p {
        max-width: 700px;
        margin: 0;

        color: #64748b;

        font-size: 15px;
        line-height: 1.6;
      }

      /* ========================================================
         FORM
         ======================================================== */

      .form-card {
        border-radius: 16px;
      }

      mat-card-content {
        padding: 28px;
      }

      section {
        padding: 4px 0 26px;
      }

      section + section {
        padding-top: 26px;
      }

      /* ========================================================
         SECTION HEADING
         ======================================================== */

      .section-heading {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        margin-bottom: 18px;
      }

      .section-icon {
        width: 38px;
        height: 38px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 10px;

        background: #eef2ff;

        color: #3730a3;
      }

      .section-icon mat-icon {
        width: 20px;
        height: 20px;
        font-size: 20px;
      }

      .section-heading h2 {
        margin: 0 0 3px;

        color: #172033;

        font-size: 18px;
        font-weight: 750;
      }

      .section-heading p {
        margin: 0;

        color: #64748b;

        font-size: 13px;
        line-height: 1.45;
      }

      /* ========================================================
         FORM FIELDS
         ======================================================== */

      .full-width {
        width: 100%;
      }

      textarea {
        resize: vertical;
        min-height: 180px;
      }

      /* ========================================================
         ERROR
         ======================================================== */

      .submit-error {
        display: flex;
        align-items: center;
        gap: 9px;

        margin-top: 22px;
        padding: 12px 14px;

        border: 1px solid #fecaca;
        border-radius: 10px;

        background: #fef2f2;

        color: #991b1b;

        font-size: 13px;
      }

      .submit-error mat-icon {
        width: 20px;
        height: 20px;
        font-size: 20px;
      }

      /* ========================================================
         ACTIONS
         ======================================================== */

      .actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;

        margin-top: 26px;
      }

      .actions button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .actions button mat-spinner {
        margin-right: 3px;
      }

      /* ========================================================
         MOBILE
         ======================================================== */

      @media (max-width: 600px) {
        .container {
          padding: 18px 14px 45px;
        }

        mat-card-content {
          padding: 18px;
        }

        .actions {
          flex-direction: column-reverse;
          align-items: stretch;
        }

        .actions a,
        .actions button {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class CommunityCreatePostComponent implements OnInit {
  // ============================================================
  // DEPENDENCIES
  // ============================================================

  protected readonly store = inject(CommunityStore);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  // ============================================================
  // STATE
  // ============================================================

  protected readonly submitError = signal<string | null>(null);

  // ============================================================
  // FORM
  // ============================================================

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]],

    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],

    postType: ['discussion' as CommunityPostType, Validators.required],

    categoryId: [''],

    tags: ['', Validators.maxLength(500)],

    allowComments: [true],
  });

  // ============================================================
  // POST TYPES
  // ============================================================

  protected readonly postTypes: Array<{
    value: CommunityPostType;
    label: string;
    icon: string;
  }> = [
    {
      value: 'discussion',
      label: 'Discussion',
      icon: 'forum',
    },

    {
      value: 'question',
      label: 'Question',
      icon: 'help_outline',
    },

    {
      value: 'event',
      label: 'Event',
      icon: 'event',
    },

    {
      value: 'opportunity',
      label: 'Opportunity',
      icon: 'work_outline',
    },

    {
      value: 'news',
      label: 'News',
      icon: 'newspaper',
    },

    {
      value: 'notice',
      label: 'Notice',
      icon: 'campaign',
    },
  ];

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    /*
     * Categories are needed by the form.
     *
     * loadCommunity() already loads them, but calling the
     * method explicitly also makes this page safe when entered
     * directly.
     */

    if (this.store.categories().length === 0) {
      void this.store.loadCategories();
    }
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  protected async submit(): Promise<void> {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.submitError.set('Please correct the highlighted fields before publishing.');

      return;
    }

    const user = this.authService.user();

    if (!user) {
      this.submitError.set('You must be signed in to create a community post.');

      return;
    }

    const value = this.form.getRawValue();

    const tags = this.parseTags(value.tags);

    const postId = await this.store.createPost({
      title: value.title.trim(),

      content: value.content.trim(),

      authorId: user.id,

      authorName: this.getUserName(user),

      authorPhotoUrl: this.getUserPhotoUrl(user),

      postType: value.postType,

      categoryId: value.categoryId || undefined,

      tags,

      allowComments: value.allowComments,

      status: 'published',
    });

    if (!postId) {
      this.submitError.set(
        this.store.error() ?? 'The post could not be published. Please try again.',
      );

      return;
    }

    await this.router.navigate(['/community/post', postId]);
  }

  // ============================================================
  // TAGS
  // ============================================================

  private parseTags(value: string): string[] {
    if (!value.trim()) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 10);
  }

  // ============================================================
  // USER NAME
  // ============================================================

  private getUserName(user: {
    id: string;
    displayName?: string | null;
    email?: string | null;
  }): string {
    return user.displayName?.trim() || user.email?.trim() || 'Zebron Member';
  }

  // ============================================================
  // USER PHOTO
  // ============================================================

  private getUserPhotoUrl(user: User): string | undefined {
    return user.photoUrl ?? undefined;
  }
}

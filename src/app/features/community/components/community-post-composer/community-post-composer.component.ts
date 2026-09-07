import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { CommunityStore } from '../../store/community.store';

@Component({
  selector: 'app-community-post-composer',
  standalone: true,

  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],

  template: `
    <div
      class="flex max-h-[85vh]
             flex-col
             overflow-hidden
             bg-white"
    >
      <!-- ====================================================== -->
      <!-- ZEBRON HEADER -->
      <!-- ====================================================== -->

      <div
        class="relative overflow-hidden
               bg-gradient-to-r
               from-[#087F80]
               via-[#167F86]
               to-[#256B78]
               px-5 py-3.5
               text-white"
      >
        <!-- Subtle Zebron decorative circles -->

        <div
          class="pointer-events-none
                 absolute
                 -right-8
                 -top-10
                 h-32
                 w-32
                 rounded-full
                 border-[18px]
                 border-white/10"
        ></div>

        <div
          class="pointer-events-none
                 absolute
                 -right-1
                 -top-5
                 h-20
                 w-20
                 rounded-full
                 border-[10px]
                 border-white/5"
        ></div>

        <!-- Header content -->

        <div
          class="relative
                 flex
                 items-center
                 justify-between"
        >
          <div class="min-w-0">
            <h2
              class="text-lg
                     font-semibold
                     leading-tight
                     tracking-tight
                     text-white"
            >
              Create a post
            </h2>

            <p
              class="mt-0.5
                     text-xs
                     text-white/80"
            >
              Share something with the Zebron community
            </p>
          </div>

          <!-- Close -->

          <button
            mat-icon-button
            type="button"
            aria-label="Close"
            class="!ml-3
                   !h-9
                   !w-9
                   !shrink-0
                   !text-white
                   hover:!bg-white/10"
            (click)="close()"
          >
            <mat-icon class="!text-[21px]"> close </mat-icon>
          </button>
        </div>
      </div>

      <!-- ====================================================== -->
      <!-- FORM -->
      <!-- ====================================================== -->

      <div
        class="overflow-y-auto
               px-5
               py-3.5"
      >
        <div
          class="flex
                 flex-col
                 gap-2.5"
        >
          <!-- ================================================== -->
          <!-- TOPIC -->
          <!-- ================================================== -->

          <mat-form-field appearance="outline" class="compact-field w-full">
            <mat-label> Topic </mat-label>

            <mat-select [(ngModel)]="topicId" placeholder="Select a topic">
              @for (topic of store.topics(); track topic.id) {
                <mat-option [value]="topic.id">
                  {{ topic.name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- ================================================== -->
          <!-- TITLE -->
          <!-- ================================================== -->

          <mat-form-field appearance="outline" class="compact-field w-full">
            <mat-label> Title </mat-label>

            <input
              matInput
              [(ngModel)]="title"
              maxlength="150"
              placeholder="What would you like to discuss?"
            />

            <mat-hint align="end"> {{ title.length }}/150 </mat-hint>
          </mat-form-field>

          <!-- ================================================== -->
          <!-- CONTENT -->
          <!-- ================================================== -->

          <!--
            floatLabel="always" is intentional.

            It keeps the label inside the Material outline
            notch and prevents the textarea border from
            crossing through "What's on your mind?".
          -->

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            class="compact-field
                   compact-content-field
                   w-full"
          >
            <mat-label> What's on your mind? </mat-label>

            <textarea
              matInput
              [(ngModel)]="content"
              rows="4"
              maxlength="5000"
              placeholder="Share your question, experience, advice, or idea..."
            ></textarea>

            <mat-hint align="end"> {{ content.length }}/5000 </mat-hint>
          </mat-form-field>

          <!-- ================================================== -->
          <!-- TAGS -->
          <!-- ================================================== -->

          <mat-form-field appearance="outline" class="compact-field w-full">
            <mat-label> Tags </mat-label>

            <input matInput [(ngModel)]="tagsText" placeholder="jobs, career, employment" />

            <mat-hint> Separate tags with commas </mat-hint>
          </mat-form-field>

          <!-- ================================================== -->
          <!-- ERROR -->
          <!-- ================================================== -->

          @if (store.error()) {
            <div
              class="flex
                     items-start
                     gap-2
                     rounded-lg
                     border
                     border-red-200
                     bg-red-50
                     px-3
                     py-2
                     text-xs
                     text-red-700"
            >
              <mat-icon
                class="!mt-0.5
                       !h-4
                       !w-4
                       !text-[18px]"
              >
                error_outline
              </mat-icon>

              <span>
                {{ store.error() }}
              </span>
            </div>
          }
        </div>
      </div>

      <!-- ====================================================== -->
      <!-- FOOTER -->
      <!-- ====================================================== -->

      <div
        class="flex
               items-center
               justify-end
               gap-2
               border-t
               border-slate-200
               bg-white
               px-5
               py-2.5"
      >
        <!-- Cancel -->

        <button
          mat-button
          type="button"
          [disabled]="saving()"
          class="!text-[#087F80]"
          (click)="close()"
        >
          Cancel
        </button>

        <!-- Publish -->

        <button
          mat-flat-button
          type="button"
          [disabled]="saving() || !title.trim() || !content.trim() || !topicId"
          class="!rounded-full
                 !bg-[#087F80]
                 !px-5
                 !text-white
                 hover:!bg-[#066D6E]
                 disabled:!bg-slate-200
                 disabled:!text-slate-400"
          (click)="publish()"
        >
          @if (saving()) {
            <span
              class="flex
                     items-center
                     gap-2"
            >
              <mat-spinner diameter="16"></mat-spinner>

              Publishing...
            </span>
          } @else {
            <span
              class="flex
                     items-center
                     gap-2"
            >
              <mat-icon class="!text-[18px]"> send </mat-icon>

              Publish
            </span>
          }
        </button>
      </div>
    </div>
  `,

  styles: [
    `
      /* ==========================================================
       HOST
       ========================================================== */

      :host {
        display: block;
      }

      /* ==========================================================
       COMPACT MATERIAL FIELDS
       ========================================================== */

      .compact-field {
        margin-bottom: 0;
      }

      /*
     * Keep the Material hint/counter area compact.
     */

      .compact-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        min-height: 18px;
      }

      /*
     * Make the single-line controls compact without
     * interfering with Material's floating-label behavior.
     */

      .compact-field ::ng-deep .mat-mdc-text-field-wrapper {
        min-height: 48px;
      }

      /*
     * Textarea field.
     *
     * We intentionally DO NOT set the Material container
     * height to "auto".
     *
     * This allows Angular Material to correctly calculate
     * the floating-label notch.
     */

      .compact-content-field ::ng-deep .mat-mdc-text-field-wrapper {
        min-height: 118px;
      }

      /*
     * Actual textarea size.
     */

      .compact-content-field textarea {
        min-height: 78px;
        max-height: 150px;
        resize: vertical;
      }

      /*
     * Keep the textarea label above the border.
     */

      .compact-content-field ::ng-deep .mdc-floating-label {
        background: transparent;
      }

      /*
     * Compact Material form-field spacing.
     */

      .compact-field ::ng-deep .mat-mdc-form-field-infix {
        min-height: 46px;
        padding-top: 10px;
        padding-bottom: 6px;
      }

      /*
     * Textarea gets enough vertical room while
     * retaining the compact appearance.
     */

      .compact-content-field ::ng-deep .mat-mdc-form-field-infix {
        min-height: 108px;
        padding-top: 12px;
        padding-bottom: 6px;
      }

      /*
     * Loading spinner.
     */

      mat-spinner {
        display: inline-block;
      }

      /* ==========================================================
       SMALL SCREENS
       ========================================================== */

      @media (max-width: 640px) {
        .compact-content-field ::ng-deep .mat-mdc-text-field-wrapper {
          min-height: 108px;
        }

        .compact-content-field textarea {
          min-height: 68px;
        }

        .compact-content-field ::ng-deep .mat-mdc-form-field-infix {
          min-height: 98px;
        }
      }
    `,
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityPostComposerComponent {
  // ============================================================
  // DEPENDENCIES
  // ============================================================

  readonly store = inject(CommunityStore);

  private readonly dialogRef = inject(MatDialogRef<CommunityPostComposerComponent>);

  // ============================================================
  // FORM STATE
  // ============================================================

  title = '';

  content = '';

  topicId = '';

  tagsText = '';

  // ============================================================
  // SAVE STATE
  // ============================================================

  readonly saving = signal(false);

  // ============================================================
  // PUBLISH
  // ============================================================

  async publish(): Promise<void> {
    const title = this.title.trim();

    const content = this.content.trim();

    const topicId = this.topicId.trim();

    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    if (!title || !content || !topicId) {
      return;
    }

    // ----------------------------------------------------------
    // Find selected topic
    // ----------------------------------------------------------

    const topic = this.store.topics().find((item) => item.id === topicId);

    this.saving.set(true);

    // ----------------------------------------------------------
    // Parse tags
    // ----------------------------------------------------------

    const tags = this.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, values) => values.indexOf(tag) === index);

    // ----------------------------------------------------------
    // Create post
    // ----------------------------------------------------------

    try {
      const postId = await this.store.createPost({
        title,

        content,

        topicId,

        topicName: topic?.name,

        tags,
      });

      // --------------------------------------------------------
      // Close dialog after successful creation
      // --------------------------------------------------------

      if (postId) {
        this.dialogRef.close(postId);
      }
    } catch (error) {
      console.error('Failed to publish community post:', error);
    } finally {
      this.saving.set(false);
    }
  }

  // ============================================================
  // CLOSE
  // ============================================================

  close(): void {
    this.dialogRef.close();
  }
}

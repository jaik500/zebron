import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { TestCourse } from '../../../features/test-center/models/test-course.model';
import { TestProgram } from '../../../features/test-center/models/test-program.model';
import {
  IMPORT_MAX_ROWS,
  ImportDefaults,
  ImportPlan,
  ImportProgress,
  ImportResult,
  TestCenterImportService,
} from '../../../features/test-center/services/test-center-import.service';

export interface TestCenterImportDialogData {
  organizationId: string;
  programs: TestProgram[];
  courses: TestCourse[];
  /** Pre-selects this course as the import target. */
  courseId?: string | null;
}

/** Closes with the result when something was imported, otherwise undefined. */
export type TestCenterImportDialogResult = ImportResult | undefined;

type Step = 'choose' | 'review' | 'running' | 'done';

const STAGE_LABELS: Record<ImportProgress['stage'], string> = {
  programs: 'Creating programs',
  courses: 'Creating courses',
  topics: 'Creating topics',
  questions: 'Saving questions',
  counts: 'Updating question counts',
};

/**
 * Import programs, courses, topics and questions from a CSV or JSON file.
 *
 * 1. Choose a file and where rows without a course/topic should go.
 * 2. Review what will be created or updated, and which rows will be skipped.
 *    Nothing is saved until the user confirms.
 * 3. Import, with progress.
 */
@Component({
  selector: 'app-test-center-import-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="!flex items-center gap-2">
      <mat-icon class="text-[#007979]">upload_file</mat-icon>
      Import questions
    </h2>

    <mat-dialog-content class="!max-h-[70vh]">
      @switch (step()) {
        <!-- ===================================================
             STEP 1: CHOOSE FILE
             =================================================== -->
        @case ('choose') {
          <p class="text-sm leading-6 text-gray-600">
            Import programs, courses, topics and questions from a <strong>CSV</strong> file
            (from Excel or Google Sheets) or a <strong>JSON</strong> file. Missing programs,
            courses and topics are created. Importing the same file again updates those
            questions instead of duplicating them.
          </p>

          <button
            mat-stroked-button
            type="button"
            class="mt-3"
            (click)="downloadTemplate()"
          >
            <mat-icon>download</mat-icon>
            Download CSV template
          </button>

          <label
            class="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition"
            [class.border-teal-600]="dragging()"
            [class.bg-teal-50]="dragging()"
            [class.border-gray-300]="!dragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="dragging.set(false)"
            (drop)="onDrop($event)"
          >
            <mat-icon class="!h-10 !w-10 !text-4xl text-[#007979]">cloud_upload</mat-icon>

            @if (file(); as selected) {
              <span class="break-all text-sm font-semibold text-gray-900">{{ selected.name }}</span>
              <span class="text-xs text-gray-500">Click to choose a different file</span>
            } @else {
              <span class="text-sm font-semibold text-gray-900">Choose a file or drop it here</span>
              <span class="text-xs text-gray-500">.csv or .json · up to {{ maxRows }} questions</span>
            }

            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              class="sr-only"
              (change)="onFileSelected($event)"
            />
          </label>

          <h3 class="mt-6 text-sm font-semibold text-gray-900">For rows that leave these blank</h3>
          <p class="mb-3 mt-1 text-xs text-gray-500">
            Columns in the file always win. These are only used when a row has no course, program or topic.
          </p>

          <div class="grid gap-x-4 sm:grid-cols-2">
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Course</mat-label>
              <mat-select [(ngModel)]="defaultCourseId" name="defaultCourseId">
                <mat-option [value]="null">Use the file's "course" column</mat-option>
                @for (course of data.courses; track course.id) {
                  <mat-option [value]="course.id">{{ course.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Program for new courses</mat-label>
              <mat-select [(ngModel)]="defaultProgramId" name="defaultProgramId">
                <mat-option [value]="null">Use the file's "program" column</mat-option>
                @for (program of data.programs; track program.id) {
                  <mat-option [value]="program.id">{{ program.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Topic</mat-label>
              <input matInput [(ngModel)]="defaultTopicName" name="defaultTopicName" placeholder="General" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>Save questions as</mat-label>
              <mat-select [(ngModel)]="status" name="status">
                <mat-option value="published">Published (learners see them now)</mat-option>
                <mat-option value="draft">Draft (review before publishing)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }

        <!-- ===================================================
             STEP 2: REVIEW
             =================================================== -->
        @case ('review') {
          @if (plan(); as current) {
            <p class="text-sm text-gray-600">
              <strong class="break-all">{{ current.fileName }}</strong> ·
              {{ current.totalRows }} row{{ current.totalRows === 1 ? '' : 's' }} read.
              Nothing has been saved yet.
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              @for (stat of summary(); track stat.label) {
                <div class="rounded-xl border border-gray-200 bg-white p-3">
                  <p class="text-xs font-medium text-gray-500">{{ stat.label }}</p>
                  <p class="mt-1 text-xl font-bold text-gray-900">{{ stat.total }}</p>
                  <p class="text-xs text-gray-500">{{ stat.detail }}</p>
                </div>
              }
            </div>

            @if (newItems().length > 0) {
              <div class="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
                <p class="text-sm font-semibold text-teal-900">Will be created</p>
                <ul class="mt-1 space-y-0.5 text-sm text-teal-900">
                  @for (item of newItems(); track item) {
                    <li class="break-words">{{ item }}</li>
                  }
                </ul>
              </div>
            }

            @if (current.duplicatesInFile > 0) {
              <p class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                {{ current.duplicatesInFile }} question{{ current.duplicatesInFile === 1 ? ' appears' : 's appear' }}
                more than once in the file and will be imported once.
              </p>
            }

            @if (current.errors.length > 0) {
              <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p class="text-sm font-semibold text-amber-900">
                  {{ current.errors.length }} row{{ current.errors.length === 1 ? '' : 's' }} will be skipped
                </p>

                <ul class="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900">
                  @for (error of current.errors.slice(0, 100); track $index) {
                    <li><strong>{{ lineLabel() }} {{ error.line }}:</strong> {{ error.message }}</li>
                  }
                </ul>

                @if (current.errors.length > 100) {
                  <p class="mt-1 text-xs text-amber-800">…and {{ current.errors.length - 100 }} more.</p>
                }

                <p class="mt-2 text-xs text-amber-800">
                  Fix them in the file and import it again. Rows already imported are updated, not duplicated.
                </p>
              </div>
            }

            @if (current.questions.length === 0) {
              <p class="mt-4 text-sm font-semibold text-red-700">There are no valid questions to import.</p>
            }
          }
        }

        <!-- ===================================================
             STEP 3: RUNNING
             =================================================== -->
        @case ('running') {
          <p class="text-sm font-medium text-gray-900">{{ progressLabel() }}</p>

          <mat-progress-bar
            class="mt-3"
            [mode]="progressPercent() === null ? 'indeterminate' : 'determinate'"
            [value]="progressPercent() ?? 0"
          ></mat-progress-bar>

          <p class="mt-3 text-xs text-gray-500">Keep this window open until the import finishes.</p>
        }

        <!-- ===================================================
             STEP 4: DONE
             =================================================== -->
        @case ('done') {
          @if (result(); as done) {
            <div
              class="flex items-start gap-3 rounded-xl border p-4"
              [class.border-emerald-200]="done.errors.length === 0"
              [class.bg-emerald-50]="done.errors.length === 0"
              [class.border-amber-200]="done.errors.length > 0"
              [class.bg-amber-50]="done.errors.length > 0"
            >
              <mat-icon [class.text-emerald-700]="done.errors.length === 0" [class.text-amber-700]="done.errors.length > 0">
                {{ done.errors.length === 0 ? 'task_alt' : 'warning' }}
              </mat-icon>

              <div class="min-w-0 text-sm text-gray-800">
                <p class="font-semibold">
                  {{ done.errors.length === 0 ? 'Import complete' : 'Import finished with some problems' }}
                </p>
                <p class="mt-1">
                  {{ done.questionsCreated }} question{{ done.questionsCreated === 1 ? '' : 's' }} added,
                  {{ done.questionsUpdated }} updated.
                  @if (done.programsCreated || done.coursesCreated || done.topicsCreated) {
                    Created {{ done.programsCreated }} program{{ done.programsCreated === 1 ? '' : 's' }},
                    {{ done.coursesCreated }} course{{ done.coursesCreated === 1 ? '' : 's' }} and
                    {{ done.topicsCreated }} topic{{ done.topicsCreated === 1 ? '' : 's' }}.
                  }
                </p>
              </div>
            </div>

            @if (done.errors.length > 0) {
              <ul class="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900">
                @for (error of done.errors.slice(0, 100); track $index) {
                  <li class="break-words">{{ error }}</li>
                }
              </ul>
            }
          }
        }
      }

      @if (error()) {
        <p class="mt-4 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {{ error() }}
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!flex-wrap gap-2">
      @switch (step()) {
        @case ('choose') {
          <button mat-button type="button" (click)="close()">Cancel</button>
          <button
            mat-flat-button
            type="button"
            class="!bg-[#007979] !text-white"
            [disabled]="!file() || busy()"
            (click)="review()"
          >
            <mat-icon>fact_check</mat-icon>
            {{ busy() ? 'Checking…' : 'Review import' }}
          </button>
        }
        @case ('review') {
          <button mat-button type="button" (click)="backToChoose()">Back</button>
          <button
            mat-flat-button
            type="button"
            class="!bg-[#007979] !text-white"
            [disabled]="(plan()?.questions?.length ?? 0) === 0"
            (click)="runImport()"
          >
            <mat-icon>upload</mat-icon>
            Import {{ plan()?.questions?.length ?? 0 }} question{{ plan()?.questions?.length === 1 ? '' : 's' }}
          </button>
        }
        @case ('done') {
          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" (click)="close()">Done</button>
        }
      }
    </mat-dialog-actions>
  `,
})
export class TestCenterImportDialogComponent {
  protected readonly data = inject<TestCenterImportDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<TestCenterImportDialogComponent, TestCenterImportDialogResult>,
  );
  private readonly importService = inject(TestCenterImportService);

  protected readonly maxRows = IMPORT_MAX_ROWS;

  protected readonly step = signal<Step>('choose');
  protected readonly file = signal<File | null>(null);
  protected readonly dragging = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly plan = signal<ImportPlan | null>(null);
  protected readonly progress = signal<ImportProgress | null>(null);
  protected readonly result = signal<ImportResult | null>(null);

  protected defaultCourseId: string | null = this.data.courseId ?? null;
  protected defaultProgramId: string | null = null;
  protected defaultTopicName = 'General';
  protected status: ImportDefaults['status'] = 'published';

  protected readonly lineLabel = computed(() =>
    this.plan()?.fileName.toLowerCase().endsWith('.json') ? 'Item' : 'Line',
  );

  protected readonly summary = computed(() => {
    const plan = this.plan();

    if (!plan) {
      return [];
    }

    const count = <T extends { existing: unknown }>(items: T[]) => ({
      total: items.length,
      created: items.filter((item) => !item.existing).length,
    });

    const programs = count(plan.programs);
    const courses = count(plan.courses);
    const topics = count(plan.topics);
    const updates = plan.questions.filter((question) => question.existingId).length;

    return [
      { label: 'Programs', total: programs.total, detail: `${programs.created} new` },
      { label: 'Courses', total: courses.total, detail: `${courses.created} new` },
      { label: 'Topics', total: topics.total, detail: `${topics.created} new` },
      {
        label: 'Questions',
        total: plan.questions.length,
        detail: `${plan.questions.length - updates} new · ${updates} update`,
      },
    ];
  });

  protected readonly newItems = computed(() => {
    const plan = this.plan();

    if (!plan) {
      return [];
    }

    const courseNames = new Map(plan.courses.map((course) => [course.key, course.name]));

    return [
      ...plan.programs.filter((item) => !item.existing).map((item) => `Program: ${item.name}`),
      ...plan.courses.filter((item) => !item.existing).map((item) => `Course: ${item.name}`),
      ...plan.topics
        .filter((item) => !item.existing)
        .map((item) => `Topic: ${item.name} (in ${courseNames.get(item.courseKey) ?? 'course'})`),
    ];
  });

  protected readonly progressLabel = computed(() => {
    const progress = this.progress();

    if (!progress) {
      return 'Starting…';
    }

    const label = STAGE_LABELS[progress.stage];

    return progress.total > 0 ? `${label} (${progress.done} of ${progress.total})` : label;
  });

  protected readonly progressPercent = computed(() => {
    const progress = this.progress();

    if (!progress || progress.stage !== 'questions' || progress.total === 0) {
      return null;
    }

    return Math.round((progress.done / progress.total) * 100);
  });

  constructor() {
    // Don't let a stray click outside lose an import in progress.
    this.dialogRef.disableClose = true;
  }

  protected downloadTemplate(): void {
    const blob = new Blob([this.importService.buildTemplateCsv()], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'zebron-test-center-import-template.csv';
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);

    // Allow choosing the same file again after editing it.
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  private setFile(file: File | null): void {
    this.file.set(file);
    this.error.set('');
  }

  protected async review(): Promise<void> {
    const file = this.file();

    if (!file) {
      return;
    }

    this.busy.set(true);
    this.error.set('');

    try {
      const { rows, errors } = await this.importService.parseFile(file);

      const plan = await this.importService.buildPlan(
        this.data.organizationId,
        file.name,
        rows,
        errors,
        {
          courseId: this.defaultCourseId,
          programId: this.defaultProgramId,
          topicName: this.defaultTopicName,
          status: this.status,
        },
      );

      this.plan.set(plan);
      this.step.set('review');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The file could not be read.');
    } finally {
      this.busy.set(false);
    }
  }

  protected backToChoose(): void {
    this.plan.set(null);
    this.error.set('');
    this.step.set('choose');
  }

  protected async runImport(): Promise<void> {
    const plan = this.plan();

    if (!plan || plan.questions.length === 0) {
      return;
    }

    this.step.set('running');
    this.error.set('');
    this.progress.set(null);

    try {
      const result = await this.importService.runImport(
        this.data.organizationId,
        plan,
        (progress) => this.progress.set(progress),
      );

      this.result.set(result);
      this.step.set('done');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The import failed.');
      this.step.set('review');
    }
  }

  protected close(): void {
    const result = this.result();
    const changed =
      result &&
      (result.questionsCreated ||
        result.questionsUpdated ||
        result.programsCreated ||
        result.coursesCreated ||
        result.topicsCreated);

    this.dialogRef.close(changed ? result : undefined);
  }
}

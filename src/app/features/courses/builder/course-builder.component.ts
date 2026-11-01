import { ChangeDetectionStrategy, Component, computed, HostListener, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { PageTitleService } from '../../../core/services/page-title.service';
import { PartnerOrganizationContextService } from '../../../core/services/partner-organization-context.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import {
  COURSE_COVERS,
  COURSE_LEVEL_LABELS,
  courseContextFromRoute,
  CourseCover,
  CourseLevel,
  formatMinutes,
  LessonBlockType,
} from '../course.model';
import { BLOCK_META, BlockEditorComponent } from './block-editor.component';
import { CourseBuilderStore } from './course-builder.store';

/**
 * The course builder: course details, the outline (modules and lessons)
 * and the lesson editor with its blocks. Changes stay in the page until
 * Save; Publish makes the course visible to learners.
 */
@Component({
  selector: 'app-course-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CourseBuilderStore],
  imports: [
    NgClass,
    RouterLink,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
    BlockEditorComponent,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <!-- Page header: back and breadcrumbs left, actions right (icons only on phones) -->
      <header class="sticky top-16 z-20 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <a
            [routerLink]="managePath"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 hover:bg-white/15 hover:text-white"
            [attr.aria-label]="'Back to Manage courses' | t"
            [matTooltip]="'Back to Manage courses' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <nav class="flex min-w-0 flex-1 items-center gap-1 text-sm" [attr.aria-label]="'Breadcrumb' | t">
            <a [routerLink]="managePath" class="hidden shrink-0 text-white/80 hover:text-white hover:underline sm:inline">{{ 'Manage courses' | t }}</a>
            <mat-icon class="!hidden !h-4 !w-4 shrink-0 !text-base text-white/60 sm:!inline-block" aria-hidden="true">chevron_right</mat-icon>
            <span class="truncate font-semibold">{{ store.details().title || ('New course' | t) }}</span>
            <span class="ml-1 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" [ngClass]="statusClass()">{{ statusLabel() | t }}</span>
          </nav>

          @if (store.dirty()) {
            <span class="hidden text-xs text-white/80 md:inline">{{ 'Unsaved changes' | t }}</span>
          }

          @if (previewLink(); as link) {
            <a
              [routerLink]="link"
              target="_blank"
              class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/35 px-2 text-sm font-semibold hover:bg-white/15 sm:px-3"
              [attr.aria-label]="'Preview' | t"
              [matTooltip]="'Preview as a learner (saved version)' | t"
            >
              <mat-icon aria-hidden="true">visibility</mat-icon><span class="hidden sm:inline">{{ 'Preview' | t }}</span>
            </a>
          }

          @if (published()) {
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-white px-2 text-sm font-bold text-[#007979] hover:bg-teal-50 disabled:opacity-50 sm:px-3"
              [disabled]="store.saving() || !store.dirty()"
              (click)="save('save')"
              [attr.aria-label]="'Save changes' | t"
              [matTooltip]="'The course is live: changes reach learners as soon as you save.' | t"
            >
              <mat-icon aria-hidden="true">{{ store.saving() ? 'hourglass_top' : 'save' }}</mat-icon><span class="hidden sm:inline">{{ 'Save changes' | t }}</span>
            </button>
          } @else {
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/35 px-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-50 sm:px-3"
              [disabled]="store.saving() || (!store.dirty() && !store.isNew())"
              (click)="save('save')"
              [attr.aria-label]="'Save draft' | t"
            >
              <mat-icon aria-hidden="true">{{ store.saving() ? 'hourglass_top' : 'save' }}</mat-icon><span class="hidden sm:inline">{{ 'Save draft' | t }}</span>
            </button>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-white px-2 text-sm font-bold text-[#007979] hover:bg-teal-50 disabled:opacity-50 sm:px-3"
              [disabled]="store.saving()"
              (click)="save('publish')"
              [attr.aria-label]="'Publish' | t"
            >
              <mat-icon aria-hidden="true">rocket_launch</mat-icon><span class="hidden sm:inline">{{ 'Publish' | t }}</span>
            </button>
          }

          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/15"
            [matMenuTriggerFor]="moreMenu"
            [attr.aria-label]="'More actions' | t"
          >
            <mat-icon aria-hidden="true">more_vert</mat-icon>
          </button>
          <mat-menu #moreMenu="matMenu" xPosition="before">
            @if (published()) {
              <button mat-menu-item type="button" (click)="save('unpublish')">
                <mat-icon>unpublished</mat-icon><span>{{ 'Unpublish (back to draft)' | t }}</span>
              </button>
            }
            <button mat-menu-item type="button" (click)="deleteCourse()">
              <mat-icon class="!text-rose-600">delete</mat-icon><span class="text-rose-700">{{ 'Delete course' | t }}</span>
            </button>
          </mat-menu>
        </div>
      </header>

      @if (store.loading()) {
        <div class="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8" aria-hidden="true">
          <div class="h-80 animate-pulse rounded-2xl bg-slate-200/70"></div>
          <div class="h-96 animate-pulse rounded-2xl bg-slate-200/70"></div>
        </div>
      } @else {
        @if (store.error()) {
          <div class="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <p class="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              <mat-icon class="shrink-0 text-rose-600" aria-hidden="true">error</mat-icon>
              <span class="flex-1">{{ store.error()! | t }}</span>
              <button type="button" class="font-semibold underline" (click)="store.clearError()">{{ 'Dismiss' | t }}</button>
            </p>
          </div>
        }

        <div class="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
          <!-- Outline -->
          <nav class="self-start rounded-2xl border border-slate-200 bg-white p-3 lg:sticky lg:top-32" [attr.aria-label]="'Course outline' | t">
            <button
              type="button"
              class="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold"
              [ngClass]="store.selection().kind === 'details' ? 'bg-teal-50 text-[#007979]' : 'text-slate-700 hover:bg-slate-50'"
              (click)="store.select({ kind: 'details' })"
            >
              <mat-icon aria-hidden="true">tune</mat-icon>{{ 'Course details' | t }}
            </button>

            @for (module of store.modules(); track module.id; let moduleIndex = $index; let firstModule = $first; let lastModule = $last) {
              <div class="mt-2 border-t border-slate-100 pt-2">
                <div class="flex items-center gap-1">
                  <span class="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ moduleIndex + 1 }}</span>
                  <input
                    class="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold text-slate-900 hover:border-slate-200 focus:border-[#007979] focus:bg-white focus:outline-none"
                    [value]="module.title"
                    (input)="store.renameModule(module.id, value($event))"
                    [attr.aria-label]="'Module title' | t"
                  />
                  <button type="button" class="tree-btn" [disabled]="firstModule" (click)="store.moveModule(module.id, -1)" [attr.aria-label]="'Move module up' | t">
                    <mat-icon>arrow_upward</mat-icon>
                  </button>
                  <button type="button" class="tree-btn" [disabled]="lastModule" (click)="store.moveModule(module.id, 1)" [attr.aria-label]="'Move module down' | t">
                    <mat-icon>arrow_downward</mat-icon>
                  </button>
                  <button type="button" class="tree-btn hover:!text-rose-600" (click)="removeModule(module.id, module.title)" [attr.aria-label]="'Delete module' | t">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                @for (lessonId of module.lessonIds; track lessonId) {
                  @if (store.lessons()[lessonId]; as lesson) {
                    <div
                      class="group flex items-center gap-1 rounded-lg pl-4"
                      [ngClass]="isSelected(lessonId) ? 'bg-teal-50' : 'hover:bg-slate-50'"
                    >
                      <button
                        type="button"
                        class="min-w-0 flex-1 truncate py-1.5 text-left text-sm"
                        [ngClass]="isSelected(lessonId) ? 'font-semibold text-[#007979]' : 'text-slate-700'"
                        (click)="store.select({ kind: 'lesson', id: lessonId })"
                        [attr.aria-current]="isSelected(lessonId) ? 'true' : null"
                      >
                        {{ lesson.title || ('Untitled lesson' | t) }}
                      </button>
                      <button type="button" class="tree-btn" (click)="store.moveLesson(lessonId, -1)" [attr.aria-label]="'Move lesson up' | t">
                        <mat-icon>arrow_upward</mat-icon>
                      </button>
                      <button type="button" class="tree-btn" (click)="store.moveLesson(lessonId, 1)" [attr.aria-label]="'Move lesson down' | t">
                        <mat-icon>arrow_downward</mat-icon>
                      </button>
                      <button type="button" class="tree-btn hover:!text-rose-600" (click)="removeLesson(lessonId, lesson.title)" [attr.aria-label]="'Delete lesson' | t">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  }
                }

                <button type="button" class="ml-4 mt-1 text-sm font-semibold text-[#007979] hover:underline" (click)="store.addLesson(module.id)">
                  + {{ 'Add lesson' | t }}
                </button>
              </div>
            }

            <button
              type="button"
              class="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-semibold text-slate-600 hover:border-[#007979] hover:text-[#007979]"
              (click)="store.addModule()"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">add</mat-icon>{{ 'Add module' | t }}
            </button>

            <p class="mt-3 text-xs text-slate-500">
              {{ store.lessonCount() }} {{ (store.lessonCount() === 1 ? 'lesson' : 'lessons') | t }} · {{ duration() }}
            </p>

            @if (!published() && store.problems().length) {
              <div class="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                <p class="mb-1 font-semibold">{{ 'Before you publish' | t }}</p>
                <ul class="list-disc space-y-0.5 pl-4">
                  @for (problem of store.problems().slice(0, 5); track problem) {
                    <li>{{ problem }}</li>
                  }
                </ul>
              </div>
            }
          </nav>

          <!-- Editor -->
          <section class="min-w-0">
            @if (store.selectedLesson(); as lesson) {
              <div class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <p class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ 'Lesson' | t }}</p>
                <div class="mt-2 grid gap-3 sm:grid-cols-[1fr_140px]">
                  <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                    <mat-label>{{ 'Lesson title' | t }}</mat-label>
                    <input matInput [value]="lesson.title" (input)="store.patchLesson(lesson.id, { title: value($event) })" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                    <mat-label>{{ 'Minutes' | t }}</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      max="600"
                      [value]="lesson.minutes"
                      (input)="store.patchLesson(lesson.id, { minutes: number($event) })"
                    />
                  </mat-form-field>
                </div>
              </div>

              <div class="mt-3 flex flex-col gap-3">
                @for (block of lesson.blocks; track $index; let blockIndex = $index) {
                  <app-block-editor
                    [block]="block"
                    [index]="blockIndex"
                    [count]="lesson.blocks.length"
                    (change)="store.updateBlock(lesson.id, blockIndex, $event)"
                    (move)="store.moveBlock(lesson.id, blockIndex, $event)"
                    (remove)="store.removeBlock(lesson.id, blockIndex)"
                  />
                } @empty {
                  <p class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                    {{ 'This lesson is empty. Add a block below.' | t }}
                  </p>
                }
              </div>

              <div class="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-3">
                <p class="mb-2 text-xs font-semibold text-slate-500">{{ 'Add a block' | t }}</p>
                <div class="flex flex-wrap gap-2">
                  @for (type of blockTypes; track type) {
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:border-[#007979] hover:bg-teal-50 hover:text-[#007979]"
                      (click)="store.addBlock(lesson.id, type)"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ blockMeta[type].icon }}</mat-icon>
                      {{ blockMeta[type].label | t }}
                    </button>
                  }
                </div>
              </div>
            } @else {
              <!-- Course details -->
              <div class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <p class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ 'Course details' | t }}</p>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Title' | t }}</mat-label>
                  <input matInput maxlength="120" [value]="store.details().title" (input)="store.patchDetails({ title: value($event) })" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'One-line summary (shown on the card)' | t }}</mat-label>
                  <input matInput maxlength="200" [value]="store.details().summary" (input)="store.patchDetails({ summary: value($event) })" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'About this course' | t }}</mat-label>
                  <textarea matInput rows="4" [value]="store.details().description" (input)="store.patchDetails({ description: value($event) })"></textarea>
                </mat-form-field>

                <div class="grid gap-4 sm:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                    <mat-label>{{ 'Topic' | t }}</mat-label>
                    <input matInput maxlength="40" [value]="store.details().topic" (input)="store.patchDetails({ topic: value($event) })" [placeholder]="'e.g. Cybersecurity' | t" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                    <mat-label>{{ 'Level' | t }}</mat-label>
                    <mat-select [value]="store.details().level" (selectionChange)="store.patchDetails({ level: $event.value })">
                      @for (level of levels; track level) {
                        <mat-option [value]="level">{{ levelLabels[level] | t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'What learners will be able to do (one per line)' | t }}</mat-label>
                  <textarea matInput rows="4" [value]="outcomesText()" (input)="store.patchDetails({ outcomes: lines($event) })"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="zb-field zb-field--flush" subscriptSizing="dynamic">
                  <mat-label>{{ 'Skills (separated by commas)' | t }}</mat-label>
                  <input matInput [value]="store.details().skills.join(', ')" (change)="store.patchDetails({ skills: commaList($event) })" />
                </mat-form-field>

                <fieldset>
                  <legend class="mb-2 text-sm text-slate-600">{{ 'Cover' | t }}</legend>
                  <div class="flex flex-wrap gap-2">
                    @for (cover of covers; track cover) {
                      <button
                        type="button"
                        class="h-12 w-20 rounded-lg ring-offset-2 transition"
                        [style.background]="coverStyles[cover]"
                        [ngClass]="store.details().cover === cover ? 'ring-2 ring-[#007979]' : 'hover:ring-2 hover:ring-slate-300'"
                        [attr.aria-pressed]="store.details().cover === cover"
                        [attr.aria-label]="cover"
                        (click)="store.patchDetails({ cover: cover })"
                      ></button>
                    }
                  </div>
                </fieldset>
              </div>
            }
          </section>
        </div>
      }
    </main>
  `,
  styles: [
    `
      .tree-btn {
        display: inline-flex;
        height: 1.75rem;
        width: 1.75rem;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        color: #94a3b8;
      }
      .tree-btn mat-icon {
        height: 16px;
        width: 16px;
        font-size: 16px;
      }
      .tree-btn:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
      }
      .tree-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CourseBuilderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly organizationContext = inject(PartnerOrganizationContextService);
  protected readonly store = inject(CourseBuilderStore);

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly managePath = `${this.context.basePath}/manage`;

  protected readonly blockTypes: LessonBlockType[] = ['text', 'video', 'audio', 'document', 'image', 'tip', 'check'];
  protected readonly blockMeta = BLOCK_META;
  protected readonly levels: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'all'];
  protected readonly levelLabels = COURSE_LEVEL_LABELS;
  protected readonly covers = Object.keys(COURSE_COVERS) as CourseCover[];
  protected readonly coverStyles = COURSE_COVERS;

  protected readonly outcomesText = computed(() => this.store.details().outcomes.join(String.fromCharCode(10)));
  protected readonly published = computed(() => this.store.details().status === 'published');
  protected readonly duration = computed(() => formatMinutes(this.store.totalMinutes()));
  protected readonly statusLabel = computed(() => (this.published() ? 'Published' : 'Draft'));
  protected readonly statusClass = computed(() => (this.published() ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white'));
  protected readonly previewLink = computed(() => {
    const courseId = this.store.courseId();
    return courseId && !this.store.isNew() ? `${this.context.basePath}/${courseId}` : null;
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  constructor() {
    this.pageTitle.setDocumentTitle(this.i18n.t('Course builder'));

    const courseId = this.route.snapshot.paramMap.get('courseId') ?? 'new';
    const providerName = this.context.organizationId
      ? this.organizationContext.organization()?.name?.trim() || ''
      : 'Zebron';

    if (courseId === 'new') {
      this.store.startNew(this.context.organizationId, providerName);
    } else {
      void this.store.load(this.context.organizationId, providerName, courseId);
    }
  }

  /** Ctrl+S / Cmd+S saves. */
  @HostListener('window:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.save('save');
    }
  }

  /** Warn before closing the tab with unsaved changes. */
  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.store.dirty()) {
      event.preventDefault();
    }
  }

  /** Used by the route's canDeactivate guard. */
  canLeave(): boolean {
    return !this.store.dirty() || window.confirm(this.i18n.t('You have unsaved changes. Leave without saving?'));
  }

  protected isSelected(lessonId: string): boolean {
    const selection = this.store.selection();
    return selection.kind === 'lesson' && selection.id === lessonId;
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected number(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 1;
  }

  protected lines(event: Event): string[] {
    return this.value(event).split('\n');
  }

  protected commaList(event: Event): string[] {
    return this.value(event)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  protected removeModule(moduleId: string, title: string): void {
    if (window.confirm(this.i18n.t('Delete the module "{0}" and its lessons?', [title || this.i18n.t('Untitled module')]))) {
      this.store.removeModule(moduleId);
    }
  }

  protected removeLesson(lessonId: string, title: string): void {
    if (window.confirm(this.i18n.t('Delete the lesson "{0}"?', [title || this.i18n.t('Untitled lesson')]))) {
      this.store.removeLesson(lessonId);
    }
  }

  protected async save(action: 'save' | 'publish' | 'unpublish'): Promise<void> {
    const wasNew = this.store.isNew();
    const courseId = await this.store.save(action);
    if (!courseId) {
      return;
    }

    this.toast.success(
      this.i18n.t(action === 'publish' ? 'Published. Learners can see it now.' : action === 'unpublish' ? 'Moved back to draft.' : 'Saved.'),
    );

    if (wasNew) {
      await this.router.navigate([this.managePath, courseId], { replaceUrl: true });
    }
  }

  protected async deleteCourse(): Promise<void> {
    const title = this.store.details().title || this.i18n.t('this course');
    if (!window.confirm(this.i18n.t('Delete "{0}" and all of its lessons? This cannot be undone.', [title]))) {
      return;
    }

    if (await this.store.deleteCourse()) {
      this.toast.success(this.i18n.t('Course deleted.'));
      await this.router.navigateByUrl(this.managePath);
    }
  }

}

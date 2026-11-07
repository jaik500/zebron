import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LoggerService } from '../../../core/services/logger.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { Course, COURSE_COVERS, courseContextFromRoute, courseDate, formatMinutes } from '../course.model';
import { CourseService } from '../course.service';
import { CourseAccessService } from '../course-access.service';
import { CourseAssignment, CourseAssignmentService, dueDateFromInput } from '../course-assignment.service';
import { AuthService } from '../../../core/services/auth.service';
import { firebaseFunctions } from '../../../core/services/firebase-config';
import { httpsCallable } from 'firebase/functions';

interface DirectoryEntry {
  userId: string;
  displayName: string | null;
  email: string | null;
  active?: boolean;
}

const STATUS: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-slate-100 text-slate-700' },
  in_review: { label: 'In review', classes: 'bg-amber-100 text-amber-800' },
  published: { label: 'Published', classes: 'bg-emerald-100 text-emerald-800' },
  archived: { label: 'Archived', classes: 'bg-slate-100 text-slate-500' },
};

/** Course authors: every course here, drafts included, and New course. */
@Component({
  selector: 'app-course-manage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Manage courses' }]"
        [activeTab]="'manage'"
        [canManage]="true"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-semibold text-slate-900">
              {{ (context.organizationId ? 'Your organization\\u0027s courses' : 'Zebron courses') | t }}
            </h1>
            <p class="text-sm text-slate-500">
              {{ (canPublish() ? 'Drafts are only visible here until you publish them.' : 'Write drafts, then submit them for review: a manager publishes them.') | t }}
            </p>
          </div>
          <a
            [routerLink]="context.basePath + '/manage/new'"
            class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
          >
            <mat-icon aria-hidden="true">add</mat-icon>{{ 'New course' | t }}
          </a>
        </div>

        @if (loading()) {
          <div class="flex flex-col gap-2" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-20 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
        } @else if (courses().length) {
          @if (canPublish() && inReview().length) {
            <section class="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3" aria-labelledby="review-title">
              <h2 id="review-title" class="flex items-center gap-2 px-1 text-sm font-semibold text-amber-900">
                <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">rate_review</mat-icon>
                {{ 'Waiting for your review ({0})' | t: [inReview().length] }}
              </h2>
              <ul class="mt-2 flex flex-col gap-2">
                @for (course of inReview(); track course.id) {
                  <li>
                    <a
                      [routerLink]="[context.basePath, 'manage', course.id]"
                      class="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 transition hover:border-[#007979] hover:shadow-sm"
                    >
                      <span class="h-10 w-10 shrink-0 rounded-lg" [style.background]="cover(course)" aria-hidden="true"></span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-semibold text-slate-900">{{ course.title }}</span>
                        <span class="block text-xs text-slate-500">
                          {{ 'Submitted by {0}' | t: [course.review?.submittedByName || ('a staff member' | t)] }}
                          @if (submitted(course)) {
                            · {{ submitted(course) }}
                          }
                        </span>
                      </span>
                      <span class="shrink-0 text-sm font-semibold text-[#007979]">{{ 'Review' | t }}</span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          <ul class="flex flex-col gap-2">
            @for (course of courses(); track course.id) {
              <li class="flex items-stretch gap-2">
                <a
                  [routerLink]="[context.basePath, 'manage', course.id]"
                  class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#007979] hover:shadow-sm"
                >
                  <span class="h-14 w-14 shrink-0 rounded-xl" [style.background]="cover(course)" aria-hidden="true"></span>
                  <span class="min-w-0 flex-1">
                    <span class="flex flex-wrap items-center gap-2">
                      <span class="truncate font-semibold text-slate-900">{{ course.title }}</span>
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" [ngClass]="status(course).classes">{{ status(course).label | t }}</span>
                    </span>
                    <span class="mt-0.5 block text-xs text-slate-500">
                      {{ course.lessonCount }} {{ (course.lessonCount === 1 ? 'lesson' : 'lessons') | t }} · {{ minutes(course) }}
                      @if (updated(course)) {
                        · {{ 'Updated {0}' | t: [updated(course)] }}
                      }
                    </span>
                  </span>
                  <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">edit</mat-icon>
                </a>
                @if (canAssign() && course.status === 'published') {
                  <button
                    type="button"
                    (click)="openAssign(course)"
                    class="inline-flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#007979] transition hover:border-[#007979] hover:bg-teal-50"
                    [attr.aria-label]="'Assign {0}' | t: [course.title]"
                  >
                    <mat-icon aria-hidden="true">assignment_ind</mat-icon>
                    {{ 'Assign' | t }}
                  </button>
                }
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">edit_note</mat-icon>
            <p class="mt-2 font-semibold text-slate-900">{{ 'No courses yet' | t }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ 'Create your first course: add modules and lessons, then publish when it is ready.' | t }}</p>
          </div>
        }
      </div>
    </main>

    <!-- ================= ASSIGN ================= -->
    @if (assignCourse(); as course) {
      <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/60 sm:items-center sm:p-6" (click)="closeAssign()">
        <section
          class="flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-title"
          (click)="$event.stopPropagation()"
        >
          <header class="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] px-5 py-3">
            <div class="min-w-0">
              <h2 id="assign-title" class="truncate text-lg font-semibold text-white">{{ 'Assign course' | t }}</h2>
              <p class="truncate text-xs text-white/85">{{ course.title }}</p>
            </div>
            <button type="button" (click)="closeAssign()" class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/15" [attr.aria-label]="'Close' | t">
              <mat-icon>close</mat-icon>
            </button>
          </header>

          <div class="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
            <div class="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
              <label class="block text-sm sm:col-span-2">
                <span class="font-medium text-slate-700">{{ 'What to take' | t }}</span>
                <select
                  class="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  [value]="assignLessonId()"
                  (change)="assignLessonId.set($any($event.target).value)"
                >
                  <option value="">{{ 'The whole course' | t }}</option>
                  @for (module of course.modules; track module.id) {
                    <optgroup [label]="module.title">
                      @for (lesson of module.lessons; track lesson.id) {
                        <option [value]="lesson.id">{{ lesson.title }}</option>
                      }
                    </optgroup>
                  }
                </select>
                @if (assignLessonId()) {
                  <span class="mt-1 block text-xs text-slate-500">{{ 'A single lesson has no final exam or certificate.' | t }}</span>
                }
              </label>

              <label class="block text-sm">
                <span class="font-medium text-slate-700">{{ 'Due date (optional)' | t }}</span>
                <input
                  type="date"
                  class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  [value]="assignDue()"
                  (input)="assignDue.set($any($event.target).value)"
                />
              </label>

              <label class="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="assignRequired()" (change)="assignRequired.set($any($event.target).checked)" />
                {{ 'Required' | t }}
              </label>

              <label class="block text-sm sm:col-span-2">
                <span class="font-medium text-slate-700">{{ 'Note to learners (optional)' | t }}</span>
                <input
                  type="text"
                  maxlength="500"
                  class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  [value]="assignNote()"
                  (input)="assignNote.set($any($event.target).value)"
                  [placeholder]="'For example: complete before the team meeting.' | t"
                />
              </label>
            </div>

            <div>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-slate-900">{{ 'People' | t }}</h3>
                <span class="text-xs text-slate-500">{{ '{0} selected' | t: [selectedPeople().size] }}</span>
              </div>
              <div class="mt-2 flex gap-2">
                <input
                  type="search"
                  class="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
                  [placeholder]="'Search people' | t"
                  [value]="peopleQuery()"
                  (input)="peopleQuery.set($any($event.target).value)"
                />
                <button type="button" (click)="selectAllShown()" class="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {{ 'Select all' | t }}
                </button>
              </div>

              @if (directoryLoading()) {
                <p class="mt-3 text-sm text-slate-500">{{ 'Loading people…' | t }}</p>
              } @else if (!shownPeople().length) {
                <p class="mt-3 text-sm text-slate-500">{{ 'No one matches.' | t }}</p>
              } @else {
                <ul class="mt-2 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                  @for (person of shownPeople(); track person.userId) {
                    <li>
                      <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          class="h-4 w-4 accent-[#007979]"
                          [checked]="selectedPeople().has(person.userId)"
                          (change)="togglePerson(person.userId)"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-medium text-slate-900">{{ person.displayName || person.email || person.userId }}</span>
                          @if (person.email && person.displayName) {
                            <span class="block truncate text-xs text-slate-500">{{ person.email }}</span>
                          }
                        </span>
                        @if (assignedLabel(person.userId); as label) {
                          <span class="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">{{ label | t }}</span>
                        }
                      </label>
                    </li>
                  }
                </ul>
              }
            </div>

            @if (existingAssignments().length) {
              <div>
                <h3 class="text-sm font-semibold text-slate-900">{{ 'Already assigned ({0})' | t: [existingAssignments().length] }}</h3>
                <ul class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  @for (assignment of existingAssignments(); track assignment.id) {
                    <li class="flex items-center gap-3 px-3 py-2 text-sm">
                      <span class="min-w-0 flex-1">
                        <span class="block truncate font-medium text-slate-900">{{ assignment.userName }}</span>
                        <span class="block truncate text-xs text-slate-500">
                          {{ assignment.lessonTitle || ('Whole course' | t) }}
                          @if (assignment.dueAt) {
                            · {{ 'Due {0}' | t: [dueLabel(assignment.dueAt)] }}
                          }
                          @if (assignment.required) {
                            · {{ 'Required' | t }}
                          }
                        </span>
                      </span>
                      <button
                        type="button"
                        (click)="removeAssignment(assignment)"
                        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                        [attr.aria-label]="'Remove assignment for {0}' | t: [assignment.userName]"
                      >
                        <mat-icon class="!h-5 !w-5 !text-[20px]">delete</mat-icon>
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (assignError()) {
              <p class="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{{ assignError()! | t }}</p>
            }
          </div>

          <footer class="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button type="button" (click)="closeAssign()" class="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {{ 'Close' | t }}
            </button>
            <button
              type="button"
              (click)="saveAssign(course)"
              [disabled]="assignSaving() || !selectedPeople().size"
              class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ (assignSaving() ? 'Assigning…' : 'Assign to {0}') | t: [selectedPeople().size] }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
})
export class CourseManageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CourseService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly courses = signal<Course[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly locale = computed(() => (this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'));

  private readonly access = inject(CourseAccessService);
  /** Managers and above publish; staff submit for review. */
  protected readonly canPublish = computed(() => this.access.canPublish(this.context));
  protected readonly inReview = computed(() => this.courses().filter((course) => course.status === 'in_review'));

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  // ---------- Assignments (organization courses, managers and above) ----------
  private readonly assignments = inject(CourseAssignmentService);
  private readonly auth = inject(AuthService);

  protected readonly canAssign = computed(() => !!this.context.organizationId && this.canPublish());
  protected readonly assignCourse = signal<Course | null>(null);
  protected readonly assignLessonId = signal('');
  protected readonly assignDue = signal('');
  protected readonly assignRequired = signal(true);
  protected readonly assignNote = signal('');
  protected readonly assignSaving = signal(false);
  protected readonly assignError = signal<string | null>(null);
  protected readonly existingAssignments = signal<CourseAssignment[]>([]);
  protected readonly selectedPeople = signal<Set<string>>(new Set());
  protected readonly peopleQuery = signal('');
  private readonly directory = signal<DirectoryEntry[]>([]);
  protected readonly directoryLoading = signal(false);

  protected readonly shownPeople = computed(() => {
    const term = this.peopleQuery().trim().toLowerCase();
    return this.directory()
      .filter((person) => person.active !== false)
      .filter((person) => !term || `${person.displayName ?? ''} ${person.email ?? ''}`.toLowerCase().includes(term))
      .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.courses.set(await this.service.listAll(this.context.organizationId));
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Could not list courses.', error);
      this.error.set('Courses could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected cover(course: Course): string {
    return COURSE_COVERS[course.cover] ?? COURSE_COVERS.teal;
  }

  protected status(course: Course): { label: string; classes: string } {
    return STATUS[course.status] ?? STATUS['draft'];
  }

  protected minutes(course: Course): string {
    return formatMinutes(course.estimatedMinutes);
  }

  protected submitted(course: Course): string {
    return courseDate(course.review?.submittedAt ?? null, this.locale());
  }

  protected updated(course: Course): string {
    return courseDate(course.updatedAt, this.locale());
  }

  // ---------- Assignments ----------

  protected openAssign(course: Course): void {
    this.assignCourse.set(course);
    this.assignLessonId.set('');
    this.assignDue.set('');
    this.assignRequired.set(true);
    this.assignNote.set('');
    this.assignError.set(null);
    this.selectedPeople.set(new Set());
    this.peopleQuery.set('');
    this.existingAssignments.set([]);
    void this.loadDirectory();
    void this.loadExisting(course);
  }

  protected closeAssign(): void {
    this.assignCourse.set(null);
  }

  protected togglePerson(userId: string): void {
    const next = new Set(this.selectedPeople());
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    this.selectedPeople.set(next);
  }

  protected selectAllShown(): void {
    const next = new Set(this.selectedPeople());
    for (const person of this.shownPeople()) {
      next.add(person.userId);
    }
    this.selectedPeople.set(next);
  }

  /** Shown next to people who already have this course (or the chosen lesson). */
  protected assignedLabel(userId: string): string | null {
    const lessonId = this.assignLessonId() || null;
    return this.existingAssignments().some((item) => item.userId === userId && item.lessonId === lessonId) ? 'Assigned' : null;
  }

  protected dueLabel(date: Date): string {
    return date.toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected async saveAssign(course: Course): Promise<void> {
    const organizationId = this.context.organizationId;
    const user = this.auth.firebaseUser();
    if (!organizationId || !user || !this.selectedPeople().size) {
      return;
    }

    const lessonId = this.assignLessonId() || null;
    const lesson = lessonId ? course.modules.flatMap((module) => module.lessons).find((item) => item.id === lessonId) ?? null : null;
    const byId = new Map(this.directory().map((person) => [person.userId, person]));
    const profile = this.auth.user() as { displayName?: string } | null;

    this.assignSaving.set(true);
    this.assignError.set(null);

    try {
      await this.assignments.assign(
        organizationId,
        [...this.selectedPeople()].map((userId) => ({
          userId,
          userName: byId.get(userId)?.displayName || byId.get(userId)?.email || userId,
        })),
        {
          courseId: course.id,
          courseTitle: course.title,
          cover: course.cover,
          lessonId: lesson?.id ?? null,
          lessonTitle: lesson?.title ?? null,
          dueAt: dueDateFromInput(this.assignDue()),
          required: this.assignRequired(),
          note: this.assignNote(),
        },
        { uid: user.uid, name: profile?.displayName || user.displayName || user.email || '' },
      );
      this.selectedPeople.set(new Set());
      await this.loadExisting(course);
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Could not assign the course.', error);
      this.assignError.set('The course could not be assigned. Try again.');
    } finally {
      this.assignSaving.set(false);
    }
  }

  protected async removeAssignment(assignment: CourseAssignment): Promise<void> {
    const organizationId = this.context.organizationId;
    if (!organizationId) {
      return;
    }

    try {
      await this.assignments.remove(organizationId, assignment.id);
      this.existingAssignments.set(this.existingAssignments().filter((item) => item.id !== assignment.id));
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Could not remove the assignment.', error);
      this.assignError.set('The assignment could not be removed. Try again.');
    }
  }

  private async loadExisting(course: Course): Promise<void> {
    if (!this.context.organizationId) {
      return;
    }
    try {
      this.existingAssignments.set(await this.assignments.listForCourse(this.context.organizationId, course.id));
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Could not load assignments.', error);
    }
  }

  private async loadDirectory(): Promise<void> {
    if (this.directory().length || !this.context.organizationId) {
      return;
    }

    this.directoryLoading.set(true);
    try {
      const callable = httpsCallable<{ organizationId: string }, { members: DirectoryEntry[] }>(
        firebaseFunctions,
        'getOrganizationMemberDirectory',
      );
      this.directory.set((await callable({ organizationId: this.context.organizationId })).data.members ?? []);
    } catch (error) {
      this.logger.error('CourseManageComponent', 'Member directory unavailable.', error);
      this.assignError.set('People could not be loaded. Try again.');
    } finally {
      this.directoryLoading.set(false);
    }
  }
}

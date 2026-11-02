import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import {
  CertificationDefinition,
  CertificationEnrollment,
  CertificationService,
  certificationStage,
  CertificationStage,
  stepKey,
} from '../certification.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { COURSE_COVERS, courseContextFromRoute } from '../course.model';
import { CourseAccessService } from '../course-access.service';

const STAGE: Record<CertificationStage, { label: string; classes: string; icon: string }> = {
  'not-enrolled': { label: 'Not started', classes: 'bg-slate-100 text-slate-700', icon: 'flag' },
  'in-progress': { label: 'In progress', classes: 'bg-amber-100 text-amber-800', icon: 'pending' },
  'exam-ready': { label: 'Exam ready', classes: 'bg-sky-100 text-sky-800', icon: 'assignment' },
  waiting: { label: 'Waiting period', classes: 'bg-rose-100 text-rose-800', icon: 'schedule' },
  certified: { label: 'Certified', classes: 'bg-emerald-100 text-emerald-800', icon: 'verified' },
  expired: { label: 'Expired: renew', classes: 'bg-rose-100 text-rose-800', icon: 'update' },
  prepared: { label: 'Ready for the real exam', classes: 'bg-emerald-100 text-emerald-800', icon: 'task_alt' },
};

/** Exam prep wording for the stages that read differently. */
const PREP_STAGE: Partial<Record<CertificationStage, { label: string; classes: string; icon: string }>> = {
  'exam-ready': { label: 'Practice exam open', classes: 'bg-sky-100 text-sky-800', icon: 'quiz' },
};

/**
 * Certifications tab: every certification with its ordered courses and
 * the learner's standing. Opens the certification page.
 */
@Component({
  selector: 'app-certification-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Certifications' }]"
        [activeTab]="'certifications'"
        [canManage]="canManage()"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-5 max-w-3xl">
          <h1 class="text-lg font-semibold text-slate-900">{{ 'Certifications' | t }}</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ 'Complete the courses in order, then pass the certification exam to earn a credential you can share. Courses cannot be skipped.' | t }}
          </p>
        </div>

        @if (loading()) {
          <div class="grid gap-4 md:grid-cols-2" aria-hidden="true">
            @for (item of [1, 2]; track item) {
              <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
        } @else if (!rows().length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">military_tech</mat-icon>
            <p class="mt-2 text-sm text-slate-600">{{ 'No certifications are available yet.' | t }}</p>
          </div>
        } @else {
          @for (group of groups(); track group.kind) {
          <section class="mb-8" [attr.aria-labelledby]="'cert-group-' + group.kind">
            <h2 [id]="'cert-group-' + group.kind" class="text-sm font-bold uppercase tracking-wide text-slate-500">{{ group.title | t }}</h2>
            <p class="mb-3 mt-0.5 max-w-3xl text-sm text-slate-600">{{ group.note | t }}</p>
          <div class="grid gap-4 md:grid-cols-2">
            @for (row of group.rows; track row.definition.key) {
              <a
                [routerLink]="[context.basePath, 'certifications', row.definition.key]"
                class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007979]/50"
              >
                <div class="flex items-start gap-3 p-5 text-white" [style.background]="cover(row.definition)">
                  <mat-icon class="!h-10 !w-10 shrink-0 !text-[40px]" aria-hidden="true">military_tech</mat-icon>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-wide text-white/80">
                      @if (row.definition.vendor; as vendor) {
                        {{ 'Exam prep' | t }} · {{ vendor.name }} {{ vendor.code }}
                      } @else {
                        {{ row.definition.providerName }}
                      }
                    </p>
                    <h2 class="text-lg font-bold leading-snug">{{ row.definition.credentialName }}</h2>
                  </div>
                  <span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" [ngClass]="stage(row).classes">
                    <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">{{ stage(row).icon }}</mat-icon>
                    {{ stage(row).label | t }}
                  </span>
                </div>

                <div class="flex flex-1 flex-col gap-3 p-5">
                  @if (row.definition.summary) {
                    <p class="text-sm text-slate-600">{{ row.definition.summary }}</p>
                  }
                  @if (row.definition.preparesFor.length) {
                    <p class="text-xs text-slate-500">
                      <span class="font-semibold text-slate-700">{{ 'Prepares you for' | t }}:</span> {{ row.definition.preparesFor.join(', ') }}
                    </p>
                  }

                  <!-- Steps at a glance -->
                  <div class="flex flex-wrap items-center gap-1" [attr.aria-label]="'{0} of {1} courses completed' | t: [row.done, row.definition.courses.length]">
                    @for (course of row.definition.courses; track $index; let step = $index) {
                      <span
                        class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                        [ngClass]="row.passed.has(step) ? 'bg-emerald-500 text-white' : step === row.done ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'"
                        [title]="course.title"
                      >{{ step + 1 }}</span>
                    }
                    <mat-icon class="!h-5 !w-5 !text-[20px]" [ngClass]="row.done === row.definition.courses.length ? 'text-[#007979]' : 'text-slate-300'" aria-hidden="true">
                      {{ row.done === row.definition.courses.length ? 'assignment_turned_in' : 'lock' }}
                    </mat-icon>
                  </div>

                  <p class="mt-auto text-xs text-slate-500">
                    {{ '{0} courses' | t: [row.definition.courses.length] }} ·
                    @if (row.definition.kind === 'exam-prep') {
                      {{ '{0} objectives covered' | t: [row.definition.objectives.length] }} ·
                      {{ 'Practice exam: {0} questions' | t: [row.definition.exam.questionCount] }} ·
                      {{ 'Real exam taken with {0}' | t: [row.definition.vendor?.name ?? ''] }}
                    } @else {
                      {{ 'Exam: {0}% to pass' | t: [row.definition.exam.passMark] }} ·
                      {{ 'Valid {0} years' | t: [row.definition.validityYears] }}
                      @if (row.enrollment?.credential?.expiresAt; as expires) {
                        · <span class="font-semibold text-slate-700">{{ 'Valid until {0}' | t: [dateLabel(expires)] }}</span>
                      }
                    }
                  </p>
                </div>
              </a>
            }
          </div>
          </section>
          }
        }
      </div>
    </main>
  `,
})
export class CertificationListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly service = inject(CertificationService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);
  private readonly access = inject(CourseAccessService);

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly canManage = computed(() => this.access.canManage(this.context));

  private readonly definitions = signal<CertificationDefinition[]>([]);
  private readonly enrollments = signal<Map<string, CertificationEnrollment>>(new Map());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  protected readonly rows = computed(() =>
    this.definitions().map((definition) => {
      const enrollment = this.enrollments().get(definition.key) ?? null;
      const passed = new Set<number>();
      for (const [index, course] of definition.courses.entries()) {
        if (enrollment?.stepPasses[stepKey(course)]) {
          passed.add(index);
        } else {
          break;
        }
      }
      return { definition, enrollment, passed, done: passed.size };
    }),
  );

  protected readonly groups = computed(() =>
    [
      {
        kind: 'zebron',
        title: 'Zebron certifications',
        note: 'Earned on Zebron: complete the courses in order, then pass the certification exam.',
        rows: this.rows().filter((row) => row.definition.kind !== 'exam-prep'),
      },
      {
        kind: 'exam-prep',
        title: 'Industry exam preparation',
        note: 'Prepare for a vendor certification with the same ordered path and a full practice exam. You book and take the real exam with the vendor.',
        rows: this.rows().filter((row) => row.definition.kind === 'exam-prep'),
      },
    ].filter((group) => group.rows.length),
  );

  constructor() {
    void this.loadDefinitions();

    effect(() => {
      const user = this.auth.firebaseUser();
      untracked(() => void this.loadEnrollments(user?.uid ?? null));
    });
  }

  protected stage(row: { definition: CertificationDefinition; enrollment: CertificationEnrollment | null }) {
    const stage = certificationStage(row.definition, row.enrollment);
    return (row.definition.kind === 'exam-prep' ? PREP_STAGE[stage] : undefined) ?? STAGE[stage];
  }

  protected cover(definition: CertificationDefinition): string {
    return COURSE_COVERS[definition.cover] ?? COURSE_COVERS.navy;
  }

  protected dateLabel(value: Date): string {
    return value.toLocaleDateString(this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private async loadDefinitions(): Promise<void> {
    try {
      this.definitions.set(await this.service.listDefinitions(this.context.organizationId));
    } catch (error) {
      this.logger.error('CertificationListComponent', 'Could not load certifications.', error);
      this.error.set('Certifications could not be loaded. Try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadEnrollments(userId: string | null): Promise<void> {
    if (!userId) {
      this.enrollments.set(new Map());
      return;
    }
    try {
      this.enrollments.set(await this.service.myEnrollments(userId));
    } catch {
      this.enrollments.set(new Map());
    }
  }
}

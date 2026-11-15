import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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
import { CourseService } from '../course.service';
import { CourseHeaderComponent } from '../components/course-header.component';
import { COURSE_COVERS, courseContextFromRoute } from '../course.model';
import { CourseAccessService } from '../course-access.service';
import { PartnerAccessService } from '../../../core/services/partner-access.service';

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

type CertificationCategory = 'organization' | 'zebron' | 'external';

interface CertificationGroup {
  kind: CertificationCategory;
  icon: string;
  title: string;
  note: string;
  rows: CertificationRow[];
}

interface CertificationRow {
  definition: CertificationDefinition;
  enrollment: CertificationEnrollment | null;
  passed: Set<number>;
  done: number;
}

/** Lower case, accents removed, single spaces: so "securite" finds "Sécurité". */
function normalize(value: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Certifications' }]"
        [activeTab]="'certifications'"
        [canManage]="canManage()"
        [showSearch]="true"
        [query]="query()"
        (queryChange)="query.set($event)"
        searchLabel="Search certifications"
        searchPlaceholder="Name, vendor, exam code or course..."
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="mb-5 max-w-3xl">
          <h1 class="text-lg font-semibold text-slate-900">{{ 'Certifications' | t }}</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ 'Complete the courses in order, then pass the final exam. Courses cannot be skipped.' | t }}
          </p>
        </div>

        <!-- Organization admins: which Zebron certifications members see -->
        @if (canChooseCategories() && settings(); as current) {
          <section class="mb-5 rounded-2xl border border-slate-200 bg-white p-4" aria-labelledby="cert-settings-title">
            <h2 id="cert-settings-title" class="text-sm font-semibold text-slate-900">{{ 'Certifications your members see' | t }}</h2>
            <p class="mt-0.5 text-xs text-slate-500">{{ "Your organization\u0027s own certifications are always shown. Switch on Zebron\u0027s catalogues to offer them too." | t }}</p>
            <div class="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="current.zebron" [disabled]="savingSettings()" (change)="saveSettings({ zebron: $any($event.target).checked, external: current.external })" />
                {{ 'Zebron Certifications' | t }}
              </label>
              <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" class="h-4 w-4 accent-[#007979]" [checked]="current.external" [disabled]="savingSettings()" (change)="saveSettings({ zebron: current.zebron, external: $any($event.target).checked })" />
                {{ 'External Professional Certifications' | t }}
              </label>
            </div>
            @if (settingsError()) {
              <p class="mt-2 text-xs text-rose-700" role="alert">{{ settingsError()! | t }}</p>
            }
          </section>
        }

        <!-- Categories: the organization's own (on organization pages), Zebron and external -->
        @if (groups().length > 1) {
        <div class="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1" role="tablist" [attr.aria-label]="'Certification categories' | t">
          @for (group of groups(); track group.kind) {
            <button
              type="button"
              role="tab"
              [id]="'cert-tab-' + group.kind"
              [attr.aria-selected]="category() === group.kind"
              [attr.aria-controls]="'cert-panel-' + group.kind"
              (click)="selectCategory(group.kind)"
              class="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition"
              [ngClass]="category() === group.kind ? 'bg-[#007979] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ group.icon }}</mat-icon>
              {{ group.title | t }}
              <span class="rounded-full px-1.5 text-xs" [ngClass]="category() === group.kind ? 'bg-white/20' : 'bg-slate-100 text-slate-600'">{{ group.rows.length }}</span>
            </button>
          }
        </div>
        }

        @if (loading() || (context.organizationId && settings() === null)) {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
            @for (item of [1, 2]; track item) {
              <div class="h-64 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else if (error()) {
          <p class="rounded-xl bg-rose-50 p-4 text-sm text-rose-700" role="alert">{{ error()! | t }}</p>
        } @else if (!current().rows.length && searching()) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">search_off</mat-icon>
            <p class="mt-2 text-sm text-slate-600">{{ 'No certifications in this category match your search.' | t }}</p>
            @if (otherGroup(); as other) {
              @if (other.rows.length) {
                <button type="button" (click)="selectCategory(other.kind)" class="mt-2 text-sm font-semibold text-[#007979] underline">
                  {{ 'Show {0} in {1}' | t: [other.rows.length, (other.title | t)] }}
                </button>
              }
            }
            <button type="button" (click)="query.set('')" class="ml-3 mt-2 text-sm font-semibold text-[#007979] underline">{{ 'Clear search' | t }}</button>
          </div>
        } @else if (!current().rows.length) {
          <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">military_tech</mat-icon>
            <p class="mt-2 text-sm text-slate-600">
              {{ (current().kind === 'organization' ? 'Your organization has no certifications yet.' : 'No certifications in this category yet.') | t }}
            </p>
          </div>
        } @else {
          @if (current(); as group) {
          <section [id]="'cert-panel-' + group.kind" role="tabpanel" [attr.aria-labelledby]="'cert-tab-' + group.kind">
            <p class="mb-4 max-w-3xl text-sm text-slate-600">{{ group.note | t }}</p>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            @for (row of group.rows; track row.definition.key) {
              <a
                [routerLink]="[context.basePath, 'certifications', row.definition.key]"
                class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007979]/50"
              >
                <div class="pb-3 pl-3 pr-5 pt-1.5 text-white" [style.background]="cover(row.definition)">
                  <!-- Badge, provider and status on one line; the title below lines up with the provider (badge 2.25rem + gap 0.5rem). -->
                  <div class="flex min-w-0 items-center gap-2">
                    <mat-icon class="!h-9 !w-9 shrink-0 !text-[36px] !leading-none" aria-hidden="true">military_tech</mat-icon>
                    <p class="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide text-white/80">
                      @if (row.definition.vendor; as vendor) {
                        {{ vendor.name }} · {{ 'Exam preparation' | t }}
                      } @else {
                        {{ row.definition.providerName }}
                      }
                    </p>
                    <span class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" [ngClass]="stage(row).classes">
                      <mat-icon class="!h-3.5 !w-3.5 !text-[14px] !leading-none" aria-hidden="true">{{ stage(row).icon }}</mat-icon>
                      {{ stage(row).label | t }}
                    </span>
                  </div>
                  <h2 class="-mt-1.5 break-words pl-11 text-lg font-bold leading-snug [overflow-wrap:anywhere]">{{ row.definition.credentialName }}</h2>
                </div>

                <div class="flex min-w-0 flex-1 flex-col gap-3 p-5">
                  @if (row.definition.summary) {
                    <p class="text-sm text-slate-600">{{ row.definition.summary }}</p>
                  }
                  @if (row.definition.preparesFor.length && row.definition.kind !== 'exam-prep') {
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
  private readonly router = inject(Router);
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

  // ---------- Search ----------
  protected readonly query = signal('');
  protected readonly searching = computed(() => !!this.query().trim());

  /** Rows matching every word of the search, in any order; the tab counts follow it. */
  private readonly matchingRows = computed(() => {
    const words = normalize(this.query()).split(' ').filter(Boolean);
    if (!words.length) {
      return this.rows();
    }
    return this.rows().filter((row) => {
      const definition = row.definition;
      const haystack = normalize(
        [
          definition.credentialName,
          definition.title,
          definition.summary,
          definition.providerName,
          definition.vendor?.name ?? '',
          definition.vendor?.exam ?? '',
          definition.vendor?.code ?? '',
          ...definition.preparesFor,
          ...definition.courses.map((course) => course.title),
          this.stage(row).label,
        ].join(' '),
      );
      return words.every((word) => haystack.includes(word));
    });
  });

  /**
   * Categories. On organization pages: the organization's own
   * certifications, plus Zebron and external ones only when an
   * organization admin switched them on. On Zebron's pages: Zebron and
   * external.
   */
  protected readonly groups = computed(() => {
    const rows = this.matchingRows();
    const organizationId = this.context.organizationId;
    const settings = this.settings();
    const groups: CertificationGroup[] = [];

    if (organizationId) {
      groups.push({
        kind: 'organization',
        icon: 'corporate_fare',
        title: 'Your organization',
        note: 'Certifications created by your organization: complete the courses in order, then pass the certification exam.',
        rows: rows.filter((row) => row.definition.organizationId !== null),
      });
    }
    if (!organizationId || settings?.zebron) {
      groups.push({
        kind: 'zebron',
        icon: 'military_tech',
        title: 'Zebron Certifications',
        note: 'Earned on Zebron: complete the courses in order, then pass the certification exam on Zebron to receive a Zebron credential anyone can verify.',
        rows: rows.filter((row) => row.definition.organizationId === null && row.definition.kind !== 'exam-prep'),
      });
    }
    if (!organizationId || settings?.external) {
      groups.push({
        kind: 'external',
        icon: 'workspace_premium',
        title: 'External Professional Certifications',
        note: 'Industry certifications awarded by their vendors, such as CompTIA and ServiceNow. Zebron prepares you with the same ordered courses, a map of every exam objective and a full practice exam; you book and take the real exam with the vendor.',
        rows: rows.filter((row) => row.definition.organizationId === null && row.definition.kind === 'exam-prep'),
      });
    }
    return groups;
  });

  /** The selected category (?category=zebron|external), remembered in the URL. */
  private readonly requestedCategory = signal<CertificationCategory | null>(
    (['organization', 'zebron', 'external'] as const).find((kind) => kind === this.route.snapshot.queryParamMap.get('category')) ?? null,
  );
  /** The requested category when it is shown, otherwise the first one. */
  protected readonly category = computed<CertificationCategory>(() => {
    const kinds = this.groups().map((group) => group.kind);
    const requested = this.requestedCategory();
    return requested && kinds.includes(requested) ? requested : kinds[0] ?? 'zebron';
  });
  protected readonly current = computed(
    () => this.groups().find((group) => group.kind === this.category()) ?? { kind: this.category(), icon: '', title: '', note: '', rows: [] },
  );
  protected readonly otherGroup = computed(
    () => this.groups().find((group) => group.kind !== this.category() && group.rows.length > 0) ?? null,
  );

  protected selectCategory(kind: CertificationCategory): void {
    this.requestedCategory.set(kind);
    const first = this.groups()[0]?.kind;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: kind === first ? null : kind },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // ---------- Organization settings: Zebron and external certifications ----------
  private readonly courseService = inject(CourseService);
  private readonly partnerAccess = inject(PartnerAccessService);
  /** null on Zebron's pages, or until loaded. */
  protected readonly settings = signal<{ zebron: boolean; external: boolean } | null>(null);
  protected readonly savingSettings = signal(false);
  protected readonly settingsError = signal<string | null>(null);
  protected readonly canChooseCategories = computed(() => !!this.context.organizationId && this.partnerAccess.isAdmin());

  private loadSettings(): void {
    const organizationId = this.context.organizationId;
    if (!organizationId) return;
    this.courseService
      .getCertificationSettings(organizationId)
      .then((settings) => this.settings.set(settings))
      .catch(() => this.settings.set({ zebron: false, external: false }));
  }

  protected async saveSettings(next: { zebron: boolean; external: boolean }): Promise<void> {
    const organizationId = this.context.organizationId;
    const user = this.auth.firebaseUser();
    if (!organizationId || !user) return;

    const previous = this.settings();
    this.settings.set(next);
    this.savingSettings.set(true);
    this.settingsError.set(null);
    try {
      await this.courseService.setCertificationSettings(organizationId, next, user.uid);
    } catch (error) {
      this.settings.set(previous);
      this.logger.error('CertificationListComponent', 'Could not save the certification settings.', error);
      this.settingsError.set('The change could not be saved. Try again.');
    } finally {
      this.savingSettings.set(false);
    }
  }

  constructor() {
    this.loadSettings();
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

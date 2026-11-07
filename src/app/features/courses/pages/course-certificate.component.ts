import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { courseContextFromRoute, courseDate, hasCertificate } from '../course.model';
import { CourseStore } from '../course.store';

/** The certificate for a completed course, ready to print or add to LinkedIn. */
@Component({
  selector: 'app-course-certificate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  styles: [
    `
      @media print {
        :host ::ng-deep app-course-header,
        .no-print {
          display: none !important;
        }
        .certificate {
          border-color: #007979 !important;
          box-shadow: none !important;
          margin: 0 !important;
        }
      }
    `,
  ],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-slate-50 print:mt-0 print:bg-white">
      <app-course-header
        [basePath]="context.basePath"
        [backLink]="coursePath()"
        [crumbs]="[
          { label: 'Learning', link: context.basePath },
          { label: store.course()?.title ?? 'Course', link: coursePath(), translate: !store.course() },
          { label: 'Certificate' }
        ]"
      />

      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        @if (store.courseLoading() || (!store.progressLoaded() && signedIn())) {
          <div class="h-96 animate-pulse rounded-2xl bg-slate-200/70" aria-hidden="true"></div>
        } @else if (record(); as progress) {
          <section class="certificate rounded-2xl border-[6px] border-double border-[#007979] bg-white px-6 py-10 text-center shadow-sm sm:px-12">
            <mat-icon class="!h-12 !w-12 !text-[48px] text-[#007979]" aria-hidden="true">workspace_premium</mat-icon>
            <p class="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#007979]">{{ 'Certificate of completion' | t }}</p>
            <h1 class="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{{ progress.courseTitle }}</h1>
            <p class="mt-6 text-sm text-slate-500">{{ 'This certifies that' | t }}</p>
            <p class="mt-1 text-3xl font-semibold text-[#007979]">{{ progress.learnerName }}</p>
            <p class="mx-auto mt-4 max-w-lg text-sm text-slate-600">
              {{ 'completed {0} lessons on {1}.' | t: [progress.lessonCount, completedOn()] }}
            </p>
            @if (score() !== null) {
              <p class="mt-1 text-sm text-slate-600">{{ 'Final exam score: {0}%' | t: [score()] }}</p>
            }

            @if (progress.skills.length) {
              <div class="mt-5 flex flex-wrap justify-center gap-1.5">
                @for (skill of progress.skills; track skill) {
                  <span class="rounded-md bg-teal-50 px-2 py-0.5 text-xs text-[#007979]">{{ skill }}</span>
                }
              </div>
            }

            <p class="mt-8 text-xs text-slate-500">
              {{ 'Issued by {0}' | t: [issuer()] }} · {{ 'Certificate {0}' | t: [code()] }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ 'Check it at' | t }} <a [routerLink]="['/verify', code()]" class="font-medium text-[#007979] hover:underline">{{ verifyUrl() }}</a>
            </p>
          </section>

          <div class="no-print mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              (click)="print()"
              class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">print</mat-icon>{{ 'Print or save as PDF' | t }}
            </button>
            <a
              [href]="linkedInUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">share</mat-icon>{{ 'Add to LinkedIn' | t }}
            </a>
            <a
              [routerLink]="context.basePath + '/catalog'"
              class="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">auto_stories</mat-icon>{{ 'Find your next course' | t }}
            </a>
          </div>
        } @else {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-400" aria-hidden="true">workspace_premium</mat-icon>
            <p class="mt-2 text-slate-700">{{ (store.course()?.finalExam ? 'Finish every lesson and pass the final exam to earn the certificate.' : 'This course does not award a certificate.') | t }}</p>
            <a [routerLink]="coursePath()" class="mt-3 inline-block font-semibold text-[#007979] hover:underline">{{ 'Back to the course' | t }}</a>
          </div>
        }
      </div>
    </main>
  `,
})
export class CourseCertificateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly pageTitle = inject(PageTitleService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly courseId = this.route.snapshot.paramMap.get('courseId') ?? '';

  protected readonly signedIn = computed(() => this.auth.firebaseUser() !== null);
  protected readonly coursePath = computed(() => `${this.context.basePath}/${this.store.course()?.id ?? this.courseId}`);

  /** The learner's progress, only once the final exam is passed. */
  protected readonly record = computed(() => {
    const progress = this.store.courseProgress();
    return hasCertificate(progress, this.store.courseExam()) ? progress : null;
  });

  protected readonly exam = computed(() => this.store.courseExam());
  protected readonly score = computed(() => this.exam()?.passScore ?? this.exam()?.bestScore ?? null);
  protected readonly code = computed(() => this.exam()?.certificateCode ?? '');
  protected readonly verifyUrl = computed(() => `${typeof window === 'undefined' ? '' : window.location.origin}/verify/${this.code()}`);
  protected readonly completedOn = computed(() =>
    courseDate(this.exam()?.passedAt ?? this.record()?.completedAt, this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US'),
  );
  protected readonly issuer = computed(() => {
    const provider = this.store.course()?.providerName;
    return provider && provider !== 'Zebron' ? `Zebron · ${provider}` : 'Zebron';
  });

  /** LinkedIn's "Add licence or certification" form, filled in. */
  protected readonly linkedInUrl = computed(() => {
    const record = this.record();
    const issued = this.exam()?.passedAt?.toDate() ?? record?.completedAt?.toDate() ?? new Date();
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: record?.courseTitle ?? '',
      organizationName: 'Zebron',
      issueYear: String(issued.getFullYear()),
      issueMonth: String(issued.getMonth() + 1),
      certId: this.code(),
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  });

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  private readonly tabTitle = effect(() => {
    const title = this.record()?.courseTitle;
    if (title) {
      this.pageTitle.setDocumentTitle(`${this.i18n.t('Certificate')} · ${title}`);
    }
  });

  constructor() {
    this.store.setContext(this.context);
    void this.store.openCourse(this.courseId);

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });
  }

  protected print(): void {
    window.print();
  }
}

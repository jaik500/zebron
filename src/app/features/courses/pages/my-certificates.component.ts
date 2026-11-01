import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { useLearningHeaderTitle } from '../../test-center/learner-route';

import { CourseHeaderComponent } from '../components/course-header.component';
import { COURSE_COVERS, courseContextFromRoute, courseDate, courseLink, CourseProgress, hasCertificate } from '../course.model';
import { CourseAccessService } from '../course-access.service';
import { CourseStore } from '../course.store';

/** Every course the learner has completed, with a link to its certificate. */
@Component({
  selector: 'app-my-certificates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe, CourseHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Certificates' }]"
        [activeTab]="'certificates'"
        [canManage]="canManage()"
      />

      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        @if (!signedIn()) {
          <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p class="text-slate-700">{{ 'Sign in to see your certificates.' | t }}</p>
            <a routerLink="/login" class="mt-3 inline-block font-semibold text-[#007979] hover:underline">{{ 'Sign in' | t }}</a>
          </div>
        } @else if (!store.progressLoaded()) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            @for (item of [1, 2, 3]; track item) {
              <div class="h-48 animate-pulse rounded-2xl bg-slate-200/70"></div>
            }
          </div>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (record of certificates(); track record.id) {
              <a
                [routerLink]="linkFor(record) + '/certificate'"
                class="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div class="relative h-20" [style.background]="coverOf(record)">
                  <mat-icon class="absolute bottom-3 right-3 !h-8 !w-8 !text-[32px] text-white/90" aria-hidden="true">workspace_premium</mat-icon>
                </div>
                <div class="p-4">
                  <h2 class="font-semibold text-slate-900">{{ record.courseTitle }}</h2>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ 'Completed {0}' | t: [dateOf(record)] }}
                    @if (scoreOf(record) !== null) {
                      · {{ scoreOf(record) }}%
                    }
                  </p>
                </div>
              </a>
            }

            <!-- What is next -->
            <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <mat-icon class="!h-9 !w-9 !text-[36px] text-slate-400" aria-hidden="true">workspace_premium</mat-icon>
              <p class="mt-2 text-sm text-slate-600">
                @if (store.continueRecord(); as next) {
                  {{ 'Finish {0} for your next certificate.' | t: [next.courseTitle] }}
                } @else {
                  {{ 'Pass a course\\u0027s final exam to earn a certificate.' | t }}
                }
              </p>
              <a
                [routerLink]="store.continueRecord() ? linkFor(store.continueRecord()!) : context.basePath + '/catalog'"
                class="mt-2 text-sm font-semibold text-[#007979] hover:underline"
              >
                {{ (store.continueRecord() ? 'Continue learning' : 'Browse courses') | t }}
              </a>
            </div>
          </div>
        }
      </div>
    </main>
  `,
})
export class MyCertificatesComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  protected readonly store = inject(CourseStore);

  protected readonly context = courseContextFromRoute(this.route);
  private readonly access = inject(CourseAccessService);
  protected readonly canManage = computed(() => this.access.canManage(this.context));
  protected readonly signedIn = computed(() => this.auth.firebaseUser() !== null);

  /** Courses whose final exam is passed: only these award a certificate. */
  protected readonly certificates = computed(() =>
    this.store.completed().filter((record) => hasCertificate(record, this.store.exams()[record.id])),
  );

  private readonly headerTitle = useLearningHeaderTitle(this.route);

  constructor() {
    this.store.setContext(this.context);

    effect(() => {
      this.auth.firebaseUser();
      untracked(() => void this.store.loadProgress());
    });
  }

  protected linkFor(record: CourseProgress): string {
    return courseLink(record, this.context);
  }

  protected coverOf(record: CourseProgress): string {
    return COURSE_COVERS[record.cover] ?? COURSE_COVERS.teal;
  }

  protected dateOf(record: CourseProgress): string {
    return courseDate(this.store.exams()[record.id]?.passedAt ?? record.completedAt ?? record.updatedAt, this.i18n.language() === 'fr' ? 'fr-CA' : 'en-US');
  }

  protected scoreOf(record: CourseProgress): number | null {
    const exam = this.store.exams()[record.id];
    return exam?.passScore ?? exam?.bestScore ?? null;
  }
}

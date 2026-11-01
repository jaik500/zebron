import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

import { Course, COURSE_COVERS, COURSE_LEVEL_LABELS, CourseProgress, formatMinutes } from '../course.model';

/** A course in a grid: cover, provider, title, length, skills and progress. */
@Component({
  selector: 'app-course-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, TranslatePipe],
  template: `
    <a
      [routerLink]="link()"
      class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007979]/50"
    >
      <div class="relative h-24 shrink-0" [style.background]="cover()">
        <span
          class="absolute left-3 top-3 max-w-[85%] truncate rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-[#007979]"
        >
          {{ course().providerName || ('Organization' | t) }}
        </span>
        @if (completed()) {
          <span class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-emerald-700">
            <mat-icon class="!h-3.5 !w-3.5 !text-[14px]" aria-hidden="true">workspace_premium</mat-icon>{{ 'Completed' | t }}
          </span>
        }
      </div>

      <div class="flex flex-1 flex-col gap-1.5 p-4">
        @if (course().topic) {
          <span class="text-[11px] font-bold uppercase tracking-wide text-[#007979]">{{ course().topic }}</span>
        }
        <h3 class="text-base font-semibold leading-snug text-slate-900 group-hover:text-[#007979]">{{ course().title }}</h3>
        <p class="text-xs text-slate-500">
          {{ levelLabel() | t }} · {{ duration() }} · {{ course().lessonCount }} {{ (course().lessonCount === 1 ? 'lesson' : 'lessons') | t }}
        </p>

        @if (course().skills.length) {
          <div class="flex flex-wrap gap-1">
            @for (skill of course().skills.slice(0, 3); track skill) {
              <span class="rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] text-[#007979]">{{ skill }}</span>
            }
          </div>
        }

        @if (progress(); as record) {
          <div class="mt-auto pt-2">
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" [attr.aria-valuenow]="record.percent" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full rounded-full bg-gradient-to-r from-[#007979] to-[#2a835f]" [style.width.%]="record.percent"></div>
            </div>
            <p class="mt-1 text-xs text-slate-500">
              {{ completed() ? ('Completed · certificate ready' | t) : ('{percent}% complete' | t: { percent: record.percent }) }}
            </p>
          </div>
        }
      </div>
    </a>
  `,
})
export class CourseCardComponent {
  readonly course = input.required<Course>();
  readonly progress = input<CourseProgress | null>(null);
  readonly link = input.required<string>();

  protected readonly cover = computed(() => COURSE_COVERS[this.course().cover] ?? COURSE_COVERS.teal);
  protected readonly levelLabel = computed(() => COURSE_LEVEL_LABELS[this.course().level]);
  protected readonly duration = computed(() => formatMinutes(this.course().estimatedMinutes));
  protected readonly completed = computed(() => this.progress()?.status === 'completed');
}

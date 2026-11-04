import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { firestore } from '../../../core/services/firebase-config';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

export interface CourseCrumb {
  label: string;
  link?: string;
  /** Translate the label (course titles are not translated). */
  translate?: boolean;
}

export type CourseTab = 'learning' | 'catalog' | 'certifications' | 'certificates' | 'test-center' | 'live' | 'manage';

/**
 * Page header for the course pages: back button and breadcrumbs on the
 * left, search on the right (an icon toggles it on phones), and the
 * My learning / Catalog / Certificates tabs underneath.
 */
@Component({
  selector: 'app-course-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  template: `
    <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" [ngClass]="showTabs() ? 'pt-3' : 'py-2'">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          @if (backLink()) {
            <a
              [routerLink]="backLink()"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              [attr.aria-label]="'Back' | t"
              [title]="'Back' | t"
            >
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
            </a>
          }

<nav
  class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm"
  [attr.aria-label]="'Breadcrumb' | t"
>
  @for (crumb of crumbs(); track $index; let last = $last; let first = $first) {
    @if (crumb.link && !last) {
      <a
        [routerLink]="crumb.link"
        class="min-w-0 truncate text-white/80 hover:text-white hover:underline"
        [class.shrink-0]="first"
        [class.shrink]="!first"
      >
        {{ crumb.translate === false ? crumb.label : (crumb.label | t) }}
      </a>

      <mat-icon
        class="!h-4 !w-4 shrink-0 !text-base text-white/60"
        aria-hidden="true"
      >
        chevron_right
      </mat-icon>
    } @else {
      <span
        class="min-w-0 truncate font-semibold shrink-[9999]"
        [attr.aria-current]="last ? 'page' : null"
      >
        {{ crumb.translate === false ? crumb.label : (crumb.label | t) }}
      </span>
    }
  }
</nav>
         

          @if (showSearch()) {
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white sm:hidden"
              (click)="mobileSearchOpen.set(!mobileSearchOpen())"
              [attr.aria-expanded]="mobileSearchOpen()"
              aria-controls="course-search"
              [attr.aria-label]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
              [title]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
            >
              <mat-icon aria-hidden="true">{{ mobileSearchOpen() ? 'search_off' : 'search' }}</mat-icon>
            </button>

            <!-- The wrapper sets the width: zb-field makes the field itself 100% wide. -->
            <div
              class="order-last w-full sm:order-none sm:w-80 lg:w-96"
              [ngClass]="{ 'max-sm:hidden': !mobileSearchOpen() }"
            >
              <mat-form-field appearance="outline" class="zb-field zb-field--flush zb-search" subscriptSizing="dynamic">
                <mat-label>{{ 'Search courses' | t }}</mat-label>
                <mat-icon matPrefix aria-hidden="true">search</mat-icon>
                <input
                  matInput
                  id="course-search"
                  type="search"
                  autocomplete="off"
                  [value]="query()"
                  (input)="queryChange.emit($any($event.target).value)"
                  [placeholder]="'Courses and skills...' | t"
                />
              </mat-form-field>
            </div>
          }
        </div>

        @if (showTabs()) {
          <nav class="mt-2 flex gap-1 overflow-x-auto [scrollbar-width:none]" [attr.aria-label]="'Courses' | t">
            @for (tab of tabs(); track tab.key) {
              <a
                [routerLink]="tab.link"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition"
                [ngClass]="
                  tab.key === activeTab()
                    ? 'bg-slate-50 font-semibold text-[#007979]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                "
                [attr.aria-current]="tab.key === activeTab() ? 'page' : null"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ tab.icon }}</mat-icon>
                {{ tab.label | t }}
              </a>
            }
          </nav>
        }
      </div>
    </header>
  `,
})
export class CourseHeaderComponent {
  readonly basePath = input.required<string>();
  readonly crumbs = input<CourseCrumb[]>([]);
  readonly backLink = input<string | null>(null);
  readonly showSearch = input(false);
  readonly query = input('');
  readonly activeTab = input<CourseTab | null>(null);
  /** Show the Manage courses tab (course authors). */
  readonly canManage = input(false);

  readonly queryChange = output<string>();

  protected readonly mobileSearchOpen = signal(false);

  protected readonly showTabs = computed(() => this.activeTab() !== null);

  /** Organizations with the Virtual Classroom get a Live sessions tab. */
  private readonly liveAvailable = signal(false);

  private readonly checkLive = effect(() => {
    const organizationId = /^\/partner\/org\/([^/]+)\/courses$/.exec(this.basePath())?.[1] ?? null;
    untracked(() => {
      if (!organizationId) {
        this.liveAvailable.set(false);
        return;
      }
      getDoc(doc(firestore, 'organizations', decodeURIComponent(organizationId), 'applications', 'virtual-classroom'))
        .then((snapshot) => this.liveAvailable.set(snapshot.data()?.['status'] === 'active'))
        .catch(() => this.liveAvailable.set(false));
    });
  });

  protected readonly tabs = computed(() => {
    const tabs: { key: CourseTab; label: string; icon: string; link: string }[] = [
      { key: 'learning', label: 'My learning', icon: 'school', link: this.basePath() },
      { key: 'catalog', label: 'Catalog', icon: 'auto_stories', link: `${this.basePath()}/catalog` },
      { key: 'certifications', label: 'Certifications', icon: 'military_tech', link: `${this.basePath()}/certifications` },
      { key: 'certificates', label: 'Certificates', icon: 'workspace_premium', link: `${this.basePath()}/certificates` },
      // Zebron Learning = Courses + Test Center: practice quizzes sit beside the courses.
      { key: 'test-center', label: 'Test Center', icon: 'quiz', link: this.basePath().replace(/\/courses$/, '/learn/test-center').replace(/^\/learn\/test-center$/, '/test-center') },
    ];

    if (this.liveAvailable()) {
      tabs.push({ key: 'live', label: 'Live sessions', icon: 'video_camera_front', link: this.basePath().replace(/\/courses$/, '/live') });
    }

    if (this.canManage()) {
      tabs.push({ key: 'manage', label: 'Manage courses', icon: 'edit_note', link: `${this.basePath()}/manage` });
    }

    return tabs;
  });
}

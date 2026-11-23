import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { firestore } from '../../../core/services/firebase-config';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';

export interface CourseCrumb {
  label: string;
  link?: string;
  /** Translate the label (course titles are not translated). */
  translate?: boolean;
}

/** An extra item a page adds to the phone "More" menu, below the tabs. */
export interface CourseMenuAction {
  key: string;
  label: string;
  icon: string;
  /** Shows a tick (for a choice such as the current layout). */
  active?: boolean;
}

export type CourseTab = 'learning' | 'catalog' | 'careers' | 'certifications' | 'certificates' | 'test-center' | 'coding-lab' | 'documents' | 'live' | 'manage';

/**
 * Page header for the course pages: back button and breadcrumbs on the
 * left, search on the right (an icon toggles it on phones), and the
 * My learning / Catalog / Certificates tabs underneath.
 */
@Component({
  selector: 'app-course-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgTemplateOutlet, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, TranslatePipe],
  template: `
    <!-- The ::before strip carries the header colours upward, so the space above it (seen when
         the page is pulled down on a phone, under the fixed top bar) is the header's colour, not the page's. -->
    <header class="relative bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-[100vh] before:bg-gradient-to-r before:from-[#007979] before:via-[#00706f] before:to-[#2a835f] before:content-['']">
      <div class="mx-auto max-w-7xl px-4 sm:px-2 lg:px-8" [ngClass]="showTabs() ? 'pt-3' : 'py-2'">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          @if (backLink()) {
            <a
              [routerLink]="backLink()"
              class="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 md:inline-flex"
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
        class="!h-4 !w-4 shrink-0 !text-base !leading-none text-white/60"
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
              #searchToggle
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white sm:hidden"
              (click)="toggleMobileSearch(searchInput)"
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
                <mat-label>{{ searchLabel() | t }}</mat-label>
                <mat-icon matPrefix aria-hidden="true">search</mat-icon>
                <input
                  #searchInput
                  matInput
                  id="course-search"
                  type="search"
                  autocomplete="off"
                  [value]="query()"
                  (input)="queryChange.emit($any($event.target).value)"
                  (keydown.escape)="closeMobileSearch(searchToggle)"
                  [placeholder]="searchPlaceholder() | t"
                />
              </mat-form-field>
            </div>
          }
        </div>

        @if (showTabs()) {
          <nav class="mt-2 flex items-end gap-1" [attr.aria-label]="'Courses' | t">
            <div class="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
            @for (tab of tabs(); track tab.key) {
              <!-- On phones the secondary tabs move into the "More" menu (the open one stays visible). -->
              <a
                [routerLink]="tab.link"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition"
                [ngClass]="[
                  tab.key === activeTab()
                    ? 'bg-slate-50 font-semibold text-[#007979]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                  isSecondary(tab.key) && tab.key !== activeTab() ? 'max-md:hidden' : ''
                ]"
                [attr.aria-current]="tab.key === activeTab() ? 'page' : null"
              >
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ tab.icon }}</mat-icon>
                {{ tab.label | t }}
              </a>
            }
            </div>

            <!-- Phones: every tab, in a menu at the far right. -->
            <button
              type="button"
              class="mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 md:hidden"
              [matMenuTriggerFor]="tabMenu"
              [attr.aria-label]="'More' | t"
              [title]="'More' | t"
            >
              <mat-icon aria-hidden="true">more_vert</mat-icon>
            </button>
            <mat-menu #tabMenu="matMenu" xPosition="before">
              @for (tab of tabs(); track tab.key) {
                <a
                  mat-menu-item
                  [routerLink]="tab.link"
                  [attr.aria-current]="tab.key === activeTab() ? 'page' : null"
                  [ngClass]="tab.key === activeTab() ? '!bg-teal-50 !font-semibold !text-[#007979]' : ''"
                >
                  <mat-icon aria-hidden="true" [ngClass]="tab.key === activeTab() ? '!text-[#007979]' : ''">{{ tab.icon }}</mat-icon>
                  <span>{{ tab.label | t }}</span>
                </a>
              }
              @if (menuActions().length) {
                <div class="my-1 border-t border-slate-200" role="separator"></div>
                @if (menuActionsLabel()) {
                  <!-- A labelled group (such as View) opens its own drop-down. -->
                  <button mat-menu-item type="button" [matMenuTriggerFor]="actionsMenu">
                    <mat-icon aria-hidden="true">{{ menuActionsIcon() }}</mat-icon>
                    <span>{{ menuActionsLabel() | t }}</span>
                  </button>
                } @else {
                  <ng-container *ngTemplateOutlet="actionItems" />
                }
              }
            </mat-menu>
            <mat-menu #actionsMenu="matMenu">
              <ng-container *ngTemplateOutlet="actionItems" />
            </mat-menu>
            <ng-template #actionItems>
              @for (action of menuActions(); track action.key) {
                <button mat-menu-item type="button" (click)="menuAction.emit(action.key)" [attr.aria-pressed]="action.active ?? null">
                  <mat-icon aria-hidden="true" [ngClass]="action.active ? '!text-[#007979]' : ''">{{ action.icon }}</mat-icon>
                  <span [ngClass]="action.active ? 'font-semibold text-[#007979]' : ''">{{ action.label | t }}</span>
                  @if (action.active) {
                    <mat-icon class="!ml-2 !mr-0 !text-[#007979]" aria-hidden="true">check</mat-icon>
                  }
                </button>
              }
            </ng-template>
          </nav>
        }
      </div>
    </header>
  `,
})
export class CourseHeaderComponent {
  readonly basePath = input.required<string>();
  readonly crumbs = input<CourseCrumb[]>([]);
  /** Extra items for the phone "More" menu (for example a page's layout choice). */
  readonly menuActions = input<CourseMenuAction[]>([]);
  readonly menuAction = output<string>();
  /** When set, the extra items sit in a drop-down under this label (such as "View"). */
  readonly menuActionsLabel = input<string | null>(null);
  readonly menuActionsIcon = input('visibility');
  readonly backLink = input<string | null>(null);
  readonly showSearch = input(false);
  readonly query = input('');
  /** Search box label and hint; the course pages keep the defaults. */
  readonly searchLabel = input('Search courses');
  readonly searchPlaceholder = input('Courses and skills...');
  readonly activeTab = input<CourseTab | null>(null);
  /** Show the Manage courses tab (course authors). */
  readonly canManage = input(false);

  readonly queryChange = output<string>();

  protected readonly mobileSearchOpen = signal(false);
  private readonly changeDetector = inject(ChangeDetectorRef);

  /**
   * Phones: the search icon shows or hides the search box. Opening it puts the
   * cursor in the box so the learner can type straight away. The box is shown
   * and focused in the same tap (not after a delay), so phones also open the keyboard.
   */
  protected toggleMobileSearch(input: HTMLInputElement): void {
    const open = !this.mobileSearchOpen();
    this.mobileSearchOpen.set(open);
    if (!open) return;
    this.changeDetector.detectChanges();
    input.focus();
  }

  /** Escape in the search box on phones closes it and returns to the search icon. */
  protected closeMobileSearch(toggle: HTMLButtonElement): void {
    if (!this.mobileSearchOpen()) return;
    this.mobileSearchOpen.set(false);
    toggle.focus();
  }

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

  /** Tabs that move into the "More" menu on phones. */
  private readonly secondaryTabs = new Set<CourseTab>(['certificates', 'test-center', 'coding-lab', 'documents', 'live', 'manage']);

  protected isSecondary(key: CourseTab): boolean {
    return this.secondaryTabs.has(key);
  }

  protected readonly tabs = computed(() => {
    const tabs: { key: CourseTab; label: string; icon: string; link: string }[] = [
      { key: 'learning', label: 'My learning', icon: 'school', link: this.basePath() },
      { key: 'catalog', label: 'Catalog', icon: 'auto_stories', link: `${this.basePath()}/catalog` },
      { key: 'certifications', label: 'Certifications', icon: 'military_tech', link: `${this.basePath()}/certifications` },
      // Zebron Learning = Courses + Test Center: practice quizzes sit beside the courses.
      { key: 'test-center', label: 'Test Center', icon: 'quiz', link: this.basePath().replace(/\/courses$/, '/learn/test-center').replace(/^\/learn\/test-center$/, '/test-center') },
      { key: 'coding-lab', label: 'Coding Lab', icon: 'terminal', link: `${this.basePath()}/coding-lab` },
    ];

    // My documents (the reader) belongs to the person, not an organization: Zebron's pages only.
    if (this.basePath() === '/courses') {
      tabs.push({ key: 'documents', label: 'My documents', icon: 'library_books', link: '/courses/documents' });
    }

    if (this.liveAvailable()) {
      tabs.push({ key: 'live', label: 'Live sessions', icon: 'video_camera_front', link: this.basePath().replace(/\/courses$/, '/live') });
    }

    // Certificates moved into My learning (a card under the weekly stats).

    if (this.canManage()) {
      tabs.push({ key: 'manage', label: 'Manage courses', icon: 'edit_note', link: `${this.basePath()}/manage` });
    }

    return tabs;
  });
}

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { BlogTab } from '../blog-access.service';

/**
 * Blog page header: title, search, Write button and the section tabs
 * (Public, Organization, Internal, Review & manage) this person can see.
 */
@Component({
  selector: 'app-blog-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatFormFieldModule, MatIconModule, MatInputModule, TranslatePipe],
  template: `
    <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
      <div class="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-lg font-semibold">{{ title() | t }}</h1>
            <p class="truncate text-xs text-white/80">{{ subtitle() | t }}</p>
          </div>

          @if (showSearch()) {
            <!-- The wrapper sets the width: zb-field makes the field itself 100% wide. -->
            <div
              class="order-last w-full sm:order-none sm:w-80 lg:w-96"
              [ngClass]="{ 'max-sm:hidden': !mobileSearchOpen() }"
            >
            <mat-form-field
              appearance="outline"
              class="zb-field zb-field--flush zb-search"
              subscriptSizing="dynamic"
            >
              <mat-label>{{ 'Search posts' | t }}</mat-label>
              <mat-icon matPrefix aria-hidden="true">search</mat-icon>
              <input
                matInput
                type="search"
                autocomplete="off"
                [value]="query()"
                (input)="queryChange.emit($any($event.target).value)"
                id="blog-search"
                [placeholder]="'Search posts...' | t"
              />
            </mat-form-field>
            </div>
          }

          @if (showSearch()) {
            <!-- Phones: show or hide the search bar -->
            <button
              type="button"
              (click)="mobileSearchOpen.set(!mobileSearchOpen())"
              aria-controls="blog-search"
              [attr.aria-expanded]="mobileSearchOpen()"
              class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 sm:hidden"
              [ngClass]="{ 'bg-white/15': mobileSearchOpen() }"
              [attr.aria-label]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
              [title]="(mobileSearchOpen() ? 'Hide search' : 'Search') | t"
            >
              <mat-icon aria-hidden="true">{{ mobileSearchOpen() ? 'search_off' : 'search' }}</mat-icon>
            </button>
          }

          @if (writeLink(); as link) {
            <a
              [routerLink]="link"
              class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-bold text-[#007979] shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">edit_square</mat-icon>
              {{ 'Write' | t }}
            </a>
          }
        </div>

        <nav class="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]" [attr.aria-label]="'Blog sections' | t">
          @for (tab of tabs(); track tab.key) {
            <a
              [routerLink]="tab.link"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50"
              [ngClass]="
                tab.key === active()
                  ? 'bg-slate-50 font-bold text-[#007979]'
                  : 'font-medium text-white/85 hover:bg-white/10 hover:text-white'
              "
              [attr.aria-current]="tab.key === active() ? 'page' : null"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ tab.icon }}</mat-icon>
              {{ tab.translate ? (tab.label | t) : tab.label }}
              @if (tab.key === 'manage' && pendingCount() > 0) {
                <span class="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950">{{ pendingCount() }}</span>
              }
            </a>
          }
        </nav>
      </div>
    </header>
  `,
})
export class BlogHeaderComponent {
  readonly title = input('Blog');
  readonly subtitle = input('');
  readonly tabs = input<BlogTab[]>([]);
  readonly active = input<string>('public');
  readonly showSearch = input(true);
  readonly query = input('');
  readonly writeLink = input<string | null>(null);
  readonly pendingCount = input(0);

  readonly queryChange = output<string>();

  /** Phones only: the search bar is hidden until the search icon is tapped. */
  protected readonly mobileSearchOpen = signal(false);
}

import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { BlogAccessService, blogContextFromRoute } from '../blog-access.service';
import { BLOG_SECTION_META } from '../blog.model';
import { BlogStore } from '../blog.store';
import { BlogCardComponent } from '../components/blog-card.component';
import { BlogHeaderComponent } from '../components/blog-header.component';

/** The blog feed for one section: Public, an organization, or Internal. */
@Component({
  selector: 'app-blog-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, MatIconModule, TranslatePipe, BlogCardComponent, BlogHeaderComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-blog-header
        title="Blog"
        [subtitle]="meta().hint"
        [tabs]="tabs()"
        [active]="context.section"
        [query]="store.query()"
        (queryChange)="store.setQuery($event)"
        [writeLink]="canWrite() ? context.basePath + '/write' : null"
        [pendingCount]="store.pendingReviewCount()"
      />

      <div class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <!-- Topics -->
        @if (store.topics().length > 1) {
          <div class="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" role="group" [attr.aria-label]="'Topics' | t">
            @for (topic of store.topics(); track topic) {
              <button
                type="button"
                (click)="store.setTopic(topic)"
                class="shrink-0 rounded-full border px-3 py-1 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#007979]/30"
                [ngClass]="
                  store.topic() === topic
                    ? 'border-[#032D42] bg-[#032D42] text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#007979]'
                "
                [attr.aria-pressed]="store.topic() === topic"
              >
                {{ topic | t }}
              </button>
            }
          </div>
        }

        @if (store.loading()) {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" [attr.aria-label]="'Loading posts' | t">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"></div>
            }
          </div>
        } @else if (store.error()) {
          <div class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
            {{ store.error()! | t }}
            <button type="button" (click)="store.loadFeed()" class="ml-2 font-semibold underline">{{ 'Try again' | t }}</button>
          </div>
        } @else {
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div class="min-w-0">
              @if (store.featuredPost(); as featured) {
                <div class="mb-5">
                  <app-blog-card [post]="featured" [basePath]="context.basePath" [featured]="true" />
                </div>
              }

              @if (store.otherPosts().length) {
                <div class="grid gap-4 sm:grid-cols-2">
                  @for (post of store.otherPosts(); track post.id) {
                    <app-blog-card [post]="post" [basePath]="context.basePath" />
                  }
                </div>
              } @else if (!store.featuredPost()) {
                <div class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <mat-icon class="!h-10 !w-10 !text-[40px] text-slate-300" aria-hidden="true">article</mat-icon>
                  @if (store.query() || store.topic() !== 'All') {
                    <p class="mt-2 font-semibold text-slate-800">{{ 'No posts match your search.' | t }}</p>
                    <button type="button" (click)="clearFilters()" class="mt-3 text-sm font-semibold text-[#007979] underline">
                      {{ 'Clear search and filters' | t }}
                    </button>
                  } @else {
                    <p class="mt-2 font-semibold text-slate-800">{{ 'No posts yet' | t }}</p>
                    @if (canWrite()) {
                      <a [routerLink]="context.basePath + '/write'" class="mt-3 inline-flex rounded-lg bg-[#007979] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006666]">
                        {{ 'Write the first post' | t }}
                      </a>
                    }
                  }
                </div>
              }
            </div>

            <!-- Side panel -->
            <aside class="space-y-4">
              <section class="rounded-xl border border-slate-200 bg-white p-4">
                <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'Who can read this' | t }}</h2>
                <p class="flex gap-2 text-sm text-slate-700">
                  <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">{{ meta().icon }}</mat-icon>
                  {{ meta().hint | t }}
                </p>
                @if (context.section === 'organization') {
                  <p class="mt-2 flex gap-2 text-sm text-slate-700">
                    <mat-icon class="shrink-0 !h-5 !w-5 !text-[20px] text-[#007979]" aria-hidden="true">edit</mat-icon>
                    {{ 'Staff and above write posts; managers approve and publish them.' | t }}
                  </p>
                }
              </section>

              @if (store.mostRead().length) {
                <section class="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'Latest posts' | t }}</h2>
                  <ol class="list-decimal space-y-2 pl-5 text-sm">
                    @for (post of store.mostRead(); track post.id) {
                      <li><a [routerLink]="[context.basePath, post.id]" class="text-[#032D42] hover:text-[#007979] hover:underline">{{ post.title }}</a></li>
                    }
                  </ol>
                </section>
              }
            </aside>
          </div>
        }
      </div>
    </main>
  `,
})
export class BlogFeedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly access = inject(BlogAccessService);
  protected readonly store = inject(BlogStore);

  protected readonly context = blogContextFromRoute(this.route);

  protected readonly meta = computed(() => BLOG_SECTION_META[this.context.section]);
  protected readonly tabs = computed(() => this.access.tabs(this.context));
  protected readonly canWrite = computed(() => this.access.canWrite(this.context));

  ngOnInit(): void {
    this.store.setContext(this.context);
    this.store.setQuery('');
    this.store.setTopic('All');
    void this.store.loadFeed();

    if (this.access.canPublish(this.context)) {
      void this.store.loadManaged();
    }
  }

  protected clearFilters(): void {
    this.store.setQuery('');
    this.store.setTopic('All');
  }
}

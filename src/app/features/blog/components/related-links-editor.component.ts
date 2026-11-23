import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { collection, getDocs, query, where } from 'firebase/firestore';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { firestore } from '../../../core/services/firebase-config';
import { CertificationService } from '../../courses/certification.service';
import { CourseService } from '../../courses/course.service';
import { resourceKind } from '../../resources/resource-kinds';
import {
  RELATED_KINDS,
  RELATED_MAX,
  RelatedCandidate,
  RelatedLink,
  isZebronPath,
  sanitizeRelated,
  suggestJobQuery,
  suggestRelated,
  words,
} from '../related-links';

/**
 * Blog editor → "Continue on Zebron": choose up to RELATED_MAX links to
 * Zebron courses, certifications, bootcamps, resources, a job search or
 * any Zebron page, shown at the end of the post. Suggests matches from
 * the post's words. Only Zebron's own (platform) content is offered.
 */
@Component({
  selector: 'app-related-links-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, TranslatePipe],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="related-editor-title">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 id="related-editor-title" class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'Continue on Zebron' | t }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ 'Links shown at the end of the post: courses, bootcamps, resources and jobs that help readers act on it.' | t }}</p>
        </div>
        <span class="shrink-0 text-xs font-semibold text-slate-400">{{ links().length }}/{{ max }}</span>
      </div>

      <!-- Chosen -->
      @if (links().length) {
        <ul class="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
          @for (link of links(); track link.path + (link.query ?? ''); let i = $index; let last = $last) {
            <li class="flex min-w-0 items-center gap-2 px-3 py-2">
              <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-[#007979]" aria-hidden="true">{{ kinds[link.kind].icon }}</mat-icon>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-slate-800">{{ link.title }}</span>
                <span class="block truncate text-xs text-slate-500">{{ kinds[link.kind].label | t }}{{ link.note ? ' · ' + link.note : '' }}</span>
              </span>
              <button type="button" (click)="move(i, -1)" [disabled]="i === 0" class="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" [attr.aria-label]="'Move up' | t">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_upward</mat-icon>
              </button>
              <button type="button" (click)="move(i, 1)" [disabled]="last" class="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" [attr.aria-label]="'Move down' | t">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">arrow_downward</mat-icon>
              </button>
              <button type="button" (click)="remove(i)" class="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600" [attr.aria-label]="'Remove' | t">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">close</mat-icon>
              </button>
            </li>
          }
        </ul>
      }

      @if (loading()) {
        <p class="mt-3 text-sm text-slate-500">{{ 'Loading Zebron content…' | t }}</p>
      } @else if (loadError()) {
        <p class="mt-3 text-sm text-amber-700">{{ 'Courses and resources could not be loaded. You can still add a job search or a Zebron page.' | t }}</p>
      }

      @if (!full()) {
        <!-- Suggestions -->
        @if (suggestions().length) {
          <p class="mt-4 text-xs font-semibold text-slate-600">{{ 'Suggested for this post' | t }}</p>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            @for (item of suggestions(); track item.path) {
              <button type="button" (click)="add(item)" class="inline-flex max-w-full items-center gap-1 rounded-full border border-[#007979]/30 bg-[#e5f4f4] px-2.5 py-1 text-xs font-semibold text-[#035e5e] hover:border-[#007979]">
                <mat-icon class="!h-4 !w-4 shrink-0 !text-base" aria-hidden="true">add</mat-icon>
                <span class="truncate">{{ item.title }}</span>
                <span class="shrink-0 font-normal text-[#035e5e]/70">· {{ kinds[item.kind].label | t }}</span>
              </button>
            }
          </div>
        }

        <!-- Search -->
        <label class="mt-4 block">
          <span class="text-xs font-semibold text-slate-600">{{ 'Find a course, certification, bootcamp or resource' | t }}</span>
          <input type="search" name="relatedSearch" [ngModel]="search()" (ngModelChange)="search.set($event)" autocomplete="off"
            [placeholder]="'Search by name or skill' | t"
            class="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#007979]" />
        </label>
        @if (search().trim().length >= 2) {
          @if (results().length) {
            <ul class="mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              @for (item of results(); track item.path) {
                <li>
                  <button type="button" (click)="add(item); search.set('')" class="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
                    <mat-icon class="!h-5 !w-5 shrink-0 !text-[20px] text-slate-400" aria-hidden="true">{{ kinds[item.kind].icon }}</mat-icon>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm text-slate-800">{{ item.title }}</span>
                      <span class="block truncate text-xs text-slate-500">{{ kinds[item.kind].label | t }}{{ item.note ? ' · ' + item.note : '' }}</span>
                    </span>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-1 text-xs text-slate-500">{{ 'Nothing matches.' | t }}</p>
          }
        }

        <!-- Job search -->
        <div class="mt-4">
          <span class="text-xs font-semibold text-slate-600">{{ 'Job search' | t }}</span>
          <div class="mt-1 flex gap-2">
            <input type="text" name="relatedJobs" [(ngModel)]="jobWords" maxlength="80" [placeholder]="jobPlaceholder()"
              class="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#007979]" />
            <button type="button" (click)="addJobs()" class="h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#007979] hover:border-[#007979]">{{ 'Add' | t }}</button>
          </div>
          <p class="mt-1 text-xs text-slate-500">{{ 'Opens the job board searching for these words, so it never shows an expired job.' | t }}</p>
        </div>

        <!-- Any Zebron page -->
        <details class="mt-4">
          <summary class="cursor-pointer text-xs font-semibold text-slate-600">{{ 'Another Zebron page' | t }}</summary>
          <div class="mt-2 grid gap-2">
            <input type="text" name="relatedPageTitle" [(ngModel)]="pageTitle" maxlength="120" [placeholder]="'Link text, e.g. Practice tests' | t"
              class="h-10 min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#007979]" />
            <input type="text" name="relatedPagePath" [(ngModel)]="pagePath" maxlength="200" placeholder="/test-center"
              class="h-10 min-w-0 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#007979]" />
            <button type="button" (click)="addPage()" class="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#007979] hover:border-[#007979]">{{ 'Add' | t }}</button>
          </div>
          @if (pageError()) {
            <p class="mt-1 text-xs text-red-600" role="alert">{{ pageError() | t }}</p>
          }
        </details>
      } @else {
        <p class="mt-3 text-xs text-slate-500">{{ 'That is the most a post can show. Remove one to add another.' | t }}</p>
      }
    </section>
  `,
})
export class RelatedLinksEditorComponent {
  private readonly courses = inject(CourseService);
  private readonly certifications = inject(CertificationService);

  /** The chosen links (two-way). */
  readonly links = model<RelatedLink[]>([]);

  /** The post, for suggestions. */
  readonly postTitle = input('');
  readonly postExcerpt = input('');
  readonly postTopic = input('');
  readonly postContent = input('');

  protected readonly kinds = RELATED_KINDS;
  protected readonly max = RELATED_MAX;

  protected readonly candidates = signal<RelatedCandidate[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly search = signal('');
  protected readonly pageError = signal('');

  protected jobWords = '';
  protected pageTitle = '';
  protected pagePath = '';

  protected readonly full = computed(() => this.links().length >= RELATED_MAX);

  protected readonly suggestions = computed(() =>
    suggestRelated(
      { title: this.postTitle(), excerpt: this.postExcerpt(), topic: this.postTopic(), content: this.postContent() },
      this.candidates(),
      this.links(),
    ),
  );

  protected readonly results = computed(() => {
    const terms = words(this.search());
    if (!terms.length) {
      return [];
    }
    const taken = new Set(this.links().map((link) => link.path));
    return this.candidates()
      .filter((item) => !taken.has(item.path))
      .filter((item) => {
        const haystack = ` ${words(`${item.title} ${item.note} ${item.keywords.join(' ')}`).join(' ')} `;
        return terms.every((term) => haystack.includes(` ${term}`));
      })
      .slice(0, 12);
  });

  protected readonly jobPlaceholder = computed(() => suggestJobQuery(this.postTitle()) || 'python developer');

  constructor() {
    afterNextRender(() => void this.load());
  }

  protected add(item: RelatedLink): void {
    const { kind, title, path, query, note } = item;
    this.links.set(sanitizeRelated([...this.links(), { kind, title, path, query, note }]));
  }

  protected addJobs(): void {
    const text = (this.jobWords.trim() || suggestJobQuery(this.postTitle())).slice(0, 80);
    if (!text) {
      return;
    }
    this.add({ kind: 'jobs', title: `${text.charAt(0).toUpperCase()}${text.slice(1)} jobs`, path: '/jobs', query: text, note: 'Open jobs on the Zebron job board' });
    this.jobWords = '';
  }

  protected addPage(): void {
    const path = this.pagePath.trim();
    const title = this.pageTitle.trim();
    if (!title || !isZebronPath(path)) {
      this.pageError.set('Enter link text and a Zebron path that starts with /, such as /test-center.');
      return;
    }
    this.pageError.set('');
    this.add({ kind: 'page', title, path, query: null, note: '' });
    this.pageTitle = '';
    this.pagePath = '';
  }

  protected remove(index: number): void {
    this.links.set(this.links().filter((_, position) => position !== index));
  }

  protected move(index: number, step: -1 | 1): void {
    const next = [...this.links()];
    const target = index + step;
    if (target < 0 || target >= next.length) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    this.links.set(next);
  }

  /** Zebron's published courses, certifications and resources. */
  private async load(): Promise<void> {
    const found: RelatedCandidate[] = [];
    const settled = await Promise.allSettled([
      this.courses.listPublished(null).then((courses) => {
        for (const course of courses) {
          found.push({
            kind: 'course',
            title: course.title,
            path: `/courses/${course.id}`,
            query: null,
            note: [course.topic, course.level].filter(Boolean).join(' · '),
            keywords: [course.topic, ...(course.skills ?? [])].filter(Boolean),
          });
        }
      }),
      this.certifications.listDefinitions(null).then((definitions) => {
        for (const definition of definitions) {
          found.push({
            kind: 'certification',
            title: definition.title,
            path: `/courses/certifications/${definition.key}`,
            query: null,
            note: definition.credentialName || definition.providerName || '',
            keywords: [definition.credentialName, ...(definition.preparesFor ?? [])].filter(Boolean),
          });
        }
      }),
      Promise.all([
        getDocs(query(collection(firestore, 'resources'), where('status', '==', 'published'))),
        getDocs(collection(firestore, 'categories')),
      ]).then(([resources, categories]) => {
        const categoryById = new Map(categories.docs.map((document) => [document.id, document.data() as { name?: string; slug?: string }]));
        for (const document of resources.docs) {
          const data = document.data() as { name?: string; slug?: string; categoryId?: string; tags?: string[]; cost?: { free?: boolean } };
          if (!data.slug || !data.name) continue;
          const category = categoryById.get(data.categoryId ?? '');
          const bootcamp = resourceKind(category).kind === 'bootcamp';
          found.push({
            kind: bootcamp ? 'bootcamp' : 'resource',
            title: data.name,
            path: `/resources/${data.slug}`,
            query: null,
            note: [category?.name, data.cost?.free ? 'Free' : ''].filter(Boolean).join(' · '),
            keywords: [category?.name ?? '', ...(data.tags ?? [])].filter(Boolean),
          });
        }
      }),
    ]);

    this.candidates.set(found.filter((item) => isZebronPath(item.path)));
    this.loadError.set(settled.every((result) => result.status === 'rejected'));
    this.loading.set(false);
  }
}

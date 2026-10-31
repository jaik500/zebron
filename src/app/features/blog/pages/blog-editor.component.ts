import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HotToastService } from '@ngxpert/hot-toast';

import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { renderKnowledgeContent } from '../../partner/knowledge/knowledge-content.util';

import { BlogAccessService, blogContextFromRoute } from '../blog-access.service';
import {
  BLOG_COVERS,
  BLOG_SECTION_META,
  BLOG_TOPICS,
  BlogCover,
  BlogPost,
  BlogPostDraft,
} from '../blog.model';
import { BlogSaveAction, BlogStore } from '../blog.store';

interface FormatTool {
  icon: string;
  label: string;
  before: string;
  after: string;
  placeholder: string;
  /** Start the insertion on a new line. */
  block?: boolean;
}

/** Write or edit a post in the current section. */
@Component({
  selector: 'app-blog-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    FormsModule,
    RouterLink,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <header class="bg-gradient-to-r from-[#007979] via-[#00706f] to-[#2a835f] text-white">
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <a
            [routerLink]="context.basePath"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            [attr.aria-label]="'Back to the blog' | t"
            [title]="'Back to the blog' | t"
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-semibold sm:text-lg">{{ (postId ? 'Edit post' : 'New post') | t }}</h1>
            <p class="truncate text-xs text-white/80">
              <mat-icon class="!h-3.5 !w-3.5 !text-[14px] align-[-2px]" aria-hidden="true">{{ sectionMeta.icon }}</mat-icon>
              {{ sectionMeta.hint | t }}
            </p>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        @if (loading()) {
          <div class="h-96 animate-pulse rounded-xl bg-white"></div>
        } @else {
          @if (existing()?.status === 'changes_requested') {
            <div class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <b>{{ 'Changes requested' | t }}.</b>
              {{ existing()?.reviewNote || ('Update the post and submit it again.' | t) }}
            </div>
          }

          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <!-- Writing -->
            <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <label for="blog-title" class="sr-only">{{ 'Title' | t }}</label>
              <input
                id="blog-title"
                name="title"
                [(ngModel)]="title"
                maxlength="160"
                [placeholder]="'Post title' | t"
                class="w-full border-0 bg-transparent text-2xl font-bold text-[#032D42] outline-none placeholder:text-slate-300 sm:text-3xl"
              />

              <label for="blog-excerpt" class="sr-only">{{ 'Summary' | t }}</label>
              <textarea
                id="blog-excerpt"
                name="excerpt"
                [(ngModel)]="excerpt"
                rows="2"
                maxlength="300"
                [placeholder]="'One or two sentences shown on the post card' | t"
                class="mt-2 w-full resize-none border-0 bg-transparent text-base text-slate-600 outline-none placeholder:text-slate-300"
              ></textarea>

              <!-- Cover -->
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'Cover' | t }}</span>
                @for (option of covers; track option.key) {
                  <button
                    type="button"
                    (click)="cover.set(option.key)"
                    class="h-8 w-12 rounded-md ring-offset-2 transition focus:outline-none focus:ring-2 focus:ring-[#007979]"
                    [ngClass]="cover() === option.key ? 'ring-2 ring-[#032D42]' : ''"
                    [style.background]="option.value"
                    [attr.aria-pressed]="cover() === option.key"
                    [attr.aria-label]="'Cover {0}' | t: [$index + 1]"
                  ></button>
                }
              </div>

              <!-- Toolbar -->
              <div class="mt-4 flex flex-wrap items-center gap-0.5 border-y border-slate-100 py-1.5" role="toolbar" [attr.aria-label]="'Formatting' | t">
                @for (tool of tools; track tool.icon) {
                  <button
                    type="button"
                    (click)="format(tool)"
                    [disabled]="preview()"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                    [attr.aria-label]="tool.label | t"
                    [title]="tool.label | t"
                  >
                    <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">{{ tool.icon }}</mat-icon>
                  </button>
                }
                <span class="flex-1"></span>
                <button
                  type="button"
                  (click)="preview.set(!preview())"
                  class="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold text-[#007979] hover:bg-[#e5f4f4]"
                  [attr.aria-pressed]="preview()"
                >
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">{{ preview() ? 'edit' : 'visibility' }}</mat-icon>
                  {{ (preview() ? 'Write' : 'Preview') | t }}
                </button>
              </div>

              @if (preview()) {
                <div class="blog-preview min-h-[320px] py-3 text-[16px] leading-7 text-slate-800" [innerHTML]="previewHtml()"></div>
              } @else {
                <label for="blog-content" class="sr-only">{{ 'Post' | t }}</label>
                <textarea
                  #editor
                  id="blog-content"
                  name="content"
                  [(ngModel)]="content"
                  rows="16"
                  [placeholder]="'Write your post. Start a line with # for a section heading.' | t"
                  class="mt-3 min-h-[320px] w-full resize-y border-0 bg-transparent font-[inherit] text-[16px] leading-7 text-slate-800 outline-none placeholder:text-slate-300"
                ></textarea>
              }
            </section>

            <!-- Publishing -->
            <aside class="space-y-4">
              <section class="rounded-xl border border-slate-200 bg-white p-4">
                <h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{{ 'Publishing' | t }}</h2>

                <ol class="mb-4 flex gap-1 text-[11px] font-semibold" [attr.aria-label]="'Status' | t">
                  @for (step of steps(); track step.label) {
                    <li class="flex-1 rounded-md px-1 py-1.5 text-center" [ngClass]="step.done ? 'bg-[#007979] text-white' : 'bg-slate-100 text-slate-500'">
                      {{ step.label | t }}
                    </li>
                  }
                </ol>

                <mat-form-field appearance="outline" class="zb-field zb-field--dense" subscriptSizing="dynamic">
                  <mat-label>{{ 'Topic' | t }}</mat-label>
                  <mat-select [(ngModel)]="topic" name="topic">
                    @for (option of topics; track option) {
                      <mat-option [value]="option">{{ option | t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                @if (canPublish()) {
                  <div class="mb-3 space-y-2" role="radiogroup" [attr.aria-label]="'When to publish' | t">
                    <label class="flex items-center gap-2 text-sm">
                      <input type="radio" name="when" value="now" [(ngModel)]="when" class="accent-[#007979]" />
                      {{ 'Publish now' | t }}
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                      <input type="radio" name="when" value="later" [(ngModel)]="when" class="accent-[#007979]" />
                      {{ 'Schedule' | t }}
                    </label>
                    @if (when === 'later') {
                      <label for="blog-publish-at" class="sr-only">{{ 'Publish on' | t }}</label>
                      <input
                        id="blog-publish-at"
                        type="datetime-local"
                        name="publishAt"
                        [(ngModel)]="publishAt"
                        [min]="minPublishAt"
                        class="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-[#007979]"
                      />
                    }
                  </div>

                  <mat-checkbox [(ngModel)]="pinned" name="pinned" class="-ml-2 mb-2">
                    <span class="text-sm">{{ 'Pin to the top of the blog' | t }}</span>
                  </mat-checkbox>
                }

                @if (store.error()) {
                  <p class="mb-2 text-sm text-red-600" role="alert">{{ store.error()! | t }}</p>
                }

                <div class="grid gap-2">
                  <button
                    type="button"
                    (click)="save(primaryAction())"
                    [disabled]="!canSave() || store.saving()"
                    class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-bold text-white transition hover:bg-[#006666] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {{ (store.saving() ? 'Saving...' : primaryLabel()) | t }}
                  </button>
                  <button
                    type="button"
                    (click)="save('draft')"
                    [disabled]="!title.trim() || store.saving()"
                    class="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#007979] hover:text-[#007979] disabled:opacity-50"
                  >
                    {{ 'Save draft' | t }}
                  </button>
                </div>

                @if (!canPublish()) {
                  <p class="mt-3 text-xs text-slate-500">{{ 'A manager reviews your post before it is published.' | t }}</p>
                }
              </section>

              <section class="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500">
                <h2 class="mb-2 font-semibold uppercase tracking-wider">{{ 'Formatting' | t }}</h2>
                <p># {{ 'Section heading' | t }} · **{{ 'bold' | t }}** · *{{ 'italic' | t }}* · - {{ 'list' | t }} · > {{ 'quote' | t }} · [text](https://…)</p>
                <p class="mt-1">{{ 'Table' | t }}: | A | B | {{ 'then' | t }} | --- | --- | {{ 'then one row per line' | t }}</p>
              </section>
            </aside>
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host ::ng-deep .blog-preview h2 { font-size: 1.3rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #032d42; }
      :host ::ng-deep .blog-preview h3 { font-size: 1.1rem; font-weight: 700; margin: 1.2rem 0 0.4rem; }
      :host ::ng-deep .blog-preview p { margin: 0 0 0.9rem; }
      :host ::ng-deep .blog-preview ul { list-style: disc; margin: 0 0 1rem 1.4rem; }
      :host ::ng-deep .blog-preview ol { list-style: decimal; margin: 0 0 1rem 1.4rem; }
      :host ::ng-deep .blog-preview a { color: #007979; text-decoration: underline; }
      :host ::ng-deep .blog-preview blockquote { border-left: 4px solid #007979; background: #f0fdfa; padding: 0.5rem 1rem; margin: 1rem 0; }
      :host ::ng-deep .blog-preview code { background: #f1f5f9; border-radius: 4px; padding: 0.1rem 0.3rem; }
      :host ::ng-deep .blog-preview pre { background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 1rem; overflow-x: auto; }
    `,
  ],
})
export class BlogEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly access = inject(BlogAccessService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(HotToastService);
  protected readonly store = inject(BlogStore);

  protected readonly context = blogContextFromRoute(this.route);
  protected readonly sectionMeta = BLOG_SECTION_META[this.context.section];
  protected readonly topics = BLOG_TOPICS[this.context.section];
  protected readonly covers = (Object.keys(BLOG_COVERS) as BlogCover[]).map((key) => ({ key, value: BLOG_COVERS[key] }));
  protected readonly postId = this.route.snapshot.paramMap.get('postId');

  private readonly editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');

  protected readonly loading = signal(false);
  protected readonly existing = signal<BlogPost | null>(null);
  protected readonly preview = signal(false);
  protected readonly cover = signal<BlogCover>('teal');

  protected title = '';
  protected excerpt = '';
  protected content = '';
  protected topic = this.topics[0];
  protected pinned = false;
  protected when: 'now' | 'later' = 'now';
  protected publishAt = '';
  protected readonly minPublishAt = this.localDateTime(new Date(Date.now() + 5 * 60_000));

  protected readonly tools: FormatTool[] = [
    { icon: 'title', label: 'Section heading', before: '# ', after: '', placeholder: 'Heading', block: true },
    { icon: 'format_bold', label: 'Bold', before: '**', after: '**', placeholder: 'bold text' },
    { icon: 'format_italic', label: 'Italic', before: '*', after: '*', placeholder: 'italic text' },
    { icon: 'format_list_bulleted', label: 'Bulleted list', before: '- ', after: '', placeholder: 'List item', block: true },
    { icon: 'format_list_numbered', label: 'Numbered list', before: '1. ', after: '', placeholder: 'First step', block: true },
    { icon: 'format_quote', label: 'Quote', before: '> ', after: '', placeholder: 'Quote', block: true },
    { icon: 'link', label: 'Link', before: '[', after: '](https://)', placeholder: 'link text' },
    { icon: 'code', label: 'Code', before: '`', after: '`', placeholder: 'code' },
  ];

  protected readonly canPublish = computed(() => this.access.canPublish(this.context));

  protected readonly previewHtml = computed(() => {
    this.preview();
    return renderKnowledgeContent(this.content);
  });

  protected readonly steps = computed(() => {
    const status = this.existing()?.status ?? 'draft';
    const reached = status === 'published' ? 3 : status === 'in_review' || status === 'scheduled' ? 2 : 1;

    return [
      { label: 'Draft', done: reached >= 1 },
      { label: status === 'scheduled' ? 'Scheduled' : 'In review', done: reached >= 2 },
      { label: 'Published', done: reached >= 3 },
    ];
  });

  async ngOnInit(): Promise<void> {
    this.store.setContext(this.context);

    if (!this.postId) {
      return;
    }

    this.loading.set(true);
    const post = await this.store.loadForEdit(this.postId);
    this.loading.set(false);

    if (!post) {
      this.toast.error(this.i18n.t('This post was not found or you cannot edit it.'));
      await this.router.navigateByUrl(this.context.basePath);
      return;
    }

    this.existing.set(post);
    this.title = post.title;
    this.excerpt = post.excerpt;
    this.content = post.content;
    this.topic = post.topic || this.topics[0];
    this.pinned = post.pinned;
    this.cover.set(post.cover);

    if (post.publishAt && post.publishAt.toMillis() > Date.now()) {
      this.when = 'later';
      this.publishAt = this.localDateTime(post.publishAt.toDate());
    }
  }

  protected canSave(): boolean {
    return this.title.trim().length > 0 && this.content.trim().length > 0;
  }

  protected primaryAction(): BlogSaveAction {
    if (!this.canPublish()) {
      return 'submit';
    }

    return this.when === 'later' ? 'schedule' : 'publish';
  }

  protected primaryLabel(): string {
    switch (this.primaryAction()) {
      case 'schedule':
        return 'Schedule';
      case 'publish':
        return this.existing()?.status === 'published' ? 'Update post' : 'Publish';
      default:
        return 'Submit for review';
    }
  }

  protected async save(action: BlogSaveAction): Promise<void> {
    let scheduledFor: Date | null = null;

    if (action === 'schedule') {
      scheduledFor = this.publishAt ? new Date(this.publishAt) : null;

      if (!scheduledFor || Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
        this.toast.error(this.i18n.t('Choose a future date and time to schedule the post.'));
        return;
      }
    }

    const draft: BlogPostDraft = {
      title: this.title,
      excerpt: this.excerpt,
      content: this.content,
      topic: this.topic,
      cover: this.cover(),
      pinned: this.canPublish() ? this.pinned : (this.existing()?.pinned ?? false),
    };

    const id = await this.store.savePost(this.postId, draft, action, scheduledFor);

    if (!id) {
      return;
    }

    const messages: Record<BlogSaveAction, string> = {
      draft: 'Draft saved.',
      submit: 'Sent for review.',
      publish: 'Post published.',
      schedule: 'Post scheduled.',
    };
    this.toast.success(this.i18n.t(messages[action]));

    if (action === 'draft' && !this.postId) {
      await this.router.navigate([this.context.basePath, 'write', id], { replaceUrl: true });
      return;
    }

    if (action === 'publish') {
      await this.router.navigate([this.context.basePath, id]);
    } else if (action !== 'draft') {
      await this.router.navigateByUrl(this.canPublish() ? `${this.context.basePath}/manage` : this.context.basePath);
    }
  }

  /** Wrap the selection (or a placeholder) in Markdown. */
  protected format(tool: FormatTool): void {
    const textarea = this.editor()?.nativeElement;
    const start = textarea?.selectionStart ?? this.content.length;
    const end = textarea?.selectionEnd ?? this.content.length;
    const selected = this.content.slice(start, end) || this.i18n.t(tool.placeholder);
    const needsNewLine = tool.block && start > 0 && this.content[start - 1] !== '\n';
    const prefix = (needsNewLine ? '\n' : '') + tool.before;

    this.content = this.content.slice(0, start) + prefix + selected + tool.after + this.content.slice(end);

    queueMicrotask(() => {
      if (!textarea) {
        return;
      }
      textarea.focus();
      const cursor = start + prefix.length;
      textarea.setSelectionRange(cursor, cursor + selected.length);
    });
  }

  private localDateTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

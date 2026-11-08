import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HotToastService } from '@ngxpert/hot-toast';

import { Category } from '../../../../core/models/category.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ResourceTopic, defaultTopics, needOf } from '../../../resources/resource-needs';
import { ResourceTopicService } from '../../../resources/resource-topic.service';
import { TOPIC_DRAFTS } from '../../../resources/resource-topic-drafts';

/** A topic while editing: lists as text. */
interface TopicDraft extends Omit<ResourceTopic, 'keywords' | 'tips'> {
  keywordsText: string;
  tipsText: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Admin → Topics: the "Search by Category" topics on /resources. Each topic
 * has a title, a one-line description, the categories it covers (or
 * keywords), an introduction, tips and helpful links shown on its page.
 */
@Component({
  selector: 'app-topic-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatIconModule],
  template: `
    <main class="mt-16 min-h-screen overflow-x-clip bg-gray-50">
      <div class="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="flex flex-wrap items-center gap-2">
          <a routerLink="/admin" class="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_back</mat-icon>
            Admin
          </a>
          <h1 class="border-l border-gray-200 pl-3 text-base font-semibold text-[#032D42]">Topics</h1>
          <a routerLink="/resources" target="_blank" class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-[#007979] hover:text-[#007979]">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">open_in_new</mat-icon>
            <span class="hidden sm:inline">View Resources</span>
          </a>
          @if (saved().length) {
            <button type="button" (click)="startNew()" class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666]">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>
              Add topic
            </button>
          }
        </div>

        @if (loading()) {
          <p class="py-10 text-center text-sm text-gray-500">Loading topics…</p>
        } @else if (!saved().length) {
          <!-- Not set up yet -->
          <section class="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">category</mat-icon>
            <h2 class="mt-2 text-lg font-bold text-[#032D42]">Set up the topics</h2>
            <p class="mx-auto mt-1 max-w-lg text-sm text-gray-600">
              The Resources page shows {{ defaults.length }} built-in topics (Food, Housing, Mental Health…). Load them here, with Zebron's drafted
              introductions, tips and helpful links for Maryland, DC and Virginia, then review and edit each one.
            </p>
            <button type="button" (click)="seed()" [disabled]="busy()" class="mt-4 inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
              <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">download</mat-icon>
              Load the {{ defaults.length }} topics
            </button>
          </section>
        } @else {
          <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <!-- ===================== List ===================== -->
            <section class="self-start rounded-2xl border border-gray-200 bg-white shadow-sm" aria-label="Topics">
              <p class="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500">In the order shown on /resources. Use the arrows to reorder.</p>
              @if (emptyWithDrafts().length) {
                <div class="border-b border-gray-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  {{ emptyWithDrafts().length }} {{ emptyWithDrafts().length === 1 ? 'topic has' : 'topics have' }} no introduction, tips or links yet.
                  <button type="button" (click)="fillDrafts()" [disabled]="busy()" class="mt-1.5 flex items-center gap-1 font-semibold text-[#007979] hover:underline disabled:opacity-50">
                    <mat-icon class="!h-4 !w-4 !text-base !leading-none" aria-hidden="true">auto_awesome</mat-icon>
                    Add Zebron's drafted content
                  </button>
                </div>
              }
              <ul class="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto">
                @for (topic of saved(); track topic.key; let first = $first; let last = $last; let index = $index) {
                  <li class="flex items-center gap-1 px-2 py-1.5 {{ draft()?.key === topic.key && editingKey() ? 'bg-[#E8F4F4]' : '' }}">
                    <button type="button" (click)="edit(topic)" class="min-w-0 flex-1 rounded-lg px-2 py-1 text-left hover:bg-gray-50">
                      <span class="flex items-center gap-1.5">
                        <span class="truncate text-sm font-semibold {{ topic.active ? 'text-[#032D42]' : 'text-gray-400 line-through' }}">{{ topic.title }}</span>
                        @if (!topic.active) {
                          <span class="rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-500">Hidden</span>
                        }
                      </span>
                      <span class="block truncate text-xs text-gray-500">{{ coverage(topic) }}</span>
                    </button>
                    <button type="button" (click)="move(index, -1)" [disabled]="first || busy()" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" [attr.aria-label]="'Move ' + topic.title + ' up'">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_upward</mat-icon>
                    </button>
                    <button type="button" (click)="move(index, 1)" [disabled]="last || busy()" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30" [attr.aria-label]="'Move ' + topic.title + ' down'">
                      <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">arrow_downward</mat-icon>
                    </button>
                  </li>
                }
              </ul>
            </section>

            <!-- ===================== Editor ===================== -->
            @if (draft(); as topic) {
              <form (ngSubmit)="save()" class="min-w-0 space-y-4">
                <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div class="mb-3 flex items-center gap-2">
                    <h2 class="text-base font-semibold text-[#032D42]">{{ editingKey() ? 'Edit topic' : 'New topic' }}</h2>
                    @if (editingKey()) {
                      <a [routerLink]="topic.route || '/resources'" [queryParams]="topic.route ? {} : { topic: topic.key }" target="_blank" class="ml-auto text-sm font-medium text-[#007979] hover:underline">View page</a>
                    }
                  </div>
                  <div class="grid gap-x-3 sm:grid-cols-2">
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Title</mat-label>
                      <input matInput name="title" [(ngModel)]="topic.title" (ngModelChange)="onTitle(topic)" required maxlength="60" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="zb-field">
                      <mat-label>Address key</mat-label>
                      <input matInput name="key" [(ngModel)]="topic.key" [disabled]="!!editingKey()" required pattern="[a-z0-9-]+" />
                      <mat-hint>/resources?topic={{ topic.key || '…' }}</mat-hint>
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>One-line description (in the list)</mat-label>
                    <input matInput name="text" [(ngModel)]="topic.text" maxlength="90" placeholder="Food banks, pantries, meals, SNAP" />
                  </mat-form-field>
                  <mat-checkbox name="active" [(ngModel)]="topic.active">Show on the Resources page</mat-checkbox>
                </section>

                <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 class="text-sm font-semibold text-[#032D42]">What's in this topic</h3>
                  <p class="mt-1 text-xs text-gray-500">Pick its categories. With none picked, categories and listings are matched by the keywords.</p>
                  <mat-form-field appearance="outline" class="zb-field mt-3">
                    <mat-label>Categories</mat-label>
                    <mat-select name="categoryIds" [(ngModel)]="topic.categoryIds" multiple>
                      @for (category of categories(); track category.id) {
                        <mat-option [value]="category.id">{{ category.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Keywords</mat-label>
                    <input matInput name="keywords" [(ngModel)]="topic.keywordsText" placeholder="food, pantry, meal, snap" />
                    <mat-hint>Commas between. Also used to find matching listings by their text.</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Open a page instead (optional)</mat-label>
                    <input matInput name="route" [(ngModel)]="topic.route" placeholder="/bootcamps" />
                    <mat-hint>For topics with their own page, such as /bootcamps or /jobs.</mat-hint>
                  </mat-form-field>
                </section>

                <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div class="flex flex-wrap items-start gap-2">
                    <div class="min-w-0 flex-1">
                      <h3 class="text-sm font-semibold text-[#032D42]">Topic page content</h3>
                      <p class="mt-1 text-xs text-gray-500">Shown above the listings when someone opens this topic.</p>
                    </div>
                    <button
                      type="button"
                      (click)="draftWithAi(topic)"
                      [disabled]="drafting() || !topic.title.trim()"
                      class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#007979]/40 bg-[#E8F4F4] px-3 text-sm font-semibold text-[#007979] hover:border-[#007979] disabled:opacity-50"
                    >
                      <mat-icon class="!h-[18px] !w-[18px] !text-[18px] !leading-none {{ drafting() ? 'animate-spin' : '' }}" aria-hidden="true">{{ drafting() ? 'autorenew' : 'auto_awesome' }}</mat-icon>
                      {{ drafting() ? 'Drafting…' : 'Draft with AI' }}
                    </button>
                  </div>
                  <label class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    Area
                    <input
                      type="text"
                      name="area"
                      [(ngModel)]="area"
                      class="h-8 min-w-0 flex-1 rounded-lg border border-gray-300 px-2 text-xs focus:border-[#007979] focus:outline-none focus:ring-2 focus:ring-[#007979]/20"
                    />
                  </label>
                  @if (draftNote()) {
                    <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">{{ draftNote() }}</p>
                  }
                  <mat-form-field appearance="outline" class="zb-field mt-3">
                    <mat-label>Introduction</mat-label>
                    <textarea matInput name="intro" rows="4" [(ngModel)]="topic.intro" maxlength="1500"
                      placeholder="Food pantries give groceries for free, usually once a week. Most don't ask for ID. Bring bags."></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Tips (one per line)</mat-label>
                    <textarea matInput name="tips" rows="4" [(ngModel)]="topic.tipsText"
                      placeholder="Call ahead: hours change around holidays.&#10;Ask about SNAP enrollment help on site."></textarea>
                  </mat-form-field>

                  <fieldset class="rounded-xl border border-gray-200 p-3">
                    <legend class="px-1 text-xs font-semibold text-gray-600">Helpful links</legend>
                    @for (link of topic.links; track link; let linkIndex = $index) {
                      <div class="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                        <mat-form-field appearance="outline" class="zb-field min-w-0 flex-1">
                          <mat-label>Label</mat-label>
                          <input matInput [name]="'linkLabel' + linkIndex" [(ngModel)]="link.label" placeholder="Apply for SNAP" />
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="zb-field min-w-0 flex-[2]">
                          <mat-label>Link or phone</mat-label>
                          <input matInput [name]="'linkUrl' + linkIndex" [(ngModel)]="link.url" placeholder="https://… or tel:211" />
                        </mat-form-field>
                        @if (uncheckedLinks().has(link.url)) {
                          <span class="mt-4 shrink-0 text-amber-600" title="This link did not open when checked. Fix or remove it." aria-label="Link could not be opened">
                            <mat-icon class="!h-5 !w-5 !text-[20px] !leading-none" aria-hidden="true">warning</mat-icon>
                          </span>
                        }
                        <button type="button" (click)="topic.links.splice(linkIndex, 1)" class="mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Remove link">
                          <mat-icon aria-hidden="true">close</mat-icon>
                        </button>
                      </div>
                    }
                    <button type="button" (click)="topic.links.push({ label: '', url: '' })" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10">
                      <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">add</mat-icon>
                      Add a link
                    </button>
                  </fieldset>
                </section>

                <div class="flex flex-wrap items-center gap-2">
                  <button type="submit" [disabled]="busy()" class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-5 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                    {{ busy() ? 'Saving…' : editingKey() ? 'Save topic' : 'Create topic' }}
                  </button>
                  <button type="button" (click)="draft.set(null)" class="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  @if (editingKey()) {
                    <button type="button" (click)="remove()" class="ml-auto text-sm font-medium text-red-600 hover:underline">Delete topic</button>
                  }
                </div>
              </form>
            } @else {
              <section class="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                <mat-icon class="text-gray-400" aria-hidden="true">touch_app</mat-icon>
                <p class="mt-2">Pick a topic to edit its text, categories, introduction, tips and links.</p>
              </section>
            }
          </div>
        }
      </div>
    </main>
  `,
})
export class TopicAdminComponent implements OnInit {
  private readonly service = inject(ResourceTopicService);
  private readonly categoryService = inject(CategoryService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);

  protected readonly defaults = defaultTopics();
  protected readonly saved = signal<ResourceTopic[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);

  protected readonly draft = signal<TopicDraft | null>(null);
  /** Key of the topic being edited; '' for a new topic. */
  protected readonly editingKey = signal('');

  // Drafting
  protected readonly drafting = signal(false);
  protected readonly draftNote = signal('');
  protected readonly uncheckedLinks = signal<Set<string>>(new Set());
  protected area = 'Maryland, Washington DC and Virginia';

  /** Saved topics with no content for which Zebron has a draft. */
  protected readonly emptyWithDrafts = computed(() =>
    this.saved().filter((topic) => {
      const draft = TOPIC_DRAFTS[topic.key];
      return !!draft && !topic.intro && !topic.tips.length && !topic.links.length && !!(draft.intro || draft.tips.length || draft.links.length);
    }),
  );

  private readonly categoryById = computed(() => new Map(this.categories().map((category) => [category.id, category])));

  /** New topics take their key from the title. */
  protected onTitle(topic: TopicDraft): void {
    if (!this.editingKey()) {
      topic.key = slugify(topic.title);
    }
  }

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [topics, categories] = await Promise.all([this.service.listAll(), this.categoryService.getAllCategories()]);
      this.saved.set(topics);
      this.categories.set([...categories].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load topics:', error);
      this.toast.error('Unable to load topics.');
    } finally {
      this.loading.set(false);
    }
  }

  /** "3 categories" or "Matched by keywords: food, pantry…" */
  protected coverage(topic: ResourceTopic): string {
    if (topic.route) return `Opens ${topic.route}`;
    if (topic.categoryIds.length) {
      return topic.categoryIds.map((id) => this.categoryById().get(id)?.name ?? 'Removed category').join(', ');
    }
    const matched = this.categories().filter((category) => needOf(category, this.saved())?.key === topic.key);
    return matched.length ? `By keywords: ${matched.map((category) => category.name).join(', ')}` : 'No categories yet';
  }

  protected async fillDrafts(): Promise<void> {
    this.busy.set(true);
    try {
      const filled = await this.service.fillDrafts(this.saved(), this.uid());
      await this.afterChange(`Drafted content added to ${filled} ${filled === 1 ? 'topic' : 'topics'}. Review each one.`);
    } catch (error) {
      console.error('Failed to add drafted content:', error);
      this.toast.error('Could not add the drafted content.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Fills the introduction, tips and links with an AI draft to review (not saved). */
  protected async draftWithAi(topic: TopicDraft): Promise<void> {
    if (
      (topic.intro.trim() || topic.tipsText.trim() || topic.links.length) &&
      !window.confirm('Replace the introduction, tips and links with an AI draft? Nothing is saved until you click Save.')
    ) {
      return;
    }
    this.drafting.set(true);
    this.draftNote.set('');
    try {
      const result = await this.service.draftWithAi(
        { title: topic.title, text: topic.text, keywords: topic.keywordsText.split(',').map((word) => word.trim()).filter(Boolean), intro: topic.intro },
        this.area,
      );
      topic.intro = result.intro;
      topic.tipsText = result.tips.join('\n');
      topic.links = result.links.map(({ label, url }) => ({ label, url }));
      const unchecked = result.links.filter((link) => !link.checked).map((link) => link.url);
      this.uncheckedLinks.set(new Set(unchecked));
      this.draftNote.set(
        'AI draft: read it through before saving.' +
          (unchecked.length ? ` ${unchecked.length} ${unchecked.length === 1 ? 'link' : 'links'} (marked ⚠) did not open: fix or remove them.` : ' Every link opened when checked.'),
      );
    } catch (error) {
      console.error('Failed to draft topic:', error);
      const message = error instanceof Error ? error.message : '';
      this.toast.error(message || 'The AI could not draft this topic.');
    } finally {
      this.drafting.set(false);
    }
  }

  protected async seed(): Promise<void> {
    this.busy.set(true);
    try {
      await this.service.seedDefaults(this.uid());
      await this.afterChange('Topics loaded. Pick one to edit it.');
    } catch (error) {
      console.error('Failed to load default topics:', error);
      this.toast.error('Could not load the topics.');
    } finally {
      this.busy.set(false);
    }
  }

  protected startNew(): void {
    this.editingKey.set('');
    this.draft.set({
      key: '',
      title: '',
      text: '',
      intro: '',
      categoryIds: [],
      keywordsText: '',
      route: '',
      tipsText: '',
      links: [],
      order: this.saved().length,
      active: true,
    });
  }

  protected edit(topic: ResourceTopic): void {
    this.draftNote.set('');
    this.uncheckedLinks.set(new Set());
    const { keywords, tips, ...rest } = structuredClone(topic);
    this.editingKey.set(topic.key);
    this.draft.set({ ...rest, keywordsText: keywords.join(', '), tipsText: tips.join('\n') });
  }

  protected async save(): Promise<void> {
    const topic = this.draft();
    if (!topic) return;
    const key = (this.editingKey() || slugify(topic.key || topic.title)).trim();
    if (!topic.title.trim() || !key) {
      this.toast.error('Give the topic a title.');
      return;
    }
    if (!this.editingKey() && this.saved().some((item) => item.key === key)) {
      this.toast.error(`A topic with the key "${key}" already exists.`);
      return;
    }
    const badLink = topic.links.find((link) => link.url.trim() && !/^(https?:\/\/|tel:|mailto:)/i.test(link.url.trim()));
    if (badLink) {
      this.toast.error(`"${badLink.label || badLink.url}" must start with https://, tel: or mailto:`);
      return;
    }

    const { keywordsText, tipsText, ...rest } = topic;
    this.busy.set(true);
    try {
      await this.service.save({ ...rest, key, keywords: keywordsText.split(','), tips: tipsText.split('\n') }, this.uid());
      this.draft.set(null);
      await this.afterChange(this.editingKey() ? 'Topic saved.' : 'Topic created.');
    } catch (error) {
      console.error('Failed to save topic:', error);
      this.toast.error('Could not save the topic.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const key = this.editingKey();
    const topic = this.draft();
    if (!key || !topic || !window.confirm(`Delete the topic "${topic.title}"? Its listings stay; only the topic goes.`)) return;
    this.busy.set(true);
    try {
      await this.service.remove(key);
      this.draft.set(null);
      await this.afterChange('Topic deleted.');
    } catch (error) {
      console.error('Failed to delete topic:', error);
      this.toast.error('Could not delete the topic.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async move(index: number, step: number): Promise<void> {
    const topics = [...this.saved()];
    const target = index + step;
    if (target < 0 || target >= topics.length) return;
    [topics[index], topics[target]] = [topics[target], topics[index]];
    this.saved.set(topics);
    this.busy.set(true);
    try {
      await this.service.saveOrder(topics, this.uid());
      await this.service.load(true);
    } catch (error) {
      console.error('Failed to reorder topics:', error);
      this.toast.error('Could not save the new order.');
      await this.load();
    } finally {
      this.busy.set(false);
    }
  }

  private async afterChange(message: string): Promise<void> {
    this.toast.success(message);
    await Promise.all([this.load(), this.service.load(true)]);
  }

  private uid(): string {
    return this.auth.firebaseUser()?.uid ?? '';
  }
}

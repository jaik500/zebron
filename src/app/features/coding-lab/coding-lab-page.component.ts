import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoggerService } from '../../core/services/logger.service';
import { CourseHeaderComponent } from '../courses/components/course-header.component';
import { CourseAccessService } from '../courses/course-access.service';
import { courseContextFromRoute } from '../courses/course.model';

import { CodeLabComponent } from './code-lab.component';
import { CODE_LANGUAGES, CodeExercise, CodeLanguage, CodeProject, isCodeLanguage } from './code-lab.model';
import { CodeLabStorageService } from './code-lab-storage.service';
import { LAB_EXERCISES, LAB_TEMPLATES, LabExercise, PYTHON_EXERCISES, PYTHON_TEMPLATES, WEB_EXERCISES, WEB_TEMPLATES } from './lab-exercises';

type Selection = { kind: 'project'; id: string } | { kind: 'exercise'; id: string };

/**
 * The Zebron Coding Lab page: the learner's saved projects and guided
 * exercises beside an editor that runs JavaScript and Python, and builds
 * web pages (HTML, CSS and JavaScript) with a live preview, in the browser.
 */
@Component({
  selector: 'app-coding-lab-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MatMenuModule, TranslatePipe, CourseHeaderComponent, CodeLabComponent],
  template: `
    <main class="mt-16 min-h-screen bg-slate-50">
      <app-course-header
        [basePath]="context.basePath"
        [crumbs]="[{ label: 'Learning', link: context.basePath }, { label: 'Coding Lab' }]"
        [activeTab]="'coding-lab'"
        [canManage]="canManage()"
      />

      <div class="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-6">
        <!-- Side list: projects and exercises -->
        <aside class="space-y-4 self-start lg:sticky lg:top-20">
          <section class="rounded-2xl border border-slate-200 bg-white" aria-labelledby="projects-title">
            <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <h2 id="projects-title" class="flex-1 text-sm font-semibold text-slate-900">{{ 'My projects' | t }}</h2>
              <button type="button" [matMenuTriggerFor]="newMenu" class="inline-flex h-8 items-center gap-1 rounded-lg bg-[#007979] px-2.5 text-xs font-semibold text-white hover:bg-[#006666]">
                <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">add</mat-icon>{{ 'New' | t }}
              </button>
              <mat-menu #newMenu="matMenu" xPosition="before">
                @for (language of languages; track language.value) {
                  <p class="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ language.label }}</p>
                  @for (template of templatesFor(language.value); track template.id) {
                    <button mat-menu-item type="button" (click)="newProject(template.name, template.code, template.language)">
                      <mat-icon aria-hidden="true">{{ template.id.endsWith('blank') ? 'note_add' : 'description' }}</mat-icon>
                      <span>{{ template.name | t }}</span>
                    </button>
                  }
                }
              </mat-menu>
            </div>
            @if (projectsLoading()) {
              <p class="px-4 py-3 text-sm text-slate-500">{{ 'Loading…' | t }}</p>
            } @else {
              <ul class="max-h-64 overflow-y-auto py-1 lg:max-h-72">
                @for (project of projects(); track project.id) {
                  <li>
                    <button type="button" (click)="select({ kind: 'project', id: project.id })" class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50" [class]="isSelected('project', project.id) ? 'bg-teal-50 font-semibold text-[#00605f]' : 'text-slate-700'" [attr.aria-current]="isSelected('project', project.id) ? 'true' : null">
                      <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px] text-slate-400" aria-hidden="true">{{ project.language === 'web' ? 'web' : 'code' }}</mat-icon>
                      <span class="min-w-0 flex-1 truncate">{{ project.name }}</span>
                      <span class="shrink-0 rounded px-1 text-[10px] font-bold" [class]="project.language === 'python' ? 'bg-sky-100 text-sky-800' : project.language === 'web' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'">{{ badgeOf(project.language) }}</span>
                      @if (dirtyIds().has(project.id)) { <span class="h-2 w-2 shrink-0 rounded-full bg-amber-500" [title]="'Not saved' | t"></span> }
                    </button>
                  </li>
                } @empty {
                  <li class="px-4 py-3 text-sm text-slate-500">{{ 'No projects yet. Start one with New.' | t }}</li>
                }
              </ul>
            }
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white" aria-labelledby="exercises-title">
            <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <h2 id="exercises-title" class="flex-1 text-sm font-semibold text-slate-900">{{ 'Exercises' | t }}</h2>
              <span class="text-xs text-slate-500">{{ '{0} of {1} done' | t: [passedCount(), shownExercises().length] }}</span>
            </div>
            <div class="flex gap-1 border-b border-slate-100 px-3 py-2" role="group" [attr.aria-label]="'Language' | t">
              @for (language of languages; track language.value) {
                <button type="button" (click)="exerciseLanguage.set(language.value)" [attr.aria-pressed]="exerciseLanguage() === language.value" class="h-7 rounded-md px-2.5 text-xs font-semibold" [class]="exerciseLanguage() === language.value ? 'bg-[#007979] text-white' : 'text-slate-600 hover:bg-slate-100'">{{ language.label }}</button>
              }
            </div>
            <ul class="max-h-80 overflow-y-auto py-1">
              @for (exercise of shownExercises(); track exercise.id) {
                <li>
                  <button type="button" (click)="select({ kind: 'exercise', id: exercise.id })" class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50" [class]="isSelected('exercise', exercise.id) ? 'bg-teal-50 font-semibold text-[#00605f]' : 'text-slate-700'" [attr.aria-current]="isSelected('exercise', exercise.id) ? 'true' : null">
                    <mat-icon class="!h-[18px] !w-[18px] shrink-0 !text-[18px]" [class]="passed().has('lab__' + exercise.id) ? 'text-emerald-600' : 'text-slate-300'" aria-hidden="true">{{ passed().has('lab__' + exercise.id) ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    <span class="min-w-0 flex-1 truncate">{{ exercise.title }}</span>
                    <span class="shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold uppercase text-slate-500">{{ exercise.level | t }}</span>
                  </button>
                </li>
              }
            </ul>
          </section>
        </aside>

        <!-- Work area -->
        <div class="min-w-0">
          @if (error()) {
            <p class="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">{{ error() | t }}</p>
          }
          @if (currentProject(); as project) {
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <input type="text" maxlength="80" class="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900" [value]="project.name" (change)="rename($any($event.target).value)" [attr.aria-label]="'Project name' | t" />
              <button type="button" (click)="saveProject()" [disabled]="saving() || !dirtyIds().has(project.id)" class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50">
                <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">save</mat-icon>
                {{ (saving() ? 'Saving…' : dirtyIds().has(project.id) ? 'Save' : 'Saved') | t }}
              </button>
              <button type="button" (click)="deleteProject()" class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700" [attr.aria-label]="'Delete project' | t" [title]="'Delete project' | t">
                <mat-icon aria-hidden="true">delete</mat-icon>
              </button>
            </div>
            @if (project.updatedAt) {
              <p class="mb-2 text-xs text-slate-500">{{ 'Last saved {0}' | t: [project.updatedAt | date: 'medium'] }}</p>
            }
            <app-code-lab [exercise]="projectExercise()!" [instanceKey]="'project:' + project.id" mode="example" [editorHeight]="project.language === 'web' ? '20rem' : '26rem'" previewHeight="22rem" [allowOpenInLab]="false" (codeChange)="onProjectCode($event)" />
          } @else if (currentExercise(); as exercise) {
            <app-code-lab [exercise]="exercise" [instanceKey]="'exercise:' + exercise.id" [saveKey]="'lab__' + exercise.id" editorHeight="20rem" [allowOpenInLab]="false" (passedChange)="markPassed(exercise.id)" />
          } @else {
            <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <mat-icon class="!h-10 !w-10 !text-[40px] text-[#007979]" aria-hidden="true">terminal</mat-icon>
              <h1 class="mt-2 text-lg font-semibold text-slate-900">{{ 'Zebron Coding Lab' | t }}</h1>
              <p class="mx-auto mt-1 max-w-md text-sm text-slate-600">{{ 'Write and run JavaScript or Python, or build web pages with HTML and CSS, right here. Start a project, or pick an exercise: it checks your code and tells you what to fix.' | t }}</p>
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" (click)="newProject('My first project', templates[0].code, 'javascript')" class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Start a JavaScript project' | t }}</button>
                <button type="button" (click)="newProject('My first Python project', pythonTemplates[0].code, 'python')" class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Start a Python project' | t }}</button>
                <button type="button" (click)="newProject('My first web page', webTemplates[0].code, 'web')" class="h-10 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666]">{{ 'Start a web page' | t }}</button>
                <button type="button" (click)="select({ kind: 'exercise', id: shownExercises()[0].id })" class="h-10 rounded-lg border border-[#007979] px-4 text-sm font-semibold text-[#007979] hover:bg-teal-50">{{ 'Try the first exercise' | t }}</button>
              </div>
            </div>
          }
          <p class="mt-3 text-xs text-slate-500">{{ 'Your code runs in your browser, separately from Zebron: it can\\u0027t reach your account or other websites. Long runs are stopped automatically.' | t }}</p>
        </div>
      </div>
    </main>
  `,
})
export class CodingLabPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storage = inject(CodeLabStorageService);
  private readonly access = inject(CourseAccessService);
  private readonly logger = inject(LoggerService);
  private readonly i18n = inject(I18nService);

  protected readonly context = courseContextFromRoute(this.route);
  protected readonly canManage = computed(() => this.access.canManage(this.context));
  protected readonly templates = LAB_TEMPLATES;
  protected readonly pythonTemplates = PYTHON_TEMPLATES;
  protected readonly webTemplates = WEB_TEMPLATES;
  protected readonly languages = CODE_LANGUAGES;
  protected readonly exercises: LabExercise[] = [...LAB_EXERCISES, ...PYTHON_EXERCISES, ...WEB_EXERCISES];
  protected readonly exerciseLanguage = signal<CodeLanguage>('javascript');
  protected readonly shownExercises = computed(() => this.exercises.filter((exercise) => exercise.language === this.exerciseLanguage()));

  protected readonly projects = signal<CodeProject[]>([]);
  protected readonly projectsLoading = signal(true);
  protected readonly passed = signal<Set<string>>(new Set());
  protected readonly selection = signal<Selection | null>(null);
  protected readonly dirtyIds = signal<Set<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  /** Latest code in the editor, and the last saved code, per project. */
  private readonly drafts = new Map<string, string>();
  private readonly savedCode = new Map<string, string>();
  private autosave: ReturnType<typeof setTimeout> | null = null;

  protected readonly currentProject = computed(() => {
    const selected = this.selection();
    return selected?.kind === 'project' ? this.projects().find((project) => project.id === selected.id) ?? null : null;
  });
  protected readonly currentExercise = computed(() => {
    const selected = this.selection();
    return selected?.kind === 'exercise' ? this.exercises.find((exercise) => exercise.id === selected.id) ?? null : null;
  });
  /** A project opens in the panel as an exercise with no checks. */
  protected readonly projectExercise = computed<CodeExercise | null>(() => {
    const project = this.currentProject();
    return project
      ? { language: project.language, title: project.name, instructions: '', starter: project.code, tests: [], hints: [], solution: '' }
      : null;
  });
  protected readonly passedCount = computed(() => this.shownExercises().filter((exercise) => this.passed().has('lab__' + exercise.id)).length);

  protected templatesFor(language: CodeLanguage) {
    return [...this.templates, ...this.pythonTemplates, ...this.webTemplates].filter((template) => template.language === language);
  }

  protected badgeOf(language: CodeLanguage): string {
    return CODE_LANGUAGES.find((item) => item.value === language)?.badge ?? 'JS';
  }

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    // Code sent from a lesson ("Open in the Coding Lab").
    const incoming = (this.router.getCurrentNavigation()?.extras.state ?? history.state)?.['codeLab'] as
      | { language?: CodeLanguage; code?: string; name?: string }
      | undefined;
    try {
      const [projects, passed] = await Promise.all([this.storage.listProjects(), this.storage.passedExercises()]);
      this.projects.set(projects);
      projects.forEach((project) => this.savedCode.set(project.id, project.code));
      this.passed.set(passed);
    } catch (error) {
      this.logger.error('CodingLabPageComponent', 'Could not load the Coding Lab.', error);
      this.error.set('Your projects could not be loaded. Try again.');
    } finally {
      this.projectsLoading.set(false);
    }
    if (incoming?.code) {
      this.newProject(incoming.name || 'From a lesson', incoming.code, isCodeLanguage(incoming.language) ? incoming.language : 'javascript');
    } else if (this.projects().length) {
      this.select({ kind: 'project', id: this.projects()[0].id });
    }
  }

  protected isSelected(kind: Selection['kind'], id: string): boolean {
    const selected = this.selection();
    return selected?.kind === kind && selected.id === id;
  }

  protected select(selection: Selection): void {
    this.flushAutosave();
    this.selection.set(selection);
  }

  protected newProject(name: string, code: string, language: CodeLanguage = 'javascript'): void {
    this.flushAutosave();
    const project: CodeProject = { id: this.storage.newProjectId(), name: this.i18n.t(name), language, code, updatedAt: null };
    this.projects.update((projects) => [project, ...projects]);
    this.drafts.set(project.id, code);
    this.markDirty(project.id, true);
    this.selection.set({ kind: 'project', id: project.id });
    void this.saveProject();
  }

  protected onProjectCode(code: string): void {
    const project = this.currentProject();
    if (!project) return;
    this.drafts.set(project.id, code);
    const dirty = code !== this.savedCode.get(project.id);
    this.markDirty(project.id, dirty);
    if (this.autosave) clearTimeout(this.autosave);
    this.autosave = dirty ? setTimeout(() => void this.saveProject(), 3000) : null;
  }

  protected rename(name: string): void {
    const project = this.currentProject();
    if (!project) return;
    this.projects.update((projects) => projects.map((item) => (item.id === project.id ? { ...item, name: name.trim() || 'Untitled' } : item)));
    this.markDirty(project.id, true);
    void this.saveProject();
  }

  protected async saveProject(): Promise<void> {
    const project = this.currentProject();
    if (!project) return;
    if (this.autosave) {
      clearTimeout(this.autosave);
      this.autosave = null;
    }
    const code = this.drafts.get(project.id) ?? project.code;
    this.saving.set(true);
    this.error.set('');
    try {
      await this.storage.saveProject({ id: project.id, name: project.name, language: project.language, code });
      // The panel keeps its text (same instanceKey); the list keeps the saved copy.
      this.savedCode.set(project.id, code);
      this.projects.update((projects) => projects.map((item) => (item.id === project.id ? { ...item, code, updatedAt: new Date() } : item)));
      this.markDirty(project.id, (this.drafts.get(project.id) ?? code) !== code);
    } catch (error) {
      this.logger.error('CodingLabPageComponent', 'Could not save the project.', error);
      this.error.set('The project could not be saved. Try again.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteProject(): Promise<void> {
    const project = this.currentProject();
    if (!project || !confirm(this.i18n.t('Delete "{0}"? This cannot be undone.', [project.name]))) return;
    try {
      await this.storage.deleteProject(project.id);
      this.projects.update((projects) => projects.filter((item) => item.id !== project.id));
      this.drafts.delete(project.id);
      this.markDirty(project.id, false);
      this.selection.set(this.projects().length ? { kind: 'project', id: this.projects()[0].id } : null);
    } catch (error) {
      this.logger.error('CodingLabPageComponent', 'Could not delete the project.', error);
      this.error.set('The project could not be deleted. Try again.');
    }
  }

  protected markPassed(exerciseId: string): void {
    this.passed.update((set) => new Set(set).add('lab__' + exerciseId));
  }

  private markDirty(id: string, dirty: boolean): void {
    this.dirtyIds.update((set) => {
      const next = new Set(set);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private flushAutosave(): void {
    if (this.autosave) {
      clearTimeout(this.autosave);
      this.autosave = null;
      void this.saveProject();
    }
  }
}

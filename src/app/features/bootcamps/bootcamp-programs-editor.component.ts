import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import {
  BOOTCAMP_FIELDS,
  BOOTCAMP_FINANCING,
  BOOTCAMP_FORMATS,
  BOOTCAMP_SCHEDULES,
  BootcampFinancing,
  BootcampProgram,
  normalizeProgram,
  slugify,
} from './bootcamp.model';
import { BootcampService, PAGE_STATS_ID } from './bootcamp.service';

/** A program while editing: lists as comma-separated text. */
interface ProgramDraft extends Omit<BootcampProgram, 'skills' | 'certifications'> {
  skillsText: string;
  certificationsText: string;
}

/**
 * The Programs part of the resource editor, shown for bootcamp resources.
 * The parent calls validate() before saving the resource and save() after.
 * Its fields use standalone ngModel, so they don't join the parent's form.
 */
@Component({
  selector: 'app-bootcamp-programs-editor',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatIconModule],
  template: `
    @if (pageViews() !== null) {
      <p class="mb-3 text-xs text-gray-500">
        <mat-icon class="!h-3.5 !w-3.5 align-[-2px] !text-[14px]" aria-hidden="true">visibility</mat-icon>
        {{ pageViews() }} page views since programs were added.
      </p>
    }
      <section class="space-y-3">
        <div class="flex items-center gap-2">
          <div>
          <h3 class="text-base font-semibold text-gray-900">Programs ({{ programs().length }})</h3>
          <p class="mt-1 text-sm text-gray-500">Courses of study this bootcamp offers, with start dates and Zebron's take. Shown on its page.</p>
        </div>
          <button type="button" (click)="addProgram()" class="ml-auto inline-flex h-9 items-center gap-1 rounded-lg border border-[#007979] px-3 text-sm font-semibold text-[#007979] hover:bg-[#007979]/10">
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>
            Add program
          </button>
        </div>

        @if (!programs().length) {
          <p class="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No programs yet. A program is one course of study, for example "Cybersecurity, 16 weeks, evenings".
          </p>
        }

        @for (program of programs(); track program; let index = $index) {
          <article class="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 sm:px-5">
              <button type="button" (click)="toggleProgram(index)" class="flex min-w-0 flex-1 items-center gap-1 text-left">
                <mat-icon class="!h-5 !w-5 !text-[20px] text-gray-500" aria-hidden="true">{{ openProgram() === index ? 'expand_less' : 'expand_more' }}</mat-icon>
                <span class="truncate text-sm font-semibold text-[#032D42]">{{ program.title || 'New program' }}</span>
                @if (program.recommended) {
                  <span class="ml-1 shrink-0 rounded-full bg-[#007979]/10 px-1.5 py-px text-[11px] font-semibold text-[#007979]">Recommended</span>
                }
              </button>
              @if (program.id && stats().has(program.id)) {
            <span class="hidden text-xs text-gray-500 sm:inline" title="Apply clicks">{{ stats().get(program.id) }} Apply clicks</span>
          }
          <button type="button" (click)="removeProgram(index)" class="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50" [attr.aria-label]="'Remove ' + (program.title || 'program')">
                Remove
              </button>
            </div>

            @if (openProgram() === index) {
              <div class="px-4 py-4 sm:px-5">
                <div class="grid gap-x-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Program title</mat-label>
                    <input matInput [name]="'title' + index" [(ngModel)]="program.title" required maxlength="120" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Field</mat-label>
                    <mat-select [name]="'field' + index" [(ngModel)]="program.field">
                      @for (option of fields; track option.value) {
                        <mat-option [value]="option.value">{{ option.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>Summary</mat-label>
                  <textarea matInput [name]="'summary' + index" rows="3" [(ngModel)]="program.summary" maxlength="2000"></textarea>
                </mat-form-field>

                <div class="grid gap-x-3 sm:grid-cols-4">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Format</mat-label>
                    <mat-select [name]="'format' + index" [(ngModel)]="program.format">
                      @for (option of formats; track option.value) {
                        <mat-option [value]="option.value">{{ option.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Schedule</mat-label>
                    <mat-select [name]="'schedule' + index" [(ngModel)]="program.schedule">
                      @for (option of schedules; track option.value) {
                        <mat-option [value]="option.value">{{ option.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Length (weeks)</mat-label>
                    <input matInput type="number" min="1" [name]="'weeks' + index" [(ngModel)]="program.durationWeeks" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Hours per week</mat-label>
                    <input matInput type="number" min="1" [name]="'hours' + index" [(ngModel)]="program.hoursPerWeek" />
                  </mat-form-field>
                </div>

                <!-- Cost -->
                <div class="grid gap-x-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Tuition (USD)</mat-label>
                    <input matInput type="number" min="0" [name]="'tuition' + index" [(ngModel)]="program.tuition" />
                    <mat-hint>0 = free; blank = not published</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Cost note</mat-label>
                    <input matInput [name]="'costNote' + index" [(ngModel)]="program.costNote" placeholder="e.g. Free for Maryland residents through WIOA" />
                  </mat-form-field>
                </div>
                <fieldset class="mb-4">
                  <legend class="mb-1 text-xs font-semibold text-gray-600">Ways to pay</legend>
                  <div class="flex flex-wrap gap-x-4 gap-y-1">
                    @for (option of financing; track option.value) {
                      <mat-checkbox
                        [name]="'fin-' + option.value + index"
                        [ngModel]="program.financing.includes(option.value)"
                        (ngModelChange)="toggleFinancing(program, option.value, $event)"
                      >
                        {{ option.label }}
                      </mat-checkbox>
                    }
                  </div>
                </fieldset>

                <!-- Who it is for -->
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>Prerequisites</mat-label>
                  <textarea matInput [name]="'prereq' + index" rows="2" [(ngModel)]="program.prerequisites" placeholder="e.g. Basic computer skills; high school diploma or GED"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>Work authorization or residency requirements</mat-label>
                  <input matInput [name]="'auth' + index" [(ngModel)]="program.workAuthorization" placeholder="As the bootcamp states it, e.g. Open to all; WIOA funding needs work authorization" />
                </mat-form-field>
                <div class="mb-3 flex flex-wrap gap-x-6 gap-y-1">
                  <mat-checkbox [name]="'degree' + index" [(ngModel)]="program.requiresDegree">Requires a college degree</mat-checkbox>
                  <mat-checkbox [name]="'english' + index" [(ngModel)]="program.englishSupport">English support for non-native speakers</mat-checkbox>
                </div>

                <!-- Skills and outcomes -->
                <div class="grid gap-x-3 sm:grid-cols-2">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Skills taught</mat-label>
                    <input matInput [name]="'skills' + index" [(ngModel)]="program.skillsText" placeholder="Networking, Linux, Security+" />
                    <mat-hint>Commas between. Matched with jobs and courses.</mat-hint>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Certifications it prepares for</mat-label>
                    <input matInput [name]="'certs' + index" [(ngModel)]="program.certificationsText" placeholder="CompTIA A+, Security+" />
                  </mat-form-field>
                </div>
                <div class="grid gap-x-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Hired within 6 months (%)</mat-label>
                    <input matInput type="number" min="0" max="100" [name]="'placement' + index" [(ngModel)]="program.placementRate" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="zb-field">
                    <mat-label>Source of that figure</mat-label>
                    <input matInput [name]="'source' + index" [(ngModel)]="program.outcomesSource" placeholder="e.g. 2025 outcomes report (link)" />
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="zb-field">
                  <mat-label>Apply link</mat-label>
                  <input matInput type="url" [name]="'apply' + index" [(ngModel)]="program.applyUrl" placeholder="https://bootcamp.example.com/apply" />
                </mat-form-field>

                <!-- Start dates -->
                <fieldset class="mb-4 rounded-lg border border-gray-200 p-3">
                  <legend class="px-1 text-xs font-semibold text-gray-600">Start dates</legend>
                  @for (start of program.starts; track start; let startIndex = $index) {
                    <div class="flex items-start gap-2">
                      <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                        <mat-label>Class starts</mat-label>
                        <input matInput type="date" [name]="'start' + index + '-' + startIndex" [(ngModel)]="start.date" />
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="zb-field zb-field--grow">
                        <mat-label>Apply by (optional)</mat-label>
                        <input matInput type="date" [name]="'deadline' + index + '-' + startIndex" [(ngModel)]="start.deadline" />
                      </mat-form-field>
                      <button type="button" (click)="program.starts.splice(startIndex, 1)" class="mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Remove start date">
                        <mat-icon aria-hidden="true">close</mat-icon>
                      </button>
                    </div>
                  }
                  <button type="button" (click)="program.starts.push({ date: '', deadline: '' })" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[#007979] hover:bg-[#007979]/10">
                    <mat-icon class="!h-4 !w-4 !text-base" aria-hidden="true">add</mat-icon>
                    Add a start date
                  </button>
                </fieldset>

                <!-- Zebron's take -->
                <div class="rounded-lg border border-[#007979]/25 bg-[#007979]/5 p-3">
                  <mat-checkbox [name]="'rec' + index" [(ngModel)]="program.recommended">
                    <span class="text-sm font-semibold text-[#032D42]">Recommended by Zebron</span>
                  </mat-checkbox>
                  <mat-form-field appearance="outline" class="zb-field mt-2">
                    <mat-label>Zebron's take (shown on the program page)</mat-label>
                    <textarea
                      matInput
                      [name]="'take' + index"
                      rows="3"
                      [(ngModel)]="program.zebronTake"
                      maxlength="1500"
                      placeholder="Why you recommend it, who it suits best, what to know before applying."
                    ></textarea>
                  </mat-form-field>
                </div>
              </div>
            }
          </article>
        }
      </section>
  `,
})
export class BootcampProgramsEditorComponent {
  private readonly service = inject(BootcampService);

  /** The resource being edited; null for a new resource. */
  readonly resourceId = input<string | null>(null);

  protected readonly fields = BOOTCAMP_FIELDS;
  protected readonly formats = BOOTCAMP_FORMATS;
  protected readonly schedules = BOOTCAMP_SCHEDULES;
  protected readonly financing = BOOTCAMP_FINANCING;

  protected readonly programs = signal<ProgramDraft[]>([]);
  protected readonly openProgram = signal<number | null>(null);
  /** Apply clicks by program id. */
  protected readonly stats = signal<Map<string, number>>(new Map());
  protected readonly pageViews = signal<number | null>(null);
  private loadedPrograms = 0;

  constructor() {
    effect(() => {
      const id = this.resourceId();
      untracked(() => void this.load(id));
    });
  }

  private async load(resourceId: string | null): Promise<void> {
    this.programs.set([]);
    this.openProgram.set(null);
    this.stats.set(new Map());
    this.pageViews.set(null);
    this.loadedPrograms = 0;
    if (!resourceId) {
      return;
    }
    try {
      const details = await this.service.get(resourceId);
      this.loadedPrograms = details?.programs.length ?? 0;
      this.programs.set(
        (details?.programs ?? []).map((program) => ({
          ...structuredClone(program),
          starts: program.starts.map((start) => ({ date: start.date, deadline: start.deadline ?? '' })),
          skillsText: program.skills.join(', '),
          certificationsText: program.certifications.join(', '),
        })),
      );
      const stats = (await this.service.listStats().catch(() => [])).filter((item) => item.bootcampId === resourceId);
      this.stats.set(new Map(stats.filter((item) => item.programId !== PAGE_STATS_ID).map((item) => [item.programId, item.applyClicks])));
      const page = stats.find((item) => item.programId === PAGE_STATS_ID);
      this.pageViews.set(page ? page.views : null);
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  }

  protected addProgram(): void {
    const program = normalizeProgram({ title: '' });
    this.programs.update((items) => [...items, { ...program, id: '', skillsText: '', certificationsText: '' }]);
    this.openProgram.set(this.programs().length - 1);
  }

  protected removeProgram(index: number): void {
    const title = this.programs()[index]?.title || 'this program';
    if (!window.confirm(`Remove ${title}? It is deleted when you save.`)) {
      return;
    }
    this.programs.update((items) => items.filter((_, position) => position !== index));
    this.openProgram.set(null);
  }

  protected toggleProgram(index: number): void {
    this.openProgram.update((current) => (current === index ? null : index));
  }

  protected toggleFinancing(program: ProgramDraft, value: BootcampFinancing, checked: boolean): void {
    program.financing = checked ? [...new Set([...program.financing, value])] : program.financing.filter((item) => item !== value);
  }

  /** A message when something must be fixed first, else ''. */
  validate(): string {
    for (const item of this.programs()) {
      if (!item.title.trim()) {
        return 'Every program needs a title (or remove the empty one).';
      }
      if (item.applyUrl && !/^https?:\/\//i.test(item.applyUrl.trim())) {
        return `The apply link of "${item.title}" must start with https://`;
      }
    }
    return '';
  }

  /** Saves the programs of the resource (nothing when there were and are none). */
  async save(resourceId: string, uid: string): Promise<void> {
    if (!this.programs().length && !this.loadedPrograms) {
      return;
    }
    const used = new Set<string>();
    const number = (value: unknown) => (value === null || value === undefined || value === '' ? null : Number(value));
    const programs: BootcampProgram[] = this.programs().map((item) => {
      // Keep an existing id (counts hang on it); new programs get a unique slug.
      let id = item.id || slugify(item.title) || 'program';
      while (used.has(id) || id === PAGE_STATS_ID) {
        id = `${id}-2`;
      }
      used.add(id);
      const { skillsText, certificationsText, ...program } = item;
      return {
        ...program,
        id,
        durationWeeks: number(program.durationWeeks),
        hoursPerWeek: number(program.hoursPerWeek),
        tuition: number(program.tuition),
        placementRate: number(program.placementRate),
        skills: skillsText.split(','),
        certifications: certificationsText.split(','),
        starts: program.starts.map((start) => ({ date: start.date, ...(start.deadline ? { deadline: start.deadline } : {}) })),
      };
    });
    await this.service.save(resourceId, programs, uid);
    this.loadedPrograms = programs.length;
  }
}

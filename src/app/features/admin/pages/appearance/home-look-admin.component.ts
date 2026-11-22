import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  BRAND_MARKS,
  BRAND_MARK_SETTING,
  BrandMark,
  HIDDEN_LOOKS_SETTING,
  DEFAULT_PLACEMENT,
  LookCircle,
  LookLetter,
  LookPlacement,
  PLACEMENT_LIMITS,
  brandMarkFor,
  hiddenLookKeys,
  letterStyle,
} from '../../../../core/config/brand-marks';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { BrandEDecorationComponent } from '../../../../shared/components/brand-e/brand-e-decoration.component';
import { BrandOrnamentComponent } from '../../../../shared/components/brand-e/brand-ornament.component';
import { HomeLooksService, LOOK_IMAGE_TYPES, lookImageProblem } from './home-looks.service';

type SliderKey = keyof LookPlacement;

const SLIDERS: { key: SliderKey; label: string; unit: string }[] = [
  { key: 'size', label: 'Size', unit: 'em' },
  { key: 'x', label: 'Left and right', unit: 'em' },
  { key: 'y', label: 'Up and down', unit: 'em' },
  { key: 'rotate', label: 'Tilt', unit: '°' },
];

/**
 * Admin → Home page look: a gallery of looks for the home page (a picture
 * on the mirrored "e" in the Zebron name, and the style of the big circle
 * on the right), plus a builder to make new ones (HomeLooksService).
 * Choosing a look saves the system setting `home.brandMark` (audited by
 * SettingsService); the home page switches at once for everyone.
 */
@Component({
  selector: 'app-home-look-admin',
  standalone: true,
  imports: [RouterLink, FormsModule, MatIconModule, BrandEDecorationComponent, BrandOrnamentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
      <a routerLink="/admin" class="inline-flex items-center gap-1 text-sm font-semibold text-[#007979] hover:underline">
        <mat-icon class="!h-4 !w-4 !text-[16px]" aria-hidden="true">arrow_back</mat-icon>Admin
      </a>
      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Home page look</h1>
          <p class="mt-1 max-w-2xl text-sm text-slate-600">
            Choose how the "e" in the Zebron name (its colour, a picture on it, and the circle beside it) looks on the home page. The change shows for everyone
            right away and stays until you choose another look, so switch back to <strong>Standard</strong> after the season.
          </p>
        </div>
        @if (!editing()) {
          <button
            type="button"
            class="inline-flex h-10 items-center gap-1 rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
            [disabled]="!ready()"
            (click)="startNew()"
          >
            <mat-icon class="!h-5 !w-5 !text-[20px]" aria-hidden="true">add</mat-icon>Create a look
          </button>
        }
      </div>

      @if (loadError()) {
        <p class="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{{ loadError() }}</p>
      }

      @if (hidden().length) {
        <p class="mt-4 text-sm text-slate-600">
          {{ hidden().length === 1 ? '1 built-in look is hidden.' : hidden().length + ' built-in looks are hidden.' }}
          <button type="button" class="font-semibold text-[#007979] hover:underline" (click)="showHidden.set(!showHidden())">
            {{ showHidden() ? 'Hide them again' : 'Show hidden looks' }}
          </button>
        </p>
      }

      <!-- ================= Builder ================= -->
      @if (editing()) {
        <section class="mt-6 rounded-2xl border border-[#007979]/30 bg-white p-4 sm:p-6" aria-labelledby="builder-title">
          <div class="flex items-center justify-between gap-3">
            <h2 id="builder-title" class="text-lg font-semibold text-slate-900">{{ editingExisting() ? 'Edit look' : 'Create a look' }}</h2>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close the builder" (click)="cancel()">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          </div>

          <div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <!-- Preview -->
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <div class="mt-2 grid gap-3 rounded-2xl bg-[#032D42] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" aria-hidden="true">
                <div class="flex min-h-40 items-center justify-center">
                  <span class="flex items-center text-7xl font-black leading-none text-white sm:text-8xl" style="padding-top: 0.2em">
                    <span>Z</span>
                    <span class="zb-e relative z-[1] mx-[-0.01em] inline-block text-[#12BFC3]" [style]="letterCss(draftLook())">e<app-brand-e-decoration [mark]="draftLook()" [image]="previewUrl()" /></span>
                    <span>bron</span>
                  </span>
                </div>
                <div class="flex flex-col items-center gap-2 pt-6">
                  <div class="relative grid h-28 w-28 place-items-center rounded-full bg-[#007979]">
                    @if (circle() === 'ornament') {
                      <app-brand-ornament />
                    }
                    <span class="relative block h-[1em] text-6xl font-black leading-[1em] text-white" style="transform: translateY(-0.1em) scaleX(-1)">e</span>
                  </div>
                  <span class="text-[11px] text-white/60">Circle (large screens)</span>
                </div>
              </div>
              <div class="mt-3 flex items-center justify-center rounded-2xl bg-[#032D42] p-3" aria-hidden="true">
                <span class="flex items-center text-4xl font-black leading-none text-white" style="padding-top: 0.2em">
                  <span>Z</span>
                  <span class="zb-e relative z-[1] mx-[-0.01em] inline-block text-[#12BFC3]" [style]="letterCss(draftLook())">e<app-brand-e-decoration [mark]="draftLook()" [image]="previewUrl()" /></span>
                  <span>bron</span>
                </span>
                <span class="ml-3 text-[11px] text-white/60">Phone size</span>
              </div>
            </div>

            <!-- Controls -->
            <form class="flex flex-col gap-4" (submit)="$event.preventDefault(); save()">
              <div>
                <span class="block text-sm font-semibold text-slate-800">Picture</span>
                <span class="block text-xs text-slate-500">PNG, WebP or SVG with a see-through background, up to 1 MB.</span>
                <input #picker type="file" class="hidden" [accept]="imageTypes" (change)="onPicked($event)" />
                <button type="button" class="mt-2 inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" (click)="picker.click()">
                  <mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">image</mat-icon>
                  {{ previewUrl() || editingExisting() ? 'Change picture' : 'Choose a picture' }}
                </button>
                @if (fileName()) {
                  <span class="ml-2 text-xs text-slate-600">{{ fileName() }}</span>
                }
                @if (fileProblem()) {
                  <p class="mt-1 text-xs text-rose-700" role="alert">{{ fileProblem() }}</p>
                }
              </div>

              @for (slider of sliders; track slider.key) {
                <label class="block text-sm text-slate-800">
                  <span class="flex justify-between">
                    <span class="font-semibold">{{ slider.label }}</span>
                    <span class="tabular-nums text-slate-500">{{ shown(slider.key) }}{{ slider.unit }}</span>
                  </span>
                  <input
                    type="range"
                    class="mt-1 w-full accent-[#007979]"
                    [attr.aria-label]="slider.label"
                    [min]="limits[slider.key].min"
                    [max]="limits[slider.key].max"
                    [step]="limits[slider.key].step"
                    [value]="placement()[slider.key]"
                    (input)="setPlacement(slider.key, $event)"
                  />
                </label>
              }
              <button type="button" class="self-start text-xs font-semibold text-[#007979] hover:underline" (click)="placement.set(defaultPlacement)">
                Reset position
              </button>

              <fieldset>
                <legend class="text-sm font-semibold text-slate-800">Letter style</legend>
                <div class="mt-1 flex flex-wrap gap-2">
                  @for (option of letterOptions; track option.value) {
                    <button
                      type="button"
                      class="h-9 rounded-full border px-3 text-sm font-semibold"
                      [style.background-color]="letter() === option.value ? '#007979' : '#ffffff'"
                      [style.color]="letter() === option.value ? '#ffffff' : '#00605f'"
                      [style.border-color]="letter() === option.value ? '#007979' : '#cbd5e1'"
                      [attr.aria-pressed]="letter() === option.value"
                      (click)="letter.set(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  }
                </div>
              </fieldset>

              <fieldset>
                <legend class="text-sm font-semibold text-slate-800">Circle on the right</legend>
                <div class="mt-1 flex gap-2">
                  @for (option of circleOptions; track option.value) {
                    <button
                      type="button"
                      class="h-9 rounded-full border px-3 text-sm font-semibold"
                      [style.background-color]="circle() === option.value ? '#007979' : '#ffffff'"
                      [style.color]="circle() === option.value ? '#ffffff' : '#00605f'"
                      [style.border-color]="circle() === option.value ? '#007979' : '#cbd5e1'"
                      [attr.aria-pressed]="circle() === option.value"
                      (click)="circle.set(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  }
                </div>
              </fieldset>

              <label class="block text-sm font-semibold text-slate-800">
                Name
                <input name="label" maxlength="40" required [(ngModel)]="label" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" placeholder="Pumpkin" />
              </label>
              <label class="block text-sm font-semibold text-slate-800">
                When it suits
                <input name="occasion" maxlength="60" [(ngModel)]="occasion" class="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal" placeholder="October" />
              </label>
              <label class="block text-sm font-semibold text-slate-800">
                Description
                <textarea name="description" maxlength="200" rows="2" [(ngModel)]="description" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"></textarea>
              </label>

              <div class="flex flex-wrap gap-2">
                <button
                  type="submit"
                  class="inline-flex h-10 items-center rounded-lg bg-[#007979] px-4 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                  [disabled]="busy() || !canSave()"
                >
                  {{ busy() ? 'Saving…' : 'Save look' }}
                </button>
                <button type="button" class="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" (click)="cancel()">
                  Cancel
                </button>
              </div>
              @if (!canSave() && !busy()) {
                <p class="text-xs text-slate-500">Add a name{{ editingExisting() ? '' : ' and a picture' }} to save.</p>
              }
            </form>
          </div>
        </section>
      }

      <!-- ================= Gallery ================= -->
      <ul class="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Looks">
        @for (mark of allLooks(); track mark.key) {
          @let inUse = current().key === mark.key;
          <li
            class="flex flex-col overflow-hidden rounded-2xl border bg-white"
            [style.border-color]="inUse ? '#007979' : '#e2e8f0'"
            [style.box-shadow]="inUse ? '0 0 0 1px #007979' : 'none'"
          >
            <div class="flex h-36 items-center justify-center gap-6 bg-[#032D42]" aria-hidden="true">
              <span class="flex items-center text-6xl font-black leading-none text-white" style="padding-top: 0.2em">
                <span>Z</span>
                <span class="zb-e relative z-[1] mx-[-0.01em] inline-block text-[#12BFC3]" [style]="letterCss(mark)">e<app-brand-e-decoration [mark]="mark" /></span>
                <span>bron</span>
              </span>
              @if (mark.circle === 'ornament') {
                <span class="relative mt-6 grid h-14 w-14 place-items-center rounded-full bg-[#007979]">
                  <app-brand-ornament />
                  <span class="relative block h-[1em] text-3xl font-black leading-[1em] text-white" style="transform: translateY(-0.1em) scaleX(-1)">e</span>
                </span>
              }
            </div>
            <div class="flex flex-1 flex-col gap-1 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-slate-900">{{ mark.label }}</h2>
                @if (inUse) {
                  <span class="rounded-full bg-[#007979] px-2 py-0.5 text-[11px] font-bold text-white">In use</span>
                }
                @if (mark.custom) {
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Built here</span>
                } @else {
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Built in</span>
                }
                @if (isHidden(mark)) {
                  <span class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Hidden</span>
                }
              </div>
              @if (mark.occasion) {
                <p class="text-xs font-semibold text-[#00605f]">{{ mark.occasion }}</p>
              }
              <p class="text-sm text-slate-600">{{ mark.description }}</p>
              <div class="mt-auto flex flex-wrap gap-2 pt-3">
                @if (inUse) {
                  <a
                    routerLink="/"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View the home page<mat-icon class="!h-[18px] !w-[18px] !text-[18px]" aria-hidden="true">open_in_new</mat-icon>
                  </a>
                } @else {
                  <button
                    type="button"
                    class="inline-flex h-9 items-center gap-1 rounded-lg bg-[#007979] px-3 text-sm font-semibold text-white hover:bg-[#006666] disabled:opacity-50"
                    [disabled]="!ready() || saving() !== null"
                    (click)="use(mark)"
                  >
                    {{ saving() === mark.key ? 'Saving…' : 'Use this look' }}
                  </button>
                }
                @if (!mark.custom && mark.image) {
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    [disabled]="!ready() || copying()"
                    title="Open this look in the builder and save your changes as a new look"
                    (click)="startCopy(mark)"
                  >
                    Copy and edit
                  </button>
                }
                @if (!mark.custom && mark.key !== 'standard') {
                  @if (isHidden(mark)) {
                    <button type="button" class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" [disabled]="hiding()" (click)="setHidden(mark, false)">
                      Show in gallery
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      [disabled]="inUse || hiding() || !ready()"
                      [title]="inUse ? 'Choose another look before hiding this one' : 'Hide this look from the gallery (you can show it again)'"
                      (click)="setHidden(mark, true)"
                    >
                      Hide
                    </button>
                  }
                }
                @if (mark.custom) {
                  <button type="button" class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" (click)="startEdit(mark)">
                    Edit
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    [disabled]="inUse || busy()"
                    [title]="inUse ? 'Choose another look before deleting this one' : 'Delete this look'"
                    (click)="remove(mark)"
                  >
                    Delete
                  </button>
                }
              </div>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .zb-e {
      transform: scaleX(-1);
    }
  `,
})
export class HomeLookAdminComponent {
  private readonly settings = inject(SettingsService);
  private readonly looks = inject(HomeLooksService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toast = inject(HotToastService);
  private readonly logger = inject(LoggerService);

  protected readonly sliders = SLIDERS;
  protected readonly limits = PLACEMENT_LIMITS;
  protected readonly defaultPlacement = DEFAULT_PLACEMENT;
  protected readonly imageTypes = LOOK_IMAGE_TYPES.join(',');
  protected readonly letterOptions: { value: LookLetter; label: string }[] = [
    { value: 'standard', label: 'Zebron teal' },
    { value: 'sparkler', label: 'Sparkler gold' },
    { value: 'paper-cut', label: 'Paper-cut red and gold' },
  ];
  protected readonly circleOptions: { value: LookCircle; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'ornament', label: 'Christmas ornament' },
  ];

  protected readonly ready = signal(false);
  protected readonly saving = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly loadError = signal('');
  private readonly customLooks = signal<BrandMark[]>([]);
  private readonly chosen = signal<string | null>(null);

  /** Built-in looks hidden from the gallery (home.hiddenLooks). */
  private readonly hiddenOverride = signal<string[] | null>(null);
  protected readonly hidden = computed(
    () => this.hiddenOverride() ?? hiddenLookKeys(this.settings.getSetting(HIDDEN_LOOKS_SETTING)?.value),
  );
  protected readonly showHidden = signal(false);
  protected readonly hiding = signal(false);
  protected readonly copying = signal(false);

  /** The gallery: built-in looks (hidden ones only on request; the one in use always) and looks built here. */
  protected readonly allLooks = computed(() => {
    const hidden = new Set(this.hidden());
    const inUse = this.current().key;
    const builtIn = BRAND_MARKS.filter((mark) => this.showHidden() || !hidden.has(mark.key) || mark.key === inUse);
    return [...builtIn, ...this.customLooks()];
  });
  protected readonly current = computed(() =>
    brandMarkFor(this.chosen() ?? this.settings.getSetting(BRAND_MARK_SETTING)?.value, this.customLooks()),
  );

  // ---------- Builder state ----------
  protected readonly editing = signal(false);
  protected readonly editingExisting = signal<BrandMark | null>(null);
  protected readonly placement = signal<LookPlacement>({ ...DEFAULT_PLACEMENT });
  protected readonly circle = signal<LookCircle>('standard');
  protected readonly letter = signal<LookLetter>('standard');
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly fileName = signal('');
  protected readonly fileProblem = signal('');
  private file: File | null = null;
  protected label = '';
  protected occasion = '';
  protected description = '';

  /** The look being built, as the preview draws it. */
  protected readonly draftLook = computed<BrandMark>(() => ({
    key: 'draft',
    label: '',
    occasion: '',
    description: '',
    image: this.editingExisting()?.image ?? null,
    placement: this.placement(),
    circle: this.circle(),
    letter: this.letter(),
  }));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearPreview());
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [, custom] = await Promise.all([this.settings.ensureLoaded(true), this.looks.list()]);
      this.customLooks.set(custom);
      this.ready.set(true);
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not load the looks.', error);
      this.loadError.set('The looks could not be loaded. Refresh the page to try again.');
    }
  }

  protected async use(mark: BrandMark): Promise<void> {
    this.saving.set(mark.key);
    try {
      await this.settings.set(BRAND_MARK_SETTING, mark.key);
      this.chosen.set(mark.key);
      this.toast.success(`The home page now shows the "${mark.label}" look.`, { dismissible: true });
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not save the look.', error);
      this.toast.error('The look could not be saved. Try again.', { dismissible: true });
    } finally {
      this.saving.set(null);
    }
  }

  // ---------- Builder ----------

  /** The letter style of a look, for the previews. */
  protected letterCss(mark: BrandMark): Record<string, string> | null {
    return letterStyle(mark.letter);
  }

  protected isHidden(mark: BrandMark): boolean {
    return !mark.custom && this.hidden().includes(mark.key);
  }

  /** Hide a built-in look from the gallery, or show it again. */
  protected async setHidden(mark: BrandMark, hide: boolean): Promise<void> {
    if (hide && this.current().key === mark.key) return;
    const next = hide ? [...new Set([...this.hidden(), mark.key])] : this.hidden().filter((key) => key !== mark.key);
    this.hiding.set(true);
    try {
      await this.settings.set(HIDDEN_LOOKS_SETTING, next);
      this.hiddenOverride.set(next);
      if (!next.length) this.showHidden.set(false);
      this.toast.success(hide ? `"${mark.label}" is hidden from the gallery.` : `"${mark.label}" is back in the gallery.`, { dismissible: true });
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not change the hidden looks.', error);
      this.toast.error('That could not be saved. Try again.', { dismissible: true });
    } finally {
      this.hiding.set(false);
    }
  }

  /**
   * Copy and edit: the builder opens with a built-in look's settings and a
   * copy of its picture; saving makes a new look (the built-in one stays).
   */
  protected async startCopy(mark: BrandMark): Promise<void> {
    if (!mark.image || this.copying()) return;
    this.copying.set(true);
    try {
      const response = await fetch(mark.image);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const name = mark.image.split('/').pop() ?? 'picture.svg';
      const file = new File([blob], name, { type: blob.type || 'image/svg+xml' });
      this.resetBuilder(null);
      this.placement.set({ ...mark.placement });
      this.circle.set(mark.circle);
      this.letter.set(mark.letter);
      this.label = `${mark.label} (copy)`.slice(0, 40);
      this.occasion = mark.occasion;
      this.description = mark.description;
      this.file = file;
      this.fileName.set(name);
      this.previewUrl.set(URL.createObjectURL(file));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not copy the look.', error);
      this.toast.error('The look could not be copied. Try again.', { dismissible: true });
    } finally {
      this.copying.set(false);
    }
  }

  protected startNew(): void {
    this.resetBuilder(null);
  }

  protected startEdit(mark: BrandMark): void {
    this.resetBuilder(mark);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cancel(): void {
    this.clearPreview();
    this.editing.set(false);
    this.editingExisting.set(null);
  }

  protected onPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (!picked) return;
    const problem = lookImageProblem(picked);
    this.fileProblem.set(problem);
    if (problem) return;
    this.clearPreview();
    this.file = picked;
    this.fileName.set(picked.name);
    this.previewUrl.set(URL.createObjectURL(picked));
  }

  protected setPlacement(key: SliderKey, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.placement.update((current) => ({ ...current, [key]: value }));
  }

  protected shown(key: SliderKey): string {
    const value = this.placement()[key];
    return key === 'rotate' ? String(Math.round(value)) : value.toFixed(2);
  }

  protected canSave(): boolean {
    return !!this.label.trim() && (!!this.file || !!this.editingExisting());
  }

  protected async save(): Promise<void> {
    if (!this.canSave() || this.busy()) return;
    this.busy.set(true);
    try {
      const existing = this.editingExisting();
      const saved = await this.looks.save(
        {
          label: this.label,
          occasion: this.occasion,
          description: this.description,
          placement: this.placement(),
          circle: this.circle(),
          letter: this.letter(),
          file: this.file,
        },
        existing,
      );
      this.customLooks.update((list) =>
        [...list.filter((item) => item.key !== saved.key), saved].sort((a, b) => a.label.localeCompare(b.label)),
      );
      this.toast.success(
        existing ? `"${saved.label}" is saved.` : `"${saved.label}" is added to the gallery. Press Use this look to show it.`,
        { dismissible: true },
      );
      this.cancel();
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not save the look.', error);
      this.toast.error(error instanceof Error && error.message.length < 120 ? error.message : 'The look could not be saved. Try again.', {
        dismissible: true,
      });
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(mark: BrandMark): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete this look?',
      message: `"${mark.label}" and its picture will be deleted. This can't be undone.`,
      icon: 'delete',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.busy.set(true);
    try {
      await this.looks.remove(mark);
      this.customLooks.update((list) => list.filter((item) => item.key !== mark.key));
      this.toast.success(`"${mark.label}" is deleted.`, { dismissible: true });
    } catch (error) {
      this.logger.error('HomeLookAdmin', 'Could not delete the look.', error);
      this.toast.error('The look could not be deleted. Try again.', { dismissible: true });
    } finally {
      this.busy.set(false);
    }
  }

  private resetBuilder(mark: BrandMark | null): void {
    this.clearPreview();
    this.editingExisting.set(mark);
    this.placement.set({ ...(mark?.placement ?? DEFAULT_PLACEMENT) });
    this.circle.set(mark?.circle ?? 'standard');
    this.letter.set(mark?.letter ?? 'standard');
    this.label = mark?.label ?? '';
    this.occasion = mark?.occasion ?? '';
    this.description = mark?.description ?? '';
    this.editing.set(true);
  }

  private clearPreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.file = null;
    this.fileName.set('');
    this.fileProblem.set('');
  }
}

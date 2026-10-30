import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AnnouncementBannerComponent } from './announcement-banner.component';
import {
  ANNOUNCEMENT_ARTWORK,
  ANNOUNCEMENT_FONTS,
  ANNOUNCEMENT_THEMES,
  ANNOUNCEMENT_TYPES,
  AnnouncementType,
  OrganizationAnnouncement,
  OrganizationAnnouncementInput,
  isAnnouncementLive,
  localDate,
  typeOption,
} from './organization-announcement.model';
import { OrganizationAnnouncementService } from './organization-announcement.service';

type AnnouncementState = 'live' | 'scheduled' | 'ended' | 'hidden';

/**
 * Create and manage dashboard banners: upcoming events, new cohorts,
 * graduations and student shout-outs. Shown to managers and above on
 * the Administration page.
 */
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-announcement-manager',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    AnnouncementBannerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-t border-gray-100 p-5 sm:p-6">
      @if (error()) {
        <p class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {{ error() | t }}
        </p>
      }

      @if (editing(); as draft) {
        <!-- =====================================================
             EDITOR
             ===================================================== -->
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="font-semibold text-gray-900">
            {{ editingId() ? ('Edit banner' | t) : ('New banner' | t) }}
          </h3>

          <button mat-button type="button" (click)="cancelEdit()">
            <mat-icon>close</mat-icon>
            {{ 'Cancel' | t }}
          </button>
        </div>

        <!-- Banner type -->
        <p class="mb-2 text-xs font-medium text-gray-500">{{ 'What are you announcing?' | t }}</p>
        <div class="mb-5 flex flex-wrap gap-2">
          @for (type of types; track type.key) {
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition"
              [class.border-teal-700]="draft.type === type.key"
              [class.bg-teal-50]="draft.type === type.key"
              [class.text-teal-700]="draft.type === type.key"
              [class.border-gray-200]="draft.type !== type.key"
              [class.text-gray-700]="draft.type !== type.key"
              [attr.aria-pressed]="draft.type === type.key"
              (click)="chooseType(type.key)"
            >
              {{ type.label | t }}
            </button>
          }
        </div>

        <!-- Live preview -->
        <p class="mb-2 text-xs font-medium text-gray-500">{{ 'Preview' | t }}</p>
        <app-announcement-banner [announcement]="draft" [dismissible]="true"></app-announcement-banner>

        <div class="mt-6 grid gap-x-4 md:grid-cols-2">
          <mat-form-field appearance="outline" class="zb-field md:col-span-2">
            <mat-label>{{ 'Headline' | t }}</mat-label>
            <input matInput maxlength="120" [ngModel]="draft.title" (ngModelChange)="patch({ title: $event })" name="title" required />
            <mat-hint align="end">{{ draft.title.length }}/120</mat-hint>
          </mat-form-field>

          @if (draft.type === 'shoutout') {
            <mat-form-field appearance="outline" class="zb-field md:col-span-2">
              <mat-label>{{ 'Student\\u0027s name' | t }}</mat-label>
              <input matInput maxlength="80" [ngModel]="draft.honoreeName ?? ''" (ngModelChange)="patch({ honoreeName: $event })" name="honoreeName" />
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="zb-field md:col-span-2">
            <mat-label>{{ 'Message' | t }}</mat-label>
            <textarea matInput rows="3" maxlength="500" [ngModel]="draft.message" (ngModelChange)="patch({ message: $event })" name="message"></textarea>
            <mat-hint align="end">{{ draft.message.length }}/500</mat-hint>
          </mat-form-field>

          @if (draft.type !== 'shoutout') {
            <mat-form-field appearance="outline" class="zb-field">
              <mat-label>{{ dateLabel() | t }}</mat-label>
              <input matInput type="date" [ngModel]="draft.eventDate ?? ''" (ngModelChange)="patch({ eventDate: $event || null })" name="eventDate" />
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>{{ 'Button text' | t }}</mat-label>
            <input matInput maxlength="40" [ngModel]="draft.ctaLabel ?? ''" (ngModelChange)="patch({ ctaLabel: $event })" name="ctaLabel" [placeholder]="'Register' | t" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field md:col-span-2">
            <mat-label>{{ 'Button link' | t }}</mat-label>
            <input matInput type="url" inputmode="url" [ngModel]="draft.ctaUrl ?? ''" (ngModelChange)="patch({ ctaUrl: $event })" name="ctaUrl" [placeholder]="'https://' | t" />
            <mat-hint>{{ 'Optional. The button only appears when there\\u0027s a link (https://).' | t }}</mat-hint>
          </mat-form-field>
        </div>

        <!-- Look -->
        <h4 class="mb-2 mt-4 text-sm font-semibold text-gray-900">{{ 'Look' | t }}</h4>

        <p class="mb-2 text-xs font-medium text-gray-500">{{ 'Theme' | t }}</p>
        <div class="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          @for (theme of themes; track theme.key) {
            <button
              type="button"
              class="overflow-hidden rounded-xl border-2 text-left transition focus:outline-none focus:ring-2 focus:ring-[#007979]"
              [class.border-teal-700]="draft.theme === theme.key"
              [class.border-transparent]="draft.theme !== theme.key"
              [attr.aria-pressed]="draft.theme === theme.key"
              (click)="patch({ theme: theme.key })"
            >
              <span class="block h-10" [class]="theme.container"></span>
              <span class="block bg-white px-2 py-1 text-xs font-medium text-gray-700">{{ theme.label | t }}</span>
            </button>
          }
        </div>

        <p class="mb-2 text-xs font-medium text-gray-500">{{ 'Artwork' | t }}</p>
        <div class="mb-5 flex flex-wrap gap-2">
          @for (art of artwork; track art.key) {
            <button
              type="button"
              class="flex h-12 w-12 items-center justify-center rounded-xl border-2 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#007979]"
              [class.border-teal-700]="draft.artwork === art.key"
              [class.bg-teal-50]="draft.artwork === art.key"
              [class.border-gray-200]="draft.artwork !== art.key"
              [attr.aria-label]="art.label"
              [attr.aria-pressed]="draft.artwork === art.key"
              [title]="art.label"
              (click)="patch({ artwork: art.key })"
            >
              @if (art.icon) {
                <mat-icon>{{ art.icon }}</mat-icon>
              } @else {
                <mat-icon class="text-gray-400">block</mat-icon>
              }
            </button>
          }
        </div>

        <div class="grid gap-x-4 md:grid-cols-2">
          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>{{ 'Headline font' | t }}</mat-label>
            <mat-select [value]="draft.font" (selectionChange)="patch({ font: $event.value })">
              @for (font of fonts; track font.key) {
                <mat-option [value]="font.key">{{ font.label | t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>{{ 'Photo link' | t }}</mat-label>
            <input matInput type="url" inputmode="url" [ngModel]="draft.imageUrl ?? ''" (ngModelChange)="patch({ imageUrl: $event })" name="imageUrl" [placeholder]="'https://' | t" />
            <mat-hint>{{ 'Optional, replaces the artwork. e.g. the student\\u0027s photo.' | t }}</mat-hint>
          </mat-form-field>
        </div>

        <!-- Schedule -->
        <h4 class="mb-2 mt-4 text-sm font-semibold text-gray-900">{{ 'When to show it' | t }}</h4>

        <div class="grid gap-x-4 md:grid-cols-2">
          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>{{ 'Show from' | t }}</mat-label>
            <input matInput type="date" [ngModel]="draft.startsOn ?? ''" (ngModelChange)="patch({ startsOn: $event || null })" name="startsOn" />
            <mat-hint>{{ 'Leave empty to show right away.' | t }}</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="zb-field">
            <mat-label>{{ 'Show until' | t }}</mat-label>
            <input matInput type="date" [ngModel]="draft.endsOn ?? ''" (ngModelChange)="patch({ endsOn: $event || null })" name="endsOn" />
            <mat-hint>{{ 'Leave empty to keep it until you hide it.' | t }}</mat-hint>
          </mat-form-field>
        </div>

        <mat-slide-toggle class="mt-2" [checked]="draft.active" (change)="patch({ active: $event.checked })">
          {{ 'Visible on the dashboard' | t }}
        </mat-slide-toggle>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button mat-button type="button" (click)="cancelEdit()">{{ 'Cancel' | t }}</button>
          <button
            mat-flat-button
            type="button"
            class="!bg-[#007979] !text-white"
            [disabled]="saving() || !draft.title.trim()"
            (click)="save()"
          >
            <mat-icon>{{ draft.active ? 'campaign' : 'save' }}</mat-icon>
            {{ saving() ? ('Saving…' | t) : draft.active ? ('Publish banner' | t) : ('Save as hidden' | t) }}
          </button>
        </div>
      } @else {
        <!-- =====================================================
             LIST
             ===================================================== -->
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-600">
            {{ 'Banners appear at the top of everyone\\u0027s dashboard. Members can close them; editing a banner shows it to everyone again.' | t }}
          </p>

          <button mat-flat-button type="button" class="!bg-[#007979] !text-white" (click)="startNew()">
            <mat-icon>add</mat-icon>
            {{ 'New banner' | t }}
          </button>
        </div>

        @if (loading()) {
          <p class="text-sm text-gray-500">{{ 'Loading banners…' | t }}</p>
        } @else if (announcements().length === 0) {
          <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <mat-icon class="!h-10 !w-10 !text-4xl text-gray-400">campaign</mat-icon>
            <p class="mt-2 text-sm font-semibold text-gray-900">{{ 'No banners yet' | t }}</p>
            <p class="mt-1 text-sm text-gray-500">
              {{ 'Announce an upcoming event, a new cohort, a graduation, or celebrate a top student.' | t }}
            </p>
          </div>
        } @else {
          <div class="divide-y divide-gray-100 rounded-xl border border-gray-200">
            @for (item of announcements(); track item.id) {
              <article class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                      {{ typeLabel(item.type) | t }}
                    </span>

                    <span
                      class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      [class]="stateClass(item)"
                    >
                      {{ stateLabel(item) | t }}
                    </span>
                  </div>

                  <p class="mt-1 break-words font-semibold text-gray-900">{{ item.title }}</p>

                  @if (item.startsOn || item.endsOn) {
                    <p class="text-xs text-gray-500">
                      {{ item.startsOn ? ('From ' | t) + item.startsOn : ('From now' | t) }}
                      {{ item.endsOn ? (' until ' | t) + item.endsOn : '' }}
                    </p>
                  }
                </div>

                <div class="flex shrink-0 flex-wrap gap-2">
                  <button mat-stroked-button type="button" (click)="edit(item)">
                    <mat-icon>edit</mat-icon>
                    {{ 'Edit' | t }}
                  </button>

                  <button mat-stroked-button type="button" [disabled]="saving()" (click)="toggleActive(item)">
                    <mat-icon>{{ item.active ? 'visibility_off' : 'visibility' }}</mat-icon>
                    {{ item.active ? ('Hide' | t) : ('Show' | t) }}
                  </button>

                  @if (confirmDeleteId() === item.id) {
                    <button mat-flat-button type="button" class="!bg-red-600 !text-white" [disabled]="saving()" (click)="remove(item)">
                      {{ 'Confirm delete' | t }}
                    </button>
                    <button mat-button type="button" (click)="confirmDeleteId.set(null)">{{ 'Keep' | t }}</button>
                  } @else {
                    <button mat-icon-button type="button" [attr.aria-label]="'Delete banner' | t" [title]="'Delete' | t" (click)="confirmDeleteId.set(item.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AnnouncementManagerComponent implements OnInit {
  readonly organizationId = input.required<string>();

  private readonly service = inject(OrganizationAnnouncementService);

  protected readonly types = ANNOUNCEMENT_TYPES;
  protected readonly themes = ANNOUNCEMENT_THEMES;
  protected readonly fonts = ANNOUNCEMENT_FONTS;
  protected readonly artwork = ANNOUNCEMENT_ARTWORK;

  protected readonly announcements = signal<OrganizationAnnouncement[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editing = signal<OrganizationAnnouncementInput | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmDeleteId = signal<string | null>(null);

  protected readonly dateLabel = computed(() => {
    switch (this.editing()?.type) {
      case 'cohort':
        return 'Cohort start date';
      case 'graduation':
        return 'Ceremony date';
      case 'event':
        return 'Event date';
      default:
        return 'Date (optional)';
    }
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);

    try {
      this.announcements.set(await this.service.getAllAnnouncements(this.organizationId()));
    } catch (error) {
      this.error.set(
        this.isPermissionDenied(error)
          ? "Banners couldn't be loaded: the database refused access. If banners were just added, deploy the Firestore rules (firebase deploy --only firestore:rules). Otherwise, only managers, admins and owners can manage banners."
          : this.messageOf(error),
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected startNew(): void {
    this.error.set('');
    this.editingId.set(null);
    this.editing.set(this.draftFor('event'));
  }

  protected edit(item: OrganizationAnnouncement): void {
    this.error.set('');
    this.editingId.set(item.id);

    this.editing.set({
      type: item.type,
      title: item.title ?? '',
      message: item.message ?? '',
      ctaLabel: item.ctaLabel ?? null,
      ctaUrl: item.ctaUrl ?? null,
      eventDate: item.eventDate ?? null,
      honoreeName: item.honoreeName ?? null,
      theme: item.theme,
      font: item.font,
      artwork: item.artwork,
      imageUrl: item.imageUrl ?? null,
      startsOn: item.startsOn ?? null,
      endsOn: item.endsOn ?? null,
      active: item.active === true,
    });
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.editingId.set(null);
    this.error.set('');
  }

  /**
   * Switching type applies that type's look. Text the manager already
   * changed is kept; untouched default text is swapped for the new type's.
   */
  protected chooseType(type: AnnouncementType): void {
    const current = this.editing();

    if (!current || current.type === type) {
      return;
    }

    const previous = typeOption(current.type).defaults;
    const next = typeOption(type).defaults;

    this.editing.set({
      ...current,
      type,
      theme: next.theme,
      font: next.font,
      artwork: next.artwork,
      title: !current.title || current.title === previous.title ? next.title : current.title,
      message: !current.message || current.message === previous.message ? next.message : current.message,
      ctaLabel:
        !current.ctaLabel || current.ctaLabel === previous.ctaLabel ? next.ctaLabel || null : current.ctaLabel,
      honoreeName: type === 'shoutout' ? current.honoreeName : null,
      eventDate: type === 'shoutout' ? null : current.eventDate,
    });
  }

  protected patch(changes: Partial<OrganizationAnnouncementInput>): void {
    const current = this.editing();

    if (current) {
      this.editing.set({ ...current, ...changes });
    }
  }

  protected async save(): Promise<void> {
    const draft = this.editing();

    if (!draft) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const id = this.editingId();

      if (id) {
        await this.service.updateAnnouncement(this.organizationId(), id, draft);
      } else {
        await this.service.createAnnouncement(this.organizationId(), draft);
      }

      this.cancelEdit();
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleActive(item: OrganizationAnnouncement): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.service.setActive(this.organizationId(), item.id, !item.active);
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(item: OrganizationAnnouncement): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      await this.service.deleteAnnouncement(this.organizationId(), item.id);
      this.confirmDeleteId.set(null);
      await this.load();
    } catch (error) {
      this.error.set(this.messageOf(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected typeLabel(type: AnnouncementType): string {
    return typeOption(type).label;
  }

  protected stateLabel(item: OrganizationAnnouncement): string {
    return {
      live: 'Live',
      scheduled: 'Scheduled',
      ended: 'Ended',
      hidden: 'Hidden',
    }[this.state(item)];
  }

  protected stateClass(item: OrganizationAnnouncement): string {
    return {
      live: 'bg-emerald-50 text-emerald-700',
      scheduled: 'bg-sky-50 text-sky-700',
      ended: 'bg-gray-100 text-gray-600',
      hidden: 'bg-amber-50 text-amber-800',
    }[this.state(item)];
  }

  private state(item: OrganizationAnnouncement): AnnouncementState {
    if (!item.active) {
      return 'hidden';
    }

    if (isAnnouncementLive(item)) {
      return 'live';
    }

    return item.startsOn && item.startsOn > localDate() ? 'scheduled' : 'ended';
  }

  private draftFor(type: AnnouncementType): OrganizationAnnouncementInput {
    const defaults = typeOption(type).defaults;

    return {
      type,
      title: defaults.title,
      message: defaults.message,
      ctaLabel: defaults.ctaLabel || null,
      ctaUrl: null,
      eventDate: null,
      honoreeName: null,
      theme: defaults.theme,
      font: defaults.font,
      artwork: defaults.artwork,
      imageUrl: null,
      startsOn: null,
      endsOn: null,
      active: true,
    };
  }

  private isPermissionDenied(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      String((error as { code: unknown }).code).includes('permission-denied')
    );
  }

  private messageOf(error: unknown): string {
    if (this.isPermissionDenied(error)) {
      return 'You do not have permission to change banners. Managers, admins and owners can.';
    }

    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}

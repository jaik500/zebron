import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { firebaseAuth, firestore } from '../../../core/services/firebase-config';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { NotificationService } from '../../../core/services/notification.service';

/** A quick link stored in adminLinks/{linkId}. */
interface AdminLink {
  id: string;
  label: string;
  url: string;
}

/**
 * Starting links. They are saved to adminLinks the first time an
 * administrator opens the page while the list is empty, after which
 * they can be edited or removed like any other link.
 */
const STARTER_LINKS: readonly Omit<AdminLink, 'id'>[] = [
  { label: 'Resend', url: 'https://resend.com/emails' },
  { label: 'Cloudflare', url: 'https://dash.cloudflare.com/login' },
  {
    label: 'Firebase',
    url: 'https://console.firebase.google.com/project/zebron-2b49f/firestore/databases',
  },
  {
    label: 'Stripe',
    url: 'https://dashboard.stripe.com/acct_1U9QlQIpzrAXcYjT/test/dashboard',
  },
  {
    label: 'Google Console',
    url: 'https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:zebron.org',
  },
  { label: 'Google Search', url: 'https://www.google.com/' },
  { label: 'Google AI Studio (Gemini)', url: 'https://aistudio.google.com/app/apikey' },
];

const LABEL_MAX = 60;
const URL_MAX = 2000;

/**
 * Quick links for administrators. Every card can be opened, edited or
 * removed, and "Add link" saves a new one. Links are shared by all
 * platform administrators.
 */
@Component({
  selector: 'app-admin-links',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-8">
      @for (link of links(); track link.id) {
        <div class="link-tile group relative" [class.editing]="editingId() === link.id">
          <a [href]="link.url" target="_blank" rel="noopener noreferrer" [title]="link.url">
            {{ link.label }}
          </a>
          <div class="tools">
            <button
              type="button"
              class="tool"
              [attr.aria-label]="'Edit ' + link.label"
              (click)="edit(link)"
            >
              <mat-icon class="!h-4 !w-4 !text-base">edit</mat-icon>
            </button>
            <button
              type="button"
              class="tool danger"
              [attr.aria-label]="'Remove ' + link.label"
              (click)="remove(link)"
            >
              <mat-icon class="!h-4 !w-4 !text-base">close</mat-icon>
            </button>
          </div>
        </div>
      }

      @if (links().length === 0) {
        @for (link of starterLinks; track link.url) {
          <a class="link-tile" [href]="link.url" target="_blank" rel="noopener noreferrer">
            {{ link.label }}
          </a>
        }
      }

      <button
        type="button"
        class="link-tile add"
        [attr.aria-expanded]="formOpen() && !editingId()"
        (click)="add()"
      >
        <mat-icon class="!h-4 !w-4 !text-base">add</mat-icon>
        Add link
      </button>
    </div>

    @if (links().length === 0) {
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button
          mat-stroked-button
          type="button"
          [disabled]="seeding()"
          (click)="seedStarterLinks()"
        >
          <mat-icon>edit</mat-icon>
          {{ seeding() ? 'Saving…' : 'Make these links editable' }}
        </button>
        @if (loadProblem()) {
          <p class="text-sm text-amber-800" role="status">{{ loadProblem() }}</p>
        }
      </div>
    } @else if (loadProblem()) {
      <p class="mt-2 text-sm text-amber-800" role="status">{{ loadProblem() }}</p>
    }

    @if (formOpen()) {
      <form
        class="mt-3 rounded-xl border border-gray-200 bg-white p-4"
        (ngSubmit)="save()"
      >
        <h3 class="mb-3 text-sm font-semibold text-[#032D42]">
          {{ editingId() ? 'Edit link' : 'Add an important link' }}
        </h3>

        <div class="grid gap-3 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-start">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Name</mat-label>
            <input
              matInput
              name="label"
              required
              [maxlength]="labelMax"
              placeholder="e.g. App Hosting logs"
              [ngModel]="label()"
              (ngModelChange)="label.set($event)"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Web address</mat-label>
            <input
              matInput
              name="url"
              type="url"
              required
              [maxlength]="urlMax"
              placeholder="https://"
              [ngModel]="url()"
              (ngModelChange)="url.set($event)"
            />
          </mat-form-field>

          <button
            mat-flat-button
            type="submit"
            class="!mt-1 !bg-[#032D42] !text-white"
            [disabled]="saving()"
          >
            {{ saving() ? 'Saving…' : editingId() ? 'Save changes' : 'Save link' }}
          </button>

          <button mat-button type="button" class="!mt-1" (click)="close()">Cancel</button>
        </div>

        @if (error()) {
          <p class="mt-2 text-sm text-red-700" role="alert">{{ error() }}</p>
        }
      </form>
    }
  `,
  styles: `
    .link-tile {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      min-height: 3.25rem;
      padding: 0.5rem 1.25rem;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      background: #fff;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #1f2937;
      text-decoration: none;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .link-tile:hover,
    .link-tile.editing {
      border-color: #032d42;
      background: #f8fafc;
    }
    .link-tile a {
      color: inherit;
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    .link-tile.add {
      border-style: dashed;
      color: #032d42;
      font-weight: 600;
      cursor: pointer;
    }
    .tools {
      position: absolute;
      top: 0.15rem;
      right: 0.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .group:hover .tools,
    .group:focus-within .tools,
    .editing .tools {
      opacity: 1;
    }
    .tool {
      display: flex;
      padding: 0.1rem;
      border-radius: 9999px;
      color: #6b7280;
    }
    .tool:hover {
      background: #e0f2fe;
      color: #032d42;
    }
    .tool.danger:hover {
      background: #fee2e2;
      color: #b91c1c;
    }
    @media (hover: none) {
      .tools {
        opacity: 1;
      }
    }
  `,
})
export class AdminLinksComponent {
  private readonly notifications = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly labelMax = LABEL_MAX;
  protected readonly urlMax = URL_MAX;

  protected readonly links = signal<AdminLink[]>([]);
  /** Shown read-only when saved links can't be loaded, so the cards never disappear. */
  protected readonly starterLinks = STARTER_LINKS;
  protected readonly loadProblem = signal('');
  protected readonly formOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly label = signal('');
  protected readonly url = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  private readonly linksRef = collection(firestore, 'adminLinks');
  protected readonly seeding = signal(false);
  private autoSeedTried = false;

  constructor() {
    // includeMetadataChanges: the server's "still empty" answer arrives as a
    // metadata-only change after the cached snapshot; without it, seeding never runs.
    const stop = onSnapshot(
      this.linksRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        this.loadProblem.set('');
        if (snapshot.empty && !snapshot.metadata.fromCache && !this.autoSeedTried) {
          this.autoSeedTried = true;
          void this.seedStarterLinks();
        }
        // Sorted here so links saved before "order" existed still show.
        const sortKey = (d: (typeof snapshot.docs)[number]): number =>
          Number(d.get('order') ?? d.get('createdAt')?.toMillis?.() ?? Number.MAX_SAFE_INTEGER);
        this.links.set(
          [...snapshot.docs]
            .sort((a, b) => sortKey(a) - sortKey(b))
            .map((d) => ({
              id: d.id,
              label: String(d.get('label') ?? ''),
              url: String(d.get('url') ?? ''),
            })),
        );
      },
      (error) => {
        console.error('Admin links could not be loaded.', error);
        this.links.set([]);
        this.loadProblem.set(
          error?.code === 'permission-denied'
            ? 'Saved links are blocked by the database rules. Deploy the latest firestore.rules and make sure you are signed in as a Zebron admin.'
            : 'Saved links could not be loaded right now.',
        );
      },
    );
    inject(DestroyRef).onDestroy(stop);
  }

  protected add(): void {
    if (this.formOpen() && !this.editingId()) {
      this.close();
      return;
    }
    this.editingId.set(null);
    this.label.set('');
    this.url.set('');
    this.error.set('');
    this.formOpen.set(true);
  }

  protected edit(link: AdminLink): void {
    this.editingId.set(link.id);
    this.label.set(link.label);
    this.url.set(link.url);
    this.error.set('');
    this.formOpen.set(true);
  }

  protected close(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.error.set('');
  }

  protected async save(): Promise<void> {
    const label = this.label().trim().slice(0, LABEL_MAX);
    const url = normalizeUrl(this.url());

    if (!label) {
      this.error.set('Give the link a name.');
      return;
    }
    if (!url) {
      this.error.set('Enter a full web address, for example https://example.com.');
      return;
    }

    const editingId = this.editingId();
    this.saving.set(true);
    this.error.set('');
    try {
      if (editingId) {
        await updateDoc(doc(this.linksRef, editingId), {
          label,
          url,
          updatedAt: serverTimestamp(),
          updatedBy: this.uid(),
        });
        this.notifications.success('Link updated.');
      } else {
        await addDoc(this.linksRef, {
          label,
          url,
          order: Date.now(),
          createdAt: serverTimestamp(),
          createdBy: this.uid(),
        });
        this.notifications.success('Link saved.');
      }
      this.close();
    } catch {
      this.error.set('The link could not be saved. Check that you are signed in as an administrator.');
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(link: AdminLink): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Remove link',
      message: `Remove "${link.label}" from the quick links?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteDoc(doc(this.linksRef, link.id));
      if (this.editingId() === link.id) this.close();
      this.notifications.success('Link removed.');
    } catch {
      this.notifications.error('The link could not be removed.');
    }
  }

  /** Saves the starting links once, so they can be edited like any other. */
  protected async seedStarterLinks(): Promise<void> {
    if (this.seeding() || this.links().length > 0) return;
    this.seeding.set(true);
    this.loadProblem.set('');
    try {
      const batch = writeBatch(firestore);
      STARTER_LINKS.forEach((link, index) => {
        batch.set(doc(this.linksRef), {
          ...link,
          order: index + 1,
          createdAt: serverTimestamp(),
          createdBy: this.uid(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Starter links could not be saved.', error);
      const code = (error as { code?: string })?.code ?? 'unknown';
      this.loadProblem.set(
        code === 'permission-denied'
          ? 'The database refused to save the links (permission denied). Check that you are signed in as a Zebron admin and that the latest firestore.rules is deployed.'
          : `The links could not be saved (${code}). Try again in a moment.`,
      );
    } finally {
      this.seeding.set(false);
    }
  }

  private uid(): string | null {
    return firebaseAuth.currentUser?.uid ?? null;
  }
}

/** Accepts "example.com" or a full address; returns '' when it is not a valid http(s) address. */
function normalizeUrl(raw: string): string {
  let value = raw.trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return '';
    const result = parsed.toString();
    return result.length <= URL_MAX ? result : '';
  } catch {
    return '';
  }
}

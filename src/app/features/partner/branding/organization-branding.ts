import { Injectable, signal } from '@angular/core';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firestore, firebaseAuth, firebaseStorage } from '../../../core/services/firebase-config';

/**
 * Organization branding: one accent color, a page background and an optional logo that an
 * organization's owners and administrators choose for their dashboard.
 *
 * Stored at organizations/{organizationId}/settings/branding as
 * { accent, background, logoUrl, logoPath, updatedAt, updatedBy }. The logo file lives
 * in Cloud Storage at organizations/{organizationId}/branding/{file}.
 * Every active member can read both (the dashboard shows them); only
 * owners, administrators and platform administrators change them (see
 * firestore.rules and storage.rules).
 *
 * Only these presets are allowed, so every choice keeps readable contrast:
 * white on `base` and `base` on white are both at least 4.5:1 (WCAG AA).
 */
export interface AccentPreset {
  key: string;
  label: string;
  /** Icons, links, outlines, buttons. */
  base: string;
  /** Middle of the header band. */
  dark: string;
  /** End of the header band. */
  end: string;
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { key: 'teal', label: 'Zebron teal', base: '#007979', dark: '#00706f', end: '#2a835f' },
  { key: 'blue', label: 'Blue', base: '#1d4ed8', dark: '#1e40af', end: '#1e3a8a' },
  { key: 'cyan', label: 'Cyan', base: '#0e7490', dark: '#155e75', end: '#164e63' },
  { key: 'purple', label: 'Purple', base: '#7e22ce', dark: '#6b21a8', end: '#581c87' },
  { key: 'rose', label: 'Rose', base: '#be123c', dark: '#9f1239', end: '#881337' },
  { key: 'orange', label: 'Orange', base: '#c2410c', dark: '#9a3412', end: '#7c2d12' },
  { key: 'green', label: 'Green', base: '#15803d', dark: '#166534', end: '#14532d' },
  { key: 'brown', label: 'Brown', base: '#8b4513', dark: '#6b3f1d', end: '#4a2a12' },
];

export const DEFAULT_ACCENT = 'teal';

/**
 * Page background behind the cards. Only light shades: page titles, counts
 * and descriptions sit directly on it, and on anything darker than "Dark
 * gray" their contrast falls below 3:1. Tinted mixes in a little of the
 * accent color.
 */
export interface BackgroundPreset {
  key: string;
  label: string;
}

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  { key: 'plain', label: 'Plain' },
  { key: 'tinted', label: 'Tinted' },
  { key: 'gray', label: 'Gray' },
  { key: 'dark-gray', label: 'Dark gray' },
];

export const DEFAULT_BACKGROUND = 'plain';

export function backgroundPreset(key: string | null | undefined): BackgroundPreset {
  return BACKGROUND_PRESETS.find((preset) => preset.key === key) ?? BACKGROUND_PRESETS[0];
}

/** The CSS color of a background choice (Tinted depends on the accent). */
export function pageBackground(accentKey: string | null | undefined, backgroundKey: string | null | undefined): string {
  switch (backgroundPreset(backgroundKey).key) {
    case 'tinted':
      return `color-mix(in oklab, ${accentPreset(accentKey).base} 7%, #f9fafb)`;
    case 'gray':
      return '#e5e7eb';
    case 'dark-gray':
      return '#d1d5db';
    default:
      return '#f9fafb';
  }
}

/** Logo files accepted for upload (SVG is refused: it can carry scripts). */
export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** Largest file a person may pick; it is shrunk before upload. */
export const LOGO_MAX_INPUT_BYTES = 5 * 1024 * 1024;
/** The logo is stored at most this many pixels wide or high. */
const LOGO_MAX_SIDE = 256;

export interface OrganizationBranding {
  accent: string;
  background: string;
  logoUrl: string | null;
  logoPath: string | null;
}

const DEFAULT_BRANDING: OrganizationBranding = { accent: DEFAULT_ACCENT, background: DEFAULT_BACKGROUND, logoUrl: null, logoPath: null };

/** Colors that were replaced: organizations that chose them get the replacement. */
const RENAMED_ACCENTS: Record<string, string> = { indigo: 'cyan', slate: 'brown' };

export function accentPreset(key: string | null | undefined): AccentPreset {
  const current = (key && RENAMED_ACCENTS[key]) || key;
  return ACCENT_PRESETS.find((preset) => preset.key === current) ?? ACCENT_PRESETS[0];
}

/** CSS variables for a container: children use var(--zb-accent) etc. */
export function accentStyle(key: string | null | undefined, background: string | null = null): Record<string, string> {
  const preset = accentPreset(key);
  return {
    '--zb-accent': preset.base,
    '--zb-accent-dark': preset.dark,
    '--zb-accent-end': preset.end,
    '--zb-page-bg': pageBackground(key, background),
  };
}

/** The CSS variables the organization theme sets on <html>. */
const THEME_VARIABLES = ['--zb-accent', '--zb-accent-dark', '--zb-accent-end', '--zb-page-bg'];
/** On <html> while an organization's pages are open: src/styles/_organization-theme.scss. */
const THEME_CLASS = 'zb-org-theme';

@Injectable({ providedIn: 'root' })
export class OrganizationBrandingService {
  /** Branding already read this session, by organization (one read each). */
  private readonly cache = new Map<string, OrganizationBranding>();

  /** The accent of the organization last loaded, for templates. */
  readonly accent = signal<string>(DEFAULT_ACCENT);
  /** The logo of the organization last loaded (null: none). */
  readonly logoUrl = signal<string | null>(null);
  /** The page background of the organization last loaded. */
  readonly background = signal<string>(DEFAULT_BACKGROUND);

  /** Organization whose pages are open (its theme is on <html>), or null. */
  private themedOrganizationId: string | null = null;

  private ref(organizationId: string) {
    return doc(firestore, 'organizations', organizationId, 'settings', 'branding');
  }

  private publish(branding: OrganizationBranding): void {
    this.accent.set(branding.accent);
    this.logoUrl.set(branding.logoUrl);
    this.background.set(branding.background);
  }

  /**
   * Themes every page of an organization (/partner/org/<id>/...) with its
   * accent and background; null (any other page) restores Zebron's look.
   * Called by the app root whenever the address changes.
   */
  async applyTheme(organizationId: string | null): Promise<void> {
    this.themedOrganizationId = organizationId;
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (!organizationId) {
      root.classList.remove(THEME_CLASS);
      THEME_VARIABLES.forEach((name) => root.style.removeProperty(name));
      return;
    }
    const branding = await this.loadBranding(organizationId);
    if (this.themedOrganizationId !== organizationId) {
      return; // The person moved on while it loaded.
    }
    this.setThemeVariables(branding);
  }

  private setThemeVariables(branding: OrganizationBranding): void {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    for (const [name, value] of Object.entries(accentStyle(branding.accent, branding.background))) {
      root.style.setProperty(name, value);
    }
    root.classList.add(THEME_CLASS);
  }

  /** The organization's branding; the defaults when none is set or it can't be read. */
  async loadBranding(organizationId: string): Promise<OrganizationBranding> {
    const cached = this.cache.get(organizationId);
    if (cached) {
      this.publish(cached);
      return cached;
    }
    let branding = DEFAULT_BRANDING;
    try {
      const snapshot = await getDoc(this.ref(organizationId));
      if (snapshot.exists()) {
        const data = snapshot.data();
        branding = {
          accent: accentPreset(typeof data['accent'] === 'string' ? data['accent'] : null).key,
          background: backgroundPreset(typeof data['background'] === 'string' ? data['background'] : null).key,
          logoUrl: typeof data['logoUrl'] === 'string' ? data['logoUrl'] : null,
          logoPath: typeof data['logoPath'] === 'string' ? data['logoPath'] : null,
        };
      }
      this.cache.set(organizationId, branding);
    } catch {
      // Branding is cosmetic: fall back to Zebron teal and no logo. Not
      // cached, so it is read again once the person is signed in.
    }
    this.publish(branding);
    return branding;
  }

  /** The organization's accent key (kept for callers that only need the color). */
  async load(organizationId: string): Promise<string> {
    return (await this.loadBranding(organizationId)).accent;
  }

  private async write(organizationId: string, branding: OrganizationBranding): Promise<void> {
    const user = firebaseAuth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to change the organization branding.');
    }
    await setDoc(this.ref(organizationId), {
      accent: branding.accent,
      background: branding.background,
      logoUrl: branding.logoUrl,
      logoPath: branding.logoPath,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    this.cache.set(organizationId, branding);
    this.publish(branding);
    if (this.themedOrganizationId === organizationId) {
      this.setThemeVariables(branding);
    }
  }

  /** Saves the accent color, and the background when given. */
  async save(organizationId: string, key: string, background?: string): Promise<void> {
    const current = await this.loadBranding(organizationId);
    await this.write(organizationId, {
      ...current,
      accent: accentPreset(key).key,
      background: background === undefined ? current.background : backgroundPreset(background).key,
    });
  }

  /**
   * Shrinks the image to at most 256 px a side, uploads it, records it on
   * the branding document and removes the previous logo file.
   */
  async uploadLogo(organizationId: string, file: File): Promise<void> {
    if (!LOGO_TYPES.includes(file.type)) {
      throw new Error('Choose a PNG, JPEG or WebP image.');
    }
    if (file.size > LOGO_MAX_INPUT_BYTES) {
      throw new Error('Choose an image smaller than 5 MB.');
    }
    const current = await this.loadBranding(organizationId);
    const image = await shrinkImage(file, LOGO_MAX_SIDE);
    const extension = image.type === 'image/webp' ? 'webp' : 'png';
    const path = `organizations/${organizationId}/branding/logo-${Date.now()}.${extension}`;
    const fileRef = ref(firebaseStorage, path);
    await uploadBytes(fileRef, image, { contentType: image.type, cacheControl: 'public, max-age=31536000' });
    const url = await getDownloadURL(fileRef);
    try {
      await this.write(organizationId, { ...current, logoUrl: url, logoPath: path });
    } catch (error) {
      await deleteObject(fileRef).catch(() => undefined);
      throw error;
    }
    await this.deleteFile(current.logoPath);
  }

  async removeLogo(organizationId: string): Promise<void> {
    const current = await this.loadBranding(organizationId);
    await this.write(organizationId, { ...current, logoUrl: null, logoPath: null });
    await this.deleteFile(current.logoPath);
  }

  /** Best effort: an old file left behind is harmless. */
  private async deleteFile(path: string | null): Promise<void> {
    if (!path) return;
    await deleteObject(ref(firebaseStorage, path)).catch(() => undefined);
  }
}

/** Scales an image down (never up) to fit maxSide, as WebP (PNG where WebP is unsupported). */
async function shrinkImage(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('This browser could not prepare the image.');
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    const webp = await toBlob('image/webp');
    if (webp && webp.type === 'image/webp') {
      return webp;
    }
    const png = await toBlob('image/png');
    if (!png) {
      throw new Error('This browser could not prepare the image.');
    }
    return png;
  } finally {
    bitmap.close();
  }
}

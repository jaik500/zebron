import { Injectable, inject } from '@angular/core';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';

import { AuthService } from '../../core/services/auth.service';
import { firebaseAuth, firebaseStorage } from '../../core/services/firebase-config';
import { User } from '../../core/models/user.model';

/** Photo files accepted for upload (SVG is refused: it can carry scripts). */
export const PROFILE_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
/** Largest file a person may pick; it is shrunk before upload. */
export const PROFILE_PHOTO_MAX_INPUT_BYTES = 5 * 1024 * 1024;
/** Stored as a square of this many pixels. */
const PHOTO_SIDE = 256;

/**
 * The signed-in person's profile picture.
 *
 * The file lives in Cloud Storage at users/{uid}/avatar/{file} (see
 * storage.rules); its address is saved as photoUrl on users/{uid} and on the
 * public communityProfiles/{uid}, through AuthService.updateUserProfile, so
 * Community shows the same picture.
 */
@Injectable({ providedIn: 'root' })
export class ProfilePhotoService {
  private readonly auth = inject(AuthService);

  async upload(file: File): Promise<void> {
    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      throw new Error('Choose a PNG, JPEG or WebP image.');
    }
    if (file.size > PROFILE_PHOTO_MAX_INPUT_BYTES) {
      throw new Error('Choose an image smaller than 5 MB.');
    }
    const uid = this.uid();
    const image = await squareImage(file, PHOTO_SIDE);
    const extension = image.type === 'image/webp' ? 'webp' : 'png';
    const path = `users/${uid}/avatar/photo-${Date.now()}.${extension}`;
    const fileRef = ref(firebaseStorage, path);
    await uploadBytes(fileRef, image, { contentType: image.type, cacheControl: 'public, max-age=31536000' });
    const url = await getDownloadURL(fileRef);
    try {
      await this.savePhotoUrl(url);
    } catch (error) {
      await deleteObject(fileRef).catch(() => undefined);
      throw error;
    }
    await this.deleteOtherPhotos(uid, path);
  }

  async remove(): Promise<void> {
    const uid = this.uid();
    await this.savePhotoUrl('');
    await this.deleteOtherPhotos(uid, null);
  }

  private uid(): string {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) {
      throw new Error('You must be signed in to change your photo.');
    }
    return uid;
  }

  /**
   * Saves the photo address with the profile as it is saved now, so a
   * photo change never saves half-typed edits from the form.
   */
  private async savePhotoUrl(photoUrl: string): Promise<void> {
    const user = this.auth.user();
    if (!user) {
      throw new Error('Your profile has not loaded yet. Try again.');
    }
    await this.auth.updateUserProfile({ ...savedProfile(user), photoUrl });
  }

  /** Best effort: an old file left behind is harmless. */
  private async deleteOtherPhotos(uid: string, keepPath: string | null): Promise<void> {
    try {
      const folder = await listAll(ref(firebaseStorage, `users/${uid}/avatar`));
      await Promise.all(
        folder.items
          .filter((item) => item.fullPath !== keepPath)
          .map((item) => deleteObject(item).catch(() => undefined)),
      );
    } catch {
      // Listing failed: leave the old files.
    }
  }
}

/** The profile fields updateUserProfile saves, as they are stored now. */
export function savedProfile(user: User) {
  return {
    displayName: user.displayName ?? '',
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    preferredName: user.preferredName ?? '',
    phone: user.phone ?? '',
    countryOfOrigin: user.countryOfOrigin ?? '',
    currentCountry: user.currentCountry ?? '',
    city: user.city ?? '',
    state: user.state ?? '',
    postalCode: user.postalCode ?? '',
    preferredLanguage: user.preferredLanguage ?? '',
    bio: user.bio ?? '',
    website: user.website ?? '',
    photoUrl: user.photoUrl ?? '',
  };
}

/** Crops the middle square and scales it to size×size, as WebP (PNG where WebP is unsupported). */
async function squareImage(file: File, size: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.round((bitmap.width - side) / 2);
    const sy = Math.round((bitmap.height - side) / 2);
    const target = Math.min(size, side);
    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('This browser could not prepare the image.');
    }
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
    const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
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

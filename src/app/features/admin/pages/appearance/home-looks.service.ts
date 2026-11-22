import { Injectable, inject } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { BrandMark, LookCircle, LookLetter, LookPlacement, clampPlacement, customLook } from '../../../../core/config/brand-marks';
import { firebaseStorage, firestore } from '../../../../core/services/firebase-config';
import { AuthService } from '../../../../core/services/auth.service';

/** Pictures the builder accepts (storage.rules checks the same). */
export const LOOK_IMAGE_TYPES = ['image/png', 'image/webp', 'image/svg+xml'] as const;
export const LOOK_IMAGE_MAX_BYTES = 1024 * 1024;

export interface LookDraft {
  label: string;
  occasion: string;
  description: string;
  placement: LookPlacement;
  circle: LookCircle;
  letter: LookLetter;
  /** A new picture (required for a new look). */
  file: File | null;
}

/** Why a picture can't be used, or '' when it can. */
export function lookImageProblem(file: File): string {
  if (!(LOOK_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Use a PNG, WebP or SVG picture.';
  if (file.size > LOOK_IMAGE_MAX_BYTES) return 'The picture is larger than 1 MB. Use a smaller one.';
  if (file.size === 0) return 'This file is empty.';
  return '';
}

/**
 * Looks built in Admin → Home page look (homeLooks/{id} in Firestore, the
 * picture in Storage at home-looks/{id}/...). Platform administrators only
 * (firestore.rules, storage.rules); everyone can read them.
 */
@Injectable({ providedIn: 'root' })
export class HomeLooksService {
  private readonly auth = inject(AuthService);

  async list(): Promise<BrandMark[]> {
    const snapshot = await getDocs(collection(firestore, 'homeLooks'));
    return snapshot.docs
      .map((item) => customLook(item.id, item.data()))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  /** Creates a look, or updates `existing`. Returns the saved look. */
  async save(draft: LookDraft, existing: BrandMark | null): Promise<BrandMark> {
    const uid = this.auth.firebaseUser()?.uid;
    if (!uid) throw new Error('Sign in first.');
    if (!existing && !draft.file) throw new Error('Choose a picture for the look.');
    if (draft.file) {
      const problem = lookImageProblem(draft.file);
      if (problem) throw new Error(problem);
    }

    const id = existing?.key ?? doc(collection(firestore, 'homeLooks')).id;
    let imageUrl = existing?.image ?? '';
    let imagePath = existing?.imagePath ?? '';
    const oldPath = draft.file ? existing?.imagePath : undefined;

    if (draft.file) {
      const name = draft.file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'picture';
      imagePath = `home-looks/${id}/${Date.now()}-${name}`;
      const fileRef = ref(firebaseStorage, imagePath);
      await uploadBytes(fileRef, draft.file, { contentType: draft.file.type, cacheControl: 'public, max-age=31536000' });
      imageUrl = await getDownloadURL(fileRef);
    }

    const fields = {
      label: draft.label.trim().slice(0, 40),
      occasion: draft.occasion.trim().slice(0, 60),
      description: draft.description.trim().slice(0, 200),
      imageUrl,
      imagePath,
      placement: clampPlacement(draft.placement),
      circle: draft.circle,
      letter: draft.letter,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };
    const lookRef = doc(firestore, 'homeLooks', id);
    if (existing) await updateDoc(lookRef, fields);
    else await setDoc(lookRef, { ...fields, createdAt: serverTimestamp(), createdBy: uid });

    // A replaced picture is no longer used.
    if (oldPath && oldPath !== imagePath) await deleteObject(ref(firebaseStorage, oldPath)).catch(() => undefined);

    return customLook(id, { ...fields });
  }

  async remove(look: BrandMark): Promise<void> {
    await deleteDoc(doc(firestore, 'homeLooks', look.key));
    if (look.imagePath) await deleteObject(ref(firebaseStorage, look.imagePath)).catch(() => undefined);
  }
}

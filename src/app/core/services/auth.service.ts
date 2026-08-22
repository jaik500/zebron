import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth, firestore } from './firebase-config';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Current Firebase Authentication user.
   *
   * This represents authentication state.
   */
  private readonly authenticatedUser = signal<FirebaseUser | null>(null);

  /**
   * Current Zebron Firestore user profile.
   *
   * This contains application-specific information
   * such as role, display name, email, etc.
   */
  private readonly currentUser = signal<User | null>(null);

  /**
   * Indicates whether authentication/profile state
   * is still being resolved.
   */
  private readonly loading = signal(true);

  constructor() {
    // Listen for Firebase authentication changes.
    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      // Keep Firebase authentication state current.
      this.authenticatedUser.set(firebaseUser);

      // No authenticated Firebase user.
      if (!firebaseUser) {
        this.currentUser.set(null);
        this.loading.set(false);
        return;
      }

      // Load the corresponding Firestore profile.
      await this.loadUserProfile(firebaseUser);
    });
  }

  /**
   * Load the user's profile from Firestore.
   */
  private async loadUserProfile(firebaseUser: FirebaseUser): Promise<void> {
    this.loading.set(true);

    try {
      const userRef = doc(firestore, 'users', firebaseUser.uid);

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        console.error('No Firestore user profile found for UID:', firebaseUser.uid);

        this.currentUser.set(null);
        return;
      }

      const user = {
        id: snapshot.id,
        ...snapshot.data(),
      } as User;

      console.log('Loaded Firestore user:', user);

      this.currentUser.set(user);
    } catch (error) {
      console.error('Failed to load user profile:', error);

      this.currentUser.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Current Zebron Firestore user profile.
   */
  get user() {
    return this.currentUser.asReadonly();
  }

  /**
   * Current Firebase Authentication user.
   *
   * This should be used for authentication checks.
   */
  get firebaseUser() {
    return this.authenticatedUser.asReadonly();
  }

  /**
   * Indicates whether authentication/profile
   * state is still loading.
   */
  get isLoading() {
    return this.loading.asReadonly();
  }

  /**
   * Indicates whether the current Zebron user
   * has administrator privileges.
   */
  get isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  /**
   * Sign in with email/password and explicitly
   * load the corresponding Firestore profile.
   */
  async signIn(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);

    // Explicitly load the Firestore profile
    // after successful authentication.
    await this.loadUserProfile(credential.user);
  }

  /**
   * Sign the current user out of Firebase.
   */
  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  }

  /**
   * Update the signed-in user's display name.
   *
   * The display name is updated in both:
   * - Firebase Authentication
   * - Firestore user profile
   */
  /**
   * Update the signed-in user's profile.
   *
   * The display name is required. All other profile
   * information is optional.
   *
   * The information is updated in:
   * - Firebase Authentication for display name
   * - Firestore for the complete Zebron profile
   */
  async updateUserProfile(profile: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    phone?: string;
    countryOfOrigin?: string;
    currentCountry?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    preferredLanguage?: string;
    bio?: string;
    website?: string;
    photoUrl?: string;
  }): Promise<void> {
    const firebaseUser = this.authenticatedUser();

    if (!firebaseUser) {
      throw new Error('No authenticated user found.');
    }

    const trimmedDisplayName = profile.displayName.trim();

    if (!trimmedDisplayName) {
      throw new Error('Display name is required.');
    }

    // Update Firebase Authentication profile.
    await updateProfile(firebaseUser, {
      displayName: trimmedDisplayName,
    });

    // Trim optional text fields before saving.
    const profileData = {
      displayName: trimmedDisplayName,

      firstName: profile.firstName?.trim() || '',

      lastName: profile.lastName?.trim() || '',

      preferredName: profile.preferredName?.trim() || '',

      phone: profile.phone?.trim() || '',

      countryOfOrigin: profile.countryOfOrigin?.trim() || '',

      currentCountry: profile.currentCountry?.trim() || '',

      city: profile.city?.trim() || '',

      state: profile.state?.trim() || '',

      postalCode: profile.postalCode?.trim() || '',

      preferredLanguage: profile.preferredLanguage?.trim() || '',

      bio: profile.bio?.trim() || '',

      website: profile.website?.trim() || '',

      photoUrl: profile.photoUrl?.trim() || '',

      updatedAt: serverTimestamp(),
    };

    // Update the Firestore profile while preserving
    // fields that are not part of the profile form.
    const userRef = doc(firestore, 'users', firebaseUser.uid);

    await setDoc(userRef, profileData, {
      merge: true,
    });

    // Refresh the local application user state
    // so the UI immediately reflects the changes.
    await this.loadUserProfile(firebaseUser);
  }

  /**
   * Register a new Zebron user.
   *
   * New accounts always receive the "user" role.
   * Admin privileges must be granted separately.
   */
  async register(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

    // Store the display name in Firebase Authentication.
    await updateProfile(credential.user, {
      displayName,
    });

    // Create the corresponding Firestore profile.
    // New registrations are NEVER created as admins.
    const userRef = doc(firestore, 'users', credential.user.uid);

    await setDoc(userRef, {
      email: credential.user.email ?? email,

      displayName,

      role: 'user',

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    });

    // Load the newly-created Firestore profile.
    await this.loadUserProfile(credential.user);
  }
}

import { Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { firebaseAuth, firestore } from './firebase-config';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebaseUser =
    signal<FirebaseUser | null>(null);

  private readonly currentUser =
    signal<User | null>(null);

  private readonly loading = signal(true);

  constructor() {
    // Listen for Firebase authentication changes.
    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      this.firebaseUser.set(firebaseUser);

      if (!firebaseUser) {
        this.currentUser.set(null);
        this.loading.set(false);
        return;
      }

      await this.loadUserProfile(firebaseUser);
    });
  }

  /**
   * Load the user's profile from Firestore.
   */
  private async loadUserProfile(
    firebaseUser: FirebaseUser
  ): Promise<void> {
    this.loading.set(true);

    try {
      const userRef = doc(
        firestore,
        'users',
        firebaseUser.uid
      );

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        console.error(
          'No Firestore user profile found for UID:',
          firebaseUser.uid
        );

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
      console.error(
        'Failed to load user profile:',
        error
      );

      this.currentUser.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  get user() {
    return this.currentUser.asReadonly();
  }

  get isLoading() {
    return this.loading.asReadonly();
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  /**
   * Sign in and explicitly load the user's Firestore profile.
   */
  async signIn(
    email: string,
    password: string
  ): Promise<void> {
    const credential =
      await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

    // Explicitly load the Firestore profile immediately
    // after successful authentication.
    await this.loadUserProfile(credential.user);
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
  }

  
  /**
   * Register a new Zebron user.
   *
   * New accounts always receive the "user" role.
   * Admin privileges must be granted separately.
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<void> {
    const credential =
      await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );

    // Store the display name in Firebase Authentication.
    await updateProfile(credential.user, {
      displayName,
    });

    // Create the corresponding Firestore user profile.
    // New registrations are NEVER created as admins.
    const userRef = doc(
      firestore,
      'users',
      credential.user.uid
    );

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

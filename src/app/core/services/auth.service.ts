import { inject, Injectable, signal } from '@angular/core';

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
  writeBatch,
} from 'firebase/firestore';

import { firebaseAuth, firestore } from './firebase-config';
import { User } from '../models/user.model';
import { AuditService } from './audit.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // ============================================================
  // SERVICES
  // ============================================================

  /**
   * Angular-managed AuditService.
   *
   * IMPORTANT:
   * AuditService must not inject AuthService.
   * Otherwise this service would participate in a circular
   * dependency.
   */
  private readonly auditService =
    inject(AuditService);

  /**
   * Centralized application logger.
   */
  private readonly logger =
    inject(LoggerService);

  // ============================================================
  // AUTHENTICATION STATE
  // ============================================================

  /**
   * Current Firebase Authentication user.
   *
   * Firebase Authentication is the authoritative source for
   * authentication identity.
   */
  private readonly authenticatedUser =
    signal<FirebaseUser | null>(null);

  /**
   * Current Zebron Firestore user profile.
   *
   * This contains application-specific information such as:
   *
   * - platformRole
   * - legacy role
   * - display name
   * - email
   * - profile information
   */
  private readonly currentUser =
    signal<User | null>(null);

  /**
   * Indicates whether authentication/profile state is
   * still being resolved.
   */
  private readonly loading =
    signal(true);

  // ============================================================
  // INITIALIZATION
  // ============================================================

  constructor() {
    /**
     * Listen for Firebase authentication changes.
     *
     * Firebase remains the authoritative source for whether
     * the browser currently has an authenticated user.
     */
    onAuthStateChanged(
      firebaseAuth,
      async (firebaseUser) => {
        // --------------------------------------------------------
        // Update Firebase authentication state.
        // --------------------------------------------------------

        this.authenticatedUser.set(
          firebaseUser,
        );

        // --------------------------------------------------------
        // No authenticated Firebase user.
        // --------------------------------------------------------

        if (!firebaseUser) {
          this.currentUser.set(null);
          this.loading.set(false);
          return;
        }

        // --------------------------------------------------------
        // Load corresponding Zebron Firestore profile.
        // --------------------------------------------------------

        await this.loadUserProfile(
          firebaseUser,
        );
      },
    );
  }

  // ============================================================
  // USER PROFILE LOADING
  // ============================================================

  /**
   * Load the user's Zebron profile from Firestore.
   */
  private async loadUserProfile(
    firebaseUser: FirebaseUser,
  ): Promise<void> {
    this.loading.set(true);

    try {
      const userRef = doc(
        firestore,
        'users',
        firebaseUser.uid,
      );

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        this.logger.warn(
          'AuthService',
          'No Firestore user profile found for authenticated user.',
          {
            userId: firebaseUser.uid,
          },
        );

        this.currentUser.set(null);
        return;
      }

      const user = {
        ...snapshot.data(),
        id: snapshot.id,
      } as User;

      this.logger.debug(
        'AuthService',
        'Loaded Firestore user profile.',
        {
          userId: firebaseUser.uid,
          platformRole: user.platformRole,
          legacyRole: user.role,
        },
      );

      this.currentUser.set(user);

      // Ensure this signed-in user's public Community profile exists.
      // Never copy private fields or authorization roles into it.
      await this.ensureCommunityProfile(
        firebaseUser,
        snapshot.data(),
      );
    } catch (error) {
      this.logger.error(
        'AuthService',
        'Failed to load user profile or ensure Community profile.',
        error,
        {
          userId: firebaseUser.uid,
        },
      );

      // Keep a successfully loaded private user profile available if
      // only public-profile recovery failed.
      // (The public-profile helper logs and handles its own errors.)
      if (!this.currentUser()) {
        this.currentUser.set(null);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a missing public Community profile for the currently
   * authenticated user. Existing public profiles are left untouched.
   *
   * This is a minimal, safe recovery path for accounts created before
   * communityProfiles was introduced. It deliberately copies only
   * allowlisted public fields from the user's own private document.
   */
  private async ensureCommunityProfile(
    firebaseUser: FirebaseUser,
    privateData: Record<string, unknown>,
  ): Promise<void> {
    const publicProfileRef = doc(
      firestore,
      'communityProfiles',
      firebaseUser.uid,
    );

    try {
      const publicProfileSnapshot = await getDoc(
        publicProfileRef,
      );

      if (publicProfileSnapshot.exists()) {
        return;
      }

      const displayName =
        this.readProfileString(privateData, 'displayName') ||
        firebaseUser.displayName?.trim() ||
        'Zebron User';

      const publicProfile = {
        displayName,
        firstName: this.readProfileString(privateData, 'firstName'),
        lastName: this.readProfileString(privateData, 'lastName'),
        preferredName: this.readProfileString(privateData, 'preferredName'),
        photoUrl:
          this.readProfileString(privateData, 'photoUrl') ||
          firebaseUser.photoURL?.trim() ||
          '',
        bio: this.readProfileString(privateData, 'bio'),
        website: this.readProfileString(privateData, 'website'),
        countryOfOrigin: this.readProfileString(privateData, 'countryOfOrigin'),
        currentCountry: this.readProfileString(privateData, 'currentCountry'),
        city: this.readProfileString(privateData, 'city'),
        state: this.readProfileString(privateData, 'state'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        publicProfileRef,
        publicProfile,
        { merge: false },
      );

      this.logger.info(
        'AuthService',
        'Created missing public Community profile.',
        {
          userId: firebaseUser.uid,
        },
      );
    } catch (error) {
      // A missing public profile should not prevent the user from
      // signing in. Log the issue so rules/schema failures are visible.
      this.logger.warn(
  'AuthService',
  'Could not create missing public Community profile.',
  {
    userId: firebaseUser.uid,
    error:
      error instanceof Error
        ? error.message
        : String(error),
  },
);
    }
  }

  /**
   * Read a string from a private profile without exposing arbitrary
   * fields. Only callers explicitly select approved public fields.
   */
  private readProfileString(
    data: Record<string, unknown>,
    field: string,
  ): string {
    const value = data[field];
    return typeof value === 'string' ? value.trim() : '';
  }

  // ============================================================
  // PUBLIC AUTHENTICATION STATE
  // ============================================================

  /**
   * Current Zebron Firestore user profile.
   *
   * Usage:
   *
   * this.authService.user()
   */
  get user() {
    return this.currentUser.asReadonly();
  }

  /**
   * Current Firebase Authentication user.
   *
   * Usage:
   *
   * this.authService.firebaseUser()
   */
  get firebaseUser() {
    return this.authenticatedUser.asReadonly();
  }

  /**
   * Indicates whether authentication/profile state
   * is still loading.
   *
   * Usage:
   *
   * this.authService.isLoading()
   */
  get isLoading() {
    return this.loading.asReadonly();
  }

  /**
   * Indicates whether the current Zebron user has
   * platform administrator privileges.
   *
   * Canonical authorization:
   *
   *   platformRole === 'platform-admin'
   *
   * Legacy compatibility:
   *
   *   role === 'admin'
   *
   * The legacy role is retained temporarily so existing
   * administrator accounts continue to work during migration.
   */
  get isAdmin(): boolean {
    const user = this.currentUser();

    if (!user) {
      return false;
    }

    return (
      user.platformRole === 'platform-admin' ||
      user.role === 'admin'
    );
  }

  /**
   * Canonical platform administrator check.
   *
   * This intentionally checks only platformRole.
   *
   * Use this when code needs to distinguish a fully migrated
   * platform administrator from a legacy administrator record.
   */
  get isPlatformAdmin(): boolean {
    return (
      this.currentUser()?.platformRole ===
      'platform-admin'
    );
  }

  /**
   * Returns the current platform role.
   */
  get platformRole() {
    return this.currentUser()?.platformRole;
  }

  // ============================================================
  // SIGN IN
  // ============================================================

  /**
   * Sign in using Firebase email/password authentication.
   *
   * After successful authentication:
   *
   * 1. Firebase authentication state is updated.
   * 2. The Zebron Firestore profile is loaded.
   * 3. A successful authentication audit event is recorded.
   *
   * Failed authentication attempts are also audited.
   *
   * Passwords and credentials are never written to the
   * audit log.
   */
  async signIn(
    email: string,
    password: string,
  ): Promise<void> {
    const normalizedEmail =
      email.trim().toLowerCase();

    try {
      // --------------------------------------------------------
      // Authenticate with Firebase.
      // --------------------------------------------------------

      const credential =
        await signInWithEmailAndPassword(
          firebaseAuth,
          normalizedEmail,
          password,
        );

      // --------------------------------------------------------
      // Keep Firebase authentication state current.
      // --------------------------------------------------------

      this.authenticatedUser.set(
        credential.user,
      );

      // --------------------------------------------------------
      // Explicitly load the Firestore profile.
      // --------------------------------------------------------

      await this.loadUserProfile(
        credential.user,
      );

      // --------------------------------------------------------
      // Record successful authentication.
      // --------------------------------------------------------

      await this.auditService.log({
        action:
          'authentication.login.success',

        entityType:
          'authentication',

        entityId:
          credential.user.uid,

        actorId:
          credential.user.uid,

        actorName:
          credential.user.displayName ?? null,

        actorEmail:
          credential.user.email ??
          normalizedEmail,

        actorType:
          'user',

        outcome:
          'success',

        source:
          'web',

        reason:
          'User successfully authenticated.',

        metadata: {
          authenticationMethod:
            'email-password',
        },
      });
    } catch (error) {
      // --------------------------------------------------------
      // Record failed authentication attempt.
      //
      // NEVER record the password or credentials.
      // --------------------------------------------------------

      await this.auditService.log({
        action:
          'authentication.login.failure',

        entityType:
          'authentication',

        actorId:
          null,

        actorName:
          null,

        actorEmail:
          normalizedEmail,

        actorType:
          'anonymous',

        outcome:
          'failure',

        source:
          'web',

        reason:
          this.getAuthenticationErrorMessage(
            error,
          ),

        metadata: {
          authenticationMethod:
            'email-password',
        },
      });

      this.logger.warn(
        'AuthService',
        'Authentication attempt failed.',
        {
          email: normalizedEmail,
        },
      );

      throw error;
    }
  }

  // ============================================================
  // SIGN OUT
  // ============================================================

  /**
   * Sign the current user out of Firebase.
   *
   * The logout audit event is recorded before Firebase clears
   * the authentication state so the actor information is still
   * available.
   */
  async logout(): Promise<void> {
    const firebaseUser =
      this.authenticatedUser();

    // ----------------------------------------------------------
    // Nothing to do if no user is authenticated.
    // ----------------------------------------------------------

    if (!firebaseUser) {
      return;
    }

    const actorId =
      firebaseUser.uid;

    const actorName =
      firebaseUser.displayName ?? null;

    const actorEmail =
      firebaseUser.email ?? null;

    try {
      // --------------------------------------------------------
      // Record logout before Firebase clears authentication.
      // --------------------------------------------------------

      await this.auditService.log({
        action:
          'authentication.logout',

        entityType:
          'authentication',

        entityId:
          actorId,

        actorId,

        actorName,

        actorEmail,

        actorType:
          'user',

        outcome:
          'success',

        source:
          'web',

        reason:
          'User signed out of Zebron.',

        metadata: {
          authenticationMethod:
            'firebase-authentication',
        },
      });

      // --------------------------------------------------------
      // Sign out from Firebase.
      // --------------------------------------------------------

      await signOut(
        firebaseAuth,
      );

      // --------------------------------------------------------
      // Clear local application state.
      // --------------------------------------------------------

      this.authenticatedUser.set(null);
      this.currentUser.set(null);
    } catch (error) {
      this.logger.error(
        'AuthService',
        'Failed to sign out user.',
        error,
        {
          userId: actorId,
        },
      );

      throw error;
    }
  }

  // ============================================================
  // PROFILE
  // ============================================================

  /**
   * Update the signed-in user's profile.
   *
   * The display name is required.
   *
   * Firebase Authentication stores the display name while
   * Firestore stores the complete Zebron profile.
   */
  async updateUserProfile(
    profile: {
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
    },
  ): Promise<void> {
    const firebaseUser =
      this.authenticatedUser();

    if (!firebaseUser) {
      throw new Error(
        'No authenticated user found.',
      );
    }

    const trimmedDisplayName =
      profile.displayName.trim();

    if (!trimmedDisplayName) {
      throw new Error(
        'Display name is required.',
      );
    }

    // ----------------------------------------------------------
    // Update Firebase Authentication profile.
    // ----------------------------------------------------------

    await updateProfile(
      firebaseUser,
      {
        displayName:
          trimmedDisplayName,
      },
    );

    // ----------------------------------------------------------
    // Prepare Firestore profile.
    //
    // IMPORTANT:
    // No role or platformRole fields are accepted from this
    // profile update method.
    //
    // This prevents normal profile editing from changing
    // platform authorization.
    // ----------------------------------------------------------

    const profileData = {
      displayName:
        trimmedDisplayName,

      firstName:
        profile.firstName?.trim() || '',

      lastName:
        profile.lastName?.trim() || '',

      preferredName:
        profile.preferredName?.trim() || '',

      phone:
        profile.phone?.trim() || '',

      countryOfOrigin:
        profile.countryOfOrigin?.trim() || '',

      currentCountry:
        profile.currentCountry?.trim() || '',

      city:
        profile.city?.trim() || '',

      state:
        profile.state?.trim() || '',

      postalCode:
        profile.postalCode?.trim() || '',

      preferredLanguage:
        profile.preferredLanguage?.trim() || '',

      bio:
        profile.bio?.trim() || '',

      website:
        profile.website?.trim() || '',

      photoUrl:
        profile.photoUrl?.trim() || '',

      updatedAt:
        serverTimestamp(),
    };

    // ----------------------------------------------------------
    // Prepare the public Community profile.
    //
    // Keep private account/security fields in users/{uid} only.
    // Never copy email, phone, postalCode, preferredLanguage,
    // role, or platformRole into communityProfiles/{uid}.
    // ----------------------------------------------------------

    const userRef = doc(
      firestore,
      'users',
      firebaseUser.uid,
    );

    const communityProfileRef = doc(
      firestore,
      'communityProfiles',
      firebaseUser.uid,
    );

    // Read the public profile first so an existing createdAt value
    // is preserved. If this is the first public profile write,
    // initialize createdAt below.
    const existingCommunityProfile = await getDoc(
      communityProfileRef,
    );

    const communityProfileData: Record<string, unknown> = {
      displayName: trimmedDisplayName,
      firstName: profile.firstName?.trim() || '',
      lastName: profile.lastName?.trim() || '',
      preferredName: profile.preferredName?.trim() || '',
      countryOfOrigin: profile.countryOfOrigin?.trim() || '',
      currentCountry: profile.currentCountry?.trim() || '',
      city: profile.city?.trim() || '',
      state: profile.state?.trim() || '',
      bio: profile.bio?.trim() || '',
      website: profile.website?.trim() || '',
      photoUrl: profile.photoUrl?.trim() || '',
      updatedAt: serverTimestamp(),
    };

    if (!existingCommunityProfile.exists()) {
      communityProfileData['createdAt'] = serverTimestamp();
    }

    // ----------------------------------------------------------
    // Atomically update both Firestore documents.
    //
    // The users document retains private fields and authorization
    // fields. The communityProfiles document contains only fields
    // intended to be visible to authenticated Community members.
    // ----------------------------------------------------------

    const batch = writeBatch(firestore);

    batch.set(userRef, profileData, { merge: true });
    batch.set(communityProfileRef, communityProfileData, { merge: true });

    await batch.commit();

    // ----------------------------------------------------------
    // Refresh local user state.
    // ----------------------------------------------------------

    await this.loadUserProfile(
      firebaseUser,
    );
  }

  // ============================================================
  // REGISTRATION
  // ============================================================

  /**
   * Register a new Zebron user.
   *
   * New registrations are always assigned the canonical
   * platformRole of "user".
   *
   * Administrator privileges must be granted separately
   * through trusted administrator functionality.
   */
  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<void> {
    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedDisplayName =
      displayName.trim();

    if (!normalizedDisplayName) {
      throw new Error(
        'Display name is required.',
      );
    }

    try {
      // --------------------------------------------------------
      // Create Firebase account.
      // --------------------------------------------------------

      const credential =
        await createUserWithEmailAndPassword(
          firebaseAuth,
          normalizedEmail,
          password,
        );

      // --------------------------------------------------------
      // Store display name in Firebase Authentication.
      // --------------------------------------------------------

      await updateProfile(
        credential.user,
        {
          displayName:
            normalizedDisplayName,
        },
      );

      // --------------------------------------------------------
      // Create private and public Firestore profiles atomically.
      //
      // New registrations are NEVER administrators. The private
      // users document contains account/security fields; the public
      // Community document contains only approved profile fields.
      // --------------------------------------------------------

      const userRef = doc(
        firestore,
        'users',
        credential.user.uid,
      );

      const communityProfileRef = doc(
        firestore,
        'communityProfiles',
        credential.user.uid,
      );

      const batch = writeBatch(firestore);

      batch.set(userRef, {
        email: credential.user.email ?? normalizedEmail,
        displayName: normalizedDisplayName,
        platformRole: 'user',
        // Retained for legacy compatibility.
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(communityProfileRef, {
        displayName: normalizedDisplayName,
        firstName: '',
        lastName: '',
        preferredName: '',
        countryOfOrigin: '',
        currentCountry: '',
        city: '',
        state: '',
        bio: '',
        website: '',
        photoUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // --------------------------------------------------------
      // Keep local authentication state current.
      // --------------------------------------------------------

      this.authenticatedUser.set(
        credential.user,
      );

      // --------------------------------------------------------
      // Load newly-created profile.
      // --------------------------------------------------------

      await this.loadUserProfile(
        credential.user,
      );

      // --------------------------------------------------------
      // Audit successful registration.
      // --------------------------------------------------------

      await this.auditService.log({
        action:
          'authentication.registration.success',

        entityType:
          'authentication',

        entityId:
          credential.user.uid,

        actorId:
          credential.user.uid,

        actorName:
          normalizedDisplayName,

        actorEmail:
          credential.user.email ??
          normalizedEmail,

        actorType:
          'user',

        outcome:
          'success',

        source:
          'web',

        reason:
          'New Zebron user account created successfully.',

        metadata: {
          authenticationMethod:
            'email-password',

          platformRole:
            'user',

          assignedRole:
            'user',
        },
      });
    } catch (error) {
      // --------------------------------------------------------
      // Audit failed registration.
      //
      // Passwords and credentials are never recorded.
      // --------------------------------------------------------

      await this.auditService.log({
        action:
          'authentication.registration.failure',

        entityType:
          'authentication',

        actorId:
          null,

        actorName:
          null,

        actorEmail:
          normalizedEmail,

        actorType:
          'anonymous',

        outcome:
          'failure',

        source:
          'web',

        reason:
          this.getAuthenticationErrorMessage(
            error,
          ),

        metadata: {
          authenticationMethod:
            'email-password',
        },
      });

      this.logger.warn(
        'AuthService',
        'User registration attempt failed.',
        {
          email: normalizedEmail,
        },
      );

      throw error;
    }
  }

  // ============================================================
  // AUTHENTICATION ERROR HANDLING
  // ============================================================

  /**
   * Convert Firebase authentication errors into safe,
   * human-readable messages.
   *
   * Credentials and passwords are never included.
   */
  private getAuthenticationErrorMessage(
    error: unknown,
  ): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error
    ) {
      const code =
        (
          error as {
            code?: unknown;
          }
        ).code;

      if (
        typeof code === 'string'
      ) {
        switch (code) {
          case 'auth/invalid-credential':
            return (
              'Invalid authentication credentials.'
            );

          case 'auth/invalid-email':
            return (
              'The supplied email address is invalid.'
            );

          case 'auth/user-disabled':
            return (
              'The user account is disabled.'
            );

          case 'auth/user-not-found':
            return (
              'The user account was not found.'
            );

          case 'auth/wrong-password':
            return (
              'The supplied authentication credentials are invalid.'
            );

          case 'auth/email-already-in-use':
            return (
              'The email address is already associated with an account.'
            );

          case 'auth/weak-password':
            return (
              'The supplied password does not meet the required security policy.'
            );

          case 'auth/network-request-failed':
            return (
              'The authentication request failed because of a network error.'
            );

          case 'auth/too-many-requests':
            return (
              'Too many authentication attempts were made.'
            );

          default:
            return (
              `Authentication failed (${code}).`
            );
        }
      }
    }

    if (
      error instanceof Error
    ) {
      return error.message;
    }

    return (
      'Authentication operation failed.'
    );
  }
}
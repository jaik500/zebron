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
   * This represents the authentication identity and should
   * be used for authentication checks.
   */
  private readonly authenticatedUser =
    signal<FirebaseUser | null>(null);


  /**
   * Current Zebron Firestore user profile.
   *
   * This contains application-specific information such as:
   *
   * - role
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

      const userRef =
        doc(
          firestore,
          'users',
          firebaseUser.uid,
        );


      const snapshot =
        await getDoc(userRef);


      // --------------------------------------------------------
      // Profile does not exist.
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // Build application user.
      // --------------------------------------------------------

      const user = {
        id: snapshot.id,
        ...snapshot.data(),
      } as User;


      this.logger.debug(
        'AuthService',
        'Loaded Firestore user profile.',
        {
          userId: firebaseUser.uid,
        },
      );


      this.currentUser.set(user);

    } catch (error) {

      this.logger.error(
        'AuthService',
        'Failed to load user profile.',
        error,
        {
          userId: firebaseUser.uid,
        },
      );


      this.currentUser.set(null);

    } finally {

      this.loading.set(false);
    }
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
   * administrator privileges.
   */
  get isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
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
    // Update Firestore profile.
    //
    // merge:true preserves fields that aren't part of this
    // profile form, including role and other application data.
    // ----------------------------------------------------------

    const userRef =
      doc(
        firestore,
        'users',
        firebaseUser.uid,
      );


    await setDoc(
      userRef,
      profileData,
      {
        merge: true,
      },
    );


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
   * New users are always assigned the "user" role.
   *
   * Administrator privileges must be granted separately.
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
      // Create corresponding Firestore profile.
      //
      // New registrations are NEVER administrators.
      // --------------------------------------------------------

      const userRef =
        doc(
          firestore,
          'users',
          credential.user.uid,
        );


      await setDoc(
        userRef,
        {
          email:
            credential.user.email ??
            normalizedEmail,

          displayName:
            normalizedDisplayName,

          role:
            'user',

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );


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
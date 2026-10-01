import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, AUTHORIZED_ADMIN_EMAILS } from './config';
import { firestoreService } from './firestoreService';
import { UserProfile, UserRole } from './types';
import { hashGovId } from '../utils/crypto';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const STORAGE_KEY_AUTH_USER = 'landregistry_current_auth_user_v1';

export class AuthService {
  /**
   * Checks if an email is authorized as a government administrator
   */
  isAuthorizedAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return AUTHORIZED_ADMIN_EMAILS.includes(normalized);
  }

  /**
   * Government Google Login
   */
  async loginGovernmentWithGoogle(): Promise<{ user: UserProfile; token?: string }> {
    if (isFirebaseConfigured() && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email;

        if (!this.isAuthorizedAdmin(email)) {
          await firebaseSignOut(auth);
          throw new Error('Access denied. You are not authorized to access this system.');
        }

        let profile = await firestoreService.getUserProfile(result.user.uid);
        if (!profile) {
          const { hash, last4 } = await hashGovId('GOV-ADMIN-' + result.user.uid.slice(0, 6));
          profile = {
            uid: result.user.uid,
            email: email || '',
            displayName: result.user.displayName || 'Government Officer',
            photoURL: result.user.photoURL || undefined,
            role: 'government',
            govIdHash: hash,
            govIdLast4: last4,
            createdAt: Date.now(),
          };
          await firestoreService.saveUserProfile(profile);
        }

        this.saveSessionUser(profile);
        return { user: profile };
      } catch (err: any) {
        if (err.message && err.message.includes('Access denied')) {
          throw err;
        }
        if (err.code === 'auth/popup-blocked') {
          throw new Error('Google sign-in popup was blocked by browser. Please allow popups for this site.');
        }
        if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
          throw new Error('Sign-in process was canceled by the user.');
        }
        throw new Error(err.message || 'Government Google login failed.');
      }
    }

    // High fidelity preview mode when Firebase keys are not yet entered in .env
    // Default authorized account matching the system user email
    const demoGovUser: UserProfile = {
      uid: 'gov-admin-demo-uid',
      email: AUTHORIZED_ADMIN_EMAILS[0] || 'admin@example.com',
      displayName: 'State Registrar / Land Commissioner',
      role: 'government',
      govIdHash: '0x90f79bf6eb2c4f870365e785982e1f101e93b906112233445566778899aabbcc',
      govIdLast4: '0001',
      createdAt: Date.now() - 86400000 * 100,
    };

    this.saveSessionUser(demoGovUser);
    return { user: demoGovUser };
  }

  /**
   * Citizen Google Login
   */
  async loginCitizenWithGoogle(rawGovId?: string): Promise<{ user: UserProfile }> {
    if (isFirebaseConfigured() && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        let profile = await firestoreService.getUserProfile(result.user.uid);

        if (!profile) {
          const effectiveId = rawGovId || 'CITIZEN-' + result.user.uid.slice(0, 6);
          const { hash, last4 } = await hashGovId(effectiveId);

          profile = {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || 'Citizen Member',
            photoURL: result.user.photoURL || undefined,
            role: 'citizen',
            govIdHash: hash,
            govIdLast4: last4,
            createdAt: Date.now(),
          };
          await firestoreService.saveUserProfile(profile);
        }

        this.saveSessionUser(profile);
        return { user: profile };
      } catch (err: any) {
        if (err.code === 'auth/popup-blocked') {
          throw new Error('Google sign-in popup was blocked by browser.');
        }
        throw new Error(err.message || 'Citizen Google login failed.');
      }
    }

    // Preview mode default citizen
    const demoCitizen: UserProfile = {
      uid: 'citizen-demo-uid',
      email: 'citizen.user@example.com',
      displayName: 'Rajesh Kumar Sharma',
      role: 'citizen',
      govIdHash: '0x8f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb4c8d5c4125b045e7e14a',
      govIdLast4: '7890',
      createdAt: Date.now() - 86400000 * 30,
    };

    this.saveSessionUser(demoCitizen);
    return { user: demoCitizen };
  }

  /**
   * Citizen Email/Password Registration
   */
  async registerCitizenWithEmail(
    email: string,
    pass: string,
    displayName: string,
    rawGovId: string
  ): Promise<UserProfile> {
    if (!email || !pass || !displayName || !rawGovId) {
      throw new Error('All fields including Government ID are required.');
    }

    const { hash: govIdHash, last4: govIdLast4 } = await hashGovId(rawGovId);

    // Duplicate check
    const isTaken = await firestoreService.isGovIdRegistered(govIdHash);
    if (isTaken) {
      throw new Error('This Government ID is already registered to another account.');
    }

    if (isFirebaseConfigured() && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const profile: UserProfile = {
          uid: cred.user.uid,
          email,
          displayName,
          role: 'citizen',
          govIdHash,
          govIdLast4,
          createdAt: Date.now(),
        };
        await firestoreService.saveUserProfile(profile);
        this.saveSessionUser(profile);
        return profile;
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          throw new Error('This email address is already in use.');
        }
        if (err.code === 'auth/weak-password') {
          throw new Error('Password should be at least 6 characters.');
        }
        throw new Error(err.message || 'Registration failed.');
      }
    }

    // Local / preview fallback
    const simulatedUid = 'cit-' + Math.random().toString(36).slice(2, 9);
    const profile: UserProfile = {
      uid: simulatedUid,
      email,
      displayName,
      role: 'citizen',
      govIdHash,
      govIdLast4,
      createdAt: Date.now(),
    };
    await firestoreService.saveUserProfile(profile);
    this.saveSessionUser(profile);
    return profile;
  }

  /**
   * Citizen Email/Password Sign-in
   */
  async loginCitizenWithEmail(email: string, pass: string): Promise<UserProfile> {
    if (!email || !pass) {
      throw new Error('Email and password are required.');
    }

    if (isFirebaseConfigured() && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        let profile = await firestoreService.getUserProfile(cred.user.uid);
        if (!profile) {
          const { hash, last4 } = await hashGovId(email);
          profile = {
            uid: cred.user.uid,
            email,
            displayName: cred.user.displayName || email.split('@')[0],
            role: 'citizen',
            govIdHash: hash,
            govIdLast4: last4,
            createdAt: Date.now(),
          };
          await firestoreService.saveUserProfile(profile);
        }
        this.saveSessionUser(profile);
        return profile;
      } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          throw new Error('Invalid email or password.');
        }
        throw new Error(err.message || 'Login failed.');
      }
    }

    // Local fallback sign in
    const profile: UserProfile = {
      uid: 'cit-local-' + email.replace(/[^a-zA-Z0-9]/g, ''),
      email,
      displayName: email.split('@')[0].toUpperCase(),
      role: 'citizen',
      govIdHash: '0x' + Array.from(new TextEncoder().encode(email)).map((b) => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0').slice(0, 64),
      govIdLast4: '3456',
      createdAt: Date.now(),
    };
    await firestoreService.saveUserProfile(profile);
    this.saveSessionUser(profile);
    return profile;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (isFirebaseConfigured() && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }

  /**
   * Get current session user from localStorage
   */
  getCurrentUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (!data) return null;
      return JSON.parse(data) as UserProfile;
    } catch {
      return null;
    }
  }

  private saveSessionUser(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save session user:', e);
    }
  }
}

export const authService = new AuthService();

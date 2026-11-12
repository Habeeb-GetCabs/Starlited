import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';
import type { UserProfile } from '../types/store';

export interface AuthSessionState {
  ready: boolean;
  user: User | null;
  isAdmin: boolean;
  profile: UserProfile | null;
}

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function loadOrCreateUserProfile(user: User): Promise<UserProfile | null> {
  if (!user.emailVerified) return null;
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: user.uid,
        displayName: typeof data.displayName === 'string' ? data.displayName : user.displayName ?? '',
        email: typeof data.email === 'string' ? data.email : user.email ?? '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        defaultAddress: typeof data.defaultAddress === 'string' ? data.defaultAddress : '',
        defaultCity: typeof data.defaultCity === 'string' ? data.defaultCity : '',
        defaultPincode: typeof data.defaultPincode === 'string' ? data.defaultPincode : '',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      };
    }

    const displayName = (user.displayName ?? 'STARLITES Customer').slice(0, 120);
    const email = (user.email ?? '').slice(0, 160);
    await setDoc(ref, {
      uid: user.uid,
      displayName,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      uid: user.uid,
      displayName,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    return null;
  }
}

export async function saveUserDeliveryDefaults(
  uid: string,
  defaults: {
    displayName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) return;
    await setDoc(
      ref,
      {
        displayName: defaults.displayName.trim().slice(0, 120),
        phone: defaults.phone.trim().slice(0, 20),
        defaultAddress: defaults.address.trim().slice(0, 400),
        defaultCity: defaults.city.trim().slice(0, 100),
        defaultPincode: defaults.pincode.trim().slice(0, 12),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(
  callback: (state: AuthSessionState) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({
        ready: true,
        user: null,
        isAdmin: false,
        profile: null,
      });
      return;
    }
    const [isAdmin, profile] = await Promise.all([
      checkUserIsAdmin(user),
      loadOrCreateUserProfile(user),
    ]);
    callback({
      ready: true,
      user,
      isAdmin,
      profile,
    });
  });
}

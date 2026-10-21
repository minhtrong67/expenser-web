import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useT } from '../i18n';
import { useSettings } from './SettingsContext';
import { DEFAULT_REMINDER, removeServerReminder, syncWorkerConfig } from '../services/reminders';

const AuthContext = createContext(null);

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'auth.error.emailInUse',
  'auth/invalid-email': 'auth.error.invalidEmail',
  'auth/user-not-found': 'auth.error.userNotFound',
  'auth/wrong-password': 'auth.error.wrongPassword',
  'auth/invalid-credential': 'auth.error.invalidCredential',
  'auth/weak-password': 'auth.error.weakPassword',
  'auth/too-many-requests': 'auth.error.tooManyRequests',
  'auth/popup-closed-by-user': 'auth.error.popupClosed',
  'auth/network-request-failed': 'auth.error.network',
};

export function AuthProvider({ children }) {
  const t = useT();
  const { update: updateSettings } = useSettings();
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out
  const [authError, setAuthError] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        try {
          if (u) localStorage.setItem('qlct:session', '1');
          else localStorage.removeItem('qlct:session');
        } catch {
          /* storage unavailable */
        }
        setUser(u);
      }),
    [],
  );

  const mapError = useCallback((code) => t(AUTH_ERRORS[code] || 'auth.error.generic'), [t]);

  // Firestore is loaded lazily - the login screen doesn't need it.
  const ensureUserDoc = useCallback(async (u) => {
    if (!u) return;
    try {
      const [{ doc, setDoc, serverTimestamp }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../firestore'),
      ]);
      await setDoc(
        doc(db, 'users', u.uid),
        {
          email: u.email,
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch {
      /* profile doc is best-effort */
    }
  }, []);

  const wrap = useCallback(
    async (fn) => {
      setAuthError(null);
      try {
        return { success: true, user: await fn() };
      } catch (err) {
        const msg = mapError(err.code);
        setAuthError(msg);
        return { success: false, error: msg };
      }
    },
    [mapError],
  );

  const register = useCallback(
    (name, email, password) =>
      wrap(async () => {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await ensureUserDoc({ ...cred.user, displayName: name?.trim() });
        return cred.user;
      }),
    [wrap, ensureUserDoc],
  );

  const login = useCallback(
    (email, password) => wrap(async () => (await signInWithEmailAndPassword(auth, email.trim(), password)).user),
    [wrap],
  );

  const loginWithGoogle = useCallback(
    () =>
      wrap(async () => {
        const cred = await signInWithPopup(auth, googleProvider);
        await ensureUserDoc(cred.user);
        return cred.user;
      }),
    [wrap, ensureUserDoc],
  );

  const logout = useCallback(() => {
    // Page filters live in sessionStorage; don't leak them to the next account.
    try {
      Object.keys(window.sessionStorage)
        .filter((k) => k.startsWith('qlct:s:'))
        .forEach((k) => window.sessionStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    // Stop this device's daily reminder: nobody else should get it after sign-out.
    const uid = auth.currentUser?.uid;
    updateSettings({ reminder: { ...DEFAULT_REMINDER } });
    const cleanup = Promise.allSettled([removeServerReminder(uid), syncWorkerConfig({ enabled: false })]);
    const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
    return Promise.race([cleanup, timeout]).then(() => signOut(auth));
  }, [updateSettings]);

  const resetPassword = useCallback(
    async (email) => {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        return { success: true };
      } catch (err) {
        return { success: false, error: mapError(err.code) };
      }
    },
    [mapError],
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      try {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, newPassword);
        return { success: true };
      } catch (err) {
        return { success: false, error: mapError(err.code) };
      }
    },
    [mapError],
  );

  const value = useMemo(
    () => ({
      user,
      loading: user === undefined,
      authError,
      register,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      changePassword,
    }),
    [user, authError, register, login, loginWithGoogle, logout, resetPassword, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

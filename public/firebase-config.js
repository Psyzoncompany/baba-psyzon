import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  getIdTokenResult,
  linkWithCredential,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import { auth } from './js/firebase-init.js';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

const nativeLocalStorage = window.localStorage;
const accountStorageKeys = new Set([
  'psyzon_baba_state_v1',
  'psyzon_baba_mode',
  'psyzon_baba_last_view',
  'psyzon_baba_theme',
]);
const babaAccountId = () => String(
  auth.currentUser?.uid || window.BabaAccessRepository?.currentAccountId?.() || '',
).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
const scopedStorageKey = (key) => {
  if (!accountStorageKeys.has(key)) return key;
  const accountId = babaAccountId();
  if (!accountId) return key;
  const scopedKey = `${key}:${accountId}`;
  if (nativeLocalStorage.getItem(scopedKey) == null && nativeLocalStorage.getItem(key) != null) {
    const claimKey = 'psyzon_baba_legacy_storage_owner';
    const claimedBy = nativeLocalStorage.getItem(claimKey);
    if (!claimedBy || claimedBy === accountId) {
      nativeLocalStorage.setItem(scopedKey, nativeLocalStorage.getItem(key));
      nativeLocalStorage.setItem(claimKey, accountId);
    }
  }
  return scopedKey;
};

nativeLocalStorage.removeItem('forceLocalMode');
window.isLocalMode = false;
window.__nativeLS = nativeLocalStorage;
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => nativeLocalStorage.getItem(scopedStorageKey(key)),
    setItem: (key, value) => nativeLocalStorage.setItem(scopedStorageKey(key), String(value)),
    removeItem: (key) => nativeLocalStorage.removeItem(scopedStorageKey(key)),
    clear: () => nativeLocalStorage.clear(),
    key: (index) => nativeLocalStorage.key(index),
    get length() { return nativeLocalStorage.length; },
  },
});

const authPersistenceReady = setPersistence(auth, browserLocalPersistence);
const hasLinkedProvider = (user, providerId) => Boolean(
  user?.providerData?.some((provider) => provider.providerId === providerId),
);
const isGoogleLinkedUser = (user) => hasLinkedProvider(user, GoogleAuthProvider.PROVIDER_ID);

let resolveInitialAuthState;
const initialAuthStateReady = new Promise((resolve) => {
  resolveInitialAuthState = resolve;
});

const requireGoogleOwnerSession = async () => {
  const user = auth.currentUser;
  if (!user || !isGoogleLinkedUser(user)) {
    const error = new Error('Entre com a conta Google proprietaria para criar ou trocar o acesso da comissao.');
    error.code = 'auth/google-owner-required';
    throw error;
  }
  const token = await getIdTokenResult(user, true);
  if (token?.signInProvider !== GoogleAuthProvider.PROVIDER_ID) {
    const error = new Error('Por seguranca, entre novamente com o Google para alterar o acesso da comissao.');
    error.code = 'auth/requires-google-reauth';
    throw error;
  }
  return user;
};

window.firebaseAuth = {
  loginWithGoogle: async () => {
    await authPersistenceReady;
    return signInWithPopup(auth, googleProvider);
  },
  loginWithEmailPassword: async (email, password) => {
    await authPersistenceReady;
    return signInWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
  },
  saveCommissionLogin: async (email, password) => {
    await authPersistenceReady;
    const user = await requireGoogleOwnerSession();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    if (!normalizedEmail || normalizedEmail !== String(user.email || '').trim().toLowerCase()) {
      const error = new Error('O login deve usar o mesmo e-mail exibido na conta Google.');
      error.code = 'auth/email-mismatch';
      throw error;
    }
    if (normalizedPassword.length < 8) {
      const error = new Error('Crie uma senha com pelo menos 8 caracteres.');
      error.code = 'auth/weak-password';
      throw error;
    }
    if (hasLinkedProvider(user, EmailAuthProvider.PROVIDER_ID)) {
      await updatePassword(user, normalizedPassword);
      return { user, created: false };
    }
    const credential = EmailAuthProvider.credential(normalizedEmail, normalizedPassword);
    const result = await linkWithCredential(user, credential);
    return { ...result, created: true };
  },
  accountAccessInfo: async () => {
    const user = auth.currentUser;
    if (!user || !isGoogleLinkedUser(user)) return { email: '', hasPassword: false, canManage: false };
    const token = await getIdTokenResult(user);
    return {
      email: user.email || '',
      hasPassword: hasLinkedProvider(user, EmailAuthProvider.PROVIDER_ID),
      canManage: token?.signInProvider === GoogleAuthProvider.PROVIDER_ID,
    };
  },
  logout: () => signOut(auth),
  waitUntilReady: () => initialAuthStateReady,
  currentUser: () => auth.currentUser,
};

let initialAuthStateResolved = false;
onAuthStateChanged(auth, async (user) => {
  if (!initialAuthStateResolved) {
    initialAuthStateResolved = true;
    resolveInitialAuthState(user || null);
  }
  if (user && !isGoogleLinkedUser(user)) {
    const detail = {
      code: 'auth/google-login-required',
      message: 'Este acesso nao esta vinculado a uma conta Google organizadora.',
    };
    window.firebaseAuthLastError = detail;
    window.dispatchEvent(new CustomEvent('firebase-auth-error', { detail }));
    await signOut(auth);
    return;
  }
  window.BackendInitialized = true;
  window.dispatchEvent(new CustomEvent('firebase-auth-state', {
    detail: { user: user || null, authenticated: Boolean(user) },
  }));
  window.dispatchEvent(new CustomEvent('backend-ready'));
});

import { auth, db } from './js/firebase-init.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const PLAYER_ACCESS_KEY = 'psyzon_baba_player_access_v1';
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const CODE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;
let verifiedAccountId = '';

function nativeStorage() {
  return window.__nativeLS || window.localStorage;
}

function playerAccessStorageKey(accountId = auth.currentUser?.uid) {
  const normalizedAccountId = safeAccountId(accountId);
  return normalizedAccountId ? `${PLAYER_ACCESS_KEY}:${normalizedAccountId}` : PLAYER_ACCESS_KEY;
}

function safeAccountId(value) {
  return String(value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

function accessConfigRef(accountId) {
  return doc(db, 'baba_access_config', safeAccountId(accountId));
}

function accessCodeRef(codeHash) {
  return doc(db, 'baba_access_codes', codeHash);
}

function readSavedAccess() {
  try {
    return JSON.parse(nativeStorage().getItem(playerAccessStorageKey()) || 'null');
  } catch (error) {
    return null;
  }
}

function saveAccess(code, accountId) {
  verifiedAccountId = safeAccountId(accountId);
  nativeStorage().setItem(playerAccessStorageKey(accountId), JSON.stringify({
    code: formatCode(code),
    accountId: verifiedAccountId,
    verifiedAtMs: Date.now(),
  }));
  window.dispatchEvent(new CustomEvent('baba-account-changed', { detail: { accountId: verifiedAccountId } }));
}

function normalizeCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

function formatCode(value) {
  const code = normalizeCode(value);
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

async function hashCode(value) {
  const bytes = new TextEncoder().encode(normalizeCode(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('');
}

function createCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

async function generatePlayerCode() {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre com o Google para gerar o código dos jogadores.');
  const accountId = safeAccountId(user.uid);
  const code = createCode();
  const codeHash = await hashCode(code);
  const timestamp = Date.now();
  const batch = writeBatch(db);
  const configRef = accessConfigRef(accountId);
  const previousConfig = await getDoc(configRef);
  const previousHash = previousConfig.data()?.currentCodeHash;
  if (previousHash && previousHash !== codeHash) {
    batch.set(accessCodeRef(previousHash), {
      accountId,
      active: false,
      revokedAtMs: timestamp,
      updatedAtMs: timestamp,
      schemaVersion: 1,
    }, { merge: true });
  }
  batch.set(configRef, {
    currentCodeHash: codeHash,
    active: true,
    expiresAtMs: timestamp + CODE_LIFETIME_MS,
    updatedAtMs: timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    updatedByEmail: user.email || '',
    schemaVersion: 1,
  });
  batch.set(accessCodeRef(codeHash), {
    accountId,
    active: true,
    expiresAtMs: timestamp + CODE_LIFETIME_MS,
    createdAtMs: timestamp,
    updatedAtMs: timestamp,
    schemaVersion: 1,
  });
  await batch.commit();
  saveAccess(code, accountId);
  return { code: formatCode(code), accountId, expiresAtMs: timestamp + CODE_LIFETIME_MS };
}

async function verifyPlayerCode(value, { remember = true } = {}) {
  const code = normalizeCode(value);
  if (code.length !== CODE_LENGTH) return { valid: false, reason: 'Digite o código completo de 8 caracteres.' };
  const codeHash = await hashCode(code);
  const snapshot = await getDoc(accessCodeRef(codeHash));
  if (!snapshot.exists()) return { valid: false, reason: 'O organizador ainda não gerou um código para jogadores.' };
  const config = snapshot.data() || {};
  const valid = config.active === true
    && Boolean(safeAccountId(config.accountId))
    && Number(config.expiresAtMs || 0) > Date.now();
  if (!valid) return { valid: false, reason: 'Código inválido, revogado ou expirado.' };
  if (remember) saveAccess(code, config.accountId);
  else {
    verifiedAccountId = safeAccountId(config.accountId);
    window.dispatchEvent(new CustomEvent('baba-account-changed', { detail: { accountId: verifiedAccountId } }));
  }
  return { valid: true, code: formatCode(code), accountId: safeAccountId(config.accountId), expiresAtMs: config.expiresAtMs };
}

async function restorePlayerAccess() {
  try {
    const saved = readSavedAccess();
    if (!saved?.code) return { valid: false, reason: 'Nenhum código salvo neste dispositivo.' };
    return verifyPlayerCode(saved.code, { remember: true });
  } catch (error) {
    nativeStorage().removeItem(PLAYER_ACCESS_KEY);
    return { valid: false, reason: 'O código salvo não é mais válido.' };
  }
}

function clearPlayerAccess() {
  verifiedAccountId = '';
  nativeStorage().removeItem(playerAccessStorageKey());
}

function getSavedPlayerCode() {
  const saved = readSavedAccess();
  return saved?.code ? formatCode(saved.code) : '';
}

function currentAccountId() {
  return safeAccountId(auth.currentUser?.uid || verifiedAccountId);
}

verifiedAccountId = safeAccountId(readSavedAccess()?.accountId);

window.BabaAccessRepository = Object.freeze({
  generatePlayerCode,
  verifyPlayerCode,
  restorePlayerAccess,
  clearPlayerAccess,
  getSavedPlayerCode,
  currentAccountId,
  normalizeCode,
  formatCode,
});
window.dispatchEvent(new CustomEvent('baba-access-ready'));

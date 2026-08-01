import { auth, db } from './js/firebase-init.js';
import {
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const ACCESS_CONFIG_REF = doc(db, 'baba_access_config', 'player');
const PLAYER_ACCESS_KEY = 'psyzon_baba_player_access_v1';
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const CODE_LIFETIME_MS = 365 * 24 * 60 * 60 * 1000;

function nativeStorage() {
  return window.__nativeLS || window.localStorage;
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
  const code = createCode();
  const codeHash = await hashCode(code);
  const timestamp = Date.now();
  const batch = writeBatch(db);
  batch.set(ACCESS_CONFIG_REF, {
    currentCodeHash: codeHash,
    active: true,
    expiresAtMs: timestamp + CODE_LIFETIME_MS,
    updatedAtMs: timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
    updatedByEmail: user.email || '',
    schemaVersion: 1,
  });
  await batch.commit();
  nativeStorage().setItem(PLAYER_ACCESS_KEY, JSON.stringify({ code: formatCode(code), verifiedAtMs: timestamp }));
  return { code: formatCode(code), expiresAtMs: timestamp + CODE_LIFETIME_MS };
}

async function verifyPlayerCode(value, { remember = true } = {}) {
  const code = normalizeCode(value);
  if (code.length !== CODE_LENGTH) return { valid: false, reason: 'Digite o código completo de 8 caracteres.' };
  const snapshot = await getDoc(ACCESS_CONFIG_REF);
  if (!snapshot.exists()) return { valid: false, reason: 'O organizador ainda não gerou um código para jogadores.' };
  const config = snapshot.data() || {};
  const codeHash = await hashCode(code);
  const valid = config.active === true
    && config.currentCodeHash === codeHash
    && Number(config.expiresAtMs || 0) > Date.now();
  if (!valid) return { valid: false, reason: 'Código inválido, revogado ou expirado.' };
  if (remember) nativeStorage().setItem(PLAYER_ACCESS_KEY, JSON.stringify({ code: formatCode(code), verifiedAtMs: Date.now() }));
  return { valid: true, code: formatCode(code), expiresAtMs: config.expiresAtMs };
}

async function restorePlayerAccess() {
  try {
    const saved = JSON.parse(nativeStorage().getItem(PLAYER_ACCESS_KEY) || 'null');
    if (!saved?.code) return { valid: false, reason: 'Nenhum código salvo neste dispositivo.' };
    return verifyPlayerCode(saved.code, { remember: true });
  } catch (error) {
    nativeStorage().removeItem(PLAYER_ACCESS_KEY);
    return { valid: false, reason: 'O código salvo não é mais válido.' };
  }
}

function clearPlayerAccess() {
  nativeStorage().removeItem(PLAYER_ACCESS_KEY);
}

function getSavedPlayerCode() {
  try {
    const saved = JSON.parse(nativeStorage().getItem(PLAYER_ACCESS_KEY) || 'null');
    return saved?.code ? formatCode(saved.code) : '';
  } catch (error) {
    return '';
  }
}

window.BabaAccessRepository = Object.freeze({
  generatePlayerCode,
  verifyPlayerCode,
  restorePlayerAccess,
  clearPlayerAccess,
  getSavedPlayerCode,
  normalizeCode,
  formatCode,
});
window.dispatchEvent(new CustomEvent('baba-access-ready'));

import { createHash, randomBytes } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));

// Permite iniciar pelo diretório public/ ou pela raiz do repositório.
dotenv.config({ path: resolve(here, '..', '.env'), quiet: true });
dotenv.config({ path: resolve(here, '..', '..', '.env'), quiet: true });

function booleanFromEnv(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'sim', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function integerFromEnv(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeAccountId(value) {
  const normalized = String(value || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(normalized)) {
    throw new Error('BABA_ACCOUNT_UID ausente ou inválido. Informe o UID da conta proprietária do Baba.');
  }
  return normalized;
}

function safeAccountAlias(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(normalized)) {
    throw new Error('Apelido de conta MCP inválido. Use letras minúsculas, números, _ ou -.');
  }
  return normalized;
}

function parseMcpAccounts(value, fallbackUid = '') {
  const raw = String(value || '').trim();
  if (!raw) return Object.freeze([{ alias: 'principal', uid: safeAccountId(fallbackUid) }]);
  const entries = raw.split(',').map((item) => item.trim()).filter(Boolean);
  if (!entries.length || entries.length > 20) throw new Error('BABA_MCP_ACCOUNTS deve conter entre 1 e 20 contas.');
  const aliases = new Set();
  const uids = new Set();
  const accounts = entries.map((entry) => {
    const separator = entry.indexOf(':');
    if (separator < 1 || separator === entry.length - 1) {
      throw new Error('BABA_MCP_ACCOUNTS deve usar o formato apelido:UID,apelido:UID.');
    }
    const alias = safeAccountAlias(entry.slice(0, separator));
    const uid = safeAccountId(entry.slice(separator + 1));
    if (aliases.has(alias)) throw new Error(`Apelido de conta MCP duplicado: ${alias}.`);
    if (uids.has(uid)) throw new Error(`UID de conta MCP duplicado no apelido ${alias}.`);
    aliases.add(alias);
    uids.add(uid);
    return Object.freeze({ alias, uid });
  });
  return Object.freeze(accounts);
}

export function loadMcpConfig({ transport = 'stdio' } = {}) {
  const accounts = parseMcpAccounts(process.env.BABA_MCP_ACCOUNTS, process.env.BABA_ACCOUNT_UID);
  const accountId = accounts[0].uid;
  const accountSetId = accounts.length === 1
    ? accountId
    : `multi_${createHash('sha256').update(accounts.map(({ uid }) => uid).sort().join('\n')).digest('hex').slice(0, 32)}`;
  const oauthLedgerAccountId = accounts.map(({ uid }) => uid).sort()[0];
  const accessToken = String(process.env.BABA_MCP_ACCESS_TOKEN || '').trim();
  if (transport === 'http' && accessToken.length < 32) {
    throw new Error('BABA_MCP_ACCESS_TOKEN deve ter pelo menos 32 caracteres no modo HTTP.');
  }

  const host = String(process.env.BABA_MCP_HOST || '127.0.0.1').trim();
  const port = integerFromEnv(process.env.BABA_MCP_PORT, 3001);
  const allowedHosts = String(process.env.BABA_MCP_ALLOWED_HOSTS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (port < 0 || port > 65_535) throw new Error('BABA_MCP_PORT precisa estar entre 0 e 65535.');
  if (transport === 'http' && !['127.0.0.1', 'localhost', '::1'].includes(host) && !allowedHosts.length) {
    throw new Error('Ao expor o MCP fora do computador local, configure BABA_MCP_ALLOWED_HOSTS.');
  }

  const confirmationSecret = String(
    process.env.BABA_MCP_CONFIRMATION_SECRET
      || accessToken
      || process.env.BABA_MCP_OAUTH_SECRET
      || '',
  ).trim();
  const writesEnabled = booleanFromEnv(process.env.BABA_MCP_WRITE_ENABLED, false);
  if (writesEnabled && confirmationSecret.length < 32) {
    throw new Error('BABA_MCP_CONFIRMATION_SECRET deve ter pelo menos 32 caracteres quando escritas estiverem ativadas.');
  }

  return Object.freeze({
    accountId,
    accountSetId,
    oauthLedgerAccountId,
    accounts,
    projectId: String(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '').trim(),
    writesEnabled,
    accessToken,
    confirmationSecret: confirmationSecret || randomBytes(32).toString('hex'),
    host,
    port,
    allowedHosts,
    transport,
  });
}

export { booleanFromEnv, parseMcpAccounts, safeAccountAlias, safeAccountId };

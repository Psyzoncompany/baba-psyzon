import { randomBytes } from 'node:crypto';
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

export function loadMcpConfig({ transport = 'stdio' } = {}) {
  const accountId = safeAccountId(process.env.BABA_ACCOUNT_UID);
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

  return Object.freeze({
    accountId,
    projectId: String(process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '').trim(),
    writesEnabled: booleanFromEnv(process.env.BABA_MCP_WRITE_ENABLED, false),
    accessToken,
    confirmationSecret: String(process.env.BABA_MCP_CONFIRMATION_SECRET || accessToken || randomBytes(32).toString('hex')),
    host,
    port,
    allowedHosts,
    transport,
  });
}

export { booleanFromEnv, safeAccountId };

import { createHmac, timingSafeEqual } from 'node:crypto';

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function encoded(value) {
  return Buffer.from(JSON.stringify(stableValue(value))).toString('base64url');
}

function signature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createConfirmation(change, secret, ttlMs = 5 * 60_000) {
  const payload = encoded({ ...change, expiresAtMs: Date.now() + ttlMs });
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyConfirmation(token, expectedChange, secret) {
  const [payload, receivedSignature, extra] = String(token || '').split('.');
  if (!payload || !receivedSignature || extra) throw new Error('Confirmação de alteração inválida.');
  const expectedSignature = signature(payload, secret);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error('A assinatura da confirmação não é válida.');
  }
  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('A confirmação não pôde ser lida.');
  }
  if (Number(decoded.expiresAtMs || 0) < Date.now()) throw new Error('A confirmação expirou; gere uma nova prévia.');
  const { expiresAtMs: _expiresAtMs, ...confirmedChange } = decoded;
  if (encoded(confirmedChange) !== encoded(expectedChange)) {
    throw new Error('Os dados mudaram depois da prévia; gere uma nova confirmação.');
  }
  return true;
}

export { stableValue };

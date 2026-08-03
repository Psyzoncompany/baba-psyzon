import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export const READ_SCOPE = 'baba.read';
export const WRITE_SCOPE = 'baba.write';
const ALLOWED_SCOPES = new Set([READ_SCOPE, WRITE_SCOPE]);
const DEFAULT_PUBLIC_URL = 'https://sitey-caixa.vercel.app';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function publicBaseUrl() {
  const configured = String(process.env.BABA_MCP_PUBLIC_URL || DEFAULT_PUBLIC_URL).trim();
  const parsed = new URL(configured);
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('BABA_MCP_PUBLIC_URL precisa usar HTTPS.');
  }
  return parsed.origin;
}

export function resourceUrl() {
  return `${publicBaseUrl()}/mcp`;
}

export function oauthSecret() {
  const secret = String(process.env.BABA_MCP_OAUTH_SECRET || '').trim();
  if (secret.length < 32) throw new Error('BABA_MCP_OAUTH_SECRET deve ter pelo menos 32 caracteres.');
  return secret;
}

export function authorizationPassword() {
  const password = String(process.env.BABA_MCP_OAUTH_PASSWORD || '');
  if (password.length < 12) throw new Error('BABA_MCP_OAUTH_PASSWORD deve ter pelo menos 12 caracteres.');
  return password;
}

export function signToken(payload, secret = oauthSecret()) {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token, expectedType, secret = oauthSecret(), now = Date.now()) {
  const [body, signature, extra] = String(token || '').split('.');
  if (!body || !signature || extra) throw new Error('Token inválido.');
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) throw new Error('Assinatura de token inválida.');
  let payload;
  try {
    payload = JSON.parse(fromBase64url(body));
  } catch {
    throw new Error('Conteúdo de token inválido.');
  }
  if (payload.type !== expectedType) throw new Error('Tipo de token inválido.');
  if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now) throw new Error('Token expirado.');
  return payload;
}

function newPayload(type, lifetimeSeconds, values = {}, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  return {
    type,
    ...values,
    iat: issuedAt,
    exp: issuedAt + lifetimeSeconds,
    jti: randomBytes(18).toString('base64url'),
  };
}

function validRedirectUri(value) {
  try {
    const url = new URL(value);
    if (url.hash) return false;
    return url.protocol === 'https:'
      || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  } catch {
    return false;
  }
}

export function registerClient(metadata, { secret = oauthSecret(), now = Date.now() } = {}) {
  const redirectUris = Array.isArray(metadata?.redirect_uris) ? metadata.redirect_uris : [];
  if (redirectUris.length < 1 || redirectUris.length > 10 || !redirectUris.every(validRedirectUri)) {
    throw new OAuthError('invalid_redirect_uri', 'Informe de 1 a 10 redirect_uris HTTPS válidas.');
  }
  const method = metadata.token_endpoint_auth_method || 'none';
  if (!['none', 'client_secret_post', 'client_secret_basic'].includes(method)) {
    throw new OAuthError('invalid_client_metadata', 'token_endpoint_auth_method não suportado.');
  }
  const clientData = {
    type: 'client',
    redirectUris,
    method,
    clientName: String(metadata.client_name || 'Cliente MCP').slice(0, 120),
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 365 * 24 * 60 * 60,
  };
  const clientId = `baba_${signToken(clientData, secret)}`;
  const result = {
    client_id: clientId,
    client_id_issued_at: clientData.iat,
    client_id_expires_at: clientData.exp,
    redirect_uris: redirectUris,
    client_name: clientData.clientName,
    token_endpoint_auth_method: method,
    grant_types: clientData.grantTypes,
    response_types: clientData.responseTypes,
  };
  if (method !== 'none') {
    result.client_secret = signToken(newPayload('client_secret', 365 * 24 * 60 * 60, {
      clientIdHash: createHash('sha256').update(clientId).digest('base64url'),
    }, now), secret);
    result.client_secret_expires_at = clientData.exp;
  }
  return result;
}

export function verifyClientId(clientId, secret = oauthSecret()) {
  if (!String(clientId || '').startsWith('baba_')) throw new OAuthError('invalid_client', 'client_id inválido.', 401);
  try {
    return verifyToken(String(clientId).slice(5), 'client', secret);
  } catch {
    throw new OAuthError('invalid_client', 'client_id inválido ou expirado.', 401);
  }
}

export function parseScopes(value, { writesEnabled = false } = {}) {
  const requested = String(value || READ_SCOPE).trim().split(/\s+/).filter(Boolean);
  if (!requested.length || requested.some((scope) => !ALLOWED_SCOPES.has(scope))) {
    throw new OAuthError('invalid_scope', 'Escopo solicitado não é permitido.');
  }
  if (requested.includes(WRITE_SCOPE) && !writesEnabled) {
    throw new OAuthError('invalid_scope', 'A escrita está desativada neste servidor.');
  }
  return [...new Set(requested)];
}

export function createAuthorizationRequest(params, options = {}) {
  const secret = options.secret || oauthSecret();
  const client = verifyClientId(params.client_id, secret);
  if (params.response_type !== 'code') throw new OAuthError('unsupported_response_type', 'Use response_type=code.');
  if (!client.redirectUris.includes(params.redirect_uri)) {
    throw new OAuthError('invalid_request', 'redirect_uri não corresponde ao cliente registrado.');
  }
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(String(params.code_challenge || '')) || params.code_challenge_method !== 'S256') {
    throw new OAuthError('invalid_request', 'PKCE com code_challenge_method=S256 é obrigatório.');
  }
  if (params.resource && params.resource !== resourceUrl()) {
    throw new OAuthError('invalid_target', 'O recurso solicitado não corresponde a este servidor MCP.');
  }
  const scopes = parseScopes(params.scope, options);
  return {
    client,
    requestToken: signToken(newPayload('auth_request', 10 * 60, {
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      codeChallenge: params.code_challenge,
      scopes,
      state: params.state || '',
      resource: resourceUrl(),
    }, options.now), secret),
  };
}

export function approveAuthorization(requestToken, password, options = {}) {
  const secret = options.secret || oauthSecret();
  const request = verifyToken(requestToken, 'auth_request', secret, options.now);
  const expectedPassword = options.password ?? authorizationPassword();
  if (!safeEqual(password, expectedPassword)) throw new OAuthError('access_denied', 'Senha de autorização incorreta.', 401);
  const code = signToken(newPayload('authorization_code', 5 * 60, {
    clientId: request.clientId,
    redirectUri: request.redirectUri,
    codeChallenge: request.codeChallenge,
    scopes: request.scopes,
    resource: request.resource,
  }, options.now), secret);
  return { request, code };
}

export function verifyClientAuthentication(clientId, clientSecret, secret = oauthSecret()) {
  const client = verifyClientId(clientId, secret);
  if (client.method === 'none') return client;
  let credentials;
  try {
    credentials = verifyToken(clientSecret, 'client_secret', secret);
  } catch {
    throw new OAuthError('invalid_client', 'Credenciais do cliente inválidas.', 401);
  }
  const expectedHash = createHash('sha256').update(clientId).digest('base64url');
  if (!safeEqual(credentials.clientIdHash, expectedHash)) {
    throw new OAuthError('invalid_client', 'Credenciais do cliente inválidas.', 401);
  }
  return client;
}

function issueTokens({ clientId, scopes, accountId, secret, now }) {
  const common = { clientId, scopes, accountId, resource: resourceUrl() };
  return {
    access_token: signToken(newPayload('access_token', 60 * 60, common, now), secret),
    token_type: 'Bearer',
    expires_in: 60 * 60,
    scope: scopes.join(' '),
    refresh_token: signToken(newPayload('refresh_token', 30 * 24 * 60 * 60, common, now), secret),
  };
}

export async function exchangeAuthorizationCode(params, options = {}) {
  const secret = options.secret || oauthSecret();
  const code = verifyToken(params.code, 'authorization_code', secret, options.now);
  verifyClientAuthentication(params.clientId, params.clientSecret, secret);
  if (code.clientId !== params.clientId || code.redirectUri !== params.redirectUri) {
    throw new OAuthError('invalid_grant', 'Código não pertence a este cliente ou redirect_uri.', 400);
  }
  const verifier = String(params.codeVerifier || '');
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) throw new OAuthError('invalid_grant', 'code_verifier inválido.');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  if (!safeEqual(challenge, code.codeChallenge)) throw new OAuthError('invalid_grant', 'code_verifier inválido.');
  if (options.consume) await options.consume('authorization_code', code.jti, code.exp);
  return issueTokens({ clientId: code.clientId, scopes: code.scopes, accountId: options.accountId, secret, now: options.now });
}

export async function exchangeRefreshToken(params, options = {}) {
  const secret = options.secret || oauthSecret();
  const refresh = verifyToken(params.refreshToken, 'refresh_token', secret, options.now);
  verifyClientAuthentication(params.clientId, params.clientSecret, secret);
  if (refresh.clientId !== params.clientId) throw new OAuthError('invalid_grant', 'Refresh token não pertence ao cliente.');
  if (options.consume) await options.consume('refresh_token', refresh.jti, refresh.exp);
  return issueTokens({ clientId: refresh.clientId, scopes: refresh.scopes, accountId: refresh.accountId, secret, now: options.now });
}

export function verifyAccessToken(token, options = {}) {
  const payload = verifyToken(token, 'access_token', options.secret || oauthSecret(), options.now);
  if (payload.resource !== resourceUrl()) throw new Error('Token emitido para outro recurso.');
  if (options.accountId && payload.accountId !== options.accountId) throw new Error('Token emitido para outra conta.');
  return payload;
}

export class OAuthError extends Error {
  constructor(code, description, status = 400) {
    super(description);
    this.name = 'OAuthError';
    this.code = code;
    this.status = status;
  }
}

export function oauthErrorResponse(error) {
  const oauthError = error instanceof OAuthError
    ? error
    : new OAuthError('server_error', error instanceof Error ? error.message : String(error), 500);
  return Response.json({ error: oauthError.code, error_description: oauthError.message }, {
    status: oauthError.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function protectedResourceMetadata() {
  return {
    resource: resourceUrl(),
    authorization_servers: [publicBaseUrl()],
    bearer_methods_supported: ['header'],
    scopes_supported: [READ_SCOPE, WRITE_SCOPE],
    resource_documentation: `${publicBaseUrl()}/MCP.md`,
  };
}

export function authorizationServerMetadata() {
  const base = publicBaseUrl();
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [READ_SCOPE, WRITE_SCOPE],
    client_id_metadata_document_supported: false,
  };
}

import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  approveAuthorization,
  authorizationServerMetadata,
  createAuthorizationRequest,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  protectedResourceMetadata,
  registerClient,
  verifyAccessToken,
} from '../api/_oauth-core.mjs';

const secret = 'segredo-oauth-de-teste-com-mais-de-32-caracteres';
const password = 'senha-de-autorizacao-forte';
const redirectUri = 'https://gemini.google.com/oauth/callback';

function registration(method = 'none') {
  return registerClient({
    redirect_uris: [redirectUri],
    client_name: 'Gemini Spark',
    token_endpoint_auth_method: method,
  }, { secret });
}

test('publica metadados OAuth e do recurso protegido', () => {
  const oauth = authorizationServerMetadata();
  const resource = protectedResourceMetadata();
  assert.equal(oauth.issuer, 'https://sitey-caixa.vercel.app');
  assert.equal(oauth.registration_endpoint, 'https://sitey-caixa.vercel.app/oauth/register');
  assert.deepEqual(oauth.code_challenge_methods_supported, ['S256']);
  assert.equal(resource.resource, 'https://sitey-caixa.vercel.app/mcp');
  assert.deepEqual(resource.authorization_servers, [oauth.issuer]);
});

test('completa Authorization Code com PKCE e renova o token', async () => {
  const client = registration();
  const verifier = 'verificador-pkce-com-comprimento-suficiente-123456789';
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const pending = createAuthorizationRequest({
    client_id: client.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'estado-123',
  }, { secret });
  assert.equal(pending.client.clientName, 'Gemini Spark');

  const approval = approveAuthorization(pending.requestToken, password, { secret, password });
  assert.equal(approval.request.state, 'estado-123');

  const consumed = new Set();
  const consume = async (type, jti) => {
    const key = `${type}:${jti}`;
    if (consumed.has(key)) throw new Error('reutilizado');
    consumed.add(key);
  };
  const tokens = await exchangeAuthorizationCode({
    clientId: client.client_id,
    clientSecret: '',
    code: approval.code,
    redirectUri,
    codeVerifier: verifier,
  }, { secret, accountId: 'conta_teste', consume });

  assert.equal(tokens.token_type, 'Bearer');
  assert.equal(tokens.scope, 'baba.read');
  const access = verifyAccessToken(tokens.access_token, { secret, accountId: 'conta_teste' });
  assert.deepEqual(access.scopes, ['baba.read']);

  const refreshed = await exchangeRefreshToken({
    clientId: client.client_id,
    clientSecret: '',
    refreshToken: tokens.refresh_token,
  }, { secret, accountId: 'conta_teste', consume });
  assert.ok(refreshed.access_token);
  await assert.rejects(() => exchangeRefreshToken({
    clientId: client.client_id,
    clientSecret: '',
    refreshToken: tokens.refresh_token,
  }, { secret, accountId: 'conta_teste', consume }), /reutilizado/);
});

test('rejeita redirect URI divergente, PKCE incorreto e escrita desativada', async () => {
  const client = registration('client_secret_post');
  assert.throws(() => createAuthorizationRequest({
    client_id: client.client_id,
    redirect_uri: 'https://example.com/callback',
    response_type: 'code',
    code_challenge: 'a'.repeat(43),
    code_challenge_method: 'S256',
  }, { secret }), /redirect_uri/);

  assert.throws(() => createAuthorizationRequest({
    client_id: client.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: 'a'.repeat(43),
    code_challenge_method: 'S256',
    scope: 'baba.write',
  }, { secret, writesEnabled: false }), /escrita está desativada/i);

  const pending = createAuthorizationRequest({
    client_id: client.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    code_challenge: createHash('sha256').update('correto').digest('base64url'),
    code_challenge_method: 'S256',
  }, { secret });
  const approval = approveAuthorization(pending.requestToken, password, { secret, password });
  await assert.rejects(() => exchangeAuthorizationCode({
    clientId: client.client_id,
    clientSecret: client.client_secret,
    code: approval.code,
    redirectUri,
    codeVerifier: 'errado',
  }, { secret, accountId: 'conta_teste' }), /code_verifier/);
});

test('registro dinâmico recusa callbacks inseguros', () => {
  assert.throws(() => registerClient({ redirect_uris: ['http://example.com/callback'] }, { secret }), /redirect_uris/);
  assert.doesNotThrow(() => registerClient({ redirect_uris: ['http://localhost:4321/callback'] }, { secret }));
});

test('endpoint MCP anuncia a descoberta OAuth ao responder 401', async () => {
  const keys = ['BABA_ACCOUNT_UID', 'BABA_MCP_OAUTH_SECRET', 'BABA_MCP_WRITE_ENABLED'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    BABA_ACCOUNT_UID: 'conta_teste',
    BABA_MCP_OAUTH_SECRET: secret,
    BABA_MCP_WRITE_ENABLED: 'false',
  });
  try {
    const { POST } = await import('../api/mcp.mjs');
    const response = await POST(new Request('https://sitey-caixa.vercel.app/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    }));
    assert.equal(response.status, 401);
    assert.match(response.headers.get('www-authenticate'), /resource_metadata="https:\/\/sitey-caixa\.vercel\.app\/\.well-known\/oauth-protected-resource\/mcp"/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

import {
  OAuthError,
  exchangeAuthorizationCode,
  exchangeRefreshToken,
  oauthErrorResponse,
} from '../_oauth-core.mjs';
import { loadMcpConfig } from '../../public/mcp/config.mjs';
import { getAdminFirestore } from '../../public/mcp/firebase-admin.mjs';

function clientCredentials(request, form) {
  let clientId = String(form.get('client_id') || '');
  let clientSecret = String(form.get('client_secret') || '');
  const match = String(request.headers.get('authorization') || '').match(/^Basic\s+(.+)$/i);
  if (match) {
    try {
      const decoded = Buffer.from(match[1], 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      clientId = decodeURIComponent(separator < 0 ? decoded : decoded.slice(0, separator));
      clientSecret = decodeURIComponent(separator < 0 ? '' : decoded.slice(separator + 1));
    } catch {
      throw new OAuthError('invalid_client', 'Cabeçalho Basic inválido.', 401);
    }
  }
  if (!clientId) throw new OAuthError('invalid_client', 'client_id ausente.', 401);
  return { clientId, clientSecret };
}

function tokenConsumer(config) {
  const db = getAdminFirestore(config);
  return async (type, jti, expiresAt) => {
    try {
      await db.collection('baba_accounts').doc(config.oauthLedgerAccountId || config.accountId)
        .collection('mcp_oauth_consumed').doc(`${type}_${jti}`)
        .create({ type, consumedAt: new Date(), expiresAt: new Date(expiresAt * 1000) });
    } catch (error) {
      if (error?.code === 6 || error?.code === 'already-exists') {
        throw new OAuthError('invalid_grant', 'Token já utilizado.');
      }
      throw error;
    }
  };
}

export async function POST(request) {
  try {
    const contentType = String(request.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      throw new OAuthError('invalid_request', 'Envie application/x-www-form-urlencoded.');
    }
    const form = await request.formData();
    const credentials = clientCredentials(request, form);
    const config = loadMcpConfig({ transport: 'oauth' });
    const options = { accountId: config.accountSetId, consume: tokenConsumer(config) };
    let tokens;
    if (form.get('grant_type') === 'authorization_code') {
      tokens = await exchangeAuthorizationCode({
        ...credentials,
        code: String(form.get('code') || ''),
        redirectUri: String(form.get('redirect_uri') || ''),
        codeVerifier: String(form.get('code_verifier') || ''),
      }, options);
    } else if (form.get('grant_type') === 'refresh_token') {
      tokens = await exchangeRefreshToken({
        ...credentials,
        refreshToken: String(form.get('refresh_token') || ''),
      }, options);
    } else {
      throw new OAuthError('unsupported_grant_type', 'grant_type não suportado.');
    }
    return Response.json(tokens, { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } });
  } catch (error) {
    return oauthErrorResponse(error);
  }
}

import { randomBytes } from 'node:crypto';
import {
  OAuthError,
  approveAuthorization,
  createAuthorizationRequest,
  oauthErrorResponse,
  verifyToken,
} from '../_oauth-core.mjs';
import { booleanFromEnv } from '../../public/mcp/config.mjs';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function page({ requestToken, clientName, scopes, error = '' }) {
  const scopeLabels = scopes.map((scope) => scope === 'baba.write'
    ? 'Alterar dados após confirmação explícita'
    : 'Consultar dados do Baba');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Autorizar acesso ao Baba</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#08111f;color:#e8eef8;font:16px system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(100%,480px);background:#101c2e;border:1px solid #263954;border-radius:18px;padding:28px;box-shadow:0 20px 60px #0008}h1{font-size:25px;margin:0 0 10px}p{color:#b8c7dc;line-height:1.5}.client{color:#fff;font-weight:700}.permissions{background:#0a1525;border-radius:12px;padding:12px 16px;margin:20px 0}.permissions li{margin:8px 0}.error{color:#ffb4b4;background:#421f27;padding:10px 12px;border-radius:9px}label{display:block;margin:18px 0 7px;font-weight:650}input{width:100%;font:inherit;padding:12px;border-radius:9px;border:1px solid #3b506e;background:#08111f;color:#fff}button{width:100%;font:inherit;font-weight:750;padding:13px;margin-top:16px;border:0;border-radius:9px;background:#4b8dff;color:#06101e;cursor:pointer}.deny{background:transparent;color:#b8c7dc;border:1px solid #3b506e}small{display:block;color:#8295af;margin-top:18px;line-height:1.4}</style></head>
<body><main class="card"><h1>Autorizar acesso ao Baba</h1><p>O aplicativo <span class="client">${escapeHtml(clientName)}</span> quer se conectar ao seu servidor MCP.</p>
${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
<div class="permissions"><strong>Permissões</strong><ul>${scopeLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('')}</ul></div>
<form method="post" action="/oauth/authorize" autocomplete="off"><input type="hidden" name="request_token" value="${escapeHtml(requestToken)}"><label for="password">Senha de autorização MCP</label><input id="password" name="password" type="password" required autofocus><button name="decision" value="allow" type="submit">Autorizar conexão</button><button class="deny" name="decision" value="deny" type="submit" formnovalidate>Cancelar</button></form>
<small>Esta senha é verificada somente pelo servidor do Baba e não é enviada ao Gemini.</small></main></body></html>`;
}

function htmlResponse(html, status = 200, scriptNonce = '') {
  const scriptPolicy = scriptNonce ? `; script-src 'nonce-${scriptNonce}'` : '';
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'${scriptPolicy}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function redirectResult(redirectUri, values) {
  const target = new URL(redirectUri);
  for (const [key, value] of Object.entries(values)) if (value) target.searchParams.set(key, value);
  // Um redirect HTTP iniciado pelo POST continua sujeito a form-action em toda a cadeia
  // no Chrome. Finalizamos o POST no próprio domínio e navegamos em um novo documento.
  const nonce = randomBytes(18).toString('base64url');
  const destination = JSON.stringify(target.href).replaceAll('<', '\\u003c');
  return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conexão autorizada</title></head><body><p>Autorização concluída. Retornando ao aplicativo…</p><p><a href="${escapeHtml(target.href)}">Continuar</a></p><script nonce="${nonce}">location.replace(${destination});</script></body></html>`, 200, nonce);
}

export function GET(request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { client, requestToken } = createAuthorizationRequest(params, {
      writesEnabled: booleanFromEnv(process.env.BABA_MCP_WRITE_ENABLED, false),
    });
    return htmlResponse(page({ requestToken, clientName: client.clientName, scopes: verifyToken(requestToken, 'auth_request').scopes }));
  } catch (error) {
    return oauthErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const requestToken = String(form.get('request_token') || '');
    const pending = verifyToken(requestToken, 'auth_request');
    if (form.get('decision') === 'deny') {
      return redirectResult(pending.redirectUri, { error: 'access_denied', state: pending.state });
    }
    try {
      const approved = approveAuthorization(requestToken, String(form.get('password') || ''));
      return redirectResult(approved.request.redirectUri, { code: approved.code, state: approved.request.state });
    } catch (error) {
      if (error instanceof OAuthError && error.code === 'access_denied') {
        const client = verifyToken(String(pending.clientId).slice(5), 'client');
        return htmlResponse(page({ requestToken, clientName: client.clientName, scopes: pending.scopes, error: error.message }), 401);
      }
      throw error;
    }
  } catch (error) {
    return oauthErrorResponse(error);
  }
}

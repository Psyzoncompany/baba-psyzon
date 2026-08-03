import { createMcpHandler } from 'mcp-handler';
import { loadMcpConfig } from '../public/mcp/config.mjs';
import { registerBabaCapabilities } from '../public/mcp/server.mjs';
import { protectedResourceMetadata, verifyAccessToken } from './_oauth-core.mjs';

const cachedRoutes = new Map();

function routeState(allowWrites) {
  const cacheKey = allowWrites ? 'write' : 'read';
  if (cachedRoutes.has(cacheKey)) return cachedRoutes.get(cacheKey);
  const baseConfig = loadMcpConfig({ transport: 'oauth' });
  const config = Object.freeze({ ...baseConfig, writesEnabled: baseConfig.writesEnabled && allowWrites });
  const handler = createMcpHandler((server) => {
    registerBabaCapabilities(server, { config });
  }, {
    serverInfo: { name: 'sitey-caixa-baba', version: '1.0.0' },
    instructions: 'Servidor do Baba. Faça leituras antes de alterar dados. Escritas exigem prévia, confirmação humana e o token assinado retornado pela ferramenta de preparação.',
  });
  const state = { config, handler };
  cachedRoutes.set(cacheKey, state);
  return state;
}

async function route(request) {
  let baseConfig;
  try {
    baseConfig = loadMcpConfig({ transport: 'oauth' });
  } catch (error) {
    return Response.json({
      error: `MCP não configurado no servidor: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 503 });
  }

  const match = String(request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  let access;
  try {
    if (!match) throw new Error('Token ausente.');
    access = verifyAccessToken(match[1], { accountId: baseConfig.accountId });
  } catch {
    const metadataUrl = `${new URL(protectedResourceMetadata().resource).origin}/.well-known/oauth-protected-resource/mcp`;
    return Response.json({ error: 'Token OAuth ausente, inválido ou expirado.' }, {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer realm="sitey-caixa-baba-mcp", resource_metadata="${metadataUrl}"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  const state = routeState(access.scopes.includes('baba.write'));
  return state.handler(request);
}

export { route as GET, route as POST, route as DELETE };

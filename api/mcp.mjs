import { timingSafeEqual } from 'node:crypto';
import { createMcpHandler } from 'mcp-handler';
import { loadMcpConfig } from '../public/mcp/config.mjs';
import { registerBabaCapabilities } from '../public/mcp/server.mjs';

let cachedRoute = null;

function tokenMatches(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function routeState() {
  if (cachedRoute) return cachedRoute;
  const config = loadMcpConfig({ transport: 'http' });
  const handler = createMcpHandler((server) => {
    registerBabaCapabilities(server, { config });
  }, {
    serverInfo: { name: 'sitey-caixa-baba', version: '1.0.0' },
    instructions: 'Servidor do Baba. Faça leituras antes de alterar dados. Escritas exigem prévia, confirmação humana e o token assinado retornado pela ferramenta de preparação.',
  });
  cachedRoute = { config, handler };
  return cachedRoute;
}

async function route(request) {
  let state;
  try {
    state = routeState();
  } catch (error) {
    return Response.json({
      error: `MCP não configurado no servidor: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 503 });
  }

  const match = String(request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match || !tokenMatches(match[1], state.config.accessToken)) {
    return Response.json({ error: 'Token MCP ausente ou inválido.' }, {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer realm="sitey-caixa-baba-mcp"' },
    });
  }
  return state.handler(request);
}

export { route as GET, route as POST, route as DELETE };

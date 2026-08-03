import { timingSafeEqual } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'mcp-handler';
// @ts-expect-error Os módulos MCP do servidor são JavaScript ESM e executam somente no runtime Node.
import { loadMcpConfig } from '../../mcp/config.mjs';
// @ts-expect-error Os módulos MCP do servidor são JavaScript ESM e executam somente no runtime Node.
import { registerBabaCapabilities } from '../../mcp/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteState = {
  config: { accessToken: string };
  handler: (request: Request) => Promise<Response>;
};

let cachedRoute: RouteState | null = null;

function tokenMatches(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function routeState(): RouteState {
  if (cachedRoute) return cachedRoute;
  const config = loadMcpConfig({ transport: 'http' });
  const handler = createMcpHandler((server: McpServer) => {
    registerBabaCapabilities(server, { config });
  }, {
    serverInfo: { name: 'sitey-caixa-baba', version: '1.0.0' },
    instructions: 'Servidor do Baba. Faça leituras antes de alterar dados. Escritas exigem prévia, confirmação humana e o token assinado retornado pela ferramenta de preparação.',
  });
  cachedRoute = { config, handler };
  return cachedRoute;
}

async function route(request: Request) {
  let state: RouteState;
  try {
    state = routeState();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `MCP não configurado no servidor: ${message}` }, { status: 503 });
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

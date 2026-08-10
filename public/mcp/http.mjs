import { timingSafeEqual } from 'node:crypto';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import express from 'express';
import { loadMcpConfig } from './config.mjs';
import { createBabaMcpServer } from './server.mjs';

function tokenMatches(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

const config = loadMcpConfig({ transport: 'http' });
const appOptions = { host: config.host };
if (config.allowedHosts.length) appOptions.allowedHosts = config.allowedHosts;
const app = createMcpExpressApp(appOptions);
const server = createBabaMcpServer({ config });

app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.status(200).json({
  ok: true,
  service: 'sitey-caixa-baba-mcp',
  accounts: config.accounts.map(({ alias }) => alias),
  writesEnabled: config.writesEnabled,
}));

app.use('/mcp', (req, res, next) => {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match || !tokenMatches(match[1], config.accessToken)) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="sitey-caixa-baba-mcp"');
    return res.status(401).json({ error: 'Token MCP ausente ou inválido.' });
  }
  return next();
});

app.post('/mcp', async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Falha no transporte MCP HTTP:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Falha interna no MCP.' });
  } finally {
    await transport.close().catch(() => {});
  }
});

app.all('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').json({ error: 'Use POST no endpoint MCP.' }));

const httpServer = app.listen(config.port, config.host, () => {
  console.error(`Baba Psyzon MCP HTTP em http://${config.host}:${config.port}/mcp. Escrita: ${config.writesEnabled ? 'ativada' : 'desativada'}.`);
});

process.on('SIGINT', async () => {
  await server.close().catch(() => {});
  httpServer.close(() => process.exit(0));
});

export { app, httpServer, tokenMatches };

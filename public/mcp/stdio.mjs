import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadMcpConfig } from './config.mjs';
import { createBabaMcpServer } from './server.mjs';

try {
  const config = loadMcpConfig({ transport: 'stdio' });
  serveStdio(() => createBabaMcpServer({ config }));
  console.error(`Sitey Caixa MCP iniciado para ${config.accounts.length} conta(s): ${config.accounts.map(({ alias }) => alias).join(', ')}. Escrita: ${config.writesEnabled ? 'ativada' : 'desativada'}.`);
} catch (error) {
  console.error(`Não foi possível iniciar o MCP: ${error.message}`);
  process.exitCode = 1;
}

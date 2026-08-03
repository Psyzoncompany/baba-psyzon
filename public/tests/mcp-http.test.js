const test = require('node:test');
const assert = require('node:assert/strict');

test('servidor MCP HTTP exige token e negocia Streamable HTTP', async () => {
  const previousEnv = {
    BABA_ACCOUNT_UID: process.env.BABA_ACCOUNT_UID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    BABA_MCP_ACCESS_TOKEN: process.env.BABA_MCP_ACCESS_TOKEN,
    BABA_MCP_PORT: process.env.BABA_MCP_PORT,
    BABA_MCP_WRITE_ENABLED: process.env.BABA_MCP_WRITE_ENABLED,
    FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  };
  const token = 'token_mcp_de_teste_com_mais_de_32_caracteres';
  Object.assign(process.env, {
    BABA_ACCOUNT_UID: 'conta_http_teste',
    FIREBASE_PROJECT_ID: 'demo-sitey-caixa',
    BABA_MCP_ACCESS_TOKEN: token,
    BABA_MCP_PORT: '0',
    BABA_MCP_WRITE_ENABLED: 'false',
    FIREBASE_SERVICE_ACCOUNT_JSON: ' ',
  });

  const { Client, StreamableHTTPClientTransport } = await import('@modelcontextprotocol/client');
  const { httpServer } = await import('../mcp/http.mjs');
  if (!httpServer.listening) await new Promise((resolve) => httpServer.once('listening', resolve));
  const address = httpServer.address();
  const endpoint = `http://127.0.0.1:${address.port}/mcp`;

  const unauthorized = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
  });
  assert.equal(unauthorized.status, 401);

  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: 'sitey-http-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.ok(tools.some((tool) => tool.name === 'baba_resumo'));
  } finally {
    await client.close();
    await new Promise((resolve) => httpServer.close(resolve));
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

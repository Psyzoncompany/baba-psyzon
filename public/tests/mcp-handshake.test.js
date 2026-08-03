const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('servidor MCP negocia stdio e anuncia ferramentas e recursos', async () => {
  const { Client } = await import('@modelcontextprotocol/client');
  const { StdioClientTransport } = await import('@modelcontextprotocol/client/stdio');
  const publicDir = path.resolve(__dirname, '..');
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(publicDir, 'mcp', 'stdio.mjs')],
    cwd: publicDir,
    env: {
      ...process.env,
      BABA_ACCOUNT_UID: 'conta_teste',
      BABA_MCP_ACCOUNTS: '',
      FIREBASE_PROJECT_ID: 'demo-sitey-caixa',
      FIREBASE_SERVICE_ACCOUNT_JSON: ' ',
      BABA_MCP_WRITE_ENABLED: 'false',
    },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'sitey-caixa-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    assert.ok(names.includes('baba_resumo'));
    assert.ok(names.includes('baba_listar_contas'));
    assert.ok(names.includes('baba_preparar_alteracao'));
    assert.ok(names.includes('baba_salvar_documento'));
    const blockedWrite = await client.callTool({
      name: 'baba_preparar_alteracao',
      arguments: { caminho: 'players/teste', dados: { nome: 'Teste' } },
    });
    assert.equal(blockedWrite.isError, true);
    assert.match(blockedWrite.content[0].text, /desativadas/i);
    const { resources } = await client.listResources();
    assert.deepEqual(resources.map((resource) => resource.uri).sort(), [
      'baba://conta/mapa-de-dados',
      'baba://conta/resumo',
    ]);
  } finally {
    await client.close();
  }
});

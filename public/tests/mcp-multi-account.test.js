const test = require('node:test');
const assert = require('node:assert/strict');

function fakeRepository(alias, calls) {
  return {
    summary: async () => ({ totals: { players: alias === 'boleiro' ? 25 : 16, babas: alias === 'boleiro' ? 2 : 5, months: 1 } }),
    listPlayers: async () => ({ documents: [{ nome: alias }], returned: 1 }),
    listBabas: async () => ({ documents: [], returned: 0 }),
    getBaba: async () => null,
    getDocument: async () => null,
    listCollection: async () => ({ documents: [], returned: 0 }),
    previewChange: async ({ path, data, mode, reason }) => ({
      change: { path, data, mode, reason },
      preview: { before: null, submittedData: data, createsDocument: true },
    }),
    saveChange: async (change) => {
      calls.push({ alias, change });
      return { path: change.path, auditId: `${alias}_audit` };
    },
  };
}

test('MCP lista contas, exige seleção e prende a confirmação à conta', async () => {
  const { Client } = await import('@modelcontextprotocol/client');
  const { InMemoryTransport } = await import('@modelcontextprotocol/server');
  const { createBabaMcpServer } = await import('../mcp/server.mjs');
  const calls = [];
  const config = {
    accountId: 'uid_boleiro',
    accounts: [
      { alias: 'boleiro', uid: 'uid_boleiro' },
      { alias: 'jessica', uid: 'uid_jessica' },
    ],
    writesEnabled: true,
    confirmationSecret: 'segredo-de-confirmacao-com-mais-de-32-caracteres',
  };
  const repositories = {
    boleiro: fakeRepository('boleiro', calls),
    jessica: fakeRepository('jessica', calls),
  };
  const server = createBabaMcpServer({ config, repositories });
  const client = new Client({ name: 'multi-account-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const listed = await client.callTool({ name: 'baba_listar_contas', arguments: {} });
    assert.deepEqual(listed.structuredContent.result.contas.map((item) => item.conta), ['boleiro', 'jessica']);

    const missing = await client.callTool({ name: 'baba_listar_jogadores', arguments: {} });
    assert.equal(missing.isError, true);
    assert.match(missing.content[0].text, /Informe a conta desejada/i);

    const players = await client.callTool({ name: 'baba_listar_jogadores', arguments: { conta: 'jessica' } });
    assert.equal(players.structuredContent.result.conta, 'jessica');
    assert.equal(players.structuredContent.result.documents[0].nome, 'jessica');

    const change = { conta: 'boleiro', caminho: 'players/novo', dados: { nome: 'Novo' }, modo: 'mesclar', motivo: 'teste' };
    const preview = await client.callTool({ name: 'baba_preparar_alteracao', arguments: change });
    const confirmation = preview.structuredContent.result.confirmation;
    const wrongAccount = await client.callTool({
      name: 'baba_salvar_documento',
      arguments: { ...change, conta: 'jessica', confirmacao: confirmation },
    });
    assert.equal(wrongAccount.isError, true);
    assert.match(wrongAccount.content[0].text, /dados mudaram/i);
    assert.equal(calls.length, 0);

    const saved = await client.callTool({
      name: 'baba_salvar_documento',
      arguments: { ...change, confirmacao: confirmation },
    });
    assert.equal(saved.structuredContent.result.conta, 'boleiro');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].alias, 'boleiro');
  } finally {
    await client.close();
    await server.close();
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');

test('MCP aceita apenas caminhos conhecidos e com tipo correto', async () => {
  const { validateKnownPath } = await import('../mcp/repository.mjs');
  assert.equal(validateKnownPath('players/jose', 'document'), 'players/jose');
  assert.equal(validateKnownPath('babas/2026-08-03/goals', 'collection'), 'babas/2026-08-03/goals');
  assert.throws(() => validateKnownPath('outra_conta/segredo', 'document'), /não permitida/i);
  assert.throws(() => validateKnownPath('migrations/x', 'document', { write: true }), /somente leitura/i);
  assert.throws(() => validateKnownPath('../players/jose', 'document'), /inválido/i);
  assert.throws(() => validateKnownPath('babas/x/goals/y/teams', 'collection'), /inválido/i);
});

test('confirmação assinada detecta alteração dos dados e expiração', async () => {
  const { createConfirmation, verifyConfirmation } = await import('../mcp/confirmation.mjs');
  const change = { path: 'players/jose', data: { nome: 'José' }, mode: 'mesclar', reason: 'Correção' };
  const token = createConfirmation(change, 'segredo-de-teste', 10_000);
  assert.equal(verifyConfirmation(token, change, 'segredo-de-teste'), true);
  assert.throws(() => verifyConfirmation(token, { ...change, data: { nome: 'Outro' } }, 'segredo-de-teste'), /mudaram/i);
  const expired = createConfirmation(change, 'segredo-de-teste', -1);
  assert.throws(() => verifyConfirmation(expired, change, 'segredo-de-teste'), /expirou/i);
});

test('documentos MCP rejeitam payloads excessivos ou inválidos', async () => {
  const { validateDocumentData } = await import('../mcp/repository.mjs');
  assert.deepEqual(validateDocumentData({ nome: 'Ana', ativo: true }), { nome: 'Ana', ativo: true });
  assert.throws(() => validateDocumentData(['não', 'é', 'objeto']), /objeto JSON/i);
  assert.throws(() => validateDocumentData({ texto: 'x'.repeat(260_000) }), /limite MCP/i);
  assert.throws(() => validateDocumentData({ nested: { __segredo__: true } }), /reservados/i);
});

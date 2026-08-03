import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { createConfirmation, verifyConfirmation } from './confirmation.mjs';
import { getAdminFirestore } from './firebase-admin.mjs';
import { createBabaRepository, ROOT_PATHS } from './repository.mjs';

const resultSchema = z.object({ ok: z.boolean(), result: z.unknown().optional(), error: z.string().optional() });
const documentDataSchema = z.record(z.string(), z.unknown());
const detailNames = ['participants', 'teams', 'games', 'goals', 'payments', 'stats'];

function success(result) {
  const envelope = { ok: true, result };
  return {
    content: [{ type: 'text', text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope,
  };
}

function failure(error) {
  const message = error instanceof Error ? error.message : String(error);
  const envelope = { ok: false, error: message };
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope,
  };
}

function safe(handler) {
  return async (args, context) => {
    try {
      return await handler(args, context);
    } catch (error) {
      return failure(error);
    }
  };
}

function accountEnvelope(account, result) {
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return { conta: account.alias, ...result };
  }
  return { conta: account.alias, dados: result };
}

export function registerBabaCapabilities(server, { config, repository, repositories } = {}) {
  if (!server) throw new Error('Instância MCP não informada.');
  if (!config) throw new Error('Configuração MCP não informada.');
  const accounts = config.accounts?.length
    ? config.accounts
    : [{ alias: 'principal', uid: config.accountId }];
  const db = repository || repositories ? null : getAdminFirestore(config);
  const repoByAlias = new Map(accounts.map((account) => {
    const supplied = repositories instanceof Map
      ? repositories.get(account.alias)
      : repositories?.[account.alias] || (accounts.length === 1 ? repository : null);
    return [account.alias, supplied || createBabaRepository({ db, accountId: account.uid, accountAlias: account.alias })];
  }));
  const accountNames = accounts.map(({ alias }) => alias).join(', ');
  const accountSchema = z.string().max(40).optional()
    .describe(`Apelido da conta. Opções autorizadas: ${accountNames}.${accounts.length > 1 ? ' Obrigatório nesta ferramenta quando houver várias contas.' : ''}`);

  function selectedAccount(value) {
    const alias = String(value || '').trim().toLowerCase();
    if (!alias && accounts.length > 1) {
      throw new Error(`Informe a conta desejada. Contas autorizadas: ${accountNames}.`);
    }
    const account = accounts.find((item) => item.alias === (alias || accounts[0].alias));
    if (!account) throw new Error(`Conta MCP não autorizada: ${alias}. Use uma destas: ${accountNames}.`);
    return { ...account, repo: repoByAlias.get(account.alias) };
  }

  async function accountSummaries() {
    return Promise.all(accounts.map(async (account) => accountEnvelope(account, await repoByAlias.get(account.alias).summary())));
  }

  server.registerResource('resumo-da-conta', 'baba://conta/resumo', {
    title: 'Resumo das contas do Baba',
    description: 'Estado ao vivo, totais e eventos recentes de todas as contas autorizadas.',
    mimeType: 'application/json',
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await accountSummaries(), null, 2) }],
  }));

  server.registerResource('mapa-de-dados', 'baba://conta/mapa-de-dados', {
    title: 'Mapa de coleções do Baba',
    description: 'Coleções e subcoleções que podem ser consultadas pelo MCP.',
    mimeType: 'application/json',
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ contas: accounts.map(({ alias }) => alias), colecoes: ROOT_PATHS }, null, 2) }],
  }));

  server.registerTool('baba_listar_contas', {
    title: 'Listar contas do Baba',
    description: 'Lista as contas autorizadas e os totais de jogadores, babas e meses de cada uma. Use antes das outras ferramentas para escolher a conta correta.',
    inputSchema: z.object({}),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async () => success({ contas: await accountSummaries() })));

  server.registerTool('baba_resumo', {
    title: 'Consultar resumo do Baba',
    description: 'Retorna estado ao vivo, totais e eventos recentes. Sem conta, retorna todas quando houver várias.',
    inputSchema: z.object({ conta: accountSchema }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta }) => {
    if (!conta && accounts.length > 1) return success({ contas: await accountSummaries() });
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.summary()));
  }));

  server.registerTool('baba_listar_jogadores', {
    title: 'Listar jogadores',
    description: 'Lista ou pesquisa jogadores da conta do Baba.',
    inputSchema: z.object({
      conta: accountSchema,
      busca: z.string().max(120).optional().describe('Parte do nome, apelido ou ID.'),
      incluirInativos: z.boolean().default(false),
      limite: z.number().int().min(1).max(250).default(100),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, busca, incluirInativos, limite }) => {
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.listPlayers({ search: busca, includeInactive: incluirInativos, limit: limite })));
  }));

  server.registerTool('baba_listar_eventos', {
    title: 'Listar eventos do Baba',
    description: 'Lista babas recentes; pode filtrar por status.',
    inputSchema: z.object({
      conta: accountSchema,
      status: z.enum(['em_andamento', 'finalizado', 'reverted', 'idle']).optional(),
      limite: z.number().int().min(1).max(100).default(30),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, status, limite }) => {
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.listBabas({ status, limit: limite })));
  }));

  server.registerTool('baba_detalhar_evento', {
    title: 'Detalhar evento do Baba',
    description: 'Lê os metadados de um Baba e, opcionalmente, participantes, times, jogos, gols, pagamentos e estatísticas.',
    inputSchema: z.object({
      conta: accountSchema,
      babaId: z.string().min(1).max(180),
      incluir: z.array(z.enum(detailNames)).max(detailNames.length).default(detailNames),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, babaId, incluir }) => {
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.getBaba(babaId, incluir)));
  }));

  server.registerTool('baba_ler_documento', {
    title: 'Ler documento do Baba',
    description: 'Lê um documento por caminho relativo, por exemplo players/ID ou babas/ID/payments/JOGADOR_ID.',
    inputSchema: z.object({ conta: accountSchema, caminho: z.string().min(3).max(700) }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, caminho }) => {
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.getDocument(caminho)));
  }));

  server.registerTool('baba_listar_colecao', {
    title: 'Consultar coleção do Baba',
    description: 'Consulta uma coleção permitida com paginação simples. Exemplos: players, babas/ID/goals, months/AAAA-MM/payments.',
    inputSchema: z.object({
      conta: accountSchema,
      caminho: z.string().min(1).max(700),
      limite: z.number().int().min(1).max(250).default(50),
      incluirExcluidos: z.boolean().default(false),
      ordenarPor: z.string().max(128).optional(),
      direcao: z.enum(['asc', 'desc']).default('desc'),
      cursorId: z.string().max(180).optional(),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, caminho, limite, incluirExcluidos, ordenarPor, direcao, cursorId }) => {
    const account = selectedAccount(conta);
    return success(accountEnvelope(account, await account.repo.listCollection(caminho, {
      limit: limite,
      includeDeleted: incluirExcluidos,
      orderBy: ordenarPor,
      direction: direcao,
      cursorId,
    })));
  }));

  server.registerTool('baba_preparar_alteracao', {
    title: 'Preparar alteração',
    description: 'Gera uma prévia e um token de confirmação válido por 5 minutos. Não grava nada. Use exclusão lógica com dados {"deleted": true}.',
    inputSchema: z.object({
      conta: accountSchema,
      caminho: z.string().min(3).max(700),
      dados: documentDataSchema,
      modo: z.enum(['mesclar', 'substituir']).default('mesclar'),
      motivo: z.string().max(500).default(''),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ conta, caminho, dados, modo, motivo }) => {
    if (!config.writesEnabled) throw new Error('Escritas MCP estão desativadas. Defina BABA_MCP_WRITE_ENABLED=true no servidor.');
    const account = selectedAccount(conta);
    const { change, preview } = await account.repo.previewChange({ path: caminho, data: dados, mode: modo, reason: motivo });
    const accountChange = { account: account.alias, accountId: account.uid, ...change };
    return success({ conta: account.alias, ...preview, confirmation: createConfirmation(accountChange, config.confirmationSecret), expiresInSeconds: 300 });
  }));

  server.registerTool('baba_salvar_documento', {
    title: 'Confirmar e salvar alteração',
    description: 'Grava uma alteração previamente revisada. Os caminho, dados, modo e motivo devem ser idênticos aos usados na prévia.',
    inputSchema: z.object({
      conta: accountSchema,
      caminho: z.string().min(3).max(700),
      dados: documentDataSchema,
      modo: z.enum(['mesclar', 'substituir']).default('mesclar'),
      motivo: z.string().max(500).default(''),
      confirmacao: z.string().min(40),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  }, safe(async ({ conta, caminho, dados, modo, motivo, confirmacao }) => {
    if (!config.writesEnabled) throw new Error('Escritas MCP estão desativadas. Defina BABA_MCP_WRITE_ENABLED=true no servidor.');
    const account = selectedAccount(conta);
    const { change } = await account.repo.previewChange({ path: caminho, data: dados, mode: modo, reason: motivo });
    verifyConfirmation(confirmacao, { account: account.alias, accountId: account.uid, ...change }, config.confirmationSecret);
    return success(accountEnvelope(account, await account.repo.saveChange(change)));
  }));

  return server;
}

export function createBabaMcpServer({ config, repository, repositories } = {}) {
  const server = new McpServer({
    name: 'sitey-caixa-baba',
    version: '1.0.0',
  }, {
    instructions: 'Servidor do Baba com uma ou mais contas autorizadas. Comece por baba_listar_contas e informe o apelido da conta nas demais ferramentas. Antes de qualquer escrita, use baba_preparar_alteracao e peça confirmação humana; só então chame baba_salvar_documento com a mesma conta, exatamente os mesmos dados e o token retornado.',
  });
  return registerBabaCapabilities(server, { config, repository, repositories });
}

export { accountEnvelope, failure, safe, success };

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

export function createBabaMcpServer({ config, repository } = {}) {
  if (!config) throw new Error('Configuração MCP não informada.');
  const repo = repository || createBabaRepository({ db: getAdminFirestore(config), accountId: config.accountId });
  const server = new McpServer({
    name: 'sitey-caixa-baba',
    version: '1.0.0',
  }, {
    instructions: 'Servidor do Baba. Prefira ferramentas específicas de leitura. Antes de qualquer escrita, use baba_preparar_alteracao e peça confirmação humana; só então chame baba_salvar_documento com exatamente os mesmos dados e o token retornado.',
  });

  server.registerResource('resumo-da-conta', 'baba://conta/resumo', {
    title: 'Resumo atual do Baba',
    description: 'Estado ao vivo, totais e eventos recentes da conta configurada.',
    mimeType: 'application/json',
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await repo.summary(), null, 2) }],
  }));

  server.registerResource('mapa-de-dados', 'baba://conta/mapa-de-dados', {
    title: 'Mapa de coleções do Baba',
    description: 'Coleções e subcoleções que podem ser consultadas pelo MCP.',
    mimeType: 'application/json',
  }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(ROOT_PATHS, null, 2) }],
  }));

  server.registerTool('baba_resumo', {
    title: 'Consultar resumo do Baba',
    description: 'Retorna estado ao vivo, totais de jogadores/eventos/meses e os eventos mais recentes.',
    inputSchema: z.object({}),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async () => success(await repo.summary())));

  server.registerTool('baba_listar_jogadores', {
    title: 'Listar jogadores',
    description: 'Lista ou pesquisa jogadores da conta do Baba.',
    inputSchema: z.object({
      busca: z.string().max(120).optional().describe('Parte do nome, apelido ou ID.'),
      incluirInativos: z.boolean().default(false),
      limite: z.number().int().min(1).max(250).default(100),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ busca, incluirInativos, limite }) => success(await repo.listPlayers({ search: busca, includeInactive: incluirInativos, limit: limite }))));

  server.registerTool('baba_listar_eventos', {
    title: 'Listar eventos do Baba',
    description: 'Lista babas recentes; pode filtrar por status.',
    inputSchema: z.object({
      status: z.enum(['em_andamento', 'finalizado', 'reverted', 'idle']).optional(),
      limite: z.number().int().min(1).max(100).default(30),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ status, limite }) => success(await repo.listBabas({ status, limit: limite }))));

  server.registerTool('baba_detalhar_evento', {
    title: 'Detalhar evento do Baba',
    description: 'Lê os metadados de um Baba e, opcionalmente, participantes, times, jogos, gols, pagamentos e estatísticas.',
    inputSchema: z.object({
      babaId: z.string().min(1).max(180),
      incluir: z.array(z.enum(detailNames)).max(detailNames.length).default(detailNames),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ babaId, incluir }) => success(await repo.getBaba(babaId, incluir))));

  server.registerTool('baba_ler_documento', {
    title: 'Ler documento do Baba',
    description: 'Lê um documento por caminho relativo, por exemplo players/ID ou babas/ID/payments/JOGADOR_ID.',
    inputSchema: z.object({ caminho: z.string().min(3).max(700) }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ caminho }) => success(await repo.getDocument(caminho))));

  server.registerTool('baba_listar_colecao', {
    title: 'Consultar coleção do Baba',
    description: 'Consulta uma coleção permitida com paginação simples. Exemplos: players, babas/ID/goals, months/AAAA-MM/payments.',
    inputSchema: z.object({
      caminho: z.string().min(1).max(700),
      limite: z.number().int().min(1).max(250).default(50),
      incluirExcluidos: z.boolean().default(false),
      ordenarPor: z.string().max(128).optional(),
      direcao: z.enum(['asc', 'desc']).default('desc'),
      cursorId: z.string().max(180).optional(),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ caminho, limite, incluirExcluidos, ordenarPor, direcao, cursorId }) => success(await repo.listCollection(caminho, {
    limit: limite,
    includeDeleted: incluirExcluidos,
    orderBy: ordenarPor,
    direction: direcao,
    cursorId,
  }))));

  server.registerTool('baba_preparar_alteracao', {
    title: 'Preparar alteração',
    description: 'Gera uma prévia e um token de confirmação válido por 5 minutos. Não grava nada. Use exclusão lógica com dados {"deleted": true}.',
    inputSchema: z.object({
      caminho: z.string().min(3).max(700),
      dados: documentDataSchema,
      modo: z.enum(['mesclar', 'substituir']).default('mesclar'),
      motivo: z.string().max(500).default(''),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, safe(async ({ caminho, dados, modo, motivo }) => {
    if (!config.writesEnabled) throw new Error('Escritas MCP estão desativadas. Defina BABA_MCP_WRITE_ENABLED=true no servidor.');
    const { change, preview } = await repo.previewChange({ path: caminho, data: dados, mode: modo, reason: motivo });
    return success({ ...preview, confirmation: createConfirmation(change, config.confirmationSecret), expiresInSeconds: 300 });
  }));

  server.registerTool('baba_salvar_documento', {
    title: 'Confirmar e salvar alteração',
    description: 'Grava uma alteração previamente revisada. Os caminho, dados, modo e motivo devem ser idênticos aos usados na prévia.',
    inputSchema: z.object({
      caminho: z.string().min(3).max(700),
      dados: documentDataSchema,
      modo: z.enum(['mesclar', 'substituir']).default('mesclar'),
      motivo: z.string().max(500).default(''),
      confirmacao: z.string().min(40),
    }),
    outputSchema: resultSchema,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
  }, safe(async ({ caminho, dados, modo, motivo, confirmacao }) => {
    if (!config.writesEnabled) throw new Error('Escritas MCP estão desativadas. Defina BABA_MCP_WRITE_ENABLED=true no servidor.');
    const { change } = await repo.previewChange({ path: caminho, data: dados, mode: modo, reason: motivo });
    verifyConfirmation(confirmacao, change, config.confirmationSecret);
    return success(await repo.saveChange(change));
  }));

  return server;
}

export { failure, safe, success };

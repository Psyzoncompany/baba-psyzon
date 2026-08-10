import { auth, db } from './js/firebase-init.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'psyzon_baba_state_v1';
const DEVICE_ID_KEY = 'psyzon_baba_public_device_id';
const DEBUG_SIZE_KEY = 'psyzon_baba_debug_size';
const RECENT_BABA_LIMIT = 24;
const BACKUP_CHUNK_SIZE = 160_000;
const BATCH_LIMIT = 400;
const QUERY_LIMITS = Object.freeze({
  participants: 200,
  teams: 32,
  games: 500,
  goals: 1_000,
  payments: 250,
  stats: 250,
  players: 1000,
  purchaseGoals: 100,
  months: 60,
});
const SAVE_DEBOUNCE_MS = 1_500;
const SAVE_BACKOFF_DELAYS_MS = [2_000, 4_000, 8_000, 16_000];
const MAX_SAVE_ATTEMPTS = 4;
const PENDING_SYNC_KEY = 'psyzon_baba_pending_sync_v2';
const USE_BABA_SCHEMA_V2 = window.BABA_USE_SCHEMA_V2 !== false;
const OFFLINE_TEST_MODE = new URLSearchParams(window.location.search).has('babaOffline');

const tools = window.BabaHtmlTools;
let activeAccountId = '';
const unsubscribers = new Set();
const subscriptionsByKey = new Map();
const activeSubscriptions = new Map();
const activeSnapshotParts = new Map();
const loadedBabas = new Map();
const monthStatsCache = new Map();
const monthPaymentsCache = new Map();
const finishedBabaStatsCache = new Map();
const deletedPlayerIds = new Set();
const remotePlayerDocumentIds = new Map();
let saveTimer = null;
let backoffTimer = null;
let flushTimer = null;
let lastLocalState = null;
let lastPersistedSignature = '';
let activeBabaId = null;
let applyingRemote = false;
let migrationRunning = false;
let repositoryStarted = false;
let v2SubscriptionsStarted = false;
let pointerListenerStarted = false;
let historyCursor = null;
let hasMoreHistory = true;
let lastRemoteViewSignature = '';
let remoteFlushDeferred = false;
let localWritePending = false;
let saveGeneration = 0;
let queuedSave = null;
let saveInFlight = false;
let backoffUntil = 0;
let latestPointerData = null;
let lastPointerSignature = '';
let replaceHistoryOnNextMerge = false;
let allHistoryRankingsPromise = null;

function now() {
  return Date.now();
}

function getDeviceId() {
  try {
    const nativeStore = window.__nativeLS || window.localStorage;
    let id = nativeStore.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = window.crypto?.randomUUID?.() || `device_${now()}_${Math.random().toString(16).slice(2)}`;
      nativeStore.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (error) {
    return `device_${now()}_${Math.random().toString(16).slice(2)}`;
  }
}

const deviceId = getDeviceId();

function safeId(value, fallback = 'item') {
  const normalized = String(value || fallback).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return normalized.slice(0, 180) || fallback;
}

function resolveAccountId(candidate = '') {
  return safeId(candidate || auth.currentUser?.uid || window.BabaAccessRepository?.currentAccountId?.(), '');
}

function accountDoc(...segments) {
  const accountId = resolveAccountId(activeAccountId);
  if (!accountId) throw new Error('Conta do Baba não identificada.');
  return doc(db, 'baba_accounts', accountId, ...segments);
}

function accountCollection(...segments) {
  const accountId = resolveAccountId(activeAccountId);
  if (!accountId) throw new Error('Conta do Baba não identificada.');
  return collection(db, 'baba_accounts', accountId, ...segments);
}

function pointerRef() {
  return accountDoc('meta', 'live');
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = stableValue(value[key]);
    return result;
  }, {});
}

function stableSignature(value) {
  return JSON.stringify(stableValue(value));
}

function persistenceSignature(state) {
  const copy = clone(state) || {};
  delete copy.updatedAt;
  (copy.babas || []).forEach((baba) => {
    delete baba.undoStack;
    delete baba.rankingDoBaba;
    delete baba.__detailLoaded;
  });
  return stableSignature(copy);
}

function documentSignature(value) {
  const copy = clone(value) || {};
  delete copy.updatedAtMs;
  return stableSignature(copy);
}

function isQuotaError(error) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('resource-exhausted') || text.includes('quota exceeded') || text.includes('429');
}

function getNativeStore() {
  return window.__nativeLS || window.localStorage;
}

function pendingSyncKey() {
  const accountId = resolveAccountId(activeAccountId);
  return accountId ? `${PENDING_SYNC_KEY}:${accountId}` : PENDING_SYNC_KEY;
}

function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).reduce((result, [key, item]) => {
    if (item !== undefined) result[key] = compact(item);
    return result;
  }, {});
}

function parseState(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return tools?.normalizeBabaState?.(parsed) || parsed;
  } catch (error) {
    return null;
  }
}

function readLocalState() {
  return parseState(tools?.readCurrentBabaRaw?.() || localStorage.getItem(STORAGE_KEY) || '{}');
}

function emptyState() {
  return {
    version: 1,
    activeBabaId: null,
    players: [],
    babas: [],
    purchaseGoals: [],
    monthlyPayments: {},
    playerStats: {},
    monthlyStats: {},
    updatedAt: now(),
  };
}

function hasUsefulState(state) {
  return Boolean(state && (
    state.players?.length
    || state.babas?.length
    || state.purchaseGoals?.length
    || Object.keys(state.monthlyPayments || {}).length
  ));
}

function stateRaw(state) {
  return JSON.stringify(tools?.normalizeBabaState?.(clone(state)) || state);
}

function stateViewSignature(state) {
  const copy = clone(state) || {};
  delete copy.updatedAt;
  return stateRaw(copy);
}

function updateStatus(status, stateText, message) {
  tools?.setSyncStatus?.(status, stateText, message);
}

function sizeDiagnosticsEnabled() {
  try {
    return new URLSearchParams(location.search).get('babaDebugSize') === '1'
      || localStorage.getItem(DEBUG_SIZE_KEY) === '1';
  } catch (error) {
    return false;
  }
}

function isPermissionError(error) {
  const text = String(error?.code || error?.message || '').toLowerCase();
  return text.includes('permission') || text.includes('unauthenticated');
}

export function estimateJsonSize(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch (error) {
    console.warn('Nao foi possivel estimar tamanho:', error);
    return 0;
  }
}

export function diagnoseBabaStateSize(state = readLocalState()) {
  if (!state) return [];
  const rows = Object.entries(state)
    .map(([field, value]) => ({ field, bytes: estimateJsonSize(value) }))
    .sort((a, b) => b.bytes - a.bytes);
  const babaRows = (state.babas || []).map((baba) => ({
    id: baba.id,
    bytes: estimateJsonSize(baba),
    fields: Object.entries(baba)
      .map(([field, value]) => ({ field, bytes: estimateJsonSize(value) }))
      .sort((a, b) => b.bytes - a.bytes),
  }));
  const report = { totalBytes: estimateJsonSize(state), fields: rows, babas: babaRows };
  if (sizeDiagnosticsEnabled()) {
    console.info('[Baba schema v2] Diagnostico de tamanho', report);
  }
  return report;
}

function warnDocumentSize(path, data) {
  const bytes = estimateJsonSize(data);
  if (!sizeDiagnosticsEnabled()) return bytes;
  if (bytes >= 300_000) console.error(`[Baba schema v2] Documento muito grande (${bytes} bytes): ${path}`);
  else if (bytes >= 100_000) console.warn(`[Baba schema v2] Documento em atencao (${bytes} bytes): ${path}`);
  return bytes;
}

function monthKeyFromBaba(baba) {
  return String(baba?.dataISO || '').slice(0, 7);
}

function gameIdFor(game) {
  const sequence = Math.max(1, Number(game?.numeroJogo || game?.sequence || 1));
  return `game_${String(sequence).padStart(4, '0')}`;
}

function allGoalEvents(game, gameId, timestamp = now()) {
  if (Array.isArray(game?.goalEvents) && game.goalEvents.length) {
    return game.goalEvents.map((goal, index) => ({
      ...goal,
      id: safeId(goal.id || `${gameId}_goal_${index + 1}`),
      gameId,
    }));
  }
  const result = [];
  (game?.gols || []).forEach((goal) => {
    const quantity = Math.max(0, Number(goal.quantidade || 0));
    for (let index = 0; index < quantity; index += 1) {
      result.push({
        id: safeId(`${gameId}_${goal.jogadorId || 'player'}_${index + 1}`),
        gameId,
        jogadorId: goal.jogadorId || null,
        jogadorNome: goal.jogadorNome || '',
        time: goal.time || null,
        timeNome: goal.timeNome || '',
        minuto: null,
        registradoEm: Number(game.finalizadoEm || game.dataHora || timestamp),
      });
    }
  });
  return result;
}

function aggregateGoals(events) {
  const totals = new Map();
  events.forEach((event) => {
    const key = `${event.jogadorId}:${event.time}`;
    const item = totals.get(key) || {
      jogadorId: event.jogadorId,
      jogadorNome: event.jogadorNome || '',
      quantidade: 0,
      time: event.time,
      timeNome: event.timeNome || '',
    };
    item.quantidade += 1;
    totals.set(key, item);
  });
  return [...totals.values()];
}

function computeBabaStats(baba, playerById = new Map()) {
  (baba?.visitantes || []).forEach((player) => playerById.set(player.id, player));
  if (baba?.rankingDoBaba && Object.keys(baba.rankingDoBaba).length) {
    const persisted = clone(baba.rankingDoBaba);
    Object.values(persisted).forEach((item) => {
      item.goalkeeperGames = 0;
      item.goalsConceded = 0;
    });
    const teams = new Map((baba?.teams || []).map((team) => [team.id, team]));
    (baba?.jogos || []).forEach((game) => {
      const playersFor = (teamId) => {
        if (teamId === game.timeA && Array.isArray(game.jogadoresTimeA)) return game.jogadoresTimeA;
        if (teamId === game.timeB && Array.isArray(game.jogadoresTimeB)) return game.jogadoresTimeB;
        return teams.get(teamId)?.jogadores || [];
      };
      [
        [playersFor(game.timeA), Number(game.placarB || 0)],
        [playersFor(game.timeB), Number(game.placarA || 0)],
      ].forEach(([players, goalsAgainst]) => {
        players.forEach((playerId) => {
          if (playerById.get(playerId)?.tipo !== 'goleiro') return;
          persisted[playerId] ||= { jogadorId: playerId, nome: playerById.get(playerId)?.nome || 'Goleiro' };
          persisted[playerId].goalkeeperGames = Number(persisted[playerId].goalkeeperGames || 0) + 1;
          persisted[playerId].goalsConceded = Number(persisted[playerId].goalsConceded || 0) + goalsAgainst;
        });
      });
    });
    return persisted;
  }
  const stats = {};
  const ensure = (playerId) => {
    if (!playerId) return null;
    if (!stats[playerId]) {
      stats[playerId] = {
        jogadorId: playerId,
        nome: playerById.get(playerId)?.nome || 'Jogador',
        totalGols: 0,
        totalVitorias: 0,
        totalEmpates: 0,
        totalDerrotas: 0,
        totalJogos: 0,
        totalBabas: 1,
        totalTitulosBaba: 0,
        goalkeeperGames: 0,
        goalsConceded: 0,
        aproveitamento: 0,
      };
    }
    return stats[playerId];
  };
  const teams = new Map((baba?.teams || []).map((team) => [team.id, team]));
  (baba?.jogadoresPresentes || []).forEach(ensure);
  (baba?.visitantes || []).forEach((player) => ensure(player.id));
  (baba?.jogos || []).forEach((game) => {
    const playersFor = (teamId) => {
      if (teamId === game.timeA && Array.isArray(game.jogadoresTimeA)) return game.jogadoresTimeA;
      if (teamId === game.timeB && Array.isArray(game.jogadoresTimeB)) return game.jogadoresTimeB;
      return teams.get(teamId)?.jogadores || [];
    };
    const teamAPlayers = playersFor(game.timeA);
    const teamBPlayers = playersFor(game.timeB);
    if (game.empate) {
      [...teamAPlayers, ...teamBPlayers].forEach((id) => {
        const item = ensure(id); item.totalEmpates += 1; item.totalJogos += 1;
      });
    } else {
      playersFor(game.vencedor).forEach((id) => {
        const item = ensure(id); item.totalVitorias += 1; item.totalJogos += 1;
      });
      playersFor(game.perdedor).forEach((id) => {
        const item = ensure(id); item.totalDerrotas += 1; item.totalJogos += 1;
      });
    }
    allGoalEvents(game, gameIdFor(game)).forEach((goal) => { ensure(goal.jogadorId).totalGols += 1; });
    [
      [teamAPlayers, Number(game.placarB || 0)],
      [teamBPlayers, Number(game.placarA || 0)],
    ].forEach(([players, goalsAgainst]) => {
      players.forEach((playerId) => {
        if (playerById.get(playerId)?.tipo !== 'goleiro') return;
        const item = ensure(playerId);
        item.goalkeeperGames += 1;
        item.goalsConceded += goalsAgainst;
      });
    });
  });
  (baba?.campeaoDoBaba?.jogadores || []).forEach((id) => { ensure(id).totalTitulosBaba += 1; });
  Object.values(stats).forEach((item) => {
    const points = item.totalVitorias * 3 + item.totalEmpates;
    item.aproveitamento = item.totalJogos ? Math.round((points / (item.totalJogos * 3)) * 100) : 0;
  });
  return stats;
}

function mergeStats(target, source) {
  const playerId = source.jogadorId || source.playerId;
  if (!playerId) return;
  const item = target[playerId] || {
    jogadorId: playerId,
    playerId,
    nome: source.nome || source.name || 'Jogador',
    totalGols: 0,
    totalVitorias: 0,
    totalEmpates: 0,
    totalDerrotas: 0,
    totalJogos: 0,
    totalBabas: 0,
    totalTitulosBaba: 0,
    goalkeeperGames: 0,
    goalsConceded: 0,
  };
  ['totalGols', 'totalVitorias', 'totalEmpates', 'totalDerrotas', 'totalJogos', 'totalBabas', 'totalTitulosBaba', 'goalkeeperGames', 'goalsConceded']
    .forEach((field) => { item[field] += Number(source[field] || 0); });
  item.nome = item.nome || source.nome || source.name;
  const points = item.totalVitorias * 3 + item.totalEmpates;
  item.aproveitamento = item.totalJogos ? Math.round((points / (item.totalJogos * 3)) * 100) : 0;
  target[playerId] = item;
}

function computeAggregateStats(state) {
  const playerById = new Map((state.players || []).map((player) => [player.id, player]));
  const general = {};
  const monthly = {};
  (state.babas || []).filter((baba) => baba.status === 'finalizado').forEach((baba) => {
    const monthKey = monthKeyFromBaba(baba);
    monthly[monthKey] ||= {};
    Object.values(computeBabaStats(baba, playerById)).forEach((item) => {
      mergeStats(general, item);
      mergeStats(monthly[monthKey], item);
    });
  });
  return { general, monthly };
}

function babaMetadata(baba, currentGameId = null, timestamp = now()) {
  return compact({
    id: baba.id,
    dateKey: baba.dataISO,
    dataISO: baba.dataISO,
    dataCompleta: baba.dataCompleta,
    dia: baba.dia,
    mes: baba.mes,
    ano: baba.ano,
    status: baba.status,
    matchMode: baba.matchMode || 'ONLINE',
    currentGameId,
    currentQueue: [...(baba.filaTimes || [])],
    filaTimes: [...(baba.filaTimes || [])],
    campeaoDoBaba: baba.campeaoDoBaba || null,
    rankingDoBaba: baba.status === 'finalizado' ? (baba.rankingDoBaba || {}) : null,
    lastResult: baba.lastResult || null,
    pendingTieBreak: baba.pendingTieBreak || null,
    teamRevealIndex: Number(baba.teamRevealIndex || 0),
    importId: baba.importId || null,
    importSource: baba.importId ? 'intelligent-text-import' : null,
    observations: baba.observacoes || '',
    importedTotalGoals: baba.importedTotalGoals ?? null,
    criadoEm: Number(baba.criadoEm || timestamp),
    finalizadoEm: baba.finalizadoEm || null,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function participantDocuments(state, baba, timestamp = now()) {
  const fixed = new Map((state.players || []).map((player) => [player.id, player]));
  const visitors = new Map((baba.visitantes || []).map((player) => [player.id, player]));
  const teamByPlayer = new Map();
  (baba.teams || []).forEach((team) => (team.jogadores || []).forEach((id) => teamByPlayer.set(id, team.id)));
  const ids = new Set([
    ...(baba.jogadoresPresentes || []),
    ...visitors.keys(),
    ...teamByPlayer.keys(),
    ...Object.keys(baba.pagamentos || {}),
  ]);
  return [...ids].map((playerId) => {
    const player = visitors.get(playerId) || fixed.get(playerId) || {};
    const flags = baba.participantFlags?.[playerId] || {};
    return compact({
      playerId,
      name: player.nome || 'Jogador removido',
      nameSnapshot: player.nome || 'Jogador removido',
      type: player.tipo || 'jogador',
      present: visitors.has(playerId) || (baba.jogadoresPresentes || []).includes(playerId),
      visitor: visitors.has(playerId),
      guest: Boolean(flags.guest || visitors.has(playerId)),
      goalkeeper: Boolean(flags.goalkeeper || player.tipo === 'goleiro'),
      novice: Boolean(flags.novice || player.novato),
      typedName: flags.typedName || player.nome || '',
      active: player.ativo !== false,
      teamId: teamByPlayer.get(playerId) || null,
      joinedAt: Number(player.criadoEm || baba.criadoEm || timestamp),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
      updatedAtMs: timestamp,
    });
  });
}

function teamDocument(team, index, timestamp = now()) {
  const { jogadores, ...rest } = team;
  return compact({
    ...rest,
    id: team.id,
    name: team.name,
    order: index + 1,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function gameDocument(game, status, timestamp = now()) {
  const { gols, goalEvents, ...rest } = game;
  return compact({
    ...rest,
    id: gameIdFor(game),
    sequence: Number(game.numeroJogo || game.sequence || 1),
    status,
    teamAId: game.timeA || null,
    teamBId: game.timeB || null,
    scoreA: Number(game.placarA || 0),
    scoreB: Number(game.placarB || 0),
    winnerTeamId: game.vencedor || null,
    loserTeamId: game.perdedor || null,
    draw: Boolean(game.empate),
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function goalDocument(goal, babaId, timestamp = now()) {
  return compact({
    id: goal.id,
    gameId: goal.gameId,
    playerId: goal.jogadorId || null,
    playerNameSnapshot: goal.jogadorNome || '',
    external: Boolean(goal.external || !goal.jogadorId),
    teamId: goal.time || null,
    teamNameSnapshot: goal.timeNome || '',
    minute: goal.minuto ?? null,
    createdAtMs: Number(goal.registradoEm || timestamp),
    babaId,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
  });
}

async function commitOperations(operations) {
  for (let offset = 0; offset < operations.length; offset += BATCH_LIMIT) {
    const batch = writeBatch(db);
    operations.slice(offset, offset + BATCH_LIMIT).forEach((operation) => {
      batch.set(operation.ref, operation.data, operation.options || { merge: true });
    });
    await batch.commit();
  }
}

function setOperation(refValue, data, options = { merge: true }) {
  warnDocumentSize(refValue.path, data);
  return { type: 'set', ref: refValue, data, options };
}

function pushChangedOperation(operations, refValue, nextData, previousData = null) {
  if (previousData && documentSignature(previousData) === documentSignature(nextData)) return false;
  operations.push(setOperation(refValue, nextData));
  return true;
}

function paymentDocument(state, baba, playerId, paid, timestamp) {
  const player = (state.players || []).find((item) => item.id === playerId)
    || (baba.visitantes || []).find((item) => item.id === playerId);
  return compact({
    playerId,
    paid: Boolean(paid),
    amount: player?.tipo === 'goleiro' ? 7 : 15,
    method: null,
    paidAt: paid ? timestamp : null,
    updatedAtMs: timestamp,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
  });
}

async function persistBaba(state, baba, previousBaba = null, previousState = null) {
  const babaId = safeId(baba.id);
  const timestamp = now();
  const currentGameId = baba.jogoAtual ? gameIdFor(baba.jogoAtual) : null;
  const previousGameId = previousBaba?.jogoAtual ? gameIdFor(previousBaba.jogoAtual) : null;
  const operations = [];
  pushChangedOperation(
    operations,
    accountDoc('babas', babaId),
    babaMetadata(baba, currentGameId, timestamp),
    previousBaba ? babaMetadata(previousBaba, previousGameId, timestamp) : null,
  );

  const participants = participantDocuments(state, baba, timestamp);
  const previousParticipants = previousBaba
    ? participantDocuments(previousState || state, previousBaba, timestamp)
    : [];
  const previousParticipantById = new Map(previousParticipants.map((item) => [item.playerId, item]));
  const nextParticipantIds = new Set(participants.map((item) => item.playerId));
  participants.forEach((item) => pushChangedOperation(
    operations,
    accountDoc('babas', babaId, 'participants', safeId(item.playerId)),
    item,
    previousParticipantById.get(item.playerId),
  ));

  const previousTeamById = new Map((previousBaba?.teams || []).map((team, index) => [
    team.id,
    teamDocument(team, index, timestamp),
  ]));
  const nextTeamIds = new Set((baba.teams || []).map((team) => team.id));
  (baba.teams || []).forEach((team, index) => pushChangedOperation(
    operations,
    accountDoc('babas', babaId, 'teams', safeId(team.id)),
    teamDocument(team, index, timestamp),
    previousTeamById.get(team.id),
  ));

  const games = [...(baba.jogos || []).map((game) => ({ game, status: 'finished' }))];
  if (baba.jogoAtual) games.push({ game: baba.jogoAtual, status: baba.jogoAtual.status || 'active' });
  const previousGames = previousBaba
    ? [...(previousBaba.jogos || []).map((game) => ({ game, status: 'finished' }))]
    : [];
  if (previousBaba?.jogoAtual) previousGames.push({
    game: previousBaba.jogoAtual,
    status: previousBaba.jogoAtual.status || 'active',
  });
  const previousGameById = new Map(previousGames.map(({ game, status }) => [
    gameIdFor(game),
    gameDocument(game, status, timestamp),
  ]));
  const previousGoalById = new Map();
  previousGames.forEach(({ game }) => {
    const gameId = gameIdFor(game);
    allGoalEvents(game, gameId, timestamp).forEach((goal) => {
      previousGoalById.set(goal.id, goalDocument(goal, babaId, timestamp));
    });
  });
  const nextGameIds = new Set();
  const nextGoalIds = new Set();
  games.forEach(({ game, status }) => {
    const gameId = gameIdFor(game);
    nextGameIds.add(gameId);
    pushChangedOperation(
      operations,
      accountDoc('babas', babaId, 'games', gameId),
      gameDocument(game, status, timestamp),
      previousGameById.get(gameId),
    );
    allGoalEvents(game, gameId, timestamp).forEach((goal) => {
      nextGoalIds.add(goal.id);
      pushChangedOperation(
        operations,
        accountDoc('babas', babaId, 'goals', goal.id),
        goalDocument(goal, babaId, timestamp),
        previousGoalById.get(goal.id),
      );
    });
  });

  const nextPaymentIds = new Set(Object.keys(baba.pagamentos || {}));
  const previousPaymentById = new Map(Object.entries(previousBaba?.pagamentos || {}).map(([playerId, paid]) => [
    playerId,
    paymentDocument(previousState || state, previousBaba, playerId, paid, timestamp),
  ]));
  Object.entries(baba.pagamentos || {}).forEach(([playerId, paid]) => {
    pushChangedOperation(
      operations,
      accountDoc('babas', babaId, 'payments', safeId(playerId)),
      paymentDocument(state, baba, playerId, paid, timestamp),
      previousPaymentById.get(playerId),
    );
  });

  // Estatisticas historicas so existem depois que o baba foi finalizado.
  // Enquanto estiver aberto, jogos e gols continuam disponiveis no placar/ranking do dia.
  const stats = baba.status === 'finalizado'
    ? computeBabaStats(baba, new Map((state.players || []).map((player) => [player.id, player])))
    : {};
  const previousStats = previousBaba?.status === 'finalizado'
    ? computeBabaStats(previousBaba, new Map(((previousState || state).players || []).map((player) => [player.id, player])))
    : {};
  const nextStatIds = new Set(Object.keys(stats));
  Object.entries(stats).forEach(([playerId, item]) => pushChangedOperation(
    operations,
    accountDoc('babas', babaId, 'stats', safeId(playerId)),
    compact({ ...item, playerId, schemaVersion: SCHEMA_VERSION, deleted: false, updatedAtMs: timestamp }),
    previousStats[playerId]
      ? compact({ ...previousStats[playerId], playerId, schemaVersion: SCHEMA_VERSION, deleted: false, updatedAtMs: timestamp })
      : null,
  ));

  if (previousBaba) {
    previousParticipants.forEach((item) => {
      if (!nextParticipantIds.has(item.playerId)) operations.push(setOperation(
        accountDoc('babas', babaId, 'participants', safeId(item.playerId)),
        { playerId: item.playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: timestamp },
      ));
    });
    (previousBaba.teams || []).forEach((team) => {
      if (!nextTeamIds.has(team.id)) operations.push(setOperation(
        accountDoc('babas', babaId, 'teams', safeId(team.id)),
        { id: team.id, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: timestamp },
      ));
    });
    Object.keys(previousBaba.pagamentos || {}).forEach((playerId) => {
      if (!nextPaymentIds.has(playerId)) operations.push(setOperation(
        accountDoc('babas', babaId, 'payments', safeId(playerId)),
        { playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: timestamp },
      ));
    });
    new Set([...Object.keys(previousStats), ...Object.keys(previousBaba.rankingDoBaba || {})]).forEach((playerId) => {
      if (!nextStatIds.has(playerId)) operations.push(setOperation(
        accountDoc('babas', babaId, 'stats', safeId(playerId)),
        { playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: timestamp },
      ));
    });
    previousGames.forEach(({ game }) => {
      const gameId = gameIdFor(game);
      if (!nextGameIds.has(gameId)) operations.push(setOperation(
        accountDoc('babas', babaId, 'games', gameId),
        { id: gameId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: timestamp },
      ));
      allGoalEvents(game, gameId, timestamp).forEach((goal) => {
        if (!nextGoalIds.has(goal.id)) operations.push(setOperation(
          accountDoc('babas', babaId, 'goals', goal.id),
          { id: goal.id, babaId, schemaVersion: SCHEMA_VERSION, deleted: true },
        ));
      });
    });
  }

  await commitOperations(operations);
}

function playerDocument(player, timestamp) {
  return compact({
    ...player,
    playerId: player.id,
    name: player.nome,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function purchaseGoalDocument(goal, previousGoal, timestamp) {
  let imageUrl = goal.foto || '';
  let imageUploadPending = false;
  if (String(imageUrl).startsWith('data:image/')) {
    const imageBytes = estimateJsonSize(imageUrl);
    if (imageBytes > 650_000) {
      imageUploadPending = true;
      imageUrl = previousGoal?.foto || '';
      if (String(imageUrl).startsWith('data:image/') && estimateJsonSize(imageUrl) > 650_000) imageUrl = '';
    }
  }
  return compact({
    ...goal,
    foto: imageUrl,
    imagePath: null,
    imageStoredInline: Boolean(String(imageUrl).startsWith('data:image/')),
    imageUploadPending,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

async function persistGlobalData(state, previousState = null) {
  const timestamp = now();
  const operations = [];
  const previousPlayers = new Map((previousState?.players || []).map((player) => [player.id, player]));
  const nextPlayers = new Set();
  (state.players || []).forEach((player) => {
    nextPlayers.add(player.id);
    const previousPlayer = previousPlayers.get(player.id);
    pushChangedOperation(
      operations,
      accountDoc('players', safeId(player.id)),
      playerDocument(player, timestamp),
      previousPlayer ? playerDocument(previousPlayer, timestamp) : null,
    );
  });
  (previousState?.players || []).forEach((player) => {
    if (!nextPlayers.has(player.id)) operations.push(setOperation(accountDoc('players', safeId(player.id)), {
      playerId: player.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp,
    }));
  });

  const previousGoals = new Map((previousState?.purchaseGoals || []).map((goal) => [goal.id, goal]));
  const nextGoals = new Set();
  for (const goal of state.purchaseGoals || []) {
    nextGoals.add(goal.id);
    const previousGoal = previousGoals.get(goal.id);
    pushChangedOperation(
      operations,
      accountDoc('purchase_goals', safeId(goal.id)),
      purchaseGoalDocument(goal, previousGoal, timestamp),
      previousGoal ? purchaseGoalDocument(previousGoal, previousGoal, timestamp) : null,
    );
  }
  (previousState?.purchaseGoals || []).forEach((goal) => {
    if (!nextGoals.has(goal.id)) operations.push(setOperation(accountDoc('purchase_goals', safeId(goal.id)), {
      id: goal.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp,
    }));
  });

  Object.entries(state.monthlyPayments || {}).forEach(([monthKey, record]) => {
    const previousRecord = previousState?.monthlyPayments?.[monthKey];
    const paymentsChanged = stableSignature(record?.pagamentos || {}) !== stableSignature(previousRecord?.pagamentos || {});
    if (!previousRecord || paymentsChanged) {
      operations.push(setOperation(accountDoc('months', safeId(monthKey)), {
        id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp, deleted: false,
      }));
    }
    Object.entries(record.pagamentos || {}).forEach(([playerId, paid]) => {
      const previousPaid = previousRecord?.pagamentos?.[playerId];
      if (previousRecord && Object.prototype.hasOwnProperty.call(previousRecord.pagamentos || {}, playerId)
        && Boolean(previousPaid) === Boolean(paid)) return;
      operations.push(setOperation(accountDoc('months', safeId(monthKey), 'payments', safeId(playerId)), {
        playerId,
        paid: Boolean(paid),
        updatedAtMs: Number(record.paymentUpdatedAtMs?.[playerId] || record.atualizadoEm || timestamp),
        schemaVersion: SCHEMA_VERSION,
      }));
    });
  });
  await commitOperations(operations);
}

async function persistAggregateStats(state) {
  const { general, monthly } = computeAggregateStats(state);
  const operations = [];
  Object.entries(general).forEach(([playerId, item]) => operations.push(setOperation(
    accountDoc('player_stats', safeId(playerId)), compact({ ...item, playerId, schemaVersion: SCHEMA_VERSION, updatedAtMs: now() }),
  )));
  Object.entries(monthly).forEach(([monthKey, ranking]) => {
    operations.push(setOperation(accountDoc('months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false,
    }));
    Object.entries(ranking).forEach(([playerId, item]) => operations.push(setOperation(
      accountDoc('months', safeId(monthKey), 'stats', safeId(playerId)),
      compact({ ...item, playerId, schemaVersion: SCHEMA_VERSION, updatedAtMs: now() }),
    )));
  });
  (state.babas || []).filter((baba) => baba.status === 'finalizado').forEach((baba) => {
    operations.push(setOperation(accountDoc('babas', safeId(baba.id)), { statsApplied: true, updatedAtMs: now() }));
  });
  await commitOperations(operations);
}

async function applyBabaStatsDelta(state, baba, direction) {
  if (!baba || baba.status !== 'finalizado') return;
  const babaRef = accountDoc('babas', safeId(baba.id));
  const monthKey = monthKeyFromBaba(baba);
  const stats = computeBabaStats(baba, new Map((state.players || []).map((player) => [player.id, player])));
  await runTransaction(db, async (transaction) => {
    const babaSnapshot = await transaction.get(babaRef);
    const applied = Boolean(babaSnapshot.data()?.statsApplied);
    if ((direction > 0 && applied) || (direction < 0 && !applied)) return;
    const rows = Object.entries(stats).map(([playerId, item]) => ({
      playerId,
      item,
      generalRef: accountDoc('player_stats', safeId(playerId)),
      monthRef: accountDoc('months', safeId(monthKey), 'stats', safeId(playerId)),
    }));
    const snapshots = [];
    for (const row of rows) {
      snapshots.push({
        ...row,
        general: await transaction.get(row.generalRef),
        month: await transaction.get(row.monthRef),
      });
    }
    const numericFields = [
      'totalGols', 'totalVitorias', 'totalEmpates', 'totalDerrotas', 'totalJogos',
      'totalBabas', 'totalTitulosBaba', 'goalkeeperGames', 'goalsConceded',
    ];
    snapshots.forEach(({ item, playerId, generalRef, monthRef, general, month }) => {
      const merge = (current = {}) => {
        const next = { ...current, jogadorId: playerId, playerId, nome: item.nome || current.nome || 'Jogador' };
        numericFields.forEach((field) => {
          next[field] = Math.max(0, Number(current[field] || 0) + direction * Number(item[field] || 0));
        });
        const points = next.totalVitorias * 3 + next.totalEmpates;
        next.aproveitamento = next.totalJogos ? Math.round((points / (next.totalJogos * 3)) * 100) : 0;
        next.schemaVersion = SCHEMA_VERSION;
        next.updatedAtMs = now();
        return compact(next);
      };
      transaction.set(generalRef, merge(general.data()), { merge: true });
      transaction.set(monthRef, merge(month.data()), { merge: true });
    });
    transaction.set(accountDoc('months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false,
    }, { merge: true });
    transaction.set(babaRef, {
      statsApplied: direction > 0,
      statsRevisionSignature: direction > 0 ? stableSignature(stats) : null,
      updatedAtMs: now(),
    }, { merge: true });
  });
}

async function applyFinishedBabaStatsRevision(previousState, previousBaba, nextState, nextBaba) {
  if (previousBaba?.status !== 'finalizado' || nextBaba?.status !== 'finalizado') return;
  const previousPlayers = new Map((previousState?.players || []).map((player) => [player.id, player]));
  const nextPlayers = new Map((nextState?.players || []).map((player) => [player.id, player]));
  const previousStats = computeBabaStats(previousBaba, previousPlayers);
  const nextStats = computeBabaStats(nextBaba, nextPlayers);
  const previousMonth = monthKeyFromBaba(previousBaba);
  const nextMonth = monthKeyFromBaba(nextBaba);
  const revisionSignature = stableSignature({ monthKey: nextMonth, stats: nextStats });
  if (stableSignature({ monthKey: previousMonth, stats: previousStats }) === revisionSignature) return;

  const numericFields = [
    'totalGols', 'totalVitorias', 'totalEmpates', 'totalDerrotas', 'totalJogos',
    'totalBabas', 'totalTitulosBaba', 'goalkeeperGames', 'goalsConceded',
  ];
  const deltas = new Map();
  const addDelta = (ref, playerId, item, direction) => {
    const key = ref.path;
    const row = deltas.get(key) || { ref, playerId, nome: item.nome || item.name || 'Jogador', values: {} };
    numericFields.forEach((field) => {
      row.values[field] = Number(row.values[field] || 0) + direction * Number(item[field] || 0);
    });
    deltas.set(key, row);
  };
  Object.entries(previousStats).forEach(([playerId, item]) => {
    addDelta(accountDoc('player_stats', safeId(playerId)), playerId, item, -1);
    addDelta(accountDoc('months', safeId(previousMonth), 'stats', safeId(playerId)), playerId, item, -1);
  });
  Object.entries(nextStats).forEach(([playerId, item]) => {
    addDelta(accountDoc('player_stats', safeId(playerId)), playerId, item, 1);
    addDelta(accountDoc('months', safeId(nextMonth), 'stats', safeId(playerId)), playerId, item, 1);
  });

  const babaRef = accountDoc('babas', safeId(nextBaba.id));
  await runTransaction(db, async (transaction) => {
    const babaSnapshot = await transaction.get(babaRef);
    if (babaSnapshot.data()?.statsRevisionSignature === revisionSignature) return;
    const rows = [];
    for (const row of deltas.values()) rows.push({ ...row, snapshot: await transaction.get(row.ref) });
    rows.forEach(({ ref, playerId, nome, values, snapshot }) => {
      const current = snapshot.data() || {};
      const next = { ...current, jogadorId: playerId, playerId, nome: nome || current.nome || 'Jogador' };
      numericFields.forEach((field) => {
        next[field] = Math.max(0, Number(current[field] || 0) + Number(values[field] || 0));
      });
      const points = next.totalVitorias * 3 + next.totalEmpates;
      next.aproveitamento = next.totalJogos ? Math.round((points / (next.totalJogos * 3)) * 100) : 0;
      next.schemaVersion = SCHEMA_VERSION;
      next.updatedAtMs = now();
      transaction.set(ref, compact(next), { merge: true });
    });
    [previousMonth, nextMonth].filter(Boolean).forEach((monthKey) => transaction.set(
      accountDoc('months', safeId(monthKey)),
      { id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false },
      { merge: true },
    ));
    transaction.set(babaRef, { statsApplied: true, statsRevisionSignature: revisionSignature, updatedAtMs: now() }, { merge: true });
  });
}

async function markRemovedBabas(nextState, previousState) {
  if (!previousState) return;
  const nextIds = new Set((nextState.babas || []).map((baba) => baba.id));
  const removed = (previousState.babas || []).filter((baba) => !nextIds.has(baba.id));
  for (const baba of removed) await applyBabaStatsDelta(previousState, baba, -1);
  const operations = removed.map((baba) => setOperation(accountDoc('babas', safeId(baba.id)), {
      id: baba.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(),
    }));
  await commitOperations(operations);
}

function signature(value) {
  const copy = clone(value) || {};
  delete copy.undoStack;
  delete copy.rankingDoBaba;
  delete copy.__detailLoaded;
  return stableSignature(copy);
}

function pointerStateData(state) {
  const active = state.babas?.find((baba) => baba.id === state.activeBabaId);
  return {
    activeBabaId: state.activeBabaId || null,
    status: active?.status || 'idle',
    currentGameId: active?.jogoAtual ? gameIdFor(active.jogoAtual) : null,
    schemaVersion: SCHEMA_VERSION,
  };
}

async function persistState(nextState, previousState = lastLocalState, { migration = false, skipPointer = false } = {}) {
  await persistGlobalData(nextState, previousState);
  const previousById = new Map((previousState?.babas || []).map((baba) => [baba.id, baba]));
  for (const baba of nextState.babas || []) {
    const previousBaba = previousById.get(baba.id);
    if (migration || !previousBaba || signature(previousBaba) !== signature(baba)) {
      await persistBaba(nextState, baba, previousBaba, previousState);
      if (!migration && previousBaba?.status === 'finalizado' && baba.status === 'finalizado') {
        await applyFinishedBabaStatsRevision(previousState, previousBaba, nextState, baba);
      }
    }
    if (!migration && baba.status === 'finalizado' && previousBaba?.status !== 'finalizado') {
      await applyBabaStatsDelta(nextState, baba, 1);
    }
  }
  await markRemovedBabas(nextState, previousState);
  if (migration) await persistAggregateStats(nextState);
  if (skipPointer) return;
  const pointerState = pointerStateData(nextState);
  const nextPointerSignature = stableSignature(pointerState);
  if (nextPointerSignature === lastPointerSignature) return;
  if (latestPointerData?.schemaVersion === SCHEMA_VERSION
    && latestPointerData.sourceId !== deviceId
    && Number(latestPointerData.updatedAtMs || 0) > Number(nextState.updatedAt || 0) + SAVE_DEBOUNCE_MS) {
    throw new Error('A copia remota e mais recente. As alteracoes locais ficaram na fila para sincronizar depois.');
  }
  const pointerData = compact({
    ...pointerState,
    sourceId: deviceId,
    updatedAt: serverTimestamp(),
    updatedAtMs: now(),
  });
  await setDoc(pointerRef(), pointerData, { merge: true });
  latestPointerData = { ...pointerState, sourceId: deviceId, updatedAtMs: pointerData.updatedAtMs };
  lastPointerSignature = nextPointerSignature;
}

async function backupLegacyState(state, migrationId) {
  const raw = JSON.stringify(state);
  const chunks = [];
  for (let offset = 0; offset < raw.length; offset += BACKUP_CHUNK_SIZE) chunks.push(raw.slice(offset, offset + BACKUP_CHUNK_SIZE));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const checksum = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const migrationRef = accountDoc('migrations', migrationId);
  await setDoc(migrationRef, {
    status: 'running',
    sourcePath: pointerRef().path,
    targetBabaId: state.activeBabaId || null,
    schemaFrom: Number(state.version || 1),
    schemaTo: SCHEMA_VERSION,
    chunkCount: chunks.length,
    sourceBytes: estimateJsonSize(state),
    checksum,
    startedAt: serverTimestamp(),
    startedAtMs: now(),
  }, { merge: true });
  await commitOperations(chunks.map((data, index) => setOperation(
    accountDoc('migrations', migrationId, 'legacy_chunks', String(index).padStart(4, '0')),
    { index, data, schemaVersion: SCHEMA_VERSION },
    { merge: false },
  )));
  return { chunks: chunks.length, checksum };
}

async function validateMigration(state) {
  const result = { babas: 0, participants: 0, teams: 0, games: 0, goals: 0, payments: 0, stats: 0 };
  for (const baba of state.babas || []) {
    const babaId = safeId(baba.id);
    const babaSnapshot = await getDoc(accountDoc('babas', babaId));
    if (!babaSnapshot.exists()) throw new Error(`Baba ${babaId} nao foi criado.`);
    result.babas += 1;
    const games = [...(baba.jogos || [])];
    if (baba.jogoAtual) games.push(baba.jogoAtual);
    const expected = {
      participants: participantDocuments(state, baba).length,
      teams: (baba.teams || []).length,
      games: games.length,
      goals: games.reduce((total, game) => total + allGoalEvents(game, gameIdFor(game)).length, 0),
      payments: Object.keys(baba.pagamentos || {}).length,
      stats: Object.keys(computeBabaStats(baba, new Map((state.players || []).map((player) => [player.id, player])))).length,
    };
    for (const name of ['participants', 'teams', 'games', 'goals', 'payments', 'stats']) {
      const snapshot = await getDocs(query(
        accountCollection('babas', babaId, name),
        limit(QUERY_LIMITS[name] || 250),
      ));
      const activeCount = snapshot.docs.filter((item) => !item.data().deleted).length;
      if (activeCount !== expected[name]) {
        throw new Error(`Contagem divergente em ${babaId}/${name}: esperado ${expected[name]}, encontrado ${activeCount}.`);
      }
      result[name] += activeCount;
    }
  }
  if (result.babas !== (state.babas || []).length) throw new Error('Contagem de Babas divergente apos migracao.');
  return result;
}

async function migrateLegacyState(state) {
  if (migrationRunning || !hasUsefulState(state)) return;
  migrationRunning = true;
  const migrationId = safeId(`baba_schema_v2_${state.activeBabaId || 'catalog'}`);
  const migrationRef = accountDoc('migrations', migrationId);
  updateStatus('online', 'Migrando', 'Preparando os dados do Baba para o novo armazenamento.');
  try {
    const existing = await getDoc(migrationRef);
    if (existing.data()?.status === 'completed') {
      await setDoc(pointerRef(), {
        activeBabaId: state.activeBabaId || null,
        status: state.babas?.find((baba) => baba.id === state.activeBabaId)?.status || 'idle',
        currentGameId: null,
        schemaVersion: SCHEMA_VERSION,
        migrationId,
        updatedAt: serverTimestamp(),
        updatedAtMs: now(),
      }, { merge: false });
      return;
    }
    const backup = await backupLegacyState(state, migrationId);
    await persistState(state, null, { migration: true, skipPointer: true });
    const counts = await validateMigration(state);
    await setDoc(migrationRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedAtMs: now(),
      backupChunks: backup.chunks,
      backupChecksum: backup.checksum,
      validatedCounts: counts,
    }, { merge: true });
    await setDoc(pointerRef(), {
      activeBabaId: state.activeBabaId || null,
      status: state.babas?.find((baba) => baba.id === state.activeBabaId)?.status || 'idle',
      currentGameId: state.babas?.find((baba) => baba.id === state.activeBabaId)?.jogoAtual
        ? gameIdFor(state.babas.find((baba) => baba.id === state.activeBabaId).jogoAtual)
        : null,
      schemaVersion: SCHEMA_VERSION,
      migrationId,
      sourceId: deviceId,
      updatedAt: serverTimestamp(),
      updatedAtMs: now(),
    }, { merge: false });
    updateStatus('online', 'Online', 'Migracao concluida e Baba sincronizado no schema v2.');
  } catch (error) {
    await setDoc(migrationRef, {
      status: 'failed',
      error: String(error?.message || error).slice(0, 900),
      failedAt: serverTimestamp(),
      failedAtMs: now(),
    }, { merge: true }).catch(() => {});
    updateStatus('offline', isPermissionError(error) ? 'Atualize as regras' : 'Falha na migracao',
      isPermissionError(error)
        ? 'O schema v2 esta pronto, mas as novas regras do Firestore ainda precisam ser publicadas.'
        : 'Os dados antigos foram mantidos. A migracao pode ser retomada com seguranca.');
    console.error('Falha ao migrar Baba para schema v2:', error);
    throw error;
  } finally {
    migrationRunning = false;
  }
}

function restoreGameShape(game, goals) {
  const events = goals
    .filter((goal) => goal.gameId === game.id && !goal.deleted)
    .sort((a, b) => Number(a.createdAtMs || 0) - Number(b.createdAtMs || 0))
    .map((goal) => ({
      id: goal.id,
      jogadorId: goal.playerId,
      jogadorNome: goal.playerNameSnapshot,
      external: Boolean(goal.external),
      time: goal.teamId,
      timeNome: goal.teamNameSnapshot,
      minuto: goal.minute,
      registradoEm: goal.createdAtMs,
    }));
  const teamAId = game.timeA || game.teamAId;
  const teamBId = game.timeB || game.teamBId;
  const scoreA = Number(game.placarA ?? game.scoreA ?? events.filter((goal) => goal.time === teamAId).length);
  const scoreB = Number(game.placarB ?? game.scoreB ?? events.filter((goal) => goal.time === teamBId).length);
  const restored = {
    ...game,
    numeroJogo: Number(game.numeroJogo || game.sequence || 1),
    timeA: teamAId,
    timeB: teamBId,
    placarA: scoreA,
    placarB: scoreB,
    vencedor: scoreA === scoreB ? null : (game.vencedor || game.winnerTeamId || (scoreA > scoreB ? teamAId : teamBId)),
    perdedor: scoreA === scoreB ? null : (game.perdedor || game.loserTeamId || (scoreA > scoreB ? teamBId : teamAId)),
    empate: scoreA === scoreB,
    resultado: scoreA === scoreB ? 'empate' : 'vitoria',
    goalEvents: events,
    gols: aggregateGoals(events),
  };
  ['id', 'sequence', 'teamAId', 'teamBId', 'scoreA', 'scoreB', 'winnerTeamId', 'loserTeamId', 'draw', 'schemaVersion', 'deleted', 'updatedAtMs']
    .forEach((field) => delete restored[field]);
  return restored;
}

function restoreBabaFromSnapshots(babaId, snapshots) {
  const id = safeId(babaId);
  const {
    meta: metaSnapshot,
    participants: participantsSnapshot,
    teams: teamsSnapshot,
    games: gamesSnapshot,
    goals: goalsSnapshot,
    payments: paymentsSnapshot,
    stats: statsSnapshot,
  } = snapshots;
  if (!metaSnapshot.exists() || metaSnapshot.data().deleted) return null;
  const meta = metaSnapshot.data();
  const participants = participantsSnapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
  const teams = teamsSnapshot.docs.map((item) => ({ ...item.data(), jogadores: [] })).filter((item) => !item.deleted);
  participants.forEach((participant) => {
    const team = teams.find((item) => item.id === participant.teamId);
    if (team) team.jogadores.push(participant.playerId);
  });
  teams.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  teams.forEach((team) => ['order', 'schemaVersion', 'deleted', 'updatedAtMs'].forEach((field) => delete team[field]));
  const goalDocs = goalsSnapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
  const gameDocs = gamesSnapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
  const restoredGames = gameDocs.map((game) => ({ id: game.id, value: restoreGameShape(game, goalDocs), status: game.status }));
  const current = restoredGames.find((game) => game.id === meta.currentGameId && game.status !== 'finished');
  const payments = {};
  paymentsSnapshot.docs.forEach((item) => { if (!item.data().deleted) payments[item.id] = Boolean(item.data().paid); });
  const rankingDoBaba = {};
  statsSnapshot.docs.forEach((item) => { if (!item.data().deleted) rankingDoBaba[item.id] = item.data(); });
  const visitors = participants.filter((item) => item.visitor).map((item) => ({
    id: item.playerId,
    nome: item.nameSnapshot || item.name,
    tipo: item.type || 'visitante',
    ativo: item.active !== false,
    visitante: true,
    criadoEm: item.joinedAt,
  }));
  const participantFlags = participants.reduce((flags, item) => {
    flags[item.playerId] = {
      guest: Boolean(item.guest || item.visitor),
      goalkeeper: Boolean(item.goalkeeper || item.type === 'goleiro'),
      novice: Boolean(item.novice),
      typedName: item.typedName || item.nameSnapshot || item.name || '',
    };
    return flags;
  }, {});
  const localUndo = readLocalState()?.babas?.find((item) => item.id === id)?.undoStack || [];
  return compact({
    __detailLoaded: true,
    id: meta.id || id,
    dataISO: meta.dataISO || meta.dateKey,
    dataCompleta: meta.dataCompleta,
    dia: meta.dia,
    mes: meta.mes,
    ano: meta.ano,
    status: meta.status,
    matchMode: meta.matchMode || 'ONLINE',
    jogadoresPresentes: participants.filter((item) => item.present && !item.visitor).map((item) => item.playerId),
    visitantes: visitors,
    participantFlags,
    pagamentos: payments,
    teams,
    filaTimes: meta.filaTimes || meta.currentQueue || [],
    jogoAtual: current?.value || null,
    jogos: restoredGames.filter((game) => game.status === 'finished').map((game) => game.value).sort((a, b) => a.numeroJogo - b.numeroJogo),
    rankingDoBaba,
    campeaoDoBaba: meta.campeaoDoBaba || null,
    lastResult: meta.lastResult || null,
    pendingTieBreak: meta.pendingTieBreak || null,
    teamRevealIndex: Number(meta.teamRevealIndex || 0),
    importId: meta.importId || null,
    observacoes: meta.observations || '',
    importedTotalGoals: meta.importedTotalGoals ?? null,
    undoStack: localUndo,
    criadoEm: Number(meta.criadoEm || now()),
    finalizadoEm: meta.finalizadoEm || null,
  });
}

async function fetchBaba(babaId) {
  const id = safeId(babaId);
  const [meta, participants, teams, games, goals, payments, stats] = await Promise.all([
    getDoc(accountDoc('babas', id)),
    getDocs(query(accountCollection('babas', id, 'participants'), limit(QUERY_LIMITS.participants))),
    getDocs(query(accountCollection('babas', id, 'teams'), limit(QUERY_LIMITS.teams))),
    getDocs(query(accountCollection('babas', id, 'games'), limit(QUERY_LIMITS.games))),
    getDocs(query(accountCollection('babas', id, 'goals'), limit(QUERY_LIMITS.goals))),
    getDocs(query(accountCollection('babas', id, 'payments'), limit(QUERY_LIMITS.payments))),
    getDocs(query(accountCollection('babas', id, 'stats'), limit(QUERY_LIMITS.stats))),
  ]);
  return restoreBabaFromSnapshots(id, { meta, participants, teams, games, goals, payments, stats });
}

function mergeRemoteIntoLocal() {
  if (localWritePending) {
    remoteFlushDeferred = true;
    return null;
  }
  remoteFlushDeferred = false;
  const current = readLocalState() || emptyState();
  const next = { ...current };
  if (window.__babaRemotePlayers) next.players = clone(window.__babaRemotePlayers);
  if (window.__babaRemotePurchaseGoals) next.purchaseGoals = clone(window.__babaRemotePurchaseGoals);
  if (window.__babaRemoteMonthlyPayments) {
    const localMonthlyPayments = clone(current.monthlyPayments) || {};
    const remoteMonthlyPayments = clone(window.__babaRemoteMonthlyPayments) || {};
    next.monthlyPayments = { ...localMonthlyPayments };
    Object.entries(remoteMonthlyPayments).forEach(([monthKey, remoteRecord]) => {
      const localRecord = localMonthlyPayments[monthKey] || {};
      next.monthlyPayments[monthKey] = window.BabaManagementCore.mergePaymentRecords(localRecord, remoteRecord);
    });
  }
  if (window.__babaRemotePlayerStats) next.playerStats = clone(window.__babaRemotePlayerStats);
  next.monthlyStats = {
    ...(clone(current.monthlyStats) || {}),
    ...Object.fromEntries(monthStatsCache.entries()),
  };
  const metadata = window.__babaRemoteMetadata || [];
  const localBabas = replaceHistoryOnNextMerge
    ? (current.babas || []).filter((baba) => baba.id === activeBabaId && baba.status !== 'finalizado')
    : (current.babas || []);
  const byId = new Map(localBabas.map((baba) => [baba.id, baba]));
  replaceHistoryOnNextMerge = false;
  metadata.forEach((meta) => {
    if (meta.deleted) {
      byId.delete(meta.id);
      loadedBabas.delete(meta.id);
      finishedBabaStatsCache.delete(meta.id);
    }
    else if (!loadedBabas.has(meta.id)) {
      const existing = byId.get(meta.id) || {};
      byId.set(meta.id, compact({
        ...existing,
        id: meta.id,
        dataISO: meta.dataISO || meta.dateKey,
        dataCompleta: meta.dataCompleta,
        dia: meta.dia,
        mes: meta.mes,
        ano: meta.ano,
        status: meta.status,
        matchMode: meta.matchMode || 'ONLINE',
        criadoEm: meta.criadoEm,
        finalizadoEm: meta.finalizadoEm || null,
        campeaoDoBaba: meta.campeaoDoBaba || null,
        lastResult: meta.lastResult || null,
        teams: existing.teams || [],
        jogos: existing.jogos || [],
        jogadoresPresentes: existing.jogadoresPresentes || [],
        visitantes: existing.visitantes || [],
        pagamentos: existing.pagamentos || {},
        filaTimes: meta.filaTimes || meta.currentQueue || [],
        jogoAtual: existing.jogoAtual || null,
        rankingDoBaba: finishedBabaStatsCache.get(meta.id) || existing.rankingDoBaba || {},
        undoStack: existing.undoStack || [],
      }));
    }
  });
  loadedBabas.forEach((baba, id) => { if (baba) byId.set(id, clone(baba)); });
  next.babas = [...byId.values()].sort((a, b) => Number(b.criadoEm || 0) - Number(a.criadoEm || 0));
  next.activeBabaId = activeBabaId || null;
  const viewSignature = stateViewSignature(next);
  if (viewSignature === lastRemoteViewSignature || viewSignature === stateViewSignature(current)) {
    lastRemoteViewSignature = viewSignature;
    return next;
  }
  lastRemoteViewSignature = viewSignature;
  next.updatedAt = now();
  applyingRemote = true;
  try {
    const raw = stateRaw(next);
    tools?.writeCurrentBabaRaw?.(raw, { remote: true });
    lastLocalState = clone(next);
    lastPersistedSignature = persistenceSignature(next);
    window.dispatchEvent(new CustomEvent('baba-remote-state-ready', {
      detail: { source: 'baba-schema-v2', state: next, raw },
    }));
  } finally {
    applyingRemote = false;
  }
  return next;
}

function scheduleRemoteFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(mergeRemoteIntoLocal, 80);
}

function syncMonthStatsCacheFromState(state) {
  if (!state?.monthlyStats || typeof state.monthlyStats !== 'object' || Array.isArray(state.monthlyStats)) return;
  monthStatsCache.clear();
  Object.entries(state.monthlyStats).forEach(([monthKey, ranking]) => {
    monthStatsCache.set(monthKey, clone(ranking || {}));
  });
}

function subscribe(key, refOrQuery, handler, errorLabel) {
  if (subscriptionsByKey.has(key)) return subscriptionsByKey.get(key);
  const stopSnapshot = onSnapshot(refOrQuery, handler, (error) => {
    console.error(`Falha no listener ${errorLabel}:`, error);
    updateStatus('offline', 'Offline', 'A sincronizacao foi interrompida; os dados locais foram preservados.');
  });
  const unsubscribe = () => {
    stopSnapshot();
    subscriptionsByKey.delete(key);
    unsubscribers.delete(unsubscribe);
  };
  subscriptionsByKey.set(key, unsubscribe);
  unsubscribers.add(unsubscribe);
  return unsubscribe;
}

async function loadBaba(babaId, { realtime = false } = {}) {
  if (!babaId) return null;
  const id = safeId(babaId);
  if (realtime) {
    if (!activeSubscriptions.has(id)) {
      const targets = [
        ['meta', accountDoc('babas', id)],
        ['participants', query(accountCollection('babas', id, 'participants'), limit(QUERY_LIMITS.participants))],
        ['teams', query(accountCollection('babas', id, 'teams'), limit(QUERY_LIMITS.teams))],
        ['games', query(accountCollection('babas', id, 'games'), limit(QUERY_LIMITS.games))],
        ['goals', query(accountCollection('babas', id, 'goals'), limit(QUERY_LIMITS.goals))],
        ['payments', query(accountCollection('babas', id, 'payments'), limit(QUERY_LIMITS.payments))],
        ['stats', query(accountCollection('babas', id, 'stats'), limit(QUERY_LIMITS.stats))],
      ];
      const parts = {};
      activeSnapshotParts.set(id, parts);
      const localUnsubscribers = targets.map(([partName, target]) => subscribe(
        `active:${id}:${partName}`,
        target,
        (snapshot) => {
          parts[partName] = snapshot;
          if (!targets.every(([requiredPart]) => parts[requiredPart])) return;
          const refreshed = restoreBabaFromSnapshots(id, parts);
          loadedBabas.set(id, refreshed);
          if (refreshed?.status === 'finalizado') {
            finishedBabaStatsCache.set(id, clone(refreshed.rankingDoBaba || {}));
          }
          scheduleRemoteFlush();
        },
        `do Baba ${id}`,
      ));
      activeSubscriptions.set(id, () => {
        localUnsubscribers.forEach((unsubscribe) => unsubscribe());
        activeSnapshotParts.delete(id);
      });
    }
    return loadedBabas.get(id)
      || readLocalState()?.babas?.find((item) => item.id === id)
      || null;
  }
  const baba = await fetchBaba(id);
  loadedBabas.set(id, baba);
  if (baba?.status === 'finalizado') finishedBabaStatsCache.set(id, clone(baba.rankingDoBaba || {}));
  scheduleRemoteFlush();
  return baba;
}

async function loadMonthStats(monthKey) {
  if (!monthKey || monthStatsCache.has(monthKey)) return monthStatsCache.get(monthKey) || {};
  const snapshot = await getDocs(query(
    accountCollection('months', safeId(monthKey), 'stats'),
    limit(QUERY_LIMITS.stats),
  ));
  const ranking = {};
  snapshot.docs.forEach((item) => { if (!item.data().deleted) ranking[item.id] = item.data(); });
  monthStatsCache.set(monthKey, ranking);
  scheduleRemoteFlush();
  return ranking;
}

async function loadMonthPayments(monthKey) {
  const id = safeId(monthKey);
  if (!id) return {};
  if (monthPaymentsCache.has(id)) return monthPaymentsCache.get(id);
  const snapshot = await getDocs(query(
    accountCollection('months', id, 'payments'),
    limit(QUERY_LIMITS.payments),
  ));
  const activePayments = snapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
  const record = {
    pagamentos: Object.fromEntries(activePayments.map((item) => [item.playerId || item.id, Boolean(item.paid)])),
    paymentUpdatedAtMs: Object.fromEntries(activePayments.map((item) => [item.playerId || item.id, Number(item.updatedAtMs || 0)])),
    atualizadoEm: Math.max(0, ...activePayments.map((item) => Number(item.updatedAtMs || 0))),
  };
  monthPaymentsCache.set(id, record);
  window.__babaRemoteMonthlyPayments = {
    ...(window.__babaRemoteMonthlyPayments || {}),
    [id]: record,
  };
  scheduleRemoteFlush();
  return record;
}

function startMonthPaymentsSubscription(monthKey) {
  const id = safeId(monthKey);
  if (!id) return;
  subscribe(`month:${id}:payments`, query(
    accountCollection('months', id, 'payments'),
    limit(QUERY_LIMITS.payments),
  ), (snapshot) => {
    const activePayments = snapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
    const record = {
      pagamentos: Object.fromEntries(activePayments.map((item) => [item.playerId || item.id, Boolean(item.paid)])),
      paymentUpdatedAtMs: Object.fromEntries(activePayments.map((item) => [item.playerId || item.id, Number(item.updatedAtMs || 0)])),
      atualizadoEm: Math.max(0, ...activePayments.map((item) => Number(item.updatedAtMs || 0))),
    };
    monthPaymentsCache.set(id, record);
    window.__babaRemoteMonthlyPayments = {
      ...(window.__babaRemoteMonthlyPayments || {}),
      [id]: record,
    };
    scheduleRemoteFlush();
  }, `de pagamentos de ${id}`);
}

function startPlayersSubscription() {
  subscribe('global:players', query(accountCollection('players'), limit(QUERY_LIMITS.players)), (snapshot) => {
    remotePlayerDocumentIds.clear();
    window.__babaRemotePlayers = snapshot.docs.map((snapshotItem) => {
      const item = snapshotItem.data() || {};
      const canonicalId = item.playerId || item.id || snapshotItem.id;
      remotePlayerDocumentIds.set(String(canonicalId), snapshotItem.id);
      remotePlayerDocumentIds.set(safeId(canonicalId, ''), snapshotItem.id);
      return { ...item, id: canonicalId };
    }).filter((item) => (
      !item.deleted
      && !deletedPlayerIds.has(String(item.playerId || item.id || '').trim())
      && !deletedPlayerIds.has(safeId(item.playerId || item.id, ''))
    )).map((item) => ({
      id: item.playerId || item.id,
      nome: item.nome || item.name,
      tipo: item.tipo || item.type || 'jogador',
      ativo: item.ativo !== false,
      status: item.status || '',
      convidado: item.convidado === true,
      novato: item.novato === true,
      noviceActive: item.noviceActive === true || item.novato === true,
      noviceSinceMs: item.noviceSinceMs || null,
      noviceReason: item.noviceReason || '',
      noviceReasonImportId: item.noviceReasonImportId || null,
      firstBabaId: item.firstBabaId || null,
      firstBabaDate: item.firstBabaDate || null,
      normalizedName: item.normalizedName || '',
      normalizedAliasKey: item.normalizedAliasKey || '',
      criadoEm: item.criadoEm || item.createdAtMs || now(),
    }));
    scheduleRemoteFlush();
  }, 'de jogadores');
}

function startPurchaseGoalsSubscription() {
  subscribe('global:purchase-goals', query(accountCollection('purchase_goals'), limit(QUERY_LIMITS.purchaseGoals)), (snapshot) => {
    window.__babaRemotePurchaseGoals = snapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
    scheduleRemoteFlush();
  }, 'de metas');
}

function startPlayerStatsSubscription() {
  subscribe('global:player-stats', query(accountCollection('player_stats'), limit(QUERY_LIMITS.players)), (snapshot) => {
    window.__babaRemotePlayerStats = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]));
    scheduleRemoteFlush();
  }, 'do ranking geral');
}

function startHistorySubscription() {
  subscribe('global:recent-babas', query(accountCollection('babas'), orderBy('criadoEm', 'desc'), limit(RECENT_BABA_LIMIT)), (snapshot) => {
    window.__babaRemoteMetadata = snapshot.docs.map((item) => item.data());
    historyCursor = snapshot.docs[snapshot.docs.length - 1] || null;
    hasMoreHistory = snapshot.size === RECENT_BABA_LIMIT;
    replaceHistoryOnNextMerge = true;
    scheduleRemoteFlush();
  }, 'do historico');
}

async function refreshAccountData(candidateAccountId = '') {
  const requestedAccountId = resolveAccountId(candidateAccountId);
  if (!requestedAccountId) throw new Error('Conta do organizador não identificada.');
  if (activeAccountId && activeAccountId !== requestedAccountId) {
    throw new Error('O código informado pertence a outra conta. Recarregue a página e tente novamente.');
  }
  activeAccountId = requestedAccountId;
  await startRepository();
  const snapshot = await getDocs(query(
    accountCollection('babas'),
    orderBy('criadoEm', 'desc'),
    limit(RECENT_BABA_LIMIT),
  ));
  window.__babaRemoteMetadata = snapshot.docs.map((item) => item.data());
  historyCursor = snapshot.docs[snapshot.docs.length - 1] || null;
  hasMoreHistory = snapshot.size === RECENT_BABA_LIMIT;
  replaceHistoryOnNextMerge = true;
  const merged = mergeRemoteIntoLocal();
  startHistorySubscription();
  return merged || readLocalState() || emptyState();
}

function startMonthsSubscription() {
  subscribe('global:months', query(
    accountCollection('months'),
    orderBy('monthKey', 'desc'),
    limit(QUERY_LIMITS.months),
  ), (snapshot) => {
    const months = snapshot.docs.map((item) => item.id);
    const currentMonth = new Date().toISOString().slice(0, 7);
    window.__babaRemoteMonthKeys = months;
    startMonthPaymentsSubscription(currentMonth);
    if (months.includes(currentMonth)) {
      loadMonthStats(currentMonth).catch((error) => console.warn('Falha ao carregar ranking do mes atual:', error));
    }
  }, 'dos meses');
}

function startV2Subscriptions() {
  if (v2SubscriptionsStarted) return;
  v2SubscriptionsStarted = true;
  startPlayersSubscription();
  startPlayerStatsSubscription();
  startHistorySubscription();
  startMonthsSubscription();
}

async function loadAllHistoryRankings() {
  if (allHistoryRankingsPromise) return allHistoryRankingsPromise;
  allHistoryRankingsPromise = (async () => {
    await startRepository();
    if (!activeAccountId) throw new Error('Conta do Baba ainda nao identificada.');

    const metadata = new Map();
    let cursor = null;
    let pageCount = 0;
    do {
      const constraints = [orderBy('criadoEm', 'desc')];
      if (cursor) constraints.push(startAfter(cursor));
      constraints.push(limit(RECENT_BABA_LIMIT));
      const snapshot = await getDocs(query(accountCollection('babas'), ...constraints));
      snapshot.docs.forEach((item) => {
        const data = item.data() || {};
        if (!data.deleted && data.status === 'finalizado') metadata.set(data.id || item.id, data);
      });
      cursor = snapshot.docs[snapshot.docs.length - 1] || null;
      pageCount += 1;
      if (snapshot.size < RECENT_BABA_LIMIT || pageCount >= 200) break;
    } while (cursor);

    const rows = [...metadata.entries()];
    const result = {};
    for (let index = 0; index < rows.length; index += 6) {
      const batch = rows.slice(index, index + 6);
      const rankings = await Promise.all(batch.map(async ([babaId, meta]) => {
        const embedded = meta.rankingDoBaba && typeof meta.rankingDoBaba === 'object'
          ? meta.rankingDoBaba
          : null;
        if (embedded && Object.keys(embedded).length) return embedded;
        if (finishedBabaStatsCache.has(babaId)) return finishedBabaStatsCache.get(babaId) || {};
        const snapshot = await getDocs(query(
          accountCollection('babas', safeId(babaId), 'stats'),
          limit(QUERY_LIMITS.stats),
        ));
        const ranking = {};
        snapshot.docs.forEach((item) => {
          const data = item.data() || {};
          if (!data.deleted) ranking[data.jogadorId || data.playerId || item.id] = data;
        });
        finishedBabaStatsCache.set(babaId, ranking);
        return ranking;
      }));
      batch.forEach(([babaId, meta], batchIndex) => {
        result[babaId] = {
          id: babaId,
          dataISO: meta.dataISO || meta.dateKey || '',
          ranking: clone(rankings[batchIndex]) || {},
        };
      });
    }
    return result;
  })().catch((error) => {
    allHistoryRankingsPromise = null;
    throw error;
  });
  return allHistoryRankingsPromise;
}

function activateView(viewName) {
  const view = String(viewName || 'dashboard');
  if (view === 'goals') startPurchaseGoalsSubscription();
  if (view === 'ranking') {
    startPlayerStatsSubscription();
    startMonthsSubscription();
    startHistorySubscription();
  }
  if (view === 'organizer') startMonthsSubscription();
  if (view === 'history') startHistorySubscription();
}

async function loadMoreHistory() {
  if (!historyCursor || !hasMoreHistory) return [];
  const snapshot = await getDocs(query(
    accountCollection('babas'),
    orderBy('criadoEm', 'desc'),
    startAfter(historyCursor),
    limit(RECENT_BABA_LIMIT),
  ));
  historyCursor = snapshot.docs[snapshot.docs.length - 1] || historyCursor;
  hasMoreHistory = snapshot.size === RECENT_BABA_LIMIT;
  const current = window.__babaRemoteMetadata || [];
  const byId = new Map(current.map((item) => [item.id, item]));
  snapshot.docs.forEach((item) => {
    if (item.data().deleted) byId.delete(item.id);
    else byId.set(item.id, item.data());
  });
  window.__babaRemoteMetadata = [...byId.values()];
  scheduleRemoteFlush();
  return snapshot.docs.map((item) => item.data());
}

async function startPointerListener() {
  if (pointerListenerStarted) return;
  pointerListenerStarted = true;
  subscribe('pointer:active-baba', pointerRef(), async (snapshot) => {
    const data = snapshot.data() || {};
    if (Number(data.schemaVersion || 0) < SCHEMA_VERSION) return;
    latestPointerData = data;
    lastPointerSignature = stableSignature({
      activeBabaId: data.activeBabaId || null,
      status: data.status || 'idle',
      currentGameId: data.currentGameId || null,
      schemaVersion: SCHEMA_VERSION,
    });
    const nextActiveId = data.activeBabaId || null;
    if (activeBabaId !== nextActiveId) {
      if (activeBabaId && activeSubscriptions.has(activeBabaId)) {
        activeSubscriptions.get(activeBabaId)();
        activeSubscriptions.delete(activeBabaId);
      }
      activeBabaId = nextActiveId;
    }
    if (activeBabaId && !activeSubscriptions.has(activeBabaId)) {
      await loadBaba(activeBabaId, { realtime: true });
    } else if (!activeBabaId) scheduleRemoteFlush();
    updateStatus('online', 'Online', 'Baba sincronizado no armazenamento v2.');
  }, 'do ponteiro ativo');
}

function writePendingSave(job) {
  if (!job) return;
  try {
    getNativeStore().setItem(pendingSyncKey(), JSON.stringify({
      raw: stateRaw(job.state),
      baseRaw: stateRaw(lastLocalState || emptyState()),
      signature: job.signature,
      reason: job.reason,
      generation: job.generation,
      attempts: Number(job.attempts || 0),
      queuedAt: Number(job.queuedAt || now()),
    }));
  } catch (error) {
    console.warn('Nao foi possivel registrar a fila local do Baba:', error);
  }
}

function clearPendingSave() {
  try {
    getNativeStore().removeItem(pendingSyncKey());
  } catch (error) {
    console.warn('Nao foi possivel limpar a fila local do Baba:', error);
  }
}

function readPendingSave() {
  try {
    const record = JSON.parse(getNativeStore().getItem(pendingSyncKey()) || 'null');
    const state = parseState(record?.raw);
    const baseState = parseState(record?.baseRaw);
    if (!hasUsefulState(state)) return null;
    return {
      state,
      baseState,
      signature: record.signature || persistenceSignature(state),
      reason: record.reason || 'restored-local-queue',
      generation: Number(record.generation || 0),
      attempts: Math.min(MAX_SAVE_ATTEMPTS, Math.max(0, Number(record.attempts || 0))),
      queuedAt: Number(record.queuedAt || now()),
    };
  } catch (error) {
    console.warn('A fila local do Baba estava invalida e foi ignorada:', error);
    return null;
  }
}

function updateLocalWriteState() {
  localWritePending = Boolean(saveInFlight || queuedSave);
  window.dispatchEvent(new CustomEvent('baba-save-progress', {
    detail: {
      saving: saveInFlight,
      queued: Boolean(queuedSave),
      backoff: backoffUntil > now(),
    },
  }));
  if (!localWritePending && remoteFlushDeferred) scheduleRemoteFlush();
}

function scheduleQueuedSave(delay = SAVE_DEBOUNCE_MS) {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!queuedSave || saveInFlight) return;
  const remainingBackoff = Math.max(0, backoffUntil - now());
  saveTimer = setTimeout(processSaveQueue, Math.max(delay, remainingBackoff));
}

function enterSaveBackoff(delay, failedGeneration, canRetry) {
  backoffUntil = now() + delay;
  clearTimeout(backoffTimer);
  backoffTimer = setTimeout(() => {
    backoffTimer = null;
    backoffUntil = 0;
    if (!queuedSave) return;
    const isNewerChange = queuedSave.generation !== failedGeneration;
    if (canRetry || isNewerChange) scheduleQueuedSave(0);
    else {
      updateStatus('offline', 'Sincronizacao pendente',
        'Os dados estao salvos neste dispositivo e serao sincronizados quando a conexao ou a cota estiver disponivel.');
      updateLocalWriteState();
    }
  }, delay);
}

async function processSaveQueue() {
  if (saveInFlight || !queuedSave) return;
  if (backoffUntil > now()) {
    scheduleQueuedSave(backoffUntil - now());
    return;
  }

  const job = queuedSave;
  queuedSave = null;
  saveInFlight = true;
  updateLocalWriteState();
  updateStatus('online', 'Salvando', 'Sincronizando as alteracoes em segundo plano...');
  try {
    diagnoseBabaStateSize(job.state);
    await persistState(job.state, lastLocalState);
    lastLocalState = clone(job.state);
    lastPersistedSignature = job.signature;
    if (queuedSave?.signature === lastPersistedSignature) queuedSave = null;
    if (queuedSave) writePendingSave(queuedSave);
    else clearPendingSave();
    updateStatus('online', queuedSave ? 'Alteracoes na fila' : 'Online',
      queuedSave
        ? 'A alteracao mais recente sera sincronizada em instantes.'
        : 'Alteracoes salvas e sincronizadas em tempo real.');
  } catch (error) {
    console.error(`Falha ao salvar Baba (${job.reason}):`, error);
    const failedJob = { ...job, attempts: Number(job.attempts || 0) + 1 };
    if (!queuedSave) queuedSave = failedJob;
    writePendingSave(queuedSave);

    if (isQuotaError(error)) {
      const delay = SAVE_BACKOFF_DELAYS_MS[Math.min(failedJob.attempts - 1, SAVE_BACKOFF_DELAYS_MS.length - 1)];
      const canRetry = failedJob.attempts < MAX_SAVE_ATTEMPTS;
      enterSaveBackoff(delay, failedJob.generation, canRetry);
      updateStatus('offline', canRetry ? 'Firebase ocupado' : 'Sincronizacao pendente',
        canRetry
          ? `O Firebase atingiu o limite temporario. Nova tentativa em ${delay / 1000}s; os dados continuam salvos neste dispositivo.`
          : 'O limite de tentativas foi atingido. Os dados estao salvos neste dispositivo e serao sincronizados depois.');
    } else {
      if (isPermissionError(error) && queuedSave?.generation === failedJob.generation) {
        queuedSave.attempts = MAX_SAVE_ATTEMPTS;
        writePendingSave(queuedSave);
      }
      updateStatus('offline', isPermissionError(error) ? 'Acesso bloqueado' : 'Sincronizacao pendente',
        isPermissionError(error)
          ? 'A gravacao nao foi autorizada. Os dados continuam salvos neste dispositivo.'
          : 'Nao foi possivel sincronizar agora. Os dados estao salvos neste dispositivo e serao enviados depois.');
    }
  } finally {
    saveInFlight = false;
    updateLocalWriteState();
    if (queuedSave && backoffUntil <= now() && Number(queuedSave.attempts || 0) < MAX_SAVE_ATTEMPTS) {
      scheduleQueuedSave(SAVE_DEBOUNCE_MS);
    }
  }
}

function scheduleSave(raw, reason = 'local-change') {
  if (applyingRemote || migrationRunning) return;
  const state = parseState(raw);
  if (!hasUsefulState(state)) return;
  const nextSignature = persistenceSignature(state);
  if (nextSignature === queuedSave?.signature) return;
  if (!saveInFlight && !queuedSave && nextSignature === lastPersistedSignature) return;

  const generation = ++saveGeneration;
  queuedSave = {
    state: clone(state),
    signature: nextSignature,
    reason,
    generation,
    attempts: 0,
    queuedAt: now(),
  };
  syncMonthStatsCacheFromState(state);
  writePendingSave(queuedSave);
  updateLocalWriteState();
  updateStatus('online', 'Alteracoes na fila', 'Os dados foram salvos neste dispositivo e serao sincronizados em instantes.');
  scheduleQueuedSave(SAVE_DEBOUNCE_MS);
}

async function restoreLegacyBackup(migrationId) {
  const migrationSnapshot = await getDoc(accountDoc('migrations', migrationId));
  if (!migrationSnapshot.exists()) throw new Error('Registro de migracao nao encontrado.');
  const chunksSnapshot = await getDocs(accountCollection('migrations', migrationId, 'legacy_chunks'));
  const raw = chunksSnapshot.docs
    .sort((a, b) => Number(a.data().index) - Number(b.data().index))
    .map((item) => item.data().data)
    .join('');
  const state = parseState(raw);
  if (!state) throw new Error('Backup legado invalido.');
  tools?.writeCurrentBabaRaw?.(stateRaw(state), { remote: true });
  tools?.scheduleAppRefresh?.('baba-legacy-backup');
  return state;
}

async function startRepository() {
  if (repositoryStarted || window.__babaPersistenceV2Started || !USE_BABA_SCHEMA_V2 || OFFLINE_TEST_MODE) return;
  const accountId = resolveAccountId();
  if (!accountId) {
    updateStatus('offline', 'Aguardando acesso', 'Entre com Google ou informe o código do jogador.');
    return;
  }
  activeAccountId = accountId;
  repositoryStarted = true;
  window.__babaPersistenceV2Started = true;
  const restoredQueue = readPendingSave();
  lastLocalState = restoredQueue?.baseState || readLocalState() || emptyState();
  lastPersistedSignature = persistenceSignature(lastLocalState);
  if (restoredQueue) {
    saveGeneration = Math.max(saveGeneration, restoredQueue.generation);
    queuedSave = { ...restoredQueue, attempts: 0 };
    writePendingSave(queuedSave);
    updateLocalWriteState();
  }
  diagnoseBabaStateSize(lastLocalState);
  updateStatus('online', 'Conectando', 'Verificando a versao dos dados do Baba.');
  try {
    const pointerSnapshot = await getDoc(pointerRef());
    const pointer = pointerSnapshot.data() || {};
    latestPointerData = pointer;
    if (Number(pointer.schemaVersion || 0) >= SCHEMA_VERSION) {
      lastPointerSignature = stableSignature({
        activeBabaId: pointer.activeBabaId || null,
        status: pointer.status || 'idle',
        currentGameId: pointer.currentGameId || null,
        schemaVersion: SCHEMA_VERSION,
      });
    }
    if (Number(pointer.schemaVersion || 0) >= SCHEMA_VERSION) {
      activeBabaId = pointer.activeBabaId || null;
      startV2Subscriptions();
      await startPointerListener();
    } else {
      const remoteLegacyState = parseState(pointer.state);
      const legacyState = hasUsefulState(lastLocalState)
        && Number(lastLocalState.updatedAt || 0) > Number(remoteLegacyState?.updatedAt || 0)
        ? lastLocalState
        : (remoteLegacyState || lastLocalState);
      if (hasUsefulState(legacyState)) {
        applyingRemote = true;
        try {
          tools?.writeCurrentBabaRaw?.(stateRaw(legacyState), { remote: true });
          tools?.scheduleAppRefresh?.('baba-legacy-compatibility');
        } finally {
          applyingRemote = false;
        }
        await migrateLegacyState(legacyState);
        lastLocalState = clone(legacyState);
        activeBabaId = legacyState.activeBabaId || null;
        startV2Subscriptions();
        await startPointerListener();
      } else {
        await setDoc(pointerRef(), {
          activeBabaId: null,
          status: 'idle',
          currentGameId: null,
          schemaVersion: SCHEMA_VERSION,
          sourceId: deviceId,
          updatedAt: serverTimestamp(),
          updatedAtMs: now(),
        }, { merge: false });
        startV2Subscriptions();
        await startPointerListener();
      }
    }
    if (queuedSave) {
      updateStatus('online', 'Sincronizacao pendente', 'Alteracoes locais encontradas e colocadas na fila de sincronizacao.');
      scheduleQueuedSave(SAVE_DEBOUNCE_MS);
    }
  } catch (error) {
    console.error('Falha ao iniciar repositorio v2 do Baba:', error);
    updateStatus('offline', isPermissionError(error) ? 'Atualize as regras' : 'Offline',
      isPermissionError(error)
        ? 'As regras do Firestore precisam ser publicadas para ativar o schema v2.'
        : 'Nao consegui conectar agora; a copia local continua disponivel.');
  }
}

async function softDeletePlayer(playerId) {
  const originalId = String(playerId || '').trim();
  const id = safeId(playerId, '');
  if (!id) throw new Error('Jogador invalido.');
  const documentId = safeId(remotePlayerDocumentIds.get(originalId) || remotePlayerDocumentIds.get(id) || id, '');
  deletedPlayerIds.add(originalId);
  deletedPlayerIds.add(id);
  deletedPlayerIds.add(documentId);
  if (Array.isArray(window.__babaRemotePlayers)) {
    window.__babaRemotePlayers = window.__babaRemotePlayers.filter((player) => {
      const remoteId = String(player?.id || player?.playerId || '').trim();
      return remoteId !== originalId && safeId(remoteId) !== id;
    });
  }
  try {
    const ref = accountDoc('players', documentId);
    return await setDoc(ref, {
      playerId: id,
      deleted: true,
      schemaVersion: SCHEMA_VERSION,
      updatedAtMs: now()
    }, { merge: true });
  } catch (error) {
    console.error('Falha ao marcar jogador como removido no Firestore:', error);
    throw error;
  }
}

async function setMonthlyPayment(monthKey, playerId, paid, updatedAtMs = now()) {
  const monthId = safeId(monthKey, '');
  const playerDocumentId = safeId(playerId, '');
  if (!monthId || !/^\d{4}-\d{2}$/.test(monthId) || !playerDocumentId) {
    throw new Error('Pagamento mensal invalido.');
  }
  const timestamp = Math.max(1, Number(updatedAtMs || now()));
  const batch = writeBatch(db);
  batch.set(accountDoc('months', monthId), {
    id: monthId,
    monthKey: monthId,
    schemaVersion: SCHEMA_VERSION,
    updatedAtMs: timestamp,
    deleted: false,
  }, { merge: true });
  batch.set(accountDoc('months', monthId, 'payments', playerDocumentId), {
    playerId: String(playerId),
    paid: Boolean(paid),
    updatedAtMs: timestamp,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
  }, { merge: true });
  await batch.commit();
  return { playerId: String(playerId), paid: Boolean(paid), updatedAtMs: timestamp };
}

window.BabaRepository = {
  schemaVersion: SCHEMA_VERSION,
  loadBaba,
  loadMonthStats,
  loadAllHistoryRankings,
  loadMonthPayments,
  loadMoreHistory,
  refreshAccountData,
  activateView,
  migrateLegacyState,
  restoreLegacyBackup,
  softDeletePlayer,
  setMonthlyPayment,
  diagnoseStateSize: diagnoseBabaStateSize,
  estimateJsonSize,
  isApplyingRemote: () => applyingRemote,
  hasMoreHistory: () => hasMoreHistory,
};

function resumePendingSave() {
  if (!queuedSave) {
    const restored = readPendingSave();
    if (restored) queuedSave = { ...restored, attempts: 0, generation: ++saveGeneration };
  } else {
    queuedSave.attempts = 0;
  }
  if (!queuedSave) return;
  clearTimeout(backoffTimer);
  backoffTimer = null;
  backoffUntil = 0;
  writePendingSave(queuedSave);
  updateLocalWriteState();
  scheduleQueuedSave(SAVE_DEBOUNCE_MS);
}

function flushPendingSave() {
  if (!queuedSave || saveInFlight) return;
  clearTimeout(backoffTimer);
  backoffTimer = null;
  backoffUntil = 0;
  scheduleQueuedSave(0);
}

window.BabaPublicSync = { scheduleSave, retryPending: resumePendingSave, flushPending: flushPendingSave };

if (!window.__babaPersistenceEventsReady) {
  window.__babaPersistenceEventsReady = true;
  tools?.attachStorageBridge?.();
  window.addEventListener('online', resumePendingSave);
  window.addEventListener('beforeunload', () => {
    clearTimeout(saveTimer);
    clearTimeout(backoffTimer);
    clearTimeout(flushTimer);
    activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    [...unsubscribers].forEach((unsubscribe) => unsubscribe());
    subscriptionsByKey.clear();
    activeSubscriptions.clear();
    activeSnapshotParts.clear();
  }, { once: true });
}

startRepository();

window.addEventListener('firebase-auth-state', (event) => {
  if (event.detail?.authenticated) startRepository();
});

window.addEventListener('baba-account-changed', (event) => {
  const nextAccountId = resolveAccountId(event.detail?.accountId);
  if (!nextAccountId) return;
  if (repositoryStarted && activeAccountId !== nextAccountId) {
    window.location.reload();
    return;
  }
  activeAccountId = nextAccountId;
  startRepository();
});

import { db, storage } from './js/firebase-init.js';
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
import {
  getDownloadURL,
  ref as storageRef,
  uploadString,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'psyzon_baba_state_v1';
const DEVICE_ID_KEY = 'psyzon_baba_public_device_id';
const DEBUG_SIZE_KEY = 'psyzon_baba_debug_size';
const POINTER_PATH = ['orders_public', 'baba_live_state'];
const RECENT_BABA_LIMIT = 24;
const BACKUP_CHUNK_SIZE = 160_000;
const BATCH_LIMIT = 400;
const USE_BABA_SCHEMA_V2 = window.BABA_USE_SCHEMA_V2 !== false;
const OFFLINE_TEST_MODE = new URLSearchParams(window.location.search).has('babaOffline');

const tools = window.BabaHtmlTools;
const pointerRef = doc(db, ...POINTER_PATH);
const unsubscribers = new Set();
const activeSubscriptions = new Map();
const loadedBabas = new Map();
const monthStatsCache = new Map();
let saveTimer = null;
let flushTimer = null;
let lastLocalState = null;
let activeBabaId = null;
let applyingRemote = false;
let migrationRunning = false;
let repositoryStarted = false;
let historyCursor = null;
let hasMoreHistory = true;

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

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
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

function allGoalEvents(game, gameId) {
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
        registradoEm: Number(game.finalizadoEm || game.dataHora || now()),
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
      [
        [teams.get(game.timeA), Number(game.placarB || 0)],
        [teams.get(game.timeB), Number(game.placarA || 0)],
      ].forEach(([team, goalsAgainst]) => {
        (team?.jogadores || []).forEach((playerId) => {
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
    const teamA = teams.get(game.timeA);
    const teamB = teams.get(game.timeB);
    if (game.empate) {
      [...(teamA?.jogadores || []), ...(teamB?.jogadores || [])].forEach((id) => {
        const item = ensure(id); item.totalEmpates += 1; item.totalJogos += 1;
      });
    } else {
      (teams.get(game.vencedor)?.jogadores || []).forEach((id) => {
        const item = ensure(id); item.totalVitorias += 1; item.totalJogos += 1;
      });
      (teams.get(game.perdedor)?.jogadores || []).forEach((id) => {
        const item = ensure(id); item.totalDerrotas += 1; item.totalJogos += 1;
      });
    }
    allGoalEvents(game, gameIdFor(game)).forEach((goal) => { ensure(goal.jogadorId).totalGols += 1; });
    [
      [teamA, Number(game.placarB || 0)],
      [teamB, Number(game.placarA || 0)],
    ].forEach(([team, goalsAgainst]) => {
      (team?.jogadores || []).forEach((playerId) => {
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

async function uploadGoalImage(goal) {
  if (!String(goal?.foto || '').startsWith('data:image/')) return goal?.foto || '';
  const path = `baba/purchase-goals/${safeId(goal.id)}/image`;
  const imageRef = storageRef(storage, path);
  await uploadString(imageRef, goal.foto, 'data_url');
  return getDownloadURL(imageRef);
}

function babaMetadata(baba, currentGameId = null) {
  return compact({
    id: baba.id,
    dateKey: baba.dataISO,
    dataISO: baba.dataISO,
    dataCompleta: baba.dataCompleta,
    dia: baba.dia,
    mes: baba.mes,
    ano: baba.ano,
    status: baba.status,
    currentGameId,
    currentQueue: [...(baba.filaTimes || [])],
    filaTimes: [...(baba.filaTimes || [])],
    campeaoDoBaba: baba.campeaoDoBaba || null,
    lastResult: baba.lastResult || null,
    pendingTieBreak: baba.pendingTieBreak || null,
    teamRevealIndex: Number(baba.teamRevealIndex || 0),
    criadoEm: Number(baba.criadoEm || now()),
    finalizadoEm: baba.finalizadoEm || null,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: now(),
  });
}

function participantDocuments(state, baba) {
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
    return compact({
      playerId,
      name: player.nome || 'Jogador removido',
      nameSnapshot: player.nome || 'Jogador removido',
      type: player.tipo || 'jogador',
      present: visitors.has(playerId) || (baba.jogadoresPresentes || []).includes(playerId),
      visitor: visitors.has(playerId),
      active: player.ativo !== false,
      teamId: teamByPlayer.get(playerId) || null,
      joinedAt: Number(player.criadoEm || baba.criadoEm || now()),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
      updatedAtMs: now(),
    });
  });
}

function teamDocument(team, index) {
  const { jogadores, ...rest } = team;
  return compact({
    ...rest,
    id: team.id,
    name: team.name,
    order: index + 1,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: now(),
  });
}

function gameDocument(game, status) {
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
    updatedAtMs: now(),
  });
}

function goalDocument(goal, babaId) {
  return compact({
    id: goal.id,
    gameId: goal.gameId,
    playerId: goal.jogadorId || null,
    playerNameSnapshot: goal.jogadorNome || '',
    external: Boolean(goal.external || !goal.jogadorId),
    teamId: goal.time || null,
    teamNameSnapshot: goal.timeNome || '',
    minute: goal.minuto ?? null,
    createdAtMs: Number(goal.registradoEm || now()),
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

async function persistBaba(state, baba, previousBaba = null) {
  const babaId = safeId(baba.id);
  const currentGameId = baba.jogoAtual ? gameIdFor(baba.jogoAtual) : null;
  const operations = [setOperation(doc(db, 'babas', babaId), babaMetadata(baba, currentGameId))];
  const participants = participantDocuments(state, baba);
  const nextParticipantIds = new Set(participants.map((item) => item.playerId));
  participants.forEach((item) => operations.push(setOperation(
    doc(db, 'babas', babaId, 'participants', safeId(item.playerId)), item,
  )));
  const nextTeamIds = new Set((baba.teams || []).map((team) => team.id));
  (baba.teams || []).forEach((team, index) => operations.push(setOperation(
    doc(db, 'babas', babaId, 'teams', safeId(team.id)), teamDocument(team, index),
  )));

  const games = [...(baba.jogos || []).map((game) => ({ game, status: 'finished' }))];
  if (baba.jogoAtual) games.push({ game: baba.jogoAtual, status: baba.jogoAtual.status || 'active' });
  const nextGameIds = new Set();
  const nextGoalIds = new Set();
  games.forEach(({ game, status }) => {
    const gameId = gameIdFor(game);
    nextGameIds.add(gameId);
    operations.push(setOperation(doc(db, 'babas', babaId, 'games', gameId), gameDocument(game, status)));
    allGoalEvents(game, gameId).forEach((goal) => {
      nextGoalIds.add(goal.id);
      operations.push(setOperation(doc(db, 'babas', babaId, 'goals', goal.id), goalDocument(goal, babaId)));
    });
  });

  const nextPaymentIds = new Set(Object.keys(baba.pagamentos || {}));
  Object.entries(baba.pagamentos || {}).forEach(([playerId, paid]) => {
    const player = (state.players || []).find((item) => item.id === playerId)
      || (baba.visitantes || []).find((item) => item.id === playerId);
    operations.push(setOperation(doc(db, 'babas', babaId, 'payments', safeId(playerId)), compact({
      playerId,
      paid: Boolean(paid),
      amount: player?.tipo === 'goleiro' ? 7 : 15,
      method: null,
      paidAt: paid ? now() : null,
      updatedAtMs: now(),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
    })));
  });

  const stats = computeBabaStats(baba, new Map((state.players || []).map((player) => [player.id, player])));
  const nextStatIds = new Set(Object.keys(stats));
  Object.entries(stats).forEach(([playerId, item]) => operations.push(setOperation(
    doc(db, 'babas', babaId, 'stats', safeId(playerId)), compact({
      ...item, playerId, schemaVersion: SCHEMA_VERSION, deleted: false, updatedAtMs: now(),
    }),
  )));

  if (previousBaba) {
    participantDocuments(state, previousBaba).forEach((item) => {
      if (!nextParticipantIds.has(item.playerId)) operations.push(setOperation(
        doc(db, 'babas', babaId, 'participants', safeId(item.playerId)),
        { playerId: item.playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: now() },
      ));
    });
    (previousBaba.teams || []).forEach((team) => {
      if (!nextTeamIds.has(team.id)) operations.push(setOperation(
        doc(db, 'babas', babaId, 'teams', safeId(team.id)),
        { id: team.id, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: now() },
      ));
    });
    Object.keys(previousBaba.pagamentos || {}).forEach((playerId) => {
      if (!nextPaymentIds.has(playerId)) operations.push(setOperation(
        doc(db, 'babas', babaId, 'payments', safeId(playerId)),
        { playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: now() },
      ));
    });
    Object.keys(previousBaba.rankingDoBaba || {}).forEach((playerId) => {
      if (!nextStatIds.has(playerId)) operations.push(setOperation(
        doc(db, 'babas', babaId, 'stats', safeId(playerId)),
        { playerId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: now() },
      ));
    });
    const previousGames = [...(previousBaba.jogos || [])];
    if (previousBaba.jogoAtual) previousGames.push(previousBaba.jogoAtual);
    previousGames.forEach((game) => {
      const gameId = gameIdFor(game);
      if (!nextGameIds.has(gameId)) operations.push(setOperation(
        doc(db, 'babas', babaId, 'games', gameId),
        { id: gameId, schemaVersion: SCHEMA_VERSION, deleted: true, updatedAtMs: now() },
      ));
      allGoalEvents(game, gameId).forEach((goal) => {
        if (!nextGoalIds.has(goal.id)) operations.push(setOperation(
          doc(db, 'babas', babaId, 'goals', goal.id),
          { id: goal.id, babaId, schemaVersion: SCHEMA_VERSION, deleted: true },
        ));
      });
    });
  }

  await commitOperations(operations);
}

async function persistGlobalData(state, previousState = null) {
  const operations = [];
  const nextPlayers = new Set();
  (state.players || []).forEach((player) => {
    nextPlayers.add(player.id);
    operations.push(setOperation(doc(db, 'baba_players', safeId(player.id)), compact({
      ...player,
      playerId: player.id,
      name: player.nome,
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
      updatedAtMs: now(),
    })));
  });
  (previousState?.players || []).forEach((player) => {
    if (!nextPlayers.has(player.id)) operations.push(setOperation(doc(db, 'baba_players', safeId(player.id)), {
      playerId: player.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(),
    }));
  });

  const nextGoals = new Set();
  for (const goal of state.purchaseGoals || []) {
    nextGoals.add(goal.id);
    let imageUrl = goal.foto || '';
    if (String(imageUrl).startsWith('data:image/')) imageUrl = await uploadGoalImage(goal);
    operations.push(setOperation(doc(db, 'baba_purchase_goals', safeId(goal.id)), compact({
      ...goal,
      foto: imageUrl,
      imagePath: imageUrl ? `baba/purchase-goals/${safeId(goal.id)}/image` : null,
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
      updatedAtMs: now(),
    })));
  }
  (previousState?.purchaseGoals || []).forEach((goal) => {
    if (!nextGoals.has(goal.id)) operations.push(setOperation(doc(db, 'baba_purchase_goals', safeId(goal.id)), {
      id: goal.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(),
    }));
  });

  Object.entries(state.monthlyPayments || {}).forEach(([monthKey, record]) => {
    operations.push(setOperation(doc(db, 'baba_months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false,
    }));
    Object.entries(record.pagamentos || {}).forEach(([playerId, paid]) => {
      operations.push(setOperation(doc(db, 'baba_months', safeId(monthKey), 'payments', safeId(playerId)), {
        playerId, paid: Boolean(paid), updatedAtMs: Number(record.atualizadoEm || now()), schemaVersion: SCHEMA_VERSION,
      }));
    });
  });
  await commitOperations(operations);
}

async function persistAggregateStats(state) {
  const { general, monthly } = computeAggregateStats(state);
  const operations = [];
  Object.entries(general).forEach(([playerId, item]) => operations.push(setOperation(
    doc(db, 'player_stats', safeId(playerId)), compact({ ...item, playerId, schemaVersion: SCHEMA_VERSION, updatedAtMs: now() }),
  )));
  Object.entries(monthly).forEach(([monthKey, ranking]) => {
    operations.push(setOperation(doc(db, 'baba_months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false,
    }));
    Object.entries(ranking).forEach(([playerId, item]) => operations.push(setOperation(
      doc(db, 'baba_months', safeId(monthKey), 'stats', safeId(playerId)),
      compact({ ...item, playerId, schemaVersion: SCHEMA_VERSION, updatedAtMs: now() }),
    )));
  });
  (state.babas || []).filter((baba) => baba.status === 'finalizado').forEach((baba) => {
    operations.push(setOperation(doc(db, 'babas', safeId(baba.id)), { statsApplied: true, updatedAtMs: now() }));
  });
  await commitOperations(operations);
}

async function applyBabaStatsDelta(state, baba, direction) {
  if (!baba || baba.status !== 'finalizado') return;
  const babaRef = doc(db, 'babas', safeId(baba.id));
  const monthKey = monthKeyFromBaba(baba);
  const stats = computeBabaStats(baba, new Map((state.players || []).map((player) => [player.id, player])));
  await runTransaction(db, async (transaction) => {
    const babaSnapshot = await transaction.get(babaRef);
    const applied = Boolean(babaSnapshot.data()?.statsApplied);
    if ((direction > 0 && applied) || (direction < 0 && !applied)) return;
    const rows = Object.entries(stats).map(([playerId, item]) => ({
      playerId,
      item,
      generalRef: doc(db, 'player_stats', safeId(playerId)),
      monthRef: doc(db, 'baba_months', safeId(monthKey), 'stats', safeId(playerId)),
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
    transaction.set(doc(db, 'baba_months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(), deleted: false,
    }, { merge: true });
    transaction.set(babaRef, { statsApplied: direction > 0, updatedAtMs: now() }, { merge: true });
  });
}

async function markRemovedBabas(nextState, previousState) {
  if (!previousState) return;
  const nextIds = new Set((nextState.babas || []).map((baba) => baba.id));
  const removed = (previousState.babas || []).filter((baba) => !nextIds.has(baba.id));
  for (const baba of removed) await applyBabaStatsDelta(previousState, baba, -1);
  const operations = removed.map((baba) => setOperation(doc(db, 'babas', safeId(baba.id)), {
      id: baba.id, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: now(),
    }));
  await commitOperations(operations);
}

function signature(value) {
  const copy = clone(value) || {};
  delete copy.undoStack;
  delete copy.rankingDoBaba;
  return JSON.stringify(copy);
}

async function persistState(nextState, previousState = lastLocalState, { migration = false, skipPointer = false } = {}) {
  await persistGlobalData(nextState, previousState);
  const previousById = new Map((previousState?.babas || []).map((baba) => [baba.id, baba]));
  for (const baba of nextState.babas || []) {
    const previousBaba = previousById.get(baba.id);
    if (migration || !previousBaba || signature(previousBaba) !== signature(baba)) {
      await persistBaba(nextState, baba, previousBaba);
    }
    if (!migration && baba.status === 'finalizado' && previousBaba?.status !== 'finalizado') {
      await applyBabaStatsDelta(nextState, baba, 1);
    }
  }
  await markRemovedBabas(nextState, previousState);
  if (migration) await persistAggregateStats(nextState);
  if (skipPointer) return;
  const pointerData = compact({
    activeBabaId: nextState.activeBabaId || null,
    status: nextState.babas?.find((baba) => baba.id === nextState.activeBabaId)?.status || 'idle',
    currentGameId: nextState.babas?.find((baba) => baba.id === nextState.activeBabaId)?.jogoAtual
      ? gameIdFor(nextState.babas.find((baba) => baba.id === nextState.activeBabaId).jogoAtual)
      : null,
    schemaVersion: SCHEMA_VERSION,
    sourceId: deviceId,
    updatedAt: serverTimestamp(),
    updatedAtMs: now(),
  });
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(pointerRef);
    const remote = snapshot.data() || {};
    if (remote.schemaVersion === SCHEMA_VERSION
      && remote.sourceId !== deviceId
      && Number(remote.updatedAtMs || 0) > Number(nextState.updatedAt || 0) + 1500) {
      throw new Error('A copia remota e mais recente. Recarregue antes de salvar novamente.');
    }
    transaction.set(pointerRef, pointerData, { merge: true });
  });
}

async function backupLegacyState(state, migrationId) {
  const raw = JSON.stringify(state);
  const chunks = [];
  for (let offset = 0; offset < raw.length; offset += BACKUP_CHUNK_SIZE) chunks.push(raw.slice(offset, offset + BACKUP_CHUNK_SIZE));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const checksum = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const migrationRef = doc(db, 'migrations', migrationId);
  await setDoc(migrationRef, {
    status: 'running',
    sourcePath: POINTER_PATH.join('/'),
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
    doc(db, 'migrations', migrationId, 'legacy_chunks', String(index).padStart(4, '0')),
    { index, data, schemaVersion: SCHEMA_VERSION },
    { merge: false },
  )));
  return { chunks: chunks.length, checksum };
}

async function validateMigration(state) {
  const result = { babas: 0, participants: 0, teams: 0, games: 0, goals: 0, payments: 0, stats: 0 };
  for (const baba of state.babas || []) {
    const babaId = safeId(baba.id);
    const babaSnapshot = await getDoc(doc(db, 'babas', babaId));
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
      const snapshot = await getDocs(collection(db, 'babas', babaId, name));
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
  const migrationRef = doc(db, 'migrations', migrationId);
  updateStatus('online', 'Migrando', 'Preparando os dados do Baba para o novo armazenamento.');
  try {
    const existing = await getDoc(migrationRef);
    if (existing.data()?.status === 'completed') {
      await setDoc(pointerRef, {
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
    await setDoc(pointerRef, {
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
  const restored = {
    ...game,
    numeroJogo: Number(game.numeroJogo || game.sequence || 1),
    timeA: game.timeA || game.teamAId,
    timeB: game.timeB || game.teamBId,
    placarA: events.filter((goal) => goal.time === (game.timeA || game.teamAId)).length,
    placarB: events.filter((goal) => goal.time === (game.timeB || game.teamBId)).length,
    vencedor: game.vencedor || game.winnerTeamId || null,
    perdedor: game.perdedor || game.loserTeamId || null,
    empate: game.empate ?? game.draw ?? false,
    goalEvents: events,
    gols: aggregateGoals(events),
  };
  ['id', 'sequence', 'teamAId', 'teamBId', 'scoreA', 'scoreB', 'winnerTeamId', 'loserTeamId', 'draw', 'schemaVersion', 'deleted', 'updatedAtMs']
    .forEach((field) => delete restored[field]);
  return restored;
}

async function fetchBaba(babaId) {
  const id = safeId(babaId);
  const [metaSnapshot, participantsSnapshot, teamsSnapshot, gamesSnapshot, goalsSnapshot, paymentsSnapshot, statsSnapshot] = await Promise.all([
    getDoc(doc(db, 'babas', id)),
    getDocs(collection(db, 'babas', id, 'participants')),
    getDocs(collection(db, 'babas', id, 'teams')),
    getDocs(collection(db, 'babas', id, 'games')),
    getDocs(collection(db, 'babas', id, 'goals')),
    getDocs(collection(db, 'babas', id, 'payments')),
    getDocs(collection(db, 'babas', id, 'stats')),
  ]);
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
  const localUndo = readLocalState()?.babas?.find((item) => item.id === babaId)?.undoStack || [];
  return compact({
    __detailLoaded: true,
    id: meta.id || babaId,
    dataISO: meta.dataISO || meta.dateKey,
    dataCompleta: meta.dataCompleta,
    dia: meta.dia,
    mes: meta.mes,
    ano: meta.ano,
    status: meta.status,
    jogadoresPresentes: participants.filter((item) => item.present && !item.visitor).map((item) => item.playerId),
    visitantes: visitors,
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
    undoStack: localUndo,
    criadoEm: Number(meta.criadoEm || now()),
    finalizadoEm: meta.finalizadoEm || null,
  });
}

function mergeRemoteIntoLocal() {
  const current = readLocalState() || emptyState();
  const next = { ...current, updatedAt: now() };
  if (window.__babaRemotePlayers) next.players = clone(window.__babaRemotePlayers);
  if (window.__babaRemotePurchaseGoals) next.purchaseGoals = clone(window.__babaRemotePurchaseGoals);
  if (window.__babaRemoteMonthlyPayments) next.monthlyPayments = clone(window.__babaRemoteMonthlyPayments);
  if (window.__babaRemotePlayerStats) next.playerStats = clone(window.__babaRemotePlayerStats);
  next.monthlyStats = Object.fromEntries(monthStatsCache.entries());
  const metadata = window.__babaRemoteMetadata || [];
  const byId = new Map((current.babas || []).map((baba) => [baba.id, baba]));
  metadata.forEach((meta) => {
    if (meta.deleted) {
      byId.delete(meta.id);
      loadedBabas.delete(meta.id);
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
        rankingDoBaba: existing.rankingDoBaba || {},
        undoStack: existing.undoStack || [],
      }));
    }
  });
  loadedBabas.forEach((baba, id) => { if (baba) byId.set(id, clone(baba)); });
  next.babas = [...byId.values()].sort((a, b) => Number(b.criadoEm || 0) - Number(a.criadoEm || 0));
  next.activeBabaId = activeBabaId || null;
  applyingRemote = true;
  try {
    tools?.writeCurrentBabaRaw?.(stateRaw(next), { remote: true });
    lastLocalState = clone(next);
    tools?.scheduleAppRefresh?.('baba-schema-v2');
  } finally {
    applyingRemote = false;
  }
}

function scheduleRemoteFlush() {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(mergeRemoteIntoLocal, 80);
}

function subscribe(refOrQuery, handler, errorLabel) {
  const unsubscribe = onSnapshot(refOrQuery, handler, (error) => {
    console.error(`Falha no listener ${errorLabel}:`, error);
    updateStatus('offline', 'Offline', 'A sincronizacao foi interrompida; os dados locais foram preservados.');
  });
  unsubscribers.add(unsubscribe);
  return unsubscribe;
}

async function loadBaba(babaId, { realtime = false } = {}) {
  if (!babaId) return null;
  const id = safeId(babaId);
  const baba = await fetchBaba(id);
  loadedBabas.set(id, baba);
  scheduleRemoteFlush();
  if (realtime && !activeSubscriptions.has(id)) {
    const refs = [
      doc(db, 'babas', id),
      collection(db, 'babas', id, 'participants'),
      collection(db, 'babas', id, 'teams'),
      collection(db, 'babas', id, 'games'),
      collection(db, 'babas', id, 'goals'),
      collection(db, 'babas', id, 'payments'),
      collection(db, 'babas', id, 'stats'),
    ];
    const localUnsubscribers = refs.map((target) => subscribe(target, async () => {
      loadedBabas.set(id, await fetchBaba(id));
      scheduleRemoteFlush();
    }, `do Baba ${id}`));
    activeSubscriptions.set(id, () => localUnsubscribers.forEach((unsubscribe) => unsubscribe()));
  }
  return baba;
}

async function loadMonthStats(monthKey) {
  if (!monthKey || monthStatsCache.has(monthKey)) return monthStatsCache.get(monthKey) || {};
  const snapshot = await getDocs(collection(db, 'baba_months', safeId(monthKey), 'stats'));
  const ranking = {};
  snapshot.docs.forEach((item) => { if (!item.data().deleted) ranking[item.id] = item.data(); });
  monthStatsCache.set(monthKey, ranking);
  scheduleRemoteFlush();
  return ranking;
}

function startV2Subscriptions() {
  subscribe(collection(db, 'baba_players'), (snapshot) => {
    window.__babaRemotePlayers = snapshot.docs.map((item) => item.data()).filter((item) => !item.deleted).map((item) => ({
      id: item.playerId || item.id,
      nome: item.nome || item.name,
      tipo: item.tipo || item.type || 'jogador',
      ativo: item.ativo !== false,
      criadoEm: item.criadoEm || item.createdAtMs || now(),
    }));
    scheduleRemoteFlush();
  }, 'de jogadores');
  subscribe(collection(db, 'baba_purchase_goals'), (snapshot) => {
    window.__babaRemotePurchaseGoals = snapshot.docs.map((item) => item.data()).filter((item) => !item.deleted);
    scheduleRemoteFlush();
  }, 'de metas');
  subscribe(collection(db, 'player_stats'), (snapshot) => {
    window.__babaRemotePlayerStats = Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]));
    scheduleRemoteFlush();
  }, 'do ranking geral');
  subscribe(query(collection(db, 'babas'), orderBy('criadoEm', 'desc'), limit(RECENT_BABA_LIMIT)), (snapshot) => {
    window.__babaRemoteMetadata = snapshot.docs.map((item) => item.data());
    historyCursor = snapshot.docs[snapshot.docs.length - 1] || null;
    hasMoreHistory = snapshot.size === RECENT_BABA_LIMIT;
    scheduleRemoteFlush();
  }, 'do historico');
  subscribe(collection(db, 'baba_months'), (snapshot) => {
    const months = snapshot.docs.map((item) => item.id);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const requested = new Set([currentMonth, ...months.slice(-2)]);
    requested.forEach((monthKey) => loadMonthStats(monthKey).catch(() => {}));
    Promise.all(months.map(async (monthKey) => {
      const payments = await getDocs(collection(db, 'baba_months', monthKey, 'payments'));
      return [monthKey, {
        pagamentos: Object.fromEntries(payments.docs.map((item) => [item.id, Boolean(item.data().paid)])),
        atualizadoEm: Math.max(0, ...payments.docs.map((item) => Number(item.data().updatedAtMs || 0))),
      }];
    })).then((records) => {
      window.__babaRemoteMonthlyPayments = Object.fromEntries(records);
      scheduleRemoteFlush();
    }).catch((error) => console.warn('Falha ao carregar pagamentos mensais:', error));
  }, 'dos meses');
}

async function loadMoreHistory() {
  if (!historyCursor || !hasMoreHistory) return [];
  const snapshot = await getDocs(query(
    collection(db, 'babas'),
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
  subscribe(pointerRef, async (snapshot) => {
    const data = snapshot.data() || {};
    if (Number(data.schemaVersion || 0) < SCHEMA_VERSION) return;
    const nextActiveId = data.activeBabaId || null;
    if (activeBabaId !== nextActiveId) {
      if (activeBabaId && activeSubscriptions.has(activeBabaId)) {
        activeSubscriptions.get(activeBabaId)();
        activeSubscriptions.delete(activeBabaId);
      }
      activeBabaId = nextActiveId;
      if (activeBabaId) await loadBaba(activeBabaId, { realtime: true });
      else scheduleRemoteFlush();
    }
    updateStatus('online', 'Online', 'Baba sincronizado no armazenamento v2.');
  }, 'do ponteiro ativo');
}

async function scheduleSave(raw, reason = 'local-change') {
  if (applyingRemote || migrationRunning) return;
  const state = parseState(raw);
  if (!hasUsefulState(state)) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      diagnoseBabaStateSize(state);
      await persistState(state, lastLocalState);
      lastLocalState = clone(state);
      updateStatus('online', 'Online', 'Alteracoes salvas em documentos pequenos e sincronizados.');
    } catch (error) {
      console.error(`Falha ao salvar Baba (${reason}):`, error);
      updateStatus('offline', isPermissionError(error) ? 'Atualize as regras' : 'Falha ao salvar',
        isPermissionError(error)
          ? 'Publique as regras do schema v2 para liberar a nova estrutura.'
          : 'Nao foi possivel salvar agora; a copia deste aparelho foi mantida.');
    }
  }, 420);
}

async function restoreLegacyBackup(migrationId) {
  const migrationSnapshot = await getDoc(doc(db, 'migrations', migrationId));
  if (!migrationSnapshot.exists()) throw new Error('Registro de migracao nao encontrado.');
  const chunksSnapshot = await getDocs(collection(db, 'migrations', migrationId, 'legacy_chunks'));
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
  if (repositoryStarted || !USE_BABA_SCHEMA_V2 || OFFLINE_TEST_MODE) return;
  repositoryStarted = true;
  lastLocalState = readLocalState() || emptyState();
  diagnoseBabaStateSize(lastLocalState);
  updateStatus('online', 'Conectando', 'Verificando a versao dos dados do Baba.');
  try {
    const pointerSnapshot = await getDoc(pointerRef);
    const pointer = pointerSnapshot.data() || {};
    if (Number(pointer.schemaVersion || 0) >= SCHEMA_VERSION) {
      activeBabaId = pointer.activeBabaId || null;
      startV2Subscriptions();
      await startPointerListener();
      if (activeBabaId) await loadBaba(activeBabaId, { realtime: true });
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
        if (activeBabaId) await loadBaba(activeBabaId, { realtime: true });
      } else {
        await setDoc(pointerRef, {
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
  } catch (error) {
    console.error('Falha ao iniciar repositorio v2 do Baba:', error);
    updateStatus('offline', isPermissionError(error) ? 'Atualize as regras' : 'Offline',
      isPermissionError(error)
        ? 'As regras do Firestore precisam ser publicadas para ativar o schema v2.'
        : 'Nao consegui conectar agora; a copia local continua disponivel.');
  }
}

window.BabaPublicSync = { scheduleSave };
window.BabaRepository = {
  schemaVersion: SCHEMA_VERSION,
  loadBaba,
  loadMonthStats,
  loadMoreHistory,
  migrateLegacyState,
  restoreLegacyBackup,
  diagnoseStateSize: diagnoseBabaStateSize,
  estimateJsonSize,
  isApplyingRemote: () => applyingRemote,
  hasMoreHistory: () => hasMoreHistory,
};

tools?.attachStorageBridge?.();
window.addEventListener('backend-ready', () => tools?.attachStorageBridge?.());
window.addEventListener('beforeunload', () => {
  clearTimeout(saveTimer);
  clearTimeout(flushTimer);
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  activeSubscriptions.forEach((unsubscribe) => unsubscribe());
}, { once: true });

startRepository();

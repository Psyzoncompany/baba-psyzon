import { auth, db } from './js/firebase-init.js';
import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const SCHEMA_VERSION = 2;
const IMPORT_SCHEMA_VERSION = 1;
const LIST_LIMITS = Object.freeze({ aliases: 500, imports: 100 });

function compact(value) {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
  if (!value || typeof value !== 'object') return value;
  return Object.entries(value).reduce((result, [key, item]) => {
    if (item !== undefined) result[key] = compact(item);
    return result;
  }, {});
}

function safeId(value, fallback = 'item') {
  return String(value || fallback).trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180) || fallback;
}

function currentUser() {
  return auth.currentUser || window.firebaseAuth?.currentUser?.() || null;
}

function requireAuthenticatedAdminContext() {
  const user = currentUser();
  if (!user || user.uid === 'local_user') {
    throw new Error('Entre com o Google para salvar importações administrativas.');
  }
  return user;
}

function accountId() {
  return safeId(requireAuthenticatedAdminContext().uid, '');
}

function accountDoc(...segments) {
  return doc(db, 'baba_accounts', accountId(), ...segments);
}

function accountCollection(...segments) {
  return collection(db, 'baba_accounts', accountId(), ...segments);
}

function playerDocument(player, timestamp) {
  return compact({
    ...player,
    playerId: player.id,
    name: player.nome,
    normalizedName: window.BabaImportCore.normalizeName(player.nome),
    normalizedAliasKey: window.BabaImportCore.normalizeAlias(player.nome),
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function babaMetadata(baba, importId, timestamp) {
  return compact({
    id: baba.id,
    dateKey: baba.dataISO,
    dataISO: baba.dataISO,
    dataCompleta: baba.dataCompleta,
    dia: baba.dia,
    mes: baba.mes,
    ano: baba.ano,
    status: baba.status,
    matchMode: baba.matchMode,
    currentGameId: null,
    currentQueue: [],
    filaTimes: [],
    campeaoDoBaba: baba.campeaoDoBaba || null,
    lastResult: null,
    pendingTieBreak: null,
    teamRevealIndex: 0,
    importId,
    importSource: 'intelligent-text-import',
    observations: baba.observacoes || '',
    criadoEm: baba.criadoEm,
    finalizadoEm: baba.finalizadoEm,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function participantDocuments(state, baba, importId, timestamp) {
  const players = new Map((state.players || []).map((player) => [player.id, player]));
  const teamByPlayer = new Map();
  (baba.teams || []).forEach((team) => (team.jogadores || []).forEach((playerId) => teamByPlayer.set(playerId, team.id)));
  return [...new Set(baba.jogadoresPresentes || [])].map((playerId) => {
    const player = players.get(playerId) || {};
    const flags = baba.participantFlags?.[playerId] || {};
    return compact({
      playerId,
      name: player.nome || 'Jogador',
      nameSnapshot: player.nome || 'Jogador',
      typedName: flags.typedName || player.nome || 'Jogador',
      type: flags.goalkeeper ? 'goleiro' : (player.tipo || 'jogador'),
      present: true,
      visitor: false,
      guest: Boolean(flags.guest),
      goalkeeper: Boolean(flags.goalkeeper || player.tipo === 'goleiro'),
      novice: Boolean(flags.novice || player.novato),
      active: player.ativo !== false,
      teamId: teamByPlayer.get(playerId) || null,
      joinedAt: Number(player.criadoEm || baba.criadoEm || timestamp),
      importId,
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
      updatedAtMs: timestamp,
    });
  });
}

function teamDocument(team, index, importId, timestamp) {
  const { jogadores, ...rest } = team;
  return compact({
    ...rest,
    id: team.id,
    name: team.name,
    vestColor: team.vestColor || team.colete || '',
    order: index + 1,
    importId,
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

function statsDocuments(state, baba, timestamp) {
  const players = new Map((state.players || []).map((player) => [player.id, player]));
  const champions = new Set(baba.campeaoDoBaba?.jogadores || []);
  return (baba.teams || []).flatMap((team) => {
    const manual = team.manualStats || {};
    const games = Number(manual.wins || 0) + Number(manual.draws || 0) + Number(manual.losses || 0);
    return (team.jogadores || []).map((playerId) => {
      const flags = baba.participantFlags?.[playerId] || {};
      const player = players.get(playerId) || {};
      const totalGols = Number(manual.playerGoals?.[playerId] || 0);
      const totalVitorias = Number(manual.wins || 0);
      const totalEmpates = Number(manual.draws || 0);
      const totalDerrotas = Number(manual.losses || 0);
      const points = (totalVitorias * 3) + totalEmpates;
      return compact({
        jogadorId: playerId,
        playerId,
        nome: player.nome || 'Jogador',
        totalGols,
        totalVitorias,
        totalEmpates,
        totalDerrotas,
        totalJogos: games,
        totalBabas: 1,
        totalTitulosBaba: champions.has(playerId) ? 1 : 0,
        goalkeeperGames: flags.goalkeeper || player.tipo === 'goleiro' ? games : 0,
        goalsConceded: 0,
        mediaGols: totalGols,
        aproveitamento: games ? Math.round((points / (games * 3)) * 100) : 0,
        schemaVersion: SCHEMA_VERSION,
        deleted: false,
        updatedAtMs: timestamp,
      });
    });
  });
}

function mergeAggregateStats(existing, delta, timestamp, direction = 1) {
  const base = existing && existing.deleted !== true ? existing : {};
  const result = {
    jogadorId: delta.playerId,
    playerId: delta.playerId,
    nome: delta.nome || base.nome || 'Jogador',
  };
  ['totalGols', 'totalVitorias', 'totalEmpates', 'totalDerrotas', 'totalJogos', 'totalBabas', 'totalTitulosBaba', 'goalkeeperGames', 'goalsConceded'].forEach((field) => {
    result[field] = Math.max(0, Number(base[field] || 0) + (Number(delta[field] || 0) * direction));
  });
  const points = (result.totalVitorias * 3) + result.totalEmpates;
  result.mediaGols = result.totalBabas ? Number((result.totalGols / result.totalBabas).toFixed(2)) : 0;
  result.aproveitamento = result.totalJogos ? Math.round((points / (result.totalJogos * 3)) * 100) : 0;
  result.schemaVersion = SCHEMA_VERSION;
  result.deleted = false;
  result.updatedAtMs = timestamp;
  return result;
}

function aliasDocument(alias, importId, user, timestamp) {
  return compact({
    id: alias.id,
    originalText: alias.originalText,
    normalizedText: window.BabaImportCore.normalizeAlias(alias.originalText),
    playerId: alias.playerId,
    officialNameSnapshot: alias.officialNameSnapshot,
    correctionSource: alias.correctionSource || 'admin-import-confirmation',
    initialConfidence: Number(alias.initialConfidence || 0),
    confirmedBy: user.uid,
    confirmedByEmail: user.email || '',
    confirmedAtMs: timestamp,
    confirmationImportId: importId,
    usageCount: Number(alias.usageCount || 0),
    active: true,
    schemaVersion: IMPORT_SCHEMA_VERSION,
    deleted: false,
    updatedAtMs: timestamp,
  });
}

export async function loadAliases() {
  const snapshot = await getDocs(query(accountCollection('aliases'), orderBy('normalizedText'), limit(LIST_LIMITS.aliases)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.deleted !== true);
}

export async function loadImports() {
  const snapshot = await getDocs(query(accountCollection('imports'), orderBy('createdAtMs', 'desc'), limit(LIST_LIMITS.imports)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.deleted !== true);
}

export function findSimilarImports(imports, analysis, textHash) {
  const date = analysis?.parsed?.date;
  const teamIds = (analysis?.parsed?.teams || []).map((team) => team.id).sort();
  const people = (analysis?.people || []).map((person) => person.resolution?.playerId || person.match?.suggestedPlayerId || person.match?.normalizedName).filter(Boolean).sort();
  const totalGoals = Number(analysis?.parsed?.totalGoalsInformed ?? analysis?.parsed?.calculatedTotalGoals ?? 0);
  return (imports || []).filter((item) => {
    if (item.status === 'reverted') return false;
    if (item.textHash === textHash) return true;
    if (item.eventDate !== date) return false;
    const sameTeams = JSON.stringify([...(item.teamIds || [])].sort()) === JSON.stringify(teamIds);
    const overlap = people.length ? (item.playerIds || []).filter((id) => people.includes(id)).length / people.length : 0;
    return sameTeams && Number(item.totalGoals || 0) === totalGoals && overlap >= 0.7;
  });
}

export async function commitImport(payload) {
  const user = requireAuthenticatedAdminContext();
  const { importId, text, textHash, analysis, state, baba, newPlayers = [], updatedPlayers = [], aliasesToCreate = [], usedAliasIds = [], warnings = [], autoSaved = false } = payload;
  if (!importId || !textHash || !analysis || !baba?.id) throw new Error('Dados da importação incompletos.');
  const timestamp = Date.now();
  const importRef = accountDoc('imports', safeId(importId));
  const importKeyRef = accountDoc('import_keys', safeId(textHash));
  const babaRef = accountDoc('babas', safeId(baba.id));
  const playerLockRefs = newPlayers.map((player) => accountDoc('player_name_keys', safeId(window.BabaImportCore.normalizeAlias(player.nome))));
  const importedStats = statsDocuments(state, baba, timestamp);
  const generalStatRefs = importedStats.map((stats) => accountDoc('player_stats', safeId(stats.playerId)));
  const monthKey = String(baba.dataISO || '').slice(0, 7);
  const monthStatRefs = importedStats.map((stats) => accountDoc('months', safeId(monthKey), 'stats', safeId(stats.playerId)));

  await runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all([
      transaction.get(importKeyRef),
      transaction.get(importRef),
      transaction.get(babaRef),
      ...playerLockRefs.map((ref) => transaction.get(ref)),
      ...generalStatRefs.map((ref) => transaction.get(ref)),
      ...monthStatRefs.map((ref) => transaction.get(ref)),
    ]);
    const duplicateSnapshot = snapshots[0];
    const existingImportSnapshot = snapshots[1];
    const babaSnapshot = snapshots[2];
    const playerLocks = snapshots.slice(3, 3 + playerLockRefs.length);
    const generalStatSnapshots = snapshots.slice(3 + playerLockRefs.length, 3 + playerLockRefs.length + generalStatRefs.length);
    const monthStatSnapshots = snapshots.slice(3 + playerLockRefs.length + generalStatRefs.length);
    if (duplicateSnapshot.exists() && duplicateSnapshot.data().status !== 'reverted') {
      throw new Error('Este mesmo texto já foi importado. Abra o histórico para revisar o baba existente.');
    }
    if (existingImportSnapshot.exists() || babaSnapshot.exists()) throw new Error('Os identificadores desta importação já estão em uso. Tente analisar novamente.');
    playerLocks.forEach((snapshot, index) => {
      if (snapshot.exists() && snapshot.data().active !== false) throw new Error(`Já existe um jogador ou cadastro reservado com o nome ${newPlayers[index].nome}.`);
    });

    newPlayers.forEach((player, index) => {
      transaction.set(accountDoc('players', safeId(player.id)), playerDocument(player, timestamp), { merge: false });
      transaction.set(playerLockRefs[index], {
        normalizedName: window.BabaImportCore.normalizeName(player.nome),
        normalizedAliasKey: window.BabaImportCore.normalizeAlias(player.nome),
        playerId: player.id,
        active: true,
        createdByImportId: importId,
        createdAtMs: timestamp,
        schemaVersion: IMPORT_SCHEMA_VERSION,
      }, { merge: false });
      transaction.set(accountDoc('player_status_history', safeId(`${player.id}_${importId}`)), {
        id: `${player.id}_${importId}`,
        playerId: player.id,
        status: 'novice',
        active: true,
        reason: 'first-imported-baba',
        babaId: baba.id,
        importId,
        changedBy: user.uid,
        changedAtMs: timestamp,
        schemaVersion: IMPORT_SCHEMA_VERSION,
        deleted: false,
      }, { merge: false });
    });
    updatedPlayers.forEach((player) => {
      transaction.set(accountDoc('players', safeId(player.id)), playerDocument(player, timestamp), { merge: true });
      transaction.set(accountDoc('player_status_history', safeId(`${player.id}_${importId}`)), {
        id: `${player.id}_${importId}`, playerId: player.id, status: 'novice', active: true,
        reason: 'confirmed-in-import', babaId: baba.id, importId, changedBy: user.uid,
        changedAtMs: timestamp, schemaVersion: IMPORT_SCHEMA_VERSION, deleted: false,
      }, { merge: false });
    });

    transaction.set(babaRef, babaMetadata(baba, importId, timestamp), { merge: false });
    participantDocuments(state, baba, importId, timestamp).forEach((participant) => {
      transaction.set(accountDoc('babas', safeId(baba.id), 'participants', safeId(participant.playerId)), participant, { merge: false });
    });
    (baba.teams || []).forEach((team, index) => {
      transaction.set(accountDoc('babas', safeId(baba.id), 'teams', safeId(team.id)), teamDocument(team, index, importId, timestamp), { merge: false });
    });
    importedStats.forEach((stats, index) => {
      transaction.set(accountDoc('babas', safeId(baba.id), 'stats', safeId(stats.playerId)), stats, { merge: false });
      transaction.set(generalStatRefs[index], mergeAggregateStats(generalStatSnapshots[index].data(), stats, timestamp), { merge: false });
      transaction.set(monthStatRefs[index], mergeAggregateStats(monthStatSnapshots[index].data(), stats, timestamp), { merge: false });
    });
    transaction.set(accountDoc('months', safeId(monthKey)), {
      id: monthKey, monthKey, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp, deleted: false,
    }, { merge: true });
    participantDocuments(state, baba, importId, timestamp).forEach((participant) => {
      const player = (state.players || []).find((item) => item.id === participant.playerId);
      transaction.set(accountDoc('babas', safeId(baba.id), 'payments', safeId(participant.playerId)), {
        playerId: participant.playerId,
        paid: false,
        amount: participant.goalkeeper || player?.tipo === 'goleiro' ? 7 : 15,
        method: null,
        paidAt: null,
        updatedAtMs: timestamp,
        schemaVersion: SCHEMA_VERSION,
        deleted: false,
      }, { merge: false });
    });
    aliasesToCreate.forEach((alias) => {
      transaction.set(accountDoc('aliases', safeId(alias.id)), aliasDocument(alias, importId, user, timestamp), { merge: false });
    });
    [...new Set(usedAliasIds)].forEach((aliasId) => {
      transaction.set(accountDoc('aliases', safeId(aliasId)), {
        usageCount: increment(1),
        lastUsedAtMs: timestamp,
        lastUsedImportId: importId,
        updatedAtMs: timestamp,
      }, { merge: true });
    });
    warnings.forEach((warning, index) => {
      transaction.set(accountDoc('imports', safeId(importId), 'warnings', safeId(`${index + 1}_${warning.code}`)), compact({
        ...warning,
        index,
        importId,
        createdAtMs: timestamp,
        schemaVersion: IMPORT_SCHEMA_VERSION,
      }), { merge: false });
    });

    const playerIds = [...new Set(baba.jogadoresPresentes || [])];
    const importDocument = compact({
      id: importId,
      status: 'committed',
      eventDate: baba.dataISO,
      babaId: baba.id,
      originalText: text,
      textHash,
      structuredResult: analysis.parsed,
      playerDecisions: analysis.people.map((person) => ({ typedName: person.typedName, match: person.match, resolution: person.resolution, roles: person.roles })),
      manualCorrections: payload.manualCorrections || [],
      warningSummary: warnings.map((warning) => ({ code: warning.code, severity: warning.severity, message: warning.message })),
      playerIds,
      newPlayerIds: newPlayers.map((player) => player.id),
      noviceActivatedPlayerIds: updatedPlayers.map((player) => player.id),
      newPlayerNameKeys: newPlayers.map((player) => window.BabaImportCore.normalizeAlias(player.nome)),
      aliasIds: aliasesToCreate.map((alias) => alias.id),
      usedAliasIds: [...new Set(usedAliasIds)],
      teamIds: (baba.teams || []).map((team) => team.id),
      totalGoals: Number(analysis.parsed.totalGoalsInformed ?? analysis.parsed.calculatedTotalGoals ?? 0),
      statsDelta: importedStats,
      monthKey,
      responsibleUserId: user.uid,
      responsibleUserEmail: user.email || '',
      autoSaved: Boolean(autoSaved),
      confidence: Number(analysis.confidence || 0),
      createdAt: serverTimestamp(),
      createdAtMs: timestamp,
      schemaVersion: IMPORT_SCHEMA_VERSION,
      deleted: false,
    });
    transaction.set(importRef, importDocument, { merge: false });
    transaction.set(importKeyRef, {
      textHash,
      importId,
      babaId: baba.id,
      eventDate: baba.dataISO,
      status: 'committed',
      createdBy: user.uid,
      createdAtMs: timestamp,
      schemaVersion: IMPORT_SCHEMA_VERSION,
    }, { merge: false });
    transaction.set(accountDoc('imports', safeId(importId), 'audit_logs', 'created'), {
      id: 'created',
      action: autoSaved ? 'auto-committed' : 'admin-committed',
      actorId: user.uid,
      actorEmail: user.email || '',
      decisions: analysis.people.map((person) => ({ typedName: person.typedName, resolution: person.resolution })),
      createdPlayerIds: newPlayers.map((player) => player.id),
      createdAliasIds: aliasesToCreate.map((alias) => alias.id),
      occurredAtMs: timestamp,
      schemaVersion: IMPORT_SCHEMA_VERSION,
    }, { merge: false });
  });
  return { importId, babaId: baba.id, userId: user.uid, committedAtMs: timestamp };
}

export async function updateAlias(aliasId, changes) {
  const user = requireAuthenticatedAdminContext();
  const allowed = {};
  if (typeof changes.originalText === 'string') {
    allowed.originalText = changes.originalText.trim();
    allowed.normalizedText = window.BabaImportCore.normalizeAlias(changes.originalText);
  }
  if (typeof changes.active === 'boolean') allowed.active = changes.active;
  allowed.updatedAtMs = Date.now();
  allowed.updatedBy = user.uid;
  await setDoc(accountDoc('aliases', safeId(aliasId)), allowed, { merge: true });
  return allowed;
}

export async function recordPlayerStatus(playerId, active, details = {}) {
  const user = requireAuthenticatedAdminContext();
  const timestamp = Date.now();
  const id = safeId(`${playerId}_${timestamp}`);
  await setDoc(accountDoc('player_status_history', id), {
    id,
    playerId,
    status: 'novice',
    active: Boolean(active),
    reason: details.reason || (active ? 'manual-mark' : 'manual-removal'),
    babaId: details.babaId || null,
    changedBy: user.uid,
    changedAtMs: timestamp,
    schemaVersion: IMPORT_SCHEMA_VERSION,
    deleted: false,
  }, { merge: false });
}

export async function revertImport(importId, { removablePlayerIds = [] } = {}) {
  const user = requireAuthenticatedAdminContext();
  const importRef = accountDoc('imports', safeId(importId));
  const timestamp = Date.now();
  let result = null;
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(importRef);
    if (!snapshot.exists()) throw new Error('Importação não encontrada.');
    const record = snapshot.data();
    if (record.status === 'reverted') throw new Error('Esta importação já foi desfeita.');
    const statsDelta = record.statsDelta || [];
    const monthKey = record.monthKey || String(record.eventDate || '').slice(0, 7);
    const generalRefs = statsDelta.map((stats) => accountDoc('player_stats', safeId(stats.playerId)));
    const monthRefs = statsDelta.map((stats) => accountDoc('months', safeId(monthKey), 'stats', safeId(stats.playerId)));
    const novicePlayerRefs = (record.noviceActivatedPlayerIds || []).map((playerId) => accountDoc('players', safeId(playerId)));
    const aggregateSnapshots = await Promise.all([
      ...generalRefs.map((ref) => transaction.get(ref)),
      ...monthRefs.map((ref) => transaction.get(ref)),
      ...novicePlayerRefs.map((ref) => transaction.get(ref)),
    ]);
    const allowedPlayers = new Set(removablePlayerIds);
    const playersToRemove = (record.newPlayerIds || []).filter((id) => allowedPlayers.has(id));
    transaction.set(accountDoc('babas', safeId(record.babaId)), { deleted: true, status: 'reverted', importId, updatedAtMs: timestamp }, { merge: true });
    (record.playerIds || []).forEach((playerId) => {
      transaction.set(accountDoc('babas', safeId(record.babaId), 'participants', safeId(playerId)), { playerId, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp }, { merge: true });
      transaction.set(accountDoc('babas', safeId(record.babaId), 'payments', safeId(playerId)), { playerId, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp }, { merge: true });
      transaction.set(accountDoc('babas', safeId(record.babaId), 'stats', safeId(playerId)), { playerId, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp }, { merge: true });
    });
    (record.teamIds || []).forEach((teamId) => transaction.set(accountDoc('babas', safeId(record.babaId), 'teams', safeId(teamId)), {
      id: teamId, deleted: true, schemaVersion: SCHEMA_VERSION, updatedAtMs: timestamp,
    }, { merge: true }));
    statsDelta.forEach((stats, index) => {
      transaction.set(generalRefs[index], mergeAggregateStats(aggregateSnapshots[index].data(), stats, timestamp, -1), { merge: false });
      transaction.set(monthRefs[index], mergeAggregateStats(aggregateSnapshots[generalRefs.length + index].data(), stats, timestamp, -1), { merge: false });
    });
    (record.aliasIds || []).forEach((aliasId) => transaction.set(accountDoc('aliases', safeId(aliasId)), {
      active: false, deleted: true, deactivatedByReversal: importId, updatedAtMs: timestamp,
    }, { merge: true }));
    playersToRemove.forEach((playerId) => transaction.set(accountDoc('players', safeId(playerId)), {
      deleted: true, active: false, ativo: false, status: 'disabled', deletedByImportReversal: importId, updatedAtMs: timestamp,
    }, { merge: true }));
    (record.newPlayerNameKeys || []).forEach((nameKey) => transaction.set(accountDoc('player_name_keys', safeId(nameKey)), {
      active: false, deactivatedByReversal: importId, updatedAtMs: timestamp,
    }, { merge: true }));
    const noviceSnapshotOffset = generalRefs.length + monthRefs.length;
    novicePlayerRefs.forEach((playerRef, index) => {
      const player = aggregateSnapshots[noviceSnapshotOffset + index]?.data() || {};
      if (player.noviceReasonImportId !== importId) return;
      transaction.set(playerRef, {
        status: 'regular', novato: false, convidado: false, noviceActive: false, noviceReason: 'import-reverted',
        noviceReasonImportId: null, updatedAtMs: timestamp,
      }, { merge: true });
    });
    playersToRemove.forEach((playerId) => transaction.set(accountDoc('player_status_history', safeId(`${playerId}_${importId}_reverted`)), {
      id: `${playerId}_${importId}_reverted`, playerId, status: 'novice', active: false,
      reason: 'import-reverted', babaId: record.babaId, importId, changedBy: user.uid,
      changedAtMs: timestamp, schemaVersion: IMPORT_SCHEMA_VERSION, deleted: false,
    }, { merge: false }));
    transaction.set(importRef, {
      status: 'reverted',
      revertedBy: user.uid,
      revertedAtMs: timestamp,
      removedPlayerIds: playersToRemove,
      preservedPlayerIds: (record.newPlayerIds || []).filter((id) => !allowedPlayers.has(id)),
    }, { merge: true });
    transaction.set(accountDoc('import_keys', safeId(record.textHash)), { status: 'reverted', revertedAtMs: timestamp }, { merge: true });
    transaction.set(accountDoc('imports', safeId(importId), 'audit_logs', safeId(`reverted_${timestamp}`)), {
      id: `reverted_${timestamp}`,
      action: 'reverted',
      actorId: user.uid,
      actorEmail: user.email || '',
      removedPlayerIds: playersToRemove,
      occurredAtMs: timestamp,
      schemaVersion: IMPORT_SCHEMA_VERSION,
    }, { merge: false });
    result = {
      babaId: record.babaId,
      removedPlayerIds: playersToRemove,
      preservedPlayerIds: (record.newPlayerIds || []).filter((id) => !allowedPlayers.has(id)),
      noviceDeactivatedPlayerIds: (record.noviceActivatedPlayerIds || []).filter((playerId, index) => {
        const player = aggregateSnapshots[noviceSnapshotOffset + index]?.data() || {};
        return player.noviceReasonImportId === importId;
      }),
    };
  });
  return result;
}

window.BabaImportRepository = Object.freeze({
  loadAliases,
  loadImports,
  findSimilarImports,
  commitImport,
  updateAlias,
  recordPlayerStatus,
  revertImport,
  currentUser,
});

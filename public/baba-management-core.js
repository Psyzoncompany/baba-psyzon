(function exposeBabaManagementCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BabaManagementCore = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

  function shuffleItems(items = [], random = Math.random) {
    const list = [...items];
    for (let index = list.length - 1; index > 0; index -= 1) {
      const sampled = Number(random());
      const unit = Number.isFinite(sampled) ? Math.min(Math.max(sampled, 0), 0.9999999999999999) : Math.random();
      const randomIndex = Math.floor(unit * (index + 1));
      [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
    }
    return list;
  }

  function buildRandomTeamGroups(players = [], options = {}) {
    const fieldPlayersPerTeam = Math.max(1, Number(options.fieldPlayersPerTeam || 4));
    const minTeams = Math.max(1, Number(options.minTeams || 1));
    const maxTeams = Math.max(minTeams, Number(options.maxTeams || Number.MAX_SAFE_INTEGER));
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const seenIds = new Set();
    const uniquePlayers = (Array.isArray(players) ? players : []).filter((player) => {
      const id = String(player?.id || '');
      if (!id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
    if (!uniquePlayers.length) return [];

    const fieldPlayers = shuffleItems(uniquePlayers.filter((player) => player.tipo !== 'goleiro'), random);
    const goalkeepers = shuffleItems(uniquePlayers.filter((player) => player.tipo === 'goleiro'), random);
    const requiredByFieldPlayers = Math.max(1, Math.ceil(fieldPlayers.length / fieldPlayersPerTeam));
    const teamCount = Math.min(maxTeams, Math.max(minTeams, requiredByFieldPlayers));
    const groups = Array.from({ length: teamCount }, () => []);

    fieldPlayers.forEach((player, index) => {
      const teamIndex = index < teamCount * fieldPlayersPerTeam
        ? Math.floor(index / fieldPlayersPerTeam)
        : index % teamCount;
      groups[teamIndex].push(player);
    });

    const goalkeeperTeamOrder = shuffleItems(Array.from({ length: teamCount }, (_, index) => index), random);
    goalkeepers.forEach((player, index) => {
      groups[goalkeeperTeamOrder[index % goalkeeperTeamOrder.length]].push(player);
    });

    return groups.map((group) => shuffleItems(group, random));
  }

  function parseScore(value) {
    const text = String(value ?? '').trim();
    if (!/^\d{1,2}$/.test(text)) throw new Error('O placar deve ser um numero inteiro entre 0 e 99.');
    return Number(text);
  }

  function scorerSelections(events, teamId, score, externalScorerId) {
    const current = (events || [])
      .filter((event) => event?.time === teamId)
      .map((event) => event.jogadorId || externalScorerId);
    return Array.from({ length: score }, (_, index) => current[index] || externalScorerId);
  }

  function buildGoalEvents({
    existingEvents = [],
    teamId,
    teamName,
    scorerIds = [],
    externalScorerId,
    playersById = {},
    createId,
    timestamp = Date.now(),
  }) {
    const previous = existingEvents.filter((event) => event?.time === teamId);
    return scorerIds.map((scorerId, index) => {
      const old = previous[index] || {};
      const isExternal = !scorerId || scorerId === externalScorerId;
      const player = isExternal ? null : playersById[scorerId];
      return {
        id: old.id || createId(),
        jogadorId: player?.id || null,
        jogadorNome: player?.nome || 'Jogador de fora',
        external: isExternal,
        time: teamId,
        timeNome: teamName,
        minuto: old.minuto ?? null,
        registradoEm: Number(old.registradoEm || timestamp),
      };
    });
  }

  function rewriteHistoricalRosters(baba, playerId, targetTeamId = null) {
    const teams = new Map((baba?.teams || []).map((team) => [team.id, [...(team.jogadores || [])]]));
    (baba?.jogos || []).forEach((game) => {
      const rosterA = Array.isArray(game.jogadoresTimeA) ? game.jogadoresTimeA : (teams.get(game.timeA) || []);
      const rosterB = Array.isArray(game.jogadoresTimeB) ? game.jogadoresTimeB : (teams.get(game.timeB) || []);
      game.jogadoresTimeA = rosterA.filter((id) => id !== playerId);
      game.jogadoresTimeB = rosterB.filter((id) => id !== playerId);
      if (targetTeamId === game.timeA && !game.jogadoresTimeA.includes(playerId)) game.jogadoresTimeA.push(playerId);
      if (targetTeamId === game.timeB && !game.jogadoresTimeB.includes(playerId)) game.jogadoresTimeB.push(playerId);
    });
  }

  function gameRosterForTeam(game, teamId) {
    if (teamId === game?.timeA) return Array.isArray(game.jogadoresTimeA) ? game.jogadoresTimeA : [];
    if (teamId === game?.timeB) return Array.isArray(game.jogadoresTimeB) ? game.jogadoresTimeB : [];
    return [];
  }

  function syncGameResult(game) {
    const scoreA = Number(game?.placarA || 0);
    const scoreB = Number(game?.placarB || 0);
    game.empate = scoreA === scoreB;
    game.resultado = game.empate ? 'empate' : 'vitoria';
    game.vencedor = game.empate ? null : (scoreA > scoreB ? game.timeA : game.timeB);
    game.perdedor = game.empate ? null : (scoreA > scoreB ? game.timeB : game.timeA);
  }

  function expandLegacyGoalEvents(game, createId, timestamp) {
    if (Array.isArray(game.goalEvents) && game.goalEvents.length) return game.goalEvents;
    game.goalEvents = [];
    (game.gols || []).forEach((goal) => {
      const quantity = Math.max(0, Number(goal?.quantidade || 0));
      for (let index = 0; index < quantity; index += 1) {
        game.goalEvents.push({
          id: createId(),
          jogadorId: goal.jogadorId || null,
          jogadorNome: goal.jogadorNome || 'Jogador de fora',
          external: Boolean(goal.external || !goal.jogadorId),
          time: goal.time,
          timeNome: goal.timeNome || '',
          minuto: null,
          registradoEm: timestamp,
        });
      }
    });
    return game.goalEvents;
  }

  function setHistoricalPlayerGoals({
    baba,
    playerId,
    playerName,
    targetGoals,
    createId,
    timestamp = Date.now(),
  }) {
    const target = parseScore(targetGoals);
    const games = Array.isArray(baba?.jogos) ? baba.jogos : [];
    const occurrences = [];

    games.forEach((game) => {
      expandLegacyGoalEvents(game, createId, timestamp).forEach((event) => {
        if (event?.jogadorId === playerId && !event.external) occurrences.push({ game, event });
      });
    });

    if (target < occurrences.length) {
      occurrences.slice(target).forEach(({ game, event }) => {
        const eventIndex = game.goalEvents.indexOf(event);
        if (eventIndex >= 0) game.goalEvents.splice(eventIndex, 1);
        if (event.time === game.timeA) game.placarA = Math.max(0, Number(game.placarA || 0) - 1);
        if (event.time === game.timeB) game.placarB = Math.max(0, Number(game.placarB || 0) - 1);
      });
    }

    let remaining = Math.max(0, target - occurrences.length);
    while (remaining) {
      const game = [...games].reverse().find((item) => (
        gameRosterForTeam(item, item.timeA).includes(playerId)
        || gameRosterForTeam(item, item.timeB).includes(playerId)
      ));
      if (!game) throw new Error(`Nao ha partida compativel para adicionar gols de ${playerName}.`);
      const teamId = gameRosterForTeam(game, game.timeA).includes(playerId) ? game.timeA : game.timeB;
      const isTeamA = teamId === game.timeA;
      const teamName = isTeamA ? (game.timeANome || 'Time A') : (game.timeBNome || 'Time B');
      game.goalEvents.push({
        id: createId(),
        jogadorId: playerId,
        jogadorNome: playerName,
        external: false,
        time: teamId,
        timeNome: teamName,
        minuto: null,
        registradoEm: timestamp,
      });
      if (isTeamA) game.placarA = Number(game.placarA || 0) + 1;
      else game.placarB = Number(game.placarB || 0) + 1;
      remaining -= 1;
    }

    games.forEach(syncGameResult);
    return target;
  }

  function sortGoalkeeperRanking(items = []) {
    return [...items].sort((a, b) => (
      Number(a.derrotas || 0) - Number(b.derrotas || 0)
      || Number(b.vitorias || 0) - Number(a.vitorias || 0)
      || Number(b.empates || 0) - Number(a.empates || 0)
      || Number(a.golsSofridos || 0) - Number(b.golsSofridos || 0)
      || Number(a.mediaSofridos || 0) - Number(b.mediaSofridos || 0)
      || Number(b.jogos || 0) - Number(a.jogos || 0)
      || String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
    ));
  }

  function mergePaymentRecords(localRecord = {}, remoteRecord = {}) {
    const localPayments = localRecord?.pagamentos && typeof localRecord.pagamentos === 'object'
      ? localRecord.pagamentos
      : {};
    const remotePayments = remoteRecord?.pagamentos && typeof remoteRecord.pagamentos === 'object'
      ? remoteRecord.pagamentos
      : {};
    const localTimes = localRecord?.paymentUpdatedAtMs && typeof localRecord.paymentUpdatedAtMs === 'object'
      ? localRecord.paymentUpdatedAtMs
      : {};
    const remoteTimes = remoteRecord?.paymentUpdatedAtMs && typeof remoteRecord.paymentUpdatedAtMs === 'object'
      ? remoteRecord.paymentUpdatedAtMs
      : {};
    const pagamentos = {};
    const paymentUpdatedAtMs = {};

    new Set([...Object.keys(localPayments), ...Object.keys(remotePayments)]).forEach((playerId) => {
      const hasLocal = Object.prototype.hasOwnProperty.call(localPayments, playerId);
      const hasRemote = Object.prototype.hasOwnProperty.call(remotePayments, playerId);
      const localTime = Number(localTimes[playerId] || localRecord?.atualizadoEm || 0);
      const remoteTime = Number(remoteTimes[playerId] || remoteRecord?.atualizadoEm || 0);
      const recoverLegacyPaid = Number(localRecord?.mergeSchemaVersion || 0) < 2
        && hasRemote
        && Boolean(remotePayments[playerId])
        && !Boolean(localPayments[playerId]);
      const useLocal = hasLocal && !recoverLegacyPaid && (!hasRemote || localTime >= remoteTime);
      pagamentos[playerId] = Boolean(useLocal ? localPayments[playerId] : remotePayments[playerId]);
      paymentUpdatedAtMs[playerId] = useLocal ? localTime : remoteTime;
    });

    return {
      pagamentos,
      paymentUpdatedAtMs,
      atualizadoEm: Math.max(Number(localRecord?.atualizadoEm || 0), Number(remoteRecord?.atualizadoEm || 0)),
      mergeSchemaVersion: 2,
    };
  }

  return Object.freeze({
    shuffleItems,
    buildRandomTeamGroups,
    parseScore,
    scorerSelections,
    buildGoalEvents,
    rewriteHistoricalRosters,
    setHistoricalPlayerGoals,
    sortGoalkeeperRanking,
    mergePaymentRecords,
  });
});

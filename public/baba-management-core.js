(function exposeBabaManagementCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BabaManagementCore = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  'use strict';

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
      occurrences.slice(target).forEach(({ event }) => {
        event.jogadorId = null;
        event.jogadorNome = 'Jogador de fora';
        event.external = true;
      });
    }

    let remaining = Math.max(0, target - occurrences.length);
    if (remaining) {
      for (const game of games) {
        for (const event of game.goalEvents || []) {
          if (!remaining) break;
          const roster = gameRosterForTeam(game, event.time);
          if (!event.external || event.jogadorId || !roster.includes(playerId)) continue;
          event.jogadorId = playerId;
          event.jogadorNome = playerName;
          event.external = false;
          remaining -= 1;
        }
        if (!remaining) break;
      }
    }

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

  return Object.freeze({
    parseScore,
    scorerSelections,
    buildGoalEvents,
    rewriteHistoricalRosters,
    setHistoricalPlayerGoals,
    sortGoalkeeperRanking,
  });
});

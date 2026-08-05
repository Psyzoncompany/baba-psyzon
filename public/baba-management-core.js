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

  return Object.freeze({
    parseScore,
    scorerSelections,
    buildGoalEvents,
    rewriteHistoricalRosters,
  });
});

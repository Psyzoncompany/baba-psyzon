const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../baba-management-core.js');

function seededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function players(fieldCount, goalkeeperCount = 0) {
  return [
    ...Array.from({ length: fieldCount }, (_, index) => ({
      id: `field_${index + 1}`,
      nome: index === 0 ? 'Rodrigol' : `Linha ${index + 1}`,
      tipo: 'linha',
    })),
    ...Array.from({ length: goalkeeperCount }, (_, index) => ({
      id: `goalkeeper_${index + 1}`,
      nome: `Goleiro ${index + 1}`,
      tipo: 'goleiro',
    })),
  ];
}

test('sorteio distribui cada jogador uma unica vez e equilibra os goleiros', () => {
  const roster = players(12, 3);
  const groups = core.buildRandomTeamGroups(roster, {
    fieldPlayersPerTeam: 4,
    minTeams: 2,
    maxTeams: 5,
    random: seededRandom(42),
  });

  assert.equal(groups.length, 3);
  assert.deepEqual(groups.map((group) => group.length), [5, 5, 5]);
  assert.equal(new Set(groups.flat().map((player) => player.id)).size, roster.length);
  assert.deepEqual(groups.map((group) => group.filter((player) => player.tipo === 'goleiro').length), [1, 1, 1]);
});

test('nome Rodrigol nao altera time nem posicao calculados pelo sorteio', () => {
  const original = players(8, 2);
  const renamed = original.map((player) => ({
    ...player,
    nome: player.id === 'field_1' ? 'Qualquer Jogador' : player.nome,
  }));
  const options = { fieldPlayersPerTeam: 4, minTeams: 2, maxTeams: 5 };
  const first = core.buildRandomTeamGroups(original, { ...options, random: seededRandom(99) });
  const second = core.buildRandomTeamGroups(renamed, { ...options, random: seededRandom(99) });

  assert.deepEqual(
    first.map((group) => group.map((player) => player.id)),
    second.map((group) => group.map((player) => player.id)),
  );
});

test('Rodrigol pode cair em times e posicoes diferentes conforme o acaso', () => {
  const roster = players(12, 3);
  const placements = new Set();
  for (let seed = 1; seed <= 30; seed += 1) {
    const groups = core.buildRandomTeamGroups(roster, {
      fieldPlayersPerTeam: 4,
      minTeams: 2,
      maxTeams: 5,
      random: seededRandom(seed),
    });
    groups.forEach((group, teamIndex) => {
      const position = group.findIndex((player) => player.id === 'field_1');
      if (position >= 0) placements.add(`${teamIndex}:${position}`);
    });
  }

  assert.ok(placements.size > 3, `posicoes observadas: ${[...placements].join(', ')}`);
  assert.ok([...placements].some((placement) => !placement.endsWith(':0')));
});

test('novo lote de nove atrasados cria somente os times do lote, sem duplicar jogadores', () => {
  const latePlayers = players(9, 1);
  const groups = core.buildRandomTeamGroups(latePlayers, {
    fieldPlayersPerTeam: 4,
    minTeams: 1,
    random: seededRandom(7),
  });

  assert.equal(groups.length, 3);
  assert.deepEqual(
    groups.map((group) => group.filter((player) => player.tipo !== 'goleiro').length),
    [4, 4, 1],
  );
  assert.equal(groups.flat().length, latePlayers.length);
  assert.equal(new Set(groups.flat().map((player) => player.id)).size, latePlayers.length);
});

test('integracao nao possui excecao por nome e oferece o fluxo de recem-chegados', () => {
  const app = fs.readFileSync(path.resolve(__dirname, '..', 'baba.js'), 'utf8');
  const page = fs.readFileSync(path.resolve(__dirname, '..', 'baba.html'), 'utf8');

  assert.doesNotMatch(app, /toLowerCase\(\)\s*===\s*['"]rodrigol['"]/i);
  assert.match(app, /buildRandomTeamGroups\(availablePlayers/);
  assert.match(app, /beginDrawExperience\(baba, \{ startIndex: firstNewTeamIndex \}\)/);
  assert.match(page, /data-action="continue-present-draw"/);
});

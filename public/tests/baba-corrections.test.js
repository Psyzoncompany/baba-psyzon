const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { jsPDF } = require('jspdf');

const publicRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');
const core = require('../baba-management-core.js');

test('correcao de placar cria exatamente um evento por gol e preserva gols sem artilheiro', () => {
  assert.equal(core.parseScore('0'), 0);
  assert.equal(core.parseScore('99'), 99);
  assert.throws(() => core.parseScore('-1'));
  assert.throws(() => core.parseScore('2.5'));

  const events = core.buildGoalEvents({
    existingEvents: [{ id: 'old', time: 'team_1', jogadorId: 'p1', minuto: 2, registradoEm: 10 }],
    teamId: 'team_1',
    teamName: 'Time 1',
    scorerIds: ['p1', '__external__', 'p2'],
    externalScorerId: '__external__',
    playersById: {
      p1: { id: 'p1', nome: 'Ana' },
      p2: { id: 'p2', nome: 'Beto' },
    },
    createId: (() => { let index = 0; return () => `new_${++index}`; })(),
    timestamp: 20,
  });

  assert.equal(events.length, 3);
  assert.equal(events[0].id, 'old');
  assert.equal(events[0].minuto, 2);
  assert.equal(events[1].jogadorId, null);
  assert.equal(events[1].external, true);
  assert.equal(events[2].jogadorNome, 'Beto');
});

test('movimentacao no historico reescreve os elencos congelados sem alterar gols', () => {
  const baba = {
    teams: [
      { id: 'team_1', jogadores: ['p1', 'p2'] },
      { id: 'team_2', jogadores: ['p3'] },
    ],
    jogos: [
      { timeA: 'team_1', timeB: 'team_2', jogadoresTimeA: ['p1', 'p2'], jogadoresTimeB: ['p3'], gols: [{ jogadorId: 'p1', quantidade: 1 }] },
      { timeA: 'team_2', timeB: 'team_1', jogadoresTimeA: ['p3'], jogadoresTimeB: ['p1', 'p2'], gols: [] },
    ],
  };

  core.rewriteHistoricalRosters(baba, 'p1', 'team_2');
  assert.deepEqual(baba.jogos[0].jogadoresTimeA, ['p2']);
  assert.deepEqual(baba.jogos[0].jogadoresTimeB, ['p3', 'p1']);
  assert.deepEqual(baba.jogos[1].jogadoresTimeA, ['p3', 'p1']);
  assert.deepEqual(baba.jogos[1].jogadoresTimeB, ['p2']);
  assert.equal(baba.jogos[0].gols[0].jogadorId, 'p1');
});

test('edicao de gols historicos mantem autoria, placar e resultado consistentes', () => {
  const ids = (() => { let index = 0; return () => `goal_${++index}`; })();
  const baba = {
    jogos: [{
      numeroJogo: 1,
      timeA: 'team_1',
      timeB: 'team_2',
      timeANome: 'Time 1',
      timeBNome: 'Time 2',
      jogadoresTimeA: ['p1'],
      jogadoresTimeB: ['p2'],
      placarA: 1,
      placarB: 0,
      goalEvents: [{ id: 'old', jogadorId: 'p1', jogadorNome: 'Ana', external: false, time: 'team_1', timeNome: 'Time 1' }],
      gols: [],
    }],
  };

  core.setHistoricalPlayerGoals({ baba, playerId: 'p1', playerName: 'Ana', targetGoals: 1, createId: ids });
  assert.equal(baba.jogos[0].goalEvents[0].jogadorId, 'p1');
  assert.equal(baba.jogos[0].placarA, 1);

  core.setHistoricalPlayerGoals({ baba, playerId: 'p1', playerName: 'Ana', targetGoals: 3, createId: ids });
  assert.equal(baba.jogos[0].placarA, 3);
  assert.equal(baba.jogos[0].vencedor, 'team_1');
  assert.equal(baba.jogos[0].goalEvents.filter((goal) => goal.jogadorId === 'p1').length, 3);

  core.setHistoricalPlayerGoals({ baba, playerId: 'p1', playerName: 'Ana', targetGoals: 1, createId: ids });
  assert.equal(baba.jogos[0].placarA, 1);
  assert.equal(baba.jogos[0].goalEvents.filter((goal) => goal.jogadorId === 'p1').length, 1);
  assert.equal(baba.jogos[0].goalEvents.length, 1);
  assert.equal(baba.jogos[0].vencedor, 'team_1');
});

test('melhor goleiro prioriza menos derrotas e depois mais vitorias', () => {
  const sorted = core.sortGoalkeeperRanking([
    { nome: 'A', derrotas: 0, vitorias: 1, golsSofridos: 1, jogos: 2 },
    { nome: 'B', derrotas: 1, vitorias: 10, golsSofridos: 0, jogos: 11 },
    { nome: 'C', derrotas: 0, vitorias: 3, golsSofridos: 4, jogos: 4 },
  ]);
  assert.deepEqual(sorted.map((item) => item.nome), ['C', 'A', 'B']);
});

test('interface usa modais canonicos e persistencia idempotente nas seis correcoes', () => {
  const app = read('baba.js');
  const html = read('baba.html');
  const persistence = read('baba-persistence.js');
  assert.match(app, /function openFinishedGameEditor/);
  assert.match(app, /function refreshBabaDerivedData/);
  assert.match(app, /rewriteHistoricalRosters/);
  assert.doesNotMatch(app, /function editHistoryPlayerGoals/);
  assert.match(html, /id="game-edit-modal"/);
  assert.match(html, /id="history-edit-modal"/);
  assert.match(app, /function saveHistorySummaryEdit/);
  assert.match(app, /function getDisplayedBaba/);
  assert.match(app, /Carregando o ultimo baba/);
  assert.match(app, /openFinishedGameEditor\(actionButton\.dataset\.gameNumber, actionButton\.dataset\.babaId \|\| null\)/);
  assert.match(app, /if \(baba\.__detailLoaded\) return calculateDailyRanking\(baba\)/);
  assert.match(app, /columns: \['Pos', 'Goleiro', 'Derrotas', 'Vitórias', 'Empates', 'Jogos', 'Sofridos', 'Babas'\]/);
  assert.doesNotMatch(app, /melhor goleiro pelo criterio de menos gols sofridos/);
  assert.match(persistence, /const deletedPlayerIds = new Set\(\)/);
  assert.match(persistence, /const remotePlayerDocumentIds = new Map\(\)/);
  assert.match(persistence, /item\.playerId \|\| item\.id \|\| snapshotItem\.id/);
  assert.match(persistence, /remotePlayerDocumentIds\.get\(originalId\)/);
  assert.match(persistence, /statsRevisionSignature/);
  assert.match(persistence, /game\.placarA \?\? game\.scoreA/);
});

test('relatorios genericos com uma, tres ou cinco secoes permanecem em uma pagina', () => {
  global.window = { jspdf: { jsPDF } };
  delete require.cache[require.resolve('../pdf-report.js')];
  require('../pdf-report.js');

  [1, 3, 5].forEach((sectionCount) => {
    const document = window.PsyzonPdf.createReport({
      type: sectionCount === 1 ? 'daily-scorers' : 'rankings',
      title: 'Relatorio do Baba',
      subtitle: 'Teste de pagina unica',
      generatedAt: '05/08/2026',
      brand: 'Baba Psyzon',
      summary: [['Presentes', '24'], ['Jogos', '12'], ['Times', '4']],
      sections: Array.from({ length: sectionCount }, (_, sectionIndex) => ({
        title: `Secao ${sectionIndex + 1}`,
        note: 'Tabela completa',
        maxRows: sectionCount === 1 ? 26 : 8,
        columns: ['Pos', 'Jogador', 'Gols', 'V', 'E', 'D', 'Aprov.', 'Tit.'],
        rows: Array.from({ length: sectionCount === 1 ? 26 : 8 }, (_, rowIndex) => [
          rowIndex + 1, `Jogador ${rowIndex + 1}`, 20 - rowIndex, 5, 1, 2, '70%', 1,
        ]),
      })),
    });
    assert.equal(document.getNumberOfPages(), 1);
  });
});

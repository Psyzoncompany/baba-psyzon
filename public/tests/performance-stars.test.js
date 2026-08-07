const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { jsPDF } = require('jspdf');

const stars = require('../baba-performance-stars.js');

test('score usa apenas estatisticas suportadas pelo sistema', () => {
  const score = stars.playerScore({
    totalVitorias: 2,
    totalEmpates: 1,
    totalGols: 3,
  });
  assert.equal(score, 23);
});

test('faixas adaptativas seguem a comparacao com a media', () => {
  assert.equal(stars.levelFromRatio(0.79).stars, 0);
  assert.equal(stars.levelFromRatio(0.8).stars, 1);
  assert.equal(stars.levelFromRatio(1).stars, 2);
  assert.equal(stars.levelFromRatio(1.25).stars, 3);
  assert.equal(stars.levelFromRatio(1.5).stars, 4);
  assert.equal(stars.levelFromRatio(1.8).stars, 5);
});

test('exibicao adiciona meia estrela ao cruzar metade do proximo nivel', () => {
  const lowRated = stars.calculateRatings([
    { jogadorId: 'low', totalEmpates: 20, totalJogos: 20 },
    { jogadorId: 'high', totalVitorias: 20, totalEmpates: 5, totalGols: 10, totalJogos: 25 },
  ], { completedBabas: 10 })[0];
  assert.equal(lowRated.performance.ratio, 0.4);
  assert.equal(lowRated.performance.displayStars, 0.5);

  const goldRated = stars.calculateRatings([
    { jogadorId: 'gold', totalGols: 55, totalJogos: 20 },
    { jogadorId: 'base', totalVitorias: 5, totalGols: 2, totalCartoesAmarelos: 1, totalJogos: 20 },
  ], { completedBabas: 10 })[0];
  assert.equal(goldRated.performance.ratio, 1.65);
  assert.equal(goldRated.performance.displayStars, 4.5);
  assert.equal(goldRated.performance.displayTone, 'diamond');
});

test('menos de dez babas aplica media ponderada e requisito progressivo de jogos', () => {
  const rated = stars.calculateRatings([
    { jogadorId: 'a', totalVitorias: 8, totalJogos: 8 },
    { jogadorId: 'b', totalVitorias: 2, totalJogos: 8 },
  ], { completedBabas: 4 });
  assert.equal(rated[0].performance.adjustedScore, 42.6);
  assert.equal(rated[0].performance.minimumGames, 2);
  assert.equal(rated[0].performance.eligible, true);

  const protectedPlayer = stars.calculateRatings([
    { jogadorId: 'a', totalVitorias: 1, totalJogos: 1 },
    { jogadorId: 'b', totalVitorias: 8, totalJogos: 12 },
  ], { completedBabas: 12 })[0];
  assert.equal(protectedPlayer.performance.eligible, false);
  assert.equal(protectedPlayer.performance.stars, 0);
});

test('goleiro prioriza menos derrotas e depois mais vitorias', () => {
  const safer = stars.goalkeeperScore({ jogos: 10, vitorias: 4, empates: 4, derrotas: 2 });
  const defeatedMore = stars.goalkeeperScore({ jogos: 10, vitorias: 5, empates: 0, derrotas: 5 });
  assert.ok(safer > defeatedMore);
  const moreWins = stars.goalkeeperScore({ jogos: 10, vitorias: 6, empates: 2, derrotas: 2 });
  assert.ok(moreWins > safer);
});

test('ranking de melhores prioriza estrelas e usa a pontuação interna no desempate', () => {
  const players = [
    { jogadorId: 'a', nome: 'A', totalVitorias: 8, totalGols: 4 },
    { jogadorId: 'b', nome: 'B', totalVitorias: 7, totalGols: 8 },
    { jogadorId: 'c', nome: 'C', totalVitorias: 10, totalGols: 2 },
  ];
  const ratings = new Map([
    ['a', { displayStars: 4, score: 70, ratio: 1.5 }],
    ['b', { displayStars: 4.5, score: 65, ratio: 1.6 }],
    ['c', { displayStars: 4, score: 80, ratio: 1.45 }],
  ]);
  const sorted = players.slice().sort((a, b) => stars.comparePerformance(a, b, ratings.get(a.jogadorId), ratings.get(b.jogadorId)));
  assert.deepEqual(sorted.map((player) => player.jogadorId), ['b', 'c', 'a']);
});

test('interface e PDF compartilham celula estruturada de jogador', () => {
  const app = fs.readFileSync(path.resolve(__dirname, '..', 'baba.js'), 'utf8');
  const pdf = fs.readFileSync(path.resolve(__dirname, '..', 'pdf-report.js'), 'utf8');
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'baba.html'), 'utf8');
  const css = fs.readFileSync(path.resolve(__dirname, '..', 'baba-ui.css'), 'utf8');
  assert.match(app, /function pdfPlayerCell/);
  assert.match(app, /function playerNameWithStarsHTML/);
  assert.match(app, /id: 'stars', label: 'Melhores'/);
  assert.doesNotMatch(app, /Índice de Desempenho do Baba|\bIDB(?: goleiro)?\b/);
  assert.doesNotMatch(css, /baba-performance-panel|baba-performance-score|baba-performance-progress/);
  assert.match(app, /const rankingPdfSections = \{/);
  assert.match(app, /columns: \['Pos', 'Goleiro', 'Derrotas', 'Vitórias', 'Empates', 'Jogos', 'Sofridos', 'Babas'\]/);
  assert.match(html, /Exportar este ranking/);
  assert.match(app, /href="#baba-performance-star"/);
  assert.doesNotMatch(app, /[★☆⭐]/);
  assert.match(html, /id="baba-star-half-mask"/);
  assert.match(html, /id="baba-star-diamond"/);
  assert.match(css, /@keyframes baba-diamond-float/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(pdf, /function drawPdfPlayerCell/);
  assert.match(pdf, /function drawPdfStar/);
  assert.match(pdf, /function clipPolygonAtLeftHalf/);
  assert.doesNotMatch(pdf, /goleiros\?/);
  assert.doesNotMatch(pdf, /doc\.clip\(/);
});

test('PDF desenha estrelas inteiras, vazias e meia estrela como vetores', () => {
  global.window = { jspdf: { jsPDF } };
  delete require.cache[require.resolve('../pdf-report.js')];
  require('../pdf-report.js');
  const document = window.PsyzonPdf.createReport({
    type: 'rankings',
    title: 'Ranking com estrelas',
    sections: [{
      title: 'Jogadores',
      columns: ['Pos', 'Jogador', 'Gols'],
      rows: [[1, { type: 'player', text: 'Jogador teste', stars: 3.5, starTone: 'gold' }, 8]],
    }],
  });
  assert.equal(document.getNumberOfPages(), 1);
  assert.ok(document.internal.pageSize.getHeight() > document.internal.pageSize.getWidth());
  assert.ok(document.output('arraybuffer').byteLength > 1000);
});

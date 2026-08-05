const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { jsPDF } = require('jspdf');

const publicRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');

test('código do jogador usa exatamente quatro dígitos numéricos', () => {
  const access = read('baba-access.js');
  const html = read('baba.html');
  assert.match(access, /10 \*\* CODE_LENGTH/);
  assert.match(access, /padStart\(CODE_LENGTH, '0'\)/);
  assert.match(access, /const CODE_LENGTH = 4/);
  assert.match(access, /replace\(\/\\D\/g, ''\)/);
  assert.match(access, /código completo de 4 dígitos/);
  assert.match(html, /inputmode="numeric"/);
  assert.match(html, /pattern="\[0-9\]\{4\}"/);
  assert.match(html, /maxlength="4"/);
});

test('estados de jogador controlam cobrança e visibilidade sem apagar estatísticas', () => {
  const app = read('baba.js');
  assert.match(app, /REGULAR: 'regular'/);
  assert.match(app, /NOVICE: 'novice'/);
  assert.match(app, /GUEST: 'guest'/);
  assert.match(app, /DISABLED: 'disabled'/);
  assert.match(app, /function setPlayerStatus/);
  assert.match(app, /data-player-status-id/);
  assert.match(app, /getPlayerStatus\(player\) === PLAYER_STATUS\.REGULAR/);
  assert.match(app, /status !== PLAYER_STATUS\.GUEST && status !== PLAYER_STATUS\.DISABLED/);
  assert.doesNotMatch(app, /function setPlayerStatus[\s\S]*?delete state\.playerStats/);
});

test('PDF de pagamento separa pagos, pendentes e novatos e omite isentos das cobranças', () => {
  const app = read('baba.js');
  assert.match(app, /title: 'Jogadores que pagaram'/);
  assert.match(app, /title: 'Jogadores pendentes'/);
  assert.match(app, /title: 'Novatos'/);
  assert.match(app, /if \(mode === 'novice'\) return isNovicePlayer\(player\)/);
  assert.match(app, /if \(!isPaymentEligiblePlayer\(player\)\) return false/);
});

test('sincronização de pagamento resolve conflitos por jogador e acompanha o mês em tempo real', () => {
  const persistence = read('baba-persistence.js');
  assert.match(persistence, /paymentUpdatedAtMs/);
  assert.match(persistence, /function startMonthPaymentsSubscription/);
  assert.match(persistence, /const useLocal = .*localTime > remoteTime/);
  assert.match(persistence, /flushPending: flushPendingSave/);
});

test('interface inclui ranking mobile compacto, histórico profissional e exportação TXT', () => {
  const app = read('baba.js');
  const css = read('baba-ui.css');
  assert.match(app, /data-ranking-mode-select/);
  assert.match(app, /data-ranking-scope-select/);
  assert.match(app, /function exportTeamsTxt/);
  assert.match(app, /data-action="export-teams-txt"/);
  assert.match(app, /baba-history-detail-pro/);
  assert.match(css, /\.baba-history-detail-pro/);
  assert.match(css, /\.baba-ranking-compact-select/);
  assert.match(css, /--team-color: #b8a46f/);
});

test('PDF de tabela e PDF de pagamento permanecem em uma página', () => {
  global.window = { jspdf: { jsPDF } };
  delete require.cache[require.resolve('../pdf-report.js')];
  require('../pdf-report.js');

  const payment = window.PsyzonPdf.createReport({
    type: 'payments', title: 'Pagamentos', subtitle: 'Agosto', generatedAt: '03/08/2026', brand: 'Baba Psyzon', summary: [],
    sections: [
      { title: 'Pagos', columns: ['#', 'Jogador', 'Tipo', 'Valor'], rows: [['1', 'Ana', 'JOGADOR', 'R$ 15']] },
      { title: 'Pendentes', columns: ['#', 'Jogador', 'Tipo', 'Valor'], rows: [['1', 'Beto', 'GOLEIRO', 'R$ 7']] },
      { title: 'Novatos', columns: ['#', 'Jogador', 'Tipo', 'Situação'], rows: [['1', 'Caio', 'NOVATO', 'NOVATO']] },
    ],
  });
  assert.equal(payment.getNumberOfPages(), 1);

  const standings = window.PsyzonPdf.createReport({
    type: 'standings', title: 'Tabela de times', subtitle: 'Baba atual', generatedAt: '03/08/2026', brand: 'Baba Psyzon', summary: [],
    sections: Array.from({ length: 4 }, (_, sectionIndex) => ({
      title: `Seção ${sectionIndex + 1}`,
      columns: ['Pos', 'Jogador', 'Gols', 'V', 'Aprov.', 'Babas'],
      rows: Array.from({ length: 12 }, (_, rowIndex) => [rowIndex + 1, `Jogador ${rowIndex + 1}`, 12 - rowIndex, 4, '75%', 3]),
    })),
  });
  assert.equal(standings.getNumberOfPages(), 1);
});

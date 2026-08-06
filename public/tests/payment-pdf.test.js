const test = require('node:test');
const assert = require('node:assert/strict');
const { jsPDF } = require('jspdf');

global.window = { jspdf: { jsPDF } };
require('../pdf-report.js');

test('gera PDF de pagamento com etiquetas independentes de novato, convidado e goleiro', () => {
  const report = {
    type: 'payments',
    title: 'Lista de pagamento',
    subtitle: 'Julho de 2026',
    generatedAt: '01/08/2026 10:00',
    eyebrow: 'Baba Psyzon',
    brand: 'Baba Psyzon',
    summary: [
      ['Esperado', 'R$ 100,00'],
      ['Pago', 'R$ 50,00'],
      ['Pendente', 'R$ 50,00'],
      ['Confirmados', '1/2'],
    ],
    sections: [
      {
        title: 'Jogadores que pagaram',
        columns: ['#', 'Jogador', 'Tipo', 'Valor'],
        rows: [['1', 'Ró', 'JOGADOR', 'R$ 50,00']],
      },
      {
        title: 'Pendentes e novatos',
        columns: ['#', 'Jogador', 'Tipo', 'Valor'],
        rows: [['2', 'Wesley', 'NOVATO · CONVIDADO · GOLEIRO', 'ISENTO']],
      },
      {
        title: 'Jogadores desativados',
        icon: 'user-x',
        columns: ['#', 'Jogador', 'Tipo', 'Situação'],
        rows: [['3', 'Carlos', 'JOGADOR', 'DESATIVADO']],
      },
      {
        title: 'Outro grupo',
        columns: ['#', 'Jogador', 'Tipo', 'Situação'],
        rows: [['4', 'Rui', 'JOGADOR', 'ATIVO']],
      },
    ],
  };

  const document = window.PsyzonPdf.createReport(report);
  const bytes = document.output('arraybuffer');

  assert.ok(bytes.byteLength > 2_000);
  assert.equal(document.getNumberOfPages(), 1);
});

test('PDF de pagamento usa cabecalho compacto e comporta dezoito jogadores por card', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'pdf-report.js'), 'utf8');
  assert.doesNotMatch(source, /drawPaymentHeroVector/);
  assert.match(source, /const summaryY = headerY \+ 20/);
  assert.match(source, /availableRowsHeight \/ 2\.9/);

  const rows = Array.from({ length: 18 }, (_, index) => [index + 1, `Jogador ${index + 1}`, 'JOGADOR', 'R$ 15,00']);
  const document = window.PsyzonPdf.createReport({
    type: 'payments',
    title: 'Lista de pagamento',
    subtitle: 'Agosto de 2026',
    generatedAt: '06/08/2026 10:00',
    brand: 'Baba Psyzon',
    summary: [],
    sections: Array.from({ length: 4 }, (_, index) => ({
      title: `Grupo ${index + 1}`,
      columns: ['#', 'Jogador', 'Tipo', 'Valor'],
      maxRows: 18,
      rows,
    })),
  });
  assert.equal(document.getNumberOfPages(), 1);
});

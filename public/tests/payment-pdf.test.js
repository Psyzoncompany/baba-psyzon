const test = require('node:test');
const assert = require('node:assert/strict');
const { jsPDF } = require('jspdf');

global.window = { jspdf: { jsPDF } };
require('../pdf-report.js');

test('gera PDF de pagamento com etiquetas independentes de novato, convidado e goleiro', () => {
  const report = {
    type: 'payments',
    title: 'Lista de pagamentos',
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
    ],
  };

  const document = window.PsyzonPdf.createReport(report);
  const bytes = document.output('arraybuffer');

  assert.ok(bytes.byteLength > 2_000);
  assert.equal(document.getNumberOfPages(), 1);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');

test('ThemeProvider persiste preferencias e usa o modo do sistema', () => {
  const provider = read('theme-provider.js');
  assert.match(provider, /psyzon_ui_preferences_v1/);
  assert.match(provider, /theme: 'minimal'/);
  assert.match(provider, /mode: 'system'/);
  assert.match(provider, /density: 'normal'/);
  assert.match(provider, /radius: 'medium'/);
  assert.match(provider, /motion: 'full'/);
  assert.match(provider, /prefers-color-scheme: dark/);
  assert.match(provider, /window\.ThemeProvider = Object\.freeze/);
  assert.match(provider, /psyzon-theme-change/);
});

test('tokens cobrem temas minimalista e glass em claro e escuro', () => {
  const css = read('theme-system.css');
  [
    '--primary: #2563eb',
    '--background: #f8fafc',
    '--card: #ffffff',
    '--border: #e5e7eb',
    '--text: #111827',
    '--success: #16a34a',
    '--warning: #f59e0b',
    '--danger: #dc2626',
  ].forEach((token) => assert.match(css, new RegExp(token)));
  assert.match(css, /data-color-mode="dark"/);
  assert.match(css, /data-theme="glass"\]\[data-color-mode="light"/);
  assert.match(css, /data-theme="glass"\]\[data-color-mode="dark"/);
  assert.match(css, /fonts\/InterVariable\.woff2/);
  assert.match(css, /--control-height: 44px/);
});

test('Aparencia oferece todos os controles e os modulos carregam o provedor', () => {
  const settings = read('configuracoes.html');
  assert.match(settings, /data-theme-settings/);
  assert.match(settings, /Minimalista/);
  assert.match(settings, /Glassmorphism/);
  assert.match(settings, /value="system"/);
  assert.match(settings, /value="compact"/);
  assert.match(settings, /value="comfortable"/);
  assert.match(settings, /value="reduced"/);
  assert.match(settings, /Português \(Brasil\)/);
  assert.match(read('baba.html'), /configuracoes\.html#appearance-title/);

  [
    'baba.html', 'index.html', 'central.html', 'clientes.html', 'configuracoes.html',
    'contas.html', 'historico.html', 'HistoricoPedidos.html', 'investimentos.html',
    'login.html', 'mesa-tatica.html', 'processos.html', 'relatorios.html', 'versoes.html',
  ].forEach((file) => {
    const html = read(file);
    assert.match(html, /theme-system\.css/, `${file} precisa carregar os tokens`);
    assert.match(html, /theme-provider\.js/, `${file} precisa carregar o ThemeProvider`);
    assert.match(html, /vendor\/lucide\.min\.js/, `${file} precisa carregar Lucide`);
  });
});

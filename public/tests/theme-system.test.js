const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');

test('ThemeProvider persiste preferencias e usa o modo do sistema', () => {
  const provider = read('theme-provider.js');
  assert.match(provider, /psyzon_ui_preferences_v1/);
  assert.match(provider, /mode: 'system'/);
  assert.match(provider, /density: 'normal'/);
  assert.match(provider, /radius: 'medium'/);
  assert.match(provider, /motion: 'full'/);
  assert.match(provider, /prefers-color-scheme: dark/);
  assert.match(provider, /window\.ThemeProvider = Object\.freeze/);
  assert.match(provider, /psyzon-theme-change/);
});

test('tokens cobrem o tema minimalista em claro e escuro sem glassmorphism', () => {
  const css = read('theme-system.css');
  const provider = read('theme-provider.js');
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
  assert.doesNotMatch(css, /data-theme="glass"/);
  assert.doesNotMatch(provider, /MutationObserver/);
  assert.match(css, /fonts\/InterVariable\.woff2/);
  assert.match(css, /--control-height: 44px/);
  assert.match(css, /body\.baba-app-mode \.baba-tabs \{[\s\S]*display: flex !important/);
  assert.match(css, /\.baba-organizer-intro[\s\S]*background: var\(--card\) !important/);
});

test('Aparencia oferece todos os controles e os modulos carregam o provedor', () => {
  const settings = read('baba-aparencia.html');
  assert.match(settings, /data-theme-settings/);
  assert.doesNotMatch(settings, /Glassmorphism/);
  assert.match(settings, /value="system"/);
  assert.match(settings, /value="compact"/);
  assert.match(settings, /value="comfortable"/);
  assert.match(settings, /value="reduced"/);
  assert.match(settings, /Português \(Brasil\)/);
  assert.match(read('baba.html'), /baba-aparencia\.html/);

  [
    'baba.html', 'baba-aparencia.html', 'mesa-tatica.html',
  ].forEach((file) => {
    const html = read(file);
    assert.match(html, /theme-system\.css/, `${file} precisa carregar os tokens`);
    assert.match(html, /theme-provider\.js/, `${file} precisa carregar o ThemeProvider`);
    assert.match(html, /vendor\/lucide\.min\.js/, `${file} precisa carregar Lucide`);
    assert.match(html, /vendor\/lucide\.min\.js[^>]* defer/, `${file} precisa carregar Lucide sem bloquear a pagina`);
  });
});

test('carregamento visual evita observadores desnecessarios', () => {
  const provider = read('theme-provider.js');
  assert.doesNotMatch(provider, /MutationObserver/);
});

test('desktop exibe navegacao completa e historico remove o estado vazio', () => {
  const html = read('baba.html');
  const app = read('baba.js');
  const css = read('theme-system.css');
  assert.match(html, /baba-desktop-nav-item[^>]*data-tab="teams"/);
  assert.match(html, /baba-desktop-nav-item[^>]*data-tab="goals"/);
  assert.match(css, /body\.baba-app-mode \.baba-more-nav \{ display: none !important; \}/);
  assert.match(app, /historyDetail\.classList\.remove\('baba-empty'\)/);
  assert.match(read('baba-ui.css'), /\.baba-standings-table \{[\s\S]*gap: 0;/);
});

test('mobile preserva o menu Mais e somente o organizador personaliza os times', () => {
  const css = read('theme-system.css');
  const html = read('baba-aparencia.html');
  const teamTheme = read('baba-team-theme.js');
  const teamAppearance = read('baba-team-appearance.js');
  assert.match(css, /@media \(max-width: 1100px\)[\s\S]*\.baba-more-nav \{ display: block !important; \}/);
  assert.match(css, /\.baba-more-menu\.is-floating[\s\S]*max-height:/);
  assert.match(css, /\.dashboard-grid:has\(\.baba-manual-live\)/);
  assert.match(css, /\.baba-card__head \{[\s\S]*margin: 0 0 var\(--space-5\) !important/);
  assert.match(css, /\.baba-card-icon[\s\S]*background: color-mix\(in srgb, var\(--primary\) 10%, var\(--card\)\) !important/);
  assert.match(html, /data-team-theme-grid/);
  assert.match(html, /baba-team-theme\.js/);
  assert.match(teamTheme, /psyzon_baba_team_theme_v1/);
  assert.match(teamTheme, /--team-\$\{team\.number\}-custom-color/);
  assert.match(teamAppearance, /data-team-color/);
  assert.match(teamAppearance, /data-team-name/);
  assert.match(teamAppearance, /data-team-logo/);
  assert.match(teamAppearance, /data-team-upload/);
  assert.match(teamAppearance, /Somente o organizador/);
  assert.match(teamTheme, /function canManage\(\)/);
  assert.match(teamTheme, /if \(!canManage\(\)\) return null/);
  assert.match(teamTheme, /baba-team-1-flamengo\.jpg/);
  assert.match(teamTheme, /baba-team-2-palmeiras\.webp/);
  assert.match(read('baba.js'), /BabaTeamTheme\?\.getTeam/);
});

test('sidebar desktop reserva espaco e nao cobre o cabecalho ou os cards', () => {
  const css = read('theme-system.css');
  assert.match(css, /@media \(min-width: 1101px\)/);
  assert.match(css, /body\.baba-app-mode \.baba-tabs \{[\s\S]*top: 100px;[\s\S]*left: 24px;/);
  assert.match(css, /body\.baba-app-mode \.baba-shell \{[\s\S]*margin-right: 24px;[\s\S]*margin-left: 256px;/);
  assert.match(css, /overflow-y: auto !important;/);
});

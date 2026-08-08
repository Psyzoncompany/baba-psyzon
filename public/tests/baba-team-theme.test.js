const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'baba-team-theme.js'), 'utf8');

function createRuntime(seed = {}, { mode = 'organizer', search = '' } = {}) {
  const values = new Map(Object.entries(seed));
  values.set('psyzon_baba_mode', mode);
  const properties = new Map();
  const listeners = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const window = {
    localStorage: storage,
    sessionStorage: storage,
    location: { search },
    addEventListener(type, callback) { listeners.set(type, callback); },
    dispatchEvent() {},
  };
  const document = {
    documentElement: {
      style: {
        setProperty(name, value) { properties.set(name, value); },
      },
    },
  };
  const context = vm.createContext({
    window,
    document,
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
  });
  vm.runInContext(source, context);
  return { api: window.BabaTeamTheme, values, properties, listeners };
}

test('tema dos times aplica cor, escudo, persistencia e restauracao', () => {
  const runtime = createRuntime();
  assert.equal(runtime.api.getTeams().length, 5);
  assert.equal(runtime.api.getDefaultTeams()[0].logo, 'img/baba-team-1-flamengo.jpg');
  assert.equal(runtime.api.getDefaultTeams()[1].logo, 'img/baba-team-2-palmeiras.webp');
  assert.equal(runtime.properties.get('--team-1-custom-color'), '#E12A3F');

  const logo = 'img/baba-team-3-vasco.png';
  runtime.api.setTeam(1, { name: 'Seleção Principal', color: '#123456', logo });
  assert.equal(runtime.api.getTeam(1).name, 'Seleção Principal');
  assert.equal(runtime.api.getTeam(1).color, '#123456');
  assert.equal(runtime.api.getTeam(1).logo, logo);
  assert.equal(runtime.properties.get('--team-1-custom-color'), '#123456');

  const persisted = JSON.parse(runtime.values.get(runtime.api.storageKey));
  assert.equal(persisted['1'].name, 'Seleção Principal');
  assert.equal(persisted['1'].color, '#123456');
  assert.equal(persisted['1'].logo, logo);

  runtime.api.resetTeam(1);
  assert.equal(runtime.api.getTeam(1).color, '#E12A3F');
  assert.equal(runtime.api.getTeam(1).name, 'Time 1');
  assert.equal(runtime.api.getTeam(1).logo, 'img/baba-team-1-flamengo.jpg');
});

test('tema dos times rejeita valores inseguros salvos', () => {
  const key = 'psyzon_baba_team_theme_v1';
  const runtime = createRuntime({
    [key]: JSON.stringify({ 1: { color: 'red; background:url(x)', logo: 'javascript:alert(1)' } }),
  });
  assert.equal(runtime.api.getTeam(1).color, '#E12A3F');
  assert.equal(runtime.api.getTeam(1).logo, 'img/baba-team-1-flamengo.jpg');
});

test('somente o organizador pode alterar a identidade dos times', () => {
  const runtime = createRuntime({}, { mode: 'player' });
  assert.equal(runtime.api.canManage(), false);
  assert.equal(runtime.api.setTeam(1, { name: 'Invasor', color: '#123456' }), null);
  assert.equal(runtime.api.resetTeam(1), null);
  assert.equal(runtime.api.getTeam(1).name, 'Time 1');
  assert.equal(runtime.api.getTeam(1).color, '#E12A3F');

  const forcedViewer = createRuntime({}, { mode: 'organizer', search: '?view=player' });
  assert.equal(forcedViewer.api.canManage(), false);
});

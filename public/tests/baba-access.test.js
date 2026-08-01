const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(publicRoot, '..');

function readPublic(file) {
  return fs.readFileSync(path.join(publicRoot, file), 'utf8');
}

test('login Google usa persistencia local e informa mudancas de autenticacao', () => {
  const source = readPublic('firebase-config.js');

  assert.match(source, /setPersistence\(auth, browserLocalPersistence\)/);
  assert.match(source, /getRedirectResult\(auth\)/);
  assert.match(source, /firebase-auth-state/);
  assert.match(source, /removeItem\('forceLocalMode'\)/);
  assert.match(source, /window\.isLocalMode = false/);
  assert.doesNotMatch(source, /browserSessionPersistence/);
});

test('estado, modo, tela e acesso do jogador ficam no armazenamento nativo', () => {
  const source = readPublic('firebase-config.js');
  const requiredKeys = [
    'psyzon_baba_state_v1',
    'psyzon_baba_mode',
    'psyzon_baba_last_view',
    'psyzon_baba_theme',
    'psyzon_baba_player_access_v1',
  ];

  for (const key of requiredKeys) assert.match(source, new RegExp(`['\"]${key}['\"]`));
});

test('acesso administrativo nao usa mais senha fixa e restaura a ultima tela', () => {
  const source = readPublic('baba.js');

  assert.doesNotMatch(source, /ADMIN_PASSWORD|153090/);
  assert.match(source, /const VIEW_KEY = 'psyzon_baba_last_view'/);
  assert.match(source, /localStorage\.setItem\(VIEW_KEY, safeTab\)/);
  assert.match(source, /authenticatedAdmin\(\)\) setMode\('organizer'/);
  assert.match(source, /restorePlayerAccess/);
});

test('codigo de jogador e aleatorio, salvo somente como hash e revogavel', () => {
  const source = readPublic('baba-access.js');

  assert.match(source, /crypto\.getRandomValues/);
  assert.match(source, /crypto\.subtle\.digest\('SHA-256'/);
  assert.match(source, /currentCodeHash: codeHash/);
  assert.match(source, /active: true/);
  assert.doesNotMatch(source, /currentCode:\s*code/);
});

test('interface oferece login Google e entrada e geracao de codigo', () => {
  const html = readPublic('baba.html');

  assert.match(html, /id="organizer-google-login"/);
  assert.match(html, /id="player-code-form"/);
  assert.match(html, /id="generate-player-code"/);
  assert.match(html, /id="copy-player-code"/);
  assert.match(html, /src="(?:\.\/)?baba-access\.js\?v=/);
});

test('regras tornam cada conta autenticada administradora e permitem validar codigo publico', () => {
  const rules = fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8');

  assert.match(rules, /function isImportAdmin\(\)\s*\{\s*return signedIn\(\);\s*\}/);
  assert.match(rules, /match \/baba_access_config\/\{configId\}/);
  assert.match(rules, /allow get: if configId == 'player'/);
  assert.match(rules, /request\.resource\.data\.currentCodeHash\.size\(\) == 64/);
});

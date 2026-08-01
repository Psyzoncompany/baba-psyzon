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
  const login = readPublic('login.html');

  assert.match(source, /setPersistence\(auth, browserLocalPersistence\)/);
  assert.match(source, /getRedirectResult\(auth\)/);
  assert.match(source, /firebase-auth-state/);
  assert.match(source, /provider\.providerId === 'google\.com'/);
  assert.match(source, /removeItem\('forceLocalMode'\)/);
  assert.match(source, /window\.isLocalMode = false/);
  assert.doesNotMatch(source, /browserSessionPersistence/);
  assert.match(login, /id="google-login-btn"/);
  assert.doesNotMatch(login, /id="email"|id="password"|id="login-btn"|toggle-mode-btn/);
});

test('estado, modo e tela ficam isolados pela conta Google no armazenamento nativo', () => {
  const source = readPublic('firebase-config.js');
  const requiredKeys = [
    'psyzon_baba_state_v1',
    'psyzon_baba_mode',
    'psyzon_baba_last_view',
    'psyzon_baba_theme',
    'psyzon_baba_player_access_v1',
  ];

  for (const key of requiredKeys) assert.match(source, new RegExp(`['\"]${key}['\"]`));
  assert.match(source, /const scopedKey = `\$\{key\}:\$\{accountId\}`/);
  assert.match(source, /psyzon_baba_legacy_storage_owner/);
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

test('regras isolam cada conta e permitem validar somente o hash do codigo publico', () => {
  const rules = fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8');

  assert.match(rules, /function isImportAdmin\(\)\s*\{\s*return signedIn\(\);\s*\}/);
  assert.match(rules, /function ownsAccount\(accountId\)/);
  assert.match(rules, /sign_in_provider == 'google\.com'/);
  assert.match(rules, /match \/users\/\{userId\}/);
  assert.match(rules, /match \/baba_accounts\/\{accountId\}/);
  assert.match(rules, /match \/baba_access_config\/\{accountId\}/);
  assert.match(rules, /match \/baba_access_codes\/\{codeHash\}/);
  assert.match(rules, /allow get: if true/);
  assert.match(rules, /request\.resource\.data\.currentCodeHash\.size\(\) == 64/);
});

test('persistencia e importacao usam o espaco exclusivo da conta', () => {
  const persistence = readPublic('baba-persistence.js');
  const importPersistence = readPublic('baba-import-persistence.js');

  assert.match(persistence, /doc\(db, 'baba_accounts', accountId/);
  assert.match(importPersistence, /doc\(db, 'baba_accounts', accountId\(\)/);
  assert.doesNotMatch(importPersistence, /doc\(db, 'baba_imports'/);
  assert.doesNotMatch(importPersistence, /collection\(db, 'baba_player_aliases'/);
});

test('importador reutiliza a sessao do site sem segundo botao de login', () => {
  const ui = readPublic('baba-import-ui.js');
  const html = readPublic('baba.html');

  assert.match(ui, /refreshAccountData/);
  assert.doesNotMatch(ui, /firebase-login|ADMIN_ACCESS_REQUIRED|refreshAdminAccess/);
  assert.doesNotMatch(html, /id="baba-import-access"/);
});

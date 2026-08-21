const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(publicRoot, '..');

function readPublic(file) {
  return fs.readFileSync(path.join(publicRoot, file), 'utf8');
}

test('login Google usa popup sem recarregar a pagina e informa mudancas de autenticacao', () => {
  const source = readPublic('firebase-config.js');
  const baba = readPublic('baba.html');

  assert.match(source, /setPersistence\(auth, browserLocalPersistence\)/);
  assert.match(source, /return signInWithPopup\(auth, googleProvider\)/);
  assert.match(source, /firebase-auth-state/);
  assert.match(source, /isGoogleLinkedUser\(user\)/);
  assert.match(source, /removeItem\('forceLocalMode'\)/);
  assert.match(source, /window\.isLocalMode = false/);
  assert.doesNotMatch(source, /browserSessionPersistence/);
  assert.doesNotMatch(source, /signInWithRedirect|getRedirectResult/);
  assert.match(baba, /id="organizer-google-login"/);
  assert.match(baba, /id="organizer-email-login"/);
  assert.match(baba, /id="organizer-password-login"/);
  assert.match(source, /signInWithEmailAndPassword/);
});

test('estado, modo e tela ficam isolados pela conta Google no armazenamento nativo', () => {
  const source = readPublic('firebase-config.js');
  const requiredKeys = [
    'psyzon_baba_state_v1',
    'psyzon_baba_mode',
    'psyzon_baba_last_view',
    'psyzon_baba_theme',
  ];

  for (const key of requiredKeys) assert.match(source, new RegExp(`['\"]${key}['\"]`));
  assert.match(source, /const scopedKey = `\$\{key\}:\$\{accountId\}`/);
  assert.match(source, /psyzon_baba_legacy_storage_owner/);
  assert.match(readPublic('baba-access.js'), /psyzon_baba_player_access_v1/);
});

test('acesso administrativo nao usa mais senha fixa e restaura a ultima tela', () => {
  const source = readPublic('baba.js');

  assert.doesNotMatch(source, /ADMIN_PASSWORD|153090/);
  assert.match(source, /const VIEW_KEY = 'psyzon_baba_last_view'/);
  assert.match(source, /localStorage\.setItem\(VIEW_KEY, safeTab\)/);
  assert.match(source, /authenticatedAdmin\(\)\) setMode\('organizer'/);
  assert.match(source, /restorePlayerAccess/);
});

test('codigo de jogador e fixo por conta, salvo somente como hash e sem expiracao operacional', () => {
  const source = readPublic('baba-access.js');
  const app = readPublic('baba.js');

  assert.match(source, /async function createAccountCode\(accountId, attempt = 0\)/);
  assert.match(source, /`\$\{safeAccountId\(accountId\)\}:\$\{attempt\}`/);
  assert.match(source, /crypto\.subtle\.digest\('SHA-256'/);
  assert.match(source, /CODE_EXPIRES_AT_MS = 253402300799000/);
  assert.match(source, /currentCodeHash: codeHash/);
  assert.match(source, /active: true/);
  assert.match(source, /ensurePlayerCode: generatePlayerCode/);
  assert.match(source, /const alreadyActive = previousHash === codeHash/);
  assert.match(source, /if \(alreadyActive\)[\s\S]*saveAccess\(code, accountId\);[\s\S]*return \{ code:/);
  assert.match(app, /async function restorePlayerAccessCodeForOrganizer\(\)[\s\S]*repository\.ensurePlayerCode\(\)/);
  assert.match(app, /authenticatedAdmin\(\)[\s\S]*restorePlayerAccessCodeForOrganizer\(\)/);
  assert.doesNotMatch(source, /crypto\.getRandomValues/);
  assert.doesNotMatch(source, /currentCode:\s*code/);
  assert.match(source, /nativeStorage\(\)\.setItem\(PLAYER_ACCESS_KEY, JSON\.stringify\(saved\)\)/);
  assert.match(source, /parseSavedAccess\(playerAccessStorageKey\(accountId\)\) \|\| pointer/);
});

test('interface oferece Google, senha vinculada e entrada e geracao de codigo', () => {
  const html = readPublic('baba.html');

  assert.match(html, /id="organizer-google-login"/);
  assert.match(html, /id="player-code-form"/);
  assert.match(html, /id="generate-player-code"/);
  assert.match(html, /id="copy-player-code"/);
  assert.match(html, /id="organizer-email-login"/);
  assert.match(html, /id="commission-access-form"/);
  assert.match(html, /id="commission-access-password-confirm"/);
  assert.match(html, /src="(?:\.\/)?baba-access\.js\?v=/);
});

test('senha da comissao fica vinculada ao mesmo usuario Google e recebe acesso administrativo completo', () => {
  const source = readPublic('firebase-config.js');
  const rules = fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8');

  assert.match(source, /EmailAuthProvider\.credential/);
  assert.match(source, /linkWithCredential\(user, credential\)/);
  assert.match(source, /updatePassword\(user, normalizedPassword\)/);
  assert.match(source, /normalizedEmail !== String\(user\.email/);
  assert.match(source, /signInProvider !== GoogleAuthProvider\.PROVIDER_ID/);
  assert.match(rules, /function signedIn\(\)[\s\S]*firebase\.identities\["google\.com"\] != null/);
  assert.doesNotMatch(rules, /sign_in_provider == 'google\.com'/);
});

test('ranking de pior jogador prioriza derrotas e desempata pelo menor numero de gols', () => {
  const source = readPublic('baba.js');

  assert.match(source, /\{ id: 'worst', label: 'Pior jogador'/);
  assert.match(source, /metric === 'worst'[\s\S]*?b\.totalDerrotas - a\.totalDerrotas \|\| a\.totalGols - b\.totalGols/);
  assert.match(source, /metric === 'worst'\) return Number\(stats\.totalJogos \|\| 0\) > 0/);
});

test('regras isolam cada conta e permitem validar somente o hash do codigo publico', () => {
  const rules = fs.readFileSync(path.join(repositoryRoot, 'firestore.rules'), 'utf8');

  assert.match(rules, /function isImportAdmin\(\)\s*\{\s*return signedIn\(\);\s*\}/);
  assert.match(rules, /function ownsAccount\(accountId\)/);
  assert.match(rules, /firebase\.identities\["google\.com"\] != null/);
  assert.doesNotMatch(rules, /match \/users\/\{userId\}/);
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

test('sincronizacao multidispositivo acompanha ao vivo, historico e cadastros da mesma conta', () => {
  const persistence = readPublic('baba-persistence.js');

  assert.match(persistence, /doc\(db, 'baba_accounts', accountId/);
  assert.match(persistence, /\['meta', accountDoc\('babas', id\)\]/);
  for (const part of ['participants', 'teams', 'games', 'goals', 'payments', 'stats']) {
    assert.match(persistence, new RegExp(`accountCollection\\('babas', id, '${part}'\\)`));
  }
  assert.match(persistence, /startPlayersSubscription\(\);[\s\S]*startPlayerStatsSubscription\(\);[\s\S]*startHistorySubscription\(\);[\s\S]*startMonthsSubscription\(\);/);
  assert.match(persistence, /window\.dispatchEvent\(new CustomEvent\('baba-remote-state-ready'/);
  assert.match(persistence, /window\.addEventListener\('online', resumePendingSave\)/);
  assert.match(persistence, /writePendingSave\(queuedSave\)/);
});

test('jogador espera o historico atual da conta do codigo antes de abrir o painel', () => {
  const app = readPublic('baba.js');
  const persistence = readPublic('baba-persistence.js');

  assert.match(app, /refreshAccountData\?\.\(result\.accountId\)/);
  assert.match(app, /Sincronizando histórico do organizador/);
  assert.match(persistence, /async function refreshAccountData\(candidateAccountId/);
  assert.match(persistence, /replaceHistoryOnNextMerge = true/);
  assert.match(persistence, /const localBabas = replaceHistoryOnNextMerge/);
});

test('migracao v2 registra o caminho da conta sem referencia global obsoleta', () => {
  const persistence = readPublic('baba-persistence.js');

  assert.match(persistence, /sourcePath: pointerRef\(\)\.path/);
  assert.doesNotMatch(persistence, /POINTER_PATH/);
});

test('importador reutiliza a sessao do site sem segundo botao de login', () => {
  const ui = readPublic('baba-import-ui.js');
  const html = readPublic('baba.html');

  assert.match(ui, /refreshAccountData/);
  assert.doesNotMatch(ui, /firebase-login|ADMIN_ACCESS_REQUIRED|refreshAdminAccess/);
  assert.doesNotMatch(html, /id="baba-import-access"/);
});

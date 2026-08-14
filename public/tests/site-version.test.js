const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('versao do Baba possui um unico valor e nao depende do financeiro', () => {
  const component = read('site-version.js');
  assert.match(component, /const SITE_VERSION = '6\.2\.0'/);
  assert.match(component, /dataset\.siteVersionFooter/);
  assert.doesNotMatch(component, /versoes\.html|psyzon-login-page/);
});

test('rodape de versao e carregado nas paginas do Baba', () => {
  assert.match(read('baba.html'), /site-version\.js\?v=6\.2\.0/);
  assert.match(read('baba-aparencia.html'), /site-version\.js\?v=6\.2\.0/);
  assert.match(read('mesa-tatica.html'), /site-version\.js\?v=6\.2\.0/);
});

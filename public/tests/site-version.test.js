const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('versao global possui um unico valor e abre o historico', () => {
  const component = read('site-version.js');
  assert.match(component, /const SITE_VERSION = '6\.1\.0'/);
  assert.match(component, /new URL\('versoes\.html', scriptUrl\)/);
  assert.match(component, /data\.siteVersionFooter|dataset\.siteVersionFooter/);
  assert.match(component, /Ver atualizações/);
});

test('rodape global e carregado nas paginas comuns, Baba e mesa tatica', () => {
  const preloader = read('site-preloader.js');
  assert.match(preloader, /site-version\.js\?v=6\.1\.0/);
  assert.match(read('baba.html'), /site-version\.js\?v=6\.1\.0/);
  assert.match(read('mesa-tatica.html'), /site-version\.js\?v=6\.1\.0/);
  assert.doesNotMatch(read('index.html'), /Versão 6\.0\.11/);
  assert.doesNotMatch(read('processos.html'), /Versão 6\.0\.27/);
});

test('pagina de versoes apresenta a atualizacao atual e seu conteudo', () => {
  const versions = read('versoes.html');
  assert.match(versions, /id="version-6-1-0"/);
  assert.match(versions, /Versão 6\.1\.0/);
  assert.match(versions, /ThemeProvider/);
  assert.match(versions, /Minimalista/);
});

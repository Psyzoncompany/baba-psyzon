const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(publicRoot, file));
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('logo oficial azul possui recorte arredondado e conteudo SVG seguro', () => {
  const logo = read('img/logo-baba.svg');

  assert.match(logo, /fill="#0911e1"/i);
  assert.match(logo, /clipPath id="baba-rounded-logo"/);
  assert.match(logo, /<rect width="1024" height="1024" rx="168" ry="168"\/>/);
  assert.doesNotMatch(logo, /<!DOCTYPE|<script|<foreignObject|\sonload=/i);
});

test('todas as telas do Baba usam a nova logo oficial', () => {
  ['baba.html', 'baba-aparencia.html', 'mesa-tatica.html'].forEach((file) => {
    const page = read(file);
    assert.match(page, /img\/logo-baba\.svg/);
    assert.doesNotMatch(page, /img\/baba-psyzon-logo\.png/);
  });
  assert.match(read('index.html'), /img\/logo-baba\.svg/);
});

test('icones instalaveis sao derivados da nova logo nas dimensoes corretas', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));

  assert.deepEqual(manifest.icons[0], {
    src: 'img/logo-baba.svg',
    sizes: 'any',
    type: 'image/svg+xml',
    purpose: 'any maskable',
  });
  assert.deepEqual(pngSize('icons/baba-icon-180.png'), { width: 180, height: 180 });
  assert.deepEqual(pngSize('icons/baba-icon-192.png'), { width: 192, height: 192 });
  assert.deepEqual(pngSize('icons/baba-icon-512.png'), { width: 512, height: 512 });
});

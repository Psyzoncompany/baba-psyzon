const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'sw.js'), 'utf8');

class TestResponse {
  constructor(body) {
    this.body = body;
    this.bodyUsed = false;
    this.ok = true;
    this.type = 'basic';
  }

  clone() {
    if (this.bodyUsed) throw new TypeError('Response body is already used');
    return new TestResponse(this.body);
  }

  async text() {
    if (this.bodyUsed) throw new TypeError('Response body is already used');
    this.bodyUsed = true;
    return this.body;
  }
}

test('service worker clona a resposta antes de gravar o cache', async () => {
  const handlers = new Map();
  const cachedBodies = [];
  const context = {
    URL,
    Promise,
    console,
    self: {
      location: { origin: 'https://baba-psyzon.vercel.app' },
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: () => undefined,
      clients: { claim: async () => undefined },
    },
    caches: {
      match: async () => null,
      keys: async () => [],
      delete: async () => true,
      open: async () => ({
        addAll: async () => undefined,
        put: async (_request, response) => cachedBodies.push(await response.text()),
      }),
    },
    fetch: async () => new TestResponse('conteudo-estatico'),
  };

  vm.runInNewContext(source, context);
  let responsePromise;
  handlers.get('fetch')({
    request: {
      method: 'GET',
      mode: 'cors',
      destination: 'script',
      url: 'https://baba-psyzon.vercel.app/theme-provider.js',
    },
    respondWith: (promise) => { responsePromise = promise; },
  });

  const response = await responsePromise;
  assert.equal(await response.text(), 'conteudo-estatico');
  assert.deepEqual(cachedBodies, ['conteudo-estatico']);
  assert.match(source, /baba-psyzon-static-v2/);
});

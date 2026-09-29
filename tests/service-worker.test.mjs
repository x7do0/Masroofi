import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const template = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker() {
  const handlers = new Map();
  const matches = [];
  const cachedResponse = { synthetic: 'cached shell' };
  let networkCalls = 0;
  runInNewContext(template.replace('__BUILD_HASH__', 'test').replace('/* PRECACHE_PATHS */ []', '["assets/app.js","index.html"]'), {
    URL, Request,
    self: { registration: { scope: 'https://example.test/Masroofi/' }, addEventListener: (name, fn) => handlers.set(name, fn) },
    caches: { open: async () => ({ match: async (request, options) => { matches.push({ request, options }); return cachedResponse; } }) },
    fetch: async () => { ++networkCalls; throw new Error('Network must not be required for a cached response'); },
  });
  const dispatch = (url, mode = 'cors', method = 'GET') => {
    let response;
    handlers.get('fetch')({ request: { url, mode, method }, respondWith: (promise) => { response = promise; } });
    return response;
  };
  return { dispatch, matches, cachedResponse, networkCalls: () => networkCalls };
}

test('precached module files survive Origin-header variation without a network request', async () => {
  const sw = worker();
  assert.equal(await sw.dispatch('https://example.test/Masroofi/assets/app.js'), sw.cachedResponse);
  assert.equal(sw.matches[0].options.ignoreVary, true);
  assert.equal(sw.networkCalls(), 0);
});
test('navigation uses the allowlisted shell URL', async () => {
  const sw = worker();
  await sw.dispatch('https://example.test/Masroofi/?screen=history', 'navigate');
  assert.equal(sw.matches[0].request, 'https://example.test/Masroofi/');
  assert.equal(sw.matches[0].options.ignoreVary, true);
});
test('non-shell URLs and query variants retain strict Vary matching', async () => {
  const sw = worker();
  await sw.dispatch('https://example.test/Masroofi/api/data');
  await sw.dispatch('https://example.test/Masroofi/assets/app.js?variant=private');
  assert.ok(sw.matches.every(({ options }) => options.ignoreVary === false));
});
test('cross-origin, out-of-scope and non-GET requests are not intercepted', () => {
  const sw = worker();
  assert.equal(sw.dispatch('https://other.test/Masroofi/assets/app.js'), undefined);
  assert.equal(sw.dispatch('https://example.test/other/assets/app.js'), undefined);
  assert.equal(sw.dispatch('https://example.test/Masroofi/api/data', 'cors', 'POST'), undefined);
  assert.equal(sw.matches.length, 0);
});

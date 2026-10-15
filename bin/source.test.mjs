import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLatestVersion } from './source.mjs';

test('GitHub update checks read an exact commit instead of a stale HEAD manifest', async () => {
  const sha = 'a'.repeat(40), calls = [];
  const latest = await checkLatestVersion('hapwi/hapstack', { fetch_: async url => {
    calls.push(url);
    if (url === 'https://api.github.com/repos/hapwi/hapstack/commits/HEAD') return { ok: true, json: async () => ({ sha }) };
    assert.equal(url, `https://raw.githubusercontent.com/hapwi/hapstack/${sha}/plugin.json`);
    return { ok: true, json: async () => ({ name: 'hapstack', version: '0.4.2' }) };
  } });
  assert.deepEqual(latest, { version: '0.4.2', error: null });
  assert.equal(calls.length, 2);
});

test('pinned sources stay pinned and unavailable GitHub checks stay unknown', async () => {
  const sha = 'b'.repeat(40);
  const pinned = await checkLatestVersion(`hapwi/hapstack#${sha}`, { fetch_: async url => {
    assert.equal(url, `https://raw.githubusercontent.com/hapwi/hapstack/${sha}/plugin.json`);
    return { ok: true, json: async () => ({ name: 'hapstack', version: '0.3.1' }) };
  } });
  assert.equal(pinned.version, '0.3.1');
  const unavailable = await checkLatestVersion('hapwi/hapstack', { fetch_: async () => ({ ok: false, status: 403 }) });
  assert.equal(unavailable.version, null);
  assert.match(unavailable.error, /HTTP 403/);
});

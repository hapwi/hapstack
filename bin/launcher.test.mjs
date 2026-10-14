import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, refreshShortCommand } from './launcher.mjs';

const sha = '1234567890abcdef1234567890abcdef12345678';
function source(version) {
  const urls = [];
  return {
    urls,
    fetch_: async (url, options) => {
      urls.push(url);
      assert(options.signal);
      return { ok: true, json: async () => url.includes('/commits/') ? { sha } : { name: 'hapstack', version } };
    },
  };
}

test('current or ahead launchers run locally without downloading another CLI', async () => {
  for (const version of ['0.4.0', '0.5.0']) {
    const remote = source('0.4.0');
    const result = await launch({ version, args: ['status'], env: {}, ...remote, run: () => assert.fail('unexpected download') });
    assert.deepEqual(result, { kind: 'local', sha });
    assert.equal(remote.urls[1], `https://raw.githubusercontent.com/hapwi/hapstack/${sha}/package.json`);
  }
});

test('a stale launcher uses a commit-pinned release and preserves arguments, terminal IO, environment and exit code', async () => {
  const remote = source('0.4.1');
  const args = ['status', '--json', '--source', '/example/local source'];
  const env = { TERM: 'xterm', KEEP: 'fixture' };
  let handoff;
  const result = await launch({ version: '0.4.0', args, env, ...remote, report: () => {}, run: async (command, options) => { handoff = { command, options }; return 7; } });
  assert.deepEqual(handoff.command, ['x', '--silent', `github:hapwi/hapstack#${sha}`, ...args]);
  assert.equal(handoff.options.stdio, 'inherit');
  assert.equal(handoff.options.env.KEEP, 'fixture');
  assert.equal(handoff.options.env.HAPSTACK_CLI_EXPECTED_VERSION, '0.4.1');
  assert.equal(handoff.options.env.HAPSTACK_CLI_COMMIT, sha);
  assert.deepEqual(env, { TERM: 'xterm', KEEP: 'fixture' });
  assert.deepEqual(result, { kind: 'forwarded', code: 7 });
});

test('the exact handed-off release skips a second lookup and rejects mismatched copies', async () => {
  const env = { HAPSTACK_CLI_EXPECTED_VERSION: '0.4.1', HAPSTACK_CLI_COMMIT: sha };
  const settings = { args: ['--help'], env, fetch_: () => assert.fail('recursive lookup') };
  assert.deepEqual(await launch({ version: '0.4.1', ...settings }), { kind: 'local', sha });
  await assert.rejects(launch({ version: '0.4.0', ...settings }), /does not match/);
});

test('offline lookup falls back explicitly while download failures do not run the stale CLI', async () => {
  const warnings = [];
  const result = await launch({ version: '0.4.0', args: ['status', '--json'], env: {}, fetch_: async () => { throw new Error('offline'); }, report: value => warnings.push(value), run: () => assert.fail('unexpected download') });
  assert.equal(result.kind, 'unavailable');
  assert.match(warnings[0], /Using cached 0.4.0.*offline/);
  await assert.rejects(launch({ version: '0.4.0', args: [], env: {}, ...source('0.4.1'), report: () => {}, run: async () => { throw new Error('download failed'); } }), /download failed/);
});

test('invalid remote commits are not executable package references', async () => {
  const result = await launch({ version: '0.4.0', args: [], env: {}, fetch_: async () => ({ ok: true, json: async () => ({ sha: 'main; unwanted command' }) }), report: () => {}, run: () => assert.fail('unverified executable') });
  assert.equal(result.kind, 'unavailable');
});

test('targeted migration refreshes only the owned canonical Hapstack cache and never unrelated sources', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hapstack-cache-test-'));
  const uid = process.getuid?.() ?? 0;
  const roots = [
    ['canonical', { hapstack: 'github:hapwi/hapstack' }],
    ['branch', { hapstack: 'github:hapwi/hapstack#main' }],
    ['foreign', { hapstack: 'github:someone/another-package' }],
    ['mixed', { hapstack: 'github:hapwi/hapstack', other: '^1.0.0' }],
  ];
  try {
    for (const [name, dependencies] of roots) {
      const folder = join(directory, `bunx-${uid}-hapstack@${name}`); mkdirSync(folder);
      writeFileSync(join(folder, 'package.json'), JSON.stringify({ dependencies }));
    }
    symlinkSync(join(directory, `bunx-${uid}-hapstack@canonical`), join(directory, `bunx-${uid}-hapstack@symlink`));
    const before = roots.map(([name]) => readFileSync(join(directory, `bunx-${uid}-hapstack@${name}`, 'package.json'), 'utf8'));
    const calls = [];
    assert.equal(await refreshShortCommand({ sha, directory, uid, report: () => {}, run: async (args, options) => { calls.push({ args, options }); return 0; } }), 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.cwd, join(directory, `bunx-${uid}-hapstack@canonical`));
    assert(calls[0].args.includes(`hapstack@github:hapwi/hapstack#${sha}`));
    assert(calls[0].args.includes('--ignore-scripts'));
    assert.deepEqual(roots.map(([name]) => readFileSync(join(directory, `bunx-${uid}-hapstack@${name}`, 'package.json'), 'utf8')), before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('failed cache migration reports the error without clearing a cache', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hapstack-cache-test-'));
  const uid = process.getuid?.() ?? 0;
  try {
    const root = join(directory, `bunx-${uid}-hapstack@canonical`); mkdirSync(root);
    const file = join(root, 'package.json');
    writeFileSync(file, JSON.stringify({ dependencies: { hapstack: 'github:hapwi/hapstack' } }));
    const before = readFileSync(file, 'utf8');
    await assert.rejects(refreshShortCommand({ sha, directory, uid, report: () => {}, run: async () => 1 }), /could not refresh/);
    assert.equal(readFileSync(file, 'utf8'), before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

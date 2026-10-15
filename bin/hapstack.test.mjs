import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
function fixture() { return mkdtempSync(join(tmpdir(), 'hapstack-test-')); }
function run(cwd, ...args) {
  const result = spawnSync(process.execPath, [cli, ...args, '--project', '--source', resolve(dirname(cli), '..')], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
function original(root) {
  const skill = join(root, '.agents/skills/ship');
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, 'SKILL.md'), 'original private skill');
  mkdirSync(join(root, '.agents/skills/unrelated'), { recursive: true });
  writeFileSync(join(root, '.agents/skills/unrelated/keep'), 'leave alone');
}

test('one bundle, provider links, updates, and exact original restoration', () => {
  const root = fixture();
  try {
    original(root);
    run(root, 'install');
    const record = () => JSON.parse(readFileSync(join(root, '.agents/hapstack/install.json')));
    assert.equal(record().links.length, 116);
    assert.equal(record().packages.length, 1);
    for (const entry of record().links) {
      const path = join(root, entry.root, 'skills', entry.name);
      assert(lstatSync(path).isSymbolicLink());
      assert.equal(readlinkSync(path), entry.target);
      assert(existsSync(join(path, 'SKILL.md')));
    }
    assert(existsSync(join(root, '.agents/skills/hap-mode/references/agents/hap-agent.md')));
    assert.match(run(root, 'status'), /58 skill links/);
    run(root, 'install');
    assert.equal(record().packages.length, 1);
    run(root, 'uninstall');
    assert.equal(readFileSync(join(root, '.agents/skills/ship/SKILL.md'), 'utf8'), 'original private skill');
    assert.equal(readFileSync(join(root, '.agents/skills/unrelated/keep'), 'utf8'), 'leave alone');
    assert(!existsSync(join(root, '.agents/skills/hap-mode')));
    assert(!existsSync(join(root, '.claude/skills/hap-mode')));
    assert.equal(record().links.length, 0);
    assert.equal(readdirSync(join(root, '.agents/hapstack/packages')).length, 0);
    run(root, 'uninstall');
  } finally { rmSync(root, { recursive: true }); }
});

test('uninstall preserves a link replaced with unrelated content and edited bundles', () => {
  const root = fixture();
  try {
    run(root, 'install', '--agent', 'codex');
    const record = JSON.parse(readFileSync(join(root, '.agents/hapstack/install.json')));
    const path = join(root, '.agents/skills/hap-mode');
    unlinkSync(path); mkdirSync(path); writeFileSync(join(path, 'private'), 'custom');
    writeFileSync(join(record.packages[0].path, 'skills/ship/custom'), 'edited bundle');
    const output = run(root, 'uninstall');
    assert.match(output, /Preserved changed\/unrelated path/);
    assert.match(output, /Some managed links were kept/);
    assert.doesNotMatch(output, /Hapstack removed\.|Nothing to remove\./);
    assert.equal(readFileSync(join(path, 'private'), 'utf8'), 'custom');
    assert(existsSync(record.packages[0].path));
  } finally { rmSync(root, { recursive: true }); }
});

test('uninstall retains edited package contents after removing all discovery links', () => {
  const root = fixture();
  try {
    run(root, 'install', '--agent', 'codex');
    const record = JSON.parse(readFileSync(join(root, '.agents/hapstack/install.json')));
    const file = join(record.packages[0].path, 'skills/ship/custom');
    writeFileSync(file, 'keep my edit');
    assert.match(run(root, 'uninstall'), /Preserved edited package/);
    assert.equal(readFileSync(file, 'utf8'), 'keep my edit');
    assert(!existsSync(join(root, '.agents/skills/hap-mode')));
  } finally { rmSync(root, { recursive: true }); }
});

test('migration rejects project scope before modifying old copied skills', () => {
  const root = fixture();
  try {
    const packageRoot = resolve(dirname(cli), '..');
    const legacyHashes = JSON.parse(readFileSync(join(dirname(cli), 'legacy-0.2.0.json'))).skills;
    const legacy = join(root, 'legacy-backup');
    mkdirSync(join(legacy, '.agents/skills/ship'), { recursive: true });
    writeFileSync(join(legacy, '.agents/skills/ship/SKILL.md'), 'original ship');
    cpSync(join(packageRoot, 'skills/ship'), join(root, '.agents/skills/ship'), { recursive: true });
    cpSync(join(packageRoot, 'skills/patcher'), join(root, '.agents/skills/patcher'), { recursive: true });
    writeFileSync(join(root, '.agents/skills/patcher/custom'), 'user edit');
    assert(legacyHashes.ship);
    const state = join(root, '.agents/hapstack'); mkdirSync(state, { recursive: true });
    writeFileSync(join(state, 'install.json'), JSON.stringify({ schema: 1, agents: { codex: { strategy: 'native', version: '0.3.0' } }, links: [] }));
    // Migration is global-only; run it in a mount-isolated fixture for the real native checks.
    const denied = spawnSync(process.execPath, [cli, 'migrate', '--project', '--legacy-backup', legacy], { cwd: root, encoding: 'utf8' });
    assert.notEqual(denied.status, 0);
    assert(existsSync(join(root, '.agents/skills/ship/SKILL.md')));
  } finally { rmSync(root, { recursive: true }); }
});

function nativeFixture({ versions = { codex: '0.3.1', claude: '0.3.1' }, fail, malformed } = {}) {
  const root = fixture();
  const source = join(root, 'source');
  const executables = join(root, 'bin');
  const state = join(root, 'state', 'hapstack');
  mkdirSync(source); mkdirSync(executables); mkdirSync(state, { recursive: true });
  const latest = JSON.parse(readFileSync(join(dirname(cli), '../plugin.json'))).version;
  writeFileSync(join(source, 'plugin.json'), JSON.stringify({ name: 'hapstack', version: latest }));
  writeFileSync(join(root, 'hosts.json'), JSON.stringify({ versions, fail, malformed, latest }));
  const script = `#!${process.execPath}
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { basename, join } from 'node:path';
const root = process.env.HAPSTACK_TEST_ROOT;
const agent = basename(process.argv[1]);
const args = process.argv.slice(2);
appendFileSync(join(root, 'calls.jsonl'), JSON.stringify({ agent, args }) + '\\n');
const path = join(root, 'hosts.json');
const hosts = JSON.parse(readFileSync(path));
if (args.includes('--help')) { console.log('Install a plugin'); process.exit(0); }
if (args[1] === 'list') {
  if (hosts.malformed === agent) { console.log('invalid inventory'); process.exit(0); }
  const entries = hosts.versions[agent] ? [{ id: 'hapstack@hapstack', pluginId: 'hapstack@hapstack', version: hosts.versions[agent], enabled: true, scope: 'user' }] : [];
  console.log(JSON.stringify(agent === 'codex' ? { installed: entries } : entries)); process.exit(0);
}
if (hosts.fail === agent) { console.error('Host rejected the requested install'); process.exit(1); }
if (['add', 'install', 'update'].includes(args[1])) {
  hosts.versions[agent] = hosts.latest; writeFileSync(path, JSON.stringify(hosts));
}
console.log('Verbose host log that should be hidden on success');
`;
  for (const agent of ['codex', 'claude']) writeFileSync(join(executables, agent), script, { mode: 0o755 });
  const normalized = { codex: versions.codex, 'claude-code': versions.claude };
  const agents = Object.fromEntries(Object.entries(normalized).filter(([, value]) => value).map(([agent, value]) => [agent, { strategy: 'native', version: value, source }]));
  const receipt = join(state, 'install.json');
  writeFileSync(receipt, JSON.stringify({ schema: 1, agents, links: [] }));
  const calls = () => existsSync(join(root, 'calls.jsonl')) ? readFileSync(join(root, 'calls.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line)) : [];
  const execute = (...args) => spawnSync(process.execPath, [cli, ...args, '--source', source], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PATH: executables + ':' + process.env.PATH, XDG_STATE_HOME: join(root, 'state'), XDG_DATA_HOME: join(root, 'data'), HAPSTACK_TEST_ROOT: root, NO_COLOR: '1' },
  });
  return { root, source, receipt, calls, execute, latest };
}
const mutatingCalls = calls => calls.filter(call => call.args[1] !== 'list' && !call.args.includes('--help'));

test('status reports host versions and updates without mutations or receipt writes', () => {
  const f = nativeFixture({ versions: { codex: '0.3.1', claude: '0.3.1' } });
  try {
    const before = readFileSync(f.receipt, 'utf8');
    const result = f.execute('status');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Codex\s+0\.3\.1.*Out of date/);
    assert.match(result.stdout, /Claude Code\s+0\.3\.1.*Out of date/);
    assert.match(result.stdout, /Run bunx github:hapwi\/hapstack to update\./);
    assert.doesNotMatch(result.stdout, /"pluginId"|"installPath"|\x1b\[/);
    assert.equal(readFileSync(f.receipt, 'utf8'), before);
    assert.deepEqual(mutatingCalls(f.calls()), []);
    const json = f.execute('status', '--json');
    const data = JSON.parse(json.stdout);
    assert.equal(data.providers[0].state, 'update');
    assert.equal(data.providers[0].latest.version, f.latest);
    assert.doesNotMatch(json.stdout, new RegExp(f.root));
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('status --yes updates only outdated installations; JSON stays read-only', () => {
  const latest = JSON.parse(readFileSync(join(dirname(cli), '../plugin.json'))).version;
  const f = nativeFixture({ versions: { codex: latest, claude: '0.3.1' } });
  try {
    const before = readFileSync(f.receipt, 'utf8');
    const json = f.execute('status', '--json', '--yes');
    assert.equal(json.status, 0, json.stderr);
    assert.equal(JSON.parse(json.stdout).providers[1].state, 'update');
    assert.equal(readFileSync(f.receipt, 'utf8'), before);
    assert.deepEqual(mutatingCalls(f.calls()), []);
    const result = f.execute('status', '--yes');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Claude Code\s+[\d.]+\s+Updated from 0\.3\.1/);
    assert.deepEqual([...new Set(mutatingCalls(f.calls()).map(call => call.agent))], ['claude']);
    assert.equal(JSON.parse(readFileSync(f.receipt)).agents['claude-code'].version, latest);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('noninteractive updates require --yes and leave state untouched when skipped', () => {
  const f = nativeFixture({ versions: { codex: '0.3.1' } });
  try {
    const before = readFileSync(f.receipt, 'utf8');
    const result = f.execute('install', '--agent', 'codex');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /--yes/);
    assert.match(result.stdout, /Codex\s+0\.3\.1\s+Skipped/);
    assert.deepEqual(mutatingCalls(f.calls()), []);
    assert.equal(readFileSync(f.receipt, 'utf8'), before);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('--yes updates selected hosts and records their actual versions', () => {
  const f = nativeFixture({ versions: { codex: '0.3.1', claude: '0.3.1' } });
  try {
    const result = f.execute('install', '--yes');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Codex\s+[\d.]+\s+Updated from 0\.3\.1/);
    assert.doesNotMatch(result.stdout, /Verbose host log/);
    const record = JSON.parse(readFileSync(f.receipt));
    assert.equal(record.agents.codex.version, f.latest);
    assert.equal(record.agents['claude-code'].version, f.latest);
    assert.deepEqual(mutatingCalls(f.calls()).map(call => [call.agent, call.args[1]]), [['codex', 'marketplace'], ['codex', 'add'], ['claude', 'marketplace'], ['claude', 'install'], ['claude', 'update']]);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('already-current installs make no host mutations', () => {
  const current = JSON.parse(readFileSync(join(dirname(cli), '../package.json'))).version;
  const f = nativeFixture({ versions: { codex: current } });
  try {
    const result = f.execute('install', '--agent', 'codex');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Codex\s+[\d.]+\s+Up to date/);
    assert.deepEqual(mutatingCalls(f.calls()), []);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('uncheckable sources stay unknown and require consent', () => {
  const f = nativeFixture({ versions: { codex: '0.3.1' } });
  try {
    const result = spawnSync(process.execPath, [cli, 'install', '--agent', 'codex', '--source', 'https://example.invalid/source.git'], {
      cwd: f.root, encoding: 'utf8', env: { ...process.env, PATH: join(f.root, 'bin') + ':' + process.env.PATH, XDG_STATE_HOME: join(f.root, 'state'), HAPSTACK_TEST_ROOT: f.root },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Update unknown/);
    assert.doesNotMatch(result.stdout, /up to date/i);
    assert.deepEqual(mutatingCalls(f.calls()), []);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('partial failures show child errors and preserve earlier successful records', () => {
  const f = nativeFixture({ versions: {}, fail: 'claude' });
  try {
    const result = f.execute('install');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Host rejected the requested install/);
    const record = JSON.parse(readFileSync(f.receipt));
    assert.equal(record.agents.codex.version, f.latest);
    assert.equal(record.agents['claude-code'], undefined);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('malformed inventory is an inspection error, never an empty installation', () => {
  const f = nativeFixture({ versions: { codex: '0.3.1' }, malformed: 'codex' });
  try {
    const result = f.execute('status', '--json', '--agent', 'codex');
    assert.equal(result.status, 1);
    const data = JSON.parse(result.stdout);
    assert.equal(data.providers[0].state, 'error');
    assert.match(data.providers[0].error, /plugin list JSON/);
    assert.deepEqual(mutatingCalls(f.calls()), []);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

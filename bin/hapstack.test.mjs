import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('./hapstack.mjs', import.meta.url));
function fixture() { return mkdtempSync(join(tmpdir(), 'hapstack-test-')); }
function run(cwd, ...args) {
  const result = spawnSync(process.execPath, [cli, ...args, '--project'], { cwd, encoding: 'utf8' });
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
    assert.match(run(root, 'status'), /owned/);
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

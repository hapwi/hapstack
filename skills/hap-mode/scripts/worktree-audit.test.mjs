import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const audit = fileURLToPath(new URL('./worktree-audit.sh', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hapstack-worktree-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  mkdirSync(repo);
  // Keep Git configuration and forge/history access isolated from the operator.
  const bin = join(root, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gh'), '#!/bin/sh\nprintf "[]\\n"\n', { mode: 0o755 });
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    PATH: `${bin}:${process.env.PATH}`, GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null', GIT_AUTHOR_NAME: 'Fixture',
    GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Fixture',
    GIT_COMMITTER_EMAIL: 'fixture@example.invalid', HAPSTACK_TRANSCRIPTS_DIR: '',
  };
  const run = (cwd, ...args) => spawnSync('git', ['-C', cwd, ...args], { env, encoding: 'utf8' });
  const git = (cwd, ...args) => {
    const result = run(cwd, ...args);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(repo, 'init', '-b', 'main');
  writeFileSync(join(repo, '.gitignore'), 'ignored/\n');
  writeFileSync(join(repo, 'tracked'), 'base\n');
  git(repo, 'add', '.');
  git(repo, 'commit', '-m', 'base');
  const base = git(repo, 'rev-parse', 'HEAD');
  const worktree = (name, start = 'main') => {
    const path = join(root, name);
    git(repo, 'worktree', 'add', '-b', name.replace(/[^a-z-]/g, '-'), path, start);
    return path;
  };
  return { root, repo, env, run, git, base, worktree };
}

test('audit holds local files, locks, missing paths and operations without changing them', t => {
  const f = fixture(t);
  const clean = f.worktree('clean space');
  const tracked = f.worktree('tracked');
  const scratch = f.worktree('scratch');
  const ignored = f.worktree('ignored');
  const locked = f.worktree('locked');
  const missing = f.worktree('missing');
  const operation = f.worktree('operation');
  const oddPath = f.worktree('odd\tpath\n');
  writeFileSync(join(tracked, 'tracked'), 'keep edit\n');
  writeFileSync(join(scratch, 'private'), 'keep scratch\n');
  mkdirSync(join(ignored, 'ignored'));
  writeFileSync(join(ignored, 'ignored', 'private'), 'keep ignored\n');
  f.git(f.repo, 'worktree', 'lock', locked);
  // Simulate a missing checkout inside the fixture, never prune its registration.
  rmSync(missing, { recursive: true });
  const marker = f.git(operation, 'rev-parse', '--git-path', 'CHERRY_PICK_HEAD');
  writeFileSync(marker, `${f.base}\n`);
  const before = f.git(f.repo, 'worktree', 'list', '--porcelain');
  const result = spawnSync('bash', [audit, '-b', 'main', f.repo], { env: f.env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const rows = result.stdout.trim().split('\n').slice(2).map(line => line.split('\t'));
  assert.equal(rows.length, 8);
  const row = name => rows.find(fields => fields.at(-1).endsWith(`/${name}`));
  assert.equal(row('tracked')[8], 'hold-wip');
  assert.equal(row('scratch')[8], 'hold-local-files');
  assert.equal(row('ignored')[8], 'hold-local-files');
  assert.equal(row('locked')[8], 'hold-locked');
  assert.equal(row('missing')[3], 'unknown');
  assert.equal(row('missing')[8], 'hold-prunable');
  assert.equal(row('operation')[8], 'hold-operation:CHERRY_PICK_HEAD');
  assert(rows.some(fields => fields[3] === 'clean' && fields[8] === 'verify-merged'));
  assert.equal(f.git(f.repo, 'worktree', 'list', '--porcelain'), before);
  for (const path of [clean, tracked, scratch, ignored, locked, operation, oddPath]) assert(existsSync(path));
  assert.equal(readFileSync(join(ignored, 'ignored', 'private'), 'utf8'), 'keep ignored\n');
  assert.equal(readFileSync(join(tracked, 'tracked'), 'utf8'), 'keep edit\n');
});

for (const method of ['merge', 'squash', 'rebase']) {
  test(`${method}: documented delivery predicates permit clean removal and reject an extra empty commit`, t => {
    const f = fixture(t);
    // The implementation checkout exists before delivery/cleanup starts.
    const implementation = f.worktree('implementation');
    writeFileSync(join(implementation, 'feature'), 'delivered\n');
    f.git(implementation, 'add', 'feature');
    f.git(implementation, 'commit', '-m', 'feature');
    const originalHead = f.git(implementation, 'rev-parse', 'HEAD');
    if (method === 'merge') {
      f.git(f.repo, 'merge', '--no-ff', 'implementation', '-m', 'deliver');
    } else if (method === 'squash') {
      f.git(f.repo, 'merge', '--squash', 'implementation');
      f.git(f.repo, 'commit', '-m', 'deliver squash');
    } else {
      writeFileSync(join(f.repo, 'base-change'), 'advanced base\n');
      f.git(f.repo, 'add', 'base-change');
      f.git(f.repo, 'commit', '-m', 'base advanced');
      const rebased = f.worktree('rebased', originalHead);
      f.git(rebased, 'rebase', 'main');
      f.git(f.repo, 'merge', '--ff-only', 'rebased');
    }
    const result = f.git(f.repo, 'rev-parse', 'HEAD');
    const remote = join(f.root, 'delivery.git');
    f.git(f.repo, 'init', '--bare', remote);
    f.git(f.repo, 'remote', 'add', 'delivery', remote);
    // Before push, the remote has no evidence of local delivery.
    assert.notEqual(f.run(f.repo, 'rev-parse', '--verify', 'refs/remotes/delivery/main').status, 0);
    f.git(f.repo, 'push', 'delivery', 'main');
    f.git(f.repo, 'fetch', 'delivery');
    f.git(f.repo, 'merge-base', '--is-ancestor', result, 'refs/remotes/delivery/main');
    f.git(f.repo, 'merge-base', '--is-ancestor', originalHead, originalHead);
    assert.equal(f.run(f.repo, 'merge-base', '--is-ancestor', originalHead, 'delivery/main').status, method === 'merge' ? 0 : 1);
    // Extra commits must be retained even when the file tree is identical.
    const extra = f.worktree('extra', originalHead);
    f.git(extra, 'commit', '--allow-empty', '-m', 'unshipped');
    assert.equal(f.git(extra, 'rev-parse', 'HEAD^{tree}'), f.git(implementation, 'rev-parse', 'HEAD^{tree}'));
    assert.equal(f.run(f.repo, 'merge-base', '--is-ancestor', f.git(extra, 'rev-parse', 'HEAD'), originalHead).status, 1);
    // Ownership/host merged-at-head/non-use must be established separately by
    // the playbook. This fixture verifies Git predicates and removal ordering.
    f.git(f.repo, 'worktree', 'remove', '--', implementation);
    assert(!existsSync(implementation));
    assert(existsSync(extra));
    assert.equal(f.git(f.repo, 'rev-parse', 'implementation'), originalHead);
    f.git(f.repo, 'branch', method === 'merge' ? '-d' : '-D', 'implementation');
    assert.notEqual(f.run(f.repo, 'show-ref', '--verify', 'refs/heads/implementation').status, 0);
  });
}

test('ordinary Git removal refuses dirty and locked fixture worktrees', t => {
  const f = fixture(t);
  const dirty = f.worktree('dirty');
  const locked = f.worktree('locked');
  writeFileSync(join(dirty, 'private'), 'retain\n');
  f.git(f.repo, 'worktree', 'lock', locked);
  for (const path of [dirty, locked]) {
    assert.notEqual(f.run(f.repo, 'worktree', 'remove', '--', path).status, 0);
    assert(existsSync(path));
  }
  assert.equal(readFileSync(join(dirty, 'private'), 'utf8'), 'retain\n');
});

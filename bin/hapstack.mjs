#!/usr/bin/env bun
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;
const legacyHashes = JSON.parse(readFileSync(join(packageRoot, 'bin', 'legacy-0.2.0.json'), 'utf8')).skills;
const names = readdirSync(join(packageRoot, 'skills')).filter(name => existsSync(join(packageRoot, 'skills', name, 'SKILL.md'))).sort();
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';
const help = `Hapstack ${version}

  bunx github:hapwi/hapstack              Install native Codex and Claude plugins
  bunx github:hapwi/hapstack status       Show installation records and host status
  bunx github:hapwi/hapstack uninstall    Remove Hapstack; restore replaced skills
  bunx github:hapwi/hapstack migrate --legacy-backup PATH
                                        Move old copied skills out after native install

Options:
  --agent NAME       codex, claude-code, or cursor; repeat to select providers
  --skills           Use one managed bundle with tracked skill links
  --project          Use tracked links in the current project, not global plugins
  --backup-dir PATH  Private backup destination
  --legacy-backup PATH  Original backup from the old copy installer (migration)
  --source SOURCE    Marketplace source; defaults to hapwi/hapstack
  --list             List bundled skills without changes
  --yes              Accepted for compatibility; no additional prompts
  --help             Show help

Native installation requires each selected provider's plugin-capable CLI.
Use --skills for clients without native plugins. Uninstall keeps settings/backups.
`;
function fail(message) { throw new Error(message); }
let project = false, skills = false, list = false, backupBase, legacyBackup;
let source = 'hapwi/hapstack';
const requested = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') { console.log(help); process.exit(0); }
  if (arg === '--project') project = true;
  else if (arg === '--skills') skills = true;
  else if (arg === '--list') list = true;
  else if (arg === '--yes' || arg === '-y') continue;
  else if (['--agent', '--backup-dir', '--legacy-backup', '--source'].includes(arg)) {
    const value = args[++i];
    if (!value || value.startsWith('--')) fail(`${arg} requires a value.`);
    if (arg === '--agent') {
      if (!['codex', 'claude-code', 'cursor'].includes(value)) fail(`Unsupported agent: ${value}`);
      requested.push(value);
    } else if (arg === '--backup-dir') backupBase = resolve(value);
    else if (arg === '--legacy-backup') legacyBackup = resolve(value);
    else source = value;
  } else fail(`Unknown option: ${arg}`);
}
if (!['install', 'status', 'uninstall', 'migrate'].includes(command)) fail(`Unknown command: ${command}`);
if (list) { console.log(names.join('\n')); process.exit(0); }
const base = project ? process.cwd() : homedir();
const state = project ? join(base, '.agents', 'hapstack') : join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'hapstack');
const data = project ? state : join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), 'hapstack');
const receiptPath = join(state, 'install.json');
const directories = { codex: '.agents', 'claude-code': '.claude', cursor: '.cursor' };
const receipt = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : { schema: 1, source, agents: {}, links: [] };
if (receipt.schema !== 1) fail('Unsupported installation record. No changes made.');
const selected = [...new Set(requested.length ? requested : command === 'install' ? ['codex', 'claude-code'] : Object.keys(receipt.agents).length ? Object.keys(receipt.agents) : ['codex', 'claude-code'])];
const present = path => { try { lstatSync(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const inside = (parent, path) => resolve(path).startsWith(resolve(parent) + sep);
function save() {
  mkdirSync(state, { recursive: true });
  writeFileSync(receiptPath + '.tmp', JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  renameSync(receiptPath + '.tmp', receiptPath);
}
function run(agent, arguments_, capture = false) {
  const binary = agent === 'claude-code' ? 'claude' : agent;
  const result = spawnSync(binary, arguments_, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error || result.status !== 0) fail(`${binary} ${arguments_.join(' ')} failed. ${result.error?.message || result.stderr || ''}`);
  return result.stdout;
}
function nativeAvailable(agent) {
  const result = spawnSync(agent === 'claude-code' ? 'claude' : agent, ['plugin', agent === 'codex' ? 'add' : 'install', '--help'], { encoding: 'utf8' });
  return result.status === 0 && /Install a plugin/i.test(result.stdout);
}
function nativeInventory(agent) {
  const inventory = JSON.parse(run(agent, ['plugin', 'list', ...(agent === 'codex' ? ['--marketplace', 'hapstack'] : []), '--json'], true));
  const entries = agent === 'codex' ? inventory.installed : inventory;
  return entries.filter(entry => (entry.pluginId || entry.id) === 'hapstack@hapstack');
}
function hashTree(path) {
  const hash = createHash('sha256');
  function walk(path_, rel) {
    const stat = lstatSync(path_);
    if (stat.isSymbolicLink()) fail(`Cannot establish copy ownership through a symlink: ${path_}`);
    hash.update(JSON.stringify([rel, stat.isDirectory() ? 'directory' : 'file']));
    if (stat.isDirectory()) for (const name of readdirSync(path_).sort()) walk(join(path_, name), rel ? `${rel}/${name}` : name);
    else if (stat.isFile()) hash.update(readFileSync(path_));
    else fail(`Unsupported file type: ${path_}`);
  }
  walk(path, '');
  return hash.digest('hex');
}
function linkPath(entry) {
  if (!Object.values(directories).includes(entry.root) || !/^[a-z0-9-]+$/.test(entry.name) || !inside(join(data, 'packages'), entry.target)) fail('Invalid managed link record. No changes made.');
  return join(base, entry.root, 'skills', entry.name);
}
function owned(entry) {
  const path = linkPath(entry);
  return present(path) && lstatSync(path).isSymbolicLink() && resolve(dirname(path), readlinkSync(path)) === entry.target;
}
let backupDirectory;
function backupPath(root, name) {
  if (!backupDirectory) {
    const destination = backupBase || join(state, 'backups');
    for (const dir of Object.values(directories)) {
      const skillRoot = join(base, dir, 'skills');
      if (resolve(destination) === skillRoot || inside(skillRoot, destination)) fail('Backups must be outside skill discovery folders.');
    }
    if (resolve(destination) === data || inside(join(data, 'packages'), destination)) fail('Backups must be outside managed packages.');
    mkdirSync(destination, { recursive: true });
    backupDirectory = mkdtempSync(join(destination, project ? 'project-' : 'global-'));
    console.log(`Private backups: ${backupDirectory}`);
  }
  return join(backupDirectory, root, 'skills', name);
}
function restore(entry) {
  const path = linkPath(entry);
  if (owned(entry)) unlinkSync(path);
  else if (present(path)) { console.log(`Preserved changed/unrelated path: ${path}`); return false; }
  if (entry.backup) {
    if (!existsSync(entry.backup)) fail(`Original backup missing: ${entry.backup}`);
    mkdirSync(dirname(path), { recursive: true });
    cpSync(entry.backup, path, { recursive: true, dereference: true, force: false, errorOnExist: true });
  }
  return true;
}
function cleanupPackages() {
  for (const pkg of receipt.packages || []) {
    if (receipt.links.some(entry => inside(pkg.path, entry.target))) continue;
    if (!inside(join(data, 'packages'), pkg.path)) fail('Invalid managed package record.');
    if (present(pkg.path)) {
      if (hashTree(pkg.path) === pkg.hash) rmSync(pkg.path, { recursive: true });
      else { console.log(`Preserved edited package: ${pkg.path}`); continue; }
    }
    receipt.packages = receipt.packages.filter(candidate => candidate !== pkg);
  }
}
function install() {
  for (const agent of selected) {
    const strategy = skills || project || agent === 'cursor' ? 'links' : 'native';
    if (receipt.agents[agent] && receipt.agents[agent].strategy !== strategy) fail(`Uninstall ${agent}'s current Hapstack installation before changing its installation strategy.`);
    if (strategy === 'native' && !nativeAvailable(agent)) fail(`${agent} needs a plugin-capable CLI. Use --skills for tracked skill links; no provider upgrade was attempted.`);
  }
  let bundle;
  for (const agent of selected) {
    const strategy = skills || project || agent === 'cursor' ? 'links' : 'native';
    if (strategy === 'native') {
      // Hosts own plugin namespacing, caches, enabling, and removal.
      run(agent, ['plugin', 'marketplace', 'add', source]);
      const gitSource = !existsSync(source);
      if (receipt.agents[agent] && gitSource) run(agent, ['plugin', 'marketplace', agent === 'codex' ? 'upgrade' : 'update', 'hapstack']);
      run(agent, ['plugin', agent === 'codex' ? 'add' : 'install', 'hapstack@hapstack']);
      if (receipt.agents[agent] && gitSource && agent === 'claude-code') run(agent, ['plugin', 'update', 'hapstack@hapstack']);
      const installed = nativeInventory(agent)[0];
      if (!installed?.version) fail(`${agent} did not report an installed Hapstack version.`);
      receipt.agents[agent] = { strategy, version: installed.version, source, installedAt: new Date().toISOString() };
      save();
      continue;
    }
    if (!bundle) {
      mkdirSync(join(data, 'packages'), { recursive: true });
      bundle = mkdtempSync(join(data, 'packages', `${version}-`));
      for (const name of ['skills', 'docs', 'assets', 'automations', 'plugin.json', 'package.json', 'LICENSE', 'CREDITS.md', 'UPSTREAM', 'CATALOG.md', 'README.md']) cpSync(join(packageRoot, name), join(bundle, name), { recursive: true });
      receipt.packages ||= [];
      receipt.packages.push({ path: bundle, hash: hashTree(bundle) });
      save();
    }
    const root = directories[agent];
    for (const name of names) {
      const path = join(base, root, 'skills', name);
      let entry = receipt.links.find(candidate => candidate.root === root && candidate.name === name);
      if (entry && present(path) && !owned(entry)) fail(`Managed link was replaced; preserving it: ${path}`);
      if (!entry) {
        entry = { root, name, target: join(bundle, 'skills', name) };
        if (present(path)) {
          entry.backup = backupPath(root, name);
          mkdirSync(dirname(entry.backup), { recursive: true });
          cpSync(path, entry.backup, { recursive: true, dereference: true });
        }
        receipt.links.push(entry);
        save();
        if (present(path)) rmSync(path, { recursive: true });
      } else if (owned(entry)) unlinkSync(path);
      entry.target = join(bundle, 'skills', name);
      save();
      mkdirSync(dirname(path), { recursive: true });
      symlinkSync(entry.target, path, process.platform === 'win32' ? 'junction' : 'dir');
    }
    receipt.agents[agent] = { strategy, version, source: 'hapwi/hapstack', installedAt: new Date().toISOString() };
    save();
  }
  cleanupPackages(); save();
  console.log('Hapstack installed. Start a new session. Setup is optional; run setup-hapstack to customize defaults.');
}
function uninstall() {
  for (const agent of selected) {
    const record = receipt.agents[agent];
    if (record?.strategy === 'native') run(agent, ['plugin', agent === 'codex' ? 'remove' : 'uninstall', 'hapstack@hapstack']);
    const root = directories[agent];
    for (const entry of [...receipt.links]) if (entry.root === root && restore(entry)) {
      receipt.links = receipt.links.filter(candidate => candidate !== entry); save();
    }
    if (!receipt.links.some(entry => entry.root === root)) delete receipt.agents[agent];
    save();
  }
  cleanupPackages(); save();
  console.log('Hapstack uninstall completed. Settings, backups, edited files, and marketplace registrations are preserved.');
}
function status() {
  console.log(`Installation record: ${receiptPath}${existsSync(receiptPath) ? '' : ' (none)'}`);
  for (const agent of selected) {
    const record = receipt.agents[agent];
    console.log(`${agent}: ${record ? `${record.strategy}, recorded version ${record.version}` : 'not recorded by this installer'}`);
    if (record?.strategy === 'native') {
      console.log(JSON.stringify(nativeInventory(agent), null, 2));
    }
  }
  for (const entry of receipt.links) if (selected.some(agent => directories[agent] === entry.root)) console.log(`${linkPath(entry)} -> ${entry.target} [${owned(entry) ? 'owned' : 'missing or changed'}]${entry.backup ? `; original: ${entry.backup}` : ''}`);
}
function migrate() {
  if (!legacyBackup || !existsSync(legacyBackup)) fail('Migration requires --legacy-backup PATH from your original copy installation.');
  if (project || selected.some(agent => receipt.agents[agent]?.strategy !== 'native')) fail('Install the native plugins first, then migrate the old copies.');
  const roots = [...new Set(selected.map(agent => directories[agent]))];
  const matches = (path, name) => {
    const hash = hashTree(path);
    return hash === legacyHashes[name] || hash === hashTree(join(packageRoot, 'skills', name));
  };
  for (const root of roots) {
    const skillRoot = join(base, root, 'skills');
    if (legacyBackup === skillRoot || inside(skillRoot, legacyBackup)) fail('The legacy backup must be outside installed skill folders.');
  }
  for (const entry of receipt.migrations || []) {
    if (entry.restored || !roots.includes(entry.root)) continue;
    const path = join(base, entry.root, 'skills', entry.name);
    if (!Object.values(directories).includes(entry.root) || !names.includes(entry.name)) fail('Invalid migration record.');
    if (present(path)) {
      if (!matches(path, entry.name)) fail(`Preserved changed path during migration recovery: ${path}`);
      rmSync(path, { recursive: true });
    }
    if (entry.original) cpSync(entry.original, path, { recursive: true, errorOnExist: true, force: false });
    entry.restored = true; save();
  }
  const candidates = [];
  for (const root of roots) for (const name of names) {
    const path = join(base, root, 'skills', name);
    if (!present(path)) continue;
    if (lstatSync(path).isSymbolicLink()) { console.log(`Preserved untracked symlink: ${path}`); continue; }
    const previous = receipt.migrations?.find(entry => entry.root === root && entry.name === name);
    if (previous) continue;
    if (!matches(path, name)) { console.log(`Preserved changed/unrelated skill: ${path}`); continue; }
    const original = join(legacyBackup, root, 'skills', name);
    if (existsSync(original)) hashTree(original); // Preflight original readability before moving anything.
    candidates.push({ root, name, path, original: existsSync(original) ? original : undefined });
  }
  for (const entry of candidates) {
    const archive = backupPath(entry.root, entry.name);
    mkdirSync(dirname(archive), { recursive: true });
    cpSync(entry.path, archive, { recursive: true });
    receipt.migrations ||= [];
    const record = { root: entry.root, name: entry.name, archive, original: entry.original, restored: false };
    receipt.migrations.push(record); save();
    rmSync(entry.path, { recursive: true });
    if (entry.original) cpSync(entry.original, entry.path, { recursive: true, errorOnExist: true, force: false });
    record.restored = true; save();
  }
  console.log(`Migrated ${candidates.length} exact-matching copied skills. Originals restored where available; modified skills and backups preserved.`);
}
try {
  if (command === 'install') install();
  else if (command === 'uninstall') uninstall();
  else if (command === 'migrate') migrate();
  else status();
} catch (error) { console.error(error.message); process.exit(1); }

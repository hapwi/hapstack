#!/usr/bin/env bun
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createUI } from './ui.mjs';
import { compareVersions } from './version.mjs';

let ui = createUI();
async function main() {

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;
const legacyHashes = JSON.parse(readFileSync(join(packageRoot, 'bin', 'legacy-0.2.0.json'), 'utf8')).skills;
const names = readdirSync(join(packageRoot, 'skills')).filter(name => existsSync(join(packageRoot, 'skills', name, 'SKILL.md'))).sort();
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';
const help = `Hapstack ${version}

  bunx github:hapwi/hapstack              Install native Codex and Claude plugins
  bunx github:hapwi/hapstack status       Show installation records and host status
  bunx github:hapwi/hapstack refresh-cli  Refresh an older cached short-command launcher
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
  --yes              Approve updates without a prompt
  --verbose          Show host logs and diagnostic paths
  --json             Machine-readable status without progress output
  --help             Show help

Native installation requires each selected provider's plugin-capable CLI.
Use --skills for clients without native plugins. Uninstall keeps settings/backups.
`;
function fail(message) { throw new Error(message); }
let project = false, skills = false, list = false, yes = false, verbose = false, json = false, sourceExplicit = false, backupBase, legacyBackup;
let source = 'hapwi/hapstack';
const requested = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') { console.log(help); process.exit(0); }
  if (arg === '--project') project = true;
  else if (arg === '--skills') skills = true;
  else if (arg === '--list') list = true;
  else if (arg === '--yes' || arg === '-y') yes = true;
  else if (arg === '--verbose') verbose = true;
  else if (arg === '--json') json = true;
  else if (['--agent', '--backup-dir', '--legacy-backup', '--source'].includes(arg)) {
    const value = args[++i];
    if (!value || value.startsWith('--')) fail(`${arg} requires a value.`);
    if (arg === '--agent') {
      if (!['codex', 'claude-code', 'cursor'].includes(value)) fail(`Unsupported agent: ${value}`);
      requested.push(value);
    } else if (arg === '--backup-dir') backupBase = resolve(value);
    else if (arg === '--legacy-backup') legacyBackup = resolve(value);
    else { source = value; sourceExplicit = true; }
  } else fail(`Unknown option: ${arg}`);
}
if (!['install', 'status', 'uninstall', 'migrate'].includes(command)) fail(`Unknown command: ${command}`);
if (json && command !== 'status') fail('--json is supported for status only.');
ui = createUI({ verbose, json });
if (list) { console.log(names.join('\n')); return; }
ui.header(version);
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
async function run(agent, arguments_) {
  const binary = agent === 'claude-code' ? 'claude' : agent;
  return new Promise((resolve_, reject) => {
    const child = spawn(binary, arguments_, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } });
    let stdout = '', stderr = '';
    const interrupt = () => child.kill('SIGINT');
    process.once('SIGINT', interrupt);
    child.stdout.on('data', chunk => { stdout += chunk; if (verbose) ui.detail(String(chunk).trimEnd()); });
    child.stderr.on('data', chunk => { stderr += chunk; if (verbose) ui.detail(String(chunk).trimEnd()); });
    child.on('error', error => { process.off('SIGINT', interrupt); reject(new Error(`${binary}: ${error.message}`)); });
    child.on('close', (code, signal) => {
      process.off('SIGINT', interrupt);
      if (signal === 'SIGINT') process.exitCode = 130;
      if (code !== 0) {
        const tail = (stderr || stdout).trim().split('\n').slice(-12).join('\n    ');
        reject(new Error(`${binary} ${arguments_.join(' ')} failed${signal ? ` (${signal})` : ` (exit ${code})`}.${tail ? `\n    ${tail}` : ''}`));
      } else resolve_(stdout);
    });
  });
}
async function nativeAvailable(agent) {
  try { return /Install a plugin/i.test(await run(agent, ['plugin', agent === 'codex' ? 'add' : 'install', '--help'])); }
  catch { return false; }
}
async function nativeInventory(agent) {
  const raw = await run(agent, ['plugin', 'list', ...(agent === 'codex' ? ['--marketplace', 'hapstack'] : []), '--json']);
  let inventory;
  try { inventory = JSON.parse(raw); } catch { fail(`${agent}: couldn't read plugin list JSON.`); }
  const entries = agent === 'codex' ? inventory.installed : inventory;
  if (!Array.isArray(entries)) fail(`${agent}: couldn't read plugin list JSON.`);
  if (entries.some(entry => !entry || typeof entry !== 'object')) fail(`${agent}: couldn't read plugin list JSON.`);
  const matches = entries.filter(entry => (entry.pluginId || entry.id) === 'hapstack@hapstack' && entry.installed !== false);
  if (matches.some(entry => compareVersions(entry.version, entry.version) !== 0)) fail(`${agent}: plugin list has no valid installed Hapstack version.`);
  return matches;
}
const sourceChecks = new Map();
async function latestVersion(source_) {
  if (sourceChecks.has(source_)) return sourceChecks.get(source_);
  const check = (async () => {
    try {
      let manifest;
      if (existsSync(source_)) manifest = JSON.parse(readFileSync(join(source_, 'plugin.json'), 'utf8'));
      else {
        const github = /^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#([^\s]+))?\/?$/.exec(source_);
        if (!github) return { version: null, error: 'update check is unavailable for this source' };
        const response = await fetch(`https://raw.githubusercontent.com/${github[1]}/${github[2]}/${encodeURIComponent(github[3] || 'HEAD')}/plugin.json`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
        manifest = await response.json();
      }
      if (manifest.name !== 'hapstack' || compareVersions(manifest.version, manifest.version) !== 0) throw new Error('source has no valid Hapstack version');
      return { version: manifest.version, error: null };
    } catch (error) { return { version: null, error: `couldn't check updates: ${error.message}` }; }
  })();
  sourceChecks.set(source_, check);
  return check;
}
const label = agent => ({ codex: 'Codex', 'claude-code': 'Claude Code', cursor: 'Cursor' })[agent];
async function inspect(agent) {
  const record = receipt.agents[agent];
  const strategy = skills || project || agent === 'cursor' ? 'links' : record?.strategy || 'native';
  const source_ = sourceExplicit ? source : record?.source || receipt.source || source;
  const latest = await latestVersion(source_);
  let instances = [], installed = null, enabled, error = null, links = [];
  if (strategy === 'native') {
    try {
      instances = await nativeInventory(agent);
      const entry = instances.find(item => !item.scope || item.scope === 'user');
      if (entry) { installed = entry.version; enabled = entry.enabled; }
    } catch (problem) { error = problem.message; }
  } else {
    links = receipt.links.filter(entry => entry.root === directories[agent]).map(entry => ({ path: linkPath(entry), owned: owned(entry) }));
    installed = record?.version || null;
  }
  const comparison = compareVersions(installed, latest.version);
  const state_ = error ? 'error' : !installed ? record ? 'missing' : 'fresh' : comparison === undefined ? 'unknown' : comparison < 0 ? 'update' : comparison > 0 ? 'ahead' : 'current';
  return { agent, strategy, source: source_, latest, managed: Boolean(record), recorded: record?.version || null, installed, enabled, state: state_, error, instances, links };
}
function show(row, action) {
  let text = action || (!row.installed ? row.state === 'missing' ? 'recorded, but no longer installed' : 'not installed' : `${row.installed}  ${row.enabled === true ? 'enabled · ' : row.enabled === false ? 'disabled · ' : ''}${{ current: 'up to date', update: `update available → ${row.latest.version}`, ahead: 'ahead of source', unknown: 'update unknown' }[row.state] || ''}`);
  let tone = row.state === 'error' ? 'bad' : row.state === 'update' ? 'update' : row.state === 'unknown' || row.state === 'missing' || row.enabled === false ? 'warn' : row.installed ? 'good' : 'dim';
  if (row.error) text = row.error.split('\n')[0];
  if (row.strategy === 'links' && row.installed) {
    const changed = row.links.filter(entry => !entry.owned).length;
    text += ` · ${row.links.length} skill links${changed ? ` · ${changed} missing or changed` : ''}`;
    if (changed) tone = 'warn';
  }
  ui.row(label(row.agent), text, tone);
  if (row.recorded && row.installed && row.recorded !== row.installed) ui.row('', `record says ${row.recorded}; host reports ${row.installed}`, 'warn');
  if (row.installed && !row.managed) ui.detail('Found on the host; not recorded by this installer.');
  if (row.error) ui.detail(row.error);
  ui.detail(`Source: ${row.source}`);
  for (const entry of row.links) ui.detail(`${entry.path} [${entry.owned ? 'owned' : 'missing or changed'}]`);
}
async function inspectSelected() {
  const rows = await ui.task('Checking installations and available updates…', () => Promise.all(selected.map(inspect)));
  const versions = [...new Set(rows.map(row => row.latest.version).filter(Boolean))];
  if (versions.length) ui.line(`  Latest ${versions.join(', ')}\n`);
  for (const row of rows) if (row.latest.error) ui.row(label(row.agent), `${row.latest.error} · update unknown`, 'warn');
  if (versions.some(value => compareVersions(version, value) < 0)) ui.line(`  This installer is ${version}. Fetch the latest with bunx github:hapwi/hapstack#main.\n`);
  return rows;
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
async function install() {
  for (const agent of selected) {
    const strategy = skills || project || agent === 'cursor' ? 'links' : 'native';
    if (receipt.agents[agent] && receipt.agents[agent].strategy !== strategy) fail(`Uninstall ${agent}'s current Hapstack installation before changing its installation strategy.`);
    if (strategy === 'native' && !await nativeAvailable(agent)) fail(`${agent} needs a plugin-capable CLI. Use --skills for tracked skill links; no provider upgrade was attempted.`);
  }
  const rows = await inspectSelected();
  rows.forEach(row => show(row));
  for (const row of rows) if (row.error) fail(`${label(row.agent)}: ${row.error}`);
  const pending = rows.filter(row => row.installed && (row.state === 'update' || row.state === 'unknown' || row.strategy === 'links' && (compareVersions(row.installed, version) !== 0 || row.links.some(entry => !entry.owned))));
  const targets = [...new Set(pending.map(row => row.latest.version))];
  const question = `Update ${pending.map(row => label(row.agent)).join(' and ')}${targets.length === 1 && targets[0] ? ' to ' + targets[0] : ''}?`;
  const approved = !pending.length || yes || await ui.confirm(question);
  if (process.exitCode === 130) return;
  let bundle, changed = false;
  for (const agent of selected) {
    const strategy = skills || project || agent === 'cursor' ? 'links' : 'native';
    const row = rows.find(item => item.agent === agent);
    if (row.installed && pending.includes(row) && !approved) { ui.row(label(agent), `skipped · stays on ${row.installed}`, 'dim'); continue; }
    if (row.installed && !pending.includes(row)) continue;
    if (strategy === 'links' && row.latest.version && compareVersions(version, row.latest.version) < 0) {
      ui.row(label(agent), 'skipped · fetch the latest installer before updating skill links', 'warn'); continue;
    }
    if (strategy === 'native') {
      const source_ = row.source;
      await ui.task(`${row.installed ? 'Updating' : 'Installing'} ${label(agent)}…`, async () => {
        await run(agent, ['plugin', 'marketplace', 'add', source_]);
        const gitSource = !existsSync(source_);
        if (row.installed && gitSource) await run(agent, ['plugin', 'marketplace', agent === 'codex' ? 'upgrade' : 'update', 'hapstack']);
        await run(agent, ['plugin', agent === 'codex' ? 'add' : 'install', 'hapstack@hapstack', ...(agent === 'claude-code' ? ['--scope', 'user'] : [])]);
        if (row.installed && agent === 'claude-code') await run(agent, ['plugin', 'update', 'hapstack@hapstack', '--scope', 'user']);
        const installed = (await nativeInventory(agent)).find(entry => !entry.scope || entry.scope === 'user');
        if (!installed?.version) fail(`${agent} did not report an installed Hapstack version.`);
        receipt.agents[agent] = { strategy, version: installed.version, source: source_, installedAt: new Date().toISOString() };
        save();
        show({ ...row, installed: installed.version, enabled: installed.enabled, state: compareVersions(installed.version, row.latest.version) === 0 ? 'current' : 'unknown', recorded: installed.version }, `${row.installed ? installed.version === row.installed ? 'unchanged' : 'updated' : 'installed'} ${row.installed && installed.version !== row.installed ? row.installed + ' → ' : ''}${installed.version}`);
        if (row.latest.version && compareVersions(installed.version, row.latest.version) < 0) fail(`${label(agent)} still reports ${installed.version}; ${row.latest.version} remains available. The actual installed version was recorded.`);
      });
      changed = true;
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
    receipt.agents[agent] = { strategy, version, source: row.source, installedAt: new Date().toISOString() };
    save();
    changed = true;
    ui.row(label(agent), `${row.installed ? 'updated' : 'installed'} ${version} · ${names.length} skill links`);
  }
  if (changed) { cleanupPackages(); save(); }
  if (changed) {
    ui.line('\n  Start a new session to load Hapstack.');
    ui.line('  Optional: run setup-hapstack to choose models and defaults.');
  }
}
async function uninstall() {
  for (const agent of selected) {
    const record = receipt.agents[agent];
    if (record?.strategy === 'native') await ui.task(`Removing ${label(agent)}…`, () => run(agent, ['plugin', agent === 'codex' ? 'remove' : 'uninstall', 'hapstack@hapstack']));
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
async function status() {
  const rows = await inspectSelected();
  if (json) {
    const providers = rows.map(({ agent, strategy, managed, recorded, installed, enabled, state: state_, error, source: source_, latest, links, instances }) => ({ agent, strategy, managed, recorded, installed, enabled, state: state_, error, source: verbose || !existsSync(source_) ? source_ : 'local', latest, links: links.map(entry => verbose ? entry : { owned: entry.owned }), instances: verbose ? instances : instances.map(({ version: value, scope, enabled: active }) => ({ version: value, scope, enabled: active })) }));
    console.log(JSON.stringify({ cli: version, providers, ...(verbose ? { receipt: receiptPath } : {}) }, null, 2));
  } else {
    rows.forEach(row => show(row));
    ui.detail(`Installation record: ${receiptPath}${existsSync(receiptPath) ? '' : ' (none)'}`);
    if (rows.some(row => row.state === 'update')) ui.line('\n  Run bunx github:hapwi/hapstack to choose updates.');
  }
  if (rows.some(row => row.error)) process.exitCode = 1;
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
if (command === 'install') await install();
else if (command === 'uninstall') await uninstall();
else if (command === 'migrate') migrate();
else await status();
}
main().catch(error => { ui.error(error); process.exitCode ||= 1; });
process.on('exit', () => ui.stop());
process.once('SIGINT', () => { ui.stop(); setImmediate(() => process.exit(130)); });

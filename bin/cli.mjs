#!/usr/bin/env bun
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createUI } from './ui.mjs';
import { compareVersions } from './version.mjs';
import { checkLatestVersion } from './source.mjs';

let ui = createUI();
async function main() {

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;
const legacyHashes = JSON.parse(readFileSync(join(packageRoot, 'bin', 'legacy-0.2.0.json'), 'utf8')).skills;
const names = readdirSync(join(packageRoot, 'skills')).filter(name => existsSync(join(packageRoot, 'skills', name, 'SKILL.md'))).sort();
const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';
function printHelp() {
  ui.header(version);
  ui.table('Usage', [['`bunx github:hapwi/hapstack` [command] [options]']]);
  ui.table('Commands', [
    ['install', 'Install native Codex and Claude Code plugins (default)'],
    ['status', 'Show installed versions and offer available updates'],
    ['uninstall', 'Remove Hapstack and restore replaced skills'],
    ['migrate', 'Move old copied skills out after a native install'],
    ['refresh-cli', 'Refresh an older cached short-command launcher'],
  ]);
  ui.table('Options', [
    ['--agent NAME', 'codex, claude-code, or cursor; repeat to select several'],
    ['--skills', 'Use one managed bundle with tracked skill links'],
    ['--project', 'Use tracked links in this project, not global plugins'],
    ['--backup-dir PATH', 'Private backup destination'],
    ['--legacy-backup PATH', 'Original backup from the old copy installer (migrate)'],
    ['--source SOURCE', 'Marketplace source (default hapwi/hapstack)'],
    ['--list', 'List bundled skills without changes'],
    ['--yes, -y', 'Approve updates without a prompt'],
    ['--verbose', 'Show host logs and diagnostic paths'],
    ['--json', 'Machine-readable status; never changes anything'],
    ['--help, -h', 'Show this help'],
  ]);
  ui.table('Notes', [
    ['Native installs need each provider\'s plugin-capable CLI.'],
    ['Use `--skills` for clients without native plugins.'],
    ['Uninstall keeps settings and backups.'],
  ]);
}
function fail(message) { throw new Error(message); }
function usage(message) { throw Object.assign(new Error(message), { hint: 'Run `bunx github:hapwi/hapstack --help` for usage.' }); }
let project = false, skills = false, list = false, yes = false, verbose = false, json = false, sourceExplicit = false, backupBase, legacyBackup;
let source = 'hapwi/hapstack';
const requested = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') { printHelp(); return; }
  if (arg === '--project') project = true;
  else if (arg === '--skills') skills = true;
  else if (arg === '--list') list = true;
  else if (arg === '--yes' || arg === '-y') yes = true;
  else if (arg === '--verbose') verbose = true;
  else if (arg === '--json') json = true;
  else if (['--agent', '--backup-dir', '--legacy-backup', '--source'].includes(arg)) {
    const value = args[++i];
    if (!value || value.startsWith('--')) usage(`${arg} requires a value.`);
    if (arg === '--agent') {
      if (!['codex', 'claude-code', 'cursor'].includes(value)) usage(`Unsupported agent: ${value}`);
      requested.push(value);
    } else if (arg === '--backup-dir') backupBase = resolve(value);
    else if (arg === '--legacy-backup') legacyBackup = resolve(value);
    else { source = value; sourceExplicit = true; }
  } else usage(`Unknown option: ${arg}`);
}
if (!['install', 'status', 'uninstall', 'migrate'].includes(command)) usage(`Unknown command: ${command}`);
if (json && command !== 'status') usage('--json is supported for status only.');
ui = createUI({ verbose, json });
if (list) { console.log(names.join('\n')); return; }
ui.header(version, command[0].toUpperCase() + command.slice(1));
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
  const check = checkLatestVersion(source_);
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
const states = {
  fresh: { tone: 'dim', text: 'Not installed' },
  missing: { tone: 'warn', text: 'Missing · recorded but not installed' },
  error: { tone: 'bad', text: 'Check failed' },
  unknown: { tone: 'warn', text: 'Update unknown' },
  update: { tone: 'update', text: row => `Out of date → ${row.latest.version}` },
  ahead: { tone: 'good', text: 'Newer than source' },
  current: { tone: 'good', text: 'Up to date' },
};
function show(row, outcome) {
  const view = outcome || states[row.state];
  let tone = view.tone;
  const parts = [typeof view.text === 'function' ? view.text(row) : view.text];
  if (row.enabled === false) { parts.push('disabled'); if (tone === 'good') tone = 'warn'; }
  if (!outcome && row.strategy === 'links' && row.installed) {
    const changed = row.links.filter(entry => !entry.owned).length;
    parts.push(`${row.links.length} skill links${changed ? `, ${changed} missing or changed` : ''}`);
    if (changed && tone === 'good') tone = 'warn';
  }
  ui[outcome ? 'outcome' : 'provider'](label(row.agent), row.installed, parts.join(' · '), tone);
  if (row.error) ui.sub(verbose ? row.error : row.error.split('\n')[0]);
  if (row.recorded && row.installed && row.recorded !== row.installed) ui.detail(`Record says ${row.recorded}; ${label(row.agent)} reports ${row.installed}.`);
  if (row.installed && !row.managed) ui.detail('Found on the host; not recorded by this installer.');
  ui.detail(`Source: ${row.source}`);
  if (!outcome) for (const entry of row.links) ui.detail(`${entry.path} [${entry.owned ? 'owned' : 'missing or changed'}]`);
}
async function inspectSelected(preflight) {
  const rows = await ui.task('Checking providers…', async () => {
    await preflight?.();
    return Promise.all(selected.map(inspect));
  });
  rows.forEach(row => show(row));
  for (const error of new Set(rows.map(row => row.latest.error).filter(Boolean))) ui.note(error[0].toUpperCase() + error.slice(1), 'warn');
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
    ui.note(`Backups saved to ${backupDirectory}`);
  }
  return join(backupDirectory, root, 'skills', name);
}
function restore(entry) {
  const path = linkPath(entry);
  if (owned(entry)) unlinkSync(path);
  else if (present(path)) { ui.note(`Preserved changed/unrelated path: ${path}`, 'warn'); return false; }
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
      else { ui.note(`Preserved edited package: ${pkg.path}`, 'warn'); continue; }
    }
    receipt.packages = receipt.packages.filter(candidate => candidate !== pkg);
  }
}
async function install({ inspected, approvedUpdates = false } = {}) {
  const agents = inspected ? inspected.map(row => row.agent) : selected;
  const strategyFor = agent => inspected?.find(row => row.agent === agent)?.strategy || (skills || project || agent === 'cursor' ? 'links' : 'native');
  const preflight = async () => {
    for (const agent of agents) {
      const strategy = strategyFor(agent);
      if (receipt.agents[agent] && receipt.agents[agent].strategy !== strategy) fail(`Uninstall ${agent}'s current Hapstack installation before changing its installation strategy.`);
      if (strategy === 'native' && !await nativeAvailable(agent)) fail(`${agent} needs a plugin-capable CLI. Use --skills for tracked skill links; no provider upgrade was attempted.`);
    }
  };
  if (inspected) await ui.task('Preparing update…', preflight);
  const rows = inspected || await inspectSelected(preflight);
  if (!inspected) {
    const newest = rows.map(row => row.latest.version).find(value => compareVersions(version, value) < 0);
    if (newest) ui.note(`This installer is ${version}; ${newest} is available. Fetch it with \`bunx github:hapwi/hapstack#main\`.`, 'update');
  }
  for (const row of rows) if (row.error) throw Object.assign(new Error(`${label(row.agent)} couldn't be checked. No changes were made.`), { hint: 'Run again with `--verbose` for host logs.' });
  const pending = rows.filter(row => row.installed && (row.state === 'update' || row.state === 'unknown' || row.strategy === 'links' && (compareVersions(row.installed, version) !== 0 || row.links.some(entry => !entry.owned))));
  const targets = [...new Set(pending.map(row => row.latest.version))];
  const question = `Update ${pending.map(row => label(row.agent)).join(' and ')}${targets.length === 1 && targets[0] ? ' to ' + targets[0] : ''}?`;
  const approved = !pending.length || approvedUpdates || yes || await ui.confirm(question);
  if (process.exitCode === 130) return;
  let bundle, changed = false, skipped = 0;
  for (const agent of agents) {
    const strategy = strategyFor(agent);
    const row = rows.find(item => item.agent === agent);
    if (row.installed && pending.includes(row) && !approved) { show(row, { tone: 'dim', text: 'Skipped' }); skipped++; continue; }
    if (row.installed && !pending.includes(row)) continue;
    if (strategy === 'links' && row.latest.version && compareVersions(version, row.latest.version) < 0) {
      show(row, { tone: 'warn', text: 'Skipped · needs the latest installer' }); skipped++; continue;
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
        const text = !row.installed ? 'Installed' : installed.version === row.installed ? 'Unchanged' : `Updated from ${row.installed}`;
        show({ ...row, installed: installed.version, enabled: installed.enabled, recorded: installed.version }, { tone: 'good', text });
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
    show({ ...row, installed: version }, { tone: 'good', text: `${row.installed ? `Updated from ${row.installed}` : 'Installed'} · ${names.length} skill links` });
  }
  if (changed) { cleanupPackages(); save(); }
  if (changed) ui.summary('Done. Start a new session to load Hapstack.', 'good', 'Optional: run `setup-hapstack` to choose models and defaults.');
  if (skipped) {
    ui.summary(`${skipped} provider${skipped === 1 ? '' : 's'} left unchanged.`, 'update', approved ? 'Run `bunx github:hapwi/hapstack#main` to get the latest installer.' : ui.canPrompt ? 'Run `bunx github:hapwi/hapstack` to update later.' : 'Updates need confirmation. Run again with `--yes` to update unattended.');
  } else if (!changed) ui.summary(rows.every(row => row.state === 'current') ? 'Everything is up to date.' : 'Nothing to update.', 'good');
}
async function uninstall() {
  let removed = 0;
  for (const agent of selected) {
    const record = receipt.agents[agent];
    if (record?.strategy === 'native') await ui.task(`Removing ${label(agent)}…`, () => run(agent, ['plugin', agent === 'codex' ? 'remove' : 'uninstall', 'hapstack@hapstack']));
    const root = directories[agent];
    for (const entry of [...receipt.links]) if (entry.root === root && restore(entry)) {
      receipt.links = receipt.links.filter(candidate => candidate !== entry); save();
    }
    if (!receipt.links.some(entry => entry.root === root)) delete receipt.agents[agent];
    save();
    if (!record) ui.outcome(label(agent), '', 'Not installed', 'dim');
    else if (receipt.agents[agent]) ui.outcome(label(agent), '', 'Partly removed · changed links kept', 'warn');
    else { ui.outcome(label(agent), '', 'Removed', 'good'); removed++; }
  }
  cleanupPackages(); save();
  if (selected.some(agent => receipt.agents[agent])) ui.summary('Some managed links were kept.', 'warn', 'Changed links were preserved. Review the paths above before removing them.');
  else if (removed) ui.summary('Hapstack removed.', 'good', 'Settings, backups, edited files, and marketplace registrations were kept.');
  else ui.summary('Nothing to remove.', 'dim');
}
async function status() {
  const rows = await inspectSelected();
  if (json) {
    const providers = rows.map(({ agent, strategy, managed, recorded, installed, enabled, state: state_, error, source: source_, latest, links, instances }) => ({ agent, strategy, managed, recorded, installed, enabled, state: state_, error, source: verbose || !existsSync(source_) ? source_ : 'local', latest, links: links.map(entry => verbose ? entry : { owned: entry.owned }), instances: verbose ? instances : instances.map(({ version: value, scope, enabled: active }) => ({ version: value, scope, enabled: active })) }));
    console.log(JSON.stringify({ cli: version, providers, ...(verbose ? { receipt: receiptPath } : {}) }, null, 2));
  } else {
    ui.detail(`Installation record: ${receiptPath}${existsSync(receiptPath) ? '' : ' (none)'}`);
    const outdated = rows.filter(row => row.state === 'update').length;
    const olderCLI = rows.some(row => compareVersions(version, row.latest.version) < 0);
    if (outdated || olderCLI) {
      ui.summary(outdated ? `${outdated} provider${outdated === 1 ? '' : 's'} out of date.` : 'This CLI is out of date.', 'update');
      if (outdated && (yes || ui.interactive && await ui.confirm('Update now?'))) {
        await install({ inspected: rows.filter(row => row.state === 'update'), approvedUpdates: true });
      } else if (process.exitCode !== 130) ui.hint(`Run \`bunx github:hapwi/hapstack\` to update${outdated && ui.interactive ? ' later' : ''}.`);
    } else if (rows.some(row => row.error || row.latest.error)) ui.summary('Some checks could not be completed.', 'warn', 'Try again, or add `--verbose` for details.');
    else if (rows.some(row => !row.installed)) ui.summary('Hapstack is not installed for every provider.', 'dim', 'Run `bunx github:hapwi/hapstack` to install.');
    else ui.summary(rows.some(row => row.state === 'ahead') ? 'Installed versions are newer than the source.' : 'Everything is up to date.', 'good');
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
    if (lstatSync(path).isSymbolicLink()) { ui.note(`Preserved untracked symlink: ${path}`, 'warn'); continue; }
    const previous = receipt.migrations?.find(entry => entry.root === root && entry.name === name);
    if (previous) continue;
    if (!matches(path, name)) { ui.note(`Preserved changed/unrelated skill: ${path}`, 'warn'); continue; }
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
  ui.summary(`Migrated ${candidates.length} exact-matching copied skill${candidates.length === 1 ? '' : 's'}.`, 'good', 'Originals were restored where available; changed skills and backups were kept.');
}
if (command === 'install') await install();
else if (command === 'uninstall') await uninstall();
else if (command === 'migrate') migrate();
else await status();
}
main().catch(error => { ui.error(error); process.exitCode ||= 1; });
process.on('exit', () => ui.finish());
process.once('SIGINT', () => { ui.stop(); setImmediate(() => process.exit(130)); });

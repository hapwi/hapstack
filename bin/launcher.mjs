import { spawn } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { compareVersions } from './version.mjs';

const repository = 'github:hapwi/hapstack';
const bun = process.versions.bun ? process.execPath : 'bun';
const warn = message => process.stderr.write(`  ! ${message}\n`);

export async function runBun(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bun, args, { stdio: 'inherit', ...options });
    const interrupt = () => child.kill('SIGINT');
    process.once('SIGINT', interrupt);
    child.once('error', error => { process.off('SIGINT', interrupt); reject(error); });
    child.once('close', (code, signal) => {
      process.off('SIGINT', interrupt);
      resolve(signal === 'SIGINT' ? 130 : code ?? 1);
    });
  });
}

export async function launch({ version, args, env = process.env, fetch_ = fetch, run = runBun, report = warn }) {
  if (env.HAPSTACK_CLI_EXPECTED_VERSION) {
    if (env.HAPSTACK_CLI_EXPECTED_VERSION !== version || !/^[a-f0-9]{40}$/.test(env.HAPSTACK_CLI_COMMIT || '')) {
      throw new Error('The downloaded CLI does not match the requested release. No plugin changes were made.');
    }
    return { kind: 'local', sha: env.HAPSTACK_CLI_COMMIT };
  }

  let sha, latest;
  try {
    const signal = AbortSignal.timeout(5000);
    const head = await fetch_('https://api.github.com/repos/hapwi/hapstack/commits/main', { signal, headers: { Accept: 'application/vnd.github+json' } });
    if (!head.ok) throw new Error(`GitHub returned HTTP ${head.status}`);
    sha = (await head.json()).sha;
    if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('GitHub returned an invalid commit');
    const manifest = await fetch_(`https://raw.githubusercontent.com/hapwi/hapstack/${sha}/package.json`, { signal });
    if (!manifest.ok) throw new Error(`CLI manifest returned HTTP ${manifest.status}`);
    const metadata = await manifest.json();
    if (metadata.name !== 'hapstack' || compareVersions(metadata.version, metadata.version) !== 0) throw new Error('The source has no valid Hapstack CLI version');
    latest = metadata.version;
  } catch (error) {
    report(`CLI update check unavailable. Using cached ${version}. ${error.message}`);
    return { kind: 'unavailable' };
  }
  if (compareVersions(latest, version) <= 0) return { kind: 'local', sha };

  report(`Loading Hapstack CLI ${latest}…`);
  const code = await run(['x', '--silent', `${repository}#${sha}`, ...args], {
    env: { ...env, HAPSTACK_CLI_EXPECTED_VERSION: latest, HAPSTACK_CLI_COMMIT: sha },
    stdio: 'inherit',
  });
  return { kind: 'forwarded', code };
}

export async function refreshShortCommand({ sha, directory = process.env.BUN_TMPDIR || tmpdir(), uid = process.getuid?.(), run = runBun, report = warn }) {
  if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('A verified source commit is required to refresh the launcher.');
  if (uid === undefined) throw new Error('Targeted Bun cache refresh is unavailable on this platform. Use a commit-pinned command until Bun refreshes its cache.');
  let refreshed = 0;
  for (const name of readdirSync(directory)) {
    if (!name.startsWith(`bunx-${uid}-hapstack@`)) continue;
    const root = join(directory, name);
    const info = lstatSync(root);
    if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== uid) continue;
    const file = join(root, 'package.json');
    if (!existsSync(file)) continue;
    const fileInfo = lstatSync(file);
    if (!fileInfo.isFile() || fileInfo.isSymbolicLink() || fileInfo.uid !== uid) continue;
    let metadata;
    try { metadata = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    const dependencies = metadata.dependencies || {};
    if (Object.keys(dependencies).length !== 1 || dependencies.hapstack !== repository) continue;
    if (['devDependencies', 'optionalDependencies', 'peerDependencies', 'workspaces'].some(key => metadata[key] && Object.keys(metadata[key]).length)) continue;
    const modules = join(root, 'node_modules');
    if (existsSync(modules) && (!lstatSync(modules).isDirectory() || lstatSync(modules).isSymbolicLink())) continue;
    report('Refreshing the Hapstack short-command cache…');
    const code = await run(['add', `hapstack@${repository}#${sha}`, '--force', '--no-cache', '--silent', '--ignore-scripts'], { cwd: root, stdio: 'inherit' });
    if (code !== 0) throw new Error(`Bun could not refresh the Hapstack CLI cache (exit ${code}).`);
    refreshed++;
  }
  report(refreshed ? 'Short command refreshed. Use bunx github:hapwi/hapstack normally.' : 'No legacy Hapstack short-command cache needs refreshing.');
  return refreshed;
}

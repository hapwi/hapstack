import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareVersions } from './version.mjs';

export async function checkLatestVersion(source, { fetch_ = fetch } = {}) {
  try {
    let manifest;
    if (existsSync(source)) manifest = JSON.parse(readFileSync(join(source, 'plugin.json'), 'utf8'));
    else {
      const github = /^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:#([^\s]+))?\/?$/.exec(source);
      if (!github) return { version: null, error: 'update check is unavailable for this source' };
      const signal = AbortSignal.timeout(5000);
      const repository = `${github[1]}/${github[2]}`;
      let commit = github[3];
      if (!/^[a-f0-9]{40}$/.test(commit || '')) {
        const response = await fetch_(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(commit || 'HEAD')}`, { signal, headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
        commit = (await response.json()).sha;
        if (!/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('source returned an invalid commit');
      }
      const response = await fetch_(`https://raw.githubusercontent.com/${repository}/${commit}/plugin.json`, { signal });
      if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
      manifest = await response.json();
    }
    if (manifest.name !== 'hapstack' || compareVersions(manifest.version, manifest.version) !== 0) throw new Error('source has no valid Hapstack version');
    return { version: manifest.version, error: null };
  } catch (error) { return { version: null, error: `couldn't check updates: ${error.message}` }; }
}

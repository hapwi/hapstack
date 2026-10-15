#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { launch, refreshShortCommand } from './launcher.mjs';
import { createUI } from './ui.mjs';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const args = process.argv.slice(2);
try {
  const result = await launch({ version, args });
  if (result.kind === 'forwarded') process.exitCode = result.code;
  else if (args[0] === 'refresh-cli') {
    if (result.kind === 'unavailable') throw new Error('The CLI source is unavailable. Try refresh-cli again when online.');
    await refreshShortCommand({ sha: result.sha });
  } else await import('./cli.mjs');
} catch (error) {
  const ui = createUI();
  ui.error(error); ui.finish();
  process.exitCode = 1;
}

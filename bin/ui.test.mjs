import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUI } from './ui.mjs';

function stream(isTTY) {
  return { isTTY, text: '', write(value) { this.text += value; } };
}

test('progress animates during async work and restores the cursor on failure', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, env: { TERM: 'xterm' } });
  ui.header('0.4.2', { status: true });
  await assert.rejects(ui.task('Checking updates…', async () => {
    await new Promise(resolve => setTimeout(resolve, 260));
    assert.match(progress.text, /Hapstack/);
    assert.match(progress.text, /Checking/);
    assert(new Set(progress.text.match(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g)).size > 1);
    throw new Error('fixture failure');
  }), /fixture failure/);
  assert(progress.text.endsWith('\x1b[?25h'));
  assert.match(output.text, /Installation status/);
});

test('redirected output and NO_COLOR rows contain no color escapes', async () => {
  for (const [isTTY, env] of [[false, {}], [true, { NO_COLOR: '', FORCE_COLOR: '1' }]]) {
    const output = stream(isTTY), progress = stream(false);
    const ui = createUI({ output, progress, env });
    ui.header('0.3.2'); ui.row('Codex', 'up to date');
    await ui.task('Checking…', async () => {});
    assert.doesNotMatch(output.text + progress.text, /\x1b\[/);
  }
});

test('noninteractive confirmation declines without reading stdin', async () => {
  const output = stream(false), progress = stream(false);
  const ui = createUI({ output, progress, input: { isTTY: false }, env: {} });
  assert.equal(await ui.confirm('Update Codex?'), false);
  assert.match(output.text, /--yes/);
});

test('JSON reporting emits no human text or spinner frames', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, json: true, env: {} });
  ui.header('0.3.2', { status: true }); ui.row('Codex', 'up to date');
  ui.statusTable(['0.4.2']);
  ui.statusRow('Codex', { version: '0.3.2', enabled: true, message: 'Out of date', tone: 'update' });
  ui.summary('Updates available', 'update');
  await ui.task('Checking…', async () => {});
  assert.equal(output.text + progress.text, '');
});

test('narrow status output keeps provider, version, state, and update information', async () => {
  const output = stream(false), progress = stream(false);
  output.columns = 48;
  const ui = createUI({ output, progress, env: { TERM: 'dumb' } });
  ui.header('0.4.2', { status: true });
  await ui.task('Checking…', async () => {});
  ui.statusTable(['0.4.2']);
  ui.statusRow('Claude Code', { version: '0.4.1', enabled: false, message: 'Out of date → 0.4.2', tone: 'update' });
  assert.match(output.text, /Claude Code\s+0\.4\.1\n\s+Disabled · Out of date/);
  assert.doesNotMatch(output.text + progress.text, /\x1b\[/);
  assert(output.text.split('\n').every(line => line.length <= output.columns));
});

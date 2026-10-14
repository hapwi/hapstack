import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUI } from './ui.mjs';

function stream(isTTY) {
  return { isTTY, text: '', write(value) { this.text += value; } };
}

test('progress animates during async work and restores the cursor on failure', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, env: { TERM: 'xterm' } });
  await assert.rejects(ui.task('Checking updates…', async () => {
    await new Promise(resolve => setTimeout(resolve, 260));
    assert.match(progress.text, /Checking updates/);
    assert(new Set(progress.text.match(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g)).size > 1);
    throw new Error('fixture failure');
  }), /fixture failure/);
  assert(progress.text.endsWith('\x1b[?25h'));
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
  ui.header('0.3.2'); ui.row('Codex', 'up to date');
  await ui.task('Checking…', async () => {});
  assert.equal(output.text + progress.text, '');
});

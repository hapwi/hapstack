import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUI } from './ui.mjs';

function stream(isTTY) {
  return { isTTY, text: '', write(value) { this.text += value; } };
}
const plain = text => text.replace(/\x1b\[[\d;?]*[A-Za-z]/g, '');

test('the first check spins beside the brand, then settles into the header and restores the cursor on failure', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, env: { TERM: 'xterm' } });
  ui.header('0.4.2', 'Status');
  await assert.rejects(ui.task('Checking providers…', async () => {
    await new Promise(resolve => setTimeout(resolve, 260));
    assert.match(plain(progress.text), /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏] Hapstack 0\.4\.2 · Status {2}Checking providers…/);
    assert(new Set(progress.text.match(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g)).size > 1);
    throw new Error('fixture failure');
  }), /fixture failure/);
  assert(progress.text.endsWith('\r\x1b[2K\x1b[?25h'));
  assert.equal(plain(output.text), '  ◆ Hapstack 0.4.2 · Status\n');
  const frames = progress.text.length;
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.equal(progress.text.length, frames, 'no frames after completion');
});

test('provider rows align, color by tone, and replace their spinner', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, env: { TERM: 'xterm' } });
  ui.header('0.4.3', 'Install');
  await ui.task('Updating Codex…', async () => ui.provider('Codex', '0.4.3', 'Updated from 0.3.1', 'good'));
  ui.provider('Claude Code', '0.3.1', 'Out of date → 0.4.3', 'update');
  ui.summary('Done.', 'good', 'Run `setup-hapstack` next.');
  ui.finish();
  assert.equal(plain(output.text), [
    '  ◆ Hapstack 0.4.3 · Install', '',
    '  ✓ Codex        0.4.3    Updated from 0.3.1',
    '  ↑ Claude Code  0.3.1    Out of date → 0.4.3', '',
    '  ✓ Done.', '    Run setup-hapstack next.', '', '',
  ].join('\n'));
  assert.match(output.text, /\x1b\[33mOut of date/);
  assert.match(output.text, /\x1b\[36msetup-hapstack/);
});

test('redirected output and TERM=dumb have no escapes or frames; NO_COLOR has no colors', async () => {
  for (const [isTTY, env] of [[false, {}], [true, { NO_COLOR: '', FORCE_COLOR: '1' }], [true, { TERM: 'dumb' }]]) {
    const output = stream(isTTY), progress = stream(isTTY);
    const ui = createUI({ output, progress, env });
    ui.header('0.3.2', 'Status');
    await ui.task('Checking…', async () => {});
    ui.provider('Codex', '0.3.2', 'Up to date', 'good');
    ui.error(Object.assign(new Error('Unknown option: --nope'), { hint: 'Run `bunx github:hapwi/hapstack --help` for usage.' }));
    assert.doesNotMatch(output.text + progress.text, env.NO_COLOR === undefined ? /\x1b\[|⠋/ : /\x1b\[\d+m/);
    assert.match(progress.text, /✗ Unknown option: --nope\n {4}Run bunx github:hapwi\/hapstack --help for usage\./);
  }
});

test('noninteractive confirmation declines without reading stdin or printing', async () => {
  const output = stream(false), progress = stream(false);
  const ui = createUI({ output, progress, input: { isTTY: false }, env: {} });
  assert.equal(ui.canPrompt, false);
  assert.equal(await ui.confirm('Update Codex?'), false);
  assert.equal(output.text + progress.text, '');
});

test('JSON reporting emits no human text or spinner frames', async () => {
  const output = stream(true), progress = stream(true);
  const ui = createUI({ output, progress, json: true, env: {} });
  ui.header('0.3.2', 'Status');
  ui.provider('Codex', '0.3.2', 'Out of date', 'update');
  ui.note('note'); ui.summary('Updates available', 'update', 'hint');
  await ui.task('Checking…', async () => {});
  ui.finish();
  assert.equal(output.text + progress.text, '');
});

test('narrow terminals move the message under the provider', () => {
  const output = stream(false), progress = stream(false);
  output.columns = 36;
  const ui = createUI({ output, progress, env: {} });
  ui.provider('Claude Code', '0.4.1', 'Out of date → 0.4.2 · disabled', 'update');
  assert.equal(output.text, '\n  ↑ Claude Code  0.4.1\n    Out of date → 0.4.2 · disabled\n');
  assert(output.text.split('\n').every(line => line.length <= output.columns));
});

test('narrow checking spinners stay on one terminal line', async () => {
  const output = stream(true), progress = stream(true);
  output.columns = progress.columns = 34;
  const ui = createUI({ output, progress, env: { TERM: 'xterm' } });
  ui.header('0.4.3', 'Status');
  await ui.task('Checking providers…', async () => new Promise(resolve => setTimeout(resolve, 100)));
  const lines = plain(progress.text).split('\r').filter(line => /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.test(line));
  assert(lines.length >= 2);
  assert(lines.every(line => line.length < progress.columns));
  assert(lines.every(line => line.includes('Hapstack')));
});

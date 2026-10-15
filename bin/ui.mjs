import { createInterface } from 'node:readline';

const colors = { brand: 36, good: 32, warn: 33, bad: 31, dim: 2, bold: 1, update: 33 };
const icons = { good: '✓', warn: '!', bad: '✗', dim: '·', update: '↑' };

export function createUI({ verbose = false, json = false, output = process.stdout, progress = process.stderr, input = process.stdin, env = process.env } = {}) {
  const color = stream => env.NO_COLOR === undefined && env.TERM !== 'dumb' && (stream.isTTY || Boolean(env.FORCE_COLOR && env.FORCE_COLOR !== '0'));
  const paint = (value, tone, stream = output) => color(stream) ? `\x1b[${colors[tone] || 33}m${value}\x1b[0m` : value;
  const line = text => { if (!json) output.write(text + '\n'); };
  let timer, statusVersion, pendingHeader = false;
  const wide = () => (output.columns || 80) >= 76;
  const statusHeader = () => {
    pendingHeader = false;
    line(`\n  ${paint('◆', 'brand')} ${paint('Hapstack', 'bold')}  ${paint('v' + statusVersion, 'dim')}`);
    line(`    ${paint('Installation status', 'dim')}\n`);
  };
  const stop = () => {
    if (timer) {
      clearInterval(timer); timer = undefined;
      progress.write('\r\x1b[2K\x1b[?25h');
    }
    if (pendingHeader) statusHeader();
  };
  return {
    line, stop,
    get interactive() { return !json && Boolean(input.isTTY && output.isTTY && progress.isTTY); },
    header(version, { status = false } = {}) {
      if (status) { statusVersion = version; pendingHeader = !json; }
      else line(`\n${paint('◆ Hapstack', 'brand')} ${paint(version, 'dim')}\n`);
    },
    statusTable(versions) {
      stop();
      line(`    ${paint('Latest release', 'dim')}  ${paint(versions.join(', ') || 'Unknown', versions.length ? 'brand' : 'warn')}\n`);
      if (wide()) line(paint(`    ${'Provider'.padEnd(15)}${'Version'.padEnd(12)}${'State'.padEnd(11)}Updates`, 'dim'));
      line(paint('  ' + '─'.repeat(Math.max(16, Math.min(72, (output.columns || 80) - 4))), 'dim'));
    },
    statusRow(label, { version, enabled, message, tone }) {
      stop();
      const state = enabled === true ? 'Enabled' : enabled === false ? 'Disabled' : '—';
      const lead = `  ${paint(icons[tone] || icons.warn, tone)} ${paint(label.padEnd(13), 'bold')}`;
      if (wide()) line(`${lead}  ${paint((version || '—').padEnd(10), 'bold')}  ${paint(state.padEnd(9), enabled === false ? 'warn' : 'dim')}  ${paint(message, tone)}`);
      else {
        line(`${lead} ${paint(version || '—', 'bold')}`);
        line(`    ${paint(state, enabled === false ? 'warn' : 'dim')} · ${paint(message, tone)}`);
      }
    },
    summary(text, tone = 'good') { line(`\n  ${paint(icons[tone] || icons.warn, tone)} ${paint(text, tone)}`); },
    row(label, text, tone = 'good') { stop(); line(`  ${paint(icons[tone] || icons.warn, tone)} ${label.padEnd(13)} ${text}`); },
    detail(text) { if (verbose) line(`  ${paint(text, 'dim')}`); },
    async task(label, action) {
      const animate = output.isTTY && progress.isTTY && env.TERM !== 'dumb' && !verbose && !json;
      if (animate) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frame = 0;
        progress.write('\x1b[?25l');
        const heading = pendingHeader;
        if (heading) output.write('\n');
        const draw = () => {
          const text = heading ? `${paint('Hapstack', 'bold', progress)}  ${paint('v' + statusVersion, 'dim', progress)}  ${paint('Checking…', 'dim', progress)}` : label;
          progress.write(`\r\x1b[2K  ${paint(frames[frame++ % frames.length], 'brand', progress)} ${text}`);
        };
        draw(); timer = setInterval(draw, 80);
      } else if (!json) { stop(); if (verbose || !statusVersion) line(`  ${paint('·', 'dim')} ${label}`); }
      try { return await action(); } finally { stop(); }
    },
    async confirm(question) {
      stop();
      if (!input.isTTY || !progress.isTTY) {
        line('\n  Updates were skipped. Run again with --yes to update unattended.');
        return false;
      }
      const rl = createInterface({ input, output: progress });
      return new Promise(resolve => {
        rl.once('SIGINT', () => { process.exitCode = 130; rl.close(); });
        rl.once('close', () => resolve(false));
        rl.question(`\n${paint('?', 'warn', progress)} ${question} [y/N] `, answer => {
          resolve(/^y(?:es)?$/i.test(answer.trim())); rl.close();
        });
      });
    },
    error(error) {
      stop();
      const message = error instanceof Error ? error.message : String(error);
      progress.write(`\n  ${paint('✗', 'bad', progress)} ${message}\n`);
    },
  };
}

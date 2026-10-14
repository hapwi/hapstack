import { createInterface } from 'node:readline';

const colors = { brand: 32, good: 32, warn: 33, bad: 31, dim: 2 };
const icons = { good: '✓', warn: '!', bad: '✗', dim: '·', update: '↑' };

export function createUI({ verbose = false, json = false, output = process.stdout, progress = process.stderr, input = process.stdin, env = process.env } = {}) {
  const color = stream => env.NO_COLOR === undefined && env.TERM !== 'dumb' && (stream.isTTY || Boolean(env.FORCE_COLOR && env.FORCE_COLOR !== '0'));
  const paint = (value, tone, stream = output) => color(stream) ? `\x1b[${colors[tone] || 33}m${value}\x1b[0m` : value;
  const line = text => { if (!json) output.write(text + '\n'); };
  let timer;
  const stop = () => {
    if (!timer) return;
    clearInterval(timer); timer = undefined;
    progress.write('\r\x1b[2K\x1b[?25h');
  };
  return {
    line, stop,
    header(version) { line(`\n${paint('◆ Hapstack', 'brand')} ${paint(version, 'dim')}\n`); },
    row(label, text, tone = 'good') { stop(); line(`  ${paint(icons[tone] || icons.warn, tone)} ${label.padEnd(13)} ${text}`); },
    detail(text) { if (verbose) line(`  ${paint(text, 'dim')}`); },
    async task(label, action) {
      const animate = progress.isTTY && env.TERM !== 'dumb' && !verbose && !json;
      if (animate) {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let frame = 0;
        progress.write('\x1b[?25l');
        const draw = () => progress.write(`\r\x1b[2K  ${paint(frames[frame++ % frames.length], 'brand', progress)} ${label}`);
        draw(); timer = setInterval(draw, 80);
      } else if (!json) line(`  ${paint('·', 'dim')} ${label}`);
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

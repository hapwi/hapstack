import { createInterface } from 'node:readline';

const tones = { brand: [36, '◆'], good: [32, '✓'], update: [33, '↑'], warn: [33, '!'], bad: [31, '✗'], dim: [2, '·'], bold: [1] };
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const visible = text => text.replace(/\x1b\[[\d;?]*[A-Za-z]/g, '').length;

// Output is a sequence of blocks (header, inspected rows, outcomes, summary, error, help sections) separated by one blank line.
export function createUI({ verbose = false, json = false, output = process.stdout, progress = process.stderr, input = process.stdin, env = process.env } = {}) {
  const colorful = stream => env.NO_COLOR === undefined && env.TERM !== 'dumb' && (stream.isTTY || Boolean(env.FORCE_COLOR && env.FORCE_COLOR !== '0'));
  const paint = (text, tone, stream = output) => tone && text && colorful(stream) ? `\x1b[${tones[tone][0]}m${text}\x1b[0m` : text;
  const icon = (tone, stream) => paint(tones[tone][1], tone, stream);
  const code = (text, tone, stream) => text.split('`').map((part, i) => paint(part, i % 2 ? 'brand' : tone, stream)).join('');
  const animated = !json && !verbose && env.TERM !== 'dumb' && Boolean(output.isTTY && progress.isTTY);
  const canPrompt = !json && Boolean(input.isTTY && progress.isTTY);
  let title, spinner, last, lastStream = output;
  const attached = () => last && last !== 'header' ? last : 'rows';

  const heading = stream => `${paint('Hapstack', 'bold', stream)} ${paint(title.version, 'dim', stream)}${title.command ? ` ${paint('·', 'dim', stream)} ${title.command}` : ''}`;
  const stop = () => {
    if (!spinner) return;
    clearInterval(spinner); spinner = undefined;
    progress.write('\r\x1b[2K\x1b[?25h');
  };
  const gap = (kind, stream) => {
    if (last !== kind) stream.write('\n');
    last = kind; lastStream = stream;
  };
  const flush = () => {
    if (!title) return;
    if (title.opened) { last = 'header'; lastStream = output; } else gap('header', output);
    output.write(`  ${icon('brand')} ${heading(output)}\n`);
    title = undefined;
  };
  const emit = (kind, text, stream = output) => {
    if (json) return;
    stop(); flush(); gap(kind, stream);
    stream.write(text + '\n');
  };
  const row = (label, version, message, tone, kind = 'rows') => {
    const lead = `  ${icon(tone)} ${paint(label, 'bold')}${' '.repeat(Math.max(1, 13 - label.length))}`;
    const body = paint(message, ['good', 'dim'].includes(tone) ? 'dim' : tone);
    const columns = output.columns || 80;
    const wide = visible(`${lead}${(version || '').padEnd(8)} ${message}`) <= columns;
    if (wide) return emit(kind, `${lead}${(version || '').padEnd(8)} ${body}`);
    emit(kind, `${lead}${version || ''}`.trimEnd());
    emit(kind, `    ${body}`);
  };

  return {
    stop,
    get interactive() { return canPrompt && Boolean(output.isTTY); },
    canPrompt,
    header(version, command) { if (!json) title = { version, command }; },
    provider: row,
    outcome(label, version, message, tone) { row(label, version, message, tone, 'outcomes'); },
    note(text, tone = 'dim') { emit(attached(), `  ${icon(tone)} ${code(text, tone === 'dim' ? 'dim' : undefined)}`); },
    sub(text) { emit(attached(), `    ${paint(text, 'dim')}`); },
    detail(text) { if (verbose) this.sub(text); },
    summary(text, tone = 'good', ...hints) {
      emit('summary', `  ${icon(tone)} ${paint(text, 'bold')}`);
      for (const hint of hints) this.hint(hint);
    },
    hint(text) { emit('summary', `    ${code(text, 'dim')}`); },
    table(heading_, rows) {
      emit(heading_, `  ${paint(heading_, 'bold')}`);
      const width = Math.max(...rows.map(([name, text]) => text === undefined ? 0 : name.length));
      for (const [name, text] of rows) emit(heading_, text === undefined ? `    ${code(name)}` : `    ${paint(name.padEnd(width), 'brand')}  ${text}`);
    },
    async task(label, action) {
      if (json) return action();
      const onHeader = Boolean(title);
      if (!animated) {
        if (verbose) emit('outcomes', `  ${icon('dim')} ${label}`);
        else flush();
        try { return await action(); } finally { flush(); }
      }
      stop();
      if (onHeader) { gap('header', progress); title.opened = true; } else { flush(); gap('outcomes', progress); }
      let frame = 0;
      const draw = () => {
        const width = Math.max(1, (progress.columns || output.columns || 80) - 5);
        let text = onHeader ? `${heading(progress)}  ${paint(label, 'dim', progress)}` : label;
        if (visible(text) > width && onHeader) text = heading(progress);
        if (visible(text) > width) {
          const plain = onHeader ? 'Hapstack' : label;
          text = paint(plain.length <= width ? plain : plain.slice(0, width - 1) + '…', onHeader ? 'bold' : 'dim', progress);
        }
        progress.write(`\r\x1b[2K  ${paint(frames[frame++ % frames.length], 'brand', progress)} ${text}`);
      };
      progress.write('\x1b[?25l'); draw();
      spinner = setInterval(draw, 80);
      try { return await action(); } finally { stop(); if (onHeader) flush(); }
    },
    async confirm(question) {
      stop(); flush();
      if (!canPrompt) return false;
      gap('summary', progress);
      const rl = createInterface({ input, output: progress });
      return new Promise(resolve => {
        rl.once('SIGINT', () => { process.exitCode = 130; progress.write('\n'); rl.close(); });
        rl.once('close', () => resolve(false));
        rl.question(`  ${paint('?', 'brand', progress)} ${question} ${paint('[y/N]', 'dim', progress)} `, answer => {
          resolve(/^y(?:es)?$/i.test(answer.trim())); rl.close();
        });
      });
    },
    error(error) {
      stop(); flush();
      const [message, ...rest] = (error instanceof Error ? error.message : String(error)).split('\n');
      gap('error', progress);
      progress.write(`  ${icon('bad', progress)} ${paint(message, 'bold', progress)}\n`);
      for (const text of rest) progress.write(`    ${paint(text.trim(), 'dim', progress)}\n`);
      if (error?.hint) progress.write(`    ${code(error.hint, 'dim', progress)}\n`);
    },
    finish() {
      stop();
      if (last) { lastStream.write('\n'); last = undefined; }
    },
  };
}

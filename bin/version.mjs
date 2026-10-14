export function compareVersions(a, b) {
  const parse = value => /^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+[\w.-]+)?$/.exec(value || '');
  const left = parse(a), right = parse(b);
  if (!left || !right) return undefined;
  for (let i = 1; i <= 3; i++) if (+left[i] !== +right[i]) return Math.sign(+left[i] - +right[i]);
  if (left[4] === right[4]) return 0;
  if (!left[4] || !right[4]) return left[4] ? -1 : 1;
  const l = left[4].split('.'), r = right[4].split('.');
  for (let i = 0; i < Math.max(l.length, r.length); i++) {
    if (l[i] === r[i]) continue;
    if (l[i] === undefined || r[i] === undefined) return l[i] === undefined ? -1 : 1;
    const ln = /^\d+$/.test(l[i]), rn = /^\d+$/.test(r[i]);
    if (ln && rn) return Math.sign(+l[i] - +r[i]);
    if (ln !== rn) return ln ? -1 : 1;
    return l[i] < r[i] ? -1 : 1;
  }
  return 0;
}

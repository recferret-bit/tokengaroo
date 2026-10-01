// Spinifex grass tuft: nine curved blades fanning up from one point. Static.

import { between, f } from '../../lib/canvas.mjs';

export function spinifex(ctx, x, y, k) {
  let d = '';
  for (let i = 0; i < 9; i++) {
    const a = ((-160 + i * 17.5 + between(-5, 5)) * Math.PI) / 180, len = (18 + between(0, 16)) * k;
    d += `M${f(x)},${f(y)} q${f(Math.cos(a) * len * 0.5)},${f(Math.sin(a) * len * 0.75)} ${f(Math.cos(a) * len)},${f(Math.sin(a) * len)} `;
  }
  return `<path d="${d}" ${ctx.s.line(ctx.p.spinifex, f(2.5 * k))}/>`;
}

// n tufts scattered along a ground band's surface between x0 and x1.
export function spinifexField(ctx, band, n, k, x0, x1) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = between(x0, x1);
    out += spinifex(ctx, x, band.yAt(x) + 6 * ctx.k, k);
  }
  return out;
}

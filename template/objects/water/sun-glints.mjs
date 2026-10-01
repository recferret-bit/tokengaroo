// Shimmering column of sun reflections on water, under the sun at x.

import { HORIZON, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function sunGlints(ctx, x) {
  const { s, p } = ctx;
  useCss(ctx, 'glints', `
  @keyframes shimmer { 0%,100% { opacity: .9 } 50% { opacity: .25 } }
  .glint { animation: shimmer 3s ease-in-out infinite }`);
  let out = '';
  for (let i = 0; i < 6; i++) {
    const y = HORIZON + 14 + i * 16, w = 110 - i * 14;
    out += `<rect class="glint" style="animation-delay:${f(-i * 0.5)}s" x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="5" rx="2.5" ${s.paint(p.sun, { accent: true })}/>`;
  }
  return out;
}

// Distant birds: two-arc "m" strokes gliding across the sky.

import { W, HORIZON, between, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function birds(ctx, n) {
  const { s, p } = ctx;
  useCss(ctx, 'birds', `
  @keyframes fly { from { transform: translateX(-120px) } to { transform: translateX(${W + 120}px) } }
  .bird { animation: fly 45s linear infinite }`);
  let out = '';
  for (let i = 0; i < n; i++) {
    const y = between(HORIZON * 0.22, HORIZON * 0.52), k = between(0.6, 1.1);
    // transform attribute = rest pose for reduced motion, spread across the width
    out += `<g class="bird" transform="translate(${f(W * (0.1 + (0.8 * i) / Math.max(1, n - 1)))} 0)" style="animation-delay:${f(-i * 9 - between(0, 6))}s"><path transform="translate(0 ${f(y)}) scale(${f(k)})" d="M0,0 q9,-9 18,0 q9,-9 18,0" ${s.line(p.ink, 2.5)}/></g>`;
  }
  return out;
}

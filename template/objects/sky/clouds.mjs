// Pill-shaped clouds drifting left to right across the upper sky, staggered so they never bunch up.

import { W, HORIZON, between, f } from '../../lib/canvas.mjs';
import { useCss } from '../../lib/css.mjs';

export function clouds(ctx, n) {
  const { s, p } = ctx;
  useCss(ctx, 'clouds', `
  @keyframes cloud { from { transform: translateX(-400px) } to { transform: translateX(${W + 100}px) } }
  .cloud { animation: cloud 120s linear infinite }`);
  let out = '';
  for (let i = 0; i < n; i++) {
    const y = between(HORIZON * 0.15, HORIZON * 0.5), w = between(160, 320), h = between(22, 34);
    // transform attribute = rest pose for reduced motion; the running animation overrides it
    out += `
    <g class="cloud" transform="translate(${f(Math.min((W * (i + 0.2)) / n, W - w - 20))} 0)" style="animation-delay:${f(-i * (120 / n) - between(0, 20))}s">
      <rect x="0" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" ${s.paint(p.cloud)}/>
      <rect x="${f(w * 0.25)}" y="${f(y - h * 0.7)}" width="${f(w * 0.45)}" height="${f(h)}" rx="${f(h / 2)}" ${s.paint(p.cloud)}/>
    </g>`;
  }
  return out;
}

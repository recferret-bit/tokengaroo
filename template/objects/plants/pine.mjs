// Huangshan-style pine: crooked trunk with flat foliage pads at the ends of short branches.
// Each branch sways from where it leaves the trunk. Base at (x, baseY), h tall; lean > 0 leans right.

import { between, f } from '../../lib/canvas.mjs';
import { useSway } from './sway.mjs';

export function pine(ctx, x, baseY, h, lean, k) {
  const { s, p } = ctx;
  useSway(ctx);
  const tx = x + lean, ty = baseY - h;
  let branches = '';
  [[0.5, -1], [0.68, 1], [0.84, -1], [1, 0.4]].forEach(([t, side], i) => {
    const bx = x + lean * t, by = baseY - h * t;
    const px = bx + side * between(50, 80) * k, py = by - between(6, 16) * k, rw = between(55, 80) * k * (1.1 - t * 0.4);
    branches += `<g class="crown" style="transform-origin:${f(bx)}px ${f(by)}px;animation-delay:${f(-i * 1.2)}s">`
      + `<path d="M${f(bx)},${f(by)} Q${f((bx + px) / 2)},${f(by - 14 * k)} ${f(px)},${f(py)}" ${s.line(p.trunk, f(6 * k))}/>`
      + `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(rw)}" ry="${f(15 * k)}" ${s.paint(p.pineDark)}/>`
      + `<ellipse cx="${f(px + 6 * k)}" cy="${f(py - 7 * k)}" rx="${f(rw * 0.8)}" ry="${f(11 * k)}" ${s.paint(p.pine)}/></g>`;
  });
  return `<g data-rests="ground"><path d="M${f(x)},${f(baseY)} Q${f(x - lean * 0.3)},${f(baseY - h * 0.5)} ${f(tx)},${f(ty)}" ${s.line(p.trunk, f(12 * k))}/>${branches}</g>`;
}

// Cobbled street from y0 down to the bottom edge: rows of setts that grow toward the viewer, each
// row offset by half a stone. One fill plus one path of joints. No RNG.

import { W, H, HORIZON, f } from '../../lib/canvas.mjs';

export function cobbles(ctx, y0) {
  const { s, p } = ctx;
  let joints = '';
  for (let i = 0, y = y0; y < H; i++) {
    const h = 16 + (y - HORIZON) * 0.16, w = h * 2.8, r = Math.round;
    joints += `M-10,${r(y)}H${W + 10}`;
    for (let x = (i % 2) * w / 2; x < W; x += w) joints += `M${r(x)},${r(y + 2)}v${r(h - 4)}`;
    y += h;
  }
  return `<rect data-surface="ground" x="-10" y="${f(y0)}" width="${W + 20}" height="${f(H - y0 + 10)}" ${s.paint(p.cobble)}/>`
    + `<path d="${joints}" ${s.line(p.cobbleLine, 2)}/>`;
}

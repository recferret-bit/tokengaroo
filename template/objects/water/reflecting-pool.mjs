// Long reflecting pool seen from its near end: w0 wide at its far edge y0, widening to w1 at the
// bottom of the canvas. Stone rim, still water with drifting wave lines, and an optional
// reflection { x, w } of a tall landmark standing just beyond the far end.

import { H, between, f } from '../../lib/canvas.mjs';
import { useWaves } from './water.mjs';

export function reflectingPool(ctx, cx, y0, w0, w1, reflection) {
  const { s, p, k } = ctx;
  useWaves(ctx);
  const wAt = (y) => w0 + (w1 - w0) * ((y - y0) / (H - y0));
  const quad = (pad) => `M${f(cx - w0 / 2 - pad)},${f(y0 - pad)} L${f(cx + w0 / 2 + pad)},${f(y0 - pad)} L${f(cx + w1 / 2 + pad)},${H + 10} L${f(cx - w1 / 2 - pad)},${H + 10} Z`;
  let out = `<path data-surface="ground" d="${quad(8 * k)}" ${s.paint(p.poolRim)}/><path data-surface="water" d="${quad(0)}" fill="${s.water}"/><path d="${quad(0)}" ${s.line(p.poolRim, 2)}/>`;
  if (reflection) {
    const { x, w } = reflection;
    out += `<path d="M${f(x - w / 2)},${f(y0)} L${f(x + w / 2)},${f(y0)} L${f(x + w * 0.3)},${H} L${f(x - w * 0.3)},${H} Z" ${s.paint(p.marble)} opacity=".35"/>`;
  }
  for (let i = 0; i < 10; i++) {
    const t = (i + 0.5) / 10, y = y0 + 6 + t * t * (H - y0 - 10), w = wAt(y), len = w * between(0.12, 0.25);
    const x = cx - w / 2 + 34 + between(0, w - 68 - len);
    out += `<line class="wave" style="animation-duration:${f(between(4, 8))}s;animation-delay:${f(-between(0, 8))}s" x1="${f(x)}" y1="${f(y)}" x2="${f(x + len)}" y2="${f(y)}" ${s.line(p.waveLine, f(1.5 + t * 2))} opacity="${f(0.35 + t * 0.4)}"/>`;
  }
  return out;
}

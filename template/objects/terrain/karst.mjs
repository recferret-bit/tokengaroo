// Steep rounded rock dome sitting on the horizon: Phang Nga limestone karsts in Thailand,
// Kata Tjuta in Australia (wider than tall). The top leans a little at random.

import { W, HORIZON, between, random, f } from '../../lib/canvas.mjs';

export function karst(ctx, x, w, h, color) {
  const b = HORIZON + 4, l = x - w / 2, r = x + w / 2, top = b - h;
  const lean = (random() - 0.5) * w * 0.35;
  return `<path d="M${f(l)},${b} C${f(l + w * 0.06)},${f(top + h * 0.35)} ${f(x - w * 0.35 + lean)},${f(top)} ${f(x + lean)},${f(top)} C${f(x + w * 0.35 + lean)},${f(top)} ${f(r - w * 0.06)},${f(top + h * 0.35)} ${f(r)},${b} Z" ${ctx.s.paint(color)}/>`;
}

// count domes spread evenly (with jitter) between x0 and x1.
export function karstRange(ctx, count, hMin, hMax, wMin, wMax, color, x0 = 0, x1 = W) {
  let out = '';
  const step = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    out += karst(ctx, x0 + step * (i + 0.5) + between(-step * 0.3, step * 0.3), between(wMin, wMax), between(hMin, hMax), color);
  }
  return out;
}

// Low island on the horizon with one large and two small chedis, starting at x0, w wide.

import { HORIZON, f } from '../../lib/canvas.mjs';
import { chedi } from '../buildings/chedi.mjs';

export function templeIsland(ctx, x0, w, k) {
  const b = HORIZON + 4;
  return `<path d="M${f(x0)},${b} C${f(x0 + w * 0.14)},${f(HORIZON - 50 * k)} ${f(x0 + w * 0.8)},${f(HORIZON - 55 * k)} ${f(x0 + w)},${b} Z" ${ctx.s.paint(ctx.p.near)}/>`
    + chedi(ctx, x0 + w * 0.5, HORIZON - 38 * k, k)
    + chedi(ctx, x0 + w * 0.25, HORIZON - 26 * k, 0.55 * k)
    + chedi(ctx, x0 + w * 0.75, HORIZON - 28 * k, 0.6 * k);
}

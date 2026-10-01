// Obelisk (the Washington Monument): tapering shaft with a pyramidion, shaded on its right face.
// Base centre at (x, y), w wide at the base, h tall.

import { f } from '../../lib/canvas.mjs';

export function obelisk(ctx, x, y, w, h) {
  const { s, p } = ctx;
  const t = w * 0.36, ny = y - h * 0.93, top = y - h;
  return `<g data-rests="ground"><path d="M${f(x - w / 2)},${f(y)} L${f(x - t)},${f(ny)} L${f(x)},${f(top)} L${f(x + t)},${f(ny)} L${f(x + w / 2)},${f(y)} Z" ${s.paint(p.marble)}/>`
    + `<path d="M${f(x)},${f(top)} L${f(x + t)},${f(ny)} L${f(x + w / 2)},${f(y)} L${f(x)},${f(y)} Z" ${s.paint(p.marbleShade)}/></g>`;
}

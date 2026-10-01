// Kremlin wall: red brick wall with swallowtail merlons from x0 to x1, base at HORIZON + 4, h tall,
// with small square towers under green tent roofs at the x positions in towers.

import { HORIZON, f } from '../../lib/canvas.mjs';

export function kremlinWall(ctx, x0, x1, h, k, towers = []) {
  const { s, p } = ctx, b = HORIZON + 4, top = b - h;
  const mw = 14 * k, mh = 18 * k, step = 28 * k;
  let merlons = '';
  for (let x = x0; x < x1; x += step) merlons += `M${f(x)},${f(top + 1)} v${f(-mh)} l${f(mw / 2)},${f(mh * 0.4)} l${f(mw / 2)},${f(-mh * 0.4)} v${f(mh)} Z `;
  let out = `<rect x="${f(x0)}" y="${f(top)}" width="${f(x1 - x0)}" height="${f(h)}" ${s.paint(p.brick)}/>`
    + `<path d="${merlons}" ${s.paint(p.brick)}/>`
    + `<path d="M${f(x0)},${f(top + 12 * k)} H${f(x1)}" ${s.line(p.brickShade, f(3 * k))}/>`;
  for (const tx of towers) {
    const tw = 44 * k, tt = top - 60 * k;
    out += `<rect x="${f(tx - tw / 2)}" y="${f(tt)}" width="${f(tw)}" height="${f(b - tt)}" ${s.paint(p.brick)}/>`
      + `<path d="M${f(tx - tw / 2 - 4 * k)},${f(tt)} L${f(tx)},${f(tt - 50 * k)} L${f(tx + tw / 2 + 4 * k)},${f(tt)} Z" ${s.paint(p.roof)}/>`;
  }
  return `<g data-rests="ground">${out}</g>`;
}

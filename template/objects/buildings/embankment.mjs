// River embankments, so buildings stand on land and a river reads as one between two banks.
//   riverWall: the far bank's stone wall face, full width, from y down to the water at y + h.
//              Put it at HORIZON, after the water layer, under buildings based at HORIZON + 4.
//   promenade: the near bank seen from on it: parapet with lamps along the river side, then the road
//              (surface at y) and a pavement down to the bottom. Draw vehicles after it, wheels at y + 30k.

import { W, H, f } from '../../lib/canvas.mjs';

export function riverWall(ctx, y, h) {
  const { s, p, k } = ctx;
  return `<rect data-surface="ground" x="-10" y="${f(y)}" width="${W + 20}" height="${f(h)}" ${s.paint(p.bank)}/>`
    + `<rect data-surface="ground" x="-10" y="${f(y + h - 3 * k)}" width="${W + 20}" height="${f(3 * k)}" ${s.paint(p.bankShade)}/>`;
}

export function promenade(ctx, y, k) {
  const { s, p } = ctx, top = y - 14 * k;
  let posts = '', lamps = '';
  for (let x = W * 0.04; x < W; x += 220 * k) {
    posts += `M${f(x)},${f(top)} V${f(top - 40 * k)} `;
    lamps += `<circle cx="${f(x)}" cy="${f(top - 44 * k)}" r="${f(6 * k)}" ${s.paint(p.lamp, { accent: true })}/>`;
  }
  return `<path d="${posts}" ${s.line(p.parapetShade, f(3 * k))}/>${lamps}`
    + `<rect x="-10" y="${f(top)}" width="${W + 20}" height="${f(14 * k)}" ${s.paint(p.parapet)}/>`
    + `<rect data-surface="ground" x="-10" y="${f(y)}" width="${W + 20}" height="${f(H - y + 10)}" ${s.paint(p.road)}/>`
    + `<rect data-surface="ground" x="-10" y="${f(y + 36 * k)}" width="${W + 20}" height="${f(H - y - 36 * k + 10)}" ${s.paint(p.pavement)}/>`;
}

// The Great Wall riding a mountain ridge from x0 to x1: a crenellated wall following band.yAt(x),
// sunk into the ridge so it never floats, with square watchtowers at both ends and along the way.

import { f } from '../../lib/canvas.mjs';

export function greatWall(ctx, band, x0, x1, k) {
  const { s, p } = ctx, h = 16 * k, sink = 6 * k;
  const xs = [];
  for (let x = x0; x < x1; x += 16) xs.push(x);
  xs.push(x1);
  const top = xs.map((x) => `${f(x)},${f(band.yAt(x) - h)}`), bottom = xs.map((x) => `${f(x)},${f(band.yAt(x) + sink)}`).reverse();
  let cren = '', walk = '';
  for (let x = x0 + 4 * k; x < x1 - 6 * k; x += 14 * k) cren += `M${f(x)},${f(band.yAt(x) - h + 1)} v${f(-6 * k)} h${f(6 * k)} v${f(6 * k)} Z `;
  walk = `M${xs.map((x) => `${f(x)},${f(band.yAt(x) - h + 6 * k)}`).join(' L')}`;
  let towers = '';
  for (const t of [0, 0.26, 0.52, 0.77, 1]) {
    const tx = x0 + (x1 - x0) * t, tw = 34 * k, ys = [band.yAt(tx - tw / 2), band.yAt(tx), band.yAt(tx + tw / 2)];
    const ground = Math.max(...ys) + sink, tt = Math.min(...ys) - h - 26 * k, l = tx - tw / 2;
    towers += `<rect x="${f(l)}" y="${f(tt)}" width="${f(tw)}" height="${f(ground - tt)}" ${s.paint(p.wall)}/>`
      + `<path d="M${f(l)},${f(tt + 1)} v${f(-7 * k)} h${f(7 * k)} v${f(7 * k)} Z M${f(tx - 3.5 * k)},${f(tt + 1)} v${f(-7 * k)} h${f(7 * k)} v${f(7 * k)} Z M${f(l + tw - 7 * k)},${f(tt + 1)} v${f(-7 * k)} h${f(7 * k)} v${f(7 * k)} Z" ${s.paint(p.wall)}/>`
      + `<path d="M${f(tx - 5 * k)},${f(tt + 26 * k)} V${f(tt + 14 * k)} Q${f(tx)},${f(tt + 8 * k)} ${f(tx + 5 * k)},${f(tt + 14 * k)} V${f(tt + 26 * k)} Z" ${s.paint(p.wallShade)}/>`;
  }
  return `<g data-rests="ground"><path d="M${top.join(' L')} L${bottom.join(' L')} Z" ${s.paint(p.wall)}/>`
    + `<path d="${cren}" ${s.paint(p.wall)}/>`
    + `<path d="${walk}" ${s.line(p.wallShade, f(2 * k))}/>`
    + towers + '</g>';
}

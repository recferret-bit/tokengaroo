// Palace of Westminster from across the river: long gothic front with a pinnacled roofline,
// Victoria Tower at the left end and the slender Central Tower spire. From x0 to x1, base at HORIZON + 4.
// Run it past the foot of a tower placed in front, so overhangs (Big Ben's clock stage) have building under them.

import { HORIZON, f } from '../../lib/canvas.mjs';

export function westminsterPalace(ctx, x0, x1, k) {
  const { s, p } = ctx, b = HORIZON + 4, top = b - 110 * k, roofTop = top - 12 * k;
  const vw = 74 * k, vt = b - 270 * k, mid = (x0 + vw + x1) / 2;
  let pins = '', wins = '';
  for (let x = x0 + vw + 12 * k; x <= x1 - 8 * k; x += 34 * k) pins += `M${f(x - 4 * k)},${f(roofTop)} l${f(4 * k)},${f(-24 * k)} l${f(4 * k)},${f(24 * k)} Z `;
  for (let x = x0 + vw + 10 * k; x < x1 - 6 * k; x += 17 * k) wins += `M${f(x)},${f(top + 12 * k)} V${f(b - 14 * k)} `;
  return `<g data-rests="ground"><rect x="${f(x0)}" y="${f(top)}" width="${f(x1 - x0)}" height="${f(b - top)}" ${s.paint(p.stone)}/>`
    + `<rect x="${f(x0)}" y="${f(roofTop)}" width="${f(x1 - x0)}" height="${f(12 * k)}" ${s.paint(p.roof)}/>`
    + `<path d="${pins}" ${s.paint(p.stone)}/>`
    + `<path d="${wins}" ${s.line(p.stoneShade, f(2.5 * k))}/>`
    + `<rect x="${f(mid - 16 * k)}" y="${f(roofTop - 64 * k)}" width="${f(32 * k)}" height="${f(64 * k)}" ${s.paint(p.stone)}/>`
    + `<path d="M${f(mid - 18 * k)},${f(roofTop - 64 * k)} L${f(mid)},${f(roofTop - 130 * k)} L${f(mid + 18 * k)},${f(roofTop - 64 * k)} Z" ${s.paint(p.roof)}/>`
    + `<rect x="${f(x0)}" y="${f(vt)}" width="${f(vw)}" height="${f(b - vt)}" ${s.paint(p.stone)}/>`
    + `<path d="M${f(x0)},${f(vt)} l${f(5 * k)},${f(-28 * k)} l${f(5 * k)},${f(28 * k)} Z M${f(x0 + vw - 10 * k)},${f(vt)} l${f(5 * k)},${f(-28 * k)} l${f(5 * k)},${f(28 * k)} Z" ${s.paint(p.stone)}/>`
    + `<path d="M${f(x0 + 24 * k)},${f(vt + 20 * k)} V${f(b - 40 * k)} M${f(x0 + 50 * k)},${f(vt + 20 * k)} V${f(b - 40 * k)}" ${s.line(p.stoneShade, f(3 * k))}/>`
    + `<path d="M${f(x0 + vw / 2)},${f(vt)} V${f(vt - 40 * k)}" ${s.line(p.roof, f(2 * k))}/></g>`;
}

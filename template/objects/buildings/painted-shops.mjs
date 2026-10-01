// Row of narrow painted shopfronts, as in Temple Bar: each building a different colour and height,
// two floors of sash windows over a shop with a dark fascia, a lit window and a door. Every fifth
// shop is a little bookshop, its window full of books and BOOKS on the fascia. Shops are 150 wide at
// k = 1, from x0 until they pass x1, base at HORIZON + 4. `first` shifts colours, heights and which
// shop sells books. No RNG.

import { HORIZON, f } from '../../lib/canvas.mjs';
import { lettering } from '../street/lettering.mjs';

const box = (x, y, w, h) => `M${x},${y}h${w}v${h}h${-w}Z`;
const HEIGHTS = [356, 330, 384, 342, 368];
const SPINES = [[7, 24], [9, 30], [6, 20], [8, 28], [10, 25], [7, 22], [9, 27]];

export function paintedShops(ctx, x0, x1, k, first = 0) {
  const { s, p } = ctx;
  const paints = [p.paintA, p.paintB, p.paintC, p.paintD];
  const d = { walls: ['', '', '', ''], fronts: ['', '', '', ''], books: ['', '', '', '', ''], trim: '', glass: '', lit: '', bars: '', glow: '', dark: '', signs: '' };
  for (let i = 0; i < Math.ceil((x1 - x0) / (150 * k) - 1e-9); i++) {
    const n = i + first, o = i * 150, h = HEIGHTS[n % 5];
    d.walls[n % 4] += box(o, -h, 150, h);
    d.fronts[(n + 2) % 4] += box(o + 6, -114, 138, 114);
    d.trim += box(o - 2, -h, 154, 8);
    for (const [floor, wy, wh] of [[0, -304, 64], [1, -206, 76]]) {
      for (const wx of [o + 42, o + 108]) {
        if ((n * 2 + floor + wx / 66) % 4 < 1) d.lit += box(wx - 18, wy, 36, wh); else d.glass += box(wx - 18, wy, 36, wh);
        d.bars += `M${wx},${wy}v${wh}M${wx - 18},${f(wy + wh / 2)}h36`;
        d.trim += box(wx - 22, wy + wh, 44, 5);
      }
    }
    if (h > 370) d.glass += box(o + 57, -h + 18, 36, 26);
    d.dark += box(o + 12, -108, 126, 22) + box(o + 102, -78, 32, 78);
    d.glow += box(o + 18, -78, 76, 62);
    if (n % 5 === 3) {
      d.signs += `<path transform="translate(${o + 44.5} -103) scale(.55)" d="${lettering('BOOKS', 0, 0, 24)}" ${s.line(p.letter, 3)}/>`;
      for (const [base, x2] of [[-48, o + 92], [-18, o + 92]]) {
        for (let bx = o + 20, j = n + base; bx < x2;) {
          const [w, bh] = SPINES[((j % 7) + 7) % 7];
          if (bx + w > x2) break;
          d.books[((j % 5) + 5) % 5] += box(bx, base, w, -bh);
          bx += w + 1; j++;
        }
      }
    }
  }
  const path = (pd, attrs) => (pd ? `<path d="${pd}" ${attrs}/>` : '');
  return `
  <g data-rests="ground" transform="translate(${f(x0)} ${f(HORIZON + 4)}) scale(${f(k)})">
    ${d.walls.map((pd, i) => path(pd, s.paint(paints[i]))).join('')}
    ${path(d.trim, s.paint(p.trim))}${path(d.glass, s.paint(p.glass))}${path(d.lit, s.paint(p.glow, { accent: true }))}
    ${path(d.bars, s.line(p.trim, 3))}
    ${d.fronts.map((pd, i) => path(pd, s.paint(paints[i]))).join('')}
    ${path(d.dark, s.paint(p.pubDark))}${path(d.glow, s.paint(p.glow, { accent: true }))}
    ${d.books.map((pd, i) => path(pd, s.paint(p[`book${'ABCDE'[i]}`]))).join('')}
    ${d.signs}
  </g>`;
}
